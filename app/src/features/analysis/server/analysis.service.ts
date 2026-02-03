import { db } from "~/server/db";
import { KlaviyoAdapter, KlaviyoAdapterError } from "~/server/integrations/klaviyo/klaviyo-adapter";

import { AnalysisDomainError, AnalysisService as BaseAnalysisService } from "./analysis.logic.ts";
import { AnalysisRepository } from "./analysis.repository";

type SyncRole = "OWNER" | "STRATEGY" | "CONTENT" | "OPERATIONS";
type SyncTrigger = "MANUAL" | "DAILY";

type AnalysisServiceDependencies = {
  repository?: AnalysisRepository;
  adapter?: KlaviyoAdapter;
};

export class AnalysisService extends BaseAnalysisService {
  private readonly syncRepository: AnalysisRepository;
  private readonly syncAdapter: KlaviyoAdapter;

  constructor(dependencies: AnalysisServiceDependencies = {}) {
    const repository = dependencies.repository ?? new AnalysisRepository(db);
    super({ repository, adapter: dependencies.adapter });
    this.syncRepository = repository;
    this.syncAdapter = dependencies.adapter ?? new KlaviyoAdapter();
  }

  async getSyncStatus(
    userId: string,
    role: SyncRole,
    input: { clientId: string },
  ) {
    await this.assertAuditAccess(userId, role, input.clientId, false);
    const latest = await this.syncRepository.findLatestSyncRun(input.clientId);

    if (!latest) {
      return {
        data: {
          lastSyncAt: null,
          lastSyncStatus: "IN_PROGRESS",
          stale: true,
          counts: { accountCount: 0, flowCount: 0, emailCount: 0, formCount: 0 },
        },
      };
    }

    const referenceDate = latest.finishedAt ?? latest.startedAt;
    const ageHours = (Date.now() - referenceDate.getTime()) / (1000 * 60 * 60);
    const validatedRequestId =
      typeof latest.requestId === "string" && latest.requestId.trim().length > 0
        ? latest.requestId
        : null;

    return {
      data: {
        lastSyncAt: referenceDate,
        lastSyncStatus: latest.status,
        stale: ageHours > 24,
        counts: {
          accountCount: latest.accountCount,
          flowCount: latest.flowCount,
          emailCount: latest.emailCount,
          formCount: latest.formCount,
        },
        requestId: validatedRequestId ?? `sync-status-missing-request-id-${latest.id}`,
      },
    };
  }

  async runSync(
    actorId: string,
    role: SyncRole,
    payload: { clientId: string; trigger: SyncTrigger; requestId: string },
  ) {
    await this.assertAuditAccess(actorId, role, payload.clientId, true);
    return await this.performSync(payload.clientId, payload.trigger, payload.requestId, actorId);
  }

  async runDailySyncForAllClients(requestId: string) {
    const clients = await this.syncRepository.listClientIds();
    const results = await Promise.all(
      clients.map(async (client, index) => {
        const latest = await this.syncRepository.findLatestSyncRun(client.id);
        if (latest?.status === "IN_PROGRESS") {
          return {
            data: {
              status: "IN_PROGRESS",
              requestId: latest.requestId,
              clientId: client.id,
              trigger: "DAILY" as const,
              skipped: true,
            },
          };
        }

        return this.performSync(client.id, "DAILY", `${requestId}-${index + 1}`, null);
      }),
    );

    return {
      data: {
        status: "OK",
        requestId,
        totalClients: clients.length,
        results,
      },
    };
  }

  private async performSync(
    clientId: string,
    trigger: SyncTrigger,
    requestId: string,
    actorId: string | null,
  ) {
    const syncRun = await this.syncRepository.createSyncRun({
      clientId,
      trigger,
      status: "IN_PROGRESS",
      requestId,
    });

    const finishedAt = new Date();
    let inventory: Array<{ entityType: "ACCOUNT" | "FLOW" | "EMAIL" | "FORM"; externalId: string; name: string; itemStatus?: "OK" | "GAP" }> = [];
    let status: "OK" | "FAILED_AUTH" | "PARTIAL_OR_TIMEOUT" = "OK";
    let errorCode: string | undefined;
    let errorMessage: string | undefined;

    try {
      const [inventoryItems, segments] = await Promise.all([
        this.syncAdapter.fetchInventory(clientId),
        this.syncAdapter.fetchSegments(clientId),
      ]);

      inventory = [
        ...inventoryItems,
        ...segments.map((segment) => ({
          entityType: "EMAIL" as const,
          externalId: segment.externalId,
          name: segment.name,
          itemStatus: "OK" as const,
        })),
      ];
    } catch (error) {
      if (error instanceof KlaviyoAdapterError) {
        status = error.code === "failed_auth" ? "FAILED_AUTH" : "PARTIAL_OR_TIMEOUT";
        errorCode = error.code;
        errorMessage = error.message;
        inventory = error.partialInventory;
      } else {
        status = "PARTIAL_OR_TIMEOUT";
        errorCode = "partial_or_timeout";
        errorMessage = error instanceof Error ? error.message : "unknown_sync_error";
      }
    }

    const counts = {
      accountCount: inventory.filter((item) => item.entityType === "ACCOUNT").length,
      flowCount: inventory.filter((item) => item.entityType === "FLOW").length,
      emailCount: inventory.filter((item) => item.entityType === "EMAIL").length,
      formCount: inventory.filter((item) => item.entityType === "FORM").length,
    };

    await this.syncRepository.persistSyncRunWithInventory({
      runId: syncRun.id,
      clientId,
      status,
      finishedAt,
      ...counts,
      errorCode,
      errorMessage,
      inventory: inventory.map((item) => ({
        entityType: item.entityType,
        externalId: item.externalId,
        name: item.name,
        itemStatus: item.itemStatus ?? "OK",
        lastSyncAt: finishedAt,
      })),
    });

    await this.syncRepository.createAuditLog({
      actorId,
      eventName: "analysis.sync.completed",
      requestId,
      entityType: "CLIENT",
      entityId: clientId,
      details: { trigger, status, ...counts },
    });

    return {
      data: {
        status,
        requestId,
        clientId,
        trigger,
        counts,
        finishedAt,
      },
    };
  }

  private async assertAuditAccess(
    userId: string,
    role: SyncRole,
    clientId: string,
    requireEdit: boolean,
  ) {
    const membership = await this.syncRepository.findMembership(userId, clientId);
    if (!membership) {
      throw new AnalysisDomainError(
        "forbidden",
        "forbidden",
        { reason: "user_not_member_of_client" },
        "unknown",
      );
    }

    const policies = await this.syncRepository.listRbacPoliciesByRole(role);
    const auditPolicy = policies.find((policy) => policy.module === "AUDIT");
    const allowed = requireEdit ? auditPolicy?.canEdit : auditPolicy?.canView;

    if (!allowed) {
      throw new AnalysisDomainError(
        "forbidden",
        "rbac_module_view_forbidden",
        { module: "AUDIT", role },
        "unknown",
      );
    }
  }
}

export { AnalysisDomainError };

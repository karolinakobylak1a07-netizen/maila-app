import type { Prisma, PrismaClient } from "../../../../generated/prisma";
import type {
  KlaviyoEntityType,
  KlaviyoSyncStatus,
  SyncTrigger,
} from "../contracts/analysis.schema";

type Database = PrismaClient;

export type Role = "OWNER" | "STRATEGY" | "CONTENT" | "OPERATIONS";

export type SyncRunRecord = {
  id: string;
  clientId: string;
  trigger: SyncTrigger;
  status: KlaviyoSyncStatus;
  requestId: string;
  startedAt: Date;
  finishedAt: Date | null;
  accountCount: number;
  flowCount: number;
  emailCount: number;
  formCount: number;
  errorCode: string | null;
  errorMessage: string | null;
};

export type InventoryItemRecord = {
  entityType: KlaviyoEntityType;
  externalId: string;
  name: string;
  itemStatus: string;
  lastSyncAt: Date;
};

export type DiscoveryContextRecord = {
  goals: string[];
};

export type StrategicPriorityRecord = {
  id: string;
  content: string;
  createdAt: Date;
};

export type DiscoveryAnswersRecord = {
  goals: string[];
  segments: string[];
  seasonality: string | null;
  brandTone: string | null;
  primaryKpis: string[];
};

export type StrategyAuditRecord = {
  id: string;
  requestId: string;
  createdAt: Date;
  details: Prisma.JsonValue | null;
};

export class AnalysisRepository {
  private readonly database: Database;
  private static readonly strategyLocks = new Map<string, Promise<void>>();
  private static readonly contentLocks = new Map<string, Promise<void>>();

  constructor(database: Database) {
    this.database = database;
  }

  findMembership(userId: string, clientId: string) {
    return this.database.clientMembership.findUnique({
      where: {
        clientId_userId: {
          clientId,
          userId,
        },
      },
      select: {
        id: true,
      },
    });
  }

  listRbacPoliciesByRole(role: Role) {
    return this.database.rbacPolicy.findMany({
      where: { role },
      orderBy: { module: "asc" },
      select: {
        module: true,
        canView: true,
        canEdit: true,
        canManage: true,
      },
    });
  }

  createSyncRun(payload: {
    clientId: string;
    trigger: SyncTrigger;
    status: KlaviyoSyncStatus;
    requestId: string;
  }) {
    return this.database.klaviyoSyncRun.create({
      data: {
        clientId: payload.clientId,
        trigger: payload.trigger,
        status: payload.status,
        requestId: payload.requestId,
      },
    });
  }

  updateSyncRun(payload: {
    runId: string;
    status: KlaviyoSyncStatus;
    finishedAt: Date;
    accountCount: number;
    flowCount: number;
    emailCount: number;
    formCount: number;
    errorCode?: string;
    errorMessage?: string;
  }) {
    return this.database.klaviyoSyncRun.update({
      where: { id: payload.runId },
      data: {
        status: payload.status,
        finishedAt: payload.finishedAt,
        accountCount: payload.accountCount,
        flowCount: payload.flowCount,
        emailCount: payload.emailCount,
        formCount: payload.formCount,
        errorCode: payload.errorCode,
        errorMessage: payload.errorMessage,
      },
    });
  }

  async persistSyncRunWithInventory(payload: {
    runId: string;
    clientId: string;
    status: KlaviyoSyncStatus;
    finishedAt: Date;
    accountCount: number;
    flowCount: number;
    emailCount: number;
    formCount: number;
    errorCode?: string;
    errorMessage?: string;
    inventory: InventoryItemRecord[];
  }) {
    await this.database.$transaction(async (tx) => {
      if (payload.inventory.length > 0) {
        await Promise.all(
          payload.inventory.map((item) =>
            tx.klaviyoInventoryItem.upsert({
              where: {
                clientId_entityType_externalId: {
                  clientId: payload.clientId,
                  entityType: item.entityType,
                  externalId: item.externalId,
                },
              },
              create: {
                clientId: payload.clientId,
                entityType: item.entityType,
                externalId: item.externalId,
                name: item.name,
                itemStatus: item.itemStatus,
                lastSyncAt: payload.finishedAt,
              },
              update: {
                name: item.name,
                itemStatus: item.itemStatus,
                lastSyncAt: payload.finishedAt,
              },
            }),
          ),
        );
      }

      await tx.klaviyoSyncRun.update({
        where: { id: payload.runId },
        data: {
          status: payload.status,
          finishedAt: payload.finishedAt,
          accountCount: payload.accountCount,
          flowCount: payload.flowCount,
          emailCount: payload.emailCount,
          formCount: payload.formCount,
          errorCode: payload.errorCode,
          errorMessage: payload.errorMessage,
        },
      });
    });
  }

  async upsertInventoryItems(
    clientId: string,
    syncedAt: Date,
    items: InventoryItemRecord[],
  ) {
    if (items.length === 0) {
      return;
    }

    await this.database.$transaction(
      items.map((item) =>
        this.database.klaviyoInventoryItem.upsert({
          where: {
            clientId_entityType_externalId: {
              clientId,
              entityType: item.entityType,
              externalId: item.externalId,
            },
          },
          create: {
            clientId,
            entityType: item.entityType,
            externalId: item.externalId,
            name: item.name,
            itemStatus: item.itemStatus,
            lastSyncAt: syncedAt,
          },
          update: {
            name: item.name,
            itemStatus: item.itemStatus,
            lastSyncAt: syncedAt,
          },
        }),
      ),
    );
  }

  findLatestSyncRun(clientId: string) {
    return this.database.klaviyoSyncRun.findFirst({
      where: { clientId },
      orderBy: { startedAt: "desc" },
    });
  }

  listInventory(clientId: string) {
    return this.database.klaviyoInventoryItem.findMany({
      where: { clientId },
      orderBy: [{ entityType: "asc" }, { externalId: "asc" }],
      select: {
        entityType: true,
        externalId: true,
        name: true,
        itemStatus: true,
        lastSyncAt: true,
      },
    });
  }

  async findDiscoveryContext(clientId: string): Promise<DiscoveryContextRecord | null> {
    const record = await this.database.discoveryOnboarding.findUnique({
      where: { clientId },
      include: {
        answers: {
          where: { questionKey: "goals" },
          select: { answerText: true },
          take: 1,
        },
      },
    });

    if (!record) {
      return null;
    }

    const goalsAnswer = record.answers[0]?.answerText ?? "";
    const goals = goalsAnswer
      .split(/\r?\n|[,;]+/)
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);

    return { goals };
  }

  listLatestStrategicPriorities(clientId: string, limit = 5): Promise<StrategicPriorityRecord[]> {
    return this.database.strategicDecision.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        content: true,
        createdAt: true,
      },
    });
  }

  async findDiscoveryAnswers(clientId: string): Promise<DiscoveryAnswersRecord | null> {
    const record = await this.database.discoveryOnboarding.findUnique({
      where: { clientId },
      include: {
        answers: {
          where: {
            questionKey: {
              in: ["goals", "segments", "seasonality", "brandTone", "primaryKpis"],
            },
          },
          select: {
            questionKey: true,
            answerText: true,
          },
        },
      },
    });

    if (!record) {
      return null;
    }

    const resolve = (key: string) =>
      record.answers.find((answer) => answer.questionKey === key)?.answerText ?? "";
    const toList = (raw: string) =>
      raw
        .split(/\r?\n|[,;]+/)
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

    return {
      goals: toList(resolve("goals")),
      segments: toList(resolve("segments")),
      seasonality: resolve("seasonality").trim() || null,
      brandTone: resolve("brandTone").trim() || null,
      primaryKpis: toList(resolve("primaryKpis")),
    };
  }

  listLatestEmailStrategyAudit(clientId: string, limit = 10): Promise<StrategyAuditRecord[]> {
    return this.database.auditLog.findMany({
      where: {
        eventName: "strategy.email.generated",
        entityType: "CLIENT",
        entityId: clientId,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        requestId: true,
        createdAt: true,
        details: true,
      },
    });
  }

  listLatestFlowPlanAudit(clientId: string, limit = 10): Promise<StrategyAuditRecord[]> {
    return this.database.auditLog.findMany({
      where: {
        eventName: "strategy.flow_plan.generated",
        entityType: "CLIENT",
        entityId: clientId,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        requestId: true,
        createdAt: true,
        details: true,
      },
    });
  }

  listLatestCampaignCalendarAudit(clientId: string, limit = 10): Promise<StrategyAuditRecord[]> {
    return this.database.auditLog.findMany({
      where: {
        eventName: "strategy.campaign_calendar.generated",
        entityType: "CLIENT",
        entityId: clientId,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        requestId: true,
        createdAt: true,
        details: true,
      },
    });
  }

  listLatestSegmentProposalAudit(clientId: string, limit = 10): Promise<StrategyAuditRecord[]> {
    return this.database.auditLog.findMany({
      where: {
        eventName: "strategy.segment_proposal.generated",
        entityType: "CLIENT",
        entityId: clientId,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        requestId: true,
        createdAt: true,
        details: true,
      },
    });
  }

  listLatestCommunicationBriefAudit(clientId: string, limit = 10): Promise<StrategyAuditRecord[]> {
    return this.database.auditLog.findMany({
      where: {
        eventName: "content.communication_brief.generated",
        entityType: "CLIENT",
        entityId: clientId,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        requestId: true,
        createdAt: true,
        details: true,
      },
    });
  }

  listLatestEmailDraftAudit(clientId: string, limit = 10): Promise<StrategyAuditRecord[]> {
    return this.database.auditLog.findMany({
      where: {
        eventName: "content.email_draft.generated",
        entityType: "CLIENT",
        entityId: clientId,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        requestId: true,
        createdAt: true,
        details: true,
      },
    });
  }

  listLatestPersonalizedEmailDraftAudit(clientId: string, limit = 10): Promise<StrategyAuditRecord[]> {
    return this.database.auditLog.findMany({
      where: {
        eventName: "content.email_draft.personalized",
        entityType: "CLIENT",
        entityId: clientId,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        requestId: true,
        createdAt: true,
        details: true,
      },
    });
  }

  listLatestImplementationChecklistAudit(
    clientId: string,
    limit = 20,
  ): Promise<StrategyAuditRecord[]> {
    return this.database.auditLog.findMany({
      where: {
        eventName: {
          in: [
            "implementation.checklist.generated",
            "implementation.checklist.step_updated",
          ],
        },
        entityType: "CLIENT",
        entityId: clientId,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        requestId: true,
        createdAt: true,
        details: true,
      },
    });
  }

  listClientIds() {
    return this.database.clientProfile.findMany({
      where: { status: "ACTIVE" },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });
  }

  createAuditLog(payload: {
    actorId: string | null;
    eventName: string;
    requestId: string;
    entityType?: string;
    entityId?: string;
    details?: Record<string, unknown>;
  }) {
    return this.database.auditLog.create({
      data: {
        actorId: payload.actorId,
        eventName: payload.eventName,
        requestId: payload.requestId,
        entityType: payload.entityType,
        entityId: payload.entityId,
        details: payload.details as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async withStrategyGenerationLock<T>(
    clientId: string,
    handler: () => Promise<T>,
  ): Promise<T> {
    const key = `strategy:${clientId}`;
    const previous = AnalysisRepository.strategyLocks.get(key) ?? Promise.resolve();
    let release: () => void = () => undefined;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    const lockChain = previous.then(() => current);
    AnalysisRepository.strategyLocks.set(key, lockChain);

    await previous;
    try {
      return await this.database.$transaction(async () => handler());
    } finally {
      release();
      if (AnalysisRepository.strategyLocks.get(key) === lockChain) {
        AnalysisRepository.strategyLocks.delete(key);
      }
    }
  }

  async withContentGenerationLock<T>(
    lockKey: string,
    handler: () => Promise<T>,
  ): Promise<T> {
    const key = `content:${lockKey}`;
    const previous = AnalysisRepository.contentLocks.get(key) ?? Promise.resolve();
    let release: () => void = () => undefined;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    const lockChain = previous.then(() => current);
    AnalysisRepository.contentLocks.set(key, lockChain);

    await previous;
    try {
      // TODO(4.4): replace with tx-scoped repository calls for real row-level SELECT FOR UPDATE semantics.
      return await this.database.$transaction(async () => handler());
    } finally {
      release();
      if (AnalysisRepository.contentLocks.get(key) === lockChain) {
        AnalysisRepository.contentLocks.delete(key);
      }
    }
  }
}

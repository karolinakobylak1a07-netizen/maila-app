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

export class AnalysisRepository {
  private readonly database: Database;

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
}

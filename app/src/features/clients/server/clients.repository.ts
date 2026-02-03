import type {
  RbacModule,
  DiscoveryQuestionKey,
} from "../contracts/clients.schema";
import type { Role } from "./clients.logic";
import type { Prisma, PrismaClient } from "../../../../generated/prisma";

type Database = PrismaClient;
type ClientStatus = "ACTIVE" | "ARCHIVED";

type ClientProfileRecord = {
  id: string;
  name: string;
  status: ClientStatus;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type MembershipWithClient = {
  clientId: string;
  canEdit: boolean;
  client: {
    id: string;
    name: string;
    status: ClientStatus;
    archivedAt: Date | null;
  };
};

type ContextSummary = {
  clientId: string;
};

type ContextWithClient = {
  clientId: string;
  lastViewPath: string | null;
  client: {
    id: string;
    name: string;
    status: ClientStatus;
  };
};

type MembershipSummary = {
  id: string;
  canEdit: boolean;
};

type StrategicDecisionRecord = {
  id: string;
  clientId: string;
  authorId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string | null;
    email: string | null;
  };
};

type DiscoveryOnboardingRecord = {
  id: string;
  clientId: string;
  answerCount: number;
  isGoalsComplete: boolean;
  isSegmentsComplete: boolean;
  isSeasonalityComplete: boolean;
  isOfferComplete: boolean;
  isComplete: boolean;
  completedAt: Date | null;
  updatedAt: Date;
  answers: Array<{
    questionKey: DiscoveryQuestionKey;
    answerText: string;
  }>;
};

type RbacPolicyRecord = {
  id: string;
  role: Role;
  module: RbacModule;
  canView: boolean;
  canEdit: boolean;
  canManage: boolean;
  updatedAt: Date;
};

const mapDiscoveryOnboardingRecord = (
  record: {
    id: string;
    clientId: string;
    answerCount: number;
    isGoalsComplete: boolean;
    isSegmentsComplete: boolean;
    isSeasonalityComplete: boolean;
    isOfferComplete: boolean;
    isComplete: boolean;
    completedAt: Date | null;
    updatedAt: Date;
    answers: Array<{ questionKey: string; answerText: string }>;
  } | null,
): DiscoveryOnboardingRecord | null => {
  if (!record) {
    return null;
  }

  return {
    id: record.id,
    clientId: record.clientId,
    answerCount: record.answerCount,
    isGoalsComplete: record.isGoalsComplete,
    isSegmentsComplete: record.isSegmentsComplete,
    isSeasonalityComplete: record.isSeasonalityComplete,
    isOfferComplete: record.isOfferComplete,
    isComplete: record.isComplete,
    completedAt: record.completedAt,
    updatedAt: record.updatedAt,
    answers: record.answers.map((answer) => ({
      questionKey: answer.questionKey as DiscoveryQuestionKey,
      answerText: answer.answerText,
    })),
  };
};

export class ClientsRepository {
  private readonly database: Database;

  constructor(database: Database) {
    this.database = database;
  }

  findActiveContext(userId: string): Promise<ContextSummary | null> {
    return this.database.clientUserContext.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: { clientId: true },
    });
  }

  listMemberships(userId: string): Promise<MembershipWithClient[]> {
    return this.database.clientMembership.findMany({
      where: { userId },
      include: { client: true },
      orderBy: { createdAt: "asc" },
    });
  }

  createProfileWithOwner(
    userId: string,
    payload: { name: string },
  ): Promise<ClientProfileRecord> {
    return this.database.$transaction(async (tx: Prisma.TransactionClient) => {
      const created = await tx.clientProfile.create({
        data: {
          name: payload.name,
          status: "ACTIVE",
        },
      });

      await tx.clientMembership.create({
        data: {
          clientId: created.id,
          userId,
          canEdit: true,
        },
      });

      return created;
    });
  }

  updateProfile(payload: {
    clientId: string;
    name: string;
  }): Promise<ClientProfileRecord> {
    return this.database.$transaction(async (tx: Prisma.TransactionClient) => {
      return tx.clientProfile.update({
        where: { id: payload.clientId },
        data: { name: payload.name },
      });
    });
  }

  archiveProfile(payload: { clientId: string }): Promise<ClientProfileRecord> {
    return this.database.clientProfile.update({
      where: { id: payload.clientId },
      data: {
        status: "ARCHIVED",
        archivedAt: new Date(),
      },
    });
  }

  switchActiveContext(
    userId: string,
    payload: { clientId: string; lastViewPath?: string },
  ): Promise<{ clientId: string; lastViewPath: string | null } | null> {
    return this.database.$transaction(async (tx: Prisma.TransactionClient) => {
      const current = await tx.clientUserContext.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      });

      if (current && payload.lastViewPath) {
        await tx.clientUserContext.update({
          where: { id: current.id },
          data: { lastViewPath: payload.lastViewPath },
        });
      }

      await tx.clientUserContext.upsert({
        where: {
          userId_clientId: {
            userId,
            clientId: payload.clientId,
          },
        },
        create: {
          userId,
          clientId: payload.clientId,
        },
        update: {},
      });

      return tx.clientUserContext.findUnique({
        where: {
          userId_clientId: {
            userId,
            clientId: payload.clientId,
          },
        },
      });
    });
  }

  rememberLastView(
    userId: string,
    payload: { clientId: string; lastViewPath: string },
  ): Promise<void> {
    return this.database.clientUserContext
      .upsert({
        where: {
          userId_clientId: {
            userId,
            clientId: payload.clientId,
          },
        },
        create: {
          userId,
          clientId: payload.clientId,
          lastViewPath: payload.lastViewPath,
        },
        update: {
          lastViewPath: payload.lastViewPath,
        },
      })
      .then(() => undefined);
  }

  findContextWithClient(userId: string): Promise<ContextWithClient | null> {
    return this.database.clientUserContext.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });
  }

  findMembership(
    userId: string,
    clientId: string,
  ): Promise<MembershipSummary | null> {
    return this.database.clientMembership.findUnique({
      where: {
        clientId_userId: {
          clientId,
          userId,
        },
      },
      select: {
        id: true,
        canEdit: true,
      },
    });
  }

  listStrategicDecisions(
    userId: string,
    clientId: string,
  ): Promise<StrategicDecisionRecord[]> {
    return this.database.strategicDecision.findMany({
      where: {
        clientId,
        client: {
          memberships: {
            some: {
              userId,
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  createStrategicDecision(payload: {
    clientId: string;
    authorId: string;
    content: string;
  }): Promise<StrategicDecisionRecord> {
    return this.database.$transaction(async (tx: Prisma.TransactionClient) => {
      return tx.strategicDecision.create({
        data: {
          clientId: payload.clientId,
          authorId: payload.authorId,
          content: payload.content,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });
  }

  async findDiscoveryOnboarding(
    userId: string,
    clientId: string,
  ): Promise<DiscoveryOnboardingRecord | null> {
    const record = await this.database.discoveryOnboarding.findFirst({
      where: {
        clientId,
        client: {
          memberships: {
            some: {
              userId,
            },
          },
        },
      },
      include: {
        answers: {
          select: {
            questionKey: true,
            answerText: true,
          },
          orderBy: { questionKey: "asc" },
        },
      },
    });

    return mapDiscoveryOnboardingRecord(record);
  }

  async saveDiscoveryOnboardingDraft(payload: {
    clientId: string;
    updatedById: string;
    answers: Record<DiscoveryQuestionKey, string>;
    answerCount: number;
    isGoalsComplete: boolean;
    isSegmentsComplete: boolean;
    isSeasonalityComplete: boolean;
    isOfferComplete: boolean;
    isComplete: boolean;
    completedAt: Date | null;
  }): Promise<DiscoveryOnboardingRecord> {
    const persisted = await this.database.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const onboarding = await tx.discoveryOnboarding.upsert({
          where: {
            clientId: payload.clientId,
          },
          create: {
            clientId: payload.clientId,
            updatedById: payload.updatedById,
            answerCount: payload.answerCount,
            isGoalsComplete: payload.isGoalsComplete,
            isSegmentsComplete: payload.isSegmentsComplete,
            isSeasonalityComplete: payload.isSeasonalityComplete,
            isOfferComplete: payload.isOfferComplete,
            isComplete: payload.isComplete,
            completedAt: payload.completedAt,
          },
          update: {
            updatedById: payload.updatedById,
            answerCount: payload.answerCount,
            isGoalsComplete: payload.isGoalsComplete,
            isSegmentsComplete: payload.isSegmentsComplete,
            isSeasonalityComplete: payload.isSeasonalityComplete,
            isOfferComplete: payload.isOfferComplete,
            isComplete: payload.isComplete,
            completedAt: payload.completedAt,
          },
        });

        const answersToSave = Object.entries(payload.answers)
          .filter(([, value]) => value.trim().length > 0)
          .map(([questionKey, answerText]) => ({
            questionKey: questionKey as DiscoveryQuestionKey,
            answerText,
          }));

        await tx.discoveryAnswer.deleteMany({
          where: {
            discoveryId: onboarding.id,
          },
        });

        if (answersToSave.length > 0) {
          await tx.discoveryAnswer.createMany({
            data: answersToSave.map((answer) => ({
              discoveryId: onboarding.id,
              authorId: payload.updatedById,
              questionKey: answer.questionKey,
              answerText: answer.answerText,
            })),
          });
        }

        return tx.discoveryOnboarding.findUnique({
          where: {
            id: onboarding.id,
          },
          include: {
            answers: {
              select: {
                questionKey: true,
                answerText: true,
              },
              orderBy: { questionKey: "asc" },
            },
          },
        });
      },
    );

    return mapDiscoveryOnboardingRecord(persisted)!;
  }

  async markDiscoveryOnboardingComplete(payload: {
    clientId: string;
    updatedById: string;
  }): Promise<DiscoveryOnboardingRecord> {
    const completedAt = new Date();
    const updated = await this.database.discoveryOnboarding.update({
      where: {
        clientId: payload.clientId,
      },
      data: {
        updatedById: payload.updatedById,
        isComplete: true,
        completedAt,
      },
      include: {
        answers: {
          select: {
            questionKey: true,
            answerText: true,
          },
          orderBy: { questionKey: "asc" },
        },
      },
    });

    return mapDiscoveryOnboardingRecord(updated)!;
  }

  listRbacPoliciesByRole(role: Role): Promise<RbacPolicyRecord[]> {
    return this.database.rbacPolicy.findMany({
      where: { role },
      orderBy: { module: "asc" },
    }) as Promise<RbacPolicyRecord[]>;
  }

  upsertRbacPolicy(payload: {
    role: Role;
    module: RbacModule;
    canView: boolean;
    canEdit: boolean;
    canManage: boolean;
  }): Promise<RbacPolicyRecord> {
    return this.database.rbacPolicy.upsert({
      where: {
        role_module: {
          role: payload.role,
          module: payload.module,
        },
      },
      create: {
        role: payload.role,
        module: payload.module,
        canView: payload.canView,
        canEdit: payload.canEdit,
        canManage: payload.canManage,
      },
      update: {
        canView: payload.canView,
        canEdit: payload.canEdit,
        canManage: payload.canManage,
      },
    }) as Promise<RbacPolicyRecord>;
  }

  createAuditLog(payload: {
    actorId: string | null;
    eventName: string;
    requestId: string;
    entityType?: string;
    entityId?: string;
    details?: Record<string, unknown>;
  }): Promise<void> {
    return this.database.auditLog
      .create({
        data: {
          actorId: payload.actorId,
          eventName: payload.eventName,
          requestId: payload.requestId,
          entityType: payload.entityType,
          entityId: payload.entityId,
          details: payload.details as Prisma.InputJsonValue | undefined,
        },
      })
      .then(() => undefined);
  }
}

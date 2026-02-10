import {
  DISCOVERY_QUESTION_KEYS,
  REQUIRED_DISCOVERY_KEYS,
  coerceClientViewPath,
  normalizeClientViewPath,
  type RbacModule,
  type DiscoveryAnswersInput,
  type DiscoveryQuestionKey,
  type RequiredDiscoveryQuestionKey,
} from "../contracts/clients.schema.ts";

export type Role = "OWNER" | "STRATEGY" | "CONTENT" | "OPERATIONS";

export class ClientDomainError extends Error {
  public readonly domainCode:
    | "forbidden"
    | "not_found"
    | "validation"
    | "persistence_error";
  public readonly details?: Record<string, unknown>;

  constructor(
    domainCode: "forbidden" | "not_found" | "validation" | "persistence_error",
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ClientDomainError";
    this.domainCode = domainCode;
    this.details = details;
  }
}

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

type DiscoveryAnswerRecord = {
  questionKey: DiscoveryQuestionKey;
  answerText: string;
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
  answers: DiscoveryAnswerRecord[];
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

export interface ClientsRepositoryPort {
  findActiveContext(userId: string): Promise<ContextSummary | null>;
  listMemberships(userId: string): Promise<MembershipWithClient[]>;
  createProfileWithOwner(
    userId: string,
    payload: { name: string },
  ): Promise<ClientProfileRecord>;
  updateProfile(payload: {
    clientId: string;
    name: string;
  }): Promise<ClientProfileRecord>;
  archiveProfile(payload: { clientId: string }): Promise<ClientProfileRecord>;
  switchActiveContext(
    userId: string,
    payload: { clientId: string; lastViewPath?: string },
  ): Promise<{ clientId: string; lastViewPath: string | null } | null>;
  rememberLastView(
    userId: string,
    payload: { clientId: string; lastViewPath: string },
  ): Promise<void>;
  findContextWithClient(userId: string): Promise<ContextWithClient | null>;
  findMembership(
    userId: string,
    clientId: string,
  ): Promise<MembershipSummary | null>;
  listStrategicDecisions(
    userId: string,
    clientId: string,
  ): Promise<StrategicDecisionRecord[]>;
  createStrategicDecision(payload: {
    clientId: string;
    authorId: string;
    content: string;
  }): Promise<StrategicDecisionRecord>;
  findDiscoveryOnboarding(
    userId: string,
    clientId: string,
  ): Promise<DiscoveryOnboardingRecord | null>;
  saveDiscoveryOnboardingDraft(payload: {
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
  }): Promise<DiscoveryOnboardingRecord>;
  markDiscoveryOnboardingComplete(payload: {
    clientId: string;
    updatedById: string;
  }): Promise<DiscoveryOnboardingRecord>;
  listRbacPoliciesByRole(role: Role): Promise<RbacPolicyRecord[]>;
  upsertRbacPolicy(payload: {
    role: Role;
    module: RbacModule;
    canView: boolean;
    canEdit: boolean;
    canManage: boolean;
  }): Promise<RbacPolicyRecord>;
  createAuditLog(payload: {
    actorId: string | null;
    eventName: string;
    requestId: string;
    entityType?: string;
    entityId?: string;
    details?: Record<string, unknown>;
  }): Promise<void>;
}

type ClientRow = {
  id: string;
  name: string;
  status: ClientStatus;
  archivedAt: Date | null;
  canEdit: boolean;
  isActive: boolean;
};

const EDITOR_ROLES = new Set<Role>(["OWNER", "STRATEGY"]);
const MIN_DISCOVERY_ANSWERS = 10;
const RBAC_MODULES: RbacModule[] = [
  "CLIENTS",
  "DISCOVERY",
  "AUDIT",
  "STRATEGY",
  "CONTENT",
  "IMPLEMENTATION",
  "REPORTING",
  "SETTINGS",
  "GOVERNANCE",
];

const FALLBACK_RBAC_POLICY: Record<
  Role,
  Partial<Record<RbacModule, { canView: boolean; canEdit: boolean; canManage: boolean }>>
> = {
  OWNER: {
    CLIENTS: { canView: true, canEdit: true, canManage: true },
    DISCOVERY: { canView: true, canEdit: true, canManage: true },
    AUDIT: { canView: true, canEdit: true, canManage: true },
    STRATEGY: { canView: true, canEdit: true, canManage: true },
    CONTENT: { canView: true, canEdit: true, canManage: true },
    IMPLEMENTATION: { canView: true, canEdit: true, canManage: true },
    REPORTING: { canView: true, canEdit: true, canManage: true },
    SETTINGS: { canView: true, canEdit: true, canManage: true },
    GOVERNANCE: { canView: true, canEdit: true, canManage: true },
  },
  STRATEGY: {
    CLIENTS: { canView: true, canEdit: true, canManage: false },
    DISCOVERY: { canView: true, canEdit: true, canManage: false },
    AUDIT: { canView: true, canEdit: true, canManage: false },
    STRATEGY: { canView: true, canEdit: true, canManage: false },
    CONTENT: { canView: true, canEdit: true, canManage: false },
    IMPLEMENTATION: { canView: true, canEdit: false, canManage: false },
    REPORTING: { canView: true, canEdit: true, canManage: false },
  },
  CONTENT: {
    CLIENTS: { canView: true, canEdit: false, canManage: false },
    DISCOVERY: { canView: true, canEdit: false, canManage: false },
    CONTENT: { canView: true, canEdit: true, canManage: false },
    REPORTING: { canView: true, canEdit: false, canManage: false },
  },
  OPERATIONS: {
    CLIENTS: { canView: true, canEdit: false, canManage: false },
    DISCOVERY: { canView: true, canEdit: false, canManage: false },
    AUDIT: { canView: true, canEdit: true, canManage: false },
    IMPLEMENTATION: { canView: true, canEdit: true, canManage: false },
    REPORTING: { canView: true, canEdit: false, canManage: false },
  },
};

const emptyDiscoveryAnswers = (): Record<DiscoveryQuestionKey, string> => ({
  goals: "",
  segments: "",
  seasonality: "",
  offer: "",
  targetAudience: "",
  brandTone: "",
  mainProducts: "",
  currentChallenges: "",
  currentFlows: "",
  primaryKpis: "",
});

const mapPersistenceError = (error: unknown) => {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? (error as { code?: unknown }).code
      : undefined;

  if (typeof code === "string") {
    throw new ClientDomainError("persistence_error", "CLIENT_PROFILE_DB_ERROR", {
      prismaCode: code,
    });
  }

  throw error;
};

const normalizeDiscoveryAnswers = (
  answers: DiscoveryAnswersInput,
): Record<DiscoveryQuestionKey, string> => {
  const normalized = emptyDiscoveryAnswers();

  for (const key of DISCOVERY_QUESTION_KEYS) {
    const value = answers[key];
    normalized[key] = typeof value === "string" ? value.trim() : "";
  }

  return normalized;
};

const answersFromRecord = (
  record: DiscoveryOnboardingRecord | null,
): Record<DiscoveryQuestionKey, string> => {
  const answers = emptyDiscoveryAnswers();

  if (!record) {
    return answers;
  }

  for (const row of record.answers) {
    answers[row.questionKey] = row.answerText.trim();
  }

  return answers;
};

type DiscoveryProgress = {
  answers: Record<DiscoveryQuestionKey, string>;
  answerCount: number;
  requiredCompleteness: Record<RequiredDiscoveryQuestionKey, boolean>;
  missingFields: RequiredDiscoveryQuestionKey[];
  canComplete: boolean;
};

export const evaluateDiscoveryProgress = (
  answers: Record<DiscoveryQuestionKey, string>,
): DiscoveryProgress => {
  const answerCount = DISCOVERY_QUESTION_KEYS.reduce((count, key) => {
    return answers[key].trim().length > 0 ? count + 1 : count;
  }, 0);

  const requiredCompleteness = {
    goals: answers.goals.trim().length > 0,
    segments: answers.segments.trim().length > 0,
    seasonality: answers.seasonality.trim().length > 0,
    offer: answers.offer.trim().length > 0,
  };

  const missingFields = REQUIRED_DISCOVERY_KEYS.filter(
    (key) => !requiredCompleteness[key],
  );

  return {
    answers,
    answerCount,
    requiredCompleteness,
    missingFields,
    canComplete: missingFields.length === 0 && answerCount >= MIN_DISCOVERY_ANSWERS,
  };
};

const mapDiscoveryState = (
  record: DiscoveryOnboardingRecord | null,
  progress: DiscoveryProgress,
) => ({
  data: {
    clientId: record?.clientId ?? null,
    answers: progress.answers,
    answerCount: progress.answerCount,
    minAnswersRequired: MIN_DISCOVERY_ANSWERS,
    requiredCompleteness: progress.requiredCompleteness,
    missingFields: progress.missingFields,
    canComplete: progress.canComplete,
    isComplete: record?.isComplete ?? false,
    completedAt: record?.completedAt ?? null,
    updatedAt: record?.updatedAt ?? null,
  },
});

const toPolicyView = (policy: RbacPolicyRecord) => ({
  id: policy.id,
  role: policy.role,
  module: policy.module,
  canView: policy.canView,
  canEdit: policy.canEdit,
  canManage: policy.canManage,
  updatedAt: policy.updatedAt,
});

const buildFallbackPoliciesForRole = (role: Role) => {
  return RBAC_MODULES.map((module) => {
    const rule = FALLBACK_RBAC_POLICY[role][module] ?? {
      canView: false,
      canEdit: false,
      canManage: false,
    };

    return {
      id: `fallback-${role}-${module}`,
      role,
      module,
      canView: rule.canView,
      canEdit: rule.canEdit,
      canManage: rule.canManage,
      updatedAt: new Date(0),
    } satisfies RbacPolicyRecord;
  });
};

const assertDiscoveryComplete = (progress: DiscoveryProgress) => {
  if (progress.canComplete) {
    return;
  }

  throw new ClientDomainError("validation", "DISCOVERY_INCOMPLETE", {
    reason: "discovery_incomplete",
    missingFields: progress.missingFields,
    answerCount: progress.answerCount,
    minAnswersRequired: MIN_DISCOVERY_ANSWERS,
    missingAnswersCount: Math.max(MIN_DISCOVERY_ANSWERS - progress.answerCount, 0),
  });
};

export class ClientsService {
  private readonly repository: ClientsRepositoryPort;

  constructor(repository: ClientsRepositoryPort) {
    this.repository = repository;
  }

  async listProfiles(userId: string, role: Role) {
    await this.assertModuleCanView(role, "CLIENTS");
    const activeContext = await this.repository.findActiveContext(userId);
    const memberships = await this.repository.listMemberships(userId);

    const data: ClientRow[] = memberships.map((membership) => ({
      id: membership.client.id,
      name: membership.client.name,
      status: membership.client.status,
      archivedAt: membership.client.archivedAt,
      canEdit: membership.canEdit,
      isActive: membership.clientId === activeContext?.clientId,
    }));

    return {
      data,
      meta: {
        activeClientId: activeContext?.clientId ?? null,
      },
    };
  }

  async createProfile(userId: string, role: Role, payload: { name: string }) {
    await this.assertModuleCanEdit(role, "CLIENTS");
    this.assertEditorRole(role);

    try {
      const client = await this.repository.createProfileWithOwner(userId, payload);
      return { data: client };
    } catch (error) {
      mapPersistenceError(error);
      throw error;
    }
  }

  async updateProfile(
    userId: string,
    role: Role,
    payload: { clientId: string; name: string },
  ) {
    await this.assertModuleCanEdit(role, "CLIENTS");
    this.assertEditorRole(role);
    await this.assertMembershipEditor(userId, payload.clientId);

    try {
      const updated = await this.repository.updateProfile(payload);
      return { data: updated };
    } catch (error) {
      mapPersistenceError(error);
      throw error;
    }
  }

  async archiveProfile(userId: string, role: Role, payload: { clientId: string }) {
    await this.assertModuleCanEdit(role, "CLIENTS");
    this.assertEditorRole(role);
    await this.assertMembershipEditor(userId, payload.clientId);

    try {
      const archived = await this.repository.archiveProfile(payload);
      return { data: archived };
    } catch (error) {
      mapPersistenceError(error);
      throw error;
    }
  }

  async switchActiveContext(
    userId: string,
    role: Role,
    payload: { clientId: string; lastViewPath?: string },
  ) {
    await this.assertModuleCanView(role, "CLIENTS");
    await this.assertMembership(userId, payload.clientId);

    const switched = await this.repository.switchActiveContext(userId, {
      clientId: payload.clientId,
      ...(payload.lastViewPath
        ? { lastViewPath: normalizeClientViewPath(payload.lastViewPath) }
        : {}),
    });

    return {
      data: {
        activeClientId: switched?.clientId ?? payload.clientId,
        restoredViewPath: coerceClientViewPath(switched?.lastViewPath),
      },
    };
  }

  async rememberLastView(
    userId: string,
    role: Role,
    payload: { clientId: string; lastViewPath: string },
  ) {
    await this.assertModuleCanView(role, "CLIENTS");
    await this.assertMembership(userId, payload.clientId);

    await this.repository.rememberLastView(userId, {
      clientId: payload.clientId,
      lastViewPath: normalizeClientViewPath(payload.lastViewPath),
    });

    return {
      data: {
        clientId: payload.clientId,
        lastViewPath: normalizeClientViewPath(payload.lastViewPath),
      },
    };
  }

  async getActiveContext(userId: string, role: Role) {
    await this.assertModuleCanView(role, "CLIENTS");
    const context = await this.repository.findContextWithClient(userId);

    if (!context) {
      return {
        data: null,
      };
    }

    await this.assertMembership(userId, context.clientId);

    return {
      data: {
        clientId: context.clientId,
        clientName: context.client.name,
        status: context.client.status,
        lastViewPath: coerceClientViewPath(context.lastViewPath),
      },
    };
  }

  async listStrategicDecisions(
    userId: string,
    role: Role,
    payload: { clientId: string },
  ) {
    await this.assertModuleCanView(role, "STRATEGY");
    await this.assertMembership(userId, payload.clientId);
    await this.assertClientInActiveContext(userId, payload.clientId);

    const decisions = await this.repository.listStrategicDecisions(
      userId,
      payload.clientId,
    );

    return {
      data: decisions.map((decision) => ({
        id: decision.id,
        clientId: decision.clientId,
        content: decision.content,
        createdAt: decision.createdAt,
        updatedAt: decision.updatedAt,
        author: {
          id: decision.author.id,
          name:
            decision.author.name ??
            decision.author.email ??
            `user-${decision.author.id.slice(0, 8)}`,
        },
      })),
    };
  }

  async createStrategicDecision(
    userId: string,
    role: Role,
    payload: { clientId: string; content: string },
  ) {
    await this.assertModuleCanEdit(role, "STRATEGY");
    await this.assertMembershipCanEdit(userId, payload.clientId);
    await this.assertClientInActiveContext(userId, payload.clientId);

    try {
      const created = await this.repository.createStrategicDecision({
        clientId: payload.clientId,
        authorId: userId,
        content: payload.content.trim(),
      });

      return {
        data: {
          id: created.id,
          clientId: created.clientId,
          content: created.content,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
          author: {
            id: created.author.id,
            name:
              created.author.name ??
              created.author.email ??
              `user-${created.author.id.slice(0, 8)}`,
          },
        },
      };
    } catch (error) {
      mapPersistenceError(error);
      throw error;
    }
  }

  async getDiscoveryState(
    userId: string,
    role: Role,
    payload: { clientId: string },
  ) {
    await this.assertModuleCanView(role, "DISCOVERY");
    await this.assertMembership(userId, payload.clientId);
    await this.assertClientInActiveContext(userId, payload.clientId);

    const record = await this.repository.findDiscoveryOnboarding(
      userId,
      payload.clientId,
    );

    return mapDiscoveryState(record, evaluateDiscoveryProgress(answersFromRecord(record)));
  }

  async saveDiscoveryDraft(
    userId: string,
    role: Role,
    payload: { clientId: string; answers: DiscoveryAnswersInput },
  ) {
    await this.assertModuleCanEdit(role, "DISCOVERY");
    await this.assertMembershipCanEdit(userId, payload.clientId);
    await this.assertClientInActiveContext(userId, payload.clientId);

    const normalizedAnswers = normalizeDiscoveryAnswers(payload.answers);
    const progress = evaluateDiscoveryProgress(normalizedAnswers);

    try {
      const saved = await this.repository.saveDiscoveryOnboardingDraft({
        clientId: payload.clientId,
        updatedById: userId,
        answers: normalizedAnswers,
        answerCount: progress.answerCount,
        isGoalsComplete: progress.requiredCompleteness.goals,
        isSegmentsComplete: progress.requiredCompleteness.segments,
        isSeasonalityComplete: progress.requiredCompleteness.seasonality,
        isOfferComplete: progress.requiredCompleteness.offer,
        isComplete: false,
        completedAt: null,
      });

      return mapDiscoveryState(saved, progress);
    } catch (error) {
      mapPersistenceError(error);
      throw error;
    }
  }

  async completeDiscovery(
    userId: string,
    role: Role,
    payload: { clientId: string },
  ) {
    await this.assertModuleCanEdit(role, "DISCOVERY");
    await this.assertMembershipCanEdit(userId, payload.clientId);
    await this.assertClientInActiveContext(userId, payload.clientId);

    const record = await this.repository.findDiscoveryOnboarding(
      userId,
      payload.clientId,
    );
    const progress = evaluateDiscoveryProgress(answersFromRecord(record));

    assertDiscoveryComplete(progress);

    try {
      const completed = await this.repository.markDiscoveryOnboardingComplete({
        clientId: payload.clientId,
        updatedById: userId,
      });

      return mapDiscoveryState(completed, progress);
    } catch (error) {
      mapPersistenceError(error);
      throw error;
    }
  }

  async getRbacPolicies(
    userId: string,
    actorRole: Role,
    requestId: string,
    payload: { role?: Role } = {},
  ) {
    const targetRole = payload.role ?? actorRole;
    this.assertRoleCanInspectPolicies(actorRole, targetRole);

    try {
      const policiesFromDb = await this.repository.listRbacPoliciesByRole(targetRole);
      const policies =
        policiesFromDb.length > 0
          ? policiesFromDb
          : buildFallbackPoliciesForRole(targetRole);

      return {
        data: {
          role: targetRole,
          safeMode: policiesFromDb.length === 0,
          source: policiesFromDb.length === 0 ? "fallback" : "db",
          policies: policies.map(toPolicyView),
        },
      };
    } catch (error) {
      await this.repository
        .createAuditLog({
          actorId: userId,
          eventName: "rbac.policy.load_failed",
          requestId,
          entityType: "rbac_policy",
          entityId: targetRole,
          details: {
            reason: "rbac_policy_load_failed",
            targetRole,
            errorMessage:
              error instanceof Error ? error.message : "unknown_error",
          },
        })
        .catch(() => undefined);

      return {
        data: {
          role: targetRole,
          safeMode: true,
          source: "fallback",
          policies: buildFallbackPoliciesForRole(targetRole).map(toPolicyView),
        },
      };
    }
  }

  async updateRbacPolicy(
    userId: string,
    actorRole: Role,
    payload: {
      role: Role;
      module: RbacModule;
      canView: boolean;
      canEdit: boolean;
      canManage: boolean;
    },
    requestId: string,
  ) {
    if (actorRole !== "OWNER") {
      await this.repository.createAuditLog({
        actorId: userId,
        eventName: "rbac.policy.update_denied",
        requestId,
        entityType: "rbac_policy",
        entityId: `${payload.role}:${payload.module}`,
        details: {
          reason: "owner_role_required",
          actorRole,
          targetRole: payload.role,
          targetModule: payload.module,
        },
      });

      throw new ClientDomainError("forbidden", "forbidden", {
        reason: "owner_role_required",
      });
    }

    try {
      const updated = await this.repository.upsertRbacPolicy(payload);
      await this.repository.createAuditLog({
        actorId: userId,
        eventName: "rbac.policy.updated",
        requestId,
        entityType: "rbac_policy",
        entityId: `${updated.role}:${updated.module}`,
        details: {
          role: updated.role,
          module: updated.module,
          canView: updated.canView,
          canEdit: updated.canEdit,
          canManage: updated.canManage,
        },
      });

      return { data: toPolicyView(updated) };
    } catch (error) {
      mapPersistenceError(error);
      throw error;
    }
  }

  private assertEditorRole(role: Role) {
    if (!EDITOR_ROLES.has(role)) {
      throw new ClientDomainError("forbidden", "forbidden", {
        reason: "role_without_edit_permission",
      });
    }
  }

  private assertRoleCanInspectPolicies(actorRole: Role, targetRole: Role) {
    if (actorRole === "OWNER") {
      return;
    }

    if (actorRole !== targetRole) {
      throw new ClientDomainError("forbidden", "forbidden", {
        reason: "rbac_read_forbidden_for_other_role",
      });
    }
  }

  private async getModulePolicy(role: Role, module: RbacModule) {
    try {
      const policies = await this.repository.listRbacPoliciesByRole(role);
      if (policies.length === 0) {
        return buildFallbackPoliciesForRole(role).find((policy) => policy.module === module)!;
      }

      return (
        policies.find((policy) => policy.module === module) ?? {
          id: `fallback-${role}-${module}`,
          role,
          module,
          canView: false,
          canEdit: false,
          canManage: false,
          updatedAt: new Date(0),
        }
      );
    } catch {
      return buildFallbackPoliciesForRole(role).find((policy) => policy.module === module)!;
    }
  }

  private async assertModuleCanView(role: Role, module: RbacModule) {
    if (process.env.NODE_ENV === "development" && role === "OWNER") {
      return;
    }

    const policy = await this.getModulePolicy(role, module);
    if (!policy.canView) {
      throw new ClientDomainError("forbidden", "forbidden", {
        reason: "rbac_module_view_forbidden",
        module,
        role,
      });
    }
  }

  private async assertModuleCanEdit(role: Role, module: RbacModule) {
    if (process.env.NODE_ENV === "development" && role === "OWNER") {
      return;
    }

    const policy = await this.getModulePolicy(role, module);
    if (!policy.canEdit) {
      throw new ClientDomainError("forbidden", "forbidden", {
        reason: "rbac_module_edit_forbidden",
        module,
        role,
      });
    }
  }

  private async assertMembership(userId: string, clientId: string) {
    const membership = await this.repository.findMembership(userId, clientId);

    if (!membership) {
      throw new ClientDomainError("forbidden", "forbidden", {
        reason: "cross_client_access_blocked",
      });
    }
  }

  private async assertMembershipEditor(userId: string, clientId: string) {
    const membership = await this.repository.findMembership(userId, clientId);

    if (!membership) {
      throw new ClientDomainError("not_found", "CLIENT_PROFILE_NOT_FOUND", {
        clientId,
      });
    }

    if (!membership.canEdit) {
      throw new ClientDomainError("forbidden", "forbidden", {
        reason: "membership_without_edit_permission",
      });
    }
  }

  private async assertClientInActiveContext(userId: string, clientId: string) {
    const activeContext = await this.repository.findActiveContext(userId);

    if (activeContext?.clientId !== clientId) {
      throw new ClientDomainError("forbidden", "forbidden", {
        reason: "active_context_mismatch",
      });
    }
  }

  private async assertMembershipCanEdit(userId: string, clientId: string) {
    const membership = await this.repository.findMembership(userId, clientId);

    if (!membership) {
      throw new ClientDomainError("forbidden", "forbidden", {
        reason: "cross_client_access_blocked",
      });
    }

    if (!membership.canEdit) {
      throw new ClientDomainError("forbidden", "forbidden", {
        reason: "membership_without_edit_permission",
      });
    }
  }
}

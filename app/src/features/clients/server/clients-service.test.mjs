import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const logicModulePath = pathToFileURL(
  path.resolve("src/features/clients/server/clients.logic.ts"),
).href;

const { ClientsService, ClientDomainError } = await import(logicModulePath);

const createDiscoveryAnswerRows = (answers) =>
  Object.entries(answers)
    .filter(([, value]) => String(value).trim().length > 0)
    .map(([questionKey, answerText]) => ({
      questionKey,
      answerText: String(answerText),
    }));

const createRepositoryMock = (overrides = {}) => ({
  findActiveContext: async () => ({ clientId: "client-1" }),
  listMemberships: async () => [],
  createProfileWithOwner: async (_userId, payload) => ({
    id: "client-1",
    name: payload.name,
    status: "ACTIVE",
    archivedAt: null,
    createdAt: new Date("2026-02-01T00:00:00.000Z"),
    updatedAt: new Date("2026-02-01T00:00:00.000Z"),
  }),
  updateProfile: async ({ clientId, name }) => ({
    id: clientId,
    name,
    status: "ACTIVE",
    archivedAt: null,
    createdAt: new Date("2026-02-01T00:00:00.000Z"),
    updatedAt: new Date("2026-02-01T00:00:00.000Z"),
  }),
  archiveProfile: async ({ clientId }) => ({
    id: clientId,
    name: "A",
    status: "ARCHIVED",
    archivedAt: new Date("2026-02-01T00:00:00.000Z"),
    createdAt: new Date("2026-02-01T00:00:00.000Z"),
    updatedAt: new Date("2026-02-01T00:00:00.000Z"),
  }),
  switchActiveContext: async (_userId, payload) => ({
    clientId: payload.clientId,
    lastViewPath: payload.lastViewPath ?? null,
  }),
  rememberLastView: async () => undefined,
  findContextWithClient: async () => null,
  findMembership: async () => ({ id: "membership-1", canEdit: true }),
  listStrategicDecisions: async () => [],
  createStrategicDecision: async ({ clientId, authorId, content }) => ({
    id: "decision-1",
    clientId,
    authorId,
    content,
    createdAt: new Date("2026-02-01T00:00:00.000Z"),
    updatedAt: new Date("2026-02-01T00:00:00.000Z"),
    author: {
      id: authorId,
      name: "Owner",
      email: "owner@example.com",
    },
  }),
  findDiscoveryOnboarding: async () => null,
  saveDiscoveryOnboardingDraft: async ({
    clientId,
    answerCount,
    isGoalsComplete,
    isSegmentsComplete,
    isSeasonalityComplete,
    isOfferComplete,
    answers,
  }) => ({
    id: "discovery-1",
    clientId,
    answerCount,
    isGoalsComplete,
    isSegmentsComplete,
    isSeasonalityComplete,
    isOfferComplete,
    isComplete: false,
    completedAt: null,
    updatedAt: new Date("2026-02-02T00:00:00.000Z"),
    answers: createDiscoveryAnswerRows(answers),
  }),
  markDiscoveryOnboardingComplete: async ({ clientId }) => ({
    id: "discovery-1",
    clientId,
    answerCount: 10,
    isGoalsComplete: true,
    isSegmentsComplete: true,
    isSeasonalityComplete: true,
    isOfferComplete: true,
    isComplete: true,
    completedAt: new Date("2026-02-02T00:00:00.000Z"),
    updatedAt: new Date("2026-02-02T00:00:00.000Z"),
    answers: createDiscoveryAnswerRows({
      goals: "g",
      segments: "s",
      seasonality: "se",
      offer: "o",
      targetAudience: "a",
      brandTone: "b",
      mainProducts: "m",
      currentChallenges: "c",
      currentFlows: "f",
      primaryKpis: "k",
    }),
  }),
  listRbacPoliciesByRole: async () => [],
  upsertRbacPolicy: async (payload) => ({
    id: `policy-${payload.role}-${payload.module}`,
    role: payload.role,
    module: payload.module,
    canView: payload.canView,
    canEdit: payload.canEdit,
    canManage: payload.canManage,
    updatedAt: new Date("2026-02-02T00:00:00.000Z"),
  }),
  createAuditLog: async () => undefined,
  ...overrides,
});

test("clients service blokuje zapis dla roli bez uprawnien edycji", async () => {
  const service = new ClientsService(createRepositoryMock());

  await assert.rejects(
    () => service.createProfile("user-1", "CONTENT", { name: "Nowy klient" }),
    (error) => {
      assert.ok(error instanceof ClientDomainError);
      assert.equal(error.domainCode, "forbidden");
      assert.equal(error.message, "forbidden");
      assert.equal(error.details?.reason, "rbac_module_edit_forbidden");
      return true;
    },
  );
});

test("clients service mapuje blad persistence do kontraktu domenowego", async () => {
  const service = new ClientsService(
    createRepositoryMock({
      createProfileWithOwner: async () => {
        throw { code: "P2002" };
      },
    }),
  );

  await assert.rejects(
    () => service.createProfile("user-1", "OWNER", { name: "Nowy klient" }),
    (error) => {
      assert.ok(error instanceof ClientDomainError);
      assert.equal(error.domainCode, "persistence_error");
      assert.equal(error.message, "CLIENT_PROFILE_DB_ERROR");
      assert.equal(error.details?.prismaCode, "P2002");
      return true;
    },
  );
});

test("clients service sanitizuje last view przy switch i restore", async () => {
  let payloadFromSwitch = null;
  const service = new ClientsService(
    createRepositoryMock({
      switchActiveContext: async (_userId, payload) => {
        payloadFromSwitch = payload;
        return {
          clientId: payload.clientId,
          lastViewPath: "https://evil.example/phishing",
        };
      },
    }),
  );

  const result = await service.switchActiveContext("user-1", "OWNER", {
    clientId: "client-1",
    lastViewPath: "javascript:alert(1)",
  });

  assert.deepEqual(payloadFromSwitch, {
    clientId: "client-1",
    lastViewPath: "/clients",
  });
  assert.equal(result.data.activeClientId, "client-1");
  assert.equal(result.data.restoredViewPath, "/clients");
});

test("clients service zapamietuje only-local last view i blokuje cross-client access", async () => {
  let rememberPayload = null;
  const service = new ClientsService(
    createRepositoryMock({
      findMembership: async (_userId, clientId) =>
        clientId === "client-1" ? { id: "membership-1", canEdit: true } : null,
      rememberLastView: async (_userId, payload) => {
        rememberPayload = payload;
      },
    }),
  );

  const save = await service.rememberLastView("user-1", "OWNER", {
    clientId: "client-1",
    lastViewPath: "/admin",
  });

  assert.equal(save.data.lastViewPath, "/clients");
  assert.deepEqual(rememberPayload, {
    clientId: "client-1",
    lastViewPath: "/clients",
  });

  await assert.rejects(
    () =>
      service.rememberLastView("user-1", "OWNER", {
        clientId: "client-2",
        lastViewPath: "/clients/segment",
      }),
    (error) => {
      assert.ok(error instanceof ClientDomainError);
      assert.equal(error.domainCode, "forbidden");
      assert.equal(error.details?.reason, "cross_client_access_blocked");
      return true;
    },
  );
});

test("clients service tworzy decyzje tylko w aktywnym kontekscie klienta", async () => {
  let createdPayload = null;
  const service = new ClientsService(
    createRepositoryMock({
      findActiveContext: async () => ({ clientId: "client-1" }),
      createStrategicDecision: async (payload) => {
        createdPayload = payload;
        return {
          id: "decision-1",
          clientId: payload.clientId,
          authorId: payload.authorId,
          content: payload.content,
          createdAt: new Date("2026-02-01T00:00:00.000Z"),
          updatedAt: new Date("2026-02-01T00:00:00.000Z"),
          author: {
            id: payload.authorId,
            name: "Owner",
            email: "owner@example.com",
          },
        };
      },
    }),
  );

  const result = await service.createStrategicDecision("user-1", "OWNER", {
    clientId: "client-1",
    content: "  Priorytet retention Q2  ",
  });

  assert.deepEqual(createdPayload, {
    clientId: "client-1",
    authorId: "user-1",
    content: "Priorytet retention Q2",
  });
  assert.equal(result.data.clientId, "client-1");
  assert.equal(result.data.author.name, "Owner");
});

test("clients service blokuje zapis decyzji poza aktywnym kontekstem", async () => {
  const service = new ClientsService(
    createRepositoryMock({
      findActiveContext: async () => ({ clientId: "client-1" }),
    }),
  );

  await assert.rejects(
    () =>
      service.createStrategicDecision("user-1", "OWNER", {
        clientId: "client-2",
        content: "Nie powinno przejsc",
      }),
    (error) => {
      assert.ok(error instanceof ClientDomainError);
      assert.equal(error.domainCode, "forbidden");
      assert.equal(error.details?.reason, "active_context_mismatch");
      return true;
    },
  );
});

test("clients service blokuje createDecision dla membership bez canEdit", async () => {
  const service = new ClientsService(
    createRepositoryMock({
      findMembership: async () => ({ id: "membership-1", canEdit: false }),
      findActiveContext: async () => ({ clientId: "client-1" }),
    }),
  );

  await assert.rejects(
    () =>
      service.createStrategicDecision("user-1", "OWNER", {
        clientId: "client-1",
        content: "Decyzja tylko dla editora",
      }),
    (error) => {
      assert.ok(error instanceof ClientDomainError);
      assert.equal(error.domainCode, "forbidden");
      assert.equal(error.details?.reason, "membership_without_edit_permission");
      return true;
    },
  );
});

test("clients service blokuje listDecisions poza aktywnym kontekstem", async () => {
  const service = new ClientsService(
    createRepositoryMock({
      findActiveContext: async () => ({ clientId: "client-1" }),
    }),
  );

  await assert.rejects(
    () =>
      service.listStrategicDecisions("user-1", "OWNER", {
        clientId: "client-2",
      }),
    (error) => {
      assert.ok(error instanceof ClientDomainError);
      assert.equal(error.domainCode, "forbidden");
      assert.equal(error.details?.reason, "active_context_mismatch");
      return true;
    },
  );
});

test("clients service mapuje blad DB przy zapisie decyzji na persistence_error", async () => {
  const service = new ClientsService(
    createRepositoryMock({
      findActiveContext: async () => ({ clientId: "client-1" }),
      createStrategicDecision: async () => {
        throw { code: "P2003" };
      },
    }),
  );

  await assert.rejects(
    () =>
      service.createStrategicDecision("user-1", "OWNER", {
        clientId: "client-1",
        content: "Decyzja",
      }),
    (error) => {
      assert.ok(error instanceof ClientDomainError);
      assert.equal(error.domainCode, "persistence_error");
      assert.equal(error.message, "CLIENT_PROFILE_DB_ERROR");
      assert.equal(error.details?.prismaCode, "P2003");
      return true;
    },
  );
});

test("clients service blokuje completeDiscovery przy 9 odpowiedziach", async () => {
  const service = new ClientsService(
    createRepositoryMock({
      findDiscoveryOnboarding: async () => ({
        id: "discovery-1",
        clientId: "client-1",
        answerCount: 9,
        isGoalsComplete: true,
        isSegmentsComplete: true,
        isSeasonalityComplete: true,
        isOfferComplete: true,
        isComplete: false,
        completedAt: null,
        updatedAt: new Date("2026-02-02T00:00:00.000Z"),
        answers: createDiscoveryAnswerRows({
          goals: "g",
          segments: "s",
          seasonality: "se",
          offer: "o",
          targetAudience: "a",
          brandTone: "b",
          mainProducts: "m",
          currentChallenges: "c",
          currentFlows: "f",
        }),
      }),
    }),
  );

  await assert.rejects(
    () => service.completeDiscovery("user-1", "OWNER", { clientId: "client-1" }),
    (error) => {
      assert.ok(error instanceof ClientDomainError);
      assert.equal(error.domainCode, "validation");
      assert.equal(error.message, "DISCOVERY_INCOMPLETE");
      assert.equal(error.details?.answerCount, 9);
      assert.equal(error.details?.missingAnswersCount, 1);
      return true;
    },
  );
});

test("clients service blokuje completeDiscovery przy brakujacych polach wymaganych", async () => {
  const service = new ClientsService(
    createRepositoryMock({
      findDiscoveryOnboarding: async () => ({
        id: "discovery-1",
        clientId: "client-1",
        answerCount: 10,
        isGoalsComplete: false,
        isSegmentsComplete: true,
        isSeasonalityComplete: true,
        isOfferComplete: false,
        isComplete: false,
        completedAt: null,
        updatedAt: new Date("2026-02-02T00:00:00.000Z"),
        answers: createDiscoveryAnswerRows({
          segments: "s",
          seasonality: "se",
          targetAudience: "a",
          brandTone: "b",
          mainProducts: "m",
          currentChallenges: "c",
          currentFlows: "f",
          primaryKpis: "k",
          offer: "",
          goals: "",
        }),
      }),
    }),
  );

  await assert.rejects(
    () => service.completeDiscovery("user-1", "OWNER", { clientId: "client-1" }),
    (error) => {
      assert.ok(error instanceof ClientDomainError);
      assert.equal(error.domainCode, "validation");
      assert.deepEqual(error.details?.missingFields, ["goals", "offer"]);
      return true;
    },
  );
});

test("clients service zapisuje draft discovery z mapowaniem kompletowosci", async () => {
  let payloadCaptured = null;
  const service = new ClientsService(
    createRepositoryMock({
      saveDiscoveryOnboardingDraft: async (payload) => {
        payloadCaptured = payload;
        return {
          id: "discovery-1",
          clientId: payload.clientId,
          answerCount: payload.answerCount,
          isGoalsComplete: payload.isGoalsComplete,
          isSegmentsComplete: payload.isSegmentsComplete,
          isSeasonalityComplete: payload.isSeasonalityComplete,
          isOfferComplete: payload.isOfferComplete,
          isComplete: false,
          completedAt: null,
          updatedAt: new Date("2026-02-02T00:00:00.000Z"),
          answers: createDiscoveryAnswerRows(payload.answers),
        };
      },
    }),
  );

  const result = await service.saveDiscoveryDraft("user-1", "OWNER", {
    clientId: "client-1",
    answers: {
      goals: "MRR",
      segments: "VIP",
      seasonality: "Q4",
      offer: "Premium",
      targetAudience: "B2C",
      brandTone: "Ekspercki",
      mainProducts: "Sub",
      currentChallenges: "Retencja",
      currentFlows: "Welcome",
      primaryKpis: "CTR",
    },
  });

  assert.equal(payloadCaptured.answerCount, 10);
  assert.equal(payloadCaptured.isGoalsComplete, true);
  assert.equal(payloadCaptured.isOfferComplete, true);
  assert.equal(result.data.canComplete, true);
  assert.equal(result.data.answerCount, 10);
});

test("clients service updateRbacPolicy odrzuca role inna niz OWNER i loguje probe", async () => {
  const auditEvents = [];
  const service = new ClientsService(
    createRepositoryMock({
      createAuditLog: async (payload) => {
        auditEvents.push(payload);
      },
    }),
  );

  await assert.rejects(
    () =>
      service.updateRbacPolicy(
        "user-1",
        "STRATEGY",
        {
          role: "CONTENT",
          module: "CONTENT",
          canView: true,
          canEdit: true,
          canManage: false,
        },
        "req-1",
      ),
    (error) => {
      assert.ok(error instanceof ClientDomainError);
      assert.equal(error.domainCode, "forbidden");
      assert.equal(error.details?.reason, "owner_role_required");
      return true;
    },
  );

  assert.equal(auditEvents.length, 1);
  assert.equal(auditEvents[0].eventName, "rbac.policy.update_denied");
  assert.equal(auditEvents[0].requestId, "req-1");
});

test("clients service updateRbacPolicy dla OWNER zapisuje policy i audit", async () => {
  const auditEvents = [];
  let updatedPayload = null;
  const service = new ClientsService(
    createRepositoryMock({
      upsertRbacPolicy: async (payload) => {
        updatedPayload = payload;
        return {
          id: "policy-1",
          ...payload,
          updatedAt: new Date("2026-02-02T00:00:00.000Z"),
        };
      },
      createAuditLog: async (payload) => {
        auditEvents.push(payload);
      },
    }),
  );

  const result = await service.updateRbacPolicy(
    "owner-1",
    "OWNER",
    {
      role: "CONTENT",
      module: "CONTENT",
      canView: true,
      canEdit: true,
      canManage: false,
    },
    "req-2",
  );

  assert.equal(updatedPayload.role, "CONTENT");
  assert.equal(result.data.module, "CONTENT");
  assert.equal(auditEvents.at(-1).eventName, "rbac.policy.updated");
  assert.equal(auditEvents.at(-1).requestId, "req-2");
});

test("clients service getRbacPolicies przechodzi w safe mode przy bledzie odczytu", async () => {
  const auditEvents = [];
  const service = new ClientsService(
    createRepositoryMock({
      listRbacPoliciesByRole: async () => {
        throw new Error("DB_DOWN");
      },
      createAuditLog: async (payload) => {
        auditEvents.push(payload);
      },
    }),
  );

  const result = await service.getRbacPolicies(
    "user-1",
    "CONTENT",
    "req-rbac-read",
    {},
  );
  assert.equal(result.data.safeMode, true);
  assert.equal(result.data.source, "fallback");
  assert.equal(result.data.role, "CONTENT");
  assert.ok(result.data.policies.length > 0);
  assert.equal(auditEvents.length, 1);
  assert.equal(auditEvents[0].eventName, "rbac.policy.load_failed");
  assert.equal(auditEvents[0].requestId, "req-rbac-read");
});

test("clients service egzekwuje RBAC view dla modulu STRATEGY po stronie serwera", async () => {
  const service = new ClientsService(createRepositoryMock());

  await assert.rejects(
    () =>
      service.listStrategicDecisions("user-1", "CONTENT", {
        clientId: "client-1",
      }),
    (error) => {
      assert.ok(error instanceof ClientDomainError);
      assert.equal(error.domainCode, "forbidden");
      assert.equal(error.details?.reason, "rbac_module_view_forbidden");
      assert.equal(error.details?.module, "STRATEGY");
      return true;
    },
  );
});

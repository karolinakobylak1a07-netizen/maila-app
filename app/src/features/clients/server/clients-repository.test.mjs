import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repositoryModulePath = pathToFileURL(
  path.resolve("src/features/clients/server/clients.repository.ts"),
).href;

const { ClientsRepository } = await import(repositoryModulePath);

test("clients repository createStrategicDecision wykonuje zapis w transakcji", async () => {
  const calls = [];
  const fakeRecord = {
    id: "decision-1",
    clientId: "client-1",
    authorId: "user-1",
    content: "Decyzja",
    createdAt: new Date("2026-02-02T00:00:00.000Z"),
    updatedAt: new Date("2026-02-02T00:00:00.000Z"),
    author: { id: "user-1", name: "Owner", email: "owner@example.com" },
  };

  const repository = new ClientsRepository({
    $transaction: async (callback) => {
      calls.push("transaction");
      return callback({
        strategicDecision: {
          create: async ({ data }) => {
            calls.push("create");
            assert.equal(data.clientId, "client-1");
            assert.equal(data.authorId, "user-1");
            assert.equal(data.content, "Decyzja");
            return fakeRecord;
          },
        },
      });
    },
  });

  const result = await repository.createStrategicDecision({
    clientId: "client-1",
    authorId: "user-1",
    content: "Decyzja",
  });

  assert.deepEqual(calls, ["transaction", "create"]);
  assert.equal(result.id, "decision-1");
});

test("clients repository createStrategicDecision propaguje blad transakcji (rollback path)", async () => {
  const prismaError = { code: "P2003" };

  const repository = new ClientsRepository({
    $transaction: async (callback) =>
      callback({
        strategicDecision: {
          create: async () => {
            throw prismaError;
          },
        },
      }),
  });

  await assert.rejects(
    () =>
      repository.createStrategicDecision({
        clientId: "client-1",
        authorId: "user-1",
        content: "Decyzja",
      }),
    (error) => {
      assert.equal(error, prismaError);
      return true;
    },
  );
});

test("clients repository saveDiscoveryOnboardingDraft zapisuje onboarding i odpowiedzi w transakcji", async () => {
  const calls = [];
  const repository = new ClientsRepository({
    $transaction: async (callback) =>
      callback({
        discoveryOnboarding: {
          upsert: async ({ create, update }) => {
            calls.push("upsert");
            assert.equal(create.answerCount, 10);
            assert.equal(update.isGoalsComplete, true);
            return {
              id: "discovery-1",
              clientId: "client-1",
            };
          },
          findUnique: async () => ({
            id: "discovery-1",
            clientId: "client-1",
            answerCount: 10,
            isGoalsComplete: true,
            isSegmentsComplete: true,
            isSeasonalityComplete: true,
            isOfferComplete: true,
            isComplete: false,
            completedAt: null,
            updatedAt: new Date("2026-02-02T00:00:00.000Z"),
            answers: [
              { questionKey: "goals", answerText: "Wzrost" },
              { questionKey: "segments", answerText: "VIP" },
            ],
          }),
        },
        discoveryAnswer: {
          deleteMany: async () => {
            calls.push("deleteMany");
          },
          createMany: async ({ data }) => {
            calls.push("createMany");
            assert.equal(data.length, 10);
          },
        },
      }),
  });

  const result = await repository.saveDiscoveryOnboardingDraft({
    clientId: "client-1",
    updatedById: "user-1",
    answerCount: 10,
    isGoalsComplete: true,
    isSegmentsComplete: true,
    isSeasonalityComplete: true,
    isOfferComplete: true,
    isComplete: false,
    completedAt: null,
    answers: {
      goals: "Wzrost",
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

  assert.deepEqual(calls, ["upsert", "deleteMany", "createMany"]);
  assert.equal(result.clientId, "client-1");
  assert.equal(result.answers.length, 2);
});

test("clients repository upsertRbacPolicy zapisuje policy po role+module", async () => {
  let upsertPayload = null;
  const repository = new ClientsRepository({
    rbacPolicy: {
      upsert: async (payload) => {
        upsertPayload = payload;
        return {
          id: "policy-1",
          role: "CONTENT",
          module: "CONTENT",
          canView: true,
          canEdit: true,
          canManage: false,
          updatedAt: new Date("2026-02-02T00:00:00.000Z"),
        };
      },
    },
  });

  const result = await repository.upsertRbacPolicy({
    role: "CONTENT",
    module: "CONTENT",
    canView: true,
    canEdit: true,
    canManage: false,
  });

  assert.equal(upsertPayload.where.role_module.role, "CONTENT");
  assert.equal(upsertPayload.where.role_module.module, "CONTENT");
  assert.equal(result.canEdit, true);
});

test("clients repository createAuditLog zapisuje append-only wpis", async () => {
  const calls = [];
  const repository = new ClientsRepository({
    auditLog: {
      create: async ({ data }) => {
        calls.push(data);
        return {
          id: "audit-1",
          ...data,
          createdAt: new Date("2026-02-02T00:00:00.000Z"),
        };
      },
    },
  });

  await repository.createAuditLog({
    actorId: "user-1",
    eventName: "rbac.policy.update_denied",
    requestId: "req-1",
    entityType: "rbac_policy",
    entityId: "CONTENT:CONTENT",
    details: { reason: "owner_role_required" },
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].eventName, "rbac.policy.update_denied");
  assert.equal(calls[0].requestId, "req-1");
});

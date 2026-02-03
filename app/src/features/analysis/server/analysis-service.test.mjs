import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const modulePath = pathToFileURL(
  path.resolve("src/features/analysis/server/analysis.logic.ts"),
).href;
const adapterPath = pathToFileURL(
  path.resolve("src/server/integrations/klaviyo/klaviyo-adapter.ts"),
).href;

const { AnalysisService, AnalysisDomainError } = await import(modulePath);
const { KlaviyoAdapterError } = await import(adapterPath);

const createRepositoryMock = (overrides = {}) => ({
  findMembership: async () => ({ id: "membership-1" }),
  listRbacPoliciesByRole: async () => [{ module: "AUDIT", canView: true, canEdit: true }],
  createSyncRun: async ({ clientId, trigger, requestId, status }) => ({
    id: "run-1",
    clientId,
    trigger,
    requestId,
    status,
    startedAt: new Date("2026-02-02T10:00:00.000Z"),
    finishedAt: null,
    accountCount: 0,
    flowCount: 0,
    emailCount: 0,
    formCount: 0,
    errorCode: null,
    errorMessage: null,
  }),
  updateSyncRun: async () => undefined,
  upsertInventoryItems: async () => undefined,
  createAuditLog: async () => undefined,
  findLatestSyncRun: async () => null,
  listInventory: async () => [],
  listClientIds: async () => [{ id: "client-1" }],
  ...overrides,
});

const createAdapterMock = (overrides = {}) => ({
  fetchInventory: async () => [
    { entityType: "ACCOUNT", externalId: "acc-1", name: "Account 1", itemStatus: "OK" },
    { entityType: "FLOW", externalId: "flow-1", name: "Flow 1", itemStatus: "OK" },
    { entityType: "EMAIL", externalId: "email-1", name: "Email 1", itemStatus: "OK" },
    { entityType: "FORM", externalId: "form-1", name: "Form 1", itemStatus: "OK" },
  ],
  fetchSegments: async () => [{ externalId: "segment-1", name: "Active buyers" }],
  ...overrides,
});

test("analysis service oznacza manual sync jako OK i zapisuje inventory", async () => {
  let upsertCount = 0;
  let updatedStatus = null;

  const service = new AnalysisService(
    createRepositoryMock({
      upsertInventoryItems: async (_clientId, _syncedAt, items) => {
        upsertCount = items.length;
      },
      updateSyncRun: async (payload) => {
        updatedStatus = payload.status;
      },
    }),
    createAdapterMock(),
  );

  const result = await service.runSync("user-1", "OWNER", {
    clientId: "client-1",
    trigger: "MANUAL",
    requestId: "req-1",
  });

  assert.equal(result.data.status, "OK");
  assert.equal(upsertCount, 4);
  assert.equal(updatedStatus, "OK");
});

test("analysis service zwraca FAILED_AUTH i nie nadpisuje inventory", async () => {
  let upsertCalls = 0;

  const service = new AnalysisService(
    createRepositoryMock({
      upsertInventoryItems: async () => {
        upsertCalls += 1;
      },
    }),
    createAdapterMock({
      fetchInventory: async () => {
        throw new KlaviyoAdapterError("failed_auth", "expired");
      },
    }),
  );

  const result = await service.runSync("user-1", "STRATEGY", {
    clientId: "client-1",
    trigger: "MANUAL",
    requestId: "req-2",
  });

  assert.equal(result.data.status, "FAILED_AUTH");
  assert.equal(upsertCalls, 0);
});

test("analysis service zapisuje partial inventory przy timeout", async () => {
  let upsertCount = 0;

  const service = new AnalysisService(
    createRepositoryMock({
      upsertInventoryItems: async (_clientId, _syncedAt, items) => {
        upsertCount = items.length;
      },
    }),
    createAdapterMock({
      fetchInventory: async () => {
        throw new KlaviyoAdapterError("partial_or_timeout", "timeout", [
          { entityType: "FLOW", externalId: "flow-1", name: "Flow 1", itemStatus: "OK" },
        ]);
      },
    }),
  );

  const result = await service.runSync("user-1", "OPERATIONS", {
    clientId: "client-1",
    trigger: "MANUAL",
    requestId: "req-3",
  });

  assert.equal(result.data.status, "PARTIAL_OR_TIMEOUT");
  assert.equal(upsertCount, 1);
});

test("analysis service blokuje sync dla roli bez AUDIT edit", async () => {
  const service = new AnalysisService(
    createRepositoryMock({
      listRbacPoliciesByRole: async () => [{ module: "AUDIT", canView: true, canEdit: false }],
    }),
    createAdapterMock(),
  );

  await assert.rejects(
    () =>
      service.runSync("user-1", "CONTENT", {
        clientId: "client-1",
        trigger: "MANUAL",
        requestId: "req-4",
      }),
    (error) => {
      assert.ok(error instanceof AnalysisDomainError);
      assert.equal(error.domainCode, "forbidden");
      assert.equal(error.details?.reason, "rbac_module_edit_forbidden");
      return true;
    },
  );
});

test("analysis service zwraca status sync z licznikami i stale flag", async () => {
  const service = new AnalysisService(
    createRepositoryMock({
      findLatestSyncRun: async () => ({
        id: "run-9",
        clientId: "client-1",
        trigger: "DAILY",
        status: "OK",
        requestId: "req-9",
        startedAt: new Date("2026-02-01T10:00:00.000Z"),
        finishedAt: new Date("2026-02-01T10:01:00.000Z"),
        accountCount: 1,
        flowCount: 1,
        emailCount: 1,
        formCount: 0,
        errorCode: null,
        errorMessage: null,
      }),
      listInventory: async () => [
        {
          entityType: "ACCOUNT",
          externalId: "acc-1",
          name: "A",
          itemStatus: "OK",
          lastSyncAt: new Date("2026-02-01T10:01:00.000Z"),
        },
      ],
    }),
    createAdapterMock(),
  );

  const result = await service.getSyncStatus("user-1", "OWNER", { clientId: "client-1" });
  assert.equal(result.data.lastSyncStatus, "OK");
  assert.equal(result.data.counts.accountCount, 1);
  assert.equal(Array.isArray(result.data.inventory), true);
});

test("analysis service generuje raport luk z priorytetami", async () => {
  const service = new AnalysisService(
    createRepositoryMock({
      findLatestSyncRun: async () => ({
        id: "run-10",
        clientId: "client-1",
        trigger: "MANUAL",
        status: "OK",
        requestId: "req-10",
        startedAt: new Date(),
        finishedAt: new Date(),
        accountCount: 1,
        flowCount: 0,
        emailCount: 1,
        formCount: 1,
        errorCode: null,
        errorMessage: null,
      }),
      listInventory: async () => [
        {
          entityType: "ACCOUNT",
          externalId: "acc-1",
          name: "Account",
          itemStatus: "OK",
          lastSyncAt: new Date(),
        },
        {
          entityType: "EMAIL",
          externalId: "email-1",
          name: "Campaign Email",
          itemStatus: "OK",
          lastSyncAt: new Date(),
        },
        {
          entityType: "FORM",
          externalId: "form-1",
          name: "Popup Form",
          itemStatus: "OK",
          lastSyncAt: new Date(),
        },
      ],
    }),
    createAdapterMock(),
  );

  const report = await service.getGapReport("user-1", "OWNER", { clientId: "client-1" });
  assert.equal(Array.isArray(report.data.items), true);
  assert.ok(report.data.items.some((item) => item.status === "GAP"));
  assert.ok(report.data.items.some((item) => item.priority === "CRITICAL"));
  assert.ok(
    report.data.items.some(
      (item) => item.category === "SEGMENT" && item.status === "OK",
    ),
  );
  assert.equal(report.data.lastSyncRequestId, "req-10");
});

test("analysis service blokuje raport luk dla stalych danych sync", async () => {
  const oldDate = new Date(Date.now() - 26 * 60 * 60 * 1000);
  const service = new AnalysisService(
    createRepositoryMock({
      findLatestSyncRun: async () => ({
        id: "run-11",
        clientId: "client-1",
        trigger: "DAILY",
        status: "OK",
        requestId: "req-11",
        startedAt: oldDate,
        finishedAt: oldDate,
        accountCount: 1,
        flowCount: 1,
        emailCount: 1,
        formCount: 1,
        errorCode: null,
        errorMessage: null,
      }),
    }),
    createAdapterMock(),
  );

  await assert.rejects(
    () => service.getGapReport("user-1", "OWNER", { clientId: "client-1" }),
    (error) => {
      assert.ok(error instanceof AnalysisDomainError);
      assert.equal(error.domainCode, "validation");
      assert.equal(error.details?.reason, "stale_sync_data");
      assert.equal(error.details?.lastSyncRequestId, "req-11");
      return true;
    },
  );
});

test("analysis service oznacza segmenty jako insufficient_data przy partial sync", async () => {
  const service = new AnalysisService(
    createRepositoryMock({
      findLatestSyncRun: async () => ({
        id: "run-12",
        clientId: "client-1",
        trigger: "MANUAL",
        status: "PARTIAL_OR_TIMEOUT",
        requestId: "req-12",
        startedAt: new Date(),
        finishedAt: new Date(),
        accountCount: 1,
        flowCount: 1,
        emailCount: 0,
        formCount: 0,
        errorCode: "partial_or_timeout",
        errorMessage: "timeout",
      }),
      listInventory: async () => [
        {
          entityType: "FLOW",
          externalId: "flow-1",
          name: "Welcome flow",
          itemStatus: "OK",
          lastSyncAt: new Date(),
        },
      ],
    }),
    createAdapterMock(),
  );

  const report = await service.getGapReport("user-1", "STRATEGY", { clientId: "client-1" });
  const segmentRow = report.data.items.find((item) => item.category === "SEGMENT");
  assert.equal(segmentRow?.status, "INSUFFICIENT_DATA");

  const flowRow = report.data.items.find((item) => item.id === "flow-welcome");
  assert.equal(flowRow?.status, "INSUFFICIENT_DATA");

  const logicRow = report.data.items.find((item) => item.id === "logic-form-enabled");
  assert.equal(logicRow?.status, "INSUFFICIENT_DATA");
});

test("analysis service blokuje raport luk gdy ostatni sync byl failed_auth", async () => {
  const service = new AnalysisService(
    createRepositoryMock({
      findLatestSyncRun: async () => ({
        id: "run-13",
        clientId: "client-1",
        trigger: "MANUAL",
        status: "FAILED_AUTH",
        requestId: "req-13",
        startedAt: new Date(),
        finishedAt: new Date(),
        accountCount: 0,
        flowCount: 0,
        emailCount: 0,
        formCount: 0,
        errorCode: "failed_auth",
        errorMessage: "expired",
      }),
    }),
    createAdapterMock(),
  );

  await assert.rejects(
    () => service.getGapReport("user-1", "OWNER", { clientId: "client-1" }),
    (error) => {
      assert.ok(error instanceof AnalysisDomainError);
      assert.equal(error.domainCode, "validation");
      assert.equal(error.details?.reason, "sync_not_reliable");
      return true;
    },
  );
});

test("analysis service blokuje raport luk gdy ostatni sync jest in_progress", async () => {
  const service = new AnalysisService(
    createRepositoryMock({
      findLatestSyncRun: async () => ({
        id: "run-16",
        clientId: "client-1",
        trigger: "MANUAL",
        status: "IN_PROGRESS",
        requestId: "req-16",
        startedAt: new Date(),
        finishedAt: new Date(),
        accountCount: 0,
        flowCount: 0,
        emailCount: 0,
        formCount: 0,
        errorCode: null,
        errorMessage: null,
      }),
    }),
    createAdapterMock(),
  );

  await assert.rejects(
    () => service.getGapReport("user-1", "OWNER", { clientId: "client-1" }),
    (error) => {
      assert.ok(error instanceof AnalysisDomainError);
      assert.equal(error.domainCode, "validation");
      assert.equal(error.details?.reason, "sync_not_reliable");
      assert.equal(error.details?.syncStatus, "IN_PROGRESS");
      assert.equal(error.details?.lastSyncRequestId, "req-16");
      return true;
    },
  );
});

test("analysis service oznacza segmenty jako insufficient_data gdy endpoint segmentow zwraca blad", async () => {
  const service = new AnalysisService(
    createRepositoryMock({
      findLatestSyncRun: async () => ({
        id: "run-14",
        clientId: "client-1",
        trigger: "MANUAL",
        status: "OK",
        requestId: "req-14",
        startedAt: new Date(),
        finishedAt: new Date(),
        accountCount: 1,
        flowCount: 1,
        emailCount: 1,
        formCount: 1,
        errorCode: null,
        errorMessage: null,
      }),
    }),
    createAdapterMock({
      fetchSegments: async () => {
        throw new KlaviyoAdapterError("partial_or_timeout", "segments unavailable");
      },
    }),
  );

  const report = await service.getGapReport("user-1", "OWNER", { clientId: "client-1" });
  const segmentRow = report.data.items.find((item) => item.category === "SEGMENT");
  assert.equal(segmentRow?.status, "INSUFFICIENT_DATA");
});

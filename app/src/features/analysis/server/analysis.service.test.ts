import { beforeEach, describe, expect, it, vi } from "vitest";
import { AnalysisDomainError, AnalysisService } from "./analysis.service";
import type { AnalysisRepository } from "./analysis.repository";
import type { KlaviyoAdapter } from "~/server/integrations/klaviyo/klaviyo-adapter";

describe("AnalysisService.getOptimizationAreas", () => {
  let analysisService: AnalysisService;
  let mockRepository: Partial<AnalysisRepository>;
  let mockAdapter: Partial<KlaviyoAdapter>;

  beforeEach(() => {
    mockRepository = {
      findLatestSyncRun: vi.fn(),
      listInventory: vi.fn(),
      findMembership: vi.fn(),
      listRbacPoliciesByRole: vi.fn(),
      createSyncRun: vi.fn(),
      updateSyncRun: vi.fn(),
      upsertInventoryItems: vi.fn(),
      createAuditLog: vi.fn(),
      listClientIds: vi.fn(),
    };
    mockAdapter = {
      fetchInventory: vi.fn(),
      fetchSegments: vi.fn(),
    };

    analysisService = new AnalysisService({
      repository: mockRepository as AnalysisRepository,
      adapter: mockAdapter as KlaviyoAdapter,
    });
  });

  it("returns deterministic ranking with stable tie-breakers (AC1)", async () => {
    const now = new Date("2026-02-01T12:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(now);

    mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
    mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
      { module: "AUDIT", canView: true, canEdit: false, canManage: false },
    ]);
    mockRepository.findLatestSyncRun = vi.fn().mockResolvedValue({
      status: "OK",
      requestId: "sync-1",
      startedAt: new Date("2026-01-31T12:00:00.000Z"),
    });
    mockRepository.listInventory = vi.fn().mockResolvedValue([
      { entityType: "FLOW", externalId: "f1", name: "Alpha Flow", itemStatus: "GAP", lastSyncAt: now },
      { entityType: "FLOW", externalId: "f2", name: "Beta Flow", itemStatus: "GAP", lastSyncAt: now },
      { entityType: "FLOW", externalId: "f3", name: "Gamma Flow", itemStatus: "disabled", lastSyncAt: now },
      { entityType: "ACCOUNT", externalId: "a1", name: "Logic A", itemStatus: "active", lastSyncAt: now },
      { entityType: "ACCOUNT", externalId: "a2", name: "Logic B", itemStatus: "active", lastSyncAt: now },
    ]);

    const result = await analysisService.getOptimizationAreas("u1", "OWNER", {
      clientId: "client-1",
      requestId: "req-1",
      limit: 10,
      showPartialOnTimeout: false,
    });

    expect(result.meta.status).toBe("OK");
    expect(result.data.areas.length).toBeGreaterThanOrEqual(3);

    const names = result.data.areas.map((area) => area.name);
    expect(names.indexOf("Alpha Flow")).toBeLessThan(names.indexOf("Beta Flow"));
    expect(result.data.summary?.totalAreas).toBe(result.data.areas.length);

    vi.useRealTimers();
  });

  it("returns insufficient_data_for_priority with missingData guidance (AC2)", async () => {
    mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
    mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
      { module: "AUDIT", canView: true, canEdit: false, canManage: false },
    ]);
    mockRepository.findLatestSyncRun = vi.fn().mockResolvedValue({
      status: "FAILED_AUTH",
      requestId: "sync-2",
      startedAt: new Date("2026-02-01T12:00:00.000Z"),
    });
    mockRepository.listInventory = vi.fn().mockResolvedValue([]);

    const result = await analysisService.getOptimizationAreas("u1", "OWNER", {
      clientId: "client-1",
      requestId: "req-2",
      limit: 10,
      showPartialOnTimeout: false,
    });

    expect(result.meta.status).toBe("insufficient_data_for_priority");
    expect(result.meta.hasInsufficientData).toBe(true);
    expect(result.meta.missingData).toContain("valid_klaviyo_auth");
    expect(result.meta.missingData).toContain("flows");
    expect(result.data.areas).toHaveLength(0);
  });

  it("returns timed_out with partial areas and requestId preserved (AC3)", async () => {
    const now = new Date("2026-02-01T12:00:00.000Z");
    mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
    mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
      { module: "AUDIT", canView: true, canEdit: false, canManage: false },
    ]);
    mockRepository.findLatestSyncRun = vi.fn().mockResolvedValue({
      status: "PARTIAL_OR_TIMEOUT",
      requestId: "sync-3",
      startedAt: new Date("2026-02-01T11:00:00.000Z"),
    });
    mockRepository.listInventory = vi.fn().mockResolvedValue([
      { entityType: "FLOW", externalId: "f1", name: "Flow 1", itemStatus: "GAP", lastSyncAt: now },
      { entityType: "FLOW", externalId: "f2", name: "Flow 2", itemStatus: "disabled", lastSyncAt: now },
      { entityType: "EMAIL", externalId: "e1", name: "Email 1", itemStatus: "GAP", lastSyncAt: now },
      { entityType: "EMAIL", externalId: "e2", name: "Email 2", itemStatus: "active", lastSyncAt: now },
    ]);

    const result = await analysisService.getOptimizationAreas("u1", "OWNER", {
      clientId: "client-1",
      requestId: "req-timeout",
      limit: 4,
      showPartialOnTimeout: true,
    });

    expect(result.meta.status).toBe("timed_out");
    expect(result.meta.hasTimedOut).toBe(true);
    expect(result.meta.requestId).toBe("req-timeout");
    expect(result.data.areas.length).toBeGreaterThan(0);
    expect(result.data.areas.length).toBeLessThan(4);
    expect(result.data.areas.every((area) => area.status === "timed_out")).toBe(true);
  });

  it("throws forbidden when user has no membership", async () => {
    mockRepository.findMembership = vi.fn().mockResolvedValue(null);
    mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([]);
    mockRepository.findLatestSyncRun = vi.fn().mockResolvedValue(null);
    mockRepository.listInventory = vi.fn().mockResolvedValue([]);

    await expect(
      analysisService.getOptimizationAreas("u1", "OWNER", {
        clientId: "client-1",
        requestId: "req-x",
      }),
    ).rejects.toThrow(AnalysisDomainError);
  });

  describe("getGapReport (Story 2.2 compatibility)", () => {
    it("returns gap report with sync request id and mapped categories", async () => {
      const now = new Date("2026-02-01T12:00:00.000Z");
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.findLatestSyncRun = vi.fn().mockResolvedValue({
        status: "OK",
        requestId: "sync-gap-1",
        startedAt: new Date("2026-02-01T10:00:00.000Z"),
      });
      mockRepository.listInventory = vi.fn().mockResolvedValue([
        { entityType: "FLOW", externalId: "f1", name: "Flow Gap", itemStatus: "GAP", lastSyncAt: now },
        { entityType: "EMAIL", externalId: "e1", name: "Email Gap", itemStatus: "GAP", lastSyncAt: now },
      ]);

      const result = await analysisService.getGapReport("u1", "OWNER", { clientId: "client-1" });

      expect(result.meta.lastSyncRequestId).toBe("sync-gap-1");
      expect(result.data.items).toHaveLength(2);
      expect(result.data.items[0]?.category).toBe("FLOW");
      expect(result.data.items[1]?.category).toBe("SEGMENT");
    });

    it("rejects FAILED_AUTH sync status", async () => {
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.findLatestSyncRun = vi.fn().mockResolvedValue({
        status: "FAILED_AUTH",
        requestId: "sync-gap-2",
        startedAt: new Date("2026-02-01T10:00:00.000Z"),
      });
      mockRepository.listInventory = vi.fn().mockResolvedValue([]);

      await expect(
        analysisService.getGapReport("u1", "OWNER", { clientId: "client-1" }),
      ).rejects.toThrow("INVALID_SYNC_STATUS");
    });
  });

  describe("runSync (Story 2.1 compatibility)", () => {
    it("transitions IN_PROGRESS to OK and persists requestId", async () => {
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "AUDIT", canView: true, canEdit: true, canManage: false },
      ]);
      mockRepository.createSyncRun = vi.fn().mockResolvedValue({ id: "run-1" });
      mockRepository.updateSyncRun = vi.fn().mockResolvedValue({});
      mockRepository.upsertInventoryItems = vi.fn().mockResolvedValue(undefined);
      mockRepository.createAuditLog = vi.fn().mockResolvedValue({});
      mockAdapter.fetchInventory = vi.fn().mockResolvedValue([
        { entityType: "FLOW", externalId: "f1", name: "Flow 1", itemStatus: "OK" },
      ]);
      mockAdapter.fetchSegments = vi.fn().mockResolvedValue([
        { externalId: "s1", name: "Segment 1" },
      ]);

      const result = await analysisService.runSync("u1", "OWNER", {
        clientId: "client-1",
        trigger: "MANUAL",
        requestId: "req-sync-1",
      });

      expect(mockRepository.createSyncRun).toHaveBeenCalledWith({
        clientId: "client-1",
        trigger: "MANUAL",
        status: "IN_PROGRESS",
        requestId: "req-sync-1",
      });
      expect(mockRepository.updateSyncRun).toHaveBeenCalledWith(
        expect.objectContaining({
          runId: "run-1",
          status: "OK",
        }),
      );
      expect(result.data.requestId).toBe("req-sync-1");
      expect(result.data.status).toBe("OK");
    });
  });
});

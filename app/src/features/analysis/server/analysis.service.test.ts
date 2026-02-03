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
      findDiscoveryContext: vi.fn(),
      listLatestStrategicPriorities: vi.fn(),
      findDiscoveryAnswers: vi.fn(),
      listLatestEmailStrategyAudit: vi.fn(),
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

  describe("getContextInsights (Story 2.4)", () => {
    it("returns status ok with context-linked actionable insights (AC1)", async () => {
      const now = new Date("2026-02-02T12:00:00.000Z");
      vi.useFakeTimers();
      vi.setSystemTime(now);

      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "AUDIT", canView: true, canEdit: false, canManage: false },
      ]);
      mockRepository.findLatestSyncRun = vi.fn().mockResolvedValue({
        status: "OK",
        requestId: "sync-i-1",
        startedAt: new Date("2026-02-01T12:00:00.000Z"),
        flowCount: 3,
        emailCount: 1,
      });
      mockRepository.listInventory = vi.fn().mockResolvedValue([
        { entityType: "FLOW", externalId: "f1", name: "Flow 1", itemStatus: "GAP", lastSyncAt: now },
        { entityType: "FLOW", externalId: "f2", name: "Flow 2", itemStatus: "disabled", lastSyncAt: now },
        { entityType: "FLOW", externalId: "f3", name: "Flow 3", itemStatus: "GAP", lastSyncAt: now },
        { entityType: "EMAIL", externalId: "e1", name: "Email 1", itemStatus: "OK", lastSyncAt: now },
      ]);
      mockRepository.findDiscoveryContext = vi.fn().mockResolvedValue({
        goals: ["Wzrost konwersji"],
      });
      mockRepository.listLatestStrategicPriorities = vi.fn().mockResolvedValue([
        { id: "d1", content: "Priorytet retencyjny", createdAt: now },
      ]);

      const result = await analysisService.getContextInsights("u1", "OWNER", {
        clientId: "client-1",
        requestId: "req-insight-ok",
        limit: 3,
      });

      expect(result.meta.status).toBe("ok");
      expect(result.data.insights.length).toBeGreaterThan(0);
      expect(result.data.insights.every((item) => item.status === "ok")).toBe(true);
      expect(result.data.insights.every((item) => item.recommendedAction !== null)).toBe(true);
      expect(result.data.insights[0]?.linkedClientGoals).toContain("Wzrost konwersji");

      vi.useRealTimers();
    });

    it("returns draft_low_confidence with missingContext when client context is incomplete (AC2)", async () => {
      const now = new Date("2026-02-02T12:00:00.000Z");
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "AUDIT", canView: true, canEdit: false, canManage: false },
      ]);
      mockRepository.findLatestSyncRun = vi.fn().mockResolvedValue({
        status: "OK",
        requestId: "sync-i-2",
        startedAt: new Date("2026-02-01T12:00:00.000Z"),
        flowCount: 3,
        emailCount: 0,
      });
      mockRepository.listInventory = vi.fn().mockResolvedValue([
        { entityType: "FLOW", externalId: "f1", name: "Flow 1", itemStatus: "GAP", lastSyncAt: now },
        { entityType: "FLOW", externalId: "f2", name: "Flow 2", itemStatus: "GAP", lastSyncAt: now },
        { entityType: "FLOW", externalId: "f3", name: "Flow 3", itemStatus: "GAP", lastSyncAt: now },
      ]);
      mockRepository.findDiscoveryContext = vi.fn().mockResolvedValue({ goals: [] });
      mockRepository.listLatestStrategicPriorities = vi.fn().mockResolvedValue([]);

      const result = await analysisService.getContextInsights("u1", "OWNER", {
        clientId: "client-1",
        requestId: "req-insight-draft",
        limit: 3,
      });

      expect(result.meta.status).toBe("draft_low_confidence");
      expect(result.data.insights[0]?.missingContext).toContain("linkedClientGoals");
      expect(result.data.insights[0]?.missingContext).toContain("linkedClientPriorities");
      expect(result.data.insights[0]?.actionability).toBe("needs_human_validation");
    });

    it("returns source_conflict with null recommendation and conflict details (AC3)", async () => {
      const now = new Date("2026-02-02T12:00:00.000Z");
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "AUDIT", canView: true, canEdit: false, canManage: false },
      ]);
      mockRepository.findLatestSyncRun = vi.fn().mockResolvedValue({
        status: "OK",
        requestId: "sync-i-3",
        startedAt: new Date("2026-02-01T12:00:00.000Z"),
        flowCount: 1,
        emailCount: 1,
      });
      mockRepository.listInventory = vi.fn().mockResolvedValue([
        { entityType: "FLOW", externalId: "f1", name: "Flow 1", itemStatus: "GAP", lastSyncAt: now },
        { entityType: "FLOW", externalId: "f2", name: "Flow 2", itemStatus: "GAP", lastSyncAt: now },
        { entityType: "FLOW", externalId: "f3", name: "Flow 3", itemStatus: "GAP", lastSyncAt: now },
        { entityType: "EMAIL", externalId: "e1", name: "Email 1", itemStatus: "GAP", lastSyncAt: now },
        { entityType: "EMAIL", externalId: "e2", name: "Email 2", itemStatus: "GAP", lastSyncAt: now },
        { entityType: "EMAIL", externalId: "e3", name: "Email 3", itemStatus: "GAP", lastSyncAt: now },
      ]);
      mockRepository.findDiscoveryContext = vi.fn().mockResolvedValue({
        goals: ["Wzrost konwersji"],
      });
      mockRepository.listLatestStrategicPriorities = vi.fn().mockResolvedValue([
        { id: "d1", content: "Priorytet retencyjny", createdAt: now },
      ]);

      const result = await analysisService.getContextInsights("u1", "OWNER", {
        clientId: "client-1",
        requestId: "req-insight-conflict",
        limit: 3,
      });

      expect(result.meta.status).toBe("source_conflict");
      expect(result.data.insights[0]?.status).toBe("source_conflict");
      expect(result.data.insights[0]?.recommendedAction).toBeNull();
      expect(result.data.insights[0]?.conflictDetails?.sourceA).toBe("sync_inventory");
      expect(result.data.insights[0]?.conflictDetails?.sourceB).toBe("cached_insights");
    });
  });

  describe("generateEmailStrategy (Story 3.1)", () => {
    it("returns complete versioned strategy when discovery and audit are complete (AC1)", async () => {
      const now = new Date("2026-02-03T12:00:00.000Z");
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "AUDIT", canView: true, canEdit: false, canManage: false },
      ]);
      mockRepository.findLatestSyncRun = vi.fn().mockResolvedValue({
        status: "OK",
        requestId: "sync-s-1",
        startedAt: new Date("2026-02-03T10:00:00.000Z"),
        flowCount: 3,
        emailCount: 3,
      });
      mockRepository.findDiscoveryAnswers = vi.fn().mockResolvedValue({
        goals: ["Wzrost konwersji"],
        segments: ["VIP"],
        brandTone: "konkretny",
        primaryKpis: ["conversion_rate"],
      });
      mockRepository.listInventory = vi.fn().mockResolvedValue([
        { entityType: "FLOW", externalId: "f1", name: "Flow 1", itemStatus: "GAP", lastSyncAt: now },
        { entityType: "FLOW", externalId: "f2", name: "Flow 2", itemStatus: "GAP", lastSyncAt: now },
        { entityType: "FLOW", externalId: "f3", name: "Flow 3", itemStatus: "disabled", lastSyncAt: now },
        { entityType: "EMAIL", externalId: "e1", name: "Email 1", itemStatus: "GAP", lastSyncAt: now },
        { entityType: "EMAIL", externalId: "e2", name: "Email 2", itemStatus: "GAP", lastSyncAt: now },
      ]);
      mockRepository.findDiscoveryContext = vi.fn().mockResolvedValue({ goals: ["Wzrost konwersji"] });
      mockRepository.listLatestStrategicPriorities = vi.fn().mockResolvedValue([
        { id: "d1", content: "Priorytet retencyjny", createdAt: now },
      ]);
      mockRepository.listLatestEmailStrategyAudit = vi.fn().mockResolvedValue([]);
      mockRepository.createAuditLog = vi.fn().mockResolvedValue({});

      const result = await analysisService.generateEmailStrategy("u1", "OWNER", {
        clientId: "client-1",
        requestId: "req-strategy-ok",
      });

      expect(result.data.strategy.status).toBe("ok");
      expect(result.data.strategy.version).toBe(1);
      expect(result.data.strategy.goals).toContain("Wzrost konwersji");
      expect(result.data.strategy.segments).toContain("VIP");
      expect(mockRepository.createAuditLog).toHaveBeenCalled();
    });

    it("returns blocked_preconditions for multi-condition precondition failure", async () => {
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "AUDIT", canView: true, canEdit: false, canManage: false },
      ]);
      mockRepository.findLatestSyncRun = vi.fn().mockResolvedValue({
        status: "FAILED_AUTH",
        requestId: "sync-s-2",
        startedAt: new Date("2026-02-03T10:00:00.000Z"),
      });
      mockRepository.findDiscoveryAnswers = vi.fn().mockResolvedValue({
        goals: [],
        segments: [],
        brandTone: null,
        primaryKpis: [],
      });
      mockRepository.listLatestEmailStrategyAudit = vi.fn().mockResolvedValue([]);

      const result = await analysisService.generateEmailStrategy("u1", "OWNER", {
        clientId: "client-1",
        requestId: "req-strategy-blocked",
      });

      expect(result.data.strategy.status).toBe("blocked_preconditions");
      expect(result.data.strategy.missingPreconditions).toContain("discovery.goals");
      expect(result.data.strategy.missingPreconditions).toContain("discovery.segments");
      expect(result.data.strategy.missingPreconditions).toContain("audit.sync_ok");
      expect(result.data.strategy.missingPreconditions).toContain("audit.optimization_available");
      expect(mockRepository.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: "req-strategy-blocked",
          entityId: "client-1",
          details: expect.objectContaining({
            status: "blocked_preconditions",
            missingPreconditions: expect.arrayContaining([
              "discovery.goals",
              "discovery.segments",
              "audit.sync_ok",
              "audit.optimization_available",
            ]),
          }),
        }),
      );
    });

    it("returns blocked_preconditions for single-condition failure", async () => {
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "AUDIT", canView: true, canEdit: false, canManage: false },
      ]);
      mockRepository.findLatestSyncRun = vi.fn().mockResolvedValue({
        status: "OK",
        requestId: "sync-single",
        startedAt: new Date("2026-02-03T10:00:00.000Z"),
      });
      mockRepository.findDiscoveryAnswers = vi.fn().mockResolvedValue({
        goals: ["Wzrost konwersji"],
        segments: ["VIP"],
        brandTone: "konkretny",
        primaryKpis: ["conversion_rate"],
      });
      mockRepository.listInventory = vi.fn().mockResolvedValue([]);
      mockRepository.listLatestEmailStrategyAudit = vi.fn().mockResolvedValue([]);
      mockRepository.createAuditLog = vi.fn().mockResolvedValue({});

      const result = await analysisService.generateEmailStrategy("u1", "OWNER", {
        clientId: "client-1",
        requestId: "req-strategy-single",
      });

      expect(result.data.strategy.status).toBe("blocked_preconditions");
      expect(result.data.strategy.missingPreconditions).toEqual(["audit.optimization_available"]);
      expect(result.data.strategy.requestId).toBe("req-strategy-single");
      expect(mockRepository.createAuditLog).toHaveBeenCalledTimes(1);
      expect(mockRepository.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: "req-strategy-single",
          details: expect.objectContaining({
            clientId: "client-1",
            missingPreconditions: ["audit.optimization_available"],
          }),
        }),
      );
    });

    it("returns blocked_preconditions for edge precondition combination", async () => {
      const now = new Date("2026-02-03T12:00:00.000Z");
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "AUDIT", canView: true, canEdit: false, canManage: false },
      ]);
      mockRepository.findLatestSyncRun = vi.fn().mockResolvedValue({
        status: "OK",
        requestId: "sync-edge",
        startedAt: new Date("2026-02-03T10:00:00.000Z"),
      });
      mockRepository.findDiscoveryAnswers = vi.fn().mockResolvedValue({
        goals: ["Wzrost konwersji"],
        segments: [],
        brandTone: "konkretny",
        primaryKpis: ["conversion_rate"],
      });
      mockRepository.listInventory = vi.fn().mockResolvedValue([
        { entityType: "FLOW", externalId: "f1", name: "Flow 1", itemStatus: "GAP", lastSyncAt: now },
      ]);
      mockRepository.listLatestEmailStrategyAudit = vi.fn().mockResolvedValue([]);
      mockRepository.createAuditLog = vi.fn().mockResolvedValue({});

      const result = await analysisService.generateEmailStrategy("u1", "OWNER", {
        clientId: "client-1",
        requestId: "req-strategy-edge",
      });

      expect(result.data.strategy.status).toBe("blocked_preconditions");
      expect(result.data.strategy.missingPreconditions).toEqual(["discovery.segments"]);
    });

    it("returns in_progress_or_timeout and reuses resumable record (AC3)", async () => {
      const now = new Date("2026-02-03T12:00:00.000Z");
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "AUDIT", canView: true, canEdit: false, canManage: false },
      ]);
      mockRepository.findLatestSyncRun = vi.fn().mockResolvedValue({
        status: "OK",
        requestId: "sync-s-3",
        startedAt: new Date("2026-02-03T10:00:00.000Z"),
        flowCount: 10,
        emailCount: 10,
      });
      mockRepository.findDiscoveryAnswers = vi.fn().mockResolvedValue({
        goals: ["Wzrost konwersji"],
        segments: ["VIP"],
        brandTone: "konkretny",
        primaryKpis: ["conversion_rate"],
      });
      mockRepository.listInventory = vi.fn().mockResolvedValue([
        { entityType: "FLOW", externalId: "f1", name: "Flow 1", itemStatus: "GAP", lastSyncAt: now },
        { entityType: "FLOW", externalId: "f2", name: "Flow 2", itemStatus: "GAP", lastSyncAt: now },
        { entityType: "FLOW", externalId: "f3", name: "Flow 3", itemStatus: "GAP", lastSyncAt: now },
        { entityType: "FLOW", externalId: "f4", name: "Flow 4", itemStatus: "GAP", lastSyncAt: now },
        { entityType: "FLOW", externalId: "f5", name: "Flow 5", itemStatus: "GAP", lastSyncAt: now },
        { entityType: "FLOW", externalId: "f6", name: "Flow 6", itemStatus: "GAP", lastSyncAt: now },
        { entityType: "FLOW", externalId: "f7", name: "Flow 7", itemStatus: "GAP", lastSyncAt: now },
        { entityType: "FLOW", externalId: "f8", name: "Flow 8", itemStatus: "GAP", lastSyncAt: now },
      ]);
      mockRepository.findDiscoveryContext = vi.fn().mockResolvedValue({ goals: ["Wzrost konwersji"] });
      mockRepository.listLatestStrategicPriorities = vi.fn().mockResolvedValue([
        { id: "d1", content: "Priorytet retencyjny", createdAt: now },
      ]);
      mockRepository.listLatestEmailStrategyAudit = vi.fn().mockResolvedValue([]);
      mockRepository.createAuditLog = vi.fn().mockResolvedValue({});

      const first = await analysisService.generateEmailStrategy("u1", "OWNER", {
        clientId: "client-1",
        requestId: "req-strategy-timeout-1",
      });
      expect(first.data.strategy.status).toBe("in_progress_or_timeout");
      expect(first.data.strategy.retryHint).toBeTruthy();

      mockRepository.listLatestEmailStrategyAudit = vi.fn().mockResolvedValue([
        {
          id: "a1",
          requestId: "req-strategy-timeout-1",
          createdAt: now,
          details: first.data.strategy,
        },
      ]);

      const second = await analysisService.generateEmailStrategy("u1", "OWNER", {
        clientId: "client-1",
        requestId: "req-strategy-timeout-2",
      });
      expect(second.data.strategy.status).toBe("in_progress_or_timeout");
      expect(second.data.strategy.requestId).toBe("req-strategy-timeout-1");
    });
  });
});

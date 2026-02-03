import { beforeEach, describe, expect, it, vi } from "vitest";
import { AnalysisDomainError, AnalysisService } from "./analysis.service";
import type { AnalysisRepository } from "./analysis.repository";
import type { KlaviyoAdapter } from "~/server/integrations/klaviyo/klaviyo-adapter";
import { DocumentationExportError, type DocumentationExportAdapterPort } from "~/server/integrations/documentation/documentation-export-adapter";

describe("AnalysisService.getOptimizationAreas", () => {
  let analysisService: AnalysisService;
  let mockRepository: Partial<AnalysisRepository>;
  let mockAdapter: Partial<KlaviyoAdapter>;
  let mockDocumentationExportAdapter: Partial<DocumentationExportAdapterPort>;

  beforeEach(() => {
    mockRepository = {
      findLatestSyncRun: vi.fn(),
      listInventory: vi.fn(),
      findMembership: vi.fn(),
      listRbacPoliciesByRole: vi.fn(),
      createSyncRun: vi.fn(),
      updateSyncRun: vi.fn(),
      persistSyncRunWithInventory: vi.fn(),
      upsertInventoryItems: vi.fn(),
      createAuditLog: vi.fn(),
      listClientIds: vi.fn(),
      findDiscoveryContext: vi.fn(),
      listLatestStrategicPriorities: vi.fn(),
      findDiscoveryAnswers: vi.fn(),
      findAuditProductContext: vi.fn(),
      listLatestEmailStrategyAudit: vi.fn(),
      listLatestFlowPlanAudit: vi.fn(),
      listLatestCampaignCalendarAudit: vi.fn(),
      listLatestSegmentProposalAudit: vi.fn(),
      listLatestCommunicationBriefAudit: vi.fn(),
      listLatestEmailDraftAudit: vi.fn(),
      listLatestPersonalizedEmailDraftAudit: vi.fn(),
      listLatestImplementationChecklistAudit: vi.fn(),
      listLatestClientAuditLogs: vi.fn(),
      withStrategyGenerationLock: async <T>(_clientId: string, handler: () => Promise<T>) => handler(),
      withContentGenerationLock: async <T>(_lockKey: string, handler: () => Promise<T>) => handler(),
    };
    mockAdapter = {
      fetchInventory: vi.fn(),
      fetchSegments: vi.fn(),
    };
    mockDocumentationExportAdapter = {
      exportToNotion: vi.fn(),
      exportToGoogleDocs: vi.fn(),
    };

    analysisService = new AnalysisService({
      repository: mockRepository as AnalysisRepository,
      adapter: mockAdapter as KlaviyoAdapter,
      documentationExportAdapter: mockDocumentationExportAdapter as DocumentationExportAdapterPort,
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
      mockRepository.persistSyncRunWithInventory = vi.fn().mockResolvedValue(undefined);
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
      expect(mockRepository.persistSyncRunWithInventory).toHaveBeenCalledWith(
        expect.objectContaining({
          runId: "run-1",
          clientId: "client-1",
          status: "OK",
        }),
      );
      expect(result.data.requestId).toBe("req-sync-1");
      expect(result.data.status).toBe("OK");
    });

    it("does not bypass RBAC for OPERATIONS role", async () => {
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "AUDIT", canView: true, canEdit: false, canManage: false },
      ]);

      await expect(
        analysisService.runSync("u1", "OPERATIONS", {
          clientId: "client-1",
          trigger: "MANUAL",
          requestId: "req-sync-ops",
        }),
      ).rejects.toThrow(AnalysisDomainError);
    });

    it("runDailySyncForAllClients skips client with IN_PROGRESS run", async () => {
      mockRepository.listClientIds = vi.fn().mockResolvedValue([{ id: "client-1" }]);
      mockRepository.findLatestSyncRun = vi.fn().mockResolvedValue({
        status: "IN_PROGRESS",
        requestId: "running-req",
      });

      const result = await analysisService.runDailySyncForAllClients("daily-1");
      expect(result.data.results).toHaveLength(1);
      const firstResult = result.data.results[0]?.data as { skipped?: boolean; requestId: string } | undefined;
      expect(firstResult?.skipped).toBe(true);
      expect(firstResult?.requestId).toBe("running-req");
    });
  });

  describe("getSyncStatus hardening", () => {
    it("returns fallback requestId when latest sync requestId is missing", async () => {
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "AUDIT", canView: true, canEdit: false, canManage: false },
      ]);
      mockRepository.findLatestSyncRun = vi.fn().mockResolvedValue({
        id: "run-req-null",
        status: "OK",
        requestId: "",
        startedAt: new Date("2026-02-01T10:00:00.000Z"),
        finishedAt: new Date("2026-02-01T11:00:00.000Z"),
        accountCount: 1,
        flowCount: 1,
        emailCount: 1,
        formCount: 1,
      });

      const result = await analysisService.getSyncStatus("u1", "OWNER", {
        clientId: "client-1",
      });
      expect(result.data.requestId).toContain("sync-status-missing-request-id");
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
      expect(result.data.strategy.versionMeta.author).toBe("u1");
      expect(result.data.strategy.versionMeta.source).toBe("strategy.email.generated");
      expect(result.data.strategy.versionMeta.type).toBe("strategy");
      expect(mockRepository.createAuditLog).toHaveBeenCalled();
      expect(mockRepository.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.objectContaining({
            timestamp: expect.any(String),
            userId: "u1",
            actionType: "strategy.email.generated",
            artifactId: "req-strategy-ok",
            diff: expect.any(Object),
          }),
        }),
      );
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

    it("prevents race condition with lock and reuses resumable record for concurrent calls", async () => {
      const now = new Date("2026-02-03T12:00:00.000Z");
      const auditRecords: Array<{ id: string; requestId: string; createdAt: Date; details: unknown }> = [];
      let lock = Promise.resolve();
      mockRepository.withStrategyGenerationLock = (vi.fn(async <T>(_clientId: string, handler: () => Promise<T>) => {
        const current = lock.then(() => handler());
        lock = current.then(() => undefined);
        return current;
      }) as AnalysisRepository["withStrategyGenerationLock"]);

      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "AUDIT", canView: true, canEdit: false, canManage: false },
      ]);
      mockRepository.findLatestSyncRun = vi.fn().mockResolvedValue({
        status: "OK",
        requestId: "sync-race",
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
      mockRepository.listInventory = vi.fn().mockResolvedValue(
        Array.from({ length: 8 }, (_, idx) => ({
          entityType: "FLOW",
          externalId: `f${idx + 1}`,
          name: `Flow ${idx + 1}`,
          itemStatus: "GAP",
          lastSyncAt: now,
        })),
      );
      mockRepository.findDiscoveryContext = vi.fn().mockResolvedValue({ goals: ["Wzrost konwersji"] });
      mockRepository.listLatestStrategicPriorities = vi.fn().mockResolvedValue([
        { id: "d1", content: "Priorytet retencyjny", createdAt: now },
      ]);
      mockRepository.listLatestEmailStrategyAudit = vi.fn().mockImplementation(async () => [...auditRecords]);
      mockRepository.createAuditLog = vi.fn().mockImplementation(async (payload: { requestId: string; details: unknown }) => {
        auditRecords.unshift({
          id: `a-${auditRecords.length + 1}`,
          requestId: payload.requestId,
          createdAt: now,
          details: payload.details,
        });
        return {};
      });

      const [first, second] = await Promise.all([
        analysisService.generateEmailStrategy("u1", "OWNER", {
          clientId: "client-1",
          requestId: "req-race-1",
        }),
        analysisService.generateEmailStrategy("u1", "OWNER", {
          clientId: "client-1",
          requestId: "req-race-2",
        }),
      ]);

      expect(first.data.strategy.status).toBe("in_progress_or_timeout");
      expect(second.data.strategy.status).toBe("in_progress_or_timeout");
      expect(second.data.strategy.requestId).toBe(first.data.strategy.requestId);
      expect(mockRepository.createAuditLog).toHaveBeenCalledTimes(1);
    });
  });

  describe("generateFlowPlan (Story 3.2)", () => {
    it("returns flow plan with items when approved strategy exists (AC1)", async () => {
      const now = new Date("2026-02-04T12:00:00.000Z");
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "AUDIT", canView: true, canEdit: false, canManage: false },
      ]);
      mockRepository.listLatestEmailStrategyAudit = vi.fn().mockResolvedValue([
        {
          id: "s1",
          requestId: "strategy-ok-1",
          createdAt: now,
          details: {
            clientId: "client-1",
            version: 1,
            status: "ok",
            goals: ["Wzrost konwersji"],
            segments: ["VIP"],
            tone: "konkretny",
            priorities: ["Welcome sequence", "Post purchase"],
            kpis: ["conversion_rate"],
            requestId: "strategy-ok-1",
            lastSyncRequestId: "sync-1",
            generatedAt: now.toISOString(),
            missingPreconditions: [],
          },
        },
      ]);
      mockRepository.listLatestFlowPlanAudit = vi.fn().mockResolvedValue([]);
      mockRepository.createAuditLog = vi.fn().mockResolvedValue({});

      const result = await analysisService.generateFlowPlan("u1", "OWNER", {
        clientId: "client-1",
        requestId: "flow-req-1",
      });

      expect(result.data.flowPlan.status).toBe("ok");
      expect(result.data.flowPlan.items.length).toBeGreaterThan(0);
      expect(result.data.flowPlan.items[0]?.trigger).toBeTruthy();
      expect(result.data.flowPlan.versionMeta.author).toBe("u1");
      expect(result.data.flowPlan.versionMeta.source).toBe("strategy.flow_plan.generated");
      expect(result.data.flowPlan.versionMeta.type).toBe("flow");
      expect(mockRepository.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          eventName: "strategy.flow_plan.generated",
          requestId: "flow-req-1",
          details: expect.objectContaining({
            timestamp: expect.any(String),
            userId: "u1",
            actionType: "strategy.flow_plan.generated",
            artifactId: "flow-req-1",
            diff: expect.any(Object),
          }),
        }),
      );
    });

    it("returns precondition_not_approved when strategy is missing or not approved (AC2)", async () => {
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "AUDIT", canView: true, canEdit: false, canManage: false },
      ]);
      mockRepository.listLatestEmailStrategyAudit = vi.fn().mockResolvedValue([]);
      mockRepository.listLatestFlowPlanAudit = vi.fn().mockResolvedValue([]);

      const result = await analysisService.generateFlowPlan("u1", "OWNER", {
        clientId: "client-1",
        requestId: "flow-req-2",
      });

      expect(result.data.flowPlan.status).toBe("precondition_not_approved");
      expect(result.data.flowPlan.requiredStep).toBe("generate_and_approve_strategy");
      expect(result.data.flowPlan.items).toHaveLength(0);
    });

    it("returns failed_persist when save to audit log fails (AC3)", async () => {
      const now = new Date("2026-02-04T12:00:00.000Z");
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "AUDIT", canView: true, canEdit: false, canManage: false },
      ]);
      mockRepository.listLatestEmailStrategyAudit = vi.fn().mockResolvedValue([
        {
          id: "s1",
          requestId: "strategy-ok-2",
          createdAt: now,
          details: {
            clientId: "client-1",
            version: 1,
            status: "ok",
            goals: ["Wzrost konwersji"],
            segments: ["VIP"],
            tone: "konkretny",
            priorities: ["Welcome sequence"],
            kpis: ["conversion_rate"],
            requestId: "strategy-ok-2",
            lastSyncRequestId: "sync-1",
            generatedAt: now.toISOString(),
            missingPreconditions: [],
          },
        },
      ]);
      mockRepository.listLatestFlowPlanAudit = vi.fn().mockResolvedValue([]);
      mockRepository.createAuditLog = vi.fn().mockRejectedValue(new Error("persist_fail"));

      const result = await analysisService.generateFlowPlan("u1", "OWNER", {
        clientId: "client-1",
        requestId: "flow-req-3",
      });

      expect(result.data.flowPlan.status).toBe("failed_persist");
      expect(result.data.flowPlan.items).toHaveLength(0);
      expect(result.data.flowPlan.requiredStep).toBe("retry_generate_flow_plan");
    });
  });

  describe("generateCampaignCalendar (Story 3.3)", () => {
    it("returns minimum 4-week calendar when strategy and seasonality are available (AC1)", async () => {
      const now = new Date("2026-02-05T12:00:00.000Z");
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "AUDIT", canView: true, canEdit: true, canManage: false },
      ]);
      mockRepository.listLatestEmailStrategyAudit = vi.fn().mockResolvedValue([
        {
          id: "s1",
          requestId: "strategy-1",
          createdAt: now,
          details: {
            clientId: "client-1",
            version: 1,
            status: "ok",
            goals: ["Wzrost konwersji"],
            segments: ["VIP"],
            tone: "konkretny",
            priorities: ["Welcome"],
            kpis: ["conversion_rate"],
            requestId: "strategy-1",
            lastSyncRequestId: "sync-1",
            generatedAt: now.toISOString(),
            missingPreconditions: [],
          },
        },
      ]);
      mockRepository.findDiscoveryAnswers = vi.fn().mockResolvedValue({
        goals: ["Wzrost konwersji"],
        segments: ["VIP"],
        seasonality: "Q4 peak",
        brandTone: "konkretny",
        primaryKpis: ["conversion_rate"],
      });
      mockRepository.listLatestCampaignCalendarAudit = vi.fn().mockResolvedValue([]);
      mockRepository.createAuditLog = vi.fn().mockResolvedValue({});

      const result = await analysisService.generateCampaignCalendar("u1", "OWNER", {
        clientId: "client-1",
        requestId: "calendar-1",
      });

      expect(result.data.calendar.status).toBe("ok");
      expect(result.data.calendar.items.length).toBeGreaterThanOrEqual(4);
      expect(result.data.calendar.items.every((item) => item.goal.length > 0)).toBe(true);
      expect(result.data.calendar.items.every((item) => item.segment.length > 0)).toBe(true);
    });

    it("returns seasonality_missing when seasonality context is unavailable (AC2)", async () => {
      const now = new Date("2026-02-05T12:00:00.000Z");
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "AUDIT", canView: true, canEdit: true, canManage: false },
      ]);
      mockRepository.listLatestEmailStrategyAudit = vi.fn().mockResolvedValue([
        {
          id: "s1",
          requestId: "strategy-2",
          createdAt: now,
          details: {
            clientId: "client-1",
            version: 1,
            status: "ok",
            goals: ["Wzrost konwersji"],
            segments: ["VIP"],
            tone: "konkretny",
            priorities: ["Welcome"],
            kpis: ["conversion_rate"],
            requestId: "strategy-2",
            lastSyncRequestId: "sync-1",
            generatedAt: now.toISOString(),
            missingPreconditions: [],
          },
        },
      ]);
      mockRepository.findDiscoveryAnswers = vi.fn().mockResolvedValue({
        goals: ["Wzrost konwersji"],
        segments: ["VIP"],
        seasonality: null,
        brandTone: "konkretny",
        primaryKpis: ["conversion_rate"],
      });
      mockRepository.listLatestCampaignCalendarAudit = vi.fn().mockResolvedValue([]);
      mockRepository.createAuditLog = vi.fn().mockResolvedValue({});

      const result = await analysisService.generateCampaignCalendar("u1", "OWNER", {
        clientId: "client-1",
        requestId: "calendar-2",
      });

      expect(result.data.calendar.status).toBe("seasonality_missing");
      expect(result.data.calendar.requiresManualValidation).toBe(true);
      expect(result.data.calendar.items.length).toBeGreaterThanOrEqual(4);
    });

    it("throws forbidden when user has no edit rights for calendar save (AC3)", async () => {
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "AUDIT", canView: true, canEdit: false, canManage: false },
      ]);
      mockRepository.listLatestEmailStrategyAudit = vi.fn().mockResolvedValue([]);
      mockRepository.findDiscoveryAnswers = vi.fn().mockResolvedValue({
        goals: ["Wzrost konwersji"],
        segments: ["VIP"],
        seasonality: "Q4 peak",
        brandTone: "konkretny",
        primaryKpis: ["conversion_rate"],
      });
      mockRepository.listLatestCampaignCalendarAudit = vi.fn().mockResolvedValue([]);

      await expect(
        analysisService.generateCampaignCalendar("u1", "OWNER", {
          clientId: "client-1",
          requestId: "calendar-3",
        }),
      ).rejects.toThrow(AnalysisDomainError);
    });
  });

  describe("generateSegmentProposal (Story 3.4)", () => {
    it("returns segments with entry criteria and objective when strategy + client data are available (AC1)", async () => {
      const now = new Date("2026-02-06T12:00:00.000Z");
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "AUDIT", canView: true, canEdit: false, canManage: false },
      ]);
      mockRepository.findLatestSyncRun = vi.fn().mockResolvedValue({
        status: "OK",
        requestId: "sync-1",
        startedAt: new Date("2026-02-06T10:00:00.000Z"),
      });
      mockRepository.findDiscoveryAnswers = vi.fn().mockResolvedValue({
        goals: ["Wzrost konwersji"],
        segments: ["VIP", "Nowi", "Powracajacy"],
        seasonality: "Q1",
        brandTone: "konkretny",
        primaryKpis: ["conversion_rate"],
      });
      mockRepository.listLatestEmailStrategyAudit = vi.fn().mockResolvedValue([
        {
          id: "s1",
          requestId: "strategy-ok-3",
          createdAt: now,
          details: {
            clientId: "client-1",
            version: 1,
            status: "ok",
            goals: ["Wzrost konwersji"],
            segments: ["VIP", "Nowi", "Powracajacy"],
            tone: "konkretny",
            priorities: ["Welcome", "Winback"],
            kpis: ["conversion_rate"],
            requestId: "strategy-ok-3",
            lastSyncRequestId: "sync-1",
            generatedAt: now.toISOString(),
            missingPreconditions: [],
          },
        },
      ]);
      mockRepository.listLatestSegmentProposalAudit = vi.fn().mockResolvedValue([]);
      mockRepository.createAuditLog = vi.fn().mockResolvedValue({});

      const result = await analysisService.generateSegmentProposal("u1", "OWNER", {
        clientId: "client-1",
        requestId: "segment-req-1",
      });

      expect(result.data.segmentProposal.status).toBe("ok");
      expect(result.data.segmentProposal.segments.length).toBeGreaterThanOrEqual(3);
      expect(result.data.segmentProposal.segments.every((item) => item.entryCriteria.length > 0)).toBe(true);
      expect(result.data.segmentProposal.segments.every((item) => item.objective.length > 0)).toBe(true);
      expect(mockRepository.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          eventName: "strategy.segment_proposal.generated",
          requestId: "segment-req-1",
        }),
      );
    });

    it("returns requires_data_refresh with minimal data guidance when data are incomplete/stale (AC2)", async () => {
      const now = new Date("2026-02-06T12:00:00.000Z");
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "AUDIT", canView: true, canEdit: false, canManage: false },
      ]);
      mockRepository.findLatestSyncRun = vi.fn().mockResolvedValue({
        status: "OK",
        requestId: "sync-stale",
        startedAt: new Date("2025-01-01T08:00:00.000Z"),
      });
      mockRepository.findDiscoveryAnswers = vi.fn().mockResolvedValue({
        goals: ["Wzrost konwersji"],
        segments: [],
        seasonality: null,
        brandTone: "konkretny",
        primaryKpis: ["conversion_rate"],
      });
      mockRepository.listLatestEmailStrategyAudit = vi.fn().mockResolvedValue([
        {
          id: "s2",
          requestId: "strategy-ok-4",
          createdAt: now,
          details: {
            clientId: "client-1",
            version: 1,
            status: "ok",
            goals: ["Wzrost konwersji"],
            segments: ["VIP"],
            tone: "konkretny",
            priorities: ["Welcome"],
            kpis: ["conversion_rate"],
            requestId: "strategy-ok-4",
            lastSyncRequestId: "sync-stale",
            generatedAt: now.toISOString(),
            missingPreconditions: [],
          },
        },
      ]);
      mockRepository.listLatestSegmentProposalAudit = vi.fn().mockResolvedValue([]);

      const result = await analysisService.generateSegmentProposal("u1", "OWNER", {
        clientId: "client-1",
        requestId: "segment-req-2",
      });

      expect(result.data.segmentProposal.status).toBe("requires_data_refresh");
      expect(result.data.segmentProposal.segments).toHaveLength(0);
      expect(result.data.segmentProposal.missingData).toContain("discovery.segments");
      expect(result.data.segmentProposal.missingData).toContain("sync.fresh_24h");
    });

    it("returns failed_persist and no partial publish when save fails (AC3)", async () => {
      const now = new Date("2026-02-06T12:00:00.000Z");
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "AUDIT", canView: true, canEdit: false, canManage: false },
      ]);
      mockRepository.findLatestSyncRun = vi.fn().mockResolvedValue({
        status: "OK",
        requestId: "sync-2",
        startedAt: new Date("2026-02-06T11:00:00.000Z"),
      });
      mockRepository.findDiscoveryAnswers = vi.fn().mockResolvedValue({
        goals: ["Wzrost konwersji"],
        segments: ["VIP"],
        seasonality: "Q1",
        brandTone: "konkretny",
        primaryKpis: ["conversion_rate"],
      });
      mockRepository.listLatestEmailStrategyAudit = vi.fn().mockResolvedValue([
        {
          id: "s3",
          requestId: "strategy-ok-5",
          createdAt: now,
          details: {
            clientId: "client-1",
            version: 1,
            status: "ok",
            goals: ["Wzrost konwersji"],
            segments: ["VIP"],
            tone: "konkretny",
            priorities: ["Welcome"],
            kpis: ["conversion_rate"],
            requestId: "strategy-ok-5",
            lastSyncRequestId: "sync-2",
            generatedAt: now.toISOString(),
            missingPreconditions: [],
          },
        },
      ]);
      mockRepository.listLatestSegmentProposalAudit = vi.fn().mockResolvedValue([]);
      mockRepository.createAuditLog = vi.fn().mockRejectedValue(new Error("persist_fail"));

      const result = await analysisService.generateSegmentProposal("u1", "OWNER", {
        clientId: "client-1",
        requestId: "segment-req-3",
      });

      expect(result.data.segmentProposal.status).toBe("failed_persist");
      expect(result.data.segmentProposal.segments).toHaveLength(0);
    });
  });

  describe("generateCommunicationBrief (Story 4.1)", () => {
    it("returns brief with goal, segment, tone, priority and KPI and persists artifact (AC1)", async () => {
      const now = new Date("2026-02-07T12:00:00.000Z");
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "CONTENT", canView: true, canEdit: true, canManage: false },
      ]);
      mockRepository.listLatestEmailStrategyAudit = vi.fn().mockResolvedValue([
        {
          id: "s1",
          requestId: "strategy-brief-1",
          createdAt: now,
          details: {
            clientId: "client-1",
            version: 1,
            status: "ok",
            goals: ["Wzrost konwersji"],
            segments: ["VIP"],
            tone: "konkretny",
            priorities: ["Welcome sequence"],
            kpis: ["conversion_rate"],
            requestId: "strategy-brief-1",
            lastSyncRequestId: "sync-1",
            generatedAt: now.toISOString(),
            missingPreconditions: [],
          },
        },
      ]);
      mockRepository.listLatestCommunicationBriefAudit = vi.fn().mockResolvedValue([]);
      mockRepository.createAuditLog = vi.fn().mockResolvedValue({});

      const result = await analysisService.generateCommunicationBrief("u1", "CONTENT", {
        clientId: "client-1",
        campaignGoal: "Aktywacja nowych klientow",
        segment: "VIP",
        requestId: "brief-req-1",
      });

      expect(result.data.brief.status).toBe("ok");
      expect(result.data.brief.campaignGoal).toBe("Aktywacja nowych klientow");
      expect(result.data.brief.segment).toBe("VIP");
      expect(result.data.brief.tone).toBe("konkretny");
      expect(result.data.brief.priority).toBe("Welcome sequence");
      expect(result.data.brief.kpi).toBe("conversion_rate");
      expect(mockRepository.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          eventName: "content.communication_brief.generated",
          requestId: "brief-req-1",
        }),
      );
    });

    it("returns missing_required_fields when segment or campaign goal is missing (AC2)", async () => {
      const now = new Date("2026-02-07T12:00:00.000Z");
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "CONTENT", canView: true, canEdit: true, canManage: false },
      ]);
      mockRepository.listLatestEmailStrategyAudit = vi.fn().mockResolvedValue([
        {
          id: "s2",
          requestId: "strategy-brief-2",
          createdAt: now,
          details: {
            clientId: "client-1",
            version: 1,
            status: "ok",
            goals: ["Wzrost konwersji"],
            segments: ["VIP"],
            tone: "konkretny",
            priorities: ["Welcome sequence"],
            kpis: ["conversion_rate"],
            requestId: "strategy-brief-2",
            lastSyncRequestId: "sync-1",
            generatedAt: now.toISOString(),
            missingPreconditions: [],
          },
        },
      ]);
      mockRepository.listLatestCommunicationBriefAudit = vi.fn().mockResolvedValue([]);

      const result = await analysisService.generateCommunicationBrief("u1", "CONTENT", {
        clientId: "client-1",
        campaignGoal: "",
        segment: "",
        requestId: "brief-req-2",
      });

      expect(result.data.brief.status).toBe("missing_required_fields");
      expect(result.data.brief.missingFields).toContain("campaignGoal");
      expect(result.data.brief.missingFields).toContain("segment");
    });

    it("throws forbidden and logs audit attempt for role other than Content/Owner (AC3)", async () => {
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "CONTENT", canView: true, canEdit: false, canManage: false },
      ]);
      mockRepository.createAuditLog = vi.fn().mockResolvedValue({});
      mockRepository.listLatestEmailStrategyAudit = vi.fn().mockResolvedValue([]);
      mockRepository.listLatestCommunicationBriefAudit = vi.fn().mockResolvedValue([]);

      await expect(
        analysisService.generateCommunicationBrief("u1", "STRATEGY", {
          clientId: "client-1",
          campaignGoal: "Goal",
          segment: "VIP",
          requestId: "brief-req-3",
        }),
      ).rejects.toThrow(AnalysisDomainError);

      expect(mockRepository.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          eventName: "content.communication_brief.forbidden_attempt",
          requestId: "brief-req-3",
        }),
      );
    });
  });

  describe("generateEmailDraft (Story 4.2)", () => {
    it("returns draft with subject/preheader/body/cta and links to brief context (AC1)", async () => {
      const now = new Date("2026-02-08T12:00:00.000Z");
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "CONTENT", canView: true, canEdit: true, canManage: false },
      ]);
      mockRepository.listLatestCommunicationBriefAudit = vi.fn().mockResolvedValue([
        {
          id: "b1",
          requestId: "brief-1",
          createdAt: now,
          details: {
            clientId: "client-1",
            version: 1,
            status: "ok",
            campaignGoal: "Aktywacja nowych klientow",
            segment: "VIP",
            tone: "konkretny",
            priority: "Welcome",
            kpi: "conversion_rate",
            requestId: "brief-1",
            strategyRequestId: "strategy-1",
            generatedAt: now.toISOString(),
            missingFields: [],
          },
        },
      ]);
      mockRepository.listLatestEmailStrategyAudit = vi.fn().mockResolvedValue([
        {
          id: "s-email-1",
          requestId: "strategy-1",
          createdAt: now,
          details: {
            clientId: "client-1",
            version: 1,
            status: "ok",
            goals: ["Aktywacja"],
            segments: ["VIP"],
            tone: "konkretny",
            priorities: ["Welcome"],
            kpis: ["conversion_rate"],
            requestId: "strategy-1",
            lastSyncRequestId: "sync-1",
            generatedAt: now.toISOString(),
            missingPreconditions: [],
          },
        },
      ]);
      mockRepository.listLatestEmailDraftAudit = vi.fn().mockResolvedValue([]);
      mockRepository.createAuditLog = vi.fn().mockResolvedValue({});

      const result = await analysisService.generateEmailDraft("u1", "CONTENT", {
        clientId: "client-1",
        requestId: "draft-req-1",
      });

      expect(result.data.draft.status).toBe("ok");
      expect(result.data.draft.subject.length).toBeGreaterThan(0);
      expect(result.data.draft.preheader.length).toBeGreaterThan(0);
      expect(result.data.draft.body.length).toBeGreaterThan(0);
      expect(result.data.draft.cta.length).toBeGreaterThan(0);
      expect(result.data.draft.segment).toBe("VIP");
      expect(result.data.draft.campaignGoal).toBe("Aktywacja nowych klientow");
      expect(result.data.draft.versionMeta.author).toBe("u1");
      expect(result.data.draft.versionMeta.source).toBe("content.email_draft.generated");
      expect(result.data.draft.versionMeta.type).toBe("plan");
    });

    it("returns timed_out and keeps brief linkage for retry (AC2)", async () => {
      const now = new Date("2026-02-08T12:00:00.000Z");
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "CONTENT", canView: true, canEdit: true, canManage: false },
      ]);
      mockRepository.listLatestCommunicationBriefAudit = vi.fn().mockResolvedValue([
        {
          id: "b2",
          requestId: "brief-2",
          createdAt: now,
          details: {
            clientId: "client-1",
            version: 1,
            status: "ok",
            campaignGoal: "Retencja",
            segment: "Powracajacy",
            tone: "konkretny",
            priority: "Retention",
            kpi: "repeat_purchase_rate",
            requestId: "brief-2",
            strategyRequestId: "strategy-1",
            generatedAt: now.toISOString(),
            missingFields: [],
          },
        },
      ]);
      mockRepository.listLatestEmailStrategyAudit = vi.fn().mockResolvedValue([
        {
          id: "s-email-2",
          requestId: "strategy-1",
          createdAt: now,
          details: {
            clientId: "client-1",
            version: 1,
            status: "ok",
            goals: ["Retencja"],
            segments: ["Powracajacy"],
            tone: "konkretny",
            priorities: ["Retention"],
            kpis: ["repeat_purchase_rate"],
            requestId: "strategy-1",
            lastSyncRequestId: "sync-1",
            generatedAt: now.toISOString(),
            missingPreconditions: [],
          },
        },
      ]);
      mockRepository.listLatestEmailDraftAudit = vi.fn().mockResolvedValue([]);

      const result = await analysisService.generateEmailDraft("u1", "CONTENT", {
        clientId: "client-1",
        requestId: "timeout-draft-2",
      });

      expect(result.data.draft.status).toBe("timed_out");
      expect(result.data.draft.retryable).toBe(true);
      expect(result.data.draft.briefRequestId).toBe("brief-2");
    });

    it("writes manual acceptance audit entry when manualAccept=true", async () => {
      const now = new Date("2026-02-08T12:00:00.000Z");
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "CONTENT", canView: true, canEdit: true, canManage: false },
      ]);
      mockRepository.listLatestCommunicationBriefAudit = vi.fn().mockResolvedValue([
        {
          id: "b-manual-1",
          requestId: "brief-manual-1",
          createdAt: now,
          details: {
            clientId: "client-1",
            version: 1,
            status: "ok",
            campaignGoal: "Aktywacja",
            segment: "VIP",
            tone: "konkretny",
            priority: "Welcome",
            kpi: "conversion_rate",
            requestId: "brief-manual-1",
            strategyRequestId: "strategy-1",
            generatedAt: now.toISOString(),
            versionMeta: {
              timestamp: now.toISOString(),
              author: "u1",
              source: "content.communication_brief.generated",
              type: "plan",
            },
            missingFields: [],
          },
        },
      ]);
      mockRepository.listLatestEmailStrategyAudit = vi.fn().mockResolvedValue([
        {
          id: "s-manual-1",
          requestId: "strategy-1",
          createdAt: now,
          details: {
            clientId: "client-1",
            version: 1,
            status: "ok",
            goals: ["Aktywacja"],
            segments: ["VIP"],
            tone: "konkretny",
            priorities: ["Welcome"],
            kpis: ["conversion_rate"],
            requestId: "strategy-1",
            lastSyncRequestId: "sync-1",
            generatedAt: now.toISOString(),
            versionMeta: {
              timestamp: now.toISOString(),
              author: "u1",
              source: "strategy.email.generated",
              type: "strategy",
            },
            missingPreconditions: [],
          },
        },
      ]);
      mockRepository.listLatestEmailDraftAudit = vi.fn().mockResolvedValue([]);
      mockRepository.createAuditLog = vi.fn().mockResolvedValue({});

      const result = await analysisService.generateEmailDraft("u1", "CONTENT", {
        clientId: "client-1",
        requestId: "draft-manual-1",
        manualAccept: true,
      });

      expect(result.data.draft.status).toBe("ok");
      expect(mockRepository.createAuditLog).toHaveBeenCalledTimes(2);
      expect(mockRepository.createAuditLog).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          eventName: "content.email_draft.manual_accept",
          details: expect.objectContaining({
            timestamp: expect.any(String),
            userId: "u1",
            actionType: "content.email_draft.manual_accept",
            artifactId: "draft-manual-1",
            diff: expect.any(Object),
          }),
        }),
      );
    });

    it("returns failed_generation with requestId when finalization fails (AC3)", async () => {
      const now = new Date("2026-02-08T12:00:00.000Z");
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "CONTENT", canView: true, canEdit: true, canManage: false },
      ]);
      mockRepository.listLatestCommunicationBriefAudit = vi.fn().mockResolvedValue([
        {
          id: "b3",
          requestId: "brief-3",
          createdAt: now,
          details: {
            clientId: "client-1",
            version: 1,
            status: "ok",
            campaignGoal: "Retencja",
            segment: "VIP",
            tone: "konkretny",
            priority: "Retention",
            kpi: "repeat_purchase_rate",
            requestId: "brief-3",
            strategyRequestId: "strategy-1",
            generatedAt: now.toISOString(),
            missingFields: [],
          },
        },
      ]);
      mockRepository.listLatestEmailStrategyAudit = vi.fn().mockResolvedValue([
        {
          id: "s-email-3",
          requestId: "strategy-1",
          createdAt: now,
          details: {
            clientId: "client-1",
            version: 1,
            status: "ok",
            goals: ["Retencja"],
            segments: ["VIP"],
            tone: "konkretny",
            priorities: ["Retention"],
            kpis: ["repeat_purchase_rate"],
            requestId: "strategy-1",
            lastSyncRequestId: "sync-1",
            generatedAt: now.toISOString(),
            missingPreconditions: [],
          },
        },
      ]);
      mockRepository.listLatestEmailDraftAudit = vi.fn().mockResolvedValue([]);
      mockRepository.createAuditLog = vi.fn().mockRejectedValue(new Error("api_failure"));

      const result = await analysisService.generateEmailDraft("u1", "CONTENT", {
        clientId: "client-1",
        requestId: "draft-req-3",
      });

      expect(result.data.draft.status).toBe("failed_generation");
      expect(result.data.draft.requestId).toBe("draft-req-3");
      expect(result.data.draft.retryable).toBe(false);
    });

    it("serializes concurrent draft generation and increments version without collisions (Epic 4.4 regression)", async () => {
      const now = new Date("2026-02-08T13:00:00.000Z");
      const auditDrafts: Array<{ version: number; requestId: string }> = [];
      let queue = Promise.resolve();

      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "CONTENT", canView: true, canEdit: true, canManage: false },
      ]);
      mockRepository.withContentGenerationLock = (vi.fn(
        async <T>(_lockKey: string, handler: () => Promise<T>) => {
          const run = queue.then(handler, handler);
          queue = run.then(() => undefined, () => undefined);
          return run;
        },
      ) as AnalysisRepository["withContentGenerationLock"]);
      mockRepository.listLatestCommunicationBriefAudit = vi.fn().mockResolvedValue([
        {
          id: "b-concurrency",
          requestId: "brief-c-1",
          createdAt: now,
          details: {
            clientId: "client-1",
            version: 1,
            status: "ok",
            campaignGoal: "Aktywacja",
            segment: "VIP",
            tone: "konkretny",
            priority: "Welcome",
            kpi: "conversion_rate",
            requestId: "brief-c-1",
            strategyRequestId: "strategy-c-1",
            generatedAt: now.toISOString(),
            missingFields: [],
          },
        },
      ]);
      mockRepository.listLatestEmailStrategyAudit = vi.fn().mockResolvedValue([
        {
          id: "s-concurrency",
          requestId: "strategy-c-1",
          createdAt: now,
          details: {
            clientId: "client-1",
            version: 1,
            status: "ok",
            goals: ["Aktywacja"],
            segments: ["VIP"],
            tone: "konkretny",
            priorities: ["Welcome"],
            kpis: ["conversion_rate"],
            requestId: "strategy-c-1",
            lastSyncRequestId: "sync-1",
            generatedAt: now.toISOString(),
            missingPreconditions: [],
          },
        },
      ]);
      mockRepository.listLatestEmailDraftAudit = vi
        .fn()
        .mockImplementation(async () =>
          auditDrafts
            .map((draft, index) => ({
              id: `d-${index + 1}`,
              requestId: draft.requestId,
              createdAt: now,
              details: {
                clientId: "client-1",
                version: draft.version,
                status: "ok",
                campaignGoal: "Aktywacja",
                segment: "VIP",
                subject: "Temat",
                preheader: "Preheader",
                body: "Body",
                cta: "CTA",
                requestId: draft.requestId,
                briefRequestId: "brief-c-1",
                generatedAt: now.toISOString(),
                retryable: false,
              },
            }))
            .reverse(),
        );
      mockRepository.createAuditLog = vi.fn().mockImplementation(async (payload: { requestId: string; details: { version: number } }) => {
        auditDrafts.push({ version: payload.details.version, requestId: payload.requestId });
      });

      const [first, second] = await Promise.all([
        analysisService.generateEmailDraft("u1", "CONTENT", {
          clientId: "client-1",
          requestId: "draft-concurrent-1",
        }),
        analysisService.generateEmailDraft("u1", "CONTENT", {
          clientId: "client-1",
          requestId: "draft-concurrent-2",
        }),
      ]);

      const versions = [first.data.draft.version, second.data.draft.version].sort((a, b) => a - b);
      expect(versions).toEqual([1, 2]);
    });

    it("throws validation envelope for invalid AI draft payload", async () => {
      const now = new Date("2026-02-08T14:00:00.000Z");
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "CONTENT", canView: true, canEdit: true, canManage: false },
      ]);
      mockRepository.listLatestCommunicationBriefAudit = vi.fn().mockResolvedValue([
        {
          id: "b-invalid-ai",
          requestId: "brief-invalid-ai",
          createdAt: now,
          details: {
            clientId: "client-1",
            version: 1,
            status: "ok",
            campaignGoal: "Aktywacja",
            segment: "VIP",
            tone: "konkretny",
            priority: "Welcome",
            kpi: "conversion_rate",
            requestId: "brief-invalid-ai",
            strategyRequestId: "strategy-invalid-ai",
            generatedAt: now.toISOString(),
            missingFields: [],
          },
        },
      ]);
      mockRepository.listLatestEmailStrategyAudit = vi.fn().mockResolvedValue([
        {
          id: "s-invalid-ai",
          requestId: "strategy-invalid-ai",
          createdAt: now,
          details: {
            clientId: "client-1",
            version: 1,
            status: "ok",
            goals: ["Aktywacja"],
            segments: ["VIP"],
            tone: "konkretny",
            priorities: ["Welcome"],
            kpis: ["conversion_rate"],
            requestId: "strategy-invalid-ai",
            lastSyncRequestId: "sync-1",
            generatedAt: now.toISOString(),
            missingPreconditions: [],
          },
        },
      ]);
      mockRepository.listLatestEmailDraftAudit = vi.fn().mockResolvedValue([]);

      await expect(
        analysisService.generateEmailDraft("u1", "CONTENT", {
          clientId: "client-1",
          requestId: "invalid_ai_output-1",
        }),
      ).rejects.toThrow(AnalysisDomainError);
    });
  });

  describe("generatePersonalizedEmailDraft (Story 4.3)", () => {
    it("returns segment-personalized variants when draft and segments are available (AC1)", async () => {
      const now = new Date("2026-02-09T12:00:00.000Z");
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "CONTENT", canView: true, canEdit: true, canManage: false },
      ]);
      mockRepository.listLatestEmailDraftAudit = vi.fn().mockResolvedValue([
        {
          id: "d1",
          requestId: "draft-1",
          createdAt: now,
          details: {
            clientId: "client-1",
            version: 1,
            status: "ok",
            campaignGoal: "Aktywacja",
            segment: "VIP",
            subject: "Temat bazowy",
            preheader: "Preheader bazowy",
            body: "Body bazowy",
            cta: "Kup teraz",
            requestId: "draft-1",
            briefRequestId: "brief-1",
            generatedAt: now.toISOString(),
            retryable: false,
          },
        },
      ]);
      mockRepository.listLatestEmailStrategyAudit = vi.fn().mockResolvedValue([
        {
          id: "s-p-1",
          requestId: "strategy-1",
          createdAt: now,
          details: {
            clientId: "client-1",
            version: 1,
            status: "ok",
            goals: ["Aktywacja"],
            segments: ["VIP"],
            tone: "konkretny",
            priorities: ["Welcome"],
            kpis: ["conversion_rate"],
            requestId: "strategy-1",
            lastSyncRequestId: "sync-1",
            generatedAt: now.toISOString(),
            missingPreconditions: [],
          },
        },
      ]);
      mockRepository.listLatestSegmentProposalAudit = vi.fn().mockResolvedValue([
        {
          id: "s1",
          requestId: "segment-1",
          createdAt: now,
          details: {
            clientId: "client-1",
            version: 1,
            status: "ok",
            segments: [
              {
                name: "VIP",
                entryCriteria: ["x"],
                objective: "obj",
                campaignUseCase: "camp",
                flowUseCase: "flow",
              },
              {
                name: "Nowi",
                entryCriteria: ["y"],
                objective: "obj",
                campaignUseCase: "camp",
                flowUseCase: "flow",
              },
            ],
            requestId: "segment-1",
            strategyRequestId: "strategy-1",
            generatedAt: now.toISOString(),
            missingData: [],
          },
        },
      ]);
      mockRepository.listLatestPersonalizedEmailDraftAudit = vi.fn().mockResolvedValue([]);
      mockRepository.createAuditLog = vi.fn().mockResolvedValue({});

      const result = await analysisService.generatePersonalizedEmailDraft("u1", "CONTENT", {
        clientId: "client-1",
        requestId: "personalized-1",
      });

      expect(result.data.personalizedDraft.status).toBe("ok");
      expect(result.data.personalizedDraft.variants.length).toBeGreaterThanOrEqual(2);
      expect(result.data.personalizedDraft.variants[0]?.segment).toBe("VIP");
    });

    it("returns segment_data_missing when segments are unavailable (AC2)", async () => {
      const now = new Date("2026-02-09T12:00:00.000Z");
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "CONTENT", canView: true, canEdit: true, canManage: false },
      ]);
      mockRepository.listLatestEmailDraftAudit = vi.fn().mockResolvedValue([
        {
          id: "d2",
          requestId: "draft-2",
          createdAt: now,
          details: {
            clientId: "client-1",
            version: 1,
            status: "ok",
            campaignGoal: "Aktywacja",
            segment: "VIP",
            subject: "Temat bazowy",
            preheader: "Preheader bazowy",
            body: "Body bazowy",
            cta: "Kup teraz",
            requestId: "draft-2",
            briefRequestId: "brief-2",
            generatedAt: now.toISOString(),
            retryable: false,
          },
        },
      ]);
      mockRepository.listLatestEmailStrategyAudit = vi.fn().mockResolvedValue([
        {
          id: "s-p-2",
          requestId: "strategy-1",
          createdAt: now,
          details: {
            clientId: "client-1",
            version: 1,
            status: "ok",
            goals: ["Aktywacja"],
            segments: ["VIP"],
            tone: "konkretny",
            priorities: ["Welcome"],
            kpis: ["conversion_rate"],
            requestId: "strategy-1",
            lastSyncRequestId: "sync-1",
            generatedAt: now.toISOString(),
            missingPreconditions: [],
          },
        },
      ]);
      mockRepository.listLatestSegmentProposalAudit = vi.fn().mockResolvedValue([]);
      mockRepository.listLatestPersonalizedEmailDraftAudit = vi.fn().mockResolvedValue([]);

      const result = await analysisService.generatePersonalizedEmailDraft("u1", "CONTENT", {
        clientId: "client-1",
        requestId: "personalized-2",
      });

      expect(result.data.personalizedDraft.status).toBe("segment_data_missing");
      expect(result.data.personalizedDraft.variants).toHaveLength(0);
    });

    it("returns failed_generation with requestId on persist error (AC3)", async () => {
      const now = new Date("2026-02-09T12:00:00.000Z");
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "CONTENT", canView: true, canEdit: true, canManage: false },
      ]);
      mockRepository.listLatestEmailDraftAudit = vi.fn().mockResolvedValue([
        {
          id: "d3",
          requestId: "draft-3",
          createdAt: now,
          details: {
            clientId: "client-1",
            version: 1,
            status: "ok",
            campaignGoal: "Aktywacja",
            segment: "VIP",
            subject: "Temat bazowy",
            preheader: "Preheader bazowy",
            body: "Body bazowy",
            cta: "Kup teraz",
            requestId: "draft-3",
            briefRequestId: "brief-3",
            generatedAt: now.toISOString(),
            retryable: false,
          },
        },
      ]);
      mockRepository.listLatestEmailStrategyAudit = vi.fn().mockResolvedValue([
        {
          id: "s-p-3",
          requestId: "strategy-1",
          createdAt: now,
          details: {
            clientId: "client-1",
            version: 1,
            status: "ok",
            goals: ["Aktywacja"],
            segments: ["VIP"],
            tone: "konkretny",
            priorities: ["Welcome"],
            kpis: ["conversion_rate"],
            requestId: "strategy-1",
            lastSyncRequestId: "sync-1",
            generatedAt: now.toISOString(),
            missingPreconditions: [],
          },
        },
      ]);
      mockRepository.listLatestSegmentProposalAudit = vi.fn().mockResolvedValue([
        {
          id: "s3",
          requestId: "segment-3",
          createdAt: now,
          details: {
            clientId: "client-1",
            version: 1,
            status: "ok",
            segments: [
              {
                name: "VIP",
                entryCriteria: ["x"],
                objective: "obj",
                campaignUseCase: "camp",
                flowUseCase: "flow",
              },
            ],
            requestId: "segment-3",
            strategyRequestId: "strategy-1",
            generatedAt: now.toISOString(),
            missingData: [],
          },
        },
      ]);
      mockRepository.listLatestPersonalizedEmailDraftAudit = vi.fn().mockResolvedValue([]);
      mockRepository.createAuditLog = vi.fn().mockRejectedValue(new Error("persist_fail"));

      const result = await analysisService.generatePersonalizedEmailDraft("u1", "CONTENT", {
        clientId: "client-1",
        requestId: "personalized-3",
      });

      expect(result.data.personalizedDraft.status).toBe("failed_generation");
      expect(result.data.personalizedDraft.requestId).toBe("personalized-3");
      expect(result.data.personalizedDraft.variants).toHaveLength(0);
    });
  });

  describe("implementation checklist orchestration (Story 5.1)", () => {
    it("generates checklist with step statuses and progress from flow/campaign plans (AC1)", async () => {
      const now = new Date("2026-02-10T12:00:00.000Z");
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "IMPLEMENTATION", canView: true, canEdit: true, canManage: false },
      ]);
      mockRepository.listLatestImplementationChecklistAudit = vi.fn().mockResolvedValue([]);
      mockRepository.listLatestFlowPlanAudit = vi.fn().mockResolvedValue([
        {
          id: "f1",
          requestId: "flow-1",
          createdAt: now,
          details: {
            clientId: "client-1",
            version: 1,
            status: "ok",
            items: [
              {
                name: "Welcome flow",
                trigger: "Signup",
                objective: "Activate",
                priority: "HIGH",
                businessReason: "Core conversion path",
              },
            ],
            requestId: "flow-1",
            strategyRequestId: "strategy-1",
            generatedAt: now.toISOString(),
          },
        },
      ]);
      mockRepository.listLatestCampaignCalendarAudit = vi.fn().mockResolvedValue([
        {
          id: "c1",
          requestId: "calendar-1",
          createdAt: now,
          details: {
            clientId: "client-1",
            version: 1,
            status: "ok",
            items: [
              {
                weekNumber: 1,
                campaignType: "NEWSLETTER",
                goal: "Konwersja",
                segment: "VIP",
                title: "Start Q1",
              },
              {
                weekNumber: 2,
                campaignType: "PROMO",
                goal: "Konwersja",
                segment: "VIP",
                title: "Promo Q1",
              },
              {
                weekNumber: 3,
                campaignType: "LIFECYCLE",
                goal: "Retencja",
                segment: "VIP",
                title: "Lifecycle Q1",
              },
              {
                weekNumber: 4,
                campaignType: "EDUCATIONAL",
                goal: "Edukacja",
                segment: "VIP",
                title: "Edu Q1",
              },
            ],
            requestId: "calendar-1",
            strategyRequestId: "strategy-1",
            generatedAt: now.toISOString(),
            requiresManualValidation: false,
          },
        },
      ]);
      mockRepository.createAuditLog = vi.fn().mockResolvedValue({});

      const result = await analysisService.generateImplementationChecklist("u1", "OPERATIONS", {
        clientId: "client-1",
        requestId: "checklist-1",
      });

      expect(result.data.checklist.status).toBe("ok");
      expect(result.data.checklist.totalSteps).toBeGreaterThanOrEqual(2);
      expect(result.data.checklist.completedSteps).toBe(0);
      expect(result.data.checklist.steps.every((step) => step.status === "pending")).toBe(true);
      expect(result.data.checklist.progressPercent).toBe(0);
    });

    it("returns conflict_requires_refresh when expectedVersion is stale (AC2)", async () => {
      const now = new Date("2026-02-10T13:00:00.000Z");
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "IMPLEMENTATION", canView: true, canEdit: true, canManage: false },
      ]);
      mockRepository.listLatestImplementationChecklistAudit = vi.fn().mockResolvedValue([
        {
          id: "i1",
          requestId: "checklist-v2",
          createdAt: now,
          details: {
            clientId: "client-1",
            version: 2,
            status: "ok",
            requestId: "checklist-v2",
            generatedAt: now.toISOString(),
            updatedAt: now.toISOString(),
            totalSteps: 1,
            completedSteps: 0,
            progressPercent: 0,
            steps: [
              {
                id: "flow-1-welcome-flow",
                title: "Wdrozyc flow: Welcome flow",
                sourceType: "flow",
                sourceRef: "Welcome flow",
                status: "pending",
                completedAt: null,
              },
            ],
          },
        },
      ]);

      const result = await analysisService.updateImplementationChecklistStep("u1", "OPERATIONS", {
        clientId: "client-1",
        stepId: "flow-1-welcome-flow",
        status: "done",
        expectedVersion: 1,
        requestId: "checklist-update-conflict",
      });

      expect(result.data.checklist.status).toBe("conflict_requires_refresh");
      expect(result.data.checklist.version).toBe(2);
      expect(result.data.checklist.steps[0]?.status).toBe("pending");
    });

    it("returns transaction_error and preserves previous step state on save failure (AC3)", async () => {
      const now = new Date("2026-02-10T14:00:00.000Z");
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "IMPLEMENTATION", canView: true, canEdit: true, canManage: false },
      ]);
      mockRepository.listLatestImplementationChecklistAudit = vi.fn().mockResolvedValue([
        {
          id: "i2",
          requestId: "checklist-v3",
          createdAt: now,
          details: {
            clientId: "client-1",
            version: 3,
            status: "ok",
            requestId: "checklist-v3",
            generatedAt: now.toISOString(),
            updatedAt: now.toISOString(),
            totalSteps: 1,
            completedSteps: 0,
            progressPercent: 0,
            steps: [
              {
                id: "campaign-1-week-1",
                title: "Skonfigurowac kampanie: Start Q1",
                sourceType: "campaign",
                sourceRef: "week-1",
                status: "pending",
                completedAt: null,
              },
            ],
          },
        },
      ]);
      mockRepository.createAuditLog = vi.fn().mockRejectedValue(new Error("tx_error"));

      const result = await analysisService.updateImplementationChecklistStep("u1", "OPERATIONS", {
        clientId: "client-1",
        stepId: "campaign-1-week-1",
        status: "done",
        expectedVersion: 3,
        requestId: "checklist-update-fail",
      });

      expect(result.data.checklist.status).toBe("transaction_error");
      expect(result.data.checklist.version).toBe(3);
      expect(result.data.checklist.steps[0]?.status).toBe("pending");
      expect(result.data.checklist.steps[0]?.completedAt).toBeNull();
    });
  });

  describe("implementation alerts and progress prioritization (Story 5.3)", () => {
    it("returns blocked status and sorts alerts by priority/impact (AC1)", async () => {
      const now = new Date("2026-02-11T12:00:00.000Z");
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "IMPLEMENTATION", canView: true, canEdit: true, canManage: false },
      ]);
      mockRepository.findLatestSyncRun = vi.fn().mockResolvedValue({
        status: "FAILED_AUTH",
        requestId: "sync-err-1",
        startedAt: now,
        finishedAt: now,
      });
      mockRepository.listInventory = vi.fn().mockResolvedValue([]);
      mockRepository.listLatestImplementationChecklistAudit = vi.fn().mockResolvedValue([]);
      mockRepository.listLatestFlowPlanAudit = vi.fn().mockResolvedValue([]);

      const result = await analysisService.getImplementationAlerts("u1", "OPERATIONS", {
        clientId: "client-1",
      });

      expect(result.data.alerts.status).toBe("blocked");
      expect(result.data.alerts.blockerCount).toBeGreaterThan(0);
      expect(result.data.alerts.alerts.some((alert) => alert.id === "sync-failed-auth")).toBe(true);
      expect(result.data.alerts.alerts[0]?.priority).toBe("CRITICAL");
      expect(result.data.alerts.alerts[0]?.impactScore).toBeGreaterThanOrEqual(90);
    });

    it("returns needs_configuration with config gaps linked to flow priority (AC2)", async () => {
      const now = new Date("2026-02-11T12:10:00.000Z");
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "IMPLEMENTATION", canView: true, canEdit: true, canManage: false },
      ]);
      mockRepository.findLatestSyncRun = vi.fn().mockResolvedValue({
        status: "OK",
        requestId: "sync-ok-1",
        startedAt: now,
        finishedAt: now,
      });
      mockRepository.listInventory = vi.fn().mockResolvedValue([
        { entityType: "FLOW", externalId: "flow-1", name: "Welcome", itemStatus: "GAP" },
      ]);
      mockRepository.listLatestImplementationChecklistAudit = vi.fn().mockResolvedValue([]);
      mockRepository.listLatestFlowPlanAudit = vi.fn().mockResolvedValue([
        {
          id: "flow-priority-1",
          requestId: "flow-priority-1",
          createdAt: now,
          details: {
            clientId: "client-1",
            version: 2,
            status: "ok",
            items: [
              {
                name: "Winback",
                trigger: "Lapsed",
                objective: "Retention",
                priority: "CRITICAL",
                businessReason: "High churn risk",
              },
            ],
            requestId: "flow-priority-1",
            strategyRequestId: "strategy-1",
            generatedAt: now.toISOString(),
          },
        },
      ]);

      const result = await analysisService.getImplementationAlerts("u1", "OPERATIONS", {
        clientId: "client-1",
      });

      expect(result.data.alerts.status).toBe("needs_configuration");
      expect(result.data.alerts.blockerCount).toBe(0);
      expect(result.data.alerts.configGapCount).toBe(1);
      expect(result.data.alerts.alerts[0]?.type).toBe("configuration_gap");
      expect(result.data.alerts.alerts[0]?.priority).toBe("CRITICAL");
      expect(result.data.alerts.alerts[0]?.impactScore).toBeGreaterThanOrEqual(80);
    });

    it("returns at_risk progress alert for low completion and ok when fully clean (AC3)", async () => {
      const now = new Date("2026-02-11T12:20:00.000Z");
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "IMPLEMENTATION", canView: true, canEdit: true, canManage: false },
      ]);
      mockRepository.findLatestSyncRun = vi.fn().mockResolvedValue({
        status: "OK",
        requestId: "sync-ok-2",
        startedAt: now,
        finishedAt: now,
      });
      mockRepository.listInventory = vi.fn().mockResolvedValue([
        { entityType: "FLOW", externalId: "flow-1", name: "Welcome", itemStatus: "OK" },
      ]);
      mockRepository.listLatestImplementationChecklistAudit = vi.fn().mockResolvedValue([
        {
          id: "progress-1",
          requestId: "checklist-progress-1",
          createdAt: now,
          details: {
            clientId: "client-1",
            version: 3,
            status: "ok",
            requestId: "checklist-progress-1",
            generatedAt: now.toISOString(),
            updatedAt: now.toISOString(),
            totalSteps: 10,
            completedSteps: 2,
            progressPercent: 20,
            steps: [],
          },
        },
      ]);
      mockRepository.listLatestFlowPlanAudit = vi.fn().mockResolvedValue([]);

      const atRiskResult = await analysisService.getImplementationAlerts("u1", "OPERATIONS", {
        clientId: "client-1",
      });
      expect(atRiskResult.data.alerts.status).toBe("at_risk");
      expect(atRiskResult.data.alerts.alerts.some((alert) => alert.type === "progress")).toBe(true);
      expect(atRiskResult.data.alerts.alerts[0]?.progressState).toBe("blocked");

      mockRepository.listLatestImplementationChecklistAudit = vi.fn().mockResolvedValue([
        {
          id: "progress-2",
          requestId: "checklist-progress-2",
          createdAt: now,
          details: {
            clientId: "client-1",
            version: 4,
            status: "ok",
            requestId: "checklist-progress-2",
            generatedAt: now.toISOString(),
            updatedAt: now.toISOString(),
            totalSteps: 4,
            completedSteps: 4,
            progressPercent: 100,
            steps: [],
          },
        },
      ]);

      const result = await analysisService.getImplementationAlerts("u1", "OPERATIONS", {
        clientId: "client-1",
      });

      expect(result.data.alerts.status).toBe("ok");
      expect(result.data.alerts.blockerCount).toBe(0);
      expect(result.data.alerts.configGapCount).toBe(0);
      expect(result.data.alerts.alerts).toHaveLength(0);
    });
  });

  describe("implementation report generation (Story 5.4)", () => {
    it("returns markdown report with meta/completed/at_risk/blockers sections", async () => {
      const now = new Date("2026-02-12T12:00:00.000Z");
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "IMPLEMENTATION", canView: true, canEdit: true, canManage: false },
      ]);
      mockRepository.findLatestSyncRun = vi.fn().mockResolvedValue({
        status: "FAILED_AUTH",
        requestId: "sync-5-4",
        startedAt: now,
        finishedAt: now,
      });
      mockRepository.listInventory = vi.fn().mockResolvedValue([
        { entityType: "FLOW", externalId: "flow-gap", name: "Welcome", itemStatus: "GAP" },
      ]);
      mockRepository.listLatestFlowPlanAudit = vi.fn().mockResolvedValue([]);
      mockRepository.listLatestImplementationChecklistAudit = vi.fn().mockResolvedValue([
        {
          id: "checklist-report",
          requestId: "checklist-report-1",
          createdAt: now,
          details: {
            clientId: "client-1",
            version: 1,
            status: "ok",
            requestId: "checklist-report-1",
            generatedAt: now.toISOString(),
            updatedAt: now.toISOString(),
            totalSteps: 3,
            completedSteps: 1,
            progressPercent: 33,
            steps: [
              {
                id: "step-1",
                title: "Skonfigurowac flow welcome",
                sourceType: "flow",
                sourceRef: "Welcome",
                status: "done",
                completedAt: now.toISOString(),
              },
              {
                id: "step-2",
                title: "Skonfigurowac kampanie startowa",
                sourceType: "campaign",
                sourceRef: "week-1",
                status: "pending",
                completedAt: null,
              },
            ],
          },
        },
      ]);

      const result = await analysisService.getImplementationReport("u1", "OPERATIONS", {
        clientId: "client-1",
      });

      expect(result.data.report.status).toBe("blocked");
      expect(result.data.report.markdown).toContain("## meta");
      expect(result.data.report.markdown).toContain("## completed");
      expect(result.data.report.markdown).toContain("## at_risk");
      expect(result.data.report.markdown).toContain("## blockers");
      expect(result.data.report.markdown).toContain("- [x] Skonfigurowac flow welcome");
    });
  });

  describe("implementation documentation generation (Story 6.6)", () => {
    it("returns markdown documentation with required client sections", async () => {
      const now = new Date("2026-02-21T12:00:00.000Z");
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "IMPLEMENTATION", canView: true, canEdit: true, canManage: false },
      ]);
      mockRepository.findAuditProductContext = vi.fn().mockResolvedValue({
        offer: "Subskrypcja premium",
        targetAudience: "SMB ecommerce",
        mainProducts: ["pakiet pro"],
        currentFlows: ["welcome"],
        goals: ["Wzrost konwersji"],
        segments: ["VIP"],
      });
      mockRepository.listLatestEmailStrategyAudit = vi.fn().mockResolvedValue([
        {
          id: "strategy-doc-1",
          requestId: "strategy-doc-1",
          createdAt: now,
          details: {
            clientId: "client-1",
            version: 2,
            status: "ok",
            goals: ["Wzrost konwersji"],
            segments: ["VIP"],
            tone: "konkretny",
            priorities: ["Welcome"],
            kpis: ["conversion_rate"],
            requestId: "strategy-doc-1",
            lastSyncRequestId: "sync-doc-1",
            generatedAt: now.toISOString(),
            versionMeta: {
              timestamp: now.toISOString(),
              author: "u1",
              source: "strategy.email.generated",
              type: "strategy",
            },
            missingPreconditions: [],
          },
        },
      ]);
      mockRepository.listLatestFlowPlanAudit = vi.fn().mockResolvedValue([
        {
          id: "flow-doc-1",
          requestId: "flow-doc-1",
          createdAt: now,
          details: {
            clientId: "client-1",
            version: 1,
            status: "ok",
            items: [
              {
                name: "Flow pakiet pro welcome",
                trigger: "signup",
                objective: "activate",
                priority: "HIGH",
                businessReason: "coverage",
              },
            ],
            requestId: "flow-doc-1",
            strategyRequestId: "strategy-doc-1",
            generatedAt: now.toISOString(),
            versionMeta: {
              timestamp: now.toISOString(),
              author: "u1",
              source: "strategy.flow_plan.generated",
              type: "flow",
            },
          },
        },
      ]);
      mockRepository.listLatestCampaignCalendarAudit = vi.fn().mockResolvedValue([
        {
          id: "camp-doc-1",
          requestId: "camp-doc-1",
          createdAt: now,
          details: {
            clientId: "client-1",
            version: 1,
            status: "ok",
            items: [
              {
                weekNumber: 1,
                campaignType: "PROMO",
                goal: "promocja pakiet pro",
                segment: "VIP",
                title: "Kampania pakiet pro",
              },
              {
                weekNumber: 2,
                campaignType: "NEWSLETTER",
                goal: "newsletter",
                segment: "VIP",
                title: "Newsletter",
              },
              {
                weekNumber: 3,
                campaignType: "LIFECYCLE",
                goal: "retencja",
                segment: "VIP",
                title: "Lifecycle",
              },
              {
                weekNumber: 4,
                campaignType: "EDUCATIONAL",
                goal: "edukacja",
                segment: "VIP",
                title: "Edu",
              },
            ],
            requestId: "camp-doc-1",
            strategyRequestId: "strategy-doc-1",
            generatedAt: now.toISOString(),
            versionMeta: {
              timestamp: now.toISOString(),
              author: "u1",
              source: "strategy.campaign_calendar.generated",
              type: "plan",
            },
            requiresManualValidation: false,
          },
        },
      ]);
      mockRepository.listLatestClientAuditLogs = vi.fn().mockResolvedValue([
        {
          id: "audit-doc-1",
          requestId: "req-audit-doc-1",
          eventName: "strategy.email.generated",
          createdAt: now,
          actorId: "u1",
          details: {
            actionType: "strategy.email.generated",
            artifactId: "strategy-doc-1",
            userId: "u1",
          },
        },
      ]);

      const result = await analysisService.getImplementationDocumentation("u1", "OPERATIONS", {
        clientId: "client-1",
      });

      expect(result.data.documentation.clientId).toBe("client-1");
      expect(result.data.documentation.markdown).toContain("## Product Context");
      expect(result.data.documentation.markdown).toContain("## Strategy Summary");
      expect(result.data.documentation.markdown).toContain("## Flow Plan");
      expect(result.data.documentation.markdown).toContain("## Campaign Calendar");
      expect(result.data.documentation.markdown).toContain("## Recommendations");
      expect(result.data.documentation.markdown).toContain("## Audit Log");
      expect(result.data.documentation.markdown).toContain("strategy.email.generated");
    });
  });

  describe("implementation documentation export (Story 6.7)", () => {
    it("exports documentation to notion and returns created URL", async () => {
      const now = new Date("2026-02-22T12:00:00.000Z");
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "IMPLEMENTATION", canView: true, canEdit: true, canManage: false },
      ]);
      mockRepository.findAuditProductContext = vi.fn().mockResolvedValue(null);
      mockRepository.listLatestEmailStrategyAudit = vi.fn().mockResolvedValue([]);
      mockRepository.listLatestFlowPlanAudit = vi.fn().mockResolvedValue([]);
      mockRepository.listLatestCampaignCalendarAudit = vi.fn().mockResolvedValue([]);
      mockRepository.listLatestClientAuditLogs = vi.fn().mockResolvedValue([
        {
          id: "audit-export-1",
          requestId: "req-audit-export-1",
          eventName: "strategy.email.generated",
          createdAt: now,
          actorId: "u1",
          details: {},
        },
      ]);
      mockDocumentationExportAdapter.exportToNotion = vi.fn().mockResolvedValue({
        documentUrl: "https://www.notion.so/export-doc-1",
      });
      mockDocumentationExportAdapter.exportToGoogleDocs = vi.fn().mockResolvedValue({
        documentUrl: "https://docs.google.com/document/d/export-doc-1/edit",
      });

      const result = await analysisService.exportImplementationDocumentation("u1", "OPERATIONS", {
        clientId: "client-1",
        target: "notion",
      });

      expect(result.data.target).toBe("notion");
      expect(result.data.fallbackUsed).toBe(false);
      expect(result.data.documentUrl).toBe("https://www.notion.so/export-doc-1");
      expect(mockDocumentationExportAdapter.exportToNotion).toHaveBeenCalledTimes(1);
      expect(mockDocumentationExportAdapter.exportToGoogleDocs).not.toHaveBeenCalled();
    });

    it("falls back to google docs after notion API errors", async () => {
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "IMPLEMENTATION", canView: true, canEdit: true, canManage: false },
      ]);
      mockRepository.findAuditProductContext = vi.fn().mockResolvedValue(null);
      mockRepository.listLatestEmailStrategyAudit = vi.fn().mockResolvedValue([]);
      mockRepository.listLatestFlowPlanAudit = vi.fn().mockResolvedValue([]);
      mockRepository.listLatestCampaignCalendarAudit = vi.fn().mockResolvedValue([]);
      mockRepository.listLatestClientAuditLogs = vi.fn().mockResolvedValue([]);
      mockDocumentationExportAdapter.exportToNotion = vi.fn().mockRejectedValue(
        new DocumentationExportError("notion", "api_error", "temporary failure"),
      );
      mockDocumentationExportAdapter.exportToGoogleDocs = vi.fn().mockResolvedValue({
        documentUrl: "https://docs.google.com/document/d/fallback-doc/edit",
      });

      const result = await analysisService.exportImplementationDocumentation("u1", "OPERATIONS", {
        clientId: "client-1",
        target: "notion",
      });

      expect(mockDocumentationExportAdapter.exportToNotion).toHaveBeenCalledTimes(3);
      expect(mockDocumentationExportAdapter.exportToGoogleDocs).toHaveBeenCalledTimes(1);
      expect(result.data.target).toBe("google_docs");
      expect(result.data.fallbackUsed).toBe(true);
      expect(result.data.documentUrl).toContain("fallback-doc");
    });
  });

  describe("audit product context collection (Story 6.1)", () => {
    it("returns ok status with full product context for audit", async () => {
      const now = new Date("2026-02-15T12:00:00.000Z");
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "AUDIT", canView: true, canEdit: false, canManage: false },
      ]);
      mockRepository.findAuditProductContext = vi.fn().mockResolvedValue({
        offer: "Subskrypcja premium",
        targetAudience: "SMB ecommerce",
        mainProducts: ["Pakiet Pro"],
        currentFlows: ["Welcome", "Abandon cart"],
        goals: ["Wzrost konwersji"],
        segments: ["VIP"],
      });
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const result = await analysisService.getAuditProductContext("u1", "STRATEGY", {
        clientId: "client-1",
      });

      expect(result.data.context.status).toBe("ok");
      expect(result.data.context.mainProducts).toContain("Pakiet Pro");
      expect(result.data.context.missingFields).toHaveLength(0);
      vi.useRealTimers();
    });

    it("returns missing_context when key product fields are absent", async () => {
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "AUDIT", canView: true, canEdit: false, canManage: false },
      ]);
      mockRepository.findAuditProductContext = vi.fn().mockResolvedValue({
        offer: null,
        targetAudience: "",
        mainProducts: [],
        currentFlows: [],
        goals: [],
        segments: [],
      });

      const result = await analysisService.getAuditProductContext("u1", "OWNER", {
        clientId: "client-1",
      });

      expect(result.data.context.status).toBe("missing_context");
      expect(result.data.context.missingFields).toContain("offer");
      expect(result.data.context.missingFields).toContain("targetAudience");
      expect(result.data.context.missingFields).toContain("mainProducts");
      expect(result.data.context.missingFields).toContain("currentFlows");
    });
  });

  describe("product coverage analysis (Story 6.2)", () => {
    it("returns ok coverage when products are covered in flows and campaigns", async () => {
      const now = new Date("2026-02-16T12:00:00.000Z");
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "AUDIT", canView: true, canEdit: false, canManage: false },
      ]);
      mockRepository.findAuditProductContext = vi.fn().mockResolvedValue({
        offer: "Subskrypcja premium",
        targetAudience: "SMB ecommerce",
        mainProducts: ["pakiet pro"],
        currentFlows: ["welcome"],
        goals: ["Wzrost konwersji"],
        segments: ["VIP"],
      });
      mockRepository.listLatestFlowPlanAudit = vi.fn().mockResolvedValue([
        {
          id: "flow-coverage-1",
          requestId: "flow-coverage-1",
          createdAt: now,
          details: {
            clientId: "client-1",
            version: 1,
            status: "ok",
            items: [
              {
                name: "Flow pakiet pro welcome",
                trigger: "signup",
                objective: "activate",
                priority: "HIGH",
                businessReason: "coverage",
              },
            ],
            requestId: "flow-coverage-1",
            strategyRequestId: "strategy-1",
            generatedAt: now.toISOString(),
          },
        },
      ]);
      mockRepository.listLatestCampaignCalendarAudit = vi.fn().mockResolvedValue([
        {
          id: "camp-coverage-1",
          requestId: "camp-coverage-1",
          createdAt: now,
          details: {
            clientId: "client-1",
            version: 1,
            status: "ok",
            items: [
              {
                weekNumber: 1,
                campaignType: "PROMO",
                goal: "promocja pakiet pro",
                segment: "VIP",
                title: "Kampania pakiet pro",
              },
              {
                weekNumber: 2,
                campaignType: "NEWSLETTER",
                goal: "newsletter ogolny",
                segment: "VIP",
                title: "Newsletter ogolny",
              },
              {
                weekNumber: 3,
                campaignType: "LIFECYCLE",
                goal: "retencja",
                segment: "VIP",
                title: "Lifecycle retention",
              },
              {
                weekNumber: 4,
                campaignType: "EDUCATIONAL",
                goal: "edukacja",
                segment: "VIP",
                title: "Edu camp",
              },
            ],
            requestId: "camp-coverage-1",
            strategyRequestId: "strategy-1",
            generatedAt: now.toISOString(),
            requiresManualValidation: false,
          },
        },
      ]);

      const result = await analysisService.getProductCoverageAnalysis("u1", "STRATEGY", {
        clientId: "client-1",
      });

      expect(result.data.coverage.status).toBe("ok");
      expect(result.data.coverage.items[0]?.coverageScore).toBe(100);
      expect(result.data.coverage.items[0]?.status).toBe("covered");
    });

    it("returns partial coverage with missing flow/campaign lists", async () => {
      const now = new Date("2026-02-16T12:10:00.000Z");
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "AUDIT", canView: true, canEdit: false, canManage: false },
      ]);
      mockRepository.findAuditProductContext = vi.fn().mockResolvedValue({
        offer: "Subskrypcja premium",
        targetAudience: "SMB ecommerce",
        mainProducts: ["pakiet lite", "pakiet max"],
        currentFlows: [],
        goals: [],
        segments: [],
      });
      mockRepository.listLatestFlowPlanAudit = vi.fn().mockResolvedValue([
        {
          id: "flow-coverage-2",
          requestId: "flow-coverage-2",
          createdAt: now,
          details: {
            clientId: "client-1",
            version: 1,
            status: "ok",
            items: [],
            requestId: "flow-coverage-2",
            strategyRequestId: "strategy-1",
            generatedAt: now.toISOString(),
          },
        },
      ]);
      mockRepository.listLatestCampaignCalendarAudit = vi.fn().mockResolvedValue([
        {
          id: "camp-coverage-2",
          requestId: "camp-coverage-2",
          createdAt: now,
          details: {
            clientId: "client-1",
            version: 1,
            status: "ok",
            items: [
              {
                weekNumber: 2,
                campaignType: "NEWSLETTER",
                goal: "newsletter pakiet lite",
                segment: "VIP",
                title: "Edukacja pakiet lite",
              },
            ],
            requestId: "camp-coverage-2",
            strategyRequestId: "strategy-1",
            generatedAt: now.toISOString(),
            requiresManualValidation: false,
          },
        },
      ]);

      const result = await analysisService.getProductCoverageAnalysis("u1", "OWNER", {
        clientId: "client-1",
      });

      expect(result.data.coverage.status).toBe("partial");
      expect(result.data.coverage.missingFlows).toContain("pakiet lite");
      expect(result.data.coverage.missingCampaigns).toContain("pakiet max");
    });
  });

  describe("communication improvement recommendations (Story 6.3)", () => {
    it("returns recommendations sorted by priority and impact", async () => {
      const now = new Date("2026-02-17T12:00:00.000Z");
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "AUDIT", canView: true, canEdit: false, canManage: false },
      ]);
      mockRepository.findAuditProductContext = vi.fn().mockResolvedValue({
        offer: "Subskrypcja premium",
        targetAudience: "SMB ecommerce",
        mainProducts: ["pakiet pro", "pakiet lite", "pakiet vip"],
        currentFlows: ["welcome"],
        goals: ["Wzrost konwersji"],
        segments: ["VIP"],
      });
      mockRepository.listLatestFlowPlanAudit = vi.fn().mockResolvedValue([
        {
          id: "flow-reco-1",
          requestId: "flow-reco-1",
          createdAt: now,
          details: {
            clientId: "client-1",
            version: 1,
            status: "ok",
            items: [
              {
                name: "Flow pakiet pro welcome",
                trigger: "signup",
                objective: "activate",
                priority: "HIGH",
                businessReason: "coverage",
              },
            ],
            requestId: "flow-reco-1",
            strategyRequestId: "strategy-1",
            generatedAt: now.toISOString(),
          },
        },
      ]);
      mockRepository.listLatestCampaignCalendarAudit = vi.fn().mockResolvedValue([
        {
          id: "camp-reco-1",
          requestId: "camp-reco-1",
          createdAt: now,
          details: {
            clientId: "client-1",
            version: 1,
            status: "ok",
            items: [
              {
                weekNumber: 1,
                campaignType: "PROMO",
                goal: "promocja pakiet pro",
                segment: "VIP",
                title: "Kampania pakiet pro",
              },
              {
                weekNumber: 2,
                campaignType: "NEWSLETTER",
                goal: "newsletter pakiet lite",
                segment: "VIP",
                title: "Edukacja pakiet lite",
              },
              {
                weekNumber: 3,
                campaignType: "LIFECYCLE",
                goal: "retencja",
                segment: "VIP",
                title: "Lifecycle retention",
              },
              {
                weekNumber: 4,
                campaignType: "EDUCATIONAL",
                goal: "edukacja",
                segment: "VIP",
                title: "Edu camp",
              },
            ],
            requestId: "camp-reco-1",
            strategyRequestId: "strategy-1",
            generatedAt: now.toISOString(),
            requiresManualValidation: false,
          },
        },
      ]);

      const result = await analysisService.getCommunicationImprovementRecommendations("u1", "OWNER", {
        clientId: "client-1",
      });

      expect(result.data.recommendations.status).toBe("ok");
      expect(result.data.recommendations.items).toHaveLength(3);
      expect(result.data.recommendations.items[0]?.productName).toBe("pakiet vip");
      expect(result.data.recommendations.items[0]?.priority).toBe("CRITICAL");
      expect(result.data.recommendations.items[1]?.productName).toBe("pakiet lite");
      expect(result.data.recommendations.items[1]?.priority).toBe("HIGH");
      expect(result.data.recommendations.items[2]?.productName).toBe("pakiet pro");
    });

    it("returns missing_context when main products are unavailable", async () => {
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "AUDIT", canView: true, canEdit: false, canManage: false },
      ]);
      mockRepository.findAuditProductContext = vi.fn().mockResolvedValue(null);
      mockRepository.listLatestFlowPlanAudit = vi.fn().mockResolvedValue([]);
      mockRepository.listLatestCampaignCalendarAudit = vi.fn().mockResolvedValue([]);

      const result = await analysisService.getCommunicationImprovementRecommendations("u1", "STRATEGY", {
        clientId: "client-1",
      });

      expect(result.data.recommendations.status).toBe("missing_context");
      expect(result.data.recommendations.items).toHaveLength(0);
    });

    it("writes manual acceptance audit entry for recommendations", async () => {
      const now = new Date("2026-02-17T12:00:00.000Z");
      mockRepository.findMembership = vi.fn().mockResolvedValue({ id: "m1" });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([
        { module: "AUDIT", canView: true, canEdit: false, canManage: false },
      ]);
      mockRepository.findAuditProductContext = vi.fn().mockResolvedValue({
        offer: "Subskrypcja premium",
        targetAudience: "SMB ecommerce",
        mainProducts: ["pakiet pro"],
        currentFlows: ["welcome"],
        goals: ["Wzrost konwersji"],
        segments: ["VIP"],
      });
      mockRepository.listLatestFlowPlanAudit = vi.fn().mockResolvedValue([
        {
          id: "flow-reco-2",
          requestId: "flow-reco-2",
          createdAt: now,
          details: {
            clientId: "client-1",
            version: 1,
            status: "ok",
            items: [
              {
                name: "Flow pakiet pro welcome",
                trigger: "signup",
                objective: "activate",
                priority: "HIGH",
                businessReason: "coverage",
              },
            ],
            requestId: "flow-reco-2",
            strategyRequestId: "strategy-1",
            generatedAt: now.toISOString(),
            versionMeta: {
              timestamp: now.toISOString(),
              author: "u1",
              source: "strategy.flow_plan.generated",
              type: "flow",
            },
          },
        },
      ]);
      mockRepository.listLatestCampaignCalendarAudit = vi.fn().mockResolvedValue([
        {
          id: "camp-reco-2",
          requestId: "camp-reco-2",
          createdAt: now,
          details: {
            clientId: "client-1",
            version: 1,
            status: "ok",
            items: [
              {
                weekNumber: 1,
                campaignType: "PROMO",
                goal: "promocja pakiet pro",
                segment: "VIP",
                title: "Kampania pakiet pro",
              },
              {
                weekNumber: 2,
                campaignType: "NEWSLETTER",
                goal: "newsletter ogolny",
                segment: "VIP",
                title: "Newsletter ogolny",
              },
              {
                weekNumber: 3,
                campaignType: "LIFECYCLE",
                goal: "retencja",
                segment: "VIP",
                title: "Lifecycle retention",
              },
              {
                weekNumber: 4,
                campaignType: "EDUCATIONAL",
                goal: "edukacja",
                segment: "VIP",
                title: "Edu camp",
              },
            ],
            requestId: "camp-reco-2",
            strategyRequestId: "strategy-1",
            generatedAt: now.toISOString(),
            versionMeta: {
              timestamp: now.toISOString(),
              author: "u1",
              source: "strategy.campaign_calendar.generated",
              type: "plan",
            },
            requiresManualValidation: false,
          },
        },
      ]);
      mockRepository.createAuditLog = vi.fn().mockResolvedValue({});

      const result = await analysisService.getCommunicationImprovementRecommendations("u1", "OWNER", {
        clientId: "client-1",
        manualAccept: true,
      });

      expect(result.data.recommendations.status).toBe("ok");
      expect(mockRepository.createAuditLog).toHaveBeenCalledTimes(1);
      expect(mockRepository.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          eventName: "strategy.recommendation.manual_accept",
          details: expect.objectContaining({
            timestamp: expect.any(String),
            userId: "u1",
            actionType: "strategy.recommendation.manual_accept",
            artifactId: expect.stringContaining("communication-improvement-recommendations-"),
            diff: expect.any(Object),
          }),
        }),
      );
    });
  });
});

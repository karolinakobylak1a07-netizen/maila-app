import { beforeEach, describe, expect, it, vi } from "vitest";
import { AnalysisDomainError, AnalysisService } from "./analysis.logic";
import type { AnalysisRepository } from "./analysis.repository";

describe("AnalysisService.getOptimizationAreas", () => {
  let analysisService: AnalysisService;
  let mockRepository: Partial<AnalysisRepository>;

  beforeEach(() => {
    mockRepository = {
      findLatestSyncRun: vi.fn(),
      listInventory: vi.fn(),
      findMembership: vi.fn(),
      listRbacPoliciesByRole: vi.fn(),
    };

    analysisService = new AnalysisService({
      repository: mockRepository as AnalysisRepository,
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
});

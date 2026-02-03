import { AnalysisRepository } from "./analysis.repository";
import { db } from "~/server/db";
import type { KlaviyoEntityType } from "../contracts/analysis.schema";
import type {
  OptimizationArea,
  OptimizationStatus,
  PriorityLevel,
  ExpectedImpact,
  ConfidenceLevel,
} from "../contracts/analysis.schema";

export class AnalysisDomainError extends Error {
  public readonly domainCode: string;
  public readonly details: Record<string, unknown> | undefined;
  public readonly requestId: string;

  constructor(
    domainCode: string,
    message: string,
    details: Record<string, unknown> = {},
    requestId: string = "unknown",
  ) {
    super(message);
    this.name = "AnalysisDomainError";
    this.domainCode = domainCode;
    this.details = details;
    this.requestId = requestId;
  }
}

export interface AnalysisServiceDependencies {
  repository: AnalysisRepository;
  adapter: any;
}

export interface GetOptimizationAreasInput {
  clientId: string;
  requestId?: string;
  limit?: number;
  showPartialOnTimeout?: boolean;
}

export interface AnalysisResult {
  data: {
    areas: OptimizationArea[];
    summary?: {
      totalAreas: number;
      criticalCount: number;
      highCount: number;
      mediumCount: number;
      lowCount: number;
      avgConfidence: number;
      avgExpectedImpact: number;
    };
  };
  meta: {
    generatedAt: Date;
    lastSyncRequestId: string;
    hasInsufficientData: boolean;
    dataIssue?: string;
  };
}

export interface GetOptimizationAreasOutput {
  data: {
    areas: OptimizationArea[];
    summary?: {
      totalAreas: number;
      criticalCount: number;
      highCount: number;
      mediumCount: number;
      lowCount: number;
      avgConfidence: ConfidenceLevel;
      avgExpectedImpact: number;
    };
  };
  meta: {
    generatedAt: Date;
    lastSyncRequestId: string;
    status: "OK" | "insufficient_data_for_priority" | "timed_out";
    hasInsufficientData: boolean;
    hasTimedOut: boolean;
    missingData?: string[];
    dataIssue?: string;
    requestId: string;
  };
}

export class AnalysisService {
  private readonly repository: AnalysisRepository;

  constructor(dependencies?: Partial<AnalysisServiceDependencies>) {
    this.repository = dependencies?.repository ?? new AnalysisRepository(db);
  }

  async getSyncStatus(
    _userId: string,
    _role: "OWNER" | "STRATEGY" | "CONTENT" | "OPERATIONS",
    input: { clientId: string },
  ) {
    const syncRun = await this.repository.findLatestSyncRun(input.clientId);
    if (!syncRun) {
      return {
        data: {
          lastSyncAt: null,
          lastSyncStatus: "IN_PROGRESS",
          stale: true,
          counts: { accountCount: 0, flowCount: 0, emailCount: 0, formCount: 0 },
        },
      };
    }

    return {
      data: {
        lastSyncAt: syncRun.finishedAt ?? syncRun.startedAt,
        lastSyncStatus: syncRun.status,
        stale: false,
        counts: {
          accountCount: syncRun.accountCount ?? 0,
          flowCount: syncRun.flowCount ?? 0,
          emailCount: syncRun.emailCount ?? 0,
          formCount: syncRun.formCount ?? 0,
        },
      },
    };
  }

  async runSync(
    _userId: string,
    _role: "OWNER" | "STRATEGY" | "CONTENT" | "OPERATIONS",
    payload: { clientId: string; trigger: "MANUAL" | "DAILY"; requestId: string },
  ) {
    return {
      data: {
        status: "OK",
        requestId: payload.requestId,
        clientId: payload.clientId,
        trigger: payload.trigger,
      },
    };
  }

  async runDailySyncForAllClients(requestId: string) {
    return {
      data: {
        status: "OK",
        requestId,
      },
    };
  }

  async getOptimizationAreas(
    userId: string,
    role: "OWNER" | "STRATEGY",
    input: GetOptimizationAreasInput,
  ): Promise<GetOptimizationAreasOutput> {
    const requestId = input.requestId ?? `optimization-${Date.now()}`;

    await this.validateAccess(userId, role, input.clientId);

    const syncRun = await this.repository.findLatestSyncRun(input.clientId);
    if (!syncRun) {
      throw new AnalysisDomainError(
        "validation",
        "SYNC_REQUIRED_BEFORE_OPTIMIZATION",
        { missingField: "syncRun" },
        requestId,
      );
    }

    const syncMode = this.assertSyncStatus(
      syncRun.status,
      requestId,
      Boolean(input.showPartialOnTimeout),
    );

    const inventory = await this.repository.listInventory(input.clientId);
    const optimizationAreas = this.generateOptimizationAreas(inventory, requestId, syncRun);
    const missingData = this.collectMissingData(
      inventory,
      syncRun.status,
      optimizationAreas.length,
    );
    const limit = input.limit ?? 10;
    const minimumAreas = 3;

    if (syncMode === "timed_out") {
      if (optimizationAreas.length === 0) {
        return this.createInsufficientDataResult(requestId, syncRun, missingData);
      }

      const partialSize = Math.max(1, Math.min(limit, Math.floor(limit / 2) || 1));
      return this.createTimedOutResult(
        requestId,
        syncRun,
        optimizationAreas.slice(0, partialSize).map((area) => ({
          ...area,
          status: "timed_out",
        })),
      );
    }

    if (syncMode === "insufficient" || optimizationAreas.length < minimumAreas) {
      return this.createInsufficientDataResult(requestId, syncRun, missingData);
    }

    const summary = this.calculateSummary(optimizationAreas);

    return {
      data: {
        areas: optimizationAreas.slice(0, limit),
        summary,
      },
      meta: {
        generatedAt: new Date(),
        lastSyncRequestId: syncRun.requestId,
        status: "OK",
        hasInsufficientData: false,
        hasTimedOut: false,
        requestId,
      },
    };
  }

  private async validateAccess(userId: string, role: "OWNER" | "STRATEGY", clientId: string) {
    const membership = await this.repository.findMembership(userId, clientId);
    if (!membership) {
      throw new AnalysisDomainError(
        "forbidden",
        "forbidden",
        { reason: "user_not_member_of_client" },
        "unknown",
      );
    }

    const policies = await this.repository.listRbacPoliciesByRole(role);
    const auditPolicy = policies.find((p) => p.module === "AUDIT");
    if (!auditPolicy || !auditPolicy.canView) {
      throw new AnalysisDomainError(
        "forbidden",
        "rbac_module_view_forbidden",
        { module: "AUDIT", role },
        "unknown",
      );
    }
  }

  private assertSyncStatus(
    status: string,
    requestId: string,
    showPartialOnTimeout: boolean,
  ): "ok" | "insufficient" | "timed_out" {
    const validStatuses = ["OK", "IN_PROGRESS", "FAILED_AUTH", "PARTIAL_OR_TIMEOUT"];
    if (!validStatuses.includes(status)) {
      throw new AnalysisDomainError(
        "validation",
        "INVALID_SYNC_STATUS",
        { invalidStatus: status },
        requestId,
      );
    }

    if (status === "IN_PROGRESS") {
      return "insufficient";
    }

    if (status === "FAILED_AUTH") {
      return "insufficient";
    }

    if (status === "PARTIAL_OR_TIMEOUT") {
      return showPartialOnTimeout ? "timed_out" : "insufficient";
    }

    return "ok";
  }

  private createInsufficientDataResult(
    requestId: string,
    syncRun: { requestId: string },
    missingData: string[],
  ): GetOptimizationAreasOutput {
    return {
      data: {
        areas: [],
        summary: undefined,
      },
      meta: {
        generatedAt: new Date(),
        lastSyncRequestId: syncRun.requestId,
        status: "insufficient_data_for_priority",
        hasInsufficientData: true,
        hasTimedOut: false,
        missingData,
        dataIssue: "insufficient_data_for_priority",
        requestId,
      },
    };
  }

  private createTimedOutResult(
    requestId: string,
    syncRun: { requestId: string },
    partialAreas: OptimizationArea[],
  ): GetOptimizationAreasOutput {
    return {
      data: {
        areas: partialAreas,
        summary: this.calculateSummary(partialAreas),
      },
      meta: {
        generatedAt: new Date(),
        lastSyncRequestId: syncRun.requestId,
        status: "timed_out",
        hasInsufficientData: false,
        hasTimedOut: true,
        requestId,
      },
    };
  }

  private collectMissingData(
    inventory: Array<{ entityType: KlaviyoEntityType }>,
    syncStatus: string,
    optimizationAreaCount: number,
  ): string[] {
    const missingData: string[] = [];
    if (syncStatus === "IN_PROGRESS") missingData.push("sync_not_finished");
    if (syncStatus === "FAILED_AUTH") missingData.push("valid_klaviyo_auth");
    if (syncStatus === "PARTIAL_OR_TIMEOUT" && optimizationAreaCount === 0) {
      missingData.push("complete_sync_run");
    }

    const flowCount = inventory.filter((item) => item.entityType === "FLOW").length;
    if (flowCount === 0) missingData.push("flows");
    if (optimizationAreaCount < 3) missingData.push("historical_metrics");

    return Array.from(new Set(missingData));
  }

  private generateOptimizationAreas(
    inventory: any[],
    requestId: string,
    syncRun: any,
  ): OptimizationArea[] {
    const now = new Date();
    const age = (now.getTime() - syncRun.startedAt.getTime()) / (1000 * 60 * 60 * 24);

    const areas: OptimizationArea[] = [];

    inventory.forEach((item) => {
      const category = this.categorizeEntityType(item.entityType);
      const priority = this.calculatePriority(item.entityType, item.itemStatus, age);
      const expectedImpact = this.calculateExpectedImpact(item.entityType, priority);
      const confidence = this.calculateConfidence(item.entityType, item.itemStatus, priority);
      const status = this.determineStatus(item.itemStatus, age);

      if (status !== "OK" || priority !== "LOW") {
        areas.push({
          name: item.name,
          category,
          priority,
          expectedImpact,
          confidence,
          source: `inventory.${item.entityType.toLowerCase()}`,
          requestId,
          lastSyncRequestId: syncRun.requestId,
          refreshWindow: this.calculateRefreshWindow(item.itemStatus, age),
          status,
        });
      }
    });

    return areas.sort((a, b) => this.compareByScore(a, b));
  }

  private categorizeEntityType(entityType: KlaviyoEntityType): "FLOW" | "SEGMENT" | "LOGIC" {
    if (entityType === "FLOW") return "FLOW";
    if (entityType === "EMAIL") return "SEGMENT";
    return "LOGIC";
  }

  private calculateExpectedImpact(entityType: KlaviyoEntityType, priority: PriorityLevel): ExpectedImpact {
    const baseImpact = {
      CRITICAL: 90,
      HIGH: 72,
      MEDIUM: 54,
      LOW: 36,
    };

    const entityBonus = {
      ACCOUNT: 1.0,
      FLOW: 1.2,
      EMAIL: 1.1,
      FORM: 1.0,
    };

    return Math.min(100, Math.round(baseImpact[priority] * (entityBonus[entityType] ?? 1)));
  }

  private calculatePriority(
    entityType: KlaviyoEntityType,
    itemStatus: string,
    age: number,
  ): PriorityLevel {
    if (itemStatus === "disabled") return "CRITICAL";
    if (itemStatus === "GAP") return "HIGH";

    if (entityType === "FLOW") {
      return age > 7 ? "MEDIUM" : "HIGH";
    }
    if (entityType === "EMAIL") {
      return age > 14 ? "MEDIUM" : "HIGH";
    }
    return "LOW";
  }

  private calculateConfidence(
    _entityType: KlaviyoEntityType,
    itemStatus: string,
    priority: PriorityLevel,
  ): ConfidenceLevel {
    if (itemStatus === "GAP" || itemStatus === "disabled") {
      return 92;
    }

    if (priority === "CRITICAL") {
      return 84;
    }

    if (priority === "HIGH") {
      return 76;
    }

    if (priority === "MEDIUM") {
      return 68;
    }

    return 60;
  }

  private determineStatus(itemStatus: string, age: number): OptimizationStatus {
    if (itemStatus === "GAP") return "GAP";
    if (itemStatus === "disabled") return "GAP";
    if (age > 7) return "GAP";
    return "OK";
  }

  private calculateRefreshWindow(itemStatus: string, age: number): number {
    if (itemStatus === "disabled" || age > 7) return 1;
    if (age > 3) return 3;
    return 7;
  }

  private compareByScore(a: OptimizationArea, b: OptimizationArea): number {
    const scoreA = this.calculateAreaScore(a);
    const scoreB = this.calculateAreaScore(b);
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }

    const categoryCompare = a.category.localeCompare(b.category);
    if (categoryCompare !== 0) {
      return categoryCompare;
    }

    return a.name.localeCompare(b.name);
  }

  private calculateAreaScore(area: OptimizationArea): number {
    const priorityScore = {
      CRITICAL: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };

    const statusMultiplier = {
      OK: 0.6,
      GAP: 1.0,
      insufficient_data_for_priority: 0.4,
      timed_out: 0.75,
    };

    return Math.round(
      priorityScore[area.priority] *
      statusMultiplier[area.status] *
      (area.expectedImpact / 100) *
      (area.confidence / 100) *
      1000,
    );
  }

  private calculateSummary(areas: OptimizationArea[]): AnalysisResult["data"]["summary"] {
    if (areas.length === 0) {
      return undefined;
    }

    return {
      totalAreas: areas.length,
      criticalCount: areas.filter((a) => a.priority === "CRITICAL").length,
      highCount: areas.filter((a) => a.priority === "HIGH").length,
      mediumCount: areas.filter((a) => a.priority === "MEDIUM").length,
      lowCount: areas.filter((a) => a.priority === "LOW").length,
      avgConfidence: Math.round(
        areas.reduce((sum, a) => sum + a.confidence, 0) / areas.length,
      ),
      avgExpectedImpact: Math.round(
        areas.reduce((sum, a) => sum + a.expectedImpact, 0) / areas.length,
      ),
    };
  }

  async getGapReport(
    userId: string,
    role: "OWNER" | "STRATEGY",
    input: { clientId: string },
  ) {
    const requestId = "gap-report-" + Date.now();

    const membership = await this.repository.findMembership(userId, input.clientId);
    if (!membership) {
      throw new AnalysisDomainError(
        "forbidden",
        "forbidden",
        { reason: "user_not_member_of_client" },
        requestId,
      );
    }

    const syncRun = await this.repository.findLatestSyncRun(input.clientId);
    if (!syncRun) {
      throw new AnalysisDomainError(
        "validation",
        "SYNC_REQUIRED_BEFORE_GAP_REPORT",
        { missingField: "syncRun" },
        requestId,
      );
    }

    const age = (new Date().getTime() - syncRun.startedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (age > 24) {
      throw new AnalysisDomainError(
        "validation",
        "STALE_SYNC_DATA",
        { staleDays: Math.round(age), maxAgeDays: 24 },
        requestId,
      );
    }

    if (syncRun.status === "FAILED_AUTH") {
      throw new AnalysisDomainError(
        "validation",
        "INVALID_SYNC_STATUS",
        { invalidStatus: "FAILED_AUTH" },
        requestId,
      );
    }

    const inventory = await this.repository.listInventory(input.clientId);

    const gaps = inventory
      .map((item) => ({
        id: item.externalId,
        category: item.entityType === "FLOW" ? "FLOW" : item.entityType === "EMAIL" ? "SEGMENT" : "LOGIC",
        status: item.itemStatus === "GAP" ? "GAP" : age > 24 ? "INSUFFICIENT_DATA" : "OK",
        priority: item.itemStatus === "GAP" ? "HIGH" : age > 24 ? "MEDIUM" : "LOW",
        name: item.name,
        reason: item.itemStatus === "GAP" ? "Configuration gap detected in Klaviyo entity" : "Data is older than 24 hours",
      }))
      .filter((g) => g.status !== "OK");

    return {
      data: {
        items: gaps,
        total: inventory.length,
        gaps: gaps.filter((g) => g.status === "GAP").length,
        stale: gaps.filter((g) => g.status === "INSUFFICIENT_DATA").length,
        insufficient: gaps.filter((g) => g.status === "INSUFFICIENT_DATA").length,
      },
      meta: {
        generatedAt: new Date(),
        lastSyncRequestId: syncRun.requestId,
        hasStaleData: gaps.some((g) => g.status === "INSUFFICIENT_DATA"),
        requestId,
      },
    };
  }
}

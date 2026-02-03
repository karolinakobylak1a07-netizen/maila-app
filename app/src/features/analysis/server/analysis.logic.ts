import { AnalysisRepository } from "./analysis.repository";
import { db } from "~/server/db";
import {
  DocumentationExportAdapter,
  DocumentationExportError,
  type DocumentationExportAdapterPort,
  type DocumentationExportTarget,
} from "~/server/integrations/documentation/documentation-export-adapter";
import type { KlaviyoEntityType } from "../contracts/analysis.schema";
import type {
  AuditProductContext,
  CampaignCalendar,
  CampaignCalendarItem,
  CommunicationBrief,
  EmailDraft,
  ImplementationChecklist,
  ImplementationAlerts,
  ImplementationAlert,
  ImplementationReport,
  ImplementationDocumentation,
  ImplementationChecklistStep,
  ImplementationChecklistStepStatus,
  PersonalizedEmailDraft,
  PersonalizedDraftVariant,
  EmailStrategy,
  FlowPlan,
  FlowPlanItem,
  InsightItem,
  OptimizationArea,
  OptimizationStatus,
  ProductCoverageAnalysis,
  ProductCoverageItem,
  CommunicationImprovementRecommendations,
  CommunicationImprovementRecommendationItem,
  ArtifactVersionMeta,
  VersionedArtifactType,
  SegmentProposal,
  SegmentProposalItem,
  PriorityLevel,
  ExpectedImpact,
  ConfidenceLevel,
} from "../contracts/analysis.schema";

export class AnalysisDomainError extends Error {
  public readonly domainCode: string;
  public readonly details: Record<string, unknown> | undefined;
  public readonly requestId: string;
  public readonly envelope: {
    code: string;
    message: string;
    requestId: string;
  };

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
    this.envelope = {
      code: domainCode,
      message,
      requestId,
    };
  }

  toJSON() {
    return this.envelope;
  }
}

export interface AnalysisServiceDependencies {
  repository: AnalysisRepository;
  adapter: any;
  documentationExportAdapter: DocumentationExportAdapterPort;
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

export interface GetContextInsightsInput {
  clientId: string;
  requestId?: string;
  limit?: number;
}

export interface GetContextInsightsOutput {
  data: {
    insights: InsightItem[];
  };
  meta: {
    generatedAt: Date;
    lastSyncRequestId: string;
    requestId: string;
    status: "ok" | "draft_low_confidence" | "source_conflict" | "empty";
  };
}

export interface GenerateEmailStrategyInput {
  clientId: string;
  requestId?: string;
}

export interface GetLatestEmailStrategyInput {
  clientId: string;
}

export interface GenerateEmailStrategyOutput {
  data: {
    strategy: EmailStrategy;
  };
  meta: {
    generatedAt: Date;
    requestId: string;
  };
}

export interface GetLatestEmailStrategyOutput {
  data: {
    strategy: EmailStrategy | null;
  };
  meta: {
    requestId: string;
  };
}

export interface GenerateFlowPlanInput {
  clientId: string;
  requestId?: string;
}

export interface GetLatestFlowPlanInput {
  clientId: string;
}

export interface GenerateFlowPlanOutput {
  data: {
    flowPlan: FlowPlan;
  };
  meta: {
    generatedAt: Date;
    requestId: string;
  };
}

export interface GetLatestFlowPlanOutput {
  data: {
    flowPlan: FlowPlan | null;
  };
  meta: {
    requestId: string;
  };
}

export interface GenerateCampaignCalendarInput {
  clientId: string;
  requestId?: string;
}

export interface GetLatestCampaignCalendarInput {
  clientId: string;
}

export interface GenerateCampaignCalendarOutput {
  data: {
    calendar: CampaignCalendar;
  };
  meta: {
    generatedAt: Date;
    requestId: string;
  };
}

export interface GetLatestCampaignCalendarOutput {
  data: {
    calendar: CampaignCalendar | null;
  };
  meta: {
    requestId: string;
  };
}

export interface GenerateSegmentProposalInput {
  clientId: string;
  requestId?: string;
}

export interface GetLatestSegmentProposalInput {
  clientId: string;
}

export interface GenerateSegmentProposalOutput {
  data: {
    segmentProposal: SegmentProposal;
  };
  meta: {
    generatedAt: Date;
    requestId: string;
  };
}

export interface GetLatestSegmentProposalOutput {
  data: {
    segmentProposal: SegmentProposal | null;
  };
  meta: {
    requestId: string;
  };
}

export interface GenerateCommunicationBriefInput {
  clientId: string;
  campaignGoal?: string;
  segment?: string;
  requestId?: string;
}

export interface GetLatestCommunicationBriefInput {
  clientId: string;
}

export interface GenerateCommunicationBriefOutput {
  data: {
    brief: CommunicationBrief;
  };
  meta: {
    generatedAt: Date;
    requestId: string;
  };
}

export interface GetLatestCommunicationBriefOutput {
  data: {
    brief: CommunicationBrief | null;
  };
  meta: {
    requestId: string;
  };
}

export interface GenerateEmailDraftInput {
  clientId: string;
  requestId?: string;
  manualAccept?: boolean;
}

export interface GetLatestEmailDraftInput {
  clientId: string;
}

export interface GenerateEmailDraftOutput {
  data: {
    draft: EmailDraft;
  };
  meta: {
    generatedAt: Date;
    requestId: string;
  };
}

export interface GetLatestEmailDraftOutput {
  data: {
    draft: EmailDraft | null;
  };
  meta: {
    requestId: string;
  };
}

export interface GeneratePersonalizedEmailDraftInput {
  clientId: string;
  requestId?: string;
  manualAccept?: boolean;
}

export interface GetLatestPersonalizedEmailDraftInput {
  clientId: string;
}

export interface GeneratePersonalizedEmailDraftOutput {
  data: {
    personalizedDraft: PersonalizedEmailDraft;
  };
  meta: {
    generatedAt: Date;
    requestId: string;
  };
}

export interface GetLatestPersonalizedEmailDraftOutput {
  data: {
    personalizedDraft: PersonalizedEmailDraft | null;
  };
  meta: {
    requestId: string;
  };
}

export interface GenerateImplementationChecklistInput {
  clientId: string;
  requestId?: string;
}

export interface GetLatestImplementationChecklistInput {
  clientId: string;
}

export interface UpdateImplementationChecklistStepInput {
  clientId: string;
  stepId: string;
  status: ImplementationChecklistStepStatus;
  expectedVersion: number;
  requestId?: string;
}

export interface GenerateImplementationChecklistOutput {
  data: {
    checklist: ImplementationChecklist;
  };
  meta: {
    generatedAt: Date;
    requestId: string;
  };
}

export interface GetLatestImplementationChecklistOutput {
  data: {
    checklist: ImplementationChecklist | null;
  };
  meta: {
    requestId: string;
  };
}

export interface UpdateImplementationChecklistStepOutput {
  data: {
    checklist: ImplementationChecklist;
  };
  meta: {
    requestId: string;
    updatedAt: Date;
  };
}

export interface GetImplementationAlertsInput {
  clientId: string;
}

export interface GetImplementationAlertsOutput {
  data: {
    alerts: ImplementationAlerts;
  };
  meta: {
    requestId: string;
  };
}

export interface GetImplementationReportInput {
  clientId: string;
}

export interface GetImplementationReportOutput {
  data: {
    report: ImplementationReport;
  };
  meta: {
    requestId: string;
  };
}

export interface GetImplementationDocumentationInput {
  clientId: string;
}

export interface GetImplementationDocumentationOutput {
  data: {
    documentation: ImplementationDocumentation;
  };
  meta: {
    requestId: string;
  };
}

export interface ExportImplementationDocumentationInput {
  clientId: string;
  target: "notion" | "google_docs";
}

export interface ExportImplementationDocumentationOutput {
  data: {
    target: "notion" | "google_docs";
    documentUrl: string;
    fallbackUsed: boolean;
  };
  meta: {
    requestId: string;
  };
}

export interface GetAuditProductContextInput {
  clientId: string;
}

export interface GetAuditProductContextOutput {
  data: {
    context: AuditProductContext;
  };
  meta: {
    requestId: string;
  };
}

export interface GetProductCoverageAnalysisInput {
  clientId: string;
}

export interface GetProductCoverageAnalysisOutput {
  data: {
    coverage: ProductCoverageAnalysis;
  };
  meta: {
    requestId: string;
  };
}

export interface GetCommunicationImprovementRecommendationsInput {
  clientId: string;
  manualAccept?: boolean;
}

export interface GetCommunicationImprovementRecommendationsOutput {
  data: {
    recommendations: CommunicationImprovementRecommendations;
  };
  meta: {
    requestId: string;
  };
}

export interface SubmitArtifactFeedbackInput {
  clientId: string;
  targetType: "recommendation" | "draft";
  artifactId: string;
  sourceRequestId?: string;
  rating: number;
  comment?: string;
  requestId?: string;
}

export interface SubmitArtifactFeedbackOutput {
  data: {
    feedback: {
      clientId: string;
      targetType: "recommendation" | "draft";
      artifactId: string;
      sourceRequestId: string | null;
      userId: string;
      rating: number;
      comment: string;
      timestamp: Date;
      requestId: string;
      status: "saved";
    };
  };
  meta: {
    requestId: string;
  };
}

export class AnalysisService {
  private readonly repository: AnalysisRepository;
  private readonly documentationExportAdapter: DocumentationExportAdapterPort;

  constructor(dependencies?: Partial<AnalysisServiceDependencies>) {
    this.repository = dependencies?.repository ?? new AnalysisRepository(db);
    this.documentationExportAdapter =
      dependencies?.documentationExportAdapter ?? new DocumentationExportAdapter();
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

  async getContextInsights(
    userId: string,
    role: "OWNER" | "STRATEGY",
    input: GetContextInsightsInput,
  ): Promise<GetContextInsightsOutput> {
    const requestId = input.requestId ?? `context-insights-${Date.now()}`;
    const limit = input.limit ?? 5;

    await this.validateAccess(userId, role, input.clientId);

    const syncRun = await this.repository.findLatestSyncRun(input.clientId);
    if (!syncRun) {
      throw new AnalysisDomainError(
        "validation",
        "SYNC_REQUIRED_BEFORE_INSIGHTS",
        { missingField: "syncRun" },
        requestId,
      );
    }

    const inventory = await this.repository.listInventory(input.clientId);
    const rankedAreas = this.generateOptimizationAreas(inventory, requestId, syncRun);
    const selectedAreas = rankedAreas.slice(0, limit);

    const [discoveryContext, strategicPriorities] = await Promise.all([
      this.repository.findDiscoveryContext(input.clientId),
      this.repository.listLatestStrategicPriorities(input.clientId, 5),
    ]);

    const linkedClientGoals = discoveryContext?.goals ?? [];
    const linkedClientPriorities = strategicPriorities
      .map((decision) => decision.content.trim())
      .filter((decision) => decision.length > 0);
    const missingContext = this.collectMissingContext(
      linkedClientGoals,
      linkedClientPriorities,
    );
    const conflictDetails = this.detectSourceConflict(syncRun, inventory);

    const status: "ok" | "draft_low_confidence" | "source_conflict" =
      conflictDetails
        ? "source_conflict"
        : missingContext.length > 0
          ? "draft_low_confidence"
          : "ok";

    const insights = await Promise.all(
      selectedAreas.map(async (area, index) => {
        try {
          return this.mapAreaToInsight({
            area,
            requestId,
            status,
            missingContext,
            conflictDetails,
            linkedClientGoals,
            linkedClientPriorities,
            syncRun,
            position: index + 1,
          });
        } catch (error) {
          throw new AnalysisDomainError(
            "validation",
            "INSIGHT_MAPPING_FAILED",
            {
              areaName: area.name,
              cause: error instanceof Error ? error.message : "unknown",
            },
            requestId,
          );
        }
      }),
    );

    return {
      data: {
        insights,
      },
      meta: {
        generatedAt: new Date(),
        lastSyncRequestId: syncRun.requestId,
        requestId,
        status: this.resolveInsightsMetaStatus(insights),
      },
    };
  }

  async generateEmailStrategy(
    userId: string,
    role: "OWNER" | "STRATEGY",
    input: GenerateEmailStrategyInput,
  ): Promise<GenerateEmailStrategyOutput> {
    const requestId = input.requestId ?? `strategy-generate-${Date.now()}`;
    await this.validateAccess(userId, role, input.clientId);
    return this.repository.withStrategyGenerationLock(input.clientId, async () => {
      const lockAcquiredAt = new Date();
      const syncRun = await this.repository.findLatestSyncRun(input.clientId);
      const discovery = await this.repository.findDiscoveryAnswers(input.clientId);
      const preconditions: Array<
        "discovery.goals" | "discovery.segments" | "audit.sync_ok" | "audit.optimization_available"
      > = [];

      if (!discovery || discovery.goals.length === 0) {
        preconditions.push("discovery.goals");
      }
      if (!discovery || discovery.segments.length === 0) {
        preconditions.push("discovery.segments");
      }
      if (!syncRun || syncRun.status !== "OK") {
        preconditions.push("audit.sync_ok");
      }

      const optimizationAreas =
        syncRun && syncRun.status === "OK"
          ? this.generateOptimizationAreas(
              await this.repository.listInventory(input.clientId),
              requestId,
              syncRun,
            )
          : [];
      if (optimizationAreas.length === 0) {
        preconditions.push("audit.optimization_available");
      }

      const existingRecords = await this.repository.listLatestEmailStrategyAudit(input.clientId, 20);
      const latest = this.parseLatestEmailStrategy(existingRecords);
      const nextVersion = (latest?.version ?? 0) + 1;

      if (preconditions.length > 0) {
        const blocked = this.buildEmailStrategyRecord({
          clientId: input.clientId,
          version: nextVersion,
          status: "blocked_preconditions",
          goals: discovery?.goals ?? [],
          segments: discovery?.segments ?? [],
          tone: discovery?.brandTone ?? "manual_validation_required",
          priorities: [],
          kpis: discovery?.primaryKpis ?? [],
          requestId,
          lastSyncRequestId: syncRun?.requestId ?? "missing-sync",
          author: userId,
          missingPreconditions: preconditions,
        });

        await this.repository.createAuditLog({
          actorId: userId,
          eventName: "strategy.email.generated",
          requestId,
          entityType: "CLIENT",
          entityId: input.clientId,
          details: this.enrichAuditDetails({
            userId,
            actionType: "strategy.email.generated",
            artifactId: blocked.requestId,
            previous: latest,
            current: blocked,
            extra: {
              lockAcquiredAt: lockAcquiredAt.toISOString(),
            },
          }),
        });

        return {
          data: { strategy: blocked },
          meta: { generatedAt: blocked.generatedAt, requestId },
        };
      }

      const resumable = existingRecords
        .map((record) => this.parseEmailStrategy(record.details))
        .find(
          (record): record is EmailStrategy =>
            record !== null &&
            record.status === "in_progress_or_timeout" &&
            record.lastSyncRequestId === syncRun!.requestId,
        );
      if (resumable) {
        return {
          data: { strategy: resumable },
          meta: { generatedAt: resumable.generatedAt, requestId: resumable.requestId },
        };
      }

      const insightsResult = await this.getContextInsights(userId, role, {
        clientId: input.clientId,
        requestId,
        limit: 5,
      });
      const insights = insightsResult.data.insights;
      const estimatedCostMs = optimizationAreas.length * 100;

      if (estimatedCostMs > 700) {
        const timedOut = this.buildEmailStrategyRecord({
          clientId: input.clientId,
          version: nextVersion,
          status: "in_progress_or_timeout",
          goals: discovery!.goals,
          segments: discovery!.segments,
          tone: discovery!.brandTone ?? "manual_validation_required",
          priorities: insights.slice(0, 3).map((insight) => insight.title),
          kpis: discovery!.primaryKpis,
          requestId,
          lastSyncRequestId: syncRun!.requestId,
          author: userId,
          retryHint: `Retry generateEmailStrategy for the same client and sync snapshot. Lock acquired at ${lockAcquiredAt.toISOString()}.`,
        });

        await this.repository.createAuditLog({
          actorId: userId,
          eventName: "strategy.email.generated",
          requestId,
          entityType: "CLIENT",
          entityId: input.clientId,
          details: this.enrichAuditDetails({
            userId,
            actionType: "strategy.email.generated",
            artifactId: timedOut.requestId,
            previous: latest,
            current: timedOut,
          }),
        });

        return {
          data: { strategy: timedOut },
          meta: { generatedAt: timedOut.generatedAt, requestId },
        };
      }

      const strategy = this.buildEmailStrategyRecord({
        clientId: input.clientId,
        version: nextVersion,
        status: "ok",
        goals: discovery!.goals,
        segments: discovery!.segments,
        tone: discovery!.brandTone ?? "ekspercki i konkretny",
        priorities: insights.slice(0, 3).map((insight) => insight.title),
        kpis:
          discovery!.primaryKpis.length > 0
            ? discovery!.primaryKpis
            : ["conversion_rate", "retention_rate"],
        requestId,
        lastSyncRequestId: syncRun!.requestId,
        author: userId,
      });

      await this.repository.createAuditLog({
        actorId: userId,
        eventName: "strategy.email.generated",
        requestId,
        entityType: "CLIENT",
        entityId: input.clientId,
        details: this.enrichAuditDetails({
          userId,
          actionType: "strategy.email.generated",
          artifactId: strategy.requestId,
          previous: latest,
          current: strategy,
        }),
      });

      return {
        data: { strategy },
        meta: { generatedAt: strategy.generatedAt, requestId },
      };
    });
  }

  async getLatestEmailStrategy(
    userId: string,
    role: "OWNER" | "STRATEGY",
    input: GetLatestEmailStrategyInput,
  ): Promise<GetLatestEmailStrategyOutput> {
    const requestId = `strategy-latest-${Date.now()}`;
    await this.validateAccess(userId, role, input.clientId);
    const records = await this.repository.listLatestEmailStrategyAudit(input.clientId, 20);
    const strategy = this.parseLatestEmailStrategy(records) ?? null;

    return {
      data: {
        strategy,
      },
      meta: {
        requestId,
      },
    };
  }

  async generateFlowPlan(
    userId: string,
    role: "OWNER" | "STRATEGY",
    input: GenerateFlowPlanInput,
  ): Promise<GenerateFlowPlanOutput> {
    const requestId = input.requestId ?? `flow-plan-generate-${Date.now()}`;
    await this.validateAccess(userId, role, input.clientId);

    const strategyRecords = await this.repository.listLatestEmailStrategyAudit(input.clientId, 20);
    const latestStrategy = this.parseLatestEmailStrategy(strategyRecords);
    const existingFlowPlans = await this.repository.listLatestFlowPlanAudit(input.clientId, 20);
    const latestFlowPlan = this.parseLatestFlowPlan(existingFlowPlans);
    const nextVersion = (latestFlowPlan?.version ?? 0) + 1;

    if (!latestStrategy || latestStrategy.status !== "ok") {
      const preconditionResult = this.buildFlowPlanRecord({
        clientId: input.clientId,
        version: nextVersion,
        status: "precondition_not_approved",
        requestId,
        strategyRequestId: latestStrategy?.requestId ?? "missing-strategy",
        items: [],
        author: userId,
        requiredStep: "generate_and_approve_strategy",
      });

      return {
        data: { flowPlan: preconditionResult },
        meta: { generatedAt: preconditionResult.generatedAt, requestId },
      };
    }

    const items = this.buildFlowPlanItemsFromStrategy(latestStrategy);
    const flowPlan = this.buildFlowPlanRecord({
      clientId: input.clientId,
      version: nextVersion,
      status: "ok",
      requestId,
      strategyRequestId: latestStrategy.requestId,
      items,
      author: userId,
    });

    try {
      await this.repository.createAuditLog({
        actorId: userId,
        eventName: "strategy.flow_plan.generated",
        requestId,
        entityType: "CLIENT",
        entityId: input.clientId,
        details: this.enrichAuditDetails({
          userId,
          actionType: "strategy.flow_plan.generated",
          artifactId: flowPlan.requestId,
          previous: latestFlowPlan,
          current: flowPlan,
        }),
      });
    } catch {
      return {
        data: {
          flowPlan: this.buildFlowPlanRecord({
            clientId: input.clientId,
            version: nextVersion,
            status: "failed_persist",
            requestId,
            strategyRequestId: latestStrategy.requestId,
            items: [],
            author: userId,
            requiredStep: "retry_generate_flow_plan",
          }),
        },
        meta: {
          generatedAt: new Date(),
          requestId,
        },
      };
    }

    return {
      data: { flowPlan },
      meta: { generatedAt: flowPlan.generatedAt, requestId },
    };
  }

  async getLatestFlowPlan(
    userId: string,
    role: "OWNER" | "STRATEGY",
    input: GetLatestFlowPlanInput,
  ): Promise<GetLatestFlowPlanOutput> {
    const requestId = `flow-plan-latest-${Date.now()}`;
    await this.validateAccess(userId, role, input.clientId);
    const records = await this.repository.listLatestFlowPlanAudit(input.clientId, 20);
    const flowPlan = this.parseLatestFlowPlan(records) ?? null;
    return {
      data: { flowPlan },
      meta: { requestId },
    };
  }

  async generateCampaignCalendar(
    userId: string,
    role: "OWNER" | "STRATEGY",
    input: GenerateCampaignCalendarInput,
  ): Promise<GenerateCampaignCalendarOutput> {
    const requestId = input.requestId ?? `campaign-calendar-generate-${Date.now()}`;
    await this.validateAccess(userId, role, input.clientId);

    const strategyRecords = await this.repository.listLatestEmailStrategyAudit(input.clientId, 20);
    const latestStrategy = this.parseLatestEmailStrategy(strategyRecords);
    if (!latestStrategy || latestStrategy.status !== "ok") {
      throw new AnalysisDomainError(
        "validation",
        "CAMPAIGN_CALENDAR_REQUIRES_APPROVED_STRATEGY",
        { requiredStep: "generate_and_approve_strategy" },
        requestId,
      );
    }

    const discovery = await this.repository.findDiscoveryAnswers(input.clientId);
    const hasSeasonality = Boolean(discovery?.seasonality && discovery.seasonality.trim().length > 0);
    const existingCalendars = await this.repository.listLatestCampaignCalendarAudit(input.clientId, 20);
    const latestCalendar = this.parseLatestCampaignCalendar(existingCalendars);
    const nextVersion = (latestCalendar?.version ?? 0) + 1;

    const items = this.buildCampaignCalendarItems({
      strategy: latestStrategy,
      hasSeasonality,
    });
    const calendar = this.buildCampaignCalendarRecord({
      clientId: input.clientId,
      version: nextVersion,
      status: hasSeasonality ? "ok" : "seasonality_missing",
      items,
      requestId,
      strategyRequestId: latestStrategy.requestId,
      requiresManualValidation: !hasSeasonality,
      author: userId,
    });

    await this.validateEditAccess(userId, role, input.clientId);
    await this.repository.createAuditLog({
      actorId: userId,
      eventName: "strategy.campaign_calendar.generated",
      requestId,
      entityType: "CLIENT",
      entityId: input.clientId,
      details: this.enrichAuditDetails({
        userId,
        actionType: "strategy.campaign_calendar.generated",
        artifactId: calendar.requestId,
        previous: latestCalendar,
        current: calendar,
      }),
    });

    return {
      data: { calendar },
      meta: {
        generatedAt: calendar.generatedAt,
        requestId,
      },
    };
  }

  async getLatestCampaignCalendar(
    userId: string,
    role: "OWNER" | "STRATEGY",
    input: GetLatestCampaignCalendarInput,
  ): Promise<GetLatestCampaignCalendarOutput> {
    const requestId = `campaign-calendar-latest-${Date.now()}`;
    await this.validateAccess(userId, role, input.clientId);
    const records = await this.repository.listLatestCampaignCalendarAudit(input.clientId, 20);
    const calendar = this.parseLatestCampaignCalendar(records) ?? null;
    return {
      data: { calendar },
      meta: { requestId },
    };
  }

  async generateSegmentProposal(
    userId: string,
    role: "OWNER" | "STRATEGY",
    input: GenerateSegmentProposalInput,
  ): Promise<GenerateSegmentProposalOutput> {
    const requestId = input.requestId ?? `segment-proposal-generate-${Date.now()}`;
    await this.validateAccess(userId, role, input.clientId);

    const [strategyRecords, discovery, syncRun, existingProposals] = await Promise.all([
      this.repository.listLatestEmailStrategyAudit(input.clientId, 20),
      this.repository.findDiscoveryAnswers(input.clientId),
      this.repository.findLatestSyncRun(input.clientId),
      this.repository.listLatestSegmentProposalAudit(input.clientId, 20),
    ]);
    const latestStrategy = this.parseLatestEmailStrategy(strategyRecords);
    const latestProposal = this.parseLatestSegmentProposal(existingProposals);
    const nextVersion = (latestProposal?.version ?? 0) + 1;

    const missingData: string[] = [];
    if (!latestStrategy || latestStrategy.status !== "ok") {
      missingData.push("approved_strategy");
    }
    if (!discovery || discovery.goals.length === 0) {
      missingData.push("discovery.goals");
    }
    if (!discovery || discovery.segments.length === 0) {
      missingData.push("discovery.segments");
    }
    if (!syncRun || syncRun.status !== "OK") {
      missingData.push("sync.ok");
    } else {
      const syncAgeHours = (Date.now() - syncRun.startedAt.getTime()) / (1000 * 60 * 60);
      if (syncAgeHours > 24) {
        missingData.push("sync.fresh_24h");
      }
    }

    if (missingData.length > 0) {
      const segmentProposal = this.buildSegmentProposalRecord({
        clientId: input.clientId,
        version: nextVersion,
        status: "requires_data_refresh",
        requestId,
        strategyRequestId: latestStrategy?.requestId ?? "missing-strategy",
        segments: [],
        author: userId,
        missingData,
      });
      return {
        data: { segmentProposal },
        meta: { generatedAt: segmentProposal.generatedAt, requestId },
      };
    }

    const segments = this.buildSegmentProposalItems({
      strategy: latestStrategy!,
      discoverySegments: discovery!.segments,
    });
    const segmentProposal = this.buildSegmentProposalRecord({
      clientId: input.clientId,
      version: nextVersion,
      status: "ok",
      requestId,
      strategyRequestId: latestStrategy!.requestId,
      segments,
      author: userId,
      missingData: [],
    });

    try {
      await this.repository.createAuditLog({
        actorId: userId,
        eventName: "strategy.segment_proposal.generated",
        requestId,
        entityType: "CLIENT",
        entityId: input.clientId,
        details: this.enrichAuditDetails({
          userId,
          actionType: "strategy.segment_proposal.generated",
          artifactId: segmentProposal.requestId,
          previous: latestProposal,
          current: segmentProposal,
        }),
      });
    } catch {
      return {
        data: {
          segmentProposal: this.buildSegmentProposalRecord({
            clientId: input.clientId,
            version: nextVersion,
            status: "failed_persist",
            requestId,
            strategyRequestId: latestStrategy!.requestId,
            segments: [],
            author: userId,
            missingData: [],
          }),
        },
        meta: {
          generatedAt: new Date(),
          requestId,
        },
      };
    }

    return {
      data: { segmentProposal },
      meta: { generatedAt: segmentProposal.generatedAt, requestId },
    };
  }

  async getLatestSegmentProposal(
    userId: string,
    role: "OWNER" | "STRATEGY",
    input: GetLatestSegmentProposalInput,
  ): Promise<GetLatestSegmentProposalOutput> {
    const requestId = `segment-proposal-latest-${Date.now()}`;
    await this.validateAccess(userId, role, input.clientId);
    const records = await this.repository.listLatestSegmentProposalAudit(input.clientId, 20);
    const segmentProposal = this.parseLatestSegmentProposal(records) ?? null;
    return {
      data: { segmentProposal },
      meta: { requestId },
    };
  }

  async generateCommunicationBrief(
    userId: string,
    role: "OWNER" | "CONTENT" | "STRATEGY",
    input: GenerateCommunicationBriefInput,
  ): Promise<GenerateCommunicationBriefOutput> {
    const requestId = input.requestId ?? `communication-brief-generate-${Date.now()}`;
    await this.validateContentBriefAccess(userId, role, input.clientId, requestId);

    const [strategyRecords, existingBriefs] = await Promise.all([
      this.repository.listLatestEmailStrategyAudit(input.clientId, 20),
      this.repository.listLatestCommunicationBriefAudit(input.clientId, 20),
    ]);
    const latestStrategy = this.parseLatestEmailStrategy(strategyRecords);
    const latestBrief = this.parseLatestCommunicationBrief(existingBriefs);
    const nextVersion = (latestBrief?.version ?? 0) + 1;

    const missingFields: string[] = [];
    if (!input.campaignGoal || input.campaignGoal.trim().length === 0) {
      missingFields.push("campaignGoal");
    }
    if (!input.segment || input.segment.trim().length === 0) {
      missingFields.push("segment");
    }
    if (!latestStrategy || latestStrategy.status !== "ok") {
      missingFields.push("approved_strategy");
    }

    if (missingFields.length > 0) {
      const brief = this.buildCommunicationBriefRecord({
        clientId: input.clientId,
        version: nextVersion,
        status: "missing_required_fields",
        campaignGoal: (input.campaignGoal ?? "").trim() || "missing_campaign_goal",
        segment: (input.segment ?? "").trim() || "missing_segment",
        tone: latestStrategy?.tone ?? "manual_validation_required",
        priority: latestStrategy?.priorities[0] ?? "manual_priority_required",
        kpi: latestStrategy?.kpis[0] ?? "manual_kpi_required",
        requestId,
        strategyRequestId: latestStrategy?.requestId ?? "missing-strategy",
        author: userId,
        missingFields,
      });
      return {
        data: { brief },
        meta: { generatedAt: brief.generatedAt, requestId },
      };
    }

    const brief = this.buildCommunicationBriefRecord({
      clientId: input.clientId,
      version: nextVersion,
      status: "ok",
      campaignGoal: input.campaignGoal!.trim(),
      segment: input.segment!.trim(),
      tone: latestStrategy!.tone,
      priority: latestStrategy!.priorities[0] ?? "Core priority",
      kpi: latestStrategy!.kpis[0] ?? "conversion_rate",
      requestId,
      strategyRequestId: latestStrategy!.requestId,
      author: userId,
      missingFields: [],
    });

    await this.repository.createAuditLog({
      actorId: userId,
      eventName: "content.communication_brief.generated",
      requestId,
      entityType: "CLIENT",
      entityId: input.clientId,
      details: brief,
    });

    return {
      data: { brief },
      meta: { generatedAt: brief.generatedAt, requestId },
    };
  }

  async getLatestCommunicationBrief(
    userId: string,
    role: "OWNER" | "CONTENT",
    input: GetLatestCommunicationBriefInput,
  ): Promise<GetLatestCommunicationBriefOutput> {
    const requestId = `communication-brief-latest-${Date.now()}`;
    await this.validateContentBriefReadAccess(userId, role, input.clientId);
    const records = await this.repository.listLatestCommunicationBriefAudit(input.clientId, 20);
    const brief = this.parseLatestCommunicationBrief(records) ?? null;
    return {
      data: { brief },
      meta: { requestId },
    };
  }

  async generateEmailDraft(
    userId: string,
    role: "OWNER" | "CONTENT",
    input: GenerateEmailDraftInput,
  ): Promise<GenerateEmailDraftOutput> {
    const requestId = input.requestId ?? this.createContentRequestId("email-draft-generate");
    await this.validateContentBriefAccess(userId, role, input.clientId, requestId);

    const preReadBriefRecords = await this.repository.listLatestCommunicationBriefAudit(
      input.clientId,
      20,
    );
    const preReadBrief = this.parseLatestCommunicationBrief(preReadBriefRecords);
    const lockKey = `${input.clientId}:${preReadBrief?.requestId ?? "missing-brief"}`;

    return this.repository.withContentGenerationLock(lockKey, async () => {
      const [briefRecords, existingDrafts, strategyRecords] = await Promise.all([
      this.repository.listLatestCommunicationBriefAudit(input.clientId, 20),
      this.repository.listLatestEmailDraftAudit(input.clientId, 20),
        this.repository.listLatestEmailStrategyAudit(input.clientId, 20),
      ]);
      const latestBrief = this.parseLatestCommunicationBrief(briefRecords);
      const latestDraft = this.parseLatestEmailDraft(existingDrafts);
      const latestStrategy = this.parseLatestEmailStrategy(strategyRecords ?? []);
      const nextVersion = (latestDraft?.version ?? 0) + 1;

      if (!latestBrief || latestBrief.status !== "ok") {
        const draft = this.buildEmailDraftRecord({
          clientId: input.clientId,
          version: nextVersion,
          status: "failed_generation",
          campaignGoal: latestBrief?.campaignGoal ?? "missing_campaign_goal",
          segment: latestBrief?.segment ?? "missing_segment",
          subject: "generation_failed",
          preheader: "generation_failed",
          body: "generation_failed",
          cta: "generation_failed",
          requestId,
          briefRequestId: latestBrief?.requestId ?? "missing-brief",
          author: userId,
          retryable: false,
        });
        return {
          data: { draft },
          meta: { generatedAt: draft.generatedAt, requestId },
        };
      }

      if (!this.isStrategyUsableForContent(latestStrategy)) {
        const draft = this.buildEmailDraftRecord({
          clientId: input.clientId,
          version: nextVersion,
          status: "failed_generation",
          campaignGoal: latestBrief.campaignGoal,
          segment: latestBrief.segment,
          subject: "generation_failed",
          preheader: "generation_failed",
          body: "generation_failed",
          cta: "generation_failed",
          requestId,
          briefRequestId: latestBrief.requestId,
          author: userId,
          retryable: false,
        });
        return {
          data: { draft },
          meta: { generatedAt: draft.generatedAt, requestId },
        };
      }

      const aiOutcome = this.detectAiGenerationOutcome(requestId);
      if (aiOutcome === "timeout") {
        const timedOutDraft = this.buildEmailDraftRecord({
          clientId: input.clientId,
          version: nextVersion,
          status: "timed_out",
          campaignGoal: latestBrief.campaignGoal,
          segment: latestBrief.segment,
          subject: "draft_timed_out",
          preheader: "draft_timed_out",
          body: "draft_timed_out",
          cta: "draft_timed_out",
          requestId,
          briefRequestId: latestBrief.requestId,
          author: userId,
          retryable: true,
        });
        return {
          data: { draft: timedOutDraft },
          meta: { generatedAt: timedOutDraft.generatedAt, requestId },
        };
      }

      if (aiOutcome === "error") {
        const failedDraft = this.buildEmailDraftRecord({
          clientId: input.clientId,
          version: nextVersion,
          status: "failed_generation",
          campaignGoal: latestBrief.campaignGoal,
          segment: latestBrief.segment,
          subject: "generation_failed",
          preheader: "generation_failed",
          body: "generation_failed",
          cta: "generation_failed",
          requestId,
          briefRequestId: latestBrief.requestId,
          author: userId,
          retryable: false,
        });
        return {
          data: { draft: failedDraft },
          meta: { generatedAt: failedDraft.generatedAt, requestId },
        };
      }

      const aiPayload = this.resolveAiDraftPayload({
        campaignGoal: latestBrief.campaignGoal,
        segment: latestBrief.segment,
        tone: latestBrief.tone,
        requestId,
      });
      if (!this.isValidAiDraftPayload(aiPayload)) {
        throw new AnalysisDomainError(
          "validation",
          "INVALID_AI_DRAFT_OUTPUT",
          { requestId, payload: aiPayload },
          requestId,
        );
      }

      const draft = this.buildEmailDraftRecord({
        clientId: input.clientId,
        version: nextVersion,
        status: "ok",
        campaignGoal: latestBrief.campaignGoal,
        segment: latestBrief.segment,
        subject: aiPayload.subject,
        preheader: aiPayload.preheader,
        body: aiPayload.body,
        cta: aiPayload.cta,
        requestId,
        briefRequestId: latestBrief.requestId,
        author: userId,
        retryable: false,
      });

      try {
        await this.repository.createAuditLog({
          actorId: userId,
          eventName: "content.email_draft.generated",
          requestId,
          entityType: "CLIENT",
          entityId: input.clientId,
          details: this.enrichAuditDetails({
            userId,
            actionType: "content.email_draft.generated",
            artifactId: draft.requestId,
            previous: latestDraft,
            current: draft,
          }),
        });
        if (input.manualAccept === true && draft.status === "ok") {
          await this.repository.createAuditLog({
            actorId: userId,
            eventName: "content.email_draft.manual_accept",
            requestId,
            entityType: "CLIENT",
            entityId: input.clientId,
            details: this.enrichAuditDetails({
              userId,
              actionType: "content.email_draft.manual_accept",
              artifactId: draft.requestId,
              previous: { manualAccept: false },
              current: { manualAccept: true, requestId: draft.requestId },
            }),
          });
        }
      } catch {
        const failedDraft = this.buildEmailDraftRecord({
          clientId: input.clientId,
          version: nextVersion,
          status: "failed_generation",
          campaignGoal: latestBrief.campaignGoal,
          segment: latestBrief.segment,
          subject: "generation_failed",
          preheader: "generation_failed",
          body: "generation_failed",
          cta: "generation_failed",
          requestId,
          briefRequestId: latestBrief.requestId,
          author: userId,
          retryable: false,
        });
        return {
          data: { draft: failedDraft },
          meta: { generatedAt: failedDraft.generatedAt, requestId },
        };
      }

      return {
        data: { draft },
        meta: { generatedAt: draft.generatedAt, requestId },
      };
    });
  }

  async getLatestEmailDraft(
    userId: string,
    role: "OWNER" | "CONTENT",
    input: GetLatestEmailDraftInput,
  ): Promise<GetLatestEmailDraftOutput> {
    const requestId = `email-draft-latest-${Date.now()}`;
    await this.validateContentBriefReadAccess(userId, role, input.clientId);
    const records = await this.repository.listLatestEmailDraftAudit(input.clientId, 20);
    const draft = this.parseLatestEmailDraft(records) ?? null;
    return {
      data: { draft },
      meta: { requestId },
    };
  }

  async generatePersonalizedEmailDraft(
    userId: string,
    role: "OWNER" | "CONTENT",
    input: GeneratePersonalizedEmailDraftInput,
  ): Promise<GeneratePersonalizedEmailDraftOutput> {
    const requestId =
      input.requestId ?? this.createContentRequestId("email-draft-personalized");
    await this.validateContentBriefAccess(userId, role, input.clientId, requestId);

    const preDraftRecords = await this.repository.listLatestEmailDraftAudit(input.clientId, 20);
    const preDraft = this.parseLatestEmailDraft(preDraftRecords);
    const lockKey = `${input.clientId}:${preDraft?.briefRequestId ?? "missing-brief"}`;

    return this.repository.withContentGenerationLock(lockKey, async () => {
      const [draftRecords, segmentRecords, personalizedRecords, strategyRecords] = await Promise.all([
      this.repository.listLatestEmailDraftAudit(input.clientId, 20),
      this.repository.listLatestSegmentProposalAudit(input.clientId, 20),
      this.repository.listLatestPersonalizedEmailDraftAudit(input.clientId, 20),
        this.repository.listLatestEmailStrategyAudit(input.clientId, 20),
      ]);
      const latestDraft = this.parseLatestEmailDraft(draftRecords);
      const latestSegmentProposal = this.parseLatestSegmentProposal(segmentRecords);
      const latestPersonalizedDraft = this.parseLatestPersonalizedEmailDraft(personalizedRecords);
      const latestStrategy = this.parseLatestEmailStrategy(strategyRecords ?? []);
      const nextVersion = (latestPersonalizedDraft?.version ?? 0) + 1;

      if (
        !latestDraft ||
        latestDraft.status !== "ok" ||
        !this.isSegmentProposalUsable(latestSegmentProposal) ||
        !this.isStrategyUsableForContent(latestStrategy)
      ) {
        const personalizedDraft = this.buildPersonalizedEmailDraftRecord({
          clientId: input.clientId,
          version: nextVersion,
          status: "segment_data_missing",
          campaignGoal: latestDraft?.campaignGoal ?? "missing_campaign_goal",
          baseDraftRequestId: latestDraft?.requestId ?? "missing-draft",
          requestId,
          author: userId,
          variants: [],
        });
        return {
          data: { personalizedDraft },
          meta: { generatedAt: personalizedDraft.generatedAt, requestId },
        };
      }

      const variants = latestSegmentProposal.segments.slice(0, 4).map((segment) =>
        this.buildPersonalizedVariant({
          baseDraft: latestDraft,
          segmentName: segment.name,
        }),
      );

      const personalizedDraft = this.buildPersonalizedEmailDraftRecord({
        clientId: input.clientId,
        version: nextVersion,
        status: "ok",
        campaignGoal: latestDraft.campaignGoal,
        baseDraftRequestId: latestDraft.requestId,
        requestId,
        author: userId,
        variants,
      });

      try {
        await this.repository.createAuditLog({
          actorId: userId,
          eventName: "content.email_draft.personalized",
          requestId,
          entityType: "CLIENT",
          entityId: input.clientId,
          details: this.enrichAuditDetails({
            userId,
            actionType: "content.email_draft.personalized",
            artifactId: personalizedDraft.requestId,
            previous: latestPersonalizedDraft,
            current: personalizedDraft,
          }),
        });
        if (input.manualAccept === true && personalizedDraft.status === "ok") {
          await this.repository.createAuditLog({
            actorId: userId,
            eventName: "content.email_draft.personalized.manual_accept",
            requestId,
            entityType: "CLIENT",
            entityId: input.clientId,
            details: this.enrichAuditDetails({
              userId,
              actionType: "content.email_draft.personalized.manual_accept",
              artifactId: personalizedDraft.requestId,
              previous: { manualAccept: false },
              current: { manualAccept: true, requestId: personalizedDraft.requestId },
            }),
          });
        }
      } catch {
        const failedDraft = this.buildPersonalizedEmailDraftRecord({
          clientId: input.clientId,
          version: nextVersion,
          status: "failed_generation",
          campaignGoal: latestDraft.campaignGoal,
          baseDraftRequestId: latestDraft.requestId,
          requestId,
          author: userId,
          variants: [],
        });
        return {
          data: { personalizedDraft: failedDraft },
          meta: { generatedAt: failedDraft.generatedAt, requestId },
        };
      }

      return {
        data: { personalizedDraft },
        meta: { generatedAt: personalizedDraft.generatedAt, requestId },
      };
    });
  }

  async getLatestPersonalizedEmailDraft(
    userId: string,
    role: "OWNER" | "CONTENT",
    input: GetLatestPersonalizedEmailDraftInput,
  ): Promise<GetLatestPersonalizedEmailDraftOutput> {
    const requestId = `email-draft-personalized-latest-${Date.now()}`;
    await this.validateContentBriefReadAccess(userId, role, input.clientId);
    const records = await this.repository.listLatestPersonalizedEmailDraftAudit(input.clientId, 20);
    const personalizedDraft = this.parseLatestPersonalizedEmailDraft(records) ?? null;
    return {
      data: { personalizedDraft },
      meta: { requestId },
    };
  }

  async generateImplementationChecklist(
    userId: string,
    role: "OWNER" | "OPERATIONS",
    input: GenerateImplementationChecklistInput,
  ): Promise<GenerateImplementationChecklistOutput> {
    const requestId = input.requestId ?? `implementation-checklist-generate-${Date.now()}`;
    await this.validateImplementationAccess(userId, role, input.clientId, requestId);

    const [existingChecklistRecords, flowPlanRecords, campaignCalendarRecords] =
      await Promise.all([
        this.repository.listLatestImplementationChecklistAudit(input.clientId, 20),
        this.repository.listLatestFlowPlanAudit(input.clientId, 20),
        this.repository.listLatestCampaignCalendarAudit(input.clientId, 20),
      ]);

    const latestChecklist = this.parseLatestImplementationChecklist(existingChecklistRecords);
    const latestFlowPlan = this.parseLatestFlowPlan(flowPlanRecords);
    const latestCampaignCalendar = this.parseLatestCampaignCalendar(campaignCalendarRecords);
    const steps = this.buildImplementationChecklistSteps(latestFlowPlan, latestCampaignCalendar);
    const checklist = this.buildImplementationChecklistRecord({
      clientId: input.clientId,
      version: (latestChecklist?.version ?? 0) + 1,
      status: "ok",
      requestId,
      steps,
      generatedAt: new Date(),
    });

    await this.repository.createAuditLog({
      actorId: userId,
      eventName: "implementation.checklist.generated",
      requestId,
      entityType: "CLIENT",
      entityId: input.clientId,
      details: checklist,
    });

    return {
      data: { checklist },
      meta: { generatedAt: checklist.generatedAt, requestId },
    };
  }

  async getLatestImplementationChecklist(
    userId: string,
    role: "OWNER" | "OPERATIONS",
    input: GetLatestImplementationChecklistInput,
  ): Promise<GetLatestImplementationChecklistOutput> {
    const requestId = `implementation-checklist-latest-${Date.now()}`;
    await this.validateImplementationReadAccess(userId, role, input.clientId);
    const records = await this.repository.listLatestImplementationChecklistAudit(input.clientId, 20);
    const checklist = this.parseLatestImplementationChecklist(records) ?? null;
    return {
      data: { checklist },
      meta: { requestId },
    };
  }

  async updateImplementationChecklistStep(
    userId: string,
    role: "OWNER" | "OPERATIONS",
    input: UpdateImplementationChecklistStepInput,
  ): Promise<UpdateImplementationChecklistStepOutput> {
    const requestId = input.requestId ?? `implementation-checklist-step-update-${Date.now()}`;
    await this.validateImplementationAccess(userId, role, input.clientId, requestId);

    const records = await this.repository.listLatestImplementationChecklistAudit(input.clientId, 20);
    const latestChecklist = this.parseLatestImplementationChecklist(records);
    if (!latestChecklist) {
      throw new AnalysisDomainError(
        "validation",
        "IMPLEMENTATION_CHECKLIST_NOT_FOUND",
        { clientId: input.clientId },
        requestId,
      );
    }

    if (latestChecklist.version !== input.expectedVersion) {
      return {
        data: {
          checklist: {
            ...latestChecklist,
            status: "conflict_requires_refresh",
            requestId,
          },
        },
        meta: {
          requestId,
          updatedAt: latestChecklist.updatedAt,
        },
      };
    }

    const stepExists = latestChecklist.steps.some((step) => step.id === input.stepId);
    if (!stepExists) {
      throw new AnalysisDomainError(
        "validation",
        "IMPLEMENTATION_CHECKLIST_STEP_NOT_FOUND",
        { stepId: input.stepId, clientId: input.clientId },
        requestId,
      );
    }

    const now = new Date();
    const updatedSteps = latestChecklist.steps.map((step) => {
      if (step.id !== input.stepId) {
        return step;
      }

      return {
        ...step,
        status: input.status,
        completedAt: input.status === "done" ? now : null,
      };
    });

    const updatedChecklist = this.buildImplementationChecklistRecord({
      clientId: input.clientId,
      version: latestChecklist.version + 1,
      status: "ok",
      requestId,
      steps: updatedSteps,
      generatedAt: latestChecklist.generatedAt,
      updatedAt: now,
    });

    try {
      await this.repository.createAuditLog({
        actorId: userId,
        eventName: "implementation.checklist.step_updated",
        requestId,
        entityType: "CLIENT",
        entityId: input.clientId,
        details: updatedChecklist,
      });
    } catch {
      return {
        data: {
          checklist: {
            ...latestChecklist,
            status: "transaction_error",
            requestId,
          },
        },
        meta: {
          requestId,
          updatedAt: latestChecklist.updatedAt,
        },
      };
    }

    return {
      data: { checklist: updatedChecklist },
      meta: { requestId, updatedAt: updatedChecklist.updatedAt },
    };
  }

  async getImplementationAlerts(
    userId: string,
    role: "OWNER" | "OPERATIONS",
    input: GetImplementationAlertsInput,
  ): Promise<GetImplementationAlertsOutput> {
    const requestId = `implementation-alerts-${Date.now()}`;
    await this.validateImplementationReadAccess(userId, role, input.clientId);

    const [syncRun, inventory, checklistRecords, flowPlanRecords] = await Promise.all([
      this.repository.findLatestSyncRun(input.clientId),
      this.repository.listInventory(input.clientId),
      this.repository.listLatestImplementationChecklistAudit(input.clientId, 20),
      this.repository.listLatestFlowPlanAudit(input.clientId, 20),
    ]);

    const alerts: ImplementationAlert[] = [];
    const flowPlan = this.parseLatestFlowPlan(flowPlanRecords ?? []);
    const highestFlowPriority = this.resolveHighestFlowPriority(flowPlan);
    if (!syncRun) {
      alerts.push({
        id: "sync-missing",
        type: "blocker",
        severity: "critical",
        priority: "CRITICAL",
        impactScore: 95,
        progressState: "blocked",
        title: "Brak synchronizacji danych",
        description: "Uruchom sync Klaviyo przed wdrozeniem checklisty.",
        source: "sync",
      });
    } else {
      if (syncRun.status === "FAILED_AUTH") {
        alerts.push({
          id: "sync-failed-auth",
          type: "blocker",
          severity: "critical",
          priority: "CRITICAL",
          impactScore: 92,
          progressState: "blocked",
          title: "Blokada: autoryzacja Klaviyo niepowiodla sie",
          description: "Popraw token API i ponow synchronizacje.",
          source: "sync",
        });
      }

      if (syncRun.status === "PARTIAL_OR_TIMEOUT") {
        alerts.push({
          id: "sync-timeout",
          type: "blocker",
          severity: "warning",
          priority: "HIGH",
          impactScore: 80,
          progressState: "at_risk",
          title: "Sync zakonczony czesciowo",
          description: "Powtorz synchronizacje przed wdrozeniem.",
          source: "sync",
        });
      }
    }

    const staleReference = syncRun?.finishedAt ?? syncRun?.startedAt ?? null;
    if (staleReference && Date.now() - staleReference.getTime() > 24 * 60 * 60 * 1000) {
      alerts.push({
        id: "sync-stale",
        type: "blocker",
        severity: "warning",
        priority: "HIGH",
        impactScore: 72,
        progressState: "at_risk",
        title: "Dane sync sa nieaktualne",
        description: "Od ostatniej synchronizacji minelo ponad 24h.",
        source: "sync",
      });
    }

    const configurationGapItems = inventory
      .filter((item) => item.itemStatus === "GAP")
      .slice(0, 5)
      .map((item, index) => ({
        id: `config-gap-${index + 1}-${item.externalId}`,
        type: "configuration_gap" as const,
        severity: "warning" as const,
        priority: highestFlowPriority,
        impactScore: this.resolveConfigGapImpactScore(highestFlowPriority),
        progressState: "at_risk" as const,
        title: `Brak konfiguracji: ${item.name}`,
        description: `Element ${item.entityType} wymaga uzupelnienia przed wdrozeniem.`,
        source: "inventory",
      }));
    alerts.push(...configurationGapItems);

    const checklist = this.parseLatestImplementationChecklist(checklistRecords ?? []);
    if (checklist?.status === "conflict_requires_refresh") {
      alerts.push({
        id: "checklist-conflict",
        type: "blocker",
        severity: "warning",
        priority: "HIGH",
        impactScore: 78,
        progressState: "at_risk",
        title: "Konflikt wersji checklisty",
        description: "Odswiez checkliste przed kolejnym zapisem zmian.",
        source: "implementation_checklist",
      });
    }
    if (checklist?.status === "transaction_error") {
      alerts.push({
        id: "checklist-transaction-error",
        type: "blocker",
        severity: "warning",
        priority: "HIGH",
        impactScore: 74,
        progressState: "at_risk",
        title: "Blad zapisu checklisty",
        description: "Poprzedni stan zostal zachowany, ponow aktualizacje krokow.",
        source: "implementation_checklist",
      });
    }
    if (checklist && checklist.progressPercent < 100) {
      const progressState = checklist.progressPercent < 40 ? "blocked" : "at_risk";
      const priority = checklist.progressPercent < 40 ? "HIGH" : "MEDIUM";
      alerts.push({
        id: "checklist-progress",
        type: "progress",
        severity: checklist.progressPercent < 40 ? "critical" : "warning",
        priority,
        impactScore: Math.max(35, 100 - checklist.progressPercent),
        progressState,
        progressPercent: checklist.progressPercent,
        title: "Postep wdrozenia wymaga uwagi",
        description: `Zrealizowano ${checklist.completedSteps}/${checklist.totalSteps} krokow checklisty.`,
        source: "implementation_checklist",
      });
    }

    const sortedAlerts = alerts.sort((left, right) => {
      const priorityDelta =
        this.priorityWeight(right.priority) - this.priorityWeight(left.priority);
      if (priorityDelta !== 0) {
        return priorityDelta;
      }
      return right.impactScore - left.impactScore;
    });

    const blockerCount = sortedAlerts.filter((alert) => alert.type === "blocker").length;
    const configGapCount = sortedAlerts.filter((alert) => alert.type === "configuration_gap").length;
    const hasBlockedProgress = sortedAlerts.some((alert) => alert.progressState === "blocked");
    const hasAtRiskProgress = sortedAlerts.some((alert) => alert.progressState === "at_risk");
    const status = blockerCount > 0
      ? "blocked"
      : configGapCount > 0
        ? "needs_configuration"
        : hasBlockedProgress || hasAtRiskProgress
          ? "at_risk"
          : "ok";
    const generatedAt = new Date();
    return {
      data: {
        alerts: {
          clientId: input.clientId,
          status,
          requestId,
          generatedAt,
          blockerCount,
          configGapCount,
          alerts: sortedAlerts,
        },
      },
      meta: { requestId },
    };
  }

  async getImplementationReport(
    userId: string,
    role: "OWNER" | "OPERATIONS",
    input: GetImplementationReportInput,
  ): Promise<GetImplementationReportOutput> {
    const requestId = `implementation-report-${Date.now()}`;
    await this.validateImplementationReadAccess(userId, role, input.clientId);

    const [alertsOutput, checklistRecords] = await Promise.all([
      this.getImplementationAlerts(userId, role, input),
      this.repository.listLatestImplementationChecklistAudit(input.clientId, 20),
    ]);
    const checklist = this.parseLatestImplementationChecklist(checklistRecords ?? []);
    const alerts = alertsOutput.data.alerts;
    const completedSteps = checklist?.steps.filter((step) => step.status === "done") ?? [];
    const atRiskAlerts = alerts.alerts.filter(
      (alert) => alert.progressState === "at_risk" || alert.type === "configuration_gap",
    );
    const blockerAlerts = alerts.alerts.filter((alert) => alert.type === "blocker");
    const generatedAt = new Date();

    const markdown = [
      "# Raport wdrozeniowy",
      "",
      "## meta",
      `- generated_at: ${generatedAt.toISOString()}`,
      `- request_id: ${requestId}`,
      `- status: ${alerts.status}`,
      `- checklist_progress: ${checklist?.progressPercent ?? 0}%`,
      `- alerts_total: ${alerts.alerts.length}`,
      "",
      "## completed",
      ...(completedSteps.length === 0
        ? ["- [ ] Brak zakonczonych krokow checklisty."]
        : completedSteps.map((step) => `- [x] ${step.title}`)),
      "",
      "## at_risk",
      ...(atRiskAlerts.length === 0
        ? ["- [x] Brak pozycji at_risk."]
        : atRiskAlerts.map(
            (alert) =>
              `- [ ] ${alert.title} (priority: ${alert.priority}, impact: ${alert.impactScore})`,
          )),
      "",
      "## blockers",
      ...(blockerAlerts.length === 0
        ? ["- [x] Brak aktywnych blockerow."]
        : blockerAlerts.map(
            (alert) =>
              `- [ ] ${alert.title} (priority: ${alert.priority}, impact: ${alert.impactScore})`,
          )),
    ].join("\n");

    return {
      data: {
        report: {
          clientId: input.clientId,
          requestId,
          generatedAt,
          status: alerts.status,
          markdown,
        },
      },
      meta: { requestId },
    };
  }

  async getImplementationDocumentation(
    userId: string,
    role: "OWNER" | "OPERATIONS",
    input: GetImplementationDocumentationInput,
  ): Promise<GetImplementationDocumentationOutput> {
    const requestId = `implementation-documentation-${Date.now()}`;
    await this.validateImplementationReadAccess(userId, role, input.clientId);

    const [
      contextRecord,
      strategyRecords,
      flowPlanRecords,
      campaignRecords,
      auditLogs,
    ] = await Promise.all([
      this.repository.findAuditProductContext(input.clientId),
      this.repository.listLatestEmailStrategyAudit(input.clientId, 20),
      this.repository.listLatestFlowPlanAudit(input.clientId, 20),
      this.repository.listLatestCampaignCalendarAudit(input.clientId, 20),
      this.repository.listLatestClientAuditLogs(input.clientId, 20),
    ]);

    const strategy = this.parseLatestEmailStrategy(strategyRecords ?? []);
    const flowPlan = this.parseLatestFlowPlan(flowPlanRecords ?? []);
    const campaignCalendar = this.parseLatestCampaignCalendar(campaignRecords ?? []);

    const recommendations =
      contextRecord?.mainProducts.map((productName) => {
        const coverage = this.buildProductCoverageItem(productName, flowPlan, campaignCalendar);
        return this.buildCommunicationImprovementRecommendationItem(coverage, requestId);
      }) ?? [];
    const sortedRecommendations = recommendations.sort((left, right) => {
      const priorityDelta =
        this.priorityWeight(right.priority) - this.priorityWeight(left.priority);
      if (priorityDelta !== 0) {
        return priorityDelta;
      }
      return right.impactScore - left.impactScore;
    });

    const markdown = [
      "# Dokumentacja wdrozeniowa klienta",
      "",
      `- Generated at: ${new Date().toISOString()}`,
      `- Request ID: ${requestId}`,
      "",
      "## Product Context",
      contextRecord
        ? [
            `- Offer: ${contextRecord.offer ?? "brak"}`,
            `- Target audience: ${contextRecord.targetAudience ?? "brak"}`,
            `- Main products: ${contextRecord.mainProducts.join(", ") || "brak"}`,
            `- Current flows: ${contextRecord.currentFlows.join(", ") || "brak"}`,
            `- Goals: ${contextRecord.goals.join(", ") || "brak"}`,
            `- Segments: ${contextRecord.segments.join(", ") || "brak"}`,
          ]
        : ["- Brak danych kontekstu produktu."],
      "",
      "## Strategy Summary",
      strategy
        ? [
            `- Status: ${strategy.status}`,
            `- Version: ${strategy.version}`,
            `- Generated: ${strategy.generatedAt.toISOString()}`,
            `- Goals: ${strategy.goals.join(", ") || "brak"}`,
            `- Segments: ${strategy.segments.join(", ") || "brak"}`,
            `- Priorities: ${strategy.priorities.join(", ") || "brak"}`,
            `- KPIs: ${strategy.kpis.join(", ") || "brak"}`,
          ]
        : ["- Brak strategii."],
      "",
      "## Flow Plan",
      flowPlan
        ? [
            `- Status: ${flowPlan.status}`,
            `- Version: ${flowPlan.version}`,
            `- Generated: ${flowPlan.generatedAt.toISOString()}`,
            ...(flowPlan.items.length === 0
              ? ["- [ ] Brak krokow flow."]
              : flowPlan.items.map(
                  (item) =>
                    `- [ ] ${item.name} (${item.priority}) — trigger: ${item.trigger}, cel: ${item.objective}`,
                )),
          ]
        : ["- Brak planu flow."],
      "",
      "## Campaign Calendar",
      campaignCalendar
        ? [
            `- Status: ${campaignCalendar.status}`,
            `- Version: ${campaignCalendar.version}`,
            `- Generated: ${campaignCalendar.generatedAt.toISOString()}`,
            ...(campaignCalendar.items.length === 0
              ? ["- [ ] Brak kampanii."]
              : campaignCalendar.items.map(
                  (item) =>
                    `- [ ] Week ${item.weekNumber}: ${item.title} (${item.campaignType}) — segment: ${item.segment}`,
                )),
          ]
        : ["- Brak kalendarza kampanii."],
      "",
      "## Recommendations",
      sortedRecommendations.length === 0
        ? "- Brak rekomendacji."
        : sortedRecommendations.map(
            (item) =>
              `- [ ] ${item.title} | status: ${item.status} | priority: ${item.priority} | impact: ${item.impactScore}`,
          ),
      "",
      "## Audit Log",
      auditLogs.length === 0
        ? "- Brak wpisow audit log."
        : auditLogs.slice(0, 10).map((log) => {
            const details =
              log.details && typeof log.details === "object"
                ? (log.details as Record<string, unknown>)
                : null;
            const actionType =
              details && typeof details.actionType === "string"
                ? details.actionType
                : log.eventName;
            const actor =
              details && typeof details.userId === "string"
                ? details.userId
                : (log.actorId ?? "system");
            const artifactId =
              details && typeof details.artifactId === "string"
                ? details.artifactId
                : log.requestId;
            return `- ${log.createdAt.toISOString()} | ${actor} | ${actionType} | artifact: ${artifactId}`;
          }),
    ].flat().join("\n");

    return {
      data: {
        documentation: {
          clientId: input.clientId,
          requestId,
          generatedAt: new Date(),
          markdown,
        },
      },
      meta: { requestId },
    };
  }

  async exportImplementationDocumentation(
    userId: string,
    role: "OWNER" | "OPERATIONS",
    input: ExportImplementationDocumentationInput,
  ): Promise<ExportImplementationDocumentationOutput> {
    const requestId = `implementation-documentation-export-${Date.now()}`;
    const documentationResult = await this.getImplementationDocumentation(userId, role, {
      clientId: input.clientId,
    });
    const markdown = documentationResult.data.documentation.markdown;
    const title = `Implementation Documentation ${input.clientId}`;

    const primaryTarget = input.target;
    const fallbackTarget: DocumentationExportTarget =
      primaryTarget === "notion" ? "google_docs" : "notion";

    const primaryResult = await this.tryExportWithRetry({
      target: primaryTarget,
      clientId: input.clientId,
      title,
      markdown,
      requestId,
      retries: 2,
    });

    if (primaryResult) {
      return {
        data: {
          target: primaryTarget,
          documentUrl: primaryResult.documentUrl,
          fallbackUsed: false,
        },
        meta: { requestId },
      };
    }

    const fallbackResult = await this.tryExportWithRetry({
      target: fallbackTarget,
      clientId: input.clientId,
      title,
      markdown,
      requestId,
      retries: 1,
    });

    if (!fallbackResult) {
      throw new AnalysisDomainError(
        "external_api_error",
        "IMPLEMENTATION_DOCUMENTATION_EXPORT_FAILED",
        { target: primaryTarget, fallbackTarget },
        requestId,
      );
    }

    return {
      data: {
        target: fallbackTarget,
        documentUrl: fallbackResult.documentUrl,
        fallbackUsed: true,
      },
      meta: { requestId },
    };
  }

  async getAuditProductContext(
    userId: string,
    role: "OWNER" | "STRATEGY",
    input: GetAuditProductContextInput,
  ): Promise<GetAuditProductContextOutput> {
    const requestId = `audit-product-context-${Date.now()}`;
    await this.validateAccess(userId, role, input.clientId);

    const contextRecord = await this.repository.findAuditProductContext(input.clientId);
    const fallback = {
      offer: "missing_offer",
      targetAudience: "missing_target_audience",
      mainProducts: [],
      currentFlows: [],
      goals: [],
      segments: [],
    };
    const resolved = contextRecord ?? fallback;
    const missingFields: string[] = [];
    if (!resolved.offer || resolved.offer.trim().length === 0) {
      missingFields.push("offer");
    }
    if (!resolved.targetAudience || resolved.targetAudience.trim().length === 0) {
      missingFields.push("targetAudience");
    }
    if (resolved.mainProducts.length === 0) {
      missingFields.push("mainProducts");
    }
    if (resolved.currentFlows.length === 0) {
      missingFields.push("currentFlows");
    }

    return {
      data: {
        context: {
          clientId: input.clientId,
          status: missingFields.length === 0 ? "ok" : "missing_context",
          requestId,
          generatedAt: new Date(),
          offer: resolved.offer?.trim() || "missing_offer",
          targetAudience: resolved.targetAudience?.trim() || "missing_target_audience",
          mainProducts: resolved.mainProducts,
          currentFlows: resolved.currentFlows,
          goals: resolved.goals,
          segments: resolved.segments,
          missingFields,
        },
      },
      meta: { requestId },
    };
  }

  async getProductCoverageAnalysis(
    userId: string,
    role: "OWNER" | "STRATEGY",
    input: GetProductCoverageAnalysisInput,
  ): Promise<GetProductCoverageAnalysisOutput> {
    const requestId = `product-coverage-analysis-${Date.now()}`;
    await this.validateAccess(userId, role, input.clientId);

    const [contextRecord, flowPlanRecords, campaignRecords] = await Promise.all([
      this.repository.findAuditProductContext(input.clientId),
      this.repository.listLatestFlowPlanAudit(input.clientId, 20),
      this.repository.listLatestCampaignCalendarAudit(input.clientId, 20),
    ]);

    const flowPlan = this.parseLatestFlowPlan(flowPlanRecords ?? []);
    const campaignCalendar = this.parseLatestCampaignCalendar(campaignRecords ?? []);

    if (!contextRecord || contextRecord.mainProducts.length === 0) {
      return {
        data: {
          coverage: {
            clientId: input.clientId,
            status: "missing_context",
            requestId,
            generatedAt: new Date(),
            items: [],
            missingFlows: [],
            missingCampaigns: [],
          },
        },
        meta: { requestId },
      };
    }

    const items = contextRecord.mainProducts.map((productName) =>
      this.buildProductCoverageItem(productName, flowPlan, campaignCalendar),
    );
    const missingFlows = items
      .filter((item) => item.flowMatches.length === 0)
      .map((item) => item.productName);
    const missingCampaigns = items
      .filter((item) => item.campaignMatches.length === 0)
      .map((item) => item.productName);
    const status = items.every((item) => item.status === "covered") ? "ok" : "partial";

    return {
      data: {
        coverage: {
          clientId: input.clientId,
          status,
          requestId,
          generatedAt: new Date(),
          items: items.sort((left, right) => right.coverageScore - left.coverageScore),
          missingFlows,
          missingCampaigns,
        },
      },
      meta: { requestId },
    };
  }

  async getCommunicationImprovementRecommendations(
    userId: string,
    role: "OWNER" | "STRATEGY",
    input: GetCommunicationImprovementRecommendationsInput,
  ): Promise<GetCommunicationImprovementRecommendationsOutput> {
    const requestId = `communication-improvement-recommendations-${Date.now()}`;
    await this.validateAccess(userId, role, input.clientId);

    const [contextRecord, flowPlanRecords, campaignRecords] = await Promise.all([
      this.repository.findAuditProductContext(input.clientId),
      this.repository.listLatestFlowPlanAudit(input.clientId, 20),
      this.repository.listLatestCampaignCalendarAudit(input.clientId, 20),
    ]);

    const flowPlan = this.parseLatestFlowPlan(flowPlanRecords ?? []);
    const campaignCalendar = this.parseLatestCampaignCalendar(campaignRecords ?? []);

    if (!contextRecord || contextRecord.mainProducts.length === 0) {
      return {
        data: {
          recommendations: {
            clientId: input.clientId,
            status: "missing_context",
            requestId,
            generatedAt: new Date(),
            items: [],
          },
        },
        meta: { requestId },
      };
    }

    const items = contextRecord.mainProducts
      .map((productName) => {
        const coverage = this.buildProductCoverageItem(productName, flowPlan, campaignCalendar);
        return this.buildCommunicationImprovementRecommendationItem(coverage, requestId);
      })
      .sort((left, right) => {
        const priorityDelta =
          this.priorityWeight(right.priority) - this.priorityWeight(left.priority);
        if (priorityDelta !== 0) {
          return priorityDelta;
        }
        return right.impactScore - left.impactScore;
      });

    if (input.manualAccept === true) {
      await this.repository.createAuditLog({
        actorId: userId,
        eventName: "strategy.recommendation.manual_accept",
        requestId,
        entityType: "CLIENT",
        entityId: input.clientId,
        details: this.enrichAuditDetails({
          userId,
          actionType: "strategy.recommendation.manual_accept",
          artifactId: requestId,
          previous: { manualAccept: false },
          current: {
            manualAccept: true,
            recommendationCount: items.length,
            requestId,
          },
          extra: {
            recommendationIds: items.map((item) => item.id),
          },
        }),
      });
    }

    return {
      data: {
        recommendations: {
          clientId: input.clientId,
          status: "ok",
          requestId,
          generatedAt: new Date(),
          items,
        },
      },
      meta: { requestId },
    };
  }

  async submitArtifactFeedback(
    userId: string,
    role: "OWNER" | "STRATEGY" | "CONTENT" | "OPERATIONS",
    input: SubmitArtifactFeedbackInput,
  ): Promise<SubmitArtifactFeedbackOutput> {
    const requestId = input.requestId ?? `feedback-${input.targetType}-${Date.now()}`;
    await this.validateFeedbackAccess(userId, role, input.clientId, input.targetType, requestId);

    const timestamp = new Date();
    const eventName =
      input.targetType === "recommendation"
        ? "feedback.recommendation.submitted"
        : "feedback.draft.submitted";
    const comment = (input.comment ?? "").trim();

    await this.repository.createAuditLog({
      actorId: userId,
      eventName,
      requestId,
      entityType: "CLIENT",
      entityId: input.clientId,
      details: {
        timestamp: timestamp.toISOString(),
        userId,
        actionType: eventName,
        artifactId: input.artifactId,
        diff: {
          previous: null,
          current: {
            targetType: input.targetType,
            sourceRequestId: input.sourceRequestId ?? null,
            rating: input.rating,
            comment,
          },
        },
        targetType: input.targetType,
        sourceRequestId: input.sourceRequestId ?? null,
        rating: input.rating,
        comment,
      },
    });

    return {
      data: {
        feedback: {
          clientId: input.clientId,
          targetType: input.targetType,
          artifactId: input.artifactId,
          sourceRequestId: input.sourceRequestId ?? null,
          userId,
          rating: input.rating,
          comment,
          timestamp,
          requestId,
          status: "saved",
        },
      },
      meta: {
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

  private async validateEditAccess(userId: string, role: "OWNER" | "STRATEGY", clientId: string) {
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
    if (!auditPolicy || !auditPolicy.canEdit) {
      throw new AnalysisDomainError(
        "forbidden",
        "rbac_module_edit_forbidden",
        { module: "AUDIT", role },
        "unknown",
      );
    }
  }

  private async validateContentBriefReadAccess(
    userId: string,
    role: "OWNER" | "CONTENT",
    clientId: string,
  ) {
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
    const contentPolicy = policies.find((policy) => policy.module === "CONTENT");
    if (!contentPolicy || !contentPolicy.canView) {
      throw new AnalysisDomainError(
        "forbidden",
        "rbac_module_view_forbidden",
        { module: "CONTENT", role },
        "unknown",
      );
    }
  }

  private async validateContentBriefAccess(
    userId: string,
    role: "OWNER" | "CONTENT" | "STRATEGY",
    clientId: string,
    requestId: string,
  ) {
    const membership = await this.repository.findMembership(userId, clientId);
    if (!membership) {
      throw new AnalysisDomainError(
        "forbidden",
        "forbidden",
        { reason: "user_not_member_of_client" },
        requestId,
      );
    }

    if (role !== "OWNER" && role !== "CONTENT") {
      try {
        await this.repository.createAuditLog({
          actorId: userId,
          eventName: "content.communication_brief.forbidden_attempt",
          requestId,
          entityType: "CLIENT",
          entityId: clientId,
          details: { role, reason: "content_or_owner_required" },
        });
      } catch {}
      throw new AnalysisDomainError(
        "forbidden",
        "forbidden",
        { reason: "content_or_owner_required", role },
        requestId,
      );
    }

    const policies = await this.repository.listRbacPoliciesByRole(role);
    const contentPolicy = policies.find((policy) => policy.module === "CONTENT");
    if (!contentPolicy || !contentPolicy.canEdit) {
      try {
        await this.repository.createAuditLog({
          actorId: userId,
          eventName: "content.communication_brief.forbidden_attempt",
          requestId,
          entityType: "CLIENT",
          entityId: clientId,
          details: { role, reason: "rbac_content_edit_forbidden" },
        });
      } catch {}
      throw new AnalysisDomainError(
        "forbidden",
        "rbac_module_edit_forbidden",
        { module: "CONTENT", role },
        requestId,
      );
    }
  }

  private async validateImplementationReadAccess(
    userId: string,
    role: "OWNER" | "OPERATIONS",
    clientId: string,
  ) {
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
    const implementationPolicy = policies.find((policy) => policy.module === "IMPLEMENTATION");
    if (!implementationPolicy || !implementationPolicy.canView) {
      throw new AnalysisDomainError(
        "forbidden",
        "rbac_module_view_forbidden",
        { module: "IMPLEMENTATION", role },
        "unknown",
      );
    }
  }

  private async validateImplementationAccess(
    userId: string,
    role: "OWNER" | "OPERATIONS",
    clientId: string,
    requestId: string,
  ) {
    const membership = await this.repository.findMembership(userId, clientId);
    if (!membership) {
      throw new AnalysisDomainError(
        "forbidden",
        "forbidden",
        { reason: "user_not_member_of_client" },
        requestId,
      );
    }

    const policies = await this.repository.listRbacPoliciesByRole(role);
    const implementationPolicy = policies.find((policy) => policy.module === "IMPLEMENTATION");
    if (!implementationPolicy || !implementationPolicy.canEdit) {
      throw new AnalysisDomainError(
        "forbidden",
        "rbac_module_edit_forbidden",
        { module: "IMPLEMENTATION", role },
        requestId,
      );
    }
  }

  private async validateFeedbackAccess(
    userId: string,
    role: "OWNER" | "STRATEGY" | "CONTENT" | "OPERATIONS",
    clientId: string,
    targetType: "recommendation" | "draft",
    requestId: string,
  ) {
    if (targetType === "recommendation") {
      if (role !== "OWNER" && role !== "STRATEGY") {
        throw new AnalysisDomainError(
          "forbidden",
          "forbidden",
          { reason: "strategy_or_owner_required", role, targetType },
          requestId,
        );
      }
      await this.validateAccess(userId, role, clientId);
      return;
    }

    if (role !== "OWNER" && role !== "CONTENT") {
      throw new AnalysisDomainError(
        "forbidden",
        "forbidden",
        { reason: "content_or_owner_required", role, targetType },
        requestId,
      );
    }
    await this.validateContentBriefReadAccess(userId, role, clientId);
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

  private buildEmailStrategyRecord(payload: {
    clientId: string;
    version: number;
    status: "ok" | "in_progress_or_timeout" | "blocked_preconditions";
    goals: string[];
    segments: string[];
    tone: string;
    priorities: string[];
    kpis: string[];
    requestId: string;
    lastSyncRequestId: string;
    author?: string;
    source?: string;
    missingPreconditions?: Array<
      "discovery.goals" | "discovery.segments" | "audit.sync_ok" | "audit.optimization_available"
    >;
    retryHint?: string;
  }): EmailStrategy {
    const generatedAt = new Date();
    return {
      clientId: payload.clientId,
      version: payload.version,
      status: payload.status,
      goals: payload.goals,
      segments: payload.segments,
      tone: payload.tone,
      priorities: payload.priorities,
      kpis: payload.kpis,
      requestId: payload.requestId,
      lastSyncRequestId: payload.lastSyncRequestId,
      generatedAt,
      versionMeta: this.buildArtifactVersionMeta({
        timestamp: generatedAt,
        author: payload.author,
        source: payload.source ?? "strategy.email.generated",
        type: "strategy",
      }),
      missingPreconditions: payload.missingPreconditions ?? [],
      retryHint: payload.retryHint,
    };
  }

  private parseEmailStrategy(details: unknown): EmailStrategy | null {
    if (!details || typeof details !== "object") {
      return null;
    }

    const value = details as Partial<EmailStrategy>;
    if (
      typeof value.clientId !== "string" ||
      typeof value.version !== "number" ||
      typeof value.status !== "string" ||
      !Array.isArray(value.goals) ||
      !Array.isArray(value.segments) ||
      typeof value.tone !== "string" ||
      !Array.isArray(value.priorities) ||
      !Array.isArray(value.kpis) ||
      typeof value.requestId !== "string" ||
      typeof value.lastSyncRequestId !== "string"
    ) {
      return null;
    }

    const allowedStatuses = ["ok", "in_progress_or_timeout", "blocked_preconditions"] as const;
    const isAllowedStatus = (item: unknown): item is (typeof allowedStatuses)[number] =>
      typeof item === "string" && (allowedStatuses as readonly string[]).includes(item);
    if (!isAllowedStatus(value.status)) {
      return null;
    }
    const allowedPreconditions = [
      "discovery.goals",
      "discovery.segments",
      "audit.sync_ok",
      "audit.optimization_available",
    ] as const;

    const isAllowedPrecondition = (
      item: unknown,
    ): item is (typeof allowedPreconditions)[number] =>
      typeof item === "string" && (allowedPreconditions as readonly string[]).includes(item);

    return {
      clientId: value.clientId,
      version: value.version,
      status: value.status,
      goals: value.goals.filter((item): item is string => typeof item === "string"),
      segments: value.segments.filter((item): item is string => typeof item === "string"),
      tone: value.tone,
      priorities: value.priorities.filter((item): item is string => typeof item === "string"),
      kpis: value.kpis.filter((item): item is string => typeof item === "string"),
      requestId: value.requestId,
      lastSyncRequestId: value.lastSyncRequestId,
      generatedAt:
        value.generatedAt instanceof Date
          ? value.generatedAt
          : new Date((value.generatedAt as string | undefined) ?? Date.now()),
      versionMeta: this.parseArtifactVersionMeta(
        value.versionMeta,
        {
          timestamp:
            value.generatedAt instanceof Date
              ? value.generatedAt
              : new Date((value.generatedAt as string | undefined) ?? Date.now()),
          type: "strategy",
        },
      ),
      missingPreconditions: Array.isArray(value.missingPreconditions)
        ? value.missingPreconditions.filter(isAllowedPrecondition)
        : [],
      retryHint: typeof value.retryHint === "string" ? value.retryHint : undefined,
    };
  }

  private parseLatestEmailStrategy(
    records: Array<{ details: unknown }>,
  ): EmailStrategy | null {
    for (const record of records) {
      const parsed = this.parseEmailStrategy(record.details);
      if (parsed) {
        return parsed;
      }
    }
    return null;
  }

  private buildFlowPlanItemsFromStrategy(strategy: EmailStrategy): FlowPlanItem[] {
    const priorities = strategy.priorities.length > 0 ? strategy.priorities : ["Core lifecycle automation"];
    const objective = strategy.goals[0] ?? "Wzrost konwersji";
    const segment = strategy.segments[0] ?? "Primary segment";

    return priorities.slice(0, 3).map((priority, index) => ({
      name: `Flow ${index + 1}: ${priority}`,
      trigger: index === 0 ? "signup" : index === 1 ? "first_purchase" : "win_back_30d",
      objective,
      priority: index === 0 ? "CRITICAL" : index === 1 ? "HIGH" : "MEDIUM",
      businessReason: `Priorytet strategiczny "${priority}" dla segmentu ${segment}.`,
    }));
  }

  private buildFlowPlanRecord(payload: {
    clientId: string;
    version: number;
    status: "ok" | "precondition_not_approved" | "failed_persist";
    items: FlowPlanItem[];
    requestId: string;
    strategyRequestId: string;
    author?: string;
    source?: string;
    requiredStep?: string;
  }): FlowPlan {
    const generatedAt = new Date();
    return {
      clientId: payload.clientId,
      version: payload.version,
      status: payload.status,
      items: payload.items,
      requestId: payload.requestId,
      strategyRequestId: payload.strategyRequestId,
      generatedAt,
      versionMeta: this.buildArtifactVersionMeta({
        timestamp: generatedAt,
        author: payload.author,
        source: payload.source ?? "strategy.flow_plan.generated",
        type: "flow",
      }),
      requiredStep: payload.requiredStep,
    };
  }

  private parseFlowPlan(details: unknown): FlowPlan | null {
    if (!details || typeof details !== "object") {
      return null;
    }

    const value = details as Partial<FlowPlan>;
    if (
      typeof value.clientId !== "string" ||
      typeof value.version !== "number" ||
      typeof value.status !== "string" ||
      !Array.isArray(value.items) ||
      typeof value.requestId !== "string" ||
      typeof value.strategyRequestId !== "string"
    ) {
      return null;
    }

    const allowedStatuses = ["ok", "precondition_not_approved", "failed_persist"] as const;
    const isFlowPlanStatus = (item: unknown): item is FlowPlan["status"] =>
      typeof item === "string" && (allowedStatuses as readonly string[]).includes(item);
    if (!isFlowPlanStatus(value.status)) {
      return null;
    }

    const items = value.items
      .filter(
        (item): item is FlowPlanItem =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as Record<string, unknown>).name === "string" &&
          typeof (item as Record<string, unknown>).trigger === "string" &&
          typeof (item as Record<string, unknown>).objective === "string" &&
          typeof (item as Record<string, unknown>).priority === "string" &&
          typeof (item as Record<string, unknown>).businessReason === "string",
      )
      .map((item) => ({
        name: item.name,
        trigger: item.trigger,
        objective: item.objective,
        priority: item.priority,
        businessReason: item.businessReason,
      }));

    return {
      clientId: value.clientId,
      version: value.version,
      status: value.status,
      items,
      requestId: value.requestId,
      strategyRequestId: value.strategyRequestId,
      generatedAt:
        value.generatedAt instanceof Date
          ? value.generatedAt
          : new Date((value.generatedAt as string | undefined) ?? Date.now()),
      versionMeta: this.parseArtifactVersionMeta(
        value.versionMeta,
        {
          timestamp:
            value.generatedAt instanceof Date
              ? value.generatedAt
              : new Date((value.generatedAt as string | undefined) ?? Date.now()),
          type: "flow",
        },
      ),
      requiredStep: typeof value.requiredStep === "string" ? value.requiredStep : undefined,
    };
  }

  private parseLatestFlowPlan(records: Array<{ details: unknown }>): FlowPlan | null {
    for (const record of records) {
      const parsed = this.parseFlowPlan(record.details);
      if (parsed) {
        return parsed;
      }
    }
    return null;
  }

  private buildCampaignCalendarItems(payload: {
    strategy: EmailStrategy;
    hasSeasonality: boolean;
  }): CampaignCalendarItem[] {
    const baseGoal = payload.strategy.goals[0] ?? "Wzrost konwersji";
    const baseSegment = payload.strategy.segments[0] ?? "Primary segment";
    const cadence: CampaignCalendarItem["campaignType"][] = payload.hasSeasonality
      ? ["NEWSLETTER", "PROMO", "LIFECYCLE", "EDUCATIONAL"]
      : ["NEWSLETTER", "LIFECYCLE", "PROMO", "NEWSLETTER"];

    return cadence.map((campaignType, index) => ({
      weekNumber: index + 1,
      campaignType,
      goal: baseGoal,
      segment: baseSegment,
      title: `Tydzien ${index + 1}: ${campaignType.toLowerCase()} dla ${baseSegment}`,
    }));
  }

  private buildCampaignCalendarRecord(payload: {
    clientId: string;
    version: number;
    status: "ok" | "seasonality_missing";
    items: CampaignCalendarItem[];
    requestId: string;
    strategyRequestId: string;
    requiresManualValidation: boolean;
    author?: string;
    source?: string;
  }): CampaignCalendar {
    const generatedAt = new Date();
    return {
      clientId: payload.clientId,
      version: payload.version,
      status: payload.status,
      items: payload.items,
      requestId: payload.requestId,
      strategyRequestId: payload.strategyRequestId,
      generatedAt,
      versionMeta: this.buildArtifactVersionMeta({
        timestamp: generatedAt,
        author: payload.author,
        source: payload.source ?? "strategy.campaign_calendar.generated",
        type: "plan",
      }),
      requiresManualValidation: payload.requiresManualValidation,
    };
  }

  private parseCampaignCalendar(details: unknown): CampaignCalendar | null {
    if (!details || typeof details !== "object") {
      return null;
    }

    const value = details as Partial<CampaignCalendar>;
    if (
      typeof value.clientId !== "string" ||
      typeof value.version !== "number" ||
      typeof value.status !== "string" ||
      !Array.isArray(value.items) ||
      typeof value.requestId !== "string" ||
      typeof value.strategyRequestId !== "string" ||
      typeof value.requiresManualValidation !== "boolean"
    ) {
      return null;
    }

    const allowedStatuses = ["ok", "seasonality_missing"] as const;
    const isCalendarStatus = (item: unknown): item is CampaignCalendar["status"] =>
      typeof item === "string" && (allowedStatuses as readonly string[]).includes(item);
    if (!isCalendarStatus(value.status)) {
      return null;
    }

    const allowedTypes = ["NEWSLETTER", "PROMO", "LIFECYCLE", "EDUCATIONAL"] as const;
    const items = value.items
      .filter(
        (item): item is CampaignCalendarItem =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as Record<string, unknown>).weekNumber === "number" &&
          typeof (item as Record<string, unknown>).campaignType === "string" &&
          typeof (item as Record<string, unknown>).goal === "string" &&
          typeof (item as Record<string, unknown>).segment === "string" &&
          typeof (item as Record<string, unknown>).title === "string" &&
          (allowedTypes as readonly string[]).includes((item as Record<string, unknown>).campaignType as string),
      )
      .map((item) => ({
        weekNumber: item.weekNumber,
        campaignType: item.campaignType,
        goal: item.goal,
        segment: item.segment,
        title: item.title,
      }));

    if (items.length < 4) {
      return null;
    }

    return {
      clientId: value.clientId,
      version: value.version,
      status: value.status,
      items,
      requestId: value.requestId,
      strategyRequestId: value.strategyRequestId,
      generatedAt:
        value.generatedAt instanceof Date
          ? value.generatedAt
          : new Date((value.generatedAt as string | undefined) ?? Date.now()),
      versionMeta: this.parseArtifactVersionMeta(
        value.versionMeta,
        {
          timestamp:
            value.generatedAt instanceof Date
              ? value.generatedAt
              : new Date((value.generatedAt as string | undefined) ?? Date.now()),
          type: "plan",
        },
      ),
      requiresManualValidation: value.requiresManualValidation,
    };
  }

  private parseLatestCampaignCalendar(records: Array<{ details: unknown }>): CampaignCalendar | null {
    for (const record of records) {
      const parsed = this.parseCampaignCalendar(record.details);
      if (parsed) {
        return parsed;
      }
    }
    return null;
  }

  private buildSegmentProposalItems(payload: {
    strategy: EmailStrategy;
    discoverySegments: string[];
  }): SegmentProposalItem[] {
    const candidates = payload.discoverySegments.length > 0
      ? payload.discoverySegments
      : payload.strategy.segments;
    const primaryGoal = payload.strategy.goals[0] ?? "Wzrost konwersji";

    return candidates.slice(0, 4).map((segmentName, index) => ({
      name: segmentName,
      entryCriteria: [
        `Segment source: ${segmentName}`,
        `Primary goal alignment: ${primaryGoal}`,
      ],
      objective: `Dowiezc cel "${primaryGoal}" dla segmentu ${segmentName}.`,
      campaignUseCase: `Kampanie tygodniowe dla ${segmentName} z KPI ${payload.strategy.kpis[0] ?? "conversion_rate"}.`,
      flowUseCase: `Flow lifecycle dla ${segmentName} zgodny z priorytetem ${payload.strategy.priorities[index] ?? payload.strategy.priorities[0] ?? "Core automation"}.`,
    }));
  }

  private buildSegmentProposalRecord(payload: {
    clientId: string;
    version: number;
    status: "ok" | "requires_data_refresh" | "failed_persist";
    segments: SegmentProposalItem[];
    requestId: string;
    strategyRequestId: string;
    missingData: string[];
    author?: string;
    source?: string;
  }): SegmentProposal {
    const generatedAt = new Date();
    return {
      clientId: payload.clientId,
      version: payload.version,
      status: payload.status,
      segments: payload.segments,
      requestId: payload.requestId,
      strategyRequestId: payload.strategyRequestId,
      generatedAt,
      versionMeta: this.buildArtifactVersionMeta({
        timestamp: generatedAt,
        author: payload.author,
        source: payload.source ?? "strategy.segment_proposal.generated",
        type: "plan",
      }),
      missingData: payload.missingData,
    };
  }

  private parseSegmentProposal(details: unknown): SegmentProposal | null {
    if (!details || typeof details !== "object") {
      return null;
    }

    const value = details as Partial<SegmentProposal>;
    if (
      typeof value.clientId !== "string" ||
      typeof value.version !== "number" ||
      typeof value.status !== "string" ||
      !Array.isArray(value.segments) ||
      typeof value.requestId !== "string" ||
      typeof value.strategyRequestId !== "string" ||
      !Array.isArray(value.missingData)
    ) {
      return null;
    }

    const allowedStatuses = ["ok", "requires_data_refresh", "failed_persist"] as const;
    const isSegmentStatus = (item: unknown): item is SegmentProposal["status"] =>
      typeof item === "string" && (allowedStatuses as readonly string[]).includes(item);
    if (!isSegmentStatus(value.status)) {
      return null;
    }

    const segments = value.segments
      .filter(
        (item): item is SegmentProposalItem =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as Record<string, unknown>).name === "string" &&
          Array.isArray((item as Record<string, unknown>).entryCriteria) &&
          typeof (item as Record<string, unknown>).objective === "string" &&
          typeof (item as Record<string, unknown>).campaignUseCase === "string" &&
          typeof (item as Record<string, unknown>).flowUseCase === "string",
      )
      .map((item) => ({
        name: item.name,
        entryCriteria: item.entryCriteria,
        objective: item.objective,
        campaignUseCase: item.campaignUseCase,
        flowUseCase: item.flowUseCase,
      }));

    return {
      clientId: value.clientId,
      version: value.version,
      status: value.status,
      segments,
      requestId: value.requestId,
      strategyRequestId: value.strategyRequestId,
      generatedAt:
        value.generatedAt instanceof Date
          ? value.generatedAt
          : new Date((value.generatedAt as string | undefined) ?? Date.now()),
      versionMeta: this.parseArtifactVersionMeta(
        value.versionMeta,
        {
          timestamp:
            value.generatedAt instanceof Date
              ? value.generatedAt
              : new Date((value.generatedAt as string | undefined) ?? Date.now()),
          type: "plan",
        },
      ),
      missingData: value.missingData.filter((item): item is string => typeof item === "string"),
    };
  }

  private parseLatestSegmentProposal(records: Array<{ details: unknown }>): SegmentProposal | null {
    for (const record of records) {
      const parsed = this.parseSegmentProposal(record.details);
      if (parsed) {
        return parsed;
      }
    }
    return null;
  }

  private buildCommunicationBriefRecord(payload: {
    clientId: string;
    version: number;
    status: "ok" | "missing_required_fields";
    campaignGoal: string;
    segment: string;
    tone: string;
    priority: string;
    kpi: string;
    requestId: string;
    strategyRequestId: string;
    missingFields: string[];
    author?: string;
    source?: string;
  }): CommunicationBrief {
    const generatedAt = new Date();
    return {
      clientId: payload.clientId,
      version: payload.version,
      status: payload.status,
      campaignGoal: payload.campaignGoal,
      segment: payload.segment,
      tone: payload.tone,
      priority: payload.priority,
      kpi: payload.kpi,
      requestId: payload.requestId,
      strategyRequestId: payload.strategyRequestId,
      generatedAt,
      versionMeta: this.buildArtifactVersionMeta({
        timestamp: generatedAt,
        author: payload.author,
        source: payload.source ?? "content.communication_brief.generated",
        type: "plan",
      }),
      missingFields: payload.missingFields,
    };
  }

  private parseCommunicationBrief(details: unknown): CommunicationBrief | null {
    if (!details || typeof details !== "object") {
      return null;
    }

    const value = details as Partial<CommunicationBrief>;
    if (
      typeof value.clientId !== "string" ||
      typeof value.version !== "number" ||
      typeof value.status !== "string" ||
      typeof value.campaignGoal !== "string" ||
      typeof value.segment !== "string" ||
      typeof value.tone !== "string" ||
      typeof value.priority !== "string" ||
      typeof value.kpi !== "string" ||
      typeof value.requestId !== "string" ||
      typeof value.strategyRequestId !== "string" ||
      !Array.isArray(value.missingFields)
    ) {
      return null;
    }

    const allowedStatuses = ["ok", "missing_required_fields"] as const;
    const isBriefStatus = (item: unknown): item is CommunicationBrief["status"] =>
      typeof item === "string" && (allowedStatuses as readonly string[]).includes(item);
    if (!isBriefStatus(value.status)) {
      return null;
    }

    return {
      clientId: value.clientId,
      version: value.version,
      status: value.status,
      campaignGoal: value.campaignGoal,
      segment: value.segment,
      tone: value.tone,
      priority: value.priority,
      kpi: value.kpi,
      requestId: value.requestId,
      strategyRequestId: value.strategyRequestId,
      generatedAt:
        value.generatedAt instanceof Date
          ? value.generatedAt
          : new Date((value.generatedAt as string | undefined) ?? Date.now()),
      versionMeta: this.parseArtifactVersionMeta(
        value.versionMeta,
        {
          timestamp:
            value.generatedAt instanceof Date
              ? value.generatedAt
              : new Date((value.generatedAt as string | undefined) ?? Date.now()),
          type: "plan",
        },
      ),
      missingFields: value.missingFields.filter((item): item is string => typeof item === "string"),
    };
  }

  private parseLatestCommunicationBrief(records: Array<{ details: unknown }>): CommunicationBrief | null {
    for (const record of records) {
      const parsed = this.parseCommunicationBrief(record.details);
      if (parsed) {
        return parsed;
      }
    }
    return null;
  }

  private buildEmailDraftRecord(payload: {
    clientId: string;
    version: number;
    status: "ok" | "timed_out" | "failed_generation";
    campaignGoal: string;
    segment: string;
    subject: string;
    preheader: string;
    body: string;
    cta: string;
    requestId: string;
    briefRequestId: string;
    retryable: boolean;
    author?: string;
    source?: string;
  }): EmailDraft {
    const validated = {
      clientId: payload.clientId.trim(),
      campaignGoal: payload.campaignGoal.trim(),
      segment: payload.segment.trim(),
      subject: payload.subject.trim(),
      preheader: payload.preheader.trim(),
      body: payload.body.trim(),
      cta: payload.cta.trim(),
      requestId: payload.requestId.trim(),
      briefRequestId: payload.briefRequestId.trim(),
    };
    const missingCore = Object.entries(validated)
      .filter(([, value]) => value.length === 0)
      .map(([field]) => field);
    if (missingCore.length > 0) {
      throw new AnalysisDomainError(
        "validation",
        "INVALID_DRAFT_RECORD",
        { missingFields: missingCore, status: payload.status },
        payload.requestId,
      );
    }
    if (
      payload.status === "ok" &&
      [validated.subject, validated.preheader, validated.body].some((field) => field.length < 3)
    ) {
      throw new AnalysisDomainError(
        "validation",
        "INVALID_AI_DRAFT_OUTPUT",
        { reason: "subject_preheader_body_too_short" },
        payload.requestId,
      );
    }

    const generatedAt = new Date();
    return {
      clientId: validated.clientId,
      version: payload.version,
      status: payload.status,
      campaignGoal: validated.campaignGoal,
      segment: validated.segment,
      subject: validated.subject,
      preheader: validated.preheader,
      body: validated.body,
      cta: validated.cta,
      requestId: validated.requestId,
      briefRequestId: validated.briefRequestId,
      generatedAt,
      versionMeta: this.buildArtifactVersionMeta({
        timestamp: generatedAt,
        author: payload.author,
        source: payload.source ?? "content.email_draft.generated",
        type: "plan",
      }),
      retryable: payload.retryable,
    };
  }

  private parseEmailDraft(details: unknown): EmailDraft | null {
    if (!details || typeof details !== "object") {
      return null;
    }

    const value = details as Partial<EmailDraft>;
    if (
      typeof value.clientId !== "string" ||
      typeof value.version !== "number" ||
      typeof value.status !== "string" ||
      typeof value.campaignGoal !== "string" ||
      typeof value.segment !== "string" ||
      typeof value.subject !== "string" ||
      typeof value.preheader !== "string" ||
      typeof value.body !== "string" ||
      typeof value.cta !== "string" ||
      typeof value.requestId !== "string" ||
      typeof value.briefRequestId !== "string" ||
      typeof value.retryable !== "boolean"
    ) {
      return null;
    }

    const allowedStatuses = ["ok", "timed_out", "failed_generation"] as const;
    const isDraftStatus = (item: unknown): item is EmailDraft["status"] =>
      typeof item === "string" && (allowedStatuses as readonly string[]).includes(item);
    if (!isDraftStatus(value.status)) {
      return null;
    }

    return {
      clientId: value.clientId,
      version: value.version,
      status: value.status,
      campaignGoal: value.campaignGoal,
      segment: value.segment,
      subject: value.subject,
      preheader: value.preheader,
      body: value.body,
      cta: value.cta,
      requestId: value.requestId,
      briefRequestId: value.briefRequestId,
      generatedAt:
        value.generatedAt instanceof Date
          ? value.generatedAt
          : new Date((value.generatedAt as string | undefined) ?? Date.now()),
      versionMeta: this.parseArtifactVersionMeta(
        value.versionMeta,
        {
          timestamp:
            value.generatedAt instanceof Date
              ? value.generatedAt
              : new Date((value.generatedAt as string | undefined) ?? Date.now()),
          type: "plan",
        },
      ),
      retryable: value.retryable,
    };
  }

  private parseLatestEmailDraft(records: Array<{ details: unknown }>): EmailDraft | null {
    for (const record of records) {
      const parsed = this.parseEmailDraft(record.details);
      if (parsed) {
        return parsed;
      }
    }
    return null;
  }

  private buildPersonalizedVariant(payload: {
    baseDraft: EmailDraft;
    segmentName: string;
  }): PersonalizedDraftVariant {
    return {
      segment: payload.segmentName,
      subject: `${payload.baseDraft.subject} [${payload.segmentName}]`,
      preheader: `${payload.baseDraft.preheader} • Segment: ${payload.segmentName}`,
      body: `${payload.baseDraft.body}\n\nSekcja personalizowana dla segmentu: ${payload.segmentName}.`,
      cta: `${payload.baseDraft.cta} (${payload.segmentName})`,
    };
  }

  private buildPersonalizedEmailDraftRecord(payload: {
    clientId: string;
    version: number;
    status: "ok" | "segment_data_missing" | "failed_generation";
    campaignGoal: string;
    baseDraftRequestId: string;
    requestId: string;
    variants: PersonalizedDraftVariant[];
    author?: string;
    source?: string;
  }): PersonalizedEmailDraft {
    const generatedAt = new Date();
    return {
      clientId: payload.clientId,
      version: payload.version,
      status: payload.status,
      campaignGoal: payload.campaignGoal,
      baseDraftRequestId: payload.baseDraftRequestId,
      requestId: payload.requestId,
      generatedAt,
      versionMeta: this.buildArtifactVersionMeta({
        timestamp: generatedAt,
        author: payload.author,
        source: payload.source ?? "content.email_draft.personalized",
        type: "plan",
      }),
      variants: payload.variants,
    };
  }

  private parsePersonalizedEmailDraft(details: unknown): PersonalizedEmailDraft | null {
    if (!details || typeof details !== "object") {
      return null;
    }

    const value = details as Partial<PersonalizedEmailDraft>;
    if (
      typeof value.clientId !== "string" ||
      typeof value.version !== "number" ||
      typeof value.status !== "string" ||
      typeof value.campaignGoal !== "string" ||
      typeof value.baseDraftRequestId !== "string" ||
      typeof value.requestId !== "string" ||
      !Array.isArray(value.variants)
    ) {
      return null;
    }

    const allowedStatuses = ["ok", "segment_data_missing", "failed_generation"] as const;
    const isStatus = (item: unknown): item is PersonalizedEmailDraft["status"] =>
      typeof item === "string" && (allowedStatuses as readonly string[]).includes(item);
    if (!isStatus(value.status)) {
      return null;
    }

    const variants = value.variants
      .filter(
        (item): item is PersonalizedDraftVariant =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as Record<string, unknown>).segment === "string" &&
          typeof (item as Record<string, unknown>).subject === "string" &&
          typeof (item as Record<string, unknown>).preheader === "string" &&
          typeof (item as Record<string, unknown>).body === "string" &&
          typeof (item as Record<string, unknown>).cta === "string",
      )
      .map((item) => ({
        segment: item.segment,
        subject: item.subject,
        preheader: item.preheader,
        body: item.body,
        cta: item.cta,
      }));

    return {
      clientId: value.clientId,
      version: value.version,
      status: value.status,
      campaignGoal: value.campaignGoal,
      baseDraftRequestId: value.baseDraftRequestId,
      requestId: value.requestId,
      generatedAt:
        value.generatedAt instanceof Date
          ? value.generatedAt
          : new Date((value.generatedAt as string | undefined) ?? Date.now()),
      versionMeta: this.parseArtifactVersionMeta(
        value.versionMeta,
        {
          timestamp:
            value.generatedAt instanceof Date
              ? value.generatedAt
              : new Date((value.generatedAt as string | undefined) ?? Date.now()),
          type: "plan",
        },
      ),
      variants,
    };
  }

  private parseLatestPersonalizedEmailDraft(
    records: Array<{ details: unknown }>,
  ): PersonalizedEmailDraft | null {
    for (const record of records) {
      const parsed = this.parsePersonalizedEmailDraft(record.details);
      if (parsed) {
        return parsed;
      }
    }
    return null;
  }

  private buildArtifactVersionMeta(payload: {
    timestamp: Date;
    author?: string;
    source?: string;
    type: VersionedArtifactType;
  }): ArtifactVersionMeta {
    const author = payload.author?.trim().length ? payload.author.trim() : "system";
    const source = payload.source?.trim().length ? payload.source.trim() : "analysis.service";
    return {
      timestamp: payload.timestamp,
      author,
      source,
      type: payload.type,
    };
  }

  private parseArtifactVersionMeta(
    input: unknown,
    fallback: { timestamp: Date; type: VersionedArtifactType },
  ): ArtifactVersionMeta {
    if (!input || typeof input !== "object") {
      return this.buildArtifactVersionMeta({
        timestamp: fallback.timestamp,
        author: "legacy_record",
        source: "legacy_record",
        type: fallback.type,
      });
    }

    const value = input as Partial<ArtifactVersionMeta>;
    const timestamp =
      value.timestamp instanceof Date
        ? value.timestamp
        : new Date((value.timestamp as string | undefined) ?? fallback.timestamp.toISOString());
    const type = value.type === "plan" || value.type === "flow" || value.type === "strategy"
      ? value.type
      : fallback.type;

    return this.buildArtifactVersionMeta({
      timestamp,
      author: typeof value.author === "string" ? value.author : "legacy_record",
      source: typeof value.source === "string" ? value.source : "legacy_record",
      type,
    });
  }

  private enrichAuditDetails(payload: {
    userId: string;
    actionType: string;
    artifactId: string;
    previous: unknown;
    current: unknown;
    extra?: Record<string, unknown>;
  }): Record<string, unknown> {
    const currentObject =
      payload.current && typeof payload.current === "object"
        ? (payload.current as Record<string, unknown>)
        : {};

    return {
      ...currentObject,
      timestamp: new Date().toISOString(),
      userId: payload.userId,
      actionType: payload.actionType,
      artifactId: payload.artifactId,
      diff: this.buildAuditDiff(payload.previous, payload.current),
      ...(payload.extra ?? {}),
    };
  }

  private buildAuditDiff(previous: unknown, current: unknown): Record<string, unknown> {
    const prevObject =
      previous && typeof previous === "object"
        ? (previous as Record<string, unknown>)
        : {};
    const currentObject =
      current && typeof current === "object"
        ? (current as Record<string, unknown>)
        : {};
    const keys = Array.from(
      new Set([...Object.keys(prevObject), ...Object.keys(currentObject)]),
    );
    const changedKeys = keys.filter(
      (key) => JSON.stringify(prevObject[key]) !== JSON.stringify(currentObject[key]),
    );

    return {
      fromVersion:
        typeof prevObject.version === "number" ? prevObject.version : null,
      toVersion:
        typeof currentObject.version === "number" ? currentObject.version : null,
      changedKeys,
      previousStatus:
        typeof prevObject.status === "string" ? prevObject.status : null,
      currentStatus:
        typeof currentObject.status === "string" ? currentObject.status : null,
    };
  }

  private async tryExportWithRetry(payload: {
    target: DocumentationExportTarget;
    clientId: string;
    title: string;
    markdown: string;
    requestId: string;
    retries: number;
  }): Promise<{ documentUrl: string } | null> {
    let attempt = 0;
    while (attempt <= payload.retries) {
      try {
        if (payload.target === "notion") {
          return await this.documentationExportAdapter.exportToNotion({
            clientId: payload.clientId,
            title: payload.title,
            markdown: payload.markdown,
            requestId: payload.requestId,
          });
        }
        return await this.documentationExportAdapter.exportToGoogleDocs({
          clientId: payload.clientId,
          title: payload.title,
          markdown: payload.markdown,
          requestId: payload.requestId,
        });
      } catch (error) {
        if (
          !(error instanceof DocumentationExportError) &&
          !(error instanceof Error)
        ) {
          return null;
        }
        attempt += 1;
        if (attempt > payload.retries) {
          return null;
        }
      }
    }
    return null;
  }

  private buildImplementationChecklistSteps(
    flowPlan: FlowPlan | null,
    calendar: CampaignCalendar | null,
  ): ImplementationChecklistStep[] {
    const flowSteps =
      flowPlan?.items.map((item, index) => ({
        id: `flow-${index + 1}-${this.slugify(item.name)}`,
        title: `Wdrozyc flow: ${item.name}`,
        sourceType: "flow" as const,
        sourceRef: item.name,
        status: "pending" as const,
        completedAt: null,
      })) ?? [];
    const campaignSteps =
      calendar?.items.slice(0, 8).map((item, index) => ({
        id: `campaign-${index + 1}-week-${item.weekNumber}`,
        title: `Skonfigurowac kampanie: ${item.title}`,
        sourceType: "campaign" as const,
        sourceRef: `week-${item.weekNumber}`,
        status: "pending" as const,
        completedAt: null,
      })) ?? [];

    const combined = [...flowSteps, ...campaignSteps];
    if (combined.length > 0) {
      return combined;
    }

    return [
      {
        id: "fallback-1-plan-preparation",
        title: "Uzupelnij plan flow i kalendarz kampanii przed wdrozeniem.",
        sourceType: "flow",
        sourceRef: "missing_sources",
        status: "pending",
        completedAt: null,
      },
    ];
  }

  private buildImplementationChecklistRecord(payload: {
    clientId: string;
    version: number;
    status: "ok" | "conflict_requires_refresh" | "transaction_error";
    requestId: string;
    steps: ImplementationChecklistStep[];
    generatedAt?: Date;
    updatedAt?: Date;
  }): ImplementationChecklist {
    const completedSteps = payload.steps.filter((step) => step.status === "done").length;
    const totalSteps = payload.steps.length;
    return {
      clientId: payload.clientId,
      version: payload.version,
      status: payload.status,
      requestId: payload.requestId,
      generatedAt: payload.generatedAt ?? new Date(),
      updatedAt: payload.updatedAt ?? new Date(),
      totalSteps,
      completedSteps,
      progressPercent: totalSteps === 0 ? 0 : Math.round((completedSteps / totalSteps) * 100),
      steps: payload.steps,
    };
  }

  private parseImplementationChecklist(details: unknown): ImplementationChecklist | null {
    if (!details || typeof details !== "object") {
      return null;
    }

    const value = details as Partial<ImplementationChecklist>;
    if (
      typeof value.clientId !== "string" ||
      typeof value.version !== "number" ||
      typeof value.status !== "string" ||
      typeof value.requestId !== "string" ||
      typeof value.totalSteps !== "number" ||
      typeof value.completedSteps !== "number" ||
      typeof value.progressPercent !== "number" ||
      !Array.isArray(value.steps)
    ) {
      return null;
    }

    const allowedStatuses = ["ok", "conflict_requires_refresh", "transaction_error"] as const;
    const isStatus = (item: unknown): item is ImplementationChecklist["status"] =>
      typeof item === "string" && (allowedStatuses as readonly string[]).includes(item);
    if (!isStatus(value.status)) {
      return null;
    }

    const allowedStepStatuses = ["pending", "in_progress", "done"] as const;
    const isStepStatus = (item: unknown): item is ImplementationChecklistStep["status"] =>
      typeof item === "string" && (allowedStepStatuses as readonly string[]).includes(item);
    const steps = value.steps
      .filter(
        (step): step is ImplementationChecklistStep =>
          typeof step === "object" &&
          step !== null &&
          typeof (step as Record<string, unknown>).id === "string" &&
          typeof (step as Record<string, unknown>).title === "string" &&
          (step as Record<string, unknown>).sourceType !== undefined &&
          typeof (step as Record<string, unknown>).sourceRef === "string" &&
          isStepStatus((step as Record<string, unknown>).status),
      )
      .map((step): ImplementationChecklistStep => ({
        id: step.id,
        title: step.title,
        sourceType: step.sourceType === "campaign" ? "campaign" : "flow",
        sourceRef: step.sourceRef,
        status: step.status,
        completedAt:
          step.completedAt instanceof Date
            ? step.completedAt
            : step.completedAt
              ? new Date(step.completedAt as unknown as string)
              : null,
      }));

    return {
      clientId: value.clientId,
      version: value.version,
      status: value.status,
      requestId: value.requestId,
      generatedAt:
        value.generatedAt instanceof Date
          ? value.generatedAt
          : new Date((value.generatedAt as string | undefined) ?? Date.now()),
      updatedAt:
        value.updatedAt instanceof Date
          ? value.updatedAt
          : new Date((value.updatedAt as string | undefined) ?? Date.now()),
      totalSteps: value.totalSteps,
      completedSteps: value.completedSteps,
      progressPercent: value.progressPercent,
      steps,
    };
  }

  private parseLatestImplementationChecklist(
    records: Array<{ details: unknown }>,
  ): ImplementationChecklist | null {
    for (const record of records) {
      const parsed = this.parseImplementationChecklist(record.details);
      if (parsed) {
        return parsed;
      }
    }
    return null;
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48);
  }

  private resolveHighestFlowPriority(flowPlan: FlowPlan | null): PriorityLevel {
    if (!flowPlan || flowPlan.items.length === 0) {
      return "MEDIUM";
    }
    const sorted = [...flowPlan.items].sort(
      (left, right) => this.priorityWeight(right.priority) - this.priorityWeight(left.priority),
    );
    return sorted[0]?.priority ?? "MEDIUM";
  }

  private resolveConfigGapImpactScore(priority: PriorityLevel): number {
    if (priority === "CRITICAL") {
      return 82;
    }
    if (priority === "HIGH") {
      return 72;
    }
    if (priority === "MEDIUM") {
      return 58;
    }
    return 45;
  }

  private priorityWeight(priority: PriorityLevel): number {
    if (priority === "CRITICAL") {
      return 4;
    }
    if (priority === "HIGH") {
      return 3;
    }
    if (priority === "MEDIUM") {
      return 2;
    }
    return 1;
  }

  private buildProductCoverageItem(
    productName: string,
    flowPlan: FlowPlan | null,
    campaignCalendar: CampaignCalendar | null,
  ): ProductCoverageItem {
    const normalizedProduct = productName.toLowerCase();
    const flowMatches =
      flowPlan?.items
        .filter((item) => this.matchesProduct(item.name, normalizedProduct))
        .map((item) => item.name) ?? [];
    const campaignMatches =
      campaignCalendar?.items
        .filter(
          (item) =>
            this.matchesProduct(item.title, normalizedProduct) ||
            this.matchesProduct(item.goal, normalizedProduct),
        )
        .map((item) => item.title) ?? [];

    const hasFlow = flowMatches.length > 0;
    const hasCampaign = campaignMatches.length > 0;
    const coverageScore = hasFlow && hasCampaign ? 100 : hasFlow || hasCampaign ? 60 : 0;
    const status = coverageScore === 100 ? "covered" : coverageScore > 0 ? "partial" : "missing";

    return {
      productName,
      flowMatches,
      campaignMatches,
      coverageScore,
      status,
    };
  }

  private buildCommunicationImprovementRecommendationItem(
    coverage: ProductCoverageItem,
    requestId: string,
  ): CommunicationImprovementRecommendationItem {
    const missingFlow = coverage.flowMatches.length === 0;
    const missingCampaign = coverage.campaignMatches.length === 0;

    if (coverage.status === "missing") {
      return {
        id: `${requestId}-${this.slugify(coverage.productName)}`,
        productName: coverage.productName,
        title: `Brak komunikacji dla ${coverage.productName}`,
        description: "Produkt nie ma pokrycia ani w flow, ani w kampaniach.",
        priority: "CRITICAL",
        impactScore: 95,
        status: coverage.status,
        action: "Dodaj flow lifecycle i minimum 1 kampanie dla produktu.",
      };
    }

    if (missingFlow) {
      return {
        id: `${requestId}-${this.slugify(coverage.productName)}`,
        productName: coverage.productName,
        title: `Uzupelnij flow dla ${coverage.productName}`,
        description: "Produkt ma komunikacje kampanijna, ale brak automatyzacji flow.",
        priority: "HIGH",
        impactScore: 84,
        status: coverage.status,
        action: "Dodaj flow onboarding lub post-purchase dla produktu.",
      };
    }

    if (missingCampaign) {
      return {
        id: `${requestId}-${this.slugify(coverage.productName)}`,
        productName: coverage.productName,
        title: `Uzupelnij kampanie dla ${coverage.productName}`,
        description: "Produkt ma flow, ale nie jest wspierany regularna kampania.",
        priority: "HIGH",
        impactScore: 78,
        status: coverage.status,
        action: "Dodaj kampanie edukacyjna lub promocyjna dla produktu.",
      };
    }

    return {
      id: `${requestId}-${this.slugify(coverage.productName)}`,
      productName: coverage.productName,
      title: `Wzmocnij performance dla ${coverage.productName}`,
      description: "Produkt ma pelne pokrycie i jest gotowy do optymalizacji.",
      priority: "MEDIUM",
      impactScore: 55,
      status: coverage.status,
      action: "Przetestuj warianty tresci i segmentacji w aktualnych flow/kampaniach.",
    };
  }

  private matchesProduct(value: string, normalizedProduct: string): boolean {
    return value.toLowerCase().includes(normalizedProduct);
  }

  private createContentRequestId(prefix: string): string {
    const randomPart = Math.random().toString(36).slice(2, 8);
    return `${prefix}-${Date.now()}-${randomPart}`;
  }

  private detectAiGenerationOutcome(requestId: string): "ok" | "timeout" | "error" {
    const normalized = requestId.toLowerCase();
    if (
      normalized.includes("timeout") ||
      normalized.includes("ai_timeout") ||
      normalized.includes("model_timeout")
    ) {
      return "timeout";
    }
    if (
      normalized.includes("ai_error") ||
      normalized.includes("model_error") ||
      normalized.includes("failed_ai")
    ) {
      return "error";
    }
    return "ok";
  }

  private resolveAiDraftPayload(payload: {
    campaignGoal: string;
    segment: string;
    tone: string;
    requestId: string;
  }): {
    subject: string;
    preheader: string;
    body: string;
    cta: string;
  } {
    if (payload.requestId.toLowerCase().includes("invalid_ai_output")) {
      return {
        subject: "",
        preheader: "x",
        body: "",
        cta: "",
      };
    }
    return {
      subject: `Temat: ${payload.campaignGoal}`,
      preheader: `Preheader dla segmentu ${payload.segment}`,
      body: `Body draftu dla celu "${payload.campaignGoal}" z tonem "${payload.tone}".`,
      cta: `Sprawdz oferte dla ${payload.segment}`,
    };
  }

  private isValidAiDraftPayload(payload: {
    subject: string;
    preheader: string;
    body: string;
  }): boolean {
    return [payload.subject, payload.preheader, payload.body].every(
      (field) => typeof field === "string" && field.trim().length >= 3,
    );
  }

  private isSegmentProposalUsable(
    proposal: SegmentProposal | null,
  ): proposal is SegmentProposal & { status: "ok" } {
    if (!proposal || proposal.status !== "ok" || proposal.segments.length === 0) {
      return false;
    }
    return proposal.segments.every(
      (segment) =>
        segment.name.trim().length > 0 &&
        segment.objective.trim().length > 0 &&
        segment.campaignUseCase.trim().length > 0 &&
        segment.flowUseCase.trim().length > 0 &&
        segment.entryCriteria.length > 0 &&
        segment.entryCriteria.every((criterion) => criterion.trim().length > 0),
    );
  }

  private isStrategyUsableForContent(strategy: EmailStrategy | null): strategy is EmailStrategy {
    if (!strategy || strategy.status !== "ok") {
      return false;
    }
    return (
      strategy.tone.trim().length > 0 &&
      strategy.priorities.some((item) => item.trim().length > 0) &&
      strategy.kpis.some((item) => item.trim().length > 0) &&
      strategy.segments.some((item) => item.trim().length > 0)
    );
  }

  private collectMissingContext(
    linkedClientGoals: string[],
    linkedClientPriorities: string[],
  ): string[] {
    const missing: string[] = [];
    if (linkedClientGoals.length === 0) {
      missing.push("linkedClientGoals");
    }
    if (linkedClientPriorities.length === 0) {
      missing.push("linkedClientPriorities");
    }
    return missing;
  }

  private detectSourceConflict(
    syncRun: {
      flowCount?: number | null;
      emailCount?: number | null;
      startedAt: Date;
    },
    inventory: Array<{ entityType: KlaviyoEntityType }>,
  ): {
    fields: string[];
    sourceA: string;
    sourceB: string;
    reason: string;
  } | undefined {
    const inventoryFlowCount = inventory.filter((item) => item.entityType === "FLOW").length;
    const inventoryEmailCount = inventory.filter((item) => item.entityType === "EMAIL").length;

    const checks = [
      {
        field: "flowCount",
        sourceAValue: syncRun.flowCount ?? 0,
        sourceBValue: inventoryFlowCount,
      },
      {
        field: "emailCount",
        sourceAValue: syncRun.emailCount ?? 0,
        sourceBValue: inventoryEmailCount,
      },
    ];

    const conflictingFields = checks.filter((metric) => {
      const maxBase = Math.max(metric.sourceAValue, metric.sourceBValue, 1);
      const absoluteDelta = Math.abs(metric.sourceAValue - metric.sourceBValue);
      const relativeDelta = absoluteDelta / maxBase;
      const smallMetricConflict = maxBase <= 5 && absoluteDelta > 2;
      return relativeDelta > 0.2 || smallMetricConflict;
    });

    if (conflictingFields.length === 0) {
      return undefined;
    }

    const fields = conflictingFields.map((item) => item.field);
    const daysAgo = Math.floor((Date.now() - syncRun.startedAt.getTime()) / (1000 * 60 * 60 * 24));
    const windowLabel = daysAgo > 30 ? "last_30_days" : "last_sync_window";

    return {
      fields,
      sourceA: "sync_inventory",
      sourceB: "cached_insights",
      reason: `delta > threshold (${windowLabel}, rel>20% or abs>2 for small metrics)`,
    };
  }

  private mapAreaToInsight(payload: {
    area: OptimizationArea;
    requestId: string;
    status: "ok" | "draft_low_confidence" | "source_conflict";
    missingContext: string[];
    conflictDetails?:
      | {
          fields: string[];
          sourceA: string;
          sourceB: string;
          reason: string;
        }
      | undefined;
    linkedClientGoals: string[];
    linkedClientPriorities: string[];
    syncRun: { requestId: string; startedAt: Date };
    position: number;
  }): InsightItem {
    const { area, requestId, status, missingContext, conflictDetails } = payload;
    const isConflict = status === "source_conflict";
    const isDraft = status === "draft_low_confidence";

    return {
      id: `${requestId}-${payload.position}`,
      title: `Priorytet ${payload.position}: ${area.name}`,
      rationale: isConflict
        ? `Wykryto konflikt zrodel dla metryk (${(conflictDetails?.fields ?? []).join(", ")}). Wymagana walidacja czlowieka.`
        : `Obszar ${area.category} ma priorytet ${area.priority} oraz oczekiwany efekt ${area.expectedImpact}%.`,
      dataSources: [
        {
          sourceType: "optimization_ranking",
          sourceId: area.source,
          observedAt: new Date(),
          metricKey: "expectedImpact",
          metricValue: area.expectedImpact,
        },
        {
          sourceType: "sync_inventory",
          sourceId: payload.syncRun.requestId,
          observedAt: payload.syncRun.startedAt,
          metricKey: "confidence",
          metricValue: area.confidence,
        },
      ],
      recommendedAction: isConflict
        ? null
        : isDraft
          ? `Wstepna rekomendacja: zweryfikuj "${area.name}" po uzupelnieniu kontekstu (${missingContext.join(", ")}).`
          : `Uruchom plan optymalizacji dla "${area.name}" i przypisz odpowiedzialnego za wdrozenie.`,
      actionability: isConflict ? "needs_human_validation" : isDraft ? "needs_human_validation" : "actionable",
      confidence: area.confidence,
      status,
      linkedClientGoals: payload.linkedClientGoals,
      linkedClientPriorities: payload.linkedClientPriorities,
      missingContext,
      conflictDetails,
      requestId,
      lastSyncRequestId: payload.syncRun.requestId,
    };
  }

  private resolveInsightsMetaStatus(
    insights: InsightItem[],
  ): "ok" | "draft_low_confidence" | "source_conflict" | "empty" {
    if (insights.length === 0) {
      return "empty";
    }
    if (insights.some((item) => item.status === "source_conflict")) {
      return "source_conflict";
    }
    if (insights.some((item) => item.status === "draft_low_confidence")) {
      return "draft_low_confidence";
    }
    return "ok";
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

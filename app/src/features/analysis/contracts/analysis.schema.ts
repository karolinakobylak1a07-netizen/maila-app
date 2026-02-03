import { z } from "zod";

export const syncTriggerSchema = z.enum(["MANUAL", "DAILY"]);
export const klaviyoEntityTypeSchema = z.enum(["ACCOUNT", "FLOW", "EMAIL", "FORM"]);
export const klaviyoSyncStatusSchema = z.enum([
  "IN_PROGRESS",
  "OK",
  "FAILED_AUTH",
  "PARTIAL_OR_TIMEOUT",
]);
export const gapReportStatusSchema = z.enum(["OK", "GAP", "INSUFFICIENT_DATA"]);
export const gapPrioritySchema = z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]);
export const gapCategorySchema = z.enum(["FLOW", "SEGMENT", "LOGIC"]);

export const optimizationStatusSchema = z.enum([
  "OK",
  "GAP",
  "insufficient_data_for_priority",
  "timed_out",
]);
export const insightStatusSchema = z.enum([
  "ok",
  "draft_low_confidence",
  "source_conflict",
]);
export const insightActionabilitySchema = z.enum([
  "actionable",
  "needs_human_validation",
]);
export const insightSourceTypeSchema = z.enum([
  "sync_inventory",
  "cached_insights",
  "ui_input",
  "optimization_ranking",
  "gap_report",
]);
export const expectedImpactSchema = z.number().min(0).max(100);
export const priorityLevelSchema = z.enum([
  "CRITICAL",
  "HIGH",
  "MEDIUM",
  "LOW",
]);
export const confidenceLevelSchema = z.number().min(0).max(100);

export const optimizationAreaSchema = z.object({
  name: z.string().min(1),
  category: z.enum(["FLOW", "SEGMENT", "LOGIC"]),
  priority: priorityLevelSchema,
  expectedImpact: expectedImpactSchema,
  confidence: confidenceLevelSchema,
  source: z.string().min(1),
  requestId: z.string().min(1),
  lastSyncRequestId: z.string().min(1),
  refreshWindow: z.number().int().min(0).default(7),
  status: optimizationStatusSchema,
});

export const getOptimizationAreasSchema = z.object({
  clientId: z.string().cuid().optional(),
  requestId: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(50).optional().default(10),
  showPartialOnTimeout: z.boolean().optional().default(true),
});
export const insightDataSourceSchema = z.object({
  sourceType: insightSourceTypeSchema,
  sourceId: z.string().min(1).optional(),
  observedAt: z.date(),
  metricKey: z.string().min(1).optional(),
  metricValue: z.union([z.number(), z.string()]).optional(),
});
export const insightConflictDetailsSchema = z.object({
  fields: z.array(z.string().min(1)).min(1),
  sourceA: z.string().min(1),
  sourceB: z.string().min(1),
  reason: z.string().min(1),
});
export const insightItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  rationale: z.string().min(1),
  dataSources: z.array(insightDataSourceSchema).min(1),
  recommendedAction: z.string().min(1).nullable(),
  actionability: insightActionabilitySchema,
  confidence: z.number().min(0).max(100),
  status: insightStatusSchema,
  linkedClientGoals: z.array(z.string().min(1)),
  linkedClientPriorities: z.array(z.string().min(1)),
  missingContext: z.array(z.string().min(1)).default([]),
  conflictDetails: insightConflictDetailsSchema.optional(),
  requestId: z.string().min(1),
  lastSyncRequestId: z.string().min(1),
});
export const getContextInsightsSchema = z.object({
  clientId: z.string().cuid(),
  requestId: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(20).optional().default(5),
});
export const strategyGenerationStatusSchema = z.enum([
  "ok",
  "in_progress_or_timeout",
  "blocked_preconditions",
]);
export const strategyPreconditionSchema = z.enum([
  "discovery.goals",
  "discovery.segments",
  "audit.sync_ok",
  "audit.optimization_available",
]);
export const versionedArtifactTypeSchema = z.enum(["plan", "flow", "strategy"]);
export const artifactVersionMetaSchema = z.object({
  timestamp: z.date(),
  author: z.string().min(1),
  source: z.string().min(1),
  type: versionedArtifactTypeSchema,
});
export const emailStrategySchema = z.object({
  clientId: z.string().cuid(),
  version: z.number().int().positive(),
  status: strategyGenerationStatusSchema,
  goals: z.array(z.string().min(1)),
  segments: z.array(z.string().min(1)),
  tone: z.string().min(1),
  priorities: z.array(z.string().min(1)),
  kpis: z.array(z.string().min(1)),
  requestId: z.string().min(1),
  lastSyncRequestId: z.string().min(1),
  generatedAt: z.date(),
  versionMeta: artifactVersionMetaSchema,
  missingPreconditions: z.array(strategyPreconditionSchema).default([]),
  retryHint: z.string().min(1).optional(),
});
export const generateEmailStrategySchema = z.object({
  clientId: z.string().cuid(),
  requestId: z.string().min(1).optional(),
});
export const getLatestEmailStrategySchema = z.object({
  clientId: z.string().cuid(),
});
export const flowPlanStatusSchema = z.enum([
  "ok",
  "precondition_not_approved",
  "failed_persist",
]);
export const flowPrioritySchema = z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]);
export const flowPlanItemSchema = z.object({
  name: z.string().min(1),
  trigger: z.string().min(1),
  objective: z.string().min(1),
  priority: flowPrioritySchema,
  businessReason: z.string().min(1),
});
export const flowPlanSchema = z.object({
  clientId: z.string().cuid(),
  version: z.number().int().positive(),
  status: flowPlanStatusSchema,
  items: z.array(flowPlanItemSchema),
  requestId: z.string().min(1),
  strategyRequestId: z.string().min(1),
  generatedAt: z.date(),
  versionMeta: artifactVersionMetaSchema,
  requiredStep: z.string().min(1).optional(),
});
export const generateFlowPlanSchema = z.object({
  clientId: z.string().cuid(),
  requestId: z.string().min(1).optional(),
});
export const getLatestFlowPlanSchema = z.object({
  clientId: z.string().cuid(),
});
export const campaignCalendarStatusSchema = z.enum([
  "ok",
  "seasonality_missing",
]);
export const campaignTypeSchema = z.enum([
  "NEWSLETTER",
  "PROMO",
  "LIFECYCLE",
  "EDUCATIONAL",
]);
export const campaignCalendarItemSchema = z.object({
  weekNumber: z.number().int().min(1).max(52),
  campaignType: campaignTypeSchema,
  goal: z.string().min(1),
  segment: z.string().min(1),
  title: z.string().min(1),
});
export const campaignCalendarSchema = z.object({
  clientId: z.string().cuid(),
  version: z.number().int().positive(),
  status: campaignCalendarStatusSchema,
  items: z.array(campaignCalendarItemSchema).min(4),
  requestId: z.string().min(1),
  strategyRequestId: z.string().min(1),
  generatedAt: z.date(),
  versionMeta: artifactVersionMetaSchema,
  requiresManualValidation: z.boolean(),
});
export const generateCampaignCalendarSchema = z.object({
  clientId: z.string().cuid(),
  requestId: z.string().min(1).optional(),
});
export const getLatestCampaignCalendarSchema = z.object({
  clientId: z.string().cuid(),
});
export const segmentProposalStatusSchema = z.enum([
  "ok",
  "requires_data_refresh",
  "failed_persist",
]);
export const segmentProposalItemSchema = z.object({
  name: z.string().min(1),
  entryCriteria: z.array(z.string().min(1)).min(1),
  objective: z.string().min(1),
  campaignUseCase: z.string().min(1),
  flowUseCase: z.string().min(1),
});
export const segmentProposalSchema = z.object({
  clientId: z.string().cuid(),
  version: z.number().int().positive(),
  status: segmentProposalStatusSchema,
  segments: z.array(segmentProposalItemSchema),
  requestId: z.string().min(1),
  strategyRequestId: z.string().min(1),
  generatedAt: z.date(),
  versionMeta: artifactVersionMetaSchema,
  missingData: z.array(z.string().min(1)).default([]),
});
export const generateSegmentProposalSchema = z.object({
  clientId: z.string().cuid(),
  requestId: z.string().min(1).optional(),
});
export const getLatestSegmentProposalSchema = z.object({
  clientId: z.string().cuid(),
});
export const communicationBriefStatusSchema = z.enum([
  "ok",
  "missing_required_fields",
]);
export const communicationBriefSchema = z.object({
  clientId: z.string().cuid(),
  version: z.number().int().positive(),
  status: communicationBriefStatusSchema,
  campaignGoal: z.string().min(1),
  segment: z.string().min(1),
  tone: z.string().min(1),
  priority: z.string().min(1),
  kpi: z.string().min(1),
  requestId: z.string().min(1),
  strategyRequestId: z.string().min(1),
  generatedAt: z.date(),
  versionMeta: artifactVersionMetaSchema,
  missingFields: z.array(z.string().min(1)).default([]),
});
export const generateCommunicationBriefSchema = z.object({
  clientId: z.string().cuid(),
  campaignGoal: z.string().min(1).optional(),
  segment: z.string().min(1).optional(),
  requestId: z.string().min(1).optional(),
});
export const getLatestCommunicationBriefSchema = z.object({
  clientId: z.string().cuid(),
});
export const emailDraftStatusSchema = z.enum([
  "ok",
  "timed_out",
  "failed_generation",
]);
export const emailDraftSchema = z.object({
  clientId: z.string().cuid(),
  version: z.number().int().positive(),
  status: emailDraftStatusSchema,
  campaignGoal: z.string().min(1),
  segment: z.string().min(1),
  subject: z.string().min(1),
  preheader: z.string().min(1),
  body: z.string().min(1),
  cta: z.string().min(1),
  requestId: z.string().min(1),
  briefRequestId: z.string().min(1),
  generatedAt: z.date(),
  versionMeta: artifactVersionMetaSchema,
  retryable: z.boolean().default(false),
});
export const generateEmailDraftSchema = z.object({
  clientId: z.string().cuid(),
  requestId: z.string().min(1).optional(),
  manualAccept: z.boolean().optional().default(false),
});
export const getLatestEmailDraftSchema = z.object({
  clientId: z.string().cuid(),
});
export const personalizedDraftStatusSchema = z.enum([
  "ok",
  "segment_data_missing",
  "failed_generation",
]);
export const personalizedDraftVariantSchema = z.object({
  segment: z.string().min(1),
  subject: z.string().min(1),
  preheader: z.string().min(1),
  body: z.string().min(1),
  cta: z.string().min(1),
});
export const personalizedEmailDraftSchema = z.object({
  clientId: z.string().cuid(),
  version: z.number().int().positive(),
  status: personalizedDraftStatusSchema,
  campaignGoal: z.string().min(1),
  baseDraftRequestId: z.string().min(1),
  requestId: z.string().min(1),
  generatedAt: z.date(),
  versionMeta: artifactVersionMetaSchema,
  variants: z.array(personalizedDraftVariantSchema),
});
export const generatePersonalizedEmailDraftSchema = z.object({
  clientId: z.string().cuid(),
  requestId: z.string().min(1).optional(),
  manualAccept: z.boolean().optional().default(false),
});
export const getLatestPersonalizedEmailDraftSchema = z.object({
  clientId: z.string().cuid(),
});
export const implementationChecklistStepStatusSchema = z.enum([
  "pending",
  "in_progress",
  "done",
]);
export const implementationChecklistStatusSchema = z.enum([
  "ok",
  "conflict_requires_refresh",
  "transaction_error",
]);
export const implementationChecklistStepSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  sourceType: z.enum(["flow", "campaign"]),
  sourceRef: z.string().min(1),
  status: implementationChecklistStepStatusSchema,
  completedAt: z.date().nullable(),
});
export const implementationChecklistSchema = z.object({
  clientId: z.string().cuid(),
  version: z.number().int().positive(),
  status: implementationChecklistStatusSchema,
  requestId: z.string().min(1),
  generatedAt: z.date(),
  updatedAt: z.date(),
  totalSteps: z.number().int().min(0),
  completedSteps: z.number().int().min(0),
  progressPercent: z.number().int().min(0).max(100),
  steps: z.array(implementationChecklistStepSchema),
});
export const generateImplementationChecklistSchema = z.object({
  clientId: z.string().cuid(),
  requestId: z.string().min(1).optional(),
});
export const getLatestImplementationChecklistSchema = z.object({
  clientId: z.string().cuid(),
});
export const updateImplementationChecklistStepSchema = z.object({
  clientId: z.string().cuid(),
  stepId: z.string().min(1),
  status: implementationChecklistStepStatusSchema,
  expectedVersion: z.number().int().positive(),
  requestId: z.string().min(1).optional(),
});
export const implementationAlertTypeSchema = z.enum([
  "blocker",
  "configuration_gap",
  "progress",
]);
export const implementationAlertSeveritySchema = z.enum(["critical", "warning"]);
export const implementationAlertProgressStateSchema = z.enum([
  "blocked",
  "at_risk",
  "on_track",
]);
export const implementationAlertSchema = z.object({
  id: z.string().min(1),
  type: implementationAlertTypeSchema,
  severity: implementationAlertSeveritySchema,
  priority: priorityLevelSchema,
  impactScore: expectedImpactSchema,
  progressState: implementationAlertProgressStateSchema,
  progressPercent: z.number().int().min(0).max(100).optional(),
  title: z.string().min(1),
  description: z.string().min(1),
  source: z.string().min(1),
});
export const implementationAlertsStatusSchema = z.enum([
  "ok",
  "blocked",
  "needs_configuration",
  "at_risk",
]);
export const implementationAlertsSchema = z.object({
  clientId: z.string().cuid(),
  status: implementationAlertsStatusSchema,
  requestId: z.string().min(1),
  generatedAt: z.date(),
  blockerCount: z.number().int().min(0),
  configGapCount: z.number().int().min(0),
  alerts: z.array(implementationAlertSchema),
});
export const getImplementationAlertsSchema = z.object({
  clientId: z.string().cuid(),
});
export const implementationReportStatusSchema = z.enum([
  "ok",
  "blocked",
  "needs_configuration",
  "at_risk",
]);
export const implementationReportSchema = z.object({
  clientId: z.string().cuid(),
  requestId: z.string().min(1),
  generatedAt: z.date(),
  status: implementationReportStatusSchema,
  markdown: z.string().min(1),
});
export const getImplementationReportSchema = z.object({
  clientId: z.string().cuid(),
});
export const auditProductContextStatusSchema = z.enum([
  "ok",
  "missing_context",
]);
export const auditProductContextSchema = z.object({
  clientId: z.string().cuid(),
  status: auditProductContextStatusSchema,
  requestId: z.string().min(1),
  generatedAt: z.date(),
  offer: z.string().min(1),
  targetAudience: z.string().min(1),
  mainProducts: z.array(z.string().min(1)),
  currentFlows: z.array(z.string().min(1)),
  goals: z.array(z.string().min(1)),
  segments: z.array(z.string().min(1)),
  missingFields: z.array(z.string().min(1)),
});
export const getAuditProductContextSchema = z.object({
  clientId: z.string().cuid(),
});
export const productCoverageItemStatusSchema = z.enum([
  "covered",
  "partial",
  "missing",
]);
export const productCoverageAnalysisStatusSchema = z.enum([
  "ok",
  "partial",
  "missing_context",
]);
export const productCoverageItemSchema = z.object({
  productName: z.string().min(1),
  flowMatches: z.array(z.string().min(1)),
  campaignMatches: z.array(z.string().min(1)),
  coverageScore: z.number().int().min(0).max(100),
  status: productCoverageItemStatusSchema,
});
export const productCoverageAnalysisSchema = z.object({
  clientId: z.string().cuid(),
  status: productCoverageAnalysisStatusSchema,
  requestId: z.string().min(1),
  generatedAt: z.date(),
  items: z.array(productCoverageItemSchema),
  missingFlows: z.array(z.string().min(1)),
  missingCampaigns: z.array(z.string().min(1)),
});
export const getProductCoverageAnalysisSchema = z.object({
  clientId: z.string().cuid(),
});
export const communicationImprovementRecommendationStatusSchema = z.enum([
  "ok",
  "missing_context",
]);
export const communicationImprovementRecommendationItemSchema = z.object({
  id: z.string().min(1),
  productName: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  priority: priorityLevelSchema,
  impactScore: z.number().int().min(0).max(100),
  status: productCoverageItemStatusSchema,
  action: z.string().min(1),
});
export const communicationImprovementRecommendationsSchema = z.object({
  clientId: z.string().cuid(),
  status: communicationImprovementRecommendationStatusSchema,
  requestId: z.string().min(1),
  generatedAt: z.date(),
  items: z.array(communicationImprovementRecommendationItemSchema),
});
export const getCommunicationImprovementRecommendationsSchema = z.object({
  clientId: z.string().cuid(),
  manualAccept: z.boolean().optional().default(false),
});

export type GetOptimizationAreasSchema = z.infer<typeof getOptimizationAreasSchema>;
export type GetContextInsightsSchema = z.infer<typeof getContextInsightsSchema>;
export type GenerateEmailStrategySchema = z.infer<typeof generateEmailStrategySchema>;
export type GetLatestEmailStrategySchema = z.infer<typeof getLatestEmailStrategySchema>;
export type GenerateFlowPlanSchema = z.infer<typeof generateFlowPlanSchema>;
export type GetLatestFlowPlanSchema = z.infer<typeof getLatestFlowPlanSchema>;
export type GenerateCampaignCalendarSchema = z.infer<typeof generateCampaignCalendarSchema>;
export type GetLatestCampaignCalendarSchema = z.infer<typeof getLatestCampaignCalendarSchema>;
export type GenerateSegmentProposalSchema = z.infer<typeof generateSegmentProposalSchema>;
export type GetLatestSegmentProposalSchema = z.infer<typeof getLatestSegmentProposalSchema>;
export type GenerateCommunicationBriefSchema = z.infer<typeof generateCommunicationBriefSchema>;
export type GetLatestCommunicationBriefSchema = z.infer<typeof getLatestCommunicationBriefSchema>;
export type GenerateEmailDraftSchema = z.infer<typeof generateEmailDraftSchema>;
export type GetLatestEmailDraftSchema = z.infer<typeof getLatestEmailDraftSchema>;
export type GeneratePersonalizedEmailDraftSchema = z.infer<typeof generatePersonalizedEmailDraftSchema>;
export type GetLatestPersonalizedEmailDraftSchema = z.infer<typeof getLatestPersonalizedEmailDraftSchema>;
export type GenerateImplementationChecklistSchema = z.infer<typeof generateImplementationChecklistSchema>;
export type GetLatestImplementationChecklistSchema = z.infer<typeof getLatestImplementationChecklistSchema>;
export type UpdateImplementationChecklistStepSchema = z.infer<typeof updateImplementationChecklistStepSchema>;
export type GetImplementationAlertsSchema = z.infer<typeof getImplementationAlertsSchema>;
export type GetImplementationReportSchema = z.infer<typeof getImplementationReportSchema>;
export type GetAuditProductContextSchema = z.infer<typeof getAuditProductContextSchema>;
export type GetProductCoverageAnalysisSchema = z.infer<typeof getProductCoverageAnalysisSchema>;
export type GetCommunicationImprovementRecommendationsSchema = z.infer<typeof getCommunicationImprovementRecommendationsSchema>;

export const syncNowSchema = z.object({
  clientId: z.string().cuid(),
});

export const getSyncStatusSchema = z.object({
  clientId: z.string().cuid(),
});

export const getGapReportSchema = z.object({
  clientId: z.string().cuid(),
});

export type GapItem = {
  id: string;
  category: "FLOW" | "SEGMENT" | "LOGIC";
  status: "OK" | "GAP" | "INSUFFICIENT_DATA";
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  name: string;
  reason: string;
};

export interface GapReportData {
  items: GapItem[];
  total: number;
  gaps: number;
  stale: number;
  insufficient: number;
}

export interface GapReportMeta {
  generatedAt: Date;
  lastSyncRequestId: string;
  hasStaleData: boolean;
  requestId: string;
}

export type GetGapReportOutput =
  | { data: GapReportData; meta: GapReportMeta }
  | { error: { code: string; message: string; details?: Record<string, unknown>; requestId: string } };

export type SyncTrigger = z.infer<typeof syncTriggerSchema>;
export type KlaviyoEntityType = z.infer<typeof klaviyoEntityTypeSchema>;
export type KlaviyoSyncStatus = z.infer<typeof klaviyoSyncStatusSchema>;
export type GapReportStatus = z.infer<typeof gapReportStatusSchema>;
export type GapPriority = z.infer<typeof gapPrioritySchema>;
export type GapCategory = z.infer<typeof gapCategorySchema>;
export type OptimizationStatus = z.infer<typeof optimizationStatusSchema>;
export type InsightStatus = z.infer<typeof insightStatusSchema>;
export type InsightActionability = z.infer<typeof insightActionabilitySchema>;
export type InsightSourceType = z.infer<typeof insightSourceTypeSchema>;
export type ExpectedImpact = z.infer<typeof expectedImpactSchema>;
export type PriorityLevel = z.infer<typeof priorityLevelSchema>;
export type ConfidenceLevel = z.infer<typeof confidenceLevelSchema>;
export type OptimizationArea = z.infer<typeof optimizationAreaSchema>;
export type InsightDataSource = z.infer<typeof insightDataSourceSchema>;
export type InsightConflictDetails = z.infer<typeof insightConflictDetailsSchema>;
export type InsightItem = z.infer<typeof insightItemSchema>;
export type StrategyGenerationStatus = z.infer<typeof strategyGenerationStatusSchema>;
export type StrategyPrecondition = z.infer<typeof strategyPreconditionSchema>;
export type VersionedArtifactType = z.infer<typeof versionedArtifactTypeSchema>;
export type ArtifactVersionMeta = z.infer<typeof artifactVersionMetaSchema>;
export type EmailStrategy = z.infer<typeof emailStrategySchema>;
export type FlowPlanStatus = z.infer<typeof flowPlanStatusSchema>;
export type FlowPriority = z.infer<typeof flowPrioritySchema>;
export type FlowPlanItem = z.infer<typeof flowPlanItemSchema>;
export type FlowPlan = z.infer<typeof flowPlanSchema>;
export type CampaignCalendarStatus = z.infer<typeof campaignCalendarStatusSchema>;
export type CampaignType = z.infer<typeof campaignTypeSchema>;
export type CampaignCalendarItem = z.infer<typeof campaignCalendarItemSchema>;
export type CampaignCalendar = z.infer<typeof campaignCalendarSchema>;
export type SegmentProposalStatus = z.infer<typeof segmentProposalStatusSchema>;
export type SegmentProposalItem = z.infer<typeof segmentProposalItemSchema>;
export type SegmentProposal = z.infer<typeof segmentProposalSchema>;
export type CommunicationBriefStatus = z.infer<typeof communicationBriefStatusSchema>;
export type CommunicationBrief = z.infer<typeof communicationBriefSchema>;
export type EmailDraftStatus = z.infer<typeof emailDraftStatusSchema>;
export type EmailDraft = z.infer<typeof emailDraftSchema>;
export type PersonalizedDraftStatus = z.infer<typeof personalizedDraftStatusSchema>;
export type PersonalizedDraftVariant = z.infer<typeof personalizedDraftVariantSchema>;
export type PersonalizedEmailDraft = z.infer<typeof personalizedEmailDraftSchema>;
export type ImplementationChecklistStepStatus = z.infer<typeof implementationChecklistStepStatusSchema>;
export type ImplementationChecklistStatus = z.infer<typeof implementationChecklistStatusSchema>;
export type ImplementationChecklistStep = z.infer<typeof implementationChecklistStepSchema>;
export type ImplementationChecklist = z.infer<typeof implementationChecklistSchema>;
export type ImplementationAlertType = z.infer<typeof implementationAlertTypeSchema>;
export type ImplementationAlertSeverity = z.infer<typeof implementationAlertSeveritySchema>;
export type ImplementationAlertProgressState = z.infer<typeof implementationAlertProgressStateSchema>;
export type ImplementationAlert = z.infer<typeof implementationAlertSchema>;
export type ImplementationAlertsStatus = z.infer<typeof implementationAlertsStatusSchema>;
export type ImplementationAlerts = z.infer<typeof implementationAlertsSchema>;
export type ImplementationReportStatus = z.infer<typeof implementationReportStatusSchema>;
export type ImplementationReport = z.infer<typeof implementationReportSchema>;
export type AuditProductContextStatus = z.infer<typeof auditProductContextStatusSchema>;
export type AuditProductContext = z.infer<typeof auditProductContextSchema>;
export type ProductCoverageItemStatus = z.infer<typeof productCoverageItemStatusSchema>;
export type ProductCoverageAnalysisStatus = z.infer<typeof productCoverageAnalysisStatusSchema>;
export type ProductCoverageItem = z.infer<typeof productCoverageItemSchema>;
export type ProductCoverageAnalysis = z.infer<typeof productCoverageAnalysisSchema>;
export type CommunicationImprovementRecommendationStatus = z.infer<typeof communicationImprovementRecommendationStatusSchema>;
export type CommunicationImprovementRecommendationItem = z.infer<typeof communicationImprovementRecommendationItemSchema>;
export type CommunicationImprovementRecommendations = z.infer<typeof communicationImprovementRecommendationsSchema>;

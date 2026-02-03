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

export type GetOptimizationAreasSchema = z.infer<typeof getOptimizationAreasSchema>;
export type GetContextInsightsSchema = z.infer<typeof getContextInsightsSchema>;

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

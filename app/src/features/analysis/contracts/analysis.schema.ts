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

export type GetOptimizationAreasSchema = z.infer<typeof getOptimizationAreasSchema>;

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
export type ExpectedImpact = z.infer<typeof expectedImpactSchema>;
export type PriorityLevel = z.infer<typeof priorityLevelSchema>;
export type ConfidenceLevel = z.infer<typeof confidenceLevelSchema>;
export type OptimizationArea = z.infer<typeof optimizationAreaSchema>;

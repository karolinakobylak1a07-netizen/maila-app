import { z } from "zod";

export const clientStatusSchema = z.enum(["ACTIVE", "ARCHIVED"]);
export const userRoleSchema = z.enum([
  "OWNER",
  "STRATEGY",
  "CONTENT",
  "OPERATIONS",
]);
export const rbacModuleSchema = z.enum([
  "CLIENTS",
  "DISCOVERY",
  "AUDIT",
  "STRATEGY",
  "CONTENT",
  "IMPLEMENTATION",
  "REPORTING",
  "SETTINGS",
  "GOVERNANCE",
]);
export const DEFAULT_CLIENTS_PATH = "/clients";

const localClientViewPathPattern = /^\/clients(?:\/|$)/;

export const isAllowedClientViewPath = (value: string) =>
  localClientViewPathPattern.test(value);

export const normalizeClientViewPath = (value: string) =>
  isAllowedClientViewPath(value) ? value : DEFAULT_CLIENTS_PATH;

export const coerceClientViewPath = (value: string | null | undefined) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  return normalizeClientViewPath(value.trim());
};

export const clientProfileInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
});

export const clientProfileUpdateSchema = z.object({
  clientId: z.string().cuid(),
  name: z.string().trim().min(2).max(120),
});

export const archiveClientProfileSchema = z.object({
  clientId: z.string().cuid(),
});

const clientViewPathSchema = z
  .string()
  .trim()
  .min(1)
  .max(512)
  .transform(normalizeClientViewPath);

export const switchClientContextSchema = z.object({
  clientId: z.string().cuid(),
  lastViewPath: clientViewPathSchema.optional(),
});

export const createStrategicDecisionSchema = z.object({
  clientId: z.string().cuid(),
  content: z.string().trim().min(3).max(5000),
});

export const listStrategicDecisionsSchema = z.object({
  clientId: z.string().cuid(),
});

export const DISCOVERY_QUESTION_KEYS = [
  "goals",
  "segments",
  "seasonality",
  "offer",
  "targetAudience",
  "brandTone",
  "mainProducts",
  "currentChallenges",
  "currentFlows",
  "primaryKpis",
] as const;

export const REQUIRED_DISCOVERY_KEYS = [
  "goals",
  "segments",
  "seasonality",
  "offer",
] as const;

export type DiscoveryQuestionKey = (typeof DISCOVERY_QUESTION_KEYS)[number];
export type RequiredDiscoveryQuestionKey = (typeof REQUIRED_DISCOVERY_KEYS)[number];

const discoveryAnswerValueSchema = z.string().trim().max(5000).optional();

export const discoveryAnswersSchema = z.object({
  goals: discoveryAnswerValueSchema,
  segments: discoveryAnswerValueSchema,
  seasonality: discoveryAnswerValueSchema,
  offer: discoveryAnswerValueSchema,
  targetAudience: discoveryAnswerValueSchema,
  brandTone: discoveryAnswerValueSchema,
  mainProducts: discoveryAnswerValueSchema,
  currentChallenges: discoveryAnswerValueSchema,
  currentFlows: discoveryAnswerValueSchema,
  primaryKpis: discoveryAnswerValueSchema,
});

export const saveDiscoveryDraftSchema = z.object({
  clientId: z.string().cuid(),
  answers: discoveryAnswersSchema,
});

export const getDiscoveryStateSchema = z.object({
  clientId: z.string().cuid(),
});

export const completeDiscoverySchema = z.object({
  clientId: z.string().cuid(),
});

export const listRbacPoliciesSchema = z.object({
  role: userRoleSchema.optional(),
});

export const updateRbacPolicySchema = z.object({
  role: userRoleSchema,
  module: rbacModuleSchema,
  canView: z.boolean(),
  canEdit: z.boolean(),
  canManage: z.boolean(),
});

export type DiscoveryAnswersInput = z.infer<typeof discoveryAnswersSchema>;
export type ClientStatus = z.infer<typeof clientStatusSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;
export type RbacModule = z.infer<typeof rbacModuleSchema>;

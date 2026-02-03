import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

import {
  getGapReportSchema,
  getSyncStatusSchema,
  syncNowSchema,
  getOptimizationAreasSchema,
  getContextInsightsSchema,
  generateEmailStrategySchema,
  getLatestEmailStrategySchema,
  generateFlowPlanSchema,
  getLatestFlowPlanSchema,
  generateCampaignCalendarSchema,
  getLatestCampaignCalendarSchema,
  generateSegmentProposalSchema,
  getLatestSegmentProposalSchema,
  generateCommunicationBriefSchema,
  getLatestCommunicationBriefSchema,
  generateEmailDraftSchema,
  getLatestEmailDraftSchema,
  generatePersonalizedEmailDraftSchema,
  getLatestPersonalizedEmailDraftSchema,
  generateImplementationChecklistSchema,
  getLatestImplementationChecklistSchema,
  updateImplementationChecklistStepSchema,
  getImplementationAlertsSchema,
  getImplementationReportSchema,
  getAuditProductContextSchema,
  getProductCoverageAnalysisSchema,
  getCommunicationImprovementRecommendationsSchema,
} from "./contracts/analysis.schema";
import { assertSessionRole, mapAnalysisErrorToTRPC } from "./analysis.router.logic";
import { AnalysisService } from "./server/analysis.service";

type AnalysisServiceContract = Pick<
  AnalysisService,
  | "getGapReport"
  | "getSyncStatus"
  | "runSync"
  | "getOptimizationAreas"
  | "getContextInsights"
  | "generateEmailStrategy"
  | "getLatestEmailStrategy"
  | "generateFlowPlan"
  | "getLatestFlowPlan"
  | "generateCampaignCalendar"
  | "getLatestCampaignCalendar"
  | "generateSegmentProposal"
  | "getLatestSegmentProposal"
  | "generateCommunicationBrief"
  | "getLatestCommunicationBrief"
  | "generateEmailDraft"
  | "getLatestEmailDraft"
  | "generatePersonalizedEmailDraft"
  | "getLatestPersonalizedEmailDraft"
  | "generateImplementationChecklist"
  | "getLatestImplementationChecklist"
  | "updateImplementationChecklistStep"
  | "getImplementationAlerts"
  | "getImplementationReport"
  | "getAuditProductContext"
  | "getProductCoverageAnalysis"
  | "getCommunicationImprovementRecommendations"
>;

export const createAnalysisRouter = (
  analysisService: AnalysisServiceContract = new AnalysisService(),
) =>
  createTRPCRouter({
    getSyncStatus: protectedProcedure
      .input(getSyncStatusSchema)
      .query(async ({ ctx, input }) => {
        try {
          return await analysisService.getSyncStatus(
            ctx.session.user.id,
            assertSessionRole(ctx.session.user.role),
            input,
          );
        } catch (error) {
          mapAnalysisErrorToTRPC(error);
        }
      }),

    getGapReport: protectedProcedure
      .input(getGapReportSchema)
      .query(async ({ ctx, input }) => {
        try {
          return await analysisService.getGapReport(
            ctx.session.user.id,
            assertSessionRole(ctx.session.user.role) as "OWNER" | "STRATEGY",
            input,
          );
        } catch (error) {
          mapAnalysisErrorToTRPC(error);
        }
      }),

    syncNow: protectedProcedure
      .input(syncNowSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          const requestId = ctx.headers.get("x-request-id") ?? `local-${Date.now()}`;
          return await analysisService.runSync(
            ctx.session.user.id,
            assertSessionRole(ctx.session.user.role),
            {
              clientId: input.clientId,
              trigger: "MANUAL",
              requestId,
            },
          );
        } catch (error) {
          mapAnalysisErrorToTRPC(error);
        }
      }),

    getOptimizationAreas: protectedProcedure
      .input(getOptimizationAreasSchema)
      .query(async ({ ctx, input }) => {
        try {
          return await analysisService.getOptimizationAreas(
            ctx.session.user.id,
            assertSessionRole(ctx.session.user.role) as "OWNER" | "STRATEGY",
            {
              clientId: input.clientId ?? input.requestId ?? "000000000000000000000000",
              requestId: input.requestId,
              limit: input.limit,
              showPartialOnTimeout: input.showPartialOnTimeout,
            },
          );
        } catch (error) {
          mapAnalysisErrorToTRPC(error);
        }
      }),

    getContextInsights: protectedProcedure
      .input(getContextInsightsSchema)
      .query(async ({ ctx, input }) => {
        try {
          return await analysisService.getContextInsights(
            ctx.session.user.id,
            assertSessionRole(ctx.session.user.role) as "OWNER" | "STRATEGY",
            input,
          );
        } catch (error) {
          mapAnalysisErrorToTRPC(error);
        }
      }),

    generateEmailStrategy: protectedProcedure
      .input(generateEmailStrategySchema)
      .mutation(async ({ ctx, input }) => {
        try {
          return await analysisService.generateEmailStrategy(
            ctx.session.user.id,
            assertSessionRole(ctx.session.user.role) as "OWNER" | "STRATEGY",
            input,
          );
        } catch (error) {
          mapAnalysisErrorToTRPC(error);
        }
      }),

    getLatestEmailStrategy: protectedProcedure
      .input(getLatestEmailStrategySchema)
      .query(async ({ ctx, input }) => {
        try {
          return await analysisService.getLatestEmailStrategy(
            ctx.session.user.id,
            assertSessionRole(ctx.session.user.role) as "OWNER" | "STRATEGY",
            input,
          );
        } catch (error) {
          mapAnalysisErrorToTRPC(error);
        }
      }),

    generateFlowPlan: protectedProcedure
      .input(generateFlowPlanSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          return await analysisService.generateFlowPlan(
            ctx.session.user.id,
            assertSessionRole(ctx.session.user.role) as "OWNER" | "STRATEGY",
            input,
          );
        } catch (error) {
          mapAnalysisErrorToTRPC(error);
        }
      }),

    getLatestFlowPlan: protectedProcedure
      .input(getLatestFlowPlanSchema)
      .query(async ({ ctx, input }) => {
        try {
          return await analysisService.getLatestFlowPlan(
            ctx.session.user.id,
            assertSessionRole(ctx.session.user.role) as "OWNER" | "STRATEGY",
            input,
          );
        } catch (error) {
          mapAnalysisErrorToTRPC(error);
        }
      }),

    generateCampaignCalendar: protectedProcedure
      .input(generateCampaignCalendarSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          return await analysisService.generateCampaignCalendar(
            ctx.session.user.id,
            assertSessionRole(ctx.session.user.role) as "OWNER" | "STRATEGY",
            input,
          );
        } catch (error) {
          mapAnalysisErrorToTRPC(error);
        }
      }),

    getLatestCampaignCalendar: protectedProcedure
      .input(getLatestCampaignCalendarSchema)
      .query(async ({ ctx, input }) => {
        try {
          return await analysisService.getLatestCampaignCalendar(
            ctx.session.user.id,
            assertSessionRole(ctx.session.user.role) as "OWNER" | "STRATEGY",
            input,
          );
        } catch (error) {
          mapAnalysisErrorToTRPC(error);
        }
      }),

    generateSegmentProposal: protectedProcedure
      .input(generateSegmentProposalSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          return await analysisService.generateSegmentProposal(
            ctx.session.user.id,
            assertSessionRole(ctx.session.user.role) as "OWNER" | "STRATEGY",
            input,
          );
        } catch (error) {
          mapAnalysisErrorToTRPC(error);
        }
      }),

    getLatestSegmentProposal: protectedProcedure
      .input(getLatestSegmentProposalSchema)
      .query(async ({ ctx, input }) => {
        try {
          return await analysisService.getLatestSegmentProposal(
            ctx.session.user.id,
            assertSessionRole(ctx.session.user.role) as "OWNER" | "STRATEGY",
            input,
          );
        } catch (error) {
          mapAnalysisErrorToTRPC(error);
        }
      }),

    generateCommunicationBrief: protectedProcedure
      .input(generateCommunicationBriefSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          return await analysisService.generateCommunicationBrief(
            ctx.session.user.id,
            assertSessionRole(ctx.session.user.role) as "OWNER" | "CONTENT" | "STRATEGY",
            input,
          );
        } catch (error) {
          mapAnalysisErrorToTRPC(error);
        }
      }),

    getLatestCommunicationBrief: protectedProcedure
      .input(getLatestCommunicationBriefSchema)
      .query(async ({ ctx, input }) => {
        try {
          return await analysisService.getLatestCommunicationBrief(
            ctx.session.user.id,
            assertSessionRole(ctx.session.user.role) as "OWNER" | "CONTENT",
            input,
          );
        } catch (error) {
          mapAnalysisErrorToTRPC(error);
        }
      }),

    generateEmailDraft: protectedProcedure
      .input(generateEmailDraftSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          return await analysisService.generateEmailDraft(
            ctx.session.user.id,
            assertSessionRole(ctx.session.user.role) as "OWNER" | "CONTENT",
            input,
          );
        } catch (error) {
          mapAnalysisErrorToTRPC(error);
        }
      }),

    getLatestEmailDraft: protectedProcedure
      .input(getLatestEmailDraftSchema)
      .query(async ({ ctx, input }) => {
        try {
          return await analysisService.getLatestEmailDraft(
            ctx.session.user.id,
            assertSessionRole(ctx.session.user.role) as "OWNER" | "CONTENT",
            input,
          );
        } catch (error) {
          mapAnalysisErrorToTRPC(error);
        }
      }),

    generatePersonalizedEmailDraft: protectedProcedure
      .input(generatePersonalizedEmailDraftSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          return await analysisService.generatePersonalizedEmailDraft(
            ctx.session.user.id,
            assertSessionRole(ctx.session.user.role) as "OWNER" | "CONTENT",
            input,
          );
        } catch (error) {
          mapAnalysisErrorToTRPC(error);
        }
      }),

    getLatestPersonalizedEmailDraft: protectedProcedure
      .input(getLatestPersonalizedEmailDraftSchema)
      .query(async ({ ctx, input }) => {
        try {
          return await analysisService.getLatestPersonalizedEmailDraft(
            ctx.session.user.id,
            assertSessionRole(ctx.session.user.role) as "OWNER" | "CONTENT",
            input,
          );
        } catch (error) {
          mapAnalysisErrorToTRPC(error);
        }
      }),

    generateImplementationChecklist: protectedProcedure
      .input(generateImplementationChecklistSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          return await analysisService.generateImplementationChecklist(
            ctx.session.user.id,
            assertSessionRole(ctx.session.user.role) as "OWNER" | "OPERATIONS",
            input,
          );
        } catch (error) {
          mapAnalysisErrorToTRPC(error);
        }
      }),

    getLatestImplementationChecklist: protectedProcedure
      .input(getLatestImplementationChecklistSchema)
      .query(async ({ ctx, input }) => {
        try {
          return await analysisService.getLatestImplementationChecklist(
            ctx.session.user.id,
            assertSessionRole(ctx.session.user.role) as "OWNER" | "OPERATIONS",
            input,
          );
        } catch (error) {
          mapAnalysisErrorToTRPC(error);
        }
      }),

    updateImplementationChecklistStep: protectedProcedure
      .input(updateImplementationChecklistStepSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          return await analysisService.updateImplementationChecklistStep(
            ctx.session.user.id,
            assertSessionRole(ctx.session.user.role) as "OWNER" | "OPERATIONS",
            input,
          );
        } catch (error) {
          mapAnalysisErrorToTRPC(error);
        }
      }),

    getImplementationAlerts: protectedProcedure
      .input(getImplementationAlertsSchema)
      .query(async ({ ctx, input }) => {
        try {
          return await analysisService.getImplementationAlerts(
            ctx.session.user.id,
            assertSessionRole(ctx.session.user.role) as "OWNER" | "OPERATIONS",
            input,
          );
        } catch (error) {
          mapAnalysisErrorToTRPC(error);
        }
      }),

    getImplementationReport: protectedProcedure
      .input(getImplementationReportSchema)
      .query(async ({ ctx, input }) => {
        try {
          return await analysisService.getImplementationReport(
            ctx.session.user.id,
            assertSessionRole(ctx.session.user.role) as "OWNER" | "OPERATIONS",
            input,
          );
        } catch (error) {
          mapAnalysisErrorToTRPC(error);
        }
      }),

    getAuditProductContext: protectedProcedure
      .input(getAuditProductContextSchema)
      .query(async ({ ctx, input }) => {
        try {
          return await analysisService.getAuditProductContext(
            ctx.session.user.id,
            assertSessionRole(ctx.session.user.role) as "OWNER" | "STRATEGY",
            input,
          );
        } catch (error) {
          mapAnalysisErrorToTRPC(error);
        }
      }),

    getProductCoverageAnalysis: protectedProcedure
      .input(getProductCoverageAnalysisSchema)
      .query(async ({ ctx, input }) => {
        try {
          return await analysisService.getProductCoverageAnalysis(
            ctx.session.user.id,
            assertSessionRole(ctx.session.user.role) as "OWNER" | "STRATEGY",
            input,
          );
        } catch (error) {
          mapAnalysisErrorToTRPC(error);
        }
      }),

    getCommunicationImprovementRecommendations: protectedProcedure
      .input(getCommunicationImprovementRecommendationsSchema)
      .query(async ({ ctx, input }) => {
        try {
          return await analysisService.getCommunicationImprovementRecommendations(
            ctx.session.user.id,
            assertSessionRole(ctx.session.user.role) as "OWNER" | "STRATEGY",
            input,
          );
        } catch (error) {
          mapAnalysisErrorToTRPC(error);
        }
      }),
  });

export const analysisRouter = createAnalysisRouter();

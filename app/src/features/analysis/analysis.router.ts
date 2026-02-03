import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

import {
  getGapReportSchema,
  getSyncStatusSchema,
  syncNowSchema,
  getOptimizationAreasSchema,
} from "./contracts/analysis.schema";
import { assertSessionRole, mapAnalysisErrorToTRPC } from "./analysis.router.logic";
import { AnalysisService } from "./server/analysis.service";

type AnalysisServiceContract = Pick<
  AnalysisService,
  "getGapReport" | "getSyncStatus" | "runSync" | "getOptimizationAreas"
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
  });

export const analysisRouter = createAnalysisRouter();

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
          ) as unknown as never;
        } catch (error) {
          mapAnalysisErrorToTRPC(error);
          return null as never;
        }
      }),

    getGapReport: protectedProcedure
      .input(getGapReportSchema)
      .query(async ({ ctx, input }) => {
        try {
          return await analysisService.getGapReport(
            ctx.session.user.id,
            assertSessionRole(ctx.session.user.role),
            input,
          );
        } catch (error) {
          mapAnalysisErrorToTRPC(error);
          return null as never;
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
          return null as never;
        }
      }),

    getOptimizationAreas: protectedProcedure
      .input(getOptimizationAreasSchema)
      .query(async ({ ctx: _ctx, input }) => {
        try {
          return await analysisService.getOptimizationAreas({
            requestId: input.requestId,
            limit: input.limit,
            showPartialOnTimeout: input.showPartialOnTimeout,
          });
        } catch (error) {
          mapAnalysisErrorToTRPC(error);
          return null as never;
        }
      }),
  });

export const analysisRouter = createAnalysisRouter();

import { TRPCError } from "@trpc/server";

import { assertSessionRole } from "../../server/auth/session-role.ts";
import { AnalysisDomainError } from "./server/analysis.logic.ts";

export { assertSessionRole };

export const mapAnalysisErrorToTRPC = (error: unknown): never => {
  if (error instanceof AnalysisDomainError) {
    if (error.domainCode === "forbidden") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: error.message,
        cause: {
          details: error.details,
        },
      });
    }

    if (error.domainCode === "validation") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: error.message,
        cause: {
          details: error.details,
        },
      });
    }

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message,
      cause: {
        details: error.details,
      },
    });
  }

  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "ANALYSIS_UNHANDLED_ERROR",
  });
};

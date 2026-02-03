import { TRPCError } from "@trpc/server";

import { ClientDomainError, type Role } from "./server/clients.logic.ts";
import {
  assertSessionRole as assertBaseSessionRole,
  resolveSessionRole as resolveBaseSessionRole,
} from "../../server/auth/session-role.ts";

export const resolveSessionRole = (role: unknown): Role | null => {
  return resolveBaseSessionRole(role);
};

export const assertSessionRole = (role: unknown): Role => {
  return assertBaseSessionRole(role);
};

export const mapDomainErrorToTRPC = (error: unknown): never => {
  if (error instanceof ClientDomainError) {
    if (error.domainCode === "forbidden") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: error.message,
        cause: {
          details: error.details,
        },
      });
    }

    if (error.domainCode === "not_found") {
      throw new TRPCError({
        code: "NOT_FOUND",
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
    message: "CLIENTS_UNHANDLED_ERROR",
  });
};

import { TRPCError } from "@trpc/server";

export type SessionRole = "OWNER" | "STRATEGY" | "CONTENT" | "OPERATIONS";

export const resolveSessionRole = (role: unknown): SessionRole | null => {
  if (
    role === "OWNER" ||
    role === "STRATEGY" ||
    role === "CONTENT" ||
    role === "OPERATIONS"
  ) {
    return role;
  }

  return null;
};

export const assertSessionRole = (role: unknown): SessionRole => {
  const resolvedRole = resolveSessionRole(role);

  if (!resolvedRole) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "forbidden",
      cause: {
        details: {
          reason: "invalid_session_role",
        },
      },
    });
  }

  return resolvedRole;
};

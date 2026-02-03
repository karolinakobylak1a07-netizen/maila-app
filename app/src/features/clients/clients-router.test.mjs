import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { TRPCError } from "@trpc/server";

const routerLogicPath = pathToFileURL(
  path.resolve("src/features/clients/clients.router.logic.ts"),
).href;
const serviceLogicPath = pathToFileURL(
  path.resolve("src/features/clients/server/clients.logic.ts"),
).href;

const { assertSessionRole, mapDomainErrorToTRPC, resolveSessionRole } = await import(
  routerLogicPath
);
const { ClientDomainError } = await import(serviceLogicPath);
const routerSource = fs.readFileSync(
  path.resolve("src/features/clients/clients.router.ts"),
  "utf8",
);

test("clients router logic nie eskaluje nieznanej roli do OWNER", () => {
  assert.equal(resolveSessionRole("OWNER"), "OWNER");
  assert.equal(resolveSessionRole("STRATEGY"), "STRATEGY");
  assert.equal(resolveSessionRole("UNKNOWN"), null);
});

test("clients router logic odrzuca nieznana role kodem FORBIDDEN", () => {
  assert.throws(
    () => assertSessionRole("ALIEN"),
    (error) => {
      assert.ok(error instanceof TRPCError);
      assert.equal(error.code, "FORBIDDEN");
      assert.equal(error.message, "forbidden");
      assert.equal(error.cause?.details?.reason, "invalid_session_role");
      return true;
    },
  );
});

test("clients router logic mapuje ClientDomainError(forbidden) do TRPC FORBIDDEN", () => {
  const domainError = new ClientDomainError("forbidden", "forbidden", {
    reason: "membership_without_edit_permission",
  });

  assert.throws(
    () => mapDomainErrorToTRPC(domainError),
    (error) => {
      assert.ok(error instanceof TRPCError);
      assert.equal(error.code, "FORBIDDEN");
      assert.equal(error.message, "forbidden");
      assert.equal(
        error.cause?.details?.reason,
        "membership_without_edit_permission",
      );
      return true;
    },
  );
});

test("clients router logic zachowuje reason active_context_mismatch dla FORBIDDEN", () => {
  const domainError = new ClientDomainError("forbidden", "forbidden", {
    reason: "active_context_mismatch",
  });

  assert.throws(
    () => mapDomainErrorToTRPC(domainError),
    (error) => {
      assert.ok(error instanceof TRPCError);
      assert.equal(error.code, "FORBIDDEN");
      assert.equal(error.cause?.details?.reason, "active_context_mismatch");
      return true;
    },
  );
});

test("clients router logic mapuje validation na BAD_REQUEST", () => {
  const domainError = new ClientDomainError("validation", "DISCOVERY_INCOMPLETE", {
    missingFields: ["goals"],
  });

  assert.throws(
    () => mapDomainErrorToTRPC(domainError),
    (error) => {
      assert.ok(error instanceof TRPCError);
      assert.equal(error.code, "BAD_REQUEST");
      assert.equal(error.message, "DISCOVERY_INCOMPLETE");
      return true;
    },
  );
});

test("clients router logic mapuje nieznany blad do INTERNAL_SERVER_ERROR", () => {
  assert.throws(
    () => mapDomainErrorToTRPC(new Error("oops")),
    (error) => {
      assert.ok(error instanceof TRPCError);
      assert.equal(error.code, "INTERNAL_SERVER_ERROR");
      assert.equal(error.message, "CLIENTS_UNHANDLED_ERROR");
      return true;
    },
  );
});

test("clients router wymusza assertSessionRole dla listDecisions", () => {
  assert.match(
    routerSource,
    /listDecisions:[\s\S]*assertSessionRole\(ctx\.session\.user\.role\)/m,
  );
});

test("clients router wymusza assertSessionRole dla createDecision", () => {
  assert.match(
    routerSource,
    /createDecision:[\s\S]*assertSessionRole\(ctx\.session\.user\.role\)/m,
  );
});

test("clients router wymusza assertSessionRole dla discovery endpointow", () => {
  assert.match(
    routerSource,
    /getDiscoveryState:[\s\S]*assertSessionRole\(ctx\.session\.user\.role\)/m,
  );
  assert.match(
    routerSource,
    /saveDiscoveryDraft:[\s\S]*assertSessionRole\(ctx\.session\.user\.role\)/m,
  );
  assert.match(
    routerSource,
    /completeDiscovery:[\s\S]*assertSessionRole\(ctx\.session\.user\.role\)/m,
  );
});

test("clients router wymusza assertSessionRole dla RBAC endpointow", () => {
  assert.match(
    routerSource,
    /getRbacPolicies:[\s\S]*assertSessionRole\(ctx\.session\.user\.role\)/m,
  );
  assert.match(
    routerSource,
    /updateRbacPolicy:[\s\S]*assertSessionRole\(ctx\.session\.user\.role\)/m,
  );
});

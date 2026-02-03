import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { TRPCError } from "@trpc/server";

const logicPath = pathToFileURL(
  path.resolve("src/features/analysis/analysis.router.logic.ts"),
).href;
const serviceLogicPath = pathToFileURL(
  path.resolve("src/features/analysis/server/analysis.logic.ts"),
).href;

const { mapAnalysisErrorToTRPC } = await import(logicPath);
const { AnalysisDomainError } = await import(serviceLogicPath);
const routerSource = fs.readFileSync(
  path.resolve("src/features/analysis/analysis.router.ts"),
  "utf8",
);

test("analysis router mapuje forbidden na TRPC FORBIDDEN", () => {
  const domainError = new AnalysisDomainError("forbidden", "forbidden", {
    reason: "rbac_module_edit_forbidden",
  });

  assert.throws(
    () => mapAnalysisErrorToTRPC(domainError),
    (error) => {
      assert.ok(error instanceof TRPCError);
      assert.equal(error.code, "FORBIDDEN");
      assert.equal(error.cause?.details?.reason, "rbac_module_edit_forbidden");
      return true;
    },
  );
});

test("analysis router mapuje nieznany blad na INTERNAL_SERVER_ERROR", () => {
  assert.throws(
    () => mapAnalysisErrorToTRPC(new Error("boom")),
    (error) => {
      assert.ok(error instanceof TRPCError);
      assert.equal(error.code, "INTERNAL_SERVER_ERROR");
      assert.equal(error.message, "ANALYSIS_UNHANDLED_ERROR");
      return true;
    },
  );
});

test("analysis router wymusza assertSessionRole dla getSyncStatus", () => {
  assert.match(
    routerSource,
    /getSyncStatus:[\s\S]*assertSessionRole\(ctx\.session\.user\.role\)/m,
  );
});

test("analysis router wymusza assertSessionRole dla syncNow", () => {
  assert.match(
    routerSource,
    /syncNow:[\s\S]*assertSessionRole\(ctx\.session\.user\.role\)/m,
  );
});

test("analysis router wymusza assertSessionRole dla getGapReport", () => {
  assert.match(
    routerSource,
    /getGapReport:[\s\S]*assertSessionRole\(ctx\.session\.user\.role\)/m,
  );
});

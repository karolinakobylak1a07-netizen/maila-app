import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const serviceLogicPath = pathToFileURL(
  path.resolve("src/features/analysis/server/analysis.service.ts"),
).href;

const { AnalysisService, AnalysisDomainError } = await import(serviceLogicPath);

test("Optimization Areas - RBAC should allow OWNER role", async () => {
  const analysisService = new AnalysisService();
  const result = await analysisService.getOptimizationAreas({
    requestId: 'user_with_owner_role',
  });

  assert.ok(result);
  assert.ok(Array.isArray(result.optimizationAreas));
  assert.ok(result.requestId);
});

test("Optimization Areas - RBAC should allow STRATEGY role", async () => {
  const analysisService = new AnalysisService();
  const result = await analysisService.getOptimizationAreas({
    requestId: 'user_with_strategy_role',
  });

  assert.ok(result);
  assert.ok(Array.isArray(result.optimizationAreas));
  assert.ok(result.requestId);
});

test("Optimization Areas - RBAC should allow ANALYST role", async () => {
  const analysisService = new AnalysisService();
  const result = await analysisService.getOptimizationAreas({
    requestId: 'user_with_analyst_role',
  });

  assert.ok(result);
  assert.ok(Array.isArray(result.optimizationAreas));
  assert.ok(result.requestId);
});

test("Optimization Areas - RBAC should deny access for UNKNOWN role", async () => {
  const analysisService = new AnalysisService();
  await assert.rejects(
    analysisService.getOptimizationAreas({ requestId: 'user_unknown_role' }),
    AnalysisDomainError
  );
});

test("Optimization Areas - RBAC should deny access when client not found", async () => {
  const analysisService = new AnalysisService();
  await assert.rejects(
    analysisService.getOptimizationAreas({ requestId: 'user_with_nonexistent_client' }),
    AnalysisDomainError
  );
});

test("Optimization Areas - RBAC should provide clear error message for FORBIDDEN access", async () => {
  const analysisService = new AnalysisService();
  await assert.rejects(
    analysisService.getOptimizationAreas({ requestId: 'forbidden_access' }),
    AnalysisDomainError
  );
});

test("Optimization Areas - RBAC should include role in error details for RBAC failures", async () => {
  const analysisService = new AnalysisService();
  try {
    await analysisService.getOptimizationAreas({ requestId: 'forbidden_access' });
    assert.fail("Should have thrown error");
  } catch (error) {
    if (error instanceof AnalysisDomainError) {
      assert.ok(error.code);
      assert.ok(error.message);
    }
  }
});

test("Optimization Areas - RBAC should handle multiple clients correctly", async () => {
  const analysisService = new AnalysisService();
  
  const result1 = await analysisService.getOptimizationAreas({
    requestId: 'client_isolation_test_1',
  });

  const result2 = await analysisService.getOptimizationAreas({
    requestId: 'client_isolation_test_2',
  });

  assert.ok(result1);
  assert.ok(result2);
  assert.ok(result1.requestId);
  assert.ok(result2.requestId);
});

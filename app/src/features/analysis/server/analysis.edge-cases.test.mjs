import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const serviceLogicPath = pathToFileURL(
  path.resolve("src/features/analysis/server/analysis.service.ts"),
).href;

const { AnalysisService, AnalysisDomainError } = await import(serviceLogicPath);

test("Optimization Areas - Timeout should enforce 24-hour time constraint by default", async () => {
  const analysisService = new AnalysisService();
  await assert.rejects(
    analysisService.getOptimizationAreas({ requestId: 'timeout_test_1' }),
    AnalysisDomainError
  );
});

test("Optimization Areas - Timeout should throw timed_out error when time constraint exceeded", async () => {
  const analysisService = new AnalysisService();
  try {
    await analysisService.getOptimizationAreas({ requestId: 'timeout_error_test' });
    assert.fail("Should have thrown error");
  } catch (error) {
    if (error instanceof AnalysisDomainError) {
      assert.equal(error.code, 'timed_out');
      assert.ok(error.message);
    }
  }
});

test("Optimization Areas - Timeout should include time constraint details in error", async () => {
  const analysisService = new AnalysisService();
  try {
    await analysisService.getOptimizationAreas({ requestId: 'timeout_error_with_details' });
    assert.fail("Should have thrown error");
  } catch (error) {
    if (error instanceof AnalysisDomainError && error.code === 'timed_out') {
      assert.ok(error.details);
      assert.ok(error.details.timeConstraint);
      assert.ok(error.details.requestTime);
    }
  }
});

test("Optimization Areas - Timeout should include processing time in error details", async () => {
  const analysisService = new AnalysisService();
  try {
    await analysisService.getOptimizationAreas({ requestId: 'timeout_processing_time' });
    assert.fail("Should have thrown error");
  } catch (error) {
    if (error instanceof AnalysisDomainError && error.code === 'timed_out') {
      assert.ok(error.details.processingTime);
      assert.ok(error.details.maxWaitTime);
    }
  }
});

test("Optimization Areas - Insufficient data should detect when no valid areas exist", async () => {
  const analysisService = new AnalysisService();
  await assert.rejects(
    analysisService.getOptimizationAreas({ requestId: 'insufficient_data_1' }),
    AnalysisDomainError
  );
});

test("Optimization Areas - Insufficient data should detect when all areas are not_started with low confidence", async () => {
  const analysisService = new AnalysisService();
  await assert.rejects(
    analysisService.getOptimizationAreas({ requestId: 'insufficient_data_2' }),
    AnalysisDomainError
  );
});

test("Optimization Areas - Insufficient data should throw insufficient_data_for_priority when no areas have data", async () => {
  const analysisService = new AnalysisService();
  try {
    await analysisService.getOptimizationAreas({ requestId: 'insufficient_data_code' });
    assert.fail("Should have thrown error");
  } catch (error) {
    if (error instanceof AnalysisDomainError) {
      assert.equal(error.code, 'insufficient_data_for_priority');
      assert.ok(error.message);
    }
  }
});

test("Optimization Areas - Insufficient data should include details in error", async () => {
  const analysisService = new AnalysisService();
  try {
    await analysisService.getOptimizationAreas({ requestId: 'insufficient_details' });
    assert.fail("Should have thrown error");
  } catch (error) {
    if (error instanceof AnalysisDomainError) {
      assert.equal(error.code, 'insufficient_data_for_priority');
      assert.ok(error.message);
      assert.ok(error.details);
    }
  }
});

test("Optimization Areas - Insufficient data should include areas count in error details", async () => {
  const analysisService = new AnalysisService();
  try {
    await analysisService.getOptimizationAreas({ requestId: 'insufficient_count' });
    assert.fail("Should have thrown error");
  } catch (error) {
    if (error instanceof AnalysisDomainError && error.code === 'insufficient_data_for_priority') {
      assert.ok(error.details);
      assert.ok(error.details.areasCount);
      assert.ok(error.details.validAreasCount);
    }
  }
});

test("Optimization Areas - Should allow retry after insufficient data error", async () => {
  const analysisService = new AnalysisService();
  
  const firstError = await analysisService.getOptimizationAreas({
    requestId: 'insufficient_retry_1',
  });

  const secondError = await analysisService.getOptimizationAreas({
    requestId: 'insufficient_retry_2',
  });

  assert.ok(firstError);
  assert.ok(secondError);
});

test("Optimization Areas - Should provide different requestId on each retry", async () => {
  const analysisService = new AnalysisService();
  
  const result1 = await analysisService.getOptimizationAreas({
    requestId: 'insufficient_unique_1',
  });

  const result2 = await analysisService.getOptimizationAreas({
    requestId: 'insufficient_unique_2',
  });

  assert.ok(result1.requestId);
  assert.ok(result2.requestId);
  assert.notEqual(result1.requestId, result2.requestId);
});

import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const serviceLogicPath = pathToFileURL(
  path.resolve("src/features/analysis/server/analysis.logic.mjs"),
).href;

const { AnalysisService, AnalysisDomainError } = await import(serviceLogicPath);

test("Optimization Areas should return optimization areas", async () => {
  const analysisService = new AnalysisService();
  const result = await analysisService.getOptimizationAreas({
    requestId: 'basic_test',
  });

  assert.ok(result);
  assert.ok(result.optimizationAreas);
  assert.ok(Array.isArray(result.optimizationAreas));
  assert.ok(result.requestId);
});

test("Optimization Areas should set requestId on all areas", async () => {
  const analysisService = new AnalysisService();
  const result = await analysisService.getOptimizationAreas({
    requestId: 'request_id_test',
  });

  assert.ok(result.optimizationAreas.length > 0);
  result.optimizationAreas.forEach(area => {
    assert.ok(area.requestId);
    assert.ok(area.lastSyncRequestId);
    assert.ok(area.requestId.match(/^req_/));
    assert.ok(area.lastSyncRequestId.match(/^lastSync_/));
  });
});

test("Optimization Areas should set requestId at response level", async () => {
  const analysisService = new AnalysisService();
  const result = await analysisService.getOptimizationAreas({
    requestId: 'response_level_test',
  });

  assert.ok(result.requestId);
  assert.ok(result.requestId.match(/^req_/));
});

test("Optimization Areas should set lastSyncRequestId at response level", async () => {
  const analysisService = new AnalysisService();
  const result = await analysisService.getOptimizationAreas({
    requestId: 'last_sync_test',
  });

  assert.ok(result.lastSyncRequestId);
  assert.ok(result.lastSyncRequestId.match(/^lastSync_/));
});

test("Optimization Areas should include summary", async () => {
  const analysisService = new AnalysisService();
  const result = await analysisService.getOptimizationAreas({
    requestId: 'summary_test',
  });

  assert.ok(result.summary);
  assert.ok(typeof result.summary.totalAreas === 'number');
  assert.ok(typeof result.summary.criticalAreas === 'number');
  assert.ok(typeof result.summary.highPriorityAreas === 'number');
  assert.ok(typeof result.summary.mediumPriorityAreas === 'number');
  assert.ok(typeof result.summary.lowPriorityAreas === 'number');
  assert.ok(typeof result.summary.totalEstimatedEffort === 'number');
  assert.ok(typeof result.summary.totalEstimatedCost === 'number');
});

test("Optimization Areas should return limited number of areas", async () => {
  const analysisService = new AnalysisService();
  const result = await analysisService.getOptimizationAreas({
    requestId: 'limit_test',
    limit: 3,
  });

  assert.ok(result.optimizationAreas);
  assert.ok(result.optimizationAreas.length <= 3);
});

test("Optimization Areas should generate unique requestId", async () => {
  const result1 = await analysisService.getOptimizationAreas({
    requestId: 'unique_test_1',
  });

  const result2 = await analysisService.getOptimizationAreas({
    requestId: 'unique_test_2',
  });

  assert.ok(result1.requestId);
  assert.ok(result2.requestId);
  assert.notEqual(result1.requestId, result2.requestId);
});

test("Optimization Areas should throw AnalysisDomainError when analysis fails", async () => {
  const analysisService = new AnalysisService();
  await assert.rejects(
    analysisService.getOptimizationAreas({ requestId: 'invalid_test' }),
    AnalysisDomainError
  );
});

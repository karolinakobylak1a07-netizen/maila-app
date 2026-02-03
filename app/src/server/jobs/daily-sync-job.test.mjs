import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const modulePath = pathToFileURL(path.resolve("src/server/jobs/daily-sync-job.ts")).href;
const { runDailySyncJob } = await import(modulePath);

test("daily sync job deleguje do AnalysisService", async () => {
  let calledWith = null;

  const fakeService = {
    runDailySyncForAllClients: async (requestId) => {
      calledWith = requestId;
      return { data: { totalClients: 0, results: [] } };
    },
  };

  const result = await runDailySyncJob(fakeService);
  assert.equal(result.data.totalClients, 0);
  assert.equal(typeof calledWith, "string");
  assert.match(calledWith, /^daily-/);
});

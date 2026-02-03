import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const modulePath = pathToFileURL(path.resolve("src/server/jobs/manual-sync-job.ts")).href;
const { runManualSyncJob } = await import(modulePath);

test("manual sync job przekazuje trigger MANUAL do AnalysisService", async () => {
  let calledPayload = null;

  const fakeService = {
    runSync: async (_actorId, _role, payload) => {
      calledPayload = payload;
      return { data: { status: "OK", requestId: payload.requestId } };
    },
  };

  const result = await runManualSyncJob(
    { clientId: "client-1", actorId: "user-1", role: "OWNER" },
    fakeService,
  );

  assert.equal(result.data.status, "OK");
  assert.equal(calledPayload.trigger, "MANUAL");
  assert.match(calledPayload.requestId, /^manual-/);
});

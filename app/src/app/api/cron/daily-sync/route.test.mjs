import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(
  path.resolve("src/app/api/cron/daily-sync/route.ts"),
  "utf8",
);

test("cron route wymusza obecny CRON_SHARED_SECRET", () => {
  assert.match(source, /if \(!cronSecret \|\| cronSecret\.trim\(\)\.length === 0\)/);
  assert.match(source, /cron_secret_missing/);
});

test("cron route nie eksportuje GET = POST", () => {
  assert.doesNotMatch(source, /export const GET = POST/);
});

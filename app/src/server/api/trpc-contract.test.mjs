import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const filePath = path.resolve("src/server/api/trpc.ts");

test("trpc error formatter zawiera requestId contract", () => {
  const source = fs.readFileSync(filePath, "utf8");

  assert.match(source, /x-request-id/);
  assert.match(source, /requestId/);
  assert.match(source, /errorFormatter/);
});

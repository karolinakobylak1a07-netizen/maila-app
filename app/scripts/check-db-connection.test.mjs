import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scriptPath = path.join(__dirname, "check-db-connection.mjs");

function runWithEnv(extraEnv) {
  return spawnSync(process.execPath, [scriptPath], {
    env: { ...process.env, ...extraEnv },
    encoding: "utf8",
  });
}

test("zwraca kontrakt bledu z requestId gdy DATABASE_URL nie jest ustawione", () => {
  const result = runWithEnv({ DATABASE_URL: "" });

  assert.equal(result.status, 1);
  const output = JSON.parse(result.stderr);
  assert.equal(output.error.code, "DB_CONNECTION_ERROR");
  assert.match(output.error.requestId, /^[0-9a-f-]{36}$/i);
  assert.match(output.error.details.hint, /DATABASE_URL/);
});

test("blokuje nieobslugiwany protokol", () => {
  const result = runWithEnv({ DATABASE_URL: "mysql://root:pass@localhost:3306/app" });

  assert.equal(result.status, 1);
  const output = JSON.parse(result.stderr);
  assert.equal(output.error.code, "DB_CONNECTION_ERROR");
  assert.equal(output.error.details.protocol, "mysql:");
});

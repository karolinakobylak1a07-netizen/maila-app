import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const modulePath = pathToFileURL(
  path.resolve("src/server/integrations/klaviyo/klaviyo-adapter.ts"),
).href;

const { KlaviyoAdapter, KlaviyoAdapterError } = await import(modulePath);

const createResponse = (status, data = []) =>
  new Response(JSON.stringify({ data }), {
    status,
    headers: { "content-type": "application/json" },
  });

test("klaviyo adapter zwraca partial_or_timeout dla odpowiedzi 429", async () => {
  const originalFetch = globalThis.fetch;
  const originalApiKey = process.env.KLAVIYO_API_KEY;

  process.env.KLAVIYO_API_KEY = "test-key";
  globalThis.fetch = async () => createResponse(429, []);

  try {
    const adapter = new KlaviyoAdapter();
    await assert.rejects(
      () => adapter.fetchInventory("client-1"),
      (error) => {
        assert.ok(error instanceof KlaviyoAdapterError);
        assert.equal(error.code, "partial_or_timeout");
        return true;
      },
    );
  } finally {
    globalThis.fetch = originalFetch;
    process.env.KLAVIYO_API_KEY = originalApiKey;
  }
});

test("klaviyo adapter zwraca failed_auth dla 401", async () => {
  const originalFetch = globalThis.fetch;
  const originalApiKey = process.env.KLAVIYO_API_KEY;

  process.env.KLAVIYO_API_KEY = "test-key";
  globalThis.fetch = async () => createResponse(401, []);

  try {
    const adapter = new KlaviyoAdapter();
    await assert.rejects(
      () => adapter.fetchInventory("client-1"),
      (error) => {
        assert.ok(error instanceof KlaviyoAdapterError);
        assert.equal(error.code, "failed_auth");
        return true;
      },
    );
  } finally {
    globalThis.fetch = originalFetch;
    process.env.KLAVIYO_API_KEY = originalApiKey;
  }
});

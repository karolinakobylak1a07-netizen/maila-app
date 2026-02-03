import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const filePath = path.resolve("src/server/auth/config.ts");

test("konfiguracja auth uzywa NextAuth v4 i PrismaAdapter", () => {
  const source = fs.readFileSync(filePath, "utf8");

  assert.match(source, /next-auth/);
  assert.match(source, /next-auth\/providers\/discord/);
  assert.match(source, /PrismaAdapter/);
});

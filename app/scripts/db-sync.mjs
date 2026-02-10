#!/usr/bin/env node

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { config as loadEnv } from "dotenv";

loadEnv();

const execFileAsync = promisify(execFile);

const run = async (cmd, args, options = {}) => {
  try {
    const { stdout, stderr } = await execFileAsync(cmd, args, options);
    return { ok: true, stdout, stderr };
  } catch (error) {
    return {
      ok: false,
      stdout: error.stdout || "",
      stderr: error.stderr || error.message || "",
      error,
    };
  }
};

const logSection = (title) => {
  console.log(`\n=== ${title} ===`);
};

const main = async () => {
  logSection("DB Connection");
  const dbCheck = await run("node", ["scripts/check-db-connection.mjs"]);
  if (!dbCheck.ok) {
    console.error(dbCheck.stdout || dbCheck.stderr);
    process.exit(1);
  }
  console.log("OK: polaczenie z baza dziala.");

  logSection("Prisma Migrate Status");
  const status = await run("npx", ["prisma", "migrate", "status", "--schema", "prisma/schema.prisma", "--json"]);
  if (!status.ok) {
    console.error(status.stdout || status.stderr);
    process.exit(1);
  }

  let parsed;
  try {
    parsed = JSON.parse(status.stdout);
  } catch (error) {
    console.log(status.stdout);
    console.error("Nie udalo sie sparsowac JSON z prisma migrate status.");
    process.exit(1);
  }

  const driftDetected = Boolean(parsed.driftDetected);
  const hasPending = Boolean(parsed.hasPendingMigrations);
  const dbBehind = Boolean(parsed.databaseIsBehind);

  if (!driftDetected && !hasPending && !dbBehind) {
    console.log("OK: baza zgodna z migracjami.");
    return;
  }

  console.log("Wykryto niespojnosc schematu:");
  console.log(
    JSON.stringify(
      {
        driftDetected,
        hasPendingMigrations: hasPending,
        databaseIsBehind: dbBehind,
      },
      null,
      2,
    ),
  );

  console.log("\nZalecenia:");
  console.log("- Jesli baza jest testowa: uruchom `npx prisma migrate reset` (utrata danych).");
  console.log("- Jesli baza zawiera dane: NIE resetuj. Dodaj brakujace zmiany recznie (ALTER TABLE) lub przygotuj bezpieczna migracje SQL.");
  console.log("- Po zmianach zawsze uruchom `npx prisma generate`.");

  process.exit(2);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

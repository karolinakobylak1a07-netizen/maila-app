#!/usr/bin/env node

import net from "node:net";
import { randomUUID } from "node:crypto";
import { config as loadEnv } from "dotenv";

loadEnv();

const requestId = randomUUID();
const databaseUrl = process.env.DATABASE_URL;

const fail = (message, details = {}) => {
  console.error(
    JSON.stringify(
      {
        error: {
          code: "DB_CONNECTION_ERROR",
          message,
          details,
          requestId,
        },
      },
      null,
      2,
    ),
  );
  process.exit(1);
};

if (!databaseUrl) {
  fail("Brak zmiennej DATABASE_URL.", {
    hint: "Ustaw DATABASE_URL w pliku .env.",
  });
}

let parsed;
try {
  parsed = new URL(databaseUrl);
} catch {
  fail("DATABASE_URL ma niepoprawny format.", {
    hint: "Sprawdz format URL i wartosc DATABASE_URL w .env.",
  });
}

if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
  fail("Nieobslugiwany protokol bazy danych.", {
    protocol: parsed.protocol,
    hint: "Uzyj polaczenia PostgreSQL w DATABASE_URL.",
  });
}

const host = parsed.hostname;
const port = Number(parsed.port || 5432);

const socket = net.createConnection({ host, port, timeout: 4000 });

socket.on("connect", () => {
  socket.end();
});

socket.on("timeout", () => {
  socket.destroy();
  fail("Przekroczono czas oczekiwania na polaczenie z baza.", {
    host,
    port,
    hint: "Uruchom baze i sprawdz DATABASE_URL w .env.",
  });
});

socket.on("error", (error) => {
  fail("Nie mozna nawiazac polaczenia z baza.", {
    host,
    port,
    cause: error.message || "Unknown connection error",
    hint: "Sprawdz uruchomienie bazy oraz poprawna konfiguracje DATABASE_URL w .env.",
  });
});

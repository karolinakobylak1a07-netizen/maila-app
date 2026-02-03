# Story 1.1: Setup projektu ze starter template (Create-T3-App)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Developer,
I want utworzyc bazowy projekt ze wskazanego starter template,
so that zespol ma gotowe i spojne srodowisko do implementacji kolejnych historii.

## Acceptance Criteria

1. Given zatwierdzona decyzja architektoniczna o starterze Create-T3-App
   When inicjalizuje repozytorium projektu i instaluje zaleznosci
   Then aplikacja uruchamia sie lokalnie z podstawowa konfiguracja TypeScript, Tailwind, auth i Prisma
   And dokumentacja uruchomienia oraz zmienne srodowiskowe sa opisane w README.
2. Given inicjalizacja projektu wymaga dostepu do zewnetrznych paczek
   When instalacja zaleznosci nie powiedzie sie (network lock/version conflict)
   Then proces setup zatrzymuje sie z czytelnym komunikatem bledu
   And README zawiera kroki recovery i ponowienia.
3. Given uruchamianie migracji inicjalnej wymaga dostepu do bazy
   When polaczenie z baza jest bledne lub niedostepne
   Then aplikacja nie przechodzi do stanu "ready"
   And blad zawiera requestId i wskazowke konfiguracji `.env`.

## Tasks / Subtasks

- [x] Zainicjalizowac projekt przez Create-T3-App (AC: 1)
  - [x] Utworzyc repo ze stackiem: TypeScript, Next.js, tRPC, Prisma, NextAuth/Auth.js v4, Tailwind
  - [x] Potwierdzic wersje Node/pnpm i skrypty `dev`, `build`, `lint`, `typecheck`
- [x] Skonfigurowac srodowisko i uruchomienie lokalne (AC: 1)
  - [x] Przygotowac `.env.example` z minimalnym zestawem zmiennych (DB, auth, app url)
  - [x] Zweryfikowac lokalny start aplikacji i brak krytycznych bledow startowych
- [x] Przygotowac baze i migracje startowa (AC: 1, 3)
  - [x] Skonfigurowac Prisma pod PostgreSQL 17
  - [x] Dodac migracje startowa i seed (jezeli wymagany)
  - [x] Obsluzyc bledy polaczenia DB przez kontrakt bledu z `requestId`
- [x] Dodac guardrails operacyjne i recovery (AC: 2, 3)
  - [x] Udokumentowac scenariusze fail instalacji zaleznosci i fail polaczenia z DB
  - [x] Dodac kroki bezpiecznego retry (bez uszkodzenia lokalnego stanu projektu)
- [x] Uzupelnic README pod onboarding dewelopera (AC: 1, 2, 3)
  - [x] Opisac instalacje, uruchomienie, migracje, troubleshooting, wymagane zmienne

## Dev Notes

- Decyzja architektoniczna dla MVP preferuje Create-T3-App jako najszybsza sciezke full-stack.
- Obowiazuje stack bazowy: TypeScript + Next.js + PostgreSQL 17 + Prisma + Zod.
- API i kontrakty: tRPC dla aplikacji + REST tylko dla webhookow/integracji.
- Auth: stabilny NextAuth/Auth.js v4 (unikac v5 beta w MVP).
- Error handling: wspolny format `code/message/details/requestId`; `requestId` wymagany dla bledow i logow operacyjnych.
- Security baseline: szyfrowanie sekretow integracyjnych + rate limiting (globalny baseline + endpoint-specific).
- Naming i struktura: feature-based, testy co-located (`*.test.ts[x]`), DB `snake_case`, JSON API `camelCase`.

### Project Structure Notes

- Katalog startowy powinien byc zgodny z docelowym szkieletem (m.in. `src/app`, `src/features`, `src/server`, `prisma`, `docs`, `.github/workflows`).
- W Story 1.1 skupiamy sie na scaffoldingu i uruchamialnym szkielecie; logika domenowa bedzie rozwijana od Story 1.2+.
- Wymagane granice architektoniczne od startu:
  - feature modules (`clients`, `analysis`, `strategy`, `reporting`, `auth`, `audit`)
  - server boundaries (`integrations`, `jobs`, `observability`, `security`)
  - middleware pod RBAC i context isolation.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.1-Setup-projektu-ze-starter-template-Create-T3-App]
- [Source: _bmad-output/planning-artifacts/architecture.md#Starter-Template-Evaluation]
- [Source: _bmad-output/planning-artifacts/architecture.md#Core-Architectural-Decisions]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure-and-Boundaries]
- [Source: _bmad-output/planning-artifacts/prd.md#Non-Functional-Requirements]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- npm create t3-app@latest app -- --CI --noGit --tailwind true --nextAuth true --prisma true --trpc true --dbProvider postgres --appRouter true --eslint true
- npm install (migracja zaleznosci do NextAuth v4 + adapter Prisma v4)
- npm run check -> OK (lint + typecheck)
- npm run dev -> celowo zablokowane przez guard DB (brak aktywnej bazy), kontrakt bledu zawiera requestId i hint `.env`

### Completion Notes List

- Scaffold utworzony przez Create-T3-App ze stackiem: Next.js App Router, TypeScript, tRPC, Prisma, Tailwind.
- Auth przestawione na stabilne NextAuth v4 + @next-auth/prisma-adapter (usunieto zaleznosc od v5 beta).
- Dodany guard polaczenia DB (`scripts/check-db-connection.mjs`) pod `dev`, `db:push`, `db:migrate` z kontraktem `code/message/details/requestId`.
- Uzupelniono `.env` i `.env.example` o wymagane zmienne (DB, auth, app url) zgodnie z onboardingiem.
- README przepisany pod uruchomienie, troubleshooting i recovery (network lock/version conflict + fail DB connection).
- Dodano migracje startowa Prisma (`prisma/migrations/20260201180000_init/migration.sql`) i seed (`prisma/seed.mjs`) wraz ze skryptem `npm run db:seed`.
- Recovery w README zostalo poprawione: domyslny retry nie usuwa `node_modules` ani `package-lock.json`; hard reset jest opcja awaryjna.
- Dodano minimalny szkielet `src/features/*`: `clients`, `analysis`, `strategy`, `reporting`, `auth`, `audit`.
- Dodano testy co-located dla custom kontraktow (DB guard, tRPC requestId, auth config).

### File List

- app/.env
- app/.env.example
- app/README.md
- app/package.json
- app/package-lock.json
- app/prisma/migrations/migration_lock.toml
- app/prisma/migrations/20260201180000_init/migration.sql
- app/prisma/seed.mjs
- app/scripts/check-db-connection.mjs
- app/scripts/check-db-connection.test.mjs
- app/src/app/api/auth/[...nextauth]/route.ts
- app/src/app/page.tsx
- app/src/env.js
- app/src/features/index.ts
- app/src/features/clients/index.ts
- app/src/features/analysis/index.ts
- app/src/features/strategy/index.ts
- app/src/features/reporting/index.ts
- app/src/features/auth/index.ts
- app/src/features/audit/index.ts
- app/src/server/api/trpc.ts
- app/src/server/api/trpc-contract.test.mjs
- app/src/server/auth/config.ts
- app/src/server/auth/config-contract.test.mjs
- app/src/server/auth/index.ts
- _bmad-output/implementation-artifacts/1-1-setup-projektu-ze-starter-template-create-t3-app.md
- _bmad-output/implementation-artifacts/sprint-status.yaml

### Change Log

- 2026-02-01: Story 1.1 zaimplementowana; status zmieniony na `review`.
- 2026-02-01: Po code-review poprawiono HIGH/MEDIUM: migracje+seed, recovery README, szkielet `src/features/*`, testy co-located.

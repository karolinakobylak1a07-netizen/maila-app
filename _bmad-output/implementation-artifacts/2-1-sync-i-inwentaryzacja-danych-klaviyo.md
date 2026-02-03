# Story 2.1: Sync i inwentaryzacja danych Klaviyo

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Strategy & Insight Lead,
I want uruchomic sync danych Klaviyo na poziomie konto, flow, email i formularze,
so that mam kompletny obraz obecnej konfiguracji klienta.

## Acceptance Criteria

1. Given klient ma skonfigurowana integracje Klaviyo
   When uruchamiany jest sync manualny lub dzienny
   Then system pobiera elementy konto/flow/email/formularze i zapisuje ich status
   And data i wynik ostatniej synchronizacji sa logowane.
2. Given token API Klaviyo jest wygasniety lub niepoprawny
   When uruchamiany jest sync
   Then system oznacza sync jako "failed_auth"
   And nie nadpisuje poprzednio poprawnie zsynchronizowanych danych.
3. Given sync trwa dluzej niz dozwolony czas operacji
   When przekroczony zostanie timeout zadania
   Then system oznacza sync jako "partial_or_timeout" z requestId
   And pozwala na bezpieczny retry bez duplikowania rekordow.

## Tasks / Subtasks

- [x] Przygotowac kontrakty i model danych dla inwentaryzacji Klaviyo (AC: 1, 2, 3)
  - [x] Dodac/uzupelnic kontrakty Zod dla statusu sync (`ok`, `failed_auth`, `partial_or_timeout`) i metadanych wyniku
  - [x] Zaprojektowac przechowanie `lastSyncAt`, `lastSyncStatus`, `requestId` oraz snapshotu elementow konto/flow/email/form
  - [x] Zapewnic idempotentne upserty, aby retry nie tworzyl duplikatow
- [x] Zaimplementowac serwis sync i adapter Klaviyo (AC: 1, 2, 3)
  - [x] Rozszerzyc `server/integrations/klaviyo/*` o pobieranie danych konto/flow/email/form z mapowaniem na model domenowy
  - [x] Dodac mapowanie bledow integracji na wspolny envelope (`code/message/details/requestId`)
  - [x] Obsluzyc scenariusze auth failure i timeout/partial bez nadpisania poprzednich poprawnych danych
- [x] Podpiac orchestration manual + daily sync (AC: 1)
  - [x] Dodac/rozszerzyc job manualny i dzienny (`server/jobs/manual-sync-job.ts`, `server/jobs/daily-sync-job.ts`)
  - [x] Zapewnic logowanie start/koniec/wynik sync z `requestId`
  - [x] Utrzymac zgodnosc z triggerem cron (`/api/cron/daily-sync`)
- [x] Udostepnic status sync w warstwie API i UI (AC: 1, 2, 3)
  - [x] Dodac endpoint/procedure do odczytu statusu ostatniej synchronizacji i inwentaryzacji
  - [x] W widoku audit pokazac status sync, timestamp i komunikat stale/error z retry
  - [x] Dla `failed_auth` pokazac jasny komunikat diagnostyczny bez ujawniania sekretow
- [x] Pokryc testami krytyczne sciezki (AC: 1, 2, 3)
  - [x] Testy serwisu/adaptora: happy path, expired token, timeout + retry idempotent
  - [x] Testy router/API envelope: `requestId` i poprawne mapowanie kodow bledow
  - [x] Testy jobow: manual + daily oraz logowanie wyniku ostatniego sync

### Review Follow-ups (AI)

- [x] [AI-Review][HIGH] Wymusic autoryzacje endpointu cron niezaleznie od konfiguracji (`CRON_SHARED_SECRET`) oraz odrzucac uruchomienie bez sekretu. [app/src/app/api/cron/daily-sync/route.ts:13]
- [x] [AI-Review][MEDIUM] Usunac `GET = POST` dla endpointu mutujacego stan i pozostawic wywolanie tylko przez `POST`. [app/src/app/api/cron/daily-sync/route.ts:26]
- [x] [AI-Review][HIGH] Traktowac odpowiedzi HTTP 4xx (np. 429/400) z Klaviyo jako blad sync (`partial_or_timeout`) zamiast sukcesu `OK`. [app/src/server/integrations/klaviyo/klaviyo-adapter.ts:130]
- [x] [AI-Review][MEDIUM] Usunac bezposredni import z innego feature (`analysis -> clients`) i przeniesc `assertSessionRole` do wspolnego modułu granicznego. [app/src/features/analysis/analysis.router.logic.ts:3]
- [x] [AI-Review][MEDIUM] Uzgodnic Story File List z rzeczywistym stanem repo (sa dodatkowe zmienione pliki nieodnotowane w historii). [_bmad-output/implementation-artifacts/2-1-sync-i-inwentaryzacja-danych-klaviyo.md:150]

## Dev Notes

- To jest pierwsza historia Epic 2, wiec musi przygotowac stabilny fundament pod Story 2.2-2.4 (raport luk, weak spots, insighty).
- Trzymaj granice architektury: feature-first, adaptery zewnetrzne w `server/integrations/*`, orchestracja w `server/jobs/*`, kontrakty przy punktach wejscia.
- Wymagana jest spojnosc bledow i logow: zawsze `code/message/details/requestId`.
- Integracja nie jest realtime: dane odswiezane manualnie lub codziennym sync, z jawnym `lastSyncAt` i `lastSyncStatus`.
- Dla timeoutow i retry priorytetem jest bezpieczenstwo danych: brak duplikatow i brak utraty ostatniego poprawnego stanu.

### Project Structure Notes

- Preferowane miejsca zmian:
  - `app/src/server/integrations/klaviyo/*`
  - `app/src/server/jobs/manual-sync-job.ts`
  - `app/src/server/jobs/daily-sync-job.ts`
  - `app/src/features/analysis/server/*`
  - `app/src/features/analysis/contracts/*`
  - `app/src/features/analysis/analysis.router.ts`
  - `app/src/features/analysis/components/sync-status.tsx`
- Zachowac zasady:
  - Prisma tylko przez repository/service
  - testy co-located (`*.test.ts` / `*.test.tsx`)
  - API response envelope i `requestId` bez wyjatkow

### Previous Story Intelligence

- Story 1.5 domknela egzekwowanie RBAC i audit trail; nowa historia musi respektowac role i nie omijac guardow przy sync/status endpointach.
- Story 1.4 i 1.5 utrwalily wzorzec fail-safe + requestId-visible errors; ten sam wzorzec zastosowac do `failed_auth` i `partial_or_timeout`.
- Sprint dotad rozwijal repo inkrementalnie w obrebie istniejacych modulow; unikac duzych refaktorow poza zakresem historii.

### Git Intelligence Summary

- Ostatnie commity sugeruja inkrementalny sposob pracy i domykanie historii krok po kroku.
- Brak sygnalow o zmianie stacku; priorytetem jest zgodnosc z ustalonymi patternami i regresja testowa.

### Latest Tech Information

- Dla tej historii nie ma potrzeby zmiany stacku ani migracji wersji bibliotek.
- Pozostajemy przy obecnym zestawie: Next.js/T3 + tRPC + Prisma + Zod + PostgreSQL 17 + NextAuth/Auth.js v4.
- Skup sie na poprawnym mapowaniu bledow integracji Klaviyo oraz idempotentnym retry sync.

### Project Context Reference

- Nie znaleziono `project-context.md` w repo; bazowac na `epics.md`, `prd.md`, `architecture.md`, `ux-structure-minimal.md` i poprzednich historiach.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-2-Klaviyo-Audit--Insight-Engine]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.1-Sync-i-inwentaryzacja-danych-Klaviyo]
- [Source: _bmad-output/planning-artifacts/prd.md#FR8]
- [Source: _bmad-output/planning-artifacts/prd.md#Integration]
- [Source: _bmad-output/planning-artifacts/architecture.md#API--Communication]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure--Boundaries]
- [Source: _bmad-output/planning-artifacts/ux-structure-minimal.md#Klaviyo-Audit-View]
- [Source: _bmad-output/implementation-artifacts/1-5-egzekwowanie-dostepu-per-rola-i-ograniczenia-edycji.md#Previous-Story-Intelligence]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- auto-selected first ready-for-dev story from `sprint-status.yaml`: `2-1-sync-i-inwentaryzacja-danych-klaviyo`
- implemented data model + migration + adapter + analysis service/router + jobs + cron route + UI sync card
- npm run postinstall (prisma generate)
- npm test
- npm run typecheck
- npm run lint
- npm test (po poprawkach code review)
- npm run typecheck (po poprawkach code review)
- npm run lint (po poprawkach code review)

### Completion Notes List

- Story 2.1 zaimplementowana end-to-end i oznaczona jako `done` po poprawkach code review.
- Dodano modele Prisma `KlaviyoSyncRun` i `KlaviyoInventoryItem` oraz migracje SQL dla sync + inwentaryzacji.
- Dodano adapter integracyjny Klaviyo z obsluga statusow `failed_auth` i `partial_or_timeout`.
- Zaimplementowano serwis `analysis` z idempotentnym upsertem inwentaryzacji oraz logowaniem `requestId`.
- Dodano tRPC router `analysis` (`getSyncStatus`, `syncNow`) i podpiecie do `appRouter`.
- Dodano orchestration `manual-sync-job` i `daily-sync-job` oraz endpoint cron `/api/cron/daily-sync`.
- Rozszerzono UI o karte "Klaviyo audit sync" z recznym triggerem i komunikatami stale/error/retry.
- Dodano testy: analysis service/router oraz joby manual/daily.
- Walidacje lokalne przeszly: `npm test`, `npm run typecheck`, `npm run lint` (takze po poprawkach code review).

### File List

- _bmad-output/implementation-artifacts/2-1-sync-i-inwentaryzacja-danych-klaviyo.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- app/prisma/schema.prisma
- app/prisma/migrations/20260202150000_story_2_1_klaviyo_sync/migration.sql
- app/generated/prisma/edge.js
- app/generated/prisma/index-browser.js
- app/generated/prisma/index.d.ts
- app/generated/prisma/index.js
- app/generated/prisma/package.json
- app/generated/prisma/schema.prisma
- app/generated/prisma/wasm.js
- app/src/env.js
- app/src/features/analysis/index.ts
- app/src/features/analysis/contracts/analysis.schema.ts
- app/src/features/analysis/server/analysis.repository.ts
- app/src/features/analysis/server/analysis.logic.ts
- app/src/features/analysis/server/analysis.service.ts
- app/src/features/analysis/analysis.router.logic.ts
- app/src/features/analysis/analysis.router.ts
- app/src/features/analysis/analysis-router.test.mjs
- app/src/features/analysis/server/analysis-service.test.mjs
- app/src/features/analysis/components/sync-status.tsx
- app/src/server/integrations/klaviyo/klaviyo-adapter.ts
- app/src/server/jobs/manual-sync-job.ts
- app/src/server/jobs/daily-sync-job.ts
- app/src/server/jobs/manual-sync-job.test.mjs
- app/src/server/jobs/daily-sync-job.test.mjs
- app/src/app/api/cron/daily-sync/route.ts
- app/src/server/api/root.ts
- app/src/features/clients/components/clients-workspace.tsx
- app/src/server/auth/session-role.ts
- app/src/app/api/cron/daily-sync/route.test.mjs
- app/src/server/integrations/klaviyo/klaviyo-adapter.test.mjs
- app/src/app/page.tsx
- app/src/features/clients/index.ts
- app/src/server/api/trpc.ts
- app/src/server/auth/config.ts
- app/tsconfig.json


## Senior Developer Review (AI)

### Review Date

2026-02-02

### Reviewer

Senior Developer (AI)

### Outcome

Approve

### Summary

- Zweryfikowano implementacje Story 2.1 wzgledem AC i taskow.
- Wszystkie wskazane HIGH/MEDIUM findings zostaly poprawione i pokryte testami regresyjnymi.
- Historia spelnia kryteria do statusu `done`.

### Action Items

- [x] [HIGH] Wymusic autoryzacje endpointu cron niezaleznie od konfiguracji (`CRON_SHARED_SECRET`) oraz odrzucac uruchomienie bez sekretu.
- [x] [MEDIUM] Usunac `GET = POST` dla endpointu mutujacego stan i pozostawic wywolanie tylko przez `POST`.
- [x] [HIGH] Traktowac odpowiedzi HTTP 4xx (np. 429/400) z Klaviyo jako blad sync (`partial_or_timeout`) zamiast sukcesu `OK`.
- [x] [MEDIUM] Usunac bezposredni import z innego feature (`analysis -> clients`) i przeniesc `assertSessionRole` do wspolnego modułu granicznego.
- [x] [MEDIUM] Uzgodnic Story File List z rzeczywistym stanem repo (dodatkowe zmienione pliki nieodnotowane w historii).

## Change Log

- 2026-02-02: Code review (AI) wykryl 2 HIGH i 3 MEDIUM issue; dodano Review Follow-ups i status cofneto do `in-progress`.

- 2026-02-02: Code review (AI) poprawki wdrozone automatycznie; domknieto 2 HIGH i 3 MEDIUM finding, status ustawiono na `done`.

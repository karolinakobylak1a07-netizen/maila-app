# Story 3.5: Remediacja Epiku 3

Status: done

## Story

As a Engineering Lead,
I want naprawic krytyczne problemy wykryte w Deep Audicie Epiku 3,
so that logika strategii i sync jest odporna na race condition, bledy RBAC i utrate danych.

## Acceptance Criteria

1. Given generowanie strategii dziala rownolegle
   When dwa zadania uruchomia sie dla tego samego klienta
   Then system serializuje wykonanie lockiem
   And reuse'uje resumable record bez duplikacji artefaktow.
2. Given sync zapisuje inventory i status run
   When finalizacja sync sie powiedzie
   Then inventory i updateSyncRun sa zapisywane atomowo w jednej transakcji.
3. Given operacje audit sa wykonywane przez role rozne od OWNER/STRATEGY
   When brak uprawnien RBAC
   Then system nie bypassuje sprawdzen i zwraca forbidden.

## Remediation Scope

- Dodano lock + transaction wrapper dla `generateEmailStrategy`.
- Dodano regression test na race condition dla `generateEmailStrategy`.
- Usunieto bypass RBAC (`OPERATIONS`) w `assertAuditAccess`.
- Sync finalizuje `inventory + updateSyncRun` atomowo przez `persistSyncRunWithInventory`.
- `runDailySyncForAllClients` pomija klientow z `IN_PROGRESS`.
- `getSyncStatus` waliduje brakujacy `requestId` i zwraca fallback.
- `getContextInsights` ma await + jawny check bledow mapowania.
- `generateCampaignCalendar` rozdziela read check i edit check.
- `AnalysisDomainError` ma pelny envelope `{ code, message, requestId }`.

## How to verify manually

1. Uruchom dwa rownolegle wywolania `generateEmailStrategy` dla tego samego klienta i potwierdz, ze drugi reuse'uje ten sam resumable artefakt.
2. Wymus blad autoryzacji RBAC dla roli `OPERATIONS` na `runSync` i potwierdz `forbidden` (bez bypassu).
3. Uruchom daily sync przy istniejacym `IN_PROGRESS` i potwierdz `skipped=true` dla danego klienta.

## Changed Files

- `app/src/features/analysis/server/analysis.repository.ts`
- `app/src/features/analysis/server/analysis.service.ts`
- `app/src/features/analysis/server/analysis.logic.ts`
- `app/src/features/analysis/analysis.router.logic.ts`
- `app/src/features/analysis/server/analysis.service.test.ts`

## Minimal Review

- Ryzyko regresji: srednie (zmiany dotykaja sciezek sync + strategy), ale ograniczone do obszaru audit/remediation.
- Pokrycie testami: dodany regres na race condition oraz testy RBAC/skip/fallback requestId.

## Completion Notes

- Remediacja 3.5 zamyka kluczowe punkty Deep Auditu Epiku 3 bez zmiany zewnetrznych kontraktow biznesowych poza envelope bledow.

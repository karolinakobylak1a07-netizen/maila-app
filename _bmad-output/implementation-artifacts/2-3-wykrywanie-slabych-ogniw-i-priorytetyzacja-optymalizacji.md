# Story 2.3: Wykrywanie slabych ogniw i priorytetyzacja optymalizacji

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Strategy & Insight Lead,
I want dostac liste najslabszych obszarow performance,
so that moge zaplanowac dzialania o najwyzszym potencjale efektu.

## Acceptance Criteria

1. Given system ma dane historyczne i wynik audytu
   When generowana jest analiza optymalizacyjna
   Then system wskazuje minimum 3 priorytetowe obszary z uzasadnieniem
   And kazdy obszar ma sugerowany oczekiwany efekt biznesowy.
2. Given zestaw metryk jest niewystarczajacy do wiarygodnej priorytetyzacji
   When uruchamiana jest analiza optymalizacyjna
   Then system zwraca wynik "insufficient_data_for_priority"
   And wskazuje jakie dane nalezy uzupelnic.
3. Given analiza AI przekracza limit czasu przetwarzania
   When operacja nie konczy sie w SLA
   Then system zwraca status "timed_out" i zapisuje postep czesciowy
   And umozliwia ponowienie bez utraty poprzednich wynikow.

## Tasks / Subtasks

- [ ] Zdefiniowac model obszarow optymalizacyjnych i priorytetyzacje (AC: 1)
  - [ ] Rozszerzyc `analysis.schema` o strukture `OptimizationArea` zawierajaca `name`, `category`, `priority`, `expectedImpact`, `confidence`, `source`, `requestId`, `lastSyncRequestId`, `refreshWindow` i `status` (OK / GAP / insufficient_data_for_priority / timed_out)
  - [ ] Zdefiniowac scoring bazowany na metrykach z analizy Klaviyo/flow/email/formularzy i waga historyczna (pokazujacy oczekiwany efekt biznesowy)
  - [ ] Ustalic standardy `priority` (critical/high/medium/low) i `confidence` (moze byc percent) oraz powiazac je z konkretnymi zestawami danych (flows, segments, automations)
- [ ] Implementowac serwis analityczny, ktory agreguje dane z Story 2.1 i Story 2.2 w `features/analysis/server/*` (AC: 1, 2, 3)
  - [ ] Pobierac `systemObservations` (sync statusy, burndown, coverage) i generowac ranking najmocniejszych luk plus `expectedImpact` na KPI (np. conversion, retention)
  - [ ] Wprowadzic gate `insufficient_data_for_priority` gdy dane brakuja (np. brak flows > threshold) lub `lastSyncStatus` wstanach `failed_auth`/`partial_or_timeout`/`in_progress`
  - [ ] Zwrocic `timed_out` wraz z czesciowym wynikiem i `requestId` gdy analiza przekroczy SLA; zapisz `progressSnapshot` i przydatne `retryHint`
- [ ] Wystawic API/Procedury tRPC `analysis.getOptimizationAreas` i ewentualny REST/cron (AC: 1, 2, 3)
  - [ ] Ustalic kontrakt: `{ data: { areas: OptimizationArea[] }, meta: { generatedAt, lastSyncRequestId } }` i zewnetrzne `error` w formacie `code/message/details/requestId`
  - [ ] Egzekwowac RBAC: tylko role Owner/Strategy w kontekscie klienta otrzymuja dane, a pozostali widza komunikat `forbidden` z `requestId`
  - [ ] Dodac retry endpoint/flag `showPartialOnTimeout` (AC: 3)
- [ ] Zwiazac UI z nowym API w module strategy/analysis (AC: 1, 2, 3)
  - [ ] Dodac komponent `OptimizationPrioritiesList` w `features/strategy` lub `analysis/components` z widokiem priorytetow, statusow, `expectedImpact` i `confidence`
  - [ ] Pokazywac warningi `insufficient_data_for_priority` i `timed_out` z instrukcjami dalszych krokow (np. `run sync`, `adjust filters`, `retry analysis`)
  - [ ] Wyswietlac `lastSyncRequestId` i `requestId` w UI, tak aby planujacy moze powiazac dane z konkretnym syncem
- [ ] Pokryc logike i API testami regresyjnymi (AC: 1, 2, 3)
  - [ ] Testy serwisu: kompletne dane -> co najmniej 3 krtytyczne obszary, dedykowane priorytety i expectedImpact
  - [ ] Testy gate: stale dane/partial sync -> `insufficient_data_for_priority`, medan `failed_auth`/`in_progress`; `timed_out` -> czesciowy wynik + retryHint
  - [ ] Testy routera/UI: RBAC, error envelope, stale warning states i paradygmat `forbidden` z `requestId`

## Dev Notes

- Wykorzystac analize z Story 2.2 (Gap report) jako zrodlo danych i nie dublowac logiki pobierania stanu flows/segments/email; uzywac `analysis.getGapReport` i `sync` metadata jako podstawa rankingow.
- Granice architektoniczne: domena `features/analysis` + `analysis.schema` + `analysis.router` dla logiki, `server/integrations/klaviyo` i `server/jobs` z data collection, a `features/strategy` tylko konsumuje gotowe priorytety.
- Bledy musza zachowac format `code/message/details/requestId` i `requestId` musi byc widoczny w logach i UI (tak samo jak w Story 2.2) – `lastSyncRequestId` sluzy powiazaniu z syncem.
- Ranking minimalnie 3 obszarow musi byc deterministyczny (np. sortowanie po sumie priority*confidence) i odroznic `insufficient_data_for_priority` od `GAP` oraz `timed_out` z wlasna notacja.
- `timed_out` moze zostac restartowany bez zbednych duplikatow: zapisywac `progressSnapshot` i `retryHint` w bazie lub cache.

### Project Structure Notes

- Preferowane miejsca zmian:
  - `app/src/features/analysis/contracts/analysis.schema.ts` (nowy model `OptimizationArea` i `AnalysisStatus`)
  - `app/src/features/analysis/server/analysis.service.ts` + `.logic.ts` (ranking + gates) i `analysis.router.ts`
  - `app/src/features/strategy/components/optimization-priorities-list.tsx` lub `features/analysis/components/optimization-priorities-list.tsx`
  - `app/src/features/analysis/components/analysis-dashboard.tsx` (dodac panel priorytetow i statusy)
  - `app/src/features/analysis/server/analysis.service.test.mjs` i `analysis.router.test.mjs`
- Zachowac feature-first scope: `analysis` domain zarzadza danymi + logika, UI jedynie konsumuje; `server/integrations/klaviyo` i `jobs/daily-sync` dostarczaja `lastSyncStatus` + `lastSyncRequestId`.
- Tesy co-located, z mockami `analysis.repository` i `klaviyo-adapter` w scope `features/analysis`.
- Kontrakt API: success `{ data, meta? }`, error `{ error: { code, message, details?, requestId } }` z `requestId` generowanym corocznia (np. `request-id` helper z `lib/request-id.ts`).

## Previous Story Intelligence

- Story 2.2 dostarczyla gate stanu sync (`ok`, `failed_auth`, `partial_or_timeout`, `timed_out`) oraz komponenty UI `GapListCard` – uzywaj tych statusow jako input do priorytetyzacji i warnings.
- Logika `insufficient_data` zostala wyodrebniona jako osobny stan; przy braku gapow (insufficient) obecna historia powinna wskazywac konkretny brak danych (np. brak flowow/segmentow) i instrukcje uzupełnienia.
- `analysis.getGapReport` zwraca `lastSyncRequestId` i `requestId`; ten sam `lastSyncRequestId` bedzie powiazany z nowa analiza optymalizacji, wiec waliduj go i odswiez UI po `syncNow`.
- Kod i API musza trzymac `requestId` w kazdym błędzie aby zespol mogl zdiagnozowac availability/timeout issues (tak samo jak w Story 2.2). Utrzymac `requestId` w logach i `details`.

## Git Intelligence Summary

- Ostatnie commity w `features/analysis` i `features/clients` trzymaja styl incrementalnych rozbudow: dodanie kontraktow + testow, potem UI i docelowe guardy.
- Stack i struktura pozostaly stabilne (Next.js/T3 + tRPC + Prisma + Zod); rozwiazanie sie nie przeszlo do nowego repo.
- Kontynuowac podejscie: uaktualniac jedynie `analysis` domain, testy i UI w ramach tych modulow, nie robic szerokich refactorow.

## Latest Tech Information

- Nadal uzywamy: Next.js (App Router) + tRPC + Prisma (PostgreSQL 17) + Zod + NextAuth/Auth.js v4 + Tailwind (Create-T3-App jako preferowany starter).
- Nie wymagana migracja biblioteki; priorytetem jest wzmocnienie logiki analitycznej, a nie aktualizowanie zaleznosci.

## Project Context Reference

- Brak `project-context.md`; bazujemy na: `_bmad-output/planning-artifacts/epics.md`, `prd.md`, `architecture.md`, `ux-structure-minimal.md` oraz Story 2.2.

## References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.3-Wykrywanie-slabych-ogniw-i-priorytetyzacja-optymalizacji]
- [Source: _bmad-output/planning-artifacts/prd.md#3)-Audyt-i-analiza-Klaviyo]
- [Source: _bmad-output/planning-artifacts/prd.md#Functional-Requirements]
- [Source: _bmad-output/planning-artifacts/architecture.md#API--Communication]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Patterns--Consistency-Rules]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure--Boundaries]
- [Source: _bmad-output/planning-artifacts/ux-structure-minimal.md#Main-Views-and-Purpose]
- [Source: _bmad-output/implementation-artifacts/2-2-raport-luk-konfiguracji.md#Dev-Notes]

# Story 2.2: Raport luk konfiguracji

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Strategy & Insight Lead,
I want otrzymac raport brakow w flow, segmentach i logice,
so that moge szybko wskazac krytyczne obszary do uzupelnienia.

## Acceptance Criteria

1. Given zakonczony sync danych Klaviyo
   When uruchamiam audyt konfiguracji
   Then system wskazuje brakujace elementy z nazwa i powodem
   And kazda luka otrzymuje status i priorytet do naprawy.
2. Given audyt konfiguracji uruchomiono bez aktualnych danych sync
   When dane sa starsze niz ustalony prog swiezosci
   Then system blokuje publikacje raportu luk
   And wymaga wykonania sync przed analiza.
3. Given API zewnetrzne zwraca niekompletne dane flow/segmentow
   When system generuje raport luk
   Then oznacza pozycje jako "insufficient_data"
   And nie klasyfikuje ich falszywie jako "Gap" bez uzasadnienia.

## Tasks / Subtasks

- [x] Zdefiniowac kontrakty i model raportu luk (AC: 1, 3)
  - [x] Rozszerzyc `analysis.schema` o typy pozycji raportu (`status`, `priority`, `reason`, `entityType`, `entityName`)
  - [x] Ustalic enum statusow z jawna obsluga `insufficient_data`
  - [x] Ustalic zasady priorytetyzacji (np. critical/high/medium/low) i mapowanie powodow
- [x] Zaimplementowac logike audytu luk na podstawie inwentaryzacji z Story 2.1 (AC: 1, 3)
  - [x] Dodac serwis, ktory analizuje dane konto/flow/email/form i wykrywa braki flow/segmentow/logiki
  - [x] Dla niekompletnych danych zwracac `insufficient_data` zamiast falszywego `Gap`
  - [x] Zapewnic spojnosc error envelope (`code/message/details/requestId`) i logowanie `requestId`
- [x] Dodac bramke swiezosci danych sync (AC: 2)
  - [x] Wymusic prog swiezosci danych (np. na podstawie `lastSyncAt` i statusu sync)
  - [x] Blokowac generowanie raportu, jesli dane sa stale lub ostatni sync nie jest wiarygodny
  - [x] Zwrocic komunikat diagnostyczny z akcja retry sync
- [x] Udostepnic raport luk w API i UI modulu audit/analysis (AC: 1, 2, 3)
  - [x] Dodac procedure/endpoint pobierajacy raport dla aktywnego klienta
  - [x] Dodac komponent listy luk (status, priorytet, powod, zrodlo) w widoku audit
  - [x] Dodac stany UI: loading, empty, stale warning, forbidden, error (z `requestId`)
- [x] Pokryc testami krytyczne scenariusze (AC: 1, 2, 3)
  - [x] Testy serwisu: kompletne dane -> poprawna klasyfikacja i priorytety
  - [x] Testy serwisu: dane stale -> blokada publikacji raportu
  - [x] Testy serwisu/routera: niekompletne dane -> `insufficient_data` bez falszywego `Gap`

## Dev Notes

- Ta historia rozwija fundament ze Story 2.1; korzystaj z istniejacej inwentaryzacji sync zamiast duplikowac pobieranie danych z Klaviyo.
- Zachowaj granice architektoniczne: logika domenowa w `features/analysis/server/*`, integracje w `server/integrations/*`, orchestration sync w `server/jobs/*`.
- Nie obchodz RBAC: dostep do raportu musi respektowac role i aktywny kontekst klienta.
- Wszystkie bledy i logi operacyjne musza miec `requestId` i wspolny envelope bledow.
- Dane nieaktualne lub niekompletne to osobne stany domenowe (stale vs insufficient_data); nie mieszac ich z "Gap".

### Project Structure Notes

- Preferowane miejsca zmian:
  - `app/src/features/analysis/contracts/analysis.schema.ts`
  - `app/src/features/analysis/server/analysis.logic.ts`
  - `app/src/features/analysis/server/analysis.service.ts`
  - `app/src/features/analysis/analysis.router.ts`
  - `app/src/features/analysis/components/gap-list.tsx`
  - `app/src/features/analysis/components/sync-status.tsx`
- Granice i konwencje:
  - feature-first, testy co-located (`*.test.ts` / `*.test.tsx`)
  - API: sukces `{ data, meta? }`, blad `{ error: { code, message, details?, requestId } }`
  - Nazewnictwo: DB `snake_case`, API JSON `camelCase`, pliki React `kebab-case`

### Previous Story Intelligence

- Story 2.1 dostarczyla model inwentaryzacji i statusy sync (`ok`, `failed_auth`, `partial_or_timeout`) - wykorzystaj te artefakty jako jedyne zrodlo danych do raportu luk.
- Po code review w Story 2.1 doprecyzowano bezpieczenstwo cron i mapowanie bledow 4xx; w tej historii utrzymaj te same standardy klasyfikacji bledow.
- Utrzymuj inkrementalny zakres zmian: rozbudowa `analysis` zamiast duzych refaktorow poza zakresem AC.

### Git Intelligence Summary

- Ostatnie commity potwierdzaja styl pracy inkrementalnej i domykanie historii po review.
- Brak sygnalow o zmianie stacku lub struktury - preferowane jest dopinanie kolejnych elementow w istniejacych modulach.

### Latest Tech Information

- Dla Story 2.2 nie ma potrzeby zmiany wersji stacku.
- Kontynuuj obecny zestaw: Next.js/T3 + tRPC + Prisma + Zod + PostgreSQL 17 + NextAuth/Auth.js v4.
- Priorytet: poprawna klasyfikacja luk i wiarygodnosc raportu (freshness gate + insufficient_data), nie migracje technologiczne.

### Project Context Reference

- Nie znaleziono `project-context.md` w repo; kontekst oparto o `epics.md`, `prd.md`, `architecture.md`, `ux-structure-minimal.md` i Story 2.1.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-2-Klaviyo-Audit--Insight-Engine]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.2-Raport-luk-konfiguracji]
- [Source: _bmad-output/planning-artifacts/prd.md#3)-Audyt-i-analiza-Klaviyo]
- [Source: _bmad-output/planning-artifacts/prd.md#Non-Functional-Requirements]
- [Source: _bmad-output/planning-artifacts/architecture.md#API--Communication]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Patterns--Consistency-Rules]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure--Boundaries]
- [Source: _bmad-output/planning-artifacts/ux-structure-minimal.md#Main-Views-and-Purpose]
- [Source: _bmad-output/implementation-artifacts/2-1-sync-i-inwentaryzacja-danych-klaviyo.md#Review-Follow-ups-(AI)]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- auto-selected first backlog story from `sprint-status.yaml`: `2-2-raport-luk-konfiguracji`
- analyzed `epics.md`, `prd.md`, `architecture.md`, `ux-structure-minimal.md`
- loaded previous story intelligence from `2-1-sync-i-inwentaryzacja-danych-klaviyo.md`
- reviewed recent git history for implementation patterns
- implemented `analysis.getGapReport` (router + service logic + schema contracts)
- added `GapListCard` UI and integrated report rendering in clients workspace
- npm test
- npm run typecheck
- npm run lint

### Completion Notes List

- Zaimplementowano raport luk konfiguracji z klasyfikacja statusow (`OK`, `GAP`, `INSUFFICIENT_DATA`) i priorytetami.
- Dodano freshness gate (24h) blokujacy audyt dla stalych danych sync oraz czytelny komunikat retry.
- Rozszerzono API o `analysis.getGapReport` i podlaczono UI raportu (loading/empty/stale/error).
- Dodano testy serwisu i routera dla nowych scenariuszy, bez regresji.
- Walidacje lokalne przeszly: `npm test`, `npm run typecheck`, `npm run lint`.
- Zwracamy `lastSyncRequestId` w `analysis.getGapReport` i pokazujemy je w UI `GapListCard`.
- Testy serwisu sprawdzaja `INSUFFICIENT_DATA` dla partial sync oraz blokade `IN_PROGRESS`.

### File List

- _bmad-output/implementation-artifacts/2-2-raport-luk-konfiguracji.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- app/src/features/analysis/contracts/analysis.schema.ts
- app/src/features/analysis/server/analysis.logic.ts
- app/src/features/analysis/analysis.router.ts
- app/src/features/analysis/components/gap-list.tsx
- app/src/features/clients/components/clients-workspace.tsx
- app/src/features/analysis/server/analysis-service.test.mjs
- app/src/features/analysis/analysis-router.test.mjs
- app/src/server/integrations/klaviyo/klaviyo-adapter.ts

## Senior Developer Review (AI)

### Review Date

2026-02-02

### Reviewer

Senior Developer (AI)

### Outcome

Approve

### Summary

- Zweryfikowano i naprawiono wszystkie findings z code review (1 CRITICAL, 2 HIGH, 1 MEDIUM).
- Dodano dedykowany stan forbidden dla raportu luk w UI.
- Urealniono analize segmentow (odczyt z endpointu segmentow Klaviyo) oraz dopieto scenariusz `insufficient_data`.
- Dociagnieto gate wiarygodnosci sync (blokada dla `FAILED_AUTH` i `IN_PROGRESS`).
- Poprawiono invalidacje cache po sync (`analysis.getGapReport`), aby raport byl odswiezany.
- Wprowadzono `lastSyncRequestId` w danych raportu i pokazano go w UI, aby skojarzyc wynik z konkretnym syncem.
- Rozszerzono testy i logikę o scenariusze partial/`IN_PROGRESS`, potwierdzając `INSUFFICIENT_DATA` dla flow/logiki.

### Action Items

- [x] [CRITICAL] Dodac dedykowany stan forbidden dla raportu luk w UI.
- [x] [HIGH] Usunac hardcoded klasyfikacje segmentow i oprzec raport o rzeczywiste dane segmentow.
- [x] [HIGH] Zablokowac audyt luk, gdy ostatni sync nie jest wiarygodny (`FAILED_AUTH` / `IN_PROGRESS`).
- [x] [MEDIUM] Doinwalidowac `analysis.getGapReport` po `syncNow`.
- [x] [HIGH] Flux/logika/segmenty w partial sync klasyfikowane jako `INSUFFICIENT_DATA`, nie `GAP`.
- [x] [MEDIUM] Zwrocenie `lastSyncRequestId` wraz z raportem i wyświetlenie go w workspace.
- [x] [MEDIUM] Rozszerzenie błędów `stale_sync_data`/`sync_not_reliable` o `lastSyncRequestId`.

## Review Follow-ups (AI)

- [x] [HIGH] Zaimplementowano `INSUFFICIENT_DATA` dla flow/logiki w partial sync i dodano testy (`analysis-service.test.mjs`).
- [x] [MEDIUM] W odpowiedzi `analysis.getGapReport` zwracamy `lastSyncRequestId`, a UI `GapListCard` pokazuje ID.
- [x] [MEDIUM] `assertFreshSyncRun` i `assertReliableSyncRun` przekazują `lastSyncRequestId` w szczegółach błędów.

## Change Log

- 2026-02-02: Story 2.2 zaimplementowana end-to-end; status ustawiony na `review`.
- 2026-02-02: Code review findings naprawione automatycznie; status ustawiony na `done`.
- 2026-02-02: Dodatkowe poprawki: requestId w raporcie i błędach oraz testy partial/`IN_PROGRESS`.

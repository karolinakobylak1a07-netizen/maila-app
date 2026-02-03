# Story 1.4: Discovery onboarding z walidacja brakow

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Owner,
I want przeprowadzic ustrukturyzowany discovery call,
so that system posiada komplet danych potrzebnych do dalszej analizy i strategii.

## Acceptance Criteria

1. Given rozpoczety onboarding klienta
   When uzytkowniczka uzupelnia formularz discovery
   Then system wymaga co najmniej 10 kluczowych odpowiedzi
   And blokuje przejscie dalej, dopoki pola cele, segmenty, sezonowosc i oferta nie sa kompletne.
2. Given formularz discovery zawiera brakujace pola wymagane
   When uzytkowniczka probuje przejsc do kolejnego etapu
   Then system wskazuje konkretne brakujace pola i ich walidacje
   And nie pozwala zamknac etapu discovery.
3. Given zapis odpowiedzi discovery nie powiedzie sie po stronie bazy
   When uzytkowniczka klika "Zapisz"
   Then system informuje o niepowodzeniu i nie oznacza etapu jako kompletnego
   And niezapisane odpowiedzi pozostaja widoczne do ponownego zapisu.

## Tasks / Subtasks

- [x] Rozszerzyc model danych o onboarding discovery per klient (AC: 1, 2, 3)
  - [x] Dodac modele Prisma dla sekcji discovery i odpowiedzi z relacja do `client_profiles` oraz autora aktualizacji
  - [x] Dodac pola kompletowosci dla wymaganych obszarow (`goals`, `segments`, `seasonality`, `offer`) i licznik odpowiedzi
  - [x] Dodac migracje SQL z indeksami pod odczyt per `client_id` i najnowszy stan onboarding
- [x] Zaimplementowac logike domenowa walidacji kompletowosci discovery (AC: 1, 2)
  - [x] Dodac serwis/repository do zapisu draftu i liczenia kompletowosci (min. 10 odpowiedzi + wymagane pola)
  - [x] Zwracac liste brakow w postaci jawnych kodow domenowych oraz mapowanie do `code/message/details/requestId`
  - [x] Zablokowac oznaczenie etapu jako kompletnego, gdy walidacja zwroci braki
- [x] Udostepnic procedury tRPC dla discovery onboarding (AC: 1, 2, 3)
  - [x] Dodac kontrakty Zod dla `saveDiscoveryDraft`, `getDiscoveryState`, `completeDiscovery`
  - [x] Egzekwowac active client context i membership (brak cross-client access)
  - [x] Dla operacji modyfikujacych wymagac `canEdit === true` (forbidden dla read-only)
- [x] Zbudowac UI discovery z czytelnym feedbackiem brakow (AC: 1, 2, 3)
  - [x] Dodac widok discovery (desktop-first) z formularzem pytan i sekcja postepu kompletowosci
  - [x] Pokazywac walidacje per pole oraz liste brakow blokujacych przejscie dalej
  - [x] Przy bledzie zapisu zachowac lokalny stan formularza i umozliwic retry bez utraty wpisanych danych
- [x] Pokryc testami regresje i scenariusze edge-case (AC: 1, 2, 3)
  - [x] Testy logiki walidacji: 9 vs 10 odpowiedzi, brak wymaganych pol, kompletne dane
  - [x] Testy routera/service: `forbidden` przy braku uprawnien, `active_context_mismatch` przy zlym kliencie
  - [x] Testy UI: blokada "przejdz dalej", widocznosc brakow, utrzymanie danych po failed save

## Dev Notes

- Story 1.4 kontynuuje Epic 1 i powinna rozszerzac istniejacy feature `clients`, nie tworzyc rownoleglego subsystemu.
- Krytyczne guardrails: izolacja kontekstu klienta, brak fallbacku roli, `canEdit` dla operacji zapisu, spojny error contract z `requestId`.
- Utrzymac architekture feature-based: contracts -> router -> service -> repository -> Prisma.
- UX musi wspierac stany: loading/empty/error/forbidden oraz czytelny postep kompletowosci discovery.
- Wymagana scisla mapa walidacji: minimum 10 odpowiedzi + komplet `goals/segments/seasonality/offer` przed `completeDiscovery`.
- Nie dublowac mechanizmow aktywnego klienta - reuse istniejacych wzorcow z Story 1.2 i 1.3.

### Project Structure Notes

- Preferowane miejsca zmian:
  - `app/prisma/schema.prisma` + nowa migracja `app/prisma/migrations/*`
  - `app/src/features/clients/contracts/*` (schematy input/output discovery)
  - `app/src/features/clients/server/*` (logika walidacji kompletowosci)
  - `app/src/features/clients/clients.router.ts` i testy routera
  - `app/src/features/clients/components/*` lub dedykowany widok discovery pod `app/src/app/clients/*`
- Zachowac granice architektoniczne:
  - tylko service/repository dotyka Prisma
  - walidacja wejsc przez Zod
  - odpowiedzi API zgodne z envelope `data/meta` i bledy `code/message/details/requestId`

### Previous Story Intelligence

- Story 1.3 potwierdzila, ze role musza byc jawnie walidowane (`assertSessionRole`) bez fallbacku do OWNER.
- Story 1.3 wymusila `canEdit` dla zapisow - ten sam standard obowiazuje dla discovery save/complete.
- Story 1.2 i 1.3 ustalily wzorzec izolacji kontekstu (`active_context_mismatch`) i testow co-located `.test.mjs`.
- Istnieje juz mechanizm `rememberLastView` i bezpieczny path normalize - wykorzystac go do nawigacji discovery zamiast nowej logiki.

### Git Intelligence Summary

- Ostatnie commity domknely setup i statusy sprintu/stories (`story 1.1`, `story 1.2`, status tracking).
- Biezacy kierunek projektu to rozszerzanie `features/clients` z mocna walidacja kontraktow i testami regresyjnymi.
- Story 1.4 powinna utrzymac ten kierunek: incremental extension, bez zmian globalnej architektury.

### Latest Tech Information

- Projekt pozostaje na stosie: Next.js + tRPC + Prisma + Zod + NextAuth/Auth.js v4 + PostgreSQL 17.
- Dla tej historii nie ma potrzeby zmiany bibliotek; priorytetem jest poprawna implementacja reguly walidacyjnej i RBAC.

### Project Context Reference

- Nie znaleziono `project-context.md` w repo; bazowac na `prd.md`, `architecture.md`, `epics.md` i `ux-structure-minimal.md`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.4-Discovery-onboarding-z-walidacja-brakow]
- [Source: _bmad-output/planning-artifacts/epics.md#Epic-1-Client-Workspace-Context--Access-Foundation]
- [Source: _bmad-output/planning-artifacts/prd.md#2-Discovery-i-onboarding-informacji]
- [Source: _bmad-output/planning-artifacts/ux-structure-minimal.md#Main-Views-and-Purpose]
- [Source: _bmad-output/planning-artifacts/architecture.md#API--Communication]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure--Boundaries]
- [Source: _bmad-output/implementation-artifacts/1-3-historia-decyzji-strategicznych-per-klient.md#Previous-Story-Intelligence]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- auto-selected first ready-for-dev story from `sprint-status.yaml`: `1-4-discovery-onboarding-z-walidacja-brakow`
- implemented Story 1.4 in feature `clients` (Prisma + service/repository + tRPC + UI + tests)
- npx prisma generate
- npm run test
- npm run typecheck
- npm run lint
### Completion Notes List

- Story 1.4 zaimplementowana end-to-end i oznaczona jako `review`.
- Dodano modele Prisma `DiscoveryOnboarding` i `DiscoveryAnswer` oraz migracje SQL dla danych discovery per klient.
- Dodano logike domenowa walidacji kompletowosci (minimum 10 odpowiedzi + wymagane pola `goals/segments/seasonality/offer`) z bledem `DISCOVERY_INCOMPLETE`.
- Rozszerzono API tRPC o `getDiscoveryState`, `saveDiscoveryDraft`, `completeDiscovery` z egzekwowaniem active context i `canEdit`.
- Rozszerzono UI `ClientsWorkspace` o formularz discovery, licznik postepu, liste brakow, blokade przejscia dalej i retry po failed save bez utraty danych.
- Dodano/rozszerzono testy logiki UI, routera, serwisu i repository dla scenariuszy edge-case i regresji.
- Walidacje koncowe przeszly: `npm run test`, `npm run typecheck`, `npm run lint`.

- Resolved code-review findings: ochrona local discovery state przed nadpisaniem podczas edycji (dirty guard) i requestId-visible error messages w UI.
- Dodano testy logiczne pod scenariusze UI discovery: dirty-state preservation, sync z serwerem i formatowanie komunikatu z requestId.

### File List

- _bmad-output/implementation-artifacts/1-4-discovery-onboarding-z-walidacja-brakow.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- app/generated/prisma/edge.js
- app/generated/prisma/index-browser.js
- app/generated/prisma/index.d.ts
- app/generated/prisma/index.js
- app/generated/prisma/package.json
- app/generated/prisma/schema.prisma
- app/generated/prisma/wasm.js
- app/prisma/migrations/20260202113000_story_1_4_discovery_onboarding/migration.sql
- app/prisma/schema.prisma
- app/src/app/page.tsx
- app/src/features/clients/index.ts
- app/src/features/clients/clients-router.test.mjs
- app/src/features/clients/clients.router.ts
- app/src/features/clients/components/clients-workspace.logic.ts
- app/src/features/clients/components/clients-workspace.test.mjs
- app/src/features/clients/components/clients-workspace.tsx
- app/src/features/clients/components/clients-workspace.view.tsx
- app/src/features/clients/contracts/clients.schema.ts
- app/src/features/clients/server/clients-repository.test.mjs
- app/src/features/clients/server/clients-service.test.mjs
- app/src/features/clients/server/clients.logic.ts
- app/src/features/clients/server/clients.repository.ts
- app/src/server/api/root.ts
- app/src/server/api/trpc.ts
- app/src/server/auth/config.ts
- app/tsconfig.json

### Change Log

- 2026-02-02: Story 1.4 utworzona przez create-story i oznaczona jako `ready-for-dev`.
- 2026-02-02: Story 1.4 zaimplementowana i oznaczona jako `review`; dodano model danych discovery, API, UI onboarding oraz testy regresyjne.
- 2026-02-02: Code review: fixed HIGH/MEDIUM findings (dirty-state overwrite, requestId-visible UI errors, rozszerzone testy UI logic) i oznaczono story jako `done`.


## Senior Developer Review (AI)

### Review Date

2026-02-02

### Reviewer

Senior Developer (AI)

### Outcome

Approve

### Summary

- Zweryfikowano implementacje AC i taskow Story 1.4.
- Naprawiono wszystkie zgloszone HIGH/MEDIUM findings z code-review.
- Testy, typecheck i lint przechodza po poprawkach.

### Action Items

- [x] [HIGH] Zabezpieczono lokalny stan discovery przed nadpisaniem podczas refetch (`dirty` guard).
- [x] [MEDIUM] Dodano requestId-visible komunikaty bledow w UI discovery/clients.
- [x] [MEDIUM] Rozszerzono testy UI logic o scenariusze discovery (dirty sync + requestId).
- [x] [MEDIUM] Ujednolicono File List z rzeczywistymi zmianami widocznymi w workspace.

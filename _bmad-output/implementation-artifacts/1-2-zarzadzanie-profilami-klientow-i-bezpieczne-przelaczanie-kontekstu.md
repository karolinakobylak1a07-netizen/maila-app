# Story 1.2: Zarzadzanie profilami klientow i bezpieczne przelaczanie kontekstu

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Owner,
I want tworzyc, edytowac i archiwizowac profile oraz przelaczac klientow bez mieszania danych,
so that moge prowadzic wiele projektow jednoczesnie w uporzadkowany i bezpieczny sposob.

## Acceptance Criteria

1. Given zalogowana Owner znajduje sie w module klientow
   When tworzy lub edytuje profil klienta (nazwa, status)
   Then profil zostaje zapisany i jest widoczny na liscie klientow
   And archiwizacja profilu jest mozliwa bez utraty historii decyzji.
2. Given system zawiera co najmniej dwa profile klientow
   When uzytkowniczka przelacza sie z klienta A na klienta B
   Then widzi wylacznie dane, rekomendacje i artefakty klienta B
   And po powrocie do klienta A system odtwarza ostatni widok pracy.
3. Given uzytkownik bez uprawnien edycji probuje zmienic profil klienta
   When wysyla zadanie zapisu
   Then system odrzuca operacje kodem "forbidden"
   And nie zapisuje zadnych zmian w bazie.
4. Given zapis profilu klienta konczy sie bledem bazy danych
   When Owner zatwierdza formularz
   Then system pokazuje blad zapisu i zachowuje dane formularza bez utraty
   And historia decyzji i inne dane klienta pozostaja nieskazone.

## Tasks / Subtasks

- [x] Zaprojektowac i wdrozyc model profilu klienta oraz status archiwizacji (AC: 1, 4)
  - [x] Dodac modele Prisma i migracje dla `client_profiles` oraz powiazan z danymi klienta
  - [x] Zaimplementowac repository/service dla create/update/archive z walidacja domenowa
  - [x] Zapewnic atomicznosc zapisu i rollback przy bledzie DB
- [x] Udostepnic API tRPC dla profili klientow z egzekwowaniem RBAC (AC: 1, 3, 4)
  - [x] Dodac procedury `list/create/update/archive` w feature `clients`
  - [x] Egzekwowac role i zwracac blad w kontrakcie `code/message/details/requestId` dla `forbidden`
  - [x] Dodac walidacje Zod i mapowanie bledow DB na spojnym error envelope
- [x] Zaimplementowac przelaczanie aktywnego klienta z izolacja kontekstu (AC: 2)
  - [x] Dodac mechanizm ustawiania aktywnego klienta i scoping danych na warstwie server
  - [x] Zapisywac/odtwarzac ostatni widok pracy per klient
  - [x] Dodac guardy zapobiegajace odczytowi artefaktow innego klienta
- [x] Zbudowac UI modulu klientow (lista + formularz + akcje) (AC: 1, 2, 4)
  - [x] Formularz tworzenia/edycji z zachowaniem danych po bledzie zapisu
  - [x] Akcja archiwizacji i wizualny status profilu na liscie
  - [x] Kontrolki przelaczania klienta i restore ostatniego widoku
- [x] Pokryc scenariusze testami i walidacja konca-koncow (AC: 1, 2, 3, 4)
  - [x] Unit testy dla service/repository (happy path + DB failure)
  - [x] Testy API tRPC dla RBAC (`forbidden`) i izolacji kontekstu
  - [x] Test komponentow formularza (utrzymanie danych po bledzie)
  - [x] Smoke/integration dla przelaczania klientow i odtwarzania kontekstu

## Dev Notes

- Story 1.2 rozszerza szkielet z Story 1.1 i jest pierwsza historia domenowa dla `clients`.
- Trzymac sie architektury feature-based: kod domeny klientow w `app/src/features/clients/*`, bez mieszania logiki po innych feature.
- API aplikacyjne przez tRPC; format bledow musi byc spojny: `code/message/details/requestId`.
- RBAC ma byc egzekwowany na granicy procedur/routerow i warstwy serwisowej.
- DB naming: `snake_case`; JSON/API naming: `camelCase`; testy co-located obok implementacji.
- Isolacja kontekstu klienta jest wymogiem krytycznym (brak przeciekow danych miedzy klientami).

### Project Structure Notes

- Bazowac na aktualnym szkielecie T3 w `app/` i rozwinac brakujace moduly:
  - `app/src/features/clients/components/*`
  - `app/src/features/clients/server/*`
  - `app/src/features/clients/clients.router.ts`
  - `app/prisma/schema.prisma` + migracja
- Zachowac istniejace kontrakty auth/tRPC i dopisac tylko zmiany mapowane do AC.
- Jesli potrzebny storage "ostatniego widoku", preferowac rozwiazanie per klient/per user w DB (auditowalne) zamiast lokalnego stanu only-client.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.2-Zarzadzanie-profilami-klientow-i-bezpieczne-przelaczanie-kontekstu]
- [Source: _bmad-output/planning-artifacts/epics.md#Epic-1-Client-Workspace-Context--Access-Foundation]
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication--Security]
- [Source: _bmad-output/planning-artifacts/architecture.md#API--Communication]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Patterns--Consistency-Rules]
- [Source: _bmad-output/implementation-artifacts/1-1-setup-projektu-ze-starter-template-create-t3-app.md#Completion-Notes-List]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- create-story requested explicitly for `1-2-zarzadzanie-profilami-klientow-i-bezpieczne-przelaczanie-kontekstu`
- npx prisma generate
- npm run test
- npm run typecheck
- npm run lint

### Completion Notes List

- Story utworzona z AC + edge cases oraz szczegolowym planem implementacji dla dev-story.
- Dodano guardrails dot. RBAC, izolacji kontekstu, requestId i testow co-located.
- Dodano modele Prisma: `ClientProfile`, `ClientMembership`, `ClientUserContext` + role uzytkownika i migracje SQL.
- Wdrozono feature `clients` (contracts + repository + service + router tRPC) z operacjami list/create/update/archive/switchActive/getActiveContext.
- Dodano mapowanie bledow domenowych na kontrakt tRPC `code/message/details/requestId` i egzekwowanie `forbidden` dla rol bez uprawnien.
- Wdrozono UI `app/src/app/clients/page.tsx` i `ClientsWorkspace` (lista/formularz/archiwizacja/przelaczanie) z zachowaniem danych formularza po bledzie zapisu.
- Dodano testy kontraktowe dla service/repository, routera tRPC i komponentu workspace.
- Walidacje lokalne po implementacji: `npm run test`, `npm run typecheck`, `npm run lint` - wszystkie przeszly.

### File List

- _bmad-output/implementation-artifacts/1-2-zarzadzanie-profilami-klientow-i-bezpieczne-przelaczanie-kontekstu.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- app/generated/prisma/edge.js
- app/generated/prisma/index-browser.js
- app/generated/prisma/index.d.ts
- app/generated/prisma/index.js
- app/generated/prisma/package.json
- app/generated/prisma/schema.prisma
- app/generated/prisma/wasm.js
- app/prisma/migrations/20260201235500_story_1_2_clients_context/migration.sql
- app/prisma/schema.prisma
- app/src/app/clients/page.tsx
- app/src/app/page.tsx
- app/src/features/clients/clients-router.test.mjs
- app/src/features/clients/clients.router.logic.ts
- app/src/features/clients/clients.router.ts
- app/src/features/clients/components/clients-workspace.test.mjs
- app/src/features/clients/components/clients-workspace.logic.ts
- app/src/features/clients/components/clients-workspace.tsx
- app/src/features/clients/components/clients-workspace.view.tsx
- app/src/features/clients/contracts/clients.schema.ts
- app/src/features/clients/index.ts
- app/src/features/clients/server/clients-service.test.mjs
- app/src/features/clients/server/clients.logic.ts
- app/src/features/clients/server/clients.repository.ts
- app/src/features/clients/server/clients.service.ts
- app/src/server/api/root.ts
- app/src/server/api/trpc.ts
- app/src/server/auth/config.ts
- app/tsconfig.json

### Change Log

- 2026-02-01: Story 1.2 zaimplementowana i oznaczona jako `review`; dodano modele klientow, API tRPC, UI modulu klientow, przełączanie kontekstu i testy kontraktowe.
- 2026-02-02: Code review fixes HIGH/MEDIUM - usunieto fallback roli do OWNER, dodano bezpieczna walidacje/scoping `lastViewPath`, zapis last view podczas pracy oraz behawioralne testy logiczne dla router/service/UI.

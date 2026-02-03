# Story 1.3: Historia decyzji strategicznych per klient

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Owner,
I want rejestrowac i przegladac decyzje strategiczne,
so that zachowuje ciaglosc ustalen i latwo wracam do uzasadnien.

## Acceptance Criteria

1. Given istnieje profil klienta
   When uzytkowniczka zapisuje decyzje strategiczna
   Then system tworzy wpis z data, autorem i trescia decyzji
   And wpis jest widoczny w historii tylko tego klienta.
2. Given uzytkownik probuje zapisac decyzje dla klienta spoza aktywnego kontekstu
   When wysyla formularz decyzji
   Then system odrzuca zapis jako naruszenie izolacji kontekstu
   And wpis nie pojawia sie w historii zadnego klienta.
3. Given zapis wpisu do historii konczy sie bledem transakcji
   When Owner potwierdza dodanie decyzji
   Then system zwraca jednoznaczny blad operacyjny
   And nie tworzy czesciowego wpisu w logach/audicie.

## Tasks / Subtasks

- [x] Rozszerzyc model danych o historie decyzji klienta (AC: 1, 3)
  - [x] Dodac model Prisma dla decyzji strategicznej powiazanej z `client_profiles` i `users` (autor), z polami tresci i znacznikami czasu
  - [x] Dodac migracje SQL oraz indeksy pod listowanie historii per klient (`client_id`, `created_at`)
  - [x] Zapewnic transakcyjnosc zapisu (rollback przy bledzie DB, bez czesciowych wpisow)
- [x] Zaimplementowac warstwe domenowa decyzji w feature `clients` (AC: 1, 2, 3)
  - [x] Dodac repository/service do `createDecision` i `listDecisions` ze scopingiem po `clientId`
  - [x] Egzekwowac membership i aktywny kontekst klienta przed zapisem oraz odczytem
  - [x] Mapowac bledy persistence na spojny kontrakt domenowy z `requestId`
- [x] Udostepnic procedury tRPC dla historii decyzji (AC: 1, 2, 3)
  - [x] Dodac wejscia Zod i procedury `clients.listDecisions` oraz `clients.createDecision`
  - [x] Zachowac jednolity format bledow `code/message/details/requestId`
  - [x] Nie eskalowac nieznanych rol; naruszenie izolacji mapowac na `forbidden`
- [x] Dodac UI historii decyzji w module klientow (AC: 1)
  - [x] Rozszerzyc widok `ClientsWorkspace` o liste decyzji aktywnego klienta
  - [x] Dodac formularz dodawania decyzji (tresc + submit) z czytelnym bledem i retry
  - [x] Pokazac metadane wpisu: data i autor
- [x] Pokryc scenariusze testami regresyjnymi i kontraktowymi (AC: 1, 2, 3)
  - [x] Unit testy service/repository dla scopingu klienta i rollback przy bledzie transakcji
  - [x] Testy routera tRPC dla `forbidden` przy cross-client access
  - [x] Testy UI/logiki listy+formularza decyzji (happy path + blad zapisu)

### Review Follow-ups (AI)

- [x] [AI-Review][HIGH] Dodac `assertSessionRole` do `listDecisions` i `createDecision` dla spojnej walidacji roli sesji [app/src/features/clients/clients.router.ts]
- [x] [AI-Review][HIGH] Wymusic `canEdit === true` przy `createDecision` (read-only membership -> `forbidden`) [app/src/features/clients/server/clients.logic.ts]
- [x] [AI-Review][MEDIUM] Dopisac testy kontraktowe dla endpointow decyzji (invalid role + scoping) [app/src/features/clients/clients-router.test.mjs, app/src/features/clients/server/clients-service.test.mjs]
- [x] [AI-Review][MEDIUM] Dodac test repository potwierdzajacy transakcyjny zapis i propagacje bledu (rollback path) [app/src/features/clients/server/clients-repository.test.mjs]

## Dev Notes

- Story 1.3 rozszerza gotowy feature `clients` ze Story 1.2 - implementuj przez rozbudowe istniejacych warstw, bez tworzenia rownoleglego feature.
- Obowiazuje architektura feature-based: kontrakty -> router -> service -> repository -> Prisma.
- Izolacja kontekstu klienta jest krytyczna: kazdy odczyt i zapis decyzji musi byc scoped do aktywnego klienta i membership usera.
- Zostawic spojny kontrakt bledow `code/message/details/requestId` dla API i logiki domenowej.
- DB naming: `snake_case`; API naming: `camelCase`; testy co-located obok implementacji.
- Nie dodawac nowych zaleznosci bez wyraznej potrzeby; wykorzystac obecny stack (tRPC, Prisma, Zod, React Query).
- Zakres Story 1.3 nie obejmuje pelnego modulu governance/reportingu - skupic sie na historii decyzji per klient.

### Project Structure Notes

- Preferowane miejsca zmian (zgodnie z aktualnym repo):
  - `app/prisma/schema.prisma` + nowa migracja w `app/prisma/migrations/*`
  - `app/src/features/clients/contracts/*`
  - `app/src/features/clients/server/*`
  - `app/src/features/clients/clients.router.ts` i `app/src/features/clients/clients.router.logic.ts`
  - `app/src/features/clients/components/*`
- Zachowac granice:
  - tRPC jako granica API UI -> backend
  - Tylko repository/service moze dotykac Prisma
  - Walidacje wejsc przez Zod przy punktach wejscia
- Nie przenosic tej historii do `features/audit/*`; to backlog dla pozniejszych historii governance.

### Previous Story Intelligence

- Story 1.2 ustalila wzorzec implementacji dla `clients`: dedykowane `contracts`, `server`, `components`, router i mapowanie bledow.
- Po code review usunieto fallback eskalujacy role do OWNER; zachowac ten standard rowniez dla decyzji strategicznych.
- Dziala juz mechanizm aktywnego klienta i sanitizacji `lastViewPath`; wykorzystac go zamiast budowania nowego kontekstu od zera.
- Testy `.test.mjs` dla logiki i kontraktow sa juz przyjete jako aktualny wzorzec w tym repo.

### Git Intelligence Summary

- Ostatnie commity koncentrowaly sie na domknieciu Story 1.1 i 1.2 oraz porzadkowaniu statusow sprint/story.
- Najnowsze zmiany rozszerzyly feature `clients` o RBAC, izolacje kontekstu i testy kontraktowe - Story 1.3 powinna kontynuowac ten kierunek bez zmian architektury.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.3-Historia-decyzji-strategicznych-per-klient]
- [Source: _bmad-output/planning-artifacts/epics.md#Epic-1-Client-Workspace-Context--Access-Foundation]
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication--Security]
- [Source: _bmad-output/planning-artifacts/architecture.md#API--Communication]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Patterns--Consistency-Rules]
- [Source: _bmad-output/implementation-artifacts/1-2-zarzadzanie-profilami-klientow-i-bezpieczne-przelaczanie-kontekstu.md#Completion-Notes-List]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- create-story auto-selected first backlog story from sprint-status: `1-3-historia-decyzji-strategicznych-per-klient`
- analyzed artifacts: epics, architecture, ux, previous story, and recent git history
- npx prisma generate
- npm run test
- npm run typecheck
- npm run lint

### Completion Notes List

- Story utworzona jako gotowa do implementacji (`ready-for-dev`) z AC, edge cases i planem taskow mapowanych do AC.
- Dodano guardrails dot. izolacji kontekstu, RBAC, transakcyjnosci i kontraktu `requestId`.
- Dodano wskazowki reuse istniejacego feature `clients`, aby uniknac dublowania architektury.
- Rozszerzono model danych o `StrategicDecision` i dodano migracje SQL z indeksami (`client_id`, `created_at`) oraz FK do `client_profiles` i `User`.
- Dodano warstwe repository/service dla listowania i zapisu decyzji strategicznych z egzekwowaniem membership i zgodnosci z aktywnym kontekstem klienta.
- Rozszerzono router tRPC i kontrakty Zod o `clients.listDecisions` i `clients.createDecision`.
- Rozszerzono UI `ClientsWorkspace` o formularz dodawania decyzji oraz liste historii decyzji aktywnego klienta (autor + data).
- Dodano testy logiki service/router/UI dla scenariuszy: success, forbidden przy `active_context_mismatch` i mapowanie bledow DB.
- Walidacje lokalne po implementacji: `npm run test`, `npm run typecheck`, `npm run lint` - wszystkie przeszly.
- Po code-review poprawiono HIGH/MEDIUM: walidacja roli w endpointach decyzji, wymuszenie canEdit przy createDecision, testy tRPC/service/repository.

### File List

- _bmad-output/implementation-artifacts/1-3-historia-decyzji-strategicznych-per-klient.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- app/generated/prisma/edge.js
- app/generated/prisma/index-browser.js
- app/generated/prisma/index.d.ts
- app/generated/prisma/index.js
- app/generated/prisma/package.json
- app/generated/prisma/schema.prisma
- app/generated/prisma/wasm.js
- app/prisma/migrations/20260202101500_story_1_3_strategic_decisions/migration.sql
- app/prisma/schema.prisma
- app/src/features/clients/clients-router.test.mjs
- app/src/features/clients/clients.router.ts
- app/src/features/clients/components/clients-workspace.logic.ts
- app/src/features/clients/components/clients-workspace.test.mjs
- app/src/features/clients/components/clients-workspace.tsx
- app/src/features/clients/components/clients-workspace.view.tsx
- app/src/features/clients/contracts/clients.schema.ts
- app/src/features/clients/server/clients-service.test.mjs
- app/src/features/clients/server/clients-repository.test.mjs
- app/src/features/clients/server/clients.logic.ts
- app/src/features/clients/server/clients.repository.ts
- app/src/features/clients/server/clients.service.ts

### Change Log

- 2026-02-02: Story 1.3 utworzona przez create-story i oznaczona jako `ready-for-dev`.
- 2026-02-02: Story 1.3 zaimplementowana i oznaczona jako `review`; dodano model/migracje decyzji strategicznych, API tRPC, UI historii decyzji i testy regresyjne.
- 2026-02-02: Code-review fixes HIGH/MEDIUM - dodano assertSessionRole dla endpointow decyzji, wymuszono uprawnienie edit dla createDecision, dopisano testy tRPC/service/repository.

## Senior Developer Review (AI)

### Review Date

2026-02-02

### Reviewer

Senior Developer (AI)

### Outcome

Approve

### Summary

- Zweryfikowano i naprawiono wszystkie zgloszone HIGH/MEDIUM.
- AC sa pokryte implementacja i testami; brak otwartych action items blokujacych.

### Action Items

- [x] [HIGH] Role guard dla endpointow `listDecisions/createDecision`
- [x] [HIGH] Enforcement `canEdit` dla `createDecision`
- [x] [MEDIUM] Testy kontraktowe dla scoping/forbidden w endpointach decyzji
- [x] [MEDIUM] Test repository dla transakcji i rollback path

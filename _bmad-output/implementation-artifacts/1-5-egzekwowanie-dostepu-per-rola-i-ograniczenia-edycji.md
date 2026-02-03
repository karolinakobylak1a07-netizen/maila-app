# Story 1.5: Egzekwowanie dostepu per rola i ograniczenia edycji

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Owner,
I want definiowac uprawnienia rol (Owner, Strategy, Content, Operations),
so that kazda rola widzi i edytuje tylko dozwolony zakres.

## Acceptance Criteria

1. Given uzytkownik ma przypisana role systemowa
   When otwiera aplikacje i probuje wejsc do modulu poza zakresem roli
   Then system ukrywa niedozwolone moduly lub blokuje dostep
   And edycja jest niedostepna tam, gdzie rola ma tylko podglad.
2. Given uzytkownik bez roli Owner probuje zmienic konfiguracje RBAC
   When wysyla zadanie aktualizacji uprawnien
   Then system odrzuca operacje kodem "forbidden"
   And zapisuje probe jako zdarzenie audytowe.
3. Given podczas ladowania modulow nie mozna pobrac polityk uprawnien
   When uzytkownik otwiera aplikacje
   Then system przechodzi w tryb bezpieczny (minimum uprawnien)
   And ukrywa akcje edycyjne do czasu poprawnego odczytu RBAC.

## Tasks / Subtasks

- [x] Rozszerzyc model danych i kontrakty RBAC o polityki modulow oraz uprawnienia akcji (AC: 1, 2, 3)
  - [x] Dodac/uzupelnic model Prisma dla polityk dostepu per rola i scope (view/edit/manage)
  - [x] Zapewnic migracje i seed bazowy dla rol: OWNER, STRATEGY, CONTENT, OPERATIONS
  - [x] Zdefiniowac kontrakty Zod dla odczytu polityk i aktualizacji polityk RBAC
- [x] Zaimplementowac warstwe serwisowa i router tRPC dla egzekwowania RBAC (AC: 1, 2, 3)
  - [x] Dodac guardy middleware/service, ktore mapuja brak uprawnien na `forbidden` z `requestId`
  - [x] Ograniczyc aktualizacje polityk RBAC do roli OWNER i logowac proby naruszen
  - [x] W przypadku braku polityk zwracac bezpieczny fallback (minimum uprawnien)
- [x] Dodac audit trail dla zmian i naruszen RBAC (AC: 2)
  - [x] Zapisac zdarzenia `rbac.policy.updated` i `rbac.policy.update_denied` do `audit_log`
  - [x] Logowac `requestId`, aktora, scope zmiany i timestamp dla kazdej operacji
  - [x] Utrzymac append-only charakter logow bez nadpisywania wpisow
- [x] Wdrozyc UI guardy dla widocznosci modulow i akcji edycyjnych (AC: 1, 3)
  - [x] Dodac mapowanie modulow na wymagane uprawnienia i ukrywac niedozwolone sekcje
  - [x] Zablokowac akcje edycyjne dla rol read-only w `clients`/discovery/decyzje
  - [x] Obsluzyc stan `forbidden` i fallback safe mode przy niedostepnych politykach
- [x] Pokryc scenariusze testami regresyjnymi i kontraktowymi (AC: 1, 2, 3)
  - [x] Testy router/service: owner-only update, denied update, safe fallback bez polityk
  - [x] Testy UI logic: ukrywanie modulow, disabled edit actions, forbidden messaging
  - [x] Testy audit: wpisy dla aktualizacji i nieudanych prob zmian RBAC

## Dev Notes

- Story 1.5 domyka fundament Epic 1 i musi reuse istniejacy feature `clients` oraz obecne guardy (`assertSessionRole`, `canEdit`) zamiast tworzenia nowego subsystemu autoryzacji.
- RBAC jest wymaganiem krytycznym: autoryzacja na granicy API + service + UI, bez fallbacku eskalujacego role.
- Przy braku polityk obowiazuje fail-safe: minimum uprawnien i brak akcji edycyjnych do czasu odczytu polityki.
- Format bledow i logow pozostaje spojny: `code/message/details/requestId`.
- Wszystkie zmiany utrzymac w architekturze feature-based oraz konwencji testow co-located.

### Project Structure Notes

- Preferowane miejsca zmian:
  - `app/prisma/schema.prisma` + nowa migracja `app/prisma/migrations/*`
  - `app/src/features/clients/contracts/*` (schematy RBAC)
  - `app/src/features/clients/server/*` (guardy, serwis i logika fallback)
  - `app/src/features/clients/clients.router.ts` i `app/src/features/clients/clients.router.logic.ts`
  - `app/src/features/clients/components/*` (UI guardy i stany forbidden/safe-mode)
- Zachowac granice architektoniczne:
  - walidacja wejsc przez Zod
  - Prisma tylko w repository/service
  - odpowiedzi API i bledy zgodne z kontraktem systemowym

### Previous Story Intelligence

- Story 1.4 ustalila standard walidacji operacji modyfikujacych przez `canEdit` oraz requestId-visible bledy w UI.
- Story 1.3 usunela fallback roli i potwierdzila, ze role musza byc jawnie walidowane (`assertSessionRole`) w endpointach.
- Story 1.2 wdrozyla izolacje kontekstu klienta i wzorzec zachowania path/context, ktory nalezy utrzymac przy guardach RBAC.

### Git Intelligence Summary

- Ostatnie commity domykaly sprint-status i statusy stories oraz wdrazaly kolejne historie w `features/clients`.
- Kierunek repo jest inkrementalny: rozbudowa jednego feature z mocnym naciskiem na testy kontraktowe i regresyjne.
- Story 1.5 powinna podazac tym samym podejsciem: rozszerzenie istniejacych warstw zamiast refaktoryzacji globalnej.

### Latest Tech Information

- Brak potrzeby zmiany stosu technologicznego dla tej historii.
- Pozostajemy przy: NextAuth/Auth.js v4, tRPC, Prisma, Zod, PostgreSQL 17 oraz modelu DB sessions.
- Priorytetem jest poprawna egzekucja RBAC i audytowalnosc, nie aktualizacja bibliotek.

### Project Context Reference

- Nie znaleziono `project-context.md` w repo; bazowac na `epics.md`, `architecture.md`, `prd.md` i `ux-structure-minimal.md`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.5-Egzekwowanie-dostepu-per-rola-i-ograniczenia-edycji]
- [Source: _bmad-output/planning-artifacts/epics.md#Epic-1-Client-Workspace-Context--Access-Foundation]
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication--Security]
- [Source: _bmad-output/planning-artifacts/architecture.md#API--Communication]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Patterns--Consistency-Rules]
- [Source: _bmad-output/planning-artifacts/ux-structure-minimal.md#View-Level-States-applies-to-every-main-view]
- [Source: _bmad-output/implementation-artifacts/1-4-discovery-onboarding-z-walidacja-brakow.md#Previous-Story-Intelligence]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- auto-selected first backlog story from `sprint-status.yaml`: `1-5-egzekwowanie-dostepu-per-rola-i-ograniczenia-edycji`
- analyzed artifacts: epics, architecture, ux, previous story, and recent git history
- npm run postinstall (prisma generate)
- npm test
- npm run typecheck
- npm run lint

### Completion Notes List

- Story 1.5 zaimplementowana end-to-end i oznaczona jako `review`.
- Dodano modele Prisma `RbacPolicy` i `AuditLog` oraz enum `RbacModule` z migracja SQL i seedem bazowych polityk RBAC dla 4 rol.
- Rozszerzono kontrakty Zod o `listRbacPolicies` i `updateRbacPolicy`.
- Dodano logike serwisowa RBAC: odczyt polityk, owner-only update polityk, fallback safe mode przy braku/awarii odczytu polityk.
- Dodano audyt zdarzen RBAC: `rbac.policy.updated` i `rbac.policy.update_denied` z `requestId`.
- Rozszerzono router tRPC o endpointy `getRbacPolicies` i `updateRbacPolicy` z walidacja roli sesji.
- Rozszerzono UI `ClientsWorkspace` o egzekwowanie widocznosci i edycji na podstawie polityk RBAC oraz obsluge safe mode/forbidden.
- Dodano testy regresyjne i kontraktowe dla routera, serwisu, repository i logiki UI dla nowych scenariuszy RBAC.
- Walidacje lokalne przeszly: `npm test`, `npm run typecheck`, `npm run lint`.
- Code review fixes (HIGH + MEDIUM): domknieto serwerowe egzekwowanie RBAC per modul, dodano UI ownera do edycji polityk, zablokowano formularz create/edit dla read-only, dodano audit przy failover safe mode i testy regresji UI.

### File List

- _bmad-output/implementation-artifacts/1-5-egzekwowanie-dostepu-per-rola-i-ograniczenia-edycji.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- app/generated/prisma/edge.js
- app/generated/prisma/index-browser.js
- app/generated/prisma/index.d.ts
- app/generated/prisma/index.js
- app/generated/prisma/package.json
- app/generated/prisma/schema.prisma
- app/generated/prisma/wasm.js
- app/prisma/migrations/20260202130000_story_1_5_rbac_policies/migration.sql
- app/prisma/schema.prisma
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

### Change Log

- 2026-02-02: Story 1.5 zaimplementowana i oznaczona jako `review`; dodano modele/polityki RBAC, audit trail, endpointy tRPC, guardy UI oraz testy regresyjne.
- 2026-02-02: Code review (AI) wykonal poprawki HIGH/MEDIUM i potwierdzil brak otwartych issue; status podniesiony do `done`.

## Senior Developer Review (AI)

### Review Date

2026-02-02

### Reviewer

Senior Developer (AI)

### Outcome

Approve

### Summary

- Zweryfikowano wdrozenie Story 1.5 po poprawkach.
- Potwierdzono egzekwowanie RBAC po stronie serwera i UI.
- Potwierdzono owner-only edycje polityk RBAC oraz audyt zdarzen.
- Testy, typecheck i lint przechodza po poprawkach.

### Action Items

- [x] [HIGH] Egzekwowanie RBAC po stronie serwera dla endpointow modulow strategy/discovery/clients.
- [x] [HIGH] Dodanie UI ownera do realnej edycji polityk RBAC (`updateRbacPolicy`).
- [x] [HIGH] Blokada create/edit formularza klienta dla rol read-only (nie tylko backend rejection).
- [x] [MEDIUM] Audit log przy fallback safe mode (`rbac.policy.load_failed`).
- [x] [MEDIUM] Rozszerzenie testow o regresje UI/RBAC dla blokady edycji.

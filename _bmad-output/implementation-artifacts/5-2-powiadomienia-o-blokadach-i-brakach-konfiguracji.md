# Story 5.2: Powiadomienia o blokadach i brakach konfiguracji

Status: done

## Story

As a Operations & Implementation Lead,
I want widziec powiadomienia o blokadach i brakach konfiguracji,
so that nie rozpoczynam wdrozenia z niekompletnymi danymi.

## Acceptance Criteria

1. Given istnieja aktywne blokady wdrozenia
   When otwieram modul implementacji
   Then system pokazuje powiadomienia typu `blocker`
   And status alertow jest `blocked`.
2. Given wykryto braki konfiguracji bez twardych blokad
   When pobieram alerty implementacyjne
   Then system zwraca alerty `configuration_gap`
   And status alertow jest `needs_configuration`.
3. Given brak blokad i brak brakow konfiguracji
   When pobieram alerty implementacyjne
   Then system zwraca pusty zestaw alertow
   And status alertow jest `ok`.

## Tasks / Subtasks

- [x] Zdefiniowac kontrakt alertow implementacyjnych i statusow (AC: 1, 2, 3)
- [x] Dodac endpoint `getImplementationAlerts` z kontrola dostepu IMPLEMENTATION (AC: 1, 2, 3)
- [x] Zbudowac agregacje alertow z sync, inventory i checklisty wdrozeniowej (AC: 1, 2)
- [x] Dodac integracje UI w workspace klienta (AC: 1, 2, 3)
- [x] Dodac testy kontraktu i serwisu oraz manual verify (AC: 1, 2, 3)

## Dev Notes

- Minimal-diff: wykorzystane istniejace dane (`sync`, `inventory`, `implementation checklist`) bez nowych tabel.
- Bez zmian funkcjonalnych w story 5.1 i poprzednich epikach.

## How to verify manually

1. Ustaw sync klienta w stanie blednym (np. `FAILED_AUTH`) i wejdz do workspace - karta "Blokady i braki konfiguracji" powinna pokazac status `blocked` oraz alert typu `blocker`.
2. Dla klienta z poprawnym sync, ale z elementem inventory o `itemStatus = GAP`, odswiez workspace - karta powinna pokazac status `needs_configuration` i alert `configuration_gap`.
3. Dla klienta bez blokad i bez gapow inventory odswiez workspace - karta powinna pokazac status `ok` i komunikat o braku aktywnych alertow.

## Changed Files

- `app/src/features/analysis/contracts/analysis.schema.ts`
- `app/src/features/analysis/contracts/analysis.schema.test.ts`
- `app/src/features/analysis/server/analysis.logic.ts`
- `app/src/features/analysis/server/analysis.service.test.ts`
- `app/src/features/analysis/analysis.router.ts`
- `app/src/features/analysis/components/implementation-alerts-card.tsx`
- `app/src/features/clients/components/clients-workspace.tsx`

## Minimal Review

- Ryzyko regresji: niskie, zmiany ograniczone do nowego odczytu alertow implementacyjnych i dodatkowej karty UI.
- Braki testow: brak osobnego testu komponentu `ImplementationAlertsCard`; kontrakty i logika serwisowa pokryte.
- Green checks: `npm test`, `npm run typecheck`, `npm run lint` (pre-existing warningi poza zakresem story).

## Completion Notes

- Story 5.2 dodaje agregacje alertow implementacyjnych z `sync`, `inventory` i `implementation checklist`.
- Statusy odpowiedzi: `blocked`, `needs_configuration`, `ok`.
- Workspace klienta pokazuje nowa karte z lista alertow i licznikami blokad/brakow.

## References

- [Source: _bmad-output/implementation-artifacts/5-1-checklisty-wdrozeniowe-z-trackingiem-realizacji.md]

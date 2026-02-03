# Story 5.1: Checklisty wdrozeniowe z trackingiem realizacji

Status: done

## Story

As a Operations & Implementation Lead,
I want prowadzic wdrozenia przez checklisty,
so that ograniczam pomylki i pomijanie krokow.

## Acceptance Criteria

1. Given istnieje plan flow i kampanii
   When tworzona jest checklista wdrozeniowa
   Then kazdy krok ma status oraz date wykonania
   And postep checklisty jest widoczny dla zespolu.
2. Given dwa uzytkowniki jednoczesnie aktualizuja ten sam krok checklisty
   When dochodzi do konfliktu wersji
   Then system wykrywa konflikt i wymaga odswiezenia danych
   And nie nadpisuje zmian bez swiadomego potwierdzenia.
3. Given zapis statusu kroku nie powiedzie sie
   When Operations aktualizuje checklist
   Then system zwraca blad transakcji
   And zachowuje poprzedni stan kroku bez niespojnosci dat wykonania.

## Tasks / Subtasks

- [x] Zdefiniowac kontrakt checklisty wdrozeniowej i statusow krokow (AC: 1, 2, 3)
- [x] Dodac endpointy generate/get latest/update step dla checklisty (AC: 1, 2, 3)
- [x] Dodac logike budowy checklisty na bazie flow plan + campaign calendar (AC: 1)
- [x] Dodac obsluge konfliktu wersji przez `expectedVersion` (AC: 2)
- [x] Dodac fallback `transaction_error` i brak czesciowego zapisu przy bledzie (AC: 3)
- [x] Dodac UI checklisty i testy kontraktu/serwisu (AC: 1, 2, 3)

## Dev Notes

- Minimal-diff, bez zmian funkcjonalnych w historiach 1.x-4.3.
- Reuse artefaktow z 3.2 (flow plan) i 3.3 (campaign calendar) jako zrodla krokow.
- Dostep edycyjny: rola z uprawnieniem `IMPLEMENTATION.canEdit`.

## How to verify manually

1. Dla klienta z wygenerowanym `FlowPlan` i `CampaignCalendar` kliknij "Generuj checkliste" i potwierdz, ze kroki maja status `pending`, pole `completedAt = null` oraz widoczny postep `0%`.
2. Otworz checkliste w dwoch kartach, w pierwszej zaktualizuj krok, a w drugiej zapisz stara wersje - potwierdz status `conflict_requires_refresh` i brak nadpisania kroku.
3. Zasymuluj blad zapisu (np. mock `createAuditLog` rzuca wyjatek) i potwierdz status `transaction_error` oraz zachowanie poprzedniego stanu kroku i dat wykonania.

## Changed Files

- `app/src/features/analysis/contracts/analysis.schema.ts`
- `app/src/features/analysis/contracts/analysis.schema.test.ts`
- `app/src/features/analysis/server/analysis.repository.ts`
- `app/src/features/analysis/server/analysis.logic.ts`
- `app/src/features/analysis/server/analysis.service.test.ts`
- `app/src/features/analysis/analysis.router.ts`
- `app/src/features/analysis/components/implementation-checklist-card.tsx`
- `app/src/features/clients/components/clients-workspace.tsx`

## Minimal Review

- Ryzyko regresji: niskie, zmiany zamkniete w nowym module checklisty implementacyjnej.
- Braki testow: brak osobnego testu UI komponentu `ImplementationChecklistCard`; backend i kontrakty pokryte testami.
- Green checks: `npm test`, `npm run typecheck`, `npm run lint` (pre-existing warningi poza zakresem story).

## Completion Notes

- Story 5.1 dodaje generowanie checklisty z flow + kampanii, tracking postepu i statusow krokow.
- Aktualizacja kroku wspiera optimistic concurrency przez `expectedVersion` i zwraca `conflict_requires_refresh` przy rozjechaniu wersji.
- Przy bledzie zapisu zwracany jest `transaction_error` bez utraty poprzedniego stanu checklisty.

## References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-5.1-Checklisty-wdrozeniowe-z-trackingiem-realizacji]

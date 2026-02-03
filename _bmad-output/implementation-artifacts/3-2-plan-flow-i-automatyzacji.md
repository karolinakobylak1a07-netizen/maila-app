# Story 3.2: Plan flow i automatyzacji

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Owner,
I want otrzymac plan flow zgodny ze strategia,
so that wdrozenie automatyzacji przebiega wedlug jasnych priorytetow.

## Acceptance Criteria

1. Given istnieje zatwierdzona strategia klienta
   When generowany jest plan flow
   Then plan zawiera liste flow, wyzwalacze, cele i priorytety
   And kazdy flow ma wskazany powod biznesowy zgodny ze strategia.
2. Given strategia nie ma statusu "zatwierdzona"
   When uruchamiane jest generowanie planu flow
   Then system odrzuca operacje jako niespelnione precondition
   And wskazuje wymagany krok zatwierdzenia strategii.
3. Given zapis planu flow do bazy nie powiedzie sie
   When system finalizuje plan
   Then zadanie oznaczane jest jako `failed_persist`
   And uzytkownik nie widzi czesciowo zapisanego planu.

## Tasks / Subtasks

- [ ] Zdefiniowac kontrakt planu flow i statusow (AC: 1, 2, 3)
- [ ] Dodac logike generowania planu flow na podstawie strategii (AC: 1, 2, 3)
- [ ] Dodac API do generowania i pobierania planu flow (AC: 1, 2, 3)
- [ ] Podpiac UI pod plan flow + statusy precondition/failed_persist (AC: 1, 2, 3)
- [ ] Dodac testy serwisu i kontraktow (AC: 1, 2, 3)

## Dev Notes

- Minimal-diff: reuse danych strategii i audit log, bez refactoru infra.
- Brak zmian w logice 2.x.

## How to verify manually

1. Dla klienta z wygenerowana strategia `ok` uruchom generowanie planu flow i potwierdz, ze zwraca liste flow z triggerami, celami i priorytetami.
2. Dla klienta bez strategii `ok` uruchom generowanie planu flow i potwierdz status `precondition_not_approved` oraz `requiredStep`.
3. Wymus `failed_persist` (np. blad zapisu audit log w testach/instrumentacji) i potwierdz, ze status to `failed_persist` oraz brak czesciowo zapisanego planu.

## Changed Files

- `app/src/features/analysis/contracts/analysis.schema.ts`
- `app/src/features/analysis/contracts/analysis.schema.test.ts`
- `app/src/features/analysis/server/analysis.repository.ts`
- `app/src/features/analysis/server/analysis.logic.ts`
- `app/src/features/analysis/server/analysis.service.test.ts`
- `app/src/features/analysis/analysis.router.ts`
- `app/src/features/analysis/components/flow-plan-card.tsx`
- `app/src/features/clients/components/clients-workspace.tsx`

## Minimal Review

- Ryzyka regresji: wykorzystanie wspolnych endpointow `analysis.*` i audit log (sprawdzone przez testy domeny i smoke w UI state rendering).
- Braki testow: brak testu komponentu `FlowPlanCard` w izolacji; logika biznesowa i kontrakty sa pokryte testami serwisu + schema.
- Status review: green `npm test`, `npm run typecheck`, `npm run lint` (lint tylko z pre-existing warnings).

## References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.2-Plan-flow-i-automatyzacji]

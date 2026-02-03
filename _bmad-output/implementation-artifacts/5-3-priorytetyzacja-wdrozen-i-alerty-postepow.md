# Story 5.3: Priorytetyzacja wdrozen i alerty postepow

Status: done

## Story

As a Operations & Implementation Lead,
I want otrzymywac alerty postepu wdrozen posortowane wg priorytetu i impactu,
so that zespol najpierw reaguje na najwazniejsze ryzyka wdrozeniowe.

## Acceptance Criteria

1. Given istnieja alerty wdrozeniowe o roznym priorytecie
   When system zwraca liste alertow
   Then alerty sa posortowane wg priority i impactScore malejaco
   And najwyzsze ryzyko jest widoczne na poczatku listy.
2. Given checklista i config gaps sa dostepne
   When generowane sa alerty postepu
   Then system przypisuje priorytet i impactScore na podstawie postepu checklisty i krytycznosci flow
   And status zbiorczy odzwierciedla poziom ryzyka (`blocked`, `needs_configuration`, `at_risk`, `ok`).
3. Given uzytkownik przeglada panel implementacji
   When otwiera sekcje alertow
   Then widzi ikony stanu/postepu oraz status alertu
   And moze szybko zidentyfikowac elementy wymagajace reakcji.

## Tasks / Subtasks

- [x] Rozszerzyc kontrakt alertow o pola `priority`, `impactScore`, `progressState` (AC: 1, 2, 3)
- [x] Dodac scoring i sortowanie alertow w backendzie (AC: 1, 2)
- [x] Powiazac config gap impact z najwyzszym priorytetem flow (AC: 2)
- [x] Dodac alert postepu checklisty i status `at_risk` (AC: 2)
- [x] Zaktualizowac UI alertow o ikony i informacje o postepie (AC: 3)
- [x] Dodac testy kontraktowe i testy serwisu dla scoringu/statusow/sortowania (AC: 1, 2, 3)

## Dev Notes

- Minimal-diff: rozszerzony zostal istniejacy endpoint `getImplementationAlerts` i karta alertow.
- Bez zmian funkcjonalnych poza obszarem Story 5.2/5.3.

## How to verify manually

1. Dla klienta z `FAILED_AUTH` w sync otworz workspace i sprawdz karte alertow: status `blocked`, alert z najwyzszym priorytetem `CRITICAL` i najwyzszym impact na gorze listy.
2. Dla klienta z config gap (`itemStatus = GAP`) i flow o priorytecie `CRITICAL` sprawdz, ze alert konfiguracji ma priorytet `CRITICAL` oraz wyzszy impact score niz alerty nizszego priorytetu.
3. Dla checklisty z niskim postepem (np. 20%) sprawdz alert typu `progress` z ikona stanu, `progressPercent`, `progressState` i statusem zbiorczym `at_risk`.

## Changed Files

- `app/src/features/analysis/contracts/analysis.schema.ts`
- `app/src/features/analysis/contracts/analysis.schema.test.ts`
- `app/src/features/analysis/server/analysis.logic.ts`
- `app/src/features/analysis/server/analysis.service.test.ts`
- `app/src/features/analysis/components/implementation-alerts-card.tsx`

## Minimal Review

- Ryzyko regresji: niskie, zmiany ograniczone do rozszerzenia istniejacego modelu alertow i ich prezentacji.
- Braki testow: brak osobnego testu UI komponentu `ImplementationAlertsCard`; kontrakty i logika serwisu pokryte.
- Green checks: `npm test`, `npm run typecheck`, `npm run lint` (pre-existing warningi poza zakresem story).

## Completion Notes

- Alerty implementacyjne maja teraz scoring: `priority`, `impactScore`, `progressState` oraz sortowanie malejace po priority/impact.
- Status zbiorczy wspiera dodatkowy stan `at_risk` dla ryzyka postepu checklisty.
- UI pokazuje ikony stanu i szczegoly postepu dla szybkiej triage.

## References

- [Source: _bmad-output/implementation-artifacts/5-2-powiadomienia-o-blokadach-i-brakach-konfiguracji.md]

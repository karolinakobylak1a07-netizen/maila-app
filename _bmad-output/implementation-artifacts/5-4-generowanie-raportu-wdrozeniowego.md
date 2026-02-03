# Story 5.4: Generowanie raportu wdrozeniowego

Status: done

## Story

As a Operations & Implementation Lead,
I want generowac agregowany raport wdrozeniowy,
so that moge szybko podsumowac stan realizacji, ryzyka i blokady.

## Acceptance Criteria

1. Given dostepne sa dane checklisty i alertow
   When wywoluje `getImplementationReport()`
   Then system zwraca raport markdown
   And raport zawiera sekcje: `meta`, `completed`, `at_risk`, `blockers`.
2. Given raport jest prezentowany do pobrania
   When klikam "Pobierz raport wdrozeniowy"
   Then system generuje markdown-ready output
   And pobiera plik `.md` z naglowkami, statusami i checkboxami.
3. Given dane checklisty i alertow odzwierciedlaja biezacy stan
   When raport jest generowany
   Then sekcje raportu sa zgodne ze statusem wdrozenia i scoringiem alertow.

## Tasks / Subtasks

- [x] Dodac kontrakt `getImplementationReport` i model raportu (AC: 1, 2, 3)
- [x] Dodac endpoint `getImplementationReport()` w routerze analityki (AC: 1)
- [x] Zaimplementowac agregacje raportu z checklisty i alertow (AC: 1, 3)
- [x] Generowac markdown-ready sekcje z checkboxami i statusami (AC: 1, 2)
- [x] Dodac UI przycisku "Pobierz raport wdrozeniowy" + pobieranie pliku (AC: 2)
- [x] Dodac testy kontraktowe i unitowe logiki raportu (AC: 1, 3)

## Dev Notes

- Minimal-diff: rozszerzenie istniejacego modulu implementacji (alerty + checklista), bez nowych tabel.
- Raport bazuje na danych z `getImplementationAlerts` oraz latest implementation checklist.

## How to verify manually

1. Otworz workspace klienta i kliknij "Pobierz raport wdrozeniowy" w karcie alertow implementacyjnych - powinien pobrac sie plik `.md`.
2. Sprawdz zawartosc pliku: sekcje `## meta`, `## completed`, `## at_risk`, `## blockers` oraz linie z checkboxami (`- [x]`, `- [ ]`).
3. Zmien statusy krokow checklisty i odswiez alerty, potem pobierz raport ponownie - potwierdz, ze sekcje i status raportu odzwierciedlaja aktualny stan.

## Changed Files

- `app/src/features/analysis/contracts/analysis.schema.ts`
- `app/src/features/analysis/contracts/analysis.schema.test.ts`
- `app/src/features/analysis/server/analysis.logic.ts`
- `app/src/features/analysis/server/analysis.service.test.ts`
- `app/src/features/analysis/analysis.router.ts`
- `app/src/features/analysis/components/implementation-alerts-card.tsx`
- `app/src/features/clients/components/clients-workspace.tsx`

## Minimal Review

- Ryzyko regresji: niskie, zmiany zamkniete w obszarze implementacji i raportowania markdown.
- Braki testow: brak dedykowanego testu UI przycisku download; pokryta logika kontraktowa i serwisowa.
- Green checks: `npm test`, `npm run typecheck`, `npm run lint` (pre-existing warningi poza zakresem story).

## Completion Notes

- Dodano endpoint `getImplementationReport()` zwracajacy raport markdown agregowany z checklisty i alertow.
- Raport zawiera sekcje `meta`, `completed`, `at_risk`, `blockers` z checkboxami i statusami.
- UI wspiera przycisk "Pobierz raport wdrozeniowy" i pobieranie gotowego pliku `.md`.

# Story 6.2: Analiza pokrycia produktu w flow i kampaniach

Status: done

## Story

As a Strategy & Insight Lead,
I want analizowac pokrycie produktow w flow i kampaniach,
so that szybko identyfikuje luki wdrozeniowe i obszary bez wsparcia komunikacji.

## Acceptance Criteria

1. Given istnieje kontekst produktu i dane flow/kampanii
   When pobieram analize pokrycia
   Then system zwraca wynik per produkt z dopasowaniami w flow i kampaniach
   And wylicza score pokrycia oraz status elementu.
2. Given czesc produktow nie ma pokrycia
   When system generuje analize
   Then status zbiorczy to `partial`
   And wynik zawiera listy brakow: `missingFlows` i `missingCampaigns`.
3. Given uzytkownik pracuje w module klienta
   When odswieza analize pokrycia
   Then widzi dane w dedykowanej karcie UI i aktualny status analizy.

## Tasks / Subtasks

- [x] Dodac kontrakt i endpoint `getProductCoverageAnalysis` (AC: 1, 2)
- [x] Dodac logike analizy pokrycia na bazie `auditProductContext`, `flowPlan`, `campaignCalendar` (AC: 1, 2)
- [x] Dodac score/status per produkt i listy brakow (AC: 2)
- [x] Dodac karte UI z odswiezaniem analizy pokrycia (AC: 3)
- [x] Dodac testy kontraktowe i testy serwisowe (AC: 1, 2)

## Dev Notes

- Minimal-diff: nowy endpoint read-only i nowa karta UI bez zmian istniejacych flow.
- Reuse danych z 6.1 oraz artefaktow flow/kampanii.

## How to verify manually

1. Dla klienta z produktami w discovery i pokryciem w flow/kampaniach odswiez karte "Pokrycie produktu w flow i kampaniach" i potwierdz status `ok` lub `partial` oraz score dla kazdego produktu.
2. Dla produktu bez dopasowania w flow sprawdz, ze trafia do `missingFlows`.
3. Dla produktu bez dopasowania w kampaniach sprawdz, ze trafia do `missingCampaigns`.

## Changed Files

- `app/src/features/analysis/contracts/analysis.schema.ts`
- `app/src/features/analysis/contracts/analysis.schema.test.ts`
- `app/src/features/analysis/server/analysis.logic.ts`
- `app/src/features/analysis/server/analysis.service.test.ts`
- `app/src/features/analysis/analysis.router.ts`
- `app/src/features/analysis/components/product-coverage-analysis-card.tsx`
- `app/src/features/clients/components/clients-workspace.tsx`

## Minimal Review

- Ryzyko regresji: niskie, zmiany ograniczone do nowej analizy read-only i osobnej karty UI.
- Braki testow: brak osobnego testu UI `ProductCoverageAnalysisCard`; backend i kontrakty pokryte.
- Green checks: `npm test`, `npm run typecheck`, `npm run lint` (pre-existing warningi poza zakresem story).

## Completion Notes

- Dodano endpoint `getProductCoverageAnalysis` z wyliczaniem pokrycia produktow w flow i kampaniach.
- Wprowadzono score/status per produkt i agregaty brakow (`missingFlows`, `missingCampaigns`).
- Dodano karte UI z manualnym odswiezaniem analizy pokrycia.

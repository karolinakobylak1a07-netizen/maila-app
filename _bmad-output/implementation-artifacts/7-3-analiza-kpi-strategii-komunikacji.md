# Story 7.3: Analiza KPI strategii komunikacji

Status: done

## Story

As a Owner/Strategy user,  
I want analizowac KPI strategii komunikacji per segment i rekomendacja,  
so that moge ocenic skutecznosc strategii emailowej na poziomie wykonawczym.

## Acceptance Criteria

1. Given dostepne sa eventy `campaign.performance.reported` i `flow.performance.reported`  
   When wywolam `getStrategyKPIAnalysis` z `clientId` i zakresem dat  
   Then system agreguje KPI: `openRate`, `clickRate`, `CVR`, `revenuePerRecipient`, `avgTimeToOpen`.
2. Given dostepna jest strategia i segmentacja  
   When analiza mapuje wyniki  
   Then powiazuje `segmentId` do segmentow oraz `draftId` do rekomendacji strategii.
3. Given analiza ma dane KPI  
   When buduje wynik  
   Then zwraca summary per segment i per recommendation, top performers oraz status `ok` / `low_engagement` / `missing_data`.
4. Given user pracuje w `clients-workspace`  
   When otwiera sekcje KPI strategii  
   Then widzi karte z metrykami i wynikami.

## Tasks / Subtasks

- [x] Dodac kontrakt `getStrategyKPIAnalysis` (input/output + statusy) (AC: 1, 3)
- [x] Dodac endpoint w routerze analysis (AC: 1)
- [x] Dodac logike agregacji KPI i mapowania segment/rekomendacja (AC: 1, 2, 3)
- [x] Dodac testy kontraktowe i testy logiki (AC: 1, 2, 3)
- [x] Dodac UI karte KPI strategii i podpiac do `clients-workspace` (AC: 4)

## Dev Notes

- Minimal-diff: rozszerzenie modulu analysis bez zmian w poprzednich flow.
- Agregacja opiera sie na audit log eventach:
  - `campaign.performance.reported`
  - `flow.performance.reported`

## How to verify manually

1. Otworz `clients-workspace` z aktywnym klientem.
2. Przewin do karty `KPI strategii komunikacji`.
3. Kliknij `Odswiez KPI`.
4. Potwierdz widok:
   - status analizy
   - overall KPI (`openRate`, `clickRate`, `CVR`, `revenuePerRecipient`, `avgTimeToOpen`)
   - top performers
   - summary segmentow i rekomendacji.
5. Zweryfikuj Request ID i brak bledow UI.

## Changed Files

- `app/src/features/analysis/contracts/analysis.schema.ts`
- `app/src/features/analysis/contracts/analysis.schema.test.ts`
- `app/src/features/analysis/analysis.router.ts`
- `app/src/features/analysis/server/analysis.logic.ts`
- `app/src/features/analysis/server/analysis.service.test.ts`
- `app/src/features/analysis/components/strategy-kpi-analysis-card.tsx`
- `app/src/features/clients/components/clients-workspace.tsx`
- `_bmad-output/planning-artifacts/epics.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Minimal Review

- Ryzyko regresji: srednie (nowa analiza i mapowanie KPI).
- Mitigacja: testy kontraktowe + testy logiki agregacji i statusow.
- Green checks: `npm test`, `npm run typecheck`, `npm run lint`.

## Completion Notes

- Dodano analize KPI strategii komunikacji per segment i rekomendacja.
- Dodano statusy `ok` / `low_engagement` / `missing_data` i top performers.
- Dodano nowa karte KPI strategii w `clients-workspace`.

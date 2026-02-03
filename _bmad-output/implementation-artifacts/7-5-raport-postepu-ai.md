# Story 7.5: Raport postepu AI

Status: done

## Story

As a Owner/Strategy user,  
I want zobaczyc raport pokazujacy czego AI nauczyla sie na bazie KPI i feedbacku,  
so that moge monitorowac jakosc uczenia i eksportowac wynik do PDF / Notion.

## Acceptance Criteria

1. Given dane KPI i feedback sa dostepne  
   When wywolam `getAIAchievementsReport`  
   Then otrzymam raport z metrykami uczenia AI i insightami.
2. Given raport jest generowany  
   When zwracany jest output  
   Then zawiera `campaignsAnalyzed`, `recommendationsUpdated`, `avgPerformanceScore`, `avgFeedbackScore`, `insights`, `exportLinks`.
3. Given brak danych  
   When raport jest uruchamiany  
   Then status to `insufficient_data` i raport zwraca fallback.
4. Given user jest w `clients-workspace`  
   When otworzy karte raportu AI  
   Then moze odswiezyc i wyeksportowac raport (PDF / Notion).

## Tasks / Subtasks

- [x] Dodac endpoint `getAIAchievementsReport` + kontrakty response/input (AC: 1, 2, 3)
- [x] Dodac logike agregacji KPI + feedback + updated recommendations (AC: 1, 2, 3)
- [x] Dodac eksport linkow (Notion przez adapter + PDF link) (AC: 2, 4)
- [x] Dodac UI karte raportu AI i eksport (AC: 4)
- [x] Dodac testy kontraktowe i testy logiki fallback/srednich/insightow (AC: 1, 2, 3)

## Dev Notes

- Minimal-diff: bazowanie na istniejacym modelu audit log i adapterze eksportu dokumentacji.
- Raport korzysta z eventow:
  - `campaign.performance.reported`
  - `feedback.recommendation.submitted`
  - `feedback.draft.submitted`
  - `strategy.recommendation.updated`

## How to verify manually

1. Otworz `clients-workspace` i wybierz klienta.
2. Przejdz do karty `Raport postepu AI`.
3. Kliknij `Odswiez raport` i sprawdz:
   - liczbe kampanii z feedbackiem,
   - liczbe zaktualizowanych rekomendacji,
   - srednie score,
   - insighty.
4. Wybierz `Eksport: PDF` i kliknij `Eksportuj raport`.
5. Powtorz dla `Eksport: Notion`.

## Changed Files

- `app/src/features/analysis/contracts/analysis.schema.ts`
- `app/src/features/analysis/contracts/analysis.schema.test.ts`
- `app/src/features/analysis/analysis.router.ts`
- `app/src/features/analysis/server/analysis.logic.ts`
- `app/src/features/analysis/server/analysis.service.test.ts`
- `app/src/features/analysis/components/ai-achievements-report-card.tsx`
- `app/src/features/clients/components/clients-workspace.tsx`
- `_bmad-output/planning-artifacts/epics.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Minimal Review

- Ryzyko regresji: srednie (nowy endpoint raportowy + eksport + UI karta).
- Mitigacja: testy kontraktowe i backendowe (normal path + insufficient_data).
- Green checks: `npm test`, `npm run typecheck`, `npm run lint`.

## Completion Notes

- Dodano raport postepu AI z metrykami uczenia i insightami.
- Dodano eksport linkow PDF / Notion oraz karte UI do odswiezania i eksportu.

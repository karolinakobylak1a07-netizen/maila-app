# Story 7.2: Analiza skutecznosci kampanii

Status: done

## Story

As a Owner/Strategy user,  
I want oceniac skutecznosc kampanii emailowych na podstawie KPI i feedbacku do rekomendacji/draftow,  
so that decyzje optymalizacyjne sa oparte o twarde wyniki i sygnaly od uzytkownikow.

## Acceptance Criteria

1. Given dostepne sa dane KPI kampanii i feedback  
   When wywolam `getCampaignEffectivenessAnalysis` z `clientId` i zakresem dat  
   Then system agreguje open rate, click rate, revenue, conversions i feedback.
2. Given analiza ma dane KPI i feedback  
   When system liczy wynik  
   Then zwraca `performance_score`, `feedback_score`, `blended_score` oraz status `successful` lub `needs_improvement`.
3. Given brakuje KPI lub feedbacku  
   When uruchamiam analize  
   Then status jest `insufficient_data` z insightami o brakach.
4. Given uzytkownik otwiera `clients-workspace`  
   When przechodzi do sekcji analizy  
   Then widzi karte skutecznosci kampanii z metrykami i wynikami score.

## Tasks / Subtasks

- [x] Dodac kontrakt `getCampaignEffectivenessAnalysis` + schema output (AC: 1, 2, 3)
- [x] Dodac endpoint w `analysis.router.ts` (AC: 1)
- [x] Dodac logike agregacji KPI + feedback i scoring statusu (AC: 1, 2, 3)
- [x] Dodac testy kontraktowe i testy logiki backendowej (AC: 1, 2, 3)
- [x] Dodac karte UI i podpiecie do `clients-workspace` (AC: 4)

## Dev Notes

- Minimal-diff: wykorzystanie istniejacych audit logow klienta.
- KPI sa odczytywane z eventow `campaign.performance.reported`.
- Feedback jest laczony z eventow `feedback.recommendation.submitted` i `feedback.draft.submitted`.

## How to verify manually

1. Otworz `clients-workspace` i wybierz aktywnego klienta.
2. Przewin do karty `Analiza skutecznosci kampanii`.
3. Kliknij `Odswiez analize`.
4. Potwierdz, ze karta pokazuje:
   - KPI: open rate, click rate, revenue, conversions
   - Feedback: liczbe ocen i sredni rating
   - Scores: performance_score, feedback_score, blended_score
   - Status: `successful` / `needs_improvement` / `insufficient_data`
5. Zweryfikuj date range (ostatnie 30 dni) i Request ID.

## Changed Files

- `app/src/features/analysis/contracts/analysis.schema.ts`
- `app/src/features/analysis/contracts/analysis.schema.test.ts`
- `app/src/features/analysis/analysis.router.ts`
- `app/src/features/analysis/server/analysis.logic.ts`
- `app/src/features/analysis/server/analysis.service.test.ts`
- `app/src/features/analysis/components/campaign-effectiveness-analysis-card.tsx`
- `app/src/features/clients/components/clients-workspace.tsx`
- `_bmad-output/planning-artifacts/epics.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Minimal Review

- Ryzyko regresji: niskie-srednie (nowy endpoint i nowa karta UI).
- Mitigacja: testy kontraktowe + testy agregacji/scoringu statusu.
- Green checks: `npm test`, `npm run typecheck`, `npm run lint`.

## Completion Notes

- Dodano analize skutecznosci kampanii oparta o KPI i feedback.
- Dodano scoring performance/feedback/blended oraz status sukcesu.
- Dodano karte UI z metrykami i wynikami do workspace klienta.

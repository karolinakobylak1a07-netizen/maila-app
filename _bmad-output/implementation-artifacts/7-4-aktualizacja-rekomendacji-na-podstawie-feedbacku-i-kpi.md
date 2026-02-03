# Story 7.4: Aktualizacja rekomendacji na podstawie feedbacku i KPI

Status: done

## Story

As a Owner/Strategy user,  
I want aktualizowac rekomendacje strategii na bazie KPI i feedbacku,  
so that aktywne rekomendacje sa stale dopasowane do realnego performance.

## Acceptance Criteria

1. Given dostepny jest feedback i KPI strategii  
   When wywolam `updateStrategyRecommendations`  
   Then system liczy `blended_score = performance_score + feedback_score`.
2. Given blended score jest ponizej progu  
   When uruchomiona zostanie aktualizacja  
   Then stara wersja rekomendacji jest deprecated (`manualAccept=false`)  
   And tworzona jest nowa wersja aktywna (v2/v3...) z ulepszeniami.
3. Given blended score jest powyzej progu  
   When uruchomie endpoint  
   Then system zwraca `no_change` bez tworzenia nowej wersji.
4. Given user pracuje w `clients-workspace`  
   When kliknie `Zaktualizuj rekomendacje` i potwierdzi  
   Then widzi spinner i komunikat o wyniku.

## Tasks / Subtasks

- [x] Dodac endpoint `updateStrategyRecommendations` i kontrakty (AC: 1, 2, 3)
- [x] Dodac logike agregacji KPI + feedback i prog decyzyjny (AC: 1, 2, 3)
- [x] Dodac deprecacje starej wersji i zapis nowej aktywnej wersji przez audit log (AC: 2)
- [x] Dodac testy kontraktowe i logiki backendowej (AC: 1, 2, 3)
- [x] Dodac UI: przycisk z potwierdzeniem, spinnerem i komunikatem (AC: 4)

## Dev Notes

- Minimal-diff: aktualizacja oparta o istniejacy model audit log.
- Eventy audytu:
  - `strategy.recommendation.deprecated_due_to_performance`
  - `strategy.recommendation.updated`

## How to verify manually

1. Otworz `clients-workspace` dla aktywnego klienta.
2. W sekcji rekomendacji kliknij `Zaktualizuj rekomendacje`.
3. Potwierdz dialog.
4. Sprawdz spinner przy przycisku i komunikat koncowy:
   - aktualizacja wykonana, albo
   - brak zmian (wynik powyzej progu).
5. Zweryfikuj wpisy audit log dla deprecacji/aktualizacji rekomendacji.

## Changed Files

- `app/src/features/analysis/contracts/analysis.schema.ts`
- `app/src/features/analysis/contracts/analysis.schema.test.ts`
- `app/src/features/analysis/analysis.router.ts`
- `app/src/features/analysis/server/analysis.logic.ts`
- `app/src/features/analysis/server/analysis.service.test.ts`
- `app/src/features/analysis/components/communication-improvement-recommendations-card.tsx`
- `app/src/features/clients/components/clients-workspace.tsx`
- `_bmad-output/planning-artifacts/epics.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Minimal Review

- Ryzyko regresji: srednie (nowa logika wersjonowania rekomendacji).
- Mitigacja: testy scenariuszy `updated` i `no_change` + walidacje kontraktowe.
- Green checks: `npm test`, `npm run typecheck`, `npm run lint`.

## Completion Notes

- Dodano automatyczna aktualizacje rekomendacji na podstawie KPI i feedbacku.
- Wprowadzono deprecacje starej wersji i aktywacje nowej wersji rekomendacji.
- Dodano akcje UI do uruchomienia aktualizacji z potwierdzeniem i feedbackiem dla usera.

# Story 6.5: Audit log i manualne bramki akceptacji rekomendacji

Status: done

## Story

As a Strategy & Insight Lead,  
I want miec pelny audit trail zmian strategii/planow/rekomendacji i reczna akceptacje draftow/rekomendacji,  
so that decyzje sa kontrolowalne i mozliwe do odtworzenia.

## Acceptance Criteria

1. Given zapis strategii/planu/rekomendacji  
   When tworzony jest wpis audit  
   Then zawiera pola `timestamp`, `userId`, `actionType`, `artifactId`, `diff`.
2. Given uzytkownik uruchamia generowanie draftu/rekomendacji z `manualAccept=true`  
   When operacja konczy sie poprawnie  
   Then system zapisuje dodatkowy wpis manualnej akceptacji w audit logu.
3. Given kontrakty i regresja  
   When uruchamiam testy  
   Then waliduja nowe pola audit i scenariusze manual acceptance.

## Tasks / Subtasks

- [x] Rozszerzyc inputy o `manualAccept` dla draftow i rekomendacji (AC: 2)
- [x] Dodac wzbogacanie `details` w audit log o wymagane pola i `diff` (AC: 1)
- [x] Dodac manual acceptance log dla draftu i rekomendacji (AC: 2)
- [x] Dodac testy kontraktowe inputow i regresyjne serwisu (AC: 3)

## Dev Notes

- Minimal-diff: bez zmian modelu DB `audit_log`; wymagane pola sa trzymane w `details`.
- Zachowano kompatybilnosc parserow artefaktow (dodatkowe pola nie psuja odczytu).

## How to verify manually

1. Wywolaj `generateEmailDraft` z `manualAccept=true`.
2. Potwierdz w audit logu dwa wpisy:
   - `content.email_draft.generated`
   - `content.email_draft.manual_accept`
3. Sprawdz, ze `details` zawiera: `timestamp`, `userId`, `actionType`, `artifactId`, `diff`.
4. Wywolaj `getCommunicationImprovementRecommendations` z `manualAccept=true`.
5. Potwierdz wpis `strategy.recommendation.manual_accept` z tym samym zestawem pol.

## Changed Files

- `app/src/features/analysis/contracts/analysis.schema.ts`
- `app/src/features/analysis/contracts/analysis.schema.test.ts`
- `app/src/features/analysis/server/analysis.logic.ts`
- `app/src/features/analysis/server/analysis.service.test.ts`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Minimal Review

- Ryzyko regresji: niskie-srednie (rozszerzenie inputow i logiki auditowania).
- Mitigacja: testy regresyjne dla strategy/flow/manual acceptance.
- Green checks: `npm test`, `npm run typecheck`, `npm run lint`.

## Completion Notes

- Dodano `manualAccept` do draftow i rekomendacji.
- Dodano standaryzowane pola audit w `details`: `timestamp`, `userId`, `actionType`, `artifactId`, `diff`.
- Dodano dodatkowe wpisy audit dla manualnej akceptacji draftu i rekomendacji.

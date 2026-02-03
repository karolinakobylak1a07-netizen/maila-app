# Story 7.1: Zbieranie feedbacku do rekomendacji

Status: done

## Story

As a Owner/Strategy/Content user,  
I want zapisywac ocene i komentarz dla rekomendacji oraz draftow,  
so that system zbiera sygnaly o jakosci, trafnosci i przydatnosci generowanych wynikow.

## Acceptance Criteria

1. Given uzytkownik widzi rekomendacje lub draft  
   When zapisuje feedback (ocena 1-5 + komentarz)  
   Then backend zapisuje dane powiazane z `clientId`, `artifactId`, `requestId`, `userId`, `timestamp`.
2. Given payload feedbacku jest niepoprawny  
   When endpoint otrzymuje dane  
   Then zwracany jest blad walidacji i nic nie jest zapisywane.
3. Given uzytkownik pracuje w `clients-workspace`  
   When otwiera karte rekomendacji lub draftu  
   Then ma widoczne UI do oceny (1-5) i komentarza oraz moze zapisac feedback.

## Tasks / Subtasks

- [x] Dodac kontrakt feedbacku (input/output + enum targetType) (AC: 1, 2)
- [x] Dodac endpoint `submitArtifactFeedback` w analysis router (AC: 1, 2)
- [x] Dodac logike backendowa zapisu feedbacku do audit log (AC: 1)
- [x] Dodac UI feedbacku dla draftow i rekomendacji (AC: 3)
- [x] Dodac testy kontraktowe i testy logiki backendowej (AC: 1, 2)

## Dev Notes

- Minimal-diff: brak zmian w poprzednich flow; feedback zapisuje sie jako wpis audit log z eventami `feedback.*.submitted`.
- Powiazanie z artefaktem: przez `targetType` + `artifactId` + opcjonalny `sourceRequestId`.

## How to verify manually

1. Otworz `clients-workspace` z aktywnym klientem.
2. W sekcji `Draft email z briefu` ustaw ocene 1-5, dodaj komentarz i kliknij `Zapisz feedback`.
3. W sekcji `Personalizacja draftow` powtorz zapis feedbacku.
4. W sekcji `Rekomendacje usprawnien komunikacji` zapisz feedback dla dowolnej pozycji.
5. Potwierdz komunikat `Feedback zapisany.` i brak bledu UI.
6. (Backend) zweryfikuj wpisy audit log z eventami:
   - `feedback.draft.submitted`
   - `feedback.recommendation.submitted`

## Changed Files

- `app/src/features/analysis/contracts/analysis.schema.ts`
- `app/src/features/analysis/contracts/analysis.schema.test.ts`
- `app/src/features/analysis/analysis.router.ts`
- `app/src/features/analysis/server/analysis.logic.ts`
- `app/src/features/analysis/server/analysis.service.test.ts`
- `app/src/features/analysis/components/artifact-feedback-form.tsx`
- `app/src/features/analysis/components/email-draft-card.tsx`
- `app/src/features/analysis/components/personalized-email-draft-card.tsx`
- `app/src/features/analysis/components/communication-improvement-recommendations-card.tsx`
- `app/src/features/clients/components/clients-workspace.tsx`
- `_bmad-output/planning-artifacts/epics.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Minimal Review

- Ryzyko regresji: niskie-srednie (nowa mutacja + dodatkowe UI controls).
- Mitigacja: testy kontraktowe schema i testy serwisowe zapisu feedbacku.
- Green checks: `npm test`, `npm run typecheck`, `npm run lint`.

## Completion Notes

- Dodano endpoint i kontrakt do zbierania feedbacku dla rekomendacji i draftow.
- Dodano UI feedbacku (ocena 1-5 + komentarz) na kartach rekomendacji i draftow.
- Dane feedbacku sa zapisywane z `timestamp`, `userId`, `rating`, `comment` i powiazaniem do artefaktu.

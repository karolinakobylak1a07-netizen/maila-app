# Story 4.4: Remediacja epiku 4

Status: done

## Story

As a Engineering Team,
I want usunac ryzyka wykryte przez Deep Audit Epiku 4,
so that generowanie draftow i personalizacji jest odporne na race conditions i bledy AI.

## Acceptance Criteria

1. Krytyczne sciezki `generateEmailDraft` i `generatePersonalizedEmailDraft` sa zabezpieczone lockiem na kliencie/kontekscie briefu i nie duplikuja wersji.
2. Walidacje danych wejsciowych i wyjsciowych AI wykrywaja nieprawidlowe payloady i zwracaja kontrolowany blad domenowy.
3. Dodany test regresyjny pokrywa concurrency draftow oraz brak kolizji wersji.
4. Fallbacki timeout/error AI i zapisu audit log utrzymuja spojnosc artefaktow.

## Tasks / Subtasks

- [x] Dodac lock content-generation i wykorzystac go w 4.2/4.3 (AC: 1, 4)
- [x] Zabezpieczyc wyliczanie `nextVersion` i odczyty latest danych wewnatrz locka (AC: 1)
- [x] Dodac walidacje latest strategy/segment proposal dla content flow (AC: 2)
- [x] Dodac detekcje AI timeout/error i walidacje invalid AI output (AC: 2, 4)
- [x] Dodac walidacje pustych pol draftu z envelope domenowym (AC: 2)
- [x] Dodac test regresyjny concurrency oraz test invalid AI payload (AC: 3)

## Dev Notes

- Minimal-diff: poprawki tylko w obszarze story 4.2/4.3 i wspolnych helperow.
- TODO techniczny: pelne `SELECT FOR UPDATE` wymaga przepiecia repo na tx-scoped client (oznaczone komentarzem w repo).

## How to verify manually

1. Wywolaj dwa rownolegle requesty `generateEmailDraft` dla tego samego klienta/briefu i potwierdz brak kolizji wersji.
2. Wywolaj `generateEmailDraft` z requestId zawierajacym `invalid_ai_output` i potwierdz blad walidacji.
3. Wywolaj `generateEmailDraft` z requestId zawierajacym `ai_timeout` oraz `ai_error` i potwierdz odpowiednio `timed_out` i `failed_generation`.
4. Wymus blad `createAuditLog` i potwierdz brak publikacji draftu `ok` (fallback `failed_generation`).

## Changed Files

- `app/src/features/analysis/server/analysis.repository.ts`
- `app/src/features/analysis/server/analysis.logic.ts`
- `app/src/features/analysis/server/analysis.service.test.ts`

## Minimal Review

- Ryzyko regresji: srednie-niskie, zmiany dotykaja core flow content generation, ale z lockami i testami regresji.
- Braki testow: brak testu e2e rownoleglych requestow HTTP; pokryte testy serwisowe konkurencji.
- Green checks: `npm test`, `npm run typecheck`, `npm run lint` (pre-existing warningi poza zakresem story).

## Completion Notes

- Wprowadzono lockowanie content generation i sekwencyjne wersjonowanie draftow.
- Dodano twardsza walidacje strategy/segment i outputu AI.
- Dodano regresyjny test konkurencji i walidacji invalid AI payload.

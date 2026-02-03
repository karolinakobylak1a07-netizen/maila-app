# Story 4.2: Generowanie draftow maili z briefu

Status: done

## Story

As a Content & Messaging Lead,
I want tworzyc drafty emaili na podstawie briefu,
so that szybciej przygotowuje tresci gotowe do review.

## Acceptance Criteria

1. Given istnieje brief komunikacyjny
   When uruchamiam generowanie draftu
   Then draft zawiera temat, preheader, body i CTA
   And draft jest przypisany do segmentu i celu kampanii.
2. Given generowanie draftu AI przekracza limit czasu
   When zadanie nie konczy sie w SLA
   Then system zwraca status `timed_out`
   And pozwala na ponowienie bez utraty briefu wejsciowego.
3. Given API modelu zwraca blad lub pusty wynik
   When system finalizuje draft
   Then nie tworzy artefaktu draftu w stanie `gotowy`
   And oznacza zadanie jako `failed_generation` z requestId.

## Tasks / Subtasks

- [ ] Zdefiniowac kontrakt draftu email i statusow (AC: 1, 2, 3)
- [ ] Dodac endpointy generate/get latest draft (AC: 1, 2, 3)
- [ ] Zaimplementowac generowanie draftu z latest communication brief (AC: 1)
- [ ] Dodac status `timed_out` z mozliwoscia ponowienia (AC: 2)
- [ ] Dodac status `failed_generation` przy bledzie finalizacji (AC: 3)
- [ ] Dodac integracje UI i testy kontraktu/serwisu (AC: 1, 2, 3)

## Dev Notes

- Minimal-diff, bez zmian w historiach 1.x-4.1.
- Reuse `content.communication_brief.generated` jako precondition.

## How to verify manually

1. Wygeneruj najpierw brief (status `ok`), potem kliknij "Generuj draft" i potwierdz pola: temat, preheader, body, CTA oraz przypisanie do `campaignGoal` i `segment`.
2. Wywolaj `generateEmailDraft` z `requestId` zawierajacym `timeout` i potwierdz status `timed_out` oraz `retryable=true`.
3. Zasymuluj blad zapisu audit log i potwierdz status `failed_generation` z zachowanym `requestId`, bez artefaktu w statusie `ok`.

## Changed Files

- `app/src/features/analysis/contracts/analysis.schema.ts`
- `app/src/features/analysis/contracts/analysis.schema.test.ts`
- `app/src/features/analysis/server/analysis.repository.ts`
- `app/src/features/analysis/server/analysis.logic.ts`
- `app/src/features/analysis/server/analysis.service.test.ts`
- `app/src/features/analysis/analysis.router.ts`
- `app/src/features/analysis/components/email-draft-card.tsx`
- `app/src/features/clients/components/clients-workspace.tsx`

## Minimal Review

- Ryzyko regresji: niskie, zmiany zamkniete w nowym przeplywie draftu opartym o brief 4.1.
- Braki testow: brak osobnego testu komponentu `EmailDraftCard`; backend i kontrakty sa pokryte.
- Green checks: `npm test`, `npm run typecheck`, `npm run lint` (lint z pre-existing warnings poza 4.2).

## Completion Notes

- Story 4.2 dodaje generowanie draftu email z briefu z trzema statusami: `ok`, `timed_out`, `failed_generation`.
- Retry po timeout zachowuje powiazanie z briefem (`briefRequestId`) bez utraty kontekstu wejsciowego.

## References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-4.2-Generowanie-draftow-maili-z-briefu]

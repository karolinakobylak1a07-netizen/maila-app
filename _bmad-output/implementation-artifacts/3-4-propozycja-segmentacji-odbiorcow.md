# Story 3.4: Propozycja segmentacji odbiorcow

Status: done

## Story

As a Strategy & Insight Lead,
I want otrzymac segmentacje zgodna z celami,
so that komunikacja jest trafna i dopasowana do etapu klienta.

## Acceptance Criteria

1. Given zdefiniowane cele i dane klienta
   When system generuje segmenty
   Then kazdy segment zawiera kryteria wejscia i cel segmentu
   And segmenty mozna wykorzystac bezposrednio w planie kampanii i flow.
2. Given dane segmentacyjne sa niekompletne lub przestarzale
   When system generuje propozycje segmentow
   Then oznacza wynik jako `requires_data_refresh`
   And podaje minimalny zestaw danych potrzebnych do finalizacji.
3. Given wystepuje blad zapisu segmentow
   When uzytkownik zatwierdza segmentacje
   Then system wycofuje transakcje i zwraca komunikat bledu
   And nie publikuje czesciowej listy segmentow.

## Tasks / Subtasks

- [ ] Zdefiniowac kontrakt segment proposal i statusow (AC: 1, 2, 3)
- [ ] Zaimplementowac generowanie segmentow z kryteriami i celem (AC: 1)
- [ ] Dodac status `requires_data_refresh` z brakujacymi danymi (AC: 2)
- [ ] Dodac fallback `failed_persist` bez publikacji czesciowej listy (AC: 3)
- [ ] Dodac endpointy get/generate oraz integracje w workspace UI (AC: 1, 2)
- [ ] Pokryc testami kontrakt i serwis (AC: 1, 2, 3)

## Dev Notes

- Minimal-diff, bez zmian w story 1.x-3.3.
- Reuse istniejacych danych discovery/strategy i schematu audit log.

## How to verify manually

1. W workspace klienta kliknij "Generuj segmentacje" i potwierdz status `ok` oraz segmenty z polami: `entryCriteria`, `objective`, `campaignUseCase`, `flowUseCase`.
2. Dla klienta z niepelnymi danymi (brak segmentow discovery lub nieaktualny sync) wygeneruj segmentacje i potwierdz status `requires_data_refresh` z lista `missingData`.
3. Zasymuluj blad zapisu audit log i potwierdz status `failed_persist` oraz brak czesciowej publikacji segmentow.

## Changed Files

- `app/src/features/analysis/contracts/analysis.schema.ts`
- `app/src/features/analysis/contracts/analysis.schema.test.ts`
- `app/src/features/analysis/server/analysis.repository.ts`
- `app/src/features/analysis/server/analysis.logic.ts`
- `app/src/features/analysis/server/analysis.service.test.ts`
- `app/src/features/analysis/analysis.router.ts`
- `app/src/features/analysis/components/segment-proposal-card.tsx`
- `app/src/features/clients/components/clients-workspace.tsx`

## Minimal Review

- Ryzyko regresji: niskie, scope ograniczony do nowych endpointow `analysis.generate/getLatestSegmentProposal` i nowej karty UI.
- Braki testow: brak testu komponentu `SegmentProposalCard`; kontrakt + logika backend pokryte testami jednostkowymi.
- Green checks: `npm test`, `npm run typecheck`, `npm run lint` (lint ma tylko pre-existing warnings poza story 3.4).

## Completion Notes

- Story 3.4 dostarcza generowanie segmentacji z trzema statusami: `ok`, `requires_data_refresh`, `failed_persist`.
- Integracja UI jest podlaczona w `ClientsWorkspace` i pokazuje requestId, status oraz dane segmentow/missingData.

## References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.4-Propozycja-segmentacji-odbiorcow]

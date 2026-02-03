# Story 4.3: Personalizacja draftow na bazie segmentow

Status: done

## Story

As a Content & Messaging Lead,
I want personalizowac drafty email na bazie segmentow,
so that tresc i komunikat sa dopasowane do konkretnej grupy odbiorcow.

## Acceptance Criteria

1. Given istnieje draft email i segmenty klienta
   When uruchamiam personalizacje draftu
   Then system tworzy warianty per segment z dopasowanym tematem, preheaderem, body i CTA
   And wynik jest zapisany jako artefakt klienta.
2. Given brak segmentow lub brak danych segmentacyjnych
   When system probuje personalizowac draft
   Then zwraca status `segment_data_missing`
   And nie publikuje wariantow.
3. Given finalizacja personalizacji nie powiedzie sie
   When system zapisuje wynik
   Then zwraca status `failed_generation` z requestId
   And nie publikuje wariantow w statusie `ok`.

## Tasks / Subtasks

- [ ] Zdefiniowac kontrakt personalizacji draftu i statusow (AC: 1, 2, 3)
- [ ] Dodac endpointy generate/get latest personalizacji (AC: 1, 2, 3)
- [ ] Dodac logike personalizacji na bazie latest draft + segment proposal (AC: 1)
- [ ] Dodac obsluge braku segmentow (AC: 2)
- [ ] Dodac fallback `failed_generation` na bledzie finalizacji (AC: 3)
- [ ] Dodac integracje UI + testy kontraktu i serwisu (AC: 1, 2, 3)

## Dev Notes

- Minimal-diff, bez zmian w historiach 1.x-4.2.
- Reuse artefaktow z 3.4 (segment proposal) i 4.2 (email draft).

## How to verify manually

1. Wygeneruj draft email (4.2) i segmentacje (3.4), potem kliknij "Personalizuj draft" i potwierdz status `ok` oraz wiele wariantow per segment.
2. Usun/wyzeruj segment proposal i wywolaj personalizacje - potwierdz status `segment_data_missing` oraz pusta liste wariantow.
3. Zasymuluj blad zapisu audit log i potwierdz status `failed_generation` z `requestId` i bez publikacji wariantow.

## Changed Files

- `app/src/features/analysis/contracts/analysis.schema.ts`
- `app/src/features/analysis/contracts/analysis.schema.test.ts`
- `app/src/features/analysis/server/analysis.repository.ts`
- `app/src/features/analysis/server/analysis.logic.ts`
- `app/src/features/analysis/server/analysis.service.test.ts`
- `app/src/features/analysis/analysis.router.ts`
- `app/src/features/analysis/components/personalized-email-draft-card.tsx`
- `app/src/features/clients/components/clients-workspace.tsx`

## Minimal Review

- Ryzyko regresji: niskie, zmiany ograniczone do nowego przeplywu personalizacji draftu.
- Braki testow: brak osobnego testu UI komponentu `PersonalizedEmailDraftCard`; logika i kontrakty backend pokryte testami.
- Green checks: `npm test`, `npm run typecheck`, `npm run lint` (lint z pre-existing warnings poza 4.3).

## Completion Notes

- Story 4.3 dodaje personalizacje draftu 4.2 na bazie segmentow 3.4 z artefaktem wariantow per segment.
- Statusy finalne personalizacji: `ok`, `segment_data_missing`, `failed_generation`.

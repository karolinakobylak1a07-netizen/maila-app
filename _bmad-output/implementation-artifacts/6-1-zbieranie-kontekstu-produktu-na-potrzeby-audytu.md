# Story 6.1: Zbieranie kontekstu produktu na potrzeby audytu

Status: done

## Story

As a Strategy & Insight Lead,
I want miec zebrany kontekst produktu do audytu,
so that raportowanie i rekomendacje opieraja sie na kompletnych danych biznesowych.

## Acceptance Criteria

1. Given istnieje discovery klienta
   When pobieram kontekst produktu do audytu
   Then system zwraca oferte, grupe docelowa, glowne produkty i aktualne flow
   And dane zawieraja cele i segmenty klienta.
2. Given brak czesci danych discovery
   When pobieram kontekst audytu
   Then system zwraca status `missing_context`
   And wskazuje brakujace pola wymagajace uzupelnienia.
3. Given uzytkownik pracuje w module klienta
   When odswieza kontekst produktu
   Then widzi aktualny status i dane w dedykowanej karcie UI.

## Tasks / Subtasks

- [x] Dodac kontrakt i endpoint `getAuditProductContext` (AC: 1, 2)
- [x] Dodac odczyt danych discovery pod audyt w repozytorium (AC: 1)
- [x] Dodac logike statusu `ok` / `missing_context` z missingFields (AC: 2)
- [x] Dodac karte UI z odswiezaniem kontekstu produktu (AC: 3)
- [x] Dodac testy kontraktowe i testy serwisowe (AC: 1, 2)

## Dev Notes

- Minimal-diff: nowy endpoint read-only oraz nowa karta UI bez zmian istniejących przepływów.
- Reuse danych z discovery onboarding; brak nowych tabel i migracji.

## How to verify manually

1. Otworz klienta z uzupelnionym discovery i sprawdz karte "Kontekst produktu do audytu" - status powinien byc `ok` i pola wypelnione.
2. Wyczysc/pozostaw puste pola `offer`, `targetAudience`, `mainProducts` lub `currentFlows` i odswiez karte - status powinien przejsc na `missing_context` z lista brakujacych pol.
3. Kliknij "Odswiez kontekst" i potwierdz, ze karta pokazuje aktualne dane i `Request ID`.

## Changed Files

- `app/src/features/analysis/contracts/analysis.schema.ts`
- `app/src/features/analysis/contracts/analysis.schema.test.ts`
- `app/src/features/analysis/server/analysis.repository.ts`
- `app/src/features/analysis/server/analysis.logic.ts`
- `app/src/features/analysis/server/analysis.service.test.ts`
- `app/src/features/analysis/analysis.router.ts`
- `app/src/features/analysis/components/audit-product-context-card.tsx`
- `app/src/features/clients/components/clients-workspace.tsx`

## Minimal Review

- Ryzyko regresji: niskie, zmiany ograniczone do nowego endpointu i read-only UI.
- Braki testow: brak osobnego testu UI komponentu `AuditProductContextCard`; backend i kontrakty pokryte.
- Green checks: `npm test`, `npm run typecheck`, `npm run lint` (pre-existing warningi poza zakresem story).

## Completion Notes

- Dodano endpoint `getAuditProductContext` agregujacy dane discovery pod audyt produktu.
- Wprowadzono statusy `ok` / `missing_context` i `missingFields` dla brakow danych.
- Dodano karte UI z manualnym odswiezaniem kontekstu audytu.

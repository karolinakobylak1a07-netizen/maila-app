# Story 6.3: Rekomendacje usprawnien komunikacji produktowej

Status: done

## Story

As a Strategy & Insight Lead,  
I want otrzymywac rekomendacje usprawnien komunikacji produktowej na bazie pokrycia flow i kampanii,  
so that moge szybciej priorytetyzowac dzialania wdrozeniowe.

## Acceptance Criteria

1. Given istnieje kontekst produktu i dane flow/kampanii  
   When pobieram rekomendacje usprawnien  
   Then system zwraca liste rekomendacji per produkt z priorytetem i impact score.
2. Given produkty maja rozny poziom pokrycia  
   When system buduje rekomendacje  
   Then wynik jest sortowany malejaco po `priority` i `impactScore`.
3. Given uzytkownik pracuje w module klienta  
   When odswieza rekomendacje  
   Then widzi dedykowana karte UI z ikonami statusu i lista akcji.

## Tasks / Subtasks

- [x] Dodac kontrakt i endpoint `getCommunicationImprovementRecommendations` (AC: 1, 2)
- [x] Dodac logike backendowa oparta o context + flow + campaign coverage (AC: 1, 2)
- [x] Dodac scoring i sortowanie rekomendacji po priority/impact (AC: 2)
- [x] Dodac karte UI rekomendacji z odswiezaniem i ikonami statusu (AC: 3)
- [x] Dodac testy kontraktowe i serwisowe (AC: 1, 2)

## Dev Notes

- Minimal-diff: nowy endpoint read-only oraz nowa karta UI, bez zmian istniejacych flow.
- Reuse danych z 6.1 i 6.2 (kontekst produktu + analiza pokrycia).

## How to verify manually

1. Otworz widok klienta i przejdz do sekcji "Rekomendacje usprawnien komunikacji".
2. Sprawdz, ze rekomendacje sa widoczne i zawieraja: status, priority, impact score, action.
3. Kliknij "Odswiez rekomendacje" i potwierdz ponowne pobranie danych oraz aktualny requestId.
4. Dla klienta bez `mainProducts` potwierdz status `missing_context` i pusta liste rekomendacji.

## Changed Files

- `app/src/features/analysis/analysis.router.ts`
- `app/src/features/analysis/contracts/analysis.schema.ts`
- `app/src/features/analysis/contracts/analysis.schema.test.ts`
- `app/src/features/analysis/server/analysis.logic.ts`
- `app/src/features/analysis/server/analysis.service.test.ts`
- `app/src/features/analysis/components/communication-improvement-recommendations-card.tsx`
- `app/src/features/clients/components/clients-workspace.tsx`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Minimal Review

- Ryzyko regresji: niskie; dodany nowy endpoint read-only i osobna karta UI.
- Braki testow: brak dedykowanego testu komponentu UI.
- Green checks: `npm test`, `npm run typecheck`, `npm run lint`.

## Completion Notes

- Dodano endpoint rekomendacji usprawnien komunikacji z priorytetem i impact score.
- Dodano sortowanie rekomendacji po priority/impact oraz fallback `missing_context`.
- Dodano karte UI z odswiezaniem i ikonami statusu.

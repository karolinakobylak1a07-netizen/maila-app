# Story 6.7: Eksport do narzedzi pracy Notion / Google Docs

Status: done

## Story

As an Operations/Delivery Lead,  
I want eksportowac dokumentacje wdrozeniowa do Notion lub Google Docs,  
so that zespol i klient moga pracowac na wspolnym dokumencie w zewnetrznym narzedziu.

## Acceptance Criteria

1. Given dokumentacja wdrozeniowa jest dostepna  
   When wywolam `exportImplementationDocumentation` z target `notion` lub `google_docs`  
   Then otrzymam URL utworzonego dokumentu.
2. Given API wybranego dostawcy zwraca blad  
   When endpoint probuje eksportu  
   Then stosuje retry i fallback na drugi target.
3. Given użytkownik pracuje w clients-workspace  
   When wybierze target z dropdown "Eksportuj do..." i kliknie eksport  
   Then dokument otworzy sie pod zwroconym URL.

## Tasks / Subtasks

- [x] Dodac kontrakty exportu (target/input/output) do `analysis.schema.ts` (AC: 1)
- [x] Dodac endpoint `exportImplementationDocumentation` w routerze (AC: 1)
- [x] Dodac adapter eksportu Notion/Google Docs (mock API integration) (AC: 1)
- [x] Dodac retry + fallback przy bledzie API (AC: 2)
- [x] Zintegrowac dropdown eksportu i akcje w `clients-workspace` (AC: 3)
- [x] Dodac testy kontraktowe i testy logiki eksportu (mock adapterow) (AC: 1, 2)

## Dev Notes

- Minimal-diff: wykorzystanie dokumentacji z 6.6, bez zmian istniejacego formatu dokumentu.
- Eksport oparty o adapter (`documentation-export-adapter`) z kontraktami Notion/Google Docs.

## How to verify manually

1. Otworz klienta w `clients-workspace`.
2. W sekcji wdrozen wybierz target w dropdown:
   - `Eksport: Notion` lub `Eksport: Google Docs`.
3. Kliknij `Eksportuj do...`.
4. Potwierdz, ze otwiera sie URL dokumentu zwrocony przez endpoint.
5. (Test fallback) zasymuluj blad API targetu i sprawdz, ze eksport przechodzi przez fallback target.

## Changed Files

- `app/src/features/analysis/contracts/analysis.schema.ts`
- `app/src/features/analysis/contracts/analysis.schema.test.ts`
- `app/src/features/analysis/analysis.router.ts`
- `app/src/features/analysis/server/analysis.logic.ts`
- `app/src/features/analysis/server/analysis.repository.ts`
- `app/src/features/analysis/server/analysis.service.ts`
- `app/src/features/analysis/server/analysis.service.test.ts`
- `app/src/features/analysis/components/implementation-alerts-card.tsx`
- `app/src/features/clients/components/clients-workspace.tsx`
- `app/src/server/integrations/documentation/documentation-export-adapter.ts`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Minimal Review

- Ryzyko regresji: niskie-srednie (nowy endpoint eksportu + UI control).
- Mitigacja: testy logiczne eksportu (success i fallback), testy kontraktowe.
- Green checks: `npm test`, `npm run typecheck`, `npm run lint`.

## Completion Notes

- Dodano eksport dokumentacji do Notion i Google Docs przez nowy endpoint.
- Dodano retry/fallback dla bledow API eksportu.
- Dodano dropdown i akcje eksportu w `clients-workspace`.

# Story 6.4: Wersjonowanie strategii, planow i tresci

Status: done

## Story

As a Strategy & Insight Lead,  
I want kazda nowa wersja strategii, planu i tresci miala spojne metadane wersji,  
so that mozna jednoznacznie przechodzic po historii zmian i ich zrodle.

## Acceptance Criteria

1. Given generowana jest nowa wersja strategii/planu/tresci  
   When rekord jest budowany  
   Then zawiera `versionMeta` z polami `timestamp`, `author`, `source`, `type`.
2. Given istnieja starsze rekordy bez metadanych wersji  
   When system je odczytuje  
   Then parser zwraca bezpieczny fallback `versionMeta` bez errora.
3. Given testy kontraktowe i serwisowe  
   When uruchamiam suite  
   Then waliduja obecne metadane wersji dla strategy/flow/plan.

## Tasks / Subtasks

- [x] Dodac wspolny kontrakt `artifactVersionMetaSchema` i `versionedArtifactTypeSchema` (AC: 1)
- [x] Dodac `versionMeta` do strategii, planow i tresci (AC: 1)
- [x] Uzupelnic buildery o `author` i `source` oraz automatyczny `timestamp` (AC: 1)
- [x] Dodac fallback parsera dla legacy rekordow bez `versionMeta` (AC: 2)
- [x] Dodac testy kontraktowe i serwisowe dla metadanych wersji (AC: 3)

## Dev Notes

- Minimal-diff: rozszerzenie kontraktu i builderow, bez refaktoryzacji istniejacych flow.
- `type` ograniczone do: `strategy`, `flow`, `plan` zgodnie z wymaganiem.

## How to verify manually

1. Wygeneruj strategie (`generateEmailStrategy`) i sprawdz, ze odpowiedz zawiera `versionMeta` z `type: strategy`.
2. Wygeneruj flow plan (`generateFlowPlan`) i sprawdz `versionMeta.type: flow`.
3. Wygeneruj draft email (`generateEmailDraft`) i sprawdz `versionMeta.type: plan`.
4. Potwierdz, ze `author` jest ustawiony na ID uzytkownika wykonujacego akcje.
5. Odczytaj starszy rekord (bez `versionMeta`) i potwierdz, ze endpoint zwraca fallback zamiast bledu.

## Changed Files

- `app/src/features/analysis/contracts/analysis.schema.ts`
- `app/src/features/analysis/contracts/analysis.schema.test.ts`
- `app/src/features/analysis/server/analysis.logic.ts`
- `app/src/features/analysis/server/analysis.service.test.ts`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Minimal Review

- Ryzyko regresji: niskie-srednie (dotyka kontraktow wielu artefaktow).
- Mitigacja: fallback parsera dla legacy rekordow + testy kontraktowe i serwisowe.
- Green checks: `npm test`, `npm run typecheck`, `npm run lint`.

## Completion Notes

- Dodano spojne metadane wersji `versionMeta` dla strategii, flow, planow i tresci.
- Dodano fallback parsera dla rekordow historycznych bez metadanych.
- Potwierdzono poprawne dzialanie przez testy kontraktowe i serwisowe.

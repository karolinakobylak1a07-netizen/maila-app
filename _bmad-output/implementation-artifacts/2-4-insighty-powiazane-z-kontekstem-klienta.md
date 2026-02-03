# Story 2.4: Insighty powiazane z kontekstem klienta

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Strategy & Insight Lead,
I want otrzymywac wnioski zrodlowe powiazane z kontekstem marki,
so that rekomendacje nie sa generyczne i daja sie od razu wdrozyc.

## Acceptance Criteria

1. Given istnieje kontekst klienta i wyniki analizy
   When system generuje insighty
   Then kazdy insight zawiera zrodlo danych i rekomendowane dzialanie
   And insight odnosi sie do celow i priorytetow konkretnego klienta.
2. Given brakuje kluczowego kontekstu marki (cele/segmenty/priorytety)
   When system generuje insighty
   Then oznacza rekomendacje jako `draft_low_confidence`
   And wymaga uzupelnienia kontekstu przed finalna publikacja.
3. Given zrodla danych sa sprzeczne lub niespojne czasowo
   When system buduje insight
   Then wskazuje konflikt zrodel w uzasadnieniu
   And nie generuje jednoznacznej rekomendacji bez walidacji czlowieka.

## Tasks / Subtasks

- [ ] Zdefiniowac model insightu i kontrakt danych (AC: 1, 2, 3)
  - [ ] Rozszerzyc `analysis.schema` o model `InsightItem` (title, rationale, dataSources, recommendedAction, confidence, status, requestId, lastSyncRequestId)
  - [ ] Dodac statusy zgodne z AC (`ok`, `draft_low_confidence`, `source_conflict`)
  - [ ] Utrzymac error envelope `code/message/details/requestId` zgodnie z poprzednimi historiami
- [ ] Zaimplementowac logike generowania insightow w domain `analysis` (AC: 1, 2, 3)
  - [ ] Oprzec wejscie o wyniki Story 2.3 (priorytety) + kontekst klienta (cele/priorytety)
  - [ ] Dodac gate dla brakujacego kontekstu -> `draft_low_confidence`
  - [ ] Dodac detekcje konfliktu zrodel danych i jawne uzasadnienie konfliktu
- [ ] Udostepnic API do pobierania insightow (AC: 1, 2, 3)
  - [ ] Dodac procedure `analysis.getContextInsights`
  - [ ] Zwrocic `data` + `meta` (generatedAt, lastSyncRequestId, requestId)
  - [ ] Zachowac RBAC jak dla analysis (Owner/Strategy w kontekscie klienta)
- [ ] Podpiac UI pod insighty i statusy (AC: 1, 2, 3)
  - [ ] Dodac liste insightow z widocznym zrodlem i rekomendowanym dzialaniem
  - [ ] Wyswietlac ostrzezenia dla `draft_low_confidence` oraz `source_conflict`
  - [ ] Pokazywac `requestId` i `lastSyncRequestId` dla diagnostyki
- [ ] Pokryc testami regresyjnymi (AC: 1, 2, 3)
  - [ ] Testy serwisu: poprawny insight z danymi i kontekstem
  - [ ] Testy edge: brak kontekstu -> `draft_low_confidence`
  - [ ] Testy edge: konflikt zrodel -> status konfliktu + brak jednoznacznej rekomendacji

## Dev Notes

- Story 2.4 ma konsumowac wyniki z 2.3 i nie duplikowac logiki rankingowej.
- Granice: logika i kontrakty w `features/analysis/*`; UI tylko konsumuje gotowe dane.
- Dla diagnostyki utrzymac `requestId` i `lastSyncRequestId` w odpowiedzi i bledach.

### Business Rules Clarification (AC Notes)

- **Minimalny kontekst klienta (AC2 / `draft_low_confidence`)**
  - Minimalne wymagania do statusu `ok`: `linkedClientGoals` (min. 1) oraz `linkedClientPriorities` (min. 1).
  - Pola opcjonalne (np. primary KPI, ton komunikacji, polityka promek) moga byc wykorzystane do lepszej jakosci insightu, ale nie blokuja statusu `ok`.
  - Jezeli brakuje ktoregokolwiek z dwoch wymaganych pol, insight dostaje status `draft_low_confidence` i uzupelnia `missingContext[]` o konkretne brakujace pola.

- **Definicja konfliktu zrodel (AC3 / `source_conflict`)**
  - Konflikt wykrywamy dla tego samego pola/kategorii w oknie `ostatnie 30 dni` (albo od `lastSync` gdy zakres jest krotszy).
  - Warunek konfliktu: roznica miedzy dwoma zrodlami przekracza `> 20%` wzglednie lub prog absolutny dla malych metryk.
  - `conflictDetails` musi zawierac: `fields[]`, `sourceA`, `sourceB`, `reason` (z liczbowym uzasadnieniem typu `delta > threshold`).
  - Hierarchia zrodel przy interpretacji: `sync inventory` > `cached insights` > `UI-input`.

- **Precedence statusow (gdy wystepuje kilka problemow)**
  - `source_conflict` ma pierwszenstwo przed `draft_low_confidence`.
  - Gdy oba warunki wystapia jednoczesnie, finalny status to `source_conflict`, ale `missingContext[]` nadal zwracamy diagnostycznie.

- **Actionability policy (`recommendedAction` / `actionability`)**
  - `status=ok`: `recommendedAction` jest wymagane i konkretne; `actionability="actionable"`.
  - `status=draft_low_confidence`: `recommendedAction` moze byc propozycja warunkowa; `actionability="needs_human_validation"` + wskazanie brakow kontekstu.
  - `status=source_conflict`: `recommendedAction=null`; `actionability="needs_human_validation"` + instrukcja walidacji w `rationale` lub `conflictDetails`.

### Project Structure Notes

- Preferowane miejsca zmian:
  - `app/src/features/analysis/contracts/analysis.schema.ts`
  - `app/src/features/analysis/server/analysis.logic.ts` lub `analysis.service.ts`
  - `app/src/features/analysis/analysis.router.ts`
  - `app/src/features/analysis/components/*` (nowy panel insightow)
- Trzymac feature-first i spojnosc z istniejacym API `analysis.*`.

## Previous Story Intelligence

- Story 2.1 dostarczyla wiarygodny sync status + inventory oraz `lastSyncRequestId`.
- Story 2.2 dostarczyla raport luk i wzorzec statusow/ostrzezen dla stalego lub czesciowego sync.
- Story 2.3 dostarczyla priorytetyzacje optymalizacji i deterministyczne rankingi; to jest glowny input do insightow.

## Git Intelligence Summary

- Ostatnie zmiany sa prowadzone inkrementalnie w `features/analysis` + testach.
- Utrzymac minimal-diff podejscie i nie ruszac niezaleznych modulow poza zakresem AC.

## Latest Tech Information

- Stack pozostaje bez zmian: Next.js App Router + tRPC + Prisma + Zod + NextAuth.
- Brak potrzeby migracji bibliotek; priorytet to logika domenowa i kontrakt API.

## Project Context Reference

- Brak `project-context.md`; kontekst na podstawie artefaktow planowania i historii 2.1-2.3.

## References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.4-Insighty-powiazane-z-kontekstem-klienta]
- [Source: _bmad-output/planning-artifacts/prd.md#3)-Audyt-i-analiza-Klaviyo]
- [Source: _bmad-output/planning-artifacts/prd.md#Functional-Requirements]
- [Source: _bmad-output/planning-artifacts/architecture.md#API--Communication]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Patterns--Consistency-Rules]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure--Boundaries]
- [Source: _bmad-output/implementation-artifacts/2-2-raport-luk-konfiguracji.md#Dev-Notes]
- [Source: _bmad-output/implementation-artifacts/2-3-wykrywanie-slabych-ogniw-i-priorytetyzacja-optymalizacji.md#Dev-Notes]

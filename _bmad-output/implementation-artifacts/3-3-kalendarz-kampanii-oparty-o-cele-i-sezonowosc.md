# Story 3.3: Kalendarz kampanii oparty o cele i sezonowosc

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Owner,
I want zaplanowac kampanie na osi czasu,
so that zespol realizuje komunikacje regularnie i zgodnie z sezonowoscia.

## Acceptance Criteria

1. Given strategia i dane sezonowe sa dostepne
   When tworze kalendarz kampanii
   Then system proponuje minimum 4 tygodnie planu
   And kazda kampania ma cel, segment i typ kampanii.
2. Given brak danych sezonowosci dla klienta
   When system tworzy kalendarz kampanii
   Then generuje plan bazowy z oznaczeniem `seasonality_missing`
   And wymaga recznej walidacji przed publikacja.
3. Given uzytkownik bez uprawnien edycji kampanii probuje zapisac kalendarz
   When wysyla zmiany
   Then system odrzuca zapis kodem `forbidden`
   And pozostawia ostatnia zatwierdzona wersje bez zmian.

## Tasks / Subtasks

- [ ] Zdefiniowac kontrakt kalendarza kampanii i statusow (AC: 1, 2, 3)
- [ ] Zaimplementowac generowanie kalendarza (minimum 4 tygodnie) (AC: 1, 2)
- [ ] Dodac obsluge `seasonality_missing` i recznej walidacji (AC: 2)
- [ ] Dodac egzekwowanie RBAC dla zapisu kalendarza (AC: 3)
- [ ] Pokryc testami kontrakt, serwis i edge-case’y (AC: 1, 2, 3)

## Dev Notes

- Reuse danych strategii/segmentow z Epic 3.
- Minimal-diff, bez zmian w historiach 1.x-2.x.

## How to verify manually

1. Dla klienta z strategia `ok` i uzupelniona sezonowoscia wygeneruj kalendarz i potwierdz min. 4 tygodnie z polami: cel, segment, typ kampanii.
2. Dla klienta bez sezonowosci wygeneruj kalendarz i potwierdz status `seasonality_missing` oraz `requiresManualValidation=true`.
3. Dla roli bez `canEdit` w module AUDIT wywolaj `generateCampaignCalendar` i potwierdz `forbidden` bez zapisu nowej wersji.

## Changed Files

- `app/src/features/analysis/contracts/analysis.schema.ts`
- `app/src/features/analysis/contracts/analysis.schema.test.ts`
- `app/src/features/analysis/server/analysis.repository.ts`
- `app/src/features/analysis/server/analysis.logic.ts`
- `app/src/features/analysis/server/analysis.service.test.ts`
- `app/src/features/analysis/analysis.router.ts`
- `app/src/features/analysis/components/campaign-calendar-card.tsx`
- `app/src/features/clients/components/clients-workspace.tsx`

## Minimal Review

- Ryzyko regresji: niskie, scope ograniczony do nowych endpointow `analysis.generate/getLatestCampaignCalendar`.
- Brakujace testy: brak izolowanego testu komponentu `CampaignCalendarCard`; logika i kontrakty pokryte testami serwisu/schematu.
- Green checks: `npm test`, `npm run typecheck`, `npm run lint` (lint z pre-existing warnings only).

## References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.3-Kalendarz-kampanii-oparty-o-cele-i-sezonowosc]

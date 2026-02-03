# Story 3.3: Kalendarz kampanii oparty o cele i sezonowosc

Status: ready-for-dev

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

## References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.3-Kalendarz-kampanii-oparty-o-cele-i-sezonowosc]

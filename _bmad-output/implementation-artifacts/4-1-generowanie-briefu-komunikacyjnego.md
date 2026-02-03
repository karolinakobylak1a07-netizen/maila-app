# Story 4.1: Generowanie briefu komunikacyjnego

Status: done

## Story

As a Content & Messaging Lead,
I want generowac briefy kampanii,
so that copywriting startuje z jasnym celem i kontekstem.

## Acceptance Criteria

1. Given istnieje strategia i wybrany segment
   When tworze brief komunikacyjny
   Then brief zawiera cel, segment, ton, priorytet i KPI
   And brief jest zapisywany jako artefakt klienta.
2. Given nie wybrano segmentu lub celu kampanii
   When Content Lead probuje utworzyc brief
   Then system blokuje generowanie briefu
   And wskazuje brakujace pola wymagane.
3. Given uzytkownik bez roli Content/Owner probuje edytowac brief
   When wysyla zmiany
   Then system odrzuca operacje kodem `forbidden`
   And zapisuje probe w audit log.

## Tasks / Subtasks

- [ ] Zdefiniowac kontrakt briefu i statusow (AC: 1, 2, 3)
- [ ] Dodac endpointy generate/get latest brief (AC: 1, 2, 3)
- [ ] Zaimplementowac logike generowania briefu na bazie strategii (AC: 1)
- [ ] Dodac walidacje brakujacych pol (AC: 2)
- [ ] Dodac logowanie prob forbidden do audit log (AC: 3)
- [ ] Dodac integracje UI w workspace + testy kontraktu i serwisu (AC: 1, 2, 3)

## Dev Notes

- Minimal-diff, bez zmian w historiach 1.x-3.x.
- Reuse wzorca artefaktow opartych o `audit_log`.

## How to verify manually

1. W workspace ustaw `Cel kampanii` i `Segment`, kliknij "Generuj brief" i potwierdz status `ok` oraz pola: cel, segment, ton, priorytet, KPI.
2. Wyslij pusty cel lub segment i potwierdz status `missing_required_fields` z lista brakujacych pol.
3. Wykonaj `generateCommunicationBrief` rola inna niz Content/Owner i potwierdz `forbidden` oraz wpis `content.communication_brief.forbidden_attempt` w audit log.

## Changed Files

- `app/src/features/analysis/contracts/analysis.schema.ts`
- `app/src/features/analysis/contracts/analysis.schema.test.ts`
- `app/src/features/analysis/server/analysis.repository.ts`
- `app/src/features/analysis/server/analysis.logic.ts`
- `app/src/features/analysis/server/analysis.service.test.ts`
- `app/src/features/analysis/analysis.router.ts`
- `app/src/features/analysis/components/communication-brief-card.tsx`
- `app/src/features/clients/components/clients-workspace.tsx`

## Minimal Review

- Ryzyko regresji: niskie, nowy zakres ograniczony do endpointow briefu i nowej karty UI.
- Braki testow: brak osobnego testu UI komponentu `CommunicationBriefCard`; logika i kontrakty pokryte testami backend/schematu.
- Green checks: `npm test`, `npm run typecheck`, `npm run lint` (lint tylko z pre-existing warnings poza story 4.1).

## Completion Notes

- Story 4.1 dodaje generowanie briefu komunikacyjnego jako artefaktu klienta z walidacja brakujacych pol.
- Dostep do edycji briefu jest ograniczony do rol Content/Owner, a proby niedozwolone sa logowane w audit log.

## References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-4.1-Generowanie-briefu-komunikacyjnego]

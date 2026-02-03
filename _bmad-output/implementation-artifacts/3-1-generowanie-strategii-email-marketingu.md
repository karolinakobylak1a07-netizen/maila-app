# Story 3.1: Generowanie strategii email marketingu

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Owner,
I want wygenerowac ustrukturyzowana strategie email,
so that zespol pracuje na jednym, spojnym kierunku.

## Acceptance Criteria

1. Given klient ma uzupelniony discovery i audyt
   When uruchamiam generowanie strategii
   Then dokument strategii zawiera cele, segmenty, ton, priorytety i KPI
   And strategia jest przypisana do konkretnego klienta i wersji.
2. Given discovery lub audyt nie sa kompletne
   When Owner uruchamia generowanie strategii
   Then system blokuje operacje i wskazuje brakujace warunki wejsciowe
   And nie tworzy niepelnej wersji strategii.
3. Given generowanie strategii trwa dluzej niz SLA
   When przekroczony zostaje limit czasu zadania
   Then system zapisuje status `in_progress_or_timeout`
   And umozliwia bezpieczne wznowienie bez duplikowania wersji.

## Tasks / Subtasks

- [ ] Zdefiniowac kontrakt strategii i statusow zadania (AC: 1, 2, 3)
  - [ ] Dodac model odpowiedzi strategii (cele, segmenty, ton, priorytety, KPI, version)
  - [ ] Dodac statusy zadania `ok` / `in_progress_or_timeout` / `blocked_preconditions`
  - [ ] Zachowac envelope bledu `code/message/details/requestId`
- [ ] Zaimplementowac logike generowania strategii w domenie strategy/analysis (AC: 1, 2, 3)
  - [ ] Wejscie: discovery + wyniki audytu/insightow (bez duplikowania logiki 2.1-2.4)
  - [ ] Precondition gate dla brakujacego discovery lub audytu
  - [ ] Obsluga timeoutu z mozliwoscia bezpiecznego wznowienia
- [ ] Udostepnic API do generowania i pobierania strategii (AC: 1, 2, 3)
  - [ ] Procedure do startu generowania strategii
  - [ ] Procedure do pobrania ostatniej wersji i statusu
  - [ ] RBAC: tylko Owner/Strategy dla klienta
- [ ] Podpiac UI pod strategia i statusy (AC: 1, 2, 3)
  - [ ] Widok dokumentu strategii z wersja i timestamp
  - [ ] Widok blokady preconditions z czytelnymi brakami
  - [ ] Widok statusu timeout/in-progress z retry
- [ ] Pokryc testami regresyjnymi (AC: 1, 2, 3)
  - [ ] Happy path: kompletna strategia z wersjonowaniem
  - [ ] Gate: brak discovery/audytu -> `blocked_preconditions`
  - [ ] Timeout: `in_progress_or_timeout` + bezpieczne wznowienie

## Dev Notes

- Story 3.1 konsumuje artefakty z historii 2.1-2.4 i nie modyfikuje ich logiki.
- Priorytet: kontrakt, preconditions, timeout-resume i wersjonowanie strategii.
- Utrzymac requestId w sukcesie i bledzie dla diagnostyki.

### Project Structure Notes

- Preferowane miejsca zmian:
  - `app/src/features/strategy/contracts/*`
  - `app/src/features/strategy/server/*`
  - `app/src/features/strategy/*.router.ts` lub `analysis.router.ts` (jesli strategia pozostaje w analysis domain)
  - `app/src/features/strategy/components/*`
- Zachowac minimal-diff i zgodnosc z istniejacymi wzorcami tRPC/Zod.

## Previous Story Intelligence

- Story 2.1: wiarygodny sync i inventory.
- Story 2.2: raport luk i statusy danych.
- Story 2.3: ranking priorytetow optymalizacji.
- Story 2.4: insighty kontekstowe z `draft_low_confidence` i `source_conflict`.

## References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.1-Generowanie-strategii-email-marketingu]
- [Source: _bmad-output/planning-artifacts/prd.md#Functional-Requirements]
- [Source: _bmad-output/planning-artifacts/architecture.md#API--Communication]

## How to verify manually

1. Dla klienta z kompletnym discovery i poprawnym sync uruchom `generateEmailStrategy` i potwierdz status `ok` oraz zapis strategii z `version`.
2. Dla klienta z brakami discovery/sync uruchom `generateEmailStrategy` i potwierdz status `blocked_preconditions` z lista `missingPreconditions`.
3. Dla przypadku timeout (duzy zestaw wejscia) uruchom ponownie i potwierdz status `in_progress_or_timeout` oraz mozliwosc wznowienia bez duplikacji.

## Changed Files

- `app/src/features/analysis/server/analysis.logic.ts`
- `app/src/features/analysis/server/analysis.service.test.ts`
- `_bmad-output/implementation-artifacts/3-1-generowanie-strategii-email-marketingu.md`

## Senior Review

- Usunieto redundantny check preconditions po gate.
- Dodano audit log dla `blocked_preconditions` z `clientId`, `missingPreconditions`, `requestId`, `timestamp`.
- Rozszerzono testy preconditions o scenariusze: multi-condition, single-condition i edge combination.

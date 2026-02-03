# Story 6.6: Generowanie dokumentacji dla klienta

Status: done

## Story

As an Operations/Delivery Lead,  
I want wygenerowac spojna dokumentacje wdrozeniowa dla klienta,  
so that moge przekazac gotowy material na podstawie audytu, strategii i planow.

## Acceptance Criteria

1. Given dostepne dane audytu/strategii/planow/rekomendacji  
   When wywolam endpoint `getImplementationDocumentation`  
   Then otrzymam markdown gotowy do eksportu.
2. Given dokumentacja jest generowana  
   When budowany jest output  
   Then zawiera sekcje: product context, strategy summary, flow plan, campaign calendar, recommendations, audit log.
3. Given uzytkownik pracuje w clients-workspace  
   When kliknie "Pobierz dokumentacje wdrozeniowa"  
   Then system pobierze plik `.md`.

## Tasks / Subtasks

- [x] Dodac kontrakt endpointu `getImplementationDocumentation` (AC: 1)
- [x] Dodac logike generowania markdown dokumentacji z wymaganymi sekcjami (AC: 1, 2)
- [x] Dodac sekcje audit log na bazie ostatnich wpisow klienta (AC: 2)
- [x] Dodac endpoint do routera TRPC (AC: 1)
- [x] Dodac przycisk "Pobierz dokumentacje wdrozeniowa" w `clients-workspace` (AC: 3)
- [x] Dodac testy kontraktowe i test logiki generowania (AC: 1, 2)

## Dev Notes

- Minimal-diff: rozbudowa istniejacego flow raportowania o osobny endpoint i przycisk pobrania.
- Format markdown jest HTML-ready (naglowki, listy, checkboxy, daty/statusy).

## How to verify manually

1. Otworz klienta w `clients-workspace`.
2. Kliknij **Pobierz dokumentacje wdrozeniowa**.
3. Sprawdz, ze pobrany plik `.md` zawiera sekcje:
   - `## Product Context`
   - `## Strategy Summary`
   - `## Flow Plan`
   - `## Campaign Calendar`
   - `## Recommendations`
   - `## Audit Log`
4. Zweryfikuj, ze w tresci sa widoczne statusy, daty i checkboxy list.

## Changed Files

- `app/src/features/analysis/contracts/analysis.schema.ts`
- `app/src/features/analysis/contracts/analysis.schema.test.ts`
- `app/src/features/analysis/analysis.router.ts`
- `app/src/features/analysis/server/analysis.repository.ts`
- `app/src/features/analysis/server/analysis.logic.ts`
- `app/src/features/analysis/server/analysis.service.test.ts`
- `app/src/features/analysis/components/implementation-alerts-card.tsx`
- `app/src/features/clients/components/clients-workspace.tsx`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Minimal Review

- Ryzyko regresji: niskie-srednie (nowy endpoint + drobna zmiana UI przycisku pobrania).
- Mitigacja: test kontraktowy nowego endpointu + test logiki generowania dokumentacji.
- Green checks: `npm test`, `npm run typecheck`, `npm run lint`.

## Completion Notes

- Dodano endpoint `getImplementationDocumentation`.
- Dodano markdown dokumentacji wdrozeniowej z wymaganymi sekcjami.
- Dodano przycisk pobierania dokumentacji w `clients-workspace`.

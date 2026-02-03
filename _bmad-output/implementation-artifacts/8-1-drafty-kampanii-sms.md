# Story 8.1 - Drafty kampanii SMS

## Status
- done

## Scope
- Dodano endpointy do generowania draftu SMS i pobierania historii draftow.
- Dodano logike generowania tresci SMS (CTA + styl + timing + walidacja dlugosci <= 160).
- Dodano UI do generowania/ponownego generowania i zatwierdzania draftu SMS.
- Dodano testy kontraktowe oraz testy logiki backendowej.

## Implemented
- `generateSmsCampaignDraft` (input: `clientId`, `campaignId`, `campaignContext`, `goals`, `tone`, `timingPreferences`, `style`).
- `getSmsCampaignDraftHistory` (input: `clientId`, `campaignId`).
- Historia draftow z audytu (`content.sms_campaign_draft.generated`) filtrowana po `campaignId`.
- Rekord draftu SMS zawiera: `clientId`, `campaignId`, `userId`, `requestId`, `createdAt`, `style`, `timing`, `cta`, `message`, `length`, `status`.
- UI karta `SmsCampaignDraftCard` w `clients-workspace.tsx` z przyciskami:
  - `Wygeneruj ponownie`
  - `Zatwierdz`

## Validation
- `npm test` (app) ✅
- `npm run typecheck` (app) ✅
- `npm run lint` (app) ✅
- `npx vitest run src/features/analysis/contracts/analysis.schema.test.ts src/features/analysis/server/analysis.service.test.ts` ✅

## How to verify manually
1. Otworz workspace klienta i przejdz do sekcji `Draft kampanii SMS`.
2. Ustaw pola: `Campaign ID`, `Kontekst kampanii`, `Cele`, `Tone`, `Timing`, `Styl komunikacji`.
3. Kliknij `Wygeneruj ponownie`.
4. Zweryfikuj, ze widoczny draft ma:
   - przypisany `campaignId` i `requestId`,
   - `length <= 160`,
   - status `ok` albo `too_long`,
   - CTA zgodne ze stylem.
5. Zweryfikuj, ze draft trafia do historii dla tej samej kampanii.
6. Kliknij `Zatwierdz` i potwierdz brak bledu.

## Changed Files
- `app/src/features/analysis/contracts/analysis.schema.ts`
- `app/src/features/analysis/contracts/analysis.schema.test.ts`
- `app/src/features/analysis/server/analysis.logic.ts`
- `app/src/features/analysis/server/analysis.repository.ts`
- `app/src/features/analysis/server/analysis.service.test.ts`
- `app/src/features/analysis/analysis.router.ts`
- `app/src/features/analysis/components/sms-campaign-draft-card.tsx`
- `app/src/features/clients/components/clients-workspace.tsx`
- `_bmad-output/planning-artifacts/epics.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/8-1-drafty-kampanii-sms.md`

# Starter aplikacji (Create-T3-App)

Bazowy scaffold dla MVP: Next.js (App Router), TypeScript, tRPC, Prisma, NextAuth v4 i Tailwind.

## Wymagania

- Node.js: `>=20` (lokalnie wykryto: `v25.5.0`)
- npm: `>=10` (lokalnie wykryto: `11.8.0`)
- pnpm: opcjonalnie (w tym srodowisku nie byl zainstalowany)
- Docker lub Podman (do lokalnej bazy PostgreSQL)

## Szybki start

1. Skopiuj konfiguracje srodowiska:

```bash
cp .env.example .env
```

2. Uzupelnij wymagane zmienne (`NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `APP_URL`, `DATABASE_URL`, opcjonalnie Discord OAuth).

3. Uruchom lokalna baze (opcjonalnie skryptem):

```bash
./start-database.sh
```

4. Zastosuj schemat bazy:

```bash
npm run db:push
```

Opcjonalnie uruchom seed:

```bash
npm run db:seed
```

5. Uruchom aplikacje:

```bash
npm run dev
```

## Dostepne skrypty

- `npm run dev` - start aplikacji (z walidacja polaczenia DB przed startem)
- `npm run build` - build produkcyjny
- `npm run lint` - lint
- `npm run typecheck` - TypeScript type check
- `npm run db:push` - push schematu Prisma (z walidacja DB)
- `npm run db:migrate` - migracje deploy (z walidacja DB)
- `npm run db:seed` - dane startowe do lokalnego developmentu
- `npm run db:studio` - Prisma Studio

## Recovery i troubleshooting

### 1) Instalacja zaleznosci nie przechodzi (network lock / version conflict)

Objawy:
- timeouty podczas `npm install`
- konflikty peer dependencies
- bledy blokady lockfile

Kroki recovery:
1. Bezpieczny retry (domyslny):

```bash
npm install
```

2. Jezeli problem dotyczy cache npm, wyczysc cache i powtorz:

```bash
npm cache verify
npm cache clean --force
npm install
```

3. Jezeli konflikt dotyczy wersji Node, ustaw zalecana wersje (np. przez `nvm`) i powtorz.
4. Jezeli problem to chwilowy brak sieci/rejestru, ponow polecenie po przywroceniu lacznosci.
5. Hard reset zaleznosci (ostatnia deska ratunku, nie domyslnie):

```bash
rm -rf node_modules package-lock.json
npm install
```

### 2) Brak polaczenia z PostgreSQL (app nie przechodzi do "ready")

Skrypty `dev`, `db:push` i `db:migrate` uruchamiaja guard `scripts/check-db-connection.mjs`.
Gdy DB jest niedostepna, proces konczy sie bledem w kontrakcie:

```json
{
  "error": {
    "code": "DB_CONNECTION_ERROR",
    "message": "...",
    "details": {
      "hint": "Sprawdz uruchomienie bazy oraz poprawna konfiguracje DATABASE_URL w .env."
    },
    "requestId": "<uuid>"
  }
}
```

To oznacza, ze aplikacja nie jest gotowa (zgodnie z AC) dopoki nie naprawisz konfiguracji DB.

Kroki recovery:
1. Zweryfikuj `DATABASE_URL` w `.env`.
2. Upewnij sie, ze kontener/usluga PostgreSQL dziala.
3. Powtorz `npm run db:push`, a potem `npm run dev`.
4. Jezeli chcesz przygotowac dane startowe, uruchom `npm run db:seed`.

## Uwagi architektoniczne

- Baza: PostgreSQL + Prisma
- API: tRPC
- Auth: NextAuth v4 (adapter Prisma)
- Konwencje: DB `snake_case` (na etapie modelowania), API i kod aplikacji `camelCase`

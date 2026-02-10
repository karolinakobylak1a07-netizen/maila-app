import Link from "next/link";

import { ClientsWorkspace } from "~/features/clients/components/clients-workspace";
import { getServerAuthSession } from "~/server/auth";
import { db } from "~/server/db";

const checkDatabaseReady = async () => {
  try {
    await db.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
};

export default async function ClientsPage() {
  const isDatabaseReady = await checkDatabaseReady();

  if (!isDatabaseReady) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-4 px-4">
        <h1 className="text-2xl font-semibold text-slate-900">Baza danych nie dziala</h1>
        <p className="text-sm text-slate-700">
          Uruchom PostgreSQL i odswiez strone. Workspace ruszy, gdy baza bedzie dostepna.
        </p>
        <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">
{`cd app
./start-database.sh
npm run db:push
npm run dev`}
        </pre>
      </main>
    );
  }

  const session = await getServerAuthSession();

  if (!session?.user) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-start justify-center gap-4 px-4">
        <h1 className="text-2xl font-semibold text-slate-900">Modul klientow</h1>
        <p className="text-sm text-slate-700">Musisz sie zalogowac, aby zarzadzac profilami klientow.</p>
        <Link
          href="/api/auth/signin"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          Zaloguj
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <ClientsWorkspace />
    </main>
  );
}

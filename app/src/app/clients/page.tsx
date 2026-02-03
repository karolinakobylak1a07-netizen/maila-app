import Link from "next/link";

import { ClientsWorkspace } from "~/features/clients/components/clients-workspace";
import { getServerAuthSession } from "~/server/auth";

export default async function ClientsPage() {
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

"use client";

import Link from "next/link";

export function CheckoutStartedGuide() {
  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Checkout Started - payload guide</h1>
        <p className="mt-1 text-sm text-slate-600">
          Instrukcja kontrolna dla zdarzenia Checkout Started.
        </p>
      </header>

      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <p>Sprawdz czy event zawiera minimalny zestaw danych: email/profile_id, produkty, quantity i timestamp.</p>
      </div>

      <div>
        <Link href="/clients/connect" className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800">
          Powrot
        </Link>
      </div>
    </section>
  );
}

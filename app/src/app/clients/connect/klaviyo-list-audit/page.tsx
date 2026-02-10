"use client";

import { useState } from "react";

export const dynamic = 'force-dynamic';

export default function ListAuditPage() {
  const [clientId, setClientId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runAudit = async () => {
    if (!clientId.trim()) {
      setError("Wpisz ID klienta");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/clients/list-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ klaviyoPrivateApiKey: "" }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Błąd podczas audytu");
        return;
      }

      setResult(data);
    } catch (err) {
      setError("Błąd połączenia");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-2xl font-semibold text-slate-900">
          Audyt Listy Klaviyo
        </h1>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <label htmlFor="clientId" className="mb-2 block text-sm font-medium text-slate-700">
              ID Klienta
            </label>
            <input
              id="clientId"
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Wpisz ID klienta (np. abc123)"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-slate-500">
              Znajdziesz ID klienta po synchronizacji
            </p>
          </div>

          <button
            onClick={runAudit}
            disabled={loading}
            className="w-full rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            {loading ? "Przeprowadzam audyt..." : "Przeprowadź audyt"}
          </button>

          {error && (
            <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-6">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">
                Wynik audytu
              </h2>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <pre className="overflow-x-auto text-xs text-slate-700">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <h3 className="mb-2 font-semibold text-emerald-900">
            Instrukcja:
          </h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-emerald-800">
            <li>Zsynchronizuj najpierw dane klienta</li>
            <li>Skopiuj ID klienta z listy</li>
            <li>Wpisz ID powyżej i kliknij "Przeprowadź audyt"</li>
            <li>Wynik pokaże się poniżej w formacie JSON</li>
          </ol>
        </div>
      </div>
    </main>
  );
}

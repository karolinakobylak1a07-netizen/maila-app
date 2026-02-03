"use client";

import type { AuditProductContext } from "../contracts/analysis.schema";

type AuditProductContextCardProps = {
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  requestId: string | null;
  context: AuditProductContext | null;
  onRefresh: () => void;
};

export function AuditProductContextCard(props: AuditProductContextCardProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-slate-900">Kontekst produktu do audytu</h2>
        <button
          type="button"
          onClick={props.onRefresh}
          disabled={props.refreshing}
          className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {props.refreshing ? "Odswiezanie..." : "Odswiez kontekst"}
        </button>
      </div>

      {props.requestId && <p className="mb-2 text-xs text-slate-500">Request ID: {props.requestId}</p>}
      {props.loading && <p className="text-sm text-slate-600">Ladowanie kontekstu audytu...</p>}
      {props.error && <p className="text-sm text-red-700">{props.error}</p>}

      {!props.loading && !props.error && !props.context && (
        <p className="text-sm text-slate-600">Brak danych kontekstu produktu.</p>
      )}

      {!props.loading && !props.error && props.context && (
        <div className="space-y-2 text-sm text-slate-700">
          <p>
            Status: <span className="font-medium">{props.context.status}</span>
          </p>
          <p>Oferta: {props.context.offer}</p>
          <p>Grupa docelowa: {props.context.targetAudience}</p>
          <p>Glowne produkty: {props.context.mainProducts.join(", ") || "brak"}</p>
          <p>Aktualne flow: {props.context.currentFlows.join(", ") || "brak"}</p>
          <p>Cele: {props.context.goals.join(", ") || "brak"}</p>
          <p>Segmenty: {props.context.segments.join(", ") || "brak"}</p>
          {props.context.missingFields.length > 0 && (
            <p className="text-amber-700">
              Brakujace pola: {props.context.missingFields.join(", ")}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

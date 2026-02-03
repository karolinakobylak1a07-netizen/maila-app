"use client";

import type { ImplementationAlerts } from "../contracts/analysis.schema";

type ImplementationAlertsCardProps = {
  loading: boolean;
  reportLoading: boolean;
  error: string | null;
  requestId: string | null;
  alerts: ImplementationAlerts | null;
  reportMarkdown: string | null;
  onDownloadReport: () => void;
};

export function ImplementationAlertsCard(props: ImplementationAlertsCardProps) {
  const statusIcon =
    props.alerts?.status === "blocked"
      ? "🛑"
      : props.alerts?.status === "needs_configuration" || props.alerts?.status === "at_risk"
        ? "⚠️"
        : "✅";

  const progressIcon = (progressState: "blocked" | "at_risk" | "on_track") => {
    if (progressState === "blocked") {
      return "🛑";
    }
    if (progressState === "at_risk") {
      return "⚠️";
    }
    return "✅";
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-slate-900">Blokady i braki konfiguracji</h2>
        <div className="flex items-center gap-2">
          {props.alerts && (
            <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">
              {props.alerts.blockerCount} blokad / {props.alerts.configGapCount} brakow
            </span>
          )}
          <button
            type="button"
            onClick={props.onDownloadReport}
            disabled={props.reportLoading}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {props.reportLoading ? "Generowanie..." : "Pobierz raport wdrozeniowy"}
          </button>
        </div>
      </div>

      {props.requestId && <p className="mb-2 text-xs text-slate-500">Request ID: {props.requestId}</p>}
      {props.loading && <p className="text-sm text-slate-600">Ladowanie powiadomien...</p>}
      {props.error && <p className="text-sm text-red-700">{props.error}</p>}

      {!props.loading && !props.error && !props.alerts && (
        <p className="text-sm text-slate-600">Brak danych o blokadach.</p>
      )}

      {!props.loading && !props.error && props.alerts && (
        <div className="space-y-2 text-sm text-slate-700">
          <p>
            Status: <span className="font-medium">{statusIcon} {props.alerts.status}</span>
          </p>
          {props.alerts.alerts.length === 0 ? (
            <p>Brak aktywnych blokad i brakow konfiguracji.</p>
          ) : (
            <ul className="space-y-2">
              {props.alerts.alerts.map((alert) => (
                <li key={alert.id} className="rounded border border-slate-200 p-2">
                  <p className="font-medium">{progressIcon(alert.progressState)} {alert.title}</p>
                  <p>{alert.description}</p>
                  <p className="text-xs text-slate-500">
                    {alert.type} • {alert.severity} • priority: {alert.priority} • impact: {alert.impactScore} • source: {alert.source}
                  </p>
                  {typeof alert.progressPercent === "number" && (
                    <p className="text-xs text-slate-500">
                      Postep: {alert.progressPercent}% • status: {alert.progressState}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {props.reportMarkdown && (
        <pre className="mt-3 max-h-64 overflow-auto rounded border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700">
          {props.reportMarkdown}
        </pre>
      )}
    </section>
  );
}

import type { InsightItem } from "../contracts/analysis.schema";

type ContextInsightsStatus = "ok" | "draft_low_confidence" | "source_conflict" | "empty";

type ContextInsightsListProps = {
  loading: boolean;
  error: string | null;
  status: ContextInsightsStatus;
  requestId: string | null;
  lastSyncRequestId: string | null;
  insights: InsightItem[];
};

export function ContextInsightsList(props: ContextInsightsListProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-slate-900">Insighty z kontekstem klienta</h2>
        <p className="text-xs text-slate-500">
          Ostatni sync:{" "}
          {props.lastSyncRequestId ? (
            <span className="font-mono">{props.lastSyncRequestId}</span>
          ) : (
            <span className="italic">Brak danych</span>
          )}
        </p>
      </div>

      {props.requestId && (
        <p className="mb-3 text-xs text-slate-500">Request ID: {props.requestId}</p>
      )}

      {props.loading && <p className="text-sm text-slate-600">Generowanie insightow...</p>}

      {props.error && <p className="mb-3 text-sm text-red-700">{props.error}</p>}

      {!props.error && props.status === "draft_low_confidence" && (
        <div className="mb-3 rounded-md bg-amber-50 p-3 text-sm text-amber-700">
          Brakuje kontekstu klienta. Rekomendacje wymagaja walidacji.
        </div>
      )}

      {!props.error && props.status === "source_conflict" && (
        <div className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-700">
          Wykryto konflikt zrodel danych. Brak jednoznacznej rekomendacji bez walidacji czlowieka.
        </div>
      )}

      {!props.error && props.status === "empty" && !props.loading && (
        <p className="text-sm text-slate-600">Brak insightow dla aktualnego kontekstu.</p>
      )}

      {!props.error && props.insights.length > 0 && (
        <ul className="space-y-3">
          {props.insights.map((insight) => (
            <li key={insight.id} className="rounded-xl border border-slate-200 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs">
                <span className="rounded border bg-slate-50 px-2 py-0.5">{insight.status}</span>
                <span className="rounded border bg-slate-50 px-2 py-0.5">{insight.actionability}</span>
                <span className="rounded border bg-slate-50 px-2 py-0.5">{insight.confidence}%</span>
              </div>
              <h3 className="text-base font-semibold text-slate-900">{insight.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{insight.rationale}</p>
              {insight.recommendedAction ? (
                <p className="mt-2 text-sm text-slate-700">
                  Rekomendowane dzialanie: {insight.recommendedAction}
                </p>
              ) : (
                <p className="mt-2 text-sm text-slate-700">
                  Rekomendowane dzialanie: brak (wymagana walidacja czlowieka).
                </p>
              )}
              {insight.missingContext.length > 0 && (
                <p className="mt-2 text-xs text-amber-700">
                  Brakujacy kontekst: {insight.missingContext.join(", ")}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

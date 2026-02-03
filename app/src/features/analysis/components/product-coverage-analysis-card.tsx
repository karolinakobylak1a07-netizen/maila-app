"use client";

import type { ProductCoverageAnalysis } from "../contracts/analysis.schema";

type ProductCoverageAnalysisCardProps = {
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  requestId: string | null;
  coverage: ProductCoverageAnalysis | null;
  onRefresh: () => void;
};

export function ProductCoverageAnalysisCard(props: ProductCoverageAnalysisCardProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-slate-900">Pokrycie produktu w flow i kampaniach</h2>
        <button
          type="button"
          onClick={props.onRefresh}
          disabled={props.refreshing}
          className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {props.refreshing ? "Odswiezanie..." : "Odswiez analize"}
        </button>
      </div>

      {props.requestId && <p className="mb-2 text-xs text-slate-500">Request ID: {props.requestId}</p>}
      {props.loading && <p className="text-sm text-slate-600">Ladowanie analizy pokrycia...</p>}
      {props.error && <p className="text-sm text-red-700">{props.error}</p>}

      {!props.loading && !props.error && !props.coverage && (
        <p className="text-sm text-slate-600">Brak danych pokrycia produktu.</p>
      )}

      {!props.loading && !props.error && props.coverage && (
        <div className="space-y-2 text-sm text-slate-700">
          <p>
            Status: <span className="font-medium">{props.coverage.status}</span>
          </p>
          {props.coverage.items.length === 0 ? (
            <p>Brak produktow do analizy.</p>
          ) : (
            <ul className="space-y-2">
              {props.coverage.items.map((item) => (
                <li key={item.productName} className="rounded border border-slate-200 p-2">
                  <p className="font-medium">{item.productName}</p>
                  <p>Coverage score: {item.coverageScore}% ({item.status})</p>
                  <p>Flow: {item.flowMatches.join(", ") || "brak"}</p>
                  <p>Kampanie: {item.campaignMatches.join(", ") || "brak"}</p>
                </li>
              ))}
            </ul>
          )}
          {(props.coverage.missingFlows.length > 0 || props.coverage.missingCampaigns.length > 0) && (
            <div className="rounded border border-amber-200 bg-amber-50 p-2 text-amber-800">
              {props.coverage.missingFlows.length > 0 && (
                <p>Brak pokrycia w flow: {props.coverage.missingFlows.join(", ")}</p>
              )}
              {props.coverage.missingCampaigns.length > 0 && (
                <p>Brak pokrycia w kampaniach: {props.coverage.missingCampaigns.join(", ")}</p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

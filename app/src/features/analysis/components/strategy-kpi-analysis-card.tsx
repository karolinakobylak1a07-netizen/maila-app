"use client";

import type { StrategyKPIAnalysis } from "../contracts/analysis.schema";

type StrategyKPIAnalysisCardProps = {
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  requestId: string | null;
  analysis: StrategyKPIAnalysis | null;
  onRefresh: () => void;
};

export function StrategyKPIAnalysisCard(props: StrategyKPIAnalysisCardProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-slate-900">KPI strategii komunikacji</h2>
        <button
          type="button"
          onClick={props.onRefresh}
          disabled={props.refreshing}
          className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {props.refreshing ? "Odswiezanie..." : "Odswiez KPI"}
        </button>
      </div>

      {props.requestId && <p className="mb-2 text-xs text-slate-500">Request ID: {props.requestId}</p>}
      {props.loading && <p className="text-sm text-slate-600">Ladowanie KPI strategii...</p>}
      {props.error && <p className="text-sm text-red-700">{props.error}</p>}

      {!props.loading && !props.error && !props.analysis && (
        <p className="text-sm text-slate-600">Brak danych KPI strategii.</p>
      )}

      {!props.loading && !props.error && props.analysis && (
        <div className="space-y-2 text-sm text-slate-700">
          <p>
            Status: <span className="font-medium">{props.analysis.status}</span>
          </p>
          <p>
            Overall: open {props.analysis.overall.openRate}% • click {props.analysis.overall.clickRate}%
            • CVR {props.analysis.overall.cvr}% • RPR {props.analysis.overall.revenuePerRecipient}
            • time-to-open {props.analysis.overall.avgTimeToOpen} min
          </p>
          <p className="text-xs text-slate-500">
            Top segment: {props.analysis.topPerformers.segmentId ?? "brak"} • Top rekomendacja:{" "}
            {props.analysis.topPerformers.recommendationId ?? "brak"}
          </p>
          {props.analysis.segmentSummaries.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-600">Segmenty</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-slate-600">
                {props.analysis.segmentSummaries.slice(0, 3).map((item) => (
                  <li key={item.segmentId}>
                    {item.segmentName}: open {item.metrics.openRate}% • click {item.metrics.clickRate}% •
                    CVR {item.metrics.cvr}%
                  </li>
                ))}
              </ul>
            </div>
          )}
          {props.analysis.recommendationSummaries.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-600">Rekomendacje</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-slate-600">
                {props.analysis.recommendationSummaries.slice(0, 3).map((item) => (
                  <li key={item.recommendationId}>
                    {item.recommendationTitle}: click {item.metrics.clickRate}% • CVR {item.metrics.cvr}%
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

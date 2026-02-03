"use client";

import type { CampaignEffectivenessAnalysis } from "../contracts/analysis.schema";

type CampaignEffectivenessAnalysisCardProps = {
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  requestId: string | null;
  analysis: CampaignEffectivenessAnalysis | null;
  onRefresh: () => void;
};

export function CampaignEffectivenessAnalysisCard(
  props: CampaignEffectivenessAnalysisCardProps,
) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-slate-900">Analiza skutecznosci kampanii</h2>
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
      {props.loading && <p className="text-sm text-slate-600">Ladowanie analizy...</p>}
      {props.error && <p className="text-sm text-red-700">{props.error}</p>}

      {!props.loading && !props.error && !props.analysis && (
        <p className="text-sm text-slate-600">Brak danych analizy skutecznosci.</p>
      )}

      {!props.loading && !props.error && props.analysis && (
        <div className="space-y-2 text-sm text-slate-700">
          <p>
            Status: <span className="font-medium">{props.analysis.status}</span>
          </p>
          <p>
            KPI: open rate {props.analysis.performance.openRate}% • click rate{" "}
            {props.analysis.performance.clickRate}% • revenue {props.analysis.performance.revenue} •
            conversions {props.analysis.performance.conversions}
          </p>
          <p>
            Feedback: {props.analysis.feedback.feedbackCount} ocen (rekomendacje:{" "}
            {props.analysis.feedback.recommendationFeedbackCount}, drafty:{" "}
            {props.analysis.feedback.draftFeedbackCount}) • avg rating{" "}
            {props.analysis.feedback.averageRating}/5
          </p>
          <p>
            Scores: performance {props.analysis.scores.performanceScore} • feedback{" "}
            {props.analysis.scores.feedbackScore} • blended {props.analysis.scores.blendedScore}
          </p>
          {props.analysis.insights.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-xs text-slate-600">
              {props.analysis.insights.map((insight, index) => (
                <li key={`${insight}-${index}`}>{insight}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

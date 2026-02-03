"use client";

import type { CommunicationImprovementRecommendations } from "../contracts/analysis.schema";
import { ArtifactFeedbackForm } from "./artifact-feedback-form";

type CommunicationImprovementRecommendationsCardProps = {
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  requestId: string | null;
  recommendations: CommunicationImprovementRecommendations | null;
  onRefresh: () => void;
  onSubmitFeedback?: (payload: { artifactId: string; rating: number; comment: string }) => Promise<void>;
  feedbackSubmitting?: boolean;
};

const priorityIcon: Record<"CRITICAL" | "HIGH" | "MEDIUM" | "LOW", string> = {
  CRITICAL: "🛑",
  HIGH: "⚠️",
  MEDIUM: "🔔",
  LOW: "✅",
};

const statusIcon: Record<"covered" | "partial" | "missing", string> = {
  covered: "✅",
  partial: "⚠️",
  missing: "🛑",
};

export function CommunicationImprovementRecommendationsCard(
  props: CommunicationImprovementRecommendationsCardProps,
) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-slate-900">Rekomendacje usprawnien komunikacji</h2>
        <button
          type="button"
          onClick={props.onRefresh}
          disabled={props.refreshing}
          className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {props.refreshing ? "Odswiezanie..." : "Odswiez rekomendacje"}
        </button>
      </div>

      {props.requestId && <p className="mb-2 text-xs text-slate-500">Request ID: {props.requestId}</p>}
      {props.loading && <p className="text-sm text-slate-600">Ladowanie rekomendacji...</p>}
      {props.error && <p className="text-sm text-red-700">{props.error}</p>}

      {!props.loading && !props.error && !props.recommendations && (
        <p className="text-sm text-slate-600">Brak danych rekomendacji.</p>
      )}

      {!props.loading && !props.error && props.recommendations && (
        <div className="space-y-2 text-sm text-slate-700">
          <p>
            Status: <span className="font-medium">{props.recommendations.status}</span>
          </p>
          {props.recommendations.items.length === 0 ? (
            <p>Brak rekomendacji do pokazania.</p>
          ) : (
            <ul className="space-y-2">
              {props.recommendations.items.map((item) => (
                <li key={item.id} className="rounded border border-slate-200 p-2">
                  <p className="font-medium">
                    {priorityIcon[item.priority]} {item.title}
                  </p>
                  <p>{item.description}</p>
                  <p className="text-xs text-slate-500">
                    {statusIcon[item.status]} {item.productName} • priority: {item.priority} • impact: {item.impactScore}
                  </p>
                  <p className="text-xs text-slate-500">Akcja: {item.action}</p>
                  {props.onSubmitFeedback && (
                    <ArtifactFeedbackForm
                      title="Ocena rekomendacji (1-5) i komentarz"
                      disabled={props.feedbackSubmitting}
                      onSubmitFeedback={async ({ rating, comment }) => {
                        await props.onSubmitFeedback?.({
                          artifactId: item.id,
                          rating,
                          comment,
                        });
                      }}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

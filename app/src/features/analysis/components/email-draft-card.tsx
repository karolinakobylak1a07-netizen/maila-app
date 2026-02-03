"use client";

import type { EmailDraft } from "../contracts/analysis.schema";
import { ArtifactFeedbackForm } from "./artifact-feedback-form";

type EmailDraftCardProps = {
  loading: boolean;
  generating: boolean;
  error: string | null;
  requestId: string | null;
  draft: EmailDraft | null;
  onGenerate: () => void;
  onSubmitFeedback?: (payload: { artifactId: string; rating: number; comment: string }) => Promise<void>;
  feedbackSubmitting?: boolean;
};

export function EmailDraftCard(props: EmailDraftCardProps) {
  const draft = props.draft;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-slate-900">Draft email z briefu</h2>
        <button
          type="button"
          onClick={props.onGenerate}
          disabled={props.generating}
          className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {props.generating ? "Generowanie..." : "Generuj draft"}
        </button>
      </div>

      {props.requestId && <p className="mb-2 text-xs text-slate-500">Request ID: {props.requestId}</p>}
      {props.loading && <p className="text-sm text-slate-600">Ladowanie draftu...</p>}
      {props.error && <p className="text-sm text-red-700">{props.error}</p>}

      {!props.loading && !props.error && !props.draft && (
        <p className="text-sm text-slate-600">Brak wygenerowanego draftu email.</p>
      )}

      {!props.loading && !props.error && draft && (
        <div className="space-y-2 text-sm text-slate-700">
          <p>
            Status: <span className="font-medium">{draft.status}</span>
          </p>
          <p>
            Wersja: <span className="font-medium">{draft.version}</span>
          </p>
          <p>Cel kampanii: {draft.campaignGoal}</p>
          <p>Segment: {draft.segment}</p>
          <p>Temat: {draft.subject}</p>
          <p>Preheader: {draft.preheader}</p>
          <p>CTA: {draft.cta}</p>
          <p className="rounded border border-slate-200 bg-slate-50 p-2 whitespace-pre-wrap">
            {draft.body}
          </p>
          {draft.retryable && (
            <p className="text-amber-700">
              Generowanie przekroczylo SLA - mozesz ponowic bez utraty briefu wejsciowego.
            </p>
          )}
          {props.onSubmitFeedback && (
            <ArtifactFeedbackForm
              title="Ocena draftu (1-5) i komentarz"
              disabled={props.feedbackSubmitting}
              onSubmitFeedback={async ({ rating, comment }) => {
                await props.onSubmitFeedback?.({
                  artifactId: draft.requestId,
                  rating,
                  comment,
                });
              }}
            />
          )}
        </div>
      )}
    </section>
  );
}

"use client";

import type { EmailDraft } from "../contracts/analysis.schema";

type EmailDraftCardProps = {
  loading: boolean;
  generating: boolean;
  error: string | null;
  requestId: string | null;
  draft: EmailDraft | null;
  onGenerate: () => void;
};

export function EmailDraftCard(props: EmailDraftCardProps) {
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

      {!props.loading && !props.error && props.draft && (
        <div className="space-y-2 text-sm text-slate-700">
          <p>
            Status: <span className="font-medium">{props.draft.status}</span>
          </p>
          <p>
            Wersja: <span className="font-medium">{props.draft.version}</span>
          </p>
          <p>Cel kampanii: {props.draft.campaignGoal}</p>
          <p>Segment: {props.draft.segment}</p>
          <p>Temat: {props.draft.subject}</p>
          <p>Preheader: {props.draft.preheader}</p>
          <p>CTA: {props.draft.cta}</p>
          <p className="rounded border border-slate-200 bg-slate-50 p-2 whitespace-pre-wrap">
            {props.draft.body}
          </p>
          {props.draft.retryable && (
            <p className="text-amber-700">
              Generowanie przekroczylo SLA - mozesz ponowic bez utraty briefu wejsciowego.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

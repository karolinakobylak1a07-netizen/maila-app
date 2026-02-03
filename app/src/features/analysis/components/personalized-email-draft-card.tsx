"use client";

import type { PersonalizedEmailDraft } from "../contracts/analysis.schema";

type PersonalizedEmailDraftCardProps = {
  loading: boolean;
  generating: boolean;
  error: string | null;
  requestId: string | null;
  personalizedDraft: PersonalizedEmailDraft | null;
  onGenerate: () => void;
};

export function PersonalizedEmailDraftCard(props: PersonalizedEmailDraftCardProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-slate-900">Personalizacja draftow</h2>
        <button
          type="button"
          onClick={props.onGenerate}
          disabled={props.generating}
          className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {props.generating ? "Generowanie..." : "Personalizuj draft"}
        </button>
      </div>

      {props.requestId && <p className="mb-2 text-xs text-slate-500">Request ID: {props.requestId}</p>}
      {props.loading && <p className="text-sm text-slate-600">Ladowanie personalizacji...</p>}
      {props.error && <p className="text-sm text-red-700">{props.error}</p>}

      {!props.loading && !props.error && !props.personalizedDraft && (
        <p className="text-sm text-slate-600">Brak wygenerowanej personalizacji draftu.</p>
      )}

      {!props.loading && !props.error && props.personalizedDraft && (
        <div className="space-y-2 text-sm text-slate-700">
          <p>
            Status: <span className="font-medium">{props.personalizedDraft.status}</span>
          </p>
          <p>
            Wersja: <span className="font-medium">{props.personalizedDraft.version}</span>
          </p>
          <p>Cel kampanii: {props.personalizedDraft.campaignGoal}</p>
          <p>Bazowy draft requestId: {props.personalizedDraft.baseDraftRequestId}</p>
          {props.personalizedDraft.variants.length > 0 ? (
            <ul className="space-y-2">
              {props.personalizedDraft.variants.map((variant, index) => (
                <li key={`${variant.segment}-${index}`} className="rounded border border-slate-200 p-2">
                  <p className="font-medium">Segment: {variant.segment}</p>
                  <p>Temat: {variant.subject}</p>
                  <p>Preheader: {variant.preheader}</p>
                  <p>CTA: {variant.cta}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>Brak wariantow do pokazania.</p>
          )}
        </div>
      )}
    </section>
  );
}

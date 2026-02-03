"use client";

import { useMemo, useState } from "react";

import type { SmsCampaignDraft, SmsCommunicationStyle } from "../contracts/analysis.schema";

type SmsCampaignDraftCardProps = {
  loading: boolean;
  generating: boolean;
  approving: boolean;
  error: string | null;
  requestId: string | null;
  draft: SmsCampaignDraft | null;
  history: SmsCampaignDraft[];
  defaultCampaignId?: string;
  onGenerate: (payload: {
    campaignId: string;
    campaignContext: string;
    goals: string[];
    tone: string;
    timingPreferences: string;
    style: SmsCommunicationStyle;
  }) => Promise<void>;
  onApprove: (draft: SmsCampaignDraft) => Promise<void>;
};

export function SmsCampaignDraftCard(props: SmsCampaignDraftCardProps) {
  const [campaignId, setCampaignId] = useState(props.defaultCampaignId ?? "campaign-main");
  const [campaignContext, setCampaignContext] = useState("Promocja weekendowa");
  const [goalsRaw, setGoalsRaw] = useState("zwiekszenie konwersji");
  const [tone, setTone] = useState("konkretny");
  const [timingPreferences, setTimingPreferences] = useState("10:00");
  const [style, setStyle] = useState<SmsCommunicationStyle>("promotion");

  const goals = useMemo(
    () =>
      goalsRaw
        .split(/\r?\n|[,;]+/)
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    [goalsRaw],
  );

  const runGenerate = async () => {
    await props.onGenerate({
      campaignId: campaignId.trim(),
      campaignContext: campaignContext.trim(),
      goals,
      tone: tone.trim(),
      timingPreferences: timingPreferences.trim(),
      style,
    });
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-slate-900">Draft kampanii SMS</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={runGenerate}
            disabled={props.generating}
            className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {props.generating ? "Generowanie..." : "Wygeneruj ponownie"}
          </button>
          <button
            type="button"
            onClick={async () => {
              if (props.draft) {
                await props.onApprove(props.draft);
              }
            }}
            disabled={props.approving || !props.draft}
            className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {props.approving ? "Zatwierdzanie..." : "Zatwierdz"}
          </button>
        </div>
      </div>

      {props.requestId && <p className="mb-2 text-xs text-slate-500">Request ID: {props.requestId}</p>}
      {props.loading && <p className="text-sm text-slate-600">Ladowanie draftu SMS...</p>}
      {props.error && <p className="text-sm text-red-700">{props.error}</p>}

      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-slate-700">
          Campaign ID
          <input
            value={campaignId}
            onChange={(event) => setCampaignId(event.target.value)}
            className="rounded border border-slate-300 px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-700">
          Styl komunikacji
          <select
            value={style}
            onChange={(event) => setStyle(event.target.value as SmsCommunicationStyle)}
            className="rounded border border-slate-300 px-2 py-1"
          >
            <option value="promotion">Promocja</option>
            <option value="reminder">Przypomnienie</option>
            <option value="announcement">Ogloszenie</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-700 md:col-span-2">
          Kontekst kampanii
          <input
            value={campaignContext}
            onChange={(event) => setCampaignContext(event.target.value)}
            className="rounded border border-slate-300 px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-700 md:col-span-2">
          Cele (oddziel przecinkami)
          <input
            value={goalsRaw}
            onChange={(event) => setGoalsRaw(event.target.value)}
            className="rounded border border-slate-300 px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-700">
          Tone of voice
          <input
            value={tone}
            onChange={(event) => setTone(event.target.value)}
            className="rounded border border-slate-300 px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-700">
          Timing
          <input
            value={timingPreferences}
            onChange={(event) => setTimingPreferences(event.target.value)}
            className="rounded border border-slate-300 px-2 py-1"
          />
        </label>
      </div>

      {!props.loading && !props.error && !props.draft && (
        <p className="text-sm text-slate-600">Brak wygenerowanego draftu SMS.</p>
      )}

      {!props.loading && !props.error && props.draft && (
        <div className="mb-4 rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          <p>
            Status: <span className="font-medium">{props.draft.status}</span>
          </p>
          <p>
            Campaign ID: <span className="font-medium">{props.draft.campaignId}</span>
          </p>
          <p>
            Styl: <span className="font-medium">{props.draft.style}</span>
          </p>
          <p>
            Timing: <span className="font-medium">{props.draft.timing}</span>
          </p>
          <p>
            Dlugosc: <span className="font-medium">{props.draft.length}/160</span>
          </p>
          <p>
            CTA: <span className="font-medium">{props.draft.cta}</span>
          </p>
          <p className="mt-2 whitespace-pre-wrap rounded border border-slate-200 bg-white p-2">{props.draft.message}</p>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-700">Historia draftow (campaignId)</p>
        {props.history.length === 0 ? (
          <p className="text-xs text-slate-500">Brak historii dla tej kampanii.</p>
        ) : (
          <ul className="space-y-2">
            {props.history.map((item) => (
              <li key={item.requestId} className="rounded border border-slate-200 p-2 text-xs text-slate-700">
                <p className="font-medium">{item.requestId}</p>
                <p>
                  {item.status} | {item.style} | {item.length}/160 | {item.timing}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

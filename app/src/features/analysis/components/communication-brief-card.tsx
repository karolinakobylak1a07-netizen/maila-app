"use client";

import { useState } from "react";

import type { CommunicationBrief } from "../contracts/analysis.schema";

type CommunicationBriefCardProps = {
  loading: boolean;
  generating: boolean;
  error: string | null;
  requestId: string | null;
  brief: CommunicationBrief | null;
  onGenerate: (input: { campaignGoal: string; segment: string }) => void;
};

export function CommunicationBriefCard(props: CommunicationBriefCardProps) {
  const [campaignGoal, setCampaignGoal] = useState("");
  const [segment, setSegment] = useState("");

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-slate-900">Brief komunikacyjny</h2>
        <button
          type="button"
          onClick={() => props.onGenerate({ campaignGoal, segment })}
          disabled={props.generating}
          className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {props.generating ? "Generowanie..." : "Generuj brief"}
        </button>
      </div>

      <div className="mb-3 grid gap-2 md:grid-cols-2">
        <input
          value={campaignGoal}
          onChange={(event) => setCampaignGoal(event.target.value)}
          placeholder="Cel kampanii"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          value={segment}
          onChange={(event) => setSegment(event.target.value)}
          placeholder="Segment"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      {props.requestId && <p className="mb-2 text-xs text-slate-500">Request ID: {props.requestId}</p>}
      {props.loading && <p className="text-sm text-slate-600">Ladowanie briefu...</p>}
      {props.error && <p className="text-sm text-red-700">{props.error}</p>}

      {!props.loading && !props.error && !props.brief && (
        <p className="text-sm text-slate-600">Brak wygenerowanego briefu komunikacyjnego.</p>
      )}

      {!props.loading && !props.error && props.brief && (
        <div className="space-y-2 text-sm text-slate-700">
          <p>
            Status: <span className="font-medium">{props.brief.status}</span>
          </p>
          <p>
            Wersja: <span className="font-medium">{props.brief.version}</span>
          </p>
          <p>Cel kampanii: {props.brief.campaignGoal}</p>
          <p>Segment: {props.brief.segment}</p>
          <p>Ton: {props.brief.tone}</p>
          <p>Priorytet: {props.brief.priority}</p>
          <p>KPI: {props.brief.kpi}</p>
          {props.brief.missingFields.length > 0 && (
            <p className="text-amber-700">
              Brakujace pola: {props.brief.missingFields.join(", ")}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

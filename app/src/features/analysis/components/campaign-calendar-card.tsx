import type { CampaignCalendar } from "../contracts/analysis.schema";

type CampaignCalendarCardProps = {
  loading: boolean;
  generating: boolean;
  error: string | null;
  requestId: string | null;
  calendar: CampaignCalendar | null;
  onGenerate: () => void;
};

export function CampaignCalendarCard(props: CampaignCalendarCardProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-slate-900">Kalendarz kampanii</h2>
        <button
          type="button"
          onClick={props.onGenerate}
          disabled={props.generating}
          className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {props.generating ? "Generowanie..." : "Generuj kalendarz"}
        </button>
      </div>

      {props.requestId && <p className="mb-2 text-xs text-slate-500">Request ID: {props.requestId}</p>}
      {props.loading && <p className="text-sm text-slate-600">Ladowanie kalendarza...</p>}
      {props.error && <p className="text-sm text-red-700">{props.error}</p>}

      {!props.loading && !props.error && !props.calendar && (
        <p className="text-sm text-slate-600">Brak wygenerowanego kalendarza kampanii.</p>
      )}

      {!props.loading && !props.error && props.calendar && (
        <div className="space-y-2 text-sm text-slate-700">
          <p>
            Status: <span className="font-medium">{props.calendar.status}</span>
          </p>
          <p>
            Wersja: <span className="font-medium">{props.calendar.version}</span>
          </p>
          {props.calendar.requiresManualValidation && (
            <p className="text-amber-700">Wymagana reczna walidacja przed publikacja.</p>
          )}
          <ul className="space-y-2">
            {props.calendar.items.map((item, index) => (
              <li key={`${item.weekNumber}-${index}`} className="rounded border border-slate-200 p-2">
                <p className="font-medium">
                  Tydzien {item.weekNumber}: {item.title}
                </p>
                <p>Typ: {item.campaignType}</p>
                <p>Cel: {item.goal}</p>
                <p>Segment: {item.segment}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

import type { FlowPlan } from "../contracts/analysis.schema";

type FlowPlanCardProps = {
  loading: boolean;
  generating: boolean;
  error: string | null;
  requestId: string | null;
  flowPlan: FlowPlan | null;
  onGenerate: () => void;
};

export function FlowPlanCard(props: FlowPlanCardProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-slate-900">Plan flow i automatyzacji</h2>
        <button
          type="button"
          onClick={props.onGenerate}
          disabled={props.generating}
          className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {props.generating ? "Generowanie..." : "Generuj plan flow"}
        </button>
      </div>

      {props.requestId && <p className="mb-2 text-xs text-slate-500">Request ID: {props.requestId}</p>}
      {props.loading && <p className="text-sm text-slate-600">Ladowanie planu flow...</p>}
      {props.error && <p className="text-sm text-red-700">{props.error}</p>}

      {!props.loading && !props.error && !props.flowPlan && (
        <p className="text-sm text-slate-600">Brak wygenerowanego planu flow.</p>
      )}

      {!props.loading && !props.error && props.flowPlan && (
        <div className="space-y-2 text-sm text-slate-700">
          <p>
            Status: <span className="font-medium">{props.flowPlan.status}</span>
          </p>
          <p>
            Wersja: <span className="font-medium">{props.flowPlan.version}</span>
          </p>
          {props.flowPlan.requiredStep && (
            <p className="text-amber-700">Wymagany krok: {props.flowPlan.requiredStep}</p>
          )}
          {props.flowPlan.items.length > 0 ? (
            <ul className="space-y-2">
              {props.flowPlan.items.map((item, index) => (
                <li key={`${item.name}-${index}`} className="rounded border border-slate-200 p-2">
                  <p className="font-medium">{item.name}</p>
                  <p>Trigger: {item.trigger}</p>
                  <p>Cel: {item.objective}</p>
                  <p>Priorytet: {item.priority}</p>
                  <p>Uzasadnienie: {item.businessReason}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>Brak flow do pokazania.</p>
          )}
        </div>
      )}
    </section>
  );
}

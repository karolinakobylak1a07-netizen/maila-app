import type { OptimizationArea } from "../contracts/analysis.schema";

type OptimizationSummary = {
  totalAreas: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  avgConfidence: number;
  avgExpectedImpact: number;
};

export type { OptimizationArea, OptimizationSummary };

type OptimizationPrioritiesProps = {
  loading: boolean;
  error: string | null;
  insufficientData: boolean;
  timedOut: boolean;
  requestTime?: number;
  requestId: string | null;
  lastSyncRequestId?: string | null;
  missingData?: string[];
  optimizationAreas: OptimizationArea[];
  summary: OptimizationSummary | null;
};

const priorityLabel: Record<OptimizationArea["priority"], string> = {
  CRITICAL: "Krytyczny",
  HIGH: "Wysoki",
  MEDIUM: "Sredni",
  LOW: "Niski",
};

const statusLabel: Record<OptimizationArea["status"], string> = {
  OK: "OK",
  GAP: "GAP",
  insufficient_data_for_priority: "insufficient_data_for_priority",
  timed_out: "timed_out",
};

export function OptimizationPrioritiesList(props: OptimizationPrioritiesProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-slate-900">Priorytetowe obszary optymalizacji</h2>
        <div className="text-xs text-slate-500">
          Ostatni sync:{" "}
          {props.lastSyncRequestId ? (
            <span className="font-mono">{props.lastSyncRequestId}</span>
          ) : (
            <span className="italic">Brak danych</span>
          )}
        </div>
      </div>

      {props.requestId && <p className="mb-3 text-xs text-slate-500">Request ID: {props.requestId}</p>}

      {props.loading && <p className="text-sm text-slate-600">Wyszukiwanie priorytetowych obszarow...</p>}

      {props.insufficientData && (
        <div className="mb-3 rounded-md bg-amber-50 p-3 text-sm text-amber-700">
          <p>Brak wystarczajacych danych do priorytetyzacji.</p>
          {props.missingData && props.missingData.length > 0 && (
            <p className="mt-1 text-xs">Brakujace dane: {props.missingData.join(", ")}.</p>
          )}
        </div>
      )}

      {props.timedOut && (
        <div className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-700">
          <p>Analiza przekroczyla limit czasu. Pokazano czesciowe wyniki.</p>
          {props.requestTime && (
            <p className="mt-1 text-xs">Czas wywolania: {new Date(props.requestTime).toLocaleString()}</p>
          )}
        </div>
      )}

      {props.error && <p className="mb-3 text-sm text-red-700">{props.error}</p>}

      {props.summary && (
        <div className="mb-4 grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 md:grid-cols-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">{props.summary.totalAreas}</div>
            <div className="text-xs uppercase text-slate-600">Calkowite</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{props.summary.criticalCount}</div>
            <div className="text-xs uppercase text-slate-600">Krytyczne</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{props.summary.highCount}</div>
            <div className="text-xs uppercase text-slate-600">Wysokie</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{props.summary.mediumCount}</div>
            <div className="text-xs uppercase text-slate-600">Srednie</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">{props.summary.lowCount}</div>
            <div className="text-xs uppercase text-slate-600">Niskie</div>
          </div>
          <div className="col-span-2 text-center md:col-span-3">
            <div className="text-sm text-slate-700">
              Srednia pewnosc: <span className="font-semibold">{props.summary.avgConfidence}%</span>
            </div>
            <div className="text-sm text-slate-700">
              Sredni oczekiwany efekt:{" "}
              <span className="font-semibold">{props.summary.avgExpectedImpact}%</span>
            </div>
          </div>
        </div>
      )}

      {props.optimizationAreas.length > 0 && (
        <ul className="space-y-3">
          {props.optimizationAreas.map((area, index) => (
            <li
              key={`${area.category}-${area.name}-${index}`}
              className="rounded-xl border border-slate-200 p-4"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded border bg-slate-50 px-2 py-0.5">{priorityLabel[area.priority]}</span>
                <span className="rounded border bg-slate-50 px-2 py-0.5">{statusLabel[area.status]}</span>
                <span className="rounded border bg-slate-50 px-2 py-0.5">{area.confidence}% pewnosc</span>
              </div>
              <h3 className="text-base font-semibold text-slate-900">{area.name}</h3>
              <p className="mt-1 text-sm text-slate-600">
                Kategoria: {area.category} | Oczekiwany efekt: {area.expectedImpact}% | Zrodlo:{" "}
                {area.source}
              </p>
            </li>
          ))}
        </ul>
      )}

      {props.optimizationAreas.length === 0 && !props.loading && !props.error && (
        <p className="text-sm text-slate-600">Brak priorytetowych obszarow do optymalizacji.</p>
      )}
    </section>
  );
}

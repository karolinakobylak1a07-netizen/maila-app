type ExpectedImpact = {
  metricType: "performance" | "reliability" | "security" | "compliance" | "scalability";
  metricName: string;
  currentValue: number;
  targetValue: number;
  expectedImprovement: number;
  improvementPercentage: number;
  improvementUnit: string;
  timeHorizonDays: number;
};

type OptimizationArea = {
  areaId: string;
  name: string;
  description: string;
  status: "not_started" | "in_progress" | "completed" | "failed";
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  confidence: "low" | "medium" | "high";
  expectedImpacts: ExpectedImpact[];
  estimatedEffortHours: number;
  estimatedEffortDays: number;
  estimatedCost: number;
  startDate?: Date;
  completedDate?: Date;
  percentageComplete: number;
  requestId?: string;
  lastSyncRequestId?: string;
  tags: string[];
};

type OptimizationSummary = {
  totalAreas: number;
  criticalAreas: number;
  highPriorityAreas: number;
  mediumPriorityAreas: number;
  lowPriorityAreas: number;
  totalEstimatedEffort: number;
  totalEstimatedCost: number;
  averageConfidence: "low" | "medium" | "high";
};

type OptimizationPrioritiesProps = {
  loading: boolean;
  error: string | null;
  insufficientData: boolean;
  timedOut: boolean;
  requestTime?: number;
  requestId: string | null;
  lastSyncRequestId?: string;
  optimizationAreas: OptimizationArea[];
  summary: OptimizationSummary;
};

const priorityLabel: Record<OptimizationArea["priority"], string> = {
  CRITICAL: "Krytyczny",
  HIGH: "Wysoki",
  MEDIUM: "Średni",
  LOW: "Niski",
};

const priorityClassname: Record<OptimizationArea["priority"], string> = {
  CRITICAL: "bg-red-50 text-red-700 border-red-200",
  HIGH: "bg-orange-50 text-orange-700 border-orange-200",
  MEDIUM: "bg-blue-50 text-blue-700 border-blue-200",
  LOW: "bg-slate-50 text-slate-700 border-slate-200",
};

const statusLabel: Record<OptimizationArea["status"], string> = {
  not_started: "nie_rozpoczety",
  in_progress: "w_trakcie",
  completed: "zakończony",
  failed: "nieudany",
};

const statusClassname: Record<OptimizationArea["status"], string> = {
  not_started: "bg-slate-50 text-slate-700 border-slate-200",
  in_progress: "bg-yellow-50 text-yellow-700 border-yellow-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  failed: "bg-red-50 text-red-700 border-red-200",
};

const confidenceLabel: Record<OptimizationArea["confidence"], string> = {
  low: "Niska",
  medium: "Średnia",
  high: "Wysoka",
};

const confidenceClassname: Record<OptimizationArea["confidence"], string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-emerald-100 text-emerald-700",
};

function formatTimeHorizon(days: number): string {
  if (days < 1) return "Termin";
  if (days === 1) return "1 dzień";
  if (days < 7) return `${days} dni`;
  if (days < 30) return `${Math.ceil(days / 7)} tygodni`;
  if (days < 365) return `${Math.ceil(days / 30)} miesięcy`;
  return `${Math.ceil(days / 365)} lat`;
}

export function OptimizationPrioritiesList(props: OptimizationPrioritiesProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-slate-900">Priorytetyczne obszary optymalizacji</h2>
        <div className="flex items-center gap-4 text-xs">
          <div className="text-slate-500">
            Ostatni sync: {props.lastSyncRequestId ? (
              <span className="font-mono">{props.lastSyncRequestId}</span>
            ) : (
              <span className="italic">Brak danych</span>
            )}
          </div>
        </div>
      </div>

      {props.requestId && (
        <p className="mb-3 text-xs text-slate-500">
          Request ID: {props.requestId}
        </p>
      )}

      <p className="mb-3 text-sm text-slate-600">
        Sugerowane obszary do optymalizacji na podstawie analizy luk i priorytetów. 
        Szacowane czas realizacji i koszty.
      </p>

      {props.loading && (
        <p className="text-sm text-slate-600">Wyszukiwanie priorytetowych obszarów...</p>
      )}

      {props.insufficientData && (
        <p className="mb-3 text-sm text-amber-700 bg-amber-50 p-3 rounded-md">
          Brak wystarczających danych do ustalenia priorytetów. 
          Dane są niekompletne lub występują problemy z synchronizacją.
        </p>
      )}

      {props.timedOut && props.requestTime && (
        <p className="mb-3 text-sm text-red-700 bg-red-50 p-3 rounded-md">
          Analiza przekroczyła limiter czasu. Dane mogą być nieaktualne.
          <br />
          Request ID: {props.requestId}
          <br />
          Czas wywołania: {new Date(props.requestTime).toLocaleString()}
        </p>
      )}

      {props.error && (
        <p className="mb-3 text-sm text-red-700">
          {props.error}
        </p>
      )}

      {props.summary && (
        <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-3 rounded-lg bg-slate-50 p-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">{props.summary.totalAreas}</div>
            <div className="text-xs text-slate-600 uppercase">Całkowite</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{props.summary.criticalAreas}</div>
            <div className="text-xs text-slate-600 uppercase">Krytyczne</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{props.summary.highPriorityAreas}</div>
            <div className="text-xs text-slate-600 uppercase">Wysokie</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{props.summary.mediumPriorityAreas}</div>
            <div className="text-xs text-slate-600 uppercase">Średnie</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">{props.summary.lowPriorityAreas}</div>
            <div className="text-xs text-slate-600 uppercase">Niskie</div>
          </div>
          <div className="col-span-2 md:col-span-4 text-center">
            <div className="text-sm text-slate-700">
              Szacowany czas: <span className="font-semibold">{props.summary.totalEstimatedEffort}h</span>
              ({props.summary.totalEstimatedEffort / 8} dni)
            </div>
          </div>
          <div className="col-span-2 md:col-span-4 text-center">
            <div className="text-sm text-slate-700">
              Szacowany koszt: <span className="font-semibold">{props.summary.totalEstimatedCost.toLocaleString()} PLN</span>
            </div>
          </div>
        </div>
      )}

      {props.optimizationAreas.length > 0 && (
        <ul className="space-y-3">
          {props.optimizationAreas.map((area) => (
            <li key={area.areaId} className="rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition-colors">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded border px-2 py-0.5 text-xs font-medium ${priorityClassname[area.priority]}`}>
                    {priorityLabel[area.priority]}
                  </span>
                  <span className={`rounded border px-2 py-0.5 text-xs ${statusClassname[area.status]}`}>
                    {statusLabel[area.status]}
                  </span>
                  <span className={`rounded border px-2 py-0.5 text-xs ${confidenceClassname[area.confidence]}`}>
                    {confidenceLabel[area.confidence]} pewność
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  {area.tags.map((tag) => (
                    <span key={tag} className="rounded bg-slate-100 px-2 py-0.5 text-slate-600">
                      {tag}
                    </span>
                  ))}
                  {area.estimatedEffortHours > 0 && (
                    <span className="rounded bg-blue-50 px-2 py-0.5 text-blue-700">
                      {area.estimatedEffortHours}h ({area.estimatedEffortDays} dni)
                    </span>
                  )}
                  {area.estimatedCost > 0 && (
                    <span className="rounded bg-green-50 px-2 py-0.5 text-green-700">
                      {area.estimatedCost.toLocaleString()} PLN
                    </span>
                  )}
                </div>
              </div>

              <h3 className="text-base font-semibold text-slate-900 mb-2">{area.name}</h3>
              <p className="text-sm text-slate-600 mb-4">{area.description}</p>

              {area.expectedImpacts.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">
                    Szacowane poprawy
                  </h4>
                  <div className="space-y-2">
                    {area.expectedImpacts.map((impact, index) => (
                      <div key={index} className="flex items-center justify-between rounded-lg bg-slate-50 p-2 text-sm">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-700 font-medium">{impact.metricName}</span>
                            <span className="text-slate-400">→</span>
                            <span className="text-slate-500">{impact.targetValue}</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {impact.improvementPercentage.toFixed(1)}% poprawa w {formatTimeHorizon(impact.timeHorizonDays)}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-emerald-700 font-medium">
                            +{impact.expectedImprovement} {impact.improvementUnit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {area.percentageComplete > 0 && (
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                    <span>Postęp</span>
                    <span>{area.percentageComplete}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-500"
                      style={{ width: `${area.percentageComplete}%` }}
                    />
                  </div>
                </div>
              )}

              {area.startDate && (
                <p className="text-xs text-slate-500">
                  Planowana data rozpoczęcia: {new Date(area.startDate).toLocaleDateString('pl-PL')}
                </p>
              )}

              {area.completedDate && (
                <p className="text-xs text-emerald-600">
                  Data zakończenia: {new Date(area.completedDate).toLocaleDateString('pl-PL')}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {props.optimizationAreas.length === 0 && !props.loading && !props.error && (
        <p className="text-sm text-slate-600">
          Brak priorytetowych obszarów do optymalizacji.
        </p>
      )}
    </section>
  );
}
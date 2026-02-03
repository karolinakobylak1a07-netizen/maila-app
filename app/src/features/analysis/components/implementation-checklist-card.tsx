"use client";

import type {
  ImplementationChecklist,
  ImplementationChecklistStepStatus,
} from "../contracts/analysis.schema";

type ImplementationChecklistCardProps = {
  loading: boolean;
  generating: boolean;
  updatingStepId: string | null;
  error: string | null;
  requestId: string | null;
  checklist: ImplementationChecklist | null;
  onGenerate: () => void;
  onUpdateStep: (stepId: string, status: ImplementationChecklistStepStatus) => void;
};

export function ImplementationChecklistCard(props: ImplementationChecklistCardProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-slate-900">Checklista wdrozeniowa</h2>
        <button
          type="button"
          onClick={props.onGenerate}
          disabled={props.generating}
          className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {props.generating ? "Generowanie..." : "Generuj checkliste"}
        </button>
      </div>

      {props.requestId && <p className="mb-2 text-xs text-slate-500">Request ID: {props.requestId}</p>}
      {props.loading && <p className="text-sm text-slate-600">Ladowanie checklisty...</p>}
      {props.error && <p className="text-sm text-red-700">{props.error}</p>}

      {!props.loading && !props.error && !props.checklist && (
        <p className="text-sm text-slate-600">Brak checklisty wdrozeniowej.</p>
      )}

      {!props.loading && !props.error && props.checklist && (
        <div className="space-y-3 text-sm text-slate-700">
          <p>
            Status: <span className="font-medium">{props.checklist.status}</span>
          </p>
          <p>
            Postep: <span className="font-medium">{props.checklist.completedSteps}/{props.checklist.totalSteps}</span>
            {" "}({props.checklist.progressPercent}%)
          </p>
          <ul className="space-y-2">
            {props.checklist.steps.map((step) => {
              const isUpdating = props.updatingStepId === step.id;
              return (
                <li key={step.id} className="rounded border border-slate-200 p-2">
                  <p className="font-medium">{step.title}</p>
                  <p className="text-xs text-slate-500">{step.sourceType}: {step.sourceRef}</p>
                  <p>
                    Status: <span className="font-medium">{step.status}</span>
                    {step.completedAt ? ` • wykonano: ${step.completedAt.toLocaleString()}` : ""}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => props.onUpdateStep(step.id, "pending")}
                      className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 disabled:cursor-not-allowed"
                    >
                      Pending
                    </button>
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => props.onUpdateStep(step.id, "in_progress")}
                      className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 disabled:cursor-not-allowed"
                    >
                      W toku
                    </button>
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => props.onUpdateStep(step.id, "done")}
                      className="rounded border border-emerald-300 px-2 py-1 text-xs text-emerald-700 disabled:cursor-not-allowed"
                    >
                      Done
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}

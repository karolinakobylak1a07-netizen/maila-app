type GapItem = {
  id: string;
  category: "FLOW" | "SEGMENT" | "LOGIC";
  status: "OK" | "GAP" | "INSUFFICIENT_DATA";
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  name: string;
  reason: string;
};

type GapListCardProps = {
  loading: boolean;
  error: string | null;
  forbidden: boolean;
  staleWarning: boolean;
  activeClientId: string | null;
  items: GapItem[];
  lastSyncRequestId: string | null;
};

const statusLabel: Record<GapItem["status"], string> = {
  OK: "ok",
  GAP: "gap",
  INSUFFICIENT_DATA: "insufficient_data",
};

const statusClassname: Record<GapItem["status"], string> = {
  OK: "bg-emerald-50 text-emerald-700 border-emerald-200",
  GAP: "bg-rose-50 text-rose-700 border-rose-200",
  INSUFFICIENT_DATA: "bg-amber-50 text-amber-700 border-amber-200",
};

const priorityLabel: Record<GapItem["priority"], string> = {
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
};

export function GapListCard(props: GapListCardProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="mb-1 text-lg font-medium text-slate-900">Raport luk konfiguracji</h2>
      {props.lastSyncRequestId && (
        <p className="mb-2 text-xs text-slate-500">
          Request ID ostatniego sync: {props.lastSyncRequestId}
        </p>
      )}
      <p className="mb-3 text-sm text-slate-600">
        Braki w flow, segmentach i logice na podstawie ostatniego sync.
      </p>

      {!props.activeClientId && (
        <p className="text-sm text-slate-600">Wybierz aktywnego klienta, aby zobaczyc raport luk.</p>
      )}

      {props.activeClientId && props.loading && (
        <p className="text-sm text-slate-600">Ladowanie raportu luk...</p>
      )}

      {props.activeClientId && props.forbidden && props.error && (
        <p className="mb-3 text-sm text-red-700">
          Brak dostepu do audytu luk. Przelacz role lub klienta z odpowiednimi uprawnieniami.
        </p>
      )}

      {props.activeClientId && props.staleWarning && !props.error && (
        <p className="mb-3 text-sm text-amber-700">
          Dane sync sa stale - raport moze byc nieaktualny.
        </p>
      )}

      {props.activeClientId && !props.loading && !props.error && props.items.length === 0 && (
        <p className="text-sm text-slate-600">Brak danych do raportu. Wykonaj sync, aby rozpoczac audyt.</p>
      )}

      {props.activeClientId && props.items.length > 0 && (
        <ul className="space-y-2">
          {props.items.map((item) => (
            <li key={item.id} className="rounded-md border border-slate-200 p-3">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs uppercase">
                <span className={`rounded border px-2 py-0.5 ${statusClassname[item.status]}`}>
                  {statusLabel[item.status]}
                </span>
                <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-700">
                  {priorityLabel[item.priority]}
                </span>
                <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-700">
                  {item.category.toLowerCase()}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-900">{item.name}</p>
              <p className="mt-1 text-sm text-slate-600">{item.reason}</p>
            </li>
          ))}
        </ul>
      )}

      {props.error && <p className="mt-3 text-sm text-red-600">{props.error}</p>}
    </section>
  );
}

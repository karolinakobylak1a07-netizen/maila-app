type SyncStatusCardProps = {
  loading: boolean;
  syncing: boolean;
  error: string | null;
  success: string | null;
  canSync: boolean;
  activeClientId: string | null;
  lastSyncAt: Date | null;
  lastSyncStatus: string | null;
  stale: boolean;
  counts: {
    accountCount: number;
    flowCount: number;
    emailCount: number;
    formCount: number;
  };
  onSyncNow: () => void;
};

const formatDate = (value: Date | null) => {
  if (!value) {
    return "brak";
  }

  return new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
};

const statusLabel = (status: string | null) => {
  if (!status) {
    return "brak";
  }

  if (status === "OK") {
    return "ok";
  }

  if (status === "FAILED_AUTH") {
    return "failed_auth";
  }

  if (status === "PARTIAL_OR_TIMEOUT") {
    return "partial_or_timeout";
  }

  if (status === "IN_PROGRESS") {
    return "in_progress";
  }

  return status.toLowerCase();
};

export function SyncStatusCard(props: SyncStatusCardProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="mb-1 text-lg font-medium text-slate-900">Klaviyo audit sync</h2>
      <p className="mb-3 text-sm text-slate-600">
        Sync manualny lub dzienny dla danych konto/flow/email/formularze.
      </p>

      {!props.activeClientId && (
        <p className="text-sm text-slate-600">Wybierz aktywnego klienta, aby uruchomic sync.</p>
      )}

      {props.activeClientId && (
        <>
          <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
            <p>Ostatni sync: {formatDate(props.lastSyncAt)}</p>
            <p>Status: {statusLabel(props.lastSyncStatus)}</p>
            <p>Konto: {props.counts.accountCount}</p>
            <p>Flow: {props.counts.flowCount}</p>
            <p>Email: {props.counts.emailCount}</p>
            <p>Formularze: {props.counts.formCount}</p>
          </div>

          {props.stale && (
            <p className="mt-2 text-sm text-amber-700">
              Dane sa nieaktualne. Uruchom sync, aby odswiezyc inwentaryzacje.
            </p>
          )}

          <div className="mt-3">
            <button
              type="button"
              onClick={props.onSyncNow}
              disabled={!props.canSync || props.syncing || props.loading}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {props.syncing ? "Sync w toku..." : "Sync teraz"}
            </button>
          </div>

          {props.error && <p className="mt-3 text-sm text-red-600">{props.error}</p>}
          {props.success && <p className="mt-3 text-sm text-emerald-700">{props.success}</p>}
        </>
      )}
    </section>
  );
}

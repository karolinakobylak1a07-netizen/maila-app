"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type SyncForm = {
  clientName: string;
  platform: "shopify" | "woocommerce" | "magento" | "bigcommerce" | "prestashop" | "custom_api";
  shopifyStoreDomain: string;
  klaviyoPrivateApiKey: string;
  klaviyoPublicApiKey: string;
  clientEmail: string;
};

type SyncResult = {
  status: "success" | "failed" | "already_connected" | "partial";
  statusLabel: string;
  message: string;
  savedClientId: string;
  platform: SyncForm["platform"];
  shopifyStoreDomain: string;
  revenueEmail24h: number;
  revenueEmailPercentOfShopify24h: number | null;
  tiles: Array<{
    title: string;
    status: "ok" | "warning" | "fail" | "unknown";
    reason: string;
    details?: string[];
  }>;
  eventCoverage: Array<{
    metric: string;
    source: "web_tracking" | "integration";
    lastSeen: string | null;
    count24h: number;
    count7d: number;
    everSeen: boolean;
    status: "ok" | "no_traffic" | "broken";
  }>;
  metrics: Record<string, boolean>;
  recentEvents: Record<string, boolean | null>;
  checks: Array<{
    title: string;
    status: "ok" | "warning" | "fail" | "unknown";
    message: string;
  }>;
  nextActions: Array<{
    id: string;
    title: string;
    priority: "high" | "medium" | "low";
    reason: string;
    steps: string[];
  }>;
  checkedAt: string;
  topBlockers: string[];
  blockers: string[];
};

const STORAGE_KEY = "client-sync-form-v2";

const initialForm: SyncForm = {
  clientName: "",
  platform: "shopify",
  shopifyStoreDomain: "",
  klaviyoPrivateApiKey: "",
  klaviyoPublicApiKey: "",
  clientEmail: "",
};

type SavedSyncItem = {
  clientId: string;
  clientName: string;
  clientEmail?: string | null;
  platform: SyncForm["platform"];
  platformLabel: string;
  storeDomain: string;
  statusCode: SyncResult["status"] | "unknown";
  status: string;
  checkedAt: string;
};

const Field = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "password";
  placeholder?: string;
}) => (
  <label className="flex flex-col gap-1 text-sm text-slate-700">
    {label}
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-md border border-slate-300 px-3 py-2 outline-none ring-sky-300 focus:ring"
      placeholder={placeholder}
    />
  </label>
);

export function ClientSyncOnboarding() {
  const router = useRouter();
  const [form, setForm] = useState<SyncForm>(() => {
    if (typeof window === "undefined") {
      return initialForm;
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return initialForm;
      }
      return {
        ...initialForm,
        ...(JSON.parse(raw) as Partial<SyncForm>),
        // Private key should be provided per synchronization run.
        klaviyoPrivateApiKey: "",
      };
    } catch {
      return initialForm;
    }
  });
  const [result, setResult] = useState<SyncResult | null>(null);
  const [savedSyncs, setSavedSyncs] = useState<SavedSyncItem[]>([]);
  const [historyPlatformFilter, setHistoryPlatformFilter] = useState<"all" | SyncForm["platform"]>("all");
  const [historyStatusFilter, setHistoryStatusFilter] = useState<"all" | SyncResult["status"]>("all");
  const [historySearch, setHistorySearch] = useState("");
  const [openingClientId, setOpeningClientId] = useState<string | null>(null);
  const [openingListAuditClientId, setOpeningListAuditClientId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [hoveredActionId, setHoveredActionId] = useState<string | null>(null);
  const [pinnedActions, setPinnedActions] = useState<Record<string, boolean>>({});

  const update = <K extends keyof SyncForm>(key: K, value: SyncForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const saveLocally = () => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...form,
          klaviyoPrivateApiKey: "",
        }),
      );
      setSavedAt(new Date().toLocaleString("pl-PL"));
      setSyncError(null);
    } catch {
      setSyncError("Nie udalo sie zapisac danych lokalnie (localStorage).");
    }
  };

  const loadSavedSyncs = async () => {
    try {
      const response = await fetch("/api/clients/sync", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as
        | { data?: SavedSyncItem[] }
        | null;
      setSavedSyncs(Array.isArray(payload?.data) ? payload.data : []);
    } catch {
      setSavedSyncs([]);
    }
  };

  useEffect(() => {
    void loadSavedSyncs();
  }, []);

  const syncNow = async () => {
    const missing: string[] = [];
    if (!form.clientName.trim()) missing.push("Nazwa klienta");
    if (!form.shopifyStoreDomain.trim()) missing.push("Domena sklepu");
    if (!form.klaviyoPrivateApiKey.trim()) missing.push("Klaviyo Private API Key");
    if (missing.length > 0) {
      setSyncError(`Uzupelnij wymagane pola: ${missing.join(", ")}.`);
      return;
    }

    setSyncError(null);
    setResult(null);
    setSyncing(true);

    try {
      const response = await fetch("/api/clients/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientName: form.clientName,
          platform: form.platform,
          storeDomain: form.shopifyStoreDomain,
          shopifyStoreDomain: form.shopifyStoreDomain,
          klaviyoPrivateApiKey: form.klaviyoPrivateApiKey,
          klaviyoPublicApiKey: form.klaviyoPublicApiKey,
          clientEmail: form.clientEmail,
        }),
      });

      const rawBody = await response.text().catch(() => "");
      let payload: { data?: SyncResult; error?: string; details?: string } | null = null;
      if (rawBody) {
        try {
          payload = JSON.parse(rawBody) as { data?: SyncResult; error?: string; details?: string };
        } catch {
          payload = null;
        }
      }

      if (!response.ok || !payload?.data) {
        const detailSuffix = payload?.details ? ` Szczegoly: ${payload.details}` : "";
        const fallback = `Synchronizacja nie powiodla sie (HTTP ${response.status}).`;
        setSyncError((payload?.error ?? fallback) + detailSuffix);
        return;
      }

      setResult(payload.data);
      setLastSyncAt(new Date().toLocaleString("pl-PL"));
      await loadSavedSyncs();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nie udalo sie polaczyc z serwerem synchronizacji.";
      setSyncError(message);
    } finally {
      setSyncing(false);
    }
  };

  const progressSummary = useMemo(() => {
    if (!result) {
      return null;
    }
    const total = result.checks.length;
    if (total === 0) {
      return { total: 0, done: 0, percent: 0 };
    }
    const done = result.checks.filter((check) => check.status === "ok").length;
    return { total, done, percent: Math.round((done / total) * 100) };
  }, [result]);

  const filteredHistory = useMemo(() => {
    const search = historySearch.trim().toLowerCase();
    return savedSyncs.filter((item) => {
      const platformMatch =
        historyPlatformFilter === "all" || item.platform === historyPlatformFilter;
      const statusMatch =
        historyStatusFilter === "all" || item.statusCode === historyStatusFilter;
      const searchMatch =
        search.length === 0 ||
        item.clientName.toLowerCase().includes(search) ||
        item.storeDomain.toLowerCase().includes(search);
      return platformMatch && statusMatch && searchMatch;
    });
  }, [savedSyncs, historyPlatformFilter, historyStatusFilter, historySearch]);

  const checkStatusLabel = (status: "ok" | "warning" | "fail" | "unknown") => {
    if (status === "ok") {
      return "OK";
    }
    if (status === "warning") {
      return "UWAGA";
    }
    if (status === "fail") {
      return "BLAD";
    }
    return "N/D";
  };

  const checkStatusIcon = (status: "ok" | "warning" | "fail" | "unknown") => {
    if (status === "ok") return <span className="text-emerald-600">●</span>;
    if (status === "warning") return <span className="text-amber-500">▲</span>;
    if (status === "fail") return <span className="text-red-600">●</span>;
    return <span className="text-slate-400">●</span>;
  };

  const circleColor = (percent: number) => {
    if (percent >= 70) return "text-emerald-700";
    if (percent >= 30) return "text-amber-700";
    return "text-red-700";
  };

  const actionPriorityLabel = (priority: "high" | "medium" | "low") => {
    if (priority === "high") return "WYSOKI";
    if (priority === "medium") return "SREDNI";
    return "NISKI";
  };

  const actionPriorityClass = (priority: "high" | "medium" | "low") => {
    if (priority === "high") return "text-red-700 bg-red-50 border-red-200";
    if (priority === "medium") return "text-amber-700 bg-amber-50 border-amber-200";
    return "text-emerald-700 bg-emerald-50 border-emerald-200";
  };

  const togglePinnedAction = (actionId: string) => {
    setPinnedActions((prev) => ({ ...prev, [actionId]: !prev[actionId] }));
  };

  const openClientInWorkspace = async (clientId: string) => {
    setOpeningClientId(clientId);
    try {
      const response = await fetch("/api/clients/sync/open", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ clientId }),
      });

      if (!response.ok) {
        return;
      }

      router.push("/clients#sync-status");
      router.refresh();
    } finally {
      setOpeningClientId(null);
    }
  };

  const openListAudit = async (clientId: string, clientName?: string, clientEmail?: string | null) => {
    setOpeningListAuditClientId(clientId);
    try {
      await fetch("/api/clients/sync/open", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ clientId }),
      });
      const params = new URLSearchParams();
      params.set("clientId", clientId);
      if (clientName) params.set("clientName", clientName);
      if (clientEmail) params.set("clientEmail", clientEmail);
      router.push(`/clients/connect/klaviyo-list-audit?${params.toString()}`);
      router.refresh();
    } finally {
      setOpeningListAuditClientId(null);
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Sync klienta: sklep + Klaviyo</h1>
          <p className="text-sm text-slate-600">
            Wpisz dane i kliknij „Zsynchronizuj”. Weryfikacja opiera sie na danych z Klaviyo.
          </p>
        </div>
        <Link
          href="/clients"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800"
        >
          Powrot
        </Link>
      </header>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-medium text-slate-900">Dane integracji</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Nazwa klienta"
            value={form.clientName}
            onChange={(value) => update("clientName", value)}
            placeholder="np. FitStore"
          />
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Platforma sklepu
            <select
              value={form.platform}
              onChange={(event) => update("platform", event.target.value as SyncForm["platform"])}
              className="rounded-md border border-slate-300 px-3 py-2 outline-none ring-sky-300 focus:ring"
            >
              <option value="shopify">Shopify</option>
              <option value="woocommerce">WooCommerce</option>
              <option value="magento">Magento</option>
              <option value="bigcommerce">BigCommerce</option>
              <option value="prestashop">PrestaShop</option>
              <option value="custom_api">Custom API (wlasny sklep)</option>
            </select>
          </label>
          <Field
            label="Domena sklepu"
            value={form.shopifyStoreDomain}
            onChange={(value) => update("shopifyStoreDomain", value)}
            placeholder="np. sklep.pl lub twoj-sklep.myshopify.com"
          />
          <Field
            label="Klaviyo Private API Key"
            value={form.klaviyoPrivateApiKey}
            onChange={(value) => update("klaviyoPrivateApiKey", value)}
            type="password"
            placeholder="pk_..."
          />
          <Field
            label="Klaviyo Public API Key"
            value={form.klaviyoPublicApiKey}
            onChange={(value) => update("klaviyoPublicApiKey", value)}
            placeholder="SF..."
          />
          <Field
            label="Email klienta"
            value={form.clientEmail}
            onChange={(value) => update("clientEmail", value)}
            type="email"
            placeholder="klient@firma.pl"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={syncNow}
            disabled={syncing}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {syncing ? "Synchronizacja..." : "Zsynchronizuj"}
          </button>
          <button
            type="button"
            onClick={saveLocally}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm"
          >
            Zapisz dane z formularza
          </button>
          <p className="text-xs text-slate-500">
            {savedAt ? `Zapisano lokalnie: ${savedAt}` : "Dane zapisywane tylko po kliknieciu przycisku."}
          </p>
          {lastSyncAt && <p className="text-xs text-emerald-700">Ostatnia synchronizacja: {lastSyncAt}</p>}
        </div>

        {syncError && <p className="mt-3 text-sm text-red-600">{syncError}</p>}
      </div>

      {result && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-lg font-medium text-slate-900">Raport synchronizacji</h2>
          <p className="text-sm text-slate-700">
            Status: <strong>{result.statusLabel}</strong> | {result.message}
          </p>
          <p className="text-xs text-slate-500">
            Klient zapisany jako ID: {result.savedClientId} | Platforma: {result.platform}
          </p>
          <p className="text-xs text-slate-500">Revenue email (Klaviyo, 24h): {result.revenueEmail24h.toFixed(2)}</p>
          {result.revenueEmailPercentOfShopify24h !== null && (
            <div className="mt-2 flex items-center gap-3">
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-full border-4 border-slate-300 text-sm font-semibold ${circleColor(
                  result.revenueEmailPercentOfShopify24h,
                )}`}
              >
                {result.revenueEmailPercentOfShopify24h.toFixed(0)}%
              </div>
              <p className="text-xs text-slate-600">Revenue email vs zrodlo sprzedazy (24h)</p>
            </div>
          )}
          {result.topBlockers.length > 0 && (
            <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-2">
              <p className="text-xs font-semibold text-red-800">Top blockers</p>
              <ul className="list-disc pl-5 text-xs text-red-700">
                {result.topBlockers.map((blocker) => (
                  <li key={blocker}>{blocker}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-slate-500">
            Sklep: {result.shopifyStoreDomain} | Sprawdzone: {new Date(result.checkedAt).toLocaleString("pl-PL")}
          </p>
          <div className="mt-4 rounded-md border border-slate-200 p-3">
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Tabela eventow (coverage)</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-xs text-slate-700">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-600">
                    <th className="px-2 py-1 font-medium">Metryka</th>
                    <th className="px-2 py-1 font-medium">Metryka w Klaviyo</th>
                    <th className="px-2 py-1 font-medium">Zrodlo</th>
                    <th className="px-2 py-1 font-medium">24h</th>
                    <th className="px-2 py-1 font-medium">7d</th>
                    <th className="px-2 py-1 font-medium">Ever</th>
                    <th className="px-2 py-1 font-medium">Data</th>
                    <th className="px-2 py-1 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {result.eventCoverage.map((row) => {
                    const metricPresent = result.metrics[row.metric] === true;
                    return (
                      <tr key={row.metric} className="border-b border-slate-100">
                        <td className="px-2 py-1">{row.metric}</td>
                        <td className="px-2 py-1">
                          <span className={metricPresent ? "font-medium text-emerald-700" : "font-medium text-red-700"}>
                            {metricPresent ? "OK" : "Brak"}
                          </span>
                        </td>
                        <td className="px-2 py-1">{row.source === "web_tracking" ? "web" : "integration"}</td>
                        <td className="px-2 py-1">{row.count24h}</td>
                        <td className="px-2 py-1">{row.count7d}</td>
                        <td className="px-2 py-1">{row.everSeen ? "YES" : "NO"}</td>
                        <td className="px-2 py-1">
                          {row.lastSeen ? new Date(row.lastSeen).toLocaleDateString("pl-PL") : "brak"}
                        </td>
                        <td className="px-2 py-1">
                          {row.status === "ok"
                            ? "OK"
                            : row.status === "no_traffic"
                              ? "NO TRAFFIC"
                              : "BROKEN"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-slate-200 p-3">
              <h3 className="mb-2 text-sm font-semibold text-slate-900">Kontrole jakosci</h3>
              <ul className="space-y-2 text-sm text-slate-700">
                {result.checks.map((check) => (
                  <li key={check.title} className="rounded border border-slate-100 p-2">
                    <p className="flex items-center gap-2 font-medium">
                      {checkStatusIcon(check.status)}
                      <span>[{checkStatusLabel(check.status)}] {check.title}</span>
                    </p>
                    <p>{check.message}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-md border border-slate-200 p-3">
              <h3 className="mb-2 text-sm font-semibold text-slate-900">Next best actions</h3>
              {result.nextActions.length === 0 ? (
                <p className="text-xs text-slate-600">Brak akcji naprawczych.</p>
              ) : (
                <ul className="space-y-2 text-sm text-slate-700">
                  {result.nextActions.map((action) => (
                    <li
                      key={action.id}
                      className="cursor-pointer rounded border border-slate-100 p-2"
                      onMouseEnter={() => setHoveredActionId(action.id)}
                      onMouseLeave={() => setHoveredActionId((prev) => (prev === action.id ? null : prev))}
                      onClick={() => togglePinnedAction(action.id)}
                    >
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{action.title}</p>
                        <span
                          className={`rounded border px-1.5 py-0.5 text-[10px] ${actionPriorityClass(action.priority)}`}
                        >
                          {actionPriorityLabel(action.priority)}
                        </span>
                        {pinnedActions[action.id] && (
                          <span className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-700">
                            PRZYPINAM
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600">{action.reason}</p>
                      {(hoveredActionId === action.id || pinnedActions[action.id]) && (
                        <ul className="mt-1 list-disc pl-5 text-xs text-slate-700">
                          {action.steps.map((step) => (
                            <li key={step}>{step}</li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {result.blockers.length > 0 && (
            <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <p className="font-medium">Blokery:</p>
              <ul className="list-disc pl-5">
                {result.blockers.map((blocker) => (
                  <li key={blocker}>{blocker}</li>
                ))}
              </ul>
            </div>
          )}

          {progressSummary && (
            <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-medium text-slate-900">
                Podsumowanie checklisty: {progressSummary.done}/{progressSummary.total} OK ({progressSummary.percent}%)
              </p>
              <div className="mt-2 h-2 w-full rounded bg-slate-200">
                <div
                  className="h-2 rounded bg-slate-900 transition-all"
                  style={{ width: `${progressSummary.percent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-2 text-lg font-medium text-slate-900">Zapamietane synchronizacje klientow</h2>
        <div className="mb-3 grid gap-2 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-xs text-slate-600">
            Platforma
            <select
              value={historyPlatformFilter}
              onChange={(event) =>
                setHistoryPlatformFilter(event.target.value as "all" | SyncForm["platform"])
              }
              className="rounded-md border border-slate-300 px-2 py-2 text-sm"
            >
              <option value="all">Wszystkie</option>
              <option value="shopify">Shopify</option>
              <option value="woocommerce">WooCommerce</option>
              <option value="magento">Magento</option>
              <option value="bigcommerce">BigCommerce</option>
              <option value="prestashop">PrestaShop</option>
              <option value="custom_api">Custom API</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-600">
            Status
            <select
              value={historyStatusFilter}
              onChange={(event) =>
                setHistoryStatusFilter(event.target.value as "all" | SyncResult["status"])
              }
              className="rounded-md border border-slate-300 px-2 py-2 text-sm"
            >
              <option value="all">Wszystkie</option>
              <option value="success">Powodzenie</option>
              <option value="already_connected">Juz zintegrowany</option>
              <option value="partial">Czesciowe</option>
              <option value="failed">Blad</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-600">
            Szukaj
            <input
              value={historySearch}
              onChange={(event) => setHistorySearch(event.target.value)}
              className="rounded-md border border-slate-300 px-2 py-2 text-sm"
              placeholder="Nazwa klienta lub domena"
            />
          </label>
        </div>

        {filteredHistory.length === 0 ? (
          <p className="text-sm text-slate-600">Brak zapisanych synchronizacji.</p>
        ) : (
          <ul className="space-y-2 text-sm text-slate-700">
            {filteredHistory.map((item) => {
              const isCurrentlySynced =
                item.statusCode === "success" || item.statusCode === "already_connected";
              return (
              <li
                key={item.clientId}
                className={`rounded-md border p-2 ${
                  isCurrentlySynced ? "border-emerald-300 bg-emerald-50/40" : "border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">
                      {item.clientName}{" "}
                      {isCurrentlySynced && (
                        <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-medium tracking-wide text-emerald-700">
                          AKTUALNIE ZSYNCHRONIZOWANY
                        </span>
                      )}
                    </p>
                    <p>
                      {item.platformLabel} | {item.storeDomain}
                    </p>
                    <p>
                      {item.status} | {new Date(item.checkedAt).toLocaleString("pl-PL")}
                    </p>
                    <button
                      type="button"
                      onClick={() => void openClientInWorkspace(item.clientId)}
                      disabled={openingClientId === item.clientId}
                      className="mt-2 rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white disabled:opacity-60"
                    >
                      {openingClientId === item.clientId ? "Otwieranie..." : "Otworz klienta w workspace"}
                    </button>
                  </div>
                  {isCurrentlySynced && (
                  <button
                    type="button"
                    onClick={() => void openListAudit(item.clientId, item.clientName, item.clientEmail)}
                    disabled={openingListAuditClientId === item.clientId}
                    className="shrink-0 rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                  >
                    {openingListAuditClientId === item.clientId ? "Otwieram..." : "Przeprowadz audyt"}
                  </button>
                  )}
                </div>
              </li>
            )})}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-2 text-lg font-medium text-slate-900">Praktyczne instrukcje Klaviyo</h2>
        <p className="mb-3 text-sm text-slate-600">
          3 szybkie odpowiedzi na najczestsze pytania.
        </p>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-slate-200 p-3 text-left">
            <p className="text-sm font-semibold text-slate-900">Added to Cart</p>
            <p className="mt-1 text-xs text-slate-600">
              Pelna instrukcja krok po kroku: warunki startowe, testy i fallback snippet.
            </p>
            <Link
              href="/clients/connect/klaviyo-shopify-added-to-cart"
              className="mt-3 inline-flex rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white"
            >
              Sprawdz instrukcje
            </Link>
          </div>

          <div className="rounded-md border border-slate-200 p-3 text-left">
            <p className="text-sm font-semibold text-slate-900">Domeny: szybka instrukcja</p>
            <p className="mt-1 text-xs text-slate-600">Branded sending domain krok po kroku.</p>
            <Link
              href="/clients/connect/klaviyo-domain-setup"
              className="mt-3 inline-flex items-center rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white"
            >
              Ustaw domene
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}

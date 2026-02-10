"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type SavedSyncItem = {
  clientId: string;
  clientName: string;
  clientEmail: string | null;
};
type ActiveContact = {
  clientId: string;
  clientName: string;
  clientEmail: string | null;
};

const buildClientMessage = (params: {
  clientName: string;
  dkimRecord: string;
  returnPathRecord: string;
  trackingRecord: string;
}) => `Czesc ${params.clientName},

przesylam rekordy DNS do dodania u dostawcy domeny pod konfiguracje Klaviyo:

1) DKIM:
${params.dkimRecord}

2) Return-Path:
${params.returnPathRecord}

3) Tracking:
${params.trackingRecord}

Po dodaniu rekordow daj prosze znac - zrobie od razu finalna weryfikacje po naszej stronie.
`;

export function KlaviyoDomainSetupGuide() {
  const [savedSyncs, setSavedSyncs] = useState<SavedSyncItem[]>([]);
  const [activeContact, setActiveContact] = useState<ActiveContact | null>(null);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [selectedClientName, setSelectedClientName] = useState("Zespol");
  const [dkimRecord, setDkimRecord] = useState("");
  const [returnPathRecord, setReturnPathRecord] = useState("");
  const [trackingRecord, setTrackingRecord] = useState("");
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const [syncResponse, activeResponse] = await Promise.all([
        fetch("/api/clients/sync", { cache: "no-store" }),
        fetch("/api/clients/sync/active-contact", { cache: "no-store" }),
      ]);
      const syncPayload = (await syncResponse.json().catch(() => null)) as
        | { data?: SavedSyncItem[] }
        | null;
      const activePayload = (await activeResponse.json().catch(() => null)) as
        | { data?: ActiveContact | null }
        | null;
      setSavedSyncs(Array.isArray(syncPayload?.data) ? syncPayload.data : []);
      setActiveContact(activePayload?.data ?? null);
    };
    void loadData();
  }, []);

  const emailOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of savedSyncs) {
      if (!item.clientEmail) continue;
      if (!map.has(item.clientEmail)) {
        map.set(item.clientEmail, item.clientName);
      }
    }
    return Array.from(map.entries()).map(([email, clientName]) => ({ email, clientName }));
  }, [savedSyncs]);

  const message = useMemo(
    () =>
      buildClientMessage({
        clientName: selectedClientName,
        dkimRecord: dkimRecord || "[uzupelnij rekord DKIM]",
        returnPathRecord: returnPathRecord || "[uzupelnij rekord Return-Path]",
        trackingRecord: trackingRecord || "[uzupelnij rekord Tracking]",
      }),
    [selectedClientName, dkimRecord, returnPathRecord, trackingRecord],
  );

  const canSend =
    approved &&
    selectedEmail.trim().length > 0 &&
    dkimRecord.trim().length > 0 &&
    returnPathRecord.trim().length > 0 &&
    trackingRecord.trim().length > 0;

  useEffect(() => {
    if (!activeContact) return;
    setSelectedClientName(activeContact.clientName || "Zespol");
    if (activeContact.clientEmail) {
      setSelectedEmail(activeContact.clientEmail);
    }
  }, [activeContact]);

  const sendMail = () => {
    if (!canSend) return;
    const subject = encodeURIComponent("Klaviyo - rekordy DNS do wdrozenia");
    const body = encodeURIComponent(message);
    window.location.href = `mailto:${selectedEmail}?subject=${subject}&body=${body}`;
  };

  const onEmailChange = (email: string) => {
    setSelectedEmail(email);
    const option = emailOptions.find((item) => item.email === email);
    setSelectedClientName(option?.clientName ?? "Zespol");
  };

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Klaviyo - konfiguracja domeny</h1>
          <p className="text-sm text-slate-600">Wpisz 3 rekordy, wybierz mail klienta i kliknij wyslij.</p>
        </div>
        <Link href="/clients/connect" className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800">
          Powrot
        </Link>
      </header>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-medium text-slate-900">Dane do wiadomosci</h2>
        {activeContact?.clientName && (
          <p className="mb-3 text-xs text-slate-600">
            Kontekst workspace: <strong>{activeContact.clientName}</strong>
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Email klienta
            <select
              value={selectedEmail}
              onChange={(event) => onEmailChange(event.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2"
            >
              <option value="">Wybierz email klienta</option>
              {emailOptions.map((option) => (
                <option key={option.email} value={option.email}>
                  {option.clientName} - {option.email}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Nazwa klienta (personalizacja)
            <input
              value={selectedClientName}
              onChange={(event) => setSelectedClientName(event.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700 sm:col-span-2">
            Rekord 1 - DKIM
            <textarea
              value={dkimRecord}
              onChange={(event) => setDkimRecord(event.target.value)}
              rows={2}
              className="rounded-md border border-slate-300 px-3 py-2"
              placeholder="selector._domainkey CNAME/TXT ..."
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700 sm:col-span-2">
            Rekord 2 - Return-Path
            <textarea
              value={returnPathRecord}
              onChange={(event) => setReturnPathRecord(event.target.value)}
              rows={2}
              className="rounded-md border border-slate-300 px-3 py-2"
              placeholder="em123.example.com CNAME ..."
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700 sm:col-span-2">
            Rekord 3 - Tracking
            <textarea
              value={trackingRecord}
              onChange={(event) => setTrackingRecord(event.target.value)}
              rows={2}
              className="rounded-md border border-slate-300 px-3 py-2"
              placeholder="send.example.com CNAME ..."
            />
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-2 text-lg font-medium text-slate-900">Instrukcja dla Ciebie (operatora)</h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
          <li>W Klaviyo: Settings -&gt; Domains -&gt; Add Domain.</li>
          <li>Skopiuj 3 rekordy z Klaviyo: DKIM, Return-Path, Tracking.</li>
          <li>Wklej je w pola powyzej i zatwierdz wiadomosc.</li>
          <li>Wyslij klientowi - on wdraza rekordy u swojego dostawcy domeny.</li>
          <li>Po potwierdzeniu od klienta kliknij Verify w Klaviyo.</li>
        </ol>
        <p className="mt-2 text-xs text-slate-600">
          Referencja Klaviyo:{" "}
          <a
            href="https://help.klaviyo.com/hc/en-us/articles/115000357752"
            target="_blank"
            rel="noreferrer"
            className="text-sky-700 underline"
          >
            branded sending domain setup
          </a>
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-2 text-lg font-medium text-slate-900">Podglad wiadomosci</h2>
        <pre className="overflow-x-auto rounded-md border border-slate-200 bg-slate-50 p-3 text-[12px] text-slate-700">
{message}
        </pre>
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={approved} onChange={(event) => setApproved(event.target.checked)} />
          Zatwierdzam tresc i chce wyslac do klienta
        </label>
        <button
          type="button"
          onClick={sendMail}
          disabled={!canSend}
          className="mt-3 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Wyslij
        </button>
      </div>
    </section>
  );
}

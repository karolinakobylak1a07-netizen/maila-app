"use client";

import Link from "next/link";
import { useState } from "react";

const FALLBACK_SNIPPET = `<script>
(function () {
  window._learnq = window._learnq || [];

  const originalFetch = window.fetch;
  if (!originalFetch) return;

  let lastFire = 0;

  window.fetch = function () {
    const req = arguments[0];
    const url = (typeof req === "string") ? req : (req && req.url ? req.url : "");

    return originalFetch.apply(this, arguments).then(function (res) {
      try {
        if (url && url.includes("/cart/add.js")) {
          const now = Date.now();
          if (now - lastFire < 500) return res;
          lastFire = now;

          res.clone().json().then(function (data) {
            window._learnq.push(["track", "Added to Cart", {
              variant_id: data.variant_id || data.id || null,
              quantity: data.quantity || 1,
              product_title: data.title || null,
              url: location.href
            }]);
          }).catch(function(){});
        }
      } catch(e){}
      return res;
    });
  };
})();
</script>`;

const ONSITE_SNIPPET = `<script async src="https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=SF6hnv"></script>`;

export function KlaviyoShopifyAtcGuide() {
  const [copied, setCopied] = useState<string | null>(null);

  const copySnippet = async (id: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(null);
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Klaviyo + Shopify - Added to Cart</h1>
          <p className="text-sm text-slate-600">Stan na 2026, playbook wdrozeniowy krok po kroku.</p>
        </div>
        <Link href="/clients/connect" className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800">
          Powrot
        </Link>
      </header>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-medium text-slate-900">Czesc 1 - warunki startowe</h2>
        <ol className="space-y-3 border-l-2 border-slate-200 pl-4 text-sm text-slate-700">
          <li><strong>1) Integracja Shopify -&gt; Klaviyo aktywna</strong><br />Klaviyo -&gt; Integrations -&gt; Shopify, polaczone konto, sync products ON.</li>
          <li><strong>2) App embed Klaviyo ON</strong><br />Shopify -&gt; Themes -&gt; Customize -&gt; App embeds -&gt; Klaviyo ON.</li>
          <li><strong>3) Track behavioral events ON</strong><br />Klaviyo -&gt; Integrations -&gt; Shopify -&gt; Onsite tracking -&gt; Track behavioral events ON.</li>
          <li><strong>4) Uzytkownik musi byc rozpoznany</strong><br />Popup/newsletter/checkout/login/klik z maila Klaviyo.</li>
        </ol>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-medium text-slate-900">Czesc 2 - jak testowac poprawnie</h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
          <li>Incognito.</li>
          <li>Zapisz mail w popupie lub podaj mail na checkout.</li>
          <li>Nie zamykaj sesji i kliknij Add to cart.</li>
          <li>Klaviyo -&gt; Profiles -&gt; Activity feed (tam event pojawia sie najszybciej).</li>
        </ol>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-medium text-slate-900">Fallback snippet - kiedy i jak</h2>
        <p className="mb-2 text-sm text-slate-700">
          Uzyj fallbacku tylko gdy pixel nie dziala (custom theme, headless, niestandardowy koszyk, CMP).
          Wklej do <code>layout/theme.liquid</code> przed <code>&lt;/body&gt;</code>.
        </p>
        <div className="relative">
          <button
            type="button"
            onClick={() => void copySnippet("fallback", FALLBACK_SNIPPET)}
            className="absolute right-2 top-2 rounded border border-slate-300 bg-white px-2 py-1 text-xs"
            title="Kopiuj snippet"
          >
            ⧉ {copied === "fallback" ? "Skopiowano" : "Kopiuj"}
          </button>
          <pre className="overflow-x-auto rounded-md border border-slate-200 bg-slate-50 p-3 pt-10 text-[11px] text-slate-700">
{FALLBACK_SNIPPET}
          </pre>
        </div>

        <p className="mt-4 mb-2 text-sm text-slate-700">Jesli trzeba, doladuj onsite script recznie:</p>
        <div className="relative">
          <button
            type="button"
            onClick={() => void copySnippet("onsite", ONSITE_SNIPPET)}
            className="absolute right-2 top-2 rounded border border-slate-300 bg-white px-2 py-1 text-xs"
            title="Kopiuj snippet"
          >
            ⧉ {copied === "onsite" ? "Skopiowano" : "Kopiuj"}
          </button>
          <pre className="overflow-x-auto rounded-md border border-slate-200 bg-slate-50 p-3 pt-10 text-[11px] text-slate-700">
{ONSITE_SNIPPET}
          </pre>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-2 text-lg font-medium text-slate-900">Podsumowanie dla pracy</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm text-slate-700">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-600">
                <th className="px-2 py-1">Sytuacja</th>
                <th className="px-2 py-1">Co robic</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100"><td className="px-2 py-1">Standardowy Shopify</td><td className="px-2 py-1">Pixel wystarczy</td></tr>
              <tr className="border-b border-slate-100"><td className="px-2 py-1">Eventy nie zapisuja sie</td><td className="px-2 py-1">Sprawdz identyfikacje uzytkownika</td></tr>
              <tr className="border-b border-slate-100"><td className="px-2 py-1">Motyw custom</td><td className="px-2 py-1">Dodaj fallback snippet</td></tr>
              <tr className="border-b border-slate-100"><td className="px-2 py-1">Headless / AJAX koszyk</td><td className="px-2 py-1">Snippet obowiazkowy</td></tr>
              <tr><td className="px-2 py-1">Klient EU</td><td className="px-2 py-1">Sprawdz consent</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

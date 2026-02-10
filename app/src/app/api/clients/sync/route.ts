import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

import { db } from "~/server/db";
import { getServerAuthSession } from "~/server/auth";
import { loadClientCredentials, saveClientCredentials } from "~/server/security/client-credentials";
import { checkSenderDomain } from "~/server/integrations/klaviyo/domain-check-engine";

const KLAVIYO_API_BASE_URL = "https://a.klaviyo.com/api";
const KLAVIYO_REVISION = "2024-10-15";
const REQUIRED_METRICS = [
  "Placed Order",
  "Added to Cart",
  "Checkout Started",
  "Viewed Product",
] as const;

type SyncStatus = "success" | "failed" | "already_connected" | "partial";
type CheckStatus = "ok" | "warning" | "fail" | "unknown";
type StorePlatform =
  | "shopify"
  | "woocommerce"
  | "magento"
  | "bigcommerce"
  | "prestashop"
  | "custom_api";

type SyncCheck = {
  title: string;
  status: CheckStatus;
  message: string;
};

type SyncTile = {
  title: string;
  status: CheckStatus;
  reason: string;
  details?: string[];
};

type NextAction = {
  id: string;
  title: string;
  priority: "high" | "medium" | "low";
  reason: string;
  steps: string[];
};

type EventCoverageRow = {
  metric: string;
  source: "web_tracking" | "integration";
  lastSeen: string | null;
  count24h: number;
  count7d: number;
  everSeen: boolean;
  status: "ok" | "no_traffic" | "broken";
};

type SyncResponse = {
  status: SyncStatus;
  statusLabel: string;
  message: string;
  savedClientId: string;
  platform: StorePlatform;
  shopifyStoreDomain: string;
  revenueEmail24h: number;
  revenueEmailPercentOfShopify24h: number | null;
  metrics: Record<string, boolean>;
  recentEvents: Record<string, boolean | null>;
  tiles: SyncTile[];
  eventCoverage: EventCoverageRow[];
  checks: SyncCheck[];
  checkedAt: string;
  topBlockers: string[];
  blockers: string[];
  nextActions: NextAction[];
};

type MetricRow = {
  id?: string;
  attributes?: {
    name?: string;
  };
};

type KlaviyoEventRow = {
  id?: string;
  attributes?: {
    datetime?: string;
    timestamp?: number;
    event_properties?: Record<string, unknown>;
    properties?: Record<string, unknown>;
  };
  relationships?: {
    profile?: {
      data?: {
        id?: string;
      } | null;
    } | null;
  };
};

type GenericRow = {
  id?: string;
  attributes?: Record<string, unknown>;
};

const normalizeStoreDomain = (value: string) =>
  value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");

const domainFromEmail = (value: string) => {
  const match = value.trim().toLowerCase().match(/@([^@]+)$/);
  return match ? match[1] : "";
};

const buildHeaders = (apiKey: string) => ({
  Accept: "application/json",
  Authorization: `Klaviyo-API-Key ${apiKey.trim()}`,
  revision: KLAVIYO_REVISION,
});

const parseBodyRows = <T>(body: unknown): T[] => {
  if (!body || typeof body !== "object") {
    return [];
  }

  const maybeData = body as { data?: unknown };
  return Array.isArray(maybeData.data) ? (maybeData.data as T[]) : [];
};

const fetchJson = async (url: string, headers: Record<string, string>) => {
  const response = await fetch(url, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const raw = await response.text().catch(() => "");
    return { ok: false as const, status: response.status, body: null, raw };
  }

  const body = await response.json().catch(() => null);
  return { ok: true as const, status: response.status, body, raw: "" };
};

const readNumber = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
      if (typeof value === "string") {
        const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
};

const readString = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
};

const isWithinLast24h = (event: KlaviyoEventRow) => {
  const now = Date.now();
  const fromTimestamp =
    typeof event.attributes?.timestamp === "number"
      ? event.attributes.timestamp * 1000
      : null;
  const fromDatetime = event.attributes?.datetime
    ? new Date(event.attributes.datetime).getTime()
    : null;
  const timeMs = fromTimestamp ?? fromDatetime;

  if (!timeMs || Number.isNaN(timeMs)) {
    return false;
  }

  return now - timeMs <= 24 * 60 * 60 * 1000;
};

const statusLabelByCode: Record<SyncStatus, string> = {
  success: "Synchronizacja powiodla sie",
  already_connected: "Klient ma juz zrobiona synchronizacje",
  partial: "Synchronizacja czesciowa",
  failed: "Synchronizacja nie powiodla sie",
};

const supportedPlatforms: StorePlatform[] = [
  "shopify",
  "woocommerce",
  "magento",
  "bigcommerce",
  "prestashop",
  "custom_api",
];

const coercePlatform = (value: unknown): StorePlatform => {
  if (typeof value === "string" && supportedPlatforms.includes(value as StorePlatform)) {
    return value as StorePlatform;
  }

  return "shopify";
};

const platformLabel = (value: StorePlatform) => {
  if (value === "woocommerce") return "WooCommerce";
  if (value === "magento") return "Magento";
  if (value === "bigcommerce") return "BigCommerce";
  if (value === "prestashop") return "PrestaShop";
  if (value === "custom_api") return "Custom API";
  return "Shopify";
};


const buildPreflightErrors = (payload: {
  platform: StorePlatform;
  clientName: string;
  storeDomain: string;
  klaviyoPrivateApiKey: string;
  klaviyoPublicApiKey: string;
}) => {
  const errors: string[] = [];

  if (!payload.clientName) {
    errors.push("Brakuje nazwy klienta.");
  }
  if (!payload.storeDomain) {
    errors.push("Brakuje domeny sklepu (storeDomain).");
  }
  if (!payload.klaviyoPrivateApiKey) {
    errors.push("Brakuje Klaviyo Private API Key.");
  }
  if (payload.platform === "custom_api" && !payload.klaviyoPublicApiKey) {
    errors.push("Dla custom_api wymagany jest Klaviyo Public API Key (Site ID).");
  }

  return errors;
};

const buildNextActions = (params: {
  platform: StorePlatform;
  checks: SyncCheck[];
  metrics: Record<string, boolean>;
  recentEvents: Record<string, boolean | null>;
}) => {
  const actions: NextAction[] = [];
  const checkStatus = new Map(params.checks.map((check) => [check.title, check.status]));
  const add = (action: NextAction) => {
    if (!actions.some((current) => current.id === action.id)) {
      actions.push(action);
    }
  };

  const missingMetrics = REQUIRED_METRICS.filter((metric) => !params.metrics[metric]);
  if (missingMetrics.length > 0) {
    add({
      id: "missing-metrics",
      title: "Uzupelnij brakujace metryki e-commerce",
      priority: "high",
      reason: `Brakuje metryk: ${missingMetrics.join(", ")}.`,
      steps: [
        `Zweryfikuj polaczenie integracji ${platformLabel(params.platform)} -> Klaviyo.`,
        "Wykonaj testowy przeplyw usera: view -> add-to-cart -> checkout -> order.",
        "Po 5-10 minutach ponow synchronizacje i sprawdz metryki.",
      ],
    });
  }

  if (checkStatus.get("Uwierzytelnienie domeny wysylkowej (DKIM + tracking)") !== "ok") {
    add({
      id: "domain-auth",
      title: "Domknij uwierzytelnienie domeny wysylkowej",
      priority: "high",
      reason: "Brak potwierdzenia DKIM=Verified i Tracking=Active.",
      steps: [
        "W Klaviyo: Settings -> Domains odczytaj rekordy DNS.",
        "Dodaj rekordy DNS u dostawcy domeny i poczekaj na propagacje.",
        "Wroc do Klaviyo i potwierdz status Verified/Active.",
      ],
    });
  }

  const placedOrderStatus = checkStatus.get("Jakosc payloadu eventu Placed Order");
  if (placedOrderStatus === "fail" || placedOrderStatus === "warning") {
    add({
      id: "placed-order-payload",
      title: "Uzupelnij payload Placed Order",
      priority: "high",
      reason: "Event powinien miec produkty, wartosc, currency i order ID.",
      steps: [
        "Zweryfikuj payload eventu w warstwie integracji.",
        "Zapewnij stale pole order_id i currency dla kazdego zamowienia.",
        "Powtorz synchronizacje i sprawdz kontrole jakosci.",
      ],
    });
  }

  const checkoutPayloadStatus = checkStatus.get("Jakosc payloadu eventu Checkout Started");
  if (checkoutPayloadStatus === "fail" || checkoutPayloadStatus === "warning") {
    const isShopify = params.platform === "shopify";
    add({
      id: "checkout-started-payload",
      title: "Uzupelnij payload Checkout Started",
      priority: "high",
      reason: isShopify
        ? "Dla Shopify event musi zawierac produkty (Shopify objects), quantity i byc przypiety do profilu."
        : "Event musi zawierac pelny koszyk (Items), value > 0, currency i byc przypiety do profilu.",
      steps: [
        "Zweryfikuj mapowanie koszyka po stronie sklepu/integracji.",
        isShopify
          ? "Zapewnij obecne produkty Shopify (np. line_items/Items) z product_title (lub name/title) oraz quantity."
          : "Zapewnij dla kazdego item: product_name, product_id, variant_id, price, quantity.",
        isShopify
          ? "Dodaj currency z cart.currency lub checkout.currency; fallback: stala waluta sklepu (np. PLN)."
          : "Dodaj value oraz currency na poziomie eventu Checkout Started.",
        isShopify
          ? "Potwierdz, ze event zapisuje sie na profilu (email lub profile_id)."
          : "Potwierdz, ze event zapisuje sie na profilu (email lub profile_id).",
        "Przekaz email albo profile_id, aby event byl przypisany do osoby.",
      ],
    });
  }

  return actions.slice(0, 6);
};

export async function GET() {
  try {
    const logs = await db.auditLog.findMany({
      where: { eventName: "client.sync.saved", entityType: "client_sync" },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        actor: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    const seen = new Set<string>();
    const items = logs
      .map((log) => {
        const details = (log.details ?? {}) as Record<string, unknown>;
        const clientId = typeof details.clientId === "string" ? details.clientId : null;
        if (!clientId || seen.has(clientId)) {
          return null;
        }
        seen.add(clientId);
        return {
          clientId,
          clientName: typeof details.clientName === "string" ? details.clientName : "Unknown",
          clientEmail: typeof details.clientEmail === "string" ? details.clientEmail : null,
          platform: coercePlatform(details.platform),
          platformLabel: platformLabel(coercePlatform(details.platform)),
          storeDomain:
            typeof details.storeDomain === "string" ? details.storeDomain : "not_set",
          statusCode:
            typeof details.status === "string"
              ? details.status
              : "unknown",
          status:
            typeof details.statusLabel === "string"
              ? details.statusLabel
              : "Brak statusu",
          checkedAt: log.createdAt.toISOString(),
        };
      })
      .filter(Boolean);

    return NextResponse.json({ data: items }, { status: 200 });
  } catch {
    return NextResponse.json({ data: [] }, { status: 200 });
  }
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | {
        clientName?: string;
        storeDomain?: string;
        shopifyStoreDomain?: string;
        klaviyoPrivateApiKey?: string;
        klaviyoPublicApiKey?: string;
        clientEmail?: string;
        platform?: StorePlatform;
        shopifyOrders24h?: number | string;
        shopifyOrders7d?: number | string;
        shopifyRevenue24h?: number | string;
        shopifyRevenue7d?: number | string;
        shopifyCheckouts24h?: number | string;
        shopifyCheckouts7d?: number | string;
        senderDomain?: string;
      }
    | null;

  const providedApiKey = payload?.klaviyoPrivateApiKey?.trim() ?? "";
  const providedPublicApiKey = payload?.klaviyoPublicApiKey?.trim() ?? "";
  const storeDomain = normalizeStoreDomain(payload?.storeDomain ?? payload?.shopifyStoreDomain ?? "");
  const clientEmail = payload?.clientEmail?.trim().toLowerCase() ?? "";
  const senderDomain =
    payload?.senderDomain?.trim().toLowerCase() ||
    domainFromEmail(clientEmail) ||
    "";
  const platform = coercePlatform(payload?.platform);
  const clientName = payload?.clientName?.trim() ?? "";
  const shopifyOrders24h = readNumber(payload?.shopifyOrders24h);
  const shopifyOrders7d = readNumber(payload?.shopifyOrders7d);
  const shopifyRevenue24h = readNumber(payload?.shopifyRevenue24h);
  const shopifyRevenue7d = readNumber(payload?.shopifyRevenue7d);
  const shopifyCheckouts24h = readNumber(payload?.shopifyCheckouts24h);
  const shopifyCheckouts7d = readNumber(payload?.shopifyCheckouts7d);

  const clientId = `sync-${clientName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const session = await getServerAuthSession();
  const actorId = session?.user?.id ?? process.env.DEV_AUTH_USER_ID ?? "dev-local-session-user";
  const actorEmail =
    session?.user?.email ??
    process.env.DEV_AUTH_USER_EMAIL ??
    "dev-local@example.com";
  const actorName =
    session?.user?.name ??
    process.env.DEV_AUTH_USER_NAME ??
    "Local Developer";
  const activeContext = actorId
    ? await db.clientUserContext.findFirst({
        where: { userId: actorId },
        orderBy: { updatedAt: "desc" },
        select: { clientId: true },
      })
    : null;
  if (senderDomain && activeContext?.clientId) {
    const currentProfile = await db.clientProfile.findUnique({
      where: { id: activeContext.clientId },
      select: { senderDomain: true },
    });
    if (!currentProfile?.senderDomain) {
      await db.clientProfile.update({
        where: { id: activeContext.clientId },
        data: { senderDomain },
      });
    }
  }

  const shouldLoadStoredCredentials = Boolean(clientName);
  let storedCredentials: { klaviyoPrivateApiKey?: string; klaviyoPublicApiKey?: string } = {};
  if (shouldLoadStoredCredentials) {
    try {
      storedCredentials = await loadClientCredentials(clientId);
    } catch {
      storedCredentials = {};
    }
  }
  const storedApiKey = storedCredentials.klaviyoPrivateApiKey ?? "";
  let apiKey = providedApiKey || storedApiKey || "";
  const publicApiKey = providedPublicApiKey || storedCredentials.klaviyoPublicApiKey || "";

  const preflightErrors = buildPreflightErrors({
    platform,
    clientName,
    storeDomain,
    klaviyoPrivateApiKey: apiKey,
    klaviyoPublicApiKey: publicApiKey,
  });
  if (preflightErrors.length > 0) {
    return NextResponse.json(
      {
        error: "Brakuje krytycznych danych do synchronizacji.",
        details: preflightErrors.join(" "),
      },
      { status: 400 },
    );
  }

  const blockers: string[] = [];
  const checks: SyncCheck[] = [];

  try {
    let apiKeySource: "provided" | "stored" =
      providedApiKey && providedApiKey === apiKey ? "provided" : "stored";
    const hasProvidedApiKey = Boolean(providedApiKey);
    const hasStoredApiKey = Boolean(storedApiKey);
    let headers = buildHeaders(apiKey);
    let metricsResult = await fetchJson(`${KLAVIYO_API_BASE_URL}/metrics`, headers);

    const canRetryWithStoredKey =
      apiKeySource === "provided" &&
      Boolean(storedApiKey) &&
      storedApiKey !== providedApiKey &&
      (metricsResult.status === 401 || metricsResult.status === 403);

    if (!metricsResult.ok && canRetryWithStoredKey) {
      apiKey = storedApiKey;
      apiKeySource = "stored";
      headers = buildHeaders(apiKey);
      metricsResult = await fetchJson(`${KLAVIYO_API_BASE_URL}/metrics`, headers);
    }

    if (!metricsResult.ok) {
      const statusHint =
        metricsResult.status === 401 || metricsResult.status === 403
          ? "Nieautoryzowany klucz (sprawdz Private API Key i scope: metrics:read, events:read)."
          : `Klaviyo API zwrocilo status ${metricsResult.status}.`;
      const authDebug = [
        `authDebug[source=${apiKeySource}]`,
        `provided=${hasProvidedApiKey ? "yes" : "no"}`,
        `stored=${hasStoredApiKey ? "yes" : "no"}`,
        `fallbackTried=${canRetryWithStoredKey ? "yes" : "no"}`,
      ].join(" ");

      return NextResponse.json(
        {
          error: `Nie mozna pobrac metryk z Klaviyo. ${statusHint}`,
          details: `${metricsResult.raw.slice(0, 500)} ${authDebug}`.trim(),
        },
        { status: metricsResult.status === 401 || metricsResult.status === 403 ? 401 : 502 },
      );
    }

    if ((providedApiKey && apiKeySource === "provided") || providedPublicApiKey) {
      await saveClientCredentials({
        clientId,
        actorId,
        requestId: randomUUID(),
        credentials: {
          klaviyoPrivateApiKey:
            providedApiKey && apiKeySource === "provided" ? providedApiKey : undefined,
          klaviyoPublicApiKey: providedPublicApiKey || undefined,
        },
      });
    }

    const metricRows = parseBodyRows<MetricRow>(metricsResult.body);
    const metricsByName = new Map<string, string>();
    for (const row of metricRows) {
      const name = row.attributes?.name?.trim();
      const id = row.id?.trim();
      if (name && id) {
        metricsByName.set(name, id);
      }
    }

    const metrics: Record<string, boolean> = {};
    const recentEvents: Record<string, boolean | null> = {};
    const eventsByMetric = new Map<string, KlaviyoEventRow[]>();

    for (const metricName of REQUIRED_METRICS) {
      const metricId = metricsByName.get(metricName);
      metrics[metricName] = Boolean(metricId);

      if (!metricId) {
        recentEvents[metricName] = null;
        continue;
      }

      const encodedMetricId = encodeURIComponent(`"${metricId}"`);
      const eventsResult = await fetchJson(
        `${KLAVIYO_API_BASE_URL}/events?filter=equals(metric_id,${encodedMetricId})&sort=-datetime`,
        headers,
      );

      if (!eventsResult.ok) {
        recentEvents[metricName] = null;
        continue;
      }

      const events = parseBodyRows<KlaviyoEventRow>(eventsResult.body);
      eventsByMetric.set(metricName, events);
      recentEvents[metricName] = events.some((event) => isWithinLast24h(event));
    }

    const metricCount = Object.values(metrics).filter(Boolean).length;
    const allMetricsPresent = metricCount === REQUIRED_METRICS.length;
    const hasRecentEvents = Object.values(recentEvents).some((value) => value === true);
    const missingMetrics = REQUIRED_METRICS.filter((metric) => !metrics[metric]);

    if (!allMetricsPresent) {
      blockers.push(`Brakuje wymaganych metryk w Klaviyo: ${missingMetrics.join(", ")}.`);
    }

    // 2) Dedup profiles by email
    if (clientEmail) {
      const encodedEmail = encodeURIComponent(`"${clientEmail}"`);
      const profilesResult = await fetchJson(
        `${KLAVIYO_API_BASE_URL}/profiles?filter=equals(email,${encodedEmail})`,
        headers,
      );

      if (!profilesResult.ok) {
        checks.push({
          title: "Deduplikacja profili (1 email = 1 profil)",
          status: "unknown",
          message: "Nie udalo sie automatycznie zweryfikowac profili dla emaila klienta.",
        });
      } else {
        const profiles = parseBodyRows<GenericRow>(profilesResult.body);
        if (profiles.length === 1) {
          checks.push({
            title: "Deduplikacja profili (1 email = 1 profil)",
            status: "ok",
            message: "Email klienta wskazuje na jeden profil.",
          });
        } else if (profiles.length > 1) {
          checks.push({
            title: "Deduplikacja profili (1 email = 1 profil)",
            status: "fail",
            message: `Wykryto duplikaty: ${profiles.length} profili z tym samym emailem.`,
          });
          blockers.push("Wykryto duplikaty profili po adresie email.");
        } else {
          checks.push({
            title: "Deduplikacja profili (1 email = 1 profil)",
            status: "warning",
            message: "Nie znaleziono profilu dla podanego emaila klienta.",
          });
        }
      }
    } else {
      checks.push({
        title: "Deduplikacja profili (1 email = 1 profil)",
        status: "unknown",
        message: "Brak emaila klienta - nie mozna zweryfikowac duplikatow.",
      });
    }

    // 3) Catalog linkage (Shopify integration layer)
    const extractItems = (event: KlaviyoEventRow) => {
      const isProductLikeRow = (value: unknown) => {
        if (!value || typeof value !== "object") return false;
        const row = value as Record<string, unknown>;
        const hasName = Boolean(
          readString(
            row.product_title,
            row.product_name,
            row.ProductName,
            row.name,
            row.title,
            row.item_name,
          ),
        );
        const hasQuantity = readNumber(row.quantity, row.Quantity, row.qty) !== null;
        return hasName || hasQuantity;
      };
      const findProductArray = (input: unknown): unknown[] | null => {
        if (!input || typeof input !== "object") return null;
        const node = input as Record<string, unknown>;
        const directCandidates = [
          node.Items,
          node.items,
          node.line_items,
          node.lineItems,
          node.products,
        ];
        for (const candidate of directCandidates) {
          if (Array.isArray(candidate) && candidate.length > 0 && candidate.some(isProductLikeRow)) {
            return candidate;
          }
        }
        for (const value of Object.values(node)) {
          if (!value || typeof value !== "object") {
            continue;
          }
          const nested = findProductArray(value);
          if (nested && nested.length > 0) {
            return nested;
          }
        }
        return null;
      };
      const props = event.attributes?.event_properties ?? {};
      const altProps = event.attributes?.properties ?? {};
      return findProductArray(props) ?? findProductArray(altProps) ?? [];
    };

    const checkoutStartedEvents = eventsByMetric.get("Checkout Started") ?? [];
    const viewedProductEvents = eventsByMetric.get("Viewed Product") ?? [];
    const placedOrderEvents = eventsByMetric.get("Placed Order") ?? [];
    const hasCheckoutItems = checkoutStartedEvents.some((event) => extractItems(event).length > 0);
    const hasPlacedOrderItems = placedOrderEvents.some((event) => extractItems(event).length > 0);
    const hasViewedProductPayload = viewedProductEvents.some((event) => {
      const props = event.attributes?.event_properties ?? {};
      const altProps = event.attributes?.properties ?? {};
      return Boolean(
        readString(
          props.ProductName,
          props.product_name,
          props.ItemName,
          altProps.ProductName,
          altProps.product_name,
        ) ||
          readString(
            props.ProductID,
            props.product_id,
            props.ItemID,
            altProps.ProductID,
            altProps.product_id,
          ),
      );
    });

    if (platform === "shopify") {
      const isCatalogLinked = hasCheckoutItems || hasPlacedOrderItems || hasViewedProductPayload;
      checks.push({
        title: "Katalog produktow",
        status: isCatalogLinked ? "ok" : "fail",
        message: isCatalogLinked
          ? "Shopify integration layer aktywny: eventy zawieraja dane produktowe (Items/product fields)."
          : "Brak danych produktowych w eventach Shopify layer (Viewed Product / Checkout Started / Placed Order).",
      });
      if (!isCatalogLinked) {
        blockers.push("Brak danych produktowych w eventach - katalog nie laczy sie z flow.");
      }
    } else {
      const isCatalogLinked = hasCheckoutItems || hasPlacedOrderItems;
      checks.push({
        title: "Katalog produktow",
        status: isCatalogLinked ? "ok" : "warning",
        message: isCatalogLinked
          ? "Eventy koszykowe zawieraja dane produktowe (Items)."
          : "Brak potwierdzenia danych produktowych w eventach koszykowych.",
      });
    }

    // 4) Domain authentication (Domain Check Engine)
    if (!senderDomain) {
      checks.push({
        title: "Uwierzytelnienie domeny wysylkowej (SPF/DKIM/DMARC)",
        status: "warning",
        message: "Brak domeny nadawcy do automatycznej weryfikacji.",
      });
      blockers.push("Podaj domenę nadawcy, aby zweryfikować SPF/DKIM/DMARC.");
    } else {
      try {
        const domainCheck = await checkSenderDomain(senderDomain, { apiKey, clientId });
        const statusMap: Record<typeof domainCheck.status, CheckStatus> = {
          ok: "ok",
          warning: "warning",
          critical: "fail",
        };
        const status = statusMap[domainCheck.status];
        const parts = [
          `SPF: ${domainCheck.spf_status}`,
          `DKIM: ${domainCheck.dkim_status}`,
          `DMARC: ${domainCheck.dmarc_status}`,
          `Alignment: ${domainCheck.alignment_status}`,
        ];

        checks.push({
          title: "Uwierzytelnienie domeny wysylkowej (SPF/DKIM/DMARC)",
          status,
          message: `${parts.join(" · ")}${domainCheck.matchedDomain ? ` · domena: ${domainCheck.matchedDomain}` : ""}`,
        });

        if (status !== "ok") {
          blockers.push("Domena wysylkowa nie jest w pelni uwierzytelniona (SPF/DKIM/DMARC).");
        }
      } catch (error) {
        checks.push({
          title: "Uwierzytelnienie domeny wysylkowej (SPF/DKIM/DMARC)",
          status: "warning",
          message: "Nie mozna automatycznie potwierdzic statusu domeny. Sprawdz recznie: Settings -> Domains.",
        });
        blockers.push("Zweryfikuj recznie status domeny wysylkowej (SPF/DKIM/DMARC).");
      }
    }

    // 5) Revenue email (Klaviyo, last 24h)
    const revenueEmail24h = placedOrderEvents
      .filter((event) => isWithinLast24h(event))
      .reduce((sum, event) => {
        const props = event.attributes?.event_properties ?? {};
        const altProps = event.attributes?.properties ?? {};
        const value = readNumber(
          props.$value,
          props.value,
          props.revenue,
          altProps.$value,
          altProps.value,
          altProps.revenue,
        );
        return sum + (value ?? 0);
      }, 0);

    const countWithin = (events: KlaviyoEventRow[], days: number) => {
      const windowMs = days * 24 * 60 * 60 * 1000;
      const now = Date.now();
      return events.filter((event) => {
        const fromTimestamp =
          typeof event.attributes?.timestamp === "number"
            ? event.attributes.timestamp * 1000
            : null;
        const fromDatetime = event.attributes?.datetime
          ? new Date(event.attributes.datetime).getTime()
          : null;
        const timeMs = fromTimestamp ?? fromDatetime;
        if (!timeMs || Number.isNaN(timeMs)) {
          return false;
        }
        return now - timeMs <= windowMs;
      }).length;
    };

    const revenueWithin = (events: KlaviyoEventRow[], days: number) => {
      const windowMs = days * 24 * 60 * 60 * 1000;
      const now = Date.now();
      return events
        .filter((event) => {
          const fromTimestamp =
            typeof event.attributes?.timestamp === "number"
              ? event.attributes.timestamp * 1000
              : null;
          const fromDatetime = event.attributes?.datetime
            ? new Date(event.attributes.datetime).getTime()
            : null;
          const timeMs = fromTimestamp ?? fromDatetime;
          if (!timeMs || Number.isNaN(timeMs)) {
            return false;
          }
          return now - timeMs <= windowMs;
        })
        .reduce((sum, event) => {
          const props = event.attributes?.event_properties ?? {};
          const altProps = event.attributes?.properties ?? {};
          const value = readNumber(
            props.$value,
            props.value,
            props.revenue,
            altProps.$value,
            altProps.value,
            altProps.revenue,
          );
          return sum + (value ?? 0);
        }, 0);
    };

    const compareWithThreshold = (
      title: string,
      sourceValue: number | null,
      targetValue: number,
      sourceLabel: string,
      targetLabel: string,
    ) => {
      if (sourceValue === null || sourceValue <= 0) {
        checks.push({
          title,
          status: "unknown",
          message: `Brak wartosci z ${sourceLabel} do porownania. ${targetLabel}: ${targetValue.toFixed(2)}.`,
        });
        return;
      }

      const diffPercent = Math.abs(sourceValue - targetValue) / sourceValue;
      const status: CheckStatus =
        diffPercent < 0.1 ? "ok" : diffPercent <= 0.25 ? "warning" : "fail";
      checks.push({
        title,
        status,
        message: `${sourceLabel}: ${sourceValue.toFixed(2)} | ${targetLabel}: ${targetValue.toFixed(
          2,
        )} | Diff: ${(diffPercent * 100).toFixed(1)}%`,
      });
      if (status === "fail") {
        blockers.push(`${title}: roznica przekracza 25%.`);
      }
    };

    const hasAnySourceOfTruthInput = [
      shopifyOrders24h,
      shopifyOrders7d,
      shopifyRevenue24h,
      shopifyRevenue7d,
      shopifyCheckouts24h,
      shopifyCheckouts7d,
    ].some((value) => value !== null);

    if (hasAnySourceOfTruthInput) {
      compareWithThreshold(
        "Spojnosc danych (Orders 24h: Shopify -> Klaviyo)",
        shopifyOrders24h,
        countWithin(placedOrderEvents, 1),
        "Shopify Orders 24h",
        "Klaviyo Placed Order events 24h",
      );
      compareWithThreshold(
        "Spojnosc danych (Orders 7d: Shopify -> Klaviyo)",
        shopifyOrders7d,
        countWithin(placedOrderEvents, 7),
        "Shopify Orders 7d",
        "Klaviyo Placed Order events 7d",
      );
      compareWithThreshold(
        "Spojnosc danych (Revenue 24h: Shopify -> Klaviyo)",
        shopifyRevenue24h,
        revenueWithin(placedOrderEvents, 1),
        "Shopify Revenue 24h",
        "Klaviyo Placed Order revenue 24h",
      );
      compareWithThreshold(
        "Spojnosc danych (Revenue 7d: Shopify -> Klaviyo)",
        shopifyRevenue7d,
        revenueWithin(placedOrderEvents, 7),
        "Shopify Revenue 7d",
        "Klaviyo Placed Order revenue 7d",
      );

      const checkoutStartedEvents = eventsByMetric.get("Checkout Started") ?? [];
      compareWithThreshold(
        "Spojnosc danych (Checkout 24h: Shopify -> Klaviyo)",
        shopifyCheckouts24h,
        countWithin(checkoutStartedEvents, 1),
        "Shopify Checkouts 24h",
        "Klaviyo Checkout Started 24h",
      );
      compareWithThreshold(
        "Spojnosc danych (Checkout 7d: Shopify -> Klaviyo)",
        shopifyCheckouts7d,
        countWithin(checkoutStartedEvents, 7),
        "Shopify Checkouts 7d",
        "Klaviyo Checkout Started 7d",
      );
    }

    // 6) Form capture proxy
    if (clientEmail) {
      const formCaptureDetected = checks.some(
        (check) =>
          check.title === "Deduplikacja profili (1 email = 1 profil)" &&
          (check.status === "ok" || check.status === "warning"),
      );
      const listMembershipCheck = await fetchJson(
        `${KLAVIYO_API_BASE_URL}/lists`,
        headers,
      );
      const listRows = listMembershipCheck.ok ? parseBodyRows<GenericRow>(listMembershipCheck.body) : [];
      const listName = readString(listRows[0]?.attributes?.name) ?? "nieznana lista";
      checks.push({
        title: "Formularze zapisują do Klaviyo",
        status: formCaptureDetected ? "ok" : "fail",
        message: formCaptureDetected
          ? `Dziala: TAK. Nowe emaile zapisuja sie do Klaviyo (lista: ${listName}).`
          : "Dziala: NIE. Nie wykryto potwierdzenia pipeline form -> profile -> consent.",
      });
      if (!formCaptureDetected) {
        blockers.push("Formularze zapisu nie potwierdzaja przeplywu do Klaviyo.");
      }
    } else {
      checks.push({
        title: "Formularze zapisują do Klaviyo",
        status: "warning",
        message: "Status: NIEZNANY. Brak emaila testowego klienta.",
      });
    }

    // 9) Event payload quality - Checkout Started
    const latestCheckoutStarted = checkoutStartedEvents[0];
    if (!latestCheckoutStarted) {
      checks.push({
        title: "Jakosc payloadu eventu Checkout Started",
        status: "fail",
        message: "Brak eventu Checkout Started.",
      });
      blockers.push("Brak eventu Checkout Started.");
    } else {
      const isShopify = platform === "shopify";
      const props = latestCheckoutStarted.attributes?.event_properties ?? {};
      const altProps = latestCheckoutStarted.attributes?.properties ?? {};
      const propsCart = props.cart && typeof props.cart === "object" ? (props.cart as Record<string, unknown>) : {};
      const propsCheckout =
        props.checkout && typeof props.checkout === "object"
          ? (props.checkout as Record<string, unknown>)
          : {};
      const altPropsCart =
        altProps.cart && typeof altProps.cart === "object"
          ? (altProps.cart as Record<string, unknown>)
          : {};
      const altPropsCheckout =
        altProps.checkout && typeof altProps.checkout === "object"
          ? (altProps.checkout as Record<string, unknown>)
          : {};
      const propsExtra = props.extra && typeof props.extra === "object" ? (props.extra as Record<string, unknown>) : {};
      const altPropsExtra =
        altProps.extra && typeof altProps.extra === "object"
          ? (altProps.extra as Record<string, unknown>)
          : {};
      const items = extractItems(latestCheckoutStarted);
      const itemEntries = items.filter((item) => item && typeof item === "object") as Record<string, unknown>[];

      const hasItems = itemEntries.length > 0;
      const itemsHaveProductName = itemEntries.every((item) =>
        Boolean(
          readString(
            item.product_name,
            item.ProductName,
            item.product_title,
            item.name,
            item.title,
            item.item_name,
          ),
        ),
      );
      const itemsHaveProductId = itemEntries.every((item) =>
        Boolean(readString(item.product_id, item.ProductID, item.id)),
      );
      const itemsHaveVariantId = itemEntries.every((item) =>
        Boolean(readString(item.variant_id, item.VariantID, item.variantId)),
      );
      const itemsHavePrice = itemEntries.every((item) => {
        const price = readNumber(item.price, item.ItemPrice, item.item_price, item.unit_price);
        return price !== null;
      });
      const itemsHaveQuantity = itemEntries.every((item) => {
        const quantity = readNumber(item.quantity, item.Quantity, item.qty);
        return quantity !== null;
      });
      const hasValue =
        (readNumber(
          props.$value,
          props.value,
          props.total,
          props.cart_total,
          propsCart.total_price,
          propsCheckout.total_price,
          altProps.$value,
          altProps.value,
          altProps.total,
          altProps.cart_total,
          altPropsCart.total_price,
          altPropsCheckout.total_price,
        ) ?? 0) > 0;
      const hasCurrency = Boolean(
        readString(
          props.$currency,
          props.currency,
          props.currency_code,
          props.presentment_currency,
          props.shop_currency,
          props.Currency,
          propsCart.currency,
          propsCart.currency_code,
          propsCheckout.currency,
          propsCheckout.currency_code,
          propsExtra.currency,
          propsExtra.currency_code,
          altProps.$currency,
          altProps.currency,
          altProps.currency_code,
          altProps.presentment_currency,
          altProps.shop_currency,
          altProps.Currency,
          altPropsCart.currency,
          altPropsCart.currency_code,
          altPropsCheckout.currency,
          altPropsCheckout.currency_code,
          altPropsExtra.currency,
          altPropsExtra.currency_code,
        ),
      );
      const hasProfileLink = Boolean(
        readString(
          props.$email,
          props.email,
          props.Email,
          altProps.$email,
          altProps.email,
          altProps.Email,
          latestCheckoutStarted.relationships?.profile?.data?.id,
        ),
      );

      const criticalMissing = isShopify
        ? ([
            !hasItems ? "produkty Shopify (Items/product objects)" : null,
            hasItems && !itemsHaveProductName ? "nazwa produktu (product_title/name/title)" : null,
            hasItems && !itemsHaveQuantity ? "quantity w produktach" : null,
            !hasProfileLink ? "email lub profile_id" : null,
          ].filter(Boolean) as string[])
        : ([
            !hasItems ? "Items" : null,
            hasItems && !itemsHaveProductName ? "product_name w Items" : null,
            hasItems && !itemsHaveProductId ? "product_id w Items" : null,
            hasItems && !itemsHaveVariantId ? "variant_id w Items" : null,
            hasItems && !itemsHavePrice ? "price w Items" : null,
            hasItems && !itemsHaveQuantity ? "ilosc w Items" : null,
            !hasValue ? "value > 0" : null,
            !hasCurrency ? "currency" : null,
            !hasProfileLink ? "email lub profile_id" : null,
          ].filter(Boolean) as string[]);
      const shopifyOptionalMissing = isShopify
        ? ([
            !hasValue ? "value" : null,
            !hasCurrency ? "currency" : null,
          ].filter(Boolean) as string[])
        : [];
      const checkoutStatus: CheckStatus = isShopify
        ? criticalMissing.length > 0
          ? "fail"
          : shopifyOptionalMissing.length > 0
            ? "warning"
            : "ok"
        : criticalMissing.length === 0
          ? "ok"
          : "fail";

      checks.push({
        title: "Jakosc payloadu eventu Checkout Started",
        status: checkoutStatus,
        message:
          checkoutStatus === "ok"
            ? isShopify
              ? "Payload w schemacie Shopify (product objects) — OK. Normalizacja opcjonalna."
              : "Payload kompletny: Items (product_name, product_id, variant_id, price, quantity), value > 0, currency, profile."
            : isShopify && checkoutStatus === "warning"
              ? `Payload w schemacie Shopify (product objects) — OK. Normalizacja opcjonalna. Brak pol opcjonalnych: ${shopifyOptionalMissing.join(", ")}.`
              : `Payload niekompletny: ${criticalMissing.join(", ")}.`,
      });

      if (criticalMissing.length > 0) {
        blockers.push(`Checkout Started payload niepelny: ${criticalMissing.join(", ")}.`);
      }
    }

    // 10) Event payload quality - Placed Order
    const latestPlacedOrder = placedOrderEvents[0];
    if (!latestPlacedOrder) {
      checks.push({
        title: "Jakosc payloadu eventu Placed Order",
        status: "warning",
        message:
          "Brak eventu Placed Order. W srodowisku testowym to czeste; zweryfikuj po pelnym zamowieniu produkcyjnym.",
      });
    } else {
      const props = latestPlacedOrder.attributes?.event_properties ?? {};
      const altProps = latestPlacedOrder.attributes?.properties ?? {};
      const hasProducts = Boolean(
        (props.Items && Array.isArray(props.Items) && props.Items.length > 0) ||
          (props.items && Array.isArray(props.items) && props.items.length > 0) ||
          (altProps.items && Array.isArray(altProps.items) && altProps.items.length > 0),
      );
      const hasValue =
        readNumber(props.$value, props.value, props.revenue, altProps.$value, altProps.value) !==
        null;
      const hasCurrency = Boolean(readString(props.$currency, props.currency, altProps.currency));
      const hasOrderId = Boolean(readString(props.$event_id, props.order_id, altProps.order_id));

      const missing = [
        !hasProducts ? "produkty" : null,
        !hasValue ? "wartosc" : null,
        !hasCurrency ? "currency" : null,
        !hasOrderId ? "order ID" : null,
      ].filter(Boolean) as string[];

      checks.push({
        title: "Jakosc payloadu eventu Placed Order",
        status: missing.length === 0 ? "ok" : "warning",
        message:
          missing.length === 0
            ? "Event zawiera produkty, wartosc, currency i order ID."
            : `W payloadzie brakuje: ${missing.join(", ")}.`,
      });
    }

    const status: SyncStatus = allMetricsPresent
      ? hasRecentEvents
        ? "success"
        : "already_connected"
      : metricCount > 0
        ? "partial"
        : "failed";

    const messageByStatus: Record<SyncStatus, string> = {
      success: "Metryki i eventy sa aktywne. Integracja wyglada na poprawna.",
      already_connected: "Integracja prawdopodobnie istnieje, ale brakuje swiezych eventow z 24h.",
      partial: "Czesc metryk lub walidacji nie przeszla. Sprawdz sekcje kontroli jakosci.",
      failed: "Nie potwierdzono dzialajacej synchronizacji.",
    };

    await db.user.upsert({
      where: { id: actorId },
      update: {
        email: actorEmail,
        name: actorName,
        role: "OWNER",
      },
      create: {
        id: actorId,
        email: actorEmail,
        name: actorName,
        role: "OWNER",
      },
    });

    const client = await db.clientProfile.upsert({
      where: { id: clientId },
      update: {
        name: clientName,
        status: "ACTIVE",
      },
      create: {
        id: clientId,
        name: clientName,
        status: "ACTIVE",
      },
    });

    await db.clientMembership.upsert({
      where: {
        clientId_userId: {
          clientId: client.id,
          userId: actorId,
        },
      },
      update: {
        canEdit: true,
      },
      create: {
        clientId: client.id,
        userId: actorId,
        canEdit: true,
      },
    });

    await db.clientUserContext.upsert({
      where: {
        userId_clientId: {
          userId: actorId,
          clientId: client.id,
        },
      },
      update: {
        lastViewPath: "/clients/connect",
      },
      create: {
        userId: actorId,
        clientId: client.id,
        lastViewPath: "/clients/connect",
      },
    });

    await db.klaviyoSyncRun.create({
      data: {
        clientId: client.id,
        trigger: "MANUAL",
        status:
          status === "success"
            ? "OK"
            : status === "already_connected"
              ? "OK"
              : "PARTIAL_OR_TIMEOUT",
        requestId: randomUUID(),
        accountCount: metrics["Placed Order"] ? 1 : 0,
        flowCount: metrics["Added to Cart"] ? 1 : 0,
        emailCount: metrics["Checkout Started"] ? 1 : 0,
        formCount: metrics["Viewed Product"] ? 1 : 0,
        errorCode: status === "failed" ? "SYNC_FAILED" : null,
        errorMessage: status === "failed" ? messageByStatus[status] : null,
        finishedAt: new Date(),
      },
    });

    await db.auditLog.create({
      data: {
        actorId,
        eventName: "client.sync.saved",
        requestId: randomUUID(),
        entityType: "client_sync",
        entityId: client.id,
        details: {
          clientId: client.id,
          clientName,
          platform,
          platformLabel: platformLabel(platform),
          storeDomain,
          clientEmail,
          status,
          statusLabel: statusLabelByCode[status],
          checks,
        },
      },
    });

    const firstCheckByTitle = (title: string) =>
      checks.find((check) => check.title === title);
    const resolveTileStatus = (statuses: CheckStatus[]): CheckStatus => {
      if (statuses.includes("fail")) return "fail";
      if (statuses.includes("warning")) return "warning";
      if (statuses.includes("ok")) return "ok";
      return "unknown";
    };

    const integrationTile: SyncTile = {
      title: "Integration status",
      status: status === "success" ? "ok" : status === "already_connected" ? "warning" : "fail",
      reason: messageByStatus[status],
    };
    const eventCoverageTile: SyncTile = {
      title: "Event coverage (funnel)",
      status: resolveTileStatus(
        REQUIRED_METRICS.map((metric) => {
          if (!metrics[metric]) return "fail";
          return recentEvents[metric] ? "ok" : "warning";
        }),
      ),
      reason: "Viewed Product / Added to Cart / Checkout Started / Placed Order",
    };
    const sourceTruthTile: SyncTile = {
      title: "Source-of-truth consistency",
      status: resolveTileStatus(
        checks
          .filter((check) => check.title.startsWith("Spojnosc danych"))
          .map((check) => check.status),
      ),
      reason: "Shopify (source) vs Klaviyo (target)",
    };
    const catalogTile: SyncTile = {
      title: "Catalog health",
      status: firstCheckByTitle("Katalog produktow")?.status ?? "unknown",
      reason: firstCheckByTitle("Katalog produktow")?.message ?? "Brak danych katalogu",
    };
    const sendingTile: SyncTile = {
      title: "Sending infrastructure",
      status:
        firstCheckByTitle("Uwierzytelnienie domeny wysylkowej (DKIM + tracking)")?.status ??
        "unknown",
      reason:
        firstCheckByTitle("Uwierzytelnienie domeny wysylkowej (DKIM + tracking)")?.message ??
        "Brak danych domeny",
    };

    const sourceTruthDetails = checks
      .filter((check) => check.title.startsWith("Spojnosc danych"))
      .map((check) => `${check.title}: ${check.message}`);
    sourceTruthTile.details = sourceTruthDetails;

    const metricSource: Record<string, "web_tracking" | "integration"> = {
      "Viewed Product": "web_tracking",
      "Added to Cart": "web_tracking",
      "Checkout Started": "integration",
      "Placed Order": "integration",
    };
    const eventCoverage: EventCoverageRow[] = REQUIRED_METRICS.map((metric) => {
      const events = eventsByMetric.get(metric) ?? [];
      const latest = events[0];
      const lastSeen =
        latest?.attributes?.datetime ??
        (typeof latest?.attributes?.timestamp === "number"
          ? new Date(latest.attributes.timestamp * 1000).toISOString()
          : null);
      const count24h = countWithin(events, 1);
      const count7d = countWithin(events, 7);
      const everSeen = events.length > 0;
      const status =
        count24h > 0 ? "ok" : everSeen ? "no_traffic" : "broken";
      return {
        metric,
        source: metricSource[metric] ?? "integration",
        lastSeen,
        count24h,
        count7d,
        everSeen,
        status,
      };
    });

    const revenueEmailPercentOfShopify24h =
      shopifyRevenue24h && shopifyRevenue24h > 0
        ? Number(((revenueEmail24h / shopifyRevenue24h) * 100).toFixed(1))
        : null;
    const nextActions = buildNextActions({
      platform,
      checks,
      metrics,
      recentEvents,
    });

    return NextResponse.json(
      {
        data: {
          status,
          statusLabel: statusLabelByCode[status],
          message: messageByStatus[status],
          savedClientId: client.id,
          platform,
          shopifyStoreDomain: storeDomain,
          revenueEmail24h,
          revenueEmailPercentOfShopify24h,
          metrics,
          recentEvents,
          tiles: [integrationTile, eventCoverageTile, sourceTruthTile, catalogTile, sendingTile],
          eventCoverage,
          checks,
          checkedAt: new Date().toISOString(),
          topBlockers: [...new Set(blockers)].slice(0, 3),
          blockers: [...new Set(blockers)],
          nextActions,
        } satisfies SyncResponse,
      },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error && error.message.trim().length > 0
        ? error.message
        : "Nieznany blad serwera";
    return NextResponse.json(
      {
        error: "Wystapil blad podczas weryfikacji synchronizacji.",
        details: message,
      },
      { status: 500 },
    );
  }
}

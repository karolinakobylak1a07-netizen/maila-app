import { NextResponse } from "next/server";
import { getServerAuthSession } from "~/server/auth";
import { db } from "~/server/db";
import { loadClientCredentials } from "~/server/security/client-credentials";
import { checkSenderDomain } from "~/server/integrations/klaviyo/domain-check-engine";

const KLAVIYO_API_BASE_URL = "https://a.klaviyo.com/api";
const KLAVIYO_REVISION = "2024-10-15";
const PAGE_SIZE = 100;
const MAX_PROFILE_PAGES = 15;
const MAX_EVENT_PAGES = 15;

type GenericRow = {
  id?: string;
  attributes?: Record<string, unknown>;
  relationships?: Record<string, unknown>;
};

type MetricRow = {
  id?: string;
  attributes?: {
    name?: string;
  };
};

type SegmentAudit = {
  totalSegments: number;
  processingSegments: Array<{ id: string; name: string }>;
  processingTooLong: Array<{ id: string; name: string; updatedAt: string | null }>;
  missingKeySegments: Array<"engaged" | "unengaged" | "vip">;
  keySegmentsFound: Record<"engaged" | "unengaged" | "vip", string[]>;
  topSegments: Array<{ id: string; name: string; count: number }>;
  nameQuality: {
    tempOrTest: number;
    duplicates: number;
    ambiguous: number;
  };
  logic: {
    eventBased: number;
    profileBased: number;
    mixed: number;
    exclusiveLogic: number;
    hasAndOr: number;
    nondeterministic: number;
  };
  timeWindows: {
    withWindow: number;
    withoutWindow: number;
    everSegments: number;
  };
  sizeHealth: {
    zeroCount: number;
    lowVolume: number;
  };
  hygiene: {
    tempSegments: number;
    unusedInFlows: number;
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
    form?: {
      data?: {
        id?: string;
      } | null;
    } | null;
  };
};

const buildHeaders = (apiKey: string) => ({
  Accept: "application/json",
  Authorization: `Klaviyo-API-Key ${apiKey.trim()}`,
  revision: KLAVIYO_REVISION,
});

const readNumber = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
};

const readString = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }
  return null;
};

const readBoolean = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["true", "yes", "1", "checked", "on"].includes(normalized)) return true;
      if (["false", "no", "0", "off"].includes(normalized)) return false;
    }
    if (typeof value === "number") {
      if (value === 1) return true;
      if (value === 0) return false;
    }
  }
  return null;
};

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const normalizeEmailList = (values: unknown) => {
  if (!Array.isArray(values)) return [];
  const unique = new Set<string>();
  for (const value of values) {
    if (typeof value !== "string") continue;
    const normalized = normalizeEmail(value);
    if (normalized.length === 0) continue;
    unique.add(normalized);
  }
  return Array.from(unique);
};

const readPathValue = (source: Record<string, unknown>, path: string) => {
  const segments = path.split(".").filter(Boolean);
  let cursor: unknown = source;
  for (const segment of segments) {
    if (!cursor || typeof cursor !== "object") return undefined;
    cursor = (cursor as Record<string, unknown>)[segment];
  }
  return cursor;
};

const readObject = (value: unknown) =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : null;

const readNested = (obj: Record<string, unknown> | null, path: string[]) => {
  if (!obj) return null;
  let current: unknown = obj;
  for (const key of path) {
    const map = readObject(current);
    if (!map) return null;
    current = map[key];
  }
  return current ?? null;
};

const deepFindValue = (
  obj: unknown,
  matcher: (key: string, value: unknown) => boolean,
): unknown => {
  if (!obj || typeof obj !== "object") return null;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = deepFindValue(item, matcher);
      if (found !== null && found !== undefined) return found;
    }
    return null;
  }
  const record = obj as Record<string, unknown>;
  for (const [key, value] of Object.entries(record)) {
    if (matcher(key, value)) return value;
    const nested = deepFindValue(value, matcher);
    if (nested !== null && nested !== undefined) return nested;
  }
  return null;
};

const findByKeyPatterns = (obj: unknown, patterns: RegExp[]) =>
  deepFindValue(obj, (key) => patterns.some((pattern) => pattern.test(key)));

const findStringByKeyPatterns = (obj: unknown, patterns: RegExp[]) => {
  const found = findByKeyPatterns(obj, patterns);
  if (typeof found === "string" && found.trim().length > 0) return found.trim();
  if (typeof found === "number" && Number.isFinite(found)) return String(found);
  return null;
};

const hasExplicitMarketingConsent = (status: string | null) => {
  const value = (status ?? "").toLowerCase();
  return value === "subscribed" || value === "consented" || value === "opted_in";
};

const parseBodyRows = <T>(body: unknown): T[] => {
  if (!body || typeof body !== "object") return [];
  const maybeData = body as { data?: unknown };
  return Array.isArray(maybeData.data) ? (maybeData.data as T[]) : [];
};

const parseIncludedRows = <T>(body: unknown): T[] => {
  if (!body || typeof body !== "object") return [];
  const maybeData = body as { included?: unknown };
  return Array.isArray(maybeData.included) ? (maybeData.included as T[]) : [];
};

const readEventTimeMs = (event: KlaviyoEventRow) => {
  const datetime = readString(event.attributes?.datetime);
  if (datetime) {
    const ms = new Date(datetime).getTime();
    if (!Number.isNaN(ms)) return ms;
  }
  const timestampRaw = (event.attributes as Record<string, unknown> | undefined)?.timestamp;
  if (typeof timestampRaw === "number" && Number.isFinite(timestampRaw)) {
    return timestampRaw > 1_000_000_000_000 ? timestampRaw : timestampRaw * 1000;
  }
  return null;
};

const fetchJson = async (url: string, headers: Record<string, string>) => {
  const response = await fetch(url, { method: "GET", headers, cache: "no-store" });
  if (!response.ok) {
    const raw = await response.text().catch(() => "");
    return { ok: false as const, status: response.status, body: null, raw };
  }
  const body = await response.json().catch(() => null);
  return { ok: true as const, status: response.status, body, raw: "" };
};

const fetchReportJson = async (url: string, headers: Record<string, string>, payload: Record<string, unknown>) => {
  const response = await fetch(url, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  if (!response.ok) {
    const raw = await response.text().catch(() => "");
    return { ok: false as const, status: response.status, body: null, raw };
  }
  const body = await response.json().catch(() => null);
  return { ok: true as const, status: response.status, body, raw: "" };
};

const shortError = (raw: string) => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { errors?: Array<{ detail?: string; title?: string }> };
    const first = parsed.errors?.[0];
    return first?.detail ?? first?.title ?? raw.slice(0, 140);
  } catch {
    return raw.slice(0, 140);
  }
};

const nextLinkFromBody = (body: unknown) => {
  if (!body || typeof body !== "object") return null;
  const links = (body as { links?: { next?: unknown } }).links;
  const next = links?.next;
  return typeof next === "string" && next.length > 0 ? next : null;
};

const pullCount = (attrs?: Record<string, unknown>) =>
  readNumber(
    attrs?.profile_count,
    attrs?.member_count,
    attrs?.person_count,
    attrs?.subscriber_count,
    attrs?.count,
    attrs?.total,
  ) ?? 0;

const pullCountOrNull = (attrs?: Record<string, unknown>) =>
  readNumber(
    attrs?.profile_count,
    attrs?.member_count,
    attrs?.person_count,
    attrs?.subscriber_count,
    attrs?.count,
    attrs?.total,
  );

const toIsoDaysAgo = (days: number) => {
  const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return d.toISOString();
};

const percent = (part: number, total: number) => (total > 0 ? Number(((part / total) * 100).toFixed(1)) : 0);

const normalizeSource = (raw: string | null) => {
  const v = (raw ?? "").toLowerCase();
  if (!v) return "unknown";
  if (v.includes("shopify")) return "Shopify";
  if (v.includes("form") || v.includes("signup") || v.includes("popup")) return "Klaviyo forms";
  if (v.includes("csv") || v.includes("import")) return "CSV/import";
  if (v.includes("facebook") || v.includes("lead")) return "Lead ads/integracje";
  if (v.includes("migrat")) return "Migracja ESP";
  if (v.includes("api")) return "API/integracja";
  return "Inne";
};

const fetchCollectionProfileCount = async (
  collection: "lists" | "segments",
  id: string,
  headers: Record<string, string>,
) => {
  const result = await fetchJson(`${KLAVIYO_API_BASE_URL}/${collection}/${id}/profiles?page[size]=1`, headers);
  if (!result.ok) return null;
  const body = result.body as { meta?: Record<string, unknown> } | null;
  const meta = body?.meta;
  const metaCount = readNumber(meta?.count, meta?.total, meta?.total_results, meta?.total_count);
  if (metaCount !== null) return metaCount;
  return parseBodyRows<GenericRow>(result.body).length;
};

const hasExplicitMarketingOnlyWording = (wording: string | null) => {
  if (!wording) return false;
  const value = wording.toLowerCase();
  const hasMarketingKeyword =
    value.includes("marketing") ||
    value.includes("newsletter") ||
    value.includes("promocyjn") ||
    value.includes("promocj") ||
    value.includes("ofert");
  const hasAmbiguousKeyword =
    value.includes("and/or") ||
    value.includes("i/lub") ||
    value.includes("oraz/lub") ||
    value.includes("transactional") ||
    value.includes("informational") ||
    value.includes("transakcyjn") ||
    value.includes("informacyjn");
  return hasMarketingKeyword && !hasAmbiguousKeyword;
};

const normalizeStoreDomainToUrl = (raw: string | null) => {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `https://${value}`;
};

const parseDateMs = (value: string | null) => {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
};

const readJsonObject = (value: unknown) => {
  if (!value) return null;
  if (typeof value === "object") return value as Record<string, unknown>;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
  return null;
};

const collectStrings = (obj: unknown, acc: string[] = []) => {
  if (!obj) return acc;
  if (typeof obj === "string") {
    acc.push(obj);
    return acc;
  }
  if (typeof obj === "number" || typeof obj === "boolean") {
    acc.push(String(obj));
    return acc;
  }
  if (Array.isArray(obj)) {
    obj.forEach((item) => collectStrings(item, acc));
    return acc;
  }
  if (typeof obj === "object") {
    Object.entries(obj as Record<string, unknown>).forEach(([key, value]) => {
      acc.push(key);
      collectStrings(value, acc);
    });
  }
  return acc;
};

const normalizeNameKey = (value: string) =>
  value
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(v\d+|ver\s*\d+|copy)\b/g, "")
    .trim();

const inferFormContext = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("exit")) return "exit intent";
  if (n.includes("popup") || n.includes("pop-up")) return "popup";
  if (n.includes("embed") || n.includes("inline")) return "embedded";
  if (n.includes("checkout")) return "checkout";
  if (n.includes("blog")) return "blog";
  return "other";
};

const scanStoreForms = async (storeDomain: string | null) => {
  const url = normalizeStoreDomainToUrl(storeDomain);
  if (!url) {
    return {
      checked: false,
      url: null as string | null,
      totalForms: 0,
      totalEmailForms: 0,
      klaviyoTaggedForms: 0,
      klaviyoEmailForms: 0,
      nonKlaviyoForms: 0,
      nonKlaviyoEmailForms: 0,
      emailInputs: 0,
      requiredInputs: 0,
      hasCaptcha: false,
      hasThankYouSignals: false,
      hasDiscountSignals: false,
      hasAggressivePopupSignals: false,
      hasExitIntentSignals: false,
      hasScrollTriggerSignals: false,
      hasSourceMappingSignals: false,
      hasMobileSignals: false,
      popupDelaySeconds: null as number | null,
      sampleExternalActions: [] as string[],
      note: "Brak domeny sklepu do skanu formularzy.",
    };
  }

  try {
    const response = await fetch(url, { method: "GET", cache: "no-store" });
    if (!response.ok) {
      return {
        checked: false,
        url,
        totalForms: 0,
        totalEmailForms: 0,
        klaviyoTaggedForms: 0,
        klaviyoEmailForms: 0,
        nonKlaviyoForms: 0,
        nonKlaviyoEmailForms: 0,
        emailInputs: 0,
        requiredInputs: 0,
        hasCaptcha: false,
        hasThankYouSignals: false,
        hasDiscountSignals: false,
        hasAggressivePopupSignals: false,
        hasExitIntentSignals: false,
        hasScrollTriggerSignals: false,
        hasSourceMappingSignals: false,
        hasMobileSignals: false,
        popupDelaySeconds: null as number | null,
        sampleExternalActions: [] as string[],
        note: `Nie udalo sie pobrac HTML strony (status ${response.status}).`,
      };
    }
    const html = await response.text();
    const formBlocks = [...html.matchAll(/<form\b[\s\S]*?<\/form>/gi)].map((m) => m[0]);
    const emailFormBlocks = formBlocks.filter((block) => /type=["']email["']/i.test(block));
    const totalForms = formBlocks.length;
    const totalEmailForms = emailFormBlocks.length;
    const klaviyoTaggedForms = formBlocks.filter((tag) => /klaviyo|_kl_|learnq/i.test(tag)).length;
    const klaviyoEmailForms = emailFormBlocks.filter((tag) => /klaviyo|_kl_|learnq/i.test(tag)).length;
    const actions = emailFormBlocks
      .map((tag) => {
        const m = tag.match(/action=["']([^"']+)["']/i);
        return m?.[1]?.trim() ?? null;
      })
      .filter((v): v is string => Boolean(v));
    const sampleExternalActions = Array.from(
      new Set(actions.filter((action) => !/klaviyo|_kl_|learnq/i.test(action))),
    ).slice(0, 4);

    const hasKlaviyoScript =
      /static\.klaviyo\.com\/onsite\/js\/klaviyo\.js/i.test(html) ||
      /_learnq|klaviyo/i.test(html);
    const emailInputs = [...html.matchAll(/<input\b[^>]*type=["']email["'][^>]*>/gi)].length;
    const requiredInputs = [...html.matchAll(/<input\b[^>]*required[^>]*>/gi)].length;
    const hasCaptcha = /recaptcha|hcaptcha|turnstile|bot[\s_-]?protect/i.test(html);
    const hasThankYouSignals = /thank\s*you|dziekujemy|potwierdzono|sprawdz\s+email/i.test(html);
    const hasDiscountSignals = /discount|rabat|zni[zż]ka|kupon|kod/i.test(html);
    const hasAggressivePopupSignals = /settimeout\s*\([^,]+,\s*(?:500|800|1000|1200|1500|2000)\s*\)|delay.{0,24}(?:1|2)\s*s/i.test(
      html,
    );
    const hasExitIntentSignals = /exit[\s_-]?intent|mouseleave|mouseout/i.test(html);
    const hasScrollTriggerSignals = /scroll|intersectionobserver|onscroll/i.test(html);
    const hasSourceMappingSignals = /utm_|source|signup_source|form_id|list_id|profile/i.test(html);
    const hasMobileSignals = /@media\s*\(max-width|mobile|handheld|viewport/i.test(html);
    const delayMatches = [...html.matchAll(/setTimeout\s*\([^,]+,\s*(\d{3,5})\s*\)/gi)].map((m) => Number(m[1]));
    const popupDelaySeconds = delayMatches.length > 0 ? Math.min(...delayMatches) / 1000 : null;

    return {
      checked: true,
      url,
      totalForms,
      totalEmailForms,
      klaviyoTaggedForms,
      klaviyoEmailForms,
      nonKlaviyoForms: Math.max(0, totalForms - klaviyoTaggedForms),
      nonKlaviyoEmailForms: Math.max(0, totalEmailForms - klaviyoEmailForms),
      emailInputs,
      requiredInputs,
      hasCaptcha,
      hasThankYouSignals,
      hasDiscountSignals,
      hasAggressivePopupSignals,
      hasExitIntentSignals,
      hasScrollTriggerSignals,
      hasSourceMappingSignals,
      hasMobileSignals,
      popupDelaySeconds,
      sampleExternalActions,
      note: hasKlaviyoScript
        ? "Wykryto footprint Klaviyo na stronie."
        : "Nie wykryto footprint Klaviyo w HTML strony glownej.",
    };
  } catch {
    return {
      checked: false,
      url,
      totalForms: 0,
      totalEmailForms: 0,
      klaviyoTaggedForms: 0,
      klaviyoEmailForms: 0,
      nonKlaviyoForms: 0,
      nonKlaviyoEmailForms: 0,
      emailInputs: 0,
      requiredInputs: 0,
      hasCaptcha: false,
      hasThankYouSignals: false,
      hasDiscountSignals: false,
      hasAggressivePopupSignals: false,
      hasExitIntentSignals: false,
      hasScrollTriggerSignals: false,
      hasSourceMappingSignals: false,
      hasMobileSignals: false,
      popupDelaySeconds: null as number | null,
      sampleExternalActions: [] as string[],
      note: "Skan formularzy strony nie powiodl sie.",
    };
  }
};

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as {
    klaviyoPrivateApiKey?: string;
    debug?: boolean;
  } | null;
  const providedApiKey = payload?.klaviyoPrivateApiKey?.trim() ?? "";
  const debugMode = payload?.debug === true;

  const session = await getServerAuthSession();
  const userId = session?.user?.id ?? process.env.DEV_AUTH_USER_ID ?? null;
  let apiKey = providedApiKey;
  let activeClientId: string | null = null;
  let senderDomain: string | null = null;
  let ownerEmail: string | null = null;
  let internalEmails: string[] = [];
  let internalProfileFilter: Record<string, unknown> | null = null;
  let deviceMobileShare: number | null = null;
  if (userId) {
    const activeContext = await db.clientUserContext.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: { clientId: true },
    });
    activeClientId = activeContext?.clientId ?? null;
    if (activeContext?.clientId) {
      try {
        const clientProfile = await db.clientProfile.findUnique({
          where: { id: activeContext.clientId },
          select: {
            senderDomain: true,
            ownerEmail: true,
            internalEmails: true,
            internalProfileFilter: true,
          },
        });
        senderDomain = clientProfile?.senderDomain ?? null;
        ownerEmail = clientProfile?.ownerEmail ?? null;
        internalEmails = clientProfile?.internalEmails ?? [];
        internalProfileFilter = (clientProfile?.internalProfileFilter ?? null) as Record<string, unknown> | null;
        deviceMobileShare = null;
      } catch {
        senderDomain = null;
        ownerEmail = null;
        internalEmails = [];
        internalProfileFilter = null;
        deviceMobileShare = null;
      }
    }
    if (!apiKey && activeContext?.clientId) {
      const credentials = await loadClientCredentials(activeContext.clientId);
      apiKey = credentials.klaviyoPrivateApiKey ?? "";
    }
  }

  if (!apiKey) {
    return NextResponse.json(
      { error: "Brak zapisanego Klaviyo Private API Key dla aktywnego klienta." },
      { status: 400 },
    );
  }

  const headers = buildHeaders(apiKey);

  try {
    let infrastructure: {
      spf_status: string;
      dkim_status: string;
      dmarc_status: string;
      alignment_status: string;
      status: "ok" | "warning" | "critical";
      matchedDomain: string | null;
      raw: Record<string, unknown>;
    } = {
      spf_status: "unknown",
      dkim_status: "unknown",
      dmarc_status: "unknown",
      alignment_status: "unknown",
      status: "warning",
      matchedDomain: null,
      raw: {},
    };
    if (senderDomain) {
      try {
        infrastructure = await checkSenderDomain(senderDomain, {
          apiKey,
          clientId: activeClientId ?? undefined,
        });
      } catch {
        infrastructure = {
          spf_status: "unknown",
          dkim_status: "unknown",
          dmarc_status: "unknown",
          alignment_status: "unknown",
          status: "warning",
          matchedDomain: null,
          raw: {},
        };
      }
    }

    const campaignsUrl = `${KLAVIYO_API_BASE_URL}/campaigns?page[size]=50&filter=equals(messages.channel,'email')&include=campaign-messages&fields[campaign]=name,status,send_time,audiences&fields[campaign-message]=channel,content`;
    const [metricsResult, initialListsResult, initialSegmentsResult, initialFormsResult, initialFlowsResult, initialCampaignsResult] = await Promise.all([
      fetchJson(`${KLAVIYO_API_BASE_URL}/metrics?page[size]=100`, headers),
      fetchJson(`${KLAVIYO_API_BASE_URL}/lists?page[size]=50`, headers),
      fetchJson(`${KLAVIYO_API_BASE_URL}/segments?page[size]=50&include=flow-triggers,tags`, headers),
      fetchJson(`${KLAVIYO_API_BASE_URL}/forms?page[size]=50`, headers),
      fetchJson(`${KLAVIYO_API_BASE_URL}/flows?page[size]=100`, headers),
      fetchJson(campaignsUrl, headers),
    ]);

    const listsResult =
      !initialListsResult.ok && initialListsResult.status === 400
        ? await fetchJson(`${KLAVIYO_API_BASE_URL}/lists`, headers)
        : initialListsResult;
    const segmentsResult =
      !initialSegmentsResult.ok && initialSegmentsResult.status === 400
        ? await fetchJson(`${KLAVIYO_API_BASE_URL}/segments`, headers)
        : initialSegmentsResult;
    const formsResult =
      !initialFormsResult.ok && initialFormsResult.status === 400
        ? await fetchJson(`${KLAVIYO_API_BASE_URL}/forms`, headers)
        : initialFormsResult;
    const flowsResult =
      !initialFlowsResult.ok && initialFlowsResult.status === 400
        ? await fetchJson(`${KLAVIYO_API_BASE_URL}/flows`, headers)
        : initialFlowsResult;
    const campaignsResult =
      !initialCampaignsResult.ok && initialCampaignsResult.status === 400
        ? await fetchJson(`${KLAVIYO_API_BASE_URL}/campaigns`, headers)
        : initialCampaignsResult;
    const integrationWarnings: string[] = [];
    if (!metricsResult.ok) {
      integrationWarnings.push(
        `Brak dostepu do /metrics (status ${metricsResult.status}) - deliverability bedzie czesciowo niedostepne.`,
      );
    }
    if (!listsResult.ok) {
      const detail = shortError(listsResult.raw);
      integrationWarnings.push(
        `Brak dostepu do /lists (status ${listsResult.status})${detail ? `: ${detail}` : ""}.`,
      );
    }
    if (!segmentsResult.ok) {
      const detail = shortError(segmentsResult.raw);
      integrationWarnings.push(
        `Brak dostepu do /segments (status ${segmentsResult.status})${detail ? `: ${detail}` : ""}.`,
      );
    }
    if (!formsResult.ok) {
      const detail = shortError(formsResult.raw);
      integrationWarnings.push(
        `Brak dostepu do /forms (status ${formsResult.status})${detail ? `: ${detail}` : ""}.`,
      );
    }
    if (!flowsResult.ok) {
      const detail = shortError(flowsResult.raw);
      integrationWarnings.push(
        `Brak dostepu do /flows (status ${flowsResult.status})${detail ? `: ${detail}` : ""}.`,
      );
    }
    if (!campaignsResult.ok) {
      const detail = shortError(campaignsResult.raw);
      integrationWarnings.push(
        `Brak dostepu do /campaigns (status ${campaignsResult.status})${detail ? `: ${detail}` : ""}.`,
      );
    }

    const flowRows = flowsResult.ok ? parseBodyRows<GenericRow>(flowsResult.body) : [];
    const flowCatalog = flowRows
      .map((row) => ({
        id: row.id ?? "",
        name: readString(row.attributes?.name, row.attributes?.title) ?? "Bez nazwy",
        status: readString(row.attributes?.status) ?? null,
      }))
      .filter((flow) => flow.id);

    const campaignRows = campaignsResult.ok ? parseBodyRows<GenericRow>(campaignsResult.body) : [];
    const campaignIncludedRows = campaignsResult.ok ? parseIncludedRows<GenericRow>(campaignsResult.body) : [];

    let profileRows: GenericRow[] = [];
    let profilePages = 0;
    let profileNextUrl: string | null = `${KLAVIYO_API_BASE_URL}/profiles?page[size]=${PAGE_SIZE}&additional-fields[profile]=subscriptions`;
    let metaTotalProfiles: number | null = null;
    while (profileNextUrl && profilePages < MAX_PROFILE_PAGES) {
      const page = await fetchJson(profileNextUrl, headers);
      if (!page.ok) break;
      profileRows = profileRows.concat(parseBodyRows<GenericRow>(page.body));
      if (metaTotalProfiles === null) {
        const meta = (page.body as { meta?: Record<string, unknown> } | null)?.meta;
        metaTotalProfiles = readNumber(meta?.count, meta?.total, meta?.total_results, meta?.total_count);
      }
      profileNextUrl = nextLinkFromBody(page.body);
      profilePages += 1;
    }

    const allProfiles = metaTotalProfiles ?? profileRows.length;

    const profilesWithEmail = profileRows.filter((row) => {
      const attrs = row.attributes ?? {};
      return Boolean(readString(attrs.email, attrs.Email));
    });

    const suppressionReasonMap = new Map<string, number>();
    const sourceMap = new Map<string, number>();
    const sourceNeedsReviewMap = new Map<string, number>();
    const fallbackActivityBuckets = {
      active30: 0,
      active60: 0,
      active90: 0,
      inactive90plus: 0,
      inactive180plus: 0,
      inactive365plus: 0,
    };
    const contactAgeDays: number[] = [];
    let oldestProfileMs: number | null = null;
    let strictContactableProfiles = 0;
    let estimatedContactableProfiles = 0;
    let consentVerifiedCount = 0;
    let consentNeedsReviewCount = 0;
    let consentInvalidTotalCount = 0;
    let consentInvalidInternalCount = 0;
    let formProfilesTotal = 0;
    let formConsentVerifiedCount = 0;
    let formConsentInvalidCount = 0;
    let formDoiConfirmedCount = 0;
    let formFreshConsentCount = 0;
    let formConfirmedConsentCount = 0;
    let ambiguousMarketingConsentCount = 0;
    let externalOrUnknownNeedsReviewCount = 0;
    let unknownNeedsReviewCount = 0;
    let freshConsentCount = 0;
    let oldImportCount = 0;
    let doiCount = 0;
    let confirmedConsentCount = 0;
    const verifiedAccounts: Array<{ id: string; email: string; source: string }> = [];
    const allConsentAccounts = new Map<string, { id: string; email: string; source: string }>();
    const verifiedConsentAccountKeys = new Set<string>();
    const internalConsentAccountKeys = new Set<string>();
    const profilesWithEmailIds = new Set<string>();
    const formIdToProfileIds = new Map<string, Set<string>>();
    const profileIdToFormId = new Map<string, string>();
    const internalEmailSet = new Set<string>();
    for (const email of normalizeEmailList(internalEmails)) {
      internalEmailSet.add(email);
    }
    if (ownerEmail) {
      internalEmailSet.add(normalizeEmail(ownerEmail));
    }
    const internalFilter =
      internalProfileFilter && typeof internalProfileFilter === "object"
        ? (internalProfileFilter as { property?: string; equals?: unknown; truthy?: boolean })
        : null;
    const matchesInternalFilter = (attrs: Record<string, unknown>) => {
      if (!internalFilter || typeof internalFilter.property !== "string" || internalFilter.property.length === 0) {
        return false;
      }
      const properties =
        attrs.properties && typeof attrs.properties === "object"
          ? (attrs.properties as Record<string, unknown>)
          : {};
      const value = readPathValue(properties, internalFilter.property);
      if (internalFilter.equals !== undefined) {
        if (typeof value === "string" && typeof internalFilter.equals === "string") {
          return value.toLowerCase() === internalFilter.equals.toLowerCase();
        }
        return value === internalFilter.equals;
      }
      if (internalFilter.truthy) {
        return Boolean(value);
      }
      return false;
    };

    for (const row of profilesWithEmail) {
      const attrs = row.attributes ?? {};
      if (row.id) {
        profilesWithEmailIds.add(row.id);
      }
      const subscriptions =
        attrs.subscriptions && typeof attrs.subscriptions === "object"
          ? (attrs.subscriptions as Record<string, unknown>)
          : {};
      const emailSub =
        subscriptions.email && typeof subscriptions.email === "object"
          ? (subscriptions.email as Record<string, unknown>)
          : {};
      const marketing =
        emailSub.marketing && typeof emailSub.marketing === "object"
          ? (emailSub.marketing as Record<string, unknown>)
          : {};
      const marketingStatus =
        readString(
          marketing.status,
          marketing.consent,
          marketing.permission,
          emailSub.status,
          emailSub.consent,
          emailSub.permission,
        )?.toLowerCase() ?? null;
      const canReceiveEmail = readString(marketing.can_receive_email, marketing.canReceiveEmail)?.toLowerCase();
      const suppressionReason = readString(marketing.suppression_reason, marketing.suppressionReason);

      const isSuppressed = Boolean(
        suppressionReason ||
          canReceiveEmail === "false" ||
          marketingStatus === "suppressed" ||
          marketingStatus === "unsubscribed",
      );

      if (isSuppressed) {
        const reason = suppressionReason ?? "unknown";
        suppressionReasonMap.set(reason, (suppressionReasonMap.get(reason) ?? 0) + 1);
      }

      if (!isSuppressed) {
        if (hasExplicitMarketingConsent(marketingStatus)) {
          strictContactableProfiles += 1;
        }
        if (hasExplicitMarketingConsent(marketingStatus) || !marketingStatus || marketingStatus === "active") {
          estimatedContactableProfiles += 1;
        }
      }

      const sourceRaw = readString(
        marketing.method,
        marketing.method_detail,
        marketing.subscription_method,
        marketing.subscriptionMethod,
        emailSub.method,
        emailSub.method_detail,
        emailSub.subscription_method,
        emailSub.subscriptionMethod,
        (attrs.properties as Record<string, unknown> | undefined)?.source,
        (attrs.properties as Record<string, unknown> | undefined)?.signup_source,
      );
      const source = normalizeSource(sourceRaw);
      sourceMap.set(source, (sourceMap.get(source) ?? 0) + 1);
      const profileEmail = readString(attrs.email, attrs.Email) ?? "brak-email";
      const profileEmailNormalized = profileEmail.toLowerCase();
      const isInternalProfile =
        internalEmailSet.has(profileEmailNormalized) || matchesInternalFilter(attrs);
      const consentAccountKey = row.id?.trim() ? row.id.trim() : `email:${profileEmail.toLowerCase()}`;
      allConsentAccounts.set(consentAccountKey, {
        id: row.id ?? "",
        email: profileEmail,
        source,
      });
      if (isInternalProfile) {
        internalConsentAccountKeys.add(consentAccountKey);
      }
      const sourceRawLower = (sourceRaw ?? "").toLowerCase();
      const isKlaviyoFormMethod = sourceRawLower.includes("klaviyo form") || source === "Klaviyo forms";
      if (isKlaviyoFormMethod) {
        formProfilesTotal += 1;
      }
      const consentTimestamp = readString(
        marketing.timestamp,
        marketing.consent_timestamp,
        marketing.subscribed_at,
        marketing.time,
        (attrs.properties as Record<string, unknown> | undefined)?.subscription_timestamp,
      );
      const consentFormEvidence = readString(
        marketing.form_id,
        marketing.formId,
        marketing.form_version,
        marketing.formVersion,
        marketing.subscription_form_id,
        marketing.subscription_form_version,
        emailSub.form_id,
        emailSub.formId,
        emailSub.form_version,
        emailSub.formVersion,
        emailSub.subscription_form_id,
        emailSub.subscription_form_version,
        (attrs.properties as Record<string, unknown> | undefined)?.form_id,
        (attrs.properties as Record<string, unknown> | undefined)?.formId,
        (attrs.properties as Record<string, unknown> | undefined)?.form_version,
        (attrs.properties as Record<string, unknown> | undefined)?.formVersion,
        (attrs.properties as Record<string, unknown> | undefined)?.signup_form_id,
        (attrs.properties as Record<string, unknown> | undefined)?.consent_form_id,
        (attrs.properties as Record<string, unknown> | undefined)?.$consent_form_id,
      );
      if (row.id && consentFormEvidence) {
        const bucket = formIdToProfileIds.get(consentFormEvidence) ?? new Set<string>();
        bucket.add(row.id);
        formIdToProfileIds.set(consentFormEvidence, bucket);
        if (!profileIdToFormId.has(row.id)) {
          profileIdToFormId.set(row.id, consentFormEvidence);
        }
      }
      const consentIp = readString(
        marketing.ip,
        marketing.ip_address,
        marketing.ipAddress,
        emailSub.ip,
        emailSub.ip_address,
        emailSub.ipAddress,
        (attrs.properties as Record<string, unknown> | undefined)?.ip,
        (attrs.properties as Record<string, unknown> | undefined)?.ip_address,
      );
      const hasConsentMetadata =
        Boolean(consentTimestamp) && Boolean(consentFormEvidence) && Boolean(consentIp);
      const hasOnsiteFormEvidence =
        hasExplicitMarketingConsent(marketingStatus) &&
        isKlaviyoFormMethod &&
        hasConsentMetadata;
      const hasShopifyConsentEvidence =
        hasExplicitMarketingConsent(marketingStatus) && source === "Shopify";
      const hasOperationalConsentEvidence =
        hasExplicitMarketingConsent(marketingStatus) ||
        hasOnsiteFormEvidence ||
        hasShopifyConsentEvidence;
      if (hasOperationalConsentEvidence) {
        confirmedConsentCount += 1;
        if (isKlaviyoFormMethod) {
          formConfirmedConsentCount += 1;
        }
      }
      const nowMs = Date.now();
      const consentMs = consentTimestamp ? new Date(consentTimestamp).getTime() : NaN;
      if (hasExplicitMarketingConsent(marketingStatus) && !Number.isNaN(consentMs)) {
        const isFresh = nowMs - consentMs <= 90 * 24 * 60 * 60 * 1000;
        if (isFresh) {
          freshConsentCount += 1;
          if (isKlaviyoFormMethod) {
            formFreshConsentCount += 1;
          }
        }
      }
      const doiFlag =
        readBoolean(
          marketing.double_opt_in,
          marketing.doubleOptIn,
          emailSub.double_opt_in,
          emailSub.doubleOptIn,
        ) === true ||
        (marketingStatus?.includes("double") ?? false);
      if (doiFlag || hasOperationalConsentEvidence) {
        doiCount += 1;
        if (isKlaviyoFormMethod && doiFlag) {
          formDoiConfirmedCount += 1;
        }
      }
      const marketingOnlyCheckbox = readBoolean(
        marketing.marketing_checkbox,
        marketing.separate_marketing_checkbox,
        marketing.marketing_optin_checkbox,
        emailSub.marketing_checkbox,
        emailSub.separate_marketing_checkbox,
        (attrs.properties as Record<string, unknown> | undefined)?.marketing_checkbox,
        (attrs.properties as Record<string, unknown> | undefined)?.separate_marketing_checkbox,
      );
      const consentWording = readString(
        marketing.consent_text,
        marketing.consent_wording,
        emailSub.consent_text,
        emailSub.consent_wording,
        (attrs.properties as Record<string, unknown> | undefined)?.consent_text,
        (attrs.properties as Record<string, unknown> | undefined)?.consent_wording,
      );
      const hasMarketingOnlyEvidence =
        marketingOnlyCheckbox === true || hasExplicitMarketingOnlyWording(consentWording);
      if (!isSuppressed) {
        if (hasOperationalConsentEvidence) {
          consentVerifiedCount += 1;
          if (isKlaviyoFormMethod) {
            formConsentVerifiedCount += 1;
          }
          if (!verifiedConsentAccountKeys.has(consentAccountKey)) {
            verifiedConsentAccountKeys.add(consentAccountKey);
            verifiedAccounts.push({
              id: row.id ?? "",
              email: profileEmail,
              source,
            });
          }
        }
      }
      const isExternalOrUnknownSource =
        source === "CSV/import" ||
        source === "API/integracja" ||
        source === "Lead ads/integracje" ||
        source === "Migracja ESP" ||
        source === "unknown" ||
        source === "Inne";
      if (isExternalOrUnknownSource) {
        const createdRaw = readString(attrs.created, attrs.created_at, attrs.createdAt, attrs.first_created);
        const createdMs = createdRaw ? new Date(createdRaw).getTime() : NaN;
        if (!Number.isNaN(createdMs) && nowMs - createdMs > 180 * 24 * 60 * 60 * 1000) {
          oldImportCount += 1;
        }
      }
      const hasAnySubscriptionMetadata =
        Boolean(consentTimestamp) || Boolean(consentFormEvidence) || Boolean(consentIp);
      if (!isSuppressed && !hasOperationalConsentEvidence) {
        if (!isKlaviyoFormMethod && isExternalOrUnknownSource && !hasAnySubscriptionMetadata) {
          consentNeedsReviewCount += 1;
          externalOrUnknownNeedsReviewCount += 1;
          sourceNeedsReviewMap.set(
            source,
            (sourceNeedsReviewMap.get(source) ?? 0) + 1,
          );
        } else if (!hasExplicitMarketingConsent(marketingStatus)) {
          consentInvalidTotalCount += 1;
          if (isInternalProfile) {
            consentInvalidInternalCount += 1;
          }
          if (isKlaviyoFormMethod && !isInternalProfile) {
            formConsentInvalidCount += 1;
          }
        } else if (!hasMarketingOnlyEvidence) {
          // Mamy sygnaly zgody, ale bez jednoznacznego marketing-only -> manualna weryfikacja.
          consentNeedsReviewCount += 1;
          unknownNeedsReviewCount += 1;
        }
      }

      const lastEventRaw = readString(attrs.last_event_date, attrs.updated, attrs.created);
      const lastEventMs = lastEventRaw ? new Date(lastEventRaw).getTime() : NaN;
      if (!Number.isNaN(lastEventMs)) {
        const ageDays = Math.floor((Date.now() - lastEventMs) / (24 * 60 * 60 * 1000));
        contactAgeDays.push(ageDays);
        if (ageDays <= 30) fallbackActivityBuckets.active30 += 1;
        if (ageDays <= 60) fallbackActivityBuckets.active60 += 1;
        if (ageDays <= 90) fallbackActivityBuckets.active90 += 1;
        if (ageDays > 90) fallbackActivityBuckets.inactive90plus += 1;
        if (ageDays > 180) fallbackActivityBuckets.inactive180plus += 1;
        if (ageDays > 365) fallbackActivityBuckets.inactive365plus += 1;
      }

      const createdRaw = readString(attrs.created, attrs.created_at, attrs.createdAt, attrs.first_created);
      if (createdRaw) {
        const createdMs = new Date(createdRaw).getTime();
        if (!Number.isNaN(createdMs)) {
          oldestProfileMs = oldestProfileMs ? Math.min(oldestProfileMs, createdMs) : createdMs;
        }
      }
    }

    const suppressedCount = Array.from(suppressionReasonMap.values()).reduce((a, b) => a + b, 0);
    const contactableProfiles =
      strictContactableProfiles > 0 ? strictContactableProfiles : Math.max(0, estimatedContactableProfiles);
    const ageSample = contactAgeDays.filter((value) => Number.isFinite(value));
    const ageSampleSorted = [...ageSample].sort((a, b) => a - b);
    const avgAgeDays =
      ageSampleSorted.length > 0
        ? Math.round(ageSampleSorted.reduce((sum, value) => sum + value, 0) / ageSampleSorted.length)
        : null;
    const medianAgeDays =
      ageSampleSorted.length > 0
        ? ageSampleSorted[Math.floor(ageSampleSorted.length / 2)]
        : null;
    const notVerifiedAccounts = Array.from(allConsentAccounts.entries())
      .filter(([key]) => !verifiedConsentAccountKeys.has(key) && !internalConsentAccountKeys.has(key))
      .map(([, account]) => account);
    const consentInvalidExternalCount = Math.max(
      consentInvalidTotalCount - consentInvalidInternalCount,
      0,
    );
    const internalExceptionsConfigured =
      internalEmailSet.size > 0 || Boolean(internalProfileFilter);
    const totalContacts = profilesWithEmail.length;

    let listRows = listsResult.ok ? parseBodyRows<GenericRow>(listsResult.body) : [];
    let segmentRows = segmentsResult.ok ? parseBodyRows<GenericRow>(segmentsResult.body) : [];
    const listMeta = (listsResult.body as { meta?: Record<string, unknown> } | null)?.meta;
    const segmentMeta = (segmentsResult.body as { meta?: Record<string, unknown> } | null)?.meta;
    let totalListsMeta = readNumber(listMeta?.count, listMeta?.total, listMeta?.total_results, listMeta?.total_count);
    let totalSegmentsMeta = readNumber(
      segmentMeta?.count,
      segmentMeta?.total,
      segmentMeta?.total_results,
      segmentMeta?.total_count,
    );

    // Fallback pagination when API meta total is missing.
    if (listsResult.ok && totalListsMeta === null) {
      let nextUrl = nextLinkFromBody(listsResult.body);
      let pages = 1;
      while (nextUrl && pages < MAX_PROFILE_PAGES) {
        const page = await fetchJson(nextUrl, headers);
        if (!page.ok) break;
        listRows = listRows.concat(parseBodyRows<GenericRow>(page.body));
        nextUrl = nextLinkFromBody(page.body);
        pages += 1;
      }
      totalListsMeta = listRows.length;
    }
    if (segmentsResult.ok && totalSegmentsMeta === null) {
      let nextUrl = nextLinkFromBody(segmentsResult.body);
      let pages = 1;
      while (nextUrl && pages < MAX_PROFILE_PAGES) {
        const page = await fetchJson(nextUrl, headers);
        if (!page.ok) break;
        segmentRows = segmentRows.concat(parseBodyRows<GenericRow>(page.body));
        nextUrl = nextLinkFromBody(page.body);
        pages += 1;
      }
      totalSegmentsMeta = segmentRows.length;
    }
    const listRowsWithCount = await Promise.all(
      listRows.map(async (row) => {
        const attrs = row.attributes ?? {};
        const fromAttrs = pullCountOrNull(attrs);
        if (fromAttrs !== null) return { row, count: fromAttrs };
        if (!row.id) return { row, count: 0 };
        const resolved = await fetchCollectionProfileCount("lists", row.id, headers);
        return { row, count: resolved ?? 0 };
      }),
    );
    const segmentRowsWithCount = await Promise.all(
      segmentRows.map(async (row) => {
        const attrs = row.attributes ?? {};
        const fromAttrs = pullCountOrNull(attrs);
        if (fromAttrs !== null) return { row, count: fromAttrs };
        if (!row.id) return { row, count: 0 };
        const resolved = await fetchCollectionProfileCount("segments", row.id, headers);
        return { row, count: resolved ?? 0 };
      }),
    );

    const nonEmptyLists = listRowsWithCount.filter((item) => item.count > 0);
    const listIdToName = new Map<string, string>(
      listRows.map((row) => {
        const attrs = row.attributes ?? {};
        return [
          row.id ?? "",
          readString(attrs.name, attrs.title, "Lista bez nazwy") ?? "Lista bez nazwy",
        ];
      }),
    );
    const listIdToCount = new Map<string, number | null>(
      listRowsWithCount.map(({ row, count }) => [row.id ?? "", typeof count === "number" ? count : null]),
    );
    const segmentIdToName = new Map<string, string>(
      segmentRows.map((row) => {
        const attrs = row.attributes ?? {};
        return [
          row.id ?? "",
          readString(attrs.name, attrs.title, "Segment bez nazwy") ?? "Segment bez nazwy",
        ];
      }),
    );
    const segmentIdToCount = new Map<string, number | null>(
      segmentRowsWithCount.map(({ row, count }) => [row.id ?? "", typeof count === "number" ? count : null]),
    );
    const campaignMessageMap = new Map<
      string,
      { subject: string | null; previewText: string | null; channel: string | null }
    >();
    campaignIncludedRows.forEach((row) => {
      if (!row.id || (row as { type?: string }).type !== "campaign-message") return;
      const attrs = row.attributes ?? {};
      const content = (attrs as Record<string, unknown>).content as Record<string, unknown> | undefined;
      const subject =
        readString(content?.subject, (attrs as Record<string, unknown>).subject, (attrs as Record<string, unknown>).title) ??
        null;
      const previewText =
        readString(content?.preview_text, content?.previewText, (attrs as Record<string, unknown>).preview_text) ??
        null;
      const channel = readString((attrs as Record<string, unknown>).channel, (attrs as Record<string, unknown>).message_channel);
      campaignMessageMap.set(row.id ?? "", { subject, previewText, channel });
    });

    const normalizeAudience = (audiences: Record<string, unknown> | null | undefined) => {
      const includedRaw = (audiences?.included ?? audiences?.include ?? []) as unknown[];
      const excludedRaw = (audiences?.excluded ?? audiences?.exclude ?? []) as unknown[];
      const included: string[] = Array.isArray(includedRaw)
        ? (includedRaw.filter((item) => typeof item === "string") as string[])
        : [];
      const excluded: string[] = Array.isArray(excludedRaw)
        ? (excludedRaw.filter((item) => typeof item === "string") as string[])
        : [];

      const includedSegments: Array<{ id: string; name: string }> = [];
      const includedLists: Array<{ id: string; name: string }> = [];
      const excludedSegments: Array<{ id: string; name: string }> = [];
      const excludedLists: Array<{ id: string; name: string }> = [];
      const unknownIncluded: string[] = [];
      const unknownExcluded: string[] = [];

      included.forEach((id) => {
        if (segmentIdToName.has(id)) {
          includedSegments.push({ id, name: segmentIdToName.get(id) ?? id });
        } else if (listIdToName.has(id)) {
          includedLists.push({ id, name: listIdToName.get(id) ?? id });
        } else {
          unknownIncluded.push(id);
        }
      });
      excluded.forEach((id) => {
        if (segmentIdToName.has(id)) {
          excludedSegments.push({ id, name: segmentIdToName.get(id) ?? id });
        } else if (listIdToName.has(id)) {
          excludedLists.push({ id, name: listIdToName.get(id) ?? id });
        } else {
          unknownExcluded.push(id);
        }
      });

      const totalProfiles = allProfiles ?? 0;
      const listCoverage = includedLists
        .map((item) => listIdToCount.get(item.id))
        .filter((count): count is number => typeof count === "number" && count > 0)
        .reduce((acc, count) => acc + count, 0);
      const isEntireListHeuristic =
        includedSegments.length === 0 &&
        includedLists.length > 0 &&
        ((totalProfiles > 0 && listCoverage / totalProfiles > 0.6) ||
          includedLists.some((item) => /all|master|everyone|wszyscy|glowna/.test(item.name.toLowerCase())));

      return {
        includedSegments,
        includedLists,
        excludedSegments,
        excludedLists,
        unknownIncluded,
        unknownExcluded,
        isEntireList: isEntireListHeuristic,
        isEntireListHeuristic,
      };
    };

    const campaignCatalog = campaignRows
      .map((row) => {
        const attributes = row.attributes ?? {};
        const audiences = (attributes as Record<string, unknown>).audiences as Record<string, unknown> | undefined;
        const messageRel = (row.relationships as Record<string, unknown> | undefined)?.["campaign-messages"] as
          | { data?: Array<{ id?: string }> }
          | undefined;
        const messageIds = messageRel?.data?.map((item) => item.id).filter(Boolean) as string[] | undefined;
        const message =
          messageIds?.map((id) => campaignMessageMap.get(id)).find((entry) => entry?.channel === "email") ??
          (messageIds?.map((id) => campaignMessageMap.get(id)).find(Boolean) ?? null);
        const subject = message?.subject ?? null;
        const previewText = message?.previewText ?? null;

        return {
          id: row.id ?? "",
          name: readString(attributes.name, attributes.title) ?? "Bez nazwy",
          status: readString(attributes.status) ?? null,
          sendTime: readString(attributes.send_time, attributes.sendTime, attributes.updated_at) ?? null,
          subject,
          previewText,
          audience: normalizeAudience(audiences),
        };
      })
      .filter((campaign) => campaign.id);
    const nonEmptySegments = segmentRowsWithCount.filter((item) => item.count > 0);

    const segmentAudit = (() => {
      const processingSegments: Array<{ id: string; name: string }> = [];
      const processingTooLong: Array<{ id: string; name: string; updatedAt: string | null }> = [];
      const keySegmentsFound: Record<"engaged" | "unengaged" | "vip", string[]> = {
        engaged: [],
        unengaged: [],
        vip: [],
      };
      const nameKeyCounts = new Map<string, number>();
      const tempRegex = /\b(tmp|test|draft|copy|v\d+|sandbox|old)\b/i;
      const ambiguousRegex = /\b(segment|lista|list|audyt|testowy|roboczy)\b/i;
      let tempCount = 0;
      let ambiguousCount = 0;
      let eventBased = 0;
      let profileBased = 0;
      let mixedLogic = 0;
      let exclusiveLogic = 0;
      let hasAndOr = 0;
      let nondeterministic = 0;
      let withWindow = 0;
      let withoutWindow = 0;
      let everSegments = 0;
      let zeroCount = 0;
      let lowVolume = 0;
      let unusedInFlows = 0;
      const nowMs = Date.now();
      const keyPatterns = {
        engaged: /(engaged|active|recent|last\s*30|last\s*60|last\s*90|30\s*days|60\s*days|90\s*days|recently)/i,
        unengaged: /(unengaged|inactive|no\s*engagement|winback|sunset|lapsed|dormant|churn|re[- ]?engage)/i,
        vip: /(vip|high\s*value|top\s*customer|best\s*customers|loyal)/i,
      };
      const eventSignal = /(event|metric|placed\s*order|checkout|active\s*on\s*site|clicked\s*email|opened\s*email)/i;
      const profileSignal = /(profile|property|properties|email|consent|list|segment)/i;
      const timeSignal = /(last|past|within|days|weeks|months|hours|ever|all\s*time)/i;
      const andOrSignal = /\b(and|or|any|all|match)\b/i;
      const excludeSignal = /(not|exclude|does\s*not|is\s*not|without|minus|except)/i;
      const nondeterministicSignal = /(random|sample|predict|likelihood|probab)/i;

      const readDefinition = (attrs: Record<string, unknown>) =>
        readJsonObject(
          attrs.definition ??
            attrs.segment_definition ??
            attrs.segmentDefinition ??
            attrs.conditions ??
            attrs.condition_groups ??
            readNested(attrs, ["definition"]) ??
            readNested(attrs, ["conditions"]) ??
            readNested(attrs, ["condition_groups"]),
        );

      const relationshipCount = (row: GenericRow, key: string) => {
        const rel =
          row.relationships && typeof row.relationships === "object"
            ? (row.relationships as Record<string, unknown>)[key]
            : null;
        if (!rel || typeof rel !== "object") return null;
        const data = (rel as Record<string, unknown>).data;
        if (Array.isArray(data)) return data.length;
        if (data && typeof data === "object") return 1;
        if (data === null) return 0;
        return null;
      };

      const segmentEntries = segmentRowsWithCount.map(({ row, count }) => {
        const attrs = row.attributes ?? {};
        const name = readString(attrs.name, attrs.title, "Segment bez nazwy") ?? "Segment bez nazwy";
        const isProcessing = readBoolean(attrs.is_processing, attrs.processing, attrs.isProcessing) ?? false;
        const updatedAt = readString(
          attrs.updated_at,
          attrs.updated,
          attrs.last_updated_at,
          attrs.last_refreshed,
          attrs.last_refreshed_at,
          attrs.created,
        );
        const updatedMs = parseDateMs(updatedAt);
        const nameKey = normalizeNameKey(name);
        nameKeyCounts.set(nameKey, (nameKeyCounts.get(nameKey) ?? 0) + 1);
        if (tempRegex.test(name)) tempCount += 1;
        if (ambiguousRegex.test(name)) ambiguousCount += 1;

        const definition = readDefinition(attrs);
        const tokens = collectStrings(definition);
        const hasEventSignal = tokens.some((token) => eventSignal.test(String(token)));
        const hasProfileSignal = tokens.some((token) => profileSignal.test(String(token)));
        const hasTimeSignal = tokens.some((token) => timeSignal.test(String(token)));
        const hasAndOrSignal = tokens.some((token) => andOrSignal.test(String(token)));
        const hasExcludeSignal = tokens.some((token) => excludeSignal.test(String(token)));
        const hasNondeterministicSignal = tokens.some((token) => nondeterministicSignal.test(String(token)));

        if (hasEventSignal && hasProfileSignal) mixedLogic += 1;
        else if (hasEventSignal) eventBased += 1;
        else if (hasProfileSignal) profileBased += 1;

        if (hasAndOrSignal) hasAndOr += 1;
        if (hasExcludeSignal) exclusiveLogic += 1;
        if (hasNondeterministicSignal) nondeterministic += 1;

        if (hasTimeSignal) withWindow += 1;
        else {
          withoutWindow += 1;
          if (tokens.some((token) => /ever|all\s*time/i.test(String(token)))) everSegments += 1;
        }

        if (count === 0) zeroCount += 1;
        if (count > 0 && count < 50) lowVolume += 1;

        const flowCount = relationshipCount(row, "flow-triggers");
        if (flowCount !== null && flowCount === 0) unusedInFlows += 1;

        if (isProcessing) {
          processingSegments.push({ id: row.id ?? "", name });
          if (updatedMs && nowMs - updatedMs > 24 * 60 * 60 * 1000) {
            processingTooLong.push({ id: row.id ?? "", name, updatedAt: updatedAt ?? null });
          }
        }
        const lower = name.toLowerCase();
        if (keyPatterns.engaged.test(lower)) keySegmentsFound.engaged.push(name);
        if (keyPatterns.unengaged.test(lower)) keySegmentsFound.unengaged.push(name);
        if (keyPatterns.vip.test(lower)) keySegmentsFound.vip.push(name);
        return { id: row.id ?? "", name, count };
      });

      const missingKeySegments = (Object.keys(keySegmentsFound) as Array<"engaged" | "unengaged" | "vip">).filter(
        (key) => keySegmentsFound[key].length === 0,
      );

      const topSegments = segmentEntries
        .filter((item) => item.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const duplicateCount = Array.from(nameKeyCounts.values()).filter((count) => count > 1).length;

      return {
        totalSegments: segmentRowsWithCount.length,
        processingSegments,
        processingTooLong,
        missingKeySegments,
        keySegmentsFound,
        topSegments,
        nameQuality: {
          tempOrTest: tempCount,
          duplicates: duplicateCount,
          ambiguous: ambiguousCount,
        },
        logic: {
          eventBased,
          profileBased,
          mixed: mixedLogic,
          exclusiveLogic,
          hasAndOr,
          nondeterministic,
        },
        timeWindows: {
          withWindow,
          withoutWindow,
          everSegments,
        },
        sizeHealth: {
          zeroCount,
          lowVolume,
        },
        hygiene: {
          tempSegments: tempCount,
          unusedInFlows,
        },
      } satisfies SegmentAudit;
    })();

    const extractFormIdFromProfileAttrs = (attrs: Record<string, unknown>) => {
      const subscriptions =
        attrs.subscriptions && typeof attrs.subscriptions === "object"
          ? (attrs.subscriptions as Record<string, unknown>)
          : {};
      const emailSub =
        subscriptions.email && typeof subscriptions.email === "object"
          ? (subscriptions.email as Record<string, unknown>)
          : {};
      const marketing =
        emailSub.marketing && typeof emailSub.marketing === "object"
          ? (emailSub.marketing as Record<string, unknown>)
          : {};
      return readString(
        marketing.form_id,
        marketing.formId,
        marketing.formID,
        marketing.subscription_form_id,
        marketing.subscription_form_version,
        emailSub.form_id,
        emailSub.formId,
        emailSub.formID,
        emailSub.subscription_form_id,
        emailSub.subscription_form_version,
        (attrs.properties as Record<string, unknown> | undefined)?.form_id,
        (attrs.properties as Record<string, unknown> | undefined)?.signup_form_id,
        (attrs.properties as Record<string, unknown> | undefined)?.formId,
        (attrs.properties as Record<string, unknown> | undefined)?.formID,
        (attrs.properties as Record<string, unknown> | undefined)?.consent_form_id,
        (attrs.properties as Record<string, unknown> | undefined)?.$consent_form_id,
      );
    };

    const formIdToListName = new Map<string, string>();
    if (listsResult.ok) {
      const formIdToListCounts = new Map<string, Map<string, number>>();
      const listsToScan = nonEmptyLists.slice(0, 20);
      for (const { row } of listsToScan) {
        if (!row.id) continue;
        const listName = listIdToName.get(row.id) ?? "Lista bez nazwy";
        const listProfiles = await fetchJson(
          `${KLAVIYO_API_BASE_URL}/lists/${row.id}/profiles?page[size]=50`,
          headers,
        );
        if (!listProfiles.ok) continue;
        const profileRows = parseBodyRows<GenericRow>(listProfiles.body);
        for (const profile of profileRows) {
          const attrs = profile.attributes ?? {};
          const formId = extractFormIdFromProfileAttrs(attrs);
          if (!formId) continue;
          const bucket = formIdToListCounts.get(formId) ?? new Map<string, number>();
          bucket.set(listName, (bucket.get(listName) ?? 0) + 1);
          formIdToListCounts.set(formId, bucket);
        }
      }
      for (const [formId, counts] of formIdToListCounts.entries()) {
        let topName: string | null = null;
        let topCount = 0;
        for (const [name, count] of counts.entries()) {
          if (count > topCount) {
            topName = name;
            topCount = count;
          }
        }
        if (topName) formIdToListName.set(formId, topName);
      }
    }

    const formIdToListNameFromProfiles = new Map<string, string>();
    if (formIdToProfileIds.size > 0 && listsResult.ok) {
      const MAX_PROFILE_LIST_SAMPLES = 30;
      const profilePairs: Array<{ formId: string; profileId: string }> = [];
      for (const [formId, ids] of formIdToProfileIds.entries()) {
        for (const profileId of ids.values()) {
          profilePairs.push({ formId, profileId });
          if (profilePairs.length >= MAX_PROFILE_LIST_SAMPLES) break;
        }
        if (profilePairs.length >= MAX_PROFILE_LIST_SAMPLES) break;
      }
      const formListCounts = new Map<string, Map<string, number>>();
      for (const pair of profilePairs) {
        const listResult = await fetchJson(
          `${KLAVIYO_API_BASE_URL}/profiles/${pair.profileId}/lists?page[size]=20`,
          headers,
        );
        if (!listResult.ok) continue;
        const listRows = parseBodyRows<GenericRow>(listResult.body);
        for (const listRow of listRows) {
          if (!listRow.id) continue;
          const listName = listIdToName.get(listRow.id) ?? "Lista bez nazwy";
          const bucket = formListCounts.get(pair.formId) ?? new Map<string, number>();
          bucket.set(listName, (bucket.get(listName) ?? 0) + 1);
          formListCounts.set(pair.formId, bucket);
        }
      }
      for (const [formId, counts] of formListCounts.entries()) {
        let topName: string | null = null;
        let topCount = 0;
        for (const [name, count] of counts.entries()) {
          if (count > topCount) {
            topName = name;
            topCount = count;
          }
        }
        if (topName) formIdToListNameFromProfiles.set(formId, topName);
      }
    }

    const topLists = nonEmptyLists
      .map(({ row, count }) => {
        const attrs = row.attributes ?? {};
        return {
          id: row.id ?? "",
          name: readString(attrs.name, attrs.title, "Lista bez nazwy") ?? "Lista bez nazwy",
          count,
          shareOfBase: percent(count, allProfiles),
          optIn: (readString(attrs.opt_in_process, attrs.optInProcess, attrs.opt_in_mode) ?? "unknown").toLowerCase(),
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    const listsWithProfiles = nonEmptyLists
      .map(({ row, count }) => {
        const attrs = row.attributes ?? {};
        return {
          id: row.id ?? "",
          name: readString(attrs.name, attrs.title, "Lista bez nazwy") ?? "Lista bez nazwy",
          count,
        };
      })
      .sort((a, b) => b.count - a.count);

    const topSegments = nonEmptySegments
      .map((row) => {
        const attrs = row.row.attributes ?? {};
        const count = row.count;
        return {
          id: row.row.id ?? "",
          name: readString(attrs.name, attrs.title, "Lista bez nazwy") ?? "Lista bez nazwy",
          count,
          shareOfBase: percent(count, allProfiles),
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    const segmentsWithProfiles = nonEmptySegments
      .map((row) => {
        const attrs = row.row.attributes ?? {};
        return {
          id: row.row.id ?? "",
          name: readString(attrs.name, attrs.title, "Segment bez nazwy") ?? "Segment bez nazwy",
          count: row.count,
        };
      })
      .sort((a, b) => b.count - a.count);
    const topSegmentsMapped = topSegments.map((item) => ({
      ...item,
      name: item.name === "Lista bez nazwy" ? "Segment bez nazwy" : item.name,
    }));

    const metricRows = metricsResult.ok ? parseBodyRows<MetricRow>(metricsResult.body) : [];
    const metricsByName = new Map<string, string>();
    for (const row of metricRows) {
      if (row.id && row.attributes?.name) metricsByName.set(row.attributes.name, row.id);
    }
    const metricIdToName = new Map<string, string>();
    for (const [name, id] of metricsByName.entries()) {
      metricIdToName.set(id, name);
    }

    const resolveMetricId = (...names: string[]) => {
      for (const name of names) {
        const id = metricsByName.get(name);
        if (id) return id;
      }
      return null;
    };

    const receivedMetricId = resolveMetricId("Received Email");
    const bounceMetricId = resolveMetricId("Bounced Email", "Dropped Email");
    const unsubscribeMetricId = resolveMetricId("Unsubscribed");
    const complaintMetricId = resolveMetricId("Marked Email as Spam", "Spam Complaint");
    const openedMetricId = resolveMetricId("Opened Email");
    const clickedMetricId = resolveMetricId("Clicked Email");
    const placedOrderMetricId = resolveMetricId("Placed Order", "Ordered Product");
    const activeOnSiteMetricId = resolveMetricId("Active on Site");
    const emailSubscribedMetricId = resolveMetricId("Email Subscribed");
    const subscribedToListMetricId = resolveMetricId("Subscribed to List", "Subscribed to Email Marketing");

    const parseReportingResults = (body: unknown) => {
      if (!body || typeof body !== "object") return [] as Array<Record<string, unknown>>;
      const data = (body as { data?: unknown }).data;
      if (Array.isArray(data)) {
        const first = data[0] as Record<string, unknown> | undefined;
        const results = readNested(first ?? null, ["attributes", "results"]);
        if (Array.isArray(results)) return results as Array<Record<string, unknown>>;
        return data
          .map((item) => {
            const attrs = (item as Record<string, unknown>)?.attributes as Record<string, unknown> | undefined;
            if (!attrs) return null;
            return {
              groupings: attrs.groupings,
              statistics: attrs.statistics,
            } as Record<string, unknown>;
          })
          .filter((item): item is Record<string, unknown> => Boolean(item));
      }
      return [];
    };

    const fetchCampaignValues = async (timeframeKey: string) => {
      if (!placedOrderMetricId) {
        return { ok: false as const, status: 400, body: null, raw: "missing_metric" };
      }
      const payload = {
        data: {
          type: "campaign-values-report",
          attributes: {
            statistics: [
              "delivered",
              "recipients",
              "opens",
              "open_rate",
              "clicks",
              "click_rate",
              "unsubscribes",
              "unsubscribe_rate",
              "spam_complaints",
              "spam_complaint_rate",
              "bounced_or_failed",
              "bounce_rate",
              "conversion_value",
              "conversion_rate",
              "revenue_per_recipient",
            ],
            timeframe: { key: timeframeKey },
            conversion_metric_id: placedOrderMetricId,
            filter: "equals(send_channel,'email')",
            group_by: ["campaign_id", "send_channel"],
          },
        },
      };
      return fetchReportJson(`${KLAVIYO_API_BASE_URL}/campaign-values-reports`, headers, payload);
    };

    const fetchMetricEvents = async (metricId: string | null, days: number) => {
      if (!metricId) return [] as KlaviyoEventRow[];
      const iso = toIsoDaysAgo(days);
      const encodedMetricId = encodeURIComponent(`"${metricId}"`);
      const filter = `and(equals(metric_id,${encodedMetricId}),greater-than(datetime,${encodeURIComponent(`"${iso}"`)}))`;
      let nextUrl: string | null = `${KLAVIYO_API_BASE_URL}/events?filter=${filter}&sort=-datetime&page[size]=100`;
      let pages = 0;
      const rows: KlaviyoEventRow[] = [];
      while (nextUrl && pages < MAX_EVENT_PAGES) {
        const result = await fetchJson(nextUrl, headers);
        if (!result.ok) break;
        rows.push(...parseBodyRows<KlaviyoEventRow>(result.body));
        nextUrl = nextLinkFromBody(result.body);
        pages += 1;
      }
      return rows;
    };

    const [
      received30,
      bounce30,
      unsub30,
      complaint30,
      received90,
      bounce90,
      unsub90,
      complaint90,
      opened30,
      opened90,
      clicked30,
      clicked90,
      placedOrder90,
      activeOnSite90,
      emailSubscribed90,
      listSubscribe90,
      campaignValues30,
      campaignValues90,
    ] = await Promise.all([
      fetchMetricEvents(receivedMetricId, 30),
      fetchMetricEvents(bounceMetricId, 30),
      fetchMetricEvents(unsubscribeMetricId, 30),
      fetchMetricEvents(complaintMetricId, 30),
      fetchMetricEvents(receivedMetricId, 90),
      fetchMetricEvents(bounceMetricId, 90),
      fetchMetricEvents(unsubscribeMetricId, 90),
      fetchMetricEvents(complaintMetricId, 90),
      fetchMetricEvents(openedMetricId, 30),
      fetchMetricEvents(openedMetricId, 90),
      fetchMetricEvents(clickedMetricId, 30),
      fetchMetricEvents(clickedMetricId, 90),
      fetchMetricEvents(placedOrderMetricId, 90),
      fetchMetricEvents(activeOnSiteMetricId, 90),
      fetchMetricEvents(emailSubscribedMetricId, 90),
      fetchMetricEvents(subscribedToListMetricId, 90),
      fetchCampaignValues("last_30_days"),
      fetchCampaignValues("last_90_days"),
    ]);

    const collectActiveProfileIds = (events: KlaviyoEventRow[], days: number) => {
      const minTimestamp = Date.now() - days * 24 * 60 * 60 * 1000;
      const profileIds = new Set<string>();
      for (const event of events) {
        const datetime = event.attributes?.datetime;
        const timestampMs = datetime ? new Date(datetime).getTime() : NaN;
        if (Number.isNaN(timestampMs) || timestampMs < minTimestamp) continue;
        const profileId = readString(event.relationships?.profile?.data?.id);
        if (profileId) profileIds.add(profileId);
      }
      return profileIds;
    };

    const unionProfileSets = (...sets: Set<string>[]) => {
      const out = new Set<string>();
      for (const set of sets) {
        for (const value of set) out.add(value);
      }
      return out;
    };

    const engaged30Set = unionProfileSets(
      collectActiveProfileIds(clicked90, 30),
      collectActiveProfileIds(placedOrder90, 30),
      collectActiveProfileIds(activeOnSite90, 30),
    );
    const engaged60Set = unionProfileSets(
      collectActiveProfileIds(clicked90, 60),
      collectActiveProfileIds(placedOrder90, 60),
      collectActiveProfileIds(activeOnSite90, 60),
    );
    const engaged90Set = unionProfileSets(
      collectActiveProfileIds(clicked90, 90),
      collectActiveProfileIds(placedOrder90, 90),
      collectActiveProfileIds(activeOnSite90, 90),
    );

    const buildHeatmap = (events: KlaviyoEventRow[]) => {
      const matrix = Array.from({ length: 7 }, () => Array(24).fill(0));
      for (const event of events) {
        const datetime = event.attributes?.datetime;
        if (!datetime) continue;
        const date = new Date(datetime);
        if (Number.isNaN(date.getTime())) continue;
        const dayIndex = date.getDay();
        const hourIndex = date.getHours();
        if (matrix[dayIndex]) {
          matrix[dayIndex][hourIndex] += 1;
        }
      }
      const total = matrix.flat().reduce((acc, value) => acc + value, 0);
      return { matrix, total };
    };

    const pickHeatmapWindow = (events30: KlaviyoEventRow[], events90: KlaviyoEventRow[]) => {
      if (events30.length >= 100) {
        const data = buildHeatmap(events30);
        return { ...data, sampleMode: "30d" as const, sampleSize: events30.length, lowSample: events30.length < 50 };
      }
      if (events90.length > 0) {
        const data = buildHeatmap(events90);
        return { ...data, sampleMode: "90d" as const, sampleSize: events90.length, lowSample: events90.length < 50 };
      }
      return { matrix: Array.from({ length: 7 }, () => Array(24).fill(0)), total: 0, sampleMode: "30d" as const, sampleSize: 0, lowSample: true };
    };

    const openHeatmap = pickHeatmapWindow(opened30, opened90);
    const clickHeatmap = pickHeatmapWindow(clicked30, clicked90);

    const buildCampaignMetrics = (result: { ok: boolean; body: unknown; raw?: string }) => {
      if (!result.ok) return [] as Array<Record<string, unknown>>;
      return parseReportingResults(result.body);
    };

    const mapCampaignValues = (rows: Array<Record<string, unknown>>) => {
      const metricsByCampaign = new Map<string, Record<string, unknown>>();
      rows.forEach((row) => {
        const groupings = (row.groupings ?? row.grouping ?? row.dimension) as Record<string, unknown> | undefined;
        const stats = (row.statistics ?? row.stats ?? row.metric_values) as Record<string, unknown> | undefined;
        if (!groupings || !stats) return;
        const campaignId = readString(
          (groupings as Record<string, unknown>).campaign_id,
          (groupings as Record<string, unknown>).campaignId,
        );
        if (!campaignId) return;
        metricsByCampaign.set(campaignId, stats);
      });
      return metricsByCampaign;
    };

    const campaignMetrics30Rows = buildCampaignMetrics(campaignValues30);
    const campaignMetrics90Rows = buildCampaignMetrics(campaignValues90);
    const campaignMetrics30Map = mapCampaignValues(campaignMetrics30Rows);
    const campaignMetrics90Map = mapCampaignValues(campaignMetrics90Rows);

    const has30Metrics = campaignMetrics30Map.size > 0;
    const has90Metrics = campaignMetrics90Map.size > 0;
    const use90Fallback = !has30Metrics || campaignMetrics30Map.size < 5;
    const selectedCampaignMetrics = use90Fallback ? campaignMetrics90Map : campaignMetrics30Map;
    const campaignMetricsStatus =
      selectedCampaignMetrics.size > 0
        ? "ok"
        : campaignValues30.ok || campaignValues90.ok
          ? "no_history"
          : "unavailable";
    const campaignMetricsSampleMode = use90Fallback ? "90d" : "30d";

    const perCampaignMetrics = campaignCatalog.map((campaign) => {
      const stats = selectedCampaignMetrics.get(campaign.id) ?? null;
      return {
        campaignId: campaign.id,
        statistics: stats,
      };
    });

    const activityBuckets =
      engaged90Set.size > 0
        ? {
            active30: engaged30Set.size,
            active60: engaged60Set.size,
            active90: engaged90Set.size,
            inactive90plus: Math.max(0, profilesWithEmailIds.size - engaged90Set.size),
            inactive180plus: fallbackActivityBuckets.inactive180plus,
            inactive365plus: fallbackActivityBuckets.inactive365plus,
          }
        : fallbackActivityBuckets;

    const splitBounce = (events: KlaviyoEventRow[]) => {
      let hard = 0;
      let soft = 0;
      for (const event of events) {
        const props = event.attributes?.event_properties ?? {};
        const bounceType = (readString(props.type, props.bounce_type, props.reason) ?? "").toLowerCase();
        if (bounceType.includes("hard")) hard += 1;
        else if (bounceType.includes("soft")) soft += 1;
      }
      return { hard, soft };
    };

    const bounce30Split = splitBounce(bounce30);
    const bounce90Split = splitBounce(bounce90);

    const aggregateCampaignRisk = (received: KlaviyoEventRow[], bounce: KlaviyoEventRow[], unsub: KlaviyoEventRow[], spam: KlaviyoEventRow[]) => {
      const bag = new Map<string, { sent: number; bounce: number; unsub: number; spam: number }>();
      const mark = (rows: KlaviyoEventRow[], field: keyof { sent: number; bounce: number; unsub: number; spam: number }) => {
        for (const event of rows) {
          const props = event.attributes?.event_properties ?? {};
          const propsWithMessage = props as Record<string, unknown> & { $message?: unknown };
          const key =
            readString(propsWithMessage.$message, props.message, props.campaign_name, props.CampaignName, "Unknown campaign") ??
            "Unknown campaign";
          const row = bag.get(key) ?? { sent: 0, bounce: 0, unsub: 0, spam: 0 };
          row[field] += 1;
          bag.set(key, row);
        }
      };
      mark(received, "sent");
      mark(bounce, "bounce");
      mark(unsub, "unsub");
      mark(spam, "spam");
      return Array.from(bag.entries())
        .map(([name, row]) => {
          const base = Math.max(row.sent, 1);
          const bounceRate = (row.bounce / base) * 100;
          const complaintRate = (row.spam / base) * 100;
          const unsubscribeRate = (row.unsub / base) * 100;
          const riskScore = complaintRate * 5 + bounceRate * 2 + unsubscribeRate;
          return {
            campaign: name,
            sent: row.sent,
            bounceRate: Number(bounceRate.toFixed(2)),
            complaintRate: Number(complaintRate.toFixed(2)),
            unsubscribeRate: Number(unsubscribeRate.toFixed(2)),
            riskScore: Number(riskScore.toFixed(2)),
          };
        })
        .filter((item) => item.sent > 0)
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 3);
    };

    const outliers = aggregateCampaignRisk(received90, bounce90, unsub90, complaint90);

    const rate = (num: number, den: number) => Number(((den > 0 ? num / den : 0) * 100).toFixed(2));
    const deliverability = {
      days30: {
        sent: received30.length,
        bounceRate: rate(bounce30.length, received30.length),
        hardBounceRate: rate(bounce30Split.hard, received30.length),
        softBounceRate: rate(bounce30Split.soft, received30.length),
        complaintRate: rate(complaint30.length, received30.length),
        unsubscribeRate: rate(unsub30.length, received30.length),
      },
      days90: {
        sent: received90.length,
        bounceRate: rate(bounce90.length, received90.length),
        hardBounceRate: rate(bounce90Split.hard, received90.length),
        softBounceRate: rate(bounce90Split.soft, received90.length),
        complaintRate: rate(complaint90.length, received90.length),
        unsubscribeRate: rate(unsub90.length, received90.length),
      },
    };

    const sourceDistribution = Array.from(sourceMap.entries())
      .map(([source, count]) => ({
        source,
        count,
        share: percent(count, profilesWithEmail.length),
        risk:
          source === "CSV/import" || source === "Migracja ESP"
            ? "high"
            : source === "Lead ads/integracje"
              ? "medium"
              : "low",
      }))
      .sort((a, b) => b.count - a.count);

    const formRows = formsResult.ok ? parseBodyRows<GenericRow>(formsResult.body) : [];
    const formsByContext = new Map<string, number>();
    const formItems = formRows.map((row) => {
      const attrs = row.attributes ?? {};
      const name = readString(attrs.name, attrs.title, attrs.label, "Form without name") ?? "Form without name";
      const status = (readString(attrs.status, attrs.form_status, attrs.state) ?? "unknown").toLowerCase();
      const context = inferFormContext(name);
      const views = readNumber(attrs.views, attrs.view_count, attrs.display_count, attrs.impressions) ?? 0;
      const submissions = readNumber(
        attrs.submissions,
        attrs.submit_count,
        attrs.conversions,
        attrs.conversion_count,
      ) ?? 0;
      const conversionRate = Number(
        (
          readNumber(attrs.conversion_rate, attrs.submit_rate, attrs.conversionRate) ??
          (views > 0 ? (submissions / views) * 100 : 0)
        ).toFixed(2),
      );
      const offer = readString(
        attrs.offer_type,
        attrs.offer,
        attrs.incentive,
        attrs.discount,
        attrs.message,
      );
      const popupType = readString(attrs.trigger_type, attrs.type, attrs.display_type, attrs.layout_type);
      const updatedAt = readString(attrs.updated, attrs.updated_at, attrs.last_updated_at, attrs.created);
      const deviceVariant = readString(attrs.device_targeting, attrs.device, attrs.platform, attrs.channel);
      const listHint = readString(
        attrs.list_id,
        attrs.listId,
        attrs.target_list_id,
        attrs.targetListId,
      );
      formsByContext.set(context, (formsByContext.get(context) ?? 0) + 1);
      return {
        id: row.id ?? "",
        name,
        status,
        context,
        views,
        submissions,
        conversionRate,
        offer: offer ?? "Brak danych",
        popupType: popupType ?? "Brak danych",
        updatedAt: updatedAt ?? "Brak danych",
        deviceVariant: deviceVariant ?? "Brak danych",
        listHint: listHint ?? "",
        rawAttributes: attrs,
      };
    });
    const activeForms = formItems.filter(
      (form) => !["archived", "disabled", "inactive", "deleted"].includes(form.status),
    );
    const detailedForms = await Promise.all(
      activeForms.map(async (form) => {
        if (!form.id) return form;
        const detailResult = await fetchJson(`${KLAVIYO_API_BASE_URL}/forms/${form.id}?include=lists`, headers);
        if (!detailResult.ok) return form;
        const detailBody = detailResult.body as { data?: GenericRow } | null;
        const detailAttrs = detailBody?.data?.attributes ?? null;
        const detailRels = detailBody?.data && typeof detailBody.data === "object"
          ? (detailBody.data as Record<string, unknown>).relationships ?? null
          : null;
        return {
          ...form,
          rawAttributes: detailAttrs && typeof detailAttrs === "object" ? detailAttrs : form.rawAttributes,
          rawRelationships: detailRels && typeof detailRels === "object" ? detailRels : undefined,
        };
      }),
    );

    const extractListIdFromFormRaw = (raw: Record<string, unknown> | null, relationships?: Record<string, unknown>) =>
      readString(
        readNested(relationships ?? null, ["list", "data", "id"]),
        readNested(relationships ?? null, ["lists", "data", "0", "id"]),
        readNested(raw, ["relationships", "list", "data", "id"]),
        readNested(raw, ["relationships", "lists", "data", "0", "id"]),
        readNested(raw, ["attributes", "list_id"]),
        readNested(raw, ["attributes", "target_list_id"]),
        readNested(raw, ["attributes", "listId"]),
      );
    const fetchFormListRelationship = async (formId: string | null) => {
      if (!formId) return null;
      const endpoints = [
        `${KLAVIYO_API_BASE_URL}/forms/${formId}/relationships/list`,
        `${KLAVIYO_API_BASE_URL}/forms/${formId}/relationships/lists`,
        `${KLAVIYO_API_BASE_URL}/forms/${formId}/list`,
        `${KLAVIYO_API_BASE_URL}/forms/${formId}/lists`,
      ];
      for (const url of endpoints) {
        const rel = await fetchJson(url, headers);
        if (!rel.ok) continue;
        const data = (rel.body as { data?: unknown } | null)?.data;
        const first =
          Array.isArray(data) ? (data.length > 0 ? data[0] : null) : (data as Record<string, unknown> | null);
        const listId = readString((first as Record<string, unknown> | null)?.id);
        if (listId) return listId;
      }
      return null;
    };
    const formIdToRelationshipListId = new Map<string, string>();
    for (const form of detailedForms) {
      if (!form.id) continue;
      const rawListId = extractListIdFromFormRaw(
        form.rawAttributes ?? null,
        (form as Record<string, unknown>).rawRelationships as Record<string, unknown> | undefined,
      );
      if (rawListId) {
        formIdToRelationshipListId.set(form.id, rawListId);
        continue;
      }
      const relListId = await fetchFormListRelationship(form.id);
      if (relListId) formIdToRelationshipListId.set(form.id, relListId);
    }
    const listOptInSet = new Set(
      topLists.map((item) => item.optIn).filter((value) => value && value !== "unknown"),
    );
    const singleOptInValue = listOptInSet.size === 1 ? Array.from(listOptInSet)[0] ?? null : null;
    const optInMode =
      listOptInSet.size === 0
        ? "unknown"
        : singleOptInValue
          ? singleOptInValue.includes("double")
            ? "double_opt_in"
            : "single_opt_in"
          : "mixed";
    const consentClarity =
      ambiguousMarketingConsentCount > 0
        ? "ambiguous"
        : consentVerifiedCount > 0
          ? "clear"
          : "unknown";
    const signupSegmentationQuality =
      sourceDistribution.length >= 2 || topLists.length >= 2 ? "good" : "basic";

    const parseFormDetails = (form: typeof detailedForms[number]) => {
      const attrs = readObject(form.rawAttributes) ?? {};
      const rawFallback = form.rawAttributes ?? {};
      const triggerMode = readString(
        attrs.trigger,
        attrs.trigger_type,
        attrs.display_trigger,
        readNested(attrs, ["behavior", "display", "trigger"]),
        readNested(attrs, ["display", "trigger"]),
        readNested(attrs, ["timing", "show"]),
        findByKeyPatterns(rawFallback, [/trigger/i, /show_form/i, /display_trigger/i]),
      );
      const delaySeconds = readNumber(
        attrs.delay_seconds,
        attrs.show_after_seconds,
        readNested(attrs, ["behavior", "display", "delay_seconds"]),
        readNested(attrs, ["display", "delay_seconds"]),
        readNested(attrs, ["timing", "delay_seconds"]),
        findByKeyPatterns(rawFallback, [/delay/i, /after_seconds/i, /show_after/i]),
      );
      const scrollPercent = readNumber(
        attrs.scroll_percentage,
        attrs.scroll_percent,
        readNested(attrs, ["behavior", "display", "scroll_percentage"]),
        readNested(attrs, ["display", "scroll_percentage"]),
        readNested(attrs, ["timing", "scroll_percentage"]),
        findByKeyPatterns(rawFallback, [/scroll/i, /scroll_percentage/i, /scroll_percent/i]),
      );
      const exitIntent = readBoolean(
        attrs.exit_intent,
        attrs.show_on_exit_intent,
        readNested(attrs, ["behavior", "display", "exit_intent"]),
        readNested(attrs, ["display", "exit_intent"]),
        findByKeyPatterns(rawFallback, [/exit/i, /mouseleave/i]),
      );
      const showAgainDays = readNumber(
        attrs.show_again_days,
        attrs.cooldown_days,
        readNested(attrs, ["behavior", "display", "show_again_days"]),
        readNested(attrs, ["display", "show_again_days"]),
        findByKeyPatterns(rawFallback, [/cooldown/i, /show_again/i, /resurface/i]),
      );
      const hideAfterSubmit = readBoolean(
        attrs.hide_after_submit,
        attrs.stop_showing_after_submit,
        readNested(attrs, ["behavior", "display", "hide_after_submit"]),
        readNested(attrs, ["display", "hide_after_submit"]),
        findByKeyPatterns(rawFallback, [/hide_after/i, /stop_show/i, /dont_show/i]),
      );
      const teaserEnabled = readBoolean(
        attrs.teaser_enabled,
        readNested(attrs, ["teaser", "enabled"]),
        readNested(attrs, ["teaser", "is_enabled"]),
        findByKeyPatterns(rawFallback, [/teaser/i]),
      );
      const stepsValue =
        readNested(attrs, ["steps"]) ??
        readNested(attrs, ["form_steps"]) ??
        readNested(attrs, ["pages"]) ??
        null;
      const stepsArrayCount = Array.isArray(stepsValue) ? stepsValue.length : null;
      const stepsCount = readNumber(
        attrs.steps_count,
        attrs.step_count,
        readNested(attrs, ["steps", "length"]),
        readNested(attrs, ["form_steps", "length"]),
        stepsArrayCount,
      );
      const hasAbTest = readBoolean(
        attrs.has_ab_test,
        attrs.ab_test,
        readNested(attrs, ["ab_test", "enabled"]),
        findByKeyPatterns(rawFallback, [/ab_test/i, /split/i]),
      );
      const targetRules = readObject(readNested(attrs, ["targeting", "rules"]));
      const targetCount = Array.isArray(targetRules) ? targetRules.length : 0;
      const targetingSummary = targetCount > 0 ? `Ma ${targetCount} reguly targetingu` : "Brak specjalnego targetingu";
      const deviceTargeting = readString(
        attrs.device_targeting,
        attrs.device,
        attrs.platform,
        readNested(attrs, ["display", "device"]),
        readNested(attrs, ["behavior", "display", "device"]),
        findByKeyPatterns(rawFallback, [/device/i, /platform/i]),
      );
      const showOnMobile = readBoolean(
        attrs.show_on_mobile,
        readNested(attrs, ["display", "show_on_mobile"]),
        readNested(attrs, ["behavior", "display", "show_on_mobile"]),
        findByKeyPatterns(rawFallback, [/mobile/i]),
      );
      const showOnDesktop = readBoolean(
        attrs.show_on_desktop,
        readNested(attrs, ["display", "show_on_desktop"]),
        readNested(attrs, ["behavior", "display", "show_on_desktop"]),
        findByKeyPatterns(rawFallback, [/desktop/i]),
      );
      const offerText = readString(
        attrs.offer_type,
        attrs.offer,
        attrs.incentive,
        attrs.discount_text,
        attrs.coupon_code,
        attrs.headline,
        attrs.message,
        findByKeyPatterns(rawFallback, [/offer/i, /discount/i, /coupon/i, /rabat/i, /headline/i]),
      );
      const formType = readString(
        attrs.form_type,
        attrs.type,
        attrs.layout_type,
        attrs.display_type,
        attrs.popup_type,
        findByKeyPatterns(rawFallback, [/layout/i, /display_type/i, /popup/i, /flyout/i, /fullscreen/i]),
      );
      const lastUpdated = readString(
        attrs.updated_at,
        attrs.updated,
        attrs.last_updated_at,
        attrs.modified_at,
        attrs.created,
        findByKeyPatterns(rawFallback, [/updated/i, /modified/i, /created/i]),
      );

      return {
        triggerMode: triggerMode ?? "Brak danych",
        delaySeconds: delaySeconds ?? null,
        scrollPercent: scrollPercent ?? null,
        exitIntent: exitIntent ?? null,
        showAgainDays: showAgainDays ?? null,
        hideAfterSubmit: hideAfterSubmit ?? null,
        teaserEnabled: teaserEnabled ?? null,
        stepsCount: stepsCount ?? null,
        hasAbTest: hasAbTest ?? null,
        targetingSummary,
        deviceTargeting: deviceTargeting ?? "Brak danych",
        showOnMobile: showOnMobile ?? null,
        showOnDesktop: showOnDesktop ?? null,
        offerText: offerText ?? "Brak danych",
        formType: formType ?? "Brak danych",
        lastUpdated: lastUpdated ?? "Brak danych",
      };
    };
    const klaviyoFormProfileIds = new Set<string>();
    for (const account of verifiedAccounts) {
      if (account.id && account.source === "Klaviyo forms") klaviyoFormProfileIds.add(account.id);
    }
    for (const account of notVerifiedAccounts) {
      if (account.id && account.source === "Klaviyo forms") klaviyoFormProfileIds.add(account.id);
    }
    const purchaseFromForms90 = placedOrder90.filter((event) => {
      const profileId = readString(event.relationships?.profile?.data?.id);
      return Boolean(profileId && klaviyoFormProfileIds.has(profileId));
    });
    const purchaseRevenueFromForms90 = purchaseFromForms90.reduce((sum, event) => {
      const props = event.attributes?.event_properties ?? {};
      const value = readNumber(
        props.$value,
        props.value,
        props.Value,
        props.revenue,
        props.Revenue,
        props.total,
      );
      return sum + (value ?? 0);
    }, 0);
    const monthlyRevenueFromForms = Number((purchaseRevenueFromForms90 / 3).toFixed(2));

    const purchaseFromForms30 = purchaseFromForms90.filter((event) => {
      const dt = readString(event.attributes?.datetime);
      if (!dt) return false;
      return new Date(dt).getTime() >= Date.now() - 30 * 24 * 60 * 60 * 1000;
    });
    let signupCount30 = 0;
    let purchaseRateFromSignup = 0;

    const timeZone = "Europe/Warsaw";
    const tzFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
    });
    const getTzParts = (dt: Date) => {
      const parts = tzFormatter.formatToParts(dt);
      const map = new Map(parts.map((part) => [part.type, part.value]));
      const year = map.get("year") ?? "0000";
      const month = map.get("month") ?? "00";
      const day = map.get("day") ?? "00";
      const hourRaw = map.get("hour") ?? "00";
      const hour = Number(hourRaw);
      return {
        dateKey: `${year}-${month}-${day}`,
        hour: Number.isFinite(hour) ? hour : 0,
      };
    };

    const dailyMap = new Map<string, number>();
    const dailyKeys: string[] = [];
    for (let i = 29; i >= 0; i -= 1) {
      const dt = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = getTzParts(dt).dateKey;
      if (!dailyMap.has(key)) {
        dailyMap.set(key, 0);
        dailyKeys.push(key);
      }
    }
    const formDailyBuckets = new Map<string, Map<string, number>>();
    const formSignupCounts = new Map<string, number>();
    const formSignupProfileIds = new Map<string, Set<string>>();
    const formListIdCounts = new Map<string, Map<string, number>>();
    const formListNameCounts = new Map<string, Map<string, number>>();
    const formListIdCountsFromSubscribe = new Map<string, Map<string, number>>();
    const formEventSamples = new Map<string, Array<Record<string, unknown>>>();

    const formNameToId = new Map<string, string>();
    detailedForms.forEach((form) => {
      if (!form.id || !form.name) return;
      formNameToId.set(form.name.trim().toLowerCase(), form.id);
    });
    const readMeta = (props?: Record<string, unknown> | null) =>
      readObject(
        props?.metaData ??
          props?.metadata ??
          props?.meta_data ??
          props?.meta ??
          (props?.data && typeof props?.data === "object" ? (props?.data as Record<string, unknown>).metaData : null),
      );
    const extractFormIdFromPayload = (
      props: Record<string, unknown>,
      altProps: Record<string, unknown>,
      meta: Record<string, unknown> | null,
    ) => {
      const direct = readString(
        props.form_id,
        props.formId,
        props.formID,
        props.$form_id,
        props.$formId,
        props.$formID,
        props.signup_form_id,
        props.consent_form_id,
        props.$consent_form_id,
        altProps.form_id,
        altProps.formId,
        altProps.formID,
        altProps.$form_id,
        altProps.$formId,
        altProps.$formID,
        altProps.signup_form_id,
        altProps.consent_form_id,
        altProps.$consent_form_id,
        meta ? meta.form_id : null,
        meta ? meta.formId : null,
        meta ? meta.formID : null,
        meta ? meta.$form_id : null,
        meta ? meta.$formId : null,
        meta ? meta.$formID : null,
      );
      if (direct) return direct;
      return (
        findStringByKeyPatterns(props, [/form[_-]?id/i, /\bformid\b/i, /consent_form_id/i]) ??
        findStringByKeyPatterns(altProps, [/form[_-]?id/i, /\bformid\b/i, /consent_form_id/i]) ??
        (meta ? findStringByKeyPatterns(meta, [/form[_-]?id/i, /\bformid\b/i, /consent_form_id/i]) : null)
      );
    };
    const extractFormId = (event: KlaviyoEventRow) => {
      const props = (event.attributes?.event_properties as Record<string, unknown> | undefined) ?? {};
      const altProps = (event.attributes?.properties as Record<string, unknown> | undefined) ?? {};
      const meta = readMeta(props) ?? readMeta(altProps);
      const fromId = readString(
        extractFormIdFromPayload(props, altProps, meta),
        event.relationships?.form?.data?.id,
      );
      if (fromId) return fromId;
      const fromName = readString(
        props.form_name,
        props.formName,
        props.form_title,
        props.formTitle,
        props.form,
        props.popup_name,
        props.popup,
        altProps.form_name,
        altProps.formTitle,
        meta ? (meta as Record<string, unknown>).form_name : null,
        meta ? (meta as Record<string, unknown>).formName : null,
        meta ? (meta as Record<string, unknown>).formTitle : null,
        meta ? (meta as Record<string, unknown>).form : null,
      );
      if (!fromName) return null;
      const fromMap = formNameToId.get(fromName.trim().toLowerCase()) ?? null;
      if (fromMap) return fromMap;
      const profileId = readString(event.relationships?.profile?.data?.id);
      if (profileId && profileIdToFormId.has(profileId)) {
        return profileIdToFormId.get(profileId) ?? null;
      }
      return null;
    };
    const extractListId = (event: KlaviyoEventRow) =>
      (() => {
        const props = (event.attributes?.event_properties as Record<string, unknown> | undefined) ?? {};
        const altProps = (event.attributes?.properties as Record<string, unknown> | undefined) ?? {};
        const meta = readMeta(props) ?? readMeta(altProps);
        return readString(
          props.list_id,
          props.$list_id,
          props.$listId,
          props.listId,
          props.list,
          altProps.list_id,
          altProps.$list_id,
          altProps.$listId,
          altProps.listId,
          altProps.list,
          meta ? (meta as Record<string, unknown>).g : null,
          meta ? (meta as Record<string, unknown>).list_id : null,
          meta ? (meta as Record<string, unknown>).listId : null,
          ((event.relationships as Record<string, unknown> | undefined)?.list as Record<string, unknown> | undefined)?.data
            ? ((event.relationships as Record<string, unknown> | undefined)?.list as { data: { id: string } })?.data?.id
            : null,
        );
      })();
    const extractListName = (event: KlaviyoEventRow) =>
      (() => {
        const props = (event.attributes?.event_properties as Record<string, unknown> | undefined) ?? {};
        const altProps = (event.attributes?.properties as Record<string, unknown> | undefined) ?? {};
        const meta = readMeta(props) ?? readMeta(altProps);
        return readString(
          props.list_name,
          props.$list_name,
          props.list,
          altProps.list_name,
          altProps.list,
          meta ? (meta as Record<string, unknown>).list_name : null,
          meta ? (meta as Record<string, unknown>).listName : null,
          meta ? (meta as Record<string, unknown>).list : null,
        );
      })();

    for (const event of listSubscribe90) {
      const formId = extractFormId(event);
      const listId = extractListId(event);
      if (!formId || !listId) continue;
      const bucket = formListIdCountsFromSubscribe.get(formId) ?? new Map<string, number>();
      bucket.set(listId, (bucket.get(listId) ?? 0) + 1);
      formListIdCountsFromSubscribe.set(formId, bucket);
    }

    const mergeEvents = (...groups: KlaviyoEventRow[][]) => {
      const seen = new Set<string>();
      const merged: KlaviyoEventRow[] = [];
      for (const group of groups) {
        for (const event of group) {
          const id = readString(event.id);
          const profileId = readString(event.relationships?.profile?.data?.id) ?? "";
          const datetime = readString(event.attributes?.datetime) ?? "";
          const key = id ?? `${profileId}|${datetime}`;
          if (!key || seen.has(key)) continue;
          seen.add(key);
          merged.push(event);
        }
      }
      return merged;
    };
    const formActivityEvents = mergeEvents(emailSubscribed90, listSubscribe90);
    const formEventKeyStats = new Map<string, Map<string, number>>();
    const formEventSampleCount = new Map<string, number>();
    const formActivity30 = formActivityEvents.filter((event) => {
      const ts = readEventTimeMs(event);
      if (!ts) return false;
      return ts >= Date.now() - 30 * 24 * 60 * 60 * 1000;
    });
    const missingProfileIds = new Set<string>();
    const quickExtractFormId = (event: KlaviyoEventRow) => {
      const props = (event.attributes?.event_properties as Record<string, unknown> | undefined) ?? {};
      const altProps = (event.attributes?.properties as Record<string, unknown> | undefined) ?? {};
      const meta = readMeta(props) ?? readMeta(altProps);
      return readString(
        extractFormIdFromPayload(props, altProps, meta),
        event.relationships?.form?.data?.id,
      );
    };
    for (const event of formActivity30) {
      const directFormId = quickExtractFormId(event);
      if (directFormId) continue;
      const profileId = readString(event.relationships?.profile?.data?.id);
      if (profileId && !profileIdToFormId.has(profileId)) missingProfileIds.add(profileId);
      if (missingProfileIds.size >= 60) break;
    }
    for (const profileId of missingProfileIds) {
      const profileResult = await fetchJson(
        `${KLAVIYO_API_BASE_URL}/profiles/${profileId}?additional-fields[profile]=subscriptions`,
        headers,
      );
      if (!profileResult.ok) continue;
      const profile = (profileResult.body as { data?: GenericRow } | null)?.data ?? null;
      const attrs = profile?.attributes ?? null;
      if (!attrs || typeof attrs !== "object") continue;
      const consentFormId = extractFormIdFromProfileAttrs(attrs as Record<string, unknown>);
      if (consentFormId) profileIdToFormId.set(profileId, consentFormId);
    }
    signupCount30 = formActivity30.length;
    purchaseRateFromSignup =
      signupCount30 > 0
        ? Number(((purchaseFromForms30.length / signupCount30) * 100).toFixed(2))
        : 0;

    for (const event of formActivity30) {
      const ts = readEventTimeMs(event);
      if (!ts) continue;
      const tzParts = getTzParts(new Date(ts));
      dailyMap.set(tzParts.dateKey, (dailyMap.get(tzParts.dateKey) ?? 0) + 1);

      const formId = extractFormId(event);
      if (formId) {
        const props = (event.attributes?.event_properties as Record<string, unknown> | undefined) ?? {};
        const altProps = (event.attributes?.properties as Record<string, unknown> | undefined) ?? {};
        const meta = readMeta(props) ?? readMeta(altProps);
        const sampleBucket = formEventSamples.get(formId) ?? [];
        if (sampleBucket.length < 3) {
          const pickFrom = (obj: Record<string, unknown> | null | undefined, keys: string[]) => {
            if (!obj) return {};
            const out: Record<string, unknown> = {};
            keys.forEach((key) => {
              if (key in obj) out[key] = obj[key];
            });
            return out;
          };
          const keyList = [
            "form_id",
            "formId",
            "formID",
            "$form_id",
            "$formId",
            "$formID",
            "consent_form_id",
            "$consent_form_id",
            "list_id",
            "listId",
            "$list_id",
            "list",
            "list_name",
            "listName",
          ];
          const metricId = readString(
            (event.attributes as Record<string, unknown> | undefined)?.metric_id,
            (event.attributes as Record<string, unknown> | undefined)?.metricId,
            (event.attributes as Record<string, unknown> | undefined)?.metric,
          );
          sampleBucket.push({
            id: event.id ?? null,
            datetime: readString(event.attributes?.datetime) ?? null,
            metric: metricId ? metricIdToName.get(metricId) ?? metricId : null,
            formId,
            listId: extractListId(event),
            props: pickFrom(props, keyList),
            meta: pickFrom(meta as Record<string, unknown> | null, keyList),
            keys: Object.keys(props).slice(0, 24),
            metaKeys: meta && typeof meta === "object" ? Object.keys(meta as Record<string, unknown>).slice(0, 24) : [],
          });
          formEventSamples.set(formId, sampleBucket);
        }
        if ((formEventSampleCount.get(formId) ?? 0) < 30) {
          const keyCounts = formEventKeyStats.get(formId) ?? new Map<string, number>();
          Object.keys(props).forEach((key) => {
            keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1);
          });
          if (meta && typeof meta === "object") {
            Object.keys(meta as Record<string, unknown>).forEach((key) => {
              const fullKey = `meta.${key}`;
              keyCounts.set(fullKey, (keyCounts.get(fullKey) ?? 0) + 1);
            });
          }
          formEventKeyStats.set(formId, keyCounts);
          formEventSampleCount.set(formId, (formEventSampleCount.get(formId) ?? 0) + 1);
        }
        formSignupCounts.set(formId, (formSignupCounts.get(formId) ?? 0) + 1);
        const profileId = readString(event.relationships?.profile?.data?.id);
        if (profileId) {
          const bag = formSignupProfileIds.get(formId) ?? new Set<string>();
          bag.add(profileId);
          formSignupProfileIds.set(formId, bag);
        }
        const listId = extractListId(event);
        if (listId) {
          const bag = formListIdCounts.get(formId) ?? new Map<string, number>();
          bag.set(listId, (bag.get(listId) ?? 0) + 1);
          formListIdCounts.set(formId, bag);
        }
        const listName = extractListName(event);
        if (listName) {
          const bag = formListNameCounts.get(formId) ?? new Map<string, number>();
          bag.set(listName, (bag.get(listName) ?? 0) + 1);
          formListNameCounts.set(formId, bag);
        }
        const fd = formDailyBuckets.get(formId) ?? new Map<string, number>();
        fd.set(tzParts.dateKey, (fd.get(tzParts.dateKey) ?? 0) + 1);
        formDailyBuckets.set(formId, fd);
      }
    }

    const formPurchaseCounts = new Map<string, number>();
    const formRevenueTotals = new Map<string, number>();
    for (const event of purchaseFromForms30) {
      const profileId = readString(event.relationships?.profile?.data?.id);
      if (!profileId) continue;
      for (const [formId, profiles] of formSignupProfileIds.entries()) {
        if (!profiles.has(profileId)) continue;
        formPurchaseCounts.set(formId, (formPurchaseCounts.get(formId) ?? 0) + 1);
        const props = event.attributes?.event_properties ?? {};
        const value = readNumber(
          props.$value,
          props.value,
          props.Value,
          props.revenue,
          props.Revenue,
          props.total,
        );
        formRevenueTotals.set(formId, (formRevenueTotals.get(formId) ?? 0) + (value ?? 0));
      }
    }

    let storeDomain: string | null = null;
    if (activeClientId) {
      const latestSync = await db.auditLog.findFirst({
        where: {
          eventName: "client.sync.saved",
          entityType: "client_sync",
          entityId: activeClientId,
        },
        orderBy: { createdAt: "desc" },
        select: { details: true },
      });
      const details =
        latestSync?.details && typeof latestSync.details === "object"
          ? (latestSync.details as Record<string, unknown>)
          : null;
      storeDomain = readString(details?.storeDomain, details?.shopifyStoreDomain);
    }
    const storeFormScan = await scanStoreForms(storeDomain);

    const formOverridesById = new Map<string, Record<string, unknown>>();
    if (activeClientId) {
      const overrides = await db.auditLog.findMany({
        where: {
          eventName: "client.forms.override",
          entityType: "klaviyo_form_override",
          entityId: { startsWith: `${activeClientId}::` },
        },
        orderBy: { createdAt: "desc" },
        select: { details: true },
      });
      for (const entry of overrides) {
        const details =
          entry.details && typeof entry.details === "object"
            ? (entry.details as Record<string, unknown>)
            : null;
        const formId = readString(details?.formId);
        if (!formId || formOverridesById.has(formId)) continue;
        const data =
          details?.data && typeof details.data === "object"
            ? (details.data as Record<string, unknown>)
            : {};
        formOverridesById.set(formId, data);
      }
    }

    const flowOverridesById = new Map<string, Record<string, unknown>>();
    if (activeClientId) {
      const overrides = await db.auditLog.findMany({
        where: {
          eventName: "client.flows.override",
          entityType: "klaviyo_flow_override",
          entityId: { startsWith: `${activeClientId}::` },
        },
        orderBy: { createdAt: "desc" },
        select: { details: true },
      });
      for (const entry of overrides) {
        const details =
          entry.details && typeof entry.details === "object"
            ? (entry.details as Record<string, unknown>)
            : null;
        const flowId = readString(details?.flowId);
        if (!flowId || flowOverridesById.has(flowId)) continue;
        const data =
          details?.data && typeof details.data === "object"
            ? (details.data as Record<string, unknown>)
            : {};
        flowOverridesById.set(flowId, data);
      }
    }
    const campaignOverridesById = new Map<string, Record<string, unknown>>();
    if (activeClientId) {
      const overrides = await db.auditLog.findMany({
        where: {
          eventName: "client.campaigns.override",
          entityType: "klaviyo_campaign_override",
          entityId: { startsWith: `${activeClientId}::` },
        },
        orderBy: { createdAt: "desc" },
        select: { details: true },
      });
      for (const entry of overrides) {
        const details =
          entry.details && typeof entry.details === "object"
            ? (entry.details as Record<string, unknown>)
            : null;
        const campaignId = readString(details?.campaignId);
        if (!campaignId || campaignOverridesById.has(campaignId)) continue;
        const data =
          details?.data && typeof details.data === "object"
            ? (details.data as Record<string, unknown>)
            : {};
        campaignOverridesById.set(campaignId, data);
      }
    }
    const popupTimingNote = storeFormScan.popupDelaySeconds
      ? `Popup pojawia sie po ok. ${storeFormScan.popupDelaySeconds.toFixed(1)} s.`
      : storeFormScan.hasExitIntentSignals || storeFormScan.hasScrollTriggerSignals
        ? "Popup ma trigger behawioralny (scroll/exit intent), bez stalego timera."
        : "Brak pewnych danych o czasie wyswietlenia popupu.";

    const hasSunsetSegment = segmentRows.some((row) => {
      const name = (readString(row.attributes?.name, row.attributes?.title) ?? "").toLowerCase();
      return name.includes("sunset") || name.includes("unengaged") || name.includes("winback") || name.includes("re-engage");
    });
    const inactive90Share = percent(activityBuckets.inactive90plus, profilesWithEmail.length);
    const inactive90ProfileSet = new Set(
      [...profilesWithEmailIds].filter((profileId) => !engaged90Set.has(profileId)),
    );
    const receivedProfiles90 = received90
      .map((event) => readString(event.relationships?.profile?.data?.id))
      .filter((value): value is string => Boolean(value));
    const inactiveDeliveries = receivedProfiles90.filter((profileId) => inactive90ProfileSet.has(profileId)).length;
    const campaignsToInactivePercent =
      receivedProfiles90.length > 0
        ? Number(((inactiveDeliveries / receivedProfiles90.length) * 100).toFixed(1))
        : inactive90Share;
    const campaignsToInactiveEstimate =
      campaignsToInactivePercent >= 30 ? "high" : campaignsToInactivePercent >= 15 ? "medium" : "low";

    const insights: string[] = [];
    if (deliverability.days30.complaintRate > 0.08) {
      insights.push("Complaint rate 30d przekracza 0.08% - ryzyko reputacyjne.");
    }
    if (deliverability.days30.bounceRate > 1) {
      insights.push("Bounce rate 30d przekracza 1% - wymagana higiena listy.");
    }
    if (activityBuckets.inactive180plus > activityBuckets.active90) {
      insights.push("Baza ma wiecej nieaktywnych 180+ niz aktywnych 90d.");
    }
    if (engaged90Set.size > 0) {
      insights.push("Aktywnosc liczona glownie na sygnalach odpornych na Apple MPP: click, placed order, active on site.");
    }
    if (!metricsResult.ok) {
      insights.push("Nie pobrano metryk Klaviyo, dlatego czesc wskaznikow deliverability wymaga recznej weryfikacji.");
    }
    if (!hasSunsetSegment) {
      insights.push("Brak widocznej polityki sunset/re-engagement w segmentach.");
    }
    if (insights.length === 0) {
      insights.push("Nie wykryto krytycznych sygnalow, ale utrzymuj regularny monitoring 30/90 dni.");
    }

    const actions = [
      "Kampanie glownie do Active 60d; Active 61-90d tylko 1-2 wysylki/miesiac; Inactive 90+ tylko re-engagement.",
      "Jesli complaint rate > 0.08% lub bounce > 1.2%: ogranicz zasieg i wytnij segmenty o niskim intent.",
      "Wdrozyc sunset policy: stop kampanii po 180 dniach braku klikniecia/zakupu, potem re-permission.",
      "Dla zrodel CSV/import uruchomic etapowe czyszczenie i wysylke warm-up (mniejsze batch-e).",
      "Monitorowac outliery kampanii i blokowac szablony/segmenty z najwyzszym riskScore.",
    ];

    const consentRisk = topLists
      .filter((list) => list.optIn !== "double_optin" && list.optIn !== "double opt-in")
      .map((list) => list.name);
    const riskySourceNames = Array.from(sourceNeedsReviewMap.entries())
      .map(([source, count]) => ({ source, count }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .map((item) => item.source);
    const consentUnknownOrUnverifiedCount =
      consentNeedsReviewCount + consentInvalidExternalCount;
    const informationalRiskNotes: string[] = [];
    const blockerNotes: string[] = [];
    const consentInfoNotes: string[] = [];
    if (consentVerifiedCount > 0) {
      consentInfoNotes.push(
        `Verified: ${consentVerifiedCount} profili z operacyjnie potwierdzona zgoda marketingowa.`,
      );
    }
    if (ambiguousMarketingConsentCount > 0) {
      consentInfoNotes.push(
        `Needs review (ambiguous_marketing_consent): ${ambiguousMarketingConsentCount} profili z klaviyo_onsite_form i laczona zgoda.`,
      );
    }
    if (externalOrUnknownNeedsReviewCount > 0) {
      consentInfoNotes.push(
        `Needs review (external_or_unknown): ${externalOrUnknownNeedsReviewCount} profili bez metadata subskrypcji.`,
      );
    }
    if (unknownNeedsReviewCount > 0) {
      consentInfoNotes.push(
        `Needs review (incomplete_marketing_evidence): ${unknownNeedsReviewCount} profili z niepelnym dowodem zgody marketingowej.`,
      );
    }
    if (consentInvalidExternalCount > 0) {
      consentInfoNotes.push(
        `Invalid: ${consentInvalidExternalCount} profili bez potwierdzonej zgody marketingowej.`,
      );
    }
    if (internalExceptionsConfigured && consentInvalidInternalCount > 0) {
      if (consentInvalidExternalCount === 0) {
        consentInfoNotes.push(
          `Wykryto ${consentInvalidInternalCount} kontakt(ów) bez zgody marketingowej oznaczonych jako wewnętrzne; wyłączono je z oceny ryzyka.`,
        );
      } else {
        consentInfoNotes.push(
          `W tym ${consentInvalidInternalCount} kontakt(ów) wewnętrznych wyłączono z oceny; pozostałe ${consentInvalidExternalCount} kontakty bez zgody wymagają działań.`,
        );
      }
    }
    if (consentRisk.length > 0) {
      informationalRiskNotes.push(`Listy bez jasnego double opt-in: ${consentRisk.join(", ")}`);
    }
    if (riskySourceNames.length > 0) {
      informationalRiskNotes.push(
        `Ryzykowne zrodla pozyskania (external_or_unknown): ${riskySourceNames.join(", ")}`,
      );
    }
    if (consentUnknownOrUnverifiedCount > 0) {
      informationalRiskNotes.push(
        `${consentUnknownOrUnverifiedCount} kontaktow wymaga dodatkowej walidacji zgody marketingowej`,
      );
    }
    if (consentInvalidExternalCount > 0) {
      blockerNotes.push(
        `${consentInvalidExternalCount} kontaktow ma consent_status=invalid (brak potwierdzonej zgody marketingowej).`,
      );
    }
    const consentNoteParts = [...consentInfoNotes, ...informationalRiskNotes, ...blockerNotes];

    const formPerformance = detailedForms
      .map((form) => {
        const details = parseFormDetails(form);
        const manual = form.id ? formOverridesById.get(form.id) ?? {} : {};
        const manualString = (key: string) =>
          typeof manual[key] === "string" && manual[key] !== ""
            ? (manual[key] as string)
            : null;
        const manualArray = (key: string) => {
          const value = manual[key];
          if (Array.isArray(value)) {
            return value.filter((item) => typeof item === "string") as string[];
          }
          if (typeof value === "string" && value.trim().length > 0) {
            return value.split("|").map((item) => item.trim()).filter(Boolean);
          }
          return null;
        };
        const manualNumber = (key: string) => {
          const value = manual[key];
          if (typeof value === "number" && Number.isFinite(value)) return value;
          if (typeof value === "string") {
            const parsed = Number(value);
            return Number.isFinite(parsed) ? parsed : null;
          }
          return null;
        };
        const manualBool = (key: string) => {
          const value = manual[key];
          if (typeof value === "boolean") return value;
          if (typeof value === "string") {
            const normalized = value.trim().toLowerCase();
            if (["tak", "true", "yes", "1"].includes(normalized)) return true;
            if (["nie", "false", "no", "0"].includes(normalized)) return false;
          }
          return null;
        };
        const pickTop = (map: Map<string, number>) => {
          let topKey: string | null = null;
          let topCount = 0;
          for (const [key, count] of map.entries()) {
            if (count > topCount) {
              topKey = key;
              topCount = count;
            }
          }
          return topKey;
        };
        const listIdFromSignup = form.id ? formListIdCounts.get(form.id) ?? null : null;
        const listNameFromSignup =
          listIdFromSignup && listIdFromSignup.size > 0
            ? (() => {
                const topId = pickTop(listIdFromSignup);
                return topId ? listIdToName.get(topId) ?? null : null;
              })()
            : (() => {
                const listNameMap = form.id ? formListNameCounts.get(form.id) ?? null : null;
                if (!listNameMap || listNameMap.size === 0) return null;
                return pickTop(listNameMap);
              })();
        const listIdFromSubscribe =
          form.id && formListIdCountsFromSubscribe.get(form.id)
            ? formListIdCountsFromSubscribe.get(form.id) ?? null
            : null;
        const listNameFromSubscribe =
          listIdFromSubscribe && listIdFromSubscribe.size > 0
            ? (() => {
                const topId = pickTop(listIdFromSubscribe);
                return topId ? listIdToName.get(topId) ?? null : null;
              })()
            : null;
        const relationshipListName =
          form.id && formIdToRelationshipListId.has(form.id)
            ? listIdToName.get(formIdToRelationshipListId.get(form.id) ?? "") ?? null
            : null;
        const manualListNames = manualArray("listNames");
        const manualListName = manualListNames && manualListNames.length > 0 ? manualListNames.join(" | ") : null;
        const dailyBucket =
          form.id && formDailyBuckets.get(form.id) ? formDailyBuckets.get(form.id) ?? new Map<string, number>() : new Map<string, number>();
        return {
          id: form.id,
          name: form.name,
          views: form.views,
          submissions: form.submissions,
          conversionRate: form.conversionRate,
          offer: manualString("offer") ?? details.offerText,
          popupType: manualString("formType") ?? details.formType,
          updatedAt: details.lastUpdated,
          deviceVariant: manualString("deviceVariant") ?? details.deviceTargeting,
          listHint: form.listHint,
          listName:
            manualListName ??
            relationshipListName ??
            listNameFromSubscribe ??
            (form.id ? formIdToListNameFromProfiles.get(form.id) ?? null : null) ??
            (form.id ? formIdToListName.get(form.id) ?? null : null) ??
            listNameFromSignup ??
            (form.listHint
              ? listIdToName.get(form.listHint) ?? "Nieudostepnione przez API"
              : "Nieudostepnione przez API"),
          triggerMode: manualString("timing") ?? details.triggerMode,
          delaySeconds: manualNumber("delaySeconds") ?? details.delaySeconds,
          scrollPercent: manualNumber("scrollPercent") ?? details.scrollPercent,
          exitIntent: manualBool("exitIntent") ?? details.exitIntent,
          showAgainDays: manualNumber("cooldownDays") ?? details.showAgainDays,
          hideAfterSubmit: manualBool("hideAfterSignup") ?? details.hideAfterSubmit,
          teaserEnabled: manualBool("teaser") ?? details.teaserEnabled,
          stepsCount: manualNumber("steps") ?? details.stepsCount,
          hasAbTest: details.hasAbTest,
          targetingSummary: details.targetingSummary,
          showOnMobile: manualBool("mobile") ?? details.showOnMobile,
          showOnDesktop: manualBool("desktop") ?? details.showOnDesktop,
          signupCount30d: form.id ? formSignupCounts.get(form.id) ?? 0 : 0,
          purchaseCount30d: form.id ? formPurchaseCounts.get(form.id) ?? 0 : 0,
          revenue30d: form.id ? Number((formRevenueTotals.get(form.id) ?? 0).toFixed(2)) : 0,
          purchaseRate30d: form.id
            ? Number(
                (
                  ((formPurchaseCounts.get(form.id) ?? 0) /
                    Math.max(formSignupCounts.get(form.id) ?? 0, 1)) *
                  100
                ).toFixed(2),
              )
            : 0,
          dailyActivity30d:
            form.id
              ? dailyKeys.map((date) => ({
                  date,
                  count: dailyBucket.get(date) ?? 0,
                }))
              : null,
          eventPropertyKeys:
            form.id && formEventKeyStats.get(form.id)
              ? Array.from(formEventKeyStats.get(form.id)!.entries())
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 12)
                  .map(([key, count]) => ({ key, count }))
              : null,
          eventSamples: form.id ? formEventSamples.get(form.id) ?? null : null,
          manualOverrides: manual,
          rawAttributes: debugMode ? form.rawAttributes : undefined,
        };
      })
      .sort((a, b) => b.submissions - a.submissions);

    const formImpressionsTotal = formPerformance.reduce((sum, form) => sum + (form.views ?? 0), 0);
    const formSubmissionsTotal = formPerformance.reduce((sum, form) => sum + (form.submissions ?? 0), 0);
    const formSubmitRate =
      formImpressionsTotal > 0
        ? Number(((formSubmissionsTotal / formImpressionsTotal) * 100).toFixed(2))
        : null;

    const computeSignupAssessment = () => {
      const formProfiles = formProfilesTotal;
      const signupsPeriod = signupCount30;
      const sampleMode =
        formProfiles === 0 ? "none" : formProfiles < 10 ? "micro" : formProfiles < 50 ? "orientational" : "full";
      const usesDoubleOptIn = optInMode === "double_opt_in";

      const weights = {
        consent: 40,
        profileQuality: 30,
        effectiveness: 15,
        structure: 10,
        stability: 5,
      };

      const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
      const scoreByGap = (gapPct: number) => (gapPct > 20 ? 40 : gapPct >= 10 ? 70 : 90);
      const scoreByInvalidRate = (invalidPct: number) => (invalidPct >= 10 ? 40 : invalidPct >= 5 ? 70 : 95);
      const scoreByDoi = (doiPct: number) =>
        doiPct < 40 ? 30 : doiPct < 60 ? 60 : doiPct < 75 ? 85 : 100;
      const scoreBySubmitRate = (submitPct: number) =>
        submitPct >= 5 ? 100 : submitPct >= 3 ? 85 : submitPct >= 1 ? 65 : 40;

      const blocks: Record<
        string,
        { active: boolean; score: number | null; note?: string; metrics?: Record<string, unknown> }
      > = {
        consent: { active: false, score: null },
        profileQuality: { active: false, score: null },
        effectiveness: { active: false, score: null },
        structure: { active: false, score: null },
        stability: { active: false, score: null },
      };

      if (formProfiles > 0) {
        const invalidPct = (formConsentInvalidCount / Math.max(formProfiles, 1)) * 100;
        const consentRate = (formConsentVerifiedCount / Math.max(formProfiles, 1)) * 100;
        const submitGapPct =
          formSubmissionsTotal > 0
            ? ((Math.max(formSubmissionsTotal - signupsPeriod, 0)) / Math.max(formSubmissionsTotal, 1)) * 100
            : null;
        const doiPct =
          formConsentVerifiedCount > 0
            ? (formDoiConfirmedCount / Math.max(formConsentVerifiedCount, 1)) * 100
            : null;
        const consentScores: number[] = [];
        consentScores.push(scoreByInvalidRate(invalidPct));
        if (submitGapPct !== null && Number.isFinite(submitGapPct)) {
          consentScores.push(scoreByGap(Math.max(0, submitGapPct)));
        }
        if (usesDoubleOptIn && doiPct !== null && Number.isFinite(doiPct)) {
          consentScores.push(scoreByDoi(doiPct));
        }
        const consentScore =
          consentScores.length > 0
            ? clampScore(consentScores.reduce((sum, value) => sum + value, 0) / consentScores.length)
            : null;
        blocks.consent = {
          active: consentScore !== null,
          score: consentScore,
          metrics: {
            consentRate: Number(consentRate.toFixed(2)),
            invalidRate: Number(invalidPct.toFixed(2)),
            submitGapPct: submitGapPct !== null ? Number(submitGapPct.toFixed(2)) : null,
            doiConfirmRate: doiPct !== null ? Number(doiPct.toFixed(2)) : null,
          },
        };
      }

      if (formImpressionsTotal > 0 && formSubmissionsTotal > 0 && formSubmitRate !== null) {
        blocks.effectiveness = {
          active: true,
          score: scoreBySubmitRate(formSubmitRate),
          metrics: {
            impressions: formImpressionsTotal,
            submissions: formSubmissionsTotal,
            submitRate: formSubmitRate,
          },
        };
      } else {
        blocks.effectiveness = {
          active: false,
          score: null,
          note: "Brak impressions dla formularzy.",
          metrics: {
            impressions: formImpressionsTotal,
            submissions: formSubmissionsTotal,
            submitRate: formSubmitRate,
          },
        };
      }

      const totalForms = formPerformance.length;
      if (totalForms > 0) {
        const withList = formPerformance.filter((form) => Boolean(form.listName || form.listHint)).length;
        const withFlow = formPerformance.filter((form) => {
          const manual = (form.manualOverrides ?? {}) as Record<string, unknown>;
          const flowId = typeof manual.flowId === "string" ? manual.flowId : "";
          const flowName = typeof manual.flowName === "string" ? manual.flowName : "";
          return Boolean(flowId || flowName);
        }).length;
        const withCooldown = formPerformance.filter((form) => Boolean(form.showAgainDays || form.hideAfterSubmit)).length;
        const withTrigger = formPerformance.filter((form) => form.triggerMode && form.triggerMode !== "Brak danych").length;
        const structureScore = clampScore(
          ((withList / totalForms) * 100 +
            (withFlow / totalForms) * 100 +
            (withCooldown / totalForms) * 100 +
            (withTrigger / totalForms) * 100) /
            4,
        );
        blocks.structure = {
          active: true,
          score: structureScore,
          metrics: {
            withList,
            withFlow,
            withCooldown,
            withTrigger,
            totalForms,
          },
        };
      }

      const dailySeries = dailyKeys.map((date) => ({
        date,
        count: dailyMap.get(date) ?? 0,
      }));
      if (dailySeries.length > 0) {
        const zeroDays = dailySeries.filter((item) => item.count === 0).length;
        const maxDaily = Math.max(...dailySeries.map((item) => item.count), 1);
        const avgDaily =
          dailySeries.reduce((sum, item) => sum + item.count, 0) / Math.max(dailySeries.length, 1);
        const maxSpikePct = avgDaily > 0 ? (maxDaily / avgDaily) * 100 : 0;
        let stabilityScore = 100;
        if (zeroDays > 10) stabilityScore -= 30;
        if (maxSpikePct > 300) stabilityScore -= 20;
        if (maxSpikePct > 500) stabilityScore -= 30;
        blocks.stability = {
          active: true,
          score: clampScore(stabilityScore),
          metrics: {
            zeroDays,
            maxSpikePct: Number(maxSpikePct.toFixed(0)),
          },
        };
      }

      blocks.profileQuality = {
        active: false,
        score: null,
        note: "Brak danych o OR/CTR oraz bounce/unsub dla profili z formularzy.",
      };

      const activeWeights = Object.entries(weights).filter(([key]) => blocks[key]?.active);
      const totalWeight = activeWeights.reduce((sum, [, value]) => sum + value, 0);
      const normalizedWeights: Record<string, number> = {};
      for (const [key, value] of activeWeights) {
        normalizedWeights[key] = totalWeight > 0 ? value / totalWeight : 0;
      }
      const finalScore =
        totalWeight > 0
          ? clampScore(
              activeWeights.reduce((sum, [key, value]) => {
                const blockScore = blocks[key]?.score ?? 0;
                return sum + blockScore * (value / totalWeight);
              }, 0),
            )
          : null;

      const label =
        sampleMode === "none"
          ? "Brak danych"
          : sampleMode === "micro"
            ? "Niska istotność statystyczna"
            : sampleMode === "orientational"
              ? "Ocena orientacyjna"
              : finalScore !== null
                ? finalScore >= 80
                  ? "Bezpieczny i skalowalny"
                  : finalScore >= 60
                    ? "Wymaga optymalizacji"
                    : "Ryzyko pozyskania"
                : "Brak danych";

      return {
        sampleMode,
        formProfiles,
        signupsPeriod,
        weights,
        normalizedWeights,
        blocks,
        finalScore,
        label,
      };
    };

    const signupAssessment = computeSignupAssessment();

    return NextResponse.json(
      {
        data: {
          generatedAt: new Date().toISOString(),
          sampledProfiles: profileRows.length,
          profilePagesScanned: profilePages,
          flows: flowCatalog,
          campaigns: campaignCatalog,
          base: {
            totalProfiles: allProfiles,
            emailContactableProfiles: contactableProfiles,
            deviceMobileShare,
            totalLists: nonEmptyLists.length,
            totalSegments: nonEmptySegments.length,
            totalFlows: flowCatalog.length,
            totalCampaigns: campaignCatalog.length,
            oldestProfileAt: oldestProfileMs ? new Date(oldestProfileMs).toISOString() : null,
            contactAgeStats: {
              averageDays: avgAgeDays,
              medianDays: medianAgeDays,
              sampleSize: ageSampleSorted.length,
            },
            listsAccess: listsResult.ok ? "ok" : "error",
            segmentsAccess: segmentsResult.ok ? "ok" : "error",
            flowsAccess: flowsResult.ok ? "ok" : "error",
            campaignsAccess: campaignsResult.ok ? "ok" : "error",
            listsStatusCode: listsResult.status,
            segmentsStatusCode: segmentsResult.status,
            flowsStatusCode: flowsResult.status,
            campaignsStatusCode: campaignsResult.status,
            listsError: listsResult.ok ? null : shortError(listsResult.raw),
            segmentsError: segmentsResult.ok ? null : shortError(segmentsResult.raw),
            flowsError: flowsResult.ok ? null : shortError(flowsResult.raw),
            campaignsError: campaignsResult.ok ? null : shortError(campaignsResult.raw),
            topLists,
            topSegments: topSegmentsMapped,
            listsWithProfiles,
            segmentsWithProfiles,
          },
          flowAudit: {
            metrics: {
              status: "unavailable",
              reason: "not_implemented",
              perFlow: [],
            },
            manualOverrides: Object.fromEntries(flowOverridesById),
          },
          campaignAudit: {
            metrics: {
              status: campaignMetricsStatus,
              reason:
                campaignMetricsStatus === "unavailable"
                  ? "reporting_api_unavailable"
                  : campaignMetricsStatus === "no_history"
                    ? "no_history"
                    : null,
              perCampaign: perCampaignMetrics,
              sampleMode: campaignMetricsSampleMode,
              sampleSize: selectedCampaignMetrics.size,
              fallback: use90Fallback,
            },
            timing: {
              open: openHeatmap,
              click: clickHeatmap,
            },
            manualOverrides: Object.fromEntries(campaignOverridesById),
          },
          consent: {
            listOptInModes: topLists.map((item) => ({ name: item.name, optIn: item.optIn })),
            riskOfNoConsent: blockerNotes.length > 0,
            consentSourceVerified: "klaviyo_onsite_form",
            consentStatusVerified: "verified",
            consentSourceNeedsReview: "external_or_unknown",
            consentStatusNeedsReview: "needs_review",
            consentRiskNeedsReview: "ambiguous_marketing_consent",
            verifiedCount: verifiedAccounts.length,
            needsReviewCount: consentNeedsReviewCount,
            invalidCount: consentInvalidExternalCount,
            invalidTotalCount: consentInvalidTotalCount,
            invalidInternalCount: consentInvalidInternalCount,
            invalidExternalCount: consentInvalidExternalCount,
            internalExceptionsConfigured,
            notVerifiedCount: notVerifiedAccounts.length,
            consentAccountsTotal: allConsentAccounts.size,
            verifiedAccounts,
            notVerifiedAccounts,
            riskNote:
              consentNoteParts.length > 0
                ? consentNoteParts.join(". ")
                : "Brak oczywistego sygnalu wysokiego ryzyka zgody.",
          },
          sources: {
            distribution: sourceDistribution.slice(0, 8),
          },
          deliverability: {
            ...deliverability,
            outliers,
          },
          infrastructure: {
            senderDomain,
            ...infrastructure,
          },
          activity: {
            ...activityBuckets,
            activeVsInactivePercent: {
              active90Percent: percent(activityBuckets.active90, profilesWithEmail.length),
              inactive90PlusPercent: percent(activityBuckets.inactive90plus, profilesWithEmail.length),
            },
            campaignsToInactivePercent,
            campaignsToInactiveEstimate,
          },
          listQuality: {
            totalContacts,
            freshConsentCount,
            oldImportCount,
            doiCount,
            confirmedConsentCount,
            active90Count: activityBuckets.active90,
            inactive180Count: activityBuckets.inactive180plus,
          },
          suppression: {
            suppressedCount,
            reasons: Array.from(suppressionReasonMap.entries())
              .map(([reason, count]) => ({ reason, count }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 6),
            hasSunsetPolicy: hasSunsetSegment,
          },
          segmentAudit,
          signupFormAudit: {
            consentLogic: {
              status: consentClarity,
              note:
                consentClarity === "clear"
                  ? "Zgoda marketingowa jest oparta o jednoznaczne sygnaly profilu."
                  : consentClarity === "ambiguous"
                    ? "Wykryto profile z niejednoznacznym wordingiem zgody (np. laczona zgoda)."
                    : "Brak wystarczajacych danych do oceny jasnosci zgody.",
            },
            optInMechanic: {
              mode: optInMode,
              note:
                optInMode === "double_opt_in"
                  ? "Dominuje double opt-in (wyzsza jakosc zapisow)."
                  : optInMode === "single_opt_in"
                    ? "Dominuje single opt-in (szybszy wzrost, ale wyzsze ryzyko jakosci)."
                    : optInMode === "mixed"
                      ? "W bazie wystepuje miks single i double opt-in."
                      : "Brak danych opt-in na poziomie list.",
            },
            formContexts: Array.from(formsByContext.entries()).map(([context, count]) => ({ context, count })),
            formsInKlaviyo: {
              total: formItems.length,
              active: detailedForms.length,
              items: detailedForms
                .sort((a, b) => b.submissions - a.submissions)
                .slice(0, 12),
            },
            promiseVsCommunication: {
              status: "needs_manual_review",
              note: "Automatyczny audyt nie widzi tresci popupu; wymagany reczny przeglad obietnicy formularza vs realna komunikacja.",
            },
            frictionLevel: {
              status:
                storeFormScan.requiredInputs >= 3
                  ? "watch"
                  : storeFormScan.requiredInputs >= 1
                    ? "ok"
                    : "unknown",
              note:
                storeFormScan.requiredInputs > 0
                  ? `Wykryto ok. ${storeFormScan.requiredInputs} pol wymaganych w formularzach strony.`
                  : "Brak pewnych danych o liczbie pol wymaganych.",
            },
            signupSegmentation: {
              status: signupSegmentationQuality,
              note:
                signupSegmentationQuality === "good"
                  ? "Wystepuje co najmniej podstawowe roznicowanie zrodel/list przy zapisie."
                  : "Segmentacja przy zapisie jest ograniczona (malo roznych list/zrodel).",
            },
            qualityOfIntent: {
              status:
                storeFormScan.hasDiscountSignals && !storeFormScan.hasAggressivePopupSignals
                  ? "good"
                  : storeFormScan.hasAggressivePopupSignals
                    ? "watch"
                    : "needs_manual_review",
              note:
                storeFormScan.hasDiscountSignals && !storeFormScan.hasAggressivePopupSignals
                  ? "Formularz komunikuje wartosc zapisu i nie wyglada na agresywny."
                  : storeFormScan.hasAggressivePopupSignals
                    ? "Wykryto sygnaly bardzo wczesnego popupu; moze to obnizac jakosc intentu."
                    : "Brak pewnych sygnalow wartosci zapisu - sprawdz recznie copy i kontekst formularza.",
            },
            timingLogic: {
              status:
                storeFormScan.hasExitIntentSignals || storeFormScan.hasScrollTriggerSignals
                  ? "ok"
                  : storeFormScan.hasAggressivePopupSignals
                    ? "watch"
                    : "needs_manual_review",
              note: storeFormScan.hasAggressivePopupSignals
                ? "Mozliwy agresywny timing popupu (bardzo wczesne wyswietlenie)."
                : storeFormScan.hasExitIntentSignals || storeFormScan.hasScrollTriggerSignals
                  ? "Wykryto sygnaly triggerow (scroll/exit-intent), co zwykle poprawia jakosc zapisu."
                  : popupTimingNote,
            },
            inputQuality: {
              status: storeFormScan.hasCaptcha ? "ok" : "watch",
              note: storeFormScan.hasCaptcha
                ? "Wykryto sygnaly ochrony botowej (captcha/hcaptcha/turnstile)."
                : "Nie wykryto jednoznacznych sygnalow ochrony botowej; sprawdz walidacje i blokade tempmail.",
            },
            postSignupExperience: {
              status: storeFormScan.hasThankYouSignals ? "ok" : "needs_manual_review",
              note: storeFormScan.hasThankYouSignals
                ? "W HTML widoczne sa sygnaly thank-you/potwierdzenia po zapisie."
                : "Brak jasnych sygnalow thank-you flow; sprawdz recznie komunikat i email powitalny.",
            },
            dataMapping: {
              status:
                formsResult.ok && storeFormScan.hasSourceMappingSignals
                  ? "ok"
                  : formsResult.ok
                    ? "watch"
                    : "needs_manual_review",
              note:
                formsResult.ok && storeFormScan.hasSourceMappingSignals
                  ? "Integracja i sygnaly mapowania source/form sa widoczne."
                  : formsResult.ok
                    ? "Formularze sa widoczne w API, ale mapowanie source/list/tag wymaga doprecyzowania."
                    : "Brak potwierdzenia integracji /forms - mapowanie danych wymaga recznej weryfikacji.",
            },
            promiseVsReality: {
              status: storeFormScan.hasDiscountSignals ? "watch" : "needs_manual_review",
              note: storeFormScan.hasDiscountSignals
                ? "Wykryto obietnice wartosci (np. rabat), sprawdz czy dalsza komunikacja jest z tym zgodna."
                : "Automatyczny audyt nie potwierdza obietnicy formularza vs realnej komunikacji - sprawdz recznie.",
            },
            unsubscribeVisibility: {
              status: "needs_manual_review",
              note: "Sprawdz recznie, czy przy zapisie widoczna jest informacja o mozliwosci wypisu i polityce prywatnosci.",
            },
            integrationWithKlaviyo: {
              status: formsResult.ok ? "ok" : "warning",
              note: formsResult.ok
                ? "Formularze Klaviyo sa widoczne przez API i mozna sledzic zrodlo zapisu."
                : "Brak dostepu do endpointu /forms - integracja formularzy wymaga recznej weryfikacji.",
            },
            externalFormsCheck: {
              checked: storeFormScan.checked,
              url: storeFormScan.url,
              totalForms: storeFormScan.totalForms,
              totalEmailForms: storeFormScan.totalEmailForms,
              klaviyoTaggedForms: storeFormScan.klaviyoTaggedForms,
              klaviyoEmailForms: storeFormScan.klaviyoEmailForms,
              nonKlaviyoForms: storeFormScan.nonKlaviyoForms,
              nonKlaviyoEmailForms: storeFormScan.nonKlaviyoEmailForms,
              emailInputs: storeFormScan.emailInputs,
              requiredInputs: storeFormScan.requiredInputs,
              hasCaptcha: storeFormScan.hasCaptcha,
              hasThankYouSignals: storeFormScan.hasThankYouSignals,
              hasDiscountSignals: storeFormScan.hasDiscountSignals,
              hasAggressivePopupSignals: storeFormScan.hasAggressivePopupSignals,
              hasExitIntentSignals: storeFormScan.hasExitIntentSignals,
              hasScrollTriggerSignals: storeFormScan.hasScrollTriggerSignals,
              hasSourceMappingSignals: storeFormScan.hasSourceMappingSignals,
              hasMobileSignals: storeFormScan.hasMobileSignals,
              popupDelaySeconds: storeFormScan.popupDelaySeconds,
              sampleExternalActions: storeFormScan.sampleExternalActions,
              note: storeFormScan.note,
            },
            sourceAttribution: {
              topSources: sourceDistribution.slice(0, 6),
            },
            assessment: signupAssessment,
            kpi: {
              signups30d: signupCount30,
              signupToPurchaseRate30d: purchaseRateFromSignup,
              purchasesFromFormProfiles30d: purchaseFromForms30.length,
              estimatedMonthlyRevenueFromForms: monthlyRevenueFromForms,
              dailyActivity30d: dailyKeys.map((date) => ({
                date,
                count: dailyMap.get(date) ?? 0,
              })),
              timeZone,
              formPerformance,
            },
          },
          insights,
          actions,
          limitations: [
            "Czesc danych oparta o probke profili (limit paginacji API).",
            "Outliery kampanii liczone z event properties i moga zalezec od mapowania nazw kampanii.",
            "Aktywnosc oparta glownie o last_event_date; przy Apple MPP interpretuj z naciskiem na clicki/zakupy.",
            ...integrationWarnings,
          ],
        },
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ error: "Nie udalo sie wygenerowac audytu listy." }, { status: 500 });
  }
}

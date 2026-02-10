import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getServerAuthSession } from "~/server/auth";
import { db } from "~/server/db";
import { loadClientCredentials } from "~/server/security/client-credentials";

const KLAVIYO_API_BASE_URL = "https://a.klaviyo.com/api";
const KLAVIYO_REVISION = "2024-10-15";
const PAGE_SIZE = 100;
const MAX_PROFILE_PAGES = 15;

type GenericRow = {
  id?: string;
  attributes?: Record<string, unknown>;
};

const buildHeaders = (apiKey: string) => ({
  Accept: "application/json",
  Authorization: `Klaviyo-API-Key ${apiKey.trim()}`,
  revision: KLAVIYO_REVISION,
});

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

const hasExplicitMarketingConsent = (status: string | null) => {
  const value = (status ?? "").toLowerCase();
  return value === "subscribed" || value === "consented" || value === "opted_in";
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

const parseBodyRows = <T>(body: unknown): T[] => {
  if (!body || typeof body !== "object") return [];
  const maybeData = body as { data?: unknown };
  return Array.isArray(maybeData.data) ? (maybeData.data as T[]) : [];
};

const nextLinkFromBody = (body: unknown) => {
  if (!body || typeof body !== "object") return null;
  const links = (body as { links?: { next?: unknown } }).links;
  const next = links?.next;
  return typeof next === "string" && next.length > 0 ? next : null;
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

const buildXlsx = (emails: string[]) => {
  const rows = emails.map((email) => ({ email }));
  const sheet = XLSX.utils.json_to_sheet(rows, { header: ["email"] });
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "emails");
  return XLSX.write(book, { bookType: "xlsx", type: "buffer" });
};

export async function GET(request: Request) {
  const session = await getServerAuthSession();
  const userId = session?.user?.id ?? process.env.DEV_AUTH_USER_ID ?? null;
  if (!userId) {
    return NextResponse.json({ error: "Brak autoryzacji." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = (searchParams.get("category") ?? "all").toLowerCase();
  if (!["all", "verified", "unverified"].includes(category)) {
    return NextResponse.json({ error: "Nieprawidlowa kategoria exportu." }, { status: 400 });
  }

  const activeContext = await db.clientUserContext.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { clientId: true },
  });
  if (!activeContext?.clientId) {
    return NextResponse.json({ error: "Brak aktywnego klienta." }, { status: 400 });
  }

  const credentials = await loadClientCredentials(activeContext.clientId);
  const apiKey = credentials.klaviyoPrivateApiKey ?? "";
  if (!apiKey) {
    return NextResponse.json({ error: "Brak Klaviyo Private API Key." }, { status: 400 });
  }

  const headers = buildHeaders(apiKey);
  let profileRows: GenericRow[] = [];
  let profilePages = 0;
  let profileNextUrl: string | null = `${KLAVIYO_API_BASE_URL}/profiles?page[size]=${PAGE_SIZE}&additional-fields[profile]=subscriptions`;
  while (profileNextUrl && profilePages < MAX_PROFILE_PAGES) {
    const page = await fetchJson(profileNextUrl, headers);
    if (!page.ok) {
      return NextResponse.json({ error: "Nie udalo sie pobrac profili." }, { status: page.status });
    }
    profileRows = profileRows.concat(parseBodyRows<GenericRow>(page.body));
    profileNextUrl = nextLinkFromBody(page.body);
    profilePages += 1;
  }

  const allEmails = new Set<string>();
  const verifiedEmails = new Set<string>();
  const allConsentAccountKeys = new Map<string, { email: string }>();
  const verifiedConsentAccountKeys = new Set<string>();

  for (const row of profileRows) {
    const attrs = row.attributes ?? {};
    const email = readString(attrs.email, attrs.Email);
    if (!email) continue;
    allEmails.add(email.toLowerCase());

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

    const sourceRawLower = (sourceRaw ?? "").toLowerCase();
    const isKlaviyoFormMethod = sourceRawLower.includes("klaviyo form") || source === "Klaviyo forms";
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

    const hasConsentMetadata = Boolean(consentTimestamp) && Boolean(consentFormEvidence) && Boolean(consentIp);
    const hasOnsiteFormEvidence = hasExplicitMarketingConsent(marketingStatus) && isKlaviyoFormMethod && hasConsentMetadata;
    const hasShopifyConsentEvidence = hasExplicitMarketingConsent(marketingStatus) && source === "Shopify";
    const hasOperationalConsentEvidence =
      hasExplicitMarketingConsent(marketingStatus) || hasOnsiteFormEvidence || hasShopifyConsentEvidence;

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
    const hasMarketingOnlyEvidence = marketingOnlyCheckbox === true || hasExplicitMarketingOnlyWording(consentWording);

    const consentAccountKey = row.id?.trim() ? row.id.trim() : `email:${email.toLowerCase()}`;
    allConsentAccountKeys.set(consentAccountKey, { email });

    if (!isSuppressed && hasOperationalConsentEvidence && hasMarketingOnlyEvidence) {
      verifiedConsentAccountKeys.add(consentAccountKey);
      verifiedEmails.add(email.toLowerCase());
    }
  }

  const unverifiedEmails = Array.from(allConsentAccountKeys.entries())
    .filter(([key]) => !verifiedConsentAccountKeys.has(key))
    .map(([, account]) => account.email.toLowerCase());

  const outputEmails =
    category === "verified"
      ? Array.from(verifiedEmails)
      : category === "unverified"
        ? unverifiedEmails
        : Array.from(allEmails);

  const filename =
    category === "verified"
      ? "klaviyo-verified-emails.xlsx"
      : category === "unverified"
        ? "klaviyo-unverified-emails.xlsx"
        : "klaviyo-all-emails.xlsx";

  const buffer = buildXlsx(outputEmails);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=\"${filename}\"`,
      "X-Export-Partial": profileNextUrl ? "true" : "false",
    },
  });
}

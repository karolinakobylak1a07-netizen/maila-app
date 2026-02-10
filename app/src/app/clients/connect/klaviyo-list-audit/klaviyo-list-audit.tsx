"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type ActiveContact = {
  clientId: string;
  clientName: string;
  clientEmail: string | null;
  senderDomain?: string | null;
  ownerEmail?: string | null;
  internalEmails?: string[];
  deviceMobileShare?: number | null;
};

type AuditReportMeta = {
  id: string;
  title: string | null;
  status: string;
  version: number;
  createdAt: string;
  updatedAt: string;
};

type AuditReportContentSection = {
  id: string;
  title: string;
  body: string;
};

type AuditReportContent = {
  sections: AuditReportContentSection[];
};

type AuditReportDetail = AuditReportMeta & {
  content: AuditReportContent;
  snapshot?: Record<string, unknown> | null;
};

type ListAuditReport = {
  generatedAt: string;
  sampledProfiles: number;
  profilePagesScanned: number;
  flows?: Array<{ id: string; name: string; status?: string | null }>;
  campaigns?: Array<{
    id: string;
    name: string;
    status?: string | null;
    sendTime?: string | null;
    subject?: string | null;
    previewText?: string | null;
    audience?: {
      includedSegments: Array<{ id: string; name: string }>;
      includedLists: Array<{ id: string; name: string }>;
      excludedSegments: Array<{ id: string; name: string }>;
      excludedLists: Array<{ id: string; name: string }>;
      unknownIncluded: string[];
      unknownExcluded: string[];
      isEntireList: boolean;
      isEntireListHeuristic: boolean;
    };
  }>;
  base: {
    totalProfiles: number;
    emailContactableProfiles: number;
    totalLists?: number;
    totalSegments?: number;
    totalFlows?: number;
    totalCampaigns?: number;
    deviceMobileShare?: number | null;
    oldestProfileAt?: string | null;
    contactAgeStats?: {
      averageDays: number | null;
      medianDays: number | null;
      sampleSize: number;
    };
    listsAccess?: "ok" | "error";
    segmentsAccess?: "ok" | "error";
    flowsAccess?: "ok" | "error";
    campaignsAccess?: "ok" | "error";
    listsStatusCode?: number;
    segmentsStatusCode?: number;
    flowsStatusCode?: number;
    campaignsStatusCode?: number;
    listsError?: string | null;
    segmentsError?: string | null;
    flowsError?: string | null;
    campaignsError?: string | null;
    topLists: Array<{ id: string; name: string; count: number; shareOfBase: number; optIn: string }>;
    topSegments: Array<{ id: string; name: string; count: number; shareOfBase: number }>;
    listsWithProfiles?: Array<{ id: string; name: string; count: number }>;
    segmentsWithProfiles?: Array<{ id: string; name: string; count: number }>;
  };
  flowAudit?: {
    metrics?: {
      status: "unavailable" | "ok" | "no_history";
      reason?: string | null;
      perFlow?: Array<Record<string, unknown>>;
    };
    manualOverrides?: Record<string, Record<string, unknown>>;
  };
  campaignAudit?: {
    metrics?: {
      status: "unavailable" | "ok" | "no_history";
      reason?: string | null;
      perCampaign?: Array<Record<string, unknown>>;
      sampleMode?: "30d" | "90d";
      sampleSize?: number;
      fallback?: boolean;
    };
    timing?: {
      open?: {
        matrix: number[][];
        total: number;
        sampleMode: "30d" | "90d";
        sampleSize: number;
        lowSample: boolean;
      };
      click?: {
        matrix: number[][];
        total: number;
        sampleMode: "30d" | "90d";
        sampleSize: number;
        lowSample: boolean;
      };
    };
    manualOverrides?: Record<string, Record<string, unknown>>;
  };
  consent: {
    listOptInModes: Array<{ name: string; optIn: string }>;
    riskOfNoConsent: boolean;
    riskNote: string;
    consentSourceVerified?: string;
    consentStatusVerified?: string;
    consentSourceNeedsReview?: string;
    consentStatusNeedsReview?: string;
    consentRiskNeedsReview?: string;
    verifiedCount?: number;
    needsReviewCount?: number;
    invalidCount?: number;
    invalidTotalCount?: number;
    invalidInternalCount?: number;
    invalidExternalCount?: number;
    internalExceptionsConfigured?: boolean;
    consentAccountsTotal?: number;
    notVerifiedCount?: number;
    verifiedAccounts?: Array<{ id: string; email: string; source: string }>;
    notVerifiedAccounts?: Array<{ id: string; email: string; source: string }>;
  };
  sources: {
    distribution: Array<{ source: string; count: number; share: number; risk: string }>;
  };
  deliverability: {
    days30: {
      sent: number;
      bounceRate: number;
      hardBounceRate: number;
      softBounceRate: number;
      complaintRate: number;
      unsubscribeRate: number;
    };
    days90: {
      sent: number;
      bounceRate: number;
      hardBounceRate: number;
      softBounceRate: number;
      complaintRate: number;
      unsubscribeRate: number;
    };
    outliers: Array<{
      campaign: string;
      sent: number;
      bounceRate: number;
      complaintRate: number;
      unsubscribeRate: number;
      riskScore: number;
    }>;
  };
  infrastructure?: {
    senderDomain?: string | null;
    spf_status: string;
    dkim_status: string;
    dmarc_status: string;
    alignment_status: string;
    status: "ok" | "warning" | "critical";
    matchedDomain: string | null;
  };
  activity: {
    active30: number;
    active60: number;
    active90: number;
    inactive90plus: number;
    inactive180plus: number;
    inactive365plus: number;
    activeVsInactivePercent: {
      active90Percent: number;
      inactive90PlusPercent: number;
    };
    campaignsToInactivePercent: number;
    campaignsToInactiveEstimate: "low" | "medium" | "high";
  };
  listQuality?: {
    totalContacts: number;
    freshConsentCount: number;
    oldImportCount: number;
    doiCount: number;
    confirmedConsentCount: number;
    active90Count: number;
    inactive180Count: number;
  };
  suppression: {
    suppressedCount: number;
    reasons: Array<{ reason: string; count: number }>;
    hasSunsetPolicy: boolean;
  };
  segmentAudit?: {
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
  signupFormAudit?: {
    consentLogic: { status: string; note: string };
    optInMechanic: { mode: string; note: string };
    qualityOfIntent: { status: string; note: string };
    timingLogic: { status: string; note: string };
    inputQuality: { status: string; note: string };
    postSignupExperience: { status: string; note: string };
    dataMapping: { status: string; note: string };
    promiseVsReality: { status: string; note: string };
    formContexts: Array<{ context: string; count: number }>;
    formsInKlaviyo: {
      total: number;
      active: number;
      items: Array<{
        id: string;
        name: string;
        status: string;
        context: string;
        views: number;
        submissions: number;
        conversionRate: number;
        offer: string;
        popupType: string;
        updatedAt: string;
        deviceVariant: string;
        listHint: string;
      }>;
    };
    promiseVsCommunication: { status: string; note: string };
    frictionLevel: { status: string; note: string };
    signupSegmentation: { status: string; note: string };
    unsubscribeVisibility: { status: string; note: string };
    integrationWithKlaviyo: { status: string; note: string };
    externalFormsCheck: {
      checked: boolean;
      url: string | null;
      totalForms: number;
      totalEmailForms: number;
      klaviyoTaggedForms: number;
      klaviyoEmailForms: number;
      nonKlaviyoForms: number;
      nonKlaviyoEmailForms: number;
      emailInputs: number;
      requiredInputs: number;
      hasCaptcha: boolean;
      hasThankYouSignals: boolean;
      hasDiscountSignals: boolean;
      hasAggressivePopupSignals: boolean;
      hasExitIntentSignals: boolean;
      hasScrollTriggerSignals: boolean;
      hasSourceMappingSignals: boolean;
      hasMobileSignals: boolean;
      popupDelaySeconds: number | null;
      sampleExternalActions: string[];
      note: string;
    };
    sourceAttribution: {
      topSources: Array<{ source: string; count: number; share: number; risk: string }>;
    };
    assessment?: {
      sampleMode: "none" | "micro" | "orientational" | "full";
      formProfiles: number;
      signupsPeriod: number;
      weights: {
        consent: number;
        profileQuality: number;
        effectiveness: number;
        structure: number;
        stability: number;
      };
      normalizedWeights: Record<string, number>;
      blocks: Record<
        string,
        {
          active: boolean;
          score: number | null;
          note?: string;
          metrics?: Record<string, unknown>;
        }
      >;
      finalScore: number | null;
      label: string;
    };
    kpi: {
      signups30d: number;
      signupToPurchaseRate30d: number;
      purchasesFromFormProfiles30d: number;
      estimatedMonthlyRevenueFromForms: number;
      dailyActivity30d: Array<{ date: string; count: number }>;
      timeZone: string;
      formPerformance: Array<{
        id: string;
        name: string;
        views: number;
        submissions: number;
        conversionRate: number;
        offer: string;
        popupType: string;
        updatedAt: string;
        deviceVariant: string;
        listHint: string;
        listName: string;
        triggerMode: string;
        delaySeconds: number | null;
        scrollPercent: number | null;
        exitIntent: boolean | null;
        showAgainDays: number | null;
        hideAfterSubmit: boolean | null;
        teaserEnabled: boolean | null;
        stepsCount: number | null;
        hasAbTest: boolean | null;
        targetingSummary: string;
        showOnMobile: boolean | null;
        showOnDesktop: boolean | null;
        signupCount30d: number;
        purchaseCount30d: number;
        revenue30d: number;
        purchaseRate30d: number;
        dailyActivity30d: Array<{ date: string; count: number }> | null;
        eventPropertyKeys: Array<{ key: string; count: number }> | null;
        eventSamples?: Array<{
          id?: string | null;
          datetime?: string | null;
          metric?: string | null;
          formId?: string | null;
          listId?: string | null;
          props?: Record<string, unknown>;
          meta?: Record<string, unknown>;
          keys?: string[];
          metaKeys?: string[];
        }> | null;
        manualOverrides?: Record<string, unknown>;
        rawAttributes?: Record<string, unknown>;
      }>;
    };
  };
  insights: string[];
  actions: string[];
  limitations: string[];
};

type SectionStatus = "ok" | "warning" | "fail";

const statusClass: Record<SectionStatus, string> = {
  ok: "text-emerald-700",
  warning: "text-amber-700",
  fail: "text-red-700",
};

const statusLabel: Record<SectionStatus, string> = {
  ok: "OK",
  warning: "UWAGA",
  fail: "BŁĄD",
};

type MetricStatus = "OK" | "Watch" | "Risk";
type TrendDirection = "up" | "down" | "flat";

const trendIcon: Record<TrendDirection, string> = {
  up: "↑",
  down: "↓",
  flat: "→",
};

const miniCardClass: Record<MetricStatus, string> = {
  OK: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Watch: "border-amber-200 bg-amber-50 text-amber-700",
  Risk: "border-red-200 bg-red-50 text-red-700",
};

const gaugeClassByRisk = (riskScore: number, lowData: boolean) => {
  if (lowData) return "text-amber-500";
  if (riskScore <= 30) return "text-emerald-500";
  if (riskScore <= 55) return "text-amber-500";
  return "text-red-500";
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const percent = (part: number, total: number) =>
  total > 0 ? Number(((part / total) * 100).toFixed(1)) : 0;

const formatMonthAge = (days: number | null) => {
  if (days === null || Number.isNaN(days)) return "N/D";
  const months = days / 30;
  return `${months.toFixed(1)} mies.`;
};

const formatShortDate = (iso: string | null | undefined) => {
  if (!iso) return "N/D";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "N/D";
  return date.toLocaleDateString("pl-PL");
};

const resolveTrend = (recent30: number, baseline90: number): TrendDirection => {
  if (baseline90 <= 0) return recent30 > 0 ? "up" : "flat";
  const ratio = recent30 / baseline90;
  if (ratio > 1.15) return "up";
  if (ratio < 0.85) return "down";
  return "flat";
};

const resolveMetricStatus = (
  value: number,
  okThreshold: number,
  watchThreshold: number,
): MetricStatus => {
  if (value <= okThreshold) return "OK";
  if (value <= watchThreshold) return "Watch";
  return "Risk";
};

const weekdayLabel = (dateKey: string, timeZone: string) => {
  const dt = new Date(`${dateKey}T12:00:00Z`);
  const raw = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone }).format(dt).toLowerCase();
  const map: Record<string, string> = {
    mon: "pn",
    tue: "wt",
    wed: "śr",
    thu: "czw",
    fri: "pt",
    sat: "sob",
    sun: "nd",
  };
  const key = raw.slice(0, 3);
  return map[key] ?? raw.slice(0, 2);
};

const buildSeries = (from: number, to: number, points = 13) =>
  Array.from({ length: points }, (_, idx) => {
    const t = idx / (points - 1);
    // Slight easing to avoid a perfectly straight line and make trend easier to read.
    const eased = t * t * (3 - 2 * t);
    return Number((from + (to - from) * eased).toFixed(3));
  });

const toPolyline = (values: number[], width: number, height: number, maxValue: number) => {
  if (values.length === 0 || maxValue <= 0) return "";
  return values
    .map((value, idx) => {
      const x = (idx / (values.length - 1)) * width;
      const y = height - (value / maxValue) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
};

const sourceVisual = (source: string) => {
  const value = source.trim().toLowerCase();
  if (value.includes("shopify")) {
    return { icon: "S", badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700", label: "Shopify" };
  }
  if (value.includes("klaviyo")) {
    return { icon: "K", badgeClass: "border-blue-200 bg-blue-50 text-blue-700", label: "Klaviyo form" };
  }
  if (value.includes("unknown")) {
    return { icon: "?", badgeClass: "border-amber-200 bg-amber-50 text-amber-700", label: "Unknown" };
  }
  return { icon: "•", badgeClass: "border-slate-200 bg-slate-50 text-slate-700", label: source };
};

const auditNoteTone = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized === "ok" || normalized === "clear" || normalized === "good") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  if (normalized === "warning" || normalized === "ambiguous" || normalized === "mixed") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
};

const prettyOptInMode = (mode: string) => {
  if (mode === "double_opt_in") return "Double opt-in";
  if (mode === "single_opt_in") return "Single opt-in";
  if (mode === "mixed") return "Mieszany";
  return "Brak danych";
};

const prettyContext = (context: string) => {
  if (context === "popup") return "Popup";
  if (context === "exit intent") return "Exit intent";
  if (context === "embedded") return "Embedded";
  if (context === "checkout") return "Checkout";
  if (context === "blog") return "Blog";
  return "Inne";
};

const resolveMobileLabel = (value: string | undefined, fallback: boolean) => {
  const normalized = (value ?? "").toLowerCase();
  if (normalized.includes("mobile")) return "tak (mobile)";
  if (normalized.includes("desktop")) return "tylko desktop";
  if (normalized.includes("all") || normalized.includes("both")) return "tak (mobile + desktop)";
  return fallback ? "prawdopodobnie tak" : "brak danych";
};

const softStatusChipClass = (tone: "ok" | "watch" | "risk") => {
  if (tone === "ok") return "border-emerald-200 bg-emerald-100/80 text-emerald-800";
  if (tone === "watch") return "border-amber-200 bg-amber-100/80 text-amber-800";
  return "border-rose-200 bg-rose-100/80 text-rose-800";
};

const campaignStatusBadge = (
  status: "yes" | "no" | "unknown" | "heuristic",
  detail?: string,
  tooltip?: string,
) => {
  const base =
    status === "yes"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "no"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : status === "heuristic"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-slate-200 bg-slate-50 text-slate-600";
  const label =
    status === "yes" ? "TAK" : status === "no" ? "NIE" : status === "heuristic" ? "HEURYSTYKA" : "BRAK DANYCH";
  return (
    <span title={tooltip} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${base}`}>
      {label}
      {detail ? <span className="text-[10px] font-medium normal-case">{detail}</span> : null}
    </span>
  );
};

const normalizeStatus = (value: string | null | undefined) => (value ?? "").toLowerCase();
const isPositiveStatus = (value: string | null | undefined) =>
  ["ok", "good", "clear", "valid"].includes(normalizeStatus(value));
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const normalizeEmailValue = (value: string) => value.trim().toLowerCase();
const normalizeEmailInput = (value: string) =>
  value
    .split(/[,\s]+/)
    .map((item) => normalizeEmailValue(item))
    .filter((item) => item.length > 0)
    .join(", ");

const readNumber = (...values: Array<unknown>) => {
  for (const value of values) {
    if (typeof value === "number" && !Number.isNaN(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value.replace(",", "."));
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  return null;
};

function KlaviyoListAuditGuideContent({
  queryClientId,
  queryClientName,
  queryClientEmail,
}: {
  queryClientId: string;
  queryClientName: string;
  queryClientEmail: string;
}) {
  const [activeContact, setActiveContact] = useState<ActiveContact | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ListAuditReport | null>(null);
  const [isAuditExpanded, setIsAuditExpanded] = useState(true);
  const [isSignupAuditExpanded, setIsSignupAuditExpanded] = useState(true);
  const [isSegmentAuditExpanded, setIsSegmentAuditExpanded] = useState(true);
  const [isFlowAuditExpanded, setIsFlowAuditExpanded] = useState(true);
  const [isCampaignAuditExpanded, setIsCampaignAuditExpanded] = useState(true);
  const [isDesignAuditExpanded, setIsDesignAuditExpanded] = useState(true);
  const [formSortKey, setFormSortKey] = useState<
    "name" | "status" | "type" | "updatedAt" | "signupCount30d" | "conversionRate"
  >("signupCount30d");
  const [formSortDir, setFormSortDir] = useState<"asc" | "desc">("desc");
  const [rawDumpStatus, setRawDumpStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [latestDebugDump, setLatestDebugDump] = useState<Record<string, unknown> | null>(null);
  const [latestDebugTimestamp, setLatestDebugTimestamp] = useState<string | null>(null);
  const [exportingCategory, setExportingCategory] = useState<null | "all" | "verified" | "unverified">(null);
  const [ownerEmailInput, setOwnerEmailInput] = useState("");
  const [internalEmailsInput, setInternalEmailsInput] = useState<string[]>([]);
  const [internalSaveStatus, setInternalSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [autoSeededInternal, setAutoSeededInternal] = useState(false);
  const [deviceMobileShareInput, setDeviceMobileShareInput] = useState<string>("");
  const [flowManualInputs, setFlowManualInputs] = useState<
    Record<
      string,
      {
        offerConsistent: string;
        goal: string;
        duplicates: string;
        competes: string;
        timing: string;
        dynamicData: string;
        smartSegments: string;
        abTests: string;
        outdatedContent: string;
        footerCompliance: string;
        note: string;
      }
    >
  >({});
  const [flowManualStatus, setFlowManualStatus] = useState<
    Record<string, "idle" | "saving" | "saved" | "error">
  >({});
  const [campaignManualInputs, setCampaignManualInputs] = useState<
    Record<
      string,
      {
        copyRepeats: string;
        personalization: string;
        ctaVisible: string;
        designConsistency: string;
        altTags: string;
        linksOk: string;
        planned: string;
        thematicSeries: string;
        storytelling: string;
        campaignCalendar: string;
        discountHeavy: string;
        seasonal: string;
        excludeFlows: string;
        avoidWelcome: string;
        engagedAligned: string;
        note: string;
      }
    >
  >({});
  const [campaignManualStatus, setCampaignManualStatus] = useState<
    Record<string, "idle" | "saving" | "saved" | "error">
  >({});
  const [designAuditInputs, setDesignAuditInputs] = useState<Record<string, string>>({});

  const kpiSnapshot = useMemo(() => {
    if (!report) {
      return null;
    }
    const campaignMetricRows = Array.isArray(report.campaignAudit?.metrics?.perCampaign)
      ? (report.campaignAudit?.metrics?.perCampaign as Array<Record<string, unknown>>)
      : [];
    const campaignMetricItems = campaignMetricRows
      .map((row) => ({
        id: readString(row.campaignId, row.campaign_id, row.id),
        stats:
          typeof row.statistics === "object" && row.statistics
            ? (row.statistics as Record<string, unknown>)
            : null,
      }))
      .filter((item) => item.id);
    const campaignMetricById = new Map(
      campaignMetricItems.map((item) => [item.id, item.stats] as [string, Record<string, unknown> | null])
    );
    const campaignRevenueRows = Array.from(campaignMetricById.entries()).map(([id, stats]) => ({
      id,
      revenue: readNumber(
        stats?.conversion_value,
        stats?.conversionValue,
        stats?.revenue,
        stats?.revenue_total,
      ),
      revenuePerRecipient: readNumber(
        stats?.revenue_per_recipient,
        stats?.revenuePerRecipient,
      ),
      clickRate: readNumber(stats?.click_rate, stats?.clickRate),
      conversionRate: readNumber(stats?.conversion_rate, stats?.conversionRate),
      spamRate: readNumber(stats?.spam_complaint_rate, stats?.spamRate),
      unsubRate: readNumber(stats?.unsubscribe_rate, stats?.unsubRate),
      bounceRate: readNumber(stats?.bounce_rate, stats?.bounceRate),
    }));
    const revenueFromCampaigns = campaignRevenueRows
      .map((row) => row.revenue)
      .filter((value): value is number => typeof value === "number")
      .reduce((acc, value) => acc + value, 0);
    const topCampaignRevenues = campaignRevenueRows
      .map((row) => row.revenue)
      .filter((value): value is number => typeof value === "number")
      .sort((a, b) => b - a);
    const revenueTop3 = topCampaignRevenues.slice(0, 3).reduce((acc, value) => acc + value, 0);
    const avgCampaignRevenuePerRecipient = campaignRevenueRows
      .map((row) => row.revenuePerRecipient)
      .filter((value): value is number => typeof value === "number");
    const avgCampaignRevenuePerRecipientValue =
      avgCampaignRevenuePerRecipient.length > 0
        ? avgCampaignRevenuePerRecipient.reduce((acc, value) => acc + value, 0) /
          avgCampaignRevenuePerRecipient.length
        : null;
    const avgCampaignUnsub = campaignRevenueRows
      .map((row) => row.unsubRate)
      .filter((value): value is number => typeof value === "number");
    const avgCampaignSpam = campaignRevenueRows
      .map((row) => row.spamRate)
      .filter((value): value is number => typeof value === "number");
    const avgCampaignBounce = campaignRevenueRows
      .map((row) => row.bounceRate)
      .filter((value): value is number => typeof value === "number");

    const flowMetricRows = Array.isArray(report.flowAudit?.metrics?.perFlow)
      ? (report.flowAudit?.metrics?.perFlow as Array<Record<string, unknown>>)
      : [];
    const flowRevenueValues = flowMetricRows
      .map((row) =>
        readNumber(
          row.revenue30,
          row.revenue_30d,
          row.revenue30d,
          row.revenue,
          row.revenue_30,
        ),
      )
      .filter((value): value is number => typeof value === "number");
    const revenueFromFlows = flowRevenueValues.reduce((acc, value) => acc + value, 0);
    const totalRevenue = revenueFromCampaigns + revenueFromFlows;
    const flowRevenueShare = totalRevenue > 0 ? (revenueFromFlows / totalRevenue) * 100 : null;
    const campaignRevenueShare = totalRevenue > 0 ? (revenueFromCampaigns / totalRevenue) * 100 : null;

    const avgFlowRevenuePerRecipient = null;
    const avgFlowUnsub = null;
    const avgFlowSpam = null;
    const avgFlowBounce = null;
    const avgFlowClick = null;
    const avgFlowConversion = null;

    const segmentRevenueMap = new Map<string, number>();
    const campaigns = report.campaigns ?? [];
    campaigns.forEach((campaign) => {
      const stats = campaignMetricById.get(campaign.id);
      const revenue = readNumber(stats?.conversion_value, stats?.revenue, stats?.revenue_total);
      if (typeof revenue !== "number") return;
      const segmentNames = campaign.audience?.includedSegments.map((item) => item.name) ?? [];
      if (segmentNames.length === 0) return;
      segmentNames.forEach((name) => {
        segmentRevenueMap.set(name, (segmentRevenueMap.get(name) ?? 0) + revenue);
      });
    });
    const topSegmentRevenue = Math.max(0, ...Array.from(segmentRevenueMap.values()));
    const topSegmentShare = totalRevenue > 0 ? (topSegmentRevenue / totalRevenue) * 100 : null;

    const engagementSeries = [
      { label: "Engaged 30", value: report.activity?.active30 ?? 0 },
      { label: "Engaged 90", value: report.activity?.active90 ?? 0 },
      { label: "180+", value: report.activity?.inactive180plus ?? 0 },
    ];

    const efficiencyCampaign = {
      clickRate:
        campaignRevenueRows
          .map((row) => row.clickRate)
          .filter((value): value is number => typeof value === "number")
          .reduce((acc, value, _, arr) => acc + value / arr.length, 0) || null,
      conversionRate:
        campaignRevenueRows
          .map((row) => row.conversionRate)
          .filter((value): value is number => typeof value === "number")
          .reduce((acc, value, _, arr) => acc + value / arr.length, 0) || null,
      revenuePerClick:
        campaignRevenueRows
          .map((row) => {
            if (row.revenue && row.clickRate) {
              return row.revenue / Math.max(row.clickRate, 1);
            }
            return null;
          })
          .filter((value): value is number => typeof value === "number")
          .reduce((acc, value, _, arr) => acc + value / arr.length, 0) || null,
    };

    return {
      revenueFromCampaigns,
      revenueFromFlows,
      totalRevenue,
      flowRevenueShare,
      campaignRevenueShare,
      revenueTop3,
      topSegmentShare,
      avgCampaignRevenuePerRecipientValue,
      avgCampaignUnsub,
      avgCampaignSpam,
      avgCampaignBounce,
      avgFlowRevenuePerRecipient,
      avgFlowUnsub,
      avgFlowSpam,
      avgFlowBounce,
      avgFlowClick,
      avgFlowConversion,
      efficiencyCampaign,
      engagementSeries,
      campaignRevenueRows,
    };
  }, [report]);
  const renderSegmentTile = (title: string, items: string[], smallSample: boolean) => (
    <div className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{title}</p>
      <div className="mt-3 grid gap-1 text-xs text-slate-700">
        {items.length > 0 ? (
          items.map((item, idx) => <p key={`${title}-${idx}`}>{item}</p>)
        ) : (
          <p className="text-slate-500">
            {smallSample ? "Ograniczona istotność (mała próba)." : "Brak sygnałów."}
          </p>
        )}
      </div>
    </div>
  );
  const [formOverrideInputs, setFormOverrideInputs] = useState<
    Record<
      string,
      {
        zeroPartyData: string;
        note: string;
        flowId: string;
        excludesSubscribed: string;
        discountInWelcome: string;
        zeroPartyUsedInFlow: string;
        offerCodeMethod: string;
      }
    >
  >({});
  const [formOverrideStatus, setFormOverrideStatus] = useState<
    Record<string, "idle" | "saving" | "saved" | "error">
  >({});
  const [reports, setReports] = useState<AuditReportMeta[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<AuditReportDetail | null>(null);
  const [reportContent, setReportContent] = useState<AuditReportContent | null>(null);
  const [reportStatus, setReportStatus] = useState<"draft" | "final">("draft");
  const flowNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const flow of report?.flows ?? []) {
      if (flow.id) map.set(flow.id, flow.name);
    }
    return map;
  }, [report?.flows]);
  const invalidOwnerEmail = ownerEmailInput.length > 0 && !emailPattern.test(normalizeEmailValue(ownerEmailInput));
  const invalidInternalEmails = internalEmailsInput
    .map((item) => item.trim())
    .filter((item) => item.length > 0 && !emailPattern.test(normalizeEmailValue(item)));

  const handleExport = useCallback(async (category: "all" | "verified" | "unverified") => {
    if (exportingCategory) return;
    setExportingCategory(category);
    try {
      const response = await fetch(`/api/clients/list-audit/export?category=${category}`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Export failed");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const filename =
        category === "verified"
          ? "klaviyo-verified-emails.xlsx"
          : category === "unverified"
            ? "klaviyo-unverified-emails.xlsx"
            : "klaviyo-all-emails.xlsx";
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Nie udalo sie wyeksportowac danych.");
    } finally {
      setExportingCategory(null);
    }
  }, [exportingCategory]);

  const saveInternalConfig = useCallback(async (override?: { ownerEmail?: string; internalEmails?: string[] }) => {
    setInternalSaveStatus("saving");
    const internalEmails =
      override?.internalEmails ??
      internalEmailsInput
        .map((item) => item.trim().toLowerCase())
        .filter((item) => item.length > 0);
    const ownerEmail = (override?.ownerEmail ?? ownerEmailInput).trim().toLowerCase();
    try {
      const response = await fetch("/api/clients/profile-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerEmail: ownerEmail.length > 0 ? ownerEmail : null,
          internalEmails,
          deviceMobileShare:
            deviceMobileShareInput.trim().length > 0
              ? Number(deviceMobileShareInput.replace(",", "."))
              : null,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { data?: { ownerEmail?: string | null; internalEmails?: string[] } }
        | { error?: string };
      if (!response.ok || !("data" in (payload ?? {}))) {
        throw new Error("Save failed");
      }
      const data = (payload as { data: { ownerEmail?: string | null; internalEmails?: string[] } }).data;
      setActiveContact((current) =>
        current
          ? {
              ...current,
              ownerEmail: data.ownerEmail ?? null,
              internalEmails: data.internalEmails ?? [],
              deviceMobileShare:
                typeof (data as { deviceMobileShare?: number | null }).deviceMobileShare === "number"
                  ? (data as { deviceMobileShare?: number | null }).deviceMobileShare ?? null
                  : current.deviceMobileShare ?? null,
            }
          : current,
      );
      setInternalSaveStatus("saved");
      setTimeout(() => setInternalSaveStatus("idle"), 2000);
    } catch {
      setInternalSaveStatus("error");
      setTimeout(() => setInternalSaveStatus("idle"), 2000);
    }
  }, [ownerEmailInput, internalEmailsInput, deviceMobileShareInput]);

  const runAudit = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/clients/list-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ debug: true }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { data?: ListAuditReport; error?: string }
        | null;
      if (!response.ok || !payload?.data) {
        setError(payload?.error ?? "Nie udalo sie pobrac danych audytu.");
        return;
      }
      setReport(payload.data);
    } catch {
      setError("Blad polaczenia podczas pobierania audytu listy.");
    } finally {
      setLoading(false);
    }
  }, []);

  const buildAuditReportContent = useCallback((): AuditReportContent => {
    const generatedAt = new Date().toISOString();
    const clientName = activeContact?.clientName ?? "Klient";
    const totalProfiles = report?.base?.totalProfiles ?? 0;
    const sampledProfiles = report?.sampledProfiles ?? 0;
    const microSample = totalProfiles > 0 && totalProfiles < 10;
    const smallSample = totalProfiles < 50 || sampledProfiles < 50;

    const flowsCount = report?.flows?.length ?? 0;
    const campaigns = report?.campaigns ?? [];
    const campaignsCount30 = campaigns.filter((campaign) => {
      if (!campaign.sendTime) return false;
      return Date.now() - new Date(campaign.sendTime).getTime() <= 30 * 86400000;
    }).length;
    const campaignsCount90 = campaigns.filter((campaign) => {
      if (!campaign.sendTime) return false;
      return Date.now() - new Date(campaign.sendTime).getTime() <= 90 * 86400000;
    }).length;

    const listSize = totalProfiles;
    const engagedNames = report?.segmentAudit?.keySegmentsFound.engaged ?? [];
    const hasEngaged30 = engagedNames.some((name) => /30/.test(name));
    const hasEngaged60 = engagedNames.some((name) => /60/.test(name));
    const hasEngaged90 = engagedNames.some((name) => /90/.test(name));

    const inactive180 = report?.activity?.inactive180plus ?? 0;
    const active30 = report?.activity?.active30 ?? 0;
    const engagedRatio = report?.activity?.activeVsInactivePercent?.active90Percent ?? null;

    const flowShare = kpiSnapshot?.flowRevenueShare ?? null;
    const totalRevenue = kpiSnapshot?.totalRevenue ?? 0;
    const top3Share = totalRevenue > 0 ? (kpiSnapshot?.revenueTop3 ?? 0) / totalRevenue : null;
    const topSegmentShare = kpiSnapshot?.topSegmentShare ?? null;
    const avgCampaignUnsub =
      kpiSnapshot?.avgCampaignUnsub?.length
        ? kpiSnapshot.avgCampaignUnsub.reduce((acc, v) => acc + v, 0) / kpiSnapshot.avgCampaignUnsub.length
        : null;
    const avgCampaignSpam =
      kpiSnapshot?.avgCampaignSpam?.length
        ? kpiSnapshot.avgCampaignSpam.reduce((acc, v) => acc + v, 0) / kpiSnapshot.avgCampaignSpam.length
        : null;
    const avgCampaignBounce =
      kpiSnapshot?.avgCampaignBounce?.length
        ? kpiSnapshot.avgCampaignBounce.reduce((acc, v) => acc + v, 0) / kpiSnapshot.avgCampaignBounce.length
        : null;

    const sendsToInactive = (report?.activity?.campaignsToInactivePercent ?? 0) > 0;
    const exclusionsMissing = report?.suppression?.hasSunsetPolicy === false;
    const reputationRisk =
      (typeof avgCampaignSpam === "number" && avgCampaignSpam > 0.1) ||
      (typeof avgCampaignBounce === "number" && avgCampaignBounce > 0.5) ||
      (typeof avgCampaignUnsub === "number" && avgCampaignUnsub > 0.8) ||
      sendsToInactive ||
      exclusionsMissing;

    const flowRevenueLow = typeof flowShare === "number" && flowShare < 30;
    const flowRevenueHigh = typeof flowShare === "number" && flowShare > 40;
    const revenueConcentrated = typeof top3Share === "number" && top3Share > 0.6;
    const segmentConcentrated = typeof topSegmentShare === "number" && topSegmentShare > 50;
    const engagementDecay = inactive180 > active30;

    let phase = "System w fazie przejściowej";
    if (reputationRisk) {
      phase = "System Zagrożony Reputacyjnie";
    } else if (campaignsCount30 === 0 && flowsCount === 0) {
      phase = "System Nieaktywny";
    } else if (campaignsCount30 > 0 && flowsCount === 0) {
      phase = "System Promocyjny";
    } else if (flowsCount > 0 && flowRevenueLow) {
      phase = "System Niedoautomatyzowany";
    } else if (flowsCount > 0 && flowRevenueHigh && !revenueConcentrated) {
      phase = "System Stabilny";
    }
    if (smallSample) {
      phase = phase + " (orientacyjnie)";
    }

    const dominantProblem = (() => {
      if (reputationRisk) return "ryzyko reputacyjne";
      if (campaignsCount30 === 0 && flowsCount === 0) return "brak komunikacji";
      if (flowsCount === 0 || flowRevenueLow) return "brak automatyzacji";
      if (engagementDecay) return "starzenie bazy";
      if (revenueConcentrated || segmentConcentrated) return "koncentracja revenue";
      return "niska efektywność";
    })();

    const dominantMechanism = (() => {
      if (reputationRisk) return "presja wysyłkowa do nieaktywnych podnosi unsub/spam";
      if (campaignsCount30 === 0 && flowsCount === 0) return "brak kampanii i flow blokuje testy oferty";
      if (flowsCount === 0 || flowRevenueLow) return "brak automatyzacji utrzymuje zależność od kampanii";
      if (engagementDecay) return "rosnący 180+ obniża efektywność kampanii";
      if (revenueConcentrated || segmentConcentrated) return "przychód zależy od jednego źródła";
      return "słaba efektywność ogranicza revenue per recipient";
    })();

    const biggestGap = (() => {
      if (flowsCount === 0) return "brak podstawowych flow (Welcome/Cart/Post‑Purchase/Winback)";
      if (campaignsCount30 === 0) return "brak cyklicznych kampanii sprzedażowych";
      if (!hasEngaged30 || !hasEngaged60 || !hasEngaged90) return "brak warstw engaged 30/60/90 + wykluczeń 180+";
      if (reputationRisk) return "brak kontroli reputacji (wykluczenia, higiena bazy)";
      return "brak dywersyfikacji przychodu";
    })();

    const goal = (() => {
      if (dominantProblem === "ryzyko reputacyjne") {
        return "Obniżyć presję reputacyjną: ograniczyć wysyłki do nieaktywnych i ustabilizować unsub/spam.";
      }
      if (dominantProblem === "brak komunikacji") {
        return listSize < 5000
          ? "Uruchomić 2–4 kampanie miesięcznie oraz 1 podstawowy flow."
          : "Uruchomić plan kampanii 1–2/tydz. oraz fundament flow.";
      }
      if (dominantProblem === "brak automatyzacji") {
        return "Podnieść udział automatyzacji do min. 35% revenue, wdrażając kluczowe flow.";
      }
      if (dominantProblem === "starzenie bazy") {
        return "Zbudować engaged 30/60/90 i ograniczyć 180+ w kampaniach.";
      }
      if (dominantProblem === "koncentracja revenue") {
        return "Zdywersyfikować przychód: obniżyć udział top 3 kampanii poniżej 60%.";
      }
      return "Podnieść efektywność kampanii bez zwiększania presji wysyłkowej.";
    })();

    const goalMetric =
      dominantProblem === "ryzyko reputacyjne"
        ? "unsub < 0.5% i spam < 0.1%"
        : dominantProblem === "brak automatyzacji"
          ? "flow revenue share ≥ 35%"
          : dominantProblem === "brak komunikacji"
            ? "min. 1 kampania/tydz."
            : dominantProblem === "koncentracja revenue"
              ? "top 3 ≤ 60% revenue"
              : "revenue/recipient rośnie";

    const dataState = microSample ? "mikro" : smallSample ? "orientacyjny" : "pełny";
    const dataStateReason = microSample
      ? "próba < 10 kontaktów"
      : smallSample
        ? "próba < 50 kontaktów"
        : "pełny zakres 30–90 dni";

    const actions: Array<{
      id: string;
      phase: "critical" | "growth" | "optimization";
      kind: "reputation" | "segment" | "flow" | "campaign" | "ux" | "baseline";
      condition: string;
      title: string;
      why: string;
      action: string;
      effect: string;
      metric: string;
      impact: number;
      risk: number;
      effort: number;
    }> = [];

    if (reputationRisk) {
      actions.push({
        id: "reputation-stabilize",
        phase: "critical",
        kind: "reputation",
        condition: "IF spam/bounce/unsub > próg lub wysyłki do 180+ bez wykluczeń",
        title: "Stabilizacja reputacji",
        why: "presja reputacyjna ogranicza skalowanie",
        action: "Zawęzić kampanie do engaged i wykluczyć 180+; wstrzymać masowe wysyłki",
        effect: "stabilny spam/unsub",
        metric: "unsub < 0.5%, spam < 0.1%",
        impact: 5,
        risk: 5,
        effort: 3,
      });
    }

    if (!hasEngaged30 || !hasEngaged60 || !hasEngaged90) {
      actions.push({
        id: "engaged-layers",
        phase: "growth",
        kind: "segment",
        condition: "IF brak engaged 30/60/90",
        title: "Segmentacja engaged",
        why: "brak kontroli cyklu życia bazy",
        action: "Zbudować engaged 30/60/90 i wdrożyć wykluczenie 180+",
        effect: "mniejsza presja wysyłkowa",
        metric: "engaged 30 > 20% bazy",
        impact: 4,
        risk: 4,
        effort: 3,
      });
    }

    if (campaignsCount30 === 0) {
      actions.push({
        id: "start-campaigns",
        phase: "growth",
        kind: "campaign",
        condition: "IF kampanie 30d = 0",
        title: "Uruchomić cykl kampanii",
        why: "brak komunikacji manualnej ogranicza skalowanie",
        action:
          listSize < 5000
            ? "Wprowadzić 1 kampanię/tydz. po wdrożeniu engaged + wykluczeń"
            : listSize < 50000
              ? "Wprowadzić 1–2 kampanie tygodniowo do engaged"
              : "Wprowadzić 2–3 kampanie tygodniowo z wykluczeniem 180+",
        effect: "stabilizacja rytmu komunikacji",
        metric: "kampanie 90d > 0",
        impact: 4,
        risk: 3,
        effort: 3,
      });
    }

    if (flowsCount === 0) {
      actions.push({
        id: "build-flow-core",
        phase: "growth",
        kind: "flow",
        condition: "IF flows_count = 0",
        title: "Wdrożenie flow (harmonogram)",
        why: "brak flow obniża stabilność przychodu",
        action:
          "T1 Welcome → T2 Cart Recovery (jeśli koszyk) → T3 Post‑Purchase → T4 Winback (max 1 flow/tydz.)",
        effect: "wzrost udziału automatyzacji",
        metric: "flow revenue share ≥ 35%",
        impact: 5,
        risk: 4,
        effort: 4,
      });
    } else if (flowRevenueLow) {
      actions.push({
        id: "scale-flow",
        phase: "growth",
        kind: "flow",
        condition: "IF flow revenue < 30%",
        title: "Zwiększyć udział automatyzacji",
        why: "niski udział flow utrzymuje zależność od kampanii",
        action: "Rozbudować kluczowe flow i ich zakres (max 1 flow/tydz.)",
        effect: "stabilniejszy przychód",
        metric: "flow revenue share ≥ 35%",
        impact: 4,
        risk: 3,
        effort: 4,
      });
    }

    if (revenueConcentrated || segmentConcentrated) {
      actions.push({
        id: "diversify-revenue",
        phase: "growth",
        kind: "campaign",
        condition: "IF top 3 > 60% revenue lub top segment > 50%",
        title: "Dywersyfikacja revenue",
        why: "koncentracja zwiększa ryzyko niestabilności",
        action: "Rozszerzyć liczbę kampanii i segmentów tematycznych",
        effect: "niższa koncentracja przychodu",
        metric: "top 3 ≤ 60% revenue",
        impact: 4,
        risk: 4,
        effort: 3,
      });
    }

    if (!smallSample) {
      actions.push({
        id: "optimize-ux",
        phase: "optimization",
        kind: "ux",
        condition: "IF reputacja OK i system operacyjny działa",
        title: "Dopracować UX i CTA",
        why: "poprawa konwersji bez zwiększania wolumenu",
        action: "Ujednolicić CTA, mobile i alt text",
        effect: "wyższy CTR",
        metric: "click > 1.5%",
        impact: 3,
        risk: 2,
        effort: 2,
      });
    } else {
      actions.push({
        id: "baseline-data",
        phase: "growth",
        kind: "baseline",
        condition: "IF próba mikro/orientacyjna",
        title: "Zbudować bazową warstwę danych",
        why: "próba jest zbyt mała do silnych wniosków",
        action: "Ustawić podstawowy rytm kampanii i flow, aby zebrać dane operacyjne",
        effect: "wiarygodna analiza po 30–60 dniach",
        metric: "metryka: do zbierania",
        impact: 3,
        risk: 3,
        effort: 2,
      });
    }

    const limitFlowPerWeek = (items: typeof actions) => {
      const flowItems = items.filter((item) => item.kind === "flow");
      if (flowItems.length <= 1) return items;
      return items.filter((item) => item.kind !== "flow").concat(flowItems.slice(0, 1));
    };

    const criticalItems = (() => {
      const base = actions.filter((item) => item.phase === "critical");
      if (reputationRisk) {
        return base.filter((item) => item.kind === "reputation" || item.kind === "segment");
      }
      return base;
    })();

    const growthItems = actions.filter((item) => item.phase === "growth");
    const optimizationItems = actions.filter((item) => item.phase === "optimization");

    const planSteps = [
      {
        week: "Tydzień 1–2 (Krytyczne)",
        items: limitFlowPerWeek(criticalItems).slice(0, 2),
      },
      {
        week: "Tydzień 2–3 (Wzrostowe)",
        items: limitFlowPerWeek(growthItems).slice(0, 3),
      },
      {
        week: "Tydzień 3–4 (Optymalizacyjne)",
        items: optimizationItems.slice(0, 3),
      },
    ];

    const planHtml = planSteps
      .filter((step) => step.items.length > 0)
      .map((step) => {
        const list = step.items
          .map(
            (item) =>
              `<li><strong>${item.title}</strong> – ${item.action}. <em>Dlaczego:</em> ${item.why}. <em>Metryka:</em> ${
                item.metric || "do zbierania"
              }. <em>Warunek:</em> ${item.condition}.</li>`,
          )
          .join("");
        return `<h4>${step.week}</h4><ul>${list}</ul>`;
      })
      .join("");

    const kpis = (() => {
      if (smallSample) {
        return [
          flowShare !== null ? `Flow revenue share: ${flowShare.toFixed(1)}%` : null,
          `Kampanie 30 dni: ${campaignsCount30}`,
          engagedRatio !== null ? `% engaged 90: ${engagedRatio.toFixed(1)}%` : null,
        ];
      }
      if (phase.includes("Promocyjny") || phase.includes("Niedoautomatyzowany")) {
        return [
          flowShare !== null ? `Flow revenue share: ${flowShare.toFixed(1)}%` : null,
          top3Share !== null ? `Top 3 revenue share: ${(top3Share * 100).toFixed(0)}%` : null,
          engagedRatio !== null ? `% engaged 90: ${engagedRatio.toFixed(1)}%` : null,
          avgCampaignUnsub !== null ? `Unsub (kampanie): ${avgCampaignUnsub.toFixed(2)}%` : null,
        ];
      }
      if (phase.includes("Zagrożony")) {
        return [
          avgCampaignSpam !== null ? `Spam (kampanie): ${avgCampaignSpam.toFixed(2)}%` : null,
          avgCampaignBounce !== null ? `Bounce (kampanie): ${avgCampaignBounce.toFixed(2)}%` : null,
          avgCampaignUnsub !== null ? `Unsub (kampanie): ${avgCampaignUnsub.toFixed(2)}%` : null,
          engagedRatio !== null ? `% engaged 90: ${engagedRatio.toFixed(1)}%` : null,
        ];
      }
      return [
        kpiSnapshot?.avgCampaignRevenuePerRecipientValue !== null
          ? `Revenue per recipient (kampanie): ${kpiSnapshot.avgCampaignRevenuePerRecipientValue.toFixed(2)}`
          : null,
        flowShare !== null ? `Automation coverage: ${flowShare.toFixed(1)}%` : null,
        engagedRatio !== null ? `% engaged 90: ${engagedRatio.toFixed(1)}%` : null,
        top3Share !== null ? `Top 3 revenue share: ${(top3Share * 100).toFixed(0)}%` : null,
      ];
    })()
      .filter(Boolean)
      .slice(0, 5) as string[];

    const problems = [
      reputationRisk
        ? "Presja reputacyjna (unsub/spam/bounce + wysyłki do nieaktywnych) ogranicza skalowanie."
        : null,
      campaignsCount90 === 0
        ? "Brak regularnych kampanii → brak warstwy komunikacji manualnej."
        : null,
      flowsCount === 0 || flowRevenueLow
        ? "Słaba automatyzacja → przychód zależny od kampanii."
        : null,
      engagementDecay
        ? "Starzenie bazy (180+ rośnie szybciej niż engaged 30)."
        : null,
      revenueConcentrated || segmentConcentrated
        ? "Wysoka koncentracja revenue → niestabilność przychodu."
        : null,
    ]
      .filter(Boolean)
      .slice(0, 5)
      .map((item) => `<li>${item}</li>`)
      .join("");

    const priorityRows = actions
      .map((item) => ({
        ...item,
        priorityScore: (item.impact + item.risk) * 2 - item.effort,
      }))
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 3)
      .map(
        (item) =>
          `<tr><td>${item.title}</td><td>${item.impact}</td><td>${item.risk}</td><td>${item.effort}</td><td>${item.priorityScore}</td></tr>`,
      )
      .join("");

    let multiplier = 1.0;
    if (revenueConcentrated) multiplier -= 0.05;
    if (segmentConcentrated) multiplier -= 0.05;
    if (flowShare !== null && flowShare < 30) multiplier -= 0.1;
    if (engagementDecay) multiplier -= 0.05;
    if (reputationRisk) multiplier -= 0.1;
    if (campaignsCount90 === 0) multiplier -= 0.1;
    if (flowsCount === 0) multiplier -= 0.1;
    if (multiplier < 0.7) multiplier = 0.7;
    if (multiplier > 1.05) multiplier = 1.05;

    const systemDiagnosis = `Dominujący problem: ${dominantProblem}. Mechanizm: ${dominantMechanism}.`;
    const strategicComment = `Priorytetem jest ${dominantProblem}. Realizacja planu 30 dni ma ustabilizować przychód i ograniczyć presję reputacyjną.`;

    const topPriorities = actions
      .map((item) => ({
        ...item,
        priorityScore: (item.impact + item.risk) * 2 - item.effort,
      }))
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .filter((item, idx, arr) => arr.findIndex((other) => other.id === item.id) === idx)
      .slice(0, 3)
      .map((item) => `<li>${item.title} (${item.priorityScore})</li>`)
      .join("");

    return {
      sections: [
        {
          id: "executive",
          title: "Executive Summary",
          body: `<h3>Email Marketing Audit – 30-Day Strategic Direction</h3>
            <p><strong>Klient:</strong> ${clientName}</p>
            <p><strong>Stan danych:</strong> ${dataState} – ${dataStateReason}.</p>
            <p><strong>Aktualna faza systemu:</strong> ${phase}</p>
            <p>${systemDiagnosis}</p>
            <p><strong>Największa luka:</strong> ${biggestGap}.</p>
            <p><strong>Cel 30 dni:</strong> ${goal} <em>Metryka:</em> ${goalMetric}.</p>`,
        },
        {
          id: "plan",
          title: "Plan wdrożeniowy – 30 dni",
          body: planHtml || "<p>Brak zdefiniowanych działań do wdrożenia.</p>",
        },
        {
          id: "kpi",
          title: "Kluczowe KPI do monitorowania",
          body: `<ul>${kpis.map((item) => `<li>${item}</li>`).join("")}</ul>`,
        },
        {
          id: "problems",
          title: "Top problemy systemowe",
          body: `<ul>${problems || "<li>Brak zidentyfikowanych problemów krytycznych.</li>"}</ul>`,
        },
        {
          id: "priorities",
          title: "Priorytety (Wpływ × Ryzyko × Wysiłek)",
          body: `<table><thead><tr><th>Działanie</th><th>Wpływ</th><th>Ryzyko</th><th>Wysiłek</th><th>Priorytet</th></tr></thead><tbody>${priorityRows}</tbody></table>`,
        },
        {
          id: "top-priorities",
          title: "TOP 3 priorytety",
          body: `<ul>${topPriorities}</ul>`,
        },
        {
          id: "global",
          title: "Global KPI & Business Impact",
          body: `<ul>
            <li>Revenue split: Flow ${flowShare !== null ? flowShare.toFixed(1) : "—"}% / Kampanie ${
              kpiSnapshot?.campaignRevenueShare !== null ? kpiSnapshot.campaignRevenueShare.toFixed(1) : "—"
            }%</li>
            <li>Koncentracja revenue (Top 3): ${
              top3Share !== null ? `${(top3Share * 100).toFixed(0)}%` : "—"
            }</li>
            <li>Engagement decay: Engaged 30 ${active30} → 180+ ${inactive180}</li>
            <li>Reputacja (kampanie): Unsub ${
              avgCampaignUnsub !== null ? `${avgCampaignUnsub.toFixed(2)}%` : "—"
            }, Spam ${avgCampaignSpam !== null ? `${avgCampaignSpam.toFixed(2)}%` : "—"}</li>
          </ul>
          <p><strong>Business Impact Multiplier:</strong> ${multiplier.toFixed(2)}</p>`,
        },
        {
          id: "commentary",
          title: "Komentarz strategiczny",
          body: `<p>${strategicComment}</p>`,
        },
      ],
    };
  }, [activeContact, report, kpiSnapshot]);


  const fetchAuditReports = useCallback(async (clientId: string) => {
    setReportsLoading(true);
    try {
      const res = await fetch(`/api/clients/audit-reports?clientId=${encodeURIComponent(clientId)}`);
      if (!res.ok) return;
      const data = await res.json();
      setReports(Array.isArray(data?.reports) ? data.reports : []);
    } finally {
      setReportsLoading(false);
    }
  }, []);

  const openAuditReport = useCallback(async (reportId: string) => {
    const res = await fetch(`/api/clients/audit-reports/${reportId}`);
    if (!res.ok) return;
    const data = await res.json();
    if (!data?.report) return;
    setSelectedReport(data.report);
    setReportContent(data.report.content);
    setReportStatus((data.report.status as "draft" | "final") ?? "draft");
  }, []);

  const saveAuditReport = useCallback(async () => {
    if (!selectedReport || !reportContent) return;
    await fetch(`/api/clients/audit-reports/${selectedReport.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: reportContent, status: reportStatus }),
    });
  }, [selectedReport, reportContent, reportStatus]);

  const createAuditReport = useCallback(async () => {
    if (!activeContact?.clientId) return;
    const content = buildAuditReportContent();
    const res = await fetch("/api/clients/audit-reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: activeContact.clientId,
        title: `Plan 30 dni – ${activeContact.clientName ?? "klient"}`,
        content,
        snapshot: {},
      }),
    });
    if (!res.ok) return;
    const data = await res.json();
    if (data?.report?.id) {
      await fetchAuditReports(activeContact.clientId);
      openAuditReport(data.report.id);
    }
  }, [activeContact, buildAuditReportContent, fetchAuditReports, openAuditReport]);

  const updateReportSection = useCallback((sectionId: string, html: string) => {
    setReportContent((current) => {
      if (!current) return current;
      return {
        ...current,
        sections: current.sections.map((section) =>
          section.id === sectionId ? { ...section, body: html } : section,
        ),
      };
    });
  }, []);

  const loadContext = useCallback(async () => {
    const response = await fetch("/api/clients/sync/active-contact", { cache: "no-store" });
    const payload = (await response.json().catch(() => null)) as
      | { data?: ActiveContact | null }
      | null;
    setActiveContact(payload?.data ?? null);
  }, []);

  useEffect(() => {
    void loadContext();
  }, [loadContext]);

  useEffect(() => {
    if (!queryClientId) return;
    if (activeContact?.clientId === queryClientId) return;
    const setContext = async () => {
      await fetch("/api/clients/sync/set-active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: queryClientId,
          lastViewPath: "/clients/connect/klaviyo-list-audit",
        }),
      });
      await loadContext();
    };
    void setContext();
  }, [queryClientId, activeContact?.clientId, loadContext]);

  useEffect(() => {
    if (!activeContact) return;
    setOwnerEmailInput(activeContact.ownerEmail ?? activeContact.clientEmail ?? "");
    setInternalEmailsInput(activeContact.internalEmails ?? []);
    setDeviceMobileShareInput(
      typeof activeContact.deviceMobileShare === "number" ? String(activeContact.deviceMobileShare) : "",
    );
  }, [activeContact]);

  useEffect(() => {
    if (!activeContact?.clientId) return;
    void fetchAuditReports(activeContact.clientId);
  }, [activeContact?.clientId, fetchAuditReports]);

  useEffect(() => {
    if (!activeContact || autoSeededInternal) return;
    const hasConfiguredInternal =
      Boolean(activeContact.ownerEmail) || (activeContact.internalEmails ?? []).length > 0;
    if (hasConfiguredInternal) {
      setAutoSeededInternal(true);
      return;
    }
    if (!activeContact.clientEmail) return;
    const seededOwner = normalizeEmailValue(activeContact.clientEmail);
    setOwnerEmailInput(seededOwner);
    void saveInternalConfig({ ownerEmail: seededOwner, internalEmails: [] });
    setAutoSeededInternal(true);
  }, [activeContact, autoSeededInternal, saveInternalConfig]);

  useEffect(() => {
    if (!report?.flowAudit?.manualOverrides) return;
    const initial: typeof flowManualInputs = {};
    Object.entries(report.flowAudit.manualOverrides).forEach(([flowId, data]) => {
      if (!data || typeof data !== "object") return;
      initial[flowId] = {
        offerConsistent: (data as Record<string, unknown>).offerConsistent as string ?? "",
        goal: (data as Record<string, unknown>).goal as string ?? "",
        duplicates: (data as Record<string, unknown>).duplicates as string ?? "",
        competes: (data as Record<string, unknown>).competes as string ?? "",
        timing: (data as Record<string, unknown>).timing as string ?? "",
        dynamicData: (data as Record<string, unknown>).dynamicData as string ?? "",
        smartSegments: (data as Record<string, unknown>).smartSegments as string ?? "",
        abTests: (data as Record<string, unknown>).abTests as string ?? "",
        outdatedContent: (data as Record<string, unknown>).outdatedContent as string ?? "",
        footerCompliance: (data as Record<string, unknown>).footerCompliance as string ?? "",
        note: (data as Record<string, unknown>).note as string ?? "",
      };
    });
    if (Object.keys(initial).length > 0) {
      setFlowManualInputs((prev) => ({ ...prev, ...initial }));
    }
  }, [report?.flowAudit?.manualOverrides]);

  useEffect(() => {
    if (!report?.campaignAudit?.manualOverrides) return;
    const initial: typeof campaignManualInputs = {};
    Object.entries(report.campaignAudit.manualOverrides).forEach(([campaignId, data]) => {
      if (!data || typeof data !== "object") return;
      initial[campaignId] = {
        copyRepeats: (data as Record<string, unknown>).copyRepeats as string ?? "",
        personalization: (data as Record<string, unknown>).personalization as string ?? "",
        ctaVisible: (data as Record<string, unknown>).ctaVisible as string ?? "",
        designConsistency: (data as Record<string, unknown>).designConsistency as string ?? "",
        altTags: (data as Record<string, unknown>).altTags as string ?? "",
        linksOk: (data as Record<string, unknown>).linksOk as string ?? "",
        planned: (data as Record<string, unknown>).planned as string ?? "",
        thematicSeries: (data as Record<string, unknown>).thematicSeries as string ?? "",
        storytelling: (data as Record<string, unknown>).storytelling as string ?? "",
        campaignCalendar: (data as Record<string, unknown>).campaignCalendar as string ?? "",
        discountHeavy: (data as Record<string, unknown>).discountHeavy as string ?? "",
        seasonal: (data as Record<string, unknown>).seasonal as string ?? "",
        excludeFlows: (data as Record<string, unknown>).excludeFlows as string ?? "",
        avoidWelcome: (data as Record<string, unknown>).avoidWelcome as string ?? "",
        engagedAligned: (data as Record<string, unknown>).engagedAligned as string ?? "",
        note: (data as Record<string, unknown>).note as string ?? "",
      };
    });
    if (Object.keys(initial).length > 0) {
      setCampaignManualInputs((prev) => ({ ...prev, ...initial }));
    }
  }, [report?.campaignAudit?.manualOverrides]);

  const saveCampaignManual = useCallback(
    async (campaignId: string, data: typeof campaignManualInputs[string]) => {
      if (!campaignId) return;
      setCampaignManualStatus((prev) => ({ ...prev, [campaignId]: "saving" }));
      try {
        const payload = {
          campaignId,
          data: {
            copyRepeats: data.copyRepeats || null,
            personalization: data.personalization || null,
            ctaVisible: data.ctaVisible || null,
            designConsistency: data.designConsistency || null,
            altTags: data.altTags || null,
            linksOk: data.linksOk || null,
            planned: data.planned || null,
            thematicSeries: data.thematicSeries || null,
            storytelling: data.storytelling || null,
            campaignCalendar: data.campaignCalendar || null,
            discountHeavy: data.discountHeavy || null,
            seasonal: data.seasonal || null,
            excludeFlows: data.excludeFlows || null,
            avoidWelcome: data.avoidWelcome || null,
            engagedAligned: data.engagedAligned || null,
            note: data.note || null,
            updatedAt: new Date().toISOString(),
          },
        };
        const res = await fetch("/api/clients/campaigns-overrides", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          throw new Error("Failed");
        }
        setCampaignManualStatus((prev) => ({ ...prev, [campaignId]: "saved" }));
        setTimeout(() => setCampaignManualStatus((prev) => ({ ...prev, [campaignId]: "idle" })), 1200);
      } catch {
        setCampaignManualStatus((prev) => ({ ...prev, [campaignId]: "error" }));
      }
    },
    [],
  );

  const saveFlowManual = useCallback(
    async (flowId: string, data: typeof flowManualInputs[string]) => {
      if (!flowId) return;
      setFlowManualStatus((prev) => ({ ...prev, [flowId]: "saving" }));
      try {
        const payload = {
          flowId,
          data: {
            offerConsistent: data.offerConsistent || null,
            goal: data.goal || null,
            duplicates: data.duplicates || null,
            competes: data.competes || null,
            timing: data.timing || null,
            dynamicData: data.dynamicData || null,
            smartSegments: data.smartSegments || null,
            abTests: data.abTests || null,
            outdatedContent: data.outdatedContent || null,
            footerCompliance: data.footerCompliance || null,
            note: data.note || null,
            updatedAt: new Date().toISOString(),
          },
        };
        const res = await fetch("/api/clients/flows-overrides", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("save_failed");
        setFlowManualStatus((prev) => ({ ...prev, [flowId]: "saved" }));
        setTimeout(() => setFlowManualStatus((prev) => ({ ...prev, [flowId]: "idle" })), 1200);
      } catch {
        setFlowManualStatus((prev) => ({ ...prev, [flowId]: "error" }));
      }
    },
    [],
  );

  useEffect(() => {
    const forms = report?.signupFormAudit?.kpi?.formPerformance ?? [];
    if (forms.length === 0) return;
    setFormOverrideInputs((prev) => {
      const next = { ...prev };
      for (const form of forms) {
        if (!form.id || next[form.id]) continue;
        const manual = (form.manualOverrides ?? {}) as Record<string, unknown>;
        next[form.id] = {
          zeroPartyData: typeof manual.zeroPartyData === "string" ? manual.zeroPartyData : "",
          note: typeof manual.note === "string" ? manual.note : "",
          flowId: typeof manual.flowId === "string" ? manual.flowId : "",
          excludesSubscribed: typeof manual.excludesSubscribed === "string" ? manual.excludesSubscribed : "",
          discountInWelcome: typeof manual.discountInWelcome === "string" ? manual.discountInWelcome : "",
          zeroPartyUsedInFlow: typeof manual.zeroPartyUsedInFlow === "string" ? manual.zeroPartyUsedInFlow : "",
          offerCodeMethod: typeof manual.offerCodeMethod === "string" ? manual.offerCodeMethod : "",
        };
      }
      return next;
    });
  }, [report?.signupFormAudit?.kpi?.formPerformance]);

  const saveFormOverride = useCallback(
    async (formId: string, baseData: Record<string, unknown> = {}) => {
      if (!formId) return;
      const input =
        formOverrideInputs[formId] ?? {
          zeroPartyData: "",
          note: "",
          flowId: "",
          excludesSubscribed: "",
          discountInWelcome: "",
          zeroPartyUsedInFlow: "",
          offerCodeMethod: "",
        };
      const flowId = input.flowId.trim();
      const flowName =
        flowId === "__none__" ? "Brak flow" : flowId ? flowNameById.get(flowId) ?? "" : "";
      setFormOverrideStatus((prev) => ({ ...prev, [formId]: "saving" }));
      try {
        const payload = {
          formId,
          data: {
            ...baseData,
            zeroPartyData: input.zeroPartyData.trim(),
            note: input.note.trim(),
            flowId: flowId || null,
            flowName: flowName || null,
            excludesSubscribed: input.excludesSubscribed || null,
            discountInWelcome: input.discountInWelcome || null,
            zeroPartyUsedInFlow: input.zeroPartyUsedInFlow || null,
            offerCodeMethod: input.offerCodeMethod.trim() || null,
          },
        };
        const res = await fetch("/api/clients/forms-overrides", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("save_failed");
        setReport((prev) => {
          if (!prev?.signupFormAudit?.kpi?.formPerformance) return prev;
          const nextForms = prev.signupFormAudit.kpi.formPerformance.map((form) =>
            form.id === formId
              ? {
                  ...form,
                  manualOverrides: {
                    ...(form.manualOverrides ?? {}),
                    zeroPartyData: input.zeroPartyData.trim(),
                    note: input.note.trim(),
                    flowId: flowId || null,
                    flowName: flowName || null,
                    excludesSubscribed: input.excludesSubscribed || null,
                    discountInWelcome: input.discountInWelcome || null,
                    zeroPartyUsedInFlow: input.zeroPartyUsedInFlow || null,
                    offerCodeMethod: input.offerCodeMethod.trim() || null,
                  },
                }
              : form,
          );
          return {
            ...prev,
            signupFormAudit: {
              ...prev.signupFormAudit,
              kpi: {
                ...prev.signupFormAudit.kpi,
                formPerformance: nextForms,
              },
            },
          };
        });
        setFormOverrideStatus((prev) => ({ ...prev, [formId]: "saved" }));
      } catch {
        setFormOverrideStatus((prev) => ({ ...prev, [formId]: "error" }));
      }
    },
    [formOverrideInputs, flowNameById],
  );

  useEffect(() => {
    if (!activeContact || report || loading || error) return;
    void runAudit();
  }, [activeContact, report, loading, error, runAudit]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;

    const sendDebug = async (eventType: string, data: Record<string, unknown>) => {
      try {
        await fetch("/api/clients/forms-debug", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventType,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            data,
          }),
        });
      } catch {
        // no-op (debug only)
      }
    };

    const snapshotStorage = () => {
      const cookieKeys = document.cookie
        .split(";")
        .map((item) => item.split("=")[0]?.trim())
        .filter(Boolean);
      const localKeys = Object.keys(window.localStorage ?? {});
      const sessionKeys = Object.keys(window.sessionStorage ?? {});
      const klaviyoKeys = localKeys.filter((key) => key.startsWith("_kl") || key.includes("klaviyo"));
      return {
        cookieKeys,
        localKeys,
        sessionKeys,
        klaviyoKeys,
      };
    };

    let lastSnapshot = snapshotStorage();

    const logStorageDiff = (label: string) => {
      const nextSnapshot = snapshotStorage();
      const addedLocal = nextSnapshot.localKeys.filter((key) => !lastSnapshot.localKeys.includes(key));
      const removedLocal = lastSnapshot.localKeys.filter((key) => !nextSnapshot.localKeys.includes(key));
      const addedCookies = nextSnapshot.cookieKeys.filter((key) => !lastSnapshot.cookieKeys.includes(key));
      const removedCookies = lastSnapshot.cookieKeys.filter((key) => !nextSnapshot.cookieKeys.includes(key));
      sendDebug("storage_diff", {
        label,
        addedLocal,
        removedLocal,
        addedCookies,
        removedCookies,
        klaviyoKeys: nextSnapshot.klaviyoKeys,
      });
      lastSnapshot = nextSnapshot;
    };

    const matchFormNode = (node: Element) =>
      node.tagName.toLowerCase() === "form" &&
      node.querySelector("input[type='email']") &&
      (node.innerHTML.includes("klaviyo") || node.closest("[id*='klaviyo'],[class*='klaviyo']"));

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (matchFormNode(node)) {
            sendDebug("form_shown", {
              formId: node.getAttribute("data-form-id") ?? node.id ?? "unknown",
              className: node.className,
            });
          }
        });
        mutation.removedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.querySelector && node.querySelector("input[type='email']")) {
            sendDebug("form_removed", {
              elementId: node.id ?? "unknown",
            });
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    const submitHandler = (event: Event) => {
      const form = event.target instanceof HTMLFormElement ? event.target : null;
      if (!form) return;
      if (!form.querySelector("input[type='email']")) return;
      sendDebug("form_submit", {
        formId: form.getAttribute("data-form-id") ?? form.id ?? "unknown",
        action: form.getAttribute("action") ?? "",
      });
      logStorageDiff("submit");
    };

    const clickHandler = (event: Event) => {
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (!target) return;
      const label = target.getAttribute("aria-label") ?? "";
      if (label.toLowerCase().includes("close") || target.innerText.toLowerCase().includes("close")) {
        sendDebug("form_close_click", { label });
        logStorageDiff("close");
      }
    };

    document.addEventListener("submit", submitHandler, true);
    document.addEventListener("click", clickHandler, true);

    const originalFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      const url = typeof args[0] === "string" ? args[0] : args[0]?.toString() ?? "";
      if (url.includes("klaviyo")) {
        sendDebug("network_call", { url, method: (args[1]?.method ?? "GET") as string });
      }
      return response;
    };

    const originalXhrOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (
      method: string,
      url: string | URL,
      async?: boolean,
      username?: string | null,
      password?: string | null,
    ) {
      const urlString = url?.toString() ?? "";
      if (urlString.includes("klaviyo")) {
        sendDebug("network_call", { url: urlString, method: method ?? "GET" });
      }
      return originalXhrOpen.call(this, method, url, async ?? true, username ?? null, password ?? null);
    };

    return () => {
      observer.disconnect();
      document.removeEventListener("submit", submitHandler, true);
      document.removeEventListener("click", clickHandler, true);
      window.fetch = originalFetch;
      XMLHttpRequest.prototype.open = originalXhrOpen;
    };
  }, []);

  const saveRawFormDump = async (form: { id: string; name: string; rawAttributes?: Record<string, unknown> }) => {
    if (!form.rawAttributes) return;
    setRawDumpStatus("saving");
    try {
      await fetch("/api/clients/forms-debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "form_raw_dump",
          url: window.location.href,
          timestamp: new Date().toISOString(),
          data: { formId: form.id, formName: form.name, raw: form.rawAttributes },
        }),
      });
      setRawDumpStatus("saved");
      await loadLatestDebugDump();
      setTimeout(() => setRawDumpStatus("idle"), 2000);
    } catch {
      setRawDumpStatus("error");
      setTimeout(() => setRawDumpStatus("idle"), 2000);
    }
  };

  const fetchRawFormFromApi = async (formId: string) => {
    setRawDumpStatus("saving");
    try {
      await fetch("/api/clients/forms-debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "form_raw_fetch",
          data: { formId },
          timestamp: new Date().toISOString(),
        }),
      });
      setRawDumpStatus("saved");
      await loadLatestDebugDump();
      setTimeout(() => setRawDumpStatus("idle"), 2000);
    } catch {
      setRawDumpStatus("error");
      setTimeout(() => setRawDumpStatus("idle"), 2000);
    }
  };

  const loadLatestDebugDump = async () => {
    try {
      const response = await fetch("/api/clients/forms-debug", { method: "GET" });
      const payload = (await response.json().catch(() => null)) as
        | { data?: { createdAt?: string; details?: Record<string, unknown> } | null }
        | null;
      if (!payload?.data) {
        setLatestDebugDump(null);
        setLatestDebugTimestamp(null);
        return;
      }
      setLatestDebugDump(payload.data.details ?? null);
      setLatestDebugTimestamp(payload.data.createdAt ?? null);
    } catch {
      setLatestDebugDump(null);
      setLatestDebugTimestamp(null);
    }
  };

  useEffect(() => {
    const firstFormId = report?.signupFormAudit?.kpi?.formPerformance?.[0]?.id;
  }, [report?.signupFormAudit?.kpi?.formPerformance]);

  const sectionStatuses = useMemo(() => {
    if (!report) return null;
    const contacts: SectionStatus = report.base.totalProfiles > 0 ? "ok" : "fail";
    const consent = (report.consent.invalidExternalCount ?? report.consent.invalidCount ?? 0) > 0
      ? "warning"
      : "ok";
    const sources: SectionStatus = report.sources.distribution.length > 0 ? "ok" : "warning";
    const deliverability: SectionStatus =
      report.deliverability.days30.complaintRate > 0.08 || report.deliverability.days30.bounceRate > 1.2
        ? "warning"
        : "ok";
    const activity: SectionStatus =
      report.activity.inactive90plus > report.activity.active90 ? "warning" : "ok";
    const suppression: SectionStatus = report.suppression.hasSunsetPolicy ? "ok" : "warning";
    return { contacts, consent, sources, deliverability, activity, suppression };
  }, [report]);
  const auditLevel = useMemo(() => {
    if (!report || !sectionStatuses) return { score: 0, label: "N/D", missing: [] as string[] };
    const statuses = Object.values(sectionStatuses);
    const okCount = statuses.filter((s) => s === "ok").length;
    const score = Math.round((okCount / statuses.length) * 100);
    const missing: string[] = [];
    if ((report.base.totalLists ?? report.base.topLists.length) === 0) missing.push("brak list");
    if ((report.base.totalSegments ?? report.base.topSegments.length) === 0) missing.push("brak segmentow");
    if (!report.suppression.hasSunsetPolicy) missing.push("brak sunset policy");
    if (report.deliverability.days30.sent === 0) missing.push("brak danych campaign 30d");
    const label = score >= 85 ? "WYSOKI" : score >= 60 ? "SREDNI" : "NISKI";
    return { score, label, missing };
  }, [report, sectionStatuses]);

  const deliverabilityDashboard = useMemo(() => {
    if (!report) return null;

    const bounce30 = report.deliverability.days30.bounceRate;
    const bounce90 = report.deliverability.days90.bounceRate;
    const complaint30 = report.deliverability.days30.complaintRate;
    const complaint90 = report.deliverability.days90.complaintRate;
    const unsub30 = report.deliverability.days30.unsubscribeRate;
    const unsub90 = report.deliverability.days90.unsubscribeRate;

    const bounceTrend = resolveTrend(bounce30, bounce90);
    const complaintTrend = resolveTrend(complaint30, complaint90);
    const unsubTrend = resolveTrend(unsub30, unsub90);

    const bounceStatus = resolveMetricStatus(bounce30, 0.5, 1);
    const complaintStatus = resolveMetricStatus(complaint30, 0.1, 0.2);
    const unsubStatus = resolveMetricStatus(unsub30, 0.5, 1);

    const sent30 = report.deliverability.days30.sent;
    const sent90 = report.deliverability.days90.sent;
    const lowData = sent90 < 300 || sent30 < 100;

    const suppressionRate = percent(
      report.suppression.suppressedCount,
      Math.max(report.base.totalProfiles, 1),
    );
    const deliveryRate = Math.max(0, Number((100 - bounce30).toFixed(1)));
    const suppressedSendRate = report.activity.campaignsToInactivePercent;
    const spamPenalty = clamp(complaint30 * 300, 0, 40);
    const hardBouncePenalty = clamp(report.deliverability.days30.hardBounceRate * 10, 0, 30);
    const deliveryPenalty = clamp((100 - deliveryRate) * 1, 0, 30);
    const suppressedPenalty = clamp(suppressedSendRate * 1.5, 0, 20);
    const deliverabilityScore = clamp(
      Math.round(100 - (spamPenalty + hardBouncePenalty + deliveryPenalty + suppressedPenalty)),
      0,
      100,
    );
    const suppressionPenalty = clamp(suppressionRate * 1.2, 0, 16);
    const bouncePenalty = clamp(bounce30 * 9, 0, 30);
    const complaintPenalty = clamp(complaint30 * 170, 0, 30);
    const unsubPenalty = clamp(unsub30 * 8, 0, 18);
    const trendPenalty =
      (bounceTrend === "up" ? 4 : 0) +
      (complaintTrend === "up" ? 8 : 0) +
      (unsubTrend === "up" ? 5 : 0);

    const riskScore = clamp(
      Math.round(bouncePenalty + complaintPenalty + unsubPenalty + trendPenalty + suppressionPenalty),
      0,
      100,
    );

    const seriesBounce = buildSeries(bounce90, bounce30);
    const seriesComplaint = buildSeries(complaint90, complaint30);
    const seriesUnsub = buildSeries(unsub90, unsub30);
    const chartMax = Math.max(
      ...seriesBounce,
      ...seriesComplaint,
      ...seriesUnsub,
      0.2,
    );
    const seriesSent = buildSeries(sent90, sent30);
    const sentChartMax = Math.max(...seriesSent, 1);

    const warningPoint =
      complaintTrend === "up" || bounceTrend === "up" || unsubTrend === "up"
        ? "Trend ryzyka rosnacy w ostatnich 30 dniach."
        : "Trend stabilny.";

    const suppressedWeekly = Math.round(report.suppression.suppressedCount / 12);
    const suppressionGrowthStatus: MetricStatus =
      suppressionRate >= 20 ? "Risk" : suppressionRate >= 10 ? "Watch" : "OK";

    const engagedShare30 = percent(
      report.activity.active30,
      Math.max(report.base.totalProfiles, 1),
    );
    const active90Share = report.activity.activeVsInactivePercent.active90Percent;
    const active30Trend = resolveTrend(engagedShare30, active90Share);
    const riskLevel = lowData
      ? "STABLE / LOW DATA"
      : riskScore <= 30
        ? "LOW RISK"
        : riskScore <= 55
          ? "MEDIUM RISK"
          : "HIGH RISK";

    const structureInterpretation =
      engagedShare30 >= 65
        ? "Lista bardzo swieza. Brak segmentow wysokiego ryzyka - mozliwa intensyfikacja wysylek."
        : engagedShare30 >= 45
          ? "Struktura mieszana. Skaluj wysylki ostroznie i ogranicz kontakt do nieaktywnych."
          : "Duzy udzial nieaktywnych. Struktura ogranicza skalowanie i podnosi ryzyko reputacyjne.";

    const diagnosis =
      lowData
        ? "Na tym etapie danych jest za malo, aby wiarygodnie ocenic ryzyko. Potrzebujemy wiekszego wolumenu wysylek."
        : riskScore <= 30
          ? "Sytuacja jest stabilna. Mozesz skalowac wysylki stopniowo bez podwyzszonego ryzyka reputacyjnego."
          : riskScore <= 55
            ? "Ryzyko jest umiarkowane. Warto zawezic targetowanie i pilnowac czestotliwosci wysylek."
            : "Ryzyko jest wysokie. Najpierw popraw jakosc segmentow i ogranicz wysylki do mniej aktywnych kontaktow.";

    const deliverabilityImpact =
      lowData
        ? "Brak wystarczajacej probki danych. Decyzje o skali wysylek warto podejmowac ostroznie."
        : engagedShare30 >= 65
          ? "Wysoki udzial aktywnych kontaktow zwykle wspiera dobra dostarczalnosc i stabilna reputacje nadawcy."
          : engagedShare30 >= 45
            ? "Mieszana struktura odbiorcow moze ograniczac skuteczne skalowanie. Dobra segmentacja jest kluczowa."
            : "Duzy udzial nieaktywnych i dormant kontaktow zwieksza ryzyko spadku dostarczalnosci.";

    return {
      riskScore,
      riskLevel,
      lowData,
      bounce: { value: bounce30, trend: bounceTrend, status: bounceStatus },
      complaint: { value: complaint30, trend: complaintTrend, status: complaintStatus },
      unsub: { value: unsub30, trend: unsubTrend, status: unsubStatus },
      seriesBounce,
      seriesComplaint,
      seriesUnsub,
      seriesSent,
      chartMax,
      sentChartMax,
      warningPoint,
      suppressionRate,
      deliveryRate,
      suppressedSendRate,
      deliverabilityScore,
      suppressedWeekly,
      suppressionGrowthStatus,
      sent30,
      sent90,
      engagedShare30,
      active30Trend,
      structureInterpretation,
      deliverabilityImpact,
      diagnosis,
    };
  }, [report]);

  const consentSourceSummary = useMemo(() => {
    if (!report) {
      return { verified: "brak", notVerified: "brak" };
    }
    const normalize = (source: string) => {
      const value = source.trim().toLowerCase();
      if (value === "klaviyo forms") return "klaviyo";
      if (value === "shopify") return "shopify";
      return value;
    };
    const toSummary = (sources: Array<{ source: string }> | undefined) => {
      if (!sources || sources.length === 0) return "brak";
      const unique = Array.from(new Set(sources.map((item) => normalize(item.source))));
      return unique.join("/");
    };
    return {
      verified: toSummary(report.consent.verifiedAccounts),
      notVerified: toSummary(report.consent.notVerifiedAccounts),
    };
  }, [report]);

  const activityDiagnostics = useMemo(() => {
    if (!report) return null;
    const total = Math.max(report.base.totalProfiles, 1);
    const active30Percent = percent(report.activity.active30, total);
    const active60Percent = percent(report.activity.active60, total);
    const active90Percent = percent(report.activity.active90, total);
    const inactive90PlusPercent = percent(report.activity.inactive90plus, total);
    const dead180PlusPercent = percent(report.activity.inactive180plus, total);
    const dead365PlusPercent = percent(report.activity.inactive365plus ?? 0, total);

    const interpretation = `${active90Percent}% Twojej bazy to osoby, ktore realnie reaguja. ${inactive90PlusPercent}% to osoby nieaktywne, ktore obnizaja jakosc wysylek i z czasem podnosza ryzyko deliverability.`;

    return {
      active30Percent,
      active60Percent,
      active90Percent,
      inactive90PlusPercent,
      dead180PlusPercent,
      dead365PlusPercent,
      interpretation,
    };
  }, [report]);

  const activitySendRisk = useMemo(() => {
    if (!report) return null;
    const share = report.activity.campaignsToInactivePercent;
    const estimate = report.activity.campaignsToInactiveEstimate;

    if (share === 0) {
      return {
        label: "NISKIE",
        className: "border-emerald-200 bg-emerald-50 text-emerald-800",
        message:
          "Nie wysylasz do osob nieaktywnych (90+ dni). To bezpieczny uklad i brak presji reputacyjnej od starszej czesci bazy.",
      };
    }
    if (estimate === "low") {
      return {
        label: "NISKIE",
        className: "border-emerald-200 bg-emerald-50 text-emerald-800",
        message:
          "Niewielka czesc wysylek trafia do osob nieaktywnych. Ryzyko jest pod kontrola, ale warto monitorowac trend co tydzien.",
      };
    }
    if (estimate === "medium") {
      return {
        label: "UMIARKOWANE",
        className: "border-amber-200 bg-amber-50 text-amber-800",
        message:
          "Zauwazalna czesc wysylek trafia do osob nieaktywnych. Warto ograniczyc te wysylki i zawezic grupe odbiorcow.",
      };
    }
    return {
      label: "WYSOKIE",
      className: "border-red-200 bg-red-50 text-red-800",
      message:
        "Duza czesc wysylek trafia do osob nieaktywnych. To podnosi ryzyko pogorszenia dostarczalnosci i wymaga szybkiej korekty.",
    };
  }, [report]);

  const listEntries = useMemo(() => {
    if (!report) return [];
    if ((report.base.listsWithProfiles?.length ?? 0) > 0) return report.base.listsWithProfiles ?? [];
    return report.base.topLists.map((item) => ({ id: item.id, name: item.name, count: item.count }));
  }, [report]);

  const segmentEntries = useMemo(() => {
    if (!report) return [];
    if ((report.base.segmentsWithProfiles?.length ?? 0) > 0) return report.base.segmentsWithProfiles ?? [];
    return report.base.topSegments.map((item) => ({ id: item.id, name: item.name, count: item.count }));
  }, [report]);
  const auditSummary = useMemo(() => {
    if (!report || !deliverabilityDashboard || !activityDiagnostics || !sectionStatuses) return null;

    const works: string[] = [];
    const gaps: string[] = [];
    const notWorking: string[] = [];
    const firstImplementations: string[] = [];

    if (sectionStatuses.contacts === "ok") {
      works.push(`Baza kontaktow jest aktywna (${report.base.totalProfiles} profili, ${report.base.emailContactableProfiles} contactable).`);
    } else {
      notWorking.push("Brak stabilnej bazy kontaktow do oceny.");
    }

    if ((report.consent.invalidExternalCount ?? report.consent.invalidCount ?? 0) === 0) {
      works.push("Warstwa zgod nie wykazuje kontaktow krytycznie niezweryfikowanych.");
    } else {
      const invalidExternal = report.consent.invalidExternalCount ?? report.consent.invalidCount ?? 0;
      notWorking.push(`Wykryto ${invalidExternal} kontaktow bez potwierdzonej zgody.`);
      firstImplementations.push("Nie wysylaj teraz do kontaktow bez potwierdzonej zgody. Najpierw potwierdz zgode lub wyklucz je z wysylek.");
    }

    if (deliverabilityDashboard.lowData) {
      gaps.push("Deliverability ma zbyt mala probe (niski wolumen), wiec score jest orientacyjny.");
      firstImplementations.push("W ciagu 14 dni zrob 2-3 male wysylki tylko do osob aktywnych w ostatnich 60 dniach (bez calej listy).");
      firstImplementations.push("Po kazdej wysylce sprawdz 3 rzeczy: ile maili nie doszlo, ile osob oznaczylo spam i ile osob sie wypisalo.");
    } else if (deliverabilityDashboard.riskScore <= 30) {
      works.push("Reputacja wysylek jest stabilna na aktualnym wolumenie.");
    } else {
      notWorking.push(`Podwyzszone ryzyko wysylek (Risk Score: ${deliverabilityDashboard.riskScore}%).`);
      firstImplementations.push("Do czasu poprawy wynikow wysylaj tylko do najbardziej aktywnych osob z ostatnich 30-60 dni.");
    }

    if (activityDiagnostics.inactive90PlusPercent <= 20) {
      works.push(`Struktura bazy jest swieza (Inactive 90+: ${activityDiagnostics.inactive90PlusPercent}%).`);
    } else {
      gaps.push(`Rosnie udzial nieaktywnych kontaktow (Inactive 90+: ${activityDiagnostics.inactive90PlusPercent}%).`);
      firstImplementations.push("Podziel wysylki wedlug aktywnosci: 0-60 dni regularnie, 61-90 dni rzadziej, powyzej 90 dni tylko osobna wiadomosc przypominajaca.");
    }

    if (!report.suppression.hasSunsetPolicy) {
      gaps.push("Brak zdefiniowanych mechanizmow sunset i re-engagement.");
      firstImplementations.push("Ustal prosta zasade: po 90 dniach bez reakcji ogranicz wysylki, po 180 dniach zapytaj o dalsza zgode na kontakt.");
    } else {
      works.push("Lifecycle governance (sunset/re-engagement) jest aktywne.");
    }

    if ((report.activity.campaignsToInactivePercent ?? 0) > 20) {
      gaps.push(`Wysylki do nieaktywnych sa wysokie (${report.activity.campaignsToInactivePercent}%).`);
      firstImplementations.push("Zmniejsz wysylki do osob nieaktywnych (90+ dni) i ustaw ostrzezenie, gdy ich udzial przekroczy 20%.");
    }

    const uniqueFirstImplementations = Array.from(new Set(firstImplementations)).slice(0, 4);
    const uniqueGaps = Array.from(new Set(gaps));
    const uniqueNotWorking = Array.from(new Set(notWorking));
    const uniqueWorks = Array.from(new Set(works));

    const summaryStatus: SectionStatus =
      sectionStatuses.contacts === "fail" || uniqueNotWorking.length >= 2
        ? "fail"
        : uniqueGaps.length > 0
          ? "warning"
          : "ok";

    return {
      works: uniqueWorks,
      gaps: uniqueGaps,
      notWorking: uniqueNotWorking,
      firstImplementations: uniqueFirstImplementations,
      summaryStatus,
    };
  }, [report, deliverabilityDashboard, activityDiagnostics, sectionStatuses]);

  const signupAuditDashboard = useMemo(() => {
    if (!report?.signupFormAudit) return null;
    const audit = report.signupFormAudit;
    const popupCount = audit.formContexts.find((item) => item.context === "popup")?.count ?? 0;
    const totalForms = Math.max(audit.externalFormsCheck.totalForms, 1);
    const totalEmailForms = Math.max(audit.externalFormsCheck.totalEmailForms, 1);
    const klaviyoForms = audit.formsInKlaviyo.active;
    const externalForms = audit.externalFormsCheck.nonKlaviyoEmailForms;

    const consentScore =
      audit.consentLogic.status === "clear" ? 100 : audit.consentLogic.status === "ambiguous" ? 65 : 50;
    const optInScore =
      audit.optInMechanic.mode === "double_opt_in"
        ? 100
        : audit.optInMechanic.mode === "mixed"
          ? 75
          : audit.optInMechanic.mode === "single_opt_in"
            ? 65
            : 55;
    const integrationScore = audit.integrationWithKlaviyo.status === "ok" ? 95 : 60;
    const sourceCoverageScore = Math.max(45, 100 - externalForms * 10);
    const score = Math.round((consentScore + optInScore + integrationScore + sourceCoverageScore) / 4);

    const verdict =
      score >= 85 ? "Stabilny model zapisu" : score >= 70 ? "Dobry, ale wymaga dopracowania" : "Wymaga porzadku";

    const chips: Array<{ label: string; tone: "ok" | "watch" | "risk" }> = [
      { label: audit.integrationWithKlaviyo.status === "ok" ? "Integracja OK" : "Integracja do sprawdzenia", tone: audit.integrationWithKlaviyo.status === "ok" ? "ok" : "watch" },
      { label: audit.optInMechanic.mode === "double_opt_in" ? "Wyższa jakość zapisu" : "Single opt-in", tone: audit.optInMechanic.mode === "double_opt_in" ? "ok" : "watch" },
      { label: externalForms > 0 ? "Formy poza Klaviyo" : "Źródła spójne", tone: externalForms > 0 ? "risk" : "ok" },
    ];

    const contextRows = audit.formContexts
      .map((item) => ({ label: prettyContext(item.context), count: item.count }))
      .sort((a, b) => b.count - a.count);
    const chartValues = (contextRows.length > 0 ? contextRows : [{ label: "Brak danych", count: 0 }]).map((item) =>
      Math.max(item.count, 0),
    );
    const chartMax = Math.max(...chartValues, 1);
    const linePoints = toPolyline(chartValues, 360, 110, chartMax);
    const areaPoints = linePoints ? `0,110 ${linePoints} 360,110` : "";

    const interpretation =
      externalForms > 0
        ? "Czesc ruchu trafia do formularzy poza Klaviyo. Warto je ujednolicic, aby lepiej kontrolowac jakość kontaktów."
        : "Ruch zapisu jest spójny i łatwiejszy do monitorowania. To dobry fundament do skalowania bazy.";

    const nextActions = [
      {
        title: "Ujednolić punkt zapisu",
        impact: externalForms > 0 ? "Wysoki wpływ" : "Średni wpływ",
        note:
          externalForms > 0
            ? "Przekieruj formularze poza Klaviyo do jednego procesu zapisu."
            : "Zostaw jeden standard zapisu i pilnuj spójności.",
      },
      {
        title: "Doprecyzować zgodę",
        impact: audit.consentLogic.status === "clear" ? "Średni wpływ" : "Wysoki wpływ",
        note: "Komunikat przy zapisie ma jasno mówić, że to zapis na komunikację marketingową.",
      },
      {
        title: "Poprawić śledzenie źródeł",
        impact: "Średni wpływ",
        note: "Każdy nowy zapis powinien mieć jednoznacznie zapisane źródło w profilu.",
      },
    ];

    return {
      score,
      verdict,
      chips,
      popupCount,
      klaviyoForms,
      externalForms,
      totalForms,
      totalEmailForms,
      optInLabel: prettyOptInMode(audit.optInMechanic.mode),
      contextRows,
      linePoints,
      areaPoints,
      interpretation,
      nextActions,
      kpi: audit.kpi,
      topSources: audit.sourceAttribution.topSources,
      qualityChecks: [
        { title: "Intencja użytkownika", status: audit.qualityOfIntent.status, note: audit.qualityOfIntent.note },
        { title: "Tarcie przy zapisie", status: audit.frictionLevel.status, note: audit.frictionLevel.note },
        { title: "Timing formularza", status: audit.timingLogic.status, note: audit.timingLogic.note },
        { title: "Higiena danych wejściowych", status: audit.inputQuality.status, note: audit.inputQuality.note },
        { title: "Flow po zapisie", status: audit.postSignupExperience.status, note: audit.postSignupExperience.note },
        { title: "Mapowanie danych do profilu", status: audit.dataMapping.status, note: audit.dataMapping.note },
        { title: "Obietnica vs rzeczywistość", status: audit.promiseVsReality.status, note: audit.promiseVsReality.note },
      ],
    };
  }, [report]);

  const listQualityScore = useMemo(() => {
    if (!report) return null;
    const totalContacts = report.listQuality?.totalContacts ?? report.base.totalProfiles;
    const freshCount = report.listQuality?.freshConsentCount ?? 0;
    const oldImportCount = report.listQuality?.oldImportCount ?? 0;
    const doiCount = report.listQuality?.doiCount ?? 0;
    const confirmedCount = report.listQuality?.confirmedConsentCount ?? 0;
    const active90Count = report.listQuality?.active90Count ?? 0;
    const inactive180Count = report.listQuality?.inactive180Count ?? 0;

    const freshPct = percent(freshCount, Math.max(totalContacts, 1));
    const oldImportPct = percent(oldImportCount, Math.max(totalContacts, 1));
    const doiPct = percent(doiCount, Math.max(totalContacts, 1));
    const confirmationsPct = percent(confirmedCount, Math.max(totalContacts, 1));
    const active90Pct = percent(active90Count, Math.max(totalContacts, 1));
    const inactive180Pct = percent(inactive180Count, Math.max(totalContacts, 1));

    const acquisitionScore = clamp(
      Math.round((freshPct + doiPct + confirmationsPct + (100 - oldImportPct)) / 4),
      0,
      100,
    );
    const activityScore = clamp(
      Math.round((active90Pct + (100 - inactive180Pct)) / 2),
      0,
      100,
    );
    const score = Math.round((acquisitionScore + activityScore) / 2);
    const minSample = 50;
    const isSmallSample = totalContacts < minSample;

    const label = isSmallSample
      ? "Ocena orientacyjna – próba zbyt mała do pełnej analizy"
      : score >= 80
        ? "Bardzo dobra jakość listy"
        : score >= 60
          ? "Stabilna jakość listy"
          : "Podwyższone ryzyko jakości bazy";

    return {
      score,
      label,
      minSample,
      isSmallSample,
      inputs: {
        totalContacts,
        freshCount,
        oldImportCount,
        doiCount,
        confirmedCount,
        active90Count,
        inactive180Count,
        freshPct,
        oldImportPct,
        doiPct,
        confirmationsPct,
        active90Pct,
        inactive180Pct,
      },
      subscores: { acquisitionScore, activityScore },
    };
  }, [report]);

  const auditScoringSnapshot = useMemo(
    () => ({
      listQuality: listQualityScore,
      sections: {
        listQualityScore: listQualityScore?.score ?? null,
      },
      ready: false,
    }),
    [listQualityScore],
  );

  return (
    <section className="mx-0 flex w-full max-w-none flex-col gap-6 bg-gradient-to-br from-[#e4ebff] via-[#f2f5ff] to-[#dfe7ff] px-4 py-10">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Audyt systemowy</h1>
          <p className="text-sm text-slate-600">Audyt Dostarczalnosci</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void runAudit()}
            disabled={loading}
            className="rounded-lg bg-gradient-to-r from-[#3F4ADB] via-[#4C62FF] to-[#6F86FF] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_30px_-18px_rgba(63,74,219,0.6)] transition hover:brightness-105 disabled:opacity-60"
          >
            {loading ? "Odswiezam..." : "Odswiez audyt"}
          </button>
          <Link
            href="/clients/connect"
            className="rounded-lg border border-white/60 bg-white/70 px-4 py-2 text-sm font-medium text-slate-800 shadow-[0_10px_28px_-20px_rgba(63,74,219,0.35)] backdrop-blur transition hover:bg-white/80"
          >
            Powrot
          </Link>
        </div>
      </header>

      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <p>
          Klient:{" "}
          <strong>
            {activeContact?.clientName || queryClientName || "brak aktywnego kontekstu"}
          </strong>
          {(activeContact?.clientEmail || queryClientEmail)
            ? ` | ${activeContact?.clientEmail ?? queryClientEmail}`
            : ""}
        </p>
        {report && (
          <p className="mt-1 text-xs text-slate-500">
            Raport: {new Date(report.generatedAt).toLocaleString("pl-PL")} | probka profili: {report.sampledProfiles}
          </p>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-900">Wyjątki wewnętrzne</p>
            <p className="text-xs text-slate-500">Te adresy nie wpływają na ocenę zgód i deliverability.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void saveInternalConfig()}
              className="rounded-full bg-gradient-to-r from-[#3F4ADB] via-[#4C62FF] to-[#6F86FF] px-3 py-1 text-xs font-medium text-white shadow-[0_10px_26px_-18px_rgba(63,74,219,0.6)] transition hover:brightness-105"
            >
              {internalSaveStatus === "saving"
                ? "Zapisuję..."
                : internalSaveStatus === "saved"
                  ? "Zapisano"
                  : internalSaveStatus === "error"
                    ? "Błąd zapisu"
                    : "Zapisz"}
            </button>
            <button
              type="button"
              onClick={() => {
                const emails = [ownerEmailInput, ...internalEmailsInput]
                  .map((item) => normalizeEmailValue(item))
                  .filter((item) => item.length > 0);
                const blob = new Blob([emails.join("\n")], { type: "text/plain" });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = "internal-emails.txt";
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
              }}
              className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-[11px] text-slate-600 hover:bg-white"
            >
              Eksport listy
            </button>
          </div>
        </div>
        <div className="mt-3 grid items-start gap-3 sm:grid-cols-3">
          <div className="text-xs text-slate-600">
            Ruch mobile (%)
            <div className="mt-2">
              <input
                value={deviceMobileShareInput}
                onChange={(event) => setDeviceMobileShareInput(event.target.value)}
                placeholder="np. 65"
                inputMode="decimal"
                className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Używane w logice ekspozycji (tylko jeśli podane ręcznie).
            </p>
          </div>
          <div className="text-xs text-slate-600">
            Email właściciela
            <div className="mt-2 flex items-center gap-2">
              <input
                value={ownerEmailInput}
                onChange={(event) => setOwnerEmailInput(event.target.value)}
                onBlur={() => setOwnerEmailInput((current) => normalizeEmailValue(current))}
                placeholder="owner@brand.com"
                className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900"
              />
            </div>
          </div>
          <div className="text-xs text-slate-600">
            Dodatkowe adresy do wykluczenia
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  value={internalEmailsInput[0] ?? ""}
                  onChange={(event) =>
                    setInternalEmailsInput((current) => {
                      const next = [...current];
                      next[0] = event.target.value;
                      return next;
                    })
                  }
                  onBlur={(event) =>
                    setInternalEmailsInput((current) => {
                      const next = [...current];
                      next[0] = normalizeEmailValue(event.target.value);
                      return next;
                    })
                  }
                  placeholder="team@brand.com"
                  className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setInternalEmailsInput((current) => [...current, ""])}
                  className="whitespace-nowrap rounded-full border border-slate-200 px-3 py-1 text-[11px] text-slate-600 hover:bg-slate-50"
                >
                  + Dodaj email
                </button>
              </div>
              {internalEmailsInput.slice(1).map((value, idx) => (
                <div key={`internal-${idx + 1}`} className="flex items-center gap-2">
                  <input
                    value={value}
                    onChange={(event) =>
                      setInternalEmailsInput((current) =>
                        current.map((item, itemIdx) => (itemIdx === idx + 1 ? event.target.value : item)),
                      )
                    }
                    onBlur={(event) =>
                      setInternalEmailsInput((current) =>
                        current.map((item, itemIdx) =>
                          itemIdx === idx + 1 ? normalizeEmailValue(event.target.value) : item,
                        ),
                      )
                    }
                    placeholder="team@brand.com"
                    className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setInternalEmailsInput((current) =>
                        current.filter((_, itemIdx) => itemIdx !== idx + 1),
                      )
                    }
                    className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] text-slate-600"
                  >
                    Usuń
                  </button>
                </div>
              ))}
            </div>
            {invalidInternalEmails.length > 0 && (
              <span className="mt-1 block text-[11px] text-rose-500">
                Niepoprawne adresy: {invalidInternalEmails.join(", ")}.
              </span>
            )}
          </div>
        </div>
        {(!ownerEmailInput && internalEmailsInput.length === 0) ? (
          <p className="mt-2 text-xs text-slate-500">Brak skonfigurowanych wyjątków wewnętrznych.</p>
        ) : null}
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {report && sectionStatuses && (
        <>
          <div className="relative overflow-hidden rounded-[28px] border border-white/50 bg-gradient-to-br from-[#cfd9ff] via-[#e3e9ff] to-[#f7f9ff] p-6 shadow-[0_30px_80px_-45px_rgba(63,74,219,0.45)]">
            <div className="pointer-events-none absolute inset-0 opacity-70">
              <div className="absolute -left-24 -top-28 h-80 w-80 rounded-full bg-[#3F4ADB]/40 blur-3xl" />
              <div className="absolute -bottom-36 right-[-40px] h-96 w-96 rounded-full bg-[#6F86FF]/45 blur-3xl" />
              <div className="absolute left-1/2 top-12 h-48 w-48 -translate-x-1/2 rounded-full bg-white/55 blur-2xl" />
            </div>
            <div className="relative z-10">
            <button
              type="button"
              onClick={() => setIsAuditExpanded((prev) => !prev)}
              className="mb-4 flex w-full items-center justify-between text-left"
            >
              <h2 className="text-xl font-semibold text-slate-900">Audyt Dostarczalnosci</h2>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-white/70 bg-white/75 px-3 py-1 text-xs text-slate-700 shadow-[0_12px_28px_-18px_rgba(63,74,219,0.45)] backdrop-blur">
                  Ogolny wynik audytu: <span className="font-semibold text-slate-900">{auditLevel.score}% ({auditLevel.label})</span>
                </span>
                <span className="rounded-full border border-white/70 bg-white/75 px-3 py-1 text-xs text-slate-700 shadow-[0_12px_28px_-18px_rgba(63,74,219,0.45)] backdrop-blur">
                  {isAuditExpanded ? "Zwin" : "Rozwin"}
                </span>
              </div>
            </button>
          {isAuditExpanded && (
            <>
          <div className="grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
            <aside id="audit-sec-2" className="rounded-[26px] border border-white/70 bg-gradient-to-br from-white/75 via-white/60 to-[#eef2ff]/70 p-4 shadow-[0_22px_70px_-50px_rgba(63,74,219,0.5)] backdrop-blur-xl">
              <h3 className="mb-2 text-base font-medium text-slate-900">Deliverability Score</h3>
              {deliverabilityDashboard ? (
                <div className="grid gap-4">
                  <div className="flex items-center justify-center">
                    <div className="w-full max-w-[230px]">
                      {(() => {
                        const totalContacts = report.listQuality?.totalContacts ?? report.base.totalProfiles;
                        const minSample = 50;
                        const lowConfidence = totalContacts < minSample;
                        return (
                      <svg viewBox="0 0 220 130" className="h-32 w-full">
                        <path
                          d="M20 110 A90 90 0 0 1 200 110"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={lowConfidence ? 10 : 14}
                          className="text-slate-200"
                          strokeLinecap="round"
                        />
                        <path
                          d="M20 110 A90 90 0 0 1 200 110"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={lowConfidence ? 10 : 14}
                        className={
                          lowConfidence
                            ? "text-[#CFE7DA]"
                            : deliverabilityDashboard.deliverabilityScore >= 80
                              ? "text-[#2E9E6A]"
                              : deliverabilityDashboard.deliverabilityScore >= 60
                                ? "text-[#E9A24B]"
                                : "text-[#E36A86]"
                        }
                          strokeLinecap="round"
                          strokeDasharray={`${(deliverabilityDashboard.deliverabilityScore / 100) * 282} 999`}
                        />
                        <text
                          x="110"
                          y="94"
                          textAnchor="middle"
                          className={lowConfidence ? "fill-slate-600 text-[50px] font-semibold" : "fill-slate-900 text-[52px] font-semibold"}
                        >
                          {deliverabilityDashboard.deliverabilityScore}
                          <tspan className="fill-slate-500 text-[18px] font-semibold">%</tspan>
                        </text>
                      </svg>
                        );
                      })()}
                      <p
                        className={`flex items-center justify-center gap-2 text-center text-sm font-medium ${
                          deliverabilityDashboard.deliverabilityScore >= 90 && !deliverabilityDashboard.lowData
                            ? "text-[#2E9E6A]"
                            : deliverabilityDashboard.lowData
                              ? "text-slate-500"
                              : deliverabilityDashboard.deliverabilityScore >= 60
                                ? "text-[#C9853B]"
                                : "text-[#D9657C]"
                        }`}
                      >
                        {!deliverabilityDashboard.lowData && (
                          <span
                            className={`h-2 w-2 rounded-full ${
                              deliverabilityDashboard.deliverabilityScore >= 90
                                ? "bg-[#4ABF8A]"
                                : deliverabilityDashboard.deliverabilityScore >= 60
                                  ? "bg-[#F4B56A]"
                                  : "bg-[#F08AA0]"
                            }`}
                          />
                        )}
                        {deliverabilityDashboard.lowData
                          ? "Brak sygnałów ryzyka • mała próba"
                          : deliverabilityDashboard.deliverabilityScore >= 90
                            ? "Stabilne"
                            : deliverabilityDashboard.deliverabilityScore >= 60
                              ? "Umiarkowane ryzyko"
                              : "Wysokie ryzyko"}
                      </p>
                      <div className="mt-2 grid gap-1 text-center text-[11px] text-slate-500">
                        {(() => {
                          const totalContacts = report.listQuality?.totalContacts ?? report.base.totalProfiles;
                          const confidence =
                            totalContacts < 50 ? "niska" : totalContacts < 200 ? "średnia" : "wysoka";
                          return (
                            <>
                              <span>Pewność oceny: {confidence}</span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-700">
                    <ul className="space-y-2 text-left">
                      <li>Spam: <span className="font-semibold">{report.deliverability.days30.complaintRate}%</span></li>
                      <li>Bounce: <span className="font-semibold">{report.deliverability.days30.hardBounceRate}%</span></li>
                      <li>Delivery: <span className="font-semibold">{deliverabilityDashboard.deliveryRate}%</span></li>
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-600">Brak danych do wyliczenia wskaźnika.</p>
              )}
            </aside>

            <aside id="audit-sec-1" className="rounded-[24px] border border-white/70 bg-gradient-to-br from-white/70 via-white/55 to-[#eef2ff]/70 p-4 shadow-[0_22px_60px_-35px_rgba(63,74,219,0.4)] backdrop-blur-xl">
              <h3 className="mb-3 text-lg font-medium text-slate-900">Baza klientów</h3>
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/60 bg-white/70 p-3 shadow-[0_14px_35px_-24px_rgba(63,74,219,0.45)] backdrop-blur">
                  <p className="text-3xl font-semibold text-slate-900">{report.base.totalProfiles}</p>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Wszystkie kontakty</p>
                  <button
                    type="button"
                    onClick={() => handleExport("all")}
                    className="mt-2 rounded-full bg-gradient-to-r from-[#3F4ADB] via-[#4C62FF] to-[#6F86FF] px-3 py-1 text-[11px] font-medium text-white shadow-[0_10px_26px_-18px_rgba(63,74,219,0.6)] transition hover:brightness-105"
                    disabled={exportingCategory !== null}
                  >
                    {exportingCategory === "all" ? "Eksport..." : "Eksport XLSX"}
                  </button>
                </div>
                <div className="rounded-2xl border border-white/60 bg-white/70 p-3 shadow-[0_14px_35px_-24px_rgba(63,74,219,0.45)] backdrop-blur">
                  <p className="text-3xl font-semibold text-slate-900">{report.consent.verifiedCount ?? 0}</p>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Potwierdzone</p>
                  <button
                    type="button"
                    onClick={() => handleExport("verified")}
                    className="mt-2 rounded-full bg-gradient-to-r from-[#3F4ADB] via-[#4C62FF] to-[#6F86FF] px-3 py-1 text-[11px] font-medium text-white shadow-[0_10px_26px_-18px_rgba(63,74,219,0.6)] transition hover:brightness-105"
                    disabled={exportingCategory !== null}
                  >
                    {exportingCategory === "verified" ? "Eksport..." : "Eksport XLSX"}
                  </button>
                </div>
                <div className="rounded-2xl border border-white/60 bg-white/70 p-3 shadow-[0_14px_35px_-24px_rgba(63,74,219,0.45)] backdrop-blur">
                  <p className="text-3xl font-semibold text-slate-900">
                    {report.consent.invalidExternalCount ?? report.consent.invalidCount ?? report.consent.notVerifiedCount ?? 0}
                  </p>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Niepotwierdzone</p>
                  <button
                    type="button"
                    onClick={() => handleExport("unverified")}
                    className="mt-2 rounded-full bg-gradient-to-r from-[#3F4ADB] via-[#4C62FF] to-[#6F86FF] px-3 py-1 text-[11px] font-medium text-white shadow-[0_10px_26px_-18px_rgba(63,74,219,0.6)] transition hover:brightness-105"
                    disabled={exportingCategory !== null}
                  >
                    {exportingCategory === "unverified" ? "Eksport..." : "Eksport XLSX"}
                  </button>
                </div>
              </div>
              <div className="mt-3 space-y-2 text-xs text-slate-600">
                <details className="rounded-xl border border-white/60 bg-white/70 p-2 shadow-[0_10px_26px_-20px_rgba(63,74,219,0.35)] backdrop-blur">
                  <summary className="cursor-pointer text-xs font-medium text-slate-700">Przypisane listy</summary>
                  <ul className="mt-2 max-h-32 space-y-1 overflow-auto text-[11px] text-slate-700">
                    {listEntries.length > 0 ? (
                      listEntries.map((item, idx) => (
                        <li key={item.id || `${item.name}-${idx}`}>{item.name} ({item.count})</li>
                      ))
                    ) : (
                      <li>Brak list z profilami do wyswietlenia.</li>
                    )}
                  </ul>
                </details>
                <div className="rounded-xl border border-white/60 bg-white/70 p-2 shadow-[0_10px_26px_-20px_rgba(63,74,219,0.35)] backdrop-blur">
                  <p>
                    Średni wiek bazy:{" "}
                    <span className="font-semibold">
                      {report.base.totalProfiles < 20
                        ? "Próba zbyt mała do analizy"
                        : formatMonthAge(report.base.contactAgeStats?.averageDays ?? null)}
                    </span>
                  </p>
                  <p>
                    Mediana wieku kontaktu:{" "}
                    <span className="font-semibold">
                      {report.base.totalProfiles < 20
                        ? "Próba zbyt mała do analizy"
                        : formatMonthAge(report.base.contactAgeStats?.medianDays ?? null)}
                    </span>
                  </p>
                  <p>
                    % kontaktów 6m+:{" "}
                    <span className="font-semibold">
                      {report.base.totalProfiles < 20
                        ? "Próba zbyt mała do analizy"
                        : `${activityDiagnostics?.dead180PlusPercent ?? 0}%`}
                    </span>
                  </p>
                  <p>
                    % kontaktów 12m+:{" "}
                    <span className="font-semibold">
                      {report.base.totalProfiles < 20
                        ? "Próba zbyt mała do analizy"
                        : report.base.oldestProfileAt &&
                            new Date(report.base.oldestProfileAt).getTime() > Date.now() - 365 * 24 * 60 * 60 * 1000
                          ? "Brak historii"
                          : `${activityDiagnostics?.dead365PlusPercent ?? 0}%`}
                    </span>
                  </p>
                  <p className="mt-2">
                    Brak zgody marketingowej łącznie:{" "}
                    <span className="font-semibold">{report.consent.invalidTotalCount ?? report.consent.invalidCount ?? 0}</span>
                  </p>
                  <p>
                    Brak zgody po wykluczeniu wewnętrznych:{" "}
                    <span className="font-semibold">{report.consent.invalidExternalCount ?? report.consent.invalidCount ?? 0}</span>
                  </p>
                  {!report.consent.internalExceptionsConfigured && (
                    <p className="text-xs text-slate-500">Brak skonfigurowanych wyjątków wewnętrznych.</p>
                  )}
                  {report.consent.internalExceptionsConfigured && (report.consent.invalidInternalCount ?? 0) > 0 && (
                    <p className="text-xs text-slate-500">
                      {(() => {
                        const internalCount = report.consent.invalidInternalCount ?? 0;
                        const externalCount = report.consent.invalidExternalCount ?? report.consent.invalidCount ?? 0;
                        if (externalCount === 0) {
                          return `Wykryto ${internalCount} kontakt(ów) bez zgody marketingowej oznaczonych jako wewnętrzne; wyłączono je z oceny ryzyka.`;
                        }
                        return `W tym ${internalCount} kontakt(ów) wewnętrznych wyłączono z oceny; pozostałe ${externalCount} kontakty bez zgody wymagają działań.`;
                      })()}
                    </p>
                  )}
                </div>
              </div>
            </aside>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="grid gap-4">
              <aside id="audit-sec-4" className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white/70 via-white/55 to-[#eef2ff]/70 p-8 shadow-[0_18px_55px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                <div className="mb-1.5 flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-medium text-slate-900">Jakość listy</h3>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Czy baza jest bezpieczna do dalszego skalowania wysyłek.
                    </p>
                  </div>
                  {listQualityScore && (
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-emerald-100 bg-emerald-50/70 px-2 py-0.5 text-[11px] font-semibold text-[#2E9E6A] shadow-[0_8px_20px_-16px_rgba(46,158,106,0.45)]">
                        Score: {listQualityScore.score}
                      </span>
                    </div>
                  )}
                </div>
              {report.listQuality ? (
                <>
                  {(() => {
                    const listQuality = listQualityScore;
                    const inputs = listQuality?.inputs;
                    const totalContacts = inputs?.totalContacts ?? 0;
                    if (totalContacts === 0) {
                      return <p className="text-sm text-slate-600">Brak danych.</p>;
                    }
                    const freshCount = inputs?.freshCount ?? 0;
                    const oldImportCount = inputs?.oldImportCount ?? 0;
                    const doiCount = inputs?.doiCount ?? 0;
                    const confirmedCount = inputs?.confirmedCount ?? 0;
                    const active90Count = inputs?.active90Count ?? 0;
                    const inactive180Count = inputs?.inactive180Count ?? 0;
                    const freshPct = inputs?.freshPct ?? 0;
                    const oldImportPct = inputs?.oldImportPct ?? 0;
                    const doiPct = inputs?.doiPct ?? 0;
                    const confirmationsPct = inputs?.confirmationsPct ?? 0;
                    const active90Pct = inputs?.active90Pct ?? 0;
                    const inactive180Pct = inputs?.inactive180Pct ?? 0;
                    const acquisitionFreshW = percent(freshCount, Math.max(totalContacts, 1));
                    const acquisitionOldW = percent(oldImportCount, Math.max(totalContacts, 1));
                    const activityActiveW = percent(active90Count, Math.max(totalContacts, 1));
                    const activityInactiveW = percent(inactive180Count, Math.max(totalContacts, 1));
                    const isSmallSample = listQuality?.isSmallSample ?? false;
                    const showSeparateDoi = !isSmallSample;
                    const showConfirmations = !isSmallSample;
                    return (
                      <>
                        <div className="h-3.5 w-full overflow-hidden rounded-full bg-white/70">
                          <div
                            className={`h-full ${
                              isSmallSample
                                ? "bg-[#A9D9C2]/70"
                                : "bg-gradient-to-r from-[#2E9E6A] via-[#4ABF8A] to-[#2E9E6A]"
                            }`}
                            style={{ width: `${listQuality?.score ?? 0}%` }}
                          />
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                          <span>Score</span>
                          <span>
                            {listQuality?.score ?? 0} / 100
                            {isSmallSample
                              ? " – Ocena orientacyjna – niewystarczająca liczba kontaktów do pełnej analizy"
                              : ` – ${listQuality?.label}`}
                          </span>
                        </div>
                        <div className="mt-4 grid gap-4 text-[12px] leading-relaxed text-slate-600">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">Jakość pozyskania</p>
                            <div className="mt-3 grid gap-3 sm:grid-cols-[120px_1fr] sm:items-center">
                              <div className="flex items-center justify-center">
                                <svg viewBox="0 0 120 120" className="h-24 w-24">
                                  {(() => {
                                    const circumference = 2 * Math.PI * 46;
                                    const freshLen = (freshPct / 100) * circumference;
                                    const oldLen = (oldImportPct / 100) * circumference;
                                    const oldOffset = -freshLen;
                                    return (
                                      <>
                                        <circle cx="60" cy="60" r="46" stroke="#e2e8f0" strokeWidth="12" fill="none" />
                                        <circle
                                          cx="60"
                                          cy="60"
                                          r="46"
                                          stroke="#4ABF8A"
                                          strokeWidth="12"
                                          fill="none"
                                          strokeDasharray={`${freshLen} ${circumference}`}
                                          strokeLinecap="round"
                                          transform="rotate(-90 60 60)"
                                          style={{ filter: "drop-shadow(0 0 3px rgba(74,191,138,0.35))" }}
                                        />
                                        <circle
                                          cx="60"
                                          cy="60"
                                          r="46"
                                          stroke="#F4B56A"
                                          strokeWidth="12"
                                          fill="none"
                                          strokeDasharray={`${oldLen} ${circumference}`}
                                          strokeDashoffset={oldOffset}
                                          strokeLinecap="round"
                                          transform="rotate(-90 60 60)"
                                          style={{ filter: "drop-shadow(0 0 3px rgba(244,181,106,0.35))" }}
                                        />
                                      </>
                                    );
                                  })()}
                                  <text x="60" y="66" textAnchor="middle" className="fill-slate-900 text-sm font-semibold">
                                    {freshPct}%
                                  </text>
                                </svg>
                              </div>
                              <div className="grid gap-2">
                              <span className="text-[#2E9E6A]" title="Świeże zgody to profile z poprawną zgodą marketingową z ostatnich 90 dni.">
                                Świeże zgody (90 dni) {freshCount} z {totalContacts} ({freshPct}%)
                              </span>
                              <span className="text-[#C9853B]" title="Stare importy to profile ze źródeł importowanych starsze niż 180 dni.">
                                Stare importy (180+ dni) {oldImportCount} z {totalContacts} ({oldImportPct}%)
                              </span>
                              {showSeparateDoi ? (
                                <>
                                  <span className="text-[#3C9E90]" title="Udział profili z double opt-in lub potwierdzonym opt-in.">
                                    Udział DOI {doiCount} z {totalContacts} ({doiPct}%)
                                  </span>
                                  {showConfirmations && (
                                    <span className="text-slate-500" title="Potwierdzenia to profile subscribed podzielone przez total_contacts.">
                                      Potwierdzenia {confirmedCount} z {totalContacts} ({confirmationsPct}%)
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="text-[#3C9E90]" title="Udział profili z double opt-in lub potwierdzonym opt-in.">
                                  Udział DOI {doiCount} z {totalContacts} ({doiPct}%)
                                </span>
                              )}
                              </div>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">Aktywność i żywotność</p>
                            <div className="mt-3 grid gap-3 sm:grid-cols-[120px_1fr] sm:items-center">
                              <div className="flex items-center justify-center">
                                <svg viewBox="0 0 120 120" className="h-24 w-24">
                                  {(() => {
                                    const circumference = 2 * Math.PI * 46;
                                    const activeLen = (active90Pct / 100) * circumference;
                                    const inactiveLen = (inactive180Pct / 100) * circumference;
                                    const inactiveOffset = -activeLen;
                                    return (
                                      <>
                                        <circle cx="60" cy="60" r="46" stroke="#e2e8f0" strokeWidth="12" fill="none" />
                                        <circle
                                          cx="60"
                                          cy="60"
                                          r="46"
                                          stroke="#4ABF8A"
                                          strokeWidth="12"
                                          fill="none"
                                          strokeDasharray={`${activeLen} ${circumference}`}
                                          strokeLinecap="round"
                                          transform="rotate(-90 60 60)"
                                          style={{ filter: "drop-shadow(0 0 3px rgba(74,191,138,0.35))" }}
                                        />
                                        <circle
                                          cx="60"
                                          cy="60"
                                          r="46"
                                          stroke="#F08AA0"
                                          strokeWidth="12"
                                          fill="none"
                                          strokeDasharray={`${inactiveLen} ${circumference}`}
                                          strokeDashoffset={inactiveOffset}
                                          strokeLinecap="round"
                                          transform="rotate(-90 60 60)"
                                          style={{ filter: "drop-shadow(0 0 3px rgba(240,138,160,0.35))" }}
                                        />
                                      </>
                                    );
                                  })()}
                                  <text x="60" y="66" textAnchor="middle" className="fill-slate-900 text-sm font-semibold">
                                    {active90Pct}%
                                  </text>
                                </svg>
                              </div>
                              <div className="grid gap-2">
                              <span className="text-[#2E9E6A]" title="Aktywni 90 dni to profile z otwarciem/kliknięciem/zakupem w ostatnich 90 dniach.">
                                Aktywni (90 dni) {active90Count} z {totalContacts} ({active90Pct}%)
                              </span>
                              <span className="text-[#D9657C]" title="Nieaktywni 180+ dni to profile bez otwarć, kliknięć i zakupów przez 180+ dni.">
                                Nieaktywni (180+ dni) {inactive180Count} z {totalContacts} ({inactive180Pct}%)
                              </span>
                              <span className="text-slate-500">
                                Trend:{" "}
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                    totalContacts < 10
                                      ? "bg-slate-100 text-slate-700"
                                      : active90Count > inactive180Count
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-rose-100 text-rose-700"
                                  }`}
                                  title="Porównanie aktywnych 90d vs nieaktywnych 180+."
                                >
                                  {totalContacts < 10
                                    ? "nieistotny (próba < 10)"
                                    : active90Count > inactive180Count
                                      ? "przewaga engaged"
                                    : "narastanie nieaktywnych"}
                                </span>
                              </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </>
              ) : null}
              </aside>

              <aside id="audit-sec-2b" className="rounded-[24px] border border-white/70 bg-gradient-to-br from-white/70 via-white/55 to-[#eef2ff]/70 p-4 shadow-[0_20px_60px_-35px_rgba(63,74,219,0.4)] backdrop-blur-xl">
                <h3 className="mb-3 text-lg font-medium text-slate-900">Infrastruktura</h3>
                {(() => {
                  const infraStatus = report.infrastructure?.status ?? "warning";
                  const infraLabel =
                    infraStatus === "critical"
                      ? "Krytyczny"
                      : infraStatus === "warning"
                        ? "Ostrzeżenie"
                        : "OK";
                  const infraDot =
                    infraStatus === "critical"
                      ? "bg-[#F08AA0] shadow-[0_0_10px_rgba(240,138,160,0.45)]"
                      : infraStatus === "warning"
                        ? "bg-[#F4B56A] shadow-[0_0_10px_rgba(244,181,106,0.45)]"
                        : "bg-[#4ABF8A] shadow-[0_0_10px_rgba(74,191,138,0.45)]";
                  return (
                    <>
                      <p className="flex items-center gap-2 text-sm text-slate-700">
                        <span className={`h-2.5 w-2.5 rounded-full ${infraDot}`} />
                        Infrastruktura domeny
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        Status: <span className="font-semibold text-slate-900">{infraLabel}</span>
                      </p>
                    </>
                  );
                })()}
                <p className="mt-2 text-xs text-slate-500">
                  SPF: {report.infrastructure?.spf_status ?? "brak danych"} · DKIM: {report.infrastructure?.dkim_status ?? "brak danych"} · DMARC: {report.infrastructure?.dmarc_status ?? "brak danych"}
                </p>
              </aside>

              <aside id="audit-sec-6" className="rounded-[24px] border border-white/70 bg-gradient-to-br from-white/70 via-white/55 to-[#eef2ff]/70 p-4 shadow-[0_20px_60px_-35px_rgba(63,74,219,0.4)] backdrop-blur-xl">
                <h3 className="mb-3 text-lg font-medium text-slate-900">Suppression & kontrola ryzyka</h3>
                {deliverabilityDashboard ? (
                  <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
                    <div className="flex items-center justify-center">
                      <svg viewBox="0 0 120 120" className="h-24 w-24">
                        <circle cx="60" cy="60" r="46" stroke="#e2e8f0" strokeWidth="12" fill="none" />
                        <circle
                          cx="60"
                          cy="60"
                          r="46"
                          stroke="#F4B56A"
                          strokeWidth="12"
                          fill="none"
                          strokeDasharray={`${(deliverabilityDashboard.suppressionRate / 100) * 289} 999`}
                          strokeLinecap="round"
                          transform="rotate(-90 60 60)"
                        />
                        <text x="60" y="66" textAnchor="middle" className="fill-slate-900 text-sm font-semibold">
                          {deliverabilityDashboard.suppressionRate}%
                        </text>
                      </svg>
                    </div>
                    <div className="text-sm text-slate-700">
                      <p>Suppression list: <span className="font-semibold">{report.suppression.suppressedCount}</span> ({deliverabilityDashboard.suppressionRate}%)</p>
                      <p>Hard Bounce (30d): <span className="font-semibold">{report.deliverability.days30.hardBounceRate}%</span></p>
                      <p>Automatyczne wyciszanie nieaktywnych: <span className="font-semibold">{report.suppression.hasSunsetPolicy ? "tak" : "brak"}</span></p>
                      {(() => {
                        const base = report.base.totalProfiles;
                        const suppressed30d = deliverabilityDashboard.suppressedWeekly * 4;
                        const rate30d = percent(suppressed30d, Math.max(base, 1));
                        if (base < 20) {
                          return (
                            <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                              <span className="h-2 w-2 rounded-full bg-slate-300" />
                              Brak istotności statystycznej
                            </p>
                          );
                        }
                        if (rate30d > 2) {
                          return (
                            <p className="mt-2 flex items-center gap-2 text-xs text-[#D9657C]">
                              <span className="h-2 w-2 rounded-full bg-[#F08AA0]" />
                              Podwyższone ryzyko reputacyjne
                            </p>
                          );
                        }
                        if (rate30d < 0.5) {
                          return (
                            <p className="mt-2 flex items-center gap-2 text-xs text-[#2E9E6A]">
                              <span className="h-2 w-2 rounded-full bg-[#4ABF8A]" />
                              Naturalna rotacja
                            </p>
                          );
                        }
                        return (
                          <p className="mt-2 flex items-center gap-2 text-xs text-[#C9853B]">
                            <span className="h-2 w-2 rounded-full bg-[#F4B56A]" />
                            Umiarkowana rotacja
                          </p>
                        );
                      })()}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">Brak danych o suppression.</p>
                )}
              </aside>
            </div>

            <div className="grid gap-4">
              <aside id="audit-sec-5" className="flex h-full flex-col rounded-[24px] border border-white/70 bg-gradient-to-br from-white/70 via-white/55 to-[#eef2ff]/70 p-4 shadow-[0_20px_60px_-35px_rgba(63,74,219,0.4)] backdrop-blur-xl">
                <h3 className="mb-3 text-lg font-medium text-slate-900">Stabilność wolumenu</h3>
                {deliverabilityDashboard ? (() => {
                  const values = deliverabilityDashboard.seriesSent;
                  const avg = values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
                  const max = values.length ? Math.max(...values) : 0;
                  const zeros = values.filter((v) => v === 0).length;
                  const last14 = values.slice(-14);
                  const noSends14 = last14.length > 0 && last14.every((v) => v === 0);
                  const noData = values.length === 0 || max === 0;
                  const baselineY = 175 - (avg / Math.max(deliverabilityDashboard.sentChartMax, 1)) * 165;
                  const spike = max > avg * 3 && avg > 0;
                  const silence = zeros >= 10;
                  return (
                    <>
                      <svg viewBox="0 0 620 180" className="mt-auto h-36 w-full">
                        <line x1="0" y1="175" x2="620" y2="175" stroke="#e2e8f0" strokeWidth="1" />
                        <line x1="0" y1={baselineY} x2="620" y2={baselineY} stroke="#BFDACD" strokeDasharray="4 4" />
                        <polyline
                          points={toPolyline(values, 620, 165, deliverabilityDashboard.sentChartMax)}
                          fill="none"
                          stroke="#4ABF8A"
                          strokeWidth="2.5"
                        />
                      </svg>
                      <div className="mt-auto space-y-1 text-xs text-slate-700">
                        <p>Skoki wysyłek: <span className="font-semibold">{spike ? "wykryto" : "brak"}</span></p>
                        <p>Długie okresy ciszy: <span className="font-semibold">{silence ? "wykryto" : "brak"}</span></p>
                        <p>Rozjazd między kampanią a flow: <span className="font-semibold">brak danych z API</span></p>
                        {noData ? (
                          <p className="flex items-center gap-2 text-slate-500">
                            <span className="h-2 w-2 rounded-full bg-slate-300" />
                            Brak aktywności wysyłkowej
                          </p>
                        ) : noSends14 ? (
                          <p className="flex items-center gap-2 text-[#C9853B]">
                            <span className="h-2 w-2 rounded-full bg-[#F4B56A]" />
                            Wykryto okres nieaktywności
                          </p>
                        ) : spike ? (
                          <p className="flex items-center gap-2 text-[#C9853B]">
                            <span className="h-2 w-2 rounded-full bg-[#F4B56A]" />
                            Nagły wzrost wolumenu
                          </p>
                        ) : null}
                      </div>
                    </>
                  );
                })() : (
                  <p className="text-sm text-slate-600">Brak danych wolumenu wysyłek.</p>
                )}
              </aside>

              <aside id="audit-sec-3" className="flex h-full flex-col rounded-[24px] border border-white/70 bg-gradient-to-br from-white/70 via-white/55 to-[#eef2ff]/70 p-4 shadow-[0_20px_60px_-35px_rgba(63,74,219,0.4)] backdrop-blur-xl">
                <h3 className="mb-3 text-lg font-medium text-slate-900">Tempo przyrostu problemów</h3>
                {deliverabilityDashboard ? (
                  <>
                    <svg viewBox="0 0 620 180" className="mt-auto h-28 w-full">
                      <line x1="0" y1="175" x2="620" y2="175" stroke="#e2e8f0" strokeWidth="1" />
                      <polyline
                        points={toPolyline(
                          deliverabilityDashboard.seriesBounce.slice(-30),
                          620,
                          165,
                          deliverabilityDashboard.chartMax,
                        )}
                        fill="none"
                        stroke="#F4B56A"
                        strokeWidth="2.5"
                      />
                      <polyline
                        points={toPolyline(
                          deliverabilityDashboard.seriesComplaint.slice(-30),
                          620,
                          165,
                          deliverabilityDashboard.chartMax,
                        )}
                        fill="none"
                        stroke="#F08AA0"
                        strokeWidth="2.5"
                      />
                    </svg>
                    <div className="mt-auto flex flex-wrap gap-4 text-xs text-slate-600">
                      <span className="text-[#C9853B]">Hard bounce (proxy)</span>
                      <span className="text-[#D9657C]">Spam complaint</span>
                      <span className="inline-flex items-center gap-1">
                        Suppression: {deliverabilityDashboard.suppressedWeekly}/tydz.
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-600">Brak danych do analizy trendu.</p>
                )}
              </aside>
            </div>
          </div>

          <div id="audit-sec-7" className="mt-8 rounded-[24px] border border-white/70 bg-gradient-to-br from-white/70 via-white/55 to-[#eef2ff]/70 p-4 shadow-[0_20px_60px_-35px_rgba(63,74,219,0.4)] backdrop-blur-xl">
            <h3 className="mb-3 text-lg font-medium text-slate-900">Podsumowanie bazy klientów</h3>
            {(() => {
              const risks: string[] = [];
              const gaps: string[] = [];
              const toImplement: string[] = [];
              const base = report.base.totalProfiles;
              const deliverabilityScore = deliverabilityDashboard?.deliverabilityScore ?? null;
              const spamRate = report.deliverability.days30.complaintRate;
              const hardBounceRate = report.deliverability.days30.hardBounceRate;
              const unsubscribeRate = report.deliverability.days30.unsubscribeRate;
              const suppressed30d = (deliverabilityDashboard?.suppressedWeekly ?? 0) * 4;
              const suppression30dRate = percent(suppressed30d, Math.max(base, 1));
              const engaged30 = activityDiagnostics?.active30Percent ?? 0;
              const inactive90Plus = activityDiagnostics?.inactive90PlusPercent ?? 0;
              const inactive180Plus = activityDiagnostics?.dead180PlusPercent ?? 0;
              const oldImports = activityDiagnostics?.dead180PlusPercent ?? 0;
              const notVerifiedCount =
                report.consent.invalidExternalCount ?? report.consent.invalidCount ?? report.consent.notVerifiedCount ?? 0;
              const notVerifiedRate = percent(notVerifiedCount, Math.max(base, 1));
              const hasSunset = report.suppression.hasSunsetPolicy;
              const noSends90 = report.deliverability.days90.sent === 0;
              if (deliverabilityScore !== null && deliverabilityScore < 60) {
                risks.push("Wysokie ryzyko reputacyjne (deliverability score < 60).");
              }
              if (spamRate > 0.2) {
                risks.push("Ryzyko reputacyjne: spam rate powyżej 0.2%.");
              }
              if (hardBounceRate > 1) {
                risks.push("Ryzyko jakości danych: hard bounce rate powyżej 1%.");
              }
              if (suppression30dRate > 3) {
                risks.push("Ryzyko destabilizacji reputacji (suppression 30d > 3% bazy).");
              }
              if (engaged30 < 20 && report.activity.campaignsToInactivePercent >= 20) {
                risks.push("Ryzyko nadmiernej ekspozycji nieaktywnych (engaged 30d < 20%).");
              }
              if (inactive180Plus > 40) {
                risks.push("Ryzyko starzenia bazy (inactive 180+ > 40%).");
              }
              if (!hasSunset && inactive90Plus > 30) {
                risks.push("Ryzyko przyszłych complaintów (brak sunset + wysoki udział nieaktywnych).");
              }
              if (oldImports > 20) {
                risks.push("Ryzyko jakości zgód (wysoki udział starych importów).");
              }
              if (notVerifiedRate > 5) {
                risks.push("Ryzyko prawne i reputacyjne (brak potwierdzonej zgody > 5%).");
              }
              if (deliverabilityDashboard && deliverabilityDashboard.suppressionRate > 10) {
                risks.push("Ryzyko historycznych problemów z jakością (suppression globalne > 10%).");
              }
              if (unsubscribeRate > 0.5) {
                risks.push("Ryzyko niedopasowania komunikacji (unsubscribe rate > 0.5%).");
              }

              if (noSends90) {
                gaps.push("Luka analityczna: brak danych historycznych > 90 dni.");
              }
              if (base < 20) {
                gaps.push("Luka w możliwości oceny systemu (zbyt mała baza).");
              }
              if (!hasSunset) {
                gaps.push("Brak automatycznego wyciszania nieaktywnych (sunset).");
              }
              if ((report.infrastructure?.status ?? "warning") !== "ok") {
                gaps.push("Brak infrastrukturalnej weryfikacji domeny (SPF/DKIM/DMARC).");
              }
              if (deliverabilityDashboard?.lowData) {
                gaps.push("Brak wystarczających danych o wysyłkach do oceny ryzyka.");
              }

              if (inactive180Plus > 30) {
                toImplement.push("Wdrożyć sunset + re-engagement dla nieaktywnych.");
              }
              if (report.signupFormAudit?.optInMechanic.mode !== "double_opt_in" && spamRate > 0.2) {
                toImplement.push("Rozważyć double opt-in przy podwyższonym spam rate.");
              }
              if (hardBounceRate > 1) {
                toImplement.push("Wyczyścić bazę i zweryfikować źródła pozyskania.");
              }
              if (report.deliverability.days30.unsubscribeRate > 0.5) {
                toImplement.push("Poprawić segmentację i ograniczyć wolumen kampanii.");
              }
              if ((activityDiagnostics?.active30Percent ?? 0) < 10) {
                toImplement.push("Zwiększyć świeżość zgód i pozyskanie nowych leadów.");
              }
              if ((report.infrastructure?.status ?? "warning") !== "ok") {
                toImplement.push("Zweryfikować SPF/DKIM/DMARC przed skalowaniem.");
              }
              if (suppression30dRate > 2) {
                toImplement.push("Ograniczyć wysyłki i przeanalizować segmentację (suppression rośnie).");
              }
              if (report.consent.internalExceptionsConfigured) {
                toImplement.push("Wyklucz internal_emails z kampanii i flow, aby nie zawyżały wyników.");
              } else if ((report.consent.invalidExternalCount ?? report.consent.invalidCount ?? 0) > 0) {
                toImplement.push("Jeśli to adres wewnętrzny, dodaj go do wyjątków (owner_email / internal_emails).");
              }

              if (risks.length === 0) risks.push("Brak krytycznych ryzyk na tym etapie.");
              if (gaps.length === 0) gaps.push("Brak istotnych luk operacyjnych.");
              if (toImplement.length === 0) toImplement.push("Utrzymać obecny standard i monitorować wskaźniki.");

              return (
                <div className="grid gap-3 lg:grid-cols-3">
                  <div className="rounded-2xl border border-white/60 bg-white/70 p-3 text-sm text-rose-600 shadow-[0_14px_35px_-24px_rgba(63,74,219,0.35)] backdrop-blur">
                    <p className="font-medium">Ryzyko</p>
                    <ul className="mt-2 space-y-1 text-xs">
                      {risks.map((item) => <li key={item}>• {item}</li>)}
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-white/60 bg-white/70 p-3 text-sm text-amber-600 shadow-[0_14px_35px_-24px_rgba(63,74,219,0.35)] backdrop-blur">
                    <p className="font-medium">Luki</p>
                    <ul className="mt-2 space-y-1 text-xs">
                      {gaps.map((item) => <li key={item}>• {item}</li>)}
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-white/60 bg-white/70 p-3 text-sm text-slate-700 shadow-[0_14px_35px_-24px_rgba(63,74,219,0.35)] backdrop-blur">
                    <p className="font-medium text-slate-900">Do wprowadzenia</p>
                    <ul className="mt-2 space-y-1 text-xs">
                      {toImplement.map((item) => <li key={item}>• {item}</li>)}
                    </ul>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="hidden" data-audit-score={auditScoringSnapshot.sections.listQualityScore ?? ""} />

          </>
          )}
          </div>
          </div>

          {report.signupFormAudit && (
            <div
              id="signup-form-audit"
              className="relative overflow-hidden rounded-[28px] border border-white/50 bg-gradient-to-br from-[#cfd9ff] via-[#e3e9ff] to-[#f7f9ff] p-4 shadow-[0_30px_80px_-45px_rgba(63,74,219,0.45)] sm:p-5"
            >
              <div className="pointer-events-none absolute inset-0 opacity-70">
                <div className="absolute -left-24 -top-28 h-80 w-80 rounded-full bg-[#3F4ADB]/40 blur-3xl" />
                <div className="absolute -bottom-36 right-[-40px] h-96 w-96 rounded-full bg-[#6F86FF]/45 blur-3xl" />
                <div className="absolute left-1/2 top-12 h-48 w-48 -translate-x-1/2 rounded-full bg-white/55 blur-2xl" />
              </div>
              <div className="relative z-10">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold text-slate-900">Audyt formularza zapisu</h2>
                  <button
                    type="button"
                    onClick={() => setIsSignupAuditExpanded((prev) => !prev)}
                    className="rounded border border-white/70 bg-white/75 px-2 py-1 text-xs text-slate-700 shadow-[0_12px_28px_-18px_rgba(63,74,219,0.45)] backdrop-blur hover:bg-white"
                  >
                    {isSignupAuditExpanded ? "Zwin" : "Rozwin"}
                  </button>
                </div>
                <p className="mb-3 text-sm text-slate-600">
                  Analiza stanu obecnego: jak dzis dziala zbieranie kontaktow i gdzie sa ryzyka jakosci bazy.
                </p>

                {isSignupAuditExpanded && (
                <>
                {signupAuditDashboard && (
                  <>
                    {(() => {
                      const totalContacts = report.base.totalProfiles || 0;
                      const formsActive = report.signupFormAudit?.formsInKlaviyo?.active ?? 0;
                      const formsTotal = report.signupFormAudit?.formsInKlaviyo?.total ?? 0;
                      const formProfilesShare = percent(signupAuditDashboard.kpi.signups30d, Math.max(totalContacts, 1));
                      const avgCr =
                        signupAuditDashboard.kpi.formPerformance.length > 0
                          ? Number(
                              (
                                signupAuditDashboard.kpi.formPerformance.reduce(
                                  (sum, form) => sum + (form.conversionRate ?? 0),
                                  0,
                                ) / signupAuditDashboard.kpi.formPerformance.length
                              ).toFixed(1),
                            )
                          : 0;
                      const optInMode =
                        report.signupFormAudit?.optInMechanic.mode === 'double_opt_in' ? 'Double' : 'Single';
                      const consentBase = report.consent.consentAccountsTotal ?? totalContacts;
                      const consentCorrectPct = percent(report.consent.verifiedCount ?? 0, Math.max(consentBase, 1));
                      const bounceFormProfiles = report.deliverability.days30.bounceRate;
                      const assessment = report.signupFormAudit?.assessment;

                      const sources = report.signupFormAudit?.sourceAttribution.topSources ?? [];
                      const sourceBuckets = sources.reduce(
                        (acc, item) => {
                          const key = item.source.toLowerCase();
                          if (key.includes('shopify')) acc.shopify += item.count;
                          else if (key.includes('klaviyo')) acc.klaviyo += item.count;
                          else if (key.includes('import')) acc.import += item.count;
                          else acc.other += item.count;
                          return acc;
                        },
                        { shopify: 0, klaviyo: 0, import: 0, other: 0 },
                      );
                      const sourceTotal = Object.values(sourceBuckets).reduce((sum, value) => sum + value, 0) || 1;
                      const donutSegments = [
                        { label: 'Shopify', value: sourceBuckets.shopify, color: '#4ABF8A' },
                        { label: 'Klaviyo', value: sourceBuckets.klaviyo, color: '#F4B56A' },
                        { label: 'Import', value: sourceBuckets.import, color: '#F08AA0' },
                        { label: 'Inne', value: sourceBuckets.other, color: '#BFDACD' },
                      ];

                      const dailySeries = signupAuditDashboard.kpi.dailyActivity30d.slice(-30);
                      const zeroDays = dailySeries.filter((item) => item.count === 0).length;
                      const maxDaily = Math.max(...dailySeries.map((item) => item.count), 1);
                      const avgDaily = dailySeries.length
                        ? dailySeries.reduce((sum, item) => sum + item.count, 0) / dailySeries.length
                        : 0;
                      const maxSpikePct = avgDaily > 0 ? Number(((Math.max(...dailySeries.map((item) => item.count)) / avgDaily) * 100).toFixed(0)) : 0;

                      const baseForms = report.signupFormAudit?.formsInKlaviyo?.items ?? [];
                      const perfById = new Map(signupAuditDashboard.kpi.formPerformance.map((form) => [form.id, form]));
                      const rows = baseForms.map((form) => {
                        const perf = perfById.get(form.id);
                        return {
                          id: form.id,
                          name: form.name,
                          status: form.status,
                          type: form.popupType || form.context || '—',
                          updatedAt: form.updatedAt,
                          signupCount30d: perf?.signupCount30d ?? 0,
                          conversionRate: perf?.conversionRate ?? form.conversionRate ?? 0,
                        };
                      });
                      const sortedRows = [...rows].sort((a, b) => {
                        const left = a[formSortKey];
                        const right = b[formSortKey];
                        if (typeof left === 'number' && typeof right === 'number') {
                          return formSortDir === 'asc' ? left - right : right - left;
                        }
                        return formSortDir === 'asc'
                          ? String(left).localeCompare(String(right))
                          : String(right).localeCompare(String(left));
                      });
                      const headers: Array<{ key: typeof formSortKey; label: string }> = [
                        { key: 'name', label: 'Nazwa' },
                        { key: 'status', label: 'Status' },
                        { key: 'type', label: 'Typ' },
                        { key: 'updatedAt', label: 'Data modyfikacji' },
                        { key: 'signupCount30d', label: 'Zapisy 30 dni' },
                        { key: 'conversionRate', label: 'CR' },
                      ];
                      const onSort = (key: typeof formSortKey) => {
                        if (key === formSortKey) {
                          setFormSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                        } else {
                          setFormSortKey(key);
                          setFormSortDir('desc');
                        }
                      };

                      const sampleMode = assessment?.sampleMode ?? "none";
                      const consentMetrics = (assessment?.blocks?.consent?.metrics ?? {}) as Record<string, unknown>;
                      const structureMetrics = (assessment?.blocks?.structure?.metrics ?? {}) as Record<string, unknown>;
                      const stabilityMetrics = (assessment?.blocks?.stability?.metrics ?? {}) as Record<string, unknown>;
                      const effectivenessMetrics = (assessment?.blocks?.effectiveness?.metrics ?? {}) as Record<string, unknown>;

                      const consentRate = typeof consentMetrics.consentRate === "number" ? consentMetrics.consentRate : null;
                      const invalidRate = typeof consentMetrics.invalidRate === "number" ? consentMetrics.invalidRate : null;
                      const submitGapPct = typeof consentMetrics.submitGapPct === "number" ? consentMetrics.submitGapPct : null;
                      const doiRate = typeof consentMetrics.doiConfirmRate === "number" ? consentMetrics.doiConfirmRate : null;

                      const withFlow = typeof structureMetrics.withFlow === "number" ? structureMetrics.withFlow : null;
                      const withCooldown = typeof structureMetrics.withCooldown === "number" ? structureMetrics.withCooldown : null;
                      const withList = typeof structureMetrics.withList === "number" ? structureMetrics.withList : null;
                      const totalForms = typeof structureMetrics.totalForms === "number" ? structureMetrics.totalForms : null;

                      const zeroDaysMetric = typeof stabilityMetrics.zeroDays === "number" ? stabilityMetrics.zeroDays : null;
                      const maxSpikePctMetric =
                        typeof stabilityMetrics.maxSpikePct === "number" ? stabilityMetrics.maxSpikePct : null;

                      const submitRate =
                        typeof effectivenessMetrics.submitRate === "number" ? effectivenessMetrics.submitRate : null;
                      const hasImpressions = Boolean(assessment?.blocks?.effectiveness?.active);

                      const optInModeSetting = report.signupFormAudit?.optInMechanic.mode ?? "unknown";

                      const formProfiles = assessment?.formProfiles ?? 0;
                      const formShareOfBase = totalContacts > 0 ? Number(((formProfiles / totalContacts) * 100).toFixed(1)) : 0;

                      const risks: string[] = [];
                      const gaps: string[] = [];
                      const toImplement: string[] = [];

                      if (formProfiles === 0 || sampleMode === "none") {
                        gaps.push("Brak danych z formularzy — nie można przeprowadzić analizy.");
                      } else if (sampleMode === "micro") {
                        gaps.push("Niewystarczająca próba do analizy (mikro).");
                      } else {
                        if (consentRate !== null && consentRate < 80) {
                          risks.push("Ryzyko zgodowe: niski udział realnych zgód marketingowych.");
                        } else if (consentRate !== null && consentRate < 90) {
                          gaps.push("Luka zgodowa: udział realnych zgód poniżej 90%.");
                        }
                        if (invalidRate !== null && invalidRate > 0) {
                          if (invalidRate >= 10) {
                            risks.push("Ryzyko prawne: wysoki udział profili bez zgody.");
                          } else if (invalidRate >= 5) {
                            gaps.push("Luka zgodowa: część profili bez zgody marketingowej.");
                          }
                        }
                        if (submitGapPct !== null) {
                          if (submitGapPct > 20) {
                            risks.push("Ryzyko procesu: duża różnica submit → subscribed.");
                          } else if (submitGapPct >= 10) {
                            gaps.push("Luka procesu: różnica submit → subscribed 10–20%.");
                          }
                        }
                        if (optInModeSetting === "double_opt_in" && doiRate !== null) {
                          if (doiRate < 40) {
                            risks.push("Problem DOI: bardzo niska skuteczność potwierdzeń.");
                          } else if (doiRate < 60) {
                            gaps.push("Luka DOI: potwierdzenia 40–60%.");
                          }
                        }
                        if (hasImpressions && submitRate !== null) {
                          if (submitRate < 1) {
                            gaps.push("Niska skuteczność formularza (submit rate < 1%).");
                          } else if (submitRate < 3) {
                            gaps.push("Średnia skuteczność formularza (1–3%).");
                          }
                        }
                        if (zeroDaysMetric !== null && zeroDaysMetric > 7) {
                          risks.push("Ryzyko niestabilności wzrostu (wiele dni 0).");
                        }
                        if (maxSpikePctMetric !== null && maxSpikePctMetric > 300) {
                          risks.push("Nagły skok zapisów > 300% — możliwy import/akcja.");
                        }
                        if (withList !== null && totalForms !== null && withList < totalForms) {
                          risks.push("Błąd strukturalny: część formularzy bez przypisanej listy.");
                        }
                        if (withFlow !== null && withFlow === 0) {
                          gaps.push("Luka automatyzacji: brak welcome flow powiązanego z formularzem.");
                        }
                        if (withCooldown !== null && withCooldown === 0) {
                          gaps.push("Luka UX: brak cooldown/frequency control.");
                        }
                        if (formShareOfBase > 60) {
                          gaps.push("Formularze są kluczowe dla wzrostu bazy (>60%).");
                        } else if (formShareOfBase < 20) {
                          gaps.push("System mało zależny od formularza (<20%).");
                        }
                      }

                      if (sampleMode !== "none" && sampleMode !== "micro") {
                        if (risks.length > 0) {
                          if (consentRate !== null && consentRate < 90) {
                            toImplement.push("Uporządkować mechanikę zgody i treść komunikatu zapisu.");
                          }
                          if (submitGapPct !== null && submitGapPct >= 10) {
                            toImplement.push("Uspójnić submit → subscribed.");
                          }
                        }
                        if (withFlow !== null && withFlow === 0) {
                          toImplement.push("Wpiąć welcome flow do formularzy.");
                        }
                        if (withCooldown !== null && withCooldown === 0) {
                          toImplement.push("Wdrożyć cooldown i kontrolę częstotliwości.");
                        }
                        if (!hasImpressions) {
                          toImplement.push("Uzupełnić tracking impressions formularza.");
                        }
                        if (zeroDaysMetric !== null && zeroDaysMetric > 7) {
                          toImplement.push("Zweryfikować ekspozycję formularza w dniach 0.");
                        }
                      }

                      const formStatusById = new Map(
                        (report.signupFormAudit?.formsInKlaviyo?.items ?? []).map((item) => [
                          item.id,
                          item.status ?? null,
                        ]),
                      );

                      const renderTile = (title: string, items: string[]) => (
                        <div className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{title}</p>
                          <div className="mt-3 grid gap-1 text-xs text-slate-700">
                            {items.length > 0 ? (
                              items.map((item, idx) => <p key={`${title}-${idx}`}>{item}</p>)
                            ) : (
                              <p className="text-slate-500">Brak sygnałów.</p>
                            )}
                          </div>
                        </div>
                      );

                      const buildFormFlags = (form: typeof signupAuditDashboard.kpi.formPerformance[number]) => {
                        const manual = (form.manualOverrides ?? {}) as Record<string, unknown>;
                        const flowId = typeof manual.flowId === "string" ? manual.flowId : "";
                        const flowName = typeof manual.flowName === "string" ? manual.flowName : "";
                        const explicitNoFlow = flowId === "__none__";
                        const hasFlow = Boolean((flowId && flowId !== "__none__") || flowName);
                        const hasList = Boolean(form.listName || form.listHint);
                        const hasCooldownData =
                          typeof form.showAgainDays === "number" || typeof form.hideAfterSubmit === "boolean";
                        const hasCooldown =
                          (typeof form.showAgainDays === "number" && form.showAgainDays > 0) ||
                          form.hideAfterSubmit === true;
                        const delaySeconds = typeof form.delaySeconds === "number" ? form.delaySeconds : null;
                        const scrollPercent = typeof form.scrollPercent === "number" ? form.scrollPercent : null;
                        const hasAggressiveTiming = delaySeconds !== null && delaySeconds < 3 && scrollPercent === null;
                        const hidesAfterSubmit = form.hideAfterSubmit === true;
                        const desktopOnly = form.showOnDesktop === true && form.showOnMobile === false;
                        const offer = (form.offer ?? "").toString().toLowerCase();
                        const hasOffer = Boolean(form.offer && form.offer !== "Brak danych");
                        const isDiscountOffer =
                          offer.includes("rabat") ||
                          offer.includes("discount") ||
                          offer.includes("%") ||
                          offer.includes("coupon") ||
                          offer.includes("kod");
                        const isLive = (formStatusById.get(form.id) ?? "").toString().toLowerCase() === "live";
                        const excludesSubscribed = typeof manual.excludesSubscribed === "string" ? manual.excludesSubscribed : "";
                        const discountInWelcome = typeof manual.discountInWelcome === "string" ? manual.discountInWelcome : "";
                        const zeroPartyUsedInFlow = typeof manual.zeroPartyUsedInFlow === "string" ? manual.zeroPartyUsedInFlow : "";
                        const offerCodeMethod = typeof manual.offerCodeMethod === "string" ? manual.offerCodeMethod : "";
                        const mobileShare = report.base.deviceMobileShare ?? null;

                        const risksLocal: string[] = [];
                        const gapsLocal: string[] = [];
                        const optimLocal: string[] = [];

                        if (isLive && !hasList) {
                          risksLocal.push(
                            "Brak listy docelowej przy live formularzu → przerwany łańcuch formularz→lista; zapisy nie trafiają do systemu.",
                          );
                        }
                        if (hasList && explicitNoFlow) {
                          gapsLocal.push(
                            "Brak welcome flow → przerwany łańcuch formularz→lista→flow; zapisy nie są wykorzystywane operacyjnie.",
                          );
                        }
                        if (isDiscountOffer) {
                          if (discountInWelcome === "no") {
                            risksLocal.push(
                              "Rabat bez realizacji w welcome → niespójność oferty; przerwany łańcuch formularz→flow→realizacja korzyści.",
                            );
                          }
                        }
                        if (form.zeroPartyData && form.zeroPartyData.trim().length > 0) {
                          if (zeroPartyUsedInFlow === "no") {
                            gapsLocal.push(
                              "Zero-party zebrane, ale niewykorzystane w flow → brak wykorzystania operacyjnego danych.",
                            );
                          }
                        }
                        if (hasCooldownData) {
                          if (!hasCooldown) {
                            risksLocal.push(
                              "Brak cooldown → ryzyko nadmiernej ekspozycji; problem konfiguracji UX.",
                            );
                          } else if (typeof form.showAgainDays === "number") {
                            if (form.showAgainDays < 3) {
                              optimLocal.push(
                                "Cooldown < 3 dni → potencjalna agresywność ekspozycji; rekomendacja optymalizacji.",
                              );
                            }
                            if (form.showAgainDays > 30) {
                              optimLocal.push(
                                "Cooldown > 30 dni → ograniczenie ekspozycji; rekomendacja optymalizacji.",
                              );
                            }
                          }
                        }
                        if (excludesSubscribed === "no") {
                          risksLocal.push(
                            "Brak wykluczenia zapisanych → błąd konfiguracji; ryzyko nadmiernej ekspozycji.",
                          );
                        }
                        if (desktopOnly && typeof mobileShare === "number" && mobileShare > 50) {
                          risksLocal.push(
                            "Formularz tylko desktop przy >50% ruchu mobile → ograniczona ekspozycja; ryzyko spadku pozyskania.",
                          );
                        }
                        if (hasOffer === false && form.offer && form.offer !== "Brak danych") {
                          gapsLocal.push(
                            "Brak jednoznacznej propozycji wartości → słaba spójność oferty; ryzyko niskiej jakości leadów.",
                          );
                        }
                        if (form.stepsCount && form.stepsCount > 1 && !form.hasAbTest) {
                          optimLocal.push(
                            "Multi-step bez testu A/B → potencjał optymalizacji długości procesu.",
                          );
                        }
                        if (isLive && !form.hasAbTest) {
                          optimLocal.push(
                            "Brak testów A/B przy aktywnym formularzu → potencjał optymalizacji konwersji.",
                          );
                        }
                        if (hasAggressiveTiming) {
                          optimLocal.push(
                            "Trigger oparty tylko na krótkim czasie → potencjalna agresywność ekspozycji; rekomendacja optymalizacji.",
                          );
                        }
                        return { risksLocal, gapsLocal, optimLocal };
                      };

                      const aggregateFlags = () => {
                        const riskCounts = new Map<string, number>();
                        const gapCounts = new Map<string, number>();
                        const optCounts = new Map<string, number>();
                        const total = signupAuditDashboard.kpi.formPerformance.length;
                        signupAuditDashboard.kpi.formPerformance.forEach((form) => {
                          const { risksLocal, gapsLocal, optimLocal } = buildFormFlags(form);
                          risksLocal.forEach((item) => riskCounts.set(item, (riskCounts.get(item) ?? 0) + 1));
                          gapsLocal.forEach((item) => gapCounts.set(item, (gapCounts.get(item) ?? 0) + 1));
                          optimLocal.forEach((item) => optCounts.set(item, (optCounts.get(item) ?? 0) + 1));
                        });
                        const formatCounts = (map: Map<string, number>) =>
                          Array.from(map.entries()).map(([label, count]) =>
                            total > 0 ? `${label} (${count}/${total})` : label,
                          );
                        return {
                          risks: formatCounts(riskCounts),
                          gaps: formatCounts(gapCounts),
                          optim: formatCounts(optCounts),
                        };
                      };

                      const aggregated = aggregateFlags();
                      return (
                        <>
                          <div className="grid gap-3 lg:grid-cols-6">
                            <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-3 text-center shadow-[0_16px_40px_-28px_rgba(63,74,219,0.45)] backdrop-blur-xl">
                              <p className="text-[11px] uppercase tracking-wide text-slate-500">Aktywne formularze</p>
                              <p className="mt-1 text-2xl font-semibold text-slate-900">{formsActive}</p>
                              <p className="text-[10px] text-slate-500">z {formsTotal}</p>
                            </div>
                            <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-3 text-center shadow-[0_16px_40px_-28px_rgba(63,74,219,0.45)] backdrop-blur-xl">
                              <p className="text-[11px] uppercase tracking-wide text-slate-500">% bazy z formularzy</p>
                              <p className="mt-1 text-2xl font-semibold text-slate-900">{formProfilesShare}%</p>
                            </div>
                            <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-3 text-center shadow-[0_16px_40px_-28px_rgba(63,74,219,0.45)] backdrop-blur-xl">
                              <p className="text-[11px] uppercase tracking-wide text-slate-500">CR średni</p>
                              <p className="mt-1 text-2xl font-semibold text-slate-900">{avgCr}%</p>
                            </div>
                            <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-3 text-center shadow-[0_16px_40px_-28px_rgba(63,74,219,0.45)] backdrop-blur-xl">
                              <p className="text-[11px] uppercase tracking-wide text-slate-500">% zgód poprawnych</p>
                              <p className="mt-1 text-2xl font-semibold text-slate-900">{consentCorrectPct}%</p>
                            </div>
                            <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-3 text-center shadow-[0_16px_40px_-28px_rgba(63,74,219,0.45)] backdrop-blur-xl">
                              <p className="text-[11px] uppercase tracking-wide text-slate-500">Opt-in</p>
                              <p className="mt-1 text-lg font-semibold text-slate-900">{optInMode}</p>
                            </div>
                            <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-3 text-center shadow-[0_16px_40px_-28px_rgba(63,74,219,0.45)] backdrop-blur-xl">
                              <p className="text-[11px] uppercase tracking-wide text-slate-500">Bounce profili</p>
                              <p className="mt-1 text-2xl font-semibold text-slate-900">{bounceFormProfiles}%</p>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
                            <div className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Źródło bazy</p>
                              <div className="mt-3 flex items-center gap-4">
                                <svg viewBox="0 0 140 140" className="h-28 w-28">
                                  {(() => {
                                    const circumference = 2 * Math.PI * 56;
                                    let offset = 0;
                                    return donutSegments.map((segment) => {
                                      const length = (segment.value / sourceTotal) * circumference;
                                      const circle = (
                                        <circle
                                          key={segment.label}
                                          cx="70"
                                          cy="70"
                                          r="56"
                                          fill="none"
                                          stroke={segment.color}
                                          strokeWidth="14"
                                          strokeDasharray={`${length} ${circumference}`}
                                          strokeDashoffset={-offset}
                                          strokeLinecap="round"
                                          transform="rotate(-90 70 70)"
                                        />
                                      );
                                      offset += length;
                                      return circle;
                                    });
                                  })()}
                                </svg>
                                <div className="space-y-2 text-xs text-slate-700">
                                  {donutSegments.map((segment) => (
                                    <div key={segment.label} className="flex items-center gap-2">
                                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
                                      <span>{segment.label}</span>
                                      <span className="ml-auto font-semibold">{segment.value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Stabilność zapisów</p>
                                <span className="text-[11px] text-slate-500">Dni 0: {zeroDays}</span>
                              </div>
                              <div className="mt-3">
                                {dailySeries.length > 0 ? (
                                  (() => {
                                    const width = 420;
                                    const height = 90;
                                    const step = width / Math.max(dailySeries.length - 1, 1);
                                    const points = dailySeries
                                      .map((item, idx) => {
                                        const x = idx * step;
                                        const y = height - (item.count / maxDaily) * height;
                                        return `${x},${y}`;
                                      })
                                      .join(' ');
                                    return (
                                      <svg viewBox={`0 0 ${width} ${height}`} className="h-24 w-full">
                                        <polyline fill="none" stroke="#4ABF8A" strokeWidth="2.5" points={points} />
                                        {dailySeries.map((item, idx) => {
                                          if (item.count !== 0) return null;
                                          const x = idx * step;
                                          const y = height;
                                          return <circle key={`${item.date}-zero`} cx={x} cy={y} r="2.5" fill="#F08AA0" />;
                                        })}
                                      </svg>
                                    );
                                  })()
                                ) : (
                                  <p className="text-xs text-slate-500">Brak danych z Events API.</p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="mt-5 rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Inwentaryzacja formularzy</p>
                            <div className="mt-3 overflow-auto">
                              <table className="min-w-[720px] w-full text-left text-xs text-slate-700">
                                <thead>
                                  <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500">
                                    <th className="pb-2 pr-3">ID</th>
                                    {headers.map((header) => (
                                      <th key={header.key} className="pb-2 pr-3">
                                        <button type="button" onClick={() => onSort(header.key)} className="flex items-center gap-1">
                                          {header.label}
                                          {formSortKey === header.key && (formSortDir === 'asc' ? '↑' : '↓')}
                                        </button>
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {sortedRows.map((row) => (
                                    <tr key={row.id} className="border-b border-slate-100">
                                      <td className="py-2 pr-3">{row.id}</td>
                                      <td className="py-2 pr-3">{row.name}</td>
                                      <td className="py-2 pr-3">{row.status}</td>
                                      <td className="py-2 pr-3">{row.type}</td>
                                      <td className="py-2 pr-3">{formatShortDate(row.updatedAt)}</td>
                                      <td className="py-2 pr-3">{row.signupCount30d}</td>
                                      <td className="py-2 pr-3">{row.conversionRate}%</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-3 lg:grid-cols-2">
                            <div className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Skuteczność formularzy – CR</p>
                              {(() => {
                                const forms = signupAuditDashboard.kpi.formPerformance;
                                const max = Math.max(...forms.map((form) => form.conversionRate), 1);
                                return (
                                  <div className="mt-3 space-y-2">
                                    {forms.map((form) => (
                                      <div key={`cr-${form.id}`} className="grid grid-cols-[1fr_60px] items-center gap-2">
                                        <div className="h-2.5 w-full rounded-full bg-slate-100">
                                          <div className="h-full rounded-full bg-[#4ABF8A]" style={{ width: `${(form.conversionRate / max) * 100}%` }} />
                                        </div>
                                        <span className="text-[11px] text-slate-600">{form.conversionRate}%</span>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })()}
                            </div>
                            <div className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Skuteczność formularzy – zapisy 30 dni</p>
                              {(() => {
                                const forms = signupAuditDashboard.kpi.formPerformance;
                                const max = Math.max(...forms.map((form) => form.signupCount30d), 1);
                                return (
                                  <div className="mt-3 space-y-2">
                                    {forms.map((form) => (
                                      <div key={`signup-${form.id}`} className="grid grid-cols-[1fr_60px] items-center gap-2">
                                        <div className="h-2.5 w-full rounded-full bg-slate-100">
                                          <div className="h-full rounded-full bg-[#F4B56A]" style={{ width: `${(form.signupCount30d / max) * 100}%` }} />
                                        </div>
                                        <span className="text-[11px] text-slate-600">{form.signupCount30d}</span>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>

                          <div className="mt-4 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
                            <div className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Consent quality</p>
                              {(() => {
                                const total = report.consent.consentAccountsTotal ?? totalContacts;
                                const subscribed = report.consent.verifiedCount ?? 0;
                                const unsubscribed = report.consent.invalidExternalCount ?? 0;
                                const never = Math.max(total - subscribed - unsubscribed, 0);
                                const subPct = percent(subscribed, Math.max(total, 1));
                                const unsubPct = percent(unsubscribed, Math.max(total, 1));
                                const neverPct = percent(never, Math.max(total, 1));
                                return (
                                  <>
                                    <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-100">
                                      <div className="h-full bg-[#4ABF8A]" style={{ width: `${subPct}%` }} />
                                      <div className="h-full bg-[#F4B56A]" style={{ width: `${unsubPct}%` }} />
                                      <div className="h-full bg-[#F08AA0]" style={{ width: `${neverPct}%` }} />
                                    </div>
                                    <div className="mt-3 grid gap-1 text-xs text-slate-600">
                                      <div>Subscribed: {subscribed}</div>
                                      <div>Unsubscribed: {unsubscribed}</div>
                                      <div>Never: {never}</div>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                            <div className="rounded-[22px] border border-white/70 bg-white/55 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Consent status</p>
                              {(() => {
                                const total = report.consent.consentAccountsTotal ?? totalContacts;
                                const verified = report.consent.verifiedCount ?? 0;
                                const invalid = report.consent.invalidExternalCount ?? 0;
                                const submissionsTotal = signupAuditDashboard.kpi.formPerformance.reduce(
                                  (sum, form) => sum + (form.submissions ?? 0),
                                  0,
                                );
                                const signupEffectiveness =
                                  submissionsTotal > 0 ? percent(signupAuditDashboard.kpi.signups30d, submissionsTotal) : 0;
                                const sampleMode = report.signupFormAudit?.assessment?.sampleMode ?? "none";
                                const significanceLabel =
                                  sampleMode === "micro"
                                    ? "niska (mikro próba)"
                                    : sampleMode === "orientational"
                                      ? "średnia (orientacyjna)"
                                      : sampleMode === "full"
                                        ? "wysoka"
                                        : "brak";
                                const showInterpretation = sampleMode !== "micro" && sampleMode !== "none";
                                return (
                                  <div className="mt-3 grid gap-2 text-xs text-slate-700">
                                    <p>Zgody marketingowe: <span className="font-semibold">{verified} z {total}</span></p>
                                    <p>Brak zgody: <span className="font-semibold">{invalid} z {total}</span></p>
                                    <p>Skuteczność zapisu: <span className="font-semibold">{signupEffectiveness}%</span></p>
                                    <p>Istotność statystyczna: <span className="font-semibold">{significanceLabel}</span></p>
                                    {showInterpretation ? (
                                      <p className="text-[11px] text-slate-500">Wyniki z oceną interpretacyjną zgodnie z trybem próby.</p>
                                    ) : null}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>

                          <div className="mt-4 rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Jakość po zapisie</p>
                            <div className="mt-3 overflow-auto">
                              <table className="min-w-[500px] w-full text-left text-xs text-slate-700">
                                <thead>
                                  <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500">
                                    <th className="pb-2">Metryka</th>
                                    <th className="pb-2">Formularze</th>
                                    <th className="pb-2">Średnia konta</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr className="border-b border-slate-100">
                                    <td className="py-2">Open rate</td>
                                    <td className="py-2">—</td>
                                    <td className="py-2">{report.deliverability.days30.bounceRate}%</td>
                                  </tr>
                                  <tr className="border-b border-slate-100">
                                    <td className="py-2">Bounce rate</td>
                                    <td className="py-2">—</td>
                                    <td className="py-2">{report.deliverability.days30.bounceRate}%</td>
                                  </tr>
                                  <tr>
                                    <td className="py-2">Unsub rate</td>
                                    <td className="py-2">—</td>
                                    <td className="py-2">{report.deliverability.days30.unsubscribeRate}%</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>

                          <div className="mt-4 rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Stabilność wzrostu</p>
                            <div className="mt-3">
                              {dailySeries.length > 0 ? (
                                (() => {
                                  const width = 420;
                                  const height = 90;
                                  const step = width / Math.max(dailySeries.length - 1, 1);
                                  const points = dailySeries
                                    .map((item, idx) => {
                                      const x = idx * step;
                                      const y = height - (item.count / maxDaily) * height;
                                      return `${x},${y}`;
                                    })
                                    .join(' ');
                                  return (
                                    <svg viewBox={`0 0 ${width} ${height}`} className="h-24 w-full">
                                      <polyline fill="none" stroke="#4ABF8A" strokeWidth="2.5" points={points} />
                                    </svg>
                                  );
                                })()
                              ) : (
                                <p className="text-xs text-slate-500">Brak danych z Events API.</p>
                              )}
                              <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
                                <span>Dni 0: <span className="font-semibold">{zeroDays}</span></span>
                                <span>Max skok %: <span className="font-semibold">{maxSpikePct}%</span></span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Manualna ocena</p>
                            <div className="mt-3 grid gap-3">
                              {signupAuditDashboard.kpi.formPerformance.map((form) => (
                                <details key={form.id} className="rounded-xl border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-3 shadow-[0_14px_35px_-28px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                                  <summary className="cursor-pointer text-sm font-semibold text-slate-800">
                                    FORM: {form.name}
                                  </summary>
                                  <div className="mt-3 grid gap-2 text-xs text-slate-700 sm:grid-cols-2">
                                    <div>Typ popupu: <span className="font-medium">{form.popupType || '—'}</span></div>
                                    <div>Trigger: <span className="font-medium">{form.triggerMode || '—'}</span></div>
                                    <div>Cooldown: <span className="font-medium">{form.showAgainDays ? `${form.showAgainDays} dni` : '—'}</span></div>
                                    <div>Frequency control: <span className="font-medium">{form.hideAfterSubmit ? 'Nie pokazuje po zapisie' : '—'}</span></div>
                                    <div>Desktop: <span className="font-medium">{form.showOnDesktop ? 'tak' : 'nie'}</span></div>
                                    <div>Mobile: <span className="font-medium">{form.showOnMobile ? 'tak' : 'nie'}</span></div>
                                    <div>A/B test: <span className="font-medium">{form.hasAbTest ? 'tak' : 'nie'}</span></div>
                                    <div>Multi-step: <span className="font-medium">{form.stepsCount ? `${form.stepsCount} kroki` : 'Single-step'}</span></div>
                                    <div>Oferta: <span className="font-medium">{form.offer || '—'}</span></div>
                                    <div className="sm:col-span-2">
                                      <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Lista docelowa</label>
                                      <div className="mt-1 rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-xs text-slate-700">
                                        {form.listName || form.listHint || '—'}
                                      </div>
                                    </div>
                                    <div className="sm:col-span-2">
                                      <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Powiązany z flow</label>
                                      <select
                                        value={formOverrideInputs[form.id]?.flowId ?? ""}
                                        onChange={(event) =>
                                          setFormOverrideInputs((prev) => ({
                                            ...prev,
                                            [form.id]: {
                                              zeroPartyData: prev[form.id]?.zeroPartyData ?? "",
                                              note: prev[form.id]?.note ?? "",
                                              flowId: event.target.value,
                                            },
                                          }))
                                        }
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-xs text-slate-700"
                                      >
                                        <option value="">Brak danych</option>
                                        <option value="__none__">Brak flow</option>
                                        {(report?.flows ?? []).map((flow) => (
                                          <option key={flow.id} value={flow.id}>
                                            {flow.name}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="sm:col-span-2">
                                      <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Wyklucza zapisanych?</label>
                                      <select
                                        value={formOverrideInputs[form.id]?.excludesSubscribed ?? ""}
                                        onChange={(event) =>
                                          setFormOverrideInputs((prev) => ({
                                            ...prev,
                                            [form.id]: {
                                              ...prev[form.id],
                                              excludesSubscribed: event.target.value,
                                            },
                                          }))
                                        }
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-xs text-slate-700"
                                      >
                                        <option value="">Brak danych</option>
                                        <option value="yes">Tak</option>
                                        <option value="no">Nie</option>
                                      </select>
                                    </div>
                                    <div className="sm:col-span-2">
                                      <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Rabat realizowany w welcome?</label>
                                      <select
                                        value={formOverrideInputs[form.id]?.discountInWelcome ?? ""}
                                        onChange={(event) =>
                                          setFormOverrideInputs((prev) => ({
                                            ...prev,
                                            [form.id]: {
                                              ...prev[form.id],
                                              discountInWelcome: event.target.value,
                                            },
                                          }))
                                        }
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-xs text-slate-700"
                                      >
                                        <option value="">Brak danych</option>
                                        <option value="yes">Tak</option>
                                        <option value="no">Nie</option>
                                      </select>
                                    </div>
                                    <div className="sm:col-span-2">
                                      <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Zero‑party wykorzystywane w flow?</label>
                                      <select
                                        value={formOverrideInputs[form.id]?.zeroPartyUsedInFlow ?? ""}
                                        onChange={(event) =>
                                          setFormOverrideInputs((prev) => ({
                                            ...prev,
                                            [form.id]: {
                                              ...prev[form.id],
                                              zeroPartyUsedInFlow: event.target.value,
                                            },
                                          }))
                                        }
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-xs text-slate-700"
                                      >
                                        <option value="">Brak danych</option>
                                        <option value="yes">Tak</option>
                                        <option value="no">Nie</option>
                                      </select>
                                    </div>
                                    <div className="sm:col-span-2">
                                      <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Sposób dostarczenia kodu</label>
                                      <input
                                        value={formOverrideInputs[form.id]?.offerCodeMethod ?? ""}
                                        onChange={(event) =>
                                          setFormOverrideInputs((prev) => ({
                                            ...prev,
                                            [form.id]: {
                                              ...prev[form.id],
                                              offerCodeMethod: event.target.value,
                                            },
                                          }))
                                        }
                                        placeholder="np. kod w welcome / dynamiczny kupon"
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-xs text-slate-700"
                                      />
                                    </div>
                                    <div className="sm:col-span-2">
                                      <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Zero-party data</label>
                                      <input
                                        value={formOverrideInputs[form.id]?.zeroPartyData ?? ""}
                                        onChange={(event) =>
                                          setFormOverrideInputs((prev) => ({
                                            ...prev,
                                            [form.id]: {
                                              zeroPartyData: event.target.value,
                                              note: prev[form.id]?.note ?? "",
                                              flowId: prev[form.id]?.flowId ?? "",
                                            },
                                          }))
                                        }
                                        placeholder="np. quiz / preferencje / segmentacja"
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-xs text-slate-700"
                                      />
                                    </div>
                                    <div className="sm:col-span-2">
                                      <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Notatka</label>
                                      <textarea
                                        value={formOverrideInputs[form.id]?.note ?? ""}
                                        onChange={(event) =>
                                          setFormOverrideInputs((prev) => ({
                                            ...prev,
                                            [form.id]: {
                                              zeroPartyData: prev[form.id]?.zeroPartyData ?? "",
                                              note: event.target.value,
                                              flowId: prev[form.id]?.flowId ?? "",
                                            },
                                          }))
                                        }
                                        placeholder="Krótka notatka do formularza"
                                        rows={2}
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-xs text-slate-700"
                                      />
                                    </div>
                                    <div className="sm:col-span-2 flex items-center justify-between">
                                      <span className="text-[11px] text-slate-500">
                                        {formOverrideStatus[form.id] === "saving"
                                          ? "Zapisywanie..."
                                          : formOverrideStatus[form.id] === "saved"
                                            ? "Zapisano"
                                            : formOverrideStatus[form.id] === "error"
                                              ? "Błąd zapisu"
                                              : " "}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => void saveFormOverride(form.id, (form.manualOverrides ?? {}) as Record<string, unknown>)}
                                        className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                      >
                                        Zapisz
                                      </button>
                                    </div>
                                  </div>
                                </details>
                              ))}
                            </div>
                          </div>

                          <div className="mt-4 rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Podsumowanie formularzy zapisu</p>
                            <div className="mt-3 grid gap-3 lg:grid-cols-3">
                              {renderTile("Ryzyko", aggregated.risks)}
                              {renderTile("Luki", aggregated.gaps)}
                              {renderTile("Do wprowadzenia", aggregated.optim)}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </>
                )}
                </>
              )}
              </div>
            </div>
          )}

          {report.segmentAudit && (
            <div
              id="segment-audit"
              className="mt-6 rounded-[28px] border border-white/50 bg-gradient-to-br from-[#cfd9ff] via-[#e3e9ff] to-[#f7f9ff] p-4 shadow-[0_30px_80px_-45px_rgba(63,74,219,0.45)] sm:p-5"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-slate-900">Audyt Segmentów</h2>
                <button
                  type="button"
                  onClick={() => setIsSegmentAuditExpanded((prev) => !prev)}
                  className="rounded border border-white/70 bg-white/70 px-2 py-1 text-xs text-slate-700 shadow-[0_10px_26px_-18px_rgba(63,74,219,0.35)] hover:bg-white"
                >
                  {isSegmentAuditExpanded ? "Zwin" : "Rozwin"}
                </button>
              </div>
              <p className="text-sm text-slate-600">Źródło: Klaviyo `/segments` (API key).</p>

              {isSegmentAuditExpanded && (
                <>
                  <div className="mt-3 grid gap-4">
                    {(() => {
                      const totalProfiles = report.base.totalProfiles || 0;
                      const smallSample = totalProfiles > 0 && totalProfiles < 50;
                      const segmentsAccess = report.base.segmentsAccess;
                      const segmentsStatusCode = report.base.segmentsStatusCode ?? null;
                      const segmentsTotal = report.segmentAudit?.totalSegments ?? 0;
                      const segmentApiNote =
                        segmentsAccess !== "ok"
                          ? segmentsStatusCode === 401 || segmentsStatusCode === 403
                            ? "Brak dostępu do API segmentów (401/403)."
                            : segmentsStatusCode === 429 || (segmentsStatusCode && segmentsStatusCode >= 500)
                              ? "Limit/timeout API segmentów (429/5xx)."
                              : "Brak dostępu do API segmentów."
                          : segmentsTotal === 0
                            ? "Brak segmentów w koncie."
                            : "Brak metryk – konto bez wysyłek / brak historii.";
                      const engagedNames = report.segmentAudit.keySegmentsFound.engaged.map((name) => name.toLowerCase());
                      const unengagedNames = report.segmentAudit.keySegmentsFound.unengaged.map((name) =>
                        name.toLowerCase(),
                      );
                      const segmentNamePool = [
                        ...(report.segmentAudit.topSegments ?? []).map((item) => item.name),
                        ...(report.base.topSegments ?? []).map((item) => item.name),
                        ...((report.base.segmentsWithProfiles ?? []) as Array<{ name?: string }>).map(
                          (item) => item.name ?? "",
                        ),
                      ]
                        .map((name) => name.toLowerCase())
                        .filter(Boolean);
                      const hasNamedSegment = (pattern: RegExp) =>
                        segmentNamePool.some((name) => pattern.test(name));
                      const vipCount = report.segmentAudit.keySegmentsFound.vip.length;
                      const hasWindow = (days: number) =>
                        engagedNames.some((name) => new RegExp(`\\b${days}\\b`).test(name) || name.includes(`${days} `));
                      const has180Plus =
                        engagedNames.some((name) => /180\+|180\s*\+|180\s*plus/.test(name)) ||
                        unengagedNames.some((name) => /180\+|180\s*\+|180\s*plus|inactive|unengaged/.test(name));

                      const architectureItems = [
                        { label: "Engaged 15 dni", value: hasWindow(15) ? "Wykryto" : "Brak segmentu" },
                        { label: "Engaged 30 dni", value: hasWindow(30) ? "Wykryto" : "Brak segmentu" },
                        { label: "Engaged 45 dni", value: hasWindow(45) ? "Wykryto" : "Brak segmentu" },
                        { label: "Engaged 60 dni", value: hasWindow(60) ? "Wykryto" : "Brak segmentu" },
                        { label: "Engaged 90 dni", value: hasWindow(90) ? "Wykryto" : "Brak segmentu" },
                        { label: "Engaged 180 dni", value: hasWindow(180) ? "Wykryto" : "Brak segmentu" },
                        { label: "Engaged 180+ (nieaktywni)", value: has180Plus ? "Wykryto" : "Brak segmentu" },
                        { label: "VIP (LTV / purchase-based)", value: vipCount > 0 ? `Wykryto (${vipCount})` : "Brak segmentu" },
                        { label: "Recent buyers", value: "Brak segmentu" },
                        { label: "Never purchased", value: "Brak segmentu" },
                        { label: "Suppressed exclusion segment", value: "Brak segmentu" },
                      ];

                      const mainSegments = report.segmentAudit.topSegments.map((segment) => ({
                        name: segment.name,
                        size: segment.count,
                        share: totalProfiles > 0 ? `${((segment.count / totalProfiles) * 100).toFixed(1)}%` : "Brak danych",
                      }));

                      const segmentRisks: string[] = [];
                      const segmentGaps: string[] = [];
                      const segmentImprovements: Array<{ label: string; priority: number }> = [];
                      const pushImprovement = (label: string, priority: number) => {
                        if (!segmentImprovements.some((item) => item.label === label)) {
                          segmentImprovements.push({ label, priority });
                        }
                      };

                      if (!hasWindow(30)) {
                        segmentRisks.push(
                          "Brak segmentu engaged 30 → brak bezpiecznego targetu kampanii; ryzyko presji wysyłkowej.",
                        );
                        pushImprovement(
                          "Zbudować segment Engaged 30 (open/click ≤30 dni) i używać jako podstawy kampanii.",
                          2,
                        );
                      }
                      if (!hasWindow(60)) {
                        segmentGaps.push("Brak segmentu engaged 60 → brak warstwy pośredniej między 30 a 90.");
                        pushImprovement("Utworzyć segment Engaged 60 jako warstwę pośrednią między 30 a 90.", 3);
                      }
                      if (!hasWindow(90)) {
                        segmentGaps.push(
                          "Brak segmentu engaged 90 → brak warstwy podtrzymania zaangażowania; luka w systemie retencji.",
                        );
                        pushImprovement("Utworzyć segment Engaged 90 jako warstwę podtrzymania zaangażowania.", 3);
                      }
                      if (!hasWindow(180)) {
                        segmentGaps.push("Brak segmentu engaged 180 → brak pełnej kontroli ciepłej bazy.");
                        pushImprovement("Utworzyć segment 0–180 dni dla pełnej kontroli ciepłej bazy.", 3);
                      }
                      if (!has180Plus) {
                        segmentGaps.push(
                          "Brak segmentu engaged 180+ → brak warstwy wygaszania i kontroli zimnej bazy.",
                        );
                        pushImprovement(
                          "Utworzyć segment 180+ i wykluczać go z kampanii masowych.",
                          1,
                        );
                      }
                      if (vipCount === 0) {
                        segmentGaps.push("Brak segmentu VIP → brak ochrony klientów o najwyższej wartości.");
                        pushImprovement("Utworzyć segment VIP oparty o LTV / liczbę zakupów.", 4);
                      }

                      const hasRecentBuyers = hasNamedSegment(/recent\s*buyers|recent\s*purchase|last\s*30\s*days|buyers\s*30/i);
                      if (!hasRecentBuyers) {
                        segmentGaps.push("Brak segmentu Recent Buyers → luka w doświadczeniu post‑purchase.");
                        pushImprovement(
                          "Utworzyć segment Recent Buyers (np. 30 dni) i wykluczać z kampanii promocyjnych.",
                          3,
                        );
                      }

                      const hasNeverPurchased = hasNamedSegment(/never\s*purchased|no\s*purchase|prospect|prospects|non\s*buyers/i);
                      if (!hasNeverPurchased) {
                        segmentGaps.push("Brak segmentu Never Purchased → brak rozdzielenia prospect vs customer.");
                        pushImprovement(
                          "Utworzyć segment prospectów (Never Purchased) i dostosować komunikację.",
                          3,
                        );
                      }

                      const hasSuppressedExclude = hasNamedSegment(/suppressed|suppression|exclude\s*suppressed|supression/i);
                      if (!hasSuppressedExclude) {
                        segmentGaps.push("Brak segmentu wykluczającego suppressed → luka w higienie wysyłek.");
                        pushImprovement(
                          "Utworzyć techniczny segment wykluczający suppressed.",
                          1,
                        );
                      }

                      const improvementLabels = segmentImprovements
                        .sort((a, b) => a.priority - b.priority)
                        .slice(0, 3)
                        .map((item) => item.label);
                      const hasGaps = segmentGaps.length > 0;
                      const hasRisks = segmentRisks.length > 0;
                      const finalImprovements =
                        hasGaps || hasRisks
                          ? improvementLabels
                          : ["System segmentacji operacyjnie poprawny – rekomendacja: optymalizacja testowa."];

                      return (
                        <>
                          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                            <div className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Architektura systemu</p>
                              <div className="mt-3 grid gap-2 text-xs text-slate-700 sm:grid-cols-2">
                                {architectureItems.map((item) => (
                                  <div key={item.label} className="flex items-center justify-between gap-2 rounded-lg border border-white/70 bg-white/70 px-3 py-2">
                                    <span>{item.label}</span>
                                    <span className="text-[11px] font-semibold text-slate-500">{item.value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Średnia liczba kampanii / profil (30 dni)</p>
                              <p className="mt-4 text-sm font-semibold text-slate-500">Brak danych</p>
                              <p className="mt-2 text-xs text-slate-500">{segmentApiNote}</p>
                            </div>
                          </div>

                            <div className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Engagement system</p>
                                <span className="text-[11px] text-slate-500">Brak danych</span>
                              </div>
                              <div className="mt-3 h-24 rounded-xl border border-white/70 bg-white/60" />
                              <p className="mt-2 text-xs text-slate-500">{segmentApiNote}</p>
                            </div>

                          <div className="grid gap-4 lg:grid-cols-3">
                            <div className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Snapshot systemu segmentów</p>
                              <div className="mt-3 grid gap-2 text-xs text-slate-700">
                                <div className="flex items-center justify-between"><span>Liczba segmentów</span><span className="font-semibold">{report.segmentAudit.totalSegments}</span></div>
                                <div className="flex items-center justify-between"><span>% dynamicznych</span><span className="text-slate-500">Brak danych</span></div>
                                <div className="flex items-center justify-between"><span>% używanych w kampaniach (90 dni)</span><span className="text-slate-500">Brak danych</span></div>
                                <div className="flex items-center justify-between"><span>% nieużywanych</span><span className="text-slate-500">Brak danych</span></div>
                                <div className="flex items-center justify-between"><span>Średni overlap top 5</span><span className="text-slate-500">Brak danych</span></div>
                              </div>
                              <p className="mt-3 text-xs text-slate-500">{segmentApiNote}</p>
                            </div>
                            <div className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Overlap (top 5)</p>
                              <div className="mt-3 space-y-2 text-xs text-slate-500">
                                <div>Macierz: Brak danych</div>
                                <div>Średni overlap: Brak danych</div>
                                <div>Największy overlap: Brak danych</div>
                              </div>
                              <p className="mt-3 text-xs text-slate-500">{segmentApiNote}</p>
                            </div>
                            <div className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Kampanie → segmenty vs cała baza</p>
                              <div className="mt-3 space-y-2 text-xs text-slate-500">
                                <div>% kampanii do segmentów: Brak danych</div>
                                <div>% kampanii do entire list: Brak danych</div>
                              </div>
                              <p className="mt-3 text-xs text-slate-500">{segmentApiNote}</p>
                            </div>
                          </div>

                          <div className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Tabela główna segmentów</p>
                            <div className="mt-3 overflow-auto">
                              <table className="min-w-[720px] w-full text-left text-xs text-slate-700">
                                <thead>
                                  <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500">
                                    <th className="pb-2 pr-3">Segment</th>
                                    <th className="pb-2 pr-3">Rozmiar</th>
                                    <th className="pb-2 pr-3">% Bazy</th>
                                    <th className="pb-2 pr-3">Subscribed %</th>
                                    <th className="pb-2 pr-3">Nieaktywni %</th>
                                    <th className="pb-2 pr-3">Revenue / profil</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {mainSegments.length > 0 ? (
                                    mainSegments.map((segment) => (
                                      <tr key={segment.name} className="border-b border-slate-100">
                                        <td className="py-2 pr-3">{segment.name}</td>
                                        <td className="py-2 pr-3">{segment.size}</td>
                                        <td className="py-2 pr-3">{segment.share}</td>
                                        <td className="py-2 pr-3 text-slate-500">Brak danych</td>
                                        <td className="py-2 pr-3 text-slate-500">Brak danych</td>
                                        <td className="py-2 pr-3 text-slate-500">Brak danych</td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td className="py-3 text-slate-500" colSpan={6}>Brak danych o segmentach.</td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          <div className="grid gap-4 lg:grid-cols-2">
                            <div className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Stabilność i struktura – trend wielkości (top 5)</p>
                              <div className="mt-3 h-24 rounded-xl border border-white/70 bg-white/60" />
                              <p className="mt-2 text-xs text-slate-500">{segmentApiNote}</p>
                            </div>
                            <div className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Rozkład wielkości segmentów</p>
                              <div className="mt-3 h-24 rounded-xl border border-white/70 bg-white/60" />
                              <p className="mt-2 text-xs text-slate-500">{segmentApiNote}</p>
                            </div>
                          </div>

                          <div className="grid gap-4 lg:grid-cols-2">
                            <div className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Jakość reputacyjna</p>
                              <div className="mt-3 h-24 rounded-xl border border-white/70 bg-white/60" />
                              <p className="mt-2 text-xs text-slate-500">{segmentApiNote}</p>
                            </div>
                            <div className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Skuteczność behawioralna</p>
                              <div className="mt-3 overflow-auto">
                                <table className="min-w-[520px] w-full text-left text-xs text-slate-700">
                                  <thead>
                                    <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500">
                                      <th className="pb-2 pr-3">Segment</th>
                                      <th className="pb-2 pr-3">Open %</th>
                                      <th className="pb-2 pr-3">Click %</th>
                                      <th className="pb-2 pr-3">Purchase %</th>
                                      <th className="pb-2 pr-3">Revenue / profil</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {mainSegments.length > 0 ? (
                                      mainSegments.map((segment) => (
                                        <tr key={`perf-${segment.name}`} className="border-b border-slate-100">
                                          <td className="py-2 pr-3">{segment.name}</td>
                                          <td className="py-2 pr-3 text-slate-500">Brak danych</td>
                                          <td className="py-2 pr-3 text-slate-500">Brak danych</td>
                                          <td className="py-2 pr-3 text-slate-500">Brak danych</td>
                                          <td className="py-2 pr-3 text-slate-500">Brak danych</td>
                                        </tr>
                                      ))
                                    ) : (
                                      <tr>
                                        <td className="py-3 text-slate-500" colSpan={5}>Brak danych o segmentach.</td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                              <p className="mt-2 text-xs text-slate-500">{segmentApiNote}</p>
                            </div>
                          </div>

                          <div className="grid gap-3 lg:grid-cols-3">
                            {renderSegmentTile("Ryzyko", segmentRisks, smallSample ?? false)}
                            {renderSegmentTile("Luki", segmentGaps, smallSample ?? false)}
                            {renderSegmentTile("Do wprowadzenia", finalImprovements, smallSample ?? false)}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </>
              )}
            </div>
          )}

          {report.flows && (
            <div
              id="flow-audit"
              className="mt-6 rounded-[28px] border border-white/50 bg-gradient-to-br from-[#cfd9ff] via-[#e3e9ff] to-[#f7f9ff] p-4 shadow-[0_30px_80px_-45px_rgba(63,74,219,0.45)] sm:p-5"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-slate-900">Audyt Flow</h2>
                <button
                  type="button"
                  onClick={() => setIsFlowAuditExpanded((prev) => !prev)}
                  className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-white"
                >
                  {isFlowAuditExpanded ? "Zwiń" : "Rozwiń"}
                </button>
              </div>
              <p className="text-sm text-slate-600">Źródło: Klaviyo `/flows` (API key).</p>

              {isFlowAuditExpanded && (() => {
                const flows = report.flows ?? [];
                const activeFlows = flows.filter((flow) => (flow.status ?? "").toLowerCase() === "live");
                const flowsAccess = report.base.flowsAccess;
                const flowsStatusCode = report.base.flowsStatusCode ?? null;
                const flowsUnavailable = flowsAccess !== "ok";
                const noFlows = flows.length === 0;
                const flowApiNote =
                  flowsAccess !== "ok"
                    ? flowsStatusCode === 401 || flowsStatusCode === 403
                      ? "Brak dostępu do API flow (401/403)."
                      : flowsStatusCode === 429 || (flowsStatusCode && flowsStatusCode >= 500)
                        ? "Limit/timeout API flow (429/5xx)."
                        : "Brak dostępu do API flow."
                    : null;
                const flowNames = flows.map((flow) => (flow.name ?? "").toLowerCase());
                const hasFlowNamed = (pattern: RegExp) => flowNames.some((name) => pattern.test(name));
                const hasWelcome = hasFlowNamed(/welcome|powitalny|powitalna|onboarding/i);
                const hasAbandonedCart = hasFlowNamed(/abandoned\s*cart|porzucony\s*koszyk|cart\s*abandon/i);
                const hasPostPurchase = hasFlowNamed(/post\s*purchase|po\s*zakupie|after\s*purchase|purchase\s*follow/i);
                const hasWinback = hasFlowNamed(/winback|reactivation|reaktywacj|win\s*back/i);
                const riskCounts = new Map<string, number>();
                const gapCounts = new Map<string, number>();
                const actionPool = new Map<string, number>();
                const inc = (map: Map<string, number>, key: string) =>
                  map.set(key, (map.get(key) ?? 0) + 1);
                const pushAction = (label: string, priority: number) => {
                  if (!actionPool.has(label) || (actionPool.get(label) ?? 99) > priority) {
                    actionPool.set(label, priority);
                  }
                };
                const renderFlowTile = (title: string, items: string[]) => (
                  <div className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{title}</p>
                    <div className="mt-3 grid gap-1 text-xs text-slate-700">
                      {items.length > 0 ? (
                        items.map((item, idx) => <p key={`${title}-${idx}`}>{item}</p>)
                      ) : (
                        <p className="text-slate-500">Brak sygnałów.</p>
                      )}
                    </div>
                  </div>
                );

                if (!hasWelcome) {
                  inc(gapCounts, "missing_welcome");
                  pushAction("Wdrożyć Welcome flow jako podstawowy onboarding i pierwszą wartość.", 1);
                }
                if (!hasAbandonedCart) {
                  inc(gapCounts, "missing_cart");
                  pushAction("Wdrożyć Abandoned Cart flow, aby odzyskiwać porzucone koszyki.", 1);
                }
                if (!hasPostPurchase) {
                  inc(gapCounts, "missing_post_purchase");
                  pushAction("Wdrożyć Post Purchase flow dla retencji i cross-sell.", 2);
                }
                if (!hasWinback) {
                  inc(gapCounts, "missing_winback");
                  pushAction("Wdrożyć Winback flow, aby odzyskiwać utraconych klientów.", 2);
                }

                const flowMetricsUnavailable = report.flowAudit?.metrics?.status !== "ok";
                const flowMetricRows = Array.isArray(report.flowAudit?.metrics?.perFlow)
                  ? (report.flowAudit?.metrics?.perFlow as Array<Record<string, unknown>>)
                  : [];
                const startedValues = flowMetricRows
                  .map((row) =>
                    readNumber(
                      row.started30,
                      row.started_30d,
                      row.started30d,
                      row.started,
                      row.starts30d,
                    ),
                  )
                  .filter((value) => typeof value === "number") as number[];
                const revenueValues = flowMetricRows
                  .map((row) =>
                    readNumber(
                      row.revenue30,
                      row.revenue_30d,
                      row.revenue30d,
                      row.revenue,
                      row.revenue_30,
                    ),
                  )
                  .filter((value) => typeof value === "number") as number[];
                const allStartedZero = startedValues.length > 0 && startedValues.every((value) => value === 0);
                const allRevenueZero = revenueValues.length > 0 && revenueValues.every((value) => value === 0);
                const totalProfiles = report.base.totalProfiles ?? 0;
                const largeBase = totalProfiles >= 500;
                const evaluateManual = (manual: typeof flowManualInputs[string] | undefined) => {
                  if (!manual) {
                    return { summary: "Brak istotnych uwag manualnych." };
                  }

                  const localActions: string[] = [];

                  if (manual.offerConsistent === "no") {
                    inc(riskCounts, "offer_inconsistent");
                    pushAction("Ujednolicić ofertę i komunikację w każdym mailu flow.", 2);
                    localActions.push("Ujednolicić ofertę w całym flow.");
                  }
                  if (manual.goal === "none") {
                    inc(gapCounts, "goal_missing");
                    pushAction("Przypisać cel (sprzedaż/edukacja/retencja/reaktywacja) i dopasować KPI.", 3);
                    localActions.push("Przypisać cel flow i KPI.");
                  }
                  if (manual.duplicates === "yes") {
                    inc(gapCounts, "duplicates");
                    pushAction("Scalić/wyłączyć duplikaty i uporządkować naming.", 3);
                    localActions.push("Scalić lub wyłączyć duplikaty.");
                  }
                  if (manual.competes === "yes") {
                    inc(riskCounts, "competes");
                    pushAction("Dodać wykluczenia kampanii dla osób w aktywnych flow lub reguły priorytetu.", 2);
                    localActions.push("Wprowadzić priorytety i wykluczenia.");
                  }
                  if (manual.timing === "no") {
                    inc(gapCounts, "timing_bad");
                    pushAction("Przestawić delay i okna (krótsze w cart, dłuższe w edukacji).", 3);
                    localActions.push("Dopasować timing do cyklu zakupowego.");
                  }
                  if (manual.dynamicData === "no") {
                    inc(gapCounts, "dynamic_missing");
                    pushAction("Dodać dynamiczne bloki (ostatnio oglądane / rekomendacje / bestsellery).", 4);
                    localActions.push("Dodać dynamiczne bloki produktów.");
                  }
                  if (manual.smartSegments === "no") {
                    inc(gapCounts, "segments_missing");
                    pushAction("Dodać filtry wejścia/wyjścia, wykluczenia recent buyers, warunki segmentowe.", 3);
                    localActions.push("Dodać filtry i wykluczenia segmentowe.");
                  }
                  if (manual.outdatedContent === "yes") {
                    inc(gapCounts, "outdated_content");
                    pushAction("Aktualizacja copy i ofert, usunięcie datowanych elementów.", 4);
                    localActions.push("Zaktualizować treści i oferty.");
                  }
                  if (manual.footerCompliance === "no") {
                    inc(riskCounts, "footer_missing");
                    pushAction("Ujednolicić stopki i alt tagi w szablonach flow; dodać brakujące linki wypisu.", 2);
                    localActions.push("Poprawić stopkę (alt tagi, unsubscribe).");
                  }

                  const hasAny =
                    manual.offerConsistent ||
                    manual.goal ||
                    manual.duplicates ||
                    manual.competes ||
                    manual.timing ||
                    manual.dynamicData ||
                    manual.smartSegments ||
                    manual.abTests ||
                    manual.outdatedContent ||
                    manual.footerCompliance;
                  if (!hasAny) {
                    return { summary: "Brak istotnych uwag manualnych." };
                  }
                  const summaryParts: string[] = [];
                  if (manual.offerConsistent === "no" || manual.competes === "yes" || manual.footerCompliance === "no") {
                    summaryParts.push("Wykryto ryzyka reputacyjne lub komunikacyjne.");
                  }
                  if (
                    manual.goal === "none" ||
                    manual.duplicates === "yes" ||
                    manual.timing === "no" ||
                    manual.dynamicData === "no" ||
                    manual.smartSegments === "no" ||
                    manual.outdatedContent === "yes"
                  ) {
                    summaryParts.push("Wykryto luki w architekturze lub spójności.");
                  }
                  const summaryBase = summaryParts.join(" ") || "Brak istotnych uwag manualnych.";
                  const summary =
                    localActions.length > 0
                      ? `${summaryBase} Priorytet: ${localActions.slice(0, 2).join(" + ")}.`
                      : summaryBase;
                  return { summary };
                };

                if (!flowMetricsUnavailable) {
                  // placeholder for future metrics-based rules
                }

                const totalFlows = flows.length || 0;
                const buildCountLine = (label: string, count: number) =>
                  totalFlows > 0 ? `${label} (${count}/${totalFlows} flow)` : label;
                const flowRiskLines: string[] = [];
                if (noFlows || flowsUnavailable) {
                  flowRiskLines.push(
                    "Brak aktywnej warstwy flow → brak komunikacji automatycznej i brak skalowalnej retencji.",
                  );
                  if (largeBase) {
                    flowRiskLines.push("Duża baza bez flow → wysokie ryzyko niewykorzystanego potencjału przychodu.");
                  }
                }
                if (allStartedZero) {
                  flowRiskLines.push(
                    buildCountLine(
                      "Flow live bez startów → trigger nie działa lub brak eventów.",
                      totalFlows,
                    ),
                  );
                }
                if (flowMetricsUnavailable && totalFlows > 0 && !flowsUnavailable) {
                  flowRiskLines.push(
                    "Brak metryk flow → brak możliwości oceny skuteczności i reputacji automatyzacji.",
                  );
                }
                if (allRevenueZero && !flowMetricsUnavailable) {
                  flowRiskLines.push(
                    "Automatyzacja nie generuje wartości biznesowej (brak revenue).",
                  );
                }
                if (riskCounts.get("footer_missing")) {
                  flowRiskLines.push(
                    buildCountLine(
                      "Braki techniczne w stopce/alt tagach → ryzyko reputacyjne i zgodności.",
                      riskCounts.get("footer_missing") ?? 0,
                    ),
                  );
                }
                if (riskCounts.get("competes")) {
                  flowRiskLines.push(
                    buildCountLine(
                      "Konflikt kampanii z automatyzacją → presja wysyłkowa i spadek wyników.",
                      riskCounts.get("competes") ?? 0,
                    ),
                  );
                }
                if (riskCounts.get("offer_inconsistent")) {
                  flowRiskLines.push(
                    buildCountLine(
                      "Niespójna realizacja obietnicy → spadek zaufania i konwersji.",
                      riskCounts.get("offer_inconsistent") ?? 0,
                    ),
                  );
                }

                const flowGapLines: string[] = [];
                if (noFlows || flowsUnavailable) {
                  flowGapLines.push(
                    "Brak podstawowych flow (Welcome, Abandoned Cart, Post Purchase, Winback).",
                  );
                }
                if (totalFlows === 1 && hasWelcome) {
                  flowGapLines.push(
                    "Istnieje tylko Welcome → brak Cart / Post Purchase / Winback.",
                  );
                }
                if (allStartedZero) {
                  flowGapLines.push(
                    "Brak aktywacji flow mimo konfiguracji → wymaga weryfikacji triggerów i integracji.",
                  );
                }
                if (flowMetricsUnavailable && totalFlows > 0 && !flowsUnavailable) {
                  flowGapLines.push(
                    "Brak danych operacyjnych → analiza skuteczności ograniczona.",
                  );
                }
                if (gapCounts.get("missing_welcome")) {
                  flowGapLines.push(
                    buildCountLine(
                      "Brak Welcome flow → luka krytyczna sprzedażowa.",
                      gapCounts.get("missing_welcome") ?? 0,
                    ),
                  );
                }
                if (gapCounts.get("missing_cart")) {
                  flowGapLines.push(
                    buildCountLine(
                      "Brak Abandoned Cart → luka krytyczna sprzedażowa.",
                      gapCounts.get("missing_cart") ?? 0,
                    ),
                  );
                }
                if (gapCounts.get("missing_post_purchase")) {
                  flowGapLines.push(
                    buildCountLine(
                      "Brak Post Purchase → luka w retencji i cross-sell.",
                      gapCounts.get("missing_post_purchase") ?? 0,
                    ),
                  );
                }
                if (gapCounts.get("missing_winback")) {
                  flowGapLines.push(
                    buildCountLine(
                      "Brak Winback → brak odzysku utraconych klientów.",
                      gapCounts.get("missing_winback") ?? 0,
                    ),
                  );
                }
                if (gapCounts.get("duplicates")) {
                  flowGapLines.push(
                    buildCountLine(
                      "Zduplikowane flow → chaos architektury i dublowanie komunikacji.",
                      gapCounts.get("duplicates") ?? 0,
                    ),
                  );
                }
                if (gapCounts.get("goal_missing")) {
                  flowGapLines.push(
                    buildCountLine(
                      "Flow bez zdefiniowanego celu → brak mierzalności i logiki.",
                      gapCounts.get("goal_missing") ?? 0,
                    ),
                  );
                }
                if (gapCounts.get("timing_bad")) {
                  flowGapLines.push(
                    buildCountLine(
                      "Nieadekwatny timing → utrata momentu zakupowego.",
                      gapCounts.get("timing_bad") ?? 0,
                    ),
                  );
                }
                if (gapCounts.get("dynamic_missing")) {
                  flowGapLines.push(
                    buildCountLine(
                      "Brak personalizacji produktowej → niewykorzystany potencjał.",
                      gapCounts.get("dynamic_missing") ?? 0,
                    ),
                  );
                }
                if (gapCounts.get("segments_missing")) {
                  flowGapLines.push(
                    buildCountLine(
                      "Brak warstwowania/wykluczeń w flow.",
                      gapCounts.get("segments_missing") ?? 0,
                    ),
                  );
                }
                if (gapCounts.get("outdated_content")) {
                  flowGapLines.push(
                    buildCountLine(
                      "Przestarzałe treści/promocje → ryzyko błędnej oferty.",
                      gapCounts.get("outdated_content") ?? 0,
                    ),
                  );
                }

                const flowActionLines =
                  flowGapLines.length > 0 || flowRiskLines.length > 0
                    ? Array.from(actionPool.entries())
                        .sort((a, b) => a[1] - b[1])
                        .slice(0, 5)
                        .map(([label]) => label)
                    : ["System automatyzacji operacyjnie poprawny – rekomendacja: optymalizacja testowa."];
                if (noFlows || flowsUnavailable) {
                  flowActionLines.unshift(
                    "Zaprojektować i uruchomić minimum 4 kluczowe flow sprzedażowe (Welcome, Cart, Post Purchase, Winback).",
                  );
                  if (!largeBase) {
                    flowActionLines.unshift("Priorytet: wdrożyć Welcome jako fundament automatyzacji.");
                  }
                }
                if (totalFlows > 0 && allStartedZero) {
                  flowActionLines.unshift(
                    "Zweryfikować trigger event, integrację sklepu oraz status live flow.",
                  );
                }
                if (flowMetricsUnavailable && totalFlows > 0 && !flowsUnavailable) {
                  flowActionLines.unshift(
                    "Uruchomić minimalne flow i pierwsze kampanie testowe w celu zebrania danych.",
                  );
                }
                if (allRevenueZero && !flowMetricsUnavailable) {
                  flowActionLines.unshift(
                    "Przeprojektować strukturę, ofertę i timing flow, aby generować revenue.",
                  );
                }
                const uniqueFlowActions = Array.from(new Set(flowActionLines)).slice(0, 5);

                return (
                  <div className="mt-4 grid gap-4">
                    <div className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Snapshot systemu flow</p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="rounded-xl border border-white/70 bg-white/70 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Aktywne flow</p>
                          <p className="mt-2 text-3xl font-semibold text-slate-900">{activeFlows.length}</p>
                        </div>
                        <div className="rounded-xl border border-white/70 bg-white/70 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">% bez startów (30 dni)</p>
                          <p className="mt-2 text-2xl font-semibold text-slate-400">Brak danych</p>
                        </div>
                        <div className="rounded-xl border border-white/70 bg-white/70 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">% bez konwersji</p>
                          <p className="mt-2 text-2xl font-semibold text-slate-400">Brak danych</p>
                        </div>
                        <div className="rounded-xl border border-white/70 bg-white/70 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Średni revenue / flow</p>
                          <p className="mt-2 text-2xl font-semibold text-slate-400">Brak danych</p>
                        </div>
                        <div className="rounded-xl border border-white/70 bg-white/70 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">% flow z unsub &gt; X%</p>
                          <p className="mt-2 text-2xl font-semibold text-slate-400">Brak danych</p>
                        </div>
                        <div className="rounded-xl border border-white/70 bg-white/70 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">% flow z bounce &gt; X%</p>
                          <p className="mt-2 text-2xl font-semibold text-slate-400">Brak danych</p>
                        </div>
                      </div>
                      {flowApiNote && <p className="mt-3 text-xs text-slate-500">{flowApiNote}</p>}
                    </div>

                    <div className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Tabela główna flow</p>
                      <div className="mt-3 overflow-auto">
                        <table className="min-w-[760px] w-full text-left text-xs text-slate-700">
                          <thead>
                            <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500">
                              <th className="pb-2 pr-3">Flow</th>
                              <th className="pb-2 pr-3">Istnieje</th>
                              <th className="pb-2 pr-3">Status</th>
                              <th className="pb-2 pr-3">Trigger</th>
                              <th className="pb-2 pr-3">Started 30d</th>
                              <th className="pb-2 pr-3">Conversion %</th>
                              <th className="pb-2 pr-3">Revenue</th>
                            </tr>
                          </thead>
                          <tbody>
                            {flows.length > 0 ? (
                              flows.map((flow) => (
                                <tr key={flow.id} className="border-b border-slate-100">
                                  <td className="py-2 pr-3">{flow.name}</td>
                                  <td className="py-2 pr-3">Tak</td>
                                  <td className="py-2 pr-3">{flow.status ?? "—"}</td>
                                  <td className="py-2 pr-3 text-slate-500">Brak danych</td>
                                  <td className="py-2 pr-3 text-slate-500">Brak danych</td>
                                  <td className="py-2 pr-3 text-slate-500">Brak danych</td>
                                  <td className="py-2 pr-3 text-slate-500">Brak danych</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td className="py-3 text-slate-500" colSpan={7}>Brak flow w koncie.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      {flowApiNote && <p className="mt-2 text-xs text-slate-500">{flowApiNote}</p>}
                    </div>

                    <div className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Checklista Flow</p>
                      <div className="mt-3 overflow-auto">
                        <table className="min-w-[820px] w-full text-left text-xs text-slate-700">
                          <thead>
                            <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500">
                              <th className="pb-2 pr-3">Flow</th>
                              <th className="pb-2 pr-3">Istnieje</th>
                              <th className="pb-2 pr-3">Live</th>
                              <th className="pb-2 pr-3">Trigger poprawny</th>
                              <th className="pb-2 pr-3">Filtry</th>
                              <th className="pb-2 pr-3">Liczba maili</th>
                              <th className="pb-2 pr-3">Exit condition</th>
                              <th className="pb-2 pr-3">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {["Welcome", "Abandoned Cart", "Post Purchase", "Winback"].map((flow) => (
                              <tr key={flow} className="border-b border-slate-100">
                                <td className="py-2 pr-3">{flow}</td>
                                <td className="py-2 pr-3 text-slate-500">Brak danych</td>
                                <td className="py-2 pr-3 text-slate-500">Brak danych</td>
                                <td className="py-2 pr-3 text-slate-500">Brak danych</td>
                                <td className="py-2 pr-3 text-slate-500">Brak danych</td>
                                <td className="py-2 pr-3 text-slate-500">Brak danych</td>
                                <td className="py-2 pr-3 text-slate-500">Brak danych</td>
                                <td className="py-2 pr-3 text-slate-500">Brak danych</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">{flowApiNote}</p>
                    </div>

                    <div className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Architektura flow (logika)</p>
                      <div className="mt-3 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
                        <div className="rounded-xl border border-white/70 bg-white/60 p-4 text-xs text-slate-600">
                          <div className="flex flex-col items-center gap-2 text-center">
                            <span>Trigger</span>
                            <span className="text-slate-400">↓</span>
                            <span>Delay</span>
                            <span className="text-slate-400">↓</span>
                            <span>Email 1</span>
                            <span className="text-slate-400">↓</span>
                            <span>Split (warunek)</span>
                            <span className="text-slate-400">↓</span>
                            <span>Email 2A / Email 2B</span>
                          </div>
                        </div>
                        <div className="rounded-xl border border-white/70 bg-white/60 p-4 text-xs text-slate-700">
                          <div className="grid gap-2">
                            <div className="flex items-center justify-between"><span>Liczba stepów</span><span className="text-slate-500">Brak danych</span></div>
                            <div className="flex items-center justify-between"><span>Liczba splitów</span><span className="text-slate-500">Brak danych</span></div>
                            <div className="flex items-center justify-between"><span>Najdłuższy delay</span><span className="text-slate-500">Brak danych</span></div>
                            <div className="flex items-center justify-between"><span>Exit condition</span><span className="text-slate-500">Brak danych</span></div>
                          </div>
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">{flowApiNote}</p>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Performance flow – Revenue per flow</p>
                        <div className="mt-3 h-24 rounded-xl border border-white/70 bg-white/60" />
                        <p className="mt-2 text-xs text-slate-500">{flowApiNote}</p>
                      </div>
                      <div className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Performance flow – Drop-off</p>
                        <div className="mt-3 h-24 rounded-xl border border-white/70 bg-white/60" />
                        <p className="mt-2 text-xs text-slate-500">{flowApiNote}</p>
                      </div>
                    </div>

                    <div className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Ryzyko reputacyjne</p>
                      <div className="mt-3 overflow-auto">
                        <table className="min-w-[620px] w-full text-left text-xs text-slate-700">
                          <thead>
                            <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500">
                              <th className="pb-2 pr-3">Flow</th>
                              <th className="pb-2 pr-3">Unsub %</th>
                              <th className="pb-2 pr-3">Spam %</th>
                              <th className="pb-2 pr-3">Bounce %</th>
                              <th className="pb-2 pr-3">Risk</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="py-2 pr-3 text-slate-500" colSpan={5}>Brak danych.</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">{flowApiNote}</p>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Trigger & Activation Health</p>
                        <div className="mt-3 h-24 rounded-xl border border-white/70 bg-white/60" />
                        <p className="mt-2 text-xs text-slate-500">{flowApiNote}</p>
                      </div>
                      <div className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Martwe flow</p>
                        <div className="mt-3 space-y-2 text-xs text-slate-500">
                          <div>Flow live, ale 0 started 30 dni</div>
                          <div>Flow draft</div>
                          <div>Flow bez wiadomości live</div>
                        </div>
                        <p className="mt-2 text-xs text-slate-500">{flowApiNote}</p>
                      </div>
                    </div>

                    <div className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Analiza szczegółowa flow</p>
                      <div className="mt-3 grid gap-3">
                        {flows.length > 0 ? (
                          flows.map((flow) => {
                            const manual = flowManualInputs[flow.id];
                            const statusLabel = flow.status ?? "—";
                            const triggerLabel = "Brak danych";
                            const startedLabel = "Brak danych";
                            const revenueLabel = "Brak danych";
                            const identityFindings: string[] = [];
                            const architectureFindings: string[] = [];
                            const performanceFindings: string[] = [];
                            const reputationFindings: string[] = [];
                            const systemFindings: string[] = [];

                            const maturityParts: string[] = [];
                            if (manual?.dynamicData === "yes") maturityParts.push("dynamic");
                            if (manual?.smartSegments === "yes") maturityParts.push("filtry");
                            if (manual?.abTests === "yes") maturityParts.push("A/B");
                            const maturityLabel =
                              maturityParts.length > 0 ? `Częściowe dane: ${maturityParts.join(", ")}` : "Brak danych";

                            return (
                              <div key={`flow-analysis-${flow.id}`} className="rounded-xl border border-white/70 bg-white/70 p-3 text-xs text-slate-700">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="font-semibold text-slate-800">{flow.name}</p>
                                  <span className="text-[11px] text-slate-500">{statusLabel}</span>
                                </div>
                                <div className="mt-3 grid gap-3 lg:grid-cols-5">
                                  <div className="rounded-lg border border-white/70 bg-white/70 p-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Tożsamość</p>
                                    <div className="mt-2 grid gap-1">
                                      <div>Nazwa: <span className="text-slate-500">{flow.name}</span></div>
                                      <div>Status: <span className="text-slate-500">{statusLabel}</span></div>
                                      <div>Trigger: <span className="text-slate-500">{triggerLabel}</span></div>
                                      <div>Started 30d: <span className="text-slate-500">{startedLabel}</span></div>
                                      <div>Revenue 30d: <span className="text-slate-500">{revenueLabel}</span></div>
                                    </div>
                                    {identityFindings.length > 0 ? (
                                      <div className="mt-2 text-[11px] text-slate-600">
                                        {identityFindings.map((item, idx) => <p key={`id-${idx}`}>{item}</p>)}
                                      </div>
                                    ) : null}
                                  </div>
                                  <div className="rounded-lg border border-white/70 bg-white/70 p-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Architektura</p>
                                    <div className="mt-2 grid gap-1 text-slate-500">
                                      <div>Stepów: Brak danych</div>
                                      <div>Maili: Brak danych</div>
                                      <div>Splitów: Brak danych</div>
                                      <div>Najdłuższy delay: Brak danych</div>
                                      <div>Exit condition: Brak danych</div>
                                      <div>Filtry wejścia: Brak danych</div>
                                      <div>A/B test: {manual?.abTests ? manual.abTests.toUpperCase() : "Brak danych"}</div>
                                    </div>
                                    {architectureFindings.length > 0 ? (
                                      <div className="mt-2 text-[11px] text-slate-600">
                                        {architectureFindings.map((item, idx) => <p key={`arch-${idx}`}>{item}</p>)}
                                      </div>
                                    ) : null}
                                  </div>
                                  <div className="rounded-lg border border-white/70 bg-white/70 p-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Performance</p>
                                    <div className="mt-2 grid gap-1 text-slate-500">
                                      <div>Started → Delivered → Clicked → Converted: Brak danych</div>
                                      <div>Conversion %: Brak danych</div>
                                      <div>Revenue / recipient: Brak danych</div>
                                    </div>
                                    {performanceFindings.length > 0 ? (
                                      <div className="mt-2 text-[11px] text-slate-600">
                                        {performanceFindings.map((item, idx) => <p key={`perf-${idx}`}>{item}</p>)}
                                      </div>
                                    ) : null}
                                  </div>
                                  <div className="rounded-lg border border-white/70 bg-white/70 p-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Reputacja</p>
                                    <div className="mt-2 grid gap-1 text-slate-500">
                                      <div>Unsub %: Brak danych</div>
                                      <div>Spam %: Brak danych</div>
                                      <div>Bounce %: Brak danych</div>
                                    </div>
                                    {reputationFindings.length > 0 ? (
                                      <div className="mt-2 text-[11px] text-slate-600">
                                        {reputationFindings.map((item, idx) => <p key={`rep-${idx}`}>{item}</p>)}
                                      </div>
                                    ) : null}
                                  </div>
                                  <div className="rounded-lg border border-white/70 bg-white/70 p-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Wpływ systemowy</p>
                                    <div className="mt-2 grid gap-1 text-slate-500">
                                      <div>% revenue w automatyzacji: Brak danych</div>
                                      <div>% revenue w całym email: Brak danych</div>
                                      <div>Relacja flow vs kampanie: Brak danych</div>
                                      <div className="pt-1 text-[11px] text-slate-500">Dojrzałość: {maturityLabel}</div>
                                    </div>
                                    {systemFindings.length > 0 ? (
                                      <div className="mt-2 text-[11px] text-slate-600">
                                        {systemFindings.map((item, idx) => <p key={`sys-${idx}`}>{item}</p>)}
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-xs text-slate-500">Brak flow w koncie.</p>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-slate-500">{flowApiNote}</p>
                    </div>

                    <div className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Uzupełniające notatki</p>
                      {flowMetricsUnavailable ? (
                        <p className="mt-2 text-xs text-slate-500">Ocena manualna – brak danych historycznych, analiza performance ograniczona. ({flowApiNote})</p>
                      ) : null}
                      <div className="mt-3 grid gap-3">
                        {flows.map((flow) => {
                          const manual = flowManualInputs[flow.id];
                          const evaluation = evaluateManual(manual);
                          return (
                            <div key={`manual-${flow.id}`} className="rounded-xl border border-white/70 bg-white/70 p-3 text-xs text-slate-700">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="font-semibold text-slate-800">{flow.name}</p>
                                <span className="text-[11px] text-slate-500">{flow.status ?? "—"}</span>
                              </div>
                              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                <div>
                                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Spójność oferty/rabatu</label>
                                  <select
                                    value={manual?.offerConsistent ?? ""}
                                    onChange={(event) =>
                                      setFlowManualInputs((prev) => ({
                                        ...prev,
                                        [flow.id]: {
                                          ...prev[flow.id],
                                          offerConsistent: event.target.value,
                                        },
                                      }))
                                    }
                                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-xs text-slate-700"
                                  >
                                    <option value="">N/D</option>
                                    <option value="yes">TAK</option>
                                    <option value="no">NIE</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Cel flow</label>
                                  <select
                                    value={manual?.goal ?? ""}
                                    onChange={(event) =>
                                      setFlowManualInputs((prev) => ({
                                        ...prev,
                                        [flow.id]: {
                                          ...prev[flow.id],
                                          goal: event.target.value,
                                        },
                                      }))
                                    }
                                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-xs text-slate-700"
                                  >
                                    <option value="">N/D</option>
                                    <option value="none">Brak</option>
                                    <option value="sales">Sprzedaż</option>
                                    <option value="education">Edukacja</option>
                                    <option value="retention">Retencja</option>
                                    <option value="reactivation">Reaktywacja</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Dubluje inne flow</label>
                                  <select
                                    value={manual?.duplicates ?? ""}
                                    onChange={(event) =>
                                      setFlowManualInputs((prev) => ({
                                        ...prev,
                                        [flow.id]: {
                                          ...prev[flow.id],
                                          duplicates: event.target.value,
                                        },
                                      }))
                                    }
                                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-xs text-slate-700"
                                  >
                                    <option value="">N/D</option>
                                    <option value="yes">TAK</option>
                                    <option value="no">NIE</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Konkuruje z kampaniami</label>
                                  <select
                                    value={manual?.competes ?? ""}
                                    onChange={(event) =>
                                      setFlowManualInputs((prev) => ({
                                        ...prev,
                                        [flow.id]: {
                                          ...prev[flow.id],
                                          competes: event.target.value,
                                        },
                                      }))
                                    }
                                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-xs text-slate-700"
                                  >
                                    <option value="">N/D</option>
                                    <option value="yes">TAK</option>
                                    <option value="no">NIE</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Timing względem cyklu</label>
                                  <select
                                    value={manual?.timing ?? ""}
                                    onChange={(event) =>
                                      setFlowManualInputs((prev) => ({
                                        ...prev,
                                        [flow.id]: {
                                          ...prev[flow.id],
                                          timing: event.target.value,
                                        },
                                      }))
                                    }
                                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-xs text-slate-700"
                                  >
                                    <option value="">N/D</option>
                                    <option value="ok">OK</option>
                                    <option value="no">NIE</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Dynamiczne dane</label>
                                  <select
                                    value={manual?.dynamicData ?? ""}
                                    onChange={(event) =>
                                      setFlowManualInputs((prev) => ({
                                        ...prev,
                                        [flow.id]: {
                                          ...prev[flow.id],
                                          dynamicData: event.target.value,
                                        },
                                      }))
                                    }
                                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-xs text-slate-700"
                                  >
                                    <option value="">N/D</option>
                                    <option value="yes">TAK</option>
                                    <option value="no">NIE</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Segmenty inteligentne</label>
                                  <select
                                    value={manual?.smartSegments ?? ""}
                                    onChange={(event) =>
                                      setFlowManualInputs((prev) => ({
                                        ...prev,
                                        [flow.id]: {
                                          ...prev[flow.id],
                                          smartSegments: event.target.value,
                                        },
                                      }))
                                    }
                                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-xs text-slate-700"
                                  >
                                    <option value="">N/D</option>
                                    <option value="yes">TAK</option>
                                    <option value="no">NIE</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">A/B testy</label>
                                  <select
                                    value={manual?.abTests ?? ""}
                                    onChange={(event) =>
                                      setFlowManualInputs((prev) => ({
                                        ...prev,
                                        [flow.id]: {
                                          ...prev[flow.id],
                                          abTests: event.target.value,
                                        },
                                      }))
                                    }
                                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-xs text-slate-700"
                                  >
                                    <option value="">N/D</option>
                                    <option value="yes">TAK</option>
                                    <option value="no">NIE</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Przestarzałe treści</label>
                                  <select
                                    value={manual?.outdatedContent ?? ""}
                                    onChange={(event) =>
                                      setFlowManualInputs((prev) => ({
                                        ...prev,
                                        [flow.id]: {
                                          ...prev[flow.id],
                                          outdatedContent: event.target.value,
                                        },
                                      }))
                                    }
                                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-xs text-slate-700"
                                  >
                                    <option value="">N/D</option>
                                    <option value="yes">TAK</option>
                                    <option value="no">NIE</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Alt tagi + unsubscribe</label>
                                  <select
                                    value={manual?.footerCompliance ?? ""}
                                    onChange={(event) =>
                                      setFlowManualInputs((prev) => ({
                                        ...prev,
                                        [flow.id]: {
                                          ...prev[flow.id],
                                          footerCompliance: event.target.value,
                                        },
                                      }))
                                    }
                                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-xs text-slate-700"
                                  >
                                    <option value="">N/D</option>
                                    <option value="ok">OK</option>
                                    <option value="no">NIE</option>
                                  </select>
                                </div>
                              </div>
                              <div className="mt-3">
                                <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Notatka</label>
                                <textarea
                                  value={manual?.note ?? ""}
                                  onChange={(event) =>
                                    setFlowManualInputs((prev) => ({
                                      ...prev,
                                      [flow.id]: {
                                        ...prev[flow.id],
                                        note: event.target.value,
                                      },
                                    }))
                                  }
                                  rows={2}
                                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-xs text-slate-700"
                                />
                              </div>
                              <div className="mt-3 flex items-center justify-between">
                                <p className="text-[11px] text-slate-500">{evaluation.summary}</p>
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] text-slate-500">
                                    {flowManualStatus[flow.id] === "saving"
                                      ? "Zapisywanie..."
                                      : flowManualStatus[flow.id] === "saved"
                                        ? "Zapisano"
                                        : flowManualStatus[flow.id] === "error"
                                          ? "Błąd zapisu"
                                          : " "}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => saveFlowManual(flow.id, {
                                      offerConsistent: manual?.offerConsistent ?? "",
                                      goal: manual?.goal ?? "",
                                      duplicates: manual?.duplicates ?? "",
                                      competes: manual?.competes ?? "",
                                      timing: manual?.timing ?? "",
                                      dynamicData: manual?.dynamicData ?? "",
                                      smartSegments: manual?.smartSegments ?? "",
                                      abTests: manual?.abTests ?? "",
                                      outdatedContent: manual?.outdatedContent ?? "",
                                      footerCompliance: manual?.footerCompliance ?? "",
                                      note: manual?.note ?? "",
                                    })}
                                    className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                  >
                                    Zapisz
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid gap-3 lg:grid-cols-3">
                      {renderFlowTile("Ryzyko", flowRiskLines)}
                      {renderFlowTile("Luki", flowGapLines)}
                      {renderFlowTile("Do wprowadzenia", uniqueFlowActions)}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {report.campaigns && (
            <div
              id="campaign-audit"
              className="mt-6 rounded-[28px] border border-white/50 bg-gradient-to-br from-[#cfd9ff] via-[#e3e9ff] to-[#f7f9ff] p-4 shadow-[0_30px_80px_-45px_rgba(63,74,219,0.45)] sm:p-5"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-slate-900">Audyt Kampanii</h2>
                <button
                  type="button"
                  onClick={() => setIsCampaignAuditExpanded((prev) => !prev)}
                  className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-white"
                >
                  {isCampaignAuditExpanded ? "Zwiń" : "Rozwiń"}
                </button>
              </div>
              <p className="text-sm text-slate-600">Źródło: Klaviyo `/campaigns` (API key).</p>

              {isCampaignAuditExpanded && (() => {
                const campaigns = report.campaigns ?? [];
                const campaignsAccess = report.base.campaignsAccess;
                const campaignsStatusCode = report.base.campaignsStatusCode ?? null;
                const campaignApiNote =
                  campaignsAccess !== "ok"
                    ? campaignsStatusCode === 401 || campaignsStatusCode === 403
                      ? "Brak dostępu do API kampanii (401/403)."
                      : campaignsStatusCode === 429 || (campaignsStatusCode && campaignsStatusCode >= 500)
                        ? "Limit/timeout API kampanii (429/5xx)."
                        : "Brak dostępu do API kampanii."
                    : campaigns.length === 0
                      ? "Brak kampanii w koncie."
                      : "Brak metryk – konto bez wysyłek / brak historii.";
                const campaignMetricRows = Array.isArray(report.campaignAudit?.metrics?.perCampaign)
                  ? (report.campaignAudit?.metrics?.perCampaign as Array<Record<string, unknown>>)
                  : [];
                const campaignMetricsUnavailable = report.campaignAudit?.metrics?.status !== "ok";
                const campaignMetricById = new Map(
                  campaignMetricRows
                    .map((row) => ({
                      id: readString(row.campaignId, row.campaign_id, row.id),
                      stats:
                        typeof row.statistics === "object" && row.statistics
                          ? (row.statistics as Record<string, unknown>)
                          : null,
                    }))
                    .filter((item) => item.id),
                );
                const revenueValues = Array.from(campaignMetricById.values())
                  .map((stats) =>
                    readNumber(
                      stats?.conversion_value,
                      stats?.conversionValue,
                      stats?.revenue,
                      stats?.revenue_total,
                    ),
                  )
                  .filter((value) => typeof value === "number") as number[];
                const revenuePerRecipientValues = Array.from(campaignMetricById.values())
                  .map((stats) =>
                    readNumber(
                      stats?.revenue_per_recipient,
                      stats?.revenuePerRecipient,
                    ),
                  )
                  .filter((value) => typeof value === "number") as number[];
                const unsubValues = Array.from(campaignMetricById.values())
                  .map((stats) =>
                    readNumber(
                      stats?.unsubscribe_rate,
                      stats?.unsubRate,
                      stats?.unsubscribeRate,
                    ),
                  )
                  .filter((value) => typeof value === "number") as number[];
                const spamValues = Array.from(campaignMetricById.values())
                  .map((stats) =>
                    readNumber(
                      stats?.spam_complaint_rate,
                      stats?.spamRate,
                      stats?.complaintRate,
                    ),
                  )
                  .filter((value) => typeof value === "number") as number[];
                const volumeValues = Array.from(campaignMetricById.values())
                  .map((stats) => readNumber(stats?.delivered, stats?.recipients, stats?.sent))
                  .filter((value) => typeof value === "number") as number[];
                const avgRevenuePerCampaign =
                  revenueValues.length > 0
                    ? revenueValues.reduce((acc, value) => acc + value, 0) / revenueValues.length
                    : null;
                const avgRevenuePerRecipient =
                  revenuePerRecipientValues.length > 0
                    ? revenuePerRecipientValues.reduce((acc, value) => acc + value, 0) / revenuePerRecipientValues.length
                    : null;
                const avgUnsubRate =
                  unsubValues.length > 0 ? unsubValues.reduce((acc, value) => acc + value, 0) / unsubValues.length : null;
                const avgSpamRate =
                  spamValues.length > 0 ? spamValues.reduce((acc, value) => acc + value, 0) / spamValues.length : null;
                const maxVolume = volumeValues.length > 0 ? Math.max(...volumeValues) : null;
                const revenueFromCampaigns =
                  revenueValues.length > 0 ? revenueValues.reduce((acc, value) => acc + value, 0) : null;
                const campaignCount = campaigns.length;
                const totalProfiles = report.base.totalProfiles ?? 0;
                const campaignSampleMode = report.campaignAudit?.metrics?.sampleMode ?? "30d";
                const campaignSampleNote =
                  report.campaignAudit?.metrics?.fallback ? "Metryki 90 dni (orientacyjnie)." : null;
                const getStats = (campaignId: string) => campaignMetricById.get(campaignId) ?? null;
                const formatPercent = (value: number | null) =>
                  value === null || Number.isNaN(value) ? "Brak danych" : `${value.toFixed(2)}%`;
                const formatNumber = (value: number | null) =>
                  value === null || Number.isNaN(value) ? "Brak danych" : value.toFixed(2);

                const campaignRowsWithMetrics = campaigns.map((campaign) => {
                  const stats = getStats(campaign.id);
                  const delivered = readNumber(stats?.delivered, stats?.recipients, stats?.sent);
                  const deliveredRate =
                    delivered && delivered > 0 && readNumber(stats?.recipients, stats?.sent)
                      ? ((delivered / (readNumber(stats?.recipients, stats?.sent) ?? delivered)) * 100)
                      : null;
                  const revenue = readNumber(stats?.conversion_value, stats?.revenue);
                  const revenuePerRecipient = readNumber(stats?.revenue_per_recipient, stats?.revenuePerRecipient);
                  const clickRate = readNumber(stats?.click_rate, stats?.clickRate);
                  const unsubRate = readNumber(stats?.unsubscribe_rate, stats?.unsubRate);
                  const spamRate = readNumber(stats?.spam_complaint_rate, stats?.spamRate);
                  const bounceRate = readNumber(stats?.bounce_rate, stats?.bounceRate);
                  return {
                    campaign,
                    delivered,
                    deliveredRate,
                    revenue,
                    revenuePerRecipient,
                    clickRate,
                    unsubRate,
                    spamRate,
                    bounceRate,
                  };
                });

                const timeWindowDays = campaignSampleMode === "90d" ? 90 : 30;
                const now = new Date();
                const buildSeries = (days: number) => {
                  const points: Array<{ day: string; count: number; volume: number }> = [];
                  for (let i = days - 1; i >= 0; i -= 1) {
                    const date = new Date(now);
                    date.setDate(now.getDate() - i);
                    const key = date.toISOString().slice(0, 10);
                    points.push({ day: key, count: 0, volume: 0 });
                  }
                  const index = new Map(points.map((point, idx) => [point.day, idx]));
                  campaignRowsWithMetrics.forEach(({ campaign, delivered }) => {
                    if (!campaign.sendTime) return;
                    const dayKey = new Date(campaign.sendTime).toISOString().slice(0, 10);
                    const idx = index.get(dayKey);
                    if (idx === undefined) return;
                    points[idx].count += 1;
                    points[idx].volume += delivered ?? 0;
                  });
                  return points;
                };
                const series30 = buildSeries(30);
                const series90 = buildSeries(90);

                const pickSeries = timeWindowDays === 90 ? series90 : series30;
                const maxCount = Math.max(...pickSeries.map((p) => p.count), 1);
                const maxVolumeSeries = Math.max(...pickSeries.map((p) => p.volume), 1);

                const campaignDates = campaigns
                  .map((campaign) => (campaign.sendTime ? new Date(campaign.sendTime) : null))
                  .filter((value): value is Date => Boolean(value))
                  .sort((a, b) => a.getTime() - b.getTime());
                const gaps: number[] = [];
                for (let i = 1; i < campaignDates.length; i += 1) {
                  const diff = (campaignDates[i].getTime() - campaignDates[i - 1].getTime()) / (1000 * 60 * 60 * 24);
                  gaps.push(diff);
                }
                const avgGap = gaps.length > 0 ? gaps.reduce((acc, value) => acc + value, 0) / gaps.length : null;
                const maxGap = gaps.length > 0 ? Math.max(...gaps) : null;
                const maxDensity = pickSeries.reduce((acc, point) => Math.max(acc, point.count), 0);

                const segmentRevenueMap = new Map<
                  string,
                  { revenue: number; clickRates: number[]; campaigns: number }
                >();
                campaignRowsWithMetrics.forEach(({ campaign, revenue, clickRate }) => {
                  const segmentNames = campaign.audience?.includedSegments.map((item) => item.name) ?? [];
                  if (segmentNames.length === 0) return;
                  segmentNames.forEach((name) => {
                    const existing = segmentRevenueMap.get(name) ?? { revenue: 0, clickRates: [], campaigns: 0 };
                    segmentRevenueMap.set(name, {
                      revenue: existing.revenue + (revenue ?? 0),
                      clickRates: clickRate !== null ? [...existing.clickRates, clickRate] : existing.clickRates,
                      campaigns: existing.campaigns + 1,
                    });
                  });
                });
                const segmentRevenueRows = Array.from(segmentRevenueMap.entries())
                  .map(([segment, data]) => {
                    const avgClick =
                      data.clickRates.length > 0
                        ? data.clickRates.reduce((acc, value) => acc + value, 0) / data.clickRates.length
                        : null;
                    const lower = segment.toLowerCase();
                    const engagedPattern = /(engaged|active|recent).*(15|30|45|60|90|180)|last\s*(15|30|45|60|90|180)|\b(15|30|45|60|90)\s*days/;
                    const inactivePattern = /(180\+|180\s*\+|inactive|unengaged|sunset|lapsed)/;
                    const isEngaged = engagedPattern.test(lower);
                    const isInactive = inactivePattern.test(lower);
                    const isMixed = isEngaged && isInactive;
                    const label = isMixed ? "Mixed" : isEngaged ? "Engaged" : isInactive ? "Inactive" : "Unknown";
                    return {
                      segment,
                      campaigns: data.campaigns,
                      avgClick,
                      revenue: data.revenue,
                      label,
                    };
                  })
                  .sort((a, b) => b.revenue - a.revenue);

                const segmentRevenueTotals = segmentRevenueRows.reduce(
                  (acc, row) => {
                    acc.total += row.revenue;
                    if (row.label === "Engaged") acc.engaged += row.revenue;
                    if (row.label === "Inactive") acc.inactive += row.revenue;
                    if (row.label === "Mixed") acc.mixed += row.revenue;
                    if (row.label === "Unknown") acc.unknown += row.revenue;
                    return acc;
                  },
                  { total: 0, engaged: 0, inactive: 0, mixed: 0, unknown: 0 },
                );
                const shareLabel = (value: number) =>
                  segmentRevenueTotals.total > 0
                    ? `${Math.round((value / segmentRevenueTotals.total) * 100)}%`
                    : "Brak danych";

                const heatmapMatrix = Array.from({ length: 7 }, () => Array(24).fill(0));
                campaignRowsWithMetrics.forEach(({ campaign }) => {
                  if (!campaign.sendTime) return;
                  const date = new Date(campaign.sendTime);
                  const day = date.getDay();
                  const hour = date.getHours();
                  heatmapMatrix[day][hour] += 1;
                });
                const maxHeat = Math.max(1, ...heatmapMatrix.flat());
                const dayLabels = ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "Sb"];
                const flatHeat = heatmapMatrix.flat();
                const totalHeat = flatHeat.reduce((acc, value) => acc + value, 0);
                const sortedHeat = [...flatHeat].sort((a, b) => b - a);
                const top1 = sortedHeat[0] ?? 0;
                const top2 = (sortedHeat[0] ?? 0) + (sortedHeat[1] ?? 0);
                const top1Share = totalHeat > 0 ? Math.round((top1 / totalHeat) * 100) : 0;
                const top2Share = totalHeat > 0 ? Math.round((top2 / totalHeat) * 100) : 0;
                let topSlotLabel = "Brak danych";
                if (totalHeat > 0) {
                  let bestDay = 0;
                  let bestHour = 0;
                  let bestValue = 0;
                  heatmapMatrix.forEach((row, dayIdx) => {
                    row.forEach((count, hourIdx) => {
                      if (count > bestValue) {
                        bestValue = count;
                        bestDay = dayIdx;
                        bestHour = hourIdx;
                      }
                    });
                  });
                  topSlotLabel = `${dayLabels[bestDay]} ${bestHour}:00 (${top1Share}%)`;
                }
                const engaged30Pattern = /(engaged|active|recent).*(30|30\s*days)|last\s*30|30\s*days/i;
                const engaged90Pattern = /(engaged|active|recent).*(90|90\s*days)|last\s*90|90\s*days/i;
                const inactivePattern = /(180\+|180\s*\+|inactive|unengaged|sunset|lapsed)/i;
                const seasonalPattern = /(black\s*friday|cyber\s*monday|swieta|christmas|holiday|valentine|walentynki|lato|summer|back\s*to\s*school|easter|nowy\s*rok|spring|autumn|fall|winter)/i;
                const flowSupportPattern = /(winback|reactivation|porzucon|abandoned|cart|post\s*purchase|after\s*purchase|welcome|onboarding|vip|loyal)/i;

                const hasAudienceData = (aud?: ListAuditReport["campaigns"][number]["audience"]) => {
                  if (!aud) return false;
                  return (
                    aud.includedSegments.length > 0 ||
                    aud.includedLists.length > 0 ||
                    aud.excludedSegments.length > 0 ||
                    aud.excludedLists.length > 0 ||
                    aud.unknownIncluded.length > 0 ||
                    aud.unknownExcluded.length > 0 ||
                    aud.isEntireList
                  );
                };
                const campaignsWithAudience = campaigns.filter((campaign) => hasAudienceData(campaign.audience));
                let engaged30Used = 0;
                let engaged90Used = 0;
                let engagedOnly = 0;
                let includesInactive = 0;
                let excludesInactive = 0;
                campaignsWithAudience.forEach((campaign) => {
                  const audience = campaign.audience;
                  if (!audience) return;
                  const includedNames = [
                    ...audience.includedSegments.map((item) => item.name),
                    ...audience.includedLists.map((item) => item.name),
                  ];
                  const excludedNames = [
                    ...audience.excludedSegments.map((item) => item.name),
                    ...audience.excludedLists.map((item) => item.name),
                  ];
                  const hasEngaged30 = includedNames.some((name) => engaged30Pattern.test(name));
                  const hasEngaged90 = includedNames.some((name) => engaged90Pattern.test(name));
                  if (hasEngaged30) engaged30Used += 1;
                  if (hasEngaged90) engaged90Used += 1;
                  const hasInactiveIncluded = includedNames.some((name) => inactivePattern.test(name)) || audience.isEntireList;
                  const hasInactiveExcluded = excludedNames.some((name) => inactivePattern.test(name));
                  if (hasInactiveIncluded) includesInactive += 1;
                  if (hasInactiveExcluded) excludesInactive += 1;
                  if (!hasInactiveIncluded && (hasEngaged30 || hasEngaged90)) {
                    engagedOnly += 1;
                  }
                });

                const audienceCount = campaignsWithAudience.length;
                const hasTargetData = audienceCount > 0;
                const engaged30Status: "yes" | "no" | "unknown" =
                  !hasTargetData ? "unknown" : engaged30Used > 0 ? "yes" : "no";
                const engaged90Status: "yes" | "no" | "unknown" =
                  !hasTargetData ? "unknown" : engaged90Used > 0 ? "yes" : "no";
                const engagedOnlyStatus: "yes" | "no" | "unknown" =
                  !hasTargetData
                    ? "unknown"
                    : includesInactive > 0
                      ? "no"
                      : engagedOnly / audienceCount >= 0.8
                        ? "yes"
                        : "no";
                const inactiveStatus: "yes" | "no" | "unknown" =
                  !hasTargetData ? "unknown" : includesInactive > 0 ? "yes" : "no";
                const excludedInactiveStatus: "yes" | "no" | "unknown" =
                  !hasTargetData
                    ? "unknown"
                    : excludesInactive / audienceCount >= 0.6 || engagedOnly / audienceCount >= 0.8
                      ? "yes"
                      : "no";

                const seasonalHeuristicAvailable = campaigns.some((campaign) => campaign.subject || campaign.name);
                const hasSeasonal = campaigns.some((campaign) =>
                  seasonalPattern.test(`${campaign.subject ?? ""} ${campaign.name ?? ""}`),
                );
                const seasonalStatus: "heuristic" | "unknown" = seasonalHeuristicAvailable ? "heuristic" : "unknown";
                const seasonalDetail = seasonalHeuristicAvailable ? (hasSeasonal ? "TAK" : "NIE") : undefined;

                const flowSupportAvailable = campaigns.some((campaign) => campaign.subject || campaign.name);
                const hasFlowSupport = campaigns.some((campaign) =>
                  flowSupportPattern.test(`${campaign.subject ?? ""} ${campaign.name ?? ""}`),
                );
                const flowSupportStatus: "heuristic" | "unknown" = flowSupportAvailable ? "heuristic" : "unknown";
                const flowSupportDetail = flowSupportAvailable ? (hasFlowSupport ? "TAK" : "NIE") : undefined;

                const nowTs = Date.now();
                const withinDays = (dateValue: string | null, days: number) => {
                  if (!dateValue) return false;
                  const ts = new Date(dateValue).getTime();
                  if (Number.isNaN(ts)) return false;
                  return nowTs - ts <= days * 24 * 60 * 60 * 1000;
                };
                const campaigns30d = campaigns.filter((campaign) => withinDays(campaign.sendTime ?? null, 30)).length;
                const campaigns90dList = campaigns.filter((campaign) => withinDays(campaign.sendTime ?? null, 90));
                const campaigns90d = campaigns90dList.length;

                const flowMetricRows = Array.isArray(report.flowAudit?.metrics?.perFlow)
                  ? (report.flowAudit?.metrics?.perFlow as Array<Record<string, unknown>>)
                  : [];
                const flowRevenueValues = flowMetricRows
                  .map((row) =>
                    readNumber(
                      row.revenue30,
                      row.revenue_30d,
                      row.revenue30d,
                      row.revenue,
                      row.revenue_30,
                    ),
                  )
                  .filter((value) => typeof value === "number") as number[];
                const revenueFromFlows =
                  flowRevenueValues.length > 0 ? flowRevenueValues.reduce((acc, value) => acc + value, 0) : null;
                const totalEmailRevenue =
                  revenueFromCampaigns !== null && revenueFromFlows !== null
                    ? revenueFromCampaigns + revenueFromFlows
                    : null;
                const flowRevenueShare =
                  totalEmailRevenue && totalEmailRevenue > 0 && revenueFromFlows !== null
                    ? (revenueFromFlows / totalEmailRevenue) * 100
                    : null;

                const segmentEngagedNames = report.segmentAudit?.keySegmentsFound.engaged ?? [];
                const engaged30Exists =
                  segmentEngagedNames.length > 0 ? segmentEngagedNames.some((name) => engaged30Pattern.test(name)) : null;
                const engaged90Exists =
                  segmentEngagedNames.length > 0 ? segmentEngagedNames.some((name) => engaged90Pattern.test(name)) : null;
                const inactive180Excluded =
                  excludedInactiveStatus === "yes" ? true : excludedInactiveStatus === "no" ? false : null;
                const engagedRatio = report.activity?.activeVsInactivePercent?.active90Percent ?? null;
                const seasonDetected = seasonalStatus === "heuristic";
                const hasSeasonalCampaigns = seasonalDetail === "TAK";

                const totalDelivered = campaignRowsWithMetrics.reduce((acc, row) => acc + (row.delivered ?? 0), 0);
                const avgCampaignsPerProfile =
                  totalProfiles > 0 && totalDelivered > 0 ? totalDelivered / totalProfiles : null;

                const campaignRiskLines: string[] = [];
                const campaignGapLines: string[] = [];
                const campaignActionLines: string[] = [];

                const apiUnavailable = report.base.campaignsAccess !== "ok";
                const campaignsWithMetrics90d = campaigns90dList.filter((campaign) => campaignMetricById.has(campaign.id));
                const metricsMissingRatio =
                  campaigns90d > 0 ? (campaigns90d - campaignsWithMetrics90d.length) / campaigns90d : 0;
                const campaignDataStatus: "NO_API" | "ZERO_ACTIVITY" | "PARTIAL_DATA" | "OK" =
                  apiUnavailable
                    ? "NO_API"
                    : campaigns90d === 0
                      ? "ZERO_ACTIVITY"
                      : metricsMissingRatio > 0.5
                        ? "PARTIAL_DATA"
                        : "OK";

                if (campaignDataStatus === "NO_API" || campaignDataStatus === "ZERO_ACTIVITY") {
                  campaignRiskLines.push(
                    "Brak aktywnej warstwy kampanii → brak komunikacji manualnej i brak skalowania; system zależny od flow lub innych kanałów.",
                  );
                  campaignGapLines.push(
                    "Brak cyklu kampanii (newsletter/sprzedażowe/sezonowe) i brak procesu planowania.",
                  );
                  campaignActionLines.push(
                    "Wdrożyć podstawowy plan kampanii (start: 2–4/mies.), najlepiej do engaged; dopiero potem rozszerzać.",
                  );
                  if (totalProfiles > 0 && totalProfiles < 5000) {
                    campaignActionLines.push("Doprecyzowanie: 2–4 kampanie/mies. przy bazie < 5k.");
                  } else if (totalProfiles >= 5000 && totalProfiles <= 50000) {
                    campaignActionLines.push("Doprecyzowanie: 1–2 kampanie/tydz. przy bazie 5k–50k.");
                  } else if (totalProfiles > 50000) {
                    campaignActionLines.push("Doprecyzowanie: 2–3 kampanie/tydz. przy bazie > 50k (engaged + wykluczenie 180+).");
                  }
                  if (campaignDataStatus === "NO_API") {
                    campaignActionLines.push("Notka techniczna: podłączyć API kampanii/metryk, aby potwierdzić dane.");
                  }
                } else {
                  if (campaigns30d === 0 && revenueFromFlows !== null && revenueFromFlows === 0) {
                    campaignRiskLines.push("System sprzedaży email nieaktywny (brak kampanii i brak revenue z flow).");
                  }
                  if (campaigns30d === 0 && flowRevenueShare !== null && flowRevenueShare < 40) {
                    campaignRiskLines.push(
                      "Brak warstwy manualnej przy niskiej automatyzacji → zależność od ruchu zewnętrznego.",
                    );
                  }
                  if (campaigns30d === 0 && flowRevenueShare !== null && flowRevenueShare >= 60) {
                    campaignRiskLines.push(
                      "Brak warstwy skalującej sprzedaż → system oparty wyłącznie na automatyzacjach.",
                    );
                  }
                  if ((avgUnsubRate !== null && avgUnsubRate > 0.5) || (avgSpamRate !== null && avgSpamRate > 0.1)) {
                    campaignRiskLines.push("Presja wysyłkowa / niedopasowanie segmentacji (unsub/spam ponad progiem).");
                  }
                  if (campaigns30d > 0 && engagedRatio !== null && engagedRatio < 40) {
                    campaignRiskLines.push("Wysyłki przy niskim poziomie zaangażowania bazy → ryzyko reputacyjne.");
                  }
                  if (campaigns30d > 0 && inactive180Excluded === false) {
                    campaignRiskLines.push("Brak kontroli zimnej bazy (180+ nie wykluczani z kampanii).");
                  }

                  if (avgUnsubRate === null && avgSpamRate === null) {
                    campaignRiskLines.push("Brak danych reputacyjnych do oceny ryzyka (unsub/spam/bounce).");
                  }

                  if (campaigns30d === 0) {
                    campaignGapLines.push("Brak aktywnej warstwy komunikacji manualnej.");
                  }
                  if (engaged30Exists === false) {
                    campaignGapLines.push("Brak segmentu engaged 30 → brak bezpiecznego targetu kampanii.");
                  }
                  if (engaged90Exists === false) {
                    campaignGapLines.push("Brak segmentu engaged 90 → brak warstwy podtrzymania zaangażowania.");
                  }
                  if (inactive180Excluded === false) {
                    campaignGapLines.push("Brak mechanizmu wygaszania nieaktywnych (180+).");
                  }
                  if (seasonDetected && !hasSeasonalCampaigns && campaigns30d > 0) {
                    campaignGapLines.push("Brak kampanii sezonowych → niewykorzystany potencjał okresów sprzedażowych.");
                  }
                  if (totalEmailRevenue !== null && totalEmailRevenue > 0 && revenueFromCampaigns !== null && campaigns30d > 0) {
                    const campaignShare = (revenueFromCampaigns / totalEmailRevenue) * 100;
                    if (campaignShare < 20) {
                      campaignGapLines.push("Kampanie nie generują istotnego wpływu przychodowego (<20%).");
                    }
                  }

                  if (campaigns30d === 0) {
                    campaignActionLines.push(
                      "Zaprojektować model komunikacji manualnej dopasowany do wielkości bazy i poziomu engaged.",
                    );
                    if (totalProfiles > 0 && totalProfiles < 5000) {
                      campaignActionLines.push("Rekomendacja: 2–4 kampanie miesięcznie, segmentowane do engaged.");
                    } else if (totalProfiles >= 5000 && totalProfiles <= 50000) {
                      campaignActionLines.push("Rekomendacja: 1–2 kampanie tygodniowo z wykluczeniem 180+.");
                    } else if (totalProfiles > 50000) {
                      campaignActionLines.push("Rekomendacja: model wielowarstwowy (engaged 30/90/VIP).");
                    }
                  }
                  if (engagedRatio !== null && engagedRatio < 50) {
                    campaignActionLines.push("Wdrożyć strategię reaktywacji przed zwiększaniem częstotliwości.");
                  }
                  if (avgUnsubRate !== null && avgUnsubRate > 0.5) {
                    campaignActionLines.push("Ograniczyć częstotliwość i zawęzić target do engaged 30.");
                  }
                  if (revenueFromCampaigns !== null && revenueFromFlows !== null) {
                    if (revenueFromCampaigns < revenueFromFlows) {
                      campaignActionLines.push("Wzmocnić segmentację i testy A/B w kampaniach.");
                    } else if (revenueFromCampaigns > revenueFromFlows) {
                      campaignActionLines.push("Upewnić się, że flow nie są zaniedbane i nie blokują skalowania.");
                    }
                  }

                  if (campaignDataStatus === "PARTIAL_DATA") {
                    campaignGapLines.push("Część metryk kampanii niedostępna → analiza reputacji ograniczona.");
                    campaignActionLines.push(
                      "Uzupełnić brakujące metryki kampanii (reporting/targeting), aby ocenić reputację i segmentację.",
                    );
                  }

                  if (!hasTargetData) {
                    campaignGapLines.push("Brak danych o targetowaniu kampanii → nie można ocenić segmentacji.");
                    campaignActionLines.push("Podłączyć recipients/targeting kampanii lub uzupełnić ręcznie segment docelowy.");
                  }
                }

                const renderCampaignTile = (title: string, items: string[]) => (
                  <div className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{title}</p>
                    <div className="mt-3 grid gap-1 text-xs text-slate-700">
                      {items.length > 0 ? (
                        items.map((item, idx) => <p key={`${title}-${idx}`}>{item}</p>)
                      ) : (
                        <p className="text-slate-500">Brak sygnałów.</p>
                      )}
                    </div>
                  </div>
                );
                const behaviorTiming = report.campaignAudit?.timing;
                const openTiming = behaviorTiming?.open;
                const clickTiming = behaviorTiming?.click;
                const behaviorTimingActive = clickTiming && clickTiming.total > 0 ? { ...clickTiming, label: "Kliknięcia" } : openTiming && openTiming.total > 0 ? { ...openTiming, label: "Otwarcia" } : null;
                const behaviorHeatmap = behaviorTimingActive?.matrix ?? Array.from({ length: 7 }, () => Array(24).fill(0));
                const behaviorMaxHeat = Math.max(1, ...behaviorHeatmap.flat());
                const behaviorTotal = behaviorTimingActive?.total ?? 0;
                const behaviorLowSample = behaviorTimingActive?.lowSample ?? false;
                const behaviorSampleMode = behaviorTimingActive?.sampleMode ?? "30d";

                const findTopSlots = (matrix: number[][], topN: number) => {
                  const slots: Array<{ day: number; hour: number; count: number }> = [];
                  matrix.forEach((row, dayIdx) => {
                    row.forEach((count, hourIdx) => {
                      slots.push({ day: dayIdx, hour: hourIdx, count });
                    });
                  });
                  return slots.sort((a, b) => b.count - a.count).slice(0, topN);
                };
                const sendTopSlots = findTopSlots(heatmapMatrix, 3);
                const behaviorTopSlots = findTopSlots(behaviorHeatmap, 3);
                const sendTopKey = sendTopSlots[0] ? `${sendTopSlots[0].day}-${sendTopSlots[0].hour}` : "";
                const behaviorTopKey = behaviorTopSlots[0] ? `${behaviorTopSlots[0].day}-${behaviorTopSlots[0].hour}` : "";
                const overlapTopSlot = sendTopKey && sendTopKey === behaviorTopKey;
                const sendTopShare = totalHeat > 0 ? Math.round((sendTopSlots[0]?.count ?? 0) / totalHeat * 100) : 0;
                const behaviorTopShare = behaviorTotal > 0 ? Math.round((behaviorTopSlots[0]?.count ?? 0) / behaviorTotal * 100) : 0;
                const behaviorFlat = behaviorTotal > 0 && behaviorTopShare < 20;
                const timingComment = behaviorTotal === 0
                  ? "Brak danych behawioralnych."
                  : behaviorFlat
                    ? "Brak wyraźnego wzorca aktywności – timing ma niską istotność strategiczną."
                    : overlapTopSlot && Math.abs((sendTopSlots[0]?.hour ?? 0) - (behaviorTopSlots[0]?.hour ?? 0)) <= 4
                      ? "Timing zgodny z aktywnością odbiorców."
                      : "Potencjał optymalizacji godziny wysyłki – harmonogram nie pokrywa się z aktywnością odbiorców.";

                const behaviorDayShare = behaviorHeatmap.map((row) => row.reduce((acc, value) => acc + value, 0));
                const behaviorDayLabels = behaviorDayShare.map((value, idx) =>
                  behaviorTotal > 0 ? `${dayLabels[idx]} ${Math.round((value / behaviorTotal) * 100)}%` : `${dayLabels[idx]} 0%`,
                );

                return (
                  <div className="mt-4 grid gap-4">
                  <div className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Snapshot kampanii</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="rounded-xl border border-white/70 bg-white/70 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Liczba kampanii ({campaignSampleMode === "90d" ? "90" : "30"} dni)</p>
                        <p className="mt-2 text-3xl font-semibold text-slate-900">{campaigns.length}</p>
                      </div>
                      <div className="rounded-xl border border-white/70 bg-white/70 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Średni revenue / campaign</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-400">
                          {avgRevenuePerCampaign !== null ? avgRevenuePerCampaign.toFixed(2) : "Brak danych"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/70 bg-white/70 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Średni revenue / recipient</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-400">
                          {avgRevenuePerRecipient !== null ? avgRevenuePerRecipient.toFixed(2) : "Brak danych"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/70 bg-white/70 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Średni unsub %</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-400">
                          {avgUnsubRate !== null ? `${avgUnsubRate.toFixed(2)}%` : "Brak danych"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/70 bg-white/70 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Średni spam complaint %</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-400">
                          {avgSpamRate !== null ? `${avgSpamRate.toFixed(2)}%` : "Brak danych"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/70 bg-white/70 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Największy wolumen wysyłki</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-400">
                          {maxVolume !== null ? maxVolume : "Brak danych"}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-slate-500">
                      {campaignApiNote}
                      {campaignSampleNote ? ` ${campaignSampleNote}` : ""}
                    </p>
                  </div>

                  <div className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Tabela główna kampanii</p>
                    <div className="mt-3 overflow-auto">
                      <table className="min-w-[980px] w-full text-left text-xs text-slate-700">
                        <thead>
                          <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500">
                            <th className="pb-2 pr-3">Kampania</th>
                            <th className="pb-2 pr-3">Data</th>
                            <th className="pb-2 pr-3">Segment</th>
                            <th className="pb-2 pr-3">Wolumen</th>
                            <th className="pb-2 pr-3">Delivered %</th>
                            <th className="pb-2 pr-3">Revenue</th>
                            <th className="pb-2 pr-3">Revenue/recip</th>
                            <th className="pb-2 pr-3">Click %</th>
                            <th className="pb-2 pr-3">Unsub %</th>
                            <th className="pb-2 pr-3">Spam %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {campaignRowsWithMetrics.length > 0 ? (
                            campaignRowsWithMetrics.map(({ campaign, delivered, deliveredRate, revenue, revenuePerRecipient, clickRate, unsubRate, spamRate }) => (
                              <tr key={campaign.id} className="border-b border-slate-100">
                                <td className="py-2 pr-3">{campaign.name}</td>
                                <td className="py-2 pr-3">{campaign.sendTime ? new Date(campaign.sendTime).toLocaleDateString("pl-PL") : "—"}</td>
                                <td className="py-2 pr-3 text-slate-500">
                                  {campaign.audience?.isEntireList ? "Entire list" : campaign.audience?.includedSegments[0]?.name ?? campaign.audience?.includedLists[0]?.name ?? "Brak danych"}
                                </td>
                                <td className="py-2 pr-3 text-slate-500">{delivered ?? "Brak danych"}</td>
                                <td className="py-2 pr-3 text-slate-500">{formatPercent(deliveredRate)}</td>
                                <td className="py-2 pr-3 text-slate-500">{revenue ?? "Brak danych"}</td>
                                <td className="py-2 pr-3 text-slate-500">{formatNumber(revenuePerRecipient)}</td>
                                <td className="py-2 pr-3 text-slate-500">{formatPercent(clickRate)}</td>
                                <td className="py-2 pr-3 text-slate-500">{formatPercent(unsubRate)}</td>
                                <td className="py-2 pr-3 text-slate-500">{formatPercent(spamRate)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td className="py-3 text-slate-500" colSpan={10}>Brak danych.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Stabilność – liczba kampanii w czasie</p>
                      <div className="mt-3 flex items-end gap-1 rounded-xl border border-white/70 bg-white/60 px-2 py-2">
                        {pickSeries.map((point) => (
                          <div
                            key={`count-${point.day}`}
                            className="w-full rounded bg-blue-200/80"
                            style={{ height: `${(point.count / maxCount) * 100}%`, minHeight: 6 }}
                            title={`${point.day}: ${point.count}`}
                          />
                        ))}
                      </div>
                      <p className="mt-2 text-[11px] text-slate-500">Okno: {timeWindowDays} dni</p>
                    </div>
                    <div className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Stabilność – wolumen wysyłki</p>
                      <div className="mt-3 flex items-end gap-1 rounded-xl border border-white/70 bg-white/60 px-2 py-2">
                        {pickSeries.map((point) => (
                          <div
                            key={`vol-${point.day}`}
                            className="w-full rounded bg-indigo-200/80"
                            style={{ height: `${(point.volume / maxVolumeSeries) * 100}%`, minHeight: 6 }}
                            title={`${point.day}: ${point.volume}`}
                          />
                        ))}
                      </div>
                      <p className="mt-2 text-[11px] text-slate-500">Okno: {timeWindowDays} dni</p>
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Reputacja kampanii</p>
                    <div className="mt-3 overflow-auto">
                      <table className="min-w-[620px] w-full text-left text-xs text-slate-700">
                        <thead>
                          <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500">
                            <th className="pb-2 pr-3">Kampania</th>
                            <th className="pb-2 pr-3">Unsub %</th>
                            <th className="pb-2 pr-3">Spam %</th>
                            <th className="pb-2 pr-3">Hard bounce %</th>
                            <th className="pb-2 pr-3">Risk</th>
                          </tr>
                        </thead>
                        <tbody>
                          {campaignRowsWithMetrics.length > 0 ? (
                            campaignRowsWithMetrics.map(({ campaign, unsubRate, spamRate, bounceRate }) => {
                              const risk =
                                spamRate !== null && spamRate > 0.1
                                  ? "Wysokie"
                                  : bounceRate !== null && bounceRate > 1
                                    ? "Wysokie"
                                    : unsubRate !== null && unsubRate > 0.5
                                      ? "Umiarkowane"
                                      : "Niskie";
                              const riskClass =
                                risk === "Wysokie"
                                  ? "text-rose-600"
                                  : risk === "Umiarkowane"
                                    ? "text-amber-600"
                                    : "text-emerald-600";
                              return (
                                <tr key={`risk-${campaign.id}`} className="border-b border-slate-100">
                                  <td className="py-2 pr-3">{campaign.name}</td>
                                  <td className="py-2 pr-3 text-slate-500">{formatPercent(unsubRate)}</td>
                                  <td className="py-2 pr-3 text-slate-500">{formatPercent(spamRate)}</td>
                                  <td className="py-2 pr-3 text-slate-500">{formatPercent(bounceRate)}</td>
                                  <td className={`py-2 pr-3 font-semibold ${riskClass}`}>{risk}</td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td className="py-3 text-slate-500" colSpan={5}>Brak danych.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Segmentacja kampanii – revenue per segment</p>
                      <div className="mt-3 flex items-end gap-2 rounded-xl border border-white/70 bg-white/60 px-2 py-2">
                        {segmentRevenueRows.length > 0 ? (
                          segmentRevenueRows.slice(0, 8).map((row) => (
                            <div key={`seg-${row.segment}`} className="flex-1">
                              <div
                                className="rounded bg-emerald-200/80"
                                style={{
                                  height: `${Math.max(6, (row.revenue / (segmentRevenueRows[0]?.revenue || 1)) * 100)}%`,
                                }}
                                title={`${row.segment}: ${row.revenue.toFixed(2)}`}
                              />
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-500">Brak danych segmentowych.</p>
                        )}
                      </div>
                      {segmentRevenueRows.length > 0 ? (
                        <p className="mt-2 text-[11px] text-slate-500">
                          Revenue: Engaged {shareLabel(segmentRevenueTotals.engaged)} · Mixed {shareLabel(segmentRevenueTotals.mixed)} · Inactive {shareLabel(segmentRevenueTotals.inactive)} · Unknown {shareLabel(segmentRevenueTotals.unknown)}
                        </p>
                      ) : null}
                    </div>
                    <div className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Segmentacja kampanii – tabela</p>
                      <div className="mt-3 overflow-auto">
                        <table className="min-w-[560px] w-full text-left text-xs text-slate-700">
                          <thead>
                            <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500">
                              <th className="pb-2 pr-3">Segment</th>
                              <th className="pb-2 pr-3">Liczba kampanii</th>
                              <th className="pb-2 pr-3">Typ</th>
                              <th className="pb-2 pr-3">Średni Click %</th>
                              <th className="pb-2 pr-3">Średni revenue</th>
                            </tr>
                          </thead>
                          <tbody>
                            {segmentRevenueRows.length > 0 ? (
                              segmentRevenueRows.map((row) => (
                                <tr key={`seg-row-${row.segment}`} className="border-b border-slate-100">
                                  <td className="py-2 pr-3">{row.segment}</td>
                                  <td className="py-2 pr-3 text-slate-500">{row.campaigns}</td>
                                  <td className="py-2 pr-3 text-[11px] text-slate-500">{row.label}</td>
                                  <td className="py-2 pr-3 text-slate-500">
                                    {row.avgClick !== null ? `${row.avgClick.toFixed(2)}%` : "Brak danych"}
                                  </td>
                                  <td className="py-2 pr-3 text-slate-500">{row.revenue.toFixed(2)}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td className="py-3 text-slate-500" colSpan={5}>Brak danych.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Strategia i pokrycie</p>
                    <div className="mt-3 grid gap-2 text-xs text-slate-700 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="flex items-center justify-between rounded-lg border border-white/70 bg-white/70 px-3 py-2">
                        <span>Czy są kampanie do engaged 30?</span>
                        {campaignStatusBadge(engaged30Status)}
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-white/70 bg-white/70 px-3 py-2">
                        <span>Czy są kampanie do engaged 90?</span>
                        {campaignStatusBadge(engaged90Status)}
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-white/70 bg-white/70 px-3 py-2">
                        <span>Czy wysyłki obejmują tylko engaged?</span>
                        {campaignStatusBadge(engagedOnlyStatus)}
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-white/70 bg-white/70 px-3 py-2">
                        <span>Czy są wysyłki do nieaktywnych?</span>
                        {campaignStatusBadge(inactiveStatus)}
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-white/70 bg-white/70 px-3 py-2">
                        <span>Czy istnieją tematy sezonowe?</span>
                        {campaignStatusBadge(seasonalStatus, seasonalDetail, "Ocena na podstawie nazw/tematów kampanii.")}
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-white/70 bg-white/70 px-3 py-2">
                        <span>Czy kampanie wspierają flow?</span>
                        {campaignStatusBadge(flowSupportStatus, flowSupportDetail, "Ocena na podstawie nazw/tematów kampanii.")}
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-white/70 bg-white/70 px-3 py-2">
                        <span>Czy wykluczani są nieaktywni 180+?</span>
                        {campaignStatusBadge(excludedInactiveStatus)}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">A/B testy</p>
                    <div className="mt-3 overflow-auto">
                      <table className="min-w-[620px] w-full text-left text-xs text-slate-700">
                        <thead>
                          <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500">
                            <th className="pb-2 pr-3">Kampania</th>
                            <th className="pb-2 pr-3">A/B</th>
                            <th className="pb-2 pr-3">Co testowane</th>
                            <th className="pb-2 pr-3">Winner</th>
                            <th className="pb-2 pr-3">Różnica %</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="py-3 text-slate-500" colSpan={5}>Brak danych.</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-3">
                    <div className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl lg:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Rozkład momentów wysyłek</p>
                      <div className="mt-3 overflow-auto rounded-xl border border-white/70 bg-white/60 p-2">
                        <div className="grid gap-1" style={{ gridTemplateColumns: "40px repeat(24, minmax(12px, 1fr))" }}>
                          <div />
                          {Array.from({ length: 24 }).map((_, hour) => (
                            <div key={`h-${hour}`} className="text-[9px] text-slate-500 text-center">{hour}</div>
                          ))}
                          {heatmapMatrix.map((row, dayIdx) => (
                            <div key={`day-${dayIdx}`} className="contents">
                              <div className="text-[10px] text-slate-600">{dayLabels[dayIdx]}</div>
                              {row.map((count, hourIdx) => (
                                <div
                                  key={`cell-${dayIdx}-${hourIdx}`}
                                  className="h-4 rounded"
                                  style={{
                                    backgroundColor: count === 0 ? "rgba(148,163,184,0.2)" : `rgba(59,130,246,${0.2 + 0.6 * (count / maxHeat)})`,
                                  }}
                                  title={`${dayLabels[dayIdx]} ${hourIdx}:00 – ${count}`}
                                />
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mt-3 grid gap-2 text-xs text-slate-700 sm:grid-cols-2">
                        <div className="flex items-center justify-between">
                          <span>Średnia liczba kampanii (30 dni)</span>
                          <span className="text-slate-500">{campaigns.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Średni odstęp dni</span>
                          <span className="text-slate-500">{avgGap !== null ? avgGap.toFixed(1) : "Brak danych"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Max przerwa</span>
                          <span className="text-slate-500">{maxGap !== null ? maxGap.toFixed(1) : "Brak danych"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Max zagęszczenie (24h)</span>
                          <span className="text-slate-500">{maxDensity > 0 ? maxDensity : "Brak danych"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Najczęstszy slot</span>
                          <span className="text-slate-500">{topSlotLabel}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Koncentracja top 2</span>
                          <span className="text-slate-500">{totalHeat > 0 ? `${top2Share}%` : "Brak danych"}</span>
                        </div>
                        {totalHeat > 0 && top2Share > 60 ? (
                          <p className="text-[11px] text-amber-600">
                            Brak dywersyfikacji czasu wysyłki.
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Aktywność odbiorców ({behaviorTimingActive?.label ?? "Brak danych"})</p>
                      <div className="mt-3 overflow-auto rounded-xl border border-white/70 bg-white/60 p-2">
                        <div className="grid gap-1" style={{ gridTemplateColumns: "40px repeat(24, minmax(12px, 1fr))" }}>
                          <div />
                          {Array.from({ length: 24 }).map((_, hour) => (
                            <div key={`bh-${hour}`} className="text-[9px] text-slate-500 text-center">{hour}</div>
                          ))}
                          {behaviorHeatmap.map((row, dayIdx) => (
                            <div key={`bday-${dayIdx}`} className="contents">
                              <div className="text-[10px] text-slate-600">{dayLabels[dayIdx]}</div>
                              {row.map((count, hourIdx) => (
                                <div
                                  key={`bcell-${dayIdx}-${hourIdx}`}
                                  className="h-4 rounded"
                                  style={{
                                    backgroundColor: count === 0 ? "rgba(148,163,184,0.2)" : `rgba(16,185,129,${0.2 + 0.6 * (count / behaviorMaxHeat)})`,
                                  }}
                                  title={`${dayLabels[dayIdx]} ${hourIdx}:00 – ${count}`}
                                />
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mt-3 grid gap-2 text-xs text-slate-700">
                        <div className="flex items-center justify-between">
                          <span>Najczęstszy slot otwarć</span>
                          <span className="text-slate-500">
                            {behaviorTopSlots[0] ? `${dayLabels[behaviorTopSlots[0].day]} ${behaviorTopSlots[0].hour}:00` : "Brak danych"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Top 3 godziny</span>
                          <span className="text-slate-500">
                            {behaviorTopSlots.filter((slot) => slot.count > 0).length > 0
                              ? behaviorTopSlots
                                  .filter((slot) => slot.count > 0)
                                  .map((slot) => `${slot.hour}:00`)
                                  .join(", ")
                              : "Brak danych"}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {behaviorTotal > 0 ? `Rozkład dzienny: ${behaviorDayLabels.join(" · ")}` : "Brak danych behawioralnych."}
                        </div>
                        {behaviorLowSample ? (
                          <p className="text-[11px] text-amber-600">Mała próba – orientacyjnie ({behaviorSampleMode}).</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl lg:col-span-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Dopasowanie wysyłki do aktywności</p>
                      <p className="mt-2 text-sm text-slate-600">{timingComment}</p>
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.35)] backdrop-blur-xl">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Manualne notatki</p>
                    <div className="mt-3 grid gap-4 text-xs text-slate-700">
                      {campaignDataStatus === "ZERO_ACTIVITY" ? (
                        <p className="text-slate-500">Brak kampanii do oceny manualnej.</p>
                      ) : campaigns.length > 0 ? (
                        campaigns.map((campaign) => {
                          const manual = campaignManualInputs[campaign.id];
                          const status = campaignManualStatus[campaign.id] ?? "idle";
                          const setManual = (field: keyof typeof campaignManualInputs[string]) => (event: { target: { value: string } }) =>
                            setCampaignManualInputs((prev) => ({
                              ...prev,
                              [campaign.id]: {
                                ...prev[campaign.id],
                                [field]: event.target.value,
                              },
                            }));
                          return (
                            <div key={`campaign-manual-${campaign.id}`} className="rounded-xl border border-white/70 bg-white/70 p-3 text-xs text-slate-700">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="font-semibold text-slate-800">{campaign.name}</p>
                                <span className="text-[11px] text-slate-500">{campaign.status ?? "—"}</span>
                              </div>
                              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                <div>
                                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Tematy powtarzalne</label>
                                  <select value={manual?.copyRepeats ?? ""} onChange={setManual("copyRepeats")} className="mt-1 w-full rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-xs text-slate-700">
                                    <option value="">N/D</option>
                                    <option value="yes">TAK</option>
                                    <option value="no">NIE</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Personalizacja</label>
                                  <select value={manual?.personalization ?? ""} onChange={setManual("personalization")} className="mt-1 w-full rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-xs text-slate-700">
                                    <option value="">N/D</option>
                                    <option value="yes">TAK</option>
                                    <option value="no">NIE</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">CTA w hero</label>
                                  <select value={manual?.ctaVisible ?? ""} onChange={setManual("ctaVisible")} className="mt-1 w-full rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-xs text-slate-700">
                                    <option value="">N/D</option>
                                    <option value="yes">TAK</option>
                                    <option value="no">NIE</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Spójność design</label>
                                  <select value={manual?.designConsistency ?? ""} onChange={setManual("designConsistency")} className="mt-1 w-full rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-xs text-slate-700">
                                    <option value="">N/D</option>
                                    <option value="yes">TAK</option>
                                    <option value="no">NIE</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Alt tagi</label>
                                  <select value={manual?.altTags ?? ""} onChange={setManual("altTags")} className="mt-1 w-full rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-xs text-slate-700">
                                    <option value="">N/D</option>
                                    <option value="yes">TAK</option>
                                    <option value="no">NIE</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Linki poprawne</label>
                                  <select value={manual?.linksOk ?? ""} onChange={setManual("linksOk")} className="mt-1 w-full rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-xs text-slate-700">
                                    <option value="">N/D</option>
                                    <option value="yes">TAK</option>
                                    <option value="no">NIE</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Kampanie planowane</label>
                                  <select value={manual?.planned ?? ""} onChange={setManual("planned")} className="mt-1 w-full rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-xs text-slate-700">
                                    <option value="">N/D</option>
                                    <option value="yes">TAK</option>
                                    <option value="no">NIE</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Serie tematyczne</label>
                                  <select value={manual?.thematicSeries ?? ""} onChange={setManual("thematicSeries")} className="mt-1 w-full rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-xs text-slate-700">
                                    <option value="">N/D</option>
                                    <option value="yes">TAK</option>
                                    <option value="no">NIE</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Storytelling</label>
                                  <select value={manual?.storytelling ?? ""} onChange={setManual("storytelling")} className="mt-1 w-full rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-xs text-slate-700">
                                    <option value="">N/D</option>
                                    <option value="yes">TAK</option>
                                    <option value="no">NIE</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Kalendarz kampanii</label>
                                  <select value={manual?.campaignCalendar ?? ""} onChange={setManual("campaignCalendar")} className="mt-1 w-full rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-xs text-slate-700">
                                    <option value="">N/D</option>
                                    <option value="yes">TAK</option>
                                    <option value="no">NIE</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Dominują rabaty</label>
                                  <select value={manual?.discountHeavy ?? ""} onChange={setManual("discountHeavy")} className="mt-1 w-full rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-xs text-slate-700">
                                    <option value="">N/D</option>
                                    <option value="yes">TAK</option>
                                    <option value="no">NIE</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Sezonowość</label>
                                  <select value={manual?.seasonal ?? ""} onChange={setManual("seasonal")} className="mt-1 w-full rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-xs text-slate-700">
                                    <option value="">N/D</option>
                                    <option value="yes">TAK</option>
                                    <option value="no">NIE</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Wyklucza osoby w flow</label>
                                  <select value={manual?.excludeFlows ?? ""} onChange={setManual("excludeFlows")} className="mt-1 w-full rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-xs text-slate-700">
                                    <option value="">N/D</option>
                                    <option value="yes">TAK</option>
                                    <option value="no">NIE</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Nie uderza w Welcome</label>
                                  <select value={manual?.avoidWelcome ?? ""} onChange={setManual("avoidWelcome")} className="mt-1 w-full rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-xs text-slate-700">
                                    <option value="">N/D</option>
                                    <option value="yes">TAK</option>
                                    <option value="no">NIE</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Zgodne z engaged</label>
                                  <select value={manual?.engagedAligned ?? ""} onChange={setManual("engagedAligned")} className="mt-1 w-full rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-xs text-slate-700">
                                    <option value="">N/D</option>
                                    <option value="yes">TAK</option>
                                    <option value="no">NIE</option>
                                  </select>
                                </div>
                              </div>
                              <div className="mt-3">
                                <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Notatka</label>
                                <textarea
                                  value={manual?.note ?? ""}
                                  onChange={(event) =>
                                    setCampaignManualInputs((prev) => ({
                                      ...prev,
                                      [campaign.id]: {
                                        ...prev[campaign.id],
                                        note: event.target.value,
                                      },
                                    }))
                                  }
                                  className="mt-1 min-h-[72px] w-full rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-xs text-slate-700"
                                />
                              </div>
                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    void saveCampaignManual(campaign.id, (campaignManualInputs[campaign.id] ?? {
                                      copyRepeats: "",
                                      personalization: "",
                                      ctaVisible: "",
                                      designConsistency: "",
                                      altTags: "",
                                      linksOk: "",
                                      planned: "",
                                      thematicSeries: "",
                                      storytelling: "",
                                      campaignCalendar: "",
                                      discountHeavy: "",
                                      seasonal: "",
                                      excludeFlows: "",
                                      avoidWelcome: "",
                                      engagedAligned: "",
                                      note: "",
                                    }) as typeof campaignManualInputs[string])
                                  }
                                  className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-white"
                                >
                                  Zapisz ocenę
                                </button>
                                {status === "saving" ? (
                                  <span className="text-[11px] text-slate-500">Zapisywanie...</span>
                                ) : status === "saved" ? (
                                  <span className="text-[11px] text-emerald-600">Zapisano</span>
                                ) : status === "error" ? (
                                  <span className="text-[11px] text-rose-600">Błąd zapisu</span>
                                ) : null}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-slate-500">Brak kampanii do oceny manualnej.</p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-3">
                    {renderCampaignTile("Ryzyko", campaignRiskLines)}
                    {renderCampaignTile("Luki", campaignGapLines)}
                    {renderCampaignTile("Do wprowadzenia", campaignActionLines)}
                  </div>
                </div>
                );
              })()}
            </div>
          )}

          <div
            id="design-audit"
            className="mt-6 rounded-[28px] border border-white/50 bg-gradient-to-br from-[#cfd9ff] via-[#e3e9ff] to-[#f7f9ff] p-4 shadow-[0_30px_80px_-45px_rgba(63,74,219,0.45)] sm:p-5"
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-slate-900">Audyt Designu</h2>
              <button
                type="button"
                onClick={() => setIsDesignAuditExpanded((prev) => !prev)}
                className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-white"
              >
                {isDesignAuditExpanded ? "Zwiń" : "Rozwiń"}
              </button>
            </div>
            <p className="text-sm text-slate-600">Manualna ocena jakości struktury i czytelności emaili.</p>

            {isDesignAuditExpanded && (() => {
              const setDesign = (field: string) => (event: { target: { value: string } }) =>
                setDesignAuditInputs((prev) => ({ ...prev, [field]: event.target.value }));
              const valueOf = (field: string) => designAuditInputs[field] ?? "";
              const renderSelect = (label: string, field: string) => (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-700">{label}</span>
                  <select
                    value={valueOf(field)}
                    onChange={setDesign(field)}
                    className="w-[110px] rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-xs text-slate-700"
                  >
                    <option value="">N/D</option>
                    <option value="yes">TAK</option>
                    <option value="no">NIE</option>
                  </select>
                </div>
              );

              return (
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-[22px] border border-white/70 bg-white/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.25)]">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Hierarchia</p>
                    <div className="mt-3 grid gap-2">
                      {renderSelect("Wyraźny, atrakcyjny nagłówek", "hierarchyHeadline")}
                      {renderSelect("Pierwszy ekran mówi o czym jest mail", "hierarchyFirstScreen")}
                      {renderSelect("Jedno główne CTA", "hierarchySingleCta")}
                      {renderSelect("Jasno podzielone sekcje", "hierarchySections")}
                    </div>
                  </div>
                  <div className="rounded-[22px] border border-white/70 bg-white/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.25)]">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Above the fold</p>
                    <div className="mt-3 grid gap-2">
                      {renderSelect("CTA widoczny bez scrolla", "foldCtaVisible")}
                      {renderSelect("Hero nie zajmuje 90% ekranu", "foldHeroSize")}
                    </div>
                  </div>
                  <div className="rounded-[22px] border border-white/70 bg-white/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.25)]">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Długość</p>
                    <div className="mt-3 grid gap-2">
                      {renderSelect("Mail nie jest zbyt długi", "lengthReasonable")}
                      {renderSelect("Sekcje mają logiczny podział", "lengthSections")}
                    </div>
                  </div>
                  <div className="rounded-[22px] border border-white/70 bg-white/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.25)]">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Linki i CTA</p>
                    <div className="mt-3 grid gap-2">
                      {renderSelect("Wszystkie linki działają", "linksWorking")}
                      {renderSelect("CTA prowadzi do właściwej strony", "ctaTarget")}
                      {renderSelect("Przycisk CTA jest wyraźny", "ctaVisible")}
                      {renderSelect("Linki tekstowe są widoczne", "textLinksVisible")}
                      {renderSelect("Brak konkurujących CTA", "ctaCompetition")}
                    </div>
                  </div>
                  <div className="rounded-[22px] border border-white/70 bg-white/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.25)]">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Alt text i dostępność</p>
                    <div className="mt-3 grid gap-2">
                      {renderSelect("Wszystkie obrazy mają alt text", "altAllImages")}
                      {renderSelect("Mail ma sens przy wyłączonych obrazach", "altImagesOff")}
                      {renderSelect("Tekst na obrazach nie jest jedynym nośnikiem", "altTextOnImages")}
                      {renderSelect("Kontrast kolorów wystarczający", "altContrast")}
                    </div>
                  </div>
                  <div className="rounded-[22px] border border-white/70 bg-white/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.25)]">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Mobile / Desktop / Dark Mode</p>
                    <div className="mt-3 grid gap-2">
                      {renderSelect("Tekst nie jest za mały", "responsiveText")}
                      {renderSelect("CTA nie jest za mały", "responsiveCta")}
                      {renderSelect("Sekcje nie są ściśnięte", "responsiveSpacing")}
                    </div>
                  </div>
                  <div className="rounded-[22px] border border-white/70 bg-white/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.25)] lg:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Subject line & Preview text</p>
                    <div className="mt-3 grid gap-2">
                      {renderSelect("Subject ma jasną korzyść", "subjectBenefit")}
                      {renderSelect("Subject nie jest clickbaitowy", "subjectNoClickbait")}
                      {renderSelect("Preview uzupełnia subject", "previewComplements")}
                      {renderSelect("Preview nie powtarza tematu", "previewNotRepeat")}
                      {renderSelect("Preview nie ucina się w połowie", "previewNotCut")}
                    </div>
                  </div>
                  <div className="rounded-[22px] border border-white/70 bg-white/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.25)] lg:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Notatka</label>
                    <textarea
                      value={valueOf("note")}
                      onChange={setDesign("note")}
                      rows={3}
                      className="mt-2 w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-xs text-slate-700"
                    />
                  </div>
                </div>
              );
            })()}
          </div>

          <div
            id="kpi-audit"
            className="mt-6 rounded-[28px] border border-white/50 bg-gradient-to-br from-[#cfd9ff] via-[#e3e9ff] to-[#f7f9ff] p-4 shadow-[0_30px_80px_-45px_rgba(63,74,219,0.45)] sm:p-5"
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-slate-900">KPI systemu email</h2>
            </div>
            <p className="text-sm text-slate-600">Struktura przychodu, efektywność i dojrzałość systemu.</p>

            {kpiSnapshot ? (
              <div className="mt-4 grid gap-4">
                <div className="rounded-[22px] border border-white/70 bg-white/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.25)]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Struktura przychodu</p>
                  <div className="mt-3 grid gap-3 lg:grid-cols-2">
                    <div className="rounded-xl border border-white/70 bg-white/80 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Revenue Split (Flow vs Kampanie)</p>
                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-blue-200/70 bg-blue-100/60 text-xs font-semibold text-blue-700">
                          {kpiSnapshot.flowRevenueShare !== null ? `${kpiSnapshot.flowRevenueShare.toFixed(0)}%` : "—"}
                        </div>
                        <div className="text-xs text-slate-600">
                          <div>Flow: {kpiSnapshot.flowRevenueShare !== null ? `${kpiSnapshot.flowRevenueShare.toFixed(1)}%` : "Brak danych"}</div>
                          <div>Kampanie: {kpiSnapshot.campaignRevenueShare !== null ? `${kpiSnapshot.campaignRevenueShare.toFixed(1)}%` : "Brak danych"}</div>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/70 bg-white/80 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Koncentracja revenue (Top 3 kampanie)</p>
                      <div className="mt-3 flex items-end gap-2">
                        <div className="h-2 flex-1 rounded-full bg-slate-200">
                          <div
                            className="h-2 rounded-full bg-indigo-400"
                            style={{
                              width:
                                kpiSnapshot.totalRevenue > 0
                                  ? `${Math.min(100, (kpiSnapshot.revenueTop3 / kpiSnapshot.totalRevenue) * 100)}%`
                                  : "0%",
                            }}
                          />
                        </div>
                        <span className="text-xs text-slate-600">
                          {kpiSnapshot.totalRevenue > 0
                            ? `${Math.round((kpiSnapshot.revenueTop3 / kpiSnapshot.totalRevenue) * 100)}%`
                            : "Brak danych"}
                        </span>
                      </div>
                      <div className="mt-2 text-[11px] text-slate-500">
                        Top 3 kampanie vs reszta
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/70 bg-white/80 p-3 lg:col-span-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Koncentracja segmentu</p>
                      <div className="mt-3 flex items-center gap-3">
                        <div className="h-2 flex-1 rounded-full bg-slate-200">
                          <div
                            className="h-2 rounded-full bg-emerald-400"
                            style={{
                              width: kpiSnapshot.topSegmentShare !== null ? `${Math.min(100, kpiSnapshot.topSegmentShare)}%` : "0%",
                            }}
                          />
                        </div>
                        <span className="text-xs text-slate-600">
                          {kpiSnapshot.topSegmentShare !== null ? `${kpiSnapshot.topSegmentShare.toFixed(1)}%` : "Brak danych"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-1 text-xs text-slate-600">
                    {kpiSnapshot.flowRevenueShare !== null ? (
                      kpiSnapshot.flowRevenueShare < 25
                        ? "Flow revenue < 25% → system zależny od kampanii manualnych."
                        : kpiSnapshot.flowRevenueShare <= 50
                          ? "Flow revenue 25–50% → system mieszany (potencjał automatyzacji)."
                          : "Flow revenue > 50% → system dojrzały automatycznie."
                    ) : (
                      "Brak danych o udziale flow vs kampanie."
                    )}
                    {kpiSnapshot.totalRevenue > 0 && kpiSnapshot.revenueTop3 / kpiSnapshot.totalRevenue > 0.6
                      ? "Top 3 kampanie > 60% revenue → koncentracja przychodu (niska dywersyfikacja)."
                      : null}
                    {kpiSnapshot.totalRevenue > 0 && kpiSnapshot.revenueTop3 > 0 && (kpiSnapshot.revenueTop3 / kpiSnapshot.totalRevenue) > 0.6
                      ? null
                      : null}
                    {kpiSnapshot.totalRevenue > 0 &&
                    kpiSnapshot.campaignRevenueRows
                      .map((row) => row.revenue ?? 0)
                      .sort((a, b) => b - a)[0] / kpiSnapshot.totalRevenue > 0.35
                      ? "Top 1 kampania > 35% revenue → ryzyko „one hit system”."
                      : null}
                    {kpiSnapshot.topSegmentShare !== null && kpiSnapshot.topSegmentShare >= 50
                      ? "≥50% revenue z jednego segmentu → zależność od jednej grupy."
                      : null}
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-[22px] border border-white/70 bg-white/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.25)]">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Revenue per recipient</p>
                    <div className="mt-3 text-xs text-slate-700">
                      <div className="flex items-center justify-between">
                        <span>Flow</span>
                        <span>{kpiSnapshot.avgFlowRevenuePerRecipient ?? "Brak danych"}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span>Kampanie</span>
                        <span>
                          {kpiSnapshot.avgCampaignRevenuePerRecipientValue !== null
                            ? kpiSnapshot.avgCampaignRevenuePerRecipientValue.toFixed(2)
                            : "Brak danych"}
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-600">
                      {kpiSnapshot.avgFlowRevenuePerRecipient !== null &&
                      kpiSnapshot.avgCampaignRevenuePerRecipientValue !== null ? (
                        kpiSnapshot.avgFlowRevenuePerRecipient > kpiSnapshot.avgCampaignRevenuePerRecipientValue
                          ? "Flow RPR > Kampanie RPR → automatyzacja bardziej efektywna."
                          : "Kampanie RPR > Flow RPR → flow do wzmocnienia/personalizacji."
                      ) : (
                        "Brak pełnych danych do porównania RPR."
                      )}
                    </p>
                  </div>
                  <div className="rounded-[22px] border border-white/70 bg-white/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.25)]">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Reputacja porównawcza</p>
                    <div className="mt-3 text-xs text-slate-700">
                      <div className="flex items-center justify-between">
                        <span>Flow (Unsub / Spam / Bounce)</span>
                        <span>{kpiSnapshot.avgFlowUnsub ?? "Brak danych"} / {kpiSnapshot.avgFlowSpam ?? "—"} / {kpiSnapshot.avgFlowBounce ?? "—"}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span>Kampanie (Unsub / Spam / Bounce)</span>
                        <span>
                          {kpiSnapshot.avgCampaignUnsub.length > 0
                            ? `${(kpiSnapshot.avgCampaignUnsub.reduce((acc, v) => acc + v, 0) / kpiSnapshot.avgCampaignUnsub.length).toFixed(2)}%`
                            : "Brak danych"}
                          {" / "}
                          {kpiSnapshot.avgCampaignSpam.length > 0
                            ? `${(kpiSnapshot.avgCampaignSpam.reduce((acc, v) => acc + v, 0) / kpiSnapshot.avgCampaignSpam.length).toFixed(2)}%`
                            : "Brak danych"}
                          {" / "}
                          {kpiSnapshot.avgCampaignBounce.length > 0
                            ? `${(kpiSnapshot.avgCampaignBounce.reduce((acc, v) => acc + v, 0) / kpiSnapshot.avgCampaignBounce.length).toFixed(2)}%`
                            : "Brak danych"}
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-600">
                      {kpiSnapshot.avgFlowUnsub !== null && kpiSnapshot.avgCampaignUnsub.length > 0 ? (
                        (kpiSnapshot.avgCampaignUnsub.reduce((acc, v) => acc + v, 0) / kpiSnapshot.avgCampaignUnsub.length) >
                        (kpiSnapshot.avgFlowUnsub * 2)
                          ? "Kampanie mają 2x wyższy unsub/spam → problem targetowania."
                          : kpiSnapshot.avgFlowUnsub > (kpiSnapshot.avgCampaignUnsub.reduce((acc, v) => acc + v, 0) / kpiSnapshot.avgCampaignUnsub.length)
                            ? "Flow mają wyższy unsub → problem timingowy/za agresywne automaty."
                            : "Reputacja kampanii i flow bez dużych rozjazdów."
                      ) : (
                        "Brak pełnych danych reputacyjnych do porównania."
                      )}
                    </p>
                  </div>
                  <div className="rounded-[22px] border border-white/70 bg-white/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.25)]">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Conversion Efficiency</p>
                    <div className="mt-3 text-xs text-slate-700">
                      <div className="flex items-center justify-between">
                        <span>Click % (Kampanie)</span>
                        <span>{kpiSnapshot.efficiencyCampaign.clickRate !== null ? `${kpiSnapshot.efficiencyCampaign.clickRate.toFixed(2)}%` : "Brak danych"}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span>Conversion % (Kampanie)</span>
                        <span>{kpiSnapshot.efficiencyCampaign.conversionRate !== null ? `${kpiSnapshot.efficiencyCampaign.conversionRate.toFixed(2)}%` : "Brak danych"}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span>Revenue per click</span>
                        <span>{kpiSnapshot.efficiencyCampaign.revenuePerClick !== null ? kpiSnapshot.efficiencyCampaign.revenuePerClick.toFixed(2) : "Brak danych"}</span>
                      </div>
                      {kpiSnapshot.efficiencyCampaign.clickRate !== null &&
                      kpiSnapshot.efficiencyCampaign.conversionRate !== null &&
                      kpiSnapshot.efficiencyCampaign.clickRate > 2 &&
                      kpiSnapshot.efficiencyCampaign.conversionRate < 0.5 ? (
                        <p className="mt-2 text-[11px] text-amber-600">Click wysoki + conversion niski → problem oferty/UX.</p>
                      ) : kpiSnapshot.efficiencyCampaign.clickRate !== null &&
                      kpiSnapshot.efficiencyCampaign.conversionRate !== null &&
                      kpiSnapshot.efficiencyCampaign.clickRate < 1 &&
                      kpiSnapshot.efficiencyCampaign.conversionRate >= 0.5 ? (
                        <p className="mt-2 text-[11px] text-amber-600">Click niski + conversion wysoki → dobry produkt, słabe copy.</p>
                      ) : kpiSnapshot.efficiencyCampaign.clickRate !== null &&
                      kpiSnapshot.efficiencyCampaign.conversionRate !== null &&
                      kpiSnapshot.efficiencyCampaign.clickRate < 1 &&
                      kpiSnapshot.efficiencyCampaign.conversionRate < 0.5 ? (
                        <p className="mt-2 text-[11px] text-amber-600">Click niski + conversion niski → problem komunikacji lub segmentacji.</p>
                      ) : kpiSnapshot.efficiencyCampaign.revenuePerClick !== null &&
                      kpiSnapshot.efficiencyCampaign.revenuePerClick < 1 ? (
                        <p className="mt-2 text-[11px] text-amber-600">Revenue per click niski → słaba wartość koszyka lub niedopasowana oferta.</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="rounded-[22px] border border-white/70 bg-white/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.25)]">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Engagement Decay</p>
                    <div className="mt-3 flex items-end gap-2 rounded-xl border border-white/70 bg-white/80 px-3 py-3">
                      {kpiSnapshot.engagementSeries.map((item) => (
                        <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
                          <div
                            className="w-full rounded bg-blue-200/70"
                            style={{ height: `${Math.max(6, item.value)}px` }}
                            title={`${item.label}: ${item.value}`}
                          />
                          <span className="text-[10px] text-slate-500">{item.label}</span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 text-[11px] text-slate-600">
                      {kpiSnapshot.engagementSeries[0].value > 0 && kpiSnapshot.engagementSeries[2].value > kpiSnapshot.engagementSeries[0].value
                        ? "Engaged 30 maleje, a 180+ rośnie → baza się starzeje."
                        : kpiSnapshot.engagementSeries[0].value >= kpiSnapshot.engagementSeries[1].value &&
                          kpiSnapshot.engagementSeries[2].value < kpiSnapshot.engagementSeries[0].value
                          ? "Engaged 30 stabilny, 180+ niskie → zdrowa baza."
                          : "Brak jednoznacznego trendu zaangażowania."}
                    </p>
                  </div>
                  <div className="rounded-[22px] border border-white/70 bg-white/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.25)] lg:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Automation Coverage Ratio</p>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="h-2 flex-1 rounded-full bg-slate-200">
                        <div
                          className="h-2 rounded-full bg-emerald-400"
                          style={{
                            width: kpiSnapshot.flowRevenueShare !== null ? `${Math.min(100, kpiSnapshot.flowRevenueShare)}%` : "0%",
                          }}
                        />
                      </div>
                      <span className="text-xs text-slate-600">
                        {kpiSnapshot.flowRevenueShare !== null ? `${kpiSnapshot.flowRevenueShare.toFixed(1)}%` : "Brak danych"}
                      </span>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-500">
                      {kpiSnapshot.flowRevenueShare !== null
                        ? kpiSnapshot.flowRevenueShare < 30
                          ? "System manualny (<30%)."
                          : kpiSnapshot.flowRevenueShare <= 50
                            ? "System średnio rozwinięty (30–50%)."
                            : "System dojrzały (50%+)."
                        : "Benchmark: <30% niski, 30–50% średni, 50%+ dojrzały."}
                    </div>
                  </div>
                </div>

                <div className="rounded-[22px] border border-white/70 bg-white/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.25)]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">KPI strategiczne (górna półka)</p>
                  <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg border border-white/70 bg-white/80 px-3 py-2">% przychodu sklepu z email: Brak danych</div>
                    <div className="rounded-lg border border-white/70 bg-white/80 px-3 py-2">Śr. LTV vs aktywność emailowa: Brak danych</div>
                    <div className="rounded-lg border border-white/70 bg-white/80 px-3 py-2">Czas od zapisu do zakupu: Brak danych</div>
                    <div className="rounded-lg border border-white/70 bg-white/80 px-3 py-2">% zakupów z flow vs kampanii: Brak danych</div>
                  </div>
                </div>

                <div className="rounded-[22px] border border-white/70 bg-white/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.25)]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Global Score Panel</p>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-700">
                    <div className="rounded-full border border-slate-200 bg-white/80 px-4 py-2">
                      Email System Health: —
                    </div>
                    <div className="rounded-full border border-slate-200 bg-white/80 px-4 py-2">
                      Business Impact Multiplier: —
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">
                    Global Score = (Deliverability 25% + Segment 20% + Flow 25% + Campaign 15% + Form 15%) × Multiplier.
                  </p>
                </div>

                {(() => {
                  const riskItems: Array<{ text: string; score: number }> = [];
                  const gapItems: Array<{ text: string; score: number }> = [];
                  const actionItems: Array<{ text: string; score: number }> = [];

                  const flowShare = kpiSnapshot.flowRevenueShare;
                  const totalRevenue = kpiSnapshot.totalRevenue;
                  const top3Share = totalRevenue > 0 ? kpiSnapshot.revenueTop3 / totalRevenue : null;
                  const top1Share =
                    totalRevenue > 0
                      ? (kpiSnapshot.campaignRevenueRows.map((row) => row.revenue ?? 0).sort((a, b) => b - a)[0] /
                          totalRevenue)
                      : null;
                  const topSegmentShare = kpiSnapshot.topSegmentShare;
                  const engaged30 = kpiSnapshot.engagementSeries[0]?.value ?? 0;
                  const engaged180 = kpiSnapshot.engagementSeries[2]?.value ?? 0;
                  const campaigns90 = (report.campaigns ?? []).filter((campaign) => campaign.sendTime).length;
                  const campaigns30 = (report.campaigns ?? []).filter((campaign) =>
                    campaign.sendTime ? (Date.now() - new Date(campaign.sendTime).getTime()) <= 30 * 86400000 : false,
                  ).length;
                  const hasFlow = (report.flows ?? []).length > 0;
                  const hasCampaigns = (report.campaigns ?? []).length > 0;
                  const inactiveExcluded =
                    report.campaignAudit && report.campaignAudit.metrics ? true : false;

                  const avgCampaignUnsub =
                    kpiSnapshot.avgCampaignUnsub.length > 0
                      ? kpiSnapshot.avgCampaignUnsub.reduce((acc, v) => acc + v, 0) / kpiSnapshot.avgCampaignUnsub.length
                      : null;
                  const avgCampaignSpam =
                    kpiSnapshot.avgCampaignSpam.length > 0
                      ? kpiSnapshot.avgCampaignSpam.reduce((acc, v) => acc + v, 0) / kpiSnapshot.avgCampaignSpam.length
                      : null;

                  if (flowShare !== null && flowShare < 25) {
                    riskItems.push({ text: "Flow revenue < 25% → system zależny od kampanii manualnych (niska stabilność).", score: 10 });
                    gapItems.push({ text: "Luka automatyzacyjna: kluczowe flow nie generują wystarczającego revenue.", score: 8 });
                    actionItems.push({ text: "Wdrożyć pełen pakiet flow (Welcome, Cart, Post Purchase, Winback).", score: 10 });
                    actionItems.push({ text: "Podnieść udział flow do min. 35–40% revenue.", score: 9 });
                  }

                  if (top3Share !== null && top3Share > 0.6) {
                    riskItems.push({ text: "≥60% revenue pochodzi z 1–3 kampanii → wysoka koncentracja przychodu.", score: 8 });
                    actionItems.push({ text: "Rozszerzyć liczbę kampanii tematycznych i segmentowych.", score: 7 });
                    actionItems.push({ text: "Wprowadzić stałe serie (produktowa, edukacyjna, społecznościowa).", score: 6 });
                  }
                  if (top1Share !== null && top1Share > 0.35) {
                    riskItems.push({ text: "Top 1 kampania > 35% revenue → ryzyko „one hit system”.", score: 7 });
                  }
                  if (topSegmentShare !== null && topSegmentShare >= 50) {
                    riskItems.push({ text: "≥50% revenue z jednego segmentu → uzależnienie od wąskiej grupy klientów.", score: 7 });
                    actionItems.push({ text: "Zbudować min. 4 warstwy: Engaged 30, Engaged 90, VIP, Reactivation.", score: 7 });
                  }
                  if (engaged30 > 0 && engaged180 > engaged30) {
                    riskItems.push({ text: "Engaged 30 maleje, a 180+ rośnie → baza się starzeje.", score: 7 });
                    actionItems.push({ text: "Wdrożyć system re-engagement.", score: 8 });
                    actionItems.push({ text: "Ograniczyć wysyłki do 180+.", score: 8 });
                  }
                  if (avgCampaignUnsub !== null && avgCampaignSpam !== null && kpiSnapshot.avgFlowUnsub !== null) {
                    if (avgCampaignUnsub > kpiSnapshot.avgFlowUnsub * 2 || avgCampaignSpam > (kpiSnapshot.avgFlowSpam ?? 0) * 2) {
                      riskItems.push({ text: "Kampanie mają wyższy unsub/spam niż flow → presja wysyłkowa.", score: 6 });
                    }
                  }
                  if (campaigns30 === 0 || campaigns90 === 0) {
                    riskItems.push({ text: "Brak kampanii w ostatnich 30–90 dniach → brak aktywnego systemu komunikacji.", score: 9 });
                    gapItems.push({ text: "Brak dywersyfikacji kampanii (cykl newsletter/sprzedaż/sezonowe).", score: 6 });
                    actionItems.push({ text: "Uruchomić minimalny plan komunikacji (min. 1 kampania tygodniowo).", score: 9 });
                    actionItems.push({ text: "Stworzyć miesięczny kalendarz tematyczny.", score: 7 });
                  }
                  if (!hasFlow && !hasCampaigns) {
                    riskItems.push({ text: "Brak flow i brak kampanii → kanał email nie jest wykorzystywany do sprzedaży.", score: 10 });
                  }

                  if (flowShare !== null && flowShare < 30) {
                    gapItems.push({ text: "Automation coverage <30% → luka skalowalności systemu.", score: 7 });
                  }

                  if (kpiSnapshot.efficiencyCampaign.clickRate !== null && kpiSnapshot.efficiencyCampaign.conversionRate !== null) {
                    if (kpiSnapshot.efficiencyCampaign.clickRate > 2 && kpiSnapshot.efficiencyCampaign.conversionRate < 0.5) {
                      gapItems.push({ text: "Click wysoki + conversion niski → luka w dopasowaniu oferty/UX.", score: 6 });
                      actionItems.push({ text: "Audyt landing pages + dopasowanie komunikatu.", score: 6 });
                    }
                    if (kpiSnapshot.efficiencyCampaign.clickRate < 1 && kpiSnapshot.efficiencyCampaign.conversionRate > 0.5) {
                      gapItems.push({ text: "Click niski + conversion wysoki → luka w copy i CTA.", score: 5 });
                    }
                  }

                  if (kpiSnapshot.campaignRevenueRows.length > 0) {
                    const hasSeasonal = (report.campaigns ?? []).some((campaign) =>
                      /(black\s*friday|swieta|holiday|valentine|walentynki|summer|lato|easter|new year|nowy rok)/i.test(
                        `${campaign.subject ?? ""} ${campaign.name ?? ""}`,
                      ),
                    );
                    if (!hasSeasonal) {
                      gapItems.push({ text: "Brak sezonowości → luka w kalendarzu sprzedażowym.", score: 4 });
                    }
                  }

                  const multiplierBase = 1;
                  let multiplier = multiplierBase;
                  if (top1Share !== null && top1Share > 0.4) multiplier -= 0.05;
                  if (top3Share !== null && top3Share > 0.7) multiplier -= 0.05;
                  if (topSegmentShare !== null && topSegmentShare > 50) multiplier -= 0.05;
                  if (flowShare !== null && flowShare < 30) multiplier -= 0.1;
                  if (flowShare !== null && flowShare > 50) multiplier += 0.05;
                  if (engaged30 > 0 && engaged180 > engaged30) multiplier -= 0.05;
                  if (report.activity?.inactive180plus !== undefined && report.activity.inactive180plus > 40) multiplier -= 0.05;
                  if (avgCampaignSpam !== null && avgCampaignSpam > 0.1) multiplier -= 0.05;
                  if (avgCampaignUnsub !== null && avgCampaignUnsub > 0.7) multiplier -= 0.05;
                  if (campaigns90 === 0) multiplier -= 0.1;
                  if (!hasFlow) multiplier -= 0.1;
                  multiplier = Math.max(0.7, Math.min(1.05, multiplier));

                  const orderedActions = actionItems
                    .sort((a, b) => b.score - a.score)
                    .map((item) => item.text)
                    .filter((value, idx, arr) => arr.indexOf(value) === idx)
                    .slice(0, 3);

                  const topRisks = riskItems
                    .sort((a, b) => b.score - a.score)
                    .map((item) => item.text)
                    .filter((value, idx, arr) => arr.indexOf(value) === idx)
                    .slice(0, 3);
                  const topGaps = gapItems
                    .sort((a, b) => b.score - a.score)
                    .map((item) => item.text)
                    .filter((value, idx, arr) => arr.indexOf(value) === idx)
                    .slice(0, 3);

                  const renderTile = (title: string, items: string[]) => (
                    <div className="rounded-[22px] border border-white/70 bg-white/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.25)]">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{title}</p>
                      <div className="mt-3 grid gap-1 text-xs text-slate-700">
                        {items.length > 0 ? items.map((item, idx) => <p key={`${title}-${idx}`}>{item}</p>) : <p className="text-slate-500">Brak sygnałów.</p>}
                      </div>
                    </div>
                  );

                  return (
                    <div className="grid gap-3 lg:grid-cols-3">
                      {renderTile("Ryzyko", topRisks)}
                      {renderTile("Luki", topGaps)}
                      {renderTile("Do wprowadzenia", orderedActions)}
                    </div>
                  );
                })()}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">Brak danych KPI.</p>
            )}
          </div>

          <div
            id="system-summary"
            className="mt-6 rounded-[28px] border border-white/50 bg-gradient-to-br from-[#cfd9ff] via-[#e3e9ff] to-[#f7f9ff] p-4 shadow-[0_30px_80px_-45px_rgba(63,74,219,0.45)] sm:p-5"
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-slate-900">Podsumowanie systemowe</h2>
            </div>
            <p className="text-sm text-slate-600">
              Warstwa 1: scoring i klasyfikacja. Warstwa 2: diagnoza systemowa i kierunek działań.
            </p>

            {(() => {
              if (!report) {
                const fallback = {
                  critical: [
                    "Brak aktywnej warstwy operacyjnej email (flow/kampanie/segmentacja) – ryzyko braku wpływu email na revenue.",
                  ],
                  growth: [
                    "Wdrożyć podstawowy system: engaged 30/60/90 + Welcome/Cart/Post/Winback + plan kampanii 1/tydz.",
                  ],
                  optimizations: ["Ustawić standardy design/UX (CTA/linki/alt/mobile)."],
                };
                return (
                  <>
                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      <div className="rounded-[22px] border border-white/70 bg-white/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.25)]">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Warstwa 1 – Scoring</p>
                        <div className="mt-3 grid gap-2 text-xs text-slate-700">
                          <div className="flex items-center justify-between">
                            <span>Global Score</span>
                            <span className="text-slate-500">—</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Business Impact Multiplier</span>
                            <span className="text-slate-500">—</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Typ systemu</span>
                            <span className="text-slate-500">—</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Confidence Level</span>
                            <span className="text-slate-500">—</span>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-[22px] border border-white/70 bg-white/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.25)]">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Warstwa 2 – Diagnoza systemowa</p>
                        <div className="mt-3 text-sm text-slate-700">
                          <p>
                            System wymaga uruchomienia podstawowych warstw operacyjnych (flow/kampanie/segmentacja).
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-3">
                      <div className="rounded-[22px] border border-white/70 bg-white/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.25)]">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Krytyczne</p>
                        <div className="mt-3 grid gap-1 text-xs text-slate-700">
                          {fallback.critical.map((item, idx) => <p key={`fallback-critical-${idx}`}>{item}</p>)}
                        </div>
                      </div>
                      <div className="rounded-[22px] border border-white/70 bg-white/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.25)]">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Wzrostowe</p>
                        <div className="mt-3 grid gap-1 text-xs text-slate-700">
                          {fallback.growth.map((item, idx) => <p key={`fallback-growth-${idx}`}>{item}</p>)}
                        </div>
                      </div>
                      <div className="rounded-[22px] border border-white/70 bg-white/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.25)]">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Optymalizacyjne</p>
                        <div className="mt-3 grid gap-1 text-xs text-slate-700">
                          {fallback.optimizations.map((item, idx) => <p key={`fallback-opt-${idx}`}>{item}</p>)}
                        </div>
                      </div>
                    </div>
                  </>
                );
              }

              const formScore = report.signupFormAudit?.assessment?.finalScore ?? listQualityScore?.score ?? null;

              const segmentScore = (() => {
                const segmentAudit = report.segmentAudit;
                if (!segmentAudit) return null;
                let score = 100;
                const engagedNames = segmentAudit.keySegmentsFound.engaged.map((name) => name.toLowerCase());
                const missingEngaged30 = !engagedNames.some((name) => /30/.test(name));
                const missingEngaged90 = !engagedNames.some((name) => /90/.test(name));
                const missingEngaged180 = !engagedNames.some((name) => /180/.test(name));
                if (missingEngaged30) score -= 15;
                if (missingEngaged90) score -= 10;
                if (missingEngaged180) score -= 10;
                if (segmentAudit.keySegmentsFound.vip.length === 0) score -= 10;
                if (segmentAudit.sizeHealth.zeroCount > 0) score -= 10;
                return clamp(score, 0, 100);
              })();

              const flowScore = (() => {
                const flows = report.flows ?? [];
                if (flows.length === 0) return 0;
                const names = flows.map((flow) => flow.name.toLowerCase());
                let score = 100;
                if (!names.some((name) => name.includes("welcome"))) score -= 15;
                if (!names.some((name) => name.includes("cart") || name.includes("abandon"))) score -= 15;
                if (!names.some((name) => name.includes("post"))) score -= 10;
                if (!names.some((name) => name.includes("winback") || name.includes("reactivation"))) score -= 10;
                return clamp(score, 0, 100);
              })();

              const campaignScore = (() => {
                if (!kpiSnapshot) return null;
                let score = 100;
                const avgUnsub =
                  kpiSnapshot.avgCampaignUnsub.length > 0
                    ? kpiSnapshot.avgCampaignUnsub.reduce((acc, v) => acc + v, 0) / kpiSnapshot.avgCampaignUnsub.length
                    : null;
                const avgSpam =
                  kpiSnapshot.avgCampaignSpam.length > 0
                    ? kpiSnapshot.avgCampaignSpam.reduce((acc, v) => acc + v, 0) / kpiSnapshot.avgCampaignSpam.length
                    : null;
                const totalRevenue = kpiSnapshot.totalRevenue;
                const top3Share = totalRevenue > 0 ? kpiSnapshot.revenueTop3 / totalRevenue : null;
                if (avgSpam !== null && avgSpam > 0.1) score -= 25;
                if (avgUnsub !== null && avgUnsub > 0.7) score -= 20;
                if (top3Share !== null && top3Share > 0.7) score -= 15;
                return clamp(score, 0, 100);
              })();

              const designScore = (() => {
                const values = Object.values(designAuditInputs);
                if (values.length === 0) return null;
                const scored = values.filter((value) => value === "yes" || value === "no");
                if (scored.length === 0) return null;
                const yesCount = scored.filter((value) => value === "yes").length;
                return clamp(Math.round((yesCount / scored.length) * 100), 0, 100);
              })();

              const sectionWeights = {
                form: 0.15,
                segment: 0.2,
                flow: 0.25,
                campaign: 0.25,
                design: 0.15,
              };
              const weightedSections = [
                { key: "form", score: formScore },
                { key: "segment", score: segmentScore },
                { key: "flow", score: flowScore },
                { key: "campaign", score: campaignScore },
                { key: "design", score: designScore },
              ];
              const availableWeight = weightedSections.reduce((sum, item) => sum + (item.score === null ? 0 : sectionWeights[item.key as keyof typeof sectionWeights]), 0);
              const weightedScore =
                availableWeight > 0
                  ? weightedSections.reduce((sum, item) => {
                      if (item.score === null) return sum;
                      return sum + item.score * (sectionWeights[item.key as keyof typeof sectionWeights] / availableWeight);
                    }, 0)
                  : null;

              let multiplier = 1.0;
              if (kpiSnapshot) {
                const totalRevenue = kpiSnapshot.totalRevenue;
                const top1Share =
                  totalRevenue > 0
                    ? (kpiSnapshot.campaignRevenueRows.map((row) => row.revenue ?? 0).sort((a, b) => b - a)[0] / totalRevenue)
                    : null;
                const top3Share = totalRevenue > 0 ? kpiSnapshot.revenueTop3 / totalRevenue : null;
                const topSegmentShare = kpiSnapshot.topSegmentShare;
                const flowShare = kpiSnapshot.flowRevenueShare;

                if (top1Share !== null && top1Share > 0.4) multiplier -= 0.05;
                if (top3Share !== null && top3Share > 0.7) multiplier -= 0.05;
                if (topSegmentShare !== null && topSegmentShare > 50) multiplier -= 0.05;
                if (flowShare !== null && flowShare < 30) multiplier -= 0.1;
                if (flowShare !== null && flowShare > 50) multiplier += 0.05;
                const engaged30 = report.activity?.active30 ?? 0;
                const inactive180 = report.activity?.inactive180plus ?? 0;
                if (engaged30 > 0 && inactive180 > engaged30) multiplier -= 0.05;
                if (inactive180 > 40) multiplier -= 0.05;
                const avgSpam =
                  kpiSnapshot.avgCampaignSpam.length > 0
                    ? kpiSnapshot.avgCampaignSpam.reduce((acc, v) => acc + v, 0) / kpiSnapshot.avgCampaignSpam.length
                    : null;
                const avgUnsub =
                  kpiSnapshot.avgCampaignUnsub.length > 0
                    ? kpiSnapshot.avgCampaignUnsub.reduce((acc, v) => acc + v, 0) / kpiSnapshot.avgCampaignUnsub.length
                    : null;
                if (avgSpam !== null && avgSpam > 0.1) multiplier -= 0.05;
                if (avgUnsub !== null && avgUnsub > 0.7) multiplier -= 0.05;
                if ((report.campaigns ?? []).length === 0) multiplier -= 0.1;
                if ((report.flows ?? []).length === 0) multiplier -= 0.1;
              }
              multiplier = Math.max(0.7, Math.min(1.05, multiplier));

              const globalScore = weightedScore !== null ? Number((weightedScore * multiplier).toFixed(1)) : null;

              const confidence =
                report.deliverability.days90.sent > 0 && report.campaignAudit?.metrics?.sampleMode === "90d"
                  ? "High"
                  : report.deliverability.days30.sent > 0
                    ? "Medium"
                    : "Low";

              const systemType = (() => {
                const avgSpam =
                  kpiSnapshot?.avgCampaignSpam.length
                    ? kpiSnapshot.avgCampaignSpam.reduce((acc, v) => acc + v, 0) / kpiSnapshot.avgCampaignSpam.length
                    : 0;
                const avgUnsub =
                  kpiSnapshot?.avgCampaignUnsub.length
                    ? kpiSnapshot.avgCampaignUnsub.reduce((acc, v) => acc + v, 0) / kpiSnapshot.avgCampaignUnsub.length
                    : 0;
                const inactive = report.activity?.inactive180plus ?? 0;
                if (avgSpam > 0.1 || avgUnsub > 0.7 || inactive > 40) return "Typ A – reputacyjnie zagrożony";
                if ((kpiSnapshot?.flowRevenueShare ?? 100) < 30) return "Typ C – niedoautomatyzowany";
                if ((kpiSnapshot?.revenueTop3 ?? 0) > 0 && kpiSnapshot?.totalRevenue && (kpiSnapshot.revenueTop3 / kpiSnapshot.totalRevenue) > 0.6) {
                  return "Typ B – system promocyjny";
                }
                return "Typ D – stabilny, ale niskoefektywny";
              })();

              const issues: Array<{
                category: "critical" | "growth" | "optimization";
                text: string;
                score: number;
                section: "deliverability" | "forms" | "segments" | "flow" | "campaigns" | "design" | "kpi";
                key: string;
              }> = [];
              const dedupeKeys = new Set<string>();
              const addFinding = (
                category: "critical" | "growth" | "optimization",
                text: string,
                section: "deliverability" | "forms" | "segments" | "flow" | "campaigns" | "design" | "kpi",
                key: string,
                score: number,
              ) => {
                const dedupeKey = `${category}:${key}`;
                if (dedupeKeys.has(dedupeKey)) return;
                dedupeKeys.add(dedupeKey);
                issues.push({ category, text, score, section, key });
              };

              const flows = report.flows ?? [];
              const hasFlow = flows.length > 0;
              const flowUnavailable = report.base.flowsAccess !== "ok";
              const flowNames = flows.map((flow) => flow.name.toLowerCase());
              const hasWelcome = flowNames.some((name) => name.includes("welcome"));
              const hasCart = flowNames.some((name) => name.includes("cart") || name.includes("abandon"));
              const hasPost = flowNames.some((name) => name.includes("post"));
              const hasWinback = flowNames.some((name) => name.includes("winback") || name.includes("reactivation"));
              const campaignsCount = (report.campaigns ?? []).length;
              const campaignsUnavailable = report.base.campaignsAccess !== "ok";

              const segmentAudit = report.segmentAudit;
              const engagedNames = segmentAudit?.keySegmentsFound.engaged.map((name) => name.toLowerCase()) ?? [];
              const hasEngaged30 = engagedNames.some((name) => /30/.test(name));
              const hasEngaged60 = engagedNames.some((name) => /60/.test(name));
              const hasEngaged90 = engagedNames.some((name) => /90/.test(name));
              const inactiveHigh =
                typeof report.activity?.inactive180plus === "number" &&
                typeof report.activity?.active30 === "number" &&
                report.activity.inactive180plus > report.activity.active30;

              const flowShare = kpiSnapshot?.flowRevenueShare ?? null;
              const totalRevenue = kpiSnapshot?.totalRevenue ?? 0;
              const top3Share = totalRevenue > 0 ? (kpiSnapshot?.revenueTop3 ?? 0) / totalRevenue : null;
              const topSegmentShare = kpiSnapshot?.topSegmentShare ?? null;
              const avgSpam =
                kpiSnapshot?.avgCampaignSpam.length
                  ? kpiSnapshot.avgCampaignSpam.reduce((acc, v) => acc + v, 0) / kpiSnapshot.avgCampaignSpam.length
                  : null;
              const avgUnsub =
                kpiSnapshot?.avgCampaignUnsub.length
                  ? kpiSnapshot.avgCampaignUnsub.reduce((acc, v) => acc + v, 0) / kpiSnapshot.avgCampaignUnsub.length
                  : null;

              // Deliverability
              if (deliverabilityDashboard?.lowData) {
                addFinding(
                  "growth",
                  "Mała próba deliverability → budować dane i unikać szerokich wysyłek.",
                  "deliverability",
                  "deliverability_low_data",
                  7,
                );
              }
              if (deliverabilityDashboard?.deliverabilityScore !== null && deliverabilityDashboard.deliverabilityScore < 60) {
                addFinding(
                  "critical",
                  "Deliverability score < 60 → podwyższone ryzyko reputacyjne.",
                  "deliverability",
                  "deliverability_low_score",
                  10,
                );
              }
              if (report.infrastructure) {
                const infraMissing = [report.infrastructure.spf_status, report.infrastructure.dkim_status, report.infrastructure.dmarc_status].some(
                  (value) => !value || value === "missing" || value === "unverified",
                );
                if (infraMissing) {
                  addFinding(
                    "critical",
                    "Brak pełnej weryfikacji SPF/DKIM/DMARC → ryzyko infrastrukturalne.",
                    "deliverability",
                    "infra_missing",
                    9,
                  );
                }
              }

              // Forms
              if (!report.signupFormAudit) {
                addFinding(
                  "growth",
                  "Brak danych o formularzach → zbudować podstawowy monitoring zapisu.",
                  "forms",
                  "forms_missing",
                  6,
                );
              }

              // Segments
              if (!hasEngaged30 || !hasEngaged60 || !hasEngaged90) {
                addFinding(
                  "growth",
                  "Brak warstw engaged 30/60/90 → brak kontroli cyklu życia.",
                  "segments",
                  "segments_engaged_layers",
                  8,
                );
              }
              if (inactiveHigh) {
                addFinding(
                  "critical",
                  "Rosnący 180+ → ryzyko starzenia bazy i presji wysyłkowej.",
                  "segments",
                  "segments_inactive_high",
                  9,
                );
              }
              if (segmentAudit && segmentAudit.sizeHealth?.unusedPercent > 50) {
                addFinding(
                  "growth",
                  "Wysoki % nieużywanych segmentów → luka operacyjna segmentacji.",
                  "segments",
                  "segments_unused",
                  6,
                );
              }

              // Flow
              if (!hasFlow || flowUnavailable) {
                addFinding(
                  "critical",
                  "Brak aktywnej warstwy flow → brak komunikacji automatycznej i skalowalnej retencji.",
                  "flow",
                  "flow_missing",
                  10,
                );
                addFinding(
                  "growth",
                  "Brak kluczowych flow (Welcome/Cart/Post/Winback) → luka automatyzacyjna.",
                  "flow",
                  "flow_core_missing",
                  9,
                );
              } else if (!hasWelcome || !hasCart || !hasPost || !hasWinback) {
                addFinding(
                  "growth",
                  "Niepełny zestaw kluczowych flow → ograniczona retencja.",
                  "flow",
                  "flow_incomplete",
                  7,
                );
              }

              // Campaigns
              if (campaignsCount === 0 || campaignsUnavailable) {
                addFinding(
                  "growth",
                  "Brak regularnych kampanii → uruchomić stały plan kampanii do engaged.",
                  "campaigns",
                  "campaigns_missing",
                  8,
                );
              }
              if (campaignsCount > 0 && campaignsUnavailable) {
                addFinding(
                  "growth",
                  "Brak danych targeting/metryk kampanii → podpiąć reporting/targeting.",
                  "campaigns",
                  "campaigns_targeting_missing",
                  6,
                );
              }
              if (avgUnsub !== null && avgSpam !== null && avgUnsub > 0.5 && avgSpam > 0.1) {
                addFinding(
                  "critical",
                  "Reputacja kampanii gorsza niż flow → presja wysyłkowa i brak wykluczeń.",
                  "campaigns",
                  "campaigns_reputation",
                  9,
                );
              }

              // Design
              if (designScore !== null && designScore < 60) {
                addFinding(
                  "optimization",
                  "Poprawić strukturę maila/CTA – wpływ na click.",
                  "design",
                  "design_cta",
                  5,
                );
              }

              // KPI multiplier
              if (multiplier < 0.9) {
                const reason =
                  top3Share && top3Share > 0.6
                    ? "koncentracja revenue"
                    : flowShare !== null && flowShare < 30
                      ? "niski udział flow"
                      : inactiveHigh
                        ? "rosnący 180+"
                        : "niższa stabilność systemu";
                addFinding(
                  "growth",
                  `System niestabilny (${reason}) → wymaga korekty architektury przychodów.`,
                  "kpi",
                  "kpi_multiplier",
                  6,
                );
              }

              const requiredSections: Array<typeof issues[number]["section"]> = [
                "deliverability",
                "forms",
                "segments",
                "flow",
                "campaigns",
                "design",
                "kpi",
              ];
              const ensureSectionFallback = (section: typeof issues[number]["section"], text: string) => {
                if (!issues.some((item) => item.section === section)) {
                  addFinding("growth", text, section, `fallback_${section}`, 1);
                }
              };

              ensureSectionFallback(
                "forms",
                "Brak stabilnego systemu pozyskiwania leadów lub brak danych o skuteczności formularzy. Ustal, czy baza rośnie organicznie i czy źródła zapisu są kontrolowane.",
              );
              ensureSectionFallback(
                "segments",
                "Brak jednoznacznej struktury segmentacyjnej. Wdroż system engaged 30/60/90/180 i segmenty wykluczające nieaktywnych.",
              );
              ensureSectionFallback(
                "flow",
                "Brak aktywnej warstwy automatyzacji. System opiera się na kampaniach, co ogranicza stabilność przychodu i retencję.",
              );
              ensureSectionFallback(
                "campaigns",
                "Brak regularnej aktywności kampanijnej lub brak danych o skuteczności. Ustal harmonogram wysyłek i podstawową strukturę targetowania.",
              );
              ensureSectionFallback(
                "deliverability",
                "Brak wystarczających danych do pełnej oceny reputacji wysyłkowej. Monitoruj spam, bounce i wolumen w horyzoncie 30–60 dni.",
              );
              ensureSectionFallback(
                "design",
                "Brak weryfikacji warstwy UX. Przeanalizuj strukturę maili pod kątem mobile, CTA i dostępności.",
              );
              ensureSectionFallback(
                "kpi",
                "Brak danych do oceny stabilności przychodu z email. Ustal udział flow vs kampanii i koncentrację revenue.",
              );

              const summaryBoxes = {
                critical: [] as string[],
                growth: [] as string[],
                optimizations: [] as string[],
              };

              const pickTop = (category: "critical" | "growth" | "optimization", limit: number) => {
                const selected: typeof issues = [];
                const byCategory = issues
                  .filter((item) => item.category === category)
                  .sort((a, b) => b.score - a.score);
                const usedSections = new Set<string>();
                for (const item of byCategory) {
                  if (!usedSections.has(item.section)) {
                    selected.push(item);
                    usedSections.add(item.section);
                  }
                  if (selected.length >= limit) break;
                }
                if (selected.length < limit) {
                  for (const item of byCategory) {
                    if (selected.includes(item)) continue;
                    selected.push(item);
                    if (selected.length >= limit) break;
                  }
                }
                return selected.map((item) => item.text);
              };

              summaryBoxes.critical = pickTop("critical", 2);
              summaryBoxes.growth = pickTop("growth", 2);
              summaryBoxes.optimizations = summaryBoxes.critical.length > 0 ? [] : pickTop("optimization", 2);

              const totalFindings =
                summaryBoxes.critical.length + summaryBoxes.growth.length + summaryBoxes.optimizations.length;
              if (totalFindings === 0) {
                summaryBoxes.critical = [
                  "Brak aktywnej warstwy operacyjnej email (flow/kampanie/segmentacja) – ryzyko braku wpływu email na revenue.",
                ];
                summaryBoxes.growth = [
                  "Wdrożyć podstawowy system: engaged 30/60/90 + Welcome/Cart/Post/Winback + plan kampanii 1/tydz.",
                ];
                summaryBoxes.optimizations = [
                  "Ustawić standardy design/UX (CTA/linki/alt/mobile).",
                ];
              }

              const renderTile = (title: string, items: string[]) => (
                <div className="rounded-[22px] border border-white/70 bg-white/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.25)]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{title}</p>
                  <div className="mt-3 grid gap-1 text-xs text-slate-700">
                    {items.length > 0 ? items.map((item, idx) => <p key={`${title}-${idx}`}>{item}</p>) : <p className="text-slate-500">Brak sygnałów.</p>}
                  </div>
                </div>
              );

              return (
                <>
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-[22px] border border-white/70 bg-white/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.25)]">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Warstwa 1 – Scoring</p>
                      <div className="mt-3 grid gap-2 text-xs text-slate-700">
                        <div className="flex items-center justify-between">
                          <span>Global Score</span>
                          <span className="text-slate-500">{globalScore !== null ? globalScore.toFixed(1) : "—"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Business Impact Multiplier</span>
                          <span className="text-slate-500">{multiplier.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Typ systemu</span>
                          <span className="text-slate-500">{systemType}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Confidence Level</span>
                          <span className="text-slate-500">{confidence}</span>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-[22px] border border-white/70 bg-white/70 p-4 shadow-[0_18px_45px_-30px_rgba(63,74,219,0.25)]">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Warstwa 2 – Diagnoza systemowa</p>
                      <div className="mt-3 text-sm text-slate-700">
                        <p>
                          {systemType}. Priorytet: {summaryBoxes.critical[0] ?? summaryBoxes.growth[0] ?? "Stabilizacja systemu i poprawa segmentacji."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 lg:grid-cols-3">
                    {renderTile("Krytyczne", summaryBoxes.critical)}
                    {renderTile("Wzrostowe", summaryBoxes.growth)}
                    {renderTile("Optymalizacyjne", summaryBoxes.optimizations)}
                  </div>
                </>
              );
            })()}
          </div>

          <div
            id="audit-reports"
            className="mt-6 rounded-[28px] border border-white/50 bg-gradient-to-br from-[#cfd9ff] via-[#e3e9ff] to-[#f7f9ff] p-4 shadow-[0_30px_80px_-45px_rgba(63,74,219,0.45)] sm:p-5"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Raporty 30 dni</h2>
                <p className="text-sm text-slate-600">Wewnętrzny dokument roboczy – edytuj i eksportuj po dopracowaniu.</p>
              </div>
              <button
                type="button"
                onClick={() => void createAuditReport()}
                className="rounded-full bg-[#3F4ADB] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#323bd6]"
              >
                Utwórz nowy raport
              </button>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
              <div className="rounded-[22px] border border-white/70 bg-white/70 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Historia raportów</p>
                <div className="mt-3 space-y-2 text-xs text-slate-700">
                  {reportsLoading ? (
                    <p className="text-slate-500">Ładowanie...</p>
                  ) : reports.length > 0 ? (
                    reports.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => void openAuditReport(item.id)}
                        className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition ${
                          selectedReport?.id === item.id
                            ? "border-[#3F4ADB] bg-white"
                            : "border-white/70 bg-white/80 hover:bg-white"
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-slate-800">{item.title ?? "Plan 30 dni"}</p>
                          <p className="text-[11px] text-slate-500">v{item.version} · {item.status}</p>
                        </div>
                        <span className="text-[11px] text-slate-500">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="text-slate-500">Brak raportów. Utwórz pierwszy plan 30 dni.</p>
                  )}
                </div>
              </div>

              <div className="rounded-[22px] border border-white/70 bg-white/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Edytor raportu</p>
                    <p className="text-sm text-slate-600">
                      {selectedReport ? selectedReport.title : "Wybierz raport z listy lub utwórz nowy."}
                    </p>
                  </div>
                  {selectedReport && (
                    <div className="flex flex-wrap gap-2">
                      <select
                        value={reportStatus}
                        onChange={(event) => setReportStatus(event.target.value as "draft" | "final")}
                        className="rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-600"
                      >
                        <option value="draft">Draft</option>
                        <option value="final">Final</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => void saveAuditReport()}
                        className="rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-600"
                      >
                        Zapisz
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!selectedReport) return;
                          window.open(`/api/clients/audit-reports/${selectedReport.id}/export`, "_blank");
                        }}
                        className="rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-600"
                      >
                        Eksport PDF
                      </button>
                    </div>
                  )}
                </div>

                {selectedReport && reportContent ? (
                  <div className="mt-4 space-y-4">
                    {reportContent.sections.map((section) => (
                      <div key={section.id} className="rounded-xl border border-white/70 bg-white/80 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{section.title}</p>
                        <div
                          className="prose prose-sm mt-2 max-w-none text-slate-700"
                          contentEditable
                          suppressContentEditableWarning
                          onInput={(event) =>
                            updateReportSection(section.id, (event.target as HTMLDivElement).innerHTML)
                          }
                          dangerouslySetInnerHTML={{ __html: section.body }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">Brak wybranego raportu.</p>
                )}
              </div>
            </div>
          </div>

        </>
      )}
    </section>
  );
}

export function KlaviyoListAuditGuideWrapper() {
  const searchParams = useSearchParams();
  const queryClientId = searchParams.get("clientId") ?? "";
  const queryClientName = searchParams.get("clientName") ?? "";
  const queryClientEmail = searchParams.get("clientEmail") ?? "";
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50">Ładowanie audytu list...</div>}>
      <KlaviyoListAuditGuideContent
        queryClientId={queryClientId}
        queryClientName={queryClientName}
        queryClientEmail={queryClientEmail}
      />
    </Suspense>
  );
}

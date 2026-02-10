type DomainAuthStatus = "ok" | "warning" | "critical" | "unknown";

export type DomainCheckResult = {
  spf_status: DomainAuthStatus;
  dkim_status: DomainAuthStatus;
  dmarc_status: DomainAuthStatus;
  alignment_status: DomainAuthStatus;
  status: "ok" | "warning" | "critical";
  matchedDomain: string | null;
  raw: {
    spf?: string | null;
    dkim?: string | null;
    dmarc?: string | null;
    alignment?: string | null;
  };
};

type DomainCheckOptions = {
  clientId?: string;
  apiKey?: string;
  revision?: string;
};

const KLAVIYO_API_BASE_URL = "https://a.klaviyo.com/api";
const DEFAULT_REVISION = "2024-10-15";

const normalizeStatus = (value: string | null | undefined): DomainAuthStatus => {
  if (!value) return "unknown";
  const normalized = value.toLowerCase();

  if (normalized.includes("verified") || normalized.includes("valid") || normalized.includes("pass") || normalized.includes("active")) {
    return "ok";
  }
  if (normalized.includes("pending") || normalized.includes("unknown") || normalized.includes("partial")) {
    return "warning";
  }
  if (
    normalized.includes("fail") ||
    normalized.includes("invalid") ||
    normalized.includes("missing") ||
    normalized.includes("unverified") ||
    normalized.includes("not")
  ) {
    return "critical";
  }

  return "warning";
};

const computeOverallStatus = (statuses: DomainAuthStatus[]): "ok" | "warning" | "critical" => {
  if (statuses.some((status) => status === "critical")) return "critical";
  if (statuses.some((status) => status === "warning" || status === "unknown")) return "warning";
  return "ok";
};

const candidateMatch = (candidate: string, domain: string) => {
  const normalizedCandidate = candidate.toLowerCase();
  const normalizedDomain = domain.toLowerCase();
  return (
    normalizedCandidate === normalizedDomain ||
    normalizedCandidate.endsWith(`.${normalizedDomain}`) ||
    normalizedDomain.endsWith(`.${normalizedCandidate}`)
  );
};

export const checkSenderDomain = async (
  senderDomain: string,
  options: DomainCheckOptions = {},
): Promise<DomainCheckResult> => {
  if (!senderDomain || senderDomain.trim().length === 0) {
    throw new Error("Sender domain is required");
  }

  const apiKey = options.apiKey ?? process.env.KLAVIYO_API_KEY;
  if (!apiKey) {
    throw new Error("Missing Klaviyo API key");
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Klaviyo-API-Key ${apiKey}`,
    revision: options.revision ?? DEFAULT_REVISION,
  };

  if (options.clientId) {
    headers["X-Client-Id"] = options.clientId;
  }

  const response = await fetch(`${KLAVIYO_API_BASE_URL}/domains`, { headers });
  if (!response.ok) {
    throw new Error(`Klaviyo domains fetch failed: ${response.status}`);
  }

  const body = (await response.json().catch(() => ({}))) as { data?: Array<{ attributes?: Record<string, unknown> }> };
  const rows = Array.isArray(body.data) ? body.data : [];

  const matched = rows.find((row) => {
    const attrs = row.attributes ?? {};
    const candidates = [
      attrs.domain,
      attrs.sending_domain,
      attrs.dkim_domain,
      attrs.tracking_domain,
      attrs.name,
    ]
      .filter((value) => typeof value === "string" && value.length > 0)
      .map((value) => String(value));

    return candidates.some((candidate) => candidateMatch(candidate, senderDomain));
  });

  const attrs = matched?.attributes ?? {};
  const spfRaw = typeof attrs.spf_status === "string" ? attrs.spf_status : null;
  const dkimRaw = typeof attrs.dkim_status === "string" ? attrs.dkim_status : null;
  const dmarcRaw = typeof attrs.dmarc_status === "string" ? attrs.dmarc_status : null;
  const alignmentRaw = typeof attrs.alignment_status === "string" ? attrs.alignment_status : null;

  const spf = normalizeStatus(spfRaw);
  const dkim = normalizeStatus(dkimRaw);
  const dmarc = normalizeStatus(dmarcRaw);
  const alignment = normalizeStatus(alignmentRaw);
  const status = computeOverallStatus([spf, dkim, dmarc, alignment]);

  return {
    spf_status: spf,
    dkim_status: dkim,
    dmarc_status: dmarc,
    alignment_status: alignment,
    status,
    matchedDomain: matched ? (attrs.domain as string | null) ?? null : null,
    raw: {
      spf: spfRaw,
      dkim: dkimRaw,
      dmarc: dmarcRaw,
      alignment: alignmentRaw,
    },
  };
};

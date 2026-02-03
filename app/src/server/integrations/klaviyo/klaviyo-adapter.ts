export type KlaviyoInventoryItemPayload = {
  entityType: "ACCOUNT" | "FLOW" | "EMAIL" | "FORM";
  externalId: string;
  name: string;
  itemStatus?: "OK" | "GAP";
};

export class KlaviyoAdapterError extends Error {
  public readonly code: "failed_auth" | "partial_or_timeout";
  public readonly partialInventory: KlaviyoInventoryItemPayload[];

  constructor(
    code: "failed_auth" | "partial_or_timeout",
    message: string,
    partialInventory: KlaviyoInventoryItemPayload[] = [],
  ) {
    super(message);
    this.name = "KlaviyoAdapterError";
    this.code = code;
    this.partialInventory = partialInventory;
  }
}

export interface KlaviyoAdapterPort {
  fetchInventory(clientId: string): Promise<KlaviyoInventoryItemPayload[]>;
  fetchSegments(clientId: string): Promise<Array<{ externalId: string; name: string }>>;
}

const KLAVIYO_API_BASE_URL = "https://a.klaviyo.com/api";
const FETCH_TIMEOUT_MS = 12_000;

const withTimeout = async <T>(operation: (signal: AbortSignal) => Promise<T>) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    return await operation(controller.signal);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new KlaviyoAdapterError(
        "partial_or_timeout",
        "Klaviyo sync exceeded timeout threshold",
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

const toSafeString = (value: unknown, fallback: string) => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  return fallback;
};

const toInventoryItem = (
  entityType: KlaviyoInventoryItemPayload["entityType"],
  row: unknown,
  fallbackPrefix: string,
  index: number,
): KlaviyoInventoryItemPayload => {
  const source = (typeof row === "object" && row !== null ? row : {}) as {
    id?: unknown;
    attributes?: { name?: unknown };
    name?: unknown;
  };

  return {
    entityType,
    externalId: toSafeString(source.id, `${fallbackPrefix}-${index + 1}`),
    name: toSafeString(source.attributes?.name ?? source.name, `${entityType} ${index + 1}`),
    itemStatus: "OK",
  };
};

export class KlaviyoAdapter implements KlaviyoAdapterPort {
  private getHeaders(clientId: string) {
    const apiKey = process.env.KLAVIYO_API_KEY;

    if (!apiKey || apiKey.trim().length === 0) {
      throw new KlaviyoAdapterError(
        "failed_auth",
        "Missing Klaviyo API key",
      );
    }

    return {
      Accept: "application/json",
      Authorization: `Klaviyo-API-Key ${apiKey}`,
      revision: "2024-10-15",
      "Content-Type": "application/json",
      "X-Client-Id": clientId,
    };
  }

  async fetchInventory(clientId: string): Promise<KlaviyoInventoryItemPayload[]> {
    const headers = this.getHeaders(clientId);

    try {
      const [accounts, flows, messages, forms] = await Promise.all([
        withTimeout(async (signal) => {
          const response = await fetch(`${KLAVIYO_API_BASE_URL}/accounts`, {
            headers,
            signal,
          });
          return response;
        }),
        withTimeout(async (signal) => {
          const response = await fetch(`${KLAVIYO_API_BASE_URL}/flows`, {
            headers,
            signal,
          });
          return response;
        }),
        withTimeout(async (signal) => {
          const response = await fetch(`${KLAVIYO_API_BASE_URL}/messages`, {
            headers,
            signal,
          });
          return response;
        }),
        withTimeout(async (signal) => {
          const response = await fetch(`${KLAVIYO_API_BASE_URL}/forms`, {
            headers,
            signal,
          });
          return response;
        }),
      ]);

      const responses = [accounts, flows, messages, forms];
      const hasAuthFailure = responses.some(
        (response) => response.status === 401 || response.status === 403,
      );

      if (hasAuthFailure) {
        throw new KlaviyoAdapterError(
          "failed_auth",
          "Klaviyo API key is invalid or expired",
        );
      }

      const hasClientFailure = responses.some(
        (response) =>
          response.status >= 400 &&
          response.status < 500 &&
          response.status !== 401 &&
          response.status !== 403,
      );
      if (hasClientFailure) {
        throw new KlaviyoAdapterError(
          "partial_or_timeout",
          "Klaviyo API returned client error",
        );
      }

      const hasServerFailure = responses.some((response) => response.status >= 500);
      if (hasServerFailure) {
        throw new KlaviyoAdapterError(
          "partial_or_timeout",
          "Klaviyo API temporary failure",
        );
      }

      const parsedBodies = await Promise.all(
        responses.map(async (response) => {
          const parsed = (await response.json().catch(() => ({}))) as {
            data?: unknown[];
          };
          return Array.isArray(parsed.data) ? parsed.data : [];
        }),
      );
      const accountsBody = parsedBodies[0] ?? [];
      const flowsBody = parsedBodies[1] ?? [];
      const messagesBody = parsedBodies[2] ?? [];
      const formsBody = parsedBodies[3] ?? [];

      return [
        ...accountsBody.map((row, index) =>
          toInventoryItem("ACCOUNT", row, "account", index),
        ),
        ...flowsBody.map((row, index) => toInventoryItem("FLOW", row, "flow", index)),
        ...messagesBody.map((row, index) =>
          toInventoryItem("EMAIL", row, "email", index),
        ),
        ...formsBody.map((row, index) => toInventoryItem("FORM", row, "form", index)),
      ];
    } catch (error) {
      if (error instanceof KlaviyoAdapterError) {
        throw error;
      }

      throw new KlaviyoAdapterError(
        "partial_or_timeout",
        error instanceof Error ? error.message : "Unknown Klaviyo error",
      );
    }
  }

  async fetchSegments(clientId: string): Promise<Array<{ externalId: string; name: string }>> {
    const headers = this.getHeaders(clientId);

    try {
      const response = await withTimeout(async (signal) => {
        return await fetch(`${KLAVIYO_API_BASE_URL}/segments`, {
          headers,
          signal,
        });
      });

      if (response.status === 401 || response.status === 403) {
        throw new KlaviyoAdapterError(
          "failed_auth",
          "Klaviyo API key is invalid or expired",
        );
      }

      if (response.status >= 400) {
        throw new KlaviyoAdapterError(
          "partial_or_timeout",
          "Klaviyo segments endpoint returned an error",
        );
      }

      const parsed = (await response.json().catch(() => ({}))) as {
        data?: unknown[];
      };
      const rows = Array.isArray(parsed.data) ? parsed.data : [];

      return rows.map((row, index) => {
        const source = (typeof row === "object" && row !== null ? row : {}) as {
          id?: unknown;
          attributes?: { name?: unknown };
          name?: unknown;
        };

        return {
          externalId: toSafeString(source.id, `segment-${index + 1}`),
          name: toSafeString(source.attributes?.name ?? source.name, `Segment ${index + 1}`),
        };
      });
    } catch (error) {
      if (error instanceof KlaviyoAdapterError) {
        throw error;
      }

      throw new KlaviyoAdapterError(
        "partial_or_timeout",
        error instanceof Error ? error.message : "Unknown Klaviyo error",
      );
    }
  }
}

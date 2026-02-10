import { db } from "~/server/db";
import { decryptSecret, encryptSecret } from "~/server/security/secrets";

type ClientCredentials = {
  klaviyoPrivateApiKey?: string;
  klaviyoPublicApiKey?: string;
};

type CredentialPayload = {
  schema: "v1";
  keys: Record<string, string>;
};

const EVENT_NAME = "client.credentials.saved";
const ENTITY_TYPE = "client_credential";

export const loadClientCredentials = async (clientId: string): Promise<ClientCredentials> => {
  const latest = await db.auditLog.findFirst({
    where: {
      eventName: EVENT_NAME,
      entityType: ENTITY_TYPE,
      entityId: clientId,
    },
    orderBy: { createdAt: "desc" },
    select: { details: true },
  });

  const details = (latest?.details ?? {}) as Partial<CredentialPayload>;
  const encryptedKeys = details.keys ?? {};

  const read = (name: string) => {
    const encrypted = encryptedKeys[name];
    if (!encrypted || typeof encrypted !== "string") {
      return undefined;
    }
    try {
      return decryptSecret(encrypted);
    } catch {
      return undefined;
    }
  };

  return {
    klaviyoPrivateApiKey: read("klaviyoPrivateApiKey"),
    klaviyoPublicApiKey: read("klaviyoPublicApiKey"),
  };
};

export const saveClientCredentials = async (params: {
  clientId: string;
  actorId: string;
  requestId: string;
  credentials: ClientCredentials;
}) => {
  const current = await loadClientCredentials(params.clientId);
  const merged: ClientCredentials = {
    klaviyoPrivateApiKey:
      params.credentials.klaviyoPrivateApiKey ?? current.klaviyoPrivateApiKey,
    klaviyoPublicApiKey:
      params.credentials.klaviyoPublicApiKey ?? current.klaviyoPublicApiKey,
  };

  const encrypted: Record<string, string> = {};
  if (merged.klaviyoPrivateApiKey) {
    encrypted.klaviyoPrivateApiKey = encryptSecret(merged.klaviyoPrivateApiKey);
  }
  if (merged.klaviyoPublicApiKey) {
    encrypted.klaviyoPublicApiKey = encryptSecret(merged.klaviyoPublicApiKey);
  }

  await db.auditLog.create({
    data: {
      actorId: params.actorId,
      eventName: EVENT_NAME,
      requestId: params.requestId,
      entityType: ENTITY_TYPE,
      entityId: params.clientId,
      details: {
        schema: "v1",
        keys: encrypted,
      } satisfies CredentialPayload,
    },
  });
};


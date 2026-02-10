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

  // Check if actor exists in database, if not try to create them or set to null
  let actorIdToUse = params.actorId;
  try {
    const actorExists = await db.user.findUnique({
      where: { id: params.actorId },
      select: { id: true },
    });
    if (!actorExists) {
      // Try to create the user if they don't exist
      try {
        await db.user.upsert({
          where: { id: params.actorId },
          create: {
            id: params.actorId,
            name: "Developer",
            email: "dev@example.com",
          },
          update: {},
        });
      } catch {
        // If upsert fails, set actorId to null
        actorIdToUse = null;
      }
    }
  } catch {
    // If checking user fails, set actorId to null
    actorIdToUse = null;
  }

  await db.auditLog.create({
    data: {
      actorId: actorIdToUse,
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


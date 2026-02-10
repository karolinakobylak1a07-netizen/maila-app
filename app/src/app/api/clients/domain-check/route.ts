import { NextResponse } from "next/server";
import { getServerAuthSession } from "~/server/auth";
import { db } from "~/server/db";
import { loadClientCredentials } from "~/server/security/client-credentials";
import { checkSenderDomain } from "~/server/integrations/klaviyo/domain-check-engine";

type DomainCheckPayload = {
  senderDomain?: string;
  clientId?: string;
  klaviyoPrivateApiKey?: string;
};

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as DomainCheckPayload | null;
  const senderDomain = payload?.senderDomain?.trim().toLowerCase() ?? "";

  if (!senderDomain) {
    return NextResponse.json({ error: "Brak domeny nadawcy do weryfikacji." }, { status: 400 });
  }

  const session = await getServerAuthSession();
  const userId = session?.user?.id ?? process.env.DEV_AUTH_USER_ID ?? null;
  let apiKey = payload?.klaviyoPrivateApiKey?.trim() ?? "";
  let clientId = payload?.clientId?.trim() ?? "";

  if (!apiKey && (clientId || userId)) {
    if (!clientId && userId) {
      const activeContext = await db.clientUserContext.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        select: { clientId: true },
      });
      clientId = activeContext?.clientId ?? "";
    }

    if (clientId) {
      const credentials = await loadClientCredentials(clientId);
      apiKey = credentials.klaviyoPrivateApiKey ?? "";
    }
  }

  if (!apiKey) {
    return NextResponse.json(
      { error: "Brak zapisanego Klaviyo Private API Key dla aktywnego klienta." },
      { status: 400 },
    );
  }

  try {
    const result = await checkSenderDomain(senderDomain, { apiKey, clientId });
    return NextResponse.json({ domain: senderDomain, result }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Domain check failed",
        domain: senderDomain,
      },
      { status: 502 },
    );
  }
}

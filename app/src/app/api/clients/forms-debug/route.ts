import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

import { db } from "~/server/db";
import { getServerAuthSession } from "~/server/auth";
import { loadClientCredentials } from "~/server/security/client-credentials";

type DebugPayload = {
  eventType?: string;
  url?: string;
  data?: Record<string, unknown>;
  timestamp?: string;
};

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as DebugPayload | null;
  if (!payload?.eventType) {
    return NextResponse.json({ error: "Brak eventType." }, { status: 400 });
  }

  const session = await getServerAuthSession();
  const actorId = session?.user?.id ?? process.env.DEV_AUTH_USER_ID ?? "dev-local-session-user";

  const activeContext = await db.clientUserContext.findFirst({
    where: { userId: actorId },
    orderBy: { updatedAt: "desc" },
    select: { clientId: true },
  });

  if (payload.eventType === "form_raw_fetch") {
    const formId = typeof payload.data?.formId === "string" ? payload.data.formId : "";
    if (!formId) {
      return NextResponse.json({ error: "Brak formId." }, { status: 400 });
    }
    const clientId = activeContext?.clientId ?? null;
    if (!clientId) {
      return NextResponse.json({ error: "Brak aktywnego klienta." }, { status: 400 });
    }
    const credentials = await loadClientCredentials(clientId);
    const apiKey = credentials.klaviyoPrivateApiKey ?? "";
    if (!apiKey) {
      return NextResponse.json({ error: "Brak Klaviyo Private API Key." }, { status: 400 });
    }
    const response = await fetch(`https://a.klaviyo.com/api/forms/${formId}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Klaviyo-API-Key ${apiKey.trim()}`,
        revision: "2024-10-15",
      },
      cache: "no-store",
    });
    const body = await response.json().catch(() => null);
    await db.auditLog.create({
      data: {
        actorId,
        eventName: "client.forms.debug",
        requestId: randomUUID(),
        entityType: "klaviyo_forms_debug",
        entityId: clientId,
        details: JSON.parse(
          JSON.stringify({
            eventType: "form_raw_fetch",
            formId,
            status: response.status,
            body,
            timestamp: new Date().toISOString(),
          }),
        ),
      },
    });
    return NextResponse.json({ data: { ok: response.ok, status: response.status } }, { status: 200 });
  }

  await db.auditLog.create({
    data: {
      actorId,
      eventName: "client.forms.debug",
      requestId: randomUUID(),
      entityType: "klaviyo_forms_debug",
      entityId: activeContext?.clientId ?? "unknown-client",
      details: JSON.parse(
        JSON.stringify({
          eventType: payload.eventType,
          url: payload.url ?? "",
          timestamp: payload.timestamp ?? new Date().toISOString(),
          data: payload.data ?? {},
        }),
      ),
    },
  });

  return NextResponse.json({ data: { ok: true } }, { status: 200 });
}

export async function GET() {
  const session = await getServerAuthSession();
  const actorId = session?.user?.id ?? process.env.DEV_AUTH_USER_ID ?? "dev-local-session-user";

  const activeContext = await db.clientUserContext.findFirst({
    where: { userId: actorId },
    orderBy: { updatedAt: "desc" },
    select: { clientId: true },
  });

  const latest = await db.auditLog.findFirst({
    where: {
      eventName: "client.forms.debug",
      entityType: "klaviyo_forms_debug",
      entityId: activeContext?.clientId ?? "unknown-client",
    },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true, details: true },
  });

  if (!latest) {
    return NextResponse.json({ data: null }, { status: 200 });
  }

  return NextResponse.json(
    {
      data: {
        createdAt: latest.createdAt.toISOString(),
        details: latest.details,
      },
    },
    { status: 200 },
  );
}

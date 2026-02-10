import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

import { db } from "~/server/db";
import { getServerAuthSession } from "~/server/auth";

type OverridePayload = {
  campaignId?: string;
  data?: Record<string, unknown>;
};

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as OverridePayload | null;
  const campaignId = payload?.campaignId?.trim() ?? "";
  if (!campaignId) {
    return NextResponse.json({ error: "Brak campaignId." }, { status: 400 });
  }
  const session = await getServerAuthSession();
  const actorId = session?.user?.id ?? process.env.DEV_AUTH_USER_ID ?? "dev-local-session-user";

  const activeContext = await db.clientUserContext.findFirst({
    where: { userId: actorId },
    orderBy: { updatedAt: "desc" },
    select: { clientId: true },
  });
  const clientId = activeContext?.clientId ?? null;
  if (!clientId) {
    return NextResponse.json({ error: "Brak aktywnego klienta." }, { status: 400 });
  }

  await db.auditLog.create({
    data: {
      actorId,
      eventName: "client.campaigns.override",
      requestId: randomUUID(),
      entityType: "klaviyo_campaign_override",
      entityId: `${clientId}::${campaignId}`,
      details: JSON.parse(
        JSON.stringify({
          campaignId,
          data: payload?.data ?? {},
          updatedAt: new Date().toISOString(),
        }),
      ),
    },
  });

  return NextResponse.json({ data: { ok: true } }, { status: 200 });
}

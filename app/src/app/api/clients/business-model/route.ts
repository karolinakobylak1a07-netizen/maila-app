import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

import { getServerAuthSession } from "~/server/auth";
import { db } from "~/server/db";

type BusinessModelPayload = {
  businessModel?: "ecommerce" | "leadgen" | "b2b" | null;
};

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as BusinessModelPayload | null;

  const session = await getServerAuthSession();
  const userId = session?.user?.id ?? process.env.DEV_AUTH_USER_ID ?? null;
  if (!userId) {
    return NextResponse.json({ error: "Brak autoryzacji." }, { status: 401 });
  }

  const context = await db.clientUserContext.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { clientId: true },
  });

  if (!context?.clientId) {
    return NextResponse.json({ error: "Brak aktywnego klienta." }, { status: 400 });
  }

  const businessModel =
    payload?.businessModel === "ecommerce" || payload?.businessModel === "leadgen" || payload?.businessModel === "b2b"
      ? payload.businessModel
      : null;

  await db.auditLog.create({
    data: {
      id: randomUUID(),
      actorId: userId,
      eventName: "client.business-model.override",
      requestId: randomUUID(),
      entityType: "client_business_model",
      entityId: context.clientId,
      details: {
        clientId: context.clientId,
        businessModel,
      },
    },
  });

  return NextResponse.json({ data: { businessModel } }, { status: 200 });
}

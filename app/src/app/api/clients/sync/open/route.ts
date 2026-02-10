import { NextResponse } from "next/server";

import { db } from "~/server/db";
import { getServerAuthSession } from "~/server/auth";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | {
        clientId?: string;
      }
    | null;

  const clientId = payload?.clientId?.trim();
  if (!clientId) {
    return NextResponse.json({ error: "Brak clientId." }, { status: 400 });
  }

  const session = await getServerAuthSession();
  const userId = session?.user?.id ?? process.env.DEV_AUTH_USER_ID ?? "dev-local-session-user";
  const userEmail = session?.user?.email ?? process.env.DEV_AUTH_USER_EMAIL ?? "dev-local@example.com";
  const userName = session?.user?.name ?? process.env.DEV_AUTH_USER_NAME ?? "Local Developer";

  await db.user.upsert({
    where: { id: userId },
    update: {
      email: userEmail,
      name: userName,
      role: "OWNER",
    },
    create: {
      id: userId,
      email: userEmail,
      name: userName,
      role: "OWNER",
    },
  });

  await db.clientMembership.upsert({
    where: {
      clientId_userId: {
        clientId,
        userId,
      },
    },
    update: {
      canEdit: true,
    },
    create: {
      clientId,
      userId,
      canEdit: true,
    },
  });

  await db.clientUserContext.upsert({
    where: {
      userId_clientId: {
        userId,
        clientId,
      },
    },
    update: {
      lastViewPath: "/clients",
    },
    create: {
      userId,
      clientId,
      lastViewPath: "/clients",
    },
  });

  return NextResponse.json({ data: { ok: true } }, { status: 200 });
}


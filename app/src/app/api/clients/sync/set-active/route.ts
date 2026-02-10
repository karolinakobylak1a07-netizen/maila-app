import { NextResponse } from "next/server";

import { getServerAuthSession } from "~/server/auth";
import { db } from "~/server/db";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | { clientId?: string; lastViewPath?: string }
    | null;
  const clientId = payload?.clientId ?? "";
  const lastViewPath = payload?.lastViewPath ?? null;

  const session = await getServerAuthSession();
  const userId = session?.user?.id ?? process.env.DEV_AUTH_USER_ID ?? null;
  if (!userId || !clientId) {
    return NextResponse.json({ error: "Brak danych do ustawienia kontekstu." }, { status: 400 });
  }

  const context = await db.clientUserContext.upsert({
    where: {
      userId_clientId: {
        userId,
        clientId,
      },
    },
    update: {
      lastViewPath: typeof lastViewPath === "string" ? lastViewPath : null,
    },
    create: {
      userId,
      clientId,
      lastViewPath: typeof lastViewPath === "string" ? lastViewPath : null,
    },
  });

  return NextResponse.json({ data: context }, { status: 200 });
}

import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

import { db } from "~/server/db";
import { getServerAuthSession } from "~/server/auth";

const normalizeStoreDomain = (value: string) =>
  value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");

const readNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
};

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | {
        clientName?: string;
        storeDomain?: string;
        orders24h?: number | string;
        orders7d?: number | string;
        revenue24h?: number | string;
        revenue7d?: number | string;
        checkouts24h?: number | string;
        checkouts7d?: number | string;
      }
    | null;

  const clientName = payload?.clientName?.trim() ?? "";
  const storeDomain = normalizeStoreDomain(payload?.storeDomain ?? "");

  const orders24h = readNumber(payload?.orders24h);
  const orders7d = readNumber(payload?.orders7d);
  const revenue24h = readNumber(payload?.revenue24h);
  const revenue7d = readNumber(payload?.revenue7d);
  const checkouts24h = readNumber(payload?.checkouts24h);
  const checkouts7d = readNumber(payload?.checkouts7d);

  if (!clientName || !storeDomain) {
    return NextResponse.json(
      { error: "Wymagane: clientName i storeDomain." },
      { status: 400 },
    );
  }

  const hasAtLeastOneMetric = [
    orders24h,
    orders7d,
    revenue24h,
    revenue7d,
    checkouts24h,
    checkouts7d,
  ].some((value) => value !== null);
  if (!hasAtLeastOneMetric) {
    return NextResponse.json(
      { error: "Podaj co najmniej jedna metryke source-of-truth." },
      { status: 400 },
    );
  }

  const session = await getServerAuthSession();
  const actorId = session?.user?.id ?? process.env.DEV_AUTH_USER_ID ?? "dev-local-session-user";
  const actorEmail =
    session?.user?.email ??
    process.env.DEV_AUTH_USER_EMAIL ??
    "dev-local@example.com";
  const actorName =
    session?.user?.name ??
    process.env.DEV_AUTH_USER_NAME ??
    "Local Developer";

  await db.user.upsert({
    where: { id: actorId },
    update: {
      email: actorEmail,
      name: actorName,
      role: "OWNER",
    },
    create: {
      id: actorId,
      email: actorEmail,
      name: actorName,
      role: "OWNER",
    },
  });

  await db.auditLog.create({
    data: {
      actorId,
      eventName: "client.sync.source_import",
      requestId: randomUUID(),
      entityType: "client_sync_source_import",
      entityId: `${clientName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}::${storeDomain}`,
      details: {
        clientName,
        storeDomain,
        orders24h,
        orders7d,
        revenue24h,
        revenue7d,
        checkouts24h,
        checkouts7d,
        importedAt: new Date().toISOString(),
      },
    },
  });

  return NextResponse.json(
    {
      data: {
        status: "ok",
        message: "Import source-of-truth zapisany.",
      },
    },
    { status: 200 },
  );
}


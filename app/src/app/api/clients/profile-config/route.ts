import { NextResponse } from "next/server";
import { getServerAuthSession } from "~/server/auth";
import { db } from "~/server/db";

type ProfileConfigPayload = {
  ownerEmail?: string | null;
  internalEmails?: string[] | null;
  internalProfileFilter?: Record<string, unknown> | null;
  deviceMobileShare?: number | null;
};

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const normalizeEmailList = (values: string[] | null | undefined) => {
  if (!values || values.length === 0) return [];
  const unique = new Set<string>();
  for (const value of values) {
    if (!value || typeof value !== "string") continue;
    const normalized = normalizeEmail(value);
    if (normalized.length === 0) continue;
    unique.add(normalized);
  }
  return Array.from(unique);
};

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as ProfileConfigPayload | null;

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

  const ownerEmail = payload?.ownerEmail ? normalizeEmail(payload.ownerEmail) : null;
  const internalEmails = normalizeEmailList(payload?.internalEmails);
  const internalProfileFilter = payload?.internalProfileFilter ?? null;
  const deviceMobileShareRaw = payload?.deviceMobileShare;
  const deviceMobileShare =
    typeof deviceMobileShareRaw === "number" && Number.isFinite(deviceMobileShareRaw)
      ? Math.max(0, Math.min(100, deviceMobileShareRaw))
      : deviceMobileShareRaw === null
        ? null
        : undefined;
  const mergedInternalEmails = Array.from(new Set([...(ownerEmail ? [ownerEmail] : []), ...internalEmails]));

  const updated = await db.clientProfile.update({
    where: { id: context.clientId },
    data: {
      ownerEmail,
      internalEmails: mergedInternalEmails,
      internalProfileFilter: internalProfileFilter as unknown as undefined,
      ...(deviceMobileShare !== undefined ? { deviceMobileShare } : {}),
    },
    select: {
      id: true,
      ownerEmail: true,
      internalEmails: true,
      internalProfileFilter: true,
      deviceMobileShare: true,
    },
  });

  return NextResponse.json({ data: updated }, { status: 200 });
}

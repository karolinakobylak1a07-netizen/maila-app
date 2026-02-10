import { NextResponse } from "next/server";

import { getServerAuthSession } from "~/server/auth";
import { db } from "~/server/db";

export async function GET() {
  try {
    const session = await getServerAuthSession();
    const userId = session?.user?.id ?? process.env.DEV_AUTH_USER_ID ?? null;
    if (!userId) {
      return NextResponse.json({ data: null }, { status: 200 });
    }

    let context = null as
      | {
          client: {
            id: string;
            name: string;
            senderDomain?: string | null;
            ownerEmail?: string | null;
            internalEmails?: string[];
          };
        }
      | null;
    try {
      context = await db.clientUserContext.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              senderDomain: true,
              ownerEmail: true,
              internalEmails: true,
            },
          },
        },
      });
    } catch {
      context = await db.clientUserContext.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        include: {
          client: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    }

    if (!context?.client) {
      return NextResponse.json({ data: null }, { status: 200 });
    }

    const latestSyncLog = await db.auditLog.findFirst({
      where: {
        eventName: "client.sync.saved",
        entityType: "client_sync",
        entityId: context.client.id,
      },
      orderBy: { createdAt: "desc" },
      select: {
        details: true,
      },
    });

    const details = (latestSyncLog?.details ?? {}) as Record<string, unknown>;
    const clientEmail = typeof details.clientEmail === "string" ? details.clientEmail : null;

    return NextResponse.json(
      {
        data: {
          clientId: context.client.id,
          clientName: context.client.name,
          clientEmail,
          senderDomain: context.client.senderDomain ?? null,
          ownerEmail: context.client.ownerEmail ?? null,
          internalEmails: context.client.internalEmails ?? [],
          deviceMobileShare: context.client.deviceMobileShare ?? null,
        },
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ data: null }, { status: 200 });
  }
}

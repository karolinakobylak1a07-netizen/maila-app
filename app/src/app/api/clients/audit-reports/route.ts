import { NextResponse } from "next/server";
import { getServerAuthSession } from "~/server/auth";
import { db } from "~/server/db";

const ensureAuditReportsTable = async () => {
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS audit_reports (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'audit_30d_plan',
      status TEXT NOT NULL DEFAULT 'draft',
      version INTEGER NOT NULL DEFAULT 1,
      title TEXT,
      content JSONB NOT NULL,
      snapshot JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await db.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_audit_reports_client_created_at
    ON audit_reports (client_id, created_at DESC);
  `);
};

export async function GET(request: Request) {
  const session = await getServerAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");
  if (!clientId) {
    return NextResponse.json({ error: "clientId required" }, { status: 400 });
  }

  await ensureAuditReportsTable();
  const reports = await db.$queryRawUnsafe<
    Array<{
      id: string;
      title: string | null;
      status: string;
      version: number;
      created_at: Date;
      updated_at: Date;
    }>
  >(
    `SELECT id, title, status, version, created_at, updated_at
     FROM audit_reports
     WHERE client_id = $1
     ORDER BY created_at DESC`,
    clientId,
  );

  return NextResponse.json({
    reports: reports.map((report) => ({
      id: report.id,
      title: report.title,
      status: report.status,
      version: report.version,
      createdAt: report.created_at.toISOString(),
      updatedAt: report.updated_at.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { clientId?: string; title?: string; content?: unknown; snapshot?: unknown }
    | null;
  if (!body?.clientId || !body?.content) {
    return NextResponse.json({ error: "clientId and content required" }, { status: 400 });
  }

  await ensureAuditReportsTable();
  const [{ next_version }] = await db.$queryRawUnsafe<
    Array<{ next_version: number }>
  >(
    `SELECT COALESCE(MAX(version), 0) + 1 AS next_version
     FROM audit_reports WHERE client_id = $1`,
    body.clientId,
  );

  const id = crypto.randomUUID();
  const title = body.title ?? "Plan 30 dni";
  const status = "draft";
  const version = next_version ?? 1;

  await db.$executeRawUnsafe(
    `INSERT INTO audit_reports (id, client_id, type, status, version, title, content, snapshot)
     VALUES ($1, $2, 'audit_30d_plan', $3, $4, $5, $6::jsonb, $7::jsonb)`,
    id,
    body.clientId,
    status,
    version,
    title,
    JSON.stringify(body.content),
    JSON.stringify(body.snapshot ?? {}),
  );

  return NextResponse.json({
    report: {
      id,
      title,
      status,
      version,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  });
}

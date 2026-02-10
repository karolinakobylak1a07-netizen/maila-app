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
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await ensureAuditReportsTable();
  const [report] = await db.$queryRawUnsafe<
    Array<{
      id: string;
      title: string | null;
      status: string;
      version: number;
      content: unknown;
      snapshot: unknown;
      created_at: Date;
      updated_at: Date;
    }>
  >(
    `SELECT id, title, status, version, content, snapshot, created_at, updated_at
     FROM audit_reports WHERE id = $1 LIMIT 1`,
    id,
  );

  if (!report) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    report: {
      id: report.id,
      title: report.title,
      status: report.status,
      version: report.version,
      content: report.content,
      snapshot: report.snapshot,
      createdAt: report.created_at.toISOString(),
      updatedAt: report.updated_at.toISOString(),
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { title?: string; content?: unknown; status?: string }
    | null;
  if (!body?.content) {
    return NextResponse.json({ error: "content required" }, { status: 400 });
  }

  const { id } = await params;

  await ensureAuditReportsTable();
  await db.$executeRawUnsafe(
    `UPDATE audit_reports
     SET title = COALESCE($2, title),
         status = COALESCE($3, status),
         content = $4::jsonb,
         updated_at = NOW()
     WHERE id = $1`,
    id,
    body.title ?? null,
    body.status ?? null,
    JSON.stringify(body.content),
  );

  return NextResponse.json({ ok: true });
}

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

export async function GET(_request: Request, context: { params: { id: string } }) {
  const session = await getServerAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureAuditReportsTable();
  const [report] = await db.$queryRawUnsafe<
    Array<{ title: string | null; content: { sections?: Array<{ title: string; body: string }> } }>
  >(
    `SELECT title, content
     FROM audit_reports WHERE id = $1 LIMIT 1`,
    context.params.id,
  );

  if (!report) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const sections = report.content?.sections ?? [];
  const html = `<!doctype html>
    <html lang="pl">
      <head>
        <meta charset="utf-8" />
        <title>${report.title ?? "Plan 30 dni"}</title>
        <style>
          body { font-family: Inter, system-ui, sans-serif; padding: 40px; color: #0f172a; }
          h1 { font-size: 24px; margin-bottom: 8px; }
          h2 { font-size: 16px; margin-top: 24px; }
          p, li { font-size: 13px; line-height: 1.5; }
        </style>
      </head>
      <body>
        <h1>${report.title ?? "Plan 30 dni"}</h1>
        ${sections
          .map(
            (section) => `<h2>${section.title}</h2><div>${section.body ?? ""}</div>`,
          )
          .join("")}
      </body>
    </html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

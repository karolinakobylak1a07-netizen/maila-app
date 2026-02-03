import { NextResponse } from "next/server";

import { runDailySyncJob } from "~/server/jobs/daily-sync-job";
import { env } from "~/env";

const unauthorized = () =>
  NextResponse.json(
    { error: { code: "forbidden", message: "forbidden" } },
    { status: 403 },
  );

const misconfigured = () =>
  NextResponse.json(
    { error: { code: "cron_secret_missing", message: "cron_secret_missing" } },
    { status: 503 },
  );

export async function POST(request: Request) {
  const cronSecret = env.CRON_SHARED_SECRET;
  if (!cronSecret || cronSecret.trim().length === 0) {
    return misconfigured();
  }

  const headerSecret = request.headers.get("x-cron-secret");
  if (!headerSecret || headerSecret !== cronSecret) {
    return unauthorized();
  }

  const result = await runDailySyncJob();
  return NextResponse.json(result);
}

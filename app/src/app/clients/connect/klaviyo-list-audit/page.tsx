"use client";

import { Suspense } from "react";
import { KlaviyoListAuditGuide } from "./klaviyo-list-audit";

export const dynamic = 'force-dynamic';

function KlaviyoListAuditPageContent() {
  return (
    <main className="min-h-screen bg-slate-50">
      <KlaviyoListAuditGuide />
    </main>
  );
}

export default function KlaviyoListAuditPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50">Loading...</div>}>
      <KlaviyoListAuditPageContent />
    </Suspense>
  );
}

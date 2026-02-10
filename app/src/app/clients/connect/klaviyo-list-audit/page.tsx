"use client";

import { KlaviyoListAuditGuideWrapper } from "./klaviyo-list-audit";

export const dynamic = 'force-dynamic';

export default function KlaviyoListAuditPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <KlaviyoListAuditGuideWrapper />
    </main>
  );
}

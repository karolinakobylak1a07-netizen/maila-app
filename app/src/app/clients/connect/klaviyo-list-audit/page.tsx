"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// Import the audit component content
import { KlaviyoListAuditGuideContent } from "~/app/clients/connect/klaviyo-list-audit/klaviyo-list-audit";

export const dynamic = 'force-dynamic';

function ListAuditPageWrapper() {
  const searchParams = useSearchParams();
  const queryClientId = searchParams.get("clientId") ?? "";
  const queryClientName = searchParams.get("clientName") ?? "";
  const queryClientEmail = searchParams.get("clientEmail") ?? "";

  // Show loading state while client data is being prepared
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Mark as ready after a brief delay to ensure search params are loaded
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent mx-auto"></div>
          <p className="text-slate-600">Ładowanie audytu...</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50">Przygotowywanie audytu...</div>}>
      <KlaviyoListAuditGuideContent
        queryClientId={queryClientId}
        queryClientName={queryClientName}
        queryClientEmail={queryClientEmail}
      />
    </Suspense>
  );
}

export default function ListAuditPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <ListAuditPageWrapper />
    </main>
  );
}

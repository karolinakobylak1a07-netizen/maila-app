const randomRequestId = () =>
  `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const runManualSyncJob = async (
  payload: { clientId: string; actorId: string; role: "OWNER" | "STRATEGY" | "CONTENT" | "OPERATIONS" },
  analysisService?: {
    runSync: (
      actorId: string,
      role: "OWNER" | "STRATEGY" | "CONTENT" | "OPERATIONS",
      payload: { clientId: string; trigger: "MANUAL"; requestId: string },
    ) => Promise<unknown>;
  },
) => {
  const service =
    analysisService ??
    new (await import("../../features/analysis/server/analysis.service.ts"))
      .AnalysisService();

  return service.runSync(payload.actorId, payload.role, {
    clientId: payload.clientId,
    trigger: "MANUAL",
    requestId: randomRequestId(),
  });
};

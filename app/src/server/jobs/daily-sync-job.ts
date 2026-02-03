const randomRequestId = () =>
  `daily-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const runDailySyncJob = async (
  analysisService?: {
    runDailySyncForAllClients: (requestId: string) => Promise<unknown>;
  },
) => {
  const service =
    analysisService ??
    new (await import("../../features/analysis/server/analysis.service.ts"))
      .AnalysisService();

  return service.runDailySyncForAllClients(randomRequestId());
};

"use client";

type AIAchievementsReportCardProps = {
  loading: boolean;
  refreshing: boolean;
  exporting: boolean;
  error: string | null;
  requestId: string | null;
  report:
    | {
        reportData: {
          campaignsAnalyzed: number;
          recommendationsUpdated: number;
          avgPerformanceScore: number;
          avgFeedbackScore: number;
          insights: string[];
        };
        status: "ok" | "insufficient_data";
        exportLinks: { pdf: string; notion: string };
      }
    | null;
  exportTarget: "pdf" | "notion";
  onRefresh: () => void;
  onExportTargetChange: (target: "pdf" | "notion") => void;
  onExport: () => void;
};

export function AIAchievementsReportCard(props: AIAchievementsReportCardProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-slate-900">Raport postepu AI</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={props.onRefresh}
            disabled={props.refreshing}
            className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {props.refreshing ? "Odswiezanie..." : "Odswiez raport"}
          </button>
          <select
            value={props.exportTarget}
            onChange={(event) => props.onExportTargetChange(event.target.value as "pdf" | "notion")}
            className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700"
          >
            <option value="pdf">Eksport: PDF</option>
            <option value="notion">Eksport: Notion</option>
          </select>
          <button
            type="button"
            onClick={props.onExport}
            disabled={props.exporting}
            className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {props.exporting ? "Eksport..." : "Eksportuj raport"}
          </button>
        </div>
      </div>

      {props.requestId && <p className="mb-2 text-xs text-slate-500">Request ID: {props.requestId}</p>}
      {props.loading && <p className="text-sm text-slate-600">Ladowanie raportu AI...</p>}
      {props.error && <p className="text-sm text-red-700">{props.error}</p>}

      {!props.loading && !props.error && !props.report && (
        <p className="text-sm text-slate-600">Brak danych raportu postepu AI.</p>
      )}

      {!props.loading && !props.error && props.report && (
        <div className="space-y-2 text-sm text-slate-700">
          <p>
            Status: <span className="font-medium">{props.report.status}</span>
          </p>
          <p>Kampanie z feedbackiem: {props.report.reportData.campaignsAnalyzed}</p>
          <p>Zaktualizowane rekomendacje: {props.report.reportData.recommendationsUpdated}</p>
          <p>Sredni performance score: {props.report.reportData.avgPerformanceScore}</p>
          <p>Sredni feedback score: {props.report.reportData.avgFeedbackScore}</p>
          {props.report.reportData.insights.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-xs text-slate-600">
              {props.report.reportData.insights.map((insight, index) => (
                <li key={`${insight}-${index}`}>{insight}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

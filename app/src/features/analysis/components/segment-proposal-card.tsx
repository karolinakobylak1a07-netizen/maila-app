import type { SegmentProposal } from "../contracts/analysis.schema";

type SegmentProposalCardProps = {
  loading: boolean;
  generating: boolean;
  error: string | null;
  requestId: string | null;
  segmentProposal: SegmentProposal | null;
  onGenerate: () => void;
};

export function SegmentProposalCard(props: SegmentProposalCardProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-slate-900">Propozycja segmentacji odbiorcow</h2>
        <button
          type="button"
          onClick={props.onGenerate}
          disabled={props.generating}
          className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {props.generating ? "Generowanie..." : "Generuj segmentacje"}
        </button>
      </div>

      {props.requestId && <p className="mb-2 text-xs text-slate-500">Request ID: {props.requestId}</p>}
      {props.loading && <p className="text-sm text-slate-600">Ladowanie segmentacji...</p>}
      {props.error && <p className="text-sm text-red-700">{props.error}</p>}

      {!props.loading && !props.error && !props.segmentProposal && (
        <p className="text-sm text-slate-600">Brak wygenerowanej propozycji segmentacji.</p>
      )}

      {!props.loading && !props.error && props.segmentProposal && (
        <div className="space-y-2 text-sm text-slate-700">
          <p>
            Status: <span className="font-medium">{props.segmentProposal.status}</span>
          </p>
          <p>
            Wersja: <span className="font-medium">{props.segmentProposal.version}</span>
          </p>
          {props.segmentProposal.missingData.length > 0 && (
            <p className="text-amber-700">
              Brakujace dane: {props.segmentProposal.missingData.join(", ")}
            </p>
          )}
          {props.segmentProposal.segments.length > 0 ? (
            <ul className="space-y-2">
              {props.segmentProposal.segments.map((segment, index) => (
                <li key={`${segment.name}-${index}`} className="rounded border border-slate-200 p-2">
                  <p className="font-medium">{segment.name}</p>
                  <p>Cel: {segment.objective}</p>
                  <p>Kryteria: {segment.entryCriteria.join(" | ")}</p>
                  <p>Kampanie: {segment.campaignUseCase}</p>
                  <p>Flow: {segment.flowUseCase}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>Brak segmentow do pokazania.</p>
          )}
        </div>
      )}
    </section>
  );
}

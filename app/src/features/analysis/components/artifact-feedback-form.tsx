"use client";

import { useState } from "react";

type ArtifactFeedbackFormProps = {
  title: string;
  onSubmitFeedback: (payload: { rating: number; comment: string }) => Promise<void>;
  disabled?: boolean;
};

export function ArtifactFeedbackForm(props: ArtifactFeedbackFormProps) {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submitFeedback = async () => {
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      await props.onSubmitFeedback({ rating, comment: comment.trim() });
      setComment("");
      setSuccess("Feedback zapisany.");
    } catch {
      setError("Nie udalo sie zapisac feedbacku.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-3 rounded border border-slate-200 bg-slate-50 p-3">
      <p className="mb-2 text-xs font-medium text-slate-700">{props.title}</p>
      <div className="mb-2 flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            disabled={props.disabled || submitting}
            onClick={() => setRating(value)}
            className={`rounded-md border px-2 py-1 text-xs ${
              rating === value
                ? "border-sky-600 bg-sky-600 text-white"
                : "border-slate-300 bg-white text-slate-700"
            }`}
          >
            {value}
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="Komentarz (opcjonalnie)"
        disabled={props.disabled || submitting}
        maxLength={1000}
        className="mb-2 min-h-20 w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700"
      />
      <button
        type="button"
        onClick={submitFeedback}
        disabled={props.disabled || submitting}
        className="rounded-md bg-slate-800 px-2 py-1 text-xs font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {submitting ? "Zapisywanie..." : "Zapisz feedback"}
      </button>
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
      {success && <p className="mt-2 text-xs text-emerald-700">{success}</p>}
    </div>
  );
}

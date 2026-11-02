"use client";

import { useState } from "react";
import { todayKey } from "@/lib/dates";
import type { LogInput } from "@/lib/movies";
import { StarInput } from "./StarRating";
import { btnPrimary, btnSecondary, inputClass } from "../ui";

type Props = {
  initial?: LogInput;
  submitLabel: string;
  /* Extra reason to keep Save switched off, such as a missing title. */
  blocked?: boolean;
  onSubmit: (values: LogInput) => Promise<void>;
  onCancel?: () => void;
};

/* Rating, watched date and your own opinion. Used for new viewings and for editing one. */
export function MovieLogForm({ initial, submitLabel, blocked = false, onSubmit, onCancel }: Props) {
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [watchedDate, setWatchedDate] = useState(() => initial?.watchedDate ?? todayKey());
  const [opinion, setOpinion] = useState(initial?.opinion ?? "");
  const [maxDate] = useState(() => todayKey());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = !saving && !blocked && rating > 0 && watchedDate !== "";

  async function submit() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({ rating, opinion, watchedDate });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save. Please try again.");
      setSaving(false);
    }
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <div>
        <p className="mb-2 text-sm font-medium text-sand-600 dark:text-sand-400">Your rating</p>
        <StarInput value={rating} onChange={setRating} />
      </div>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-sand-600 dark:text-sand-400">Date watched</span>
        <input
          type="date"
          value={watchedDate}
          max={maxDate}
          onChange={(event) => setWatchedDate(event.target.value)}
          className={`${inputClass} sm:w-56`}
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-sand-600 dark:text-sand-400">
          What did you think? (optional)
        </span>
        <textarea
          value={opinion}
          onChange={(event) => setOpinion(event.target.value)}
          rows={5}
          placeholder="Your own words about it"
          className={`${inputClass} resize-y`}
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" className={btnPrimary} disabled={!canSave}>
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" className={btnSecondary} onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

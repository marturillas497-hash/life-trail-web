"use client";

import { useState, type ChangeEvent } from "react";
import { parseBackup, summarize, type BackupFile } from "@/lib/backup/format";
import { useJournalInfo } from "@/lib/backup/hooks";
import { replaceJournal } from "@/lib/backup/snapshots";
import { formatDateTime, formatShortDate } from "@/lib/dates";
import { ConfirmDialog } from "../ConfirmDialog";
import { btnPrimary, btnSecondary, cardClass } from "../ui";

const MAX_FILE_BYTES = 200 * 1024 * 1024;

export function RestoreFileCard({ onRestored }: { onRestored: (message: string) => void }) {
  const info = useJournalInfo();
  const [loaded, setLoaded] = useState<{ name: string; backup: BackupFile } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [inputKey, setInputKey] = useState(0);

  async function onPick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setError(null);
    setLoaded(null);
    if (!file) return;
    try {
      if (file.size > MAX_FILE_BYTES) throw new Error("That file is too large to be a backup.");
      setLoaded({ name: file.name, backup: parseBackup(await file.text()) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that file.");
    }
  }

  function reset() {
    setLoaded(null);
    setError(null);
    setInputKey((key) => key + 1);
  }

  async function confirmRestore() {
    if (!loaded) return;
    setConfirming(false);
    setBusy(true);
    try {
      await replaceJournal(loaded.backup);
      const { entryCount, tagCount } = summarize(loaded.backup);
      onRestored(
        `Restored ${entryCount} ${entryCount === 1 ? "entry" : "entries"} and ${tagCount} tags from ${loaded.name}. Your journal before the restore was saved as a snapshot, so you can undo this.`,
      );
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not restore from that file.");
    } finally {
      setBusy(false);
    }
  }

  const summary = loaded ? summarize(loaded.backup) : null;
  const currentCount = info?.entryCount ?? 0;

  return (
    <section className={cardClass}>
      <h2 className="font-semibold">Restore from a backup file</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Choose a backup file you downloaded, or one from your backup folder. You will see what is
        inside before anything changes.
      </p>

      <input
        key={inputKey}
        type="file"
        accept=".json,application/json"
        onChange={(event) => void onPick(event)}
        className="mt-4 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-zinc-200 dark:file:bg-zinc-800 dark:hover:file:bg-zinc-700"
      />

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {loaded && summary && (
        <div className="mt-4 rounded-lg bg-zinc-50 p-4 text-sm dark:bg-zinc-900">
          <p className="font-medium">{loaded.name}</p>
          <ul className="mt-2 space-y-1 text-zinc-600 dark:text-zinc-300">
            <li>Saved on {formatDateTime(loaded.backup.exportedAt)}</li>
            <li>
              {summary.entryCount} {summary.entryCount === 1 ? "entry" : "entries"},{" "}
              {summary.tagCount} tags
            </li>
            {summary.movieLogCount > 0 && (
              <li>
                {summary.movieCount} {summary.movieCount === 1 ? "movie" : "movies"} with{" "}
                {summary.movieLogCount} {summary.movieLogCount === 1 ? "log" : "logs"}
              </li>
            )}
            {summary.firstDate && summary.lastDate && (
              <li>
                Entries from {formatShortDate(summary.firstDate)} to{" "}
                {formatShortDate(summary.lastDate)}
              </li>
            )}
            <li>Your journal right now has {currentCount} entries</li>
          </ul>

          {summary.entryCount < currentCount && (
            <p className="mt-3 text-amber-700 dark:text-amber-300">
              This backup has fewer entries than your journal has now. Restoring it will remove the
              newer ones (they are kept in the snapshot saved before the restore).
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              className={btnPrimary}
              disabled={busy}
              onClick={() => setConfirming(true)}
            >
              Replace my journal with this backup
            </button>
            <button type="button" className={btnSecondary} onClick={reset}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirming}
        title="Replace your journal?"
        message="Everything in your journal now will be replaced by this backup. A snapshot of your current journal is saved first, so you can undo this."
        confirmLabel="Replace"
        onConfirm={() => void confirmRestore()}
        onCancel={() => setConfirming(false)}
      />
    </section>
  );
}

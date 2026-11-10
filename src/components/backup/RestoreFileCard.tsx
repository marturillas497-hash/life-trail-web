"use client";

import { useState, type ChangeEvent } from "react";
import { parseBackup, summarize, type BackupFile } from "@/lib/backup/format";
import { useJournalInfo } from "@/lib/backup/hooks";
import { isNoOp, mergeData, type MergePlan } from "@/lib/backup/merge";
import { readCurrentData, replaceJournal } from "@/lib/backup/snapshots";
import { formatDateTime, formatShortDate } from "@/lib/dates";
import { ConfirmDialog } from "../ConfirmDialog";
import { btnPrimary, btnSecondary, cardClass } from "../ui";

const MAX_FILE_BYTES = 200 * 1024 * 1024;

export function RestoreFileCard({ onRestored }: { onRestored: (message: string) => void }) {
  const info = useJournalInfo();
  const [loaded, setLoaded] = useState<{ name: string; backup: BackupFile } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<"merge" | "replace" | null>(null);
  const [plan, setPlan] = useState<MergePlan | null>(null);
  const [busy, setBusy] = useState(false);
  const [inputKey, setInputKey] = useState(0);

  async function onPick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setError(null);
    setLoaded(null);
    if (!file) return;
    try {
      if (file.size > MAX_FILE_BYTES) throw new Error("That file is too large to be a backup.");
      const backup = parseBackup(await file.text());
      setLoaded({ name: file.name, backup });
      /* The preview of a merge is worked out now, from the journal as it is. */
      setPlan(mergeData(await readCurrentData({ withImages: true }), backup).plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that file.");
    }
  }

  function reset() {
    setLoaded(null);
    setPlan(null);
    setError(null);
    setInputKey((key) => key + 1);
  }

  async function confirmRestore() {
    const mode = confirming;
    if (!loaded || !mode) return;
    setConfirming(null);
    setBusy(true);
    try {
      if (mode === "merge") {
        /* Worked out again from the journal as it is now, in case it changed since the preview. */
        const { merged, plan: done } = mergeData(await readCurrentData({ withImages: true }), loaded.backup);
        await replaceJournal(merged);
        const added = `${done.newEntries} ${done.newEntries === 1 ? "entry" : "entries"}`;
        const updated = done.updatedEntries > 0 ? `, updated ${done.updatedEntries}` : "";
        onRestored(
          `Merged ${loaded.name}: added ${added}${updated}. Your journal before the merge was saved as a snapshot, so you can undo this.`,
        );
      } else {
        await replaceJournal(loaded.backup);
        const { entryCount, tagCount, imageCount } = summarize(loaded.backup);
        onRestored(
          `Restored ${entryCount} ${entryCount === 1 ? "entry" : "entries"}, ${tagCount} tags${imageCount > 0 ? ` and ${imageCount} ${imageCount === 1 ? "picture" : "pictures"}` : ""} from ${loaded.name}. Your journal before the restore was saved as a snapshot, so you can undo this.`,
        );
      }
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not restore from that file.");
    } finally {
      setBusy(false);
    }
  }

  const summary = loaded ? summarize(loaded.backup) : null;
  const currentCount = info?.entryCount ?? 0;
  const hasJournal = currentCount + (info?.movieLogCount ?? 0) > 0;

  return (
    <section className={cardClass}>
      <h2 className="font-semibold">Restore from a backup file</h2>
      <p className="mt-1 text-sm text-sand-500">
        Choose a backup file you downloaded, or one from your backup folder. You will see what is
        inside before anything changes. You can merge it into your journal, or replace your journal
        with it.
      </p>

      <input
        key={inputKey}
        type="file"
        accept=".json,application/json"
        onChange={(event) => void onPick(event)}
        className="mt-4 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-sand-100 file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-sand-200 dark:file:bg-sand-800 dark:hover:file:bg-sand-700"
      />

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {loaded && summary && (
        <div className="mt-4 rounded-lg bg-sand-50 p-4 text-sm dark:bg-sand-900">
          <p className="font-medium">{loaded.name}</p>
          <ul className="mt-2 space-y-1 text-sand-600 dark:text-sand-300">
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

          {hasJournal && plan && (
            <div className="mt-4 border-t border-sand-200 pt-3 dark:border-sand-700">
              <p className="font-medium">If you merge</p>
              {isNoOp(plan) ? (
                <p className="mt-1 text-sand-600 dark:text-sand-300">
                  Everything in this backup is already in your journal.
                </p>
              ) : (
                <ul className="mt-1 space-y-1 text-sand-600 dark:text-sand-300">
                  <li>
                    {plan.newEntries} new {plan.newEntries === 1 ? "entry" : "entries"} added
                  </li>
                  {plan.updatedEntries > 0 && (
                    <li>
                      {plan.updatedEntries} {plan.updatedEntries === 1 ? "entry" : "entries"} updated, because
                      the backup has a newer edit
                    </li>
                  )}
                  {plan.newViewings > 0 && <li>{plan.newViewings} new movie or show viewings added</li>}
                  {plan.newTags > 0 && <li>{plan.newTags} new tags added</li>}
                  {plan.newPictures > 0 && <li>{plan.newPictures} new pictures added</li>}
                  <li>
                    {plan.unchangedEntries} {plan.unchangedEntries === 1 ? "entry is" : "entries are"} already here
                  </li>
                </ul>
              )}
              <p className="mt-1 text-sand-500">Nothing in your journal is removed by a merge.</p>
            </div>
          )}

          {summary.entryCount < currentCount && (
            <p className="mt-3 text-amber-700 dark:text-amber-300">
              This backup has fewer entries than your journal has now. Replacing your journal with it
              will remove the newer ones (they are kept in the snapshot saved before the restore).
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            {hasJournal && (
              <button
                type="button"
                className={btnPrimary}
                disabled={busy || !plan || isNoOp(plan)}
                onClick={() => setConfirming("merge")}
              >
                Merge into my journal
              </button>
            )}
            <button
              type="button"
              className={hasJournal ? btnSecondary : btnPrimary}
              disabled={busy}
              onClick={() => setConfirming("replace")}
            >
              {hasJournal ? "Replace my journal with this backup" : "Restore this backup"}
            </button>
            <button type="button" className={btnSecondary} onClick={reset}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirming === "replace"}
        title="Replace your journal?"
        message="Everything in your journal now will be replaced by this backup. A snapshot of your current journal is saved first, so you can undo this."
        confirmLabel="Replace"
        onConfirm={() => void confirmRestore()}
        onCancel={() => setConfirming(null)}
      />
      <ConfirmDialog
        open={confirming === "merge"}
        title="Merge this backup?"
        message="Entries, tags, pictures and viewings that are only in the backup are added. Nothing in your journal is removed. A snapshot of your journal is saved first, so you can undo this."
        confirmLabel="Merge"
        tone="default"
        onConfirm={() => void confirmRestore()}
        onCancel={() => setConfirming(null)}
      />
    </section>
  );
}

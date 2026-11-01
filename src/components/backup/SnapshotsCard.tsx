"use client";

import { useState } from "react";
import { useSnapshots, type SnapshotSummary } from "@/lib/backup/hooks";
import { restoreSnapshot } from "@/lib/backup/snapshots";
import { formatDateTime } from "@/lib/dates";
import { ConfirmDialog } from "../ConfirmDialog";
import { btnSecondary, cardClass } from "../ui";

const KIND_LABEL = {
  auto: "Automatic",
  manual: "Saved by you",
  "pre-restore": "Before a restore",
  "pre-upgrade": "Before an app update",
} as const;

export function SnapshotsCard({ onRestored }: { onRestored: (message: string) => void }) {
  const snapshots = useSnapshots();
  const [target, setTarget] = useState<SnapshotSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function confirmRestore() {
    if (!target) return;
    const chosen = target;
    setTarget(null);
    setError(null);
    try {
      await restoreSnapshot(chosen.id);
      onRestored(
        `Restored the snapshot from ${formatDateTime(chosen.createdAt)}. Your journal before the restore was saved as a snapshot, so you can undo this.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not restore that snapshot.");
    }
  }

  return (
    <section className={cardClass}>
      <h2 className="font-semibold">Snapshots in this browser</h2>
      <p className="mt-1 text-sm text-zinc-500">
        One is saved automatically each day you use the app (the last 7 days plus the last 4
        weeks are kept). They protect you from mistakes, like deleting an entry you wanted. They do
        not protect you if the browser&apos;s data is cleared, so keep backup files too.
      </p>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {snapshots === undefined ? (
        <p className="mt-4 text-sm text-zinc-500">Loading...</p>
      ) : snapshots.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">No snapshots yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-zinc-200 dark:divide-zinc-800">
          {snapshots.map((snapshot) => (
            <li key={snapshot.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{formatDateTime(snapshot.createdAt)}</div>
                <div className="text-xs text-zinc-500">
                  {KIND_LABEL[snapshot.kind]}, {snapshot.entryCount}{" "}
                  {snapshot.entryCount === 1 ? "entry" : "entries"}, {snapshot.tagCount} tags
                  {snapshot.movieLogCount ? `, ${snapshot.movieLogCount} movie ${snapshot.movieLogCount === 1 ? "log" : "logs"}` : ""}
                </div>
              </div>
              <button type="button" className={btnSecondary} onClick={() => setTarget(snapshot)}>
                Restore
              </button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={target !== null}
        title="Restore this snapshot?"
        message="Your current journal will be replaced by this snapshot. A snapshot of your current journal is saved first, so you can undo this."
        confirmLabel="Restore"
        onConfirm={() => void confirmRestore()}
        onCancel={() => setTarget(null)}
      />
    </section>
  );
}

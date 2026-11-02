"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { readImageStats, removeUnusedImages } from "@/lib/images";
import { ConfirmDialog } from "../ConfirmDialog";
import { btnSecondary, cardClass } from "../ui";

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImagesCard() {
  const stats = useLiveQuery(() => readImageStats(), []);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!stats || stats.count === 0) return null;

  async function clean() {
    setConfirming(false);
    const removed = await removeUnusedImages();
    setMessage(`Removed ${removed} ${removed === 1 ? "picture" : "pictures"}.`);
  }

  return (
    <section className={cardClass}>
      <h2 className="font-semibold">Pictures</h2>
      <p className="mt-1 text-sm text-sand-600 dark:text-sand-400">
        {stats.count} {stats.count === 1 ? "picture" : "pictures"} in your entries, {formatBytes(stats.bytes)} in total.
        Backup files include them. Automatic snapshots do not, so they stay small.
      </p>
      {stats.unusedCount > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <p className="text-sm">
            {stats.unusedCount} {stats.unusedCount === 1 ? "picture is" : "pictures are"} not used in any entry (
            {formatBytes(stats.unusedBytes)}).
          </p>
          <button type="button" className={btnSecondary} onClick={() => setConfirming(true)}>
            Remove unused
          </button>
        </div>
      )}
      <p role="status" className="mt-2 text-sm text-brand-700 dark:text-brand-300">
        {message}
      </p>
      <ConfirmDialog
        open={confirming}
        title="Remove unused pictures?"
        message="They are deleted from this browser. You can only get them back from a backup file that includes them."
        confirmLabel="Remove"
        onConfirm={() => void clean()}
        onCancel={() => setConfirming(false)}
      />
    </section>
  );
}

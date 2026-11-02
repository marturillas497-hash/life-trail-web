"use client";

import { useState } from "react";
import { canShareFiles, downloadBackup, shareBackup } from "@/lib/backup/files";
import { createSnapshot } from "@/lib/backup/snapshots";
import { btnPrimary, btnSecondary, cardClass } from "../ui";

export function ManualBackupCard() {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [canShare] = useState(() => canShareFiles());

  async function run(action: () => Promise<string | null>) {
    setBusy(true);
    setMessage(null);
    try {
      setMessage(await action());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={cardClass}>
      <h2 className="font-semibold">More ways to back up</h2>
      <p className="mt-1 text-sm text-sand-500">
        A backup file holds your whole journal. Keep a copy somewhere outside this browser, such
        as a cloud drive, an email to yourself, or a USB stick.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          className={btnPrimary}
          disabled={busy}
          onClick={() =>
            run(async () => {
              await downloadBackup();
              return "Backup file downloaded. Check your Downloads folder.";
            })
          }
        >
          Download backup file
        </button>

        {canShare && (
          <button
            type="button"
            className={btnSecondary}
            disabled={busy}
            onClick={() =>
              run(async () =>
                (await shareBackup()) ? "Backup shared." : null,
              )
            }
          >
            Share backup file
          </button>
        )}

        <button
          type="button"
          className={btnSecondary}
          disabled={busy}
          onClick={() =>
            run(async () =>
              (await createSnapshot("manual"))
                ? "Snapshot saved in this browser."
                : "Nothing to save yet. Write an entry or log a movie first.",
            )
          }
        >
          Save a snapshot
        </button>
      </div>

      {message && <p className="mt-3 text-sm text-sand-600 dark:text-sand-300">{message}</p>}
    </section>
  );
}

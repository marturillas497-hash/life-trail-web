"use client";

import { useState } from "react";
import {
  chooseBackupFolder,
  forgetBackupFolder,
  grantFolderAccess,
  runFolderBackup,
} from "@/lib/backup/files";
import { useFolderState, useSetting } from "@/lib/backup/hooks";
import { btnPrimary, btnSecondary, cardClass } from "../ui";

export function FolderBackupCard() {
  const { state, refresh } = useFolderState();
  const folder = useSetting<FileSystemDirectoryHandle>("folderHandle");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<string | null>) {
    setBusy(true);
    setMessage(null);
    try {
      setMessage(await action());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      refresh();
      setBusy(false);
    }
  }

  const pick = () =>
    run(async () => {
      const name = await chooseBackupFolder();
      if (!name) return null;
      await runFolderBackup(true);
      return `Backups will be saved to "${name}". The first backup file is already there.`;
    });

  return (
    <section className={cardClass}>
      <h2 className="font-semibold">Automatic backup to a folder</h2>

      {state === "unsupported" ? (
        <p className="mt-1 text-sm text-zinc-500">
          This browser cannot save to a folder by itself. It works in Chrome and Edge on a
          computer. On this device, use Download or Share above, and the reminder that appears
          when a backup is overdue.
        </p>
      ) : (
        <>
          <p className="mt-1 text-sm text-zinc-500">
            Pick a folder once. Life Trail then saves a dated backup file there every day you use
            it, and keeps the newest 30. Choosing a folder that syncs to OneDrive or Google Drive
            gives you a copy off this computer as well. Create a new folder for it, for example
            &quot;Life Trail Backups&quot;, because browsers refuse folders like Downloads itself.
          </p>

          {state === "checking" && <p className="mt-3 text-sm text-zinc-500">Checking...</p>}

          {state === "none" && (
            <div className="mt-4">
              <button type="button" className={btnPrimary} disabled={busy} onClick={pick}>
                Choose backup folder
              </button>
            </div>
          )}

          {(state === "ready" || state === "needs-permission") && (
            <div className="mt-4 space-y-3">
              <p className="text-sm">
                Folder: <strong>{folder?.value?.name ?? "(unknown)"}</strong>{" "}
                <span className={state === "ready" ? "text-green-600" : "text-amber-600"}>
                  {state === "ready" ? "Ready" : "Needs permission"}
                </span>
              </p>
              <div className="flex flex-wrap gap-3">
                {state === "needs-permission" && (
                  <button
                    type="button"
                    className={btnPrimary}
                    disabled={busy}
                    onClick={() =>
                      run(async () => {
                        const granted = await grantFolderAccess();
                        if (!granted) return "Access was not allowed.";
                        await runFolderBackup(true);
                        return "Access allowed and a backup was saved.";
                      })
                    }
                  >
                    Allow access
                  </button>
                )}
                {state === "ready" && (
                  <button
                    type="button"
                    className={btnSecondary}
                    disabled={busy}
                    onClick={() =>
                      run(async () => {
                        await runFolderBackup(true);
                        return "Backup saved to the folder.";
                      })
                    }
                  >
                    Back up to folder now
                  </button>
                )}
                <button type="button" className={btnSecondary} disabled={busy} onClick={pick}>
                  Change folder
                </button>
                <button
                  type="button"
                  className={btnSecondary}
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      await forgetBackupFolder();
                      return "Automatic folder backups are off. Existing files were left alone.";
                    })
                  }
                >
                  Turn off
                </button>
              </div>
              {state === "needs-permission" && (
                <p className="text-xs text-zinc-500">
                  Browsers sometimes ask again when you come back to the app. This is normal, and
                  one click on Allow is enough.
                </p>
              )}
            </div>
          )}
        </>
      )}

      {message && <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">{message}</p>}
    </section>
  );
}

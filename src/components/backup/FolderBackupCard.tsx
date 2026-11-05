"use client";

import { useEffect, useState } from "react";
import {
  chooseBackupFolder,
  forgetBackupFolder,
  grantFolderAccess,
  runFolderBackup,
} from "@/lib/backup/files";
import { useFolderState, useSetting } from "@/lib/backup/hooks";
import { isNative } from "@/lib/native/platform";
import { btnPrimary, btnSecondary, cardClass } from "../ui";

const BRAVE_FLAG = "brave://flags/#file-system-access-api";

type BraveNavigator = Navigator & { brave?: { isBrave?: () => Promise<boolean> } };

export function FolderBackupCard() {
  const [isBrave, setIsBrave] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    void (navigator as BraveNavigator).brave?.isBrave?.().then(setIsBrave);
  }, []);

  async function copyFlag() {
    try {
      await navigator.clipboard.writeText(BRAVE_FLAG);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

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

  /* The Android app has no folder access, the share sheet covers it. */
  if (isNative()) return null;

  return (
    <section className={cardClass}>
      <h2 id="folder-backup" className="font-semibold">Backup folder</h2>

      {state === "unsupported" ? (
        isBrave ? (
          <div className="mt-1 space-y-3 text-sm text-sand-600 dark:text-sand-400">
            <p>
              Brave switches folder saving off by default. Turn it on once and the one press backup
              will save straight into a folder:
            </p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>Copy the address below and paste it into a new tab.</li>
              <li>Set the highlighted option to Enabled.</li>
              <li>Click Relaunch at the bottom of that page.</li>
            </ol>
            <div className="flex flex-wrap items-center gap-3">
              <code className="rounded bg-sand-100 px-2 py-1 text-xs dark:bg-sand-800">{BRAVE_FLAG}</code>
              <button type="button" className={btnSecondary} onClick={copyFlag}>
                {copied ? "Copied" : "Copy address"}
              </button>
            </div>
            <p>Until then, the Back up now button downloads the file to your Downloads folder.</p>
          </div>
        ) : (
          <p className="mt-1 text-sm text-sand-500">
            This browser cannot save to a folder by itself. It works in Chrome and Edge on a
            computer, and in Brave once you switch it on. Until then, the Back up now button
            downloads the file to your Downloads folder.
          </p>
        )
      ) : (
        <>
          <p className="mt-1 text-sm text-sand-500">
            Pick a folder once. Life Trail then saves a dated backup file there every day you use
            it, and keeps the newest 30. Choosing a folder that syncs to OneDrive or Google Drive
            gives you a copy off this computer as well. Create a new folder for it, for example
            &quot;Life Trail Backups&quot;, because browsers refuse folders like Downloads itself.
          </p>

          {state === "checking" && <p className="mt-3 text-sm text-sand-500">Checking...</p>}

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
                <p className="text-xs text-sand-500">
                  Browsers sometimes ask again when you come back to the app. This is normal, and
                  one click on Allow is enough.
                </p>
              )}
            </div>
          )}
        </>
      )}

      {message && <p className="mt-3 text-sm text-sand-600 dark:text-sand-300">{message}</p>}
    </section>
  );
}

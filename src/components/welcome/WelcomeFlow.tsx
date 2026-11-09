"use client";

import { useEffect, useState } from "react";
import { chooseBackupFolder } from "@/lib/backup/files";
import { useFolderState, useJournalInfo, useSetting } from "@/lib/backup/hooks";
import { setSetting } from "@/lib/backup/store";
import { useLock } from "@/lib/lock/context";
import { isNative } from "@/lib/native/platform";
import { useWelcomeNeeded } from "@/lib/welcome";
import { RestoreFileCard } from "../backup/RestoreFileCard";
import { btnPrimary, btnSecondary, cardClass } from "../ui";

const finish = () => setSetting("welcomeDone", true);

/* The first screen on a fresh install. Everything on it can be skipped. */
export function WelcomeFlow() {
  const { status } = useLock();
  const needed = useWelcomeNeeded();
  const done = useSetting<boolean>("welcomeDone");
  const info = useJournalInfo();
  const folder = useSetting<FileSystemDirectoryHandle>("folderHandle");
  const { state, refresh } = useFolderState();
  const [showRestore, setShowRestore] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  /* A journal that has entries, for example after a restore, needs no welcome. */
  useEffect(() => {
    if (done && !done.value && info && info.entryCount + info.movieLogCount > 0) void finish();
  }, [done, info]);

  if (!needed || status === "loading" || status === "locked") return null;

  const native = isNative();
  const checking = state === "checking";
  const unsupported = state === "unsupported";
  const folderReady = state === "ready";
  const canContinue = !checking && (unsupported || folderReady);

  async function pick() {
    setBusy(true);
    setMessage(null);
    try {
      const name = await chooseBackupFolder();
      if (name) setMessage(`Backups will be saved to "${name}".`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      refresh();
      setBusy(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
      className="fixed inset-0 z-40 overflow-y-auto bg-sand-50 p-4 dark:bg-sand-950"
    >
      <div className="mx-auto flex min-h-full max-w-xl flex-col justify-center py-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-mark.png" alt="" width={56} height={56} className="h-14 w-14" />
        <h1 id="welcome-title" className="mt-3 font-display text-3xl font-semibold tracking-tight">
          Welcome to Life Trail
        </h1>
        <p className="mt-2 text-sm text-sand-600 dark:text-sand-300">
          Your journal stays on this device. Nothing is sent anywhere. Let&apos;s set up a safe place
          for backups first. You can skip all of this and change it later in Backup.
        </p>

        <section className={`${cardClass} mt-6`}>
          <h2 className="font-semibold">Backup folder</h2>
          {checking ? (
            <p className="mt-1 text-sm text-sand-500">Checking...</p>
          ) : unsupported ? (
            <p className="mt-1 text-sm text-sand-600 dark:text-sand-300">
              {native
                ? "On Android, Back up now opens the share sheet with a backup file. Save it to Google Drive or Files so a copy lives outside this app. Uninstalling the app deletes its journal."
                : "This browser cannot save straight into a folder, so Back up now will download a file instead. You can look at the options later in Backup."}
            </p>
          ) : (
            <>
              <p className="mt-1 text-sm text-sand-600 dark:text-sand-300">
                Pick a folder where backup files are saved. A folder that syncs to the cloud, such as
                Google Drive or OneDrive, is the safest choice.
              </p>
              <button
                type="button"
                className={`${folderReady ? btnSecondary : btnPrimary} mt-3`}
                disabled={busy}
                onClick={() => void pick()}
              >
                {folderReady ? "Choose a different folder" : "Choose a folder"}
              </button>
              {folderReady && (
                <p role="status" className="mt-3 text-sm text-green-700 dark:text-green-400">
                  {message ?? `Backups will be saved to "${folder?.value?.name ?? "your folder"}".`}
                </p>
              )}
              {!folderReady && message && (
                <p role="status" className="mt-3 text-sm text-red-600">
                  {message}
                </p>
              )}
            </>
          )}
        </section>

        <section className={`${cardClass} mt-4`}>
          <h2 className="font-semibold">Already have a backup?</h2>
          <p className="mt-1 text-sm text-sand-600 dark:text-sand-300">
            Start from a backup file you saved earlier, for example from the website or another phone.
          </p>
          {!showRestore && (
            <button type="button" className={`${btnSecondary} mt-3`} onClick={() => setShowRestore(true)}>
              Restore from a backup file
            </button>
          )}
          {showRestore && (
            <div className="mt-3">
              <RestoreFileCard onRestored={() => void finish()} />
            </div>
          )}
        </section>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button type="button" className={btnSecondary} onClick={() => void finish()}>
            Skip for now
          </button>
          <button type="button" className={btnPrimary} disabled={!canContinue} onClick={() => void finish()}>
            Next
          </button>
        </div>
        {!checking && !canContinue && (
          <p className="mt-2 text-right text-xs text-sand-500">
            Choose a folder to continue, or skip for now.
          </p>
        )}
      </div>
    </div>
  );
}

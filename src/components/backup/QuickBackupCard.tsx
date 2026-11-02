"use client";

import { useFolderState, useSetting } from "@/lib/backup/hooks";
import { btnPrimary, cardClass } from "../ui";
import { useQuickBackup } from "./useQuickBackup";

export function QuickBackupCard() {
  const { state } = useFolderState();
  const folder = useSetting<FileSystemDirectoryHandle>("folderHandle");
  const { run, busy, feedback } = useQuickBackup();

  const folderName = folder?.value?.name;
  const hasFolder = state === "ready" || state === "needs-permission";

  const description =
    state === "unsupported"
      ? "This browser cannot save into a folder by itself, so one press downloads the backup file to your Downloads folder. To save straight into a folder, see the folder section below."
      : hasFolder
        ? `One press saves a fresh backup file into "${folderName ?? "your backup folder"}".`
        : "Choose a folder once, for example a new folder called Life Trail Backups. After that, one press saves a fresh backup there.";

  const label = busy
    ? "Backing up..."
    : state === "unsupported" || hasFolder
      ? "Back up now"
      : "Choose folder and back up";

  return (
    <section className={cardClass}>
      <h2 className="font-semibold">Back up in one press</h2>
      <p className="mt-1 text-sm text-sand-600 dark:text-sand-400">{description}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" className={btnPrimary} disabled={busy || state === "checking"} onClick={run}>
          {label}
        </button>
        <p
          role="status"
          className={`text-sm ${feedback?.failed ? "text-red-600" : "text-brand-700 dark:text-brand-300"}`}
        >
          {feedback?.long}
        </p>
      </div>
    </section>
  );
}

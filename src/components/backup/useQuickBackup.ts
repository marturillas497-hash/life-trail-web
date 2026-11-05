"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { quickBackup } from "@/lib/backup/files";
import { isNative } from "@/lib/native/platform";

export type QuickBackupFeedback = {
  /* Fits on a button. */
  short: string;
  /* Says where the file went. */
  long: string;
  failed: boolean;
};

const SHOW_MS = 4000;

/* Runs the one press backup and keeps the result on screen for a few seconds. */
export function useQuickBackup() {
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<QuickBackupFeedback | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const run = useCallback(async () => {
    setBusy(true);
    window.clearTimeout(timer.current);
    let next: QuickBackupFeedback | null;
    try {
      const result = await quickBackup();
      if (result.kind === "folder") {
        next = { short: "Saved ✓", long: `Backup saved to the folder "${result.folderName}".`, failed: false };
      } else if (result.kind === "download") {
        next = isNative()
          ? { short: "Shared ✓", long: "Backup file shared. Keep it in Google Drive or Files, outside this app.", failed: false }
          : { short: "Downloaded ✓", long: "Backup file downloaded to your Downloads folder.", failed: false };
      } else if (result.kind === "empty") {
        next = {
          short: "Nothing yet",
          long: "There is nothing to back up yet. Write an entry or log a movie first.",
          failed: false,
        };
      } else {
        next = null;
      }
    } catch (error) {
      next = {
        short: "Failed",
        long: error instanceof Error ? error.message : "The backup failed.",
        failed: true,
      };
    }
    setFeedback(next);
    setBusy(false);
    if (next) timer.current = window.setTimeout(() => setFeedback(null), SHOW_MS);
  }, []);

  return { run, busy, feedback };
}

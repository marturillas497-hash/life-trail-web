"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { backupToDrive, DriveError, hasValidToken, signIn, type DriveBackupResult } from "@/lib/backup/drive";
import { quickBackup, type QuickBackupResult } from "@/lib/backup/files";
import { useFolderState } from "@/lib/backup/hooks";
import { useDriveSetup } from "@/lib/backup/useDrive";
import { isNative } from "@/lib/native/platform";

export type QuickBackupFeedback = {
  /* Fits on a button. */
  short: string;
  /* Says where the file went. */
  long: string;
  failed: boolean;
};

const SHOW_MS = 4000;

type DriveOutcome =
  | { kind: "none" }
  | { kind: "saved" }
  | { kind: "later" }
  | { kind: "skipped" }
  | { kind: "failed"; message: string };

function describeFolder(result: QuickBackupResult): string | null {
  if (result.kind === "folder") return `Backup saved to the folder "${result.folderName}".`;
  if (result.kind === "download") {
    return isNative()
      ? "Backup file shared. Keep it in Google Drive or Files, outside this app."
      : "Backup file downloaded to your Downloads folder.";
  }
  return null;
}

/* Puts the folder result and the Drive result into one message. */
function combine(folder: QuickBackupResult, drive: DriveOutcome): QuickBackupFeedback | null {
  if (folder.kind === "empty") {
    return {
      short: "Nothing yet",
      long: "There is nothing to back up yet. Write an entry or log a movie first.",
      failed: false,
    };
  }
  const where = describeFolder(folder);
  const savedShort = folder.kind === "download" && !isNative() ? "Downloaded ✓" : isNative() ? "Shared ✓" : "Saved ✓";

  if (drive.kind === "saved") {
    return where
      ? { short: "Saved ✓", long: `${where} Also saved to Google Drive.`, failed: false }
      : { short: "Saved ✓", long: "Backup saved to Google Drive.", failed: false };
  }
  if (drive.kind === "failed") {
    return { short: "Drive failed", long: `${where ? `${where} ` : ""}Google Drive failed: ${drive.message}`, failed: true };
  }
  if (!where) return null;
  if (drive.kind === "later") {
    return { short: savedShort, long: `${where} Press again to include Google Drive.`, failed: false };
  }
  if (drive.kind === "skipped") {
    return { short: savedShort, long: `${where} Google Drive was skipped.`, failed: false };
  }
  return { short: savedShort, long: where, failed: false };
}

/*
Runs the one press backup and keeps the result on screen for a few seconds. When Google
Drive backup is switched on it also saves to Drive in the same press.
*/
export function useQuickBackup() {
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<QuickBackupFeedback | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const drive = useDriveSetup();
  const folder = useFolderState();

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const run = useCallback(async () => {
    setBusy(true);
    window.clearTimeout(timer.current);

    /*
    A press can only open one window: the Google sign-in, or the folder picker or folder
    permission prompt. If both would be needed, the folder goes first and Drive waits for
    the next press. Everything below that opens a window starts before any await.
    */
    const wantsDrive = drive.enabled && drive.clientId !== null;
    const needsSignIn = wantsDrive && drive.clientId !== null && !hasValidToken(drive.clientId);
    const folderNeedsWindow = folder.state === "none" || folder.state === "needs-permission";
    const driveNow = wantsDrive && !(needsSignIn && folderNeedsWindow);
    const pending = driveNow && drive.clientId !== null ? signIn(drive.clientId) : null;
    pending?.catch(() => {});

    let next: QuickBackupFeedback | null;
    try {
      const folderResult = await quickBackup();
      let outcome: DriveOutcome = wantsDrive && !driveNow ? { kind: "later" } : { kind: "none" };

      if (pending && folderResult.kind !== "empty") {
        try {
          const result: DriveBackupResult = await backupToDrive(await pending);
          outcome = result.kind === "saved" ? { kind: "saved" } : { kind: "none" };
        } catch (error) {
          if (error instanceof DriveError && error.cancelled) outcome = { kind: "skipped" };
          else outcome = { kind: "failed", message: error instanceof Error ? error.message : "Something went wrong." };
        }
      }
      next = combine(folderResult, outcome);
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
  }, [drive.enabled, drive.clientId, folder.state]);

  return { run, busy, feedback };
}

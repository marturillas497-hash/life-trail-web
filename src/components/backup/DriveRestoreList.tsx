"use client";

import { useState } from "react";
import { downloadDriveBackup, DriveError, getAccessToken, listDriveBackups, type DriveBackup } from "@/lib/backup/drive";
import { useDriveSetup } from "@/lib/backup/useDrive";
import { formatDateTime } from "@/lib/dates";
import { isNative } from "@/lib/native/platform";
import { btnSecondary } from "../ui";

function formatSize(bytes: number | null): string {
  if (bytes === null) return "";
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/*
Shown inside the restore card once Drive backup is set up. Picking a file hands its
text to the same preview and merge steps as a file chosen from the computer.
*/
export function DriveRestoreList({ onText }: { onText: (name: string, text: string) => void }) {
  const { clientId, ready } = useDriveSetup();
  const [native] = useState(() => isNative());
  const [files, setFiles] = useState<DriveBackup[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (native || !clientId) return null;

  /* The sign-in window has to open straight from the click, so the token is requested first. */
  async function show() {
    if (!clientId) return;
    setError(null);
    const signIn = getAccessToken(clientId);
    setBusy(true);
    try {
      setFiles(await listDriveBackups(await signIn));
    } catch (err) {
      if (!(err instanceof DriveError && err.cancelled)) setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function use(file: DriveBackup) {
    if (!clientId) return;
    setError(null);
    const signIn = getAccessToken(clientId);
    setBusy(true);
    try {
      const { text } = await downloadDriveBackup(await signIn, file.id);
      onText(file.name, text);
      setFiles(null);
    } catch (err) {
      if (!(err instanceof DriveError && err.cancelled)) setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 border-t border-sand-200 pt-4 dark:border-sand-700">
      <p className="text-sm font-medium">Or choose one from Google Drive</p>
      <button type="button" className={`${btnSecondary} mt-2`} disabled={busy || !ready} onClick={() => void show()}>
        {busy && files === null ? "Looking in Drive..." : "Show my Drive backups"}
      </button>

      {files !== null && files.length === 0 && (
        <p className="mt-3 text-sm text-sand-600 dark:text-sand-300">
          No backups found in your Drive yet. Backups made on another site address or by another Google project are not
          visible here.
        </p>
      )}
      {files !== null && files.length > 0 && (
        <ul className="mt-3 divide-y divide-sand-200 rounded-lg border border-sand-200 text-sm dark:divide-sand-700 dark:border-sand-700">
          {files.map((file) => (
            <li key={file.id} className="flex items-center justify-between gap-3 px-3 py-2">
              <span>
                <span className="font-medium">{file.name}</span>
                <span className="block text-sand-500">
                  {file.modifiedTime ? formatDateTime(Date.parse(file.modifiedTime)) : ""}
                  {file.size !== null ? `, ${formatSize(file.size)}` : ""}
                </span>
              </span>
              <button type="button" className={btnSecondary} disabled={busy} onClick={() => void use(file)}>
                Use this
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { backupToDrive, disconnectDrive, DriveError, getAccessToken, parseClientId } from "@/lib/backup/drive";
import { describeAge, useSetting } from "@/lib/backup/hooks";
import { setSetting } from "@/lib/backup/store";
import { useDriveSetup } from "@/lib/backup/useDrive";
import { formatDateTime } from "@/lib/dates";
import { isNative } from "@/lib/native/platform";
import { driveSetupPath } from "@/lib/paths";
import { btnPrimary, btnSecondary, cardClass, inputClass } from "../ui";

type Message = { text: string; good: boolean };

export function DriveBackupCard() {
  const { clientId, ready, loadError } = useDriveSetup();
  const lastBackup = useSetting<number>("lastDriveBackupAt");
  const lastError = useSetting<string>("driveError");
  const [native] = useState(() => isNative());
  const [now] = useState(() => Date.now());
  const [draft, setDraft] = useState("");
  const [changing, setChanging] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [busy, setBusy] = useState(false);

  async function saveClientId() {
    const parsed = parseClientId(draft);
    if (!parsed) {
      setMessage({
        text: "That does not look like a client ID. It is a long number, a dash, letters and numbers, then .apps.googleusercontent.com.",
        good: false,
      });
      return;
    }
    await setSetting("driveClientId", parsed);
    await disconnectDrive();
    setDraft("");
    setChanging(false);
    setMessage({ text: "Client ID saved on this device.", good: true });
  }

  /* The sign-in window has to open straight from the click, so the token is requested first. */
  async function backUp() {
    if (!clientId) return;
    setMessage(null);
    const signIn = getAccessToken(clientId);
    setBusy(true);
    try {
      const result = await backupToDrive(await signIn);
      setMessage(
        result.kind === "empty"
          ? { text: "Nothing to back up yet. Write an entry or log a movie first.", good: false }
          : { text: `Saved ${result.name} in the Life Trail Backups folder in your Google Drive.`, good: true },
      );
    } catch (error) {
      if (error instanceof DriveError && error.cancelled) return;
      setMessage({ text: error instanceof Error ? error.message : "Something went wrong.", good: false });
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await disconnectDrive();
    setMessage({ text: "Signed out of Google Drive. Your backups there were not touched.", good: true });
  }

  if (native) {
    return (
      <section className={cardClass}>
        <h2 className="font-semibold">Google Drive</h2>
        <p className="mt-1 text-sm text-sand-500">
          Backing up straight to Google Drive works on the website for now. In this app, use Save or share backup file
          above and choose Google Drive from the share sheet.
        </p>
      </section>
    );
  }

  const lastAt = lastBackup?.value;
  const showSetup = clientId === null || changing;

  return (
    <section className={cardClass}>
      <h2 className="font-semibold">Back up to Google Drive</h2>
      <p className="mt-1 text-sm text-sand-500">
        Optional. One press saves your backup file, with pictures, in a folder called Life Trail Backups in your own
        Google Drive. Life Trail can only see files it made itself. Google&apos;s sign-in only lasts an hour, so this
        needs a press each time and an internet connection.
      </p>

      {clientId === undefined ? (
        <p className="mt-3 text-sm text-sand-500">Loading...</p>
      ) : (
        <>
          {showSetup && (
            <form
              className="mt-4 space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                void saveClientId();
              }}
            >
              <p className="text-sm text-sand-600 dark:text-sand-300">
                {clientId === null
                  ? "To use it, set up a free Google Cloud project once, then paste its client ID here. The guide walks through it."
                  : "Paste the new client ID."}
              </p>
              <input
                type="text"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="1234567890-abc123.apps.googleusercontent.com"
                aria-label="Google client ID"
                autoComplete="off"
                spellCheck={false}
                className={inputClass}
              />
              <div className="flex flex-wrap gap-3">
                <button type="submit" className={btnPrimary} disabled={draft.trim() === ""}>
                  Save client ID
                </button>
                <Link href={driveSetupPath()} className={btnSecondary}>
                  Setup guide
                </Link>
                {changing && (
                  <button type="button" className={btnSecondary} onClick={() => setChanging(false)}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}

          {!showSetup && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-3">
                <button type="button" className={btnPrimary} disabled={busy || !ready} onClick={() => void backUp()}>
                  {busy ? "Backing up..." : ready ? "Back up to Google Drive" : "Loading Google sign-in..."}
                </button>
                <button type="button" className={btnSecondary} disabled={busy} onClick={() => void signOut()}>
                  Sign out of Drive
                </button>
                <button type="button" className={btnSecondary} disabled={busy} onClick={() => setChanging(true)}>
                  Change client ID
                </button>
              </div>
              <p className="mt-3 text-sm text-sand-600 dark:text-sand-300">
                {lastAt === undefined
                  ? "No Drive backup yet."
                  : `Last Drive backup: ${describeAge(lastAt, now)} (${formatDateTime(lastAt)}).`}
              </p>
            </div>
          )}

          {loadError && !showSetup && <p className="mt-3 text-sm text-red-600">{loadError}</p>}
          {lastError?.value && !message && !showSetup && (
            <p className="mt-3 text-sm text-red-600">The last Drive backup failed: {lastError.value}</p>
          )}
        </>
      )}

      {message && (
        <p role="status" className={`mt-3 text-sm ${message.good ? "text-sand-600 dark:text-sand-300" : "text-red-600"}`}>
          {message.text}
        </p>
      )}
    </section>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { backupToDrive, disconnectDrive, DriveError, parseClientId, signIn } from "@/lib/backup/drive";
import { describeAge, useSetting } from "@/lib/backup/hooks";
import { deleteSetting, setSetting } from "@/lib/backup/store";
import { useDriveSetup } from "@/lib/backup/useDrive";
import { formatDateTime } from "@/lib/dates";
import { isNative } from "@/lib/native/platform";
import { driveSetupPath } from "@/lib/paths";
import { btnPrimary, btnSecondary, cardClass, inputClass } from "../ui";

type Message = { text: string; good: boolean };

export function DriveBackupCard() {
  const setup = useDriveSetup();
  const { clientId, enabled, loadError, hasBuiltIn, hasOverride } = setup;
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
    await disconnectDrive();
    await setSetting("driveClientId", parsed);
    setDraft("");
    setChanging(false);
    setMessage({ text: "Client ID saved on this device. Press Connect Google Drive to sign in.", good: true });
  }

  async function switchToBuiltIn() {
    await disconnectDrive();
    await deleteSetting("driveClientId");
    setDraft("");
    setChanging(false);
    setMessage({ text: "Using the app's own Google client ID again.", good: true });
  }

  /* The sign-in window has to open straight from the click, so sign-in is started first. */
  async function backUp() {
    if (!clientId) return;
    setMessage(null);
    const pending = signIn(clientId);
    setBusy(true);
    try {
      const result = await backupToDrive(await pending);
      setMessage(
        result.kind === "empty"
          ? { text: "Connected. There is nothing to back up yet, so nothing was saved. Write an entry or log a movie first.", good: true }
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
  const showSetup = !setup.loading && (clientId === null || changing);

  return (
    <section className={cardClass}>
      <h2 className="font-semibold">Back up to Google Drive</h2>
      <p className="mt-1 text-sm text-sand-500">
        Optional. Your backup file, with pictures, goes straight from this device to a folder called Life Trail Backups
        in your own Google Drive. It does not pass through anyone else, and Life Trail can only see files it made itself.
        Google&apos;s sign-in only lasts an hour, so it needs a press each time and an internet connection.
      </p>

      {setup.loading ? (
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
                  ? "This copy of Life Trail has no Google client ID built in yet. Whoever hosts the app makes one once, and the guide shows how. You can also paste your own here to try it."
                  : "Paste your own Google client ID. It replaces the app's built in one on this device."}
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
                {hasOverride && hasBuiltIn && (
                  <button type="button" className={btnSecondary} onClick={() => void switchToBuiltIn()}>
                    Use the built in one
                  </button>
                )}
                {changing && (
                  <button type="button" className={btnSecondary} onClick={() => setChanging(false)}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}

          {!showSetup && clientId && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-3">
                <button type="button" className={btnPrimary} disabled={busy} onClick={() => void backUp()}>
                  {busy ? "Working..." : enabled ? "Back up to Google Drive" : "Connect Google Drive"}
                </button>
                {enabled && (
                  <button type="button" className={btnSecondary} disabled={busy} onClick={() => void signOut()}>
                    Sign out of Drive
                  </button>
                )}
                {(hasOverride || !hasBuiltIn) && (
                  <button type="button" className={btnSecondary} disabled={busy} onClick={() => setChanging(true)}>
                    Change client ID
                  </button>
                )}
                {!hasOverride && hasBuiltIn && (
                  <button type="button" className={btnSecondary} disabled={busy} onClick={() => setChanging(true)}>
                    Use my own client ID
                  </button>
                )}
              </div>
              <p className="mt-3 text-sm text-sand-600 dark:text-sand-300">
                {!enabled
                  ? "Press Connect, sign in with your Google account and allow access. Your first backup is saved right away."
                  : lastAt === undefined
                    ? "No Drive backup yet."
                    : `Last Drive backup: ${describeAge(lastAt, now)} (${formatDateTime(lastAt)}).`}
              </p>
              {enabled && (
                <p className="mt-1 text-sm text-sand-500">The Back up now button in the sidebar also saves to Drive.</p>
              )}
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

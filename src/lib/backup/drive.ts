import { backupFileName } from "./files";
import { buildBackupFile, hasContent, parseBackup, serializeBackup, type BackupFile } from "./format";
import { readCurrentData } from "./snapshots";
import { deleteSetting, getSetting, setSetting } from "./store";

/*
Backup to the person's own Google Drive, from the browser, with no server.

Only the drive.file scope is used: the app can see only files it created itself.
Google's browser sign-in (the token model) gives an access token that lasts about
an hour and has no refresh token, so every step that needs one must start from a
click. The token is kept in memory only, never stored.
*/

const SCOPE = "https://www.googleapis.com/auth/drive.file";
const GOOGLE_SCRIPT = "https://accounts.google.com/gsi/client";
const API = "https://www.googleapis.com/drive/v3";
const UPLOAD = "https://www.googleapis.com/upload/drive/v3";
const FOLDER_NAME = "Life Trail Backups";
const FOLDER_TYPE = "application/vnd.google-apps.folder";
const KEEP_DRIVE_FILES = 30;
const FILE_PATTERN = /^life-trail-backup-\d{4}-\d{2}-\d{2}\.json$/;
const MAX_DOWNLOAD_BYTES = 200 * 1024 * 1024;

/* ---------- Google's script, typed only as far as it is used ---------- */

type TokenResponse = {
  access_token?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
  error_description?: string;
};
type TokenClient = { requestAccessToken(overrideConfig?: { prompt?: string }): void };
type GoogleOAuth = {
  initTokenClient(config: {
    client_id: string;
    scope: string;
    callback: (response: TokenResponse) => void;
    error_callback?: (error: { type?: string; message?: string }) => void;
  }): TokenClient;
  revoke(token: string, done?: () => void): void;
};
declare global {
  interface Window {
    google?: { accounts?: { oauth2?: GoogleOAuth } };
  }
}

export class DriveError extends Error {
  status?: number;
  /* True when the person closed the window or refused, which is not worth an error message. */
  cancelled: boolean;
  constructor(message: string, options: { status?: number; cancelled?: boolean } = {}) {
    super(message);
    this.name = "DriveError";
    this.status = options.status;
    this.cancelled = options.cancelled ?? false;
  }
}

/* ---------- Client ID ---------- */

const CLIENT_ID_PATTERN = /^\d+-[a-z0-9_]+\.apps\.googleusercontent\.com$/i;

/* Returns the cleaned client ID, or null if the text does not look like one. */
export function parseClientId(text: string): string | null {
  const value = text.trim();
  return CLIENT_ID_PATTERN.test(value) ? value : null;
}

/* ---------- Loading and signing in ---------- */

let scriptPromise: Promise<void> | null = null;

/* Loads Google's sign-in script once. Only called after the person has set up Drive backup. */
export function loadGoogleScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new DriveError("Not in a browser."));
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GOOGLE_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      script.remove();
      reject(
        new DriveError(
          "Could not load Google's sign-in script. Check your connection, or switch off Brave Shields for this site.",
        ),
      );
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

let cached: { token: string; clientId: string; expiresAt: number } | null = null;

export function hasValidToken(clientId: string): boolean {
  return cached !== null && cached.clientId === clientId && Date.now() < cached.expiresAt;
}

/*
Asks Google for an access token. Must be called straight from a click, before any
await, or the browser may block the sign-in window. Needs loadGoogleScript to have
finished earlier. Reuses the token from the last hour without asking again.
*/
export function getAccessToken(clientId: string): Promise<string> {
  if (cached && hasValidToken(clientId)) return Promise.resolve(cached.token);
  const oauth = typeof window === "undefined" ? undefined : window.google?.accounts?.oauth2;
  if (!oauth) {
    return Promise.reject(new DriveError("Google sign-in has not loaded yet. Try again in a moment."));
  }
  return new Promise<string>((resolve, reject) => {
    const client = oauth.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: (response) => {
        if (response.error || !response.access_token) {
          const denied = response.error === "access_denied";
          reject(
            new DriveError(
              denied
                ? "Permission was not given, so nothing was saved to Google Drive."
                : (response.error_description ?? response.error ?? "Google did not sign you in."),
              { cancelled: denied },
            ),
          );
          return;
        }
        if (response.scope && !response.scope.includes(SCOPE)) {
          reject(new DriveError("Google Drive permission was not granted. Press the button and allow access."));
          return;
        }
        cached = {
          token: response.access_token,
          clientId,
          expiresAt: Date.now() + Math.max(60, (response.expires_in ?? 3600) - 120) * 1000,
        };
        resolve(response.access_token);
      },
      error_callback: (error) => {
        if (error.type === "popup_failed_to_open") {
          reject(new DriveError("The Google sign-in window was blocked. Allow pop-ups for this site and try again."));
        } else {
          reject(new DriveError("Sign-in was closed before it finished.", { cancelled: true }));
        }
      },
    });
    client.requestAccessToken();
  });
}

/*
The one entry point for a click that needs Drive. When Google's script is already loaded the
sign-in window opens straight away, inside the click. Otherwise the script is fetched first,
which is quick and still inside the browser's short window after a click. A successful
sign-in switches Drive backup on, which is what makes the script load on later visits.
*/
export function signIn(clientId: string): Promise<string> {
  const loaded = typeof window !== "undefined" && window.google?.accounts?.oauth2 !== undefined;
  const token = loaded ? getAccessToken(clientId) : loadGoogleScript().then(() => getAccessToken(clientId));
  return token.then(async (value) => {
    await setSetting("driveEnabled", true);
    return value;
  });
}

/* ---------- Drive requests ---------- */

async function describeFailure(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as {
      error?: { message?: string; errors?: { reason?: string }[]; status?: string };
    };
    const message = body.error?.message;
    const reason = body.error?.errors?.[0]?.reason;
    if (response.status === 403 && (reason === "accessNotConfigured" || /has not been used|is disabled/i.test(message ?? ""))) {
      return "The Google Drive API is not switched on in your Google Cloud project. Enable it there, wait a minute, then try again.";
    }
    if (response.status === 401) return "Google signed you out. Press the button again to sign in.";
    if (response.status === 403 && reason === "storageQuotaExceeded") {
      return "Your Google Drive is full. Free some space and try again.";
    }
    if (typeof message === "string" && message) return message;
  } catch {
    /* The body was not JSON. */
  }
  return `Google Drive answered with an error (${response.status}).`;
}

async function request(token: string, url: string, init: RequestInit = {}): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(url, { ...init, headers: { ...init.headers, Authorization: `Bearer ${token}` } });
  } catch {
    throw new DriveError("Could not reach Google Drive. Check your internet connection.");
  }
  if (response.ok) return response;
  if (response.status === 401) cached = null;
  throw new DriveError(await describeFailure(response), { status: response.status });
}

const query = (params: Record<string, string>) => new URLSearchParams(params).toString();

type DriveFile = { id: string; name: string; size?: string; modifiedTime?: string; trashed?: boolean };

async function listFiles(token: string, q: string, extra: Record<string, string> = {}): Promise<DriveFile[]> {
  const response = await request(
    token,
    `${API}/files?${query({ q, fields: "files(id,name,size,modifiedTime)", pageSize: "100", spaces: "drive", ...extra })}`,
  );
  return ((await response.json()) as { files?: DriveFile[] }).files ?? [];
}

async function findFolder(token: string): Promise<string | null> {
  const saved = await getSetting<string>("driveFolderId");
  if (saved) {
    try {
      const response = await request(token, `${API}/files/${encodeURIComponent(saved)}?fields=id,trashed`);
      const file = (await response.json()) as DriveFile;
      if (!file.trashed) return file.id;
    } catch (error) {
      if (!(error instanceof DriveError && error.status === 404)) throw error;
    }
    await deleteSetting("driveFolderId");
  }
  const found = await listFiles(token, `name = '${FOLDER_NAME}' and mimeType = '${FOLDER_TYPE}' and trashed = false`);
  if (found.length === 0) return null;
  await setSetting("driveFolderId", found[0].id);
  return found[0].id;
}

async function ensureFolder(token: string): Promise<string> {
  const existing = await findFolder(token);
  if (existing) return existing;
  const response = await request(token, `${API}/files?fields=id`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: FOLDER_NAME, mimeType: FOLDER_TYPE }),
  });
  const id = ((await response.json()) as DriveFile).id;
  await setSetting("driveFolderId", id);
  return id;
}

function multipart(metadata: object, json: string): { body: string; contentType: string } {
  const boundary = `lt${crypto.randomUUID().replace(/-/g, "")}`;
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n${json}\r\n--${boundary}--`;
  return { body, contentType: `multipart/related; boundary=${boundary}` };
}

/* ---------- Backing up ---------- */

export type DriveBackupResult = { kind: "saved"; name: string } | { kind: "empty" };

/*
Uploads today's backup file into the Life Trail Backups folder, replacing an earlier
file from the same day, and trashes files beyond the newest 30. The file includes
pictures, like the other backup files.
*/
export async function backupToDrive(token: string): Promise<DriveBackupResult> {
  try {
    const data = await readCurrentData({ withImages: true });
    if (!hasContent(data)) return { kind: "empty" };

    const folderId = await ensureFolder(token);
    const name = backupFileName();
    const json = serializeBackup(buildBackupFile(data));

    const sameDay = await listFiles(token, `name = '${name}' and '${folderId}' in parents and trashed = false`);
    if (sameDay.length > 0) {
      const { body, contentType } = multipart({ name }, json);
      await request(token, `${UPLOAD}/files/${encodeURIComponent(sameDay[0].id)}?${query({ uploadType: "multipart", fields: "id" })}`, {
        method: "PATCH",
        headers: { "Content-Type": contentType },
        body,
      });
    } else {
      const { body, contentType } = multipart({ name, parents: [folderId], mimeType: "application/json" }, json);
      await request(token, `${UPLOAD}/files?${query({ uploadType: "multipart", fields: "id" })}`, {
        method: "POST",
        headers: { "Content-Type": contentType },
        body,
      });
    }

    await pruneDrive(token, folderId).catch((error) => console.error("Drive prune failed", error));

    /* A copy in Drive is outside this browser, so it also quiets the "back up" reminder. */
    await setSetting("lastDriveBackupAt", Date.now());
    await setSetting("lastFileBackupAt", Date.now());
    await deleteSetting("remindAfter");
    await deleteSetting("driveError");
    return { kind: "saved", name };
  } catch (error) {
    if (!(error instanceof DriveError && error.cancelled)) {
      await setSetting("driveError", error instanceof Error ? error.message : "Unknown error");
    }
    throw error;
  }
}

async function pruneDrive(token: string, folderId: string): Promise<void> {
  const files = (await listFiles(token, `'${folderId}' in parents and trashed = false`, { orderBy: "name desc" })).filter(
    (file) => FILE_PATTERN.test(file.name),
  );
  for (const file of files.slice(KEEP_DRIVE_FILES)) {
    await request(token, `${API}/files/${encodeURIComponent(file.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trashed: true }),
    });
  }
}

/* ---------- Restoring ---------- */

export type DriveBackup = { id: string; name: string; size: number | null; modifiedTime: string | null };

/* Newest first. Empty if nothing has been backed up to Drive yet. */
export async function listDriveBackups(token: string): Promise<DriveBackup[]> {
  const folderId = await findFolder(token);
  if (!folderId) return [];
  const files = await listFiles(token, `'${folderId}' in parents and trashed = false`, { orderBy: "name desc" });
  return files
    .filter((file) => FILE_PATTERN.test(file.name))
    .map((file) => ({
      id: file.id,
      name: file.name,
      size: file.size ? Number(file.size) : null,
      modifiedTime: file.modifiedTime ?? null,
    }));
}

/* Downloads a backup and checks it like any other backup file. */
export async function downloadDriveBackup(token: string, id: string): Promise<{ text: string; backup: BackupFile }> {
  const response = await request(token, `${API}/files/${encodeURIComponent(id)}?alt=media`);
  const length = Number(response.headers.get("content-length") ?? 0);
  if (length > MAX_DOWNLOAD_BYTES) throw new DriveError("That file is too large to be a backup.");
  const text = await response.text();
  return { text, backup: parseBackup(text) };
}

/* ---------- Disconnecting ---------- */

/*
Takes back the access Google gave this site, switches Drive backup off and forgets the Drive
folder. The backups already in Drive stay there, and any client ID the person pasted is kept.
*/
export async function disconnectDrive(): Promise<void> {
  const token = cached?.token;
  cached = null;
  if (token && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(token);
  }
  await deleteSetting("driveEnabled");
  await deleteSetting("driveFolderId");
  await deleteSetting("lastDriveBackupAt");
  await deleteSetting("driveError");
}

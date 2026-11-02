import { hasContent, hashData, buildBackupFile, serializeBackup, type BackupData } from "./format";
import { readCurrentData } from "./snapshots";
import { deleteSetting, getSetting, setSetting } from "./store";
import { todayKey } from "../dates";

const KEEP_FOLDER_FILES = 30;
const FILE_PATTERN = /^life-trail-backup-\d{4}-\d{2}-\d{2}\.json$/;

export type FolderState = "checking" | "unsupported" | "none" | "needs-permission" | "ready";

/* The File System Access API is only partly typed in the browser typings. */
type ReadWriteMode = { mode: "readwrite" };
type FolderHandle = FileSystemDirectoryHandle & {
  queryPermission(descriptor: ReadWriteMode): Promise<PermissionState>;
  requestPermission(descriptor: ReadWriteMode): Promise<PermissionState>;
  values(): AsyncIterable<{ name: string; kind: string }>;
};
type PickerWindow = Window & {
  showDirectoryPicker?: (options?: { mode?: "readwrite"; id?: string }) => Promise<FileSystemDirectoryHandle>;
};

const pad = (n: number) => String(n).padStart(2, "0");

/* life-trail-backup-2026-10-28.json, or with -1405 when a time is wanted. */
export function backupFileName(date: Date = new Date(), withTime = false): string {
  const day = todayKey(date);
  const time = withTime ? `-${pad(date.getHours())}${pad(date.getMinutes())}` : "";
  return `life-trail-backup-${day}${time}.json`;
}

async function markFileBackup(hash: string): Promise<void> {
  await setSetting("lastFileBackupAt", Date.now());
  await setSetting("lastFileBackupHash", hash);
  await deleteSetting("remindAfter");
}

/* ---------- Download and share ---------- */

export async function downloadBackup(): Promise<void> {
  const data = await readCurrentData();
  const json = serializeBackup(buildBackupFile(data));
  const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));

  const link = document.createElement("a");
  link.href = url;
  link.download = backupFileName(new Date(), true);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);

  await markFileBackup(hashData(data));
}

export function canShareFiles(): boolean {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") return false;
  const probe = new File(["{}"], "probe.json", { type: "application/json" });
  return navigator.canShare?.({ files: [probe] }) === true;
}

/* Returns false if the person closed the share sheet without sharing. */
export async function shareBackup(): Promise<boolean> {
  const data = await readCurrentData();
  const json = serializeBackup(buildBackupFile(data));
  const file = new File([json], backupFileName(new Date(), true), { type: "application/json" });
  try {
    await navigator.share({ files: [file], title: "Life Trail backup" });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return false;
    throw error;
  }
  await markFileBackup(hashData(data));
  return true;
}

/* ---------- Automatic backups to a folder (Chrome and Edge on a computer) ---------- */

export function isFolderBackupSupported(): boolean {
  return typeof window !== "undefined" && "showDirectoryPicker" in window;
}

async function getHandle(): Promise<FolderHandle | undefined> {
  return getSetting<FolderHandle>("folderHandle");
}

export async function getFolderState(): Promise<FolderState> {
  if (!isFolderBackupSupported()) return "unsupported";
  const handle = await getHandle();
  if (!handle) return "none";
  try {
    const permission = await handle.queryPermission({ mode: "readwrite" });
    return permission === "granted" ? "ready" : "needs-permission";
  } catch {
    return "needs-permission";
  }
}

/* Opens the folder picker. Returns the folder name, or null if cancelled. */
export async function chooseBackupFolder(): Promise<string | null> {
  const picker = (window as PickerWindow).showDirectoryPicker;
  if (!picker) return null;
  try {
    const handle = await picker.call(window, { mode: "readwrite", id: "life-trail-backups" });
    await setSetting("folderHandle", handle);
    await deleteSetting("folderError");
    return handle.name;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return null;
    throw error;
  }
}

/* Must be called from a click. Asks the browser to let us write to the saved folder again. */
export async function grantFolderAccess(): Promise<boolean> {
  const handle = await getHandle();
  if (!handle) return false;
  const permission = await handle.requestPermission({ mode: "readwrite" });
  if (permission === "granted") await deleteSetting("folderError");
  return permission === "granted";
}

export async function forgetBackupFolder(): Promise<void> {
  await deleteSetting("folderHandle");
  await deleteSetting("folderError");
}

async function pruneFolder(handle: FolderHandle): Promise<void> {
  const names: string[] = [];
  for await (const entry of handle.values()) {
    if (entry.kind === "file" && FILE_PATTERN.test(entry.name)) names.push(entry.name);
  }
  names.sort().reverse();
  for (const name of names.slice(KEEP_FOLDER_FILES)) {
    await handle.removeEntry(name);
  }
}

async function writeToFolder(handle: FolderHandle, data: BackupData): Promise<void> {
  const json = serializeBackup(buildBackupFile(data));
  const fileHandle = await handle.getFileHandle(backupFileName(), { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(json);
  await writable.close();
  await pruneFolder(handle);
}

/*
Writes today's backup file into the chosen folder, replacing an earlier
file from the same day. Does nothing if the journal is empty, unchanged
since the last file backup, or the folder is not currently allowed.
*/
export async function runFolderBackup(force = false): Promise<void> {
  const handle = await getHandle();
  if (!handle) return;

  try {
    if ((await handle.queryPermission({ mode: "readwrite" })) !== "granted") return;

    const data = await readCurrentData();
    if (!hasContent(data)) return;

    const hash = hashData(data);
    if (!force && (await getSetting<string>("lastFileBackupHash")) === hash) return;

    await writeToFolder(handle, data);
    await markFileBackup(hash);
    await deleteSetting("folderError");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await setSetting("folderError", message);
    throw error;
  }
}

/* ---------- One press backup ---------- */

const FOLDER_CHANGE_EVENT = "life-trail-folder-change";

/* Lets the folder card on the Backup page refresh after a backup made elsewhere. */
export function onFolderChange(callback: () => void): () => void {
  window.addEventListener(FOLDER_CHANGE_EVENT, callback);
  return () => window.removeEventListener(FOLDER_CHANGE_EVENT, callback);
}

export type QuickBackupResult =
  | { kind: "folder"; folderName: string }
  | { kind: "download" }
  | { kind: "empty" }
  | { kind: "cancelled" };

/*
One button for every case. With a saved folder it writes straight into it, asking the
browser for permission first if needed. With no folder yet it opens the folder picker once.
Browsers that cannot save to a folder get a normal file download instead.
Call it directly from a click, because the picker and the permission prompt require one.
*/
export async function quickBackup(): Promise<QuickBackupResult> {
  if (!isFolderBackupSupported()) {
    if (!hasContent(await readCurrentData())) return { kind: "empty" };
    await downloadBackup();
    return { kind: "download" };
  }

  let handle = await getHandle();
  if (!handle) {
    if (!(await chooseBackupFolder())) return { kind: "cancelled" };
    handle = await getHandle();
    if (!handle) return { kind: "cancelled" };
    window.dispatchEvent(new Event(FOLDER_CHANGE_EVENT));
  }

  if ((await handle.queryPermission({ mode: "readwrite" })) !== "granted") {
    if ((await handle.requestPermission({ mode: "readwrite" })) !== "granted") {
      window.dispatchEvent(new Event(FOLDER_CHANGE_EVENT));
      return { kind: "cancelled" };
    }
    await deleteSetting("folderError");
  }

  if (!hasContent(await readCurrentData())) return { kind: "empty" };
  try {
    await runFolderBackup(true);
  } finally {
    window.dispatchEvent(new Event(FOLDER_CHANGE_EVENT));
  }
  return { kind: "folder", folderName: handle.name };
}

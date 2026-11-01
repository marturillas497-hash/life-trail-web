import { db, takePendingUpgrade } from "../db";
import { runFolderBackup } from "./files";
import { saveSnapshot, runDailySnapshot } from "./snapshots";
import { setSetting } from "./store";

let running = false;
let persistAsked = false;

/* Asks the browser not to delete this site's data when the device runs low on space. */
async function requestPersistentStorage(): Promise<void> {
  if (persistAsked || typeof navigator === "undefined" || !navigator.storage) return;
  persistAsked = true;
  const persisted =
    (await navigator.storage.persisted?.()) || (await navigator.storage.persist?.()) || false;
  await setSetting("storagePersisted", persisted);
}

/*
If the database was just upgraded, keep the copy taken before the upgrade
as a "before an update" snapshot.
*/
async function saveUpgradeSnapshot(): Promise<void> {
  await db.open();
  const pending = takePendingUpgrade();
  if (!pending) return;
  await saveSnapshot("pre-upgrade", { ...pending, movies: [], movieLogs: [] });
}

/*
Runs every automatic backup step. Safe to call often: it skips work when
nothing changed, and never lets one step's failure stop the others.
*/
export async function runAutomaticBackups(): Promise<void> {
  if (running) return;
  running = true;
  try {
    await requestPersistentStorage().catch((error) => console.error(error));
    await saveUpgradeSnapshot().catch((error) => console.error("Upgrade snapshot failed", error));
    await runDailySnapshot().catch((error) => console.error("Snapshot failed", error));
    await runFolderBackup().catch((error) => console.error("Folder backup failed", error));
  } finally {
    running = false;
  }
}

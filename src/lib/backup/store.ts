import Dexie, { type EntityTable } from "dexie";
import type { BackupData } from "./format";
import type { SnapshotKind } from "./retention";

export type Snapshot = {
  id: number;
  createdAt: number;
  /* Local day, YYYY-MM-DD. */
  day: string;
  kind: SnapshotKind;
  entryCount: number;
  tagCount: number;
  /* Missing on snapshots made before movies existed. */
  movieLogCount?: number;
  hash: string;
  data: BackupData;
};

export type SettingRow = { key: string; value: unknown };

/*
A separate database from the journal, so a problem with one
(a bug, a failed upgrade) cannot damage the other.
*/
export const backupDb = new Dexie("life-trail-backups") as Dexie & {
  snapshots: EntityTable<Snapshot, "id">;
  settings: EntityTable<SettingRow, "key">;
};

backupDb.version(1).stores({
  snapshots: "++id, createdAt, day, kind",
  settings: "key",
});

export async function getSetting<T>(key: string): Promise<T | undefined> {
  return (await backupDb.settings.get(key))?.value as T | undefined;
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await backupDb.settings.put({ key, value });
}

export async function deleteSetting(key: string): Promise<void> {
  await backupDb.settings.delete(key);
}

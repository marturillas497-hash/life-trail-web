import { db } from "../db";
import { todayKey } from "../dates";
import { mergeData, type MergePlan } from "./merge";
import { base64ToBytes, bytesToBase64, hasContent, hashData, normalizeData, summarize, type BackupData } from "./format";
import { selectIdsToKeep, type SnapshotKind } from "./retention";
import { backupDb, type Snapshot } from "./store";

/*
Reads the journal in one transaction, so the copy is consistent.
Pictures are only read when asked for, because they are big. Backup files and
the safety copy made before a restore include them. Daily snapshots do not.
*/
export async function readCurrentData(options: { withImages?: boolean } = {}): Promise<BackupData> {
  const data = await db.transaction("r", db.tags, db.entries, db.movies, db.movieLogs, db.images, async () => ({
    tags: await db.tags.orderBy("id").toArray(),
    entries: await db.entries.orderBy("id").toArray(),
    movies: await db.movies.orderBy("id").toArray(),
    movieLogs: await db.movieLogs.orderBy("id").toArray(),
    rows: options.withImages ? await db.images.orderBy("id").toArray() : null,
  }));
  const { rows, ...rest } = data;
  if (!rows) return rest;
  return {
    ...rest,
    images: rows.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      width: row.width,
      height: row.height,
      createdAt: row.createdAt,
      data: bytesToBase64(row.data),
    })),
  };
}

async function prune(kind: SnapshotKind): Promise<void> {
  const rows = await backupDb.snapshots.where("kind").equals(kind).sortBy("createdAt");
  const newestFirst = rows.reverse();
  const keep = selectIdsToKeep(newestFirst, kind);
  const doomed = newestFirst.filter((row) => !keep.has(row.id)).map((row) => row.id);
  if (doomed.length > 0) await backupDb.snapshots.bulkDelete(doomed);
}

function describe(data: BackupData) {
  const { entryCount, tagCount, movieLogCount } = summarize(data);
  return { entryCount, tagCount, movieLogCount, hash: hashData(data) };
}

/* Saves the given data as a snapshot. Returns null if there is nothing in the journal. */
export async function saveSnapshot(kind: SnapshotKind, data: BackupData): Promise<Snapshot | null> {
  if (!hasContent(data)) return null;

  const row = {
    createdAt: Date.now(),
    day: todayKey(),
    kind,
    ...describe(data),
    data,
  };
  const id = await backupDb.snapshots.add(row);
  await prune(kind);
  return { id, ...row };
}

/* Saves a copy of the journal as it is right now. Returns null if there is nothing to save. */
export async function createSnapshot(kind: SnapshotKind): Promise<Snapshot | null> {
  /* The copy made before a restore keeps the pictures too, so the restore can be undone completely. */
  return saveSnapshot(kind, await readCurrentData({ withImages: kind === "pre-restore" }));
}

/*
One automatic snapshot per day. If one already exists for today it is
refreshed with the latest data, so it always reflects the end of the day.
An empty journal (no entries and no movie logs) never produces a snapshot, so a wipe cannot push good
snapshots out through rotation.
*/
export async function runDailySnapshot(): Promise<void> {
  const data = await readCurrentData();
  if (!hasContent(data)) return;

  const info = describe(data);
  const today = todayKey();

  const existing = await backupDb.snapshots
    .where("day")
    .equals(today)
    .and((row) => row.kind === "auto")
    .first();

  if (existing) {
    if (existing.hash !== info.hash) {
      await backupDb.snapshots.update(existing.id, { createdAt: Date.now(), ...info, data });
    }
    return;
  }

  const autos = await backupDb.snapshots.where("kind").equals("auto").sortBy("createdAt");
  const latest = autos[autos.length - 1];
  if (latest && latest.hash === info.hash) return;

  await backupDb.snapshots.add({
    createdAt: Date.now(),
    day: today,
    kind: "auto",
    ...info,
    data,
  });
  await prune("auto");
}

/*
Replaces the whole journal with the given data. The current journal is
saved as a "pre-restore" snapshot first, so a restore can always be undone.
*/
export async function replaceJournal(data: BackupData): Promise<void> {
  await createSnapshot("pre-restore");
  const clean = normalizeData(data);
  /* Decoded before the transaction starts, because it must not wait on anything but the database. */
  const pictures = clean.images?.map((image) => ({
    id: image.id,
    name: image.name,
    type: image.type,
    width: image.width,
    height: image.height,
    createdAt: image.createdAt,
    data: base64ToBytes(image.data),
  }));
  await db.transaction("rw", db.tags, db.entries, db.movies, db.movieLogs, db.images, async () => {
    if (pictures) {
      await db.images.clear();
      await db.images.bulkAdd(pictures);
    }
    await db.tags.clear();
    await db.entries.clear();
    await db.movies.clear();
    await db.movieLogs.clear();
    await db.tags.bulkAdd(clean.tags);
    await db.entries.bulkAdd(clean.entries);
    await db.movies.bulkAdd(clean.movies);
    await db.movieLogs.bulkAdd(clean.movieLogs);
  });
}

export async function restoreSnapshot(id: number): Promise<void> {
  const snapshot = await backupDb.snapshots.get(id);
  if (!snapshot) throw new Error("That snapshot no longer exists.");
  await replaceJournal(snapshot.data);
}

/*
Adds what a snapshot has and the journal lacks, without removing anything. Snapshots
carry no pictures, so picture links in merged entries keep pointing at the pictures
already in this journal.
*/
export async function mergeSnapshot(id: number): Promise<MergePlan> {
  const snapshot = await backupDb.snapshots.get(id);
  if (!snapshot) throw new Error("That snapshot no longer exists.");
  const { merged, plan } = mergeData(await readCurrentData({ withImages: true }), normalizeData(snapshot.data));
  await replaceJournal(merged);
  return plan;
}

/* Older snapshots have no movie lists, so everything is read through normalizeData. */

import { db } from "../db";
import { DEFAULT_TAGS } from "../defaultTags";
import { backupDb } from "../backup/store";

/*
Last resort when both the PIN and the recovery code are lost.
Wipes the journal, the movies, the pictures, the snapshots and every setting, including the lock,
and puts the default tags back. Backup files outside the browser are untouched.
*/
export async function eraseEverything(): Promise<void> {
  await db.transaction("rw", db.tags, db.entries, db.movies, db.movieLogs, db.images, async () => {
    await db.images.clear();
    await db.entries.clear();
    await db.movies.clear();
    await db.movieLogs.clear();
    await db.tags.clear();
    const now = Date.now();
    await db.tags.bulkAdd(DEFAULT_TAGS.map((tag) => ({ ...tag, isArchived: 0, createdAt: now })));
  });
  await backupDb.transaction("rw", backupDb.snapshots, backupDb.settings, async () => {
    await backupDb.snapshots.clear();
    await backupDb.settings.clear();
  });
}

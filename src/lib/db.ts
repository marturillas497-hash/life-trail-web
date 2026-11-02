import Dexie, { type EntityTable } from "dexie";
import { DEFAULT_TAGS } from "./defaultTags";
import type { Entry, Movie, MovieLog, StoredImage, Tag } from "./types";

export const db = new Dexie("life-trail") as Dexie & {
  tags: EntityTable<Tag, "id">;
  entries: EntityTable<Entry, "id">;
  movies: EntityTable<Movie, "id">;
  movieLogs: EntityTable<MovieLog, "id">;
  images: EntityTable<StoredImage, "id">;
};

db.version(1).stores({
  tags: "++id, name, isArchived",
  entries: "++id, date, *tagIds, createdAt",
});

/*
Version 2 adds the movie tables. Before the upgrade changes anything, a copy of
the existing journal is kept in memory, and the backup runner saves it as a
"before an update" snapshot. Movies did not exist yet, so there are none to copy.
*/
type PendingUpgrade = { tags: Tag[]; entries: Entry[] };
let pendingUpgrade: PendingUpgrade | null = null;

export function takePendingUpgrade(): PendingUpgrade | null {
  const pending = pendingUpgrade;
  pendingUpgrade = null;
  return pending;
}

db.version(2)
  .stores({
    movies: "++id, &tmdbId, title",
    movieLogs: "++id, movieId, watchedDate, createdAt",
  })
  .upgrade(async (tx) => {
    pendingUpgrade = {
      tags: await tx.table("tags").toArray(),
      entries: await tx.table("entries").toArray(),
    };
  });

/* Version 3 adds pictures for entries. No existing data changes. */
db.version(3).stores({
  images: "++id, createdAt",
});

/* Runs once, when the database is first created. */
db.on("populate", (tx) => {
  const now = Date.now();
  tx.table("tags").bulkAdd(
    DEFAULT_TAGS.map((tag) => ({ ...tag, isArchived: 0, createdAt: now })),
  );
});

import Dexie, { type EntityTable } from "dexie";
import { DEFAULT_TAGS } from "./defaultTags";
import type { Entry, Tag } from "./types";

export const db = new Dexie("life-trail") as Dexie & {
  tags: EntityTable<Tag, "id">;
  entries: EntityTable<Entry, "id">;
};

db.version(1).stores({
  tags: "++id, name, isArchived",
  entries: "++id, date, *tagIds, createdAt",
});

/* Runs once, when the database is first created. */
db.on("populate", (tx) => {
  const now = Date.now();
  tx.table("tags").bulkAdd(
    DEFAULT_TAGS.map((tag) => ({ ...tag, isArchived: 0, createdAt: now })),
  );
});

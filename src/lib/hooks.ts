"use client";

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";
import type { Tag } from "./types";

/* Newest first. Returns undefined while loading. */
export function useEntries() {
  return useLiveQuery(async () => {
    const all = await db.entries.toArray();
    return all.sort(
      (a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt,
    );
  });
}

/* Returns undefined while loading and null if the entry does not exist. */
export function useEntry(id: number) {
  return useLiveQuery(async () => {
    if (!Number.isInteger(id)) return null;
    return (await db.entries.get(id)) ?? null;
  }, [id]);
}

export function useActiveTags() {
  return useLiveQuery(() => db.tags.where("isArchived").equals(0).sortBy("id"));
}

/* Every tag, archived or not, keyed by id. Used to show tags on old entries. */
export function useTagMap(): Map<number, Tag> | undefined {
  const tags = useLiveQuery(() => db.tags.toArray());
  return useMemo(
    () => (tags ? new Map(tags.map((tag) => [tag.id, tag])) : undefined),
    [tags],
  );
}

"use client";

import { useMemo, useSyncExternalStore } from "react";
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

/* Every tag, archived or not, oldest first. */
export function useAllTags() {
  return useLiveQuery(() => db.tags.orderBy("id").toArray());
}

/* How many entries use each tag, keyed by tag id. */
export function useTagUsage() {
  return useLiveQuery(async () => {
    const counts = new Map<number, number>();
    await db.entries.each((entry) => {
      for (const id of entry.tagIds) counts.set(id, (counts.get(id) ?? 0) + 1);
    });
    return counts;
  });
}

/* Entries whose date falls in the given month. `month` is 0 to 11. */
export function useMonthEntries(year: number, month: number) {
  return useLiveQuery(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
    return db.entries
      .where("date")
      .between(`${prefix}-01`, `${prefix}-31`, true, true)
      .toArray();
  }, [year, month]);
}

const subscribeNothing = () => () => {};

/*
False while the page is prerendered, true in the browser.
Use it to hold back anything that depends on today's date or the locale,
so the server and browser output cannot disagree.
*/
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
}

import { db } from "./db";
import { todayKey } from "./dates";

export type EntryInput = {
  title: string;
  body: string;
  tagIds: number[];
};

/* `date` is the local day as YYYY-MM-DD. It defaults to today. */
export async function createEntry(
  input: EntryInput,
  date: string = todayKey(),
): Promise<number> {
  const now = Date.now();
  return db.entries.add({
    date,
    title: input.title,
    body: input.body,
    tagIds: input.tagIds,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateEntry(id: number, input: EntryInput): Promise<void> {
  await db.entries.update(id, {
    title: input.title,
    body: input.body,
    tagIds: input.tagIds,
    updatedAt: Date.now(),
  });
}

export async function deleteEntry(id: number): Promise<void> {
  await db.entries.delete(id);
}

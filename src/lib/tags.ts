import { db } from "./db";

export type TagInput = {
  name: string;
  emoji: string;
  color: string;
};

export const MAX_TAG_NAME_LENGTH = 24;

/* Throws an Error with a message that is safe to show to the user. */
async function validate(input: TagInput, ignoreId?: number): Promise<TagInput> {
  const name = input.name.trim();
  const emoji = input.emoji.trim();

  if (!name) throw new Error("Give the tag a name.");
  if (name.length > MAX_TAG_NAME_LENGTH) {
    throw new Error(`Keep the name under ${MAX_TAG_NAME_LENGTH + 1} characters.`);
  }
  if (!emoji) throw new Error("Pick an emoji.");

  const all = await db.tags.toArray();
  const clash = all.find(
    (tag) => tag.id !== ignoreId && tag.name.toLowerCase() === name.toLowerCase(),
  );
  if (clash) {
    throw new Error(
      clash.isArchived
        ? "An archived tag already has that name. Restore it instead."
        : "A tag with that name already exists.",
    );
  }

  return { name, emoji, color: input.color };
}

export async function createTag(input: TagInput): Promise<number> {
  const clean = await validate(input);
  return db.tags.add({ ...clean, isArchived: 0, createdAt: Date.now() });
}

export async function updateTag(id: number, input: TagInput): Promise<void> {
  const clean = await validate(input, id);
  await db.tags.update(id, clean);
}

/* Archived tags stay on old entries but are hidden when writing new ones. */
export async function archiveTag(id: number): Promise<void> {
  await db.tags.update(id, { isArchived: 1 });
}

export async function restoreTag(id: number): Promise<void> {
  await db.tags.update(id, { isArchived: 0 });
}

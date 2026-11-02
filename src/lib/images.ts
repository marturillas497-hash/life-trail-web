import { db } from "./db";
import { imageMarkdown, parseImageId, referencedImageIds } from "./markdown";

/* Pictures are shrunk to this many pixels on the longest side before they are stored. */
const MAX_SIDE = 1600;
const MAX_INPUT_BYTES = 20 * 1024 * 1024;
const MAX_GIF_BYTES = 4 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export const IMAGE_ACCEPT = ACCEPTED.join(",");

type Prepared = { blob: Blob; width: number; height: number };

async function prepare(file: File): Promise<Prepared> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;

  /* Animated GIFs would lose their animation if redrawn, so they are stored as they are. */
  if (file.type === "image/gif") {
    bitmap.close();
    if (file.size > MAX_GIF_BYTES) throw new Error("That GIF is bigger than 4 MB.");
    return { blob: file, width, height };
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("This browser could not process the picture.");
  }
  context.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
  bitmap.close();

  const shrunk = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
  /* Keep the original if shrinking did not help, for example a tiny PNG. */
  if (!shrunk || (scale === 1 && shrunk.size >= file.size)) {
    return { blob: file, width, height };
  }
  return { blob: shrunk, width: targetWidth, height: targetHeight };
}

/* Stores a picture and returns the Markdown that shows it. */
export async function addImage(file: File): Promise<string> {
  if (!ACCEPTED.includes(file.type)) {
    throw new Error(`${file.name || "That file"} is not a PNG, JPEG, WebP or GIF picture.`);
  }
  if (file.size > MAX_INPUT_BYTES) throw new Error(`${file.name || "That picture"} is bigger than 20 MB.`);

  const { blob, width, height } = await prepare(file);
  const id = await db.images.add({
    name: file.name || "picture",
    type: blob.type || file.type,
    width,
    height,
    data: await blob.arrayBuffer(),
    createdAt: Date.now(),
  });
  return imageMarkdown(id, file.name || "picture");
}

/* One address per picture for this visit. The addresses are never revoked, which is fine for a few pictures. */
const urlCache = new Map<number, Promise<string | null>>();

export function getImageUrl(id: number): Promise<string | null> {
  let pending = urlCache.get(id);
  if (!pending) {
    pending = db.images.get(id).then((row) => {
      if (!row) {
        urlCache.delete(id);
        return null;
      }
      return URL.createObjectURL(new Blob([row.data], { type: row.type }));
    });
    urlCache.set(id, pending);
  }
  return pending;
}

export async function resolveImageSrc(src: string): Promise<string | null> {
  const id = parseImageId(src);
  if (id !== null) return getImageUrl(id);
  return /^https?:\/\//i.test(src) ? src : null;
}

export type ImageStats = { count: number; bytes: number; unusedCount: number; unusedBytes: number };

export async function readImageStats(): Promise<ImageStats> {
  const [rows, entries] = await Promise.all([db.images.toArray(), db.entries.toArray()]);
  const used = referencedImageIds(entries.map((entry) => entry.body));
  const stats: ImageStats = { count: rows.length, bytes: 0, unusedCount: 0, unusedBytes: 0 };
  for (const row of rows) {
    const size = row.data.byteLength;
    stats.bytes += size;
    if (!used.has(row.id)) {
      stats.unusedCount++;
      stats.unusedBytes += size;
    }
  }
  return stats;
}

/* Deletes pictures that no entry mentions any more. Returns how many were removed. */
export async function removeUnusedImages(): Promise<number> {
  const [ids, entries] = await Promise.all([db.images.toCollection().primaryKeys(), db.entries.toArray()]);
  const used = referencedImageIds(entries.map((entry) => entry.body));
  const doomed = ids.filter((id) => !used.has(id));
  await db.images.bulkDelete(doomed);
  for (const id of doomed) urlCache.delete(id);
  return doomed.length;
}

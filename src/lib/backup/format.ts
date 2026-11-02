import { isValidKey } from "../dates";
import type { Entry, Movie, MovieLog, Tag } from "../types";

export const BACKUP_APP = "life-trail";
/* Version 2 added movies and version 3 added pictures. Older files are still accepted. */
export const BACKUP_VERSION = 3;

/* A picture inside a backup file. The bytes are stored as base64 text. */
export type BackupImage = {
  id: number;
  name: string;
  type: string;
  width: number;
  height: number;
  createdAt: number;
  data: string;
};

export type BackupData = {
  tags: Tag[];
  entries: Entry[];
  movies: Movie[];
  movieLogs: MovieLog[];
  /*
  Left out of snapshots to keep them small. When missing, a restore keeps the pictures
  that are already in the browser. When present, a restore replaces them.
  */
  images?: BackupImage[];
};

/* A journal counts as empty only when it has no entries and no movie logs. */
export const hasContent = (data: BackupData): boolean =>
  data.entries.length > 0 || data.movieLogs.length > 0;

/* Older snapshots and files have no movie lists. */
export function normalizeData(data: Partial<BackupData>): BackupData {
  return {
    tags: data.tags ?? [],
    entries: data.entries ?? [],
    movies: data.movies ?? [],
    movieLogs: data.movieLogs ?? [],
    ...(data.images ? { images: data.images } : {}),
  };
}

/* Base64 helpers that work in the browser and in Node. */
export function bytesToBase64(bytes: ArrayBuffer): string {
  const view = new Uint8Array(bytes);
  let text = "";
  for (let i = 0; i < view.length; i += 0x8000) {
    text += String.fromCharCode(...view.subarray(i, i + 0x8000));
  }
  return btoa(text);
}

export function base64ToBytes(base64: string): ArrayBuffer {
  const text = atob(base64);
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i);
  return bytes.buffer;
}

export type BackupFile = BackupData & {
  app: typeof BACKUP_APP;
  version: number;
  /* Epoch milliseconds. */
  exportedAt: number;
};

export function buildBackupFile(data: BackupData, exportedAt: number = Date.now()): BackupFile {
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt, ...data };
}

export function serializeBackup(file: BackupFile): string {
  return JSON.stringify(file, null, 2);
}

/*
Short fingerprint of the journal contents. Used to skip backups when
nothing changed. Not a security feature.
*/
export function hashData(data: BackupData): string {
  /* Fixed field order, so the same journal always gives the same fingerprint. */
  const hashed: unknown[] = [
    data.tags.map((t) => [t.id, t.name, t.emoji, t.color, t.isArchived, t.createdAt]),
    data.entries.map((e) => [e.id, e.date, e.title, e.body, e.tagIds, e.createdAt, e.updatedAt]),
    data.movies.map((m) => [m.id, m.tmdbId, m.title, m.year, m.overview, m.posterPath, m.posterData, m.createdAt, m.fetchedAt]),
    data.movieLogs.map((l) => [l.id, l.movieId, l.rating, l.opinion, l.watchedDate, l.createdAt, l.updatedAt]),
  ];
  /* Only added when there are pictures, so journals without any keep their old fingerprint. */
  if (data.images && data.images.length > 0) {
    hashed.push(data.images.map((i) => [i.id, i.name, i.type, i.createdAt, i.data.length]));
  }
  const text = JSON.stringify(hashed);
  let h1 = 5381;
  let h2 = 52711;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    h1 = Math.imul(h1, 33) ^ code;
    h2 = Math.imul(h2, 31) ^ code;
  }
  return `${(h1 >>> 0).toString(16)}-${(h2 >>> 0).toString(16)}-${text.length}`;
}

export function summarize(data: BackupData) {
  const dates = data.entries.map((entry) => entry.date).sort();
  return {
    entryCount: data.entries.length,
    tagCount: data.tags.length,
    movieCount: data.movies.length,
    movieLogCount: data.movieLogs.length,
    imageCount: data.images?.length ?? 0,
    firstDate: dates[0] as string | undefined,
    lastDate: dates[dates.length - 1] as string | undefined,
  };
}

type Raw = Record<string, unknown>;

const isObject = (value: unknown): value is Raw =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isInt = (value: unknown): value is number => Number.isInteger(value);
const isNum = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const isStr = (value: unknown): value is string => typeof value === "string";

function parseTag(raw: unknown, index: number): Tag {
  const where = `tag number ${index + 1}`;
  if (!isObject(raw)) throw new Error(`The backup is damaged: ${where} is not valid.`);
  const { id, name, emoji, color, isArchived, createdAt } = raw;
  if (!isInt(id) || id < 1) throw new Error(`The backup is damaged: ${where} has a bad id.`);
  if (!isStr(name) || !name.trim()) throw new Error(`The backup is damaged: ${where} has no name.`);
  if (!isStr(emoji) || !emoji) throw new Error(`The backup is damaged: ${where} has no emoji.`);
  if (!isStr(color)) throw new Error(`The backup is damaged: ${where} has no color.`);
  if (isArchived !== 0 && isArchived !== 1) {
    throw new Error(`The backup is damaged: ${where} has a bad archived flag.`);
  }
  if (!isNum(createdAt)) throw new Error(`The backup is damaged: ${where} has a bad date.`);
  return { id, name, emoji, color, isArchived, createdAt };
}

function parseEntry(raw: unknown, index: number): Entry {
  const where = `entry number ${index + 1}`;
  if (!isObject(raw)) throw new Error(`The backup is damaged: ${where} is not valid.`);
  const { id, date, title, body, tagIds, createdAt, updatedAt } = raw;
  if (!isInt(id) || id < 1) throw new Error(`The backup is damaged: ${where} has a bad id.`);
  if (!isStr(date) || !isValidKey(date)) {
    throw new Error(`The backup is damaged: ${where} has a bad date.`);
  }
  if (!isStr(title) || !isStr(body)) {
    throw new Error(`The backup is damaged: ${where} has bad text.`);
  }
  if (!Array.isArray(tagIds) || !tagIds.every(isInt)) {
    throw new Error(`The backup is damaged: ${where} has bad tags.`);
  }
  if (!isNum(createdAt) || !isNum(updatedAt)) {
    throw new Error(`The backup is damaged: ${where} has bad timestamps.`);
  }
  return { id, date, title, body, tagIds: tagIds as number[], createdAt, updatedAt };
}

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const BASE64 = /^[A-Za-z0-9+/]*={0,2}$/;

function parseImage(raw: unknown, index: number): BackupImage {
  const where = `picture number ${index + 1}`;
  if (!isObject(raw)) throw new Error(`The backup is damaged: ${where} is not valid.`);
  const { id, name, type, width, height, createdAt, data } = raw;
  if (!isInt(id) || id < 1) throw new Error(`The backup is damaged: ${where} has a bad id.`);
  if (!isStr(name)) throw new Error(`The backup is damaged: ${where} has a bad name.`);
  if (!isStr(type) || !IMAGE_TYPES.includes(type)) {
    throw new Error(`The backup is damaged: ${where} has an unsupported type.`);
  }
  if (!isInt(width) || width < 1 || !isInt(height) || height < 1) {
    throw new Error(`The backup is damaged: ${where} has bad dimensions.`);
  }
  if (!isNum(createdAt)) throw new Error(`The backup is damaged: ${where} has a bad date.`);
  if (!isStr(data) || !BASE64.test(data)) throw new Error(`The backup is damaged: ${where} has bad data.`);
  return { id, name, type, width, height, createdAt, data };
}

const isNullableInt = (value: unknown): value is number | null => value === null || isInt(value);

function parseMovie(raw: unknown, index: number): Movie {
  const where = `movie number ${index + 1}`;
  if (!isObject(raw)) throw new Error(`The backup is damaged: ${where} is not valid.`);
  const { id, tmdbId, title, year, overview, posterPath, posterData, createdAt, fetchedAt } = raw;
  if (!isInt(id) || id < 1) throw new Error(`The backup is damaged: ${where} has a bad id.`);
  if (!isNullableInt(tmdbId)) throw new Error(`The backup is damaged: ${where} has a bad TMDB id.`);
  if (!isStr(title) || !title.trim()) throw new Error(`The backup is damaged: ${where} has no title.`);
  if (!isNullableInt(year)) throw new Error(`The backup is damaged: ${where} has a bad year.`);
  if (!isStr(overview)) throw new Error(`The backup is damaged: ${where} has a bad description.`);
  if (posterPath !== null && !isStr(posterPath)) throw new Error(`The backup is damaged: ${where} has a bad poster.`);
  if (posterData !== null && !isStr(posterData)) throw new Error(`The backup is damaged: ${where} has a bad poster.`);
  if (!isNum(createdAt)) throw new Error(`The backup is damaged: ${where} has a bad date.`);
  if (fetchedAt !== null && !isNum(fetchedAt)) throw new Error(`The backup is damaged: ${where} has a bad date.`);
  return { id, tmdbId, title, year, overview, posterPath, posterData, createdAt, fetchedAt };
}

function parseMovieLog(raw: unknown, index: number): MovieLog {
  const where = `movie log number ${index + 1}`;
  if (!isObject(raw)) throw new Error(`The backup is damaged: ${where} is not valid.`);
  const { id, movieId, rating, opinion, watchedDate, createdAt, updatedAt } = raw;
  if (!isInt(id) || id < 1) throw new Error(`The backup is damaged: ${where} has a bad id.`);
  if (!isInt(movieId)) throw new Error(`The backup is damaged: ${where} has a bad movie.`);
  if (!isNum(rating) || rating < 0.5 || rating > 5 || (rating * 2) % 1 !== 0) {
    throw new Error(`The backup is damaged: ${where} has a bad rating.`);
  }
  if (!isStr(opinion)) throw new Error(`The backup is damaged: ${where} has a bad opinion.`);
  if (!isStr(watchedDate) || !isValidKey(watchedDate)) {
    throw new Error(`The backup is damaged: ${where} has a bad date.`);
  }
  if (!isNum(createdAt) || !isNum(updatedAt)) {
    throw new Error(`The backup is damaged: ${where} has bad timestamps.`);
  }
  return { id, movieId, rating, opinion, watchedDate, createdAt, updatedAt };
}

/* Throws an Error with a message that is safe to show to the user. */
export function parseBackup(text: string): BackupFile {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("This file is not a valid backup. It could not be read as JSON.");
  }

  if (!isObject(raw) || raw.app !== BACKUP_APP) {
    throw new Error("This does not look like a Life Trail backup file.");
  }
  if (!isInt(raw.version) || raw.version < 1) {
    throw new Error("This backup has no valid version number.");
  }
  if (raw.version > BACKUP_VERSION) {
    throw new Error(
      "This backup was made by a newer version of Life Trail. Update the app first, then try again.",
    );
  }
  if (!Array.isArray(raw.tags) || !Array.isArray(raw.entries)) {
    throw new Error("The backup is damaged: it is missing its tags or entries.");
  }
  /* Version 1 files predate movies. */
  const rawMovies = raw.movies === undefined && raw.version === 1 ? [] : raw.movies;
  const rawLogs = raw.movieLogs === undefined && raw.version === 1 ? [] : raw.movieLogs;
  if (!Array.isArray(rawMovies) || !Array.isArray(rawLogs)) {
    throw new Error("The backup is damaged: it is missing its movies.");
  }

  /* Files older than version 3 have no pictures. */
  const rawImages = raw.images === undefined ? [] : raw.images;
  if (!Array.isArray(rawImages)) throw new Error("The backup is damaged: its pictures are not a list.");

  const tags = raw.tags.map(parseTag);
  const entries = raw.entries.map(parseEntry);
  const movies = rawMovies.map(parseMovie);
  const movieLogs = rawLogs.map(parseMovieLog);
  const images = rawImages.map(parseImage);
  if (new Set(images.map((image) => image.id)).size !== images.length) {
    throw new Error("The backup is damaged: duplicate picture ids.");
  }

  const tagIdSet = new Set(tags.map((tag) => tag.id));
  if (tagIdSet.size !== tags.length) throw new Error("The backup is damaged: duplicate tag ids.");
  const entryIdSet = new Set(entries.map((entry) => entry.id));
  if (entryIdSet.size !== entries.length) {
    throw new Error("The backup is damaged: duplicate entry ids.");
  }
  for (const entry of entries) {
    for (const tagId of entry.tagIds) {
      if (!tagIdSet.has(tagId)) {
        throw new Error("The backup is damaged: an entry uses a tag that is not in the file.");
      }
    }
  }

  const movieIdSet = new Set(movies.map((movie) => movie.id));
  if (movieIdSet.size !== movies.length) throw new Error("The backup is damaged: duplicate movie ids.");
  if (new Set(movieLogs.map((log) => log.id)).size !== movieLogs.length) {
    throw new Error("The backup is damaged: duplicate movie log ids.");
  }
  for (const log of movieLogs) {
    if (!movieIdSet.has(log.movieId)) {
      throw new Error("The backup is damaged: a movie log points to a movie that is not in the file.");
    }
  }

  return {
    app: BACKUP_APP,
    version: raw.version,
    exportedAt: isNum(raw.exportedAt) ? raw.exportedAt : Date.now(),
    tags,
    entries,
    movies,
    movieLogs,
    images,
  };
}

import type { Entry, Movie, MovieLog, Tag } from "../types";
import type { BackupData, BackupImage } from "./format";

/* What a merge would do, for the preview. Counts are in "things", not rows. */
export type MergePlan = {
  newEntries: number;
  updatedEntries: number;
  unchangedEntries: number;
  newTags: number;
  newMovies: number;
  newViewings: number;
  unchangedViewings: number;
  newPictures: number;
};

export type MergeResult = { merged: BackupData; plan: MergePlan };

const IMAGE_REF = /(!\[[^\]\n]*\]\(image:)(\d+)(\))/g;

const nextId = (items: { id: number }[]) => items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
const tagKey = (tag: Tag) => tag.name.trim().toLowerCase();

function movieKey(movie: Movie): string {
  if (movie.tmdbId !== null) return `${movie.kind}:tmdb:${movie.tmdbId}`;
  return `${movie.kind}:title:${movie.title.trim().toLowerCase()}:${movie.year ?? ""}`;
}

/*
Combines a backup into the journal that is already here, without losing either side.

Who is "the same":
- A tag is the same when its name matches, ignoring capital letters.
- An entry or a viewing is the same when it was created at the same moment (its
  createdAt), which survives backups. If both sides have it, the later edit wins.
- A film or show is the same when its TMDB id matches, or its title and year for
  ones added by hand.
- A picture is the same when it was added at the same moment with the same bytes.

Everything that is only in the backup gets fresh ids above the ones in use, and
the references between them (entry tags, picture links in the text, the film of
a viewing) are rewritten to match. Nothing in the current journal is removed.
*/
export function mergeData(current: BackupData, incoming: BackupData): MergeResult {
  const plan: MergePlan = {
    newEntries: 0,
    updatedEntries: 0,
    unchangedEntries: 0,
    newTags: 0,
    newMovies: 0,
    newViewings: 0,
    unchangedViewings: 0,
    newPictures: 0,
  };

  /* ---- Tags ---- */
  const tags: Tag[] = [...current.tags];
  const tagByName = new Map(tags.map((tag) => [tagKey(tag), tag.id]));
  const tagMap = new Map<number, number>();
  let tagId = nextId(tags);
  for (const tag of incoming.tags) {
    const existing = tagByName.get(tagKey(tag));
    if (existing !== undefined) {
      tagMap.set(tag.id, existing);
      continue;
    }
    const added = { ...tag, id: tagId++ };
    tags.push(added);
    tagByName.set(tagKey(added), added.id);
    tagMap.set(tag.id, added.id);
    plan.newTags++;
  }

  /* ---- Pictures ---- */
  const images: BackupImage[] = [...(current.images ?? [])];
  const imageMap = new Map<number, number>();
  if (incoming.images) {
    let imageId = nextId(images);
    for (const image of incoming.images) {
      const same = images.find(
        (own) => own.createdAt === image.createdAt && own.data.length === image.data.length && own.data === image.data,
      );
      if (same) {
        imageMap.set(image.id, same.id);
        continue;
      }
      const added = { ...image, id: imageId++ };
      images.push(added);
      imageMap.set(image.id, added.id);
      plan.newPictures++;
    }
  }
  const remapBody = (body: string) =>
    body.replace(IMAGE_REF, (whole, open: string, id: string, close: string) => {
      const mapped = imageMap.get(Number(id));
      return mapped === undefined ? whole : `${open}${mapped}${close}`;
    });
  const remapTags = (ids: number[]) => [
    ...new Set(ids.map((id) => tagMap.get(id)).filter((id): id is number => id !== undefined)),
  ];

  /* ---- Entries ---- */
  const entries: Entry[] = [...current.entries];
  const entryAt = new Map(entries.map((entry, index) => [entry.createdAt, index]));
  let entryId = nextId(entries);
  for (const entry of incoming.entries) {
    const converted = { ...entry, body: remapBody(entry.body), tagIds: remapTags(entry.tagIds) };
    const index = entryAt.get(entry.createdAt);
    if (index === undefined) {
      entries.push({ ...converted, id: entryId++ });
      entryAt.set(entry.createdAt, entries.length - 1);
      plan.newEntries++;
    } else if (entry.updatedAt > entries[index].updatedAt) {
      entries[index] = { ...converted, id: entries[index].id };
      plan.updatedEntries++;
    } else {
      plan.unchangedEntries++;
    }
  }

  /* ---- Films and shows ---- */
  const movies: Movie[] = [...current.movies];
  const movieByKey = new Map(movies.map((movie) => [movieKey(movie), movie.id]));
  const movieMap = new Map<number, number>();
  let movieId = nextId(movies);
  for (const movie of incoming.movies) {
    const existing = movieByKey.get(movieKey(movie));
    if (existing !== undefined) {
      movieMap.set(movie.id, existing);
      continue;
    }
    const added = { ...movie, id: movieId++ };
    movies.push(added);
    movieByKey.set(movieKey(added), added.id);
    movieMap.set(movie.id, added.id);
    plan.newMovies++;
  }

  /* ---- Viewings ---- */
  const movieLogs: MovieLog[] = [...current.movieLogs];
  const logAt = new Map(movieLogs.map((log, index) => [log.createdAt, index]));
  let logId = nextId(movieLogs);
  for (const log of incoming.movieLogs) {
    const movieIdForLog = movieMap.get(log.movieId);
    if (movieIdForLog === undefined) continue;
    const index = logAt.get(log.createdAt);
    if (index === undefined) {
      movieLogs.push({ ...log, id: logId++, movieId: movieIdForLog });
      logAt.set(log.createdAt, movieLogs.length - 1);
      plan.newViewings++;
    } else if (log.updatedAt > movieLogs[index].updatedAt) {
      movieLogs[index] = { ...log, id: movieLogs[index].id, movieId: movieIdForLog };
    } else {
      plan.unchangedViewings++;
    }
  }

  const merged: BackupData = { tags, entries, movies, movieLogs, ...(current.images || incoming.images ? { images } : {}) };
  return { merged, plan };
}

/* True when merging would change nothing. */
export const isNoOp = (plan: MergePlan): boolean =>
  plan.newEntries + plan.updatedEntries + plan.newTags + plan.newMovies + plan.newViewings + plan.newPictures === 0;

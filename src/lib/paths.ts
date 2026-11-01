/*
Every page is a static file, so entries are addressed with a query string
(/journal/entry/?id=5) instead of a path segment.
*/

/* Pathnames may or may not end with a slash depending on the host. */
export function normalizePath(path: string): string {
  return path.replace(/\/+$/, "") || "/";
}

export const entryPath = (id: number) => `/journal/entry/?id=${id}`;
export const editEntryPath = (id: number) => `/journal/entry/edit/?id=${id}`;
export const newEntryPath = (date?: string) =>
  date ? `/journal/new/?date=${date}` : "/journal/new/";

/* Returns NaN for anything that is not a whole number. */
export function parseId(raw: string | null): number {
  return raw !== null && /^\d+$/.test(raw) ? Number(raw) : Number.NaN;
}

export const movieLogPath = (id: number) => `/movies/log/?id=${id}`;
export const addMoviePath = (movieId?: number) =>
  movieId === undefined ? "/movies/add/" : `/movies/add/?movieId=${movieId}`;

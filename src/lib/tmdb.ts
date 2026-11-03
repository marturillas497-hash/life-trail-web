import type { MediaKind } from "./types";

export const TMDB_API = "https://api.themoviedb.org/3";
export const TMDB_IMAGES = "https://image.tmdb.org/t/p/";

/* A v4 "API Read Access Token" is sent as a header, a v3 "API Key" as a query value. */
export type TmdbCredential = { kind: "token" | "key"; value: string };

/* A search result, either a film or a show. */
export type TmdbMovie = {
  kind: MediaKind;
  tmdbId: number;
  title: string;
  year: number | null;
  overview: string;
  posterPath: string | null;
};

/* Messages here are safe to show. They never contain the key itself. */
export class TmdbError extends Error {}

export function parseCredential(raw: string | undefined): TmdbCredential | null {
  const value = (raw ?? "").trim();
  if (/^[a-f0-9]{32}$/i.test(value)) return { kind: "key", value };
  if (/^eyJ[\w-]+\.[\w-]+\.[\w-]+$/.test(value)) return { kind: "token", value };
  return null;
}

async function request(
  credential: TmdbCredential,
  path: string,
  params: Record<string, string>,
  signal?: AbortSignal,
): Promise<unknown> {
  /* No slash before the "?", because TMDB's server rejects cross-origin calls to that form. */
  const url = new URL(`${TMDB_API}${path}`);
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);

  const headers: Record<string, string> = { accept: "application/json" };
  if (credential.kind === "token") headers.Authorization = `Bearer ${credential.value}`;
  else url.searchParams.set("api_key", credential.value);

  let response: Response;
  try {
    response = await fetch(url, { headers, signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new TmdbError("Could not reach TMDB. Check your internet connection.");
  }

  if (response.status === 401) {
    throw new TmdbError("TMDB did not accept this key. Check that you copied all of it.");
  }
  if (response.status === 429) {
    throw new TmdbError("TMDB says there were too many requests. Wait a moment and try again.");
  }
  if (!response.ok) throw new TmdbError(`TMDB returned an error (${response.status}).`);

  return response.json();
}

type RawResult = {
  id?: unknown;
  media_type?: unknown;
  title?: unknown;
  name?: unknown;
  release_date?: unknown;
  first_air_date?: unknown;
  overview?: unknown;
  poster_path?: unknown;
};

/* One search over films and shows. People that TMDB also returns are skipped. */
export async function searchTitles(
  credential: TmdbCredential,
  query: string,
  signal?: AbortSignal,
): Promise<TmdbMovie[]> {
  const body = (await request(
    credential,
    "/search/multi",
    { query, include_adult: "false", language: "en-US", page: "1" },
    signal,
  )) as { results?: RawResult[] };

  const results: TmdbMovie[] = [];
  for (const raw of body.results ?? []) {
    const kind: MediaKind | null = raw.media_type === "movie" ? "movie" : raw.media_type === "tv" ? "tv" : null;
    if (!kind || typeof raw.id !== "number") continue;
    const title = kind === "movie" ? raw.title : raw.name;
    if (typeof title !== "string" || !title.trim()) continue;
    const date = kind === "movie" ? raw.release_date : raw.first_air_date;
    results.push({
      kind,
      tmdbId: raw.id,
      title: title.trim(),
      year: typeof date === "string" && /^\d{4}/.test(date) ? Number(date.slice(0, 4)) : null,
      overview: typeof raw.overview === "string" ? raw.overview : "",
      posterPath: typeof raw.poster_path === "string" ? raw.poster_path : null,
    });
  }
  return results;
}

/* A cheap call that only proves the key works. */
export async function checkCredential(credential: TmdbCredential): Promise<void> {
  await request(credential, "/configuration", {});
}

export const posterUrl = (path: string, size: "w92" | "w185" | "w342" | "w780" = "w185") =>
  `${TMDB_IMAGES}${size}${path}`;

const MAX_POSTER_BYTES = 400_000;

/* Copies the poster into the journal so it also shows offline. Returns null if that is not possible. */
export async function fetchPosterData(path: string | null): Promise<string | null> {
  if (!path) return null;
  try {
    const response = await fetch(posterUrl(path, "w185"));
    if (!response.ok) return null;
    const blob = await response.blob();
    if (!blob.type.startsWith("image/") || blob.size > MAX_POSTER_BYTES) return null;
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = "";
    for (let i = 0; i < bytes.length; i += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }
    return `data:${blob.type};base64,${btoa(binary)}`;
  } catch {
    return null;
  }
}

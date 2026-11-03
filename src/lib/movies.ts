import { db } from "./db";
import { isValidKey, todayKey } from "./dates";
import { fetchPosterData, type TmdbMovie } from "./tmdb";
import type { Movie } from "./types";

export type NewMovie = Pick<Movie, "kind" | "tmdbId" | "title" | "year" | "overview" | "posterPath" | "posterData">;

export type LogInput = {
  /* 0.5 to 5 in steps of 0.5. */
  rating: number;
  opinion: string;
  watchedDate: string;
};

/* Throws an Error with a message that is safe to show to the user. */
function cleanLog(input: LogInput): LogInput {
  const { rating } = input;
  if (!Number.isFinite(rating) || rating < 0.5 || rating > 5 || (rating * 2) % 1 !== 0) {
    throw new Error("Choose a rating from half a star to five stars.");
  }
  if (!isValidKey(input.watchedDate)) throw new Error("Choose a valid date.");
  if (input.watchedDate > todayKey()) throw new Error("The date cannot be in the future.");
  return { rating, opinion: input.opinion.trim(), watchedDate: input.watchedDate };
}

/*
Logs a viewing. Pass a new movie to add it to your list (a movie that is already
there, matched by its TMDB id, is reused), or the id of a movie you already have.
Returns the id of the new log.
*/
export async function logMovie(
  target: { movie: NewMovie } | { movieId: number },
  input: LogInput,
): Promise<number> {
  const log = cleanLog(input);

  if ("movie" in target) {
    const title = target.movie.title.trim();
    if (!title) throw new Error(target.movie.kind === "tv" ? "Enter the show's title." : "Enter the movie's title.");
  }

  return db.transaction("rw", db.movies, db.movieLogs, async () => {
    const now = Date.now();
    let movieId: number;

    if ("movieId" in target) {
      if (!(await db.movies.get(target.movieId))) throw new Error("That movie no longer exists.");
      movieId = target.movieId;
    } else {
      const { movie } = target;
      const existing =
        movie.tmdbId !== null
          ? await db.movies.where("[kind+tmdbId]").equals([movie.kind, movie.tmdbId]).first()
          : undefined;
      movieId = existing
        ? existing.id
        : await db.movies.add({
            ...movie,
            title: movie.title.trim(),
            createdAt: now,
            fetchedAt: movie.tmdbId !== null ? now : null,
          });
    }

    return db.movieLogs.add({ movieId, ...log, createdAt: now, updatedAt: now });
  });
}

export async function updateMovieLog(id: number, input: LogInput): Promise<void> {
  const log = cleanLog(input);
  await db.movieLogs.update(id, { ...log, updatedAt: Date.now() });
}

/* Deleting a movie's last log also removes the movie, so nothing is left behind. */
export async function deleteMovieLog(id: number): Promise<void> {
  await db.transaction("rw", db.movies, db.movieLogs, async () => {
    const log = await db.movieLogs.get(id);
    if (!log) return;
    await db.movieLogs.delete(id);
    if ((await db.movieLogs.where("movieId").equals(log.movieId).count()) === 0) {
      await db.movies.delete(log.movieId);
    }
  });
}

/*
Logs a movie or show found on TMDB. The poster is copied into the journal so it shows
offline. If the movie is already on your list, its saved poster is reused.
*/
export async function logTmdbMovie(movie: TmdbMovie, input: LogInput): Promise<number> {
  const known = await db.movies.where("[kind+tmdbId]").equals([movie.kind, movie.tmdbId]).first();
  const posterData = known ? known.posterData : await fetchPosterData(movie.posterPath);
  return logMovie(
    {
      movie: {
        kind: movie.kind,
        tmdbId: movie.tmdbId,
        title: movie.title,
        year: movie.year,
        overview: movie.overview,
        posterPath: movie.posterPath,
        posterData,
      },
    },
    input,
  );
}

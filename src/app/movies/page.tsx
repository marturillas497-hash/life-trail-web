"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MovieCard } from "@/components/movies/MovieCard";
import { TmdbAttribution } from "@/components/movies/TmdbAttribution";
import { Segmented } from "@/components/Segmented";
import { btnPrimary, btnSecondary, inputClass } from "@/components/ui";
import { todayKey } from "@/lib/dates";
import { useMovieLogs } from "@/lib/hooks";
import { addMoviePath } from "@/lib/paths";
import { inRange, rangeFor, rangeTitle, shiftAnchor, type WatchView } from "@/lib/watchPeriod";

type Sort = "recent" | "rating" | "title";

const VIEWS: { value: WatchView; label: string }[] = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
  { value: "all", label: "All" },
];

export default function MoviesPage() {
  const items = useMovieLogs();
  const [sort, setSort] = useState<Sort>("recent");
  const [filter, setFilter] = useState("");
  const [today] = useState(() => todayKey());
  const [view, setView] = useState<WatchView>("all");
  const [anchor, setAnchor] = useState(today);

  const range = useMemo(() => rangeFor(view, anchor), [view, anchor]);
  const title = rangeTitle(view, anchor);
  const atLatest = range === null || range.end >= today;

  /* Switching the view jumps back to the current week, month or year. */
  function changeView(next: WatchView) {
    setView(next);
    setAnchor(today);
  }

  const inPeriod = useMemo(
    () => (items ?? []).filter((item) => inRange(item.log.watchedDate, range)),
    [items, range],
  );

  const stats = useMemo(() => {
    if (inPeriod.length === 0) return null;
    const movieCount = new Set(inPeriod.map((item) => item.movie.id)).size;
    const average = inPeriod.reduce((sum, item) => sum + item.log.rating, 0) / inPeriod.length;
    return { logs: inPeriod.length, movies: movieCount, average };
  }, [inPeriod]);

  const shown = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    const list = needle
      ? inPeriod.filter((item) => item.movie.title.toLowerCase().includes(needle))
      : [...inPeriod];
    list.sort((a, b) => {
      if (sort === "title") return a.movie.title.localeCompare(b.movie.title);
      if (sort === "rating") {
        return b.log.rating - a.log.rating || b.log.watchedDate.localeCompare(a.log.watchedDate);
      }
      return b.log.watchedDate.localeCompare(a.log.watchedDate) || b.log.createdAt - a.log.createdAt;
    });
    return list;
  }, [inPeriod, sort, filter]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl p-4 lg:p-8">
        <header className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold">Movies</h1>
          <Link href={addMoviePath()} className={btnPrimary}>
            Log a movie
          </Link>
        </header>

        {items === undefined ? (
          <p className="mt-6 text-sm text-zinc-500">Loading...</p>
        ) : items.length === 0 ? (
          <p className="mt-10 text-center text-sm text-zinc-500">
            No movies yet.
            <br />
            Log the last one you watched, with your rating and what you thought.
          </p>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <Segmented label="Watched in" value={view} options={VIEWS} onChange={changeView} />
              {view !== "all" && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className={btnSecondary}
                    onClick={() => setAnchor(shiftAnchor(view, anchor, -1))}
                    aria-label="Previous"
                  >
                    &larr;
                  </button>
                  <span className="min-w-40 text-center text-sm font-medium">{title}</span>
                  <button
                    type="button"
                    className={btnSecondary}
                    onClick={() => setAnchor(shiftAnchor(view, anchor, 1))}
                    disabled={atLatest}
                    aria-label="Next"
                  >
                    &rarr;
                  </button>
                </div>
              )}
            </div>

            {stats && (
              <p className="mt-3 text-sm text-zinc-500">
                {stats.movies} {stats.movies === 1 ? "movie" : "movies"}
                {stats.logs !== stats.movies && `, ${stats.logs} viewings`}, average rating{" "}
                {stats.average.toFixed(1)} of 5
              </p>
            )}

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                type="search"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder="Search your movies"
                aria-label="Search your movies"
                className={inputClass}
              />
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as Sort)}
                aria-label="Sort movies"
                className={`${inputClass} sm:w-56`}
              >
                <option value="recent">Recently watched</option>
                <option value="rating">Highest rated</option>
                <option value="title">Title A to Z</option>
              </select>
            </div>

            {inPeriod.length === 0 ? (
              <p className="mt-8 text-center text-sm text-zinc-500">
                No movies watched {view === "all" ? "yet" : `in ${title}`}.
              </p>
            ) : shown.length === 0 ? (
              <p className="mt-8 text-center text-sm text-zinc-500">No movie matches that.</p>
            ) : (
              <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {shown.map((item) => (
                  <li key={item.log.id}>
                    <MovieCard item={item} />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        <TmdbAttribution className="mt-10" />
      </div>
    </div>
  );
}

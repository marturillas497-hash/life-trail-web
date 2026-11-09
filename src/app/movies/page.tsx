"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MovieCard } from "@/components/movies/MovieCard";
import { TmdbAttribution } from "@/components/movies/TmdbAttribution";
import { Segmented } from "@/components/Segmented";
import { btnPrimary, btnSecondary, inputClass } from "@/components/ui";
import { useSetting } from "@/lib/backup/hooks";
import { todayKey } from "@/lib/dates";
import type { MediaKind } from "@/lib/types";
import { useMovieLogs } from "@/lib/hooks";
import { addMoviePath, tmdbSetupPath } from "@/lib/paths";
import { parseCredential } from "@/lib/tmdb";
import { inRange, rangeFor, rangeTitle, shiftAnchor, type WatchView } from "@/lib/watchPeriod";

type Sort = "recent" | "rating" | "title";
type KindFilter = "all" | MediaKind;

const KINDS: { value: KindFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "movie", label: "Movies" },
  { value: "tv", label: "Shows" },
];

const VIEWS: { value: WatchView; label: string }[] = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
  { value: "all", label: "All" },
];

export default function MoviesPage() {
  const items = useMovieLogs();
  const keyRow = useSetting<string>("tmdbKey");
  const [sort, setSort] = useState<Sort>("recent");
  const [filter, setFilter] = useState("");
  const [kind, setKind] = useState<KindFilter>("all");
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

  const ofKind = useMemo(
    () => (kind === "all" ? inPeriod : inPeriod.filter((item) => item.movie.kind === kind)),
    [inPeriod, kind],
  );

  const stats = useMemo(() => {
    if (ofKind.length === 0) return null;
    const unique = new Map(ofKind.map((item) => [item.movie.id, item.movie.kind]));
    const movies = [...unique.values()].filter((value) => value === "movie").length;
    const shows = unique.size - movies;
    const average = ofKind.reduce((sum, item) => sum + item.log.rating, 0) / ofKind.length;
    return { logs: ofKind.length, titles: unique.size, movies, shows, average };
  }, [ofKind]);

  const shown = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    const list = needle
      ? ofKind.filter((item) => item.movie.title.toLowerCase().includes(needle))
      : [...ofKind];
    list.sort((a, b) => {
      if (sort === "title") return a.movie.title.localeCompare(b.movie.title);
      if (sort === "rating") {
        return b.log.rating - a.log.rating || b.log.watchedDate.localeCompare(a.log.watchedDate);
      }
      return b.log.watchedDate.localeCompare(a.log.watchedDate) || b.log.createdAt - a.log.createdAt;
    });
    return list;
  }, [ofKind, sort, filter]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl p-4 lg:p-8">
        <header className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold">Movies/Shows</h1>
          <div className="flex flex-wrap justify-end gap-2">
            <Link href={tmdbSetupPath()} className={btnSecondary}>
              TMDB key
            </Link>
            <Link href={addMoviePath()} className={btnPrimary}>
              Log a movie or show
            </Link>
          </div>
        </header>

        {keyRow !== undefined && !parseCredential(keyRow.value) && (
          <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
            Want to find movies and shows by name, with posters? Connect your free TMDB key.{" "}
            <Link href={tmdbSetupPath()} className="font-medium underline">
              Set up movie search
            </Link>
          </div>
        )}

        {items === undefined ? (
          <p className="mt-6 text-sm text-sand-500">Loading...</p>
        ) : items.length === 0 ? (
          <p className="mt-10 text-center text-sm text-sand-500">
            Your shelf is empty.
            <br />
            Log the last movie or show you watched, with your rating and what you thought.
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
              <p className="mt-3 text-sm text-sand-500">
                {[
                  stats.movies > 0 && `${stats.movies} ${stats.movies === 1 ? "movie" : "movies"}`,
                  stats.shows > 0 && `${stats.shows} ${stats.shows === 1 ? "show" : "shows"}`,
                ]
                  .filter(Boolean)
                  .join(" and ")}
                {stats.logs !== stats.titles && `, ${stats.logs} viewings`}, average rating{" "}
                {stats.average.toFixed(1)} of 5
              </p>
            )}

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Segmented label="Show only" value={kind} options={KINDS} onChange={setKind} />
              <input
                type="search"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder="Search your movies and shows"
                aria-label="Search your movies and shows"
                className={inputClass}
              />
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as Sort)}
                aria-label="Sort"
                className={`${inputClass} sm:w-56`}
              >
                <option value="recent">Recently watched</option>
                <option value="rating">Highest rated</option>
                <option value="title">Title A to Z</option>
              </select>
            </div>

            {ofKind.length === 0 ? (
              <p className="mt-8 text-center text-sm text-sand-500">
                No {kind === "movie" ? "movies" : kind === "tv" ? "shows" : "movies or shows"} watched{" "}
                {view === "all" ? "yet" : `in ${title}`}.
              </p>
            ) : shown.length === 0 ? (
              <p className="mt-8 text-center text-sm text-sand-500">Nothing matches that.</p>
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

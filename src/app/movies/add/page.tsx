"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { KindBadge, kindLabel } from "@/components/movies/KindBadge";
import { MovieLogForm } from "@/components/movies/MovieLogForm";
import { Segmented } from "@/components/Segmented";
import { BackLink } from "@/components/BackLink";
import { Poster } from "@/components/movies/Poster";
import { TmdbAttribution } from "@/components/movies/TmdbAttribution";
import { btnSecondary, inputClass } from "@/components/ui";
import { useSetting } from "@/lib/backup/hooks";
import { useMovie } from "@/lib/hooks";
import { logMovie, logTmdbMovie, type LogInput } from "@/lib/movies";
import { movieLogPath, parseId } from "@/lib/paths";
import { parseCredential, searchTitles, type TmdbMovie } from "@/lib/tmdb";
import type { MediaKind } from "@/lib/types";

type Picked = { kind: "tmdb"; movie: TmdbMovie } | { kind: "manual" };
type SearchState = { query: string; results?: TmdbMovie[]; error?: string };

const MIN_QUERY = 2;

const KIND_OPTIONS: { value: MediaKind; label: string }[] = [
  { value: "movie", label: "Movie" },
  { value: "tv", label: "Show" },
];

export default function AddMoviePage() {
  const router = useRouter();
  const existingId = parseId(useSearchParams().get("movieId"));
  const existing = useMovie(existingId);
  const keyRow = useSetting<string>("tmdbKey");
  const credential = useMemo(() => parseCredential(keyRow?.value), [keyRow]);

  const [query, setQuery] = useState("");
  const [search, setSearch] = useState<SearchState>({ query: "" });
  const [picked, setPicked] = useState<Picked | null>(null);
  const [manualTitle, setManualTitle] = useState("");
  const [manualYear, setManualYear] = useState("");
  const [manualKind, setManualKind] = useState<MediaKind>("movie");

  const text = query.trim();
  const searching = credential !== null && text.length >= MIN_QUERY && picked === null;

  /* Waits for a pause in typing, then searches. Older searches are cancelled. */
  useEffect(() => {
    if (!searching || !credential) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const results = await searchTitles(credential, text, controller.signal);
        setSearch({ query: text, results });
      } catch (error) {
        if (controller.signal.aborted) return;
        setSearch({ query: text, error: error instanceof Error ? error.message : "Search failed." });
      }
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searching, credential, text]);

  const settled = search.query === text;
  const loading = searching && !settled;

  async function submit(values: LogInput) {
    let logId: number;
    if (existing) {
      logId = await logMovie({ movieId: existing.id }, values);
    } else if (picked?.kind === "tmdb") {
      logId = await logTmdbMovie(picked.movie, values);
    } else {
      const year = /^\d{4}$/.test(manualYear.trim()) ? Number(manualYear.trim()) : null;
      logId = await logMovie(
        {
          movie: {
            kind: manualKind,
            tmdbId: null,
            title: manualTitle,
            year,
            overview: "",
            posterPath: null,
            posterData: null,
          },
        },
        values,
      );
    }
    router.replace(movieLogPath(logId));
  }

  /* ---- Logging another viewing of a movie you already have ---- */
  if (Number.isInteger(existingId)) {
    if (existing === undefined) return <p className="p-6 text-sm text-sand-500">Loading...</p>;
    if (existing === null) {
      return (
        <div className="p-6 text-sm">
          <p className="text-sand-500">That title no longer exists.</p>
          <Link href="/movies/" className="mt-2 inline-block text-brand-600 underline">
            Back to movies and shows
          </Link>
        </div>
      );
    }
    return (
      <Shell title="Log another viewing">
        <MovieHeader
          kind={existing.kind}
          title={existing.title}
          year={existing.year}
          posterData={existing.posterData}
          posterPath={existing.posterPath}
        />
        <div className="mt-6">
          <MovieLogForm submitLabel="Save viewing" onSubmit={submit} onCancel={() => router.back()} />
        </div>
      </Shell>
    );
  }

  /* ---- A movie has been chosen: rate it ---- */
  if (picked) {
    const manualBlocked = picked.kind === "manual" && manualTitle.trim() === "";
    return (
      <Shell title={picked.kind === "tmdb" ? `Log a ${kindLabel(picked.movie.kind).toLowerCase()}` : "Log a movie or show"}>
        {picked.kind === "tmdb" ? (
          <MovieHeader
            kind={picked.movie.kind}
            title={picked.movie.title}
            year={picked.movie.year}
            posterData={null}
            posterPath={picked.movie.posterPath}
            overview={picked.movie.overview}
          />
        ) : (
          <div className="space-y-3">
            <Segmented label="Type" value={manualKind} options={KIND_OPTIONS} onChange={setManualKind} />
            <input
              type="text"
              value={manualTitle}
              onChange={(event) => setManualTitle(event.target.value)}
              placeholder={`${kindLabel(manualKind)} title`}
              aria-label={`${kindLabel(manualKind)} title`}
              autoFocus
              className={inputClass}
            />
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={manualYear}
              onChange={(event) => setManualYear(event.target.value.replace(/\D/g, ""))}
              placeholder="Year (optional)"
              aria-label="Year"
              className={`${inputClass} sm:w-40`}
            />
          </div>
        )}
        <div className="mt-6">
          <MovieLogForm
            submitLabel="Save"
            blocked={manualBlocked}
            onSubmit={submit}
            onCancel={() => setPicked(null)}
          />
        </div>
      </Shell>
    );
  }

  /* ---- Search ---- */
  return (
    <Shell title="Log a movie or show">
      {keyRow !== undefined && !credential && (
        <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
          To search for movies and shows, add your free TMDB key on the{" "}
          <Link href="/movies/tmdb/" className="underline">
            movie search setup page
          </Link>
          . Or log one by typing its title below.
        </p>
      )}

      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search for a movie or show"
        aria-label="Search for a movie or show"
        disabled={!credential}
        autoFocus
        className={inputClass}
      />

      <div className="mt-4" aria-live="polite">
        {loading && <p className="text-sm text-sand-500">Searching...</p>}
        {searching && settled && search.error && <p className="text-sm text-red-600">{search.error}</p>}
        {searching && settled && search.results && search.results.length === 0 && (
          <p className="text-sm text-sand-500">Nothing found. Try fewer words.</p>
        )}
        {searching && settled && search.results && search.results.length > 0 && (
          <ul className="space-y-2">
            {search.results.map((movie) => (
              <li key={`${movie.kind}-${movie.tmdbId}`}>
                <button
                  type="button"
                  onClick={() => setPicked({ kind: "tmdb", movie })}
                  className="flex w-full gap-3 rounded-xl border border-sand-200 p-3 text-left transition-colors hover:bg-sand-50 dark:border-sand-800 dark:hover:bg-sand-900"
                >
                  <Poster
                    title={movie.title}
                    posterData={null}
                    posterPath={movie.posterPath}
                    size="w92"
                    className="w-12"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">
                      {movie.title}
                      {movie.year && <span className="font-normal text-sand-500"> ({movie.year})</span>}
                    </span>
                    <KindBadge kind={movie.kind} className="mt-1" />
                    {movie.overview && (
                      <span className="mt-0.5 line-clamp-2 block text-sm text-sand-600 dark:text-sand-400">
                        {movie.overview}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 border-t border-sand-200 pt-4 dark:border-sand-800">
        <p className="mb-2 text-sm text-sand-500">Cannot find it, or offline?</p>
        <button type="button" className={btnSecondary} onClick={() => setPicked({ kind: "manual" })}>
          Type the title myself
        </button>
      </div>

      <TmdbAttribution className="mt-8" />
    </Shell>
  );
}

function Shell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl p-4 lg:p-8">
        <BackLink href="/movies/">Movies/Shows</BackLink>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

function MovieHeader(props: {
  kind: MediaKind;
  title: string;
  year: number | null;
  posterData: string | null;
  posterPath: string | null;
  overview?: string;
}) {
  return (
    <div className="flex gap-4">
      <Poster
        title={props.title}
        posterData={props.posterData}
        posterPath={props.posterPath}
        size="w185"
        className="w-24"
      />
      <div className="min-w-0">
        <KindBadge kind={props.kind} className="mb-1" />
        <div className="text-lg font-semibold">
          {props.title}
          {props.year && <span className="font-normal text-sand-500"> ({props.year})</span>}
        </div>
        {props.overview && (
          <p className="mt-1 line-clamp-4 text-sm text-sand-600 dark:text-sand-400">{props.overview}</p>
        )}
      </div>
    </div>
  );
}

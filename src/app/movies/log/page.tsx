"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { MovieLogForm } from "@/components/movies/MovieLogForm";
import { Poster } from "@/components/movies/Poster";
import { StarDisplay } from "@/components/movies/StarRating";
import { TmdbAttribution } from "@/components/movies/TmdbAttribution";
import { btnPrimary, btnSecondary } from "@/components/ui";
import { formatDateTime, formatFullDate, formatShortDate } from "@/lib/dates";
import { useMovieLog } from "@/lib/hooks";
import { deleteMovieLog, updateMovieLog } from "@/lib/movies";
import { addMoviePath, movieLogPath, parseId } from "@/lib/paths";

/* /movies/log/?id=5 */
export default function MovieLogPage() {
  const router = useRouter();
  const id = parseId(useSearchParams().get("id"));
  const data = useMovieLog(id);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (deleting) return null;
  if (data === undefined) return <p className="p-6 text-sm text-sand-500">Loading...</p>;

  if (data === null) {
    return (
      <div className="p-6 text-sm">
        <p className="text-sand-500">This viewing no longer exists.</p>
        <Link href="/movies/" className="mt-2 inline-block text-brand-600 underline">
          Back to movies
        </Link>
      </div>
    );
  }

  const { log, movie, others } = data;
  const wasEdited = log.updatedAt > log.createdAt;

  async function handleDelete() {
    setConfirming(false);
    setDeleting(true);
    await deleteMovieLog(log.id);
    router.replace("/movies/");
  }

  return (
    <div className="h-full overflow-y-auto">
      <article className="mx-auto max-w-2xl p-4 lg:p-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link href="/movies/" className="text-sm text-brand-600">
            &larr; Movies
          </Link>
          {!editing && (
            <div className="flex gap-2">
              <button type="button" className={btnSecondary} onClick={() => setEditing(true)}>
                Edit
              </button>
              <button type="button" className={btnSecondary} onClick={() => setConfirming(true)}>
                Delete
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <Poster
            title={movie.title}
            posterData={movie.posterData}
            posterPath={movie.posterPath}
            size="w342"
            className="w-28 sm:w-36"
          />
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">
              {movie.title}
              {movie.year && <span className="font-normal text-sand-500"> ({movie.year})</span>}
            </h1>
            {movie.overview && (
              <p className="mt-2 line-clamp-6 text-sm text-sand-600 dark:text-sand-400">
                {movie.overview}
              </p>
            )}
          </div>
        </div>

        {editing ? (
          <div className="mt-6">
            <MovieLogForm
              initial={{ rating: log.rating, opinion: log.opinion, watchedDate: log.watchedDate }}
              submitLabel="Save changes"
              onSubmit={async (values) => {
                await updateMovieLog(log.id, values);
                setEditing(false);
              }}
              onCancel={() => setEditing(false)}
            />
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            <StarDisplay value={log.rating} className="text-3xl" />
            <p className="text-sm text-sand-500">Watched {formatFullDate(log.watchedDate)}</p>
            {log.opinion ? (
              <p className="whitespace-pre-wrap text-base leading-relaxed">{log.opinion}</p>
            ) : (
              <p className="text-sm text-sand-500">No written opinion.</p>
            )}
            {wasEdited && (
              <p className="text-xs text-sand-500">Edited {formatDateTime(log.updatedAt)}</p>
            )}
          </div>
        )}

        {!editing && (
          <div className="mt-8 border-t border-sand-200 pt-6 dark:border-sand-800">
            <h2 className="text-sm font-semibold">Other viewings of this movie</h2>
            {others.length === 0 ? (
              <p className="mt-2 text-sm text-sand-500">This is the only one so far.</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {others.map((other) => (
                  <li key={other.id}>
                    <Link href={movieLogPath(other.id)} className="flex items-center gap-3 text-sm hover:underline">
                      <StarDisplay value={other.rating} />
                      <span className="text-sand-500">{formatShortDate(other.watchedDate)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link href={addMoviePath(movie.id)} className={`${btnPrimary} mt-4`}>
              Log another viewing
            </Link>
          </div>
        )}

        <TmdbAttribution className="mt-10" />

        <ConfirmDialog
          open={confirming}
          title="Delete this viewing?"
          message={
            others.length === 0
              ? "This removes the movie from your list too. It cannot be undone."
              : "The movie and your other viewings stay. This cannot be undone."
          }
          confirmLabel="Delete"
          onConfirm={() => void handleDelete()}
          onCancel={() => setConfirming(false)}
        />
      </article>
    </div>
  );
}

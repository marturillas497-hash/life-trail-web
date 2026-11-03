import Link from "next/link";
import { formatShortDate } from "@/lib/dates";
import { movieLogPath } from "@/lib/paths";
import type { MovieLogWithMovie } from "@/lib/hooks";
import { EnlargeablePoster } from "./EnlargeablePoster";
import { StarDisplay } from "./StarRating";

/*
The whole card opens the viewing page. The poster sits on top of that link and opens
a bigger picture instead, so it gets its own button.
*/
export function MovieCard({ item }: { item: MovieLogWithMovie }) {
  const { log, movie } = item;
  return (
    <div className="relative flex h-[10.5rem] gap-3 overflow-hidden rounded-2xl border border-sand-200 bg-white p-3 shadow-sm hover:border-brand-300 hover:bg-brand-50 dark:border-sand-800 dark:bg-sand-900 dark:shadow-none dark:hover:border-brand-500 dark:hover:bg-sand-800">
      <Link
        href={movieLogPath(log.id)}
        aria-label={`${movie.title}, open details`}
        className="absolute inset-0 rounded-2xl focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-600"
      />
      <EnlargeablePoster
        title={movie.title}
        posterData={movie.posterData}
        posterPath={movie.posterPath}
        className="w-24"
      />
      <div className="pointer-events-none relative min-w-0 flex-1">
        <div className="line-clamp-2 break-words font-medium leading-snug">
          {movie.title}
          {movie.year && <span className="font-normal text-sand-500"> ({movie.year})</span>}
        </div>
        <StarDisplay value={log.rating} className="text-lg" />
        <div className="text-xs text-sand-500">
          {movie.kind === "tv" && <span className="font-medium text-gold-700 dark:text-gold-300">📺 Show · </span>}
          Watched {formatShortDate(log.watchedDate)}
        </div>
        {log.opinion && (
          <p className="mt-1 line-clamp-2 break-words text-sm text-sand-600 dark:text-sand-400">{log.opinion}</p>
        )}
      </div>
    </div>
  );
}

import Link from "next/link";
import { formatShortDate } from "@/lib/dates";
import { movieLogPath } from "@/lib/paths";
import type { MovieLogWithMovie } from "@/lib/hooks";
import { Poster } from "./Poster";
import { StarDisplay } from "./StarRating";

export function MovieCard({ item }: { item: MovieLogWithMovie }) {
  const { log, movie } = item;
  return (
    <Link
      href={movieLogPath(log.id)}
      className="flex h-[10.5rem] gap-3 overflow-hidden rounded-xl border border-zinc-200 p-3 hover:border-indigo-300 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-indigo-800 dark:hover:bg-zinc-900"
    >
      <Poster
        title={movie.title}
        posterData={movie.posterData}
        posterPath={movie.posterPath}
        className="w-24"
      />
      <div className="min-w-0 flex-1">
        <div className="line-clamp-2 break-words font-medium leading-snug">
          {movie.title}
          {movie.year && <span className="font-normal text-zinc-500"> ({movie.year})</span>}
        </div>
        <StarDisplay value={log.rating} className="text-lg" />
        <div className="text-xs text-zinc-500">Watched {formatShortDate(log.watchedDate)}</div>
        {log.opinion && (
          <p className="mt-1 line-clamp-2 break-words text-sm text-zinc-600 dark:text-zinc-400">{log.opinion}</p>
        )}
      </div>
    </Link>
  );
}

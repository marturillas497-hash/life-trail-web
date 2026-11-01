"use client";

import { useState } from "react";
import { posterUrl } from "@/lib/tmdb";

type Props = {
  title: string;
  posterData: string | null;
  posterPath: string | null;
  size?: "w92" | "w185" | "w342";
  className?: string;
};

/*
Shows the poster saved in the journal first, so it works offline. Without one it
falls back to TMDB's server, and without that to a plain placeholder.
*/
export function Poster({ title, posterData, posterPath, size = "w185", className = "" }: Props) {
  const [failed, setFailed] = useState(false);
  const src = failed ? null : (posterData ?? (posterPath ? posterUrl(posterPath, size) : null));
  const frame = `aspect-[2/3] shrink-0 overflow-hidden rounded-md bg-zinc-200 dark:bg-zinc-800 ${className}`;

  if (!src) {
    return (
      <div className={`${frame} flex items-center justify-center text-2xl`} aria-hidden="true">
        🎬
      </div>
    );
  }

  return (
    <div className={frame}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`Poster of ${title}`}
        loading="lazy"
        onError={() => setFailed(true)}
        className="size-full object-cover"
      />
    </div>
  );
}

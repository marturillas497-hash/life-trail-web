"use client";

import { useEffect, useState } from "react";
import { posterUrl } from "@/lib/tmdb";
import { Lightbox } from "../Lightbox";
import { Poster } from "./Poster";

type Props = {
  title: string;
  posterData: string | null;
  posterPath: string | null;
  size?: "w92" | "w185" | "w342";
  className?: string;
};

/*
A poster that opens bigger when pressed. The saved copy shows at once, and a sharper one
is fetched from TMDB when there is a connection.
*/
export function EnlargeablePoster({ title, posterData, posterPath, size, className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const [sharp, setSharp] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !posterPath) return;
    const url = posterUrl(posterPath, "w780");
    const image = new Image();
    image.onload = () => setSharp(url);
    image.src = url;
  }, [open, posterPath]);

  const src = sharp ?? posterData ?? (posterPath ? posterUrl(posterPath, "w342") : null);
  if (!posterData && !posterPath) {
    return <Poster title={title} posterData={posterData} posterPath={posterPath} size={size} className={className} />;
  }

  return (
    <>
      <button
        type="button"
        aria-label={`Enlarge poster of ${title}`}
        title="Click to enlarge"
        onClick={() => setOpen(true)}
        className={`relative z-10 shrink-0 cursor-zoom-in rounded-md hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${className}`}
      >
        <Poster title={title} posterData={posterData} posterPath={posterPath} size={size} className="w-full" />
      </button>
      {open && src && <Lightbox src={src} alt={`Poster of ${title}`} caption={title} onClose={() => setOpen(false)} />}
    </>
  );
}

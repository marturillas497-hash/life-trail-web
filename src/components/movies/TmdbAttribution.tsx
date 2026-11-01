"use client";

import { useState } from "react";
import { useIsClient } from "@/lib/hooks";

/*
TMDB asks apps that use its data to show its logo and this notice.
Save the official logo (from themoviedb.org/about/logos-attribution) as
public/tmdb-logo.svg and it appears here. Until then only the notice shows.
*/
export function TmdbAttribution({ className = "" }: { className?: string }) {
  const [logoMissing, setLogoMissing] = useState(false);
  /* Drawn only once the page is live, so a missing file is noticed and hidden. */
  const isClient = useIsClient();

  return (
    <div className={`flex items-center gap-3 text-xs text-zinc-500 ${className}`}>
      {isClient && !logoMissing && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/tmdb-logo.svg"
          alt="TMDB"
          className="h-3 w-auto shrink-0"
          onError={() => setLogoMissing(true)}
        />
      )}
      <p>
        This product uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise
        approved by TMDB.
      </p>
    </div>
  );
}

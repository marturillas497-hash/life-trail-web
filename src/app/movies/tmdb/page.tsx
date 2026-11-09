"use client";

import type { ReactNode } from "react";
import { BackLink } from "@/components/BackLink";
import { ExternalLink } from "@/components/ExternalLink";
import { TmdbKeyCard } from "@/components/movies/TmdbKeyCard";
import { btnPrimary, cardClass } from "@/components/ui";

type Step = {
  title: string;
  image: { src: string; width: number; height: number; alt: string };
  caption: string;
  body: ReactNode;
};

/* The pictures live in public/tutorial. Replace a file there to change a picture. */
const STEPS: Step[] = [
  {
    title: "Log in to TMDB",
    image: {
      src: "/tutorial/tmdb-1-login.webp",
      width: 505,
      height: 114,
      alt: "The top right corner of themoviedb.org with the Login and Join TMDB buttons outlined in gold",
    },
    caption: "The top right of themoviedb.org. Login and Join TMDB are outlined.",
    body: "Press Login. No account yet? Press Join TMDB, make a free one and confirm your email.",
  },
  {
    title: "Open the API page",
    image: {
      src: "/tutorial/tmdb-2-open-api.webp",
      width: 235,
      height: 470,
      alt: "The TMDB account menu with the round profile button and the API item outlined in gold",
    },
    caption: "The account menu. The round profile button and the API item are outlined.",
    body: "Press the round profile button at the top right, then choose API. The first time, TMDB asks you to request a key. Choose personal, non-commercial use and fill in the short form.",
  },
  {
    title: "Copy your key",
    image: {
      src: "/tutorial/tmdb-3-copy-key.webp",
      width: 655,
      height: 295,
      alt: "The TMDB API page with the API Read Access Token box outlined in gold. The secret text is hidden",
    },
    caption: "The API page. The API Read Access Token box is outlined. The secret text is hidden here.",
    body: "Scroll down and copy the API Read Access Token (very long, starts with eyJ). The API Key just below it (32 letters and numbers) works too. Keep it private.",
  },
];

export default function TmdbSetupPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl p-4 lg:p-8">
        <BackLink href="/movies/">Movies/Shows</BackLink>
        <h1 className="mt-2 text-xl font-semibold">Set up movie search</h1>
        <p className="mt-2 text-sm text-sand-600 dark:text-sand-300">
          Life Trail searches TMDB, a free movie and show database. You need your own free key. It
          takes about two minutes, and the key stays on this device only.
        </p>
        <ExternalLink href="https://www.themoviedb.org/" className={`${btnPrimary} mt-4`}>
          Open themoviedb.org
        </ExternalLink>

        <ol className="mt-6 space-y-6">
          {STEPS.map((step, index) => (
            <li key={step.title} className={cardClass}>
              <h2 className="font-semibold">
                <span className="mr-2 inline-flex size-6 items-center justify-center rounded-full bg-brand-600 text-sm text-white">
                  {index + 1}
                </span>
                {step.title}
              </h2>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={step.image.src}
                alt={step.image.alt}
                width={step.image.width}
                height={step.image.height}
                loading="lazy"
                style={{ maxWidth: step.image.width }}
                className="mt-3 h-auto w-full rounded-lg border border-sand-200 dark:border-sand-700"
              />
              <p className="mt-2 text-xs italic text-sand-500">{step.caption}</p>
              <p className="mt-2 text-sm text-sand-700 dark:text-sand-300">{step.body}</p>
            </li>
          ))}
          <li>
            <h2 className="mb-3 font-semibold">
              <span className="mr-2 inline-flex size-6 items-center justify-center rounded-full bg-brand-600 text-sm text-white">
                4
              </span>
              Paste it here
            </h2>
            <TmdbKeyCard showGuideLink={false} />
          </li>
        </ol>
      </div>
    </div>
  );
}

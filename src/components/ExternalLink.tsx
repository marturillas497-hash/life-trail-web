"use client";

import type { ReactNode } from "react";
import { isNative, openExternal } from "@/lib/native/platform";

/* A link to another website. Inside the Android app it opens in the phone's browser. */
export function ExternalLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={(event) => {
        if (!isNative()) return;
        event.preventDefault();
        void openExternal(href);
      }}
    >
      {children}
    </a>
  );
}

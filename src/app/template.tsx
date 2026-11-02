import type { ReactNode } from "react";

/* A template remounts when the section changes, so each new page fades in. */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="h-full animate-page-in">{children}</div>;
}

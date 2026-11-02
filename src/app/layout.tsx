import type { Metadata, Viewport } from "next";
import { Suspense, type ReactNode } from "react";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Life Trail",
  description: "A private, offline-first journal.",
  applicationName: "Life Trail",
  /* A personal app: keep it out of search engines. */
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "Life Trail", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#102e46" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1c2b" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        {/* Required by Next.js 16 because the shell reads the current URL. */}
        <Suspense fallback={<p className="p-6 text-sm text-zinc-500">Loading...</p>}>
          <AppShell>{children}</AppShell>
        </Suspense>
      </body>
    </html>
  );
}

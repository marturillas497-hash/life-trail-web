import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Life Trail",
  description: "A private, offline-first journal.",
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

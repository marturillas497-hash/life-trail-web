"use client";

import { useEffect } from "react";
import { runAutomaticBackups } from "@/lib/backup/runner";

/* Starts the automatic backups when the app opens and again when you leave the tab. */
export function BackupRunner() {
  useEffect(() => {
    void runAutomaticBackups();

    const onVisibility = () => {
      if (document.visibilityState === "hidden") void runAutomaticBackups();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return null;
}

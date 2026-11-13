"use client";

import { useEffect, useState } from "react";
import { isNative } from "../native/platform";
import { loadGoogleScript } from "./drive";
import { useSetting } from "./hooks";

/*
The saved Google client ID (undefined until loaded, null if none) and whether Google's
sign-in script has finished loading. The script is only fetched once a client ID is
saved, so people who never use Drive backup never contact Google.
*/
export function useDriveSetup(): { clientId: string | null | undefined; ready: boolean; loadError: string | null } {
  const saved = useSetting<string>("driveClientId");
  const clientId = saved === undefined ? undefined : (saved.value ?? null);
  const [loaded, setLoaded] = useState<{ ready: boolean; error: string | null }>({ ready: false, error: null });

  useEffect(() => {
    /* Google Drive backup is for the website. The app never contacts Google. */
    if (!clientId || isNative()) return;
    let cancelled = false;
    loadGoogleScript().then(
      () => {
        if (!cancelled) setLoaded({ ready: true, error: null });
      },
      (error: unknown) => {
        if (!cancelled) setLoaded({ ready: false, error: error instanceof Error ? error.message : "Could not load Google sign-in." });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  return { clientId, ready: loaded.ready, loadError: loaded.error };
}

"use client";

import { useEffect, useState } from "react";
import { isNative } from "../native/platform";
import { loadGoogleScript } from "./drive";
import { BUILT_IN_GOOGLE_CLIENT_ID } from "./driveConfig";
import { useSetting } from "./hooks";

export type DriveSetup = {
  loading: boolean;
  /* The client ID in use: one the person pasted, else the app's built in one, else null. */
  clientId: string | null;
  /* True when the app ships with its own client ID. */
  hasBuiltIn: boolean;
  /* True when the person pasted their own, which wins over the built in one. */
  hasOverride: boolean;
  /* True once the person has signed in to Drive. Only then is Google's script fetched. */
  enabled: boolean;
  /* Google's sign in script has loaded. */
  ready: boolean;
  loadError: string | null;
};

/*
Google's script is only fetched after the person has switched Drive backup on, so nobody
who never uses it contacts Google. It is fetched again when the device comes back online.
The Android app never loads it.
*/
export function useDriveSetup(): DriveSetup {
  const savedId = useSetting<string>("driveClientId");
  const savedEnabled = useSetting<boolean>("driveEnabled");
  const [loaded, setLoaded] = useState<{ ready: boolean; error: string | null }>({ ready: false, error: null });

  const loading = savedId === undefined || savedEnabled === undefined;
  const override = savedId?.value ?? null;
  const hasBuiltIn = BUILT_IN_GOOGLE_CLIENT_ID !== "";
  const clientId = override ?? (hasBuiltIn ? BUILT_IN_GOOGLE_CLIENT_ID : null);
  const enabled = savedEnabled?.value === true && clientId !== null && !isNative();

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const load = () => {
      loadGoogleScript().then(
        () => {
          if (!cancelled) setLoaded({ ready: true, error: null });
        },
        (error: unknown) => {
          if (!cancelled) setLoaded({ ready: false, error: error instanceof Error ? error.message : "Could not load Google sign-in." });
        },
      );
    };
    load();
    window.addEventListener("online", load);
    return () => {
      cancelled = true;
      window.removeEventListener("online", load);
    };
  }, [enabled]);

  return {
    loading,
    clientId,
    hasBuiltIn,
    hasOverride: override !== null,
    enabled,
    ready: enabled && loaded.ready,
    loadError: enabled ? loaded.error : null,
  };
}

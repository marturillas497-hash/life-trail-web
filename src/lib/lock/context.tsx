"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { checkPin, type CheckResult } from "./actions";
import { getLockConfig, type LockConfig } from "./store";

/*
loading: still reading the settings
disabled: no app lock is set up
locked / unlocked: the app lock is on
*/
export type LockStatus = "loading" | "disabled" | "locked" | "unlocked";

type LockContextValue = {
  status: LockStatus;
  config: LockConfig | undefined;
  unlock: (pin: string) => Promise<CheckResult>;
  lockNow: () => void;
  /* Call after setting up or recovering, so the person is not asked right away. */
  markUnlocked: () => void;
};

const LockContext = createContext<LockContextValue | null>(null);

export function useLock(): LockContextValue {
  const value = useContext(LockContext);
  if (!value) throw new Error("useLock must be used inside LockProvider");
  return value;
}

export function LockProvider({ children }: { children: ReactNode }) {
  /* Every fresh load starts locked, so this begins false. */
  const [unlocked, setUnlocked] = useState(false);
  const row = useLiveQuery(async () => ({ config: await getLockConfig() }));

  const config = row?.config;
  const autoLockSeconds = config?.autoLockSeconds ?? -1;
  const status: LockStatus =
    row === undefined ? "loading" : !config ? "disabled" : unlocked ? "unlocked" : "locked";

  /* Lock again after being away from the app for long enough. */
  useEffect(() => {
    let hiddenAt: number | null = null;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
        return;
      }
      if (hiddenAt === null) return;
      const awayMs = Date.now() - hiddenAt;
      hiddenAt = null;
      if (autoLockSeconds >= 0 && awayMs >= autoLockSeconds * 1000) setUnlocked(false);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [autoLockSeconds]);

  const unlock = useCallback(async (pin: string) => {
    const result = await checkPin(pin);
    if (result.ok) setUnlocked(true);
    return result;
  }, []);

  const value = useMemo<LockContextValue>(
    () => ({
      status,
      config,
      unlock,
      lockNow: () => setUnlocked(false),
      markUnlocked: () => setUnlocked(true),
    }),
    [status, config, unlock],
  );

  return <LockContext.Provider value={value}>{children}</LockContext.Provider>;
}

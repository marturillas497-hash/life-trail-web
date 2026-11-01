import { deleteSetting, getSetting, setSetting } from "../backup/store";
import type { HashRecord } from "./crypto";

export type LockConfig = {
  pin: HashRecord;
  recovery: HashRecord;
  /* Seconds away before locking again. -1 means only lock when the app opens. */
  autoLockSeconds: number;
  failedAttempts: number;
  /* Epoch milliseconds, 0 when not locked out. */
  lockedUntil: number;
};

const KEY = "appLock";

export async function getLockConfig(): Promise<LockConfig | undefined> {
  return getSetting<LockConfig>(KEY);
}

export async function saveLockConfig(config: LockConfig): Promise<void> {
  await setSetting(KEY, config);
}

export async function removeLockConfig(): Promise<void> {
  await deleteSetting(KEY);
}

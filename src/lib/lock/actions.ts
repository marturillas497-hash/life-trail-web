import {
  generateRecoveryCode,
  hashSecret,
  isValidPin,
  normalizeRecoveryCode,
  verifySecret,
  type HashRecord,
} from "./crypto";
import { getLockConfig, removeLockConfig, saveLockConfig, type LockConfig } from "./store";

export type CheckResult = { ok: true } | { ok: false; message: string };

export const DEFAULT_AUTO_LOCK_SECONDS = 60;
const ATTEMPTS_PER_BATCH = 5;
const BASE_LOCKOUT_MS = 30_000;
const MAX_LOCKOUT_MS = 10 * 60_000;

function waitText(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  return seconds >= 60 ? `${Math.ceil(seconds / 60)} min` : `${seconds} s`;
}

/*
Checks a PIN or recovery code. Every 5 wrong tries in a row lock out further
tries for longer each time (30 s, 1 min, 2 min ... up to 10 min).
*/
async function guarded(
  secret: string,
  pick: (config: LockConfig) => HashRecord,
  wrongMessage: string,
): Promise<CheckResult> {
  const config = await getLockConfig();
  if (!config) return { ok: true };

  const now = Date.now();
  if (config.lockedUntil > now) {
    return { ok: false, message: `Too many wrong tries. Try again in ${waitText(config.lockedUntil - now)}.` };
  }

  if (await verifySecret(secret, pick(config))) {
    if (config.failedAttempts !== 0 || config.lockedUntil !== 0) {
      await saveLockConfig({ ...config, failedAttempts: 0, lockedUntil: 0 });
    }
    return { ok: true };
  }

  const failedAttempts = config.failedAttempts + 1;
  const batch = failedAttempts / ATTEMPTS_PER_BATCH;
  const lockedUntil = Number.isInteger(batch)
    ? now + Math.min(BASE_LOCKOUT_MS * 2 ** (batch - 1), MAX_LOCKOUT_MS)
    : 0;
  await saveLockConfig({ ...config, failedAttempts, lockedUntil });

  return {
    ok: false,
    message: lockedUntil
      ? `Too many wrong tries. Try again in ${waitText(lockedUntil - now)}.`
      : wrongMessage,
  };
}

export const checkPin = (pin: string) =>
  guarded(pin, (config) => config.pin, "That PIN is not correct.");

export const checkRecoveryCode = (code: string) =>
  guarded(normalizeRecoveryCode(code), (config) => config.recovery, "That recovery code is not correct.");

/* Turns the lock on. Returns nothing: the recovery code is made up front so it can be shown first. */
export async function enableLock(pin: string, recoveryCode: string): Promise<void> {
  if (!isValidPin(pin)) throw new Error("The PIN must be 4 to 8 digits.");
  await saveLockConfig({
    pin: await hashSecret(pin),
    recovery: await hashSecret(normalizeRecoveryCode(recoveryCode)),
    autoLockSeconds: DEFAULT_AUTO_LOCK_SECONDS,
    failedAttempts: 0,
    lockedUntil: 0,
  });
}

export async function changePin(currentPin: string, newPin: string): Promise<CheckResult> {
  if (!isValidPin(newPin)) return { ok: false, message: "The new PIN must be 4 to 8 digits." };
  const check = await checkPin(currentPin);
  if (!check.ok) return check;
  const config = await getLockConfig();
  if (!config) return { ok: false, message: "The app lock is not turned on." };
  await saveLockConfig({ ...config, pin: await hashSecret(newPin) });
  return { ok: true };
}

/* Replaces the recovery code. The old one stops working. */
export async function replaceRecoveryCode(pin: string, newCode: string): Promise<CheckResult> {
  const check = await checkPin(pin);
  if (!check.ok) return check;
  const config = await getLockConfig();
  if (!config) return { ok: false, message: "The app lock is not turned on." };
  await saveLockConfig({ ...config, recovery: await hashSecret(normalizeRecoveryCode(newCode)) });
  return { ok: true };
}

/* Sets a new PIN using the recovery code, and replaces the code. */
export async function recoverWithCode(
  code: string,
  newPin: string,
  newCode: string,
): Promise<CheckResult> {
  if (!isValidPin(newPin)) return { ok: false, message: "The new PIN must be 4 to 8 digits." };
  const check = await checkRecoveryCode(code);
  if (!check.ok) return check;
  const config = await getLockConfig();
  if (!config) return { ok: true };
  await saveLockConfig({
    ...config,
    pin: await hashSecret(newPin),
    recovery: await hashSecret(normalizeRecoveryCode(newCode)),
    failedAttempts: 0,
    lockedUntil: 0,
  });
  return { ok: true };
}

export async function setAutoLockSeconds(seconds: number): Promise<void> {
  const config = await getLockConfig();
  if (config) await saveLockConfig({ ...config, autoLockSeconds: seconds });
}

export async function disableLock(pin: string): Promise<CheckResult> {
  const check = await checkPin(pin);
  if (!check.ok) return check;
  await removeLockConfig();
  return { ok: true };
}

export { generateRecoveryCode };

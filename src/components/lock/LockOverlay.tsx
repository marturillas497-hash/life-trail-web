"use client";

import { useState } from "react";
import { generateRecoveryCode, recoverWithCode } from "@/lib/lock/actions";
import { isValidPin } from "@/lib/lock/crypto";
import { useLock } from "@/lib/lock/context";
import { eraseEverything } from "@/lib/lock/erase";
import { PinField } from "./PinField";
import { RecoveryCodeBox } from "./RecoveryCodeBox";
import { btnDanger, btnPrimary, btnSecondary, inputClass } from "../ui";

type View = "enter" | "forgot" | "newCode" | "erase";

/* Covers the whole app while it is locked. The app underneath stays mounted, so a draft survives. */
export function LockOverlay() {
  const { status, unlock, markUnlocked } = useLock();
  const [view, setView] = useState<View>("enter");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [code, setCode] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [freshCode, setFreshCode] = useState("");
  const [eraseText, setEraseText] = useState("");

  if (status !== "loading" && status !== "locked") return null;

  const shell = "fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-sand-50 p-6 dark:bg-sand-950";
  if (status === "loading") return <div className={shell} aria-hidden="true" />;

  function goTo(next: View) {
    setView(next);
    setError(null);
  }

  async function submitPin() {
    setBusy(true);
    setError(null);
    const result = await unlock(pin);
    setBusy(false);
    setPin("");
    if (!result.ok) setError(result.message);
  }

  async function submitRecovery() {
    setError(null);
    if (!isValidPin(newPin)) return setError("The new PIN must be 4 to 8 digits.");
    if (newPin !== confirmPin) return setError("The two PINs do not match.");
    setBusy(true);
    const replacement = generateRecoveryCode();
    const result = await recoverWithCode(code, newPin, replacement);
    setBusy(false);
    if (!result.ok) return setError(result.message);
    setFreshCode(replacement);
    goTo("newCode");
  }

  async function submitErase() {
    setBusy(true);
    await eraseEverything();
    setBusy(false);
  }

  return (
    <div className={shell} role="dialog" aria-modal="true" aria-label="App locked">
      <div className="w-full max-w-sm space-y-5">
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="" width={96} height={96} className="mx-auto h-24 w-24" />
          <h1 className="mt-2 text-xl font-semibold">Life Trail is locked</h1>
        </div>

        {view === "enter" && (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (pin.length >= 4) void submitPin();
            }}
          >
            <PinField value={pin} onChange={setPin} label="Enter your PIN" autoFocus />
            {error && <p className="text-center text-sm text-red-600">{error}</p>}
            <button type="submit" className={`${btnPrimary} w-full`} disabled={busy || pin.length < 4}>
              Unlock
            </button>
            <button
              type="button"
              className="block w-full text-center text-sm text-sand-500 underline"
              onClick={() => goTo("forgot")}
            >
              Forgot your PIN?
            </button>
          </form>
        )}

        {view === "forgot" && (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void submitRecovery();
            }}
          >
            <p className="text-sm text-sand-600 dark:text-sand-300">
              Enter your recovery code and choose a new PIN.
            </p>
            <input
              type="text"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              aria-label="Recovery code"
              autoComplete="off"
              autoCapitalize="characters"
              className={`${inputClass} text-center font-mono`}
            />
            <PinField value={newPin} onChange={setNewPin} label="New PIN" />
            <PinField value={confirmPin} onChange={setConfirmPin} label="Repeat new PIN" />
            {error && <p className="text-center text-sm text-red-600">{error}</p>}
            <button type="submit" className={`${btnPrimary} w-full`} disabled={busy}>
              Set new PIN
            </button>
            <button type="button" className={`${btnSecondary} w-full`} onClick={() => goTo("enter")}>
              Back
            </button>
            <button
              type="button"
              className="block w-full text-center text-sm text-sand-500 underline"
              onClick={() => goTo("erase")}
            >
              I do not have my recovery code
            </button>
          </form>
        )}

        {view === "newCode" && (
          <RecoveryCodeBox
            code={freshCode}
            confirmLabel="Continue to my journal"
            onConfirm={() => {
              markUnlocked();
              goTo("enter");
            }}
          />
        )}

        {view === "erase" && (
          <div className="space-y-4">
            <p className="text-sm text-sand-600 dark:text-sand-300">
              Without the PIN or the recovery code, the only way back in is to erase everything in
              this browser: your entries, tags, snapshots and settings. Backup files you saved
              outside the browser are not touched, and you can restore from them afterwards.
            </p>
            <p className="text-sm font-medium">Type ERASE to confirm.</p>
            <input
              type="text"
              value={eraseText}
              onChange={(event) => setEraseText(event.target.value)}
              aria-label="Type ERASE to confirm"
              autoComplete="off"
              className={inputClass}
            />
            <button
              type="button"
              className={`${btnDanger} w-full`}
              disabled={busy || eraseText !== "ERASE"}
              onClick={() => void submitErase()}
            >
              Erase everything
            </button>
            <button type="button" className={`${btnSecondary} w-full`} onClick={() => goTo("forgot")}>
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

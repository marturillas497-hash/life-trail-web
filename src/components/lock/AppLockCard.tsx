"use client";

import { useState } from "react";
import {
  changePin,
  disableLock,
  enableLock,
  generateRecoveryCode,
  replaceRecoveryCode,
  setAutoLockSeconds,
} from "@/lib/lock/actions";
import { isValidPin, lockAvailable } from "@/lib/lock/crypto";
import { useLock } from "@/lib/lock/context";
import { PinField } from "./PinField";
import { RecoveryCodeBox } from "./RecoveryCodeBox";
import { btnPrimary, btnSecondary, cardClass, inputClass } from "../ui";

const AUTO_LOCK_OPTIONS = [
  { seconds: 0, label: "As soon as I leave the app" },
  { seconds: 60, label: "After 1 minute away" },
  { seconds: 300, label: "After 5 minutes away" },
  { seconds: 900, label: "After 15 minutes away" },
  { seconds: -1, label: "Only when the app opens" },
];

type Mode = "idle" | "setup" | "setupCode" | "changePin" | "newCode" | "newCodeShown" | "turnOff";

export function AppLockCard() {
  const { status, config, lockNow, markUnlocked } = useLock();
  const [mode, setMode] = useState<Mode>("idle");
  const [current, setCurrent] = useState("");
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [available] = useState(() => lockAvailable());

  function reset(next: Mode = "idle") {
    setMode(next);
    setCurrent("");
    setPin("");
    setConfirm("");
    setError(null);
  }

  function checkNewPin(): boolean {
    if (!isValidPin(pin)) {
      setError("The PIN must be 4 to 8 digits.");
      return false;
    }
    if (pin !== confirm) {
      setError("The two PINs do not match.");
      return false;
    }
    return true;
  }

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const enabled = status === "locked" || status === "unlocked";

  return (
    <section className={cardClass}>
      <h2 className="font-semibold">App lock</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Asks for a PIN when the app opens. It keeps casual snoopers out. It does not encrypt your
        data, so anyone with full access to this device&apos;s browser data could still read it.
      </p>

      {!available && (
        <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
          The app lock needs a secure page. It works on https addresses and on localhost, but not
          on plain http addresses such as a computer&apos;s network address.
        </p>
      )}

      {message && <p className="mt-3 text-sm text-green-700 dark:text-green-400">{message}</p>}

      {available && status === "loading" && <p className="mt-3 text-sm text-zinc-500">Loading...</p>}

      {available && status === "disabled" && mode === "idle" && (
        <div className="mt-4">
          <button type="button" className={btnPrimary} onClick={() => { setMessage(null); reset("setup"); }}>
            Set up a PIN
          </button>
        </div>
      )}

      {mode === "setup" && (
        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!checkNewPin()) return;
            setCode(generateRecoveryCode());
            setError(null);
            setMode("setupCode");
          }}
        >
          <PinField value={pin} onChange={setPin} label="Choose a PIN (4 to 8 digits)" autoFocus />
          <PinField value={confirm} onChange={setConfirm} label="Repeat the PIN" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" className={btnPrimary}>
              Continue
            </button>
            <button type="button" className={btnSecondary} onClick={() => reset()}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {mode === "setupCode" && (
        <div className="mt-4">
          <RecoveryCodeBox
            code={code}
            confirmLabel="Turn on app lock"
            onCancel={() => reset()}
            onConfirm={() =>
              void run(async () => {
                await enableLock(pin, code);
                markUnlocked();
                setMessage("App lock is on.");
                reset();
              })
            }
          />
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>
      )}

      {enabled && mode === "idle" && (
        <div className="mt-4 space-y-4">
          <p className="text-sm font-medium text-green-700 dark:text-green-400">App lock is on.</p>

          <label className="block text-sm">
            <span className="mb-1 block text-zinc-500">Lock the app</span>
            <select
              value={config?.autoLockSeconds ?? 60}
              onChange={(event) => void setAutoLockSeconds(Number(event.target.value))}
              className={inputClass}
            >
              {AUTO_LOCK_OPTIONS.map((option) => (
                <option key={option.seconds} value={option.seconds}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap gap-3">
            <button type="button" className={btnPrimary} onClick={lockNow}>
              Lock now
            </button>
            <button type="button" className={btnSecondary} onClick={() => { setMessage(null); reset("changePin"); }}>
              Change PIN
            </button>
            <button type="button" className={btnSecondary} onClick={() => { setMessage(null); reset("newCode"); }}>
              New recovery code
            </button>
            <button type="button" className={btnSecondary} onClick={() => { setMessage(null); reset("turnOff"); }}>
              Turn off
            </button>
          </div>
        </div>
      )}

      {mode === "changePin" && (
        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!checkNewPin()) return;
            void run(async () => {
              const result = await changePin(current, pin);
              if (!result.ok) return setError(result.message);
              setMessage("PIN changed.");
              reset();
            });
          }}
        >
          <PinField value={current} onChange={setCurrent} label="Current PIN" autoFocus />
          <PinField value={pin} onChange={setPin} label="New PIN" />
          <PinField value={confirm} onChange={setConfirm} label="Repeat the new PIN" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" className={btnPrimary} disabled={busy}>
              Change PIN
            </button>
            <button type="button" className={btnSecondary} onClick={() => reset()}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {mode === "newCode" && (
        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void run(async () => {
              const fresh = generateRecoveryCode();
              const result = await replaceRecoveryCode(current, fresh);
              if (!result.ok) return setError(result.message);
              setCode(fresh);
              setMode("newCodeShown");
            });
          }}
        >
          <p className="text-sm text-zinc-500">Enter your PIN. The old recovery code will stop working.</p>
          <PinField value={current} onChange={setCurrent} label="Current PIN" autoFocus />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" className={btnPrimary} disabled={busy}>
              Make a new code
            </button>
            <button type="button" className={btnSecondary} onClick={() => reset()}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {mode === "newCodeShown" && (
        <div className="mt-4">
          <RecoveryCodeBox
            code={code}
            confirmLabel="Done"
            onConfirm={() => {
              setMessage("Recovery code replaced.");
              reset();
            }}
          />
        </div>
      )}

      {mode === "turnOff" && (
        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void run(async () => {
              const result = await disableLock(current);
              if (!result.ok) return setError(result.message);
              setMessage("App lock is off.");
              reset();
            });
          }}
        >
          <p className="text-sm text-zinc-500">Enter your PIN to turn the app lock off.</p>
          <PinField value={current} onChange={setCurrent} label="Current PIN" autoFocus />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" className={btnPrimary} disabled={busy}>
              Turn off
            </button>
            <button type="button" className={btnSecondary} onClick={() => reset()}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

"use client";

import { useState } from "react";
import { btnPrimary, btnSecondary } from "../ui";

type Props = {
  code: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel?: () => void;
};

/* Shows a recovery code once and makes the person confirm they saved it. */
export function RecoveryCodeBox({ code, confirmLabel, onConfirm, onCancel }: Props) {
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        This is your recovery code. If you forget your PIN, it is the only way back in without
        erasing the journal. It is shown once, so write it down or save it in a password manager.
      </p>
      <p
        className="rounded-lg bg-zinc-100 p-4 text-center font-mono text-xl tracking-wider dark:bg-zinc-800"
        data-testid="recovery-code"
      >
        {code}
      </p>
      <button type="button" className={btnSecondary} onClick={() => void copy()}>
        {copied ? "Copied" : "Copy code"}
      </button>
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={saved}
          onChange={(event) => setSaved(event.target.checked)}
          className="mt-0.5 size-4"
        />
        I have saved this code somewhere safe.
      </label>
      <div className="flex gap-3">
        <button type="button" className={btnPrimary} disabled={!saved} onClick={onConfirm}>
          {confirmLabel}
        </button>
        {onCancel && (
          <button type="button" className={btnSecondary} onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

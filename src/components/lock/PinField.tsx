"use client";

import { inputClass } from "../ui";

type Props = {
  value: string;
  onChange: (value: string) => void;
  label: string;
  autoFocus?: boolean;
  autoComplete?: string;
};

/* Numeric keypad on phones, digits only, 4 to 8 long. */
export function PinField({ value, onChange, label, autoFocus, autoComplete = "off" }: Props) {
  return (
    <input
      type="password"
      inputMode="numeric"
      pattern="[0-9]*"
      maxLength={8}
      value={value}
      onChange={(event) => onChange(event.target.value.replace(/\D/g, ""))}
      placeholder={label}
      aria-label={label}
      autoFocus={autoFocus}
      autoComplete={autoComplete}
      className={`${inputClass} text-center ${value ? "text-xl tracking-[0.4em]" : "text-base"}`}
    />
  );
}

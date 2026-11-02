"use client";

import { useEffect, useRef } from "react";

type Props = {
  src: string;
  alt: string;
  caption?: string;
  onClose: () => void;
};

/* A full screen picture viewer. Click anywhere, press Escape, or use the close button to leave. */
export function Lightbox({ src, alt, caption, onClose }: Props) {
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeButton.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      className="fixed inset-0 z-50 flex animate-fade-in flex-col items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <button
        ref={closeButton}
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/25"
      >
        Close ✕
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="h-[78vh] max-w-full animate-pop-in rounded-xl object-contain shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      />
      {caption && <p className="mt-3 text-sm text-white/90">{caption}</p>}
    </div>
  );
}

"use client";

const STARS = [1, 2, 3, 4, 5];

function Star({ fill, className = "" }: { fill: number; className?: string }) {
  return (
    <span
      className={`relative inline-block leading-none text-sand-300 dark:text-sand-700 ${className}`}
      aria-hidden="true"
    >
      ★
      <span
        className="absolute inset-y-0 left-0 overflow-hidden text-amber-500"
        style={{ width: `${fill * 100}%` }}
      >
        ★
      </span>
    </span>
  );
}

const fillFor = (value: number, star: number) => Math.max(0, Math.min(1, value - (star - 1)));

/* Read-only stars. Half stars are drawn as half filled. */
export function StarDisplay({ value, className = "" }: { value: number; className?: string }) {
  return (
    <span className={`inline-flex ${className}`} role="img" aria-label={`${value} out of 5 stars`}>
      {STARS.map((star) => (
        <Star key={star} fill={fillFor(value, star)} />
      ))}
    </span>
  );
}

/* Click the left half of a star for a half star, the right half for a whole one. */
export function StarInput({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const focus =
    "absolute inset-y-0 w-1/2 focus-visible:outline-2 focus-visible:outline-brand-600";

  return (
    <div className="inline-flex items-center gap-3">
      <div className="inline-flex" role="group" aria-label="Rating">
        {STARS.map((star) => (
          <span key={star} className="relative inline-block text-4xl leading-none">
            <Star fill={fillFor(value, star)} />
            <button
              type="button"
              aria-label={`${star - 0.5} stars`}
              aria-pressed={value === star - 0.5}
              onClick={() => onChange(star - 0.5)}
              className={`${focus} left-0`}
            />
            <button
              type="button"
              aria-label={`${star} ${star === 1 ? "star" : "stars"}`}
              aria-pressed={value === star}
              onClick={() => onChange(star)}
              className={`${focus} right-0`}
            />
          </span>
        ))}
      </div>
      <span className="text-sm text-sand-500">{value > 0 ? `${value} / 5` : "Tap a star"}</span>
    </div>
  );
}

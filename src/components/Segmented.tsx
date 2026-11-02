type Props<T extends string> = {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  label: string;
};

/* A row of mutually exclusive buttons, used for the Month, Year and All time style switches. */
export function Segmented<T extends string>({ value, options, onChange, label }: Props<T>) {
  return (
    <div
      className="flex gap-1 rounded-lg border border-zinc-300 p-1 dark:border-zinc-700"
      role="group"
      aria-label={label}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`rounded-md px-3 py-1 text-sm font-medium ${
            value === option.value
              ? "bg-indigo-600 text-white"
              : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

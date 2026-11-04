/* The color schemes the recap slides cycle through. Full class names, so Tailwind can see them. */
export type SlideTheme = {
  background: string;
  accent: string;
  muted: string;
  panel: string;
};

export const THEMES: SlideTheme[] = [
  {
    background: "bg-gradient-to-br from-sand-950 via-sand-900 to-brand-900 text-sand-50",
    accent: "text-gold-300",
    muted: "text-sand-300",
    panel: "bg-white/10",
  },
  {
    background: "bg-gradient-to-br from-gold-300 via-gold-200 to-gold-100 text-sand-900",
    accent: "text-brand-800",
    muted: "text-sand-700",
    panel: "bg-white/50",
  },
  {
    background: "bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 text-brand-50",
    accent: "text-gold-300",
    muted: "text-brand-100",
    panel: "bg-white/10",
  },
  {
    background: "bg-gradient-to-br from-sand-50 via-gold-50 to-brand-100 text-sand-900",
    accent: "text-brand-700",
    muted: "text-sand-600",
    panel: "bg-white/70",
  },
];

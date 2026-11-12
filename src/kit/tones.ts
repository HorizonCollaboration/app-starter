// Fixed by Horizon: don't change this file.
// Colours by meaning, not by library: a different component library only needs these mapped again.

/** Soft tints for picture tiles. */
export const TILE_TONES = {
  primary: "bg-primary/10 text-primary",
  orange: "bg-orange-50 text-orange-700",
  amber: "bg-amber-50 text-amber-700",
  green: "bg-emerald-50 text-emerald-700",
  teal: "bg-teal-50 text-teal-700",
  sky: "bg-sky-50 text-sky-700",
  indigo: "bg-indigo-50 text-indigo-700",
  violet: "bg-violet-50 text-violet-700",
  pink: "bg-pink-50 text-pink-700",
  red: "bg-red-50 text-red-700",
  neutral: "bg-muted text-muted-foreground",
} as const;

export type TileTone = keyof typeof TILE_TONES;

/** Tags say what state something is in. */
export const TAG_TONES = {
  neutral: { tag: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
  primary: { tag: "bg-primary/10 text-primary", dot: "bg-primary" },
  urgent: { tag: "bg-red-50 text-red-700", dot: "bg-red-500" },
  warning: { tag: "bg-amber-50 text-amber-800", dot: "bg-amber-500" },
  good: { tag: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  info: { tag: "bg-sky-50 text-sky-700", dot: "bg-sky-500" },
} as const;

export type TagTone = keyof typeof TAG_TONES;

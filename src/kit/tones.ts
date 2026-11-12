// Fixed by Horizon: don't change this file.
// Colours by meaning, not by library: a different component library only needs these mapped again.

/**
 * Picture tiles are quiet: a grey icon on white with a fine border, whatever
 * the tone. The tone names stay so apps written with them keep working;
 * colour is kept for what things mean (tags and messages).
 */
const QUIET = "border bg-background text-muted-foreground shadow-xs";

export const TILE_TONES = {
  primary: QUIET,
  orange: QUIET,
  amber: QUIET,
  green: QUIET,
  teal: QUIET,
  sky: QUIET,
  indigo: QUIET,
  violet: QUIET,
  pink: QUIET,
  red: QUIET,
  neutral: QUIET,
} as const;

export type TileTone = keyof typeof TILE_TONES;

/** Tags say what state something is in: white with a fine border, and a coloured dot for its meaning. */
export const TAG_TONES = {
  neutral: { tag: "border-border bg-background text-muted-foreground", dot: "bg-muted-foreground/60" },
  primary: { tag: "border-border bg-background text-foreground", dot: "bg-foreground" },
  urgent: { tag: "border-border bg-background text-foreground", dot: "bg-red-500" },
  warning: { tag: "border-border bg-background text-foreground", dot: "bg-amber-500" },
  good: { tag: "border-border bg-background text-foreground", dot: "bg-emerald-500" },
  info: { tag: "border-border bg-background text-foreground", dot: "bg-sky-500" },
} as const;

export type TagTone = keyof typeof TAG_TONES;

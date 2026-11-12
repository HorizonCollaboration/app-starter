// Fixed by Horizon: don't change this file.
// Colours by meaning, not by library: a different component library only needs these mapped again.

/** Picture tiles are quiet: a grey icon on white with a fine border. Colour is kept for what things mean. */
export const QUIET_TILE = "border bg-background text-muted-foreground shadow-xs";

/** Tile tones from the first kit. They're still accepted so apps written with them keep working, but every tile is quiet. */
export type TileTone = "primary" | "orange" | "amber" | "green" | "teal" | "sky" | "indigo" | "violet" | "pink" | "red" | "neutral";

/** Tags say what state something is in: white with a fine border, and a coloured dot (dark enough to see on white) for its meaning. */
export const TAG_TONES = {
  neutral: { tag: "border-border bg-background text-muted-foreground", dot: "bg-muted-foreground" },
  primary: { tag: "border-border bg-background text-foreground", dot: "bg-foreground" },
  urgent: { tag: "border-border bg-background text-foreground", dot: "bg-red-600" },
  warning: { tag: "border-border bg-background text-foreground", dot: "bg-amber-600" },
  good: { tag: "border-border bg-background text-foreground", dot: "bg-emerald-600" },
  info: { tag: "border-border bg-background text-foreground", dot: "bg-sky-600" },
} as const;

export type TagTone = keyof typeof TAG_TONES;

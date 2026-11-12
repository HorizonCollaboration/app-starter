// Fixed by Horizon: don't change this file. Horizon's own components, built on shadcn/ui for now.
import { cn } from "cn";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Badge } from "./ui/badge";
import { Button as UiButton } from "./ui/button";
import { TAG_TONES, TILE_TONES, type TagTone, type TileTone } from "./tones";

// The kit's names, plus the library's own (default, destructive), which AI often reaches for.
const BUTTON_VARIANTS = {
  primary: "default",
  default: "default",
  secondary: "secondary",
  outline: "outline",
  ghost: "ghost",
  danger: "destructive",
  destructive: "destructive",
  link: "link",
} as const;
const BUTTON_SIZES = { sm: "sm", md: "lg", lg: "lg", icon: "icon-lg", "icon-sm": "icon-sm" } as const;

export type ButtonVariant = keyof typeof BUTTON_VARIANTS;

type ButtonProps = Omit<ComponentProps<"button">, "ref"> & {
  variant?: ButtonVariant;
  size?: keyof typeof BUTTON_SIZES;
  /** Makes it a link to another screen in the app that looks like a button. */
  href?: string;
};

/**
 * A button. variant: primary (one per screen, for the main action), secondary,
 * outline, ghost (quiet), danger, link. size: md (default), sm, icon, icon-sm.
 * href makes it a link to another screen. Put a Lucide icon before the words
 * when it helps. Always 44px tall on a phone.
 */
export function Button({ variant = "outline", size = "md", className, href, children, ...props }: ButtonProps) {
  const isIcon = size.startsWith("icon");
  const look = {
    variant: BUTTON_VARIANTS[variant] ?? "outline",
    size: BUTTON_SIZES[size] ?? "lg",
    className: cn(isIcon ? "max-md:size-11" : "max-md:h-11 max-md:px-4", className),
  };

  if (href !== undefined) {
    // A link keeps its label, title and the like; what only a button has (type, disabled) doesn't apply.
    const linkProps = { ...props };
    delete linkProps.type;
    delete linkProps.disabled;

    return (
      <UiButton asChild {...look}>
        <Link href={href} {...(linkProps as Omit<ComponentProps<typeof Link>, "href">)}>
          {children}
        </Link>
      </UiButton>
    );
  }

  return (
    <UiButton {...look} {...props}>
      {children}
    </UiButton>
  );
}

/** A picture for a thing: a Lucide icon on a soft tint. Give each kind of thing its own tone and icon, the same everywhere. */
export function Tile({ icon: Icon, tone = "primary", size = "md" }: { icon?: LucideIcon; tone?: TileTone; size?: "sm" | "md" | "lg" }) {
  const box = { sm: "size-8 rounded-lg", md: "size-10 rounded-xl", lg: "size-12 rounded-2xl" }[size];
  const glyph = { sm: "size-4", md: "size-5", lg: "size-6" }[size];

  return (
    <span className={cn("flex shrink-0 items-center justify-center", box, TILE_TONES[tone] ?? TILE_TONES.primary)}>
      {Icon && <Icon className={glyph} strokeWidth={1.75} aria-hidden="true" />}
    </span>
  );
}

/** A small tag for a state. tone: neutral, primary, urgent, warning, good, info; its dot shows the colour. icon adds a Lucide icon. */
export function Tag({ tone = "neutral", dot = true, icon: Icon, children }: { tone?: TagTone; dot?: boolean; icon?: LucideIcon; children: ReactNode }) {
  const colours = TAG_TONES[tone] ?? TAG_TONES.neutral;
  // The dot carries the meaning, so a tag with a meaning always has one.
  const showDot = dot || tone !== "neutral";

  return (
    <Badge className={cn("font-normal", colours.tag)}>
      {showDot && <span className={cn("size-1.5 rounded-full", colours.dot)} aria-hidden="true" />}
      {Icon && <Icon aria-hidden="true" />}
      {children}
    </Badge>
  );
}

/** A big number with a label, for a summary at the top of a screen. icon, if given, sits quietly beside the label. */
export function Stat({ label, value, icon: Icon, hint }: { label: string; value: ReactNode; icon?: LucideIcon; tone?: TileTone; hint?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-xl border p-3 sm:p-4">
      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {Icon && <Icon className="size-3.5 shrink-0 max-sm:hidden" strokeWidth={1.75} aria-hidden="true" />}
        {label}
      </span>
      <span className="text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}

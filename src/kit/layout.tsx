// Fixed by Horizon: don't change this file. Horizon's own components, built on shadcn/ui for now.
import { cn } from "cn";
import { ArrowLeft, CircleAlert, CircleCheck, X, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { Children, type ReactNode } from "react";
import { Button, Tile } from "./basics";
import type { TileTone } from "./tones";
import { Card as UiCard, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "./ui/empty";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemSeparator, ItemTitle } from "./ui/item";

type ScreenHeaderProps = {
  icon?: LucideIcon;
  tone?: TileTone;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  /** A way back above the title: { label, href }. */
  back?: { label: string; href: string };
};

/**
 * The top of a screen: its picture tile, its one h1 and one sentence saying
 * what it's for, with the main action on the right.
 */
export function ScreenHeader({ icon, tone = "primary", title, description, action, back }: ScreenHeaderProps) {
  return (
    <header className="flex flex-col gap-4">
      {back && (
        <Button variant="ghost" size="sm" className="-ml-2 w-fit" href={back.href}>
          <ArrowLeft aria-hidden="true" />
          {back.label}
        </Button>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-3">
          {icon && <Tile icon={icon} tone={tone} size="lg" />}
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="max-w-xl text-muted-foreground">{description}</p>}
        </div>
        {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
      </div>
    </header>
  );
}

/** A titled part of a screen. */
export function Section({ title, description, action, children }: { title?: ReactNode; description?: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      {(title || action) && (
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            {title && <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">{title}</h2>}
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** A box for a few related things, such as a form. Use List for lists, not a stack of cards. */
export function Card({
  title,
  description,
  action,
  footer,
  children,
  className,
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <UiCard className={className}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
          {action && <CardAction>{action}</CardAction>}
        </CardHeader>
      )}
      {children && <CardContent>{children}</CardContent>}
      {footer && <CardFooter className="flex-wrap gap-2">{footer}</CardFooter>}
    </UiCard>
  );
}

/** A list of rows, with hairlines between them. framed gives it its own rounded border; leave it off inside a Card. */
export function List({ children, framed = true }: { children: ReactNode; framed?: boolean }) {
  const rows = Children.toArray(children);

  if (rows.length === 0) {
    return null;
  }

  return (
    <ItemGroup className={cn(framed && "rounded-2xl border")}>
      {rows.map((row, index) => (
        <div key={index} role="listitem">
          {index > 0 && <ItemSeparator />}
          {row}
        </div>
      ))}
    </ItemGroup>
  );
}

type RowProps = {
  media?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  /** Makes the whole row open this screen (its title is the link), while its actions stay on top. */
  href?: string;
  compact?: boolean;
};

/**
 * One thing in a List: a picture (usually a Tile), a title, a muted line under
 * it, anything else under that (tags or a note), and actions at the end.
 */
export function Row({ media, title, description, children, actions, href, compact = false }: RowProps) {
  return (
    <Item size={compact ? "sm" : "default"} className={cn("max-sm:flex-wrap", href && "relative hover:bg-muted/50")}>
      {media && <ItemMedia>{media}</ItemMedia>}
      <ItemContent className="min-w-0">
        <ItemTitle>
          {href ? (
            <Link href={href} className="text-left after:absolute after:inset-0 after:content-['']">
              {title}
            </Link>
          ) : (
            title
          )}
        </ItemTitle>
        {description && <ItemDescription>{description}</ItemDescription>}
        {children && <div className="relative z-10 flex flex-wrap items-center gap-1.5 pt-1">{children}</div>}
      </ItemContent>
      {/* On a phone the actions get their own line under the words, so neither is squeezed. */}
      {actions && <ItemActions className={cn("relative z-10 flex-wrap max-sm:basis-full", media && "max-sm:pl-14")}>{actions}</ItemActions>}
    </Item>
  );
}

/** What a screen shows when there's nothing yet: a picture, a short title, one helpful sentence and what to do next. */
export function EmptyState({ icon: Icon, title, description, action }: { icon?: LucideIcon; title: ReactNode; description?: ReactNode; action?: ReactNode }) {
  return (
    <Empty className="rounded-2xl bg-muted/50">
      <EmptyHeader>
        {Icon && (
          <EmptyMedia variant="icon">
            <Icon aria-hidden="true" />
          </EmptyMedia>
        )}
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  );
}

/**
 * A short message that something happened, floating near the bottom. tone:
 * good (default) or problem. onClose clears it (only from a client component).
 */
export function Notice({ message, onClose, tone = "good" }: { message?: string | null; onClose?: () => void; tone?: "good" | "problem" }) {
  const Icon = tone === "problem" ? CircleAlert : CircleCheck;

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-30 flex justify-center px-4 md:bottom-6">
      {message && (
        <div className="pointer-events-auto flex max-w-md items-center gap-3 rounded-xl border bg-background py-2.5 pr-2 pl-4 text-sm shadow-lg animate-in fade-in slide-in-from-bottom-2">
          <Icon className={cn("size-4 shrink-0", tone === "problem" ? "text-destructive" : "text-emerald-600")} aria-hidden="true" />
          <span>{message}</span>
          {onClose && (
            <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
              <X aria-hidden="true" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/** A form's answer, in place under it: what went wrong, or that it worked. */
export function FormMessage({ error, message }: { error?: string | null; message?: string | null }) {
  return (
    <div role="status" aria-live="polite">
      {error && (
        <p className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
      {message && (
        <p className="flex items-start gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
          <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {message}
        </p>
      )}
    </div>
  );
}

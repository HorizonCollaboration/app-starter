// Fixed by Horizon: don't change this file. Horizon's own components, built on shadcn/ui for now.
import { cn } from "cn";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Tile } from "./basics";
import type { TileTone } from "./tones";

export type ShellTab = {
  id: string;
  label: string;
  href: string;
  icon?: LucideIcon;
  /** A small number beside the tab, such as how many things are waiting. */
  count?: number;
  /** "urgent" for things needing attention. */
  countTone?: "urgent";
};

type AppShellProps = {
  name: string;
  icon?: LucideIcon;
  tone?: TileTone;
  /** On a computer: "side" (the default), a sidebar; "top", a bar across the top. A phone always has a tab bar at the bottom. */
  nav?: "side" | "top";
  tabs?: ShellTab[];
  /** The id of the tab this screen belongs to. */
  current?: string;
  /** Signing in or out: under the tabs in the sidebar, at the right of the top bar, and at the top on a phone. */
  account?: ReactNode;
  children: ReactNode;
};

function Count({ tab, inline }: { tab: ShellTab; inline: boolean }) {
  if (!tab.count) {
    return null;
  }

  return (
    <span
      className={cn(
        "rounded-full px-1.5 text-xs font-semibold tabular-nums",
        !inline && "ml-auto",
        tab.countTone === "urgent" ? "bg-red-50 text-red-700" : "bg-muted text-muted-foreground",
      )}
    >
      {tab.count}
    </span>
  );
}

/**
 * The frame of the whole app: the app's name and its screens in a sidebar
 * (or a bar across the top) on a computer, a top bar and a tab bar at the
 * bottom on a phone. Each tab is its own page (href). The screen goes inside.
 */
export function AppShell({ name, icon, tone = "orange", nav = "side", tabs = [], current, account, children }: AppShellProps) {
  // An app that does one job has no tabs: just its name, and no tab bar.
  const hasTabs = tabs.length > 1;
  const top = nav === "top";
  const home = tabs[0]?.href ?? "/";
  const brand = (
    <Link href={home} className="flex min-w-0 shrink-0 items-center gap-2.5 rounded-md">
      <Tile icon={icon} tone={tone} size="sm" />
      <span className="truncate font-semibold tracking-tight">{name}</span>
    </Link>
  );

  return (
    <div className={cn("flex flex-1", top && "flex-col")}>
      {top ? (
        <header className="sticky top-0 z-20 hidden border-b bg-background/95 backdrop-blur md:block">
          <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-10">
            {brand}
            {hasTabs && (
              // Many tabs on a narrow computer scroll sideways in the bar, never the page.
              <nav aria-label="Screens" className="flex h-full min-w-0 items-stretch gap-1 overflow-x-auto">

                {tabs.map((tab) => (
                  <Link
                    key={tab.id}
                    href={tab.href}
                    aria-current={current === tab.id ? "page" : undefined}
                    className={cn(
                      "flex shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-medium whitespace-nowrap transition-colors",
                      current === tab.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {tab.icon && <tab.icon className="size-4" aria-hidden="true" />}
                    {tab.label}
                    <Count tab={tab} inline />
                  </Link>
                ))}
              </nav>
            )}
            {account && <div className="ml-auto flex shrink-0 items-center gap-2">{account}</div>}
          </div>
        </header>
      ) : (
        // The sidebar runs the page's full height; what's in it stays in view, below Horizon's banner, as the page scrolls.
        <aside className="hidden w-64 shrink-0 border-r bg-muted/40 md:block">
          <div className="sticky top-0 flex max-h-svh flex-col gap-1 overflow-y-auto px-3 py-5">
          <div className="px-2 pb-5">{brand}</div>
          {hasTabs && (
            <nav aria-label="Screens" className="flex flex-col gap-0.5">
              {tabs.map((tab) => (
                <Link
                  key={tab.id}
                  href={tab.href}
                  aria-current={current === tab.id ? "page" : undefined}
                  className={cn(
                    "flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm font-medium transition-colors",
                    current === tab.id
                      ? "bg-background text-foreground shadow-xs ring-1 ring-border"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {tab.icon && <tab.icon className="size-4" aria-hidden="true" />}
                  {tab.label}
                  <Count tab={tab} inline={false} />
                </Link>
              ))}
            </nav>
          )}
          {account && <div className="mt-4 flex flex-col gap-2 border-t px-1 pt-4">{account}</div>}
          </div>
        </aside>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b px-5 py-3 md:hidden">
          {brand}
          {account}
        </header>

        <main className={cn("flex-1 px-5 pt-8 md:px-10 md:pt-12 md:pb-12", hasTabs ? "pb-28" : "pb-12")}>
          <div className={cn("mx-auto flex flex-col gap-8", top ? "max-w-5xl" : "max-w-3xl")}>{children}</div>
        </main>
      </div>

      {hasTabs && (
        <nav aria-label="Screens" className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
          <ul className="grid" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
            {tabs.map((tab) => (
              <li key={tab.id}>
                <Link
                  href={tab.href}
                  aria-current={current === tab.id ? "page" : undefined}
                  className={cn(
                    "relative flex min-h-16 w-full flex-col items-center justify-center gap-1 px-1 text-xs font-medium",
                    current === tab.id ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {tab.icon && <tab.icon className="size-5" strokeWidth={current === tab.id ? 2.25 : 1.75} aria-hidden="true" />}
                  {tab.label}
                  {Boolean(tab.count) && (
                    <span
                      className={cn(
                        "absolute top-2 left-[calc(50%+6px)] min-w-4 rounded-full px-1 text-[10px] leading-4 font-semibold text-white tabular-nums",
                        tab.countTone === "urgent" ? "bg-red-600" : "bg-primary",
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}

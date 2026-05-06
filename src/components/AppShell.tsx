import { Link, useLocation } from "@tanstack/react-router";
import { ReactNode } from "react";
import { CalendarDays, LineChart, Activity, Plug, NotebookPen, HeartPulse } from "lucide-react";
import { DEFAULT_AUTH_REDIRECT, getLoginIntentPath } from "@/lib/auth-redirect";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/app-config";
import {
  WEEK_STATUS_META,
  formatDate,
  getShellSnapshot,
  type TrainingSnapshot,
} from "@/lib/training";

const NAV = [
  { to: "/", label: "Calendar", icon: CalendarDays },
  { to: "/progress", label: "Progress", icon: LineChart },
  { to: "/body", label: "Body", icon: HeartPulse },
  { to: "/integrations", label: "Integrations", icon: Plug },
];

export function AppShell({
  children,
  snapshot,
}: {
  children: ReactNode;
  snapshot?: TrainingSnapshot | null;
}) {
  const loc = useLocation();
  const nextPath = getLoginIntentPath(
    loc.pathname,
    "searchStr" in loc && typeof loc.searchStr === "string" ? loc.searchStr : undefined,
  );
  const shellSnapshot = getShellSnapshot(snapshot);
  const weekStatus = WEEK_STATUS_META[shellSnapshot.weekStatus];
  const modeLabel =
    shellSnapshot.mode === "authenticated"
      ? "Saved mode"
      : shellSnapshot.mode === "onboarding"
        ? "Setup required"
        : "Preview mode";
  const backendLabel =
    shellSnapshot.backend === "supabase"
      ? "Supabase"
      : shellSnapshot.backend === "temporary_local"
        ? "Temporary local"
        : "Preview only";

  return (
    <div className="min-h-screen flex bg-background text-foreground canvas-grain">
      <aside className="hidden md:flex w-[240px] shrink-0 flex-col border-r border-hairline bg-sidebar/60 backdrop-blur">
        <div className="px-6 pt-7 pb-10">
          <Link to="/" className="flex items-baseline gap-2">
            <span className="font-display text-2xl tracking-tight">{APP_NAME.toLowerCase()}</span>
            <span className="h-1.5 w-1.5 rounded-full bg-signal" />
          </Link>
          <p className="mt-1 text-[11px] tracking-[0.18em] uppercase text-muted-foreground">
            {modeLabel} · backend {backendLabel}
          </p>
        </div>

        <nav className="px-3 flex flex-col gap-0.5">
          {NAV.map((navItem) => {
            const active =
              loc.pathname === navItem.to ||
              (navItem.to !== "/" && loc.pathname.startsWith(navItem.to));
            const Icon = navItem.icon;
            return (
              <Link
                key={navItem.to}
                to={navItem.to}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  active
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={1.5} />
                <span>{navItem.label}</span>
                {active && <span className="ml-auto h-1 w-1 rounded-full bg-signal" />}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto p-4">
          <div className="rounded-lg border border-hairline bg-surface/50 p-4">
            <div className="flex items-center gap-2 text-[11px] tracking-[0.18em] uppercase text-muted-foreground">
              <NotebookPen className="h-3 w-3 text-signal" />
              Plan note
            </div>
            <p className="mt-2 text-xs leading-relaxed text-foreground/80">
              {shellSnapshot.source === "persisted"
                ? shellSnapshot.backend === "temporary_local"
                  ? "This shell now reads one temporary local saved-mode contract for a single-user bypass while preserving the imported layout and interaction structure."
                  : "This shell now reads one canonical persisted profile, plan, and workout-log contract while preserving the imported layout and interaction structure."
                : "This imported shell stays available as a read-only preview while real profile setup and saved workout logging live behind auth."}
            </p>
            <div className="mt-3 text-[11px] tracking-wider uppercase text-signal">
              {weekStatus.label}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3 px-1">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-signal to-quality grid place-items-center text-[11px] font-medium text-signal-foreground">
              HR
            </div>
            <div className="leading-tight">
              <div className="text-sm">{APP_NAME}</div>
              <div className="text-[11px] text-muted-foreground">
                {shellSnapshot.mode === "authenticated"
                  ? "Saved progress enabled"
                  : shellSnapshot.mode === "onboarding"
                    ? "Finish setup on home"
                    : "Sign in to save progress"}
              </div>
            </div>
          </div>
          {shellSnapshot.mode !== "authenticated" && loc.pathname !== "/login" && (
            <Link
              to="/login"
              search={nextPath === DEFAULT_AUTH_REDIRECT ? undefined : { next: nextPath }}
              className="mt-4 inline-flex rounded-md border border-hairline px-3 py-2 text-xs tracking-wide text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Open login
            </Link>
          )}
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 border-b border-hairline bg-background/70 backdrop-blur-xl">
          <div className="flex items-center gap-6 px-6 lg:px-10 h-14">
            <div className="md:hidden font-display text-xl">{APP_NAME.toLowerCase()}</div>
            <div className="hidden md:flex items-baseline gap-3">
              <span className="text-xs tracking-[0.18em] uppercase text-muted-foreground">
                Today
              </span>
              <span className="font-mono-num text-sm">
                {formatDate(shellSnapshot.currentDate, {
                  month: "long",
                  day: "numeric",
                  weekday: "long",
                })}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <StatusPill label="Week" value={weekStatus.label} />
              <StatusPill label="Backend" value={backendLabel} />
              <Link
                to={shellSnapshot.mode === "preview" ? "/login" : "/"}
                search={
                  shellSnapshot.mode === "preview" && nextPath !== DEFAULT_AUTH_REDIRECT
                    ? { next: nextPath }
                    : undefined
                }
                className="rounded-md border border-hairline px-3 py-1.5 text-xs tracking-wide hover:bg-accent transition-colors flex items-center gap-1.5"
              >
                <Activity className="h-3.5 w-3.5" strokeWidth={1.5} />
                {shellSnapshot.mode === "preview"
                  ? "Save with login"
                  : shellSnapshot.mode === "onboarding"
                    ? "Finish setup"
                    : "Open plan"}
              </Link>
              {shellSnapshot.mode !== "preview" && (
                <a
                  href="/api/auth/logout?next=%2F"
                  className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Sign out
                </a>
              )}
              <button className="md:hidden h-8 w-8 rounded-full bg-gradient-to-br from-signal to-quality grid place-items-center text-[10px] text-signal-foreground">
                HR
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1">{children}</div>

        <nav className="md:hidden sticky bottom-0 z-30 border-t border-hairline bg-background/95 backdrop-blur grid grid-cols-4">
          {NAV.map((navItem) => {
            const active = loc.pathname === navItem.to;
            const Icon = navItem.icon;
            return (
              <Link
                key={navItem.to}
                to={navItem.to}
                className={cn(
                  "flex flex-col items-center gap-1 py-3 text-[10px] tracking-wide uppercase",
                  active ? "text-signal" : "text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={1.5} />
                {navItem.label}
              </Link>
            );
          })}
        </nav>
      </main>
    </div>
  );
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          value === "Preview only" ? "bg-muted-foreground/40" : "bg-success",
        )}
      />
      <span className="tracking-wide">{label}</span>
      <span className="text-[10px] uppercase tracking-wider opacity-60">{value}</span>
    </div>
  );
}

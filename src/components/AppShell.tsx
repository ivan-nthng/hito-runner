import { Link, useLocation } from "@tanstack/react-router";
import { ReactNode, useState } from "react";
import {
  CalendarDays,
  LineChart,
  Activity,
  Plug,
  NotebookPen,
  HeartPulse,
  ChevronUp,
  Settings2,
  SlidersHorizontal,
  UserRound,
  LogOut,
  FileJson2,
} from "lucide-react";
import { DEFAULT_AUTH_REDIRECT, getLoginIntentPath } from "@/lib/auth-redirect";
import { UploadJsonDialog } from "@/components/UploadJsonDialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/app-config";
import {
  WEEK_STATUS_META,
  formatDate,
  getShellSnapshot,
  type TrainingSnapshot,
} from "@/lib/training";
import type { ViewerSummary } from "@/lib/training-api";

const NAV = [
  { to: "/", label: "Calendar", icon: CalendarDays },
  { to: "/progress", label: "Progress", icon: LineChart },
  { to: "/body", label: "Body", icon: HeartPulse },
  { to: "/integrations", label: "Integrations", icon: Plug },
];

export function AppShell({
  children,
  snapshot,
  viewer,
}: {
  children: ReactNode;
  snapshot?: TrainingSnapshot | null;
  viewer?: ViewerSummary | null;
}) {
  const [uploadOpen, setUploadOpen] = useState(false);
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
  const profileName = viewer?.name
    ? viewer.name
    : shellSnapshot.mode === "authenticated"
      ? shellSnapshot.backend === "temporary_local"
        ? "Local runner"
        : "Runner profile"
      : shellSnapshot.mode === "onboarding"
        ? "Setup in progress"
        : "Preview runner";
  const profileDetail = snapshot?.planMeta?.title
    ? snapshot.planMeta.title
    : snapshot?.profile?.goalLabel
      ? snapshot.profile.goalLabel
      : shellSnapshot.mode === "authenticated"
        ? "Saved plan active"
        : shellSnapshot.mode === "onboarding"
          ? "Import JSON on home"
          : "Sign in to save progress";
  const profileInitials = buildInitials(profileName);
  const showUploadAction = shellSnapshot.mode !== "preview";
  const modeTag =
    shellSnapshot.mode === "authenticated"
      ? "saved"
      : shellSnapshot.mode === "onboarding"
        ? "setup"
        : "preview";
  const useFreshHomeRequest = shellSnapshot.mode !== "preview";

  return (
    <div className="min-h-screen flex bg-background text-foreground canvas-grain">
      <aside className="hidden md:sticky md:top-0 md:flex md:h-screen w-[240px] shrink-0 self-start flex-col border-r border-hairline bg-sidebar/60 backdrop-blur">
        <div className="px-6 pt-7 pb-10">
          <Link to="/" reloadDocument={useFreshHomeRequest} className="flex items-baseline gap-2">
            <span className="font-display text-2xl tracking-tight">{APP_NAME.toLowerCase()}</span>
            <span className="h-1.5 w-1.5 rounded-full bg-signal" />
          </Link>
          <p className="mt-1 text-[11px] tracking-[0.18em] uppercase text-muted-foreground">
            {modeLabel}
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
                reloadDocument={navItem.to === "/" && useFreshHomeRequest}
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

        <div className="mt-auto flex flex-col gap-4 p-4">
          <div className="rounded-lg border border-hairline bg-surface/45 p-4">
            <div className="flex items-center gap-2 text-[11px] tracking-[0.18em] uppercase text-muted-foreground">
              <NotebookPen className="h-3 w-3 text-signal" />
              Plan note
            </div>
            <p className="mt-2 text-xs leading-relaxed text-foreground/80">
              {shellSnapshot.source === "persisted"
                ? "Saved plan and workout status are live here. JSON export comes later."
                : "This shell stays available as a preview until you sign in and save a real plan."}
            </p>
            <div className="mt-3 text-[11px] tracking-wider uppercase text-signal">
              {weekStatus.label}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="group flex w-full items-center gap-3 rounded-lg border border-hairline bg-background/45 px-3 py-3 text-left transition-colors hover:bg-accent/50 focus:outline-none focus:ring-1 focus:ring-foreground/20"
              >
                <Avatar className="h-9 w-9 border border-hairline/80 bg-background/70">
                  <AvatarFallback className="bg-gradient-to-br from-signal to-quality text-[11px] font-medium text-signal-foreground">
                    {profileInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="truncate text-sm text-foreground">{profileName}</div>
                  <div className="truncate text-[11px] text-muted-foreground">{profileDetail}</div>
                </div>
                <ChevronUp className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="start"
              className="w-[208px] border-hairline bg-background/95 backdrop-blur-xl"
            >
              <DropdownMenuLabel className="pb-1">
                <div className="text-sm font-medium text-foreground">{profileName}</div>
                <div className="mt-1 truncate text-[11px] font-normal text-muted-foreground">
                  {profileDetail}
                </div>
                <div className="mt-2 text-[11px] font-normal uppercase tracking-[0.16em] text-muted-foreground">
                  {modeTag}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {showUploadAction && (
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    setUploadOpen(true);
                  }}
                >
                  <FileJson2 className="h-4 w-4" />
                  Upload JSON
                </DropdownMenuItem>
              )}
              <DropdownMenuItem disabled>
                <Settings2 className="h-4 w-4" />
                Settings
                <DropdownMenuShortcut>Later</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <UserRound className="h-4 w-4" />
                Account
                <DropdownMenuShortcut>Later</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <SlidersHorizontal className="h-4 w-4" />
                Preferences
                <DropdownMenuShortcut>Later</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href="/api/auth/logout?next=%2F">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {shellSnapshot.mode !== "authenticated" && loc.pathname !== "/login" && (
            <Link
              to="/login"
              search={nextPath === DEFAULT_AUTH_REDIRECT ? undefined : { next: nextPath }}
              className="inline-flex rounded-md border border-hairline px-3 py-2 text-xs tracking-wide text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
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
              <Link
                to={shellSnapshot.mode === "preview" ? "/login" : "/"}
                reloadDocument={shellSnapshot.mode !== "preview"}
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
                    ? "Create a Plan"
                    : "Open plan"}
              </Link>
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
                reloadDocument={navItem.to === "/" && useFreshHomeRequest}
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
      <UploadJsonDialog open={uploadOpen} onOpenChange={setUploadOpen} />
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

function buildInitials(name: string) {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (!parts.length) {
    return "HR";
  }

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

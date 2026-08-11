import { useState } from "react";
import { DropdownFamilyPlayground } from "@/components/hito-ds/dropdown-family-playground";
import { HitoDsPlayground } from "@/components/hito-ds/playground";
import { HitoButton } from "@/components/ui/button";
import { HitoLogo, HitoLogoMark } from "@/components/ui/hito-logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProductLinks } from "@/components/hito-ds/reference";
import { ChoiceSelector, MenuRow, ToggleRow } from "@/components/hito-ds/specimen-previews";
import { Icon, type HitoIconName } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const ROW_DENSITIES = ["standard", "compact"] as const;
type RowDensity = (typeof ROW_DENSITIES)[number];

export function HitoDsComponentStructure() {
  const [rowDensity, setRowDensity] = useState<RowDensity>("standard");
  const [rowIcon, setRowIcon] = useState(true);
  const [rowMeta, setRowMeta] = useState(true);
  const [rowDisclosure, setRowDisclosure] = useState(true);
  const [shellProfileMeta, setShellProfileMeta] = useState(true);
  const [shellNotice, setShellNotice] = useState(true);

  return (
    <>
      <HitoDsPlayground
        id="rows"
        label="Rows & disclosure"
        status="Pattern"
        statusTone="signal"
        description={{
          purpose:
            "Organize concise titles, helper copy, metadata, metrics, and optional disclosure in one scan-friendly row grammar.",
          useWhen: "Related objects or settings need repeated alignment and a clear reading order.",
          avoidWhen:
            "Dense tabular comparison or a route-level content hierarchy is the real owner.",
          accessibility:
            "Interactive rows use the appropriate link, button, or disclosure semantics; disabled, focus, summary, and expanded state remain explicit.",
        }}
        usedIn={
          <ProductLinks
            links={[
              { href: "/", label: "/" },
              { href: "/settings", label: "/settings" },
              { href: "/admin/analytics", label: "/admin/analytics" },
            ]}
          />
        }
        demo={
          <div className="grid min-w-0 gap-5">
            <div className="hito-row-group min-w-0">
              {[
                {
                  title: "Support row",
                  body: "One title, one concise helper, optional status.",
                  value: "Live",
                  icon: "check-circle",
                },
                {
                  title: "Utility row",
                  body: "Secondary routes and tools stay reachable without becoming primary nav.",
                  value: "Utility",
                  icon: "settings",
                },
                {
                  title: "Metric row",
                  body: "Value first, label second, no placeholder dash filler.",
                  value: "8.4 km",
                  icon: "activity",
                },
              ].map(({ title, body, value, icon }) => (
                <div
                  key={title}
                  className={cn("hito-list-row min-w-0", rowDensity === "compact" && "py-2")}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    {rowIcon && (
                      <Icon
                        name={icon as HitoIconName}
                        size="sm"
                        className="mt-0.5 shrink-0 text-muted-foreground"
                        strokeWidth={1.7}
                      />
                    )}
                    <div className="min-w-0">
                      <p className="hito-list-row-title">{title}</p>
                      <p className="hito-list-row-copy">{body}</p>
                    </div>
                  </div>
                  {rowMeta && (
                    <span
                      className={cn(
                        "hito-caption shrink-0",
                        value === "8.4 km" && "font-mono-num text-foreground",
                        value === "Live" && "text-success",
                      )}
                    >
                      {value}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {rowDisclosure && (
              <details className="hito-disclosure" open>
                <summary className="hito-disclosure-summary">
                  <span className="min-w-0">
                    <span className="hito-list-row-title block">Destructive override</span>
                    <span className="hito-body-small block">
                      Available, but not a permanent sibling to the safe action.
                    </span>
                  </span>
                  <Icon name="chevron-down" className="hito-disclosure-chevron" />
                </summary>
                <div className="hito-disclosure-body">
                  <HitoButton size="sm" variant="outlined">
                    Replace today
                  </HitoButton>
                </div>
              </details>
            )}
          </div>
        }
        variants={
          <div className="grid min-w-0 gap-6">
            <div className="border-t border-hairline pt-5">
              <p className="hito-label">Row anatomy matrix</p>
              <p className="hito-caption mt-1">
                Icon, text, helper copy, meta, metric, disabled, and quiet utility rows share the
                same row grammar.
              </p>
              <div className="mt-4 grid min-w-0 gap-4 xl:grid-cols-2">
                <div className="hito-row-group min-w-0">
                  <MenuRow icon="activity" label="Workout summary" meta="Planned" />
                  <MenuRow icon="connections" label="Connected apps" meta="Ready" />
                  <MenuRow icon="settings" label="Preferences" meta="Optional" />
                </div>
                <div className="hito-row-group min-w-0">
                  <div className="hito-list-row min-w-0">
                    <div className="min-w-0">
                      <p className="hito-list-row-title">Metric row</p>
                      <p className="hito-list-row-copy">Concrete value, short label.</p>
                    </div>
                    <span className="hito-caption shrink-0 font-mono-num text-foreground">
                      42 min
                    </span>
                  </div>
                  <div className="hito-list-row min-w-0 opacity-60" aria-disabled="true">
                    <div className="min-w-0">
                      <p className="hito-list-row-title">Disabled row</p>
                      <p className="hito-list-row-copy">Unavailable, still readable.</p>
                    </div>
                    <span className="hito-caption shrink-0">Later</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-hairline pt-5">
              <p className="hito-label">Disclosure row</p>
              <p className="hito-caption mt-1">
                Rare or risky actions stay discoverable without competing with safe primary rows.
              </p>
              <details className="hito-disclosure mt-4" open>
                <summary className="hito-disclosure-summary">
                  <span className="min-w-0">
                    <span className="hito-list-row-title block">Advanced options</span>
                    <span className="hito-body-small block">
                      Disclosure before loud secondary actions.
                    </span>
                  </span>
                  <Icon name="chevron-down" className="hito-disclosure-chevron" />
                </summary>
                <div className="hito-disclosure-body">
                  <HitoButton size="sm" variant="secondary">
                    Open tools
                  </HitoButton>
                </div>
              </details>
            </div>
          </div>
        }
        controls={
          <div className="hito-row-group border-0">
            <div className="hito-list-row items-start">
              <ChoiceSelector
                label="Density"
                value={rowDensity}
                options={ROW_DENSITIES}
                onChange={setRowDensity}
              />
            </div>
            <ToggleRow
              label="Leading icon"
              active={rowIcon}
              onToggle={() => setRowIcon((v) => !v)}
            />
            <ToggleRow
              label="Trailing meta"
              active={rowMeta}
              onToggle={() => setRowMeta((v) => !v)}
            />
            <ToggleRow
              label="Disclosure row"
              active={rowDisclosure}
              onToggle={() => setRowDisclosure((v) => !v)}
            />
          </div>
        }
      />

      <HitoDsPlayground
        id="app-shell"
        label="App Shell"
        status="Pattern"
        statusTone="signal"
        description={{
          purpose:
            "Compose product identity, primary navigation, profile and utility boundaries, and route content into one stable frame.",
          useWhen:
            "Demonstrating the current authenticated product frame around route-owned content without loading runner state.",
          avoidWhen:
            "A route section, card, or navigation fragment can stand alone without the whole product frame.",
          accessibility:
            "Landmarks, active navigation, readable identity, narrow navigation representation, focus order, and route-content ownership stay explicit.",
        }}
        usedIn={
          <ProductLinks
            links={[
              { href: "/", label: "/" },
              { href: "/progress", label: "/progress" },
            ]}
          />
        }
        demo={
          <div className="hito-ds-app-shell-frame" data-context="runner">
            <aside className="hito-ds-app-shell-sidebar" aria-label="Contained shell navigation">
              <div>
                <HitoLogo className="[--hito-logo-height:1.25rem]" />
                <p className="hito-shell-brand-kicker">Runner</p>
              </div>
              <nav className="hito-shell-nav" aria-label="Runner destinations">
                {[
                  { label: "Calendar", icon: "calendar", href: "/", active: true },
                  { label: "Progress", icon: "progress", href: "/progress", active: false },
                ].map(({ label, icon, href, active }) => (
                  <a
                    key={label}
                    href={href}
                    className="hito-shell-nav-row min-w-0"
                    data-active={active}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon name={icon as HitoIconName} className="hito-shell-nav-icon" decorative />
                    <span className="truncate">{label}</span>
                    {active && <span className="hito-shell-nav-dot" aria-hidden="true" />}
                  </a>
                ))}
              </nav>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="hito-surface-quiet hito-shell-profile-trigger mt-auto min-w-0"
                    data-hito-ds-pattern="quiet-surface"
                  >
                    <span className="hito-shell-avatar-fallback h-9 w-9 rounded-full">PR</span>
                    <span className="min-w-0 flex-1">
                      <span className="hito-menu-text block truncate">Preview runner</span>
                      {shellProfileMeta ? (
                        <span className="hito-menu-meta block truncate">Reference only</span>
                      ) : null}
                    </span>
                    <Icon
                      name="chevron-down"
                      size="sm"
                      className="shrink-0 text-muted-foreground"
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem asChild>
                    <a href="/settings">
                      <Icon name="settings" size="sm" decorative />
                      Profile &amp; heart rate
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="/integrations">
                      <Icon name="connections" size="sm" decorative />
                      Connections
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </aside>

            <section className="hito-ds-app-shell-content" aria-label="Contained route content">
              <header className="flex min-w-0 flex-wrap items-start justify-between gap-4 border-b border-hairline pb-4">
                <div className="min-w-0">
                  <p className="hito-label hito-label-signal">Training</p>
                  <h3 className="hito-panel-title mt-2">Training week</h3>
                  <p className="hito-support-copy mt-2">
                    Route content owns this hierarchy; App Shell owns the stable frame around it.
                  </p>
                </div>
                <span className="hito-status-pill" data-tone="signal">
                  Contained specimen
                </span>
              </header>

              {shellNotice ? (
                <div className="hito-state-surface py-3" data-tone="signal" role="status">
                  <p className="hito-list-row-title">Reference notice</p>
                  <p className="hito-list-row-copy">
                    Existing notice surfaces compose inside route content, not in shell navigation.
                  </p>
                </div>
              ) : null}

              <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                <article className="hito-surface-flat min-w-0 p-4">
                  <p className="hito-micro-label">Primary content</p>
                  <p className="hito-list-row-title mt-2">Current focus</p>
                  <p className="hito-list-row-copy mt-1">
                    One route-owned object leads the reading order.
                  </p>
                </article>
                <article className="hito-surface-flat min-w-0 p-4">
                  <p className="hito-micro-label">Supporting content</p>
                  <p className="hito-list-row-title mt-2">Next action</p>
                  <p className="hito-list-row-copy mt-1">
                    Secondary information stays inside the content region.
                  </p>
                </article>
              </div>
            </section>
          </div>
        }
        variants={
          <div className="grid min-w-0 gap-6">
            <div className="border-t border-hairline pt-5">
              <p className="hito-label">Narrow shell representation</p>
              <p className="hito-caption mt-1">
                The same identity, current location, and navigation boundary reflow without scaling
                desktop geometry or inventing authenticated behavior.
              </p>
              <div className="hito-ds-app-shell-narrow mt-4">
                <div className="flex min-w-0 items-center justify-between gap-3 border-b border-hairline p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <HitoLogoMark decorative className="[--hito-logo-height:1.45rem]" />
                    <div className="min-w-0">
                      <p className="hito-menu-text truncate">Hito</p>
                      <p className="hito-menu-meta truncate">Calendar</p>
                    </div>
                  </div>
                  <HitoButton
                    asChild
                    iconOnly
                    size="sm"
                    variant="ghost"
                    className="hito-surface-quiet hito-shell-profile-trigger"
                    data-hito-ds-pattern="quiet-surface"
                    aria-label="Open profile and heart-rate settings"
                  >
                    <a href="/settings">
                      <Icon name="settings" size="sm" decorative />
                    </a>
                  </HitoButton>
                </div>
                <div className="grid min-w-0 gap-4 p-4">
                  <div>
                    <p className="hito-label hito-label-signal">Route content</p>
                    <p className="hito-panel-title mt-2">Readable at narrow width</p>
                  </div>
                  {shellNotice ? (
                    <div className="hito-state-surface py-3" data-tone="signal">
                      <p className="hito-list-row-copy">Notice remains inside route content.</p>
                    </div>
                  ) : null}
                </div>
                <nav className="hito-shell-mobile-nav" aria-label="Contained narrow navigation">
                  {[
                    { label: "Calendar", icon: "calendar", href: "/", active: true },
                    { label: "Progress", icon: "progress", href: "/progress", active: false },
                  ].map(({ label, icon, href, active }) => (
                    <a
                      key={label}
                      href={href}
                      className="hito-shell-mobile-row"
                      data-active={active}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon
                        name={icon as HitoIconName}
                        className="hito-shell-nav-icon"
                        decorative
                      />
                      {label}
                    </a>
                  ))}
                </nav>
              </div>
            </div>

            <div className="border-t border-hairline pt-5">
              <p className="hito-label">Ownership boundary</p>
              <p className="hito-caption mt-1">
                App Shell owns identity, primary navigation, profile/utility placement, and the
                content frame. Route modules own headings, state surfaces, data, and actions.
              </p>
              <div className="hito-row-group mt-4 min-w-0">
                <MenuRow icon="calendar" label="Primary navigation" meta="Shell" />
                <MenuRow icon="user" label="Profile boundary" meta="Shell" />
                <MenuRow icon="file-text" label="Page hierarchy" meta="Route content" />
              </div>
            </div>
          </div>
        }
        controls={
          <div className="hito-row-group border-0">
            <ToggleRow
              label="Profile meta"
              active={shellProfileMeta}
              onToggle={() => setShellProfileMeta((v) => !v)}
            />
            <ToggleRow
              label="Notice surface"
              active={shellNotice}
              onToggle={() => setShellNotice((v) => !v)}
            />
          </div>
        }
      />

      <DropdownFamilyPlayground />
    </>
  );
}

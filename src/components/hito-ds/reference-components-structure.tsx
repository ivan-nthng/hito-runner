import { useState } from "react";
import { DropdownFamilyPlayground } from "@/components/hito-ds/dropdown-family-playground";
import { HitoDsPlayground } from "@/components/hito-ds/playground";
import { ProductLinks } from "@/components/hito-ds/reference";
import { ChoiceSelector, MenuRow, ToggleRow } from "@/components/hito-ds/specimen-previews";
import { Icon, type HitoIconName } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const ROW_DENSITIES = ["standard", "compact"] as const;
const SHELL_CONTEXTS = ["runner", "admin"] as const;
type RowDensity = (typeof ROW_DENSITIES)[number];
type ShellContext = (typeof SHELL_CONTEXTS)[number];

export function HitoDsComponentStructure() {
  const [rowDensity, setRowDensity] = useState<RowDensity>("standard");
  const [rowIcon, setRowIcon] = useState(true);
  const [rowMeta, setRowMeta] = useState(true);
  const [rowDisclosure, setRowDisclosure] = useState(true);
  const [shellContext, setShellContext] = useState<ShellContext>("runner");
  const [shellProfileMeta, setShellProfileMeta] = useState(true);
  const [shellUtilityRows, setShellUtilityRows] = useState(true);

  return (
    <>
      <HitoDsPlayground
        id="rows"
        label="Rows & disclosure"
        title="Rows before boxes, disclosure before loud secondary actions."
        body="Rows carry support content and utilities. Expert or destructive paths sit behind quieter disclosure unless they are the primary task."
        status="Pattern"
        statusTone="signal"
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
                  <button type="button" className="hito-button hito-button-outlined hito-button-sm">
                    Replace today
                  </button>
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
                  <button
                    type="button"
                    className="hito-button hito-button-secondary hito-button-sm"
                  >
                    Open tools
                  </button>
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
        caption={[
          {
            label: "Use for",
            body: "Support content, utility menus, metric rows, shell menus, settings rows, and rare secondary actions.",
          },
          {
            label: "Does not imply",
            body: "A card for every line item, loud secondary CTAs, or hidden destructive actions without disclosure.",
          },
          {
            label: "Used in",
            body: (
              <ProductLinks
                links={[
                  { href: "/", label: "/" },
                  { href: "/settings", label: "/settings" },
                  { href: "/admin/analytics", label: "/admin/analytics" },
                ]}
              />
            ),
          },
        ]}
      />

      <HitoDsPlayground
        id="shell"
        label="Shell navigation"
        title="Product shell rows are owned by Hito."
        body="Runner navigation, mobile navigation, profile triggers, sidebar width, and shell menu rows use one calm family instead of route-local spacing, width, and hover rules."
        status="Pattern"
        statusTone="signal"
        demo={
          <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
            <div className="hito-surface-flat min-w-0 p-4">
              <div className="hito-shell-nav">
                {(shellContext === "runner"
                  ? [
                      { label: "Calendar", icon: "calendar", active: true },
                      { label: "Progress", icon: "progress", active: false },
                      { label: "Connections", icon: "connections", active: false },
                    ]
                  : [
                      { label: "Overview", icon: "progress", active: true },
                      { label: "Work items", icon: "file-text", active: false },
                      { label: "Users", icon: "user", active: false },
                    ]
                ).map(({ label, icon, active }) => (
                  <div key={label} className="hito-shell-nav-row min-w-0" data-active={active}>
                    <Icon name={icon as HitoIconName} className="hito-shell-nav-icon" />
                    <span className="truncate">{label}</span>
                    {active && <span className="hito-shell-nav-dot" />}
                  </div>
                ))}
              </div>
            </div>
            <div className="grid min-w-0 gap-4">
              <button type="button" className="hito-shell-profile-trigger min-w-0">
                <span className="hito-shell-avatar-fallback h-9 w-9 rounded-full">
                  {shellContext === "runner" ? "IR" : "AD"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="hito-menu-text block truncate">
                    {shellContext === "runner" ? "Ivan" : "Admin"}
                  </span>
                  {shellProfileMeta && (
                    <span className="hito-menu-meta block truncate">
                      {shellContext === "runner" ? "Half Marathon Plan" : "Admin workspace"}
                    </span>
                  )}
                </span>
                <Icon name="chevron-down" size="sm" className="shrink-0 text-muted-foreground" />
              </button>
              {shellUtilityRows && (
                <div className="hito-row-group min-w-0">
                  <MenuRow icon="import" label="Advanced import" meta="Plan file" />
                  <MenuRow icon="settings" label="User settings" meta="Preferences" />
                  <MenuRow icon="connections" label="Connections" meta="Connected apps" />
                </div>
              )}
            </div>
          </div>
        }
        variants={
          <div className="grid min-w-0 gap-6">
            <div className="border-t border-hairline pt-5">
              <p className="hito-label">Runner and admin shell contexts</p>
              <p className="hito-caption mt-1">
                Context changes labels and destination meaning, but keeps the same shell row, active
                dot, profile trigger, and menu-row anatomy.
              </p>
              <div className="mt-4 grid min-w-0 gap-5 xl:grid-cols-2">
                {(["runner", "admin"] as const).map((context) => (
                  <div key={context} className="hito-surface-flat min-w-0 p-4">
                    <p className="hito-label mb-4 capitalize">{context}</p>
                    <div className="hito-shell-nav">
                      {(context === "runner"
                        ? [
                            { label: "Calendar", icon: "calendar", active: true },
                            { label: "Progress", icon: "progress", active: false },
                          ]
                        : [
                            { label: "Overview", icon: "progress", active: true },
                            { label: "Work items", icon: "file-text", active: false },
                          ]
                      ).map(({ label, icon, active }) => (
                        <div
                          key={label}
                          className="hito-shell-nav-row min-w-0"
                          data-active={active}
                        >
                          <Icon name={icon as HitoIconName} className="hito-shell-nav-icon" />
                          <span className="truncate">{label}</span>
                          {active && <span className="hito-shell-nav-dot" />}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-hairline pt-5">
              <p className="hito-label">Profile and utility rows</p>
              <p className="hito-caption mt-1">
                The profile trigger and utility rows use menu typography and quiet metadata, not
                duplicated page identity.
              </p>
              <div className="mt-4 grid min-w-0 gap-4 xl:grid-cols-2">
                <button type="button" className="hito-shell-profile-trigger min-w-0">
                  <span className="hito-shell-avatar-fallback h-9 w-9 rounded-full">IR</span>
                  <span className="min-w-0 flex-1">
                    <span className="hito-menu-text block truncate">Ivan</span>
                    <span className="hito-menu-meta block truncate">Manual plan</span>
                  </span>
                  <Icon name="chevron-down" size="sm" className="shrink-0 text-muted-foreground" />
                </button>
                <div className="hito-row-group min-w-0">
                  <MenuRow icon="settings" label="Account settings" meta="Profile" />
                  <MenuRow icon="logout" label="Sign out" meta="Account" />
                </div>
              </div>
            </div>
          </div>
        }
        controls={
          <div className="hito-row-group border-0">
            <div className="hito-list-row items-start">
              <ChoiceSelector
                label="Context"
                value={shellContext}
                options={SHELL_CONTEXTS}
                onChange={setShellContext}
              />
            </div>
            <ToggleRow
              label="Profile meta"
              active={shellProfileMeta}
              onToggle={() => setShellProfileMeta((v) => !v)}
            />
            <ToggleRow
              label="Utility rows"
              active={shellUtilityRows}
              onToggle={() => setShellUtilityRows((v) => !v)}
            />
          </div>
        }
        caption={[
          {
            label: "Use for",
            body: "Global product navigation, profile/account triggers, mobile shell rows, and admin or runner workspace navigation.",
          },
          {
            label: "Does not imply",
            body: "Section-local actions, page headers, cards, or duplicated workspace identity inside content.",
          },
          {
            label: "Width owner",
            body: "Runner sidebar and profile, plan, and account menus use named shell width presets instead of route-local width utilities.",
          },
          {
            label: "Used in",
            body: (
              <ProductLinks
                links={[
                  { href: "/", label: "/" },
                  { href: "/admin/analytics", label: "/admin/analytics" },
                ]}
              />
            ),
          },
        ]}
      />

      <DropdownFamilyPlayground />
    </>
  );
}

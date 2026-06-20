import { type ReactNode, useState } from "react";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HitoDsPlayground } from "@/components/hito-ds/playground";
import { Icon, type HitoIconName } from "@/components/ui/icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type DropdownRowRecipe = "simple" | "description" | "meta" | "selected";
type DropdownAffordance = "shortcut" | "count" | "chevron";
type DropdownDensity = "standard" | "compact";

const ROW_RECIPE_COPY: Record<DropdownRowRecipe, { label: string; description: string }> = {
  simple: {
    label: "Simple row",
    description: "One direct action with no secondary line.",
  },
  description: {
    label: "Icon + description",
    description: "A primary label plus one calm support line.",
  },
  meta: {
    label: "Trailing meta",
    description: "A row with a shortcut, count, or right-side affordance.",
  },
  selected: {
    label: "Selected row",
    description: "Current selection shown with the shared selected treatment.",
  },
};

export function DropdownFamilyPlayground() {
  const [rowRecipe, setRowRecipe] = useState<DropdownRowRecipe>("description");
  const [affordance, setAffordance] = useState<DropdownAffordance>("shortcut");
  const [density, setDensity] = useState<DropdownDensity>("standard");
  const [showIcons, setShowIcons] = useState(true);
  const [showHeaderFooter, setShowHeaderFooter] = useState(true);

  const settings: DropdownPlaygroundSettings = {
    affordance,
    density,
    rowRecipe,
    showHeaderFooter,
    showIcons,
  };

  return (
    <HitoDsPlayground
      id="dropdowns"
      label="Dropdowns"
      title="One dropdown and list-item family."
      body="Dropdowns, selects, and list-item-like triggers share one Hito menu surface and row grammar. The specimen separates the live component demo from static anatomy coverage so interactive behavior and state documentation do not compete."
      status="Documented family"
      statusTone="signal"
      demo={<DropdownFamilyStage mode="demo" settings={settings} />}
      variants={<DropdownFamilyStage mode="variants" settings={settings} />}
      controls={
        <DropdownSettingsPanel
          onAffordanceChange={setAffordance}
          onDensityChange={setDensity}
          onRowRecipeChange={setRowRecipe}
          onShowHeaderFooterChange={setShowHeaderFooter}
          onShowIconsChange={setShowIcons}
          settings={settings}
        />
      }
      caption={[
        {
          label: "Proves",
          body: "The interactive tab opens the real Radix-backed DropdownMenu. The anatomy tab keeps every important menu row state visible without relying on hover-only or portal-only screenshots.",
        },
        {
          label: "Does not imply",
          body: "New product actions, route-local menu state, or a second menu framework.",
        },
        {
          label: "Used in",
          body: "Manual calendar actions, admin filters, profile/account menus, compact controls, and Figma export menu boards.",
        },
      ]}
    />
  );
}

type DropdownPlaygroundSettings = {
  affordance: DropdownAffordance;
  density: DropdownDensity;
  rowRecipe: DropdownRowRecipe;
  showHeaderFooter: boolean;
  showIcons: boolean;
};

function DropdownFamilyStage({
  mode,
  settings,
}: {
  mode: "demo" | "variants";
  settings: DropdownPlaygroundSettings;
}) {
  return (
    <div className="grid min-w-0 gap-5">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3 border-b border-hairline pb-3">
        <div className="min-w-0">
          <p className="hito-label">{mode === "demo" ? "Demo" : "Variants"}</p>
          <h3 className="hito-list-row-title mt-1">
            {mode === "demo"
              ? "One real trigger, one real dropdown"
              : "Always-visible row and state anatomy"}
          </h3>
        </div>
        <span className="hito-status-pill" data-tone="neutral">
          Shared wrapper
        </span>
      </div>

      {mode === "demo" ? (
        <InteractiveDropdownDemo settings={settings} />
      ) : (
        <DropdownAnatomyDemo settings={settings} />
      )}
    </div>
  );
}

function DropdownSettingsPanel({
  onAffordanceChange,
  onDensityChange,
  onRowRecipeChange,
  onShowHeaderFooterChange,
  onShowIconsChange,
  settings,
}: {
  onAffordanceChange: (value: DropdownAffordance) => void;
  onDensityChange: (value: DropdownDensity) => void;
  onRowRecipeChange: (value: DropdownRowRecipe) => void;
  onShowHeaderFooterChange: (value: boolean) => void;
  onShowIconsChange: (value: boolean) => void;
  settings: DropdownPlaygroundSettings;
}) {
  return (
    <div className="grid min-w-0 gap-5">
      <div className="grid gap-3">
        <p className="hito-form-label">Settings</p>
        <SettingSelect
          label="Row content"
          value={settings.rowRecipe}
          onChange={(value) => onRowRecipeChange(value as DropdownRowRecipe)}
          options={[
            { value: "simple", label: "Simple" },
            { value: "description", label: "Icon + description" },
            { value: "meta", label: "Trailing meta" },
            { value: "selected", label: "Selected" },
          ]}
        />
        <SettingSelect
          label="Right affordance"
          value={settings.affordance}
          onChange={(value) => onAffordanceChange(value as DropdownAffordance)}
          options={[
            { value: "shortcut", label: "Shortcut" },
            { value: "count", label: "Count" },
            { value: "chevron", label: "Chevron" },
          ]}
        />
        <SettingSelect
          label="List treatment"
          value={settings.density}
          onChange={(value) => onDensityChange(value as DropdownDensity)}
          options={[
            { value: "standard", label: "Standard" },
            { value: "compact", label: "Compact" },
          ]}
        />
      </div>

      <div className="grid gap-2">
        <p className="hito-form-label">Chrome</p>
        <div className="grid gap-2">
          <ToggleSetting
            active={settings.showIcons}
            label="Left icons"
            onChange={onShowIconsChange}
          />
          <ToggleSetting
            active={settings.showHeaderFooter}
            label="Header and footer"
            onChange={onShowHeaderFooterChange}
          />
        </div>
      </div>

      <div className="hito-row-group border-0">
        <AnatomyRow label="Surface" body="hito-ui-menu-surface" />
        <AnatomyRow label="Item" body="hito-ui-menu-item" />
        <AnatomyRow label="Select parity" body="SelectContent / SelectItem" />
      </div>
    </div>
  );
}

function InteractiveDropdownDemo({ settings }: { settings: DropdownPlaygroundSettings }) {
  const recipe = ROW_RECIPE_COPY[settings.rowRecipe];

  return (
    <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.62fr)]">
      <div className="grid min-w-0 content-start gap-4">
        <div>
          <p className="hito-label">Live component</p>
          <p className="hito-caption mt-1">
            This is the real dropdown trigger and content. Open it to verify keyboard, focus, menu
            surface, submenu, disabled, and destructive behavior.
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="hito-list-row min-w-0 w-full max-w-full rounded-2xl border border-hairline bg-background/60 text-left transition-colors hover:bg-background/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/20"
            >
              <span className="flex min-w-0 items-center gap-3">
                <Icon name="settings" size="sm" className="shrink-0 text-muted-foreground" />
                <span className="min-w-0">
                  <span className="hito-list-row-title block truncate">Workout menu trigger</span>
                  <span className="hito-list-row-copy block truncate">{recipe.description}</span>
                </span>
              </span>
              <Icon name="chevron-down" size="sm" className="shrink-0 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[min(20rem,calc(100vw-2rem))]">
            {settings.showHeaderFooter ? (
              <>
                <DropdownMenuLabel>Calendar actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
              </>
            ) : null}
            <DropdownMenuItem
              data-selected={settings.rowRecipe === "selected" ? "true" : undefined}
            >
              <MenuItemContent
                description={
                  settings.rowRecipe === "description" ? "Use one calm support line." : undefined
                }
                icon={settings.showIcons ? "activity" : undefined}
                label={recipe.label}
                meta={rowMeta(settings)}
              />
            </DropdownMenuItem>
            <DropdownMenuItem>
              <MenuItemContent
                icon={settings.showIcons ? "copy" : undefined}
                label="Copy workout"
                meta={settings.affordance === "shortcut" ? "Cmd C" : undefined}
              />
            </DropdownMenuItem>
            <DropdownMenuCheckboxItem checked>
              <MenuItemContent label="Show selected rows" meta="On" />
            </DropdownMenuCheckboxItem>
            <DropdownMenuRadioGroup value="standard">
              <DropdownMenuRadioItem value="standard">
                <MenuItemContent label="Standard density" />
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuItem disabled>
              <MenuItemContent
                description="Blocked states stay in the same row family."
                icon={settings.showIcons ? "shield-alert" : undefined}
                label="Disabled item"
              />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <MenuItemContent
                  description="Nested choices keep the same menu surface."
                  icon={settings.showIcons ? "sparkles" : undefined}
                  label="Choose template"
                />
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-60">
                <DropdownMenuLabel>Templates</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <MenuItemContent icon="activity" label="Easy aerobic run" />
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <MenuItemContent icon="trophy" label="Long run" />
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem data-tone="destructive">
              <MenuItemContent
                icon={settings.showIcons ? "trash" : undefined}
                label="Clear workout"
              />
            </DropdownMenuItem>
            {settings.showHeaderFooter ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <MenuItemContent icon="plus" label="Footer action" meta="Add" />
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid min-w-0 content-start gap-3">
        <p className="hito-label">Select parity</p>
        <p className="hito-caption">
          Select uses the same Hito menu surface, item rhythm, selected indicator, and chevron
          affordance.
        </p>
        <Select defaultValue="easy">
          <SelectTrigger aria-label="Select menu-family workout type">
            <SelectValue placeholder="Workout type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="easy">Easy run</SelectItem>
            <SelectItem value="steady">Steady run</SelectItem>
            <SelectItem value="long">Long run</SelectItem>
            <SelectItem value="quality">Quality workout</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function DropdownAnatomyDemo({ settings }: { settings: DropdownPlaygroundSettings }) {
  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-2">
      <OpenMenuSurface title="Core rows" settings={settings}>
        <StaticMenuItem label="Simple label" settings={settings} />
        <StaticMenuItem icon="plus" label="Icon row" settings={settings} />
        <StaticMenuItem
          description="Use one calm support line when the choice needs context."
          icon="activity"
          label="Icon + description"
          settings={settings}
        />
        <StaticMenuItem icon="copy" label="Trailing meta" meta="Cmd C" settings={settings} />
        <StaticMenuItem
          icon="check"
          label="Selected row"
          meta="Current"
          selected
          settings={settings}
        />
      </OpenMenuSurface>

      <OpenMenuSurface
        title="States and nested rows"
        settings={settings}
        footer={
          settings.showHeaderFooter ? (
            <div className="flex flex-wrap justify-end gap-2 px-2 py-2">
              <button type="button" className="hito-button hito-button-ghost hito-button-xs">
                Cancel
              </button>
              <button type="button" className="hito-button hito-button-secondary hito-button-xs">
                Apply
              </button>
            </div>
          ) : null
        }
      >
        <StaticMenuItem
          icon="check"
          label="Checkbox-style row"
          meta="On"
          selected
          settings={settings}
        />
        <StaticMenuItem
          icon="circle"
          label="Radio-style row"
          meta="Easy"
          selected
          settings={settings}
        />
        <StaticMenuItem icon="trash" label="Destructive row" destructive settings={settings} />
        <StaticMenuItem
          description="Explain the blocked state near the disabled control."
          icon="shield-alert"
          label="Disabled row"
          disabled
          settings={settings}
        />
        <StaticMenuItem
          description="Second-level options use the same menu surface."
          icon="sparkles"
          label="Submenu trigger"
          meta={<Icon name="chevron-right" size="xs" />}
          open
          settings={settings}
        />
      </OpenMenuSurface>
    </div>
  );
}

function SettingSelect({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="hito-label">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}

function ToggleSetting({
  active,
  label,
  onChange,
}: {
  active: boolean;
  label: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      className="hito-list-row rounded-2xl border border-hairline bg-background/45 text-left"
      aria-pressed={active}
      onClick={() => onChange(!active)}
    >
      <span className="min-w-0">
        <span className="hito-list-row-title block truncate">{label}</span>
        <span className="hito-list-row-copy block truncate">{active ? "Visible" : "Hidden"}</span>
      </span>
      <span className="hito-status-pill shrink-0" data-tone={active ? "signal" : "muted"}>
        {active ? "On" : "Off"}
      </span>
    </button>
  );
}

function OpenMenuSurface({
  children,
  footer,
  settings,
  title,
}: {
  children: ReactNode;
  footer?: ReactNode;
  settings: DropdownPlaygroundSettings;
  title: string;
}) {
  return (
    <div className="hito-ui-menu-surface grid gap-1 p-1" data-hito-ds-open-menu-specimen={title}>
      {settings.showHeaderFooter ? (
        <>
          <div className="hito-ui-menu-label px-2 py-1.5">{title}</div>
          <div className="hito-ui-menu-separator -mx-1 my-1" />
        </>
      ) : null}
      {children}
      {footer ? (
        <>
          <div className="hito-ui-menu-separator -mx-1 my-1" />
          {footer}
        </>
      ) : null}
    </div>
  );
}

function MenuItemContent({
  description,
  icon,
  label,
  meta,
}: {
  description?: string;
  icon?: HitoIconName;
  label: string;
  meta?: ReactNode;
}) {
  return (
    <>
      {icon ? <Icon name={icon} size="sm" className="text-muted-foreground" /> : null}
      <span className="min-w-0 flex-1">
        <span className="block truncate">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs font-normal leading-snug text-muted-foreground">
            {description}
          </span>
        ) : null}
      </span>
      {meta ? <DropdownMenuShortcut>{meta}</DropdownMenuShortcut> : null}
    </>
  );
}

function StaticMenuItem({
  description,
  destructive,
  disabled,
  highlighted,
  icon,
  label,
  meta,
  open,
  selected,
  settings,
}: {
  description?: string;
  destructive?: boolean;
  disabled?: boolean;
  highlighted?: boolean;
  icon?: HitoIconName;
  label: string;
  meta?: ReactNode;
  open?: boolean;
  selected?: boolean;
  settings: DropdownPlaygroundSettings;
}) {
  return (
    <div
      className={cn(
        "hito-ui-menu-item relative flex cursor-default select-none items-center gap-2 px-2 outline-none",
        settings.density === "compact" ? "py-1" : "py-1.5",
      )}
      data-disabled={disabled ? true : undefined}
      data-highlighted={highlighted ? true : undefined}
      data-selected={selected ? "true" : undefined}
      data-state={open ? "open" : undefined}
      data-tone={destructive ? "destructive" : undefined}
    >
      {icon && settings.showIcons ? (
        <Icon name={icon} size="sm" className="text-muted-foreground" />
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block truncate">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs font-normal leading-snug text-muted-foreground">
            {description}
          </span>
        ) : null}
      </span>
      {meta ? <span className="hito-ui-menu-shortcut">{meta}</span> : null}
    </div>
  );
}

function AnatomyRow({ body, label }: { body: string; label: string }) {
  return (
    <div className="hito-list-row py-3">
      <span className="hito-list-row-title">{label}</span>
      <code className="hito-technical-mono text-xs text-muted-foreground">{body}</code>
    </div>
  );
}

function rowMeta(settings: DropdownPlaygroundSettings) {
  if (settings.rowRecipe === "simple" || settings.rowRecipe === "description") {
    return undefined;
  }

  if (settings.affordance === "count") {
    return "3";
  }

  if (settings.affordance === "chevron") {
    return <Icon name="chevron-right" size="xs" />;
  }

  return settings.rowRecipe === "selected" ? "Current" : "Cmd K";
}

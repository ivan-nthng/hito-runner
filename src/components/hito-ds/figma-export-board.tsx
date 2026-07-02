import type { ReactNode } from "react";

import { DemoButton, DemoInput } from "@/components/hito-ds/specimen-previews";
import { HitoMetadataTag } from "@/components/ui/metadata-tag";
import {
  HITO_ICON_META,
  HITO_ICON_SIZES,
  Icon,
  type HitoIconName,
  type HitoIconSize,
} from "@/components/ui/icon";
import {
  WORKOUT_PRIMITIVE_PALETTE_FAMILIES,
  WORKOUT_SECTION_COLOR_ROLES,
  WORKOUT_TYPE_COLOR_ROLES,
  workoutSectionColorToken,
  workoutTypeColorToken,
} from "@/lib/workout-color-tokens";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outlined" | "ghost";
type ButtonTone = "default" | "success" | "error";
type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";
type InputVariant = "primary" | "secondary";
type InputSize = ButtonSize;
type InputState = "default" | "hover" | "focus" | "disabled" | "readonly";
type InputFeedback = "neutral" | "error" | "success";

const BUTTON_VARIANTS: ButtonVariant[] = ["primary", "secondary", "outlined", "ghost"];
const BUTTON_TONES: ButtonTone[] = ["default", "success", "error"];
const BUTTON_SIZES: ButtonSize[] = ["xs", "sm", "md", "lg", "xl"];
const INPUT_VARIANTS: InputVariant[] = ["primary", "secondary"];
const INPUT_SIZES: InputSize[] = ["xs", "sm", "md", "lg", "xl"];
const STATUS_TONES = ["neutral", "signal", "success", "warning", "destructive", "rollout", "muted"];

type TokenGridItem = { name: string; token: string; note: string };

const WORKOUT_RAW_COLOR_TOKENS: readonly TokenGridItem[] = WORKOUT_PRIMITIVE_PALETTE_FAMILIES.map(
  (palette) => ({
    name: `${palette.label} 500`,
    token: `${palette.tokenPrefix}-500`,
    note: `Workout primitive base ${palette.base}`,
  }),
);

const RAW_COLOR_TOKENS: readonly TokenGridItem[] = [
  { name: "stone-950", token: "--stone-950", note: "Deepest shell background" },
  { name: "stone-900", token: "--stone-900", note: "App background" },
  { name: "stone-850", token: "--stone-850", note: "Base surface" },
  { name: "stone-800", token: "--stone-800", note: "Elevated muted surface" },
  { name: "sand-50", token: "--sand-50", note: "Bright foreground reserve" },
  { name: "sand-100", token: "--sand-100", note: "Primary text" },
  { name: "sand-200", token: "--sand-200", note: "Secondary foreground" },
  { name: "amber-500", token: "--amber-500", note: "Hito signal" },
  { name: "blue-500", token: "--blue-500", note: "Information" },
  { name: "terracotta-500", token: "--terracotta-500", note: "Destructive/error" },
  { name: "green-500", token: "--green-500", note: "Success" },
  { name: "orange-500", token: "--orange-500", note: "Workout accent" },
  { name: "red-500", token: "--red-500", note: "Critical destructive" },
  ...WORKOUT_RAW_COLOR_TOKENS,
];

const WORKOUT_SEMANTIC_COLOR_TOKENS: readonly TokenGridItem[] = [
  ...WORKOUT_TYPE_COLOR_ROLES.map((role) => ({
    name: `workout ${role.label}`,
    token: workoutTypeColorToken(role.type),
    note: `Maps to ${role.primitive}`,
  })),
  ...WORKOUT_SECTION_COLOR_ROLES.map((role) => ({
    name: `section ${role.label}`,
    token: workoutSectionColorToken(role.type),
    note: `Maps to ${role.primitive}`,
  })),
];

const SEMANTIC_COLOR_TOKENS: readonly TokenGridItem[] = [
  { name: "background", token: "--background", note: "Route canvas" },
  { name: "foreground", token: "--foreground", note: "Primary text" },
  { name: "surface", token: "--surface", note: "Base panel" },
  { name: "surface-elevated", token: "--surface-elevated", note: "Raised panel" },
  { name: "muted", token: "--muted", note: "Quiet controls" },
  { name: "muted-foreground", token: "--muted-foreground", note: "Support copy" },
  { name: "hairline", token: "--hairline", note: "Dividers and outlines" },
  { name: "signal", token: "--signal", note: "Primary Hito action" },
  { name: "success", token: "--success", note: "Completed/saved" },
  { name: "warn", token: "--warn", note: "Caution" },
  { name: "destructive", token: "--destructive", note: "Delete/error" },
  { name: "easy", token: "--easy", note: "Compatibility alias for workout Easy" },
  { name: "long", token: "--long", note: "Compatibility alias for workout Long Run" },
  { name: "quality", token: "--quality", note: "Compatibility alias for workout Tempo" },
  { name: "rest", token: "--rest", note: "Compatibility alias for workout Rest" },
  ...WORKOUT_SEMANTIC_COLOR_TOKENS,
];

const SPACING_TOKENS = [
  { name: "space-1", token: "--space-1", value: "0.25rem" },
  { name: "space-2", token: "--space-2", value: "0.5rem" },
  { name: "space-3", token: "--space-3", value: "0.75rem" },
  { name: "space-4", token: "--space-4", value: "1rem" },
  { name: "space-5", token: "--space-5", value: "1.25rem" },
  { name: "space-6", token: "--space-6", value: "1.5rem" },
  { name: "space-8", token: "--space-8", value: "2rem" },
  { name: "space-10", token: "--space-10", value: "2.5rem" },
] as const;

const RADIUS_TOKENS = [
  { name: "radius-sm", token: "--radius-sm" },
  { name: "radius-md", token: "--radius-md" },
  { name: "radius-lg", token: "--radius-lg" },
  { name: "radius-xl", token: "--radius-xl" },
  { name: "radius-2xl", token: "--radius-2xl" },
  { name: "radius-3xl", token: "--radius-3xl" },
] as const;

const TYPOGRAPHY_ROLES = [
  { role: "Display title", className: "hito-display-title", text: "10k plan preview" },
  { role: "Section title", className: "hito-section-title", text: "Calendar states" },
  { role: "Panel title", className: "hito-panel-title", text: "Workout detail" },
  { role: "Modal title", className: "hito-modal-title", text: "Review move" },
  {
    role: "Body",
    className: "hito-body",
    text: "Readable runner-facing copy for product surfaces.",
  },
  {
    role: "Body small",
    className: "hito-body-small",
    text: "Secondary explanation and support text.",
  },
  { role: "Label", className: "hito-label", text: "Manual plan" },
  { role: "Form label", className: "hito-form-label", text: "Running level" },
  { role: "Micro label", className: "hito-micro-label", text: "STATUS CHROME" },
  { role: "Caption", className: "hito-caption", text: "Captured from live Hito DS classes." },
  { role: "Technical mono", className: "hito-technical-mono", text: "training-plan-v2" },
] as const;

const BUTTON_STATES: Array<{
  label: string;
  demoState?: "hover" | "focus" | "active";
  disabled?: boolean;
  loading?: boolean;
}> = [
  { label: "Default" },
  { label: "Hover", demoState: "hover" },
  { label: "Focus", demoState: "focus" },
  { label: "Pressed", demoState: "active" },
  { label: "Disabled", disabled: true },
  { label: "Loading", loading: true, disabled: true },
];

const INPUT_STATE_SPECIMENS: Array<{
  label: string;
  state?: InputState;
  feedback?: InputFeedback;
  value?: string;
  placeholder?: string;
}> = [
  { label: "Empty", placeholder: "Search plans" },
  { label: "Filled", value: "Marathon base" },
  { label: "Hover", state: "hover" },
  { label: "Focus", state: "focus", value: "Running level" },
  { label: "Error", feedback: "error", value: "0" },
  { label: "Success", feedback: "success", value: "Saved value" },
  { label: "Readonly", state: "readonly" },
  { label: "Disabled", state: "disabled", placeholder: "Unavailable" },
];

const SELECT_TRIGGER_STATES = [
  { label: "Default", value: "Workout type" },
  { label: "Open", value: "Easy run", state: "open" },
  { label: "Hover", value: "Steady run", demoState: "hover" },
  { label: "Focus", value: "Long run", demoState: "focus" },
  { label: "Disabled", value: "Unavailable", disabled: true },
  { label: "Placeholder", value: "Choose option", placeholder: true },
  { label: "Selected", value: "Quality workout" },
] as const;

const DROPDOWN_TRIGGER_SIZES: ButtonSize[] = ["xs", "sm", "md", "lg", "xl"];

const BUTTON_ICON_TREATMENTS = [
  { label: "Left icon", props: { leftIcon: true } },
  { label: "Right icon", props: { rightIcon: true } },
  { label: "Both icons", props: { leftIcon: true, rightIcon: true } },
  { label: "Loading", props: { loading: true, disabled: true } },
] as const;

const ICON_EXPORT_GROUPS: Array<{
  label: string;
  icons: HitoIconName[];
}> = [
  {
    label: "Buttons",
    icons: ["circle", "arrow-right", "loader", "more-horizontal", "plus"],
  },
  {
    label: "Dropdowns and menus",
    icons: ["chevron-down", "chevron-right", "activity", "copy", "check", "trash", "shield-alert"],
  },
  {
    label: "Status and readback",
    icons: [
      "warning",
      "x-circle",
      "check-circle",
      "plan-note",
      "trophy",
      "watch",
      "calendar-clock",
    ],
  },
  {
    label: "Utility surfaces",
    icons: ["search", "close", "sparkles", "download", "upload", "settings"],
  },
];

const ICON_SIZE_SPECIMENS: HitoIconName[] = ["plus", "chevron-down", "loader", "warning"];

export function HitoFigmaExportBoard() {
  return (
    <main className="min-h-screen bg-background px-[max(1.5rem,4vw)] py-10 text-foreground">
      <div className="mx-auto grid w-full max-w-[1600px] gap-8">
        <header className="grid gap-4 border-b border-hairline pb-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="hito-status-pill" data-tone="signal">
              Hito DS export
            </span>
            <span className="hito-status-pill" data-tone="muted">
              html.to.design capture board
            </span>
          </div>
          <div className="grid gap-3">
            <h1 className="hito-display-title max-w-5xl">Figma export surface</h1>
            <p className="hito-body max-w-3xl">
              Code-owned Hito DS matrices for html.to.design capture/import. This page renders
              visible states explicitly and does not generate `.h2d` directly.
            </p>
          </div>
        </header>

        <ExportSection
          eyebrow="Foundations"
          id="foundations"
          title="Token and typography boards"
          body="Raw primitives, semantic tokens, spacing, radius, and text roles captured from live CSS variables and Hito typography classes."
        >
          <div className="grid gap-6">
            <TokenGrid title="Raw color primitives" tokens={RAW_COLOR_TOKENS} />
            <TokenGrid title="Semantic color tokens" tokens={SEMANTIC_COLOR_TOKENS} />
            <SpacingRadiusGrid />
            <TypographyGrid />
          </div>
        </ExportSection>

        <ExportSection
          eyebrow="Buttons"
          id="buttons"
          title="Button variants, sizes, tones, and explicit states"
          body="Uses the same hito-button classes and DemoButton helper documented in /hitoDS."
        >
          <ButtonMatrix />
        </ExportSection>

        <ExportSection
          eyebrow="Inputs"
          id="inputs"
          title="Fields, feedback, icons, textarea, readonly, and disabled"
          body="Uses hito-field classes plus explicit demo states so Figma import does not depend on live hover/focus."
        >
          <InputMatrix />
        </ExportSection>

        <ExportSection
          eyebrow="Dropdowns"
          id="dropdowns"
          title="Select triggers and menu item anatomy"
          body="Uses Hito select/menu surface and item classes, with every important row state visible without opening a portal during capture."
        >
          <DropdownMatrix />
        </ExportSection>

        <ExportSection
          eyebrow="Status"
          id="status"
          title="Status chips and metadata tags"
          body="Includes readable status chip tones plus the shared metadata tag primitive."
        >
          <StatusMatrix />
        </ExportSection>

        <ExportSection
          eyebrow="Icons"
          id="icons"
          title="Icon inventory for controls, menus, and readback"
          body="Uses the shared Tabler-backed Hito icon registry so Figma import captures the same semantic glyphs product controls use."
        >
          <IconInventory />
        </ExportSection>
      </div>
    </main>
  );
}

function ExportSection({
  body,
  children,
  eyebrow,
  id,
  title,
}: {
  body: string;
  children: ReactNode;
  eyebrow: string;
  id: string;
  title: string;
}) {
  return (
    <section className="grid gap-5 border-t border-hairline pt-8" data-figma-export-section={id}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <p className="hito-label hito-label-signal">{eyebrow}</p>
          <h2 className="hito-section-title mt-2">{title}</h2>
          <p className="hito-body-small mt-2">{body}</p>
        </div>
      </div>
      <div className="min-w-0 rounded-3xl border border-hairline bg-surface/55 p-5 lg:p-6">
        {children}
      </div>
    </section>
  );
}

function TokenGrid({ title, tokens }: { title: string; tokens: ReadonlyArray<TokenGridItem> }) {
  return (
    <div className="grid gap-3">
      <h3 className="hito-label">{title}</h3>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        {tokens.map((token) => (
          <article
            key={token.token}
            className="rounded-2xl border border-hairline bg-background/55 p-3"
          >
            <div
              className="h-16 rounded-xl border border-hairline"
              data-token-swatch={token.token}
              style={{ background: `var(${token.token})` }}
            />
            <p className="hito-list-row-title mt-3">{token.name}</p>
            <code className="hito-technical-mono mt-1 block">{token.token}</code>
            <p className="hito-caption mt-1">{token.note}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function SpacingRadiusGrid() {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="grid gap-3">
        <h3 className="hito-label">Spacing scale</h3>
        <div className="grid gap-2 rounded-2xl border border-hairline bg-background/55 p-4">
          {SPACING_TOKENS.map((token) => (
            <div key={token.token} className="grid grid-cols-[7rem_1fr_4rem] items-center gap-3">
              <code className="hito-technical-mono">{token.token}</code>
              <span
                className="block h-3 rounded-full bg-signal"
                style={{ width: `var(${token.token})` }}
              />
              <span className="hito-caption text-right">{token.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        <h3 className="hito-label">Radius scale</h3>
        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-hairline bg-background/55 p-4 md:grid-cols-3">
          {RADIUS_TOKENS.map((token) => (
            <div key={token.token} className="grid gap-2">
              <div
                className="h-16 border border-hairline bg-muted/65"
                style={{ borderRadius: `var(${token.token})` }}
              />
              <code className="hito-technical-mono">{token.token}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TypographyGrid() {
  return (
    <div className="grid gap-3">
      <h3 className="hito-label">Typography roles</h3>
      <div className="grid gap-3 rounded-2xl border border-hairline bg-background/55 p-4">
        {TYPOGRAPHY_ROLES.map((role) => (
          <div
            key={role.className}
            className="grid gap-2 border-b border-hairline pb-3 last:border-0"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="hito-caption">{role.role}</span>
              <code className="hito-technical-mono">{role.className}</code>
            </div>
            <p className={role.className}>{role.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ButtonMatrix() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4">
        <h3 className="hito-label">Size × variant × tone matrix</h3>
        {BUTTON_TONES.map((tone) => (
          <MatrixPanel key={tone} title={`Tone: ${tone}`}>
            <div className="grid gap-3">
              {BUTTON_SIZES.map((size) => (
                <div key={`${tone}-${size}`} className="flex min-w-0 flex-wrap items-center gap-3">
                  <span className="hito-caption w-12 shrink-0">{size}</span>
                  {BUTTON_VARIANTS.map((variant) => (
                    <DemoButton
                      key={`${tone}-${size}-${variant}`}
                      variant={variant}
                      tone={tone}
                      size={size}
                    />
                  ))}
                </div>
              ))}
            </div>
          </MatrixPanel>
        ))}
      </div>

      <div className="grid gap-4">
        <h3 className="hito-label">Rendered states · md size</h3>
        <div className="grid gap-3 xl:grid-cols-3">
          {BUTTON_TONES.map((tone) => (
            <MatrixPanel key={`states-${tone}`} title={`Tone: ${tone}`}>
              <div className="grid gap-3">
                {BUTTON_STATES.map((state) => (
                  <div
                    key={`${tone}-${state.label}`}
                    className="flex min-w-0 flex-wrap items-center gap-3"
                  >
                    <span className="hito-caption w-16 shrink-0">{state.label}</span>
                    {BUTTON_VARIANTS.map((variant) => (
                      <DemoButton
                        key={`${tone}-${state.label}-${variant}`}
                        variant={variant}
                        tone={tone}
                        size="md"
                        demoState={state.demoState}
                        disabled={state.disabled}
                        loading={state.loading}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </MatrixPanel>
          ))}
        </div>
      </div>

      <MatrixPanel title="Icon grammar">
        <div className="grid gap-3">
          {BUTTON_SIZES.map((size) => (
            <div
              key={`icon-treatment-${size}`}
              className="flex min-w-0 flex-wrap items-center gap-3"
            >
              <span className="hito-caption w-12 shrink-0">{size}</span>
              {BUTTON_ICON_TREATMENTS.map((treatment) => (
                <DemoButton
                  key={`${size}-${treatment.label}`}
                  variant="secondary"
                  size={size}
                  {...treatment.props}
                />
              ))}
              <button
                type="button"
                className={cn(
                  "hito-button hito-button-ghost aspect-square px-0",
                  `hito-button-${size}`,
                )}
                aria-label={`Icon-only ghost action ${size}`}
              >
                <Icon name="more-horizontal" size={size === "xs" || size === "sm" ? "xs" : "sm"} />
              </button>
            </div>
          ))}
        </div>
      </MatrixPanel>
    </div>
  );
}

function InputMatrix() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4">
        <h3 className="hito-label">Size × variant matrix</h3>
        <div className="grid gap-3 xl:grid-cols-2">
          {INPUT_VARIANTS.map((variant) => (
            <MatrixPanel key={variant} title={`Variant: ${variant}`}>
              <div className="grid gap-3">
                {INPUT_SIZES.map((size) => (
                  <div
                    key={`${variant}-${size}`}
                    className="grid grid-cols-[4rem_1fr] items-center gap-3"
                  >
                    <span className="hito-caption">{size}</span>
                    <DemoInput variant={variant} size={size} leftIcon rightIcon />
                  </div>
                ))}
              </div>
            </MatrixPanel>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        <h3 className="hito-label">Rendered states · md primary field</h3>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {INPUT_STATE_SPECIMENS.map((item) => (
            <MatrixPanel key={item.label} title={item.label}>
              <div className="grid gap-2">
                <DemoInput
                  variant="primary"
                  size="md"
                  leftIcon
                  rightIcon={item.feedback !== "neutral"}
                  state={item.state}
                  feedback={item.feedback}
                  placeholder={item.placeholder}
                  value={item.value}
                />
                <span
                  className={cn(
                    item.feedback === "error"
                      ? "hito-field-error"
                      : item.feedback === "success"
                        ? "hito-field-success"
                        : "hito-field-helper",
                  )}
                >
                  {item.feedback === "error"
                    ? "Value needs review."
                    : item.feedback === "success"
                      ? "Saved profile value is valid."
                      : "Helper text stays quiet and readable."}
                </span>
              </div>
            </MatrixPanel>
          ))}
        </div>
      </div>

      <MatrixPanel title="Textarea">
        <label className="grid max-w-xl gap-2">
          <span className="hito-form-label">Training note</span>
          <textarea
            className="hito-field hito-field-primary hito-textarea-md resize-none"
            readOnly
            rows={4}
            value="Keep the long run easy. Use this field for longer runner-authored notes."
          />
          <span className="hito-field-helper">Textarea uses field chrome with taller content.</span>
        </label>
      </MatrixPanel>
    </div>
  );
}

function DropdownMatrix() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4">
        <h3 className="hito-label">List-item trigger size ladder</h3>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {DROPDOWN_TRIGGER_SIZES.map((size) => (
            <MatrixPanel key={`dropdown-trigger-${size}`} title={size.toUpperCase()}>
              <StaticSelectTrigger
                label={`${size} trigger`}
                value={`${size.toUpperCase()} trigger`}
                size={size}
              />
            </MatrixPanel>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        <h3 className="hito-label">Select / dropdown trigger states</h3>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {SELECT_TRIGGER_STATES.map((state) => (
            <MatrixPanel key={state.label} title={state.label}>
              <StaticSelectTrigger {...state} />
            </MatrixPanel>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        <h3 className="hito-label">Menu item row anatomy</h3>
        <div className="grid gap-4 xl:grid-cols-3">
          <div className="hito-ui-menu-surface grid gap-1 p-1">
            <div className="hito-ui-menu-label px-2 py-1.5">Calendar actions</div>
            <div className="hito-ui-menu-separator -mx-1 my-1" />
            <StaticMenuItem label="Simple label" />
            <StaticMenuItem icon="plus" label="Icon + label" />
            <StaticMenuItem
              icon="activity"
              label="Icon + description"
              description="Use for choices that need one calm support line."
            />
            <StaticMenuItem icon="copy" label="Trailing shortcut" meta="Cmd C" />
            <StaticMenuItem icon="check" label="Selected item" meta="Current" selected />
          </div>

          <div className="hito-ui-menu-surface grid gap-1 p-1">
            <div className="hito-ui-menu-label px-2 py-1.5">State rows</div>
            <div className="hito-ui-menu-separator -mx-1 my-1" />
            <StaticMenuItem
              icon="sparkles"
              label="Description + meta"
              description="Nested choices keep the same row anatomy."
              meta="3"
            />
            <StaticMenuItem icon="check" label="Checkbox-style row" meta="On" selected />
            <StaticMenuItem icon="circle" label="Radio-style row" meta="Easy" selected />
            <StaticMenuItem icon="trash" label="Destructive item" destructive />
            <StaticMenuItem
              icon="shield-alert"
              label="Disabled item"
              description="Backend blocked this action."
              disabled
            />
            <StaticMenuItem icon="activity" label="Highlighted item" highlighted />
            <StaticMenuItem
              icon="sparkles"
              label="Submenu trigger"
              meta={<Icon name="chevron-right" size="xs" />}
              open
            />
          </div>

          <div className="hito-ui-menu-surface grid gap-1 p-1">
            <div className="hito-ui-menu-label px-2 py-1.5">Header + footer</div>
            <div className="hito-ui-menu-separator -mx-1 my-1" />
            <StaticMenuItem
              icon="download"
              label="Export JSON"
              description="Footer actions stay inside the same surface."
              meta="Plan"
            />
            <StaticMenuItem icon="settings" label="Open settings" />
            <div className="hito-ui-menu-separator -mx-1 my-1" />
            <div className="flex flex-wrap justify-end gap-2 px-2 py-2">
              <button type="button" className="hito-button hito-button-ghost hito-button-xs">
                Cancel
              </button>
              <button type="button" className="hito-button hito-button-secondary hito-button-xs">
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusMatrix() {
  return (
    <div className="grid gap-6">
      <MatrixPanel title="Status chip tones">
        <div className="flex flex-wrap gap-3">
          {STATUS_TONES.map((tone) => (
            <span key={tone} className="hito-status-pill" data-tone={tone}>
              {tone}
            </span>
          ))}
        </div>
      </MatrixPanel>

      <MatrixPanel title="Metadata tags">
        <div className="flex flex-wrap gap-3">
          <HitoMetadataTag tone="neutral">Repo-derived</HitoMetadataTag>
          <HitoMetadataTag tone="success">Ready</HitoMetadataTag>
          <HitoMetadataTag tone="warning">Needs QA</HitoMetadataTag>
          <HitoMetadataTag interactive tone="signal">
            Editable filter
          </HitoMetadataTag>
        </div>
      </MatrixPanel>
    </div>
  );
}

function IconInventory() {
  return (
    <div className="grid gap-6">
      <MatrixPanel title="Canonical icon sizes">
        <div className="grid gap-4 xl:grid-cols-4">
          {ICON_SIZE_SPECIMENS.map((iconName) => (
            <div key={`size-${iconName}`} className="grid gap-3">
              <h4 className="hito-label">{getIconLabel(iconName)}</h4>
              <div className="flex flex-wrap items-end gap-3">
                {Object.keys(HITO_ICON_SIZES).map((size) => (
                  <div
                    key={`${iconName}-${size}`}
                    className="grid min-w-16 justify-items-center gap-2 rounded-2xl border border-hairline bg-background/55 p-3"
                  >
                    <Icon name={iconName} size={size as HitoIconSize} />
                    <span className="hito-caption">{size}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </MatrixPanel>

      {ICON_EXPORT_GROUPS.map((group) => (
        <MatrixPanel key={group.label} title={group.label}>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            {group.icons.map((iconName) => (
              <article
                key={`${group.label}-${iconName}`}
                className="grid min-w-0 gap-3 rounded-2xl border border-hairline bg-background/55 p-3"
                data-icon-export={iconName}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-hairline bg-muted/45">
                  <Icon name={iconName} size="md" />
                </div>
                <div className="min-w-0">
                  <p className="hito-list-row-title truncate">{getIconLabel(iconName)}</p>
                  <code className="hito-technical-mono mt-1 block truncate">{iconName}</code>
                </div>
              </article>
            ))}
          </div>
        </MatrixPanel>
      ))}
    </div>
  );
}

function MatrixPanel({ children, title }: { children: ReactNode; title: string }) {
  return (
    <article className="grid gap-3 rounded-2xl border border-hairline bg-background/55 p-4">
      <h4 className="hito-caption">{title}</h4>
      {children}
    </article>
  );
}

function getIconLabel(iconName: HitoIconName) {
  return HITO_ICON_META.find((icon) => icon.name === iconName)?.label ?? iconName;
}

function StaticSelectTrigger({
  demoState,
  disabled,
  label,
  placeholder,
  size,
  state,
  value,
}: {
  demoState?: string;
  disabled?: boolean;
  label: string;
  placeholder?: boolean;
  size?: ButtonSize;
  state?: string;
  value: string;
}) {
  return (
    <button
      type="button"
      className={cn(
        "hito-ui-select-trigger flex w-full items-center justify-between whitespace-nowrap px-3 py-2",
        size && "hito-field hito-field-primary",
        size && `hito-field-${size}`,
      )}
      data-demo-state={demoState}
      data-placeholder={placeholder ? true : undefined}
      data-state={state}
      disabled={disabled}
      aria-label={`Select trigger ${label}`}
    >
      <span className="min-w-0 truncate">{value}</span>
      <Icon name="chevron-down" size="sm" className="opacity-50" />
    </button>
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
}) {
  return (
    <div
      className="hito-ui-menu-item relative flex cursor-default select-none items-center gap-2 px-2 py-1.5 outline-none"
      data-disabled={disabled ? true : undefined}
      data-highlighted={highlighted ? true : undefined}
      data-selected={selected ? "true" : undefined}
      data-state={open ? "open" : undefined}
      data-tone={destructive ? "destructive" : undefined}
    >
      {icon ? <Icon name={icon} size="sm" className="text-muted-foreground" /> : null}
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

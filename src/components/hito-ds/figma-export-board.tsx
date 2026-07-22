import type { ReactNode } from "react";

import {
  DemoButton,
  DemoInput,
  IconOnlyButtonMatrix,
} from "@/components/hito-ds/specimen-previews";
import { EditableValueField } from "@/components/ui/editable-value-field";
import { HitoMetadataTag } from "@/components/ui/metadata-tag";
import {
  HITO_ICON_META,
  HITO_ICON_SIZES,
  Icon,
  type HitoIconCategory,
  type HitoIconName,
  type HitoIconSize,
} from "@/components/ui/icon";
import { InlineEditableText, InlineReadOnlyText } from "@/components/ui/inline-editable-text";
import { HitoValueTag } from "@/components/ui/value-tag";
import {
  WORKOUT_PRIMITIVE_PALETTE_FAMILIES,
  WORKOUT_SECTION_COLOR_ROLES,
  WORKOUT_TYPE_COLOR_ROLES,
  workoutSectionColorToken,
  workoutTypeColorToken,
} from "@/lib/workout-color-tokens";
import { HITO_TYPOGRAPHY_ROLES } from "@/lib/hito-typography-roles";
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
  { name: "radius-sm", token: "--radius-sm", value: "4px" },
  { name: "radius-md", token: "--radius-md", value: "6px" },
  { name: "radius-lg", token: "--radius-lg", value: "8px" },
  { name: "radius-xl", token: "--radius-xl", value: "10px" },
  { name: "radius-2xl", token: "--radius-2xl", value: "12px" },
  { name: "radius-3xl", token: "--radius-3xl", value: "16px" },
  { name: "radius-4xl", token: "--radius-4xl", value: "20px" },
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
const INLINE_HEADER_SIZES = ["sm", "md", "lg"] as const;

const BUTTON_ICON_TREATMENTS = [
  { label: "Left icon", props: { leftIcon: true } },
  { label: "Right icon", props: { rightIcon: true } },
  { label: "Both icons", props: { leftIcon: true, rightIcon: true } },
  { label: "Loading", props: { loading: true, disabled: true } },
] as const;

const ICON_EXPORT_GROUPS = HITO_ICON_META.reduce<
  Array<{
    category: HitoIconCategory;
    label: string;
    icons: HitoIconName[];
  }>
>((groups, icon) => {
  const group = groups.find((candidate) => candidate.category === icon.category);

  if (group) {
    group.icons.push(icon.name);
    return groups;
  }

  groups.push({
    category: icon.category,
    label: formatIconCategoryLabel(icon.category),
    icons: [icon.name],
  });
  return groups;
}, []);

const ICON_SIZE_SPECIMENS: HitoIconName[] = ["plus", "chevron-down", "loader", "gap-horizontal"];

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
          eyebrow="Editable Value Field"
          id="editable-value-field"
          title="Compact read/add mode and explicit inline edit actions"
          body="Uses the canonical Secondary Button read surface, Secondary Field edit surface, and standard icon-only Button configuration."
        >
          <EditableValueFieldMatrix />
        </ExportSection>

        <ExportSection
          eyebrow="Inline text"
          id="inline-editable-text"
          title="Inline editable and read-only text states"
          body="Captures the shared InlineEditableText / InlineReadOnlyText primitive, including the header variant and header input sizing used by true editable surfaces."
        >
          <InlineTextMatrix />
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
          eyebrow="Adaptive menus"
          id="adaptive-mobile-navigation"
          title="Mobile escalation and full-height navigation anatomy"
          body="Large page-switching or dense mobile menus use the Sheet/Dialog family with a Hito header, close affordance, and scrollable content instead of anchored card-like popovers."
        >
          <AdaptiveMenuMatrix />
        </ExportSection>

        <ExportSection
          eyebrow="Audit controls"
          id="ds-audit-controls"
          title="Compact token value chips and property-control rows"
          body="Shows the reusable control anatomy behind local DS audit prompts without exposing the inspector itself as product UI."
        >
          <AuditControlMatrix />
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
      <div className="min-w-0">{children}</div>
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
              <span className="hito-caption">{token.value}</span>
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
        {HITO_TYPOGRAPHY_ROLES.map((role) => (
          <div key={role.id} className="grid gap-2 border-b border-hairline pb-3 last:border-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="hito-caption">{role.label}</span>
              <code className="hito-technical-mono">{role.className}</code>
            </div>
            <p className={role.className}>{role.sample}</p>
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

      <div className="grid gap-4">
        <h3 className="hito-label">Icon-only button contract</h3>
        <IconOnlyButtonMatrix />
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
              <DemoButton variant="ghost" size={size} iconOnly />
            </div>
          ))}
        </div>
      </MatrixPanel>
    </div>
  );
}

function EditableValueFieldMatrix() {
  const noActiveField = null;
  const noop = () => {};

  return (
    <div className="grid gap-6">
      <MatrixPanel title="Read and add states">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <EditableValueField
            fieldKey="empty"
            label="Age"
            value=""
            setValue={noop}
            activeEditableKey={noActiveField}
            setActiveEditableKey={noop}
            placeholder="34"
            min={13}
            max={100}
            step={1}
            inputMode="numeric"
          />
          <EditableValueField
            fieldKey="populated"
            label="Height"
            value="178"
            setValue={noop}
            activeEditableKey={noActiveField}
            setActiveEditableKey={noop}
            placeholder="178"
            min={120}
            max={230}
            step={1}
            inputMode="numeric"
            unit="cm"
          />
          {(["hover", "active", "focus"] as const).map((demoState) => (
            <EditableValueField
              key={demoState}
              fieldKey={demoState}
              label={demoState}
              value="72"
              setValue={noop}
              activeEditableKey={noActiveField}
              setActiveEditableKey={noop}
              placeholder="72"
              min={30}
              max={250}
              step={0.5}
              inputMode="decimal"
              unit="kg"
              demoState={demoState}
            />
          ))}
          <EditableValueField
            fieldKey="invalid-read"
            label="Age"
            value="3"
            setValue={noop}
            activeEditableKey={noActiveField}
            setActiveEditableKey={noop}
            placeholder="34"
            min={13}
            max={100}
            step={1}
            inputMode="numeric"
          />
        </div>
      </MatrixPanel>
      <MatrixPanel title="Edit mode · compact SM field, field-local Clear, Primary commit">
        <EditableValueField
          fieldKey="editing"
          label="Weight"
          value="72"
          setValue={noop}
          activeEditableKey="editing"
          setActiveEditableKey={noop}
          placeholder="72"
          min={30}
          max={250}
          step={0.5}
          inputMode="decimal"
          unit="kg"
        />
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

function InlineTextMatrix() {
  return (
    <div className="grid gap-6">
      <MatrixPanel title="Header input sizes">
        <div className="grid gap-4">
          {INLINE_HEADER_SIZES.map((size) => (
            <div key={`inline-header-${size}`} className="grid gap-2">
              <span className="hito-caption">{size.toUpperCase()}</span>
              <InlineEditableText
                aria-label={`Edit ${size} header title`}
                onChange={() => {}}
                size={size}
                value={
                  size === "lg"
                    ? "Tuesday interval tune-up"
                    : size === "md"
                      ? "Manual workout title"
                      : "Section label"
                }
                variant="header"
              />
            </div>
          ))}
        </div>
      </MatrixPanel>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MatrixPanel title="Hover">
          <InlineEditableText
            aria-label="Hover inline header title"
            demoState="hover"
            onChange={() => {}}
            size="md"
            value="Progression finish"
            variant="header"
          />
        </MatrixPanel>
        <MatrixPanel title="Focus-visible">
          <InlineEditableText
            aria-label="Focus inline header title"
            demoState="focus"
            onChange={() => {}}
            size="md"
            value="Tempo rhythm"
            variant="header"
          />
        </MatrixPanel>
        <MatrixPanel title="Edit field">
          <input
            aria-label="Editing inline header title"
            className="hito-field hito-field-primary hito-field-header hito-field-header-md"
            readOnly
            value="Long run"
          />
          <span className="hito-field-helper">Enter saves; Escape cancels.</span>
        </MatrixPanel>
        <MatrixPanel title="Read-only truth">
          <InlineEditableText
            aria-label="Read-only generated title"
            helper="Generated preview/detail rows do not expose edit affordances."
            onChange={() => {}}
            readOnly
            size="md"
            value="Generated steady finish"
            variant="header"
          />
        </MatrixPanel>
      </div>

      <MatrixPanel title="Inline read-only row">
        <InlineReadOnlyText
          helper="Provider, generated, imported, and backend-owned truth reads normally."
          value={
            <div className="min-w-0">
              <p className="hito-list-row-title">Marathon steady finish</p>
              <p className="hito-list-row-copy">Backend-generated workout truth.</p>
            </div>
          }
        />
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

function AdaptiveMenuMatrix() {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,0.75fr)_minmax(0,1fr)]">
      <MatrixPanel title="Simple action menu escalation">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <p className="hito-caption">Desktop / tablet anchored</p>
            <div className="hito-ui-menu-surface grid max-w-xs gap-1 p-1">
              <StaticMenuItem icon="edit" label="Edit text" />
              <StaticMenuItem icon="copy" label="Copy prompt" />
              <StaticMenuItem icon="trash" label="Remove" destructive />
            </div>
          </div>
          <div className="hito-ui-sheet-surface grid max-w-xs gap-0 overflow-hidden rounded-2xl border border-hairline bg-background/95">
            <div className="hito-ui-sheet-header border-b border-hairline px-4 py-3 pr-12">
              <p className="hito-ui-sheet-title text-xl">Actions</p>
              <p className="hito-ui-sheet-description">Mobile bottom-sheet option.</p>
            </div>
            <div className="grid gap-1 p-2">
              <StaticMenuItem icon="edit" label="Edit text" />
              <StaticMenuItem icon="copy" label="Copy prompt" />
              <StaticMenuItem icon="trash" label="Remove" destructive />
            </div>
          </div>
        </div>
      </MatrixPanel>

      <MatrixPanel title="Fullscreen / full-height mobile navigation">
        <div className="hito-ui-sheet-surface mx-auto flex h-[34rem] max-h-[34rem] w-full max-w-sm flex-col overflow-hidden rounded-none border-0 bg-background/95">
          <div className="hito-ui-sheet-header border-b border-hairline px-5 py-4 pr-14">
            <div className="flex min-w-0 items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="hito-ui-sheet-title">Browse DS pages</p>
                <p className="hito-ui-sheet-description">
                  Jump to a Hito DS reference page or section.
                </p>
              </div>
              <span className="hito-ui-sheet-close shrink-0" aria-hidden="true">
                <Icon name="close" size="sm" />
              </span>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <div className="hito-row-group">
              <div className="hito-list-row items-start">
                <Icon name="chevron-left" size="sm" className="mt-0.5 text-muted-foreground" />
                <span className="min-w-0">
                  <span className="hito-list-row-title block">Back affordance</span>
                  <span className="hito-list-row-copy block">
                    Nested levels return inside the navigation surface.
                  </span>
                </span>
              </div>
              {["Overview", "Foundations", "Components", "Patterns"].map((label) => (
                <div className="hito-list-row" key={label}>
                  <span className="hito-list-row-title">{label}</span>
                  <Icon name="chevron-right" size="xs" className="text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </MatrixPanel>
    </div>
  );
}

function AuditControlMatrix() {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <MatrixPanel title="Read-current-first value chip">
        <div className="grid max-w-xl gap-3">
          <StaticPropertyRow iconName="padding-left" label="Horizontal padding">
            <StaticValueChip help="16px · --space-4">16</StaticValueChip>
          </StaticPropertyRow>
          <StaticPropertyRow iconName="gap-horizontal" label="Horizontal gap">
            <StaticValueChip help="5.6px · custom, nearest --space-1">5.6</StaticValueChip>
          </StaticPropertyRow>
          <StaticPropertyRow iconName="typography" label="Typography">
            <StaticValueChip help="hito-section-title · font 24px / line 27.6px">
              Section title
            </StaticValueChip>
          </StaticPropertyRow>
        </div>
      </MatrixPanel>

      <MatrixPanel title="Explicit pending change">
        <div className="grid max-w-xl gap-3">
          <StaticPropertyRow expanded iconName="radius-top-left" label="Radius">
            <StaticValueChip tone="current" help="8px · --radius-lg">
              8
            </StaticValueChip>
            <Icon name="arrow-right" size="xs" className="text-muted-foreground" />
            <StaticValueChip tone="desired" help="6px · --radius-md">
              6
            </StaticValueChip>
          </StaticPropertyRow>
          <div className="ml-7 grid gap-2 rounded-md border border-hairline bg-surface/35 p-2">
            <StaticPropertyRow compact iconName="radius-top-left" label="Top-left radius">
              <StaticValueChip help="8px · --radius-lg">8</StaticValueChip>
            </StaticPropertyRow>
            <StaticPropertyRow compact iconName="radius-bottom-right" label="Bottom-right radius">
              <StaticValueChip help="8px · --radius-lg">8</StaticValueChip>
            </StaticPropertyRow>
          </div>
          <button type="button" className="hito-button hito-button-secondary hito-button-sm w-fit">
            <Icon name="copy" size="xs" />
            Generate Prompt
          </button>
        </div>
      </MatrixPanel>
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

function StaticPropertyRow({
  children,
  compact,
  expanded,
  iconName,
  label,
}: {
  children: ReactNode;
  compact?: boolean;
  expanded?: boolean;
  iconName: HitoIconName;
  label: string;
}) {
  return (
    <div className={cn("grid min-w-0 gap-1 py-0.5", compact && "pl-6")}>
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="grid size-5 shrink-0 place-items-center text-muted-foreground">
            <Icon name={iconName} size="xs" />
          </span>
          <span className="hito-caption min-w-0 truncate text-foreground">{label}</span>
          {expanded !== undefined ? (
            <span
              className="grid size-5 shrink-0 place-items-center rounded-sm text-muted-foreground"
              aria-hidden="true"
            >
              <Icon
                name="chevron-down"
                size="xs"
                className={cn("transition-transform", expanded && "rotate-180")}
              />
            </span>
          ) : null}
        </div>
        {children}
      </div>
    </div>
  );
}

function StaticValueChip({
  children,
  help,
  tone = "neutral",
}: {
  children: ReactNode;
  help: string;
  tone?: "current" | "desired" | "neutral";
}) {
  return (
    <HitoValueTag title={help} aria-label={help} tone={tone}>
      {children}
    </HitoValueTag>
  );
}

function MatrixPanel({ children, title }: { children: ReactNode; title: string }) {
  return (
    <article className="grid gap-3">
      <h4 className="hito-caption">{title}</h4>
      {children}
    </article>
  );
}

function getIconLabel(iconName: HitoIconName) {
  return HITO_ICON_META.find((icon) => icon.name === iconName)?.label ?? iconName;
}

function formatIconCategoryLabel(category: HitoIconCategory) {
  return category
    .split("/")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" / ");
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

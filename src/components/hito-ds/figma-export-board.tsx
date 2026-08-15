import type { ReactNode } from "react";

import {
  DemoButton,
  DemoInput,
  IconOnlyButtonMatrix,
} from "@/components/hito-ds/specimen-previews";
import { EditableValueField } from "@/components/ui/editable-value-field";
import { HitoButton } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  HITO_BUTTON_SIZES,
  HITO_BUTTON_TONES,
  HITO_BUTTON_VARIANTS,
  HITO_FIELD_SIZES,
  HITO_FIELD_VARIANTS,
  type HitoButtonSize,
  type HitoButtonTone,
  type HitoButtonVariant,
  type HitoFieldSize,
  type HitoFieldVariant,
} from "@/components/ui/hito-control-contract";
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
import { HITO_DS_MANIFEST } from "@/generated/hito-ds-manifest";
import { cn } from "@/lib/utils";

type ButtonVariant = HitoButtonVariant;
type ButtonTone = HitoButtonTone;
type ButtonSize = HitoButtonSize;
type InputVariant = HitoFieldVariant;
type InputSize = HitoFieldSize;
type InputState = "default" | "hover" | "focus" | "disabled" | "readonly";
type InputFeedback = "neutral" | "error" | "success";

const BUTTON_VARIANTS = HITO_BUTTON_VARIANTS;
const BUTTON_TONES = HITO_BUTTON_TONES;
const BUTTON_SIZES = HITO_BUTTON_SIZES;
const INPUT_VARIANTS = HITO_FIELD_VARIANTS;
const INPUT_SIZES = HITO_FIELD_SIZES;
const STATUS_TONES = ["neutral", "signal", "success", "warning", "destructive", "rollout", "muted"];

type TokenGridItem = { name: string; token: string; note: string };

const RAW_COLOR_TOKENS: readonly TokenGridItem[] = HITO_DS_MANIFEST.collections.primitiveColor.map(
  (token) => ({
    name: token.id,
    token: token.cssVariable,
    note: token.value,
  }),
);

const SEMANTIC_COLOR_TOKENS: readonly TokenGridItem[] =
  HITO_DS_MANIFEST.collections.semanticColor.map((token) => ({
    name: token.id,
    token: token.cssVariable,
    note: `Dark: ${token.modes.dark.alias ?? token.modes.dark.value} / Light: ${
      token.modes.light.alias ?? token.modes.light.value
    }`,
  }));

const SPACING_TOKENS = HITO_DS_MANIFEST.collections.primitiveSpacing.map((token) => ({
  name: token.id,
  token: token.cssVariable,
  value: token.value,
}));

const RADIUS_TOKENS = HITO_DS_MANIFEST.collections.primitiveRadius.map((token) => ({
  name: token.id,
  token: token.cssVariable,
  value: token.value,
}));

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

const DROPDOWN_TRIGGER_SIZES = HITO_BUTTON_SIZES;
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
            <h1 className="hito-ui-title-xl max-w-5xl">Figma export surface</h1>
            <p className="hito-body-md text-secondary max-w-3xl">
              Code-owned Hito DS matrices for html.to.design capture/import. Foundation tokens and
              reusable text roles render from the generated one-way manifest.
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
          title="Secondary SM read/add with compact inline editing"
          body="Uses the canonical Secondary Button SM read/add surface, Secondary Field SM edit surface, and Primary icon-only Button SM commit action."
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
          <p className="hito-label-md hito-label-signal">{eyebrow}</p>
          <h2 className="hito-ui-title-sm mt-2">{title}</h2>
          <p className="hito-body-sm text-secondary mt-2">{body}</p>
        </div>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function TokenGrid({ title, tokens }: { title: string; tokens: ReadonlyArray<TokenGridItem> }) {
  return (
    <div className="grid gap-3">
      <h3 className="hito-label-md">{title}</h3>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        {tokens.map((token) => (
          <article key={token.token} className="hito-ds-token-specimen-surface p-3">
            <div
              className="h-16 rounded-xl border border-hairline"
              data-token-swatch={token.token}
              style={{ background: `var(${token.token})` }}
            />
            <p className="hito-list-row-title mt-3">{token.name}</p>
            <code className="hito-technical-sm text-secondary mt-1 block">{token.token}</code>
            <p className="hito-body-xs text-tertiary mt-1">{token.note}</p>
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
        <h3 className="hito-label-md">Spacing scale</h3>
        <div className="hito-ds-token-specimen-surface grid gap-2 p-4">
          {SPACING_TOKENS.map((token) => (
            <div key={token.token} className="grid grid-cols-[7rem_1fr_4rem] items-center gap-3">
              <code className="hito-technical-sm text-secondary">{token.token}</code>
              <span
                className="block h-3 rounded-full bg-signal"
                style={{ width: `var(${token.token})` }}
              />
              <span className="hito-body-xs text-tertiary text-right">{token.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        <h3 className="hito-label-md">Radius scale</h3>
        <div className="hito-ds-token-specimen-surface grid grid-cols-2 gap-3 p-4 md:grid-cols-3">
          {RADIUS_TOKENS.map((token) => (
            <div key={token.token} className="grid gap-2">
              <div
                className="h-16 border border-hairline bg-muted/65"
                style={{ borderRadius: `var(${token.token})` }}
              />
              <code className="hito-technical-sm text-secondary">{token.token}</code>
              <span className="hito-body-xs text-tertiary">{token.value}</span>
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
      <div>
        <h3 className="hito-label-md">Reusable text styles</h3>
        <p className="hito-body-xs text-tertiary mt-1">
          Component-bound typography stays with its component family and is not exported as a text
          style.
        </p>
      </div>
      <div className="hito-ds-token-specimen-surface grid gap-3 p-4">
        {HITO_DS_MANIFEST.textStyles.map((role) => (
          <div key={role.id} className="grid gap-2 border-b border-hairline pb-3 last:border-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="hito-body-xs text-tertiary">{role.label}</span>
              <code className="hito-technical-sm text-secondary">{role.className}</code>
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
        <h3 className="hito-label-md">Size × variant × tone matrix</h3>
        {BUTTON_TONES.map((tone) => (
          <MatrixPanel key={tone} title={`Tone: ${tone}`}>
            <div className="grid gap-3">
              {BUTTON_SIZES.map((size) => (
                <div key={`${tone}-${size}`} className="flex min-w-0 flex-wrap items-center gap-3">
                  <span className="hito-body-xs text-tertiary w-12 shrink-0">{size}</span>
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
        <h3 className="hito-label-md">Rendered states · md size</h3>
        <div className="grid gap-3 xl:grid-cols-3">
          {BUTTON_TONES.map((tone) => (
            <MatrixPanel key={`states-${tone}`} title={`Tone: ${tone}`}>
              <div className="grid gap-3">
                {BUTTON_STATES.map((state) => (
                  <div
                    key={`${tone}-${state.label}`}
                    className="flex min-w-0 flex-wrap items-center gap-3"
                  >
                    <span className="hito-body-xs text-tertiary w-16 shrink-0">{state.label}</span>
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
        <h3 className="hito-label-md">Icon-only button contract</h3>
        <IconOnlyButtonMatrix />
      </div>

      <MatrixPanel title="Icon grammar">
        <div className="grid gap-3">
          {BUTTON_SIZES.map((size) => (
            <div
              key={`icon-treatment-${size}`}
              className="flex min-w-0 flex-wrap items-center gap-3"
            >
              <span className="hito-body-xs text-tertiary w-12 shrink-0">{size}</span>
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
        <h3 className="hito-label-md">Size × variant matrix</h3>
        <div className="grid gap-3 xl:grid-cols-2">
          {INPUT_VARIANTS.map((variant) => (
            <MatrixPanel key={variant} title={`Variant: ${variant}`}>
              <div className="grid gap-3">
                {INPUT_SIZES.map((size) => (
                  <div
                    key={`${variant}-${size}`}
                    className="grid grid-cols-[4rem_1fr] items-center gap-3"
                  >
                    <span className="hito-body-xs text-tertiary">{size}</span>
                    <DemoInput variant={variant} size={size} leftIcon rightIcon />
                  </div>
                ))}
              </div>
            </MatrixPanel>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        <h3 className="hito-label-md">Rendered states · md primary field</h3>
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
          <span className="hito-label-md">Training note</span>
          <Textarea
            size="md"
            className="resize-none"
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
              <span className="hito-body-xs text-tertiary">{size.toUpperCase()}</span>
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
          <Input
            aria-label="Editing inline header title"
            size="md"
            className="hito-field-header hito-field-header-md"
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
        <h3 className="hito-label-md">List-item trigger size ladder</h3>
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
        <h3 className="hito-label-md">Select / dropdown trigger states</h3>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {SELECT_TRIGGER_STATES.map((state) => (
            <MatrixPanel key={state.label} title={state.label}>
              <StaticSelectTrigger {...state} />
            </MatrixPanel>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        <h3 className="hito-label-md">Menu item row anatomy</h3>
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
              <HitoButton size="xs" variant="ghost">
                Cancel
              </HitoButton>
              <HitoButton size="xs" variant="secondary">
                Apply
              </HitoButton>
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
            <p className="hito-body-xs text-tertiary">Desktop / tablet anchored</p>
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
            <StaticValueChip help="hito-ui-title-sm · font 24px / line 27.6px">
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
          <HitoButton size="sm" variant="secondary" className="w-fit">
            <Icon name="copy" size="xs" />
            Generate Prompt
          </HitoButton>
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
          <HitoMetadataTag variant="light" tone="neutral">
            Repo-derived
          </HitoMetadataTag>
          <HitoMetadataTag variant="accent" tone="success">
            Ready
          </HitoMetadataTag>
          <HitoMetadataTag variant="light" tone="warning">
            Needs QA
          </HitoMetadataTag>
          <HitoMetadataTag variant="accent" tone="signal">
            Core control
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
              <h4 className="hito-label-md">{getIconLabel(iconName)}</h4>
              <div className="flex flex-wrap items-end gap-3">
                {Object.keys(HITO_ICON_SIZES).map((size) => (
                  <div
                    key={`${iconName}-${size}`}
                    className="hito-ds-token-specimen-surface grid min-w-16 justify-items-center gap-2 p-3"
                  >
                    <Icon name={iconName} size={size as HitoIconSize} />
                    <span className="hito-body-xs text-tertiary">{size}</span>
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
                className="hito-ds-token-specimen-surface grid min-w-0 gap-3 p-3"
                data-icon-export={iconName}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-hairline bg-muted/45">
                  <Icon name={iconName} size="md" />
                </div>
                <div className="min-w-0">
                  <p className="hito-list-row-title truncate">{getIconLabel(iconName)}</p>
                  <code className="hito-technical-sm text-secondary mt-1 block truncate">
                    {iconName}
                  </code>
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
          <span className="hito-body-xs min-w-0 truncate text-foreground">{label}</span>
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
      <h4 className="hito-body-xs text-tertiary">{title}</h4>
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

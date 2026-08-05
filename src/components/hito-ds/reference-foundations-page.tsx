import { useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import loginDesertHorizon from "@/assets/marketing/hero-background/login-desert-horizon.jpg";
import { HitoLogo, HitoLogoMark } from "@/components/ui/hito-logo";
import { HitoButton } from "@/components/ui/button";
import { HitoChoiceToggle } from "@/components/ui/hito-choice-toggle";
import { Input } from "@/components/ui/input";
import { useHitoRadioGroup } from "@/components/ui/hito-radio-group";
import { useHitoTabs } from "@/components/ui/hito-tabs";
import { hitoToast } from "@/components/ui/hito-toast";
import { HITO_ICON_META, HITO_ICON_SIZES, Icon, type HitoIconSize } from "@/components/ui/icon";
import { HitoDsLightPaletteReference } from "@/components/hito-ds/light-palette-reference";
import { ChoiceSelector } from "@/components/hito-ds/specimen-previews";
import { ReferenceListRow, SectionIntro } from "@/components/hito-ds/reference";
import { TypographyControlRow } from "@/components/devtools/LocalUiTypographyControls";
import type { InlineChangeTargetInput } from "@/components/devtools/local-inline-change-target-utils";
import { inspectLocalUiTarget } from "@/components/devtools/local-ui-inspector-targets";
import { HITO_DS_MANIFEST } from "@/generated/hito-ds-manifest";
import {
  WORKOUT_COLOR_SHADE_STEPS,
  WORKOUT_COLOR_STATE_SLOTS,
  WORKOUT_PRIMITIVE_PALETTE_FAMILIES,
  WORKOUT_SECTION_COLOR_ROLES,
  WORKOUT_TYPE_COLOR_ROLES,
  workoutPrimitiveColorVar,
  workoutSectionColorToken,
  workoutSectionColorVar,
  workoutTypeColorToken,
  workoutTypeColorVar,
  type WorkoutColorStateSlot,
  type WorkoutPrimitivePaletteId,
  type WorkoutSectionColorRole,
} from "@/lib/workout-color-tokens";
import { HITO_TYPOGRAPHY_GROUPS, type HitoTypographyRole } from "@/lib/hito-typography-roles";
import { cn } from "@/lib/utils";

const COLOR_TABS = ["semantic", "primitive"] as const;
const ICON_PREVIEW_SIZES = Object.keys(HITO_ICON_SIZES) as HitoIconSize[];

type ColorTab = (typeof COLOR_TABS)[number];

type PrimitiveColorSwatch = {
  step: string;
  token: string;
  value: string;
};

type PrimitiveColorGroupData = {
  title: string;
  meta: string;
  colors: readonly PrimitiveColorSwatch[];
};

const PRIMITIVE_COLOR_PRESENTATION = [
  { title: "Stone", meta: "Primitive / dark neutral", prefixes: ["stone-"] },
  { title: "Sand", meta: "Primitive / light neutral", prefixes: ["sand-"] },
  {
    title: "Signal and feedback",
    meta: "Primitive / product emphasis and status",
    prefixes: ["amber-", "blue-", "terracotta-", "green-", "orange-", "red-"],
  },
  {
    title: "Light theme analogs",
    meta: "Primitive / light surfaces, text, and alpha",
    prefixes: ["warm-white", "linen-", "ink-", "taupe-"],
  },
] as const;

const GENERAL_PRIMITIVE_COLOR_GROUPS: readonly PrimitiveColorGroupData[] =
  PRIMITIVE_COLOR_PRESENTATION.map((group) => ({
    title: group.title,
    meta: group.meta,
    colors: HITO_DS_MANIFEST.collections.primitiveColor
      .filter((token) => group.prefixes.some((prefix) => token.id.startsWith(prefix)))
      .map((token) => ({
        step: token.id.split("-").slice(1).join("-") || "base",
        token: token.cssVariable,
        value: `var(${token.cssVariable})`,
      })),
  }));

const WORKOUT_PRIMITIVE_COLOR_GROUPS: readonly PrimitiveColorGroupData[] =
  WORKOUT_PRIMITIVE_PALETTE_FAMILIES.map((palette) => ({
    title: palette.label,
    meta: `Workout domain primitive / ${palette.tokenPrefix}-base`,
    colors: WORKOUT_COLOR_SHADE_STEPS.map((step) => ({
      step,
      token: `${palette.tokenPrefix}-${step}`,
      value: workoutPrimitiveColorVar(palette.id, step),
    })),
  }));

type SemanticColorTokenData = {
  name: string;
  value: string;
  mapsTo: string;
  group: string;
};

const SEMANTIC_COLOR_TOKENS: readonly SemanticColorTokenData[] = [
  ...HITO_DS_MANIFEST.collections.semanticColor.map((token) => ({
    name: token.id,
    value: `var(${token.cssVariable})`,
    mapsTo: [
      `dark: ${token.modes.dark.alias ?? token.modes.dark.value}`,
      `light: ${token.modes.light.alias ?? token.modes.light.value}`,
    ].join(" / "),
    group: semanticColorGroup(token.id),
  })),
  {
    name: "canvas atmosphere",
    value: "hito-canvas-atmosphere",
    mapsTo: "stone alpha gradients",
    group: "gradient / overlay",
  },
  {
    name: "auth photo overlay",
    value: "hito-auth-photo-overlay",
    mapsTo: "stone alpha gradients",
    group: "gradient / overlay",
  },
  {
    name: "editorial signal wash",
    value: "hito-editorial-signal-wash",
    mapsTo: "signal alpha wash",
    group: "gradient / overlay",
  },
];

const SPACING_USAGE: Record<string, string> = {
  "space-1": "Tiny internal offsets",
  "space-2": "XS control inset and tight pairs",
  "space-3": "Small control inset and compact row gaps",
  "space-4": "Default control inset and compact panel padding",
  "space-5": "Emphasized panel padding",
  "space-6": "Section and grouped-route rhythm",
  "space-8": "Open page section rhythm",
  "space-10": "Hero/top-level route moments only",
};

const SPACING_PRIMITIVES = HITO_DS_MANIFEST.collections.primitiveSpacing.map((token) => ({
  name: token.id,
  value: token.value,
  use: SPACING_USAGE[token.id] ?? "Canonical spacing primitive",
}));

const RADIUS_USAGE: Record<string, string> = {
  "radius-sm": "Micro tags and compact inspector details",
  "radius-md": "Small controls, inputs, and menu rows",
  "radius-lg": "Default controls and menus",
  "radius-xl": "Cards, day rows, and compact panels",
  "radius-2xl": "Dialogs and emphasized surfaces",
  "radius-3xl": "Rare large editorial or product surfaces",
  "radius-4xl": "Reserved oversized surfaces",
};

const RADIUS_PRIMITIVES = HITO_DS_MANIFEST.collections.primitiveRadius.map((token) => ({
  name: token.id,
  token: token.cssVariable,
  value: token.value,
  use: RADIUS_USAGE[token.id] ?? "Canonical radius primitive",
}));

function semanticColorGroup(id: string) {
  if (id.includes("foreground")) return "text";
  if (["surface", "surface-elevated", "card", "popover", "muted"].includes(id)) return "surface";
  if (["border", "hairline", "input"].includes(id)) return "boundary";
  if (["success", "warn", "destructive", "info"].includes(id)) return "status";
  if (["primary", "secondary", "accent", "ring", "signal"].includes(id)) return "interactive";
  return "canvas";
}

const TYPOGRAPHY_FAMILIES = [
  {
    family: "Display",
    font: "Fraunces",
    roles: "display title, page title",
    rule: "Use for scarce editorial moments and route-level identity.",
  },
  {
    family: "Title",
    font: "Fraunces",
    roles: "modal, section, and panel titles",
    rule: "Use to orient product surfaces without inventing route-local serif sizes.",
  },
  {
    family: "Body",
    font: "Poppins",
    roles: "body, body small, support copy, caption",
    rule: "Use for readable explanatory copy, metadata, helper text, and timestamps.",
  },
  {
    family: "Label",
    font: "Poppins",
    roles: "label, form label, micro label, nav/menu text",
    rule: "Use for orientation and shell chrome; avoid local uppercase tracking recipes.",
  },
  {
    family: "Mono",
    font: "JetBrains Mono",
    roles: "technical mono, metric value, metric label",
    rule: "Use only for measured truth, identifiers, JSON, and fixed-format values.",
  },
] as const;

type ButtonVariant = (typeof BUTTON_VARIANTS)[number];
type ButtonTone = (typeof BUTTON_TONES)[number];
type ButtonSize = (typeof BUTTON_SIZES)[number];
type InputVariant = (typeof INPUT_VARIANTS)[number];
type InputState = (typeof INPUT_STATES)[number];
type InputFeedback = (typeof INPUT_FEEDBACK)[number];
type ChoiceToggleSize = (typeof CHOICE_TOGGLE_SIZES)[number];
type SelectionControlKind = (typeof SELECTION_CONTROL_KINDS)[number];
type SelectionBinarySize = (typeof SELECTION_BINARY_SIZES)[number];
type ModalSizeMode = (typeof MODAL_SIZE_MODES)[number];
type ModalBodyMode = (typeof MODAL_BODY_MODES)[number];
type ModalHeaderMode = (typeof MODAL_HEADER_MODES)[number];
type ModalFooterMode = (typeof MODAL_FOOTER_MODES)[number];
type TabStyle = (typeof TAB_STYLES)[number];
type StatusTone = (typeof STATUS_TONES)[number];
type DataTableSortDirection = (typeof DATA_TABLE_SORT_DIRECTIONS)[number];
type RowDensity = (typeof ROW_DENSITIES)[number];
type ShellContext = (typeof SHELL_CONTEXTS)[number];
type AsyncToastDemoState = "info" | "working" | "success" | "error";

const HITO_DS_TOAST_ID = "hito-ds-async-action-toast";
export function HitoDsFoundationsPage() {
  const [colorTab, setColorTab] = useState<ColorTab>("semantic");
  const [iconPreviewSize, setIconPreviewSize] = useState<HitoIconSize>("md");
  const colorTabs = useHitoTabs({
    items: COLOR_TABS.map((value) => ({ value })),
    value: colorTab,
  });
  const iconSizeGroup = useHitoRadioGroup({
    items: ICON_PREVIEW_SIZES.map((value) => ({ value })),
    value: iconPreviewSize,
  });

  const copyColorValue = async (value: string, label: string) => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      copyTextWithLegacySelection(value);
      hitoToast.success({
        id: "hito-ds-color-copy",
        title: "Copied color token",
        description: `${label}: ${value}`,
        duration: 1800,
      });
    } catch {
      try {
        await navigator.clipboard.writeText(value);
        hitoToast.success({
          id: "hito-ds-color-copy",
          title: "Copied color token",
          description: `${label}: ${value}`,
          duration: 1800,
        });
      } catch {
        hitoToast.error({
          id: "hito-ds-color-copy",
          title: "Could not copy",
          description: "Try selecting the token manually.",
        });
      }
    }
  };

  return (
    <>
      <section id="brand" className="ds-section">
        <SectionIntro label="Brand" title="The Hito wordmark and mark are primitives, not icons." />

        <div className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <LogoSpecimen label="Default">
              <HitoLogo decorative />
            </LogoSpecimen>
            <LogoSpecimen label="Compact">
              <HitoLogo decorative className="[--hito-logo-height:1.05rem]" />
            </LogoSpecimen>
            <LogoSpecimen label="Hero">
              <HitoLogo decorative className="[--hito-logo-height:3rem]" />
            </LogoSpecimen>
            <LogoSpecimen label="Short mark">
              <HitoLogoMark decorative className="[--hito-logo-height:2.4rem]" />
            </LogoSpecimen>
            <LogoSpecimen label="Compact mark">
              <HitoLogoMark decorative className="[--hito-logo-height:1.35rem]" />
            </LogoSpecimen>
            <LogoSpecimen
              label="Light background"
              className="bg-[var(--sand-100)] text-[var(--stone-950)]"
            >
              <HitoLogo decorative className="[--hito-logo-height:1.7rem]" />
            </LogoSpecimen>
            <LogoSpecimen
              label="Dark background"
              labelTone="inverse"
              className="bg-[var(--stone-950)] text-[var(--sand-100)]"
            >
              <HitoLogo decorative className="[--hito-logo-height:1.7rem]" />
            </LogoSpecimen>
            <LogoSpecimen
              label="Favicon surface"
              labelTone="inverse"
              className="bg-[var(--stone-950)] [background-image:linear-gradient(135deg,#3a3732_0%,#15130f_52%,#030303_100%)] text-[var(--sand-100)]"
            >
              <HitoLogoMark decorative className="[--hito-logo-height:2.25rem]" />
            </LogoSpecimen>
          </div>

          <div className="hito-reference-list">
            <ReferenceListRow
              label="Use"
              title="Brand identity only"
              body="Use HitoLogo for linked shell brands, auth hero branding, and public brand moments. Use HitoLogoMark for compact brand marks and favicon artwork. Do not add either to the generic Icon registry."
            />
            <ReferenceListRow
              label="Color"
              title="Logo color comes from currentColor"
              body="Set tone on the parent or through className. Avoid hardcoded fills and do not add a decorative signal dot by default."
            />
            <ReferenceListRow
              label="Variants"
              title="Keep product labels separate"
              body="Admin, DS, and other product qualifiers should be rendered as adjacent text, not baked into the SVG."
            />
          </div>
        </div>
      </section>
      <section id="gradient-overlays" className="ds-section">
        <SectionIntro
          label="Gradient and overlay rules"
          title="Atmosphere is allowed only when it has a job."
        />

        <div className="grid gap-8">
          <div className="grid gap-5 xl:grid-cols-2">
            <article className="hito-canvas-atmosphere rounded-2xl border border-hairline bg-background p-5">
              <p className="hito-label hito-label-signal">Canvas atmosphere</p>
              <h3 className="hito-panel-title mt-3">Route-level depth only.</h3>
              <p className="hito-body-small mt-3 text-muted-foreground">
                Use <code className="hito-inline-code">hito-canvas-atmosphere</code> for large app
                canvases and design-system reference pages, not nested cards.
              </p>
            </article>

            <article className="auth-hero min-h-[14rem] overflow-hidden rounded-2xl border border-hairline">
              <img src={loginDesertHorizon} alt="" aria-hidden="true" className="auth-hero-image" />
              <div className="hito-auth-photo-overlay" aria-hidden="true" />
              <div className="auth-hero-content flex min-h-[14rem] items-end p-5">
                <div>
                  <p className="hito-label hito-label-signal">Auth/photo overlay</p>
                  <h3 className="hito-panel-title mt-3">Readable copy over atmosphere.</h3>
                  <p className="hito-body-small mt-3 max-w-sm text-muted-foreground">
                    Use <code className="hito-inline-code">hito-auth-photo-overlay</code> only where
                    imagery needs a controlled readability layer.
                  </p>
                </div>
              </div>
            </article>

            <article className="hito-launch-surface">
              <span className="hito-launcher-card-icon" aria-hidden="true">
                <Icon name="sparkles" size="md" />
              </span>
              <div>
                <p className="hito-label hito-label-signal">Elevated launch surface</p>
                <h3 className="hito-panel-title mt-3">Destination-scale entry cards.</h3>
                <p className="hito-body-small mt-3 text-muted-foreground">
                  Launcher cards can use alpha elevation and signal icon wash. Standard cards,
                  menus, and table cells should not inherit this treatment.
                </p>
              </div>
            </article>

            <article className="hito-surface-wash" data-tone="signal">
              <p className="hito-label hito-label-signal">State-surface wash</p>
              <h3 className="hito-panel-title mt-3">Setup, empty, or bounded state.</h3>
              <p className="hito-body-small mt-3 text-muted-foreground">
                Use <code className="hito-inline-code">hito-surface-wash</code> when the whole
                surface is communicating a state, not for ordinary content cards.
              </p>
            </article>

            <article className="hito-editorial-signal-wash hito-timeline-entry">
              <p className="hito-label hito-label-signal">Editorial signal wash</p>
              <h3 className="hito-panel-title mt-3">Changelog-style emphasis without pills.</h3>
              <p className="hito-body-small mt-3 text-muted-foreground">
                Editorial signal wash is for release-history and prose emphasis, alongside text
                highlights such as{" "}
                <span className="hito-highlight-tag" data-tone="signal">
                  New
                </span>
                , not operational status.
              </p>
            </article>

            <article className="hito-auth-alpha-surface hito-surface-flat rounded-2xl border border-hairline p-5">
              <p className="hito-label">Alpha overlay surface</p>
              <h3 className="hito-panel-title mt-3">Translucent only in atmospheric shells.</h3>
              <p className="hito-body-small mt-3 text-muted-foreground">
                Alpha surfaces belong on auth/photo or launcher canvases. Use standard solid Hito
                surfaces for normal forms, menus, inputs, and tables.
              </p>
            </article>
          </div>

          <div className="hito-reference-list">
            <ReferenceListRow
              label="Allowed"
              title="Five roles only"
              body="Canvas atmosphere, auth/photo overlay, elevated launch surface, state-surface wash, and editorial signal wash are the allowed gradient/overlay roles."
            />
            <ReferenceListRow
              label="Not default"
              title="Do not gradient ordinary controls"
              body="Buttons, standard inputs, normal cards, menus, table cells, and shell navigation rows stay semantic and low-chrome unless a future DS slice proves a repeated need."
            />
            <ReferenceListRow
              label="Alpha"
              title="Use alpha for atmosphere, not data truth"
              body="Alpha overlays are for readability over imagery or editorial atmosphere. Product truth should still be expressed with text, markers, state surfaces, and explicit labels."
            />
          </div>
        </div>
      </section>

      <section id="foundations" className="ds-section">
        <SectionIntro label="Foundations" title="Raw primitives before product semantics." />

        <div className="grid min-w-0 grid-cols-1 gap-8">
          <div className="grid min-w-0 grid-cols-1 gap-5">
            <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <p className="hito-label">Color documentation</p>
                <p className="hito-body-small mt-2 max-w-3xl">
                  Semantic tokens are the product API. Primitive swatches document the solid Hito
                  palette underneath them; alpha overlays and gradients stay semantic because they
                  describe usage context.
                </p>
              </div>
              <div
                className="hito-tabs hito-tabs-enclosed max-w-full overflow-x-auto"
                {...colorTabs.tabListProps}
                aria-label="Color token tabs"
              >
                {COLOR_TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    {...colorTabs.getTabProps(tab)}
                    className="hito-tab"
                    data-active={colorTab === tab ? "true" : undefined}
                    onClick={() => setColorTab(tab)}
                  >
                    {tab === "semantic" ? "Semantic Colors" : "Primitive"}
                  </button>
                ))}
              </div>
            </div>

            {colorTab === "semantic" ? (
              <div
                className="grid grid-cols-1 gap-4"
                {...colorTabs.getPanelProps("semantic")}
                aria-label="Semantic Colors"
              >
                <div className="hito-reference-note">
                  <p className="hito-label">Semantic Colors</p>
                  <p className="hito-body-small mt-2 max-w-3xl">
                    Click a card to copy the semantic code. Previews may resolve through primitive
                    colors, alpha mixes, or documented gradient/overlay classes, but product code
                    should use the semantic token or recipe.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {SEMANTIC_COLOR_TOKENS.map((token) => (
                    <SemanticColorCard key={token.name} token={token} onCopy={copyColorValue} />
                  ))}
                </div>
              </div>
            ) : (
              <div
                className="grid grid-cols-1 gap-5"
                {...colorTabs.getPanelProps("primitive")}
                aria-label="Primitive"
              >
                <div className="hito-reference-note">
                  <p className="hito-label">Primitive</p>
                  <p className="hito-body-small mt-2 max-w-3xl">
                    These are solid base colors and dedicated workout shade scales already defined
                    in Hito. Click a swatch to copy the live token reference. Alpha tokens are
                    intentionally excluded from this primitive tab and documented as semantic usage
                    colors.
                  </p>
                </div>
                {[...GENERAL_PRIMITIVE_COLOR_GROUPS, ...WORKOUT_PRIMITIVE_COLOR_GROUPS].map(
                  (group) => (
                    <PrimitiveColorGroup key={group.title} group={group} onCopy={copyColorValue} />
                  ),
                )}
              </div>
            )}
          </div>

          <HitoDsLightPaletteReference />

          <div className="grid min-w-0 grid-cols-1 gap-5">
            <div className="hito-reference-note">
              <p className="hito-label">Workout semantic roles</p>
              <p className="hito-body-small mt-2 max-w-3xl">
                Workout types and workout sections map onto primitive palettes through state-ready
                semantic slots. Product surfaces should consume these role tokens instead of
                primitive palette names.
              </p>
            </div>
            <WorkoutSemanticRoleGrid />
            <SectionSemanticRoleGrid />
          </div>

          <div className="hito-row-group">
            <ReferenceListRow
              label="Tone rule"
              title="Signal is the product accent, not the generic positive state."
              body="Use signal for primary Hito action and brand emphasis. Use success only for completed/saved/confirmed states."
            />
            <ReferenceListRow
              label="Tone rule"
              title="Warn and destructive are bounded feedback tones."
              body="Use warn for caution/review states. Use destructive for irreversible, dangerous, failed, or error-risk action semantics."
            />
            <ReferenceListRow
              label="Workout rule"
              title="Workout colors describe training identity, not CTA hierarchy."
              body="Accepted runner-facing workout and section roles support calendar and structure meaning. They should not replace button tones."
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="hito-reference-note">
              <p className="hito-label">Typography families</p>
              <div className="mt-4 grid gap-4">
                {TYPOGRAPHY_FAMILIES.map((item) => (
                  <TypographyFamilyRow key={item.family} item={item} />
                ))}
              </div>
              <p className="hito-caption mt-4 max-w-2xl">
                Banned drift patterns: local uppercase micro-label recipes, route-local serif
                section headings, and tiny metadata text when caption or micro-label already fits.
              </p>
            </div>

            <div className="hito-reference-note">
              <p className="hito-label">Spacing primitives</p>
              <div className="mt-4 grid gap-3">
                {SPACING_PRIMITIVES.map((space) => (
                  <SpacingPrimitiveRow key={space.name} space={space} />
                ))}
              </div>
            </div>

            <div className="hito-reference-note">
              <p className="hito-label">Radius primitives</p>
              <div className="mt-4 grid gap-3">
                {RADIUS_PRIMITIVES.map((radius) => (
                  <RadiusPrimitiveRow key={radius.token} radius={radius} />
                ))}
              </div>
            </div>
          </div>

          <div className="hito-reference-list">
            <ReferenceListRow
              label="Inset"
              title="Controls map size tiers to space primitives."
              body="XS uses space-2, SM uses space-3, MD/LG center around space-4, and XL can reach space-5."
            />
            <ReferenceListRow
              label="Panels"
              title="Panel padding stays compact."
              body="Compact panels use space-4. Emphasized or review-like panels use space-5. Route sections should breathe with space-6 or space-8."
            />
            <ReferenceListRow
              label="Hero"
              title="Only top-level moments reach space-10."
              body="Hero spacing is reserved for route identity. Component clusters should not simulate hero spacing locally."
            />
          </div>
        </div>
      </section>

      <section id="typography" className="ds-section">
        <SectionIntro label="Typography" title="Shared typography roles." />
        <div className="grid gap-8">
          <div className="grid gap-8">
            {HITO_TYPOGRAPHY_GROUPS.map((group) => (
              <section key={group.id} className="grid gap-3" aria-labelledby={`type-${group.id}`}>
                <div>
                  <h3 id={`type-${group.id}`} className="hito-label">
                    {group.label}
                  </h3>
                  <p className="hito-caption mt-1">{group.description}</p>
                </div>
                <div className="hito-reference-list">
                  {group.roles.map((role) => (
                    <TypographyRoleCard key={role.id} role={role} />
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="hito-reference-note">
            <p className="hito-label">Provenance</p>
            <div className="hito-body-small mt-2" data-hito-typography-provenance-specimen="">
              <span data-hito-typography-provenance-case="inherited">
                Nested text inherits a confirmed role.
              </span>{" "}
              <span className="hito-caption" data-hito-typography-provenance-case="nested-override">
                A nested role may override it.
              </span>
            </div>
            <p
              className="mt-2"
              data-hito-typography-provenance-case="unresolved-lookalike"
              style={{ fontSize: "0.875rem", fontWeight: 400, lineHeight: 1.58 }}
            >
              Matching values without provenance remain Custom.
            </p>
          </div>

          <TypographyInspectorPickerSpecimen />
        </div>
      </section>

      <section id="icons" className="ds-section">
        <SectionIntro label="Icons" title="One Hito registry, Tabler underneath." />

        <div className="grid gap-5">
          <div className="hito-reference-note flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="hito-label">Canonical sizing</p>
              <p className="hito-body-small mt-2 max-w-3xl">
                Icons use four sizes only: xs 14, sm 16, md 20, and lg 24. Small icons use a 1.75
                stroke by default; medium and large icons use 1.5. Preview the registry at one size
                at a time to inspect names and shapes without repeated rows.
              </p>
            </div>
            <div
              className="hito-choice-toggle-group items-center"
              {...iconSizeGroup.groupProps}
              aria-label="Icon preview size"
            >
              {ICON_PREVIEW_SIZES.map((previewSize) => (
                <HitoChoiceToggle
                  key={previewSize}
                  size="sm"
                  {...iconSizeGroup.getRadioProps(previewSize)}
                  className="uppercase"
                  selected={iconPreviewSize === previewSize}
                  onClick={() => setIconPreviewSize(previewSize)}
                >
                  {previewSize}
                </HitoChoiceToggle>
              ))}
            </div>
          </div>

          <div
            className="hito-surface-flat flex flex-wrap items-center justify-between gap-5 p-5"
            data-hito-ds-icon-preview
          >
            <div>
              <p className="hito-label">Icon size</p>
              <p className="hito-caption mt-1">
                Registry specimens below use {iconPreviewSize} · {HITO_ICON_SIZES[iconPreviewSize]}
                px.
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-4">
              {(["calendar", "download", "settings"] as const).map((iconName) => (
                <div key={iconName} className="grid justify-items-center gap-2">
                  <div className="grid h-10 min-w-10 place-items-center text-foreground">
                    <Icon name={iconName} size={iconPreviewSize} data-hito-ds-icon={iconName} />
                  </div>
                  <span className="hito-caption">{iconName}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(6.5rem,1fr))] gap-x-4 gap-y-7">
            {HITO_ICON_META.map((icon) => (
              <IconSpecimen key={icon.name} icon={icon} size={iconPreviewSize} />
            ))}
          </div>

          <div className="hito-surface-flat grid gap-4 p-5 lg:grid-cols-5">
            <IconUsageCard label="Button">
              <HitoButton size="sm" variant="secondary">
                <Icon name="download" size="sm" />
                Export JSON
              </HitoButton>
            </IconUsageCard>
            <IconUsageCard label="Input">
              <div className="relative">
                <Icon
                  name="search"
                  size="sm"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input size="md" className="pl-9" placeholder="Search plans" />
              </div>
            </IconUsageCard>
            <IconUsageCard label="Nav row">
              <div className="hito-shell-nav-row" data-active="true">
                <Icon name="calendar" className="hito-shell-nav-icon" />
                <span>Calendar</span>
                <span className="hito-shell-nav-dot" />
              </div>
            </IconUsageCard>
            <IconUsageCard label="Menu row">
              <div className="hito-shell-menu-item">
                <Icon name="settings" size="sm" />
                User settings
              </div>
            </IconUsageCard>
            <IconUsageCard label="Status marker">
              <span className="hito-status-marker" data-size="xs" data-tone="success">
                <Icon name="check" size="xs" strokeWidth={2.2} />
              </span>
            </IconUsageCard>
          </div>
        </div>
      </section>
    </>
  );
}

function LogoSpecimen({
  label,
  labelTone = "default",
  className,
  children,
}: {
  label: string;
  labelTone?: "default" | "inverse";
  className?: string;
  children: ReactNode;
}) {
  return (
    <article className={cn("hito-surface-flat grid min-h-36 content-between gap-5 p-5", className)}>
      <p className={cn("hito-label", labelTone === "inverse" && "text-[var(--sand-100)]")}>
        {label}
      </p>
      <div className="flex items-center">{children}</div>
    </article>
  );
}

function PrimitiveColorGroup({
  group,
  onCopy,
}: {
  group: PrimitiveColorGroupData;
  onCopy: (value: string, label: string) => void;
}) {
  return (
    <section className="grid gap-3" aria-labelledby={`${slugifyToken(group.title)}-colors`}>
      <div>
        <h3 id={`${slugifyToken(group.title)}-colors`} className="hito-panel-title">
          {group.title}
        </h3>
        <p className="hito-caption mt-1">{group.meta}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {group.colors.map((color) => (
          <PrimitiveColorSwatchButton key={color.token} color={color} onCopy={onCopy} />
        ))}
      </div>
    </section>
  );
}

function WorkoutSemanticRoleGrid() {
  return (
    <section className="grid grid-cols-1 gap-3" aria-labelledby="workout-semantic-type-colors">
      <div>
        <h3 id="workout-semantic-type-colors" className="hito-panel-title">
          Workout type roles
        </h3>
        <p className="hito-caption mt-1">Runner-facing workout labels mapped to primitives.</p>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {WORKOUT_TYPE_COLOR_ROLES.map((role) => (
          <SemanticRoleCard
            key={role.type}
            label={role.label}
            primitive={role.primitive}
            tokenFor={(slot) => workoutTypeColorToken(role.type, slot)}
            valueFor={(slot) => workoutTypeColorVar(role.type, slot)}
          />
        ))}
      </div>
    </section>
  );
}

function SectionSemanticRoleGrid() {
  return (
    <section className="grid grid-cols-1 gap-3" aria-labelledby="workout-semantic-section-colors">
      <div>
        <h3 id="workout-semantic-section-colors" className="hito-panel-title">
          Section role tokens
        </h3>
        <p className="hito-caption mt-1">
          Repeat set is structural only: it repeats an ordered list of child blocks. Children own
          role, color, and target; Work + Recover is one interval example.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {WORKOUT_SECTION_COLOR_ROLES.map((role) => (
          <SemanticRoleCard
            key={role.type}
            label={role.label}
            primitive={role.primitive}
            tokenFor={(slot) => workoutSectionColorToken(role.type, slot)}
            valueFor={(slot) => workoutSectionColorVar(role.type, slot)}
          />
        ))}
        <RepeatSetStructureCard />
      </div>
    </section>
  );
}

function SemanticRoleCard({
  label,
  primitive,
  tokenFor,
  valueFor,
}: {
  label: string;
  primitive: WorkoutPrimitivePaletteId;
  tokenFor: (slot: WorkoutColorStateSlot) => string;
  valueFor: (slot: WorkoutColorStateSlot) => string;
}) {
  return (
    <article className="hito-surface-flat grid min-h-56 gap-4 p-4">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="hito-label">maps to {primitive}</span>
          <span className="mt-2 block hito-list-row-title">{label}</span>
          <code className="mt-1 block truncate hito-technical-mono">{tokenFor("base")}</code>
        </span>
        <span
          aria-hidden="true"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-hairline text-[0.625rem] font-semibold"
          style={{
            background: valueFor("base"),
            color: valueFor("foreground"),
            borderColor: valueFor("border"),
            boxShadow: `0 0 0 2px ${valueFor("ring")}`,
          }}
        >
          Aa
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {WORKOUT_COLOR_STATE_SLOTS.map((slot) => (
          <span
            key={slot}
            className="min-w-0 rounded-lg border px-2.5 py-2 text-[0.6875rem] font-medium"
            style={semanticRoleSlotStyle(slot, valueFor)}
          >
            {slot}
          </span>
        ))}
      </div>
    </article>
  );
}

function RepeatSetStructureCard() {
  const examples: ReadonlyArray<{
    rounds: string;
    summary: string;
    children: ReadonlyArray<{ label: string; role: WorkoutSectionColorRole; note?: string }>;
  }> = [
    {
      rounds: "3x",
      summary: "3x [Run + Walk]",
      children: [
        { label: "Run", role: "run" },
        { label: "Walk", role: "walk" },
      ],
    },
    {
      rounds: "4x",
      summary: "4x [Easy/Run + Work/Tempo + Recover]",
      children: [
        { label: "Run", role: "run", note: "Easy" },
        { label: "Work", role: "work", note: "Tempo" },
        { label: "Recover", role: "recover" },
      ],
    },
    {
      rounds: "6x",
      summary: "6x [Work + Recover]",
      children: [
        { label: "Work", role: "work" },
        { label: "Recover", role: "recover" },
      ],
    },
  ];

  return (
    <article className="hito-surface-flat grid min-h-56 gap-4 p-4">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="hito-label">structural wrapper</span>
          <span className="mt-2 block hito-list-row-title">Repeat set</span>
          <span className="mt-1 block hito-caption">
            No standalone section color token; ordered children own the section roles.
          </span>
        </span>
        <span className="rounded-full border border-hairline px-2.5 py-1 hito-technical-mono">
          container
        </span>
      </div>
      <div className="grid gap-3">
        {examples.map((example) => (
          <div key={example.summary} className="grid gap-2 rounded-lg border border-hairline p-2.5">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="rounded-full border border-hairline px-2 py-0.5 hito-technical-mono">
                {example.rounds}
              </span>
              <span className="min-w-0 hito-caption">{example.summary}</span>
            </div>
            <div className="flex min-w-0 flex-wrap gap-2">
              {example.children.map((child, index) => (
                <span
                  key={`${example.summary}-${child.role}-${index}`}
                  className="rounded-lg border px-2.5 py-2 text-[0.6875rem] font-medium"
                  style={{
                    background: workoutSectionColorVar(child.role, "surface"),
                    borderColor: workoutSectionColorVar(child.role, "border"),
                    color: workoutSectionColorVar(child.role),
                  }}
                >
                  {child.label}
                  {child.note ? <span className="ml-1 opacity-70">· {child.note}</span> : null}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function semanticRoleSlotStyle(
  slot: WorkoutColorStateSlot,
  valueFor: (slot: WorkoutColorStateSlot) => string,
): CSSProperties {
  if (slot === "base" || slot === "foreground") {
    return {
      background: valueFor("base"),
      borderColor: valueFor("border"),
      color: valueFor("foreground"),
    };
  }

  if (slot === "muted") {
    return {
      background: valueFor("muted"),
      borderColor: valueFor("border"),
      color: valueFor("foreground"),
    };
  }

  if (slot === "border") {
    return {
      background: "transparent",
      borderColor: valueFor("border"),
      color: valueFor("base"),
    };
  }

  if (slot === "ring") {
    return {
      background: "transparent",
      borderColor: valueFor("border"),
      boxShadow: `0 0 0 2px ${valueFor("ring")}`,
      color: valueFor("base"),
    };
  }

  return {
    background: valueFor(slot),
    borderColor: valueFor("border"),
    color: valueFor("base"),
  };
}

function PrimitiveColorSwatchButton({
  color,
  onCopy,
}: {
  color: PrimitiveColorSwatch;
  onCopy: (value: string, label: string) => void;
}) {
  return (
    <button
      type="button"
      className="group hito-surface-flat grid min-h-36 min-w-0 overflow-hidden text-left transition hover:-translate-y-0.5 hover:border-signal/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      onClick={() => onCopy(color.value, color.token)}
      aria-label={`Copy ${color.token}`}
    >
      <span
        aria-hidden="true"
        className="min-h-20 border-b border-hairline"
        style={{ background: color.value } satisfies CSSProperties}
      />
      <span className="flex min-w-0 items-center justify-between gap-3 p-4">
        <span className="min-w-0 flex-1">
          <span className="block hito-technical-mono">{color.step}</span>
          <span className="mt-1 block truncate hito-caption" title={color.token}>
            {color.token}
          </span>
        </span>
        <Icon
          name="copy"
          size="xs"
          className="shrink-0 opacity-0 transition group-hover:opacity-80 group-focus-visible:opacity-100"
        />
      </span>
    </button>
  );
}

function SemanticColorCard({
  token,
  onCopy,
}: {
  token: (typeof SEMANTIC_COLOR_TOKENS)[number];
  onCopy: (value: string, label: string) => void;
}) {
  const copyValue = token.value.startsWith("var(") ? token.value : token.value;

  return (
    <button
      type="button"
      className="group hito-surface-flat grid min-h-40 min-w-0 content-between gap-4 p-4 text-left transition hover:-translate-y-0.5 hover:border-signal/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      onClick={() => onCopy(copyValue, token.name)}
      aria-label={`Copy ${token.name} semantic token`}
    >
      <span className="flex min-w-0 items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="hito-label">{token.group}</span>
          <span className="mt-2 block truncate hito-list-row-title" title={token.name}>
            {token.name}
          </span>
          <span className="mt-1 block truncate hito-caption" title={`maps to ${token.mapsTo}`}>
            maps to {token.mapsTo}
          </span>
        </span>
        <SemanticColorPreview token={token} />
      </span>
      <span className="flex min-w-0 items-center justify-between gap-3">
        <code className="hito-technical-mono min-w-0 flex-1 truncate" title={copyValue}>
          {copyValue}
        </code>
        <Icon
          name="copy"
          size="xs"
          className="shrink-0 opacity-0 transition group-hover:opacity-80 group-focus-visible:opacity-100"
        />
      </span>
    </button>
  );
}

function SemanticColorPreview({ token }: { token: SemanticColorTokenData }) {
  const className = "h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-hairline";

  if (token.value.startsWith("var(")) {
    return (
      <span
        aria-hidden="true"
        className={className}
        style={{ background: token.value } satisfies CSSProperties}
      />
    );
  }

  if (token.value === "hito-auth-photo-overlay") {
    return (
      <span aria-hidden="true" className={cn("auth-hero", className)}>
        <span className="hito-auth-photo-overlay" />
      </span>
    );
  }

  if (token.value === "hito-canvas-atmosphere" || token.value === "hito-editorial-signal-wash") {
    return (
      <span
        aria-hidden="true"
        className={cn(
          className,
          token.value === "hito-canvas-atmosphere" && "bg-background",
          token.value,
        )}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={className}
      style={{ background: "var(--surface-elevated)" } satisfies CSSProperties}
    />
  );
}

function slugifyToken(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function copyTextWithLegacySelection(value: string) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();

  if (!copied) {
    throw new Error("Copy command failed");
  }
}

function TypographyFamilyRow({ item }: { item: (typeof TYPOGRAPHY_FAMILIES)[number] }) {
  return (
    <div className="border-t border-hairline pt-4 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-baseline gap-2">
        <p className="hito-list-row-title">{item.family}</p>
        <span className="hito-caption">{item.font}</span>
      </div>
      <p className="hito-body-small mt-1">{item.roles}</p>
      <p className="hito-caption mt-2">{item.rule}</p>
    </div>
  );
}

function SpacingPrimitiveRow({ space }: { space: (typeof SPACING_PRIMITIVES)[number] }) {
  return (
    <div className="grid gap-2 border-t border-hairline pt-3 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="hito-list-row-title">{space.name}</p>
        <code className="hito-technical-mono">{space.value}</code>
      </div>
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="h-2 rounded-full bg-signal"
          style={{ width: `calc(${space.value} * 5)` } satisfies CSSProperties}
        />
        <p className="hito-caption">{space.use}</p>
      </div>
    </div>
  );
}

function RadiusPrimitiveRow({ radius }: { radius: (typeof RADIUS_PRIMITIVES)[number] }) {
  return (
    <div className="grid gap-2 border-t border-hairline pt-3 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="hito-list-row-title">{radius.name}</p>
        <code className="hito-technical-mono">
          {radius.value} · {radius.token}
        </code>
      </div>
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="block size-10 shrink-0 border border-hairline bg-muted/60"
          style={{ borderRadius: `var(${radius.token})` } satisfies CSSProperties}
        />
        <p className="hito-caption">{radius.use}</p>
      </div>
    </div>
  );
}

type InspectorTypographyEvidence = NonNullable<InlineChangeTargetInput["typography"]>;

function TypographyInspectorPickerSpecimen() {
  const inheritedRef = useRef<HTMLSpanElement>(null);
  const componentRef = useRef<HTMLButtonElement>(null);
  const customRef = useRef<HTMLParagraphElement>(null);
  const [inheritedTypography, setInheritedTypography] =
    useState<InspectorTypographyEvidence | null>(null);
  const [componentTypography, setComponentTypography] =
    useState<InspectorTypographyEvidence | null>(null);
  const [customTypography, setCustomTypography] = useState<InspectorTypographyEvidence | null>(
    null,
  );
  const [inheritedDesiredRoleId, setInheritedDesiredRoleId] = useState<string | null>(null);
  const [componentDesiredRoleId, setComponentDesiredRoleId] = useState<string | null>(null);
  const [customDesiredRoleId, setCustomDesiredRoleId] = useState<string | null>(null);

  useLayoutEffect(() => {
    setInheritedTypography(
      inheritedRef.current ? (inspectLocalUiTarget(inheritedRef.current).typography ?? null) : null,
    );
    setComponentTypography(
      componentRef.current ? (inspectLocalUiTarget(componentRef.current).typography ?? null) : null,
    );
    setCustomTypography(
      customRef.current ? (inspectLocalUiTarget(customRef.current).typography ?? null) : null,
    );
  }, []);

  return (
    <div className="hito-reference-note grid gap-4" data-hito-ds-typography-inspector-specimen="">
      <div>
        <p className="hito-label">Inspector typography picker</p>
        <p className="hito-body-small mt-2 max-w-3xl">
          The first option previews the selected element&apos;s computed typography. Component roles
          can be recognized without becoming replacement choices, and a computed preview never
          establishes provenance.
        </p>
      </div>

      <div className="hito-row-group">
        <div
          className="hito-list-row grid gap-3"
          data-hito-ds-typography-picker-case="inherited"
          data-hito-ds-typography-picker-current-role={
            inheritedTypography?.currentRole?.id ?? "pending"
          }
        >
          <div className="hito-body">
            <span ref={inheritedRef}>Inherited body typography from a shared Hito owner.</span>
          </div>
          {inheritedTypography ? (
            <TypographyControlRow
              desiredRoleId={inheritedDesiredRoleId}
              onDesiredRoleChange={setInheritedDesiredRoleId}
              typography={inheritedTypography}
            />
          ) : null}
        </div>

        <div
          className="hito-list-row grid gap-3"
          data-hito-ds-typography-picker-case="component"
          data-hito-ds-typography-picker-current-role={
            componentTypography?.currentRole?.id ?? "pending"
          }
        >
          <HitoButton
            ref={componentRef}
            size="sm"
            variant="secondary"
            className="justify-self-start"
          >
            Component-owned button typography
          </HitoButton>
          {componentTypography ? (
            <TypographyControlRow
              desiredRoleId={componentDesiredRoleId}
              onDesiredRoleChange={setComponentDesiredRoleId}
              typography={componentTypography}
            />
          ) : null}
        </div>

        <div
          className="hito-list-row grid gap-3"
          data-hito-ds-typography-picker-case="custom"
          data-hito-ds-typography-picker-current-role={
            customTypography?.currentRole?.id ?? "custom"
          }
        >
          <p
            ref={customRef}
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.0625rem",
              fontStyle: "italic",
              fontWeight: 500,
              letterSpacing: "0.015em",
              lineHeight: 1.4,
            }}
          >
            Unresolved custom typography remains observational.
          </p>
          {customTypography ? (
            <TypographyControlRow
              desiredRoleId={customDesiredRoleId}
              onDesiredRoleChange={setCustomDesiredRoleId}
              typography={customTypography}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function TypographyRoleCard({ role }: { role: HitoTypographyRole }) {
  return (
    <article className="hito-reference-row">
      <div>
        <p className="hito-label">{role.label}</p>
        <p className="hito-caption mt-2">{role.use}</p>
      </div>
      <div className="grid gap-3">
        <div className="hito-open-specimen">
          <div className={role.className}>{role.sample}</div>
        </div>
        <div className="hito-reference-meta">
          <code className="hito-technical-mono">.{role.className.split(" ")[0]}</code>
          <span className="hito-caption">{role.spec}</span>
        </div>
      </div>
    </article>
  );
}

function IconSpecimen({
  icon,
  size,
}: {
  icon: (typeof HITO_ICON_META)[number];
  size: HitoIconSize;
}) {
  return (
    <article
      className="grid justify-items-center gap-2 text-center"
      data-hito-ds-icon-specimen={icon.name}
      data-hito-ds-icon-size={size}
    >
      <div className="grid h-8 place-items-center text-foreground">
        <Icon name={icon.name} size={size} />
      </div>
      <div className="grid gap-1">
        <p className="hito-list-row-title">{icon.name}</p>
        <p className="hito-caption">{icon.category}</p>
      </div>
    </article>
  );
}

function IconUsageCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <article className="grid min-h-28 gap-4 border-t border-hairline pt-4 first:border-t-0 first:pt-0 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0 lg:first:border-l-0 lg:first:pl-0">
      <p className="hito-label">{label}</p>
      <div className="flex items-center">{children}</div>
    </article>
  );
}

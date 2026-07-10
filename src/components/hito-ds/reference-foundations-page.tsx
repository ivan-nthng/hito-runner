import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import loginDesertHorizon from "@/assets/marketing/hero-background/login-desert-horizon.jpg";
import { HitoLogo, HitoLogoMark } from "@/components/ui/hito-logo";
import { hitoToast } from "@/components/ui/hito-toast";
import { HITO_ICON_META, HITO_ICON_SIZES, Icon, type HitoIconSize } from "@/components/ui/icon";
import { ChoiceSelector } from "@/components/hito-ds/specimen-previews";
import { ReferenceListRow, SectionIntro } from "@/components/hito-ds/reference";
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
import { HITO_TYPOGRAPHY_ROLES, type HitoTypographyRole } from "@/lib/hito-typography-roles";
import { cn } from "@/lib/utils";

const COLOR_TABS = ["semantic", "primitive"] as const;
const ICON_PREVIEW_SIZES = Object.keys(HITO_ICON_SIZES) as HitoIconSize[];

type ColorTab = (typeof COLOR_TABS)[number];

type PrimitiveColorSwatch = {
  step: string;
  token: string;
  value: string;
  contrast: string;
  hex?: string;
  copyValue?: string;
};

type PrimitiveColorGroupData = {
  title: string;
  meta: string;
  colors: readonly PrimitiveColorSwatch[];
};

const WORKOUT_PRIMITIVE_CONTRAST: Record<(typeof WORKOUT_COLOR_SHADE_STEPS)[number], string> = {
  "50": "dark on tint",
  "100": "dark on tint",
  "200": "dark on tint",
  "300": "dark on tint",
  "400": "dark on tint",
  "500": "role dependent",
  "600": "light on shade",
  "700": "light on shade",
  "800": "light on shade",
  "900": "light on shade",
  "950": "light on shade",
};

const WORKOUT_PRIMITIVE_COLOR_GROUPS: readonly PrimitiveColorGroupData[] =
  WORKOUT_PRIMITIVE_PALETTE_FAMILIES.map((palette) => ({
    title: palette.label,
    meta: `Workout primitive scale / base ${palette.base}`,
    colors: WORKOUT_COLOR_SHADE_STEPS.map((step) => ({
      step,
      token: `${palette.tokenPrefix}-${step}`,
      value: workoutPrimitiveColorVar(palette.id, step),
      copyValue: workoutPrimitiveColorVar(palette.id, step),
      contrast: WORKOUT_PRIMITIVE_CONTRAST[step],
    })),
  }));

const RAW_COLOR_PRIMITIVES: readonly PrimitiveColorGroupData[] = [
  {
    title: "Stone",
    meta: "Primitive / neutral dark",
    colors: [
      {
        step: "950",
        token: "--stone-950",
        value: "var(--stone-950)",
        hex: "#0B0907",
        contrast: "light 17.6:1",
      },
      {
        step: "900",
        token: "--stone-900",
        value: "var(--stone-900)",
        hex: "#0F0D0B",
        contrast: "light 17.2:1",
      },
      {
        step: "850",
        token: "--stone-850",
        value: "var(--stone-850)",
        hex: "#161312",
        contrast: "light 16.4:1",
      },
      {
        step: "825",
        token: "--stone-825",
        value: "var(--stone-825)",
        hex: "#1A1816",
        contrast: "light 15.7:1",
      },
      {
        step: "800",
        token: "--stone-800",
        value: "var(--stone-800)",
        hex: "#1D1A18",
        contrast: "light 15.4:1",
      },
      {
        step: "750",
        token: "--stone-750",
        value: "var(--stone-750)",
        hex: "#211F1C",
        contrast: "light 14.6:1",
      },
      {
        step: "700",
        token: "--stone-700",
        value: "var(--stone-700)",
        hex: "#272320",
        contrast: "light 13.8:1",
      },
      {
        step: "500",
        token: "--stone-500",
        value: "var(--stone-500)",
        hex: "#75716B",
        contrast: "light 4.3:1",
      },
    ],
  },
  {
    title: "Sand",
    meta: "Primitive / neutral light",
    colors: [
      {
        step: "50",
        token: "--sand-50",
        value: "var(--sand-50)",
        hex: "#FAF8F5",
        contrast: "dark 18.3:1",
      },
      {
        step: "100",
        token: "--sand-100",
        value: "var(--sand-100)",
        hex: "#F3F1EE",
        contrast: "dark 17.2:1",
      },
      {
        step: "200",
        token: "--sand-200",
        value: "var(--sand-200)",
        hex: "#E6E4E1",
        contrast: "dark 15.3:1",
      },
      {
        step: "500",
        token: "--sand-500",
        value: "var(--sand-500)",
        hex: "#8A8580",
        contrast: "dark 5.3:1",
      },
    ],
  },
  {
    title: "Signal",
    meta: "Primitive / brand and corporate accent",
    colors: [
      {
        step: "500",
        token: "--amber-500",
        value: "var(--amber-500)",
        hex: "#F4A34B",
        contrast: "dark 9.4:1",
      },
      {
        step: "600",
        token: "--amber-600",
        value: "var(--amber-600)",
        hex: "#D58B4B",
        contrast: "dark 7.0:1",
      },
    ],
  },
  {
    title: "Workout and feedback bases",
    meta: "Primitive / purposeful base tones",
    colors: [
      {
        step: "blue-500",
        token: "--blue-500",
        value: "var(--blue-500)",
        hex: "#6DB2B6",
        contrast: "dark 8.0:1",
      },
      {
        step: "terracotta-500",
        token: "--terracotta-500",
        value: "var(--terracotta-500)",
        hex: "#F2716A",
        contrast: "dark 6.8:1",
      },
      {
        step: "green-500",
        token: "--green-500",
        value: "var(--green-500)",
        hex: "#57BC80",
        contrast: "dark 8.2:1",
      },
      {
        step: "orange-500",
        token: "--orange-500",
        value: "var(--orange-500)",
        hex: "#F88F4F",
        contrast: "dark 8.3:1",
      },
      {
        step: "red-500",
        token: "--red-500",
        value: "var(--red-500)",
        hex: "#DE4E4B",
        contrast: "dark 4.9:1",
      },
    ],
  },
] as const;

type SemanticColorTokenData = {
  name: string;
  value: string;
  mapsTo: string;
  group: string;
};

const WORKOUT_SEMANTIC_COLOR_TOKENS: readonly SemanticColorTokenData[] = [
  ...WORKOUT_TYPE_COLOR_ROLES.map((role) => ({
    name: `workout/${role.label}`,
    value: workoutTypeColorVar(role.type),
    mapsTo: `${role.primitive}-500`,
    group: "workout type",
  })),
  ...WORKOUT_SECTION_COLOR_ROLES.map((role) => ({
    name: `section/${role.label}`,
    value: workoutSectionColorVar(role.type),
    mapsTo: `${role.primitive}-500`,
    group: "workout section",
  })),
];

const SEMANTIC_COLOR_TOKENS: readonly SemanticColorTokenData[] = [
  { name: "background", value: "var(--background)", mapsTo: "stone-900", group: "canvas" },
  { name: "foreground", value: "var(--foreground)", mapsTo: "sand-100", group: "text" },
  { name: "surface", value: "var(--surface)", mapsTo: "stone-850", group: "surface" },
  {
    name: "surface-elevated",
    value: "var(--surface-elevated)",
    mapsTo: "stone-800",
    group: "surface",
  },
  { name: "card", value: "var(--card)", mapsTo: "surface", group: "surface" },
  { name: "popover", value: "var(--popover)", mapsTo: "stone-825", group: "surface" },
  { name: "border", value: "var(--border)", mapsTo: "sand-alpha-08", group: "border / alpha" },
  { name: "hairline", value: "var(--hairline)", mapsTo: "sand-alpha-06", group: "border / alpha" },
  { name: "input", value: "var(--input)", mapsTo: "sand-alpha-10", group: "interactive / alpha" },
  { name: "ring", value: "var(--ring)", mapsTo: "amber-600", group: "interactive" },
  { name: "muted", value: "var(--muted)", mapsTo: "stone-800", group: "surface" },
  { name: "muted-foreground", value: "var(--muted-foreground)", mapsTo: "sand-500", group: "text" },
  { name: "accent", value: "var(--accent)", mapsTo: "stone-700", group: "interactive" },
  { name: "signal", value: "var(--signal)", mapsTo: "amber-500", group: "accent" },
  { name: "success", value: "var(--success)", mapsTo: "green-500", group: "status" },
  { name: "warn", value: "var(--warn)", mapsTo: "orange-500", group: "status" },
  { name: "destructive", value: "var(--destructive)", mapsTo: "red-500", group: "status" },
  { name: "easy", value: "var(--easy)", mapsTo: "workout/Easy", group: "compat workout" },
  { name: "long", value: "var(--long)", mapsTo: "workout/Long Run", group: "compat workout" },
  { name: "quality", value: "var(--quality)", mapsTo: "workout/Tempo", group: "compat workout" },
  { name: "rest", value: "var(--rest)", mapsTo: "workout/Rest", group: "compat workout" },
  ...WORKOUT_SEMANTIC_COLOR_TOKENS,
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
] as const;

const SPACING_PRIMITIVES = [
  { name: "space-1", value: "0.25rem", use: "Tiny internal offsets" },
  { name: "space-2", value: "0.5rem", use: "XS control inset and tight pairs" },
  { name: "space-3", value: "0.75rem", use: "Small control inset and compact row gaps" },
  { name: "space-4", value: "1rem", use: "Default control inset and compact panel padding" },
  { name: "space-5", value: "1.25rem", use: "Emphasized panel padding" },
  { name: "space-6", value: "1.5rem", use: "Section and grouped-route rhythm" },
  { name: "space-8", value: "2rem", use: "Open page section rhythm" },
  { name: "space-10", value: "2.5rem", use: "Hero/top-level route moments only" },
] as const;

const RADIUS_PRIMITIVES = [
  { name: "radius-sm", token: "--radius-sm", use: "Tiny tags, compact inspector chips" },
  { name: "radius-md", token: "--radius-md", use: "Small buttons, inputs, menu rows" },
  { name: "radius-lg", token: "--radius-lg", use: "Default controls and menus" },
  { name: "radius-xl", token: "--radius-xl", use: "Cards, day rows, compact panels" },
  { name: "radius-2xl", token: "--radius-2xl", use: "Dialogs and emphasized surfaces" },
  { name: "radius-3xl", token: "--radius-3xl", use: "Large editorial/product moments" },
  { name: "radius-4xl", token: "--radius-4xl", use: "Reserved oversized surfaces" },
] as const;

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
        <SectionIntro
          label="Brand"
          title="The Hito wordmark and mark are primitives, not icons."
          body="Use HitoLogo for true wordmark placements and HitoLogoMark for compact brand marks. Both inherit currentColor, size through logo CSS variables, and keep product variants like Admin or DS as separate text."
        />

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
              className="bg-[var(--stone-950)] text-[var(--sand-100)]"
            >
              <HitoLogo decorative className="[--hito-logo-height:1.7rem]" />
            </LogoSpecimen>
            <LogoSpecimen
              label="Favicon surface"
              className="bg-[linear-gradient(135deg,#3a3732_0%,#15130f_52%,#030303_100%)] text-[var(--sand-100)]"
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
          body="Hito keeps one small gradient and alpha-overlay family for canvas depth, photo readability, launch surfaces, state washes, and editorial signal washes. Ordinary controls stay flat and semantic."
        />

        <div className="grid gap-8">
          <div className="grid gap-5 xl:grid-cols-2">
            <article className="hito-canvas-atmosphere rounded-2xl border border-hairline bg-background p-5">
              <p className="hito-label hito-label-signal">Canvas atmosphere</p>
              <h3 className="hito-panel-title mt-3">Route-level depth only.</h3>
              <p className="hito-body-small mt-3 text-muted-foreground">
                Use <code className="hito-inline-code">hito-canvas-atmosphere</code> for large app
                canvases and internal reference pages, not nested cards.
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
        <SectionIntro
          label="Foundations"
          title="Raw primitives before product semantics."
          body="Hito now names the first layer of color and spacing so product surfaces can compose from semantic tokens instead of re-inventing local values."
        />

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
                role="tablist"
                aria-label="Color token tabs"
              >
                {COLOR_TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={colorTab === tab}
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
              <div className="grid grid-cols-1 gap-4" role="tabpanel" aria-label="Semantic Colors">
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
              <div className="grid grid-cols-1 gap-5" role="tabpanel" aria-label="Primitive">
                <div className="hito-reference-note">
                  <p className="hito-label">Primitive</p>
                  <p className="hito-body-small mt-2 max-w-3xl">
                    These are solid base colors and dedicated workout shade scales already defined
                    in Hito. Click a swatch to copy the live token reference. Alpha tokens are
                    intentionally excluded from this primitive tab and documented as semantic usage
                    colors.
                  </p>
                </div>
                {RAW_COLOR_PRIMITIVES.map((group) => (
                  <PrimitiveColorGroup key={group.title} group={group} onCopy={copyColorValue} />
                ))}
              </div>
            )}
          </div>

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
        <SectionIntro
          label="Typography"
          title="Shared roles, not route-local guesses."
          body="Display is scarce, UI text stays operational, and mono values carry measured truth. Use these classes before adding route-local text utilities."
        />
        <div className="grid gap-5">
          <div className="hito-reference-note">
            <p className="hito-label">Font ownership</p>
            <p className="hito-body-small mt-2 max-w-3xl">
              Fraunces owns display, page, modal, section, and panel titles. Poppins owns
              operational UI, labels, body, actions, navigation, and feedback. JetBrains Mono owns
              measured or fixed-format truth only.
            </p>
          </div>

          <div className="hito-reference-list">
            {HITO_TYPOGRAPHY_ROLES.map((role) => (
              <TypographyRoleCard key={role.id} role={role} />
            ))}
          </div>

          <div className="hito-row-group">
            <ReferenceListRow
              label="Avoid"
              title="Oversized compact headings"
              body="Use panel title inside dense feedback, import, and proposal modules instead of route-local display sizes."
            />
            <ReferenceListRow
              label="Avoid"
              title="Stacked uppercase micro labels"
              body="Labels orient a block once. Repeating them turns support copy into noise."
            />
            <ReferenceListRow
              label="Avoid"
              title="Helper text as body copy"
              body="Use helper only beside controls; use body or body small for normal explanations."
            />
          </div>
        </div>
      </section>

      <section id="icons" className="ds-section">
        <SectionIntro
          label="Icons"
          title="One Hito registry, Tabler underneath."
          body="Product surfaces use the Hito Icon primitive and stable product names. Tabler is the glyph backend; raw SVG folders and direct icon-family imports are not a design-system source of truth."
        />

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
              role="radiogroup"
              aria-label="Icon preview size"
            >
              {ICON_PREVIEW_SIZES.map((previewSize) => (
                <button
                  key={previewSize}
                  type="button"
                  role="radio"
                  aria-checked={iconPreviewSize === previewSize}
                  className="hito-choice-toggle hito-choice-toggle-sm uppercase"
                  data-selected={iconPreviewSize === previewSize ? "true" : undefined}
                  onClick={() => setIconPreviewSize(previewSize)}
                >
                  {previewSize}
                </button>
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
              <button type="button" className="hito-button hito-button-secondary hito-button-sm">
                <Icon name="download" size="sm" />
                Export JSON
              </button>
            </IconUsageCard>
            <IconUsageCard label="Input">
              <div className="relative">
                <Icon
                  name="search"
                  size="sm"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input className="hito-field hito-field-md pl-9" placeholder="Search plans" />
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
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <article className={cn("hito-surface-flat grid min-h-36 content-between gap-5 p-5", className)}>
      <p className="hito-label">{label}</p>
      <div className="flex items-center">{children}</div>
    </article>
  );
}

function PrimitiveColorGroup({
  group,
  onCopy,
}: {
  group: (typeof RAW_COLOR_PRIMITIVES)[number];
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
  const copyValue = color.copyValue ?? color.hex ?? color.value;
  const foreground = color.contrast.startsWith("light") ? "var(--sand-100)" : "var(--stone-900)";

  return (
    <button
      type="button"
      className="group grid min-h-36 content-between rounded-2xl border border-hairline p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-signal/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      style={
        {
          background: color.value,
          color: foreground,
        } satisfies CSSProperties
      }
      onClick={() => onCopy(copyValue, color.token)}
      aria-label={`Copy ${color.token}`}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="hito-technical-mono text-lg">{color.step}</span>
        <span className="rounded-full bg-black/20 px-2 py-1 text-[0.625rem] font-medium uppercase tracking-[0.12em] backdrop-blur-sm">
          {color.contrast}
        </span>
      </span>
      <span className="flex items-center justify-between gap-3">
        <span className="min-w-0">
          <span className="block truncate hito-technical-mono">{color.hex ?? copyValue}</span>
          <span className="mt-1 block truncate text-[0.7rem] opacity-80">{color.token}</span>
        </span>
        <Icon
          name="copy"
          size="xs"
          className="opacity-0 transition group-hover:opacity-80 group-focus-visible:opacity-100"
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
  const previewStyle = token.value.startsWith("var(")
    ? ({ background: token.value } satisfies CSSProperties)
    : getSemanticRecipePreviewStyle(token.value);

  return (
    <button
      type="button"
      className="group hito-surface-flat grid min-h-40 content-between gap-4 p-4 text-left transition hover:-translate-y-0.5 hover:border-signal/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      onClick={() => onCopy(copyValue, token.name)}
      aria-label={`Copy ${token.name} semantic token`}
    >
      <span className="flex items-start justify-between gap-3">
        <span>
          <span className="hito-label">{token.group}</span>
          <span className="mt-2 block hito-list-row-title">{token.name}</span>
          <span className="mt-1 block hito-caption">maps to {token.mapsTo}</span>
        </span>
        <span
          aria-hidden="true"
          className="h-10 w-10 shrink-0 rounded-xl border border-hairline"
          style={previewStyle}
        />
      </span>
      <span className="flex items-center justify-between gap-3">
        <code className="hito-technical-mono min-w-0 truncate">{copyValue}</code>
        <Icon
          name="copy"
          size="xs"
          className="shrink-0 opacity-0 transition group-hover:opacity-80 group-focus-visible:opacity-100"
        />
      </span>
    </button>
  );
}

function getSemanticRecipePreviewStyle(value: string): CSSProperties {
  if (value === "hito-canvas-atmosphere") {
    return {
      background:
        "radial-gradient(ellipse at top, oklch(0.22 0.01 60 / 0.4), transparent 60%), radial-gradient(ellipse at bottom, oklch(0.13 0.005 60 / 0.6), transparent 50%), var(--background)",
    };
  }

  if (value === "hito-auth-photo-overlay") {
    return {
      background:
        "linear-gradient(135deg, color-mix(in oklch, var(--stone-950) 92%, transparent), color-mix(in oklch, var(--stone-800) 34%, transparent))",
    };
  }

  if (value === "hito-editorial-signal-wash") {
    return {
      background:
        "linear-gradient(135deg, color-mix(in oklch, var(--signal) 22%, transparent), color-mix(in oklch, var(--surface) 82%, transparent))",
    };
  }

  return { background: "var(--surface-elevated)" };
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
        <code className="hito-technical-mono">{radius.token}</code>
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

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { APP_NAME } from "@/lib/app-config";
import { HitoLogo } from "@/components/ui/hito-logo";
import { hitoToast } from "@/components/ui/hito-toast";
import { HITO_ICON_META, HITO_ICON_SIZES, Icon, type HitoIconName } from "@/components/ui/icon";
import { WorkoutGlyph } from "@/components/WorkoutGlyph";
import type { WorkoutGlyphKind } from "@/lib/workout-glyph";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/hitoDS")({
  head: () => ({
    meta: [
      { title: `Hito Design System — ${APP_NAME}` },
      {
        name: "description",
        content: "Internal Hito design-system reference for the simplified Hito product language.",
      },
    ],
  }),
  component: HitoDesignSystemPage,
});

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "brand", label: "Brand" },
  { id: "foundations", label: "Foundations" },
  { id: "typography", label: "Typography" },
  { id: "icons", label: "Icons" },
  { id: "buttons", label: "Buttons" },
  { id: "tabs", label: "Tabs" },
  { id: "data-table", label: "Tables" },
  { id: "inputs", label: "Inputs" },
  { id: "selection-controls", label: "Selection" },
  { id: "surfaces", label: "Composition" },
  { id: "modals", label: "Modals" },
  { id: "async-actions", label: "Async toasts" },
  { id: "states", label: "States" },
  { id: "analytics", label: "Summary truth" },
  { id: "rows", label: "Rows & disclosure" },
  { id: "shell", label: "Shell nav" },
  { id: "dropdowns", label: "Dropdowns" },
] as const;

const BUTTON_VARIANTS = ["primary", "secondary", "outlined", "ghost"] as const;
const BUTTON_TONES = ["default", "success", "error"] as const;
const BUTTON_SIZES = ["xs", "sm", "md", "lg", "xl"] as const;
const INPUT_VARIANTS = ["primary", "secondary"] as const;
const FIELD_SIZES = ["xs", "sm", "md", "lg", "xl"] as const;
const INPUT_STATES = ["default", "hover", "focus", "disabled", "readonly"] as const;
const INPUT_FEEDBACK = ["neutral", "error", "success"] as const;
const STATUS_MARKER_EXAMPLES = [
  { label: "Completed", tone: "success", icon: "check" },
  { label: "Partial", tone: "warning", icon: "minus" },
  { label: "Skipped", tone: "destructive", icon: "close" },
  { label: "Neutral", tone: "muted", icon: "minus" },
] as const;

const FEEDBACK_MARKER_EXAMPLES = [
  { label: "Evidence", state: "evidence_attached" },
  { label: "Feedback", state: "feedback_ready" },
] as const;

const CALENDAR_TYPE_EXAMPLES: ReadonlyArray<{
  label: string;
  glyph: WorkoutGlyphKind;
  family: "easy" | "long" | "quality" | "rest";
  color: string;
}> = [
  { label: "Easy", glyph: "easy", family: "easy", color: "var(--easy)" },
  { label: "Recovery", glyph: "recovery", family: "easy", color: "var(--easy)" },
  { label: "Long", glyph: "long", family: "long", color: "var(--long)" },
  { label: "Tempo", glyph: "tempo", family: "quality", color: "var(--quality)" },
  { label: "Intervals", glyph: "intervals", family: "quality", color: "var(--quality)" },
  { label: "Progression", glyph: "progression", family: "quality", color: "var(--quality)" },
  { label: "Race", glyph: "race", family: "quality", color: "var(--quality)" },
  { label: "Quality", glyph: "quality", family: "quality", color: "var(--quality)" },
  { label: "Rest", glyph: "rest", family: "rest", color: "var(--rest)" },
] as const;

const RAW_COLOR_PRIMITIVES = [
  { name: "stone-950", value: "var(--stone-950)", use: "Sidebar and deepest chrome" },
  { name: "stone-900", value: "var(--stone-900)", use: "Page canvas" },
  { name: "stone-850", value: "var(--stone-850)", use: "Base surface" },
  { name: "stone-800", value: "var(--stone-800)", use: "Elevated or muted surface" },
  { name: "stone-700", value: "var(--stone-700)", use: "Accent wash foundation" },
  { name: "sand-100", value: "var(--sand-100)", use: "Primary text" },
  { name: "sand-500", value: "var(--sand-500)", use: "Muted text" },
  { name: "amber-500", value: "var(--amber-500)", use: "Signal accent" },
  { name: "blue-500", value: "var(--blue-500)", use: "Easy workout family" },
  { name: "terracotta-500", value: "var(--terracotta-500)", use: "Quality workout family" },
  { name: "green-500", value: "var(--green-500)", use: "Success tone" },
  { name: "orange-500", value: "var(--orange-500)", use: "Warning tone" },
  { name: "red-500", value: "var(--red-500)", use: "Error/destructive tone" },
] as const;

const SEMANTIC_COLOR_TOKENS = [
  { name: "background", value: "var(--background)", mapsTo: "stone-900" },
  { name: "foreground", value: "var(--foreground)", mapsTo: "sand-100" },
  { name: "surface", value: "var(--surface)", mapsTo: "stone-850" },
  { name: "surface-elevated", value: "var(--surface-elevated)", mapsTo: "stone-800" },
  { name: "hairline", value: "var(--hairline)", mapsTo: "sand-alpha-06" },
  { name: "muted", value: "var(--muted)", mapsTo: "stone-800" },
  { name: "muted-foreground", value: "var(--muted-foreground)", mapsTo: "sand-500" },
  { name: "accent", value: "var(--accent)", mapsTo: "stone-700" },
  { name: "signal", value: "var(--signal)", mapsTo: "amber-500" },
  { name: "success", value: "var(--success)", mapsTo: "green-500" },
  { name: "warn", value: "var(--warn)", mapsTo: "orange-500" },
  { name: "destructive", value: "var(--destructive)", mapsTo: "red-500" },
  { name: "easy", value: "var(--easy)", mapsTo: "blue-500" },
  { name: "long", value: "var(--long)", mapsTo: "signal" },
  { name: "quality", value: "var(--quality)", mapsTo: "terracotta-500" },
  { name: "rest", value: "var(--rest)", mapsTo: "stone-500" },
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
type AsyncToastDemoState = "info" | "working" | "success" | "error";

const HITO_DS_TOAST_ID = "hito-ds-async-action-toast";
const TYPOGRAPHY_ROLES = [
  {
    role: "Display",
    className: "hito-display-title",
    sample: "A running plan that stays honest.",
    use: "Rare editorial emphasis for auth or top-tier entry moments.",
    spec: "Fraunces · clamp(3.5rem, 7vw, 5rem) · 400 · -0.02em · lh 1",
  },
  {
    role: "Page title",
    className: "hito-page-title",
    sample: "Profile details that follow your training.",
    use: "Top-level route title or major state heading.",
    spec: "Fraunces · clamp(3rem, 6vw, 4.5rem) · 400 · -0.02em · lh 1",
  },
  {
    role: "Modal title",
    className: "hito-modal-title",
    sample: "Open plan",
    use: "Primary heading inside bounded product dialogs.",
    spec: "Fraunces · 1.75-2rem · 400 · -0.02em · lh 1.1",
  },
  {
    role: "Section title",
    className: "hito-section-title",
    sample: "Body data",
    use: "Section-level orientation within an open surface.",
    spec: "Fraunces · 1.5rem · 400 · -0.02em · lh 1.15",
  },
  {
    role: "Panel title",
    className: "hito-panel-title",
    sample: "Plan vs run",
    use: "Compact internal panels, review modules, and feedback sections.",
    spec: "Fraunces · 1.25-1.375rem · 400 · -0.015em · lh 1.18",
  },
  {
    role: "Body",
    className: "hito-body",
    sample: "This compares the planned workout with the uploaded run.",
    use: "Default readable paragraph for page, modal, and section support.",
    spec: "Poppins · 0.875rem · 400 · lh 1.58",
  },
  {
    role: "Body small",
    className: "hito-body-small",
    sample: "Saved workout history stays preserved.",
    use: "Dense secondary explanations, row support, and metadata.",
    spec: "Poppins · 0.8125rem · 400 · lh 1.5",
  },
  {
    role: "Helper",
    className: "hito-field-helper",
    sample: "Nothing changes until you choose Apply update.",
    use: "Field-adjacent or control-adjacent operational guidance.",
    spec: "Poppins · 0.75rem · 400 · lh 1.45",
  },
  {
    role: "Caption",
    className: "hito-caption",
    sample: "Extracted activity: morning-run.fit",
    use: "Tertiary detail, legends, tiny footnotes, and timestamps.",
    spec: "Poppins · 0.6875rem · 400 · lh 1.45",
  },
  {
    role: "Label",
    className: "hito-label",
    sample: "Current plan",
    use: "Micro orientation, never a substitute for a heading.",
    spec: "Poppins · 0.6875rem · 500 · 0.18em · uppercase",
  },
  {
    role: "Form label",
    className: "hito-form-label",
    sample: "Start training",
    use: "Explicit ownership label for fields and controls.",
    spec: "Poppins · 0.6875rem · 500 · 0.18em · uppercase",
  },
  {
    role: "Micro label",
    className: "hito-micro-label",
    sample: "Saved mode",
    use: "Tiny uppercase shell/menu labels and compact chrome metadata.",
    spec: "Poppins · 0.6875rem · 500 · 0.18em · uppercase · lh 1.2",
  },
  {
    role: "Button",
    className: "hito-button hito-button-secondary hito-button-sm",
    sample: "Generate proposal",
    use: "Action text tuned by shared Hito button size tiers.",
    spec: "Poppins · tiered 0.6875-0.9375rem · 500 · lh 1",
  },
  {
    role: "Nav / menu",
    className: "hito-menu-text",
    sample: "User settings",
    use: "Shell navigation, dropdown rows, and utility menu text.",
    spec: "Poppins · 0.8125-0.875rem · 500 · lh 1-1.3",
  },
  {
    role: "Metric",
    className: "hito-metric-value",
    sample: "42.2 km",
    use: "Measured truth: distance, duration, pace, counts, and dates.",
    spec: "JetBrains Mono · 1rem · 500 · tabular · lh 1.1",
  },
  {
    role: "Status",
    className: "hito-status-pill",
    sample: "Ready",
    use: "Semantic state identifier, never a heading.",
    spec: "Poppins · 0.625rem · 500 · 0.12em · uppercase",
  },
  {
    role: "Error / success",
    className: "hito-field-success",
    sample: "User settings saved.",
    use: "Bounded action feedback near the relevant control family.",
    spec: "Poppins · 0.875rem · 500 · lh 1.45",
  },
  {
    role: "Technical mono",
    className: "hito-technical-mono",
    sample: '{"schema_version":"training-plan-v2"}',
    use: "JSON, identifiers, file metadata, timestamps, and fixed-format facts.",
    spec: "JetBrains Mono · 0.75rem · 400 · tabular · lh 1.45",
  },
] as const;

function HitoDesignSystemPage() {
  const [variant, setVariant] = useState<ButtonVariant>("primary");
  const [buttonTone, setButtonTone] = useState<ButtonTone>("default");
  const [size, setSize] = useState<ButtonSize>("lg");
  const [leftIcon, setLeftIcon] = useState(true);
  const [rightIcon, setRightIcon] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [inputVariant, setInputVariant] = useState<InputVariant>("primary");
  const [inputSize, setInputSize] = useState<ButtonSize>("md");
  const [inputLeftIcon, setInputLeftIcon] = useState(true);
  const [inputRightIcon, setInputRightIcon] = useState(false);
  const [inputState, setInputState] = useState<InputState>("default");
  const [inputFeedback, setInputFeedback] = useState<InputFeedback>("neutral");
  const [toastDemoState, setToastDemoState] = useState<AsyncToastDemoState>("working");
  const toastDemoTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      clearToastDemoTimer(toastDemoTimerRef);
      hitoToast.dismiss(HITO_DS_TOAST_ID);
    };
  }, []);

  const showDemoToast = (state: AsyncToastDemoState) => {
    clearToastDemoTimer(toastDemoTimerRef);
    setToastDemoState(state);
    showHitoToastDemo(state);
  };

  const showDemoSequence = (outcome: "success" | "error") => {
    clearToastDemoTimer(toastDemoTimerRef);
    setToastDemoState("working");
    hitoToast.working({
      id: HITO_DS_TOAST_ID,
      title: "Preparing update",
      description: "Working state is visible, dismissible, and indeterminate.",
    });

    if (typeof window === "undefined") {
      return;
    }

    toastDemoTimerRef.current = window.setTimeout(() => {
      setToastDemoState(outcome);

      if (outcome === "success") {
        hitoToast.success({
          id: HITO_DS_TOAST_ID,
          title: "Update ready",
          description: "The same toast resolved into a success state.",
        });
        return;
      }

      hitoToast.error({
        id: HITO_DS_TOAST_ID,
        title: "Update not applied",
        description: "The same toast resolved into a bounded error state.",
      });
    }, 900);
  };

  return (
    <div className="min-h-screen bg-background text-foreground canvas-grain">
      <div className="grid min-h-screen lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="border-r border-hairline bg-sidebar/70 px-5 py-6 backdrop-blur lg:sticky lg:top-0 lg:h-screen">
          <div>
            <div className="hito-panel-title">hito ds</div>
            <p className="hito-label mt-2">Component system</p>
          </div>

          <nav className="mt-10 grid gap-1">
            {SECTIONS.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="hito-nav-text rounded-md px-3 py-2 transition-colors hover:bg-accent/45 hover:text-foreground"
              >
                {section.label}
              </a>
            ))}
          </nav>

          <div className="mt-10 border-t border-hairline pt-5">
            <p className="hito-label hito-label-signal">Rule</p>
            <p className="hito-list-row-copy">
              This page follows the live product: open rhythm first, cards only when they earn it.
            </p>
          </div>
        </aside>

        <main className="px-6 py-8 lg:px-10 lg:py-10">
          <div className="mx-auto max-w-6xl">
            <header id="overview" className="hito-page-header border-t border-hairline pt-8">
              <p className="hito-label hito-label-signal">Hito design system</p>
              <h1 className="hito-page-title">Simplified product language.</h1>
              <p className="hito-page-copy max-w-2xl">
                A compact reference for the simplified Hito product language: open route rhythm,
                divider-based grouping, restrained markers, quiet support copy, and explicit
                utility/disclosure treatment for secondary paths.
              </p>
            </header>

            <div className="hito-reference-list mt-8" aria-label="Reference surface principles">
              <ReferenceRow
                title="Open rhythm first"
                body="Reference copy, role notes, and implementation guidance should usually sit on the page without a card shell."
              />
              <ReferenceRow
                title="Rows before boxes"
                body="Use dividers and grouped rows for facts, metadata, and guidance before reaching for bordered surfaces."
              />
              <ReferenceRow
                title="Cards only when they earn it"
                body="Reserve framed surfaces for actual component specimens, payload-like examples, or shells whose border is part of the contract."
              />
            </div>

            <section id="brand" className="ds-section">
              <SectionIntro
                label="Brand"
                title="The Hito wordmark is a primitive, not an icon."
                body="Use the HitoLogo primitive for true brand placements. It inherits currentColor, sizes through logo CSS variables, and keeps product variants like Admin or DS as separate text."
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
                </div>

                <div className="hito-reference-list">
                  <ReferenceListRow
                    label="Use"
                    title="Brand identity only"
                    body="Use HitoLogo for linked shell brands, auth hero branding, and public brand moments. Do not add it to the generic Icon registry."
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

            <section id="foundations" className="ds-section">
              <SectionIntro
                label="Foundations"
                title="Raw primitives before product semantics."
                body="Hito now names the first layer of color and spacing so product surfaces can compose from semantic tokens instead of re-inventing local values."
              />

              <div className="grid gap-8">
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <div className="grid gap-4">
                    <div>
                      <p className="hito-label">Raw color primitives</p>
                      <p className="hito-body-small mt-2 max-w-2xl">
                        Primitive names can describe appearance. Use them to map semantic tokens,
                        not directly in product UI unless a DS primitive specimen needs them.
                      </p>
                    </div>
                    <div className="hito-reference-list">
                      {RAW_COLOR_PRIMITIVES.map((token) => (
                        <ColorSwatchRow
                          key={token.name}
                          name={token.name}
                          value={token.value}
                          meta={token.use}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div>
                      <p className="hito-label">Semantic color tokens</p>
                      <p className="hito-body-small mt-2 max-w-2xl">
                        Product code should prefer semantic tokens. This keeps signal, feedback,
                        surfaces, and workout color meaning stable across screens.
                      </p>
                    </div>
                    <div className="hito-reference-list">
                      {SEMANTIC_COLOR_TOKENS.map((token) => (
                        <ColorSwatchRow
                          key={token.name}
                          name={token.name}
                          value={token.value}
                          meta={`maps to ${token.mapsTo}`}
                        />
                      ))}
                    </div>
                  </div>
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
                    body="Easy, long, quality, and rest colors support calendar and workout-type meaning. They should not replace button tones."
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
                      section headings, and tiny metadata text when caption or micro-label already
                      fits.
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
                    operational UI, labels, body, actions, navigation, and feedback. JetBrains Mono
                    owns measured or fixed-format truth only.
                  </p>
                </div>

                <div className="hito-reference-list">
                  {TYPOGRAPHY_ROLES.map((role) => (
                    <TypographyRoleCard key={role.role} role={role} />
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
                title="One Hito registry, lucide underneath."
                body="Product surfaces use the Hito Icon primitive and stable product names. Raw SVG folders are not a design-system source of truth."
              />

              <div className="grid gap-5">
                <div className="hito-reference-note">
                  <p className="hito-label">Canonical sizing</p>
                  <p className="hito-body-small mt-2 max-w-3xl">
                    Icons use four sizes only: xs 14, sm 16, md 20, and lg 24. Small icons use a
                    1.75 stroke by default; medium and large icons use 1.5.
                  </p>
                </div>

                <div className="hito-reference-list">
                  {HITO_ICON_META.map((icon) => (
                    <IconSpecimen key={icon.name} icon={icon} />
                  ))}
                </div>

                <div className="hito-surface-flat grid gap-4 p-5 lg:grid-cols-5">
                  <IconUsageCard label="Button">
                    <button
                      type="button"
                      className="hito-button hito-button-secondary hito-button-sm"
                    >
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

            <section id="buttons" className="ds-section">
              <SectionIntro
                label="Buttons"
                title="Variants, sizes, icons, disabled state."
                body="Use the builder to check CTA hierarchy and icon rhythm across the canonical button system."
              />

              <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
                <div className="hito-row-group self-start">
                  <ToggleRow
                    label="Left icon"
                    active={leftIcon}
                    onToggle={() => setLeftIcon((v) => !v)}
                  />
                  <ToggleRow
                    label="Right icon"
                    active={rightIcon}
                    onToggle={() => setRightIcon((v) => !v)}
                  />
                  <ToggleRow
                    label="Disabled"
                    active={disabled}
                    onToggle={() => setDisabled((v) => !v)}
                  />
                  <div className="hito-list-row items-start">
                    <div className="w-full">
                      <p className="hito-label">Variant</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {BUTTON_VARIANTS.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setVariant(item)}
                            data-active={variant === item}
                            className="hito-tab capitalize"
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="hito-list-row items-start">
                    <div className="w-full">
                      <p className="hito-label">Tone</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {BUTTON_TONES.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setButtonTone(item)}
                            data-active={buttonTone === item}
                            className="hito-tab capitalize"
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="hito-list-row items-start">
                    <div className="w-full">
                      <p className="hito-label">Size</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {BUTTON_SIZES.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setSize(item)}
                            data-active={size === item}
                            className="hito-tab uppercase"
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="hito-surface-flat p-5">
                  <p className="hito-label">Current button</p>
                  <div className="mt-5 flex flex-wrap items-center gap-4">
                    <DemoButton
                      variant={variant}
                      tone={buttonTone}
                      size={size}
                      leftIcon={leftIcon}
                      rightIcon={rightIcon}
                      disabled={disabled}
                    />
                    <span className="hito-caption">
                      {variant} / {buttonTone} / {size} / {disabled ? "disabled" : "enabled"}
                    </span>
                  </div>
                  <div className="mt-6 border-t border-hairline pt-5">
                    <p className="hito-label">Hierarchy × tone</p>
                    <div className="mt-4 grid gap-3">
                      {BUTTON_TONES.map((tone) => (
                        <div key={tone} className="flex flex-wrap items-center gap-3">
                          <span className="hito-micro-label w-16">{tone}</span>
                          {BUTTON_VARIANTS.map((item) => (
                            <DemoButton
                              key={`${tone}-${item}`}
                              variant={item}
                              tone={tone}
                              size="sm"
                              leftIcon={false}
                              rightIcon={false}
                              disabled={false}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                    <p className="hito-caption mt-3 max-w-2xl">
                      Default primary stays signal/orange. Secondary stays soft and borderless.
                      Outlined stays border-led. Success and error are semantic tones, not separate
                      button families.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-hairline pt-5">
                <p className="hito-caption max-w-2xl">
                  The interactive builder is the source of truth for button variants. Avoid
                  repeating every size and variant as a permanent production reference unless a
                  route needs that exact QA matrix.
                </p>
              </div>
            </section>

            <section id="tabs" className="ds-section">
              <SectionIntro
                label="Tabs"
                title="Simple and enclosed mode switches."
                body="Tabs organize nearby views without becoming another card system. Use simple tabs for calm page-level switches and enclosed tabs when a local control cluster needs a stronger boundary."
              />

              <div className="hito-reference-list">
                <article className="hito-reference-row">
                  <div className="min-w-0">
                    <p className="hito-label">Simple</p>
                    <p className="hito-caption mt-2 max-w-xl">
                      Transparent list, active underline, no filled active background. Best for
                      setup modes and calm page sections.
                    </p>
                  </div>
                  <div className="min-w-0 overflow-x-auto pb-1">
                    <div
                      className="hito-tabs hito-tabs-simple"
                      role="tablist"
                      aria-label="Simple tab example"
                    >
                      <button
                        type="button"
                        className="hito-tab"
                        data-active="true"
                        aria-selected="true"
                      >
                        Quick setup
                      </button>
                      <button type="button" className="hito-tab" aria-selected="false">
                        <span>Talk it through</span>
                        <span className="hito-tab-badge" data-variant="text">
                          Pro
                        </span>
                      </button>
                      <button type="button" className="hito-tab" disabled aria-selected="false">
                        Archived
                      </button>
                    </div>
                  </div>
                </article>

                <article className="hito-reference-row">
                  <div className="min-w-0">
                    <p className="hito-label">Enclosed</p>
                    <p className="hito-caption mt-2 max-w-xl">
                      Rounded bounded container, active soft fill, no underline. Use for stronger
                      local mode switches without nesting a card inside a card.
                    </p>
                  </div>
                  <div className="min-w-0 overflow-x-auto pb-1">
                    <div
                      className="hito-tabs hito-tabs-enclosed"
                      role="tablist"
                      aria-label="Enclosed tab example"
                    >
                      <button
                        type="button"
                        className="hito-tab"
                        data-active="true"
                        aria-selected="true"
                      >
                        <Icon name="calendar" size="sm" className="hito-tab-icon" />
                        Plan
                      </button>
                      <button type="button" className="hito-tab" aria-selected="false">
                        <Icon name="progress" size="sm" className="hito-tab-icon" />
                        Progress
                        <span className="hito-tab-badge" data-variant="count">
                          3
                        </span>
                      </button>
                      <button type="button" className="hito-tab" aria-selected="false">
                        Updates
                        <span className="hito-tab-dot" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </article>

                <article className="hito-reference-row">
                  <div className="min-w-0">
                    <p className="hito-label">States</p>
                    <p className="hito-caption mt-2 max-w-xl">
                      Hover and focus-visible stay distinct from the active underline. Badges are
                      supporting metadata, not tab labels.
                    </p>
                  </div>
                  <div className="min-w-0 overflow-x-auto pb-1">
                    <div
                      className="hito-tabs hito-tabs-simple"
                      role="tablist"
                      aria-label="Tab states example"
                    >
                      <button type="button" className="hito-tab" aria-selected="false">
                        Default
                      </button>
                      <button
                        type="button"
                        className="hito-tab"
                        data-demo-state="hover"
                        aria-selected="false"
                      >
                        Hover
                      </button>
                      <button
                        type="button"
                        className="hito-tab"
                        data-active="true"
                        aria-selected="true"
                      >
                        Active
                      </button>
                      <button
                        type="button"
                        className="hito-tab"
                        data-demo-state="focus"
                        aria-selected="false"
                      >
                        Focus
                      </button>
                      <button type="button" className="hito-tab" disabled aria-selected="false">
                        Disabled
                      </button>
                    </div>
                  </div>
                </article>
              </div>
            </section>

            <section id="data-table" className="ds-section">
              <SectionIntro
                label="Data table"
                title="Header controls keep sorting and filtering in context."
                body="Operational tables use one Hito header typography for sortable and non-sortable columns. Sort/filter state belongs in the header control, while static headers stay visually aligned without becoming clickable."
              />

              <div className="grid gap-5">
                <div className="hito-data-table-scroll">
                  <table className="hito-data-table min-w-[760px]">
                    <caption className="sr-only">Hito data-table header state examples.</caption>
                    <thead>
                      <tr>
                        <th scope="col" className="whitespace-nowrap px-2 py-2 font-medium">
                          <button
                            type="button"
                            className="hito-button hito-button-ghost hito-button-xs hito-data-table-header-button"
                          >
                            Default
                            <Icon
                              aria-hidden="true"
                              name="chevron-down"
                              size="xs"
                              className="hito-data-table-sort-indicator"
                            />
                          </button>
                        </th>
                        <th scope="col" className="whitespace-nowrap px-2 py-2 font-medium">
                          <button
                            type="button"
                            className="hito-button hito-button-ghost hito-button-xs hito-data-table-header-button"
                            data-demo-state="hover"
                          >
                            Hover
                            <Icon
                              aria-hidden="true"
                              name="chevron-down"
                              size="xs"
                              className="hito-data-table-sort-indicator"
                            />
                          </button>
                        </th>
                        <th
                          scope="col"
                          aria-sort="descending"
                          className="whitespace-nowrap px-2 py-2 font-medium"
                        >
                          <button
                            type="button"
                            className="hito-button hito-button-ghost hito-button-xs hito-data-table-header-button"
                            data-active="true"
                          >
                            Active sort
                            <Icon
                              aria-hidden="true"
                              name="chevron-down"
                              size="xs"
                              className="hito-data-table-sort-indicator"
                              data-active="true"
                            />
                          </button>
                        </th>
                        <th scope="col" className="whitespace-nowrap px-2 py-2 font-medium">
                          <button
                            type="button"
                            className="hito-button hito-button-ghost hito-button-xs hito-data-table-header-button"
                            data-active="true"
                          >
                            Filtered
                            <span className="hito-data-table-filter-dot" />
                            <Icon
                              aria-hidden="true"
                              name="chevron-down"
                              size="xs"
                              className="hito-data-table-sort-indicator"
                            />
                          </button>
                        </th>
                        <th scope="col" className="whitespace-nowrap px-2 py-2 font-medium">
                          <span
                            className="hito-data-table-header hito-data-table-header-static"
                            data-disabled="true"
                          >
                            Non-sortable
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="hito-data-table-cell hito-data-table-cell-start">
                          Header menu
                        </td>
                        <td className="hito-data-table-cell">Subtle wash</td>
                        <td className="hito-data-table-cell">Arrow active</td>
                        <td className="hito-data-table-cell">Circular filter dot</td>
                        <td className="hito-data-table-cell hito-data-table-cell-end">
                          Same label style
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="hito-reference-list">
                  <ReferenceListRow
                    label="Sortable"
                    title="Button inside th"
                    body="Sortable columns use a header button, aria-sort on the th when active, and a chevron affordance that stays secondary until sorted."
                  />
                  <ReferenceListRow
                    label="Filter"
                    title="Round state indicator"
                    body="Filtered columns show a small circular signal dot in the header control. Avoid square badges or route-local header indicators."
                  />
                  <ReferenceListRow
                    label="Static"
                    title="Same type, no affordance"
                    body="Non-sortable columns use the same header typography through hito-data-table-header, but they do not show arrows, menus, hover wash, or click behavior."
                  />
                </div>
              </div>
            </section>

            <section id="inputs" className="ds-section">
              <SectionIntro
                label="Inputs"
                title="Variants, states, icons, and button-matched rhythm."
                body="Text fields and buttons share size tiers. Primary fields keep the canonical bordered form behavior; secondary fields use a lower-chrome tinted surface."
              />

              <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
                <div className="hito-row-group self-start">
                  <ToggleRow
                    label="Left icon"
                    active={inputLeftIcon}
                    onToggle={() => setInputLeftIcon((v) => !v)}
                  />
                  <ToggleRow
                    label="Right icon"
                    active={inputRightIcon}
                    onToggle={() => setInputRightIcon((v) => !v)}
                  />
                  <div className="hito-list-row items-start">
                    <div className="w-full">
                      <p className="hito-label">Variant</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {INPUT_VARIANTS.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setInputVariant(item)}
                            data-active={inputVariant === item}
                            className="hito-tab capitalize"
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="hito-list-row items-start">
                    <div className="w-full">
                      <p className="hito-label">State</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {INPUT_STATES.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setInputState(item)}
                            data-active={inputState === item}
                            className="hito-tab capitalize"
                          >
                            {item === "focus" ? "Active" : item}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="hito-list-row items-start">
                    <div className="w-full">
                      <p className="hito-label">Feedback</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {INPUT_FEEDBACK.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setInputFeedback(item)}
                            data-active={inputFeedback === item}
                            className="hito-tab capitalize"
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="hito-list-row items-start">
                    <div className="w-full">
                      <p className="hito-label">Size</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {FIELD_SIZES.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setInputSize(item)}
                            data-active={inputSize === item}
                            className="hito-tab uppercase"
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-5">
                  <div className="hito-surface-flat p-5">
                    <p className="hito-label">Current input</p>
                    <div className="mt-5 grid gap-4">
                      <DemoInput
                        variant={inputVariant}
                        size={inputSize}
                        leftIcon={inputLeftIcon}
                        rightIcon={inputRightIcon}
                        state={inputState}
                        feedback={inputFeedback}
                        placeholder={`${inputVariant} ${inputSize} field`}
                      />
                      <span
                        className={
                          inputFeedback === "error"
                            ? "hito-field-error"
                            : inputFeedback === "success"
                              ? "hito-field-success"
                              : "hito-field-helper"
                        }
                      >
                        {inputFeedback === "error"
                          ? "Choose a valid value before continuing."
                          : inputFeedback === "success"
                            ? "This value is ready."
                            : "Helper text stays quiet unless validation needs attention."}
                      </span>
                      <div className="flex flex-wrap items-center gap-3">
                        <DemoButton
                          variant={inputVariant === "primary" ? "primary" : "secondary"}
                          size={inputSize}
                          leftIcon={inputLeftIcon}
                          rightIcon={inputRightIcon}
                          disabled={inputState === "disabled"}
                        />
                        <span className="hito-caption">
                          Same {inputSize.toUpperCase()} height and XS radius rhythm.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="hito-reference-list">
                    {INPUT_STATES.map((state) => (
                      <article key={state} className="hito-reference-row">
                        <div>
                          <p className="hito-label">{state === "focus" ? "Active" : state}</p>
                          <p className="hito-caption mt-2">
                            {state === "default"
                              ? "Default field state."
                              : state === "hover"
                                ? "Reference hover treatment."
                                : state === "focus"
                                  ? "Active or focus-visible treatment."
                                  : state === "readonly"
                                    ? "Read-only truth with field rhythm."
                                    : "Unavailable but still aligned."}
                          </p>
                        </div>
                        <DemoInput
                          variant={inputVariant}
                          size="sm"
                          leftIcon={inputLeftIcon}
                          rightIcon={inputRightIcon}
                          state={state}
                          feedback={inputFeedback}
                          placeholder={`${state} input`}
                        />
                      </article>
                    ))}
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="hito-label">Primary field</span>
                      <DemoInput
                        variant="primary"
                        size="md"
                        leftIcon
                        rightIcon={false}
                        placeholder="Bordered default"
                      />
                      <span className="hito-field-helper">
                        Canonical default for forms and persisted settings.
                      </span>
                    </label>
                    <label className="grid gap-2">
                      <span className="hito-label">Secondary field</span>
                      <DemoInput
                        variant="secondary"
                        size="md"
                        leftIcon
                        rightIcon={false}
                        placeholder="Subtle utility field"
                      />
                      <span className="hito-field-helper">
                        Lower-chrome tint without a strong border.
                      </span>
                    </label>
                    <label className="grid gap-2">
                      <span className="hito-label">Error feedback</span>
                      <DemoInput
                        variant="primary"
                        size="md"
                        leftIcon
                        rightIcon
                        feedback="error"
                        placeholder="Missing start date"
                      />
                      <span className="hito-field-error">
                        Choose a start date before importing.
                      </span>
                    </label>
                    <label className="grid gap-2">
                      <span className="hito-label">Success feedback</span>
                      <DemoInput
                        variant="secondary"
                        size="md"
                        leftIcon
                        rightIcon
                        feedback="success"
                        placeholder="runner@example.com"
                      />
                      <span className="hito-field-success">Saved profile value is valid.</span>
                    </label>
                    <label className="grid gap-2 lg:col-span-2">
                      <span className="hito-label">Textarea</span>
                      <textarea
                        rows={5}
                        className="hito-field hito-field-primary hito-textarea-md resize-none"
                        placeholder="Describe goal, constraints, recent results, or JSON notes."
                      />
                    </label>
                  </div>

                  <div className="border-t border-hairline pt-5">
                    <div className="mb-4">
                      <p className="hito-label">Editable value chip</p>
                      <p className="hito-caption mt-2 max-w-2xl">
                        Compact scalar facts use editable value chips, not full form cards or normal
                        text rows. Use for profile or settings values such as age, height, or
                        weight; avoid for long text and multi-step choices.
                      </p>
                    </div>
                    <div className="hito-reference-list">
                      <article className="hito-reference-row">
                        <div>
                          <p className="hito-list-row-title">Empty chip</p>
                          <p className="hito-caption mt-2">
                            Borderless by default, with a clear hover/focus backdrop.
                          </p>
                        </div>
                        <div className="hito-editable-value-chip-group">
                          <button
                            type="button"
                            className="hito-editable-value-chip"
                            data-state="empty"
                          >
                            <Icon name="plus" size="sm" className="hito-editable-value-chip-icon" />
                            <span className="hito-editable-value-chip-content">Age</span>
                          </button>
                          <button
                            type="button"
                            className="hito-editable-value-chip"
                            data-state="empty"
                          >
                            <Icon name="plus" size="sm" className="hito-editable-value-chip-icon" />
                            <span className="hito-editable-value-chip-content">Height</span>
                          </button>
                          <button
                            type="button"
                            className="hito-editable-value-chip"
                            data-state="empty"
                          >
                            <Icon name="plus" size="sm" className="hito-editable-value-chip-icon" />
                            <span className="hito-editable-value-chip-content">Weight</span>
                          </button>
                        </div>
                      </article>
                      <article className="hito-reference-row">
                        <div>
                          <p className="hito-list-row-title">Editing chip</p>
                          <p className="hito-caption mt-2">
                            The input is wider than the chip, stays the same height, and focuses in
                            place. Click-away discards unsaved text; only check commits.
                          </p>
                        </div>
                        <div className="hito-editable-value-chip-frame" data-state="editing">
                          <div className="hito-editable-value-chip-input-shell">
                            <input
                              id="ds-editable-weight"
                              value="72"
                              readOnly
                              className="hito-editable-value-chip-input"
                              aria-label="Weight"
                            />
                            <button
                              type="button"
                              className="hito-editable-value-chip-clear"
                              aria-label="Clear weight"
                            >
                              <Icon name="close" size="xs" />
                            </button>
                          </div>
                          <button
                            type="button"
                            className="hito-editable-value-chip-action"
                            data-action="save"
                            aria-label="Save weight"
                          >
                            <Icon name="check" size="sm" />
                          </button>
                        </div>
                      </article>
                      <article className="hito-reference-row">
                        <div>
                          <p className="hito-list-row-title">Invalid or empty edit</p>
                          <p className="hito-caption mt-2">
                            Until the value is valid, the external control stays as dismiss/cancel
                            and does not save profile truth.
                          </p>
                        </div>
                        <div className="hito-editable-value-chip-frame" data-state="editing">
                          <div className="hito-editable-value-chip-input-shell">
                            <input
                              id="ds-editable-empty-age"
                              value=""
                              readOnly
                              className="hito-editable-value-chip-input"
                              aria-label="Age"
                              placeholder="34"
                            />
                          </div>
                          <button
                            type="button"
                            className="hito-editable-value-chip-action"
                            data-action="cancel"
                            aria-label="Cancel age edit"
                          >
                            <Icon name="close" size="sm" />
                          </button>
                        </div>
                      </article>
                      <article className="hito-reference-row">
                        <div>
                          <p className="hito-list-row-title">Saved chip</p>
                          <p className="hito-caption mt-2">
                            Compact uppercase label plus value. Pencil stays subtle and appears on
                            hover/focus.
                          </p>
                        </div>
                        <div className="hito-editable-value-chip-group">
                          <button
                            type="button"
                            className="hito-editable-value-chip"
                            data-state="saved"
                          >
                            <span className="hito-editable-value-chip-content">
                              <span className="hito-editable-value-chip-label">Age</span>
                              <span className="hito-editable-value-chip-text">36</span>
                            </span>
                            <Icon
                              name="edit"
                              size="sm"
                              className="hito-editable-value-chip-icon hito-editable-value-chip-edit-icon"
                            />
                          </button>
                          <button
                            type="button"
                            className="hito-editable-value-chip"
                            data-state="saved"
                          >
                            <span className="hito-editable-value-chip-content">
                              <span className="hito-editable-value-chip-label">Weight</span>
                              <span className="hito-editable-value-chip-text">72 kg</span>
                            </span>
                            <Icon
                              name="edit"
                              size="sm"
                              className="hito-editable-value-chip-icon hito-editable-value-chip-edit-icon"
                            />
                          </button>
                        </div>
                      </article>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section id="selection-controls" className="ds-section">
              <SectionIntro
                label="Selection controls"
                title="Signal-selected, never browser-native."
                body="Checkboxes, radios, and toggle radios share Hito focus, disabled, invalid, and signal-selected states. Destructive confirmation uses warning copy and destructive buttons; the selected checkbox itself stays signal."
              />

              <div className="hito-reference-list">
                <article className="hito-reference-row">
                  <div>
                    <p className="hito-label">Checkbox</p>
                    <p className="hito-caption mt-2 max-w-xl">
                      Use when a choice can be independently on or off. Labels are the hit target:
                      SM rows are at least 32px high and MD rows are at least 40px high.
                    </p>
                  </div>
                  <div className="grid gap-3">
                    <label className="hito-control-label hito-control-label-sm">
                      <input type="checkbox" className="hito-checkbox hito-checkbox-sm" />
                      <span>SM checkbox</span>
                    </label>
                    <label className="hito-control-label hito-control-label-sm">
                      <input
                        type="checkbox"
                        className="hito-checkbox hito-checkbox-sm"
                        defaultChecked
                        data-state="checked"
                      />
                      <span>SM checked uses signal</span>
                    </label>
                    <label className="hito-control-label hito-control-label-md">
                      <input
                        type="checkbox"
                        className="hito-checkbox hito-checkbox-md"
                        defaultChecked
                        data-state="checked"
                      />
                      <span>MD checkbox with larger hit target</span>
                    </label>
                  </div>
                </article>

                <article className="hito-reference-row">
                  <div>
                    <p className="hito-label">Radio</p>
                    <p className="hito-caption mt-2 max-w-xl">
                      Use when one option must be selected from a small set. Keep labels plain and
                      keep focus-visible distinct from the selected dot.
                    </p>
                  </div>
                  <div className="grid gap-3" role="radiogroup" aria-label="Radio example">
                    <label className="hito-control-label hito-control-label-sm">
                      <input
                        type="radio"
                        name="ds-radio-sm"
                        className="hito-radio hito-radio-sm"
                        defaultChecked
                      />
                      <span>SM selected</span>
                    </label>
                    <label className="hito-control-label hito-control-label-sm">
                      <input type="radio" name="ds-radio-sm" className="hito-radio hito-radio-sm" />
                      <span>SM default</span>
                    </label>
                    <label className="hito-control-label hito-control-label-md">
                      <input
                        type="radio"
                        name="ds-radio-md"
                        className="hito-radio hito-radio-md"
                        defaultChecked
                      />
                      <span>MD selected</span>
                    </label>
                  </div>
                </article>

                <article className="hito-reference-row">
                  <div>
                    <p className="hito-label">Toggle radio</p>
                    <p className="hito-caption mt-2 max-w-xl">
                      Use for compact segmented option groups where the option surface is the label.
                      Do not convert ordinary chips or buttons unless the interaction is truly a
                      single-choice radio decision.
                    </p>
                  </div>
                  <div className="grid gap-4">
                    <div
                      className="hito-choice-toggle-group"
                      role="radiogroup"
                      aria-label="Small toggle radio example"
                    >
                      <button
                        type="button"
                        className="hito-choice-toggle hito-choice-toggle-sm"
                        role="radio"
                        aria-checked="true"
                      >
                        Easy
                      </button>
                      <button
                        type="button"
                        className="hito-choice-toggle hito-choice-toggle-sm"
                        role="radio"
                        aria-checked="false"
                      >
                        Balanced
                      </button>
                      <button
                        type="button"
                        className="hito-choice-toggle hito-choice-toggle-sm"
                        role="radio"
                        aria-checked="false"
                      >
                        Ambitious
                      </button>
                    </div>
                    <div
                      className="hito-choice-toggle-group"
                      role="radiogroup"
                      aria-label="Medium toggle radio example"
                    >
                      <button
                        type="button"
                        className="hito-choice-toggle hito-choice-toggle-md"
                        role="radio"
                        aria-checked="false"
                      >
                        Short
                      </button>
                      <button
                        type="button"
                        className="hito-choice-toggle hito-choice-toggle-md"
                        role="radio"
                        aria-checked="true"
                      >
                        Marathon
                      </button>
                    </div>
                  </div>
                </article>

                <article className="hito-reference-row">
                  <div>
                    <p className="hito-label">Disabled and invalid</p>
                    <p className="hito-caption mt-2 max-w-xl">
                      Disabled lowers contrast. Invalid uses the error ring, but selected state
                      still does not become destructive red.
                    </p>
                  </div>
                  <div className="grid gap-3">
                    <label className="hito-control-label hito-control-label-sm">
                      <input
                        type="checkbox"
                        className="hito-checkbox hito-checkbox-sm"
                        defaultChecked
                        data-state="checked"
                        disabled
                      />
                      <span>Disabled checked</span>
                    </label>
                    <label className="hito-control-label hito-control-label-sm">
                      <input
                        type="radio"
                        name="ds-radio-invalid"
                        className="hito-radio hito-radio-sm"
                        aria-invalid="true"
                      />
                      <span>Invalid radio</span>
                    </label>
                    <div className="hito-choice-toggle-group">
                      <button
                        type="button"
                        className="hito-choice-toggle hito-choice-toggle-sm"
                        role="radio"
                        aria-checked="true"
                        aria-invalid="true"
                      >
                        Invalid selected
                      </button>
                      <button
                        type="button"
                        className="hito-choice-toggle hito-choice-toggle-sm"
                        disabled
                      >
                        Disabled
                      </button>
                    </div>
                  </div>
                </article>

                <article className="hito-reference-row">
                  <div>
                    <p className="hito-label">Destructive confirmation</p>
                    <p className="hito-caption mt-2 max-w-xl">
                      The checkbox confirms understanding and stays signal-selected. Destructive
                      meaning belongs to the warning icon, explanatory copy, and final destructive
                      action.
                    </p>
                  </div>
                  <div className="grid max-w-xl gap-3">
                    <div className="flex items-start gap-3">
                      <Icon name="warning" size="sm" className="mt-1 text-destructive" />
                      <p className="hito-field-helper">
                        This archives the active plan and clears the active schedule view.
                      </p>
                    </div>
                    <label className="hito-control-label hito-control-label-sm">
                      <input
                        type="checkbox"
                        className="hito-checkbox hito-checkbox-sm"
                        defaultChecked
                        data-state="checked"
                      />
                      <span>I understand this keeps history archived.</span>
                    </label>
                    <button
                      type="button"
                      data-tone="error"
                      className="hito-button hito-button-outlined hito-button-sm justify-self-start"
                    >
                      Delete plan
                    </button>
                  </div>
                </article>
              </div>
            </section>

            <section id="surfaces" className="ds-section">
              <SectionIntro
                label="Composition"
                title="Open rhythm before containers."
                body="Route sections should breathe with spacing, section titles, and hairline dividers. Framed surfaces are reserved for stateful interaction or payload ownership."
              />
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
                <article className="border-t border-hairline pt-5">
                  <div className="hito-section-header">
                    <div>
                      <h3 className="hito-section-title">Section with no box.</h3>
                      <p className="hito-support-copy mt-2">
                        This is the default route cadence used by simplified home, progress, and
                        body surfaces.
                      </p>
                    </div>
                    <span className="hito-section-subtitle">Default</span>
                  </div>
                  <div className="mt-5 grid gap-0 border-t border-hairline">
                    <div className="flex items-center justify-between gap-4 border-b border-hairline py-3">
                      <span className="hito-list-row-title">Primary truth first</span>
                      <span className="hito-caption">Visible</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-b border-hairline py-3">
                      <span className="hito-list-row-title">Support after divider</span>
                      <span className="hito-caption">Quiet</span>
                    </div>
                  </div>
                </article>
                <article className="hito-surface-flat p-5">
                  <p className="hito-label">Use sparingly</p>
                  <h3 className="hito-panel-title mt-3">Owned payload.</h3>
                  <p className="hito-support-copy mt-3">
                    Keep a surface when it contains one active object, like an attached file, form,
                    or route-level state. Avoid stacking subcards inside it.
                  </p>
                </article>
              </div>
            </section>

            <section id="modals" className="ds-section">
              <SectionIntro
                label="Modals"
                title="Bounded panel, explicit body mode, reachable footer."
                body="Product dialogs share one stable overlay and panel recipe, then choose the body mode that matches the task. Short content fits naturally; tall workflows scroll internally."
              />

              <div className="grid gap-5">
                <div className="hito-row-group">
                  <ReferenceListRow
                    label="Body mode"
                    title="content-fit"
                    body="Use for short dialogs. The body does not stretch just to manufacture height, so the footer sits directly after the task content."
                  />
                  <ReferenceListRow
                    label="Body mode"
                    title="scroll-fill"
                    body="Use for long workflows. The bounded panel keeps the footer reachable while the middle region scrolls internally."
                  />
                  <ReferenceListRow
                    label="Safari stable"
                    title="Overlay and content state stay explicit"
                    body="Open dialogs remain visible in viewport; closed overlays become transparent and non-blocking."
                  />
                </div>

                <div className="grid items-start gap-5 xl:grid-cols-2">
                  <article className="hito-product-dialog hito-product-dialog-content-fit max-w-xl border border-hairline bg-background/95">
                    <header className="hito-product-dialog-header">
                      <p className="hito-label hito-label-signal">Content-fit body</p>
                      <h3 className="hito-modal-title mt-2">Short task modal</h3>
                      <p className="hito-body mt-2 max-w-lg">
                        Use this for compact workflows or reference examples. There is no dead zone
                        between content and footer.
                      </p>
                    </header>
                    <div className="hito-product-dialog-body-content-fit">
                      <div className="hito-row-group">
                        <div className="hito-list-row items-start">
                          <div>
                            <p className="hito-list-row-title">Natural body height</p>
                            <p className="hito-list-row-copy">
                              The middle region wraps the actual content instead of filling a tall
                              empty track.
                            </p>
                          </div>
                          <span className="hito-status-pill" data-tone="success">
                            Fit
                          </span>
                        </div>
                      </div>
                    </div>
                    <footer className="hito-product-dialog-footer">
                      <div className="hito-product-dialog-footer-row">
                        <button
                          type="button"
                          className="hito-button hito-button-secondary hito-button-md"
                        >
                          Close
                        </button>
                        <button
                          type="button"
                          className="hito-button hito-button-primary hito-button-md"
                        >
                          Continue
                        </button>
                      </div>
                    </footer>
                  </article>

                  <article className="hito-product-dialog hito-product-dialog-scroll-fill h-[min(34rem,calc(100dvh-2rem))] max-w-xl border border-hairline bg-background/95">
                    <header className="hito-product-dialog-header">
                      <div className="hito-product-dialog-header-row">
                        <div>
                          <p className="hito-label hito-label-signal">Scroll-fill body</p>
                          <h3 className="hito-modal-title mt-2">Tall workflow modal</h3>
                          <p className="hito-body mt-2 max-w-lg">
                            Use this for `Open plan`, body notes, and import states where content
                            can exceed the viewport.
                          </p>
                        </div>
                        <span className="hito-status-pill mt-1" data-tone="signal">
                          Stable
                        </span>
                      </div>
                    </header>
                    <div className="hito-product-dialog-body-scroll-fill">
                      <div className="grid gap-3">
                        {[
                          "Active object summary",
                          "Validation or proposal review",
                          "Form controls",
                          "Expert disclosure",
                          "Destructive exception",
                          "Preserved-history note",
                          "Secondary utility action",
                          "Backend-owned status copy",
                          "Long-form runner explanation",
                          "Final review reminder",
                        ].map((label) => (
                          <div
                            key={label}
                            className="hito-list-row rounded-xl border border-hairline"
                          >
                            <div>
                              <p className="hito-list-row-title">{label}</p>
                              <p className="hito-list-row-copy">
                                This row belongs inside the scrollable middle, not between body and
                                footer.
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <footer className="hito-product-dialog-footer">
                      <div className="hito-product-dialog-footer-row" data-align="split">
                        <p className="hito-product-dialog-footer-note">
                          Footer note stays short and tied to save/apply.
                        </p>
                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                          <button
                            type="button"
                            className="hito-button hito-button-secondary hito-button-md"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="hito-button hito-button-primary hito-button-md"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </footer>
                  </article>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="hito-row-group">
                    <ReferenceListRow
                      label="Header"
                      title="Simple task header"
                      body="Title plus short description. Current fit: Import plan and Body notes."
                    />
                    <ReferenceListRow
                      label="Header"
                      title="Labeled or metadata header"
                      body="One label, status pill, or compact utility action may orient the task without becoming a dashboard."
                    />
                    <ReferenceListRow
                      label="Header"
                      title="Complex lifecycle header"
                      body="Reserved for Open plan, where the dialog owns a current active-plan lifecycle object."
                    />
                  </div>
                  <div className="hito-row-group">
                    <ReferenceListRow
                      label="Footer"
                      title="Cancel + primary"
                      body="Default focused workflow footer. Primary action stays on the visual right."
                    />
                    <ReferenceListRow
                      label="Footer"
                      title="Note + actions"
                      body="Use one short tertiary note when save/apply needs bounded context, as in Body notes."
                    />
                    <ReferenceListRow
                      label="Footer"
                      title="Proposal pair"
                      body="Keep current plan and Apply update are explicit task-completion choices, never silent mutation."
                    />
                  </div>
                </div>
              </div>
            </section>

            <section id="async-actions" className="ds-section">
              <SectionIntro
                label="Async action toasts"
                title="Progress without taking over."
                body="Use this pattern for long-running actions where the runner needs global progress and a short outcome, while validation, proposal review, and stale explanations stay inline."
              />
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="hito-row-group">
                  <div className="hito-list-row items-start">
                    <div>
                      <p className="hito-list-row-title">DS toast variants</p>
                      <p className="hito-list-row-copy">
                        Use these controls to render the real top-center Hito toast primitive. The
                        dismiss control lives inside the toast anatomy, and the working variant is
                        dismiss-only without cancelling server work.
                      </p>
                    </div>
                    <span className="hito-status-pill" data-tone="signal">
                      Primitive
                    </span>
                  </div>
                  <div className="hito-list-row items-start">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="hito-button hito-button-secondary hito-button-sm"
                        onClick={() => showDemoToast("info")}
                      >
                        <Icon name="warning" size="sm" className="text-muted-foreground" />
                        Info
                      </button>
                      <button
                        type="button"
                        className="hito-button hito-button-secondary hito-button-sm"
                        onClick={() => showDemoToast("working")}
                      >
                        <Icon
                          name="loader"
                          size="sm"
                          className="animate-spin text-muted-foreground"
                        />
                        Working
                      </button>
                      <button
                        type="button"
                        className="hito-button hito-button-secondary hito-button-sm"
                        onClick={() => showDemoToast("success")}
                      >
                        <Icon name="check-circle" size="sm" className="text-success" />
                        Proposal ready
                      </button>
                      <button
                        type="button"
                        className="hito-button hito-button-secondary hito-button-sm"
                        onClick={() => showDemoToast("error")}
                      >
                        <Icon name="warning" size="sm" className="text-destructive" />
                        Error
                      </button>
                    </div>
                  </div>
                  <div className="hito-list-row items-start">
                    <div>
                      <p className="hito-list-row-title">Resolve in place</p>
                      <p className="hito-list-row-copy">
                        These demos start with a working toast, then replace that same action-family
                        toast id with success or error so older outcomes cannot mask the latest one.
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        className="hito-button hito-button-ghost hito-button-sm"
                        onClick={() => showDemoSequence("success")}
                      >
                        Working → success
                      </button>
                      <button
                        type="button"
                        className="hito-button hito-button-ghost hito-button-sm"
                        onClick={() => showDemoSequence("error")}
                      >
                        Working → error
                      </button>
                    </div>
                  </div>
                </div>

                <article className="hito-surface-flat p-5">
                  <p className="hito-label">Current demo state</p>
                  <h3 className="hito-panel-title mt-3">
                    {describeToastDemoState(toastDemoState).title}
                  </h3>
                  <p className="hito-support-copy mt-3">
                    {describeToastDemoState(toastDemoState).description}
                  </p>
                </article>
              </div>
              <div className="hito-row-group mt-5">
                <div className="hito-list-row items-start">
                  <div>
                    <p className="hito-list-row-title">V1 contract</p>
                    <p className="hito-list-row-copy">
                      Top-center, Safari-stable visible state, one active async toast, indeterminate
                      progress, dismiss only, no cancel, and no fake percentages.
                    </p>
                  </div>
                  <span className="hito-status-pill" data-tone="signal">
                    Bounded
                  </span>
                </div>
              </div>
            </section>

            <section id="states" className="ds-section">
              <SectionIntro
                label="States"
                title="Markers, state surfaces, tooltips, and severity."
                body="Use compact markers for status truth, one state-surface family for routes, one tooltip shell for chart-adjacent hints, and one scale pattern for body-note severity."
              />
              <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
                <div className="hito-row-group self-start">
                  {STATUS_MARKER_EXAMPLES.map(({ label, tone, icon }) => (
                    <div key={label} className="hito-list-row py-3">
                      <span className="hito-list-row-title">{label}</span>
                      <span className="hito-status-marker" data-tone={tone}>
                        <Icon name={icon} size="xs" strokeWidth={2.2} />
                      </span>
                    </div>
                  ))}
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <article className="hito-state-surface" data-tone="signal">
                    <p className="hito-label hito-label-signal">Setup state</p>
                    <h3 className="hito-section-title mt-3">Create a first plan.</h3>
                    <p className="hito-support-copy mt-3">
                      State surfaces keep route-level setup and empty states consistent.
                    </p>
                    <div className="hito-state-actions">
                      <button className="hito-button hito-button-primary hito-button-md">
                        Continue
                      </button>
                    </div>
                  </article>
                  <article className="hito-state-surface" data-tone="destructive">
                    <p className="hito-label text-destructive">Error state</p>
                    <h3 className="hito-section-title mt-3">Try again.</h3>
                    <p className="hito-support-copy mt-3">
                      Error tone is reserved for real load or save failures, not normal previews.
                    </p>
                    <div className="hito-state-actions">
                      <button className="hito-button hito-button-secondary hito-button-md">
                        Retry
                      </button>
                    </div>
                  </article>
                </div>
              </div>
              <div className="mt-5 grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
                <article className="hito-row-group">
                  <div className="hito-list-row items-start">
                    <div className="w-full">
                      <p className="hito-label">Severity scale</p>
                      <div className="hito-scale-control mt-3">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <button
                            key={level}
                            type="button"
                            className="hito-scale-button"
                            data-active={level <= 3}
                            data-level={level}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
                <article className="hito-row-group">
                  <div className="hito-list-row">
                    <div>
                      <p className="hito-list-row-title">L. Knee</p>
                      <p className="hito-list-row-copy">Compact severity summary row.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="hito-severity-bars" aria-label="Severity 3 of 5">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <span
                            key={level}
                            className="hito-severity-bar"
                            data-active={level <= 3}
                            data-level={level}
                          />
                        ))}
                      </div>
                      <span className="hito-caption font-mono-num">3</span>
                    </div>
                  </div>
                </article>
              </div>
              <div className="mt-5 grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
                <article className="hito-row-group">
                  <div className="hito-list-row items-start">
                    <div>
                      <p className="hito-label">Tooltip shell</p>
                      <p className="hito-list-row-copy">
                        Used for calendar and workout-structure hover context. Chart geometry stays
                        route-owned.
                      </p>
                    </div>
                  </div>
                </article>
                <div className="hito-tooltip">
                  <span className="flex items-center gap-2">
                    <span className="hito-tooltip-dot text-signal" />
                    <span className="hito-tooltip-title">Warm-up</span>
                  </span>
                  <span className="hito-tooltip-meta mt-1 block font-mono-num">10 min</span>
                  <span className="hito-tooltip-meta mt-1.5 block">
                    Short, scoped context only. No coaching wall.
                  </span>
                </div>
              </div>
              <div className="mt-5 grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
                <article className="hito-row-group">
                  {FEEDBACK_MARKER_EXAMPLES.map(({ label, state }) => (
                    <div key={state} className="hito-list-row py-3">
                      <span className="hito-list-row-title">{label}</span>
                      <span className="hito-feedback-marker" data-state={state}>
                        <span className="hito-feedback-marker-dot" />
                        <span>{label}</span>
                      </span>
                    </div>
                  ))}
                </article>
                <article className="hito-surface-flat p-5">
                  <p className="hito-label">Feedback markers</p>
                  <p className="hito-support-copy mt-3">
                    Secondary discovery only. Completion check, dash, and cross stay primary.
                  </p>
                </article>
              </div>
              <div className="mt-5 grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
                <article className="hito-row-group">
                  {CALENDAR_TYPE_EXAMPLES.map(({ label, glyph, family, color }) => (
                    <div key={label} className="hito-list-row py-3">
                      <span className="hito-label inline-flex items-center gap-2">
                        <WorkoutGlyph
                          kind={glyph}
                          className="hito-calendar-type-glyph"
                          style={{ color }}
                        />
                        <span style={{ color }}>{label}</span>
                      </span>
                      <span className="hito-caption">{family} color</span>
                    </div>
                  ))}
                </article>
                <article className="hito-surface-flat p-5">
                  <p className="hito-label">Calendar type identity</p>
                  <p className="hito-support-copy mt-3">
                    Month cells use distinct tiny glyphs for visible workout labels while preserving
                    the existing easy, long, quality, and rest color families. Distance, duration,
                    and target details stay in hover or workout detail.
                  </p>
                </article>
              </div>
            </section>

            <section id="analytics" className="ds-section">
              <SectionIntro
                label="Summary truth"
                title="Small summaries, not dashboards."
                body="Progress now leads with one compact saved-truth summary, then uses charts only when current data makes them useful."
              />
              <div className="hito-row-group">
                <div className="hito-list-row items-start lg:items-end">
                  <div className="max-w-md">
                    <h3 className="hito-section-title">Current summary</h3>
                    <p className="hito-support-copy mt-2">
                      One grouped row can carry the real aggregate truth without pretending to be a
                      mature analytics dashboard.
                    </p>
                  </div>
                  <div className="hito-metric-row w-full lg:max-w-xl">
                    <SummaryMetric label="Completed" value="4" unit="of 6" />
                    <SummaryMetric label="Volume" value="28" unit="km" />
                    <SummaryMetric label="Longest" value="8.4" unit="km" />
                  </div>
                </div>
              </div>
              <div className="mt-5 border-t border-hairline pt-5">
                <p className="hito-label">Compact legend</p>
                <div className="hito-legend mt-4">
                  <LegendDemoItem tone="actual" label="Actual" />
                  <LegendDemoItem tone="planned" label="Planned" />
                  <LegendDemoItem tone="completed" label="Done" />
                </div>
              </div>
              <div className="hito-row-group mt-5">
                <div className="hito-list-row items-start">
                  <div>
                    <p className="hito-label">Allowed geometry exceptions</p>
                    <p className="hito-list-row-copy">
                      Bars, plotted lines, interval block widths, SVG silhouettes, and marker
                      coordinates remain visualization geometry. Their labels, captions, legends,
                      rows, and tooltips use Hito primitives.
                    </p>
                  </div>
                  <span className="hito-caption">Exception</span>
                </div>
              </div>
            </section>

            <section id="rows" className="ds-section">
              <SectionIntro
                label="Rows & disclosure"
                title="Rows before boxes, disclosure before loud secondary actions."
                body="Rows carry support content and utilities. Expert or destructive paths should sit behind quieter disclosure unless they are the primary task."
              />
              <div className="hito-row-group">
                {[
                  ["Support row", "One title, one concise helper, optional status.", "Live"],
                  [
                    "Utility row",
                    "Secondary routes and tools stay reachable without becoming primary nav.",
                    "Utility",
                  ],
                  [
                    "Metric row",
                    "Value first, label second, no placeholder dash filler.",
                    "8.4 km",
                  ],
                ].map(([title, body, value]) => (
                  <div key={title} className="hito-list-row">
                    <div>
                      <p className="hito-list-row-title">{title}</p>
                      <p className="hito-list-row-copy">{body}</p>
                    </div>
                    <span
                      className={cn(
                        "hito-caption",
                        value === "8.4 km" && "font-mono-num text-foreground",
                        value === "Live" && "text-success",
                      )}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>
              <details className="hito-disclosure mt-5">
                <summary className="hito-disclosure-summary">
                  <span>
                    <span className="hito-list-row-title block">Destructive override</span>
                    <span className="hito-body-small block">
                      Available, but not a permanent sibling to the safe action.
                    </span>
                  </span>
                  <Icon name="chevron-down" className="hito-disclosure-chevron" />
                </summary>
                <div className="hito-disclosure-body">
                  <button className="hito-button hito-button-outlined hito-button-sm">
                    Replace today
                  </button>
                </div>
              </details>
            </section>

            <section id="shell" className="ds-section">
              <SectionIntro
                label="Shell navigation"
                title="Product shell rows are owned by Hito."
                body="Runner navigation, mobile navigation, profile trigger, and shell menu rows use one calm shell family instead of route-local spacing and hover rules."
              />
              <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
                <div className="hito-surface-flat p-4">
                  <div className="hito-shell-nav">
                    {[
                      { label: "Calendar", icon: "calendar", active: true },
                      { label: "Progress", icon: "progress", active: false },
                    ].map(({ label, icon, active }) => (
                      <div key={label} className="hito-shell-nav-row" data-active={active}>
                        <Icon name={icon as HitoIconName} className="hito-shell-nav-icon" />
                        <span>{label}</span>
                        {active && <span className="hito-shell-nav-dot" />}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid gap-4">
                  <button type="button" className="hito-shell-profile-trigger">
                    <span className="hito-shell-avatar-fallback h-9 w-9 rounded-full">IR</span>
                    <span className="min-w-0 flex-1">
                      <span className="hito-menu-text block truncate">Ivan</span>
                      <span className="hito-menu-meta block truncate">Half Marathon Plan</span>
                    </span>
                    <Icon name="chevron-down" size="sm" className="text-muted-foreground" />
                  </button>
                  <div className="hito-row-group">
                    <MenuRow icon="import" label="Advanced import" meta="Utility" />
                    <MenuRow icon="settings" label="User settings" meta="Utility" />
                    <MenuRow icon="connections" label="Connections status" meta="Utility" />
                  </div>
                </div>
              </div>
            </section>

            <section id="dropdowns" className="ds-section">
              <SectionIntro
                label="Dropdowns"
                title="Compact menu anatomy."
                body="Menu rows stay quiet: label first, shortcut/status second, destructive actions only when real."
              />
              <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
                <div className="hito-surface-flat p-4">
                  <button className="hito-button hito-button-secondary hito-button-md w-full justify-between">
                    Component menu
                    <Icon name="chevron-down" size="sm" />
                  </button>
                </div>
                <div className="hito-row-group">
                  <MenuRow icon="settings" label="User settings" meta="Utility" />
                  <MenuRow icon="connections" label="Connections status" meta="Utility" />
                  <MenuRow icon="import" label="Advanced import" meta="Utility" />
                  <MenuRow icon="download" label="Download template" meta="Secondary" />
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

function SectionIntro({ label, title, body }: { label: string; title: string; body: string }) {
  return (
    <div className="hito-section-header">
      <div>
        <p className="hito-label hito-label-signal">{label}</p>
        <h2 className="hito-section-title mt-3">{title}</h2>
        <p className="hito-support-copy mt-3 max-w-2xl">{body}</p>
      </div>
    </div>
  );
}

function ReferenceRow({ title, body }: { title: string; body: string }) {
  return (
    <article className="hito-reference-row">
      <h2 className="hito-panel-title">{title}</h2>
      <p className="hito-support-copy max-w-2xl">{body}</p>
    </article>
  );
}

function ReferenceListRow({ label, title, body }: { label: string; title: string; body: string }) {
  return (
    <div className="hito-list-row items-start">
      <div>
        <p className="hito-label">{label}</p>
        <p className="hito-list-row-title mt-2">{title}</p>
        <p className="hito-list-row-copy">{body}</p>
      </div>
    </div>
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

function ColorSwatchRow({ name, value, meta }: { name: string; value: string; meta: string }) {
  return (
    <article className="hito-reference-row">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="h-8 w-8 shrink-0 rounded-xl border border-hairline"
          style={{ background: value } satisfies CSSProperties}
        />
        <div className="min-w-0">
          <p className="hito-list-row-title">{name}</p>
          <p className="hito-caption mt-1">{meta}</p>
        </div>
      </div>
      <code className="hito-technical-mono">{value}</code>
    </article>
  );
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

function TypographyRoleCard({ role }: { role: (typeof TYPOGRAPHY_ROLES)[number] }) {
  return (
    <article className="hito-reference-row">
      <div>
        <p className="hito-label">{role.role}</p>
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

function IconSpecimen({ icon }: { icon: (typeof HITO_ICON_META)[number] }) {
  return (
    <article className="hito-reference-row">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="hito-list-row-title">{icon.name}</p>
          <p className="hito-caption mt-1">{icon.category}</p>
        </div>
        <span className="hito-status-pill" data-tone="neutral">
          {icon.label}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {(Object.keys(HITO_ICON_SIZES) as (keyof typeof HITO_ICON_SIZES)[]).map((size) => (
          <div key={size} className="grid place-items-center gap-2">
            <Icon name={icon.name} size={size} />
            <span className="hito-caption uppercase">{size}</span>
          </div>
        ))}
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

function SummaryMetric({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="hito-metric">
      <div className="flex items-baseline justify-center gap-1.5">
        <span className="hito-analytics-value">{value}</span>
        {unit && <span className="hito-analytics-unit">{unit}</span>}
      </div>
      <div className="hito-metric-label">{label}</div>
    </div>
  );
}

function showHitoToastDemo(state: AsyncToastDemoState) {
  if (state === "info") {
    hitoToast.info({
      id: HITO_DS_TOAST_ID,
      title: "Plan note",
      description: "Informational toast copy is calm, short, and non-destructive.",
    });
    return;
  }

  if (state === "working") {
    hitoToast.working({
      id: HITO_DS_TOAST_ID,
      title: "Preparing update",
      description: "Working copy is indeterminate and can be dismissed without cancelling work.",
    });
    return;
  }

  if (state === "success") {
    hitoToast.success({
      id: HITO_DS_TOAST_ID,
      title: "Update ready",
      description: "Success appears only after the action really completes.",
    });
    return;
  }

  hitoToast.error({
    id: HITO_DS_TOAST_ID,
    title: "Update not applied",
    description: "The proposal is no longer current. Generate a fresh proposal before applying.",
  });
}

function describeToastDemoState(state: AsyncToastDemoState) {
  if (state === "info") {
    return {
      title: "Info",
      description: "Neutral, non-destructive status for short global context.",
    };
  }

  if (state === "working") {
    return {
      title: "Working",
      description: "Working state is dismissible, indeterminate, and does not cancel the action.",
    };
  }

  if (state === "success") {
    return {
      title: "Proposal ready",
      description: "Success replaces the working toast when the server returns.",
    };
  }

  return {
    title: "Error",
    description: "Error replaces the working toast and keeps detailed recovery copy inline.",
  };
}

function clearToastDemoTimer(timerRef: React.MutableRefObject<number | null>) {
  if (timerRef.current == null || typeof window === "undefined") {
    timerRef.current = null;
    return;
  }

  window.clearTimeout(timerRef.current);
  timerRef.current = null;
}

function LegendDemoItem({
  tone,
  label,
}: {
  tone: "actual" | "planned" | "completed" | "partial" | "skipped";
  label: string;
}) {
  return (
    <span className="hito-legend-item">
      <span className="hito-legend-swatch" data-tone={tone} />
      {label}
    </span>
  );
}

function ToggleRow({
  label,
  active,
  onToggle,
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="hito-list-row">
      <span className="hito-list-row-title">{label}</span>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "hito-button hito-button-sm",
          active ? "hito-button-primary" : "hito-button-secondary",
        )}
      >
        {active ? "On" : "Off"}
      </button>
    </div>
  );
}

function DemoInput({
  variant,
  size,
  leftIcon,
  rightIcon,
  state = "default",
  feedback = "neutral",
  placeholder = "Search plans",
}: {
  variant: InputVariant;
  size: ButtonSize;
  leftIcon?: boolean;
  rightIcon?: boolean;
  state?: InputState;
  feedback?: InputFeedback;
  placeholder?: string;
}) {
  const simulatedState = state === "default" ? undefined : state;
  const iconSize = size === "xs" || size === "sm" ? "xs" : "sm";
  const feedbackClass =
    feedback === "error"
      ? "hito-field-feedback-error"
      : feedback === "success"
        ? "hito-field-feedback-success"
        : undefined;
  const feedbackTone =
    feedback === "error"
      ? "text-destructive"
      : feedback === "success"
        ? "text-success"
        : "text-muted-foreground";
  const rightIconName =
    feedback === "error"
      ? "warning"
      : feedback === "success" || state === "focus"
        ? "check"
        : "close";

  return (
    <div className="relative">
      {leftIcon ? (
        <Icon
          name="search"
          size={iconSize}
          className={cn(
            "pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2",
            feedbackTone,
          )}
        />
      ) : null}
      <input
        className={cn(
          "hito-field",
          `hito-field-${variant}`,
          `hito-field-${size}`,
          feedbackClass,
          leftIcon && "hito-field-has-left-icon",
          rightIcon && "hito-field-has-right-icon",
        )}
        data-demo-state={simulatedState}
        disabled={state === "disabled"}
        readOnly={state === "readonly"}
        aria-invalid={feedback === "error" ? true : undefined}
        aria-readonly={state === "readonly" ? true : undefined}
        placeholder={placeholder}
        value={state === "readonly" ? "runner@example.com" : undefined}
        onChange={() => undefined}
      />
      {rightIcon ? (
        <Icon
          name={rightIconName}
          size={iconSize}
          className={cn(
            "pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2",
            feedbackTone,
          )}
        />
      ) : null}
    </div>
  );
}

function DemoButton({
  variant,
  tone = "default",
  size,
  leftIcon,
  rightIcon,
  disabled = false,
}: {
  variant: ButtonVariant;
  tone?: ButtonTone;
  size: ButtonSize;
  leftIcon?: boolean;
  rightIcon?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "hito-button whitespace-nowrap capitalize",
        `hito-button-${variant}`,
        `hito-button-${size}`,
      )}
      data-tone={tone === "default" ? undefined : tone}
    >
      {leftIcon && <Icon name="circle" size="xs" />}
      {variant}
      {rightIcon && <Icon name="arrow-right" size="xs" />}
    </button>
  );
}

function MenuRow({ icon, label, meta }: { icon: HitoIconName; label: string; meta: string }) {
  return (
    <div className="hito-list-row py-3">
      <div className="flex items-center gap-3">
        <Icon name={icon} size="sm" className="text-muted-foreground" strokeWidth={1.6} />
        <span className="hito-list-row-title">{label}</span>
      </div>
      <span className="hito-caption">{meta}</span>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { APP_NAME } from "@/lib/app-config";
import loginDesertHorizon from "@/assets/marketing/hero-background/login-desert-horizon.jpg";
import {
  HitoDateField,
  HitoEditableDateChip,
  HitoMaskedTimeField,
} from "@/components/ui/hito-date-time-input";
import { HitoLogo, HitoLogoMark } from "@/components/ui/hito-logo";
import { hitoToast } from "@/components/ui/hito-toast";
import {
  HITO_ICON_META,
  HITO_ICON_SIZES,
  Icon,
  type HitoIconName,
  type HitoIconSize,
} from "@/components/ui/icon";
import { HitoMetadataTag } from "@/components/ui/metadata-tag";
import { CalendarWorkoutPlayground } from "@/components/hito-ds/calendar-workout-playground";
import { DropdownFamilyPlayground } from "@/components/hito-ds/dropdown-family-playground";
import { HitoDsPlayground } from "@/components/hito-ds/playground";
import {
  ProductLinks,
  ReferenceListRow,
  ReferenceRow,
  SectionIntro,
} from "@/components/hito-ds/reference";
import {
  ChoiceSelector,
  DataTableSpecimenPreview,
  DemoButton,
  DemoInput,
  MenuRow,
  ModalWindowPreview,
  SelectionControlPreview,
  ToggleRow,
} from "@/components/hito-ds/specimen-previews";
import { WorkoutLibraryPlayground } from "@/components/hito-ds/workout-library-playground";
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

export const HITO_DS_PAGE_ROUTES = {
  overview: "/hitoDS",
  foundations: "/hitoDS/foundations",
  components: "/hitoDS/components",
  patterns: "/hitoDS/patterns",
} as const;

const HITO_DS_PAGES = [
  {
    id: "overview",
    label: "Overview",
    path: HITO_DS_PAGE_ROUTES.overview,
    body: "Source hierarchy, reading guidance, Figma bridge, and known gaps.",
    sections: [{ id: "overview", label: "Start here" }],
  },
  {
    id: "foundations",
    label: "Foundations",
    path: HITO_DS_PAGE_ROUTES.foundations,
    body: "Brand, tokens, type, atmosphere, and icon foundations.",
    sections: [
      { id: "brand", label: "Brand" },
      { id: "foundations", label: "Tokens" },
      { id: "typography", label: "Typography" },
      { id: "gradient-overlays", label: "Gradients" },
      { id: "icons", label: "Icons" },
    ],
  },
  {
    id: "components",
    label: "Components",
    path: HITO_DS_PAGE_ROUTES.components,
    body: "Shared controls and primitives using the accepted Demo / Variants workbench.",
    sections: [
      { id: "buttons", label: "Buttons" },
      { id: "inputs", label: "Inputs" },
      { id: "tabs", label: "Tabs" },
      { id: "status", label: "Status" },
      { id: "selection-controls", label: "Selection" },
      { id: "modals", label: "Modals" },
      { id: "dropdowns", label: "Dropdowns" },
      { id: "calendar-workout-playground", label: "Calendar" },
      { id: "data-table", label: "Tables" },
      { id: "async-actions", label: "Async toasts" },
      { id: "rows", label: "Rows" },
      { id: "shell", label: "Shell nav" },
    ],
  },
  {
    id: "patterns",
    label: "Patterns",
    path: HITO_DS_PAGE_ROUTES.patterns,
    body: "Composed product patterns built from the component/foundation owners.",
    sections: [
      { id: "editorial-patterns", label: "Editorial" },
      { id: "surfaces", label: "Composition" },
      { id: "states", label: "States" },
      { id: "workout-library-playground", label: "Workout taxonomy" },
      { id: "analytics", label: "Summary truth" },
    ],
  },
] as const;

const SUPPORT_SECTIONS = [
  { id: "figma-bridge", label: "Figma export", pageId: "overview" },
  { id: "shared-wrappers", label: "Wrapper notes", pageId: "overview" },
  { id: "backlog", label: "Known gaps", pageId: "overview" },
] as const;

const SECTIONS = [
  ...HITO_DS_PAGES.flatMap((group) => group.sections),
  ...SUPPORT_SECTIONS.map(({ id, label }) => ({ id, label })),
];

export type HitoDsPageId = (typeof HITO_DS_PAGES)[number]["id"];
type SectionId = (typeof SECTIONS)[number]["id"];

const BUTTON_VARIANTS = ["primary", "secondary", "outlined", "ghost"] as const;
const BUTTON_TONES = ["default", "success", "error"] as const;
const BUTTON_SIZES = ["xs", "sm", "md", "lg", "xl"] as const;
const INPUT_VARIANTS = ["primary", "secondary"] as const;
const FIELD_SIZES = ["xs", "sm", "md", "lg", "xl"] as const;
const ICON_PREVIEW_SIZES = Object.keys(HITO_ICON_SIZES) as HitoIconSize[];
const INPUT_STATES = ["default", "hover", "focus", "disabled", "readonly"] as const;
const INPUT_FEEDBACK = ["neutral", "error", "success"] as const;
const CHOICE_TOGGLE_SIZES = ["xs", "sm", "md", "lg", "xl"] as const;
const SELECTION_CONTROL_KINDS = ["checkbox", "radio", "toggle"] as const;
const SELECTION_BINARY_SIZES = ["sm", "md"] as const;
const MODAL_SIZE_MODES = ["compact", "standard", "wide", "workflow", "review"] as const;
const MODAL_BODY_MODES = ["content-fit", "scroll-fill"] as const;
const MODAL_HEADER_MODES = ["compact", "large"] as const;
const MODAL_FOOTER_MODES = ["none", "actions", "note-actions"] as const;
const TAB_STYLES = ["simple", "enclosed"] as const;
const STATUS_TONES = ["neutral", "signal", "success", "warning", "destructive"] as const;
const DATA_TABLE_SORT_DIRECTIONS = ["asc", "desc"] as const;
const ROW_DENSITIES = ["standard", "compact"] as const;
const SHELL_CONTEXTS = ["runner", "admin"] as const;
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
  { label: "Steady", glyph: "steady", family: "easy", color: "var(--easy)" },
  { label: "Long", glyph: "long", family: "long", color: "var(--long)" },
  { label: "Tempo", glyph: "tempo", family: "quality", color: "var(--quality)" },
  { label: "Intervals", glyph: "intervals", family: "quality", color: "var(--quality)" },
  { label: "Progression", glyph: "progression", family: "quality", color: "var(--quality)" },
  { label: "Race", glyph: "race", family: "quality", color: "var(--quality)" },
  { label: "Hills", glyph: "hills", family: "quality", color: "var(--quality)" },
  { label: "Trail", glyph: "trail", family: "long", color: "var(--long)" },
  { label: "Quality", glyph: "quality", family: "quality", color: "var(--quality)" },
  { label: "Rest", glyph: "rest", family: "rest", color: "var(--rest)" },
] as const;

const COLOR_TABS = ["semantic", "primitive"] as const;

type ColorTab = (typeof COLOR_TABS)[number];

const RAW_COLOR_PRIMITIVES = [
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

const SEMANTIC_COLOR_TOKENS = [
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
  { name: "easy", value: "var(--easy)", mapsTo: "blue-500", group: "workout" },
  { name: "long", value: "var(--long)", mapsTo: "signal", group: "workout" },
  { name: "quality", value: "var(--quality)", mapsTo: "terracotta-500", group: "workout" },
  { name: "rest", value: "var(--rest)", mapsTo: "stone-500", group: "workout" },
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
    spec: "Poppins · 0.75rem · 600 · 0.01em · normal case · lh 1.25",
  },
  {
    role: "Form label",
    className: "hito-form-label",
    sample: "Start training",
    use: "Explicit ownership label for fields and controls.",
    spec: "Poppins · 0.75rem · 600 · 0.01em · normal case · lh 1.25",
  },
  {
    role: "Micro label",
    className: "hito-micro-label",
    sample: "Saved mode",
    use: "Tiny uppercase route chrome and compact status metadata, not ordinary shell labels.",
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
    spec: "Poppins · 0.625rem · 500 · normal case · rounded rectangle",
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
  return <HitoDesignSystemReferencePage pageId="overview" />;
}

export function HitoDesignSystemReferencePage({ pageId }: { pageId: HitoDsPageId }) {
  const [mobileJumpOpen, setMobileJumpOpen] = useState(false);
  const [variant, setVariant] = useState<ButtonVariant>("primary");
  const [buttonTone, setButtonTone] = useState<ButtonTone>("default");
  const [size, setSize] = useState<ButtonSize>("lg");
  const [leftIcon, setLeftIcon] = useState(true);
  const [rightIcon, setRightIcon] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [inputVariant, setInputVariant] = useState<InputVariant>("primary");
  const [inputSize, setInputSize] = useState<ButtonSize>("md");
  const [inputLeftIcon, setInputLeftIcon] = useState(true);
  const [inputRightIcon, setInputRightIcon] = useState(false);
  const [inputState, setInputState] = useState<InputState>("default");
  const [inputFeedback, setInputFeedback] = useState<InputFeedback>("neutral");
  const [dateFieldDemo, setDateFieldDemo] = useState("2026-12-11");
  const [editableDateDemo, setEditableDateDemo] = useState("");
  const [boundedDateDemo, setBoundedDateDemo] = useState("2026-05-29");
  const [timeFieldDemo, setTimeFieldDemo] = useState("3:50:00");
  const [colorTab, setColorTab] = useState<ColorTab>("semantic");
  const [iconPreviewSize, setIconPreviewSize] = useState<HitoIconSize>("md");
  const [tabStyle, setTabStyle] = useState<TabStyle>("simple");
  const [tabIcon, setTabIcon] = useState(true);
  const [tabBadge, setTabBadge] = useState(true);
  const [tabDot, setTabDot] = useState(true);
  const [tabDisabled, setTabDisabled] = useState(true);
  const [statusTone, setStatusTone] = useState<StatusTone>("signal");
  const [statusLongLabel, setStatusLongLabel] = useState(false);
  const [selectionKind, setSelectionKind] = useState<SelectionControlKind>("toggle");
  const [selectionSize, setSelectionSize] = useState<ChoiceToggleSize>("md");
  const [selectionSelected, setSelectionSelected] = useState(true);
  const [selectionDisabled, setSelectionDisabled] = useState(false);
  const [selectionInvalid, setSelectionInvalid] = useState(false);
  const [selectionFocusDemo, setSelectionFocusDemo] = useState(false);
  const [selectionAccentMode, setSelectionAccentMode] = useState(false);
  const [modalSizeMode, setModalSizeMode] = useState<ModalSizeMode>("standard");
  const [modalBodyMode, setModalBodyMode] = useState<ModalBodyMode>("content-fit");
  const [modalHeaderMode, setModalHeaderMode] = useState<ModalHeaderMode>("compact");
  const [modalFooterMode, setModalFooterMode] = useState<ModalFooterMode>("actions");
  const [modalStatusPill, setModalStatusPill] = useState(true);
  const [modalDestructive, setModalDestructive] = useState(false);
  const [modalLongContent, setModalLongContent] = useState(false);
  const [dataTableSortable, setDataTableSortable] = useState(true);
  const [dataTableActiveSort, setDataTableActiveSort] = useState(true);
  const [dataTableSortDirection, setDataTableSortDirection] =
    useState<DataTableSortDirection>("asc");
  const [dataTableFiltered, setDataTableFiltered] = useState(true);
  const [dataTableStaticMode, setDataTableStaticMode] = useState(false);
  const [dataTableUtilityRow, setDataTableUtilityRow] = useState(true);
  const [rowDensity, setRowDensity] = useState<RowDensity>("standard");
  const [rowIcon, setRowIcon] = useState(true);
  const [rowMeta, setRowMeta] = useState(true);
  const [rowDisclosure, setRowDisclosure] = useState(true);
  const [shellContext, setShellContext] = useState<ShellContext>("runner");
  const [shellProfileMeta, setShellProfileMeta] = useState(true);
  const [shellUtilityRows, setShellUtilityRows] = useState(true);
  const [toastDemoState, setToastDemoState] = useState<AsyncToastDemoState>("working");
  const toastDemoTimerRef = useRef<number | null>(null);
  const currentPage = getHitoDsPage(pageId);

  useEffect(() => {
    return () => {
      clearToastDemoTimer(toastDemoTimerRef);
      hitoToast.dismiss(HITO_DS_TOAST_ID);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const hashSection = getSectionIdFromHash(window.location.hash);
    const targetPage = hashSection ? getHitoDsPageForSection(hashSection) : null;

    if (targetPage && targetPage.id !== pageId) {
      window.location.replace(`${targetPage.path}#${hashSection}`);
    }
  }, [pageId]);

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

  const closeMobileJump = () => {
    setMobileJumpOpen(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground hito-canvas-atmosphere">
      <div className="hito-workbench-shell">
        <aside className="hito-workbench-sidebar px-5 py-6">
          <div>
            <div className="hito-panel-title">hito ds</div>
            <p className="hito-label mt-2">Component system</p>
          </div>

          <HitoDsNestedNav idPrefix="desktop" activePageId={pageId} />

          <div className="mt-10 border-t border-hairline pt-5">
            <p className="hito-label hito-label-signal">Rule</p>
            <p className="hito-list-row-copy">
              This page follows the live product: open rhythm first, cards only when they earn it.
            </p>
          </div>
        </aside>

        <main className="hito-workbench-main">
          <div className="hito-workbench-topbar lg:hidden">
            <div className="grid gap-3 px-5 py-4">
              <div className="flex min-w-0 items-center justify-between gap-4">
                <div className="hito-workbench-location">
                  <span className="hito-workbench-location-title">Hito DS</span>
                  <span className="hito-workbench-location-meta">
                    <span>Reference library</span>
                    <span aria-hidden="true">/</span>
                    <span>{currentPage.label}</span>
                  </span>
                </div>
                <HitoLogoMark decorative className="text-foreground [--hito-logo-height:1.65rem]" />
              </div>
              <button
                type="button"
                className="hito-button hito-button-secondary hito-button-sm hito-ds-jump-trigger"
                aria-expanded={mobileJumpOpen}
                aria-controls="hito-ds-mobile-jump-nav"
                onClick={() => setMobileJumpOpen((current) => !current)}
              >
                <span>Browse DS pages</span>
                <span className="hito-ds-jump-trigger-context">{currentPage.label}</span>
                <Icon name={mobileJumpOpen ? "chevron-up" : "chevron-down"} size="xs" decorative />
              </button>
            </div>
            <div
              id="hito-ds-mobile-jump-nav"
              className="hito-ds-mobile-jump-nav"
              hidden={!mobileJumpOpen}
            >
              <div className="hito-ds-mobile-jump-panel">
                <HitoDsNestedNav
                  idPrefix="mobile"
                  activePageId={pageId}
                  onNavigate={closeMobileJump}
                />
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10 lg:py-10">
            {pageId !== "overview" ? (
              <header className="hito-page-header border-t border-hairline pt-8">
                <p className="hito-label hito-label-signal">Hito design system</p>
                <h1 className="hito-page-title">{currentPage.label}.</h1>
                <p className="hito-page-copy max-w-2xl">{currentPage.body}</p>
              </header>
            ) : null}

            {pageId === "overview" ? (
              <>
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

                <div className="hito-reference-note mt-6">
                  <p className="hito-label hito-label-signal">How to use this workbench</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <ReferenceListRow
                      label="Foundations"
                      title="Start here for tokens"
                      body="Use this group when a surface needs color, type, spacing, radius, logo, icon, or overlay guidance."
                    />
                    <ReferenceListRow
                      label="Components"
                      title="Start here for primitives"
                      body="Use the preview + controls + contract specimens to inspect allowed component variants and states."
                    />
                    <ReferenceListRow
                      label="Patterns"
                      title="Start here for composed UI"
                      body="Use this group for editorial timelines, tables, shell nav, async states, analytics summaries, and disclosure rows."
                    />
                    <ReferenceListRow
                      label="Backlog"
                      title="Check what is intentionally local"
                      body="Use this group when a product surface looks custom and you need to know whether it is a DS gap or a route-owned exception."
                    />
                  </div>
                </div>
              </>
            ) : null}

            {pageId === "foundations" ? (
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
              </>
            ) : null}

            {pageId === "patterns" ? (
              <>
                <section id="editorial-patterns" className="ds-section">
                  <SectionIntro
                    label="Editorial patterns"
                    title="Changelog rhythm, promoted into the system."
                    body="These classes preserve the current public changelog look: compact serif date rails, warm text highlights with backdrop, text with editorial backdrop, glowing timeline dots, and calm inline code chips."
                  />

                  <div className="grid gap-8">
                    <div className="grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)]">
                      <div className="grid gap-4 rounded-2xl bg-foreground/[0.025] p-5">
                        <div className="grid grid-cols-[4.75rem_3.25rem_minmax(0,1fr)] items-baseline gap-4">
                          <span className="hito-timeline-year">2026</span>
                          <span className="hito-timeline-month">May</span>
                          <span className="hito-timeline-day">24</span>
                        </div>
                        <p className="hito-body-small text-muted-foreground">
                          Use year, month, and day roles for sticky editorial timeline rails. Layout
                          and sticky scope stay with the route.
                        </p>
                      </div>

                      <div className="grid gap-4">
                        <article
                          className="hito-editorial-backdrop hito-timeline-entry"
                          data-tone="highlight"
                        >
                          <div className="flex gap-3">
                            <span
                              aria-hidden="true"
                              className="hito-timeline-entry-dot"
                              data-tone="highlight"
                            />
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="hito-highlight-tag" data-tone="signal">
                                  New
                                </span>
                                <h3 className="hito-panel-title text-foreground">
                                  Editorial timeline family
                                </h3>
                              </div>
                              <p className="hito-body-small mt-2 leading-relaxed text-muted-foreground">
                                Timeline entries use a calm backdrop and preserve technical chips
                                like <code className="hito-inline-code">hito-inline-code</code>{" "}
                                inside readable release copy.
                              </p>
                            </div>
                          </div>
                        </article>

                        <article
                          className="hito-editorial-backdrop hito-timeline-entry"
                          data-tone="quiet"
                        >
                          <div className="flex gap-3">
                            <span
                              aria-hidden="true"
                              className="hito-timeline-entry-dot"
                              data-tone="quiet"
                            />
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="hito-highlight-tag" data-tone="neutral">
                                  Cleanup
                                </span>
                                <h3 className="hito-panel-title text-foreground">
                                  Behind the scenes
                                </h3>
                              </div>
                              <p className="hito-body-small mt-2 leading-relaxed text-muted-foreground">
                                Quiet entries stay legible without turning editorial history into
                                card soup.
                              </p>
                            </div>
                          </div>
                        </article>
                      </div>
                    </div>

                    <div className="hito-reference-list">
                      <ReferenceListRow
                        label="Use"
                        title="Release history and public editorial chronology"
                        body="Use these primitives for changelog-style history, milestone readbacks, and route-level editorial timelines."
                      />
                      <ReferenceListRow
                        label="Do not"
                        title="Do not replace product status chips"
                        body="Highlight tags are title-adjacent text highlights, not status chips. Operational state still belongs to status chips and state surfaces."
                      />
                      <ReferenceListRow
                        label="Scope"
                        title="Keep grid and sticky mechanics local"
                        body="The DS owns typography, backdrop, dots, tags, and inline code. Each route owns its own timeline grid, sticky rail scope, and content ordering."
                      />
                    </div>
                  </div>
                </section>
              </>
            ) : null}

            {pageId === "foundations" ? (
              <>
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
                          Use <code className="hito-inline-code">hito-canvas-atmosphere</code> for
                          large app canvases and internal reference pages, not nested cards.
                        </p>
                      </article>

                      <article className="auth-hero min-h-[14rem] overflow-hidden rounded-2xl border border-hairline">
                        <img
                          src={loginDesertHorizon}
                          alt=""
                          aria-hidden="true"
                          className="auth-hero-image"
                        />
                        <div className="hito-auth-photo-overlay" aria-hidden="true" />
                        <div className="auth-hero-content flex min-h-[14rem] items-end p-5">
                          <div>
                            <p className="hito-label hito-label-signal">Auth/photo overlay</p>
                            <h3 className="hito-panel-title mt-3">
                              Readable copy over atmosphere.
                            </h3>
                            <p className="hito-body-small mt-3 max-w-sm text-muted-foreground">
                              Use <code className="hito-inline-code">hito-auth-photo-overlay</code>{" "}
                              only where imagery needs a controlled readability layer.
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
                            Launcher cards can use alpha elevation and signal icon wash. Standard
                            cards, menus, and table cells should not inherit this treatment.
                          </p>
                        </div>
                      </article>

                      <article className="hito-surface-wash" data-tone="signal">
                        <p className="hito-label hito-label-signal">State-surface wash</p>
                        <h3 className="hito-panel-title mt-3">Setup, empty, or bounded state.</h3>
                        <p className="hito-body-small mt-3 text-muted-foreground">
                          Use <code className="hito-inline-code">hito-surface-wash</code> when the
                          whole surface is communicating a state, not for ordinary content cards.
                        </p>
                      </article>

                      <article className="hito-editorial-signal-wash hito-timeline-entry">
                        <p className="hito-label hito-label-signal">Editorial signal wash</p>
                        <h3 className="hito-panel-title mt-3">
                          Changelog-style emphasis without pills.
                        </h3>
                        <p className="hito-body-small mt-3 text-muted-foreground">
                          Editorial signal wash is for release-history and prose emphasis, alongside
                          text highlights such as{" "}
                          <span className="hito-highlight-tag" data-tone="signal">
                            New
                          </span>
                          , not operational status.
                        </p>
                      </article>

                      <article className="hito-auth-alpha-surface hito-surface-flat rounded-2xl border border-hairline p-5">
                        <p className="hito-label">Alpha overlay surface</p>
                        <h3 className="hito-panel-title mt-3">
                          Translucent only in atmospheric shells.
                        </h3>
                        <p className="hito-body-small mt-3 text-muted-foreground">
                          Alpha surfaces belong on auth/photo or launcher canvases. Use standard
                          solid Hito surfaces for normal forms, menus, inputs, and tables.
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

                  <div className="grid gap-8">
                    <div className="grid gap-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                          <p className="hito-label">Color documentation</p>
                          <p className="hito-body-small mt-2 max-w-3xl">
                            Semantic tokens are the product API. Primitive swatches document the
                            solid Hito palette underneath them; alpha overlays and gradients stay
                            semantic because they describe usage context.
                          </p>
                        </div>
                        <div
                          className="hito-tabs hito-tabs-enclosed"
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
                        <div className="grid gap-4" role="tabpanel" aria-label="Semantic Colors">
                          <div className="hito-reference-note">
                            <p className="hito-label">Semantic Colors</p>
                            <p className="hito-body-small mt-2 max-w-3xl">
                              Click a card to copy the semantic code. Previews may resolve through
                              primitive colors, alpha mixes, or documented gradient/overlay classes,
                              but product code should use the semantic token or recipe.
                            </p>
                          </div>
                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {SEMANTIC_COLOR_TOKENS.map((token) => (
                              <SemanticColorCard
                                key={token.name}
                                token={token}
                                onCopy={copyColorValue}
                              />
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="grid gap-5" role="tabpanel" aria-label="Primitive">
                          <div className="hito-reference-note">
                            <p className="hito-label">Primitive</p>
                            <p className="hito-body-small mt-2 max-w-3xl">
                              These are solid base colors already defined in Hito. Click a swatch to
                              copy its hex value. Alpha tokens are intentionally excluded from this
                              primitive tab and documented as semantic usage colors.
                            </p>
                          </div>
                          {RAW_COLOR_PRIMITIVES.map((group) => (
                            <PrimitiveColorGroup
                              key={group.title}
                              group={group}
                              onCopy={copyColorValue}
                            />
                          ))}
                        </div>
                      )}
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
                          Banned drift patterns: local uppercase micro-label recipes, route-local
                          serif section headings, and tiny metadata text when caption or micro-label
                          already fits.
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
                        operational UI, labels, body, actions, navigation, and feedback. JetBrains
                        Mono owns measured or fixed-format truth only.
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
                    title="One Hito registry, Tabler underneath."
                    body="Product surfaces use the Hito Icon primitive and stable product names. Tabler is the glyph backend; raw SVG folders and direct icon-family imports are not a design-system source of truth."
                  />

                  <div className="grid gap-5">
                    <div className="hito-reference-note flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                      <div>
                        <p className="hito-label">Canonical sizing</p>
                        <p className="hito-body-small mt-2 max-w-3xl">
                          Icons use four sizes only: xs 14, sm 16, md 20, and lg 24. Small icons use
                          a 1.75 stroke by default; medium and large icons use 1.5. Preview the
                          registry at one size at a time to inspect names and shapes without
                          repeated rows.
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
                          Registry specimens below use {iconPreviewSize} ·{" "}
                          {HITO_ICON_SIZES[iconPreviewSize]}px.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-end gap-4">
                        {(["calendar", "download", "settings"] as const).map((iconName) => (
                          <div key={iconName} className="grid justify-items-center gap-2">
                            <div className="grid h-10 min-w-10 place-items-center text-foreground">
                              <Icon
                                name={iconName}
                                size={iconPreviewSize}
                                data-hito-ds-icon={iconName}
                              />
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
                          <input
                            className="hito-field hito-field-md pl-9"
                            placeholder="Search plans"
                          />
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
            ) : null}

            {pageId === "components" ? (
              <>
                <HitoDsPlayground
                  id="buttons"
                  label="Buttons"
                  title="Variants, sizes, icons, disabled state."
                  body="Use the builder to check CTA hierarchy and icon rhythm across the canonical button system."
                  status="Core control"
                  statusTone="signal"
                  demo={
                    <div
                      className="flex min-w-0 items-center justify-center"
                      data-hito-ds-button-preview
                    >
                      <DemoButton
                        variant={variant}
                        tone={buttonTone}
                        size={size}
                        leftIcon={leftIcon}
                        rightIcon={rightIcon}
                        disabled={disabled || buttonLoading}
                        loading={buttonLoading}
                      />
                    </div>
                  }
                  variants={
                    <div className="grid gap-6">
                      <div className="border-t border-hairline pt-5">
                        <p className="hito-label">State matrix</p>
                        <p className="hito-caption mt-1">
                          Follows the selected variant, tone, size, and icon rhythm.
                        </p>
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <DemoButton
                            variant={variant}
                            tone={buttonTone}
                            size={size}
                            leftIcon={leftIcon}
                            rightIcon={rightIcon}
                          />
                          <DemoButton
                            variant={variant}
                            tone={buttonTone}
                            size={size}
                            leftIcon={leftIcon}
                            rightIcon={rightIcon}
                            demoState="hover"
                          />
                          <DemoButton
                            variant={variant}
                            tone={buttonTone}
                            size={size}
                            leftIcon={leftIcon}
                            rightIcon={rightIcon}
                            demoState="focus"
                          />
                          <DemoButton
                            variant={variant}
                            tone={buttonTone}
                            size={size}
                            leftIcon={leftIcon}
                            rightIcon={rightIcon}
                            disabled
                          />
                          <DemoButton
                            variant={variant}
                            tone={buttonTone}
                            size={size}
                            loading
                            disabled
                          />
                        </div>
                      </div>
                      <div className="border-t border-hairline pt-5">
                        <p className="hito-label">Hierarchy × tone</p>
                        <div className="mt-4 grid gap-3">
                          {BUTTON_TONES.map((tone) => (
                            <div key={tone} className="flex min-w-0 flex-wrap items-center gap-3">
                              <span className="hito-micro-label w-16">{tone}</span>
                              {BUTTON_VARIANTS.map((item) => (
                                <DemoButton
                                  key={`${tone}-${item}`}
                                  variant={item}
                                  tone={tone}
                                  size="sm"
                                />
                              ))}
                            </div>
                          ))}
                        </div>
                        <p className="hito-caption mt-3 max-w-2xl">
                          Default primary stays signal/orange. Secondary stays soft and borderless.
                          Outlined stays border-led. Success and error are semantic tones, not
                          separate button families.
                        </p>
                      </div>
                    </div>
                  }
                  controls={
                    <div className="grid gap-4">
                      <div className="hito-row-group border-0">
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
                        <ToggleRow
                          label="Loading"
                          active={buttonLoading}
                          onToggle={() => setButtonLoading((v) => !v)}
                        />
                      </div>
                      <div className="hito-row-group border-0">
                        <div className="hito-list-row items-start">
                          <ChoiceSelector
                            label="Variant"
                            value={variant}
                            options={BUTTON_VARIANTS}
                            onChange={setVariant}
                          />
                        </div>
                        <div className="hito-list-row items-start">
                          <ChoiceSelector
                            label="Tone"
                            value={buttonTone}
                            options={BUTTON_TONES}
                            onChange={setButtonTone}
                          />
                        </div>
                        <div className="hito-list-row items-start">
                          <ChoiceSelector
                            label="Size"
                            value={size}
                            options={BUTTON_SIZES}
                            onChange={setSize}
                            textTransform="uppercase"
                          />
                        </div>
                      </div>
                    </div>
                  }
                  caption={[
                    {
                      label: "Proves",
                      body: "Primary, secondary, outlined, ghost, semantic tones, size tiers, icon rhythm, disabled, and loading states share one button family.",
                    },
                    {
                      label: "Does not imply",
                      body: "Buttons are not navigation tabs, selectable values, status labels, or passive metadata.",
                    },
                    {
                      label: "Used in",
                      body: (
                        <ProductLinks
                          links={[
                            { href: "/login", label: "/login" },
                            { href: "/settings", label: "/settings" },
                            { href: "/admin/analytics", label: "/admin/analytics" },
                            { href: "/hitoDS", label: "/hitoDS" },
                          ]}
                        />
                      ),
                    },
                  ]}
                />

                <HitoDsPlayground
                  id="tabs"
                  label="Tabs"
                  title="Simple and enclosed mode switches."
                  body="Tabs organize nearby views without becoming another card system. Use simple tabs for calm page-level switches and enclosed tabs when a local control cluster needs a stronger boundary."
                  status="Core control"
                  statusTone="signal"
                  demo={
                    <div className="max-w-full min-w-0 overflow-x-auto pb-1">
                      <div
                        className={cn(
                          "hito-tabs",
                          tabStyle === "simple" ? "hito-tabs-simple" : "hito-tabs-enclosed",
                        )}
                        role="tablist"
                        aria-label="Configurable tab example"
                      >
                        <button
                          type="button"
                          className="hito-tab"
                          data-active="true"
                          aria-selected="true"
                        >
                          {tabIcon && <Icon name="calendar" size="sm" className="hito-tab-icon" />}
                          Plan
                        </button>
                        <button type="button" className="hito-tab" aria-selected="false">
                          {tabIcon && <Icon name="progress" size="sm" className="hito-tab-icon" />}
                          Progress
                          {tabBadge && (
                            <span className="hito-tab-badge" data-variant="count">
                              3
                            </span>
                          )}
                        </button>
                        <button type="button" className="hito-tab" aria-selected="false">
                          Updates
                          {tabDot && <span className="hito-tab-dot" aria-hidden="true" />}
                        </button>
                        {tabDisabled && (
                          <button type="button" className="hito-tab" disabled aria-selected="false">
                            Archived
                          </button>
                        )}
                      </div>
                    </div>
                  }
                  variants={
                    <div className="grid min-w-0 gap-5">
                      <div className="border-t border-hairline pt-5">
                        <p className="hito-label">State matrix</p>
                        <p className="hito-caption mt-1">Follows the selected tab visual style.</p>
                        <div className="max-w-full min-w-0 overflow-hidden pb-1">
                          <div
                            className={cn(
                              "hito-tabs mt-4 w-full flex-wrap",
                              tabStyle === "simple" ? "hito-tabs-simple" : "hito-tabs-enclosed",
                            )}
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
                            <button
                              type="button"
                              className="hito-tab"
                              disabled
                              aria-selected="false"
                            >
                              Disabled
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  }
                  controls={
                    <div className="hito-row-group border-0">
                      <div className="hito-list-row items-start">
                        <ChoiceSelector
                          label="Visual style"
                          value={tabStyle}
                          options={TAB_STYLES}
                          onChange={setTabStyle}
                        />
                      </div>
                      <ToggleRow
                        label="With icon"
                        active={tabIcon}
                        onToggle={() => setTabIcon((v) => !v)}
                      />
                      <ToggleRow
                        label="With badge"
                        active={tabBadge}
                        onToggle={() => setTabBadge((v) => !v)}
                      />
                      <ToggleRow
                        label="With dot"
                        active={tabDot}
                        onToggle={() => setTabDot((v) => !v)}
                      />
                      <ToggleRow
                        label="Disabled tab"
                        active={tabDisabled}
                        onToggle={() => setTabDisabled((v) => !v)}
                      />
                    </div>
                  }
                  caption={[
                    {
                      label: "Proves",
                      body: "Simple and enclosed tabs cover active, inactive, hover, focus-visible, disabled, icon, badge, and dot anatomy.",
                    },
                    {
                      label: "Does not imply",
                      body: "Tabs are not value pickers for size, tone, weekday, or variant; use choice toggles for those.",
                    },
                    {
                      label: "Used in",
                      body: (
                        <ProductLinks
                          links={[
                            { href: "/settings", label: "/settings" },
                            { href: "/changelog", label: "/changelog" },
                            { href: "/admin/analytics", label: "/admin/analytics" },
                          ]}
                        />
                      ),
                    },
                  ]}
                />

                <HitoDsPlayground
                  id="data-table"
                  label="Data table"
                  title="Header controls keep sorting and filtering in context."
                  body="Operational tables use one Hito header typography for sortable and non-sortable columns. Sort/filter state belongs in the header control, while static headers stay visually aligned without becoming clickable."
                  status="Pattern"
                  statusTone="signal"
                  demo={
                    <DataTableSpecimenPreview
                      sortable={dataTableSortable}
                      activeSort={dataTableActiveSort}
                      sortDirection={dataTableSortDirection}
                      filtered={dataTableFiltered}
                      staticMode={dataTableStaticMode}
                      showUtilityRow={dataTableUtilityRow}
                    />
                  }
                  variants={
                    <div className="grid min-w-0 gap-6">
                      <div className="border-t border-hairline pt-5">
                        <p className="hito-label">Interactive header states</p>
                        <p className="hito-caption mt-1">
                          Sortable, active-sort, filtered, hover/demo, and static header cells stay
                          in one contained table scroll region.
                        </p>
                        <div className="mt-4">
                          <DataTableSpecimenPreview
                            sortable
                            activeSort
                            sortDirection={dataTableSortDirection}
                            filtered
                            staticMode={false}
                            showUtilityRow
                          />
                        </div>
                      </div>

                      <div className="border-t border-hairline pt-5">
                        <p className="hito-label">Static table mode</p>
                        <p className="hito-caption mt-1">
                          Read-only table headers keep the same typography and spacing without
                          implying clickable sorting.
                        </p>
                        <div className="mt-4">
                          <DataTableSpecimenPreview
                            sortable={false}
                            activeSort={false}
                            filtered={false}
                            staticMode
                            showUtilityRow={false}
                          />
                        </div>
                      </div>
                    </div>
                  }
                  controls={
                    <div className="hito-row-group border-0">
                      <ToggleRow
                        label="Sortable preview column"
                        active={dataTableSortable}
                        onToggle={() => setDataTableSortable((v) => !v)}
                      />
                      <ToggleRow
                        label="Active sort"
                        active={dataTableActiveSort}
                        onToggle={() => setDataTableActiveSort((v) => !v)}
                      />
                      <ChoiceSelector
                        label="Sort direction"
                        value={dataTableSortDirection}
                        options={DATA_TABLE_SORT_DIRECTIONS}
                        onChange={setDataTableSortDirection}
                        getLabel={(value) => (value === "asc" ? "Ascending" : "Descending")}
                        textTransform="none"
                      />
                      <ToggleRow
                        label="Filtered"
                        active={dataTableFiltered}
                        onToggle={() => setDataTableFiltered((v) => !v)}
                      />
                      <ToggleRow
                        label="Static mode"
                        active={dataTableStaticMode}
                        onToggle={() => setDataTableStaticMode((v) => !v)}
                      />
                      <ToggleRow
                        label="Utility/search row"
                        active={dataTableUtilityRow}
                        onToggle={() => setDataTableUtilityRow((v) => !v)}
                      />
                    </div>
                  }
                  caption={[
                    {
                      label: "Use for",
                      body: "Operational data where sorting, filtering, scanning, and horizontal overflow containment matter.",
                    },
                    {
                      label: "Does not imply",
                      body: "Marketing cards, metric summaries, form layouts, or route-local lists that do not need table semantics.",
                    },
                    {
                      label: "Used in",
                      body: (
                        <ProductLinks
                          links={[
                            { href: "/admin/analytics", label: "/admin/analytics" },
                            { href: "/hitoDS", label: "/hitoDS" },
                          ]}
                        />
                      ),
                    },
                  ]}
                />

                <HitoDsPlayground
                  id="inputs"
                  label="Inputs"
                  title="Variants, states, icons, and button-matched rhythm."
                  body="Text fields and buttons share size tiers. Primary fields keep the canonical bordered form behavior; secondary fields use a lower-chrome tinted surface."
                  status="Core control"
                  statusTone="signal"
                  demo={
                    <div className="hito-surface-flat p-5">
                      <p className="hito-label">Current input</p>
                      <div className="mt-5 grid min-w-0 gap-4">
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
                        <div className="flex min-w-0 flex-wrap items-center gap-3">
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
                  }
                  variants={
                    <div className="grid min-w-0 gap-6">
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

                      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
                        <label className="grid min-w-0 gap-2">
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
                        <label className="grid min-w-0 gap-2">
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
                        <label className="grid min-w-0 gap-2">
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
                        <label className="grid min-w-0 gap-2">
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
                        <label className="grid min-w-0 gap-2 lg:col-span-2">
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
                          <p className="hito-label">Date and time inputs</p>
                          <p className="hito-caption mt-2 max-w-2xl">
                            Date/time truth stays ISO or duration-shaped in state. Calendar
                            selection, typed date entry, compact optional date chips, and masked
                            time entry share the same Hito field rhythm.
                          </p>
                        </div>
                        <div className="hito-reference-list">
                          <article className="hito-reference-row items-start">
                            <div>
                              <p className="hito-list-row-title">Date picker field</p>
                              <p className="hito-caption mt-2">
                                Use for required or visible dates such as target race day.
                              </p>
                            </div>
                            <HitoDateField
                              id="ds-date-field"
                              label="Target date"
                              value={dateFieldDemo}
                              onChange={setDateFieldDemo}
                              helper="Pick from calendar or type YYYY-MM-DD."
                            />
                          </article>
                          <article className="hito-reference-row items-start">
                            <div>
                              <p className="hito-list-row-title">Date picker states</p>
                              <p className="hito-caption mt-2">
                                Error, disabled, and bounded date states stay in the same
                                field-owned anatomy.
                              </p>
                            </div>
                            <div className="grid min-w-0 gap-4">
                              <HitoDateField
                                id="ds-date-field-invalid"
                                label="Invalid typed date"
                                value="2026-13-40"
                                onChange={() => {}}
                                error="Use YYYY-MM-DD."
                              />
                              <HitoDateField
                                id="ds-date-field-disabled"
                                label="Disabled date"
                                value="2026-12-11"
                                onChange={() => {}}
                                disabled
                                helper="Disabled fields do not open the picker."
                              />
                              <HitoDateField
                                id="ds-date-field-bounded"
                                label="Bounded date"
                                value={boundedDateDemo}
                                onChange={setBoundedDateDemo}
                                minDate="2026-05-20"
                                maxDate="2026-06-10"
                                helper="Calendar dates outside May 20-Jun 10 are disabled."
                              />
                            </div>
                          </article>
                          <article className="hito-reference-row items-start">
                            <div>
                              <p className="hito-list-row-title">Optional date chip</p>
                              <p className="hito-caption mt-2">
                                Empty state is an action; saved state is visible and editable.
                              </p>
                            </div>
                            <HitoEditableDateChip
                              label="Plan Start Date"
                              value={editableDateDemo}
                              onChange={setEditableDateDemo}
                              helper="Optional date using the same picker primitive."
                            />
                          </article>
                          <article className="hito-reference-row items-start">
                            <div>
                              <p className="hito-list-row-title">Masked time field</p>
                              <p className="hito-caption mt-2">
                                Use for race targets and durations. Continuous digits normalize
                                while editing.
                              </p>
                            </div>
                            <HitoMaskedTimeField
                              id="ds-time-field"
                              label="Target time"
                              value={timeFieldDemo}
                              onChange={setTimeFieldDemo}
                              helper="Duration-shaped, backend-compatible value."
                            />
                          </article>
                        </div>
                      </div>

                      <div className="border-t border-hairline pt-5">
                        <p className="hito-label">Avatar tile action</p>
                        <p className="hito-caption mt-2 max-w-2xl">
                          Settings avatar controls use one rectangular tile and a same-width action.
                        </p>
                        <div className="hito-reference-list mt-4">
                          <article className="hito-reference-row">
                            <div>
                              <p className="hito-list-row-title">Empty avatar</p>
                              <p className="hito-caption mt-2">
                                The action spans the tile width and keeps the camera affordance.
                              </p>
                            </div>
                            <div className="hito-avatar-stack">
                              <span className="hito-avatar-tile hito-profile-avatar h-28 w-28">
                                <span className="hito-profile-avatar-fallback">IR</span>
                              </span>
                              <button
                                type="button"
                                className="hito-avatar-action hito-button hito-button-secondary hito-button-sm"
                              >
                                <Icon name="camera" size="sm" />
                                Upload
                              </button>
                            </div>
                          </article>
                          <article className="hito-reference-row">
                            <div>
                              <p className="hito-list-row-title">Existing avatar</p>
                              <p className="hito-caption mt-2">
                                Edit is a separate product label, not hidden inside avatar hover
                                chrome.
                              </p>
                            </div>
                            <div className="hito-avatar-stack">
                              <span className="hito-avatar-tile hito-profile-avatar h-28 w-28">
                                <span className="grid h-full w-full place-items-center bg-[var(--stone-800)] text-signal">
                                  <Icon name="user" size="lg" />
                                </span>
                              </span>
                              <button
                                type="button"
                                className="hito-avatar-action hito-button hito-button-secondary hito-button-sm"
                              >
                                <Icon name="edit" size="sm" />
                                Edit
                              </button>
                            </div>
                          </article>
                        </div>
                      </div>

                      <div className="border-t border-hairline pt-5">
                        <p className="hito-label">Editable value chip</p>
                        <p className="hito-caption mt-2 max-w-2xl">
                          Compact scalar facts use editable value chips, not full form cards or
                          normal text rows.
                        </p>
                        <div className="hito-reference-list mt-4">
                          <article className="hito-reference-row">
                            <div>
                              <p className="hito-list-row-title">Empty chip</p>
                              <p className="hito-caption mt-2">
                                Borderless by default, with a clear hover/focus backdrop.
                              </p>
                            </div>
                            <div className="hito-editable-value-chip-group">
                              {["Age", "Height", "Weight"].map((label) => (
                                <button
                                  key={label}
                                  type="button"
                                  className="hito-editable-value-chip"
                                  data-state="empty"
                                >
                                  <Icon
                                    name="plus"
                                    size="sm"
                                    className="hito-editable-value-chip-icon"
                                  />
                                  <span className="hito-editable-value-chip-content">{label}</span>
                                </button>
                              ))}
                            </div>
                          </article>
                          <article className="hito-reference-row">
                            <div>
                              <p className="hito-list-row-title">Editing chip</p>
                              <p className="hito-caption mt-2">
                                The input stays the same height and focuses in place.
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
                              <p className="hito-list-row-title">Saved chip</p>
                              <p className="hito-caption mt-2">
                                Compact label plus value. Pencil stays subtle and appears on
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
                  }
                  controls={
                    <div className="grid gap-4">
                      <div className="hito-row-group border-0">
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
                      </div>
                      <div className="hito-row-group border-0">
                        <div className="hito-list-row items-start">
                          <ChoiceSelector
                            label="Variant"
                            value={inputVariant}
                            options={INPUT_VARIANTS}
                            onChange={setInputVariant}
                          />
                        </div>
                        <div className="hito-list-row items-start">
                          <ChoiceSelector
                            label="State"
                            value={inputState}
                            options={INPUT_STATES}
                            onChange={setInputState}
                            getLabel={(item) => (item === "focus" ? "Active" : item)}
                          />
                        </div>
                        <div className="hito-list-row items-start">
                          <ChoiceSelector
                            label="Feedback"
                            value={inputFeedback}
                            options={INPUT_FEEDBACK}
                            onChange={setInputFeedback}
                          />
                        </div>
                        <div className="hito-list-row items-start">
                          <ChoiceSelector
                            label="Size"
                            value={inputSize}
                            options={FIELD_SIZES}
                            onChange={setInputSize}
                            textTransform="uppercase"
                          />
                        </div>
                      </div>
                    </div>
                  }
                  caption={[
                    {
                      label: "Proves",
                      body: "Text fields, textareas, validation feedback, date/time inputs, avatar actions, and editable value chips share one field rhythm.",
                    },
                    {
                      label: "Does not imply",
                      body: "Status truth, selectable chips, tab navigation, or long prose display.",
                    },
                    {
                      label: "Used in",
                      body: (
                        <ProductLinks
                          links={[
                            { href: "/login", label: "/login" },
                            { href: "/settings", label: "/settings" },
                            { href: "/admin/login", label: "/admin/login" },
                            { href: "/hitoDS", label: "/hitoDS" },
                          ]}
                        />
                      ),
                    },
                  ]}
                />

                <HitoDsPlayground
                  id="status"
                  label="Status"
                  title="Short truth labels and compact markers."
                  body="Status chips and markers identify product state. They stay concise, semantic, and separate from headings, buttons, or editorial tags."
                  status="Core feedback"
                  statusTone="signal"
                  demo={
                    <div className="grid min-w-0 gap-5">
                      <p className="hito-label">Current status</p>
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className="hito-status-pill"
                          data-tone={statusTone === "neutral" ? undefined : statusTone}
                        >
                          {statusLongLabel ? "Feedback ready for review" : statusTone}
                        </span>
                        <span
                          className="hito-status-marker"
                          data-tone={statusTone === "neutral" ? "muted" : statusTone}
                          aria-label={`${statusTone} marker`}
                        >
                          <Icon
                            name={
                              statusTone === "destructive"
                                ? "close"
                                : statusTone === "warning"
                                  ? "warning"
                                  : statusTone === "success"
                                    ? "check"
                                    : "minus"
                            }
                            size="xs"
                            strokeWidth={2.2}
                          />
                        </span>
                      </div>
                      <p className="hito-caption max-w-lg">
                        Status is display-only. Tone and concise readable labels carry the
                        meaningful state; actions still use buttons and menus.
                      </p>
                    </div>
                  }
                  variants={
                    <div className="grid min-w-0 gap-6">
                      <div className="border-t border-hairline pt-5">
                        <p className="hito-label">Chip tones</p>
                        <p className="hito-caption mt-1">
                          Neutral, signal, success, warning, and destructive share one chip anatomy.
                        </p>
                        <div className="mt-4 flex min-w-0 flex-wrap items-center gap-3">
                          {STATUS_TONES.map((tone) => (
                            <span
                              key={tone}
                              className="hito-status-pill"
                              data-tone={tone === "neutral" ? undefined : tone}
                            >
                              {tone}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-hairline pt-5">
                        <p className="hito-label">Marker states</p>
                        <p className="hito-caption mt-1">
                          Tiny markers carry result or feedback truth without becoming another
                          badge.
                        </p>
                        <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
                          {STATUS_MARKER_EXAMPLES.map((item) => (
                            <div key={item.label} className="hito-list-row min-w-0">
                              <div className="flex min-w-0 items-center gap-3">
                                <span
                                  className="hito-status-marker"
                                  data-tone={item.tone}
                                  aria-label={`${item.label} marker`}
                                >
                                  <Icon name={item.icon} size="xs" strokeWidth={2.2} />
                                </span>
                                <div className="min-w-0">
                                  <p className="hito-list-row-title">{item.label}</p>
                                  <p className="hito-list-row-copy">{item.tone}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-hairline pt-5">
                        <p className="hito-label">Long labels stay rare</p>
                        <div className="mt-4 flex min-w-0 flex-wrap items-center gap-3">
                          <span className="hito-status-pill" data-tone="signal">
                            Feedback ready for review
                          </span>
                          <span className="hito-status-pill" data-tone="muted">
                            Manual plan
                          </span>
                        </div>
                      </div>
                    </div>
                  }
                  controls={
                    <div className="hito-row-group border-0">
                      <div className="hito-list-row items-start">
                        <ChoiceSelector
                          label="Tone"
                          value={statusTone}
                          options={STATUS_TONES}
                          onChange={setStatusTone}
                        />
                      </div>
                      <ToggleRow
                        label="Long label"
                        active={statusLongLabel}
                        onToggle={() => setStatusLongLabel((v) => !v)}
                      />
                    </div>
                  }
                  caption={[
                    {
                      label: "Use for",
                      body: "Short state identifiers such as active plan, pro feature, saved, warning, and feedback-ready states.",
                    },
                    {
                      label: "Does not imply",
                      body: "Clickable actions, marketing badges, changelog editorial highlights, or long explanations.",
                    },
                    {
                      label: "Used in",
                      body: (
                        <ProductLinks
                          links={[
                            { href: "/", label: "/" },
                            { href: "/settings", label: "/settings" },
                            { href: "/workout/2026-05-24", label: "/workout/$date" },
                            { href: "/admin/analytics", label: "/admin/analytics" },
                          ]}
                        />
                      ),
                    },
                  ]}
                />

                <HitoDsPlayground
                  id="selection-controls"
                  label="Selection controls"
                  title="Signal-selected, never browser-native."
                  body="Checkboxes, radios, and toggle radios share Hito focus, disabled, invalid, and signal-selected states. Destructive confirmation uses warning copy and destructive buttons; the selected checkbox itself stays signal."
                  status="Core control"
                  statusTone="signal"
                  demo={
                    <div className="grid min-w-0 gap-4">
                      <p className="hito-label">Current selection control</p>
                      <SelectionControlPreview
                        kind={selectionKind}
                        size={selectionSize}
                        selected={selectionSelected}
                        disabled={selectionDisabled}
                        invalid={selectionInvalid}
                        focusDemo={selectionFocusDemo}
                        accentMode={selectionAccentMode}
                      />
                    </div>
                  }
                  variants={
                    <div className="grid min-w-0 gap-6">
                      <div className="border-t border-hairline pt-5">
                        <p className="hito-label">Required states</p>
                        <div className="mt-4 grid gap-3">
                          <label className="hito-control-label hito-control-label-sm">
                            <input type="checkbox" className="hito-checkbox hito-checkbox-sm" />
                            <span>Default checkbox</span>
                          </label>
                          <label className="hito-control-label hito-control-label-sm">
                            <input
                              type="checkbox"
                              className="hito-checkbox hito-checkbox-sm"
                              defaultChecked
                              data-state="checked"
                            />
                            <span>Signal-selected checkbox</span>
                          </label>
                          <label className="hito-control-label hito-control-label-sm">
                            <input
                              type="radio"
                              className="hito-radio hito-radio-sm"
                              data-demo-state="focus"
                            />
                            <span>Focus-visible radio</span>
                          </label>
                          <div className="hito-choice-toggle-group">
                            <button
                              type="button"
                              className="hito-choice-toggle hito-choice-toggle-sm"
                              data-demo-state="focus"
                            >
                              Focus
                            </button>
                            <button
                              type="button"
                              className="hito-choice-toggle hito-choice-toggle-sm"
                              aria-invalid="true"
                            >
                              Invalid
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
                      </div>

                      <div className="hito-reference-list">
                        <ReferenceListRow
                          label="Checkbox"
                          title="Independent choice"
                          body="Use when a choice can be independently on or off. Labels are the hit target: SM rows are at least 32px high and MD rows are at least 40px high. Checkbox boxes stay square; only radios are circular."
                        />
                        <ReferenceListRow
                          label="Radio"
                          title="One from a small set"
                          body="Use when one option must be selected from a small set. Keep labels plain and keep focus-visible distinct from the selected dot."
                        />
                        <ReferenceListRow
                          label="Toggle radio"
                          title="Selectable values"
                          body="Functional sizes match the button/input scale for normal controls. Decorative plan-builder choices use the separate accent size, not xl."
                        />
                      </div>

                      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.72fr)]">
                        <article className="hito-surface-flat min-w-0 p-5">
                          <p className="hito-label">Functional toggle scale</p>
                          <p className="hito-caption mt-2 max-w-xl">
                            The mixed-size row aligns to each control height instead of stretching
                            every item to the tallest toggle.
                          </p>
                          <div
                            className="hito-choice-toggle-group mt-4 items-center"
                            role="radiogroup"
                            aria-label="Toggle radio size scale"
                          >
                            {CHOICE_TOGGLE_SIZES.map((item) => (
                              <button
                                key={item}
                                type="button"
                                className={cn(
                                  "hito-choice-toggle uppercase",
                                  `hito-choice-toggle-${item}`,
                                )}
                                role="radio"
                                aria-checked={item === "md"}
                              >
                                {item}
                              </button>
                            ))}
                          </div>
                          <div className="mt-5 grid gap-2">
                            {CHOICE_TOGGLE_SIZES.map((item) => (
                              <div key={item} className="flex min-w-0 flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  className={cn(
                                    "hito-button hito-button-secondary uppercase",
                                    `hito-button-${item}`,
                                  )}
                                >
                                  {item}
                                </button>
                                <input
                                  readOnly
                                  value={item}
                                  aria-label={`${item} field alignment`}
                                  className={cn(
                                    "hito-field hito-field-secondary uppercase max-w-24",
                                    `hito-field-${item}`,
                                  )}
                                />
                                <button
                                  type="button"
                                  className={cn(
                                    "hito-choice-toggle uppercase",
                                    `hito-choice-toggle-${item}`,
                                  )}
                                  data-selected={item === "md"}
                                >
                                  {item}
                                </button>
                              </div>
                            ))}
                          </div>
                        </article>

                        <article className="hito-surface-flat min-w-0 p-5">
                          <p className="hito-label">Accent / display choice</p>
                          <p className="hito-caption mt-2">
                            Accent is not part of the functional size ladder. Use it only when the
                            choice is a large visual planning moment.
                          </p>
                          <div
                            className="hito-choice-toggle-group mt-4"
                            role="radiogroup"
                            aria-label="Accent toggle radio example"
                          >
                            <button
                              type="button"
                              className="hito-choice-toggle hito-choice-toggle-accent"
                              role="radio"
                              aria-checked="true"
                            >
                              <span>
                                <span className="block">Half marathon</span>
                                <span className="mt-1 block text-current/70">
                                  Goal distance choice
                                </span>
                              </span>
                            </button>
                            <button
                              type="button"
                              className="hito-choice-toggle hito-choice-toggle-accent"
                              role="radio"
                              aria-checked="false"
                            >
                              <span>
                                <span className="block">Build consistency</span>
                                <span className="mt-1 block text-current/70">
                                  Large onboarding choice
                                </span>
                              </span>
                            </button>
                          </div>
                        </article>
                      </div>

                      <article className="hito-reference-row">
                        <div>
                          <p className="hito-label">Destructive confirmation</p>
                          <p className="hito-caption mt-2 max-w-xl">
                            The checkbox confirms understanding and stays signal-selected.
                            Destructive meaning belongs to warning copy and final destructive
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
                  }
                  controls={
                    <div className="grid gap-4">
                      <div className="hito-row-group border-0">
                        <div className="hito-list-row items-start">
                          <ChoiceSelector
                            label="Control kind"
                            value={selectionKind}
                            options={SELECTION_CONTROL_KINDS}
                            onChange={(nextKind) => {
                              setSelectionKind(nextKind);
                              if (nextKind !== "toggle" && !isBinarySelectionSize(selectionSize)) {
                                setSelectionSize("md");
                              }
                            }}
                            getLabel={getSelectionKindLabel}
                          />
                        </div>
                        <div className="hito-list-row items-start">
                          <ChoiceSelector
                            label="Size"
                            value={selectionSize}
                            options={
                              selectionKind === "toggle"
                                ? CHOICE_TOGGLE_SIZES
                                : SELECTION_BINARY_SIZES
                            }
                            onChange={setSelectionSize}
                            textTransform="uppercase"
                          />
                        </div>
                      </div>
                      <div className="hito-row-group border-0">
                        {selectionKind === "toggle" && (
                          <ToggleRow
                            label="Accent display mode"
                            active={selectionAccentMode}
                            onToggle={() => setSelectionAccentMode((v) => !v)}
                          />
                        )}
                        <ToggleRow
                          label="Selected"
                          active={selectionSelected}
                          onToggle={() => setSelectionSelected((v) => !v)}
                        />
                        <ToggleRow
                          label="Disabled"
                          active={selectionDisabled}
                          onToggle={() => setSelectionDisabled((v) => !v)}
                        />
                        <ToggleRow
                          label="Invalid"
                          active={selectionInvalid}
                          onToggle={() => setSelectionInvalid((v) => !v)}
                        />
                        <ToggleRow
                          label="Focus demo"
                          active={selectionFocusDemo}
                          onToggle={() => setSelectionFocusDemo((v) => !v)}
                        />
                      </div>
                    </div>
                  }
                  caption={[
                    {
                      label: "Proves",
                      body: "Checkboxes, radios, choice toggles, size scales, selected/invalid/focus/disabled states, and destructive confirmation context stay in one selection family.",
                    },
                    {
                      label: "Does not imply",
                      body: "Selection controls are not panel navigation, decorative tags, status chips, or destructive meaning by themselves.",
                    },
                    {
                      label: "Used in",
                      body: (
                        <ProductLinks
                          links={[
                            { href: "/", label: "Calendar" },
                            { href: "/settings", label: "/settings" },
                            { href: "/hitoDS/components#inputs", label: "DS builders" },
                          ]}
                        />
                      ),
                    },
                  ]}
                />
              </>
            ) : null}

            {pageId === "patterns" ? (
              <>
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
                        Keep a surface when it contains one active object, like an attached file,
                        form, or route-level state. Avoid stacking subcards inside it.
                      </p>
                    </article>
                  </div>
                </section>
              </>
            ) : null}

            {pageId === "components" ? (
              <>
                <HitoDsPlayground
                  id="modals"
                  label="Modals"
                  title="Bounded panel, explicit body mode, reachable footer."
                  body="Product dialogs share one stable overlay, backdrop, panel chrome, size preset, and body mode. Short content fits naturally; tall workflows scroll internally."
                  status="Core overlay"
                  statusTone="signal"
                  demo={
                    <ModalWindowPreview
                      sizeMode={modalSizeMode}
                      bodyMode={modalBodyMode}
                      headerMode={modalHeaderMode}
                      footerMode={modalFooterMode}
                      showStatusPill={modalStatusPill}
                      destructive={modalDestructive}
                      longContent={modalLongContent}
                    />
                  }
                  variants={
                    <div className="grid min-w-0 gap-6">
                      <div className="border-t border-hairline pt-5">
                        <p className="hito-label">Body mode matrix</p>
                        <p className="hito-caption mt-1">
                          Short task dialogs fit to content; tall workflows and reviews keep footer
                          actions reachable with internal body scroll.
                        </p>
                        <div className="mt-4 grid min-w-0 gap-5 xl:grid-cols-2">
                          <ModalWindowPreview
                            sizeMode="standard"
                            bodyMode="content-fit"
                            headerMode="compact"
                            footerMode="actions"
                            showStatusPill
                            destructive={false}
                            longContent={false}
                          />
                          <ModalWindowPreview
                            sizeMode="workflow"
                            bodyMode="scroll-fill"
                            headerMode="large"
                            footerMode="note-actions"
                            showStatusPill
                            destructive={false}
                            longContent
                          />
                          <ModalWindowPreview
                            sizeMode="review"
                            bodyMode="scroll-fill"
                            headerMode="large"
                            footerMode="actions"
                            showStatusPill
                            destructive={false}
                            longContent
                          />
                        </div>
                      </div>

                      <div className="border-t border-hairline pt-5">
                        <p className="hito-label">Footer and destructive modes</p>
                        <p className="hito-caption mt-1">
                          Footer variants stay inside the same shell. Destructive meaning lives in
                          copy and the final action tone, not a separate modal family.
                        </p>
                        <div className="mt-4 grid min-w-0 gap-5 xl:grid-cols-2">
                          <ModalWindowPreview
                            sizeMode="compact"
                            bodyMode="content-fit"
                            headerMode="large"
                            footerMode="none"
                            showStatusPill={false}
                            destructive={false}
                            longContent={false}
                          />
                          <ModalWindowPreview
                            sizeMode="wide"
                            bodyMode="content-fit"
                            headerMode="compact"
                            footerMode="actions"
                            showStatusPill
                            destructive
                            longContent={false}
                          />
                        </div>
                      </div>
                    </div>
                  }
                  controls={
                    <div className="hito-row-group border-0">
                      <div className="hito-list-row items-start">
                        <ChoiceSelector
                          label="Size preset"
                          value={modalSizeMode}
                          options={MODAL_SIZE_MODES}
                          onChange={setModalSizeMode}
                          textTransform="none"
                        />
                      </div>
                      <div className="hito-list-row items-start">
                        <ChoiceSelector
                          label="Body mode"
                          value={modalBodyMode}
                          options={MODAL_BODY_MODES}
                          onChange={setModalBodyMode}
                          textTransform="none"
                        />
                      </div>
                      <div className="hito-list-row items-start">
                        <ChoiceSelector
                          label="Header mode"
                          value={modalHeaderMode}
                          options={MODAL_HEADER_MODES}
                          onChange={setModalHeaderMode}
                        />
                      </div>
                      <div className="hito-list-row items-start">
                        <ChoiceSelector
                          label="Footer mode"
                          value={modalFooterMode}
                          options={MODAL_FOOTER_MODES}
                          onChange={setModalFooterMode}
                          textTransform="none"
                        />
                      </div>
                      <ToggleRow
                        label="Status chip"
                        active={modalStatusPill}
                        onToggle={() => setModalStatusPill((v) => !v)}
                      />
                      <ToggleRow
                        label="Destructive scenario"
                        active={modalDestructive}
                        onToggle={() => setModalDestructive((v) => !v)}
                      />
                      <ToggleRow
                        label="Long content"
                        active={modalLongContent}
                        onToggle={() => setModalLongContent((v) => !v)}
                      />
                    </div>
                  }
                  caption={[
                    {
                      label: "Proves",
                      body: "The same stable overlay, centered product dialog shell, internal body scroll, and reachable footer used by review-before-apply flows, imports, body notes, and active-plan management.",
                    },
                    {
                      label: "Does not imply",
                      body: "Global navigation, passive page sections, dashboard cards, or silent mutations. Use inline state when the task does not need interruption.",
                    },
                    {
                      label: "Used in",
                      body: (
                        <ProductLinks
                          links={[
                            { href: "/", label: "Open plan" },
                            { href: "/settings", label: "Import plan" },
                            { href: "/workout/2026-05-18", label: "Body notes" },
                            { href: "/admin/login", label: "/admin/login" },
                          ]}
                        />
                      ),
                    },
                  ]}
                />

                <HitoDsPlayground
                  id="async-actions"
                  label="Async action toasts"
                  title="Progress without taking over."
                  body="Use this pattern for long-running actions that need global progress and a short outcome while validation and review stay inline."
                  status="Primitive"
                  statusTone="signal"
                  demo={
                    <div className="grid min-w-0 gap-4">
                      <span className="hito-status-pill justify-self-start" data-tone="signal">
                        Top-center toast
                      </span>
                      <div>
                        <p className="hito-label">Current demo state</p>
                        <h3 className="hito-panel-title mt-3">
                          {describeToastDemoState(toastDemoState).title}
                        </h3>
                        <p className="hito-support-copy mt-3 max-w-xl">
                          {describeToastDemoState(toastDemoState).description}
                        </p>
                      </div>
                      <div className="hito-list-row min-w-0">
                        <div className="flex min-w-0 items-start gap-3">
                          <Icon
                            name={toastDemoState === "working" ? "loader" : "warning"}
                            size="sm"
                            className={cn(
                              "mt-1 text-muted-foreground",
                              toastDemoState === "working" && "animate-spin",
                              toastDemoState === "success" && "text-success",
                              toastDemoState === "error" && "text-destructive",
                            )}
                          />
                          <div className="min-w-0">
                            <p className="hito-list-row-title">
                              Use the settings panel to fire a toast
                            </p>
                            <p className="hito-list-row-copy">
                              The specimen drives the real shared toast helper but keeps validation,
                              review, and recovery copy inline.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  }
                  variants={
                    <div className="grid min-w-0 gap-6">
                      <div className="border-t border-hairline pt-5">
                        <p className="hito-label">Toast state matrix</p>
                        <p className="hito-caption mt-1">
                          All feedback states stay visible for reference; the live demo still owns
                          actual toast firing.
                        </p>
                        <div className="mt-4 grid min-w-0 gap-3 lg:grid-cols-2">
                          {(["info", "working", "success", "error"] as const).map((state) => {
                            const stateCopy = describeToastDemoState(state);
                            const iconName =
                              state === "success"
                                ? "check-circle"
                                : state === "working"
                                  ? "loader"
                                  : "warning";

                            return (
                              <article
                                key={state}
                                className={cn(
                                  "hito-toast hito-ds-toast-specimen static min-w-0 shadow-none",
                                  state === "working"
                                    ? "hito-toast-working hito-toast-loading"
                                    : `hito-toast-${state}`,
                                )}
                                data-hito-toast=""
                                data-hito-toast-state={state}
                              >
                                <div className="hito-toast-custom-body">
                                  <div data-icon="" className="hito-toast-icon">
                                    <Icon
                                      name={iconName}
                                      size="sm"
                                      className={state === "working" ? "animate-spin" : undefined}
                                    />
                                  </div>
                                  <div data-content="">
                                    <div data-title="" className="hito-toast-title">
                                      {stateCopy.title}
                                    </div>
                                    <div data-description="" className="hito-toast-description">
                                      {stateCopy.description}
                                    </div>
                                  </div>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      </div>

                      <div className="border-t border-hairline pt-5">
                        <p className="hito-label">Button + async pairing</p>
                        <p className="hito-caption mt-1">
                          Pending buttons stay local to the action; global toast handles only short
                          progress and outcome feedback.
                        </p>
                        <div className="mt-4 flex min-w-0 flex-wrap items-center gap-3">
                          <button
                            type="button"
                            className="hito-button hito-button-primary hito-button-md"
                            disabled
                          >
                            <Icon name="loader" size="sm" className="animate-spin" />
                            Saving
                          </button>
                          <button
                            type="button"
                            className="hito-button hito-button-secondary hito-button-md"
                          >
                            Retry
                          </button>
                          <span className="hito-caption max-w-sm">
                            No fake percentages. No mutation authority in the toast copy.
                          </span>
                        </div>
                      </div>
                    </div>
                  }
                  controls={
                    <div className="grid gap-5">
                      <div className="grid gap-3">
                        <p className="hito-label">Toast variant</p>
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

                      <div className="hito-section-divider grid gap-3 pt-4">
                        <p className="hito-label">Resolve in place</p>
                        <div className="flex flex-wrap gap-2">
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
                  }
                  caption={[
                    {
                      label: "Proves",
                      body: "One active async toast, DS-owned dismiss chrome, working-to-result replacement, and distinct info/success/error states.",
                    },
                    {
                      label: "Does not imply",
                      body: "Cancellation, fake percentages, mutation authority, or replacing inline validation/review states.",
                    },
                    {
                      label: "Used in",
                      body: "Global progress and outcome feedback for bounded async actions.",
                    },
                  ]}
                />
              </>
            ) : null}

            {pageId === "patterns" ? (
              <>
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
                          Error tone is reserved for real load or save failures, not normal
                          previews.
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
                            Used for calendar and workout-structure hover context. Chart geometry
                            stays route-owned.
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
                        Month cells use distinct tiny glyphs for visible workout labels while
                        preserving the existing easy, long, quality, and rest color families.
                        Distance, duration, and target details stay in hover or workout detail.
                      </p>
                    </article>
                  </div>
                </section>
              </>
            ) : null}

            {pageId === "components" ? <CalendarWorkoutPlayground /> : null}

            {pageId === "patterns" ? (
              <>
                <WorkoutLibraryPlayground />

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
                          One grouped row can carry the real aggregate truth without pretending to
                          be a mature analytics dashboard.
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
                  <div className="hito-chart-section mt-5">
                    <p className="hito-label">Visualization chrome</p>
                    <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                      <div>
                        <p className="hito-list-row-title">Planned vs actual bars</p>
                        <p className="hito-list-row-copy mt-1">
                          DS owns the fill tones and compact notes. Height and scale remain local
                          chart geometry.
                        </p>
                        <div className="mt-4 flex h-24 items-end gap-2" aria-hidden="true">
                          {[0.72, 0.58, 0.88, 0.46].map((height, index) => (
                            <div key={height} className="flex flex-1 items-end gap-px">
                              <span
                                className="hito-comparison-bar flex-1"
                                data-tone="actual"
                                style={{ height: `${height * 100}%` }}
                              />
                              <span
                                className="hito-comparison-bar flex-1"
                                data-tone={index === 3 ? "future" : "planned"}
                                style={{ height: `${Math.max(0.3, height - 0.12) * 100}%` }}
                              />
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 flex justify-between">
                          <span className="hito-chart-note">Wk 1</span>
                          <span className="hito-chart-note">Wk 4</span>
                        </div>
                      </div>
                      <div>
                        <p className="hito-list-row-title">Result status strip</p>
                        <p className="hito-list-row-copy mt-1">
                          Status fills use the same completed, partial, skipped tone rules as
                          legends.
                        </p>
                        <div className="mt-4 flex gap-2" aria-hidden="true">
                          <span
                            className="hito-comparison-bar h-16 flex-1"
                            data-status="completed"
                            style={
                              { "--hito-comparison-bar-color": "var(--easy)" } as CSSProperties
                            }
                          />
                          <span className="hito-comparison-bar h-16 flex-1" data-status="partial" />
                          <span className="hito-comparison-bar h-16 flex-1" data-status="skipped" />
                          <span className="hito-comparison-bar h-16 flex-1" data-status="planned" />
                        </div>
                        <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                          {["Done", "Partial", "Skipped", "Quiet"].map((label) => (
                            <span key={label} className="hito-chart-note">
                              {label}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="hito-row-group mt-5">
                    <div className="hito-list-row items-start">
                      <div>
                        <p className="hito-label">Allowed geometry exceptions</p>
                        <p className="hito-list-row-copy">
                          Bar height/width, plotted lines, interval block widths, SVG silhouettes,
                          and marker coordinates remain visualization geometry. Bar chrome, labels,
                          captions, legends, rows, and tooltips use Hito primitives.
                        </p>
                      </div>
                      <span className="hito-caption">Exception</span>
                    </div>
                  </div>
                </section>
              </>
            ) : null}

            {pageId === "components" ? (
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
                            className={cn(
                              "hito-list-row min-w-0",
                              rowDensity === "compact" && "py-2",
                            )}
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
                              <span className="hito-list-row-title block">
                                Destructive override
                              </span>
                              <span className="hito-body-small block">
                                Available, but not a permanent sibling to the safe action.
                              </span>
                            </span>
                            <Icon name="chevron-down" className="hito-disclosure-chevron" />
                          </summary>
                          <div className="hito-disclosure-body">
                            <button
                              type="button"
                              className="hito-button hito-button-outlined hito-button-sm"
                            >
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
                          Icon, text, helper copy, meta, metric, disabled, and quiet utility rows
                          share the same row grammar.
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
                          Rare or risky actions stay discoverable without competing with safe
                          primary rows.
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
                                {shellContext === "runner"
                                  ? "Half Marathon Plan"
                                  : "Admin workspace"}
                              </span>
                            )}
                          </span>
                          <Icon
                            name="chevron-down"
                            size="sm"
                            className="shrink-0 text-muted-foreground"
                          />
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
                          Context changes labels and destination meaning, but keeps the same shell
                          row, active dot, profile trigger, and menu-row anatomy.
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
                                    <Icon
                                      name={icon as HitoIconName}
                                      className="hito-shell-nav-icon"
                                    />
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
                          The profile trigger and utility rows use menu typography and quiet
                          metadata, not duplicated page identity.
                        </p>
                        <div className="mt-4 grid min-w-0 gap-4 xl:grid-cols-2">
                          <button type="button" className="hito-shell-profile-trigger min-w-0">
                            <span className="hito-shell-avatar-fallback h-9 w-9 rounded-full">
                              IR
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="hito-menu-text block truncate">Ivan</span>
                              <span className="hito-menu-meta block truncate">Manual plan</span>
                            </span>
                            <Icon
                              name="chevron-down"
                              size="sm"
                              className="shrink-0 text-muted-foreground"
                            />
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
            ) : null}

            {pageId === "overview" ? (
              <>
                <section id="figma-bridge" className="ds-section">
                  <div className="hito-specimen-header">
                    <SectionIntro
                      label="Tools / Bridge"
                      title="Code-owned DS export, ready for downstream Figma capture."
                      body="Use this entrypoint to find the existing html.to.design capture board. Runtime Hito code and these DS owners remain source of truth; Figma import is a downstream handoff artifact."
                    />
                    <HitoMetadataTag tone="signal">Bridge</HitoMetadataTag>
                  </div>

                  <div className="hito-reference-list">
                    <div className="hito-list-row items-start">
                      <div className="min-w-0">
                        <p className="hito-label">Export route</p>
                        <p className="hito-list-row-title mt-2">
                          Open the capture board for html.to.design.
                        </p>
                        <div className="hito-list-row-copy mt-2">
                          <ProductLinks
                            links={[
                              { href: "/hitoDS/export/figma", label: "/hitoDS/export/figma" },
                            ]}
                          />
                        </div>
                      </div>
                    </div>
                    <ReferenceListRow
                      label="Purpose"
                      title="Capture explicit DS matrices, not product runtime flows."
                      body="The export board renders foundations, controls, menu rows, status surfaces, and icon inventory as visible states so html.to.design can import editable Figma layers."
                    />
                    <ReferenceListRow
                      label="Source"
                      title="Code stays canonical."
                      body="The board reuses live Hito DS classes, wrappers, tokens, and specimens. Figma receives a handoff snapshot; it does not become runtime truth or a hidden token source."
                    />
                    <ReferenceListRow
                      label="Boundary"
                      title="No .h2d generator, Figma mutation, or Code Connect in this slice."
                      body="Use html.to.design, the browser extension, or supported local file import downstream. Hito does not write binary .h2d artifacts or mutate Figma files from this route."
                    />
                  </div>
                </section>

                <section id="shared-wrappers" className="ds-section">
                  <div className="hito-specimen-header">
                    <SectionIntro
                      label="Compatibility reference"
                      title="Wrapper exports stay stable; component owners live elsewhere."
                      body="Shared ui wrappers keep Radix behavior and compatibility exports, but they are no longer the primary specimen owner for Hito component anatomy."
                    />
                    <HitoMetadataTag tone="muted">Reference</HitoMetadataTag>
                  </div>

                  <div className="hito-reference-list">
                    <div className="hito-list-row items-start">
                      <div className="min-w-0">
                        <p className="hito-label">Canonical owners</p>
                        <p className="hito-list-row-title mt-2">
                          Read component behavior in the accepted owner sections.
                        </p>
                        <div className="hito-list-row-copy mt-2">
                          <ProductLinks
                            links={[
                              { href: "/hitoDS/components#dropdowns", label: "Dropdowns" },
                              { href: "/hitoDS/components#inputs", label: "Inputs" },
                              { href: "/hitoDS/components#selection-controls", label: "Selection" },
                              { href: "/hitoDS/components#modals", label: "Modals" },
                              { href: "/hitoDS/components#rows", label: "Rows" },
                              { href: "/hitoDS/components#shell", label: "Shell" },
                              { href: "/hitoDS/components#status", label: "Status" },
                              { href: "/hitoDS/components#async-actions", label: "Async" },
                            ]}
                          />
                        </div>
                      </div>
                    </div>
                    <ReferenceListRow
                      label="Compatibility"
                      title="Wrapper imports and exports remain stable."
                      body="Dialog, sheet, dropdown, select, card, progress, and related ui wrapper exports keep their existing API, keyboard, focus, portal, and controlled/uncontrolled behavior."
                    />
                    <ReferenceListRow
                      label="Defaults"
                      title="Hito tokens start the chrome, not the ownership."
                      body="Wrapper defaults may carry Hito surface, field, menu, focus, overlay, or progress tokens, but final product anatomy belongs to the accepted owner sections above."
                    />
                    <ReferenceListRow
                      label="Boundary"
                      title="Do not treat wrappers as a second design system."
                      body="Use wrappers for behavior and compatibility. Use owner sections for visual anatomy, state matrices, usage rules, and product-facing DS guidance."
                    />
                  </div>
                </section>

                <section id="backlog" className="ds-section">
                  <SectionIntro
                    label="Backlog"
                    title="Known DS exceptions and rollout gaps."
                    body="This section keeps the workbench honest: these areas are intentionally route-owned or waiting for a later bounded DS cleanup slice."
                  />
                  <div className="hito-reference-list">
                    <ReferenceListRow
                      label="Local"
                      title="Chart geometry remains route-owned"
                      body="Bar heights, widths, axis density, and visualization coordinates stay with the product route unless a repeated visualization primitive emerges."
                    />
                    <ReferenceListRow
                      label="Local"
                      title="Timeline grid and sticky scope remain route-owned"
                      body="The DS owns editorial timeline typography, backdrop, dots, and inline code; changelog grouping, rail layout, and sticky boundaries stay with `/changelog`."
                    />
                    <ReferenceListRow
                      label="In rollout"
                      title="More interactive explorers can follow"
                      body="Select, dropdown/menu, async toast lifecycle, shell rows, and deeper pattern references can become standardized specimens only when a concrete QA or product-consumer need appears."
                    />
                    <ReferenceListRow
                      label="Temporary"
                      title="Compatibility wrappers stay small"
                      body="Radix/shadcn wrapper exports remain stable while their default visuals continue moving under Hito DS ownership."
                    />
                  </div>
                </section>
              </>
            ) : null}

            <HitoDsPagePager currentPageId={pageId} />
          </div>
        </main>
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
          <button
            key={color.token}
            type="button"
            className="group grid min-h-36 content-between rounded-2xl border border-hairline p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-signal/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            style={
              {
                background: color.value,
                color: color.contrast.startsWith("light") ? "var(--sand-100)" : "var(--stone-900)",
              } satisfies CSSProperties
            }
            onClick={() => onCopy(color.hex, color.token)}
            aria-label={`Copy ${color.token} hex ${color.hex}`}
          >
            <span className="flex items-start justify-between gap-3">
              <span className="hito-technical-mono text-lg">{color.step}</span>
              <span className="rounded-full bg-black/20 px-2 py-1 text-[0.625rem] font-medium uppercase tracking-[0.12em] backdrop-blur-sm">
                {color.contrast}
              </span>
            </span>
            <span className="flex items-center justify-between gap-3">
              <span>
                <span className="block hito-technical-mono">{color.hex}</span>
                <span className="mt-1 block text-[0.7rem] opacity-80">{color.token}</span>
              </span>
              <Icon
                name="copy"
                size="xs"
                className="opacity-0 transition group-hover:opacity-80 group-focus-visible:opacity-100"
              />
            </span>
          </button>
        ))}
      </div>
    </section>
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

function getSectionIdFromHash(hash: string): SectionId | null {
  const hashSectionId = hash.replace("#", "");
  return SECTIONS.some((section) => section.id === hashSectionId)
    ? (hashSectionId as SectionId)
    : null;
}

function getHitoDsPage(pageId: HitoDsPageId) {
  return HITO_DS_PAGES.find((page) => page.id === pageId) ?? HITO_DS_PAGES[0];
}

function getHitoDsPageForSection(sectionId: SectionId) {
  const page = HITO_DS_PAGES.find((candidate) =>
    candidate.sections.some((section) => section.id === sectionId),
  );

  if (page) {
    return page;
  }

  const supportSection = SUPPORT_SECTIONS.find((section) => section.id === sectionId);
  return supportSection ? getHitoDsPage(supportSection.pageId) : null;
}

function getHitoDsPageIndex(pageId: HitoDsPageId) {
  return HITO_DS_PAGES.findIndex((page) => page.id === pageId);
}

function getSelectionKindLabel(kind: SelectionControlKind) {
  if (kind === "toggle") {
    return "Toggle";
  }

  return kind;
}

function isBinarySelectionSize(size: ChoiceToggleSize): size is SelectionBinarySize {
  return size === "sm" || size === "md";
}

function HitoDsNestedNav({
  idPrefix,
  activePageId,
  onNavigate,
}: {
  idPrefix: string;
  activePageId: HitoDsPageId;
  onNavigate?: () => void;
}) {
  return (
    <nav className="hito-ds-sidebar-tree" aria-label="Hito DS pages">
      {HITO_DS_PAGES.map((page) => {
        const pageActive = activePageId === page.id;
        const childrenId = `${idPrefix}-${page.id}-sections`;
        return (
          <div key={page.id} className="hito-ds-sidebar-group">
            <a
              href={page.path}
              className="hito-ds-sidebar-link hito-nav-text"
              data-active={pageActive ? "true" : undefined}
              aria-current={pageActive ? "page" : undefined}
              onClick={onNavigate}
            >
              <span className="hito-ds-sidebar-link-marker" aria-hidden="true" />
              <span className="hito-ds-sidebar-link-label">{page.label}</span>
            </a>

            {pageActive ? (
              <div
                id={childrenId}
                className="hito-ds-sidebar-children"
                role="group"
                aria-label={`${page.label} sections`}
              >
                {page.sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="hito-ds-sidebar-child-link"
                    onClick={onNavigate}
                  >
                    {section.label}
                  </a>
                ))}
                {page.id === "overview"
                  ? SUPPORT_SECTIONS.map((section) => (
                      <a
                        key={section.id}
                        href={`#${section.id}`}
                        className="hito-ds-sidebar-child-link"
                        onClick={onNavigate}
                      >
                        {section.label}
                      </a>
                    ))
                  : null}
              </div>
            ) : null}
          </div>
        );
      })}
      <a
        href="/hitoDS/export/figma"
        className="hito-ds-sidebar-link hito-nav-text"
        onClick={onNavigate}
      >
        <span className="hito-ds-sidebar-link-marker" aria-hidden="true" />
        <span className="hito-ds-sidebar-link-label">Figma export</span>
      </a>
    </nav>
  );
}

function HitoDsPagePager({ currentPageId }: { currentPageId: HitoDsPageId }) {
  const pageIndex = getHitoDsPageIndex(currentPageId);
  const previousPage = pageIndex > 0 ? HITO_DS_PAGES[pageIndex - 1] : null;
  const nextPage = pageIndex >= 0 ? HITO_DS_PAGES[pageIndex + 1] : null;

  if (!previousPage && !nextPage) {
    return null;
  }

  return (
    <nav
      className="hito-reference-note mt-10 grid gap-3 p-4 sm:grid-cols-2"
      aria-label="Hito DS page navigation"
    >
      {previousPage ? (
        <a href={previousPage.path} className="hito-button hito-button-secondary hito-button-md">
          <Icon name="chevron-left" size="sm" decorative />
          Previous: {previousPage.label}
        </a>
      ) : (
        <span />
      )}
      {nextPage ? (
        <a
          href={nextPage.path}
          className="hito-button hito-button-primary hito-button-md sm:justify-self-end"
        >
          Next: {nextPage.label}
          <Icon name="chevron-right" size="sm" decorative />
        </a>
      ) : null}
    </nav>
  );
}

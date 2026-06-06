import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { APP_NAME } from "@/lib/app-config";
import loginDesertHorizon from "@/assets/marketing/hero-background/login-desert-horizon.jpg";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CalendarWorkoutPlayground } from "@/components/hito-ds/calendar-workout-playground";
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

const NAV_GROUPS = [
  {
    id: "overview-group",
    label: "Overview",
    sections: [{ id: "overview", label: "Start here" }],
  },
  {
    id: "foundations-group",
    label: "Foundations",
    sections: [
      { id: "brand", label: "Brand" },
      { id: "foundations", label: "Tokens" },
      { id: "typography", label: "Typography" },
      { id: "gradient-overlays", label: "Gradients" },
      { id: "icons", label: "Icons" },
    ],
  },
  {
    id: "components-group",
    label: "Components",
    sections: [
      { id: "buttons", label: "Buttons" },
      { id: "inputs", label: "Inputs" },
      { id: "tabs", label: "Tabs" },
      { id: "status", label: "Status" },
      { id: "selection-controls", label: "Selection" },
      { id: "modals", label: "Modals" },
      { id: "dropdowns", label: "Dropdowns" },
      { id: "shared-wrappers", label: "Wrappers" },
    ],
  },
  {
    id: "patterns-group",
    label: "Patterns",
    sections: [
      { id: "editorial-patterns", label: "Editorial" },
      { id: "data-table", label: "Tables" },
      { id: "surfaces", label: "Composition" },
      { id: "async-actions", label: "Async toasts" },
      { id: "states", label: "States" },
      { id: "calendar-workout-playground", label: "Calendar" },
      { id: "analytics", label: "Summary truth" },
      { id: "rows", label: "Rows" },
      { id: "shell", label: "Shell nav" },
    ],
  },
  {
    id: "backlog-group",
    label: "Backlog",
    sections: [{ id: "backlog", label: "Known gaps" }],
  },
] as const;

const SECTIONS = NAV_GROUPS.flatMap((group) => group.sections);

type NavGroupId = (typeof NAV_GROUPS)[number]["id"];
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
const MODAL_BODY_MODES = ["content-fit", "scroll-fill"] as const;
const MODAL_HEADER_MODES = ["compact", "large"] as const;
const MODAL_FOOTER_MODES = ["none", "actions", "note-actions"] as const;
const TAB_STYLES = ["simple", "enclosed"] as const;
const STATUS_TONES = ["neutral", "signal", "success", "warning", "destructive"] as const;
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
type ModalBodyMode = (typeof MODAL_BODY_MODES)[number];
type ModalHeaderMode = (typeof MODAL_HEADER_MODES)[number];
type ModalFooterMode = (typeof MODAL_FOOTER_MODES)[number];
type TabStyle = (typeof TAB_STYLES)[number];
type StatusTone = (typeof STATUS_TONES)[number];
type SpecimenStatus = "Core" | "Pattern" | "Exception" | "Legacy" | "In rollout";
type SpecimenStatusTone = "signal" | "neutral" | "warning" | "destructive" | "rollout";
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
  const [activeSectionId, setActiveSectionId] = useState<SectionId>("overview");
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
  const [tabStyle, setTabStyle] = useState<TabStyle>("enclosed");
  const [tabIcon, setTabIcon] = useState(true);
  const [tabBadge, setTabBadge] = useState(true);
  const [tabDot, setTabDot] = useState(true);
  const [tabDisabled, setTabDisabled] = useState(true);
  const [statusTone, setStatusTone] = useState<StatusTone>("signal");
  const [statusIcon, setStatusIcon] = useState(true);
  const [statusLongLabel, setStatusLongLabel] = useState(false);
  const [selectionKind, setSelectionKind] = useState<SelectionControlKind>("toggle");
  const [selectionSize, setSelectionSize] = useState<ChoiceToggleSize>("md");
  const [selectionSelected, setSelectionSelected] = useState(true);
  const [selectionDisabled, setSelectionDisabled] = useState(false);
  const [selectionInvalid, setSelectionInvalid] = useState(false);
  const [selectionFocusDemo, setSelectionFocusDemo] = useState(false);
  const [selectionAccentMode, setSelectionAccentMode] = useState(false);
  const [modalBodyMode, setModalBodyMode] = useState<ModalBodyMode>("content-fit");
  const [modalHeaderMode, setModalHeaderMode] = useState<ModalHeaderMode>("compact");
  const [modalFooterMode, setModalFooterMode] = useState<ModalFooterMode>("actions");
  const [modalStatusPill, setModalStatusPill] = useState(true);
  const [modalDestructive, setModalDestructive] = useState(false);
  const [modalLongContent, setModalLongContent] = useState(false);
  const [dataTableSortable, setDataTableSortable] = useState(true);
  const [dataTableActiveSort, setDataTableActiveSort] = useState(true);
  const [dataTableFiltered, setDataTableFiltered] = useState(true);
  const [dataTableStaticMode, setDataTableStaticMode] = useState(false);
  const [dataTableUtilityRow, setDataTableUtilityRow] = useState(true);
  const [toastDemoState, setToastDemoState] = useState<AsyncToastDemoState>("working");
  const toastDemoTimerRef = useRef<number | null>(null);
  const activeNavGroup = getNavGroupForSection(activeSectionId);
  const activeSection =
    SECTIONS.find((section) => section.id === activeSectionId) ?? activeNavGroup.sections[0];

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

    const sectionIds = new Set<SectionId>(SECTIONS.map((section) => section.id));
    const getHashSection = (): SectionId | null => {
      const hash = window.location.hash.replace("#", "");
      return sectionIds.has(hash as SectionId) ? (hash as SectionId) : null;
    };
    const updateFromHash = () => {
      const hashSection = getHashSection();
      if (hashSection) {
        setActiveSectionId(hashSection);
      }
    };

    updateFromHash();

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visibleEntry?.target.id && sectionIds.has(visibleEntry.target.id as SectionId)) {
          setActiveSectionId(visibleEntry.target.id as SectionId);
        }
      },
      {
        rootMargin: "-18% 0px -64% 0px",
        threshold: [0.1, 0.35, 0.6],
      },
    );

    SECTIONS.forEach((section) => {
      const sectionNode = document.getElementById(section.id);
      if (sectionNode) {
        observer.observe(sectionNode);
      }
    });

    window.addEventListener("hashchange", updateFromHash);

    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", updateFromHash);
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
    <div className="min-h-screen bg-background text-foreground hito-canvas-atmosphere">
      <div className="hito-workbench-shell">
        <aside className="hito-workbench-sidebar px-5 py-6">
          <div>
            <div className="hito-panel-title">hito ds</div>
            <p className="hito-label mt-2">Component system</p>
          </div>

          <nav className="mt-10 grid gap-4" aria-label="Hito DS sections">
            <div className="grid gap-1">
              {NAV_GROUPS.map((group) => {
                const firstSection = group.sections[0];
                const active = activeNavGroup.id === group.id;
                return (
                  <a
                    key={group.id}
                    href={`#${firstSection.id}`}
                    data-active={active}
                    className="hito-ds-sidebar-link hito-nav-text"
                  >
                    <span className="hito-ds-sidebar-link-marker" aria-hidden="true" />
                    {group.label}
                  </a>
                );
              })}
            </div>

            <div className="border-t border-hairline pt-3">
              <p className="hito-micro-label mb-2">{activeNavGroup.label}</p>
              <div className="grid gap-1">
                {activeNavGroup.sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    data-active={activeSectionId === section.id}
                    className="hito-ds-sidebar-child-link"
                  >
                    {section.label}
                  </a>
                ))}
              </div>
            </div>
          </nav>

          <div className="mt-10 border-t border-hairline pt-5">
            <p className="hito-label hito-label-signal">Rule</p>
            <p className="hito-list-row-copy">
              This page follows the live product: open rhythm first, cards only when they earn it.
            </p>
          </div>
        </aside>

        <main className="hito-workbench-main">
          <div className="hito-workbench-topbar lg:hidden">
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="hito-workbench-location">
                <span className="hito-workbench-location-title">Hito DS</span>
                <span className="hito-workbench-location-meta">
                  <span>{activeNavGroup.label}</span>
                  <span aria-hidden="true">/</span>
                  <span>{activeSection.label}</span>
                </span>
              </div>
              <HitoLogoMark decorative className="text-foreground [--hito-logo-height:1.65rem]" />
            </div>
            <nav className="hito-workbench-section-rail" aria-label="Hito DS quick links">
              <div className="hito-workbench-quick-links">
                {activeNavGroup.sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="hito-workbench-quick-link"
                    data-active={activeSectionId === section.id ? "true" : undefined}
                    aria-current={activeSectionId === section.id ? "location" : undefined}
                  >
                    {section.label}
                  </a>
                ))}
              </div>
            </nav>
          </div>

          <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10 lg:py-10">
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
                      Use year, month, and day roles for sticky editorial timeline rails. Layout and
                      sticky scope stay with the route.
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
                            Timeline entries use a calm backdrop and preserve technical chips like{" "}
                            <code className="hito-inline-code">hito-inline-code</code> inside
                            readable release copy.
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
                            <h3 className="hito-panel-title text-foreground">Behind the scenes</h3>
                          </div>
                          <p className="hito-body-small mt-2 leading-relaxed text-muted-foreground">
                            Quiet entries stay legible without turning editorial history into card
                            soup.
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
                    title="Do not replace product status pills"
                    body="Highlight tags are title-adjacent text highlights, not pills. Operational state still belongs to status pills and state surfaces."
                  />
                  <ReferenceListRow
                    label="Scope"
                    title="Keep grid and sticky mechanics local"
                    body="The DS owns typography, backdrop, dots, tags, and inline code. Each route owns its own timeline grid, sticky rail scope, and content ordering."
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
                      Use <code className="hito-inline-code">hito-canvas-atmosphere</code> for large
                      app canvases and internal reference pages, not nested cards.
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
                        <h3 className="hito-panel-title mt-3">Readable copy over atmosphere.</h3>
                        <p className="hito-body-small mt-3 max-w-sm text-muted-foreground">
                          Use <code className="hito-inline-code">hito-auth-photo-overlay</code> only
                          where imagery needs a controlled readability layer.
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
                      Alpha surfaces belong on auth/photo or launcher canvases. Use standard solid
                      Hito surfaces for normal forms, menus, inputs, and tables.
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
                        Semantic tokens are the product API. Primitive swatches document the solid
                        Hito palette underneath them; alpha overlays and gradients stay semantic
                        because they describe usage context.
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
                          primitive colors, alpha mixes, or documented gradient/overlay classes, but
                          product code should use the semantic token or recipe.
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
                <div className="hito-reference-note flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="hito-label">Canonical sizing</p>
                    <p className="hito-body-small mt-2 max-w-3xl">
                      Icons use four sizes only: xs 14, sm 16, md 20, and lg 24. Small icons use a
                      1.75 stroke by default; medium and large icons use 1.5. Preview the registry
                      at one size at a time to inspect names and shapes without repeated rows.
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

            <SpecimenSection
              id="buttons"
              label="Buttons"
              title="Variants, sizes, icons, disabled state."
              body="Use the builder to check CTA hierarchy and icon rhythm across the canonical button system."
              preview={
                <>
                  <p className="hito-label">Current button</p>
                  <div className="flex flex-wrap items-center gap-4">
                    <DemoButton
                      variant={variant}
                      tone={buttonTone}
                      size={size}
                      leftIcon={leftIcon}
                      rightIcon={rightIcon}
                      disabled={disabled || buttonLoading}
                      loading={buttonLoading}
                    />
                    <span className="hito-caption">
                      {variant} / {buttonTone} / {size} /{" "}
                      {buttonLoading ? "loading" : disabled ? "disabled" : "enabled"}
                    </span>
                  </div>
                  <div className="border-t border-hairline pt-5">
                    <p className="hito-label">Required states</p>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <DemoButton variant={variant} tone={buttonTone} size="sm" />
                      <DemoButton variant={variant} tone={buttonTone} size="sm" demoState="hover" />
                      <DemoButton variant={variant} tone={buttonTone} size="sm" demoState="focus" />
                      <DemoButton variant={variant} tone={buttonTone} size="sm" disabled />
                      <DemoButton variant={variant} tone={buttonTone} size="sm" loading disabled />
                    </div>
                  </div>
                </>
              }
              controls={
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
              }
              contract={[
                {
                  label: "Use for",
                  body: "Primary actions, secondary actions, utility actions, and bounded destructive confirmations.",
                },
                {
                  label: "Do not use for",
                  body: "Navigation tabs, selectable values, status labels, or passive metadata.",
                },
                {
                  label: "Variants",
                  body: "Primary, secondary, outlined, ghost; tones are default, success, and error.",
                },
                {
                  label: "States",
                  body: "Default, hover, focus-visible, disabled, and loading are inspectable in the preview.",
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
            >
              <div className="mt-6 border-t border-hairline pt-5">
                <p className="hito-label">Hierarchy × tone</p>
                <div className="mt-4 grid gap-3">
                  {BUTTON_TONES.map((tone) => (
                    <div key={tone} className="flex flex-wrap items-center gap-3">
                      <span className="hito-micro-label w-16">{tone}</span>
                      {BUTTON_VARIANTS.map((item) => (
                        <DemoButton key={`${tone}-${item}`} variant={item} tone={tone} size="sm" />
                      ))}
                    </div>
                  ))}
                </div>
                <p className="hito-caption mt-3 max-w-2xl">
                  Default primary stays signal/orange. Secondary stays soft and borderless. Outlined
                  stays border-led. Success and error are semantic tones, not separate button
                  families.
                </p>
              </div>
            </SpecimenSection>

            <SpecimenSection
              id="tabs"
              label="Tabs"
              title="Simple and enclosed mode switches."
              body="Tabs organize nearby views without becoming another card system. Use simple tabs for calm page-level switches and enclosed tabs when a local control cluster needs a stronger boundary."
              preview={
                <>
                  <p className="hito-label">Current tabs</p>
                  <div className="min-w-0 overflow-x-auto pb-1">
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
                  <div className="border-t border-hairline pt-5">
                    <p className="hito-label">Required states</p>
                    <div
                      className="hito-tabs hito-tabs-simple mt-4"
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
                </>
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
              contract={[
                {
                  label: "Use for",
                  body: "Navigation between sibling panels, setup modes, and route-local views.",
                },
                {
                  label: "Do not use for",
                  body: "Choosing values like size, tone, weekday, or variant; use choice toggles for those.",
                },
                { label: "Variants", body: "Simple underline tabs and enclosed inset tabs." },
                { label: "States", body: "Active, inactive, hover, focus-visible, and disabled." },
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

            <SpecimenSection
              id="data-table"
              label="Data table"
              title="Header controls keep sorting and filtering in context."
              body="Operational tables use one Hito header typography for sortable and non-sortable columns. Sort/filter state belongs in the header control, while static headers stay visually aligned without becoming clickable."
              status="Pattern"
              preview={
                <DataTableSpecimenPreview
                  sortable={dataTableSortable}
                  activeSort={dataTableActiveSort}
                  filtered={dataTableFiltered}
                  staticMode={dataTableStaticMode}
                  showUtilityRow={dataTableUtilityRow}
                />
              }
              controls={
                <div className="grid gap-4 p-4">
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
              contract={[
                {
                  label: "Use for",
                  body: "Operational data where sorting, filtering, scanning, and horizontal overflow containment matter.",
                },
                {
                  label: "Do not use for",
                  body: "Marketing cards, metric summaries, form layouts, or route-local lists that do not need table semantics.",
                },
                {
                  label: "Variants",
                  body: "Sortable header buttons, filtered header indicators, static headers, compact utility rows, and contained scroll regions.",
                },
                {
                  label: "States",
                  body: "Default, hover/demo hover, active sort with aria-sort, filtered signal dot, focus-visible, and non-interactive static.",
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

            <section id="shared-wrappers" className="ds-section">
              <SectionIntro
                label="Shared interaction wrappers"
                title="Radix behavior, Hito defaults."
                body="The shared ui wrappers keep their existing exports and accessibility semantics, but their default chrome now starts from Hito tokens instead of generic shadcn styling."
              />

              <div className="grid gap-6">
                <div className="grid gap-5 xl:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Low-card wrapper</CardTitle>
                      <CardDescription>
                        Card defaults stay calm: hairline, low surface, Hito title/body roles.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Progress value={64} aria-label="Shared wrapper progress example" />
                      <p className="hito-caption mt-3">
                        Progress uses muted track plus signal fill without becoming a chart system.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Select and menu chrome</CardTitle>
                      <CardDescription>
                        Select and dropdown content share the Hito menu surface and row rhythm.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3 sm:grid-cols-2">
                      <Select defaultValue="easy">
                        <SelectTrigger aria-label="Workout type">
                          <SelectValue placeholder="Workout type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy run</SelectItem>
                          <SelectItem value="long">Long run</SelectItem>
                          <SelectItem value="quality">Quality</SelectItem>
                        </SelectContent>
                      </Select>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="hito-button hito-button-secondary hito-button-md">
                            Open menu
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuLabel>Plan actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            Download JSON
                            <DropdownMenuShortcut>Utility</DropdownMenuShortcut>
                          </DropdownMenuItem>
                          <DropdownMenuItem>Open settings</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Dialog and sheet surfaces</CardTitle>
                      <CardDescription>
                        Dialog and sheet wrappers inherit Hito overlay, elevated surface, title,
                        description, close, and footer defaults.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-3">
                      <Dialog>
                        <DialogTrigger asChild>
                          <button className="hito-button hito-button-primary hito-button-md">
                            Open dialog
                          </button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Shared dialog</DialogTitle>
                            <DialogDescription>
                              The primitive owns calm default chrome. Product dialogs can still opt
                              into their stable bounded anatomy.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <DialogClose className="hito-button hito-button-secondary hito-button-md">
                              Close
                            </DialogClose>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Sheet>
                        <SheetTrigger asChild>
                          <button className="hito-button hito-button-secondary hito-button-md">
                            Open sheet
                          </button>
                        </SheetTrigger>
                        <SheetContent>
                          <SheetHeader>
                            <SheetTitle>Shared sheet</SheetTitle>
                            <SheetDescription>
                              Sheets use the same Hito overlay and elevated surface language without
                              becoming another product shell.
                            </SheetDescription>
                          </SheetHeader>
                        </SheetContent>
                      </Sheet>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Sidebar ownership</CardTitle>
                      <CardDescription>
                        Sidebar wrappers keep layout behavior, while rows inherit Hito shell/menu
                        text and low-chrome active states.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="hito-ui-sidebar-panel rounded-xl border p-3">
                        <div className="grid gap-1">
                          <div
                            className="hito-ui-sidebar-row rounded-md px-2 py-2"
                            data-active="true"
                          >
                            Overview
                          </div>
                          <div className="hito-ui-sidebar-row rounded-md px-2 py-2">Feedback</div>
                          <div className="hito-ui-sidebar-row rounded-md px-2 py-2">
                            Test accounts
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="hito-reference-list">
                  <ReferenceListRow
                    label="Behavior"
                    title="Semantics stay with Radix"
                    body="Dialog, sheet, dropdown, select, progress, card, and sidebar exports remain stable. Keyboard, focus, portal, and controlled/uncontrolled behavior are unchanged."
                  />
                  <ReferenceListRow
                    label="Defaults"
                    title="Hito starts the visual contract"
                    body="Wrapper defaults now use Hito surfaces, menu rows, field focus, signal progress, and calm overlay tokens before product-specific classes are added."
                  />
                  <ReferenceListRow
                    label="Boundary"
                    title="No decorative gradients for controls"
                    body="These wrappers are ordinary interaction primitives. They should not inherit launcher/editorial gradient rules by default."
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

              <div className="hito-specimen">
                <div className="hito-specimen-grid">
                  <div className="hito-specimen-controls lg:order-2">
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

                  <div className="hito-specimen-preview lg:order-1">
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
                        <p className="hito-label">Date and time inputs</p>
                        <p className="hito-caption mt-2 max-w-2xl">
                          Date/time truth stays ISO or duration-shaped in state. Calendar selection,
                          typed date entry, compact optional date chips, and masked time entry share
                          the same Hito field rhythm. The date input is the picker trigger; the
                          calendar icon is an inline affordance, not a separate adjacent button.
                        </p>
                      </div>
                      <div className="hito-reference-list">
                        <article className="hito-reference-row items-start">
                          <div>
                            <p className="hito-list-row-title">Date picker field</p>
                            <p className="hito-caption mt-2">
                              Use for required or visible dates such as target race day. The input
                              stays controlled as YYYY-MM-DD, opens the calendar on focus or click,
                              and remains typeable while the picker is open.
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
                              Error, disabled, and bounded date states stay in the same field-owned
                              anatomy. Min/max boundaries disable calendar days without adding
                              product scheduling rules.
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
                              Use for optional dates that should start compact, like first-plan
                              start date. Empty state is an action; saved state is visible and
                              editable.
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
                              Use for race targets and durations. Continuous digits normalize while
                              editing: 35000 becomes 3:50:00.
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
                      <div className="mb-4">
                        <p className="hito-label">Avatar tile action</p>
                        <p className="hito-caption mt-2 max-w-2xl">
                          Settings avatar controls use one rectangular tile and a same-width action.
                          Keep copy short: Upload for empty avatars, Edit when an image exists.
                        </p>
                      </div>
                      <div className="hito-reference-list mb-5">
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

                      <div className="border-t border-hairline pt-5">
                        <div className="mb-4">
                          <p className="hito-label">Editable value chip</p>
                          <p className="hito-caption mt-2 max-w-2xl">
                            Compact scalar facts use editable value chips, not full form cards or
                            normal text rows. Use for profile or settings values such as age,
                            height, or weight; avoid for long text and multi-step choices.
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
                                <Icon
                                  name="plus"
                                  size="sm"
                                  className="hito-editable-value-chip-icon"
                                />
                                <span className="hito-editable-value-chip-content">Age</span>
                              </button>
                              <button
                                type="button"
                                className="hito-editable-value-chip"
                                data-state="empty"
                              >
                                <Icon
                                  name="plus"
                                  size="sm"
                                  className="hito-editable-value-chip-icon"
                                />
                                <span className="hito-editable-value-chip-content">Height</span>
                              </button>
                              <button
                                type="button"
                                className="hito-editable-value-chip"
                                data-state="empty"
                              >
                                <Icon
                                  name="plus"
                                  size="sm"
                                  className="hito-editable-value-chip-icon"
                                />
                                <span className="hito-editable-value-chip-content">Weight</span>
                              </button>
                            </div>
                          </article>
                          <article className="hito-reference-row">
                            <div>
                              <p className="hito-list-row-title">Editing chip</p>
                              <p className="hito-caption mt-2">
                                The input is wider than the chip, stays the same height, and focuses
                                in place. Click-away discards unsaved text; only check commits.
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
                                Until the value is valid, the external control stays as
                                dismiss/cancel and does not save profile truth.
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
                                Compact uppercase label plus value. Pencil stays subtle and appears
                                on hover/focus.
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
                </div>
                <div className="hito-specimen-contract">
                  <div className="hito-specimen-contract-row">
                    <p className="hito-micro-label">Use for</p>
                    <p className="hito-list-row-copy">
                      Persisted settings, import forms, auth fields, search, and bounded text input.
                    </p>
                  </div>
                  <div className="hito-specimen-contract-row">
                    <p className="hito-micro-label">Do not use for</p>
                    <p className="hito-list-row-copy">
                      Status truth, selectable chips, tab navigation, or long prose display.
                    </p>
                  </div>
                  <div className="hito-specimen-contract-row">
                    <p className="hito-micro-label">Variants</p>
                    <p className="hito-list-row-copy">
                      Primary, secondary, textarea, icon-leading, icon-trailing, editable value
                      chips, date picker fields, optional date chips, and masked time fields.
                    </p>
                  </div>
                  <div className="hito-specimen-contract-row">
                    <p className="hito-micro-label">States</p>
                    <p className="hito-list-row-copy">
                      Default, hover, focus-visible, invalid, success, disabled, and readonly.
                    </p>
                  </div>
                  <div className="hito-specimen-contract-row">
                    <p className="hito-micro-label">Used in</p>
                    <ProductLinks
                      links={[
                        { href: "/login", label: "/login" },
                        { href: "/settings", label: "/settings" },
                        { href: "/admin/login", label: "/admin/login" },
                        { href: "/hitoDS", label: "/hitoDS" },
                      ]}
                    />
                  </div>
                </div>
              </div>
            </section>

            <SpecimenSection
              id="status"
              label="Status"
              title="Short truth labels and compact markers."
              body="Status pills and markers identify product state. They stay concise, semantic, and separate from headings, buttons, or editorial tags."
              preview={
                <>
                  <p className="hito-label">Current status</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className="hito-status-pill"
                      data-tone={statusTone === "neutral" ? undefined : statusTone}
                      data-icon={statusIcon ? undefined : "false"}
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
                  <div className="border-t border-hairline pt-5">
                    <p className="hito-label">Tone set</p>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
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
                </>
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
                    label="Icon dot"
                    active={statusIcon}
                    onToggle={() => setStatusIcon((v) => !v)}
                  />
                  <ToggleRow
                    label="Long label"
                    active={statusLongLabel}
                    onToggle={() => setStatusLongLabel((v) => !v)}
                  />
                </div>
              }
              contract={[
                {
                  label: "Use for",
                  body: "Short state identifiers such as active plan, pro feature, saved, warning, and feedback-ready states.",
                },
                {
                  label: "Do not use for",
                  body: "Clickable actions, marketing badges, changelog editorial highlights, or long explanations.",
                },
                {
                  label: "Variants",
                  body: "Pill and marker forms; tones are neutral, signal, success, warning, and destructive.",
                },
                {
                  label: "States",
                  body: "Status is display-only. Tone, optional icon dot, and concise label are the meaningful states.",
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

            <SpecimenSection
              id="selection-controls"
              label="Selection controls"
              title="Signal-selected, never browser-native."
              body="Checkboxes, radios, and toggle radios share Hito focus, disabled, invalid, and signal-selected states. Destructive confirmation uses warning copy and destructive buttons; the selected checkbox itself stays signal."
              preview={
                <>
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
                </>
              }
              controls={
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
                        selectionKind === "toggle" ? CHOICE_TOGGLE_SIZES : SELECTION_BINARY_SIZES
                      }
                      onChange={setSelectionSize}
                      textTransform="uppercase"
                    />
                  </div>
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
              }
              contract={[
                {
                  label: "Use for",
                  body: "Checkboxes for independent on/off choices, radios for one-of-many choices, and choice toggles for compact selectable values.",
                },
                {
                  label: "Do not use for",
                  body: "Navigation between panels, decorative tags, status pills, or destructive meaning. Destructive context belongs to warning copy and the final destructive button.",
                },
                {
                  label: "Variants",
                  body: "Checkbox sm/md, radio sm/md, functional choice-toggle xs/sm/md/lg/xl, plus separate accent/display choice for large planning moments.",
                },
                {
                  label: "States",
                  body: "Default, selected, hover, focus-visible, disabled, invalid, disabled selected, and destructive-confirmation context.",
                },
                {
                  label: "Used in",
                  body: (
                    <ProductLinks
                      links={[
                        { href: "/", label: "Calendar" },
                        { href: "/settings", label: "/settings" },
                        { href: "/hitoDS#inputs", label: "DS builders" },
                      ]}
                    />
                  ),
                },
              ]}
            >
              <div className="mt-6 grid gap-5">
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

                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.72fr)]">
                  <article className="hito-surface-flat p-5">
                    <p className="hito-label">Functional toggle scale</p>
                    <p className="hito-caption mt-2 max-w-xl">
                      The mixed-size row aligns to each control height instead of stretching every
                      item to the tallest toggle.
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
                        <div key={item} className="flex flex-wrap items-center gap-2">
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

                  <article className="hito-surface-flat p-5">
                    <p className="hito-label">Accent / display choice</p>
                    <p className="hito-caption mt-2">
                      Accent is not part of the functional size ladder. Use it only when the choice
                      is a large visual planning moment, such as race distance or goal direction.
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
                          <span className="mt-1 block text-current/70">Goal distance choice</span>
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
            </SpecimenSection>

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

            <SpecimenSection
              id="modals"
              label="Modals"
              title="Bounded panel, explicit body mode, reachable footer."
              body="Product dialogs share one stable overlay and panel recipe, then choose the body mode that matches the task. Short content fits naturally; tall workflows scroll internally."
              preview={
                <ModalWindowPreview
                  bodyMode={modalBodyMode}
                  headerMode={modalHeaderMode}
                  footerMode={modalFooterMode}
                  showStatusPill={modalStatusPill}
                  destructive={modalDestructive}
                  longContent={modalLongContent}
                />
              }
              controls={
                <div className="hito-row-group border-0">
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
                    label="Status pill"
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
              contract={[
                {
                  label: "Use for",
                  body: "Bounded tasks, review-before-apply flows, imports, body notes, active-plan management, and source-backed read-only explanations.",
                },
                {
                  label: "Do not use for",
                  body: "Global navigation, passive page sections, dashboard cards, or silent mutations. Use inline state when the task does not need interruption.",
                },
                {
                  label: "Variants",
                  body: "Body modes are content-fit and scroll-fill. Headers are compact or large. Footers can be none, actions, or note-actions.",
                },
                {
                  label: "States",
                  body: "Open overlay/content boundaries stay explicit for Safari stability; destructive scenarios are copy and button tone, not a separate window style.",
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
            >
              <div className="mt-6 grid gap-5">
                <div className="hito-reference-list">
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

                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="hito-row-group">
                    <ReferenceListRow
                      label="Header"
                      title="Compact or large"
                      body="Compact fits short tasks. Large can carry one label, status pill, or short description for lifecycle-heavy dialogs."
                    />
                    <ReferenceListRow
                      label="Header"
                      title="Close stays on the right"
                      body="The close affordance remains reachable and separate from primary task completion."
                    />
                  </div>
                  <div className="hito-row-group">
                    <ReferenceListRow
                      label="Footer"
                      title="No footer, actions, or note + actions"
                      body="Read-only windows can omit the footer. Focused workflows use cancel + primary. One short note may explain save/apply context."
                    />
                    <ReferenceListRow
                      label="Mutation"
                      title="Explicit task completion"
                      body="Keep current plan and Apply update are explicit choices, never silent mutation."
                    />
                  </div>
                </div>
              </div>
            </SpecimenSection>

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

            <CalendarWorkoutPlayground />

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
              <div className="hito-chart-section mt-5">
                <p className="hito-label">Visualization chrome</p>
                <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <div>
                    <p className="hito-list-row-title">Planned vs actual bars</p>
                    <p className="hito-list-row-copy mt-1">
                      DS owns the fill tones and compact notes. Height and scale remain local chart
                      geometry.
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
                      Status fills use the same completed, partial, skipped tone rules as legends.
                    </p>
                    <div className="mt-4 flex gap-2" aria-hidden="true">
                      <span
                        className="hito-comparison-bar h-16 flex-1"
                        data-status="completed"
                        style={{ "--hito-comparison-bar-color": "var(--easy)" } as CSSProperties}
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
                      Bar height/width, plotted lines, interval block widths, SVG silhouettes, and
                      marker coordinates remain visualization geometry. Bar chrome, labels,
                      captions, legends, rows, and tooltips use Hito primitives.
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
    <article className="grid justify-items-center gap-2 text-center">
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

function getNavGroupForSection(sectionId: SectionId) {
  return (
    NAV_GROUPS.find((group) => group.sections.some((section) => section.id === sectionId)) ??
    NAV_GROUPS[0]
  );
}

function SpecimenSection({
  id,
  label,
  title,
  body,
  status = "Core",
  preview,
  controls,
  contract,
  children,
}: {
  id: string;
  label: string;
  title: string;
  body: string;
  status?: SpecimenStatus;
  preview: ReactNode;
  controls: ReactNode;
  contract: Array<{ label: string; body: ReactNode }>;
  children?: ReactNode;
}) {
  const statusTone = getSpecimenStatusTone(status);

  return (
    <section id={id} className="ds-section">
      <div className="hito-specimen-header">
        <SectionIntro label={label} title={title} body={body} />
        <span className="hito-status-pill" data-tone={statusTone}>
          {status}
        </span>
      </div>
      <div className="hito-specimen">
        <div className="hito-specimen-grid">
          <article className="hito-specimen-preview">{preview}</article>
          <aside className="hito-specimen-controls" aria-label={`${title} controls`}>
            {controls}
          </aside>
        </div>
        <div className="hito-specimen-contract">
          {contract.map((row) => (
            <div key={row.label} className="hito-specimen-contract-row">
              <p className="hito-micro-label">{row.label}</p>
              <div className="hito-list-row-copy">{row.body}</div>
            </div>
          ))}
        </div>
      </div>
      {children}
    </section>
  );
}

function getSpecimenStatusTone(status: SpecimenStatus): SpecimenStatusTone {
  switch (status) {
    case "Core":
      return "signal";
    case "Pattern":
      return "neutral";
    case "Exception":
      return "warning";
    case "Legacy":
      return "destructive";
    case "In rollout":
      return "rollout";
  }
}

function ProductLinks({ links }: { links: Array<{ href: string; label: string }> }) {
  return (
    <span className="hito-specimen-links">
      {links.map((link) => (
        <a key={link.href} href={link.href} className="hito-specimen-link">
          {link.label}
        </a>
      ))}
    </span>
  );
}

function DataTableSpecimenPreview({
  sortable,
  activeSort,
  filtered,
  staticMode,
  showUtilityRow,
}: {
  sortable: boolean;
  activeSort: boolean;
  filtered: boolean;
  staticMode: boolean;
  showUtilityRow: boolean;
}) {
  const previewIsStatic = staticMode || !sortable;

  return (
    <div className="grid gap-4">
      {showUtilityRow && (
        <div className="hito-data-table-utility-row">
          <label className="hito-field hito-field-sm hito-data-table-search">
            <Icon name="search" size="xs" className="text-muted-foreground" />
            <input
              aria-label="Search data table specimen"
              className="hito-data-table-search-input"
              readOnly
              value="runner@hito.test"
            />
            <button
              type="button"
              className="hito-button hito-button-ghost hito-button-xs hito-data-table-search-clear"
              aria-label="Clear search"
            >
              <Icon name="close" size="xs" />
            </button>
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="hito-button hito-button-secondary hito-button-sm hito-data-table-filter-summary"
            >
              Filters · {filtered ? "1" : "0"}
            </button>
            <span className="hito-caption">3 rows</span>
          </div>
        </div>
      )}

      <div className="hito-data-table-scroll">
        <table className="hito-data-table min-w-[860px]">
          <caption className="sr-only">Hito data-table specimen preview.</caption>
          <thead>
            <tr>
              <th
                scope="col"
                aria-sort={!previewIsStatic && activeSort ? "descending" : undefined}
                className="whitespace-nowrap px-2 py-2 font-medium"
              >
                {previewIsStatic ? (
                  <DataTableStaticHeader label="Preview column" />
                ) : (
                  <DataTableHeaderButton
                    label="Preview column"
                    active={activeSort}
                    filtered={filtered}
                  />
                )}
              </th>
              <th scope="col" className="whitespace-nowrap px-2 py-2 font-medium">
                <DataTableHeaderButton label="Hover state" hover />
              </th>
              <th
                scope="col"
                aria-sort="descending"
                className="whitespace-nowrap px-2 py-2 font-medium"
              >
                <DataTableHeaderButton label="Active sort" active />
              </th>
              <th scope="col" className="whitespace-nowrap px-2 py-2 font-medium">
                <DataTableHeaderButton label="Filtered" filtered />
              </th>
              <th scope="col" className="whitespace-nowrap px-2 py-2 font-medium">
                <DataTableStaticHeader label="Static header" />
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="hito-data-table-cell hito-data-table-cell-start">
                {previewIsStatic ? "Non-interactive label" : "Header menu affordance"}
              </td>
              <td className="hito-data-table-cell">Subtle Hito wash</td>
              <td className="hito-data-table-cell">Signal arrow active</td>
              <td className="hito-data-table-cell">Circular filter dot</td>
              <td className="hito-data-table-cell hito-data-table-cell-end">
                Same typography, no click
              </td>
            </tr>
            <tr>
              <td className="hito-data-table-cell hito-data-table-cell-start">
                <code className="hito-technical-mono hito-data-table-code">
                  qa-runner@hito.test
                </code>
              </td>
              <td className="hito-data-table-cell">Keyboard reachable</td>
              <td className="hito-data-table-cell">aria-sort on th</td>
              <td className="hito-data-table-cell">Filter stays contextual</td>
              <td className="hito-data-table-cell hito-data-table-cell-end">Password</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="hito-caption">
        The scroll container owns horizontal overflow; the page canvas should not.
      </p>
    </div>
  );
}

function DataTableHeaderButton({
  label,
  active = false,
  filtered = false,
  hover = false,
}: {
  label: string;
  active?: boolean;
  filtered?: boolean;
  hover?: boolean;
}) {
  return (
    <button
      type="button"
      className="hito-button hito-button-ghost hito-button-xs hito-data-table-header-button"
      data-active={active || filtered ? "true" : undefined}
      data-demo-state={hover ? "hover" : undefined}
      aria-label={`Sort and filter ${label}`}
    >
      {label}
      {filtered ? <span className="hito-data-table-filter-dot" /> : null}
      <Icon
        aria-hidden="true"
        name="chevron-down"
        size="xs"
        className="hito-data-table-sort-indicator"
        data-active={active ? "true" : undefined}
      />
    </button>
  );
}

function DataTableStaticHeader({ label }: { label: string }) {
  return (
    <span className="hito-data-table-header hito-data-table-header-static" data-disabled="true">
      {label}
    </span>
  );
}

function ModalWindowPreview({
  bodyMode,
  headerMode,
  footerMode,
  showStatusPill,
  destructive,
  longContent,
}: {
  bodyMode: ModalBodyMode;
  headerMode: ModalHeaderMode;
  footerMode: ModalFooterMode;
  showStatusPill: boolean;
  destructive: boolean;
  longContent: boolean;
}) {
  const rows = longContent
    ? [
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
      ]
    : ["Active object summary", "Validation or proposal review", "Primary task content"];
  const title = destructive
    ? "Archive active plan?"
    : bodyMode === "scroll-fill"
      ? "Tall workflow modal"
      : "Short task modal";
  const description = destructive
    ? "Destructive meaning lives in the copy and final action, not in the window chrome."
    : bodyMode === "scroll-fill"
      ? "Use this when content can exceed the viewport but the footer must remain reachable."
      : "Use this when content can fit naturally without manufacturing empty height.";

  return (
    <article
      className={cn(
        "hito-window max-w-xl",
        bodyMode === "scroll-fill"
          ? "hito-window-scroll-fill h-[min(32rem,calc(100dvh-4rem))]"
          : "hito-window-content-fit",
      )}
    >
      <header
        className={cn(
          "hito-window-header",
          headerMode === "large" ? "hito-window-header-large" : "hito-window-header-compact",
        )}
      >
        <div>
          <p className="hito-label hito-label-signal">
            {headerMode === "large" ? "Large header + close" : "Compact header + close"}
          </p>
          <h3 className="hito-modal-title mt-2">{title}</h3>
          {headerMode === "large" && <p className="hito-body mt-2 max-w-lg">{description}</p>}
          {showStatusPill && (
            <span
              className="hito-status-pill mt-3"
              data-tone={destructive ? "destructive" : "signal"}
            >
              {destructive ? "Destructive" : bodyMode}
            </span>
          )}
        </div>
        <button type="button" className="hito-window-close" aria-label="Close modal">
          <Icon name="close" size="sm" />
        </button>
      </header>
      <div
        className={cn("hito-window-body", bodyMode === "scroll-fill" && "hito-window-body-scroll")}
      >
        <div className="grid gap-3">
          {destructive && (
            <div className="flex items-start gap-3 rounded-xl border border-destructive/35 bg-destructive/10 p-3">
              <Icon name="warning" size="sm" className="mt-1 text-destructive" />
              <p className="hito-field-helper">
                This action changes an active object. The final button carries destructive tone.
              </p>
            </div>
          )}
          {rows.map((label) => (
            <div key={label} className="hito-list-row rounded-xl border border-hairline">
              <div>
                <p className="hito-list-row-title">{label}</p>
                <p className="hito-list-row-copy">
                  This row belongs inside the modal body. Scroll-fill keeps this middle region
                  bounded when content grows.
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      {footerMode !== "none" && (
        <footer className="hito-window-footer" data-variant={footerMode}>
          {footerMode === "note-actions" && (
            <div className="hito-window-footer-note">
              <p>Footer note stays short and tied to save/apply.</p>
            </div>
          )}
          <div className="hito-window-footer-actions">
            <button type="button" className="hito-button hito-button-secondary hito-button-md">
              Cancel
            </button>
            <button
              type="button"
              className={cn(
                "hito-button hito-button-md",
                destructive ? "hito-button-outlined" : "hito-button-primary",
              )}
              data-tone={destructive ? "error" : undefined}
            >
              {destructive ? "Archive" : "Continue"}
            </button>
          </div>
        </footer>
      )}
    </article>
  );
}

function ChoiceSelector<T extends string>({
  label,
  value,
  options,
  onChange,
  size = "sm",
  getLabel,
  textTransform = "capitalize",
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  size?: (typeof CHOICE_TOGGLE_SIZES)[number];
  getLabel?: (value: T) => string;
  textTransform?: "capitalize" | "uppercase" | "none";
}) {
  return (
    <div className="w-full">
      <p className="hito-label">{label}</p>
      <div className="hito-choice-toggle-group mt-3" role="radiogroup" aria-label={label}>
        {options.map((item) => {
          const selected = value === item;
          return (
            <button
              key={item}
              type="button"
              onClick={() => onChange(item)}
              data-selected={selected}
              aria-checked={selected}
              className={cn(
                "hito-choice-toggle",
                `hito-choice-toggle-${size}`,
                textTransform === "capitalize" && "capitalize",
                textTransform === "uppercase" && "uppercase",
              )}
              role="radio"
            >
              {getLabel ? getLabel(item) : item}
            </button>
          );
        })}
      </div>
    </div>
  );
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

function SelectionControlPreview({
  kind,
  size,
  selected,
  disabled,
  invalid,
  focusDemo,
  accentMode,
}: {
  kind: SelectionControlKind;
  size: ChoiceToggleSize;
  selected: boolean;
  disabled: boolean;
  invalid: boolean;
  focusDemo: boolean;
  accentMode: boolean;
}) {
  const binarySize = isBinarySelectionSize(size) ? size : "md";

  if (kind === "toggle") {
    return (
      <div className="grid gap-3">
        <div
          className="hito-choice-toggle-group"
          role="radiogroup"
          aria-label="Selection control preview"
        >
          <button
            type="button"
            className={cn(
              "hito-choice-toggle",
              accentMode ? "hito-choice-toggle-accent" : `hito-choice-toggle-${size}`,
            )}
            data-selected={selected}
            data-demo-state={focusDemo ? "focus" : undefined}
            aria-checked={selected}
            aria-disabled={disabled || undefined}
            aria-invalid={invalid || undefined}
            disabled={disabled}
            role="radio"
          >
            {accentMode ? (
              <span>
                <span className="block">Goal distance</span>
                <span className="mt-1 block text-current/70">Accent display choice</span>
              </span>
            ) : (
              "Preview choice"
            )}
          </button>
          {!accentMode && (
            <button
              type="button"
              className={cn("hito-choice-toggle", `hito-choice-toggle-${size}`)}
              aria-checked="false"
              role="radio"
            >
              Other choice
            </button>
          )}
        </div>
        <p className="hito-caption">
          {accentMode
            ? "Accent is reserved for large visual choice moments."
            : `${size.toUpperCase()} toggle matches the functional button/input scale.`}
        </p>
      </div>
    );
  }

  const inputClassName = cn(
    kind === "checkbox" ? "hito-checkbox" : "hito-radio",
    kind === "checkbox" ? `hito-checkbox-${binarySize}` : `hito-radio-${binarySize}`,
  );

  return (
    <div className="grid gap-3">
      <label
        className={cn("hito-control-label", `hito-control-label-${binarySize}`)}
        aria-disabled={disabled || undefined}
      >
        <input
          type={kind}
          name={`selection-preview-${kind}`}
          className={inputClassName}
          checked={selected}
          readOnly
          disabled={disabled}
          aria-invalid={invalid || undefined}
          data-state={selected ? "checked" : undefined}
          data-demo-state={focusDemo ? "focus" : undefined}
        />
        <span>
          {kind === "checkbox" ? "Preview checkbox" : "Preview radio"} · {binarySize.toUpperCase()}
        </span>
      </label>
      <p className="hito-caption">
        {kind === "checkbox"
          ? "Checkboxes are square and support independent on/off choices."
          : "Radios stay circular and represent one-of-many selection."}
      </p>
    </div>
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
  loading = false,
  demoState,
}: {
  variant: ButtonVariant;
  tone?: ButtonTone;
  size: ButtonSize;
  leftIcon?: boolean;
  rightIcon?: boolean;
  disabled?: boolean;
  loading?: boolean;
  demoState?: "hover" | "focus";
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
      data-demo-state={demoState}
    >
      {loading ? (
        <Icon name="loader" size="xs" className="animate-spin" />
      ) : (
        leftIcon && <Icon name="circle" size="xs" />
      )}
      {loading ? "Loading" : variant}
      {!loading && rightIcon && <Icon name="arrow-right" size="xs" />}
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

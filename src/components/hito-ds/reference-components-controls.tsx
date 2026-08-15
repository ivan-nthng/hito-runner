import { type ReactNode, useState } from "react";
import { AdminMetadataMenu } from "@/components/admin/AdminOperationalComponents";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  HitoDateField,
  HitoEditableDateField,
  HitoMaskedTimeField,
} from "@/components/ui/hito-date-time-input";
import { HitoCompoundRangeField } from "@/components/ui/hito-compound-range-field";
import { HitoDualRange } from "@/components/ui/hito-dual-range";
import { HitoButton } from "@/components/ui/button";
import { HitoChoiceToggle } from "@/components/ui/hito-choice-toggle";
import {
  HITO_BUTTON_SIZES,
  HITO_BUTTON_STATES,
  HITO_BUTTON_TONES,
  HITO_BUTTON_VARIANTS,
  HITO_CHOICE_TOGGLE_SIZES,
  HITO_FIELD_FEEDBACK,
  HITO_FIELD_SIZES,
  HITO_FIELD_VARIANTS,
  type HitoButtonSize,
  type HitoButtonState,
  type HitoButtonTone,
  type HitoButtonVariant,
  type HitoChoiceToggleSize,
  type HitoFieldFeedback,
  type HitoFieldSize,
  type HitoFieldVariant,
} from "@/components/ui/hito-control-contract";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { InlineEditableText } from "@/components/ui/inline-editable-text";
import { HitoMetadataTag } from "@/components/ui/metadata-tag";
import { useHitoTabs } from "@/components/ui/hito-tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { HitoDsPlayground } from "@/components/hito-ds/playground";
import { EditableValueFieldSandbox } from "@/components/hito-ds/editable-value-field-sandbox";
import { HitoReferenceLink, ProductLinks, ReferenceListRow } from "@/components/hito-ds/reference";
import {
  ChoiceSelector,
  DataTableControlsDemo,
  DataTableHeaderDemo,
  DataTableHeaderVariants,
  DataTableLiveDemo,
  DataTableRowsDemo,
  type DataTableReferenceDensity,
  DemoButton,
  DemoInput,
  IconOnlyButtonMatrix,
  SelectionControlPreview,
  ToggleRow,
} from "@/components/hito-ds/specimen-previews";
import { cn } from "@/lib/utils";

const BUTTON_VARIANTS = HITO_BUTTON_VARIANTS;
const BUTTON_TONES = HITO_BUTTON_TONES;
const BUTTON_SIZES = HITO_BUTTON_SIZES;
const BUTTON_MOTION_STATES = HITO_BUTTON_STATES;
const BUTTON_PROGRESS_VALUES = ["25%", "50%", "75%", "100%"] as const;
const INPUT_VARIANTS = HITO_FIELD_VARIANTS;
const FIELD_SIZES = HITO_FIELD_SIZES;
const INPUT_STATES = ["default", "hover", "focus", "disabled", "readonly"] as const;
const INPUT_FEEDBACK = HITO_FIELD_FEEDBACK;
const CHOICE_TOGGLE_SIZES = HITO_CHOICE_TOGGLE_SIZES;
const SELECTION_CONTROL_KINDS = ["checkbox", "radio", "toggle"] as const;
const SELECTION_BINARY_SIZES = ["sm", "md"] as const;
const TAB_STYLES = ["simple", "enclosed"] as const;
const STATUS_TONES = ["neutral", "signal", "success", "warning", "destructive"] as const;
const DATA_TABLE_HEADER_STATES = [
  "static",
  "sortable",
  "sorted-asc",
  "sorted-desc",
  "filtered",
] as const;
const DATA_TABLE_DENSITIES = ["sm", "md", "lg"] as const;
const STATUS_MARKER_EXAMPLES = [
  { label: "Completed", tone: "success", icon: "check" },
  { label: "Partial", tone: "warning", icon: "minus" },
  { label: "Skipped", tone: "destructive", icon: "close" },
  { label: "Neutral", tone: "muted", icon: "minus" },
] as const;

type ButtonVariant = HitoButtonVariant;
type ButtonTone = HitoButtonTone;
type ButtonSize = HitoButtonSize;
type ButtonMotionState = HitoButtonState;
type ButtonProgressValue = (typeof BUTTON_PROGRESS_VALUES)[number];
type InputVariant = HitoFieldVariant;
type InputState = (typeof INPUT_STATES)[number];
type InputFeedback = HitoFieldFeedback;
type ChoiceToggleSize = HitoChoiceToggleSize | SelectionBinarySize;
type SelectionControlKind = (typeof SELECTION_CONTROL_KINDS)[number];
type SelectionBinarySize = (typeof SELECTION_BINARY_SIZES)[number];
type TabStyle = (typeof TAB_STYLES)[number];
type StatusTone = (typeof STATUS_TONES)[number];
type DataTableReferenceMode = "demo" | "variants";

type FieldSize = HitoFieldSize;
type TabDemoValue = "plan" | "progress" | "updates" | "archived";

const TAB_ITEMS = [
  { value: "plan", icon: "calendar" },
  { value: "progress", icon: "progress" },
  { value: "updates", icon: null },
  { value: "archived", icon: null },
] as const;

const BUTTON_STATE_CASES = [
  { id: "default", includeConfiguredIcons: true, props: {} },
  { id: "hover", includeConfiguredIcons: true, props: { demoState: "hover" } },
  { id: "active", includeConfiguredIcons: true, props: { demoState: "active" } },
  { id: "focus", includeConfiguredIcons: true, props: { demoState: "focus" } },
  { id: "disabled", includeConfiguredIcons: true, props: { disabled: true } },
  { id: "loading", includeConfiguredIcons: false, props: { loading: true, disabled: true } },
  { id: "success", includeConfiguredIcons: false, props: { motionState: "success" } },
  { id: "error", includeConfiguredIcons: false, props: { motionState: "error" } },
  {
    id: "timed-progress",
    includeConfiguredIcons: false,
    props: { motionState: "timed-progress", progress: 0.64 },
  },
] as const;

function ButtonPlayground() {
  const [variant, setVariant] = useState<ButtonVariant>("primary");
  const [buttonTone, setButtonTone] = useState<ButtonTone>("default");
  const [size, setSize] = useState<ButtonSize>("lg");
  const [leftIcon, setLeftIcon] = useState(true);
  const [rightIcon, setRightIcon] = useState(true);
  const [buttonMotionState, setButtonMotionState] = useState<ButtonMotionState>("default");
  const [buttonProgress, setButtonProgress] = useState<ButtonProgressValue>("75%");

  return (
    <>
      <HitoDsPlayground
        id="buttons"
        label="Buttons"
        status="Core control"
        statusTone="signal"
        description={{
          purpose:
            "Express primary, secondary, compact, semantic, and progress-bearing actions through one canonical control family.",
          useWhen:
            "A user can trigger a concrete action, submit a decision, or open an owned interactive surface.",
          avoidWhen:
            "The destination is ordinary navigation or the content is display-only status.",
          accessibility:
            "Use native button semantics, an accessible name for icon-only actions, visible focus, and truthful disabled or loading state.",
        }}
        anchors={[{ id: "button-group", label: "Grouped Buttons", tab: "variants" }]}
        usedIn={
          <ProductLinks
            links={[
              { href: "/login", label: "/login" },
              { href: "/settings", label: "/settings" },
              { href: "/admin/analytics", label: "/admin/analytics" },
              { href: "/hitoDS", label: "/hitoDS" },
            ]}
          />
        }
        demo={
          <div className="flex min-w-0 items-center justify-center" data-hito-ds-button-preview>
            <DemoButton
              variant={variant}
              tone={buttonTone}
              size={size}
              leftIcon={leftIcon}
              rightIcon={rightIcon}
              motionState={buttonMotionState}
              progress={Number.parseInt(buttonProgress, 10) / 100}
            />
          </div>
        }
        variants={
          <div className="grid gap-6" inert>
            <div className="border-t border-hairline pt-5">
              <p className="hito-label-md">Grouped action composition</p>
              <p className="hito-body-xs text-tertiary mt-1 max-w-2xl">
                Responsive action groups compose canonical Buttons without adding a connected
                ButtonGroup API.
              </p>
              <div className="mt-4 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
                <HitoButton size="md" variant="secondary" className="w-full sm:w-auto">
                  Previous week
                </HitoButton>
                <HitoButton size="md" variant="outlined" className="w-full sm:w-auto">
                  Today
                </HitoButton>
                <HitoButton size="md" variant="primary" className="w-full sm:w-auto">
                  Next week
                </HitoButton>
              </div>
            </div>
            <div className="border-t border-hairline pt-5">
              <p className="hito-label-md">State matrix</p>
              <p className="hito-body-xs text-tertiary mt-1">
                Follows the selected variant, tone, size, and icon rhythm.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {BUTTON_STATE_CASES.map(({ id, includeConfiguredIcons, props }) => (
                  <DemoButton
                    key={id}
                    variant={variant}
                    tone={buttonTone}
                    size={size}
                    leftIcon={includeConfiguredIcons ? leftIcon : undefined}
                    rightIcon={includeConfiguredIcons ? rightIcon : undefined}
                    {...props}
                  />
                ))}
              </div>
            </div>
            <div className="border-t border-hairline pt-5">
              <p className="hito-label-md">Hierarchy × tone</p>
              <div className="mt-4 grid gap-3">
                {BUTTON_TONES.map((tone) => (
                  <div key={tone} className="flex min-w-0 flex-wrap items-center gap-3">
                    <span className="hito-label-sm w-16 text-tertiary">{tone}</span>
                    {BUTTON_VARIANTS.map((item) => (
                      <DemoButton key={`${tone}-${item}`} variant={item} tone={tone} size="sm" />
                    ))}
                  </div>
                ))}
              </div>
              <p className="hito-body-xs text-tertiary mt-3 max-w-2xl">
                Default primary stays signal/orange. Secondary stays soft and borderless. Outlined
                stays border-led. Success and error are semantic tones, not separate button
                families.
              </p>
            </div>
            <div className="border-t border-hairline pt-5">
              <p className="hito-label-md">Icon-only configuration</p>
              <p className="hito-body-xs text-tertiary mt-1 max-w-2xl">
                Icon-only actions are square configurations of the same Button variants, tones,
                sizes, focus, disabled, and loading states. They always require an accessible name.
              </p>
              <div className="mt-5">
                <IconOnlyButtonMatrix />
              </div>
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
            </div>
            <div className="hito-row-group border-0">
              <div className="hito-list-row items-start">
                <ChoiceSelector
                  label="Motion state"
                  value={buttonMotionState}
                  options={BUTTON_MOTION_STATES}
                  onChange={setButtonMotionState}
                  textTransform="none"
                />
              </div>
              {buttonMotionState === "timed-progress" ? (
                <div className="hito-list-row items-start">
                  <ChoiceSelector
                    label="Product progress"
                    value={buttonProgress}
                    options={BUTTON_PROGRESS_VALUES}
                    onChange={setButtonProgress}
                    textTransform="none"
                  />
                </div>
              ) : null}
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
      />
    </>
  );
}

function TabsPlayground() {
  const [tabStyle, setTabStyle] = useState<TabStyle>("simple");
  const [tabIcon, setTabIcon] = useState(true);
  const [tabBadge, setTabBadge] = useState(true);
  const [tabDot, setTabDot] = useState(true);
  const [tabDisabled, setTabDisabled] = useState(true);
  const [tabDemoValue, setTabDemoValue] = useState<TabDemoValue>("plan");
  const tabDemo = useHitoTabs({
    items: TAB_ITEMS.map(({ value }) => ({
      value,
      disabled: value === "archived" && tabDisabled,
    })),
    value: tabDemoValue,
  });

  return (
    <>
      <HitoDsPlayground
        id="tabs"
        label="Tabs"
        status="Core control"
        statusTone="signal"
        description={{
          purpose:
            "Switch between peer views while keeping one clear selected destination or panel.",
          useWhen: "A bounded surface has a small set of equally ranked views that share context.",
          avoidWhen:
            "The choices are form values, sequential steps, or unrelated routes with different context.",
          accessibility:
            "Arrow-key, Home, End, focus, selection, disabled, and panel relationships follow the shared tab contract.",
        }}
        usedIn={
          <ProductLinks
            links={[
              { href: "/settings", label: "/settings" },
              { href: "/changelog", label: "/changelog" },
              { href: "/admin/analytics", label: "/admin/analytics" },
            ]}
          />
        }
        demo={
          <div className="max-w-full min-w-0 overflow-x-auto pb-1">
            <div
              className={cn(
                "hito-tabs",
                tabStyle === "simple" ? "hito-tabs-simple" : "hito-tabs-enclosed",
              )}
              {...tabDemo.tabListProps}
              aria-label="Configurable tab example"
            >
              {TAB_ITEMS.map((item) => {
                const optional = item.value === "archived";

                return optional && !tabDisabled ? null : (
                  <button
                    key={item.value}
                    className="hito-tab"
                    type="button"
                    {...tabDemo.getTabProps(item.value)}
                    data-active={tabDemoValue === item.value ? "true" : undefined}
                    disabled={optional}
                    onClick={optional ? undefined : () => setTabDemoValue(item.value)}
                  >
                    {tabIcon && item.icon ? (
                      <Icon name={item.icon} size="sm" className="hito-tab-icon" />
                    ) : null}
                    {getTabLabel(item.value)}
                    {tabBadge && item.value === "progress" ? (
                      <span className="hito-tab-badge" data-variant="count">
                        3
                      </span>
                    ) : null}
                    {tabDot && item.value === "updates" ? (
                      <span className="hito-tab-dot" aria-hidden="true" />
                    ) : null}
                  </button>
                );
              })}
            </div>
            <p className="hito-body-xs text-tertiary mt-3" {...tabDemo.getPanelProps(tabDemoValue)}>
              {getTabLabel(tabDemoValue)} view
            </p>
          </div>
        }
        variants={
          <div className="grid min-w-0 gap-5">
            <div className="border-t border-hairline pt-5">
              <p className="hito-label-md">State matrix</p>
              <p className="hito-body-xs text-tertiary mt-1">
                Follows the selected tab visual style.
              </p>
              <div className="max-w-full min-w-0 overflow-hidden pb-1">
                <div
                  className={cn(
                    "hito-tabs mt-4 w-full flex-wrap",
                    tabStyle === "simple" ? "hito-tabs-simple" : "hito-tabs-enclosed",
                  )}
                >
                  <span className="hito-tab pointer-events-none cursor-default">Default</span>
                  <span
                    className="hito-tab pointer-events-none cursor-default"
                    data-demo-state="hover"
                  >
                    Hover
                  </span>
                  <span className="hito-tab pointer-events-none cursor-default" data-active="true">
                    Active
                  </span>
                  <span
                    className="hito-tab pointer-events-none cursor-default"
                    data-demo-state="focus"
                  >
                    Focus
                  </span>
                  <span className="hito-tab pointer-events-none cursor-default opacity-[0.45]">
                    Disabled
                  </span>
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
            <ToggleRow label="With icon" active={tabIcon} onToggle={() => setTabIcon((v) => !v)} />
            <ToggleRow
              label="With badge"
              active={tabBadge}
              onToggle={() => setTabBadge((v) => !v)}
            />
            <ToggleRow label="With dot" active={tabDot} onToggle={() => setTabDot((v) => !v)} />
            <ToggleRow
              label="Disabled tab"
              active={tabDisabled}
              onToggle={() => setTabDisabled((v) => !v)}
            />
          </div>
        }
      />
    </>
  );
}

function ReferenceLinkPlayground() {
  return (
    <HitoDsPlayground
      id="reference-link"
      label="Reference Link"
      status="Reference navigation"
      statusTone="signal"
      description={{
        purpose:
          "Navigate to a referenced Product route or a durable in-document specimen without presenting the destination as an action or status.",
        useWhen:
          "Used-in metadata or specimen anatomy needs a compact, native route or hash destination.",
        avoidWhen:
          "The user is triggering an action, selecting a value, or reading non-navigational metadata.",
        accessibility:
          "Native anchor semantics, browser history, keyboard activation, visible focus, and truthful link text remain intact.",
      }}
      usedIn={
        <ProductLinks
          links={[
            { href: "/hitoDS/components#buttons", label: "Used in metadata" },
            { href: "/hitoDS/components#field", label: "Specimen anchors" },
          ]}
        />
      }
      demo={
        <div className="hito-reference-links justify-center">
          <HitoReferenceLink href="/settings">/settings</HitoReferenceLink>
          <HitoReferenceLink href="#reference-link">#reference-link</HitoReferenceLink>
        </div>
      }
      variants={
        <div className="grid min-w-0 gap-5 sm:grid-cols-2">
          <div className="grid min-w-0 content-start gap-2">
            <p className="hito-label-sm text-secondary">Default</p>
            <HitoReferenceLink href="/progress">/progress</HitoReferenceLink>
          </div>
          <div className="grid min-w-0 content-start gap-2">
            <p className="hito-label-sm text-secondary">Hover</p>
            <HitoReferenceLink href="/settings" data-demo-state="hover">
              /settings
            </HitoReferenceLink>
          </div>
          <div className="grid min-w-0 content-start gap-2">
            <p className="hito-label-sm text-secondary">Focus-visible</p>
            <HitoReferenceLink href="#reference-link" data-demo-state="focus-visible">
              #reference-link
            </HitoReferenceLink>
          </div>
          <div className="grid min-w-0 content-start gap-2">
            <p className="hito-label-sm text-secondary">Long destination</p>
            <HitoReferenceLink href="/hitoDS/components#reference-link">
              /hitoDS/components#reference-link-canonical-native-anchor-contract
            </HitoReferenceLink>
          </div>
        </div>
      }
      controls={
        <ReferenceListRow
          label="Contract"
          title="Native technical navigation"
          body="Technical SM, token spacing and radius, hairline edge, quiet surface, hover, and focus-visible feedback are shared by route and hash destinations."
        />
      }
    />
  );
}

const DATA_TABLE_MODE_LABELS: Record<DataTableReferenceMode, string> = {
  demo: "Demo",
  variants: "Variants",
};

function DataTableReferenceSubject({
  density,
  label,
  modes,
  onDensityChange,
  subject,
  views,
}: {
  density?: DataTableReferenceDensity;
  label: string;
  modes: readonly DataTableReferenceMode[];
  onDensityChange?: (value: DataTableReferenceDensity) => void;
  subject: string;
  views: Partial<Record<DataTableReferenceMode, ReactNode>>;
}) {
  const [activeMode, setActiveMode] = useState<DataTableReferenceMode>(modes[0]);
  const tabs = useHitoTabs({
    idPrefix: `data-table-${subject}-reference`,
    items: modes.map((value) => ({ value })),
    value: activeMode,
  });
  const hasTabs = modes.length > 1;
  const showControls =
    activeMode === "demo" && density !== undefined && onDensityChange !== undefined;
  const visualMode = activeMode === "demo" ? "demo" : "variants";
  const titleId = `data-table-${subject}-title`;
  const stage = (
    <article
      className="hito-ds-playground-stage"
      data-mode={visualMode}
      data-reference-mode={activeMode}
    >
      <div
        {...(hasTabs ? tabs.getPanelProps(activeMode) : {})}
        className="hito-ds-playground-panel"
        data-mode={visualMode}
      >
        {views[activeMode]}
      </div>
    </article>
  );

  return (
    <section
      className="hito-ds-playground-section py-8"
      aria-labelledby={titleId}
      data-data-table-subject={subject}
    >
      <div className="hito-specimen-header mb-6">
        <h3 id={titleId} className="hito-ui-title-sm">
          {label}
        </h3>
      </div>
      <div className="hito-ds-playground" data-mode={visualMode}>
        {hasTabs ? (
          <div className="hito-ds-playground-tabs">
            <div
              className="hito-tabs hito-tabs-simple"
              {...tabs.tabListProps}
              aria-label={`${label} specimen modes`}
            >
              {modes.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  {...tabs.getTabProps(mode)}
                  className="hito-tab"
                  data-active={activeMode === mode ? "true" : undefined}
                  onClick={() => setActiveMode(mode)}
                >
                  {DATA_TABLE_MODE_LABELS[mode]}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {showControls ? (
          <div className="hito-ds-playground-shell" data-mode={visualMode}>
            {stage}
            <aside
              className="hito-ds-playground-controls"
              data-mode={visualMode}
              aria-label={`${label} properties`}
            >
              <div className="hito-row-group border-0">
                <div className="hito-list-row items-start">
                  <ChoiceSelector
                    label="Density"
                    value={density}
                    options={DATA_TABLE_DENSITIES}
                    onChange={onDensityChange}
                    getLabel={(value) => value.toUpperCase()}
                    textTransform="none"
                  />
                </div>
              </div>
            </aside>
          </div>
        ) : (
          stage
        )}
      </div>
    </section>
  );
}

function DataTableHeadersReference() {
  const [density, setDensity] = useState<DataTableReferenceDensity>("md");

  return (
    <DataTableReferenceSubject
      density={density}
      label="Headers"
      onDensityChange={setDensity}
      subject="headers"
      modes={["demo", "variants"]}
      views={{
        demo: <DataTableHeaderDemo density={density} state="sorted-asc" />,
        variants: <DataTableHeaderVariants states={DATA_TABLE_HEADER_STATES} />,
      }}
    />
  );
}

function DataTableControlsReference() {
  return (
    <DataTableReferenceSubject
      label="Controls"
      subject="controls"
      modes={["demo", "variants"]}
      views={{
        demo: <DataTableControlsDemo />,
        variants: (
          <div className="grid min-w-0 gap-8">
            <div className="grid min-w-0 gap-3">
              <p className="hito-label-sm">Default</p>
              <DataTableControlsDemo />
            </div>
            <div className="grid min-w-0 gap-3">
              <p className="hito-label-sm">Filtered</p>
              <DataTableControlsDemo initialFilter="active" />
            </div>
          </div>
        ),
      }}
    />
  );
}

function DataTableRowsReference() {
  const [density, setDensity] = useState<DataTableReferenceDensity>("md");

  return (
    <DataTableReferenceSubject
      density={density}
      label="Rows & values"
      onDensityChange={setDensity}
      subject="rows-values"
      modes={["demo"]}
      views={{
        demo: <DataTableRowsDemo density={density} />,
      }}
    />
  );
}

function DataTableLiveReference() {
  const [density, setDensity] = useState<DataTableReferenceDensity>("md");

  return (
    <DataTableReferenceSubject
      density={density}
      label="Table"
      onDensityChange={setDensity}
      subject="table"
      modes={["demo"]}
      views={{
        demo: <DataTableLiveDemo density={density} />,
      }}
    />
  );
}

function DataTableReference() {
  return (
    <section id="data-table" className="ds-section">
      <div className="max-w-3xl">
        <h2 className="hito-ui-title-lg">Tables</h2>
        <p className="hito-body-sm text-secondary mt-3">
          Headers, controls, row values, and full compositions share one accessible table rhythm.
        </p>
      </div>
      <DataTableHeadersReference />
      <DataTableControlsReference />
      <DataTableRowsReference />
      <DataTableLiveReference />
    </section>
  );
}

export function HitoDsComponentControls() {
  const [inputVariant, setInputVariant] = useState<InputVariant>("primary");
  const [inputSize, setInputSize] = useState<FieldSize>("md");
  const [inputLeftIcon, setInputLeftIcon] = useState(true);
  const [inputRightIcon, setInputRightIcon] = useState(false);
  const [inputState, setInputState] = useState<InputState>("default");
  const [inputFeedback, setInputFeedback] = useState<InputFeedback>("neutral");
  const [dualRangeValue, setDualRangeValue] = useState<readonly [number, number]>([124, 156]);
  const [compoundRangeValue, setCompoundRangeValue] = useState<readonly [string, string]>([
    "124",
    "156",
  ]);
  const [dateFieldDemo, setDateFieldDemo] = useState("2026-12-11");
  const [editableDateDemo, setEditableDateDemo] = useState("");
  const [boundedDateDemo, setBoundedDateDemo] = useState("2026-05-29");
  const [timeFieldDemo, setTimeFieldDemo] = useState("3:50:00");
  const [workoutTypeDemo, setWorkoutTypeDemo] = useState("easy");
  const [statusTone, setStatusTone] = useState<StatusTone>("signal");
  const [statusLongLabel, setStatusLongLabel] = useState(false);
  const [metadataState, setMetadataState] = useState("reviewed");
  const [selectionKind, setSelectionKind] = useState<SelectionControlKind>("toggle");
  const [selectionSize, setSelectionSize] = useState<ChoiceToggleSize>("sm");
  const [selectionSelected, setSelectionSelected] = useState(true);
  const [selectionDisabled, setSelectionDisabled] = useState(false);
  const [selectionInvalid, setSelectionInvalid] = useState(false);
  const [selectionFocusDemo, setSelectionFocusDemo] = useState(false);
  const [selectionCardMode, setSelectionCardMode] = useState(false);
  const workoutTypeLabel =
    workoutTypeDemo === "tempo"
      ? "Tempo"
      : workoutTypeDemo === "intervals"
        ? "Intervals"
        : "Easy run";

  return (
    <>
      <ButtonPlayground />
      <TabsPlayground />
      <ReferenceLinkPlayground />
      <DataTableReference />

      <HitoDsPlayground
        id="inputs"
        label="Inputs"
        status="Core control"
        statusTone="signal"
        description={{
          purpose:
            "Collect text and bounded range values with one field rhythm and feedback contract.",
          useWhen:
            "A user must enter or edit a value that has an explicit label, format, and validation boundary.",
          avoidWhen:
            "A compact read/edit scalar belongs to Editable Value Field or the choice is a small visible selection set.",
          accessibility:
            "Labels, descriptions, errors, native input behavior, focus, disabled, and read-only feedback remain programmatically connected.",
        }}
        anchors={[
          { id: "field", label: "Field", tab: "demo" },
          { id: "textarea", label: "Textarea", tab: "variants" },
        ]}
        usedIn={
          <ProductLinks
            links={[
              { href: "/login", label: "/login" },
              { href: "/settings", label: "/settings" },
              { href: "/admin/login", label: "/admin/login" },
              { href: "/hitoDS", label: "/hitoDS" },
            ]}
          />
        }
        demo={
          <div className="grid w-full min-w-0 gap-4">
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
          </div>
        }
        variants={
          <div className="grid min-w-0 gap-6">
            <div className="hito-reference-list">
              {INPUT_STATES.map((state) => (
                <article key={state} className="hito-reference-row">
                  <div>
                    <p className="hito-label-md">{state === "focus" ? "Active" : state}</p>
                    <p className="hito-body-xs text-tertiary mt-2">
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
                <span className="hito-label-md">Primary field</span>
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
                <span className="hito-label-md">Secondary field</span>
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
                <span className="hito-label-md">Error feedback</span>
                <DemoInput
                  variant="primary"
                  size="md"
                  leftIcon
                  rightIcon
                  feedback="error"
                  placeholder="Missing start date"
                />
                <span className="hito-field-error">Choose a start date before importing.</span>
              </label>
              <label className="grid min-w-0 gap-2">
                <span className="hito-label-md">Success feedback</span>
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
                <span className="hito-label-md">Textarea</span>
                <Textarea
                  rows={5}
                  className="resize-none"
                  placeholder="Describe goal, constraints, recent results, or JSON notes."
                />
              </label>
              <div className="grid min-w-0 gap-3 lg:col-span-2">
                <div>
                  <p className="hito-label-md">Header input variant</p>
                  <p className="hito-body-xs text-tertiary mt-2 max-w-2xl">
                    True editable headings use the shared inline text primitive with Hito-sized
                    header field padding, fit-content width, and an edit affordance that stays
                    adjacent to the text.
                  </p>
                </div>
                <div className="grid min-w-0 gap-3 md:grid-cols-3">
                  {(["sm", "md", "lg"] as const).map((headerSize) => (
                    <div key={headerSize} className="min-w-0 self-start justify-self-start">
                      <InlineEditableText
                        aria-label={`Edit ${headerSize} header input specimen`}
                        onChange={() => {}}
                        size={headerSize}
                        value={
                          headerSize === "lg"
                            ? "Workout title"
                            : headerSize === "md"
                              ? "Section heading"
                              : "Block label"
                        }
                        variant="header"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-hairline pt-5">
              <div>
                <p className="hito-label-md">Dual-value range</p>
                <p className="hito-body-xs text-tertiary mt-2 max-w-2xl">
                  Use two accessible handles to adjust an ordered interval. Pair the rail with the
                  compound Hito Field when both endpoints need direct numeric entry.
                </p>
              </div>
              <div className="mt-4 grid min-w-0 gap-3">
                <HitoDualRange
                  min={80}
                  max={200}
                  minLabel="Specimen minimum"
                  maxLabel="Specimen maximum"
                  previousValue={[116, 164]}
                  size="sm"
                  value={dualRangeValue}
                  onMinValueChange={(value) =>
                    setDualRangeValue(([, currentMax]) => [Math.min(value, currentMax), currentMax])
                  }
                  onMaxValueChange={(value) =>
                    setDualRangeValue(([currentMin]) => [currentMin, Math.max(value, currentMin)])
                  }
                />
                <div className="flex items-center justify-between gap-3">
                  <span className="hito-body-xs text-tertiary">Minimum {dualRangeValue[0]}</span>
                  <span className="hito-body-xs text-tertiary">Maximum {dualRangeValue[1]}</span>
                </div>
                <HitoCompoundRangeField
                  label="Range"
                  lowerLabel="Specimen lower bound"
                  upperLabel="Specimen upper bound"
                  lowerValue={compoundRangeValue[0]}
                  upperValue={compoundRangeValue[1]}
                  min={40}
                  max={220}
                  unit="BPM"
                  onLowerValueChange={(value) =>
                    setCompoundRangeValue(([, upper]) => [value, upper])
                  }
                  onUpperValueChange={(value) => setCompoundRangeValue(([lower]) => [lower, value])}
                />
              </div>
            </div>

            <div className="border-t border-hairline pt-5">
              <p className="hito-label-md">Avatar tile action</p>
              <p className="hito-body-xs text-tertiary mt-2 max-w-2xl">
                Settings avatar controls use one rectangular tile and a same-width action.
              </p>
              <div className="hito-reference-list mt-4">
                <article className="hito-reference-row">
                  <div>
                    <p className="hito-list-row-title">Empty avatar</p>
                    <p className="hito-body-xs text-tertiary mt-2">
                      The action spans the tile width and keeps the camera affordance.
                    </p>
                  </div>
                  <div className="hito-avatar-stack">
                    <Avatar className="hito-avatar-tile hito-profile-avatar">
                      <AvatarFallback className="hito-profile-avatar-fallback">IR</AvatarFallback>
                    </Avatar>
                    <HitoButton size="sm" variant="secondary" className="hito-avatar-action">
                      <Icon name="camera" size="sm" />
                      Upload
                    </HitoButton>
                  </div>
                </article>
                <article className="hito-reference-row">
                  <div>
                    <p className="hito-list-row-title">Existing avatar</p>
                    <p className="hito-body-xs text-tertiary mt-2">
                      Edit is a separate product label, not hidden inside avatar hover chrome.
                    </p>
                  </div>
                  <div className="hito-avatar-stack">
                    <Avatar className="hito-avatar-tile hito-profile-avatar">
                      <AvatarFallback className="hito-profile-avatar-fallback">
                        <Icon name="user" size="lg" />
                      </AvatarFallback>
                    </Avatar>
                    <HitoButton size="sm" variant="secondary" className="hito-avatar-action">
                      <Icon name="edit" size="sm" />
                      Edit
                    </HitoButton>
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
      />

      <HitoDsPlayground
        id="date-time"
        label="Date & Time"
        status="Field family"
        statusTone="signal"
        description={{
          purpose:
            "Inspect branded selection, calendar entry, optional dates, and duration-shaped time through the existing Hito field family.",
          useWhen:
            "A workflow combines workout classification with a date or target-time value that needs visible format and bounds.",
          avoidWhen:
            "A plain text field or deliberately native platform select is the established Product interaction.",
          accessibility:
            "Named triggers, menu and calendar keyboard behavior, typed ISO or duration values, focus return, errors, and disabled bounds remain owned by their existing primitives.",
        }}
        anchors={[
          { id: "native-select", label: "Workout type select", tab: "demo" },
          { id: "date-field", label: "Date Field", tab: "demo" },
          { id: "time-field", label: "Time Field", tab: "demo" },
        ]}
        usedIn={
          <ProductLinks
            links={[
              { href: "/settings", label: "/settings" },
              { href: "/workout/2026-05-24", label: "/workout/$date" },
            ]}
          />
        }
        demo={
          <div className="grid w-full min-w-0 gap-5 lg:grid-cols-3">
            <div className="grid min-w-0 content-start gap-2">
              <span id="ds-workout-type-label" className="hito-label-md">
                Workout type
              </span>
              <Select value={workoutTypeDemo} onValueChange={setWorkoutTypeDemo}>
                <SelectTrigger aria-labelledby="ds-workout-type-label">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy run</SelectItem>
                  <SelectItem value="tempo">Tempo</SelectItem>
                  <SelectItem value="intervals">Intervals</SelectItem>
                </SelectContent>
              </Select>
              <span className="hito-field-helper">Choose from the branded Hito menu.</span>
            </div>
            <HitoDateField
              id="ds-date-field"
              label="Target date"
              value={dateFieldDemo}
              onChange={setDateFieldDemo}
              helper="Pick from calendar or type YYYY-MM-DD."
            />
            <HitoMaskedTimeField
              id="ds-time-field"
              label="Target time"
              value={timeFieldDemo}
              onChange={setTimeFieldDemo}
              helper="Duration-shaped, backend-compatible value."
            />
          </div>
        }
        variants={
          <div className="hito-reference-list">
            <article className="hito-reference-row items-start">
              <div>
                <p className="hito-list-row-title">Date picker states</p>
                <p className="hito-body-xs text-tertiary mt-2">
                  Error, disabled, and bounded dates stay in the same field-owned anatomy.
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
                <p className="hito-list-row-title">Optional date field</p>
                <p className="hito-body-xs text-tertiary mt-2">
                  Empty state is an action; saved state remains visible and editable.
                </p>
              </div>
              <HitoEditableDateField
                label="Plan Start Date"
                value={editableDateDemo}
                onChange={setEditableDateDemo}
                helper="Optional date using the same picker primitive."
              />
            </article>
          </div>
        }
        controls={
          <div className="hito-row-group border-0">
            <ReferenceListRow
              label="Workout type"
              title={workoutTypeLabel}
              body="Branded Hito Select value"
            />
            <ReferenceListRow
              label="Target date"
              title={dateFieldDemo}
              body="ISO-shaped local reference state"
            />
            <ReferenceListRow
              label="Target time"
              title={timeFieldDemo}
              body="Duration-shaped local reference state"
            />
          </div>
        }
      />

      <EditableValueFieldSandbox />

      <HitoDsPlayground
        id="status"
        label="Status"
        status="Core feedback"
        statusTone="signal"
        description={{
          purpose:
            "Communicate concise state, result, severity, or metadata without turning display truth into an action.",
          useWhen: "A stable label, marker, or metadata tag helps scan current product truth.",
          avoidWhen:
            "The state needs recovery guidance, a route-level notice surface, or an interactive choice.",
          accessibility:
            "Meaning is carried by readable text or an accessible marker label, never by tone or icon alone.",
        }}
        anchors={[
          { id: "status-marker", label: "Status Marker", tab: "variants" },
          { id: "metadata-tag", label: "Metadata Tag", tab: "variants" },
        ]}
        usedIn={
          <ProductLinks
            links={[
              { href: "/", label: "/" },
              { href: "/settings", label: "/settings" },
              { href: "/workout/2026-05-24", label: "/workout/$date" },
              { href: "/admin/analytics", label: "/admin/analytics" },
            ]}
          />
        }
        demo={
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
        }
        variants={
          <div className="grid min-w-0 gap-6">
            <div className="border-t border-hairline pt-5">
              <p className="hito-label-md">Chip tones</p>
              <p className="hito-body-xs text-tertiary mt-1">
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
              <p className="hito-label-md">Marker states</p>
              <p className="hito-body-xs text-tertiary mt-1">
                Tiny markers carry result or feedback truth without becoming another badge.
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
              <p className="hito-label-md">Metadata tags and menu</p>
              <p className="hito-body-xs text-tertiary mt-1">
                Visible words carry meaning; Light stays quiet and Accent stays deliberately scarce.
              </p>
              <div className="mt-4 grid min-w-0 gap-5">
                <div className="grid min-w-0 gap-3">
                  <p className="hito-label-sm text-secondary">Light · quiet and dense</p>
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <HitoMetadataTag variant="light">Plan first</HitoMetadataTag>
                    <HitoMetadataTag variant="light" tone="success">
                      Available
                    </HitoMetadataTag>
                    <HitoMetadataTag variant="light" tone="rollout">
                      In review
                    </HitoMetadataTag>
                    <HitoMetadataTag variant="light" tone="warning">
                      Needs QA
                    </HitoMetadataTag>
                    <HitoMetadataTag variant="light" tone="error">
                      Invalid metadata
                    </HitoMetadataTag>
                  </div>
                </div>

                <div className="grid min-w-0 gap-3">
                  <p className="hito-label-sm text-secondary">Accent · sparse and explicit</p>
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <HitoMetadataTag variant="accent" tone="success">
                      Ready
                    </HitoMetadataTag>
                    <HitoMetadataTag variant="accent" tone="rollout">
                      Live sync
                    </HitoMetadataTag>
                    <HitoMetadataTag variant="accent" tone="signal">
                      Core control
                    </HitoMetadataTag>
                  </div>
                  <p className="hito-body-xs text-tertiary">
                    Signal is organizational, not status. Warning and Negative Accent are not
                    admitted by the current foreground pairs.
                  </p>
                </div>

                <div className="grid min-w-0 gap-3">
                  <p className="hito-label-sm text-secondary">Behaviour</p>
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <HitoMetadataTag tooltip="Canonical generated-plan contract.">
                      Plan first
                    </HitoMetadataTag>
                    <HitoMetadataTag>
                      Canonical generated-plan metadata remains readable when its source label is
                      unusually long
                    </HitoMetadataTag>
                    <AdminMetadataMenu
                      displayValue={metadataState === "reviewed" ? "Reviewed" : "Draft"}
                      label="Review state"
                      onSelect={setMetadataState}
                      options={[
                        { value: "draft", label: "Draft" },
                        { value: "reviewed", label: "Reviewed" },
                      ]}
                      tone={metadataState === "reviewed" ? "success" : "signal"}
                      value={metadataState}
                    />
                    <HitoMetadataTag asChild interactive variant="accent" tone="signal">
                      <button type="button" disabled>
                        Unavailable action
                      </button>
                    </HitoMetadataTag>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-hairline pt-5">
              <p className="hito-label-md">Long labels stay rare</p>
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
      />

      <HitoDsPlayground
        id="selection-controls"
        label="Selection controls"
        status="Core control"
        statusTone="signal"
        description={{
          purpose:
            "Represent boolean, single-choice, and compact card-choice state with shared field geometry.",
          useWhen: "Users choose one or more explicit values whose options should remain visible.",
          avoidWhen:
            "The option set is long, needs search, or is better served by a native select or menu.",
          accessibility:
            "Checkbox, radio, and switch semantics remain native or ARIA-backed with labels, keyboard behavior, focus, invalid, and disabled state.",
        }}
        usedIn={
          <ProductLinks
            links={[
              { href: "/", label: "Calendar" },
              { href: "/settings", label: "/settings" },
              { href: "/hitoDS/components#inputs", label: "DS builders" },
            ]}
          />
        }
        demo={
          <div className="grid min-w-0">
            <SelectionControlPreview
              kind={selectionKind}
              size={selectionSize}
              selected={selectionSelected}
              onSelectedChange={setSelectionSelected}
              disabled={selectionDisabled}
              invalid={selectionInvalid}
              focusDemo={selectionFocusDemo}
              cardMode={selectionCardMode}
            />
          </div>
        }
        variants={
          <div className="grid min-w-0 gap-6" inert>
            <div className="border-t border-hairline pt-5">
              <p className="hito-label-md">Required states</p>
              <div className="mt-4 grid gap-3">
                <div className="hito-control-label hito-control-label-sm cursor-default">
                  <span
                    className="hito-checkbox hito-checkbox-sm pointer-events-none cursor-default"
                    aria-hidden="true"
                  />
                  <span>Default checkbox</span>
                </div>
                <div className="hito-control-label hito-control-label-sm cursor-default">
                  <span
                    className="hito-checkbox hito-checkbox-sm pointer-events-none cursor-default"
                    data-state="checked"
                    aria-hidden="true"
                  >
                    <Icon name="check" size="xs" />
                  </span>
                  <span>Signal-selected checkbox</span>
                </div>
                <div className="hito-control-label hito-control-label-sm cursor-default">
                  <span
                    className="hito-radio hito-radio-sm pointer-events-none cursor-default"
                    data-demo-state="focus"
                    aria-hidden="true"
                  />
                  <span>Focus-visible radio</span>
                </div>
                <div className="hito-choice-toggle-group">
                  <HitoChoiceToggle
                    size="sm"
                    className="pointer-events-none cursor-default"
                    data-demo-state="focus"
                  >
                    Focus
                  </HitoChoiceToggle>
                  <HitoChoiceToggle
                    size="sm"
                    className="pointer-events-none cursor-default"
                    data-invalid="true"
                  >
                    Invalid
                  </HitoChoiceToggle>
                  <HitoChoiceToggle
                    size="sm"
                    className="pointer-events-none cursor-default"
                    disabled
                  >
                    Disabled
                  </HitoChoiceToggle>
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
                body="Functional sizes match the button/input scale for normal controls. Decorative plan-builder choices use the separate card variant, not xl."
              />
              <ReferenceListRow
                label="Class naming"
                title="Base, structural variant, size, runtime state."
                body="Use the shared Choice Toggle API for xs, sm, or lg functional sizes and the separate card presentation for large visual choices. Runtime truth belongs in data-selected or ARIA state; min-w-0, flex-1, and grid utilities stay local to the layout that needs them."
              />
            </div>

            <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.72fr)]">
              <article className="hito-surface-flat min-w-0 p-5">
                <p className="hito-label-md">Functional toggle scale</p>
                <p className="hito-body-xs text-tertiary mt-2 max-w-xl">
                  The mixed-size row aligns to each control height instead of stretching every item
                  to the tallest toggle.
                </p>
                <div
                  className="hito-choice-toggle-group mt-4 items-center"
                  aria-label="Toggle radio size scale"
                >
                  {CHOICE_TOGGLE_SIZES.map((item) => (
                    <HitoChoiceToggle
                      key={item}
                      className="uppercase"
                      size={item}
                      selected={item === "sm"}
                      tabIndex={-1}
                    >
                      {item}
                    </HitoChoiceToggle>
                  ))}
                </div>
                <div className="mt-5 grid gap-2">
                  {CHOICE_TOGGLE_SIZES.map((item) => (
                    <div key={item} className="flex min-w-0 flex-wrap items-center gap-2">
                      <HitoButton
                        variant="secondary"
                        size={item}
                        className="uppercase"
                        tabIndex={-1}
                      >
                        {item}
                      </HitoButton>
                      <Input
                        readOnly
                        value={item}
                        aria-label={`${item} field alignment`}
                        variant="secondary"
                        size={item}
                        className="max-w-24 uppercase"
                      />
                      <HitoChoiceToggle
                        className="uppercase"
                        size={item}
                        selected={item === "sm"}
                        tabIndex={-1}
                      >
                        {item}
                      </HitoChoiceToggle>
                    </div>
                  ))}
                </div>
              </article>

              <article className="hito-surface-flat min-w-0 p-5">
                <p className="hito-label-md">Card / display choice</p>
                <p className="hito-body-xs text-tertiary mt-2">
                  Card is not part of the functional size ladder. Use it only when the choice is a
                  large visual planning moment.
                </p>
                <div
                  className="hito-choice-toggle-group mt-4"
                  aria-label="Card toggle radio example"
                >
                  <HitoChoiceToggle presentation="card" selected tabIndex={-1}>
                    <span>
                      <span className="block">Half marathon</span>
                      <span className="mt-1 block text-current/70">Goal distance choice</span>
                    </span>
                  </HitoChoiceToggle>
                  <HitoChoiceToggle presentation="card" tabIndex={-1}>
                    <span>
                      <span className="block">Build consistency</span>
                      <span className="mt-1 block text-current/70">Large onboarding choice</span>
                    </span>
                  </HitoChoiceToggle>
                </div>
              </article>
            </div>

            <article className="hito-reference-row">
              <div>
                <p className="hito-label-md">Destructive confirmation</p>
                <p className="hito-body-xs text-tertiary mt-2 max-w-xl">
                  The checkbox confirms understanding and stays signal-selected. Destructive meaning
                  belongs to warning copy and final destructive action.
                </p>
              </div>
              <div className="grid max-w-xl gap-3">
                <div className="flex items-start gap-3">
                  <Icon name="clear-calendar" size="sm" className="mt-1 text-signal" />
                  <p className="hito-field-helper">
                    This clears future scheduled workouts while keeping history archived.
                  </p>
                </div>
                <label className="hito-control-label hito-control-label-sm">
                  <input
                    type="checkbox"
                    className="hito-checkbox hito-checkbox-sm"
                    defaultChecked
                    data-state="checked"
                    tabIndex={-1}
                  />
                  <span>I understand this keeps history archived.</span>
                </label>
                <HitoButton
                  size="sm"
                  variant="secondary"
                  className="justify-self-start"
                  tabIndex={-1}
                >
                  Clear upcoming schedule
                </HitoButton>
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
                    if (
                      nextKind === "toggle" &&
                      !HITO_CHOICE_TOGGLE_SIZES.includes(selectionSize as HitoChoiceToggleSize)
                    ) {
                      setSelectionSize("sm");
                    } else if (nextKind !== "toggle" && !isBinarySelectionSize(selectionSize)) {
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
            </div>
            <div className="hito-row-group border-0">
              {selectionKind === "toggle" && (
                <ToggleRow
                  label="Card display mode"
                  active={selectionCardMode}
                  onToggle={() => setSelectionCardMode((v) => !v)}
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
      />
    </>
  );
}

function getSelectionKindLabel(kind: SelectionControlKind) {
  if (kind === "toggle") {
    return "Toggle";
  }

  return kind;
}

function getTabLabel(value: TabDemoValue) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function isBinarySelectionSize(size: ChoiceToggleSize): size is SelectionBinarySize {
  return size === "sm" || size === "md";
}

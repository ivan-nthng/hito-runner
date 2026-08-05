import { useState } from "react";
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
import { HitoNativeSelectField } from "@/components/ui/native-select-field";
import { useHitoRadioGroup } from "@/components/ui/hito-radio-group";
import { useHitoTabs } from "@/components/ui/hito-tabs";
import { Textarea } from "@/components/ui/textarea";
import { HitoDsPlayground } from "@/components/hito-ds/playground";
import { EditableValueFieldSandbox } from "@/components/hito-ds/editable-value-field-sandbox";
import { ProductLinks, ReferenceListRow, SectionIntro } from "@/components/hito-ds/reference";
import {
  ChoiceSelector,
  DataTableSpecimenPreview,
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
const DATA_TABLE_SORT_DIRECTIONS = ["asc", "desc"] as const;
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
type DataTableSortDirection = (typeof DATA_TABLE_SORT_DIRECTIONS)[number];

type FieldSize = HitoFieldSize;
type TabDemoValue = "plan" | "progress" | "updates" | "archived";

export function HitoDsComponentControls() {
  const [variant, setVariant] = useState<ButtonVariant>("primary");
  const [buttonTone, setButtonTone] = useState<ButtonTone>("default");
  const [size, setSize] = useState<ButtonSize>("lg");
  const [leftIcon, setLeftIcon] = useState(true);
  const [rightIcon, setRightIcon] = useState(true);
  const [buttonMotionState, setButtonMotionState] = useState<ButtonMotionState>("default");
  const [buttonProgress, setButtonProgress] = useState<ButtonProgressValue>("75%");
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
  const [nativeSelectDemo, setNativeSelectDemo] = useState("easy");
  const [tabStyle, setTabStyle] = useState<TabStyle>("simple");
  const [tabIcon, setTabIcon] = useState(true);
  const [tabBadge, setTabBadge] = useState(true);
  const [tabDot, setTabDot] = useState(true);
  const [tabDisabled, setTabDisabled] = useState(true);
  const [tabDemoValue, setTabDemoValue] = useState<TabDemoValue>("plan");
  const tabDemo = useHitoTabs({
    items: [
      { value: "plan" },
      { value: "progress" },
      { value: "updates" },
      { value: "archived", disabled: tabDisabled },
    ],
    value: tabDemoValue,
  });
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
  const [dataTableSortable, setDataTableSortable] = useState(true);
  const [dataTableActiveSort, setDataTableActiveSort] = useState(true);
  const [dataTableSortDirection, setDataTableSortDirection] =
    useState<DataTableSortDirection>("asc");
  const [dataTableFiltered, setDataTableFiltered] = useState(true);
  const [dataTableStaticMode, setDataTableStaticMode] = useState(false);
  const [dataTableUtilityRow, setDataTableUtilityRow] = useState(true);

  return (
    <>
      <HitoDsPlayground
        id="buttons"
        label="Buttons"
        status="Core control"
        statusTone="signal"
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
                  demoState="active"
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
                <DemoButton variant={variant} tone={buttonTone} size={size} loading disabled />
                <DemoButton variant={variant} tone={buttonTone} size={size} motionState="success" />
                <DemoButton variant={variant} tone={buttonTone} size={size} motionState="error" />
                <DemoButton
                  variant={variant}
                  tone={buttonTone}
                  size={size}
                  motionState="timed-progress"
                  progress={0.64}
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
            <div className="border-t border-hairline pt-5">
              <p className="hito-label">Icon-only configuration</p>
              <p className="hito-caption mt-1 max-w-2xl">
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

      <HitoDsPlayground
        id="tabs"
        label="Tabs"
        status="Core control"
        statusTone="signal"
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
              <button
                type="button"
                {...tabDemo.getTabProps("plan")}
                className="hito-tab"
                data-active={tabDemoValue === "plan" ? "true" : undefined}
                onClick={() => setTabDemoValue("plan")}
              >
                {tabIcon && <Icon name="calendar" size="sm" className="hito-tab-icon" />}
                Plan
              </button>
              <button
                type="button"
                {...tabDemo.getTabProps("progress")}
                className="hito-tab"
                data-active={tabDemoValue === "progress" ? "true" : undefined}
                onClick={() => setTabDemoValue("progress")}
              >
                {tabIcon && <Icon name="progress" size="sm" className="hito-tab-icon" />}
                Progress
                {tabBadge && (
                  <span className="hito-tab-badge" data-variant="count">
                    3
                  </span>
                )}
              </button>
              <button
                type="button"
                {...tabDemo.getTabProps("updates")}
                className="hito-tab"
                data-active={tabDemoValue === "updates" ? "true" : undefined}
                onClick={() => setTabDemoValue("updates")}
              >
                Updates
                {tabDot && <span className="hito-tab-dot" aria-hidden="true" />}
              </button>
              {tabDisabled && (
                <button
                  type="button"
                  {...tabDemo.getTabProps("archived")}
                  className="hito-tab"
                  disabled
                >
                  Archived
                </button>
              )}
            </div>
            <p className="hito-caption mt-3" {...tabDemo.getPanelProps(tabDemoValue)}>
              {tabDemoValue === "plan"
                ? "Plan view"
                : tabDemoValue === "progress"
                  ? "Progress view"
                  : "Updates view"}
            </p>
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

      <HitoDsPlayground
        id="data-table"
        label="Data table"
        status="Pattern"
        statusTone="signal"
        usedIn={
          <ProductLinks
            links={[
              { href: "/admin/analytics", label: "/admin/analytics" },
              { href: "/hitoDS", label: "/hitoDS" },
            ]}
          />
        }
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
                Sortable, active-sort, filtered, hover/demo, and static header cells stay in one
                contained table scroll region.
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
                Read-only table headers keep the same typography and spacing without implying
                clickable sorting.
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
      />

      <HitoDsPlayground
        id="inputs"
        label="Inputs"
        status="Core control"
        statusTone="signal"
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
                <span className="hito-field-error">Choose a start date before importing.</span>
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
                <Textarea
                  rows={5}
                  className="resize-none"
                  placeholder="Describe goal, constraints, recent results, or JSON notes."
                />
              </label>
              <div className="grid min-w-0 gap-3 lg:col-span-2">
                <div>
                  <p className="hito-label">Header input variant</p>
                  <p className="hito-caption mt-2 max-w-2xl">
                    True editable headings use the shared inline text primitive with Hito-sized
                    header field padding, fit-content width, and an edit affordance that stays
                    adjacent to the text.
                  </p>
                </div>
                <div className="grid min-w-0 gap-3 md:grid-cols-3">
                  {(["sm", "md", "lg"] as const).map((headerSize) => (
                    <InlineEditableText
                      key={headerSize}
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
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-hairline pt-5">
              <div>
                <p className="hito-label">Dual-value range</p>
                <p className="hito-caption mt-2 max-w-2xl">
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
                  value={dualRangeValue}
                  onMinValueChange={(value) =>
                    setDualRangeValue(([currentMin, currentMax]) => [
                      Math.min(value, currentMax),
                      currentMax,
                    ])
                  }
                  onMaxValueChange={(value) =>
                    setDualRangeValue(([currentMin, currentMax]) => [
                      currentMin,
                      Math.max(value, currentMin),
                    ])
                  }
                />
                <div className="flex items-center justify-between gap-3">
                  <span className="hito-caption">Minimum {dualRangeValue[0]}</span>
                  <span className="hito-caption">Maximum {dualRangeValue[1]}</span>
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
              <div className="mb-4">
                <p className="hito-label">Date and time inputs</p>
                <p className="hito-caption mt-2 max-w-2xl">
                  Date/time truth stays ISO or duration-shaped in state. Calendar selection, typed
                  date entry, compact optional date fields, and masked time entry share the same
                  Hito field rhythm.
                </p>
              </div>
              <div className="hito-reference-list">
                <article className="hito-reference-row items-start">
                  <div>
                    <p className="hito-list-row-title">Native select field</p>
                    <p className="hito-caption mt-2">
                      Native option behavior with the shared Hito field, label, and helper anatomy.
                    </p>
                  </div>
                  <HitoNativeSelectField
                    id="ds-native-select-field"
                    label="Workout type"
                    value={nativeSelectDemo}
                    onValueChange={setNativeSelectDemo}
                    helper="Use when native selection behavior is the right interaction."
                    options={[
                      { value: "easy", label: "Easy run" },
                      { value: "tempo", label: "Tempo" },
                      { value: "intervals", label: "Intervals" },
                    ]}
                  />
                </article>
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
                      Error, disabled, and bounded date states stay in the same field-owned anatomy.
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
                    <p className="hito-caption mt-2">
                      Empty state is an action; saved state is visible and editable.
                    </p>
                  </div>
                  <HitoEditableDateField
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
                      Use for race targets and durations. Continuous digits normalize while editing.
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
                    <p className="hito-caption mt-2">
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

      <EditableValueFieldSandbox />

      <HitoDsPlayground
        id="status"
        label="Status"
        status="Core feedback"
        statusTone="signal"
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
              Status is display-only. Tone and concise readable labels carry the meaningful state;
              actions still use buttons and menus.
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
              <p className="hito-label">Metadata tags and menu</p>
              <p className="hito-caption mt-1">
                Read-only metadata and interactive operational metadata share the runtime tag owner.
              </p>
              <div className="mt-4 flex min-w-0 flex-wrap items-center gap-3">
                <HitoMetadataTag
                  tone="success"
                  tooltip="The backend-reviewed draft is ready to confirm."
                >
                  Reviewed
                </HitoMetadataTag>
                <HitoMetadataTag tooltip="Canonical generated-plan contract.">
                  Plan first
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
      />

      <HitoDsPlayground
        id="selection-controls"
        label="Selection controls"
        status="Core control"
        statusTone="signal"
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
              <p className="hito-label">Required states</p>
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
                <p className="hito-label">Functional toggle scale</p>
                <p className="hito-caption mt-2 max-w-xl">
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
                <p className="hito-label">Card / display choice</p>
                <p className="hito-caption mt-2">
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
                <p className="hito-label">Destructive confirmation</p>
                <p className="hito-caption mt-2 max-w-xl">
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

function isBinarySelectionSize(size: ChoiceToggleSize): size is SelectionBinarySize {
  return size === "sm" || size === "md";
}

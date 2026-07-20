import { useState } from "react";
import { AdminMetadataMenu } from "@/components/admin/AdminOperationalComponents";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EditableSelectValueChip, EditableValueChip } from "@/components/ui/editable-value-chip";
import {
  HitoDateField,
  HitoEditableDateChip,
  HitoMaskedTimeField,
} from "@/components/ui/hito-date-time-input";
import { Icon } from "@/components/ui/icon";
import { InlineEditableText } from "@/components/ui/inline-editable-text";
import { HitoMetadataTag } from "@/components/ui/metadata-tag";
import { HitoNativeSelectField } from "@/components/ui/native-select-field";
import { HitoDsPlayground } from "@/components/hito-ds/playground";
import { ProductLinks, ReferenceListRow } from "@/components/hito-ds/reference";
import {
  ChoiceSelector,
  DataTableSpecimenPreview,
  DemoButton,
  DemoInput,
  SelectionControlPreview,
  ToggleRow,
} from "@/components/hito-ds/specimen-previews";
import { cn } from "@/lib/utils";

const BUTTON_VARIANTS = ["primary", "secondary", "outlined", "ghost"] as const;
const BUTTON_TONES = ["default", "success", "error"] as const;
const BUTTON_SIZES = ["xs", "sm", "md", "lg", "xl"] as const;
const INPUT_VARIANTS = ["primary", "secondary"] as const;
const FIELD_SIZES = ["xs", "sm", "md", "lg", "xl"] as const;
const INPUT_STATES = ["default", "hover", "focus", "disabled", "readonly"] as const;
const INPUT_FEEDBACK = ["neutral", "error", "success"] as const;
const CHOICE_TOGGLE_SIZES = ["xs", "sm", "md", "lg", "xl"] as const;
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

type ButtonVariant = (typeof BUTTON_VARIANTS)[number];
type ButtonTone = (typeof BUTTON_TONES)[number];
type ButtonSize = (typeof BUTTON_SIZES)[number];
type InputVariant = (typeof INPUT_VARIANTS)[number];
type InputState = (typeof INPUT_STATES)[number];
type InputFeedback = (typeof INPUT_FEEDBACK)[number];
type ChoiceToggleSize = (typeof CHOICE_TOGGLE_SIZES)[number];
type SelectionControlKind = (typeof SELECTION_CONTROL_KINDS)[number];
type SelectionBinarySize = (typeof SELECTION_BINARY_SIZES)[number];
type TabStyle = (typeof TAB_STYLES)[number];
type StatusTone = (typeof STATUS_TONES)[number];
type DataTableSortDirection = (typeof DATA_TABLE_SORT_DIRECTIONS)[number];

type FieldSize = (typeof FIELD_SIZES)[number];
type ReferenceScalarField = "age" | "height" | "weight";
type ReferenceEditableField = ReferenceScalarField | "terrain";

export function HitoDsComponentControls() {
  const [variant, setVariant] = useState<ButtonVariant>("primary");
  const [buttonTone, setButtonTone] = useState<ButtonTone>("default");
  const [size, setSize] = useState<ButtonSize>("lg");
  const [leftIcon, setLeftIcon] = useState(true);
  const [rightIcon, setRightIcon] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [inputVariant, setInputVariant] = useState<InputVariant>("primary");
  const [inputSize, setInputSize] = useState<FieldSize>("md");
  const [inputLeftIcon, setInputLeftIcon] = useState(true);
  const [inputRightIcon, setInputRightIcon] = useState(false);
  const [inputState, setInputState] = useState<InputState>("default");
  const [inputFeedback, setInputFeedback] = useState<InputFeedback>("neutral");
  const [dateFieldDemo, setDateFieldDemo] = useState("2026-12-11");
  const [editableDateDemo, setEditableDateDemo] = useState("");
  const [boundedDateDemo, setBoundedDateDemo] = useState("2026-05-29");
  const [timeFieldDemo, setTimeFieldDemo] = useState("3:50:00");
  const [nativeSelectDemo, setNativeSelectDemo] = useState("easy");
  const [activeEditableField, setActiveEditableField] = useState<ReferenceEditableField | null>(
    null,
  );
  const [editableValues, setEditableValues] = useState<Record<ReferenceScalarField, string>>({
    age: "36",
    height: "",
    weight: "72",
  });
  const [editableTerrain, setEditableTerrain] = useState("road");
  const [tabStyle, setTabStyle] = useState<TabStyle>("simple");
  const [tabIcon, setTabIcon] = useState(true);
  const [tabBadge, setTabBadge] = useState(true);
  const [tabDot, setTabDot] = useState(true);
  const [tabDisabled, setTabDisabled] = useState(true);
  const [statusTone, setStatusTone] = useState<StatusTone>("signal");
  const [statusLongLabel, setStatusLongLabel] = useState(false);
  const [metadataState, setMetadataState] = useState("reviewed");
  const [selectionKind, setSelectionKind] = useState<SelectionControlKind>("toggle");
  const [selectionSize, setSelectionSize] = useState<ChoiceToggleSize>("md");
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
        title="Variants, sizes, icons, disabled state."
        body="Use the builder to check CTA hierarchy and icon rhythm across the canonical button system."
        status="Core control"
        statusTone="signal"
        demo={
          <div className="flex min-w-0 items-center justify-center" data-hito-ds-button-preview>
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
                <DemoButton variant={variant} tone={buttonTone} size={size} loading disabled />
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
              <button type="button" className="hito-tab" data-active="true" aria-selected="true">
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
                  <button type="button" className="hito-tab" disabled aria-selected="false">
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
                <textarea
                  rows={5}
                  className="hito-field hito-field-primary hito-textarea-md resize-none"
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
              <div className="mb-4">
                <p className="hito-label">Date and time inputs</p>
                <p className="hito-caption mt-2 max-w-2xl">
                  Date/time truth stays ISO or duration-shaped in state. Calendar selection, typed
                  date entry, compact optional date chips, and masked time entry share the same Hito
                  field rhythm.
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
                      Edit is a separate product label, not hidden inside avatar hover chrome.
                    </p>
                  </div>
                  <div className="hito-avatar-stack">
                    <Avatar className="hito-avatar-tile hito-profile-avatar">
                      <AvatarFallback className="hito-profile-avatar-fallback">
                        <Icon name="user" size="lg" />
                      </AvatarFallback>
                    </Avatar>
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
                Compact scalar facts use editable value chips, not full form cards or normal text
                rows.
              </p>
              <div className="hito-reference-list mt-4">
                <article className="hito-reference-row">
                  <div>
                    <p className="hito-list-row-title">Interactive scalar and select chips</p>
                    <p className="hito-caption mt-2">
                      These are the runtime owners. Click any empty or saved chip to enter its real
                      editing state.
                    </p>
                  </div>
                  <div className="hito-editable-value-chip-group">
                    {(
                      [
                        ["age", "Age", "36", 12, 110, 1, "numeric", undefined],
                        ["height", "Height", "175", 80, 250, 1, "numeric", "cm"],
                        ["weight", "Weight", "72", 25, 350, 0.1, "decimal", "kg"],
                      ] as const
                    ).map(([fieldKey, label, placeholder, min, max, step, inputMode, unit]) => (
                      <EditableValueChip
                        key={fieldKey}
                        fieldKey={fieldKey}
                        label={label}
                        value={editableValues[fieldKey]}
                        setValue={(value) =>
                          setEditableValues((current) => ({ ...current, [fieldKey]: value }))
                        }
                        activeEditableKey={activeEditableField}
                        setActiveEditableKey={setActiveEditableField}
                        placeholder={placeholder}
                        min={min}
                        max={max}
                        step={step}
                        inputMode={inputMode}
                        unit={unit}
                      />
                    ))}
                    <EditableSelectValueChip
                      activeEditableKey={activeEditableField}
                      emptyLabel="Add terrain"
                      fieldKey="terrain"
                      label="Terrain"
                      options={[
                        { value: "road", label: "Road" },
                        { value: "trail", label: "Trail" },
                        { value: "mixed", label: "Mixed" },
                      ]}
                      setActiveEditableKey={setActiveEditableField}
                      setValue={setEditableTerrain}
                      value={editableTerrain}
                    />
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
              cardMode={selectionCardMode}
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
                body="Functional sizes match the button/input scale for normal controls. Decorative plan-builder choices use the separate card variant, not xl."
              />
              <ReferenceListRow
                label="Class naming"
                title="Base, structural variant, size, runtime state."
                body="Use hito-choice-toggle as the base, hito-choice-toggle-card only for display/card choices, and hito-choice-toggle-xs|sm|md|lg|xl for functional size. Runtime truth belongs in data-selected or ARIA state; min-w-0, flex-1, and grid utilities stay local to the layout that needs them."
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
                  role="radiogroup"
                  aria-label="Toggle radio size scale"
                >
                  {CHOICE_TOGGLE_SIZES.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={cn("hito-choice-toggle uppercase", `hito-choice-toggle-${item}`)}
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
                        className={cn("hito-choice-toggle uppercase", `hito-choice-toggle-${item}`)}
                        data-selected={item === "md"}
                      >
                        {item}
                      </button>
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
                  role="radiogroup"
                  aria-label="Card toggle radio example"
                >
                  <button
                    type="button"
                    className="hito-choice-toggle hito-choice-toggle-card"
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
                    className="hito-choice-toggle hito-choice-toggle-card"
                    role="radio"
                    aria-checked="false"
                  >
                    <span>
                      <span className="block">Build consistency</span>
                      <span className="mt-1 block text-current/70">Large onboarding choice</span>
                    </span>
                  </button>
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
                  />
                  <span>I understand this keeps history archived.</span>
                </label>
                <button
                  type="button"
                  className="hito-button hito-button-secondary hito-button-sm justify-self-start"
                >
                  Clear upcoming schedule
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

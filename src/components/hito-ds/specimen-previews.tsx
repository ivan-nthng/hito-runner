import { useState } from "react";
import {
  AdminDataTableColumnHeader,
  AdminDataTableStaticHeader,
  AdminDataTableToolbar,
} from "@/components/admin/AdminOperationalComponents";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { HitoButton } from "@/components/ui/button";
import { HitoChoiceToggle } from "@/components/ui/hito-choice-toggle";
import {
  HITO_BUTTON_SIZES,
  HITO_BUTTON_TONES,
  HITO_BUTTON_VARIANTS,
  HITO_CHOICE_TOGGLE_SIZES,
  type HitoButtonSize,
  type HitoButtonState,
  type HitoButtonTone,
  type HitoButtonVariant,
  type HitoChoiceToggleSize,
  type HitoFieldFeedback,
  type HitoFieldSize,
  type HitoFieldVariant,
} from "@/components/ui/hito-control-contract";
import { Icon, type HitoIconName } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { useHitoRadioGroup } from "@/components/ui/hito-radio-group";
import { cn } from "@/lib/utils";

type ButtonVariant = HitoButtonVariant;
type ButtonTone = HitoButtonTone;
type ButtonSize = HitoButtonSize;
type ButtonMotionState = HitoButtonState;
type InputVariant = HitoFieldVariant;
type InputState = "default" | "hover" | "focus" | "disabled" | "readonly";
type InputFeedback = HitoFieldFeedback;
type ChoiceToggleSize = HitoChoiceToggleSize;
type SelectionControlSize = HitoChoiceToggleSize | SelectionBinarySize;
type SelectionControlKind = "checkbox" | "radio" | "toggle";
type SelectionBinarySize = "sm" | "md";
type ModalSizeMode = "compact" | "standard" | "wide" | "workflow" | "review";
type ModalBodyMode = "content-fit" | "scroll-fill";
type ModalHeaderMode = "title-only" | "with-description";
type ModalFooterMode = "none" | "actions" | "note-actions";
type ModalPreviewPresentation = "live" | "static";
type DataTableSortDirection = "asc" | "desc";
type DataTableHeaderState = "static" | "sortable" | "sorted-asc" | "sorted-desc" | "filtered";
type DataTableSpecimenSortKey = "runner" | "status" | "workouts" | "none";
export type DataTableReferenceDensity = "sm" | "md" | "lg";

type DataTableSpecimenRow = {
  id: string;
  name: string;
  email: string;
  initials: string;
  plan: string;
  planDetail: string;
  lastActivityDate: string;
  lastActivityTime: string;
  workouts: number;
  status: "Active" | "Paused";
};

const DATA_TABLE_SPECIMEN_ROWS: readonly DataTableSpecimenRow[] = [
  {
    id: "mara",
    name: "Mara Vale",
    email: "mara@hito.test",
    initials: "MV",
    plan: "Base rebuild",
    planDetail: "Week 4 of 8",
    lastActivityDate: "Aug 12, 2026",
    lastActivityTime: "07:42",
    workouts: 18,
    status: "Active",
  },
  {
    id: "noor",
    name: "Noor Silva",
    email: "noor@hito.test",
    initials: "NS",
    plan: "Half marathon",
    planDetail: "Week 7 of 12",
    lastActivityDate: "Aug 11, 2026",
    lastActivityTime: "18:10",
    workouts: 11,
    status: "Paused",
  },
  {
    id: "eli",
    name: "Eli Santos",
    email: "eli@hito.test",
    initials: "ES",
    plan: "5K progression",
    planDetail: "Week 3 of 6",
    lastActivityDate: "Aug 13, 2026",
    lastActivityTime: "06:25",
    workouts: 24,
    status: "Active",
  },
];

const BUTTON_VARIANTS = HITO_BUTTON_VARIANTS;
const BUTTON_TONES = HITO_BUTTON_TONES;
const BUTTON_SIZES = HITO_BUTTON_SIZES;

const DATA_TABLE_DENSITY_TEXT: Record<
  DataTableReferenceDensity,
  { primary: string; secondary: string }
> = {
  sm: { primary: "hito-body-sm", secondary: "hito-body-xs" },
  md: { primary: "hito-body-md", secondary: "hito-body-xs" },
  lg: { primary: "hito-body-lg", secondary: "hito-body-sm" },
};

function useDataTableSpecimenState(initialFilter: "all" | "active" = "all") {
  const [query, setQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState(initialFilter);
  const [activeSortState, setActiveSortState] = useState<{
    key: DataTableSpecimenSortKey;
    direction: DataTableSortDirection;
  }>({
    key: "workouts",
    direction: "desc",
  });

  const activeFilters =
    selectedFilter === "active"
      ? [
          {
            id: "status",
            label: "Status",
            value: "Active",
            onRemove: () => setSelectedFilter("all"),
          },
        ]
      : [];

  const normalizedQuery = query.trim().toLowerCase();
  const rows = DATA_TABLE_SPECIMEN_ROWS.filter((row) => {
    const matchesFilter = selectedFilter === "all" || row.status === "Active";
    const matchesQuery =
      normalizedQuery.length === 0 ||
      row.name.toLowerCase().includes(normalizedQuery) ||
      row.email.toLowerCase().includes(normalizedQuery);
    return matchesFilter && matchesQuery;
  }).sort((left, right) => {
    if (activeSortState.key === "none") return 0;
    const direction = activeSortState.direction === "asc" ? 1 : -1;
    if (activeSortState.key === "workouts") {
      return (left.workouts - right.workouts) * direction;
    }
    if (activeSortState.key === "status") {
      return left.status.localeCompare(right.status) * direction;
    }
    return left.name.localeCompare(right.name) * direction;
  });

  return {
    activeFilters,
    activeSortState,
    query,
    rows,
    selectedFilter,
    setActiveSortState,
    setQuery,
    setSelectedFilter,
  };
}

type DataTableSpecimenState = ReturnType<typeof useDataTableSpecimenState>;

function DataTableToolbarSpecimen({ state }: { state: DataTableSpecimenState }) {
  return (
    <AdminDataTableToolbar
      activeFilters={state.activeFilters}
      clearAllFilters={() => state.setSelectedFilter("all")}
      filterSections={[
        {
          currentValue: state.selectedFilter,
          label: "Status",
          onSelect: (value) => state.setSelectedFilter(value === "active" ? "active" : "all"),
          options: [
            { value: "all", label: "All states" },
            { value: "active", label: "Active" },
          ],
        },
      ]}
      onQueryChange={state.setQuery}
      query={state.query}
      rowCountLabel={`${state.rows.length} ${state.rows.length === 1 ? "row" : "rows"}`}
      searchLabel="Search data table specimen"
      searchPlaceholder="Search runners"
    />
  );
}

function FixedHeaderCell({ state }: { state: DataTableHeaderState }) {
  const [activeSort, setActiveSort] = useState<{
    key: DataTableSpecimenSortKey;
    direction: DataTableSortDirection;
  }>({
    key: state === "sorted-asc" || state === "sorted-desc" ? "workouts" : "none",
    direction: state === "sorted-desc" ? "desc" : "asc",
  });
  const [selectedFilter, setSelectedFilter] = useState(state === "filtered" ? "active" : "all");

  if (state === "static") {
    return <AdminDataTableStaticHeader label="Workouts" />;
  }

  return (
    <AdminDataTableColumnHeader
      activeSort={activeSort}
      column="workouts"
      filterActive={state === "filtered" && selectedFilter !== "all"}
      filterOptions={
        state === "filtered"
          ? [
              { value: "all", label: "All states" },
              { value: "active", label: "Active" },
            ]
          : undefined
      }
      label="Workouts"
      menuLabel={`Sort${state === "filtered" ? " and filter" : ""} Workouts`}
      onFilterChange={state === "filtered" ? setSelectedFilter : undefined}
      onSort={(key, direction) => setActiveSort({ key, direction })}
      selectedFilter={selectedFilter}
      sortOptions={[
        { key: "workouts", direction: "asc", label: "Sort ascending" },
        { key: "workouts", direction: "desc", label: "Sort descending" },
      ]}
    />
  );
}

export function DataTableHeaderDemo({
  density = "md",
  state,
}: {
  density?: DataTableReferenceDensity;
  state: DataTableHeaderState;
}) {
  return (
    <div className="hito-data-table-scroll w-full max-w-sm">
      <table className="hito-data-table w-full" data-hito-reference-table-density={density}>
        <caption className="sr-only">{state} data table header.</caption>
        <thead>
          <tr>
            <FixedHeaderCell key={state} state={state} />
          </tr>
        </thead>
      </table>
    </div>
  );
}

export function DataTableHeaderVariants({ states }: { states: readonly DataTableHeaderState[] }) {
  return (
    <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {states.map((state) => (
        <div key={state} className="grid min-w-0 gap-2">
          <p className="hito-label-sm capitalize">{state.replaceAll("-", " ")}</p>
          <div inert>
            <DataTableHeaderDemo state={state} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DataTableControlsDemo({
  initialFilter = "all",
}: {
  initialFilter?: "all" | "active";
}) {
  const state = useDataTableSpecimenState(initialFilter);
  return <DataTableToolbarSpecimen state={state} />;
}

export function DataTableSpecimenPreview({
  headerState = "sortable",
  showToolbar = false,
}: {
  composition: "headers";
  headerState?: DataTableHeaderState;
  showToolbar?: boolean;
}) {
  return showToolbar ? (
    <LiveDataTable initialFilter={headerState === "filtered" ? "active" : "all"} />
  ) : (
    <DataTableHeaderDemo state={headerState} />
  );
}

function RunnerIdentityCell({
  density,
  row,
}: {
  density: DataTableReferenceDensity;
  row: DataTableSpecimenRow;
}) {
  const text = DATA_TABLE_DENSITY_TEXT[density];

  return (
    <td className="hito-data-table-cell">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="h-8 w-8 border border-hairline bg-background">
          <AvatarFallback className="hito-label-sm">{row.initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <span className={cn(text.primary, "block font-medium text-foreground")}>{row.name}</span>
          <span className="hito-technical-sm hito-data-table-code-width-sm mt-1 block truncate text-secondary">
            {row.email}
          </span>
        </div>
      </div>
    </td>
  );
}

function RunnerValueCells({
  density,
  row,
}: {
  density: DataTableReferenceDensity;
  row: DataTableSpecimenRow;
}) {
  const text = DATA_TABLE_DENSITY_TEXT[density];

  return (
    <>
      <td className="hito-data-table-cell whitespace-nowrap">
        <span className={cn(text.primary, "block font-medium text-foreground")}>{row.plan}</span>
        <span className={cn(text.secondary, "mt-1 block text-secondary")}>{row.planDetail}</span>
      </td>
      <td className="hito-data-table-cell whitespace-nowrap">
        <span className={cn(text.primary, "block")}>{row.lastActivityDate}</span>
        <span className={cn(text.secondary, "mt-1 block text-secondary")}>
          {row.lastActivityTime}
        </span>
      </td>
      <td className="hito-data-table-cell tabular-nums">
        <span className={cn(text.primary, "block font-medium text-foreground")}>
          {row.workouts}
        </span>
        <span className={cn(text.secondary, "mt-1 block text-secondary")}>workouts</span>
      </td>
      <td className="hito-data-table-cell">
        <span
          className="hito-status-pill"
          data-tone={row.status === "Active" ? "success" : "muted"}
        >
          {row.status}
        </span>
      </td>
      <td className="hito-data-table-cell hito-data-table-cell-end text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <HitoButton
              type="button"
              variant="ghost"
              size="xs"
              iconOnly
              aria-label={`Open actions for ${row.name}`}
            >
              <Icon name="more-horizontal" size="xs" decorative />
            </HitoButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="hito-shell-menu">
            <DropdownMenuLabel className="hito-label-sm">Runner actions</DropdownMenuLabel>
            <DropdownMenuItem className="hito-shell-menu-item">View runner</DropdownMenuItem>
            <DropdownMenuItem className="hito-shell-menu-item">Copy email</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </>
  );
}

export function DataTableRowsDemo({ density }: { density: DataTableReferenceDensity }) {
  const row = DATA_TABLE_SPECIMEN_ROWS[0];

  return (
    <div className="grid min-w-0 gap-3">
      <div className="hito-data-table-scroll">
        <table
          className="hito-data-table hito-data-table-min-md"
          data-hito-reference-table-density={density}
        >
          <caption className="sr-only">Approved Hito data table row anatomy.</caption>
          <thead className="sr-only">
            <tr>
              <AdminDataTableStaticHeader label="Select" />
              <AdminDataTableStaticHeader label="Runner" />
              <AdminDataTableStaticHeader label="Plan" />
              <AdminDataTableStaticHeader label="Last activity" />
              <AdminDataTableStaticHeader label="Workouts" />
              <AdminDataTableStaticHeader label="Status" />
              <AdminDataTableStaticHeader label="Actions" />
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="hito-data-table-cell hito-data-table-cell-start align-middle">
                <input
                  type="checkbox"
                  className="hito-checkbox hito-checkbox-sm"
                  aria-label={`Select ${row.name}`}
                />
              </td>
              <RunnerIdentityCell density={density} row={row} />
              <RunnerValueCells density={density} row={row} />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LiveDataTable({
  density = "md",
  initialFilter = "all",
}: {
  density?: DataTableReferenceDensity;
  initialFilter?: "all" | "active";
}) {
  const state = useDataTableSpecimenState(initialFilter);

  return (
    <div className="grid min-w-0 gap-4">
      <DataTableToolbarSpecimen state={state} />
      <div className="hito-data-table-scroll">
        <table
          className="hito-data-table hito-data-table-min-md"
          data-hito-reference-table-density={density}
        >
          <caption className="sr-only">Interactive Hito data table specimen.</caption>
          <thead>
            <tr>
              <AdminDataTableStaticHeader label="Select" />
              <AdminDataTableColumnHeader
                activeSort={state.activeSortState}
                column="runner"
                filterActive={false}
                label="Runner"
                menuLabel="Sort Runner"
                onSort={(key, direction) => state.setActiveSortState({ key, direction })}
                sortOptions={[
                  { key: "runner", direction: "asc", label: "Sort ascending" },
                  { key: "runner", direction: "desc", label: "Sort descending" },
                ]}
              />
              <AdminDataTableStaticHeader label="Plan" />
              <AdminDataTableStaticHeader label="Last activity" />
              <AdminDataTableColumnHeader
                activeSort={state.activeSortState}
                column="workouts"
                filterActive={false}
                label="Workouts"
                menuLabel="Sort Workouts"
                onSort={(key, direction) => state.setActiveSortState({ key, direction })}
                sortOptions={[
                  { key: "workouts", direction: "asc", label: "Sort ascending" },
                  { key: "workouts", direction: "desc", label: "Sort descending" },
                ]}
              />
              <AdminDataTableColumnHeader
                activeSort={state.activeSortState}
                column="status"
                filterActive={state.selectedFilter !== "all"}
                filterOptions={[
                  { value: "all", label: "All states" },
                  { value: "active", label: "Active" },
                ]}
                label="Status"
                menuLabel="Sort and filter Status"
                onFilterChange={(value) =>
                  state.setSelectedFilter(value === "active" ? "active" : "all")
                }
                onSort={(key, direction) => state.setActiveSortState({ key, direction })}
                selectedFilter={state.selectedFilter}
                sortOptions={[
                  { key: "status", direction: "asc", label: "Sort ascending" },
                  { key: "status", direction: "desc", label: "Sort descending" },
                ]}
              />
              <AdminDataTableStaticHeader label="Actions" />
            </tr>
          </thead>
          <tbody>
            {state.rows.length > 0 ? (
              state.rows.map((row) => (
                <tr key={row.id}>
                  <td className="hito-data-table-cell hito-data-table-cell-start align-middle">
                    <input
                      type="checkbox"
                      className="hito-checkbox hito-checkbox-sm"
                      aria-label={`Select ${row.name}`}
                    />
                  </td>
                  <RunnerIdentityCell density={density} row={row} />
                  <RunnerValueCells density={density} row={row} />
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="hito-data-table-cell hito-data-table-cell-start hito-data-table-cell-end text-secondary"
                  colSpan={7}
                >
                  No matching rows
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function DataTableLiveDemo({ density }: { density: DataTableReferenceDensity }) {
  return <LiveDataTable density={density} />;
}

export function ModalWindowPreview({
  sizeMode,
  bodyMode,
  headerMode,
  footerMode,
  showStatusPill,
  destructive,
  longContent,
  presentation,
}: {
  sizeMode: ModalSizeMode;
  bodyMode: ModalBodyMode;
  headerMode: ModalHeaderMode;
  footerMode: ModalFooterMode;
  showStatusPill: boolean;
  destructive: boolean;
  longContent: boolean;
  presentation: ModalPreviewPresentation;
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

  const bodyClassName = cn(
    bodyMode === "scroll-fill"
      ? "hito-product-dialog-body-scroll-fill"
      : "hito-product-dialog-body",
    "grid gap-3",
  );
  const sizeClassNameByMode: Record<ModalSizeMode, string> = {
    compact: "hito-dialog-size-compact",
    standard: "hito-dialog-size-standard",
    wide: "hito-dialog-size-wide",
    workflow: "hito-dialog-size-workflow",
    review: "hito-dialog-size-review",
  };
  const heightClassNameByMode: Record<ModalSizeMode, string> = {
    compact: "hito-dialog-height-standard",
    standard: "hito-dialog-height-standard",
    wide: "hito-dialog-height-wide",
    workflow: "hito-dialog-height-workflow",
    review: "hito-dialog-height-review",
  };
  const contentClassName = cn(
    "hito-dialog-stable hito-product-dialog hito-dialog-surface-product",
    sizeClassNameByMode[sizeMode],
    bodyMode === "content-fit" && "hito-product-dialog-content-fit",
    bodyMode === "scroll-fill" && heightClassNameByMode[sizeMode],
  );

  const renderModalContents = (live: boolean) => (
    <>
      <DialogHeader className="hito-product-dialog-header">
        <div>
          {live ? (
            <>
              <DialogTitle className="hito-ui-title-md">{title}</DialogTitle>
              <DialogDescription
                className={
                  headerMode === "with-description"
                    ? "hito-body-md text-secondary mt-2 max-w-lg"
                    : "sr-only"
                }
              >
                {description}
              </DialogDescription>
            </>
          ) : (
            <>
              <h3 className="hito-ui-title-md">{title}</h3>
              {headerMode === "with-description" ? (
                <p className="hito-body-md text-secondary mt-2 max-w-lg">{description}</p>
              ) : null}
            </>
          )}
          {showStatusPill && (
            <span
              className="hito-status-pill mt-3"
              data-tone={destructive ? "destructive" : "signal"}
            >
              {destructive ? "Destructive" : bodyMode}
            </span>
          )}
        </div>
      </DialogHeader>
      <div className={bodyClassName}>
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
                This row belongs inside the modal body. Scroll-fill keeps this middle region bounded
                when content grows.
              </p>
            </div>
          </div>
        ))}
      </div>
      {footerMode !== "none" && (
        <DialogFooter className="hito-product-dialog-footer sm:space-x-0">
          {footerMode === "note-actions" && (
            <p className="hito-body-xs text-tertiary min-w-0 flex-1">
              Footer note stays short and tied to save/apply.
            </p>
          )}
          <HitoButton size="md" variant="secondary">
            Cancel
          </HitoButton>
          <HitoButton size="md" variant="primary" tone={destructive ? "error" : "default"}>
            {destructive ? "Archive" : "Continue"}
          </HitoButton>
        </DialogFooter>
      )}
    </>
  );

  if (presentation === "static") {
    return <article className={contentClassName}>{renderModalContents(false)}</article>;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <HitoButton size="md" variant="primary">
          Open selected modal
        </HitoButton>
      </DialogTrigger>
      <DialogContent className={contentClassName} overlayClassName="hito-dialog-overlay-stable">
        {renderModalContents(true)}
      </DialogContent>
    </Dialog>
  );
}

export function InfoWindowPreview() {
  const contentClassName =
    "hito-dialog-stable hito-window hito-window-content-fit hito-info-window";

  const renderInfoWindowContents = () => (
    <>
      <DialogHeader className="hito-info-window-header">
        <h3 className="hito-info-window-title">Replace target workout?</h3>
        <p className="hito-info-window-copy">
          This will replace the workout currently on the target day.
        </p>
      </DialogHeader>
      <DialogFooter className="hito-info-window-footer">
        <HitoButton size="sm" variant="secondary">
          Cancel
        </HitoButton>
        <HitoButton size="sm" variant="primary">
          Replace workout
        </HitoButton>
      </DialogFooter>
    </>
  );

  return <article className={contentClassName}>{renderInfoWindowContents()}</article>;
}

export function ChoiceSelector<T extends string>({
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
  size?: ChoiceToggleSize;
  getLabel?: (value: T) => string;
  textTransform?: "capitalize" | "uppercase" | "none";
}) {
  const choiceGroup = useHitoRadioGroup({
    items: options.map((item) => ({ value: item })),
    value,
  });

  return (
    <div className="w-full">
      <p className="hito-label-md">{label}</p>
      <div className="hito-choice-toggle-group mt-3" {...choiceGroup.groupProps} aria-label={label}>
        {options.map((item) => {
          const selected = value === item;
          return (
            <HitoChoiceToggle
              key={item}
              size={size}
              {...choiceGroup.getRadioProps(item)}
              onClick={() => onChange(item)}
              selected={selected}
              className={cn(
                textTransform === "capitalize" && "capitalize",
                textTransform === "uppercase" && "uppercase",
              )}
            >
              {getLabel ? getLabel(item) : item}
            </HitoChoiceToggle>
          );
        })}
      </div>
    </div>
  );
}

function isBinarySelectionSize(size: SelectionControlSize): size is SelectionBinarySize {
  return size === "sm" || size === "md";
}

export function SelectionControlPreview({
  kind,
  size,
  selected,
  onSelectedChange,
  disabled,
  invalid,
  focusDemo,
  cardMode,
}: {
  kind: SelectionControlKind;
  size: SelectionControlSize;
  selected: boolean;
  onSelectedChange: (selected: boolean) => void;
  disabled: boolean;
  invalid: boolean;
  focusDemo: boolean;
  cardMode: boolean;
}) {
  const [secondaryCheckboxSelected, setSecondaryCheckboxSelected] = useState(false);
  const binarySize = isBinarySelectionSize(size) ? size : "md";
  const toggleSize = HITO_CHOICE_TOGGLE_SIZES.includes(size as HitoChoiceToggleSize)
    ? (size as HitoChoiceToggleSize)
    : "sm";
  const togglePresentation = cardMode
    ? ({ presentation: "card" } as const)
    : ({ presentation: "inline", size: toggleSize } as const);
  const selectedChoice = selected ? "primary" : "secondary";
  const choiceGroup = useHitoRadioGroup({
    items: [{ value: "primary" }, { value: "secondary" }],
    value: selectedChoice,
  });

  if (kind === "toggle") {
    const choices = cardMode
      ? [
          {
            value: "primary",
            title: "Half marathon",
            description: "Goal distance choice",
          },
          {
            value: "secondary",
            title: "Build consistency",
            description: "Large onboarding choice",
          },
        ]
      : [
          { value: "primary", title: "Easy pace", description: null },
          { value: "secondary", title: "Tempo", description: null },
        ];

    return (
      <div
        className="hito-choice-toggle-group"
        {...choiceGroup.groupProps}
        aria-label={cardMode ? "Goal choice" : "Workout intensity"}
      >
        {choices.map((choice) => {
          const isSelected = selectedChoice === choice.value;

          return (
            <HitoChoiceToggle
              key={choice.value}
              {...choiceGroup.getRadioProps(choice.value)}
              {...togglePresentation}
              selected={isSelected}
              data-demo-state={focusDemo && isSelected ? "focus" : undefined}
              data-invalid={invalid || undefined}
              disabled={disabled}
              onClick={() => onSelectedChange(choice.value === "primary")}
            >
              {choice.description ? (
                <span>
                  <span className="block">{choice.title}</span>
                  <span className="mt-1 block text-current/70">{choice.description}</span>
                </span>
              ) : (
                choice.title
              )}
            </HitoChoiceToggle>
          );
        })}
      </div>
    );
  }

  const inputClassName = cn(
    kind === "checkbox" ? "hito-checkbox" : "hito-radio",
    kind === "checkbox" ? `hito-checkbox-${binarySize}` : `hito-radio-${binarySize}`,
  );

  if (kind === "radio") {
    return (
      <div className="grid gap-2" role="radiogroup" aria-label="Notification channel">
        {[
          { value: "primary", label: "Email summary" },
          { value: "secondary", label: "In-app only" },
        ].map((choice) => {
          const isSelected = selectedChoice === choice.value;

          return (
            <label
              key={choice.value}
              className={cn("hito-control-label", `hito-control-label-${binarySize}`)}
              aria-disabled={disabled || undefined}
            >
              <input
                type="radio"
                name="selection-preview-radio"
                className={inputClassName}
                checked={isSelected}
                disabled={disabled}
                aria-invalid={invalid || undefined}
                data-state={isSelected ? "checked" : undefined}
                data-demo-state={focusDemo && isSelected ? "focus" : undefined}
                onChange={() => onSelectedChange(choice.value === "primary")}
              />
              <span>{choice.label}</span>
            </label>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <label
        className={cn("hito-control-label", `hito-control-label-${binarySize}`)}
        aria-disabled={disabled || undefined}
      >
        <input
          type={kind}
          name={`selection-preview-${kind}`}
          className={inputClassName}
          checked={selected}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          data-state={selected ? "checked" : undefined}
          data-demo-state={focusDemo ? "focus" : undefined}
          onChange={(event) => onSelectedChange(event.currentTarget.checked)}
        />
        <span>Training reminders</span>
      </label>
      <label
        className={cn("hito-control-label", `hito-control-label-${binarySize}`)}
        aria-disabled={disabled || undefined}
      >
        <input
          type="checkbox"
          name="selection-preview-secondary-checkbox"
          className={inputClassName}
          checked={secondaryCheckboxSelected}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          data-state={secondaryCheckboxSelected ? "checked" : undefined}
          onChange={(event) => setSecondaryCheckboxSelected(event.currentTarget.checked)}
        />
        <span>Weekly summary</span>
      </label>
    </div>
  );
}

export function ToggleRow({
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
      <HitoButton size="sm" variant={active ? "primary" : "secondary"} onClick={onToggle}>
        {active ? "On" : "Off"}
      </HitoButton>
    </div>
  );
}

export function DemoInput({
  variant,
  size,
  leftIcon,
  rightIcon,
  state = "default",
  feedback = "neutral",
  placeholder = "Search plans",
  value,
}: {
  variant: InputVariant;
  size: HitoFieldSize;
  leftIcon?: boolean;
  rightIcon?: boolean;
  state?: InputState;
  feedback?: InputFeedback;
  placeholder?: string;
  value?: string;
}) {
  const simulatedState = state === "default" ? undefined : state;
  const iconSize = size === "xs" || size === "sm" ? "xs" : "sm";
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
    <div className="hito-field-control">
      {leftIcon ? (
        <span
          className={cn("hito-field-icon hito-field-icon-left", feedbackTone)}
          data-size={size}
          aria-hidden="true"
        >
          <Icon name="search" size={iconSize} />
        </span>
      ) : null}
      <Input
        className={cn(
          leftIcon && "hito-field-has-left-icon",
          rightIcon && "hito-field-has-right-icon",
        )}
        variant={variant}
        size={size}
        feedback={feedback}
        data-demo-state={simulatedState}
        disabled={state === "disabled"}
        readOnly={state === "readonly"}
        aria-invalid={feedback === "error" ? true : undefined}
        aria-readonly={state === "readonly" ? true : undefined}
        placeholder={placeholder}
        value={state === "readonly" ? "runner@example.com" : value}
        onChange={() => undefined}
      />
      {rightIcon ? (
        <span
          className={cn("hito-field-icon hito-field-icon-right", feedbackTone)}
          data-size={size}
          aria-hidden="true"
        >
          <Icon name={rightIconName} size={iconSize} />
        </span>
      ) : null}
    </div>
  );
}

export function DemoButton({
  variant,
  tone = "default",
  size,
  iconOnly = false,
  leftIcon,
  rightIcon,
  disabled = false,
  loading = false,
  motionState = "default",
  progress = 0.64,
  demoState,
}: {
  variant: ButtonVariant;
  tone?: ButtonTone;
  size: ButtonSize;
  iconOnly?: boolean;
  leftIcon?: boolean;
  rightIcon?: boolean;
  disabled?: boolean;
  loading?: boolean;
  motionState?: ButtonMotionState;
  progress?: number;
  demoState?: "hover" | "focus" | "active";
}) {
  const state = loading ? "loading" : motionState;
  const isDisabled = disabled || state === "disabled" || state === "loading";
  const stateIcon =
    state === "loading"
      ? "loader"
      : state === "success"
        ? "check"
        : state === "error"
          ? "warning"
          : null;
  const buttonLabel =
    state === "loading"
      ? "Loading"
      : state === "success"
        ? "Saved"
        : state === "error"
          ? "Try again"
          : state === "timed-progress"
            ? "Undo"
            : variant;

  const iconAccessibility = iconOnly
    ? {
        "aria-label": `${state === "loading" ? "Loading " : ""}${tone} ${variant} action`,
        iconOnly: true as const,
      }
    : { iconOnly: false as const };

  return (
    <HitoButton
      type="button"
      disabled={isDisabled}
      aria-pressed={state === "pressed" || undefined}
      className="relative w-fit max-w-full shrink-0 justify-self-start overflow-hidden whitespace-nowrap capitalize"
      variant={variant}
      tone={tone}
      size={size}
      loading={state === "loading"}
      feedback={state === "success" || state === "error" ? state : undefined}
      timedProgress={state === "timed-progress" ? progress : undefined}
      {...iconAccessibility}
      data-demo-state={demoState}
    >
      {stateIcon ? (
        <Icon
          name={stateIcon}
          size="xs"
          className={cn("hito-button-state-icon", state === "loading" && "hito-motion-spinner")}
        />
      ) : iconOnly ? (
        <Icon name="check" size={size === "xs" || size === "sm" ? "xs" : "sm"} />
      ) : (
        leftIcon && <Icon name="circle" size="xs" />
      )}
      {iconOnly ? null : buttonLabel}
      {!iconOnly && state === "default" && rightIcon && <Icon name="arrow-right" size="xs" />}
    </HitoButton>
  );
}

export function IconOnlyButtonMatrix() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-5">
        {BUTTON_TONES.map((tone) => (
          <div key={`icon-only-${tone}`} className="grid gap-3">
            <p className="hito-label-sm text-tertiary">{tone}</p>
            {BUTTON_SIZES.map((size) => (
              <div
                key={`icon-only-${tone}-${size}`}
                className="flex min-w-0 flex-wrap items-center gap-3"
              >
                <span className="hito-body-xs text-tertiary w-8 shrink-0 uppercase">{size}</span>
                {BUTTON_VARIANTS.map((variant) => (
                  <DemoButton
                    key={`icon-only-${tone}-${size}-${variant}`}
                    variant={variant}
                    tone={tone}
                    size={size}
                    iconOnly
                  />
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="grid gap-3">
        <p className="hito-label-sm text-tertiary">Focus, disabled, loading · MD</p>
        {BUTTON_TONES.map((tone) => (
          <div key={`icon-only-states-${tone}`} className="grid gap-3">
            {BUTTON_VARIANTS.map((variant) => (
              <div
                key={`icon-only-states-${tone}-${variant}`}
                className="flex min-w-0 flex-wrap items-center gap-3"
              >
                <span className="hito-body-xs text-tertiary w-20 shrink-0 capitalize">
                  {variant}
                </span>
                <DemoButton variant={variant} tone={tone} size="md" iconOnly demoState="focus" />
                <DemoButton variant={variant} tone={tone} size="md" iconOnly disabled />
                <DemoButton variant={variant} tone={tone} size="md" iconOnly loading disabled />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function MenuRow({
  icon,
  label,
  meta,
}: {
  icon: HitoIconName;
  label: string;
  meta: string;
}) {
  return (
    <div className="hito-list-row py-3">
      <div className="flex items-center gap-3">
        <Icon name={icon} size="sm" className="text-muted-foreground" strokeWidth={1.6} />
        <span className="hito-list-row-title">{label}</span>
      </div>
      <span className="hito-body-xs text-tertiary">{meta}</span>
    </div>
  );
}

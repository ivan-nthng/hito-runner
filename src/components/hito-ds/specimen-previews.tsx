import { useEffect, useState } from "react";
import {
  AdminDataTableColumnHeader,
  AdminDataTableStaticHeader,
  AdminDataTableToolbar,
} from "@/components/admin/AdminOperationalComponents";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Icon, type HitoIconName } from "@/components/ui/icon";
import { useHitoRadioGroup } from "@/components/ui/hito-radio-group";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outlined" | "ghost";
type ButtonTone = "default" | "success" | "error";
type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";
type InputVariant = "primary" | "secondary";
type InputState = "default" | "hover" | "focus" | "disabled" | "readonly";
type InputFeedback = "neutral" | "error" | "success";
type ChoiceToggleSize = "xs" | "sm" | "md" | "lg" | "xl";
type SelectionControlKind = "checkbox" | "radio" | "toggle";
type SelectionBinarySize = "sm" | "md";
type ModalSizeMode = "compact" | "standard" | "wide" | "workflow" | "review";
type ModalBodyMode = "content-fit" | "scroll-fill";
type ModalHeaderMode = "compact" | "large";
type ModalFooterMode = "none" | "actions" | "note-actions";
type DataTableSortDirection = "asc" | "desc";
type DataTableSpecimenSortKey = "preview" | "none";

export function DataTableSpecimenPreview({
  sortable,
  activeSort,
  sortDirection = "asc",
  filtered,
  staticMode,
  showUtilityRow,
}: {
  sortable: boolean;
  activeSort: boolean;
  sortDirection?: DataTableSortDirection;
  filtered: boolean;
  staticMode: boolean;
  showUtilityRow: boolean;
}) {
  const previewIsStatic = staticMode || !sortable;
  const [query, setQuery] = useState("runner@hito.test");
  const [selectedFilter, setSelectedFilter] = useState(filtered ? "active" : "all");
  const [activeSortState, setActiveSortState] = useState<{
    key: DataTableSpecimenSortKey;
    direction: DataTableSortDirection;
  }>({
    key: !previewIsStatic && activeSort ? "preview" : "none",
    direction: sortDirection,
  });

  useEffect(() => {
    setSelectedFilter(filtered ? "active" : "all");
  }, [filtered]);

  useEffect(() => {
    setActiveSortState({
      key: !previewIsStatic && activeSort ? "preview" : "none",
      direction: sortDirection,
    });
  }, [activeSort, previewIsStatic, sortDirection]);

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

  return (
    <div className="grid gap-4">
      {showUtilityRow && (
        <AdminDataTableToolbar
          activeFilters={activeFilters}
          clearAllFilters={() => setSelectedFilter("all")}
          filterSections={[
            {
              currentValue: selectedFilter,
              label: "Status",
              onSelect: setSelectedFilter,
              options: [
                { value: "all", label: "All states" },
                { value: "active", label: "Active" },
              ],
            },
          ]}
          onQueryChange={setQuery}
          query={query}
          rowCountLabel="3 rows"
          searchLabel="Search data table specimen"
          searchPlaceholder="Search runners"
        />
      )}

      <div className="hito-data-table-scroll">
        <table className="hito-data-table hito-data-table-min-md">
          <caption className="sr-only">Hito data-table specimen preview.</caption>
          <thead>
            <tr>
              {previewIsStatic ? (
                <AdminDataTableStaticHeader label="Preview column" />
              ) : (
                <AdminDataTableColumnHeader
                  activeSort={activeSortState}
                  column="preview"
                  filterActive={selectedFilter !== "all"}
                  filterOptions={[
                    { value: "all", label: "All states" },
                    { value: "active", label: "Active" },
                  ]}
                  label="Preview column"
                  menuLabel="Sort and filter preview column"
                  onFilterChange={setSelectedFilter}
                  onSort={(key, direction) => setActiveSortState({ key, direction })}
                  selectedFilter={selectedFilter}
                  sortOptions={[
                    { key: "preview", direction: "asc", label: "Sort ascending" },
                    { key: "preview", direction: "desc", label: "Sort descending" },
                  ]}
                />
              )}
              <AdminDataTableStaticHeader label="Runtime behavior" />
              <AdminDataTableStaticHeader label="Contract" />
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="hito-data-table-cell hito-data-table-cell-start">
                {previewIsStatic ? "Non-interactive label" : "Header menu affordance"}
              </td>
              <td className="hito-data-table-cell">Search, sort, and filter remain interactive</td>
              <td className="hito-data-table-cell hito-data-table-cell-end">
                Shared admin operational owner
              </td>
            </tr>
            <tr>
              <td className="hito-data-table-cell hito-data-table-cell-start">
                <code className="hito-technical-mono hito-data-table-code">
                  qa-runner@hito.test
                </code>
              </td>
              <td className="hito-data-table-cell">Keyboard reachable</td>
              <td className="hito-data-table-cell hito-data-table-cell-end">
                aria-sort stays on the table header
              </td>
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

export function ModalWindowPreview({
  sizeMode,
  bodyMode,
  headerMode,
  footerMode,
  showStatusPill,
  destructive,
  longContent,
}: {
  sizeMode: ModalSizeMode;
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
          <p className="hito-label hito-label-signal">
            {sizeMode} ·{" "}
            {headerMode === "large" ? "large header + close" : "compact header + close"}
          </p>
          {live ? (
            <>
              <DialogTitle className="hito-modal-title mt-2">{title}</DialogTitle>
              <DialogDescription
                className={headerMode === "large" ? "hito-body mt-2 max-w-lg" : "sr-only"}
              >
                {description}
              </DialogDescription>
            </>
          ) : (
            <>
              <h3 className="hito-modal-title mt-2">{title}</h3>
              {headerMode === "large" ? (
                <p className="hito-body mt-2 max-w-lg">{description}</p>
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
            <p className="hito-caption min-w-0 flex-1">
              Footer note stays short and tied to save/apply.
            </p>
          )}
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
        </DialogFooter>
      )}
    </>
  );

  return (
    <div className="grid gap-4">
      <article className={contentClassName}>{renderModalContents(false)}</article>
      <div className="flex flex-wrap items-center gap-3">
        <Dialog>
          <DialogTrigger asChild>
            <button type="button" className="hito-button hito-button-primary hito-button-md">
              Open live modal
            </button>
          </DialogTrigger>
          <DialogContent className={contentClassName} overlayClassName="hito-dialog-overlay-stable">
            {renderModalContents(true)}
          </DialogContent>
        </Dialog>
        <p className="hito-caption max-w-md">
          Live modal uses the same overlay, focus trap, close behavior, and internal body-scroll
          contract as product dialogs.
        </p>
      </div>
    </div>
  );
}

export function InfoWindowPreview() {
  const contentClassName =
    "hito-dialog-stable hito-window hito-window-content-fit hito-info-window";

  const renderInfoWindowContents = (live: boolean) => (
    <>
      <DialogHeader className="hito-info-window-header">
        {live ? (
          <>
            <DialogTitle className="hito-info-window-title">Replace target workout?</DialogTitle>
            <DialogDescription className="hito-info-window-copy">
              This will replace the workout currently on the target day.
            </DialogDescription>
          </>
        ) : (
          <>
            <h3 className="hito-info-window-title">Replace target workout?</h3>
            <p className="hito-info-window-copy">
              This will replace the workout currently on the target day.
            </p>
          </>
        )}
      </DialogHeader>
      <DialogFooter className="hito-info-window-footer">
        <button type="button" className="hito-button hito-button-secondary hito-button-sm">
          Cancel
        </button>
        <button type="button" className="hito-button hito-button-primary hito-button-sm">
          Replace workout
        </button>
      </DialogFooter>
    </>
  );

  return (
    <div className="grid gap-4">
      <article className={contentClassName}>{renderInfoWindowContents(false)}</article>
      <div className="flex flex-wrap items-center gap-3">
        <Dialog>
          <DialogTrigger asChild>
            <button type="button" className="hito-button hito-button-primary hito-button-md">
              Open live info-window
            </button>
          </DialogTrigger>
          <DialogContent
            className={contentClassName}
            overlayClassName="hito-dialog-overlay-stable hito-info-window-overlay"
          >
            {renderInfoWindowContents(true)}
          </DialogContent>
        </Dialog>
        <p className="hito-caption max-w-md">
          Use for one short confirmation where the runner should keep the current calendar or route
          in view behind a light overlay.
        </p>
      </div>
    </div>
  );
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
      <p className="hito-label">{label}</p>
      <div className="hito-choice-toggle-group mt-3" {...choiceGroup.groupProps} aria-label={label}>
        {options.map((item) => {
          const selected = value === item;
          return (
            <button
              key={item}
              type="button"
              {...choiceGroup.getRadioProps(item)}
              onClick={() => onChange(item)}
              data-selected={selected}
              className={cn(
                "hito-choice-toggle",
                `hito-choice-toggle-${size}`,
                textTransform === "capitalize" && "capitalize",
                textTransform === "uppercase" && "uppercase",
              )}
            >
              {getLabel ? getLabel(item) : item}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function isBinarySelectionSize(size: ChoiceToggleSize): size is SelectionBinarySize {
  return size === "sm" || size === "md";
}

export function SelectionControlPreview({
  kind,
  size,
  selected,
  disabled,
  invalid,
  focusDemo,
  cardMode,
}: {
  kind: SelectionControlKind;
  size: ChoiceToggleSize;
  selected: boolean;
  disabled: boolean;
  invalid: boolean;
  focusDemo: boolean;
  cardMode: boolean;
}) {
  const binarySize = isBinarySelectionSize(size) ? size : "md";

  if (kind === "toggle") {
    return (
      <div className="grid gap-3">
        <div className="hito-choice-toggle-group">
          <span
            className={cn(
              "hito-choice-toggle pointer-events-none cursor-default",
              cardMode ? "hito-choice-toggle-card" : `hito-choice-toggle-${size}`,
              disabled && "opacity-50",
            )}
            data-selected={selected}
            data-demo-state={focusDemo ? "focus" : undefined}
            data-invalid={invalid || undefined}
          >
            {cardMode ? (
              <span>
                <span className="block">Goal distance</span>
                <span className="mt-1 block text-current/70">Card display choice</span>
              </span>
            ) : (
              "Preview choice"
            )}
          </span>
          {!cardMode && (
            <span
              className={cn(
                "hito-choice-toggle pointer-events-none cursor-default",
                `hito-choice-toggle-${size}`,
              )}
            >
              Other choice
            </span>
          )}
        </div>
        <p className="hito-caption">
          {cardMode
            ? "Card is reserved for large visual choice moments."
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
  size: ButtonSize;
  leftIcon?: boolean;
  rightIcon?: boolean;
  state?: InputState;
  feedback?: InputFeedback;
  placeholder?: string;
  value?: string;
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
  demoState?: "hover" | "focus" | "active";
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "hito-button w-fit max-w-full shrink-0 justify-self-start whitespace-nowrap capitalize",
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
      <span className="hito-caption">{meta}</span>
    </div>
  );
}

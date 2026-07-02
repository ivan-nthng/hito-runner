import {
  Dialog,
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon, type HitoIconName } from "@/components/ui/icon";
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
  const activeSortDirection: DataTableSortDirection | null =
    !previewIsStatic && activeSort ? sortDirection : null;

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
        <table className="hito-data-table hito-data-table-min-md">
          <caption className="sr-only">Hito data-table specimen preview.</caption>
          <thead>
            <tr>
              <th
                scope="col"
                aria-sort={previewIsStatic ? undefined : sortDirectionToAria(activeSortDirection)}
                className="whitespace-nowrap px-2 py-2 font-medium"
              >
                {previewIsStatic ? (
                  <DataTableStaticHeader label="Preview column" />
                ) : (
                  <DataTableHeaderButton
                    label="Preview column"
                    activeSortDirection={activeSortDirection}
                    filtered={filtered}
                  />
                )}
              </th>
              <th scope="col" aria-sort="none" className="whitespace-nowrap px-2 py-2 font-medium">
                <DataTableHeaderButton label="Hover state" hover />
              </th>
              <th
                scope="col"
                aria-sort={sortDirectionToAria(sortDirection)}
                className="whitespace-nowrap px-2 py-2 font-medium"
              >
                <DataTableHeaderButton label="Active sort" activeSortDirection={sortDirection} />
              </th>
              <th scope="col" aria-sort="none" className="whitespace-nowrap px-2 py-2 font-medium">
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
  activeSortDirection = null,
  filtered = false,
  hover = false,
}: {
  label: string;
  activeSortDirection?: DataTableSortDirection | null;
  filtered?: boolean;
  hover?: boolean;
}) {
  const isSorted = activeSortDirection != null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="hito-button hito-button-ghost hito-button-xs hito-data-table-header-button"
          data-active={isSorted || filtered ? "true" : undefined}
          data-demo-state={hover ? "hover" : undefined}
          aria-label={`Sort and filter ${label}`}
        >
          <span>{label}</span>
          {filtered ? <span className="hito-data-table-filter-dot" /> : null}
          <Icon
            aria-hidden="true"
            name={activeSortDirection === "asc" ? "chevron-up" : "chevron-down"}
            size="xs"
            className="hito-data-table-sort-indicator"
            data-active={isSorted ? "true" : undefined}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="hito-shell-menu hito-data-table-column-menu hito-data-table-menu-width-standard"
      >
        <DropdownMenuLabel className="hito-micro-label">Sort</DropdownMenuLabel>
        {DATA_TABLE_SORT_OPTIONS.map((option) => {
          const optionActive = activeSortDirection === option.direction;

          return (
            <DropdownMenuItem
              key={option.direction}
              className="hito-shell-menu-item hito-data-table-menu-item"
              aria-current={optionActive ? "true" : undefined}
            >
              <Icon
                name={optionActive ? "check" : "chevron-right"}
                size="xs"
                className={optionActive ? "text-signal" : "text-muted-foreground"}
              />
              {option.label}
            </DropdownMenuItem>
          );
        })}
        {filtered ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="hito-micro-label">Filter</DropdownMenuLabel>
            <DropdownMenuItem className="hito-shell-menu-item hito-data-table-menu-item">
              <Icon name="check" size="xs" className="text-signal" />
              Active filter
            </DropdownMenuItem>
            <DropdownMenuItem className="hito-shell-menu-item hito-data-table-menu-item">
              <Icon name="x-circle" size="xs" />
              Clear filter
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const DATA_TABLE_SORT_OPTIONS = [
  { direction: "asc", label: "Sort ascending" },
  { direction: "desc", label: "Sort descending" },
] satisfies Array<{ direction: DataTableSortDirection; label: string }>;

function sortDirectionToAria(direction: DataTableSortDirection | null) {
  if (direction === "asc") return "ascending";
  if (direction === "desc") return "descending";
  return "none";
}

function DataTableStaticHeader({ label }: { label: string }) {
  return (
    <span className="hito-data-table-header hito-data-table-header-static" data-disabled="true">
      {label}
    </span>
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
        value={state === "readonly" ? "runner@example.com" : value}
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

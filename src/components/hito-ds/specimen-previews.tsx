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
type ModalBodyMode = "content-fit" | "scroll-fill";
type ModalHeaderMode = "compact" | "large";
type ModalFooterMode = "none" | "actions" | "note-actions";

export function DataTableSpecimenPreview({
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

export function ModalWindowPreview({
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

import {
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

type InlineEditableTextKind = "singleline" | "multiline";
type InlineEditableTextDemoState = "hover" | "focus" | "edit" | "error" | "disabled" | "readonly";
type InlineEditableTextVariant = "default" | "header";
type InlineEditableHeaderSize = "sm" | "md" | "lg";

const INLINE_EDITABLE_ACTION_CLASSES =
  "group inline-flex min-h-11 min-w-0 max-w-full items-center gap-2 rounded-md px-2 py-1 text-left transition-colors hover:bg-foreground/[0.06] focus-visible:bg-foreground/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/30 data-[demo-state=hover]:bg-foreground/[0.06] data-[demo-state=focus]:bg-foreground/[0.08] data-[readonly=true]:cursor-default data-[readonly=true]:hover:bg-transparent data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-60";

export function InlineEditableText({
  "aria-label": ariaLabel,
  allowEmpty = false,
  cancelLabel = "Cancel",
  className,
  commitOnBlur,
  demoState,
  disabled = false,
  editLabel,
  error,
  helper,
  inputClassName,
  kind = "singleline",
  onChange,
  placeholder,
  readOnly = false,
  saveLabel = "Save",
  showEditIcon = true,
  size = "md",
  validate,
  variant = "default",
  value,
}: {
  "aria-label": string;
  allowEmpty?: boolean;
  cancelLabel?: string;
  className?: string;
  commitOnBlur?: boolean;
  demoState?: InlineEditableTextDemoState;
  disabled?: boolean;
  editLabel?: string;
  error?: string;
  helper?: string;
  inputClassName?: string;
  kind?: InlineEditableTextKind;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  saveLabel?: string;
  showEditIcon?: boolean;
  size?: InlineEditableHeaderSize;
  validate?: (value: string) => string | null;
  variant?: InlineEditableTextVariant;
  value: string;
}) {
  const [editing, setEditing] = useState(demoState === "edit" || demoState === "error");
  const [draft, setDraft] = useState(value);
  const [localError, setLocalError] = useState<string | null>(
    demoState === "error" ? (error ?? null) : null,
  );
  const controlId = useId();
  const feedbackId = useId();
  const actionRef = useRef<HTMLButtonElement | null>(null);
  const fieldRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const isMultiline = kind === "multiline";
  const isHeaderInput = variant === "header" && !isMultiline;
  const shouldCommitOnBlur = commitOnBlur ?? !isMultiline;
  const resolvedError = localError ?? error;
  const feedback = resolvedError ?? helper;
  const headerInputSize = isHeaderInput
    ? Math.min(72, Math.max(8, (draft || placeholder || value || "").length + 1))
    : undefined;

  useEffect(() => {
    if (!editing) {
      setDraft(value);
      setLocalError(null);
    }
  }, [editing, value]);

  useEffect(() => {
    if (editing) {
      fieldRef.current?.focus();
      fieldRef.current?.select();
    }
  }, [editing]);

  const visibleValue = value.trim() || placeholder || "Untitled";
  const canEdit = !disabled && !readOnly;

  const focusReadTarget = () => {
    window.requestAnimationFrame(() => actionRef.current?.focus());
  };

  const startEditing = () => {
    if (!canEdit) return;
    setDraft(value);
    setLocalError(null);
    setEditing(true);
  };

  const cancel = () => {
    setDraft(value);
    setLocalError(null);
    setEditing(false);
    focusReadTarget();
  };

  const commit = () => {
    const trimmedDraft = draft.trim();
    const nextValue = allowEmpty ? draft : trimmedDraft || value;
    const validationError = validate?.(nextValue) ?? null;

    if (validationError) {
      setLocalError(validationError);
      return;
    }

    onChange(nextValue);
    setEditing(false);
    focusReadTarget();
  };

  if (editing && canEdit) {
    const fieldProps = {
      "aria-describedby": feedback ? feedbackId : undefined,
      "aria-invalid": resolvedError ? true : undefined,
      "aria-label": ariaLabel,
      className: cn(
        "hito-field hito-field-primary",
        !isHeaderInput && "min-w-0",
        isMultiline
          ? "hito-textarea-md resize-none"
          : isHeaderInput
            ? `hito-field-header hito-field-header-${size}`
            : "hito-field-sm",
        resolvedError && "hito-field-feedback-error",
        inputClassName,
      ),
      id: controlId,
      onBlur: shouldCommitOnBlur ? commit : undefined,
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setDraft(event.target.value);
        setLocalError(null);
      },
      onKeyDown: (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (event.key === "Escape") {
          event.preventDefault();
          cancel();
          return;
        }

        if (event.key === "Enter" && !isMultiline) {
          event.preventDefault();
          commit();
        }

        if (event.key === "Enter" && isMultiline && (event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          commit();
        }
      },
      placeholder,
      value: draft,
    };

    return (
      <div
        className={cn(
          "min-w-0 gap-2",
          isHeaderInput ? "inline-grid max-w-full justify-start" : "grid",
        )}
      >
        {isMultiline ? (
          <textarea ref={fieldRef as RefObject<HTMLTextAreaElement>} rows={3} {...fieldProps} />
        ) : (
          <input
            ref={fieldRef as RefObject<HTMLInputElement>}
            data-hito-component="inline-editable-text"
            data-size={isHeaderInput ? size : undefined}
            size={headerInputSize}
            type="text"
            {...fieldProps}
          />
        )}
        {feedback ? (
          <p id={feedbackId} className={resolvedError ? "hito-field-error" : "hito-field-helper"}>
            {feedback}
          </p>
        ) : null}
        {isMultiline ? (
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <button
              type="button"
              className="hito-button hito-button-primary hito-button-sm"
              onClick={commit}
            >
              <Icon name="check" size="xs" />
              {saveLabel}
            </button>
            <button
              type="button"
              className="hito-button hito-button-secondary hito-button-sm"
              onClick={cancel}
            >
              <Icon name="close" size="xs" />
              {cancelLabel}
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  if (readOnly) {
    return (
      <InlineReadOnlyText
        className={cn(
          isHeaderInput && "hito-inline-header-input-readonly",
          isHeaderInput && `hito-inline-header-input-readonly-${size}`,
          className,
        )}
        helper={feedback}
        value={<span className="min-w-0 truncate">{visibleValue}</span>}
      />
    );
  }

  return (
    <div
      className={cn(
        "min-w-0 gap-1",
        isHeaderInput ? "inline-grid max-w-full justify-start" : "grid",
      )}
    >
      <button
        ref={actionRef}
        type="button"
        data-hito-component="inline-editable-text"
        className={cn(
          isHeaderInput ? "hito-inline-header-input-trigger" : INLINE_EDITABLE_ACTION_CLASSES,
          className,
        )}
        aria-label={ariaLabel}
        aria-disabled={disabled ? true : undefined}
        data-size={isHeaderInput ? size : undefined}
        data-demo-state={demoState === "hover" || demoState === "focus" ? demoState : undefined}
        data-disabled={disabled ? "true" : undefined}
        disabled={disabled}
        onClick={startEditing}
      >
        <span className="min-w-0 max-w-full truncate">{visibleValue}</span>
        {canEdit && showEditIcon ? (
          <span
            className={cn(
              "inline-flex min-h-8 shrink-0 items-center gap-1 transition-opacity",
              isHeaderInput
                ? "hito-inline-header-input-affordance"
                : "text-muted-foreground opacity-75 group-hover:opacity-100 group-focus-visible:opacity-100 group-data-[demo-state=hover]:opacity-100 group-data-[demo-state=focus]:opacity-100",
            )}
          >
            <Icon name="edit" size={isHeaderInput && size === "lg" ? "lg" : "sm"} />
            {editLabel ? <span className="hito-micro-label">{editLabel}</span> : null}
          </span>
        ) : null}
      </button>
      {feedback ? (
        <p className={resolvedError ? "hito-field-error" : "hito-field-helper"}>{feedback}</p>
      ) : null}
    </div>
  );
}

export function InlineReadOnlyText({
  className,
  helper,
  value,
}: {
  className?: string;
  helper?: ReactNode;
  value: ReactNode;
}) {
  return (
    <div className="grid min-w-0 gap-1">
      <div className={cn("min-h-11 min-w-0 content-center rounded-md py-1", className)}>
        {value}
      </div>
      {helper ? <div className="hito-field-helper">{helper}</div> : null}
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Icon } from "@/components/ui/icon";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import {
  formatHitoDurationInput,
  hitoDateFromIso,
  hitoIsoFromDate,
  isHitoIsoDate,
  todayHitoIsoDate,
} from "@/components/ui/hito-date-time-utils";
import { cn } from "@/lib/utils";

export function HitoDateField({
  id,
  name,
  label,
  value,
  onChange,
  placeholder = "YYYY-MM-DD",
  helper,
  error,
  disabled = false,
  required = false,
  minDate,
  maxDate,
  allowTyping = true,
  openOnClick = true,
  openOnFocus = true,
  closeOnSelect = true,
  className,
}: {
  id: string;
  name?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helper?: string;
  error?: string | null;
  disabled?: boolean;
  required?: boolean;
  minDate?: string | Date | null;
  maxDate?: string | Date | null;
  allowTyping?: boolean;
  openOnClick?: boolean;
  openOnFocus?: boolean;
  closeOnSelect?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);
  const skipNextFocusOpenRef = useRef(false);
  const returnFocusOnCloseRef = useRef(false);
  const selected = useMemo(() => hitoDateFromIso(value), [value]);
  const minDateValue = useMemo(() => normalizeDateBoundary(minDate), [minDate]);
  const maxDateValue = useMemo(() => normalizeDateBoundary(maxDate), [maxDate]);
  const feedbackId = error ? `${id}-error` : helper ? `${id}-helper` : undefined;
  const calendarId = `${id}-calendar`;
  const disabledMatchers = [
    minDateValue ? { before: minDateValue } : null,
    maxDateValue ? { after: maxDateValue } : null,
  ].filter((matcher): matcher is { before: Date } | { after: Date } => Boolean(matcher));

  useEffect(() => {
    if (!open) {
      return;
    }

    setCalendarMonth(selected ?? minDateValue ?? new Date());
  }, [minDateValue, open, selected]);

  useEffect(() => {
    if (disabled && open) {
      setOpen(false);
    }
  }, [disabled, open]);

  function openCalendar() {
    if (!disabled) {
      setOpen(true);
    }
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <label htmlFor={id} className="hito-form-label">
        {label}
      </label>
      <Popover
        open={open}
        onOpenChange={(nextOpen) => {
          if (!disabled) {
            setOpen(nextOpen);
          }
        }}
      >
        <PopoverAnchor asChild>
          <div className="hito-date-field-control">
            <input
              ref={inputRef}
              id={id}
              name={name}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              spellCheck={false}
              aria-label={label}
              aria-describedby={feedbackId}
              aria-invalid={error ? true : undefined}
              aria-expanded={open}
              aria-haspopup="dialog"
              aria-controls={open ? calendarId : undefined}
              disabled={disabled}
              required={required}
              readOnly={!allowTyping}
              value={value}
              onFocus={() => {
                if (skipNextFocusOpenRef.current) {
                  skipNextFocusOpenRef.current = false;
                  return;
                }

                if (openOnFocus) {
                  openCalendar();
                }
              }}
              onClick={() => {
                if (openOnClick) {
                  openCalendar();
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape" && open) {
                  event.preventDefault();
                  returnFocusOnCloseRef.current = true;
                  setOpen(false);
                  return;
                }

                if (event.key === "ArrowDown" || event.key === "Enter") {
                  event.preventDefault();
                  openCalendar();
                }
              }}
              onChange={(event) => onChange(event.target.value)}
              placeholder={placeholder}
              maxLength={10}
              className={cn(
                "hito-field hito-field-primary hito-field-md hito-field-has-right-icon min-w-0",
                error && "hito-field-feedback-error",
              )}
              data-state={open ? "open" : undefined}
            />
            <span className="hito-date-field-icon" aria-hidden="true">
              <Icon name="calendar" size="sm" />
            </span>
          </div>
        </PopoverAnchor>
        <PopoverContent
          id={calendarId}
          data-hito-date-picker-popover
          align="start"
          side="bottom"
          sideOffset={0}
          avoidCollisions={false}
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (returnFocusOnCloseRef.current) {
              returnFocusOnCloseRef.current = false;
              skipNextFocusOpenRef.current = true;
              inputRef.current?.focus();
            }
          }}
          onEscapeKeyDown={() => {
            returnFocusOnCloseRef.current = true;
          }}
          className="hito-date-picker-popover w-auto p-0"
        >
          <Calendar
            mode="single"
            selected={selected ?? undefined}
            month={calendarMonth}
            onMonthChange={setCalendarMonth}
            disabled={disabledMatchers.length > 0 ? disabledMatchers : undefined}
            captionLayout="label"
            buttonVariant="ghost"
            className="hito-date-picker-calendar"
            onSelect={(date) => {
              if (!date) {
                return;
              }

              onChange(hitoIsoFromDate(date));
              if (closeOnSelect) {
                returnFocusOnCloseRef.current = true;
                setOpen(false);
              }
            }}
          />
        </PopoverContent>
      </Popover>
      {error ? (
        <span id={`${id}-error`} className="hito-field-error">
          {error}
        </span>
      ) : null}
      {!error && helper ? (
        <span id={`${id}-helper`} className="hito-field-helper">
          {helper}
        </span>
      ) : null}
    </div>
  );
}

export function HitoEditableDateChip({
  label,
  value,
  onChange,
  defaultDraftValue = todayHitoIsoDate,
  helper,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  defaultDraftValue?: string | (() => string);
  helper?: string;
  error?: string | null;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState(value);
  const frameRef = useRef<HTMLDivElement>(null);
  const hasSavedValue = Boolean(value.trim());
  const canSave = isHitoIsoDate(draftValue);

  useEffect(() => {
    if (!isEditing) {
      setDraftValue(value);
    }
  }, [isEditing, value]);

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (target instanceof Node && frameRef.current?.contains(target)) {
        return;
      }

      if (target instanceof Element && target.closest("[data-hito-date-picker-popover]")) {
        return;
      }

      setDraftValue(value);
      setIsEditing(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isEditing, value]);

  if (!isEditing) {
    return (
      <div className="grid gap-2">
        <div ref={frameRef} className="hito-editable-value-chip-frame">
          <button
            type="button"
            aria-label={hasSavedValue ? `Edit ${label.toLowerCase()}` : `Add ${label}`}
            onClick={() => {
              const nextDraft =
                value ||
                (typeof defaultDraftValue === "function" ? defaultDraftValue() : defaultDraftValue);
              setDraftValue(nextDraft);
              setIsEditing(true);
            }}
            className="hito-editable-value-chip"
            data-state={hasSavedValue ? "saved" : "empty"}
          >
            {hasSavedValue ? null : (
              <Icon name="plus" size="sm" className="hito-editable-value-chip-icon" />
            )}
            <span className="hito-editable-value-chip-content">
              {hasSavedValue ? (
                <>
                  <span className="hito-editable-value-chip-label">{label}</span>
                  <span className="hito-editable-value-chip-text">{value}</span>
                </>
              ) : (
                <span>Add {label}</span>
              )}
            </span>
            {hasSavedValue ? (
              <Icon
                name="edit"
                size="sm"
                className="hito-editable-value-chip-icon hito-editable-value-chip-edit-icon"
              />
            ) : null}
          </button>
        </div>
        {error ? <span className="hito-field-error">{error}</span> : null}
        {!error && helper ? <span className="hito-field-helper">{helper}</span> : null}
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <div ref={frameRef} className="hito-row-group p-3">
        <HitoDateField
          id={`editable-${label.toLowerCase().replace(/\s+/g, "-")}`}
          label={label}
          value={draftValue}
          onChange={setDraftValue}
          error={draftValue && !canSave ? "Use YYYY-MM-DD." : null}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="hito-button hito-button-primary hito-button-sm"
            disabled={!canSave}
            onClick={() => {
              onChange(draftValue);
              setIsEditing(false);
            }}
          >
            <Icon name="check" size="sm" />
            Save
          </button>
          <button
            type="button"
            className="hito-button hito-button-secondary hito-button-sm"
            onClick={() => {
              setDraftValue(value);
              setIsEditing(false);
            }}
          >
            Cancel
          </button>
          {hasSavedValue ? (
            <button
              type="button"
              className="hito-button hito-button-secondary hito-button-sm"
              onClick={() => {
                onChange("");
                setDraftValue("");
                setIsEditing(false);
              }}
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>
      {helper ? <span className="hito-field-helper">{helper}</span> : null}
    </div>
  );
}

export function HitoMaskedTimeField({
  id,
  label,
  value,
  onChange,
  placeholder = "3:50:00",
  helper,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helper?: string;
  error?: string | null;
}) {
  return (
    <div className="grid gap-2">
      <span className="hito-form-label">{label}</span>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        spellCheck={false}
        aria-label={label}
        aria-invalid={error ? true : undefined}
        value={value}
        onChange={(event) => onChange(formatHitoDurationInput(event.target.value))}
        placeholder={placeholder}
        className={cn(
          "hito-field hito-field-primary hito-field-md",
          error && "hito-field-feedback-error",
        )}
      />
      {error ? <span className="hito-field-error">{error}</span> : null}
      {!error && helper ? <span className="hito-field-helper">{helper}</span> : null}
    </div>
  );
}

function normalizeDateBoundary(value: string | Date | null | undefined) {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "string") {
    return hitoDateFromIso(value) ?? undefined;
  }

  return undefined;
}

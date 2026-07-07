import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export function EditableHeading({
  "aria-label": ariaLabel,
  className,
  inputClassName,
  onChange,
  placeholder,
  value,
}: {
  "aria-label": string;
  className?: string;
  inputClassName?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!editing) {
      setDraft(value);
    }
  }, [editing, value]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = () => {
    const nextValue = draft.trim();
    onChange(nextValue || value);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        aria-label={ariaLabel}
        className={cn("hito-field hito-field-primary hito-field-sm", inputClassName)}
        value={draft}
        onBlur={commit}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          }
          if (event.key === "Escape") {
            event.preventDefault();
            cancel();
          }
        }}
        placeholder={placeholder}
      />
    );
  }

  return (
    <button
      type="button"
      className={cn(
        "group -ml-2 inline-flex min-w-0 max-w-full items-center gap-2 rounded-md px-2 py-1 text-left transition-colors hover:bg-white/[0.06] focus-visible:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/30",
        className,
      )}
      aria-label={ariaLabel}
      onClick={() => setEditing(true)}
    >
      <span className="min-w-0 truncate">{value.trim() || placeholder || "Untitled"}</span>
      <Icon
        name="edit"
        size="sm"
        className="opacity-0 transition-opacity group-hover:opacity-80 group-focus-visible:opacity-80"
      />
    </button>
  );
}

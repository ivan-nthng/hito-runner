/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState, type ReactNode } from "react";
import {
  BODY_NOTE_AREAS,
  BODY_NOTE_AREA_REGIONS,
  BODY_NOTE_SENSATIONS,
  BODY_NOTE_TIMINGS,
  getBodyNoteAreaRegion,
  type BodyNote,
  type BodyNoteArea,
  type BodyNoteAreaRegion,
  type BodyNoteMapSide,
  type BodyNoteSensation,
  type BodyNoteTiming,
} from "@/lib/body-notes";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { HitoNativeSelectField } from "@/components/ui/native-select-field";

export type BodyNoteDraft = {
  area: BodyNoteArea;
  severity: BodyNote["severity"];
  timing: BodyNoteTiming;
  sensation: BodyNoteSensation | "";
  note: string;
};

export function createEmptyBodyNoteDraft(): BodyNoteDraft {
  return {
    area: BODY_NOTE_AREA_REGIONS[0]?.area ?? BODY_NOTE_AREAS[0],
    severity: 2,
    timing: "after",
    sensation: "",
    note: "",
  };
}

export function cloneBodyNoteDrafts(bodyNotes: BodyNoteDraft[]) {
  return bodyNotes.map((bodyNote) => ({ ...bodyNote }));
}

export function updateBodyNoteDraftList(
  bodyNotes: BodyNoteDraft[],
  index: number,
  patch: Partial<BodyNoteDraft>,
) {
  return bodyNotes.map((bodyNote, bodyNoteIndex) =>
    bodyNoteIndex === index ? { ...bodyNote, ...patch } : bodyNote,
  );
}

export function BodyNotesSummaryRow({
  bodyNotes,
  onOpen,
}: {
  bodyNotes: BodyNoteDraft[];
  onOpen: () => void;
}) {
  const hasBodyNotes = bodyNotes.length > 0;

  return (
    <div className="border-t border-hairline pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Label>Body notes</Label>
          <p className="hito-support-copy mt-2">
            Add any pain, tightness, or discomfort that showed up during or after this run.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="hito-button hito-button-secondary hito-button-sm"
        >
          <Icon name="plus" size="sm" />
          {hasBodyNotes ? "Edit body notes" : "Add body note"}
        </button>
      </div>

      {!hasBodyNotes ? (
        <div className="hito-surface-flat mt-4 p-4">
          <p className="hito-body">
            No body notes saved with this workout result. Leave this empty when the run felt normal.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {bodyNotes.map((bodyNote, index) => (
            <div
              key={`${bodyNote.area}-${bodyNote.timing}-${index}`}
              className="hito-surface-flat flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="hito-list-row-title">{bodyNote.area}</p>
                <p className="hito-body-small mt-1">{describeBodyNoteDraft(bodyNote)}</p>
              </div>
              <div className="flex items-center gap-3">
                <SeverityBars severity={bodyNote.severity} />
                <span className="hito-caption font-mono-num">{bodyNote.severity}/5</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function BodyNotesModal({
  open,
  bodyNotes,
  onOpenChange,
  onChange,
  onSave,
}: {
  open: boolean;
  bodyNotes: BodyNoteDraft[];
  onOpenChange: (open: boolean) => void;
  onChange: (bodyNotes: BodyNoteDraft[]) => void;
  onSave: () => void;
}) {
  const canAddMore = bodyNotes.length < 8;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="hito-dialog-overlay-stable"
        className="hito-dialog-stable hito-product-dialog hito-dialog-surface-product hito-dialog-size-workflow hito-dialog-height-workflow-relaxed"
      >
        <DialogHeader className="hito-product-dialog-header">
          <DialogTitle className="hito-modal-title">Body notes</DialogTitle>
          <DialogDescription className="hito-body max-w-2xl">
            These notes stay attached to this workout result only. Use them to mark where the run
            felt off without turning the result into a second full form.
          </DialogDescription>
        </DialogHeader>

        <div className="hito-product-dialog-body-scroll-fill">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="hito-caption">
              {bodyNotes.length === 0
                ? "No body notes yet."
                : `${bodyNotes.length} body note${bodyNotes.length === 1 ? "" : "s"} in this workout result.`}
            </p>
            {canAddMore ? (
              <button
                type="button"
                onClick={() => onChange([...bodyNotes, createEmptyBodyNoteDraft()])}
                className="hito-button hito-button-secondary hito-button-sm"
              >
                <Icon name="plus" size="sm" />
                Add note
              </button>
            ) : null}
          </div>

          {bodyNotes.length === 0 ? (
            <div className="hito-surface-flat mt-5 p-5">
              <p className="hito-body">
                No body notes will be saved with this workout unless you add one here.
              </p>
              <button
                type="button"
                onClick={() => onChange([createEmptyBodyNoteDraft()])}
                className="hito-button hito-button-secondary hito-button-sm mt-4"
              >
                <Icon name="plus" size="sm" />
                Add body note
              </button>
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              {bodyNotes.map((bodyNote, index) => (
                <BodyNoteEditorCard
                  key={`${bodyNote.area}-${bodyNote.timing}-${index}`}
                  bodyNote={bodyNote}
                  index={index}
                  onChange={(patch) => onChange(updateBodyNoteDraftList(bodyNotes, index, patch))}
                  onRemove={() => onChange(bodyNotes.filter((_, noteIndex) => noteIndex !== index))}
                />
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="hito-product-dialog-footer sm:space-x-0">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="hito-caption">
              Saved fields stay bounded to area, timing, sensation, severity, and an optional note.
            </p>
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="hito-button hito-button-ghost hito-button-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSave}
                className="hito-button hito-button-primary hito-button-md"
              >
                Save body notes
              </button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BodyNoteEditorCard({
  bodyNote,
  index,
  onChange,
  onRemove,
}: {
  bodyNote: BodyNoteDraft;
  index: number;
  onChange: (patch: Partial<BodyNoteDraft>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="hito-surface-flat space-y-5 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="hito-label">Body note {index + 1}</p>
          <p className="hito-caption mt-1">{bodyNote.area}</p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="hito-button hito-button-ghost hito-button-xs"
        >
          <Icon name="trash" size="xs" />
          Remove
        </button>
      </div>

      <BodyAreaMapField value={bodyNote.area} onChange={(value) => onChange({ area: value })} />

      <div className="grid gap-4 sm:grid-cols-2">
        <HitoNativeSelectField
          label="When"
          value={bodyNote.timing}
          onValueChange={(value) => onChange({ timing: value as BodyNoteTiming })}
          options={BODY_NOTE_TIMINGS.map((timing) => ({
            value: timing,
            label: timing === "during" ? "During the run" : "After the run",
          }))}
        />
        <HitoNativeSelectField
          label="Sensation"
          value={bodyNote.sensation}
          onValueChange={(value) => onChange({ sensation: value as BodyNoteSensation | "" })}
          options={[
            { value: "", label: "Choose one" },
            ...BODY_NOTE_SENSATIONS.map((sensation) => ({
              value: sensation,
              label: sensation,
            })),
          ]}
        />
      </div>

      <div>
        <Label>Severity</Label>
        <div className="mt-3 hito-scale-control">
          {[1, 2, 3, 4, 5].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => onChange({ severity: level as BodyNote["severity"] })}
              data-active={level <= bodyNote.severity ? "true" : undefined}
              data-level={level}
              className="hito-scale-button"
            >
              {level}
            </button>
          ))}
        </div>
        <p className="hito-field-helper mt-2">1 is light discomfort. 5 is the strongest note.</p>
      </div>

      <div>
        <Label>Detail</Label>
        <textarea
          rows={3}
          value={bodyNote.note}
          onChange={(event) => onChange({ note: event.target.value })}
          placeholder="What did you feel, and when did it show up?"
          className="hito-field hito-textarea-md mt-3 min-h-24 resize-none"
        />
      </div>
    </div>
  );
}

function BodyAreaMapField({
  value,
  onChange,
}: {
  value: BodyNoteArea;
  onChange: (value: BodyNoteArea) => void;
}) {
  const [view, setView] = useState<BodyNoteMapSide>(
    () => getBodyNoteAreaRegion(value)?.side ?? "front",
  );
  const selectedRegion = getBodyNoteAreaRegion(value);
  const visibleRegions = BODY_NOTE_AREA_REGIONS.filter((region) => region.side === view);

  useEffect(() => {
    const nextView = getBodyNoteAreaRegion(value)?.side;

    if (nextView) {
      setView(nextView);
    }
  }, [value]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
      <div className="hito-surface-flat p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Label>Body location</Label>
            <p className="hito-support-copy mt-2">
              Pick one bounded area for this note. Add another note if more than one spot felt off.
            </p>
          </div>
          <div className="hito-tab-list">
            {(["front", "back"] as const).map((side) => (
              <button
                key={side}
                type="button"
                onClick={() => setView(side)}
                data-active={view === side}
                className="hito-tab capitalize"
              >
                {side}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex justify-center">
          <svg viewBox="0 0 200 500" className="h-[260px] w-auto max-w-full">
            <BodyMapSilhouette />
            {visibleRegions.map((region) => (
              <BodyMapPoint
                key={region.area}
                region={region}
                selected={region.area === value}
                onSelect={onChange}
              />
            ))}
          </svg>
        </div>

        <p className="hito-support-copy mt-4 text-center">
          {selectedRegion ? `${selectedRegion.area} selected` : "Choose one area for this note."}
        </p>
      </div>

      <div className="space-y-2">
        {visibleRegions.map((region) => (
          <button
            key={region.area}
            type="button"
            onClick={() => onChange(region.area)}
            className={cn(
              "hito-surface-flat flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition-colors",
              region.area === value ? "border-signal/35 bg-accent/35" : "hover:bg-accent/25",
            )}
          >
            <span className="hito-list-row-title">{region.area}</span>
            {region.area === value ? (
              <span className="hito-caption text-signal">Selected</span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}

function BodyMapPoint({
  region,
  selected,
  onSelect,
}: {
  region: BodyNoteAreaRegion;
  selected: boolean;
  onSelect: (value: BodyNoteArea) => void;
}) {
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={region.area}
      onClick={() => onSelect(region.area)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(region.area);
        }
      }}
      className="cursor-pointer"
    >
      <circle
        cx={region.x}
        cy={region.y}
        r={selected ? 10 : 6}
        fill={
          selected
            ? "color-mix(in oklch, var(--signal) 28%, transparent)"
            : "color-mix(in oklch, var(--color-background) 34%, transparent)"
        }
        stroke={selected ? "var(--signal)" : "var(--muted-foreground)"}
        strokeWidth={selected ? 1.75 : 1}
        className="transition-all"
      />
    </g>
  );
}

function BodyMapSilhouette() {
  return (
    <g fill="none" stroke="var(--hairline)" strokeWidth="1">
      <circle cx="100" cy="35" r="20" />
      <line x1="92" y1="55" x2="92" y2="65" />
      <line x1="108" y1="55" x2="108" y2="65" />
      <path d="M 65 75 Q 60 110 65 160 L 75 220 L 125 220 L 135 160 Q 140 110 135 75 Q 120 65 100 65 Q 80 65 65 75 Z" />
      <path d="M 65 75 Q 50 130 48 200 L 55 240" />
      <path d="M 135 75 Q 150 130 152 200 L 145 240" />
      <circle cx="55" cy="248" r="6" />
      <circle cx="145" cy="248" r="6" />
      <path d="M 75 220 L 75 320 L 80 420 L 85 470" />
      <path d="M 95 220 L 92 320 L 88 420 L 88 470" />
      <path d="M 105 220 L 108 320 L 112 420 L 112 470" />
      <path d="M 125 220 L 125 320 L 120 420 L 115 470" />
      <ellipse cx="84" cy="478" rx="9" ry="5" />
      <ellipse cx="116" cy="478" rx="9" ry="5" />
      <line x1="78" y1="320" x2="93" y2="320" />
      <line x1="107" y1="320" x2="122" y2="320" />
    </g>
  );
}

function SeverityBars({ severity }: { severity: BodyNote["severity"] }) {
  return (
    <div className="hito-severity-bars" aria-label={`Severity ${severity} of 5`}>
      {[1, 2, 3, 4, 5].map((level) => (
        <span
          key={level}
          className="hito-severity-bar"
          data-active={level <= severity}
          data-level={level}
        />
      ))}
    </div>
  );
}

export function describeBodyNoteDraft(bodyNote: BodyNoteDraft) {
  const parts = [
    bodyNote.timing === "during" ? "During the run" : "After the run",
    bodyNote.sensation || "No sensation selected",
  ];

  if (bodyNote.note.trim()) {
    parts.push(bodyNote.note.trim());
  }

  return parts.join(" · ");
}

function Label({ children }: { children: ReactNode }) {
  return <div className="hito-form-label">{children}</div>;
}

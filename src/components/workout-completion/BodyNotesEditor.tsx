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
import { HitoButton } from "@/components/ui/button";
import { HitoSlider } from "@/components/ui/hito-slider";
import { useHitoTabs } from "@/components/ui/hito-tabs";
import { HitoNativeSelectField } from "@/components/ui/native-select-field";
import { Textarea } from "@/components/ui/textarea";
import { useHitoProductMessage, useHitoUiLocale } from "@/components/ui/hito-ui-locale-provider";
import { DEFAULT_RESOLVED_UI_LOCALE, formatUiNumber, type ResolvedUiLocale } from "@/lib/ui-locale";
import { formatHitoProductMessage, getHitoKnownProductMessage } from "@/lib/ui-locale-messages";

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
  const locale = useHitoUiLocale();
  const t = useHitoProductMessage();
  const hasBodyNotes = bodyNotes.length > 0;

  return (
    <div className="border-t border-hairline pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Label>{t("Body notes")}</Label>
          <p className="hito-body-md text-secondary mt-2">
            {t("Add any pain, tightness, or discomfort that showed up during or after this run.")}
          </p>
        </div>
        <HitoButton type="button" onClick={onOpen} size="sm" variant="secondary">
          <Icon name="plus" size="sm" />
          {hasBodyNotes ? t("Edit body notes") : t("Add body note")}
        </HitoButton>
      </div>

      {!hasBodyNotes ? (
        <div className="hito-surface-flat mt-4 p-4">
          <p className="hito-body-md text-secondary">
            {t(
              "No body notes saved with this workout result. Leave this empty when the run felt normal.",
            )}
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
                <p className="hito-body-md text-foreground">
                  {getHitoKnownProductMessage(locale, bodyNote.area)}
                </p>
                <p className="hito-body-sm text-secondary mt-1">
                  {describeBodyNoteDraft(bodyNote, locale)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <SeverityBars severity={bodyNote.severity} />
                <span className="hito-technical-sm text-tertiary">
                  {formatUiNumber(bodyNote.severity, locale)}/5
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function BodyNotesModal({
  baselineBodyNotes,
  open,
  bodyNotes,
  onOpenChange,
  onChange,
  onSave,
}: {
  baselineBodyNotes: BodyNoteDraft[];
  open: boolean;
  bodyNotes: BodyNoteDraft[];
  onOpenChange: (open: boolean) => void;
  onChange: (bodyNotes: BodyNoteDraft[]) => void;
  onSave: () => void;
}) {
  const locale = useHitoUiLocale();
  const t = useHitoProductMessage();
  const canAddMore = bodyNotes.length < 8;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="hito-dialog-overlay-stable"
        className="hito-dialog-stable hito-product-dialog hito-dialog-surface-product hito-dialog-size-workflow hito-dialog-height-workflow-relaxed"
      >
        <DialogHeader className="hito-product-dialog-header">
          <DialogTitle className="hito-ui-title-md text-foreground">{t("Body notes")}</DialogTitle>
          <DialogDescription className="hito-body-md text-secondary max-w-2xl">
            {t(
              "These notes stay attached to this workout result only. Use them to mark where the run felt off without turning the result into a second full form.",
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="hito-product-dialog-body-scroll-fill">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="hito-body-xs text-tertiary">
              {bodyNotes.length === 0
                ? t("No body notes yet.")
                : t(
                    bodyNotes.length === 1
                      ? "{count} body note in this workout result."
                      : "{count} body notes in this workout result.",
                    { count: formatUiNumber(bodyNotes.length, locale) },
                  )}
            </p>
            {canAddMore ? (
              <HitoButton
                type="button"
                onClick={() => onChange([...bodyNotes, createEmptyBodyNoteDraft()])}
                size="sm"
                variant="secondary"
              >
                <Icon name="plus" size="sm" />
                {t("Add note")}
              </HitoButton>
            ) : null}
          </div>

          {bodyNotes.length === 0 ? (
            <div className="hito-surface-flat mt-5 p-5">
              <p className="hito-body-md text-secondary">
                {t("No body notes will be saved with this workout unless you add one here.")}
              </p>
              <HitoButton
                type="button"
                onClick={() => onChange([createEmptyBodyNoteDraft()])}
                size="sm"
                variant="secondary"
                className="mt-4"
              >
                <Icon name="plus" size="sm" />
                {t("Add body note")}
              </HitoButton>
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              {bodyNotes.map((bodyNote, index) => (
                <BodyNoteEditorCard
                  key={`${bodyNote.area}-${bodyNote.timing}-${index}`}
                  bodyNote={bodyNote}
                  index={index}
                  previousSeverity={baselineBodyNotes[index]?.severity ?? 2}
                  onChange={(patch) => onChange(updateBodyNoteDraftList(bodyNotes, index, patch))}
                  onRemove={() => onChange(bodyNotes.filter((_, noteIndex) => noteIndex !== index))}
                />
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="hito-product-dialog-footer sm:space-x-0">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="hito-body-xs text-tertiary">
              {t(
                "Saved fields stay bounded to area, timing, sensation, severity, and an optional note.",
              )}
            </p>
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <HitoButton
                type="button"
                onClick={() => onOpenChange(false)}
                size="md"
                variant="ghost"
              >
                {t("Cancel")}
              </HitoButton>
              <HitoButton type="button" onClick={onSave} size="md" variant="primary">
                {t("Save body notes")}
              </HitoButton>
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
  previousSeverity,
  onChange,
  onRemove,
}: {
  bodyNote: BodyNoteDraft;
  index: number;
  previousSeverity: BodyNote["severity"];
  onChange: (patch: Partial<BodyNoteDraft>) => void;
  onRemove: () => void;
}) {
  const locale = useHitoUiLocale();
  const t = useHitoProductMessage();
  return (
    <div className="hito-surface-flat space-y-5 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="hito-label-md text-foreground">
            {t("Body note {count}", { count: formatUiNumber(index + 1, locale) })}
          </p>
          <p className="hito-body-xs text-tertiary mt-1">
            {getHitoKnownProductMessage(locale, bodyNote.area)}
          </p>
        </div>
        <HitoButton type="button" onClick={onRemove} size="xs" variant="ghost">
          <Icon name="trash" size="xs" />
          {t("Remove")}
        </HitoButton>
      </div>

      <BodyAreaMapField value={bodyNote.area} onChange={(value) => onChange({ area: value })} />

      <div className="grid gap-4 sm:grid-cols-2">
        <HitoNativeSelectField
          label={t("When")}
          value={bodyNote.timing}
          onValueChange={(value) => onChange({ timing: value as BodyNoteTiming })}
          options={BODY_NOTE_TIMINGS.map((timing) => ({
            value: timing,
            label: timing === "during" ? t("During the run") : t("After the run"),
          }))}
        />
        <HitoNativeSelectField
          label={t("Sensation")}
          value={bodyNote.sensation}
          onValueChange={(value) => onChange({ sensation: value as BodyNoteSensation | "" })}
          options={[
            { value: "", label: t("Choose one") },
            ...BODY_NOTE_SENSATIONS.map((sensation) => ({
              value: sensation,
              label: getHitoKnownProductMessage(locale, sensation),
            })),
          ]}
        />
      </div>

      <HitoSlider
        label={t("Severity")}
        min={1}
        max={5}
        step={1}
        previousValue={previousSeverity}
        previousValueLabel={t("Restore session severity {value} out of 5", {
          value: formatUiNumber(previousSeverity, locale),
        })}
        value={bodyNote.severity}
        valueLabel={`${formatUiNumber(bodyNote.severity, locale)}/5`}
        ariaValueText={t("Severity {value} out of 5", {
          value: formatUiNumber(bodyNote.severity, locale),
        })}
        helper={t("1 is light discomfort. 5 is the strongest note.")}
        onValueChange={(value) => onChange({ severity: value as BodyNote["severity"] })}
      />

      <div>
        <Label>{t("Detail")}</Label>
        <Textarea
          rows={3}
          value={bodyNote.note}
          onChange={(event) => onChange({ note: event.target.value })}
          placeholder={t("What did you feel, and when did it show up?")}
          size="md"
          variant="primary"
          className="mt-3 min-h-24 resize-none"
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
  const locale = useHitoUiLocale();
  const t = useHitoProductMessage();
  const [view, setView] = useState<BodyNoteMapSide>(
    () => getBodyNoteAreaRegion(value)?.side ?? "front",
  );
  const bodyMapTabs = useHitoTabs({
    items: [{ value: "front" }, { value: "back" }],
    value: view,
  });
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
            <Label>{t("Body location")}</Label>
            <p className="hito-body-md text-secondary mt-2">
              {t(
                "Pick one bounded area for this note. Add another note if more than one spot felt off.",
              )}
            </p>
          </div>
          <div
            className="hito-tab-list"
            {...bodyMapTabs.tabListProps}
            aria-label={t("Body map side")}
          >
            {(["front", "back"] as const).map((side) => (
              <button
                key={side}
                type="button"
                {...bodyMapTabs.getTabProps(side)}
                onClick={() => setView(side)}
                data-active={view === side}
                className="hito-tab capitalize"
              >
                {side === "front" ? t("Front") : t("Back")}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex justify-center" {...bodyMapTabs.getPanelProps(view)}>
          <svg viewBox="0 0 200 500" className="h-[260px] w-auto max-w-full">
            <BodyMapSilhouette />
            {visibleRegions.map((region) => (
              <BodyMapPoint
                key={region.area}
                region={region}
                locale={locale}
                selected={region.area === value}
                onSelect={onChange}
              />
            ))}
          </svg>
        </div>

        <p className="hito-body-md text-secondary mt-4 text-center">
          {selectedRegion
            ? t("{area} selected", {
                area: getHitoKnownProductMessage(locale, selectedRegion.area),
              })
            : t("Choose one area for this note.")}
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
            <span className="hito-body-md text-foreground">
              {getHitoKnownProductMessage(locale, region.area)}
            </span>
            {region.area === value ? (
              <span className="hito-body-xs text-tertiary text-signal">{t("Selected")}</span>
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
  locale,
}: {
  region: BodyNoteAreaRegion;
  selected: boolean;
  onSelect: (value: BodyNoteArea) => void;
  locale: ResolvedUiLocale;
}) {
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={getHitoKnownProductMessage(locale, region.area)}
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
  const locale = useHitoUiLocale();
  return (
    <div
      className="hito-severity-bars"
      aria-label={formatHitoProductMessage(locale, "Severity {value} of 5", {
        value: formatUiNumber(severity, locale),
      })}
    >
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

export function describeBodyNoteDraft(
  bodyNote: BodyNoteDraft,
  locale: ResolvedUiLocale = DEFAULT_RESOLVED_UI_LOCALE,
) {
  const parts = [
    getHitoKnownProductMessage(
      locale,
      bodyNote.timing === "during" ? "During the run" : "After the run",
    ),
    bodyNote.sensation
      ? getHitoKnownProductMessage(locale, bodyNote.sensation)
      : getHitoKnownProductMessage(locale, "No sensation selected"),
  ];

  if (bodyNote.note.trim()) {
    parts.push(bodyNote.note.trim());
  }

  return parts.join(" · ");
}

function Label({ children }: { children: ReactNode }) {
  return <div className="hito-label-md text-foreground">{children}</div>;
}

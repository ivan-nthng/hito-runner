import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type ReactNode, useState } from "react";
import { Icon } from "@/components/ui/icon";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WorkoutGlyph } from "@/components/WorkoutGlyph";
import {
  MANUAL_WORKOUT_REPEAT_SAFETY_KIND_VALUES,
  type ManualWorkoutBlockInput,
  type ManualWorkoutBlockKey,
  type ManualWorkoutConstructorEntryInput,
  type ManualWorkoutRepeatGroupInput,
  type ManualWorkoutRepeatSafetyKind,
  type ManualWorkoutTargetTruthMode,
} from "@/lib/manual-workout-authoring/schema";
import type { ManualWorkoutTemplate } from "@/lib/manual-workout-authoring/templates";
import { formatDistanceMeters, formatDurationMin } from "@/lib/training";
import type { WorkoutGlyphKind } from "@/lib/workout-glyph";
import {
  cloneManualWorkoutEntries,
  groupManualTemplates,
  targetTruthModeCopy,
  targetTruthModeLabel,
  templateIconKind,
  templateIconTone,
} from "@/components/manual-workout/manual-workout-authoring-utils";

export type ManualWorkoutConstructorSource = "template" | "scratch" | "saved_template";

export function ManualWorkoutConstructorEditor({
  allowedTargetTruthModes,
  dateLabel,
  entries,
  entriesLocked = false,
  iconKey,
  iconTone,
  isRestDraft,
  notes,
  onEntriesChange,
  onNotesChange,
  onScratchTemplateChange,
  onTargetTruthModeChange,
  onTitleChange,
  reviewDisabledReason,
  selectedTemplateKey,
  source,
  sourceLabel,
  statusLabel,
  targetTruthMode,
  templateOptions,
  title,
}: {
  allowedTargetTruthModes: ManualWorkoutTargetTruthMode[];
  dateLabel: string;
  entries: ManualWorkoutConstructorEntryInput[];
  entriesLocked?: boolean;
  iconKey: WorkoutGlyphKind;
  iconTone: string;
  isRestDraft: boolean;
  notes: string;
  onEntriesChange: (entries: ManualWorkoutConstructorEntryInput[]) => void;
  onNotesChange: (value: string) => void;
  onScratchTemplateChange?: (templateKey: ManualWorkoutTemplate["templateKey"]) => void;
  onTargetTruthModeChange?: (value: ManualWorkoutTargetTruthMode) => void;
  onTitleChange: (value: string) => void;
  reviewDisabledReason?: string | null;
  selectedTemplateKey?: ManualWorkoutTemplate["templateKey"] | null;
  source: ManualWorkoutConstructorSource;
  sourceLabel: string;
  statusLabel: string;
  targetTruthMode: ManualWorkoutTargetTruthMode;
  templateOptions: ManualWorkoutTemplate[];
  title: string;
}) {
  const editable = !entriesLocked;
  const selectedTemplate = templateOptions.find(
    (template) => template.templateKey === selectedTemplateKey,
  );
  const hasRepeatGroup = entries.some((entry) => entry.kind === "repeat_group");

  const updateEntries = (nextEntries: ManualWorkoutConstructorEntryInput[]) => {
    onEntriesChange(cloneManualWorkoutEntries(nextEntries));
  };
  const addEntryAt = (insertIndex: number, entry: ManualWorkoutConstructorEntryInput) => {
    updateEntries(insertEntry(entries, insertIndex, entry));
  };
  const duplicateEntryAt = (index: number) => {
    const entry = entries[index];
    if (!entry) return;
    const [entryCopy] = cloneManualWorkoutEntries([entry]);
    if (!entryCopy) return;
    addEntryAt(index + 1, entryCopy);
  };

  return (
    <div className="grid gap-5">
      <section className="hito-manual-workout-editor-surface">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-hairline bg-surface"
              style={{ color: iconTone }}
              aria-hidden="true"
            >
              <WorkoutGlyph kind={iconKey} className="h-4 w-4" />
            </span>
            <div className="hito-manual-workout-title-field grid flex-1 gap-1">
              <label className="sr-only" htmlFor="manual-workout-constructor-title">
                Workout name
              </label>
              <input
                id="manual-workout-constructor-title"
                className="hito-field hito-field-primary hito-field-sm text-base font-semibold"
                value={title}
                onChange={(event) => onTitleChange(event.target.value)}
                placeholder={selectedTemplate?.defaultTitle ?? "Name this workout"}
              />
              <p className="hito-list-row-copy">
                {dateLabel} · {selectedTemplate?.label ?? sourceLabel}
              </p>
            </div>
          </div>
          <span
            className="hito-status-pill shrink-0"
            data-tone={statusLabel === "Ready" ? "success" : "muted"}
          >
            {statusLabel}
          </span>
        </div>

        {source === "scratch" ? (
          <div className="grid gap-2">
            <span className="hito-form-label">Workout type</span>
            <ManualScratchWorkoutTypePicker
              onChange={onScratchTemplateChange}
              selectedTemplateKey={selectedTemplateKey}
              templateOptions={templateOptions}
            />
            <span className="hito-field-helper">
              Scratch starts empty. Choose the kind of run, then add the pieces you want reviewed.
            </span>
          </div>
        ) : null}
      </section>

      <ManualWorkoutStructurePreview
        entries={entries}
        isRestDraft={isRestDraft}
        reviewDisabledReason={reviewDisabledReason}
      />

      <ManualTargetGuidanceSection
        allowedTargetTruthModes={allowedTargetTruthModes}
        onTargetTruthModeChange={onTargetTruthModeChange}
        targetTruthMode={targetTruthMode}
      />

      <label className="grid gap-2">
        <span className="hito-form-label">Notes or cues</span>
        <textarea
          className="hito-field hito-field-primary hito-textarea-md resize-none"
          rows={3}
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          placeholder="Optional note for this manual workout."
        />
      </label>

      <section className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="hito-label">Workout pieces</p>
            <p className="hito-field-helper">
              Build the workout from ordered pieces. Hito checks the draft before it can be added.
            </p>
          </div>
        </div>

        <div className="grid gap-2">
          {entries.length ? (
            <>
              {editable ? (
                <ManualAddStepMenu
                  hasRepeatGroup={hasRepeatGroup}
                  onAddBlock={(blockKey) => addEntryAt(0, makeBlockEntry(blockKey))}
                  onAddRepeatGroup={() => addEntryAt(0, makeRepeatEntry())}
                />
              ) : null}
              {entries.map((entry, index) => (
                <div key={`${entry.kind}-${index}`}>
                  <ManualWorkoutEntryRow
                    editable={editable}
                    entry={entry}
                    index={index}
                    onChange={(nextEntry) =>
                      updateEntries(
                        entries.map((entryValue, entryIndex) =>
                          entryIndex === index ? nextEntry : entryValue,
                        ),
                      )
                    }
                    onDelete={() =>
                      updateEntries(entries.filter((_, entryIndex) => entryIndex !== index))
                    }
                    onDuplicate={() => duplicateEntryAt(index)}
                    onMoveDown={() => updateEntries(moveEntry(entries, index, index + 1))}
                    onMoveUp={() => updateEntries(moveEntry(entries, index, index - 1))}
                    total={entries.length}
                  />
                  {editable ? (
                    <ManualAddStepMenu
                      hasRepeatGroup={hasRepeatGroup}
                      onAddBlock={(blockKey) => addEntryAt(index + 1, makeBlockEntry(blockKey))}
                      onAddRepeatGroup={() => addEntryAt(index + 1, makeRepeatEntry())}
                    />
                  ) : null}
                </div>
              ))}
            </>
          ) : (
            <div className="hito-list-row items-start">
              <span className="hito-status-pill mt-0.5 shrink-0" data-tone="muted">
                {isRestDraft ? "Rest" : "Empty"}
              </span>
              <div className="min-w-0">
                <p className="hito-list-row-title">
                  {isRestDraft ? "No run pieces" : "Add workout piece"}
                </p>
                <p className="hito-list-row-copy">
                  {isRestDraft
                    ? "Rest/no-run structure is represented without fake workout targets."
                    : "Choose a run type and add at least one duration or distance piece before review."}
                </p>
              </div>
              {editable && !isRestDraft ? (
                <ManualAddStepMenu
                  prominent
                  hasRepeatGroup={false}
                  onAddBlock={(blockKey) => updateEntries([makeBlockEntry(blockKey)])}
                  onAddRepeatGroup={() => updateEntries([makeRepeatEntry()])}
                />
              ) : null}
            </div>
          )}
        </div>

        {entriesLocked ? (
          <p className="hito-field-helper">
            Saved template structure is rebuilt for review; title and notes can still be adjusted.
          </p>
        ) : null}
      </section>
    </div>
  );
}

function ManualWorkoutStructurePreview({
  entries,
  isRestDraft,
  reviewDisabledReason,
}: {
  entries: ManualWorkoutConstructorEntryInput[];
  isRestDraft: boolean;
  reviewDisabledReason?: string | null;
}) {
  const segments = entries.flatMap((entry) => previewSegmentsForEntry(entry));
  const totalSeconds = entries.reduce((sum, entry) => sum + entryDurationSeconds(entry), 0);
  const totalDistanceMeters = entries.reduce((sum, entry) => sum + entryDistanceMeters(entry), 0);
  const structureParts = [
    totalSeconds > 0 ? formatDurationMin(totalSeconds / 60) : null,
    totalDistanceMeters > 0 ? formatDistanceMeters(totalDistanceMeters) : null,
    entries.length ? `${entries.length} piece${entries.length === 1 ? "" : "s"}` : null,
  ].filter(Boolean);
  const meta = structureParts.length ? structureParts.join(" · ") : "0 min · 0 pieces";
  const totalWeight = Math.max(
    segments.reduce((sum, segment) => sum + segment.weight, 0),
    1,
  );

  return (
    <section className="hito-manual-workout-editor-surface-muted">
      <div className="flex items-center justify-between gap-3">
        <p className="hito-label">Workout structure</p>
        <span className="hito-caption font-mono-num">{meta}</span>
      </div>
      {segments.length ? (
        <div className="grid gap-3">
          <div className="hito-manual-workout-structure-bar" aria-label="Workout structure preview">
            {segments.map((segment, index) => {
              const flexGrow = segment.weight / totalWeight;

              return (
                <span
                  key={`${segment.label}-${index}`}
                  className="hito-manual-workout-structure-segment"
                  title={`${segment.label} · ${segment.metric}`}
                  style={{
                    background: segment.background,
                    flexGrow,
                    flexBasis: 0,
                  }}
                >
                  {flexGrow > 0.12 ? (
                    <span className="hito-manual-workout-structure-label">
                      {segment.shortLabel}
                    </span>
                  ) : null}
                </span>
              );
            })}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {segments.slice(0, 4).map((segment, index) => (
              <div key={`${segment.label}-readback-${index}`} className="flex min-w-0 gap-2">
                <span
                  className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: segment.color }}
                  aria-hidden="true"
                />
                <p className="hito-caption min-w-0">
                  <span className="text-foreground/85">{segment.label}</span>
                  <span className="font-mono-num text-muted-foreground"> · {segment.metric}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="hito-list-row items-start">
          <span className="hito-status-pill mt-0.5 shrink-0" data-tone="muted">
            {isRestDraft ? "Rest" : "Empty"}
          </span>
          <p className="hito-list-row-copy min-w-0">
            {isRestDraft
              ? "Rest day has no executable run structure."
              : "Add a step to populate the live structure preview."}
          </p>
        </div>
      )}
      {reviewDisabledReason ? <p className="hito-field-helper">{reviewDisabledReason}</p> : null}
    </section>
  );
}

function ManualTargetGuidanceSection({
  allowedTargetTruthModes,
  onTargetTruthModeChange,
  targetTruthMode,
}: {
  allowedTargetTruthModes: ManualWorkoutTargetTruthMode[];
  onTargetTruthModeChange?: (value: ManualWorkoutTargetTruthMode) => void;
  targetTruthMode: ManualWorkoutTargetTruthMode;
}) {
  const guidanceLabel = targetTruthModeLabel(targetTruthMode);
  const guidanceCopy = targetTruthModeCopy(targetTruthMode);

  if (onTargetTruthModeChange && allowedTargetTruthModes.length > 1) {
    return (
      <section className="grid gap-2">
        <span className="hito-form-label">How to approach it</span>
        <Select
          value={targetTruthMode}
          onValueChange={(value) => onTargetTruthModeChange(value as ManualWorkoutTargetTruthMode)}
        >
          <SelectTrigger aria-label="Workout guidance">
            <SelectValue placeholder="Choose guidance" />
          </SelectTrigger>
          <SelectContent>
            {allowedTargetTruthModes.map((mode) => (
              <SelectItem key={mode} value={mode}>
                {targetTruthModeLabel(mode)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="hito-field-helper">{guidanceCopy}</span>
      </section>
    );
  }

  return (
    <section className="grid gap-2">
      <span className="hito-form-label">How to approach it</span>
      <div className="hito-list-row hito-manual-workout-guidance-row items-start">
        <div className="min-w-0">
          <p className="hito-list-row-title">{guidanceLabel}</p>
          <p className="hito-list-row-copy">{guidanceCopy}</p>
        </div>
      </div>
    </section>
  );
}

function ManualWorkoutEntryRow({
  editable,
  entry,
  index,
  onChange,
  onDelete,
  onDuplicate,
  onMoveDown,
  onMoveUp,
  total,
}: {
  editable: boolean;
  entry: ManualWorkoutConstructorEntryInput;
  index: number;
  onChange: (entry: ManualWorkoutConstructorEntryInput) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveDown: () => void;
  onMoveUp: () => void;
  total: number;
}) {
  const ordinal = String(index + 1).padStart(2, "0");

  if (entry.kind === "repeat_group") {
    const updateGroup = (group: ManualWorkoutRepeatGroupInput) =>
      onChange({
        kind: "repeat_group",
        group,
      });

    return (
      <article className="group/step hito-manual-workout-step-card grid gap-4">
        <div className="flex flex-wrap items-start gap-3">
          <span className="hito-caption w-7 shrink-0 pt-2 text-right font-mono-num">{ordinal}</span>
          <div className="hito-manual-workout-step-summary grid flex-1 gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="hito-status-pill" data-tone="warning">
                  Repeat
                </span>
                <p className="hito-list-row-title">
                  {entry.group.groupLabel ?? `${entry.group.repeatCount} rounds`}
                </p>
              </div>
              <p className="hito-list-row-copy">{repeatGroupSummary(entry.group)}</p>
            </div>
            <ManualRepeatIdentityFields
              disabled={!editable}
              group={entry.group}
              onChange={updateGroup}
            />
          </div>
          <EntryRowActions
            disabled={!editable}
            index={index}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onMoveDown={onMoveDown}
            onMoveUp={onMoveUp}
            stepLabel="repeat step"
            total={total}
          />
        </div>

        <div className="grid gap-3">
          <div className="grid gap-1">
            <p className="hito-form-label">Repeat unit</p>
            <p className="hito-field-helper">
              Each round uses the work piece and recovery piece below.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <ManualBlockPartFields
              block={entry.group.workBlock}
              disabled={!editable}
              roleLabel="Work"
              onChange={(block) =>
                updateGroup({
                  ...entry.group,
                  workBlock: block,
                })
              }
            />
            <ManualBlockPartFields
              block={entry.group.recoveryBlock ?? makeDefaultBlock("interval_recovery_block")}
              disabled={!editable}
              roleLabel="Recovery"
              onChange={(block) =>
                updateGroup({
                  ...entry.group,
                  recoveryBlock: block,
                })
              }
            />
          </div>
        </div>
      </article>
    );
  }

  const updateBlock = (block: ManualWorkoutBlockInput) => onChange({ kind: "block", block });

  return (
    <article className="group/step hito-manual-workout-step-card grid gap-3">
      <div className="flex flex-wrap items-start gap-3">
        <span className="hito-caption w-7 shrink-0 pt-2 text-right font-mono-num">{ordinal}</span>
        <span
          className="mt-2 h-6 w-1 shrink-0 rounded-full"
          style={{ background: blockTone(entry.block.blockKey) }}
          aria-hidden="true"
        />
        <div className="hito-manual-workout-step-summary grid flex-1 gap-3">
          <div className="min-w-0">
            <p className="hito-list-row-title">
              {entry.block.label ?? blockLabel(entry.block.blockKey)}
            </p>
            <p className="hito-list-row-copy">{blockSummary(entry.block)}</p>
          </div>
          <ManualBlockIdentityFields
            block={entry.block}
            disabled={!editable}
            onChange={updateBlock}
            roleLabel="Piece"
          />
        </div>
        <EntryRowActions
          disabled={!editable}
          index={index}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onMoveDown={onMoveDown}
          onMoveUp={onMoveUp}
          stepLabel={entry.block.label ?? blockLabel(entry.block.blockKey)}
          total={total}
        />
      </div>
      <div className="hito-manual-workout-block-fields">
        <ManualBlockQuantityFields
          block={entry.block}
          disabled={!editable}
          onChange={updateBlock}
          roleLabel="Piece"
        />
      </div>
    </article>
  );
}

function ManualRepeatIdentityFields({
  disabled,
  group,
  onChange,
}: {
  disabled: boolean;
  group: ManualWorkoutRepeatGroupInput;
  onChange: (group: ManualWorkoutRepeatGroupInput) => void;
}) {
  return (
    <div className="hito-manual-workout-repeat-settings-grid">
      <label className="grid gap-2">
        <span className="hito-form-label">Repeat label</span>
        <input
          className="hito-field hito-field-secondary hito-field-sm"
          disabled={disabled}
          value={group.groupLabel ?? ""}
          onChange={(event) =>
            onChange({
              ...group,
              groupLabel: event.target.value || undefined,
            })
          }
          placeholder="Repeat label"
        />
      </label>
      <PickerField label="Rounds">
        <Select
          disabled={disabled}
          value={String(group.repeatCount)}
          onValueChange={(value) =>
            onChange({
              ...group,
              repeatCount: clampInteger(value, 2, 50),
            })
          }
        >
          <SelectTrigger
            aria-label="Repeat rounds"
            className="hito-field hito-field-secondary hito-field-sm"
          >
            <SelectValue placeholder="Rounds" />
          </SelectTrigger>
          <SelectContent>
            {REPEAT_COUNT_OPTIONS.map((count) => (
              <SelectItem key={count} value={String(count)}>
                {count} rounds
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PickerField>
      <PickerField label="Repeat focus">
        <Select
          disabled={disabled}
          value={group.safetyKind}
          onValueChange={(value) =>
            onChange({
              ...group,
              safetyKind: value as ManualWorkoutRepeatSafetyKind,
            })
          }
        >
          <SelectTrigger
            aria-label="Repeat focus"
            className="hito-field hito-field-secondary hito-field-sm"
          >
            <SelectValue placeholder="Repeat focus" />
          </SelectTrigger>
          <SelectContent>
            {MANUAL_WORKOUT_REPEAT_SAFETY_KIND_VALUES.map((kind) => (
              <SelectItem key={kind} value={kind}>
                {readableToken(kind)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PickerField>
    </div>
  );
}

function ManualBlockPartFields({
  block,
  disabled,
  onChange,
  roleLabel,
}: {
  block: ManualWorkoutBlockInput;
  disabled: boolean;
  onChange: (block: ManualWorkoutBlockInput) => void;
  roleLabel: string;
}) {
  return (
    <div className="hito-manual-workout-block-fields">
      <div className="grid gap-3">
        <div className="flex min-w-0 flex-wrap items-start gap-2">
          <span
            className="hito-status-pill shrink-0"
            data-icon="false"
            style={{ color: blockTone(block.blockKey) }}
          >
            {roleLabel}
          </span>
          <div className="min-w-0">
            <p className="hito-list-row-title">{block.label ?? blockLabel(block.blockKey)}</p>
            <p className="hito-list-row-copy">{blockSummary(block)}</p>
          </div>
        </div>
        <ManualBlockIdentityFields
          block={block}
          disabled={disabled}
          onChange={onChange}
          roleLabel={roleLabel}
        />
      </div>
      <ManualBlockQuantityFields
        block={block}
        disabled={disabled}
        onChange={onChange}
        roleLabel={roleLabel}
      />
    </div>
  );
}

function ManualBlockIdentityFields({
  block,
  disabled,
  onChange,
  roleLabel,
}: {
  block: ManualWorkoutBlockInput;
  disabled: boolean;
  onChange: (block: ManualWorkoutBlockInput) => void;
  roleLabel: string;
}) {
  return (
    <div className="hito-manual-workout-field-grid">
      <PickerField label={`${roleLabel} type`}>
        <ManualBlockTypePicker
          disabled={disabled}
          label={`${roleLabel} type`}
          onChange={(blockKey) => onChange(makeDefaultBlock(blockKey))}
          value={block.blockKey}
        />
      </PickerField>
      <label className="grid gap-2">
        <span className="hito-form-label">{roleLabel} label</span>
        <input
          className="hito-field hito-field-secondary hito-field-sm"
          disabled={disabled}
          value={block.label ?? ""}
          onChange={(event) =>
            onChange({
              ...block,
              label: event.target.value || undefined,
            })
          }
          placeholder={blockLabel(block.blockKey)}
        />
      </label>
    </div>
  );
}

function ManualBlockQuantityFields({
  block,
  disabled,
  onChange,
  roleLabel,
}: {
  block: ManualWorkoutBlockInput;
  disabled: boolean;
  onChange: (block: ManualWorkoutBlockInput) => void;
  roleLabel: string;
}) {
  const noteOnly = isNoteBlock(block.blockKey);
  const quantityMode = quantityModeForBlock(block);
  const quantityValue =
    quantityMode === "distance"
      ? block.distanceMeters == null
        ? "none"
        : String(block.distanceMeters)
      : block.durationSeconds == null
        ? "none"
        : String(block.durationSeconds);
  const quantityFieldLabel =
    quantityMode === "none" ? "Quantity" : quantityMode === "distance" ? "Distance" : "Duration";

  if (noteOnly) {
    return (
      <div className="grid gap-3">
        <label className="grid gap-2">
          <span className="hito-form-label">{roleLabel} cue</span>
          <textarea
            className="hito-field hito-field-secondary hito-textarea-md resize-none"
            disabled={disabled}
            rows={2}
            value={block.noteText ?? ""}
            onChange={(event) =>
              onChange({
                ...block,
                noteText: event.target.value || undefined,
              })
            }
            placeholder="Cue or mobility note"
          />
        </label>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-2">
        <span className="hito-form-label">Quantity</span>
        <QuantityModeToggle
          disabled={disabled}
          label={roleLabel}
          onChange={(mode) => onChange(blockForQuantityMode(block, mode))}
          value={quantityMode}
        />
      </div>
      <PickerField label={quantityFieldLabel}>
        <Select
          disabled={disabled || quantityMode === "none"}
          value={quantityValue}
          onValueChange={(value) => onChange(blockWithQuantityValue(block, quantityMode, value))}
        >
          <SelectTrigger
            aria-label={`${roleLabel} quantity`}
            className="hito-field hito-field-secondary hito-field-sm"
          >
            <SelectValue placeholder={quantityFieldLabel} />
          </SelectTrigger>
          <SelectContent>
            {(quantityMode === "distance"
              ? distanceOptionsFor(block.distanceMeters)
              : durationOptionsFor(block.durationSeconds)
            ).map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="hito-field-helper">
          {quantityMode === "none"
            ? "Review needs duration or distance for run pieces."
            : "Switching between duration and distance keeps only one quantity for review."}
        </span>
      </PickerField>
    </div>
  );
}

function QuantityModeToggle({
  disabled,
  label,
  onChange,
  value,
}: {
  disabled: boolean;
  label: string;
  onChange: (value: ManualWorkoutQuantityMode) => void;
  value: ManualWorkoutQuantityMode;
}) {
  return (
    <div
      className="hito-choice-toggle-group"
      role="radiogroup"
      aria-label={`${label} quantity path`}
    >
      {QUANTITY_MODE_OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            className="hito-choice-toggle hito-choice-toggle-sm"
            aria-checked={selected}
            aria-disabled={disabled || undefined}
            data-selected={selected}
            disabled={disabled}
            role="radio"
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function PickerField({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="grid gap-2">
      <span className="hito-form-label">{label}</span>
      {children}
    </div>
  );
}

function ManualScratchWorkoutTypePicker({
  onChange,
  selectedTemplateKey,
  templateOptions,
}: {
  onChange?: (templateKey: ManualWorkoutTemplate["templateKey"]) => void;
  selectedTemplateKey?: ManualWorkoutTemplate["templateKey"] | null;
  templateOptions: ManualWorkoutTemplate[];
}) {
  const [mobilePickerOpen, setMobilePickerOpen] = useState(false);
  const selectedTemplate = templateOptions.find(
    (template) => template.templateKey === selectedTemplateKey,
  );
  const disabled = !onChange;

  const selectTemplate = (template: ManualWorkoutTemplate) => {
    setMobilePickerOpen(false);
    onChange?.(template.templateKey);
  };

  return (
    <>
      <button
        type="button"
        className="hito-field hito-field-secondary hito-field-sm flex w-full items-center justify-between gap-3 text-left md:hidden"
        disabled={disabled}
        aria-label="Workout type"
        onClick={() => setMobilePickerOpen(true)}
      >
        <span className="min-w-0 truncate">{selectedTemplate?.label ?? "Choose workout type"}</span>
        <Icon name="chevron-down" size="xs" className="shrink-0 text-muted-foreground" />
      </button>

      <div className="hidden md:block">
        <Select
          disabled={disabled}
          value={selectedTemplateKey ?? undefined}
          onValueChange={(value) => onChange?.(value as ManualWorkoutTemplate["templateKey"])}
        >
          <SelectTrigger aria-label="Workout type">
            <SelectValue placeholder="Choose workout type" />
          </SelectTrigger>
          <SelectContent>
            {templateOptions.map((template) => (
              <SelectItem key={template.templateKey} value={template.templateKey}>
                {template.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ManualScratchWorkoutTypePickerDialog
        onOpenChange={setMobilePickerOpen}
        onSelect={selectTemplate}
        open={mobilePickerOpen}
        selectedTemplateKey={selectedTemplateKey}
        templateOptions={templateOptions}
      />
    </>
  );
}

function ManualScratchWorkoutTypePickerDialog({
  onOpenChange,
  onSelect,
  open,
  selectedTemplateKey,
  templateOptions,
}: {
  onOpenChange: (open: boolean) => void;
  onSelect: (template: ManualWorkoutTemplate) => void;
  open: boolean;
  selectedTemplateKey?: ManualWorkoutTemplate["templateKey"] | null;
  templateOptions: ManualWorkoutTemplate[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="hito-dialog-stable hito-product-dialog hito-dialog-surface-product hito-dialog-size-workflow hito-dialog-height-workflow"
        overlayClassName="hito-dialog-overlay-stable"
      >
        <DialogHeader className="hito-product-dialog-header">
          <DialogTitle className="hito-modal-title">Choose workout type</DialogTitle>
          <DialogDescription className="hito-body">
            Pick the kind of workout to build. The draft stays editable and Hito reviews it before
            anything is saved.
          </DialogDescription>
        </DialogHeader>

        <div className="hito-product-dialog-body-scroll-fill">
          <ManualTemplateChoiceRows
            onSelect={onSelect}
            selectedTemplateKey={selectedTemplateKey}
            templateOptions={templateOptions}
          />
        </div>

        <DialogFooter className="hito-product-dialog-footer">
          <button
            type="button"
            className="hito-button hito-button-secondary hito-button-sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ManualTemplateChoiceRows({
  onSelect,
  selectedTemplateKey,
  templateOptions,
}: {
  onSelect: (template: ManualWorkoutTemplate) => void;
  selectedTemplateKey?: ManualWorkoutTemplate["templateKey"] | null;
  templateOptions: ManualWorkoutTemplate[];
}) {
  const groupedTemplates = groupedTemplateOptions(templateOptions);

  return (
    <div className="grid gap-4">
      {groupedTemplates.map((group) => (
        <section key={group.id} className="grid gap-2">
          <p className="hito-label">{group.label}</p>
          <div className="hito-row-group">
            {group.templates.map((template) => {
              const selected = template.templateKey === selectedTemplateKey;

              return (
                <button
                  key={template.templateKey}
                  type="button"
                  className="hito-list-row w-full items-start text-left"
                  aria-pressed={selected || undefined}
                  data-selected={selected || undefined}
                  onClick={() => onSelect(template)}
                >
                  <span
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-hairline bg-surface"
                    style={{ color: templateIconTone(template) }}
                    aria-hidden="true"
                  >
                    <WorkoutGlyph kind={templateIconKind(template)} className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="hito-list-row-title block">{template.label}</span>
                    <span className="hito-list-row-copy block">
                      {selected ? "Current type · " : ""}
                      {targetTruthModeCopy(template.defaultTargetTruthMode)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function groupedTemplateOptions(templateOptions: ManualWorkoutTemplate[]) {
  const optionKeys = new Set(templateOptions.map((template) => template.templateKey));
  const grouped = groupManualTemplates()
    .map((group) => ({
      id: group.id,
      label: group.label,
      templates: group.templates.filter((template) => optionKeys.has(template.templateKey)),
    }))
    .filter((group) => group.templates.length > 0);
  const groupedKeys = new Set(
    grouped.flatMap((group) => group.templates.map((template) => template.templateKey)),
  );
  const remaining = templateOptions.filter((template) => !groupedKeys.has(template.templateKey));

  return remaining.length
    ? [...grouped, { id: "other", label: "Other workout types", templates: remaining }]
    : grouped;
}

function ManualBlockTypePicker({
  disabled,
  label,
  onChange,
  value,
}: {
  disabled: boolean;
  label: string;
  onChange: (blockKey: ManualWorkoutBlockKey) => void;
  value: ManualWorkoutBlockKey;
}) {
  const [mobilePickerOpen, setMobilePickerOpen] = useState(false);

  const selectBlock = (blockKey: ManualWorkoutBlockKey) => {
    setMobilePickerOpen(false);
    onChange(blockKey);
  };

  return (
    <>
      <button
        type="button"
        className="hito-field hito-field-secondary hito-field-sm flex w-full items-center justify-between gap-3 text-left md:hidden"
        disabled={disabled}
        aria-label={label}
        onClick={() => setMobilePickerOpen(true)}
      >
        <span className="min-w-0 truncate">{blockLabel(value)}</span>
        <Icon name="chevron-down" size="xs" className="shrink-0 text-muted-foreground" />
      </button>

      <div className="hidden md:block">
        <Select
          disabled={disabled}
          value={value}
          onValueChange={(nextValue) => onChange(nextValue as ManualWorkoutBlockKey)}
        >
          <SelectTrigger
            aria-label={label}
            className="hito-field hito-field-secondary hito-field-sm"
          >
            <SelectValue placeholder={label} />
          </SelectTrigger>
          <SelectContent>
            {BLOCK_MENU_GROUPS.map((group) => (
              <SelectGroupForBlocks key={group.label} group={group} />
            ))}
          </SelectContent>
        </Select>
      </div>

      <ManualBlockTypePickerDialog
        label={label}
        onOpenChange={setMobilePickerOpen}
        onSelect={selectBlock}
        open={mobilePickerOpen}
        value={value}
      />
    </>
  );
}

function ManualBlockTypePickerDialog({
  label,
  onOpenChange,
  onSelect,
  open,
  value,
}: {
  label: string;
  onOpenChange: (open: boolean) => void;
  onSelect: (blockKey: ManualWorkoutBlockKey) => void;
  open: boolean;
  value: ManualWorkoutBlockKey;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="hito-dialog-stable hito-product-dialog hito-dialog-surface-product hito-dialog-size-workflow hito-dialog-height-workflow"
        overlayClassName="hito-dialog-overlay-stable"
      >
        <DialogHeader className="hito-product-dialog-header">
          <DialogTitle className="hito-modal-title">Choose {label.toLowerCase()}</DialogTitle>
          <DialogDescription className="hito-body">
            Pick the piece type. Duration, distance, and labels stay editable after selection.
          </DialogDescription>
        </DialogHeader>

        <div className="hito-product-dialog-body-scroll-fill">
          <ManualBlockChoiceRows currentBlockKey={value} onSelect={onSelect} showCurrent />
        </div>

        <DialogFooter className="hito-product-dialog-footer">
          <button
            type="button"
            className="hito-button hito-button-secondary hito-button-sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SelectGroupForBlocks({
  group,
}: {
  group: { label: string; items: ManualWorkoutBlockKey[] };
}) {
  return (
    <>
      <SelectGroup>
        <SelectLabel>{group.label}</SelectLabel>
        {group.items.map((blockKey) => (
          <SelectItem key={blockKey} value={blockKey}>
            {blockLabel(blockKey)}
          </SelectItem>
        ))}
      </SelectGroup>
      <SelectSeparator />
    </>
  );
}

function EntryRowActions({
  disabled,
  index,
  onDelete,
  onDuplicate,
  onMoveDown,
  onMoveUp,
  stepLabel,
  total,
}: {
  disabled: boolean;
  index: number;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveDown: () => void;
  onMoveUp: () => void;
  stepLabel: string;
  total: number;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="hito-button hito-button-ghost hito-button-sm aspect-square shrink-0 p-0 opacity-100 transition-opacity md:opacity-0 md:group-hover/step:opacity-100 md:group-focus-within/step:opacity-100"
          disabled={disabled}
          aria-label={`More actions for ${stepLabel}`}
        >
          <Icon name="more-horizontal" size="xs" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Piece actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={index === 0} onSelect={onMoveUp}>
          <Icon name="chevron-up" size="xs" />
          Move piece up
        </DropdownMenuItem>
        <DropdownMenuItem disabled={index >= total - 1} onSelect={onMoveDown}>
          <Icon name="chevron-down" size="xs" />
          Move piece down
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onDuplicate}>
          <Icon name="copy" size="xs" />
          Duplicate piece
        </DropdownMenuItem>
        <DropdownMenuItem className="text-destructive" onSelect={onDelete}>
          <Icon name="trash" size="xs" />
          Delete piece
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ManualAddStepMenu({
  hasRepeatGroup,
  onAddBlock,
  onAddRepeatGroup,
  prominent = false,
}: {
  hasRepeatGroup: boolean;
  onAddBlock: (blockKey: ManualWorkoutBlockKey) => void;
  onAddRepeatGroup: () => void;
  prominent?: boolean;
}) {
  const [mobilePickerOpen, setMobilePickerOpen] = useState(false);

  const addBlockFromMobilePicker = (blockKey: ManualWorkoutBlockKey) => {
    setMobilePickerOpen(false);
    onAddBlock(blockKey);
  };

  const addRepeatFromMobilePicker = () => {
    setMobilePickerOpen(false);
    onAddRepeatGroup();
  };

  const triggerClassName = [
    "hito-button hito-button-secondary hito-button-sm relative z-10",
    prominent
      ? ""
      : "opacity-100 md:opacity-0 md:transition-opacity md:group-hover/add-step:opacity-100 md:group-focus-within/add-step:opacity-100 focus-visible:opacity-100",
  ].join(" ");

  return (
    <div
      className={
        prominent
          ? "flex shrink-0 justify-end"
          : "group/add-step relative flex min-h-8 items-center justify-center px-3 py-1"
      }
    >
      {prominent ? null : (
        <span className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-hairline" />
      )}
      <button
        type="button"
        className={`${triggerClassName} md:hidden`}
        onClick={() => setMobilePickerOpen(true)}
      >
        <Icon name="plus" size="xs" />
        Add piece
        <Icon name="chevron-down" size="xs" />
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className={`${triggerClassName} hidden md:inline-flex`}>
            <Icon name="plus" size="xs" />
            Add piece
            <Icon name="chevron-down" size="xs" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={prominent ? "end" : "center"}
          className="hito-manual-workout-menu-step"
        >
          <DropdownMenuLabel>Workout pieces</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={hasRepeatGroup} onSelect={onAddRepeatGroup}>
            <span className="hito-status-pill" data-tone="warning">
              Repeat
            </span>
            Add repeat unit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {BLOCK_MENU_GROUPS.map((group) => (
            <div key={group.label}>
              <DropdownMenuLabel className="pt-2">{group.label}</DropdownMenuLabel>
              {group.items.map((blockKey) => (
                <DropdownMenuItem key={blockKey} onSelect={() => onAddBlock(blockKey)}>
                  <span
                    className="hito-status-pill"
                    data-icon="false"
                    style={{ color: blockTone(blockKey) }}
                  >
                    {blockShortLabel(blockKey)}
                  </span>
                  {blockLabel(blockKey)}
                </DropdownMenuItem>
              ))}
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <ManualAddPiecePickerDialog
        hasRepeatGroup={hasRepeatGroup}
        onAddBlock={addBlockFromMobilePicker}
        onAddRepeatGroup={addRepeatFromMobilePicker}
        onOpenChange={setMobilePickerOpen}
        open={mobilePickerOpen}
      />
    </div>
  );
}

function ManualAddPiecePickerDialog({
  hasRepeatGroup,
  onAddBlock,
  onAddRepeatGroup,
  onOpenChange,
  open,
}: {
  hasRepeatGroup: boolean;
  onAddBlock: (blockKey: ManualWorkoutBlockKey) => void;
  onAddRepeatGroup: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="hito-dialog-stable hito-product-dialog hito-dialog-surface-product hito-dialog-size-workflow hito-dialog-height-workflow"
        overlayClassName="hito-dialog-overlay-stable"
      >
        <DialogHeader className="hito-product-dialog-header">
          <DialogTitle className="hito-modal-title">Add piece</DialogTitle>
          <DialogDescription className="hito-body">
            Choose one piece for this manual workout. Hito reviews the full draft before anything is
            saved.
          </DialogDescription>
        </DialogHeader>

        <div className="hito-product-dialog-body-scroll-fill grid gap-4">
          <section className="grid gap-2">
            <p className="hito-label">Repeat unit</p>
            <div className="hito-row-group">
              <button
                type="button"
                className="hito-list-row w-full items-start text-left disabled:cursor-not-allowed disabled:opacity-50"
                disabled={hasRepeatGroup}
                onClick={onAddRepeatGroup}
              >
                <span className="hito-status-pill mt-0.5 shrink-0" data-tone="warning">
                  Repeat
                </span>
                <span className="min-w-0">
                  <span className="hito-list-row-title block">Add repeat unit</span>
                  <span className="hito-list-row-copy block">
                    Group work and recovery into one reviewed repeat piece.
                  </span>
                </span>
              </button>
            </div>
          </section>

          <ManualBlockChoiceRows onSelect={onAddBlock} />
        </div>

        <DialogFooter className="hito-product-dialog-footer">
          <button
            type="button"
            className="hito-button hito-button-secondary hito-button-sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ManualBlockChoiceRows({
  currentBlockKey,
  onSelect,
  showCurrent = false,
}: {
  currentBlockKey?: ManualWorkoutBlockKey;
  onSelect: (blockKey: ManualWorkoutBlockKey) => void;
  showCurrent?: boolean;
}) {
  return (
    <div className="grid gap-4">
      {BLOCK_MENU_GROUPS.map((group) => (
        <section key={group.label} className="grid gap-2">
          <p className="hito-label">{group.label}</p>
          <div className="hito-row-group">
            {group.items.map((blockKey) => {
              const selected = showCurrent && currentBlockKey === blockKey;

              return (
                <button
                  key={blockKey}
                  type="button"
                  className="hito-list-row w-full items-start text-left"
                  aria-pressed={selected || undefined}
                  data-selected={selected || undefined}
                  onClick={() => onSelect(blockKey)}
                >
                  <span
                    className="hito-status-pill mt-0.5 shrink-0"
                    data-icon="false"
                    style={{ color: blockTone(blockKey) }}
                  >
                    {blockShortLabel(blockKey)}
                  </span>
                  <span className="min-w-0">
                    <span className="hito-list-row-title block">{blockLabel(blockKey)}</span>
                    {selected ? (
                      <span className="hito-list-row-copy block">Current type</span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

const BLOCK_MENU_GROUPS: Array<{ label: string; items: ManualWorkoutBlockKey[] }> = [
  { label: "Preparation", items: ["warmup_block", "drills_mobility_note_block"] },
  {
    label: "Run",
    items: ["easy_run_block", "steady_run_block", "progression_block", "strides_block"],
  },
  {
    label: "Quality",
    items: ["tempo_block", "threshold_block", "interval_work_block", "hill_work_block"],
  },
  {
    label: "Recovery",
    items: ["interval_recovery_block", "rest_walk_jog_recovery_block", "cooldown_block"],
  },
  {
    label: "Endurance",
    items: ["long_run_body_block", "long_run_finish_block", "downhill_control_block"],
  },
  { label: "Notes", items: ["coach_cue_note_block"] },
];

const REPEAT_COUNT_OPTIONS = [2, 3, 4, 5, 6, 8, 10, 12, 15, 20];

const DURATION_SECONDS_OPTIONS = [
  15, 20, 30, 45, 60, 75, 90, 120, 180, 240, 300, 480, 600, 720, 900, 1200, 1500, 1800, 2400, 2700,
  3600, 4500, 5400,
];

const DISTANCE_METERS_OPTIONS = [
  100, 200, 300, 400, 500, 600, 800, 1000, 1200, 1600, 2000, 3000, 4000, 5000, 8000, 10000, 12000,
  16000, 20000,
];

function makeBlockEntry(blockKey: ManualWorkoutBlockKey): ManualWorkoutConstructorEntryInput {
  return {
    kind: "block",
    block: makeDefaultBlock(blockKey),
  };
}

function makeRepeatEntry(): ManualWorkoutConstructorEntryInput {
  return {
    kind: "repeat_group",
    group: {
      repeatCount: 6,
      safetyKind: "intervals",
      groupLabel: "6 rounds: 2 min work + 1 min easy jog",
      workBlock: makeDefaultBlock("interval_work_block"),
      recoveryBlock: makeDefaultBlock("interval_recovery_block"),
    },
  };
}

function insertEntry(
  entries: ManualWorkoutConstructorEntryInput[],
  insertIndex: number,
  entry: ManualWorkoutConstructorEntryInput,
) {
  const nextEntries = [...entries];
  nextEntries.splice(Math.max(0, Math.min(insertIndex, nextEntries.length)), 0, entry);
  return nextEntries;
}

function moveEntry(
  entries: ManualWorkoutConstructorEntryInput[],
  fromIndex: number,
  toIndex: number,
) {
  if (toIndex < 0 || toIndex >= entries.length) return entries;
  const nextEntries = [...entries];
  const [entry] = nextEntries.splice(fromIndex, 1);
  if (!entry) return entries;
  nextEntries.splice(toIndex, 0, entry);
  return nextEntries;
}

function makeDefaultBlock(blockKey: ManualWorkoutBlockKey): ManualWorkoutBlockInput {
  if (blockKey === "drills_mobility_note_block") {
    return { blockKey, label: "Drills or mobility", noteText: "Add a short support note." };
  }
  if (blockKey === "coach_cue_note_block") {
    return { blockKey, label: "Coach cue", noteText: "Add a short cue." };
  }
  if (blockKey === "strides_block") {
    return { blockKey, durationSeconds: 20, label: "Stride" };
  }
  if (blockKey === "interval_work_block") {
    return { blockKey, durationSeconds: 2 * 60, label: "Work" };
  }
  if (blockKey === "interval_recovery_block") {
    return { blockKey, durationSeconds: 60, label: "Easy jog recovery" };
  }
  if (blockKey === "rest_walk_jog_recovery_block") {
    return { blockKey, durationSeconds: 90, label: "Walk-jog recovery" };
  }
  if (blockKey === "hill_work_block") {
    return { blockKey, durationSeconds: 45, label: "Uphill work" };
  }
  if (blockKey === "long_run_body_block") {
    return { blockKey, durationSeconds: 60 * 60, label: "Long-run body" };
  }
  if (blockKey === "long_run_finish_block") {
    return { blockKey, durationSeconds: 10 * 60, label: "Controlled finish" };
  }
  if (blockKey === "cooldown_block") {
    return { blockKey, durationSeconds: 5 * 60, label: "Cooldown" };
  }
  if (blockKey === "warmup_block") {
    return { blockKey, durationSeconds: 10 * 60, label: "Warmup" };
  }
  if (blockKey === "tempo_block") {
    return { blockKey, durationSeconds: 8 * 60, label: "Tempo work" };
  }
  if (blockKey === "threshold_block") {
    return { blockKey, durationSeconds: 10 * 60, label: "Threshold work" };
  }
  if (blockKey === "progression_block") {
    return { blockKey, durationSeconds: 25 * 60, label: "Easy to steady progression" };
  }
  if (blockKey === "downhill_control_block") {
    return { blockKey, durationSeconds: 45, label: "Controlled downhill" };
  }

  return { blockKey, durationSeconds: 10 * 60, label: blockLabel(blockKey) };
}

function previewSegmentsForEntry(entry: ManualWorkoutConstructorEntryInput) {
  if (entry.kind === "repeat_group") {
    const workWeight = blockWeight(entry.group.workBlock);
    const recoveryWeight = entry.group.recoveryBlock ? blockWeight(entry.group.recoveryBlock) : 0;
    const total = Math.max(workWeight + recoveryWeight, 1);
    const workPercent = Math.round((workWeight / total) * 100);
    const workColor = blockTone(entry.group.workBlock.blockKey);
    const recoveryColor = entry.group.recoveryBlock
      ? blockTone(entry.group.recoveryBlock.blockKey)
      : "var(--color-muted)";

    return [
      {
        background: `linear-gradient(90deg, ${workColor} 0 ${workPercent}%, ${recoveryColor} ${workPercent}% 100%)`,
        color: workColor,
        label: entry.group.groupLabel ?? "Repeat group",
        metric: repeatGroupSummary(entry.group),
        shortLabel: `${entry.group.repeatCount}x`,
        weight: Math.max(total * entry.group.repeatCount, 1),
      },
    ];
  }

  const color = blockTone(entry.block.blockKey);

  return [
    {
      background: color,
      color,
      label: entry.block.label ?? blockLabel(entry.block.blockKey),
      metric: blockSummary(entry.block),
      shortLabel: blockShortLabel(entry.block.blockKey),
      weight: blockWeight(entry.block),
    },
  ];
}

function entryDurationSeconds(entry: ManualWorkoutConstructorEntryInput) {
  if (entry.kind === "repeat_group") {
    return (
      (blockDurationSeconds(entry.group.workBlock) +
        (entry.group.recoveryBlock ? blockDurationSeconds(entry.group.recoveryBlock) : 0)) *
      entry.group.repeatCount
    );
  }

  return blockDurationSeconds(entry.block);
}

function blockDurationSeconds(block: ManualWorkoutBlockInput) {
  return block.durationSeconds ?? 0;
}

function entryDistanceMeters(entry: ManualWorkoutConstructorEntryInput) {
  if (entry.kind === "repeat_group") {
    return (
      (blockDistanceMeters(entry.group.workBlock) +
        (entry.group.recoveryBlock ? blockDistanceMeters(entry.group.recoveryBlock) : 0)) *
      entry.group.repeatCount
    );
  }

  return blockDistanceMeters(entry.block);
}

function blockDistanceMeters(block: ManualWorkoutBlockInput) {
  return block.distanceMeters ?? 0;
}

function blockWeight(block: ManualWorkoutBlockInput) {
  if (block.durationSeconds) return block.durationSeconds;
  if (block.distanceMeters) return Math.max(block.distanceMeters / 10, 20);
  return 20;
}

function repeatGroupSummary(group: ManualWorkoutRepeatGroupInput) {
  const recovery = group.recoveryBlock ? ` + ${blockSummary(group.recoveryBlock)} recovery` : "";
  return `${group.repeatCount} rounds · ${blockSummary(group.workBlock)} work${recovery}`;
}

function blockSummary(block: ManualWorkoutBlockInput) {
  if (block.durationSeconds) return formatDurationMin(block.durationSeconds / 60, "segment");
  if (block.distanceMeters) return formatDistanceMeters(block.distanceMeters);
  if (block.noteText) return block.noteText;
  return "Structure";
}

function blockLabel(blockKey: string) {
  if (blockKey === "warmup_block") return "Warm-up";
  return readableToken(blockKey.replace(/_block$/, ""));
}

function blockShortLabel(blockKey: string) {
  if (blockKey === "warmup_block") return "WU";
  if (blockKey === "cooldown_block") return "CD";
  if (blockKey === "interval_work_block") return "Work";
  if (blockKey === "interval_recovery_block") return "Rec";
  if (blockKey === "rest_walk_jog_recovery_block") return "Jog";
  if (blockKey === "long_run_body_block") return "Long";
  if (blockKey === "long_run_finish_block") return "Finish";
  if (blockKey.includes("note") || blockKey.includes("mobility")) return "Cue";
  return readableToken(blockKey.replace(/_block$/, "")).split(" ")[0] ?? "Step";
}

function readableToken(value: string) {
  return value
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function blockTone(blockKey: ManualWorkoutBlockKey) {
  if (blockKey.includes("warmup") || blockKey.includes("cooldown")) return "var(--color-info)";
  if (blockKey.includes("recovery")) return "var(--color-muted-foreground)";
  if (blockKey.includes("long")) return "var(--color-signal)";
  if (
    blockKey.includes("tempo") ||
    blockKey.includes("threshold") ||
    blockKey.includes("interval") ||
    blockKey.includes("hill") ||
    blockKey.includes("strides")
  ) {
    return "var(--color-warning)";
  }
  if (blockKey.includes("note") || blockKey.includes("mobility")) {
    return "var(--color-muted-foreground)";
  }
  return "var(--color-foreground)";
}

function isNoteBlock(blockKey: ManualWorkoutBlockKey) {
  return blockKey === "drills_mobility_note_block" || blockKey === "coach_cue_note_block";
}

type ManualWorkoutQuantityMode = "duration" | "distance" | "none";

const QUANTITY_MODE_OPTIONS: Array<{ label: string; value: ManualWorkoutQuantityMode }> = [
  { label: "Duration", value: "duration" },
  { label: "Distance", value: "distance" },
  { label: "No quantity", value: "none" },
];

function quantityModeForBlock(block: ManualWorkoutBlockInput): ManualWorkoutQuantityMode {
  if (block.distanceMeters) return "distance";
  if (block.durationSeconds) return "duration";
  return "none";
}

function blockForQuantityMode(
  block: ManualWorkoutBlockInput,
  mode: string,
): ManualWorkoutBlockInput {
  if (mode === "distance") {
    return {
      ...block,
      distanceMeters: block.distanceMeters ?? 1000,
      durationSeconds: undefined,
    };
  }

  if (mode === "none") {
    return {
      ...block,
      distanceMeters: undefined,
      durationSeconds: undefined,
    };
  }

  return {
    ...block,
    distanceMeters: undefined,
    durationSeconds:
      block.durationSeconds ?? makeDefaultBlock(block.blockKey).durationSeconds ?? 600,
  };
}

function blockWithQuantityValue(
  block: ManualWorkoutBlockInput,
  mode: ManualWorkoutQuantityMode,
  value: string,
): ManualWorkoutBlockInput {
  if (mode === "distance") {
    return {
      ...block,
      distanceMeters: value === "none" ? undefined : parsePositiveInteger(value),
      durationSeconds: undefined,
    };
  }

  if (mode === "none") {
    return {
      ...block,
      distanceMeters: undefined,
      durationSeconds: undefined,
    };
  }

  return {
    ...block,
    distanceMeters: undefined,
    durationSeconds: value === "none" ? undefined : parsePositiveInteger(value),
  };
}

function durationOptionsFor(currentValue: number | undefined) {
  return optionsWithCurrentValue(DURATION_SECONDS_OPTIONS, currentValue, "No duration", (seconds) =>
    formatDurationMin(seconds / 60, "segment"),
  );
}

function distanceOptionsFor(currentValue: number | undefined) {
  return optionsWithCurrentValue(
    DISTANCE_METERS_OPTIONS,
    currentValue,
    "No distance",
    formatDistanceMeters,
  );
}

function optionsWithCurrentValue(
  baseValues: number[],
  currentValue: number | undefined,
  emptyLabel: string,
  formatValue: (value: number) => string,
) {
  const values =
    currentValue && !baseValues.includes(currentValue)
      ? [...baseValues, currentValue].sort((a, b) => a - b)
      : baseValues;

  return [
    { label: emptyLabel, value: "none" },
    ...values.map((value) => ({ label: formatValue(value), value: String(value) })),
  ];
}

function parsePositiveInteger(value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return Math.max(1, Math.round(parsed));
}

function clampInteger(value: string, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return min;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

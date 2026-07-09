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
import { InlineEditableText } from "@/components/ui/inline-editable-text";
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
import { WorkoutStructureTimeline } from "@/components/workout-structure/WorkoutStructureTimeline";
import type { ManualWorkoutTemplate } from "@/lib/manual-workout-authoring/templates";
import { formatDistanceMeters, formatDurationMin } from "@/lib/training";
import type { WorkoutGlyphKind } from "@/lib/workout-glyph";
import {
  cloneManualWorkoutEntries,
  targetTruthModeCopy,
  targetTruthModeLabel,
  templateRunnerFacingLabel,
} from "@/components/manual-workout/manual-workout-authoring-utils";
import { ManualWorkoutTargetFields } from "@/components/manual-workout/ManualWorkoutTargetFields";
import { ManualWorkoutTemplateColorIndicator } from "@/components/manual-workout/ManualWorkoutTemplateColorIndicator";
import {
  BLOCK_MENU_GROUPS,
  QUANTITY_MODE_OPTIONS,
  REPEAT_COUNT_OPTIONS,
  blockColor,
  blockForQuantityMode,
  blockKeyColor,
  blockLabel,
  blockShortLabel,
  blockSummary,
  blockWithQuantityValue,
  clampInteger,
  distanceOptionsFor,
  durationOptionsFor,
  entryDistanceMeters,
  entryDurationSeconds,
  insertEntry,
  isNoteBlock,
  makeBlockEntry,
  makeDefaultBlock,
  makeRepeatEntry,
  moveEntry,
  quantityModeForBlock,
  readableToken,
  repeatGroupSummary,
  timelineItemsForEntry,
  type ManualWorkoutQuantityMode,
} from "@/components/manual-workout/ManualWorkoutConstructorEditor.helpers";

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
              <InlineEditableText
                aria-label="Edit workout title"
                size="sm"
                value={title}
                onChange={onTitleChange}
                placeholder={selectedTemplate?.defaultTitle ?? "Name this workout"}
                variant="header"
              />
              <p className="hito-list-row-copy">
                {dateLabel} ·{" "}
                {selectedTemplate ? templateRunnerFacingLabel(selectedTemplate) : sourceLabel}
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
              Scratch starts empty. Choose the kind of run, then add the blocks you want reviewed.
            </span>
          </div>
        ) : null}
      </section>

      <ManualWorkoutDraftStructureTimeline
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
            <p className="hito-label">Workout blocks</p>
            <p className="hito-field-helper">
              Build the workout from ordered blocks. Hito checks the draft before it can be added.
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
                  {isRestDraft ? "No run blocks" : "Add workout block"}
                </p>
                <p className="hito-list-row-copy">
                  {isRestDraft
                    ? "Rest/no-run structure is represented without fake workout targets."
                    : "Choose a run type and add at least one duration or distance block before review."}
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

function ManualWorkoutDraftStructureTimeline({
  entries,
  isRestDraft,
  reviewDisabledReason,
}: {
  entries: ManualWorkoutConstructorEntryInput[];
  isRestDraft: boolean;
  reviewDisabledReason?: string | null;
}) {
  const items = entries.flatMap((entry, index) => timelineItemsForEntry(entry, index));
  const totalSeconds = entries.reduce((sum, entry) => sum + entryDurationSeconds(entry), 0);
  const totalDistanceMeters = entries.reduce((sum, entry) => sum + entryDistanceMeters(entry), 0);
  const structureParts = [
    totalSeconds > 0 ? formatDurationMin(totalSeconds / 60) : null,
    totalDistanceMeters > 0 ? formatDistanceMeters(totalDistanceMeters) : null,
    entries.length ? `${entries.length} block${entries.length === 1 ? "" : "s"}` : null,
  ].filter(Boolean);
  const meta = structureParts.length ? structureParts.join(" · ") : "0 min · 0 blocks";

  return (
    <section className="hito-manual-workout-editor-surface-muted">
      <WorkoutStructureTimeline
        ariaLabel="Workout structure preview"
        emptyState={{
          badge: isRestDraft ? "Rest" : "Empty",
          copy: isRestDraft
            ? "Rest day has no running parts."
            : "Add a step to populate the live structure preview.",
        }}
        items={items}
        summary={meta}
      />
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
            <p className="hito-form-label">Repeat set</p>
            <p className="hito-field-helper">Each round repeats the ordered blocks below.</p>
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
          style={{ background: blockColor(entry.block) }}
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
            roleLabel="Block"
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
          roleLabel="Block"
        />
        {!isNoteBlock(entry.block.blockKey) ? (
          <ManualWorkoutTargetFields
            block={entry.block}
            disabled={!editable}
            onChange={updateBlock}
            roleLabel="Block"
          />
        ) : null}
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
            style={{ color: blockColor(block) }}
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
      {!isNoteBlock(block.blockKey) ? (
        <ManualWorkoutTargetFields
          block={block}
          disabled={disabled}
          onChange={onChange}
          roleLabel={roleLabel}
        />
      ) : null}
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
            ? "Review needs duration or distance for run blocks."
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
        <span className="min-w-0 truncate">
          {selectedTemplate ? templateRunnerFacingLabel(selectedTemplate) : "Choose workout type"}
        </span>
        <Icon name="chevron-down" size="xs" className="shrink-0 text-muted-foreground" />
      </button>

      <div className="hidden md:block">
        <Select
          disabled={disabled}
          value={selectedTemplateKey ?? ""}
          onValueChange={(value) => onChange?.(value as ManualWorkoutTemplate["templateKey"])}
        >
          <SelectTrigger aria-label="Workout type">
            <SelectValue placeholder="Choose workout type" />
          </SelectTrigger>
          <SelectContent>
            {templateOptions.map((template) => (
              <SelectItem
                key={template.templateKey}
                textValue={templateRunnerFacingLabel(template)}
                value={template.templateKey}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <ManualWorkoutTemplateColorIndicator compact template={template} />
                  <span className="min-w-0 truncate">{templateRunnerFacingLabel(template)}</span>
                </span>
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
  return (
    <div className="hito-row-group">
      {templateOptions.map((template) => {
        const selected = template.templateKey === selectedTemplateKey;
        const label = templateRunnerFacingLabel(template);

        return (
          <button
            key={template.templateKey}
            type="button"
            className={`hito-list-row w-full items-center justify-start text-left ${
              selected ? "hito-list-row-signal" : ""
            }`}
            aria-label={selected ? `${label}. Current type.` : label}
            aria-pressed={selected || undefined}
            data-selected={selected || undefined}
            onClick={() => onSelect(template)}
          >
            <ManualWorkoutTemplateColorIndicator template={template} />
            <span className="min-w-0">
              <span className="hito-list-row-title block">{label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
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
            Pick the block type. Duration, distance, and labels stay editable after selection.
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
        <DropdownMenuLabel>Block actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={index === 0} onSelect={onMoveUp}>
          <Icon name="chevron-up" size="xs" />
          Move block up
        </DropdownMenuItem>
        <DropdownMenuItem disabled={index >= total - 1} onSelect={onMoveDown}>
          <Icon name="chevron-down" size="xs" />
          Move block down
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onDuplicate}>
          <Icon name="copy" size="xs" />
          Duplicate block
        </DropdownMenuItem>
        <DropdownMenuItem className="text-destructive" onSelect={onDelete}>
          <Icon name="trash" size="xs" />
          Delete block
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
        Add block
        <Icon name="chevron-down" size="xs" />
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className={`${triggerClassName} hidden md:inline-flex`}>
            <Icon name="plus" size="xs" />
            Add block
            <Icon name="chevron-down" size="xs" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={prominent ? "end" : "center"}
          className="hito-manual-workout-menu-step"
        >
          <DropdownMenuLabel>Workout blocks</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={hasRepeatGroup} onSelect={onAddRepeatGroup}>
            <span className="hito-status-pill" data-tone="warning">
              Repeat
            </span>
            Add repeat set
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
                    style={{ color: blockKeyColor(blockKey) }}
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
          <DialogTitle className="hito-modal-title">Add block</DialogTitle>
          <DialogDescription className="hito-body">
            Choose one block for this manual workout. Hito reviews the full draft before anything is
            saved.
          </DialogDescription>
        </DialogHeader>

        <div className="hito-product-dialog-body-scroll-fill grid gap-4">
          <section className="grid gap-2">
            <p className="hito-label">Repeat set</p>
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
                  <span className="hito-list-row-title block">Add repeat set</span>
                  <span className="hito-list-row-copy block">
                    Add an ordered set of blocks that repeats together.
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
                    style={{ color: blockKeyColor(blockKey) }}
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

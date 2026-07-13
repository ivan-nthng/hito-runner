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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InlineEditableText } from "@/components/ui/inline-editable-text";
import {
  type DragEvent,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
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
  type ManualWorkoutBlockInput,
  type ManualWorkoutBlockKey,
  type ManualWorkoutConstructorEntryInput,
  type ManualWorkoutRepeatGroupInput,
  type ManualWorkoutTargetTruthMode,
} from "@/lib/manual-workout-authoring/schema";
import { getManualWorkoutRepeatGroupChildren } from "@/lib/manual-workout-authoring/repeat-groups";
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
import {
  ManualWorkoutDocumentLead,
  ManualWorkoutReadbackStack,
  ManualWorkoutSectionRowHeader,
  ManualWorkoutStructurePreview,
} from "@/components/manual-workout/ManualWorkoutTrainingBlockGrammar";
import { ManualWorkoutTemplateColorIndicator } from "@/components/manual-workout/ManualWorkoutTemplateColorIndicator";
import {
  BLOCK_MENU_GROUPS,
  QUANTITY_MODE_OPTIONS,
  REPEAT_COUNT_OPTIONS,
  blockForQuantityMode,
  clampInteger,
  insertEntry,
  insertRepeatGroupChild,
  makeBlockEntry,
  makeDefaultBlock,
  makeRepeatEntry,
  manualWorkoutActiveInsertionIndex,
  manualWorkoutDragTargetIndex,
  manualWorkoutInsertionIndex,
  moveRepeatGroupChild,
  moveEntry,
  quantityModeForBlock,
  repeatGroupWithChildren,
  type ManualWorkoutDropPosition,
} from "@/components/manual-workout/ManualWorkoutConstructorEditor.helpers";
import {
  blockColor,
  blockKeyColor,
  blockLabel,
  blockShortLabel,
  blockSummary,
  entryDistanceMeters,
  entryDurationSeconds,
  isNoteBlock,
  manualConstructorEntriesToReadbackEntries,
  timelineItemsForEntry,
} from "@/components/manual-workout/ManualWorkoutTrainingBlockGrammar.model";

export type ManualWorkoutConstructorSource = "template" | "scratch" | "saved_template";

type ManualWorkoutDragState = {
  fromIndex: number;
  overIndex: number | null;
  position: ManualWorkoutDropPosition;
};

type ManualWorkoutPointerDragState = {
  fromIndex: number;
  pointerId: number;
};

type ManualWorkoutRepeatChildPointerDragState = {
  fromIndex: number;
  pointerId: number;
};

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
  readbackMode = false,
  reviewDisabledReason,
  selectedTemplateKey,
  source,
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
  readbackMode?: boolean;
  reviewDisabledReason?: string | null;
  selectedTemplateKey?: ManualWorkoutTemplate["templateKey"] | null;
  source: ManualWorkoutConstructorSource;
  targetTruthMode: ManualWorkoutTargetTruthMode;
  templateOptions: ManualWorkoutTemplate[];
  title: string;
}) {
  const editable = !entriesLocked && !readbackMode;
  const structureReadback = entriesLocked || readbackMode;
  const selectedTemplate = templateOptions.find(
    (template) => template.templateKey === selectedTemplateKey,
  );
  const hasRepeatGroup = entries.some((entry) => entry.kind === "repeat_group");
  const rowRefs = useRef<Array<HTMLElement | null>>([]);
  const pendingFocusIndexRef = useRef<number | null>(null);
  const pointerDragRef = useRef<ManualWorkoutPointerDragState | null>(null);
  const dragStateRef = useRef<ManualWorkoutDragState | null>(null);
  const [dragState, setDragState] = useState<ManualWorkoutDragState | null>(null);
  const [reorderAnnouncement, setReorderAnnouncement] = useState("");

  const updateDragState = (
    next:
      | ManualWorkoutDragState
      | null
      | ((current: ManualWorkoutDragState | null) => ManualWorkoutDragState | null),
  ) => {
    const resolved = typeof next === "function" ? next(dragStateRef.current) : next;
    dragStateRef.current = resolved;
    setDragState(resolved);
  };

  useEffect(() => {
    const pendingFocusIndex = pendingFocusIndexRef.current;
    if (pendingFocusIndex == null) return;

    pendingFocusIndexRef.current = null;
    window.requestAnimationFrame(() => {
      rowRefs.current[pendingFocusIndex]?.focus();
    });
  }, [entries]);

  const updateEntries = (nextEntries: ManualWorkoutConstructorEntryInput[]) => {
    onEntriesChange(cloneManualWorkoutEntries(nextEntries));
  };
  const addEntryAt = (insertIndex: number, entry: ManualWorkoutConstructorEntryInput) => {
    const nextIndex = Math.max(0, Math.min(insertIndex, entries.length));
    pendingFocusIndexRef.current = nextIndex;
    updateEntries(insertEntry(entries, nextIndex, entry));
    setReorderAnnouncement(`Section added at position ${nextIndex + 1}.`);
  };
  const duplicateEntryAt = (index: number) => {
    const entry = entries[index];
    if (!entry) return;
    const [entryCopy] = cloneManualWorkoutEntries([entry]);
    if (!entryCopy) return;
    addEntryAt(index + 1, entryCopy);
  };
  const deleteEntryAt = (index: number) => {
    const nextEntries = entries.filter((_, entryIndex) => entryIndex !== index);
    pendingFocusIndexRef.current = nextEntries.length
      ? Math.min(index, nextEntries.length - 1)
      : null;
    updateEntries(nextEntries);
    setReorderAnnouncement(`Section ${index + 1} deleted.`);
  };
  const moveEntryAndFocus = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || toIndex < 0 || toIndex >= entries.length) return;
    const movedEntry = entries[fromIndex];
    pendingFocusIndexRef.current = toIndex;
    updateEntries(moveEntry(entries, fromIndex, toIndex));
    setReorderAnnouncement(
      `${movedEntry ? entryLabel(movedEntry) : "Section"} moved to position ${
        toIndex + 1
      } of ${entries.length}.`,
    );
  };
  const moveEntryToInsertionAndFocus = (fromIndex: number, insertionIndex: number) => {
    const toIndex = manualWorkoutDragTargetIndex(fromIndex, insertionIndex, entries.length);
    moveEntryAndFocus(fromIndex, toIndex);
  };
  const activeInsertionIndex = dragState
    ? manualWorkoutActiveInsertionIndex({ ...dragState, total: entries.length })
    : null;
  const handleEntryDragStart = (event: DragEvent<HTMLElement>, index: number) => {
    if (!editable) return;

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
    updateDragState({ fromIndex: index, overIndex: index, position: "after" });
  };
  const handleEntryDragOver = (event: DragEvent<HTMLElement>, index: number) => {
    const currentDragState = dragStateRef.current;
    if (!currentDragState || !editable) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    autoScrollManualWorkoutEditor(event.currentTarget, event.clientY);
    const position = manualWorkoutDropPositionFromElement(event.currentTarget, event.clientY);
    if (currentDragState.overIndex !== index || currentDragState.position !== position) {
      updateDragState({ ...currentDragState, overIndex: index, position });
    }
  };
  const handleStructureDragOver = (event: DragEvent<HTMLElement>) => {
    if (!dragStateRef.current || !editable) return;
    autoScrollManualWorkoutEditor(event.currentTarget, event.clientY);
  };
  const handleEntryDrop = (event: DragEvent<HTMLElement>, index: number) => {
    if (!editable) return;

    event.preventDefault();
    const transferIndex = Number(event.dataTransfer.getData("text/plain"));
    const currentDragState = dragStateRef.current;
    const fromIndex = currentDragState?.fromIndex ?? transferIndex;
    updateDragState(null);

    if (Number.isInteger(fromIndex)) {
      const position =
        currentDragState?.overIndex === index
          ? currentDragState.position
          : manualWorkoutDropPositionFromElement(event.currentTarget, event.clientY);
      moveEntryToInsertionAndFocus(fromIndex, manualWorkoutInsertionIndex(index, position));
    }
  };
  const handleEntryPointerDown = (event: PointerEvent<HTMLElement>, index: number) => {
    if (!editable || event.button !== 0 || isManualWorkoutInteractiveDragTarget(event.target)) {
      return;
    }

    event.preventDefault();
    pointerDragRef.current = { fromIndex: index, pointerId: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.focus({ preventScroll: true });
    updateDragState({ fromIndex: index, overIndex: index, position: "after" });
  };
  const handleEntryPointerMove = (event: PointerEvent<HTMLElement>) => {
    const pointerDrag = pointerDragRef.current;
    if (!editable || !pointerDrag || pointerDrag.pointerId !== event.pointerId) return;

    event.preventDefault();
    autoScrollManualWorkoutEditor(event.currentTarget, event.clientY);
    const target = manualWorkoutEntryRowFromPoint(event.clientX, event.clientY, rowRefs.current);
    if (!target) return;

    const overIndex = manualWorkoutEntryIndexFromElement(target);
    if (overIndex === null) return;

    const position = manualWorkoutDropPositionFromElement(target, event.clientY);
    updateDragState((current) => {
      if (
        current?.fromIndex === pointerDrag.fromIndex &&
        current.overIndex === overIndex &&
        current.position === position
      ) {
        return current;
      }

      return { fromIndex: pointerDrag.fromIndex, overIndex, position };
    });
  };
  const handleEntryPointerUp = (event: PointerEvent<HTMLElement>) => {
    const pointerDrag = pointerDragRef.current;
    if (!editable || !pointerDrag || pointerDrag.pointerId !== event.pointerId) return;

    event.preventDefault();
    pointerDragRef.current = null;
    releaseManualWorkoutPointerCapture(event.currentTarget, event.pointerId);

    const currentDragState = dragStateRef.current;
    const target =
      manualWorkoutEntryRowFromPoint(event.clientX, event.clientY, rowRefs.current) ??
      (currentDragState?.overIndex != null ? rowRefs.current[currentDragState.overIndex] : null);
    const overIndex = target ? manualWorkoutEntryIndexFromElement(target) : null;
    const position = target
      ? manualWorkoutDropPositionFromElement(target, event.clientY)
      : currentDragState?.position;
    updateDragState(null);

    if (overIndex !== null && position) {
      moveEntryToInsertionAndFocus(
        pointerDrag.fromIndex,
        manualWorkoutInsertionIndex(overIndex, position),
      );
    }
  };
  const clearDragState = (event?: DragEvent<HTMLElement> | PointerEvent<HTMLElement>) => {
    const pointerDrag = pointerDragRef.current;
    if (event && "pointerId" in event && pointerDrag?.pointerId === event.pointerId) {
      pointerDragRef.current = null;
      releaseManualWorkoutPointerCapture(event.currentTarget, event.pointerId);
    }
    if (!event) {
      pointerDragRef.current = null;
    }
    updateDragState(null);
  };

  return (
    <div className="hito-manual-workout-editor">
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {reorderAnnouncement}
      </p>
      <ManualWorkoutDocumentLead
        ariaLabel={`${dateLabel} workout`}
        icon={
          <span style={{ color: iconTone }}>
            <WorkoutGlyph kind={iconKey} className="h-4 w-4" />
          </span>
        }
        title={
          <div>
            <InlineEditableText
              aria-label="Edit workout title"
              className="hito-manual-workout-title-control"
              readOnly={readbackMode}
              size="sm"
              value={title}
              onChange={onTitleChange}
              placeholder={selectedTemplate?.defaultTitle ?? "Name this workout"}
              variant="header"
            />
          </div>
        }
      >
        {source === "scratch" ? (
          <div className="hito-manual-workout-type-row">
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
      </ManualWorkoutDocumentLead>

      <ManualWorkoutDraftStructureTimeline
        entries={entries}
        isRestDraft={isRestDraft}
        reviewDisabledReason={reviewDisabledReason}
      />

      <section
        className="hito-manual-workout-structure-editor"
        data-drag-active={dragState ? "true" : undefined}
        onDragOver={handleStructureDragOver}
      >
        {editable && !isRestDraft ? (
          <ManualAddStepMenu
            prominent
            hasRepeatGroup={hasRepeatGroup}
            insertionActive={activeInsertionIndex === 0}
            onAddBlock={(blockKey) => addEntryAt(0, makeBlockEntry(blockKey))}
            onAddRepeatGroup={() => addEntryAt(0, makeRepeatEntry())}
          />
        ) : null}

        {entries.length ? (
          <div className="hito-manual-workout-entry-stack">
            {structureReadback ? (
              <ManualWorkoutReadbackRows entries={entries} />
            ) : (
              entries.map((entry, index) => (
                <div key={`${entry.kind}-${index}`}>
                  <ManualWorkoutEntryRow
                    dragState={dragState}
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
                    onAddBlockAfter={(blockKey) => addEntryAt(index + 1, makeBlockEntry(blockKey))}
                    onAddBlockBefore={(blockKey) => addEntryAt(index, makeBlockEntry(blockKey))}
                    onAddRepeatAfter={() => addEntryAt(index + 1, makeRepeatEntry())}
                    onAddRepeatBefore={() => addEntryAt(index, makeRepeatEntry())}
                    onDelete={() => deleteEntryAt(index)}
                    onDragEnd={clearDragState}
                    onDragOver={(event) => handleEntryDragOver(event, index)}
                    onDragStart={(event) => handleEntryDragStart(event, index)}
                    onDrop={(event) => handleEntryDrop(event, index)}
                    onPointerCancel={clearDragState}
                    onPointerDown={(event) => handleEntryPointerDown(event, index)}
                    onPointerMove={handleEntryPointerMove}
                    onPointerUp={handleEntryPointerUp}
                    onDuplicate={() => duplicateEntryAt(index)}
                    onMoveDown={() => moveEntryAndFocus(index, index + 1)}
                    onMoveUp={() => moveEntryAndFocus(index, index - 1)}
                    onReorderAnnouncement={setReorderAnnouncement}
                    rowRef={(node) => {
                      rowRefs.current[index] = node;
                    }}
                    hasRepeatGroup={hasRepeatGroup}
                    total={entries.length}
                  />
                  {editable ? (
                    <ManualAddStepMenu
                      hasRepeatGroup={hasRepeatGroup}
                      insertionActive={activeInsertionIndex === index + 1}
                      onAddBlock={(blockKey) => addEntryAt(index + 1, makeBlockEntry(blockKey))}
                      onAddRepeatGroup={() => addEntryAt(index + 1, makeRepeatEntry())}
                      placement="between"
                    />
                  ) : null}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="hito-list-row items-start">
            <span className="hito-status-pill mt-0.5 shrink-0" data-tone="muted">
              {isRestDraft ? "Rest" : "Empty"}
            </span>
            <div className="min-w-0">
              <p className="hito-list-row-title">
                {isRestDraft ? "No run blocks" : "Add workout section"}
              </p>
              <p className="hito-list-row-copy">
                {isRestDraft
                  ? "Rest/no-run structure is represented without fake workout targets."
                  : "Choose a run type and add at least one duration or distance block before review."}
              </p>
            </div>
          </div>
        )}

        {entriesLocked ? (
          <p className="hito-field-helper">
            Saved template structure is rebuilt for review; title and notes can still be adjusted.
          </p>
        ) : null}
      </section>

      <label className="grid gap-2">
        <span className="hito-form-label">Notes or cues</span>
        <textarea
          className="hito-field hito-field-primary hito-textarea-md resize-none"
          readOnly={readbackMode}
          rows={3}
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          placeholder="Optional note for this manual workout."
        />
      </label>

      <ManualTargetGuidanceSection
        allowedTargetTruthModes={allowedTargetTruthModes}
        onTargetTruthModeChange={readbackMode ? undefined : onTargetTruthModeChange}
        targetTruthMode={targetTruthMode}
      />
    </div>
  );
}

function ManualWorkoutReadbackRows({ entries }: { entries: ManualWorkoutConstructorEntryInput[] }) {
  return (
    <ManualWorkoutReadbackStack entries={manualConstructorEntriesToReadbackEntries(entries)} />
  );
}

function ManualWorkoutInsertionSlot({ active }: { active: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="hito-manual-workout-insertion-slot"
      data-insertion-active={active || undefined}
    />
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
    <ManualWorkoutStructurePreview
      emptyState={{
        badge: isRestDraft ? "Rest" : "Empty",
        copy: isRestDraft
          ? "Rest day has no running parts."
          : "Add a step to populate the live structure preview.",
      }}
      helper={reviewDisabledReason}
      items={items}
      summary={meta}
    />
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
  dragState,
  editable,
  entry,
  hasRepeatGroup,
  index,
  onAddBlockAfter,
  onAddBlockBefore,
  onAddRepeatAfter,
  onAddRepeatBefore,
  onChange,
  onDelete,
  onDragEnd,
  onDragOver,
  onDragStart,
  onDrop,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onDuplicate,
  onMoveDown,
  onMoveUp,
  onReorderAnnouncement,
  rowRef,
  total,
}: {
  dragState: ManualWorkoutDragState | null;
  editable: boolean;
  entry: ManualWorkoutConstructorEntryInput;
  hasRepeatGroup: boolean;
  index: number;
  onAddBlockAfter: (blockKey: ManualWorkoutBlockKey) => void;
  onAddBlockBefore: (blockKey: ManualWorkoutBlockKey) => void;
  onAddRepeatAfter: () => void;
  onAddRepeatBefore: () => void;
  onChange: (entry: ManualWorkoutConstructorEntryInput) => void;
  onDelete: () => void;
  onDragEnd: () => void;
  onDragOver: (event: DragEvent<HTMLElement>) => void;
  onDragStart: (event: DragEvent<HTMLElement>) => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
  onPointerCancel: (event: PointerEvent<HTMLElement>) => void;
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLElement>) => void;
  onDuplicate: () => void;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onReorderAnnouncement: (message: string) => void;
  rowRef: (node: HTMLElement | null) => void;
  total: number;
}) {
  const ordinal = String(index + 1).padStart(2, "0");
  const rowLabel = entryLabel(entry);
  const dragging = dragState?.fromIndex === index;
  const repeatChildRefs = useRef<Array<HTMLElement | null>>([]);
  const pendingRepeatChildFocusIndexRef = useRef<number | null>(null);
  const repeatChildPointerDragRef = useRef<ManualWorkoutRepeatChildPointerDragState | null>(null);
  const repeatChildDragStateRef = useRef<ManualWorkoutDragState | null>(null);
  const [repeatChildDragState, setRepeatChildDragState] = useState<ManualWorkoutDragState | null>(
    null,
  );

  const updateRepeatChildDragState = (
    next:
      | ManualWorkoutDragState
      | null
      | ((current: ManualWorkoutDragState | null) => ManualWorkoutDragState | null),
  ) => {
    const resolved = typeof next === "function" ? next(repeatChildDragStateRef.current) : next;
    repeatChildDragStateRef.current = resolved;
    setRepeatChildDragState(resolved);
  };

  useEffect(() => {
    if (entry.kind !== "repeat_group") {
      pendingRepeatChildFocusIndexRef.current = null;
      return;
    }

    const pendingFocusIndex = pendingRepeatChildFocusIndexRef.current;
    if (pendingFocusIndex == null) return;

    pendingRepeatChildFocusIndexRef.current = null;
    window.requestAnimationFrame(() => {
      repeatChildRefs.current[pendingFocusIndex]?.focus();
    });
  }, [entry]);

  const rowProps = {
    "aria-label": `${rowLabel} section`,
    "data-dragging": dragging || undefined,
    "data-manual-workout-entry-index": index,
    draggable: editable,
    onDragEnd,
    onDragOver,
    onDragStart,
    onDrop,
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      if (!editable || event.target !== event.currentTarget) return;
      if (event.key === "ArrowUp") {
        event.preventDefault();
        onMoveUp();
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        onMoveDown();
      }
    },
    onPointerCancel,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    ref: rowRef,
    tabIndex: editable ? 0 : -1,
  };

  if (entry.kind === "repeat_group") {
    const updateGroup = (group: ManualWorkoutRepeatGroupInput) =>
      onChange({
        kind: "repeat_group",
        group,
      });
    const repeatChildren = getManualWorkoutRepeatGroupChildren(entry.group);
    const updateRepeatChildren = (children: ManualWorkoutBlockInput[]) => {
      updateGroup(repeatGroupWithChildren(entry.group, children));
    };
    const addRepeatChildAt = (insertIndex: number, blockKey: ManualWorkoutBlockKey) => {
      const nextIndex = Math.max(0, Math.min(insertIndex, repeatChildren.length));
      pendingRepeatChildFocusIndexRef.current = nextIndex;
      updateGroup(insertRepeatGroupChild(entry.group, nextIndex, makeDefaultBlock(blockKey)));
      onReorderAnnouncement(`Repeated section added at position ${nextIndex + 1}.`);
    };
    const deleteRepeatChildAt = (childIndex: number) => {
      if (repeatChildren.length <= 1) return;

      const nextChildren = repeatChildren.filter((_, index) => index !== childIndex);
      pendingRepeatChildFocusIndexRef.current = nextChildren.length
        ? Math.min(childIndex, nextChildren.length - 1)
        : null;
      updateRepeatChildren(nextChildren);
      onReorderAnnouncement(`Repeated section ${childIndex + 1} deleted.`);
    };
    const duplicateRepeatChildAt = (childIndex: number) => {
      const child = repeatChildren[childIndex];
      if (!child) return;

      const nextChildren = [...repeatChildren];
      nextChildren.splice(childIndex + 1, 0, {
        ...child,
        target: child.target ? { ...child.target } : undefined,
      });
      pendingRepeatChildFocusIndexRef.current = childIndex + 1;
      updateRepeatChildren(nextChildren);
      onReorderAnnouncement(`Repeated section duplicated at position ${childIndex + 2}.`);
    };
    const moveRepeatChildAndFocus = (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex || toIndex < 0 || toIndex >= repeatChildren.length) return;
      pendingRepeatChildFocusIndexRef.current = toIndex;
      updateGroup(moveRepeatGroupChild(entry.group, fromIndex, toIndex));
      onReorderAnnouncement(
        `Repeated section moved to position ${toIndex + 1} of ${repeatChildren.length}.`,
      );
    };
    const moveRepeatChildToInsertionAndFocus = (fromIndex: number, insertionIndex: number) => {
      const toIndex = manualWorkoutDragTargetIndex(
        fromIndex,
        insertionIndex,
        repeatChildren.length,
      );
      moveRepeatChildAndFocus(fromIndex, toIndex);
    };
    const activeRepeatChildInsertionIndex = repeatChildDragState
      ? manualWorkoutActiveInsertionIndex({
          ...repeatChildDragState,
          total: repeatChildren.length,
        })
      : null;
    const handleRepeatChildDragStart = (event: DragEvent<HTMLElement>, childIndex: number) => {
      if (!editable) return;

      event.stopPropagation();
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(childIndex));
      updateRepeatChildDragState({
        fromIndex: childIndex,
        overIndex: childIndex,
        position: "after",
      });
    };
    const handleRepeatChildDragOver = (event: DragEvent<HTMLElement>, childIndex: number) => {
      const currentDragState = repeatChildDragStateRef.current;
      if (!currentDragState || !editable) return;

      event.preventDefault();
      event.stopPropagation();
      event.dataTransfer.dropEffect = "move";
      autoScrollManualWorkoutEditor(event.currentTarget, event.clientY);
      const position = manualWorkoutDropPositionFromElement(event.currentTarget, event.clientY);
      if (currentDragState.overIndex !== childIndex || currentDragState.position !== position) {
        updateRepeatChildDragState({
          ...currentDragState,
          overIndex: childIndex,
          position,
        });
      }
    };
    const handleRepeatChildDrop = (event: DragEvent<HTMLElement>, childIndex: number) => {
      if (!editable) return;

      event.preventDefault();
      event.stopPropagation();
      const transferIndex = Number(event.dataTransfer.getData("text/plain"));
      const currentDragState = repeatChildDragStateRef.current;
      const fromIndex = currentDragState?.fromIndex ?? transferIndex;
      updateRepeatChildDragState(null);

      if (Number.isInteger(fromIndex)) {
        const position =
          currentDragState?.overIndex === childIndex
            ? currentDragState.position
            : manualWorkoutDropPositionFromElement(event.currentTarget, event.clientY);
        moveRepeatChildToInsertionAndFocus(
          fromIndex,
          manualWorkoutInsertionIndex(childIndex, position),
        );
      }
    };
    const handleRepeatChildPointerDown = (event: PointerEvent<HTMLElement>, childIndex: number) => {
      if (!editable || event.button !== 0 || isManualWorkoutInteractiveDragTarget(event.target)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      repeatChildPointerDragRef.current = { fromIndex: childIndex, pointerId: event.pointerId };
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.focus({ preventScroll: true });
      updateRepeatChildDragState({
        fromIndex: childIndex,
        overIndex: childIndex,
        position: "after",
      });
    };
    const handleRepeatChildPointerMove = (event: PointerEvent<HTMLElement>) => {
      const pointerDrag = repeatChildPointerDragRef.current;
      if (!editable || !pointerDrag || pointerDrag.pointerId !== event.pointerId) return;

      event.preventDefault();
      event.stopPropagation();
      autoScrollManualWorkoutEditor(event.currentTarget, event.clientY);
      const target = manualWorkoutRepeatChildRowFromPoint(
        event.clientX,
        event.clientY,
        repeatChildRefs.current,
      );
      if (!target) return;

      const overIndex = manualWorkoutRepeatChildIndexFromElement(target);
      if (overIndex === null) return;

      const position = manualWorkoutDropPositionFromElement(target, event.clientY);
      updateRepeatChildDragState((current) => {
        if (
          current?.fromIndex === pointerDrag.fromIndex &&
          current.overIndex === overIndex &&
          current.position === position
        ) {
          return current;
        }

        return { fromIndex: pointerDrag.fromIndex, overIndex, position };
      });
    };
    const handleRepeatChildPointerUp = (event: PointerEvent<HTMLElement>) => {
      const pointerDrag = repeatChildPointerDragRef.current;
      if (!editable || !pointerDrag || pointerDrag.pointerId !== event.pointerId) return;

      event.preventDefault();
      event.stopPropagation();
      repeatChildPointerDragRef.current = null;
      releaseManualWorkoutPointerCapture(event.currentTarget, event.pointerId);

      const currentDragState = repeatChildDragStateRef.current;
      const target =
        manualWorkoutRepeatChildRowFromPoint(
          event.clientX,
          event.clientY,
          repeatChildRefs.current,
        ) ??
        (currentDragState?.overIndex != null
          ? repeatChildRefs.current[currentDragState.overIndex]
          : null);
      const overIndex = target ? manualWorkoutRepeatChildIndexFromElement(target) : null;
      const position = target
        ? manualWorkoutDropPositionFromElement(target, event.clientY)
        : currentDragState?.position;
      updateRepeatChildDragState(null);

      if (overIndex !== null && position) {
        moveRepeatChildToInsertionAndFocus(
          pointerDrag.fromIndex,
          manualWorkoutInsertionIndex(overIndex, position),
        );
      }
    };
    const clearRepeatChildDragState = (
      event?: DragEvent<HTMLElement> | PointerEvent<HTMLElement>,
    ) => {
      const pointerDrag = repeatChildPointerDragRef.current;
      if (event && "pointerId" in event && pointerDrag?.pointerId === event.pointerId) {
        repeatChildPointerDragRef.current = null;
        releaseManualWorkoutPointerCapture(event.currentTarget, event.pointerId);
      }
      if (!event) {
        repeatChildPointerDragRef.current = null;
      }
      updateRepeatChildDragState(null);
    };

    return (
      <article
        {...rowProps}
        className="group/step hito-manual-workout-step-card hito-manual-workout-repeat-card hito-manual-workout-entry-row"
      >
        <div className="hito-manual-workout-step-overlay">
          <div className="hito-manual-workout-repeat-header">
            <div className="hito-manual-workout-repeat-header-controls">
              <span className="hito-form-label">Repeats</span>
              <ManualRepeatCountField
                disabled={!editable}
                group={entry.group}
                onChange={updateGroup}
              />
            </div>
            <EntryRowActions
              disabled={!editable}
              hasRepeatGroup={hasRepeatGroup}
              index={index}
              onAddBlockAfter={onAddBlockAfter}
              onAddBlockBefore={onAddBlockBefore}
              onAddRepeatAfter={onAddRepeatAfter}
              onAddRepeatBefore={onAddRepeatBefore}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onMoveDown={onMoveDown}
              onMoveUp={onMoveUp}
              stepLabel="repeat step"
              total={total}
            />
          </div>

          <div
            className="hito-manual-workout-step-fields hito-manual-workout-repeat-stack"
            data-drag-active={repeatChildDragState ? "true" : undefined}
          >
            <div className="hito-manual-workout-repeat-child-stack">
              <ManualWorkoutInsertionSlot active={activeRepeatChildInsertionIndex === 0} />
              {repeatChildren.map((block, childIndex) => (
                <div key={`${childIndex}-${block.blockKey}-${block.label ?? ""}`}>
                  <ManualBlockPartFields
                    block={block}
                    childDragState={repeatChildDragState}
                    childIndex={childIndex}
                    disabled={!editable}
                    onAddBlockAfter={(blockKey) => addRepeatChildAt(childIndex + 1, blockKey)}
                    onAddBlockBefore={(blockKey) => addRepeatChildAt(childIndex, blockKey)}
                    onChange={(nextBlock) =>
                      updateRepeatChildren(
                        repeatChildren.map((child, index) =>
                          index === childIndex ? nextBlock : child,
                        ),
                      )
                    }
                    onDelete={() => deleteRepeatChildAt(childIndex)}
                    onDragEnd={clearRepeatChildDragState}
                    onDragOver={(event) => handleRepeatChildDragOver(event, childIndex)}
                    onDragStart={(event) => handleRepeatChildDragStart(event, childIndex)}
                    onDrop={(event) => handleRepeatChildDrop(event, childIndex)}
                    onDuplicate={() => duplicateRepeatChildAt(childIndex)}
                    onMoveDown={() => moveRepeatChildAndFocus(childIndex, childIndex + 1)}
                    onMoveUp={() => moveRepeatChildAndFocus(childIndex, childIndex - 1)}
                    onPointerCancel={clearRepeatChildDragState}
                    onPointerDown={(event) => handleRepeatChildPointerDown(event, childIndex)}
                    onPointerMove={handleRepeatChildPointerMove}
                    onPointerUp={handleRepeatChildPointerUp}
                    ordinal={`${ordinal}.${childIndex + 1}`}
                    roleLabel="Section"
                    rowRef={(node) => {
                      repeatChildRefs.current[childIndex] = node;
                    }}
                    total={repeatChildren.length}
                  />
                  {editable ? (
                    <ManualAddStepMenu
                      allowRepeatGroup={false}
                      hasRepeatGroup={hasRepeatGroup}
                      includeNoteBlocks={false}
                      insertionActive={activeRepeatChildInsertionIndex === childIndex + 1}
                      onAddBlock={(blockKey) => addRepeatChildAt(childIndex + 1, blockKey)}
                      placement={
                        childIndex === repeatChildren.length - 1 ? "repeat-bottom" : "repeat-child"
                      }
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </article>
    );
  }

  const updateBlock = (block: ManualWorkoutBlockInput) => onChange({ kind: "block", block });

  return (
    <article
      {...rowProps}
      className="group/step hito-manual-workout-step-card hito-manual-workout-entry-row"
    >
      <div className="hito-manual-workout-step-overlay">
        <ManualWorkoutSectionRowHeader
          actions={
            <EntryRowActions
              disabled={!editable}
              hasRepeatGroup={hasRepeatGroup}
              index={index}
              onAddBlockAfter={onAddBlockAfter}
              onAddBlockBefore={onAddBlockBefore}
              onAddRepeatAfter={onAddRepeatAfter}
              onAddRepeatBefore={onAddRepeatBefore}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onMoveDown={onMoveDown}
              onMoveUp={onMoveUp}
              stepLabel={entry.block.label ?? blockLabel(entry.block.blockKey)}
              total={total}
            />
          }
          markerColor={blockColor(entry.block)}
          ordinal={ordinal}
          summary={blockSummary(entry.block)}
          typeControl={
            <ManualBlockTypePicker
              disabled={!editable}
              label="Block type"
              onChange={(blockKey) => updateBlock(makeDefaultBlock(blockKey))}
              value={entry.block.blockKey}
              variant="inline"
            />
          }
        />
        <div className="hito-manual-workout-step-fields hito-manual-workout-block-fields">
          <ManualBlockIdentityFields
            block={entry.block}
            disabled={!editable}
            onChange={updateBlock}
            roleLabel="Section"
          />
          <ManualBlockQuantityFields
            block={entry.block}
            disabled={!editable}
            onChange={updateBlock}
            roleLabel="Section"
          />
          {!isNoteBlock(entry.block.blockKey) ? (
            <ManualWorkoutTargetFields
              block={entry.block}
              disabled={!editable}
              onChange={updateBlock}
              roleLabel="Section"
            />
          ) : null}
        </div>
      </div>
    </article>
  );
}

function ManualRepeatCountField({
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
      <div className="hito-manual-workout-repeat-count-field">
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
            aria-label="Repeat count"
            className="hito-field hito-field-secondary hito-field-sm hito-manual-workout-repeat-count-trigger"
          >
            <SelectValue placeholder="Count" />
          </SelectTrigger>
          <SelectContent>
            {REPEAT_COUNT_OPTIONS.map((count) => (
              <SelectItem key={count} value={String(count)}>
                {count}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function ManualBlockPartFields({
  block,
  childDragState,
  childIndex,
  disabled,
  onAddBlockAfter,
  onAddBlockBefore,
  onChange,
  onDelete,
  onDragEnd,
  onDragOver,
  onDragStart,
  onDrop,
  onDuplicate,
  onMoveDown,
  onMoveUp,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  ordinal,
  roleLabel,
  rowRef,
  total,
}: {
  block: ManualWorkoutBlockInput;
  childDragState: ManualWorkoutDragState | null;
  childIndex: number;
  disabled: boolean;
  onAddBlockAfter: (blockKey: ManualWorkoutBlockKey) => void;
  onAddBlockBefore: (blockKey: ManualWorkoutBlockKey) => void;
  onChange: (block: ManualWorkoutBlockInput) => void;
  onDelete: () => void;
  onDragEnd: (event: DragEvent<HTMLElement>) => void;
  onDragOver: (event: DragEvent<HTMLElement>) => void;
  onDragStart: (event: DragEvent<HTMLElement>) => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
  onDuplicate: () => void;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onPointerCancel: (event: PointerEvent<HTMLElement>) => void;
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLElement>) => void;
  ordinal: string;
  roleLabel: string;
  rowRef: (node: HTMLElement | null) => void;
  total: number;
}) {
  const dragging = childDragState?.fromIndex === childIndex;

  return (
    <section
      aria-label={`${block.label ?? blockLabel(block.blockKey)} repeat child`}
      className="group/repeat-child hito-manual-workout-repeat-child hito-manual-workout-repeat-child-row"
      data-dragging={dragging || undefined}
      data-manual-workout-repeat-child-index={childIndex}
      draggable={!disabled}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragStart={onDragStart}
      onDrop={onDrop}
      onKeyDown={(event) => {
        if (disabled || event.target !== event.currentTarget) return;
        if (event.key === "ArrowUp") {
          event.preventDefault();
          onMoveUp();
        }
        if (event.key === "ArrowDown") {
          event.preventDefault();
          onMoveDown();
        }
      }}
      onPointerCancel={onPointerCancel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      ref={rowRef}
      tabIndex={disabled ? -1 : 0}
    >
      <ManualWorkoutSectionRowHeader
        actions={
          <RepeatChildRowActions
            disabled={disabled}
            index={childIndex}
            onAddBlockAfter={onAddBlockAfter}
            onAddBlockBefore={onAddBlockBefore}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onMoveDown={onMoveDown}
            onMoveUp={onMoveUp}
            stepLabel={block.label ?? blockLabel(block.blockKey)}
            total={total}
          />
        }
        markerColor={blockColor(block)}
        ordinal={ordinal}
        summary={blockSummary(block)}
        typeControl={
          <ManualBlockTypePicker
            disabled={disabled}
            includeNoteBlocks={false}
            label={`${roleLabel} type`}
            onChange={(blockKey) => onChange(makeDefaultBlock(blockKey))}
            value={block.blockKey}
            variant="inline"
          />
        }
      />
      <div className="hito-manual-workout-step-fields hito-manual-workout-block-fields">
        <ManualBlockIdentityFields
          block={block}
          disabled={disabled}
          onChange={onChange}
          roleLabel={roleLabel}
        />
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
    </section>
  );
}

function ManualBlockIdentityFields({
  block,
  disabled,
  onChange,
}: {
  block: ManualWorkoutBlockInput;
  disabled: boolean;
  onChange: (block: ManualWorkoutBlockInput) => void;
  roleLabel: string;
}) {
  return (
    <label className="hito-manual-workout-label-field grid gap-2">
      <span className="hito-form-label">Visible label</span>
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
    <div className="hito-manual-workout-compact-field-grid">
      <PickerField label="Duration">
        <Select
          disabled={disabled}
          value={quantityMode}
          onValueChange={(mode) => onChange(blockForQuantityMode(block, mode))}
        >
          <SelectTrigger
            aria-label={`${roleLabel} duration mode`}
            className="hito-field hito-field-secondary hito-field-sm"
          >
            <SelectValue placeholder="Duration" />
          </SelectTrigger>
          <SelectContent>
            {QUANTITY_MODE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PickerField>
      {quantityMode === "duration" ? (
        <ManualDurationPartsInput
          block={block}
          disabled={disabled}
          onChange={onChange}
          roleLabel={roleLabel}
        />
      ) : null}
      {quantityMode === "distance" ? (
        <ManualDistancePartsInput
          block={block}
          disabled={disabled}
          onChange={onChange}
          roleLabel={roleLabel}
        />
      ) : null}
    </div>
  );
}

function ManualDurationPartsInput({
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
  const totalSeconds = block.durationSeconds ?? 0;
  const minutesValue = Math.floor(totalSeconds / 60);
  const secondsValue = totalSeconds % 60;

  const commitDuration = (nextMinutes: number, nextSeconds: number) => {
    const nextTotalSeconds = nextMinutes * 60 + nextSeconds;
    onChange({
      ...block,
      distanceMeters: undefined,
      durationSeconds: nextTotalSeconds > 0 ? nextTotalSeconds : undefined,
    });
  };

  return (
    <div className="hito-manual-workout-compound-field">
      <span className="sr-only">{roleLabel} duration</span>
      <div className="hito-manual-workout-compound-inputs">
        <PickerField label="Minutes">
          <Select
            disabled={disabled}
            value={String(minutesValue)}
            onValueChange={(value) => commitDuration(Number(value), secondsValue)}
          >
            <SelectTrigger
              aria-label={`${roleLabel} duration minutes`}
              className="hito-field hito-field-secondary hito-field-sm hito-manual-workout-unit-select"
            >
              <SelectValue placeholder="Minutes" />
            </SelectTrigger>
            <SelectContent>
              {durationMinuteOptions(minutesValue).map((minutes) => (
                <SelectItem key={minutes} value={String(minutes)}>
                  {minutes} min
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PickerField>
        <PickerField label="Seconds">
          <Select
            disabled={disabled}
            value={String(secondsValue)}
            onValueChange={(value) => commitDuration(minutesValue, Number(value))}
          >
            <SelectTrigger
              aria-label={`${roleLabel} duration seconds`}
              className="hito-field hito-field-secondary hito-field-sm hito-manual-workout-unit-select"
            >
              <SelectValue placeholder="Seconds" />
            </SelectTrigger>
            <SelectContent>
              {durationSecondOptions(secondsValue).map((seconds) => (
                <SelectItem key={seconds} value={String(seconds)}>
                  {seconds} sec
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PickerField>
      </div>
    </div>
  );
}

function durationMinuteOptions(currentMinutes: number) {
  return withCurrentNumericOption(
    [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 35, 40, 45, 50, 60, 75, 90],
    currentMinutes,
  );
}

function durationSecondOptions(currentSeconds: number) {
  return withCurrentNumericOption([0, 15, 30, 45], currentSeconds);
}

function withCurrentNumericOption(baseValues: number[], currentValue: number) {
  return baseValues.includes(currentValue)
    ? baseValues
    : [...baseValues, currentValue].sort((a, b) => a - b);
}

function ManualDistancePartsInput({
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
  const totalMeters = block.distanceMeters ?? 0;
  const [kilometersDraft, setKilometersDraft] = useState(String(Math.floor(totalMeters / 1000)));
  const [metersDraft, setMetersDraft] = useState(String(totalMeters % 1000));

  useEffect(() => {
    setKilometersDraft(String(Math.floor(totalMeters / 1000)));
    setMetersDraft(String(totalMeters % 1000));
  }, [totalMeters]);

  const metersValue = parseWholeNumberDraft(metersDraft, 0);
  const metersInvalid = metersValue == null || metersValue > 999;

  const commitDistance = (nextKilometersDraft: string, nextMetersDraft: string) => {
    const kilometersValue = parseWholeNumberDraft(nextKilometersDraft, 0);
    const metersValue = parseWholeNumberDraft(nextMetersDraft, 0);
    if (kilometersValue == null || metersValue == null || metersValue > 999) return;

    const nextTotalMeters = kilometersValue * 1000 + metersValue;
    onChange({
      ...block,
      distanceMeters: nextTotalMeters > 0 ? nextTotalMeters : undefined,
      durationSeconds: undefined,
    });
  };

  return (
    <div className="hito-manual-workout-compound-field">
      <span className="sr-only">{roleLabel} distance</span>
      <div className="hito-manual-workout-compound-inputs">
        <label className="hito-manual-workout-unit-field">
          <span className="hito-form-label">km</span>
          <input
            className="hito-field hito-field-secondary hito-field-sm hito-manual-workout-unit-input"
            disabled={disabled}
            inputMode="numeric"
            min={0}
            onChange={(event) => {
              const nextValue = event.target.value;
              setKilometersDraft(nextValue);
              commitDistance(nextValue, metersDraft);
            }}
            type="number"
            value={kilometersDraft}
          />
        </label>
        <label className="hito-manual-workout-unit-field">
          <span className="hito-form-label">m</span>
          <input
            aria-invalid={metersInvalid || undefined}
            className="hito-field hito-field-secondary hito-field-sm hito-manual-workout-unit-input"
            disabled={disabled}
            inputMode="numeric"
            max={999}
            min={0}
            onChange={(event) => {
              const nextValue = event.target.value;
              setMetersDraft(nextValue);
              commitDistance(kilometersDraft, nextValue);
            }}
            type="number"
            value={metersDraft}
          />
        </label>
      </div>
      {metersInvalid ? <span className="hito-field-error">Meters must be 0-999.</span> : null}
    </div>
  );
}

function parseWholeNumberDraft(value: string, fallback: number) {
  const trimmedValue = value.trim();
  if (!trimmedValue) return fallback;
  const numericValue = Number(trimmedValue);
  return Number.isInteger(numericValue) && numericValue >= 0 ? numericValue : null;
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
  includeNoteBlocks = true,
  label,
  onChange,
  value,
  variant = "field",
}: {
  disabled: boolean;
  includeNoteBlocks?: boolean;
  label: string;
  onChange: (blockKey: ManualWorkoutBlockKey) => void;
  value: ManualWorkoutBlockKey;
  variant?: "field" | "inline";
}) {
  const [mobilePickerOpen, setMobilePickerOpen] = useState(false);
  const mobileTriggerClassName =
    variant === "inline"
      ? "hito-field hito-field-secondary hito-field-xs hito-manual-workout-type-trigger"
      : "hito-field hito-field-secondary hito-field-sm flex w-full items-center justify-between gap-3 text-left";
  const desktopTriggerClassName =
    variant === "inline"
      ? "hito-field hito-field-secondary hito-field-xs hito-manual-workout-type-trigger"
      : "hito-field hito-field-secondary hito-field-sm";

  const selectBlock = (blockKey: ManualWorkoutBlockKey) => {
    setMobilePickerOpen(false);
    onChange(blockKey);
  };

  if (variant === "inline" && disabled) {
    return (
      <span className={mobileTriggerClassName} aria-label={`${label}: ${blockLabel(value)}`}>
        <span className="min-w-0 truncate">{blockLabel(value)}</span>
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        className={`${mobileTriggerClassName} md:hidden`}
        disabled={disabled}
        aria-label={label}
        onClick={() => setMobilePickerOpen(true)}
      >
        <span className="min-w-0 truncate">{blockLabel(value)}</span>
        {disabled ? null : (
          <Icon name="chevron-down" size="xs" className="shrink-0 text-muted-foreground" />
        )}
      </button>

      <div className="hidden md:block">
        <Select
          disabled={disabled}
          value={value}
          onValueChange={(nextValue) => onChange(nextValue as ManualWorkoutBlockKey)}
        >
          <SelectTrigger aria-label={label} className={desktopTriggerClassName}>
            <SelectValue placeholder={label} />
          </SelectTrigger>
          <SelectContent>
            {BLOCK_MENU_GROUPS.map((group) => (
              <SelectGroupForBlocks
                key={group.label}
                group={group}
                includeNoteBlocks={includeNoteBlocks}
              />
            ))}
          </SelectContent>
        </Select>
      </div>

      <ManualBlockTypePickerDialog
        includeNoteBlocks={includeNoteBlocks}
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
  includeNoteBlocks = true,
  label,
  onOpenChange,
  onSelect,
  open,
  value,
}: {
  includeNoteBlocks?: boolean;
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
          <ManualBlockChoiceRows
            currentBlockKey={value}
            includeNoteBlocks={includeNoteBlocks}
            onSelect={onSelect}
            showCurrent
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

function SelectGroupForBlocks({
  group,
  includeNoteBlocks = true,
}: {
  group: { label: string; items: ManualWorkoutBlockKey[] };
  includeNoteBlocks?: boolean;
}) {
  const items = filterBlockMenuItems(group.items, includeNoteBlocks);
  if (items.length === 0) return null;

  return (
    <>
      <SelectGroup>
        <SelectLabel>{group.label}</SelectLabel>
        {items.map((blockKey) => (
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
  hasRepeatGroup,
  index,
  onAddBlockAfter,
  onAddBlockBefore,
  onAddRepeatAfter,
  onAddRepeatBefore,
  onDelete,
  onDuplicate,
  onMoveDown,
  onMoveUp,
  stepLabel,
  total,
}: {
  disabled: boolean;
  hasRepeatGroup: boolean;
  index: number;
  onAddBlockAfter: (blockKey: ManualWorkoutBlockKey) => void;
  onAddBlockBefore: (blockKey: ManualWorkoutBlockKey) => void;
  onAddRepeatAfter: () => void;
  onAddRepeatBefore: () => void;
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
          className="hito-button hito-button-ghost hito-button-sm hito-manual-workout-row-action-button aspect-square shrink-0 p-0"
          disabled={disabled}
          aria-label={`More actions for ${stepLabel}`}
        >
          <Icon name="more-horizontal" size="xs" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Section actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ManualAddSectionSubmenu
          disabled={disabled}
          hasRepeatGroup={hasRepeatGroup}
          label="Add section before"
          onAddBlock={onAddBlockBefore}
          onAddRepeatGroup={onAddRepeatBefore}
        />
        <ManualAddSectionSubmenu
          disabled={disabled}
          hasRepeatGroup={hasRepeatGroup}
          label="Add section after"
          onAddBlock={onAddBlockAfter}
          onAddRepeatGroup={onAddRepeatAfter}
        />
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={index === 0} onSelect={onMoveUp}>
          <Icon name="chevron-up" size="xs" />
          Move section up
        </DropdownMenuItem>
        <DropdownMenuItem disabled={index >= total - 1} onSelect={onMoveDown}>
          <Icon name="chevron-down" size="xs" />
          Move section down
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onDuplicate}>
          <Icon name="copy" size="xs" />
          Duplicate section
        </DropdownMenuItem>
        <DropdownMenuItem className="text-destructive" onSelect={onDelete}>
          <Icon name="trash" size="xs" />
          Delete section
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function RepeatChildRowActions({
  disabled,
  index,
  onAddBlockAfter,
  onAddBlockBefore,
  onDelete,
  onDuplicate,
  onMoveDown,
  onMoveUp,
  stepLabel,
  total,
}: {
  disabled: boolean;
  index: number;
  onAddBlockAfter: (blockKey: ManualWorkoutBlockKey) => void;
  onAddBlockBefore: (blockKey: ManualWorkoutBlockKey) => void;
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
          className="hito-button hito-button-ghost hito-button-sm hito-manual-workout-row-action-button aspect-square shrink-0 p-0"
          disabled={disabled}
          aria-label={`More actions for ${stepLabel}`}
        >
          <Icon name="more-horizontal" size="xs" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Section actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ManualAddBlockSubmenu
          disabled={disabled}
          label="Add section before"
          onAddBlock={onAddBlockBefore}
        />
        <ManualAddBlockSubmenu
          disabled={disabled}
          label="Add section after"
          onAddBlock={onAddBlockAfter}
        />
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={index === 0} onSelect={onMoveUp}>
          <Icon name="chevron-up" size="xs" />
          Move section up
        </DropdownMenuItem>
        <DropdownMenuItem disabled={index >= total - 1} onSelect={onMoveDown}>
          <Icon name="chevron-down" size="xs" />
          Move section down
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onDuplicate}>
          <Icon name="copy" size="xs" />
          Duplicate section
        </DropdownMenuItem>
        <DropdownMenuItem className="text-destructive" disabled={total <= 1} onSelect={onDelete}>
          <Icon name="trash" size="xs" />
          Delete section
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ManualAddSectionSubmenu({
  disabled,
  hasRepeatGroup,
  label,
  onAddBlock,
  onAddRepeatGroup,
}: {
  disabled: boolean;
  hasRepeatGroup: boolean;
  label: string;
  onAddBlock: (blockKey: ManualWorkoutBlockKey) => void;
  onAddRepeatGroup: () => void;
}) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger disabled={disabled}>
        <Icon name="plus" size="xs" />
        {label}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="hito-manual-workout-menu-step">
        <ManualAddSectionMenuItems
          hasRepeatGroup={hasRepeatGroup}
          onAddBlock={onAddBlock}
          onAddRepeatGroup={onAddRepeatGroup}
        />
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

function ManualAddBlockSubmenu({
  disabled,
  label,
  onAddBlock,
}: {
  disabled: boolean;
  label: string;
  onAddBlock: (blockKey: ManualWorkoutBlockKey) => void;
}) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger disabled={disabled}>
        <Icon name="plus" size="xs" />
        {label}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="hito-manual-workout-menu-step">
        <ManualAddSectionMenuItems
          allowRepeatGroup={false}
          includeNoteBlocks={false}
          onAddBlock={onAddBlock}
        />
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

function ManualAddStepMenu({
  allowRepeatGroup = true,
  hasRepeatGroup,
  includeNoteBlocks = true,
  insertionActive = false,
  onAddBlock,
  onAddRepeatGroup,
  placement = "between",
  prominent = false,
}: {
  allowRepeatGroup?: boolean;
  hasRepeatGroup: boolean;
  includeNoteBlocks?: boolean;
  insertionActive?: boolean;
  onAddBlock: (blockKey: ManualWorkoutBlockKey) => void;
  onAddRepeatGroup?: () => void;
  placement?: "between" | "repeat-bottom" | "repeat-child";
  prominent?: boolean;
}) {
  const [mobilePickerOpen, setMobilePickerOpen] = useState(false);

  const addBlockFromMobilePicker = (blockKey: ManualWorkoutBlockKey) => {
    setMobilePickerOpen(false);
    onAddBlock(blockKey);
  };

  const addRepeatFromMobilePicker = () => {
    if (!onAddRepeatGroup) return;
    setMobilePickerOpen(false);
    onAddRepeatGroup();
  };

  const triggerClassName = [
    "hito-button hito-button-secondary hito-button-sm hito-manual-workout-add-section-button relative z-10",
    prominent
      ? ""
      : "opacity-100 md:opacity-0 md:transition-opacity md:group-hover/add-step:opacity-100 md:group-focus-within/add-step:opacity-100 focus-visible:opacity-100",
  ].join(" ");
  const gapClassName = prominent
    ? "hito-manual-workout-add-step hito-manual-workout-add-step-prominent"
    : [
        "group/add-step hito-manual-workout-add-step",
        placement === "repeat-bottom"
          ? "hito-manual-workout-add-step-repeat-bottom"
          : placement === "repeat-child"
            ? "hito-manual-workout-add-step-repeat-child"
            : "hito-manual-workout-add-step-between",
      ].join(" ");

  return (
    <div className={gapClassName} data-insertion-active={insertionActive || undefined}>
      {prominent && !insertionActive ? null : (
        <span className="hito-manual-workout-insertion-line pointer-events-none absolute inset-x-0 top-1/2" />
      )}
      <button
        type="button"
        className={`${triggerClassName} md:hidden`}
        onClick={() => setMobilePickerOpen(true)}
      >
        Add Section
        <Icon name="chevron-down" size="xs" />
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className={`${triggerClassName} hidden md:inline-flex`}>
            Add Section
            <Icon name="chevron-down" size="xs" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={prominent ? "end" : "center"}
          className="hito-manual-workout-menu-step"
        >
          <ManualAddSectionMenuItems
            allowRepeatGroup={allowRepeatGroup}
            hasRepeatGroup={hasRepeatGroup}
            includeNoteBlocks={includeNoteBlocks}
            onAddBlock={onAddBlock}
            onAddRepeatGroup={onAddRepeatGroup}
          />
        </DropdownMenuContent>
      </DropdownMenu>

      <ManualAddPiecePickerDialog
        allowRepeatGroup={allowRepeatGroup}
        hasRepeatGroup={hasRepeatGroup}
        includeNoteBlocks={includeNoteBlocks}
        onAddBlock={addBlockFromMobilePicker}
        onAddRepeatGroup={addRepeatFromMobilePicker}
        onOpenChange={setMobilePickerOpen}
        open={mobilePickerOpen}
      />
    </div>
  );
}

function ManualAddPiecePickerDialog({
  allowRepeatGroup = true,
  hasRepeatGroup,
  includeNoteBlocks = true,
  onAddBlock,
  onAddRepeatGroup,
  onOpenChange,
  open,
}: {
  allowRepeatGroup?: boolean;
  hasRepeatGroup: boolean;
  includeNoteBlocks?: boolean;
  onAddBlock: (blockKey: ManualWorkoutBlockKey) => void;
  onAddRepeatGroup?: () => void;
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
          <DialogTitle className="hito-modal-title">Add Section</DialogTitle>
          <DialogDescription className="hito-body">
            Choose one section for this manual workout. Hito reviews the full draft before anything
            is saved.
          </DialogDescription>
        </DialogHeader>

        <div className="hito-product-dialog-body-scroll-fill grid gap-4">
          {allowRepeatGroup && onAddRepeatGroup ? (
            <section className="grid gap-2">
              <p className="hito-label">Repeat</p>
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
                    <span className="hito-list-row-title block">Add Repeat</span>
                    <span className="hito-list-row-copy block">
                      Add a container whose sections repeat together.
                    </span>
                  </span>
                </button>
              </div>
            </section>
          ) : null}

          <ManualBlockChoiceRows includeNoteBlocks={includeNoteBlocks} onSelect={onAddBlock} />
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

function ManualAddSectionMenuItems({
  allowRepeatGroup = true,
  hasRepeatGroup = false,
  includeNoteBlocks = true,
  onAddBlock,
  onAddRepeatGroup,
}: {
  allowRepeatGroup?: boolean;
  hasRepeatGroup?: boolean;
  includeNoteBlocks?: boolean;
  onAddBlock: (blockKey: ManualWorkoutBlockKey) => void;
  onAddRepeatGroup?: () => void;
}) {
  return (
    <>
      <DropdownMenuLabel>Workout sections</DropdownMenuLabel>
      <DropdownMenuSeparator />
      {allowRepeatGroup && onAddRepeatGroup ? (
        <>
          <DropdownMenuItem disabled={hasRepeatGroup} onSelect={onAddRepeatGroup}>
            <span className="hito-status-pill" data-tone="warning">
              Repeat
            </span>
            Add Repeat
          </DropdownMenuItem>
          <DropdownMenuSeparator />
        </>
      ) : null}
      {BLOCK_MENU_GROUPS.map((group) => (
        <FilteredManualAddSectionMenuGroup
          group={group}
          includeNoteBlocks={includeNoteBlocks}
          key={group.label}
          onAddBlock={onAddBlock}
        />
      ))}
    </>
  );
}

function FilteredManualAddSectionMenuGroup({
  group,
  includeNoteBlocks,
  onAddBlock,
}: {
  group: { label: string; items: ManualWorkoutBlockKey[] };
  includeNoteBlocks: boolean;
  onAddBlock: (blockKey: ManualWorkoutBlockKey) => void;
}) {
  const items = filterBlockMenuItems(group.items, includeNoteBlocks);
  if (items.length === 0) return null;

  return (
    <div>
      <DropdownMenuLabel className="pt-2">{group.label}</DropdownMenuLabel>
      {items.map((blockKey) => (
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
  );
}

function entryLabel(entry: ManualWorkoutConstructorEntryInput) {
  if (entry.kind === "repeat_group") {
    return "Repeats";
  }

  return entry.block.label ?? blockLabel(entry.block.blockKey);
}

function ManualBlockChoiceRows({
  currentBlockKey,
  includeNoteBlocks = true,
  onSelect,
  showCurrent = false,
}: {
  currentBlockKey?: ManualWorkoutBlockKey;
  includeNoteBlocks?: boolean;
  onSelect: (blockKey: ManualWorkoutBlockKey) => void;
  showCurrent?: boolean;
}) {
  return (
    <div className="grid gap-4">
      {BLOCK_MENU_GROUPS.map((group) => (
        <ManualBlockChoiceGroup
          currentBlockKey={currentBlockKey}
          group={group}
          includeNoteBlocks={includeNoteBlocks}
          key={group.label}
          onSelect={onSelect}
          showCurrent={showCurrent}
        />
      ))}
    </div>
  );
}

function ManualBlockChoiceGroup({
  currentBlockKey,
  group,
  includeNoteBlocks,
  onSelect,
  showCurrent,
}: {
  currentBlockKey?: ManualWorkoutBlockKey;
  group: { label: string; items: ManualWorkoutBlockKey[] };
  includeNoteBlocks: boolean;
  onSelect: (blockKey: ManualWorkoutBlockKey) => void;
  showCurrent: boolean;
}) {
  const items = filterBlockMenuItems(group.items, includeNoteBlocks);
  if (items.length === 0) return null;

  return (
    <section className="grid gap-2">
      <p className="hito-label">{group.label}</p>
      <div className="hito-row-group">
        {items.map((blockKey) => {
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
                {selected ? <span className="hito-list-row-copy block">Current type</span> : null}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function filterBlockMenuItems(
  items: ManualWorkoutBlockKey[],
  includeNoteBlocks: boolean,
): ManualWorkoutBlockKey[] {
  return includeNoteBlocks ? items : items.filter((blockKey) => !isNoteBlock(blockKey));
}

function autoScrollManualWorkoutEditor(target: HTMLElement, clientY: number) {
  const scrollContainer = target.closest(
    ".hito-product-dialog-body-scroll-fill",
  ) as HTMLElement | null;
  if (!scrollContainer || scrollContainer.scrollHeight <= scrollContainer.clientHeight) return;

  const rect = scrollContainer.getBoundingClientRect();
  const edgeSize = Math.min(96, Math.max(48, rect.height * 0.18));
  const topDistance = clientY - rect.top;
  const bottomDistance = rect.bottom - clientY;
  const maxStep = 24;

  if (topDistance < edgeSize) {
    const strength = (edgeSize - topDistance) / edgeSize;
    scrollContainer.scrollTop -= Math.ceil(strength * maxStep);
    return;
  }

  if (bottomDistance < edgeSize) {
    const strength = (edgeSize - bottomDistance) / edgeSize;
    scrollContainer.scrollTop += Math.ceil(strength * maxStep);
  }
}

function manualWorkoutDropPositionFromElement(
  element: HTMLElement,
  clientY: number,
): ManualWorkoutDropPosition {
  const rect = element.getBoundingClientRect();
  return clientY < rect.top + rect.height / 2 ? "before" : "after";
}

function manualWorkoutEntryRowFromPoint(
  clientX: number,
  clientY: number,
  fallbackRows?: Array<HTMLElement | null>,
): HTMLElement | null {
  return (
    document
      .elementFromPoint(clientX, clientY)
      ?.closest<HTMLElement>(".hito-manual-workout-entry-row") ??
    nearestManualWorkoutRowFromY(clientY, fallbackRows)
  );
}

function manualWorkoutEntryIndexFromElement(element: HTMLElement): number | null {
  const value = Number(element.dataset.manualWorkoutEntryIndex);
  return Number.isInteger(value) ? value : null;
}

function manualWorkoutRepeatChildRowFromPoint(
  clientX: number,
  clientY: number,
  fallbackRows?: Array<HTMLElement | null>,
): HTMLElement | null {
  return (
    document
      .elementFromPoint(clientX, clientY)
      ?.closest<HTMLElement>(".hito-manual-workout-repeat-child-row") ??
    nearestManualWorkoutRowFromY(clientY, fallbackRows)
  );
}

function manualWorkoutRepeatChildIndexFromElement(element: HTMLElement): number | null {
  const value = Number(element.dataset.manualWorkoutRepeatChildIndex);
  return Number.isInteger(value) ? value : null;
}

function nearestManualWorkoutRowFromY(
  clientY: number,
  rows?: Array<HTMLElement | null>,
): HTMLElement | null {
  if (!rows?.length) return null;

  let nearest: HTMLElement | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const row of rows) {
    if (!row) continue;

    const rect = row.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) continue;

    const verticalDistance =
      clientY < rect.top ? rect.top - clientY : clientY > rect.bottom ? clientY - rect.bottom : 0;
    if (verticalDistance < nearestDistance) {
      nearest = row;
      nearestDistance = verticalDistance;
    }
  }

  return nearest;
}

function releaseManualWorkoutPointerCapture(element: HTMLElement, pointerId: number) {
  if (element.hasPointerCapture(pointerId)) {
    element.releasePointerCapture(pointerId);
  }
}

function isManualWorkoutInteractiveDragTarget(target: EventTarget): boolean {
  return target instanceof HTMLElement
    ? Boolean(
        target.closest(
          [
            "button",
            "input",
            "textarea",
            "select",
            "a",
            "[contenteditable='true']",
            "[role='button']",
            "[role='combobox']",
            "[role='menuitem']",
          ].join(","),
        ),
      )
    : false;
}

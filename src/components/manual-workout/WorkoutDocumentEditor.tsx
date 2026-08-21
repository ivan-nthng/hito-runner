import { useRef, useState, type DragEvent, type ReactNode } from "react";
import { HitoButton } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  moveWorkoutRepeatChildById,
  moveWorkoutSectionById,
  updateWorkoutRepeatChild,
  updateWorkoutSection,
} from "@/components/manual-workout/workout-editor-state";
import type {
  WorkoutDocument,
  WorkoutDocumentPrescription,
  WorkoutDocumentRepeatChildPrescription,
  WorkoutDocumentSection,
  WorkoutDocumentTarget,
  WorkoutDocumentUnitPrescription,
} from "@/lib/workout-document";

type TargetMode = "none" | "pace" | "pace_range" | "hr_cap" | "hr_range" | "rpe";
type DropPosition = "before" | "after";
type DragState = { parentId: string | null; segmentId: string } | null;
const SECTION_TYPES = [
  ["warmup", "Warm-up"],
  ["run", "Run"],
  ["work", "Work"],
  ["recovery", "Recovery"],
  ["cooldown", "Cool-down"],
] as const;
const CHILD_ROLES = [
  ["warm_up", "Warm-up"],
  ["run", "Run"],
  ["walk", "Walk"],
  ["work", "Work"],
  ["recover", "Recover"],
  ["finish", "Finish"],
  ["cooldown", "Cooldown"],
] as const;

export function WorkoutDocumentEditor({
  document,
  onChange,
  readOnly = false,
}: {
  document: WorkoutDocument;
  onChange: (document: WorkoutDocument) => void;
  readOnly?: boolean;
}) {
  const [drag, setDrag] = useState<DragState>(null);
  const [announcement, setAnnouncement] = useState("");
  const focusIdRef = useRef<string | null>(null);
  const commit = (next: WorkoutDocument, message?: string, focusId?: string) => {
    onChange(next);
    if (message) setAnnouncement(message);
    if (focusId) requestFocus(focusIdRef, focusId);
  };
  const moveSection = (sourceId: string, targetId: string, position: DropPosition) => {
    const next = moveWorkoutSectionById(document, sourceId, targetId, position);
    commit(
      next,
      `Moved section to position ${next.steps.findIndex((step) => step.segment_id === sourceId) + 1}.`,
      sourceId,
    );
  };
  return (
    <div className="hito-manual-workout-editor grid gap-4">
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      <Field label="Workout title">
        <Input
          size="md"
          variant="primary"
          readOnly={readOnly}
          value={document.title}
          onChange={(event) => commit({ ...document, title: event.target.value })}
        />
      </Field>
      <section className="grid gap-3" aria-label="Workout structure">
        {!readOnly && document.workoutType !== "rest" ? (
          <HitoButton
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => {
              const section = newSection();
              commit(
                { ...document, steps: [...document.steps, section] },
                `Added ${section.label}.`,
                section.segment_id,
              );
            }}
          >
            Add workout section
          </HitoButton>
        ) : null}
        <div className="hito-manual-workout-entry-stack">
          {document.steps.map((section, index) => (
            <SectionRow
              key={requiredId(section.segment_id)}
              document={document}
              index={index}
              section={section}
              readOnly={readOnly}
              drag={drag}
              setDrag={setDrag}
              registerFocus={(node) => {
                if (node) node.dataset.editorNodeId = requiredId(section.segment_id);
              }}
              onChange={(next) =>
                commit(updateWorkoutSection(document, requiredId(section.segment_id), () => next))
              }
              onDelete={() => {
                const remaining = document.steps.filter(
                  (step) => step.segment_id !== section.segment_id,
                );
                const focus = remaining[index]?.segment_id ?? remaining[index - 1]?.segment_id;
                commit(
                  { ...document, steps: remaining },
                  `Deleted ${section.label ?? "section"}.`,
                  focus,
                );
              }}
              onDuplicate={() => {
                const copy = cloneSection(section);
                const steps = [...document.steps];
                steps.splice(index + 1, 0, copy);
                commit(
                  { ...document, steps },
                  `Duplicated ${section.label ?? "section"}.`,
                  copy.segment_id,
                );
              }}
              onMove={(offset) => {
                const target = document.steps[index + offset];
                if (target?.segment_id && section.segment_id)
                  moveSection(
                    section.segment_id,
                    target.segment_id,
                    offset > 0 ? "after" : "before",
                  );
              }}
              onDrop={(targetId, position) => {
                if (drag && drag.parentId === null) moveSection(drag.segmentId, targetId, position);
                setDrag(null);
              }}
              onDocumentChange={commit}
            />
          ))}
        </div>
        {document.steps.length === 0 ? (
          <div className="hito-list-row">
            <p className="hito-body-sm text-secondary">
              {document.workoutType === "rest"
                ? "Rest day has no running sections."
                : "Add at least one section before review."}
            </p>
          </div>
        ) : null}
      </section>
      <Field label="Notes or cues">
        <Textarea
          rows={3}
          size="md"
          variant="primary"
          readOnly={readOnly}
          value={document.notes ?? ""}
          onChange={(event) => commit({ ...document, notes: event.target.value || null })}
        />
      </Field>
    </div>
  );
}

function SectionRow({
  document,
  index,
  section,
  readOnly,
  drag,
  setDrag,
  registerFocus,
  onChange,
  onDelete,
  onDuplicate,
  onMove,
  onDrop,
  onDocumentChange,
}: {
  document: WorkoutDocument;
  index: number;
  section: WorkoutDocumentSection;
  readOnly: boolean;
  drag: DragState;
  setDrag: (drag: DragState) => void;
  registerFocus: (node: HTMLDivElement | null) => void;
  onChange: (section: WorkoutDocumentSection) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMove: (offset: number) => void;
  onDrop: (targetId: string, position: DropPosition) => void;
  onDocumentChange: (document: WorkoutDocument, message?: string, focusId?: string) => void;
}) {
  const id = requiredId(section.segment_id);
  const prescription = section.prescription ?? { mode: "time", duration_min: 10 };
  return (
    <div
      ref={registerFocus}
      tabIndex={-1}
      className="hito-list-row items-start"
      draggable={!readOnly}
      onDragStart={(event) => startDrag(event, setDrag, { parentId: null, segmentId: id })}
      onDragEnd={() => setDrag(null)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        onDrop(id, dropPosition(event));
      }}
    >
      <div className="grid min-w-0 flex-1 gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Section label">
            <Input
              size="sm"
              variant="secondary"
              readOnly={readOnly}
              value={section.label ?? ""}
              onChange={(event) => onChange({ ...section, label: event.target.value || null })}
            />
          </Field>
          <Field label="Section type">
            <Select
              disabled={readOnly}
              value={sectionType(section)}
              onValueChange={(type) => onChange(changeSectionType(section, type))}
            >
              <SelectTrigger
                aria-label={`Section ${index + 1} type`}
                className="hito-field hito-field-secondary hito-field-sm"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SECTION_TYPES.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <PrescriptionEditor
          prescription={prescription}
          readOnly={readOnly}
          onChange={(next) => onChange(withPrescription(section, next))}
        />
        {prescription.mode === "repeats" ? (
          <RepeatChildren
            document={document}
            parent={section}
            readOnly={readOnly}
            drag={drag}
            setDrag={setDrag}
            onDocumentChange={onDocumentChange}
          />
        ) : (
          <TargetEditor
            target={section.target}
            readOnly={readOnly}
            roleLabel={`Section ${index + 1}`}
            onChange={(target) => onChange({ ...section, target })}
          />
        )}
        <Field label="Guidance">
          <Input
            size="sm"
            variant="secondary"
            readOnly={readOnly}
            value={section.guidance ?? ""}
            onChange={(event) => onChange({ ...section, guidance: event.target.value || null })}
          />
        </Field>
        {!readOnly ? (
          <div className="flex flex-wrap gap-2">
            <HitoButton
              type="button"
              size="sm"
              variant="ghost"
              aria-label={`Move ${section.label ?? "section"} up`}
              disabled={index === 0}
              onClick={() => onMove(-1)}
            >
              Move up
            </HitoButton>
            <HitoButton
              type="button"
              size="sm"
              variant="ghost"
              aria-label={`Move ${section.label ?? "section"} down`}
              disabled={index === document.steps.length - 1}
              onClick={() => onMove(1)}
            >
              Move down
            </HitoButton>
            <HitoButton type="button" size="sm" variant="ghost" onClick={onDuplicate}>
              Duplicate
            </HitoButton>
            <HitoButton type="button" size="sm" variant="ghost" onClick={onDelete}>
              Delete section
            </HitoButton>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function RepeatChildren({
  document,
  parent,
  readOnly,
  drag,
  setDrag,
  onDocumentChange,
}: {
  document: WorkoutDocument;
  parent: WorkoutDocumentSection;
  readOnly: boolean;
  drag: DragState;
  setDrag: (drag: DragState) => void;
  onDocumentChange: (document: WorkoutDocument, message?: string, focusId?: string) => void;
}) {
  const parentId = requiredId(parent.segment_id);
  const children =
    parent.prescription?.mode === "repeats" ? (parent.prescription.children ?? []) : [];
  const commitMove = (sourceId: string, targetId: string, position: DropPosition) => {
    const next = moveWorkoutRepeatChildById(document, parentId, sourceId, targetId, position);
    const nextChildren =
      next.steps.find((step) => step.segment_id === parentId)?.prescription?.children ?? [];
    onDocumentChange(
      next,
      `Moved repeat child to position ${nextChildren.findIndex((child) => child.segment_id === sourceId) + 1}.`,
      sourceId,
    );
  };
  return (
    <div className="grid gap-3">
      <p className="hito-label-md text-foreground">Repeat sections</p>
      {children.map((child, index) => {
        const id = child.segment_id;
        return (
          <div
            key={id}
            data-editor-node-id={id}
            tabIndex={-1}
            draggable={!readOnly}
            className="hito-row-group grid gap-3 p-3"
            onDragStart={(event) => startDrag(event, setDrag, { parentId, segmentId: id })}
            onDragEnd={() => setDrag(null)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              if (drag?.parentId === parentId) commitMove(drag.segmentId, id, dropPosition(event));
              setDrag(null);
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Repeat label">
                <Input
                  size="sm"
                  variant="secondary"
                  readOnly={readOnly}
                  value={child.label ?? ""}
                  onChange={(event) =>
                    onDocumentChange(
                      updateWorkoutRepeatChild(document, parentId, id, (value) => ({
                        ...value,
                        label: event.target.value || undefined,
                      })),
                    )
                  }
                />
              </Field>
              <Field label="Repeat role">
                <Select
                  disabled={readOnly}
                  value={child.role}
                  onValueChange={(role) =>
                    onDocumentChange(
                      updateWorkoutRepeatChild(document, parentId, id, (value) => ({
                        ...value,
                        role: role as WorkoutDocumentRepeatChildPrescription["role"],
                      })),
                    )
                  }
                >
                  <SelectTrigger
                    aria-label={`Repeat section ${index + 1} role`}
                    className="hito-field hito-field-secondary hito-field-sm"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHILD_ROLES.map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <UnitPrescriptionEditor
              prescription={child.prescription}
              readOnly={readOnly}
              onChange={(prescription) =>
                onDocumentChange(
                  updateWorkoutRepeatChild(document, parentId, id, (value) => ({
                    ...value,
                    prescription,
                  })),
                )
              }
            />
            <TargetEditor
              target={child.target}
              readOnly={readOnly}
              roleLabel={`Repeat section ${index + 1}`}
              onChange={(target) =>
                onDocumentChange(
                  updateWorkoutRepeatChild(document, parentId, id, (value) => ({
                    ...value,
                    target,
                  })),
                )
              }
            />
            <Field label="Guidance">
              <Input
                size="sm"
                variant="secondary"
                readOnly={readOnly}
                value={child.guidance ?? ""}
                onChange={(event) =>
                  onDocumentChange(
                    updateWorkoutRepeatChild(document, parentId, id, (value) => ({
                      ...value,
                      guidance: event.target.value || undefined,
                    })),
                  )
                }
              />
            </Field>
            {!readOnly ? (
              <div className="flex flex-wrap gap-2">
                <HitoButton
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={index === 0}
                  onClick={() => {
                    const target = children[index - 1];
                    if (target) commitMove(id, target.segment_id, "before");
                  }}
                >
                  Move up
                </HitoButton>
                <HitoButton
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={index === children.length - 1}
                  onClick={() => {
                    const target = children[index + 1];
                    if (target) commitMove(id, target.segment_id, "after");
                  }}
                >
                  Move down
                </HitoButton>
                <HitoButton
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const copy = { ...child, segment_id: newId() };
                    onDocumentChange(
                      updateWorkoutSection(document, parentId, (section) =>
                        repeatSectionWithChildren(section, [
                          ...children.slice(0, index + 1),
                          copy,
                          ...children.slice(index + 1),
                        ]),
                      ),
                      `Duplicated ${child.label ?? "repeat section"}.`,
                      copy.segment_id,
                    );
                  }}
                >
                  Duplicate
                </HitoButton>
                <HitoButton
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={children.length === 1}
                  onClick={() => {
                    const remaining = children.filter((value) => value.segment_id !== id);
                    onDocumentChange(
                      updateWorkoutSection(document, parentId, (section) =>
                        repeatSectionWithChildren(section, remaining),
                      ),
                      `Deleted ${child.label ?? "repeat section"}.`,
                      remaining[index]?.segment_id ?? remaining[index - 1]?.segment_id,
                    );
                  }}
                >
                  Delete
                </HitoButton>
              </div>
            ) : null}
          </div>
        );
      })}
      {!readOnly ? (
        <HitoButton
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => {
            const child = newRepeatChild();
            onDocumentChange(
              updateWorkoutSection(document, parentId, (section) =>
                repeatSectionWithChildren(section, [...children, child]),
              ),
              `Added ${child.label}.`,
              child.segment_id,
            );
          }}
        >
          Add repeat section
        </HitoButton>
      ) : null}
    </div>
  );
}

function PrescriptionEditor({
  prescription,
  readOnly,
  onChange,
}: {
  prescription: WorkoutDocumentPrescription;
  readOnly: boolean;
  onChange: (value: WorkoutDocumentPrescription) => void;
}) {
  const value =
    prescription.mode === "time"
      ? prescription.duration_min
      : prescription.mode === "distance"
        ? prescription.distance_km
        : prescription.mode === "repeats"
          ? prescription.repeat_count
          : "";
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Duration mode">
        <Select
          disabled={readOnly}
          value={prescription.mode}
          onValueChange={(mode) =>
            onChange(defaultPrescription(mode as WorkoutDocumentPrescription["mode"]))
          }
        >
          <SelectTrigger
            aria-label="Section duration mode"
            className="hito-field hito-field-secondary hito-field-sm"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="time">Minutes</SelectItem>
            <SelectItem value="distance">Distance</SelectItem>
            <SelectItem value="repeats">Repeats</SelectItem>
            <SelectItem value="none">No quantity</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      {prescription.mode !== "none" ? (
        <Field
          label={
            prescription.mode === "time"
              ? "Minutes"
              : prescription.mode === "distance"
                ? "Kilometres"
                : "Repeat count"
          }
        >
          <Input
            size="sm"
            variant="secondary"
            readOnly={readOnly}
            inputMode="decimal"
            value={value == null ? "" : String(value)}
            onChange={(event) => onChange(setPrescriptionValue(prescription, event.target.value))}
          />
        </Field>
      ) : null}
    </div>
  );
}
function UnitPrescriptionEditor({
  prescription,
  readOnly,
  onChange,
}: {
  prescription: WorkoutDocumentUnitPrescription;
  readOnly: boolean;
  onChange: (value: WorkoutDocumentUnitPrescription) => void;
}) {
  const value =
    prescription.mode === "time"
      ? prescription.duration_min
      : prescription.mode === "distance"
        ? prescription.distance_km
        : "";
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Duration mode">
        <Select
          disabled={readOnly}
          value={prescription.mode}
          onValueChange={(mode) =>
            onChange(
              mode === "time"
                ? { mode: "time", duration_min: 2 }
                : mode === "distance"
                  ? { mode: "distance", distance_km: 1 }
                  : { mode: "none" },
            )
          }
        >
          <SelectTrigger
            aria-label="Repeat section duration mode"
            className="hito-field hito-field-secondary hito-field-sm"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="time">Minutes</SelectItem>
            <SelectItem value="distance">Distance</SelectItem>
            <SelectItem value="none">No quantity</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      {prescription.mode !== "none" ? (
        <Field label={prescription.mode === "time" ? "Minutes" : "Kilometres"}>
          <Input
            size="sm"
            variant="secondary"
            readOnly={readOnly}
            inputMode="decimal"
            value={value == null ? "" : String(value)}
            onChange={(event) =>
              onChange(
                prescription.mode === "time"
                  ? { mode: "time", duration_min: optionalNumber(event.target.value) }
                  : { mode: "distance", distance_km: optionalNumber(event.target.value) },
              )
            }
          />
        </Field>
      ) : null}
    </div>
  );
}
function TargetEditor({
  target,
  readOnly,
  roleLabel,
  onChange,
}: {
  target: WorkoutDocumentTarget | undefined;
  readOnly: boolean;
  roleLabel: string;
  onChange: (target: WorkoutDocumentTarget | undefined) => void;
}) {
  const mode = targetMode(target);
  const targetInputRef = useRef<HTMLInputElement | null>(null);
  const focusTargetAfterCloseRef = useRef(false);
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Target">
        <Select
          disabled={readOnly}
          value={mode}
          onOpenChange={(open) => {
            if (open || !focusTargetAfterCloseRef.current) return;
            focusTargetAfterCloseRef.current = false;
            window.setTimeout(() => targetInputRef.current?.focus({ preventScroll: true }), 0);
          }}
          onValueChange={(value) => {
            const nextMode = value as TargetMode;
            if (nextMode === mode) return;
            focusTargetAfterCloseRef.current = nextMode !== "none";
            onChange(targetForMode(nextMode));
          }}
        >
          <SelectTrigger
            aria-label={`${roleLabel} target type`}
            className="hito-field hito-field-secondary hito-field-sm"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No target</SelectItem>
            <SelectItem value="pace">Pace</SelectItem>
            <SelectItem value="pace_range">Pace range</SelectItem>
            <SelectItem value="hr_cap">HR cap</SelectItem>
            <SelectItem value="hr_range">HR range</SelectItem>
            <SelectItem value="rpe">RPE</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      {mode !== "none" ? (
        <Field label="Value">
          <Input
            size="sm"
            variant="secondary"
            data-target-input={roleLabel}
            ref={targetInputRef}
            readOnly={readOnly}
            value={targetValue(target, mode)}
            placeholder={placeholder(mode)}
            onChange={(event) =>
              onChange(withTargetValue(targetForMode(mode)!, mode, event.target.value))
            }
          />
        </Field>
      ) : null}
    </div>
  );
}
function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="grid gap-2">
      <span className="hito-label-md text-foreground">{label}</span>
      {children}
    </label>
  );
}
function newSection(): WorkoutDocumentSection {
  return {
    type: "run",
    segment_type: "run",
    segment_id: newId(),
    label: "Run",
    prescription: { mode: "time", duration_min: 10 },
    duration_min: 10,
  };
}
function newRepeatChild(): WorkoutDocumentRepeatChildPrescription {
  return {
    segment_id: newId(),
    role: "work",
    label: "Work",
    prescription: { mode: "time", duration_min: 2 },
  };
}
function cloneSection(section: WorkoutDocumentSection): WorkoutDocumentSection {
  return {
    ...section,
    segment_id: newId(),
    children: undefined,
    prescription:
      section.prescription?.mode === "repeats"
        ? {
            ...section.prescription,
            children: (section.prescription.children ?? []).map((child) => ({
              ...child,
              segment_id: newId(),
            })),
          }
        : section.prescription,
  };
}
function repeatSectionWithChildren(
  section: WorkoutDocumentSection,
  children: WorkoutDocumentRepeatChildPrescription[],
): WorkoutDocumentSection {
  return section.prescription?.mode === "repeats"
    ? { ...section, children: undefined, prescription: { ...section.prescription, children } }
    : section;
}
function withPrescription(
  section: WorkoutDocumentSection,
  prescription: WorkoutDocumentPrescription,
): WorkoutDocumentSection {
  return {
    ...section,
    prescription,
    children: undefined,
    target: prescription.mode === "repeats" ? undefined : section.target,
    duration_min: prescription.mode === "time" ? prescription.duration_min : undefined,
    distance_km: prescription.mode === "distance" ? prescription.distance_km : undefined,
    repeats: prescription.mode === "repeats" ? prescription.repeat_count : undefined,
  };
}
function changeSectionType(section: WorkoutDocumentSection, type: string): WorkoutDocumentSection {
  return withPrescription(
    {
      ...section,
      type,
      segment_type: type,
      label: SECTION_TYPES.find(([value]) => value === type)?.[1] ?? "Run",
      guidance: null,
      target: undefined,
    },
    { mode: "time", duration_min: 10 },
  );
}
function sectionType(section: WorkoutDocumentSection) {
  const value = section.segment_type ?? section.type;
  return SECTION_TYPES.some(([type]) => type === value) ? value : "run";
}
function defaultPrescription(
  mode: WorkoutDocumentPrescription["mode"],
): WorkoutDocumentPrescription {
  return mode === "time"
    ? { mode, duration_min: 10 }
    : mode === "distance"
      ? { mode, distance_km: 1 }
      : mode === "repeats"
        ? { mode, repeat_count: 3, children: [newRepeatChild()] }
        : { mode };
}
function setPrescriptionValue(
  value: WorkoutDocumentPrescription,
  raw: string,
): WorkoutDocumentPrescription {
  const amount = optionalNumber(raw);
  return value.mode === "time"
    ? { mode: "time", duration_min: amount }
    : value.mode === "distance"
      ? { mode: "distance", distance_km: amount }
      : value.mode === "repeats"
        ? {
            ...value,
            repeat_count:
              amount == null ? undefined : Math.max(2, Math.min(50, Math.round(amount))),
          }
        : value;
}
function optionalNumber(value: string) {
  return value.trim() === "" ? undefined : Number(value);
}
function targetMode(target?: WorkoutDocumentTarget): TargetMode {
  if (!target) return "none";
  if (target.primary_execution_mode === "pace")
    return target.pace_min_per_km_range !== undefined ? "pace_range" : "pace";
  if (target.primary_execution_mode === "heart_rate")
    return target.hr_bpm_range !== undefined ? "hr_range" : "hr_cap";
  if (target.primary_execution_mode === "effort") return "rpe";
  return "none";
}
function targetForMode(mode: TargetMode): WorkoutDocumentTarget | undefined {
  if (mode === "none") return undefined;
  if (mode === "pace" || mode === "pace_range")
    return {
      primary_execution_mode: "pace",
      target_source: "runner_entered",
      ...(mode === "pace_range" ? { pace_min_per_km_range: "" } : {}),
    };
  if (mode === "hr_cap" || mode === "hr_range")
    return {
      primary_execution_mode: "heart_rate",
      target_source: "runner_entered",
      hr_target_source: "runner_entered",
      ...(mode === "hr_range" ? { hr_bpm_range: "" } : {}),
    };
  return { primary_execution_mode: "effort", target_source: "runner_entered" };
}
function targetValue(target: WorkoutDocumentTarget | undefined, mode: TargetMode) {
  if (!target) return "";
  return mode === "pace"
    ? (target.pace ?? "")
    : mode === "pace_range"
      ? (target.pace_min_per_km_range ?? "")
      : mode === "hr_cap"
        ? target.hr_bpm_cap == null
          ? ""
          : String(target.hr_bpm_cap)
        : mode === "hr_range"
          ? (target.hr_bpm_range ?? "")
          : target.rpe == null
            ? ""
            : String(target.rpe);
}
function placeholder(mode: TargetMode) {
  return mode === "pace"
    ? "5:10/km"
    : mode === "pace_range"
      ? "5:10-5:25/km"
      : mode === "hr_cap"
        ? "155"
        : mode === "hr_range"
          ? "145-155 bpm"
          : "6";
}
function withTargetValue(
  target: WorkoutDocumentTarget,
  mode: TargetMode,
  value: string,
): WorkoutDocumentTarget {
  return mode === "pace"
    ? { ...target, pace: value }
    : mode === "pace_range"
      ? { ...target, pace_min_per_km_range: value }
      : mode === "hr_cap"
        ? { ...target, hr_bpm_cap: optionalNumber(value) }
        : mode === "hr_range"
          ? { ...target, hr_bpm_range: value }
          : { ...target, rpe: value };
}
function startDrag(
  event: DragEvent,
  setDrag: (drag: DragState) => void,
  drag: Exclude<DragState, null>,
) {
  if ((event.target as HTMLElement).closest("button,input,textarea,[role=combobox]")) {
    event.preventDefault();
    return;
  }
  setDrag(drag);
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", drag.segmentId);
}
function dropPosition(event: DragEvent): DropPosition {
  const rect = event.currentTarget.getBoundingClientRect();
  return event.clientY > rect.top + rect.height / 2 ? "after" : "before";
}
function requestFocus(ref: { current: string | null }, id?: string) {
  if (!id) return;
  ref.current = id;
  window.requestAnimationFrame(() => {
    document
      .querySelector<HTMLElement>(`[data-editor-node-id="${CSS.escape(id)}"]`)
      ?.focus({ preventScroll: true });
    ref.current = null;
  });
}
function requiredId(id?: string) {
  if (!id) throw new Error("Editable Workout sections require a stable segment ID.");
  return id;
}
function newId() {
  return globalThis.crypto.randomUUID();
}

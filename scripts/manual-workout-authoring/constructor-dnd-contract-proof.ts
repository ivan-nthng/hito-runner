import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import {
  moveWorkoutRepeatChildById,
  moveWorkoutSectionById,
  updateWorkoutRepeatChild,
  workoutDocumentEditorIssues,
} from "../../src/components/manual-workout/workout-editor-state";
import type { WorkoutDocument } from "../../src/lib/workout-document";

export function validateManualConstructorDndContract() {
  const document = fixtureDocument();
  const moved = moveWorkoutSectionById(document, "cooldown", "warmup", "before");
  assert.deepEqual(
    moved.steps.map((step) => step.segment_id),
    ["cooldown", "warmup", "repeat"],
  );
  assert.deepEqual(
    moved.steps.map((step) => step.sequence),
    [1, 2, 3],
  );

  const childMoved = moveWorkoutRepeatChildById(document, "repeat", "recover", "work", "before");
  const children = childMoved.steps[1]?.prescription?.children ?? [];
  assert.deepEqual(
    children.map((child) => child.segment_id),
    ["recover", "work"],
  );
  assert.deepEqual(
    children.map((child) => child.sequence),
    [1, 2],
  );
  assert.equal(childMoved.steps[1]?.children, undefined);

  const targeted = updateWorkoutRepeatChild(document, "repeat", "work", (child) => ({
    ...child,
    target: {
      primary_execution_mode: "pace",
      pace: "5:10/km",
      target_source: "runner_entered",
    },
  }));
  const targetedChildren = targeted.steps[1]?.prescription?.children ?? [];
  assert.equal(targetedChildren[0]?.segment_id, "work");
  assert.equal(targetedChildren[0]?.target?.pace, "5:10/km");
  assert.equal(targetedChildren[1]?.segment_id, "recover");
  assert.deepEqual(workoutDocumentEditorIssues(targeted), []);

  const invalid = updateWorkoutRepeatChild(targeted, "repeat", "work", (child) => ({
    ...child,
    target: {
      primary_execution_mode: "pace",
      target_source: "runner_entered",
    },
  }));
  assert.deepEqual(workoutDocumentEditorIssues(invalid), ["Repeat section requires a pace value."]);
}

function fixtureDocument(): WorkoutDocument {
  return {
    workoutDate: "2026-08-21",
    weekday: "Friday",
    weekNumber: 1,
    phase: "base",
    sourceWorkoutId: null,
    goalContext: null,
    plannedRpe: null,
    estimatedFatigue: null,
    recoveryPriority: null,
    displayOrder: 1,
    workoutType: "quality",
    sourceWorkoutType: "manual",
    workoutFamily: "intervals",
    workoutIdentity: "intervals",
    calendarIconKey: "intervals",
    metricMode: null,
    title: "Intervals",
    notes: null,
    steps: [
      {
        type: "warmup",
        segment_id: "warmup",
        sequence: 1,
        prescription: { mode: "time", duration_min: 10 },
      },
      {
        type: "work",
        segment_id: "repeat",
        sequence: 2,
        prescription: {
          mode: "repeats",
          repeat_count: 4,
          children: [
            {
              segment_id: "work",
              role: "work",
              sequence: 1,
              prescription: { mode: "time", duration_min: 2 },
            },
            {
              segment_id: "recover",
              role: "recover",
              sequence: 2,
              prescription: { mode: "time", duration_min: 1 },
            },
          ],
        },
      },
      {
        type: "cooldown",
        segment_id: "cooldown",
        sequence: 3,
        prescription: { mode: "time", duration_min: 5 },
      },
    ],
  };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  validateManualConstructorDndContract();
  console.log("Manual WorkoutDocument interaction contract proof passed.");
}

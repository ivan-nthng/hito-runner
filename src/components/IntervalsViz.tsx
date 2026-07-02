import type { Workout, Step } from "@/lib/training";
import {
  WorkoutStructureTimeline,
  type WorkoutStructureTimelineItem,
} from "@/components/workout-structure/WorkoutStructureTimeline";
import {
  displayStepStructureEntries,
  displayStepTargetReadbackEntries,
  formatDurationMin,
  repeatChildSteps,
  repeatCountForStep,
  stepPlannedDurationMin,
  workoutPlannedLanguage,
} from "@/lib/training";
import type { PlannedWorkoutLanguageBlock } from "@/lib/planned-workout-language";

/* Horizontal block timeline of workout structure. */
export function IntervalsViz({ workout }: { workout: Workout }) {
  const blocks = expand(workout);
  const total = blocks.reduce((s, b) => s + b.weight, 0);

  return (
    <WorkoutStructureTimeline
      items={blocks}
      summary={`${formatDurationMin(total)} · ${blocks.length} blocks`}
    />
  );
}

function expand(workout: Workout): WorkoutStructureTimelineItem[] {
  const out: WorkoutStructureTimelineItem[] = [];
  const languageBlocks = workoutPlannedLanguage(workout).runnerFacingBlocks;

  for (const [stepIndex, s] of workout.steps.entries()) {
    const languageBlock = languageBlocks[stepIndex];
    const repeatCount = repeatCountForStep(s);
    const repeatChildren = repeatChildSteps(s);

    if (repeatCount && repeatChildren.length > 0) {
      for (let i = 0; i < repeatCount; i++) {
        for (const [childIndex, child] of repeatChildren.entries()) {
          const language = repeatChildLanguage(languageBlock, childIndex);
          const metric = describeStepMetric(child);
          const kind = child.segment_type ?? child.type;
          const kindLabel = language?.label ?? child.label ?? humanizeSegmentKind(kind);

          out.push({
            id: `repeat-${stepIndex}-${i}-${childIndex}`,
            kindLabel,
            semanticKind: `${language?.type ?? kind} ${child.label ?? ""}`,
            weight: estimateVisualDurationMin(child, workout.type) || 1,
            title: `${kindLabel} ${i + 1}/${repeatCount}`,
            detailLabel: repeatChildBlockLabel(child, i + 1, repeatCount),
            barLabel: compactStructureBarLabel(child),
            metric,
            target: child.target,
            readbackEntries: displayStepTargetReadbackEntries(child, workout.metricMode, {
              limit: 2,
              omitStructureLabels: visibleMetricStructureLabels(child),
            }),
            tooltipReadbackEntries: displayStepTargetReadbackEntries(child, workout.metricMode, {
              limit: 3,
              omitStructureLabels: visibleMetricStructureLabels(child),
              supportFallbackLimit: 1,
            }),
          });
        }
      }
    } else {
      const kind = s.type === "run" ? "run" : s.type;
      const kindLabel = languageBlock?.label ?? humanizeSegmentKind(kind);

      out.push({
        id: `step-${stepIndex}`,
        kindLabel,
        semanticKind: `${kind} ${s.label ?? ""}`,
        weight: estimateVisualDurationMin(s, workout.type) || 1,
        title: kindLabel,
        detailLabel: describeStepMetric(s),
        barLabel: compactStructureBarLabel(s),
        metric: describeStepMetric(s),
        target: s.target,
        readbackEntries: displayStepTargetReadbackEntries(s, workout.metricMode, {
          limit: 2,
          omitStructureLabels: visibleMetricStructureLabels(s),
        }),
        tooltipReadbackEntries: displayStepTargetReadbackEntries(s, workout.metricMode, {
          limit: 3,
          omitStructureLabels: visibleMetricStructureLabels(s),
          supportFallbackLimit: 1,
        }),
      });
    }
  }
  return out;
}

function repeatChildLanguage(block: PlannedWorkoutLanguageBlock | undefined, index: number) {
  if (!block?.children.length) {
    return null;
  }

  return block.children[index] ?? null;
}

function visibleMetricStructureLabels(step: Step) {
  const visibleMetricEntry = primaryVisibleStructureMetricEntry(step);

  return visibleMetricEntry ? [visibleMetricEntry.key, visibleMetricEntry.label] : [];
}

function describeStepMetric(step: Step) {
  return primaryVisibleStructureMetricEntry(step)?.value ?? "—";
}

function primaryVisibleStructureMetricEntry(step: Step) {
  const entries = displayStepStructureEntries(step);

  return (
    entries.find((entry) => entry.key === "distance" || entry.key === "duration") ??
    entries.find((entry) => entry.key.startsWith("repeat_child_")) ??
    entries.find((entry) => entry.key === "repeats") ??
    null
  );
}

function repeatChildBlockLabel(child: Step, repeatIndex: number, repeatCount: number) {
  const metric = describeStepMetric(child);

  if (child.distance_km != null) {
    return `${repeatIndex}/${repeatCount} · ${Math.round(child.distance_km * 1000)}m`;
  }

  if (metric !== "—") {
    return `${repeatIndex}/${repeatCount} · ${metric}`;
  }

  return `${repeatIndex}/${repeatCount}`;
}

function compactStructureBarLabel(step: Step) {
  if (step.duration_min != null && Number.isFinite(step.duration_min)) {
    return compactDurationLabel(step.duration_min);
  }

  if (step.distance_km != null && Number.isFinite(step.distance_km)) {
    return `${Math.round(step.distance_km * 1000)}m`;
  }

  return describeStepMetric(step);
}

function compactDurationLabel(durationMin: number) {
  const totalSeconds = Math.max(1, Math.round(durationMin * 60));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes <= 0) {
    return `${seconds}s`;
  }

  if (seconds === 0) {
    return `${minutes}m`;
  }

  return `${minutes}m ${seconds}s`;
}

function estimateVisualDurationMin(step: Step, workoutType: Workout["type"]) {
  const direct = stepPlannedDurationMin(step, workoutType);
  if (direct > 0) {
    return direct;
  }

  if (!step.distance_km) {
    return 0;
  }

  const paceMap: Record<Workout["type"], number> = {
    easy: 7.0,
    steady_or_easy: 6.6,
    long_run: 6.8,
    quality: 5.8,
    rest: 0,
  };
  const pace = paceMap[workoutType];

  if (!pace) {
    return 0;
  }

  return Math.round(step.distance_km * pace);
}

function humanizeSegmentKind(kind: string) {
  return kind.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

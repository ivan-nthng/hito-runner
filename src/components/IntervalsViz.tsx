import {
  workoutStructureTimelineItems,
  workoutStructureTimelineSummary,
} from "@/components/workout-structure/workout-structure-timeline-items";
import { WorkoutStructureTimeline } from "@/components/workout-structure/WorkoutStructureTimeline";
import type { Workout } from "@/lib/training";

/* Horizontal block timeline of workout structure. */
export function IntervalsViz({ workout }: { workout: Workout }) {
  const blocks = workoutStructureTimelineItems(workout);

  return (
    <WorkoutStructureTimeline items={blocks} summary={workoutStructureTimelineSummary(blocks)} />
  );
}

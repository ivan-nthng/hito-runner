import { CalendarWorkoutPlayground } from "@/components/hito-ds/calendar-workout-playground";
import { HitoDsComponentControls } from "./reference-components-controls";
import { HitoDsComponentOverlays } from "./reference-components-overlays";
import { HitoDsComponentStructure } from "./reference-components-structure";

export function HitoDsComponentsPage() {
  return (
    <>
      <HitoDsComponentControls />
      <HitoDsComponentOverlays />
      <CalendarWorkoutPlayground />
      <HitoDsComponentStructure />
    </>
  );
}

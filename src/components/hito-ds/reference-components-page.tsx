import { CalendarWorkoutPlayground } from "@/components/hito-ds/calendar-workout-playground";
import { MotionSystemPlayground } from "@/components/hito-ds/motion-system-playground";
import { SliderPlayground } from "@/components/hito-ds/slider-playground";
import { HitoDsComponentControls } from "./reference-components-controls";
import { HitoDsComponentOverlays } from "./reference-components-overlays";
import { HitoDsComponentStructure } from "./reference-components-structure";

export function HitoDsComponentsPage() {
  return (
    <>
      <HitoDsComponentControls />
      <SliderPlayground />
      <HitoDsComponentOverlays />
      <MotionSystemPlayground />
      <CalendarWorkoutPlayground />
      <HitoDsComponentStructure />
    </>
  );
}

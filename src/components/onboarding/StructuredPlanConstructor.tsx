import type { Dispatch, FormEvent, ReactNode, RefObject, SetStateAction } from "react";
import type { RunnerFitnessLevel } from "@/lib/runner-training-preferences";
import { QuickSetupPlanSetupSections } from "./QuickSetupPlanSetupSections";
import type { StructuredConstructorState, WeekdayName } from "./onboarding-form-model";

interface StructuredPlanConstructorProps {
  formRef: RefObject<HTMLFormElement | null>;
  state: StructuredConstructorState;
  setState: {
    setAge: (value: string) => void;
    setWeightKg: (value: string) => void;
    setHeightCm: (value: string) => void;
    setFitnessLevel: (value: RunnerFitnessLevel) => void;
    setRecent5kTime: (value: string) => void;
    setRecent5kPace: (value: string) => void;
    setFixedRestDays: Dispatch<SetStateAction<WeekdayName[]>>;
    setRestDaysAnswered: (value: boolean) => void;
    setMaxRunningDaysPerWeek: (value: string) => void;
    setPreferredLongRunDay: (value: WeekdayName | "") => void;
    setStartDate: (value: string) => void;
  };
  isBusy: boolean;
  isConstructorReady: boolean;
  onSubmit: () => void;
  planPresetPanel?: ReactNode;
  quickSetupSections?: {
    includeBaseline?: boolean;
    includeRunningLevel?: boolean;
    includeTrainingSetup?: boolean;
    includeScheduleRhythm?: boolean;
    heartRateProfile?: ReactNode;
    firstSectionNumber?: number;
    firstSectionHasDivider?: boolean;
  };
}

export function StructuredPlanConstructor({
  formRef,
  state,
  setState,
  isBusy,
  isConstructorReady,
  onSubmit,
  planPresetPanel,
  quickSetupSections,
}: StructuredPlanConstructorProps) {
  return (
    <form
      ref={formRef}
      noValidate
      className="mt-6 grid gap-8 pb-28"
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!isConstructorReady || isBusy) {
          return;
        }

        onSubmit();
      }}
    >
      <QuickSetupPlanSetupSections state={state} setState={setState} {...quickSetupSections} />
      {planPresetPanel}
    </form>
  );
}

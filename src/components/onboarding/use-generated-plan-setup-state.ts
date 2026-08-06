import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import type { UserSettingsSummary } from "@/lib/user-settings-actions";
import type { StructuredConstructorState, WeekdayName } from "./onboarding-form-model";

type GeneratedPlanSetupSetters = {
  setAge: (value: string) => void;
  setWeightKg: (value: string) => void;
  setHeightCm: (value: string) => void;
  setFitnessLevel: (value: StructuredConstructorState["fitnessLevel"]) => void;
  setRecent5kTime: (value: string) => void;
  setRecent5kPace: (value: string) => void;
  setFixedRestDays: Dispatch<SetStateAction<WeekdayName[]>>;
  setMaxRunningDaysPerWeek: (value: string) => void;
  setPreferredLongRunDay: (value: WeekdayName | "") => void;
  setStartDate: (value: string) => void;
};

export function buildOnboardingGeneratedPlanSetupState(
  defaults: UserSettingsSummary | null | undefined,
): StructuredConstructorState {
  return {
    age: defaults?.age != null ? String(defaults.age) : "",
    weightKg: defaults?.weightKg != null ? String(defaults.weightKg) : "",
    heightCm: defaults?.heightCm != null ? String(defaults.heightCm) : "",
    fitnessLevel: defaults?.fitnessLevel ?? "running_regularly",
    recent5kTime: "",
    recent5kPace: "",
    fixedRestDays: defaults?.trainingPreferences?.blocked_days ?? [],
    maxRunningDaysPerWeek:
      defaults?.trainingPreferences?.max_running_days_per_week != null
        ? String(defaults.trainingPreferences.max_running_days_per_week)
        : "",
    preferredLongRunDay: defaults?.trainingPreferences?.preferred_long_run_day ?? "",
    startDate: "",
    planGoalChoice: "",
    planGoalCustomDistanceKm: "",
    planGoalCustomDistanceLabel: "",
    planGoalFinishTime: "",
    planGoalTargetDate: "",
    runnerComment: "",
  };
}

export function useGeneratedPlanSetupState(initialState: StructuredConstructorState) {
  const [state, setState] = useState(() => cloneSetupState(initialState));
  const updateField = useCallback(
    <Key extends keyof StructuredConstructorState>(
      key: Key,
      value: StructuredConstructorState[Key],
    ) => {
      setState((current) => (current[key] === value ? current : { ...current, [key]: value }));
    },
    [],
  );
  const setAge = useCallback((value: string) => updateField("age", value), [updateField]);
  const setWeightKg = useCallback((value: string) => updateField("weightKg", value), [updateField]);
  const setHeightCm = useCallback((value: string) => updateField("heightCm", value), [updateField]);
  const setFitnessLevel = useCallback(
    (value: StructuredConstructorState["fitnessLevel"]) => updateField("fitnessLevel", value),
    [updateField],
  );
  const setRecent5kTime = useCallback(
    (value: string) => updateField("recent5kTime", value),
    [updateField],
  );
  const setRecent5kPace = useCallback(
    (value: string) => updateField("recent5kPace", value),
    [updateField],
  );
  const setFixedRestDays = useCallback<Dispatch<SetStateAction<WeekdayName[]>>>((value) => {
    setState((current) => {
      const nextValue = typeof value === "function" ? value(current.fixedRestDays) : value;
      return current.fixedRestDays === nextValue
        ? current
        : { ...current, fixedRestDays: [...nextValue] };
    });
  }, []);
  const setMaxRunningDaysPerWeek = useCallback(
    (value: string) => updateField("maxRunningDaysPerWeek", value),
    [updateField],
  );
  const setPreferredLongRunDay = useCallback(
    (value: WeekdayName | "") => updateField("preferredLongRunDay", value),
    [updateField],
  );
  const setStartDate = useCallback(
    (value: string) => updateField("startDate", value),
    [updateField],
  );
  const setPlanGoalCustomDistanceKm = useCallback(
    (value: string) => updateField("planGoalCustomDistanceKm", value),
    [updateField],
  );
  const setPlanGoalCustomDistanceLabel = useCallback(
    (value: string) => updateField("planGoalCustomDistanceLabel", value),
    [updateField],
  );
  const setPlanGoalFinishTime = useCallback(
    (value: string) => updateField("planGoalFinishTime", value),
    [updateField],
  );
  const setPlanGoalTargetDate = useCallback(
    (value: string) => updateField("planGoalTargetDate", value),
    [updateField],
  );
  const setRunnerComment = useCallback(
    (value: string) => updateField("runnerComment", value),
    [updateField],
  );
  const selectPlanGoal = useCallback((value: StructuredConstructorState["planGoalChoice"]) => {
    setState((current) => ({
      ...current,
      planGoalChoice: value,
      ...(value === "custom"
        ? {}
        : {
            planGoalCustomDistanceKm: "",
            planGoalCustomDistanceLabel: "",
          }),
    }));
  }, []);
  const reset = useCallback((nextState: StructuredConstructorState) => {
    setState(cloneSetupState(nextState));
  }, []);
  const constructorSetters = useMemo<GeneratedPlanSetupSetters>(
    () => ({
      setAge,
      setWeightKg,
      setHeightCm,
      setFitnessLevel,
      setRecent5kTime,
      setRecent5kPace,
      setFixedRestDays,
      setMaxRunningDaysPerWeek,
      setPreferredLongRunDay,
      setStartDate,
    }),
    [
      setAge,
      setFixedRestDays,
      setFitnessLevel,
      setHeightCm,
      setMaxRunningDaysPerWeek,
      setPreferredLongRunDay,
      setRecent5kPace,
      setRecent5kTime,
      setStartDate,
      setWeightKg,
    ],
  );

  return {
    state,
    constructorSetters,
    reset,
    selectPlanGoal,
    setPlanGoalCustomDistanceKm,
    setPlanGoalCustomDistanceLabel,
    setPlanGoalFinishTime,
    setPlanGoalTargetDate,
    setRunnerComment,
  };
}

function cloneSetupState(state: StructuredConstructorState): StructuredConstructorState {
  return {
    ...state,
    fixedRestDays: [...state.fixedRestDays],
  };
}

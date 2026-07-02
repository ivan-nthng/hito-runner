import type { Step, WorkoutType } from "@/lib/training";

export type SignedOutPreviewWorkoutSeed = {
  id: string;
  dayOffset: number;
  week: number;
  phase: string;
  type: WorkoutType;
  title: string;
  notes: string | null;
  steps: Step[];
};

export const signedOutPreviewPlanSeed = {
  meta: {
    planName: "Hito Preview Week",
    createdFor: "Hito Runner",
    goal: "Compact signed-out preview used only when no authenticated saved plan is available.",
  },
  workouts: [
    {
      id: "preview-easy-run",
      dayOffset: 0,
      week: 1,
      phase: "Preview",
      type: "easy",
      title: "Easy run",
      notes: "A short conversational run to show the calendar preview shape.",
      steps: [
        {
          type: "run",
          duration_min: 35,
          target: {
            intensity: "Easy",
            hint: "Keep this relaxed and conversational.",
          },
        },
      ],
    },
    {
      id: "preview-rest-1",
      dayOffset: 1,
      week: 1,
      phase: "Preview",
      type: "rest",
      title: "Rest day",
      notes: "A simple recovery day in the signed-out preview.",
      steps: [],
    },
    {
      id: "preview-intervals",
      dayOffset: 2,
      week: 1,
      phase: "Preview",
      type: "quality",
      title: "Intro intervals",
      notes: "A child-first repeat set preview without storing a full sample plan.",
      steps: [
        {
          type: "warmup",
          duration_min: 10,
          target: {
            intensity: "Easy",
            hint: "Warm up gradually.",
          },
        },
        {
          type: "repeat",
          repeats: 4,
          children: [
            {
              type: "work",
              duration_min: 2,
              target: {
                rpe: 7,
                hint: "Controlled hard effort.",
              },
            },
            {
              type: "recover",
              duration_min: 2,
              target: {
                intensity: "Recovery",
                hint: "Walk or jog until breathing settles.",
              },
            },
          ],
        },
        {
          type: "cooldown",
          duration_min: 8,
          target: {
            intensity: "Easy",
            hint: "Cool down gently.",
          },
        },
      ],
    },
    {
      id: "preview-steady",
      dayOffset: 3,
      week: 1,
      phase: "Preview",
      type: "steady_or_easy",
      title: "Steady aerobic run",
      notes: "A preview of a moderate aerobic day.",
      steps: [
        {
          type: "run",
          duration_min: 40,
          target: {
            intensity: "Steady",
            hint: "Smooth effort, never forced.",
          },
        },
      ],
    },
    {
      id: "preview-rest-2",
      dayOffset: 4,
      week: 1,
      phase: "Preview",
      type: "rest",
      title: "Rest day",
      notes: "Keep the preview honest: not every day needs a workout.",
      steps: [],
    },
    {
      id: "preview-easy-shakeout",
      dayOffset: 5,
      week: 1,
      phase: "Preview",
      type: "easy",
      title: "Easy shakeout",
      notes: "A light run before the longer preview day.",
      steps: [
        {
          type: "run",
          duration_min: 30,
          target: {
            intensity: "Easy",
            hint: "Finish feeling like you could keep going.",
          },
        },
      ],
    },
    {
      id: "preview-long-run",
      dayOffset: 6,
      week: 1,
      phase: "Preview",
      type: "long_run",
      title: "Long run",
      notes: "A simple endurance day for the signed-out calendar preview.",
      steps: [
        {
          type: "run",
          duration_min: 65,
          target: {
            intensity: "Easy endurance",
            hint: "Stay patient and aerobic.",
          },
        },
      ],
    },
  ] satisfies SignedOutPreviewWorkoutSeed[],
} as const;

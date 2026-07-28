import {
  workoutDocumentExecutableDurationForSections,
  type WorkoutDocumentSection,
} from "@/lib/workout-document";

type TimedWorkout = {
  title: string;
  segments: readonly unknown[];
};

const writtenDurationValue =
  "(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|a|an|half|quarter)";
const writtenDurationClaimPattern = new RegExp(
  `\\b${writtenDurationValue}(?:[\\s-]+(?:and[\\s-]+)?${writtenDurationValue}){0,4}[\\s-]+(?:m|min|mins|minute|minutes|h|hr|hrs|hour|hours)\\b`,
  "i",
);

export type WorkoutDurationTitleIssue = {
  code: "title_duration_mismatch" | "title_duration_claim_ambiguous";
  path: string;
  message: string;
};

/**
 * A title may state one total elapsed duration. When it does, that visible fact
 * must match the canonical executable structure exactly; cues and targets are
 * intentionally outside this factual check.
 */
export function collectWorkoutDurationTitleIssues(
  workouts: readonly TimedWorkout[],
): WorkoutDurationTitleIssue[] {
  return workouts.flatMap((workout, index) => {
    const claim = readTitleDurationClaim(workout.title);
    const path = `planned_workouts.${index}.title`;

    if (claim.kind === "none") {
      return [];
    }

    if (claim.kind === "ambiguous") {
      return [
        {
          code: "title_duration_claim_ambiguous",
          path,
          message:
            "A workout title may state one total elapsed duration or omit timing; segment timing belongs in executable sections.",
        },
      ];
    }

    const executableDuration = workoutDocumentExecutableDurationForSections(
      workout.segments as WorkoutDocumentSection[],
    );

    return Math.abs(claim.minutes - executableDuration) < 0.001
      ? []
      : [
          {
            code: "title_duration_mismatch",
            path,
            message: `Title states ${formatMinutes(claim.minutes)}, but executable sections total ${formatMinutes(executableDuration)}.`,
          },
        ];
  });
}

export function assertWorkoutDurationTitleContract(workouts: readonly TimedWorkout[]) {
  const issue = collectWorkoutDurationTitleIssues(workouts)[0];

  if (issue) {
    throw new Error(`${issue.code}: ${issue.message}`);
  }
}

function readTitleDurationClaim(
  title: string,
): { kind: "none" } | { kind: "ambiguous" } | { kind: "total"; minutes: number } {
  // Clock, range, and written-number forms are visible duration claims but do not
  // carry the one exact total the canonical document can verify. Reject them
  // rather than allowing a factual title to bypass the executable-duration check.
  if (
    /\b\d{1,2}:[0-5]\d\b/.test(title) ||
    /\b\d+(?:\.\d+)?\s*(?:-|to)\s*\d+(?:\.\d+)?\s*(?:m|min|mins|minute|minutes|h|hr|hrs|hour|hours)\b/i.test(
      title,
    ) ||
    writtenDurationClaimPattern.test(title)
  ) {
    return { kind: "ambiguous" };
  }

  const matches = Array.from(
    title.matchAll(
      /(\d+(?:\.\d+)?)\s*-?\s*(?:h|hr|hrs|hour|hours)(?:\s*(\d+(?:\.\d+)?)\s*-?\s*(?:m|min|mins|minute|minutes))?|\b(\d+(?:\.\d+)?)\s*-?\s*(?:m|min|mins|minute|minutes)\b/gi,
    ),
  );

  if (matches.length === 0) {
    return { kind: "none" };
  }

  if (matches.length !== 1) {
    return { kind: "ambiguous" };
  }

  const match = matches[0];
  const hours = match[1] ? Number(match[1]) : 0;
  const minutes = match[1] ? Number(match[2] ?? 0) : Number(match[3]);
  const total = hours * 60 + minutes;

  return Number.isFinite(total) && total > 0
    ? { kind: "total", minutes: total }
    : { kind: "ambiguous" };
}

function formatMinutes(minutes: number) {
  return Number.isInteger(minutes) ? `${minutes} min` : `${minutes.toFixed(1)} min`;
}

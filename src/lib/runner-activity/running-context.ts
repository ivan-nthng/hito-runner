import type { Json } from "@/lib/supabase/database";

const RUNNER_ACTIVITY_RUNNING_CONTEXTS = Object.freeze([
  "road",
  "outdoor_road_flat_rolling",
  "outdoor_road_hilly",
  "track",
  "treadmill",
  "trail_mountain",
] as const);

type RunnerActivityRunningContext = (typeof RUNNER_ACTIVITY_RUNNING_CONTEXTS)[number];

export function readRunnerActivityRunningContext(value: Json): RunnerActivityRunningContext | null {
  const summary = jsonRecord(value);
  const stored = runningContextOrNull(summary?.running_context);
  return stored ?? runningContextFromGarminSummaryPayload(summary?.summary_payload);
}

export function runningContextFromGarminSummaryPayload(value: Json | undefined) {
  const payload = jsonRecord(value);
  const session = jsonRecord(payload?.session);
  const subSport =
    typeof session?.subSport === "string" ? session.subSport.trim().toLowerCase() : "";

  switch (subSport) {
    case "street":
    case "road":
      return "road" as const;
    case "track":
      return "track" as const;
    case "treadmill":
    case "indoor_running":
      return "treadmill" as const;
    case "trail":
    case "mountain":
      return "trail_mountain" as const;
    default:
      return null;
  }
}

function runningContextOrNull(value: Json | undefined): RunnerActivityRunningContext | null {
  return typeof value === "string" &&
    (RUNNER_ACTIVITY_RUNNING_CONTEXTS as readonly string[]).includes(value)
    ? (value as RunnerActivityRunningContext)
    : null;
}

function jsonRecord(value: Json | undefined) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, Json | undefined>)
    : null;
}

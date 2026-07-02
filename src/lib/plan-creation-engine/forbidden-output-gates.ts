import type { RunningPlanEngineSourceModel } from "@/lib/plan-creation-engine/source-types";

export const forbiddenOutputGates: RunningPlanEngineSourceModel["forbiddenOutputGates"] = [
  {
    gateId: "no_generic_selected_distance_endpoint",
    description: "Selected 10K and Half plans must not finish on generic long/easy/recovery rows.",
    rejectedSignals: [
      "final long_aerobic_run",
      "final easy_aerobic_run",
      "final recovery_jog",
      "metadata-only endpoint",
    ],
    failureAction: "reject_before_review",
  },
  {
    gateId: "no_readiness_only_half_endpoint",
    description: "Half plans must not substitute readiness-only labels for a real 21.1K endpoint.",
    rejectedSignals: ["half_readiness_marker", "readiness-only endpoint"],
    failureAction: "reject_before_review",
  },
  {
    gateId: "no_rest_endpoint",
    description: "No selected-distance or base endpoint may be a rest row.",
    rejectedSignals: ["rest_and_recovery", "final rest day"],
    failureAction: "reject_before_review",
  },
  {
    gateId: "no_vague_effort_only_primary_prescription",
    description: "Effort and cues may explain intent but cannot replace numeric segment structure.",
    rejectedSignals: [
      "Effort: threshold steady",
      "Tempo feel",
      "Run by feel with no duration or distance",
      "cue-only primary prescription",
    ],
    failureAction: "reject_before_review",
  },
  {
    gateId: "no_fake_precise_pace",
    description:
      "Normal v1 plan creation must not invent precise pace from target time or ambition.",
    rejectedSignals: ["pace from target time alone", "pace from stale benchmark doctrine"],
    failureAction: "reject_before_review",
  },
  {
    gateId: "no_fake_personal_hr",
    description: "Editable default HR guidance must not be framed as personal HR-zone truth.",
    rejectedSignals: ["your personal HR zone", "measured threshold truth", "lab-tested HR zone"],
    failureAction: "reject_before_review",
  },
  {
    gateId: "no_old_runner_level_labels",
    description: "The rebuilt engine uses the four accepted runner level ids only.",
    rejectedSignals: [
      "beginner",
      "new_runner",
      "new_to_running",
      "recreational",
      "advanced",
      "performance_focused",
    ],
    failureAction: "reject_before_review",
  },
  {
    gateId: "no_5k_benchmark_normal_path_dependency",
    description: "Normal happy path must not require a user-provided 5K benchmark.",
    rejectedSignals: ["missing recent 5K benchmark", "benchmark_required"],
    failureAction: "route_to_custom",
  },
  {
    gateId: "no_watch_choice_gate",
    description:
      "Supported normal creation assumes watch/app execution and does not expose no-watch.",
    rejectedSignals: ["missing_watch_app_support", "watchAccess none", "no-watch selectable path"],
    failureAction: "reject_before_review",
  },
  {
    gateId: "no_goal_intent_as_executable_target",
    description:
      "Plan goal intent may carry target date, finish time, or outcome pace, but it must not become executable workout pace or HR target truth.",
    rejectedSignals: [
      "target time unlocks pace",
      "outcome pace copied to segments",
      "goal intent creates HR targets",
    ],
    failureAction: "route_to_custom",
  },
] as const;

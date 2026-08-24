import type { WorkoutFeedbackMarkerSummary } from "@/lib/workout-result-import/types";

export type WorkoutFeedbackMarkerPresentation =
  | {
      state: "evidence_attached";
      label: "Evidence attached";
      shortLabel: "Evidence";
    }
  | {
      state: "feedback_ready";
      label: "Feedback ready";
      shortLabel: "Feedback";
    };

export function feedbackMarkerMeta(
  marker: WorkoutFeedbackMarkerSummary | null,
): WorkoutFeedbackMarkerPresentation | null {
  if (!marker) {
    return null;
  }

  switch (marker.state) {
    case "evidence_attached":
      return {
        state: marker.state,
        label: "Evidence attached",
        shortLabel: "Evidence",
      };
    case "feedback_ready":
      return {
        state: marker.state,
        label: "Feedback ready",
        shortLabel: "Feedback",
      };
  }
}

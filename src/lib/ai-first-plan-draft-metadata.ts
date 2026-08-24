import type { TrainingPlanV2 } from "@/lib/imported-plan";
import type {
  AiAuthoredBlueprintReviewConflict,
  AiAuthoredBlueprintSummary,
} from "@/lib/ai-authored-plan-first-compiler";

export type AiFirstPlanDraftNormalizationIssue = {
  code: string;
  message: string;
  path?: string;
};

export interface AiFirstPlanDraftMetadata {
  status: "ai_authored" | "plan_first_unavailable";
  source: "openai_adaptive_blueprint_four_week_draft";
  validationIssues: string[];
}

export type AiFirstPlanDraftNormalizationResult =
  | {
      ok: true;
      canonicalPlan: TrainingPlanV2;
      blueprint: AiAuthoredBlueprintSummary;
      reviewConflicts: AiAuthoredBlueprintReviewConflict[];
      metadata: AiFirstPlanDraftMetadata;
    }
  | {
      ok: false;
      reason: string;
      issues: AiFirstPlanDraftNormalizationIssue[];
    };

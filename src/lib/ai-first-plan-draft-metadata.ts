import type { TrainingPlanV2 } from "@/lib/imported-plan";

export type AiFirstPlanDraftNormalizationIssue = {
  code: string;
  message: string;
  path?: string;
};

export interface AiFirstPlanDraftMetadata {
  status: "ai_authored" | "plan_first_unavailable";
  source: "openai_ai_authored_full_plan_draft";
  validationIssues: string[];
}

export type AiFirstPlanDraftNormalizationResult =
  | {
      ok: true;
      canonicalPlan: TrainingPlanV2;
      metadata: AiFirstPlanDraftMetadata;
    }
  | {
      ok: false;
      reason: string;
      issues: AiFirstPlanDraftNormalizationIssue[];
    };

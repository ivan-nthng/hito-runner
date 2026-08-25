import { Icon } from "@/components/ui/icon";
import { useHitoProductMessage } from "@/components/ui/hito-ui-locale-provider";

const GENERATED_PLAN_WAITING_LINES = [
  "Checking the calendar for room to breathe.",
  "Consulting an imaginary committee about comfortable socks.",
  "Definitely not calling your friends for pace advice.",
  "Making sure the long run gets the good socks.",
] as const;

export function GeneratedPlanPreviewLoadingState({
  complete,
  goalLabel,
}: {
  complete: boolean;
  goalLabel: string;
}) {
  const t = useHitoProductMessage();

  return (
    <div
      className="hito-generated-plan-wait"
      aria-busy={complete ? undefined : "true"}
      data-complete={complete || undefined}
    >
      <div className="hito-generated-plan-wait-marker" aria-hidden="true">
        <Icon name={complete ? "check" : "workout"} size="lg" />
      </div>

      <div className="grid max-w-lg gap-2">
        <p className="hito-ui-title-sm text-foreground">
          {complete
            ? t("Plan preview ready")
            : t("Preparing your {goal} plan", { goal: goalLabel })}
        </p>
      </div>

      <div className="hito-generated-plan-wait-progress hito-ui-progress-track" aria-hidden="true">
        <span className="hito-generated-plan-wait-progress-fill hito-ui-progress-fill" />
      </div>

      <div className="hito-generated-plan-wait-lines hito-body-xs text-tertiary" aria-hidden="true">
        {GENERATED_PLAN_WAITING_LINES.map((line) => (
          <span key={line}>{t(line)}</span>
        ))}
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {complete
          ? t("Plan preview ready for review.")
          : t("Preparing your {goal} plan.", { goal: goalLabel })}
      </p>
    </div>
  );
}

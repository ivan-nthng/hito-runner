import { useState } from "react";
import type {
  LocalNotionCaptureInput,
  LocalNotionCaptureKind,
  LocalNotionSubmission,
} from "@/components/devtools/local-notion-task-client";
import { submitLocalNotionCapture } from "@/components/devtools/local-notion-task-client";
import { Icon, type HitoIconName } from "@/components/ui/icon";

type SubmissionState =
  | { status: "idle" }
  | { kind: LocalNotionCaptureKind; status: "submitting" }
  | { kind: LocalNotionCaptureKind; result: LocalNotionSubmission; status: "submitted" }
  | { kind: LocalNotionCaptureKind; message: string; status: "failed" };

const ACTIONS: Array<{
  icon: HitoIconName;
  kind: LocalNotionCaptureKind;
  label: string;
}> = [
  { icon: "file-text", kind: "task", label: "Task" },
  { icon: "warning", kind: "bug", label: "Bug" },
  { icon: "typography", kind: "content_bug", label: "Content bug" },
];

export function LocalNotionSubmissionActions({
  buildCapture,
  disabled = false,
}: {
  buildCapture: (kind: LocalNotionCaptureKind) => LocalNotionCaptureInput;
  disabled?: boolean;
}) {
  const [submission, setSubmission] = useState<SubmissionState>({ status: "idle" });
  const pending = submission.status === "submitting";

  const submit = async (kind: LocalNotionCaptureKind) => {
    if (disabled || pending) return;
    setSubmission({ kind, status: "submitting" });
    try {
      const result = await submitLocalNotionCapture(buildCapture(kind));
      setSubmission({ kind, result, status: "submitted" });
    } catch (error) {
      setSubmission({
        kind,
        message:
          error instanceof Error
            ? error.message
            : "Notion could not accept the capture. The local draft is unchanged.",
        status: "failed",
      });
    }
  };

  return (
    <div className="grid min-w-0 gap-2" data-local-notion-submission-actions="">
      <p className="hito-body-xs text-foreground">Send to Notion</p>
      <div className="grid min-w-0 grid-cols-1 gap-1.5 sm:grid-cols-3">
        {ACTIONS.map((action) => {
          const isSubmitting =
            submission.status === "submitting" && submission.kind === action.kind;
          return (
            <button
              key={action.kind}
              type="button"
              className="hito-button hito-button-secondary hito-button-sm min-w-0 justify-center px-2"
              disabled={disabled || pending}
              onClick={() => void submit(action.kind)}
            >
              <Icon name={isSubmitting ? "loader" : action.icon} size="xs" />
              {isSubmitting ? "Sending…" : action.label}
            </button>
          );
        })}
      </div>
      <div className="hito-body-xs min-h-4" aria-live="polite">
        {submission.status === "submitted" ? (
          <a
            className="inline-flex items-center gap-1 text-success underline-offset-2 hover:underline"
            href={submission.result.pageUrl}
            rel="noreferrer"
            target="_blank"
          >
            <Icon name="check" size="xs" />
            {submission.result.deduplicated ? "Existing" : "Created"}{" "}
            {submission.result.hitoId ?? "Notion task"}
          </a>
        ) : submission.status === "failed" ? (
          <span className="text-warn">{submission.message}</span>
        ) : submission.status === "submitting" ? (
          <span className="text-tertiary">Submitting one explicit capture…</span>
        ) : (
          <span className="text-tertiary">Nothing is sent until you choose a type.</span>
        )}
      </div>
    </div>
  );
}

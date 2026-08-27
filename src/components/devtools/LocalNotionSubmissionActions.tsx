import { useEffect, useRef, useState } from "react";
import type {
  LocalNotionCaptureInput,
  LocalNotionCaptureKind,
  LocalNotionSubmission,
} from "@/components/devtools/local-notion-task-client";
import { submitLocalNotionCapture } from "@/components/devtools/local-notion-task-client";
import { HitoButton } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon, type HitoIconName } from "@/components/ui/icon";

export type LocalPromptCopyState = "idle" | "copying" | "copied" | "copy_failed";

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
  copyState,
  disabled = false,
  onCopyPrompt,
}: {
  buildCapture: (kind: LocalNotionCaptureKind) => LocalNotionCaptureInput;
  copyState: LocalPromptCopyState;
  disabled?: boolean;
  onCopyPrompt: () => void;
}) {
  const [submission, setSubmission] = useState<SubmissionState>({ status: "idle" });
  const [menuOpen, setMenuOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const pending = submission.status === "submitting";

  useEffect(() => {
    if (!menuOpen) return;

    const closeNestedMenuOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      const target = event.target;
      if (!(target instanceof Element) || !target.closest("[data-local-notion-submission-menu]")) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      setMenuOpen(false);
      window.requestAnimationFrame(() => menuTriggerRef.current?.focus({ preventScroll: true }));
    };

    window.addEventListener("keydown", closeNestedMenuOnEscape, true);
    return () => window.removeEventListener("keydown", closeNestedMenuOnEscape, true);
  }, [menuOpen]);

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
      <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild disabled={disabled || pending}>
            <HitoButton
              ref={menuTriggerRef}
              type="button"
              className="w-full justify-center"
              disabled={disabled || pending}
              feedback={
                submission.status === "submitted"
                  ? "success"
                  : submission.status === "failed"
                    ? "error"
                    : undefined
              }
              loading={pending}
              size="sm"
              variant="primary"
            >
              <Icon
                aria-hidden="true"
                className={pending ? "hito-motion-spinner" : undefined}
                name={pending ? "loader" : "file-up"}
                size="xs"
              />
              {pending ? "Sending…" : "Send to Notion"}
              {!pending ? <Icon aria-hidden="true" name="chevron-down" size="xs" /> : null}
            </HitoButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="z-[94] min-w-48"
            data-local-ui-inspector-layer=""
            data-local-notion-submission-menu=""
          >
            {ACTIONS.map((action) => (
              <DropdownMenuItem
                key={action.kind}
                disabled={disabled || pending}
                onSelect={() => void submit(action.kind)}
              >
                <Icon aria-hidden="true" name={action.icon} size="xs" />
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <HitoButton
          type="button"
          className="w-full justify-center"
          disabled={disabled || copyState === "copying"}
          feedback={
            copyState === "copied" ? "success" : copyState === "copy_failed" ? "error" : undefined
          }
          loading={copyState === "copying"}
          onClick={onCopyPrompt}
          size="sm"
          variant="secondary"
        >
          <Icon
            aria-hidden="true"
            className={copyState === "copying" ? "hito-motion-spinner" : undefined}
            name={
              copyState === "copied"
                ? "check"
                : copyState === "copy_failed"
                  ? "warning"
                  : copyState === "copying"
                    ? "loader"
                    : "copy"
            }
            size="xs"
          />
          {copyState === "copying" ? "Copying…" : copyState === "copied" ? "Copied" : "Copy prompt"}
        </HitoButton>
      </div>
      <div className="hito-body-xs min-h-4" aria-live="polite">
        {submission.status === "submitted" ? (
          <span className="inline-flex min-w-0 flex-wrap items-center gap-1 text-success">
            <Icon aria-hidden="true" name="check" size="xs" />
            {submission.result.deduplicated ? "Already exists" : "Created"}{" "}
            {submission.result.hitoId ?? "Notion task"}
            <span aria-hidden="true">·</span>
            <a
              className="underline underline-offset-2"
              href={submission.result.pageUrl}
              rel="noreferrer"
              target="_blank"
            >
              Open
            </a>
          </span>
        ) : submission.status === "failed" ? (
          <span className="text-warn" title={submission.message}>
            Couldn’t send. Draft preserved.
          </span>
        ) : submission.status === "submitting" ? (
          <span className="text-tertiary">Sending one explicit capture…</span>
        ) : (
          <span className="text-tertiary">Nothing is sent until you choose a type.</span>
        )}
      </div>
    </div>
  );
}

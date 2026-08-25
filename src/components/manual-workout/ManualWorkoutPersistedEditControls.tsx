import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { HitoButton } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { useHitoProductMessage, useHitoUiLocale } from "@/components/ui/hito-ui-locale-provider";
import { hitoToast } from "@/components/ui/hito-toast";
import { ManualWorkoutEditorDialogHeader } from "@/components/manual-workout/ManualWorkoutEditorDialogHeader";
import { WorkoutDocumentEditor } from "@/components/manual-workout/WorkoutDocumentEditor";
import {
  applyWorkoutEditorReview,
  createWorkoutEditorState,
  editWorkoutEditorDocument,
  type WorkoutEditorState,
} from "@/components/manual-workout/workout-editor-state";
import { formatReadableDate } from "@/components/manual-workout/manual-workout-authoring-utils";
import {
  confirmWorkoutCommandAction,
  initializeWorkoutDocumentAction,
  reviewWorkoutCommandAction,
} from "@/lib/manual-workout-authoring";
import { getHitoKnownProductMessage } from "@/lib/ui-locale-messages";

const TOAST_ID = "manual-workout-persisted-edit";

export function ManualWorkoutPersistedEditDialog({
  onEdited,
  onOpenChange,
  open,
  plannedWorkoutId,
  title,
  workoutDate,
}: {
  provenancePlanId: string | null | undefined;
  onEdited: () => void | Promise<void>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  plannedWorkoutId: string;
  prepareSignal?: number;
  title: string;
  workoutDate: string;
}) {
  const locale = useHitoUiLocale();
  const t = useHitoProductMessage();
  const initializeDocument = useServerFn(initializeWorkoutDocumentAction);
  const reviewCommand = useServerFn(reviewWorkoutCommandAction);
  const confirmCommand = useServerFn(confirmWorkoutCommandAction);
  const initializedForRef = useRef<string | null>(null);
  const [editor, setEditor] = useState<WorkoutEditorState | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open || initializedForRef.current === plannedWorkoutId) return;
    let active = true;
    initializedForRef.current = plannedWorkoutId;
    setMessage(null);
    void initializeDocument({ data: { origin: "calendar", workoutId: plannedWorkoutId } })
      .then((result) => {
        if (!active) return;
        if (!result.ok) return setMessage(result.message);
        if (result.origin !== "calendar")
          return setMessage(t("The Calendar returned an unsupported editor initializer."));
        setEditor(
          createWorkoutEditorState({
            mode: "edit",
            origin: "calendar",
            document: result.document,
            expectedFingerprint: result.expectedFingerprint,
            provenanceReference: result.provenanceReference,
          }),
        );
      })
      .catch((error: unknown) => {
        if (active)
          setMessage(
            error instanceof Error
              ? error.message
              : t("This workout could not be opened for editing."),
          );
      });
    return () => {
      active = false;
    };
  }, [initializeDocument, open, plannedWorkoutId, t]);

  const close = () => {
    if (editor?.phase === "reviewing" || editor?.phase === "confirming") return;
    initializedForRef.current = null;
    setEditor(null);
    setMessage(null);
    onOpenChange(false);
  };
  const review = async () => {
    if (!editor || !editor.expectedFingerprint) return;
    setEditor({ ...editor, phase: "reviewing", issues: [] });
    const result = await reviewCommand({
      data: {
        operation: "replace_document",
        workoutId: plannedWorkoutId,
        document: editor.document,
        expectedFingerprint: editor.expectedFingerprint,
        provenanceReference: editor.provenanceReference,
      },
    });
    setEditor(
      result.ok
        ? applyWorkoutEditorReview(editor, result.candidate)
        : { ...editor, phase: "blocked", issues: result.issues.map((issue) => issue.message) },
    );
  };
  const confirm = async () => {
    if (!editor?.candidate) return;
    const candidate = editor.candidate;
    setEditor({ ...editor, phase: "confirming" });
    try {
      const result = await confirmCommand({
        data: {
          command: candidate.command,
          candidateId: candidate.candidateId,
          reviewToken: candidate.reviewToken,
          reviewChecksum: candidate.reviewChecksum,
        },
      });
      if (!result.ok) return setEditor({ ...editor, phase: "blocked", issues: [result.message] });
      hitoToast.success({
        id: TOAST_ID,
        title: t("Workout updated"),
        description: t("Refreshing from saved Calendar truth."),
      });
      close();
      await onEdited();
    } catch (error) {
      setEditor({
        ...editor,
        phase: "blocked",
        issues: [error instanceof Error ? error.message : t("This workout could not be updated.")],
      });
    }
  };
  const busy = editor?.phase === "reviewing" || editor?.phase === "confirming";
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
    >
      <DialogContent
        className="hito-dialog-stable hito-product-dialog hito-dialog-surface-product hito-dialog-size-workflow hito-dialog-height-workflow"
        overlayClassName="hito-dialog-overlay-stable"
      >
        <ManualWorkoutEditorDialogHeader
          dateLabel={formatReadableDate(workoutDate, locale)}
          statusLabel={editor?.candidate ? t("Reviewed") : t("Draft")}
          title={editor?.document.title ?? title}
        />
        <div className="hito-product-dialog-body-scroll-fill">
          {editor ? (
            <WorkoutDocumentEditor
              document={editor.document}
              readOnly={Boolean(editor.candidate)}
              onChange={(document) => setEditor(editWorkoutEditorDocument(editor, document))}
            />
          ) : null}
          {message ? (
            <p className="hito-body-md text-negative" role="alert">
              {getHitoKnownProductMessage(locale, message)}
            </p>
          ) : null}
          {editor?.issues.map((issue) => (
            <p key={issue} className="hito-body-md text-negative" role="alert">
              {getHitoKnownProductMessage(locale, issue)}
            </p>
          ))}
        </div>
        <DialogFooter className="hito-product-dialog-footer sm:space-x-0">
          <HitoButton type="button" size="md" variant="secondary" disabled={busy} onClick={close}>
            {t("Close")}
          </HitoButton>
          {editor?.candidate ? (
            <HitoButton
              type="button"
              size="md"
              variant="primary"
              loading={editor.phase === "confirming"}
              disabled={busy}
              onClick={() => void confirm()}
            >
              {t("Save workout")}
            </HitoButton>
          ) : (
            <HitoButton
              type="button"
              size="md"
              variant="primary"
              loading={editor?.phase === "reviewing"}
              disabled={!editor || busy || editor.issues.length > 0}
              onClick={() => void review()}
            >
              {t("Review workout")}
            </HitoButton>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

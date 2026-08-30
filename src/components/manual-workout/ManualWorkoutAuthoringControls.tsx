import { type ReactNode, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { HitoButton } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkoutGlyph } from "@/components/WorkoutGlyph";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { hitoToast } from "@/components/ui/hito-toast";
import { CALENDAR_ICON_KEY_VALUES, type CalendarIconKey } from "@/lib/rich-workout-model";
import {
  confirmWorkoutCommandAction,
  deleteManualWorkoutSavedTemplate,
  hideManualWorkoutBuiltInTemplate,
  listManualWorkoutTemplateCatalog,
  initializeWorkoutDocumentAction,
  restoreAllManualWorkoutBuiltInTemplates,
  restoreManualWorkoutBuiltInTemplate,
  reviewWorkoutCommandAction,
} from "@/lib/manual-workout-authoring";
import type {
  ManualWorkoutSavedTemplateView,
  ManualWorkoutMoveTargetDayKind,
} from "@/lib/manual-workout-authoring";
import { type ManualWorkoutTemplate } from "@/lib/manual-workout-authoring/templates";
import type { WorkoutGlyphKind } from "@/lib/workout-glyph";
import {
  formatReadableDate,
  templateRunnerFacingLabel,
} from "@/components/manual-workout/manual-workout-authoring-utils";
import { WorkoutDocumentEditor } from "@/components/manual-workout/WorkoutDocumentEditor";
import {
  applyWorkoutEditorReview,
  createWorkoutEditorState,
  editWorkoutEditorDocument,
  type WorkoutEditorState,
} from "@/components/manual-workout/workout-editor-state";
import { ManualWorkoutEditorDialogHeader } from "@/components/manual-workout/ManualWorkoutEditorDialogHeader";
import { focusManualWorkoutDialogCloseOnOpen } from "@/components/manual-workout/manual-workout-dialog-focus";
import {
  MANUAL_COPY_PASTE_TOAST_ID,
  type ManualCopiedWorkoutSource,
} from "@/components/manual-workout/ManualWorkoutSourceActionMenu";
import {
  EMPTY_TEMPLATE_CATALOG_STATE,
  type ManualTemplateCatalogState,
} from "@/components/manual-workout/ManualWorkoutTemplatePicker.model";
import { ManualTemplatePickerDialog } from "@/components/manual-workout/ManualWorkoutTemplatePicker";
import { useHitoProductMessage, useHitoUiLocale } from "@/components/ui/hito-ui-locale-provider";
import { getHitoKnownProductMessage } from "@/lib/ui-locale-messages";
import type { ResolvedUiLocale } from "@/lib/ui-locale";

export { ManualWorkoutSourceActionMenu } from "@/components/manual-workout/ManualWorkoutSourceActionMenu";
export type { ManualCopiedWorkoutSource } from "@/components/manual-workout/ManualWorkoutSourceActionMenu";

export type ManualDraftStatus = "idle" | "reviewing" | "creating";

export type ManualDraftSelection =
  | {
      kind: "registry";
      date: string;
      template: ManualWorkoutTemplate;
    }
  | {
      kind: "scratch";
      date: string;
      template: ManualWorkoutTemplate | null;
    }
  | {
      kind: "saved";
      date: string;
      template: ManualWorkoutSavedTemplateView;
    };

export type ManualSaveTemplateRequest = {
  displayName: string;
  iconKey: CalendarIconKey;
};

const MANUAL_ADD_TOAST_ID = "manual-calendar-add";
const MANUAL_TEMPLATE_CATALOG_TOAST_ID = "manual-template-catalog";
const PASTE_UNAVAILABLE_MESSAGE =
  "Hito could not paste this workout yet. Try again from the calendar.";

export function ManualWorkoutAddMenu({
  children,
  copiedWorkoutSource = null,
  date,
  disabled = false,
  onAddActivity,
  onAdded,
  onMoveCanceled,
  onMoveTargetSelected,
  moveTargetDayKind = "rest_day",
  moveWorkoutSource = null,
  moveOnly = false,
  pasteTargetIsEmpty = false,
  showWorkoutOptions = true,
}: {
  children: ReactNode;
  copiedWorkoutSource?: ManualCopiedWorkoutSource | null;
  date: string;
  disabled?: boolean;
  onAddActivity?: (trigger: HTMLButtonElement) => void;
  onAdded: () => void | Promise<void>;
  onMoveCanceled?: () => void;
  onMoveTargetSelected?: (targetDate: string, source?: ManualCopiedWorkoutSource | null) => void;
  moveTargetDayKind?: ManualWorkoutMoveTargetDayKind;
  moveWorkoutSource?: ManualCopiedWorkoutSource | null;
  moveOnly?: boolean;
  pasteTargetIsEmpty?: boolean;
  showWorkoutOptions?: boolean;
}) {
  const locale = useHitoUiLocale();
  const t = useHitoProductMessage();
  const pasteUnavailableMessage = t(PASTE_UNAVAILABLE_MESSAGE);
  const initializeWorkoutDocumentFn = useServerFn(initializeWorkoutDocumentAction);
  const reviewWorkoutCommandFn = useServerFn(reviewWorkoutCommandAction);
  const confirmWorkoutCommandFn = useServerFn(confirmWorkoutCommandAction);
  const deleteManualWorkoutSavedTemplateFn = useServerFn(deleteManualWorkoutSavedTemplate);
  const hideManualWorkoutBuiltInTemplateFn = useServerFn(hideManualWorkoutBuiltInTemplate);
  const listManualWorkoutTemplateCatalogFn = useServerFn(listManualWorkoutTemplateCatalog);
  const restoreAllManualWorkoutBuiltInTemplatesFn = useServerFn(
    restoreAllManualWorkoutBuiltInTemplates,
  );
  const restoreManualWorkoutBuiltInTemplateFn = useServerFn(restoreManualWorkoutBuiltInTemplate);
  const addMenuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const confirmInFlightRef = useRef(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [constructorOpen, setConstructorOpen] = useState(false);
  const [selection, setSelection] = useState<ManualDraftSelection | null>(null);
  const [editorState, setEditorState] = useState<WorkoutEditorState | null>(null);
  const [status, setStatus] = useState<ManualDraftStatus>("idle");
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);
  const [templateCatalogState, setTemplateCatalogState] = useState<ManualTemplateCatalogState>(
    EMPTY_TEMPLATE_CATALOG_STATE,
  );
  const [templateCatalogAction, setTemplateCatalogAction] = useState<string | null>(null);
  const isBusy = status !== "idle";
  const canPasteCopiedWorkout = Boolean(copiedWorkoutSource && pasteTargetIsEmpty);
  const canMoveSelectedWorkout = Boolean(
    moveWorkoutSource && moveWorkoutSource.sourceWorkoutDate !== date,
  );

  const openConstructorDialog = () => {
    setAddMenuOpen(false);

    if (typeof window === "undefined") {
      setConstructorOpen(true);
      return;
    }

    window.requestAnimationFrame(() => setConstructorOpen(true));
  };

  const openConstructor = (template: ManualWorkoutTemplate) => {
    setSelection({ kind: "registry", date, template });
    setConfirmMessage(null);
    openConstructorDialog();
    void initializeEditor({
      origin: "built_in",
      templateKey: template.templateKey,
      workoutDate: date,
    });
  };

  const openScratchConstructor = () => {
    if (!templateCatalogState.catalog) {
      openTemplatePickerDialog();
      return;
    }

    setSelection({ kind: "scratch", date, template: null });
    setConfirmMessage(null);
    openConstructorDialog();
    void initializeEditor({ origin: "scratch", workoutDate: date });
  };

  const openTemplatePickerDialog = () => {
    setAddMenuOpen(false);

    if (templateCatalogState.status === "idle" || templateCatalogState.status === "failed") {
      void loadTemplateCatalog();
    }

    if (typeof window === "undefined") {
      setTemplatePickerOpen(true);
      return;
    }

    window.requestAnimationFrame(() => setTemplatePickerOpen(true));
  };

  const handleAddMenuOpenChange = (open: boolean) => {
    setAddMenuOpen(open);
    if (
      open &&
      showWorkoutOptions &&
      (templateCatalogState.status === "idle" || templateCatalogState.status === "failed")
    ) {
      void loadTemplateCatalog();
    }
  };

  const initializeEditor = async (
    input:
      | { origin: "scratch"; workoutDate: string }
      | {
          origin: "built_in";
          templateKey: ManualWorkoutTemplate["templateKey"];
          workoutDate: string;
        }
      | { origin: "saved_template"; templateId: string; workoutDate: string },
  ) => {
    setEditorState(null);
    try {
      const result = await initializeWorkoutDocumentFn({ data: input });
      if (!result.ok) return setConfirmMessage(result.message);
      if (result.origin === "calendar")
        return setConfirmMessage(t("The Calendar initializer cannot open a create flow."));
      setEditorState(
        createWorkoutEditorState({
          mode: "create",
          origin: result.origin,
          document: result.document,
          provenanceReference: result.provenanceReference,
        }),
      );
    } catch (error) {
      setConfirmMessage(
        error instanceof Error ? error.message : t("The workout could not be initialized."),
      );
    }
  };

  const loadTemplateCatalog = async () => {
    setTemplateCatalogState((current) => ({
      status: "loading",
      catalog: current.catalog,
      message: null,
    }));

    try {
      const result = await listManualWorkoutTemplateCatalogFn({ data: undefined });
      if (!result?.ok) {
        setTemplateCatalogState({
          status: "failed",
          catalog: null,
          message: result?.message ?? t("Workout templates are not available right now."),
        });
        return;
      }

      setTemplateCatalogState({
        status: "ready",
        catalog: result,
        message: null,
      });
    } catch (error) {
      setTemplateCatalogState({
        status: "failed",
        catalog: null,
        message:
          error instanceof Error ? error.message : t("Workout templates could not be loaded."),
      });
    }
  };

  const submitReview = async () => {
    if (!editorState || status !== "idle") return;
    setStatus("reviewing");
    setConfirmMessage(null);
    hitoToast.working({
      id: MANUAL_ADD_TOAST_ID,
      title: t("Reviewing workout"),
      description: t("Hito is validating the manual draft before anything is saved."),
    });

    try {
      const result = await reviewWorkoutCommandFn({
        data: {
          operation: "materialize",
          documents: [editorState.document],
          provenanceReferences: [editorState.provenanceReference],
        },
      });
      setStatus("idle");
      if (!result.ok) {
        setEditorState({
          ...editorState,
          phase: "blocked",
          issues: result.issues.map((issue) => issue.message),
        });
        hitoToast.error({
          id: MANUAL_ADD_TOAST_ID,
          title: t("Workout needs changes"),
          description: result.issues[0]?.message ?? t("The workout could not be reviewed."),
        });
        return;
      }
      setEditorState(applyWorkoutEditorReview(editorState, result.candidate));
      hitoToast.success({
        id: MANUAL_ADD_TOAST_ID,
        title: t("Workout reviewed"),
        description: t("Check the reviewed workout before adding it to the Calendar."),
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("Could not review this manual workout yet.");
      setStatus("idle");
      setEditorState({ ...editorState, phase: "blocked", issues: [message] });
      hitoToast.error({
        id: MANUAL_ADD_TOAST_ID,
        title: t("Review failed"),
        description: message,
      });
    }
  };

  const openSavedTemplate = (template: ManualWorkoutSavedTemplateView) => {
    const nextSelection: ManualDraftSelection = { kind: "saved", date, template };
    setSelection(nextSelection);
    setConfirmMessage(null);
    openConstructorDialog();
    void initializeEditor({ origin: "saved_template", templateId: template.id, workoutDate: date });
  };

  const saveReviewedTemplate = async ({
    displayName,
    iconKey,
  }: ManualSaveTemplateRequest): Promise<void> => {
    if (!editorState) {
      throw new Error(t("Review this manual workout before saving it as a template."));
    }
    const reviewed = await reviewWorkoutCommandFn({
      data: {
        operation: "save_template",
        document: editorState.document,
        displayName,
        iconKey,
        provenanceReference: editorState.provenanceReference,
      },
    });
    if (!reviewed.ok)
      throw new Error(reviewed.issues[0]?.message ?? t("The template could not be reviewed."));
    const candidate = reviewed.candidate;
    const result = await confirmWorkoutCommandFn({
      data: {
        command: candidate.command,
        candidateId: candidate.candidateId,
        reviewToken: candidate.reviewToken,
        reviewChecksum: candidate.reviewChecksum,
      },
    });
    if (!result.ok) throw new Error(result.message);

    await loadTemplateCatalog();
    hitoToast.success({
      id: MANUAL_ADD_TOAST_ID,
      title: t("Template saved"),
      description: t("{name} is available in your template picker.", { name: displayName }),
    });
  };

  const runTemplateCatalogAction = async ({
    actionId,
    pendingDescription,
    pendingTitle,
    run,
    successDescription,
    successTitle,
  }: {
    actionId: string;
    pendingDescription: string;
    pendingTitle: string;
    run: () => Promise<{ ok: boolean; message?: string } | null | undefined>;
    successDescription: string;
    successTitle: string;
  }) => {
    if (templateCatalogAction) return;

    setTemplateCatalogAction(actionId);
    hitoToast.working({
      id: MANUAL_TEMPLATE_CATALOG_TOAST_ID,
      title: pendingTitle,
      description: pendingDescription,
    });

    try {
      const result = await run();
      if (!result?.ok) {
        throw new Error(result?.message ?? t("The workout template catalog could not be updated."));
      }
      await loadTemplateCatalog();
      hitoToast.success({
        id: MANUAL_TEMPLATE_CATALOG_TOAST_ID,
        title: successTitle,
        description: successDescription,
      });
    } catch (error) {
      hitoToast.error({
        id: MANUAL_TEMPLATE_CATALOG_TOAST_ID,
        title: t("Template update failed"),
        description:
          error instanceof Error
            ? error.message
            : t("The workout template catalog could not be updated."),
      });
    } finally {
      setTemplateCatalogAction(null);
    }
  };

  const confirmReviewedDraft = async () => {
    if (!editorState?.candidate || confirmInFlightRef.current) return;
    const candidate = editorState.candidate;

    confirmInFlightRef.current = true;
    setStatus("creating");
    setConfirmMessage(null);
    hitoToast.working({
      id: MANUAL_ADD_TOAST_ID,
      title: t("Adding workout"),
      description: t("Hito is confirming the reviewed workout."),
    });

    try {
      const result = await confirmWorkoutCommandFn({
        data: {
          command: candidate.command,
          candidateId: candidate.candidateId,
          reviewToken: candidate.reviewToken,
          reviewChecksum: candidate.reviewChecksum,
        },
      });

      if (!result.ok) {
        confirmInFlightRef.current = false;
        setStatus("idle");
        setConfirmMessage(result.message);
        hitoToast.error({
          id: MANUAL_ADD_TOAST_ID,
          title: t("Workout not added"),
          description: result.message,
        });
        return;
      }

      hitoToast.success({
        id: MANUAL_ADD_TOAST_ID,
        title: t("Workout added"),
        description: t("Refreshing from saved Calendar truth."),
      });
      confirmInFlightRef.current = false;
      setStatus("idle");
      setConstructorOpen(false);
      setEditorState(null);
      setConfirmMessage(null);
      await onAdded();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t("The workout could not be added to the Calendar.");
      confirmInFlightRef.current = false;
      setStatus("idle");
      setConfirmMessage(message);
      hitoToast.error({
        id: MANUAL_ADD_TOAST_ID,
        title: t("Workout not added"),
        description: message,
      });
    }
  };

  const pasteCopiedWorkout = async () => {
    if (!copiedWorkoutSource || !canPasteCopiedWorkout || status !== "idle") return;

    setStatus("creating");
    setEditorState(null);
    setConfirmMessage(null);
    hitoToast.working({
      id: MANUAL_COPY_PASTE_TOAST_ID,
      title: t("Pasting workout"),
      description: t("Hito is copying from the saved source workout."),
    });

    try {
      const reviewed = await reviewWorkoutCommandFn({
        data: {
          operation: "copy",
          workoutId: copiedWorkoutSource.sourceWorkoutId,
          targetDate: date,
        },
      });
      if (!reviewed.ok) {
        setStatus("idle");
        hitoToast.error({
          id: MANUAL_COPY_PASTE_TOAST_ID,
          title: t("Paste blocked"),
          description: reviewed.issues[0]?.message ?? pasteUnavailableMessage,
        });
        return;
      }

      const candidate = reviewed.candidate;
      const result = await confirmWorkoutCommandFn({
        data: {
          command: candidate.command,
          candidateId: candidate.candidateId,
          reviewToken: candidate.reviewToken,
          reviewChecksum: candidate.reviewChecksum,
        },
      });
      setStatus("idle");

      if (!result.ok || result.operation !== "copy") {
        hitoToast.error({
          id: MANUAL_COPY_PASTE_TOAST_ID,
          title: t("Paste blocked"),
          description: result.ok ? pasteUnavailableMessage : result.message,
        });
        return;
      }

      hitoToast.success({
        id: MANUAL_COPY_PASTE_TOAST_ID,
        title: t("Workout pasted"),
        description: t("Refreshing the calendar from saved workout truth."),
      });
      setConstructorOpen(false);
      setEditorState(null);
      setConfirmMessage(null);
      await onAdded();
    } catch {
      const message = pasteUnavailableMessage;
      setStatus("idle");
      setConfirmMessage(message);
      hitoToast.error({
        id: MANUAL_COPY_PASTE_TOAST_ID,
        title: t("Workout not pasted"),
        description: message,
      });
    }
  };

  return (
    <>
      <DropdownMenu open={addMenuOpen} onOpenChange={handleAddMenuOpenChange}>
        <DropdownMenuTrigger asChild disabled={disabled} ref={addMenuTriggerRef}>
          {children}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="hito-menu-width-standard">
          <DropdownMenuLabel>{formatReadableDate(date, locale)}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {onAddActivity ? (
            <>
              <DropdownMenuItem
                disabled={isBusy}
                onSelect={() => {
                  if (addMenuTriggerRef.current) onAddActivity(addMenuTriggerRef.current);
                }}
              >
                <Icon name="activity" size="xs" />
                {t("Add activity")}
              </DropdownMenuItem>
              {showWorkoutOptions ? <DropdownMenuSeparator /> : null}
            </>
          ) : null}
          {canMoveSelectedWorkout ? (
            <>
              <DropdownMenuItem
                disabled={isBusy}
                onSelect={() => onMoveTargetSelected?.(date, moveWorkoutSource)}
              >
                <Icon name="arrow-right" size="xs" />
                <span className="min-w-0">
                  <span className="hito-body-md text-foreground block">
                    {t("Move selected workout here")}
                  </span>
                  <span className="hito-body-sm mt-1 text-secondary block">
                    {moveTargetMenuCopy(moveTargetDayKind, locale)}
                  </span>
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem disabled={isBusy} onSelect={onMoveCanceled}>
                <Icon name="close" size="xs" />
                <span className="min-w-0">
                  <span className="hito-body-md text-foreground block">{t("Cancel move")}</span>
                  <span className="hito-body-sm mt-1 text-secondary block">
                    {t("Keep the source workout where it is.")}
                  </span>
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          ) : null}
          {!moveOnly && showWorkoutOptions && canPasteCopiedWorkout ? (
            <>
              <DropdownMenuItem disabled={isBusy} onSelect={() => void pasteCopiedWorkout()}>
                <Icon name="copy" size="xs" />
                <span className="min-w-0">
                  <span className="hito-body-md text-foreground block">
                    {t("Paste copied workout")}
                  </span>
                  <span className="hito-body-sm mt-1 text-secondary block">
                    {t("Save the copied workout into this empty day.")}
                  </span>
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          ) : null}
          {!moveOnly && showWorkoutOptions ? (
            <>
              <DropdownMenuItem
                disabled={isBusy || !templateCatalogState.catalog}
                onSelect={openScratchConstructor}
              >
                <Icon name="edit" size="xs" />
                <span className="min-w-0">
                  <span className="hito-body-md text-foreground block">
                    {t("Start from scratch")}
                  </span>
                  <span className="hito-body-sm mt-1 text-secondary block">
                    {t("Start with a blank workout.")}
                  </span>
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem disabled={isBusy} onSelect={openTemplatePickerDialog}>
                <Icon name="workout" size="xs" />
                <span className="min-w-0">
                  <span className="hito-body-md text-foreground block">{t("Choose template")}</span>
                  <span className="hito-body-sm mt-1 text-secondary block">
                    {t("Browse built-in and saved templates.")}
                  </span>
                </span>
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <ManualTemplatePickerDialog
        catalogAction={templateCatalogAction}
        catalogState={templateCatalogState}
        open={templatePickerOpen}
        onOpenChange={setTemplatePickerOpen}
        onDeleteSavedTemplate={(template) => {
          void runTemplateCatalogAction({
            actionId: `delete:${template.id}`,
            pendingTitle: t("Deleting template"),
            pendingDescription: t("Removing {name} from your templates.", {
              name: template.displayName,
            }),
            run: () => deleteManualWorkoutSavedTemplateFn({ data: { templateId: template.id } }),
            successTitle: t("Template deleted"),
            successDescription: t("{name} was removed from your templates.", {
              name: template.displayName,
            }),
          });
        }}
        onHideBuiltInTemplate={(template) => {
          const label = getHitoKnownProductMessage(locale, templateRunnerFacingLabel(template));
          void runTemplateCatalogAction({
            actionId: `hide:${template.templateKey}`,
            pendingTitle: t("Hiding template"),
            pendingDescription: t("Removing {name} from your visible built-in templates.", {
              name: label,
            }),
            run: () =>
              hideManualWorkoutBuiltInTemplateFn({
                data: { templateKey: template.templateKey },
              }),
            successTitle: t("Template hidden"),
            successDescription: t("{name} is hidden for this account.", { name: label }),
          });
        }}
        onRefreshCatalog={() => void loadTemplateCatalog()}
        onRestoreAllBuiltInTemplates={() => {
          void runTemplateCatalogAction({
            actionId: "restore:all",
            pendingTitle: t("Restoring templates"),
            pendingDescription: t("Restoring all built-in workout templates for this account."),
            run: () => restoreAllManualWorkoutBuiltInTemplatesFn({ data: undefined }),
            successTitle: t("Templates restored"),
            successDescription: t("All built-in workout templates are visible again."),
          });
        }}
        onRestoreBuiltInTemplate={(template) => {
          const label = getHitoKnownProductMessage(locale, templateRunnerFacingLabel(template));
          void runTemplateCatalogAction({
            actionId: `restore:${template.templateKey}`,
            pendingTitle: t("Restoring template"),
            pendingDescription: t("Restoring {name} to your visible built-in templates.", {
              name: label,
            }),
            run: () =>
              restoreManualWorkoutBuiltInTemplateFn({
                data: { templateKey: template.templateKey },
              }),
            successTitle: t("Template restored"),
            successDescription: t("{name} is visible in the picker again.", { name: label }),
          });
        }}
        onSelectSavedTemplate={(template) => {
          setTemplatePickerOpen(false);
          openSavedTemplate(template);
        }}
        onSelectTemplate={(template) => {
          setTemplatePickerOpen(false);
          openConstructor(template);
        }}
      />

      <ManualWorkoutConstructorDialog
        confirmLabel={t("Add workout")}
        confirmMessage={confirmMessage}
        editorState={editorState}
        isBusy={isBusy}
        onConfirm={() => void confirmReviewedDraft()}
        onDocumentChange={(document) => {
          if (editorState) setEditorState(editWorkoutEditorDocument(editorState, document));
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          window.requestAnimationFrame(() => {
            addMenuTriggerRef.current?.focus({ preventScroll: true });
          });
        }}
        onOpenChange={(open) => {
          if (!open && !isBusy) {
            setEditorState(null);
            setConfirmMessage(null);
          }
          setConstructorOpen(open);
        }}
        onReview={() => void submitReview()}
        open={constructorOpen}
        pendingLabel={t("Adding workout...")}
        onSaveTemplate={saveReviewedTemplate}
        selection={selection}
        status={status}
      />
    </>
  );
}

export function ManualWorkoutConstructorDialog({
  confirmLabel,
  confirmMessage,
  editorState,
  isBusy,
  onConfirm,
  onCloseAutoFocus,
  onDocumentChange,
  onOpenChange,
  onReview,
  onSaveTemplate,
  open,
  pendingLabel,
  selection,
  status,
}: {
  confirmLabel: string;
  confirmMessage: string | null;
  editorState: WorkoutEditorState | null;
  isBusy: boolean;
  onConfirm: () => void;
  onCloseAutoFocus?: (event: Event) => void;
  onDocumentChange: (document: WorkoutEditorState["document"]) => void;
  onOpenChange: (open: boolean) => void;
  onReview: () => void;
  onSaveTemplate?: (input: ManualSaveTemplateRequest) => Promise<void>;
  open: boolean;
  pendingLabel: string;
  selection: ManualDraftSelection | null;
  status: ManualDraftStatus;
}) {
  const locale = useHitoUiLocale();
  const t = useHitoProductMessage();
  const ready = editorState?.candidate;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="hito-dialog-stable hito-product-dialog hito-dialog-surface-product hito-dialog-size-workflow hito-dialog-height-workflow"
        onCloseAutoFocus={onCloseAutoFocus}
        onOpenAutoFocus={focusManualWorkoutDialogCloseOnOpen}
        overlayClassName="hito-dialog-overlay-stable"
      >
        {selection && editorState ? (
          <ManualWorkoutEditorDialogHeader
            dateLabel={formatReadableDate(selection.date, locale)}
            statusLabel={ready ? t("Reviewed") : t("Draft")}
            title={editorState.document.title}
          />
        ) : (
          <DialogHeader className="hito-product-dialog-header">
            <DialogTitle className="hito-ui-title-md text-foreground">
              {t("Manual workout")}
            </DialogTitle>
            <DialogDescription className="hito-body-md text-secondary">
              {t("Loading the canonical workout document.")}
            </DialogDescription>
          </DialogHeader>
        )}
        <div className="hito-product-dialog-body-scroll-fill">
          {editorState ? (
            <WorkoutDocumentEditor
              document={editorState.document}
              readOnly={Boolean(ready)}
              onChange={onDocumentChange}
            />
          ) : null}
          {editorState?.issues.map((issue) => (
            <p key={issue} className="hito-body-md text-negative" role="alert">
              {getHitoKnownProductMessage(locale, issue)}
            </p>
          ))}
          {ready?.warnings.map((warning) => (
            <p key={warning} className="hito-body-xs text-secondary">
              {t("Warning: {warning}", { warning })}
            </p>
          ))}
          {confirmMessage ? (
            <p className="hito-body-md font-medium text-negative" role="alert">
              {getHitoKnownProductMessage(locale, confirmMessage)}
            </p>
          ) : null}
        </div>
        <DialogFooter className="hito-product-dialog-footer sm:space-x-0">
          <HitoButton
            type="button"
            size="md"
            variant="secondary"
            disabled={isBusy}
            onClick={() => onOpenChange(false)}
          >
            {t("Close")}
          </HitoButton>
          {ready ? (
            <>
              {onSaveTemplate ? (
                <ManualSaveTemplateAction
                  defaultName={editorState.document.title}
                  disabled={isBusy}
                  onSaveTemplate={onSaveTemplate}
                />
              ) : null}
              <HitoButton
                type="button"
                loading={status === "creating"}
                size="md"
                variant="primary"
                disabled={isBusy}
                onClick={onConfirm}
              >
                {status === "creating" ? pendingLabel : confirmLabel}
              </HitoButton>
            </>
          ) : (
            <HitoButton
              type="button"
              loading={status === "reviewing"}
              size="md"
              variant="primary"
              disabled={!editorState || isBusy || editorState.issues.length > 0}
              onClick={onReview}
            >
              {status === "reviewing" ? t("Reviewing workout...") : t("Review workout")}
            </HitoButton>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ManualSaveTemplateAction({
  defaultName,
  disabled,
  onSaveTemplate,
}: {
  defaultName: string;
  disabled: boolean;
  onSaveTemplate: (input: ManualSaveTemplateRequest) => Promise<void>;
}) {
  const locale = useHitoUiLocale();
  const t = useHitoProductMessage();
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState(defaultName);
  const [iconKey, setIconKey] = useState<CalendarIconKey>("easy");
  const [status, setStatus] = useState<"idle" | "saving">("idle");
  const [error, setError] = useState<string | null>(null);
  const isSaving = status === "saving";

  const submitSave = async () => {
    const trimmedName = displayName.trim();
    if (!trimmedName || isSaving) return;

    setStatus("saving");
    setError(null);
    try {
      await onSaveTemplate({ displayName: trimmedName, iconKey });
      setStatus("idle");
      setOpen(false);
    } catch (saveError) {
      setStatus("idle");
      setError(
        saveError instanceof Error
          ? saveError.message
          : t("The workout template could not be saved."),
      );
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isSaving) return;
        setOpen(nextOpen);
        if (nextOpen) {
          setDisplayName(defaultName);
          setError(null);
        }
      }}
    >
      <HitoButton
        type="button"
        className="shrink-0"
        size="md"
        variant="secondary"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        <Icon name="workout" size="xs" />
        {t("Save as template")}
      </HitoButton>
      <DialogContent
        className="hito-dialog-stable hito-product-dialog hito-dialog-surface-product hito-dialog-size-compact"
        overlayClassName="hito-dialog-overlay-stable"
      >
        <DialogHeader className="hito-product-dialog-header">
          <DialogTitle className="hito-ui-title-md text-foreground">
            {t("Save as template")}
          </DialogTitle>
          <DialogDescription className="hito-body-md text-secondary">
            {t(
              "Save this reviewed workout as a personal template. Hito rebuilds and checks it before it appears in your picker.",
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="hito-product-dialog-body grid gap-4">
          <label className="grid gap-2">
            <span className="hito-label-md text-foreground">{t("Template name")}</span>
            <Input
              size="md"
              variant="primary"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder={t("Easy aerobic run")}
            />
          </label>

          <label className="grid gap-2">
            <span className="hito-label-md text-foreground">{t("Calendar icon")}</span>
            <Select value={iconKey} onValueChange={(value) => setIconKey(value as CalendarIconKey)}>
              <SelectTrigger aria-label={t("Template calendar icon")}>
                <SelectValue placeholder={t("Calendar icon")} />
              </SelectTrigger>
              <SelectContent>
                {CALENDAR_ICON_KEY_VALUES.map((value) => (
                  <SelectItem key={value} value={value}>
                    <span className="inline-flex items-center gap-2">
                      <WorkoutGlyph kind={value as WorkoutGlyphKind} />
                      {getHitoKnownProductMessage(locale, calendarIconLabel(value))}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="hito-body-xs text-secondary">
              {t("This icon only changes how your personal template appears in the picker.")}
            </span>
          </label>

          {error ? <p className="hito-body-md font-medium text-negative">{error}</p> : null}
        </div>
        <DialogFooter className="hito-product-dialog-footer sm:space-x-0">
          <HitoButton
            type="button"
            size="md"
            variant="secondary"
            disabled={isSaving}
            onClick={() => setOpen(false)}
          >
            {t("Cancel")}
          </HitoButton>
          <HitoButton
            type="button"
            loading={isSaving}
            size="md"
            variant="primary"
            disabled={!displayName.trim() || isSaving}
            onClick={() => void submitSave()}
          >
            {isSaving ? t("Saving...") : t("Save template")}
          </HitoButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function moveTargetMenuCopy(dayKind: ManualWorkoutMoveTargetDayKind, locale: ResolvedUiLocale) {
  if (dayKind === "workout_day") {
    return getHitoKnownProductMessage(
      locale,
      "Review before replacing the Calendar workout on this day.",
    );
  }

  return getHitoKnownProductMessage(locale, "Use this Rest day as the target.");
}

function calendarIconLabel(iconKey: CalendarIconKey) {
  return iconKey
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

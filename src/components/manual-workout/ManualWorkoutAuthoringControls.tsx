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
  addManualWorkoutToActivePlan,
  copyManualWorkoutWithinActivePlan,
  listManualWorkoutSavedTemplates,
  reviewManualWorkoutSavedTemplate,
  saveManualWorkoutSavedTemplate,
} from "@/lib/manual-workout-authoring";
import { reviewManualWorkoutDraftAction } from "@/lib/manual-workout-authoring/actions";
import type {
  ManualWorkoutDirectCopyResult,
  ManualWorkoutDraftInput,
  ManualWorkoutDraftReviewResult,
  ManualWorkoutSavedTemplateReviewResult,
  ManualWorkoutSavedTemplateSaveResult,
  ManualWorkoutSavedTemplateView,
  ManualWorkoutTemplateKey,
  ManualWorkoutTargetTruthMode,
  ManualWorkoutMoveTargetDayKind,
} from "@/lib/manual-workout-authoring";
import { type ManualWorkoutTemplate } from "@/lib/manual-workout-authoring/templates";
import {
  MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
  MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
  type ManualWorkoutBlockInput,
  type ManualWorkoutConstructorEntryInput,
} from "@/lib/manual-workout-authoring/schema";
import { getManualWorkoutRepeatGroupChildren } from "@/lib/manual-workout-authoring/repeat-groups";
import { repeatChildSteps, repeatCountForStep } from "@/lib/training";
import type { WorkoutGlyphKind } from "@/lib/workout-glyph";
import {
  buildManualDraftInput,
  cloneManualWorkoutEntries,
  formatReadableDate,
  getDefaultManualWorkoutTemplate,
  VISIBLE_MANUAL_WORKOUT_STARTER_TEMPLATES,
  templateIconKind,
  templateIconTone,
} from "@/components/manual-workout/manual-workout-authoring-utils";
import {
  ManualWorkoutConstructorEditor,
  type ManualWorkoutConstructorSource,
} from "@/components/manual-workout/ManualWorkoutConstructorEditor";
import { ManualWorkoutEditorDialogHeader } from "@/components/manual-workout/ManualWorkoutEditorDialogHeader";
import { focusManualWorkoutDialogCloseOnOpen } from "@/components/manual-workout/manual-workout-dialog-focus";
import {
  MANUAL_COPY_PASTE_TOAST_ID,
  type ManualCopiedWorkoutSource,
} from "@/components/manual-workout/ManualWorkoutSourceActionMenu";
import {
  EMPTY_SAVED_TEMPLATES_STATE,
  MANUAL_ADD_MENU_CONTENT_CLASS,
  MANUAL_ADD_MENU_ICON_CLASS,
  MANUAL_ADD_MENU_ITEM_CLASS,
  type ManualSavedTemplatesState,
} from "@/components/manual-workout/ManualWorkoutTemplatePicker.model";
import {
  ManualTemplatePickerDialog,
  ManualTemplateSubmenu,
} from "@/components/manual-workout/ManualWorkoutTemplatePicker";

export { ManualWorkoutSourceActionMenu } from "@/components/manual-workout/ManualWorkoutSourceActionMenu";
export type { ManualCopiedWorkoutSource } from "@/components/manual-workout/ManualWorkoutSourceActionMenu";

export type ManualReviewReady = Extract<ManualWorkoutDraftReviewResult, { ok: true }>;
export type ManualReviewRejected = Extract<ManualWorkoutDraftReviewResult, { ok: false }>;
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

export type ReviewedManualDraft = {
  input: ManualWorkoutDraftInput;
  review: ManualReviewReady;
};

export type ManualSaveTemplateRequest = {
  displayName: string;
  iconKey: CalendarIconKey;
};

const MANUAL_ADD_TOAST_ID = "manual-active-plan-add";
const PASTE_UNAVAILABLE_MESSAGE =
  "Hito could not paste this workout yet. Try again from the calendar.";

export function ManualWorkoutAddMenu({
  activePlanId,
  activePlanSourceKind,
  children,
  copiedWorkoutSource = null,
  date,
  disabled = false,
  onAdded,
  onMoveCanceled,
  onMoveTargetSelected,
  moveTargetDayKind = "rest_day",
  moveWorkoutSource = null,
  moveOnly = false,
  showRestDayOption = true,
}: {
  activePlanId: string;
  activePlanSourceKind: string;
  children: ReactNode;
  copiedWorkoutSource?: ManualCopiedWorkoutSource | null;
  date: string;
  disabled?: boolean;
  onAdded: () => void | Promise<void>;
  onMoveCanceled?: () => void;
  onMoveTargetSelected?: (targetDate: string, source?: ManualCopiedWorkoutSource | null) => void;
  moveTargetDayKind?: ManualWorkoutMoveTargetDayKind;
  moveWorkoutSource?: ManualCopiedWorkoutSource | null;
  moveOnly?: boolean;
  showRestDayOption?: boolean;
}) {
  const reviewManualWorkoutDraftFn = useServerFn(reviewManualWorkoutDraftAction);
  const copyManualWorkoutWithinActivePlanFn = useServerFn(copyManualWorkoutWithinActivePlan);
  const listManualWorkoutSavedTemplatesFn = useServerFn(listManualWorkoutSavedTemplates);
  const reviewManualWorkoutSavedTemplateFn = useServerFn(reviewManualWorkoutSavedTemplate);
  const saveManualWorkoutSavedTemplateFn = useServerFn(saveManualWorkoutSavedTemplate);
  const addManualWorkoutToActivePlanFn = useServerFn(addManualWorkoutToActivePlan);
  const confirmInFlightRef = useRef(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [constructorOpen, setConstructorOpen] = useState(false);
  const [selection, setSelection] = useState<ManualDraftSelection | null>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [targetTruthMode, setTargetTruthMode] =
    useState<ManualWorkoutTargetTruthMode>("structure_only");
  const [entries, setEntries] = useState<ManualWorkoutConstructorEntryInput[]>([]);
  const [status, setStatus] = useState<ManualDraftStatus>("idle");
  const [reviewResult, setReviewResult] = useState<ManualWorkoutDraftReviewResult | null>(null);
  const [reviewedDraft, setReviewedDraft] = useState<ReviewedManualDraft | null>(null);
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);
  const [savedTemplatesState, setSavedTemplatesState] = useState<ManualSavedTemplatesState>(
    EMPTY_SAVED_TEMPLATES_STATE,
  );
  const isBusy = status !== "idle";
  const canPasteCopiedWorkout = Boolean(
    copiedWorkoutSource && copiedWorkoutSource.activePlanId === activePlanId,
  );
  const canMoveSelectedWorkout = Boolean(
    moveWorkoutSource?.activePlanId === activePlanId &&
    moveWorkoutSource.sourceWorkoutDate !== date,
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
    setTitle(template.defaultTitle);
    setNotes(template.defaultNotes ?? "");
    setTargetTruthMode(template.defaultTargetTruthMode);
    setEntries(cloneManualWorkoutEntries(template.defaultEntries));
    setReviewResult(null);
    setReviewedDraft(null);
    setConfirmMessage(null);
    openConstructorDialog();
  };

  const openScratchConstructor = () => {
    setSelection({ kind: "scratch", date, template: null });
    setTitle("");
    setNotes("");
    setTargetTruthMode("structure_only");
    setEntries([]);
    setReviewResult(null);
    setReviewedDraft(null);
    setConfirmMessage(null);
    openConstructorDialog();
  };

  const openTemplatePickerDialog = () => {
    setAddMenuOpen(false);

    if (savedTemplatesState.status === "idle" || savedTemplatesState.status === "failed") {
      void loadSavedTemplates();
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
      (savedTemplatesState.status === "idle" || savedTemplatesState.status === "failed")
    ) {
      void loadSavedTemplates();
    }
  };

  const buildRegistryInput = (
    draftSelection: Extract<ManualDraftSelection, { kind: "registry" | "scratch" }>,
  ) => {
    if (!draftSelection.template) {
      throw new Error("Choose a supported workout type before review.");
    }

    return buildManualDraftInput({
      activePlanId,
      activePlanSourceKind,
      contextMode: "existing_active_plan",
      date: draftSelection.date,
      entries,
      notes,
      targetTruthMode,
      template: draftSelection.template,
      title,
    });
  };

  const buildSavedTemplateReviewInput = (
    draftSelection: Extract<ManualDraftSelection, { kind: "saved" }>,
    nextTitle = title,
    nextNotes = notes,
  ) => ({
    templateId: draftSelection.template.id,
    workoutDate: draftSelection.date,
    title: nextTitle.trim() || draftSelection.template.displayName,
    notes: nextNotes.trim() || null,
    context: {
      mode: "existing_active_plan" as const,
      activePlanId,
      activePlanSourceKind,
      targetDateProtection: "none" as const,
    },
  });
  const syncDraftUiFromReviewedInput = (input: ManualWorkoutDraftInput) => {
    setTitle(input.title);
    setNotes(input.notes ?? "");
    setTargetTruthMode(input.targetTruthMode);
    setEntries(cloneManualWorkoutEntries(input.entries));
  };

  const loadSavedTemplates = async () => {
    setSavedTemplatesState((current) => ({
      status: "loading",
      templates: current.templates,
      message: null,
    }));

    try {
      const result = await listManualWorkoutSavedTemplatesFn({ data: undefined });
      if (!result?.ok) {
        setSavedTemplatesState({
          status: "failed",
          templates: [],
          message: result?.message ?? "Personal workout templates are not available right now.",
        });
        return;
      }

      setSavedTemplatesState({
        status: "ready",
        templates: result.templates,
        message: null,
      });
    } catch (error) {
      setSavedTemplatesState({
        status: "failed",
        templates: [],
        message:
          error instanceof Error
            ? error.message
            : "Personal workout templates could not be loaded.",
      });
    }
  };

  const submitRegistryReview = async (
    draftSelection: Extract<ManualDraftSelection, { kind: "registry" | "scratch" }>,
  ) => {
    if (!draftSelection.template) {
      setReviewResult(buildManualReviewRejected("Choose a supported workout type before review."));
      return;
    }

    const input = buildRegistryInput(draftSelection);

    setStatus("reviewing");
    setReviewResult(null);
    setReviewedDraft(null);
    setConfirmMessage(null);
    hitoToast.working({
      id: MANUAL_ADD_TOAST_ID,
      title: "Reviewing workout",
      description: "Hito is validating the manual draft before anything is saved.",
    });

    try {
      const result = await reviewManualWorkoutDraftFn({ data: input });
      setReviewResult(result);
      setStatus("idle");

      if (!result.ok) {
        hitoToast.error({
          id: MANUAL_ADD_TOAST_ID,
          title: "Workout needs changes",
          description: result.message,
        });
        return;
      }

      syncDraftUiFromReviewedInput(input);
      setReviewedDraft({ input, review: result });
      hitoToast.success({
        id: MANUAL_ADD_TOAST_ID,
        title: "Workout reviewed",
        description: "Check the reviewed workout before adding it to the plan.",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not review this manual workout yet.";
      setStatus("idle");
      setReviewResult({
        ok: false,
        status: "draft_rejected",
        reason: "invalid_input",
        message,
        issues: [{ code: "invalid_input", message }],
        conflicts: [],
        persisted: false,
      });
      hitoToast.error({
        id: MANUAL_ADD_TOAST_ID,
        title: "Review failed",
        description: message,
      });
    }
  };

  const submitSavedTemplateReview = async (
    draftSelection: Extract<ManualDraftSelection, { kind: "saved" }>,
    nextTitle = title,
    nextNotes = notes,
  ) => {
    setStatus("reviewing");
    setReviewResult(null);
    setReviewedDraft(null);
    setConfirmMessage(null);
    hitoToast.working({
      id: MANUAL_ADD_TOAST_ID,
      title: "Reviewing saved template",
      description: "Hito is rebuilding the personal template for review.",
    });

    try {
      const result = await reviewManualWorkoutSavedTemplateFn({
        data: buildSavedTemplateReviewInput(draftSelection, nextTitle, nextNotes),
      });
      setStatus("idle");

      if (!result.ok) {
        const rejected = savedTemplateReviewToRejected(result);
        setReviewResult(rejected);
        hitoToast.error({
          id: MANUAL_ADD_TOAST_ID,
          title: "Template needs changes",
          description: result.message,
        });
        return;
      }

      setReviewResult(result.review);
      syncDraftUiFromReviewedInput(result.draftInput);
      setReviewedDraft({ input: result.draftInput, review: result.review });
      hitoToast.success({
        id: MANUAL_ADD_TOAST_ID,
        title: "Template reviewed",
        description: "Check the reviewed workout before adding it to the plan.",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not review this saved template yet.";
      const rejected = buildManualReviewRejected(message);
      setStatus("idle");
      setReviewResult(rejected);
      hitoToast.error({
        id: MANUAL_ADD_TOAST_ID,
        title: "Review failed",
        description: message,
      });
    }
  };

  const submitReview = async () => {
    if (!selection || status !== "idle") return;

    if (selection.kind === "saved") {
      await submitSavedTemplateReview(selection);
      return;
    }

    await submitRegistryReview(selection);
  };

  const openSavedTemplate = (template: ManualWorkoutSavedTemplateView) => {
    const nextSelection: ManualDraftSelection = { kind: "saved", date, template };
    const nextTitle = template.displayName;
    const nextNotes = template.draftPayload.sourceNotes ?? "";

    setSelection(nextSelection);
    setTitle(nextTitle);
    setNotes(nextNotes);
    setTargetTruthMode(template.targetTruthMode);
    setEntries(cloneManualWorkoutEntries(template.draftPayload.entries));
    setReviewResult(null);
    setReviewedDraft(null);
    setConfirmMessage(null);
    openConstructorDialog();
    void submitSavedTemplateReview(nextSelection, nextTitle, nextNotes);
  };

  const saveReviewedTemplate = async ({
    displayName,
    iconKey,
  }: ManualSaveTemplateRequest): Promise<void> => {
    if (!reviewedDraft) {
      throw new Error("Review this manual workout before saving it as a template.");
    }

    const result = await saveManualWorkoutSavedTemplateFn({
      data: {
        displayName,
        iconKey,
        draftInput: reviewedDraft.input,
        reviewToken: reviewedDraft.review.reviewToken,
        reviewChecksum: reviewedDraft.review.reviewChecksum,
      },
    });

    if (!result.ok) {
      throw new Error(result.message);
    }

    syncSavedTemplateStateAfterSave(result);
    hitoToast.success({
      id: MANUAL_ADD_TOAST_ID,
      title: "Template saved",
      description: `${result.template.displayName} is available in your template picker.`,
    });
  };

  const syncSavedTemplateStateAfterSave = (
    result: Extract<ManualWorkoutSavedTemplateSaveResult, { ok: true }>,
  ) => {
    setSavedTemplatesState((current) => ({
      status: "ready",
      message: null,
      templates: [
        result.template,
        ...current.templates.filter((template) => template.id !== result.template.id),
      ],
    }));
  };

  const confirmReviewedDraft = async () => {
    if (!reviewedDraft || confirmInFlightRef.current) return;

    confirmInFlightRef.current = true;
    setStatus("creating");
    setConfirmMessage(null);
    hitoToast.working({
      id: MANUAL_ADD_TOAST_ID,
      title: "Adding workout",
      description: "Hito is confirming the reviewed workout.",
    });

    try {
      const result = await addManualWorkoutToActivePlanFn({
        data: {
          activePlanId,
          draftInput: reviewedDraft.input,
          reviewToken: reviewedDraft.review.reviewToken,
          reviewChecksum: reviewedDraft.review.reviewChecksum,
        },
      });

      if (!result.ok) {
        confirmInFlightRef.current = false;
        setStatus("idle");
        setConfirmMessage(result.message);
        hitoToast.error({
          id: MANUAL_ADD_TOAST_ID,
          title: "Workout not added",
          description: result.message,
        });
        return;
      }

      hitoToast.success({
        id: MANUAL_ADD_TOAST_ID,
        title: "Workout added",
        description: "Refreshing the calendar from saved plan truth.",
      });
      confirmInFlightRef.current = false;
      setStatus("idle");
      setConstructorOpen(false);
      setReviewedDraft(null);
      setReviewResult(null);
      setConfirmMessage(null);
      await onAdded();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "The workout could not be added to this plan.";
      confirmInFlightRef.current = false;
      setStatus("idle");
      setConfirmMessage(message);
      hitoToast.error({
        id: MANUAL_ADD_TOAST_ID,
        title: "Workout not added",
        description: message,
      });
    }
  };

  const pasteCopiedWorkout = async () => {
    if (!copiedWorkoutSource || !canPasteCopiedWorkout || status !== "idle") return;

    setStatus("creating");
    setReviewResult(null);
    setReviewedDraft(null);
    setConfirmMessage(null);
    hitoToast.working({
      id: MANUAL_COPY_PASTE_TOAST_ID,
      title: "Pasting workout",
      description: "Hito is copying from the saved source workout.",
    });

    try {
      const response = await copyManualWorkoutWithinActivePlanFn({
        data: {
          activePlanId,
          sourceWorkoutId: copiedWorkoutSource.sourceWorkoutId,
          sourceWorkoutDate: copiedWorkoutSource.sourceWorkoutDate,
          targetDate: date,
        },
      });
      const result = isManualWorkoutDirectCopyResult(response)
        ? response
        : buildPasteUnavailableResult();
      setStatus("idle");

      if (!result.ok) {
        hitoToast.error({
          id: MANUAL_COPY_PASTE_TOAST_ID,
          title: "Paste blocked",
          description: result.message,
        });
        return;
      }

      hitoToast.success({
        id: MANUAL_COPY_PASTE_TOAST_ID,
        title: "Workout pasted",
        description: "Refreshing the calendar from saved plan truth.",
      });
      setConstructorOpen(false);
      setReviewedDraft(null);
      setReviewResult(null);
      setConfirmMessage(null);
      await onAdded();
    } catch {
      const message = PASTE_UNAVAILABLE_MESSAGE;
      setStatus("idle");
      setConfirmMessage(message);
      hitoToast.error({
        id: MANUAL_COPY_PASTE_TOAST_ID,
        title: "Workout not pasted",
        description: message,
      });
    }
  };

  return (
    <>
      <DropdownMenu open={addMenuOpen} onOpenChange={handleAddMenuOpenChange}>
        <DropdownMenuTrigger asChild disabled={disabled}>
          {children}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className={MANUAL_ADD_MENU_CONTENT_CLASS}>
          <DropdownMenuLabel className="px-3 py-2">{formatReadableDate(date)}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {canMoveSelectedWorkout ? (
            <>
              <DropdownMenuItem
                className={MANUAL_ADD_MENU_ITEM_CLASS}
                disabled={isBusy}
                onSelect={() => onMoveTargetSelected?.(date, moveWorkoutSource)}
              >
                <Icon className={MANUAL_ADD_MENU_ICON_CLASS} name="arrow-right" size="xs" />
                <span className="min-w-0">
                  <span className="hito-list-row-title block">Move selected workout here</span>
                  <span className="hito-list-row-copy block">
                    {moveTargetMenuCopy(moveTargetDayKind)}
                  </span>
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className={MANUAL_ADD_MENU_ITEM_CLASS}
                disabled={isBusy}
                onSelect={onMoveCanceled}
              >
                <Icon className={MANUAL_ADD_MENU_ICON_CLASS} name="close" size="xs" />
                <span className="min-w-0">
                  <span className="hito-list-row-title block">Cancel move</span>
                  <span className="hito-list-row-copy block">
                    Keep the source workout where it is.
                  </span>
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          ) : null}
          {!moveOnly && canPasteCopiedWorkout ? (
            <>
              <DropdownMenuItem
                className={MANUAL_ADD_MENU_ITEM_CLASS}
                disabled={isBusy}
                onSelect={() => void pasteCopiedWorkout()}
              >
                <Icon className={MANUAL_ADD_MENU_ICON_CLASS} name="copy" size="xs" />
                <span className="min-w-0">
                  <span className="hito-list-row-title block">Paste copied workout</span>
                  <span className="hito-list-row-copy block">
                    Save the copied workout into this Rest day.
                  </span>
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          ) : null}
          {!moveOnly ? (
            <>
              <DropdownMenuItem
                className={MANUAL_ADD_MENU_ITEM_CLASS}
                disabled={isBusy}
                onSelect={openScratchConstructor}
              >
                <Icon className={MANUAL_ADD_MENU_ICON_CLASS} name="edit" size="xs" />
                <span className="min-w-0">
                  <span className="hito-list-row-title block">Start from scratch</span>
                  <span className="hito-list-row-copy block">Start with a blank workout.</span>
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className={`${MANUAL_ADD_MENU_ITEM_CLASS} md:hidden`}
                disabled={isBusy}
                onSelect={openTemplatePickerDialog}
              >
                <Icon className={MANUAL_ADD_MENU_ICON_CLASS} name="workout" size="xs" />
                <span className="min-w-0">
                  <span className="hito-list-row-title block">Choose template</span>
                  <span className="hito-list-row-copy block">
                    Browse built-in and saved templates.
                  </span>
                </span>
              </DropdownMenuItem>
              <ManualTemplateSubmenu
                disabled={isBusy}
                onSelectSavedTemplate={openSavedTemplate}
                onSelectTemplate={openConstructor}
                savedTemplatesState={savedTemplatesState}
                triggerClassName="hidden md:flex"
              />
              {showRestDayOption ? (
                <DropdownMenuItem
                  className={MANUAL_ADD_MENU_ITEM_CLASS}
                  disabled={isBusy}
                  onSelect={() => openConstructor(getDefaultManualWorkoutTemplate("rest_day"))}
                >
                  <Icon className={MANUAL_ADD_MENU_ICON_CLASS} name="minus" size="xs" />
                  <span className="min-w-0">
                    <span className="hito-list-row-title block">Add rest day</span>
                    <span className="hito-list-row-copy block">
                      Create an intentional no-run day.
                    </span>
                  </span>
                </DropdownMenuItem>
              ) : null}
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <ManualTemplatePickerDialog
        open={templatePickerOpen}
        onOpenChange={setTemplatePickerOpen}
        onRefreshSavedTemplates={() => void loadSavedTemplates()}
        onSelectSavedTemplate={(template) => {
          setTemplatePickerOpen(false);
          openSavedTemplate(template);
        }}
        onSelectTemplate={(template) => {
          setTemplatePickerOpen(false);
          openConstructor(template);
        }}
        savedTemplatesState={savedTemplatesState}
      />

      <ManualWorkoutConstructorDialog
        confirmLabel="Add workout"
        confirmMessage={confirmMessage}
        entries={entries}
        isBusy={isBusy}
        notes={notes}
        onConfirm={() => void confirmReviewedDraft()}
        onEntriesChange={(nextEntries) => {
          setEntries(nextEntries);
          setReviewResult(null);
          setReviewedDraft(null);
        }}
        onNotesChange={(value) => {
          setNotes(value);
          setReviewResult(null);
          setReviewedDraft(null);
        }}
        onOpenChange={(open) => {
          if (!open && !isBusy) {
            setReviewedDraft(null);
            setConfirmMessage(null);
          }
          setConstructorOpen(open);
        }}
        onScratchTemplateChange={(templateKey) => {
          const template = getDefaultManualWorkoutTemplate(templateKey);
          setSelection((current) =>
            current?.kind === "scratch" ? { ...current, template } : current,
          );
          setTargetTruthMode(template.defaultTargetTruthMode);
          setTitle((current) => current || template.defaultTitle);
          if (template.workoutType === "rest") {
            setEntries([]);
          }
          setReviewResult(null);
          setReviewedDraft(null);
        }}
        onReview={() => void submitReview()}
        onTargetTruthModeChange={(value) => {
          setTargetTruthMode(value);
          setReviewResult(null);
          setReviewedDraft(null);
        }}
        onTitleChange={(value) => {
          setTitle(value);
          setReviewResult(null);
          setReviewedDraft(null);
        }}
        open={constructorOpen}
        pendingLabel="Adding workout..."
        reviewResult={reviewResult}
        reviewedDraft={reviewedDraft}
        onSaveTemplate={saveReviewedTemplate}
        selection={selection}
        status={status}
        targetTruthMode={targetTruthMode}
        title={title}
      />
    </>
  );
}

export function ManualWorkoutConstructorDialog({
  confirmLabel,
  confirmMessage,
  entries,
  isBusy,
  notes,
  onConfirm,
  onEntriesChange,
  onNotesChange,
  onOpenChange,
  onReview,
  onSaveTemplate,
  onScratchTemplateChange,
  onTargetTruthModeChange,
  onTitleChange,
  open,
  pendingLabel,
  reviewResult,
  reviewedDraft,
  selection,
  status,
  targetTruthMode,
  title,
}: {
  confirmLabel: string;
  confirmMessage: string | null;
  entries: ManualWorkoutConstructorEntryInput[];
  isBusy: boolean;
  notes: string;
  onConfirm: () => void;
  onEntriesChange: (entries: ManualWorkoutConstructorEntryInput[]) => void;
  onNotesChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onReview: () => void;
  onSaveTemplate?: (input: ManualSaveTemplateRequest) => Promise<void>;
  onScratchTemplateChange: (templateKey: ManualWorkoutTemplateKey) => void;
  onTargetTruthModeChange: (value: ManualWorkoutTargetTruthMode) => void;
  onTitleChange: (value: string) => void;
  open: boolean;
  pendingLabel: string;
  reviewResult: ManualWorkoutDraftReviewResult | null;
  reviewedDraft: ReviewedManualDraft | null;
  selection: ManualDraftSelection | null;
  status: ManualDraftStatus;
  targetTruthMode: ManualWorkoutTargetTruthMode;
  title: string;
}) {
  const selectedTemplate = selectionTemplate(selection);
  const canReview =
    Boolean(
      selection &&
      (selection.kind === "saved" ||
        (selectedTemplate && isReviewableEntries(selectedTemplate, entries))),
    ) && !isBusy;
  const reviewDisabledReason = selection
    ? constructorReviewDisabledReason(selection, selectedTemplate, entries)
    : "Choose a date before review.";
  const statusLabel = constructorStatusLabel(status, reviewResult);
  const source = constructorSource(selection);
  const readyReview = reviewedDraft?.review;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="hito-dialog-stable hito-product-dialog hito-dialog-surface-product hito-dialog-size-workflow hito-dialog-height-workflow"
        onOpenAutoFocus={focusManualWorkoutDialogCloseOnOpen}
        overlayClassName="hito-dialog-overlay-stable"
      >
        {selection ? (
          <ManualWorkoutEditorDialogHeader
            dateLabel={formatReadableDate(selection.date)}
            statusLabel={statusLabel}
            title={title}
          />
        ) : (
          <DialogHeader className="hito-product-dialog-header">
            <DialogTitle className="hito-modal-title">Manual workout</DialogTitle>
            <DialogDescription className="hito-body">
              Choose a date and template before reviewing.
            </DialogDescription>
          </DialogHeader>
        )}

        <div className="hito-product-dialog-body-scroll-fill">
          {selection ? (
            <div className="grid gap-4">
              <ManualWorkoutConstructorEditor
                allowedTargetTruthModes={allowedTargetTruthModes(selection, selectedTemplate)}
                dateLabel={formatReadableDate(selection.date)}
                entries={entries}
                entriesLocked={selection.kind === "saved"}
                iconKey={constructorIconKey(selection, selectedTemplate)}
                iconTone={constructorIconTone(selection, selectedTemplate)}
                isRestDraft={
                  selection.kind === "saved"
                    ? selection.template.targetTruthMode === "none"
                    : selectedTemplate?.workoutType === "rest"
                }
                notes={notes}
                onEntriesChange={onEntriesChange}
                onNotesChange={onNotesChange}
                onScratchTemplateChange={onScratchTemplateChange}
                onTargetTruthModeChange={
                  selection.kind === "saved" ? undefined : onTargetTruthModeChange
                }
                onTitleChange={onTitleChange}
                readbackMode={Boolean(readyReview)}
                reviewedDocument={readyReview?.draft ?? null}
                reviewDisabledReason={!canReview ? reviewDisabledReason : null}
                selectedTemplateKey={selectedTemplate?.templateKey ?? null}
                source={source}
                targetTruthMode={targetTruthMode}
                templateOptions={VISIBLE_MANUAL_WORKOUT_STARTER_TEMPLATES}
                title={title}
              />
              {readyReview ? (
                <ManualReviewedDraftNotice confirmMessage={confirmMessage} review={readyReview} />
              ) : reviewResult ? (
                <div>
                  <ManualReviewResultNotice result={reviewResult} />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <DialogFooter className="hito-product-dialog-footer sm:space-x-0">
          <button
            type="button"
            className="hito-button hito-button-secondary hito-button-md"
            disabled={isBusy}
            onClick={() => onOpenChange(false)}
          >
            Close
          </button>
          {readyReview ? (
            <>
              {onSaveTemplate ? (
                <ManualSaveTemplateAction
                  defaultName={readyReview.draft.title}
                  disabled={isBusy}
                  onSaveTemplate={onSaveTemplate}
                />
              ) : null}
              <button
                type="button"
                className="hito-button hito-button-primary hito-button-md"
                disabled={isBusy}
                onClick={onConfirm}
              >
                {status === "creating" ? pendingLabel : confirmLabel}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="hito-button hito-button-primary hito-button-md"
              disabled={!canReview}
              onClick={onReview}
            >
              {status === "reviewing" ? "Reviewing workout..." : "Review workout"}
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ManualReviewedDraftNotice({
  confirmMessage,
  review,
}: {
  confirmMessage: string | null;
  review: ManualReviewReady;
}) {
  if (review.review.warnings.length === 0 && !confirmMessage) {
    return (
      <p className="hito-field-helper">
        Hito reviewed this workout. Nothing is saved until you confirm.
      </p>
    );
  }

  return (
    <div className="hito-list-row items-start">
      <div className="grid min-w-0 gap-2">
        {review.review.warnings.map((warning) => (
          <p key={warning} className="hito-field-helper">
            Warning: {warning}
          </p>
        ))}
        {confirmMessage ? <p className="hito-field-error">{confirmMessage}</p> : null}
      </div>
    </div>
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
        saveError instanceof Error ? saveError.message : "The workout template could not be saved.",
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
      <button
        type="button"
        className="hito-button hito-button-secondary hito-button-md shrink-0"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        <Icon name="workout" size="xs" />
        Save as template
      </button>
      <DialogContent
        className="hito-dialog-stable hito-product-dialog hito-dialog-surface-product hito-dialog-size-compact"
        overlayClassName="hito-dialog-overlay-stable"
      >
        <DialogHeader className="hito-product-dialog-header">
          <DialogTitle className="hito-modal-title">Save as template</DialogTitle>
          <DialogDescription className="hito-body">
            Save this reviewed workout as a personal template. Hito rebuilds and checks it before it
            appears in your picker.
          </DialogDescription>
        </DialogHeader>
        <div className="hito-product-dialog-body grid gap-4">
          <label className="grid gap-2">
            <span className="hito-form-label">Template name</span>
            <input
              className="hito-field hito-field-primary hito-field-md"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Easy aerobic run"
            />
          </label>

          <label className="grid gap-2">
            <span className="hito-form-label">Calendar icon</span>
            <Select value={iconKey} onValueChange={(value) => setIconKey(value as CalendarIconKey)}>
              <SelectTrigger aria-label="Template calendar icon">
                <SelectValue placeholder="Calendar icon" />
              </SelectTrigger>
              <SelectContent>
                {CALENDAR_ICON_KEY_VALUES.map((value) => (
                  <SelectItem key={value} value={value}>
                    <span className="inline-flex items-center gap-2">
                      <WorkoutGlyph kind={value as WorkoutGlyphKind} />
                      {calendarIconLabel(value)}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="hito-field-helper">
              This icon only changes how your personal template appears in the picker.
            </span>
          </label>

          {error ? <p className="hito-field-error">{error}</p> : null}
        </div>
        <DialogFooter className="hito-product-dialog-footer sm:space-x-0">
          <button
            type="button"
            className="hito-button hito-button-secondary hito-button-md"
            disabled={isSaving}
            onClick={() => setOpen(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="hito-button hito-button-primary hito-button-md"
            disabled={!displayName.trim() || isSaving}
            onClick={() => void submitSave()}
          >
            {isSaving ? "Saving..." : "Save template"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ManualReviewResultNotice({ result }: { result: ManualWorkoutDraftReviewResult }) {
  if (result.ok) {
    return (
      <div className="hito-list-row items-start">
        <div className="min-w-0">
          <p className="hito-list-row-title">{result.review.headline}</p>
          <p className="hito-list-row-copy">{manualReviewReadyInlineSummary(result)}</p>
          <p className="hito-field-helper">
            Nothing is saved until you confirm this reviewed workout.
          </p>
        </div>
        <span className="hito-status-pill" data-tone="success">
          Ready
        </span>
      </div>
    );
  }

  return <ManualRejectedNotice result={result} />;
}

function manualReviewReadyInlineSummary(result: ManualReviewReady) {
  const segmentCount = result.draft.steps.reduce(
    (count, step) => count + (repeatChildSteps(step).length || 1),
    0,
  );
  const repeatCount = result.draft.steps.filter((step) => repeatCountForStep(step)).length;
  const segmentCopy = segmentCount === 1 ? "1 part" : `${segmentCount} parts`;

  return repeatCount > 0
    ? `${segmentCopy} · ${repeatCount} ${repeatCount === 1 ? "repeat" : "repeats"}`
    : segmentCopy;
}

function ManualRejectedNotice({ result }: { result: ManualReviewRejected }) {
  return (
    <div className="hito-list-row items-start">
      <div className="grid min-w-0 gap-2">
        <p className="hito-list-row-title">Review blocked</p>
        <p className="hito-list-row-copy">{result.message}</p>
        {result.issues.map((issue) => (
          <p key={`${issue.code}-${issue.message}`} className="hito-field-error">
            {issue.message}
          </p>
        ))}
      </div>
      <span className="hito-status-pill" data-tone="warning">
        Needs edit
      </span>
    </div>
  );
}

function selectionTemplate(selection: ManualDraftSelection | null): ManualWorkoutTemplate | null {
  if (!selection || selection.kind === "saved") return null;
  return selection.template;
}

function allowedTargetTruthModes(
  selection: ManualDraftSelection,
  selectedTemplate: ManualWorkoutTemplate | null,
): ManualWorkoutTargetTruthMode[] {
  if (selection.kind === "saved") return [selection.template.targetTruthMode];
  return selectedTemplate?.allowedTargetTruthModes ?? ["structure_only"];
}

function constructorIconKey(
  selection: ManualDraftSelection,
  selectedTemplate: ManualWorkoutTemplate | null,
): WorkoutGlyphKind {
  if (selection.kind === "saved") return selection.template.iconKey as WorkoutGlyphKind;
  return templateIconKind(selectedTemplate);
}

function constructorIconTone(
  selection: ManualDraftSelection,
  selectedTemplate: ManualWorkoutTemplate | null,
) {
  if (selection.kind === "saved") return calendarIconToneColor(selection.template.iconKey);
  return templateIconTone(selectedTemplate);
}

function constructorSource(selection: ManualDraftSelection | null): ManualWorkoutConstructorSource {
  if (selection?.kind === "saved") return "saved_template";
  if (selection?.kind === "scratch") return "scratch";
  return "template";
}

function constructorStatusLabel(
  status: ManualDraftStatus,
  reviewResult: ManualWorkoutDraftReviewResult | null,
) {
  if (status === "reviewing") return "Reviewing";
  if (reviewResult?.ok) return "Ready";
  if (reviewResult && !reviewResult.ok) return "Rejected";
  return "Draft";
}

function isReviewableEntries(
  selectedTemplate: ManualWorkoutTemplate,
  entries: ManualWorkoutConstructorEntryInput[],
) {
  if (selectedTemplate.workoutType === "rest") {
    return entries.length === 0;
  }

  return entries.some(entryHasExecutableStructure);
}

function constructorReviewDisabledReason(
  selection: ManualDraftSelection,
  selectedTemplate: ManualWorkoutTemplate | null,
  entries: ManualWorkoutConstructorEntryInput[],
) {
  if (selection.kind === "scratch" && !selectedTemplate) {
    return "Choose a supported workout type before review.";
  }
  if (selectedTemplate?.workoutType === "rest" && entries.length > 0) {
    return "Rest/no-run drafts cannot include workout blocks.";
  }
  if (selectedTemplate && !isReviewableEntries(selectedTemplate, entries)) {
    return "Add at least one duration or distance block, or choose Rest day for a no-run draft.";
  }
  return null;
}

function entryHasExecutableStructure(entry: ManualWorkoutConstructorEntryInput) {
  if (entry.kind === "repeat_group") {
    return getManualWorkoutRepeatGroupChildren(entry.group).some(blockHasExecutableStructure);
  }

  return blockHasExecutableStructure(entry.block);
}

function blockHasExecutableStructure(block: ManualWorkoutBlockInput) {
  return Boolean(block.durationSeconds || block.distanceMeters);
}

function savedTemplateReviewToRejected(
  result: Extract<ManualWorkoutSavedTemplateReviewResult, { ok: false }>,
): ManualReviewRejected {
  return buildManualReviewRejected(result.message, mapSavedTemplateReviewReason(result.reason));
}

function buildManualReviewRejected(
  message: string,
  reason: ManualReviewRejected["reason"] = "invalid_input",
): ManualReviewRejected {
  return {
    ok: false,
    status: "draft_rejected",
    reason,
    message,
    issues: [{ code: reason, message }],
    conflicts: [],
    persisted: false,
  };
}

function mapSavedTemplateReviewReason(
  reason: Extract<ManualWorkoutSavedTemplateReviewResult, { ok: false }>["reason"],
): ManualReviewRejected["reason"] {
  if (
    reason === "unsupported_template" ||
    reason === "unsupported_mapping" ||
    reason === "unsafe_block_structure" ||
    reason === "unsafe_metric_truth" ||
    reason === "protected_date_conflict" ||
    reason === "active_plan_conflict"
  ) {
    return reason;
  }

  return "invalid_input";
}

function buildPasteUnavailableResult(): ManualWorkoutDirectCopyResult {
  return {
    ok: false,
    status: "blocked",
    persisted: false,
    reason: "persistence_failed",
    message: PASTE_UNAVAILABLE_MESSAGE,
    sourceKind: MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
    workoutSourceKind: MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
  };
}

function moveTargetMenuCopy(dayKind: ManualWorkoutMoveTargetDayKind) {
  if (dayKind === "workout_day") {
    return "Review before replacing the planned workout on this day.";
  }

  return "Use this Rest day as the target.";
}

function isManualWorkoutDirectCopyResult(value: unknown): value is ManualWorkoutDirectCopyResult {
  if (!isRecord(value) || typeof value.ok !== "boolean") return false;
  if (!value.ok) return isCopyPasteBlockedResult(value);

  return (
    value.status === "copied" &&
    value.persisted === true &&
    typeof value.activePlanId === "string" &&
    typeof value.sourceWorkoutId === "string" &&
    typeof value.sourceWorkoutDate === "string" &&
    typeof value.targetWorkoutId === "string" &&
    typeof value.targetDate === "string" &&
    typeof value.title === "string" &&
    value.mutationMode === "direct_manual_edit"
  );
}

function isCopyPasteBlockedResult(
  value: Record<string, unknown>,
): value is Extract<ManualWorkoutDirectCopyResult, { ok: false }> {
  return (
    value.ok === false &&
    value.status === "blocked" &&
    value.persisted === false &&
    typeof value.reason === "string" &&
    typeof value.message === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object");
}

function calendarIconLabel(iconKey: CalendarIconKey) {
  return iconKey
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function calendarIconToneColor(iconKey: CalendarIconKey) {
  if (iconKey === "rest") return "var(--color-muted-foreground)";
  if (iconKey === "long") return "var(--color-signal)";
  if (iconKey === "tempo" || iconKey === "intervals" || iconKey === "hills") {
    return "var(--color-warning)";
  }
  if (iconKey === "trail") return "var(--color-success)";
  if (iconKey === "recovery") return "var(--color-info)";
  return "var(--color-foreground)";
}

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
import { formatDurationMin, formatDistanceMeters } from "@/lib/training";
import {
  addManualWorkoutToActivePlan,
  confirmManualWorkoutCopyPasteDraft,
  confirmManualWorkoutDeleteClear,
  listManualWorkoutSavedTemplates,
  reviewManualWorkoutCopyPasteDraft,
  reviewManualWorkoutDeleteClear,
  reviewManualWorkoutDraftAction,
  reviewManualWorkoutSavedTemplate,
  saveManualWorkoutSavedTemplate,
  type ManualWorkoutBlockInput,
  type ManualWorkoutCopyPasteReviewResult,
  type ManualWorkoutConstructorEntryInput,
  type ManualWorkoutDraftInput,
  type ManualWorkoutDraftReviewResult,
  type ManualWorkoutDeleteClearReviewResult,
  type ManualWorkoutSavedTemplateReviewResult,
  type ManualWorkoutSavedTemplateSaveResult,
  type ManualWorkoutSavedTemplateView,
  type ManualWorkoutTargetTruthMode,
} from "@/lib/training-api";
import { type ManualWorkoutTemplate } from "@/lib/manual-workout-authoring/templates";
import {
  MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
  MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
} from "@/lib/manual-workout-authoring/schema";
import type { WorkoutGlyphKind } from "@/lib/workout-glyph";
import {
  buildManualDraftInput,
  formatManualDraftStructure,
  formatReadableDate,
  getDefaultManualWorkoutTemplate,
  groupManualTemplates,
  targetTruthModeCopy,
  targetTruthModeLabel,
  templateShortLabel,
  workoutToneColor,
} from "@/components/manual-workout/manual-workout-authoring-utils";

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

export type ManualSavedTemplatesState = {
  status: "idle" | "loading" | "ready" | "failed";
  templates: ManualWorkoutSavedTemplateView[];
  message: string | null;
};

export type ManualCopiedWorkoutSource = {
  activePlanId: string;
  sourceWorkoutId: string;
  sourceWorkoutDate: string;
  title: string;
};

const MANUAL_ADD_TOAST_ID = "manual-active-plan-add";
const MANUAL_COPY_PASTE_TOAST_ID = "manual-workout-copy-paste";
const MANUAL_DELETE_CLEAR_TOAST_ID = "manual-workout-delete-clear";
const EMPTY_SAVED_TEMPLATES_STATE: ManualSavedTemplatesState = {
  status: "idle",
  templates: [],
  message: null,
};

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
  moveWorkoutSource = null,
}: {
  activePlanId: string;
  activePlanSourceKind: string;
  children: ReactNode;
  copiedWorkoutSource?: ManualCopiedWorkoutSource | null;
  date: string;
  disabled?: boolean;
  onAdded: () => void | Promise<void>;
  onMoveCanceled?: () => void;
  onMoveTargetSelected?: (targetDate: string) => void;
  moveWorkoutSource?: ManualCopiedWorkoutSource | null;
}) {
  const reviewManualWorkoutDraftFn = useServerFn(reviewManualWorkoutDraftAction);
  const reviewManualWorkoutCopyPasteDraftFn = useServerFn(reviewManualWorkoutCopyPasteDraft);
  const confirmManualWorkoutCopyPasteDraftFn = useServerFn(confirmManualWorkoutCopyPasteDraft);
  const listManualWorkoutSavedTemplatesFn = useServerFn(listManualWorkoutSavedTemplates);
  const reviewManualWorkoutSavedTemplateFn = useServerFn(reviewManualWorkoutSavedTemplate);
  const saveManualWorkoutSavedTemplateFn = useServerFn(saveManualWorkoutSavedTemplate);
  const addManualWorkoutToActivePlanFn = useServerFn(addManualWorkoutToActivePlan);
  const confirmInFlightRef = useRef(false);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [constructorOpen, setConstructorOpen] = useState(false);
  const [selection, setSelection] = useState<ManualDraftSelection | null>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [targetTruthMode, setTargetTruthMode] =
    useState<ManualWorkoutTargetTruthMode>("structure_only");
  const [status, setStatus] = useState<ManualDraftStatus>("idle");
  const [reviewResult, setReviewResult] = useState<ManualWorkoutDraftReviewResult | null>(null);
  const [reviewedDraft, setReviewedDraft] = useState<ReviewedManualDraft | null>(null);
  const [pasteReview, setPasteReview] = useState<ManualWorkoutCopyPasteReady | null>(null);
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

  const openConstructor = (template: ManualWorkoutTemplate) => {
    setSelection({ kind: "registry", date, template });
    setTitle(template.defaultTitle);
    setNotes(template.defaultNotes ?? "");
    setTargetTruthMode(template.defaultTargetTruthMode);
    setReviewResult(null);
    setReviewedDraft(null);
    setPasteReview(null);
    setConfirmMessage(null);
    setConstructorOpen(true);
  };

  const openTemplatePicker = () => {
    setSelection({
      kind: "registry",
      date,
      template: getDefaultManualWorkoutTemplate("easy_aerobic_run"),
    });
    setTemplatePickerOpen(true);
    void loadSavedTemplates();
  };

  const buildRegistryInput = (
    draftSelection: Extract<ManualDraftSelection, { kind: "registry" }>,
  ) =>
    buildManualDraftInput({
      activePlanId,
      activePlanSourceKind,
      contextMode: "existing_active_plan",
      date: draftSelection.date,
      notes,
      targetTruthMode,
      template: draftSelection.template,
      title,
    });

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

  const loadSavedTemplates = async () => {
    setSavedTemplatesState((current) => ({
      status: "loading",
      templates: current.templates,
      message: null,
    }));

    try {
      const result = await listManualWorkoutSavedTemplatesFn();
      if (!result.ok) {
        setSavedTemplatesState({
          status: "failed",
          templates: [],
          message: result.message,
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
    draftSelection: Extract<ManualDraftSelection, { kind: "registry" }>,
  ) => {
    const input = buildRegistryInput(draftSelection);

    setStatus("reviewing");
    setReviewResult(null);
    setReviewedDraft(null);
    setPasteReview(null);
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

      setReviewedDraft({ input, review: result });
      hitoToast.success({
        id: MANUAL_ADD_TOAST_ID,
        title: "Workout reviewed",
        description: "Review the backend-shaped draft before adding it to the plan.",
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
    setPasteReview(null);
    setConfirmMessage(null);
    hitoToast.working({
      id: MANUAL_ADD_TOAST_ID,
      title: "Reviewing saved template",
      description: "Hito is reconstructing the personal template server-side.",
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
      setReviewedDraft({ input: result.draftInput, review: result.review });
      hitoToast.success({
        id: MANUAL_ADD_TOAST_ID,
        title: "Template reviewed",
        description: "Review the backend-shaped draft before adding it to the plan.",
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

    setTemplatePickerOpen(false);
    setSelection(nextSelection);
    setTitle(nextTitle);
    setNotes(nextNotes);
    setTargetTruthMode(template.targetTruthMode);
    setReviewResult(null);
    setReviewedDraft(null);
    setPasteReview(null);
    setConfirmMessage(null);
    setConstructorOpen(true);
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
      description: "Hito is confirming the reviewed draft server-side.",
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
      setTemplatePickerOpen(false);
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

  const submitPasteReview = async () => {
    if (!copiedWorkoutSource || !canPasteCopiedWorkout || status !== "idle") return;

    setStatus("reviewing");
    setReviewResult(null);
    setReviewedDraft(null);
    setPasteReview(null);
    setConfirmMessage(null);
    hitoToast.working({
      id: MANUAL_COPY_PASTE_TOAST_ID,
      title: "Reviewing paste",
      description: "Hito is reconstructing the copied workout from saved plan truth.",
    });

    try {
      const result = await reviewManualWorkoutCopyPasteDraftFn({
        data: {
          activePlanId,
          sourceWorkoutId: copiedWorkoutSource.sourceWorkoutId,
          targetDate: date,
        },
      });
      setStatus("idle");

      if (!result.ok) {
        setConfirmMessage(result.message);
        hitoToast.error({
          id: MANUAL_COPY_PASTE_TOAST_ID,
          title: "Paste needs review",
          description: result.message,
        });
        return;
      }

      setPasteReview(result);
      hitoToast.success({
        id: MANUAL_COPY_PASTE_TOAST_ID,
        title: "Paste reviewed",
        description: "Confirm the backend-reviewed copy before it is saved.",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not review this copied workout yet.";
      setStatus("idle");
      setConfirmMessage(message);
      hitoToast.error({
        id: MANUAL_COPY_PASTE_TOAST_ID,
        title: "Paste review failed",
        description: message,
      });
    }
  };

  const confirmPasteReview = async () => {
    if (!pasteReview || confirmInFlightRef.current) return;

    confirmInFlightRef.current = true;
    setStatus("creating");
    setConfirmMessage(null);
    hitoToast.working({
      id: MANUAL_COPY_PASTE_TOAST_ID,
      title: "Pasting workout",
      description: "Hito is confirming the reviewed paste server-side.",
    });

    try {
      const result = await confirmManualWorkoutCopyPasteDraftFn({
        data: {
          activePlanId,
          sourceWorkoutId: pasteReview.sourceWorkoutId,
          targetDate: pasteReview.targetDate,
          reviewToken: pasteReview.review.reviewToken,
          reviewChecksum: pasteReview.review.reviewChecksum,
        },
      });

      if (!result.ok) {
        confirmInFlightRef.current = false;
        setStatus("idle");
        setConfirmMessage(result.message);
        hitoToast.error({
          id: MANUAL_COPY_PASTE_TOAST_ID,
          title: "Workout not pasted",
          description: result.message,
        });
        return;
      }

      hitoToast.success({
        id: MANUAL_COPY_PASTE_TOAST_ID,
        title: "Workout pasted",
        description: "Refreshing the calendar from saved plan truth.",
      });
      confirmInFlightRef.current = false;
      setStatus("idle");
      setConstructorOpen(false);
      setTemplatePickerOpen(false);
      setReviewedDraft(null);
      setPasteReview(null);
      setReviewResult(null);
      setConfirmMessage(null);
      await onAdded();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "The copied workout could not be pasted.";
      confirmInFlightRef.current = false;
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={disabled}>
          {children}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>{formatReadableDate(date)}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {canMoveSelectedWorkout ? (
            <>
              <DropdownMenuItem disabled={isBusy} onSelect={() => onMoveTargetSelected?.(date)}>
                <Icon name="arrow-right" size="xs" />
                Move selected workout here
              </DropdownMenuItem>
              <DropdownMenuItem disabled={isBusy} onSelect={onMoveCanceled}>
                <Icon name="close" size="xs" />
                Cancel move
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          ) : null}
          {canPasteCopiedWorkout ? (
            <>
              <DropdownMenuItem disabled={isBusy} onSelect={() => void submitPasteReview()}>
                <Icon name="copy" size="xs" />
                Paste copied workout
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          ) : null}
          <DropdownMenuItem
            disabled={isBusy}
            onSelect={() => openConstructor(getDefaultManualWorkoutTemplate("easy_aerobic_run"))}
          >
            <Icon name="edit" size="xs" />
            Create workout
          </DropdownMenuItem>
          <DropdownMenuItem disabled={isBusy} onSelect={openTemplatePicker}>
            <Icon name="workout" size="xs" />
            Choose template
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ManualTemplatePickerDialog
        open={templatePickerOpen}
        onOpenChange={setTemplatePickerOpen}
        onSelectTemplate={(template) => {
          setTemplatePickerOpen(false);
          openConstructor(template);
        }}
        onRefreshSavedTemplates={() => void loadSavedTemplates()}
        onSelectSavedTemplate={openSavedTemplate}
        savedTemplatesState={savedTemplatesState}
      />

      <ManualWorkoutConstructorDialog
        isBusy={isBusy}
        notes={notes}
        onNotesChange={(value) => {
          setNotes(value);
          setReviewResult(null);
          setReviewedDraft(null);
        }}
        onOpenChange={setConstructorOpen}
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
        reviewResult={reviewResult}
        selection={selection}
        status={status}
        targetTruthMode={targetTruthMode}
        title={title}
      />

      {reviewedDraft ? (
        <ManualReviewSummaryDialog
          confirmLabel="Add workout"
          confirmMessage={confirmMessage}
          isBusy={isBusy}
          onConfirm={() => void confirmReviewedDraft()}
          onOpenChange={(open) => {
            if (!open && !isBusy) {
              setReviewedDraft(null);
              setConfirmMessage(null);
            }
          }}
          open={Boolean(reviewedDraft)}
          pendingLabel="Adding workout..."
          review={reviewedDraft.review}
          onSaveTemplate={saveReviewedTemplate}
          status={status}
          supportCopy="Backend returned `draft_ready`. Add sends only active plan id, draft input, review token, and checksum."
          safetyCopy="No client rows, segments, or persistence metadata are sent to the add-workout seam."
        />
      ) : null}

      {pasteReview ? (
        <ManualCopyPasteReviewDialog
          confirmMessage={confirmMessage}
          isBusy={isBusy}
          onConfirm={() => void confirmPasteReview()}
          onOpenChange={(open) => {
            if (!open && !isBusy) {
              setPasteReview(null);
              setConfirmMessage(null);
            }
          }}
          open={Boolean(pasteReview)}
          review={pasteReview}
          status={status}
        />
      ) : null}
    </>
  );
}

type ManualWorkoutCopyPasteReady = Extract<ManualWorkoutCopyPasteReviewResult, { ok: true }>;
type ManualWorkoutDeleteClearReady = Extract<ManualWorkoutDeleteClearReviewResult, { ok: true }>;

export function ManualWorkoutCopyMenu({
  activePlanId,
  canClear = false,
  canMove = false,
  children,
  disabled = false,
  onCleared,
  onCopy,
  onMove,
  sourceWorkoutDate,
  sourceWorkoutId,
  title,
}: {
  activePlanId: string;
  canClear?: boolean;
  canMove?: boolean;
  children: ReactNode;
  disabled?: boolean;
  onCleared?: () => void | Promise<void>;
  onCopy: (source: ManualCopiedWorkoutSource) => void;
  onMove?: (source: ManualCopiedWorkoutSource) => void;
  sourceWorkoutDate: string;
  sourceWorkoutId: string;
  title: string;
}) {
  const reviewManualWorkoutDeleteClearFn = useServerFn(reviewManualWorkoutDeleteClear);
  const confirmManualWorkoutDeleteClearFn = useServerFn(confirmManualWorkoutDeleteClear);
  const confirmInFlightRef = useRef(false);
  const [status, setStatus] = useState<ManualDraftStatus>("idle");
  const [deleteReviewResult, setDeleteReviewResult] =
    useState<ManualWorkoutDeleteClearReviewResult | null>(null);
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);
  const isBusy = status !== "idle";

  const copySource = () => {
    const source = {
      activePlanId,
      sourceWorkoutDate,
      sourceWorkoutId,
      title,
    };
    onCopy(source);
    hitoToast.success({
      id: MANUAL_COPY_PASTE_TOAST_ID,
      title: "Workout copied",
      description: `${title} is ready to paste into an empty future day.`,
    });
  };

  const moveSource = () => {
    onMove?.({
      activePlanId,
      sourceWorkoutDate,
      sourceWorkoutId,
      title,
    });
    hitoToast.success({
      id: MANUAL_COPY_PASTE_TOAST_ID,
      title: "Move source selected",
      description: "Choose an empty future day and use Add to move this workout there.",
    });
  };

  const submitDeleteReview = async () => {
    if (disabled || !canClear || status !== "idle") return;

    setStatus("reviewing");
    setDeleteReviewResult(null);
    setConfirmMessage(null);
    hitoToast.working({
      id: MANUAL_DELETE_CLEAR_TOAST_ID,
      title: "Reviewing clear",
      description: "Hito is checking whether this manual workout can be cleared.",
    });

    try {
      const result = await reviewManualWorkoutDeleteClearFn({
        data: {
          activePlanId,
          plannedWorkoutId: sourceWorkoutId,
        },
      });
      setStatus("idle");
      setDeleteReviewResult(result);

      if (!result.ok) {
        hitoToast.error({
          id: MANUAL_DELETE_CLEAR_TOAST_ID,
          title: "Clear blocked",
          description: result.message,
        });
        return;
      }

      hitoToast.success({
        id: MANUAL_DELETE_CLEAR_TOAST_ID,
        title: "Clear reviewed",
        description: "Confirm before Hito removes this planned workout.",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not review this workout for clearing.";
      setStatus("idle");
      setDeleteReviewResult({
        ok: false,
        status: "blocked",
        reason: "invalid_input",
        message,
        persisted: false,
        sourceKind: MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
        workoutSourceKind: MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
      });
      hitoToast.error({
        id: MANUAL_DELETE_CLEAR_TOAST_ID,
        title: "Clear review failed",
        description: message,
      });
    }
  };

  const confirmDeleteReview = async () => {
    if (!deleteReviewResult?.ok || confirmInFlightRef.current) return;

    confirmInFlightRef.current = true;
    setStatus("creating");
    setConfirmMessage(null);
    hitoToast.working({
      id: MANUAL_DELETE_CLEAR_TOAST_ID,
      title: "Clearing workout",
      description: "Hito is confirming the reviewed delete server-side.",
    });

    try {
      const result = await confirmManualWorkoutDeleteClearFn({
        data: {
          activePlanId,
          plannedWorkoutId: deleteReviewResult.plannedWorkoutId,
          reviewToken: deleteReviewResult.review.reviewToken,
          reviewChecksum: deleteReviewResult.review.reviewChecksum,
        },
      });

      if (!result.ok) {
        confirmInFlightRef.current = false;
        setStatus("idle");
        setConfirmMessage(result.message);
        setDeleteReviewResult(result);
        hitoToast.error({
          id: MANUAL_DELETE_CLEAR_TOAST_ID,
          title: "Workout not cleared",
          description: result.message,
        });
        return;
      }

      hitoToast.success({
        id: MANUAL_DELETE_CLEAR_TOAST_ID,
        title: "Workout cleared",
        description: "Refreshing the calendar from saved plan truth.",
      });
      confirmInFlightRef.current = false;
      setStatus("idle");
      setDeleteReviewResult(null);
      setConfirmMessage(null);
      await onCleared?.();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "The planned workout could not be cleared.";
      confirmInFlightRef.current = false;
      setStatus("idle");
      setConfirmMessage(message);
      hitoToast.error({
        id: MANUAL_DELETE_CLEAR_TOAST_ID,
        title: "Workout not cleared",
        description: message,
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={disabled}>
          {children}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>{formatReadableDate(sourceWorkoutDate)}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={disabled || isBusy} onSelect={copySource}>
            <Icon name="copy" size="xs" />
            Copy workout
          </DropdownMenuItem>
          {canMove ? (
            <DropdownMenuItem disabled={disabled || isBusy} onSelect={moveSource}>
              <Icon name="arrow-right" size="xs" />
              Move workout
            </DropdownMenuItem>
          ) : null}
          {canClear ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                disabled={disabled || isBusy}
                onSelect={() => void submitDeleteReview()}
              >
                <Icon name="trash" size="xs" />
                Clear workout
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {deleteReviewResult ? (
        <ManualDeleteClearReviewDialog
          confirmMessage={confirmMessage}
          fallbackDate={sourceWorkoutDate}
          fallbackTitle={title}
          isBusy={isBusy}
          onConfirm={() => void confirmDeleteReview()}
          onOpenChange={(open) => {
            if (!open && !isBusy) {
              setDeleteReviewResult(null);
              setConfirmMessage(null);
            }
          }}
          open={Boolean(deleteReviewResult)}
          result={deleteReviewResult}
          status={status}
        />
      ) : null}
    </>
  );
}

export function ManualTemplatePickerDialog({
  onOpenChange,
  onRefreshSavedTemplates,
  onSelectSavedTemplate,
  onSelectTemplate,
  open,
  savedTemplatesState = EMPTY_SAVED_TEMPLATES_STATE,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefreshSavedTemplates?: () => void;
  onSelectSavedTemplate?: (template: ManualWorkoutSavedTemplateView) => void;
  onSelectTemplate: (template: ManualWorkoutTemplate) => void;
  savedTemplatesState?: ManualSavedTemplatesState;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="hito-product-dialog max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader className="hito-product-dialog-header">
          <DialogTitle className="hito-modal-title">Choose template</DialogTitle>
          <DialogDescription className="hito-body">
            Templates come from the backend manual authoring registry. Hito reviews the structure
            before anything is created.
          </DialogDescription>
        </DialogHeader>

        <div className="hito-product-dialog-body grid gap-4">
          {onSelectSavedTemplate ? (
            <section className="grid gap-2">
              <div className="flex items-center justify-between gap-3">
                <p className="hito-label">My saved templates</p>
                {onRefreshSavedTemplates ? (
                  <button
                    type="button"
                    className="hito-button hito-button-ghost hito-button-sm"
                    disabled={savedTemplatesState.status === "loading"}
                    onClick={onRefreshSavedTemplates}
                  >
                    <Icon name="refresh" size="xs" />
                    Refresh
                  </button>
                ) : null}
              </div>
              <div className="hito-row-group">
                {savedTemplatesState.status === "loading" ? (
                  <div className="hito-list-row items-start">
                    <span className="hito-status-pill mt-0.5 shrink-0" data-tone="muted">
                      Loading
                    </span>
                    <p className="hito-list-row-copy">Checking your personal templates.</p>
                  </div>
                ) : null}

                {savedTemplatesState.status === "failed" ? (
                  <div className="hito-list-row items-start">
                    <span className="hito-status-pill mt-0.5 shrink-0" data-tone="warning">
                      Unavailable
                    </span>
                    <div className="min-w-0">
                      <p className="hito-list-row-title">Could not load saved templates</p>
                      <p className="hito-list-row-copy">
                        {savedTemplatesState.message ??
                          "Personal templates are not available right now."}
                      </p>
                    </div>
                  </div>
                ) : null}

                {savedTemplatesState.status === "ready" &&
                savedTemplatesState.templates.length === 0 ? (
                  <div className="hito-list-row items-start">
                    <span className="hito-status-pill mt-0.5 shrink-0" data-tone="muted">
                      Empty
                    </span>
                    <p className="hito-list-row-copy">
                      Save a reviewed manual workout to reuse it here.
                    </p>
                  </div>
                ) : null}

                {savedTemplatesState.templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    className="hito-list-row w-full items-start text-left"
                    onClick={() => onSelectSavedTemplate(template)}
                  >
                    <span
                      className="hito-status-pill mt-0.5 shrink-0"
                      data-icon="false"
                      style={{ color: calendarIconToneColor(template.iconKey) }}
                    >
                      <WorkoutGlyph
                        kind={template.iconKey as WorkoutGlyphKind}
                        className="h-3 w-3"
                      />
                      {calendarIconLabel(template.iconKey)}
                    </span>
                    <span className="min-w-0">
                      <span className="hito-list-row-title block">{template.displayName}</span>
                      <span className="hito-list-row-copy block">
                        {savedTemplateSummary(template)}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {groupManualTemplates().map((group) => (
            <section key={group.id} className="grid gap-2">
              <p className="hito-label">{group.label}</p>
              <div className="hito-row-group">
                {group.templates.map((template) => (
                  <button
                    key={template.templateKey}
                    type="button"
                    className="hito-list-row w-full items-start text-left"
                    onClick={() => onSelectTemplate(template)}
                  >
                    <span
                      className="hito-status-pill mt-0.5 shrink-0"
                      data-icon="false"
                      style={{ color: workoutToneColor(template) }}
                    >
                      {templateShortLabel(template)}
                    </span>
                    <span className="min-w-0">
                      <span className="hito-list-row-title block">{template.label}</span>
                      <span className="hito-list-row-copy block">
                        {targetTruthModeCopy(template.defaultTargetTruthMode)}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ManualWorkoutConstructorDialog({
  isBusy,
  notes,
  onNotesChange,
  onOpenChange,
  onReview,
  onTargetTruthModeChange,
  onTitleChange,
  open,
  reviewResult,
  selection,
  status,
  targetTruthMode,
  title,
}: {
  isBusy: boolean;
  notes: string;
  onNotesChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onReview: () => void;
  onTargetTruthModeChange: (value: ManualWorkoutTargetTruthMode) => void;
  onTitleChange: (value: string) => void;
  open: boolean;
  reviewResult: ManualWorkoutDraftReviewResult | null;
  selection: ManualDraftSelection | null;
  status: ManualDraftStatus;
  targetTruthMode: ManualWorkoutTargetTruthMode;
  title: string;
}) {
  const canReview = Boolean(selection && title.trim()) && !isBusy;
  const entries = selection ? selectionEntries(selection) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="hito-product-dialog max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader className="hito-product-dialog-header">
          <DialogTitle className="hito-modal-title">
            {selection ? selectionLabel(selection) : "Manual workout"}
          </DialogTitle>
          <DialogDescription className="hito-body">
            {selection
              ? `${formatReadableDate(selection.date)}. Edit the runner-facing draft, then ask Hito to review it.`
              : "Choose a date and template before reviewing."}
          </DialogDescription>
        </DialogHeader>

        {selection ? (
          <div className="hito-product-dialog-body grid gap-5">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_16rem]">
              <label className="grid gap-2">
                <span className="hito-form-label">Workout title</span>
                <input
                  className="hito-field hito-field-primary hito-field-md"
                  value={title}
                  onChange={(event) => onTitleChange(event.target.value)}
                  placeholder={selectionDefaultTitle(selection)}
                />
              </label>

              {selection.kind === "registry" ? (
                <label className="grid gap-2">
                  <span className="hito-form-label">Target truth</span>
                  <Select
                    value={targetTruthMode}
                    onValueChange={(value) =>
                      onTargetTruthModeChange(value as ManualWorkoutTargetTruthMode)
                    }
                  >
                    <SelectTrigger aria-label="Target truth mode">
                      <SelectValue placeholder="Target truth" />
                    </SelectTrigger>
                    <SelectContent>
                      {selection.template.allowedTargetTruthModes.map((mode) => (
                        <SelectItem key={mode} value={mode}>
                          {targetTruthModeLabel(mode)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="hito-field-helper">{targetTruthModeCopy(targetTruthMode)}</span>
                </label>
              ) : (
                <div className="grid gap-2">
                  <span className="hito-form-label">Target truth</span>
                  <div className="hito-list-row items-start">
                    <span className="hito-status-pill mt-0.5 shrink-0" data-tone="muted">
                      Saved
                    </span>
                    <div className="min-w-0">
                      <p className="hito-list-row-title">
                        {targetTruthModeLabel(selection.template.targetTruthMode)}
                      </p>
                      <p className="hito-list-row-copy">
                        {targetTruthModeCopy(selection.template.targetTruthMode)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <label className="grid gap-2">
              <span className="hito-form-label">Notes or cues</span>
              <textarea
                className="hito-field hito-field-primary hito-textarea-md resize-none"
                rows={3}
                value={notes}
                onChange={(event) => onNotesChange(event.target.value)}
                placeholder="Optional note for this manual workout."
              />
            </label>

            <section className="grid gap-2">
              <p className="hito-label">Structure</p>
              <div className="hito-row-group">
                {entries.length ? (
                  entries.map((entry, index) => (
                    <div
                      key={`${selectionKey(selection)}-${index}`}
                      className="hito-list-row items-start"
                    >
                      <span className="hito-status-pill mt-0.5 shrink-0" data-tone="muted">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <p className="hito-list-row-title">{entryLabel(entry)}</p>
                        <p className="hito-list-row-copy">{entrySummary(entry)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="hito-list-row items-start">
                    <span className="hito-status-pill mt-0.5 shrink-0" data-tone="muted">
                      Rest
                    </span>
                    <p className="hito-list-row-copy">No executable run targets.</p>
                  </div>
                )}
              </div>
            </section>

            {reviewResult ? <ManualReviewResultNotice result={reviewResult} /> : null}
          </div>
        ) : null}

        <DialogFooter className="hito-product-dialog-footer sm:space-x-0">
          <button
            type="button"
            className="hito-button hito-button-secondary hito-button-md"
            disabled={isBusy}
            onClick={() => onOpenChange(false)}
          >
            Close
          </button>
          <button
            type="button"
            className="hito-button hito-button-primary hito-button-md"
            disabled={!canReview}
            onClick={onReview}
          >
            {status === "reviewing" ? "Reviewing workout..." : "Review workout"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ManualReviewSummary({
  confirmLabel,
  confirmMessage,
  isBusy,
  onConfirm,
  onSaveTemplate,
  pendingLabel,
  review,
  safetyCopy,
  status,
  supportCopy,
}: {
  confirmLabel: string;
  confirmMessage: string | null;
  isBusy: boolean;
  onConfirm: () => void;
  onSaveTemplate?: (input: ManualSaveTemplateRequest) => Promise<void>;
  pendingLabel: string;
  review: ManualReviewReady;
  safetyCopy: string;
  status: ManualDraftStatus;
  supportCopy: string;
}) {
  const reviewedDateLabel = formatReadableDate(review.draft.workoutDate);

  return (
    <div className="hito-row-group">
      <div className="hito-list-row items-start">
        <div className="min-w-0">
          <p className="hito-list-row-title">{reviewedDateLabel}</p>
          <p className="hito-list-row-copy">Selected calendar day for this reviewed workout.</p>
        </div>
        <span className="hito-status-pill shrink-0" data-tone="muted">
          {review.draft.weekday}
        </span>
      </div>

      <div className="hito-list-row items-start">
        <div className="min-w-0">
          <p className="hito-list-row-title">{review.review.headline}</p>
          <p className="hito-list-row-copy">{supportCopy}</p>
        </div>
        <span className="hito-status-pill shrink-0" data-tone="success">
          Ready
        </span>
      </div>

      <div className="hito-list-row items-start">
        <div className="grid min-w-0 gap-2">
          {review.review.bullets.map((bullet) => (
            <p key={bullet} className="hito-list-row-copy">
              {bullet}
            </p>
          ))}
          {review.review.warnings.map((warning) => (
            <p key={warning} className="hito-field-helper">
              Warning: {warning}
            </p>
          ))}
          {confirmMessage ? <p className="hito-field-error">{confirmMessage}</p> : null}
        </div>
      </div>

      <div className="hito-list-row">
        <p className="hito-field-helper min-w-0">{safetyCopy}</p>
        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          {onSaveTemplate ? (
            <ManualSaveTemplateAction
              defaultName={review.draft.title}
              disabled={isBusy}
              onSaveTemplate={onSaveTemplate}
            />
          ) : null}
          <button
            type="button"
            className="hito-button hito-button-primary hito-button-md shrink-0"
            disabled={isBusy}
            onClick={onConfirm}
          >
            {status === "creating" ? pendingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function ManualReviewSummaryDialog({
  confirmLabel,
  confirmMessage,
  isBusy,
  onConfirm,
  onOpenChange,
  onSaveTemplate,
  open,
  pendingLabel,
  review,
  safetyCopy,
  status,
  supportCopy,
}: {
  confirmLabel: string;
  confirmMessage: string | null;
  isBusy: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  onSaveTemplate?: (input: ManualSaveTemplateRequest) => Promise<void>;
  open: boolean;
  pendingLabel: string;
  review: ManualReviewReady;
  safetyCopy: string;
  status: ManualDraftStatus;
  supportCopy: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="hito-product-dialog max-w-2xl">
        <DialogHeader className="hito-product-dialog-header">
          <DialogTitle className="hito-modal-title">Review add</DialogTitle>
          <DialogDescription className="hito-body">
            Confirm this reviewed manual workout before it is saved into the active plan.
          </DialogDescription>
        </DialogHeader>
        <div className="hito-product-dialog-body">
          <ManualReviewSummary
            confirmLabel={confirmLabel}
            confirmMessage={confirmMessage}
            isBusy={isBusy}
            onConfirm={onConfirm}
            onSaveTemplate={onSaveTemplate}
            pendingLabel={pendingLabel}
            review={review}
            safetyCopy={safetyCopy}
            status={status}
            supportCopy={supportCopy}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ManualCopyPasteReviewDialog({
  confirmMessage,
  isBusy,
  onConfirm,
  onOpenChange,
  open,
  review,
  status,
}: {
  confirmMessage: string | null;
  isBusy: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  review: ManualWorkoutCopyPasteReady;
  status: ManualDraftStatus;
}) {
  const draft = review.review.draft;
  const sourceLabel = formatReadableDate(review.sourceWorkoutDate);
  const targetLabel = formatReadableDate(review.targetDate);
  const metricPolicy = targetTruthModeLabel(review.draftInput.targetTruthMode ?? "structure_only");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="hito-product-dialog max-w-2xl">
        <DialogHeader className="hito-product-dialog-header">
          <DialogTitle className="hito-modal-title">Review paste</DialogTitle>
          <DialogDescription className="hito-body">
            Confirm this backend-reviewed copy before it is saved into the active manual plan.
          </DialogDescription>
        </DialogHeader>
        <div className="hito-product-dialog-body space-y-4">
          <div className="hito-row-group">
            <div className="hito-list-row items-start">
              <div className="min-w-0">
                <p className="hito-list-row-title">Copy source</p>
                <p className="hito-list-row-copy">{sourceLabel}</p>
              </div>
              <span className="hito-status-pill shrink-0" data-tone="muted">
                Verified
              </span>
            </div>
            <div className="hito-list-row items-start">
              <div className="min-w-0">
                <p className="hito-list-row-title">Paste target</p>
                <p className="hito-list-row-copy">{targetLabel}</p>
              </div>
              <span className="hito-status-pill shrink-0" data-tone="success">
                Empty day
              </span>
            </div>
            <div className="hito-list-row items-start">
              <div className="min-w-0">
                <p className="hito-list-row-title">{draft.title}</p>
                <p className="hito-list-row-copy">
                  {formatManualDraftStructure(draft.totalDurationMin, draft.totalDistanceKm)} ·{" "}
                  {metricPolicy}
                </p>
              </div>
              <span className="hito-status-pill shrink-0" data-tone="muted">
                {draft.templateKey.replaceAll("_", " ")}
              </span>
            </div>
          </div>

          <ManualReviewSummary
            confirmLabel="Paste workout"
            confirmMessage={confirmMessage}
            isBusy={isBusy}
            onConfirm={onConfirm}
            pendingLabel="Pasting workout..."
            review={review.review}
            safetyCopy="Paste confirm sends only active plan id, source workout id, target date, review token, and checksum."
            status={status}
            supportCopy="Backend reconstructed this draft from the persisted source workout and reviewed it for the selected target date."
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ManualDeleteClearReviewDialog({
  confirmMessage,
  fallbackDate,
  fallbackTitle,
  isBusy,
  onConfirm,
  onOpenChange,
  open,
  result,
  status,
}: {
  confirmMessage: string | null;
  fallbackDate: string;
  fallbackTitle: string;
  isBusy: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  result: ManualWorkoutDeleteClearReviewResult;
  status: ManualDraftStatus;
}) {
  const dateLabel = formatReadableDate(result.ok ? result.workoutDate : fallbackDate);

  if (!result.ok) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="hito-product-dialog max-w-xl">
          <DialogHeader className="hito-product-dialog-header">
            <DialogTitle className="hito-modal-title">Clear blocked</DialogTitle>
            <DialogDescription className="hito-body">
              Hito could not approve clearing this planned manual workout.
            </DialogDescription>
          </DialogHeader>
          <div className="hito-product-dialog-body">
            <div className="hito-row-group">
              <div className="hito-list-row items-start">
                <div className="min-w-0">
                  <p className="hito-list-row-title">{fallbackTitle}</p>
                  <p className="hito-list-row-copy">{dateLabel}</p>
                </div>
                <span className="hito-status-pill shrink-0" data-tone="warning">
                  Blocked
                </span>
              </div>
              <div className="hito-list-row items-start">
                <div className="min-w-0">
                  <p className="hito-list-row-title">{clearBlockedReasonLabel(result.reason)}</p>
                  <p className="hito-list-row-copy">{result.message}</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="hito-product-dialog-footer sm:space-x-0">
            <button
              type="button"
              className="hito-button hito-button-secondary hito-button-md"
              onClick={() => onOpenChange(false)}
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <ManualDeleteClearReadyDialog
      confirmMessage={confirmMessage}
      dateLabel={dateLabel}
      isBusy={isBusy}
      onConfirm={onConfirm}
      onOpenChange={onOpenChange}
      open={open}
      result={result}
      status={status}
    />
  );
}

function ManualDeleteClearReadyDialog({
  confirmMessage,
  dateLabel,
  isBusy,
  onConfirm,
  onOpenChange,
  open,
  result,
  status,
}: {
  confirmMessage: string | null;
  dateLabel: string;
  isBusy: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  result: ManualWorkoutDeleteClearReady;
  status: ManualDraftStatus;
}) {
  const draft = result.restore.review.draft;
  const metricPolicy = targetTruthModeLabel(result.restore.draftInput.targetTruthMode);
  const restoreLabels = [result.restore.label, ...result.restore.alternateLabels].join(" / ");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="hito-product-dialog max-w-2xl">
        <DialogHeader className="hito-product-dialog-header">
          <DialogTitle className="hito-modal-title">Review clear workout</DialogTitle>
          <DialogDescription className="hito-body">
            Confirm before Hito removes this planned workout from your manual active plan.
          </DialogDescription>
        </DialogHeader>
        <div className="hito-product-dialog-body space-y-4">
          <div className="hito-row-group">
            <div className="hito-list-row items-start">
              <div className="min-w-0">
                <p className="hito-list-row-title">{dateLabel}</p>
                <p className="hito-list-row-copy">
                  Selected calendar day for the planned workout being cleared.
                </p>
              </div>
              <span className="hito-status-pill shrink-0" data-tone="muted">
                Verified
              </span>
            </div>

            <div className="hito-list-row items-start">
              <div className="min-w-0">
                <p className="hito-list-row-title">{result.title}</p>
                <p className="hito-list-row-copy">
                  {formatManualDraftStructure(draft.totalDurationMin, draft.totalDistanceKm)} ·{" "}
                  {metricPolicy}
                </p>
              </div>
              <span className="hito-status-pill shrink-0" data-tone="muted">
                {result.templateKey.replaceAll("_", " ")}
              </span>
            </div>

            <div className="hito-list-row items-start">
              <div className="min-w-0">
                <p className="hito-list-row-title">What changes</p>
                <p className="hito-list-row-copy">
                  Hito deletes exactly this planned workout row. The active plan remains active and
                  the calendar refreshes from persisted plan truth.
                </p>
              </div>
              <span className="hito-status-pill shrink-0" data-tone="warning">
                Planned only
              </span>
            </div>

            <div className="hito-list-row items-start">
              <div className="min-w-0">
                <p className="hito-list-row-title">Restore affordance</p>
                <p className="hito-list-row-copy">
                  Backend returned reviewed next-step data for {restoreLabels}. Actual restore must
                  go back through the manual Add review flow.
                </p>
              </div>
              <span className="hito-status-pill shrink-0" data-tone="muted">
                {result.restore.label}
              </span>
            </div>

            {confirmMessage ? (
              <div className="hito-list-row items-start">
                <p className="hito-field-error min-w-0">{confirmMessage}</p>
              </div>
            ) : null}
          </div>
        </div>
        <DialogFooter className="hito-product-dialog-footer sm:space-x-0">
          <button
            type="button"
            className="hito-button hito-button-secondary hito-button-md"
            disabled={isBusy}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="hito-button hito-button-primary hito-button-md"
            data-tone="error"
            disabled={isBusy}
            onClick={onConfirm}
          >
            {status === "creating" ? (
              <>
                <Icon name="loader" size="xs" className="animate-spin" />
                Clearing workout...
              </>
            ) : (
              <>
                <Icon name="trash" size="xs" />
                Clear workout
              </>
            )}
          </button>
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
      <DialogContent className="hito-product-dialog max-w-lg">
        <DialogHeader className="hito-product-dialog-header">
          <DialogTitle className="hito-modal-title">Save as template</DialogTitle>
          <DialogDescription className="hito-body">
            Save this reviewed workout as a personal template. Hito rebuilds and validates it
            server-side before it appears in your picker.
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
          <p className="hito-list-row-copy">Review token and checksum are held for confirm only.</p>
        </div>
        <span className="hito-status-pill" data-tone="success">
          Ready
        </span>
      </div>
    );
  }

  return <ManualRejectedNotice result={result} />;
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

function selectionLabel(selection: ManualDraftSelection) {
  return selection.kind === "registry" ? selection.template.label : selection.template.displayName;
}

function selectionDefaultTitle(selection: ManualDraftSelection) {
  return selection.kind === "registry"
    ? selection.template.defaultTitle
    : selection.template.displayName;
}

function selectionEntries(selection: ManualDraftSelection): ManualWorkoutConstructorEntryInput[] {
  return selection.kind === "registry"
    ? selection.template.defaultEntries
    : selection.template.draftPayload.entries;
}

function selectionKey(selection: ManualDraftSelection) {
  return selection.kind === "registry" ? selection.template.templateKey : selection.template.id;
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

function clearBlockedReasonLabel(
  reason: Extract<ManualWorkoutDeleteClearReviewResult, { ok: false }>["reason"],
) {
  if (reason === "last_workout_not_deletable") return "Last workout is protected";
  if (reason === "protected_day") return "Protected day";
  if (reason === "target_workout_not_found") return "Workout not found";
  if (reason === "target_workout_not_in_active_plan") return "Workout is not in this plan";
  if (reason === "target_workout_not_supported") return "Workout cannot be cleared here";
  if (reason === "unsupported_active_plan_source") return "Only manual plans can be changed here";
  if (reason === "stale_review") return "Review is stale";
  if (reason === "invalid_review") return "Review needs refresh";
  if (reason === "unauthenticated") return "Sign in required";
  if (reason === "persistence_failed") return "Could not save the change";
  if (reason === "no_active_plan") return "No active manual plan";
  return "Clear needs review";
}

function savedTemplateSummary(template: ManualWorkoutSavedTemplateView) {
  const parts = [
    targetTruthModeLabel(template.targetTruthMode),
    formatDurationMin(template.draftPayload.totalDurationMin),
  ];

  if (template.draftPayload.totalDistanceKm > 0) {
    parts.push(formatDistanceMeters(template.draftPayload.totalDistanceKm * 1000));
  }

  return parts.join(" · ");
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

function entryLabel(entry: ManualWorkoutConstructorEntryInput) {
  if (entry.kind === "repeat_group") {
    return entry.group.groupLabel ?? `${entry.group.repeatCount} repeats`;
  }

  return entry.block.label ?? blockLabel(entry.block.blockKey);
}

function entrySummary(entry: ManualWorkoutConstructorEntryInput) {
  if (entry.kind === "repeat_group") {
    const recovery = entry.group.recoveryBlock
      ? ` / ${blockUnit(entry.group.recoveryBlock)} recovery`
      : "";
    return `${entry.group.repeatCount} x ${blockUnit(entry.group.workBlock)}${recovery}`;
  }

  return blockUnit(entry.block);
}

function blockLabel(blockKey: string) {
  return blockKey
    .replace(/_block$/, "")
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function blockUnit(block: ManualWorkoutBlockInput) {
  if (block.durationSeconds) {
    return formatDurationMin(block.durationSeconds / 60, "segment");
  }
  if (block.distanceMeters) {
    return formatDistanceMeters(block.distanceMeters);
  }
  if (block.noteText) {
    return block.noteText;
  }
  return "Structure";
}

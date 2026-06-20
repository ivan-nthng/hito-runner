import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HitoCalendarDayCell } from "@/components/ui/hito-calendar-day";
import { HitoDateField } from "@/components/ui/hito-date-time-input";
import { Icon } from "@/components/ui/icon";
import { hitoToast } from "@/components/ui/hito-toast";
import {
  confirmManualWorkoutDraft,
  listManualWorkoutSavedTemplates,
  reviewManualWorkoutDraftAction,
  reviewManualWorkoutSavedTemplate,
  saveManualWorkoutSavedTemplate,
} from "@/lib/training-api";
import type {
  ManualWorkoutSavedTemplateReviewResult,
  ManualWorkoutSavedTemplateSaveResult,
  ManualWorkoutSavedTemplateView,
  ManualWorkoutTemplateKey,
  ManualWorkoutTargetTruthMode,
  ManualWorkoutDraftInput,
  ManualWorkoutDraftReviewResult,
} from "@/lib/manual-workout-authoring";
import type { ManualWorkoutConstructorEntryInput } from "@/lib/manual-workout-authoring/schema";
import type { ManualWorkoutTemplate } from "@/lib/manual-workout-authoring/templates";
import {
  ManualReviewSummary,
  ManualTemplatePickerDialog,
  ManualWorkoutConstructorDialog,
  type ManualDraftSelection,
  type ManualDraftStatus,
  type ManualSavedTemplatesState,
  type ManualSaveTemplateRequest,
  type ReviewedManualDraft,
} from "@/components/manual-workout/ManualWorkoutAuthoringControls";
import {
  buildManualDraftInput,
  cloneManualWorkoutEntries,
  formatReadableDate,
  getDefaultManualWorkoutTemplate,
  targetTruthModeLabel,
  templateWorkoutIdentity,
} from "@/components/manual-workout/manual-workout-authoring-utils";
import { addDaysIso, todayIso } from "@/lib/training";

interface ManualUserBuiltPlanPanelProps {
  canStartBuilding?: boolean;
  isGlobalBusy?: boolean;
  onPlanCreated: () => void;
  startBlockedReason?: string;
}

const MANUAL_TOAST_ID = "manual-user-built-plan";
const MANUAL_DRAFT_HORIZON_DAYS = 28;
const EMPTY_SAVED_TEMPLATES_STATE: ManualSavedTemplatesState = {
  status: "idle",
  templates: [],
  message: null,
};

export function ManualUserBuiltPlanPanel({
  canStartBuilding = true,
  isGlobalBusy = false,
  onPlanCreated,
  startBlockedReason = "Add the basics before opening the empty calendar.",
}: ManualUserBuiltPlanPanelProps) {
  const reviewManualWorkoutDraftFn = useServerFn(reviewManualWorkoutDraftAction);
  const listManualWorkoutSavedTemplatesFn = useServerFn(listManualWorkoutSavedTemplates);
  const reviewManualWorkoutSavedTemplateFn = useServerFn(reviewManualWorkoutSavedTemplate);
  const saveManualWorkoutSavedTemplateFn = useServerFn(saveManualWorkoutSavedTemplate);
  const confirmManualWorkoutDraftFn = useServerFn(confirmManualWorkoutDraft);
  const confirmInFlightRef = useRef(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [startDate, setStartDate] = useState(() => todayIso());
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
  const isBusy = isGlobalBusy || status !== "idle";
  const draftDates = buildManualDraftDates(startDate, MANUAL_DRAFT_HORIZON_DAYS);
  const addedWorkoutCount =
    reviewedDraft?.review.draft.workoutType === "rest" ? 0 : reviewedDraft ? 1 : 0;

  const openConstructor = (date: string, template: ManualWorkoutTemplate) => {
    setSelection({ kind: "registry", date, template });
    setTitle(template.defaultTitle);
    setNotes(template.defaultNotes ?? "");
    setTargetTruthMode(template.defaultTargetTruthMode);
    setEntries(cloneManualWorkoutEntries(template.defaultEntries));
    setReviewResult(null);
    setConfirmMessage(null);
    setConstructorOpen(true);
  };

  const openScratchConstructor = (date: string) => {
    setSelection({ kind: "scratch", date, template: null });
    setTitle("");
    setNotes("");
    setTargetTruthMode("structure_only");
    setEntries([]);
    setReviewResult(null);
    setConfirmMessage(null);
    setConstructorOpen(true);
  };

  const openTemplatePicker = (date: string) => {
    setSelection({
      kind: "registry",
      date,
      template: getDefaultManualWorkoutTemplate("easy_aerobic_run"),
    });
    setTemplatePickerOpen(true);
    void loadSavedTemplates();
  };

  const buildRegistryInput = (
    draftSelection: Extract<ManualDraftSelection, { kind: "registry" | "scratch" }>,
  ) => {
    if (!draftSelection.template) {
      throw new Error("Choose a backend-supported workout type before review.");
    }

    return buildManualDraftInput({
      contextMode: "no_active_plan_draft",
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
      mode: "no_active_plan_draft" as const,
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
      setReviewResult(
        buildManualReviewRejected("Choose a backend-supported workout type before review."),
      );
      return;
    }

    const input = buildRegistryInput(draftSelection);

    setStatus("reviewing");
    setReviewResult(null);
    setReviewedDraft(null);
    setConfirmMessage(null);
    hitoToast.working({
      id: MANUAL_TOAST_ID,
      title: "Reviewing workout",
      description: "Hito is validating the manual draft before anything is created.",
    });

    try {
      const result = await reviewManualWorkoutDraftFn({ data: input });
      setReviewResult(result);
      setStatus("idle");

      if (!result.ok) {
        hitoToast.error({
          id: MANUAL_TOAST_ID,
          title: "Workout needs changes",
          description: result.message,
        });
        return;
      }

      setReviewedDraft({ input, review: result });
      hitoToast.success({
        id: MANUAL_TOAST_ID,
        title: "Workout reviewed",
        description: "Review the backend-shaped draft before creating the plan.",
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
        id: MANUAL_TOAST_ID,
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
      id: MANUAL_TOAST_ID,
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
          id: MANUAL_TOAST_ID,
          title: "Template needs changes",
          description: result.message,
        });
        return;
      }

      setReviewResult(result.review);
      setReviewedDraft({ input: result.draftInput, review: result.review });
      hitoToast.success({
        id: MANUAL_TOAST_ID,
        title: "Template reviewed",
        description: "Review the backend-shaped draft before creating the plan.",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not review this saved template yet.";
      setStatus("idle");
      setReviewResult(buildManualReviewRejected(message));
      hitoToast.error({
        id: MANUAL_TOAST_ID,
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
    if (!selection) return;

    const nextSelection: ManualDraftSelection = { kind: "saved", date: selection.date, template };
    const nextTitle = template.displayName;
    const nextNotes = template.draftPayload.sourceNotes ?? "";

    setTemplatePickerOpen(false);
    setSelection(nextSelection);
    setTitle(nextTitle);
    setNotes(nextNotes);
    setTargetTruthMode(template.targetTruthMode);
    setEntries(cloneManualWorkoutEntries(template.draftPayload.entries));
    setReviewResult(null);
    setReviewedDraft(null);
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
      id: MANUAL_TOAST_ID,
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
      id: MANUAL_TOAST_ID,
      title: "Creating manual plan",
      description: "Hito is confirming the reviewed draft server-side.",
    });

    try {
      const result = await confirmManualWorkoutDraftFn({
        data: {
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
          id: MANUAL_TOAST_ID,
          title: "Plan not created",
          description: result.message,
        });
        return;
      }

      hitoToast.success({
        id: MANUAL_TOAST_ID,
        title: "Manual plan created",
        description: "Opening your saved plan now.",
        duration: 2600,
      });
      onPlanCreated();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "The manual user-built plan could not be created.";
      confirmInFlightRef.current = false;
      setStatus("idle");
      setConfirmMessage(message);
      hitoToast.error({
        id: MANUAL_TOAST_ID,
        title: "Plan not created",
        description: message,
      });
    }
  };

  return (
    <section className="hito-section-divider pt-6" aria-labelledby="manual-plan-entry-title">
      <div className="hito-surface-wash" data-tone="signal">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <p className="hito-label" id="manual-plan-entry-title">
              Manual setup
            </p>
            <p className="hito-list-row-copy mt-1 max-w-2xl">
              Start with an empty calendar and add workouts yourself. Hito reviews each workout
              before it becomes part of your plan.
            </p>
            {!canStartBuilding ? (
              <p className="hito-field-helper mt-2">{startBlockedReason}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="hito-button hito-button-secondary hito-button-md shrink-0"
            disabled={isBusy || !canStartBuilding}
            onClick={() => setWorkspaceOpen((open) => !open)}
          >
            <Icon name="calendar-clock" size="sm" />
            {workspaceOpen ? "Close builder" : "Start building"}
          </button>
        </div>
      </div>

      {workspaceOpen ? (
        <div className="mt-5 grid gap-5" data-manual-user-built-plan-workspace="">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <p className="hito-list-row-title">Build your plan</p>
              <p className="hito-list-row-copy">
                Empty dates mean nothing is planned yet. Nothing is saved until you confirm.
              </p>
            </div>
            <div className="w-full min-w-0 md:max-w-xs">
              <HitoDateField
                id="manual-plan-start-date"
                label="Draft start date"
                value={startDate}
                onChange={(value) => setStartDate(value || todayIso())}
                helper={`${addedWorkoutCount} workout${addedWorkoutCount === 1 ? "" : "s"} reviewed`}
              />
            </div>
          </div>

          <div className="hito-row-group overflow-hidden">
            <div className="grid grid-cols-7 border-b border-hairline">
              {WEEKDAY_HEADINGS.map((weekday) => (
                <div key={weekday} className="hito-calendar-grid-heading">
                  <span className="hito-micro-label">{weekday}</span>
                </div>
              ))}
            </div>
            <div className="hito-calendar-grid hito-calendar-grid-month-dense">
              {draftDates.map((date) => {
                const authored = reviewedDraft?.review.draft.workoutDate === date;
                const draft = authored ? reviewedDraft.review.draft : null;
                const state = !draft ? "empty" : draft.workoutType === "rest" ? "rest" : "workout";
                const template = draft ? getDefaultManualWorkoutTemplate(draft.templateKey) : null;

                return (
                  <DropdownMenu key={date}>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="block h-full min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/30"
                        aria-label={`${formatReadableDate(date)}. Open manual draft actions.`}
                      >
                        <HitoCalendarDayCell
                          action={
                            draft
                              ? { label: "Reviewed", tone: "success" }
                              : { label: "Add", icon: "plus", tone: "muted" }
                          }
                          day={date.slice(8)}
                          dense
                          interactive
                          result={draft && draft.workoutType !== "rest" ? "planned" : "none"}
                          state={state}
                          supportingText={
                            draft ? targetTruthModeLabel(draft.metricMode.mode) : null
                          }
                          title={draft?.title}
                          workout={draft && template ? templateWorkoutIdentity(template) : null}
                        />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      <DropdownMenuLabel>{formatReadableDate(date)}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => openScratchConstructor(date)}>
                        <Icon name="edit" size="xs" />
                        Start from scratch
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => openTemplatePicker(date)}>
                        <Icon name="workout" size="xs" />
                        Choose template
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() =>
                          openConstructor(date, getDefaultManualWorkoutTemplate("rest_day"))
                        }
                      >
                        <Icon name="minus" size="xs" />
                        Add rest day
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              })}
            </div>
          </div>

          {reviewedDraft ? (
            <ManualReviewSummary
              confirmLabel="Create manual plan"
              confirmMessage={confirmMessage}
              isBusy={isBusy}
              onConfirm={() => void confirmReviewedDraft()}
              onSaveTemplate={saveReviewedTemplate}
              pendingLabel="Creating plan..."
              review={reviewedDraft.review}
              safetyCopy="No OpenAI, no client rows, and no saved state is claimed before confirm succeeds."
              status={status}
              supportCopy="Backend returned `draft_ready`. Create sends only draft input, review token, and checksum."
            />
          ) : (
            <p className="hito-field-helper">
              Review one workout to create your first manual plan.
            </p>
          )}
        </div>
      ) : null}

      <ManualTemplatePickerDialog
        open={templatePickerOpen}
        onOpenChange={setTemplatePickerOpen}
        onSelectTemplate={(template) => {
          if (!selection) return;
          setTemplatePickerOpen(false);
          openConstructor(selection.date, template);
        }}
        onRefreshSavedTemplates={() => void loadSavedTemplates()}
        onSelectSavedTemplate={openSavedTemplate}
        savedTemplatesState={savedTemplatesState}
      />

      <ManualWorkoutConstructorDialog
        entries={entries}
        isBusy={isBusy}
        notes={notes}
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
        onOpenChange={setConstructorOpen}
        onScratchTemplateChange={(templateKey: ManualWorkoutTemplateKey) => {
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
        reviewResult={reviewResult}
        selection={selection}
        status={status}
        targetTruthMode={targetTruthMode}
        title={title}
      />
    </section>
  );
}

function buildManualDraftDates(startDate: string, horizonDays: number) {
  return Array.from({ length: horizonDays }, (_, index) => addDaysIso(startDate, index));
}

function savedTemplateReviewToRejected(
  result: Extract<ManualWorkoutSavedTemplateReviewResult, { ok: false }>,
): Extract<ManualWorkoutDraftReviewResult, { ok: false }> {
  return buildManualReviewRejected(result.message, mapSavedTemplateReviewReason(result.reason));
}

function buildManualReviewRejected(
  message: string,
  reason: Extract<ManualWorkoutDraftReviewResult, { ok: false }>["reason"] = "invalid_input",
): Extract<ManualWorkoutDraftReviewResult, { ok: false }> {
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
): Extract<ManualWorkoutDraftReviewResult, { ok: false }>["reason"] {
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

const WEEKDAY_HEADINGS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Icon } from "@/components/ui/icon";
import { hitoToast } from "@/components/ui/hito-toast";
import { DictateToPlanPanel, type VoiceStatus } from "@/components/onboarding/DictateToPlanPanel";
import { JsonImportPanel } from "@/components/onboarding/JsonImportPanel";
import { PlanPresetPanel, type PlanPresetUiStatus } from "@/components/onboarding/PlanPresetPanel";
import { StructuredPlanConstructor } from "@/components/onboarding/StructuredPlanConstructor";
import {
  buildStructuredInput,
  buildVoiceSupplementFromConstructorState,
  isStructuredConstructorReady,
  resolveTerrainFocus,
  type GoalDistance,
  type GoalStyle,
  type StrengthPreference,
  type StructuredConstructorState,
  type TerrainFocus,
  type WeekdayName,
  voiceResultMessage,
} from "@/components/onboarding/onboarding-form-model";
import { type ImportedPlan, validateImportedPlanJson } from "@/lib/imported-plan";
import type { PlanPresetCardId } from "@/lib/plan-presets/schema";
import type { FirstDayResolution } from "@/lib/plan-apply-policy";
import type { RunnerFitnessLevel } from "@/lib/runner-training-preferences";
import type { VoiceToPlanDraftResult } from "@/lib/voice-to-plan-authoring";
import {
  completeOnboarding,
  confirmPlanPresetDraft,
  confirmStructuredFirstPlanDraft,
  confirmVoiceToPlanDraft,
  getPlanPresetCards,
  generateStructuredFirstPlanDraft,
  generateVoiceToPlanDraft,
  reviewPlanPresetDraft,
  type PlanPresetCardsActionResult,
  type PlanPresetConfirmActionResult,
  type PlanPresetReviewDraftActionResult,
  type StructuredFirstPlanDraftResult,
  type UserSettingsSummary,
} from "@/lib/training-api";

type ConstructorStatus = "idle" | "reviewing" | "creating" | "finishing";
type JsonStatus = "idle" | "parsing" | "saving" | "finishing";
type SetupMode = "quick" | "talk";

const VOICE_TO_PLAN_TOAST_ID = "onboarding-voice-to-plan";
const STRUCTURED_REVIEW_TOAST_ID = "onboarding-structured-review";
const STRUCTURED_REVIEW_TIMEOUT_MS = 300_000;

export function OnboardingGate({ defaults = null }: { defaults?: UserSettingsSummary | null }) {
  const generateStructuredFirstPlanDraftFn = useServerFn(generateStructuredFirstPlanDraft);
  const confirmStructuredFirstPlanDraftFn = useServerFn(confirmStructuredFirstPlanDraft);
  const confirmPlanPresetDraftFn = useServerFn(confirmPlanPresetDraft);
  const completeOnboardingFn = useServerFn(completeOnboarding);
  const generateVoiceToPlanDraftFn = useServerFn(generateVoiceToPlanDraft);
  const confirmVoiceToPlanDraftFn = useServerFn(confirmVoiceToPlanDraft);
  const getPlanPresetCardsFn = useServerFn(getPlanPresetCards);
  const reviewPlanPresetDraftFn = useServerFn(reviewPlanPresetDraft);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const structuredFormRef = useRef<HTMLFormElement | null>(null);
  const voiceTranscriptRef = useRef<HTMLTextAreaElement | null>(null);
  const presetConfirmInFlightRef = useRef(false);

  const [age, setAge] = useState(() => (defaults?.age != null ? String(defaults.age) : ""));
  const [weightKg, setWeightKg] = useState(() =>
    defaults?.weightKg != null ? String(defaults.weightKg) : "",
  );
  const [heightCm, setHeightCm] = useState(() =>
    defaults?.heightCm != null ? String(defaults.heightCm) : "",
  );
  const [fitnessLevel, setFitnessLevel] = useState<RunnerFitnessLevel>("running_regularly");
  const [recent5kTime, setRecent5kTime] = useState("");
  const [recent5kPace, setRecent5kPace] = useState("");
  const [fixedRestDays, setFixedRestDays] = useState<WeekdayName[]>(
    () => defaults?.trainingPreferences?.blocked_days ?? [],
  );
  const [restDaysAnswered, setRestDaysAnswered] = useState(() =>
    Boolean(defaults?.trainingPreferences),
  );
  const [maxRunningDaysPerWeek, setMaxRunningDaysPerWeek] = useState(() =>
    defaults?.trainingPreferences?.max_running_days_per_week != null
      ? String(defaults.trainingPreferences.max_running_days_per_week)
      : "",
  );
  const [preferredLongRunDay, setPreferredLongRunDay] = useState<WeekdayName | "">(
    () => defaults?.trainingPreferences?.preferred_long_run_day ?? "",
  );
  const [goalDistance, setGoalDistance] = useState<GoalDistance>("build_consistency");
  const [goalStyle, setGoalStyle] = useState<GoalStyle>("balanced");
  const [targetTime, setTargetTime] = useState("");
  const [startDate, setStartDate] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [terrainFocus, setTerrainFocus] = useState<TerrainFocus>("standard");
  const [watchAccess, setWatchAccess] =
    useState<StructuredConstructorState["watchAccess"]>("unknown");
  const [guidancePreference, setGuidancePreference] =
    useState<StructuredConstructorState["guidancePreference"]>("effort");
  const [strengthPreference, setStrengthPreference] = useState<StrengthPreference>("none");
  const [comment, setComment] = useState("");
  const [constructorStatus, setConstructorStatus] = useState<ConstructorStatus>("idle");
  const [structuredDraftResult, setStructuredDraftResult] =
    useState<StructuredFirstPlanDraftResult | null>(null);
  const [constructorError, setConstructorError] = useState<string | null>(null);
  const [presetStatus, setPresetStatus] = useState<PlanPresetUiStatus>("idle");
  const [presetCardsResult, setPresetCardsResult] = useState<PlanPresetCardsActionResult | null>(
    null,
  );
  const [presetReviewResult, setPresetReviewResult] =
    useState<PlanPresetReviewDraftActionResult | null>(null);
  const [presetConfirmResult, setPresetConfirmResult] =
    useState<PlanPresetConfirmActionResult | null>(null);
  const [presetReviewedCardId, setPresetReviewedCardId] = useState<PlanPresetCardId | null>(null);
  const [presetError, setPresetError] = useState<string | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>("idle");
  const [voiceResult, setVoiceResult] = useState<VoiceToPlanDraftResult | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [setupMode, setSetupMode] = useState<SetupMode>("quick");

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [jsonDraft, setJsonDraft] = useState("");
  const [importedPlan, setImportedPlan] = useState<ImportedPlan | null>(null);
  const [jsonStatus, setJsonStatus] = useState<JsonStatus>("idle");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);

  const isVoiceBusy = voiceStatus === "reviewing" || voiceStatus === "creating";
  const isPresetBusy = presetStatus !== "idle";
  const isBusy =
    constructorStatus !== "idle" || jsonStatus !== "idle" || isVoiceBusy || isPresetBusy;
  const constructorState: StructuredConstructorState = {
    age,
    weightKg,
    heightCm,
    fitnessLevel,
    recent5kTime,
    recent5kPace,
    fixedRestDays,
    restDaysAnswered,
    maxRunningDaysPerWeek,
    preferredLongRunDay,
    goalDistance,
    goalStyle,
    targetTime,
    startDate,
    targetDate,
    terrainFocus,
    watchAccess,
    guidancePreference,
    strengthPreference,
    comment,
  };
  const effectiveConstructorState: StructuredConstructorState = {
    ...constructorState,
    terrainFocus: resolveTerrainFocus(goalDistance, terrainFocus),
  };
  const isConstructorReady = isStructuredConstructorReady(constructorState);

  const validateJsonDraft = validateJsonDraftFactory({
    setJsonError,
    setFieldErrors,
    setImportedPlan,
    setJsonStatus,
  });
  const openSavedHome = () => {
    window.location.assign("/");
  };

  useEffect(() => {
    setPresetCardsResult(null);
    setPresetReviewResult(null);
    setPresetConfirmResult(null);
    setPresetReviewedCardId(null);
    setPresetError(null);
    presetConfirmInFlightRef.current = false;
  }, [
    age,
    weightKg,
    heightCm,
    fitnessLevel,
    recent5kTime,
    fixedRestDays,
    restDaysAnswered,
    maxRunningDaysPerWeek,
    preferredLongRunDay,
    goalDistance,
    goalStyle,
    targetTime,
    startDate,
    targetDate,
    terrainFocus,
    watchAccess,
    guidancePreference,
    strengthPreference,
    comment,
  ]);

  const clearStructuredReview = () => {
    setStructuredDraftResult(null);
    setConstructorError(null);
    hitoToast.dismiss(STRUCTURED_REVIEW_TOAST_ID);
  };

  const addMoreVoiceDetails = () => {
    setVoiceError(null);
    setVoiceStatus("idle");
    window.requestAnimationFrame(() => voiceTranscriptRef.current?.focus());
  };

  const startVoiceOver = () => {
    setVoiceTranscript("");
    setVoiceResult(null);
    setVoiceError(null);
    setVoiceStatus("idle");
    hitoToast.dismiss(VOICE_TO_PLAN_TOAST_ID);
    window.requestAnimationFrame(() => voiceTranscriptRef.current?.focus());
  };

  const useStructuredSetup = () => {
    setSetupMode("quick");
    window.requestAnimationFrame(() =>
      structuredFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  const submitVoiceReview = async () => {
    const transcript = voiceTranscript.trim();

    if (!transcript) {
      setVoiceError("Paste or type what you would say out loud before asking Hito to review it.");
      return;
    }

    setVoiceStatus("reviewing");
    setVoiceError(null);
    hitoToast.working({
      id: VOICE_TO_PLAN_TOAST_ID,
      title: "Reviewing draft",
      description: "Hito is checking the transcript before anything is created.",
    });

    try {
      const result = await generateVoiceToPlanDraftFn({
        data: {
          transcript,
          context: {
            fixedRestDays,
            runningDaysPerWeek: null,
          },
          supplement: buildVoiceSupplementFromConstructorState(effectiveConstructorState),
        },
      });

      setVoiceResult(result);
      setVoiceStatus("idle");

      if (!result.ok) {
        const message = voiceResultMessage(result);
        setVoiceError(message);
        hitoToast.error({
          id: VOICE_TO_PLAN_TOAST_ID,
          title: result.reason === "capability_locked" ? "AI setup is locked" : "Review failed",
          description: message,
        });
        return;
      }

      if (result.status === "draft_ready") {
        hitoToast.success({
          id: VOICE_TO_PLAN_TOAST_ID,
          title: "Draft ready",
          description: "Review what Hito understood before creating anything.",
        });
        return;
      }

      hitoToast.info({
        id: VOICE_TO_PLAN_TOAST_ID,
        title: "More details needed",
        description: "No plan was created. Add the missing context, then review again.",
      });
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Could not review the dictated plan yet.";
      setVoiceStatus("idle");
      setVoiceError(message);
      hitoToast.error({
        id: VOICE_TO_PLAN_TOAST_ID,
        title: "Review failed",
        description: message,
      });
    }
  };

  const confirmVoicePlan = async () => {
    if (!voiceResult?.ok || voiceResult.status !== "draft_ready") {
      setVoiceError("Generate a ready review before creating the plan.");
      return;
    }

    setVoiceStatus("creating");
    setVoiceError(null);
    hitoToast.working({
      id: VOICE_TO_PLAN_TOAST_ID,
      title: "Creating plan",
      description: "Hito is creating the active plan from the reviewed draft.",
    });

    try {
      const result = await confirmVoiceToPlanDraftFn({
        data: {
          draft: voiceResult.draft,
          supplement: voiceResult.supplement,
        },
      });

      if (!result.ok) {
        const message = voiceResultMessage(result);
        setVoiceStatus("idle");
        setVoiceError(message);
        hitoToast.error({
          id: VOICE_TO_PLAN_TOAST_ID,
          title: "Plan not created",
          description: message,
        });
        return;
      }

      setVoiceStatus("created");
      hitoToast.success({
        id: VOICE_TO_PLAN_TOAST_ID,
        title: "Plan created",
        description: "Opening your saved plan now.",
        duration: 2600,
      });
      openSavedHome();
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Could not create the dictated plan.";
      setVoiceStatus("idle");
      setVoiceError(message);
      hitoToast.error({
        id: VOICE_TO_PLAN_TOAST_ID,
        title: "Plan not created",
        description: message,
      });
    }
  };

  const submitStructuredReview = async () => {
    setConstructorError(null);
    setStructuredDraftResult(null);

    try {
      const inputResult = buildStructuredInput(effectiveConstructorState);

      if (!inputResult.ok) {
        setConstructorError(inputResult.error);
        return;
      }

      setConstructorStatus("reviewing");
      hitoToast.working({
        id: STRUCTURED_REVIEW_TOAST_ID,
        title: "Reviewing plan",
        description: "Hito is preparing your full plan review before anything is created.",
      });

      const result = await withStructuredReviewTimeout(() =>
        generateStructuredFirstPlanDraftFn({
          data: inputResult.input,
        }),
      );

      setStructuredDraftResult(result);
      setConstructorStatus("idle");

      if (!result.ok || result.status === "correction_required") {
        const message = structuredDraftResultMessage(result);
        setConstructorError(message);
        window.requestAnimationFrame(() =>
          structuredFormRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }),
        );
        hitoToast.error({
          id: STRUCTURED_REVIEW_TOAST_ID,
          title: result.ok ? "Setup needs correction" : "Review failed",
          description: message,
        });
        return;
      }

      hitoToast.success({
        id: STRUCTURED_REVIEW_TOAST_ID,
        title: "Plan ready",
        description: "Review your full plan before confirming.",
      });
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Could not review the setup.";
      setConstructorStatus("idle");
      setConstructorError(message);
      hitoToast.error({
        id: STRUCTURED_REVIEW_TOAST_ID,
        title: "Review failed",
        description: message,
      });
    }
  };

  const loadPlanPresetCards = async () => {
    setPresetError(null);
    setPresetReviewResult(null);
    setPresetConfirmResult(null);
    setPresetReviewedCardId(null);

    try {
      const inputResult = buildStructuredInput(effectiveConstructorState);

      if (!inputResult.ok) {
        setPresetError(inputResult.error);
        return;
      }

      setPresetStatus("loading_cards");
      const result = await getPlanPresetCardsFn({
        data: inputResult.input,
      });

      setPresetCardsResult(result);
      setPresetStatus("idle");

      if (!result.ok) {
        setPresetError(result.message);
      }
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Could not load plan presets.";
      setPresetStatus("idle");
      setPresetError(message);
    }
  };

  const reviewPlanPreset = async (cardId: PlanPresetCardId) => {
    setPresetError(null);
    setPresetReviewResult(null);
    setPresetConfirmResult(null);
    setPresetReviewedCardId(null);

    try {
      const inputResult = buildStructuredInput(effectiveConstructorState);

      if (!inputResult.ok) {
        setPresetError(inputResult.error);
        return;
      }

      setPresetStatus("reviewing_draft");
      const result = await reviewPlanPresetDraftFn({
        data: {
          cardId,
          input: inputResult.input,
        },
      });

      setPresetReviewResult(result);
      setPresetReviewedCardId(result.ok ? cardId : null);
      setPresetStatus("idle");

      if (!result.ok) {
        setPresetError(result.message);
      }
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Could not review this preset.";
      setPresetStatus("idle");
      setPresetError(message);
    }
  };

  const confirmPlanPreset = async () => {
    if (presetConfirmInFlightRef.current) {
      return;
    }

    if (!presetReviewResult?.ok || !presetReviewedCardId) {
      setPresetError("Review a preset before creating a plan.");
      return;
    }

    presetConfirmInFlightRef.current = true;
    setPresetStatus("creating_plan");
    setPresetConfirmResult(null);
    setPresetError(null);
    hitoToast.working({
      id: STRUCTURED_REVIEW_TOAST_ID,
      title: "Creating preset plan",
      description: "Hito is creating the active plan from the reviewed preset.",
    });

    try {
      const inputResult = buildStructuredInput(effectiveConstructorState);

      if (!inputResult.ok) {
        presetConfirmInFlightRef.current = false;
        setPresetStatus("idle");
        setPresetError(inputResult.error);
        hitoToast.error({
          id: STRUCTURED_REVIEW_TOAST_ID,
          title: "Plan not created",
          description: inputResult.error,
        });
        return;
      }

      const result = await confirmPlanPresetDraftFn({
        data: {
          cardId: presetReviewedCardId,
          input: inputResult.input,
          reviewToken: presetReviewResult.reviewToken,
          reviewChecksum: presetReviewResult.reviewChecksum,
        },
      });

      setPresetConfirmResult(result);

      if (!result.ok) {
        presetConfirmInFlightRef.current = false;
        setPresetStatus("idle");
        setPresetError(result.message);
        hitoToast.error({
          id: STRUCTURED_REVIEW_TOAST_ID,
          title: "Plan not created",
          description: result.message,
        });
        return;
      }

      hitoToast.success({
        id: STRUCTURED_REVIEW_TOAST_ID,
        title: "Plan created",
        description: "Opening your saved plan now.",
        duration: 2600,
      });
      openSavedHome();
    } catch (submitError) {
      presetConfirmInFlightRef.current = false;
      setPresetStatus("idle");
      const message =
        submitError instanceof Error ? submitError.message : "Could not create this preset plan.";
      setPresetError(message);
      hitoToast.error({
        id: STRUCTURED_REVIEW_TOAST_ID,
        title: "Plan not created",
        description: message,
      });
    }
  };

  const confirmStructuredPlan = async () => {
    if (!structuredDraftResult?.ok || structuredDraftResult.status !== "draft_ready") {
      setConstructorError("Generate a ready review before creating the plan.");
      return;
    }

    setConstructorStatus("creating");
    setConstructorError(null);
    hitoToast.working({
      id: STRUCTURED_REVIEW_TOAST_ID,
      title: "Creating plan",
      description: "Hito is creating the active plan from the reviewed plan.",
    });

    try {
      const result = await confirmStructuredFirstPlanDraftFn({
        data: {
          draft: structuredDraftResult.draft,
        },
      });

      if (!result.ok) {
        setConstructorStatus("idle");
        setConstructorError(resultFailureMessage(result));
        hitoToast.error({
          id: STRUCTURED_REVIEW_TOAST_ID,
          title: "Plan not created",
          description: resultFailureMessage(result),
        });
        return;
      }

      setConstructorStatus("finishing");
      hitoToast.success({
        id: STRUCTURED_REVIEW_TOAST_ID,
        title: "Plan created",
        description: "Opening your saved plan now.",
        duration: 2600,
      });
      openSavedHome();
    } catch (submitError) {
      setConstructorStatus("idle");
      const message =
        submitError instanceof Error ? submitError.message : "Could not create the plan.";
      setConstructorError(message);
      hitoToast.error({
        id: STRUCTURED_REVIEW_TOAST_ID,
        title: "Plan not created",
        description: message,
      });
    }
  };

  const submitImportedPlan = async (firstDayResolution: FirstDayResolution | null) => {
    if (!importedPlan) {
      setJsonError("Upload a valid JSON file before importing the plan.");
      return;
    }

    setJsonStatus("saving");
    setJsonError(null);

    try {
      const result = await completeOnboardingFn({
        data: {
          importedPlan,
          firstDayResolution,
        },
      });

      if (!result.ok) {
        setJsonStatus("idle");
        setJsonError("Could not apply that plan yet. Refresh and try again.");
        return;
      }

      setJsonStatus("finishing");
      openSavedHome();
    } catch (submitError) {
      setJsonStatus("idle");
      setJsonError(
        submitError instanceof Error ? submitError.message : "Could not import the JSON plan.",
      );
    }
  };

  return (
    <section
      className="hito-surface hito-onboarding-surface mx-auto max-w-5xl px-6 pt-6 lg:px-10 lg:pt-10"
      data-mode={setupMode}
    >
      <div className="max-w-3xl">
        <p className="hito-micro-label" data-tone="signal">
          Create a plan
        </p>
        <h1 className="hito-page-title mt-3">Let&apos;s build your plan.</h1>
        <p className="hito-body mt-4 text-muted-foreground">
          We&apos;ll ask a few simple questions and turn them into your first plan.
        </p>
      </div>

      <div className="mt-7">
        <div className="hito-tabs hito-tabs-simple" role="tablist" aria-label="Setup mode">
          <button
            type="button"
            role="tab"
            aria-selected={setupMode === "quick"}
            className="hito-tab"
            data-active={setupMode === "quick"}
            disabled={isBusy}
            onClick={() => setSetupMode("quick")}
          >
            Quick setup
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={setupMode === "talk"}
            className="hito-tab"
            data-active={setupMode === "talk"}
            disabled={isBusy}
            onClick={() => setSetupMode("talk")}
          >
            <span>Talk it through</span>
            <span className="hito-tab-badge" data-variant="text">
              Pro
            </span>
          </button>
        </div>
      </div>

      {setupMode === "talk" ? (
        <DictateToPlanPanel
          voiceTranscriptRef={voiceTranscriptRef}
          transcript={voiceTranscript}
          setTranscript={(value) => {
            setVoiceTranscript(value);
            setVoiceError(null);
          }}
          result={voiceResult}
          error={voiceError}
          status={voiceStatus}
          isBusy={isBusy}
          submitReview={() => {
            void submitVoiceReview();
          }}
          confirmDraft={() => {
            void confirmVoicePlan();
          }}
          addMoreDetails={addMoreVoiceDetails}
          startOver={startVoiceOver}
          useStructuredSetup={useStructuredSetup}
        />
      ) : (
        <StructuredPlanConstructor
          formRef={structuredFormRef}
          state={constructorState}
          setState={{
            setAge,
            setWeightKg,
            setHeightCm,
            setFitnessLevel,
            setRecent5kTime,
            setRecent5kPace,
            setFixedRestDays,
            setRestDaysAnswered,
            setMaxRunningDaysPerWeek,
            setPreferredLongRunDay,
            setGoalDistance,
            setGoalStyle,
            setTargetTime,
            setStartDate,
            setTargetDate,
            setTerrainFocus,
            setWatchAccess,
            setGuidancePreference,
            setStrengthPreference,
            setComment,
          }}
          constructorStatus={constructorStatus}
          draftResult={structuredDraftResult}
          constructorError={constructorError}
          isBusy={isBusy}
          isConstructorReady={isConstructorReady}
          onSubmit={() => {
            void submitStructuredReview();
          }}
          onConfirmDraft={() => {
            void confirmStructuredPlan();
          }}
          onBackToEdit={() => {
            clearStructuredReview();
          }}
          planPresetPanel={
            <PlanPresetPanel
              cardsResult={presetCardsResult}
              reviewResult={presetReviewResult}
              confirmResult={presetConfirmResult}
              error={presetError}
              status={presetStatus}
              isBusy={isBusy}
              isConstructorReady={isConstructorReady}
              reviewedCardId={presetReviewedCardId}
              onLoadCards={() => {
                void loadPlanPresetCards();
              }}
              onReviewCard={(cardId) => {
                void reviewPlanPreset(cardId);
              }}
              onConfirmReview={() => {
                void confirmPlanPreset();
              }}
              onUseAdvancedCustom={() => {
                void submitStructuredReview();
              }}
            />
          }
        />
      )}

      <details
        className="hito-disclosure hito-section-divider mt-8 pt-6"
        open={showAdvanced}
        onToggle={(event) => setShowAdvanced(event.currentTarget.open)}
      >
        <summary className="hito-disclosure-summary">
          <span>
            <span className="hito-body-small block text-foreground/90">Import existing plan</span>
            <span className="mt-1 block hito-helper">
              Quiet fallback for existing Hito plan JSON.
            </span>
          </span>
          <Icon name="chevron-down" className="hito-disclosure-chevron" />
        </summary>

        <div className="hito-disclosure-body">
          <JsonImportPanel
            fileInputRef={fileInputRef}
            selectedFileName={selectedFileName}
            setSelectedFileName={setSelectedFileName}
            jsonDraft={jsonDraft}
            setJsonDraft={setJsonDraft}
            fieldErrors={fieldErrors}
            jsonError={jsonError}
            jsonStatus={jsonStatus}
            importedPlan={importedPlan}
            isBusy={isBusy}
            validateJsonDraft={validateJsonDraft}
            submitImportedPlan={submitImportedPlan}
            setImportedPlan={setImportedPlan}
            setFieldErrors={setFieldErrors}
            setJsonError={setJsonError}
            setJsonStatus={setJsonStatus}
          />
        </div>
      </details>
    </section>
  );
}

function withStructuredReviewTimeout<T>(run: () => Promise<T>) {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(
        new Error(
          "The review is taking longer than expected. No plan was created. Try Review plan again.",
        ),
      );
    }, STRUCTURED_REVIEW_TIMEOUT_MS);

    Promise.resolve()
      .then(run)
      .then(
        (value) => {
          window.clearTimeout(timeoutId);
          resolve(value);
        },
        (error: unknown) => {
          window.clearTimeout(timeoutId);
          reject(error);
        },
      );
  });
}

function resultFailureMessage(result: { status?: string; message?: string }) {
  if (result.message) {
    return result.message;
  }

  if (result.status === "blocked_by_history") {
    return "This plan would conflict with saved history. Adjust the setup and try again.";
  }

  return "Could not apply that plan yet. Check the setup answers and try again.";
}

function structuredDraftResultMessage(result: StructuredFirstPlanDraftResult) {
  if (!result.ok) {
    return result.message;
  }

  if (result.status === "correction_required") {
    return result.correction.message;
  }

  return "Review the plan before creating it.";
}

function formatIssue(path: (string | number)[], message: string) {
  if (!path.length) {
    return message;
  }

  return `${path.join(".")}: ${message}`;
}

function validateJsonDraftFactory({
  setJsonError,
  setFieldErrors,
  setImportedPlan,
  setJsonStatus,
}: {
  setJsonError: (value: string | null) => void;
  setFieldErrors: (value: string[]) => void;
  setImportedPlan: (value: ImportedPlan | null) => void;
  setJsonStatus: (value: JsonStatus) => void;
}) {
  return function validateJsonDraft(raw: string) {
    setJsonStatus("parsing");
    setJsonError(null);
    setFieldErrors([]);
    setImportedPlan(null);

    const validation = validateImportedPlanJson(raw);

    if (!validation) {
      setJsonStatus("idle");
      setJsonError("The JSON content could not be parsed.");
      return;
    }

    if (!validation.success) {
      setFieldErrors(
        validation.error.issues.map((issue) => formatIssue(issue.path, issue.message)),
      );
      setJsonStatus("idle");
      return;
    }

    setImportedPlan(validation.data);
    setJsonStatus("idle");
  };
}

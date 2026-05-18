import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Icon } from "@/components/ui/icon";
import { hitoToast } from "@/components/ui/hito-toast";
import { DictateToPlanPanel, type VoiceStatus } from "@/components/onboarding/DictateToPlanPanel";
import { JsonImportPanel } from "@/components/onboarding/JsonImportPanel";
import { StructuredPlanConstructor } from "@/components/onboarding/StructuredPlanConstructor";
import {
  buildStructuredInput,
  buildVoiceSupplementFromConstructorState,
  isStructuredConstructorReady,
  resolveTerrainFocus,
  type BenchmarkKind,
  type GoalDistance,
  type GoalStyle,
  type StrengthPreference,
  type StructuredConstructorState,
  type TerrainFocus,
  type WeekdayName,
  voiceResultMessage,
} from "@/components/onboarding/onboarding-form-model";
import { type ImportedPlan, validateImportedPlanJson } from "@/lib/imported-plan";
import type { FirstDayResolution } from "@/lib/plan-apply-policy";
import type { VoiceToPlanDraftResult } from "@/lib/voice-to-plan-authoring";
import {
  completeOnboarding,
  completeStructuredFirstPlanOnboarding,
  confirmVoiceToPlanDraft,
  generateVoiceToPlanDraft,
} from "@/lib/training-api";

type ConstructorStatus = "idle" | "saving" | "finishing";
type JsonStatus = "idle" | "parsing" | "saving" | "finishing";

const VOICE_TO_PLAN_TOAST_ID = "onboarding-voice-to-plan";

export function OnboardingGate() {
  const completeStructuredFirstPlanOnboardingFn = useServerFn(
    completeStructuredFirstPlanOnboarding,
  );
  const completeOnboardingFn = useServerFn(completeOnboarding);
  const generateVoiceToPlanDraftFn = useServerFn(generateVoiceToPlanDraft);
  const confirmVoiceToPlanDraftFn = useServerFn(confirmVoiceToPlanDraft);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const structuredFormRef = useRef<HTMLFormElement | null>(null);
  const voiceTranscriptRef = useRef<HTMLTextAreaElement | null>(null);

  const [age, setAge] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [benchmarkKind, setBenchmarkKind] = useState<BenchmarkKind>("unknown");
  const [recent5kTime, setRecent5kTime] = useState("");
  const [recent5kPace, setRecent5kPace] = useState("");
  const [fixedRestDays, setFixedRestDays] = useState<WeekdayName[]>([]);
  const [goalDistance, setGoalDistance] = useState<GoalDistance>("build_consistency");
  const [goalStyle, setGoalStyle] = useState<GoalStyle>("balanced");
  const [targetTime, setTargetTime] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [terrainFocus, setTerrainFocus] = useState<TerrainFocus>("standard");
  const [strengthPreference, setStrengthPreference] = useState<StrengthPreference>("none");
  const [comment, setComment] = useState("");
  const [constructorStatus, setConstructorStatus] = useState<ConstructorStatus>("idle");
  const [constructorError, setConstructorError] = useState<string | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>("idle");
  const [voiceResult, setVoiceResult] = useState<VoiceToPlanDraftResult | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [jsonDraft, setJsonDraft] = useState("");
  const [importedPlan, setImportedPlan] = useState<ImportedPlan | null>(null);
  const [jsonStatus, setJsonStatus] = useState<JsonStatus>("idle");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);

  const isVoiceBusy = voiceStatus === "reviewing" || voiceStatus === "creating";
  const isBusy = constructorStatus !== "idle" || jsonStatus !== "idle" || isVoiceBusy;
  const constructorState: StructuredConstructorState = {
    age,
    weightKg,
    heightCm,
    benchmarkKind,
    recent5kTime,
    recent5kPace,
    fixedRestDays,
    goalDistance,
    goalStyle,
    targetTime,
    targetDate,
    terrainFocus,
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
    structuredFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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
      title: "Reviewing AI setup",
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
          title: "Setup draft ready",
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
      title: "Creating AI setup plan",
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

  const submitStructuredPlan = async () => {
    const inputResult = buildStructuredInput(effectiveConstructorState);

    setConstructorError(null);

    if (!inputResult.ok) {
      setConstructorError(inputResult.error);
      return;
    }

    setConstructorStatus("saving");

    try {
      const result = await completeStructuredFirstPlanOnboardingFn({
        data: inputResult.input,
      });

      if (!result.ok) {
        setConstructorStatus("idle");
        setConstructorError(resultFailureMessage(result));
        return;
      }

      setConstructorStatus("finishing");
      openSavedHome();
    } catch (submitError) {
      setConstructorStatus("idle");
      setConstructorError(
        submitError instanceof Error ? submitError.message : "Could not create the plan.",
      );
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
    <section className="hito-surface hito-onboarding-surface mx-auto max-w-5xl p-6 lg:p-10">
      <div className="max-w-3xl">
        <p className="hito-micro-label" data-tone="signal">
          Create a plan
        </p>
        <h1 className="hito-page-title mt-3">Build your first running plan.</h1>
        <p className="hito-body mt-4 text-muted-foreground">
          Answer a few bounded setup questions. Hito uses them to create the first saved plan while
          keeping profile truth, fixed rest days, and plan context separate.
        </p>
      </div>

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

      <StructuredPlanConstructor
        formRef={structuredFormRef}
        state={constructorState}
        setState={{
          setAge,
          setWeightKg,
          setHeightCm,
          setBenchmarkKind,
          setRecent5kTime,
          setRecent5kPace,
          setFixedRestDays,
          setGoalDistance,
          setGoalStyle,
          setTargetTime,
          setTargetDate,
          setTerrainFocus,
          setStrengthPreference,
          setComment,
        }}
        constructorStatus={constructorStatus}
        constructorError={constructorError}
        isBusy={isBusy}
        isConstructorReady={isConstructorReady}
        onSubmit={() => {
          void submitStructuredPlan();
        }}
      />

      <details
        className="hito-disclosure hito-section-divider mt-8 pt-6"
        open={showAdvanced}
        onToggle={(event) => setShowAdvanced(event.currentTarget.open)}
      >
        <summary className="hito-disclosure-summary">
          <span>
            <span className="hito-micro-label block">Advanced</span>
            <span className="mt-1 block hito-body-small text-foreground/90">
              Import an existing Hito plan file
            </span>
            <span className="mt-1 block hito-helper">
              JSON import remains available for existing plan artifacts, migration, and testing.
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

function resultFailureMessage(result: { status?: string; message?: string }) {
  if (result.message) {
    return result.message;
  }

  if (result.status === "blocked_by_history") {
    return "This plan would conflict with saved history. Adjust the setup and try again.";
  }

  return "Could not apply that plan yet. Check the setup answers and try again.";
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

function openSavedHome() {
  window.location.assign("/");
}

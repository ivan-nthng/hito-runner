import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { WorkoutDocumentEditor } from "@/components/manual-workout/WorkoutDocumentEditor";
import { HitoButton } from "@/components/ui/button";
import { HitoChoiceToggle } from "@/components/ui/hito-choice-toggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useHitoProductMessage, useHitoUiLocale } from "@/components/ui/hito-ui-locale-provider";
import {
  prepareAdaptiveContinuationCandidateAction,
  submitAdaptiveContinuationInputAction,
} from "@/lib/adaptive-blueprint-actions";
import type {
  AdaptiveContinuationHorizonCheckIn,
  AdaptiveContinuationPublicState,
  AdaptiveProjectionSchedulingPreference,
  BlueprintCalendarProjection,
} from "@/lib/adaptive-blueprint-product-contract";
import {
  confirmWorkoutCommandAction,
  reviewWorkoutCommandAction,
} from "@/lib/manual-workout-authoring";
import { formatUiDate, formatUiNumber, type ResolvedUiLocale } from "@/lib/ui-locale";
import { formatHitoProductMessage, getHitoKnownProductMessage } from "@/lib/ui-locale-messages";
import type { ReviewedWorkoutCommandCandidate } from "@/lib/workout-authoring-review";

type CheckInDraft = Omit<
  AdaptiveContinuationHorizonCheckIn,
  "confirmationId" | "goalAssumptionCurrent" | "availabilityConfirmed"
> & {
  goalAssumptionCurrent: boolean | null;
  availabilityConfirmed: boolean | null;
};
type ActionStatus = "idle" | "submitting" | "preparing" | "reviewing" | "confirming";
type ActiveContinuationState = Exclude<AdaptiveContinuationPublicState, { status: "no_source" }>;
type ContinuationContext = NonNullable<ActiveContinuationState["context"]>;
type ContinuationCandidate = Extract<
  AdaptiveContinuationPublicState,
  { status: "candidate_ready" }
>["candidate"];

const manageabilityOptions = [
  ["too_much", "Too much"],
  ["manageable", "Manageable"],
  ["too_little", "Too little"],
] as const;
const healthOptions = [
  ["no", "No"],
  ["yes", "Yes"],
  ["unsure", "Unsure"],
] as const;
const interruptionOptions = [
  ["none", "None"],
  ["resolved", "Resolved"],
  ["unresolved", "Unresolved"],
] as const;
const clinicianOptions = [
  ["not_applicable", "Not applicable"],
  ["permits_running", "Permits running"],
  ["restricts_running", "Restricts running"],
  ["unclear", "Unclear"],
] as const;

export function AdaptiveContinuationPanel({
  continuation,
  onRefresh,
  projections,
}: {
  continuation: AdaptiveContinuationPublicState;
  onRefresh: () => Promise<unknown>;
  projections: BlueprintCalendarProjection[];
}) {
  const locale = useHitoUiLocale();
  const t = useHitoProductMessage();
  const submitInput = useServerFn(submitAdaptiveContinuationInputAction);
  const prepareCandidate = useServerFn(prepareAdaptiveContinuationCandidateAction);
  const reviewCommand = useServerFn(reviewWorkoutCommandAction);
  const confirmCommand = useServerFn(confirmWorkoutCommandAction);
  const panelRef = useRef<HTMLElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const revision = continuation.context?.currentInputRevision;
  const stateKey = `${continuation.context?.confirmation.id ?? "none"}:${revision?.sha256 ?? "none"}:${continuation.status === "candidate_ready" ? continuation.candidate.id : "none"}`;
  const [checkIn, setCheckIn] = useState(() => checkInDraft(revision?.checkIn ?? null));
  const [preferences, setPreferences] = useState<AdaptiveProjectionSchedulingPreference[]>(
    () => revision?.activePreferences ?? [],
  );
  const [avoidId, setAvoidId] = useState("");
  const [swapFirstId, setSwapFirstId] = useState("");
  const [swapSecondId, setSwapSecondId] = useState("");
  const [actionStatus, setActionStatus] = useState<ActionStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [reviewed, setReviewed] = useState<ReviewedWorkoutCommandCandidate | null>(null);

  useEffect(() => {
    setCheckIn(checkInDraft(revision?.checkIn ?? null));
    setPreferences(revision?.activePreferences ?? []);
    setAvoidId("");
    setSwapFirstId("");
    setSwapSecondId("");
    setReviewed(null);
    setMessage(null);
  }, [revision, stateKey]);

  if (continuation.status === "no_source" || !continuation.context) return null;
  const context = continuation.context;
  const candidate = continuation.status === "candidate_ready" ? continuation.candidate : null;
  const busy = actionStatus !== "idle";
  const checkInComplete =
    checkIn.goalAssumptionCurrent !== null && checkIn.availabilityConfirmed !== null;
  const focusPanel = () => requestAnimationFrame(() => panelRef.current?.focus());

  async function saveInput() {
    if (!checkInComplete) {
      setMessage(t("Confirm the current goal and availability before saving this check-in."));
      return;
    }
    setActionStatus("submitting");
    setMessage(null);
    try {
      const result = await submitInput({
        data: {
          expectedBlueprint: context.blueprint,
          expectedConfirmationId: context.confirmation.id,
          activeProjectionPreferences: preferences,
          horizonCheckIn: {
            confirmationId: context.confirmation.id,
            goalAssumptionCurrent: checkIn.goalAssumptionCurrent,
            availabilityConfirmed: checkIn.availabilityConfirmed,
            manageability: checkIn.manageability,
            materialChangeReason: checkIn.materialChangeReason?.trim() || null,
            healthLimitation: checkIn.healthLimitation,
            interruptionStatus: checkIn.interruptionStatus,
            clinicianGuidance: checkIn.clinicianGuidance,
          },
        },
      });
      if (!result.ok) {
        setMessage(
          result.reason === "source_stale"
            ? t("This Blueprint changed. Reload before saving the check-in.")
            : t("The Blueprint source is no longer available."),
        );
        return;
      }
      await onRefresh();
      setMessage(t("Check-in and preferences saved."));
      focusPanel();
    } catch (error) {
      setMessage(errorMessage(error, t("The check-in could not be saved.")));
    } finally {
      setActionStatus("idle");
    }
  }

  async function prepare() {
    setActionStatus("preparing");
    setMessage(null);
    try {
      const result = await prepareCandidate({ data: {} });
      if (!result.ok) {
        setMessage(
          result.reason === "not_ready"
            ? t("The next block is not ready. Review the current missing facts and check-in.")
            : t(
                "The server rejected the authored candidate. Try again after reviewing the current state.",
              ),
        );
        return;
      }
      await onRefresh();
      setMessage(t("The next block is ready for review."));
      focusPanel();
    } catch (error) {
      setMessage(errorMessage(error, t("The next block could not be prepared.")));
    } finally {
      setActionStatus("idle");
    }
  }

  async function review() {
    if (!candidate) return;
    setActionStatus("reviewing");
    setMessage(null);
    try {
      const result = await reviewCommand({
        data: {
          operation: "materialize_source_candidate",
          source: { kind: "adaptive_continuation_candidate", candidateId: candidate.id },
        },
      });
      if (!result.ok) {
        setMessage(result.issues.map((issue) => issue.message).join(" "));
        return;
      }
      setReviewed(result.candidate);
      setMessage(t("Review sealed against current Calendar and Blueprint truth."));
      requestAnimationFrame(() => confirmRef.current?.focus());
    } catch (error) {
      setMessage(errorMessage(error, t("The next block could not be reviewed.")));
    } finally {
      setActionStatus("idle");
    }
  }

  async function confirm() {
    if (!reviewed) return;
    setActionStatus("confirming");
    setMessage(null);
    try {
      const result = await confirmCommand({
        data: {
          command: reviewed.command,
          candidateId: reviewed.candidateId,
          reviewToken: reviewed.reviewToken,
          reviewChecksum: reviewed.reviewChecksum,
        },
      });
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setReviewed(null);
      await onRefresh();
      setMessage(t("Next block confirmed in the runner Calendar."));
      focusPanel();
    } catch (error) {
      setMessage(errorMessage(error, t("The next block could not be confirmed.")));
    } finally {
      setActionStatus("idle");
    }
  }

  function addAvoidPreference() {
    const projection = projections.find((item) => item.projectionId === avoidId);
    if (!projection) return setMessage(t("Choose a Blueprint date to avoid."));
    if (
      preferences.some(
        (item) => item.kind === "avoid_projection_date" && item.projectionId === avoidId,
      )
    )
      return setMessage(t("That date is already included."));
    setPreferences((current) => [
      ...current,
      { kind: "avoid_projection_date", projectionId: avoidId, date: projection.date },
    ]);
    setAvoidId("");
    setMessage(null);
  }

  function addSwapPreference() {
    if (!swapFirstId || !swapSecondId || swapFirstId === swapSecondId)
      return setMessage(t("Choose two different Blueprint dates to swap."));
    setPreferences((current) => [
      ...current,
      {
        kind: "swap_projection_slots",
        firstProjectionId: swapFirstId,
        secondProjectionId: swapSecondId,
      },
    ]);
    setSwapFirstId("");
    setSwapSecondId("");
    setMessage(null);
  }

  return (
    <section
      ref={panelRef}
      tabIndex={-1}
      className="hito-state-surface mb-6 min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      data-tone={statusTone(continuation.status)}
      data-adaptive-continuation-status={continuation.status}
      aria-labelledby="adaptive-continuation-title"
    >
      <header className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="hito-label-md text-foreground">{t("Next training block")}</p>
          <h2 id="adaptive-continuation-title" className="hito-ui-title-md mt-1 text-foreground">
            {statusLabel(continuation.status, locale)}
          </h2>
          <p className="hito-body-sm mt-2 max-w-2xl text-text-secondary">
            {statusCopy(continuation.status, locale)}
          </p>
        </div>
        <span className="hito-status-pill" data-tone={statusTone(continuation.status)}>
          {statusLabel(continuation.status, locale)}
        </span>
      </header>

      {continuation.window ? (
        <p className="hito-body-sm mt-4 text-text-secondary">
          {formatUiDate(continuation.window.startDate, locale, {
            month: "short",
            day: "numeric",
          })}{" "}
          –{" "}
          {formatUiDate(continuation.window.endDate, locale, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
          {" · "}
          {blockModeLabel(continuation.window.blockMode, locale)}
        </p>
      ) : null}

      <ReasonList reasons={continuation.reasons} />
      {context.dataQuality ? <DataQuality data={context.dataQuality} /> : null}

      {context.capabilities.canSubmitInput ? (
        <CheckInForm
          busy={busy}
          checkIn={checkIn}
          onCheckInChange={setCheckIn}
          onSave={() => void saveInput()}
          preferences={preferences}
          projections={projections}
          avoidId={avoidId}
          swapFirstId={swapFirstId}
          swapSecondId={swapSecondId}
          onAvoidIdChange={setAvoidId}
          onSwapFirstIdChange={setSwapFirstId}
          onSwapSecondIdChange={setSwapSecondId}
          onAddAvoid={addAvoidPreference}
          onAddSwap={addSwapPreference}
          onRemovePreference={(index) =>
            setPreferences((current) => current.filter((_, itemIndex) => itemIndex !== index))
          }
          saving={actionStatus === "submitting"}
          saveDisabled={!checkInComplete}
        />
      ) : null}

      <PreferenceOutcomes applications={context.preferenceApplications} projections={projections} />

      {continuation.status === "authoring_ready" && context.capabilities.canPrepareCandidate ? (
        <HitoButton
          className="mt-6"
          type="button"
          size="md"
          variant="primary"
          loading={actionStatus === "preparing"}
          disabled={busy}
          onClick={() => void prepare()}
        >
          {t("Prepare next block")}
        </HitoButton>
      ) : null}

      {candidate ? <CandidateReadback candidate={candidate} reviewed={reviewed} /> : null}
      {candidate && context.capabilities.canReviewCandidate ? (
        <div className="mt-6">
          {reviewed && context.capabilities.canConfirmCandidate ? (
            <HitoButton
              ref={confirmRef}
              type="button"
              size="md"
              variant="primary"
              loading={actionStatus === "confirming"}
              disabled={busy || reviewed.collisions.length > 0}
              onClick={() => void confirm()}
            >
              {t("Confirm next block")}
            </HitoButton>
          ) : (
            <HitoButton
              type="button"
              size="md"
              variant="primary"
              loading={actionStatus === "reviewing"}
              disabled={busy}
              onClick={() => void review()}
            >
              {t("Review next block")}
            </HitoButton>
          )}
        </div>
      ) : null}

      {message ? (
        <p className="hito-body-sm mt-4 text-foreground" role="status" aria-live="polite">
          {message}
        </p>
      ) : null}
    </section>
  );
}

function CheckInForm({
  avoidId,
  busy,
  checkIn,
  onAddAvoid,
  onAddSwap,
  onAvoidIdChange,
  onCheckInChange,
  onRemovePreference,
  onSave,
  onSwapFirstIdChange,
  onSwapSecondIdChange,
  preferences,
  projections,
  saveDisabled,
  saving,
  swapFirstId,
  swapSecondId,
}: {
  avoidId: string;
  busy: boolean;
  checkIn: CheckInDraft;
  onAddAvoid: () => void;
  onAddSwap: () => void;
  onAvoidIdChange: (value: string) => void;
  onCheckInChange: (value: CheckInDraft) => void;
  onRemovePreference: (index: number) => void;
  onSave: () => void;
  onSwapFirstIdChange: (value: string) => void;
  onSwapSecondIdChange: (value: string) => void;
  preferences: AdaptiveProjectionSchedulingPreference[];
  projections: BlueprintCalendarProjection[];
  saveDisabled: boolean;
  saving: boolean;
  swapFirstId: string;
  swapSecondId: string;
}) {
  const locale = useHitoUiLocale();
  const t = useHitoProductMessage();
  return (
    <fieldset className="mt-6 grid gap-5" disabled={busy}>
      <legend className="hito-ui-title-sm text-foreground">{t("Next block check-in")}</legend>
      <BooleanChoice
        label={t("Is your goal assumption still current?")}
        value={checkIn.goalAssumptionCurrent}
        onChange={(value) => onCheckInChange({ ...checkIn, goalAssumptionCurrent: value })}
      />
      <BooleanChoice
        label={t("Does this availability still work for the next block?")}
        value={checkIn.availabilityConfirmed}
        onChange={(value) => onCheckInChange({ ...checkIn, availabilityConfirmed: value })}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <ChoiceSelect
          id="adaptive-manageability"
          label={t("Current manageability")}
          options={manageabilityOptions}
          value={checkIn.manageability}
          onChange={(value) =>
            onCheckInChange({ ...checkIn, manageability: value as CheckInDraft["manageability"] })
          }
        />
        <ChoiceSelect
          id="adaptive-health"
          label={t("Current health limitation")}
          options={healthOptions}
          value={checkIn.healthLimitation}
          onChange={(value) =>
            onCheckInChange({
              ...checkIn,
              healthLimitation: value as CheckInDraft["healthLimitation"],
            })
          }
        />
        <ChoiceSelect
          id="adaptive-interruption"
          label={t("Recent interruption")}
          options={interruptionOptions}
          value={checkIn.interruptionStatus}
          onChange={(value) =>
            onCheckInChange({
              ...checkIn,
              interruptionStatus: value as CheckInDraft["interruptionStatus"],
            })
          }
        />
        <ChoiceSelect
          id="adaptive-clinician"
          label={t("Clinician guidance")}
          options={clinicianOptions}
          value={checkIn.clinicianGuidance}
          onChange={(value) =>
            onCheckInChange({
              ...checkIn,
              clinicianGuidance: value as CheckInDraft["clinicianGuidance"],
            })
          }
        />
      </div>
      <label className="grid gap-2" htmlFor="adaptive-change-reason">
        <span className="hito-label-md text-foreground">{t("Material changes or context")}</span>
        <Textarea
          id="adaptive-change-reason"
          rows={3}
          value={checkIn.materialChangeReason ?? ""}
          onChange={(event) =>
            onCheckInChange({ ...checkIn, materialChangeReason: event.currentTarget.value })
          }
        />
      </label>

      <div className="grid gap-3">
        <p className="hito-label-md text-foreground">{t("One-off Blueprint preferences")}</p>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <ProjectionSelect
            id="adaptive-avoid-date"
            label={t("Date to avoid")}
            projections={projections}
            value={avoidId}
            onChange={onAvoidIdChange}
          />
          <HitoButton type="button" size="md" variant="secondary" onClick={onAddAvoid}>
            {t("Add avoid date")}
          </HitoButton>
        </div>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
          <ProjectionSelect
            id="adaptive-swap-first"
            label={t("First slot")}
            projections={projections}
            value={swapFirstId}
            onChange={onSwapFirstIdChange}
          />
          <ProjectionSelect
            id="adaptive-swap-second"
            label={t("Second slot")}
            projections={projections}
            value={swapSecondId}
            onChange={onSwapSecondIdChange}
          />
          <HitoButton type="button" size="md" variant="secondary" onClick={onAddSwap}>
            {t("Add swap")}
          </HitoButton>
        </div>
        {preferences.length ? (
          <ul className="hito-row-group" aria-label={t("Active Blueprint preferences")}>
            {preferences.map((preference, index) => (
              <li key={`${preference.kind}:${index}`} className="hito-list-row gap-3">
                <span className="hito-body-sm min-w-0 flex-1 text-foreground">
                  {preferenceLabel(preference, projections, locale)}
                </span>
                <HitoButton
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemovePreference(index)}
                >
                  {t("Remove")}
                </HitoButton>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <HitoButton
        className="w-fit"
        type="button"
        size="md"
        variant="primary"
        loading={saving}
        disabled={busy || saveDisabled}
        onClick={onSave}
      >
        {t("Save check-in and preferences")}
      </HitoButton>
    </fieldset>
  );
}

function CandidateReadback({
  candidate,
  reviewed,
}: {
  candidate: ContinuationCandidate;
  reviewed: ReviewedWorkoutCommandCandidate | null;
}) {
  const locale = useHitoUiLocale();
  const t = useHitoProductMessage();
  return (
    <div className="mt-6 grid gap-5" data-adaptive-continuation-candidate="">
      <div>
        <p className="hito-ui-title-sm text-foreground">{t("Candidate review")}</p>
        <p className="hito-body-sm mt-1 text-text-secondary">
          {t("Evidence cutoff {date} · {performance}", {
            date: formatUiDate(candidate.factsUsed.evidenceCutoffDate, locale, {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            performance: performanceLabel(candidate, locale),
          })}
        </p>
      </div>
      <ReasonList reasons={candidate.factsMissing} label={t("Candidate missing facts")} />
      {candidate.conflicts.length ? (
        <ul className="hito-row-group" aria-label={t("Candidate conflicts")}>
          {candidate.conflicts.map((conflict) => (
            <li
              key={`${conflict.code}:${conflict.projectionId}:${conflict.date}`}
              className="hito-list-row items-start gap-3"
            >
              <span className="hito-status-pill" data-tone="warning">
                {t("Conflict")}
              </span>
              <p className="hito-body-sm min-w-0 text-foreground">{conflict.message}</p>
            </li>
          ))}
        </ul>
      ) : null}
      {reviewed?.warnings.map((warning) => (
        <p key={warning} className="hito-body-sm text-text-secondary">
          {warning}
        </p>
      ))}
      {reviewed?.collisions.map((collision) => (
        <p key={collision.workoutDate} className="hito-body-sm text-negative" role="alert">
          {t("Calendar date {date} is occupied.", {
            date: formatUiDate(collision.workoutDate, locale, {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
          })}
        </p>
      ))}
      <div className="grid gap-3">
        <p className="hito-label-md text-foreground">{t("Canonical WorkoutDocument review")}</p>
        <div className="hito-row-group">
          {candidate.workoutDocuments.map((document) => (
            <details
              key={`${document.sourceWorkoutId}:${document.workoutDate}`}
              className="hito-list-row block min-w-0"
            >
              <summary className="hito-list-row-title cursor-pointer text-foreground">
                {formatUiDate(document.workoutDate, locale, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
                {" · "}
                {document.title}
              </summary>
              <div className="mt-4 min-w-0">
                <WorkoutDocumentEditor document={document} readOnly onChange={() => undefined} />
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}

function BooleanChoice({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: boolean) => void;
  value: boolean | null;
}) {
  const t = useHitoProductMessage();
  return (
    <fieldset className="grid gap-2">
      <legend className="hito-label-md text-foreground">{label}</legend>
      <div className="hito-choice-toggle-group w-fit" role="radiogroup" aria-label={label}>
        {[true, false].map((choice) => (
          <HitoChoiceToggle
            key={String(choice)}
            type="button"
            role="radio"
            presentation="inline"
            size="sm"
            selected={value === choice}
            onClick={() => onChange(choice)}
          >
            {choice ? t("Yes") : t("No")}
          </HitoChoiceToggle>
        ))}
      </div>
    </fieldset>
  );
}

function ChoiceSelect({
  id,
  label,
  onChange,
  options,
  value,
}: {
  id: string;
  label: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<readonly [string, string]>;
  value: string;
}) {
  const locale = useHitoUiLocale();
  return (
    <label className="grid gap-2" htmlFor={id}>
      <span className="hito-label-md text-foreground">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(([optionValue, optionLabel]) => (
            <SelectItem key={optionValue} value={optionValue}>
              {getHitoKnownProductMessage(locale, optionLabel)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}

function ProjectionSelect({
  id,
  label,
  onChange,
  projections,
  value,
}: {
  id: string;
  label: string;
  onChange: (value: string) => void;
  projections: BlueprintCalendarProjection[];
  value: string;
}) {
  const locale = useHitoUiLocale();
  return (
    <ChoiceSelect
      id={id}
      label={label}
      value={value}
      onChange={onChange}
      options={projections.map((projection) => [
        projection.projectionId,
        `${formatUiDate(projection.date, locale, { month: "short", day: "numeric" })} · ${displayLabel(projection.workoutFamily)}`,
      ])}
    />
  );
}

function DataQuality({ data }: { data: NonNullable<ContinuationContext["dataQuality"]> }) {
  const locale = useHitoUiLocale();
  const t = useHitoProductMessage();
  const values = [
    ["Due", data.dueWorkoutCount],
    ["Resolved", data.resolvedOutcomeCount],
    ["FIT current", data.fitCurrentCount],
    ["Without FIT", data.completedWithoutFitCount],
    ["Missing", data.missingCount],
    ["Updating", data.updatingCount],
    ["Removed", data.removedCount],
  ] as const;
  return (
    <dl
      className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4"
      aria-label={t("Continuation data quality")}
    >
      {values.map(([label, value]) => (
        <div key={label}>
          <dt className="hito-caption-md text-text-secondary">
            {getHitoKnownProductMessage(locale, label)}
          </dt>
          <dd className="hito-body-md mt-1 text-foreground tabular-nums">
            {formatUiNumber(value, locale)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function PreferenceOutcomes({
  applications,
  projections,
}: {
  applications: ContinuationContext["preferenceApplications"];
  projections: BlueprintCalendarProjection[];
}) {
  const locale = useHitoUiLocale();
  const t = useHitoProductMessage();
  if (!applications.length) return null;
  return (
    <div className="mt-6 grid gap-3">
      <p className="hito-label-md text-foreground">{t("Preference outcomes")}</p>
      <ul className="hito-row-group">
        {applications.map((application) => (
          <li key={application.preferenceId} className="hito-list-row items-start gap-3">
            <span
              className="hito-status-pill"
              data-tone={application.outcome === "applied" ? "signal" : "warning"}
            >
              {application.outcome === "applied" ? t("Applied") : t("Not applied")}
            </span>
            <p className="hito-body-sm min-w-0 text-foreground">
              {preferenceLabel(application.preference, projections, locale)}
              {application.conflictReason ? ` — ${application.conflictReason}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReasonList({
  reasons,
  label = "Continuation reasons",
}: {
  reasons: string[];
  label?: string;
}) {
  const locale = useHitoUiLocale();
  if (!reasons.length) return null;
  return (
    <ul
      className="hito-body-sm mt-4 grid gap-1 text-text-secondary"
      aria-label={getHitoKnownProductMessage(locale, label)}
    >
      {reasons.map((reason) => (
        <li key={reason}>{displayLabel(reason)}</li>
      ))}
    </ul>
  );
}

function checkInDraft(current: AdaptiveContinuationHorizonCheckIn | null): CheckInDraft {
  if (current) {
    const { confirmationId: _confirmationId, ...draft } = current;
    return draft;
  }

  return {
    goalAssumptionCurrent: null,
    availabilityConfirmed: null,
    manageability: "manageable",
    materialChangeReason: null,
    healthLimitation: "unsure",
    interruptionStatus: "none",
    clinicianGuidance: "not_applicable",
  };
}

function statusLabel(status: ActiveContinuationState["status"], locale: ResolvedUiLocale) {
  return getHitoKnownProductMessage(
    locale,
    {
      planned: "Planned",
      check_in_needed: "Check-in needed",
      not_ready: "Not ready",
      authoring_ready: "Ready to prepare",
      candidate_ready: "Ready for review",
    }[status],
  );
}

function statusCopy(status: ActiveContinuationState["status"], locale: ResolvedUiLocale) {
  return getHitoKnownProductMessage(
    locale,
    {
      planned:
        "The current detailed block is still active. The server will open the next check-in at the continuation window.",
      check_in_needed:
        "Confirm the current goal, availability, manageability, health context, and one-off Blueprint preferences.",
      not_ready:
        "The next block cannot be prepared from current facts yet. Review the exact missing or unresolved items below.",
      authoring_ready:
        "Current facts and the retained check-in are ready for explicit next-block preparation.",
      candidate_ready:
        "Review the canonical workouts, facts, preferences, and conflicts before explicit Calendar confirmation.",
    }[status],
  );
}

function statusTone(status: ActiveContinuationState["status"]) {
  if (status === "planned") return "muted" as const;
  if (status === "check_in_needed" || status === "not_ready") return "warning" as const;
  if (status === "authoring_ready") return "signal" as const;
  return "rollout" as const;
}

function blockModeLabel(
  mode: NonNullable<ActiveContinuationState["window"]>["blockMode"],
  locale: ResolvedUiLocale,
) {
  return getHitoKnownProductMessage(
    locale,
    {
      normal_four_week: "Four-week block",
      target_taper_boundary: "Target-date or taper block",
      resolved_interruption_bridge: "Resolved-interruption bridge",
    }[mode],
  );
}

function performanceLabel(candidate: ContinuationCandidate, locale: ResolvedUiLocale) {
  return getHitoKnownProductMessage(
    locale,
    {
      blueprint_faithful_no_performance_inference: "Blueprint-faithful · no performance inference",
      constraint_only_no_performance_inference: "Constraint-only · no performance inference",
      fact_shaped_from_comparable_fit_and_rpe: "Fact-shaped from comparable FIT and RPE",
    }[candidate.performanceAdaptation.reason],
  );
}

function preferenceLabel(
  preference: AdaptiveProjectionSchedulingPreference,
  projections: BlueprintCalendarProjection[],
  locale: ResolvedUiLocale,
) {
  if (preference.kind === "avoid_projection_date") {
    return formatHitoProductMessage(locale, "Avoid {date}", {
      date: formatUiDate(preference.date, locale, { month: "short", day: "numeric" }),
    });
  }
  const date = (id: string) => projections.find((item) => item.projectionId === id)?.date ?? id;
  return formatHitoProductMessage(locale, "Swap {first} and {second}", {
    first: formatPreferenceDate(date(preference.firstProjectionId), locale),
    second: formatPreferenceDate(date(preference.secondProjectionId), locale),
  });
}

function formatPreferenceDate(value: string, locale: ResolvedUiLocale) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? formatUiDate(value, locale, { month: "short", day: "numeric" })
    : value;
}

function displayLabel(value: string) {
  const normalized = value.trim().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : value;
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

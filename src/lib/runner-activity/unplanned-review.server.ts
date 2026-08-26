import "@tanstack/react-start/server-only";

import { getRunnerCalendarDateForUserId } from "@/lib/runner-calendar-context";
import {
  applyAtomicCalendarWorkoutMutation,
  buildCalendarWorkoutMutationEvent,
  CALENDAR_WORKOUT_MUTATION_KIND,
  CalendarPersistenceRejection,
} from "@/lib/runner-calendar-mutations";
import type { PersistedPlannedWorkoutRow } from "@/lib/runner-calendar-persistence";
import type {
  ConfirmUnplannedActivityReviewResult,
  UnplannedActivityNormalizedIntervalV1,
  UnplannedActivityOptionalFactV1,
  UnplannedActivityReviewV1,
} from "@/lib/runner-activity/product-contract";
import {
  base64UrlDecodeUtf8,
  base64UrlEncodeUtf8,
  digestSha256Hex,
  safeTokenEqual,
  signStableJsonPayload,
  stableJsonStringify,
} from "@/lib/review-token-signing";
import type { Database, Json } from "@/lib/supabase/database";
import { serverEnv } from "@/lib/supabase/env";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { readRunnerActivityProjection } from "@/lib/runner-activity/garmin-fit-source";
import { reconcileWorkoutResultProjection } from "@/lib/workout-result-import/planned-workout-projection";

const REVIEW_VERSION = "unplanned_activity_review_v1" as const;
const TOKEN_PREFIX = "unplanned-activity-review-v1";
const TOKEN_TTL_MS = 15 * 60 * 1000;

type ActivityRow = Database["public"]["Tables"]["runner_activities"]["Row"];
type ActivityRevisionRow = Database["public"]["Tables"]["runner_activity_revisions"]["Row"];
type SourceRow = Database["public"]["Tables"]["runner_activity_sources"]["Row"];
type SourceRevisionRow = Database["public"]["Tables"]["runner_activity_source_revisions"]["Row"];
type AssetRow = Database["public"]["Tables"]["workout_result_assets"]["Row"];

type ReviewAuthority = {
  version: typeof REVIEW_VERSION;
  userId: string;
  activityId: string;
  activityRevisionId: string;
  sourceId: string;
  sourceRevisionId: string;
  assetId: string;
  localDate: string | null;
  factsSha256: string;
  title: string;
  placementKind: UnplannedActivityReviewV1["placement"]["kind"];
  occupancyFingerprint: string | null;
  targetWorkoutId: string | null;
};

type ReviewTokenEnvelope = {
  authority: ReviewAuthority;
  reviewChecksum: string;
  expiresAt: string;
};

type HydratedInternal = {
  review: UnplannedActivityReviewV1;
  authority: ReviewAuthority;
  asset: AssetRow;
  targetWorkout: PersistedPlannedWorkoutRow | null;
};

export class UnplannedActivityReviewError extends Error {
  constructor(
    readonly reason:
      | "not_found"
      | "foreign"
      | "invalid_review"
      | "stale_review"
      | "ineligible"
      | "conflict"
      | "persistence_failed",
    message: string,
  ) {
    super(message);
    this.name = "UnplannedActivityReviewError";
  }
}

export async function hydrateUnplannedActivityReviewForUser(input: {
  userId: string;
  activityId: string;
  title?: string | null;
  ingestDisposition?: UnplannedActivityReviewV1["source"]["ingestDisposition"];
}): Promise<UnplannedActivityReviewV1> {
  return (await hydrateInternal(input)).review;
}

export async function confirmUnplannedActivityReviewForUser(input: {
  userId: string;
  activityId: string;
  reviewToken: string;
  reviewChecksum: string;
  intent: "materialize_on_rest" | "associate_existing";
}): Promise<ConfirmUnplannedActivityReviewResult> {
  let currentReview: UnplannedActivityReviewV1 | null = null;

  try {
    const token = await verifyReviewToken(input.reviewToken, input.reviewChecksum);
    if (
      token.authority.userId !== input.userId ||
      token.authority.activityId !== input.activityId
    ) {
      throw new UnplannedActivityReviewError(
        "invalid_review",
        "The Activity Review does not belong to this runner.",
      );
    }

    const hydrated = await hydrateInternal({
      userId: input.userId,
      activityId: input.activityId,
      title: token.authority.title,
    });
    currentReview = hydrated.review;

    if (hydrated.review.placement.kind === "already_confirmed") {
      if (!sameConfirmedActivityAuthority(hydrated.authority, token.authority)) {
        throw new UnplannedActivityReviewError(
          "stale_review",
          "The Activity facts changed after Review. Open it again before confirming.",
        );
      }
      const workout = hydrated.targetWorkout;
      if (!workout) {
        throw new UnplannedActivityReviewError(
          "persistence_failed",
          "The confirmed Activity Calendar workout could not be read.",
        );
      }
      const event = await findOriginalConfirmationEvent({
        userId: input.userId,
        activityId: input.activityId,
        workoutId: workout.id,
      });
      const projectionState = await reconcileConfirmedActivityProjection({
        hydrated,
        authority: token.authority,
        workout,
      });
      return {
        ok: true,
        review: hydrated.review,
        calendarWorkoutId: workout.id,
        mutationEventId: event.id,
        idempotent: true,
        projectionState,
      };
    }

    if (
      hydrated.review.reviewChecksum !== input.reviewChecksum ||
      stableJsonStringify(hydrated.authority) !== stableJsonStringify(token.authority)
    ) {
      throw new UnplannedActivityReviewError(
        "stale_review",
        "The Activity or Calendar date changed after Review. Open it again before confirming.",
      );
    }

    const expectedIntent =
      hydrated.review.placement.kind === "past_rest_available"
        ? "materialize_on_rest"
        : hydrated.review.placement.kind === "occupied_association_available"
          ? "associate_existing"
          : null;
    if (!expectedIntent || input.intent !== expectedIntent) {
      throw new UnplannedActivityReviewError(
        "ineligible",
        "This Activity cannot be placed on the reviewed Calendar date.",
      );
    }

    const calendarWorkoutId =
      hydrated.targetWorkout && hydrated.targetWorkout.workout_type !== "rest"
        ? hydrated.targetWorkout.id
        : crypto.randomUUID();
    const workoutInsert =
      input.intent === "materialize_on_rest"
        ? buildRecordedWorkoutInsert({
            id: calendarWorkoutId,
            userId: input.userId,
            localDate: token.authority.localDate!,
            title: token.authority.title,
          })
        : null;
    const mutationEvent = buildCalendarWorkoutMutationEvent({
      mutationKind: CALENDAR_WORKOUT_MUTATION_KIND.confirmActivity,
      originKind: "file_import",
      reviewPayloadVersion: REVIEW_VERSION,
      reviewChecksum: input.reviewChecksum,
      plannedWorkoutId: calendarWorkoutId,
      targetWorkoutId: calendarWorkoutId,
      targetDate: token.authority.localDate,
      title: token.authority.title,
      activityId: token.authority.activityId,
      activityRevisionId: token.authority.activityRevisionId,
      sourceRevisionId: token.authority.sourceRevisionId,
      resultAssetId: token.authority.assetId,
      placementIntent: input.intent,
      occupancyFingerprint: token.authority.occupancyFingerprint,
    });
    const persisted = await applyAtomicCalendarWorkoutMutation({
      userId: input.userId,
      currentDate: await getRunnerCalendarDateForUserId(input.userId),
      mutationKind: "confirm_activity",
      expectedSourceWorkout: hydrated.targetWorkout as unknown as Json,
      expectedTargetWorkout: null,
      workoutInsert: workoutInsert as unknown as Json,
      workoutUpdate: token.authority as unknown as Json,
      mutationEvent: mutationEvent as unknown as Json,
    });

    const projectionState = await reconcileConfirmedActivityProjection({
      hydrated,
      authority: token.authority,
      workout: persisted.mutatedWorkout!,
    });
    const review = await hydrateUnplannedActivityReviewForUser({
      userId: input.userId,
      activityId: input.activityId,
    });
    return {
      ok: true,
      review,
      calendarWorkoutId: persisted.mutatedWorkout?.id ?? calendarWorkoutId,
      mutationEventId: persisted.mutationEvent.id,
      idempotent: persisted.idempotent,
      projectionState,
    };
  } catch (error) {
    const mapped = mapReviewError(error);
    return {
      ok: false,
      reason: mapped.reason,
      message: mapped.message,
      review: mapped.reason === "foreign" || mapped.reason === "not_found" ? null : currentReview,
    };
  }
}

function sameConfirmedActivityAuthority(current: ReviewAuthority, reviewed: ReviewAuthority) {
  return (
    stableJsonStringify({
      ...current,
      placementKind: reviewed.placementKind,
      occupancyFingerprint: reviewed.occupancyFingerprint,
      targetWorkoutId: reviewed.targetWorkoutId,
    }) === stableJsonStringify(reviewed)
  );
}

async function reconcileConfirmedActivityProjection(input: {
  hydrated: HydratedInternal;
  authority: ReviewAuthority;
  workout: PersistedPlannedWorkoutRow;
}): Promise<"current" | "updating"> {
  try {
    const activityProjection = await readRunnerActivityProjection({
      userId: input.authority.userId,
      activityId: input.authority.activityId,
      activityRevisionId: input.authority.activityRevisionId,
    });
    await reconcileWorkoutResultProjection({
      userId: input.authority.userId,
      plannedWorkout: input.workout,
      workoutLogId: null,
      activitySource: {
        activityId: input.authority.activityId,
        activityRevisionId: input.authority.activityRevisionId,
        sourceId: input.authority.sourceId,
        sourceRevisionId: input.authority.sourceRevisionId,
        rawState:
          input.hydrated.review.source.rawFileAvailability === "available"
            ? "available"
            : "removed",
        rawStorageBucket: input.hydrated.asset.storage_bucket,
        rawStoragePath: input.hydrated.asset.storage_path,
        reusedExactSource: true,
      },
      activityProjection,
      candidateAssetId: input.authority.assetId,
      candidateStoragePath: input.hydrated.asset.storage_path ?? "",
      primaryFile: {
        primaryFileKind: "fit",
        primaryFileName:
          input.hydrated.asset.primary_file_name ?? input.hydrated.asset.original_file_name,
        fileBuffer: Buffer.alloc(0),
      },
      initialParseStatus: "uploaded",
      confirmedCanonicalMatch: true,
    });
    return "current";
  } catch {
    return "updating";
  }
}

async function hydrateInternal(input: {
  userId: string;
  activityId: string;
  title?: string | null;
  ingestDisposition?: UnplannedActivityReviewV1["source"]["ingestDisposition"];
}): Promise<HydratedInternal> {
  const supabase = createAdminSupabaseClient();
  const identity = await supabase
    .from("runner_activities")
    .select("*")
    .eq("id", input.activityId)
    .maybeSingle();
  if (identity.error) throw new Error(identity.error.message);
  if (!identity.data) {
    throw new UnplannedActivityReviewError("not_found", "The saved Activity was not found.");
  }
  if (identity.data.user_id !== input.userId) {
    throw new UnplannedActivityReviewError(
      "foreign",
      "The saved Activity belongs to another runner.",
    );
  }

  const activity = identity.data as ActivityRow;
  if (
    activity.sport !== "run" ||
    activity.recording_kind !== "recorded" ||
    activity.quality_state !== "accepted" ||
    !activity.current_revision_id
  ) {
    throw new UnplannedActivityReviewError(
      "stale_review",
      "The saved Activity does not have a current accepted running revision.",
    );
  }

  const [revisionResult, sourceResult, matchResult] = await Promise.all([
    supabase
      .from("runner_activity_revisions")
      .select("*")
      .eq("id", activity.current_revision_id)
      .eq("activity_id", activity.id)
      .eq("user_id", input.userId)
      .maybeSingle(),
    supabase
      .from("runner_activity_sources")
      .select("*")
      .eq("activity_id", activity.id)
      .eq("user_id", input.userId)
      .eq("source_kind", "manual_garmin_fit")
      .maybeSingle(),
    supabase
      .from("runner_activity_planned_workout_matches")
      .select("planned_workout_id, source_revision_id")
      .eq("activity_id", activity.id)
      .eq("user_id", input.userId)
      .maybeSingle(),
  ]);
  for (const result of [revisionResult, sourceResult, matchResult]) {
    if (result.error) throw new Error(result.error.message);
  }
  const revision = revisionResult.data as ActivityRevisionRow | null;
  const source = sourceResult.data as SourceRow | null;
  if (
    !revision ||
    !source?.current_revision_id ||
    revision.source_revision_id !== source.current_revision_id
  ) {
    throw new UnplannedActivityReviewError(
      "stale_review",
      "The saved Activity source chain is not current.",
    );
  }

  const [sourceRevisionResult, assetResult] = await Promise.all([
    supabase
      .from("runner_activity_source_revisions")
      .select("*")
      .eq("id", source.current_revision_id)
      .eq("source_id", source.id)
      .eq("user_id", input.userId)
      .maybeSingle(),
    supabase
      .from("workout_result_assets")
      .select("*")
      .eq("activity_source_revision_id", source.current_revision_id)
      .eq("user_id", input.userId)
      .eq("primary_file_kind", "fit")
      .eq("parse_status", "parsed")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);
  if (sourceRevisionResult.error) throw new Error(sourceRevisionResult.error.message);
  if (assetResult.error) throw new Error(assetResult.error.message);
  const sourceRevision = sourceRevisionResult.data as SourceRevisionRow | null;
  const asset = assetResult.data as AssetRow | null;
  if (!sourceRevision || !asset) {
    throw new UnplannedActivityReviewError(
      "stale_review",
      "The saved Activity no longer has a current parsed FIT asset.",
    );
  }

  const summary = readRecord(revision.normalized_summary);
  const summaryPayload = readRecord(summary.summary_payload);
  const fitWorkoutName = readString(readRecord(summaryPayload.workout).name);
  const defaultTitle = fitWorkoutName ?? "Run";
  const title = normalizeTitle(input.title, defaultTitle);
  const facts = buildFacts(activity, revision, summary, fitWorkoutName);
  const laps = normalizeIntervals(summary.lap_payload);
  const steps = normalizeIntervals(summary.actual_step_payload);
  const factualPayload = { facts, laps, steps };
  const factsSha256 = await digestSha256Hex(stableJsonStringify(factualPayload));
  const matchedWorkout = matchResult.data?.planned_workout_id
    ? await readOwnedWorkout(input.userId, matchResult.data.planned_workout_id)
    : null;
  const currentDate = await getRunnerCalendarDateForUserId(input.userId);
  const occupancy =
    !matchedWorkout && revision.activity_local_date
      ? await readWorkoutOnDate(input.userId, revision.activity_local_date)
      : matchedWorkout;
  const placement = await resolvePlacement({
    userId: input.userId,
    localDate: revision.activity_local_date,
    currentDate,
    rawState: sourceRevision.raw_state,
    matchedWorkout,
    occupancy,
    sourceRevisionId: sourceRevision.id,
  });
  const occupancyFingerprint = occupancy
    ? await digestSha256Hex(stableJsonStringify(occupancy))
    : null;
  const authority: ReviewAuthority = {
    version: REVIEW_VERSION,
    userId: input.userId,
    activityId: activity.id,
    activityRevisionId: revision.id,
    sourceId: source.id,
    sourceRevisionId: sourceRevision.id,
    assetId: asset.id,
    localDate: revision.activity_local_date,
    factsSha256,
    title,
    placementKind: placement.kind,
    occupancyFingerprint,
    targetWorkoutId: occupancy?.id ?? null,
  };
  const reviewChecksum = await digestSha256Hex(stableJsonStringify(authority));
  const reviewToken = await signReviewToken({
    authority,
    reviewChecksum,
    expiresAt: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
  });
  const review: UnplannedActivityReviewV1 = {
    version: REVIEW_VERSION,
    activityId: activity.id,
    activityRevisionId: revision.id,
    sourceRevisionId: sourceRevision.id,
    reviewChecksum,
    reviewToken,
    title,
    source: {
      originalFileName: sourceRevision.raw_original_file_name,
      extractedFitFileName: asset.primary_file_name,
      rawFileAvailability: sourceRevision.raw_state === "available" ? "available" : "unavailable",
      provenance: "file_import",
      ingestDisposition: input.ingestDisposition ?? "retained",
    },
    facts,
    laps: { state: laps.length > 0 ? "available" : "unavailable", items: laps },
    steps: { state: steps.length > 0 ? "available" : "unavailable", items: steps },
    calendarState: matchedWorkout
      ? {
          state: "confirmed",
          workout: {
            id: matchedWorkout.id,
            title: matchedWorkout.title,
            workoutDate: matchedWorkout.workout_date,
          },
        }
      : { state: "saved_unassigned", workout: null },
    placement,
    capabilities: {
      canConfirmRest: placement.kind === "past_rest_available",
      canConfirmAssociation: placement.kind === "occupied_association_available",
      canEditFallbackTitle: !fitWorkoutName && !matchedWorkout,
      canResume: true,
    },
  };

  return { review, authority, asset, targetWorkout: occupancy };
}

function buildFacts(
  activity: ActivityRow,
  revision: ActivityRevisionRow,
  summary: Record<string, unknown>,
  workoutName: string | null,
): UnplannedActivityReviewV1["facts"] {
  const timerDuration = revision.total_timer_duration_min;
  const elapsedDuration = revision.total_elapsed_duration_min;
  return {
    sport: "run",
    localDate: optionalFact(revision.activity_local_date),
    startedAt: optionalFact(revision.activity_started_at),
    workoutName: optionalFact(workoutName),
    duration:
      timerDuration != null
        ? optionalFact({ minutes: timerDuration, basis: "timer" as const })
        : elapsedDuration != null
          ? optionalFact({ minutes: elapsedDuration, basis: "elapsed" as const })
          : ({ state: "unavailable", value: null } as const),
    distanceKm: optionalFact(revision.total_distance_km ?? activity.distance_km),
    averageHeartRateBpm: optionalFact(readNumber(summary.avg_heart_rate)),
    maximumHeartRateBpm: optionalFact(readNumber(summary.max_heart_rate)),
    averageCadenceSpm: optionalFact(readNumber(summary.avg_cadence)),
    averagePowerWatts: optionalFact(readNumber(summary.avg_power)),
    maximumPowerWatts: optionalFact(readNumber(summary.max_power)),
    elevationGainM: optionalFact(readNumber(summary.total_ascent_m)),
    elevationLossM: optionalFact(readNumber(summary.total_descent_m)),
    calories: optionalFact(readNumber(summary.total_calories)),
  };
}

function optionalFact<T>(value: T | null | undefined): UnplannedActivityOptionalFactV1<T> {
  return value == null ? { state: "unavailable", value: null } : { state: "available", value };
}

function normalizeIntervals(value: unknown): UnplannedActivityNormalizedIntervalV1[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    const row = readRecord(entry);
    const sequence = readNumber(row.sequence);
    if (!Number.isInteger(sequence) || sequence! <= 0) return [];
    return [
      {
        sequence: sequence!,
        workoutStepIndex: nullableInteger(row.workoutStepIndex),
        durationMin: readNumber(row.durationMin),
        distanceKm: readNumber(row.distanceKm),
        averageHeartRateBpm: readNumber(row.avgHeartRate),
        maximumHeartRateBpm: readNumber(row.maxHeartRate),
        averagePowerWatts: readNumber(row.avgPower),
        maximumPowerWatts: readNumber(row.maxPower),
        averageCadenceSpm: readNumber(row.avgCadence),
        calories: readNumber(row.calories),
        elevationGainM: readNumber(row.elevationGainM),
        elevationLossM: readNumber(row.elevationLossM),
      },
    ];
  });
}

async function resolvePlacement(input: {
  userId: string;
  localDate: string | null;
  currentDate: string;
  rawState: string;
  matchedWorkout: PersistedPlannedWorkoutRow | null;
  occupancy: PersistedPlannedWorkoutRow | null;
  sourceRevisionId: string;
}): Promise<UnplannedActivityReviewV1["placement"]> {
  if (input.matchedWorkout) {
    return {
      kind: "already_confirmed",
      targetDate: input.matchedWorkout.workout_date,
      existingWorkout: safeWorkoutIdentity(input.matchedWorkout),
    };
  }
  if (!input.localDate) {
    return { kind: "date_missing", targetDate: null, existingWorkout: null };
  }
  if (input.rawState === "removed") {
    return { kind: "stale", targetDate: input.localDate, existingWorkout: null };
  }
  if (input.localDate >= input.currentDate) {
    return { kind: "today_or_future", targetDate: input.localDate, existingWorkout: null };
  }
  if (!input.occupancy) {
    return { kind: "past_rest_available", targetDate: input.localDate, existingWorkout: null };
  }
  const safeIdentity = safeWorkoutIdentity(input.occupancy);
  const protectedState = await readWorkoutProtection({
    userId: input.userId,
    workoutId: input.occupancy.id,
    sourceRevisionId: input.sourceRevisionId,
  });
  if (input.occupancy.workout_type === "rest") {
    return protectedState
      ? {
          kind: "occupied_ineligible",
          targetDate: input.localDate,
          existingWorkout: safeIdentity,
        }
      : { kind: "past_rest_available", targetDate: input.localDate, existingWorkout: null };
  }
  return {
    kind: protectedState ? "occupied_ineligible" : "occupied_association_available",
    targetDate: input.localDate,
    existingWorkout: safeIdentity,
  };
}

async function readWorkoutProtection(input: {
  userId: string;
  workoutId: string;
  sourceRevisionId: string;
}) {
  const supabase = createAdminSupabaseClient();
  const [logs, assets, metrics, comparisons, insights, matches] = await Promise.all([
    supabase
      .from("workout_logs")
      .select("id")
      .eq("user_id", input.userId)
      .eq("planned_workout_id", input.workoutId),
    supabase
      .from("workout_result_assets")
      .select("id, activity_source_revision_id")
      .eq("user_id", input.userId)
      .eq("planned_workout_id", input.workoutId),
    supabase
      .from("workout_actual_metrics")
      .select("id, activity_revision_id")
      .eq("user_id", input.userId)
      .eq("planned_workout_id", input.workoutId)
      .neq("status", "superseded"),
    supabase
      .from("workout_comparisons")
      .select("id")
      .eq("user_id", input.userId)
      .eq("planned_workout_id", input.workoutId),
    supabase
      .from("workout_ai_insights")
      .select("id")
      .eq("user_id", input.userId)
      .eq("planned_workout_id", input.workoutId),
    supabase
      .from("runner_activity_planned_workout_matches")
      .select("activity_id, source_revision_id")
      .eq("user_id", input.userId)
      .eq("planned_workout_id", input.workoutId),
  ]);
  for (const result of [logs, assets, metrics, comparisons, insights, matches]) {
    if (result.error) throw new Error(result.error.message);
  }
  const hasDifferentAsset = (assets.data ?? []).some(
    (asset) => asset.activity_source_revision_id !== input.sourceRevisionId,
  );
  const hasDifferentMatch = (matches.data ?? []).some(
    (match) => match.source_revision_id !== input.sourceRevisionId,
  );
  return (
    (logs.data?.length ?? 0) > 0 ||
    hasDifferentAsset ||
    (metrics.data?.length ?? 0) > 0 ||
    (comparisons.data?.length ?? 0) > 0 ||
    (insights.data?.length ?? 0) > 0 ||
    hasDifferentMatch
  );
}

async function readOwnedWorkout(userId: string, workoutId: string) {
  const result = await createAdminSupabaseClient()
    .from("planned_workouts")
    .select("*")
    .eq("id", workoutId)
    .eq("user_id", userId)
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return result.data as PersistedPlannedWorkoutRow | null;
}

async function readWorkoutOnDate(userId: string, workoutDate: string) {
  const result = await createAdminSupabaseClient()
    .from("planned_workouts")
    .select("*")
    .eq("user_id", userId)
    .eq("workout_date", workoutDate)
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return result.data as PersistedPlannedWorkoutRow | null;
}

function safeWorkoutIdentity(workout: PersistedPlannedWorkoutRow) {
  return {
    id: workout.id,
    title: workout.title,
    workoutDate: workout.workout_date,
  };
}

function buildRecordedWorkoutInsert(input: {
  id: string;
  userId: string;
  localDate: string;
  title: string;
}) {
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: "UTC",
  }).format(new Date(`${input.localDate}T12:00:00Z`));
  return {
    id: input.id,
    plan_cycle_id: null,
    user_id: input.userId,
    origin_kind: "file_import",
    workout_date: input.localDate,
    weekday,
    week_number: 1,
    phase: "Recorded",
    workout_type: "recorded_run",
    source_workout_id: null,
    source_workout_type: "recorded_activity",
    workout_family: "recorded",
    workout_identity: "recorded_activity",
    calendar_icon_key: "recorded",
    goal_context: null,
    metric_mode: {
      guidance: "effort",
      executable_mode: "none",
      pace_targets_allowed: false,
      hr_targets_allowed: false,
      hr_target_source: "effort_only",
      reason: "Recorded activity contains factual results and no planned execution targets.",
    },
    title: input.title,
    notes: null,
    planned_rpe: null,
    estimated_fatigue: null,
    recovery_priority: null,
    steps: [
      {
        type: "recorded",
        segment_id: "recorded-activity",
        segment_type: "recorded_activity",
        label: "Recorded activity",
        sequence: 1,
        prescription: { mode: "none" },
        guidance: "Completed activity imported from retained FIT evidence.",
      },
    ],
    display_order: 1,
  };
}

async function signReviewToken(envelope: ReviewTokenEnvelope) {
  const payload = base64UrlEncodeUtf8(stableJsonStringify(envelope));
  const signature = await signStableJsonPayload(
    { prefix: TOKEN_PREFIX, payload },
    serverEnv.supabaseServiceRoleKey,
  );
  return `${TOKEN_PREFIX}.${payload}.${signature}`;
}

async function verifyReviewToken(token: string, expectedChecksum: string) {
  const [prefix, payload, signature, ...extra] = token.split(".");
  if (prefix !== TOKEN_PREFIX || !payload || !signature || extra.length > 0) {
    throw new UnplannedActivityReviewError(
      "invalid_review",
      "The Activity Review token is invalid.",
    );
  }
  const expectedSignature = await signStableJsonPayload(
    { prefix: TOKEN_PREFIX, payload },
    serverEnv.supabaseServiceRoleKey,
  );
  if (!safeTokenEqual(signature, expectedSignature)) {
    throw new UnplannedActivityReviewError(
      "invalid_review",
      "The Activity Review signature is invalid.",
    );
  }
  let envelope: ReviewTokenEnvelope;
  try {
    envelope = JSON.parse(base64UrlDecodeUtf8(payload)) as ReviewTokenEnvelope;
  } catch {
    throw new UnplannedActivityReviewError(
      "invalid_review",
      "The Activity Review token is invalid.",
    );
  }
  if (
    envelope.authority?.version !== REVIEW_VERSION ||
    envelope.reviewChecksum !== expectedChecksum ||
    !safeTokenEqual(envelope.reviewChecksum, expectedChecksum) ||
    !Number.isFinite(Date.parse(envelope.expiresAt))
  ) {
    throw new UnplannedActivityReviewError(
      "invalid_review",
      "The Activity Review token is invalid.",
    );
  }
  if (Date.parse(envelope.expiresAt) <= Date.now()) {
    throw new UnplannedActivityReviewError(
      "stale_review",
      "The Activity Review expired. Open it again before confirming.",
    );
  }
  return envelope;
}

async function findOriginalConfirmationEvent(input: {
  userId: string;
  activityId: string;
  workoutId: string;
}) {
  const result = await createAdminSupabaseClient()
    .from("calendar_workout_mutation_events")
    .select("id")
    .eq("user_id", input.userId)
    .eq("planned_workout_id", input.workoutId)
    .eq("mutation_kind", CALENDAR_WORKOUT_MUTATION_KIND.confirmActivity)
    .contains("event_payload", { activity_id: input.activityId })
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (result.error || !result.data) {
    throw new Error(
      result.error?.message ?? "The original Activity confirmation audit is missing.",
    );
  }
  return result.data;
}

function normalizeTitle(value: string | null | undefined, fallback: string) {
  const title = value?.trim() || fallback;
  if (title.length > 80) {
    throw new UnplannedActivityReviewError(
      "invalid_review",
      "The recorded Activity title must be 80 characters or fewer.",
    );
  }
  return title;
}

function mapReviewError(error: unknown): UnplannedActivityReviewError {
  if (error instanceof UnplannedActivityReviewError) return error;
  if (error instanceof CalendarPersistenceRejection) {
    const reason =
      error.reason === "stale_review"
        ? "stale_review"
        : error.reason === "conflict"
          ? "conflict"
          : error.reason === "protected_day"
            ? "ineligible"
            : "persistence_failed";
    return new UnplannedActivityReviewError(reason, error.message);
  }
  return new UnplannedActivityReviewError(
    "persistence_failed",
    error instanceof Error ? error.message : "The Activity could not be confirmed.",
  );
}

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function nullableInteger(value: unknown) {
  const number = readNumber(value);
  return number != null && Number.isInteger(number) ? number : null;
}

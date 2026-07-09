import { useEffect, useMemo, useState } from "react";
import type { KeyboardEvent } from "react";

import { HitoDsPlayground } from "@/components/hito-ds/playground";
import {
  HitoCalendarDayCell,
  HitoWorkoutDayRow,
  type HitoCalendarDayBaseState,
} from "@/components/ui/hito-calendar-day";
import { Icon } from "@/components/ui/icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CanonicalWorkoutIdentity } from "@/lib/rich-workout-model";
import {
  DEFAULT_WORKOUT_LIBRARY_STATE,
  DETAIL_DENSITY_OPTIONS,
  FAMILY_FILTER_OPTIONS,
  PROVIDER_STATE_COPY,
  PROVIDER_STATE_OPTIONS,
  RESULT_STATE_OPTIONS,
  TARGET_TRUTH_MODE_COPY,
  VIEW_MODE_OPTIONS,
  WORKOUT_LIBRARY_IDENTITY_COUNT,
  WORKOUT_LIBRARY_SPECIMENS,
  type WorkoutLibraryOption,
  type WorkoutLibrarySpecimen,
  type WorkoutLibraryState,
} from "./workout-library-playground-data";

const WEEKDAY_HEADINGS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function WorkoutLibraryPlayground() {
  const [state, setState] = useState<WorkoutLibraryState>(DEFAULT_WORKOUT_LIBRARY_STATE);
  const [selectedIdentity, setSelectedIdentity] = useState<CanonicalWorkoutIdentity>(
    WORKOUT_LIBRARY_SPECIMENS[0].identity,
  );

  const filteredSpecimens = useMemo(() => {
    if (state.familyFilter === "all") return WORKOUT_LIBRARY_SPECIMENS;
    return WORKOUT_LIBRARY_SPECIMENS.filter((specimen) => specimen.family === state.familyFilter);
  }, [state.familyFilter]);

  useEffect(() => {
    if (!filteredSpecimens.some((specimen) => specimen.identity === selectedIdentity)) {
      setSelectedIdentity(filteredSpecimens[0]?.identity ?? WORKOUT_LIBRARY_SPECIMENS[0].identity);
    }
  }, [filteredSpecimens, selectedIdentity]);

  const selectedSpecimen =
    WORKOUT_LIBRARY_SPECIMENS.find((specimen) => specimen.identity === selectedIdentity) ??
    WORKOUT_LIBRARY_SPECIMENS[0];

  const setField =
    <Key extends keyof WorkoutLibraryState>(key: Key) =>
    (value: WorkoutLibraryState[Key]) => {
      setState((current) => ({ ...current, [key]: value }));
    };

  return (
    <HitoDsPlayground
      id="workout-library-playground"
      label="Workout taxonomy appendix"
      title="Canonical workout identities on shared primitives."
      body="Static Running Coach matrix for every canonical workout identity. Calendar ownership stays with the shared calendar primitive specimen above."
      status={`${WORKOUT_LIBRARY_IDENTITY_COUNT} identities`}
      statusTone="neutral"
      controls={<ControlsBody state={state} setField={setField} />}
      preview={
        <WorkoutLibraryPreview
          specimens={filteredSpecimens}
          selectedIdentity={selectedSpecimen.identity}
          selectedSpecimen={selectedSpecimen}
          state={state}
          onSelect={setSelectedIdentity}
        />
      }
      caption={[
        {
          label: "Proves",
          body: "Workout identity labels, glyphs, result markers, provider overlays, and detail readback across the taxonomy.",
        },
        {
          label: "Does not imply",
          body: "Saved plans, real provider sync, uploaded FIT/Strava data, AI insight, comparison rows, manual workout CRUD, or plan mutation.",
        },
        {
          label: "Used in",
          body: "Static taxonomy review after the primary HitoCalendarDayCell / HitoWorkoutDayRow specimen.",
        },
      ]}
    />
  );
}

function ControlsBody({
  state,
  setField,
}: {
  state: WorkoutLibraryState;
  setField: <Key extends keyof WorkoutLibraryState>(
    key: Key,
  ) => (value: WorkoutLibraryState[Key]) => void;
}) {
  return (
    <div className="grid min-w-0 gap-4">
      <ChoiceControl
        label="View"
        options={VIEW_MODE_OPTIONS}
        value={state.viewMode}
        onChange={setField("viewMode")}
      />
      <ChoiceControl
        label="Result state"
        options={RESULT_STATE_OPTIONS}
        value={state.resultState}
        onChange={setField("resultState")}
      />
      <ChoiceControl
        label="Detail density"
        options={DETAIL_DENSITY_OPTIONS}
        value={state.detailDensity}
        onChange={setField("detailDensity")}
      />
      <SelectControl
        label="Provider state"
        options={PROVIDER_STATE_OPTIONS}
        value={state.providerState}
        onChange={setField("providerState")}
      />
      <SelectControl
        label="Family filter"
        options={FAMILY_FILTER_OPTIONS}
        value={state.familyFilter}
        onChange={setField("familyFilter")}
      />
    </div>
  );
}

function WorkoutLibraryPreview({
  onSelect,
  selectedIdentity,
  selectedSpecimen,
  specimens,
  state,
}: {
  onSelect: (identity: CanonicalWorkoutIdentity) => void;
  selectedIdentity: CanonicalWorkoutIdentity;
  selectedSpecimen: WorkoutLibrarySpecimen;
  specimens: readonly WorkoutLibrarySpecimen[];
  state: WorkoutLibraryState;
}) {
  return (
    <div className="grid min-w-0 gap-5">
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-end justify-between gap-3 border-b border-hairline pb-3">
          <div className="min-w-0">
            <p className="hito-label">
              {state.viewMode === "desktop" ? "Static identity grid" : "Static identity rows"}
            </p>
            <h3 className="hito-list-row-title mt-1">
              {specimens.length} of {WORKOUT_LIBRARY_IDENTITY_COUNT} identities visible
            </h3>
          </div>
          <span className="hito-status-pill" data-tone="neutral">
            Specimen only
          </span>
        </div>

        <div className="mt-4 min-w-0">
          {state.viewMode === "desktop" ? (
            <DesktopWorkoutLibrary
              onSelect={onSelect}
              selectedIdentity={selectedIdentity}
              specimens={specimens}
              state={state}
            />
          ) : (
            <MobileWorkoutLibrary
              onSelect={onSelect}
              selectedIdentity={selectedIdentity}
              specimens={specimens}
              state={state}
            />
          )}
        </div>
      </div>

      <WorkoutDetailSpecimen specimen={selectedSpecimen} state={state} />
    </div>
  );
}

function DesktopWorkoutLibrary({
  onSelect,
  selectedIdentity,
  specimens,
  state,
}: {
  onSelect: (identity: CanonicalWorkoutIdentity) => void;
  selectedIdentity: CanonicalWorkoutIdentity;
  specimens: readonly WorkoutLibrarySpecimen[];
  state: WorkoutLibraryState;
}) {
  return (
    <div className="hito-calendar-grid-container min-w-0">
      <div className="hito-calendar-grid-seven">
        <div className="hito-calendar-grid hito-calendar-grid-month hito-calendar-grid-month-dense">
          {WEEKDAY_HEADINGS.map((weekday) => (
            <span key={weekday} className="hito-calendar-grid-heading hito-micro-label">
              {weekday}
            </span>
          ))}
          {specimens.map((specimen) => (
            <SelectableCalendarCell
              key={specimen.identity}
              onSelect={onSelect}
              selected={selectedIdentity === specimen.identity}
              specimen={specimen}
              state={state}
            />
          ))}
        </div>
      </div>

      <div className="hito-calendar-grid-list">
        <MobileWorkoutLibrary
          onSelect={onSelect}
          selectedIdentity={selectedIdentity}
          specimens={specimens}
          state={state}
        />
      </div>
    </div>
  );
}

function MobileWorkoutLibrary({
  onSelect,
  selectedIdentity,
  specimens,
  state,
}: {
  onSelect: (identity: CanonicalWorkoutIdentity) => void;
  selectedIdentity: CanonicalWorkoutIdentity;
  specimens: readonly WorkoutLibrarySpecimen[];
  state: WorkoutLibraryState;
}) {
  return (
    <div className="grid min-w-0 gap-2">
      {specimens.map((specimen) => (
        <SelectableWorkoutRow
          key={specimen.identity}
          onSelect={onSelect}
          selected={selectedIdentity === specimen.identity}
          specimen={specimen}
          state={state}
        />
      ))}
    </div>
  );
}

function SelectableCalendarCell({
  onSelect,
  selected,
  specimen,
  state,
}: {
  onSelect: (identity: CanonicalWorkoutIdentity) => void;
  selected: boolean;
  specimen: WorkoutLibrarySpecimen;
  state: WorkoutLibraryState;
}) {
  const visual = getSpecimenVisualState(specimen, state);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={`Select ${specimen.displayLabel} specimen`}
      className="group block min-w-0 cursor-pointer text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-signal/50"
      onClick={() => onSelect(specimen.identity)}
      onKeyDown={(event) => handleSelectKeyDown(event, () => onSelect(specimen.identity))}
    >
      <HitoCalendarDayCell
        ariaLabel={`${specimen.date.month} ${specimen.date.day}: ${specimen.displayLabel}`}
        day={specimen.date.day}
        dense
        feedback={visual.feedback}
        interactive
        result={visual.result}
        selected={selected}
        state={visual.baseState}
        supportingText={specimen.date.month}
        title={specimen.detailTitle}
        weekday={specimen.date.weekday}
        workout={specimen.workout}
      />
    </div>
  );
}

function SelectableWorkoutRow({
  onSelect,
  selected,
  specimen,
  state,
}: {
  onSelect: (identity: CanonicalWorkoutIdentity) => void;
  selected: boolean;
  specimen: WorkoutLibrarySpecimen;
  state: WorkoutLibraryState;
}) {
  const visual = getSpecimenVisualState(specimen, state);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={`Select ${specimen.displayLabel} specimen`}
      className="group block min-w-0 cursor-pointer text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-signal/50"
      onClick={() => onSelect(specimen.identity)}
      onKeyDown={(event) => handleSelectKeyDown(event, () => onSelect(specimen.identity))}
    >
      <HitoWorkoutDayRow
        date={{
          eyebrow: specimen.date.month,
          day: specimen.date.day,
          meta: specimen.date.weekday,
        }}
        feedback={visual.feedback}
        interactive
        result={visual.result}
        selected={selected}
        state={visual.baseState}
        supportingText={`Internal: ${specimen.identity}`}
        title={specimen.detailTitle}
        workout={specimen.workout}
      />
    </div>
  );
}

function WorkoutDetailSpecimen({
  specimen,
  state,
}: {
  specimen: WorkoutLibrarySpecimen;
  state: WorkoutLibraryState;
}) {
  const provider = PROVIDER_STATE_COPY[state.providerState];
  const visual = getSpecimenVisualState(specimen, state);
  const providerAllowed = specimen.allowedProviderStates.includes(state.providerState);
  const resultAllowed = specimen.resultStates.includes(state.resultState);
  const visibleSegments =
    state.detailDensity === "compact" ? specimen.segments.slice(0, 3) : specimen.segments;
  const hiddenSegmentCount = specimen.segments.length - visibleSegments.length;

  return (
    <section className="min-w-0 border-t border-hairline pt-5">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3 border-b border-hairline pb-4">
        <div className="min-w-0">
          <p className="hito-label break-words [overflow-wrap:anywhere]">
            Internal: {specimen.family} / {specimen.identity}
          </p>
          <h3 className="hito-section-title mt-1">{specimen.detailTitle}</h3>
          <p className="hito-support-copy mt-2">{specimen.purpose}</p>
        </div>
        <span
          className="hito-status-pill"
          data-tone={provider.future ? "rollout" : providerAllowed ? "signal" : "muted"}
        >
          {provider.future ? <Icon name="sparkles" size="xs" decorative /> : null}
          {provider.future ? "Future specimen" : provider.label}
        </span>
      </div>

      <div className="grid gap-4 border-b border-hairline py-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <DetailFact label="Calendar label" value={specimen.calendarLabel} />
          <DetailFact label="Sequence" value={specimen.sequence} />
          <DetailFact
            label="Target truth"
            value={TARGET_TRUTH_MODE_COPY[specimen.targetTruthMode]}
          />
          <DetailFact
            label="Result visual"
            value={resultAllowed ? state.resultState : `${state.resultState} not expected here`}
          />
        </div>

        <div className="rounded-lg bg-foreground/[0.035] p-3">
          <p className="hito-label">Provider overlay</p>
          <p className="hito-list-row-copy mt-1">
            {provider.detail}
            {!providerAllowed
              ? " This overlay is not expected for this identity and is suppressed in the calendar marker."
              : ""}
          </p>
        </div>

        <div className="rounded-lg bg-foreground/[0.035] p-3">
          <p className="hito-label">Editable default HR note</p>
          <p className="hito-list-row-copy mt-1">
            {specimen.editableDefaultHrNote ?? "No editable default HR note for this specimen."}
          </p>
        </div>
      </div>

      <div className="border-b border-hairline py-4">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
          <p className="hito-label">Segments</p>
          <span className="hito-status-pill" data-tone="muted">
            {state.detailDensity === "compact" ? "Compact" : "Full"}
          </span>
        </div>
        {visibleSegments.length > 0 ? (
          <div className="mt-3 grid gap-2">
            {visibleSegments.map((segment) => (
              <div
                key={`${specimen.identity}-${segment.code}-${segment.prescription}`}
                className="hito-list-row items-start rounded-lg border-0 bg-foreground/[0.025] py-3"
              >
                <span className="hito-status-pill shrink-0" data-tone="neutral">
                  {segment.code}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="hito-list-row-title">{segment.label}</p>
                  <p className="hito-technical-mono mt-1 break-words text-foreground/80">
                    {segment.prescription}
                  </p>
                  <p className="hito-list-row-copy mt-1">{segment.cue}</p>
                </div>
              </div>
            ))}
            {hiddenSegmentCount > 0 ? (
              <p className="hito-caption">
                + {hiddenSegmentCount} more segment rows in full density.
              </p>
            ) : null}
          </div>
        ) : (
          <p className="hito-support-copy mt-3">
            No run segments. This is a true rest-day specimen.
          </p>
        )}
      </div>

      <div className="grid gap-3 pt-4 md:grid-cols-2">
        <BoundaryNote label="Proves" body={specimen.proves} icon="check-circle" />
        <BoundaryNote label="Must not imply" body={specimen.mustNotImply} icon="shield-alert" />
      </div>
      <p className="hito-caption mt-4">
        Calendar visual: {visual.result} / {visual.feedback}. No real upload, provider sync,
        comparison row, AI insight, plan creation, or workout mutation is performed.
      </p>
    </section>
  );
}

function DetailFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="hito-label">{label}</p>
      <p className="hito-technical-mono mt-1 break-words text-foreground/80">{value}</p>
    </div>
  );
}

function BoundaryNote({
  body,
  icon,
  label,
}: {
  body: string;
  icon: "check-circle" | "shield-alert";
  label: string;
}) {
  return (
    <div className="min-w-0 rounded-lg bg-foreground/[0.035] p-3">
      <p className="hito-label inline-flex items-center gap-2">
        <Icon name={icon} size="xs" decorative />
        {label}
      </p>
      <p className="hito-list-row-copy mt-2">{body}</p>
    </div>
  );
}

function ChoiceControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<WorkoutLibraryOption<T>>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="grid min-w-0 gap-2">
      <p className="hito-form-label">{label}</p>
      <div className="hito-choice-toggle-group" role="radiogroup" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className="hito-choice-toggle hito-choice-toggle-xs"
            aria-checked={value === option.value}
            data-selected={value === option.value}
            role="radio"
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SelectControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<WorkoutLibraryOption<T>>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="grid min-w-0 gap-2">
      <p className="hito-form-label">{label}</p>
      <Select value={value} onValueChange={(nextValue) => onChange(nextValue as T)}>
        <SelectTrigger aria-label={label} className="hito-field-sm min-w-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function getSpecimenVisualState(specimen: WorkoutLibrarySpecimen, state: WorkoutLibraryState) {
  const providerAllowed = specimen.allowedProviderStates.includes(state.providerState);
  const resultAllowed = specimen.resultStates.includes(state.resultState);
  const baseState: HitoCalendarDayBaseState = specimen.family === "rest" ? "rest" : "workout";

  return {
    baseState,
    feedback: providerAllowed ? PROVIDER_STATE_COPY[state.providerState].feedback : "none",
    result: resultAllowed ? state.resultState : "planned",
  };
}

function handleSelectKeyDown(event: KeyboardEvent<HTMLDivElement>, onSelect: () => void) {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  event.preventDefault();
  onSelect();
}

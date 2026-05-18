import { useRef, useState, type ReactNode, type RefObject } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Icon } from "@/components/ui/icon";
import {
  FUTURE_TEMPLATE_DOWNLOAD_PATH,
  summarizeImportedPlan,
  type ImportedPlan,
  validateImportedPlanJson,
} from "@/lib/imported-plan";
import type { FirstDayResolution } from "@/lib/plan-apply-policy";
import type { StructuredFirstPlanOnboardingInput } from "@/lib/structured-first-plan-onboarding";
import { completeOnboarding, completeStructuredFirstPlanOnboarding } from "@/lib/training-api";
import { cn } from "@/lib/utils";

type ConstructorStatus = "idle" | "saving" | "finishing";
type JsonStatus = "idle" | "parsing" | "saving" | "finishing";
type WeekdayName =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";
type BenchmarkKind = StructuredFirstPlanOnboardingInput["benchmark"]["kind"];
type GoalDistance = StructuredFirstPlanOnboardingInput["goal"]["goalDistance"];
type GoalStyle = StructuredFirstPlanOnboardingInput["goal"]["goalStyle"];
type TerrainFocus = StructuredFirstPlanOnboardingInput["goal"]["terrainFocus"];
type StrengthPreference = NonNullable<
  NonNullable<StructuredFirstPlanOnboardingInput["strength"]>["preference"]
>;

const WEEKDAY_OPTIONS: { value: WeekdayName; label: string }[] = [
  { value: "Monday", label: "Mon" },
  { value: "Tuesday", label: "Tue" },
  { value: "Wednesday", label: "Wed" },
  { value: "Thursday", label: "Thu" },
  { value: "Friday", label: "Fri" },
  { value: "Saturday", label: "Sat" },
  { value: "Sunday", label: "Sun" },
] as const;

const BENCHMARK_OPTIONS: { value: BenchmarkKind; label: string; copy: string }[] = [
  {
    value: "recent_5k_time",
    label: "Recent 5K time",
    copy: "Use a race or hard recent effort.",
  },
  {
    value: "recent_5k_pace",
    label: "Recent 5K pace",
    copy: "Useful if you remember pace, not finish time.",
  },
  {
    value: "unknown",
    label: "I do not know",
    copy: "Hito will start more conservatively.",
  },
];

const GOAL_DISTANCE_OPTIONS: { value: GoalDistance; label: string }[] = [
  { value: "build_consistency", label: "Build consistency" },
  { value: "5k", label: "5K" },
  { value: "10k", label: "10K" },
  { value: "half_marathon", label: "Half marathon" },
  { value: "marathon", label: "Marathon" },
  { value: "ultra_marathon", label: "Ultra marathon" },
  { value: "mountain_running", label: "Mountain running" },
];

const GOAL_STYLE_OPTIONS: { value: GoalStyle; label: string }[] = [
  { value: "relaxed", label: "Relaxed" },
  { value: "balanced", label: "Balanced" },
  { value: "ambitious", label: "Ambitious" },
  { value: "target_time", label: "Target time" },
];

const TERRAIN_OPTIONS: { value: TerrainFocus; label: string; copy: string }[] = [
  { value: "standard", label: "Standard", copy: "Roads, paths, or usual mixed terrain." },
  { value: "rolling", label: "Rolling", copy: "Some hills are welcome." },
  { value: "mountain", label: "Mountain", copy: "Prepare for sustained climbs or descents." },
];

const STRENGTH_OPTIONS: { value: StrengthPreference; label: string; copy: string }[] = [
  { value: "none", label: "None", copy: "Keep the plan running-only." },
  { value: "mobility", label: "Mobility", copy: "Add light mobility support where useful." },
  {
    value: "strength_mobility",
    label: "Strength / mobility support",
    copy: "Simple support only, not a detailed gym program.",
  },
];

export function OnboardingGate() {
  const completeStructuredFirstPlanOnboardingFn = useServerFn(
    completeStructuredFirstPlanOnboarding,
  );
  const completeOnboardingFn = useServerFn(completeOnboarding);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [jsonDraft, setJsonDraft] = useState("");
  const [importedPlan, setImportedPlan] = useState<ImportedPlan | null>(null);
  const [jsonStatus, setJsonStatus] = useState<JsonStatus>("idle");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);

  const isBusy = constructorStatus !== "idle" || jsonStatus !== "idle";
  const importedSummary = importedPlan ? summarizeImportedPlan(importedPlan) : null;
  const allowedRunningDayCount = WEEKDAY_OPTIONS.length - fixedRestDays.length;
  const runningDaysPerWeek = deriveRunningDaysPerWeek(fixedRestDays);
  const showsTargetFields = goalStyle === "target_time";
  const showsTerrainSelector = goalDistance === "marathon" || goalDistance === "ultra_marathon";
  const impliedMountainTerrain = goalDistance === "mountain_running";
  const effectiveTerrainFocus = resolveTerrainFocus(goalDistance, terrainFocus);
  const isConstructorReady = isStructuredConstructorReady({
    age,
    weightKg,
    heightCm,
    benchmarkKind,
    recent5kTime,
    recent5kPace,
    fixedRestDays,
    goalStyle,
    targetTime,
  });

  const validateJsonDraft = validateJsonDraftFactory({
    setJsonError,
    setFieldErrors,
    setImportedPlan,
    setJsonStatus,
  });

  const submitStructuredPlan = async () => {
    const inputResult = buildStructuredInput({
      age,
      weightKg,
      heightCm,
      benchmarkKind,
      recent5kTime,
      recent5kPace,
      runningDaysPerWeek,
      fixedRestDays,
      goalDistance,
      goalStyle,
      targetTime,
      targetDate,
      terrainFocus: effectiveTerrainFocus,
      strengthPreference,
      comment,
    });

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
    <section className="hito-surface mx-auto max-w-5xl p-6 lg:p-10">
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

      <form
        className="mt-8 grid gap-8"
        onSubmit={(event) => {
          event.preventDefault();
          if (!isConstructorReady || isBusy) {
            return;
          }

          void submitStructuredPlan();
        }}
      >
        <ConstructorSection
          eyebrow="01"
          title="Profile basics"
          body="Required for first-plan generation. These are the only profile fields saved from this constructor."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Age" helper="Required, years. Range 13-100.">
              <input
                type="number"
                inputMode="numeric"
                min={13}
                max={100}
                step={1}
                required
                value={age}
                onChange={(event) => setAge(event.target.value)}
                placeholder="34"
                className="hito-field hito-field-primary hito-field-md"
              />
            </Field>
            <Field label="Weight" helper="Required, kg. Range 30-250.">
              <input
                type="number"
                inputMode="decimal"
                min={30}
                max={250}
                step={0.5}
                required
                value={weightKg}
                onChange={(event) => setWeightKg(event.target.value)}
                placeholder="72.0"
                className="hito-field hito-field-primary hito-field-md"
              />
            </Field>
            <Field label="Height" helper="Required, cm. Range 120-230.">
              <input
                type="number"
                inputMode="numeric"
                min={120}
                max={230}
                step={1}
                required
                value={heightCm}
                onChange={(event) => setHeightCm(event.target.value)}
                placeholder="178"
                className="hito-field hito-field-primary hito-field-md"
              />
            </Field>
          </div>
        </ConstructorSection>

        <ConstructorSection
          eyebrow="02"
          title="Current fitness benchmark"
          body="Use one recent 5K signal if you know it. If not, Hito starts from availability and goal style."
        >
          <div className="grid gap-2">
            {BENCHMARK_OPTIONS.map((option) => (
              <OptionRow
                key={option.value}
                active={benchmarkKind === option.value}
                label={option.label}
                copy={option.copy}
                onClick={() => setBenchmarkKind(option.value)}
              />
            ))}
          </div>

          {benchmarkKind === "recent_5k_time" && (
            <Field label="Recent 5K time" helper="Use a format like 25:00 or 1:02:30.">
              <input
                value={recent5kTime}
                onChange={(event) => setRecent5kTime(event.target.value)}
                placeholder="25:00"
                className="hito-field hito-field-primary hito-field-md"
              />
            </Field>
          )}

          {benchmarkKind === "recent_5k_pace" && (
            <Field label="Recent 5K pace" helper="Use a format like 5:30/km.">
              <input
                value={recent5kPace}
                onChange={(event) => setRecent5kPace(event.target.value)}
                placeholder="5:30/km"
                className="hito-field hito-field-primary hito-field-md"
              />
            </Field>
          )}
        </ConstructorSection>

        <ConstructorSection
          eyebrow="03"
          title="Availability"
          body="Mark fixed rest days only. Hito will fit a conservative first schedule around the available weekdays."
        >
          <Field
            label="Fixed rest days"
            helper={
              allowedRunningDayCount > 0
                ? `Hito will use up to ${runningDaysPerWeek} running days outside fixed rest days.`
                : "Leave at least one day available for running."
            }
          >
            <div className="grid grid-cols-7 gap-1.5 rounded-[1.25rem] bg-muted/20 p-1.5">
              {WEEKDAY_OPTIONS.map((weekday) => {
                const active = fixedRestDays.includes(weekday.value);
                return (
                  <button
                    key={weekday.value}
                    type="button"
                    onClick={() => {
                      setFixedRestDays((current) =>
                        active
                          ? current.filter((item) => item !== weekday.value)
                          : [...current, weekday.value],
                      );
                    }}
                    className={cn(
                      "hito-button hito-button-xs min-w-0 px-0",
                      active ? "hito-button-primary" : "hito-button-ghost",
                    )}
                    aria-pressed={active}
                    aria-label={`${weekday.value}${active ? " fixed rest day" : ""}`}
                  >
                    {weekday.label}
                  </button>
                );
              })}
            </div>
          </Field>
        </ConstructorSection>

        <ConstructorSection
          eyebrow="04"
          title="Goal"
          body="Pick the destination and tone. Target time only becomes required when you choose target-time style."
        >
          <Field label="Goal distance">
            <OptionGrid>
              {GOAL_DISTANCE_OPTIONS.map((option) => (
                <OptionButton
                  key={option.value}
                  active={goalDistance === option.value}
                  label={option.label}
                  onClick={() => setGoalDistance(option.value)}
                />
              ))}
            </OptionGrid>
          </Field>

          <Field label="Goal style">
            <OptionGrid>
              {GOAL_STYLE_OPTIONS.map((option) => (
                <OptionButton
                  key={option.value}
                  active={goalStyle === option.value}
                  label={option.label}
                  onClick={() => setGoalStyle(option.value)}
                />
              ))}
            </OptionGrid>
          </Field>

          {showsTargetFields ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Target time" helper="Required. Use 25:00 or 1:45:00.">
                <input
                  value={targetTime}
                  onChange={(event) => setTargetTime(event.target.value)}
                  placeholder="1:45:00"
                  required
                  className={cn(
                    "hito-field hito-field-primary hito-field-md",
                    !targetTime.trim() && "hito-field-feedback-error",
                  )}
                />
              </Field>
              <Field label="Target date" helper="Optional. If used, choose at least 7 days out.">
                <input
                  type="date"
                  value={targetDate}
                  onChange={(event) => setTargetDate(event.target.value)}
                  className="hito-field hito-field-primary hito-field-md"
                />
              </Field>
            </div>
          ) : (
            <p className="hito-field-helper">
              Hito will estimate a realistic direction from your benchmark, availability, and goal
              style. No target time is needed for this mode.
            </p>
          )}

          {showsTerrainSelector && (
            <Field label="Terrain focus">
              <OptionGrid>
                {TERRAIN_OPTIONS.map((option) => (
                  <OptionButton
                    key={option.value}
                    active={terrainFocus === option.value}
                    label={option.label}
                    copy={option.copy}
                    onClick={() => setTerrainFocus(option.value)}
                  />
                ))}
              </OptionGrid>
            </Field>
          )}

          {impliedMountainTerrain && (
            <div className="hito-row-group">
              <div className="hito-list-row">
                <div>
                  <p className="hito-list-row-title">Mountain terrain</p>
                  <p className="hito-list-row-copy">
                    Mountain running uses mountain terrain context automatically.
                  </p>
                </div>
                <span className="hito-status-pill">Implied</span>
              </div>
            </div>
          )}
        </ConstructorSection>

        <ConstructorSection
          eyebrow="05"
          title="Strength / mobility support"
          body="The running plan remains primary. This only allows simple support notes, not a detailed gym program."
        >
          <div className="grid gap-2">
            {STRENGTH_OPTIONS.map((option) => (
              <OptionRow
                key={option.value}
                active={strengthPreference === option.value}
                label={option.label}
                copy={option.copy}
                onClick={() => setStrengthPreference(option.value)}
              />
            ))}
          </div>
        </ConstructorSection>

        <ConstructorSection
          eyebrow="06"
          title="Optional comment"
          body="Supporting context only. Hito will not treat this as a free-text plan prompt."
        >
          <label className="grid gap-2">
            <span className="hito-form-label">Comment</span>
            <textarea
              rows={5}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Right knee discomfort, avoid intensity, prefer mornings, conservative plan..."
              className="hito-field hito-field-secondary hito-textarea-md resize-y"
            />
          </label>
        </ConstructorSection>

        <div className="sticky bottom-0 z-20 -mx-6 mt-2 border-t border-hairline bg-background/90 px-6 py-4 backdrop-blur lg:-mx-10 lg:px-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              {constructorError ? <p className="hito-field-error">{constructorError}</p> : null}
              {constructorStatus === "finishing" ? (
                <p className="hito-field-success">Your plan is ready. Opening it now...</p>
              ) : null}
              {!constructorError && constructorStatus !== "finishing" ? (
                <p className="hito-field-helper max-w-xl">
                  Fixed rest days stay authoritative after the plan is created.
                </p>
              ) : null}
            </div>
            <button
              type="submit"
              disabled={isBusy || !isConstructorReady}
              className="hito-button hito-button-primary hito-button-lg shrink-0"
            >
              {constructorStatus === "saving"
                ? "Creating your plan..."
                : constructorStatus === "finishing"
                  ? "Opening your plan..."
                  : "Create plan"}
            </button>
          </div>
        </div>
      </form>

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
            importedSummary={importedSummary}
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

function ConstructorSection({
  eyebrow,
  title,
  body,
  children,
}: {
  eyebrow: string;
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <section className="hito-section-divider grid gap-4 pt-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <div>
        <p className="hito-micro-label">{eyebrow}</p>
        <h2 className="hito-panel-title mt-2">{title}</h2>
        <p className="hito-helper mt-2">{body}</p>
      </div>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <span className="hito-form-label">{label}</span>
      {children}
      {helper ? <span className="hito-field-helper">{helper}</span> : null}
    </div>
  );
}

function OptionGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

function OptionButton({
  active,
  label,
  copy,
  onClick,
}: {
  active: boolean;
  label: string;
  copy?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "hito-button hito-button-sm min-h-16 justify-start whitespace-normal text-left",
        active ? "hito-button-primary" : "hito-button-secondary",
      )}
    >
      <span>
        <span className="block">{label}</span>
        {copy ? (
          <span className="mt-1 block text-xs normal-case tracking-normal">{copy}</span>
        ) : null}
      </span>
    </button>
  );
}

function OptionRow({
  active,
  label,
  copy,
  onClick,
}: {
  active: boolean;
  label: string;
  copy?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "hito-button hito-button-md min-h-14 w-full justify-between whitespace-normal text-left",
        active ? "hito-button-primary" : "hito-button-secondary",
      )}
    >
      <span className="min-w-0">
        <span className="block">{label}</span>
        {copy ? <span className="mt-1 block hito-field-helper text-current/75">{copy}</span> : null}
      </span>
      {active ? <Icon name="check" size="sm" /> : null}
    </button>
  );
}

function JsonImportPanel({
  fileInputRef,
  selectedFileName,
  setSelectedFileName,
  jsonDraft,
  setJsonDraft,
  importedSummary,
  fieldErrors,
  jsonError,
  jsonStatus,
  importedPlan,
  isBusy,
  validateJsonDraft,
  submitImportedPlan,
  setImportedPlan,
  setFieldErrors,
  setJsonError,
  setJsonStatus,
}: {
  fileInputRef: RefObject<HTMLInputElement | null>;
  selectedFileName: string | null;
  setSelectedFileName: (value: string | null) => void;
  jsonDraft: string;
  setJsonDraft: (value: string) => void;
  importedSummary: ReturnType<typeof summarizeImportedPlan> | null;
  fieldErrors: string[];
  jsonError: string | null;
  jsonStatus: JsonStatus;
  importedPlan: ImportedPlan | null;
  isBusy: boolean;
  validateJsonDraft: (raw: string) => void;
  submitImportedPlan: (firstDayResolution: FirstDayResolution | null) => Promise<void>;
  setImportedPlan: (value: ImportedPlan | null) => void;
  setFieldErrors: (value: string[]) => void;
  setJsonError: (value: string | null) => void;
  setJsonStatus: (value: JsonStatus) => void;
}) {
  return (
    <div className="grid gap-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          setImportedPlan(null);
          setFieldErrors([]);
          setJsonError(null);

          if (!file) {
            setSelectedFileName(null);
            return;
          }

          setSelectedFileName(file.name);

          try {
            const raw = await file.text();
            setJsonDraft(raw);
            validateJsonDraft(raw);
          } catch {
            setFieldErrors([]);
            setJsonStatus("idle");
            setJsonError("The file could not be read as valid JSON.");
          }
        }}
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={isBusy}
          onClick={() => fileInputRef.current?.click()}
          className="hito-button hito-button-secondary hito-button-md"
        >
          <Icon name="upload" size="sm" />
          {selectedFileName ? "Choose another file" : "Upload file"}
        </button>
        {selectedFileName && <span className="hito-body-small">{selectedFileName}</span>}
      </div>

      <details className="hito-disclosure">
        <summary className="hito-disclosure-summary">
          <span>Paste JSON or download a template</span>
          <Icon name="chevron-down" className="hito-disclosure-chevron" />
        </summary>
        <div className="hito-disclosure-body">
          <div>
            <a
              href={FUTURE_TEMPLATE_DOWNLOAD_PATH}
              download
              className="hito-button hito-button-ghost hito-button-sm"
            >
              <Icon name="download" size="sm" className="text-signal" />
              Download JSON template
            </a>
          </div>
          <label className="grid gap-2">
            <span className="hito-form-label">Paste plan JSON</span>
            <textarea
              rows={10}
              value={jsonDraft}
              onChange={(event) => {
                setJsonDraft(event.target.value);
                setImportedPlan(null);
                setFieldErrors([]);
                setJsonError(null);
              }}
              placeholder='{"schema_version":"training-plan-v2","plan_name":"...","generated_for":"...","start_date":"...","planned_workouts":[...]}'
              className="hito-field hito-field-primary hito-textarea-md hito-technical-mono"
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={isBusy || !jsonDraft.trim()}
              onClick={() => validateJsonDraft(jsonDraft)}
              className="hito-button hito-button-secondary hito-button-md"
            >
              Check JSON
            </button>
            <span className="hito-field-helper">Only Hito plan JSON works here.</span>
          </div>
        </div>
      </details>

      {importedSummary && (
        <div className="hito-row-group">
          <div className="hito-list-row">
            <div>
              <p className="hito-list-row-title">Ready to import</p>
              <p className="hito-list-row-copy">
                {importedSummary.days} days, {importedSummary.workouts} workouts from{" "}
                {importedSummary.contractLabel}.
              </p>
            </div>
            <span className="hito-status-pill" data-tone="success">
              Valid
            </span>
          </div>
        </div>
      )}

      {fieldErrors.length > 0 && (
        <div className="hito-row-group">
          <div className="hito-list-row items-start">
            <div>
              <p className="hito-label text-destructive">JSON issues</p>
              <div className="mt-2 space-y-1">
                {fieldErrors.slice(0, 5).map((issue) => (
                  <p key={issue} className="hito-field-error">
                    {issue}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {jsonError && <p className="hito-field-error">{jsonError}</p>}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="button"
          disabled={isBusy || !importedPlan}
          onClick={() => {
            void submitImportedPlan(null);
          }}
          className="hito-button hito-button-primary hito-button-md"
        >
          {jsonStatus === "parsing"
            ? "Checking JSON..."
            : jsonStatus === "saving"
              ? "Importing plan..."
              : jsonStatus === "finishing"
                ? "Opening your plan..."
                : "Import plan"}
        </button>
      </div>

      <p className="hito-field-helper max-w-2xl">
        Import plan keeps today's workout and starts the new plan tomorrow.
      </p>

      <details className="hito-disclosure max-w-2xl">
        <summary className="hito-disclosure-summary">
          <span>Need this file to replace today?</span>
          <Icon name="chevron-down" className="hito-disclosure-chevron" />
        </summary>
        <div className="hito-disclosure-body">
          <p className="hito-field-helper">
            Replace today only if the file's first workout should overwrite today's planned workout.
          </p>
          <div>
            <button
              type="button"
              disabled={isBusy || !importedPlan}
              data-tone="error"
              onClick={() => {
                void submitImportedPlan("replace_first_day");
              }}
              className="hito-button hito-button-outlined hito-button-sm"
            >
              {jsonStatus === "saving" ? "Replacing today..." : "Replace today"}
            </button>
          </div>
        </div>
      </details>
    </div>
  );
}

function buildStructuredInput({
  age,
  weightKg,
  heightCm,
  benchmarkKind,
  recent5kTime,
  recent5kPace,
  runningDaysPerWeek,
  fixedRestDays,
  goalDistance,
  goalStyle,
  targetTime,
  targetDate,
  terrainFocus,
  strengthPreference,
  comment,
}: {
  age: string;
  weightKg: string;
  heightCm: string;
  benchmarkKind: BenchmarkKind;
  recent5kTime: string;
  recent5kPace: string;
  runningDaysPerWeek: number;
  fixedRestDays: WeekdayName[];
  goalDistance: GoalDistance;
  goalStyle: GoalStyle;
  targetTime: string;
  targetDate: string;
  terrainFocus: TerrainFocus;
  strengthPreference: StrengthPreference;
  comment: string;
}): { ok: true; input: StructuredFirstPlanOnboardingInput } | { ok: false; error: string } {
  const profileNumbers = {
    age: requiredNumber(age, "Age", { min: 13, max: 100, integer: true }),
    weightKg: requiredNumber(weightKg, "Weight", { min: 30, max: 250, increment: 0.5 }),
    heightCm: requiredNumber(heightCm, "Height", { min: 120, max: 230, integer: true }),
  };

  const invalidNumber = Object.values(profileNumbers).find((value) => !value.ok);

  if (invalidNumber?.ok === false) {
    return invalidNumber;
  }

  if (fixedRestDays.length >= WEEKDAY_OPTIONS.length) {
    return {
      ok: false,
      error: "Leave at least one weekday available for running.",
    };
  }

  if (runningDaysPerWeek > 7 - fixedRestDays.length) {
    return {
      ok: false,
      error: "Running days per week must fit outside the fixed rest days.",
    };
  }

  const trimmed5kTime = recent5kTime.trim();
  const trimmed5kPace = recent5kPace.trim();
  const trimmedTargetTime = targetTime.trim();
  const trimmedTargetDate = targetDate.trim();
  const trimmedComment = comment.trim();

  if (benchmarkKind === "recent_5k_time" && !trimmed5kTime) {
    return { ok: false, error: "Add a recent 5K time or choose I do not know." };
  }

  if (benchmarkKind === "recent_5k_pace" && !trimmed5kPace) {
    return { ok: false, error: "Add a recent 5K pace or choose I do not know." };
  }

  if (goalStyle === "target_time" && !trimmedTargetTime) {
    return { ok: false, error: "Target time is required when goal style is target time." };
  }

  return {
    ok: true,
    input: {
      profile: {
        age: profileNumbers.age.value,
        weightKg: profileNumbers.weightKg.value,
        heightCm: profileNumbers.heightCm.value,
      },
      benchmark:
        benchmarkKind === "recent_5k_time"
          ? {
              kind: "recent_5k_time",
              recent5kTime: trimmed5kTime,
              recent5kPace: null,
            }
          : benchmarkKind === "recent_5k_pace"
            ? {
                kind: "recent_5k_pace",
                recent5kPace: trimmed5kPace,
                recent5kTime: null,
              }
            : {
                kind: "unknown",
                recent5kTime: null,
                recent5kPace: null,
              },
      availability: {
        runningDaysPerWeek,
        fixedRestDays,
      },
      goal: {
        goalDistance,
        goalStyle,
        terrainFocus,
        targetTime: goalStyle === "target_time" ? trimmedTargetTime : null,
        targetDate: goalStyle === "target_time" ? trimmedTargetDate || null : null,
      },
      strength: {
        preference: strengthPreference,
      },
      comment: trimmedComment || null,
    },
  };
}

function requiredNumber(
  value: string,
  label: string,
  options: {
    min: number;
    max: number;
    integer?: boolean;
    increment?: number;
  },
):
  | { ok: true; value: number }
  | {
      ok: false;
      error: string;
    } {
  const trimmed = value.trim();

  if (!trimmed) {
    return { ok: false, error: `${label} is required.` };
  }

  const parsed = Number(trimmed);

  if (!Number.isFinite(parsed)) {
    return { ok: false, error: `${label} should be a number.` };
  }

  if (options.integer && !Number.isInteger(parsed)) {
    return { ok: false, error: `${label} must be a whole number.` };
  }

  if (parsed < options.min || parsed > options.max) {
    return { ok: false, error: `${label} must be between ${options.min} and ${options.max}.` };
  }

  if (options.increment && !Number.isInteger(parsed / options.increment)) {
    return { ok: false, error: `${label} must use ${options.increment} increments.` };
  }

  return { ok: true, value: parsed };
}

function deriveRunningDaysPerWeek(fixedRestDays: WeekdayName[]) {
  const allowedDayCount = WEEKDAY_OPTIONS.length - fixedRestDays.length;

  return Math.min(4, Math.max(1, allowedDayCount));
}

function resolveTerrainFocus(goalDistance: GoalDistance, terrainFocus: TerrainFocus) {
  if (goalDistance === "mountain_running") {
    return "mountain";
  }

  if (goalDistance === "marathon" || goalDistance === "ultra_marathon") {
    return terrainFocus ?? "standard";
  }

  return "standard";
}

function isStructuredConstructorReady({
  age,
  weightKg,
  heightCm,
  benchmarkKind,
  recent5kTime,
  recent5kPace,
  fixedRestDays,
  goalStyle,
  targetTime,
}: {
  age: string;
  weightKg: string;
  heightCm: string;
  benchmarkKind: BenchmarkKind;
  recent5kTime: string;
  recent5kPace: string;
  fixedRestDays: WeekdayName[];
  goalStyle: GoalStyle;
  targetTime: string;
}) {
  const profileComplete =
    requiredNumber(age, "Age", { min: 13, max: 100, integer: true }).ok &&
    requiredNumber(weightKg, "Weight", { min: 30, max: 250, increment: 0.5 }).ok &&
    requiredNumber(heightCm, "Height", { min: 120, max: 230, integer: true }).ok;
  const benchmarkComplete =
    benchmarkKind === "unknown" ||
    (benchmarkKind === "recent_5k_time" && Boolean(recent5kTime.trim())) ||
    (benchmarkKind === "recent_5k_pace" && Boolean(recent5kPace.trim()));
  const hasTrainingDay = fixedRestDays.length < WEEKDAY_OPTIONS.length;
  const targetComplete = goalStyle !== "target_time" || Boolean(targetTime.trim());

  return profileComplete && benchmarkComplete && hasTrainingDay && targetComplete;
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

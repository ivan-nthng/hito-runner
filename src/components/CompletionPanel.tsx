import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, MinusCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { saveWorkoutLog } from "@/lib/training-api";
import type { TrainingSnapshot, Workout } from "@/lib/training";
import { WEEK_STATUS_META, workoutDistanceKm, workoutDuration } from "@/lib/training";

type Outcome = "completed" | "partial" | "skipped";

export function CompletionPanel({
	workout,
	snapshot,
}: {
	workout: Workout;
	snapshot: TrainingSnapshot;
}) {
	const router = useRouter();
	const saveWorkoutLogFn = useServerFn(saveWorkoutLog);
	const [outcome, setOutcome] = useState<Outcome>(workout.log?.outcome ?? "completed");
	const [rpe, setRpe] = useState(workout.log?.rpe ?? 6);
	const [notes, setNotes] = useState(workout.log?.notes ?? "");
	const [isSaving, setIsSaving] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const plannedKm = workoutDistanceKm(workout) ?? 0;
	const plannedMin = workoutDuration(workout);

	const [actualKm, setActualKm] = useState(
		workout.log?.actualDistanceKm?.toString() ?? plannedKm.toString(),
	);
	const [actualMin, setActualMin] = useState(
		workout.log?.actualDurationMin?.toString() ?? plannedMin.toString(),
	);
	const [intervalsCompleted, setIntervalsCompleted] = useState(
		workout.log?.intervalsCompleted ?? workout.steps.find((step) => step.repeats)?.repeats ?? 0,
	);
	const hasSavedLog = snapshot.source === "persisted" && Boolean(workout.log);
	const serverDraft = {
		outcome: workout.log?.outcome ?? "completed",
		actualKm: workout.log?.actualDistanceKm?.toString() ?? plannedKm.toString(),
		actualMin: workout.log?.actualDurationMin?.toString() ?? plannedMin.toString(),
		rpe: workout.log?.rpe ?? 6,
		notes: workout.log?.notes ?? "",
		intervalsCompleted:
			workout.log?.intervalsCompleted ??
			workout.steps.find((step) => step.repeats)?.repeats ??
			0,
	};
	const isDirty =
		outcome !== serverDraft.outcome ||
		actualKm !== serverDraft.actualKm ||
		actualMin !== serverDraft.actualMin ||
		rpe !== serverDraft.rpe ||
		notes !== serverDraft.notes ||
		intervalsCompleted !== serverDraft.intervalsCompleted;
	const weekStatus = WEEK_STATUS_META[snapshot.weekStatus];

	return (
		<div className="space-y-8">
			<div
				className={cn(
					"rounded-xl border p-4",
					error
						? "border-destructive/30 bg-destructive/10"
						: message
							? "border-success/30 bg-success/10"
							: hasSavedLog
								? "border-success/20 bg-background/35"
								: "border-hairline bg-background/35",
				)}
			>
				<div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
					{error
						? "Save failed"
						: message
							? "Saved feedback"
							: snapshot.source === "persisted"
								? hasSavedLog
									? "Saved result"
									: "Ready to save"
								: "Preview only"}
				</div>
				<p className="mt-2 text-sm text-foreground/85 leading-relaxed">
					{error
						? error
						: message
							? message
							: snapshot.source === "persisted"
								? hasSavedLog
									? `This workout already has a saved ${workout.log?.outcome} result. ${
											workout.log?.loggedAt
												? `Last updated ${formatLoggedAt(workout.log.loggedAt)}.`
												: "Backend truth is already available for this day."
										}`
									: "Saving here writes the canonical workout log and updates the visible week status from backend truth."
								: "You can try the flow here, but preview mode does not persist workout history."}
				</p>
				<div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
					<span>
						Week status <span className="text-foreground/80">{weekStatus.label}</span>
					</span>
					<span className="opacity-50">·</span>
					<span>
						{snapshot.source === "persisted"
							? hasSavedLog && isDirty
								? "Unsaved edits"
								: hasSavedLog
									? "Backend confirmed"
									: "Waiting for first save"
							: "Local draft only"}
					</span>
				</div>
			</div>

			<div>
				<Label>How did it go?</Label>
				<div className="mt-3 grid grid-cols-3 gap-2">
					{(
						[
							{
								v: "completed",
								icon: CheckCircle2,
								label: "Complete",
								c: "var(--success)",
							},
							{ v: "partial", icon: MinusCircle, label: "Partial", c: "var(--warn)" },
							{
								v: "skipped",
								icon: XCircle,
								label: "Skipped",
								c: "var(--destructive)",
							},
						] as const
					).map((option) => {
						const Icon = option.icon;
						const active = outcome === option.v;
						return (
							<button
								key={option.v}
								type="button"
								onClick={() => setOutcome(option.v)}
								className={cn(
									"flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all",
									active
										? "border-foreground/30 bg-accent/40"
										: "border-hairline hover:bg-accent/30",
								)}
							>
								<Icon
									className="h-4 w-4"
									strokeWidth={1.5}
									style={{ color: active ? option.c : undefined }}
								/>
								<span className="text-sm">{option.label}</span>
							</button>
						);
					})}
				</div>
			</div>

			<div>
				<Label>Planned vs actual</Label>
				<div className="mt-3 grid grid-cols-2 gap-3">
					<NumField
						label="Distance"
						suffix="km"
						planned={plannedKm.toString()}
						value={actualKm}
						onChange={setActualKm}
					/>
					<NumField
						label="Duration"
						suffix="min"
						planned={plannedMin.toString()}
						value={actualMin}
						onChange={setActualMin}
					/>
				</div>

				{workout.steps.some((step) => step.repeats) && (
					<div className="mt-4 rounded-lg border border-hairline p-3">
						<div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
							Intervals completed
						</div>
						<div className="flex gap-1.5">
							{Array.from({
								length: workout.steps.find((step) => step.repeats)?.repeats ?? 0,
							}).map((_, index) => (
								<button
									key={index}
									type="button"
									onClick={() => setIntervalsCompleted(index + 1)}
									className={cn(
										"flex-1 h-8 rounded border text-[10px] font-mono-num",
										index < intervalsCompleted
											? "bg-quality/30 border-quality/40 text-foreground"
											: "border-hairline text-muted-foreground",
									)}
								>
									{index + 1}
								</button>
							))}
						</div>
						<p className="mt-2 text-[11px] text-muted-foreground">
							Tap to mark how many reps were completed.
						</p>
					</div>
				)}
			</div>

			<div className="grid sm:grid-cols-1 gap-5">
				<Slider
					label="Effort (RPE)"
					value={rpe}
					max={10}
					onChange={setRpe}
					hint={`${rpe}/10`}
				/>
			</div>

			<div>
				<Label>Notes</Label>
				<textarea
					rows={3}
					value={notes}
					onChange={(event) => setNotes(event.target.value)}
					placeholder="Felt strong on the climb, slight tightness in right calf at km 6…"
					className="mt-3 w-full rounded-lg border border-hairline bg-background/50 p-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/30 resize-none"
				/>
				<p className="mt-3 text-[11px] text-muted-foreground">
					{snapshot.source === "persisted"
						? "Saving here upserts the canonical workout log and recomputes the visible week status from backend truth."
						: "Preview only. This form keeps the imported interaction pattern, but saved results are not persisted or synced yet."}
				</p>
			</div>

			<div className="flex flex-wrap items-center gap-3 pt-4 border-t border-hairline">
				<button
					type="button"
					onClick={async () => {
						if (snapshot.source !== "persisted") {
							setMessage(
								"Preview form updated locally. Sign in to save backend truth.",
							);
							setError(null);
							return;
						}

						setIsSaving(true);
						setMessage(null);
						setError(null);

						try {
							await saveWorkoutLogFn({
								data: {
									plannedWorkoutId: workout.id,
									outcome,
									actualDistanceKm: actualKm ? Number(actualKm) : null,
									actualDurationMin: actualMin ? Number(actualMin) : null,
									rpe,
									notes: notes.trim() || null,
									intervalsCompleted: workout.steps.some((step) => step.repeats)
										? intervalsCompleted
										: null,
								},
							});
							setMessage(
								`Saved to your plan. ${weekStatus.label} now reflects the latest backend state after refresh.`,
							);
							await router.invalidate();
						} catch (saveError) {
							setError(
								saveError instanceof Error
									? saveError.message
									: "Could not save log.",
							);
						} finally {
							setIsSaving(false);
						}
					}}
					className="rounded-md bg-signal text-signal-foreground px-5 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-60"
					disabled={isSaving || (hasSavedLog && !isDirty)}
				>
					{snapshot.source !== "persisted"
						? "Preview result"
						: isSaving
							? "Saving result..."
							: hasSavedLog && !isDirty
								? "Saved result"
								: hasSavedLog
									? "Save changes"
									: "Save result"}
				</button>
				<span className="ml-auto text-[11px] text-muted-foreground">
					{snapshot.source === "persisted"
						? "Current phase keeps one canonical persisted backend contract."
						: "Current phase keeps one local preview form and one preview seam."}
				</span>
			</div>
		</div>
	);
}

function Label({ children }: { children: React.ReactNode }) {
	return (
		<div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
			{children}
		</div>
	);
}

function NumField({
	label,
	suffix,
	planned,
	value,
	onChange,
}: {
	label: string;
	suffix: string;
	planned: string;
	value: string;
	onChange: (value: string) => void;
}) {
	return (
		<div className="rounded-lg border border-hairline p-3">
			<div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
				<span>{label}</span>
				<span>plan {planned}</span>
			</div>
			<div className="mt-1 flex items-baseline gap-2">
				<input
					value={value}
					onChange={(event) => onChange(event.target.value)}
					className="bg-transparent font-display text-2xl w-full focus:outline-none"
				/>
				<span className="text-xs text-muted-foreground">{suffix}</span>
			</div>
		</div>
	);
}

function Slider({
	label,
	value,
	max,
	onChange,
	hint,
}: {
	label: string;
	value: number;
	max: number;
	onChange: (value: number) => void;
	hint: string;
}) {
	return (
		<div>
			<div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
				<span>{label}</span>
				<span className="text-foreground/80">{hint}</span>
			</div>
			<div className="mt-2 flex gap-1">
				{Array.from({ length: max }).map((_, index) => (
					<button
						key={index}
						type="button"
						onClick={() => onChange(index + 1)}
						className={cn(
							"h-2 flex-1 rounded-full transition-colors",
							index < value ? "bg-foreground" : "bg-hairline",
						)}
					/>
				))}
			</div>
		</div>
	);
}

function formatLoggedAt(value: string) {
	return new Date(value).toLocaleString("en-US", {
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});
}

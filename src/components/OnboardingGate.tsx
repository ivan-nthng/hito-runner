import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { completeOnboarding } from "@/lib/training-api";

const GOALS = [
	{ value: "build_consistency", label: "Build consistency" },
	{ value: "first_race", label: "Finish a first race" },
	{ value: "distance_build", label: "Build distance" },
] as const;

export function OnboardingGate() {
	const router = useRouter();
	const completeOnboardingFn = useServerFn(completeOnboarding);
	const [step, setStep] = useState<1 | 2>(1);
	const [goalType, setGoalType] = useState<(typeof GOALS)[number]["value"]>("build_consistency");
	const [baselineSessionsPerWeek, setBaselineSessionsPerWeek] = useState("3");
	const [baselineLongRunKm, setBaselineLongRunKm] = useState("8");
	const [baselineNotes, setBaselineNotes] = useState("");
	const [status, setStatus] = useState<"idle" | "saving" | "finishing">("idle");
	const [error, setError] = useState<string | null>(null);
	const [fieldError, setFieldError] = useState<string | null>(null);

	const isSaving = status !== "idle";

	return (
		<section className="mx-auto max-w-3xl rounded-2xl border border-hairline bg-gradient-to-br from-surface-elevated to-surface p-6 lg:p-10">
			<div className="max-w-2xl">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
						Profile setup
					</p>
					<p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
						Step {step} of 2
					</p>
				</div>
				<h1 className="mt-3 font-display text-4xl lg:text-5xl leading-[1.05]">
					Set up your first running plan
				</h1>
				<p className="mt-4 text-sm text-muted-foreground leading-relaxed">
					Tell Hito Running what you are training toward and where you are starting from.
					We will use that to create one saved runner profile and one active plan cycle
					without changing the imported weekly-plan baseline.
				</p>
				<div className="mt-6 grid grid-cols-2 gap-2">
					<div
						className={`h-1 rounded-full ${step >= 1 ? "bg-signal" : "bg-hairline"}`}
					/>
					<div
						className={`h-1 rounded-full ${step >= 2 ? "bg-signal" : "bg-hairline"}`}
					/>
				</div>
			</div>

			<form
				className="mt-10 grid gap-6"
				onSubmit={async (event) => {
					event.preventDefault();
					setError(null);
					setFieldError(null);

					if (step === 1) {
						setStep(2);
						return;
					}

					const sessions = Number(baselineSessionsPerWeek);
					const longRun = Number(baselineLongRunKm);

					if (!Number.isFinite(sessions) || sessions < 0 || sessions > 7) {
						setFieldError(
							"Enter a realistic weekly running frequency between 0 and 7.",
						);
						return;
					}

					if (!Number.isFinite(longRun) || longRun < 0 || longRun > 80) {
						setFieldError("Enter a recent long run distance between 0 and 80 km.");
						return;
					}

					setStatus("saving");

					try {
						await completeOnboardingFn({
							data: {
								goalType,
								baselineSessionsPerWeek: sessions,
								baselineLongRunKm: longRun,
								baselineNotes: baselineNotes.trim() || null,
							},
						});
						setStatus("finishing");
						await router.invalidate();
					} catch (submitError) {
						setStatus("idle");
						setError(
							submitError instanceof Error
								? submitError.message
								: "Could not save setup.",
						);
					}
				}}
			>
				{step === 1 ? (
					<>
						<div className="grid gap-3">
							<label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
								What are you training toward?
							</label>
							<div className="grid gap-2 sm:grid-cols-3">
								{GOALS.map((goal) => (
									<button
										key={goal.value}
										type="button"
										onClick={() => setGoalType(goal.value)}
										className={`rounded-xl border px-4 py-4 text-left transition-colors ${
											goalType === goal.value
												? "border-foreground/30 bg-accent/40"
												: "border-hairline hover:bg-accent/30"
										}`}
									>
										<div className="text-sm">{goal.label}</div>
										<div className="mt-1 text-[11px] text-muted-foreground">
											One active goal at a time.
										</div>
									</button>
								))}
							</div>
						</div>

						<div className="rounded-xl border border-hairline bg-background/35 p-4">
							<div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
								Why this comes first
							</div>
							<p className="mt-2 text-sm text-foreground/85 leading-relaxed">
								We keep the first setup quiet and small. Choose one concrete goal
								now, then add just enough baseline detail on the next step to make
								the starting week believable.
							</p>
						</div>

						<div className="flex flex-wrap items-center gap-3 border-t border-hairline pt-6">
							<button
								type="submit"
								className="rounded-md bg-signal px-5 py-2.5 text-sm font-medium text-signal-foreground transition-opacity hover:opacity-90"
							>
								Continue
							</button>
							<span className="text-[11px] text-muted-foreground">
								Step 1 picks one active training goal.
							</span>
						</div>
					</>
				) : (
					<>
						<div className="rounded-xl border border-hairline bg-background/35 p-4">
							<div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
								Goal selected
							</div>
							<p className="mt-2 text-sm text-foreground/85">
								{GOALS.find((goal) => goal.value === goalType)?.label}
							</p>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<label className="grid gap-2">
								<span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
									Running days per week
								</span>
								<input
									type="number"
									min="0"
									max="7"
									value={baselineSessionsPerWeek}
									onChange={(event) => {
										setBaselineSessionsPerWeek(event.target.value);
										setFieldError(null);
									}}
									className="rounded-lg border border-hairline bg-background/50 px-4 py-3 text-sm focus:outline-none focus:border-foreground/30"
								/>
							</label>

							<label className="grid gap-2">
								<span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
									Longest recent run (km)
								</span>
								<input
									type="number"
									min="0"
									max="80"
									step="0.5"
									value={baselineLongRunKm}
									onChange={(event) => {
										setBaselineLongRunKm(event.target.value);
										setFieldError(null);
									}}
									className="rounded-lg border border-hairline bg-background/50 px-4 py-3 text-sm focus:outline-none focus:border-foreground/30"
								/>
							</label>
						</div>

						<label className="grid gap-2">
							<span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
								Notes
							</span>
							<textarea
								rows={4}
								value={baselineNotes}
								onChange={(event) => setBaselineNotes(event.target.value)}
								placeholder="Optional context like recent consistency, schedule constraints, or anything that should shape the starting plan."
								className="rounded-lg border border-hairline bg-background/50 px-4 py-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/30 resize-none"
							/>
						</label>

						<div className="rounded-xl border border-hairline bg-background/35 p-4">
							<div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
								What happens next
							</div>
							<p className="mt-2 text-sm text-foreground/85 leading-relaxed">
								We will save your profile, assign your first plan from the baseline
								template, and bring you straight into the weekly view.
							</p>
						</div>

						<div className="flex flex-wrap items-center gap-3 border-t border-hairline pt-6">
							<button
								type="button"
								disabled={isSaving}
								onClick={() => {
									setStep(1);
									setFieldError(null);
									setError(null);
								}}
								className="rounded-md border border-hairline px-5 py-2.5 text-sm transition-colors hover:bg-accent disabled:opacity-60"
							>
								Back
							</button>
							<button
								type="submit"
								disabled={isSaving}
								className="rounded-md bg-signal px-5 py-2.5 text-sm font-medium text-signal-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
							>
								{status === "saving"
									? "Saving setup..."
									: status === "finishing"
										? "Opening your plan..."
										: "See my plan"}
							</button>
							<span className="text-[11px] text-muted-foreground">
								Step 2 creates one saved plan from the imported baseline template.
							</span>
						</div>
					</>
				)}

				{fieldError && <p className="text-sm text-destructive">{fieldError}</p>}
				{error && <p className="text-sm text-destructive">{error}</p>}
				{status === "finishing" && (
					<p className="text-sm text-foreground/80">
						Your setup is saved. Loading the first persisted weekly plan…
					</p>
				)}
			</form>
		</section>
	);
}

import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, NotebookPen, ShieldAlert, ChevronRight, CalendarClock } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { IntervalsViz } from "@/components/IntervalsViz";
import { CompletionPanel } from "@/components/CompletionPanel";
import { Skeleton } from "@/components/ui/skeleton";
import {
	TYPE_META,
	workoutDistanceKm,
	workoutDuration,
	formatDate,
	WEEK_STATUS_META,
	type Workout,
} from "@/lib/training";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/app-config";
import { getWorkoutRouteData } from "@/lib/training-api";

export const Route = createFileRoute("/workout/$date")({
	validateSearch: (search: Record<string, unknown>) => ({
		tab:
			search.tab === "complete" || search.tab === "preview" || search.tab === "overview"
				? search.tab
				: "overview",
	}),
	head: () => ({
		meta: [
			{ title: `Workout — ${APP_NAME}` },
			{
				name: "description",
				content:
					"Review a preserved workout-detail shell and log real or preview workout results.",
			},
		],
	}),
	loader: async ({ params }) => {
		return getWorkoutRouteData({ data: { date: params.date } });
	},
	pendingComponent: WorkoutPendingState,
	errorComponent: WorkoutErrorState,
	component: WorkoutPage,
});

function WorkoutPage() {
	const { workout, snapshot, prev, next } = Route.useLoaderData();
	const search = Route.useSearch();
	const [tab, setTab] = useState<"overview" | "complete" | "preview">(search.tab);

	if (!workout) {
		return (
			<AppShell snapshot={snapshot}>
				<div className="px-6 lg:px-10 py-20 max-w-2xl">
					{snapshot.mode === "onboarding" ? (
						<>
							<p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
								Setup required
							</p>
							<h1 className="mt-3 font-display text-4xl">
								Finish setup before opening workouts.
							</h1>
							<p className="mt-4 text-sm text-muted-foreground">
								The saved workout detail route exists only after a persisted runner
								profile and active plan cycle are created.
							</p>
						</>
					) : (
						<>
							<p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
								No workout
							</p>
							<h1 className="mt-3 font-display text-4xl">
								Nothing is scheduled for this day.
							</h1>
							<p className="mt-4 text-sm text-muted-foreground">
								This date does not have a workout in the current {snapshot.source}{" "}
								plan view. Go back to the weekly plan and choose another day.
							</p>
						</>
					)}
					<div className="mt-6 flex flex-wrap items-center gap-3">
						<Link
							to="/"
							className="inline-flex text-sm text-signal underline-offset-4 hover:underline"
						>
							Back to weekly plan
						</Link>
					</div>
				</div>
			</AppShell>
		);
	}

	const meta = TYPE_META[workout.type];
	const km = workoutDistanceKm(workout);
	const duration = workoutDuration(workout);
	const status = workout.status;
	const weekStatus = WEEK_STATUS_META[snapshot.weekStatus];
	const phase = `${workout.phase} · week ${workout.week}`;

	return (
		<AppShell snapshot={snapshot}>
			<div className="px-6 lg:px-10 py-8 max-w-6xl">
				<div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
					<Link to="/" className="inline-flex items-center gap-1 hover:text-foreground">
						<ArrowLeft className="h-3 w-3" /> Calendar
					</Link>
					<span className="opacity-50">/</span>
					<span>{phase}</span>
				</div>

				<div className="mt-6 grid lg:grid-cols-[1fr_auto] gap-8 items-end">
					<div>
						<div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.18em]">
							<span
								className="h-1.5 w-1.5 rounded-full"
								style={{ background: meta.color }}
							/>
							<span style={{ color: meta.color }}>{meta.label}</span>
							<span className="opacity-50">·</span>
							<span className="text-muted-foreground">
								{formatDate(workout.date, {
									weekday: "long",
									month: "long",
									day: "numeric",
								})}
							</span>
							{workout.date === snapshot.currentDate && (
								<span className="text-signal">· Today</span>
							)}
						</div>
						<h1 className="mt-3 font-display text-4xl lg:text-5xl leading-[1.05] text-balance max-w-2xl">
							{workout.title}
						</h1>
						<p className="mt-4 text-sm text-muted-foreground max-w-xl leading-relaxed">
							{objectiveFor(workout.type)}
						</p>
					</div>

					<div className="flex gap-6">
						<Stat label="Distance" value={km ? km.toString() : "—"} unit="km" />
						<Stat
							label="Duration"
							value={duration ? duration.toString() : "—"}
							unit="min"
						/>
						<Stat label="Load" value={loadFor(workout)} unit="" />
					</div>
				</div>

				<div className="mt-10 border-b border-hairline flex gap-6">
					{(
						[
							{ v: "overview", l: "Overview" },
							{ v: "complete", l: "Log result" },
							{ v: "preview", l: "Preview state" },
						] as const
					).map((tabOption) => (
						<button
							key={tabOption.v}
							onClick={() => setTab(tabOption.v)}
							className={cn(
								"py-3 text-sm border-b-2 transition-colors -mb-px",
								tab === tabOption.v
									? "border-foreground text-foreground"
									: "border-transparent text-muted-foreground hover:text-foreground",
							)}
						>
							{tabOption.l}
							{tabOption.v === "preview" && (
								<span className="ml-2 text-[10px] uppercase tracking-wider text-signal">
									later
								</span>
							)}
						</button>
					))}
				</div>

				<div className="mt-8 grid lg:grid-cols-[1fr_320px] gap-10">
					<div>
						{tab === "overview" && <Overview workout={workout} />}
						{tab === "complete" && (
							<CompletionPanel workout={workout} snapshot={snapshot} />
						)}
						{tab === "preview" && <PreviewPanel />}
					</div>

					<aside className="space-y-4">
						<SidebarCard title="Targets" tone="signal">
							{workout.steps[0]?.target &&
								Object.entries(workout.steps[0].target).map(([key, value]) => (
									<div
										key={key}
										className="flex justify-between gap-3 py-1 border-b border-hairline last:border-0"
									>
										<span className="text-[11px] uppercase tracking-wider text-muted-foreground">
											{key.replace(/_/g, " ")}
										</span>
										<span className="text-xs text-foreground/85 text-right">
											{String(value)}
										</span>
									</div>
								))}
						</SidebarCard>

						<SidebarCard title="Workout note" muted>
							<p className="text-xs leading-relaxed text-foreground/80">
								{coachNoteFor(workout.type)}
							</p>
							<p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
								Manual note · no adaptive engine connected
							</p>
						</SidebarCard>

						<SidebarCard title="Week status">
							<div className="flex items-center justify-between text-xs">
								<span className="text-muted-foreground">
									{snapshot.source === "persisted"
										? "Current backend truth"
										: "Current preview"}
								</span>
								<span className="font-mono-num">{weekStatus.label}</span>
							</div>
							<div className="mt-2 h-1 rounded-full bg-hairline overflow-hidden">
								<div
									className={cn(
										"h-full",
										weekStatus.label === "On track"
											? "bg-success"
											: weekStatus.label === "Partially off track"
												? "bg-warn"
												: "bg-destructive",
									)}
									style={{
										width:
											weekStatus.label === "On track"
												? "100%"
												: weekStatus.label === "Partially off track"
													? "60%"
													: "35%",
									}}
								/>
							</div>
							<p className="mt-3 text-[11px] text-muted-foreground">
								{weekStatus.helper}
							</p>
						</SidebarCard>

						<SidebarCard title="Preview boundary" tone="signal">
							<div className="flex items-start gap-2">
								<CalendarClock className="h-3.5 w-3.5 text-signal mt-0.5" />
								<p className="text-xs leading-relaxed text-foreground/80">
									{snapshot.source === "persisted"
										? `${APP_NAME} keeps this imported workout shell while logging and week status now come from one persisted backend contract.`
										: `${APP_NAME} keeps this imported workout shell, but real logging, reset actions, and provider-driven updates are not wired yet.`}
								</p>
							</div>
						</SidebarCard>

						{status === "skipped" && (
							<SidebarCard title="Skipped">
								<div className="flex items-start gap-2">
									<ShieldAlert className="h-3.5 w-3.5 text-destructive mt-0.5" />
									<p className="text-xs text-foreground/80">
										{snapshot.source === "persisted"
											? "Past-due workouts without a saved log are treated as skipped until you overwrite them with a real result."
											: "This sample status is derived from imported preview logic. No automatic rebalancing has happened behind the scenes."}
									</p>
								</div>
							</SidebarCard>
						)}
					</aside>
				</div>

				<div className="mt-12 grid sm:grid-cols-2 gap-3">
					{prev && <NavCard direction="prev" date={prev.date} title={prev.title} />}
					{next && <NavCard direction="next" date={next.date} title={next.title} />}
				</div>
			</div>
		</AppShell>
	);
}

function WorkoutPendingState() {
	return (
		<AppShell>
			<div className="px-6 lg:px-10 py-8 max-w-6xl space-y-8">
				<div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
					<Skeleton className="h-3 w-32 bg-background/30" />
				</div>
				<div className="grid lg:grid-cols-[1fr_auto] gap-8 items-end">
					<div>
						<Skeleton className="h-4 w-64 bg-background/30" />
						<Skeleton className="mt-4 h-16 w-full max-w-2xl bg-background/40" />
						<Skeleton className="mt-4 h-5 w-full max-w-xl bg-background/30" />
					</div>
					<div className="flex gap-4">
						<Skeleton className="h-16 w-24 bg-background/30" />
						<Skeleton className="h-16 w-24 bg-background/30" />
						<Skeleton className="h-16 w-24 bg-background/30" />
					</div>
				</div>
				<Skeleton className="h-10 w-72 bg-background/30" />
				<div className="grid lg:grid-cols-[1fr_320px] gap-10">
					<Skeleton className="h-[460px] rounded-2xl bg-background/20" />
					<div className="space-y-4">
						<Skeleton className="h-32 rounded-2xl bg-background/20" />
						<Skeleton className="h-32 rounded-2xl bg-background/20" />
						<Skeleton className="h-32 rounded-2xl bg-background/20" />
					</div>
				</div>
			</div>
		</AppShell>
	);
}

function WorkoutErrorState({ reset }: { error: Error; reset: () => void }) {
	return (
		<AppShell>
			<div className="px-6 lg:px-10 py-20 max-w-2xl">
				<section className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 lg:p-10">
					<p className="text-[11px] uppercase tracking-[0.18em] text-destructive">
						Workout unavailable
					</p>
					<h1 className="mt-3 font-display text-4xl leading-[1.05]">
						We couldn&apos;t load this workout.
					</h1>
					<p className="mt-4 text-sm text-foreground/85 leading-relaxed">
						Try again to reopen the latest workout detail from preview or saved mode. If
						the plan is still being set up, return home first.
					</p>
					<div className="mt-8 flex flex-wrap items-center gap-3">
						<button
							type="button"
							onClick={() => {
								reset();
								window.location.reload();
							}}
							className="rounded-md bg-signal px-5 py-2.5 text-sm font-medium text-signal-foreground transition-opacity hover:opacity-90"
						>
							Try again
						</button>
						<Link
							to="/"
							className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
						>
							Back to weekly plan
						</Link>
					</div>
				</section>
			</div>
		</AppShell>
	);
}

function Overview({ workout }: { workout: Workout }) {
	return (
		<div className="space-y-10">
			<IntervalsViz workout={workout} />

			<div>
				<h3 className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
					Execution cues
				</h3>
				<ul className="mt-4 space-y-2 text-sm text-foreground/85">
					<li className="flex gap-3">
						<span className="text-muted-foreground">·</span> Start the first 10 minutes
						deliberately easy. Allow heart rate to rise gradually.
					</li>
					<li className="flex gap-3">
						<span className="text-muted-foreground">·</span> If HR drifts above zone,
						slow down or take a walk break.
					</li>
					<li className="flex gap-3">
						<span className="text-muted-foreground">·</span> Aim for relaxed shoulders,
						light landing, cadence ~175.
					</li>
					<li className="flex gap-3">
						<span className="text-muted-foreground">·</span> Hydrate every 25 min if
						temperature exceeds 20°C.
					</li>
				</ul>
			</div>

			<div>
				<h3 className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
					Fueling & recovery
				</h3>
				<div className="mt-4 grid sm:grid-cols-3 gap-3">
					{[
						{ t: "Pre", v: "Light carb 60 min prior" },
						{
							t: "During",
							v: workout.type === "long_run" ? "Gel at 45 min" : "Water only",
						},
						{ t: "After", v: "Protein + carb within 45 min" },
					].map((item) => (
						<div key={item.t} className="rounded-lg border border-hairline p-4">
							<div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
								{item.t}
							</div>
							<div className="mt-1 text-sm">{item.v}</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

function PreviewPanel() {
	return (
		<div className="rounded-xl border border-dashed border-hairline p-10 text-center">
			<NotebookPen className="h-6 w-6 mx-auto text-signal" strokeWidth={1.4} />
			<h3 className="mt-4 font-display text-2xl">This panel stays as a preview shell</h3>
			<p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
				It preserves the imported tab structure without pretending that analysis, external
				data ingest, or plan rewriting are already live.
			</p>
			<div className="mt-6 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
				<span className="h-1 w-1 rounded-full bg-signal" />
				Later surface · not connected yet
			</div>
		</div>
	);
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
	return (
		<div className="text-right">
			<div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
				{label}
			</div>
			<div className="mt-1 flex items-baseline gap-1 justify-end">
				<span className="font-display text-3xl leading-none">{value}</span>
				<span className="text-xs text-muted-foreground">{unit}</span>
			</div>
		</div>
	);
}

function SidebarCard({
	title,
	children,
	tone,
	muted,
}: {
	title: string;
	children: React.ReactNode;
	tone?: "signal";
	muted?: boolean;
}) {
	return (
		<div
			className={cn(
				"rounded-lg border p-4",
				tone === "signal" ? "border-signal/20 bg-signal/[0.03]" : "border-hairline",
				muted && "bg-surface/30",
			)}
		>
			<div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-3">
				{title}
			</div>
			{children}
		</div>
	);
}

function NavCard({
	direction,
	date,
	title,
}: {
	direction: "prev" | "next";
	date: string;
	title: string;
}) {
	return (
		<Link
			to="/workout/$date"
			params={{ date }}
			className={cn(
				"group rounded-lg border border-hairline p-4 hover:bg-accent/40 transition-colors",
				direction === "next" ? "text-right" : "",
			)}
		>
			<div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-1.5 justify-between">
				{direction === "prev" ? (
					<>
						<ArrowLeft className="h-3 w-3" /> Previous
					</>
				) : (
					<>
						Next <ChevronRight className="h-3 w-3" />
					</>
				)}
				<span className="font-mono-num">
					{formatDate(date, { weekday: "short", month: "short", day: "numeric" })}
				</span>
			</div>
			<div className="mt-2 text-sm">{title}</div>
		</Link>
	);
}

function objectiveFor(type: string) {
	switch (type) {
		case "easy":
		case "steady_or_easy":
			return "Aerobic base. Build mitochondrial density and capillarisation. Strictly conversational — if you can't speak in full sentences, slow down.";
		case "long_run":
			return "Time-on-feet. Trains glycogen utilisation, mental endurance, and the slow-twitch fibres that carry race day. Pacing should feel almost too easy at the start.";
		case "quality":
			return "Stress the threshold. Sharp efforts at controlled intensity to lift lactate clearance and running economy. Form before pace.";
		case "rest":
			return "Active recovery. Sleep, hydrate, walk. The plan only works if you absorb it.";
		default:
			return "";
	}
}

function coachNoteFor(type: string) {
	if (type === "long_run")
		return "Treat the first third as warmup. If the wind picks up, shelter on the return leg. Stop at 20 min for a sip of water.";
	if (type === "quality")
		return "Warmup until breathing is open. Each rep should feel slightly faster than threshold. Walk the recoveries if needed.";
	return "Eyes soft, jaw loose. Cadence ~175. If anything sharp shows up, end the run early — no quality lost.";
}

function loadFor(workout: Workout) {
	const duration = workoutDuration(workout);
	const multiplier: Record<string, number> = {
		easy: 1.0,
		steady_or_easy: 1.1,
		long_run: 1.4,
		quality: 1.8,
		rest: 0,
	};
	return Math.min(95, Math.round(duration * (multiplier[workout.type] ?? 1) * 0.6)).toString();
}

import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { TYPE_META, weeklyMileage, statsTotals } from "@/lib/training";
import { TrendingUp, Activity, Clock, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/app-config";
import { getProgressRouteData } from "@/lib/training-api";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/progress")({
	head: () => ({
		meta: [
			{ title: `Progress — ${APP_NAME}` },
			{
				name: "description",
				content:
					"Progress surfaces backed by the preview seam or the persisted plan and workout log.",
			},
		],
	}),
	loader: () => getProgressRouteData(),
	pendingComponent: ProgressPendingState,
	errorComponent: ProgressErrorState,
	component: Progress,
});

function Progress() {
	const { snapshot } = Route.useLoaderData();
	const hasPlannedWorkouts = snapshot.workouts.some((workout) => workout.type !== "rest");

	if (snapshot.mode === "onboarding") {
		return (
			<AppShell snapshot={snapshot}>
				<div className="px-6 lg:px-10 py-20 max-w-3xl">
					<section className="rounded-2xl border border-hairline bg-gradient-to-br from-surface-elevated to-surface p-6 lg:p-10">
						<p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
							Setup required
						</p>
						<h1 className="mt-3 font-display text-4xl lg:text-5xl leading-[1.05]">
							Finish setup before reviewing progress.
						</h1>
						<p className="mt-4 max-w-xl text-sm text-muted-foreground leading-relaxed">
							Progress becomes meaningful only after your saved runner profile and
							first plan are created on home.
						</p>
						<div className="mt-8 flex flex-wrap items-center gap-3">
							<Link
								to="/"
								className="rounded-md bg-signal px-5 py-2.5 text-sm font-medium text-signal-foreground transition-opacity hover:opacity-90"
							>
								Finish setup
							</Link>
						</div>
					</section>
				</div>
			</AppShell>
		);
	}

	if (!hasPlannedWorkouts) {
		return (
			<AppShell snapshot={snapshot}>
				<div className="px-6 lg:px-10 py-20 max-w-3xl">
					<section className="rounded-2xl border border-hairline bg-gradient-to-br from-surface-elevated to-surface p-6 lg:p-10">
						<p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
							Progress unavailable
						</p>
						<h1 className="mt-3 font-display text-4xl lg:text-5xl leading-[1.05]">
							There isn&apos;t a visible plan to summarize yet.
						</h1>
						<p className="mt-4 max-w-xl text-sm text-muted-foreground leading-relaxed">
							Once the saved plan is assigned, this preserved surface will reuse the
							same backend truth for volume, completion, and week status context.
						</p>
						<div className="mt-8 flex flex-wrap items-center gap-3">
							<Link
								to="/"
								className="rounded-md bg-signal px-5 py-2.5 text-sm font-medium text-signal-foreground transition-opacity hover:opacity-90"
							>
								Back to weekly plan
							</Link>
						</div>
					</section>
				</div>
			</AppShell>
		);
	}

	const weeks = weeklyMileage(snapshot);
	const totals = statsTotals(snapshot);
	const maxKm = Math.max(...weeks.map((week) => Math.max(week.km, week.planned)), 1);
	const recentTypes = snapshot.workouts
		.filter((workout) => workout.date <= snapshot.currentDate && workout.type !== "rest")
		.slice(-12);

	return (
		<AppShell snapshot={snapshot}>
			<div className="px-6 lg:px-10 py-10 max-w-6xl space-y-14">
				<header>
					<p className="text-[11px] tracking-[0.18em] uppercase text-muted-foreground">
						{snapshot.source === "persisted" ? "Saved mode shell" : "Preview surface"}
					</p>
					<h1 className="font-display text-5xl mt-2 leading-none">
						Progress, kept honest.
					</h1>
					<p className="mt-4 text-sm text-muted-foreground max-w-xl">
						{snapshot.source === "persisted"
							? "This route stays preserved to keep the imported navigation and layout intact while the aggregates now read from persisted plan and workout-log state."
							: "This route is preserved to keep the imported navigation and layout intact. The charts below still read from deterministic sample data rather than saved runner history."}
					</p>
				</header>

				<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
					<BigStat
						icon={Activity}
						label="Completed sessions"
						value={`${totals.completed}`}
						hint={`${totals.total} planned in the visible block`}
					/>
					<BigStat
						icon={TrendingUp}
						label={snapshot.source === "persisted" ? "Total volume" : "Sample volume"}
						value={`${totals.totalKm}`}
						unit="km"
						hint={
							snapshot.source === "persisted"
								? "derived from saved workout outcomes"
								: "derived from preview statuses"
						}
					/>
					<BigStat
						icon={Clock}
						label="Longest run"
						value={`${totals.longestKm}`}
						unit="km"
						hint="current block view"
					/>
					<BigStat
						icon={Flag}
						label="Surface state"
						value={snapshot.source === "persisted" ? "Saved" : "Preview"}
						hint={
							snapshot.source === "persisted"
								? "backend truth is live"
								: "no backend truth yet"
						}
						tone="warn"
					/>
				</div>

				<section>
					<SectionHeader title="Weekly mileage" subtitle="Planned vs actual" />
					<div className="rounded-xl border border-hairline p-6 bg-surface/40">
						<div className="flex items-end gap-1.5 h-48">
							{weeks.map((week) => {
								const isPast = week.weekStart <= snapshot.currentDate;
								return (
									<div
										key={week.weekStart}
										className="group flex-1 flex flex-col justify-end items-center gap-1 relative"
									>
										<div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono-num text-muted-foreground">
											{week.km.toFixed(0)}km
										</div>
										<div className="w-full flex items-end gap-px h-full">
											<div
												className={cn(
													"flex-1 rounded-sm transition-all",
													isPast ? "bg-signal/80" : "bg-foreground/10",
												)}
												style={{ height: `${(week.km / maxKm) * 100}%` }}
												title={`Actual ${week.km.toFixed(1)}km`}
											/>
											<div
												className="flex-1 rounded-sm bg-foreground/15"
												style={{
													height: `${(week.planned / maxKm) * 100}%`,
												}}
												title={`Planned ${week.planned.toFixed(1)}km`}
											/>
										</div>
									</div>
								);
							})}
						</div>
						<div className="mt-3 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
							<span>Wk 1</span>
							<div className="flex items-center gap-4">
								<span className="flex items-center gap-1.5">
									<span className="h-2 w-2 rounded-sm bg-signal/80" /> Actual
								</span>
								<span className="flex items-center gap-1.5">
									<span className="h-2 w-2 rounded-sm bg-foreground/15" /> Planned
								</span>
							</div>
							<span>Wk {weeks.length}</span>
						</div>
					</div>
				</section>

				<section>
					<SectionHeader title="Activity trend" subtitle="14-day sample pattern" />
					<div className="rounded-xl border border-hairline p-6 bg-surface/40">
						<FatigueChart />
					</div>
				</section>

				<section>
					<SectionHeader title="Consistency" subtitle="Last 12 quality sessions" />
					<div className="rounded-xl border border-hairline p-6 bg-surface/40">
						<div className="flex gap-1.5">
							{recentTypes.map((workout) => {
								const meta = TYPE_META[workout.type];
								return (
									<div key={workout.date} className="flex-1 group">
										<div
											className="h-16 rounded-md transition-transform group-hover:scale-y-105 origin-bottom"
											style={{
												background:
													workout.status === "completed"
														? meta.color
														: workout.status === "partial"
															? "color-mix(in oklch, var(--warn) 60%, transparent)"
															: workout.status === "skipped"
																? "color-mix(in oklch, var(--destructive) 30%, transparent)"
																: "var(--hairline)",
												opacity: workout.status === "skipped" ? 0.5 : 1,
											}}
										/>
										<div className="mt-2 text-[9px] font-mono-num text-muted-foreground text-center">
											{workout.date.slice(5)}
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</section>

				<section>
					<SectionHeader title="Why this page stays" subtitle="Preserved shell" />
					<div className="rounded-xl border border-hairline p-8 bg-gradient-to-br from-surface-elevated to-surface">
						<div className="grid lg:grid-cols-[1fr_auto] gap-8 items-end">
							<div>
								<p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
									Preview contract
								</p>
								<div className="mt-3 font-display text-5xl leading-none">
									Later, not live.
								</div>
								<p className="mt-3 text-sm text-muted-foreground">
									This is where richer trend interpretation can live later, once
									workout logs, week status, and any derived summaries are backed
									by real persisted data.
								</p>
							</div>
							<div className="flex flex-col gap-2">
								{[
									{
										k: "Status",
										v: snapshot.source === "persisted" ? "Saved" : "Preview",
									},
									{
										k: "Logging",
										v:
											snapshot.source === "persisted"
												? "Persisted"
												: "Local only",
									},
									{
										k: "Backend",
										v: snapshot.source === "persisted" ? "Supabase" : "Off",
									},
								].map((metric) => (
									<div
										key={metric.k}
										className="rounded-md border border-hairline px-3 py-2 min-w-[140px] flex justify-between items-baseline"
									>
										<span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
											{metric.k}
										</span>
										<span className="font-mono-num text-sm">{metric.v}</span>
									</div>
								))}
							</div>
						</div>
					</div>
				</section>
			</div>
		</AppShell>
	);
}

function ProgressPendingState() {
	return (
		<AppShell>
			<div className="px-6 lg:px-10 py-10 max-w-6xl space-y-10">
				<div>
					<Skeleton className="h-4 w-28 bg-background/30" />
					<Skeleton className="mt-4 h-14 w-80 bg-background/40" />
					<Skeleton className="mt-4 h-5 w-full max-w-xl bg-background/30" />
				</div>
				<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
					{Array.from({ length: 4 }).map((_, index) => (
						<Skeleton key={index} className="h-32 rounded-2xl bg-background/20" />
					))}
				</div>
				<Skeleton className="h-64 rounded-2xl bg-background/20" />
				<Skeleton className="h-56 rounded-2xl bg-background/20" />
			</div>
		</AppShell>
	);
}

function ProgressErrorState({ reset }: { error: Error; reset: () => void }) {
	return (
		<AppShell>
			<div className="px-6 lg:px-10 py-20 max-w-3xl">
				<section className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 lg:p-10">
					<p className="text-[11px] uppercase tracking-[0.18em] text-destructive">
						Progress unavailable
					</p>
					<h1 className="mt-3 font-display text-4xl leading-[1.05]">
						We couldn&apos;t load this progress view.
					</h1>
					<p className="mt-4 text-sm text-foreground/85 leading-relaxed">
						Try again to reopen the latest preview or saved aggregate state.
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

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
	return (
		<div className="flex items-baseline justify-between mb-4">
			<h2 className="font-display text-2xl">{title}</h2>
			<span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
				{subtitle}
			</span>
		</div>
	);
}

function BigStat({
	icon: Icon,
	label,
	value,
	unit,
	hint,
	tone,
}: {
	icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
	label: string;
	value: string;
	unit?: string;
	hint?: string;
	tone?: "warn";
}) {
	return (
		<div className="rounded-xl border border-hairline bg-surface/40 p-5">
			<div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
				<span>{label}</span>
				<Icon
					className={cn("h-3.5 w-3.5", tone === "warn" && "text-warn")}
					strokeWidth={1.5}
				/>
			</div>
			<div className="mt-3 flex items-baseline gap-1">
				<span className="font-display text-4xl leading-none">{value}</span>
				{unit && <span className="text-xs text-muted-foreground">{unit}</span>}
			</div>
			{hint && <div className="mt-2 text-[11px] text-muted-foreground">{hint}</div>}
		</div>
	);
}

function FatigueChart() {
	const points = [42, 48, 55, 50, 58, 65, 60, 68, 72, 70, 65, 68, 62, 68];
	const max = 100;
	const width = 600;
	const height = 140;
	const pad = 8;
	const stepX = (width - pad * 2) / (points.length - 1);
	const path = points
		.map(
			(value, index) =>
				`${index === 0 ? "M" : "L"} ${pad + index * stepX} ${height - pad - (value / max) * (height - pad * 2)}`,
		)
		.join(" ");
	const area = `${path} L ${width - pad} ${height - pad} L ${pad} ${height - pad} Z`;

	return (
		<div>
			<svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40">
				<defs>
					<linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" stopColor="var(--signal)" stopOpacity="0.25" />
						<stop offset="1" stopColor="var(--signal)" stopOpacity="0" />
					</linearGradient>
				</defs>
				{[0.25, 0.5, 0.75].map((y) => (
					<line
						key={y}
						x1={pad}
						y1={height - pad - y * (height - pad * 2)}
						x2={width - pad}
						y2={height - pad - y * (height - pad * 2)}
						stroke="var(--hairline)"
						strokeWidth="1"
					/>
				))}
				<path d={area} fill="url(#g)" />
				<path d={path} fill="none" stroke="var(--signal)" strokeWidth="2.2" />
			</svg>
			<div className="mt-3 text-[11px] text-muted-foreground">
				Static placeholder chart. No readiness model, OCR import, or adaptive coaching logic
				is inferred from this line.
			</div>
		</div>
	);
}

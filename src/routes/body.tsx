import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { APP_NAME } from "@/lib/app-config";
import { getShellRouteData } from "@/lib/training-api";

export const Route = createFileRoute("/body")({
	head: () => ({
		meta: [
			{ title: `Body — ${APP_NAME}` },
			{
				name: "description",
				content: "Preview body-note surface preserved from the imported baseline.",
			},
		],
	}),
	loader: () => getShellRouteData(),
	component: Body,
});

const REGIONS = [
	{ id: "neck", label: "Neck", side: "front", x: 100, y: 50 },
	{ id: "left-shoulder", label: "L. Shoulder", side: "front", x: 70, y: 75 },
	{ id: "right-shoulder", label: "R. Shoulder", side: "front", x: 130, y: 75 },
	{ id: "lower-back", label: "Lower back", side: "back", x: 100, y: 175 },
	{ id: "left-hip", label: "L. Hip", side: "front", x: 82, y: 200 },
	{ id: "right-hip", label: "R. Hip", side: "front", x: 118, y: 200 },
	{ id: "left-quad", label: "L. Quad", side: "front", x: 82, y: 250 },
	{ id: "right-quad", label: "R. Quad", side: "front", x: 118, y: 250 },
	{ id: "left-knee", label: "L. Knee", side: "front", x: 82, y: 305 },
	{ id: "right-knee", label: "R. Knee", side: "front", x: 118, y: 305 },
	{ id: "left-calf", label: "L. Calf", side: "back", x: 82, y: 360 },
	{ id: "right-calf", label: "R. Calf", side: "back", x: 118, y: 360 },
	{ id: "left-ankle", label: "L. Ankle", side: "front", x: 82, y: 415 },
	{ id: "right-ankle", label: "R. Ankle", side: "front", x: 118, y: 415 },
	{ id: "left-foot", label: "L. Foot", side: "front", x: 82, y: 450 },
	{ id: "right-foot", label: "R. Foot", side: "front", x: 118, y: 450 },
];

const INITIAL_LOG: Record<string, number> = {
	"right-calf": 2,
	"left-knee": 1,
};

function Body() {
	const { snapshot } = Route.useLoaderData();
	const [log, setLog] = useState<Record<string, number>>(INITIAL_LOG);
	const [view, setView] = useState<"front" | "back">("front");
	const [active, setActive] = useState<string | null>(null);

	function setLevel(id: string, level: number) {
		setLog((p) => {
			const n = { ...p };
			if (level === 0) delete n[id];
			else n[id] = level;
			return n;
		});
	}

	return (
		<AppShell snapshot={snapshot}>
			<div className="px-6 lg:px-10 py-10 max-w-6xl">
				<header className="mb-10">
					<p className="text-[11px] tracking-[0.18em] uppercase text-muted-foreground">
						{snapshot.source === "persisted" ? "Saved mode shell" : "Preview surface"}
					</p>
					<h1 className="font-display text-5xl mt-2 leading-none">Manual body notes.</h1>
					<p className="mt-4 text-sm text-muted-foreground max-w-xl">
						{snapshot.source === "persisted"
							? "This route stays visible inside saved mode, but body notes remain a preserved local-only shell. They do not adapt the plan, rewrite workouts, or sync to a device yet."
							: "This route stays visible as a preserved shell. Interactions are local-only and do not adapt the plan, rewrite workouts, or sync to a device yet."}
					</p>
				</header>

				<div className="grid lg:grid-cols-[1fr_360px] gap-10">
					{/* Body map */}
					<div className="rounded-xl border border-hairline bg-surface/40 p-8">
						<div className="flex items-center justify-between mb-6">
							<div className="flex rounded-md border border-hairline p-0.5 text-xs">
								{(["front", "back"] as const).map((v) => (
									<button
										key={v}
										onClick={() => setView(v)}
										className={cn(
											"px-3 py-1.5 rounded-sm capitalize tracking-wide",
											view === v
												? "bg-accent text-foreground"
												: "text-muted-foreground",
										)}
									>
										{v}
									</button>
								))}
							</div>
							<span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
								{Object.keys(log).length} active marker
								{Object.keys(log).length === 1 ? "" : "s"}
							</span>
						</div>

						<div className="flex justify-center">
							<svg viewBox="0 0 200 500" className="h-[520px] w-auto">
								<Silhouette view={view} />
								{REGIONS.filter(
									(r) =>
										r.side === view ||
										r.id.includes("knee") ||
										r.id.includes("foot") ||
										r.id.includes("ankle") ||
										r.id.includes("hip") ||
										r.id.includes("quad") ||
										r.id.includes("calf") ||
										r.id.includes("shoulder") ||
										r.id === "neck",
								).map((r) => {
									const level = log[r.id] ?? 0;
									const isActive = active === r.id;
									return (
										<g
											key={r.id}
											onClick={() => setActive(r.id)}
											onMouseEnter={() => setActive(r.id)}
											className="cursor-pointer"
										>
											<circle
												cx={r.x}
												cy={r.y}
												r={level ? 9 : 5}
												fill={
													level
														? `color-mix(in oklch, var(--destructive) ${30 + level * 20}%, transparent)`
														: "var(--hairline)"
												}
												stroke={
													level
														? "var(--destructive)"
														: isActive
															? "var(--signal)"
															: "var(--muted-foreground)"
												}
												strokeWidth={isActive ? 1.5 : 1}
												className="transition-all"
											/>
											{level > 0 && (
												<text
													x={r.x}
													y={r.y + 3}
													textAnchor="middle"
													fontSize="9"
													fill="var(--foreground)"
													fontFamily="monospace"
												>
													{level}
												</text>
											)}
										</g>
									);
								})}
							</svg>
						</div>

						<p className="text-center text-[11px] uppercase tracking-[0.18em] text-muted-foreground mt-4">
							{active ? REGIONS.find((r) => r.id === active)?.label : "Tap a region"}
						</p>
					</div>

					{/* Right panel */}
					<aside className="space-y-4">
						{active && (
							<div className="rounded-xl border border-hairline p-5 bg-surface/40">
								<div className="flex items-baseline justify-between">
									<h3 className="font-display text-xl">
										{REGIONS.find((r) => r.id === active)?.label}
									</h3>
									<button
										onClick={() => setLevel(active, 0)}
										className="text-[11px] text-muted-foreground hover:text-foreground"
									>
										Clear
									</button>
								</div>
								<div className="mt-4 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
									Severity
								</div>
								<div className="mt-2 grid grid-cols-5 gap-1">
									{[1, 2, 3, 4, 5].map((n) => (
										<button
											key={n}
											onClick={() => setLevel(active, n)}
											className={cn(
												"h-9 rounded-md border text-xs font-mono-num transition-colors",
												(log[active] ?? 0) >= n
													? "bg-destructive/30 border-destructive/50 text-foreground"
													: "border-hairline text-muted-foreground hover:bg-accent/40",
											)}
										>
											{n}
										</button>
									))}
								</div>
								<div className="mt-4 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
									Sensation
								</div>
								<div className="mt-2 flex flex-wrap gap-1.5">
									{["Sore", "Tight", "Sharp", "Dull", "Swollen", "Stiff"].map(
										(s) => (
											<button
												key={s}
												className="rounded-full border border-hairline px-3 py-1 text-[11px] hover:bg-accent"
											>
												{s}
											</button>
										),
									)}
								</div>
								<textarea
									placeholder="When does it appear? After tempo runs, downhill, etc."
									rows={3}
									className="mt-4 w-full rounded-md border border-hairline bg-background/50 p-3 text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/30 resize-none"
								/>
							</div>
						)}

						<div className="rounded-xl border border-hairline p-5 bg-surface/40">
							<h3 className="font-display text-xl">Active log</h3>
							<div className="mt-4 space-y-2">
								{Object.entries(log).length === 0 && (
									<p className="text-[11px] text-muted-foreground">
										No markers. Body feels good today.
									</p>
								)}
								{Object.entries(log).map(([id, level]) => {
									const r = REGIONS.find((x) => x.id === id);
									return (
										<div
											key={id}
											className="flex items-center justify-between text-sm py-2 border-b border-hairline last:border-0"
										>
											<span>{r?.label}</span>
											<div className="flex items-center gap-3">
												<div className="flex gap-0.5">
													{[1, 2, 3, 4, 5].map((n) => (
														<span
															key={n}
															className={cn(
																"h-1 w-2 rounded-full",
																n <= level
																	? "bg-destructive"
																	: "bg-hairline",
															)}
														/>
													))}
												</div>
												<span className="font-mono-num text-xs text-muted-foreground w-4">
													{level}
												</span>
											</div>
										</div>
									);
								})}
							</div>
						</div>

						<div className="rounded-xl border border-signal/20 bg-signal/[0.03] p-5">
							<div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
								Preview note
							</div>
							<p className="mt-2 text-sm text-foreground/85 leading-relaxed">
								Later phases may use this area for trusted body-state guidance. In
								the current repo it is only a preserved preview block, not a
								decision engine.
							</p>
							<button className="mt-3 inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-signal hover:underline">
								<Plus className="h-3 w-3" /> Keep surface
							</button>
						</div>
					</aside>
				</div>
			</div>
		</AppShell>
	);
}

function Silhouette({ view: _view }: { view: "front" | "back" }) {
	return (
		<g fill="none" stroke="var(--hairline)" strokeWidth="1">
			{/* Head */}
			<circle cx="100" cy="35" r="20" />
			{/* Neck */}
			<line x1="92" y1="55" x2="92" y2="65" />
			<line x1="108" y1="55" x2="108" y2="65" />
			{/* Torso */}
			<path d="M 65 75 Q 60 110 65 160 L 75 220 L 125 220 L 135 160 Q 140 110 135 75 Q 120 65 100 65 Q 80 65 65 75 Z" />
			{/* Arms */}
			<path d="M 65 75 Q 50 130 48 200 L 55 240" />
			<path d="M 135 75 Q 150 130 152 200 L 145 240" />
			{/* Hands */}
			<circle cx="55" cy="248" r="6" />
			<circle cx="145" cy="248" r="6" />
			{/* Legs */}
			<path d="M 75 220 L 75 320 L 80 420 L 85 470" />
			<path d="M 95 220 L 92 320 L 88 420 L 88 470" />
			<path d="M 105 220 L 108 320 L 112 420 L 112 470" />
			<path d="M 125 220 L 125 320 L 120 420 L 115 470" />
			{/* Feet */}
			<ellipse cx="84" cy="478" rx="9" ry="5" />
			<ellipse cx="116" cy="478" rx="9" ry="5" />
			{/* knee lines */}
			<line x1="78" y1="320" x2="93" y2="320" />
			<line x1="107" y1="320" x2="122" y2="320" />
		</g>
	);
}

import type { Workout, Step } from "@/lib/training";
import { TYPE_META } from "@/lib/training";

/* Horizontal block timeline of workout structure. */
export function IntervalsViz({ workout }: { workout: Workout }) {
	const blocks = expand(workout.steps);
	const total = blocks.reduce((s, b) => s + b.dur, 0);
	const meta = TYPE_META[workout.type];
	return (
		<div>
			<div className="flex items-center justify-between mb-3">
				<span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
					Workout structure
				</span>
				<span className="text-[11px] font-mono-num text-muted-foreground">
					{total} min · {blocks.length} blocks
				</span>
			</div>
			<div className="flex h-12 rounded-md overflow-hidden border border-hairline">
				{blocks.map((b, i) => (
					<div
						key={i}
						className="relative group transition-all hover:flex-grow-[1.2]"
						style={{
							flexGrow: b.dur,
							flexBasis: 0,
							background:
								b.kind === "warmup"
									? "color-mix(in oklch, var(--easy) 40%, transparent)"
									: b.kind === "cooldown"
										? "color-mix(in oklch, var(--easy) 30%, transparent)"
										: b.kind === "recovery"
											? "color-mix(in oklch, var(--rest) 30%, transparent)"
											: b.kind === "work"
												? meta.color
												: meta.color,
							opacity: b.kind === "recovery" ? 0.4 : 1,
						}}
					>
						{b.dur >= 4 && (
							<span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono-num text-background/80 mix-blend-luminosity">
								{b.label}
							</span>
						)}
					</div>
				))}
			</div>

			<ol className="mt-5 space-y-2.5">
				{blocks.map((b, i) => (
					<li key={i} className="flex items-center gap-4 text-sm">
						<span className="font-mono-num text-[11px] text-muted-foreground w-6 text-right">
							{String(i + 1).padStart(2, "0")}
						</span>
						<span
							className="h-6 w-1 rounded-full"
							style={{
								background:
									b.kind === "warmup" || b.kind === "cooldown"
										? "var(--easy)"
										: b.kind === "recovery"
											? "var(--rest)"
											: meta.color,
							}}
						/>
						<div className="flex-1 min-w-0">
							<div className="flex items-baseline gap-2">
								<span className="capitalize">{b.kind.replace("_", " ")}</span>
								<span className="text-[11px] text-muted-foreground">{b.label}</span>
							</div>
							{b.target && (
								<div className="mt-0.5 text-[11px] text-muted-foreground space-x-3">
									{Object.entries(b.target).map(([k, v]) => (
										<span key={k}>
											<span className="opacity-60">
												{k.replace(/_/g, " ")}:
											</span>{" "}
											<span className="text-foreground/80">{String(v)}</span>
										</span>
									))}
								</div>
							)}
						</div>
						<span className="font-mono-num text-xs text-muted-foreground">
							{b.dur}′
						</span>
					</li>
				))}
			</ol>
		</div>
	);
}

type Block = { kind: string; dur: number; label: string; target?: Record<string, string | number> };

function expand(steps: Step[]): Block[] {
	const out: Block[] = [];
	for (const s of steps) {
		if (s.repeats && s.work && s.recovery) {
			for (let i = 0; i < s.repeats; i++) {
				out.push({
					kind: "work",
					dur: s.work.duration_min ?? 1,
					label: `${i + 1}/${s.repeats}`,
					target: s.work.target,
				});
				out.push({
					kind: "recovery",
					dur: s.recovery.duration_min ?? 1,
					label: "rec",
					target: s.recovery.target,
				});
			}
		} else {
			const kind = s.type === "run" ? "run" : s.type;
			out.push({
				kind,
				dur: s.duration_min ?? Math.round((s.distance_km ?? 0) * 6),
				label: s.distance_km ? `${s.distance_km}km` : `${s.duration_min}′`,
				target: s.target as Record<string, string | number> | undefined,
			});
		}
	}
	return out;
}

import type { Workout, Step } from "@/lib/training";
import { formatDistanceKm, stepPlannedDurationMin, workoutTypeMeta } from "@/lib/training";

/* Horizontal block timeline of workout structure. */
export function IntervalsViz({ workout }: { workout: Workout }) {
  const blocks = expand(workout);
  const total = blocks.reduce((s, b) => s + b.dur, 0);
  const meta = workoutTypeMeta(workout);
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
                      <span className="opacity-60">{k.replace(/_/g, " ")}:</span>{" "}
                      <span className="text-foreground/80">{String(v)}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <span className="font-mono-num text-xs text-muted-foreground">{b.metric}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

type Block = {
  kind: string;
  dur: number;
  label: string;
  metric: string;
  target?: Record<string, string | number>;
};

function expand(workout: Workout): Block[] {
  const out: Block[] = [];
  for (const s of workout.steps) {
    if (s.repeats && s.work && s.recovery) {
      for (let i = 0; i < s.repeats; i++) {
        const workMetric = describeStepMetric(s.work);
        out.push({
          kind: "work",
          dur: estimateVisualDurationMin(s.work, workout.type) || 1,
          label:
            s.work.distance_km != null
              ? `${i + 1}/${s.repeats} · ${Math.round(s.work.distance_km * 1000)}m`
              : `${i + 1}/${s.repeats}`,
          metric: workMetric,
          target: s.work.target,
        });

        const recoveryDuration = estimateVisualDurationMin(s.recovery, "easy");
        const recoveryMetric = describeStepMetric(s.recovery);
        if (recoveryDuration > 0 || recoveryMetric !== "—" || s.recovery.target) {
          out.push({
            kind: "recovery",
            dur: recoveryDuration || 1,
            label: "rec",
            metric: recoveryMetric,
            target: s.recovery.target,
          });
        }
      }
    } else {
      const kind = s.type === "run" ? "run" : s.type;
      out.push({
        kind,
        dur: estimateVisualDurationMin(s, workout.type) || 1,
        label: describeStepMetric(s),
        metric: describeStepMetric(s),
        target: s.target as Record<string, string | number> | undefined,
      });
    }
  }
  return out;
}

function describeStepMetric(step: Step) {
  if (step.distance_km != null) {
    return `${formatDistanceKm(step.distance_km)}km`;
  }

  if (step.duration_min != null) {
    return `${step.duration_min}′`;
  }

  return "—";
}

function estimateVisualDurationMin(step: Step, workoutType: Workout["type"]) {
  const direct = stepPlannedDurationMin(step, workoutType);
  if (direct > 0) {
    return direct;
  }

  if (!step.distance_km) {
    return 0;
  }

  const paceMap: Record<Workout["type"], number> = {
    easy: 7.0,
    steady_or_easy: 6.6,
    long_run: 6.8,
    quality: 5.8,
    rest: 0,
  };
  const pace = paceMap[workoutType];

  if (!pace) {
    return 0;
  }

  return Math.round(step.distance_km * pace);
}

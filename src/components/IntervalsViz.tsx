import { useState } from "react";
import type { Workout, Step, StepTarget } from "@/lib/training";
import {
  displayExecutableTargetEntries,
  displayTargetSupportEntries,
  formatDistanceKm,
  formatDurationMin,
  segmentColorMeta,
  stepPlannedDurationMin,
} from "@/lib/training";
import { cn } from "@/lib/utils";

/* Horizontal block timeline of workout structure. */
export function IntervalsViz({ workout }: { workout: Workout }) {
  const blocks = expand(workout);
  const total = blocks.reduce((s, b) => s + b.dur, 0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeBlock = activeIndex == null ? null : blocks[activeIndex];
  const activePosition = activeIndex == null ? null : blockCenterPercent(blocks, activeIndex);
  const activeColors = activeBlock
    ? segmentColorMeta(activeBlock.semanticKind, activeBlock.target)
    : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="hito-label">Workout structure</span>
        <span className="hito-caption font-mono-num">
          {formatDurationMin(total)} · {blocks.length} blocks
        </span>
      </div>
      <div className="relative">
        <div className="relative z-10 flex h-12 rounded-md border border-hairline bg-background/25">
          {blocks.map((b, i) => {
            const colors = segmentColorMeta(b.semanticKind, b.target);
            const isActive = activeIndex === i;
            const hasActive = activeIndex != null;

            return (
              <button
                key={i}
                type="button"
                onBlur={() => setActiveIndex(null)}
                onClick={() => setActiveIndex(i)}
                onFocus={() => setActiveIndex(i)}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
                onPointerEnter={() => setActiveIndex(i)}
                onPointerLeave={() => setActiveIndex(null)}
                className={cn(
                  "relative min-w-0 cursor-default appearance-none overflow-hidden border-x border-background/20 p-0 transition-[flex-grow,opacity,transform] duration-200 first:rounded-l-md first:border-l-0 last:rounded-r-md last:border-r-0 hover:flex-grow-[1.2] focus-visible:z-20 focus-visible:outline-none",
                  isActive && "z-10 -translate-y-0.5",
                )}
                style={{
                  flexGrow: b.dur,
                  flexBasis: 0,
                  background: colors.background,
                  borderColor: colors.border,
                  boxShadow: isActive
                    ? `${colors.glow}, inset 0 0 0 2px color-mix(in oklch, ${colors.color} 78%, white 10%)`
                    : undefined,
                  opacity: hasActive && !isActive ? 0.34 : 1,
                }}
                aria-label={`${b.title}, ${b.metric}`}
              >
                {b.dur >= 4 && (
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono-num text-background/80 mix-blend-luminosity">
                    {b.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {activeBlock && activeColors && activePosition != null && (
          <SegmentTooltip
            align={tooltipAlign(activeIndex ?? 0, blocks.length)}
            block={activeBlock}
            color={activeColors.color}
            leftPercent={activePosition}
            metricMode={workout.metricMode}
          />
        )}
      </div>

      <ol className="hito-row-group mt-5">
        {blocks.map((b, i) => {
          const colors = segmentColorMeta(b.semanticKind, b.target);
          const isActive = activeIndex === i;

          return (
            <li
              key={i}
              className={cn(
                "hito-list-row justify-start gap-4 transition-colors",
                isActive && "bg-white/[0.085]",
              )}
            >
              <span className="hito-caption w-6 text-right font-mono-num">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                className="h-6 w-1 rounded-full"
                style={{
                  background: colors.color,
                  boxShadow: isActive ? colors.glow : undefined,
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="hito-list-row-title capitalize">{b.kind.replace("_", " ")}</span>
                  <span className="hito-caption">{b.label}</span>
                </div>
                {b.target && (
                  <div className="hito-caption mt-0.5 space-x-3">
                    {displayExecutableTargetEntries(b.target, workout.metricMode).map((entry) => (
                      <span key={entry.key}>
                        <span className="opacity-60">{entry.label}:</span>{" "}
                        <span className="text-foreground/80">{entry.value}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <span className="hito-caption font-mono-num">{b.metric}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

type Block = {
  kind: string;
  dur: number;
  label: string;
  metric: string;
  title: string;
  semanticKind: string;
  target?: StepTarget;
};

function expand(workout: Workout): Block[] {
  const out: Block[] = [];
  for (const s of workout.steps) {
    if (s.repeats && s.work && s.recovery) {
      for (let i = 0; i < s.repeats; i++) {
        const workMetric = describeStepMetric(s.work);
        out.push({
          kind: "work",
          semanticKind: `work ${s.work.label ?? ""}`,
          dur: estimateVisualDurationMin(s.work, workout.type) || 1,
          title: s.work.label ?? `Work ${i + 1}/${s.repeats}`,
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
            semanticKind: `recovery ${s.recovery.label ?? ""}`,
            dur: recoveryDuration || 1,
            title: s.recovery.label ?? "Recovery",
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
        semanticKind: `${kind} ${s.label ?? ""}`,
        dur: estimateVisualDurationMin(s, workout.type) || 1,
        title: s.label ?? humanizeSegmentKind(kind),
        label: describeStepMetric(s),
        metric: describeStepMetric(s),
        target: s.target,
      });
    }
  }
  return out;
}

function SegmentTooltip({
  block,
  color,
  align,
  leftPercent,
  metricMode,
}: {
  block: Block;
  color: string;
  align: "left" | "center" | "right";
  leftPercent: number;
  metricMode: Workout["metricMode"];
}) {
  const priorityEntries = displayExecutableTargetEntries(block.target, metricMode).slice(0, 3);
  const supportEntries =
    priorityEntries.length > 0 ? [] : displayTargetSupportEntries(block.target).slice(0, 1);

  return (
    <span
      className={cn(
        "hito-tooltip absolute top-[calc(100%+10px)] z-30 opacity-100",
        align === "left" && "translate-x-0",
        align === "center" && "left-1/2 -translate-x-1/2",
        align === "right" && "-translate-x-full",
      )}
      style={{
        left: `${leftPercent}%`,
      }}
    >
      <span className="flex items-center gap-2 font-medium">
        <span className="hito-tooltip-dot" style={{ background: color }} />
        <span className="hito-tooltip-title">{block.title}</span>
      </span>
      <span className="hito-tooltip-meta mt-1 block font-mono-num">{block.metric}</span>
      {(priorityEntries.length > 0 || supportEntries.length > 0) && (
        <span className="hito-tooltip-meta mt-1.5 block space-y-0.5">
          {[...priorityEntries, ...supportEntries].map((entry) => (
            <span key={entry.key} className="block">
              <span className="opacity-65">{entry.label}:</span> <span>{entry.value}</span>
            </span>
          ))}
        </span>
      )}
    </span>
  );
}

function describeStepMetric(step: Step) {
  if (step.distance_km != null) {
    return `${formatDistanceKm(step.distance_km)}km`;
  }

  if (step.duration_min != null) {
    return formatDurationMin(step.duration_min, "prime");
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

function humanizeSegmentKind(kind: string) {
  return kind.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function tooltipAlign(index: number, total: number) {
  if (index <= 1) {
    return "left";
  }

  if (index >= total - 2) {
    return "right";
  }

  return "center";
}

function blockCenterPercent(blocks: Block[], index: number) {
  const total = blocks.reduce((sum, block) => sum + block.dur, 0);
  if (!total) {
    return 50;
  }

  const start = blocks.slice(0, index).reduce((sum, block) => sum + block.dur, 0);
  const center = start + blocks[index].dur / 2;
  return Math.min(96, Math.max(4, (center / total) * 100));
}

import { useState } from "react";
import type { StepTarget } from "@/lib/training";
import { segmentColorMeta } from "@/lib/training";
import { cn } from "@/lib/utils";

export interface WorkoutStructureTimelineReadbackEntry {
  key: string;
  label: string;
  value: string;
}

export interface WorkoutStructureTimelineItem {
  id: string;
  kindLabel: string;
  detailLabel?: string;
  barLabel: string;
  metric: string;
  title: string;
  semanticKind: string;
  target?: StepTarget;
  weight: number;
  readbackEntries?: WorkoutStructureTimelineReadbackEntry[];
  tooltipReadbackEntries?: WorkoutStructureTimelineReadbackEntry[];
}

export function WorkoutStructureTimeline({
  ariaLabel = "Workout structure",
  density = "default",
  emptyState,
  items,
  label = "Workout structure",
  summary,
}: {
  ariaLabel?: string;
  density?: "default" | "compact";
  emptyState?: {
    badge: string;
    copy: string;
  };
  items: WorkoutStructureTimelineItem[];
  label?: string;
  summary: string;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeItem = activeIndex == null ? null : items[activeIndex];
  const activePosition = activeIndex == null ? null : itemCenterPercent(items, activeIndex);
  const activeColors = activeItem
    ? segmentColorMeta(activeItem.semanticKind, activeItem.target)
    : null;

  return (
    <div
      className={cn(
        "hito-workout-structure-timeline",
        density === "compact" && "hito-workout-structure-timeline-compact",
      )}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="hito-label-md text-foreground">{label}</span>
        <span className="hito-technical-sm text-tertiary">{summary}</span>
      </div>

      {items.length ? (
        <>
          <div className="relative">
            <div
              className="relative z-10 flex h-8 overflow-hidden rounded-md border border-hairline bg-background/25 sm:h-9"
              aria-label={ariaLabel}
            >
              {items.map((item, index) => {
                const colors = segmentColorMeta(item.semanticKind, item.target);
                const isActive = activeIndex === index;
                const hasActive = activeIndex != null;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onBlur={() => setActiveIndex(null)}
                    onClick={() => setActiveIndex(index)}
                    onFocus={() => setActiveIndex(index)}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                    onPointerEnter={() => setActiveIndex(index)}
                    onPointerLeave={() => setActiveIndex(null)}
                    className={cn(
                      "relative min-w-0 cursor-default appearance-none overflow-hidden p-0 transition-[flex-grow,opacity,transform,box-shadow] duration-200 first:rounded-l-md last:rounded-r-md hover:flex-grow-[1.08] focus-visible:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring",
                      isActive && "z-10 -translate-y-px",
                    )}
                    style={{
                      flexGrow: Math.max(item.weight, 1),
                      flexBasis: 0,
                      background: colors.color,
                      boxShadow: isActive
                        ? `${colors.glow}, inset 0 0 0 1px color-mix(in oklch, ${colors.border} 72%, var(--color-foreground) 16%)`
                        : undefined,
                      opacity: hasActive && !isActive ? 0.34 : 1,
                    }}
                    aria-label={`${item.title}, ${item.metric}`}
                  >
                    <span
                      className="absolute inset-0 flex items-center justify-center truncate px-0 text-[9px] font-semibold leading-none sm:text-[10px]"
                      style={{
                        color: colors.foreground,
                        textShadow: "0 1px 1px color-mix(in oklch, black 22%, transparent)",
                      }}
                    >
                      {item.barLabel}
                    </span>
                  </button>
                );
              })}
            </div>
            {activeItem && activeColors && activePosition != null && (
              <TimelineTooltip
                align={tooltipAlign(activeIndex ?? 0, items.length)}
                color={activeColors.color}
                item={activeItem}
                leftPercent={activePosition}
              />
            )}
          </div>

          <ol
            className={cn(
              "mt-5",
              density === "compact" ? "hito-row-group" : "grid gap-x-3 gap-y-1",
            )}
          >
            {items.map((item, index) => {
              const colors = segmentColorMeta(item.semanticKind, item.target);
              const isActive = activeIndex === index;
              const readbackEntries = item.readbackEntries ?? [];

              return (
                <li
                  key={item.id}
                  className={cn(
                    density === "compact"
                      ? "hito-list-row"
                      : "flex items-center rounded-xl bg-background p-4",
                    "justify-start gap-4 transition-colors",
                    isActive && "bg-foreground/[0.085]",
                  )}
                >
                  <span className="hito-technical-sm text-tertiary w-6 text-right">
                    {String(index + 1).padStart(2, "0")}
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
                      <span className="hito-body-md text-foreground">{item.kindLabel}</span>
                      {item.detailLabel ? (
                        <span className="hito-body-xs text-tertiary">{item.detailLabel}</span>
                      ) : null}
                    </div>
                    {readbackEntries.length > 0 && (
                      <div className="hito-body-xs text-tertiary mt-0.5 space-x-3">
                        {readbackEntries.map((entry) => (
                          <span key={entry.key}>
                            <span className="opacity-60">{entry.label}:</span>{" "}
                            <span className="text-text-secondary">{entry.value}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="hito-technical-sm text-tertiary">{item.metric}</span>
                </li>
              );
            })}
          </ol>
        </>
      ) : (
        <div className="hito-list-row items-start">
          <span className="hito-status-pill mt-0.5 shrink-0" data-tone="muted">
            {emptyState?.badge ?? "Empty"}
          </span>
          <p className="hito-body-sm mt-1 text-secondary min-w-0">
            {emptyState?.copy ?? "No running parts to preview."}
          </p>
        </div>
      )}
    </div>
  );
}

function TimelineTooltip({
  align,
  color,
  item,
  leftPercent,
}: {
  align: "left" | "center" | "right";
  color: string;
  item: WorkoutStructureTimelineItem;
  leftPercent: number;
}) {
  const readbackEntries = item.tooltipReadbackEntries ?? item.readbackEntries ?? [];

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
        <span className="hito-tooltip-title">{item.title}</span>
      </span>
      <span className="hito-tooltip-meta mt-1 block font-mono-num">{item.metric}</span>
      {readbackEntries.length > 0 && (
        <span className="hito-tooltip-meta mt-1.5 block space-y-0.5">
          {readbackEntries.map((entry) => (
            <span key={entry.key} className="block">
              <span className="opacity-65">{entry.label}:</span> <span>{entry.value}</span>
            </span>
          ))}
        </span>
      )}
    </span>
  );
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

function itemCenterPercent(items: WorkoutStructureTimelineItem[], index: number) {
  const total = items.reduce((sum, item) => sum + Math.max(item.weight, 1), 0);
  if (!total) {
    return 50;
  }

  const start = items.slice(0, index).reduce((sum, item) => sum + Math.max(item.weight, 1), 0);
  const center = start + Math.max(items[index].weight, 1) / 2;
  return Math.min(96, Math.max(4, (center / total) * 100));
}

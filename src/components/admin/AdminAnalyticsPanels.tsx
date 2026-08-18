import type { ReactNode } from "react";
import { formatCount, formatDateTime, formatKey } from "@/components/admin/admin-analytics-format";
import { Icon } from "@/components/ui/icon";
import type { AdminAnalyticsKeyCount } from "@/lib/admin-analytics";

export function AnalyticsPanel({
  description,
  generatedAt,
  children,
}: {
  description: string;
  generatedAt?: string;
  children: ReactNode;
}) {
  return (
    <div className="hito-analytics-section">
      <div className="grid gap-2">
        <p className="hito-body-md max-w-3xl text-muted-foreground">{description}</p>
        {generatedAt ? (
          <p className="hito-technical-sm text-secondary">
            Snapshot generated <time dateTime={generatedAt}>{formatDateTime(generatedAt)}</time>
          </p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function AnalyticsGroup({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="hito-analytics-group">
      <div className="grid gap-2">
        <h2 className="hito-ui-title-xs">{title}</h2>
        {description ? (
          <p className="hito-body-sm max-w-3xl text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function NumericFacts({ children }: { children: ReactNode }) {
  return <div className="hito-analytics-facts">{children}</div>;
}

export function NumericFact({
  label,
  value,
  helper,
  tone = "neutral",
}: {
  label: string;
  value: number;
  helper?: string;
  tone?: "neutral" | "warning";
}) {
  return (
    <div className="hito-analytics-fact" data-tone={tone === "warning" ? tone : undefined}>
      <div className="grid gap-1">
        <span className="hito-label-md text-muted-foreground">{label}</span>
        {helper ? <span className="hito-body-xs text-secondary">{helper}</span> : null}
      </div>
      <span className="hito-analytics-value">{formatCount(value)}</span>
    </div>
  );
}

export function MetricState({
  label,
  status,
  description,
}: {
  label: string;
  status: string;
  description: string;
}) {
  return (
    <div className="hito-state-surface p-4" data-size="md" data-tone="warning">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="hito-label-md text-foreground">{label}</span>
        <span className="hito-status-pill" data-tone="warning">
          {status}
        </span>
      </div>
      <p className="hito-body-xs mt-2 text-secondary">{description}</p>
    </div>
  );
}

export function KeyCountList({
  title,
  items,
  emptyDescription,
}: {
  title: string;
  items: AdminAnalyticsKeyCount[];
  emptyDescription: string;
}) {
  return (
    <div className="grid gap-3">
      <h3 className="hito-label-md text-foreground">{title}</h3>
      {items.length === 0 ? (
        <p className="hito-body-xs text-secondary">{emptyDescription}</p>
      ) : (
        <div className="grid gap-2">
          {items.map((item) => (
            <div key={item.key} className="hito-analytics-list-item hito-analytics-list-item-split">
              <span className="hito-body-md text-muted-foreground">{formatKey(item.key)}</span>
              <span className="hito-technical-sm text-foreground">{formatCount(item.count)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CapabilityUsageList({
  items,
}: {
  items: Array<AdminAnalyticsKeyCount & { usersWithUsage: number }>;
}) {
  if (items.length === 0) {
    return (
      <p className="hito-body-xs text-secondary">
        The capability usage source returned no recorded usage.
      </p>
    );
  }

  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <div key={item.key} className="hito-analytics-list-item">
          <div className="flex items-center justify-between gap-4">
            <span className="hito-body-md text-muted-foreground">{formatKey(item.key)}</span>
            <span className="hito-technical-sm text-foreground">{formatCount(item.count)}</span>
          </div>
          <p className="hito-body-xs mt-1 text-secondary">
            Recorded aggregate usage · {formatCount(item.usersWithUsage)} users with usage
          </p>
        </div>
      ))}
    </div>
  );
}

export function EmptyPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="hito-state-surface p-6" data-size="md" data-tone="signal">
      <div className="flex items-start gap-3">
        <Icon name="user" size="md" className="mt-0.5 text-muted-foreground" />
        <div>
          <h3 className="hito-body-md font-medium text-foreground">{title}</h3>
          <p className="hito-body-xs mt-2 text-secondary">{description}</p>
        </div>
      </div>
    </div>
  );
}

export function BooleanPill({
  value,
  trueLabel,
  falseLabel,
}: {
  value: boolean;
  trueLabel: string;
  falseLabel: string;
}) {
  return (
    <span className="hito-status-pill" data-tone={value ? "success" : "warning"}>
      {value ? trueLabel : falseLabel}
    </span>
  );
}

export function CompactCount({ label, value }: { label: string; value: number }) {
  return (
    <div className="hito-body-md flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="hito-technical-sm text-foreground">{formatCount(value)}</span>
    </div>
  );
}

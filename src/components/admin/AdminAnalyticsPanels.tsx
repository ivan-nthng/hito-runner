import type { ReactNode } from "react";
import { formatCount, formatDateTime, formatKey } from "@/components/admin/admin-analytics-format";
import { Icon } from "@/components/ui/icon";
import type { AdminAnalyticsKeyCount } from "@/lib/admin-analytics";

export function AnalyticsPanel({
  eyebrow,
  title,
  description,
  generatedAt,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  generatedAt?: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-6 pt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="hito-label">{eyebrow}</p>
          <h2 className="hito-modal-title mt-2">{title}</h2>
          <p className="hito-body mt-3 max-w-3xl text-muted-foreground">{description}</p>
        </div>
        {generatedAt ? (
          <div className="grid gap-1 text-left sm:text-right">
            <span className="hito-label">Generated</span>
            <span className="hito-technical-mono text-xs text-muted-foreground">
              {formatDateTime(generatedAt)}
            </span>
          </div>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function MetricGrid({ children }: { children: ReactNode }) {
  return <div className="hito-workbench-summary-grid">{children}</div>;
}

export function MetricCard({
  label,
  value,
  helper,
  tone = "neutral",
}: {
  label: string;
  value: string;
  helper?: string;
  tone?: "neutral" | "success" | "warning";
}) {
  return (
    <div className="hito-analytics-stat">
      <div className="hito-analytics-stat-head">
        <span className="hito-label text-muted-foreground">{label}</span>
        {tone !== "neutral" ? (
          <Icon
            name={tone === "success" ? "check-circle" : "warning"}
            size="xs"
            className="hito-analytics-stat-icon"
            data-tone={tone === "warning" ? "warn" : undefined}
          />
        ) : null}
      </div>
      <div className="hito-analytics-stat-body">
        <span className="hito-analytics-value">{value}</span>
        {helper ? <span className="hito-analytics-unit">{helper}</span> : null}
      </div>
    </div>
  );
}

export function KeyCountList({ title, items }: { title: string; items: AdminAnalyticsKeyCount[] }) {
  return (
    <div className="hito-surface-flat p-4">
      <h3 className="hito-label text-foreground">{title}</h3>
      {items.length === 0 ? (
        <p className="hito-field-helper mt-3">No rows yet.</p>
      ) : (
        <div className="mt-4 grid gap-2">
          {items.map((item) => (
            <div key={item.key} className="hito-analytics-list-item hito-analytics-list-item-split">
              <span className="text-sm text-muted-foreground">{formatKey(item.key)}</span>
              <span className="hito-technical-mono text-sm text-foreground">
                {formatCount(item.count)}
              </span>
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
  return (
    <div className="hito-surface-flat p-4">
      <h3 className="hito-label text-foreground">Capability usage</h3>
      {items.length === 0 ? (
        <p className="hito-field-helper mt-3">No metered capability usage yet.</p>
      ) : (
        <div className="mt-4 grid gap-2">
          {items.map((item) => (
            <div key={item.key} className="hito-analytics-list-item">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">{formatKey(item.key)}</span>
                <span className="hito-technical-mono text-sm text-foreground">
                  {formatCount(item.count)}
                </span>
              </div>
              <p className="hito-field-helper mt-1">
                {formatCount(item.usersWithUsage)} users with usage
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function PipelineStep({ label, value }: { label: string; value: number }) {
  return (
    <div className="hito-analytics-list-item hito-analytics-list-item-spacious">
      <span className="hito-label text-muted-foreground">{label}</span>
      <div className="hito-analytics-value mt-3 text-2xl">{formatCount(value)}</div>
    </div>
  );
}

export function EmptyPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="hito-surface-flat p-6" data-tone="signal">
      <div className="flex items-start gap-3">
        <Icon name="user" size="md" className="mt-0.5 text-muted-foreground" />
        <div>
          <h3 className="hito-body font-medium text-foreground">{title}</h3>
          <p className="hito-field-helper mt-2">{description}</p>
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
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="hito-technical-mono text-foreground">{formatCount(value)}</span>
    </div>
  );
}

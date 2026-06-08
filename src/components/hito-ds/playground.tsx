import type { ReactNode } from "react";

type PlaygroundStatusTone = "signal" | "neutral" | "warning" | "destructive" | "rollout";

export type HitoDsPlaygroundCaptionItem = {
  label: string;
  body: ReactNode;
};

export function HitoDsPlayground({
  body,
  caption,
  controls,
  id,
  label,
  preview,
  status,
  statusTone = "neutral",
  title,
}: {
  body: string;
  caption?: Array<HitoDsPlaygroundCaptionItem>;
  controls: ReactNode;
  id: string;
  label: string;
  preview: ReactNode;
  status?: string;
  statusTone?: PlaygroundStatusTone;
  title: string;
}) {
  return (
    <section id={id} className="ds-section hito-ds-playground-section">
      <div className="hito-specimen-header">
        <div className="max-w-3xl">
          <p className="hito-label hito-label-signal">{label}</p>
          <h2 className="hito-section-title mt-3">{title}</h2>
          <p className="hito-support-copy mt-3 max-w-2xl">{body}</p>
        </div>
        {status ? (
          <span className="hito-status-pill" data-tone={statusTone}>
            {status}
          </span>
        ) : null}
      </div>

      <div className="hito-ds-playground">
        <div className="hito-ds-playground-shell">
          <aside className="hito-ds-playground-controls" aria-label={`${title} controls`}>
            {controls}
          </aside>
          <article className="hito-ds-playground-stage">{preview}</article>
        </div>
        {caption && caption.length > 0 ? (
          <div className="hito-ds-playground-caption" aria-label={`${title} notes`}>
            {caption.map((item) => (
              <div key={item.label} className="hito-ds-playground-caption-item">
                <p className="hito-micro-label">{item.label}</p>
                <div className="hito-list-row-copy">{item.body}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

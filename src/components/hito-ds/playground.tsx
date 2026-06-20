import { type ReactNode, useId, useState } from "react";

import { HitoMetadataTag } from "@/components/ui/metadata-tag";

type PlaygroundStatusTone = "signal" | "neutral" | "warning" | "destructive" | "rollout";
type HitoDsWorkbenchTab = "demo" | "variants";

export type HitoDsPlaygroundCaptionItem = {
  label: string;
  body: ReactNode;
};

export function HitoDsPlayground({
  body,
  caption,
  controls,
  defaultTab = "demo",
  demo,
  id,
  label,
  preview,
  status,
  statusTone = "neutral",
  title,
  variants,
}: {
  body: string;
  caption?: Array<HitoDsPlaygroundCaptionItem>;
  controls: ReactNode;
  defaultTab?: HitoDsWorkbenchTab;
  demo?: ReactNode;
  id: string;
  label: string;
  preview?: ReactNode;
  status?: string;
  statusTone?: PlaygroundStatusTone;
  title: string;
  variants?: ReactNode;
}) {
  const tabId = useId();
  const hasWorkbenchTabs = demo !== undefined && variants !== undefined;
  const [activeTab, setActiveTab] = useState<HitoDsWorkbenchTab>(defaultTab);
  const stageContent = hasWorkbenchTabs ? (activeTab === "demo" ? demo : variants) : preview;
  const workbenchMode = hasWorkbenchTabs ? activeTab : "demo";

  return (
    <section id={id} className="ds-section hito-ds-playground-section">
      <div className="hito-specimen-header">
        <div className="max-w-3xl">
          <p className="hito-label hito-label-signal">{label}</p>
          <h2 className="hito-section-title mt-3">{title}</h2>
          <p className="hito-support-copy mt-3 max-w-2xl">{body}</p>
        </div>
        {status ? <HitoMetadataTag tone={statusTone}>{status}</HitoMetadataTag> : null}
      </div>

      <div className="hito-ds-playground" data-mode={workbenchMode}>
        {hasWorkbenchTabs ? (
          <div className="hito-ds-playground-tabs">
            <div
              className="hito-tabs hito-tabs-simple"
              role="tablist"
              aria-label={`${title} specimen modes`}
            >
              {(["demo", "variants"] as const).map((tab) => {
                const selected = activeTab === tab;
                const tabLabel = tab === "demo" ? "Demo" : "Variants";

                return (
                  <button
                    key={tab}
                    id={`${tabId}-${tab}-tab`}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls={`${tabId}-${tab}-panel`}
                    className="hito-tab"
                    data-active={selected ? "true" : undefined}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tabLabel}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
        <div className="hito-ds-playground-shell" data-mode={workbenchMode}>
          <article className="hito-ds-playground-stage" data-mode={workbenchMode}>
            <div
              id={hasWorkbenchTabs ? `${tabId}-${activeTab}-panel` : undefined}
              role={hasWorkbenchTabs ? "tabpanel" : undefined}
              aria-labelledby={hasWorkbenchTabs ? `${tabId}-${activeTab}-tab` : undefined}
              className="hito-ds-playground-panel"
              data-mode={workbenchMode}
            >
              {stageContent}
            </div>
          </article>
          <aside
            className="hito-ds-playground-controls"
            data-mode={workbenchMode}
            aria-label={`${title} controls`}
          >
            {controls}
          </aside>
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

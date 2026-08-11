import { type ReactNode, useEffect, useState } from "react";

import { HitoMetadataTag } from "@/components/ui/metadata-tag";
import { useHitoTabs } from "@/components/ui/hito-tabs";

type PlaygroundStatusTone = "signal" | "neutral" | "warning" | "destructive" | "rollout";
type HitoDsWorkbenchTab = "demo" | "variants";
type HitoDsPlaygroundAnchor = {
  id: string;
  label: string;
  tab?: HitoDsWorkbenchTab;
};

type HitoDsPlaygroundDescription = {
  purpose: string;
  useWhen: string;
  avoidWhen: string;
  accessibility: string;
};

export function HitoDsPlayground({
  anchors,
  controls,
  defaultTab = "demo",
  demo,
  description,
  id,
  label,
  preview,
  status,
  statusTone = "neutral",
  usedIn,
  variants,
}: {
  anchors?: readonly HitoDsPlaygroundAnchor[];
  controls: ReactNode;
  defaultTab?: HitoDsWorkbenchTab;
  demo?: ReactNode;
  description: HitoDsPlaygroundDescription;
  id: string;
  label: string;
  preview?: ReactNode;
  status?: string;
  statusTone?: PlaygroundStatusTone;
  usedIn?: ReactNode;
  variants?: ReactNode;
}) {
  const hasWorkbenchTabs = demo !== undefined && variants !== undefined;
  const [activeTab, setActiveTab] = useState<HitoDsWorkbenchTab>(defaultTab);
  const workbenchTabs = useHitoTabs({
    items: [{ value: "demo" }, { value: "variants" }],
    value: activeTab,
  });
  const stageContent = hasWorkbenchTabs ? (activeTab === "demo" ? demo : variants) : preview;
  const workbenchMode = hasWorkbenchTabs ? activeTab : "demo";

  useEffect(() => {
    if (!hasWorkbenchTabs || !anchors?.length || typeof window === "undefined") {
      return;
    }

    const activateHashExample = () => {
      const activeAnchor = anchors.find((anchor) => `#${anchor.id}` === window.location.hash);
      if (activeAnchor?.tab) {
        setActiveTab(activeAnchor.tab);
      }
    };

    activateHashExample();
    window.addEventListener("hashchange", activateHashExample);
    return () => window.removeEventListener("hashchange", activateHashExample);
  }, [anchors, hasWorkbenchTabs]);

  return (
    <section id={id} className="ds-section hito-ds-playground-section">
      <div className="hito-specimen-header">
        <div className="max-w-3xl">
          <p className="hito-micro-label">Component</p>
          <h2 className="hito-section-title mt-2">{label}</h2>
          <p className="hito-body-small mt-3">{description.purpose}</p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="hito-micro-label">Use when</dt>
              <dd className="hito-list-row-copy mt-1">{description.useWhen}</dd>
            </div>
            <div>
              <dt className="hito-micro-label">Avoid when</dt>
              <dd className="hito-list-row-copy mt-1">{description.avoidWhen}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="hito-micro-label">Interaction & accessibility</dt>
              <dd className="hito-list-row-copy mt-1">{description.accessibility}</dd>
            </div>
          </dl>
          {usedIn ? (
            <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="hito-micro-label">Used in</span>
              <div className="hito-list-row-copy">{usedIn}</div>
            </div>
          ) : null}
          {anchors?.length ? (
            <div className="hito-specimen-links mt-4" aria-label={`${label} examples`}>
              {anchors.map((anchor) => (
                <a
                  key={anchor.id}
                  id={anchor.id}
                  href={`#${anchor.id}`}
                  className="hito-specimen-link"
                  onClick={() => {
                    if (anchor.tab) {
                      setActiveTab(anchor.tab);
                    }
                  }}
                >
                  {anchor.label}
                </a>
              ))}
            </div>
          ) : null}
        </div>
        {status ? <HitoMetadataTag tone={statusTone}>{status}</HitoMetadataTag> : null}
      </div>

      <div className="hito-ds-playground" data-mode={workbenchMode}>
        {hasWorkbenchTabs ? (
          <div className="hito-ds-playground-tabs">
            <div
              className="hito-tabs hito-tabs-simple"
              {...workbenchTabs.tabListProps}
              aria-label={`${label} specimen modes`}
            >
              {(["demo", "variants"] as const).map((tab) => {
                const selected = activeTab === tab;
                const tabLabel = tab === "demo" ? "Demo" : "Variants";

                return (
                  <button
                    key={tab}
                    type="button"
                    {...workbenchTabs.getTabProps(tab)}
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
              {...(hasWorkbenchTabs ? workbenchTabs.getPanelProps(activeTab) : {})}
              className="hito-ds-playground-panel"
              data-mode={workbenchMode}
            >
              {stageContent}
            </div>
          </article>
          <aside
            className="hito-ds-playground-controls"
            data-mode={workbenchMode}
            aria-label={`${label} details`}
          >
            {controls}
          </aside>
        </div>
      </div>
    </section>
  );
}

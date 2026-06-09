import type { ReactNode } from "react";

type SpecimenStatus = "Core" | "Pattern" | "Exception" | "Legacy" | "In rollout";
type SpecimenStatusTone = "signal" | "neutral" | "warning" | "destructive" | "rollout";

export function SectionIntro({
  label,
  title,
  body,
}: {
  label: string;
  title: string;
  body: string;
}) {
  return (
    <div className="hito-section-header">
      <div>
        <p className="hito-label hito-label-signal">{label}</p>
        <h2 className="hito-section-title mt-3">{title}</h2>
        <p className="hito-support-copy mt-3 max-w-2xl">{body}</p>
      </div>
    </div>
  );
}

export function ReferenceRow({ title, body }: { title: string; body: string }) {
  return (
    <article className="hito-reference-row">
      <h2 className="hito-panel-title">{title}</h2>
      <p className="hito-support-copy max-w-2xl">{body}</p>
    </article>
  );
}

export function ReferenceListRow({
  label,
  title,
  body,
}: {
  label: string;
  title: string;
  body: string;
}) {
  return (
    <div className="hito-list-row items-start">
      <div>
        <p className="hito-label">{label}</p>
        <p className="hito-list-row-title mt-2">{title}</p>
        <p className="hito-list-row-copy">{body}</p>
      </div>
    </div>
  );
}

export function SpecimenSection({
  id,
  label,
  title,
  body,
  status = "Core",
  preview,
  controls,
  contract,
  children,
}: {
  id: string;
  label: string;
  title: string;
  body: string;
  status?: SpecimenStatus;
  preview: ReactNode;
  controls: ReactNode;
  contract: Array<{ label: string; body: ReactNode }>;
  children?: ReactNode;
}) {
  const statusTone = getSpecimenStatusTone(status);

  return (
    <section id={id} className="ds-section">
      <div className="hito-specimen-header">
        <SectionIntro label={label} title={title} body={body} />
        <span className="hito-status-pill" data-tone={statusTone}>
          {status}
        </span>
      </div>
      <div className="hito-specimen">
        <div className="hito-specimen-grid">
          <article className="hito-specimen-preview">{preview}</article>
          <aside className="hito-specimen-controls" aria-label={`${title} controls`}>
            {controls}
          </aside>
        </div>
        <div className="hito-specimen-contract">
          {contract.map((row) => (
            <div key={row.label} className="hito-specimen-contract-row">
              <p className="hito-micro-label">{row.label}</p>
              <div className="hito-list-row-copy">{row.body}</div>
            </div>
          ))}
        </div>
      </div>
      {children}
    </section>
  );
}

export function ProductLinks({ links }: { links: Array<{ href: string; label: string }> }) {
  return (
    <span className="hito-specimen-links">
      {links.map((link) => (
        <a key={link.href} href={link.href} className="hito-specimen-link">
          {link.label}
        </a>
      ))}
    </span>
  );
}

function getSpecimenStatusTone(status: SpecimenStatus): SpecimenStatusTone {
  switch (status) {
    case "Core":
      return "signal";
    case "Pattern":
      return "neutral";
    case "Exception":
      return "warning";
    case "Legacy":
      return "destructive";
    case "In rollout":
      return "rollout";
  }
}

import type { ReactNode } from "react";

export function SectionIntro({
  label,
  title,
  body,
}: {
  label: string;
  title: string;
  body?: string;
}) {
  return (
    <div className="hito-section-header">
      <div>
        <p className="hito-label-md hito-label-signal">{label}</p>
        <h2 className="hito-ui-title-sm mt-3">{title}</h2>
        {body ? <p className="hito-body-md text-secondary mt-3 max-w-2xl">{body}</p> : null}
      </div>
    </div>
  );
}

export function ReferenceListRow({
  label,
  title,
  body,
}: {
  label: string;
  title: string;
  body: ReactNode;
}) {
  return (
    <div className="hito-list-row items-start">
      <div>
        <p className="hito-label-md">{label}</p>
        <p className="hito-list-row-title mt-2">{title}</p>
        <div className="hito-list-row-copy">{body}</div>
      </div>
    </div>
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

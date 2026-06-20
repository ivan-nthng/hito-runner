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

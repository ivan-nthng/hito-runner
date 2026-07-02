import { Icon } from "@/components/ui/icon";
import {
  getHitoDsPageIndex,
  HITO_DS_PAGES,
  SUPPORT_SECTIONS,
  type HitoDsPageId,
} from "./reference-model";

export function HitoDsNestedNav({
  idPrefix,
  activePageId,
  onNavigate,
}: {
  idPrefix: string;
  activePageId: HitoDsPageId;
  onNavigate?: () => void;
}) {
  return (
    <nav className="hito-ds-sidebar-tree" aria-label="Hito DS pages">
      {HITO_DS_PAGES.map((page) => {
        const pageActive = activePageId === page.id;
        const childrenId = `${idPrefix}-${page.id}-sections`;
        return (
          <div key={page.id} className="hito-ds-sidebar-group">
            <a
              href={page.path}
              className="hito-ds-sidebar-link hito-nav-text"
              data-active={pageActive ? "true" : undefined}
              aria-current={pageActive ? "page" : undefined}
              onClick={onNavigate}
            >
              <span className="hito-ds-sidebar-link-marker" aria-hidden="true" />
              <span className="hito-ds-sidebar-link-label">{page.label}</span>
            </a>

            {pageActive ? (
              <div
                id={childrenId}
                className="hito-ds-sidebar-children"
                role="group"
                aria-label={`${page.label} sections`}
              >
                {page.sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="hito-ds-sidebar-child-link"
                    onClick={onNavigate}
                  >
                    {section.label}
                  </a>
                ))}
                {page.id === "overview"
                  ? SUPPORT_SECTIONS.map((section) => (
                      <a
                        key={section.id}
                        href={`#${section.id}`}
                        className="hito-ds-sidebar-child-link"
                        onClick={onNavigate}
                      >
                        {section.label}
                      </a>
                    ))
                  : null}
              </div>
            ) : null}
          </div>
        );
      })}
      <a
        href="/hitoDS/export/figma"
        className="hito-ds-sidebar-link hito-nav-text"
        onClick={onNavigate}
      >
        <span className="hito-ds-sidebar-link-marker" aria-hidden="true" />
        <span className="hito-ds-sidebar-link-label">Figma export</span>
      </a>
    </nav>
  );
}

export function HitoDsPagePager({ currentPageId }: { currentPageId: HitoDsPageId }) {
  const pageIndex = getHitoDsPageIndex(currentPageId);
  const previousPage = pageIndex > 0 ? HITO_DS_PAGES[pageIndex - 1] : null;
  const nextPage = pageIndex >= 0 ? HITO_DS_PAGES[pageIndex + 1] : null;

  if (!previousPage && !nextPage) {
    return null;
  }

  return (
    <nav
      className="hito-reference-note mt-10 grid gap-3 p-4 sm:grid-cols-2"
      aria-label="Hito DS page navigation"
    >
      {previousPage ? (
        <a href={previousPage.path} className="hito-button hito-button-secondary hito-button-md">
          <Icon name="chevron-left" size="sm" decorative />
          Previous: {previousPage.label}
        </a>
      ) : (
        <span />
      )}
      {nextPage ? (
        <a
          href={nextPage.path}
          className="hito-button hito-button-primary hito-button-md sm:justify-self-end"
        >
          Next: {nextPage.label}
          <Icon name="chevron-right" size="sm" decorative />
        </a>
      ) : null}
    </nav>
  );
}

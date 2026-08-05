import { useEffect, useMemo, useState } from "react";

import { Icon } from "@/components/ui/icon";
import { HitoButton } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getHitoDsPageIndex, HITO_DS_PAGES, type HitoDsPageId } from "./reference-model";

export function HitoDsNestedNav({
  idPrefix,
  activePageId,
  onNavigate,
}: {
  idPrefix: string;
  activePageId: HitoDsPageId;
  onNavigate?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [expandedPageIds, setExpandedPageIds] = useState<Set<HitoDsPageId>>(
    () => new Set([activePageId]),
  );
  const normalizedQuery = query.trim().toLowerCase();
  const matchingPages = useMemo(
    () =>
      HITO_DS_PAGES.map((page) => {
        const pageMatches = page.label.toLowerCase().includes(normalizedQuery);
        const sections = normalizedQuery
          ? page.sections.filter((section) =>
              [section.label, ...section.keywords].some((value) =>
                value.toLowerCase().includes(normalizedQuery),
              ),
            )
          : page.sections;

        return {
          page,
          sections: pageMatches ? page.sections : sections,
          visible: !normalizedQuery || pageMatches || sections.length > 0,
        };
      }),
    [normalizedQuery],
  );
  const hasMatches = matchingPages.some(({ visible }) => visible);

  useEffect(() => {
    setExpandedPageIds((current) => {
      if (current.has(activePageId)) {
        return current;
      }

      return new Set([...current, activePageId]);
    });
  }, [activePageId]);

  const togglePage = (pageId: HitoDsPageId) => {
    setExpandedPageIds((current) => {
      const next = new Set(current);
      if (next.has(pageId)) {
        next.delete(pageId);
      } else {
        next.add(pageId);
      }
      return next;
    });
  };

  return (
    <nav className="hito-ds-sidebar-tree" aria-label="Hito DS pages">
      <div className="hito-ds-sidebar-search">
        <Input
          type="search"
          value={query}
          aria-label="Find in Hito DS"
          placeholder="Find a component"
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape" && query) {
              event.preventDefault();
              setQuery("");
            }
          }}
        />
      </div>

      {matchingPages.map(({ page, sections, visible }) => {
        if (!visible) {
          return null;
        }

        const pageActive = activePageId === page.id;
        const childrenId = `${idPrefix}-${page.id}-sections`;
        const expanded = normalizedQuery ? true : expandedPageIds.has(page.id);

        return (
          <div key={page.id} className="hito-ds-sidebar-group">
            <div className="hito-ds-sidebar-group-row">
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
              <button
                type="button"
                className="hito-ds-sidebar-toggle"
                aria-expanded={expanded}
                aria-controls={childrenId}
                aria-label={
                  normalizedQuery
                    ? `${page.label} expanded for search`
                    : `${expanded ? "Collapse" : "Expand"} ${page.label}`
                }
                disabled={Boolean(normalizedQuery)}
                onClick={() => togglePage(page.id)}
              >
                <Icon
                  name="chevron-down"
                  size="xs"
                  decorative
                  className="hito-ds-sidebar-chevron"
                  data-open={expanded ? "true" : undefined}
                />
              </button>
            </div>

            <div
              id={childrenId}
              className="hito-ds-sidebar-children"
              role="group"
              aria-label={`${page.label} sections`}
              hidden={!expanded}
            >
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`${page.path}#${section.id}`}
                  className="hito-ds-sidebar-child-link"
                  onClick={onNavigate}
                >
                  {section.label}
                </a>
              ))}
            </div>
          </div>
        );
      })}

      {!hasMatches ? (
        <p className="hito-caption px-3 py-2" role="status">
          No matching components.
        </p>
      ) : null}
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
        <HitoButton asChild size="md" variant="secondary">
          <a href={previousPage.path}>
            <Icon name="chevron-left" size="sm" decorative />
            Previous: {previousPage.label}
          </a>
        </HitoButton>
      ) : (
        <span />
      )}
      {nextPage ? (
        <HitoButton asChild size="md" variant="primary" className="sm:justify-self-end">
          <a href={nextPage.path}>
            Next: {nextPage.label}
            <Icon name="chevron-right" size="sm" decorative />
          </a>
        </HitoButton>
      ) : null}
    </nav>
  );
}

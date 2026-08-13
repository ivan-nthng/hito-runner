import { useEffect, useMemo, useState } from "react";

import { Icon } from "@/components/ui/icon";
import { HitoButton } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getHitoDsPageIndex,
  HITO_DS_NAV_ITEMS,
  HITO_DS_PAGES,
  type HitoDsNavDestination,
  type HitoDsNavItem,
  type HitoDsPageId,
} from "./reference-model";

function destinationMatches(destination: HitoDsNavDestination, query: string) {
  return [destination.label, ...destination.keywords].some((value) =>
    value.toLowerCase().includes(query),
  );
}

function itemContainsHref(item: HitoDsNavItem, href: string) {
  return item.kind === "link"
    ? item.href === href
    : item.children.some((child) => child.href === href);
}

export function HitoDsNestedNav({
  idPrefix,
  activeHref,
  onNavigate,
  onQueryChange,
}: {
  idPrefix: string;
  activeHref: string;
  onNavigate?: () => void;
  onQueryChange?: (query: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(() => {
    const activeGroup = HITO_DS_NAV_ITEMS.find(
      (item) => item.kind === "group" && itemContainsHref(item, activeHref),
    );
    return activeGroup ? new Set([activeGroup.id]) : new Set();
  });
  const [searchCollapsedGroupIds, setSearchCollapsedGroupIds] = useState<Set<string>>(
    () => new Set(),
  );
  const normalizedQuery = query.trim().toLowerCase();

  const matchingItems = useMemo(
    () =>
      HITO_DS_NAV_ITEMS.map((item) => {
        if (item.kind === "link") {
          return {
            item,
            children: [] as readonly HitoDsNavDestination[],
            visible: !normalizedQuery || destinationMatches(item, normalizedQuery),
          };
        }

        const groupMatches = [item.label, ...item.keywords].some((value) =>
          value.toLowerCase().includes(normalizedQuery),
        );
        const matchingChildren = normalizedQuery
          ? item.children.filter((child) => destinationMatches(child, normalizedQuery))
          : item.children;

        return {
          item,
          children: groupMatches ? item.children : matchingChildren,
          visible: !normalizedQuery || groupMatches || matchingChildren.length > 0,
        };
      }),
    [normalizedQuery],
  );
  const hasMatches = matchingItems.some(({ visible }) => visible);

  useEffect(() => {
    const activeGroup = HITO_DS_NAV_ITEMS.find(
      (item) => item.kind === "group" && itemContainsHref(item, activeHref),
    );
    if (!activeGroup) {
      return;
    }

    setExpandedGroupIds((current) => {
      if (current.has(activeGroup.id)) {
        return current;
      }
      return new Set([...current, activeGroup.id]);
    });
  }, [activeHref]);

  useEffect(() => {
    setSearchCollapsedGroupIds(new Set());
  }, [normalizedQuery]);

  const toggleGroup = (groupId: string) => {
    const setter = normalizedQuery ? setSearchCollapsedGroupIds : setExpandedGroupIds;
    setter((current) => {
      const next = new Set(current);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  return (
    <nav
      className="hito-ds-sidebar-tree"
      aria-label="Hito DS pages"
      onKeyDown={(event) => {
        if (event.key === "Escape" && query) {
          event.preventDefault();
          event.stopPropagation();
          event.currentTarget.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
          setQuery("");
          onQueryChange?.("");
        }
      }}
    >
      <div className="hito-ds-sidebar-search">
        <Input
          type="search"
          value={query}
          aria-label="Find in Hito DS"
          placeholder="Find a component"
          onChange={(event) => {
            setQuery(event.target.value);
            onQueryChange?.(event.target.value);
          }}
        />
      </div>

      {matchingItems.map(({ item, children, visible }) => {
        if (!visible) {
          return null;
        }

        if (item.kind === "link") {
          const active = item.href === activeHref;
          return (
            <a
              key={item.id}
              href={item.href}
              className="hito-ds-sidebar-link hito-nav-text"
              data-active={active ? "true" : undefined}
              aria-current={active ? "page" : undefined}
              onClick={onNavigate}
            >
              <span className="hito-ds-sidebar-link-marker" aria-hidden="true" />
              <span className="hito-ds-sidebar-link-label">{item.label}</span>
            </a>
          );
        }

        const groupButtonId = `${idPrefix}-${item.id}-button`;
        const childrenId = `${idPrefix}-${item.id}-destinations`;
        const groupActive = itemContainsHref(item, activeHref);
        const expanded = normalizedQuery
          ? !searchCollapsedGroupIds.has(item.id)
          : expandedGroupIds.has(item.id);

        return (
          <div key={item.id} className="hito-ds-sidebar-group">
            <button
              id={groupButtonId}
              type="button"
              className="hito-ds-sidebar-link hito-ds-sidebar-group-button hito-nav-text"
              data-active={groupActive ? "true" : undefined}
              aria-expanded={expanded}
              aria-controls={childrenId}
              onClick={() => toggleGroup(item.id)}
            >
              <span className="hito-ds-sidebar-link-marker" aria-hidden="true" />
              <span className="hito-ds-sidebar-link-label">{item.label}</span>
              <Icon
                name="chevron-down"
                size="xs"
                decorative
                className="hito-ds-sidebar-chevron"
                data-open={expanded ? "true" : undefined}
              />
            </button>

            <div
              id={childrenId}
              className="hito-ds-sidebar-children"
              role="group"
              aria-labelledby={groupButtonId}
              hidden={!expanded}
            >
              {children.map((child) => {
                const childActive = child.href === activeHref;
                return (
                  <a
                    key={child.id}
                    href={child.href}
                    className="hito-ds-sidebar-child-link"
                    data-active={childActive ? "true" : undefined}
                    aria-current={childActive ? "location" : undefined}
                    onClick={onNavigate}
                  >
                    {child.label}
                  </a>
                );
              })}
            </div>
          </div>
        );
      })}

      {!hasMatches ? (
        <p className="hito-body-xs text-tertiary px-3 py-2" role="status" aria-live="polite">
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

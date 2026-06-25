"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon, type HitoIconName } from "@/components/ui/icon";
import { HitoMetadataTag } from "@/components/ui/metadata-tag";
import { cn } from "@/lib/utils";

export type AdminSortDirection = "asc" | "desc";

export type AdminDataTableActiveFilter = {
  id: string;
  label: string;
  onRemove: () => void;
  value: string;
};

export type AdminDataTableColumnSortOption<SortKey extends string> = {
  direction: AdminSortDirection;
  key: SortKey;
  label: string;
};

export type AdminDataTableColumnFilterOption = {
  label: string;
  value: string;
};

export type AdminDataTableToolbarFilterSection = {
  currentValue: string;
  label: string;
  onSelect: (value: string) => void;
  options: Array<{ value: string; label: string }>;
};

type AdminDataTableToolbarProps = {
  activeFilters: AdminDataTableActiveFilter[];
  className?: string;
  clearAllFilters?: () => void;
  clearAllFiltersMinCount?: number;
  filterAriaSubject?: string;
  filterButtonAriaLabel?: string;
  filterSections?: AdminDataTableToolbarFilterSection[];
  onQueryChange: (value: string) => void;
  query: string;
  rowCountLabel: string;
  searchClearHref?: string;
  searchLabel: string;
  searchPlaceholder: string;
  searchValue?: string;
  variant?: "data-table" | "admin";
};

export function AdminDataTableToolbar({
  activeFilters,
  className,
  clearAllFilters,
  clearAllFiltersMinCount = 2,
  filterAriaSubject = "table filters",
  filterButtonAriaLabel,
  filterSections = [],
  onQueryChange,
  query,
  rowCountLabel,
  searchClearHref,
  searchLabel,
  searchPlaceholder,
  searchValue,
  variant = "data-table",
}: AdminDataTableToolbarProps) {
  const resolvedSearchValue = searchValue ?? query;
  const [searchOpen, setSearchOpen] = useState(Boolean(resolvedSearchValue));
  const isSearchOpen = searchOpen || query.length > 0 || resolvedSearchValue.length > 0;
  const activeCount = activeFilters.length;
  const hasFilterSections = filterSections.length > 0;
  const filterButtonDisabled = activeCount === 0 && !hasFilterSections;
  const toolbarClassName =
    variant === "admin" ? "hito-admin-utility-row" : "hito-data-table-utility-row";

  return (
    <div className={cn(toolbarClassName, className)}>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {isSearchOpen ? (
          <label className="hito-field hito-field-sm hito-data-table-search">
            <span className="sr-only">{searchLabel}</span>
            <Icon name="search" size="xs" className="text-muted-foreground" />
            <input
              autoFocus
              className="hito-data-table-search-input"
              onBlur={() => {
                if (!resolvedSearchValue) {
                  setSearchOpen(false);
                }
              }}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder={searchPlaceholder}
              type="search"
              value={resolvedSearchValue}
            />
            {resolvedSearchValue ? (
              searchClearHref ? (
                <a
                  aria-label={`Clear ${searchLabel.toLowerCase()}`}
                  className="hito-button hito-button-ghost hito-button-xs hito-data-table-search-clear"
                  href={searchClearHref}
                  onMouseDown={(event) => event.preventDefault()}
                >
                  <Icon name="close" size="xs" />
                </a>
              ) : (
                <button
                  type="button"
                  aria-label={`Clear ${searchLabel.toLowerCase()}`}
                  className="hito-button hito-button-ghost hito-button-xs hito-data-table-search-clear"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => onQueryChange("")}
                >
                  <Icon name="close" size="xs" />
                </button>
              )
            ) : null}
          </label>
        ) : (
          <button
            type="button"
            aria-label={searchLabel}
            className="hito-button hito-button-secondary hito-button-sm hito-data-table-icon-button"
            onClick={() => setSearchOpen(true)}
          >
            <Icon name="search" size="sm" />
          </button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={filterButtonDisabled}>
            <button
              type="button"
              className="hito-button hito-button-secondary hito-button-sm hito-data-table-filter-summary"
              disabled={filterButtonDisabled}
              aria-label={
                filterButtonAriaLabel ??
                (activeCount > 0
                  ? `${activeCount} active ${filterAriaSubject}`
                  : `No active ${filterAriaSubject}`)
              }
            >
              <Icon name="settings" size="xs" />
              Filters
              {activeCount > 0 ? <span className="hito-tab-badge">{activeCount}</span> : null}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="hito-shell-menu hito-data-table-column-menu hito-data-table-menu-width-wide"
          >
            {activeFilters.length > 0 ? (
              <>
                <DropdownMenuLabel className="hito-micro-label">Active filters</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {activeFilters.map((filter) => (
                  <DropdownMenuItem
                    key={filter.id}
                    className="hito-shell-menu-item hito-data-table-menu-item"
                    onSelect={filter.onRemove}
                  >
                    <Icon name="close" size="xs" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{filter.label}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {filter.value}
                      </span>
                    </span>
                  </DropdownMenuItem>
                ))}
                {clearAllFilters && activeCount >= clearAllFiltersMinCount ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="hito-shell-menu-item hito-data-table-menu-item"
                      onSelect={clearAllFilters}
                    >
                      <Icon name="x-circle" size="xs" />
                      Clear all
                    </DropdownMenuItem>
                  </>
                ) : null}
                {hasFilterSections ? <DropdownMenuSeparator /> : null}
              </>
            ) : null}

            {filterSections.map((section, index) => (
              <FilterSection key={section.label} section={section} showSeparator={index > 0} />
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <p className="hito-field-helper whitespace-nowrap">{rowCountLabel}</p>
    </div>
  );
}

function FilterSection({
  section,
  showSeparator,
}: {
  section: AdminDataTableToolbarFilterSection;
  showSeparator: boolean;
}) {
  return (
    <>
      {showSeparator ? <DropdownMenuSeparator /> : null}
      <DropdownMenuLabel className="hito-micro-label">{section.label}</DropdownMenuLabel>
      {section.options.map((option) => (
        <DropdownMenuItem
          key={option.value}
          className="hito-shell-menu-item hito-data-table-menu-item"
          onSelect={() => section.onSelect(option.value)}
        >
          {section.currentValue === option.value ? (
            <Icon name="check" size="xs" className="text-signal" />
          ) : null}
          {option.label}
        </DropdownMenuItem>
      ))}
    </>
  );
}

export function AdminDataTableColumnHeader<SortKey extends string>({
  activeSort,
  column,
  filterActive,
  filterOptions,
  label,
  menuLabel,
  onFilterChange,
  onSort,
  selectedFilter = "all",
  sortOptions,
}: {
  activeSort: { key: SortKey; direction: AdminSortDirection };
  column: SortKey;
  filterActive: boolean;
  filterOptions?: AdminDataTableColumnFilterOption[];
  label: string;
  menuLabel: string;
  onFilterChange?: (value: string) => void;
  onSort: (column: SortKey, direction: AdminSortDirection) => void;
  selectedFilter?: string;
  sortOptions: Array<AdminDataTableColumnSortOption<SortKey>>;
}) {
  const isActive = activeSort.key === column;

  return (
    <th
      scope="col"
      aria-sort={isActive ? (activeSort.direction === "asc" ? "ascending" : "descending") : "none"}
      className="whitespace-nowrap px-2 py-2 font-medium"
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={menuLabel}
            className="hito-button hito-button-ghost hito-button-xs hito-data-table-header-button"
            data-active={isActive || filterActive ? "true" : undefined}
          >
            <span>{label}</span>
            {filterActive ? <span className="hito-data-table-filter-dot" /> : null}
            <Icon
              aria-hidden="true"
              name={isActive && activeSort.direction === "asc" ? "chevron-up" : "chevron-down"}
              size="xs"
              className="hito-data-table-sort-indicator"
              data-active={isActive ? "true" : undefined}
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="hito-shell-menu hito-data-table-column-menu hito-data-table-menu-width-standard"
        >
          <DropdownMenuLabel className="hito-micro-label">Sort</DropdownMenuLabel>
          {sortOptions.map((option) => {
            const optionActive =
              activeSort.key === option.key && activeSort.direction === option.direction;
            return (
              <DropdownMenuItem
                key={`${option.key}-${option.direction}`}
                className="hito-shell-menu-item hito-data-table-menu-item"
                onSelect={() => onSort(option.key, option.direction)}
              >
                <Icon
                  name={optionActive ? "check" : "chevron-right"}
                  size="xs"
                  className={optionActive ? "text-signal" : "text-muted-foreground"}
                />
                {option.label}
              </DropdownMenuItem>
            );
          })}
          {(filterOptions?.length ?? 0) > 0 && onFilterChange ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="hito-micro-label">Filter</DropdownMenuLabel>
              {filterOptions.map((option) => {
                const optionActive = selectedFilter === option.value;
                return (
                  <DropdownMenuItem
                    key={option.value}
                    className="hito-shell-menu-item hito-data-table-menu-item"
                    onSelect={() => onFilterChange(option.value)}
                  >
                    <Icon
                      name={optionActive ? "check" : "chevron-right"}
                      size="xs"
                      className={optionActive ? "text-signal" : "text-muted-foreground"}
                    />
                    {option.label}
                  </DropdownMenuItem>
                );
              })}
              {filterActive ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="hito-shell-menu-item hito-data-table-menu-item"
                    onSelect={() => onFilterChange("all")}
                  >
                    <Icon name="x-circle" size="xs" />
                    Clear filter
                  </DropdownMenuItem>
                </>
              ) : null}
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </th>
  );
}

export function AdminDataTableStaticHeader({ label }: { label: string }) {
  return (
    <th scope="col" className="whitespace-nowrap px-2 py-2 font-medium">
      <span className="hito-data-table-header hito-data-table-header-static" data-disabled="true">
        {label}
      </span>
    </th>
  );
}

export function AdminMetadataMenu({
  displayValue,
  icon,
  label,
  onSelect,
  options,
  tone,
  value,
}: {
  displayValue: string;
  icon?: HitoIconName;
  label: string;
  onSelect: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  tone?: string;
  value: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <HitoMetadataTag asChild interactive tone={tone}>
          <button type="button" aria-label={`${label}: ${displayValue}`}>
            {icon ? <Icon name={icon} size="xs" aria-hidden="true" /> : null}
            {displayValue}
            <Icon name="chevron-down" size="xs" aria-hidden="true" />
          </button>
        </HitoMetadataTag>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="hito-shell-menu hito-data-table-column-menu hito-data-table-menu-width-compact"
      >
        <DropdownMenuLabel className="hito-micro-label">{label}</DropdownMenuLabel>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <DropdownMenuItem
              key={option.value || "unset"}
              className="hito-shell-menu-item hito-data-table-menu-item"
              onSelect={() => onSelect(option.value)}
            >
              {selected ? <Icon name="check" size="xs" className="text-signal" /> : null}
              {option.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

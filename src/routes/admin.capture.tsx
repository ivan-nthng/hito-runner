import { Link, createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HitoLogo } from "@/components/ui/hito-logo";
import { Icon, type HitoIconName } from "@/components/ui/icon";
import { HitoMetadataTag } from "@/components/ui/metadata-tag";
import {
  adminCaptureItemTypes,
  adminCapturePriorities,
  adminCaptureStatuses,
  adminCaptureTargetRoles,
  appendAdminCaptureItemNote,
  createAdminCaptureItem,
  deleteAdminCaptureQuickNote,
  getAdminCaptureCopyPrompt,
  listAdminCaptureBacklog,
  updateAdminCaptureItemTriage,
  type AdminCaptureBacklogView,
  type AdminCaptureItemType,
  type AdminCaptureItemView,
  type AdminCapturePriority,
  type AdminCaptureResult,
  type AdminCaptureStatus,
  type AdminCaptureTargetRole,
} from "@/lib/admin-capture";
import { APP_NAME } from "@/lib/app-config";

type CaptureStatusFilter = AdminCaptureStatus | "all";
type NullableFilter<T extends string> = T | "all";

type CaptureSearch = {
  status: CaptureStatusFilter;
  type: NullableFilter<AdminCaptureItemType>;
  priority: NullableFilter<AdminCapturePriority>;
  role: NullableFilter<AdminCaptureTargetRole>;
  q: string | number;
};

type QuickNoteState = {
  open: boolean;
  itemType: AdminCaptureItemType;
  priority: AdminCapturePriority | "";
  targetRole: AdminCaptureTargetRole | "";
  title: string;
  note: string;
  route: string;
  pending: boolean;
  error: string | null;
  success: string | null;
};

type MutationState = {
  itemId: string | null;
  field: "triage" | "note" | "prompt" | "delete" | null;
  message: string | null;
  tone: "success" | "error" | null;
};

type RepoDerivedInfo = {
  readOnly: boolean;
  sourcePath: string | null;
  sourceType: string | null;
  workItemStatus: string | null;
  markdownStatus: string | null;
  markdownType: string | null;
  markdownPriority: string | null;
  markdownNextRole: string | null;
  missingRequiredFields: string[];
  invalidRequiredFields: string[];
};

const STATUS_FILTERS: Array<{ value: CaptureStatusFilter; label: string }> = [
  { value: "all", label: "Active" },
  { value: "done", label: "Done" },
  { value: "archived", label: "Archived" },
];

const ACTIVE_CAPTURE_STATUSES: AdminCaptureStatus[] = ["new", "in_review", "ready_for_codex"];

const EDITABLE_CAPTURE_STATUS_OPTIONS: Array<{ value: AdminCaptureStatus; label: string }> = [
  { value: "new", label: "new" },
  { value: "done", label: "done" },
  { value: "archived", label: "archived" },
];

const ADMIN_CAPTURE_NAV: Array<{
  label: string;
  icon: HitoIconName;
  href: "/admin/analytics" | "/admin/capture";
  active?: boolean;
}> = [
  { label: "Overview", icon: "activity", href: "/admin/analytics" },
  { label: "Funnel & Usage", icon: "progress", href: "/admin/analytics" },
  { label: "Feedback", icon: "watch", href: "/admin/analytics" },
  { label: "AI & Entitlements", icon: "sparkles", href: "/admin/analytics" },
  { label: "Users", icon: "user", href: "/admin/analytics" },
  { label: "Test accounts", icon: "shield-alert", href: "/admin/analytics" },
  { label: "Backlog", icon: "plan-note", href: "/admin/capture", active: true },
];

const initialQuickNoteState: QuickNoteState = {
  open: false,
  itemType: "context_capture",
  priority: "",
  targetRole: "",
  title: "",
  note: "",
  route: "",
  pending: false,
  error: null,
  success: null,
};

export const Route = createFileRoute("/admin/capture")({
  validateSearch: (search: Record<string, unknown>): CaptureSearch => ({
    status: parseCaptureStatus(search.status),
    type: parseNullableFilter(search.type, adminCaptureItemTypes),
    priority: parseNullableFilter(search.priority, adminCapturePriorities),
    role: parseNullableFilter(search.role, adminCaptureTargetRoles),
    q: parseSearchQuery(search.q),
  }),
  head: () => ({
    meta: [
      { title: `Backlog — ${APP_NAME}` },
      {
        name: "description",
        content: "Internal Hito capture backlog for admin triage and manual Codex handoff.",
      },
    ],
  }),
  loader: async ({ location }) => {
    const search = location.search as CaptureSearch;
    const listInput = {
      itemType: search.type === "all" ? null : search.type,
      priority: search.priority === "all" ? null : search.priority,
      targetRole: search.role === "all" ? null : search.role,
      search: captureQueryText(search.q) || null,
      limit: 100,
    };
    const [result, countsResult] = await Promise.all([
      listAdminCaptureBacklog({
        data: {
          ...listInput,
          status: search.status,
          includeArchived: search.status === "archived" || search.status === "all",
        },
      }),
      listAdminCaptureBacklog({
        data: {
          ...listInput,
          status: "all",
          includeArchived: true,
        },
      }),
    ]);

    if (
      !result.ok &&
      (result.reason === "authentication_required" || result.reason === "admin_required")
    ) {
      throw redirect({
        to: "/admin/login",
        search: {
          next: "/admin/capture",
        },
      });
    }

    return {
      result: result.ok
        ? { ...result, view: filterBacklogViewForStatus(result.view, search.status) }
        : result,
      countsResult,
    };
  },
  pendingComponent: CapturePendingState,
  component: AdminCapturePage,
});

function AdminCapturePage() {
  const { countsResult, result } = Route.useLoaderData();
  const search = Route.useSearch();
  const router = useRouter();
  const createItemFn = useServerFn(createAdminCaptureItem);
  const updateTriageFn = useServerFn(updateAdminCaptureItemTriage);
  const appendNoteFn = useServerFn(appendAdminCaptureItemNote);
  const copyPromptFn = useServerFn(getAdminCaptureCopyPrompt);
  const deleteQuickNoteFn = useServerFn(deleteAdminCaptureQuickNote);
  const [quickNote, setQuickNote] = useState<QuickNoteState>(initialQuickNoteState);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [appendNotes, setAppendNotes] = useState<Record<string, string>>({});
  const [copyFallbackPrompts, setCopyFallbackPrompts] = useState<Record<string, string>>({});
  const [copiedPromptIds, setCopiedPromptIds] = useState<Record<string, boolean>>({});
  const [mutation, setMutation] = useState<MutationState>({
    itemId: null,
    field: null,
    message: null,
    tone: null,
  });

  const activeFilterCount = useMemo(
    () =>
      [
        search.type !== "all",
        search.priority !== "all",
        search.role !== "all",
        Boolean(captureQueryText(search.q)),
      ].filter(Boolean).length,
    [search.priority, search.q, search.role, search.type],
  );

  const clearFiltersHref = buildCaptureHref(search, {
    type: "all",
    priority: "all",
    role: "all",
    q: "",
  });

  const submitQuickNote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const itemType = parseCaptureItemType(formData.get("itemType")) ?? "context_capture";
    const priority = parseOptionalCapturePriority(formData.get("priority"));
    const targetRole = parseOptionalCaptureTargetRole(formData.get("targetRole"));
    const title = getFormText(formData, "title");
    const note = getFormText(formData, "note");
    const route = getFormText(formData, "route");

    if (!note) {
      setQuickNote((current) => ({
        ...current,
        error: "Add a note before saving.",
        success: null,
      }));
      return;
    }

    setQuickNote((current) => ({
      ...current,
      pending: true,
      error: null,
      success: null,
    }));

    try {
      const createResult = await createItemFn({
        data: {
          itemType,
          priority,
          targetRole,
          title: title || null,
          note,
          pageUrl: route || null,
          route: route || null,
          metadata: {
            source: "admin_capture_backlog_quick_note",
          },
        },
      });

      if (!createResult.ok) {
        setQuickNote((current) => ({
          ...current,
          pending: false,
          error: createResult.message,
          success: null,
        }));
        return;
      }

      setExpandedItemId(createResult.item.id);
      setQuickNote({
        ...initialQuickNoteState,
        open: true,
        success: "Note saved.",
      });
      await router.invalidate();
    } catch (error) {
      setQuickNote((current) => ({
        ...current,
        pending: false,
        error: error instanceof Error ? error.message : "Could not save note. Try again.",
        success: null,
      }));
    }
  };

  const updateTriage = async (
    item: AdminCaptureItemView,
    patch: {
      itemType?: AdminCaptureItemType;
      status?: AdminCaptureStatus;
      priority?: AdminCapturePriority | null;
      targetRole?: AdminCaptureTargetRole | null;
    },
  ) => {
    setMutation({ itemId: item.id, field: "triage", message: null, tone: null });

    try {
      const updateResult = await updateTriageFn({
        data: {
          id: item.id,
          ...patch,
        },
      });

      if (!updateResult.ok) {
        setMutation({
          itemId: item.id,
          field: "triage",
          message: formatCaptureMutationError(updateResult),
          tone: "error",
        });
        return;
      }

      setMutation({ itemId: item.id, field: "triage", message: "Saved", tone: "success" });
      if (patch.status === "archived") {
        setExpandedItemId(null);
      }
      await router.invalidate();
    } catch (error) {
      setMutation({
        itemId: item.id,
        field: "triage",
        message: error instanceof Error ? error.message : "Could not save changes.",
        tone: "error",
      });
    }
  };

  const appendNote = async (item: AdminCaptureItemView) => {
    const note = appendNotes[item.id]?.trim();

    if (!note) {
      setMutation({
        itemId: item.id,
        field: "note",
        message: "Add note text before saving.",
        tone: "error",
      });
      return;
    }

    setMutation({ itemId: item.id, field: "note", message: null, tone: null });

    try {
      const appendResult = await appendNoteFn({
        data: {
          id: item.id,
          note,
        },
      });

      if (!appendResult.ok) {
        setMutation({
          itemId: item.id,
          field: "note",
          message: formatCaptureMutationError(appendResult),
          tone: "error",
        });
        return;
      }

      setAppendNotes((current) => ({ ...current, [item.id]: "" }));
      setMutation({ itemId: item.id, field: "note", message: "Saved", tone: "success" });
      await router.invalidate();
    } catch (error) {
      setMutation({
        itemId: item.id,
        field: "note",
        message: error instanceof Error ? error.message : "Could not save changes.",
        tone: "error",
      });
    }
  };

  const copyPrompt = async (item: AdminCaptureItemView) => {
    setMutation({ itemId: item.id, field: "prompt", message: null, tone: null });

    try {
      const promptResult = await copyPromptFn({
        data: {
          id: item.id,
        },
      });

      if (!promptResult.ok) {
        setMutation({
          itemId: item.id,
          field: "prompt",
          message: formatCaptureMutationError(promptResult),
          tone: "error",
        });
        return;
      }

      const copied = await copyTextToClipboard(promptResult.prompt.prompt);

      if (!copied) {
        setCopyFallbackPrompts((current) => ({
          ...current,
          [item.id]: promptResult.prompt.prompt,
        }));
        setMutation({
          itemId: item.id,
          field: "prompt",
          message: "Copy blocked. Select the prompt below.",
          tone: "error",
        });
        return;
      }

      setCopyFallbackPrompts((current) => {
        const next = { ...current };
        delete next[item.id];
        return next;
      });
      setCopiedPromptIds((current) => ({ ...current, [item.id]: true }));
      setMutation({ itemId: item.id, field: "prompt", message: null, tone: null });
      window.setTimeout(() => {
        setCopiedPromptIds((current) => {
          const next = { ...current };
          delete next[item.id];
          return next;
        });
      }, 1600);
    } catch {
      setMutation({
        itemId: item.id,
        field: "prompt",
        message: "Copy failed. Could not copy. Try again.",
        tone: "error",
      });
    }
  };

  const deleteQuickNote = async (item: AdminCaptureItemView) => {
    if (item.source !== "quick_note") {
      setMutation({
        itemId: item.id,
        field: "delete",
        message: "Only manual quick notes can be deleted.",
        tone: "error",
      });
      return;
    }

    if (!window.confirm("Delete this quick note? This cannot be undone.")) {
      return;
    }

    setMutation({ itemId: item.id, field: "delete", message: null, tone: null });

    try {
      const deleteResult = await deleteQuickNoteFn({
        data: {
          id: item.id,
        },
      });

      if (!deleteResult.ok) {
        setMutation({
          itemId: item.id,
          field: "delete",
          message: formatCaptureMutationError(deleteResult),
          tone: "error",
        });
        return;
      }

      setExpandedItemId(null);
      setAppendNotes((current) => {
        const next = { ...current };
        delete next[item.id];
        return next;
      });
      setMutation({ itemId: null, field: null, message: null, tone: null });
      await router.invalidate();
    } catch (error) {
      setMutation({
        itemId: item.id,
        field: "delete",
        message: error instanceof Error ? error.message : "Could not delete quick note.",
        tone: "error",
      });
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground hito-canvas-atmosphere">
      <div className="hito-workbench-shell [--hito-workbench-sidebar-width:240px]">
        <AdminCaptureSidebar />

        <section className="hito-workbench-main">
          <header className="hito-workbench-topbar">
            <div className="flex flex-col gap-4 px-5 py-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
              <div className="min-w-0">
                <div className="hito-workbench-location lg:hidden">
                  <span className="hito-workbench-location-title">Admin</span>
                  <span className="hito-workbench-location-meta">
                    <span>Backlog</span>
                    <span aria-hidden="true">/</span>
                    <span>{formatStatusLabel(search.status)}</span>
                  </span>
                </div>
                <p className="hito-micro-label">Admin</p>
                <h1 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl">
                  Backlog
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                  Review captured work and copy prompts for manual handoff.
                </p>
              </div>
              <div className="flex flex-wrap items-start gap-2 lg:items-center">
                <QuickNotePanel
                  quickNote={quickNote}
                  setQuickNote={setQuickNote}
                  onSubmit={submitQuickNote}
                  variant="header"
                />
                <Link to="/" className="hito-button hito-button-secondary hito-button-md">
                  Back to Hito
                </Link>
                <a
                  href="/api/admin/auth/logout?next=%2Fadmin%2Fcapture"
                  className="hito-button hito-button-ghost hito-button-md"
                >
                  <Icon name="logout" size="sm" />
                  Sign out
                </a>
              </div>
            </div>
            <AdminCaptureRouteRail />
          </header>

          <div className="hito-route-stack mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
            {!result.ok ? (
              <CaptureUnavailableState result={result} />
            ) : (
              <section className="grid gap-6 pt-6">
                <CaptureStatusTabs
                  activeStatus={search.status}
                  counts={
                    countsResult.ok ? countsResult.view.statusCounts : result.view.statusCounts
                  }
                  filters={search}
                />
                <CaptureUtilityRow
                  activeFilterCount={activeFilterCount}
                  clearFiltersHref={clearFiltersHref}
                  query={captureQueryText(search.q)}
                  rowCountLabel={`Showing ${result.view.shown} of ${result.view.total} items`}
                  search={search}
                />
                <CaptureBacklogList
                  appendNotes={appendNotes}
                  copiedPromptIds={copiedPromptIds}
                  clearFiltersHref={clearFiltersHref}
                  copyFallbackPrompts={copyFallbackPrompts}
                  expandedItemId={expandedItemId}
                  mutation={mutation}
                  result={result.view}
                  search={search}
                  setAppendNotes={setAppendNotes}
                  setExpandedItemId={setExpandedItemId}
                  onAppendNote={appendNote}
                  onCopyPrompt={copyPrompt}
                  onDeleteQuickNote={deleteQuickNote}
                  onUpdateTriage={updateTriage}
                />
              </section>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function CapturePendingState() {
  return (
    <main className="min-h-screen bg-background text-foreground hito-canvas-atmosphere">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center px-6">
        <section className="hito-state-surface w-full">
          <p className="hito-label">Loading backlog...</p>
          <h1 className="hito-page-title mt-3">Fetching captured items and notes.</h1>
        </section>
      </div>
    </main>
  );
}

function AdminCaptureSidebar() {
  return (
    <aside className="hito-workbench-sidebar">
      <div className="px-6 pb-10 pt-7">
        <Link to="/" className="flex items-end gap-2">
          <HitoLogo decorative className="[--hito-logo-height:1.35rem]" />
          <span className="font-display text-xl leading-none tracking-tight">Admin</span>
        </Link>
        <p className="hito-micro-label mt-1">Internal tools</p>
      </div>

      <nav className="hito-shell-nav px-3" aria-label="Admin surfaces">
        <div className="grid gap-0.5">
          {ADMIN_CAPTURE_NAV.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className="hito-shell-nav-row"
              data-active={item.active ? "true" : undefined}
            >
              <Icon name={item.icon} className="hito-shell-nav-icon" />
              {item.label}
              {item.active ? <span className="hito-shell-nav-dot" /> : null}
            </Link>
          ))}
        </div>
      </nav>

      <div className="mt-auto p-4">
        <div className="hito-row-group">
          <div className="hito-list-row items-start">
            <div className="min-w-0">
              <div className="hito-micro-label flex items-center gap-2">
                <Icon name="shield-alert" size="xs" className="text-signal" />
                Manual handoff
              </div>
              <p className="hito-list-row-copy">
                Capture items stay admin-only. Prompt copy is manual; nothing auto-dispatches.
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function AdminCaptureRouteRail() {
  return (
    <nav className="hito-workbench-section-rail lg:hidden" aria-label="Admin surfaces">
      <div className="hito-workbench-quick-links">
        {ADMIN_CAPTURE_NAV.map((item) => (
          <Link
            key={item.label}
            to={item.href}
            className="hito-workbench-quick-link"
            data-active={item.active ? "true" : undefined}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

function CaptureStatusTabs({
  activeStatus,
  counts,
  filters,
}: {
  activeStatus: CaptureStatusFilter;
  counts: Record<AdminCaptureStatus, number>;
  filters: CaptureSearch;
}) {
  return (
    <div className="hito-tabs hito-tabs-simple overflow-x-auto" role="tablist">
      {STATUS_FILTERS.map((status) => (
        <a
          key={status.value}
          href={buildCaptureHref(filters, { status: status.value })}
          role="tab"
          aria-selected={activeStatus === status.value}
          className="hito-tab whitespace-nowrap"
          data-active={activeStatus === status.value ? "true" : undefined}
        >
          {status.label}
          <span className="hito-tab-badge">{countForStatusFilter(status.value, counts)}</span>
        </a>
      ))}
    </div>
  );
}

function CaptureUtilityRow({
  activeFilterCount,
  clearFiltersHref,
  query,
  rowCountLabel,
  search,
}: {
  activeFilterCount: number;
  clearFiltersHref: string;
  query: string;
  rowCountLabel: string;
  search: CaptureSearch;
}) {
  const [searchOpen, setSearchOpen] = useState(Boolean(query));
  const [draftQuery, setDraftQuery] = useState(query);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSearchOpen = searchOpen || query.length > 0 || draftQuery.length > 0;
  const activeFilters = getActiveCaptureFilters(search);

  const updateQuery = (value: string) => {
    setDraftQuery(value);
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = setTimeout(() => {
      window.location.href = buildCaptureHref(search, { q: value });
    }, 350);
  };

  const goToFilter = (patch: Partial<CaptureSearch>) => {
    window.location.href = buildCaptureHref(search, patch);
  };

  return (
    <div className="hito-data-table-utility-row">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {isSearchOpen ? (
          <label className="hito-field hito-field-sm hito-data-table-search">
            <span className="sr-only">Search backlog</span>
            <Icon name="search" size="xs" className="text-muted-foreground" />
            <input
              autoFocus
              className="hito-data-table-search-input"
              onBlur={() => {
                if (!draftQuery) {
                  setSearchOpen(false);
                }
              }}
              onChange={(event) => updateQuery(event.target.value)}
              placeholder="Search notes, routes, text, or role"
              type="search"
              value={draftQuery}
            />
            {draftQuery ? (
              <a
                aria-label="Clear search backlog"
                className="hito-button hito-button-ghost hito-button-xs hito-data-table-search-clear"
                href={buildCaptureHref(search, { q: "" })}
                onMouseDown={(event) => event.preventDefault()}
              >
                <Icon name="close" size="xs" />
              </a>
            ) : null}
          </label>
        ) : (
          <button
            type="button"
            aria-label="Search backlog"
            className="hito-button hito-button-secondary hito-button-sm hito-data-table-icon-button"
            onClick={() => setSearchOpen(true)}
          >
            <Icon name="search" size="sm" />
          </button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="hito-button hito-button-secondary hito-button-sm hito-data-table-filter-summary"
              aria-label={
                activeFilterCount > 0
                  ? `${activeFilterCount} active backlog filters`
                  : "Backlog filters"
              }
            >
              <Icon name="settings" size="xs" />
              Filters
              {activeFilterCount > 0 ? (
                <span className="hito-tab-badge">{activeFilterCount}</span>
              ) : null}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="hito-shell-menu hito-data-table-column-menu w-72"
          >
            {activeFilters.length > 0 ? (
              <>
                <DropdownMenuLabel className="hito-micro-label">Active filters</DropdownMenuLabel>
                {activeFilters.map((filter) => (
                  <DropdownMenuItem
                    key={filter.id}
                    className="hito-shell-menu-item hito-data-table-menu-item"
                    onSelect={() => goToFilter(filter.removePatch)}
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
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="hito-shell-menu-item hito-data-table-menu-item"
                  onSelect={() => {
                    window.location.href = clearFiltersHref;
                  }}
                >
                  <Icon name="x-circle" size="xs" />
                  Clear all
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            ) : null}
            <DropdownMenuLabel className="hito-micro-label">Type</DropdownMenuLabel>
            <CaptureFilterMenuItems
              currentValue={search.type}
              options={[
                { value: "all", label: "All" },
                ...adminCaptureItemTypes.map((type) => ({
                  value: type,
                  label: formatItemType(type),
                })),
              ]}
              onSelect={(type) => goToFilter({ type: type as CaptureSearch["type"] })}
            />
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="hito-micro-label">Priority</DropdownMenuLabel>
            <CaptureFilterMenuItems
              currentValue={search.priority}
              options={[
                { value: "all", label: "All" },
                ...adminCapturePriorities.map((priority) => ({
                  value: priority,
                  label: formatPriority(priority),
                })),
              ]}
              onSelect={(priority) =>
                goToFilter({ priority: priority as CaptureSearch["priority"] })
              }
            />
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="hito-micro-label">Target role</DropdownMenuLabel>
            <CaptureFilterMenuItems
              currentValue={search.role}
              options={[
                { value: "all", label: "All" },
                ...adminCaptureTargetRoles.map((role) => ({
                  value: role,
                  label: formatTargetRole(role),
                })),
              ]}
              onSelect={(role) => goToFilter({ role: role as CaptureSearch["role"] })}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <p className="hito-field-helper whitespace-nowrap">{rowCountLabel}</p>
    </div>
  );
}

function CaptureFilterMenuItems({
  currentValue,
  onSelect,
  options,
}: {
  currentValue: string;
  onSelect: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <>
      {options.map((option) => (
        <DropdownMenuItem
          key={option.value}
          className="hito-shell-menu-item hito-data-table-menu-item"
          onSelect={() => onSelect(option.value)}
        >
          {currentValue === option.value ? (
            <Icon name="check" size="xs" className="text-signal" />
          ) : null}
          {option.label}
        </DropdownMenuItem>
      ))}
    </>
  );
}

function QuickNotePanel({
  variant = "inline",
  quickNote,
  setQuickNote,
  onSubmit,
}: {
  variant?: "header" | "inline";
  quickNote: QuickNoteState;
  setQuickNote: React.Dispatch<React.SetStateAction<QuickNoteState>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const isHeader = variant === "header";

  return (
    <details
      className={isHeader ? "relative" : "hito-row-group"}
      suppressHydrationWarning
      {...(quickNote.open || Boolean(quickNote.error || quickNote.success) ? { open: true } : {})}
    >
      <summary
        className={
          isHeader
            ? "hito-button hito-button-primary hito-button-md cursor-pointer list-none [&::-webkit-details-marker]:hidden"
            : "hito-list-row w-full cursor-pointer text-left list-none [&::-webkit-details-marker]:hidden"
        }
      >
        {isHeader ? (
          <>
            <Icon name="plus" size="xs" />
            Add quick note
          </>
        ) : (
          <>
            <span className="min-w-0">
              <span className="hito-list-row-title flex items-center gap-2">
                <Icon name="plus" size="xs" className="text-signal" />
                Add quick note
              </span>
              <span className="hito-list-row-copy">
                Capture a backlog item without selecting UI.
              </span>
            </span>
            <Icon name="chevron-down" size="sm" />
          </>
        )}
      </summary>
      <div
        className={
          isHeader
            ? "z-30 mt-2 w-[min(36rem,calc(100vw-2.5rem))] max-w-[calc(100vw-2.5rem)] sm:absolute sm:right-0"
            : undefined
        }
      >
        <form
          className="grid gap-4 rounded-2xl border border-hairline bg-background p-4 shadow-soft"
          onSubmit={onSubmit}
        >
          <div className="grid gap-1">
            <h2 className="hito-body font-medium text-foreground">Add quick note</h2>
            <p className="hito-field-helper">Capture a backlog item without selecting UI.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-4">
            <SelectField
              label="Type"
              name="itemType"
              value={quickNote.itemType}
              onChange={(itemType) =>
                setQuickNote((current) => ({
                  ...current,
                  itemType: itemType as AdminCaptureItemType,
                }))
              }
              options={adminCaptureItemTypes.map((type) => ({
                value: type,
                label: formatItemType(type),
              }))}
            />
            <SelectField
              label="Priority"
              name="priority"
              value={quickNote.priority}
              onChange={(priority) =>
                setQuickNote((current) => ({
                  ...current,
                  priority: priority as AdminCapturePriority | "",
                }))
              }
              options={[
                { value: "", label: "Unset" },
                ...adminCapturePriorities.map((priority) => ({
                  value: priority,
                  label: formatPriority(priority),
                })),
              ]}
            />
            <SelectField
              label="Target role"
              name="targetRole"
              value={quickNote.targetRole}
              onChange={(targetRole) =>
                setQuickNote((current) => ({
                  ...current,
                  targetRole: targetRole as AdminCaptureTargetRole | "",
                }))
              }
              options={[
                { value: "", label: "Unset" },
                ...adminCaptureTargetRoles.map((role) => ({
                  value: role,
                  label: formatTargetRole(role),
                })),
              ]}
            />
            <label className="grid gap-2">
              <span className="hito-label">Route or URL</span>
              <input
                className="hito-field hito-field-md"
                name="route"
                value={quickNote.route}
                onChange={(event) =>
                  setQuickNote((current) => ({ ...current, route: event.target.value }))
                }
                placeholder="/settings"
              />
            </label>
          </div>
          <label className="grid gap-2">
            <span className="hito-label">Title</span>
            <input
              className="hito-field hito-field-md"
              name="title"
              value={quickNote.title}
              onChange={(event) =>
                setQuickNote((current) => ({ ...current, title: event.target.value }))
              }
              placeholder="Optional short title"
            />
          </label>
          <label className="grid gap-2">
            <span className="hito-label">Note</span>
            <textarea
              className="hito-field min-h-28 resize-y p-3"
              name="note"
              value={quickNote.note}
              onChange={(event) =>
                setQuickNote((current) => ({ ...current, note: event.target.value }))
              }
              placeholder="What should change, what looks wrong, or what context should be saved?"
              required
            />
          </label>
          {quickNote.error ? <p className="hito-field-error">{quickNote.error}</p> : null}
          {quickNote.success ? (
            <p className="hito-field-helper text-signal">{quickNote.success}</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="hito-button hito-button-primary hito-button-md"
              disabled={quickNote.pending}
            >
              {quickNote.pending ? "Saving..." : "Save note"}
            </button>
            <button
              type="button"
              className="hito-button hito-button-secondary hito-button-md"
              onClick={() => setQuickNote(initialQuickNoteState)}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </details>
  );
}

function CaptureBacklogList({
  appendNotes,
  copiedPromptIds,
  clearFiltersHref,
  copyFallbackPrompts,
  expandedItemId,
  mutation,
  result,
  search,
  setAppendNotes,
  setExpandedItemId,
  onAppendNote,
  onCopyPrompt,
  onDeleteQuickNote,
  onUpdateTriage,
}: {
  appendNotes: Record<string, string>;
  copiedPromptIds: Record<string, boolean>;
  clearFiltersHref: string;
  copyFallbackPrompts: Record<string, string>;
  expandedItemId: string | null;
  mutation: MutationState;
  result: AdminCaptureBacklogView;
  search: CaptureSearch;
  setAppendNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setExpandedItemId: (id: string | null) => void;
  onAppendNote: (item: AdminCaptureItemView) => Promise<void>;
  onCopyPrompt: (item: AdminCaptureItemView) => Promise<void>;
  onDeleteQuickNote: (item: AdminCaptureItemView) => Promise<void>;
  onUpdateTriage: (
    item: AdminCaptureItemView,
    patch: {
      itemType?: AdminCaptureItemType;
      status?: AdminCaptureStatus;
      priority?: AdminCapturePriority | null;
      targetRole?: AdminCaptureTargetRole | null;
    },
  ) => Promise<void>;
}) {
  if (result.items.length === 0) {
    const filtered =
      captureQueryText(search.q) ||
      search.type !== "all" ||
      search.priority !== "all" ||
      search.role !== "all";

    return filtered ? (
      <EmptyState
        icon="search"
        title="No items match these filters."
        description="Clear filters or adjust search."
        action={
          <a className="hito-button hito-button-secondary hito-button-md" href={clearFiltersHref}>
            Clear filters
          </a>
        }
      />
    ) : (
      <EmptyState
        icon="plan-note"
        title="No backlog items yet."
        description="Captured UI notes and quick admin notes will appear here."
      />
    );
  }

  return (
    <div className="hito-row-group hito-backlog-list">
      {result.items.map((item) => {
        const expanded = expandedItemId === item.id;
        const repoSource = getRepoDerivedInfo(item);
        const readOnly = repoSource.readOnly;
        return (
          <article key={item.id} data-expanded={expanded ? "true" : undefined}>
            <div className="hito-list-row w-full items-start text-left">
              <button
                type="button"
                className="hito-backlog-row-summary grid min-w-0 flex-1 gap-2 text-left"
                aria-expanded={expanded}
                onClick={() => setExpandedItemId(expanded ? null : item.id)}
              >
                <span className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="hito-list-row-title truncate font-medium">{item.title}</span>
                </span>
                <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <code className="hito-technical-mono truncate">
                    {repoSource.sourcePath ?? item.route ?? "No route"}
                  </code>
                  <span>{formatDateTime(item.createdAt)}</span>
                  <span>{formatItemSource(item)}</span>
                  {repoSource.sourceType ? <span>{repoSource.sourceType}</span> : null}
                </span>
              </button>
              <div className="hito-backlog-row-metadata flex min-w-0 flex-wrap items-center justify-start gap-1.5 md:justify-end">
                {readOnly ? (
                  <>
                    <HitoMetadataTag
                      tooltip={readOnlyMetadataTooltip("status")}
                      tone={repoMarkdownStatusTone(repoSource)}
                    >
                      {formatRepoMarkdownStatus(repoSource, item)}
                    </HitoMetadataTag>
                    <HitoMetadataTag tooltip={readOnlyMetadataTooltip("type")}>
                      {formatMarkdownMetadataValue("type", repoSource.markdownType, item.itemType)}
                    </HitoMetadataTag>
                    <HitoMetadataTag
                      tooltip={readOnlyMetadataTooltip("priority")}
                      tone={
                        repoSource.markdownPriority ? markdownPriorityTone(repoSource) : undefined
                      }
                    >
                      {formatMarkdownMetadataValue(
                        "priority",
                        repoSource.markdownPriority,
                        item.priority,
                      )}
                    </HitoMetadataTag>
                    <HitoMetadataTag tooltip={readOnlyMetadataTooltip("role")}>
                      {formatMarkdownMetadataValue(
                        "role",
                        repoSource.markdownNextRole,
                        item.targetRole,
                      )}
                    </HitoMetadataTag>
                    {repoSource.missingRequiredFields.length > 0 ? (
                      <HitoMetadataTag
                        tone="warning"
                        tooltip="This source task is missing required markdown metadata. Fix the source markdown, then refresh the backlog import."
                      >
                        missing metadata
                      </HitoMetadataTag>
                    ) : null}
                    {repoSource.invalidRequiredFields.length > 0 ? (
                      <HitoMetadataTag
                        tone="warning"
                        tooltip="This source task has invalid markdown metadata. Fix the source markdown, then refresh the backlog import."
                      >
                        invalid metadata
                      </HitoMetadataTag>
                    ) : null}
                  </>
                ) : (
                  <>
                    <MetadataMenu
                      icon={statusIcon(item.status)}
                      label="Status"
                      value={item.status}
                      displayValue={formatStatusTagValue(item.status)}
                      tone={statusTone(item.status)}
                      options={EDITABLE_CAPTURE_STATUS_OPTIONS}
                      onSelect={(status) =>
                        onUpdateTriage(item, { status: status as AdminCaptureStatus })
                      }
                    />
                    <MetadataMenu
                      label="Type"
                      value={item.itemType}
                      displayValue={formatItemTypeTagValue(item.itemType)}
                      options={adminCaptureItemTypes.map((type) => ({
                        value: type,
                        label: formatItemType(type),
                      }))}
                      onSelect={(itemType) =>
                        onUpdateTriage(item, { itemType: itemType as AdminCaptureItemType })
                      }
                    />
                    <MetadataMenu
                      label="Priority"
                      value={item.priority ?? ""}
                      displayValue={item.priority ? formatPriorityTagValue(item.priority) : "unset"}
                      tone={item.priority ? priorityTone(item.priority) : undefined}
                      options={[
                        { value: "", label: "Unset" },
                        ...adminCapturePriorities.map((priority) => ({
                          value: priority,
                          label: formatPriority(priority),
                        })),
                      ]}
                      onSelect={(priority) =>
                        onUpdateTriage(item, {
                          priority: priority ? (priority as AdminCapturePriority) : null,
                        })
                      }
                    />
                    <MetadataMenu
                      label="Target role"
                      value={item.targetRole ?? ""}
                      displayValue={
                        item.targetRole ? formatTargetRoleTagValue(item.targetRole) : "no role"
                      }
                      options={[
                        { value: "", label: "No role" },
                        ...adminCaptureTargetRoles.map((role) => ({
                          value: role,
                          label: formatTargetRole(role),
                        })),
                      ]}
                      onSelect={(targetRole) =>
                        onUpdateTriage(item, {
                          targetRole: targetRole ? (targetRole as AdminCaptureTargetRole) : null,
                        })
                      }
                    />
                  </>
                )}
              </div>
              <button
                type="button"
                className="hito-button hito-button-ghost hito-button-xs hito-backlog-row-action"
                aria-label={expanded ? "Collapse item" : "Open item"}
                aria-expanded={expanded}
                onClick={() => setExpandedItemId(expanded ? null : item.id)}
              >
                <Icon name={expanded ? "chevron-up" : "chevron-down"} size="sm" />
              </button>
            </div>
            {expanded ? (
              <CaptureItemDetail
                appendNote={appendNotes[item.id] ?? ""}
                copyButtonLabel={copiedPromptIds[item.id] ? "Copied" : "Copy prompt"}
                copyFallbackPrompt={copyFallbackPrompts[item.id] ?? null}
                item={item}
                mutation={mutation}
                repoSource={repoSource}
                onAppendNote={() => onAppendNote(item)}
                onAppendNoteChange={(note) =>
                  setAppendNotes((current) => ({ ...current, [item.id]: note }))
                }
                onCopyPrompt={() => onCopyPrompt(item)}
                onDeleteQuickNote={() => onDeleteQuickNote(item)}
              />
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

function CaptureItemDetail({
  appendNote,
  copyButtonLabel,
  copyFallbackPrompt,
  item,
  mutation,
  repoSource,
  onAppendNote,
  onAppendNoteChange,
  onCopyPrompt,
  onDeleteQuickNote,
}: {
  appendNote: string;
  copyButtonLabel: string;
  copyFallbackPrompt: string | null;
  item: AdminCaptureItemView;
  mutation: MutationState;
  repoSource: RepoDerivedInfo;
  onAppendNote: () => void;
  onAppendNoteChange: (note: string) => void;
  onCopyPrompt: () => void;
  onDeleteQuickNote: () => void;
}) {
  const currentMutation =
    mutation.itemId === item.id &&
    mutation.message &&
    !(mutation.field === "prompt" && mutation.tone === "success") ? (
      <p
        className={mutation.tone === "error" ? "hito-field-error" : "hito-field-helper text-signal"}
      >
        {mutation.message}
      </p>
    ) : null;
  const promptBody = copyFallbackPrompt ?? item.note;

  return (
    <div className="hito-backlog-detail">
      <div className="grid gap-5 pt-1">
        {currentMutation ? <div>{currentMutation}</div> : null}

        {repoSource.readOnly ? (
          <div className="grid gap-2 text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center gap-2">
              <HitoMetadataTag
                tone="rollout"
                tooltip="This item is mirrored from the repo. Change task truth in the source markdown, then refresh the backlog import."
              >
                repo mirror
              </HitoMetadataTag>
              <span>Markdown is the source of truth. This item is read-only in Backlog.</span>
            </div>
            {repoSource.missingRequiredFields.length > 0 ? (
              <MetadataHint label="Missing metadata" fields={repoSource.missingRequiredFields} />
            ) : null}
            {repoSource.invalidRequiredFields.length > 0 ? (
              <MetadataHint label="Invalid metadata" fields={repoSource.invalidRequiredFields} />
            ) : null}
          </div>
        ) : null}

        {repoSource.readOnly ? (
          <section className="grid gap-3 border-t border-hairline pt-4">
            <h4 className="hito-label text-foreground">Markdown metadata</h4>
            <div className="flex flex-wrap gap-2">
              <HitoMetadataTag
                tooltip={readOnlyMetadataTooltip("status")}
                tone={repoMarkdownStatusTone(repoSource)}
              >
                {formatRepoMarkdownStatus(repoSource, item)}
              </HitoMetadataTag>
              <HitoMetadataTag tooltip={readOnlyMetadataTooltip("type")}>
                {formatMarkdownMetadataValue("type", repoSource.markdownType, item.itemType)}
              </HitoMetadataTag>
              <HitoMetadataTag
                tooltip={readOnlyMetadataTooltip("priority")}
                tone={repoSource.markdownPriority ? markdownPriorityTone(repoSource) : undefined}
              >
                {formatMarkdownMetadataValue(
                  "priority",
                  repoSource.markdownPriority,
                  item.priority,
                )}
              </HitoMetadataTag>
              <HitoMetadataTag tooltip={readOnlyMetadataTooltip("role")}>
                {formatMarkdownMetadataValue("role", repoSource.markdownNextRole, item.targetRole)}
              </HitoMetadataTag>
            </div>
          </section>
        ) : null}

        <section className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="hito-label text-foreground">Prompt</h4>
              <p className="hito-field-helper">
                {copyFallbackPrompt
                  ? "Copy blocked. Select the prompt below."
                  : item.targetRole
                    ? "Role-ready prompt is generated by the backend when copied."
                    : "Set a target role to copy a role-ready prompt."}
              </p>
            </div>
            <button
              type="button"
              className="hito-button hito-button-secondary hito-button-sm min-w-36"
              onClick={onCopyPrompt}
            >
              <Icon name={copyButtonLabel === "Copied" ? "check" : "copy"} size="xs" />
              {copyButtonLabel}
            </button>
          </div>
          <pre
            className="hito-technical-mono max-h-80 min-h-40 overflow-auto whitespace-pre-wrap rounded-xl bg-black/35 p-4 text-xs leading-5 text-foreground"
            tabIndex={0}
          >
            {promptBody}
          </pre>
        </section>

        <section className="grid gap-3 border-t border-hairline pt-4">
          <h4 className="hito-label text-foreground">Context</h4>
          <div className="grid gap-3 md:grid-cols-2">
            <DetailRow label="Created" value={formatDateTime(item.createdAt)} />
            <DetailRow label="Updated" value={formatDateTime(item.updatedAt)} />
            <DetailRow label="Route" value={item.route ?? "Not captured"} code />
            <DetailRow label="URL" value={item.pageUrl} code />
            {repoSource.sourcePath ? (
              <DetailRow label="Source path" value={repoSource.sourcePath} code />
            ) : null}
            {repoSource.sourceType ? (
              <DetailRow label="Source type" value={repoSource.sourceType} />
            ) : null}
            {repoSource.workItemStatus ? (
              <DetailRow label="Work item status" value={repoSource.workItemStatus} />
            ) : null}
            <DetailRow
              label="Selected text"
              value={item.selectedElement.text ?? "No selected element"}
            />
            <DetailRow
              label="Nearby heading"
              value={item.selectedElement.nearbyHeading ?? "Not captured"}
            />
            <DetailRow label="Created by" value={item.createdByLabel ?? item.createdByUserId} />
          </div>
        </section>

        <details className="hito-disclosure">
          <summary className="hito-disclosure-summary">
            <span className="hito-label text-foreground">Technical details</span>
            <Icon name="chevron-down" size="xs" className="hito-disclosure-chevron" />
          </summary>
          <div className="hito-disclosure-body mt-3 grid gap-3 md:grid-cols-2">
            <DetailRow
              label="Selector"
              value={item.selectedElement.selector ?? "Not captured"}
              code
            />
            <DetailRow
              label="DOM path"
              value={item.selectedElement.domPath ?? "Not captured"}
              code
            />
            <DetailRow
              label="Viewport"
              value={
                item.viewport.width && item.viewport.height
                  ? `${item.viewport.width} x ${item.viewport.height}`
                  : "Not captured"
              }
            />
          </div>
        </details>

        {!repoSource.readOnly ? (
          <details className="hito-disclosure">
            <summary className="hito-disclosure-summary">
              <span className="hito-label text-foreground">Notes</span>
              <Icon name="chevron-down" size="xs" className="hito-disclosure-chevron" />
            </summary>
            <div className="hito-disclosure-body mt-3 grid gap-3">
              <p className="hito-body whitespace-pre-wrap text-foreground">{item.note}</p>
              <label className="grid gap-2">
                <span className="hito-label">Append note</span>
                <textarea
                  className="hito-field min-h-20 resize-y p-3"
                  value={appendNote}
                  onChange={(event) => onAppendNoteChange(event.target.value)}
                  placeholder="Add follow-up context."
                />
              </label>
              <button
                type="button"
                className="hito-button hito-button-secondary hito-button-sm justify-self-start"
                onClick={onAppendNote}
              >
                Save note
              </button>
            </div>
          </details>
        ) : null}

        {item.source === "quick_note" ? (
          <section className="grid gap-3 border-t border-hairline pt-4">
            <div>
              <h4 className="hito-label text-foreground">Quick note cleanup</h4>
              <p className="hito-field-helper">
                Delete only temporary manual notes after they are copied into a real task.
              </p>
            </div>
            <button
              type="button"
              className="hito-button hito-button-secondary hito-button-sm justify-self-start"
              onClick={onDeleteQuickNote}
            >
              <Icon name="x-circle" size="xs" />
              Delete quick note
            </button>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function CaptureUnavailableState({
  result,
}: {
  result: Extract<AdminCaptureResult<{ view: AdminCaptureBacklogView }>, { ok: false }>;
}) {
  const title =
    result.reason === "supabase_admin_unavailable"
      ? "Backlog unavailable."
      : "Backlog unavailable.";

  return (
    <section className="hito-surface-flat p-6" data-tone="warning">
      <div className="flex items-start gap-3">
        <Icon name="shield-alert" size="md" className="mt-0.5 text-muted-foreground" />
        <div>
          <span className="hito-status-pill" data-tone="warning">
            {result.reason.replaceAll("_", " ")}
          </span>
          <h2 className="hito-modal-title mt-4">{title}</h2>
          <p className="hito-body mt-3 max-w-2xl text-muted-foreground">{result.message}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/" className="hito-button hito-button-secondary hito-button-md">
              Back to Hito
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function EmptyState({
  action,
  description,
  icon,
  title,
}: {
  action?: ReactNode;
  description: string;
  icon: "plan-note" | "search";
  title: string;
}) {
  return (
    <div className="hito-surface-flat p-6" data-tone="signal">
      <div className="flex items-start gap-3">
        <Icon name={icon} size="md" className="mt-0.5 text-muted-foreground" />
        <div>
          <h3 className="hito-body font-medium text-foreground">{title}</h3>
          <p className="hito-field-helper mt-2">{description}</p>
          {action ? <div className="mt-4">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ code, label, value }: { code?: boolean; label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <span className="hito-micro-label text-muted-foreground">{label}</span>
      {code ? (
        <code className="hito-technical-mono break-all text-xs text-foreground">{value}</code>
      ) : (
        <span className="text-sm leading-5 text-foreground">{value}</span>
      )}
    </div>
  );
}

function MetadataHint({ fields, label }: { fields: string[]; label: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <HitoMetadataTag
        tone="warning"
        tooltip={`${label} belongs to the source task. Fix the source markdown, then refresh the backlog import.`}
      >
        {formatMetadataTagValue(label)}
      </HitoMetadataTag>
      <span>{fields.map(formatMetadataFieldName).join(", ")}</span>
    </div>
  );
}

function MetadataMenu({
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
      <DropdownMenuContent align="end" className="hito-shell-menu hito-data-table-column-menu w-56">
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

function readOnlyMetadataTooltip(kind: "status" | "type" | "priority" | "role" | undefined) {
  switch (kind) {
    case "status":
      return "Status from backlog source. Change it in the source task or markdown, then refresh the backlog import.";
    case "type":
      return "Type from backlog source. Change it in the source task or markdown, then refresh the backlog import.";
    case "priority":
      return "Priority from backlog source. Change it in the source task or markdown, then refresh the backlog import.";
    case "role":
      return "Owner role from backlog source. Change it in the source task or markdown, then refresh the backlog import.";
    default:
      return null;
  }
}

function SelectField({
  compact = false,
  label,
  name,
  onChange,
  options,
  value,
}: {
  compact?: boolean;
  label: string;
  name?: string;
  onChange?: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  value: string;
}) {
  return (
    <label className={compact ? "grid min-w-0 gap-1" : "grid min-w-0 flex-1 gap-2"}>
      <span className={compact ? "sr-only" : "hito-label"}>{label}</span>
      <select
        aria-label={compact ? label : undefined}
        className={
          compact ? "hito-field hito-field-sm max-w-44 rounded-full" : "hito-field hito-field-md"
        }
        name={name}
        {...(onChange ? { value } : { defaultValue: value })}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
      >
        {options.map((option) => (
          <option key={option.value || "unset"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function CapturePill({ children }: { children: ReactNode }) {
  return (
    <span className="hito-status-pill" data-icon="false">
      {children}
    </span>
  );
}

function StatusPill({ status }: { status: AdminCaptureStatus }) {
  return (
    <span className="hito-status-pill" data-icon="false" data-tone={statusTone(status)}>
      <Icon name={statusIcon(status)} size="xs" aria-hidden="true" />
      {formatStatusLabel(status)}
    </span>
  );
}

function PriorityPill({ priority }: { priority: AdminCapturePriority }) {
  return (
    <span className="hito-status-pill" data-tone={priorityTone(priority)}>
      {formatPriority(priority)}
    </span>
  );
}

function buildCaptureHref(search: CaptureSearch, patch: Partial<CaptureSearch>) {
  const next = { ...search, ...patch };
  const params = new URLSearchParams();
  params.set("status", next.status);
  params.set("type", next.type);
  params.set("priority", next.priority);
  params.set("role", next.role);
  params.set("q", captureQueryText(next.q));
  return `/admin/capture?${params.toString()}`;
}

function filterBacklogViewForStatus(
  view: AdminCaptureBacklogView,
  status: CaptureStatusFilter,
): AdminCaptureBacklogView {
  if (status !== "all") {
    return view;
  }

  const items = view.items.filter((item) => ACTIVE_CAPTURE_STATUSES.includes(item.status));

  return {
    ...view,
    total: items.length,
    shown: items.length,
    items,
  };
}

function countForStatusFilter(
  status: CaptureStatusFilter,
  counts: Record<AdminCaptureStatus, number>,
) {
  if (status === "all") {
    return ACTIVE_CAPTURE_STATUSES.reduce((total, activeStatus) => total + counts[activeStatus], 0);
  }

  return counts[status];
}

function getActiveCaptureFilters(search: CaptureSearch) {
  const query = captureQueryText(search.q);
  const filters: Array<{
    id: string;
    label: string;
    removePatch: Partial<CaptureSearch>;
    value: string;
  }> = [];

  if (query) {
    filters.push({
      id: "q",
      label: "Search",
      value: query,
      removePatch: { q: "" },
    });
  }

  if (search.type !== "all") {
    filters.push({
      id: "type",
      label: "Type",
      value: formatItemType(search.type),
      removePatch: { type: "all" },
    });
  }

  if (search.priority !== "all") {
    filters.push({
      id: "priority",
      label: "Priority",
      value: formatPriority(search.priority),
      removePatch: { priority: "all" },
    });
  }

  if (search.role !== "all") {
    filters.push({
      id: "role",
      label: "Target role",
      value: formatTargetRole(search.role),
      removePatch: { role: "all" },
    });
  }

  return filters;
}

function statusTone(status: AdminCaptureStatus) {
  switch (status) {
    case "new":
    case "in_review":
    case "ready_for_codex":
      return "rollout";
    case "done":
      return "success";
    case "archived":
      return "muted";
  }
}

function statusIcon(status: AdminCaptureStatus): HitoIconName {
  switch (status) {
    case "new":
    case "in_review":
    case "ready_for_codex":
      return "plus";
    case "done":
      return "check";
    case "archived":
      return "file-text";
  }
}

function priorityTone(priority: AdminCapturePriority) {
  return priority === "urgent" || priority === "high" ? "warning" : undefined;
}

function formatCaptureMutationError(result: Extract<AdminCaptureResult<unknown>, { ok: false }>) {
  return result.reason === "repo_derived_read_only"
    ? "Repo-derived items are read-only. Edit the source markdown instead."
    : result.message;
}

function formatItemSource(item: AdminCaptureItemView) {
  if (getRepoDerivedInfo(item).readOnly) {
    return "Repo import";
  }

  return item.source === "captured_ui" ? "Captured UI" : "Quick note";
}

function getRepoDerivedInfo(item: AdminCaptureItemView): RepoDerivedInfo {
  const metadata = isJsonObject(item.metadata) ? item.metadata : {};
  const sourcePath = getMetadataString(metadata.source_path);
  const importedFromRepo =
    metadata.imported_from_repo === true || item.source === "repo_import" || Boolean(sourcePath);

  return {
    readOnly: importedFromRepo,
    sourcePath,
    sourceType: getMetadataString(metadata.source_type),
    workItemStatus: getMetadataString(metadata.work_item_status),
    markdownStatus: getMetadataString(metadata.markdown_status),
    markdownType: getMetadataString(metadata.markdown_type),
    markdownPriority: getMetadataString(metadata.markdown_priority),
    markdownNextRole: getMetadataString(metadata.markdown_next_role),
    missingRequiredFields: getMetadataStringList(metadata.missing_required_fields),
    invalidRequiredFields: getMetadataStringList(metadata.invalid_required_fields),
  };
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getMetadataString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 500) : null;
}

function getMetadataStringList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => getMetadataString(item))
    .filter((item): item is string => Boolean(item));
}

function formatRepoMarkdownStatus(repoSource: RepoDerivedInfo, item: AdminCaptureItemView) {
  const markdownStatus = repoSource.markdownStatus ?? repoSource.workItemStatus;

  if (markdownStatus) {
    return `status: ${formatMetadataTagValue(markdownStatus)}`;
  }

  return `status: ${formatStatusTagValue(item.status)}`;
}

function repoMarkdownStatusTone(repoSource: RepoDerivedInfo) {
  const status = normalizeMarkdownValue(repoSource.markdownStatus ?? repoSource.workItemStatus);

  return status === "completed"
    ? "success"
    : status === "closed" || status === "archived"
      ? undefined
      : status === "in_progress"
        ? "signal"
        : "rollout";
}

function markdownPriorityTone(repoSource: RepoDerivedInfo) {
  const priority = normalizeMarkdownValue(repoSource.markdownPriority);
  return priority === "urgent" || priority === "high" ? "warning" : undefined;
}

function formatMarkdownMetadataValue(
  label: string,
  value: string | null | undefined,
  fallback?: string | null,
) {
  return `${label}: ${formatMetadataTagValue(value ?? fallback ?? "unset")}`;
}

function formatMetadataFieldName(value: string) {
  return formatMetadataTagValue(value.replace(/^markdown_/, ""));
}

function formatMetadataLabel(value: string) {
  return value
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatMetadataTagValue(value: string) {
  return value.trim().replace(/[_-]+/g, " ").replace(/\s+/g, " ").toLowerCase();
}

function normalizeMarkdownValue(value: string | null | undefined) {
  return (
    value
      ?.trim()
      .toLowerCase()
      .replace(/[-\s]+/g, "_") ?? ""
  );
}

function parseCaptureStatus(value: unknown): CaptureStatusFilter {
  if (value === "done" || value === "archived" || value === "all") {
    return value;
  }

  if (adminCaptureStatuses.includes(value as AdminCaptureStatus)) {
    return "all";
  }

  return "all";
}

function parseNullableFilter<T extends string>(
  value: unknown,
  allowedValues: readonly T[],
): NullableFilter<T> {
  return value === "all" || allowedValues.includes(value as T)
    ? (value as NullableFilter<T>)
    : "all";
}

function parseSearchQuery(value: unknown): string | number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    return stripSerializedSearchQuotes(value).trim().slice(0, 120);
  }

  return "";
}

function captureQueryText(value: string | number) {
  return String(value).trim().slice(0, 120);
}

function stripSerializedSearchQuotes(value: string) {
  const trimmed = value.trim();

  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function parseCaptureItemType(value: FormDataEntryValue | null): AdminCaptureItemType | null {
  return adminCaptureItemTypes.includes(value as AdminCaptureItemType)
    ? (value as AdminCaptureItemType)
    : null;
}

function parseOptionalCapturePriority(
  value: FormDataEntryValue | null,
): AdminCapturePriority | null {
  return adminCapturePriorities.includes(value as AdminCapturePriority)
    ? (value as AdminCapturePriority)
    : null;
}

function parseOptionalCaptureTargetRole(
  value: FormDataEntryValue | null,
): AdminCaptureTargetRole | null {
  return adminCaptureTargetRoles.includes(value as AdminCaptureTargetRole)
    ? (value as AdminCaptureTargetRole)
    : null;
}

function getFormText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function copyTextToClipboard(value: string) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Safari/local contexts can reject async clipboard after the server round trip.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.inset = "0 auto auto -9999px";
  document.body.append(textarea);
  textarea.select();
  textarea.setSelectionRange(0, value.length);

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    textarea.remove();
  }
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatStatusLabel(value: CaptureStatusFilter) {
  switch (value) {
    case "all":
      return "Active";
    case "new":
      return "New";
    case "in_review":
    case "ready_for_codex":
      return "Active";
    case "done":
      return "Done";
    case "archived":
      return "Archived";
  }
}

function formatStatusTagValue(value: AdminCaptureStatus) {
  switch (value) {
    case "new":
      return "new";
    case "in_review":
    case "ready_for_codex":
      return "active";
    case "done":
      return "done";
    case "archived":
      return "archived";
  }
}

function formatItemType(value: AdminCaptureItemType) {
  switch (value) {
    case "bug":
      return "Bug";
    case "change_request":
      return "Change request";
    case "context_capture":
      return "Context capture";
  }
}

function formatItemTypeTagValue(value: AdminCaptureItemType) {
  return formatMetadataTagValue(formatItemType(value));
}

function formatPriority(value: AdminCapturePriority) {
  switch (value) {
    case "low":
      return "Low";
    case "medium":
      return "Medium";
    case "high":
      return "High";
    case "urgent":
      return "Urgent";
  }
}

function formatPriorityTagValue(value: AdminCapturePriority) {
  return formatMetadataTagValue(formatPriority(value));
}

function formatTargetRole(value: AdminCaptureTargetRole) {
  switch (value) {
    case "architect":
      return "Architect";
    case "backend":
      return "Backend";
    case "frontend":
      return "Frontend";
    case "designer":
      return "Designer";
    case "copy":
      return "Copy";
    case "qa":
      return "QA";
    case "prompt_engineer":
      return "Prompt Engineer";
    case "running_coach":
      return "Running Coach";
  }
}

function formatTargetRoleTagValue(value: AdminCaptureTargetRole) {
  return formatMetadataTagValue(formatTargetRole(value));
}

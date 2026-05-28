import { Link, createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { HitoLogo } from "@/components/ui/hito-logo";
import { Icon } from "@/components/ui/icon";
import {
  adminCaptureItemTypes,
  adminCapturePriorities,
  adminCaptureStatuses,
  adminCaptureTargetRoles,
  appendAdminCaptureItemNote,
  createAdminCaptureItem,
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
  field: "triage" | "note" | "prompt" | null;
  message: string | null;
  tone: "success" | "error" | null;
};

const STATUS_FILTERS: Array<{ value: CaptureStatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "in_review", label: "In review" },
  { value: "ready_for_codex", label: "Ready for Codex" },
  { value: "done", label: "Done" },
  { value: "archived", label: "Archived" },
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
      { title: `Capture backlog — ${APP_NAME}` },
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

    return { result, countsResult };
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
  const [quickNote, setQuickNote] = useState<QuickNoteState>(initialQuickNoteState);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [appendNotes, setAppendNotes] = useState<Record<string, string>>({});
  const [copyFallbackPrompts, setCopyFallbackPrompts] = useState<Record<string, string>>({});
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
          message: updateResult.message,
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
          message: appendResult.message,
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
          message: promptResult.message,
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
      setMutation({ itemId: item.id, field: "prompt", message: "Copied", tone: "success" });
    } catch {
      setMutation({
        itemId: item.id,
        field: "prompt",
        message: "Copy failed. Could not copy. Try again.",
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
                    <span>Capture backlog</span>
                    <span aria-hidden="true">/</span>
                    <span>{formatStatusLabel(search.status)}</span>
                  </span>
                </div>
                <p className="hito-micro-label">Admin</p>
                <h1 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl">
                  Capture backlog
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                  Review captured UI notes, triage items, and copy prompts for manual Codex handoff.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/admin/analytics"
                  className="hito-button hito-button-secondary hito-button-md"
                >
                  Back to analytics
                </Link>
                <Link to="/" className="hito-button hito-button-secondary hito-button-md">
                  Back to Hito
                </Link>
              </div>
            </div>
            <AdminCaptureRouteRail activeRoute="capture" />
          </header>

          <div className="hito-route-stack mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
            {!result.ok ? (
              <CaptureUnavailableState result={result} />
            ) : (
              <section className="grid gap-6 pt-6">
                <CaptureHeader view={result.view} />
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
                <QuickNotePanel
                  quickNote={quickNote}
                  setQuickNote={setQuickNote}
                  onSubmit={submitQuickNote}
                />
                <CaptureBacklogList
                  appendNotes={appendNotes}
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
          <Link to="/admin/analytics" className="hito-shell-nav-row">
            <Icon name="activity" className="hito-shell-nav-icon" />
            Analytics
          </Link>
          <Link to="/admin/capture" className="hito-shell-nav-row" data-active="true">
            <Icon name="plan-note" className="hito-shell-nav-icon" />
            Capture backlog
            <span className="hito-shell-nav-dot" />
          </Link>
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

function AdminCaptureRouteRail({ activeRoute }: { activeRoute: "analytics" | "capture" }) {
  return (
    <nav className="hito-workbench-section-rail lg:hidden" aria-label="Admin surfaces">
      <div className="hito-workbench-quick-links">
        <Link
          to="/admin/analytics"
          className="hito-workbench-quick-link"
          data-active={activeRoute === "analytics" ? "true" : undefined}
        >
          Analytics
        </Link>
        <Link
          to="/admin/capture"
          className="hito-workbench-quick-link"
          data-active={activeRoute === "capture" ? "true" : undefined}
        >
          Capture backlog
        </Link>
      </div>
    </nav>
  );
}

function CaptureHeader({ view }: { view: AdminCaptureBacklogView }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="hito-label">Backlog</p>
        <h2 className="hito-modal-title mt-2">Captured admin work</h2>
        <p className="hito-body mt-3 max-w-3xl text-muted-foreground">
          List-first triage for quick admin notes and captured UI context.
        </p>
      </div>
      <div className="grid gap-1 text-left sm:text-right">
        <span className="hito-label">Generated</span>
        <span className="hito-technical-mono text-xs text-muted-foreground">
          {formatDateTime(view.generatedAt)}
        </span>
      </div>
    </div>
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
          {status.value !== "all" ? (
            <span className="hito-tab-badge">{counts[status.value]}</span>
          ) : null}
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
  return (
    <div className="hito-data-table-utility-row">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <details className="group" suppressHydrationWarning {...(query ? { open: true } : {})}>
          <summary
            aria-label="Search backlog"
            className="hito-button hito-button-secondary hito-button-sm hito-data-table-icon-button cursor-pointer list-none [&::-webkit-details-marker]:hidden"
          >
            <Icon name="search" size="sm" />
            <span className="sr-only">Search backlog</span>
          </summary>
          <form
            action="/admin/capture"
            className="mt-2 flex flex-wrap items-center gap-2"
            method="get"
          >
            <CaptureSearchHiddenInputs search={search} omit="q" />
            <label className="hito-field hito-field-sm hito-data-table-search">
              <span className="sr-only">Search backlog</span>
              <Icon name="search" size="xs" className="text-muted-foreground" />
              <input
                className="hito-data-table-search-input"
                defaultValue={query}
                name="q"
                placeholder="Search notes, routes, text, or role"
                type="search"
              />
              {query ? (
                <a
                  aria-label="Clear search backlog"
                  className="hito-button hito-button-ghost hito-button-xs hito-data-table-search-clear"
                  href={buildCaptureHref(search, { q: "" })}
                >
                  <Icon name="close" size="xs" />
                </a>
              ) : null}
            </label>
            <button type="submit" className="hito-button hito-button-secondary hito-button-sm">
              Apply
            </button>
          </form>
        </details>

        <details className="group" suppressHydrationWarning>
          <summary className="hito-button hito-button-secondary hito-button-sm hito-data-table-filter-summary cursor-pointer list-none [&::-webkit-details-marker]:hidden">
            <Icon name="settings" size="xs" />
            Filters
            {activeFilterCount > 0 ? (
              <span className="hito-tab-badge">{activeFilterCount}</span>
            ) : null}
          </summary>
          <CaptureFilterPanel clearFiltersHref={clearFiltersHref} filters={search} />
        </details>
        {activeFilterCount > 0 ? (
          <a className="hito-button hito-button-ghost hito-button-sm" href={clearFiltersHref}>
            Clear filters
          </a>
        ) : null}
      </div>
      <p className="hito-field-helper whitespace-nowrap">{rowCountLabel}</p>
    </div>
  );
}

function CaptureFilterPanel({
  clearFiltersHref,
  filters,
}: {
  clearFiltersHref: string;
  filters: CaptureSearch;
}) {
  return (
    <form action="/admin/capture" className="hito-surface-flat mt-2 grid gap-4 p-4" method="get">
      <input type="hidden" name="status" value={filters.status} />
      <input type="hidden" name="q" value={filters.q} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <SelectField
          label="Type"
          name="type"
          value={filters.type}
          options={[
            { value: "all", label: "All" },
            ...adminCaptureItemTypes.map((type) => ({ value: type, label: formatItemType(type) })),
          ]}
        />
        <SelectField
          label="Priority"
          name="priority"
          value={filters.priority}
          options={[
            { value: "all", label: "All" },
            ...adminCapturePriorities.map((priority) => ({
              value: priority,
              label: formatPriority(priority),
            })),
          ]}
        />
        <SelectField
          label="Target role"
          name="role"
          value={filters.role}
          options={[
            { value: "all", label: "All" },
            ...adminCaptureTargetRoles.map((role) => ({
              value: role,
              label: formatTargetRole(role),
            })),
          ]}
        />
        <button type="submit" className="hito-button hito-button-primary hito-button-md">
          Apply filters
        </button>
        <a className="hito-button hito-button-secondary hito-button-md" href={clearFiltersHref}>
          Clear filters
        </a>
      </div>
    </form>
  );
}

function QuickNotePanel({
  quickNote,
  setQuickNote,
  onSubmit,
}: {
  quickNote: QuickNoteState;
  setQuickNote: React.Dispatch<React.SetStateAction<QuickNoteState>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <details
      className="hito-row-group"
      suppressHydrationWarning
      {...(quickNote.open || Boolean(quickNote.error || quickNote.success) ? { open: true } : {})}
    >
      <summary className="hito-list-row w-full cursor-pointer text-left list-none [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="hito-list-row-title flex items-center gap-2">
            <Icon name="plus" size="xs" className="text-signal" />
            Quick note
          </span>
          <span className="hito-list-row-copy">Add a backlog item without selecting UI.</span>
        </span>
        <Icon name="chevron-down" size="sm" />
      </summary>
      <form className="grid gap-4 border-t border-hairline p-4" onSubmit={onSubmit}>
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
    </details>
  );
}

function CaptureBacklogList({
  appendNotes,
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
  onUpdateTriage,
}: {
  appendNotes: Record<string, string>;
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
      search.q || search.type !== "all" || search.priority !== "all" || search.role !== "all";

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
    <div className="hito-row-group">
      {result.items.map((item) => {
        const expanded = expandedItemId === item.id;
        return (
          <article key={item.id}>
            <button
              type="button"
              className="hito-list-row w-full text-left"
              aria-expanded={expanded}
              onClick={() => setExpandedItemId(expanded ? null : item.id)}
            >
              <span className="grid min-w-0 gap-2">
                <span className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="hito-list-row-title truncate font-medium">{item.title}</span>
                  <CapturePill>{formatItemType(item.itemType)}</CapturePill>
                  <StatusPill status={item.status} />
                  {item.priority ? <PriorityPill priority={item.priority} /> : null}
                  {item.targetRole ? (
                    <CapturePill>{formatTargetRole(item.targetRole)}</CapturePill>
                  ) : null}
                  {item.promptReady ? (
                    <span className="hito-status-pill" data-tone="signal">
                      Prompt ready
                    </span>
                  ) : null}
                </span>
                <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <code className="hito-technical-mono truncate">{item.route ?? "No route"}</code>
                  <span>{formatDateTime(item.createdAt)}</span>
                  <span>{item.source === "captured_ui" ? "Captured UI" : "Quick note"}</span>
                  <span>
                    {item.assetCount > 0 ? `${item.assetCount} screenshot` : "No screenshot"}
                  </span>
                </span>
              </span>
              <Icon
                name={expanded ? "chevron-up" : "chevron-down"}
                size="sm"
                className="shrink-0"
              />
            </button>
            {expanded ? (
              <CaptureItemDetail
                appendNote={appendNotes[item.id] ?? ""}
                copyFallbackPrompt={copyFallbackPrompts[item.id] ?? null}
                item={item}
                mutation={mutation}
                onAppendNote={() => onAppendNote(item)}
                onAppendNoteChange={(note) =>
                  setAppendNotes((current) => ({ ...current, [item.id]: note }))
                }
                onCopyPrompt={() => onCopyPrompt(item)}
                onUpdateTriage={(patch) => onUpdateTriage(item, patch)}
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
  copyFallbackPrompt,
  item,
  mutation,
  onAppendNote,
  onAppendNoteChange,
  onCopyPrompt,
  onUpdateTriage,
}: {
  appendNote: string;
  copyFallbackPrompt: string | null;
  item: AdminCaptureItemView;
  mutation: MutationState;
  onAppendNote: () => void;
  onAppendNoteChange: (note: string) => void;
  onCopyPrompt: () => void;
  onUpdateTriage: (patch: {
    itemType?: AdminCaptureItemType;
    status?: AdminCaptureStatus;
    priority?: AdminCapturePriority | null;
    targetRole?: AdminCaptureTargetRole | null;
  }) => void;
}) {
  const currentMutation =
    mutation.itemId === item.id && mutation.message ? (
      <p
        className={mutation.tone === "error" ? "hito-field-error" : "hito-field-helper text-signal"}
      >
        {mutation.message}
      </p>
    ) : null;

  return (
    <div className="grid gap-5 border-t border-hairline bg-foreground/[0.025] p-4">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <DetailBlock title="Captured context">
          <DetailRow label="Route" value={item.route ?? "Not captured"} code />
          <DetailRow label="URL" value={item.pageUrl} code />
          <DetailRow
            label="Selected text"
            value={item.selectedElement.text ?? "No selected element"}
          />
          <DetailRow
            label="Nearby heading"
            value={item.selectedElement.nearbyHeading ?? "Not captured"}
          />
          <DetailRow
            label="Selector"
            value={item.selectedElement.selector ?? "Not captured"}
            code
          />
          <DetailRow label="DOM path" value={item.selectedElement.domPath ?? "Not captured"} code />
        </DetailBlock>
        <DetailBlock title="Triage">
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField
              label="Status"
              value={item.status}
              onChange={(status) => onUpdateTriage({ status: status as AdminCaptureStatus })}
              options={adminCaptureStatuses.map((status) => ({
                value: status,
                label: formatStatusLabel(status),
              }))}
            />
            <SelectField
              label="Type"
              value={item.itemType}
              onChange={(itemType) =>
                onUpdateTriage({ itemType: itemType as AdminCaptureItemType })
              }
              options={adminCaptureItemTypes.map((type) => ({
                value: type,
                label: formatItemType(type),
              }))}
            />
            <SelectField
              label="Priority"
              value={item.priority ?? ""}
              onChange={(priority) =>
                onUpdateTriage({ priority: priority ? (priority as AdminCapturePriority) : null })
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
              value={item.targetRole ?? ""}
              onChange={(targetRole) =>
                onUpdateTriage({
                  targetRole: targetRole ? (targetRole as AdminCaptureTargetRole) : null,
                })
              }
              options={[
                { value: "", label: "Unset" },
                ...adminCaptureTargetRoles.map((role) => ({
                  value: role,
                  label: formatTargetRole(role),
                })),
              ]}
            />
          </div>
          {currentMutation}
        </DetailBlock>
      </div>

      <DetailBlock title="Admin note">
        <p className="hito-body whitespace-pre-wrap text-foreground">{item.note}</p>
        <label className="mt-4 grid gap-2">
          <span className="hito-label">Append note</span>
          <textarea
            className="hito-field min-h-24 resize-y p-3"
            value={appendNote}
            onChange={(event) => onAppendNoteChange(event.target.value)}
            placeholder="Add follow-up context."
          />
        </label>
        <button
          type="button"
          className="hito-button hito-button-secondary hito-button-sm"
          onClick={onAppendNote}
        >
          Save note
        </button>
      </DetailBlock>

      <div className="grid gap-4 lg:grid-cols-3">
        <DetailBlock title="Assets">
          <p className="hito-field-helper">
            {item.assetCount > 0
              ? `${item.assetCount} stored asset(s). Screenshot viewing is not part of this v1 slice.`
              : "No screenshot"}
          </p>
        </DetailBlock>
        <DetailBlock title="Prompt handoff">
          <p className="hito-field-helper">
            {item.targetRole
              ? "Copy a deterministic role-ready prompt for manual Codex handoff."
              : "Set a target role to copy a role-ready prompt."}
          </p>
          <button
            type="button"
            className="hito-button hito-button-primary hito-button-sm"
            onClick={onCopyPrompt}
          >
            <Icon name="copy" size="xs" />
            Copy prompt
          </button>
          {copyFallbackPrompt ? (
            <label className="grid gap-2">
              <span className="hito-label">Selectable prompt fallback</span>
              <textarea
                className="hito-field min-h-32 resize-y p-3 font-mono text-xs"
                readOnly
                value={copyFallbackPrompt}
                onFocus={(event) => event.currentTarget.select()}
              />
            </label>
          ) : null}
        </DetailBlock>
        <DetailBlock title="Metadata">
          <DetailRow label="Created by" value={item.createdByLabel ?? item.createdByUserId} />
          <DetailRow label="Created" value={formatDateTime(item.createdAt)} />
          <DetailRow label="Updated" value={formatDateTime(item.updatedAt)} />
          <DetailRow
            label="Viewport"
            value={
              item.viewport.width && item.viewport.height
                ? `${item.viewport.width} x ${item.viewport.height}`
                : "Not captured"
            }
          />
        </DetailBlock>
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
      ? "Capture backlog unavailable."
      : "Capture backlog unavailable.";

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
            <Link
              to="/admin/analytics"
              className="hito-button hito-button-secondary hito-button-md"
            >
              Back to analytics
            </Link>
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

function DetailBlock({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="grid gap-3 rounded-2xl border border-hairline bg-background/50 p-4">
      <h3 className="hito-label text-foreground">{title}</h3>
      {children}
    </section>
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

function SelectField({
  label,
  name,
  onChange,
  options,
  value,
}: {
  label: string;
  name?: string;
  onChange?: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  value: string;
}) {
  return (
    <label className="grid min-w-0 flex-1 gap-2">
      <span className="hito-label">{label}</span>
      <select
        className="hito-field hito-field-md"
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
  const tone =
    status === "ready_for_codex"
      ? "signal"
      : status === "done"
        ? "success"
        : status === "archived"
          ? "warning"
          : undefined;

  return (
    <span className="hito-status-pill" data-tone={tone}>
      {formatStatusLabel(status)}
    </span>
  );
}

function PriorityPill({ priority }: { priority: AdminCapturePriority }) {
  const tone = priority === "urgent" || priority === "high" ? "warning" : undefined;

  return (
    <span className="hito-status-pill" data-tone={tone}>
      {formatPriority(priority)}
    </span>
  );
}

function CaptureSearchHiddenInputs({
  omit,
  search,
}: {
  omit?: keyof CaptureSearch;
  search: CaptureSearch;
}) {
  return (
    <>
      {omit !== "status" ? <input type="hidden" name="status" value={search.status} /> : null}
      {omit !== "type" ? <input type="hidden" name="type" value={search.type} /> : null}
      {omit !== "priority" ? <input type="hidden" name="priority" value={search.priority} /> : null}
      {omit !== "role" ? <input type="hidden" name="role" value={search.role} /> : null}
      {omit !== "q" ? <input type="hidden" name="q" value={captureQueryText(search.q)} /> : null}
    </>
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

function parseCaptureStatus(value: unknown): CaptureStatusFilter {
  return value === "all" || adminCaptureStatuses.includes(value as AdminCaptureStatus)
    ? (value as CaptureStatusFilter)
    : "new";
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
      return "All";
    case "new":
      return "New";
    case "in_review":
      return "In review";
    case "ready_for_codex":
      return "Ready for Codex";
    case "done":
      return "Done";
    case "archived":
      return "Archived";
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

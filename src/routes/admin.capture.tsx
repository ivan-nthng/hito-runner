import { Link, createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  AdminDataTableToolbar,
  AdminMetadataMenu,
  type AdminDataTableActiveFilter,
  type AdminDataTableToolbarFilterSection,
} from "@/components/admin/AdminOperationalComponents";
import {
  AdminWorkspacePageHeader,
  AdminWorkspaceSidebar,
} from "@/components/admin/AdminWorkspaceNav";
import {
  buildCaptureHref,
  captureQueryText,
  copyTextToClipboard,
  countForStatusFilter,
  EDITABLE_CAPTURE_STATUS_OPTIONS,
  filterBacklogViewForStatus,
  formatCaptureMutationError,
  formatDateTime,
  formatItemSource,
  formatItemType,
  formatItemTypeTagValue,
  formatMarkdownMetadataValue,
  formatMetadataFieldName,
  formatMetadataLabel,
  formatMetadataTagValue,
  formatPriority,
  formatPriorityTagValue,
  formatRepoMarkdownStatus,
  formatStatusLabel,
  formatStatusTagValue,
  formatTargetRole,
  formatTargetRoleTagValue,
  getActiveCaptureFilters,
  getFormText,
  getRepoDerivedInfo,
  initialQuickNoteState,
  markdownPriorityTone,
  parseCaptureItemType,
  parseCaptureSourceGroup,
  parseCaptureStatus,
  parseNullableFilter,
  parseOptionalCapturePriority,
  parseOptionalCaptureTargetRole,
  parseSearchQuery,
  priorityTone,
  readOnlyMetadataTooltip,
  repoMarkdownStatusTone,
  STATUS_FILTERS,
  statusIcon,
  statusTone,
  type CaptureSearch,
  type CaptureStatusFilter,
  type MutationState,
  type QuickNoteState,
  type RepoDerivedInfo,
} from "@/components/admin/admin-capture-view-model";
import { Icon } from "@/components/ui/icon";
import { HitoMetadataTag } from "@/components/ui/metadata-tag";
import { HitoNativeSelectField } from "@/components/ui/native-select-field";
import {
  adminCaptureItemTypes,
  adminCapturePriorities,
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
  type AdminCaptureSourceGroupFilter,
  type AdminCaptureStatus,
  type AdminCaptureTargetRole,
} from "@/lib/admin-capture";
import { APP_NAME } from "@/lib/app-config";
import { adminWorkItemSourceGroupOptions } from "@/lib/admin-work-items";

export const Route = createFileRoute("/admin/capture")({
  validateSearch: (search: Record<string, unknown>): CaptureSearch => ({
    status: parseCaptureStatus(search.status),
    source: parseCaptureSourceGroup(search.source),
    type: parseNullableFilter(search.type, adminCaptureItemTypes),
    priority: parseNullableFilter(search.priority, adminCapturePriorities),
    role: parseNullableFilter(search.role, adminCaptureTargetRoles),
    q: parseSearchQuery(search.q),
  }),
  head: () => ({
    meta: [
      { title: `Work items — ${APP_NAME}` },
      {
        name: "description",
        content: "Internal Hito work-item surface for repo tasks, plans, specs, and admin notes.",
      },
    ],
  }),
  loader: async ({ location }) => {
    const search = location.search as CaptureSearch;
    const listInput = {
      itemType: search.type === "all" ? null : search.type,
      priority: search.priority === "all" ? null : search.priority,
      targetRole: search.role === "all" ? null : search.role,
      sourceGroup: search.source,
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

  const clearFiltersHref = buildCaptureHref(search, {
    source: "all_work",
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
        open: false,
        success: "Note saved.",
      });
      await router.invalidate({ sync: true });
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
      await router.invalidate({ sync: true });
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
      await router.invalidate({ sync: true });
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
      await router.invalidate({ sync: true });
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
      <div className="hito-workbench-shell hito-workbench-shell-compact-sidebar">
        <AdminWorkspaceSidebar activeSection="work-items" />

        <section className="hito-workbench-main">
          <AdminWorkspacePageHeader
            activeSection="work-items"
            title="Work items"
            description="Review repo work items, active plans, specs, briefs, and admin notes for manual handoff."
            mobileMeta={formatStatusLabel(search.status)}
            action={
              <QuickNotePanel
                quickNote={quickNote}
                setQuickNote={setQuickNote}
                onSubmit={submitQuickNote}
                variant="header"
              />
            }
          />

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
          <p className="hito-label">Loading work items...</p>
          <h1 className="hito-page-title mt-3">Fetching repo work items and notes.</h1>
        </section>
      </div>
    </main>
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
  clearFiltersHref,
  query,
  rowCountLabel,
  search,
}: {
  clearFiltersHref: string;
  query: string;
  rowCountLabel: string;
  search: CaptureSearch;
}) {
  const [draftQuery, setDraftQuery] = useState(query);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const activeFilters = getActiveCaptureFilters(search).map(
    (filter): AdminDataTableActiveFilter => ({
      id: filter.id,
      label: filter.label,
      value: filter.value,
      onRemove: () => goToFilter(filter.removePatch),
    }),
  );
  const filterSections: AdminDataTableToolbarFilterSection[] = [
    {
      currentValue: search.source,
      label: "Source",
      options: adminWorkItemSourceGroupOptions,
      onSelect: (source) => goToFilter({ source: source as AdminCaptureSourceGroupFilter }),
    },
    {
      currentValue: search.type,
      label: "Type",
      options: [
        { value: "all", label: "All" },
        ...adminCaptureItemTypes.map((type) => ({
          value: type,
          label: formatItemType(type),
        })),
      ],
      onSelect: (type) => goToFilter({ type: type as CaptureSearch["type"] }),
    },
    {
      currentValue: search.priority,
      label: "Priority",
      options: [
        { value: "all", label: "All" },
        ...adminCapturePriorities.map((priority) => ({
          value: priority,
          label: formatPriority(priority),
        })),
      ],
      onSelect: (priority) => goToFilter({ priority: priority as CaptureSearch["priority"] }),
    },
    {
      currentValue: search.role,
      label: "Target role",
      options: [
        { value: "all", label: "All" },
        ...adminCaptureTargetRoles.map((role) => ({
          value: role,
          label: formatTargetRole(role),
        })),
      ],
      onSelect: (role) => goToFilter({ role: role as CaptureSearch["role"] }),
    },
  ];

  return (
    <AdminDataTableToolbar
      activeFilters={activeFilters}
      clearAllFilters={() => {
        window.location.href = clearFiltersHref;
      }}
      clearAllFiltersMinCount={1}
      filterAriaSubject="work-item filters"
      filterButtonAriaLabel={
        activeFilters.length > 0
          ? `${activeFilters.length} active work-item filters`
          : "Work-item filters"
      }
      filterSections={filterSections}
      onQueryChange={updateQuery}
      query={query}
      rowCountLabel={rowCountLabel}
      searchClearHref={buildCaptureHref(search, { q: "" })}
      searchLabel="Search work items"
      searchPlaceholder="Search notes, routes, text, or role"
      searchValue={draftQuery}
      variant="admin"
    />
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
  const forceOpen = quickNote.open || Boolean(quickNote.error);
  const [disclosureOpen, setDisclosureOpen] = useState(false);
  const isOpen = forceOpen || disclosureOpen;

  useEffect(() => {
    if (quickNote.success && !quickNote.error && !quickNote.pending) {
      setDisclosureOpen(false);
    }
  }, [quickNote.error, quickNote.pending, quickNote.success]);

  const panel = (
    <div className={isHeader ? "hito-admin-quick-note-panel" : undefined}>
      <form className="hito-admin-quick-note-surface" onSubmit={onSubmit}>
        <div className="grid gap-1">
          <h2 className="hito-body font-medium text-foreground">Add quick note</h2>
          <p className="hito-field-helper">Capture a work item without selecting UI.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-4">
          <HitoNativeSelectField
            label="Type"
            name="itemType"
            value={quickNote.itemType}
            onValueChange={(itemType) =>
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
          <HitoNativeSelectField
            label="Priority"
            name="priority"
            value={quickNote.priority}
            onValueChange={(priority) =>
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
          <HitoNativeSelectField
            label="Target role"
            name="targetRole"
            value={quickNote.targetRole}
            onValueChange={(targetRole) =>
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
            onClick={() => {
              setQuickNote(initialQuickNoteState);
              setDisclosureOpen(false);
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );

  if (isHeader) {
    return (
      <div className="relative">
        <button
          type="button"
          className="hito-button hito-button-primary hito-button-md"
          aria-expanded={isOpen}
          onClick={() => setDisclosureOpen((open) => !open)}
        >
          <Icon name="plus" size="xs" />
          Add quick note
        </button>
        {isOpen ? panel : null}
      </div>
    );
  }

  return (
    <details
      className="hito-row-group"
      open={isOpen}
      suppressHydrationWarning
      onToggle={(event) => {
        if (!forceOpen) {
          setDisclosureOpen(event.currentTarget.open);
        }
      }}
    >
      <summary className="hito-list-row w-full cursor-pointer text-left list-none [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="hito-list-row-title flex items-center gap-2">
            <Icon name="plus" size="xs" className="text-signal" />
            Add quick note
          </span>
          <span className="hito-list-row-copy">Capture a work item without selecting UI.</span>
        </span>
        <Icon name="chevron-down" size="sm" />
      </summary>
      {panel}
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
        title="No work items yet."
        description="Repo work items, captured UI notes, and quick admin notes will appear here."
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
                  {repoSource.sourceGroupLabel ? <span>{repoSource.sourceGroupLabel}</span> : null}
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
                    <AdminMetadataMenu
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
                    <AdminMetadataMenu
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
                    <AdminMetadataMenu
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
                    <AdminMetadataMenu
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
                {repoSource.sourceLabel ?? "Repo mirror"}
              </HitoMetadataTag>
              <span>Markdown is the source of truth. This item is read-only in Work items.</span>
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
            {repoSource.sourceLabel ? (
              <DetailRow label="Source" value={repoSource.sourceLabel} />
            ) : null}
            {repoSource.sourceGroupLabel ? (
              <DetailRow label="Source group" value={repoSource.sourceGroupLabel} />
            ) : null}
            {repoSource.sourceType ? (
              <DetailRow label="Source type" value={repoSource.sourceType} />
            ) : null}
            {repoSource.workItemKind ? (
              <DetailRow label="Work item kind" value={repoSource.workItemKind} />
            ) : null}
            {repoSource.workItemLifecycle ? (
              <DetailRow label="Lifecycle" value={repoSource.workItemLifecycle} />
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
      ? "Work items unavailable."
      : "Work items unavailable.";

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

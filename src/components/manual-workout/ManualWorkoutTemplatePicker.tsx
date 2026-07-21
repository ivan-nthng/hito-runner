import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { ManualWorkoutTemplateColorIndicator } from "@/components/manual-workout/ManualWorkoutTemplateColorIndicator";
import {
  targetTruthModeLabel,
  templateRunnerFacingLabel,
} from "@/components/manual-workout/manual-workout-authoring-utils";
import type { ManualWorkoutSavedTemplateView } from "@/lib/manual-workout-authoring";
import type { ManualWorkoutTemplate } from "@/lib/manual-workout-authoring/templates";
import { formatDistanceMeters, formatDurationMin } from "@/lib/training";
import {
  EMPTY_TEMPLATE_CATALOG_STATE,
  type ManualTemplateCatalogState,
} from "@/components/manual-workout/ManualWorkoutTemplatePicker.model";

export function ManualTemplatePickerDialog({
  catalogAction,
  catalogState = EMPTY_TEMPLATE_CATALOG_STATE,
  onDeleteSavedTemplate,
  onHideBuiltInTemplate,
  onOpenChange,
  onRefreshCatalog,
  onRestoreAllBuiltInTemplates,
  onRestoreBuiltInTemplate,
  onSelectSavedTemplate,
  onSelectTemplate,
  open,
}: {
  catalogAction: string | null;
  catalogState?: ManualTemplateCatalogState;
  onDeleteSavedTemplate: (template: ManualWorkoutSavedTemplateView) => void;
  onHideBuiltInTemplate: (template: ManualWorkoutTemplate) => void;
  onOpenChange: (open: boolean) => void;
  onRefreshCatalog: () => void;
  onRestoreAllBuiltInTemplates: () => void;
  onRestoreBuiltInTemplate: (template: ManualWorkoutTemplate) => void;
  onSelectSavedTemplate: (template: ManualWorkoutSavedTemplateView) => void;
  onSelectTemplate: (template: ManualWorkoutTemplate) => void;
  open: boolean;
}) {
  const catalog = catalogState.catalog;
  const isLoading = catalogState.status === "loading";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="hito-dialog-stable hito-product-dialog hito-dialog-surface-product hito-dialog-size-workflow hito-dialog-height-workflow"
        overlayClassName="hito-dialog-overlay-stable"
      >
        <DialogHeader className="hito-product-dialog-header">
          <DialogTitle className="hito-modal-title">Choose template</DialogTitle>
          <DialogDescription className="hito-body">
            Choose a template, adjust the workout, then ask Hito to review it before anything is
            created.
          </DialogDescription>
        </DialogHeader>

        <div className="hito-product-dialog-body-scroll-fill grid gap-5">
          {!catalog ? (
            <div className="hito-row-group">
              <div className="hito-list-row items-start">
                <span
                  className="hito-status-pill mt-0.5 shrink-0"
                  data-tone={catalogState.status === "failed" ? "warning" : "muted"}
                >
                  {catalogState.status === "failed" ? "Unavailable" : "Loading"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="hito-list-row-title">
                    {catalogState.status === "failed"
                      ? "Workout templates could not be loaded"
                      : "Checking workout templates"}
                  </p>
                  <p className="hito-list-row-copy">
                    {catalogState.message ??
                      "Hito is loading built-in and personal templates for this account."}
                  </p>
                </div>
                {catalogState.status === "failed" ? (
                  <button
                    type="button"
                    className="hito-button hito-button-ghost hito-button-sm shrink-0"
                    onClick={onRefreshCatalog}
                  >
                    <Icon name="refresh" size="xs" />
                    Retry
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <>
              <section className="grid gap-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="hito-label">My templates</p>
                  <button
                    type="button"
                    className="hito-button hito-button-ghost hito-button-sm"
                    disabled={isLoading || Boolean(catalogAction)}
                    onClick={onRefreshCatalog}
                  >
                    <Icon name="refresh" size="xs" />
                    Refresh
                  </button>
                </div>
                <div className="hito-row-group">
                  {catalog.personalTemplates.length === 0 ? (
                    <div className="hito-list-row items-start">
                      <span className="hito-status-pill mt-0.5 shrink-0" data-tone="muted">
                        Empty
                      </span>
                      <p className="hito-list-row-copy">
                        Save a reviewed workout to reuse it as a personal template.
                      </p>
                    </div>
                  ) : (
                    catalog.personalTemplates.map((template) => (
                      <div key={template.id} className="hito-list-row gap-2">
                        <button
                          type="button"
                          className="min-w-0 flex-1 text-left"
                          disabled={Boolean(catalogAction)}
                          onClick={() => onSelectSavedTemplate(template)}
                        >
                          <span className="hito-list-row-title block">{template.displayName}</span>
                          <span className="hito-list-row-copy block">
                            {savedTemplateSummary(template)}
                          </span>
                        </button>
                        <TemplateActionMenu
                          actionLabel="Delete template"
                          destructive
                          disabled={Boolean(catalogAction)}
                          label={`Actions for ${template.displayName}`}
                          onAction={() => onDeleteSavedTemplate(template)}
                        />
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="grid gap-2">
                <p className="hito-label">Built-in templates</p>
                <div className="hito-row-group">
                  {catalog.visibleBuiltInTemplates.length === 0 ? (
                    <div className="hito-list-row items-start">
                      <span className="hito-status-pill mt-0.5 shrink-0" data-tone="muted">
                        Hidden
                      </span>
                      <p className="hito-list-row-copy">
                        Restore a built-in template below to show it in the picker.
                      </p>
                    </div>
                  ) : (
                    catalog.visibleBuiltInTemplates.map((template) => {
                      const label = templateRunnerFacingLabel(template);
                      return (
                        <div key={template.templateKey} className="hito-list-row gap-2">
                          <button
                            type="button"
                            className="flex min-w-0 flex-1 items-center gap-3 text-left"
                            disabled={Boolean(catalogAction)}
                            onClick={() => onSelectTemplate(template)}
                          >
                            <ManualWorkoutTemplateColorIndicator template={template} />
                            <span className="hito-list-row-title block min-w-0">{label}</span>
                          </button>
                          <TemplateActionMenu
                            actionLabel="Hide from picker"
                            disabled={Boolean(catalogAction)}
                            label={`Actions for ${label}`}
                            onAction={() => onHideBuiltInTemplate(template)}
                          />
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

              {catalog.hiddenBuiltInTemplates.length ? (
                <section className="grid gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="hito-label">Hidden built-ins</p>
                    <button
                      type="button"
                      className="hito-button hito-button-ghost hito-button-sm"
                      disabled={Boolean(catalogAction)}
                      onClick={onRestoreAllBuiltInTemplates}
                    >
                      <Icon name="refresh" size="xs" />
                      Restore all
                    </button>
                  </div>
                  <div className="hito-row-group">
                    {catalog.hiddenBuiltInTemplates.map((template) => {
                      const label = templateRunnerFacingLabel(template);
                      return (
                        <div key={template.templateKey} className="hito-list-row gap-2">
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <ManualWorkoutTemplateColorIndicator template={template} />
                            <span className="hito-list-row-title block min-w-0">{label}</span>
                          </div>
                          <button
                            type="button"
                            className="hito-button hito-button-ghost hito-button-sm shrink-0"
                            disabled={Boolean(catalogAction)}
                            onClick={() => onRestoreBuiltInTemplate(template)}
                          >
                            Restore
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ) : null}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TemplateActionMenu({
  actionLabel,
  destructive = false,
  disabled,
  label,
  onAction,
}: {
  actionLabel: string;
  destructive?: boolean;
  disabled: boolean;
  label: string;
  onAction: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className="hito-button hito-button-ghost hito-button-sm aspect-square shrink-0 p-0"
          disabled={disabled}
        >
          <Icon name="more-horizontal" size="xs" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          className={destructive ? "text-destructive" : undefined}
          onSelect={onAction}
        >
          {destructive ? <Icon name="trash" size="xs" /> : <Icon name="visibility-off" size="xs" />}
          {actionLabel}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function savedTemplateSummary(template: ManualWorkoutSavedTemplateView) {
  const parts = [
    targetTruthModeLabel(template.targetTruthMode),
    formatDurationMin(template.draftPayload.totalDurationMin),
  ];

  if (template.draftPayload.totalDistanceKm > 0) {
    parts.push(formatDistanceMeters(template.draftPayload.totalDistanceKm * 1000));
  }

  return parts.join(" · ");
}

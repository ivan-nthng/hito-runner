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
import { HitoButton } from "@/components/ui/button";
import { ManualWorkoutTemplateColorIndicator } from "@/components/manual-workout/ManualWorkoutTemplateColorIndicator";
import { templateRunnerFacingLabel } from "@/components/manual-workout/manual-workout-authoring-utils";
import type { ManualWorkoutSavedTemplateView } from "@/lib/manual-workout-authoring";
import type { ManualWorkoutTemplate } from "@/lib/manual-workout-authoring/templates";
import { formatUiNumber, type ResolvedUiLocale } from "@/lib/ui-locale";
import {
  EMPTY_TEMPLATE_CATALOG_STATE,
  type ManualTemplateCatalogState,
} from "@/components/manual-workout/ManualWorkoutTemplatePicker.model";
import { useHitoProductMessage, useHitoUiLocale } from "@/components/ui/hito-ui-locale-provider";
import { getHitoKnownProductMessage } from "@/lib/ui-locale-messages";

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
  const locale = useHitoUiLocale();
  const t = useHitoProductMessage();
  const catalog = catalogState.catalog;
  const isLoading = catalogState.status === "loading";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="hito-dialog-stable hito-product-dialog hito-dialog-surface-product hito-dialog-size-workflow hito-dialog-height-workflow"
        overlayClassName="hito-dialog-overlay-stable"
      >
        <DialogHeader className="hito-product-dialog-header">
          <DialogTitle className="hito-ui-title-md text-foreground">
            {t("Choose template")}
          </DialogTitle>
          <DialogDescription className="hito-body-md text-secondary">
            {t(
              "Choose a template, adjust the workout, then ask Hito to review it before anything is created.",
            )}
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
                  {catalogState.status === "failed" ? t("Unavailable") : t("Loading")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="hito-body-md text-foreground">
                    {catalogState.status === "failed"
                      ? t("Workout templates could not be loaded")
                      : t("Checking workout templates")}
                  </p>
                  <p className="hito-body-sm mt-1 text-secondary">
                    {catalogState.message ??
                      t("Hito is loading built-in and personal templates for this account.")}
                  </p>
                </div>
                {catalogState.status === "failed" ? (
                  <HitoButton
                    type="button"
                    className="shrink-0"
                    size="sm"
                    variant="ghost"
                    onClick={onRefreshCatalog}
                  >
                    <Icon name="refresh" size="xs" />
                    {t("Retry")}
                  </HitoButton>
                ) : null}
              </div>
            </div>
          ) : (
            <>
              <section className="grid gap-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="hito-label-md text-foreground">{t("My templates")}</p>
                  <HitoButton
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={isLoading || Boolean(catalogAction)}
                    onClick={onRefreshCatalog}
                  >
                    <Icon name="refresh" size="xs" />
                    {t("Refresh")}
                  </HitoButton>
                </div>
                <div className="hito-row-group">
                  {catalog.personalTemplates.length === 0 ? (
                    <div className="hito-list-row items-start">
                      <span className="hito-status-pill mt-0.5 shrink-0" data-tone="muted">
                        {t("Empty")}
                      </span>
                      <p className="hito-body-sm mt-1 text-secondary">
                        {t("Save a reviewed workout to reuse it as a personal template.")}
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
                          <span className="hito-body-md text-foreground block">
                            {template.displayName}
                          </span>
                          <span className="hito-body-sm mt-1 text-secondary block">
                            {savedTemplateSummary(template, locale)}
                          </span>
                        </button>
                        <TemplateActionMenu
                          actionLabel={t("Delete template")}
                          destructive
                          disabled={Boolean(catalogAction)}
                          label={t("Actions for {name}", { name: template.displayName })}
                          onAction={() => onDeleteSavedTemplate(template)}
                        />
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="grid gap-2">
                <p className="hito-label-md text-foreground">{t("Built-in templates")}</p>
                <div className="hito-row-group">
                  {catalog.visibleBuiltInTemplates.length === 0 ? (
                    <div className="hito-list-row items-start">
                      <span className="hito-status-pill mt-0.5 shrink-0" data-tone="muted">
                        {t("Hidden")}
                      </span>
                      <p className="hito-body-sm mt-1 text-secondary">
                        {t("Restore a built-in template below to show it in the picker.")}
                      </p>
                    </div>
                  ) : (
                    catalog.visibleBuiltInTemplates.map((template) => {
                      const label = getHitoKnownProductMessage(
                        locale,
                        templateRunnerFacingLabel(template),
                      );
                      return (
                        <div key={template.templateKey} className="hito-list-row gap-2">
                          <button
                            type="button"
                            className="flex min-w-0 flex-1 items-center gap-3 text-left"
                            disabled={Boolean(catalogAction)}
                            onClick={() => onSelectTemplate(template)}
                          >
                            <ManualWorkoutTemplateColorIndicator template={template} />
                            <span className="hito-body-md text-foreground block min-w-0">
                              {label}
                            </span>
                          </button>
                          <TemplateActionMenu
                            actionLabel={t("Hide from picker")}
                            disabled={Boolean(catalogAction)}
                            label={t("Actions for {name}", { name: label })}
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
                    <p className="hito-label-md text-foreground">{t("Hidden built-ins")}</p>
                    <HitoButton
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={Boolean(catalogAction)}
                      onClick={onRestoreAllBuiltInTemplates}
                    >
                      <Icon name="refresh" size="xs" />
                      {t("Restore all")}
                    </HitoButton>
                  </div>
                  <div className="hito-row-group">
                    {catalog.hiddenBuiltInTemplates.map((template) => {
                      const label = getHitoKnownProductMessage(
                        locale,
                        templateRunnerFacingLabel(template),
                      );
                      return (
                        <div key={template.templateKey} className="hito-list-row gap-2">
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <ManualWorkoutTemplateColorIndicator template={template} />
                            <span className="hito-body-md text-foreground block min-w-0">
                              {label}
                            </span>
                          </div>
                          <HitoButton
                            type="button"
                            className="shrink-0"
                            size="sm"
                            variant="ghost"
                            disabled={Boolean(catalogAction)}
                            onClick={() => onRestoreBuiltInTemplate(template)}
                          >
                            {t("Restore")}
                          </HitoButton>
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
        <HitoButton
          type="button"
          aria-label={label}
          className="shrink-0"
          disabled={disabled}
          iconOnly
          size="sm"
          variant="ghost"
        >
          <Icon name="more-horizontal" size="xs" />
        </HitoButton>
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

function savedTemplateSummary(template: ManualWorkoutSavedTemplateView, locale: ResolvedUiLocale) {
  const parts = [
    getHitoKnownProductMessage(
      locale,
      template.sourceWorkoutFamily === "rest" ? "Rest / no run" : "Workout guidance",
    ),
    `${formatUiNumber(template.draftPayload.totalDurationMin, locale, {
      maximumFractionDigits: 0,
    })} min`,
  ];

  if (template.draftPayload.totalDistanceKm > 0) {
    parts.push(
      `${formatUiNumber(Math.round(template.draftPayload.totalDistanceKm * 1000), locale)} m`,
    );
  }

  return parts.join(" · ");
}

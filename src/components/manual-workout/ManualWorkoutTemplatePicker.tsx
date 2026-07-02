import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { ManualWorkoutTemplateColorIndicator } from "@/components/manual-workout/ManualWorkoutTemplateColorIndicator";
import {
  VISIBLE_MANUAL_WORKOUT_STARTER_TEMPLATES,
  targetTruthModeLabel,
  templateRunnerFacingLabel,
} from "@/components/manual-workout/manual-workout-authoring-utils";
import type { ManualWorkoutSavedTemplateView } from "@/lib/manual-workout-authoring";
import type { ManualWorkoutTemplate } from "@/lib/manual-workout-authoring/templates";
import { formatDistanceMeters, formatDurationMin } from "@/lib/training";
import {
  EMPTY_SAVED_TEMPLATES_STATE,
  MANUAL_ADD_MENU_ICON_CLASS,
  MANUAL_ADD_MENU_ITEM_CLASS,
  MANUAL_ADD_MENU_SUBCONTENT_CLASS,
  MANUAL_TEMPLATE_MENU_ITEM_CLASS,
  type ManualSavedTemplatesState,
} from "@/components/manual-workout/ManualWorkoutTemplatePicker.model";

export function ManualTemplateSubmenu({
  disabled,
  onSelectSavedTemplate,
  onSelectTemplate,
  savedTemplatesState,
  triggerClassName,
}: {
  disabled: boolean;
  onSelectSavedTemplate: (template: ManualWorkoutSavedTemplateView) => void;
  onSelectTemplate: (template: ManualWorkoutTemplate) => void;
  savedTemplatesState: ManualSavedTemplatesState;
  triggerClassName?: string;
}) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger
        className={[MANUAL_ADD_MENU_ITEM_CLASS, triggerClassName].filter(Boolean).join(" ")}
        disabled={disabled}
      >
        <Icon className={MANUAL_ADD_MENU_ICON_CLASS} name="workout" size="xs" />
        <span className="min-w-0">
          <span className="hito-list-row-title block">Choose template</span>
          <span className="hito-list-row-copy block">Pick a workout type and keep editing.</span>
        </span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className={MANUAL_ADD_MENU_SUBCONTENT_CLASS}>
        <DropdownMenuLabel className="px-3 py-2">Choose template</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {savedTemplatesState.status === "loading" || savedTemplatesState.status === "idle" ? (
          <DropdownMenuItem className={MANUAL_ADD_MENU_ITEM_CLASS} disabled>
            <span className="hito-status-pill mt-0.5 shrink-0" data-tone="muted">
              Saved
            </span>
            <span className="min-w-0">
              <span className="hito-list-row-title block">Checking saved templates</span>
              <span className="hito-list-row-copy block">Personal templates will appear here.</span>
            </span>
          </DropdownMenuItem>
        ) : null}

        {savedTemplatesState.status === "failed" ? (
          <DropdownMenuItem className={MANUAL_ADD_MENU_ITEM_CLASS} disabled>
            <span className="hito-status-pill mt-0.5 shrink-0" data-tone="warning">
              Saved
            </span>
            <span className="min-w-0">
              <span className="hito-list-row-title block">Saved templates unavailable</span>
              <span className="hito-list-row-copy block">
                {savedTemplatesState.message ?? "Use a built-in template for now."}
              </span>
            </span>
          </DropdownMenuItem>
        ) : null}

        {savedTemplatesState.status === "ready" && savedTemplatesState.templates.length ? (
          <>
            <DropdownMenuLabel className="px-3 py-2">My saved templates</DropdownMenuLabel>
            {savedTemplatesState.templates.map((template) => (
              <DropdownMenuItem
                key={template.id}
                className={MANUAL_ADD_MENU_ITEM_CLASS}
                onSelect={(event) => {
                  event.preventDefault();
                  onSelectSavedTemplate(template);
                }}
              >
                <span className="min-w-0">
                  <span className="hito-list-row-title block">{template.displayName}</span>
                  <span className="hito-list-row-copy block">{savedTemplateSummary(template)}</span>
                </span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        ) : null}

        {VISIBLE_MANUAL_WORKOUT_STARTER_TEMPLATES.map((template) => (
          <DropdownMenuItem
            key={template.templateKey}
            className={MANUAL_TEMPLATE_MENU_ITEM_CLASS}
            onSelect={(event) => {
              event.preventDefault();
              onSelectTemplate(template);
            }}
          >
            <ManualWorkoutTemplateColorIndicator compact template={template} />
            <span className="min-w-0">
              <span className="hito-list-row-title block truncate">
                {templateRunnerFacingLabel(template)}
              </span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

export function ManualTemplatePickerDialog({
  onOpenChange,
  onRefreshSavedTemplates,
  onSelectSavedTemplate,
  onSelectTemplate,
  open,
  savedTemplatesState = EMPTY_SAVED_TEMPLATES_STATE,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefreshSavedTemplates?: () => void;
  onSelectSavedTemplate?: (template: ManualWorkoutSavedTemplateView) => void;
  onSelectTemplate: (template: ManualWorkoutTemplate) => void;
  savedTemplatesState?: ManualSavedTemplatesState;
}) {
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

        <div className="hito-product-dialog-body-scroll-fill grid gap-4">
          {onSelectSavedTemplate ? (
            <section className="grid gap-2">
              <div className="flex items-center justify-between gap-3">
                <p className="hito-label">My saved templates</p>
                {onRefreshSavedTemplates ? (
                  <button
                    type="button"
                    className="hito-button hito-button-ghost hito-button-sm"
                    disabled={savedTemplatesState.status === "loading"}
                    onClick={onRefreshSavedTemplates}
                  >
                    <Icon name="refresh" size="xs" />
                    Refresh
                  </button>
                ) : null}
              </div>
              <div className="hito-row-group">
                {savedTemplatesState.status === "loading" ? (
                  <div className="hito-list-row items-start">
                    <span className="hito-status-pill mt-0.5 shrink-0" data-tone="muted">
                      Loading
                    </span>
                    <p className="hito-list-row-copy">Checking your personal templates.</p>
                  </div>
                ) : null}

                {savedTemplatesState.status === "failed" ? (
                  <div className="hito-list-row items-start">
                    <span className="hito-status-pill mt-0.5 shrink-0" data-tone="warning">
                      Unavailable
                    </span>
                    <div className="min-w-0">
                      <p className="hito-list-row-title">Could not load saved templates</p>
                      <p className="hito-list-row-copy">
                        {savedTemplatesState.message ??
                          "Personal templates are not available right now."}
                      </p>
                    </div>
                  </div>
                ) : null}

                {savedTemplatesState.status === "ready" &&
                savedTemplatesState.templates.length === 0 ? (
                  <div className="hito-list-row items-start">
                    <span className="hito-status-pill mt-0.5 shrink-0" data-tone="muted">
                      Empty
                    </span>
                    <p className="hito-list-row-copy">
                      Save a reviewed manual workout to reuse it here.
                    </p>
                  </div>
                ) : null}

                {savedTemplatesState.templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    className="hito-list-row w-full items-start text-left"
                    onClick={() => onSelectSavedTemplate(template)}
                  >
                    <span className="min-w-0">
                      <span className="hito-list-row-title block">{template.displayName}</span>
                      <span className="hito-list-row-copy block">
                        {savedTemplateSummary(template)}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <div className="hito-row-group">
            {VISIBLE_MANUAL_WORKOUT_STARTER_TEMPLATES.map((template) => (
              <button
                key={template.templateKey}
                type="button"
                className="hito-list-row w-full items-center justify-start text-left"
                onClick={() => onSelectTemplate(template)}
              >
                <ManualWorkoutTemplateColorIndicator template={template} />
                <span className="min-w-0">
                  <span className="hito-list-row-title block">
                    {templateRunnerFacingLabel(template)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
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

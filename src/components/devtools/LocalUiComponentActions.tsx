import type { LocalUiComponentAction } from "@/components/devtools/local-ui-inspector-session";
import type { HitoDsOwnershipEvidence } from "@/components/hito-ds/reference-metadata";
import {
  PendingChangeRemoveButton,
  ValueTag,
} from "@/components/devtools/LocalUiPropertyControlPrimitives";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";

export function LocalUiComponentIdentity({ ownership }: { ownership: HitoDsOwnershipEvidence }) {
  if (!ownership.entry) return null;

  const componentName = ownership.entry.label;

  return (
    <p
      className="hito-caption flex min-w-0 items-center gap-1.5 text-info"
      data-local-ui-component-identity="confirmed"
    >
      <Icon name="components" size="xs" className="shrink-0" />
      <span
        className="min-w-0 truncate"
        aria-label={`Confirmed component: ${componentName}`}
        title={componentName}
      >
        {componentName}
      </span>
    </p>
  );
}

export function LocalUiActionsPropertyRow({
  onChange,
  ownership,
  value,
}: {
  onChange: (action: LocalUiComponentAction) => void;
  ownership: HitoDsOwnershipEvidence;
  value: LocalUiComponentAction;
}) {
  const selectedLabel =
    value?.type === "add_to_ds"
      ? "Add to design system"
      : value?.type === "remove_instance"
        ? "Remove object"
        : value?.type === "reuse_existing_component"
          ? "Reuse existing component"
          : null;

  return (
    <div className="grid min-w-0 gap-1 py-0.5" data-local-ui-property-control-row="Actions">
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="grid size-5 shrink-0 place-items-center text-muted-foreground">
            <Icon name="more-horizontal" size="xs" />
          </span>
          <span className="hito-caption min-w-0 truncate text-foreground">Actions</span>
        </div>
        {selectedLabel ? (
          <div className="group relative min-w-0 shrink-0" data-local-ui-actions-selected="">
            <ValueTag tone="desired" value={selectedLabel} tooltip={selectedLabel} />
            <PendingChangeRemoveButton
              ariaLabel={`Clear ${selectedLabel} pending change`}
              onClick={() => onChange(null)}
            />
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="hito-button hito-button-ghost hito-button-xs min-h-7 px-2"
                aria-label="Add Inspector action"
                data-local-ui-actions-trigger=""
              >
                Add
                <Icon name="chevron-down" size="xs" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="z-[84] min-w-56"
              data-local-ui-inspector-layer=""
            >
              {!ownership.entry ? (
                <>
                  <DropdownMenuItem
                    onSelect={() => onChange({ scope: "screen", type: "reuse_existing_component" })}
                  >
                    <Icon name="components" size="sm" />
                    Reuse existing component
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onChange({ type: "add_to_ds" })}>
                    <Icon name="components" size="sm" />
                    Add to design system
                  </DropdownMenuItem>
                </>
              ) : null}
              <DropdownMenuItem
                data-tone="destructive"
                onSelect={() => onChange({ scope: "screen", type: "remove_instance" })}
              >
                <Icon name="trash" size="sm" />
                Remove object
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import type { InlineChangePromptActionSelection } from "@/components/devtools/local-inline-change-target-utils";
import { PendingChangeRemoveButton } from "@/components/devtools/LocalUiPropertyControlPrimitives";

const REMOVE_COMPONENT_ACTION: InlineChangePromptActionSelection = {
  id: "remove_component",
  label: "Remove component",
};

export function PromptActionRow({
  onActionChange,
  selection,
}: {
  onActionChange: (selection: InlineChangePromptActionSelection | null) => void;
  selection: InlineChangePromptActionSelection | null;
}) {
  return (
    <div className="grid min-w-0 gap-1 py-0.5" data-local-ui-property-control-row="Action">
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="grid size-5 shrink-0 place-items-center text-muted-foreground">
            <Icon name="trash" size="xs" />
          </span>
          <span className="hito-caption min-w-0 truncate text-foreground">Action</span>
        </div>
        {selection ? (
          <div className="group relative shrink-0">
            <span
              className="inline-flex h-7 min-w-0 max-w-40 items-center gap-1.5 rounded-md border border-warn/35 bg-warn/10 px-2 text-xs font-medium text-warn"
              title="Prompt-only action. This does not mutate live UI."
            >
              <Icon name="trash" size="xs" />
              <span className="truncate">{selection.label}</span>
            </span>
            <PendingChangeRemoveButton
              ariaLabel={`Remove ${selection.label} pending action`}
              onClick={() => onActionChange(null)}
            />
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="hito-button hito-button-ghost hito-button-sm min-h-7 px-2 text-xs"
              >
                <Icon name="plus" size="xs" />
                Add
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="z-[73] min-w-44"
              data-local-ui-inspector-layer=""
            >
              <DropdownMenuItem onSelect={() => onActionChange(REMOVE_COMPONENT_ACTION)}>
                <Icon name="trash" size="sm" />
                Remove component
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

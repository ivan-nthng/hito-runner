import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";

export type PlanExportStatus = "idle" | "exporting-json" | "exporting-markdown";

export function PlanExportMenu({
  available,
  disabled,
  status,
  onExport,
}: {
  available: boolean;
  disabled: boolean;
  status: PlanExportStatus;
  onExport: (format: "json" | "markdown") => void;
}) {
  if (!available) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="hito-button hito-button-ghost hito-button-sm"
        >
          <Icon name="download" size="sm" className="text-signal" />
          {status === "idle" ? "Export" : "Preparing..."}
          <Icon name="chevron-down" size="xs" className="text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="hito-menu-width-standard">
        <DropdownMenuLabel>Export active plan</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={disabled}
          onSelect={(event) => {
            event.preventDefault();
            onExport("json");
          }}
        >
          <Icon name="import" size="sm" />
          Export as JSON
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={disabled}
          onSelect={(event) => {
            event.preventDefault();
            onExport("markdown");
          }}
        >
          <Icon name="file-text" size="sm" />
          Export as Markdown
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

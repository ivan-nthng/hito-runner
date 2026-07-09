import { Icon } from "@/components/ui/icon";
import type { InlineChangeTargetInput } from "@/components/devtools/local-inline-change-target-utils";
import {
  PendingChangeRemoveButton,
  TypographyRoleSelect,
  ValueTag,
} from "@/components/devtools/LocalUiPropertyControlPrimitives";

export function TypographyControlRow({
  desiredRoleId,
  onDesiredRoleChange,
  typography,
}: {
  desiredRoleId: string | null;
  onDesiredRoleChange: (roleId: string | null) => void;
  typography: NonNullable<InlineChangeTargetInput["typography"]>;
}) {
  const desiredRole = typography.options.find((option) => option.id === desiredRoleId) ?? null;
  const isActive = Boolean(desiredRole && desiredRole.id !== typography.currentRole?.id);
  const currentLabel = typography.currentRole?.label ?? "Observed type";
  const currentHelp = typography.currentRole
    ? `${typography.currentRole.className} · ${getComputedTypographyLabel(typography)}`
    : getComputedTypographyLabel(typography);
  const desiredHelp = desiredRole
    ? `${desiredRole.className} · ${desiredRole.description}`
    : currentHelp;

  return (
    <div className="grid min-w-0 gap-1 py-0.5" data-local-ui-property-control-row="typography">
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="grid size-5 shrink-0 place-items-center text-muted-foreground">
            <Icon name="file-text" size="xs" />
          </span>
          <span className="hito-caption min-w-0 truncate text-foreground">Typography role</span>
        </div>
        {isActive ? (
          <>
            <ValueTag tone="current" value={currentLabel} tooltip={currentHelp} />
            <Icon name="arrow-right" size="xs" className="shrink-0 text-muted-foreground" />
            <div className="group relative shrink-0">
              <TypographyRoleSelect
                desiredRole={desiredRole}
                displayLabel={desiredRole?.label ?? currentLabel}
                tooltip={desiredHelp}
                tone="desired"
                onDesiredRoleChange={onDesiredRoleChange}
                options={typography.options}
              />
              <PendingChangeRemoveButton
                ariaLabel="Remove typography pending change"
                onClick={() => onDesiredRoleChange(null)}
              />
            </div>
          </>
        ) : (
          <TypographyRoleSelect
            desiredRole={null}
            displayLabel={currentLabel}
            tooltip={currentHelp}
            tone="neutral"
            onDesiredRoleChange={onDesiredRoleChange}
            options={typography.options}
          />
        )}
      </div>
    </div>
  );
}

function getComputedTypographyLabel(
  typography: NonNullable<InlineChangeTargetInput["typography"]>,
) {
  const label = [
    typography.fontSize ? `font ${typography.fontSize}` : null,
    typography.lineHeight ? `line ${typography.lineHeight}` : null,
    typography.fontWeight ? `weight ${typography.fontWeight}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return label || "computed typography";
}

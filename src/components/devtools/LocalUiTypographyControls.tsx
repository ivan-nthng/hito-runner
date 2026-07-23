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
  const currentLabel = typography.currentRole?.label ?? "Custom";
  const currentHelp = typography.currentRole
    ? getRoleDetail(typography.currentRole)
    : `Custom · ${getObservedTypographyLabel(typography)}`;
  const desiredHelp = desiredRole ? getRoleDetail(desiredRole) : currentHelp;
  const currentRoleId = typography.currentRole?.id ?? null;
  const selectableCurrentRoleId = typography.options.some((option) => option.id === currentRoleId)
    ? currentRoleId
    : null;

  return (
    <div className="grid min-w-0 py-0.5" data-local-ui-property-control-row="typography">
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="grid size-5 shrink-0 place-items-center text-muted-foreground">
            <Icon name="typography" size="xs" />
          </span>
          <span className="hito-caption min-w-0 truncate text-foreground">Typography</span>
        </div>
        {isActive ? (
          <>
            <ValueTag tone="current" value={currentLabel} tooltip={currentHelp} />
            <Icon name="arrow-right" size="xs" className="shrink-0 text-muted-foreground" />
            <div className="group relative shrink-0">
              <TypographyRoleSelect
                currentRoleId={currentRoleId}
                displayLabel={desiredRole?.label ?? currentLabel}
                selectedRoleId={desiredRole?.id ?? currentRoleId}
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
            currentRoleId={currentRoleId}
            displayLabel={currentLabel}
            selectedRoleId={selectableCurrentRoleId}
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

function getRoleDetail(
  role: NonNullable<InlineChangeTargetInput["typography"]>["options"][number],
) {
  return [role.technicalDetails ?? role.description, role.className].filter(Boolean).join(" · ");
}

function getObservedTypographyLabel(
  typography: NonNullable<InlineChangeTargetInput["typography"]>,
) {
  const label = [
    typography.fontFamily,
    typography.fontSize,
    typography.fontWeight ? `weight ${typography.fontWeight}` : null,
    typography.lineHeight ? `lh ${typography.lineHeight}` : null,
    typography.letterSpacing ? `letter ${typography.letterSpacing}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return label || "computed typography";
}

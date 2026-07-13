import { useState } from "react";
import { Icon, type HitoIconName } from "@/components/ui/icon";
import type {
  InlineChangeTokenControlId,
  InlineChangeTokenControlInput,
} from "@/components/devtools/local-inline-change-target-utils";
import { getIsTokenControlActive } from "@/components/devtools/local-ui-task-draft-view-model";
import {
  PendingChangeRemoveButton,
  ValueSelect,
  ValueTag,
} from "@/components/devtools/LocalUiPropertyControlPrimitives";

export function TokenControlRows({
  controls,
  desiredTokens,
  onPendingChangeRemove,
  onDesiredTokenChange,
}: {
  controls: InlineChangeTokenControlInput[];
  desiredTokens: Record<string, string>;
  onPendingChangeRemove: (controlIds: InlineChangeTokenControlId[]) => void;
  onDesiredTokenChange: (controlId: string, token: string) => void;
}) {
  const groups = buildTokenControlGroups(controls);

  return (
    <div className="grid min-w-0 gap-1.5">
      {groups.map((group) => (
        <TokenControlGroupRow
          desiredTokens={desiredTokens}
          group={group}
          key={group.id}
          onDesiredTokenChange={onDesiredTokenChange}
          onPendingChangeRemove={onPendingChangeRemove}
        />
      ))}
    </div>
  );
}

function TokenControlGroupRow({
  desiredTokens,
  group,
  onDesiredTokenChange,
  onPendingChangeRemove,
}: {
  desiredTokens: Record<string, string>;
  group: TokenControlGroup;
  onDesiredTokenChange: (controlId: string, token: string) => void;
  onPendingChangeRemove: (controlIds: InlineChangeTokenControlId[]) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const control = group.controls[0];
  if (!control) return null;

  const controlIds = group.controls.map((candidate) => candidate.id);
  const activeControls = group.controls.filter((candidate) =>
    getIsTokenControlActive(candidate, desiredTokens[candidate.id]),
  );
  const groupDesiredTokens = getUniqueValues(
    activeControls
      .map((candidate) => desiredTokens[candidate.id])
      .filter((token): token is string => Boolean(token)),
  );
  const isActive =
    group.controls.length === 1
      ? activeControls.length === 1
      : activeControls.length === group.controls.length && groupDesiredTokens.length === 1;
  const currentTokenLabel = getCurrentTokenLabel(group.controls);
  const currentValueLabel = getCurrentDisplayValueLabel(group.controls);
  const firstDesiredToken =
    isActive && group.controls.length > 1
      ? groupDesiredTokens[0]
      : group.controls.map((candidate) => desiredTokens[candidate.id]).find(Boolean);
  const desiredOption =
    control.options.find((option) => option.token === firstDesiredToken) ?? null;

  return (
    <div className="grid min-w-0 gap-1 py-0.5" data-local-ui-property-control-row={group.id}>
      <PropertyControlLine
        control={control}
        currentTokenLabel={currentTokenLabel}
        currentValueLabel={currentValueLabel}
        desiredOption={desiredOption}
        expanded={group.controls.length > 1 ? expanded : undefined}
        expandLabel={
          group.controls.length > 1 ? `Show ${group.label.toLowerCase()} side controls` : undefined
        }
        iconName={group.iconName}
        isActive={isActive}
        label={group.label}
        onDesiredTokenChange={(token) => {
          controlIds.forEach((controlId) => onDesiredTokenChange(controlId, token));
        }}
        onExpandedChange={group.controls.length > 1 ? setExpanded : undefined}
        onPendingChangeRemove={() => onPendingChangeRemove(controlIds)}
      />
      {group.controls.length > 1 && expanded ? (
        <div className="ml-2 grid min-w-0 gap-1 rounded-md border border-hairline bg-surface/35 p-1">
          {group.controls.map((sideControl) => (
            <PropertyControlLine
              compact
              control={sideControl}
              currentTokenLabel={getCurrentTokenLabel([sideControl])}
              currentValueLabel={getCurrentDisplayValueLabel([sideControl])}
              desiredOption={
                sideControl.options.find(
                  (option) => option.token === desiredTokens[sideControl.id],
                ) ?? null
              }
              iconName={getTokenControlIconName(sideControl.id)}
              isActive={getIsTokenControlActive(sideControl, desiredTokens[sideControl.id])}
              key={sideControl.id}
              label={sideControl.label}
              onDesiredTokenChange={(token) => onDesiredTokenChange(sideControl.id, token)}
              onPendingChangeRemove={() => onPendingChangeRemove([sideControl.id])}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PropertyControlLine({
  compact = false,
  control,
  currentTokenLabel,
  currentValueLabel,
  desiredOption,
  expanded,
  expandLabel,
  iconName,
  isActive,
  label,
  onDesiredTokenChange,
  onExpandedChange,
  onPendingChangeRemove,
}: {
  compact?: boolean;
  control: InlineChangeTokenControlInput;
  currentTokenLabel: string | null;
  currentValueLabel: string;
  desiredOption: InlineChangeTokenControlInput["options"][number] | null;
  expanded?: boolean;
  expandLabel?: string;
  iconName: HitoIconName | null;
  isActive: boolean;
  label: string;
  onDesiredTokenChange: (token: string) => void;
  onExpandedChange?: (expanded: boolean) => void;
  onPendingChangeRemove: () => void;
}) {
  const currentHelp = getTokenHelpLabel(control, currentTokenLabel);
  const desiredHelp = desiredOption
    ? `${desiredOption.displayValue}px · ${desiredOption.token}`
    : currentHelp;

  return (
    <div className={`grid min-w-0 gap-1 ${compact ? "pl-6" : ""}`}>
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          {iconName ? (
            <span className="grid size-5 shrink-0 place-items-center text-muted-foreground">
              <Icon name={iconName} size="xs" />
            </span>
          ) : null}
          <span className="hito-caption min-w-0 truncate text-foreground">{label}</span>
          {onExpandedChange ? (
            <button
              type="button"
              className="hito-button hito-button-ghost hito-button-xs size-5 min-h-5 shrink-0 rounded-sm px-0 text-muted-foreground hover:text-foreground"
              aria-label={expandLabel ?? `Show ${label} detail controls`}
              aria-expanded={expanded}
              onClick={() => onExpandedChange(!expanded)}
            >
              <Icon
                name="chevron-down"
                size="xs"
                className={`transition-transform ${expanded ? "rotate-180" : ""}`}
              />
            </button>
          ) : null}
        </div>
        {isActive ? (
          <>
            <ValueTag tone="current" value={currentValueLabel} tooltip={currentHelp} />
            <Icon name="arrow-right" size="xs" className="shrink-0 text-muted-foreground" />
            <div className="group relative shrink-0">
              <ValueSelect
                ariaLabel={`${label} desired value`}
                control={control}
                desiredOption={desiredOption}
                displayValue={desiredOption?.displayValue ?? currentValueLabel}
                tooltip={desiredHelp}
                tone="desired"
                onValueChange={onDesiredTokenChange}
              />
              <PendingChangeRemoveButton
                ariaLabel={`Remove ${label} pending change`}
                onClick={onPendingChangeRemove}
              />
            </div>
          </>
        ) : (
          <ValueSelect
            ariaLabel={`${label} desired value`}
            control={control}
            desiredOption={null}
            displayValue={currentValueLabel}
            tooltip={currentHelp}
            tone="neutral"
            onValueChange={onDesiredTokenChange}
          />
        )}
      </div>
    </div>
  );
}

type TokenControlGroup = {
  controls: InlineChangeTokenControlInput[];
  iconName: HitoIconName | null;
  id: string;
  label: string;
};

function buildTokenControlGroups(controls: InlineChangeTokenControlInput[]): TokenControlGroup[] {
  const byId = new Map(controls.map((control) => [control.id, control]));
  const consumed = new Set<InlineChangeTokenControlId>();
  const groups: TokenControlGroup[] = [];

  const addGroup = (
    ids: InlineChangeTokenControlId[],
    label: string,
    iconName: HitoIconName | null,
  ) => {
    const groupControls = ids
      .map((id) => byId.get(id))
      .filter(Boolean) as InlineChangeTokenControlInput[];
    if (groupControls.length !== ids.length || !canMergeTokenControls(groupControls)) return;

    groups.push({
      controls: groupControls,
      iconName,
      id: ids.join("+"),
      label,
    });
    ids.forEach((id) => consumed.add(id));
  };

  addGroup(["padding-left", "padding-right"], "Horizontal padding", "padding-left");
  addGroup(["padding-top", "padding-bottom"], "Vertical padding", "padding-top");
  addGroup(
    ["radius-top-left", "radius-top-right", "radius-bottom-right", "radius-bottom-left"],
    "Radius",
    "radius-top-left",
  );

  controls.forEach((control) => {
    if (consumed.has(control.id)) return;
    groups.push({
      controls: [control],
      iconName: getTokenControlIconName(control.id),
      id: control.id,
      label: control.label,
    });
  });

  return groups;
}

function canMergeTokenControls(controls: InlineChangeTokenControlInput[]) {
  const [first] = controls;
  if (!first) return false;

  return controls.every(
    (control) =>
      control.confidence === first.confidence &&
      control.currentToken === first.currentToken &&
      control.currentValueLabel === first.currentValueLabel &&
      control.kind === first.kind &&
      control.nearestToken === first.nearestToken &&
      control.options.length === first.options.length &&
      control.options.every((option, index) => option.token === first.options[index]?.token),
  );
}

function getCurrentDisplayValueLabel(controls: InlineChangeTokenControlInput[]) {
  const values = getUniqueValues(controls.map((control) => control.currentValueLabel));
  const valueLabel = values.length === 1 ? values[0] : "Mixed";
  const isCustom = controls.every((control) => !control.currentToken);

  return isCustom && valueLabel !== "Mixed" ? `${valueLabel}px` : valueLabel;
}

function getCurrentTokenLabel(controls: InlineChangeTokenControlInput[]) {
  const confidentTokens = getUniqueValues(
    controls
      .map((control) => control.currentToken)
      .filter((token): token is string => Boolean(token)),
  );
  if (confidentTokens.length === 1) return confidentTokens[0];

  const nearestTokens = getUniqueValues(
    controls
      .map((control) => (control.nearestToken ? `nearest ${control.nearestToken}` : null))
      .filter((token): token is string => Boolean(token)),
  );
  if (nearestTokens.length === 1) return nearestTokens[0];

  return null;
}

function getTokenHelpLabel(
  control: InlineChangeTokenControlInput,
  currentTokenLabel: string | null,
) {
  const observedValue = `${control.currentValueLabel}px`;
  if (currentTokenLabel) return `${observedValue} · ${currentTokenLabel}`;
  if (control.nearestToken)
    return `${observedValue} custom value · nearest ${control.nearestToken}`;
  return `${observedValue} custom value`;
}

function getUniqueValues(values: string[]) {
  return Array.from(new Set(values));
}

function getTokenControlIconName(controlId: InlineChangeTokenControlId): HitoIconName | null {
  switch (controlId) {
    case "padding-left":
      return "padding-left";
    case "padding-right":
      return "padding-right";
    case "padding-top":
      return "padding-top";
    case "padding-bottom":
      return "padding-bottom";
    case "gap-horizontal":
      return "gap-horizontal";
    case "gap-vertical":
      return "gap-vertical";
    case "radius-top-right":
      return "radius-top-right";
    case "radius-top-left":
      return "radius-top-left";
    case "radius-bottom-right":
      return "radius-bottom-right";
    case "radius-bottom-left":
      return "radius-bottom-left";
    default:
      return null;
  }
}

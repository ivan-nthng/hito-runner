import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { HitoChoiceToggle } from "@/components/ui/hito-choice-toggle";
import { HitoValueTagSelectTrigger } from "@/components/ui/value-tag";
import { Select, SelectContent, SelectItem } from "@/components/ui/select";
import type {
  InlineChangeBorderIntentEvidence,
  InlineChangeBorderIntentSelection,
  InlineChangeBorderSide,
  InlineChangeCardChromeEvidence,
  InlineChangeChromeRemovalSelection,
  InlineChangeTokenControlInput,
} from "@/components/devtools/local-inline-change-target-utils";
import {
  formatInlineChangeBorderIntentSelection,
  INLINE_CHANGE_BORDER_SIDES,
} from "@/components/devtools/local-inline-change-target-utils";
import {
  PendingChangeRemoveButton,
  ValueTag,
} from "@/components/devtools/LocalUiPropertyControlPrimitives";

export function ChromeControlRows({
  borderIntent,
  borderIntentSelection,
  cardChrome,
  chromeRemovalSelection,
  onBorderIntentChange,
  onChromeRemovalChange,
}: {
  borderIntent: InlineChangeBorderIntentEvidence | null | undefined;
  borderIntentSelection: InlineChangeBorderIntentSelection | null;
  cardChrome: InlineChangeCardChromeEvidence | null | undefined;
  chromeRemovalSelection: InlineChangeChromeRemovalSelection | null;
  onBorderIntentChange: (selection: InlineChangeBorderIntentSelection | null) => void;
  onChromeRemovalChange: (selection: InlineChangeChromeRemovalSelection | null) => void;
}) {
  if (!borderIntent && !cardChrome?.isDetected) return null;

  return (
    <div className="grid min-w-0 gap-1.5">
      {borderIntent ? (
        <BorderControlLine
          border={borderIntent}
          selection={borderIntentSelection}
          onChange={onBorderIntentChange}
        />
      ) : null}
      {cardChrome?.isDetected ? (
        <CardChromeControlLine
          active={chromeRemovalSelection?.kind === "card_chrome"}
          tooltip={getCardChromeHelpLabel(cardChrome)}
          onActivate={() =>
            onChromeRemovalChange({
              border: cardChrome.border,
              kind: "card_chrome",
              paddingControls: cardChrome.paddingControls,
              radiusControls: cardChrome.radiusControls,
            })
          }
          onRemove={() => onChromeRemovalChange(null)}
        />
      ) : null}
    </div>
  );
}

function BorderControlLine({
  border,
  onChange,
  selection,
}: {
  border: InlineChangeBorderIntentEvidence;
  onChange: (selection: InlineChangeBorderIntentSelection | null) => void;
  selection: InlineChangeBorderIntentSelection | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const currentLabel = getBorderValueLabel(border);
  const allSidesSelected = INLINE_CHANGE_BORDER_SIDES.every((side) =>
    selection?.sides.includes(side),
  );

  return (
    <div className="grid min-w-0 gap-1 py-0.5" data-local-ui-property-control-row="Border">
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="grid size-5 shrink-0 place-items-center text-muted-foreground">
            <Icon name="minus" size="xs" />
          </span>
          <span className="hito-body-xs min-w-0 truncate text-foreground">Border</span>
          <button
            type="button"
            className="hito-button hito-button-ghost hito-button-xs size-5 min-h-5 shrink-0 rounded-sm px-0 text-muted-foreground hover:text-foreground"
            aria-label="Show border side controls"
            aria-expanded={expanded}
            onClick={() => setExpanded((current) => !current)}
          >
            <Icon
              name="chevron-down"
              size="xs"
              className={`transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        </div>
        {selection ? (
          <>
            <ValueTag tone="current" value={currentLabel} tooltip={border.summary} />
            <Icon name="arrow-right" size="xs" className="shrink-0 text-muted-foreground" />
            <div className="group relative shrink-0">
              <ValueTag
                tone="desired"
                value={formatInlineChangeBorderIntentSelection(selection)}
                tooltip={getBorderIntentHelp(selection)}
              />
              <PendingChangeRemoveButton
                ariaLabel="Remove Border pending change"
                onClick={() => onChange(null)}
              />
            </div>
          </>
        ) : (
          <ValueTag value={currentLabel} tooltip={border.summary} />
        )}
      </div>
      {expanded ? (
        <div className="grid min-w-0 gap-1 rounded-lg bg-muted p-1">
          <div
            className="flex min-w-0 flex-wrap items-center gap-1"
            role="group"
            aria-label="Border sides"
          >
            <HitoChoiceToggle
              size="xs"
              selected={allSidesSelected}
              onClick={() =>
                onChange(
                  allSidesSelected
                    ? null
                    : {
                        sides: [...INLINE_CHANGE_BORDER_SIDES],
                        treatment:
                          selection?.treatment ??
                          getDefaultTreatment(border, [...INLINE_CHANGE_BORDER_SIDES]),
                      },
                )
              }
            >
              All sides
            </HitoChoiceToggle>
            {INLINE_CHANGE_BORDER_SIDES.map((side) => {
              const selected = selection?.sides.includes(side) ?? false;
              return (
                <HitoChoiceToggle
                  key={side}
                  size="xs"
                  selected={selected}
                  aria-label={`${capitalizeSide(side)} border side`}
                  onClick={() => onChange(toggleBorderSide(border, selection, side, selected))}
                >
                  {capitalizeSide(side)}
                </HitoChoiceToggle>
              );
            })}
          </div>
          {selection ? (
            <div className="flex min-w-0 items-center justify-between gap-2">
              <span className="hito-body-xs text-foreground">Treatment</span>
              <Select
                value={selection.treatment}
                onValueChange={(value) =>
                  onChange({
                    ...selection,
                    treatment: value === "none" ? "none" : "hairline",
                  })
                }
              >
                <HitoValueTagSelectTrigger
                  aria-label="Border treatment"
                  className="min-w-20"
                  tone="signal"
                >
                  {selection.treatment === "hairline" ? "Hairline" : "None"}
                </HitoValueTagSelectTrigger>
                <SelectContent align="end" className="z-[94] w-40" data-local-ui-inspector-layer="">
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="hairline">Hairline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <p className="hito-body-xs text-tertiary">
              Select one or more sides to request None or Hairline.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function CardChromeControlLine({
  active,
  onActivate,
  onRemove,
  tooltip,
}: {
  active: boolean;
  onActivate: () => void;
  onRemove: () => void;
  tooltip: string;
}) {
  return (
    <div className="grid min-w-0 gap-1 py-0.5" data-local-ui-property-control-row="Card chrome">
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="grid size-5 shrink-0 place-items-center text-muted-foreground">
            <Icon name="settings" size="xs" />
          </span>
          <span className="hito-body-xs min-w-0 truncate text-foreground">Card chrome</span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={!active}
          aria-label={`Card chrome. ${active ? "Off" : "On"}. ${tooltip}`}
          title={tooltip}
          className="hito-choice-toggle hito-choice-toggle-xs min-w-12"
          onClick={active ? onRemove : onActivate}
        >
          {active ? "Off" : "On"}
        </button>
      </div>
    </div>
  );
}

function getBorderValueLabel(border: InlineChangeBorderIntentEvidence) {
  if (border.sides.every((side) => side.widthPx === 0)) return "0";

  const [first] = border.sides;
  const allSame =
    first &&
    border.sides.every(
      (side) =>
        side.widthLabel === first.widthLabel &&
        side.style === first.style &&
        side.color === first.color,
    );

  return first && allSame ? `${first.widthLabel}px ${first.style}` : "Mixed";
}

function toggleBorderSide(
  border: InlineChangeBorderIntentEvidence,
  selection: InlineChangeBorderIntentSelection | null,
  side: InlineChangeBorderSide,
  selected: boolean,
): InlineChangeBorderIntentSelection | null {
  const requestedSides = new Set(selection?.sides ?? []);
  if (selected) requestedSides.delete(side);
  else requestedSides.add(side);

  const sides = INLINE_CHANGE_BORDER_SIDES.filter((candidate) => requestedSides.has(candidate));
  if (sides.length === 0) return null;

  return {
    sides,
    treatment: selection?.treatment ?? getDefaultTreatment(border, [side]),
  };
}

function getDefaultTreatment(
  border: InlineChangeBorderIntentEvidence,
  sides: InlineChangeBorderSide[],
): InlineChangeBorderIntentSelection["treatment"] {
  return sides.every(
    (side) => border.sides.find((candidate) => candidate.side === side)?.widthPx === 0,
  )
    ? "hairline"
    : "none";
}

function getBorderIntentHelp(selection: InlineChangeBorderIntentSelection) {
  return selection.treatment === "hairline"
    ? `${formatInlineChangeBorderIntentSelection(selection)} using 1px solid var(--color-hairline). No live CSS mutation.`
    : `${formatInlineChangeBorderIntentSelection(selection)}. No live CSS mutation.`;
}

function capitalizeSide(side: InlineChangeBorderSide) {
  return side.charAt(0).toUpperCase() + side.slice(1);
}

function getCardChromeHelpLabel(cardChrome: InlineChangeCardChromeEvidence) {
  const parts = [
    cardChrome.border ? `border ${cardChrome.border.summary}` : null,
    cardChrome.radiusControls.length > 0
      ? `radius ${formatObservedControlSet(cardChrome.radiusControls)}`
      : null,
    cardChrome.paddingControls.length > 0
      ? `padding ${formatObservedControlSet(cardChrome.paddingControls)}`
      : null,
  ].filter(Boolean);

  return `Detected card treatment: ${parts.join(", ")}.`;
}

function formatObservedControlSet(controls: InlineChangeTokenControlInput[]) {
  return controls
    .map((control) => `${control.label.toLowerCase()} ${control.currentValueLabel}px`)
    .join(", ");
}

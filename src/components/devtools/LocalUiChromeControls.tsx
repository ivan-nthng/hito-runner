import { Icon } from "@/components/ui/icon";
import type {
  InlineChangeBorderEvidence,
  InlineChangeCardChromeEvidence,
  InlineChangeChromeRemovalSelection,
  InlineChangeTokenControlInput,
} from "@/components/devtools/local-inline-change-target-utils";
import {
  PendingChangeRemoveButton,
  ValueTag,
} from "@/components/devtools/LocalUiPropertyControlPrimitives";

export function ChromeControlRows({
  border,
  cardChrome,
  chromeRemovalSelection,
  onChromeRemovalChange,
}: {
  border: InlineChangeBorderEvidence | null | undefined;
  cardChrome: InlineChangeCardChromeEvidence | null | undefined;
  chromeRemovalSelection: InlineChangeChromeRemovalSelection | null;
  onChromeRemovalChange: (selection: InlineChangeChromeRemovalSelection | null) => void;
}) {
  if (!border && !cardChrome?.isDetected) return null;

  return (
    <div className="grid min-w-0 gap-1.5">
      {border ? (
        <BorderControlLine
          active={chromeRemovalSelection?.kind === "border"}
          currentLabel={getBorderValueLabel(border)}
          tooltip={border.summary}
          onActivate={() =>
            onChromeRemovalChange({
              border,
              kind: "border",
              paddingControls: [],
              radiusControls: [],
            })
          }
          onRemove={() => onChromeRemovalChange(null)}
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
  active,
  currentLabel,
  onActivate,
  onRemove,
  tooltip,
}: {
  active: boolean;
  currentLabel: string;
  onActivate: () => void;
  onRemove: () => void;
  tooltip: string;
}) {
  return (
    <div className="grid min-w-0 gap-1 py-0.5" data-local-ui-property-control-row="Border">
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="grid size-5 shrink-0 place-items-center text-muted-foreground">
            <Icon name="minus" size="xs" />
          </span>
          <span className="hito-caption min-w-0 truncate text-foreground">Border</span>
        </div>
        {active ? (
          <>
            <ValueTag tone="current" value={currentLabel} tooltip={tooltip} />
            <Icon name="arrow-right" size="xs" className="shrink-0 text-muted-foreground" />
            <div className="group relative shrink-0">
              <ValueTag tone="desired" value="Removed" tooltip={tooltip} />
              <PendingChangeRemoveButton
                ariaLabel="Remove Border pending change"
                onClick={onRemove}
              />
            </div>
          </>
        ) : (
          <div className="group relative shrink-0">
            <ValueTag value={currentLabel} tooltip={tooltip} />
            <PendingChangeRemoveButton
              ariaLabel="Remove Border"
              onClick={onActivate}
              visibility="hover"
            />
          </div>
        )}
      </div>
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
          <span className="hito-caption min-w-0 truncate text-foreground">Card chrome</span>
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

function getBorderValueLabel(border: InlineChangeBorderEvidence) {
  const [first] = border.sides;
  const allSame =
    first &&
    border.sides.every(
      (side) =>
        side.widthLabel === first.widthLabel &&
        side.style === first.style &&
        side.color === first.color,
    );

  return first && allSame ? first.widthLabel : "Mixed";
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

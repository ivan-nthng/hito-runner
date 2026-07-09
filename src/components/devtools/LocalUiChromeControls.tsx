import { Icon, type HitoIconName } from "@/components/ui/icon";
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
        <ChromeControlLine
          actionLabel="Remove"
          active={chromeRemovalSelection?.kind === "border"}
          currentLabel={getBorderValueLabel(border)}
          desiredLabel="Removed"
          iconName="minus"
          label="Border"
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
        <ChromeControlLine
          actionLabel="Turn off"
          active={chromeRemovalSelection?.kind === "card_chrome"}
          currentLabel="On"
          desiredLabel="Off"
          iconName="settings"
          label="Card chrome"
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

function ChromeControlLine({
  actionLabel,
  active,
  currentLabel,
  desiredLabel,
  iconName,
  label,
  onActivate,
  onRemove,
  tooltip,
}: {
  actionLabel: string;
  active: boolean;
  currentLabel: string;
  desiredLabel: string;
  iconName: HitoIconName;
  label: string;
  onActivate: () => void;
  onRemove: () => void;
  tooltip: string;
}) {
  return (
    <div className="grid min-w-0 gap-1 py-0.5" data-local-ui-property-control-row={label}>
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="grid size-5 shrink-0 place-items-center text-muted-foreground">
            <Icon name={iconName} size="xs" />
          </span>
          <span className="hito-caption min-w-0 truncate text-foreground">{label}</span>
        </div>
        {active ? (
          <>
            <ValueTag tone="current" value={currentLabel} tooltip={tooltip} />
            <Icon name="arrow-right" size="xs" className="shrink-0 text-muted-foreground" />
            <div className="group relative shrink-0">
              <ValueTag tone="desired" value={desiredLabel} tooltip={tooltip} />
              <PendingChangeRemoveButton
                ariaLabel={`Remove ${label} pending change`}
                onClick={onRemove}
              />
            </div>
          </>
        ) : (
          <>
            <ValueTag value={currentLabel} tooltip={tooltip} />
            <button
              type="button"
              className="hito-button hito-button-ghost hito-button-sm min-h-7 px-2"
              onClick={onActivate}
            >
              {actionLabel}
            </button>
          </>
        )}
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

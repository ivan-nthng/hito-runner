import { useRef } from "react";

import { HitoButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Textarea } from "@/components/ui/textarea";

export function LocalUiTextControlRow({
  onProposedTextChange,
  proposedText,
}: {
  onProposedTextChange: (value: string) => void;
  proposedText: string;
}) {
  const textFieldRef = useRef<HTMLTextAreaElement | null>(null);

  return (
    <div
      className="grid min-w-0 gap-1.5 py-0.5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start"
      data-local-ui-property-control-row="Text"
    >
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="grid size-5 shrink-0 place-items-center text-muted-foreground">
          <Icon name="typography" size="xs" />
        </span>
        <span className="hito-body-xs min-w-0 truncate text-foreground">Text</span>
      </div>
      <div className="relative min-w-0">
        <Textarea
          ref={textFieldRef}
          aria-label="Edit selected target text"
          className="hito-body-sm min-h-14 resize-none overflow-auto whitespace-pre-wrap break-words px-2 py-1.5 pr-8 text-secondary"
          data-local-ui-text-value="draft"
          rows={2}
          value={proposedText}
          onChange={(event) => onProposedTextChange(event.currentTarget.value)}
        />
        {proposedText.length > 0 ? (
          <HitoButton
            type="button"
            aria-label="Clear text draft"
            className="absolute right-1 top-1"
            iconOnly
            size="xs"
            variant="ghost"
            onClick={() => {
              onProposedTextChange("");
              window.requestAnimationFrame(() => textFieldRef.current?.focus());
            }}
          >
            <Icon name="close" size="xs" />
          </HitoButton>
        ) : null}
      </div>
    </div>
  );
}

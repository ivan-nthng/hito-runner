import { Icon } from "@/components/ui/icon";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function LocalUiTextControlRow({
  currentText,
  onProposedTextChange,
  proposedText,
}: {
  currentText: string;
  onProposedTextChange: (value: string) => void;
  proposedText: string;
}) {
  return (
    <div className="grid min-w-0 gap-1.5 py-0.5" data-local-ui-property-control-row="Text">
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="grid size-5 shrink-0 place-items-center text-muted-foreground">
          <Icon name="typography" size="xs" />
        </span>
        <span className="hito-caption min-w-0 truncate text-foreground">Text</span>
      </div>
      <TooltipProvider delayDuration={160}>
        <div className="grid min-w-0 gap-1.5 pl-6 sm:grid-cols-2">
          <TextPropertyValue label="Current" readOnly value={currentText} />
          <TextPropertyValue
            label="Proposed"
            placeholder="Optional replacement text"
            value={proposedText}
            onChange={onProposedTextChange}
          />
        </div>
      </TooltipProvider>
    </div>
  );
}

function TextPropertyValue({
  label,
  onChange,
  placeholder,
  readOnly = false,
  value,
}: {
  label: "Current" | "Proposed";
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  value: string;
}) {
  const field = (
    <Textarea
      aria-label={`${label} text`}
      className="hito-body-small min-h-14 resize-none overflow-auto whitespace-pre-wrap break-words px-2 py-1.5"
      data-local-ui-text-value={label.toLowerCase()}
      placeholder={placeholder}
      readOnly={readOnly}
      rows={2}
      value={value}
      onChange={onChange ? (event) => onChange(event.currentTarget.value) : undefined}
    />
  );

  return (
    <label className="grid min-w-0 gap-1">
      <span className="hito-caption text-muted-foreground">{label}</span>
      {value ? (
        <Tooltip>
          <TooltipTrigger asChild>{field}</TooltipTrigger>
          <TooltipContent
            className="z-[94] max-w-[min(28rem,calc(100vw-1rem))] whitespace-pre-wrap break-words"
            data-local-ui-inspector-layer=""
            sideOffset={8}
          >
            {value}
          </TooltipContent>
        </Tooltip>
      ) : (
        field
      )}
    </label>
  );
}

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function LocalUiInspectorConfirmDialog({
  confirmLabel,
  description,
  onConfirm,
  onOpenChange,
  open,
  title,
}: {
  confirmLabel: string;
  description: string;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="!z-[90] w-[min(26rem,calc(100vw-1.5rem))]"
        overlayClassName="!z-[89]"
        data-local-ui-inspector-layer=""
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button
            type="button"
            className="hito-button hito-button-secondary hito-button-sm"
            onClick={() => onOpenChange(false)}
          >
            Keep editing
          </button>
          <button
            type="button"
            className="hito-button hito-button-primary hito-button-sm"
            data-tone="error"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

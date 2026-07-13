import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function ManualWorkoutEditorDialogHeader({
  dateLabel,
  statusLabel,
  title,
}: {
  dateLabel: string;
  statusLabel: string;
  title: string;
}) {
  const displayTitle = title.trim() || "Manual workout";

  return (
    <DialogHeader className="hito-product-dialog-header hito-manual-workout-dialog-header">
      <DialogDescription className="hito-body-small">{dateLabel}</DialogDescription>
      <div className="hito-manual-workout-dialog-title-row">
        <DialogTitle className="hito-modal-title hito-manual-workout-dialog-title">
          {displayTitle}
        </DialogTitle>
        <span
          className="hito-status-pill hito-manual-workout-dialog-status"
          data-tone={statusLabel === "Ready" ? "success" : "muted"}
        >
          {statusLabel}
        </span>
      </div>
    </DialogHeader>
  );
}

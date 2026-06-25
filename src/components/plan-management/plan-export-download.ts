import type { Dispatch, MutableRefObject, SetStateAction } from "react";

export type PlanExportFormat = "json" | "markdown";
export type PlanExportStatus = "idle" | "exporting-json" | "exporting-markdown";

export function startPlanExportDownload(
  format: PlanExportFormat,
  targetFrame = "plan-export-download-frame",
) {
  if (typeof window === "undefined") {
    throw new Error("Plan export can only start in the browser.");
  }

  const form = window.document.createElement("form");
  form.method = "GET";
  form.action = "/api/plan/export";
  form.target = targetFrame;
  form.style.display = "none";

  const formatField = window.document.createElement("input");
  formatField.type = "hidden";
  formatField.name = "format";
  formatField.value = format;

  form.appendChild(formatField);
  window.document.body.appendChild(form);
  form.submit();
  form.remove();
}

export function scheduleExportStatusReset(
  exportResetTimerRef: MutableRefObject<number | null>,
  setExportStatus: Dispatch<SetStateAction<PlanExportStatus>>,
) {
  if (typeof window === "undefined") {
    setExportStatus("idle");
    return;
  }

  if (exportResetTimerRef.current != null) {
    window.clearTimeout(exportResetTimerRef.current);
  }

  exportResetTimerRef.current = window.setTimeout(() => {
    setExportStatus("idle");
    exportResetTimerRef.current = null;
  }, 1200);
}

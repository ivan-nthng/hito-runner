import type { ExternalToast } from "sonner";
import { toast } from "sonner";

type HitoToastId = string | number;
type HitoToastVariant = "info" | "success" | "error" | "working";
type HitoWorkingToastRecord = {
  id: HitoToastId;
  title: string;
  description?: string;
  onDismiss?: () => void;
};

type HitoToastOptions = {
  id?: HitoToastId;
  title: string;
  description?: string;
  duration?: number;
  onDismiss?: () => void;
};

type HitoWorkingToastOptions = HitoToastOptions & {
  id: HitoToastId;
};

const HITO_TOAST_DURATIONS: Record<Exclude<HitoToastVariant, "working">, number> = {
  info: 4800,
  success: 3200,
  error: 7600,
};

const workingToastRecords = new Map<HitoToastId, HitoWorkingToastRecord>();
const workingToastListeners = new Set<() => void>();
let workingToastSnapshot: HitoWorkingToastRecord[] = [];

export const hitoToast = {
  info(options: HitoToastOptions) {
    dismissWorkingToast(options.id, { notify: false });
    return toast.info(options.title, toToastOptions("info", options));
  },
  success(options: HitoToastOptions) {
    dismissWorkingToast(options.id, { notify: false });
    return toast.success(options.title, toToastOptions("success", options));
  },
  error(options: HitoToastOptions) {
    dismissWorkingToast(options.id, { notify: false });
    return toast.error(options.title, toToastOptions("error", options));
  },
  working(options: HitoWorkingToastOptions) {
    upsertWorkingToast({
      id: options.id,
      title: options.title,
      description: options.description ? boundToastDescription(options.description) : undefined,
      onDismiss: options.onDismiss,
    });
    return options.id;
  },
  dismiss(id?: HitoToastId) {
    dismissWorkingToast(id, { notify: true });
    return toast.dismiss(id);
  },
};

export type { HitoToastId, HitoToastVariant, HitoWorkingToastRecord };
export {
  dismissWorkingToast as dismissHitoWorkingToast,
  getWorkingToastSnapshot,
  subscribeWorkingToasts,
};

function toToastOptions(variant: HitoToastVariant, options: HitoToastOptions): ExternalToast {
  return {
    id: options.id,
    description:
      variant !== "working" && options.description
        ? boundToastDescription(options.description)
        : undefined,
    duration:
      options.duration ?? (variant === "working" ? Infinity : HITO_TOAST_DURATIONS[variant]),
    closeButton: variant !== "working",
    action: variant === "working" ? undefined : null,
    cancel: null,
    classNames: {
      toast: `hito-toast-${variant}`,
    },
  };
}

function boundToastDescription(description: string) {
  const trimmed = description.trim();

  if (trimmed.length <= 180) {
    return trimmed;
  }

  return `${trimmed.slice(0, 177)}...`;
}

function upsertWorkingToast(record: HitoWorkingToastRecord) {
  workingToastRecords.clear();
  workingToastRecords.set(record.id, record);
  emitWorkingToastChange();
}

function dismissWorkingToast(
  id?: HitoToastId,
  { notify }: { notify: boolean } = { notify: false },
) {
  if (typeof id === "undefined") {
    const dismissedRecords = Array.from(workingToastRecords.values());
    workingToastRecords.clear();
    emitWorkingToastChange();

    if (notify) {
      dismissedRecords.forEach((record) => record.onDismiss?.());
    }

    return;
  }

  const dismissedRecord = workingToastRecords.get(id);

  if (!dismissedRecord) {
    return;
  }

  workingToastRecords.delete(id);
  emitWorkingToastChange();

  if (notify) {
    dismissedRecord.onDismiss?.();
  }
}

function getWorkingToastSnapshot() {
  return workingToastSnapshot;
}

function subscribeWorkingToasts(listener: () => void) {
  workingToastListeners.add(listener);
  return () => {
    workingToastListeners.delete(listener);
  };
}

function emitWorkingToastChange() {
  workingToastSnapshot = Array.from(workingToastRecords.values());
  workingToastListeners.forEach((listener) => listener());
}

import { Toaster as Sonner } from "sonner";
import { LoaderCircle, X } from "lucide-react";
import { useSyncExternalStore } from "react";

import {
  dismissHitoWorkingToast,
  getWorkingToastSnapshot,
  subscribeWorkingToasts,
} from "@/components/ui/hito-toast";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({
  position = "top-center",
  closeButton = true,
  expand = false,
  visibleToasts = 1,
  toastOptions,
  ...props
}: ToasterProps) => {
  return (
    <>
      <Sonner
        position={position}
        closeButton={closeButton}
        expand={expand}
        visibleToasts={visibleToasts}
        className="hito-toaster group"
        toastOptions={{
          ...toastOptions,
          closeButtonAriaLabel: "Dismiss notification",
          classNames: {
            toast: "hito-toast group toast",
            title: "hito-toast-title",
            description: "hito-toast-description",
            icon: "hito-toast-icon",
            loader: "hito-toast-loader",
            closeButton: "hito-toast-close",
            actionButton: "hito-button hito-button-primary hito-button-xs",
            cancelButton: "hito-button hito-button-secondary hito-button-xs",
            info: "hito-toast-info",
            loading: "hito-toast-loading",
            success: "hito-toast-success",
            error: "hito-toast-error",
            ...toastOptions?.classNames,
          },
        }}
        {...props}
      />
      <HitoWorkingToastViewport />
    </>
  );
};

function HitoWorkingToastViewport() {
  const workingToasts = useSyncExternalStore(
    subscribeWorkingToasts,
    getWorkingToastSnapshot,
    getWorkingToastSnapshot,
  );
  const toast = workingToasts.at(-1);

  if (!toast) {
    return null;
  }

  return (
    <div
      className="hito-working-toast-viewport"
      aria-live="polite"
      aria-atomic="true"
      data-hito-working-toast-viewport=""
    >
      <div
        className="hito-toast hito-toast-working hito-toast-loading"
        role="status"
        data-hito-toast=""
        data-hito-toast-state="working"
      >
        <div className="hito-toast-custom-body">
          <div data-icon="" className="hito-toast-icon">
            <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={1.8} />
          </div>
          <div data-content="">
            <div data-title="" className="hito-toast-title">
              {toast.title}
            </div>
            {toast.description ? (
              <div data-description="" className="hito-toast-description">
                {toast.description}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            data-hito-toast-dismiss=""
            data-hito-toast-id={String(toast.id)}
            className="hito-toast-dismiss-action"
            aria-label="Dismiss notification"
            onPointerDown={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            onClick={() => dismissHitoWorkingToast(toast.id, { notify: true })}
          >
            <X className="h-3.5 w-3.5" strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </div>
  );
}

export { Toaster };

import { Toaster as Sonner } from "sonner";
import { useSyncExternalStore } from "react";

import { Icon } from "@/components/ui/icon";
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
  icons,
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
        icons={{
          close: <Icon name="close" size="xs" />,
          error: <Icon name="x-circle" size="sm" />,
          info: <Icon name="warning" size="sm" />,
          loading: <Icon name="loader" size="sm" className="animate-spin" />,
          success: <Icon name="check-circle" size="sm" />,
          ...icons,
        }}
        toastOptions={{
          ...toastOptions,
          closeButtonAriaLabel: "Dismiss notification",
          classNames: {
            toast: "hito-toast group toast",
            title: "hito-toast-title",
            description: "hito-toast-description",
            icon: "hito-toast-icon",
            loader: "hito-toast-loader",
            closeButton: "hito-toast-close hito-button hito-button-ghost hito-button-xs",
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
            <Icon name="loader" size="sm" className="animate-spin" />
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
            className="hito-toast-dismiss-action hito-button hito-button-ghost hito-button-xs"
            aria-label="Dismiss notification"
            onPointerDown={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            onClick={() => dismissHitoWorkingToast(toast.id, { notify: true })}
          >
            <Icon name="close" size="xs" />
          </button>
        </div>
      </div>
    </div>
  );
}

export { Toaster };

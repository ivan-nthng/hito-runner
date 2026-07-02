import { useEffect, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import { hitoToast } from "@/components/ui/hito-toast";
import { Icon } from "@/components/ui/icon";
import { HitoDsPlayground } from "@/components/hito-ds/playground";
import { ProductLinks } from "@/components/hito-ds/reference";
import {
  ChoiceSelector,
  InfoWindowPreview,
  ModalWindowPreview,
  ToggleRow,
} from "@/components/hito-ds/specimen-previews";
import { cn } from "@/lib/utils";

const MODAL_SIZE_MODES = ["compact", "standard", "wide", "workflow", "review"] as const;
const MODAL_BODY_MODES = ["content-fit", "scroll-fill"] as const;
const MODAL_HEADER_MODES = ["compact", "large"] as const;
const MODAL_FOOTER_MODES = ["none", "actions", "note-actions"] as const;
type ModalSizeMode = (typeof MODAL_SIZE_MODES)[number];
type ModalBodyMode = (typeof MODAL_BODY_MODES)[number];
type ModalHeaderMode = (typeof MODAL_HEADER_MODES)[number];
type ModalFooterMode = (typeof MODAL_FOOTER_MODES)[number];
type AsyncToastDemoState = "info" | "working" | "success" | "error";

const HITO_DS_TOAST_ID = "hito-ds-async-action-toast";

export function HitoDsComponentOverlays() {
  const [modalSizeMode, setModalSizeMode] = useState<ModalSizeMode>("standard");
  const [modalBodyMode, setModalBodyMode] = useState<ModalBodyMode>("content-fit");
  const [modalHeaderMode, setModalHeaderMode] = useState<ModalHeaderMode>("compact");
  const [modalFooterMode, setModalFooterMode] = useState<ModalFooterMode>("actions");
  const [modalStatusPill, setModalStatusPill] = useState(true);
  const [modalDestructive, setModalDestructive] = useState(false);
  const [modalLongContent, setModalLongContent] = useState(false);
  const [toastDemoState, setToastDemoState] = useState<AsyncToastDemoState>("working");
  const toastDemoTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      clearToastDemoTimer(toastDemoTimerRef);
      hitoToast.dismiss(HITO_DS_TOAST_ID);
    };
  }, []);

  const showDemoToast = (state: AsyncToastDemoState) => {
    clearToastDemoTimer(toastDemoTimerRef);
    setToastDemoState(state);
    showHitoToastDemo(state);
  };

  const showDemoSequence = (outcome: "success" | "error") => {
    clearToastDemoTimer(toastDemoTimerRef);
    setToastDemoState("working");
    hitoToast.working({
      id: HITO_DS_TOAST_ID,
      title: "Preparing update",
      description: "Working state is visible, dismissible, and indeterminate.",
    });

    if (typeof window === "undefined") {
      return;
    }

    toastDemoTimerRef.current = window.setTimeout(() => {
      setToastDemoState(outcome);

      if (outcome === "success") {
        hitoToast.success({
          id: HITO_DS_TOAST_ID,
          title: "Update ready",
          description: "The same toast resolved into a success state.",
        });
        return;
      }

      hitoToast.error({
        id: HITO_DS_TOAST_ID,
        title: "Update not applied",
        description: "The same toast resolved into a bounded error state.",
      });
    }, 900);
  };

  return (
    <>
      <HitoDsPlayground
        id="modals"
        label="Modals"
        title="Bounded panel, explicit body mode, reachable footer."
        body="Product dialogs share one stable overlay, backdrop, panel chrome, size preset, and body mode. Short content fits naturally; tall workflows scroll internally."
        status="Core overlay"
        statusTone="signal"
        demo={
          <ModalWindowPreview
            sizeMode={modalSizeMode}
            bodyMode={modalBodyMode}
            headerMode={modalHeaderMode}
            footerMode={modalFooterMode}
            showStatusPill={modalStatusPill}
            destructive={modalDestructive}
            longContent={modalLongContent}
          />
        }
        variants={
          <div className="grid min-w-0 gap-6">
            <div className="border-t border-hairline pt-5">
              <p className="hito-label">Compact info-window</p>
              <p className="hito-caption mt-1">
                Short confirmations stay small, keep the route visible, and avoid review-card
                anatomy.
              </p>
              <div className="mt-4">
                <InfoWindowPreview />
              </div>
            </div>

            <div className="border-t border-hairline pt-5">
              <p className="hito-label">Body mode matrix</p>
              <p className="hito-caption mt-1">
                Short task dialogs fit to content; tall workflows and reviews keep footer actions
                reachable with internal body scroll.
              </p>
              <div className="mt-4 grid min-w-0 gap-5 xl:grid-cols-2">
                <ModalWindowPreview
                  sizeMode="standard"
                  bodyMode="content-fit"
                  headerMode="compact"
                  footerMode="actions"
                  showStatusPill
                  destructive={false}
                  longContent={false}
                />
                <ModalWindowPreview
                  sizeMode="workflow"
                  bodyMode="scroll-fill"
                  headerMode="large"
                  footerMode="note-actions"
                  showStatusPill
                  destructive={false}
                  longContent
                />
                <ModalWindowPreview
                  sizeMode="review"
                  bodyMode="scroll-fill"
                  headerMode="large"
                  footerMode="actions"
                  showStatusPill
                  destructive={false}
                  longContent
                />
              </div>
            </div>

            <div className="border-t border-hairline pt-5">
              <p className="hito-label">Footer and destructive modes</p>
              <p className="hito-caption mt-1">
                Footer variants stay inside the same shell. Destructive meaning lives in copy and
                the final action tone, not a separate modal family.
              </p>
              <div className="mt-4 grid min-w-0 gap-5 xl:grid-cols-2">
                <ModalWindowPreview
                  sizeMode="compact"
                  bodyMode="content-fit"
                  headerMode="large"
                  footerMode="none"
                  showStatusPill={false}
                  destructive={false}
                  longContent={false}
                />
                <ModalWindowPreview
                  sizeMode="wide"
                  bodyMode="content-fit"
                  headerMode="compact"
                  footerMode="actions"
                  showStatusPill
                  destructive
                  longContent={false}
                />
              </div>
            </div>
          </div>
        }
        controls={
          <div className="hito-row-group border-0">
            <div className="hito-list-row items-start">
              <ChoiceSelector
                label="Size preset"
                value={modalSizeMode}
                options={MODAL_SIZE_MODES}
                onChange={setModalSizeMode}
                textTransform="none"
              />
            </div>
            <div className="hito-list-row items-start">
              <ChoiceSelector
                label="Body mode"
                value={modalBodyMode}
                options={MODAL_BODY_MODES}
                onChange={setModalBodyMode}
                textTransform="none"
              />
            </div>
            <div className="hito-list-row items-start">
              <ChoiceSelector
                label="Header mode"
                value={modalHeaderMode}
                options={MODAL_HEADER_MODES}
                onChange={setModalHeaderMode}
              />
            </div>
            <div className="hito-list-row items-start">
              <ChoiceSelector
                label="Footer mode"
                value={modalFooterMode}
                options={MODAL_FOOTER_MODES}
                onChange={setModalFooterMode}
                textTransform="none"
              />
            </div>
            <ToggleRow
              label="Status chip"
              active={modalStatusPill}
              onToggle={() => setModalStatusPill((v) => !v)}
            />
            <ToggleRow
              label="Destructive scenario"
              active={modalDestructive}
              onToggle={() => setModalDestructive((v) => !v)}
            />
            <ToggleRow
              label="Long content"
              active={modalLongContent}
              onToggle={() => setModalLongContent((v) => !v)}
            />
          </div>
        }
        caption={[
          {
            label: "Proves",
            body: "The same stable overlay, centered product dialog shell, internal body scroll, and reachable footer used by review-before-apply flows, imports, body notes, and calendar utilities.",
          },
          {
            label: "Does not imply",
            body: "Global navigation, passive page sections, dashboard cards, or silent mutations. Use inline state when the task does not need interruption.",
          },
          {
            label: "Used in",
            body: (
              <ProductLinks
                links={[
                  { href: "/", label: "Edit schedule" },
                  { href: "/settings", label: "Import plan" },
                  { href: "/workout/2026-05-18", label: "Body notes" },
                  { href: "/admin/login", label: "/admin/login" },
                ]}
              />
            ),
          },
        ]}
      />

      <HitoDsPlayground
        id="async-actions"
        label="Async action toasts"
        title="Progress without taking over."
        body="Use this pattern for long-running actions that need global progress and a short outcome while validation and review stay inline."
        status="Primitive"
        statusTone="signal"
        demo={
          <div className="grid min-w-0 gap-4">
            <span className="hito-status-pill justify-self-start" data-tone="signal">
              Top-center toast
            </span>
            <div>
              <p className="hito-label">Current demo state</p>
              <h3 className="hito-panel-title mt-3">
                {describeToastDemoState(toastDemoState).title}
              </h3>
              <p className="hito-support-copy mt-3 max-w-xl">
                {describeToastDemoState(toastDemoState).description}
              </p>
            </div>
            <div className="hito-list-row min-w-0">
              <div className="flex min-w-0 items-start gap-3">
                <Icon
                  name={toastDemoState === "working" ? "loader" : "warning"}
                  size="sm"
                  className={cn(
                    "mt-1 text-muted-foreground",
                    toastDemoState === "working" && "animate-spin",
                    toastDemoState === "success" && "text-success",
                    toastDemoState === "error" && "text-destructive",
                  )}
                />
                <div className="min-w-0">
                  <p className="hito-list-row-title">Use the settings panel to fire a toast</p>
                  <p className="hito-list-row-copy">
                    The specimen drives the real shared toast helper but keeps validation, review,
                    and recovery copy inline.
                  </p>
                </div>
              </div>
            </div>
          </div>
        }
        variants={
          <div className="grid min-w-0 gap-6">
            <div className="border-t border-hairline pt-5">
              <p className="hito-label">Toast state matrix</p>
              <p className="hito-caption mt-1">
                All feedback states stay visible for reference; the live demo still owns actual
                toast firing.
              </p>
              <div className="mt-4 grid min-w-0 gap-3 lg:grid-cols-2">
                {(["info", "working", "success", "error"] as const).map((state) => {
                  const stateCopy = describeToastDemoState(state);
                  const iconName =
                    state === "success"
                      ? "check-circle"
                      : state === "working"
                        ? "loader"
                        : "warning";

                  return (
                    <article
                      key={state}
                      className={cn(
                        "hito-toast hito-ds-toast-specimen static min-w-0 shadow-none",
                        state === "working"
                          ? "hito-toast-working hito-toast-loading"
                          : `hito-toast-${state}`,
                      )}
                      data-hito-toast=""
                      data-hito-toast-state={state}
                    >
                      <div className="hito-toast-custom-body">
                        <div data-icon="" className="hito-toast-icon">
                          <Icon
                            name={iconName}
                            size="sm"
                            className={state === "working" ? "animate-spin" : undefined}
                          />
                        </div>
                        <div data-content="">
                          <div data-title="" className="hito-toast-title">
                            {stateCopy.title}
                          </div>
                          <div data-description="" className="hito-toast-description">
                            {stateCopy.description}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-hairline pt-5">
              <p className="hito-label">Button + async pairing</p>
              <p className="hito-caption mt-1">
                Pending buttons stay local to the action; global toast handles only short progress
                and outcome feedback.
              </p>
              <div className="mt-4 flex min-w-0 flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="hito-button hito-button-primary hito-button-md"
                  disabled
                >
                  <Icon name="loader" size="sm" className="animate-spin" />
                  Saving
                </button>
                <button type="button" className="hito-button hito-button-secondary hito-button-md">
                  Retry
                </button>
                <span className="hito-caption max-w-sm">
                  No fake percentages. No mutation authority in the toast copy.
                </span>
              </div>
            </div>
          </div>
        }
        controls={
          <div className="grid gap-5">
            <div className="grid gap-3">
              <p className="hito-label">Toast variant</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="hito-button hito-button-secondary hito-button-sm"
                  onClick={() => showDemoToast("info")}
                >
                  <Icon name="warning" size="sm" className="text-muted-foreground" />
                  Info
                </button>
                <button
                  type="button"
                  className="hito-button hito-button-secondary hito-button-sm"
                  onClick={() => showDemoToast("working")}
                >
                  <Icon name="loader" size="sm" className="animate-spin text-muted-foreground" />
                  Working
                </button>
                <button
                  type="button"
                  className="hito-button hito-button-secondary hito-button-sm"
                  onClick={() => showDemoToast("success")}
                >
                  <Icon name="check-circle" size="sm" className="text-success" />
                  Proposal ready
                </button>
                <button
                  type="button"
                  className="hito-button hito-button-secondary hito-button-sm"
                  onClick={() => showDemoToast("error")}
                >
                  <Icon name="warning" size="sm" className="text-destructive" />
                  Error
                </button>
              </div>
            </div>

            <div className="hito-section-divider grid gap-3 pt-4">
              <p className="hito-label">Resolve in place</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="hito-button hito-button-ghost hito-button-sm"
                  onClick={() => showDemoSequence("success")}
                >
                  Working → success
                </button>
                <button
                  type="button"
                  className="hito-button hito-button-ghost hito-button-sm"
                  onClick={() => showDemoSequence("error")}
                >
                  Working → error
                </button>
              </div>
            </div>
          </div>
        }
        caption={[
          {
            label: "Proves",
            body: "One active async toast, DS-owned dismiss chrome, working-to-result replacement, and distinct info/success/error states.",
          },
          {
            label: "Does not imply",
            body: "Cancellation, fake percentages, mutation authority, or replacing inline validation/review states.",
          },
          {
            label: "Used in",
            body: "Global progress and outcome feedback for bounded async actions.",
          },
        ]}
      />
    </>
  );
}

function showHitoToastDemo(state: AsyncToastDemoState) {
  if (state === "info") {
    hitoToast.info({
      id: HITO_DS_TOAST_ID,
      title: "Plan note",
      description: "Informational toast copy is calm, short, and non-destructive.",
    });
    return;
  }

  if (state === "working") {
    hitoToast.working({
      id: HITO_DS_TOAST_ID,
      title: "Preparing update",
      description: "Working copy is indeterminate and can be dismissed without cancelling work.",
    });
    return;
  }

  if (state === "success") {
    hitoToast.success({
      id: HITO_DS_TOAST_ID,
      title: "Update ready",
      description: "Success appears only after the action really completes.",
    });
    return;
  }

  hitoToast.error({
    id: HITO_DS_TOAST_ID,
    title: "Update not applied",
    description: "The proposal is no longer current. Generate a fresh proposal before applying.",
  });
}

function describeToastDemoState(state: AsyncToastDemoState) {
  if (state === "info") {
    return {
      title: "Info",
      description: "Neutral, non-destructive status for short global context.",
    };
  }

  if (state === "working") {
    return {
      title: "Working",
      description: "Working state is dismissible, indeterminate, and does not cancel the action.",
    };
  }

  if (state === "success") {
    return {
      title: "Proposal ready",
      description: "Success replaces the working toast when the server returns.",
    };
  }

  return {
    title: "Error",
    description: "Error replaces the working toast and keeps detailed recovery copy inline.",
  };
}

function clearToastDemoTimer(timerRef: MutableRefObject<number | null>) {
  if (timerRef.current == null || typeof window === "undefined") {
    timerRef.current = null;
    return;
  }

  window.clearTimeout(timerRef.current);
  timerRef.current = null;
}

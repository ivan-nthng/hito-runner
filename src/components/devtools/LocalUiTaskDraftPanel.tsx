import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Textarea } from "@/components/ui/textarea";
import { copyTextToClipboard } from "@/components/devtools/local-ui-clipboard";
import {
  buildInlineChangePayload,
  buildInlineChangePrompt,
  buildTokenControlSelections,
  getDefaultFixScope,
  getInlineChangeAction,
  normalizeTargetKind,
  type InlineChangeTargetInput,
  type InlineChangeTokenControlSelection,
  type InlineChangeTypographySelection,
} from "@/components/devtools/local-inline-change-target-utils";
import {
  TokenControlRows,
  TypographyControlRow,
} from "@/components/devtools/LocalUiPropertyControls";
import {
  buildTypographyRoleSelection,
  getBaseToken,
  getHasActionableDraft,
  getHasObservedProperties,
  getInferredDraftAction,
  getIsObservableTokenControl,
  getIsTokenControlActive,
} from "@/components/devtools/local-ui-task-draft-view-model";

type GenerateState = "idle" | "copied" | "copy_failed";

export function LocalUiTaskDraftPanel({
  actionId,
  onActionChange,
  onClose,
  target,
}: {
  actionId: string | null;
  onActionChange: (actionId: string | null) => void;
  onClose: () => void;
  target: InlineChangeTargetInput;
}) {
  const [comment, setComment] = useState("");
  const [proposedText, setProposedText] = useState(target.visibleText ?? "");
  const [generateState, setGenerateState] = useState<GenerateState>("idle");
  const [promptGenerated, setPromptGenerated] = useState(false);
  const [draftMessage, setDraftMessage] = useState<string | null>(null);
  const [desiredTokens, setDesiredTokens] = useState<Record<string, string>>({});
  const [desiredTypographyRole, setDesiredTypographyRole] = useState<string | null>(null);
  const manualPromptRef = useRef<HTMLTextAreaElement | null>(null);
  const selectedAction = useMemo(
    () => (actionId ? getInlineChangeAction(actionId) : null),
    [actionId],
  );
  const targetKind = normalizeTargetKind(target.targetKind);
  const showReplacementText = selectedAction?.id === "edit_text";
  const showCommentInput = !showReplacementText;
  const observableTokenControls = useMemo(
    () => (target.tokenControls ?? []).filter(getIsObservableTokenControl),
    [target.tokenControls],
  );
  const activeTokenControls = useMemo(
    () =>
      observableTokenControls.filter((control) =>
        getIsTokenControlActive(control, desiredTokens[control.id]),
      ),
    [desiredTokens, observableTokenControls],
  );
  const tokenControlSelections = useMemo(
    () => buildTokenControlSelections(activeTokenControls, desiredTokens),
    [activeTokenControls, desiredTokens],
  );
  const typographyRoleSelection = useMemo(
    () => buildTypographyRoleSelection(target.typography, desiredTypographyRole),
    [desiredTypographyRole, target.typography],
  );
  const draftAction = useMemo(
    () => selectedAction ?? getInferredDraftAction(tokenControlSelections, typographyRoleSelection),
    [selectedAction, tokenControlSelections, typographyRoleSelection],
  );
  const fixScope = getDefaultFixScope();
  const payload = useMemo(
    () =>
      buildInlineChangePayload({
        action: draftAction,
        comment,
        fixScope,
        target: {
          ...target,
          proposedText: showReplacementText ? proposedText : null,
          tokenControlSelections,
          typographyRoleSelection,
        },
      }),
    [
      comment,
      draftAction,
      fixScope,
      proposedText,
      showReplacementText,
      target,
      tokenControlSelections,
      typographyRoleSelection,
    ],
  );
  const prompt = useMemo(() => buildInlineChangePrompt(payload), [payload]);
  const payloadJson = useMemo(() => JSON.stringify(payload, null, 2), [payload]);
  const targetLabel = payload.target.label ?? payload.target.visibleText ?? "Selected UI element";
  const showManualPromptFallback = promptGenerated && generateState === "copy_failed";
  const hasActionableDraft = getHasActionableDraft({
    action: draftAction,
    comment,
    proposedText,
    tokenControlSelections,
    typographyRoleSelection,
  });

  useEffect(() => {
    setDraftMessage(null);
    setComment("");
    setGenerateState("idle");
    setPromptGenerated(false);
    setDesiredTokens({});
    setDesiredTypographyRole(null);
    setProposedText(target.visibleText ?? "");
  }, [target]);

  useEffect(() => {
    setDraftMessage(null);
    setGenerateState("idle");
    setPromptGenerated(false);
  }, [selectedAction?.id]);

  useEffect(() => {
    if (!showManualPromptFallback) return;

    window.requestAnimationFrame(() => {
      manualPromptRef.current?.focus();
      manualPromptRef.current?.select();
    });
  }, [showManualPromptFallback]);

  const resetDraft = () => {
    onActionChange(null);
    setDraftMessage(null);
    setComment("");
    setGenerateState("idle");
    setPromptGenerated(false);
    setDesiredTokens({});
    setDesiredTypographyRole(null);
    setProposedText(target.visibleText ?? "");
  };

  const clearGeneratedPrompt = () => {
    setDraftMessage(null);
    setGenerateState("idle");
    setPromptGenerated(false);
  };

  const generatePrompt = async () => {
    if (!hasActionableDraft) {
      setGenerateState("idle");
      setPromptGenerated(false);
      setDraftMessage("Add a comment or change one property before generating a prompt.");
      return;
    }

    setDraftMessage(null);
    setPromptGenerated(true);

    try {
      const copyResult = await copyTextToClipboard(prompt);
      setGenerateState(copyResult.ok ? "copied" : "copy_failed");
    } catch {
      setGenerateState("copy_failed");
    }
  };

  return (
    <div className="grid min-w-0 gap-3">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="hito-label text-foreground">Prompt draft</p>
          <p className="hito-caption truncate">Target: {targetLabel}</p>
          <p className="hito-caption truncate">
            {targetKind} · {payload.route.path}
          </p>
        </div>
        <button
          type="button"
          className="hito-button hito-button-ghost hito-button-sm min-h-7 px-2"
          aria-label="Close local UI prompt draft"
          onClick={onClose}
        >
          <Icon name="close" size="xs" />
        </button>
      </div>

      {getHasObservedProperties(target, observableTokenControls) ? (
        <div className="grid min-w-0 gap-1.5" data-local-ui-property-controls="">
          <p className="hito-caption text-foreground">Observed properties</p>
          {observableTokenControls.length > 0 ? (
            <TokenControlRows
              controls={observableTokenControls}
              desiredTokens={desiredTokens}
              onPendingChangeRemove={(controlIds) => {
                setDesiredTokens((current) => {
                  const next = { ...current };
                  controlIds.forEach((controlId) => {
                    delete next[controlId];
                  });
                  return next;
                });
                clearGeneratedPrompt();
              }}
              onDesiredTokenChange={(controlId, token) => {
                setDesiredTokens((current) => {
                  const control = observableTokenControls.find(
                    (candidate) => candidate.id === controlId,
                  );
                  const baseToken = control ? getBaseToken(control) : null;
                  const next = { ...current };

                  if (!token || token === baseToken) {
                    delete next[controlId];
                  } else {
                    next[controlId] = token;
                  }

                  return next;
                });
                clearGeneratedPrompt();
              }}
            />
          ) : null}
          {target.typography ? (
            <TypographyControlRow
              desiredRoleId={desiredTypographyRole}
              onDesiredRoleChange={(roleId) => {
                const desiredRole =
                  target.typography?.options.find((option) => option.id === roleId) ?? null;
                setDesiredTypographyRole(
                  desiredRole && desiredRole.id !== target.typography?.currentRole?.id
                    ? desiredRole.id
                    : null,
                );
                clearGeneratedPrompt();
              }}
              typography={target.typography}
            />
          ) : null}
        </div>
      ) : null}

      {showReplacementText ? (
        <label className="grid min-w-0 gap-1">
          <span className="hito-label">Replacement text</span>
          <Textarea
            className="min-h-20 resize-none py-1.5"
            value={proposedText}
            onChange={(event) => {
              setProposedText(event.target.value);
              clearGeneratedPrompt();
            }}
          />
        </label>
      ) : null}

      {showCommentInput ? (
        <label className="grid min-w-0 gap-1">
          <span className="hito-label">{selectedAction?.id === "bug" ? "Issue" : "Comment"}</span>
          <Textarea
            className="min-h-16 resize-none py-1.5"
            placeholder={
              selectedAction?.id === "bug"
                ? "What is broken?"
                : "Describe the task for this target."
            }
            value={comment}
            onChange={(event) => {
              setComment(event.target.value);
              clearGeneratedPrompt();
            }}
          />
        </label>
      ) : null}

      <div className="grid min-w-0 gap-1">
        <TaskDisclosure title="Inspect details">
          <pre className="hito-technical-mono max-h-44 overflow-auto whitespace-pre-wrap rounded-md bg-black/25 p-3 text-xs leading-5 text-foreground">
            {payloadJson}
          </pre>
        </TaskDisclosure>
      </div>

      {showManualPromptFallback ? (
        <div className="grid min-w-0 gap-2 rounded-lg border border-hairline bg-surface/70 p-2">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <p className="hito-caption text-foreground">Copy blocked. Select the prompt below.</p>
            <button
              type="button"
              className="hito-button hito-button-ghost hito-button-sm min-h-7 px-2"
              onClick={() => setGenerateState("idle")}
            >
              Hide
            </button>
          </div>
          <Textarea
            ref={manualPromptRef}
            readOnly
            aria-label="Manual copy generated prompt"
            className="hito-technical-mono max-h-44 min-h-28 resize-y whitespace-pre-wrap py-1.5 text-xs leading-5"
            value={prompt}
            onFocus={(event) => event.currentTarget.select()}
          />
        </div>
      ) : null}

      <div className="grid min-w-0 gap-2 border-t border-hairline pt-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <button
            type="button"
            className="hito-button hito-button-primary hito-button-sm min-h-8 px-2"
            disabled={!hasActionableDraft}
            onClick={() => void generatePrompt()}
          >
            <Icon name="copy" size="xs" />
            Generate Prompt
          </button>
          <button
            type="button"
            className="hito-button hito-button-ghost hito-button-sm min-h-8 px-2"
            onClick={resetDraft}
          >
            Clear
          </button>
        </div>
        {promptGenerated ? (
          <TaskDisclosure title="Generated prompt">
            <Textarea
              readOnly
              aria-label="Generated local UI prompt"
              className="hito-technical-mono max-h-44 min-h-28 resize-y whitespace-pre-wrap py-1.5 text-xs leading-5"
              value={prompt}
              onFocus={(event) => event.currentTarget.select()}
            />
          </TaskDisclosure>
        ) : null}
        <TaskStatus
          defaultLabel="Prompt hidden until Generate Prompt."
          generateState={generateState}
          message={draftMessage}
          promptGenerated={promptGenerated}
        />
      </div>
    </div>
  );
}

function TaskDisclosure({ children, title }: { children: ReactNode; title: string }) {
  return (
    <details className="hito-disclosure border-0 bg-transparent p-0">
      <summary className="hito-disclosure-summary cursor-pointer list-none px-0 py-1 [&::-webkit-details-marker]:hidden">
        <span className="hito-caption text-foreground">{title}</span>
        <Icon name="chevron-down" size="xs" className="hito-disclosure-chevron" />
      </summary>
      <div className="hito-disclosure-body mt-1 grid gap-2">{children}</div>
    </details>
  );
}

function TaskStatus({
  defaultLabel,
  generateState,
  message,
  promptGenerated,
}: {
  defaultLabel: string;
  generateState: GenerateState;
  message: string | null;
  promptGenerated: boolean;
}) {
  if (message) {
    return <p className="hito-caption text-warn">{message}</p>;
  }

  if (generateState === "copied") {
    return <p className="hito-caption text-success">Prompt copied.</p>;
  }

  if (generateState === "copy_failed") {
    return <p className="hito-caption text-warn">Copy blocked. Manual prompt is visible.</p>;
  }

  if (promptGenerated) {
    return <p className="hito-caption text-success">Prompt generated.</p>;
  }

  return <p className="hito-caption">Local prompt draft · {defaultLabel}</p>;
}

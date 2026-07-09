import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { copyTextToClipboard } from "@/components/devtools/local-ui-clipboard";
import {
  INLINE_CHANGE_SCOPE_OPTIONS,
  buildInlineChangePayload,
  buildInlineChangePrompt,
  buildTokenControlSelections,
  getDefaultFixScope,
  getInlineChangeAction,
  normalizeTargetKind,
  type InlineChangeChromeRemovalSelection,
  type InlineChangeFixScope,
  type InlineChangeTargetInput,
  type InlineChangeTokenControlSelection,
  type InlineChangeTypographySelection,
} from "@/components/devtools/local-inline-change-target-utils";
import { ChromeControlRows } from "@/components/devtools/LocalUiChromeControls";
import { TokenControlRows } from "@/components/devtools/LocalUiTokenControls";
import { TypographyControlRow } from "@/components/devtools/LocalUiTypographyControls";
import {
  buildTypographyRoleSelection,
  getBaseToken,
  getHasActionableDraft,
  getHasObservedProperties,
  getInferredDraftAction,
  getIsObservableTokenControl,
  getIsTokenControlActive,
} from "@/components/devtools/local-ui-task-draft-view-model";

type GenerateState = "idle" | "copied" | "copy_failed" | "fallback_hidden";

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
  const [desiredTokens, setDesiredTokens] = useState<Record<string, string>>({});
  const [desiredTypographyRole, setDesiredTypographyRole] = useState<string | null>(null);
  const [chromeRemovalSelection, setChromeRemovalSelection] =
    useState<InlineChangeChromeRemovalSelection | null>(null);
  const [fixScope, setFixScope] = useState<InlineChangeFixScope>(getDefaultFixScope);
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
    () =>
      selectedAction ??
      getInferredDraftAction(
        tokenControlSelections,
        typographyRoleSelection,
        chromeRemovalSelection,
      ),
    [chromeRemovalSelection, selectedAction, tokenControlSelections, typographyRoleSelection],
  );
  const payload = useMemo(
    () =>
      buildInlineChangePayload({
        action: draftAction,
        comment,
        fixScope,
        target: {
          ...target,
          chromeRemovalSelection,
          proposedText: showReplacementText ? proposedText : null,
          tokenControlSelections,
          typographyRoleSelection,
        },
      }),
    [
      comment,
      chromeRemovalSelection,
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
  const targetLabel = payload.target.label ?? payload.target.selector ?? "Selected UI element";
  const promptGenerated = generateState !== "idle";
  const showManualPromptFallback = generateState === "copy_failed";
  const generateButtonCopied = generateState === "copied";
  const hasActionableDraft = getHasActionableDraft({
    action: draftAction,
    chromeRemovalSelection,
    comment,
    proposedText,
    tokenControlSelections,
    typographyRoleSelection,
  });

  useEffect(() => {
    setComment("");
    setGenerateState("idle");
    setDesiredTokens({});
    setDesiredTypographyRole(null);
    setChromeRemovalSelection(null);
    setFixScope(getDefaultFixScope());
    setProposedText(target.visibleText ?? "");
  }, [target]);

  useEffect(() => {
    setGenerateState("idle");
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
    setComment("");
    setGenerateState("idle");
    setDesiredTokens({});
    setDesiredTypographyRole(null);
    setChromeRemovalSelection(null);
    setFixScope(getDefaultFixScope());
    setProposedText(target.visibleText ?? "");
  };

  const clearGeneratedPrompt = () => {
    setGenerateState("idle");
  };

  const generatePrompt = async () => {
    if (!hasActionableDraft) return;

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
          <ChromeControlRows
            border={target.border}
            cardChrome={target.cardChrome}
            chromeRemovalSelection={chromeRemovalSelection}
            onChromeRemovalChange={(selection) => {
              setChromeRemovalSelection(selection);
              clearGeneratedPrompt();
            }}
          />
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

      <label className="grid min-w-0 gap-1">
        <span className="hito-label">Scope of fix</span>
        <Select
          value={fixScope}
          onValueChange={(value) => {
            setFixScope(value as InlineChangeFixScope);
            clearGeneratedPrompt();
          }}
        >
          <SelectTrigger
            className="hito-field-sm h-8 min-w-0 rounded-md px-2 py-0 text-xs shadow-none focus-visible:ring-1"
            aria-label="Scope of fix"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end" className="z-[73] w-64" data-local-ui-inspector-layer="">
            {INLINE_CHANGE_SCOPE_OPTIONS.map((option) => (
              <SelectItem key={option.id} value={option.id} title={option.description}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

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
              onClick={() => setGenerateState("fallback_hidden")}
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
            disabled={!hasActionableDraft || generateButtonCopied}
            onClick={() => void generatePrompt()}
          >
            <Icon name={generateButtonCopied ? "check" : "copy"} size="xs" />
            {generateButtonCopied ? "Copied" : "Generate Prompt"}
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
        <TaskStatus generateState={generateState} />
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

function TaskStatus({ generateState }: { generateState: GenerateState }) {
  if (generateState === "copied") {
    return <p className="hito-caption text-success">Prompt copied.</p>;
  }

  if (generateState === "copy_failed") {
    return <p className="hito-caption text-warn">Copy blocked. Manual prompt is visible.</p>;
  }

  if (generateState === "fallback_hidden") {
    return <p className="hito-caption text-success">Prompt generated.</p>;
  }

  return <p className="hito-caption">Local prompt draft · Prompt hidden until Generate Prompt.</p>;
}

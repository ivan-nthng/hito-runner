import { type ReactNode, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  LocalUiActionsPropertyRow,
  LocalUiComponentIdentity,
} from "@/components/devtools/LocalUiComponentActions";
import {
  buildInlineChangePayload,
  buildTokenControlSelections,
  getInlineChangeAction,
  INLINE_CHANGE_SCOPE_OPTIONS,
  normalizeTargetKind,
  type InlineChangeFixScope,
  type InlineChangeTargetInput,
  type InlineChangeTargetPayload,
} from "@/components/devtools/local-inline-change-target-utils";
import {
  type LocalUiInspectorItemDraft,
  type LocalUiComponentAction,
  type LocalUiScopedComponentActionScope,
} from "@/components/devtools/local-ui-inspector-session";
import { ChromeControlRows } from "@/components/devtools/LocalUiChromeControls";
import { TokenControlRows } from "@/components/devtools/LocalUiTokenControls";
import { TypographyControlRow } from "@/components/devtools/LocalUiTypographyControls";
import {
  buildTypographyRoleSelection,
  getBaseToken,
  getHasActionableDraft,
  getInferredDraftAction,
  getIsObservableTokenControl,
  getIsTokenControlActive,
} from "@/components/devtools/local-ui-task-draft-view-model";
import type { HitoDsOwnershipEvidence } from "@/components/hito-ds/reference-metadata";
import { Icon } from "@/components/ui/icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function LocalUiTaskDraftPanel({
  batchFull,
  initialDraft,
  itemNumber,
  notice,
  onCancel,
  onSubmit,
  ownership,
  target,
}: {
  batchFull: boolean;
  initialDraft: LocalUiInspectorItemDraft;
  itemNumber?: number;
  notice?: string | null;
  onCancel: () => void;
  onSubmit: (result: {
    draft: LocalUiInspectorItemDraft;
    intent: "add" | "generate";
    payload: InlineChangeTargetPayload;
  }) => void;
  ownership: HitoDsOwnershipEvidence;
  target: InlineChangeTargetInput;
}) {
  const [draft, setDraft] = useState(initialDraft);
  const headingId = useId();
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const isEditing = typeof itemNumber === "number";
  const isRemovingInstance = draft.componentAction?.type === "remove_instance";
  const isAddingToDs = draft.componentAction?.type === "add_to_ds";
  const isReusingExistingComponent = draft.componentAction?.type === "reuse_existing_component";
  const isScopedComponentAction = isRemovingInstance || isReusingExistingComponent;
  const effectiveFixScope: InlineChangeFixScope = isAddingToDs
    ? "hito_ds"
    : isScopedComponentAction && draft.componentAction
      ? draft.componentAction.scope
      : draft.fixScope;
  const scopeOptions = INLINE_CHANGE_SCOPE_OPTIONS.filter((option) => {
    if (isAddingToDs) return option.id === "hito_ds";
    if (isScopedComponentAction) return option.id !== "hito_ds";
    return option.id !== "hito_ds" || Boolean(ownership.entry);
  });
  const selectedAction = useMemo(
    () => (draft.actionId ? getInlineChangeAction(draft.actionId) : null),
    [draft.actionId],
  );
  const targetKind = normalizeTargetKind(target.targetKind);
  const showReplacementText = selectedAction?.id === "edit_text";
  const observableTokenControls = useMemo(
    () => (target.tokenControls ?? []).filter(getIsObservableTokenControl),
    [target.tokenControls],
  );
  const activeTokenControls = useMemo(
    () =>
      observableTokenControls.filter((control) =>
        getIsTokenControlActive(control, draft.desiredTokens[control.id]),
      ),
    [draft.desiredTokens, observableTokenControls],
  );
  const tokenControlSelections = useMemo(
    () => buildTokenControlSelections(activeTokenControls, draft.desiredTokens),
    [activeTokenControls, draft.desiredTokens],
  );
  const typographyRoleSelection = useMemo(
    () => buildTypographyRoleSelection(target.typography, draft.desiredTypographyRole),
    [draft.desiredTypographyRole, target.typography],
  );
  const componentAction =
    draft.componentAction?.type === "remove_instance"
      ? getInlineChangeAction("remove_component")
      : draft.componentAction?.type === "add_to_ds" || isReusingExistingComponent
        ? getInlineChangeAction("align_with_hito_ds")
        : null;
  const draftAction = useMemo(
    () =>
      componentAction ??
      selectedAction ??
      getInferredDraftAction(
        tokenControlSelections,
        typographyRoleSelection,
        draft.chromeRemovalSelection,
        null,
      ),
    [
      componentAction,
      draft.chromeRemovalSelection,
      selectedAction,
      tokenControlSelections,
      typographyRoleSelection,
    ],
  );
  const payload = useMemo(
    () =>
      buildInlineChangePayload({
        action: draftAction,
        comment: draft.comment,
        fixScope: effectiveFixScope,
        target: {
          ...target,
          chromeRemovalSelection: isRemovingInstance ? null : draft.chromeRemovalSelection,
          promptActionSelection: isRemovingInstance
            ? { id: "remove_component", label: "Remove object" }
            : null,
          proposedText: showReplacementText ? draft.proposedText : null,
          tokenControlSelections: isRemovingInstance ? [] : tokenControlSelections,
          typographyRoleSelection: isRemovingInstance ? null : typographyRoleSelection,
        },
      }),
    [
      draft.chromeRemovalSelection,
      draft.comment,
      draft.proposedText,
      draftAction,
      effectiveFixScope,
      isRemovingInstance,
      showReplacementText,
      target,
      tokenControlSelections,
      typographyRoleSelection,
    ],
  );
  const payloadJson = useMemo(
    () => JSON.stringify({ componentAction: draft.componentAction, ownership, payload }, null, 2),
    [draft.componentAction, ownership, payload],
  );
  const hasActionableDraft =
    draft.componentAction !== null ||
    getHasActionableDraft({
      action: draftAction,
      chromeRemovalSelection: draft.chromeRemovalSelection,
      comment: draft.comment,
      proposedText: draft.proposedText,
      promptActionSelection: null,
      tokenControlSelections,
      typographyRoleSelection,
    });
  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(initialDraft),
    [draft, initialDraft],
  );
  const submitDisabled = !hasActionableDraft || (!isEditing && batchFull);

  useEffect(() => {
    setDraft(initialDraft);
    window.requestAnimationFrame(() => headingRef.current?.focus());
  }, [initialDraft]);

  const updateDraft = (update: Partial<LocalUiInspectorItemDraft>) => {
    setDraft((current) => ({ ...current, ...update }));
  };

  const updateComponentAction = (componentAction: LocalUiComponentAction) => {
    if (componentAction?.type === "remove_instance") {
      setDraft((current) => ({
        ...current,
        chromeRemovalSelection: null,
        componentAction,
        desiredTokens: {},
        desiredTypographyRole: null,
      }));
      return;
    }
    updateDraft({ componentAction });
  };

  const submit = (intent: "add" | "generate") => {
    if (submitDisabled) return;
    onSubmit({ draft, intent, payload });
  };

  return (
    <div
      className="relative grid min-h-0 min-w-0 gap-3 pt-0.5 max-md:h-full max-md:grid-rows-[auto_minmax(0,1fr)_auto]"
      aria-labelledby={headingId}
      onKeyDown={(event) => {
        if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          submit("generate");
        }
      }}
    >
      <div className="min-w-0 pr-8" data-local-ui-inspector-header="">
        <h2
          ref={headingRef}
          id={headingId}
          tabIndex={-1}
          className="hito-label min-w-0 truncate text-foreground outline-none"
        >
          {getTargetHeaderLabel(payload)}
        </h2>
        <div className="mt-0.5 grid min-w-0 gap-0.5">
          <p className="hito-caption truncate">{getTargetMetaLabel(payload, targetKind)}</p>
          <p className="hito-caption truncate">{payload.route.path}</p>
          <LocalUiComponentIdentity ownership={ownership} />
        </div>
        <button
          type="button"
          className="hito-button hito-button-ghost hito-button-sm absolute -right-1 -top-1 min-h-7 px-2"
          aria-label={isEditing ? "Cancel item edit" : "Close item composer"}
          onClick={onCancel}
        >
          <Icon name="close" size="xs" />
        </button>
      </div>

      <div
        className="grid min-w-0 gap-3 max-md:min-h-0 max-md:overflow-y-auto max-md:overscroll-contain max-md:pr-1"
        data-local-ui-inspector-scroll-body=""
      >
        {notice ? <p className="hito-caption text-signal">{notice}</p> : null}
        {batchFull && !isEditing ? (
          <p className="hito-caption text-warn">
            Batch is full. Generate a prompt or remove an item before adding another.
          </p>
        ) : null}

        <div className="grid min-w-0 gap-1.5" data-local-ui-property-controls="">
          <p className="hito-caption text-foreground">Observed properties</p>
          {!isRemovingInstance ? (
            <>
              <ChromeControlRows
                border={target.border}
                cardChrome={target.cardChrome}
                chromeRemovalSelection={draft.chromeRemovalSelection}
                onChromeRemovalChange={(chromeRemovalSelection) =>
                  updateDraft({ chromeRemovalSelection })
                }
              />
              {observableTokenControls.length > 0 ? (
                <TokenControlRows
                  controls={observableTokenControls}
                  desiredTokens={draft.desiredTokens}
                  onPendingChangeRemove={(controlIds) => {
                    const desiredTokens = { ...draft.desiredTokens };
                    controlIds.forEach((controlId) => delete desiredTokens[controlId]);
                    updateDraft({ desiredTokens });
                  }}
                  onDesiredTokenChange={(controlId, token) => {
                    const control = observableTokenControls.find(
                      (candidate) => candidate.id === controlId,
                    );
                    const desiredTokens = { ...draft.desiredTokens };
                    if (!token || token === (control ? getBaseToken(control) : null)) {
                      delete desiredTokens[controlId];
                    } else {
                      desiredTokens[controlId] = token;
                    }
                    updateDraft({ desiredTokens });
                  }}
                />
              ) : null}
              {target.typography ? (
                <TypographyControlRow
                  desiredRoleId={draft.desiredTypographyRole}
                  onDesiredRoleChange={(roleId) => {
                    const desiredRole =
                      target.typography?.options.find((option) => option.id === roleId) ?? null;
                    updateDraft({
                      desiredTypographyRole:
                        desiredRole && desiredRole.id !== target.typography?.currentRole?.id
                          ? desiredRole.id
                          : null,
                    });
                  }}
                  typography={target.typography}
                />
              ) : null}
            </>
          ) : null}
          <LocalUiActionsPropertyRow
            onChange={updateComponentAction}
            ownership={ownership}
            value={draft.componentAction}
          />
        </div>

        {showReplacementText && !isRemovingInstance ? (
          <label className="grid min-w-0 gap-1">
            <span className="hito-caption text-foreground">Replacement text</span>
            <Textarea
              className="min-h-20 resize-none py-1.5"
              value={draft.proposedText}
              onChange={(event) => updateDraft({ proposedText: event.target.value })}
            />
          </label>
        ) : (
          <label className="grid min-w-0 gap-1">
            <span className="hito-caption text-foreground">
              {selectedAction?.id === "bug" ? "Issue" : "Comment"}
            </span>
            <Textarea
              className="min-h-16 resize-none py-1.5"
              placeholder={
                selectedAction?.id === "bug"
                  ? "What is broken?"
                  : "Describe the task for this target."
              }
              value={draft.comment}
              onChange={(event) => updateDraft({ comment: event.target.value })}
            />
          </label>
        )}

        <label className="grid min-w-0 gap-1">
          <span className="hito-caption text-foreground">Scope of fix</span>
          <Select
            disabled={isAddingToDs}
            value={effectiveFixScope}
            onValueChange={(value) => {
              if (isScopedComponentAction && draft.componentAction) {
                updateDraft({
                  componentAction: {
                    ...draft.componentAction,
                    scope: value as LocalUiScopedComponentActionScope,
                  },
                });
                return;
              }
              updateDraft({ fixScope: value as InlineChangeFixScope });
            }}
          >
            <SelectTrigger size="sm" className="min-w-0" aria-label="Scope of fix">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end" className="z-[84] w-64" data-local-ui-inspector-layer="">
              {scopeOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <TaskDisclosure title="Inspect details">
          <pre className="hito-technical-mono max-h-44 overflow-auto whitespace-pre-wrap rounded-md bg-black/25 p-3 text-xs leading-5 text-foreground">
            {payloadJson}
          </pre>
        </TaskDisclosure>
      </div>

      <div data-local-ui-inspector-footer="">
        <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 border-t border-hairline pt-3">
          <button
            type="button"
            className="hito-button hito-button-secondary hito-button-sm"
            disabled={submitDisabled}
            onClick={() => submit("add")}
          >
            {isEditing ? "Update list" : "Add to list"}
          </button>
          <button
            type="button"
            className="hito-button hito-button-primary hito-button-sm"
            disabled={submitDisabled}
            onClick={() => submit("generate")}
          >
            Generate prompt
          </button>
        </div>
        <p className="sr-only" aria-live="polite">
          {isDirty ? "Current draft has changes." : "Current draft is unchanged."}
        </p>
      </div>
    </div>
  );
}

export function TaskDisclosure({ children, title }: { children: ReactNode; title: string }) {
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

function getTargetHeaderLabel(payload: InlineChangeTargetPayload) {
  if (payload.target.kind === "behavior") return "Behavior page";

  const stableLabel =
    payload.target.componentId ??
    getStableClassLabel(payload.target.elementClasses) ??
    payload.target.selector ??
    payload.target.label;
  const normalizedLabel = normalizeHeaderToken(stableLabel) ?? "selected element";

  return toHeaderLabel(normalizedLabel);
}

function getTargetMetaLabel(payload: InlineChangeTargetPayload, targetKind: string) {
  return [targetKind, payload.target.elementTag].filter(Boolean).join(" · ");
}

function getStableClassLabel(className: string | null) {
  return className?.split(/\s+/).find((classPart) => classPart.startsWith("hito-")) ?? null;
}

function normalizeHeaderToken(value: string | null) {
  if (!value) return null;

  return value
    .replace(/^\[?data-[^\]=]+="?([^"\]]+)"?\]?$/, "$1")
    .replace(/^#/, "")
    .replace(/^\./, "")
    .replace(/^hito-/, "")
    .replace(/[-_.]+/g, " ")
    .trim();
}

function toHeaderLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

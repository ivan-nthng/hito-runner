import { type ReactNode, useEffect, useState } from "react";

import type {
  HitoDsCodeLanguage,
  HitoDsCodeReference,
} from "@/components/hito-ds/code-reference-catalog";
import { HitoButton } from "@/components/ui/button";
import { useHitoTabs } from "@/components/ui/hito-tabs";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

type CodeRepresentationId = "source" | "usage";
type CopyState = "copied" | "failed" | "idle";

const CODE_REPRESENTATIONS = [{ value: "usage" }, { value: "source" }] as const;
const TYPESCRIPT_KEYWORDS = new Set([
  "as",
  "async",
  "await",
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "default",
  "delete",
  "do",
  "else",
  "enum",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "from",
  "function",
  "if",
  "implements",
  "import",
  "in",
  "infer",
  "instanceof",
  "interface",
  "keyof",
  "let",
  "new",
  "null",
  "of",
  "return",
  "satisfies",
  "switch",
  "throw",
  "true",
  "try",
  "type",
  "typeof",
  "undefined",
  "while",
]);
const CODE_TOKEN_PATTERN =
  /\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|<\/?[A-Za-z][\w.:$-]*|\b(?:0x[\da-f]+|\d+(?:\.\d+)?)\b|[A-Za-z_$][\w$-]*|[{}()[\].,;:=<>/?&|!+*%-]+/gi;

export function HitoDsCodeReferencePanel({
  componentLabel,
  reference,
}: {
  componentLabel: string;
  reference: HitoDsCodeReference;
}) {
  const [activeRepresentation, setActiveRepresentation] = useState<CodeRepresentationId>("usage");
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const representationTabs = useHitoTabs({
    idPrefix: `hito-ds-code-${toSafeId(componentLabel)}`,
    items: [...CODE_REPRESENTATIONS],
    value: activeRepresentation,
  });
  const selected = reference[activeRepresentation];

  useEffect(() => {
    setCopyState("idle");
  }, [activeRepresentation, reference]);

  const copySelectedCode = async () => {
    setCopyState((await copyPlainText(selected.code)) ? "copied" : "failed");
  };

  return (
    <div className="hito-ds-code-reference" data-hito-ds-code-reference>
      <div className="hito-ds-code-toolbar">
        <div
          className="hito-tabs hito-tabs-simple"
          {...representationTabs.tabListProps}
          aria-label={`${componentLabel} code representations`}
        >
          {CODE_REPRESENTATIONS.map(({ value }) => {
            const isActive = activeRepresentation === value;
            const label = value === "usage" ? "Usage" : "Source / Reference";

            return (
              <button
                key={value}
                type="button"
                {...representationTabs.getTabProps(value)}
                className="hito-tab"
                data-active={isActive ? "true" : undefined}
                onClick={() => setActiveRepresentation(value)}
              >
                {label}
              </button>
            );
          })}
        </div>
        <HitoButton
          type="button"
          size="sm"
          variant="secondary"
          feedback={
            copyState === "copied" ? "success" : copyState === "failed" ? "error" : undefined
          }
          onClick={() => void copySelectedCode()}
        >
          <Icon aria-hidden="true" name={copyState === "copied" ? "check" : "copy"} size="xs" />
          {copyState === "copied" ? "Copied" : "Copy"}
        </HitoButton>
      </div>

      <p
        className={cn("hito-body-xs", copyState === "failed" ? "text-negative" : "text-tertiary")}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {copyState === "copied"
          ? `${selected.label} copied as plain text.`
          : copyState === "failed"
            ? "Copy failed. Select the code and copy it manually."
            : "Copies exactly the visible representation as plain text."}
      </p>

      <div className="hito-ds-code-surface">
        <div className="hito-ds-code-caption">
          <span>{selected.label}</span>
          <span>{selected.sourcePath ?? selected.language.toUpperCase()}</span>
        </div>
        <div className="hito-ds-code-scroll">
          <pre
            className="hito-ds-code-block hito-technical-sm"
            {...representationTabs.getPanelProps(activeRepresentation)}
            aria-label={`${componentLabel} ${selected.label} code`}
            tabIndex={0}
          >
            <code>{highlightCode(selected.code, selected.language)}</code>
          </pre>
        </div>
      </div>

      <div
        className="hito-ds-code-dependencies"
        aria-label={`${componentLabel} adaptation dependencies`}
      >
        <div>
          <p className="hito-label-md text-foreground">Adaptation dependencies</p>
          <p className="hito-body-xs text-tertiary mt-1 max-w-2xl">
            This is Hito reference material, not a portable package. Re-map its primitives, semantic
            tokens, behavior, and accessibility contract in the destination system.
          </p>
        </div>
        <dl className="grid min-w-0 gap-3 sm:grid-cols-2">
          {reference.dependencies.map((dependency) => (
            <div key={dependency.kind} className="hito-state-surface min-w-0" data-size="sm">
              <dt className="hito-label-sm text-foreground">{dependency.kind}</dt>
              <dd className="hito-body-xs text-secondary mt-1">{dependency.detail}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

function highlightCode(code: string, language: HitoDsCodeLanguage): ReactNode[] {
  const highlighted: ReactNode[] = [];
  let cursor = 0;

  for (const match of code.matchAll(CODE_TOKEN_PATTERN)) {
    const index = match.index ?? 0;
    const token = match[0];
    if (index > cursor) highlighted.push(code.slice(cursor, index));

    const tokenKind = classifyCodeToken(token, language, code.slice(index + token.length));
    highlighted.push(
      tokenKind ? (
        <span key={`${index}-${tokenKind}`} className={`hito-ds-code-token-${tokenKind}`}>
          {token}
        </span>
      ) : (
        token
      ),
    );
    cursor = index + token.length;
  }

  if (cursor < code.length) highlighted.push(code.slice(cursor));
  return highlighted;
}

function classifyCodeToken(
  token: string,
  language: HitoDsCodeLanguage,
  remainingCode: string,
): "comment" | "keyword" | "number" | "property" | "string" | "tag" | "type" | null {
  if (token.startsWith("//") || token.startsWith("/*")) return "comment";
  if (/^["'`]/.test(token)) {
    return language === "json" && /^\s*:/.test(remainingCode) ? "property" : "string";
  }
  if (/^(?:0x[\da-f]+|\d+(?:\.\d+)?)$/i.test(token)) return "number";
  if (token.startsWith("<")) return "tag";
  if (TYPESCRIPT_KEYWORDS.has(token)) return "keyword";
  if (language === "css" && /^\s*:/.test(remainingCode)) return "property";
  if ((language === "tsx" || language === "typescript") && /^[A-Z]/.test(token)) return "type";
  return null;
}

async function copyPlainText(value: string) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Fall through to the user-gesture copy path without opening a permission surface.
    }
  }

  const activeElement =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.inset = "0 auto auto -9999px";
  textarea.style.position = "fixed";
  document.body.append(textarea);
  textarea.select();
  textarea.setSelectionRange(0, value.length);

  try {
    return typeof document.execCommand === "function" && document.execCommand("copy");
  } catch {
    return false;
  } finally {
    textarea.remove();
    if (activeElement?.isConnected) activeElement.focus({ preventScroll: true });
  }
}

function toSafeId(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

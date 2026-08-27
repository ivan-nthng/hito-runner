type ClipboardCopyResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      reason: "blocked" | "unverified";
    };

export async function copyTextToClipboard(value: string): Promise<ClipboardCopyResult> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(value);
      return (await canTrustClipboardWrite(value))
        ? { ok: true }
        : { ok: false, reason: "unverified" };
    } catch {
      // Local browsers can reject async clipboard even for user-triggered actions.
    }
  }

  const initiatingElement =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const activeDebuggerLayer =
    initiatingElement?.closest<HTMLElement>("[data-local-ui-inspector-layer]") ??
    document
      .querySelector<HTMLElement>("[data-local-notion-submission-actions]")
      ?.closest<HTMLElement>("[data-local-ui-inspector-layer]");
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.inset = "0 auto auto -9999px";
  textarea.style.position = "fixed";
  (activeDebuggerLayer ?? document.body).append(textarea);
  textarea.select();
  textarea.setSelectionRange(0, value.length);

  try {
    if (!document.execCommand("copy")) {
      return { ok: false, reason: "blocked" };
    }

    return (await canTrustClipboardWrite(value))
      ? { ok: true }
      : { ok: false, reason: "unverified" };
  } catch {
    return { ok: false, reason: "blocked" };
  } finally {
    textarea.remove();
    if (initiatingElement?.isConnected) {
      initiatingElement.focus({ preventScroll: true });
    }
  }
}

async function canTrustClipboardWrite(expectedValue: string) {
  if (!navigator.clipboard?.readText || !window.isSecureContext) return false;

  try {
    return (await navigator.clipboard.readText()) === expectedValue;
  } catch {
    return false;
  }
}

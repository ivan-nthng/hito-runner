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

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.inset = "0 auto auto -9999px";
  textarea.style.position = "fixed";
  document.body.append(textarea);
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

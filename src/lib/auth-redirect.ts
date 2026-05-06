export const DEFAULT_AUTH_REDIRECT = "/";

export function sanitizeRedirectPath(next: string | null | undefined) {
  if (typeof next !== "string") {
    return DEFAULT_AUTH_REDIRECT;
  }

  const trimmed = next.trim();

  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return DEFAULT_AUTH_REDIRECT;
  }

  return trimmed;
}

export function getLoginIntentPath(pathname: string, searchStr: string | undefined) {
  if (pathname !== "/login") {
    return sanitizeRedirectPath(`${pathname}${searchStr ?? ""}`);
  }

  const params = new URLSearchParams(searchStr?.startsWith("?") ? searchStr.slice(1) : searchStr);
  return sanitizeRedirectPath(params.get("next"));
}

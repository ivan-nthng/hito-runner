import { getGlobalStartContext } from "@tanstack/react-start";

export interface RequestAuthContext {
  userId: string | null;
  email: string | null;
  appBaseUrl: string | null;
  provider: "preview" | "supabase" | "local";
}

export function getRequestAuthContext(): RequestAuthContext {
  const context = getGlobalStartContext() as { auth?: RequestAuthContext } | undefined;

  return context?.auth ?? { userId: null, email: null, appBaseUrl: null, provider: "preview" };
}

export function requireAuthenticatedUser() {
  const auth = getRequestAuthContext();

  if (!auth.userId) {
    throw new Error("Authentication is required for this action.");
  }

  return auth;
}

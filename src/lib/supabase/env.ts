function readEnv(name: string): string | null {
  const viteValue = import.meta.env[name];

  if (typeof viteValue === "string" && viteValue.trim()) {
    return viteValue.trim();
  }

  const processEnv =
    typeof globalThis !== "undefined" &&
    "process" in globalThis &&
    typeof globalThis.process === "object" &&
    globalThis.process &&
    "env" in globalThis.process &&
    typeof globalThis.process.env === "object"
      ? globalThis.process.env
      : undefined;
  const value = processEnv?.[name];

  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  return value.trim();
}

function envOrFallback(names: string | string[], fallback: string): string {
  const envNames = Array.isArray(names) ? names : [names];

  for (const name of envNames) {
    const value = readEnv(name);

    if (value) {
      return value;
    }
  }

  return fallback;
}

function optionalEnv(...names: string[]): string | null {
  for (const name of names) {
    const value = readEnv(name);

    if (value) {
      return value;
    }
  }

  return null;
}

const LOOPBACK_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export const publicEnv = {
  appName: envOrFallback("NEXT_PUBLIC_APP_NAME", "Hito Running"),
  supabaseUrl: optionalEnv("NEXT_PUBLIC_SUPABASE_URL"),
  supabasePublishableKey: optionalEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
};

export const serverEnv = {
  appBaseUrl: optionalEnv("APP_BASE_URL"),
  supabaseServiceRoleKey: optionalEnv("SUPABASE_SECRET_KEY"),
  openAiApiKey: optionalEnv("OPENAI_API_KEY"),
  openAiPlanModel: optionalEnv("OPENAI_PLAN_MODEL"),
  localAuthBypassEnabled:
    optionalEnv("LOCAL_AUTH_BYPASS_ENABLED")?.toLowerCase() === "true" ||
    optionalEnv("LOCAL_AUTH_BYPASS_ENABLED") === "1",
  localAuthBypassAccountsFile: optionalEnv("LOCAL_AUTH_BYPASS_ACCOUNTS_FILE"),
};

export const hasSupabaseBrowserEnv = Boolean(
  publicEnv.supabaseUrl && publicEnv.supabasePublishableKey,
);

export const hasSupabaseServerEnv = Boolean(
  hasSupabaseBrowserEnv && serverEnv.supabaseServiceRoleKey,
);

export const hasLocalAuthBypassEnv = Boolean(
  serverEnv.localAuthBypassEnabled && serverEnv.localAuthBypassAccountsFile,
);

export function isLoopbackRuntimeUrl(url: string | URL | null | undefined) {
  if (!url) {
    return false;
  }

  try {
    const parsed = url instanceof URL ? url : new URL(url);
    return LOOPBACK_HOSTNAMES.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function isDevOnlyLocalAuthRuntime(url: string | URL | null | undefined) {
  return hasLocalAuthBypassEnv && isLoopbackRuntimeUrl(url);
}

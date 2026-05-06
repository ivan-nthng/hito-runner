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

function requireEnv(...names: string[]): string {
  for (const name of names) {
    const value = readEnv(name);

    if (value) {
      return value;
    }
  }

  throw new Error(`Missing required environment variable: ${names.join(" or ")}`);
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

export const publicEnv = {
  appName: envOrFallback(["NEXT_PUBLIC_APP_NAME", "VITE_APP_NAME"], "Hito Running"),
  supabaseUrl: optionalEnv("NEXT_PUBLIC_SUPABASE_URL", "VITE_SUPABASE_URL"),
  supabasePublishableKey: optionalEnv(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "VITE_SUPABASE_ANON_KEY",
  ),
};

export const serverEnv = {
  appBaseUrl: optionalEnv("APP_BASE_URL"),
  supabaseServiceRoleKey: optionalEnv("SUPABASE_SERVICE_ROLE_KEY"),
  localAuthBypassEnabled:
    optionalEnv("LOCAL_AUTH_BYPASS_ENABLED")?.toLowerCase() === "true" ||
    optionalEnv("LOCAL_AUTH_BYPASS_ENABLED") === "1",
  localAuthBypassAccountsFile: optionalEnv("LOCAL_AUTH_BYPASS_ACCOUNTS_FILE"),
  localAuthBypassIdentifier: optionalEnv("LOCAL_AUTH_BYPASS_IDENTIFIER"),
  localAuthBypassPassword: optionalEnv("LOCAL_AUTH_BYPASS_PASSWORD"),
  localAuthBypassEmail: optionalEnv("LOCAL_AUTH_BYPASS_EMAIL"),
  localAuthBypassUserId: optionalEnv("LOCAL_AUTH_BYPASS_USER_ID"),
  localAuthBypassStatePath: optionalEnv("LOCAL_AUTH_BYPASS_STATE_PATH"),
};

export const hasSupabaseBrowserEnv = Boolean(
  publicEnv.supabaseUrl && publicEnv.supabasePublishableKey,
);

export const hasSupabaseServerEnv = Boolean(
  hasSupabaseBrowserEnv && serverEnv.supabaseServiceRoleKey,
);

export const hasLocalAuthBypassEnv = Boolean(
  serverEnv.localAuthBypassEnabled &&
  (serverEnv.localAuthBypassAccountsFile ||
    (serverEnv.localAuthBypassIdentifier && serverEnv.localAuthBypassPassword)),
);

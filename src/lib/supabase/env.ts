function readEnv(name: string): string | null {
  const value = import.meta.env[name];

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
  appBaseUrl: envOrFallback("APP_BASE_URL", "http://localhost:3000"),
  supabaseServiceRoleKey: optionalEnv("SUPABASE_SERVICE_ROLE_KEY"),
};

export const hasSupabaseBrowserEnv = Boolean(
  publicEnv.supabaseUrl && publicEnv.supabasePublishableKey,
);

export const hasSupabaseServerEnv = Boolean(
  hasSupabaseBrowserEnv && serverEnv.supabaseServiceRoleKey,
);

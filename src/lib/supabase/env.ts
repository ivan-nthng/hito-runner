function requireEnv(name: string): string {
	const value = import.meta.env[name];

	if (typeof value !== "string" || !value.trim()) {
		throw new Error(`Missing required environment variable: ${name}`);
	}

	return value.trim();
}

function envOrFallback(name: string, fallback: string): string {
	const value = import.meta.env[name];

	if (typeof value !== "string" || !value.trim()) {
		return fallback;
	}

	return value.trim();
}

function optionalEnv(name: string): string | null {
	const value = import.meta.env[name];

	if (typeof value !== "string" || !value.trim()) {
		return null;
	}

	return value.trim();
}

export const publicEnv = {
	appName: envOrFallback("VITE_APP_NAME", "Hito Running"),
	supabaseUrl: optionalEnv("VITE_SUPABASE_URL"),
	supabaseAnonKey: optionalEnv("VITE_SUPABASE_ANON_KEY"),
};

export const serverEnv = {
	appBaseUrl: envOrFallback("APP_BASE_URL", "http://localhost:3000"),
	supabaseServiceRoleKey: optionalEnv("SUPABASE_SERVICE_ROLE_KEY"),
};

export const hasSupabaseBrowserEnv = Boolean(publicEnv.supabaseUrl && publicEnv.supabaseAnonKey);

export const hasSupabaseServerEnv = Boolean(
	hasSupabaseBrowserEnv && serverEnv.supabaseServiceRoleKey,
);

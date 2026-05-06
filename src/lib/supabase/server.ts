import { createServerClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database";
import {
	hasSupabaseBrowserEnv,
	hasSupabaseServerEnv,
	publicEnv,
	serverEnv,
} from "@/lib/supabase/env";

export function createRequestSupabaseClient(request: Request, responseHeaders: Headers) {
	if (!hasSupabaseBrowserEnv) {
		throw new Error("Supabase auth is not configured in this environment.");
	}

	return createServerClient<Database>(publicEnv.supabaseUrl!, publicEnv.supabaseAnonKey!, {
		cookies: {
			getAll() {
				return parseCookieHeader(request.headers.get("cookie") ?? "");
			},
			setAll(cookiesToSet, headers) {
				for (const { name, value, options } of cookiesToSet) {
					responseHeaders.append(
						"set-cookie",
						serializeCookieHeader(name, value, options),
					);
				}

				for (const [key, value] of Object.entries(headers)) {
					responseHeaders.set(key, value);
				}
			},
		},
	});
}

export function createAdminSupabaseClient(): SupabaseClient<Database> {
	if (!hasSupabaseServerEnv) {
		throw new Error("Persisted Supabase access is not configured in this environment.");
	}

	return createClient<Database>(publicEnv.supabaseUrl!, serverEnv.supabaseServiceRoleKey!, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});
}

export function mergeResponseHeaders(baseResponse: Response, extraHeaders: Headers) {
	const merged = new Headers(baseResponse.headers);

	extraHeaders.forEach((value, key) => {
		if (key.toLowerCase() === "set-cookie") {
			merged.append(key, value);
			return;
		}

		merged.set(key, value);
	});

	return new Response(baseResponse.body, {
		status: baseResponse.status,
		statusText: baseResponse.statusText,
		headers: merged,
	});
}

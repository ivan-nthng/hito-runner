import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { hasSupabaseBrowserEnv, publicEnv } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/database";

let browserClient: SupabaseClient<Database> | null = null;

export function getBrowserSupabaseClient() {
	if (!browserClient) {
		if (!hasSupabaseBrowserEnv) {
			throw new Error("Supabase auth is not configured in this environment.");
		}

		browserClient = createBrowserClient<Database>(
			publicEnv.supabaseUrl!,
			publicEnv.supabaseAnonKey!,
		);
	}

	return browserClient;
}

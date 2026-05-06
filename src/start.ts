import { createMiddleware, createStart } from "@tanstack/react-start";
import { createRequestSupabaseClient, mergeResponseHeaders } from "@/lib/supabase/server";
import { hasSupabaseBrowserEnv } from "@/lib/supabase/env";

const authMiddleware = createMiddleware().server(async ({ next, request }) => {
	if (!hasSupabaseBrowserEnv) {
		return next({
			context: {
				auth: {
					userId: null,
					email: null,
				},
			},
		});
	}

	const responseHeaders = new Headers();
	const supabase = createRequestSupabaseClient(request, responseHeaders);

	let userId: string | null = null;
	let email: string | null = null;

	const claimsResult = await supabase.auth.getClaims();

	if (claimsResult.error) {
		await supabase.auth.signOut();
	} else {
		const claims = claimsResult.data?.claims;
		userId = typeof claims?.sub === "string" ? claims.sub : null;
		email = typeof claims?.email === "string" ? claims.email : null;
	}

	const result = await next({
		context: {
			auth: {
				userId,
				email,
			},
		},
	});

	return mergeResponseHeaders(result.response, responseHeaders);
});

export const startInstance = createStart(() => ({
	requestMiddleware: [authMiddleware],
}));

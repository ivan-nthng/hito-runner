import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database";
import { mergeResponseHeaders, resolveRequestSupabaseAuth } from "@/lib/supabase/server";

type AuthResult = {
  data: { user: { id: string; email: string | null } | null };
  error: unknown;
};

await run();

async function run() {
  await assertAuthCase({
    name: "transient Auth failure",
    result: { data: { user: null }, error: { status: 503, code: "temporarily_unavailable" } },
    expectedSignOuts: 0,
    expectedCookie: false,
  });
  await assertAuthCase({
    name: "network failure",
    result: { data: { user: null }, error: { status: 0 } },
    expectedSignOuts: 0,
    expectedCookie: false,
  });
  await assertAuthCase({
    name: "transport rejection",
    result: { data: { user: null }, error: null },
    throws: new Error("network unavailable"),
    expectedSignOuts: 0,
    expectedCookie: false,
  });
  await assertAuthCase({
    name: "no session",
    result: { data: { user: null }, error: null },
    expectedSignOuts: 0,
    expectedCookie: false,
  });
  await assertAuthCase({
    name: "invalid JWT",
    result: { data: { user: null }, error: { status: 400, code: "invalid_jwt" } },
    expectedSignOuts: 1,
    expectedCookie: true,
  });
  await assertAuthCase({
    name: "Auth access denied",
    result: { data: { user: null }, error: { status: 403, code: "session_revoked" } },
    expectedSignOuts: 1,
    expectedCookie: true,
  });
  await assertAuthCase({
    name: "revoked or expired session",
    result: { data: { user: null }, error: { status: 401, code: "session_not_found" } },
    expectedSignOuts: 1,
    expectedCookie: true,
  });
  await assertAuthCase({
    name: "valid session",
    result: {
      data: { user: { id: "11111111-1111-4111-8111-111111111111", email: "runner@test.local" } },
      error: null,
    },
    expectedSignOuts: 0,
    expectedCookie: false,
    expectedUserId: "11111111-1111-4111-8111-111111111111",
  });
  await assertAuthCase({
    name: "valid session refresh",
    result: {
      data: { user: { id: "11111111-1111-4111-8111-111111111111", email: "runner@test.local" } },
      error: null,
    },
    responseCookie: "sb-test-auth-token=refreshed; Path=/",
    expectedSignOuts: 0,
    expectedCookie: true,
    expectedUserId: "11111111-1111-4111-8111-111111111111",
  });

  console.log("Runner request-auth session validation passed.");
}

async function assertAuthCase(options: {
  name: string;
  result: AuthResult;
  expectedSignOuts: number;
  expectedCookie: boolean;
  expectedUserId?: string;
  throws?: Error;
  responseCookie?: string;
}) {
  const responseHeaders = new Headers();

  if (options.responseCookie) {
    responseHeaders.append("set-cookie", options.responseCookie);
  }

  let signOuts = 0;
  const supabase = {
    auth: {
      getUser: async () => {
        if (options.throws) {
          throw options.throws;
        }

        return options.result;
      },
      signOut: async () => {
        signOuts += 1;
        responseHeaders.append("set-cookie", "sb-test-auth-token=; Max-Age=0; Path=/");
        return { error: null };
      },
    },
  } as unknown as Pick<SupabaseClient<Database>, "auth">;

  const auth = await resolveRequestSupabaseAuth(supabase);
  const response = mergeResponseHeaders(new Response(null, { status: 200 }), responseHeaders);

  assert.equal(signOuts, options.expectedSignOuts, `${options.name}: sign-out count`);
  assert.equal(auth.userId, options.expectedUserId ?? null, `${options.name}: auth user`);
  assert.equal(
    response.headers.has("set-cookie"),
    options.expectedCookie,
    `${options.name}: clearing cookie`,
  );
}

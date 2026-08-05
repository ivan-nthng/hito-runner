import { createClient } from "@supabase/supabase-js";
import {
  DEFAULT_LOCAL_AUTH_ACCOUNTS_FILE,
  readLocalAuthAccountRegistry,
} from "../../src/lib/local-auth-account-registry.server";
import { isLoopbackRuntimeUrl } from "../../src/lib/supabase/env";
import {
  QA_TESTER_POOL,
  acquireQaPoolLease,
  assertQaPoolAuthUser,
  ensureQaPoolAuthUser,
  releaseQaPoolLease,
} from "./qa-test-user-lifecycle.mjs";

type QaPoolRole = keyof typeof QA_TESTER_POOL;

export async function loginToLoopbackRuntime(input: {
  runtimeUrl: string;
  username: string;
  password: string;
  next?: string;
}) {
  if (!isLoopbackRuntimeUrl(input.runtimeUrl)) {
    throw new Error("Runner Activity runtime proofs require a loopback URL.");
  }

  const baseUrl = new URL(input.runtimeUrl);
  const loginBody = new FormData();
  loginBody.set("identifier", input.username);
  loginBody.set("password", input.password);
  loginBody.set("next", input.next ?? "/");
  const login = await fetch(new URL("/api/auth/local-login", baseUrl), {
    method: "POST",
    body: loginBody,
    redirect: "manual",
  });
  if (login.status !== 302) {
    throw new Error(`Local runtime login returned HTTP ${login.status}.`);
  }
  const setCookie = login.headers.get("set-cookie");
  if (!setCookie) {
    throw new Error("Local runtime login did not return a session cookie.");
  }

  return { baseUrl, cookie: setCookie.split(";", 1)[0] };
}

export async function loginQaPoolToLoopbackRuntime(input: {
  runtimeUrl: string;
  role: QaPoolRole;
  next?: string;
}) {
  const accountsFile =
    process.env.LOCAL_AUTH_BYPASS_ACCOUNTS_FILE ?? DEFAULT_LOCAL_AUTH_ACCOUNTS_FILE;
  const accounts = await readLocalAuthAccountRegistry(accountsFile);
  const account = accounts.find(
    (candidate) => candidate.username === QA_TESTER_POOL[input.role].username,
  );
  if (!account) {
    throw new Error(`The named ${input.role} account must exist in the local auth registry.`);
  }

  return loginToLoopbackRuntime({
    runtimeUrl: input.runtimeUrl,
    username: account.username,
    password: account.password,
    next: input.next,
  });
}

export async function withRunnerActivityProofLeases<T>(
  roles: readonly QaPoolRole[],
  run: () => Promise<T>,
) {
  const leases: Array<Awaited<ReturnType<typeof acquireQaPoolLease>>> = [];
  try {
    for (const role of roles) leases.push(await acquireQaPoolLease({ role }));
    return await run();
  } finally {
    for (const lease of leases.reverse()) await releaseQaPoolLease(lease);
  }
}

export function createRunnerActivityProofRuntime(passwordPrefix: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !publishableKey || !secretKey) {
    throw new Error("Runner Activity proofs require the canonical Supabase URL and keys.");
  }
  if (!isLoopbackRuntimeUrl(supabaseUrl)) {
    throw new Error("Runner Activity proofs require a loopback Supabase target.");
  }

  const auth = { autoRefreshToken: false, persistSession: false };
  const supabase = createClient(supabaseUrl, secretKey, { auth });
  return {
    supabaseUrl,
    supabase,
    ensureUser: async (role: QaPoolRole) => {
      const user = await ensureQaPoolAuthUser({
        supabase,
        role,
        password: `${passwordPrefix}-${role}-local-password`,
      });
      await assertQaPoolAuthUser({ supabase, role, userId: user.id });
      return user;
    },
    signedInClient: async (role: QaPoolRole) => {
      const client = createClient(supabaseUrl, publishableKey, { auth });
      const signIn = await client.auth.signInWithPassword({
        email: QA_TESTER_POOL[role].email,
        password: `${passwordPrefix}-${role}-local-password`,
      });
      if (signIn.error) throw new Error(signIn.error.message);
      return client;
    },
  };
}

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { tsImport } from "tsx/esm/api";

const { buildImportedPlanSeed } = await tsImport("../src/lib/imported-plan.ts", import.meta.url);
const { applyImportedSeedAsActivePlanForOps } = await tsImport(
  "./lib/ops-plan-apply.ts",
  import.meta.url,
);

const DEFAULT_ACCOUNTS_FILE = ".tanstack/hito-running-local-accounts.json";
const LOCAL_MUTATION_FLAG = "--allow-local-supabase-mutation";
const LOOPBACK_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
const USAGE = `Usage:
  npm run import:current-plan
  npm run import:current-plan -- --dry-run --plan-file ./path/to/training-plan-v2.json
  node --env-file=.env.local ./scripts/import-current-plan.mjs --apply --plan-file ./path/to/training-plan-v2.json ${LOCAL_MUTATION_FLAG}

Safe defaults:
  - No arguments prints this help and does not mutate.
  - --dry-run validates the plan seed and local-bypass account without creating a Supabase client.
  - --apply is blocked unless ${LOCAL_MUTATION_FLAG} is present and NEXT_PUBLIC_SUPABASE_URL is loopback.

This helper is local ops tooling for canonical training-plan-v2 imports. It must not be used as a
remote or production import path.`;

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        mutation: false,
        reason: "import_current_plan_failed",
        message: getErrorMessage(error),
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
});

async function main() {
  const options = parseCliArgs(process.argv.slice(2));

  if (options.help || options.shouldPrintDefaultHelp) {
    console.log(USAGE);
    return;
  }

  if (!options.planPath) {
    throw new Error("Missing plan file. Pass --plan-file <path> or a positional plan JSON path.");
  }

  const plan = JSON.parse(await readFile(options.planPath, "utf8"));
  const importedSeed = buildImportedPlanSeed(plan);
  const localAccount = await loadCanonicalLocalBypassAccount();

  if (options.mode === "dry_run") {
    console.log(
      JSON.stringify(
        {
          ok: true,
          mode: "dry_run",
          mutation: false,
          planPath: options.planPath,
          localUserId: localAccount.userId,
          localUserEmail: localAccount.email,
          title: importedSeed.title,
          sourceKind: importedSeed.sourceKind,
          schemaVersion: importedSeed.schemaVersion,
          startDate: importedSeed.startDate,
          endDate: importedSeed.endDate,
          targetDate: importedSeed.targetDate,
          workoutCount: importedSeed.workouts.length,
          supabaseTarget: describeSupabaseTarget(readEnv("NEXT_PUBLIC_SUPABASE_URL")),
        },
        null,
        2,
      ),
    );
    return;
  }

  const supabaseUrl = readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseServerKey = readEnv("SUPABASE_SECRET_KEY");

  if (!supabaseUrl || !supabaseServerKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY for apply mode.");
  }

  assertApplySafety({
    supabaseUrl,
    allowLocalSupabaseMutation: options.allowLocalSupabaseMutation,
  });

  const supabase = createClient(supabaseUrl, supabaseServerKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const supabaseUserId = await ensureLocalBypassSupabaseUser({
    supabase,
    email: localAccount.email,
    displayName: localAccount.displayName,
    role: localAccount.role,
    userId: localAccount.userId,
    username: localAccount.username,
  });

  const appliedPlan = await applyImportedSeedAsActivePlanForOps({
    supabase,
    userId: supabaseUserId,
    importedSeed,
    planSelect: "id, title, start_date, end_date",
    workoutSelect: "id",
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: "apply",
        mutation: true,
        planPath: options.planPath,
        localUserId: localAccount.userId,
        supabaseUserId,
        activePlanId: appliedPlan.planCycle.id,
        workoutCount: appliedPlan.workoutCount,
        title: appliedPlan.planCycle.title,
        startDate: appliedPlan.planCycle.start_date,
        endDate: appliedPlan.planCycle.end_date,
        supabaseTarget: describeSupabaseTarget(supabaseUrl),
      },
      null,
      2,
    ),
  );
}

function parseCliArgs(args) {
  if (args.length === 0) {
    return {
      help: false,
      shouldPrintDefaultHelp: true,
      mode: "dry_run",
      planPath: null,
      allowLocalSupabaseMutation: false,
    };
  }

  const options = {
    help: false,
    shouldPrintDefaultHelp: false,
    mode: "dry_run",
    planPath: null,
    allowLocalSupabaseMutation: false,
  };

  let modeWasSet = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg === "--dry-run" || arg === "--preflight") {
      if (modeWasSet && options.mode !== "dry_run") {
        throw new Error("Use only one of --dry-run or --apply.");
      }
      options.mode = "dry_run";
      modeWasSet = true;
      continue;
    }

    if (arg === "--apply") {
      if (modeWasSet && options.mode !== "apply") {
        throw new Error("Use only one of --dry-run or --apply.");
      }
      options.mode = "apply";
      modeWasSet = true;
      continue;
    }

    if (arg === LOCAL_MUTATION_FLAG) {
      options.allowLocalSupabaseMutation = true;
      continue;
    }

    if (arg === "--plan-file") {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("Missing value for --plan-file.");
      }
      options.planPath = value;
      index += 1;
      continue;
    }

    if (arg.startsWith("--plan-file=")) {
      const value = arg.slice("--plan-file=".length).trim();
      if (!value) {
        throw new Error("Missing value for --plan-file.");
      }
      options.planPath = value;
      continue;
    }

    if (arg.startsWith("--")) {
      throw new Error(`Unknown option: ${arg}`);
    }

    if (options.planPath) {
      throw new Error("Only one plan file may be provided.");
    }
    options.planPath = arg;
  }

  return options;
}

function assertApplySafety({ supabaseUrl, allowLocalSupabaseMutation }) {
  const target = parseSupabaseTarget(supabaseUrl);

  if (!target) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not a valid URL; refusing to apply import.");
  }

  if (!allowLocalSupabaseMutation) {
    throw new Error(
      `Refusing to mutate ${target.url}. Pass ${LOCAL_MUTATION_FLAG} with --apply after confirming this is a disposable local Supabase target.`,
    );
  }

  if (!target.isLoopback) {
    throw new Error(
      `Refusing to mutate non-local Supabase target ${target.url}. This ops helper only supports loopback Supabase apply mode.`,
    );
  }
}

async function loadCanonicalLocalBypassAccount() {
  const accountsFilePath = readEnv("LOCAL_AUTH_BYPASS_ACCOUNTS_FILE") ?? DEFAULT_ACCOUNTS_FILE;
  const fileContents = await readFile(accountsFilePath, "utf8");
  const parsed = JSON.parse(fileContents);
  const rawAccounts = Array.isArray(parsed) ? parsed : (parsed.accounts ?? []);

  if (!Array.isArray(rawAccounts) || rawAccounts.length === 0) {
    throw new Error(
      `No local bypass accounts found in ${accountsFilePath}. Create one with npm run test-user or update LOCAL_AUTH_BYPASS_ACCOUNTS_FILE.`,
    );
  }

  const normalizedAccounts = rawAccounts.map(normalizeLocalAccount);
  return normalizedAccounts.find((account) => account.role === "admin") ?? normalizedAccounts[0];
}

async function ensureLocalBypassSupabaseUser({ supabase, ...config }) {
  const existingUser = await findAuthUserByEmail(supabase, config.email);
  const authUser =
    existingUser ??
    (await supabase.auth.admin
      .createUser({
        email: config.email,
        email_confirm: true,
        user_metadata: {
          display_name: config.displayName,
          local_username: config.username,
        },
        app_metadata: {
          hito_local_bypass: true,
          hito_local_role: config.role,
        },
      })
      .then(({ data, error }) => {
        if (error) {
          throw new Error(error.message);
        }

        if (!data.user) {
          throw new Error("Supabase did not return a user for the local bypass account.");
        }

        return data.user;
      }));

  return authUser.id;
}

async function findAuthUserByEmail(supabase, email) {
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });

    if (error) {
      throw new Error(error.message);
    }

    const matchedUser =
      data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) ?? null;

    if (matchedUser) {
      return matchedUser;
    }

    if (data.users.length < perPage) {
      return null;
    }

    page += 1;
  }
}

function describeSupabaseTarget(url) {
  const target = parseSupabaseTarget(url);
  if (!target) {
    return {
      configured: false,
      url: null,
      isLoopback: false,
    };
  }

  return {
    configured: true,
    url: target.url,
    hostname: target.hostname,
    projectRef: target.projectRef,
    isLoopback: target.isLoopback,
  };
}

function parseSupabaseTarget(url) {
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    const projectRef = hostname.endsWith(".supabase.co")
      ? hostname.split(".supabase.co")[0] || null
      : null;

    return {
      url: parsed.origin,
      hostname,
      projectRef,
      isLoopback: LOOPBACK_HOSTNAMES.has(hostname),
    };
  } catch {
    return null;
  }
}

function readEnv(name) {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeLocalAccount(account) {
  const username = String(account.username ?? "")
    .trim()
    .toLowerCase();

  if (!username) {
    throw new Error("Local bypass accounts file must include username for each account.");
  }

  return {
    username,
    email: String(account.email ?? `${username}@local.test`)
      .trim()
      .toLowerCase(),
    userId: String(account.userId ?? deriveUserId(username)).trim(),
    role: account.role === "admin" ? "admin" : "tester",
    displayName: String(account.displayName ?? humanizeUsername(username)).trim(),
  };
}

function deriveUserId(username) {
  const hash = createHash("sha256").update(username).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(
    17,
    20,
  )}-${hash.slice(20, 32)}`;
}

function humanizeUsername(username) {
  return username.charAt(0).toUpperCase() + username.slice(1);
}

function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

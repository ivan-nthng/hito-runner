import "@tanstack/react-start/server-only";

import { createHash } from "node:crypto";
import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

export const DEFAULT_LOCAL_AUTH_ACCOUNTS_FILE = ".tanstack/hito-running-local-accounts.json";

const localAuthAccountSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
  email: z.string().trim().email().optional(),
  userId: z.string().uuid().optional(),
  role: z.enum(["admin", "tester"]).optional(),
  displayName: z.string().trim().min(1).optional(),
});

const localAuthAccountsFileSchema = z.union([
  z.array(localAuthAccountSchema),
  z.object({ accounts: z.array(localAuthAccountSchema) }),
]);

export interface LocalAuthAccountConfig {
  username: string;
  password: string;
  email: string;
  userId: string;
  role: "admin" | "tester";
  displayName: string;
}

export interface NormalizedLocalAuthAccount extends LocalAuthAccountConfig {
  userIdSource: "provided" | "derived";
}

export async function readLocalAuthAccountRegistry(
  filePath: string,
  options: { allowMissing?: boolean } = {},
): Promise<NormalizedLocalAuthAccount[]> {
  try {
    const fileContents = await readFile(filePath, "utf8");
    const parsed = localAuthAccountsFileSchema.parse(JSON.parse(fileContents));
    const rawAccounts = Array.isArray(parsed) ? parsed : parsed.accounts;
    return rawAccounts.map(normalizeParsedAccount);
  } catch (error) {
    if (options.allowMissing && isNodeError(error) && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export async function writeLocalAuthAccountRegistry(
  filePath: string,
  accounts: LocalAuthAccountConfig[],
) {
  const persistedAccounts = accounts.map(
    ({ username, password, email, userId, role, displayName }) =>
      localAuthAccountSchema.parse({ username, password, email, userId, role, displayName }),
  );

  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify({ accounts: persistedAccounts }, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  await chmod(filePath, 0o600);
}

export function normalizeLocalAuthAccount(value: unknown): NormalizedLocalAuthAccount {
  return normalizeParsedAccount(localAuthAccountSchema.parse(value));
}

function normalizeParsedAccount(
  account: z.infer<typeof localAuthAccountSchema>,
): NormalizedLocalAuthAccount {
  const username = account.username.trim().toLowerCase();
  const hasProvidedUserId = Boolean(account.userId);

  return {
    username,
    password: account.password,
    email: (account.email ?? `${username}@local.test`).trim().toLowerCase(),
    userId: account.userId ?? deriveUserId(username),
    userIdSource: hasProvidedUserId ? "provided" : "derived",
    role: account.role ?? (username === "ivan" ? "admin" : "tester"),
    displayName: account.displayName?.trim() ?? humanizeUsername(username),
  };
}

function deriveUserId(username: string) {
  const hash = createHash("sha256").update(username).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(
    17,
    20,
  )}-${hash.slice(20, 32)}`;
}

function humanizeUsername(username: string) {
  return username.charAt(0).toUpperCase() + username.slice(1);
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return Boolean(error && typeof error === "object" && "code" in error);
}

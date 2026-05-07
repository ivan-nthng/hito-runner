import type { User } from "@supabase/supabase-js";
import type { LocalAuthAccountConfig } from "@/lib/local-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

const USERS_PAGE_SIZE = 200;

export async function ensureLocalAuthSupabaseUserId(config: LocalAuthAccountConfig) {
  const existingUser = await findAuthUserByEmail(config.email);
  const authUser =
    existingUser ??
    (await createLocalBypassAuthUser(config).then((createdUser) => {
      if (!createdUser) {
        throw new Error("Supabase could not provision an auth user for the local account.");
      }

      return createdUser;
    }));

  return authUser.id;
}

async function createLocalBypassAuthUser(config: LocalAuthAccountConfig) {
  const supabase = createAdminSupabaseClient();
  const created = await supabase.auth.admin.createUser({
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
  });

  if (created.error) {
    throw new Error(created.error.message);
  }

  return created.data.user ?? null;
}

async function findAuthUserByEmail(email: string): Promise<User | null> {
  const supabase = createAdminSupabaseClient();
  let page = 1;

  while (true) {
    const result = await supabase.auth.admin.listUsers({
      page,
      perPage: USERS_PAGE_SIZE,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    const matchedUser =
      result.data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) ?? null;

    if (matchedUser) {
      return matchedUser;
    }

    if (result.data.users.length < USERS_PAGE_SIZE) {
      return null;
    }

    page += 1;
  }
}

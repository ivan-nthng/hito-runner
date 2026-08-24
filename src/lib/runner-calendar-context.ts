import "@tanstack/react-start/server-only";

import { buildRunnerCalendarContext } from "@/lib/runner-calendar-timezone";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export async function getRunnerCalendarContextForUserId(userId: string, instant?: Date) {
  const calendarInstant = instant ?? (await getPreviewQaCalendarInstantForUserId(userId));
  const profileResult = await createAdminSupabaseClient()
    .from("runner_profiles")
    .select("calendar_timezone, calendar_timezone_source")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileResult.error) {
    throw new Error(profileResult.error.message);
  }

  return buildRunnerCalendarContext({
    calendarTimezone: profileResult.data?.calendar_timezone,
    calendarTimezoneSource: profileResult.data?.calendar_timezone_source,
    instant: calendarInstant,
  });
}

export async function getRunnerCalendarDateForUserId(userId: string, instant?: Date) {
  return (await getRunnerCalendarContextForUserId(userId, instant)).currentDate;
}

async function getPreviewQaCalendarInstantForUserId(userId: string) {
  if (process.env.VERCEL_ENV !== "preview") {
    return undefined;
  }

  const userResult = await createAdminSupabaseClient().auth.admin.getUserById(userId);
  if (userResult.error || !userResult.data.user) {
    throw new Error(userResult.error?.message ?? "The runner identity was not found.");
  }

  const appMetadata = userResult.data.user.app_metadata;
  const calendarDate = appMetadata?.hito_qa_calendar_date;
  if (
    appMetadata?.hito_test_user !== true ||
    appMetadata?.hito_qa_pool_role !== "adaptive-training-quality" ||
    typeof calendarDate !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(calendarDate)
  ) {
    return undefined;
  }

  const instant = new Date(`${calendarDate}T12:00:00.000Z`);
  if (Number.isNaN(instant.getTime()) || instant.toISOString().slice(0, 10) !== calendarDate) {
    throw new Error("The preview QA Calendar date is invalid.");
  }
  return instant;
}

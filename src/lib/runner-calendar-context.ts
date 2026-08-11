import "@tanstack/react-start/server-only";

import { buildRunnerCalendarContext } from "@/lib/runner-calendar-timezone";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export async function getRunnerCalendarContextForUserId(userId: string, instant?: Date) {
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
    instant,
  });
}

export async function getRunnerCalendarDateForUserId(userId: string, instant?: Date) {
  return (await getRunnerCalendarContextForUserId(userId, instant)).currentDate;
}

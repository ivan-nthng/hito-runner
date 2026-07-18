import type { Json } from "@/lib/supabase/database";

export interface AdditionalPlanPersistenceMetadata {
  goalMetadata?: Json | null;
  planPreferences?: Json | null;
}

export function mergePlanPersistenceMetadata(
  base: Json | null,
  additional: Json | null | undefined,
) {
  const baseRecord = asJsonRecord(base);
  const additionalRecord = asJsonRecord(additional);

  if (!baseRecord && !additionalRecord) {
    return null;
  }

  return toJson({
    ...(baseRecord ?? {}),
    ...(additionalRecord ?? {}),
  });
}

function asJsonRecord(value: Json | null | undefined): Record<string, Json | undefined> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, Json | undefined>)
    : null;
}

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

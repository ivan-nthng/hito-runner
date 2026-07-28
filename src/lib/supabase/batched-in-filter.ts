/**
 * Keeps PostgREST `in` filters comfortably below request-URI limits while preserving
 * the caller's existing query and authorization boundary.
 */
export const POSTGREST_IN_FILTER_BATCH_SIZE = 40;

type BatchedQueryResult<T> = {
  data: readonly T[] | null;
  error: { message: string } | null;
};

export function splitIdsForPostgrestInFilter(ids: readonly string[]): string[][] {
  const uniqueIds = Array.from(
    new Set(ids.filter((id): id is string => typeof id === "string" && id.length > 0)),
  );
  const batches: string[][] = [];

  for (let index = 0; index < uniqueIds.length; index += POSTGREST_IN_FILTER_BATCH_SIZE) {
    batches.push(uniqueIds.slice(index, index + POSTGREST_IN_FILTER_BATCH_SIZE));
  }

  return batches;
}

export async function collectRowsForIdBatches<T>(
  ids: readonly string[],
  query: (batch: string[]) => Promise<BatchedQueryResult<T>>,
): Promise<T[]> {
  const rows: T[] = [];

  for (const batch of splitIdsForPostgrestInFilter(ids)) {
    const result = await query(batch);

    if (result.error) {
      throw new Error(result.error.message);
    }

    rows.push(...(result.data ?? []));
  }

  return rows;
}

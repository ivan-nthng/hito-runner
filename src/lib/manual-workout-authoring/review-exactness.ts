import { stableJsonStringify } from "@/lib/review-token-signing";

const MANUAL_WORKOUT_CHECKSUM_SEEDS = [
  0x811c9dc5, 0x9e3779b9, 0x85ebca6b, 0xc2b2ae35, 0x27d4eb2f, 0x165667b1, 0xd3a2646c, 0xfd7046c5,
] as const;

export function stableManualWorkoutChecksum64Hex(value: unknown) {
  const payload = stableJsonStringify(value);

  return MANUAL_WORKOUT_CHECKSUM_SEEDS.map((seed) => fnv1a32Hex(payload, seed)).join("");
}

function fnv1a32Hex(payload: string, seed: number) {
  let hash = seed >>> 0;

  for (let index = 0; index < payload.length; index += 1) {
    hash ^= payload.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

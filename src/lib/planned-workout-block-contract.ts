export const PLANNED_WORKOUT_REPEAT_CHILD_ROLE_VALUES = [
  "warm_up",
  "run",
  "walk",
  "work",
  "recover",
  "finish",
  "cooldown",
] as const;

export type PlannedWorkoutRepeatChildRole =
  (typeof PLANNED_WORKOUT_REPEAT_CHILD_ROLE_VALUES)[number];

export interface PlannedWorkoutUnitPrescription {
  mode: "time" | "distance" | "none";
  duration_min?: number;
  distance_km?: number;
}

export interface PlannedWorkoutRepeatChildPrescription<TTarget = Record<string, unknown>> {
  role: PlannedWorkoutRepeatChildRole;
  label?: string;
  sequence?: number;
  guidance?: string;
  prescription: PlannedWorkoutUnitPrescription;
  target?: TTarget;
}

export interface PlannedWorkoutRepeatChildrenReduction<TTarget = Record<string, unknown>> {
  children: PlannedWorkoutRepeatChildPrescription<TTarget>[];
  source: "children" | "none";
}

const repeatChildRoleValues = new Set<string>(PLANNED_WORKOUT_REPEAT_CHILD_ROLE_VALUES);

export function reduceRepeatChildrenToChildFirst<TTarget = Record<string, unknown>>(input: {
  children?: readonly unknown[] | null;
  normalizeTarget?: (target: unknown) => TTarget | undefined;
}): PlannedWorkoutRepeatChildrenReduction<TTarget> {
  const normalizeTarget = input.normalizeTarget ?? defaultNormalizeTarget<TTarget>;
  const directChildren = (input.children ?? [])
    .map((child, index) => normalizeRepeatChild(child, index, normalizeTarget))
    .filter((child): child is PlannedWorkoutRepeatChildPrescription<TTarget> => child != null);

  if (directChildren.length > 0) {
    return {
      children: directChildren,
      source: "children",
    };
  }

  return {
    children: [],
    source: "none",
  };
}

export function plannedWorkoutRepeatChildLabel(role: PlannedWorkoutRepeatChildRole) {
  switch (role) {
    case "warm_up":
      return "Warm-up";
    case "run":
      return "Run";
    case "walk":
      return "Walk";
    case "work":
      return "Work";
    case "recover":
      return "Recover";
    case "finish":
      return "Finish";
    case "cooldown":
      return "Cooldown";
  }
}

export function repeatChildPrescriptionHasExecutableStructure(prescription: unknown): boolean {
  const normalized = normalizeUnitPrescription(prescription);

  if (!normalized) {
    return false;
  }

  if (normalized.mode === "time") {
    return isPositiveNumber(normalized.duration_min);
  }

  if (normalized.mode === "distance") {
    return isPositiveNumber(normalized.distance_km);
  }

  return false;
}

export function repeatChildrenHaveExecutableStructure(children: readonly unknown[]) {
  const reduced = reduceRepeatChildrenToChildFirst({ children });

  return (
    reduced.children.length > 0 &&
    reduced.children.every((child) =>
      repeatChildPrescriptionHasExecutableStructure(child.prescription),
    )
  );
}

export function repeatPrescriptionHasExecutableStructure(input: {
  repeatCount?: unknown;
  children?: readonly unknown[] | null;
}) {
  if (!isPositiveNumber(input.repeatCount)) {
    return false;
  }

  const reduced = reduceRepeatChildrenToChildFirst({
    children: input.children,
  });

  return (
    reduced.children.length > 0 &&
    reduced.children.every((child) =>
      repeatChildPrescriptionHasExecutableStructure(child.prescription),
    )
  );
}

function normalizeRepeatChild<TTarget>(
  child: unknown,
  index: number,
  normalizeTarget: (target: unknown) => TTarget | undefined,
): PlannedWorkoutRepeatChildPrescription<TTarget> | null {
  const record = recordValue(child);
  if (!record) {
    return null;
  }

  const prescription = normalizeUnitPrescription(record.prescription);
  if (!prescription) {
    return null;
  }

  const role = normalizeRepeatChildRole(record.role);
  const target = normalizeTarget(record.target);

  return {
    role,
    ...(readString(record.label) ? { label: readString(record.label) } : {}),
    sequence: readPositiveInteger(record.sequence) ?? index + 1,
    ...(readString(record.guidance) ? { guidance: readString(record.guidance) } : {}),
    prescription,
    ...(target ? { target } : {}),
  };
}

function normalizeRepeatChildRole(value: unknown): PlannedWorkoutRepeatChildRole {
  const token = readString(value);

  if (token && repeatChildRoleValues.has(token)) {
    return token as PlannedWorkoutRepeatChildRole;
  }

  if (token === "warmup") {
    return "warm_up";
  }

  if (token === "recovery") {
    return "recover";
  }

  if (token === "cool_down") {
    return "cooldown";
  }

  return "run";
}

function normalizeUnitPrescription(value: unknown): PlannedWorkoutUnitPrescription | null {
  const record = recordValue(value);
  const mode = readString(record?.mode);

  if (mode === "time") {
    return {
      mode,
      ...(isPositiveNumber(record?.duration_min) ? { duration_min: record.duration_min } : {}),
    };
  }

  if (mode === "distance") {
    return {
      mode,
      ...(isPositiveNumber(record?.distance_km) ? { distance_km: record.distance_km } : {}),
    };
  }

  if (mode === "none") {
    return { mode };
  }

  return null;
}

function defaultNormalizeTarget<TTarget>(target: unknown): TTarget | undefined {
  const record = recordValue(target);

  return record ? ({ ...record } as TTarget) : undefined;
}

function recordValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readPositiveInteger(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null;
}

function isPositiveNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

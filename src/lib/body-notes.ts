export const BODY_NOTE_AREAS = [
  "Neck",
  "L. Shoulder",
  "R. Shoulder",
  "Lower back",
  "L. Hip",
  "R. Hip",
  "L. Quad",
  "R. Quad",
  "L. Knee",
  "R. Knee",
  "L. Calf",
  "R. Calf",
  "L. Ankle",
  "R. Ankle",
  "L. Foot",
  "R. Foot",
] as const;

export const BODY_NOTE_SENSATIONS = ["Sore", "Tight", "Sharp", "Dull", "Swollen", "Stiff"] as const;

export const BODY_NOTE_TIMINGS = ["during", "after"] as const;

export type BodyNoteArea = (typeof BODY_NOTE_AREAS)[number];
export type BodyNoteSensation = (typeof BODY_NOTE_SENSATIONS)[number];
export type BodyNoteTiming = (typeof BODY_NOTE_TIMINGS)[number];
export type BodyNoteMapSide = "front" | "back";

export type BodyNoteAreaRegion = {
  area: BodyNoteArea;
  side: BodyNoteMapSide;
  x: number;
  y: number;
};

export const BODY_NOTE_AREA_REGIONS: BodyNoteAreaRegion[] = [
  { area: "Neck", side: "front", x: 100, y: 50 },
  { area: "L. Shoulder", side: "front", x: 70, y: 75 },
  { area: "R. Shoulder", side: "front", x: 130, y: 75 },
  { area: "Lower back", side: "back", x: 100, y: 175 },
  { area: "L. Hip", side: "front", x: 82, y: 200 },
  { area: "R. Hip", side: "front", x: 118, y: 200 },
  { area: "L. Quad", side: "front", x: 82, y: 250 },
  { area: "R. Quad", side: "front", x: 118, y: 250 },
  { area: "L. Knee", side: "front", x: 82, y: 305 },
  { area: "R. Knee", side: "front", x: 118, y: 305 },
  { area: "L. Calf", side: "back", x: 82, y: 360 },
  { area: "R. Calf", side: "back", x: 118, y: 360 },
  { area: "L. Ankle", side: "front", x: 82, y: 415 },
  { area: "R. Ankle", side: "front", x: 118, y: 415 },
  { area: "L. Foot", side: "front", x: 82, y: 450 },
  { area: "R. Foot", side: "front", x: 118, y: 450 },
];

export interface BodyNote {
  area: BodyNoteArea;
  severity: 1 | 2 | 3 | 4 | 5;
  timing: BodyNoteTiming;
  sensation: BodyNoteSensation | null;
  note: string | null;
}

export function isBodyNoteArea(value: string): value is BodyNoteArea {
  return BODY_NOTE_AREAS.includes(value as BodyNoteArea);
}

export function isBodyNoteSensation(value: string): value is BodyNoteSensation {
  return BODY_NOTE_SENSATIONS.includes(value as BodyNoteSensation);
}

export function isBodyNoteTiming(value: string): value is BodyNoteTiming {
  return BODY_NOTE_TIMINGS.includes(value as BodyNoteTiming);
}

export function getBodyNoteAreaRegion(area: BodyNoteArea) {
  return BODY_NOTE_AREA_REGIONS.find((region) => region.area === area) ?? null;
}

export function parseBodyNotesValue(value: unknown): BodyNote[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (
      !entry ||
      typeof entry !== "object" ||
      !("area" in entry) ||
      !("severity" in entry) ||
      !("timing" in entry)
    ) {
      return [];
    }

    const area = typeof entry.area === "string" ? entry.area : null;
    const severity = typeof entry.severity === "number" ? entry.severity : null;
    const timing = typeof entry.timing === "string" ? entry.timing : null;
    const sensation = typeof entry.sensation === "string" ? entry.sensation : null;
    const note = typeof entry.note === "string" ? entry.note.trim() : null;

    if (
      !area ||
      !isBodyNoteArea(area) ||
      !severity ||
      severity < 1 ||
      severity > 5 ||
      !timing ||
      !isBodyNoteTiming(timing)
    ) {
      return [];
    }

    return [
      {
        area,
        severity: severity as BodyNote["severity"],
        timing,
        sensation: sensation && isBodyNoteSensation(sensation) ? sensation : null,
        note: note || null,
      },
    ];
  });
}

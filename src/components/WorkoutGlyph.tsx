import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import type { WorkoutType } from "@/lib/training";
import { workoutTypeToGlyphKind, type WorkoutGlyphKind } from "@/lib/workout-glyph";

/* Tiny abstract glyphs per workout type — calmer than icon library. */
export function WorkoutGlyph({
  kind,
  type,
  className,
  style,
}: {
  kind?: WorkoutGlyphKind;
  type?: WorkoutType;
  className?: string;
  style?: CSSProperties;
}) {
  const resolvedKind = kind ?? (type ? workoutTypeToGlyphKind(type) : "easy");
  const cls = cn("h-3 w-3", className);
  const sharedProps = {
    className: cls,
    style,
    "data-glyph": resolvedKind,
    viewBox: "0 0 12 12",
    fill: "none",
    "aria-hidden": true,
    focusable: false,
  } as const;

  switch (resolvedKind) {
    case "easy":
      return (
        <svg {...sharedProps}>
          <circle cx="6" cy="6" r="3.8" stroke="currentColor" strokeWidth="1.25" />
        </svg>
      );
    case "recovery":
      return (
        <svg {...sharedProps}>
          <path
            d="M2.4 6.8c.8 1.6 2 2.4 3.6 2.4s2.8-.8 3.6-2.4"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.35"
          />
        </svg>
      );
    case "long":
      return (
        <svg {...sharedProps}>
          <path d="M1.8 6h7.7" stroke="currentColor" strokeLinecap="round" strokeWidth="1.35" />
          <path
            d="m7.6 3.9 2.5 2.1-2.5 2.1"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.35"
          />
        </svg>
      );
    case "tempo":
      return (
        <svg {...sharedProps}>
          <path d="M6 9.6V2.4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.35" />
          <path
            d="m3.8 4.7 2.2-2.3 2.2 2.3"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.35"
          />
        </svg>
      );
    case "intervals":
      return (
        <svg {...sharedProps}>
          <path d="M3 3.1v5.8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.35" />
          <path d="M6 2.2v7.6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.35" />
          <path d="M9 3.1v5.8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.35" />
        </svg>
      );
    case "progression":
      return (
        <svg {...sharedProps}>
          <path
            d="M2.3 8.8h2V6.7h2V4.6h2V2.6h1.4"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.25"
          />
        </svg>
      );
    case "race":
      return (
        <svg {...sharedProps}>
          <circle cx="6" cy="4.7" r="2.3" stroke="currentColor" strokeWidth="1.2" />
          <path
            d="m4.9 6.7-.9 2.8 2-.9 2 .9-.9-2.8"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.2"
          />
        </svg>
      );
    case "quality":
      return (
        <svg {...sharedProps}>
          <path
            d="M6 1.9 10.1 6 6 10.1 1.9 6 6 1.9Z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.15"
          />
          <circle cx="6" cy="6" r="1" fill="currentColor" />
        </svg>
      );
    case "rest":
      return (
        <svg {...sharedProps}>
          <path d="M3 6h6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.35" />
        </svg>
      );
  }
}

export const HITO_BUTTON_VARIANTS = ["primary", "secondary", "outlined", "ghost"] as const;
export const HITO_BUTTON_TONES = ["default", "success", "error"] as const;
export const HITO_BUTTON_SIZES = ["xs", "sm", "md", "lg"] as const;
export const HITO_BUTTON_STATES = [
  "default",
  "loading",
  "success",
  "error",
  "pressed",
  "disabled",
  "timed-progress",
] as const;

export const HITO_BUTTON_TONES_BY_VARIANT = {
  primary: HITO_BUTTON_TONES,
  secondary: HITO_BUTTON_TONES,
  outlined: HITO_BUTTON_TONES,
  ghost: HITO_BUTTON_TONES,
} as const satisfies Record<(typeof HITO_BUTTON_VARIANTS)[number], readonly HitoButtonTone[]>;

export const HITO_FIELD_VARIANTS = ["primary", "secondary"] as const;
export const HITO_FIELD_SIZES = ["xs", "sm", "md", "lg"] as const;
export const HITO_FIELD_FEEDBACK = ["neutral", "error", "success"] as const;
export const HITO_TEXTAREA_SIZES = ["md"] as const;

export const HITO_CHOICE_TOGGLE_SIZES = ["xs", "sm", "lg"] as const;
export const HITO_CHOICE_TOGGLE_PRESENTATIONS = ["inline", "card"] as const;

export type HitoButtonVariant = (typeof HITO_BUTTON_VARIANTS)[number];
export type HitoButtonTone = (typeof HITO_BUTTON_TONES)[number];
export type HitoButtonSize = (typeof HITO_BUTTON_SIZES)[number];
export type HitoButtonState = (typeof HITO_BUTTON_STATES)[number];
export type HitoFieldVariant = (typeof HITO_FIELD_VARIANTS)[number];
export type HitoFieldSize = (typeof HITO_FIELD_SIZES)[number];
export type HitoFieldFeedback = (typeof HITO_FIELD_FEEDBACK)[number];
export type HitoTextareaSize = (typeof HITO_TEXTAREA_SIZES)[number];
export type HitoChoiceToggleSize = (typeof HITO_CHOICE_TOGGLE_SIZES)[number];
export type HitoChoiceTogglePresentation = (typeof HITO_CHOICE_TOGGLE_PRESENTATIONS)[number];

type ClassValue = false | null | string | undefined;

function joinClasses(values: ClassValue[]) {
  return values.filter(Boolean).join(" ");
}

/** @internal Shared primitives own component-class composition. */
export function hitoButtonClasses({
  className,
  iconOnly = false,
  size,
  variant,
}: {
  className?: string;
  iconOnly?: boolean;
  size: HitoButtonSize;
  variant: HitoButtonVariant;
}) {
  return joinClasses([
    "hito-button",
    `hito-button-${variant}`,
    `hito-button-${size}`,
    iconOnly && "hito-button-icon",
    className,
  ]);
}

/** @internal Shared primitives own component-class composition. */
export function hitoFieldClasses({
  className,
  feedback = "neutral",
  size = "sm",
  variant = "primary",
}: {
  className?: string;
  feedback?: HitoFieldFeedback;
  size?: HitoFieldSize;
  variant?: HitoFieldVariant;
} = {}) {
  return joinClasses([
    "hito-field",
    `hito-field-${variant}`,
    `hito-field-${size}`,
    feedback !== "neutral" && `hito-field-feedback-${feedback}`,
    className,
  ]);
}

/** @internal Shared primitives own component-class composition. */
export function hitoChoiceToggleClasses({
  className,
  presentation = "inline",
  size = "sm",
}: {
  className?: string;
  presentation?: HitoChoiceTogglePresentation;
  size?: HitoChoiceToggleSize;
} = {}) {
  return joinClasses([
    "hito-choice-toggle",
    presentation === "card" ? "hito-choice-toggle-card" : `hito-choice-toggle-${size}`,
    className,
  ]);
}

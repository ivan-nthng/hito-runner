export type HitoTypographyGroupId =
  | "ui-title"
  | "display"
  | "reading"
  | "control-label"
  | "technical"
  | "component-bound";

export type HitoTypographyRole = {
  className: string;
  description: string;
  figmaTextStyle: boolean;
  group: HitoTypographyGroupId;
  id: string;
  inspectorSelectable?: boolean;
  label: string;
  sample: string;
  spec: string;
  use: string;
};

type HitoTypographyFamilySpecimen = {
  family: string;
  guidance: string;
  purpose: string;
  sample: string;
  sampleClassName: string;
  source: string;
  token: string;
  weights: string;
};

export const HITO_TYPOGRAPHY_PROVENANCE_PROPERTY = "--hito-typography-role";

export const HITO_TYPOGRAPHY_ROLES: HitoTypographyRole[] = [
  {
    className: "hito-ui-title-xl",
    description: "Largest reusable Poppins UI title tier.",
    figmaTextStyle: true,
    group: "ui-title",
    id: "ui-title-xl",
    label: "UI Title XL",
    sample: "Profile details that follow your training.",
    spec: "Poppins · clamp(3rem, 6vw, 4.5rem) · 400 · -0.02em · lh 1",
    use: "Largest product route or major state heading.",
  },
  {
    className: "hito-ui-title-lg",
    description: "Large reusable Poppins UI title tier backed by current product hero geometry.",
    figmaTextStyle: true,
    group: "ui-title",
    id: "ui-title-lg",
    label: "UI Title LG",
    sample: "Today, built around your training.",
    spec: "Poppins · clamp(2.25rem, 5vw, 3rem) · 400 · -0.02em · lh 1.05",
    use: "Prominent product hero or route subsection heading.",
  },
  {
    className: "hito-ui-title-md",
    description: "Medium reusable Poppins UI title tier.",
    figmaTextStyle: true,
    group: "ui-title",
    id: "ui-title-md",
    label: "UI Title MD",
    sample: "Edit schedule",
    spec: "Poppins · clamp(1.75rem, 5vw, 2rem) · 400 · -0.02em · lh 1.1",
    use: "Primary title inside a bounded product surface or dialog.",
  },
  {
    className: "hito-ui-title-sm",
    description: "Small reusable Poppins UI title tier.",
    figmaTextStyle: true,
    group: "ui-title",
    id: "ui-title-sm",
    label: "UI Title SM",
    sample: "Body data",
    spec: "Poppins · 1.5rem · 400 · -0.02em · lh 1.15",
    use: "Section-level product orientation.",
  },
  {
    className: "hito-ui-title-xs",
    description: "Compact reusable Poppins UI title tier.",
    figmaTextStyle: true,
    group: "ui-title",
    id: "ui-title-xs",
    label: "UI Title XS",
    sample: "Plan vs run",
    spec: "Poppins · clamp(1.25rem, 3vw, 1.375rem) · 400 · -0.015em · lh 1.18",
    use: "Compact panel, card, review, or feedback title.",
  },
  {
    className: "hito-display-title-xl",
    description: "Largest reusable Fraunces display tier.",
    figmaTextStyle: true,
    group: "display",
    id: "display-title-xl",
    label: "Display Title XL",
    sample: "A running plan that stays honest.",
    spec: "Fraunces · clamp(3.5rem, 7vw, 5rem) · 400 · -0.02em · lh 1",
    use: "Source-backed marketing, auth, or editorial hero moment only.",
  },
  {
    className: "hito-display-title-lg",
    description: "Large reusable Fraunces display tier.",
    figmaTextStyle: true,
    group: "display",
    id: "display-title-lg",
    label: "Display Title LG",
    sample: "Run with intent.",
    spec: "Fraunces · clamp(3rem, 6vw, 4.5rem) · 400 · -0.02em · lh 1",
    use: "Source-backed editorial route identity only.",
  },
  {
    className: "hito-body-lg",
    description: "Large reusable Poppins reading tier.",
    figmaTextStyle: true,
    group: "reading",
    id: "body-lg",
    label: "Body LG",
    sample: "A clear introduction for an important product decision.",
    spec: "Poppins · 1.125rem · 400 · lh 1.55",
    use: "Prominent introductory or explanatory copy.",
  },
  {
    className: "hito-body-md",
    description: "Default reusable Poppins reading tier.",
    figmaTextStyle: true,
    group: "reading",
    id: "body-md",
    label: "Body MD",
    sample: "This compares the planned workout with the uploaded run.",
    spec: "Poppins · 0.875rem · 400 · lh 1.58",
    use: "Default readable product and editorial copy.",
  },
  {
    className: "hito-body-sm",
    description: "Small reusable Poppins reading tier.",
    figmaTextStyle: true,
    group: "reading",
    id: "body-sm",
    label: "Body SM",
    sample: "Saved workout history stays preserved.",
    spec: "Poppins · 0.8125rem · 400 · lh 1.5",
    use: "Dense supporting explanations and secondary copy.",
  },
  {
    className: "hito-body-xs",
    description: "Smallest reusable Poppins reading tier.",
    figmaTextStyle: true,
    group: "reading",
    id: "body-xs",
    label: "Body XS",
    sample: "Nothing changes until you choose Apply update.",
    spec: "Poppins · 0.75rem · 400 · lh 1.45",
    use: "Field-adjacent guidance, compact metadata, and captions.",
  },
  {
    className: "hito-label-md",
    description: "Reusable Poppins field and metadata label tier.",
    figmaTextStyle: true,
    group: "control-label",
    id: "label-md",
    label: "Label MD",
    sample: "Start training",
    spec: "Poppins · 0.75rem · 600 · 0.01em · normal case · lh 1.25",
    use: "Explicit field ownership and compact metadata orientation.",
  },
  {
    className: "hito-label-sm",
    description: "Compact reusable Poppins neutral label tier.",
    figmaTextStyle: true,
    group: "control-label",
    id: "label-sm",
    label: "Label SM",
    sample: "Saved mode",
    spec: "Poppins · 0.6875rem · 500 · 0.01em · normal case · lh 1.25",
    use: "Compact neutral orientation; not an uppercase chrome recipe.",
  },
  {
    className: "hito-technical-sm",
    description: "Reusable JetBrains Mono technical readback tier.",
    figmaTextStyle: true,
    group: "technical",
    id: "technical-sm",
    label: "Technical SM",
    sample: "training-plan-v2 · 04:42 /km",
    spec: "JetBrains Mono · 0.75rem · 400 · tabular nums · lh 1.45",
    use: "Measured or fixed-format technical truth only.",
  },
  {
    className: "hito-button hito-button-secondary hito-button-sm",
    description: "Action text tuned by shared Hito button size tiers.",
    figmaTextStyle: false,
    group: "component-bound",
    id: "button",
    inspectorSelectable: false,
    label: "Button",
    sample: "Generate proposal",
    spec: "Poppins · tiered 0.6875-0.9375rem · 500 · lh 1",
    use: "Action text tuned by shared Hito button size tiers.",
  },
  {
    className: "hito-menu-text",
    description: "Shell navigation, dropdown rows, and utility menu text.",
    figmaTextStyle: false,
    group: "component-bound",
    id: "nav-menu",
    inspectorSelectable: false,
    label: "Nav / menu",
    sample: "User settings",
    spec: "Poppins · 0.8125-0.875rem · 500 · lh 1-1.3",
    use: "Shell navigation, dropdown rows, and utility menu text.",
  },
  {
    className: "hito-metric-value",
    description: "Measured truth value role.",
    figmaTextStyle: false,
    group: "component-bound",
    id: "metric",
    inspectorSelectable: false,
    label: "Metric",
    sample: "42.2 km",
    spec: "JetBrains Mono · 1rem · 500 · tabular · lh 1.1",
    use: "Measured truth: distance, duration, pace, counts, and dates.",
  },
  {
    className: "hito-status-pill",
    description: "Semantic state identifier role.",
    figmaTextStyle: false,
    group: "component-bound",
    id: "status",
    inspectorSelectable: false,
    label: "Status",
    sample: "Ready",
    spec: "Poppins · 0.625rem · 500 · normal case · rounded rectangle",
    use: "Semantic state identifier, never a heading.",
  },
];

const HITO_TYPOGRAPHY_GROUP_META: Array<{
  description: string;
  familySpecimen?: HitoTypographyFamilySpecimen;
  id: HitoTypographyGroupId;
  label: string;
}> = [
  {
    id: "ui-title",
    label: "UI titles",
    description: "Canonical sans-serif hierarchy for the authenticated product.",
    familySpecimen: {
      family: "Poppins",
      token: "--font-sans",
      source: "src/styles.css · src/styles/foundations.css",
      weights: "400 · 500 · 600",
      sample: "Built for the long run. Aa 0123456789",
      sampleClassName: "text-3xl font-normal leading-tight tracking-tight",
      purpose: "Product UI, titles, labels, controls, and readable body copy.",
      guidance: "Use for functional hierarchy and sustained reading across Hito product surfaces.",
    },
  },
  {
    id: "display",
    label: "Display titles",
    description: "Source-backed Fraunces marketing and editorial hierarchy.",
    familySpecimen: {
      family: "Fraunces",
      token: "--font-display",
      source: "src/styles.css · src/styles/foundations.css",
      weights: "400",
      sample: "Endurance, with intent.",
      sampleClassName: "text-3xl font-normal leading-tight tracking-tight",
      purpose: "Display and source-backed editorial emphasis.",
      guidance: "Use for deliberate large editorial moments; avoid routine product UI headings.",
    },
  },
  {
    id: "reading",
    label: "Body",
    description: "Primary and supporting Poppins reading tiers.",
  },
  {
    id: "control-label",
    label: "Labels",
    description: "Field ownership and compact neutral orientation.",
  },
  {
    id: "technical",
    label: "Technical",
    description: "Measured and fixed-format truth.",
    familySpecimen: {
      family: "JetBrains Mono",
      token: "--font-mono",
      source: "src/styles.css · src/styles/foundations.css",
      weights: "400 · 500",
      sample: "04:42 /km · 42.2 km",
      sampleClassName: "text-2xl font-medium leading-tight tracking-tight",
      purpose: "Technical readback, identifiers, and measured truth.",
      guidance: "Use for fixed-format values; avoid ordinary labels, headings, and body copy.",
    },
  },
  {
    id: "component-bound",
    label: "Component-bound",
    description: "Typography owned by component anatomy, not reusable Text Styles.",
  },
];

export const HITO_TYPOGRAPHY_GROUPS = HITO_TYPOGRAPHY_GROUP_META.map((group) => ({
  ...group,
  roles: HITO_TYPOGRAPHY_ROLES.filter((role) => role.group === group.id),
}));

export const HITO_INSPECTOR_TYPOGRAPHY_ROLES = HITO_TYPOGRAPHY_ROLES.filter(
  (role) => role.figmaTextStyle && role.inspectorSelectable !== false,
);

export type HitoTypographyGroupId =
  | "ui-title"
  | "display"
  | "reading"
  | "control-label"
  | "metadata"
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

export const HITO_TYPOGRAPHY_PROVENANCE_PROPERTY = "--hito-typography-role";

export const HITO_TYPOGRAPHY_ROLES: HitoTypographyRole[] = [
  {
    className: "hito-ui-page-title",
    description: "Primary sans-serif route title in the authenticated product.",
    figmaTextStyle: true,
    group: "ui-title",
    id: "ui-page-title",
    label: "UI page title",
    sample: "Profile details that follow your training.",
    spec: "Poppins · clamp(3rem, 6vw, 4.5rem) · 400 · -0.02em · lh 1",
    use: "Top-level authenticated route title or major product-state heading.",
  },
  {
    className: "hito-ui-modal-title",
    description: "Primary sans-serif heading inside bounded product dialogs.",
    figmaTextStyle: true,
    group: "ui-title",
    id: "ui-modal-title",
    label: "UI modal title",
    sample: "Edit schedule",
    spec: "Poppins · 1.75-2rem · 400 · -0.02em · lh 1.1",
    use: "Primary heading inside authenticated product dialogs.",
  },
  {
    className: "hito-ui-section-title",
    description: "Sans-serif section title in the authenticated product hierarchy.",
    figmaTextStyle: true,
    group: "ui-title",
    id: "ui-section-title",
    label: "UI section title",
    sample: "Body data",
    spec: "Poppins · 1.5rem · 400 · -0.02em · lh 1.15",
    use: "Section-level orientation within an authenticated product surface.",
  },
  {
    className: "hito-ui-panel-title",
    description: "Compact sans-serif panel or card title in the authenticated product.",
    figmaTextStyle: true,
    group: "ui-title",
    id: "ui-panel-title",
    label: "UI panel title",
    sample: "Plan vs run",
    spec: "Poppins · 1.25-1.375rem · 400 · -0.015em · lh 1.18",
    use: "Compact product panels, review modules, and feedback sections.",
  },
  {
    className: "hito-display-title",
    description: "Largest editorial serif heading for source-backed hero presentation.",
    figmaTextStyle: true,
    group: "display",
    id: "display-title",
    label: "Editorial display title",
    sample: "A running plan that stays honest.",
    spec: "Fraunces · clamp(3.5rem, 7vw, 5rem) · 400 · -0.02em · lh 1",
    use: "Source-backed marketing, auth, or editorial hero moments only.",
  },
  {
    className: "hito-page-title",
    description: "Editorial serif route title retained for source-backed public presentation.",
    figmaTextStyle: true,
    group: "display",
    id: "page-title",
    label: "Editorial page title",
    sample: "Profile details that follow your training.",
    spec: "Fraunces · clamp(3rem, 6vw, 4.5rem) · 400 · -0.02em · lh 1",
    use: "Public/editorial route identity; existing Product usage migrates to UI page title.",
  },
  {
    className: "hito-modal-title",
    description: "Serif dialog heading retained only as migration compatibility.",
    figmaTextStyle: true,
    group: "display",
    id: "modal-title",
    label: "Editorial modal title",
    sample: "Edit schedule",
    spec: "Fraunces · 1.75-2rem · 400 · -0.02em · lh 1.1",
    use: "Do not add new Product use; existing dialogs migrate to UI modal title.",
  },
  {
    className: "hito-section-title",
    description: "Serif section heading retained for editorial use and migration compatibility.",
    figmaTextStyle: true,
    group: "display",
    id: "section-title",
    label: "Editorial section title",
    sample: "Body data",
    spec: "Fraunces · 1.5rem · 400 · -0.02em · lh 1.15",
    use: "Editorial sections only; existing Product usage migrates to UI section title.",
  },
  {
    className: "hito-panel-title",
    description: "Compact serif heading for source-backed editorial modules.",
    figmaTextStyle: true,
    group: "display",
    id: "panel-title",
    label: "Editorial panel title",
    sample: "Plan vs run",
    spec: "Fraunces · 1.25-1.375rem · 400 · -0.015em · lh 1.18",
    use: "Editorial modules such as changelog; existing Product usage migrates to UI panel title.",
  },
  {
    className: "hito-list-row-title",
    description: "Primary label inside list-row anatomy.",
    figmaTextStyle: true,
    group: "reading",
    id: "list-row-title",
    label: "List row title",
    sample: "Same typography, no click",
    spec: "Poppins · 0.875rem · 400 · lh 1.35",
    use: "Primary label inside list rows and compact repeated row anatomy.",
  },
  {
    className: "hito-body",
    description: "Default body copy role.",
    figmaTextStyle: true,
    group: "reading",
    id: "body",
    label: "Body",
    sample: "This compares the planned workout with the uploaded run.",
    spec: "Poppins · 0.875rem · 400 · lh 1.58",
    use: "Default readable paragraph for page, modal, and section support.",
  },
  {
    className: "hito-body-small",
    description: "Small supporting body copy role.",
    figmaTextStyle: true,
    group: "reading",
    id: "body-small",
    label: "Body small",
    sample: "Saved workout history stays preserved.",
    spec: "Poppins · 0.8125rem · 400 · lh 1.5",
    use: "Dense secondary explanations, row support, and metadata.",
  },
  {
    className: "hito-field-helper",
    description: "Field-adjacent helper copy role.",
    figmaTextStyle: true,
    group: "control-label",
    id: "helper",
    label: "Helper",
    sample: "Nothing changes until you choose Apply update.",
    spec: "Poppins · 0.75rem · 400 · lh 1.45",
    use: "Field-adjacent or control-adjacent operational guidance.",
  },
  {
    className: "hito-caption",
    description: "Quiet caption and secondary metadata role.",
    figmaTextStyle: true,
    group: "metadata",
    id: "caption",
    label: "Caption",
    sample: "Extracted activity: morning-run.fit",
    spec: "Poppins · 0.6875rem · 400 · lh 1.45",
    use: "Tertiary detail, legends, tiny footnotes, and timestamps.",
  },
  {
    className: "hito-label",
    description: "Compact field or metadata label role.",
    figmaTextStyle: true,
    group: "control-label",
    id: "label",
    label: "Label",
    sample: "Current plan",
    spec: "Poppins · 0.75rem · 600 · 0.01em · normal case · lh 1.25",
    use: "Micro orientation, never a substitute for a heading.",
  },
  {
    className: "hito-form-label",
    description: "Explicit ownership label for fields and controls.",
    figmaTextStyle: true,
    group: "control-label",
    id: "form-label",
    label: "Form label",
    sample: "Start training",
    spec: "Poppins · 0.75rem · 600 · 0.01em · normal case · lh 1.25",
    use: "Explicit ownership label for fields and controls.",
  },
  {
    className: "hito-micro-label",
    description: "Tiny uppercase route chrome and compact status metadata.",
    figmaTextStyle: true,
    group: "metadata",
    id: "micro-label",
    label: "Micro label",
    sample: "Saved mode",
    spec: "Poppins · 0.6875rem · 500 · 0.18em · uppercase · lh 1.2",
    use: "Tiny uppercase route chrome and compact status metadata, not ordinary shell labels.",
  },
  {
    className: "hito-technical-mono",
    description: "Technical monospace readback role.",
    figmaTextStyle: true,
    group: "technical",
    id: "technical-mono",
    label: "Technical mono",
    sample: "training-plan-v2",
    spec: "JetBrains Mono · 0.75rem · tabular nums · lh 1.45",
    use: "Measured or fixed-format truth only.",
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
  {
    className: "hito-field-success",
    description: "Bounded action feedback near controls.",
    figmaTextStyle: false,
    group: "component-bound",
    id: "error-success",
    inspectorSelectable: false,
    label: "Error / success",
    sample: "User settings saved.",
    spec: "Poppins · 0.875rem · 500 · lh 1.45",
    use: "Bounded action feedback near the relevant control family.",
  },
];

const HITO_TYPOGRAPHY_GROUP_META: Array<{
  description: string;
  id: HitoTypographyGroupId;
  label: string;
}> = [
  {
    id: "ui-title",
    label: "UI titles",
    description: "Canonical sans-serif hierarchy for the authenticated product.",
  },
  {
    id: "display",
    label: "Editorial titles",
    description: "Source-backed marketing/editorial serif and migration compatibility only.",
  },
  {
    id: "reading",
    label: "Reading",
    description: "Primary and supporting product copy.",
  },
  {
    id: "control-label",
    label: "Control labels",
    description: "Field ownership and adjacent guidance.",
  },
  {
    id: "metadata",
    label: "Metadata",
    description: "Quiet captions and compact orientation.",
  },
  {
    id: "technical",
    label: "Technical",
    description: "Measured and fixed-format truth.",
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
  (role) => role.inspectorSelectable !== false,
);

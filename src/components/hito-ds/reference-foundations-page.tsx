import { useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { HitoButton } from "@/components/ui/button";
import { HitoChoiceToggle } from "@/components/ui/hito-choice-toggle";
import { Input } from "@/components/ui/input";
import { useHitoRadioGroup } from "@/components/ui/hito-radio-group";
import { useHitoTabs } from "@/components/ui/hito-tabs";
import { hitoToast } from "@/components/ui/hito-toast";
import {
  HITO_MARK_META,
  HITO_MARK_SHAPES,
  HITO_MARK_SIZES,
  HitoMark,
  type HitoMarkBackground,
  type HitoMarkBackgroundOption,
  type HitoMarkName,
  type HitoMarkShape,
  type HitoMarkSize,
} from "@/components/ui/hito-mark";
import { HITO_ICON_META, HITO_ICON_SIZES, Icon, type HitoIconSize } from "@/components/ui/icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HitoDsPlayground } from "@/components/hito-ds/playground";
import { ReferenceListRow, SectionIntro } from "@/components/hito-ds/reference";
import { MotionSystemPlayground } from "@/components/hito-ds/motion-system-playground";
import { TypographyControlRow } from "@/components/devtools/LocalUiTypographyControls";
import type { InlineChangeTargetInput } from "@/components/devtools/local-inline-change-target-utils";
import { inspectLocalUiTarget } from "@/components/devtools/local-ui-inspector-targets";
import { HITO_DS_MANIFEST } from "@/generated/hito-ds-manifest";
import {
  WORKOUT_COLOR_STATE_SLOTS,
  WORKOUT_SECTION_COLOR_ROLES,
  WORKOUT_TYPE_COLOR_ROLES,
  workoutSectionColorToken,
  workoutSectionColorVar,
  workoutTypeColorToken,
  workoutTypeColorVar,
  type WorkoutColorStateSlot,
  type WorkoutSectionColorRole,
} from "@/lib/workout-color-tokens";
import { HITO_TYPOGRAPHY_GROUPS, type HitoTypographyRole } from "@/lib/hito-typography-roles";
import { cn } from "@/lib/utils";

const COLOR_TABS = ["semantic", "primitive", "context"] as const;
const ICON_PREVIEW_SIZES = Object.keys(HITO_ICON_SIZES) as HitoIconSize[];
const MARK_PREVIEW_SIZES = Object.keys(HITO_MARK_SIZES) as HitoMarkSize[];
const WORKOUT_TYPE_VISUAL_STATE_SLOTS = WORKOUT_COLOR_STATE_SLOTS.filter(
  (slot) => slot !== "base" && slot !== "foreground",
);
const WORKOUT_SECTION_COLOR_STATE_SLOTS = WORKOUT_COLOR_STATE_SLOTS.filter(
  (slot) => slot !== "content",
);
const WORKOUT_CONTENT_PARENT_COLORS = [
  { label: "B", name: "background", value: "var(--color-background)" },
  { label: "S", name: "surface", value: "var(--color-surface)" },
  { label: "E", name: "elevated", value: "var(--color-surface-elevated)" },
  { label: "P", name: "popover", value: "var(--color-popover)" },
] as const;

type ColorTab = (typeof COLOR_TABS)[number];
type ActiveColorMode = "dark" | "light";
type ColorProvenance = {
  readonly aliasChain: readonly string[];
  readonly alpha: number | null;
  readonly kind: "alias" | "alpha" | "formula" | "primitive" | "transparent";
  readonly references: readonly {
    readonly cssVariable: string;
    readonly percentage: number | null;
  }[];
  readonly source: string;
};
type ResolvedColorValues = Readonly<Record<string, string>>;
type ActiveColorResolution = {
  mode: ActiveColorMode;
  values: ResolvedColorValues;
};

type PrimitiveColorSwatch = {
  step: string;
  token: string;
  value: string;
  provenance: ColorProvenance;
};

type PrimitiveColorGroupData = {
  title: string;
  colors: readonly PrimitiveColorSwatch[];
};

const PRIMITIVE_COLOR_FAMILIES = [
  { title: "Stone", prefixes: ["stone-"] },
  { title: "Sand", prefixes: ["sand-"] },
  { title: "Amber", prefixes: ["amber-"] },
  { title: "Blue", prefixes: ["blue-"] },
  { title: "Terracotta", prefixes: ["terracotta-"] },
  { title: "Green", prefixes: ["green-"] },
  { title: "Orange", prefixes: ["orange-"] },
  { title: "Red", prefixes: ["red-"] },
  { title: "Warm white", prefixes: ["warm-white"] },
  { title: "Linen", prefixes: ["linen-"] },
  { title: "Ink", prefixes: ["ink-"] },
  { title: "Taupe", prefixes: ["taupe-"] },
] as const;

const GENERAL_PRIMITIVE_COLOR_GROUPS: readonly PrimitiveColorGroupData[] =
  PRIMITIVE_COLOR_FAMILIES.map((group) => ({
    title: group.title,
    colors: HITO_DS_MANIFEST.collections.primitiveColor
      .filter((token) => group.prefixes.some((prefix) => token.id.startsWith(prefix)))
      .map((token) => ({
        step: token.id.split("-").slice(1).join("-") || "base",
        token: token.cssVariable,
        value: `var(${token.cssVariable})`,
        provenance: token.provenance,
      }))
      .sort((a, b) => primitiveColorSortKey(a.step) - primitiveColorSortKey(b.step)),
  }));

type SemanticColorTokenData = {
  label: string;
  name: string;
  token: string;
  value: string;
  modes: (typeof HITO_DS_MANIFEST.collections.semanticColor)[number]["modes"];
  pairing?: string;
};

const SEMANTIC_COLOR_TOKENS: readonly SemanticColorTokenData[] =
  HITO_DS_MANIFEST.collections.semanticColor.map((token) => ({
    label: token.label,
    name: token.id,
    token: token.cssVariable,
    value: `var(${token.cssVariable})`,
    modes: token.modes,
    pairing: semanticColorPairing(token.id),
  }));

const COLOR_VARIABLES = [
  ...HITO_DS_MANIFEST.collections.primitiveColor.map((token) => token.cssVariable),
  ...HITO_DS_MANIFEST.collections.semanticColor.map((token) => token.cssVariable),
] as const;

const SEMANTIC_COLOR_SECTIONS = [
  {
    title: "Surfaces",
    tokenNames: ["background", "surface", "surface-elevated", "card", "popover", "muted"],
  },
  { title: "Borders", tokenNames: ["border", "hairline", "input", "ring"] },
  {
    title: "Typography",
    tokenNames: [
      "foreground",
      "card-foreground",
      "popover-foreground",
      "muted-foreground",
      "text-secondary",
      "text-tertiary",
      "text-disabled",
      "text-accent",
      "text-positive",
      "text-negative",
      "text-informative",
      "text-warning",
    ],
  },
  {
    title: "Neutral chrome / overlays",
    tokenNames: [
      "chrome-clear",
      "chrome-subtle",
      "chrome-standard",
      "chrome-strong",
      "chrome-edge-default",
      "chrome-edge-emphasis",
    ],
  },
  {
    title: "Actions",
    tokenNames: [
      "primary",
      "primary-foreground",
      "accent",
      "accent-foreground",
      "signal",
      "signal-foreground",
    ],
  },
  {
    title: "Status / intent",
    tokenNames: [
      "success",
      "success-foreground",
      "warn",
      "info",
      "info-foreground",
      "destructive",
      "destructive-foreground",
    ],
  },
] as const;

const SPACING_USAGE: Record<string, string> = {
  "space-1": "Tiny internal offsets",
  "space-2": "XS control inset and tight pairs",
  "space-3": "Small control inset and compact row gaps",
  "space-4": "Default control inset and compact panel padding",
  "space-5": "Emphasized panel padding",
  "space-6": "Section and grouped-route rhythm",
  "space-8": "Open page section rhythm",
  "space-10": "Hero/top-level route moments only",
};

const SPACING_PRIMITIVES = HITO_DS_MANIFEST.collections.primitiveSpacing.map((token) => ({
  name: token.id,
  token: token.cssVariable,
  value: token.value,
  use: SPACING_USAGE[token.id] ?? "Canonical spacing primitive",
}));

const RADIUS_USAGE: Record<string, string> = {
  "radius-sm": "Micro tags and compact inspector details",
  "radius-md": "Small controls, inputs, and menu rows",
  "radius-lg": "Default controls and menus",
  "radius-xl": "Cards, day rows, and compact panels",
  "radius-2xl": "Dialogs and emphasized surfaces",
  "radius-3xl": "Rare large editorial or product surfaces",
  "radius-4xl": "Reserved oversized surfaces",
};

const RADIUS_PRIMITIVES = HITO_DS_MANIFEST.collections.primitiveRadius.map((token) => ({
  name: token.id,
  token: token.cssVariable,
  value: token.value,
  use: RADIUS_USAGE[token.id] ?? "Canonical radius primitive",
}));

const ELEVATION_LEVELS = [
  {
    id: "none",
    label: "None",
    token: null,
    intended: "Canvas, cards, rows, tabs, chart cards, and state surfaces",
    prohibited: "Not a missing style; flat content stays flat.",
  },
  {
    id: "xs",
    label: "XS",
    token: "--hito-elevation-xs",
    intended: "Tooltip and tiny detached copy/value affordance",
    prohibited: "Never hover, selection, focus, or a generic card.",
  },
  {
    id: "sm",
    label: "SM",
    token: "--hito-elevation-sm",
    intended: "Anchored menu, popover, and date picker",
    prohibited: "Never a field, button, or selected tab.",
  },
  {
    id: "md",
    label: "MD",
    token: "--hito-elevation-md",
    intended: "Detached toast and feedback surface",
    prohibited: "Never a status colour or validation indicator.",
  },
  {
    id: "lg",
    label: "LG",
    token: "--hito-elevation-lg",
    intended: "Side sheet or drawer above an overlay",
    prohibited: "Never shell or sidebar containment.",
  },
  {
    id: "xl",
    label: "XL",
    token: "--hito-elevation-xl",
    intended: "Blocking dialog above an overlay",
    prohibited: "Never marketing depth or blanket card elevation.",
  },
] as const;

const ELEVATION_TOKENS = ELEVATION_LEVELS.flatMap((level) => (level.token ? [level.token] : []));

const ELEVATION_PARENT_SURFACES = [
  { id: "canvas", label: "Canvas parent", background: "var(--color-background)" },
  { id: "surface", label: "Surface parent", background: "var(--color-surface)" },
] as const;

function primitiveColorSortKey(step: string) {
  if (step === "white") return -1;
  if (step.startsWith("alpha-")) return 10_000 + Number(step.slice("alpha-".length));

  return Number(step);
}

function semanticColorPairing(id: string) {
  const pairings: Record<string, string> = {
    card: "card-foreground",
    popover: "popover-foreground",
    primary: "primary-foreground",
    accent: "accent-foreground",
    signal: "signal-foreground",
    success: "success-foreground",
    info: "info-foreground",
    destructive: "destructive-foreground",
  };

  return pairings[id];
}

const TYPOGRAPHY_FAMILY_SPECIMENS = HITO_TYPOGRAPHY_GROUPS.flatMap((group) =>
  group.familySpecimen ? [group.familySpecimen] : [],
);

export function HitoDsFoundationsPage() {
  const [colorTab, setColorTab] = useState<ColorTab>("semantic");
  const [iconPreviewSize, setIconPreviewSize] = useState<HitoIconSize>("md");
  const [markPreviewSize, setMarkPreviewSize] = useState<HitoMarkSize>("md");
  const [markPreviewShape, setMarkPreviewShape] = useState<HitoMarkShape>("tile");
  const [markPreviewName, setMarkPreviewName] = useState<HitoMarkName>("hito-running");
  const [markPreviewBackground, setMarkPreviewBackground] = useState<HitoMarkBackground>("solid");
  const selectedMark =
    HITO_MARK_META.find((candidate) => candidate.name === markPreviewName) ?? HITO_MARK_META[0];
  const colorResolution = useActiveColorResolution();
  const elevationResolution = useActiveElevationResolution();
  const colorTabs = useHitoTabs({
    items: COLOR_TABS.map((value) => ({ value })),
    value: colorTab,
  });
  const iconSizeGroup = useHitoRadioGroup({
    items: ICON_PREVIEW_SIZES.map((value) => ({ value })),
    value: iconPreviewSize,
  });
  const markSizeGroup = useHitoRadioGroup({
    items: MARK_PREVIEW_SIZES.map((value) => ({ value })),
    value: markPreviewSize,
  });
  const markShapeGroup = useHitoRadioGroup({
    items: HITO_MARK_SHAPES.map((value) => ({ value })),
    value: markPreviewShape,
  });

  const copyColorValue = async (value: string, label: string) => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      copyTextWithLegacySelection(value);
      hitoToast.success({
        id: "hito-ds-color-copy",
        title: "Copied token value",
        description: `${label}: ${value}`,
        duration: 1800,
      });
    } catch {
      try {
        await navigator.clipboard.writeText(value);
        hitoToast.success({
          id: "hito-ds-color-copy",
          title: "Copied token value",
          description: `${label}: ${value}`,
          duration: 1800,
        });
      } catch {
        hitoToast.error({
          id: "hito-ds-color-copy",
          title: "Could not copy",
          description: "Try selecting the token manually.",
        });
      }
    }
  };

  return (
    <>
      <section id="foundations" className="ds-section">
        <SectionIntro label="Foundations" title="Color roles and primitives." />

        <div className="grid min-w-0 grid-cols-1 gap-8">
          <div className="grid min-w-0 grid-cols-1 gap-5">
            <div className="flex min-w-0 justify-end">
              <div
                className="hito-tabs hito-tabs-enclosed max-w-full overflow-x-auto"
                {...colorTabs.tabListProps}
                aria-label="Color token tabs"
              >
                {COLOR_TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    {...colorTabs.getTabProps(tab)}
                    className="hito-tab"
                    data-active={colorTab === tab ? "true" : undefined}
                    onClick={() => setColorTab(tab)}
                  >
                    {tab === "semantic"
                      ? "Semantic Colors"
                      : tab === "primitive"
                        ? "Primitives"
                        : "Context"}
                  </button>
                ))}
              </div>
            </div>

            {colorTab === "semantic" ? (
              <div
                className="grid grid-cols-1 gap-8"
                {...colorTabs.getPanelProps("semantic")}
                aria-label="Semantic Colors"
              >
                {SEMANTIC_COLOR_SECTIONS.map((section) => {
                  const tokens = section.tokenNames.map((tokenName) => {
                    const token = SEMANTIC_COLOR_TOKENS.find(({ name }) => name === tokenName);
                    if (!token) throw new Error(`Missing semantic Foundations token: ${tokenName}`);
                    return token;
                  });

                  return (
                    <section
                      key={section.title}
                      className="grid gap-3"
                      aria-labelledby={`${slugifyToken(section.title)}-semantic-colors`}
                    >
                      <h3
                        id={`${slugifyToken(section.title)}-semantic-colors`}
                        className="hito-ui-title-xs"
                      >
                        {section.title}
                      </h3>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {tokens.map((token) => (
                          <SemanticColorCard
                            key={token.name}
                            token={token}
                            colorResolution={colorResolution}
                            onCopy={copyColorValue}
                          />
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            ) : null}

            {colorTab === "primitive" ? (
              <div
                className="grid grid-cols-1 gap-5"
                {...colorTabs.getPanelProps("primitive")}
                aria-label="Primitives"
              >
                {GENERAL_PRIMITIVE_COLOR_GROUPS.map((group) => (
                  <PrimitiveColorGroup
                    key={group.title}
                    group={group}
                    colorResolution={colorResolution}
                    onCopy={copyColorValue}
                  />
                ))}
              </div>
            ) : null}

            {colorTab === "context" ? (
              <div
                className="grid min-w-0 gap-6"
                {...colorTabs.getPanelProps("context")}
                aria-label="Context"
                data-hito-ds-foundations-context=""
              >
                <article
                  className="hito-surface-flat grid min-w-0 gap-6 p-6 lg:p-8"
                  data-hito-ds-foundations-context-module="layers"
                  style={{ background: "var(--background)", color: "var(--foreground)" }}
                >
                  <div className="grid gap-2">
                    <p className="hito-label-md">Layers</p>
                    <p
                      className="hito-body-sm text-secondary max-w-3xl"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      The active canvas moves through semantic layers. Card is an alias of surface,
                      while elevated remains a distinct level.
                    </p>
                    <ContextColorTruth name="background" colorResolution={colorResolution} />
                  </div>
                  <div
                    className="grid gap-5 rounded-2xl p-5 lg:p-6"
                    style={{ background: "var(--surface)" }}
                  >
                    <div className="grid gap-4 lg:grid-cols-2">
                      <ContextColorTruth
                        name="surface"
                        backingToken="--background"
                        colorResolution={colorResolution}
                      />
                      <ContextColorTruth
                        name="card"
                        backingToken="--background"
                        colorResolution={colorResolution}
                        note="Same-level alias of surface"
                      />
                    </div>
                    <div
                      className="grid gap-5 rounded-2xl p-5 lg:p-6"
                      style={{ background: "var(--surface-elevated)" }}
                    >
                      <ContextColorTruth
                        name="surface-elevated"
                        backingToken="--surface"
                        colorResolution={colorResolution}
                      />
                      <div
                        className="grid gap-4 rounded-2xl p-5 lg:p-6"
                        style={{ background: "var(--popover)" }}
                      >
                        <ContextColorTruth
                          name="popover"
                          backingToken="--surface-elevated"
                          colorResolution={colorResolution}
                        />
                        <p className="hito-body-xs text-tertiary">
                          Canvas → Surface (Card alias) → Elevated → Popover
                        </p>
                      </div>
                    </div>
                  </div>
                </article>

                <div className="grid min-w-0 gap-6 xl:grid-cols-2">
                  <article
                    className="hito-surface-flat grid gap-6 p-6 lg:p-8"
                    data-hito-ds-foundations-context-module="type"
                    style={{ background: "var(--surface)" }}
                  >
                    <div>
                      <p className="hito-label-md">Typography</p>
                      <p className="hito-ui-title-sm mt-2">Actual content hierarchy</p>
                    </div>
                    <div className="grid gap-5">
                      <ContextTypeRole
                        name="foreground"
                        sample="Primary content"
                        sampleClassName="hito-ui-title-xs"
                        backingToken="--surface"
                        colorResolution={colorResolution}
                      />
                      <ContextTypeRole
                        name="text-secondary"
                        sample="Secondary supporting content"
                        sampleClassName="hito-body-md text-secondary"
                        backingToken="--surface"
                        colorResolution={colorResolution}
                      />
                      <ContextTypeRole
                        name="text-tertiary"
                        sample="Tertiary metadata"
                        sampleClassName="hito-body-xs text-tertiary"
                        backingToken="--surface"
                        colorResolution={colorResolution}
                      />
                      <ContextTypeRole
                        name="text-disabled"
                        sample="Disabled content"
                        sampleClassName="hito-body-xs text-tertiary"
                        backingToken="--surface"
                        colorResolution={colorResolution}
                      />
                      <div
                        className="grid gap-3 rounded-xl p-4"
                        style={{ background: "var(--signal)" }}
                      >
                        <p
                          className="hito-body-md text-secondary"
                          style={{ color: "var(--signal-foreground)" }}
                        >
                          On-signal content uses its existing foreground pair.
                        </p>
                        <ContextColorTruth
                          name="signal-foreground"
                          backingToken="--signal"
                          colorResolution={colorResolution}
                        />
                      </div>
                    </div>
                  </article>

                  <article
                    className="hito-surface-flat grid gap-6 p-6 lg:p-8"
                    data-hito-ds-foundations-context-module="interactive-intent"
                    style={{ background: "var(--surface)" }}
                  >
                    <div>
                      <p className="hito-label-md">Chrome, actions and intent</p>
                      <p className="hito-ui-title-sm mt-2">Real controls on surface</p>
                    </div>
                    <div className="grid gap-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <HitoChoiceToggle size="sm" selected>
                          Selected
                        </HitoChoiceToggle>
                        <Input size="md" aria-label="Context field" placeholder="Field chrome" />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {(["chrome-standard", "input", "ring"] as const).map((name) => (
                          <ContextColorTruth
                            key={name}
                            name={name}
                            backingToken="--surface"
                            colorResolution={colorResolution}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="grid gap-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <HitoButton size="sm" variant="primary">
                          Continue
                        </HitoButton>
                        <HitoButton size="sm" variant="secondary">
                          Secondary
                        </HitoButton>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <ContextColorTruth
                          name="primary"
                          backingToken="--surface"
                          colorResolution={colorResolution}
                        />
                        <ContextColorTruth
                          name="primary-foreground"
                          backingToken="--primary"
                          colorResolution={colorResolution}
                        />
                      </div>
                    </div>
                    <div className="grid gap-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="hito-status-pill" data-tone="success">
                          Success
                        </span>
                        <span className="hito-status-pill" data-tone="warning">
                          Warning
                        </span>
                        <span
                          className="hito-status-pill"
                          data-tone="neutral"
                          style={{ background: "var(--info)", color: "var(--info-foreground)" }}
                        >
                          Information
                        </span>
                        <span className="hito-status-pill" data-tone="destructive">
                          Destructive
                        </span>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {(["success", "warn", "info", "destructive"] as const).map((name) => (
                          <ContextColorTruth
                            key={name}
                            name={name}
                            backingToken="--surface"
                            colorResolution={colorResolution}
                          />
                        ))}
                      </div>
                    </div>
                  </article>
                </div>
              </div>
            ) : null}
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-5">
            <div className="hito-reference-note">
              <p className="hito-label-md">Workout semantic roles</p>
              <p className="hito-body-sm text-secondary mt-2 max-w-3xl">
                Workout types and sections expose state-ready semantic slots. Product surfaces use
                these stable role tokens; raw shade ramps are not a public contract.
              </p>
            </div>
            <WorkoutSemanticRoleGrid />
            <SectionSemanticRoleGrid />
          </div>

          <article className="hito-ds-token-specimen-surface grid min-w-0 gap-2 p-5">
            <h3 className="hito-ui-title-xs">Workout color rules</h3>
            <p className="hito-body-sm text-secondary max-w-3xl">
              Signal is the Hito accent rather than generic success. Warn and destructive are
              reserved for bounded feedback. Workout roles communicate training identity, not CTA
              hierarchy.
            </p>
          </article>
        </div>
      </section>

      <section id="typography" className="ds-section">
        <SectionIntro label="Typography" title="Shared typography roles." />
        <div className="grid gap-8">
          <div>
            <p className="hito-label-md">Actual families</p>
            <p className="hito-body-sm text-secondary mt-2 max-w-3xl">
              These live specimens use the three current font-family tokens and the weights loaded
              by the canonical stylesheet. The role inventory below remains owned by the central
              typography registry.
            </p>
            <div
              className="mt-5 grid auto-rows-fr gap-4 lg:grid-cols-3"
              data-hito-ds-typography-families=""
            >
              {TYPOGRAPHY_FAMILY_SPECIMENS.map((item) => (
                <TypographyFamilyRow key={item.family} item={item} />
              ))}
            </div>
          </div>

          <div className="grid gap-8">
            {HITO_TYPOGRAPHY_GROUPS.map((group) => (
              <section key={group.id} className="grid gap-3" aria-labelledby={`type-${group.id}`}>
                <div>
                  <h3 id={`type-${group.id}`} className="hito-label-md">
                    {group.label}
                  </h3>
                  <p className="hito-body-xs text-tertiary mt-1">{group.description}</p>
                </div>
                <div className="hito-reference-list">
                  {group.roles.map((role) => (
                    <TypographyRoleCard key={role.id} role={role} />
                  ))}
                </div>
              </section>
            ))}
          </div>

          <section className="grid gap-3" aria-labelledby="type-semantic-tones">
            <div>
              <h3 id="type-semantic-tones" className="hito-label-md">
                Semantic text tones
              </h3>
              <p className="hito-body-xs text-tertiary mt-1">
                Tone composes independently with typography and does not create another text role.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(
                [
                  ["Neutral", "--color-foreground"],
                  ["Accent", "--color-text-accent"],
                  ["Positive", "--color-text-positive"],
                  ["Negative", "--color-text-negative"],
                  ["Warning", "--color-text-warning"],
                  ["Disabled", "--color-text-disabled"],
                ] as const
              ).map(([label, token]) => (
                <article key={token} className="hito-open-specimen grid gap-2">
                  <p className="hito-label-sm" style={{ color: `var(${token})` }}>
                    {label}
                  </p>
                  <p className="hito-body-md" style={{ color: `var(${token})` }}>
                    Typography stays stable while semantic tone changes.
                  </p>
                  <code className="hito-technical-sm" style={{ color: `var(${token})` }}>
                    {token}
                  </code>
                </article>
              ))}
            </div>
          </section>

          <div className="hito-reference-note">
            <p className="hito-label-md">Provenance</p>
            <div className="hito-body-sm mt-2" data-hito-typography-provenance-specimen="">
              <span data-hito-typography-provenance-case="inherited">
                Nested text inherits a confirmed role.
              </span>{" "}
              <span className="hito-body-xs" data-hito-typography-provenance-case="nested-override">
                A nested role may override it.
              </span>
            </div>
            <p
              className="mt-2"
              data-hito-typography-provenance-case="unresolved-lookalike"
              style={{ fontSize: "0.875rem", fontWeight: 400, lineHeight: 1.58 }}
            >
              Matching values without provenance remain Custom.
            </p>
          </div>

          <TypographyInspectorPickerSpecimen />
        </div>
      </section>

      <section id="spacing" className="ds-section">
        <SectionIntro label="Spacing" title="Canonical gaps and insets." />
        <div
          className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
          data-hito-ds-spacing-specimens=""
        >
          {SPACING_PRIMITIVES.map((space) => (
            <SpacingPrimitiveRow key={space.name} space={space} />
          ))}
        </div>

        <div className="hito-reference-list mt-8">
          <ReferenceListRow
            label="Inset"
            title="Controls map size tiers to space primitives."
            body="XS uses space-2, SM uses space-3, MD/LG center around space-4, and XL can reach space-5."
          />
          <ReferenceListRow
            label="Panels"
            title="Panel padding stays compact."
            body="Compact panels use space-4. Emphasized or review-like panels use space-5. Route sections should breathe with space-6 or space-8."
          />
          <ReferenceListRow
            label="Hero"
            title="Only top-level moments reach space-10."
            body="Hero spacing is reserved for route identity. Component clusters should not simulate hero spacing locally."
          />
        </div>
      </section>

      <section id="radius" className="ds-section">
        <SectionIntro label="Radius" title="Canonical corner tiers." />
        <div
          className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
          data-hito-ds-radius-specimens=""
        >
          {RADIUS_PRIMITIVES.map((radius) => (
            <RadiusPrimitiveRow key={radius.token} radius={radius} />
          ))}
        </div>
      </section>

      <section id="depth" className="ds-section">
        <SectionIntro label="Depth" title="Quiet detachment from a parent surface." />
        <div className="grid min-w-0 gap-8">
          <div className="hito-reference-note">
            <p className="hito-label-md">Boundary</p>
            <p className="hito-body-sm text-secondary mt-2 max-w-3xl">
              Elevation describes physical detachment only. Focus, state, selection, validation, and
              structural edges remain separate contracts. The legacy{" "}
              <code className="hito-technical-sm">--hito-shadow-soft</code> stays independent while
              its remaining cross-owner consumers are migrated.
            </p>
          </div>

          {ELEVATION_PARENT_SURFACES.map((parent) => (
            <section
              key={parent.id}
              className="grid min-w-0 gap-4 rounded-2xl p-4 sm:p-6"
              style={{ background: parent.background }}
              aria-labelledby={"depth-" + parent.id}
              data-hito-ds-depth-parent={parent.id}
            >
              <h3 id={"depth-" + parent.id} className="hito-ui-title-xs">
                {parent.label}
              </h3>
              <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {ELEVATION_LEVELS.map((level) => (
                  <article
                    key={level.id}
                    className="grid min-h-32 min-w-0 content-between gap-4 rounded-xl border border-hairline bg-popover p-4"
                    style={{ boxShadow: level.token ? "var(" + level.token + ")" : "none" }}
                    data-hito-ds-depth-level={level.id}
                  >
                    <div className="grid min-w-0 gap-1">
                      <p className="hito-label-md">{level.label}</p>
                      <code className="hito-technical-sm text-secondary break-all">
                        {level.token ?? "none"}
                      </code>
                    </div>
                    <div className="grid min-w-0 gap-2">
                      <p
                        className="hito-technical-sm text-tertiary break-words"
                        data-hito-ds-depth-resolved={level.id}
                      >
                        {level.token
                          ? (elevationResolution[level.token] ?? "Measuring theme value…")
                          : "none"}
                      </p>
                      <p className="hito-body-xs text-secondary">{level.intended}</p>
                      <p className="hito-body-xs text-tertiary">{level.prohibited}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section id="icons" className="ds-section">
        <SectionIntro label="Icons" title="One Hito registry, Tabler underneath." />

        <div className="grid gap-5">
          <div className="hito-reference-note flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="hito-label-md">Canonical sizing</p>
              <p className="hito-body-sm text-secondary mt-2 max-w-3xl">
                Icons use four sizes only: xs 14, sm 16, md 20, and lg 24. Small icons use a 1.75
                stroke by default; medium and large icons use 1.5. Preview the registry at one size
                at a time to inspect names and shapes without repeated rows.
              </p>
            </div>
            <div
              className="hito-choice-toggle-group items-center"
              {...iconSizeGroup.groupProps}
              aria-label="Icon preview size"
            >
              {ICON_PREVIEW_SIZES.map((previewSize) => (
                <HitoChoiceToggle
                  key={previewSize}
                  size="sm"
                  {...iconSizeGroup.getRadioProps(previewSize)}
                  className="uppercase"
                  selected={iconPreviewSize === previewSize}
                  onClick={() => setIconPreviewSize(previewSize)}
                >
                  {previewSize}
                </HitoChoiceToggle>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(6.5rem,1fr))] gap-x-4 gap-y-7">
            {HITO_ICON_META.map((icon) => (
              <IconSpecimen key={icon.name} icon={icon} size={iconPreviewSize} />
            ))}
          </div>

          <div className="mt-5 grid gap-4">
            <p className="hito-ui-title-sm">Usage</p>
            <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <IconUsageCard label="Button" labelSize="sm">
                <HitoButton size="sm" variant="secondary">
                  <Icon name="download" size="sm" />
                  Export JSON
                </HitoButton>
              </IconUsageCard>
              <IconUsageCard label="Input">
                <div className="relative w-full">
                  <Icon
                    name="search"
                    size="sm"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input size="md" className="pl-9" placeholder="Search plans" />
                </div>
              </IconUsageCard>
              <IconUsageCard label="Nav row">
                <div className="hito-shell-nav-row" data-active="true">
                  <Icon name="calendar" className="hito-shell-nav-icon" />
                  <span>Calendar</span>
                  <span className="hito-shell-nav-dot" />
                </div>
              </IconUsageCard>
              <IconUsageCard label="Menu row">
                <div className="hito-shell-menu-item">
                  <Icon name="settings" size="sm" />
                  User settings
                </div>
              </IconUsageCard>
              <IconUsageCard label="Status marker">
                <span className="hito-status-marker" data-size="xs" data-tone="success">
                  <Icon name="check" size="xs" strokeWidth={2.2} />
                </span>
              </IconUsageCard>
            </div>
          </div>

          <HitoDsPlayground
            controls={
              <div className="hito-row-group">
                <div className="hito-list-row grid min-w-0 gap-5">
                  <div className="grid min-w-0 gap-2">
                    <p className="hito-label-md">Mark</p>
                    <Select
                      value={markPreviewName}
                      onValueChange={(nextValue) => {
                        setMarkPreviewName(nextValue as HitoMarkName);
                        setMarkPreviewBackground("solid");
                      }}
                    >
                      <SelectTrigger aria-label="Mark" className="min-w-0" size="sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HITO_MARK_META.map((mark) => (
                          <SelectItem key={mark.name} value={mark.name}>
                            {mark.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid min-w-0 gap-2">
                    <p className="hito-label-md">Shape</p>
                    <div
                      className="hito-choice-toggle-group"
                      {...markShapeGroup.groupProps}
                      aria-label="Shape"
                    >
                      {HITO_MARK_SHAPES.map((shape) => (
                        <HitoChoiceToggle
                          key={shape}
                          size="xs"
                          {...markShapeGroup.getRadioProps(shape)}
                          selected={markPreviewShape === shape}
                          onClick={() => setMarkPreviewShape(shape)}
                        >
                          {shape === "tile" ? "Tile" : "Circle"}
                        </HitoChoiceToggle>
                      ))}
                    </div>
                  </div>
                  <div className="grid min-w-0 gap-2">
                    <p className="hito-label-md">Size</p>
                    <div
                      className="hito-choice-toggle-group flex-wrap"
                      {...markSizeGroup.groupProps}
                      aria-label="Size"
                    >
                      {MARK_PREVIEW_SIZES.map((size) => (
                        <HitoChoiceToggle
                          key={size}
                          size="xs"
                          {...markSizeGroup.getRadioProps(size)}
                          selected={markPreviewSize === size}
                          onClick={() => setMarkPreviewSize(size)}
                        >
                          {size.toUpperCase()}
                        </HitoChoiceToggle>
                      ))}
                    </div>
                  </div>
                  <MarkBackgroundSelectControl
                    onChange={setMarkPreviewBackground}
                    options={selectedMark.backgrounds}
                    value={markPreviewBackground}
                  />
                </div>
              </div>
            }
            description={{
              purpose:
                "Inspect one canonical identity Mark at any supported size, shape, and approved semantic frame.",
              useWhen:
                "A branded workout-family or Hito-surface identity needs more presence than a compact interface icon.",
              avoidWhen:
                "An action needs an interface icon or a workout row needs the compact execution glyph.",
              accessibility:
                "Decorative Marks stay silent; standalone meaningful Marks require a label. Playground controls use native select and radio semantics.",
            }}
            id="marks"
            label="Marks"
            preview={
              <HitoMark
                background={markPreviewBackground}
                decorative={false}
                label={`${selectedMark.label} ${markPreviewShape} mark at ${markPreviewSize} size`}
                name={markPreviewName}
                shape={markPreviewShape}
                size={markPreviewSize}
              />
            }
          />

          <div
            className="mt-5 grid min-w-0 auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
            data-hito-ds-mark-gallery=""
            data-hito-ds-mark-gallery-shape={markPreviewShape}
            data-hito-ds-mark-gallery-size={markPreviewSize}
          >
            {HITO_MARK_META.map((mark) => (
              <article
                key={mark.name}
                className="hito-ds-token-specimen-surface grid h-full min-w-0 content-between gap-5 p-5"
                data-hito-mark-reference-card={mark.name}
              >
                <div className="grid min-w-0 place-items-center py-4">
                  <HitoMark name={mark.name} shape={markPreviewShape} size={markPreviewSize} />
                </div>
                <div className="grid min-w-0 gap-3">
                  <div>
                    <p
                      className="hito-list-row-title"
                      style={{ color: `var(${mark.contentToken})` }}
                    >
                      {mark.label}
                    </p>
                    <p className="hito-body-xs text-tertiary mt-1">
                      {mark.family === "workout" ? "Workout family" : "Hito surface"} · fit{" "}
                      {mark.opticalFit}
                    </p>
                  </div>
                  <div className="border-t border-hairline pt-3">
                    <dl className="grid min-w-0 gap-2">
                      <MarkTokenProvenance
                        label="Frame"
                        token={mark.frameToken}
                        onCopy={copyColorValue}
                      />
                      <MarkTokenProvenance
                        label="Glyph"
                        token={mark.glyphToken}
                        onCopy={copyColorValue}
                      />
                      <MarkTokenProvenance
                        label="Content"
                        token={mark.contentToken}
                        onCopy={copyColorValue}
                      />
                    </dl>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <MotionSystemPlayground />
    </>
  );
}

function PrimitiveColorGroup({
  group,
  colorResolution,
  onCopy,
}: {
  group: PrimitiveColorGroupData;
  colorResolution: ActiveColorResolution;
  onCopy: (value: string, label: string) => void;
}) {
  return (
    <section className="grid gap-3" aria-labelledby={`${slugifyToken(group.title)}-colors`}>
      <h3 id={`${slugifyToken(group.title)}-colors`} className="hito-ui-title-xs">
        {group.title}
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {group.colors.map((color) => (
          <PrimitiveColorSwatchButton
            key={color.token}
            color={color}
            colorResolution={colorResolution}
            onCopy={onCopy}
          />
        ))}
      </div>
    </section>
  );
}

function WorkoutSemanticRoleGrid() {
  return (
    <section className="grid grid-cols-1 gap-3" aria-labelledby="workout-semantic-type-colors">
      <div>
        <h3 id="workout-semantic-type-colors" className="hito-ui-title-xs">
          Workout type roles
        </h3>
        <p className="hito-body-xs text-tertiary mt-1">
          Runner-facing workout labels with reusable state slots.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {WORKOUT_TYPE_COLOR_ROLES.map((role) => (
          <SemanticRoleCard
            key={role.type}
            label={role.label}
            reportContrast
            slots={WORKOUT_TYPE_VISUAL_STATE_SLOTS}
            tokenFor={(slot) => workoutTypeColorToken(role.type, slot)}
            valueFor={(slot) => workoutTypeColorVar(role.type, slot)}
          />
        ))}
      </div>
    </section>
  );
}

function SectionSemanticRoleGrid() {
  return (
    <section className="grid grid-cols-1 gap-3" aria-labelledby="workout-semantic-section-colors">
      <div>
        <h3 id="workout-semantic-section-colors" className="hito-ui-title-xs">
          Section role tokens
        </h3>
        <p className="hito-body-xs text-tertiary mt-1">
          Repeat set is structural only: it repeats an ordered list of child blocks. Children own
          role, color, and target; Work + Recover is one interval example.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {WORKOUT_SECTION_COLOR_ROLES.map((role) => (
          <SemanticRoleCard
            key={role.type}
            label={role.label}
            slots={WORKOUT_SECTION_COLOR_STATE_SLOTS}
            tokenFor={(slot) => workoutSectionColorToken(role.type, slot)}
            valueFor={(slot) => workoutSectionColorVar(role.type, slot)}
          />
        ))}
        <RepeatSetStructureCard />
      </div>
    </section>
  );
}

function SemanticRoleCard({
  label,
  reportContrast = false,
  slots,
  tokenFor,
  valueFor,
}: {
  label: string;
  reportContrast?: boolean;
  slots: readonly WorkoutColorStateSlot[];
  tokenFor: (slot: WorkoutColorStateSlot) => string;
  valueFor: (slot: WorkoutColorStateSlot) => string;
}) {
  const cardRef = useRef<HTMLElement>(null);
  const [contrastRatios, setContrastRatios] = useState<WorkoutContrastRatios | null>(null);

  useLayoutEffect(() => {
    if (!reportContrast || !cardRef.current) return;

    const measure = () => {
      if (!cardRef.current) return;
      setContrastRatios(measureWorkoutContrast(cardRef.current));
    };
    const themeObserver = new MutationObserver(measure);

    measure();
    themeObserver.observe(document.documentElement, {
      attributeFilter: ["class", "data-hito-theme"],
      attributes: true,
    });

    return () => themeObserver.disconnect();
  }, [reportContrast]);

  const solidContrast = contrastRatios?.solid;

  return (
    <article
      ref={cardRef}
      className={cn(
        "hito-ds-token-specimen-surface grid min-h-56 gap-4",
        reportContrast ? "p-3" : "p-4",
      )}
      data-hito-workout-role-card={reportContrast ? label : undefined}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block hito-list-row-title">{label}</span>
          <code
            className="mt-1 block truncate hito-technical-sm text-secondary"
            title={tokenFor("base")}
          >
            {tokenFor("base")}
          </code>
        </span>
        <span
          aria-hidden={reportContrast ? undefined : true}
          aria-label={
            reportContrast
              ? solidContrast === undefined
                ? "Solid base and foreground contrast measuring"
                : `Solid base and foreground contrast ${solidContrast.toFixed(2)} to 1, ${solidContrast >= 4.5 ? "Pass" : "Fail"}`
              : undefined
          }
          role={reportContrast ? "img" : undefined}
          className="grid size-20 shrink-0 place-content-center gap-1 rounded-xl text-center text-[0.625rem] font-semibold"
          data-hito-workout-solid-sample=""
          data-hito-workout-solid-contrast={reportContrast ? "" : undefined}
          style={{
            background: valueFor("base"),
            color: valueFor("foreground"),
          }}
        >
          {reportContrast ? (
            <>
              <span className="hito-technical-sm text-secondary text-inherit">
                {solidContrast === undefined ? "…" : `${solidContrast.toFixed(2)}:1`}
              </span>
              <span className="hito-technical-sm text-secondary text-inherit">
                {solidContrast === undefined ? "Measuring" : solidContrast >= 4.5 ? "Pass" : "Fail"}
              </span>
            </>
          ) : (
            "Aa"
          )}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {slots.map((slot) => (
          <span
            key={slot}
            className={cn(
              "min-w-0 rounded-lg px-2.5 py-2 text-[0.6875rem] font-medium",
              slot === "border" && "border",
              reportContrast && slot === "content" && "col-span-2",
            )}
            data-hito-workout-slot={slot}
            style={semanticRoleSlotStyle(slot, valueFor, reportContrast)}
          >
            <span className="block">{slot}</span>
            {reportContrast && slot === "content" ? (
              <span className="mt-1 grid grid-cols-4 gap-1">
                {WORKOUT_CONTENT_PARENT_COLORS.map((parent) => (
                  <span
                    key={parent.name}
                    className="rounded px-1 py-0.5 text-center hito-technical-sm text-secondary"
                    data-hito-workout-content-parent={parent.name}
                    style={{ background: parent.value, color: valueFor("content") }}
                    title={parent.name}
                  >
                    {parent.label}
                  </span>
                ))}
              </span>
            ) : null}
            {reportContrast ? (
              <span className="mt-1 block hito-technical-sm text-secondary">
                {formatContrastVerdict(
                  contrastRatios?.[slot],
                  slot === "border" || slot === "ring" ? 3 : 4.5,
                )}
              </span>
            ) : null}
          </span>
        ))}
      </div>
    </article>
  );
}

function RepeatSetStructureCard() {
  const examples: ReadonlyArray<{
    rounds: string;
    summary: string;
    children: ReadonlyArray<{ label: string; role: WorkoutSectionColorRole; note?: string }>;
  }> = [
    {
      rounds: "3x",
      summary: "3x [Run + Walk]",
      children: [
        { label: "Run", role: "run" },
        { label: "Walk", role: "walk" },
      ],
    },
    {
      rounds: "4x",
      summary: "4x [Easy/Run + Work/Tempo + Recover]",
      children: [
        { label: "Run", role: "run", note: "Easy" },
        { label: "Work", role: "work", note: "Tempo" },
        { label: "Recover", role: "recover" },
      ],
    },
    {
      rounds: "6x",
      summary: "6x [Work + Recover]",
      children: [
        { label: "Work", role: "work" },
        { label: "Recover", role: "recover" },
      ],
    },
  ];

  return (
    <article className="hito-ds-token-specimen-surface grid min-h-56 gap-4 p-4">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="hito-label-md">structural wrapper</span>
          <span className="mt-2 block hito-list-row-title">Repeat set</span>
          <span className="mt-1 block hito-body-xs text-tertiary">
            No standalone section color token; ordered children own the section roles.
          </span>
        </span>
        <span className="rounded-full border border-hairline px-2.5 py-1 hito-technical-sm text-secondary">
          container
        </span>
      </div>
      <div className="grid gap-3">
        {examples.map((example) => (
          <div key={example.summary} className="grid gap-2 rounded-lg border border-hairline p-2.5">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="rounded-full border border-hairline px-2 py-0.5 hito-technical-sm text-secondary">
                {example.rounds}
              </span>
              <span className="min-w-0 hito-body-xs text-tertiary">{example.summary}</span>
            </div>
            <div className="flex min-w-0 flex-wrap gap-2">
              {example.children.map((child, index) => (
                <span
                  key={`${example.summary}-${child.role}-${index}`}
                  className="rounded-lg border px-2.5 py-2 text-[0.6875rem] font-medium"
                  style={{
                    background: workoutSectionColorVar(child.role, "surface"),
                    borderColor: workoutSectionColorVar(child.role, "border"),
                    color: workoutSectionColorVar(child.role),
                  }}
                >
                  {child.label}
                  {child.note ? <span className="ml-1 opacity-70">· {child.note}</span> : null}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

type ParsedCssColor = {
  alpha: number;
  srgb: [number, number, number];
};

type WorkoutContrastRatios = Partial<Record<WorkoutColorStateSlot, number>> & {
  solid?: number;
};

function measureWorkoutContrast(card: HTMLElement): WorkoutContrastRatios {
  const cardParent = parseCssColor(getComputedStyle(card).backgroundColor);
  const solidSample = card.querySelector<HTMLElement>("[data-hito-workout-solid-sample]");
  const contentParentSamples = [
    ...card.querySelectorAll<HTMLElement>("[data-hito-workout-content-parent]"),
  ];
  const structuralParents = contentParentSamples
    .map((sample) => parseCssColor(getComputedStyle(sample).backgroundColor))
    .filter((color): color is ParsedCssColor => color !== null);
  const parents = structuralParents.length > 0 ? structuralParents : cardParent ? [cardParent] : [];
  const ratios: WorkoutContrastRatios = {};

  if (!cardParent || parents.length === 0) return ratios;

  if (solidSample) {
    const style = getComputedStyle(solidSample);
    ratios.solid = cssColorContrast(style.color, style.backgroundColor, cardParent);
  }

  const slotSamples = [...card.querySelectorAll<HTMLElement>("[data-hito-workout-slot]")];
  const stateBackgrounds = slotSamples
    .filter((sample) =>
      ["muted", "surface", "hover", "active"].includes(sample.dataset.hitoWorkoutSlot ?? ""),
    )
    .map((sample) => parseCssColor(getComputedStyle(sample).backgroundColor))
    .filter((color): color is ParsedCssColor => color !== null);
  const boundaryBackgrounds = [
    ...parents,
    ...parents.flatMap((parent) =>
      stateBackgrounds.map((background) => compositeCssColor(background, parent)),
    ),
  ];

  slotSamples.forEach((sample) => {
    const slot = sample.dataset.hitoWorkoutSlot as WorkoutColorStateSlot | undefined;
    if (!slot) return;

    const style = getComputedStyle(sample);
    if (slot === "content" && contentParentSamples.length > 0) {
      ratios[slot] = minimumContrast(
        contentParentSamples.map((parentSample) => {
          const parentStyle = getComputedStyle(parentSample);
          return cssColorContrast(parentStyle.color, parentStyle.backgroundColor, cardParent);
        }),
      );
      return;
    }
    if (slot === "border") {
      ratios[slot] = cssBoundaryContrast(style.borderTopColor, boundaryBackgrounds);
      return;
    }
    if (slot === "ring") {
      ratios[slot] = cssBoundaryContrast(style.outlineColor, parents);
      return;
    }

    ratios[slot] = minimumContrast(
      parents.map((parent) => cssColorContrast(style.color, style.backgroundColor, parent)),
    );
  });

  return ratios;
}

function cssColorContrast(
  foregroundValue: string,
  backgroundValue: string,
  parent: ParsedCssColor,
) {
  const foreground = parseCssColor(foregroundValue);
  const background = parseCssColor(backgroundValue);
  if (!foreground || !background) return undefined;

  return contrastRatio(
    compositeCssColor(foreground, parent),
    compositeCssColor(background, parent),
  );
}

function cssBoundaryContrast(boundaryValue: string, backgrounds: readonly ParsedCssColor[]) {
  const boundary = parseCssColor(boundaryValue);
  if (!boundary) return undefined;
  return minimumContrast(
    backgrounds.map((background) =>
      contrastRatio(compositeCssColor(boundary, background), background),
    ),
  );
}

function minimumContrast(values: readonly (number | undefined)[]) {
  const definedValues = values.filter((value): value is number => value !== undefined);
  return definedValues.length > 0 ? Math.min(...definedValues) : undefined;
}

function compositeCssColor(foreground: ParsedCssColor, background: ParsedCssColor): ParsedCssColor {
  const alpha = foreground.alpha + background.alpha * (1 - foreground.alpha);
  if (alpha === 0) return { alpha: 0, srgb: [0, 0, 0] };

  return {
    alpha,
    srgb: foreground.srgb.map(
      (channel, index) =>
        (channel * foreground.alpha +
          background.srgb[index] * background.alpha * (1 - foreground.alpha)) /
        alpha,
    ) as [number, number, number],
  };
}

function contrastRatio(first: ParsedCssColor, second: ParsedCssColor) {
  const firstLuminance = relativeLuminance(first.srgb);
  const secondLuminance = relativeLuminance(second.srgb);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function relativeLuminance(srgb: [number, number, number]) {
  const [red, green, blue] = srgb.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
}

function parseCssColor(value: string): ParsedCssColor | null {
  const rgbMatch = value.match(/^rgba?\((.+)\)$/);
  if (rgbMatch) {
    const channels = rgbMatch[1].split(/[\s,/]+/).filter(Boolean);
    return {
      alpha: parseCssAlpha(channels[3]),
      srgb: channels.slice(0, 3).map((channel) => Number(channel) / 255) as [
        number,
        number,
        number,
      ],
    };
  }

  const srgbMatch = value.match(
    /^color\(srgb\s+([^\s]+)\s+([^\s]+)\s+([^\s/]+)(?:\s*\/\s*([^\s)]+))?\)$/,
  );
  if (srgbMatch) {
    return {
      alpha: parseCssAlpha(srgbMatch[4]),
      srgb: [Number(srgbMatch[1]), Number(srgbMatch[2]), Number(srgbMatch[3])],
    };
  }

  const oklchMatch = value.match(
    /^oklch\(([^\s]+)\s+([^\s]+)\s+([^\s/]+)(?:\s*\/\s*([^\s)]+))?\)$/,
  );
  if (!oklchMatch) return null;

  const lightness = parseCssPercentage(oklchMatch[1]);
  const chroma = Number(oklchMatch[2]);
  const hue = (Number(oklchMatch[3]) * Math.PI) / 180;
  const labA = chroma * Math.cos(hue);
  const labB = chroma * Math.sin(hue);
  const lPrime = lightness + 0.3963377774 * labA + 0.2158037573 * labB;
  const mPrime = lightness - 0.1055613458 * labA - 0.0638541728 * labB;
  const sPrime = lightness - 0.0894841775 * labA - 1.291485548 * labB;
  const linearRed =
    4.0767416621 * lPrime ** 3 - 3.3077115913 * mPrime ** 3 + 0.2309699292 * sPrime ** 3;
  const linearGreen =
    -1.2684380046 * lPrime ** 3 + 2.6097574011 * mPrime ** 3 - 0.3413193965 * sPrime ** 3;
  const linearBlue =
    -0.0041960863 * lPrime ** 3 - 0.7034186147 * mPrime ** 3 + 1.707614701 * sPrime ** 3;

  return {
    alpha: parseCssAlpha(oklchMatch[4]),
    srgb: [linearRed, linearGreen, linearBlue].map(linearToSrgb) as [number, number, number],
  };
}

function linearToSrgb(channel: number) {
  const converted = channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055;
  return Math.min(1, Math.max(0, converted));
}

function parseCssAlpha(value?: string) {
  if (!value) return 1;
  return parseCssPercentage(value);
}

function parseCssPercentage(value: string) {
  return value.endsWith("%") ? Number(value.slice(0, -1)) / 100 : Number(value);
}

function formatContrastVerdict(ratio: number | undefined, threshold: number) {
  if (ratio === undefined) return "measuring…";
  return `${ratio.toFixed(2)} · ${ratio >= threshold ? "pass" : "fail"}`;
}

function semanticRoleSlotStyle(
  slot: WorkoutColorStateSlot,
  valueFor: (slot: WorkoutColorStateSlot) => string,
  hasContent = false,
): CSSProperties {
  if (slot === "base" || slot === "foreground") {
    return {
      background: valueFor("base"),
      color: valueFor("foreground"),
    };
  }

  if (slot === "muted") {
    return {
      background: valueFor("muted"),
      color: valueFor(hasContent ? "content" : "foreground"),
    };
  }

  if (slot === "content") {
    return {
      background: "transparent",
      color: valueFor("content"),
    };
  }

  if (slot === "border") {
    return {
      background: "transparent",
      borderColor: valueFor("border"),
      color: valueFor(hasContent ? "content" : "base"),
    };
  }

  if (slot === "ring") {
    return {
      background: "transparent",
      boxShadow: `0 0 0 2px ${valueFor("ring")}`,
      color: valueFor(hasContent ? "content" : "base"),
      outlineColor: valueFor("ring"),
    };
  }

  return {
    background: valueFor(slot),
    color: valueFor(hasContent ? "content" : "base"),
  };
}

function useActiveColorResolution(): ActiveColorResolution {
  const [resolution, setResolution] = useState<ActiveColorResolution>({
    mode: "dark",
    values: {},
  });

  useLayoutEffect(() => {
    const probe = document.createElement("span");
    probe.setAttribute("aria-hidden", "true");
    Object.assign(probe.style, {
      height: "1px",
      left: "-9999px",
      opacity: "0",
      pointerEvents: "none",
      position: "fixed",
      top: "0",
      width: "1px",
    });
    document.body.append(probe);

    const measure = () => {
      const values: Record<string, string> = {};
      for (const cssVariable of COLOR_VARIABLES) {
        probe.style.backgroundColor = `var(${cssVariable})`;
        values[cssVariable] = getComputedStyle(probe).backgroundColor;
      }
      setResolution({
        mode:
          document.documentElement.getAttribute("data-hito-theme") === "light" ? "light" : "dark",
        values,
      });
    };
    const themeObserver = new MutationObserver(measure);

    measure();
    themeObserver.observe(document.documentElement, {
      attributeFilter: ["class", "data-hito-theme"],
      attributes: true,
    });

    return () => {
      themeObserver.disconnect();
      probe.remove();
    };
  }, []);

  return resolution;
}

function useActiveElevationResolution() {
  const [resolution, setResolution] = useState<Readonly<Record<string, string>>>({});

  useLayoutEffect(() => {
    const probe = document.createElement("span");
    probe.setAttribute("aria-hidden", "true");
    Object.assign(probe.style, {
      height: "1px",
      left: "-9999px",
      opacity: "0",
      pointerEvents: "none",
      position: "fixed",
      top: "0",
      width: "1px",
    });
    document.body.append(probe);

    const measure = () => {
      const values: Record<string, string> = {};
      for (const cssVariable of ELEVATION_TOKENS) {
        probe.style.boxShadow = "var(" + cssVariable + ")";
        values[cssVariable] = getComputedStyle(probe).boxShadow;
      }
      setResolution(values);
    };
    const themeObserver = new MutationObserver(measure);

    measure();
    themeObserver.observe(document.documentElement, {
      attributeFilter: ["class", "data-hito-theme"],
      attributes: true,
    });

    return () => {
      themeObserver.disconnect();
      probe.remove();
    };
  }, []);

  return resolution;
}

function ColorTruthFacts({
  token,
  provenance,
  resolvedColors,
  backingToken,
}: {
  token: string;
  provenance: ColorProvenance;
  resolvedColors: ResolvedColorValues;
  backingToken?: string;
}) {
  const activeColor = parseCssColor(resolvedColors[token] ?? "");
  const backingColor = backingToken ? parseCssColor(resolvedColors[backingToken] ?? "") : null;
  const activeHex = activeColor ? formatParsedColorHex(activeColor) : "measuring…";
  const compositeHex =
    activeColor && activeColor.alpha < 1 && backingColor
      ? formatParsedColorHex(compositeCssColor(activeColor, backingColor))
      : null;

  return (
    <span
      className="grid min-w-0 gap-1.5 hito-body-xs text-tertiary"
      data-hito-ds-color-provenance={provenance.kind}
      data-hito-ds-color-active-result={activeColor ? activeHex : undefined}
    >
      <code className="break-all hito-technical-sm text-secondary">var({token})</code>
      <span className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-1">
        <span style={{ color: "var(--text-tertiary)" }}>
          {colorProvenanceLabel(provenance.kind)}
        </span>
        <code className="min-w-0 whitespace-normal break-words hito-technical-sm text-secondary">
          {provenance.source}
        </code>
        {provenance.aliasChain.length > 1 ? (
          <>
            <span style={{ color: "var(--text-tertiary)" }}>Chain</span>
            <code className="min-w-0 whitespace-normal break-words hito-technical-sm text-secondary">
              {provenance.aliasChain.map((alias) => `var(--${alias})`).join(" → ")}
            </code>
          </>
        ) : null}
        {provenance.alpha !== null ? (
          <>
            <span style={{ color: "var(--text-tertiary)" }}>Alpha</span>
            <code className="hito-technical-sm text-secondary">
              {formatAlphaPercentage(provenance.alpha)}
            </code>
          </>
        ) : null}
        <span style={{ color: "var(--text-tertiary)" }}>Active</span>
        <code className="hito-technical-sm text-secondary">{activeHex}</code>
        {compositeHex && backingToken ? (
          <>
            <span style={{ color: "var(--text-tertiary)" }}>On</span>
            <span className="min-w-0">
              <code className="break-all hito-technical-sm text-secondary">
                var({backingToken})
              </code>
              <code className="ml-2 hito-technical-sm text-secondary">{compositeHex}</code>
            </span>
          </>
        ) : null}
      </span>
    </span>
  );
}

function ContextColorTruth({
  name,
  colorResolution,
  backingToken,
  note,
}: {
  name: string;
  colorResolution: ActiveColorResolution;
  backingToken?: string;
  note?: string;
}) {
  const token = SEMANTIC_COLOR_TOKENS.find((candidate) => candidate.name === name);
  if (!token) throw new Error(`Missing Context semantic token: ${name}`);
  const activeMode = token.modes[colorResolution.mode];

  return (
    <div
      className="grid min-w-0 gap-2 rounded-xl p-3"
      style={{ background: "var(--chrome-clear)" }}
      data-hito-ds-context-token={name}
    >
      <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-2">
        <span className="hito-list-row-title">{token.label}</span>
        {note ? <span className="hito-body-xs text-tertiary">{note}</span> : null}
      </div>
      <ColorTruthFacts
        token={token.token}
        provenance={activeMode.provenance}
        resolvedColors={colorResolution.values}
        backingToken={backingToken}
      />
    </div>
  );
}

function ContextTypeRole({
  name,
  sample,
  sampleClassName,
  backingToken,
  colorResolution,
}: {
  name: string;
  sample: string;
  sampleClassName: string;
  backingToken: string;
  colorResolution: ActiveColorResolution;
}) {
  return (
    <div className="grid min-w-0 gap-3">
      <p className={sampleClassName} style={{ color: `var(--${name})` }}>
        {sample}
      </p>
      <ContextColorTruth
        name={name}
        backingToken={backingToken}
        colorResolution={colorResolution}
      />
    </div>
  );
}

function formatAlphaPercentage(alpha: number) {
  return `${Number((alpha * 100).toFixed(2))}%`;
}

function colorProvenanceLabel(kind: ColorProvenance["kind"]) {
  if (kind === "alpha") return "Alpha primitive";
  if (kind === "formula") return "Formula";
  if (kind === "primitive") return "Primitive";
  if (kind === "transparent") return "Transparent";
  return "Alias";
}

function formatParsedColorHex(color: ParsedCssColor) {
  const channels = color.srgb.map((channel) =>
    Math.round(Math.min(1, Math.max(0, channel)) * 255)
      .toString(16)
      .padStart(2, "0"),
  );
  const alpha = Math.round(Math.min(1, Math.max(0, color.alpha)) * 255);
  if (alpha < 255) channels.push(alpha.toString(16).padStart(2, "0"));
  return `#${channels.join("").toUpperCase()}`;
}

function PrimitiveColorSwatchButton({
  color,
  colorResolution,
  onCopy,
}: {
  color: PrimitiveColorSwatch;
  colorResolution: ActiveColorResolution;
  onCopy: (value: string, label: string) => void;
}) {
  return (
    <button
      type="button"
      className="group hito-ds-token-specimen-surface grid min-h-36 min-w-0 overflow-hidden text-left transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      onClick={() => onCopy(color.value, color.token)}
      aria-label={`Copy ${color.token}`}
    >
      <span
        aria-hidden="true"
        className="min-h-20 border-b border-hairline"
        style={{ background: color.value } satisfies CSSProperties}
      />
      <span className="flex min-w-0 items-start justify-between gap-3 p-4">
        <span className="grid min-w-0 flex-1 gap-3">
          <span>
            <span className="block hito-list-row-title">{color.step}</span>
          </span>
          <ColorTruthFacts
            token={color.token}
            provenance={color.provenance}
            resolvedColors={colorResolution.values}
            backingToken="--background"
          />
        </span>
        <Icon
          name="copy"
          size="xs"
          className="shrink-0 opacity-0 transition group-hover:opacity-80 group-focus-visible:opacity-100"
        />
      </span>
    </button>
  );
}

function SemanticColorCard({
  token,
  colorResolution,
  onCopy,
}: {
  token: (typeof SEMANTIC_COLOR_TOKENS)[number];
  colorResolution: ActiveColorResolution;
  onCopy: (value: string, label: string) => void;
}) {
  const copyValue = token.value;
  const activeMode = token.modes[colorResolution.mode];

  return (
    <button
      type="button"
      className="group hito-ds-token-specimen-surface grid min-h-40 min-w-0 content-between gap-4 p-4 text-left transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      onClick={() => onCopy(copyValue, token.name)}
      aria-label={`Copy ${token.name} semantic token`}
      data-hito-ds-semantic-token={token.name}
      data-hito-ds-contrast-pairing={token.pairing ?? undefined}
    >
      <span className="flex min-w-0 items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block hito-list-row-title">{token.label}</span>
        </span>
        <SemanticColorPreview token={token} />
      </span>
      <span className="flex min-w-0 items-end justify-between gap-3">
        <span className="grid min-w-0 flex-1 gap-3">
          <ColorTruthFacts
            token={token.token}
            provenance={activeMode.provenance}
            resolvedColors={colorResolution.values}
            backingToken="--background"
          />
          {token.pairing ? (
            <span className="hito-body-xs text-tertiary">Pair with var(--{token.pairing})</span>
          ) : null}
        </span>
        <Icon
          name="copy"
          size="xs"
          className="shrink-0 opacity-0 transition group-hover:opacity-80 group-focus-visible:opacity-100"
        />
      </span>
    </button>
  );
}

function SemanticColorPreview({ token }: { token: SemanticColorTokenData }) {
  const className = "h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-hairline";

  return (
    <span
      aria-hidden="true"
      className={className}
      style={{ background: token.value } satisfies CSSProperties}
    />
  );
}

function slugifyToken(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function copyTextWithLegacySelection(value: string) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();

  if (!copied) {
    throw new Error("Copy command failed");
  }
}

function TypographyFamilyRow({ item }: { item: (typeof TYPOGRAPHY_FAMILY_SPECIMENS)[number] }) {
  return (
    <article
      className="hito-ds-token-specimen-surface grid h-full min-w-0 gap-5 p-3"
      data-hito-ds-typography-family={item.family}
    >
      <div className="grid min-h-40 content-between gap-5 rounded-2xl bg-muted/60 p-5">
        <p
          className={cn("min-w-0 break-words text-foreground", item.sampleClassName)}
          style={{ fontFamily: `var(${item.token})` } satisfies CSSProperties}
        >
          {item.sample}
        </p>
        <p className="hito-technical-sm text-secondary">{item.token}</p>
      </div>
      <div className="grid gap-2">
        <h3 className="hito-ui-title-xs">{item.family}</h3>
        <p className="hito-body-sm text-secondary">{item.purpose}</p>
        <p className="hito-body-xs text-tertiary">Active weights: {item.weights}</p>
        <p className="hito-body-xs text-tertiary break-words">CSS owner: {item.source}</p>
        <p className="hito-body-xs text-tertiary">{item.guidance}</p>
      </div>
    </article>
  );
}

function SpacingPrimitiveRow({ space }: { space: (typeof SPACING_PRIMITIVES)[number] }) {
  return (
    <article
      className="hito-ds-token-specimen-surface grid h-full min-w-0 gap-5 p-3"
      data-hito-ds-spacing-token={space.token}
    >
      <div className="grid h-28 place-items-center rounded-2xl bg-muted/60 p-4">
        <div
          className="flex items-center"
          style={{ gap: `var(${space.token})` } satisfies CSSProperties}
        >
          <span aria-hidden="true" className="size-8 shrink-0 rounded-lg bg-signal" />
          <span aria-hidden="true" className="size-8 shrink-0 rounded-lg bg-signal" />
        </div>
      </div>
      <div className="grid gap-2">
        <h3 className="hito-list-row-title">{space.name}</h3>
        <code className="hito-technical-sm text-secondary break-words">
          {space.token} · {space.value}
        </code>
        <p className="hito-body-xs text-tertiary">{space.use}</p>
      </div>
    </article>
  );
}

function RadiusPrimitiveRow({ radius }: { radius: (typeof RADIUS_PRIMITIVES)[number] }) {
  return (
    <article
      className="hito-ds-token-specimen-surface grid h-full min-w-0 gap-5 p-3"
      data-hito-ds-radius-token={radius.token}
    >
      <div className="grid h-28 place-items-center rounded-2xl bg-muted/60 p-4">
        <span
          aria-hidden="true"
          className="block size-20 shrink-0 bg-signal"
          style={{ borderRadius: `var(${radius.token})` } satisfies CSSProperties}
        />
      </div>
      <div className="grid gap-2">
        <h3 className="hito-list-row-title">{radius.name}</h3>
        <code className="hito-technical-sm text-secondary break-words">
          {radius.token} · {radius.value}
        </code>
        <p className="hito-body-xs text-tertiary">{radius.use}</p>
      </div>
    </article>
  );
}

type InspectorTypographyEvidence = NonNullable<InlineChangeTargetInput["typography"]>;
type TypographyInspectorPickerCase = "inherited" | "component" | "custom";

function TypographyInspectorPickerSpecimen() {
  const inheritedRef = useRef<HTMLSpanElement>(null);
  const componentRef = useRef<HTMLButtonElement>(null);
  const customRef = useRef<HTMLParagraphElement>(null);
  const [selectedCase, setSelectedCase] = useState<TypographyInspectorPickerCase>("inherited");
  const [inheritedTypography, setInheritedTypography] =
    useState<InspectorTypographyEvidence | null>(null);
  const [componentTypography, setComponentTypography] =
    useState<InspectorTypographyEvidence | null>(null);
  const [customTypography, setCustomTypography] = useState<InspectorTypographyEvidence | null>(
    null,
  );
  const [inheritedDesiredRoleId, setInheritedDesiredRoleId] = useState<string | null>(null);
  const [componentDesiredRoleId, setComponentDesiredRoleId] = useState<string | null>(null);
  const [customDesiredRoleId, setCustomDesiredRoleId] = useState<string | null>(null);
  const pickerCaseGroup = useHitoRadioGroup<TypographyInspectorPickerCase>({
    items: [{ value: "inherited" }, { value: "component" }, { value: "custom" }],
    value: selectedCase,
  });
  const selectedTypography =
    selectedCase === "inherited"
      ? inheritedTypography
      : selectedCase === "component"
        ? componentTypography
        : customTypography;
  const selectedDesiredRoleId =
    selectedCase === "inherited"
      ? inheritedDesiredRoleId
      : selectedCase === "component"
        ? componentDesiredRoleId
        : customDesiredRoleId;
  const onSelectedDesiredRoleChange = (roleId: string | null) => {
    if (selectedCase === "inherited") {
      setInheritedDesiredRoleId(roleId);
      return;
    }
    if (selectedCase === "component") {
      setComponentDesiredRoleId(roleId);
      return;
    }
    setCustomDesiredRoleId(roleId);
  };

  useLayoutEffect(() => {
    if (selectedCase === "inherited") {
      setInheritedTypography(
        inheritedRef.current
          ? (inspectLocalUiTarget(inheritedRef.current).typography ?? null)
          : null,
      );
      return;
    }
    if (selectedCase === "component") {
      setComponentTypography(
        componentRef.current
          ? (inspectLocalUiTarget(componentRef.current).typography ?? null)
          : null,
      );
      return;
    }
    setCustomTypography(
      customRef.current ? (inspectLocalUiTarget(customRef.current).typography ?? null) : null,
    );
  }, [selectedCase]);

  const selectedExample =
    selectedCase === "inherited" ? (
      <div className="hito-body-md">
        <span ref={inheritedRef}>Inherited body typography from a shared Hito owner.</span>
      </div>
    ) : selectedCase === "component" ? (
      <HitoButton ref={componentRef} size="sm" variant="secondary">
        Component-owned button typography
      </HitoButton>
    ) : (
      <p
        ref={customRef}
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "1.0625rem",
          fontStyle: "italic",
          fontWeight: 500,
          letterSpacing: "0.015em",
          lineHeight: 1.4,
        }}
      >
        Unresolved custom typography remains observational.
      </p>
    );

  return (
    <div className="hito-reference-note" data-hito-ds-typography-inspector-specimen="">
      <HitoDsPlayground
        controls={
          <div className="grid min-w-0 gap-4">
            <div>
              <p className="hito-label-md">Choose an example</p>
              <div
                className="mt-2 grid min-w-0 gap-2"
                {...pickerCaseGroup.groupProps}
                aria-label="Typography inspector examples"
              >
                <HitoChoiceToggle
                  presentation="card"
                  {...pickerCaseGroup.getRadioProps("inherited")}
                  className="w-full min-w-0 justify-start text-left"
                  selected={selectedCase === "inherited"}
                  onClick={() => setSelectedCase("inherited")}
                  data-hito-ds-typography-picker-case="inherited"
                  data-hito-ds-typography-picker-current-role={
                    inheritedTypography?.currentRole?.id ?? "pending"
                  }
                >
                  <span className="grid min-w-0 gap-1">
                    <span>Inherited role</span>
                    <span className="hito-body-xs text-secondary">Shared Hito body owner</span>
                  </span>
                </HitoChoiceToggle>
                <HitoChoiceToggle
                  presentation="card"
                  {...pickerCaseGroup.getRadioProps("component")}
                  className="w-full min-w-0 justify-start text-left"
                  selected={selectedCase === "component"}
                  onClick={() => setSelectedCase("component")}
                  data-hito-ds-typography-picker-case="component"
                  data-hito-ds-typography-picker-current-role={
                    componentTypography?.currentRole?.id ?? "pending"
                  }
                >
                  <span className="grid min-w-0 gap-1">
                    <span>Component-owned Button</span>
                    <span className="hito-body-xs text-secondary">Recognized, not replaceable</span>
                  </span>
                </HitoChoiceToggle>
                <HitoChoiceToggle
                  presentation="card"
                  {...pickerCaseGroup.getRadioProps("custom")}
                  className="w-full min-w-0 justify-start text-left"
                  selected={selectedCase === "custom"}
                  onClick={() => setSelectedCase("custom")}
                  data-hito-ds-typography-picker-case="custom"
                  data-hito-ds-typography-picker-current-role={
                    customTypography?.currentRole?.id ?? "custom"
                  }
                >
                  <span className="grid min-w-0 gap-1">
                    <span>Custom typography</span>
                    <span className="hito-body-xs text-secondary">Observational only</span>
                  </span>
                </HitoChoiceToggle>
              </div>
            </div>
            {selectedTypography ? (
              <div className="min-w-0" data-hito-ds-typography-picker-current={selectedCase}>
                <TypographyControlRow
                  desiredRoleId={selectedDesiredRoleId}
                  onDesiredRoleChange={onSelectedDesiredRoleChange}
                  typography={selectedTypography}
                />
              </div>
            ) : null}
          </div>
        }
        description={{
          purpose:
            "Compare computed typography without changing the live Inspector target or its provenance.",
          useWhen:
            "A reference example needs to distinguish inherited, component-owned, and unresolved typography facts.",
          avoidWhen:
            "A component-owned role needs to become a replacement choice or a computed preview needs to establish provenance.",
          accessibility:
            "Example cards use roving radio focus; the selected control row keeps its native focus and Escape behavior.",
        }}
        id="typography-inspector-picker"
        label="Typography Inspector picker"
        preview={
          <div className="grid min-w-0 gap-3" data-hito-ds-typography-picker-current={selectedCase}>
            {selectedExample}
          </div>
        }
      />
    </div>
  );
}

function TypographyRoleCard({ role }: { role: HitoTypographyRole }) {
  return (
    <article className="hito-reference-row" data-hito-ds-typography-role={role.id}>
      <div>
        <p className="hito-label-md">{role.label}</p>
        <p className="hito-body-xs text-tertiary mt-2">{role.use}</p>
      </div>
      <div className="grid gap-3">
        <div className="hito-open-specimen">
          <div className={role.className}>{role.sample}</div>
        </div>
        <div className="hito-reference-meta">
          <code className="hito-technical-sm text-secondary">.{role.className.split(" ")[0]}</code>
          <span className="hito-body-xs text-tertiary">{role.spec}</span>
        </div>
      </div>
    </article>
  );
}

function IconSpecimen({
  icon,
  size,
}: {
  icon: (typeof HITO_ICON_META)[number];
  size: HitoIconSize;
}) {
  return (
    <article
      className="grid justify-items-center gap-2 text-center"
      data-hito-ds-icon-specimen={icon.name}
      data-hito-ds-icon-size={size}
    >
      <div className="grid h-8 place-items-center text-foreground">
        <Icon name={icon.name} size={size} />
      </div>
      <div className="grid gap-1">
        <p className="hito-list-row-title">{icon.name}</p>
        <p className="hito-body-xs text-tertiary">{icon.category}</p>
      </div>
    </article>
  );
}

function IconUsageCard({
  label,
  labelSize = "md",
  children,
}: {
  label: string;
  labelSize?: "sm" | "md";
  children: ReactNode;
}) {
  return (
    <article className="hito-ds-token-specimen-surface grid min-h-28 min-w-0 gap-4 p-4">
      <p className={labelSize === "sm" ? "hito-label-sm" : "hito-label-md"}>{label}</p>
      <div className="flex min-w-0 items-center justify-center">{children}</div>
    </article>
  );
}

function MarkBackgroundSelectControl({
  onChange,
  options,
  value,
}: {
  onChange: (value: HitoMarkBackground) => void;
  options: readonly HitoMarkBackgroundOption[];
  value: HitoMarkBackground;
}) {
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  return (
    <div className="grid min-w-0 gap-2">
      <p className="hito-label-md">Background</p>
      <Select
        value={value}
        onValueChange={(nextValue) => onChange(nextValue as HitoMarkBackground)}
      >
        <SelectTrigger aria-label="Background" className="min-w-0" size="sm">
          <SelectValue>
            {selectedOption ? <MarkBackgroundOptionLabel option={selectedOption} /> : null}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <MarkBackgroundOptionLabel option={option} />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function MarkBackgroundOptionLabel({ option }: { option: HitoMarkBackgroundOption }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span
        aria-hidden="true"
        className="size-4 shrink-0 rounded-full border border-hairline"
        data-hito-mark-background-swatch={option.value}
        data-hito-mark-background-swatch-token={option.frameToken}
        style={{ backgroundColor: `var(${option.frameToken})` }}
      />
      <span>{option.label}</span>
    </span>
  );
}

function MarkTokenProvenance({
  label,
  onCopy,
  token,
}: {
  label: string;
  onCopy: (value: string, label: string) => void;
  token: string;
}) {
  return (
    <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-3">
      <dt className="hito-body-xs" style={{ color: "var(--color-text-secondary)" }}>
        {label}
      </dt>
      <dd className="min-w-0 text-right">
        <button
          type="button"
          className="group inline-flex max-w-full min-w-0 items-center gap-2 rounded-sm text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          onClick={() => onCopy(token, `${label} provenance token`)}
          aria-label={`Copy ${label} provenance token ${token}`}
          data-hito-mark-provenance={label}
          title={token}
        >
          <span className="hito-technical-sm min-w-0 truncate">{token}</span>
          <Icon
            name="copy"
            size="xs"
            className="shrink-0 opacity-80 transition [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-80 group-focus-visible:opacity-100"
          />
        </button>
      </dd>
    </div>
  );
}

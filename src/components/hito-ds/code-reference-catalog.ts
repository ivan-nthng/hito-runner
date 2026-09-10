import buttonSource from "../ui/button.tsx?raw";
import dropdownMenuSource from "../ui/dropdown-menu.tsx?raw";
import sliderSource from "../ui/hito-slider.tsx?raw";
import tabsSource from "../ui/hito-tabs.ts?raw";
import inputSource from "../ui/input.tsx?raw";

export type HitoDsCodeLanguage = "css" | "json" | "tsx" | "typescript";

export type HitoDsCodeRepresentation = {
  code: string;
  label: "Source / Reference" | "Usage";
  language: HitoDsCodeLanguage;
  sourcePath?: string;
};

export type HitoDsCodeDependency = {
  detail: string;
  kind: "Accessibility" | "Behavior" | "Primitives" | "Tokens";
};

export type HitoDsCodeReference = {
  dependencies: readonly HitoDsCodeDependency[];
  source: HitoDsCodeRepresentation;
  usage: HitoDsCodeRepresentation;
};

const ADAPTATION_NOTICE =
  "// Hito-specific imports, primitives, and semantic tokens require adaptation outside Hito.";

const HITO_DS_CODE_SOURCE_ALLOWLIST = {
  buttons: {
    code: buttonSource,
    language: "tsx",
    path: "src/components/ui/button.tsx",
  },
  dropdowns: {
    code: dropdownMenuSource,
    language: "tsx",
    path: "src/components/ui/dropdown-menu.tsx",
  },
  inputs: {
    code: inputSource,
    language: "tsx",
    path: "src/components/ui/input.tsx",
  },
  slider: {
    code: sliderSource,
    language: "tsx",
    path: "src/components/ui/hito-slider.tsx",
  },
  tabs: {
    code: tabsSource,
    language: "typescript",
    path: "src/components/ui/hito-tabs.ts",
  },
} as const;

const HITO_DS_CODE_REFERENCES = {
  buttons: createReference({
    dependencies: [
      {
        kind: "Primitives",
        detail: "HitoButton composes the shared control contract; Icon is optional content.",
      },
      {
        kind: "Tokens",
        detail:
          "hito-button classes resolve semantic signal, chrome, radius, spacing, and motion tokens.",
      },
      {
        kind: "Behavior",
        detail:
          "Native button activation, disabled, loading, feedback, and timed-progress state stay wrapper-owned.",
      },
      {
        kind: "Accessibility",
        detail: "Use a native button and provide an accessible name for every icon-only action.",
      },
    ],
    source: HITO_DS_CODE_SOURCE_ALLOWLIST.buttons,
    usage: [
      'import { HitoButton } from "@/components/ui/button";',
      'import { Icon } from "@/components/ui/icon";',
      "",
      '<HitoButton type="button" size="md" variant="primary">',
      '  <Icon aria-hidden="true" name="plus" size="xs" />',
      "  Add workout",
      "</HitoButton>",
    ],
  }),
  dropdowns: createReference({
    dependencies: [
      {
        kind: "Primitives",
        detail:
          "The shared Radix-backed DropdownMenu wrappers compose HitoButton and Icon triggers or rows.",
      },
      {
        kind: "Tokens",
        detail:
          "hito-ui-menu surface, item, label, shortcut, separator, focus, and destructive roles are canonical.",
      },
      {
        kind: "Behavior",
        detail:
          "Portal placement, collision handling, focus transfer, Escape, selection, disabled rows, and submenus stay wrapper-owned.",
      },
      {
        kind: "Accessibility",
        detail:
          "Name the trigger, preserve menu semantics, and never replace keyboard navigation with click-only handlers.",
      },
    ],
    source: HITO_DS_CODE_SOURCE_ALLOWLIST.dropdowns,
    usage: [
      'import { HitoButton } from "@/components/ui/button";',
      "import {",
      "  DropdownMenu,",
      "  DropdownMenuContent,",
      "  DropdownMenuItem,",
      "  DropdownMenuTrigger,",
      '} from "@/components/ui/dropdown-menu";',
      "",
      "<DropdownMenu>",
      "  <DropdownMenuTrigger asChild>",
      '    <HitoButton type="button" size="sm" variant="secondary">Actions</HitoButton>',
      "  </DropdownMenuTrigger>",
      '  <DropdownMenuContent align="end">',
      "    <DropdownMenuItem>Edit workout</DropdownMenuItem>",
      "  </DropdownMenuContent>",
      "</DropdownMenu>",
    ],
  }),
  inputs: createReference({
    dependencies: [
      {
        kind: "Primitives",
        detail:
          "Input consumes the central field contract; label, helper, and error relationships belong to the composition.",
      },
      {
        kind: "Tokens",
        detail:
          "hito-field classes resolve semantic foreground, border, focus ring, feedback, size, and spacing roles.",
      },
      {
        kind: "Behavior",
        detail:
          "Native text entry, disabled, read-only, autocomplete, and validation behavior remain intact.",
      },
      {
        kind: "Accessibility",
        detail:
          "Connect a visible label and helper or error text with htmlFor, id, and aria-describedby.",
      },
    ],
    source: HITO_DS_CODE_SOURCE_ALLOWLIST.inputs,
    usage: [
      'import { Input } from "@/components/ui/input";',
      "",
      '<label className="hito-label-md" htmlFor="runner-name">Runner name</label>',
      "<Input",
      '  id="runner-name"',
      '  name="runnerName"',
      '  size="sm"',
      '  variant="primary"',
      '  aria-describedby="runner-name-helper"',
      "/>",
      '<p id="runner-name-helper" className="hito-field-helper">Shown on your profile.</p>',
    ],
  }),
  slider: createReference({
    dependencies: [
      {
        kind: "Primitives",
        detail:
          "HitoSlider owns the native range input, visible track, markers, bounds, output, and optional restore control.",
      },
      {
        kind: "Tokens",
        detail:
          "hito-slider and field roles resolve size, rail, fill, thumb, marker, focus, disabled, and helper styling.",
      },
      {
        kind: "Behavior",
        detail:
          "Value updates use the native input event; min, max, step, previous value, and marker bounds remain explicit.",
      },
      {
        kind: "Accessibility",
        detail:
          "Keep the visible label, native range semantics, helper relationship, and a truthful aria-valuetext.",
      },
    ],
    source: HITO_DS_CODE_SOURCE_ALLOWLIST.slider,
    usage: [
      'import { useState } from "react";',
      'import { HitoSlider } from "@/components/ui/hito-slider";',
      "",
      "const [effort, setEffort] = useState(5);",
      "",
      "<HitoSlider",
      '  label="Effort"',
      "  min={1}",
      "  max={10}",
      "  value={effort}",
      "  ariaValueText={`${effort} out of 10`}",
      "  onValueChange={setEffort}",
      "/>",
    ],
  }),
  tabs: createReference({
    dependencies: [
      {
        kind: "Primitives",
        detail:
          "useHitoTabs composes the shared selection mechanics with the canonical hito-tabs and hito-tab presentation.",
      },
      {
        kind: "Tokens",
        detail:
          "Simple or enclosed tab classes resolve semantic chrome, text, signal, focus, spacing, and responsive overflow.",
      },
      {
        kind: "Behavior",
        detail:
          "Selection state stays with the consumer while ArrowLeft, ArrowRight, Home, End, wrapping, and disabled-item skipping stay shared.",
      },
      {
        kind: "Accessibility",
        detail:
          "Preserve tablist, tab, tabpanel, aria-selected, aria-controls, focus movement, and roving tabIndex relationships.",
      },
    ],
    source: HITO_DS_CODE_SOURCE_ALLOWLIST.tabs,
    usage: [
      'import { useState } from "react";',
      'import { useHitoTabs } from "@/components/ui/hito-tabs";',
      "",
      'const items = [{ value: "plan" }, { value: "progress" }] as const;',
      'const [activeTab, setActiveTab] = useState<"plan" | "progress">("plan");',
      "const tabs = useHitoTabs({ items: [...items], value: activeTab });",
      "",
      "<>",
      '  <div className="hito-tabs hito-tabs-simple" {...tabs.tabListProps}>',
      "    {items.map(({ value }) => (",
      "      <button",
      "        key={value}",
      '        type="button"',
      '        className="hito-tab"',
      '        data-active={activeTab === value ? "true" : undefined}',
      "        {...tabs.getTabProps(value)}",
      "        onClick={() => setActiveTab(value)}",
      "      >",
      "        {value}",
      "      </button>",
      "    ))}",
      "  </div>",
      "  <div {...tabs.getPanelProps(activeTab)}>{activeTab} content</div>",
      "</>",
    ],
  }),
} as const satisfies Record<string, HitoDsCodeReference>;

export function getHitoDsCodeReference(id: string): HitoDsCodeReference | undefined {
  return HITO_DS_CODE_REFERENCES[id as keyof typeof HITO_DS_CODE_REFERENCES];
}

function createReference({
  dependencies,
  source,
  usage,
}: {
  dependencies: readonly HitoDsCodeDependency[];
  source: { code: string; language: HitoDsCodeLanguage; path: string };
  usage: readonly string[];
}): HitoDsCodeReference {
  return {
    dependencies,
    source: {
      code: source.code,
      label: "Source / Reference",
      language: source.language,
      sourcePath: source.path,
    },
    usage: {
      code: [ADAPTATION_NOTICE, "", ...usage].join("\n"),
      label: "Usage",
      language: "tsx",
    },
  };
}

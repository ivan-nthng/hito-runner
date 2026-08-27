import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  HITO_BUTTON_SIZES,
  HITO_BUTTON_TONES,
  HITO_BUTTON_TONES_BY_VARIANT,
  HITO_BUTTON_VARIANTS,
  HITO_CHOICE_TOGGLE_SIZES,
  HITO_FIELD_SIZES,
  HITO_FIELD_VARIANTS,
} from "../src/components/ui/hito-control-contract";
import {
  getHitoSelectionTabStop,
  moveHitoSelection,
  sanitizeHitoSelectionIdPart,
} from "../src/components/ui/hito-selection-mechanics";
import { HITO_MARK_META, HITO_MARK_SHAPES, HITO_MARK_SIZES } from "../src/components/ui/hito-mark";
import {
  WORKOUT_LIBRARY_CANONICAL_IDENTITY_COUNT,
  WORKOUT_LIBRARY_IDENTITY_COUNT,
} from "../src/components/hito-ds/workout-library-playground-data";
import { HITO_DS_MANIFEST as GENERATED_HITO_DS_MANIFEST } from "../src/generated/hito-ds-manifest";
import {
  HITO_INSPECTOR_TYPOGRAPHY_ROLES,
  HITO_TYPOGRAPHY_GROUPS,
  HITO_TYPOGRAPHY_ROLES,
} from "../src/lib/hito-typography-roles";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const calendarCssPath = path.join(rootDir, "src/styles/calendar-state-surfaces.css");
const controlsCssPath = path.join(rootDir, "src/styles/controls-lists.css");
const fieldBaseCssPath = path.join(rootDir, "src/styles/controls-fields.css");
const fieldsCssPath = path.join(rootDir, "src/styles/forms-onboarding.css");
const foundationsCssPath = path.join(rootDir, "src/styles/foundations.css");
const rootStylesCssPath = path.join(rootDir, "src/styles.css");
const typographyCssPath = path.join(rootDir, "src/styles/layout-typography.css");
const referenceWorkbenchCssPath = path.join(rootDir, "src/styles/reference-workbench.css");
const shellCssPath = path.join(rootDir, "src/styles/shell-admin-analytics.css");
const generatedManifestPath = path.join(rootDir, "src/generated/hito-ds-manifest.json");
const manifestGeneratorPath = path.join(rootDir, "scripts/generate-hito-ds-manifest.mjs");
const retiredFoundationProofPath = path.join(
  rootDir,
  "scripts/validate-hito-ds-foundation-cleanup.mjs",
);
const sourceExtensions = new Set([".css", ".json", ".ts", ".tsx"]);
const retiredClasses = [
  "hito-button-xl",
  "hito-field-xl",
  "hito-choice-toggle-md",
  "hito-choice-toggle-xl",
] as const;
const componentClassResolvers = [
  "hitoButtonClasses",
  "hitoChoiceToggleClasses",
  "hitoFieldClasses",
] as const;
const showcaseImportPrefixes = ["@/components/hito-ds/", "@/routes/hitoDS"] as const;
const devtoolsReferenceMetadataImport = "@/components/hito-ds/reference-metadata";
const demoStatePrimitiveAllowlist = new Set([
  "src/components/ui/editable-value-field.tsx",
  "src/components/ui/hito-calendar-day.tsx",
  "src/components/ui/inline-editable-text.tsx",
]);
const sharedFieldOwnerMarkers = [
  ".hito-field-xs",
  ".hito-field-sm",
  ".hito-field-md",
  ".hito-field-lg",
  ".hito-field-control",
  ".hito-field-icon",
  ".hito-field-helper",
  ".hito-field-error",
  ".hito-field-success",
  ".hito-textarea-md",
  ".hito-date-field-control",
  ".hito-editable-value-field-group",
] as const;
const selectionMechanicsOwner = "src/components/ui/hito-selection-mechanics.ts";
const selectionMechanicsImporters = new Set([
  "src/components/ui/hito-radio-group.ts",
  "src/components/ui/hito-tabs.ts",
]);
const selectionMechanicsImplementationMarkers = [
  'value.replace(/[^a-zA-Z0-9_-]/g, "-")',
  "const nextIndex = (startIndex + offset + enabledItems.length) % enabledItems.length;",
] as const;
const workbenchSettingsOwner = "src/components/hito-ds/workbench-settings-controls.tsx";
const workbenchSettingsImporters = new Set([
  "src/components/hito-ds/calendar-workout-playground-data.ts",
  "src/components/hito-ds/calendar-workout-playground.tsx",
  "src/components/hito-ds/factual-activity-point-sequence-playground.tsx",
  "src/components/hito-ds/factual-bar-chart-playground.tsx",
  "src/components/hito-ds/reference-components-structure.tsx",
  "src/components/hito-ds/reference-patterns-page.tsx",
  "src/components/hito-ds/workout-library-playground-data.ts",
  "src/components/hito-ds/workout-library-playground.tsx",
]);
const workbenchSettingsFormerOwners = new Set([
  "src/components/hito-ds/calendar-workout-playground.tsx",
  "src/components/hito-ds/workout-library-playground.tsx",
]);
const workbenchPrimitiveBypassMarkers = [
  "@/components/ui/hito-choice-toggle",
  "@/components/ui/hito-radio-group",
  "@/components/ui/select",
  "<HitoChoiceToggle",
  "useHitoRadioGroup(",
  "<SelectContent",
  "<SelectItem",
  "<SelectTrigger",
  "<SelectValue",
] as const;
const retiredFoundationTokens = ["--easy", "--long", "--quality", "--rest"] as const;
const retiredFoundationSelectors = [
  "hito-ui-card",
  "hito-ui-sidebar-panel",
  "hito-analytics-grid",
  "hito-chart-hover-note",
  "hito-calendar-mobile-date-main",
  "hito-manual-workout-menu-template",
  "hito-onboarding-option-row-button",
  "hito-window-scroll-fill",
  "hito-window-header",
  "hito-window-header-compact",
  "hito-window-header-large",
  "hito-window-close",
  "hito-window-body",
  "hito-window-body-scroll",
  "hito-window-footer",
  "hito-window-footer-actions",
  "hito-window-footer-note",
] as const;
const retiredWorkoutColorApiMarkers = [
  "WORKOUT_COLOR_SHADE_STEPS",
  "WorkoutColorShadeStep",
  "WorkoutPrimitivePaletteId",
  "WORKOUT_PRIMITIVE_PALETTE_FAMILIES",
  "workoutPrimitiveColorToken",
  "workoutPrimitiveColorVar",
] as const;
const retiredWorkoutReferenceMarkers = [
  "WORKOUT_PRIMITIVE_COLOR_GROUPS",
  "dedicated workout shade scales",
  "mapped to primitives",
  "role.primitive",
] as const;
const workoutTypeRoleNames = [
  "rest",
  "recovery",
  "easy",
  "steady",
  "long-run",
  "progression",
  "tempo",
  "intervals",
  "race",
  "hills",
  "trail",
  "run-walk",
] as const;
const workoutTypeSlotNames = [
  "base",
  "foreground",
  "content",
  "muted",
  "surface",
  "hover",
  "active",
  "border",
  "ring",
] as const;
const expectedMarkNames = [
  "rest",
  "recovery",
  "easy",
  "steady",
  "long",
  "tempo",
  "intervals",
  "progression",
  "race",
  "hills",
  "trail",
  "hito-running",
  "admin",
  "design-system",
  "changelog",
] as const;
const referenceManualRecipePatterns = [
  {
    family: "Button",
    pattern: /(?:className|buttonClassName)\s*=\s*["'][^"']*\bhito-button(?=[\s"'])[^"']*["']/g,
  },
  {
    family: "Button",
    pattern:
      /(?:className|buttonClassName)\s*=\s*\{cn\([\s\S]{0,240}?["'][^"']*\bhito-button(?=[\s"'])[^"']*["']/g,
  },
  {
    family: "Choice Toggle",
    pattern:
      /(?:className|buttonClassName)\s*=\s*["'][^"']*\bhito-choice-toggle(?=[\s"'])[^"']*["']/g,
  },
  {
    family: "Choice Toggle",
    pattern: /buttonClassName\s*=\s*["'][^"']*\bhito-choice-toggle-(?!group)[^"']*["']/g,
  },
  {
    family: "Choice Toggle",
    pattern:
      /(?:className|buttonClassName)\s*=\s*\{cn\([\s\S]{0,240}?["'][^"']*\bhito-choice-toggle(?=[\s"'])[^"']*["']/g,
  },
  {
    family: "Field",
    pattern: /(?:className|buttonClassName)\s*=\s*["'][^"']*\bhito-field(?=[\s"'])[^"']*["']/g,
  },
  {
    family: "Field",
    pattern:
      /(?:className|buttonClassName)\s*=\s*\{cn\([\s\S]{0,240}?["'][^"']*\bhito-field(?=[\s"'])[^"']*["']/g,
  },
] as const;

type SourceFile = {
  content: string;
  relativePath: string;
};

type GeneratedColorProvenance = {
  aliasChain: string[];
  alpha: number | null;
  kind: "alias" | "alpha" | "formula" | "primitive" | "transparent";
  references: Array<{ cssVariable: string; percentage: number | null }>;
  source: string;
};

type GeneratedManifest = {
  schemaVersion: number;
  collections: {
    primitiveColor: Array<{
      alias: string | null;
      cssVariable: string;
      id: string;
      provenance: GeneratedColorProvenance;
      value: string;
    }>;
    primitiveSpacing: Array<{ cssVariable: string; id: string }>;
    semanticColor: Array<{
      channels: Array<"border" | "fill" | "text">;
      cssVariable: string;
      id: string;
      label: string;
      modes: Record<
        "dark" | "light",
        { alias: string | null; provenance: GeneratedColorProvenance; value: string }
      >;
    }>;
    [key: string]: unknown;
  };
  sourceDigest?: string;
  textStyles: Array<{
    className: string;
    id: string;
    properties: Record<string, string>;
  }>;
};

const errors: string[] = [];

function expect(condition: boolean, message: string) {
  if (!condition) errors.push(message);
}

async function pathExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function collectSourceFiles(directory: string): Promise<SourceFile[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry): Promise<SourceFile[]> => {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) return collectSourceFiles(absolutePath);
      if (!sourceExtensions.has(path.extname(entry.name))) return [];

      return [
        {
          content: await readFile(absolutePath, "utf8"),
          relativePath: path.relative(rootDir, absolutePath),
        },
      ];
    }),
  );

  return files.flat();
}

function filesContaining(files: SourceFile[], marker: string) {
  return files.filter((file) => file.content.includes(marker));
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function declaresSelector(css: string, selector: string) {
  const escaped = escapeRegExp(selector);
  return new RegExp(`^\\s*${escaped}(?=\\s|\\{|,|:)`, "m").test(css);
}

function selectorDeclarations(css: string, selector: string) {
  const escaped = escapeRegExp(selector);
  const match = css.match(new RegExp(`^\\s*${escaped}\\s*\\{([^}]*)\\}`, "m"));
  if (!match) return null;

  return Object.fromEntries(
    [...match[1].matchAll(/([a-z-]+)\s*:\s*([^;]+);/gi)].map((declaration) => [
      declaration[1],
      declaration[2].replace(/\s+/g, " ").trim(),
    ]),
  );
}

function validateCssSelectors(css: string, family: string, values: readonly string[]) {
  values.forEach((value) => {
    expect(css.includes(`.${family}-${value}`), `Missing CSS contract: ${family}-${value}`);
  });
}

function retiredClassFindings(files: SourceFile[]) {
  return retiredClasses.flatMap((className) =>
    filesContaining(files, className).map((file) => `${className} in ${file.relativePath}`),
  );
}

function referenceManualRecipeFindings(files: SourceFile[]) {
  return files
    .filter(
      (file) =>
        file.relativePath.startsWith("src/components/hito-ds/") ||
        file.relativePath.startsWith("src/components/devtools/"),
    )
    .flatMap((file) => {
      // The capture board's inert select trigger is export geometry, not a live control.
      const content =
        file.relativePath === "src/components/hito-ds/figma-export-board.tsx"
          ? file.content.replace(
              /function StaticSelectTrigger[\s\S]*?(?=\nfunction StaticMenuItem)/,
              "",
            )
          : file.content;

      const applicablePatterns = file.relativePath.startsWith("src/components/devtools/")
        ? referenceManualRecipePatterns.filter(({ family }) => family === "Button")
        : referenceManualRecipePatterns;

      return applicablePatterns.flatMap(({ family, pattern }) =>
        Array.from(content.matchAll(pattern), () => `${family} in ${file.relativePath}`),
      );
    });
}

function sharedFieldOwnerLeakFindings(css: string) {
  return sharedFieldOwnerMarkers.filter((marker) => declaresSelector(css, marker));
}

function selectionMechanicsImportFindings(files: SourceFile[]) {
  return files
    .filter((file) => file.content.includes("hito-selection-mechanics"))
    .filter((file) => !selectionMechanicsImporters.has(file.relativePath));
}

function selectionMechanicsImplementationFindings(files: SourceFile[]) {
  return files
    .filter((file) => file.relativePath !== selectionMechanicsOwner)
    .flatMap((file) =>
      selectionMechanicsImplementationMarkers
        .filter((marker) => file.content.includes(marker))
        .map((marker) => ({ marker, relativePath: file.relativePath })),
    );
}

function workbenchSettingsImportFindings(files: SourceFile[]) {
  return files
    .filter((file) => file.content.includes("hito-ds/workbench-settings-controls"))
    .filter((file) => !workbenchSettingsImporters.has(file.relativePath));
}

function workbenchPrimitiveBypassFindings(files: SourceFile[]) {
  return files
    .filter((file) => workbenchSettingsFormerOwners.has(file.relativePath))
    .flatMap((file) =>
      workbenchPrimitiveBypassMarkers
        .filter((marker) => file.content.includes(marker))
        .map((marker) => ({ marker, relativePath: file.relativePath })),
    );
}

function retiredFoundationTokenFindings(files: SourceFile[]) {
  return retiredFoundationTokens.flatMap((token) => {
    const pattern = new RegExp(`${escapeRegExp(token)}(?![a-z0-9-])`, "i");
    return files
      .filter((file) => pattern.test(file.content))
      .map((file) => ({ relativePath: file.relativePath, token }));
  });
}

function retiredFoundationSelectorFindings(files: SourceFile[]) {
  return retiredFoundationSelectors.flatMap((selector) =>
    files
      .filter((file) => file.content.includes(selector))
      .map((file) => ({ relativePath: file.relativePath, selector })),
  );
}

function showcaseBoundaryLeakFindings(files: SourceFile[]) {
  return files.flatMap((file) => {
    const showcaseSpecifiers = Array.from(
      file.content.matchAll(/(?:from\s+|import\s*(?:\(\s*)?)["']([^"']+)["']/g),
      (match) => match[1],
    ).filter((specifier) => isShowcaseImport(file.relativePath, specifier));
    if (showcaseSpecifiers.length === 0) return [];

    const isReferenceOwner =
      file.relativePath.startsWith("src/components/hito-ds/") ||
      /^src\/routes\/hitoDS(?:[._]|\.tsx$)/.test(file.relativePath);
    const isAllowedDevtoolsMetadataConsumer =
      file.relativePath.startsWith("src/components/devtools/") &&
      showcaseSpecifiers.every((specifier) => specifier === devtoolsReferenceMetadataImport);

    return isReferenceOwner || isAllowedDevtoolsMetadataConsumer
      ? []
      : [{ ...file, showcaseSpecifiers }];
  });
}

function isShowcaseImport(relativePath: string, specifier: string) {
  if (showcaseImportPrefixes.some((prefix) => specifier.startsWith(prefix))) return true;
  if (!specifier.startsWith(".")) return false;

  const resolvedSpecifier = path.posix.normalize(
    path.posix.join(path.posix.dirname(relativePath), specifier),
  );
  return (
    resolvedSpecifier.startsWith("src/components/hito-ds/") ||
    /^src\/routes\/hitoDS(?:[._]|$)/.test(resolvedSpecifier)
  );
}

function validateSelfTest() {
  const synthetic = [
    { relativePath: "synthetic/button.tsx", content: 'className="hito-button-xl"' },
    { relativePath: "synthetic/field.tsx", content: 'className="hito-field-xl"' },
    { relativePath: "synthetic/choice.tsx", content: 'className="hito-choice-toggle-md"' },
    { relativePath: "synthetic/choice-xl.tsx", content: 'className="hito-choice-toggle-xl"' },
  ];
  const findings = retiredClassFindings(synthetic);
  expect(findings.length === 4, "Self-test failed to detect every retired control class.");

  const manualFindings = referenceManualRecipeFindings([
    {
      relativePath: "src/components/hito-ds/synthetic.tsx",
      content: [
        '<button className="hito-button hito-button-primary hito-button-sm">Test</button>',
        '<ThemeControl buttonClassName="hito-choice-toggle-xs flex-1" />',
      ].join("\n"),
    },
    {
      relativePath: "src/components/devtools/synthetic.tsx",
      content: '<button className="hito-button hito-button-secondary hito-button-sm">Copy</button>',
    },
  ]);
  expect(manualFindings.length === 3, "Self-test failed to detect manual control CSS.");

  const fieldLeakFindings = sharedFieldOwnerLeakFindings(".hito-field-xs { min-height: 1rem; }");
  expect(
    fieldLeakFindings.length === 1 && fieldLeakFindings[0] === ".hito-field-xs",
    "Self-test failed to detect shared Field CSS in a domain owner.",
  );

  const showcaseLeaks = showcaseBoundaryLeakFindings([
    {
      relativePath: "src/routes/synthetic-product.tsx",
      content: 'import { Demo } from "@/components/hito-ds/playground";',
    },
    {
      relativePath: "src/components/devtools/synthetic.ts",
      content: 'import type { Evidence } from "@/components/hito-ds/reference-metadata";',
    },
    {
      relativePath: "src/components/product/synthetic.tsx",
      content: 'import { HitoDesignSystemReferencePage } from "@/routes/hitoDS";',
    },
    {
      relativePath: "src/components/devtools/synthetic-playground.tsx",
      content: 'import { Demo } from "@/components/hito-ds/playground";',
    },
    {
      relativePath: "src/routes/synthetic-relative-product.tsx",
      content: 'import { Demo } from "../components/hito-ds/playground";',
    },
  ]);
  expect(
    showcaseLeaks.length === 4 &&
      showcaseLeaks.some((file) => file.relativePath === "src/routes/synthetic-product.tsx") &&
      showcaseLeaks.some((file) => file.relativePath === "src/components/product/synthetic.tsx") &&
      showcaseLeaks.some(
        (file) => file.relativePath === "src/components/devtools/synthetic-playground.tsx",
      ) &&
      showcaseLeaks.some(
        (file) => file.relativePath === "src/routes/synthetic-relative-product.tsx",
      ),
    "Self-test failed to detect Product dependency on a showcase-only owner.",
  );

  const selectionImportLeaks = selectionMechanicsImportFindings([
    {
      relativePath: "src/components/product/synthetic-selection.tsx",
      content: 'import { moveHitoSelection } from "@/components/ui/hito-selection-mechanics";',
    },
  ]);
  expect(
    selectionImportLeaks.length === 1,
    "Self-test failed to detect a direct non-owner selection-mechanics import.",
  );

  const selectionImplementationLeaks = selectionMechanicsImplementationFindings([
    {
      relativePath: "src/components/ui/synthetic-selection.ts",
      content:
        "const nextIndex = (startIndex + offset + enabledItems.length) % enabledItems.length;",
    },
  ]);
  expect(
    selectionImplementationLeaks.length === 1,
    "Self-test failed to detect renamed or inline selection ring duplication.",
  );

  const workbenchImportLeaks = workbenchSettingsImportFindings([
    {
      relativePath: "src/routes/synthetic-workbench.tsx",
      content:
        'import { HitoDsWorkbenchChoiceControl } from "@/components/hito-ds/workbench-settings-controls";',
    },
  ]);
  expect(
    workbenchImportLeaks.length === 1,
    "Self-test failed to detect a workbench settings owner leak.",
  );

  const workbenchRecipeLeaks = workbenchPrimitiveBypassFindings([
    {
      relativePath: "src/components/hito-ds/calendar-workout-playground.tsx",
      content: "const AlternateChoice = () => <HitoChoiceToggle />;",
    },
  ]);
  expect(
    workbenchRecipeLeaks.length === 1,
    "Self-test failed to detect a renamed workbench settings primitive bypass.",
  );
  expect(
    workbenchPrimitiveBypassFindings([
      {
        relativePath: "src/routes/synthetic-product.tsx",
        content: "function ChoiceControl<T extends string>() {}",
      },
    ]).length === 0,
    "Self-test incorrectly rejected an unrelated same-name Product control.",
  );

  expect(
    retiredFoundationTokenFindings([
      { relativePath: "src/styles/synthetic.css", content: "color: var(--easy);" },
    ]).length === 1,
    "Self-test failed to detect a retired foundation token.",
  );
  expect(
    retiredFoundationSelectorFindings([
      { relativePath: "src/components/synthetic.tsx", content: 'className="hito-window-body"' },
    ]).length === 1,
    "Self-test failed to detect a retired foundation selector.",
  );
}

function validateSelectionMechanics() {
  const items = [
    { value: "first" },
    { value: "disabled", disabled: true },
    { value: "last" },
  ] as const;
  const disabledItems = items.map((item) => ({ ...item, disabled: true }));

  expect(
    getHitoSelectionTabStop(items, "last") === "last" &&
      getHitoSelectionTabStop(items, "disabled") === "first" &&
      getHitoSelectionTabStop(items, null) === "first" &&
      getHitoSelectionTabStop(
        items as readonly { value: string; disabled?: boolean }[],
        "missing",
      ) === "first",
    "Selection tab stop must retain an enabled current value and fall back from disabled values.",
  );
  expect(
    getHitoSelectionTabStop(disabledItems, "first") === undefined &&
      getHitoSelectionTabStop([], null) === undefined,
    "Selection tab stop must stay absent for disabled-only and empty collections.",
  );
  expect(
    moveHitoSelection(items, "first", "next") === "last" &&
      moveHitoSelection(items, "last", "next") === "first" &&
      moveHitoSelection(items, "first", "previous") === "last" &&
      moveHitoSelection(items, "last", "first") === "first" &&
      moveHitoSelection(items, "first", "last") === "last",
    "Selection movement must skip disabled items and wrap in both directions.",
  );
  expect(
    moveHitoSelection(disabledItems, "first", "next") === null &&
      moveHitoSelection([], "first", "next") === null,
    "Selection movement must stay inert for disabled-only and empty collections.",
  );
  expect(
    sanitizeHitoSelectionIdPart(":r1:/item value") === "-r1--item-value" &&
      sanitizeHitoSelectionIdPart("already_safe-1") === "already_safe-1",
    "Selection IDs must preserve the established safe suffix normalization.",
  );
}

const sourceFiles = (
  await Promise.all([
    collectSourceFiles(path.join(rootDir, "src/components")),
    collectSourceFiles(path.join(rootDir, "src/generated")),
    collectSourceFiles(path.join(rootDir, "src/lib")),
    collectSourceFiles(path.join(rootDir, "src/routes")),
    collectSourceFiles(path.join(rootDir, "src/styles")),
  ])
).flat();
const retiredTypographyClassNames = [
  "hito-ui-page-title",
  "hito-ui-modal-title",
  "hito-ui-section-title",
  "hito-ui-panel-title",
  "hito-display-title",
  "hito-page-title",
  "hito-modal-title",
  "hito-section-title",
  "hito-panel-title",
  "hito-page-copy",
  "hito-body",
  "hito-body-small",
  "hito-section-subtitle",
  "hito-support-copy",
  "hito-caption",
  "hito-form-label",
  "hito-micro-label",
  "hito-technical-mono",
  "hito-label",
] as const;
const retiredTypographyClassFindings = sourceFiles.flatMap((file) =>
  retiredTypographyClassNames
    .filter((className) =>
      new RegExp(`(?:^|[^a-zA-Z0-9_-])${escapeRegExp(className)}(?![a-zA-Z0-9_-])`).test(
        file.content,
      ),
    )
    .map((className) => `${file.relativePath}: ${className}`),
);
const foundationSearchFiles = (await collectSourceFiles(path.join(rootDir, "src"))).filter((file) =>
  /\.(css|ts|tsx)$/.test(file.relativePath),
);
const typographyProvenanceIds = new Set(
  foundationSearchFiles.flatMap((file) =>
    [...file.content.matchAll(/--hito-typography-role\s*:\s*([a-z0-9-]+)/g)].map(
      (match) => match[1],
    ),
  ),
);
const localUiInspectorTargets = foundationSearchFiles.find(
  (file) => file.relativePath === "src/components/devtools/local-ui-inspector-targets.ts",
);
const calendarCss = await readFile(calendarCssPath, "utf8");
const controlsCss = await readFile(controlsCssPath, "utf8");
const fieldBaseCss = await readFile(fieldBaseCssPath, "utf8");
const fieldExtendedCss = await readFile(fieldsCssPath, "utf8");
const foundationsCss = await readFile(foundationsCssPath, "utf8");
const rootStylesCss = await readFile(rootStylesCssPath, "utf8");
const typographyCss = await readFile(typographyCssPath, "utf8");
const referenceWorkbenchCss = await readFile(referenceWorkbenchCssPath, "utf8");
const shellCss = await readFile(shellCssPath, "utf8");
const generatedManifest = JSON.parse(
  await readFile(generatedManifestPath, "utf8"),
) as GeneratedManifest;
const manifestGeneratorSource = await readFile(manifestGeneratorPath, "utf8");
const redundantFoundationProofExists = await pathExists(retiredFoundationProofPath);
const currentReferenceDocs = await Promise.all(
  ["docs/current-product.md", "docs/current-system.md", "docs/current-state.md"].map(
    async (relativePath) => ({
      content: await readFile(path.join(rootDir, relativePath), "utf8"),
      relativePath,
    }),
  ),
);
const hitoDsRoute = sourceFiles.find((file) => file.relativePath === "src/routes/hitoDS.tsx");
const hitoCalendarDaySource = sourceFiles.find(
  (file) => file.relativePath === "src/components/ui/hito-calendar-day.tsx",
);
const selectSource = sourceFiles.find(
  (file) => file.relativePath === "src/components/ui/select.tsx",
);
const popoverSource = sourceFiles.find(
  (file) => file.relativePath === "src/components/ui/popover.tsx",
);
const valueTagSource = sourceFiles.find(
  (file) => file.relativePath === "src/components/ui/value-tag.tsx",
);
const overlaysFeedbackSource = sourceFiles.find(
  (file) => file.relativePath === "src/styles/overlays-feedback.css",
);
const referencePatternsSource = sourceFiles.find(
  (file) => file.relativePath === "src/components/hito-ds/reference-patterns-page.tsx",
);
const referenceBrandSource = sourceFiles.find(
  (file) => file.relativePath === "src/components/hito-ds/reference-brand-page.tsx",
);
const navigationCardSource = sourceFiles.find(
  (file) => file.relativePath === "src/components/ui/hito-navigation-card.tsx",
);
const factualBarChartSource = sourceFiles.find(
  (file) => file.relativePath === "src/components/ui/hito-factual-bar-chart.tsx",
);
const factualBarChartPlaygroundSource = sourceFiles.find(
  (file) => file.relativePath === "src/components/hito-ds/factual-bar-chart-playground.tsx",
);
const factualActivityPointSequenceSource = sourceFiles.find(
  (file) => file.relativePath === "src/components/ui/hito-factual-activity-point-sequence.tsx",
);
const factualActivityPointSequencePlaygroundSource = sourceFiles.find(
  (file) =>
    file.relativePath === "src/components/hito-ds/factual-activity-point-sequence-playground.tsx",
);
const referenceOverviewSource = sourceFiles.find(
  (file) => file.relativePath === "src/components/hito-ds/reference-overview-page.tsx",
);
const hubRoute = sourceFiles.find((file) => file.relativePath === "src/routes/hub.tsx");
const showcaseBoundaryLeaks = showcaseBoundaryLeakFindings(sourceFiles);
const targetTypographyRoleIds = [
  "ui-title-xl",
  "ui-title-lg",
  "ui-title-md",
  "ui-title-sm",
  "ui-title-xs",
  "display-title-xl",
  "display-title-lg",
  "body-lg",
  "body-md",
  "body-sm",
  "body-xs",
  "label-md",
  "label-sm",
  "technical-sm",
] as const;
const componentBoundTypographyRoleIds = ["button", "nav-menu", "metric", "status"] as const;
const retiredTypographyRoleIds = [
  "ui-page-title",
  "ui-modal-title",
  "ui-section-title",
  "ui-panel-title",
  "display-title",
  "page-title",
  "modal-title",
  "section-title",
  "panel-title",
  "list-row-title",
  "body",
  "body-small",
  "helper",
  "caption",
  "label",
  "form-label",
  "micro-label",
  "technical-mono",
  "error-success",
] as const;
const targetTypographyRoles = HITO_TYPOGRAPHY_ROLES.filter((role) => role.figmaTextStyle);
const componentBoundTypographyRoles = HITO_TYPOGRAPHY_ROLES.filter(
  (role) => role.group === "component-bound",
);
const legacyTypographyBridgeRoles = HITO_TYPOGRAPHY_ROLES.filter(
  (role) => String(role.group) === "legacy-bridge",
);
const typographyFamilySpecimens = HITO_TYPOGRAPHY_GROUPS.flatMap((group) =>
  group.familySpecimen ? [group.familySpecimen] : [],
);
const typographyRolesById = new Map(HITO_TYPOGRAPHY_ROLES.map((role) => [role.id, role]));
const neutralChromeTokenIds = [
  "chrome-clear",
  "chrome-subtle",
  "chrome-standard",
  "chrome-strong",
  "chrome-edge-default",
  "chrome-edge-emphasis",
  "text-secondary",
  "text-tertiary",
  "text-disabled",
  "text-accent",
  "text-positive",
  "text-negative",
  "text-informative",
  "text-warning",
] as const;
const primitiveColorExportSection = foundationsCss.match(
  /\/\* @hito-export-start primitive-color \*\/([\s\S]*?)\/\* @hito-export-end primitive-color \*\//,
)?.[1];
const exportedPrimitiveColorIds = [
  ...(primitiveColorExportSection?.matchAll(/(--[a-z0-9-]+)\s*:/gi) ?? []),
].map((match) => match[1].slice(2));
const semanticColorExportSection = foundationsCss.match(
  /\/\* @hito-export-start semantic-color-dark \*\/([\s\S]*?)\/\* @hito-export-end semantic-color-dark \*\//,
)?.[1];
const exportedSemanticColorIds = [
  ...(semanticColorExportSection?.matchAll(/(--[a-z0-9-]+)\s*:/gi) ?? []),
].map((match) => match[1].slice(2));
const semanticColorChannelVocabulary = new Set(["text", "fill", "border"]);
const colorProvenanceKindVocabulary = new Set([
  "alias",
  "alpha",
  "formula",
  "primitive",
  "transparent",
]);
const isValidColorProvenance = (provenance: GeneratedColorProvenance, value: string) =>
  colorProvenanceKindVocabulary.has(provenance.kind) &&
  provenance.source === value &&
  Array.isArray(provenance.aliasChain) &&
  (provenance.alpha === null ||
    (Number.isFinite(provenance.alpha) && provenance.alpha >= 0 && provenance.alpha <= 1)) &&
  provenance.references.every(
    (reference) =>
      /^--[a-z0-9-]+$/.test(reference.cssVariable) &&
      (reference.percentage === null ||
        (Number.isFinite(reference.percentage) &&
          reference.percentage >= 0 &&
          reference.percentage <= 100)),
  );
const semanticColorMetadataOwners = [
  ...(manifestGeneratorSource.match(/const SEMANTIC_COLOR_CHANNELS\s*=/g) ?? []).map(
    () => "scripts/generate-hito-ds-manifest.mjs",
  ),
  ...sourceFiles
    .filter((file) => file.content.includes("SEMANTIC_COLOR_CHANNELS"))
    .map((file) => file.relativePath),
];
const expectedSemanticSectionOrder = [
  "Surfaces",
  "Borders",
  "Typography",
  "Neutral chrome / overlays",
  "Actions",
  "Status / intent",
] as const;
expect(
  generatedManifest.schemaVersion === 2,
  `Expected additive Hito DS manifest schema version 2, received ${generatedManifest.schemaVersion}.`,
);
expect(
  JSON.stringify(GENERATED_HITO_DS_MANIFEST) === JSON.stringify(generatedManifest),
  "Generated TypeScript and JSON manifests must remain structurally identical.",
);
expect(
  semanticColorExportSection !== undefined &&
    JSON.stringify(
      [...generatedManifest.collections.semanticColor.map((token) => token.id)].sort(),
    ) === JSON.stringify([...exportedSemanticColorIds].sort()),
  "Generated semantic colors must cover every exported Foundation semantic role.",
);
expect(
  generatedManifest.collections.semanticColor.every(
    (token) =>
      token.label ===
        token.id
          .split("-")
          .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
          .join(" ") &&
      token.channels.length > 0 &&
      new Set(token.channels).size === token.channels.length &&
      token.channels.every((channel) => semanticColorChannelVocabulary.has(channel)),
  ),
  "Every generated semantic color must have its deterministic label and valid non-empty channel metadata.",
);
expect(
  generatedManifest.collections.primitiveColor.every((token) =>
    isValidColorProvenance(token.provenance, token.value),
  ) &&
    generatedManifest.collections.semanticColor.every((token) =>
      (["dark", "light"] as const).every((mode) =>
        isValidColorProvenance(token.modes[mode].provenance, token.modes[mode].value),
      ),
    ),
  "Every generated primitive and semantic mode must retain valid generator-owned authored color provenance.",
);
const darkSemanticColors = new Map(
  generatedManifest.collections.semanticColor.map((token) => [token.id, token.modes.dark]),
);
expect(
  generatedManifest.collections.primitiveColor.find((token) => token.id === "sand-alpha-08")
    ?.provenance.kind === "alpha" &&
    generatedManifest.collections.primitiveColor.find((token) => token.id === "sand-alpha-08")
      ?.provenance.alpha === 0.08 &&
    darkSemanticColors.get("border")?.provenance.kind === "alias" &&
    darkSemanticColors.get("border")?.provenance.aliasChain.includes("sand-alpha-08") === true &&
    darkSemanticColors.get("border")?.provenance.alpha === 0.08 &&
    darkSemanticColors.get("chrome-subtle")?.provenance.kind === "formula" &&
    darkSemanticColors.get("chrome-subtle")?.provenance.references.length === 1 &&
    darkSemanticColors.get("chrome-subtle")?.provenance.references[0]?.percentage === 8 &&
    darkSemanticColors.get("chrome-subtle")?.provenance.alpha === 0.08 &&
    darkSemanticColors.get("text-accent")?.provenance.kind === "formula" &&
    darkSemanticColors.get("text-accent")?.provenance.references.length === 2 &&
    darkSemanticColors.get("text-accent")?.provenance.alpha === null,
  "Generated provenance must distinguish alpha primitives, direct aliases, single-source transparent mixes, and multi-source mixes.",
);
expect(
  semanticColorMetadataOwners.length === 1 &&
    semanticColorMetadataOwners[0] === "scripts/generate-hito-ds-manifest.mjs",
  `Semantic color channel metadata must have one generator owner: ${semanticColorMetadataOwners.join(", ") || "none"}.`,
);
expect(
  neutralChromeTokenIds.every((id) =>
    generatedManifest.collections.semanticColor.some((token) => token.id === id),
  ),
  "The generated manifest must retain the canonical neutral chrome and content roles.",
);
expect(
  generatedManifest.collections.semanticColor.every(
    (token) => token.id !== "secondary" && token.id !== "secondary-foreground",
  ),
  "Retired secondary foundation color roles returned to the manifest.",
);
expect(
  selectSource?.content.includes("hitoFieldClasses({") === true &&
    selectSource.content.includes('className="opacity-50"') === false &&
    overlaysFeedbackSource?.content.includes(".hito-ui-select-trigger:hover") === false &&
    fieldBaseCss.includes("background: var(--color-chrome-subtle);") &&
    fieldBaseCss.includes("color: var(--color-text-tertiary);") &&
    fieldBaseCss.includes("box-shadow: 0 0 0 2px var(--color-ring);"),
  "Select must reuse the tokenized Field contract without reviving duplicate chrome or attenuated icon opacity.",
);

expect(
  JSON.stringify(targetTypographyRoles.map((role) => role.id)) ===
    JSON.stringify(targetTypographyRoleIds),
  `Reusable typography target order drifted: ${targetTypographyRoles.map((role) => role.id).join(", ")}.`,
);
expect(
  JSON.stringify(HITO_INSPECTOR_TYPOGRAPHY_ROLES.map((role) => role.id)) ===
    JSON.stringify(targetTypographyRoleIds),
  `Local Inspector replacement roles must exactly match the 14-role target: ${HITO_INSPECTOR_TYPOGRAPHY_ROLES.map((role) => role.id).join(", ")}.`,
);
expect(
  JSON.stringify(componentBoundTypographyRoles.map((role) => role.id)) ===
    JSON.stringify(componentBoundTypographyRoleIds),
  `Component-bound typography must remain Button, Nav/Menu, Metric, and Status only: ${componentBoundTypographyRoles.map((role) => role.id).join(", ")}.`,
);
expect(
  componentBoundTypographyRoles.every(
    (role) => role.figmaTextStyle === false && role.inspectorSelectable === false,
  ),
  "Component-bound typography must stay recognition-only and outside Text Style export.",
);
expect(
  HITO_TYPOGRAPHY_ROLES.length === 18 && legacyTypographyBridgeRoles.length === 0,
  `The final typography registry must contain 14 reusable and four component-bound roles with no legacy bridge; received ${HITO_TYPOGRAPHY_ROLES.length} total and ${legacyTypographyBridgeRoles.length} legacy.`,
);
expect(
  retiredTypographyClassFindings.length === 0,
  `Retired typography class reachability returned:\n${retiredTypographyClassFindings.join("\n")}`,
);
expect(
  retiredTypographyRoleIds.every((roleId) => !typographyProvenanceIds.has(roleId)) &&
    JSON.stringify([...typographyProvenanceIds].sort()) ===
      JSON.stringify([...targetTypographyRoleIds, ...componentBoundTypographyRoleIds].sort()),
  `Typography provenance must contain only the 14 reusable and four component-bound roles; received ${[...typographyProvenanceIds].sort().join(", ")}.`,
);
expect(
  rootStylesCss.includes(
    "family=Fraunces:opsz,wght@9..144,400&family=JetBrains+Mono:wght@400;500&family=Poppins:wght@400;500;600&display=swap",
  ) &&
    !rootStylesCss.includes("wght@300") &&
    !rootStylesCss.includes("300;"),
  "Google Fonts must request only reachable weights: Fraunces 400, JetBrains Mono 400/500, and Poppins 400/500/600.",
);
expect(
  JSON.stringify(typographyFamilySpecimens.map((specimen) => specimen.family)) ===
    JSON.stringify(["Poppins", "Fraunces", "JetBrains Mono"]),
  `Typography family specimens must derive from the central group registry: ${typographyFamilySpecimens.map((specimen) => specimen.family).join(", ")}.`,
);
targetTypographyRoles.forEach((role) => {
  const declarations = selectorDeclarations(typographyCss, `.${role.className}`);
  const expectedFamily =
    role.group === "display"
      ? "var(--font-display)"
      : role.group === "technical"
        ? "var(--font-mono)"
        : "var(--font-sans)";

  expect(declarations !== null, `Missing canonical CSS owner for ${role.className}.`);
  expect(
    declarations?.["--hito-typography-role"] === role.id,
    `${role.className} is missing truthful ${role.id} typography provenance.`,
  );
  expect(
    declarations?.["font-family"] === expectedFamily,
    `${role.className} must resolve through ${expectedFamily}.`,
  );
});
expect(
  localUiInspectorTargets?.content.includes(
    "HITO_INSPECTOR_TYPOGRAPHY_ROLES.map(toTypographyRoleOption)",
  ) === true &&
    localUiInspectorTargets.content.includes("HITO_TYPOGRAPHY_ROLES.map((role)") &&
    localUiInspectorTargets.content.includes("HITO_TYPOGRAPHY_ROLES_BY_ID.get(provenanceRoleId)"),
  "Local Inspector must derive the 14 replacement options and all-role provenance recognition from the canonical registry.",
);

const shellProfileDeclarations = selectorDeclarations(shellCss, ".hito-shell-profile-trigger");
const shellProfileHoverDeclarations = selectorDeclarations(
  shellCss,
  '.hito-shell-profile-trigger:not(:disabled):not([aria-disabled="true"]):hover',
);
const shellProfileFocusDeclarations = selectorDeclarations(
  shellCss,
  ".hito-shell-profile-trigger:focus-visible",
);
expect(
  shellProfileDeclarations?.border === "1px solid transparent" &&
    shellProfileDeclarations?.["border-radius"] === "var(--radius-xl)" &&
    shellProfileDeclarations?.background === "var(--color-chrome-subtle)" &&
    shellProfileDeclarations?.["box-shadow"] === "none" &&
    shellProfileHoverDeclarations?.background ===
      "color-mix(in oklch, var(--color-surface-elevated) 58%, transparent)" &&
    shellProfileFocusDeclarations?.["box-shadow"] === "0 0 0 2px var(--color-ring)",
  "Shell profile chrome must be owned completely by the shell component contract.",
);
expect(
  referenceWorkbenchCss.includes(".hito-surface-quiet,\n  .hito-shell-profile-trigger {") ===
    false &&
    referenceWorkbenchCss.includes(
      '.hito-shell-profile-trigger:not(:disabled):not([aria-disabled="true"]):hover',
    ) === false &&
    referenceWorkbenchCss.includes(".hito-shell-profile-trigger:focus-visible") === false,
  "Shell profile chrome leaked back into the reference-only quiet-surface recipe.",
);
expect(
  selectorDeclarations(overlaysFeedbackSource?.content ?? "", ".hito-surface") !== null &&
    selectorDeclarations(overlaysFeedbackSource?.content ?? "", ".hito-surface-flat") !== null &&
    selectorDeclarations(overlaysFeedbackSource?.content ?? "", ".hito-surface-quiet") !== null &&
    selectorDeclarations(typographyCss, ".hito-icon") !== null &&
    selectorDeclarations(typographyCss, ".hito-logo") !== null &&
    selectorDeclarations(typographyCss, ".hito-logo-mark") !== null &&
    referenceWorkbenchCss.includes("  .hito-surface {") === false &&
    referenceWorkbenchCss.includes("  .hito-surface-flat {") === false &&
    referenceWorkbenchCss.includes("  .hito-surface-quiet {") === false &&
    referenceWorkbenchCss.includes("  .hito-icon {") === false &&
    referenceWorkbenchCss.includes("  .hito-logo {") === false &&
    referenceWorkbenchCss.includes("  .hito-logo-mark {") === false,
  "Shared surface, Icon, and Logo recipes must not use the reference workbench as their runtime owner.",
);
const sharedSurfaceDeclarations = selectorDeclarations(
  overlaysFeedbackSource?.content ?? "",
  ".hito-surface",
);
const sharedFlatSurfaceDeclarations = selectorDeclarations(
  overlaysFeedbackSource?.content ?? "",
  ".hito-surface-flat",
);
const sharedQuietSurfaceDeclarations = selectorDeclarations(
  overlaysFeedbackSource?.content ?? "",
  ".hito-surface-quiet",
);
const popoverSurfaceDeclarations = selectorDeclarations(
  overlaysFeedbackSource?.content ?? "",
  ".hito-ui-popover-surface",
);
expect(
  sharedSurfaceDeclarations?.border === "0" &&
    sharedFlatSurfaceDeclarations?.border === "0" &&
    sharedQuietSurfaceDeclarations?.border === "0" &&
    popoverSurfaceDeclarations?.border === "1px solid var(--color-hairline)" &&
    selectorDeclarations(foundationsCss, ".hito-launch-surface")?.border === "0" &&
    declaresSelector(foundationsCss, ".hito-launcher-card") === false &&
    selectorDeclarations(controlsCss, ".hito-row-group")?.border ===
      "1px solid var(--color-hairline)" &&
    referenceBrandSource?.content.includes(
      "hito-auth-alpha-surface hito-surface-flat rounded-2xl border border-hairline",
    ) === false,
  "Reusable visual cards must remain borderless while detached overlays and structural row groups retain their explicit edges.",
);
const responsiveStateSurfaceDeclarations = selectorDeclarations(
  overlaysFeedbackSource?.content ?? "",
  '.hito-state-surface:is([data-size="sm"], [data-size="md"], [data-size="lg"])',
);
const stateSurfaceDeclarations = selectorDeclarations(
  overlaysFeedbackSource?.content ?? "",
  ".hito-state-surface",
);
const detachedSurfaceElevationMap = {
  ".hito-tooltip": "var(--hito-elevation-xs)",
  ".hito-ui-menu-surface": "var(--hito-elevation-sm)",
  ".hito-ui-popover-surface": "var(--hito-elevation-sm)",
  ".hito-ui-dialog-surface": "var(--hito-elevation-xl)",
} as const;
const semanticStateSurfaceBackgrounds = {
  signal: "color-mix(in oklch, var(--color-signal) 7%, var(--color-background))",
  success: "color-mix(in oklch, var(--color-success) 8%, var(--color-background))",
  warning: "color-mix(in oklch, var(--color-warn) 9%, var(--color-background))",
  destructive: "color-mix(in oklch, var(--color-destructive) 10%, var(--color-background))",
} as const;
expect(
  Object.entries(detachedSurfaceElevationMap).every(
    ([selector, elevation]) =>
      selectorDeclarations(overlaysFeedbackSource?.content ?? "", selector)?.["box-shadow"] ===
      elevation,
  ) &&
    [
      ...(overlaysFeedbackSource?.content.matchAll(/\.hito-ui-sheet-surface\s*\{([^}]*)\}/g) ?? []),
    ].some((match) => match[1].includes("box-shadow: var(--hito-elevation-lg);")) &&
    selectorDeclarations(overlaysFeedbackSource?.content ?? "", ".hito-toast")?.[
      "box-shadow"
    ]?.startsWith("var(--hito-elevation-md), inset 0 1px 0") === true &&
    selectorDeclarations(fieldBaseCss, ".hito-date-picker-popover")?.["box-shadow"] ===
      "var(--hito-elevation-sm)" &&
    shellCss.includes(".hito-tooltip {") === false &&
    overlaysFeedbackSource?.content.includes(".hito-tooltip-width-lg {") === true &&
    overlaysFeedbackSource.content.includes(".hito-tooltip-title {") &&
    overlaysFeedbackSource.content.includes(".hito-tooltip-meta {") &&
    overlaysFeedbackSource.content.includes(".hito-tooltip-dot {") &&
    popoverSource?.content.includes("shadow-soft") === false &&
    valueTagSource?.content.includes("shadow-[var(--hito-elevation-xs)]") === true,
  "Shared detached surfaces must use the admitted XS–XL elevation map with one tooltip owner and no superseded soft-shadow utility.",
);
expect(
  stateSurfaceDeclarations?.border === "0" &&
    stateSurfaceDeclarations.background === "var(--color-chrome-subtle)" &&
    stateSurfaceDeclarations.transition?.includes("border-color") === false &&
    Object.entries(semanticStateSurfaceBackgrounds).every(([tone, background]) => {
      const declarations = selectorDeclarations(
        overlaysFeedbackSource?.content ?? "",
        `.hito-state-surface[data-tone="${tone}"]`,
      );
      return declarations?.background === background && declarations["border-color"] === undefined;
    }),
  "State Surface must remain borderless with the canonical neutral fill and existing semantic tone fills.",
);
expect(
  overlaysFeedbackSource?.content.includes("@media (max-width: 639px)") === true &&
    responsiveStateSurfaceDeclarations?.padding === "var(--space-3)",
  "Explicit State Surface sizes must converge on space-3 padding at the canonical narrow breakpoint.",
);
expect(
  referencePatternsSource?.content.includes("const STATE_SURFACE_PREVIEW_OPTIONS = [") === true &&
    referencePatternsSource.content.includes("HitoDsWorkbenchChoiceControl") &&
    referencePatternsSource.content.includes('{ label: "Desktop", value: "desktop" }') &&
    referencePatternsSource.content.includes('{ label: "Mobile", value: "mobile" }') &&
    referencePatternsSource.content.includes("data-hito-ds-state-surface-preview") &&
    referencePatternsSource.content.includes('label="Preview"') &&
    referencePatternsSource.content.includes('stateSurfacePreview === "mobile" ? "p-3" : ""'),
  "The State Surface reference must expose a separate Desktop/Mobile control that previews the shared responsive padding.",
);
expect(
  navigationCardSource?.content.includes('ComponentPropsWithoutRef<"a">') === true &&
    navigationCardSource.content.includes('direction: "previous" | "next"') &&
    navigationCardSource.content.includes('data-hito-component="navigation-card"') &&
    navigationCardSource.content.includes("data-hito-navigation-card-arrow") &&
    navigationCardSource.content.includes("decorative") &&
    navigationCardSource.content.includes(
      '"group hito-surface-quiet grid min-w-0 gap-4 p-4 text-foreground no-underline"',
    ) &&
    navigationCardSource.content.includes("border border-hairline") === false &&
    navigationCardSource.content.includes("rounded-xl bg-background") === false &&
    navigationCardSource.content.includes("hover:bg-chrome-subtle") === false &&
    navigationCardSource.content.includes("focus-visible:ring-2") === false &&
    navigationCardSource.content.includes("hito-nav-card-arrow") === false,
  "HitoNavigationCard must compose the canonical quiet surface while retaining one native anchor, directional metadata, whole-card focus, and bare decorative arrow icons.",
);
expect(
  referencePatternsSource?.content.includes('id="navigation-card"') === true &&
    (referencePatternsSource.content.match(/<HitoNavigationCard/g)?.length ?? 0) === 2,
  "The Patterns reference must physically document both previous and next Navigation Card directions.",
);
expect(
  factualBarChartSource?.content.includes(
    "import type {\n  RunnerActivityFitChartPeriod,\n  RunnerActivityFitChartPoint,\n  RunnerActivityFitChartSeries,",
  ) === true &&
    factualBarChartSource.content.includes('data-hito-component="factual-bar-chart"') &&
    factualBarChartSource.content.includes("export type HitoFactualBarChartControls") &&
    factualBarChartSource.content.includes("data-hito-factual-figure-controls") &&
    factualBarChartSource.content.includes("formatDate(period.startDate") &&
    factualBarChartSource.content.indexOf("data-hito-factual-figure-controls") <
      factualBarChartSource.content.indexOf("data-hito-factual-chart-plot") &&
    factualBarChartSource.content.includes("data-hito-factual-chart-plot") &&
    factualBarChartSource.content.includes("Math.max(") &&
    factualBarChartSource.content.includes("point.value / maxValue") &&
    factualBarChartSource.content.includes("tabIndex={activeIndex === index ? 0 : -1}") &&
    factualBarChartSource.content.includes('event.key === "ArrowRight"') &&
    factualBarChartSource.content.includes('event.key === "ArrowLeft"') &&
    factualBarChartSource.content.includes('event.key === "Home"') &&
    factualBarChartSource.content.includes('event.key === "End"') &&
    factualBarChartSource.content.includes('event.key === "Enter"') &&
    factualBarChartSource.content.includes('event.key === " "') &&
    factualBarChartSource.content.includes('event.key === "Escape"') &&
    factualBarChartSource.content.includes("pointRefs.current[activeIndex]?.focus();") &&
    factualBarChartSource.content.includes('aria-label="Close active point"') &&
    factualBarChartSource.content.includes("<Tooltip") &&
    factualBarChartSource.content.includes("View data") &&
    factualBarChartSource.content.includes("<table") &&
    factualBarChartSource.content.includes("<canvas") === false &&
    factualBarChartSource.content.includes("<svg") === false,
  "HitoFactualBarChart must consume canonical Backend-shaped facts, calculate presentation geometry only, and preserve one-tab-stop input, Close focus return, and Tooltip/table parity without Canvas or SVG.",
);
expect(
  factualBarChartPlaygroundSource?.content.includes('id="factual-bar-chart"') === true &&
    factualBarChartPlaygroundSource.content.includes("READY_DISTANCE_SERIES") &&
    factualBarChartPlaygroundSource.content.includes('state: "available"') &&
    factualBarChartPlaygroundSource.content.includes("value: 0") &&
    factualBarChartPlaygroundSource.content.includes('state: "partial"') &&
    factualBarChartPlaygroundSource.content.includes('state: "unavailable"') &&
    factualBarChartPlaygroundSource.content.includes('status: "updating"') &&
    factualBarChartPlaygroundSource.content.includes('status: "error"') &&
    factualBarChartPlaygroundSource.content.includes("controls={{") &&
    (factualBarChartPlaygroundSource.content.match(/HitoDsWorkbenchChoiceControl/g)?.length ??
      0) === 2 &&
    factualBarChartPlaygroundSource.content.includes("HitoDsWorkbenchChoiceControl") &&
    factualBarChartPlaygroundSource.content.includes("HitoFactualBarChart"),
  "The Factual Bar Chart reference must prove zero, partial, unavailable, updating, and error states from static Backend-shaped examples through one canonical playground.",
);
expect(
  referenceOverviewSource?.content.includes("<HitoFactualBarChart") === true &&
    referenceOverviewSource.content.includes("FACTUAL_PERIOD") &&
    referenceOverviewSource.content.includes("READY_DISTANCE_SERIES") &&
    (referenceOverviewSource.content.match(/previewMode="top"/g)?.length ?? 0) === 2 &&
    referenceOverviewSource.content.includes("data-hito-ds-showcase-preview") &&
    referenceOverviewSource.content.includes(
      "grid w-full min-w-0 justify-items-center self-center text-center",
    ) &&
    referenceOverviewSource.content.includes('href="/hitoDS/patterns#factual-bar-chart"'),
  "The Overview must link one contained live Factual Bar Chart showcase to its canonical Patterns playground without duplicating reference facts.",
);
expect(
  factualActivityPointSequenceSource?.content.includes("RunnerActivityFitSequenceProductModel") ===
    true &&
    factualActivityPointSequenceSource.content.includes(
      'data-hito-component="factual-activity-point-sequence"',
    ) &&
    factualActivityPointSequenceSource.content.includes(
      "export type HitoFactualActivityPointSequenceControls",
    ) &&
    factualActivityPointSequenceSource.content.includes("data-hito-factual-figure-controls") &&
    factualActivityPointSequenceSource.content.includes(
      "formatDate(sequence.selectedPeriod.startDate",
    ) &&
    factualActivityPointSequenceSource.content.indexOf("data-hito-factual-figure-controls") <
      factualActivityPointSequenceSource.content.indexOf(
        "data-hito-factual-activity-sequence-plot",
      ) &&
    factualActivityPointSequenceSource.content.includes(
      "data-hito-factual-activity-sequence-plot",
    ) &&
    factualActivityPointSequenceSource.content.includes("historicalTimeFraction(") &&
    factualActivityPointSequenceSource.content.includes("pointPosition(") &&
    factualActivityPointSequenceSource.content.includes("sequence.points.map((point, index)") &&
    factualActivityPointSequenceSource.content.includes(
      "tabIndex={activeIndex === index ? 0 : -1}",
    ) &&
    factualActivityPointSequenceSource.content.includes('event.key === "ArrowRight"') &&
    factualActivityPointSequenceSource.content.includes('event.key === "ArrowLeft"') &&
    factualActivityPointSequenceSource.content.includes('event.key === "Home"') &&
    factualActivityPointSequenceSource.content.includes('event.key === "End"') &&
    factualActivityPointSequenceSource.content.includes('event.key === "Enter"') &&
    factualActivityPointSequenceSource.content.includes('event.key === " "') &&
    factualActivityPointSequenceSource.content.includes('event.key === "Escape"') &&
    factualActivityPointSequenceSource.content.includes(
      'sequence.completeness.returnedPointCount === 1 ? " activity" : " activities"',
    ) &&
    factualActivityPointSequenceSource.content.includes(
      "pointRefs.current[activeIndex]?.focus();",
    ) &&
    factualActivityPointSequenceSource.content.includes('aria-label="Close active activity"') &&
    factualActivityPointSequenceSource.content.includes("<Tooltip") &&
    factualActivityPointSequenceSource.content.includes("View data") &&
    factualActivityPointSequenceSource.content.includes("<table") &&
    factualActivityPointSequenceSource.content.includes(
      "Different workouts are not directly comparable.",
    ) &&
    factualActivityPointSequenceSource.content.includes("<canvas") === false &&
    factualActivityPointSequenceSource.content.includes("<svg") === false &&
    factualActivityPointSequenceSource.content.includes(".slice(") === false &&
    factualActivityPointSequenceSource.content.includes("linear-gradient") === false,
  "HitoFactualActivityPointSequence must consume the canonical product-safe Backend sequence, pluralize the factual count, position every member by historical time, retain one-tab-stop Close-focus and Tooltip/table parity, and avoid caps, connectors, Canvas, or SVG.",
);
expect(
  factualActivityPointSequencePlaygroundSource?.content.includes(
    'id="factual-activity-point-sequence"',
  ) === true &&
    factualActivityPointSequencePlaygroundSource.content.includes(
      "FACTUAL_ACTIVITY_SEQUENCE_READY",
    ) &&
    factualActivityPointSequencePlaygroundSource.content.includes('value: "distance"') &&
    factualActivityPointSequencePlaygroundSource.content.includes(
      'value: "observed_average_pace"',
    ) &&
    factualActivityPointSequencePlaygroundSource.content.includes('value: "elevation_gain"') &&
    factualActivityPointSequencePlaygroundSource.content.includes('value: "reported_load"') &&
    factualActivityPointSequencePlaygroundSource.content.includes('state: "partial"') &&
    factualActivityPointSequencePlaygroundSource.content.includes('state: "unavailable"') &&
    factualActivityPointSequencePlaygroundSource.content.includes('status: "empty"') &&
    factualActivityPointSequencePlaygroundSource.content.includes('status: "updating"') &&
    factualActivityPointSequencePlaygroundSource.content.includes('status: "error"') &&
    factualActivityPointSequencePlaygroundSource.content.includes("futureInterval") &&
    factualActivityPointSequencePlaygroundSource.content.includes("controls={{") &&
    factualActivityPointSequencePlaygroundSource.content.includes("HitoDsWorkbenchChoiceControl") &&
    factualActivityPointSequencePlaygroundSource.content.includes(
      "HitoFactualActivityPointSequence",
    ),
  "The Factual Activity Point Sequence reference must cover every selected metric plus ready, empty, unavailable-member, updating, incomplete, error, and future-week truth through one canonical playground.",
);
expect(
  referencePatternsSource?.content.includes("<FactualActivityPointSequencePlayground") === true &&
    referenceOverviewSource?.content.includes("<HitoFactualActivityPointSequence") === true &&
    referenceOverviewSource.content.includes("FACTUAL_ACTIVITY_SEQUENCE_READY") &&
    referenceOverviewSource.content.includes("FACTUAL_ACTIVITY_SEQUENCE_DEFAULT_METRIC") &&
    referenceOverviewSource.content.includes(
      'href="/hitoDS/patterns#factual-activity-point-sequence"',
    ),
  "Patterns and Overview must register one canonical factual activity sequence and reuse the same static Backend-shaped reference truth without a second playground.",
);
const retiredDocumentGlobalAliases = [
  "--hito-route-support-sidebar-width",
  "--hito-route-panel-skeleton-calendar-height",
  "--hito-route-panel-skeleton-detail-height",
  "--hito-form-section-label-width",
  "--hito-readback-value-width",
  "--hito-readback-value-compact-width",
  "--hito-shell-menu-width-profile",
  "--hito-shell-menu-width-plan",
  "--hito-shell-menu-width-account",
  "--hito-menu-width-standard",
  "--hito-admin-quick-note-panel-width",
  "--hito-data-table-code-width-sm",
  "--hito-data-table-code-width-md",
  "--hito-data-table-code-width-lg",
  "--hito-data-table-action-width",
  "--hito-data-table-note-width",
  "--hito-tooltip-width-lg",
  "--hito-manual-workout-title-min-width",
  "--hito-manual-workout-step-summary-min-width",
  "--hito-manual-workout-menu-width-add",
  "--hito-manual-workout-menu-width-step",
] as const;
expect(
  retiredDocumentGlobalAliases.every(
    (alias) =>
      fieldExtendedCss.includes(alias) === false &&
      typographyCss.includes(alias) === false &&
      shellCss.includes(alias) === false,
  ),
  "A proven single-owner geometry alias leaked back into document-global scope.",
);

expect(
  hitoDsRoute?.content.includes("Public interactive Hito design-system reference and sandbox") ===
    true && hitoDsRoute.content.includes("Internal Hito design-system reference") === false,
  "/hitoDS metadata must describe the accepted public interactive reference contract.",
);
expect(
  hubRoute?.content.includes('to: "/hitoDS"') === true &&
    hubRoute.content.includes('badge: "Public"') &&
    hubRoute.content.includes("Browse and try Hito's live tokens"),
  "Hub must expose /hitoDS as the accepted public interactive reference.",
);
expect(
  showcaseBoundaryLeaks.length === 0,
  `Product source depends on showcase-only Hito DS owners: ${showcaseBoundaryLeaks
    .map((file) => `${file.relativePath} -> ${file.showcaseSpecifiers.join(", ")}`)
    .join(", ")}`,
);
expect(
  currentReferenceDocs.every(
    (file) => file.content.includes("/hitoDS") && file.content.includes("production-shipped"),
  ),
  "Current product, system, and state docs must record the production-shipped /hitoDS role.",
);
expect(
  currentReferenceDocs.every(
    (file) =>
      !/internal design-system reference `\/hitoDS`|renders the internal Hito design-system reference|`\/hitoDS` (?:provides|is) (?:an|the accepted) internal reference/i.test(
        file.content,
      ),
  ),
  "Current docs returned /hitoDS to the retired internal-only reference contract.",
);

expect(
  /^\s*\.hito-field\s*\{/m.test(fieldBaseCss) &&
    fieldBaseCss.includes(".hito-compound-range-control"),
  "Shared Field base and compound-range anatomy must stay in controls-fields.css.",
);
sharedFieldOwnerMarkers.forEach((marker) => {
  expect(
    declaresSelector(fieldBaseCss, marker),
    `Shared Field owner is missing from controls-fields.css: ${marker}`,
  );
  expect(
    declaresSelector(fieldExtendedCss, marker) === false,
    `Shared Field owner leaked into forms-onboarding.css: ${marker}`,
  );
});
expect(
  sharedFieldOwnerLeakFindings(fieldExtendedCss).length === 0,
  `Shared Field selectors leaked into forms-onboarding.css: ${sharedFieldOwnerLeakFindings(
    fieldExtendedCss,
  ).join(", ")}`,
);
expect(
  /^\s*\.hito-field\s*\{/m.test(fieldExtendedCss) === false,
  "The onboarding/domain owner must not re-declare the shared Field base.",
);

validateCssSelectors(controlsCss, "hito-button", HITO_BUTTON_VARIANTS);
validateCssSelectors(controlsCss, "hito-button", HITO_BUTTON_SIZES);
const primaryButtonDeclarations = selectorDeclarations(controlsCss, ".hito-button-primary");
const primaryButtonActiveDeclarations = selectorDeclarations(
  controlsCss,
  '.hito-button-primary[data-demo-state="active"]',
);
const lightPrimaryButtonDeclarations = selectorDeclarations(
  controlsCss,
  '[data-hito-theme="light"] .hito-button-primary',
);
const lightPrimaryButtonActiveDeclarations = selectorDeclarations(
  controlsCss,
  '[data-hito-theme="light"] .hito-button-primary[data-demo-state="active"]',
);
const buttonFocusDeclarations = selectorDeclarations(
  controlsCss,
  '.hito-button[data-demo-state="focus"]',
);
expect(
  primaryButtonDeclarations !== null &&
    primaryButtonActiveDeclarations !== null &&
    lightPrimaryButtonDeclarations !== null &&
    lightPrimaryButtonActiveDeclarations !== null &&
    primaryButtonDeclarations["box-shadow"] === undefined &&
    primaryButtonActiveDeclarations?.["box-shadow"] === undefined &&
    lightPrimaryButtonDeclarations?.["box-shadow"] ===
      "0 8px 18px color-mix(in oklch, var(--color-signal) 8%, transparent)" &&
    lightPrimaryButtonActiveDeclarations?.["box-shadow"] === "none",
  "Default primary Button rest and active states must not reintroduce perimeter chrome in either theme.",
);
expect(
  buttonFocusDeclarations?.outline === "2px solid var(--color-ring)" &&
    buttonFocusDeclarations?.["outline-offset"] === "2px",
  "Button focus-visible must remain a distinct token-owned keyboard indication.",
);
const interactiveCalendarMarkers =
  hitoCalendarDaySource?.content.match(/data-interactive=\{interactive \? "true" : undefined\}/g) ??
  [];
const interactiveMobileRowHoverDeclarations = selectorDeclarations(
  calendarCss,
  '.hito-calendar-mobile-row[data-interactive="true"]:hover',
);
expect(
  interactiveCalendarMarkers.length === 2,
  "Desktop calendar cells and mobile workout-day rows must expose the shared interactive presentation contract.",
);
expect(
  interactiveMobileRowHoverDeclarations?.["border-color"] ===
    "color-mix(in oklch, var(--color-foreground) 18%, transparent)" &&
    selectorDeclarations(calendarCss, ".hito-calendar-mobile-row:hover") === null,
  "Mobile calendar hover chrome must be gated by the shared interactive presentation contract.",
);
HITO_BUTTON_VARIANTS.forEach((variant) => {
  HITO_BUTTON_TONES_BY_VARIANT[variant]
    .filter((tone) => tone !== "default")
    .forEach((tone) => {
      expect(
        controlsCss.includes(`.hito-button-${variant}[data-tone="${tone}"]`),
        `Missing Button tone contract: ${variant}/${tone}`,
      );
    });
});
expect(
  controlsCss.includes('.hito-button[data-state="loading"]:disabled'),
  "Button loading presentation must be coupled to native disabled truth.",
);
expect(
  controlsCss.includes('.hito-button[aria-pressed="true"]'),
  "Button pressed presentation must be coupled to aria-pressed truth.",
);
expect(
  controlsCss.includes(".hito-button-progress-track") &&
    controlsCss.includes(".hito-button-progress-fill"),
  "Button timed progress must retain its bounded shared presentation.",
);
validateCssSelectors(fieldBaseCss, "hito-field", HITO_FIELD_VARIANTS);
validateCssSelectors(fieldBaseCss, "hito-field", HITO_FIELD_SIZES);
validateCssSelectors(controlsCss, "hito-slider", HITO_FIELD_SIZES);
validateCssSelectors(controlsCss, "hito-dual-range", HITO_FIELD_SIZES);
validateCssSelectors(controlsCss, "hito-choice-toggle", HITO_CHOICE_TOGGLE_SIZES);

retiredClassFindings(sourceFiles).forEach((finding) => {
  errors.push(`Retired control class returned: ${finding}`);
});
referenceManualRecipeFindings(sourceFiles).forEach((finding) => {
  errors.push(`Hito UI source bypassed a shared control primitive: ${finding}`);
});

const referenceControls = sourceFiles.find(
  (file) => file.relativePath === "src/components/hito-ds/reference-components-controls.tsx",
);
const figmaBoard = sourceFiles.find(
  (file) => file.relativePath === "src/components/hito-ds/figma-export-board.tsx",
);
const foundationsPage = sourceFiles.find(
  (file) => file.relativePath === "src/components/hito-ds/reference-foundations-page.tsx",
);
const referenceModel = sourceFiles.find(
  (file) => file.relativePath === "src/components/hito-ds/reference-model.ts",
);
const markSource = sourceFiles.find(
  (file) => file.relativePath === "src/components/ui/hito-mark.tsx",
);
const brandPage = sourceFiles.find(
  (file) => file.relativePath === "src/components/hito-ds/reference-brand-page.tsx",
);
const foundationReferenceSurfaceCount =
  (foundationsPage?.content.match(/hito-ds-token-specimen-surface/g)?.length ?? 0) +
  (brandPage?.content.match(/hito-ds-token-specimen-surface/g)?.length ?? 0);
const foundationFlatSurfaceCount =
  (foundationsPage?.content.match(/hito-surface-flat/g)?.length ?? 0) +
  (brandPage?.content.match(/hito-surface-flat/g)?.length ?? 0);
const foundationPlaygroundOffsets = [
  ...(foundationsPage?.content.matchAll(/<HitoDsPlayground/g) ?? []),
].map((match) => match.index ?? -1);
const foundationPlaygroundCount = foundationPlaygroundOffsets.length;
const foundationMarkPlaygroundIdIndex = foundationsPage?.content.indexOf('id="marks"') ?? -1;
const foundationTypographyPlaygroundIdIndex =
  foundationsPage?.content.indexOf('id="typography-inspector-picker"') ?? -1;
const foundationTypographyPickerCaseCount =
  foundationsPage?.content.match(/data-hito-ds-typography-picker-case=/g)?.length ?? 0;
const tokenSpecimenSurfaceDeclarations = selectorDeclarations(
  referenceWorkbenchCss,
  ".hito-ds-token-specimen-surface",
);
const elevationDefinitions = [
  ...foundationsCss.matchAll(/--hito-elevation-(xs|sm|md|lg|xl)\s*:\s*([\s\S]*?);/g),
].map((match) => ({
  level: match[1],
  value: match[2].replace(/\s+/g, " ").trim(),
}));
const expectedElevationDefinitions = {
  xs: [
    "0 1px 2px -1px color-mix(in oklch, var(--stone-950) 40%, transparent), 0 3px 8px -5px color-mix(in oklch, var(--stone-950) 20%, transparent)",
    "0 1px 2px -1px color-mix(in oklch, var(--taupe-650) 12%, transparent), 0 3px 8px -5px color-mix(in oklch, var(--taupe-650) 6%, transparent)",
  ],
  sm: [
    "0 2px 4px -2px color-mix(in oklch, var(--stone-950) 42%, transparent), 0 7px 18px -10px color-mix(in oklch, var(--stone-950) 22%, transparent)",
    "0 2px 4px -2px color-mix(in oklch, var(--taupe-650) 13%, transparent), 0 7px 18px -10px color-mix(in oklch, var(--taupe-650) 7%, transparent)",
  ],
  md: [
    "0 3px 8px -3px color-mix(in oklch, var(--stone-950) 44%, transparent), 0 12px 28px -14px color-mix(in oklch, var(--stone-950) 24%, transparent)",
    "0 3px 8px -3px color-mix(in oklch, var(--taupe-650) 14%, transparent), 0 12px 28px -14px color-mix(in oklch, var(--taupe-650) 8%, transparent)",
  ],
  lg: [
    "0 5px 14px -5px color-mix(in oklch, var(--stone-950) 46%, transparent), 0 22px 48px -20px color-mix(in oklch, var(--stone-950) 26%, transparent)",
    "0 5px 14px -5px color-mix(in oklch, var(--taupe-650) 16%, transparent), 0 22px 48px -20px color-mix(in oklch, var(--taupe-650) 10%, transparent)",
  ],
  xl: [
    "0 8px 22px -8px color-mix(in oklch, var(--stone-950) 48%, transparent), 0 34px 72px -28px color-mix(in oklch, var(--stone-950) 28%, transparent)",
    "0 8px 22px -8px color-mix(in oklch, var(--taupe-650) 18%, transparent), 0 34px 72px -28px color-mix(in oklch, var(--taupe-650) 12%, transparent)",
  ],
} as const;
const workoutColorTokensSource = sourceFiles.find(
  (file) => file.relativePath === "src/lib/workout-color-tokens.ts",
);
const lightPaletteReference = sourceFiles.find(
  (file) => file.relativePath === "src/components/hito-ds/light-palette-reference.tsx",
);
const referenceMetadata = sourceFiles.find(
  (file) => file.relativePath === "src/components/hito-ds/reference-metadata.ts",
);
const referenceStructure = sourceFiles.find(
  (file) => file.relativePath === "src/components/hito-ds/reference-components-structure.tsx",
);
const buttonSource = sourceFiles.find(
  (file) => file.relativePath === "src/components/ui/button.tsx",
);
const dialogSource = sourceFiles.find(
  (file) => file.relativePath === "src/components/ui/dialog.tsx",
);
const sheetSource = sourceFiles.find((file) => file.relativePath === "src/components/ui/sheet.tsx");
const localNotionActionsSource = sourceFiles.find(
  (file) => file.relativePath === "src/components/devtools/LocalNotionSubmissionActions.tsx",
);
const compoundRangeSource = sourceFiles.find(
  (file) => file.relativePath === "src/components/ui/hito-compound-range-field.tsx",
);
const sliderSource = sourceFiles.find(
  (file) => file.relativePath === "src/components/ui/hito-slider.tsx",
);
const dualRangeSource = sourceFiles.find(
  (file) => file.relativePath === "src/components/ui/hito-dual-range.tsx",
);
const sliderPlaygroundSource = sourceFiles.find(
  (file) => file.relativePath === "src/components/hito-ds/slider-playground.tsx",
);
const completionPanelSource = sourceFiles.find(
  (file) => file.relativePath === "src/components/CompletionPanel.tsx",
);
const bodyNotesSource = sourceFiles.find(
  (file) => file.relativePath === "src/components/workout-completion/BodyNotesEditor.tsx",
);
const heartRateProfileSource = sourceFiles.find(
  (file) => file.relativePath === "src/components/settings/HeartRateProfileSection.tsx",
);
const choiceSource = sourceFiles.find(
  (file) => file.relativePath === "src/components/ui/hito-choice-toggle.tsx",
);
const calendarSource = sourceFiles.find(
  (file) => file.relativePath === "src/components/ui/calendar.tsx",
);
const dateTimeInputSource = sourceFiles.find(
  (file) => file.relativePath === "src/components/ui/hito-date-time-input.tsx",
);
const tabsSource = sourceFiles.find(
  (file) => file.relativePath === "src/components/ui/hito-tabs.ts",
);
const radioGroupSource = sourceFiles.find(
  (file) => file.relativePath === "src/components/ui/hito-radio-group.ts",
);
const selectionMechanicsSource = sourceFiles.find(
  (file) => file.relativePath === selectionMechanicsOwner,
);
const selectionImportLeaks = selectionMechanicsImportFindings(sourceFiles);
const selectionImplementationLeaks = selectionMechanicsImplementationFindings(sourceFiles);
const workbenchSettingsSource = sourceFiles.find(
  (file) => file.relativePath === workbenchSettingsOwner,
);
const workbenchSettingsConsumers = sourceFiles.filter((file) =>
  file.content.includes("hito-ds/workbench-settings-controls"),
);
const calendarPlaygroundSource = sourceFiles.find(
  (file) => file.relativePath === "src/components/hito-ds/calendar-workout-playground.tsx",
);
const workoutLibraryPlaygroundSource = sourceFiles.find(
  (file) => file.relativePath === "src/components/hito-ds/workout-library-playground.tsx",
);
const workbenchImportLeaks = workbenchSettingsImportFindings(sourceFiles);
const workbenchPrimitiveBypasses = workbenchPrimitiveBypassFindings(sourceFiles);
const retiredFoundationTokenLeaks = retiredFoundationTokenFindings(foundationSearchFiles);
const retiredFoundationSelectorLeaks = retiredFoundationSelectorFindings(foundationSearchFiles);
const retainedWorkoutBaseDefinitions = [
  ...foundationsCss.matchAll(/--hito-workout-(?!type-|section-)[a-z-]+-base\s*:/g),
].map((match) => match[0]);
const retiredWorkoutShadeDeclarations = [
  ...foundationsCss.matchAll(
    /--hito-workout-(?!type-|section-)[a-z-]+-(?:50|100|200|300|400|500|600|700|800|900|950)\s*:/g,
  ),
].map((match) => match[0]);
const workoutTypeSlotDeclarationCounts = workoutTypeRoleNames.flatMap((role) =>
  workoutTypeSlotNames.map((slot) => {
    const token = `--hito-workout-type-${role}-${slot}`;
    const expectedCount = slot === "base" || slot === "foreground" || slot === "content" ? 2 : 1;
    return {
      count: foundationsCss.match(new RegExp(`${token}\\s*:`, "g"))?.length ?? 0,
      expectedCount,
      token,
    };
  }),
);
const workoutSectionContentDeclarations = [
  ...foundationsCss.matchAll(/--hito-workout-section-[a-z-]+-content\s*:/g),
].map((match) => match[0]);

expect(
  referenceControls?.content.includes("HITO_BUTTON_SIZES") === true &&
    referenceControls.content.includes("HITO_FIELD_SIZES") &&
    referenceControls.content.includes("HITO_CHOICE_TOGGLE_SIZES"),
  "Hito DS controls must consume the central control contract.",
);
expect(
  compoundRangeSource?.content.includes("label?: string;") === true &&
    compoundRangeSource.content.includes("const visibleLabel = label?.trim() || undefined;") &&
    compoundRangeSource.content.includes(
      'const accessibleGroupLabel = message("{lowerLabel} to {upperLabel}, {unit}", {',
    ) &&
    compoundRangeSource.content.includes("const message = useHitoProductMessage();") &&
    compoundRangeSource.content.includes("{visibleLabel ? (") &&
    compoundRangeSource.content.includes("aria-labelledby={labelId}") &&
    compoundRangeSource.content.includes(
      "aria-label={labelId ? undefined : accessibleGroupLabel}",
    ) &&
    compoundRangeSource.content.includes('event.key === "ArrowUp" || event.key === "ArrowDown"') &&
    compoundRangeSource.content.includes('event.key === "Escape"') &&
    compoundRangeSource.content.includes('event.key === "Enter" && !endpointError') &&
    compoundRangeSource.content.includes("data-disabled={disabled || undefined}") &&
    compoundRangeSource.content.includes("data-invalid={Boolean(error) || undefined}") &&
    referenceControls?.content.includes(
      '<HitoCompoundRangeField\n                  label="Range"',
    ) === true,
  "Compound Range Field must support a label-free accessible group without drifting its keyboard, disabled, invalid, or labelled reference contracts.",
);
expect(
  figmaBoard?.content.includes("HITO_BUTTON_SIZES") === true &&
    figmaBoard.content.includes("HITO_FIELD_SIZES"),
  "Figma capture board must consume the central control contract.",
);
expect(
  workbenchSettingsSource?.content.includes("HitoDsWorkbenchChoiceControl") === true &&
    workbenchSettingsSource.content.includes("HitoDsWorkbenchSelectControl") &&
    workbenchSettingsSource.content.includes("HitoChoiceToggle") &&
    workbenchSettingsSource.content.includes("useHitoRadioGroup") &&
    workbenchSettingsSource.content.includes('size="xs"') &&
    workbenchSettingsSource.content.includes("selected={value === option.value}") &&
    workbenchSettingsSource.content.includes("onClick={() => onChange(option.value)}") &&
    workbenchSettingsSource.content.includes("aria-label={label}") &&
    workbenchSettingsSource.content.includes(
      "onValueChange={(nextValue) => onChange(nextValue as Value)}",
    ) &&
    workbenchSettingsSource.content.includes(
      '<SelectTrigger aria-label={label} className="min-w-0" size="sm">',
    ) &&
    workbenchSettingsSource.content.includes('className="grid min-w-0 gap-2"'),
  "Reference workbench settings must resolve through one layout-safe Hito primitive composition.",
);
expect(
  workbenchSettingsConsumers.length === workbenchSettingsImporters.size &&
    workbenchSettingsConsumers.every((file) => workbenchSettingsImporters.has(file.relativePath)),
  `Reference workbench settings consumers drifted from the exact seven-file owner boundary: ${workbenchSettingsConsumers
    .map((file) => file.relativePath)
    .join(", ")}`,
);
expect(
  workbenchImportLeaks.length === 0,
  `Workbench settings controls leaked outside their exact reference consumers: ${workbenchImportLeaks
    .map((file) => file.relativePath)
    .join(", ")}`,
);
expect(
  workbenchPrimitiveBypasses.length === 0,
  `A former workbench owner bypassed the shared settings composition: ${workbenchPrimitiveBypasses
    .map((finding) => `${finding.relativePath} (${finding.marker})`)
    .join(", ")}`,
);
expect(
  [calendarPlaygroundSource, workoutLibraryPlaygroundSource].every(
    (file) =>
      file?.content.includes("hito-ds/workbench-settings-controls") &&
      file.content.includes("@/components/ui/hito-choice-toggle") === false &&
      file.content.includes("@/components/ui/hito-radio-group") === false &&
      file.content.includes("@/components/ui/select") === false,
  ),
  "Calendar or Workout Library bypassed the shared reference-workbench settings owner.",
);
expect(
  calendarPlaygroundSource?.content.includes('label="Presentation contract"') === true &&
    calendarPlaygroundSource.content.includes('state.interaction === "interactive"') &&
    calendarPlaygroundSource.content.includes('variant.state.interaction === "interactive"'),
  "Calendar reference must expose the shared interactive/passive presentation contract across demo and variants.",
);
expect(
  sourceFiles.filter((file) => file.content.includes("export type HitoDsWorkbenchOption"))
    .length === 1,
  "The generic workbench option shape must have one declaration owner.",
);
expect(
  WORKOUT_LIBRARY_IDENTITY_COUNT === 32 &&
    WORKOUT_LIBRARY_CANONICAL_IDENTITY_COUNT === 32 &&
    WORKOUT_LIBRARY_IDENTITY_COUNT === WORKOUT_LIBRARY_CANONICAL_IDENTITY_COUNT,
  "The Workout Library must retain exactly one specimen for each of its 32 canonical identities.",
);
expect(
  retiredFoundationTokenLeaks.length === 0,
  `Retired foundation tokens returned: ${retiredFoundationTokenLeaks
    .map((finding) => `${finding.token} in ${finding.relativePath}`)
    .join(", ")}`,
);
expect(
  retiredFoundationSelectorLeaks.length === 0,
  `Retired foundation selectors returned: ${retiredFoundationSelectorLeaks
    .map((finding) => `${finding.selector} in ${finding.relativePath}`)
    .join(", ")}`,
);
expect(
  retainedWorkoutBaseDefinitions.length === 12,
  `Expected 12 workout-domain base colors, found ${retainedWorkoutBaseDefinitions.length}.`,
);
expect(
  retiredWorkoutShadeDeclarations.length === 0,
  `Retired workout shade declarations returned: ${retiredWorkoutShadeDeclarations.join(", ")}`,
);
expect(
  workoutTypeSlotDeclarationCounts.every(({ count, expectedCount }) => count === expectedCount),
  `Workout type theme-specific/shared slot coverage drifted: ${workoutTypeSlotDeclarationCounts
    .filter(({ count, expectedCount }) => count !== expectedCount)
    .map(({ count, expectedCount, token }) => `${token} (${count}; expected ${expectedCount})`)
    .join(", ")}`,
);
expect(
  workoutSectionContentDeclarations.length === 0,
  `Workout type content semantics leaked into the deferred section-role family: ${workoutSectionContentDeclarations.join(", ")}`,
);
expect(
  workoutColorTokensSource?.content.includes("WORKOUT_COLOR_STATE_SLOTS") === true &&
    workoutColorTokensSource.content.includes('"content"') &&
    workoutColorTokensSource.content.includes("workoutTypeColorVar") &&
    workoutColorTokensSource.content.includes("workoutFamilyColorToken") &&
    workoutColorTokensSource.content.includes("workoutSectionColorVar") &&
    retiredWorkoutColorApiMarkers.every(
      (marker) => workoutColorTokensSource.content.includes(marker) === false,
    ),
  "Workout colors must expose only the semantic type, family and section TypeScript contract.",
);
expect(
  JSON.stringify(HITO_MARK_META.map((mark) => mark.name)) === JSON.stringify(expectedMarkNames) &&
    HITO_MARK_META.filter((mark) => mark.family === "workout").length === 11 &&
    HITO_MARK_META.filter((mark) => mark.family === "surface").length === 4 &&
    HITO_MARK_META.reduce((count, mark) => count + mark.pathCount, 0) === 23 &&
    HITO_MARK_META.every(
      (mark) =>
        /^0 0 \d+ \d+$/.test(mark.viewBox) &&
        mark.opticalFit > 0 &&
        mark.opticalFit <= 1 &&
        mark.frameToken.startsWith("--") &&
        mark.glyphToken.startsWith("--") &&
        mark.contentToken.startsWith("--"),
    ),
  "Hito Mark must retain exactly 11 workout and four surface definitions with native viewBoxes, paths, optical fit and token provenance.",
);
expect(
  JSON.stringify(HITO_MARK_SHAPES) === JSON.stringify(["tile", "circle"]) &&
    JSON.stringify(Object.keys(HITO_MARK_SIZES)) ===
      JSON.stringify(["xs", "sm", "md", "lg", "hero"]) &&
    JSON.stringify(Object.values(HITO_MARK_SIZES).map((size) => size.className)) ===
      JSON.stringify(["size-8", "size-10", "size-16", "size-32", "size-64"]),
  "Hito Mark must expose only the approved two shapes and five existing-utility sizes.",
);
expect(
  markSource?.content.includes('fill="currentColor"') === true &&
    markSource.content.includes('preserveAspectRatio="xMidYMid meet"') &&
    markSource.content.includes('role={decorative ? undefined : "img"}') &&
    markSource.content.includes("HITO_MARK_DEFINITIONS") &&
    /#[0-9a-f]{3,8}/i.test(markSource.content) === false &&
    sourceFiles.filter((file) => file.content.includes("HITO_MARK_DEFINITIONS")).length === 1 &&
    sourceFiles.filter((file) => file.content.includes("export function HitoMark")).length === 1,
  "Hito Mark must have one currentColor owner with preserved aspect ratio and truthful decorative/labelled semantics.",
);
expect(
  foundationsPage?.content.includes('id="workout-semantic-type-colors"') === true &&
    foundationsPage.content.includes('id="workout-semantic-section-colors"') &&
    foundationsPage.content.includes("data-hito-workout-role-card") &&
    foundationsPage.content.includes("data-hito-workout-solid-contrast") &&
    foundationsPage.content.includes('valueFor(hasContent ? "content" : "base")') &&
    retiredWorkoutReferenceMarkers.every(
      (marker) => foundationsPage.content.includes(marker) === false,
    ),
  "Foundations must document semantic workout roles without reviving raw shade ramps.",
);
expect(
  foundationPlaygroundCount === 2,
  `Foundations playground structure drifted: expected 2 distinct playgrounds (Marks and Typography Inspector), found ${foundationPlaygroundCount}.`,
);
expect(
  foundationsPage?.content.includes('id="marks"') === true &&
    foundationsPage.content.includes("HITO_MARK_META.map") &&
    foundationsPage.content.includes("HITO_MARK_SHAPES.map") &&
    foundationsPage.content.includes("Object.keys(HITO_MARK_SIZES)") &&
    foundationsPage.content.includes("<HitoMark") &&
    foundationPlaygroundCount === 2 &&
    foundationPlaygroundOffsets[0] < foundationMarkPlaygroundIdIndex &&
    foundationMarkPlaygroundIdIndex < foundationPlaygroundOffsets[1] &&
    foundationsPage.content.includes("data-hito-ds-mark-gallery") &&
    foundationsPage.content.includes("MarkTokenProvenance") &&
    foundationsPage.content.includes("data-hito-ds-mark-size-shape-matrix") === false,
  "Foundations must document the canonical Mark inventory, playground, both shapes, five sizes, gallery and token provenance.",
);
expect(
  foundationPlaygroundCount === 2 &&
    foundationPlaygroundOffsets[1] < foundationTypographyPlaygroundIdIndex &&
    foundationsPage?.content.includes('data-hito-ds-typography-inspector-specimen=""') === true &&
    foundationsPage.content.includes('aria-label="Typography inspector examples"') &&
    foundationsPage.content.includes("useHitoRadioGroup<TypographyInspectorPickerCase>") &&
    foundationTypographyPickerCaseCount === 3 &&
    foundationsPage.content.includes("<TypographyControlRow"),
  "Foundations must retain a distinct Typography Inspector playground with three interactive cases and one selected control-row seam.",
);
const foundationGeometryDefinitions = [
  ...foundationsCss.matchAll(/(--hito-[a-z0-9-]*(?:width|height)[a-z0-9-]*)\s*:/gi),
].map((match) => match[1]);
expect(
  foundationGeometryDefinitions.length === 0,
  `Component geometry remains in foundations.css: ${foundationGeometryDefinitions.join(", ")}`,
);
expect(
  [figmaBoard, foundationsPage].every((file) => file?.content.includes("HITO_DS_MANIFEST")),
  "Figma board and Foundations page must consume HITO_DS_MANIFEST.",
);
expect(
  lightPaletteReference === undefined &&
    foundationsPage?.content.includes("light-palette-reference") === false,
  "Foundations must remove the static Light palette instead of retaining a competing theme snapshot.",
);
expect(
  primitiveColorExportSection !== undefined &&
    JSON.stringify(
      [...generatedManifest.collections.primitiveColor.map((token) => token.id)].sort(),
    ) === JSON.stringify([...exportedPrimitiveColorIds].sort()),
  "Generated manifest primitive colors must cover every exported non-workout Foundation primitive.",
);
expect(
  expectedSemanticSectionOrder.every((title, index) => {
    const currentIndex = foundationsPage?.content.indexOf(`title: "${title}"`) ?? -1;
    const nextTitle = expectedSemanticSectionOrder[index + 1];
    const nextIndex = nextTitle
      ? (foundationsPage?.content.indexOf(`title: "${nextTitle}"`) ?? -1)
      : Number.MAX_SAFE_INTEGER;
    return currentIndex >= 0 && currentIndex < nextIndex;
  }),
  "Foundations Semantic Colors must retain the accepted Surfaces-to-Status section order.",
);
expect(
  foundationsPage?.content.includes('data-hito-ds-foundations-context=""') === true &&
    ["layers", "type", "interactive-intent"].every((module) =>
      foundationsPage.content.includes(`data-hito-ds-foundations-context-module="${module}"`),
    ),
  "Foundations must expose one live Context specimen for layers, type, and interactive intent.",
);
expect(
  foundationsPage?.content.includes("data-hito-ds-color-provenance") === true &&
    foundationsPage.content.includes("data-hito-ds-color-active-result") &&
    foundationsPage.content.includes("activeMode.provenance") &&
    foundationsPage.content.includes("formatAlphaPercentage") &&
    foundationsPage.content.includes("formatParsedColorHex") &&
    foundationsPage.content.includes("backingToken") &&
    foundationsPage.content.includes("Canvas → Surface (Card alias) → Elevated → Popover"),
  "Foundations color cards and Context must expose authored provenance, alpha, active resolution, and factual backing layers.",
);
expect(
  referenceWorkbenchCss.includes(".hito-workbench-sidebar {") &&
    referenceWorkbenchCss.includes("background: var(--color-sidebar);") &&
    referenceWorkbenchCss.includes(".hito-workbench-main {") &&
    referenceWorkbenchCss.includes("background: var(--color-surface);") &&
    referenceWorkbenchCss.includes('[data-hito-theme="light"] .hito-workbench-main {') &&
    referenceWorkbenchCss.includes("background: var(--color-background);") &&
    referenceWorkbenchCss.includes("background: color-mix(in oklch, var(--color-sidebar) 70%") ===
      false,
  "The Hito DS workbench must retain the exact sidebar/canvas semantic ladder without the retired translucent sidebar recipe.",
);
expect(
  foundationsPage?.content.includes('if (slot === "border") {') === true &&
    foundationsPage.content.includes('borderColor: valueFor("border")') &&
    foundationsPage.content.includes('if (slot === "ring") {') &&
    foundationsPage.content.includes('boxShadow: `0 0 0 2px ${valueFor("ring")}`') &&
    foundationsPage.content.includes('slot === "border" && "border"'),
  "Foundations must preserve the accepted workout border-only and ring-shadow-only renderer contract.",
);
expect(
  elevationDefinitions.length === 10 &&
    Object.entries(expectedElevationDefinitions).every(([level, expectedValues]) => {
      const actualValues = elevationDefinitions
        .filter((definition) => definition.level === level)
        .map((definition) => definition.value);
      return (
        JSON.stringify(actualValues) === JSON.stringify(expectedValues) &&
        actualValues.every(
          (value) =>
            value.includes("inset") === false &&
            (value.match(/(?:^|,\s*)0\s+\d+px/g)?.length ?? 0) === 2,
        )
      );
    }) &&
    (foundationsCss.match(/--hito-shadow-soft\s*:/g)?.length ?? 0) === 2,
  "Hito elevation must expose exactly five Dark/Light tokens with the approved two outer layers while preserving the independent soft shadow.",
);
expect(
  foundationsPage?.content.includes('id="depth"') === true &&
    foundationsPage.content.includes("ELEVATION_PARENT_SURFACES.map") &&
    foundationsPage.content.includes("ELEVATION_LEVELS.map") &&
    foundationsPage.content.includes("data-hito-ds-depth-resolved") &&
    referenceModel?.content.includes('{ id: "depth", label: "Depth"') === true,
  "Foundations must register one live Depth reference covering None and XS–XL on canvas and surface parents.",
);
expect(
  tokenSpecimenSurfaceDeclarations?.border === "0" &&
    tokenSpecimenSurfaceDeclarations?.["border-radius"] === "var(--radius-3xl)" &&
    tokenSpecimenSurfaceDeclarations?.background === "var(--color-background)",
  "Foundations token specimens must retain the shared borderless 16px semantic surface.",
);
expect(
  foundationReferenceSurfaceCount === 12 && foundationFlatSurfaceCount === 4,
  `Foundations reference-surface classification drifted: expected 12 accepted token specimens and 4 preserved distinct flat surfaces; found ${foundationReferenceSurfaceCount} and ${foundationFlatSurfaceCount}.`,
);
expect(
  (brandPage?.content.match(/labelTone="on-light"/g) ?? []).length === 1 &&
    (brandPage?.content.match(/labelTone="on-dark"/g) ?? []).length === 1 &&
    brandPage.content.includes('labelTone?: "default" | "on-light" | "on-dark"') &&
    brandPage.content.includes('"text-[var(--stone-950)]"') &&
    brandPage.content.includes('"text-[var(--sand-100)]"') &&
    brandPage.content.includes('<LogoSpecimen label="Favicon">') &&
    brandPage.content.includes('src="/favicon.svg"'),
  "Brand background samples must own one truthful on-light and one on-dark tone while the favicon specimen reuses the canonical asset directly.",
);
expect(
  JSON.stringify(generatedManifest.collections).includes("hito-workout") === false,
  "Workout-domain colors leaked into the shared foundation manifest.",
);
expect(
  JSON.stringify(generatedManifest.textStyles.map((role) => role.id)) ===
    JSON.stringify(targetTypographyRoleIds),
  `Generated Text Styles must exactly match the 14-role target: ${generatedManifest.textStyles.map((role) => role.id).join(", ")}.`,
);
targetTypographyRoles.forEach((role) => {
  const manifestRole = generatedManifest.textStyles.find((textStyle) => textStyle.id === role.id);
  expect(
    manifestRole?.className === role.className && manifestRole.properties["font-family"] != null,
    `Generated manifest is missing canonical target role ${role.id}.`,
  );
});
expect(
  foundationsPage?.content.includes("HITO_TYPOGRAPHY_GROUPS.map((group)") === true &&
    foundationsPage.content.includes("HITO_TYPOGRAPHY_GROUPS.filter") === false &&
    foundationsPage.content.includes("HITO_TYPOGRAPHY_GROUPS.flatMap") &&
    foundationsPage.content.includes("const TYPOGRAPHY_FAMILY_SPECIMENS = [") === false &&
    targetTypographyRoleIds.every((id) => typographyRolesById.has(id)) &&
    foundationsPage.content.includes('id="type-semantic-tones"') &&
    [
      "--color-foreground",
      "--color-text-accent",
      "--color-text-positive",
      "--color-text-negative",
      "--color-text-warning",
      "--color-text-disabled",
    ].every((token) => foundationsPage.content.includes(token)),
  "Foundations must render the full target typography groups and independent semantic text tones.",
);
expect(
  brandPage?.content.includes("hito-surface-quiet") === true &&
    brandPage.content.includes("hito-ui-title-xs") &&
    brandPage.content.includes('data-hito-ds-pattern="quiet-surface"'),
  "Foundations must show the canonical quiet surface with real UI typography.",
);
expect(
  generatedManifest.sourceDigest?.startsWith("sha256:") === true,
  "Generated manifest is missing its deterministic source digest.",
);
generatedManifest.collections.primitiveSpacing.forEach((spacing, index) => {
  const expectedAlias = `--spacing-hito-${spacing.id.replace("space-", "")}: var(${spacing.cssVariable});`;
  expect(
    foundationsCss.includes(expectedAlias),
    `Tailwind spacing alias mismatch at manifest index ${index}: ${expectedAlias}`,
  );
});
expect(
  redundantFoundationProofExists === false,
  "The retired standalone foundation proof root returned beside the canonical package validator.",
);
expect(
  referenceMetadata?.content.includes("HITO_BUTTON_SIZES") === true &&
    referenceMetadata.content.includes("HITO_BUTTON_VARIANTS"),
  "Inspector reference metadata must consume the central Button contract.",
);
expect(
  referenceMetadata?.content.includes('id: "quiet-surface"') === true &&
    referenceMetadata.content.includes('referencePath: "/hitoDS/foundations#gradient-overlays"') &&
    referenceMetadata.content.includes('sourcePath: "src/styles/reference-workbench.css"'),
  "Inspector reference metadata must resolve the canonical quiet-surface owner.",
);
expect(
  (referenceStructure?.content.match(/data-hito-ds-pattern="quiet-surface"/g) ?? []).length === 2 &&
    (referenceStructure?.content.match(/hito-surface-quiet hito-shell-profile-trigger/g) ?? [])
      .length === 2,
  "The shell playground must expose two interactive quiet-surface consumers with ownership markers.",
);
expect(
  buttonSource?.content.includes("export { HitoButton }") === true &&
    buttonSource.content.includes("buttonVariants") === false &&
    buttonSource.content.includes("const Button =") === false &&
    buttonSource.content.includes("interface ButtonProps") === false &&
    buttonSource.content.includes('from "class-variance-authority"') === false,
  "Button owner must expose only the canonical HitoButton runtime API.",
);
expect(
  buttonSource?.content.includes("size: HitoButtonSize;") === true &&
    buttonSource.content.includes("variant: HitoButtonVariant;"),
  "HitoButton must require an explicit size and hierarchy.",
);
expect(
  buttonSource?.content.includes('iconOnly: true; "aria-label": string') === true,
  "Icon-only HitoButton usage must require an accessible name.",
);
expect(
  buttonSource?.content.includes("loading?: boolean;") === true &&
    buttonSource.content.includes("disabled={disabled || loading}") &&
    buttonSource.content.includes('"aria-busy": loading ? true : ariaBusy'),
  "HitoButton loading must expose busy truth and block repeat native activation.",
);
expect(
  buttonSource?.content.includes("state?: HitoButtonState") === false,
  "HitoButton must not collapse native and lifecycle semantics into a generic state prop.",
);
expect(
  dialogSource?.content.includes("<DialogPrimitive.Close asChild>") === true &&
    dialogSource.content.includes("<HitoButton") &&
    sheetSource?.content.includes("<SheetPrimitive.Close asChild>") === true &&
    sheetSource.content.includes("<HitoButton") &&
    overlaysFeedbackSource?.content.includes(".hito-ui-dialog-close") === false &&
    overlaysFeedbackSource?.content.includes(".hito-ui-sheet-close") === false,
  "Dialog and Sheet close controls must compose HitoButton without legacy visual recipes.",
);
expect(
  localNotionActionsSource?.content.includes('variant="primary"') === true &&
    localNotionActionsSource.content.includes("Send to Notion") &&
    localNotionActionsSource.content.includes("Copy prompt") &&
    localNotionActionsSource.content.includes("<DropdownMenuItem"),
  "Local Debugger outcomes must use one Notion menu trigger plus one prompt-copy HitoButton.",
);
expect(
  sliderSource?.content.includes("size?: HitoFieldSize;") === true &&
    sliderSource.content.includes('size = "sm"') &&
    sliderSource.content.includes("markers?: readonly number[];") &&
    sliderSource.content.includes('className="hito-slider-marker"') &&
    sliderSource.content.includes('className="hito-slider-handle"') &&
    sliderSource.content.includes("previousValue?: number;") &&
    sliderSource.content.includes('type="button"') &&
    sliderSource.content.includes("onClick={() => onValueChange(previousValue)}"),
  "HitoSlider must reuse the field size scale and restore an available baseline through its controlled callback.",
);
expect(
  dualRangeSource?.content.includes("size?: HitoFieldSize;") === true &&
    dualRangeSource.content.includes('size = "sm"') &&
    dualRangeSource.content.includes("markers?: readonly number[];") &&
    dualRangeSource.content.includes('className="hito-dual-range-marker"') &&
    dualRangeSource.content.includes("hito-dual-range-handle-min") &&
    dualRangeSource.content.includes("hito-dual-range-handle-max") &&
    dualRangeSource.content.includes("previousValue?: readonly [number, number];") &&
    dualRangeSource.content.includes("onClick={() => onMinValueChange(previousValue[0])}") &&
    dualRangeSource.content.includes("onClick={() => onMaxValueChange(previousValue[1])}"),
  "HitoDualRange must reuse the field size scale and restore each baseline endpoint independently.",
);
expect(
  selectorDeclarations(controlsCss, ".hito-slider-rail")?.background ===
    "color-mix(in oklch, var(--color-foreground) 14%, transparent)" &&
    selectorDeclarations(controlsCss, ".hito-dual-range-rail")?.background ===
      "color-mix(in oklch, var(--color-foreground) 14%, transparent)" &&
    controlsCss.includes(
      "background: color-mix(in oklch, var(--hito-dual-range-accent) 44%, transparent);",
    ) &&
    controlsCss.includes(
      "background: color-mix(in oklch, var(--color-foreground) 42%, transparent);",
    ) &&
    controlsCss.includes("height: var(--hito-range-control-height") &&
    selectorDeclarations(controlsCss, ".hito-slider-input::-webkit-slider-thumb")?.background ===
      "transparent" &&
    selectorDeclarations(controlsCss, ".hito-dual-range-input::-webkit-slider-thumb")
      ?.background === "transparent" &&
    selectorDeclarations(controlsCss, ".hito-slider-handle")?.background ===
      "var(--hito-slider-accent)" &&
    selectorDeclarations(controlsCss, ".hito-dual-range-handle")?.background ===
      "var(--hito-dual-range-accent)" &&
    controlsCss.includes("left var(--hito-motion-duration-140) var(--hito-motion-ease-out)") &&
    controlsCss.includes(".hito-slider-input:focus-visible ~ .hito-slider-visual-track") &&
    controlsCss.includes(".hito-dual-range-input-min:focus-visible") &&
    controlsCss.includes(".hito-dual-range-selection {"),
  "Slider chrome must retain alpha rail/selection/markers with full-height solid signal handles.",
);
expect(
  selectorDeclarations(controlsCss, ".hito-slider-input,\n  .hito-dual-range-rail")?.cursor ===
    "pointer" &&
    selectorDeclarations(
      controlsCss,
      ".hito-slider-input::-webkit-slider-thumb,\n  .hito-dual-range-input::-webkit-slider-thumb",
    )?.cursor === "grab" &&
    selectorDeclarations(
      controlsCss,
      ".hito-slider-input::-moz-range-thumb,\n  .hito-dual-range-input::-moz-range-thumb",
    )?.cursor === "grab" &&
    selectorDeclarations(controlsCss, ".hito-slider-input:active,\n  .hito-dual-range-rail:active")
      ?.cursor === "grabbing" &&
    selectorDeclarations(
      controlsCss,
      ".hito-slider-input:active::-webkit-slider-thumb,\n  .hito-dual-range-input:active::-webkit-slider-thumb",
    )?.cursor === "grabbing" &&
    selectorDeclarations(
      controlsCss,
      ".hito-slider-input:active::-moz-range-thumb,\n  .hito-dual-range-input:active::-moz-range-thumb",
    )?.cursor === "grabbing" &&
    selectorDeclarations(controlsCss, '.hito-slider[data-disabled="true"] .hito-slider-input')
      ?.cursor === "not-allowed" &&
    selectorDeclarations(
      controlsCss,
      '.hito-dual-range[data-disabled="true"] .hito-dual-range-rail',
    )?.cursor === "not-allowed",
  "Single and dual sliders must share pointer rails, grab handles, grabbing active states, and disabled cursor affordance.",
);
expect(
  sliderPlaygroundSource?.content.includes("HITO_FIELD_SIZES.map") === true &&
    sliderPlaygroundSource.content.includes("HitoDualRange") &&
    sliderPlaygroundSource.content.includes('aria-label="Slider size"') &&
    sliderPlaygroundSource.content.includes("markers={markerValues}") &&
    sliderPlaygroundSource.content.includes("markers={dualMarkerValues}") &&
    sliderPlaygroundSource.content.includes("previousValue={previousValue}") &&
    sliderPlaygroundSource.content.includes("previousValue={previousDualValue}"),
  "The Slider playground must expose every shared size and interactive single/dual baseline restoration.",
);
expect(
  completionPanelSource?.content.includes("previousValue={syncedFormState.rpe ?? 6}") === true &&
    bodyNotesSource?.content.includes("baselineBodyNotes[index]?.severity ?? 2") === true &&
    heartRateProfileSource?.content.includes("summary.zones[index]?.minBpm") === true &&
    heartRateProfileSource.content.includes("summary.zones[index]?.maxBpm"),
  "Every direct product slider consumer must source its baseline from existing edit-session or persisted truth.",
);
expect(
  choiceSource?.content.includes('{ presentation?: "inline"; size: HitoChoiceToggleSize }') ===
    true && choiceSource.content.includes('{ presentation: "card"; size?: never }'),
  "Choice Toggle must require size for inline controls and keep card as a separate presentation.",
);
expect(
  choiceSource?.content.includes('role === "radio" ? (ariaChecked ?? selected)') === true &&
    choiceSource.content.includes('role === "radio" ? ariaPressed : (ariaPressed ?? selected)'),
  "Choice Toggle must expose truthful radio or pressed semantics from the selected state.",
);
expect(
  calendarSource?.content.includes('import { HitoButton } from "@/components/ui/button"') ===
    true && calendarSource.content.includes("hitoButtonClasses") === true,
  "Calendar navigation and day controls must consume the canonical Hito control contract.",
);
expect(
  calendarSource?.content.includes("buttonVariants") === false &&
    calendarSource.content.includes("buttonVariant") === false &&
    dateTimeInputSource?.content.includes("buttonVariant") === false,
  "Calendar and date-time input must not retain the legacy Button compatibility handoff.",
);
expect(
  selectionMechanicsSource?.content.includes("moveHitoSelection") === true &&
    tabsSource?.content.includes("hito-selection-mechanics") === true &&
    radioGroupSource?.content.includes("hito-selection-mechanics") === true,
  "Tabs and Radio must resolve their neutral mechanics through one internal owner.",
);
expect(
  selectionImportLeaks.length === 0,
  `Neutral selection mechanics leaked outside Tabs and Radio: ${selectionImportLeaks
    .map((file) => file.relativePath)
    .join(", ")}`,
);
expect(
  selectionImplementationLeaks.length === 0,
  `Neutral selection mechanics were duplicated outside their owner: ${selectionImplementationLeaks
    .map((finding) => `${finding.relativePath} (${finding.marker})`)
    .join(", ")}`,
);
expect(
  sourceFiles.filter((file) => file.content.includes("export type HitoSelectionItem")).length ===
    1 && selectionMechanicsSource?.content.includes("export type HitoSelectionItem") === true,
  "The neutral selection-item type must have one declaration owner.",
);
expect(
  radioGroupSource?.content.includes("@/components/ui/hito-tabs") === false,
  "Radio must not import a component contract from Tabs.",
);
expect(
  [tabsSource, radioGroupSource].every(
    (file) =>
      file?.content.includes("function moveSelection") === false &&
      file?.content.includes("function safeIdPart") === false,
  ),
  "Tabs or Radio reintroduced duplicated neutral selection mechanics.",
);
expect(
  tabsSource?.content.includes("-tab-") === true &&
    tabsSource.content.includes("-panel-") &&
    radioGroupSource?.content.includes("-option-") === true,
  "Tabs and Radio must preserve their component-specific ID suffixes.",
);
expect(
  tabsSource?.content.includes('role: "tablist" as const') === true &&
    tabsSource.content.includes('role: "tab" as const') &&
    tabsSource.content.includes('role: "tabpanel" as const') &&
    tabsSource.content.includes('"aria-selected": value === itemValue') &&
    tabsSource.content.includes('event.key === "ArrowRight"') &&
    tabsSource.content.includes('event.key === "ArrowLeft"') &&
    tabsSource.content.includes('event.key === "ArrowDown"') === false &&
    tabsSource.content.includes('event.key === "ArrowUp"') === false,
  "Tabs must preserve their horizontal tab roles, ARIA, and key map.",
);
expect(
  radioGroupSource?.content.includes('role: "radiogroup" as const') === true &&
    radioGroupSource.content.includes('role: "radio" as const') &&
    radioGroupSource.content.includes('"aria-checked": value === itemValue') &&
    radioGroupSource.content.includes('event.key === "ArrowRight" || event.key === "ArrowDown"') &&
    radioGroupSource.content.includes('event.key === "ArrowLeft" || event.key === "ArrowUp"'),
  "Radio must preserve its radiogroup roles, ARIA, and two-axis key map.",
);
expect(
  [tabsSource, radioGroupSource].every(
    (file) =>
      file?.content.includes("target?.focus();") && file.content.includes("target?.click();"),
  ),
  "Tabs and Radio must retain their established DOM focus-and-activation contract.",
);

const productDemoStateFiles = sourceFiles.filter(
  (file) =>
    file.content.includes("data-demo-state") &&
    !file.relativePath.startsWith("src/components/hito-ds/") &&
    !file.relativePath.startsWith("src/components/devtools/") &&
    !file.relativePath.startsWith("src/styles/") &&
    !demoStatePrimitiveAllowlist.has(file.relativePath),
);
expect(
  productDemoStateFiles.length === 0,
  `Demo-only pseudo-state leaked into Product source: ${productDemoStateFiles
    .map((file) => file.relativePath)
    .join(", ")}`,
);

const externalResolverImports = sourceFiles.filter(
  (file) =>
    !file.relativePath.startsWith("src/components/ui/") &&
    componentClassResolvers.some(
      (resolver) =>
        file.content.includes(resolver) && file.content.includes("hito-control-contract"),
    ),
);
expect(
  externalResolverImports.length === 0,
  `Component class resolvers leaked outside shared primitive ownership: ${externalResolverImports
    .map((file) => file.relativePath)
    .join(", ")}`,
);

validateSelfTest();
validateSelectionMechanics();

if (errors.length > 0) {
  console.error("[hito-ds-components] validation failed");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  const counts = {
    button: {
      sizes: HITO_BUTTON_SIZES.length,
      tones: HITO_BUTTON_TONES.length,
      variants: HITO_BUTTON_VARIANTS.length,
    },
    choice: { sizes: HITO_CHOICE_TOGGLE_SIZES.length },
    field: { sizes: HITO_FIELD_SIZES.length, variants: HITO_FIELD_VARIANTS.length },
    slider: { kinds: 2, sizes: HITO_FIELD_SIZES.length },
    foundation: {
      geometry: foundationGeometryDefinitions.length,
      retiredSelectors: retiredFoundationSelectors.length,
      retiredTokens: retiredFoundationTokens.length,
      retiredWorkoutShades: retiredWorkoutShadeDeclarations.length,
      primitiveColors: generatedManifest.collections.primitiveColor.length,
      semanticColors: generatedManifest.collections.semanticColor.length,
      textStyles: generatedManifest.textStyles.length,
      uiTitleRoles: targetTypographyRoles.filter((role) => role.group === "ui-title").length,
      workoutDomainBases: retainedWorkoutBaseDefinitions.length,
    },
    reference: {
      currentDocs: currentReferenceDocs.length,
      productDependencies: showcaseBoundaryLeaks.length,
      role: "public-interactive",
      workbenchSettingsConsumers: workbenchSettingsConsumers.length,
      workoutLibraryIdentities: WORKOUT_LIBRARY_IDENTITY_COUNT,
    },
    scannedFiles: sourceFiles.length,
  };
  console.log(`[hito-ds-components] contract ok ${JSON.stringify(counts)}`);
}

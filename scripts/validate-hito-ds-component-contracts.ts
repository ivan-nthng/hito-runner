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
import {
  WORKOUT_LIBRARY_CANONICAL_IDENTITY_COUNT,
  WORKOUT_LIBRARY_IDENTITY_COUNT,
} from "../src/components/hito-ds/workout-library-playground-data";
import { HITO_TYPOGRAPHY_ROLES } from "../src/lib/hito-typography-roles";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const controlsCssPath = path.join(rootDir, "src/styles/controls-lists.css");
const fieldBaseCssPath = path.join(rootDir, "src/styles/controls-fields.css");
const fieldsCssPath = path.join(rootDir, "src/styles/forms-onboarding.css");
const foundationsCssPath = path.join(rootDir, "src/styles/foundations.css");
const typographyCssPath = path.join(rootDir, "src/styles/layout-typography.css");
const referenceWorkbenchCssPath = path.join(rootDir, "src/styles/reference-workbench.css");
const shellCssPath = path.join(rootDir, "src/styles/shell-admin-analytics.css");
const generatedManifestPath = path.join(rootDir, "src/generated/hito-ds-manifest.json");
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
const showcaseImportPrefixes = [
  "@/components/hito-ds/",
  "@/generated/hito-ds-manifest",
  "@/routes/hitoDS",
] as const;
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

type GeneratedManifest = {
  collections: {
    primitiveSpacing: Array<{ cssVariable: string; id: string }>;
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
    .filter((file) => file.relativePath.startsWith("src/components/hito-ds/"))
    .flatMap((file) => {
      // The capture board's inert select trigger is export geometry, not a live control.
      const content =
        file.relativePath === "src/components/hito-ds/figma-export-board.tsx"
          ? file.content.replace(
              /function StaticSelectTrigger[\s\S]*?(?=\nfunction StaticMenuItem)/,
              "",
            )
          : file.content;

      return referenceManualRecipePatterns.flatMap(({ family, pattern }) =>
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
    resolvedSpecifier === "src/generated/hito-ds-manifest" ||
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
  ]);
  expect(manualFindings.length === 2, "Self-test failed to detect manual reference control CSS.");

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
const foundationSearchFiles = (await collectSourceFiles(path.join(rootDir, "src"))).filter((file) =>
  /\.(css|ts|tsx)$/.test(file.relativePath),
);
const controlsCss = await readFile(controlsCssPath, "utf8");
const fieldBaseCss = await readFile(fieldBaseCssPath, "utf8");
const fieldExtendedCss = await readFile(fieldsCssPath, "utf8");
const foundationsCss = await readFile(foundationsCssPath, "utf8");
const typographyCss = await readFile(typographyCssPath, "utf8");
const referenceWorkbenchCss = await readFile(referenceWorkbenchCssPath, "utf8");
const shellCss = await readFile(shellCssPath, "utf8");
const generatedManifest = JSON.parse(
  await readFile(generatedManifestPath, "utf8"),
) as GeneratedManifest;
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
const hubRoute = sourceFiles.find((file) => file.relativePath === "src/routes/hub.tsx");
const showcaseBoundaryLeaks = showcaseBoundaryLeakFindings(sourceFiles);
const uiTitleRoles = HITO_TYPOGRAPHY_ROLES.filter((role) => role.group === "ui-title");
const editorialTitleRoles = HITO_TYPOGRAPHY_ROLES.filter((role) => role.group === "display");
const typographyRolesById = new Map(HITO_TYPOGRAPHY_ROLES.map((role) => [role.id, role]));
const titleLineBoxProperties = [
  "font-size",
  "font-weight",
  "letter-spacing",
  "line-height",
  "text-wrap",
] as const;

expect(
  uiTitleRoles.length === 4,
  `Expected four canonical UI title roles, found ${uiTitleRoles.length}.`,
);
expect(
  editorialTitleRoles.length === 5,
  `Expected five retained editorial title roles, found ${editorialTitleRoles.length}.`,
);
expect(
  HITO_TYPOGRAPHY_ROLES.filter((role) => role.inspectorSelectable !== false).length === 18,
  "The Local Inspector must preserve its existing roles and add the four source-backed UI titles.",
);
uiTitleRoles.forEach((uiRole) => {
  const editorialRoleId = uiRole.id.replace(/^ui-/, "");
  const editorialRole = typographyRolesById.get(editorialRoleId);
  const uiDeclarations = selectorDeclarations(typographyCss, `.${uiRole.className}`);
  const editorialDeclarations = editorialRole
    ? selectorDeclarations(typographyCss, `.${editorialRole.className}`)
    : null;

  expect(editorialRole?.group === "display", `${uiRole.id} is missing its editorial counterpart.`);
  expect(
    uiRole.inspectorSelectable !== false && editorialRole?.inspectorSelectable !== false,
    `${uiRole.id} and ${editorialRoleId} must remain available for their distinct UI/editorial contexts.`,
  );
  expect(uiDeclarations !== null, `Missing CSS owner for ${uiRole.className}.`);
  expect(editorialDeclarations !== null, `Missing CSS owner for ${editorialRole?.className}.`);
  expect(
    uiDeclarations?.["--hito-typography-role"] === uiRole.id,
    `${uiRole.className} is missing truthful typography provenance.`,
  );
  expect(
    uiDeclarations?.["font-family"] === "var(--font-sans)",
    `${uiRole.className} must resolve through the canonical sans primitive.`,
  );
  expect(
    editorialDeclarations?.["font-family"] === "var(--font-display)",
    `${editorialRole?.className} must remain explicitly editorial serif.`,
  );
  titleLineBoxProperties.forEach((property) => {
    expect(
      (uiDeclarations?.[property] ?? null) === (editorialDeclarations?.[property] ?? null),
      `${uiRole.className} drifted from ${editorialRole?.className} ${property}.`,
    );
  });
});

const shellProfileDeclarations = selectorDeclarations(shellCss, ".hito-shell-profile-trigger");
expect(
  referenceWorkbenchCss.includes(".hito-surface-quiet,\n  .hito-shell-profile-trigger {") &&
    referenceWorkbenchCss.includes("var(--color-surface)") &&
    referenceWorkbenchCss.includes("var(--color-surface-elevated)") &&
    referenceWorkbenchCss.includes("border-radius: var(--radius-xl)") &&
    referenceWorkbenchCss.includes(
      '.hito-shell-profile-trigger:not(:disabled):not([aria-disabled="true"]):hover',
    ) &&
    referenceWorkbenchCss.includes("box-shadow: 0 0 0 2px var(--color-ring)"),
  "Quiet surface and shell profile chrome must share one token-derived visual owner.",
);
expect(
  shellProfileDeclarations?.border === undefined &&
    shellProfileDeclarations?.["border-radius"] === undefined &&
    shellProfileDeclarations?.background === undefined &&
    shellProfileDeclarations?.["box-shadow"] === undefined,
  "Shell profile chrome was duplicated outside the shared quiet-surface owner.",
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
validateCssSelectors(controlsCss, "hito-choice-toggle", HITO_CHOICE_TOGGLE_SIZES);

retiredClassFindings(sourceFiles).forEach((finding) => {
  errors.push(`Retired control class returned: ${finding}`);
});
referenceManualRecipeFindings(sourceFiles).forEach((finding) => {
  errors.push(`Hito DS reference bypassed a shared control primitive: ${finding}`);
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
const choiceSource = sourceFiles.find(
  (file) => file.relativePath === "src/components/ui/hito-choice-toggle.tsx",
);
const calendarSource = sourceFiles.find(
  (file) => file.relativePath === "src/components/ui/calendar.tsx",
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

expect(
  referenceControls?.content.includes("HITO_BUTTON_SIZES") === true &&
    referenceControls.content.includes("HITO_FIELD_SIZES") &&
    referenceControls.content.includes("HITO_CHOICE_TOGGLE_SIZES"),
  "Hito DS controls must consume the central control contract.",
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
  `Reference workbench settings consumers drifted from the exact four-file owner boundary: ${workbenchSettingsConsumers
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
  workoutColorTokensSource?.content.includes("WORKOUT_COLOR_STATE_SLOTS") === true &&
    workoutColorTokensSource.content.includes("workoutTypeColorVar") &&
    workoutColorTokensSource.content.includes("workoutSectionColorVar") &&
    retiredWorkoutColorApiMarkers.every(
      (marker) => workoutColorTokensSource.content.includes(marker) === false,
    ),
  "Workout colors must expose only the semantic type and section TypeScript contract.",
);
expect(
  foundationsPage?.content.includes('id="workout-semantic-type-colors"') === true &&
    foundationsPage.content.includes('id="workout-semantic-section-colors"') &&
    retiredWorkoutReferenceMarkers.every(
      (marker) => foundationsPage.content.includes(marker) === false,
    ),
  "Foundations must document semantic workout roles without reviving raw shade ramps.",
);
const foundationGeometryDefinitions = [
  ...foundationsCss.matchAll(/(--hito-[a-z0-9-]*(?:width|height)[a-z0-9-]*)\s*:/gi),
].map((match) => match[1]);
expect(
  foundationGeometryDefinitions.length === 0,
  `Component geometry remains in foundations.css: ${foundationGeometryDefinitions.join(", ")}`,
);
expect(
  [figmaBoard, foundationsPage, lightPaletteReference].every((file) =>
    file?.content.includes("HITO_DS_MANIFEST"),
  ),
  "Figma board, Foundations page, and Light palette must consume HITO_DS_MANIFEST.",
);
expect(
  JSON.stringify(generatedManifest.collections).includes("hito-workout") === false,
  "Workout-domain colors leaked into the shared foundation manifest.",
);
expect(
  generatedManifest.textStyles.length === 18,
  `Expected 18 reusable text styles, received ${generatedManifest.textStyles.length}.`,
);
uiTitleRoles.forEach((role) => {
  const manifestRole = generatedManifest.textStyles.find((textStyle) => textStyle.id === role.id);
  expect(
    manifestRole?.className === role.className &&
      manifestRole.properties["font-family"] === "var(--font-sans)",
    `Generated manifest is missing canonical UI title ${role.id}.`,
  );
});
expect(
  foundationsPage?.content.includes("hito-surface-quiet") === true &&
    foundationsPage.content.includes("hito-ui-panel-title") &&
    foundationsPage.content.includes('data-hito-ds-pattern="quiet-surface"'),
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
  buttonSource?.content.includes("export { Button, HitoButton, buttonVariants }") === true,
  "Button owner must expose canonical HitoButton and preserve the Calendar compatibility API.",
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
  calendarSource?.content.includes(
    'import { Button, buttonVariants } from "@/components/ui/button"',
  ) === true,
  "Calendar CVA/shadcn Button compatibility boundary changed without its separate gate.",
);
expect(
  calendarSource?.content.includes("HitoButton") === false,
  "Calendar must not be migrated inside the component-contract cleanup.",
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
    foundation: {
      geometry: foundationGeometryDefinitions.length,
      retiredSelectors: retiredFoundationSelectors.length,
      retiredTokens: retiredFoundationTokens.length,
      retiredWorkoutShades: retiredWorkoutShadeDeclarations.length,
      textStyles: generatedManifest.textStyles.length,
      uiTitleRoles: uiTitleRoles.length,
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

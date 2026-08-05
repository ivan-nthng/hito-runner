import { readdir, readFile } from "node:fs/promises";
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

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const controlsCssPath = path.join(rootDir, "src/styles/controls-lists.css");
const fieldBaseCssPath = path.join(rootDir, "src/styles/controls-fields.css");
const fieldsCssPath = path.join(rootDir, "src/styles/forms-onboarding.css");
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

const errors: string[] = [];

function expect(condition: boolean, message: string) {
  if (!condition) errors.push(message);
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

function declaresSelector(css: string, selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^\\s*${escaped}(?=\\s|\\{|,|:)`, "m").test(css);
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
}

const sourceFiles = (
  await Promise.all([
    collectSourceFiles(path.join(rootDir, "src/components")),
    collectSourceFiles(path.join(rootDir, "src/generated")),
    collectSourceFiles(path.join(rootDir, "src/lib")),
    collectSourceFiles(path.join(rootDir, "src/routes")),
    collectSourceFiles(path.join(rootDir, "src/styles")),
    collectSourceFiles(path.join(rootDir, "scripts/fixtures")),
  ])
).flat();
const controlsCss = await readFile(controlsCssPath, "utf8");
const fieldBaseCss = await readFile(fieldBaseCssPath, "utf8");
const fieldExtendedCss = await readFile(fieldsCssPath, "utf8");
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
const referenceMetadata = sourceFiles.find(
  (file) => file.relativePath === "src/components/hito-ds/reference-metadata.ts",
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
  referenceMetadata?.content.includes("HITO_BUTTON_SIZES") === true &&
    referenceMetadata.content.includes("HITO_BUTTON_VARIANTS"),
  "Inspector reference metadata must consume the central Button contract.",
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
    reference: {
      currentDocs: currentReferenceDocs.length,
      productDependencies: showcaseBoundaryLeaks.length,
      role: "public-interactive",
    },
    scannedFiles: sourceFiles.length,
  };
  console.log(`[hito-ds-components] contract ok ${JSON.stringify(counts)}`);
}

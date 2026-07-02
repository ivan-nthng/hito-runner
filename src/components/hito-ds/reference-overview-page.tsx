import { HitoMetadataTag } from "@/components/ui/metadata-tag";
import {
  ProductLinks,
  ReferenceListRow,
  ReferenceRow,
  SectionIntro,
} from "@/components/hito-ds/reference";

export function HitoDsOverviewPage() {
  return (
    <>
      <header id="overview" className="hito-page-header border-t border-hairline pt-8">
        <p className="hito-label hito-label-signal">Hito design system</p>
        <h1 className="hito-page-title">Simplified product language.</h1>
        <p className="hito-page-copy max-w-2xl">
          A compact reference for the simplified Hito product language: open route rhythm,
          divider-based grouping, restrained markers, quiet support copy, and explicit
          utility/disclosure treatment for secondary paths.
        </p>
      </header>

      <div className="hito-reference-list mt-8" aria-label="Reference surface principles">
        <ReferenceRow
          title="Open rhythm first"
          body="Reference copy, role notes, and implementation guidance should usually sit on the page without a card shell."
        />
        <ReferenceRow
          title="Rows before boxes"
          body="Use dividers and grouped rows for facts, metadata, and guidance before reaching for bordered surfaces."
        />
        <ReferenceRow
          title="Cards only when they earn it"
          body="Reserve framed surfaces for actual component specimens, payload-like examples, or shells whose border is part of the contract."
        />
      </div>

      <div className="hito-reference-note mt-6">
        <p className="hito-label hito-label-signal">How to use this workbench</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <ReferenceListRow
            label="Foundations"
            title="Start here for tokens"
            body="Use this group when a surface needs color, type, spacing, radius, logo, icon, or overlay guidance."
          />
          <ReferenceListRow
            label="Components"
            title="Start here for primitives"
            body="Use the preview + controls + contract specimens to inspect allowed component variants and states."
          />
          <ReferenceListRow
            label="Patterns"
            title="Start here for composed UI"
            body="Use this group for editorial timelines, tables, shell nav, async states, analytics summaries, and disclosure rows."
          />
          <ReferenceListRow
            label="Backlog"
            title="Check what is intentionally local"
            body="Use this group when a product surface looks custom and you need to know whether it is a DS gap or a route-owned exception."
          />
        </div>
      </div>
      <section id="figma-bridge" className="ds-section">
        <div className="hito-specimen-header">
          <SectionIntro
            label="Tools / Bridge"
            title="Code-owned DS export, ready for downstream Figma capture."
            body="Use this entrypoint to find the existing html.to.design capture board. Runtime Hito code and these DS owners remain source of truth; Figma import is a downstream handoff artifact."
          />
          <HitoMetadataTag tone="signal">Bridge</HitoMetadataTag>
        </div>

        <div className="hito-reference-list">
          <div className="hito-list-row items-start">
            <div className="min-w-0">
              <p className="hito-label">Export route</p>
              <p className="hito-list-row-title mt-2">Open the capture board for html.to.design.</p>
              <div className="hito-list-row-copy mt-2">
                <ProductLinks
                  links={[{ href: "/hitoDS/export/figma", label: "/hitoDS/export/figma" }]}
                />
              </div>
            </div>
          </div>
          <ReferenceListRow
            label="Purpose"
            title="Capture explicit DS matrices, not product runtime flows."
            body="The export board renders foundations, controls, menu rows, status surfaces, and icon inventory as visible states so html.to.design can import editable Figma layers."
          />
          <ReferenceListRow
            label="Source"
            title="Code stays canonical."
            body="The board reuses live Hito DS classes, wrappers, tokens, and specimens. Figma receives a handoff snapshot; it does not become runtime truth or a hidden token source."
          />
          <ReferenceListRow
            label="Boundary"
            title="No .h2d generator, Figma mutation, or Code Connect in this slice."
            body="Use html.to.design, the browser extension, or supported local file import downstream. Hito does not write binary .h2d artifacts or mutate Figma files from this route."
          />
        </div>
      </section>

      <section id="shared-wrappers" className="ds-section">
        <div className="hito-specimen-header">
          <SectionIntro
            label="Compatibility reference"
            title="Wrapper exports stay stable; component owners live elsewhere."
            body="Shared ui wrappers keep Radix behavior and compatibility exports, but they are no longer the primary specimen owner for Hito component anatomy."
          />
          <HitoMetadataTag tone="muted">Reference</HitoMetadataTag>
        </div>

        <div className="hito-reference-list">
          <div className="hito-list-row items-start">
            <div className="min-w-0">
              <p className="hito-label">Canonical owners</p>
              <p className="hito-list-row-title mt-2">
                Read component behavior in the accepted owner sections.
              </p>
              <div className="hito-list-row-copy mt-2">
                <ProductLinks
                  links={[
                    { href: "/hitoDS/components#dropdowns", label: "Dropdowns" },
                    { href: "/hitoDS/components#inputs", label: "Inputs" },
                    { href: "/hitoDS/components#selection-controls", label: "Selection" },
                    { href: "/hitoDS/components#modals", label: "Modals" },
                    { href: "/hitoDS/components#rows", label: "Rows" },
                    { href: "/hitoDS/components#shell", label: "Shell" },
                    { href: "/hitoDS/components#status", label: "Status" },
                    { href: "/hitoDS/components#async-actions", label: "Async" },
                  ]}
                />
              </div>
            </div>
          </div>
          <ReferenceListRow
            label="Compatibility"
            title="Wrapper imports and exports remain stable."
            body="Dialog, sheet, dropdown, select, card, progress, and related ui wrapper exports keep their existing API, keyboard, focus, portal, and controlled/uncontrolled behavior."
          />
          <ReferenceListRow
            label="Defaults"
            title="Hito tokens start the chrome, not the ownership."
            body="Wrapper defaults may carry Hito surface, field, menu, focus, overlay, or progress tokens, but final product anatomy belongs to the accepted owner sections above."
          />
          <ReferenceListRow
            label="Boundary"
            title="Do not treat wrappers as a second design system."
            body="Use wrappers for behavior and compatibility. Use owner sections for visual anatomy, state matrices, usage rules, and product-facing DS guidance."
          />
        </div>
      </section>

      <section id="backlog" className="ds-section">
        <SectionIntro
          label="Backlog"
          title="Known DS exceptions and rollout gaps."
          body="This section keeps the workbench honest: these areas are intentionally route-owned or waiting for a later bounded DS cleanup slice."
        />
        <div className="hito-reference-list">
          <ReferenceListRow
            label="Local"
            title="Chart geometry remains route-owned"
            body="Bar heights, widths, axis density, and visualization coordinates stay with the product route unless a repeated visualization primitive emerges."
          />
          <ReferenceListRow
            label="Local"
            title="Timeline grid and sticky scope remain route-owned"
            body="The DS owns editorial timeline typography, backdrop, dots, and inline code; changelog grouping, rail layout, and sticky boundaries stay with `/changelog`."
          />
          <ReferenceListRow
            label="In rollout"
            title="More interactive explorers can follow"
            body="Select, dropdown/menu, async toast lifecycle, shell rows, and deeper pattern references can become standardized specimens only when a concrete QA or product-consumer need appears."
          />
          <ReferenceListRow
            label="Temporary"
            title="Compatibility wrappers stay small"
            body="Radix/shadcn wrapper exports remain stable while their default visuals continue moving under Hito DS ownership."
          />
        </div>
      </section>
    </>
  );
}

import { HitoMetadataTag } from "@/components/ui/metadata-tag";
import { ProductLinks, ReferenceListRow, SectionIntro } from "@/components/hito-ds/reference";

export function HitoDsOverviewPage() {
  return (
    <>
      <header id="overview" className="hito-page-header border-t border-hairline pt-8">
        <p className="hito-label hito-label-signal">Hito design system</p>
        <h1 className="hito-page-title">Find, try, compare.</h1>
        <p className="hito-page-copy max-w-2xl">
          Browse and try the same live tokens and components used by Hito. Examples stay inside this
          reference sandbox.
        </p>
      </header>

      <section id="figma-bridge" className="ds-section">
        <div className="hito-specimen-header">
          <SectionIntro label="Tool" title="Figma export" />
          <HitoMetadataTag tone="signal">Bridge</HitoMetadataTag>
        </div>
        <div className="hito-reference-list">
          <ReferenceListRow
            label="Capture board"
            title="Editable downstream reference"
            body={
              <ProductLinks
                links={[{ href: "/hitoDS/export/figma", label: "/hitoDS/export/figma" }]}
              />
            }
          />
          <ReferenceListRow
            label="Boundary"
            title="Code stays canonical"
            body="Figma receives a snapshot of live Hito DS owners; it is not runtime token truth."
          />
        </div>
      </section>

      <section id="shared-wrappers" className="ds-section">
        <div className="hito-specimen-header">
          <SectionIntro label="Compatibility" title="Shared wrappers" />
          <HitoMetadataTag tone="muted">Reference</HitoMetadataTag>
        </div>
        <div className="hito-reference-list">
          <ReferenceListRow
            label="Canonical owners"
            title="Behavior stays stable; anatomy lives in Components"
            body={
              <ProductLinks
                links={[
                  { href: "/hitoDS/components#dropdowns", label: "Dropdowns" },
                  { href: "/hitoDS/components#inputs", label: "Inputs" },
                  { href: "/hitoDS/components#selection-controls", label: "Selection" },
                  { href: "/hitoDS/components#modals", label: "Modals" },
                  { href: "/hitoDS/components#rows", label: "Rows" },
                  { href: "/hitoDS/components#status", label: "Status" },
                ]}
              />
            }
          />
          <ReferenceListRow
            label="Boundary"
            title="Wrappers are not a second design system"
            body="Use wrappers for behavior and compatibility; use component owners for visual and state contracts."
          />
        </div>
      </section>

      <section id="backlog" className="ds-section">
        <SectionIntro label="Boundaries" title="Intentional local exceptions" />
        <div className="hito-reference-list">
          <ReferenceListRow
            label="Visualization"
            title="Chart geometry stays route-owned"
            body="Bar dimensions, axes, and plotted coordinates remain local until a repeated product primitive emerges."
          />
          <ReferenceListRow
            label="Editorial"
            title="Timeline layout stays with Changelog"
            body="The DS owns type, backdrop, markers, and inline code; grouping and sticky rail geometry stay route-owned."
          />
          <div id="value-tag">
            <ReferenceListRow
              label="Local devtool"
              title="Value Tag is not a product primitive"
              body="It remains limited to Local Inspector and audit specimens until a product consumer proves shared ownership."
            />
          </div>
        </div>
      </section>
    </>
  );
}

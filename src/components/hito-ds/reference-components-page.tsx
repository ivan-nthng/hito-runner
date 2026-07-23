import { CalendarWorkoutPlayground } from "@/components/hito-ds/calendar-workout-playground";
import { ProductLinks } from "@/components/hito-ds/reference";
import { HitoDsComponentControls } from "./reference-components-controls";
import { HitoDsComponentOverlays } from "./reference-components-overlays";
import { HitoDsComponentStructure } from "./reference-components-structure";

export function HitoDsComponentsPage() {
  return (
    <>
      <section className="hito-reference-note" aria-labelledby="nested-component-index-title">
        <p className="hito-label hito-label-signal">On this page</p>
        <h2 id="nested-component-index-title" className="hito-section-title mt-3">
          Nested shared component owners.
        </h2>
        <p className="hito-support-copy mt-3 max-w-2xl">
          These focused owners live inside broader workbench sections. Each row is a stable catalog
          home and points to the existing live specimen instead of duplicating it.
        </p>
        <div className="hito-reference-list mt-5">
          <ComponentOwnerIndexRow
            id="textarea"
            title="Textarea"
            body="Shared multiline Hito field anatomy."
            href="#inputs"
            specimen="Inputs / Variants"
          />
          <ComponentOwnerIndexRow
            id="native-select-field"
            title="Native Select Field"
            body="Native option behavior with shared label, helper, and field chrome."
            href="#inputs"
            specimen="Inputs / Variants"
          />
          <ComponentOwnerIndexRow
            id="date-time-fields"
            title="Date and Time Fields"
            body="Date picker, optional date, bounded date, and masked time field family."
            href="#inputs"
            specimen="Inputs / Variants"
          />
          <ComponentOwnerIndexRow
            id="avatar"
            title="Avatar"
            body="Shared avatar image/fallback owner with the product avatar action anatomy."
            href="#inputs"
            specimen="Inputs / Variants"
          />
          <ComponentOwnerIndexRow
            id="metadata-tag"
            title="Metadata Tag"
            body="Read-only and interactive operational metadata using the shared runtime tag owner."
            href="#status"
            specimen="Status / Variants"
          />
        </div>
        <p className="hito-caption mt-4">
          Value Tag is intentionally not a product primitive. See the source-backed{" "}
          <a href="/hitoDS#value-tag" className="hito-specimen-link">
            Value Tag boundary
          </a>
          .
        </p>
      </section>
      <HitoDsComponentControls />
      <HitoDsComponentOverlays />
      <CalendarWorkoutPlayground />
      <HitoDsComponentStructure />
    </>
  );
}

function ComponentOwnerIndexRow({
  body,
  href,
  id,
  specimen,
  title,
}: {
  body: string;
  href: string;
  id: string;
  specimen: string;
  title: string;
}) {
  return (
    <div id={id} className="hito-list-row items-start">
      <div>
        <p className="hito-label">Shared owner</p>
        <p className="hito-list-row-title mt-2">{title}</p>
        <p className="hito-list-row-copy">{body}</p>
        <div className="hito-list-row-copy mt-2">
          <ProductLinks links={[{ href, label: specimen }]} />
        </div>
      </div>
    </div>
  );
}

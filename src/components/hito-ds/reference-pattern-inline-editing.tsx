import { useState } from "react";
import { HitoDsPlayground } from "@/components/hito-ds/playground";
import { ToggleRow } from "@/components/hito-ds/specimen-previews";
import { InlineEditableText, InlineReadOnlyText } from "@/components/ui/inline-editable-text";

const INLINE_EDITING_VARIANTS = [
  {
    label: "Normal",
    note: "Reads like surrounding text and stays keyboard reachable.",
    props: {},
    value: "Easy aerobic run",
  },
  {
    label: "Hover",
    note: "Soft backdrop reveals the edit affordance without reflow.",
    props: { demoState: "hover" as const },
    value: "Progression finish",
  },
  {
    label: "Focus-visible",
    note: "Focus ring is distinct from hover and selected states.",
    props: { demoState: "focus" as const },
    value: "Tempo rhythm",
  },
  {
    label: "Edit",
    note: "The Hito field replaces the text in place.",
    props: { demoState: "edit" as const },
    value: "Long run",
  },
  {
    label: "Disabled",
    note: "Draft fields that cannot be changed are visibly inactive.",
    props: { disabled: true },
    value: "Disabled draft label",
  },
];

export function HitoDsPatternInlineEditing() {
  const [heading, setHeading] = useState("Tuesday interval tune-up");
  const [note, setNote] = useState("Keep the first two rounds smooth, then settle into rhythm.");
  const [showError, setShowError] = useState(true);

  return (
    <HitoDsPlayground
      id="inline-editable-text"
      label="Inline editable text"
      title="Text edits, read-only truth, and change-task targets stay separate."
      body="Use this pattern only where text is genuinely editable. Generated workout readback stays read-only; local task capture is non-mutating."
      status="Interaction pattern"
      statusTone="signal"
      demo={
        <div className="grid min-w-0 gap-5">
          <section className="hito-surface-flat grid min-w-0 gap-4 p-5">
            <div className="min-w-0">
              <p className="hito-label">Direct editable heading</p>
              <InlineEditableText
                aria-label="Edit workout title"
                className="mt-2"
                helper="Enter or blur saves single-line drafts; Escape cancels."
                onChange={setHeading}
                placeholder="Name this workout"
                size="lg"
                validate={(value) =>
                  value.trim().length < 3 ? "Use at least 3 characters." : null
                }
                value={heading}
                variant="header"
              />
            </div>

            <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)]">
              <div>
                <p className="hito-label">Multi-line editable note</p>
                <InlineEditableText
                  aria-label="Edit workout note"
                  helper="Multi-line edits use explicit Save/Cancel."
                  kind="multiline"
                  onChange={setNote}
                  value={note}
                />
              </div>
              <div>
                <p className="hito-label">Read-only generated row</p>
                <InlineReadOnlyText
                  className="mt-2"
                  helper="No edit affordance appears for generated preview/detail rows."
                  value={
                    <div className="min-w-0">
                      <p className="hito-list-row-title">Marathon steady finish</p>
                      <p className="hito-list-row-copy">Backend-generated workout truth.</p>
                    </div>
                  }
                />
              </div>
            </div>

            <div className="hito-reference-note">
              <p className="hito-list-row-title">Local task targeting</p>
              <p className="hito-list-row-copy">
                Use the local Dev tool toggle to create non-mutating UI task drafts.
              </p>
            </div>
          </section>
        </div>
      }
      variants={
        <div className="hito-reference-list">
          {INLINE_EDITING_VARIANTS.map((variant) => (
            <article className="hito-reference-row items-start" key={variant.label}>
              <div>
                <p className="hito-label">{variant.label}</p>
                <p className="hito-caption mt-2">{variant.note}</p>
              </div>
              <InlineEditableText
                aria-label={`Edit ${variant.label.toLowerCase()} title`}
                onChange={() => {}}
                size="md"
                value={variant.value}
                variant="header"
                {...variant.props}
              />
            </article>
          ))}
          <article className="hito-reference-row items-start">
            <div>
              <p className="hito-label">Error / read-only</p>
              <p className="hito-caption mt-2">
                Invalid drafts stay in edit mode; generated truth reads normally.
              </p>
            </div>
            <div className="grid min-w-0 gap-3">
              <InlineEditableText
                aria-label="Edit invalid title"
                demoState={showError ? "error" : undefined}
                error={showError ? "Use at least 3 characters." : undefined}
                onChange={() => {}}
                size="md"
                value="A"
                variant="header"
              />
              <InlineEditableText
                aria-label="Read-only generated title"
                helper="Read-only generated text stays readable, not disabled-looking."
                onChange={() => {}}
                readOnly
                size="md"
                value="Generated read-only row"
                variant="header"
              />
            </div>
          </article>
        </div>
      }
      controls={
        <div className="hito-row-group border-0">
          <ToggleRow
            active={showError}
            label="Show error"
            onToggle={() => setShowError((value) => !value)}
          />
        </div>
      }
      caption={[
        {
          label: "Use for",
          body: "Manual workout draft titles, section labels, template names, and other text values with a real edit owner.",
        },
        {
          label: "Do not use for",
          body: "Generated plan preview/detail rows, provider evidence, backend feasibility facts, or any surface without an edit contract.",
        },
        {
          label: "Change tasks",
          body: "Task targeting stays local-only and non-mutating unless a future accepted persistence seam owns it.",
        },
      ]}
    />
  );
}

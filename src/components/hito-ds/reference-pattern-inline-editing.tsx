import { useState } from "react";
import { HitoDsPlayground } from "@/components/hito-ds/playground";
import { ToggleRow } from "@/components/hito-ds/specimen-previews";
import { InlineEditableText, InlineReadOnlyText } from "@/components/ui/inline-editable-text";

const INLINE_EDITING_VARIANTS = [
  {
    label: "Normal",
    props: {},
    value: "Easy aerobic run",
  },
  {
    label: "Hover",
    props: { demoState: "hover" as const },
    value: "Progression finish",
  },
  {
    label: "Focus-visible",
    props: { demoState: "focus" as const },
    value: "Tempo rhythm",
  },
  {
    label: "Edit",
    props: { demoState: "edit" as const },
    value: "Long run",
  },
  {
    label: "Disabled",
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
      status="Interaction pattern"
      statusTone="signal"
      description={{
        purpose:
          "Let a short visible title or label enter a bounded text-edit state without replacing its reading hierarchy.",
        useWhen:
          "A source-owned short string benefits from direct edit, commit, cancel, and validation in place.",
        avoidWhen:
          "The edit is long-form, multi-field, destructive, or requires a separate review workflow.",
        accessibility:
          "The edit affordance is named; Enter, Escape, blur, validation, focus restoration, and read-only state remain explicit.",
      }}
      usedIn="Manual workout draft titles, section labels, and template names."
      demo={
        <section className="grid w-full min-w-0 gap-4">
          <div className="min-w-0">
            <InlineEditableText
              aria-label="Edit workout title"
              helper="Enter or blur saves single-line drafts; Escape cancels."
              onChange={setHeading}
              placeholder="Name this workout"
              size="lg"
              validate={(value) => (value.trim().length < 3 ? "Use at least 3 characters." : null)}
              value={heading}
              variant="header"
            />
          </div>

          <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)]">
            <div>
              <InlineEditableText
                aria-label="Edit workout note"
                helper="Multi-line edits use explicit Save/Cancel."
                kind="multiline"
                onChange={setNote}
                value={note}
              />
            </div>
            <div>
              <InlineReadOnlyText
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
        </section>
      }
      variants={
        <div className="hito-reference-list">
          {INLINE_EDITING_VARIANTS.map((variant) => (
            <article className="hito-reference-row items-start" key={variant.label}>
              <p className="hito-label-md">{variant.label}</p>
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
            <p className="hito-label-md">Error / read-only</p>
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
    />
  );
}

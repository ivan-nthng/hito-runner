# Hito DS Foundations Color Provenance And Context Readability

## Work Item ID

2026-08-11-hito-ds-foundations-color-provenance-and-context-readability

## Status

closed

## Type

design-system-reference

## Priority

high

## Owner

design_system

## Mode

Tracked

## Scope

Make the existing `/hitoDS/foundations` color reference explain every displayed colour truthfully:
semantic role, authored source primitive or mix recipe, alpha contribution, and resolved active-theme
HEX. Make the existing Context tab a spacious, inspectable composition specimen rather than an
unlabelled stack of layers.

This task exposes existing color truth. It does not redesign values, add palette controls, create a
second colour system, or change Product color consumption.

## Archive Intent

retain_in_place

## Task

Extend the existing manifest-to-Foundations presentation path so colour provenance is not discarded
between canonical CSS and the rendered reference. Every semantic and primitive specimen must say
whether its value is an absolute primitive or an alpha/composite formula. It must show the current
theme's resolved HEX without pretending that a multi-source `color-mix()` came from one primitive.

Recompose the existing Context tab using the same real semantic roles, now with enough space and
inspectable provenance to show how canvas, surfaces, text, chrome, actions, and status work together.

## User Report

Ivan cannot tell from Foundations whether a semantic swatch is an absolute value or a token with
transparency. He needs to see the source primitive and degree of transparency, plus the colour's
HEX code. The Context tab is currently too cramped and only labels nested layers; it needs more
space and must identify the variables/values used. On desktop, hover/focus may reveal details. On
mobile, the same facts must be visible inline or available by touch; they cannot depend on hover.

User evidence is retained locally:

- [Semantic cards current state](assets/2026-08-11-hito-ds-foundations-color-provenance-and-context-readability/semantic-colors-current.png)
- [Primitive cards current state](assets/2026-08-11-hito-ds-foundations-color-provenance-and-context-readability/primitives-current.png)
- [Context current state](assets/2026-08-11-hito-ds-foundations-color-provenance-and-context-readability/context-current.png)

## Observed Behavior

- `SemanticColorCard` reduces each manifest entry to only `name`, `var(--token)`, and optional
  contrast pairing at `src/components/hito-ds/reference-foundations-page.tsx:81-85`; the displayed
  card therefore hides its primitive alias, mix formula, and opacity.
- `PrimitiveColorCard` renders a swatch, shade, and CSS variable but no resolved HEX or alpha
  provenance.
- The generated manifest already retains partial semantic source truth:
  direct aliases such as `border → --sand-alpha-08`, and raw `color-mix()` expressions such as
  `chrome-subtle → color-mix(in oklch, var(--foreground) 8%, transparent)`. It does not expose a
  normalized provenance model or active-theme resolved HEX for the reference.
- The current Context panel at `reference-foundations-page.tsx:528-607` shows only three compact
  modules and unlabelled visual layers; it has no interaction or source-value reveal.

## Demonstrated Cause

The canonical CSS and the manifest contain enough raw information to distinguish aliases from
formulae, but the Foundations view collapses that information into `var(--semantic-token)`. The
reference therefore makes transparent/composite values indistinguishable from absolute colours and
cannot explain the nested Context layers it renders.

## Accepted Product Direction

### Truth shown for every displayed colour

Each semantic and primitive reference specimen must expose, without invented metadata:

1. **Role/token** — e.g. `var(--border)`.
2. **Authored source** — the actual primitive alias or exact `color-mix()` source recipe.
3. **Alpha contribution** — the source alpha primitive or percentage when it exists.
4. **Resolved active-theme HEX** — exact rendered colour for the current theme. Preserve alpha in
   the HEX representation when the authored/resolved value is translucent.

For a direct alias, show the primitive and its declared alpha (for example
`--sand-alpha-08 · 8%`). For a multi-source mix, show all sources and their percentages exactly;
never collapse it to a fictional single primitive. If a formula's final composite depends on an
underlying layer, name that backing role and show the resulting HEX for that actual Context/specimen
surface. If a context-independent HEX cannot be truthful, show the authored formula and its
named backing role rather than fabricating a value.

### Reveal behavior

- Desktop: use existing Hito tooltip/focus primitives for expanded provenance on hover and keyboard
  focus; the concise role and code remain visible without hover.
- Narrow/touch: show the same concise provenance inline inside each specimen. An existing accessible
  disclosure may be used only if the inline form cannot remain readable at `375px`; no custom
  hover-only information architecture or new tooltip framework.
- Copy keeps its current semantics. It copies the existing semantic/primitive token code, not a
  rendered HEX in place of the source API. A separate explicit existing-style copy affordance may
  copy the resolved HEX only if it does not duplicate or confuse the existing action.

### Context

Retain the existing Context tab and its real semantic roles, but turn it into a calm, spacious
composition specimen:

- **Layers:** canvas → surface → elevated/card → popover, each visibly named and mapped to its
  `var(--token)` plus provenance/revealed HEX.
- **Typography:** existing text hierarchy rendered on an actual relevant surface, with foreground
  and alpha facts visible.
- **Chrome, actions, intent:** existing Field/choice/button/status primitives on the appropriate
  semantic layers, with source roles accessible. Do not add a new component gallery.

The goal is visible contrast and compositing truth, not a new editor, color picker, interactive
theme matrix, or palette framework.

## Existing Seams

- `src/styles/foundations.css` — canonical primitive and semantic Dark/Light definitions.
- `scripts/generate-hito-ds-manifest.mjs` — existing machine-readable manifest generator.
- `src/generated/hito-ds-manifest.ts` and `.json` — generated output consumed by Foundations.
- `src/components/hito-ds/reference-foundations-page.tsx` — existing Semantic, Primitives, Context
  tabs; `SemanticColorCard`, `PrimitiveColorCard`, copy behavior, and Context composition.
- `src/components/ui/*` and canonical DS CSS — existing tooltip, button, focus, spacing, surface,
  typography, and disclosure contracts to reuse where applicable.
- `scripts/validate-hito-ds-component-contracts.ts` — existing reference/manifest contract proof.

## Reuse-First Change Budget

- Reuse the current manifest generator and its `primitiveColor` / `semanticColor` collections;
  extend their truthful metadata only when it can be derived from canonical CSS. Do not write a
  hand-maintained duplicate colour registry in the page.
- Reuse current Foundations tabs, cards, swatches, copy action, Hito tooltip/focus and responsive
  composition primitives.
- New production artifacts: none by default. One small pure provenance/resolution seam is allowed
  only if it is needed by both Semantic cards and Context and cannot live coherently in the existing
  generator or Foundations page.
- Remove the superseded information loss: card-local `name/value/pairing` reduction that discards
  manifest source/alpha data, and Context's unlabelled layer-only presentation.

## What Not To Touch

- Do not alter primitive values, semantic Dark/Light mappings, alpha ladder values, contrast
  decisions, Product CSS, components, routes, state, Figma, Backend, persistence, dependencies,
  or unrelated dirty work.
- Do not introduce a second palette, static Light palette, theme switch, editor, color picker,
  ad-hoc opacity value, raw consumer mapping, bespoke card family, or compatibility API.
- Do not convert all computed values to a falsely opaque `#RRGGBB`; preserve alpha and formula truth.
- Do not make Product components consume primitive colours directly.

## Definition Of Done

1. Every displayed Foundations semantic/primitive colour has source/alpha/active-theme HEX evidence
   that traces to canonical CSS through the existing manifest path.
2. Composite values stay explicitly composite; no fake one-primitive attribution or context-free
   HEX is shown.
3. Context visibly explains its layers, text, chrome, actions, and statuses with the same shared
   provenance presentation and reacts to the existing global theme control.
4. The desktop hover/focus and mobile inline/touch paths disclose equivalent truth accessibly.
5. No colour values, Product behavior, or new parallel color model is added.

## Validation Expectations

| Check                        | Scenario / environment                             | Required evidence                                                                                             |
| ---------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| CSS-to-manifest provenance   | Dark and Light aliases plus `color-mix()` examples | Direct aliases, alpha primitives, single-source mixes, and multi-source mixes map truthfully.                 |
| HEX resolution               | Existing rendered swatches/Context backing roles   | Active-theme HEX and alpha are captured without losing compositing context.                                   |
| Semantic and primitive cards | `/hitoDS/foundations`                              | Direct primitive, alpha primitive, and composite cards each reveal the right details and preserve token copy. |
| Context                      | Desktop and exact `375×812`, Dark and Light        | Layers are spacious/readable; source facts are visible/revealed; no overflow.                                 |
| Accessibility                | Keyboard and touch-equivalent behavior             | Focus reveals desktop details; narrow mode does not hide required information behind hover.                   |
| DS contract                  | Existing manifest/DS validators                    | Generator, generated output, source metadata, and reference stay in parity.                                   |
| Hygiene                      | Focused format, lint, diff                         | Task-owned source only.                                                                                       |
| Build                        | Fresh production build if uncontended              | Build result or factual contention boundary.                                                                  |

## Stage

Superseded on 2026-08-11 by the combined DESIGN SYSTEM execution item
[`Hito DS Foundations Color Truth, Context, And Reference Canvas`](/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-hito-ds-foundations-color-truth-context-and-reference-canvas.md).
Its provenance and Context requirements remain authoritative evidence for that item; do not execute
this item separately.

## Next Recommended Role

design_system

## Exact Design System Handoff

```text
ROLE: DESIGN SYSTEM

Mode: Tracked
Task: Expose canonical color provenance and active-theme HEX in the existing Foundations reference,
then recompose Context into a spacious, inspectable real-token specimen.

Execute exactly:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-hito-ds-foundations-color-provenance-and-context-readability.md`

Read before the first write:
- `AGENTS.md`
- `agents/design-system.agent.md`
- `skills/hito-frontend-design-system/SKILL.md`
- `skills/hito-qa-browser-regression/SKILL.md`
- the complete canonical item and its retained screenshots
- `src/styles/foundations.css`
- `scripts/generate-hito-ds-manifest.mjs`
- `src/generated/hito-ds-manifest.ts` and `.json`
- `src/components/hito-ds/reference-foundations-page.tsx`
- current tooltip/focus/disclosure owners and `scripts/validate-hito-ds-component-contracts.ts`.

Outcome:
Every Foundations semantic and primitive swatch tells the truth about its source: token, primitive
alias or full mix formula, alpha contribution, and active-theme resolved HEX. Never make a
multi-source mix look like one primitive. The existing Context tab becomes a spacious, inspectable
composition specimen for layers, type, chrome, actions, and intent, using only existing semantic
roles and the existing global theme control.

First use one bounded read-only Designer subagent to recommend only the existing-token composition
and responsive information hierarchy. Use one bounded read-only source/provenance subagent to map
canonical CSS expressions through the existing generator/manifest and identify any non-truthful HEX
case. Do not write before reconciling those findings with the item.

Extend the existing generator/manifest path only when a provenance field can be derived from
canonical CSS. Do not create a hard-coded page registry or a second color resolver. Reuse the
existing Foundations tabs/cards/swatches/copy behavior, Hito tooltip/focus primitives, and
responsive utilities. Prefer inline concise provenance at 375px; use an existing accessible
disclosure only when necessary. Preserve primitive and semantic values/mappings, alpha ladder,
global theme control, Product consumers, Figma, Backend, and unrelated dirty work.

After your own focused proof, use one independent read-only QA subagent. Validate aliases,
alpha primitives, single-source and multi-source mixes, HEX resolution context, token copy,
desktop hover/focus, 375px touch-equivalent information access, Context in Dark/Light, keyboard,
no overflow, and console health. Run manifest parity, DS validator, focused format/lint/diff, and
an uncontended production build. Restart the fixture QA server before the final receipt if proof
stopped it. Do not stage, commit, push, deploy, access hosted state, alter Figma, call providers,
or delete material data.

Use Russian for visible in-progress commentary. Record the final formal receipt in English in the
canonical item, including the exact provenance model, changed files, source-derived examples,
validation, and any truth boundary that remains.
```

# Foundations Workout Specimen Edge Clarity

## Work Item ID

2026-08-11-hito-ds-foundations-workout-specimen-edge-clarity

## Status

completed

## Type

design-system-reference

## Priority

high

## Owner

design_system

## Mode

Lite

## Scope

Remove decorative semantic-border chrome from the existing workout type/section role specimens on
`/hitoDS/foundations`. Preserve the visual evidence for the actual `border` and `ring` semantic
roles. This is reference presentation only: it does not change workout colour token values,
Light/Dark resolution, contrast thresholds, Product consumers, shared surface CSS, or generated
manifest data.

## Archive Intent

retain_in_place

## Task

Make the Foundations workout semantic-color specimen distinguish what it is demonstrating from
ordinary card chrome. A state cell may display its semantic fill/content value without being
surrounded by the unrelated semantic `border` value. The `border` specimen shows the border role;
the `ring` specimen shows the ring role. Nothing else gains a bright decorative outline.

## User Report

On `/hitoDS/foundations` in Dark at `1470×801`, Tempo and Intervals semantic-role cards show bright
orange/coral outlines around nearly every state cell. Ivan asked to retain an edge only where the
edge itself is the demonstrated colour, and remove it where it has no meaning.

Inspector item `11a8d2d1-f960-4c55-98a0-d8565ea8d523` targeted an outer
`article.hito-ds-token-specimen-surface`. Source inspection proves its outer surface is already
borderless; the visible noise comes from its nested state specimens.

## Demonstrated Cause

`src/components/hito-ds/reference-foundations-page.tsx:1371-1426`,
`semanticRoleSlotStyle`, assigns `borderColor: valueFor("border")` to every role slot: base,
foreground, content, muted, surface, hover, active, border, and ring. Since each state cell already
has the `border` utility, the actual semantic border colour becomes decorative chrome around values
that are not border demonstrations. The ring branch additionally combines that border with its
actual `boxShadow` ring, producing a double outline.

The first incorrect owner is this Foundations specimen-rendering helper, not
`.hito-ds-token-specimen-surface`, global `hito-surface-flat`, Product UI, or the workout token
contract.

## Required Behavior

1. `base`, `foreground`, `content`, `muted`, `surface`, `hover`, and `active` state specimens have
   no decorative border or border-colour outline.
2. The `border` state is the only state cell that visibly renders the semantic border edge.
3. The `ring` state renders the semantic ring only. It does not retain an additional nested
   semantic-border outline unless source evidence proves it is necessary to display the ring.
4. The header `Aa` solid base/foreground sample has no unrelated hairline/decorative edge. It may
   retain only the actual semantic ring if that is the value being demonstrated there.
5. Preserve every state fill, text/content colour, contrast measurement, `data-hito-workout-*`
   attribute, layout, order, label, and Active Theme behavior.
6. Do not remove the primitive swatch separator, actual Brand sample boundaries, Context layers,
   static outer reference-surface contract, or focus-visible indicators. Those have different
   demonstrative responsibilities.

## Existing Seams To Reuse

- `src/components/hito-ds/reference-foundations-page.tsx` — `SemanticRoleCard` and its local
  `semanticRoleSlotStyle` function are the only execution owner.
- `src/styles/reference-workbench.css` — inspect only to confirm that
  `.hito-ds-token-specimen-surface` stays the existing borderless outer card. Do not edit it.
- `scripts/validate-hito-ds-component-contracts.ts` — extend only if an existing focused
  Foundations contrast/specimen guard can prevent this exact decorative-border regression without
  creating a broad new validator.

## Reuse-First Change Budget

- New production runtime artifacts: **none**.
- Reuse the current semantic slots, local specimen helper, contrast replay, and outer reference
  surface. Remove the incorrect universal border application rather than adding an exception class,
  token, wrapper, or compatibility rule.

## What Not To Touch

- Workout semantic values, theme-specific resolutions, Product consumer migration, color manifest,
  global token CSS, `hito-surface-flat`, Primitive/Semantic Color cards, Figma, Backend,
  persistence, fixtures, hosted state, or unrelated dirty work.
- The completed Foundations outer-surface unification decision. This item affects only nested
  workout-role visual evidence.

## Definition Of Done

1. In Light and Dark, non-edge workout state specimens display their true fills/content without a
   bright decorative semantic border.
2. `border` and `ring` remain visibly and semantically demonstrable, without a duplicate ring-edge
   treatment.
3. Existing measured workout contrast is not weakened, and all original state/role evidence remains
   present.
4. The outer specimen card is still borderless, 16px, and unchanged.
5. No Product, shared-token, or color-contract source changes occur.

## Validation Expectations

| Check                | Scenario / environment                         | Required evidence                                                                                                                  |
| -------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Source discriminator | `SemanticRoleCard` and `semanticRoleSlotStyle` | Only actual border/ring specimens retain edge rendering; non-edge slots no longer inherit `border`.                                |
| Visual truth         | Tempo and Intervals plus one pale workout type | Dark/Light at desktop and `375×812`: fills/content remain readable; border/ring visibly distinct; no outer-card border regression. |
| Contrast             | Existing workout role replay                   | Existing pass thresholds and `data-hito-workout-*` measurements remain valid.                                                      |
| Static               | Task-owned source                              | Focused Prettier, ESLint, existing DS validator or narrow guard, and `git diff --check`.                                           |
| Fixture              | Local server lifecycle                         | If proof stops `qa_fixture`, restart it before the final receipt.                                                                  |

## Next Recommended Role

product

## Execution Preflight

- Outcome: nested workout role specimens show an edge only when the `border` or `ring` role is the
  demonstrated value.
- Source evidence and owner: `SemanticRoleCard` applies the `border` utility to every state cell,
  while `semanticRoleSlotStyle` supplies `valueFor("border")` to every slot and to the solid `Aa`
  sample. The existing local card/helper are the first incorrect owner.
- Reuse and removal: keep the existing state renderer, semantic values, contrast measurement, and
  borderless outer reference surface; remove the universal nested border responsibility instead of
  adding an exception path.
- New runtime artifacts: none.
- Focused proof: source discriminator, existing DS validator, targeted formatting/lint, desktop and
  exact `375x812` Light/Dark browser checks for Tempo, Intervals, and a pale role, plus managed
  `qa_fixture` health after proof.
- Promotion condition: any required shared CSS/token, Product, manifest, persistence, or second-owner
  change promotes this item to Tracked and stops the Lite implementation.

## Implementation Receipt

- Outcome: workout state specimens no longer inherit a decorative semantic border. The `border`
  slot alone uses the semantic border edge, and the `ring` slot uses only its semantic ring shadow.
- Source hierarchy: `SemanticRoleCard` and `semanticRoleSlotStyle` remain the only rendering owner;
  the existing borderless `hito-ds-token-specimen-surface` contract was reused unchanged.
- Removed drift: the solid `Aa` base/foreground sample lost its unrelated border/ring chrome,
  non-edge state cells lost the universal `border` utility, and non-edge helper branches no longer
  apply `valueFor("border")`.
- New runtime artifacts: none. No component, helper, class, token, wrapper, compatibility path, or
  validator was added.
- Files changed: `src/components/hito-ds/reference-foundations-page.tsx` and this canonical item.
- Preserved boundaries: token values and theme resolution, contrast measurement attributes, state
  labels/order, Product consumers, shared/global CSS, semantic and primitive colour cards, Figma,
  Backend, persistence, and unrelated dirty work.

| Check                     | Scenario / environment                       | Result | Evidence                                                                                                                                                                                     |
| ------------------------- | -------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source discriminator      | `SemanticRoleCard` / `semanticRoleSlotStyle` | Passed | The helper has one `borderColor: valueFor("border")` application, in the `border` branch; only the `border` slot receives the `border` utility; `ring` retains only its 2px semantic shadow. |
| Static                    | Task-owned source and item                   | Passed | Targeted Prettier, ESLint, `validate-hito-ds-components`, and `git diff --check`.                                                                                                            |
| Desktop visual truth      | `1470x801`, Light and Dark                   | Passed | Tempo, Intervals, and Rest non-edge cells and `Aa` measured `0px` edges; `border` measured `1px`; `ring` measured `0px` border plus a 2px shadow.                                            |
| Narrow visual truth       | Exact `375x812`, Light and Dark              | Passed | The same edge contract held with `scrollWidth === clientWidth === 375`; cards remained readable and contained.                                                                               |
| Contrast                  | Tempo, Intervals, and Rest in both themes    | Passed | Every rendered solid, content, state, border, and ring verdict remained `pass`; the lowest observed boundary result was Rest Light `3.19`.                                                   |
| Outer surface and console | Both viewports and themes                    | Passed | Outer cards remained borderless with 16px radius; browser error and warning logs were empty.                                                                                                 |

The final managed `qa_fixture` lifecycle check is run after this canonical receipt becomes immutable,
because repository backlog content participates in the private Admin build snapshot. Its result is
reported in the executor's final receipt; any failure reopens this item rather than being hidden.

## Exact Handoff Prompt

```text
ROLE: DESIGN SYSTEM

Mode: Lite

Execute the ready canonical item exactly as written:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-hito-ds-foundations-workout-specimen-edge-clarity.md`

Read `AGENTS.md`, `agents/design-system.agent.md`, and
`skills/hito-frontend-design-system/SKILL.md` before the first write. The source root cause is
already demonstrated: `semanticRoleSlotStyle` applies the semantic border colour to every nested
workout state specimen, while `border` and `ring` alone should demonstrate an edge. Reuse the
existing local `SemanticRoleCard`/helper and borderless outer reference surface. Remove the
universal decorative-border behavior; do not add an exception class, component, token, wrapper,
CSS recipe, compatibility path, or a new colour contract.

Preserve all token values, Light/Dark resolution, contrast measurement attributes, state labels and
order, Product consumers, global/shared CSS, semantic/primitive color cards, Figma, Backend, and
unrelated dirty work. Verify the exact source discriminator; Tempo, Intervals, and a pale role at
desktop and `375×812` in Light/Dark; border/ring truth; contrast; overflow/console; focused static
checks; and a running `qa_fixture` after proof. Do not stage, commit, push, deploy, access hosted
state, call providers, or mutate data. Final formal receipt must be English.
```

## Blockers

None.

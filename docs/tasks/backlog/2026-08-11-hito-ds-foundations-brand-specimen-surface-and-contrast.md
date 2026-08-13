# Foundations Brand Specimen Surface And Contrast

## Work Item ID

2026-08-11-hito-ds-foundations-brand-specimen-surface-and-contrast

## Status

closed

## Type

design-system-reference

## Priority

high

## Owner

design_system

## Mode

Lite

## Scope

Bring the eight existing `/hitoDS/foundations#brand` `LogoSpecimen` cards onto the already accepted
Foundations reference-surface contract where their background is merely chrome. Preserve the three
explicit visual samples (`Light background`, `Dark background`, `Favicon surface`) and make their
typography contrast intentional rather than dependent on the active global theme.

## Archive Intent

retain_in_place

## Task

Replace the Brand section's dependence on overloaded `hito-surface-flat` with the existing
borderless 16px Foundations reference-surface contract for neutral logo specimens. Do not create a
second brand-card recipe or alter the global surface class.

For specimens whose background is the actual demonstration, retain that intentional background and
render their labels/brand marks using the correct on-light or on-dark colour. In particular, the
light-background sample must remain legible while `/hitoDS` is globally in Dark mode.

## Supersession

Before implementation, Inspector batch `42c0e651-3d52-498a-b411-8e2481e69f6c` established that
the same defect extends beyond Brand into the named Work type and semantic-role reference cards.
This Brand-only task is therefore closed without implementation and superseded by
[Foundations Reference Specimen Surface Unification](./2026-08-11-hito-ds-foundations-reference-specimen-surface-unification.md).
The successor owns one card-family classification and one existing reference-surface contract;
do not implement this narrower item separately.

## User Report

Inspector batch `0bcb7480-92aa-4e50-b8ee-125b9e8e45cb` captured the first Brand specimen:

- route: `/hitoDS/foundations`, Dark, `1470×801`;
- target: `#brand > div:nth-of-type(2) > div:nth-of-type(1) > article:nth-of-type(1)`;
- current owner: `article.hito-surface-flat`, `346.66×144px`, padding/gap `20px`, radius `10px`,
  hairline border;
- request: use the same larger-radius, borderless, darker reference treatment adopted for colour
  specimens wherever the card background is not itself a visual demonstration; `Light background`
  must use inverse/on-light typography so its label is readable.

## Observed Behavior

- `LogoSpecimen` at `src/components/hito-ds/reference-foundations-page.tsx:867-888` renders all
  Brand cards with the overloaded global `hito-surface-flat` class.
- `hito-surface-flat` in `src/styles/reference-workbench.css:36-40` adds a hairline border,
  `--radius-xl`, and translucent background. It has Product/Auth/Admin consumers and cannot be
  changed globally for this reference-only request.
- The completed
  [Foundations Token Specimen Surface Contract](./2026-08-11-hito-ds-foundations-token-specimen-surface-contract.md)
  already created the scoped `hito-ds-token-specimen-surface`: no border, `--radius-3xl` (16px),
  and a semantic reference background.
- The `Light background` sample at lines 295-301 sets its logo parent to `--stone-950`, but its
  `hito-label` retains theme foreground. In global Dark mode that label is light on the deliberate
  light sample and is unreadable. `Dark background` already needs its corresponding on-dark label.
- The light/dark/favicon samples intentionally demonstrate their own backgrounds. They are not
  neutral chrome and must not be recoloured into the generic reference surface.

## Demonstrated Cause

The Brand reference retained the old generic container class after the colour token cards gained a
scoped reference-surface owner. The `hito-label` role also sets its own theme-driven foreground,
so the light sample's parent text class does not supply the required on-light label colour.

## Accepted Product Direction

1. **Neutral Brand specimens** (`Default`, `Compact`, `Hero`, `Short mark`, `Compact mark`) use
   the existing borderless `hito-ds-token-specimen-surface` contract: 16px radius, no perimeter
   border, and its existing semantic Dark/Light background behavior.
2. **Intentional background samples** retain their purpose:
   - `Light background`: actual light primitive background; label and mark use dark/on-light text.
   - `Dark background`: actual dark primitive background; label and mark use light/on-dark text.
   - `Favicon surface`: preserve its intentional favicon gradient/surface and on-dark text.
3. No literal colours, new token, new component, global class edit, or duplicated Brand CSS recipe.
   Reuse the existing primitive/semantic values already shown by the samples.
4. The entire Brand card collection remains one visual family: same 16px outer geometry and no
   non-semantic perimeter border. Intentional sample fills are the only difference.

## Existing Seams To Reuse

- `src/components/hito-ds/reference-foundations-page.tsx:276-323` — Brand collection and explicit
  sample backgrounds.
- `src/components/hito-ds/reference-foundations-page.tsx:867-888` — `LogoSpecimen` composition.
- `src/styles/reference-workbench.css:42-46` — completed `hito-ds-token-specimen-surface` contract.
- `src/styles/foundations.css` — existing primitive/semantic Dark/Light colour definitions.
- `scripts/validate-hito-ds-component-contracts.ts` — existing DS contract validation.

## Boundaries

- Do not edit global `hito-surface-flat`, Product/Auth/Admin consumers, colour values/mappings,
  typography roles, logo SVG internals, manifest generation, Figma, Backend, persistence, or
  unrelated dirty work.
- Do not alter actual light/dark/favicon sample backgrounds merely to make neutral cards match.
- Do not reopen the completed token-specimen task or add a second reference-surface selector.

## Definition Of Done

1. All eight Brand specimens are borderless and use 16px outer corners through existing DS source.
2. Neutral specimens reuse the existing Foundations reference-surface; intentional background
   samples keep their actual backgrounds.
3. All visible label and logo text is legible in global Dark and Light, including `Light background`
   under Dark and `Dark background` under Light.
4. Brand/card semantics, logo sizing, copy, DOM order, and responsive grid remain unchanged.

## Focused Proof

- Source consumer map proving `hito-surface-flat` is not edited.
- `/hitoDS/foundations#brand` at desktop and exact `375×812`, Dark and Light: all cards have no
  border, 16px geometry, readable labels/marks, and no page overflow.
- Existing logo sizing/semantic presentation, console health, focused DS validator, formatting,
  lint, and `git diff --check`.
- Restart the fixture QA server before the receipt if this Lite task stops it.

## Promotion Condition

Promote to Tracked only if source investigation proves a Product consumer must change, the existing
reference-surface cannot serve all neutral Brand specimens, or a primitive/token value must change.

## Stage

Ready for Design System.

## Next Recommended Role

design_system

## Exact Design System Handoff

```text
ROLE: DESIGN SYSTEM

Mode: Lite
Task: Make the existing Foundations Brand specimens use the already accepted borderless 16px
reference-surface where their background is neutral chrome, while retaining intentional light/dark/
favicon samples and making their text contrast explicit.

Execute exactly:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-hito-ds-foundations-brand-specimen-surface-and-contrast.md`

Read before the first write:
- `AGENTS.md`
- `agents/design-system.agent.md`
- `skills/hito-frontend-design-system/SKILL.md`
- the complete canonical item
- `src/components/hito-ds/reference-foundations-page.tsx`
- `src/styles/reference-workbench.css`
- `src/styles/foundations.css`
- `scripts/validate-hito-ds-component-contracts.ts`

Reuse `hito-ds-token-specimen-surface`; do not modify global `hito-surface-flat`. The neutral
Default/Compact/Hero/mark specimens must inherit the existing 16px borderless reference treatment.
The explicit Light background, Dark background, and Favicon samples must retain their actual
demonstration fills and use factual on-light/on-dark typography. No literal colour, new selector,
new component, token, manifest, Product/Auth/Admin, Figma, or Backend work is allowed.

Run the focused proof in the item. If the task stops fixture QA, restart it before the final
English Lite receipt. Do not stage, commit, push, deploy, access hosted state, call providers, or
delete material data.
```

## Blockers

None.

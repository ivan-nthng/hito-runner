# Hito DS Foundations Icons Usage Signal Cleanup

- **Work Item ID:** `2026-08-13-hito-ds-foundations-icons-usage-signal-cleanup`
- **Status:** `completed`
- **Type:** Tracked — promoted from Lite Design System Patch Pack after required validator/runtime proof failed
- **Priority:** P1
- **Owner:** DESIGN SYSTEM
- **Stage:** Completed — focused current browser replay and the terminal validator successor close the historical proof gaps.
- **Scope:** The Icons section of `reference-foundations-page.tsx` only.
- **Archive Intent:** Retain the final compact result and focused evidence.

## Accepted outcome

1. Remove only the redundant `Icon size` preview block (`data-hito-ds-icon-preview`), leaving the canonical size control and icon registry intact.
2. Give the local `Usage` group additional top separation using an existing spacing token and promote only its heading from `Label MD` to `UI Title SM`.
3. Change only the first Usage-card label, `Button`, from `Label MD` to `Label SM`. Do not change the other four Usage labels.

## Source facts and boundaries

- The preview block is local to `src/components/hito-ds/reference-foundations-page.tsx:821`.
- `Usage` is the local group at lines 849–887.
- All five cards currently reuse `IconUsageCard` at lines 2225–2231. The Button-only label change must preserve the other labels exactly.
- Do not change `hito-surface-flat`, `hito-ds-token-specimen-surface`, shared typography roles, generic card chrome, the icon registry, token values, CSS, other Foundations sections, Product UI, or active unrelated work.

## Focused proof

- Icons Foundations desktop and exact 375px: registry, size control, Usage cards, and following Playground remain readable and contained in Light/Dark.
- Copy/keyboard behavior of unchanged controls remains usable.
- Run focused formatting/lint, DS validator, and `git diff --check`; no build unless a task-owned change makes it necessary.

## Blocker And Product Return

The task-owned rendered source change is complete, but the required Design System validator now
truthfully counts four preserved flat-surface references after removal of the accepted redundant
Icon preview. Its current assertion expects five. This item authorizes changes only in
`reference-foundations-page.tsx`, so the validator must not be changed here and the deleted preview
must not be retained as dead source merely to satisfy a count.

A fresh managed browser artifact could not be admitted because the repository-wide private Admin
snapshot marker/generation/digest requirement is missing. Client, SSR, and Nitro compilation ran,
but the managed runtime remained stopped with `artifact_missing`; no alternate server or Admin
repair was attempted.

PRODUCT should authorize one narrow Design System validator-count reconciliation from `12 / 5` to
the demonstrated `12 / 4` structure, then route a focused browser replay after a healthy managed
artifact is available. No rendered-source correction or product workaround is indicated.

## Implementation Receipt — 2026-08-13

- **Task and mode:** Hito DS Foundations Icons Usage Signal Cleanup; promoted from Lite to Tracked
  because the mandatory validator and browser proof could not complete inside the authorized seam.
- **Outcome:** removed the sole `data-hito-ds-icon-preview` composition while retaining the existing
  four-size control and full Icon registry. The local Usage group now uses the existing `mt-5`
  spacing utility and `hito-ui-title-sm`. Only the Button card requests `hito-label-sm`; Input, Nav
  row, Menu row, and Status marker continue to use the existing `hito-label-md` default.
- **Files changed:** `src/components/hito-ds/reference-foundations-page.tsx` and this canonical item.
  No runtime artifact, helper, token, CSS recipe, shared component, registry, Product UI, or generic
  surface change was added.
- **Focused source proof:** the preview marker is absent; size controls, `HITO_ICON_META` registry,
  five Usage cards, and following Marks playground remain; exactly one Usage card requests the small
  label role. Focused Prettier, ESLint, and `git diff --check` passed.
- **Required proof not passing:** `npm run validate-hito-ds-components` fails only on the stale
  surface classification (`expected 12 / 5; found 12 / 4`). The Dark/Light desktop/exact-375px
  replay was not run because the managed QA runtime could not admit a fresh artifact through the
  unrelated private Admin snapshot integrity gate. This leaves current rendered containment,
  theme, interaction, and console evidence unclaimed.
- **Remaining boundary:** PRODUCT must authorize the narrow validator reconciliation and arrange the
  focused browser replay when an uncontended healthy managed runtime is available. This receipt
  does not claim Global QA, release readiness, deployment, or Figma proof.

## Exact handoff prompt

```text
ROLE: DESIGN SYSTEM

Task: Hito DS Foundations Icons Usage Signal Cleanup
Mode: Lite — Design System Patch Pack.

Read before the first write:
- AGENTS.md
- agents/design-system.agent.md
- skills/hito-frontend-design-system/SKILL.md
- docs/tasks/backlog/2026-08-13-hito-ds-foundations-icons-usage-signal-cleanup.md

Implement only in src/components/hito-ds/reference-foundations-page.tsx:
1. Remove the redundant data-hito-ds-icon-preview block, preserving the icon size control and registry.
2. Add extra top separation to the local Usage group through an existing spacing token; change only Usage from Label MD to UI Title SM.
3. Change only the first Usage card label, Button, to Label SM. Preserve Input, Nav row, Menu row, and Status marker labels.

Reuse existing section/card/typography contracts. No new runtime artifact, helper, token, CSS recipe, shared component change, registry change, or generic surface change. Do not touch other Foundations sections, Product UI, or unrelated dirty work.

Validate the Icons area at desktop and exact 375px in Light/Dark, focused formatting/lint, DS validator, and git diff --check. Build only if task-owned change requires it.

Final receipt (English): task/mode, files changed, focused proof, and remaining boundary. Do not claim Global QA, release, deployment, or Figma proof.
```

## Focused Browser Closure Receipt — 2026-08-14

- **Current owner and outcome:** DESIGN SYSTEM. The accepted source remains intact: zero `data-hito-ds-icon-preview` blocks, 62 canonical Icon specimens, one four-size control, five Usage cards, `hito-ui-title-sm` for Usage, and only Button on `hito-label-sm`.
- **Rendered matrix:** current `/hitoDS/foundations#icons` passed at 1470×801 and 375×812 in Dark and Light. The Icon registry, size control, Usage cards, following Marks playground, and 15-card gallery remained contained with `scrollWidth === clientWidth` and no console warnings/errors.
- **Interaction:** physical ArrowRight moved the selected Icon preview size from MD to LG, retained roving focus, and updated all 62 specimens. A native Mark provenance copy button produced the existing full-token live-region feedback.
- **Former blockers:** the terminal validator successor accepts current `12 / 4` source truth, and this run used a fresh managed `qa_fixture` artifact. No source or runtime artifact was added.
- **Lifecycle result:** `completed`. No Global QA, release, deployment, hosted, or Figma claim is made.

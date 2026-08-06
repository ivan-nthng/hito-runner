# Hito DS Code-To-Figma Foundation Cleanup

## Work Item ID

2026-08-04-hito-ds-code-to-figma-foundation-cleanup

## Status

backlog

## Type

plan

## Priority

high

## Owner

design_system

## Scope

design-system-and-figma-bridge

## Archive Intent

retain_in_place

## Task

Reduce demonstrated Hito design-system drift and establish one code-owned export manifest for a
downstream Figma Variables and Text Styles bridge. Runtime code remains the source of truth; Figma
must never become a second visual-system or product-runtime authority.

## Stage

First Design System slice completed in the current working tree: the code-owned manifest, proven
cleanup, token normalization, and Foundations/Figma capture-board parity are accepted at the owner
level. Product has selected a new standalone Figma file named `Hito Running Library` and a separate
`DESIGN SYSTEM INTEGRATION` execution boundary for downstream Figma work. This item remains
`backlog`: the new role contract exists, but its distinct operational owner value is not yet
supported by the repository/Admin work-item parser, and no Figma mutation has been dispatched.

## Root-Cause Evidence

- Semantic color definitions and the Figma capture board manually duplicate token matrices.
- Light semantic colors bypass a declared primitive palette while dark theme aliases primitives.
- Documented spacing primitives and the actual Tailwind spacing scale disagree.
- Global foundations include component-bound geometry that is not a reusable global token.
- Legacy workout aliases, unused CSS classes, and DS-only component sizes have consumer evidence
  requirements before removal.
- The existing Figma board is an html.to.design capture surface; Inspector metadata is a limited
  allowlist. Neither is a complete Figma Variables manifest.

## Required Outcomes

1. Keep the runtime color contract and central typography inventory as the sole canonical token and
   role sources.
2. Define an honest primitive/semantic color relationship for both themes, a primitive spacing scale,
   and component-local geometry ownership without adding a token for every local measurement.
3. Remove only consumer-proven legacy aliases, unused CSS selectors, and DS-only variants; retain
   any candidate whose product or reference consumer cannot be disproved.
4. Produce one generated, machine-readable code-to-Figma manifest covering validated primitive and
   semantic colors, spacing, radius, motion, and reusable text styles.
5. Make Foundations and the existing Figma capture board consume the same manifest wherever their
   duplicated token presentation is in scope.
6. Keep component-bound typography inside its component family rather than presenting it as a
   universal text style.
7. Leave a target-specific Figma importer as a separate follow-up gate, after manifest parity and a
   chosen Figma file are explicitly available.

## Preserved Boundaries

- Do not change runner product behavior, workout taxonomy colors, visualization geometry, body map,
  timeline, calendar-cell geometry, or manual-workout domain anatomy for this cleanup.
- Do not make Figma, html.to.design, Inspector metadata, screenshots, or a hand-authored artifact
  the runtime source of truth.
- Do not remove CSS, tokens, variants, dependencies, or compatibility APIs solely because they look
  old or reduce line count. Prove zero reachability before deletion.
- Calendar's internal CVA/shadcn button compatibility boundary remains a separately evidenced task.
- Do not create a bidirectional code/Figma sync, mutate a Figma file, or export component families
  until the manifest contract is accepted.

## Execution Sequence

| Gate                      | Outcome                                                                                                                                                                                                    | Required proof                                                                                       | Stop condition                                                                                            |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 1. Cleanup ledger         | **Completed:** classified token, selector, size, typography, and geometry candidates.                                                                                                                      | Static consumer graph, reference reachability, and recorded ownership.                               | A candidate has an unresolved product or DS consumer.                                                     |
| 2. Safe DS cleanup        | **Completed:** removed only proven legacy aliases and unused selectors.                                                                                                                                    | Before/after discriminator, focused DS/product browser proof, build, and independent QA.             | A deletion changes a live visual or compatibility contract.                                               |
| 3. Token normalization    | **Completed:** established light primitives, semantic aliases, spacing truth, and component geometry ownership.                                                                                            | Theme parity, token/readability checks, and no new global geometry export.                           | The work becomes a visual redesign or creates a parallel scale.                                           |
| 4. Manifest parity        | **Completed:** generated and adopted the one-way export manifest for approved collections and reusable text styles.                                                                                        | Manifest validation plus Foundations and Figma-board parity.                                         | Manifest is manually maintained or cannot express the code-owned contract.                                |
| 5. Figma bridge admission | **Product decision accepted:** new standalone target `Hito Running Library`; downstream execution belongs to `DESIGN SYSTEM INTEGRATION`. Operational role registration and exact dispatch remain pending. | Accepted manifest, target identity, role contract, operational owner support, and explicit dispatch. | A Figma mutation or component export is attempted before the integration role is truthfully dispatchable. |

## Figma Export Scope

The first eligible downstream collections are `Primitive / Color`, `Semantic / Color` with `Dark`
and `Light` modes, `Primitive / Spacing`, `Primitive / Radius`, `Primitive / Motion`, and reusable
Figma Text Styles. Component families are excluded until their real variants and dimensions have
passed cleanup and consumer proof.

The intended program outcome is a complete reusable mirror of admitted Hito DS variables,
typography, and component families in `Hito Running Library`. Execution remains incremental: each
foundation or component family must have current code ownership, mapping, and Figma-side validation
before the integration role expands the library.

## Accepted Integration Boundary

- `DESIGN SYSTEM INTEGRATION` owns mutation and validation inside the approved Figma target.
- Repository product and Design System source is read-only for that role, apart from the exact
  backlog lifecycle/receipt and compact task-owned mapping allowance.
- `DESIGN SYSTEM` remains the sole code implementation owner for shared primitives, canonical CSS,
  tokens, manifests, validators, and `/hitoDS`.
- A Design System subagent may provide bounded read-only contract review inside an integration task;
  it must not write code on behalf of the integration role.
- Confirmed code-side gaps return as one batched Product-routed Design System task rather than
  interrupting the engineer once per token or component.
- The role contract lives in
  [`agents/design-system-integration.agent.md`](../../../agents/design-system-integration.agent.md).

## First Slice Receipt

The manifest now carries approved color, spacing, radius, motion, and reusable typography data;
Foundations, Light Palette, and the capture board consume that shared contract. The completed slice
retired four legacy aliases and 17 unreachable selectors without changing product behavior. Figma
remains downstream: no file, library, plugin, or importer was created or mutated.

## Supporting Documents

- [Hito DS information architecture and specimen contract](../../plans/active/2026-06-15-hito-ds-information-architecture-and-specimen-contract.md)
- [Historical Figma export surface spec](../frontend-specs/2026-06-15-hito-ds-figma-export-surface-spec.md)
- [Typography provenance and Inspector contract](../frontend-specs/2026-07-23-hito-typography-provenance-and-inspector-preview-contract.md)
- [Stack complexity reduction program](2026-08-04-hito-stack-complexity-reduction-program.md)

## Acceptance

- One runtime-owned token and typography contract exists; Figma is strictly downstream.
- Every deletion has a consumer/reachability discriminator and risk-appropriate regression proof.
- The manifest is generated from canonical code truth and no longer duplicates a token matrix by hand.
- Light and dark semantic contracts remain visually and structurally coherent.
- No unrelated Product, Backend, fixture, authentication, or provider behavior changes.

## Queue Rule

This is a canonical queued task. Before changing it to `ready`, Product must verify that the Design
System role is idle and that the operational mirror can represent its target role truthfully. The
assigned owner completes its bounded implementation and independent QA loop before returning; do not
split ordinary cleanup and verification into user-relayed tasks.

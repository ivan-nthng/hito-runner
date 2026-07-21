# Hito DS Discoverability, Agent Contract, And Safe Reuse Plan

## Status

backlog

## Type

plan

## Priority

high

## Next Recommended Role

product

## Task

Select the next bounded Hito DS discoverability, agent-contract, or external-reuse gate after the
Local Inspector child task's accepted owner-level closeout.

## Stage

Inspector child closed / broader discoverability remains Product-selected backlog.

## Next Gate

No implementation handoff is active. Product must select a new bounded discoverability,
agent-guidance, or external-distribution gate before this broader backlog plan resumes.

## Owner

ARCHITECT / DESIGNER / FRONTEND

## Last Updated

2026-07-21

## Context

Hito already has the raw ingredients of a design system:

- shared theme and semantic variables in `src/styles/foundations.css`;
- focused React primitives in `src/components/ui/*`;
- established control, state-surface, dialog, menu, selection, typography, and calendar contracts;
- a live `/hitoDS` route with Foundations, Components, and Patterns pages; and
- a local Inspector that can already identify targets but cannot truthfully prove DS ownership or
  token provenance.

The problem is discoverability. A human or agent must currently infer which source owner is canonical
by searching CSS, components, reference specimens, and past documentation. That creates duplicate
UI recipes and unsafe guesses even when an appropriate Hito primitive already exists.

## Research Packet (2026-07-21)

This is the retained starting context for the next owner. It records a focused public review of
Astryx and an accompanying Hito source inventory; it is not a mandate to copy Astryx or adopt its
visual language.

### Astryx Sources Reviewed

- [Astryx overview](https://astryx.atmeta.com/): public positioning, library breadth, templates,
  themes, and React/StyleX direction.
- [Getting started](https://astryx.atmeta.com/docs/getting-started): package boundaries, theme
  variables, CSS cascade-layer guidance, and component import model.
- [All tokens](https://astryx.atmeta.com/docs/tokens): explicit semantic colors, spacing, size,
  border, radius, shadow, motion, and typography token families with light/dark values.
- [Component library](https://astryx.atmeta.com/components): searchable component catalogue with
  variants, states, and examples.
- [Themes](https://astryx.atmeta.com/themes): default theme plus theme-preview and playground model.
- [Working with AI](https://astryx.atmeta.com/docs/working-with-ai): generated agent context, compact
  CLI output, component/docs discovery, and MCP search/get concept.

### Findings To Preserve

1. Astryx is strongest as a developer and agent tooling system: discoverability, source-like token
   reference, component examples, theme previews, and compact context retrieval.
2. Hito is stronger as a product-owned system: it already carries runner-specific interaction,
   accessibility, review/confirm, and browser/persistence acceptance contracts that a generic
   library cannot supply.
3. The useful adaptation is operational, not visual: make existing Hito truth easier to find and
   verify. Do not import Astryx components, visual recipes, StyleX, or its many generic templates.
4. Hito needs semantic light/dark contract visibility, not a marketplace of alternate brands/themes.
5. Agent readiness must mean read-only, current, queryable guidance before UI work. It must not mean
   autonomous DS mutation or a second source of truth.

### Hito Evidence Reviewed

- [Hito foundations](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/styles/foundations.css): live semantic colors, radius, typography,
  elevation, spacing, and light/dark source owners.
- [Hito DS route model](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/hito-ds/reference-model.ts): live Foundations,
  Components, and Patterns information architecture.
- [Hito DS overview](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/hito-ds/reference-overview-page.tsx): current source
  hierarchy and reference-surface rules.
- [Hito UI primitives](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/ui/): existing focused React component owners.
- [Completed Hito DS IA and specimen contract](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-15-hito-ds-information-architecture-and-specimen-contract.md):
  accepted reference-truth and conformance boundary.
- [Local Inspector DS evidence task](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/backlog/2026-07-21-local-inspector-ds-evidence-and-batch-drafts.md):
  positive ownership/provenance consumer that must share the same metadata truth.
- [Current package manifest](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/package.json): repository distribution truth is private today;
  reusable primitives do not yet imply a published external package.

### Retained Product Conclusion

Build one small source-backed Hito DS knowledge layer before any package/distribution decision:

- explicit semantic token reference;
- maintained component/pattern metadata with positive confirmation only;
- `/hitoDS` as the live catalogue, not a static duplicate;
- compact local agent discovery derived from the same truth; and
- Inspector consumption of that truth without persistence or automatic DS mutation.

Do not resume the broader discoverability or distribution program merely because this plan is high
priority. First close the bounded Inspector child task; Product must separately select any later
knowledge-layer or external-reuse gate.

## 2026-07-21 Local Inspector Child Checkpoint

The first local consumer now uses a bounded eight-entry positive reference metadata seam and proves
that missing markers and computed token equality remain neutral. This does not complete the broader
knowledge-layer plan: `/hitoDS` and agent guidance do not yet consume this metadata contract.

The bounded Inspector child has completed its FRONTEND owner-level DoD. Its Component identity,
compact Actions menu, add-to-DS proposal, instance/similar object removal, confirmed-DS scope,
batch/text/focus behavior, and exact-375px body-only Sheet scrolling passed on a fresh production
build. Evidence lives in
`qa-artifacts/screenshots/2026-07-21/local-inspector-component-actions-closeout/`.

Future discoverability work must consume or replace the accepted metadata seam rather than add a
parallel registry. The local-only Inspector child needs no further release-wide QA after its bounded
browser acceptance; the broader discoverability/distribution program remains backlog until Product
selects a new gate.

## Product Decision

Adopt the useful operating ideas from mature external systems without copying their visual language
or building their scale:

1. **Explicit token contract:** document the live semantic token families, their source owners,
   light/dark behavior, and intentional domain-only exclusions.
2. **Component and pattern contract:** positively identify maintained Hito components and patterns
   with source/reference metadata. Missing evidence means `unconfirmed`, never `not in the DS`.
3. **Agent-readable discovery:** agents must be able to retrieve compact, current token/component/
   pattern guidance before creating or changing visible UI.
4. **Live catalog:** evolve the existing `/hitoDS` reference route so it demonstrates real owners,
   state coverage, source links, and usage boundaries instead of a parallel static catalogue.
5. **Safe reuse before distribution:** first make internal reuse reliable. External publishing,
   package extraction, additional themes, and remote MCP are separate decision gates after the
   contract proves small, stable, and useful.

The repository currently contains reusable React primitives but is not itself a published external
package. This plan must not claim otherwise.

## Canonical Truth Hierarchy

1. Live Hito runtime source owns implemented component behavior and token values.
2. One minimal source-backed DS metadata boundary describes maintained components and patterns.
3. `/hitoDS` renders that truth as live reference/specimen material.
4. Agent-facing discovery output is derived from the same source-backed truth.
5. The local Inspector consumes only positive metadata and explicit token provenance; it never
   writes to the DS or infers ownership from a class name or matching computed value.
6. Figma, generated examples, exported artifacts, and AI responses are downstream consumers, never
   runtime truth.

## Scope

### Included

- Source inventory and classification of Hito token families, primitives, patterns, domain-specific
  elements, and intentional local exceptions.
- A minimal metadata/manifest contract that removes duplicate lists between `/hitoDS`, Inspector,
  and agent guidance.
- An agent-readable, local and read-only discovery interface or generated context contract.
- `/hitoDS` information architecture and live-specimen improvements where required by the selected
  contract.
- Token documentation that distinguishes semantic foundations from workout, calendar, and other
  domain-specific color/geometry truth.
- A later, evidence-gated external reuse/distribution decision.

### Excluded

- Product UI redesign, Runner Core behavior, backend/persistence work, or plan/workout semantics.
- A generic component explosion, theme marketplace, package extraction, CSS-framework migration,
  remote service, or automatic AI code modification.
- Renaming every existing class/token before source proof shows it is necessary.
- Treating custom/local UI as a failure when it is an intentional domain geometry or route-owned
  composition.

## Workstream And Gates

### Gate 1: Source Classification And Contract Decision

Owner: ARCHITECT.

Produce an evidence-backed map of:

- semantic foundations and their actual source owners;
- maintained generic primitives;
- maintained Hito patterns;
- domain-specific or route-owned components that must not enter a generic core;
- internal/devtool-only elements;
- reference-only specimens and known gaps.

Decide the smallest metadata truth that can power the Inspector, `/hitoDS`, and agent discovery.
It must be maintained once, derived where possible, and small enough to audit.

### Gate 2: First Internal Discoverability Slice

Owner: selected by Gate 1, expected FRONTEND with DESIGNER/QA support.

Implement only the first bounded improvement that makes present-day Hito DS reuse safer. Candidate
outcomes include a live token/reference index, source-backed component metadata, or compact agent
context derived from live owners. The selected slice must delete or replace overlapping documentation
or lists rather than add a parallel catalog.

### Gate 3: Live Catalog And Agent Guidance

Owner: selected by Gate 1.

Make `/hitoDS` and agent guidance consume the same truth. Real components should be rendered when
their normal behavior is part of the contract; deliberately forced visual states may remain specimen
fixtures when labelled as such. Agent guidance must explain component/pattern ownership, allowed
states, token use, accessibility boundaries, and how to locate the owner without copying large docs
into every prompt.

### Gate 4: Safe Reuse Decision

Owner: ARCHITECT / PRODUCT.

Only after internal consumers prove the contract, decide whether Hito needs any distribution form:
documentation-only reuse, a copyable internal bundle, a package, or no extraction. This is a
business/API decision, not an automatic technical outcome.

## Quality And Validation Rules

- Documentation and metadata must describe current source, not aspirations.
- A token value match is not token provenance.
- A `hito-*` class is not proof of React component ownership.
- Every metadata entry must point to a live canonical source/reference owner.
- Unknown entries remain unconfirmed instead of acquiring false labels.
- Agent guidance must be concise and queryable; it must not require agents to ingest a large static
  manual before a small UI change.
- The first implementation batch must use normal Hito DS/browser validation for touched UI, exact
  375px proof where a visible surface changes, and the required test inventory/DoD policy.
- Documentation-only planning work requires only source/reference checks and `git diff --check`.

## Risks

- Accidentally making a second registry beside real runtime code.
- Promoting domain-specific workout/calendar semantics into a generic reusable library.
- Treating matching CSS values as authoritative token provenance.
- Building an external package before there is a stable public API or supported distribution policy.
- Expanding the catalog faster than its owners and examples can remain current.

## Exit Criteria

This plan is complete only when:

- one source-backed Hito DS knowledge contract is implemented and used by `/hitoDS`, agent guidance,
  and the Inspector where applicable;
- live token, component, and pattern discoverability no longer requires broad ad hoc repo searches;
- the first bounded implementation slice passes its complete owner-level DoD and required browser
  proof;
- duplicate reference lists or stale guidance are removed or explicitly retained with a source-backed
  reason; and
- Product makes an explicit evidence-based decision about external distribution rather than assuming
  a package exists.

## Suggested Next Step

Run the Exact Handoff Prompt with FRONTEND to close only the bounded Inspector child task. Do not
start product UI, agent-guidance, package, or distribution work from this fix-forward.

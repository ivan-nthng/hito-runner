# Hito DS Foundations Specimen Hierarchy And Rule Simplification

## Work Item ID

2026-08-11-hito-ds-foundations-specimen-hierarchy-and-rule-simplification

## Status

completed

## Type

design-system-reference

## Priority

high

## Owner

design_system

## Mode

Tracked

## Scope

Resolve the three retained Inspector observations on `/hitoDS/foundations` as one Foundations-only
hierarchy and clarity slice:

1. make the selected State-surface wash documentation specimen use the same existing reference-card
   shell as the other Foundations specimens without changing the shared state-surface primitive;
2. make the reusable workout semantic role cards lead with role/token and use their existing live
   contrast measurement in the enlarged color sample; and
3. replace the page-local grouped-row rules block with one concise, borderless Foundations reference
   note that preserves all three facts.

This is a reference-rendering task. It must use existing Hito primitives and composition utilities
only. **No stylesheet, CSS module, CSS selector, literal visual value, token, component family,
wrapper recipe, or global primitive contract may be created or edited.**

## Archive Intent

retain_in_place

## User Evidence

Inspector batch: `/hitoDS/foundations`, Dark, `1470×801`, created `2026-08-12T01:23:29.443Z`.

| Item                                   | Captured target                        | Scope                             | User outcome                                                                                                               |
| -------------------------------------- | -------------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `22f1d9f6-9f50-4eb9-b2ab-45d7c44587e7` | `article.hito-surface-wash`            | Only this specimen                | It should read as the same reference-card family as the surrounding Foundations cards.                                     |
| `59519f77-fdf2-49db-a437-a3f70ac49aa0` | `span.hito-label` text `semantic role` | Reused workout role-card renderer | Remove that redundant label; lead with name and token; enlarge the color square and turn it into useful contrast evidence. |
| `a4514d9c-d362-43a1-a7fc-9163112aba0c` | page-local `div.hito-row-group`        | Only this Foundations rules block | Replace the hard-to-scan bordered grouped rows with one title and concise description in the same calm card language.      |

The Inspector's `hito-surface-wash` edge (`#F4A14E2E`, 18% alpha) and `hito-row-group` hairline
are observed consequences, not authority to edit shared CSS. The selected use scopes are binding.

## Observed Behavior And Demonstrated Causes

### 1. State-surface wash reference specimen

- The only selected usage is at
  `src/components/hito-ds/reference-foundations-page.tsx:417-423`.
- It applies the live shared `hito-surface-wash` primitive directly as the documentation card.
- Its canonical shared contract is in `src/styles/overlays-feedback.css:199-252`: it deliberately
  uses a state border, gradient, padding and tone-specific treatment for actual operational state
  surfaces.
- The ordinary borderless Foundations specimen surface already exists at
  `src/styles/reference-workbench.css:42-46` as `hito-ds-token-specimen-surface` with the accepted
  16px radius and semantic background.

Root cause: a live state primitive is being used as the outer documentation-shell, so the
documentation card inherits visual state chrome intended for the primitive itself.

### 2. Workout semantic role cards

- The reusable `SemanticRoleCard` at
  `src/components/hito-ds/reference-foundations-page.tsx:1119-1221` renders every type/section
  role card.
- Its `semantic role` label at line 1162 duplicates information conveyed by the card context;
  title and token are visually pushed down by its retained margin.
- The `Aa` sample at lines 1166-1176 uses the real base/foreground colors but conveys no measured
  fact. The same card already measures its live solid contrast at lines 1133-1152 and renders the
  ratio in a detached `Solid base + foreground` line at lines 1178-1181.

Root cause: the renderer separates primary identity and its available contrast proof into redundant
and low-value visual fragments.

### 3. Page-local workout rules

- `src/components/hito-ds/reference-foundations-page.tsx:789-806` renders three static statements
  inside `hito-row-group` and `ReferenceListRow`.
- The shared `hito-row-group` at `src/styles/controls-lists.css:993-1001` correctly represents a
  grouped interactive/list structure: border, overflow clipping and row dividers.
- These three entries are neither interactive rows nor independently actionable records; they are
  one explanatory Foundations message.

Root cause: the page uses a shared list primitive for one static explanatory concept, producing
unnecessary border/divider/card chrome.

## Accepted Product Direction

### State-surface wash

- Do **not** change `hito-surface-wash`, `hito-state-surface`, `overlays-feedback.css`, or any
  Product consumer.
- Change only the selected Foundations usage so the outer documentation shell reuses the current
  `hito-ds-token-specimen-surface` family used by the surrounding Semantic/Primitive specimens.
- If the real wash needs to remain visible for accurate reference, demonstrate it inside that
  existing reference shell as the actual primitive—not as a new custom card, CSS recipe or changed
  shared primitive. Its state purpose must remain factual.

### Workout semantic role cards

- Delete only the redundant literal `semantic role`; do not retire `hito-label` or change shared
  typography.
- Promote the existing role title to the top of the text column, followed immediately by its
  canonical token code. Remove only the now-unneeded local gap created for the deleted label.
- Enlarge the existing top-right solid color sample using existing composition classes while
  preserving its position and the card's established outer padding.
- Reuse the existing `contrastRatios.solid` measurement and 4.5 threshold. Put the numeric ratio
  in the enlarged solid sample and a compact technical `Pass` or `Fail` beneath it.
- Remove the now-duplicated detached `Solid base + foreground` readback only when the ratio/status
  remains visible and accessible in the sample.
- Do not invent a new `1A`/`2A`/`3A`, dots-only, or independent contrast grading system. A future
  Product decision may add AA/AAA tiers only with explicit thresholds and accessibility copy; this
  task exposes the existing ratio and its existing pass/fail result.
- Keep all slot names, fills, text/content colors, `data-hito-workout-*` attributes, parent-surface
  samples, contrast math, semantic `border`/`ring` evidence, and token mappings intact.

### Workout color rules

- Replace only this page-local grouped list with one existing borderless reference specimen surface.
- It contains one direct title and one concise body that preserves all three existing facts:
  `signal` is the Hito accent rather than generic success; `warn`/`destructive` are bounded
  feedback; workout roles convey training identity rather than CTA hierarchy.
- No row group, list row, divider, duplicated labels, new taxonomy or lost semantic guidance.

## Existing Seams

- `src/components/hito-ds/reference-foundations-page.tsx` — the sole runtime owner for all three
  selected Foundations uses and the only permitted runtime source edit.
- `src/styles/reference-workbench.css` — **read-only** proof of the existing
  `hito-ds-token-specimen-surface` contract.
- `src/styles/overlays-feedback.css` — **read-only** proof that `hito-surface-wash` is shared.
- `src/styles/controls-lists.css` — **read-only** proof that `hito-row-group` is shared.
- `scripts/validate-hito-ds-component-contracts.ts` — run existing validation; edit only if a
  focused source-backed invariant cannot be covered by its present contract.

## Reuse-First Change Budget

- Reuse `hito-ds-token-specimen-surface`, `hito-ui-panel-title`, `hito-body-small`,
  `hito-technical-mono`, existing grid/flex/spacing utilities, current semantic role renderer and
  its existing contrast measurement.
- New runtime artifacts: none.
- New CSS/classes/tokens/literals: none.
- Remove the redundant label, the detached duplicate contrast line when replaced accessibly, and
  the page-local grouped-list responsibility. Do not leave a duplicate interpretation active.

## What Not To Touch

- No files in `src/styles/`, including shared DS CSS. Do not change `hito-surface-wash`,
  `hito-row-group`, `hito-surface-flat`, token definitions, opacity values, motion, manifest,
  generated source, component registry or Figma.
- No Product routes, components, persistence, Backend, provider/hosted state, dependencies, or
  unrelated dirty hunks.
- Do not edit the just-completed color-truth/Context/canvas work except where the current
  Foundations page itself already owns the explicitly selected components.

## Definition Of Done

1. The selected State-surface wash documentation specimen is visually in the existing borderless
   Foundations card family, while the shared state primitive and all non-Foundation consumers are
   byte-for-byte unchanged.
2. Workout role cards start with role/token, have an enlarged top-right ratio/status sample, and
   contain no redundant `semantic role` or detached duplicate solid-contrast sentence.
3. The local three-row rule group becomes one concise borderless Foundations reference note that
   retains all three rules.
4. No stylesheet or shared CSS selector changes are made; all visual changes come from existing
   primitives and composition utilities at the canonical Foundations page seam.
5. Both themes and narrow layout preserve contrast evidence, card padding, semantic border/ring
   specimens, tabs, copy behavior, keyboard focus, containment and console health.

## Validation Expectations

| Check                 | Scenario / environment                             | Required evidence                                                                                                                 |
| --------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Scope/reachability    | Shared CSS and Product consumers                   | `hito-surface-wash` and `hito-row-group` shared definitions/consumers unchanged; only Foundations page changes.                   |
| Card hierarchy        | Foundations Dark/Light, `1470×801` and `375×812`   | State-wash documentation shell matches reference specimens; card/rule layout has no unintended border/divider or overflow.        |
| Contrast presentation | Workout type cards, including Tempo/Intervals/Rest | Ratio/status equals existing measured solid result; title/token, state slots, border/ring and all contrast facts remain readable. |
| Accessibility         | Keyboard/focus and narrow mode                     | Existing tabs/copy/focus remain; no critical evidence is color-only or hidden by hover.                                           |
| Existing DS proof     | Current checkout                                   | DS validator, focused Prettier/ESLint and `git diff --check`.                                                                     |
| Build                 | Uncontended checkout                               | Production build or exact contention boundary.                                                                                    |

Global QA, release readiness, Figma parity and Product regression acceptance are out of scope.

## Stage

Design System implementation completed. Focused Implementation DoD and independent QA passed.

## Next Recommended Role

product

## Historical Design System Handoff

```text
ROLE: DESIGN SYSTEM

Mode: Tracked
Task: Execute the new Foundations-only hierarchy and rule simplification task exactly as written:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-hito-ds-foundations-specimen-hierarchy-and-rule-simplification.md`

Read before the first write:
- `AGENTS.md`
- `agents/design-system.agent.md`
- `skills/hito-frontend-design-system/SKILL.md`
- `skills/hito-qa-browser-regression/SKILL.md`
- the complete canonical item
- `src/components/hito-ds/reference-foundations-page.tsx`
- read-only shared owners: `src/styles/reference-workbench.css`,
  `src/styles/overlays-feedback.css`, and `src/styles/controls-lists.css`
- `scripts/validate-hito-ds-component-contracts.ts`.

Outcome:
Use only existing Hito primitives and composition utilities in the Foundations page to make the
selected state-wash documentation specimen match the reference-card family, make workout role
cards lead with role/token and expose their existing contrast result in the enlarged sample, and
replace the page-local three-row rule list with one concise borderless reference note.

Hard boundary:
Do not add or edit CSS, tokens, literal visual values, class definitions, component families,
registries, manifests, Product code, Backend, Figma, dependencies or shared primitive contracts.
`hito-surface-wash` and `hito-row-group` are shared primitives; change only their selected
Foundations usages. Reuse the existing `hito-ds-token-specimen-surface` and current Hito typography,
spacing and composition utilities. Do not invent an AA/AAA/dot contrast taxonomy: use the current
solid measurement and its established pass/fail threshold only.

Before editing, obtain one bounded read-only DESIGNER review from the existing DESIGNER role for
information hierarchy and small-screen legibility. After your focused proof, obtain one bounded
read-only QA review from the existing QA role. They do not implement. Do not create custom roles
or delegate runtime edits.

Validate the complete item in Foundations at 1470×801 and exact 375×812 in Dark/Light, preserving
semantic border/ring cards, copy/tabs/focus, overflow and console health. Run existing DS validator,
focused format/lint/diff and a production build or record exact contention. If you stop the fixture
QA server, restart it before the English final receipt. Do not stage, commit, push, deploy, mutate
hosted state or call providers.

Use Russian for visible in-progress commentary and return only with complete DoD or a factual stop
condition. Update this canonical item truthfully.
```

## Blockers

None.

## Tracked Implementation Receipt

### Preflight And Outcome

- Reused the existing Foundations page composition seam, `hito-ds-token-specimen-surface`, current
  Hito typography/spacing utilities, the existing workout contrast measurement, and the established
  `4.5` pass threshold. New runtime artifacts: none.
- The first incorrect owners were the three selected page-local compositions: a live state wash used
  as its own documentation shell, redundant workout-card identity/contrast fragments, and a static
  rules message expressed as a grouped row list.
- The selected state-wash documentation now uses the accepted borderless reference surface and
  nests the unchanged live wash as factual evidence. Workout cards lead with role/token and put the
  live ratio plus `Pass`/`Fail` in the enlarged solid sample. The three rule rows are one concise
  borderless reference note.

### Files Changed

- `src/components/hito-ds/reference-foundations-page.tsx` — changed only the three authorized
  Foundations compositions.
- `scripts/validate-hito-ds-component-contracts.ts` — updated the existing accepted Foundations
  token-specimen count from five to seven; the preserved distinct flat-surface count remains six.
- This canonical item — lifecycle and receipt only.

The checkout already contained large shared changes in the Foundations page and validator before
this task. They are not attributed to this implementation. The task-owned net source change is the
three compositions above plus the one existing validator expectation.

### Preserved Boundaries

- `src/styles/reference-workbench.css`, `src/styles/overlays-feedback.css`, and
  `src/styles/controls-lists.css` remained byte-for-byte unchanged from the task preflight hashes.
- The shared `hito-surface-wash`, `hito-row-group`, typography, tokens, generated manifests,
  Product/Backend source, dependencies, Figma, hosted state, and unrelated dirty work were not
  changed.
- The existing semantic border/ring renderer, parent-surface contrast measurement, section-role
  samples, tabs, copy action, and focus semantics were retained.

### Validation Inventory

| Check                      | Scenario / environment                                        | Result                    | Evidence                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------- | ------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| DESIGNER review            | Read-only hierarchy and 375px constraints                     | Passed                    | Approved the reference-shell/nested-wash hierarchy, role/token-first card, 80px accessible contrast sample, and the single three-fact note. No source edits.                                                                                                                                                                                                                                     |
| Shared-owner hygiene       | Three read-only CSS owners                                    | Passed                    | SHA-256 remained `f7ce57f...`, `be2da384...`, and `b10c13fb...` respectively.                                                                                                                                                                                                                                                                                                                    |
| DS validator               | `npm run validate-hito-ds-components`                         | Passed                    | 321 source files; 43 primitive colors, 41 semantic colors, 18 text styles, 12 workout bases; contract OK.                                                                                                                                                                                                                                                                                        |
| Focused formatting         | Prettier check on task source and validator                   | Passed                    | Both files conform.                                                                                                                                                                                                                                                                                                                                                                              |
| Focused lint               | ESLint on task source and validator                           | Passed                    | No errors.                                                                                                                                                                                                                                                                                                                                                                                       |
| Diff hygiene               | `git diff --check` on task paths                              | Passed                    | No whitespace errors.                                                                                                                                                                                                                                                                                                                                                                            |
| Production build/runtime   | Repository-owned `npm run qa:server:restart`                  | Passed for the task build | Fresh client, SSR, Nitro and post-build integrity completed; the managed loopback fixture runtime restarted healthy at `127.0.0.1:3000`. A later status check became stale only because the external private Admin snapshot marker changed or was missing; the server remained healthy. This prevents a final full-checkout integrity/release claim, not the completed task build/browser proof. |
| Primary browser matrix     | `/hitoDS/foundations`, 1470x801 and exact 375x812, Dark/Light | Passed                    | Outer state shell 0px border with unchanged nested 1px wash; one borderless rule note; 10/10 live solid ratios report `Pass`; 7 section samples remain plain `Aa`; no horizontal overflow or console errors.                                                                                                                                                                                     |
| Accessibility/interactions | Tabs, focus, semantic copy action                             | Passed                    | Arrow navigation moved the active color tab with visible focus; copy activation produced the success toast. Clipboard bytes were not independently readable through the browser instrumentation.                                                                                                                                                                                                 |
| Independent QA             | Same four-mode browser matrix                                 | Passed                    | Confirmed hierarchy, ratios including Rest `4.78:1`, Tempo `6.65:1`, and Intervals `6.43:1`, preserved 1px border versus 2px ring evidence, no overflow, and clean console.                                                                                                                                                                                                                      |

### Closure

Implementation DoD is complete. Global QA, release readiness, Figma parity, and Product regression
acceptance are not claimed. Next owner: PRODUCT for normal backlog routing; no implementation
blocker remains.

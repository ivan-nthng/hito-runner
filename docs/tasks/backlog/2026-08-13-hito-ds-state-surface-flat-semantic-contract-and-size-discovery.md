# Hito DS State Surface Flat Semantic Contract And Size Discovery

## Work Item ID

2026-08-13-hito-ds-state-surface-flat-semantic-contract-and-size-discovery

## Status

completed

## Type

Tracked — shared Design System contract and reference implementation

## Priority

high

## Owner

DESIGN SYSTEM

## Mode

Tracked

## Stage

Completed Design System specification, shared CSS implementation, and `/hitoDS` reference proof.

## Next Recommended Role

PRODUCT — route explicit Product/Admin size adoption only where a consumer needs it.

## Scope

Establish and implement the shared `hito-state-surface` visual and size contract at the canonical
CSS and `/hitoDS` reference seams. Product/Admin caller adoption remains owner-bounded and is not
part of this item.

## Archive Intent

retain_in_place

## Task

Replace the obsolete gradient direction with a flat semantic state-surface recommendation for
neutral, signal, success, warning, and destructive states. Define whether an edge remains and how
foreground, background, and accessibility semantics work without colour-only meaning. Specify a
three-tier size contract, including typography roles, token-based padding, radius, optional-action
anatomy, and mobile behavior. Rework the `/hitoDS/patterns` demo so tone, size, and
actions-present/absent are live through the existing right-side control convention.

## User Report

- Inspector item: `d83acbfb-b684-4b91-97a4-03a3bc20ab70`.
- Route: `/hitoDS/patterns`; selected `article.hito-state-surface[role=status]`.
- Ivan’s decision: gradients are no longer part of Hito. State surfaces should use semantic colour
  by tone, show optional actions, and have three size tiers affecting only typography, padding, and
  radius.
- The spoken labels conflict: three sizes were requested while `S`, `M`, `MD`, and `LG` were named.
  The discovery must present one precise three-tier recommendation rather than silently creating
  four tiers.

## Evidence And Source Investigation

`src/styles/overlays-feedback.css` is the shared owner: `.hito-state-surface` and each tone branch
currently use `linear-gradient(...)`. The class has source reachability in Product, Admin, DevTools,
and `/hitoDS`; therefore this is not a selected-demo-only CSS change. Existing callers also add
local `p-3`, `p-4`, `p-6`, and typography classes, so a later migration must be owner-bounded and
must not silently change Product layout.

## Required Discovery Deliverable

One English implementation specification in this canonical item containing:

1. a current consumer census grouped by canonical owner and exact source seam;
2. recommended flat semantic background/foreground/edge pair per tone, with contrast evidence;
3. one recommended three-size vocabulary and a token table for typography, padding, and radius;
4. optional-action layout/accessibility rules, including focus and action target requirements;
5. `/hitoDS` demo/control composition and sample content that explains the contract;
6. exact FRONTEND (ds) implementation slice, separate Product/Admin migration slices if required,
   deletion list, rollback, validation inventory, and stop conditions; and
7. current official guidance used for status/notice surfaces, contrast, and target size.

## Execution Preflight — 2026-08-13

- **Product decision:** Product superseded the discovery-only handoff and assigned the primary
  DESIGN SYSTEM engineer to establish the contract and implement the shared CSS plus `/hitoDS`
  reference slice. Explicit Product/Admin caller adoption remains outside this item.
- **Source census:** current direct reachability is 28 Product instances across 12 files, 7 Admin
  instances across 3 files, and 11 Design System instances across 4 files. No direct
  `src/components/devtools/**` consumer exists; `/admin/capture` is the local tooling-adjacent Admin
  consumer. Ten `hito-surface-wash` instances belong to onboarding plus Brand reference and are a
  separate contained-readback contract.
- **First incorrect owner:** `src/styles/overlays-feedback.css` couples the route-level
  `.hito-state-surface` to gradient backgrounds and to the semantically separate
  `.hito-surface-wash`. The Patterns reference exposes only one hard-coded tone and static ownership
  copy rather than the requested live tone/size/action contract.
- **Existing seams:** reuse `.hito-state-surface`, its tone attributes, the existing
  `.hito-state-actions`, `HitoDsPlayground`, `ChoiceSelector`, Hito typography roles, Button, and
  semantic tokens. No component family, token, CSS file, manifest record, compatibility selector,
  or runtime artifact will be added.
- **Compatibility boundary:** omitted `data-size` preserves current padding/radius, and no Product
  or Admin caller or local padding utility is migrated. Explicit `sm | md | lg` affects only adopted
  surfaces; documented typography is composed in the DS specimen rather than forced onto arbitrary
  descendants.
- **Obsolete responsibility removed:** State Surface gradients and the static one-tone property
  handoff. The existing wash gradient stays byte-for-byte because its onboarding owner is not this
  route-level notice contract.
- **Proof inventory:** source/deletion census; semantic contrast calculation plus rendered
  Light/Dark review; tone, size, and actions-present/absent controls; 375px containment; focus and
  semantic-role checks; DS validator, formatting, lint, diff hygiene, build, and fresh browser
  matrix when runtime admission is available.

## Browser Path Preflight — 2026-08-13

- **Validation layer:** focused Design System Implementation DoD, not Global QA or release.
- **Artifact rule:** build and admit one fresh managed `qa_fixture` artifact after static checks;
  never reuse the preceding QA batch as proof.
- **Browser target:** `/hitoDS/patterns#notice-surface` at 1470×801 and 375×812 in Dark and Light;
  verify all tone/size/action controls, action focus and live feedback, flat computed backgrounds,
  exact size padding/radius, containment, and console health. Check one retained
  `hito-surface-wash` reference to distinguish it from the repaired contract.
- **Failure rule:** abandon any permission-prompting path and use another supported local browser.
  If no fresh managed artifact is admitted, report the exact visual/interaction coverage gap.

## What Not To Touch

- Product/Admin/DevTools callers, generated manifests, validators, fixtures, Figma, hosted state,
  or Git lifecycle.
- Status pills, metadata tags, cards, toasts, or generic surfaces unless source evidence proves a
  direct state-surface dependency.
- A new component family or colour/token scale merely to document this recommendation.

## Historical Design Review Prompt

```text
ROLE: DESIGNER

Task: Hito DS State Surface Flat Semantic Contract And Size Discovery
Mode: Tracked, read-only discovery
Canonical item: docs/tasks/backlog/2026-08-13-hito-ds-state-surface-flat-semantic-contract-and-size-discovery.md

Read AGENTS.md, agents/designer.agent.md, and skills/hito-frontend-design-system/SKILL.md before acting.

Produce an implementation-ready contract for the shared hito-state-surface. The demonstrated
canonical CSS currently uses gradients; Ivan has decided to replace them with flat semantic tone
treatments and add a three-size contract with optional actions. Do not implement source changes.

Establish actual shared ownership and consumer census first. Research relevant official design and
accessibility guidance. Recommend exact semantic foreground/background/edge mappings, a three-tier
size vocabulary with existing token mappings, actions-present/absent anatomy, mobile behavior, and
the right-side `/hitoDS` control composition. Do not silently turn the inconsistent spoken labels
into four sizes: make one explicit recommendation. Separate later FRONTEND (ds) implementation from
any Product/Admin migration, with deletions, proof, rollback, and stop conditions. Preserve all
dirty work and do not mutate runtime, Figma, hosted, or Git state.

Return the complete English discovery receipt in the canonical item. Do not dispatch implementation.
```

## Accepted Shared Contract

### Consumer and ownership boundary

- `.hito-state-surface` has 28 Product instances across 12 files, 7 Admin instances across 3
  files, and 11 Design System instances across 4 files. No direct DevTools component consumes it.
- `.hito-surface-wash` has separate onboarding and Brand-reference responsibility. It retains all
  five existing gradients and does not acquire State Surface size/action semantics.
- Omitted `data-size` remains the compatibility default. Existing Product/Admin padding and
  typography composition is not silently migrated.

### Flat semantic tones

| Tone        | Flat background                              | Edge            | Semantic content |
| ----------- | -------------------------------------------- | --------------- | ---------------- |
| Neutral     | `surface-elevated` 56% with `background` 44% | `hairline`      | `text-secondary` |
| Signal      | `signal` 7% with `background`                | signal 18%      | `text-accent`    |
| Success     | `success` 8% with `background`               | success 22%     | `text-positive`  |
| Warning     | `warn` 9% with `background`                  | warn 24%        | `text-warning`   |
| Destructive | `destructive` 10% with `background`          | destructive 24% | `text-negative`  |

Heading and body meaning remains explicit in text. The quiet edge reinforces the container but is
not claimed as the sole state or interactive indicator. Focus stays with the real contained Hito
control and its existing ring contract.

### Three sizes

| Size                 | Padding            | Radius                | Kicker   | Title           | Body    |
| -------------------- | ------------------ | --------------------- | -------- | --------------- | ------- |
| SM                   | `--space-3` (12px) | `--radius-lg` (8px)   | Label SM | Body MD, medium | Body XS |
| MD                   | `--space-4` (16px) | `--radius-xl` (10px)  | Label MD | UI Title XS     | Body SM |
| LG / omitted default | `--space-6` (24px) | `--radius-2xl` (12px) | Label MD | UI Title SM     | Body MD |

CSS owns only padding and radius. The `/hitoDS` specimen composes documented typography rather
than applying broad descendant selectors to heterogeneous production content.

### Actions and semantics

- Actions are optional sibling anatomy after content. Absent means no wrapper and no reserved gap.
- Present actions retain native HitoButton size, focus, keyboard, and accessible-name behavior; the
  surface size never shrinks the control target.
- Actions wrap using the existing `.hito-state-actions` contract and remain contained at 375px.
- Static route content has no unconditional live-region role. Only newly announced non-critical
  feedback uses `role="status"`; existing urgent caller-owned errors may continue to use alert
  semantics.
- The right property panel contains exactly Tone, Size, and Actions. No copy, role, colour, or theme
  editor was added.

Official accessibility discriminators used: enabled normal text remains subject to WCAG's
[minimum contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html),
meaningful focus/control indicators remain separate under
[Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast), and alert roles
follow the [WAI-ARIA Alert Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/alert/) rather than
being assigned to every persistent surface.

## Tracked Implementation Receipt — 2026-08-13

- **Stage:** shared contract, canonical CSS implementation, and `/hitoDS` reference proof.
- **Product outcome:** route notices are flat, semantically named, size-aware, optionally
  actionable, and demonstrable through one real playground without redesigning existing callers.
- **Root cause repaired:** State Surface gradients were coupled to the separate Wash primitive and
  the Patterns reference exposed one hard-coded tone with non-interactive ownership prose.
- **Files changed:** `src/styles/overlays-feedback.css`,
  `src/components/hito-ds/reference-patterns-page.tsx`, and this item.
- **Deleted/simplified:** State Surface gradient recipes and the static one-tone control handoff.
  Wash gradients, Product/Admin callers, existing action CSS, tokens, manifests, and all unrelated
  dirty hunks remain intact.
- **New runtime artifacts:** none.
- **Source-growth explanation:** the Patterns file gains only local typed tone/size metadata and
  controlled specimen state for one live Demo and a mapped Variants matrix. It adds no component
  family, registry, or second presentation owner.

| Check                         | Scenario / environment                                              | Result              | Evidence                                                                                                                                    |
| ----------------------------- | ------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Source/deletion discriminator | State versus Wash CSS                                               | Passed              | State block contains zero gradients; the isolated Wash block retains five. Explicit sizes are only SM/MD/LG.                                |
| Full DS contract              | `npm run validate-hito-ds-components`                               | Passed              | Contract completed across 327 scanned files.                                                                                                |
| Manifest parity               | Generator check mode                                                | Passed              | Generated TypeScript/JSON inputs remained unchanged and in parity.                                                                          |
| Focused static proof          | Prettier, ESLint, `git diff --check`                                | Passed              | No focused formatting, lint, or diff-hygiene failure.                                                                                       |
| Production build              | Managed build/postbuild integrity                                   | Passed              | Fresh artifact admitted with `receipt_matches`; no build error.                                                                             |
| Primary browser matrix        | `/hitoDS/patterns#notice-surface`, 1470×801 and 375×812, Light/Dark | Passed              | Five tones computed `background-image:none`; SM/MD/LG computed 12/8, 16/10, 24/12 padding/radius; zero page overflow or console warn/error. |
| Interaction proof             | Tone/Size/Actions, keyboard and focus                               | Passed              | Three controls only; absent wrapper removed; present native action retained focus and live feedback.                                        |
| Wash preservation             | `/hitoDS/brand`                                                     | Passed              | `hito-surface-wash` retained its semantic linear gradient.                                                                                  |
| Independent QA                | Fresh managed `qa_fixture`, exact matrix                            | Passed              | QA independently repeated tone, geometry, control, action, focus, containment, console, and Wash checks.                                    |
| Post-review runtime           | Managed fixture after QA                                            | External contention | A later private Admin digest change marked the still-healthy artifact stale/broken; no State Surface source moved.                          |

Remaining boundary: Product/Admin consumers retain omitted-size compatibility and local composition.
Explicit adoption is separate owner work only when required. No Global QA, release, hosted,
deployment, or Figma claim is made.

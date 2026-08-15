# Hub Mark Adoption And Access Label Hierarchy

- **Work Item ID:** `2026-08-13-hub-mark-adoption-and-access-label-hierarchy`
- **Status:** `completed`
- **Type:** Tracked — promoted from Lite after required validator/browser proof could not pass
- **Priority:** P1
- **Owner:** DESIGN SYSTEM
- **Stage:** Completed — current Hub source and focused four-cell browser proof close the historical validator/runtime gaps.
- **Scope:** `/hub` destination launcher markup in `src/routes/hub.tsx` only, using existing
  Hito Mark and typography/color contracts.
- **Archive Intent:** Retain the user-visible result and focused proof.

## Task

Bring all four Hub destination cards onto the canonical Hito Mark treatment, remove the redundant
header eyebrow, and make each access label a borderless technical label above its destination title.
The cards must retain their access tone, destination, copy, and existing interactions.

## User report and captured evidence

Local Inspector batch, `/hub`, Dark, 1470×801, created 2026-08-13:

1. `63a4724f-7480-4491-8e9b-6b6b639b22ff` — fourth `a.hito-launch-surface`, scope **all similar**:
   replace the current generic icons with the newly added canonical Mark for each destination.
2. `6b6f32ba-640d-46a4-8d82-a838e611ad70` — `p.hito-label-md.mt-8.text-muted-foreground`, text
   `Destination launcher`, scope **only here**: remove it.
3. `56e9b7fd-70bd-4b67-aeab-7f49e6843c3d` — third `a.hito-launch-surface`, scope **all similar**:
   put `User login required`, `Admin login required`, or `Public` above the title; remove the badge
   border; present it as a technical label while retaining its semantic color.

The Inspector reported a 16px radius preference on the cards, but the written user request does not
ask to change generic Hub-card radius, border, fill, padding, or hover chrome. Those are explicitly
out of scope for this patch.

## Source investigation

- `src/routes/hub.tsx` is the sole rendered owner: `HUB_DESTINATIONS` maps all four cards through
  `HubDestinationCard`.
- It currently uses generic `Icon` names (`workout`, `shield-alert`, `cog`, `file-text`) in the
  local `hito-launcher-card-icon` wrapper; that is the demonstrated source of the first symptom.
- Canonical `HitoMark` already owns the four matching identities in
  `src/components/ui/hito-mark.tsx`: `hito-running`, `admin`, `design-system`, and `changelog`.
  Their theme-aware frame, foreground, optical fit, shape, and sizing are already defined there.
- The header eyebrow occurs exactly once in `HubPage`.
- `hito-status-pill` is a shared bordered status component used across Product, Admin, DS, and
  integrations. It is not an eligible owner for a Hub-only technical-label composition.

## Accepted decision and reuse boundary

- Reuse `HitoMark`; do not add an icon, SVG, Mark definition, asset, registry entry, or manual color
  mapping. The implementation selects the matching existing Mark in Hub data and lets the component
  resolve its active-theme pair.
- Reuse an existing borderless label/technical typography and semantic-color contract for the access
  text. Do not alter `hito-status-pill`, `hito-launch-surface`, `foundations.css`, token values, or
  shared CSS.
- If source inspection cannot prove an existing canonical borderless label treatment for every
  required `signal`, `warning`, and `success` access tone, stop before adding a route-local color or
  CSS recipe and return this exact Design System contract gap to PRODUCT.

## What not to touch

- Other Hub wording, destinations, `to` values, access rules, CTA semantics, Link behavior, or
  keyboard/focus behavior.
- Shared Mark source, mark backgrounds, tokens, shared status pills, launcher surface CSS, generic
  card chrome, Product routes, generated manifests, validators, Figma, providers, and unrelated
  dirty work.
- Do not implement the Inspector's unrequested 16px radius/chrome evidence as a side effect.

## Focused acceptance

- All four cards render their matching existing Mark with the current theme-aware Mark contract in
  Dark and Light.
- The `Destination launcher` eyebrow is absent, without changing the identity title or supporting
  copy.
- Every access label appears above its title, has no pill perimeter/background, retains the correct
  semantic tone, and remains readable in both themes.
- Destination navigation and keyboard focus still work; no overflow or browser console errors at
  desktop and exact 375×812.
- Run focused formatting/lint and `git diff --check`. Run the smallest relevant DS validation; do
  not repair unrelated validator or runtime freshness gates in this Lite patch.

## Blocker And Product Return

The Hub-only source implementation is complete. Required closure proof is blocked by two external
gates that this item forbids changing:

- the Design System validator remains red on the already demonstrated Foundations flat-surface
  count (`expected 12 / 5; found 12 / 4`), unrelated to `hub.tsx`; and
- the managed loopback process is healthy but serves a stale artifact because the private Admin
  snapshot marker/generation/digest is missing. A live DOM discriminator confirmed the stale Hub:
  it still renders `Destination launcher`, contains no current Mark identities, and keeps the old
  title-before-access-label order.

Do not change Hub source, restore generic icons, or modify shared UI to satisfy either gate. PRODUCT
must route the existing Foundations validator-count reconciliation and arrange a focused Hub replay
after a fresh managed artifact can be admitted.

## Implementation Receipt — 2026-08-13

- **Task and mode:** Hub Mark Adoption And Access Label Hierarchy; promoted from Lite to Tracked
  because the required DS/browser proof could not pass within the authorized Hub seam.
- **Source cause and outcome:** `HubDestinationCard` owned all four generic icon and bordered badge
  instances. It now renders the existing `hito-running`, `admin`, `design-system`, and `changelog`
  `HitoMark` identities using the existing compact-navigation `sm` tile contract. The sole
  `Destination launcher` eyebrow is removed. Each access label now precedes its title and composes
  the existing borderless `hito-technical-sm` role with the canonical theme-aware semantic text
  token for signal/accent, warning, or success/positive. The bordered `hito-status-pill` is no
  longer used on this route.
- **Files changed:** `src/routes/hub.tsx` and this canonical item. No Mark/icon/asset/registry,
  token, helper, CSS recipe, shared component/card chrome, behavior, destination, validator, or
  Figma source was added or changed.
- **Focused source/static proof:** all four Mark mappings, one shared Mark renderer, absent generic
  card-icon wrapper, absent eyebrow, access-label-before-title order, three semantic text tokens,
  unchanged four destinations, and retained CTA arrow were asserted. Focused Prettier, ESLint, and
  `git diff --check` passed.
- **Required proof not passing:** the smallest DS validator failed only on the pre-existing
  Foundations `12 / 5` versus `12 / 4` count. Desktop/exact-375px Dark/Light rendering,
  focus/navigation, overflow, and console health remain unverified because the live managed runtime
  was source-proven stale and a fresh artifact is blocked by the unrelated Admin integrity gate.
- **Remaining boundary:** PRODUCT must route those two existing validation/runtime owners and then
  replay this focused Hub matrix. This receipt does not claim Global QA, release readiness,
  deployment, hosted parity, or Figma proof.

## Exact handoff prompt

```text
ROLE: DESIGN SYSTEM

Task: Hub Mark Adoption And Access Label Hierarchy
Mode: Lite — one-route Design System Patch Pack.

Read before the first write:
- AGENTS.md
- agents/design-system.agent.md
- skills/hito-frontend-design-system/SKILL.md
- docs/tasks/backlog/2026-08-13-hub-mark-adoption-and-access-label-hierarchy.md
- src/routes/hub.tsx
- src/components/ui/hito-mark.tsx

Implement the accepted Hub-only presentation change in `src/routes/hub.tsx`:
1. Replace the generic icon on each of the four `hito-launch-surface` destination cards with its
   matching existing `HitoMark`: `hito-running`, `admin`, `design-system`, or `changelog`. Reuse the
   Mark's existing theme-aware foreground/frame, optical fitting, and a fitting existing size/shape.
2. Remove only the header eyebrow text `Destination launcher`.
3. For every destination card, move its access label above the title. Render it as an existing
   borderless technical-label treatment while preserving its existing `signal`, `warning`, or
   `success` semantic color in Dark and Light.

Root cause/source evidence:
- `HubDestinationCard` is the one shared card renderer for all four cards.
- `HitoMark` already owns all four requested identities.
- `hito-status-pill` is a shared bordered component; do not modify or reuse it for this Hub-only
  borderless label.

Reuse only existing contracts. No new Mark/icon/asset/registry/token/helper/CSS recipe. Do not edit
`hito-status-pill`, `hito-launch-surface`, `foundations.css`, shared card chrome, access behavior,
other routes, validators, or Figma. The Inspector radius and generic-card chrome evidence is not an
approved change in this task.

Stop and return to PRODUCT if the repository lacks an existing canonical borderless technical label
with all three required semantic tones; do not make a Hub-specific substitute.

Validate the Hub at desktop and exact 375×812 in Dark/Light, including destination focus/navigation,
no horizontal overflow, and console health. Run focused Prettier/ESLint, the smallest relevant DS
check, and `git diff --check`. Use a named existing Hito-role reviewer only if independent evidence
is necessary; do not delegate any Design System implementation slice.

Final receipt (English): task/mode, source cause, files changed, focused evidence, omissions, and
remaining boundary. Do not claim Global QA, release, deployment, hosted, or Figma proof.
```

## Focused Browser Closure Receipt — 2026-08-14

- **Current owner and outcome:** DESIGN SYSTEM. Current `HubDestinationCard` source renders exactly four existing `HitoMark` identities (`hito-running`, `admin`, `design-system`, `changelog`), contains no `Destination launcher` eyebrow, and places every borderless `hito-technical-sm` access label before its title with the existing accent, warning, or positive text token.
- **Rendered matrix:** `/hub` passed at 1470×801 and 375×812 in Dark and Light. All four cards retained their destinations and copy, used the existing `sm` tile Mark contract, and produced no page overflow or console warnings/errors.
- **Interaction:** physical Tab produced a visible focus ring on a destination link; the public Design System destination performed a real local navigation to `/hitoDS`.
- **Former blockers:** the terminal Foundations validator successor is green, and this proof used a fresh managed `qa_fixture` artifact. No Hub or shared source was changed in this closure pass.
- **Lifecycle result:** `completed`. This is focused route evidence only, not Global QA, release, deployment, hosted, or Figma acceptance.

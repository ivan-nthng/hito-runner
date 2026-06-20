# Bug: Shell Label Hierarchy Drift In Preview And Saved Sidebar Surfaces

## Status

backlog

## Type

bug

## Priority

high

## Next Recommended Role

frontend

## Task

Audit and normalize shell labels so preview and saved sidebar/profile surfaces use the Hito design
system hierarchy instead of duplicate identity and overly loud uppercase labels.

## Stage

FRONTEND implementation / shell label hierarchy and DS alignment cleanup.

## Exact Handoff Prompt

```text
ROLE: FRONTEND

Task:
Audit and normalize shell labels across preview and saved sidebar/profile surfaces so the shell uses
one calm Hito hierarchy instead of duplicate identity and overly loud uppercase labels.

Stage:
FRONTEND implementation / shell label hierarchy and DS alignment cleanup.

Context:
The earlier `Home unavailable` repro was an environment/internet false alarm and is not the live
bug. The real issue left on the current server is shell label drift:
- duplicate identity/name surfaces
- preview/saved mode tags that feel detached from the Hito DS
- overly loud all-caps labels
- utility/meta labels that read more like internal placeholders than product hierarchy

This is not a broad redesign. It is a focused shell-hierarchy cleanup in the canonical shell owner.
```

## Severity

high

## Owner

FRONTEND

## Reported

2026-06-15

## User Report

On the current server, the real remaining issue is shell labels:

- duplicate preview identity/name
- too many uppercase labels and technical-looking chips
- labels that feel disconnected from the design system

The earlier `Home unavailable` state was caused by internet issues and is no longer part of this
bug.

## Evidence

- Screenshot:
  [preview-home-shell-confusion.png](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/backlog/assets/2026-06-15-preview-home-shell-regression/preview-home-shell-confusion.png)

## Observed Behavior

- The shell repeats identity or mode markers in a noisy way:
  - `Preview mode`
  - `PREVIEW RUNNER`
  - `Preview runner`
- Saved-mode shell labels can also feel detached from the DS, for example:
  - `ADMIN`
  - `MANUAL USER-BUILT PL...`
  - `SAVED`
  - `Connections status`
  - `Utility`
- This reads like multiple naming systems and label tones colliding inside the same shell.

## Expected Behavior

- Preview/saved shell identity should be stated once, calmly, without duplicate same-name surfaces competing.
- Uppercase labels should be used sparingly and intentionally, not as the dominant hierarchy.
- Shell labels should look like part of the Hito DS, not leftover internal chips or utility placeholders.

## Source Investigation

- Preview/shell naming and duplicate identity surfaces are primarily owned by
  [AppShell.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/AppShell.tsx).
- Supporting naming state comes from
  [training-api.ts](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/training-api.ts)
  and shell snapshot shaping in the training view model.
- DS typography roles relevant here already exist in:
  [styles.css](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/styles.css)
  and `/hitoDS` shell/dropdown specimens.
- Current source suggests the main problem is not missing copy strings, but that route-local shell
  labels and meta labels are not consistently mapped onto the intended DS hierarchy.

## Likely Root Cause

This is a frontend shell hierarchy / rendering-view-model drift: identity, mode, and utility/meta
labels are being emitted from the shell owner, but they are not consistently expressed through one
calm DS hierarchy.

## Recommended Fix Direction

- Audit the canonical shell owner first, not random route-local labels.
- Simplify identity hierarchy:
  - one clear preview marker
  - one runner/profile identity surface
  - quieter support labels
- Normalize utility/meta wording if it still reads like internal placeholder language.
- Reuse existing Hito shell typography and calm support-text patterns instead of inventing a new
  shell system or doing a broad redesign.

## What Not To Touch

- manual authoring move/copy/delete contracts
- admin capture surfaces
- backend plan lifecycle/data semantics
- DS specimen-only docs unless they are directly needed to reuse an existing shell pattern

## Validation Expectations

- duplicate `Preview runner` style identity is reduced to one intentional surface
- uppercase/noisy labels are reduced to calmer, clearer hierarchy
- preview and saved shell labels feel DS-consistent rather than route-local or internal
- no regression to authenticated saved-mode shell behavior

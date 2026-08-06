# Canonical Loopback Local Inspector Availability

## Work Item ID

2026-08-04-canonical-loopback-local-inspector-availability

## Status

in_progress

## Type

bug

## Priority

medium

## Owner

frontend

## Scope

local-devtools-inspector

## Archive Intent

retain_in_place

## Frontend Lane

devtools

## Task

Make the local-only Inspector directly usable on the canonical managed QA origin
`http://127.0.0.1:3000` without weakening its loopback-only and non-persistent boundary.

## Stage

Frontend DevTools browser acceptance remains in progress. Source reachability does not replace the
required canonical-loopback and non-loopback browser discriminators.

## Next Recommended Role

frontend

## Exact Handoff Prompt

```text
ROLE: FRONTEND
Frontend lane: DevTools

Complete the existing Canonical Loopback Local Inspector Availability item by proving the Inspector
is intentionally reachable and usable on http://127.0.0.1:3000 while remaining absent on a
non-loopback origin. Preserve its lazy, local-only, non-persisting boundary and do not change Product,
Admin, auth, provider, fixture, persistence, or Backend behavior. Keep the item in progress until the
task-specific browser evidence and independent owner-level review pass; do not claim Global QA
Acceptance.
```

## Root Cause

The Inspector host gate already accepts `127.0.0.1`, but its enabled state is stored in
origin-scoped `localStorage`. A toggle previously enabled on `localhost` is therefore absent on
the canonical managed QA origin, leaving the Inspector unmounted there.

## Preserved Boundaries

- The Inspector remains loopback-only, local-only, lazy, and non-mutating.
- It must not load or appear on deployed, preview, or other non-loopback origins.
- No Product, Admin, auth, provider, fixture, persistence, or Backend behavior changes.
- Existing explicit Inspector exit and ordinary runner UI behavior remain intact.

## Acceptance

The Inspector can be intentionally reached and used on the canonical `127.0.0.1:3000` QA origin,
while a non-loopback discriminator remains unavailable. The correction has local browser proof and
does not create a second DevTools state path.

## Status

archived

## Type

plan

## Priority

low

## Next Recommended Role

architect

## Task

Preserve archived Full Baseline Import And Stabilization Plan as historical context.

## Stage

ARCHITECT archived-plan reference / compressed historical summary.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Preserve archived Full Baseline Import And Stabilization Plan as historical context.

Stage:
ARCHITECT archived-plan reference / compressed historical summary.

Context:
This artifact is archived history. Do not continue it by default. If baseline import or stabilization questions return, start from current docs/current-* truth and current runtime owners.
```

## Archive Note

Archived during the 2026-05-25 active-plan inventory cleanup. Compressed during D12 of the docs/artifact compression track.

Current truth now lives in:

- [Current product](../../current-product.md)
- [Current system](../../current-system.md)
- [Current state](../../current-state.md)
- [Product history digest](../../history/product-history-digest.md)

## Final Outcome

This plan governed the original import of the `adaptive-run-coach` TanStack Start baseline into Hito Running. It preserved the imported route/component/style baseline while correcting branding and fake capability promises, then established Supabase-backed saved mode, local development login, completion persistence, and backend-derived week status.

The archived plan is complete. The runtime is now owned by current source and current docs, not by this import checklist.

## Key Decisions Preserved

- Import the TanStack Start app at the repo root as the single runtime.
- Preserve the imported UI/UX baseline first; correct trust/branding claims without broad redesign.
- Keep one canonical data seam so signed-out preview and authenticated saved mode could share route structure.
- Supabase owns authenticated saved truth; imported mock data remains preview-only.
- OpenAI, weather, provider sync, OCR, readiness, fatigue, and adaptive engine claims were placeholder/future until real backend evidence existed.
- Magic-link auth was the intended long-term auth path; local credentials were a loopback-only unblock.
- Weather was deferred as optional enrichment and not coupled to core plan/log behavior.

## Implemented Phase Summary

- Phase 0: imported the baseline runtime with preserved `src/` structure, routes, shell, styles, and interactions.
- Phase 1: corrected Hito branding and neutralized fake AI/sync/OCR/weather/recovery/adaptation claims.
- Phase 2: added Supabase auth/env setup, `/login`, callback handling, and loopback local saved-mode unblock.
- Phase 3: replaced hardcoded mock plan source behind a canonical seam.
- Phase 4: persisted workout completion logs and derived week status from backend truth.
- Phase 5: polished login, onboarding, saved logging feedback, and route edge-state messaging.

## Boundary Notes

- The trusted output boundary begins at authenticated profile, persisted plan data, persisted workout logs, real week status, and real provider evidence.
- Placeholder surfaces may remain, but they must be honest and not imply live capability.
- Future enrichment must remain downstream of deterministic product truth.
- Runtime implementation, routes, auth, and data seams have moved far beyond this original import plan and must be checked in current docs/source before acting.

## Validation History

The original plan recorded successful install, lint, build, route generation, Supabase migration creation, saved-mode readback, `/progress` and `/workout/$date` rendering from Supabase-backed plan truth, and local current-plan import/readback evidence.

Detailed old phase handoff blocks were removed during compression because they are superseded by current docs and the product-history digest.

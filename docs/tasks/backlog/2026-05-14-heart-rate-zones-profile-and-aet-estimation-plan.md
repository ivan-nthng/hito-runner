# Heart Rate Zones Profile And AeT Estimation Plan

## Status

backlog

## Type

plan

## Priority

medium

## Next Recommended Role

ARCHITECT

## Task

Plan the next heart-rate zones profile and AeT estimation slice.

## Stage

ARCHITECT plan

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

TASK:
Plan the next heart-rate zones profile and AeT estimation slice.

STAGE:
ARCHITECT plan

CONTEXT:
- Source path: docs/tasks/backlog/2026-05-14-heart-rate-zones-profile-and-aet-estimation-plan.md
- Markdown metadata is canonical for this repo-derived admin Backlog item.
- Supabase mirrors this item for discovery and prompt copy only.

CONSTRAINTS:
- Edit this markdown file, not the admin Backlog mirror, when task truth changes.
- Preserve Hito canonical architecture and current role boundaries.
- Do not broaden scope beyond this work item.

OUTPUT:
Use the project role output format.
```

## Owner

Architect / Backend

## Last Updated

2026-06-22

## Compression Note

D24 compressed this paused future physiology plan. Current Hito still does not own personal
runner-level HR-zone truth. Age-estimated/default HR ranges remain advisory readback only, and
executable HR workout targets remain blocked until a real personal HR-zone seam exists.

## Durable Decision

Heart-rate zone truth must be runner-level backend truth before it can affect active or future
plans. The future capability should support:

- manual zone entry for runners who already know their zones
- one guided aerobic-test workflow for runners who do not
- deterministic FIT/evidence validation before AeT or zone estimation
- explicit runner confirmation before zones are saved or applied
- explicit review/confirm before any active-plan targets are changed

The product must never silently rewrite an active plan from new profile defaults.

## Recommended Future Sequence

1. Backend-owned runner-level zone storage and readback.
2. Manual entry and validation of zone ranges.
3. Guided aerobic-test prescription and evidence upload.
4. Deterministic evidence validity checks and AeT estimation.
5. Review/confirm to save zones.
6. Separate review/confirm to apply zones to an existing active plan.

## Plan-Application Boundary

Future zones may prefill future plan creation immediately after confirmation. Applying them to an
existing active plan is a separate risky mutation and must preserve logged history, past workout
truth, and user intent. The safest default is to rebuild or update only future planned workout
targets through a backend-owned reviewed seam, not route-local frontend patching.

## Out Of Scope Until Prioritized

- adaptive training
- automatic HR target rewriting
- provider-wide physiological modeling
- AI-owned zone estimation
- silent current-plan mutation
- using age-estimated HR as personal biometric truth

## Validation Boundary

The future slice needs backend validation for zone ordering, age/default distinction, evidence
provenance, FIT signal availability, deterministic estimation confidence, and reviewed application
to active-plan future workouts. Frontend must render backend-shaped review states rather than owning
estimation or mutation semantics.

## Links

- Current product truth: `docs/current-product.md`
- Current system truth: `docs/current-system.md`
- Related product brief: `docs/tasks/product-briefs/2026-05-14-heart-rate-zones-profile-and-plan-application-brief.md`
- Product history digest: `docs/history/product-history-digest.md`

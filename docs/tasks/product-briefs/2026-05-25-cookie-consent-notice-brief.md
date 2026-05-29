# Cookie Consent Notice Brief

## Status

backlog

## Type

product_brief

## Priority

low

## Next Recommended Role

ARCHITECT

## Task

Decide whether Hito needs a lightweight cookie consent notice before launch.

## Stage

ARCHITECT product decision

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

TASK:
Decide whether Hito needs a lightweight cookie consent notice before launch.

STAGE:
ARCHITECT product decision

CONTEXT:
- Source path: docs/tasks/product-briefs/2026-05-25-cookie-consent-notice-brief.md
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

PRODUCT

## Last Updated

2026-05-25

## Context

This is a future small compliance/product task.

Do not prioritize it ahead of active product, architecture, coaching, admin, or integration work unless cookie consent becomes a launch/compliance blocker.

The desired behavior is a short cookie/privacy information notice that appears briefly, offers a clear choice, and then gets out of the runner's way.

## Problem

Hito currently does not have a dedicated cookie or tracking consent notice.

Before broader production usage, the product should decide whether it needs a small consent/info banner for cookies, analytics, or similar browser storage/tracking behavior.

## Product Direction

Add one lightweight cookie notice if product/legal review confirms it is needed.

The notice should be:

- short
- plain-language
- low-chrome
- not scary
- not a full modal
- dismissible after choice
- consistent with Hito DS

## Minimal V1 Behavior

The notice appears near the bottom of the screen.

It should include:

- one short sentence explaining cookie/storage use
- `Accept`
- `Reject` or `Decline`
- optional link to privacy/cookie details if that page exists

After the runner chooses:

- save the choice locally
- hide the notice
- do not show it again unless policy/version changes

## Important Product Questions

Before implementation, decide:

- what cookies or browser storage Hito actually uses
- whether analytics/tracking exists
- whether consent is legally required for the current launch context
- whether reject disables any optional analytics
- whether required auth/session cookies need separate copy

## Scope

### In Scope

- short cookie/info banner
- accept/reject choice
- persisted local choice
- DS-aligned visual treatment
- mobile-safe layout
- optional privacy/cookie link

### Out Of Scope

- full legal policy writing
- preference center
- marketing tracking framework
- multi-region legal automation
- blocking the whole app behind consent
- dark-pattern consent UI

## Acceptance Criteria

1. Notice appears for users who have not made a choice.
2. Notice has clear `Accept` and `Reject` or `Decline` actions.
3. Choice is persisted locally.
4. Notice disappears after choice.
5. Notice does not reappear on normal reload.
6. Notice is mobile-safe.
7. Notice uses Hito DS primitives/classes.
8. Reject does not break required login/session behavior.

## Next Recommended Role

PRODUCT

## Suggested Next Step

When the current higher-priority backlog is clear, ask PRODUCT to confirm whether cookie consent is required and what exact browser storage or analytics behavior the notice should describe. Then hand to ARCHITECT for a tiny implementation plan.

---
name: ios-feature-implementation
description: Use for native iOS feature work that must follow backend/service truth, platform conventions, and the canonical architecture plan.
---

# iOS Feature Implementation

## Purpose

Implement native iOS slices without creating app-only product truth.

## Workflow

1. Read the canonical architecture plan and API/service contract.
2. Inspect existing iOS modules, navigation, networking, persistence, and design-system usage.
3. Keep domain models, networking, local persistence, and UI state separate.
4. Treat local storage as cache or draft unless the architecture plan says it is canonical.
5. Implement loading, empty, error, retry, and success states.
6. Respect confirmation boundaries for risky mutations.
7. Verify with simulator/device smoke tests and any available unit tests.

## Rules

- Do not duplicate backend validation as final authority.
- Do not invent iOS-only product states.
- Do not store secrets or long-lived sensitive tokens insecurely.
- Do not add a broad architecture framework for one feature.
- Make offline/sync behavior explicit if touched.

## Output

1. Task
2. Stage
3. Root cause
4. Files changed
5. What changed
6. Validation results
7. Blockers

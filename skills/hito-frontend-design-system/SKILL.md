---
name: hito-frontend-design-system
description: Use for Hito UI, layout, component, Design System, responsive, and Figma-bridge work.
---

# Hito Frontend And Design System

## Purpose

Build UI from backend-shaped truth and established Hito DS contracts rather than local recipes.

## Read

Read the named route/component, nearby consumer, src/styles.css, existing primitives, and /hitoDS
only when the task touches shared UI. Read the active spec/plan only for a Tracked task.

## Workflow

1. Classify Lite or Tracked under AGENTS.md.
2. Identify the first owner: backend-shaped data, route state, interaction, shared component, DS
   primitive, CSS/layout, or copy.
3. Inspect existing Hito DS primitives/classes, nearby routes, and /hitoDS before adding UI.
4. Reuse the existing button, field, menu, dialog, tabs, row, surface, status, typography, spacing,
   radius, icon, and token contract where it applies.
5. Route a shared primitive/token gap to DESIGN SYSTEM; do not create a route-local replacement.
6. Validate only the affected contract and viewport/state risk.

## Figma

Use Figma procedures only when Figma is actually in scope.

- Code and /hitoDS remain canonical for implemented Hito behavior.
- DESIGN SYSTEM INTEGRATION owns approved Figma target mutation and mapping.
- DESIGN SYSTEM owns code-side primitives, tokens, manifests, validators, and /hitoDS.
- Read official Figma documentation and load the exact Figma plugin skills before an API/mutation
  operation. Do not mutate unapproved files or publish without explicit approval.

## Rules

- Do not invent auth, persistence, entitlement, schedule, lifecycle, AI, or product truth in UI.
- Do not add a component family, token, wrapper, or custom control without a repeated real need and
  a replacement path.
- Keep visualization geometry separate from ordinary component chrome.
- A browser matrix is required only when a browser-visible contract or responsive risk is affected.

## Output

Name the owner, reused DS/product seam, files/surfaces changed, focused proof, and the escalation
boundary. Use the Tracked inventory only when the task is Tracked.

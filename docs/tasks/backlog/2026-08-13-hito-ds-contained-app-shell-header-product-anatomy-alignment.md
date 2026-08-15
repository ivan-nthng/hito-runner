# Hito DS Contained App Shell Header Product Anatomy Alignment

## Work Item ID

2026-08-13-hito-ds-contained-app-shell-header-product-anatomy-alignment

## Status

closed

## Type

design-system contained reference correction

## Priority

high

## Owner

DESIGN SYSTEM

## Mode

Lite

## Stage

Closed — superseded and fully adopted by the completed consolidated Design System batch.

## Next Recommended Role

PRODUCT for any later Product AppShell adoption decision.

## Scope

Only the desktop contained App Shell Demo on `/hitoDS/patterns`. Replace its bespoke header content
with a truthful static representation of the existing Product AppShell header anatomy.

## Archive Intent

retain_in_place

## Task

Remove the contained Demo’s `Training` eyebrow, `Training week` title, and Language menu. Reuse the
existing Product header’s reading hierarchy in a static reference form: Today/date at the start and
week status at the end. Retain the canonical blurred `hito-workbench-topbar` material, contained
sidebar, cards, and narrow/mobile specimen unchanged.

## User Report

- Inspector item: `f4b4fb2d-fa47-4a8b-a1cd-a4d12c6609b0`.
- Route: `/hitoDS/patterns`; Dark; 1470×801.
- Target: contained `header.hito-workbench-topbar`.
- Request: use the real header; the `Training` content must not appear there.

## Source Investigation

`src/components/hito-ds/reference-components-structure.tsx` owns the selected contained Demo and
hard-codes `Training`, `Training week`, and `HitoLanguageMenu`. `src/components/AppShell.tsx` owns
the existing Product header anatomy: Today/date on the left and a Week status on the right. The
shared topbar CSS already owns the semantic background, blur, and edge; it is not the incorrect
owner.

## What Not To Touch

- `src/components/AppShell.tsx`, Product routes, or current header material CSS.
- Shared language-menu behavior, header search, tokens, sidebar, mobile/narrow specimen, or Figma.
- Any unrelated dirty source or task artifact.

## Focused Proof

Prettier, focused ESLint, and `git diff --check`; then `/hitoDS/patterns` Dark/Light desktop plus
375×812 verification of hierarchy, containment, and console/overflow health. No Global QA or
release claim.

## Handoff Prompt

```text
ROLE: FRONTEND

Specialization: DS

Task: Hito DS Contained App Shell Header Product Anatomy Alignment
Mode: Lite
Canonical item: docs/tasks/backlog/2026-08-13-hito-ds-contained-app-shell-header-product-anatomy-alignment.md

Read AGENTS.md, agents/frontend.agent.md, and skills/hito-frontend-design-system/SKILL.md.

In the desktop contained App Shell Demo only, replace the bespoke Training / Training week /
Language-menu header content with a truthful static representation of the existing Product AppShell
header anatomy: Today/date on the left and Week status on the right. Reuse the existing
hito-workbench-topbar material. Do not change AppShell.tsx, shared header CSS, Product routes,
language-menu behavior, sidebar, or mobile/narrow specimen. Add no runtime artifact.

You own this FRONTEND (ds) implementation. Do not delegate another FRONTEND implementation slice.
Prove the focused source and /hitoDS/patterns Dark/Light desktop and 375×812 result. Preserve all
unrelated dirty work. Return a Lite receipt; stop if Product source or a shared-header refactor is
actually required.
```

## Supersession Closure Receipt — 2026-08-14

- **Current ownership:** PRODUCT explicitly reconciled current `/hitoDS` ownership to DESIGN SYSTEM; the historical `frontend (ds)` handoff above is preserved as execution history.
- **Adoption proof:** the completed [Hito DS Reference Contract And Table Density Batch](./2026-08-13-hito-ds-reference-contract-and-table-density-batch.md) adopted this exact contained App Shell responsibility. Current source renders Today/date at the start and On track week status at the end while the fictional Training, Training week, and language-menu content are absent.
- **Independent evidence:** the completed [Reference Contract And Table Density Independent QA](./2026-08-13-hito-ds-reference-contract-and-table-density-independent-qa.md) passed the contained App Shell in the fresh Dark/Light desktop and 375×812 matrix with clean containment, focus, overflow, and console evidence.
- **Lifecycle result:** `closed` as superseded. No runtime source was changed here, and no Product AppShell, Global QA, release, deployment, hosted, or Figma claim is made.

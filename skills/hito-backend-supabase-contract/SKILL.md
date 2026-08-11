---
name: hito-backend-supabase-contract
description: Use for Hito backend, Supabase, auth, persistence, integration, import/export, and server-contract work.
---

# Hito Backend And Supabase Contract

## Purpose

Change one canonical backend truth path safely.

## Read

Read the assigned task, nearby server/action/validator/persistence owners, and schema/types only
when relevant. Read current-system for a Tracked contract change.

## Workflow

1. Classify the task under AGENTS.md.
2. Locate the first incorrect boundary: parsing, validation, normalization, persistence, auth,
   entitlement, provider ingest, import/export, AI context, lifecycle, or response shaping.
3. Reuse the current server action, validator, canonical entity, and persistence seam before adding
   a module, script, migration, table, or dependency.
4. Preserve raw provenance before normalized truth when auditability requires it.
5. Keep deterministic product facts separate from AI interpretation.
6. Validate the changed contract proportionately; use the existing validator/fixture seam for a
   deterministic recurrence.

## Boundaries

- Supabase-backed persisted truth is canonical. Never add a local fallback truth path.
- Secrets and privileged keys stay server-only.
- Frontend routes, styles, DS primitives, and copy are read-only context. Route consumer changes to
  FRONTEND rather than editing them.
- A migration, RLS/auth, hosted database, paid provider, destructive operation, or cross-owner
  contract is Tracked.
- Do not keep obsolete compatibility code once replacement proof makes deletion safe.

## Output

For Lite, state seam, change, focused proof, and boundary. For Tracked, provide root-cause evidence,
reused/replaced path, full validation inventory, and omitted-proof consequence.

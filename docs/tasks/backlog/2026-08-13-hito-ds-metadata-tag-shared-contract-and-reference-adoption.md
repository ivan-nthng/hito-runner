# Hito DS Metadata Tag Shared Contract And Reference Adoption

- **Status:** `completed`
- **Owner:** FRONTEND (ds)
- **Epic:** platform-and-operations
- **Depends On:** [Hito DS Metadata Tag Light And Accent Contract Discovery](2026-08-13-hito-ds-metadata-tag-light-and-accent-contract-discovery.md)
- **Outcome:** Implemented the discriminated Light/Accent `HitoMetadataTag` contract and Design System/reference consumers, removing arbitrary tone and perimeter recipes while leaving Product/Admin and DevTools migrations to their canonical owners.
- **Sources:** [playground.tsx](../../../src/components/hito-ds/playground.tsx); [figma-export-board.tsx](../../../src/components/hito-ds/figma-export-board.tsx); [reference-overview-page.tsx](../../../src/components/hito-ds/reference-overview-page.tsx)
- **Validation:** Independent Global QA verdict: Passed for the recorded inventory; no broader acceptance is inferred.
- **Residual boundary:** No Product/Admin/DevTools implementation, migration, public type change, or behaviour change. No Figma document mutation, library publication, generated manifest change unless an existing generator is proven to own…

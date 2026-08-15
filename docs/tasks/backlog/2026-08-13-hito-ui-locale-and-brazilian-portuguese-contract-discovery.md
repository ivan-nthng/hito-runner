# Hito UI Locale And Brazilian Portuguese Contract Discovery

- **Status:** `completed`
- **Owner:** ARCHITECT
- **Outcome:** Established the canonical `en`/`pt-BR` contract: Portuguese system locales resolve to `pt-BR`, others to `en` unless profile preference overrides; SSR/hydration share one resolution, UI chrome localizes, and authored/persisted content is never retrotranslated.
- **Sources:** [training.ts](../../../src/lib/training.ts); [runner-calendar-timezone.ts](../../../src/lib/runner-calendar-timezone.ts)
- **Validation:** Source/evidence review completed for the recorded scope; no runtime, browser, release, or Global QA claim is inferred.
- **Residual boundary:** Discovery changed no runtime or hosted state. Profile/resolver and shared catalog successors own only their slices; Product hydration/formatters, AI authoring locale, and independent Global QA remain separately routed.

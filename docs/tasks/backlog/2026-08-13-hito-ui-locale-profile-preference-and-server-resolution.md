# Hito UI Locale Profile Preference And Server Resolution

- **Status:** `completed`
- **Owner:** BACKEND
- **Evidence From:** [UI Locale And Brazilian Portuguese Contract Discovery](./2026-08-13-hito-ui-locale-and-brazilian-portuguese-contract-discovery.md)
- **Outcome:** Implemented constrained `runner_profiles.ui_locale_preference` persistence and one deterministic server resolver for `en`/`pt-BR`, including weighted request-language precedence, safe invalid-value handling, RLS, and cleanup proof.
- **Sources:** [validate-backend.mjs](../../../scripts/validate-backend.mjs); [validate-ui-locale-profile.ts](../../../scripts/validate-ui-locale-profile.ts); [database.ts](../../../src/lib/supabase/database.ts)
- **Validation:** Generated contract, Auth/RLS and cleanup, Static/schema hygiene passed as recorded in the terminal receipt; omitted layers remain outside this closeout.
- **Residual boundary:** This Backend slice added no client locale state, SSR root hydration, catalog/menu, formatter migration, AI/provider behavior, or hosted mutation; those consumers and Global QA remain separate.

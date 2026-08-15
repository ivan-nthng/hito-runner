# Hito UI Locale Profile Preference And Server Resolution

- **Work Item ID:** `2026-08-13-hito-ui-locale-profile-preference-and-server-resolution`
- **Status:** `completed`
- **Type:** `backend persistence and server-contract implementation`
- **Priority:** `high`
- **Owner:** `backend`
- **Mode:** `Tracked`
- **Evidence From:** [UI Locale And Brazilian Portuguese Contract Discovery](./2026-08-13-hito-ui-locale-and-brazilian-portuguese-contract-discovery.md)
- **Archive Intent:** `retain_in_place`

## Task And Outcome

Implement only Backend locale Slice 1: synchronized profile preference plus one deterministic
server resolver for `en` and `pt-BR`. The completed slice added no client locale state, browser
bootstrap, catalog, Header, formatter migration, AI behavior, generic preference store, provider
path, compatibility layer, or hosted mutation.

`runner_profiles.ui_locale_preference` is `text not null default 'system'` with a check constraint
allowing only `system`, `en`, and `pt-BR`. Existing settings read/write now round-trip it without
changing unrelated settings or baseline revision.

The server contract is:

```ts
{
  preference: "system" | "en" | "pt-BR" | null;
  resolvedLocale: "en" | "pt-BR";
  preferenceContractViolation: "invalid_stored_ui_locale_preference" | null;
}
```

Explicit locale wins. `system`/missing values use the highest-quality request language range, with
header order breaking equal-quality ties; only winning primary `pt` resolves to `pt-BR`. Unsupported,
missing, malformed, zero-quality, or wildcard-winning input resolves to `en`. Detection never
persists an explicit preference. Invalid stored values return `preference: null`, expose the stable
violation code, and resolve safely through system behavior.

## Canonical Sources

- `supabase/migrations/20260813124903_runner_ui_locale_preference.sql`
- `src/lib/ui-locale.ts`
- `src/lib/user-settings-actions.ts`
- `src/lib/supabase/database.ts`
- `scripts/validate-ui-locale-profile.ts`
- `scripts/validate-backend.mjs`

The local migration was applied once through `supabase migration up --local`. No reset, hosted
access, raw SQL, retained profile mutation, or shared web-runtime restart occurred. Disposable Auth
users/profiles were deleted through the existing lifecycle and cleanup convergence was asserted.

## Validation Evidence

| Check                          | Result retained                                                                                                                                                                     |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source/migration discriminator | No prior locale column, generated field, settings member, or resolver existed; closed training preferences and theme remain locale-free.                                            |
| Resolver and precedence matrix | Passed Portuguese variants/case, weighted and equal-quality ordering, explicit values, unsupported/missing/malformed/zero-quality/wildcard cases.                                   |
| Migration/default/check        | Local migration history passed; omitted values read as `system`; invalid `pt` write failed with PostgreSQL `23514` and preserved the accepted value.                                |
| Generated contract             | Exact `runner_profiles` Row/Insert/Update parity passed for `ui_locale_preference`.                                                                                                 |
| Settings/system behavior       | `system -> pt-BR -> en` round-tripped; timezone, training preferences, baseline fields/revision remained unchanged; Portuguese system resolution did not rewrite stored `system`.   |
| Auth/RLS and cleanup           | Owner read passed; cross-user read/update returned no rows and did not mutate the owner; disposable users/profile rows were removed.                                                |
| Static/schema hygiene          | Focused validator, Prettier, ESLint, task-path TypeScript filter, schema lint, and diff hygiene passed. Schema lint retained only unrelated pre-existing unused-parameter warnings. |

## Coverage And Consumer Boundary

Repository-wide TypeScript remained red on pre-existing/concurrent Product, Design System,
manual-workout, router, server-typing, and tooling errors; no task-owned error appeared. Whole-file
generated output was not replaced because the CLI emitted broad unrelated drift. Full Backend
suites were not run during shared-checkout ownership, though the focused validator was registered
in both suites.

Production build/runtime, browser, SSR/hydration, multi-device UI, catalog/formatters, AI/provider,
hosted Supabase, deployment, release, and Global QA were not run or claimed. A later server root
loader must obtain authenticated user plus `Accept-Language`, call
`getUiLocaleResolutionForUserId`, serialize the exact contract, and hydrate from it rather than
`navigator.language`. Consumers use narrowed `UiLocalePreference` / `UiLocaleResolution`; they do
not cast arbitrary database strings.

Implementation DoD passed only for this Backend slice. Global QA Acceptance remains Pending.

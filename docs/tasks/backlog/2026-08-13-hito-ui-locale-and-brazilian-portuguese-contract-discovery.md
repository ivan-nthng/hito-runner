# Hito UI Locale And Brazilian Portuguese Contract Discovery

- **Work Item ID:** `2026-08-13-hito-ui-locale-and-brazilian-portuguese-contract-discovery`
- **Status:** `completed`
- **Type:** `cross-owner architecture and rollout discovery`
- **Priority:** `high`
- **Owner:** `architect`
- **Mode:** `Tracked`
- **Archive Intent:** `retain_in_place`

## Task And Outcome

Define the smallest end-to-end locale contract for English (`en`) and Brazilian Portuguese
(`pt-BR`) across profile sync, SSR/hydration, messages, display formatters, Header selection, AI
plan creation, immutable authored content, ownership, rollback, and acceptance.

Hito requires one profile preference and one server resolver, not a client locale store:

```text
UiLocalePreference = "system" | "en" | "pt-BR"
ResolvedUiLocale   = "en" | "pt-BR"

explicit en/pt-BR -> that locale
system/missing + winning primary request language pt -> pt-BR
every other, absent, malformed, unsupported, or wildcard-only request -> en
```

Explicit preference synchronizes across devices; `system` remains request/device-relative and is
never overwritten by detection. Anonymous surfaces initially use system resolution. The
authenticated menu shows English and Portuguese (Brazil), factual device-language status for
`system`, and a return-to-device-language action only after an explicit override; `system` is not a
third primary language choice.

## Canonical Contract

- Persist one constrained `runner_profiles.ui_locale_preference`; do not reuse local/theme storage,
  auth metadata, or closed `training_preferences` JSON.
- Resolve profile preference plus `Accept-Language` on the server for every SSR request. Serialize
  the same result to root HTML, `<html lang>`, head, messages, formatters, and hydration. The client
  never recomputes initial locale from `navigator.language`, and a failed preference save keeps the
  prior server-confirmed document locale.
- Use typed static `en`/`pt-BR` catalogs partitioned by canonical owner and native `Intl`; current
  evidence does not justify an i18n framework, translation service, generated registry, or ambient
  per-component formatter.
- Persist ISO dates/timestamps and numeric domain truth unchanged. Date-only values format in UTC;
  instants use the canonical runner timezone; locale and timezone remain separate explicit inputs.
  `src/lib/runner-calendar-timezone.ts` remains locale-independent domain logic.
- `src/lib/training.ts` is the first shared display-formatter reuse seam. Direct `en-US`, `en`, or
  runtime `default` consumers migrate by owner so SSR/client output cannot drift.
- The Changelog timeline retains current English/source-authored entries, explicit year/month/day
  labels, and ISO ordering. Separate route chrome may localize.
- A new AI plan receives the server-resolved locale before preview creation. Runner-facing titles,
  phases, labels, cues, and fixed hydration copy are authored once in that locale; technical keys,
  IDs, dates, and metrics remain canonical. Authored locale belongs in signed review input and
  existing `goal_metadata.selected_plan_engine` provenance.
- Changing UI locale never retrotranslates user-authored, imported, saved, or existing AI-authored
  plan/workout text. Enum-derived read-model labels may localize; stored titles, notes, labels,
  guidance, and cues may not.
- Invalid locale/provider output fails before persistence. Portuguese creation must never silently
  fall back to an English plan.

## Source Evidence And Ownership

The discovery proved that profile/schema/settings, root/router, shared and local formatters, and
strict AI inputs independently assumed English. The existing profile had no locale field, while
`training_preferences` normalization drops unrelated keys. Root fixed `<html lang="en">`; formatters
used explicit English or runtime defaults; AI input/review schemas lacked locale and fixed
hydration copy to English. The authenticated language control belongs in the existing AppShell
account menu and consumes, rather than owns, locale truth.

Completed successor evidence now lives in:

- [Locale Profile Preference And Server Resolution](./2026-08-13-hito-ui-locale-profile-preference-and-server-resolution.md)
  — BACKEND persistence/resolver contract and local deterministic proof.
- [Shared Locale Catalog And Language Menu Contract](./2026-08-13-hito-ds-shared-locale-catalog-and-language-menu-contract.md)
  — DESIGN SYSTEM typed shared namespace, controlled menu composition, and focused reference proof.

Remaining work stays owner-separated: FRONTEND Product owns root SSR/head/hydration, authenticated
AppShell/settings, Product messages, and Product formatters; Marketing and DevTools own their own
consumer namespaces; BACKEND separately owns AI authoring/review/persistence locale; QA owns the
cross-device, hydration, formatting, content-preservation, Changelog, menu, and AI acceptance
matrix. PRODUCT alone routes those slices.

## Validation And Residual Boundary

This read-only discovery changed only this item. Source inventory, local link checks, Prettier, and
diff hygiene passed. It did not implement or prove runtime, browser, persistence, provider, hosted,
Global QA, release, deployment, or Figma behavior. The linked successor receipts own only their
focused claims.

Rollback is owner-local: retain profile values while disabling reads; revert catalog consumers
without a second store; revert root locale atomically with rendered messages; remove a Header
consumer without deleting preference; and fail closed for new Portuguese AI creation without
rewriting saved content. Global QA Acceptance remains Pending.

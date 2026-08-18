# Hito Admin Persistent Runner Identity And Elevated Access Alignment

## Work Item ID

2026-08-16-hito-admin-persistent-runner-identity-and-elevated-access-alignment

## Status

completed

## Type

Tracked — Backend auth and persisted-identity alignment

## Priority

high

## Owner

BACKEND

## Epic

platform-and-operations

## Stage

Backend implementation complete — durable Admin identity and existing settings contract aligned

## Next Recommended Role

PRODUCT

## Evidence From

[Language Dropdown Runner And Admin Adoption](./2026-08-16-hito-language-dropdown-runner-and-admin-adoption.md)

## Product Decision

An Admin is a first-class Hito account and may have the same persisted runner/profile/settings
contract as a Runner. `admin` is an elevated authorization role, not a separate user type or a
synthetic preferences silo. A future Trainer is likewise a role grant over an account; its runner
access must later be explicitly scoped, while Admin has global operational authority.

This task establishes only the Admin principal and its existing profile/settings reachability. It
does not implement Trainer, generic RBAC, delegation, impersonation, or new user-facing roles.

## Scope

The existing signed Admin password session, its local-fixture equivalent, persisted-user resolution,
and the runner profile/settings identity needed by the current Admin language preference. Retain the
existing Admin authorization guard and capability checks.

## Task

Replace the synthetic, non-persisted `hito-admin` identity with one durable, verified Admin account
principal that is safe to resolve through the existing profile and user-settings contract. Both
local-fixture and deployed-password Admin sessions must resolve that principal deterministically.
An authenticated Admin session must retain Admin privileges while being able to read/save its own
existing user settings, including `uiLocalePreference`.

The durable Admin identity must never be inferred from a browser value or silently mapped to an
unrelated Runner. Keep the signed Admin session as the authorization boundary unless the existing
auth seam proves a smaller secure alignment; the implementation owner chooses the smallest safe
existing seam.

## Demonstrated Cause

`src/lib/admin-auth-actions.server.ts` currently emits `hito-admin` for deployed password sessions.
`src/lib/request-persisted-user.ts` deliberately returns `null` whenever `provider === "admin"`.
The current `saveUserSettings` therefore rejects Admin before any profile read/write. Runner settings
are already backed by durable persisted identities; no language-control or Frontend defect exists.

## Reuse And Boundaries

- Reuse the existing Admin session verification, Admin access capability guard, `auth.users` /
  `runner_profiles` lifecycle, persisted-user resolver, user-settings resolver, and locale schema.
- Do not create a separate `admin_preferences` store, browser-local preference, copied language
  persistence API, generic RBAC framework, Trainer model, impersonation flow, extra Admin UI,
  locale catalog, or new user role surface.
- Preserve Admin-only route/function authority, session signing, local-fixture isolation, deployed
  password validation, Runner ownership/RLS, and all unrelated dirty work.
- Do not mutate hosted state, deployed credentials, paid services, or production users in this task.
  Return any required hosted bootstrap or environment action to PRODUCT precisely.

## Definition Of Done

1. Valid local-fixture and deployed-password Admin sessions both resolve one durable persisted Hito
   account identity, never the synthetic `hito-admin` placeholder.
2. That Admin identity has the existing profile/settings contract and can read/save only its own
   `uiLocalePreference` through the current typed settings seam.
3. Admin authorization remains global and explicit; Admin identity resolution cannot grant another
   Runner's profile, and non-Admin sessions cannot obtain Admin authority.
4. Existing local Admin login/logout, mixed-cookie, Runner isolation, RLS/ACL, and locale resolver
   behavior pass with disposable cleanup.
5. No new preferences persistence model or generic role system exists. The task records exactly
   what, if anything, requires a later hosted bootstrap.

## Execution Preflight

- **Mode / owner:** Tracked / BACKEND because signed authentication, durable identity, RLS-protected
  profile persistence, and an elevated capability boundary change. The Git index is empty; unrelated
  dirty work remains protected.
- **Observed local discriminator:** the server-owned local Admin registry contains a stale UUID, while
  its configured email resolves to a different `auth.users` UUID with Admin `app_metadata` and an
  existing `runner_profiles` row. The current login signs the stale registry UUID instead of resolving
  the durable account.
- **Observed deployed discriminator:** deployed-password login signs synthetic `hito-admin`; no
  server-owned durable account binding exists. `request-persisted-user.ts` rejects every Admin provider,
  and the exact existing `saveUserSettings` server function is not Admin-session eligible.
- **First incorrect owner:** Backend Admin session/persisted-user resolution, not the language control,
  profile schema, or Frontend consumer.
- **Existing seams reused:** signed Admin session construction and verification, local account
  email-to-Supabase lifecycle, Admin `app_metadata` authorization, request persisted-user resolution,
  exact Admin server-function admission, `runner_profiles`, and typed user-settings read/write.
- **Reuse-first change budget:** new production files, tables, migrations, RPCs, preference stores,
  role frameworks, dependencies, and compatibility paths are **none**. One explicit server-only
  `HITO_ADMIN_USER_ID` binding is required for deployed password auth because selecting an arbitrary or
  “first” Admin user would silently map the session to another principal. Hosted binding/bootstrap is
  returned to PRODUCT and is not performed here.
- **Simplification:** remove the synthetic `hito-admin` and legacy missing-ID fallback. Newly issued and
  resolved signed sessions carry only a verified persisted UUID; missing, malformed, non-Admin, or stale
  identity fails closed. Admin capability checks remain separate authorization logic.
- **Focused proof:** local signed login and deployed-password dependency path; exact settings action
  admission; invalid/missing/non-Admin identity rejection; login/logout and mixed cookies; authenticated
  locale read/save/reset without unrelated settings drift; RLS/ACL isolation and cleanup.
- **Stop conditions:** return to PRODUCT before a migration, hosted user/profile/environment mutation,
  credential change, implicit identity lookup, Trainer/RBAC policy, Frontend change, or new persistence
  shape.

## Handoff Prompt

```text
ROLE: BACKEND

Task: Hito Admin Persistent Runner Identity And Elevated Access Alignment

Mode: Tracked. Read AGENTS.md, agents/backend.agent.md,
skills/hito-backend-supabase-contract/SKILL.md, and the canonical item before acting.

Canonical item:
docs/tasks/backlog/2026-08-16-hito-admin-persistent-runner-identity-and-elevated-access-alignment.md

Evidence:
docs/tasks/backlog/2026-08-16-hito-language-dropdown-runner-and-admin-adoption.md

Accepted product direction:
Admin is a first-class Hito account/runner principal with elevated `admin` authorization. Do not
create a separate Admin preferences store. Future Trainer is a role grant over an account, but is
out of scope.

Outcome:
Valid local-fixture and deployed-password Admin sessions resolve one durable persisted account
identity that can use the existing profile/user-settings contract, including uiLocalePreference,
while retaining the current explicit Admin access/capability guard. Never map an Admin session to an
unrelated Runner or trust a browser-provided identity.

Reuse signed Admin session verification, Admin access guard, auth/profile lifecycle, persisted-user
resolver, and typed settings seam. Make the smallest safe change. Add no Admin-local preferences,
generic RBAC framework, Trainer model, impersonation, copied settings API, language UI, locale
catalog, or dependency. Do not mutate hosted users, credentials, or providers; return any required
hosted bootstrap to PRODUCT.

Validate local fixture and deployed-password dependency paths, login/logout and mixed cookies,
Admin/Runner isolation, authenticated settings read/write/reset, RLS/ACL, and disposable cleanup.
Use named ARCHITECT and QA only for bounded read-only review if materially useful. Update only this
canonical item with a compact English receipt. Do not claim browser, Global QA, hosted, release, or
deployment acceptance.
```

## Backend Implementation Receipt — 2026-08-16

- **Task / stage:** Hito Admin Persistent Runner Identity And Elevated Access Alignment / Backend
  authenticated identity and settings contract.
- **Preflight / root cause:** local Admin login signed the stale UUID stored in the local account
  registry even though its server-owned email resolved to a different Admin `auth.users` identity;
  deployed-password login signed synthetic `hito-admin`; and the persisted-user resolver rejected all
  Admin providers. The existing settings action therefore had neither a durable Admin principal nor an
  eligible signed-session request. The first incorrect owner was Backend Admin session and persisted
  identity resolution.
- **Product outcome:** local-fixture login now resolves the configured Admin email through the existing
  Auth lifecycle and verifies the resulting Admin `app_metadata`. Deployed-password login requires an
  explicit server-owned `HITO_ADMIN_USER_ID` and verifies that exact Auth user before issuing a cookie.
  The signed cookie carries the verified persisted UUID, accepts only the exact
  `local_fixture/loopback` or `deployed_password/deployed` provenance pairs, and no longer has a
  synthetic, missing-ID, or malformed-provenance fallback.
- **Authorization / settings boundary:** the existing Admin route and capability guard remains intact.
  Admin-session admission was extended only to the exact existing `saveUserSettings` server function;
  filename-wide settings admission and baseline actions remain denied. The settings action derives the
  target UUID from verified request auth. A locale-only first save may create the ordinary
  `runner_profiles` row with every unavailable runner-baseline fact still null; no default baseline or
  Admin-specific persistence exists.
- **Files changed:** `src/lib/admin-auth-actions.server.ts`,
  `src/lib/request-persisted-user.ts`, `src/lib/admin-access.server.ts`,
  `src/lib/user-settings-actions.ts`, `scripts/validate-admin-auth-session.ts`,
  `scripts/validate-ui-locale-profile.ts`, and this canonical item.
- **Reuse-first result:** new production files, migrations, tables, RPCs, preference stores, generic
  role frameworks, dependencies, and compatibility paths are none. The production change remains in
  the existing signed-session, persisted-user, Admin access, profile, and typed settings owners.
- **Preserved boundaries:** Runner ownership and RLS, the explicit Admin capability guard, existing
  password/session-secret validation, locale schema and resolver, unrelated settings, Frontend and
  Design System source, hosted users/configuration, providers, dependencies, Git state, and unrelated
  dirty work were not changed.

| Check                                  | Scenario / environment                                       | Result                  | Evidence                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------------------------- | ------------------------------------------------------------ | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Root-cause discriminator               | Current source plus loopback Auth/profile inventory          | Passed                  | The configured local Admin registry UUID was stale; its server-owned email resolved to one different Admin Auth UUID with one existing profile. The deployed path had no durable UUID binding, used synthetic `hito-admin`, and Admin persisted-user resolution returned null before this repair.                                                                                      |
| Admin session and authorization matrix | Deterministic Backend validator                              | Passed                  | Local and deployed dependency paths issue the verified UUID; invalid/missing/non-Admin identities, tester credentials, expired cookies, legacy missing-ID cookies, malformed source/runtime values, mixed provenance, product routes, broad settings-file access, and baseline actions fail closed. Mixed Runner/Admin cookies retain Admin authority only on admitted Admin surfaces. |
| Existing settings action admission     | Deterministic server-function ID matrix                      | Passed                  | Only `saveUserSettings_createServerFn_handler` is admitted for a signed Admin session; the containing source file and other settings functions remain denied.                                                                                                                                                                                                                          |
| Local Admin settings round trip        | Current loopback Admin Auth/profile, canonical action owners | Passed                  | Ordinary local Admin login resolved the actual Auth UUID, saved and read an alternate locale, restored the original preference, and preserved every unrelated stable profile field.                                                                                                                                                                                                    |
| Preference-only profile and isolation  | Disposable local Supabase identities                         | Passed                  | An Admin Auth identity without a profile created the ordinary preference-only profile, saved `pt-BR`, reset to `system`, retained null baseline facts, preserved revision/settings truth, rejected a regular Runner as Admin, enforced own-row RLS, and cleaned all disposable users/profile rows.                                                                                     |
| Complete Backend source/local-DB suite | Loopback Supabase                                            | Passed                  | `validate-backend.mjs --local-db` passed all 21 checks. Runtime and release groups were explicitly skipped by that suite.                                                                                                                                                                                                                                                              |
| Cleanup census                         | Local QA identity inventory after persistence proof          | Passed                  | Zero cleanup candidates and zero leases remained; the one protected Admin retained exactly one profile row.                                                                                                                                                                                                                                                                            |
| TypeScript                             | Repository-wide `tsc --noEmit` plus task-file filter         | Partial / unrelated red | Repository-wide TypeScript remains red on existing unrelated files; none of the six task-owned source/proof files appeared in the final error output.                                                                                                                                                                                                                                  |
| Static hygiene                         | Targeted Prettier, targeted ESLint, `git diff --check`       | Passed                  | All task-owned source/proof files format and lint cleanly; the final diff has no whitespace errors.                                                                                                                                                                                                                                                                                    |
| Independent architecture review        | Named ARCHITECT, read-only                                   | Passed after correction | Review found one malformed signed-session provenance fallback. Strict source/runtime parsing and crafted-cookie coverage corrected it; follow-up found no remaining actionable defect. The reviewer made no source, data, runtime, Git, or hosted mutation.                                                                                                                            |

- **Omitted checks / consequences:** no managed build or browser flow was run; the managed artifact was
  stopped/missing and browser, menu rendering, focus, responsive behavior, and console health remain
  FRONTEND/QA coverage. The real deployed-password environment was not accessed, so hosted identity,
  configuration, login, settings persistence, RLS, and release behavior remain unaccepted. No Global QA,
  hosted parity, release, or deployment claim is made.
- **Required deployed bootstrap:** PRODUCT must separately ensure that the intended deployed Admin Auth
  user has accepted Admin `app_metadata` and set server-only `HITO_ADMIN_USER_ID` to that exact UUID.
  This task did not inspect or mutate hosted users, credentials, or environment. Existing signed Admin
  cookies without the persisted UUID or exact provenance pair intentionally fail closed and require a
  fresh login.
- **Next owner:** PRODUCT may resume the blocked FRONTEND Product language-dropdown adoption using the
  existing `UserSettingsSummary` / `saveUserSettings` contract. Deployed browser acceptance remains
  contingent on the explicit hosted identity binding above.
- **Role / skills / review:** `agents/backend.agent.md`;
  `skills/hito-backend-supabase-contract/SKILL.md` and the installed Supabase procedure; one existing
  named ARCHITECT role was reused for bounded read-only review. No Backend implementation was delegated.
- **Implementation DoD:** Passed. **Global QA Acceptance:** Not run and not claimed.

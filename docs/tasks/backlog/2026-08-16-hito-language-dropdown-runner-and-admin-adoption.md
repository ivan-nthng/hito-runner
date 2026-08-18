# Hito Language Dropdown Runner And Admin Adoption

## Work Item ID

2026-08-16-hito-language-dropdown-runner-and-admin-adoption

## Status

completed

## Type

Tracked — Frontend Product shared-control adoption

## Priority

high

## Owner

FRONTEND

## Epic

platform-and-operations

## Stage

Frontend Product consumer adoption completed

## Next Recommended Role

PRODUCT

## Evidence From

[Shared Language Dropdown Surface Adoption](./2026-08-16-hito-shared-language-dropdown-surface-adoption.md)

## Scope

Mount the existing `HitoLanguageMenuItems` in the authenticated Runner `AppShell` and Admin account
dropdowns, alongside Theme. The shared component, visual recipe, and `/hitoDS` reference remain
owned by DESIGN SYSTEM.

## Task

Make the persisted language selector available inside existing account preferences. Choices are
only `English` and `Português (Brasil)`. Device language is factual default/readback, not a third
radio choice; `Use device language` appears only after an explicit selection.

Reuse the existing shared component and user-settings read/save contract. The selection must survive
close/reopen and reload in Runner and Admin without a copied control, nested dropdown, route-local
recipe, or local persistence state.

## User Report

Ivan requested the switcher in the existing dropdown, consistently in the Design System, Runner,
Admin, and related surfaces — no additional standalone UI.

## Source Investigation

- `src/components/ui/hito-language-menu.tsx` exports content-only `HitoLanguageMenuItems` for an
  enclosing account menu.
- `/hitoDS` already composes it in its existing Preferences dropdown.
- `src/components/AppShell.tsx` and `src/components/admin/AdminWorkspaceNav.tsx` already compose
  `ThemePreferenceMenuItems` in the relevant account dropdowns.
- `src/lib/user-settings-actions.ts` already reads and saves typed `uiLocalePreference` values.

## Required Discriminator

Before writing, verify that each authenticated menu can read current user settings and call the
existing save action. If Admin cannot, return the exact BACKEND/auth boundary; do not create an
Admin-local preference store.

## What Not To Touch

- No new language trigger, dropdown primitive, token, CSS recipe, locale store, catalog, locale
  value, schema, migration, backend endpoint, Settings page, or dependency.
- No full UI translation, SSR/root locale resolution, `html[lang]` hydration, formatter migration,
  AI locale, or third system radio option.
- Preserve Theme behavior, native Escape/focus return, unrelated dirty work, and the active
  Frontend task's `AppShell.tsx` changes.

## Definition Of Done

1. Runner and Admin account menus render the same shared language-menu items beside Theme.
2. Explicit selection and reset save through the existing profile setting and read back after reopen
   and reload.
3. There is no second language-control source, nested menu, Admin-local storage, or route-specific
   styling recipe.
4. Authenticated Runner/Admin pointer and keyboard flows pass proportionally in Light/Dark at
   desktop/mobile widths, with focus return, containment, and console health.
5. Remaining root/SSR translation work is named as a boundary, not claimed complete.

## Execution Preflight

### Resumed Frontend Preflight — 2026-08-16

- **Mode / owner:** Tracked / FRONTEND Product. The completed Backend prerequisite now resolves a
  signed local Admin session to one verified persisted UUID, admits only the existing
  `saveUserSettings` account action, and preserves the ordinary typed `UserSettingsSummary` profile
  contract. Hosted `HITO_ADMIN_USER_ID` configuration remains outside this task.
- **Current consumer discriminator:** Runner Product route loaders already own authenticated
  snapshot/viewer/settings composition, while both Admin routes already own their authenticated
  server-loader boundary. `AppShell` and `AdminWorkspaceAccountMenu` already compose Theme in the
  exact enclosing dropdowns. Neither consumer currently mounts `HitoLanguageMenuItems` or keeps
  locale state.
- **Existing seams / smallest change:** pass the existing settings readback through the admitted
  route loaders, then let the two existing account-menu owners call the existing typed save action
  and retain its returned `UserSettingsSummary` for close/reopen readback. The shared content-only
  language section remains read-only and owns all option, status, reset, and menu chrome.
- **New runtime artifacts:** none. No component, trigger, nested menu, route, endpoint, locale store,
  schema, migration, CSS recipe, catalog, dependency, or third locale is added.
- **Simplification / retained paths:** no second language-control recipe is introduced. Existing
  Theme composition, AppShell copy-correction bytes, Admin authorization, settings persistence,
  and the separate root/SSR/document-language boundary remain unchanged.
- **Focused proof:** source reachability and typed payload preservation; Runner and Admin explicit
  select/reset readback after close/reopen/reload; pointer/keyboard/Escape focus; desktop/mobile
  Light/Dark containment and console health on one fresh managed `qa_fixture`; focused static checks,
  build, and diff hygiene.
- **Stop boundary:** return to PRODUCT if the current Admin route cannot read its own settings through
  the completed authenticated request context, or if any fix requires Backend/auth, shared Design
  System, hosted configuration, a new persistence path, or a second locale owner.

The original preflight below is retained as historical evidence and is superseded by the completed
Backend prerequisite and resumed preflight above.

- **Mode / owner:** Tracked / FRONTEND Product. The prior
  `2026-08-16-hito-runner-legacy-plan-copy-removal` owner and its read-only QA reviewer are terminal;
  its accepted `AppShell.tsx` bytes remain protected.
- **Shared control:** `HitoLanguageMenuItems` is available as the sole content-only DESIGN SYSTEM
  owner and can be composed beside the existing Theme items without a nested dropdown or local
  visual recipe. Its source is read-only in this task.
- **Runner seam:** authenticated Runner settings are backed by a persisted Supabase user ID.
  `loadHomeRouteData` already reads `UserSettingsSummary`, while `loadShellRouteData` currently
  returns only `snapshot` and `viewer`. Frontend could extend that existing route-data boundary and
  pass controlled locale readback/save state to `AppShell`; no new store is required.
- **Admin discriminator:** Admin account menus have no settings props or loader readback.
  `hito_admin_session` resolves to synthetic user ID `hito-admin` with `provider: "admin"`, and
  `getPersistedUserIdForAuthContext` intentionally returns `null` for that provider. The existing
  `saveUserSettings` calls `requirePersistedUserIdForCurrentRequest`, which therefore throws
  `Authentication is required for this action.` before any profile read/write. Both local-fixture
  and deployed-password Admin sessions use this separate Admin identity contract.
- **New runtime artifacts:** none. No component, state/store, persistence path, schema, migration,
  route-local CSS, locale catalog, endpoint, or compatibility mapping is admitted.
- **Simplification:** one DESIGN SYSTEM language-control owner remains ready for both consumers; no
  partial Runner-only adoption or unavailable Admin control is added while persistence cannot be
  truthful in both required surfaces.
- **Serialization:** no source, build, runtime, fixture, browser, or hosted mutation was performed.
  The previously running managed PID is not reused as acceptance evidence because this preflight
  stops before implementation and its artifact freshness had already drifted on an unrelated Admin
  repository snapshot marker.
- **Stop boundary:** return to PRODUCT for a BACKEND/auth contract that gives authenticated Admin
  sessions a durable existing-settings identity/read/save seam across local-fixture and deployed
  admin modes. Frontend must not map `hito-admin` to a runner profile, invent Admin-local storage, or
  ship only the Runner half without a new Product dispatch.

## Handoff Prompt

```text
ROLE: FRONTEND

Lane: Product

Task: Hito Language Dropdown Runner And Admin Adoption

Mode: Tracked. Read AGENTS.md, agents/frontend.agent.md,
skills/hito-frontend-design-system/SKILL.md, and
skills/hito-qa-browser-regression/SKILL.md before acting.

Canonical item:
docs/tasks/backlog/2026-08-16-hito-language-dropdown-runner-and-admin-adoption.md

Shared-control evidence:
docs/tasks/backlog/2026-08-16-hito-shared-language-dropdown-surface-adoption.md
src/components/ui/hito-language-menu.tsx

Outcome:
Adopt canonical `HitoLanguageMenuItems` inside existing authenticated Runner AppShell and Admin
account dropdowns alongside Theme. Save/read its controlled preference through existing user
settings. Choices are English and Português (Brasil); device language is factual readback/default;
reset appears only after explicit selection.

First verify both consumers' safe authenticated settings read/save seams. Reuse the shared DS
component, menu composition, and user-settings action. Add no component, nested dropdown,
route-local CSS recipe, locale store, Admin-local persistence, schema, migration, catalog,
dependency, Settings page, or third choice.

Do not implement full translations, SSR/root resolution, document-language hydration, formatter or
AI locale work. Preserve Theme and unrelated dirty work. Inspect the current `AppShell.tsx` diff and
preserve the completed copy-correction task's bytes.

Validate reuse and persistence readback. With a fresh managed artifact, prove authenticated Runner
and Admin select/reset with pointer and keyboard, close/reopen, reload, Escape/focus return,
desktop/mobile Light/Dark containment, and console health. A bounded read-only QA review is allowed;
do not delegate Frontend implementation. Return a precise Backend/auth boundary instead of
inventing a store if Admin cannot use the existing settings seam.

Update only this canonical item with a compact English receipt. Do not start Global QA or claim
release readiness.
```

## Frontend Blocked Preflight Receipt — 2026-08-16

- **Task / stage:** Hito Language Dropdown Runner And Admin Adoption / authenticated settings seam
  discriminator before implementation.
- **Outcome:** no Product source was changed. The shared menu content and Runner persistence route
  are reusable, but the required Admin consumer cannot truthfully read or save the preference
  through the existing user-settings contract.
- **First incorrect owner:** BACKEND/auth identity mapping for Admin preferences. The separate Admin
  session is valid for Admin capabilities but is deliberately not a persisted runner/user-settings
  identity.
- **Files inspected:** `src/components/ui/hito-language-menu.tsx`, `src/components/AppShell.tsx`,
  `src/components/admin/AdminWorkspaceNav.tsx`, `src/lib/user-settings-actions.ts`,
  `src/lib/request-persisted-user.ts`, `src/lib/admin-auth-actions.server.ts`, existing Runner route
  data, and the shared-control evidence item.
- **Files changed:** this canonical lifecycle/preflight/receipt only.
- **Preserved boundaries:** the completed App Shell copy correction, Theme, shared language control,
  Admin/Runner authentication, user settings, persistence, routes, CSS, locale catalog, root/SSR,
  fixtures, runtime, dependencies, and all unrelated dirty work remain unchanged.

| Check                         | Scenario / environment                                  | Result               | Evidence                                                                                                                                                                                              |
| ----------------------------- | ------------------------------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared control reuse          | Current source                                          | Passed               | `HitoLanguageMenuItems` is content-only, controlled, and renders only `en` / `pt-BR`, factual device readback, and conditional reset.                                                                 |
| Runner read/save reachability | Current authenticated route/actions source              | Passed               | Persisted Runner identities can use `getUserSettingsForUserId` and `saveUserSettings`; `loadShellRouteData` is the existing read boundary Frontend would extend.                                      |
| Admin read reachability       | `hito_admin_session` source                             | Failed / cross-owner | Admin session identity is `hito-admin` with provider `admin`; no Admin account-menu loader supplies user settings.                                                                                    |
| Admin save reachability       | Existing persisted-user resolver and `saveUserSettings` | Failed / cross-owner | `getPersistedUserIdForAuthContext({ provider: "admin", userId: "hito-admin" })` returned `null` in a non-mutating in-memory discriminator; `saveUserSettings` rejects that result before persistence. |
| Dirty/index boundary          | Current checkout                                        | Passed               | Index is empty; only the canonical item was written by this task. Existing `AppShell.tsx` dirty bytes were inspected and not changed.                                                                 |
| Runtime/browser/build         | Shared lifecycle                                        | Not run              | No implementation exists to admit. Running these checks would not resolve the missing Admin persistence identity and would create misleading partial acceptance.                                      |

- **Required cross-owner contract:** BACKEND, routed by PRODUCT, must expose an authenticated Admin
  locale preference read/save identity that works for both local-fixture and deployed-password Admin
  sessions and can return the existing typed `UiLocalePreference` / resolved-locale readback. It must
  not rely on a browser-local store or an unapproved implicit mapping from `hito-admin` to a runner
  profile. If choosing that durable identity requires a Product decision, PRODUCT must settle it
  before Backend implementation.
- **Coverage consequence:** Runner/Admin selection, reset, reload persistence, keyboard/focus,
  themes, responsive containment, and console proof remain unrun because the required two-consumer
  implementation is blocked before source adoption.
- **Role / skills / review:** `agents/frontend.agent.md`;
  `skills/hito-frontend-design-system/SKILL.md` and
  `skills/hito-qa-browser-regression/SKILL.md`; no subagent was used because the ownership failure is
  source-deterministic and browser QA cannot close it.
- **Next owner:** PRODUCT to create or route the bounded BACKEND/auth prerequisite, then redispatch
  this same Frontend adoption item after the contract is accepted.
- **Blocker:** existing Admin authentication has no persisted user-settings identity.

## Frontend Tracked Implementation Receipt — 2026-08-16

- **Task / stage:** Hito Language Dropdown Runner And Admin Adoption / completed Frontend Product
  consumer adoption after the durable local Admin identity prerequisite.
- **Preflight / accepted decision:** the current Runner and Admin account-menu owners already
  composed Theme and could both read/save the same typed `UserSettingsSummary`. The shared,
  content-only `HitoLanguageMenuItems` remained the sole option/status/reset presentation owner.
- **Product outcome:** authenticated Runner and local Admin account menus now render the same
  `English` / `Português (Brasil)` choices beside Theme. Explicit selection persists through the
  existing settings action and reload; reset returns to factual device-language readback and is no
  longer rendered after the explicit preference is cleared.
- **Existing seams reused:** `AppShell`, `AdminWorkspaceAccountMenu`, Runner/Admin route loaders,
  `saveUserSettings`, and `HitoLanguageMenuItems`. No component, trigger, nested menu, store,
  endpoint, schema, migration, stylesheet recipe, locale catalog, dependency, or runtime artifact
  was added.
- **Files changed:** `src/components/AppShell.tsx`,
  `src/components/admin/AdminWorkspaceNav.tsx`, `src/lib/route-data-actions.ts`,
  `src/routes/index.tsx`, `src/routes/progress.tsx`, `src/routes/integrations.tsx`,
  `src/routes/workout.$date.tsx`, `src/routes/settings.tsx`,
  `src/routes/admin.capture.tsx`, `src/routes/admin.analytics.tsx`, and this canonical item.
- **Preserved boundaries:** Theme behavior; Runner Calendar, copy-correction, workout, and other
  accepted dirty hunks; shared Design System source; authentication and settings contracts;
  root/SSR/document-language resolution; hosted Admin binding; Backend; fixtures; and unrelated
  work remain unchanged.

| Check                      | Scenario / environment                                   | Result                       | Evidence                                                                                                                                                                                                                                                                                                                          |
| -------------------------- | -------------------------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared-owner reachability  | Current source census                                    | Passed                       | Both consumers import `HitoLanguageMenuItems`; no copied language options, nested menu, route CSS, or local persistence owner was introduced. All persisted Runner AppShell routes and both Admin route loaders supply the existing settings readback.                                                                            |
| Runner persistence         | Fresh managed `qa_fixture`, Runner account menu          | Passed                       | Pointer selected `pt-BR`; close/reopen and reload retained the checked option and factual selected-language status. Keyboard reset restored device-language readback, removed the reset item, and remained cleared after reload.                                                                                                  |
| Admin persistence          | Fresh managed `qa_fixture`, durable local Admin identity | Passed                       | Keyboard selected `pt-BR`; close/reopen and reload retained the checked option. Pointer reset restored device-language readback, removed the reset item, and remained cleared after reload. No credentials were exposed or hosted identity used.                                                                                  |
| Keyboard / focus           | Runner desktop and Admin desktop/mobile                  | Passed                       | Enter activated menu choices; Escape returned focus to the existing account-menu trigger in both consumers. Existing Theme radio behavior remained operable.                                                                                                                                                                      |
| Responsive / themes        | 1470×801 and exact 375×812, Light and Dark               | Passed                       | Runner desktop menu and mobile shell, plus Admin desktop/mobile menus, stayed within their viewports with `documentElement.scrollWidth === innerWidth`; Admin mobile menu remained fully contained. Runner's existing account trigger is desktop-only, so no unapproved mobile trigger was added.                                 |
| Console                    | Complete Runner/Admin replay                             | Passed                       | No browser warnings or errors were recorded.                                                                                                                                                                                                                                                                                      |
| Static checks              | Task-owned source and receipt                            | Passed                       | Targeted Prettier, targeted ESLint, `validate-ui-locale-profile`, and `git diff --check` passed. Filtered type diagnostics contained no task-owned locale/settings errors.                                                                                                                                                        |
| Build / artifact admission | Managed `qa_fixture` production build                    | Passed with post-proof drift | The production client/SSR/Nitro build passed and PID 78842 was admitted fresh with `receipt_matches` before browser proof. After proof, an unrelated private Admin repository snapshot digest changed and status became `artifact_missing`; the already-completed fresh-artifact replay was not invalidated or rebuilt in a loop. |
| Broader DS validator       | Checkout-wide documentation invariant                    | Not task-owned               | `validate-hito-ds-components` remains red on the pre-existing requirement that current product/system/state docs record the production-shipped `/hitoDS` role; this task changed neither that documentation nor shared DS source.                                                                                                 |

- **Coverage consequence:** exact 375px Runner account-menu interaction is not available because the
  existing authenticated Runner account trigger is desktop-only and this task explicitly forbids a
  new trigger. The mobile AppShell itself passed Light/Dark containment. Hosted
  `HITO_ADMIN_USER_ID` provisioning, root locale resolution, translated catalogs, Global QA,
  release, and deployment remain unclaimed.
- **Role / skills / review:** `agents/frontend.agent.md`;
  `skills/hito-frontend-design-system/SKILL.md` and
  `skills/hito-qa-browser-regression/SKILL.md`; the installed in-app browser-control skill was used
  for the local replay. No subagent was used; the two-consumer runtime matrix was completed by the
  assigned Frontend owner.
- **Next owner:** PRODUCT for normal backlog coordination or a separately scoped root/SSR locale
  slice. No Frontend implementation blocker remains in this item.
- **Blockers:** none inside the assigned Frontend Product scope.

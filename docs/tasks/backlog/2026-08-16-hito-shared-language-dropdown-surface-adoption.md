# Hito Shared Language Dropdown Surface Adoption

## Work Item ID

2026-08-16-hito-shared-language-dropdown-surface-adoption

## Status

completed

## Type

Tracked — shared locale-control adoption

## Priority

high

## Owner

DESIGN SYSTEM

## Epic

platform-and-operations

## Stage

Design System focused acceptance completed

## Next Recommended Role

PRODUCT

## Blocker

None for the shared Design System language-menu contract. Full translated Product UI and root/SSR
locale application remain separate Product-owned follow-up work.

## Depends On

- [Locale Profile Preference And Server Resolution](./2026-08-13-hito-ui-locale-profile-preference-and-server-resolution.md)
- [Shared Locale Catalog And Language Menu Contract](./2026-08-13-hito-ds-shared-locale-catalog-and-language-menu-contract.md)

## Scope

The existing `HitoLanguageMenu` owner, its physical `/hitoDS` reference, and the composition
required for the existing Runner and Admin account dropdowns. The visible control is a section in
an existing dropdown, not a new Settings page or a second standalone preference surface.

## Task

Reuse the existing `src/components/ui/hito-language-menu.tsx` contract so an existing dropdown can
render the same language choice content without nesting one dropdown inside another. Show the
actual controlled control in the Hito DS header preferences dropdown.

The accepted product decision is fixed:

- choices are only `English` and `Português (Brasil)`;
- device language is the default when no explicit choice exists and is shown as readback, not a
  third radio option;
- after an explicit choice, the existing reset-to-device action remains available;
- no duplicate component, trigger, tokens, menu recipe, locale preference storage, or catalog is
  admitted.

After this stage, FRONTEND Product adopts that same shared menu content in the authenticated
Runner `AppShell` account menu and the Admin account menu, reusing existing user-settings save/read
seams. It must not introduce a second language control or a route-local menu recipe.

## Source Facts

- `HitoLanguageMenu` exists but has no caller in `src`; it currently owns a separate icon-triggered
  `DropdownMenu`, so it cannot be rendered inside the existing menu safely as-is.
- The canonical Runner and Admin account dropdowns already compose
  `ThemePreferenceMenuItems` in `src/components/AppShell.tsx` and
  `src/components/admin/AdminWorkspaceNav.tsx`.
- `/hitoDS` currently renders only the Theme section in the top-right preferences dropdown at
  `src/components/hito-ds/reference-page.tsx`.
- Backend preference persistence, resolver, validation, and generated types already exist.

## What Not To Touch

- No full-product translation, SSR/root locale resolution adoption, formatter migration, AI locale,
  schema/migration, settings page, Admin data model, or new locale values.
- Do not treat the Design System controlled reference as a profile write.
- Do not change Theme behavior, dropdown primitives, or current shared menu styling except where
  the existing language-control composition demonstrably needs it.

## Definition Of Done

1. The existing language-control owner exposes reusable menu content for an enclosing dropdown and
   has no nested-dropdown usage.
2. `/hitoDS` has a physical, controlled Language section in its existing preferences dropdown.
3. The same source contract is ready for Runner and Admin adoption without a duplicate primitive or
   recipe.
4. Keyboard radio selection, Escape/focus return, reset-to-device visibility, Dark/Light visual
   containment, and the current DS validator pass proportionally.
5. The canonical item records the exact `FRONTEND` Product follow-up; that stage owns persistence
   wiring in AppShell/Admin and is not implemented by DESIGN SYSTEM.

## Execution Preflight

- **Accepted cause:** `HitoLanguageMenu` is the sole shared language-control owner but currently
  owns its own `DropdownMenu`, icon trigger, content portal, and menu items. Repository-wide source
  reachability is zero, so that standalone wrapper cannot be nested in the existing Hito DS,
  Runner, or Admin preference menus and has no live consumer that requires preserving it.
- **Existing seams:** reuse `src/components/ui/hito-language-menu.tsx`, the existing Radix-backed
  Hito menu primitives and shell-menu classes, the existing `ThemePreferenceMenuItems`
  composition pattern, the current typed locale catalog, and the top-right preferences menu in
  `src/components/hito-ds/reference-page.tsx`.
- **Smallest behavior change:** replace the unreachable standalone trigger/root/content ownership
  with one content-only language section from the same canonical file, then mount that section in
  the existing Hito DS menu with local controlled preference and resolved-locale state. Theme and
  search state remain independent.
- **New runtime artifacts:** none. No component family, trigger, token, CSS recipe, locale value,
  storage path, dependency, or catalog is added.
- **Removed responsibility:** the language-control owner no longer creates a nested/standalone
  dropdown or icon trigger. The enclosing consumer owns opening, closing, Escape, and focus return;
  the shared language section continues to own its two radio choices, factual device/selected
  readback, and conditional reset action.
- **Proof inventory:** exact consumer/export census; manifest check and existing DS validator;
  focused format/lint/diff hygiene; then controlled `/hitoDS` keyboard radio selection, Escape and
  focus return, reset visibility, Dark/Light containment, responsive overflow, and console health
  without profile, fixture, or hosted mutation.
- **Stop condition:** return to PRODUCT if the existing dropdown primitives cannot carry the
  content-only section or if AppShell/Admin persistence wiring is required for this stage.

## Historical Stage 1 Implementation Receipt — 2026-08-16

### Outcome and root cause

The shared source implementation is complete. The zero-consumer standalone `HitoLanguageMenu`
owned an icon trigger, `DropdownMenu` root, portal content, and language items together. That
shape could not be nested in the already-canonical Hito DS, Runner, or Admin preferences menus.
The same canonical file now exports one `HitoLanguageMenuItems` content composition. The former
standalone export and its trigger-specific catalog copy were removed rather than retained as a
parallel path.

The existing `/hitoDS` top-right menu now composes Theme and Language sections in one dropdown.
Its locale preference is local controlled reference state only: it begins in device-language mode,
derives the reference resolved locale without touching `document.lang`, exposes only `English` and
`Português (Brasil)` as radio choices, and shows `Use device language` only after an explicit
selection. No user profile, fixture, storage, root locale, AppShell, or Admin source was changed.

### Files changed

- `src/components/ui/hito-language-menu.tsx` — replaced the unreachable standalone dropdown/trigger
  with the reusable content-only language section while retaining typed controlled inputs, radio
  semantics, factual readback, and conditional reset.
- `src/components/hito-ds/reference-page.tsx` — mounted the shared section in the existing
  Preferences dropdown with local controlled state and reused the canonical menu width/separator
  composition.
- `src/lib/ui-locale-messages.ts` — removed only the now-unreachable standalone trigger labels;
  all menu labels, options, device/selected readback, and reset copy remain canonical.
- This canonical item — recorded preflight, evidence, lifecycle, and the bounded Stage 2 handoff.

### Validation

| Check                             | Scenario / environment                                                                                           | Result                     | Evidence                                                                                                                                                                                                                                                                            |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source/export census              | Current `src/**/*.tsx`                                                                                           | Passed                     | `HitoLanguageMenuItems` is reachable only from its canonical owner and `/hitoDS`; no standalone `DropdownMenu`, trigger, portal content, or `data-hito-language-menu-trigger` remains in the owner. Existing Runner/Admin callers remain byte-stable on `ThemePreferenceMenuItems`. |
| Controlled contract discriminator | Owner plus `/hitoDS` source                                                                                      | Passed                     | Exactly `en` and `pt-BR` are rendered from `RESOLVED_UI_LOCALE_VALUES`; device/system is readback only; reset calls the existing `system` preference; the reference passes controlled `preference`, `resolvedLocale`, and callback props.                                           |
| Manifest parity                   | `node scripts/generate-hito-ds-manifest.mjs --check`                                                             | Passed                     | `primitiveColors=43`, `semanticColors=41`, `textStyles=14`; no generated file changed.                                                                                                                                                                                              |
| Focused lint                      | ESLint on the three changed runtime files                                                                        | Passed                     | No diagnostics.                                                                                                                                                                                                                                                                     |
| Formatting                        | Prettier check on runtime files and this item                                                                    | Passed                     | All matched files use Prettier style.                                                                                                                                                                                                                                               |
| Diff hygiene                      | `git diff --check`                                                                                               | Passed                     | No whitespace errors.                                                                                                                                                                                                                                                               |
| Production compilation            | `npm run build`                                                                                                  | Partial                    | Vite client and SSR production compilation passed. Postbuild integrity then rejected the artifact because the private Admin repository snapshot marker/generation/digest was missing. This task did not alter or bypass that Admin owner.                                           |
| Full DS validator                 | `npm run validate-hito-ds-components`                                                                            | Blocked outside this slice | The only reported failure is the pre-existing documentation invariant: `Current product, system, and state docs must record the production-shipped /hitoDS role.` No language-menu contract failure was reported.                                                                   |
| Managed runtime admission         | `npm run qa:server:status` after build                                                                           | Blocked outside this slice | Server is stopped, build is broken/stale with `artifact_missing`; current integrity evidence reports missing private Admin digest `7b3488761aa4021e1461c43e1a4d069736a5a2970a754caca5c7f3cf680b0e45`.                                                                               |
| Browser interaction/visual proof  | Keyboard radio selection, Escape/focus return, conditional reset, Dark/Light desktop/mobile containment, console | Not run                    | A fresh managed artifact could not be admitted. Using an unmanaged preview would bypass the repository's private Admin integrity gate, so no browser acceptance is claimed.                                                                                                         |

### Remaining boundary and prepared Product handoff

Stage 1 remains `blocked`, not failed: source and production compilation are stable, but the required
full-validator and managed-browser acceptance layers are unavailable because of unrelated current
documentation and private Admin build-integrity owners. PRODUCT must route those exact gates, then
return this item to DESIGN SYSTEM only for the omitted focused browser replay and truthful terminal
closure.

After Stage 1 is terminal, PRODUCT may dispatch exactly one `FRONTEND` Product adoption task using
the prompt below. It is prepared here but was not implemented or dispatched by this slice.

## Historical Stage 2 Handoff Prompt

```text
ROLE: FRONTEND

Lane: Product

Task: Adopt the canonical Hito language dropdown section in Runner AppShell and Admin account menus

Mode: Tracked. Execute only after PRODUCT confirms the completed Design System Stage 1 contract in
docs/tasks/backlog/2026-08-16-hito-shared-language-dropdown-surface-adoption.md.

Reuse `HitoLanguageMenuItems` from `src/components/ui/hito-language-menu.tsx` inside the existing
Runner `AppShell` and `AdminWorkspaceNav` account dropdowns, alongside their current Theme section.
Wire its controlled `preference`, `resolvedLocale`, and preference-change callback to the existing
Backend user-settings read/save contract. Keep English and Português (Brasil) as the only radio
choices; device language remains readback/default and reset appears only after an explicit choice.

Do not create another language component, nested dropdown, route-local recipe, locale store,
optimistic document-language state, persistence path, or third primary language choice. Preserve
Theme behavior, menu focus/Escape semantics, SSR/root resolution ownership, and all unrelated dirty
work. Validate authenticated Runner/Admin pointer and keyboard selection, save/readback, reset,
focus return, Light/Dark responsive containment, overflow, and console health. Return any Backend
or root/SSR boundary to PRODUCT; do not modify Design System source in this adoption slice.
```

## Terminal Focused Acceptance Receipt — 2026-08-18

### Task, stage, and preflight

- **Task / mode:** Hito Shared Language Dropdown Surface Adoption / Tracked terminal focused
  acceptance.
- **Accepted release-admission cause:** `AppShell` and `AdminWorkspaceNav` now import the shared
  content-only `HitoLanguageMenuItems`, while this Design System item still carried the historical
  blocked status from unrelated documentation and private Admin artifact gates.
- **Canonical owner and reused seams:** `src/components/ui/hito-language-menu.tsx` remains the sole
  shared Language section owner; `src/components/hito-ds/reference-page.tsx` remains its controlled
  physical reference inside the existing Preferences dropdown. The completed Frontend successor
  owns Runner/Admin persisted adoption.
- **New runtime artifacts:** none. No source, locale choice, persistence, AppShell/Admin, menu,
  token, catalog, data, fixture, or generated artifact changed in this closeout.
- **Obsolete responsibility removed:** no runtime responsibility was removed in this pass. The
  obsolete lifecycle blocker is terminalized because current source, completed consumer adoption,
  a fresh build, and focused `/hitoDS` interaction evidence now agree.

### Current source and consumer census

- `HitoLanguageMenuItems` exports a controlled content composition only; it does not own a
  `DropdownMenu` root, trigger, or portal.
- The shared component has exactly three current consumers: the controlled `/hitoDS` reference,
  Runner `AppShell`, and `AdminWorkspaceNav`.
- Its two primary radio choices remain exactly `English` and `Português (Brasil)`. Device language
  remains factual readback/default, not a third radio choice; the reset action exists only after an
  explicit preference.
- `/hitoDS` uses local React state only and does not save a profile, mutate `document.lang`, or
  create a second locale source.
- The completed
  [Runner and Admin adoption](./2026-08-16-hito-language-dropdown-runner-and-admin-adoption.md)
  retains persisted Product-consumer ownership. Root/SSR translation application remains outside
  this shared-control item.

### Validation

| Check                            | Scenario / environment                                                                       | Result                                        | Evidence                                                                                                                                                                                                                                             |
| -------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Export and reachability contract | Current shared owner plus all `src` consumers                                                | Passed                                        | One content-only export and exactly three consumers: `/hitoDS`, Runner, and Admin. No nested language dropdown, duplicate trigger, or second option owner is reachable.                                                                              |
| Controlled locale contract       | Current shared owner and `/hitoDS` composition                                               | Passed                                        | `preference`, `resolvedLocale`, and callback remain controlled; exactly `en` and `pt-BR` render as radio choices; device readback/reset behavior remains conditional.                                                                                |
| Locale source validator          | `node --import tsx scripts/validate-ui-locale-profile.ts`                                    | Passed                                        | Current typed locale/profile contract validation passed. The older standalone npm alias recorded in historical evidence no longer exists; the current validator owner is called directly and remains part of `validate-backend`.                     |
| Manifest parity                  | `node --import tsx scripts/generate-hito-ds-manifest.mjs --check`                            | Passed                                        | Generated manifest is current: `primitiveColors=43`, `semanticColors=41`, `textStyles=14`; no generated output changed.                                                                                                                              |
| Focused formatting and lint      | Prettier plus ESLint on shared owner, reference, catalog, and current Runner/Admin consumers | Passed                                        | No formatting or lint diagnostics.                                                                                                                                                                                                                   |
| Diff hygiene                     | `git diff --check` plus no-index check of this untracked canonical item                      | Passed                                        | Tracked check exited 0. The no-index check emitted no whitespace diagnostics; its exit 1 is the expected content-difference status for an untracked file compared with `/dev/null`.                                                                  |
| Fresh production artifact        | Canonical `qa:server:restart -- --provider-mode qa_fixture`                                  | Passed                                        | Client, SSR, Nitro, and postbuild completed; managed loopback PID `42420` admitted as healthy, compatible, `qa_fixture`, and fresh with `receipt_matches` before browser navigation.                                                                 |
| Physical reference composition   | `/hitoDS` at 1470x801 and 375x812, Light and Dark                                            | Passed                                        | All four cells rendered Theme and Language in the existing Preferences menu. The 224px menu stayed within the viewport; document width equalled viewport width in every cell.                                                                        |
| Pointer and keyboard selection   | Both viewport sizes and themes                                                               | Passed                                        | Pointer selection and physical keyboard Enter selected `Português (Brasil)`; physical keyboard also selected `English`. The checked radio and localized selected-language readback agreed after every selection.                                     |
| Device reset and readback        | Both viewport sizes and themes                                                               | Passed                                        | Initial readback was `Device language: English` with no reset item. Explicit selection revealed the localized reset; reset returned to device readback and removed the action. No profile or hosted state was touched.                               |
| Escape and focus return          | Both viewport sizes and themes                                                               | Passed                                        | Physical Escape closed the menu and returned visible keyboard focus to the collapsed `Preferences` trigger in all four cells.                                                                                                                        |
| Console health                   | Complete focused browser replay                                                              | Passed                                        | No browser warnings or errors.                                                                                                                                                                                                                       |
| Full DS validator                | `npm run validate-hito-ds-components`                                                        | External failure, not a shared-control defect | The only failure is the unrelated documentation invariant: `Current product, system, and state docs must record the production-shipped /hitoDS role.` No language-menu assertion or source contract failed; this item did not alter those documents. |

### Closure and remaining boundary

The shared Design System contract and physical reference meet their focused Definition of Done, so
this item is completed. Historical blocked receipts remain above as chronology; their Admin
consumer prerequisite is resolved by the completed Frontend successor, and their missing browser
layer is supplied by this fresh receipt. This is focused Implementation DoD only: it does not claim
Global QA, release readiness, deployment, hosted acceptance, or complete Product translation.

- **Files changed in this acceptance pass:** this canonical item only.
- **Next owner:** PRODUCT for any separate root/SSR translation or broader acceptance work.
- **Role / skills / review:** `agents/design-system.agent.md`;
  `skills/hito-frontend-design-system/SKILL.md`,
  `skills/hito-qa-browser-regression/SKILL.md`, and the supported local Browser control skill. No
  subagent was used.

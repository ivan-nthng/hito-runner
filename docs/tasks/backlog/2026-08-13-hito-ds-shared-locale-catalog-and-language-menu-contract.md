# Hito DS Shared Locale Catalog And Language Menu Contract

## Work Item ID

2026-08-13-hito-ds-shared-locale-catalog-and-language-menu-contract

## Status

completed

## Type

design-system shared locale foundation

## Priority

high

## Owner

design system

## Mode

Tracked

## Depends On

[Locale Profile Preference And Server Resolution](2026-08-13-hito-ui-locale-profile-preference-and-server-resolution.md)

## Evidence From

[UI Locale And Brazilian Portuguese Contract Discovery](2026-08-13-hito-ui-locale-and-brazilian-portuguese-contract-discovery.md)

## Task

Establish the smallest shared Design System contract that lets later consumers present English and
Brazilian Portuguese interface chrome consistently from the server-owned locale result. Implement a
typed static message catalog for the first shared shell/language namespace and an accessible,
controlled language-preference menu composition using existing dropdown/radio/menu primitives.

The menu shows English and Portuguese (Brazil) as the two primary choices. It must distinguish the
server-provided preference from the resolved display locale: when preference is `system`, show the
factual device-language result without presenting `system` as a third primary language choice; when
preference is explicit, expose a compact return-to-device-language action.

The composition must remain controlled by inputs and callbacks. It must not create a browser locale
store, perform an optimistic document language flip, or persist the preference itself. The later
FRONTEND Product owner will connect it to root SSR and the authenticated AppShell settings mutation.

## Stage

Design System Slice 2 — shared catalog and language-menu contract completed

## Execution Preflight — 2026-08-13

- **Accepted input and root cause:** Backend Slice 1 is completed and exposes the sole server-owned
  `UiLocaleResolution` shape. The current source has no typed shared message owner and no controlled
  locale menu that can consume that shape. `ThemePreferenceMenuItems` owns a browser-backed theme
  hook and therefore cannot truthfully own server-shaped locale state.
- **Existing seams to reuse:** `src/lib/ui-locale.ts` supplies the closed locale/preference types;
  the current Hito Dropdown radio/menu, Button, Icon, focus, motion, and shell-menu contracts supply
  all interaction and presentation; the existing App Shell playground supplies the controlled
  `/hitoDS` proof.
- **Smallest behavior change:** add one typed two-locale catalog for the first shared
  shell/language namespace and one prop-driven language menu that selects only `en` or `pt-BR`,
  reports a factual device-resolved state for `system`/`null`, and exposes reset to `system` only
  after an explicit override. The App Shell reference owns only demo controls and does not persist,
  inspect ambient language, or change the document locale.
- **New runtime artifacts:** `src/lib/ui-locale-messages.ts` is justified as the sole typed message
  owner because neither the Backend resolver nor a component may own translated strings;
  `src/components/ui/hito-language-menu.tsx` is justified as the sole accessible controlled
  composition because the generic Dropdown primitive must remain preference-agnostic. No other
  file, framework, store, registry, service, formatter, token, CSS recipe, compatibility path, or
  state owner is proposed.
- **Superseded responsibility:** later shared consumers no longer need inline locale conditionals,
  option labels, system-result copy, or reset wording inside this admitted namespace. No prior
  locale runtime path exists to delete.
- **Direct Product correction:** the shared `DropdownMenuRadioItem` selected indicator changes from
  the existing `circle` glyph to the existing `check` glyph at the canonical primitive owner. Its
  Radix radio semantics, indicator state, spacing, focus, keyboard behavior, and accessibility stay
  unchanged. Theme preference, the Dropdown family reference, and the new language menu must all
  inherit the same check; no locale-specific override or icon addition is allowed.
- **COPY review:** a bounded read-only COPY review approved stable autonyms (`English`,
  `Português (Brasil)`), “device language” / “idioma do dispositivo,” factual system and explicit
  status text, and the reset action. No Product/settings/save/error copy was introduced.
- **Dirty-work boundary and stop:** preserve all existing Header/App Shell, Brand, Foundations,
  Product, Backend, migration, validator, generated, favicon, policy, and receipt hunks
  byte-for-byte. Return to PRODUCT if implementation requires Root SSR, persistence, a Product
  consumer, ambient browser locale, formatter ownership, or another locale framework/state owner.

## Browser Path Preflight — 2026-08-13

- **Validation layer:** focused Design System Implementation DoD only; this is not Global QA,
  release, hosted, deployment, or Product-consumer acceptance.
- **Runtime:** reuse the current managed loopback `qa_fixture` runtime only after its status proves
  `healthy`, `compatible`, `artifactFreshness: fresh`, and `providerMode: qa_fixture`; do not start an
  ad hoc server or use hosted data.
- **Browser path:** use the supported non-prompting `agent-browser` path against
  `http://127.0.0.1:3000`; abandon that exact path rather than surfacing any platform prompt if it
  becomes unavailable.
- **Focused matrix:** replay the App Shell language-menu reference at 1470x801 and exact 375x812 in
  Dark and Light, including pointer/keyboard selection, Escape and trigger focus return, explicit
  reset, system/null/device mapping, containment, and console health. Prove the shared selected
  `check` indicator in the language menu, Theme preference menu, and Dropdown family reference.

## Outcome

Shared shell consumers have one typed `en`/`pt-BR` message owner and one accessible language-menu
composition. The controlled contract accepts Backend's `preference`, `resolvedLocale`, and
preference-change callback without becoming another locale-state owner.

## Backend Consumer Contract

```ts
{
  preference: "system" | "en" | "pt-BR" | null;
  resolvedLocale: "en" | "pt-BR";
  preferenceContractViolation:
    | "invalid_stored_ui_locale_preference"
    | null;
}
```

`null` represents an absent/invalid legacy readback and must be presented as system-derived rather
than as a fourth supported language choice. Invalid values never enter the primary picker.

## Product Decisions

- The interface supports English (`en`) and Brazilian Portuguese (`pt-BR`).
- The persisted profile default is `system`; it follows the request/device language and is not a
  third primary language option.
- The primary picker offers only English and Portuguese (Brazil).
- System-derived state displays the factual current language. After an explicit override, a compact
  action restores device-language behavior.
- The first real manual consumer will be the authenticated AppShell. Anonymous surfaces remain
  system-resolved initially.

## Scope And Existing Seams

- Reuse the Backend `UiLocalePreference` and `UiLocaleResolution` contract from `src/lib/ui-locale.ts`.
- Reuse existing Hito dropdown/radio/menu, Icon, Button, focus, motion, and shell-menu contracts.
- Reuse the current `/hitoDS` reference as a controlled composition proof only.

## New-Artifact Budget

One narrowly-scoped typed static catalog owner and one prop-driven language-menu composition are
permitted only if existing owners cannot carry their distinct responsibilities. The preflight must
state the exact owner selected and why no existing catalog/menu owner is canonical. Do not add an
i18n framework, generated registry, translation service, client store, a generic preference system,
or parallel formatter layer.

## Preserved Boundaries

- Root SSR, `<html lang>`, document metadata, hydration, settings saving, AppShell route adoption,
  anonymous/manual behavior, and actual document-language changes belong to a later FRONTEND Product
  slice.
- Do not translate user-authored, imported, persisted, or existing AI-authored content.
- Do not change Product, Marketing, DevTools, formatter consumers, Changelog timeline, AI/provider
  prompts, persistence, migrations, Back-end code, Figma, hosted state, or Git lifecycle.
- Do not modify the completed Header Search/App Shell source except where the new controlled DS
  reference or shared menu composition demonstrably needs its existing menu slot.

## Root-Cause And Consistency Requirement

Inline English strings have no shared typed message owner, while the Back-end now has one canonical
locale result. Do not patch individual components with locale conditionals. Establish a single
typed catalog seam and reuse it consistently within this admitted shared namespace. If a required
text lies outside this namespace, return its owner to PRODUCT rather than duplicating it.

## Definition Of Done

- The first shared namespace has exact `en` and `pt-BR` typed parity, without implicit fallback.
- The language-menu composition takes server-shaped locale props and has no persistence, local
  storage, ambient `navigator.language`, or hidden locale state.
- It provides named/keyboard-accessible English and Portuguese choices, correct selected state,
  truthful system-derived status, and a keyboard-accessible return-to-device-language action for an
  explicit override.
- Existing menu focus, Escape, trigger-return, pointer, touch, and responsive containment contracts
  remain intact.
- `/hitoDS` proves the controlled states without pretending to save a real profile or switch the
  document locale.

## Validation Inventory

| Check              | Scenario                                                                               | Required result                                           |
| ------------------ | -------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Contract mapping   | Backend outputs: `system`, `en`, `pt-BR`, null/invalid readback                        | Correct primary options and factual system/override state |
| Catalog parity     | Typed `en` and `pt-BR` shared namespace                                                | No missing/implicit entry or duplicate owner              |
| Interaction        | Pointer, keyboard radio selection, Escape, trigger focus return, reset action          | Existing menu contract remains accessible and controlled  |
| Browser            | `/hitoDS`, Light/Dark, 1470×801 and exact 375×812                                      | Correct labels, no overflow, no console error             |
| Static/build       | Focused formatter/lint, DS validation where applicable, production build, diff hygiene | Clean task-owned output                                   |
| Independent review | COPY wording and/or DESIGNER/QA review only when it adds material independent evidence | Exact scoped conclusion; no overlapping implementation    |

## Stop Conditions

Return to PRODUCT before continuing if backend output cannot be consumed without root SSR work, if a
product route must persist/select language, if words beyond the shared namespace need a copy
decision, if a formatter requires Product data ownership, or if a new generic i18n framework/store
appears necessary.

## Next Recommended Role

PRODUCT

## Handoff Prompt

```text
ROLE: DESIGN SYSTEM

Task: Hito DS Shared Locale Catalog And Language Menu Contract
Mode: Tracked implementation
Canonical item: docs/tasks/backlog/2026-08-13-hito-ds-shared-locale-catalog-and-language-menu-contract.md
Depends on: docs/tasks/backlog/2026-08-13-hito-ui-locale-profile-preference-and-server-resolution.md
Evidence: docs/tasks/backlog/2026-08-13-hito-ui-locale-and-brazilian-portuguese-contract-discovery.md

Read AGENTS.md, agents/design-system.agent.md, skills/hito-frontend-design-system/SKILL.md, the
Backend receipt, and this canonical item before work. Run a Tracked preflight. Preserve unrelated
dirty work byte-for-byte.

Implement only the shared DS locale foundation: the smallest typed static `en`/`pt-BR` message
catalog for the first shared shell/language namespace and an accessible, controlled language-menu
composition using existing Hito dropdown/radio/menu, Button, Icon, motion, focus, and shell-menu
contracts.

The composition consumes Backend-shaped inputs:
`preference: system | en | pt-BR | null`, `resolvedLocale: en | pt-BR`, and a preference-change
callback. The two primary choices are English and Portuguese (Brazil). Do not render `system` as a
third primary language choice: for system/null state show the factual resolved device language;
after an explicit override show a compact, keyboard-accessible return-to-device-language action.
The component remains controlled. It must not persist state, use local storage or navigator language,
optimistically flip document language, or become a second locale source of truth.

Use `/hitoDS` only as a controlled reference proof. Do not wire Root SSR, `<html lang>`, hydration,
settings saving, AppShell route behavior, real locale switching, Product/Marketing/DevTools
consumers, formatter migrations, Changelog, user content, AI/provider behavior, migrations,
Back-end code, Figma, hosted state, or Git lifecycle.

Work from the root cause: replace the absence of a shared typed message/menu contract inside this
admitted namespace; do not scatter inline locale conditionals or create a generic i18n framework,
generated registry, client store, translation service, generic preference system, or parallel
formatter layer. Reuse existing DS seams before adding any artifact; if a new catalog/menu file is
required, explicitly justify its distinct canonical responsibility in the preflight.

You implement all DESIGN SYSTEM source work yourself. You may use existing named Hito roles only as
bounded, read-only evidence aids when they materially improve confidence: COPY for exact English and
pt-BR wording, DESIGNER for the menu-state/visual decision, and QA for independent final browser
review. Give each reviewer a narrow question and preservation boundary; do not delegate Design
System implementation, create a same-role writer, or use invented subagents.

Validate Backend-contract mapping, typed catalog parity, keyboard/pointer/Escape/focus-return/reset
behavior, `/hitoDS` Light/Dark at 1470×801 and exact 375×812, overflow/console health, focused
static checks, production build, and fresh managed runtime. Update only this canonical item with a
truthful English receipt. Return Root/AppShell/settings/formatter consumers to PRODUCT. Do not claim
Global QA, release, deployment, hosted acceptance, or Figma parity.
```

## Tracked Implementation Receipt — 2026-08-13

### Task, stage, and product outcome

- **Task:** Hito DS Shared Locale Catalog And Language Menu Contract.
- **Stage:** Design System Slice 2 — shared catalog and language-menu contract.
- **Outcome:** completed for the focused Design System Implementation DoD. Shared shell consumers
  now have one typed `en` / `pt-BR` message owner and one controlled language-menu composition that
  consumes the Backend-shaped preference and resolved-locale values without persistence or ambient
  browser-language ownership.

### Demonstrated root cause and source hierarchy

- Backend already owned the closed `system | en | pt-BR | null` readback and resolved `en | pt-BR`
  contract, but Design System had no typed shared message namespace or reusable controlled menu.
- `ThemePreferenceMenuItems` was not reused as a locale owner because it owns a browser-backed theme
  hook. The locale composition instead reuses only its existing menu presentation roles while its
  state remains prop-driven.
- Direct Product correction moved the selected radio visual from `circle` to the existing `check`
  at `DropdownMenuRadioItem`, the first shared owner. The Theme menu, Dropdown family reference, and
  language menu now inherit one indicator without locale-specific presentation.

### Files changed

- `src/lib/ui-locale-messages.ts` — added the sole typed first shared shell/language message
  namespace with exact `en` / `pt-BR` parity and no fallback.
- `src/components/ui/hito-language-menu.tsx` — added the sole controlled language-menu composition;
  it renders two primary language radios, factual device/explicit status, and an explicit-only reset
  callback to `system`.
- `src/components/ui/dropdown-menu.tsx` — changed only the shared radio selected indicator from the
  existing `circle` glyph to the existing `check` glyph.
- `src/components/hito-ds/reference-components-structure.tsx` — added controlled App Shell reference
  inputs for preference and device result and rendered the new menu in the contained shell. Existing
  unrelated App Shell hunks were preserved.
- `docs/tasks/backlog/2026-08-13-hito-ds-shared-locale-catalog-and-language-menu-contract.md` —
  recorded the preflight, browser path, Product correction, and this receipt.

No CSS, token, registry, generated manifest, persistence path, locale store, formatter, Product
consumer, compatibility layer, or additional runtime artifact was added.

### Validation inventory

| Check                         | Scenario / environment                                               | Result           | Evidence                                                                                                                                                                                       |
| ----------------------------- | -------------------------------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend mapping               | `system`, `en`, `pt-BR`, and null reference states                   | Passed           | System/null produced exactly two unchecked language radios plus factual device result; explicit values produced one selected language plus reset.                                              |
| Catalog parity                | Typed `en` and `pt-BR` namespace and nested locale maps              | Passed           | Focused `node --import tsx` assertion proved exact top-level, option, device-status, and explicit-status key parity.                                                                           |
| Ownership safety              | New catalog/menu source                                              | Passed           | Source search found no `navigator`, `localStorage`, `sessionStorage`, `document`, `window`, or persistence code; the component only derives output from props.                                 |
| Pointer and keyboard          | App Shell language menu                                              | Passed           | Pointer selected Portuguese; physical ArrowDown/Enter selected a radio; End/Enter activated reset; Escape closed the menu and returned visible focus to the trigger.                           |
| Shared radio indicator        | Language, Theme, and Dropdown family menus                           | Passed           | Every selected radio rendered the existing Tabler `check` path `M5 12l5 5l10 -10`; Radix roles and checked state remained intact.                                                              |
| Document/persistence boundary | Explicit selection, route leave/return                               | Passed           | `<html lang>` remained `en`; returning to the reference restored controlled demo defaults `system` / `en` with no persisted locale.                                                            |
| Browser matrix                | `/hitoDS/patterns#app-shell`, 1470x801 and exact 375x812, Dark/Light | Passed           | Labels/status were correct, portal menus remained inside the viewport, horizontal overflow was zero, and console/errors output was empty.                                                      |
| Visual evidence               | Managed `qa_fixture` screenshots                                     | Passed           | `qa-artifacts/screenshots/2026-08-13/hito-ds-locale-menu/` contains the four App Shell cells and focused mobile menu states.                                                                   |
| Formatting/lint               | Focused Prettier and ESLint                                          | Passed           | All task-owned runtime files and this receipt matched Prettier; focused ESLint exited zero.                                                                                                    |
| Manifest parity               | Existing generator check mode                                        | Passed           | `primitiveColors=43`, `semanticColors=41`, `textStyles=14`.                                                                                                                                    |
| Diff hygiene                  | Repository `git diff --check`                                        | Passed           | No whitespace errors.                                                                                                                                                                          |
| Production build/runtime      | `npm run local:fixture`                                              | Passed           | Production client/SSR/Nitro build completed; managed loopback runtime restarted healthy, compatible, `qa_fixture`, and `artifactFreshness: fresh`; post-rebuild smoke passed.                  |
| Full DS validator             | `npm run validate-hito-ds-components`                                | External failure | The only failure is the pre-existing Brand/favicon on-light/on-dark assertion. No locale, menu, App Shell, manifest, or radio-indicator assertion failed; this task did not modify that owner. |

### Review, preserved boundaries, and next owner

- A bounded read-only COPY review approved stable autonyms, device-language terminology, factual
  device/explicit status, and the reset wording. It made no source edits.
- Root SSR, `<html lang>`, hydration, authenticated AppShell/settings persistence, formatter
  migrations, Product/Marketing/DevTools consumers, and real locale switching remain excluded and
  return to **PRODUCT** for separate owner routing.
- The unrelated Brand validator invariant remains outside this slice. This receipt does not claim
  Global QA, release readiness, deployment, hosted acceptance, Figma parity, or Product adoption.

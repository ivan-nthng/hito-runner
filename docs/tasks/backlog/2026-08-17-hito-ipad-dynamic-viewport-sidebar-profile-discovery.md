# Hito iPad Dynamic Viewport Sidebar Profile Discovery

## Work Item ID

a4701eb1-cab1-4eba-8b24-8781bc57b597

## Status

completed

## Type

Bug — responsive shell discovery

## Priority

high

## Owner

FRONTEND

## Frontend Lane

Product

## Parent

[Runner Core Roadmap](../../plans/active/2026-08-15-hito-runner-product-readiness-and-progressive-materialization-roadmap.md)

## Scope

Determine the correct persistent-sidebar behavior for iPad Safari/Chrome dynamic viewport changes.
The runner account control must not depend on page scrolling or browser-chrome collapse to become
reachable when the persistent sidebar is selected at the `md` breakpoint.

## Archive Intent

Retain through one accepted responsive-shell decision and the resulting FRONTEND Product fix, then
compact to the viewport model, sidebar-zone hierarchy, and supported-device acceptance.

## Task

Define an implementation-ready responsive-shell contract for iPad portrait and landscape. Decide
which sidebar zones remain always visible, which single zone may scroll internally when height is
constrained, and when the shell must switch to the existing mobile navigation instead of presenting
a clipped desktop sidebar. The decision must work while Safari/Chrome browser chrome expands or
collapses, without reserving phantom page space.

## User Evidence

The supplied iPad screenshots show the account/profile control absent at the top of the Calendar
view, then appearing only after a downward swipe when browser chrome collapses. The runner should
not need that gesture to access the account control.

## Demonstrated Source Discriminator

`src/components/AppShell.tsx` renders the persistent sidebar at `md` with
`md:sticky md:top-0 md:flex md:h-screen`. Its brand and navigation occupy ordinary-flow sections,
while the calendar note, account trigger, and optional sign-in action form a lower `mt-auto` block.
The sidebar has no bounded internal scroll region. This establishes the current geometry seam; it
does not yet prove whether dynamic viewport sizing, shell-zone hierarchy, or the iPad breakpoint is
the correct first implementation owner.

## Required Design Decision

- Give one recommended shell model for iPad portrait and landscape, with explicit behavior at short
  visual viewport heights and while browser chrome changes size.
- Keep account access continuously reachable. Do not make page scroll, browser-chrome collapse, or
  a hidden overflow region the only way to reach it.
- State whether brand, navigation, Calendar note, account trigger, and preview sign-in are fixed,
  scrollable, condensed, or moved at each applicable responsive state.
- Reuse current Hito shell/navigation/account components and existing mobile navigation; identify
  any actual Design System gap rather than inventing a parallel sidebar pattern.
- Specify safe-area, keyboard/focus, route-change, long-name, note-present/note-dismissed, and
  reduced-height states. Do not infer a new product feature or change runner/calendar truth.

## What Not To Touch

No runtime source, CSS, breakpoint, component, DS primitive, fixture, browser session, Backend,
auth, persistence, Calendar behavior, provider, hosted state, dependency, Figma, Git lifecycle, or
release action is authorized in this discovery stage. Do not treat responsive Chromium emulation as
proof of iPad Safari behavior.

## Validation Expectations

Inspect the existing AppShell and canonical shell CSS. Research current platform guidance for
dynamic viewport units and safe-area handling from primary browser/web-platform sources. Return a
bounded recommendation, state matrix, first implementation owner/seam, non-goals, rollback, and
the smallest acceptance matrix including real iPad Safari/Chrome evidence. Preserve all source
hashes; run only documentation hygiene appropriate to this discovery.

## Stage

FRONTEND Product responsive-shell implementation completed

## Next Recommended Role

PRODUCT

## Blocker

None for the Frontend Product implementation slice. Real-device iPad Safari and Chrome acceptance
remains a separate device gate and is not inferred from local Chromium emulation.

## Frontend Product Execution Preflight — 2026-08-17

- **Mode and owner:** Tracked FRONTEND implementation in the authenticated Product App Shell.
- **Demonstrated cause:** the persistent rail still uses width-only `md` visibility and
  `h-screen`/`100vh`; its optional note, profile trigger, and Preview sign-in share one unbounded
  lower `mt-auto` column. This is the accepted source-backed cause for the supplied dynamic-browser-
  chrome symptom.
- **Existing seam reused:** `src/components/AppShell.tsx`, its existing sidebar/nav/profile/menu,
  existing mobile topbar/navigation, Tailwind composition utilities, and current safe-area
  treatment.
- **Smallest behavior change:** express the accepted combined `48rem` inline and `32rem` block
  eligibility with existing arbitrary media variants; give the persistent aside a `100vh` fallback
  and supported `100dvh` override; keep brand/navigation fixed; move only the optional note into a
  bounded flexible scroll region; keep account and Preview sign-in in a fixed footer.
- **New runtime artifacts:** none. No hook, viewport store, component, helper, CSS recipe, token,
  breakpoint, device detector, dependency, fixture, Backend path, or compatibility layer is
  proposed.
- **Superseded responsibility:** remove the width-only desktop/mobile visibility assumption and the
  single lower `mt-auto` block after the fixed-zone replacement is active. No parallel shell path
  remains.
- **Dirty boundary:** preserve the accepted language-menu adoption, standalone Calendar copy,
  account/menu behavior, and every unrelated `AppShell` hunk byte-for-byte. Shared shell CSS,
  Design System source, routes, Backend, auth, fixtures, and unrelated dirty paths are read-only.
- **Focused proof:** source/class discriminator; build-generated media and dynamic-height rules;
  authenticated and Preview desktop/mobile mode exclusivity; normal and sub-`32rem` heights;
  fixed footer and auxiliary scroll ownership; note lifecycle; long labels; account-menu focus;
  1470x801, 1024x768, 768x1024, 375x812, and short-height responsive containment in Light/Dark;
  console, formatting, lint, Product checks, build, and diff hygiene. Real iPad Safari/Chrome remains
  the separate device gate and will not be inferred from local Chromium emulation.

## Designer Discovery Receipt — 2026-08-17

### Outcome And Root Cause

Accept a dynamic-height, zoned persistent sidebar with one bounded auxiliary scroll region and an
existing-mobile-shell fallback at genuinely short dimensions.

The visible symptom is source-consistent with the current height contract: the sidebar uses
`h-screen`/`100vh`, while default `vh` resolves like the large viewport. Browser UI can therefore
cover the lower portion when expanded and reveal it after collapsing. The current ordinary-flow
layout makes the optional note, profile trigger, and preview sign-in compete for the same unbounded
column height. User evidence proves the iPad symptom; real-device computed geometry remains the
required implementation acceptance artifact.

The first incorrect owner is FRONTEND Product in `src/components/AppShell.tsx`, specifically the
persistent aside height, its lower `mt-auto` group, and the width-only desktop/mobile visibility
classes. No shared Hito component or token defect is demonstrated.

### Current Owner Inventory

| Existing seam                   | Source fact                                                                                                | Decision                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `AppShell.tsx` persistent aside | `md:sticky md:top-0 md:flex md:h-screen`; no `min-height: 0`, bounded internal scroll, or height fallback. | Replace the viewport and zone composition in this existing owner.                         |
| Brand                           | Fixed-size ordinary-flow block.                                                                            | Always visible in persistent mode.                                                        |
| Primary nav                     | Two current destinations in `hito-shell-nav`.                                                              | Always visible in persistent mode; do not put it in the scroll well.                      |
| Calendar/Preview note           | Optional, dismissible, and currently shares the footer group.                                              | Move into the single flexible auxiliary scroll well.                                      |
| Profile/account trigger         | Existing shared dropdown trigger with truncated visible labels and full DOM text.                          | Fixed footer content in persistent mode.                                                  |
| Preview sign-in                 | Existing sidebar button and existing mobile-nav destination.                                               | Fixed with the persistent footer; retain the existing mobile destination in compact mode. |
| Mobile shell                    | Existing topbar profile/settings and Connections actions plus `hito-shell-mobile-nav`.                     | Reuse intact when width or usable height cannot support the persistent rail.              |
| Shared shell CSS                | Already owns nav/profile/mobile visual contracts and bottom safe-area padding for mobile nav.              | No new DS primitive or shared recipe is required.                                         |
| Root viewport meta              | `width=device-width, initial-scale=1`; no edge-to-edge `viewport-fit=cover` policy.                        | Do not change it in this task. This is not an edge-to-edge redesign.                      |

### Primary Platform Guidance

- [CSS Values and Units Level 4](https://drafts.csswg.org/css-values-4/#viewport-variants)
  defines default/large viewport units as the state with retractable browser UI hidden, warns that
  expanded UI can obscure that content, and defines `dvh` against the current dynamic viewport.
  It also states that on-screen keyboards may overlay without changing viewport units.
- [WebKit: Safari 15.4 viewport units](https://webkit.org/blog/12445/new-webkit-features-in-safari-15-4/)
  confirms `100dvh` changes with Safari's dynamic viewport.
- [Chrome/web.dev viewport-unit guidance](https://web.dev/blog/viewport-units) documents the same
  `100vh` initial-load overflow and the interoperable `dvh` model used by Chrome.
- [WebKit safe-area guidance](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)
  recommends combining normal spacing with `env(safe-area-inset-*)` through `max()`, rather than
  replacing ordinary padding with the inset.

This evidence supports CSS dynamic viewport sizing plus safe padding. It does not support device
sniffing, a JavaScript `visualViewport` height store, or making the entire rail scroll.

### Models Compared

| Model                                                               | Benefit                                                                                                              | Failure                                                                                                        | Decision    |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------- |
| `100svh` fixed rail with existing flow                              | Fits when browser chrome is fully expanded.                                                                          | Leaves phantom space after chrome retracts and still lets note/profile content overflow the column.            | Reject.     |
| `100dvh` with brand/nav/footer fixed and one auxiliary scroll well  | Tracks steady-state browser chrome, preserves account access, and contains only the optional content that may yield. | Requires the current lower block to be split into explicit zones.                                              | **Accept.** |
| Entire `100dvh` sidebar scrolls, or all iPads always use mobile nav | Smallest structural change.                                                                                          | Account can scroll away, or useful iPad width is discarded; neither establishes a stable Hito shell hierarchy. | Reject.     |

### Accepted Shell Contract

#### Persistent-Mode Eligibility

Use the persistent sidebar only when both conditions are true:

- viewport inline size is at least the existing `md` boundary (`48rem`); and
- viewport block size is at least `32rem`.

The `32rem` floor is below normal iPad portrait/landscape browser heights and is derived from the
current fixed content budget: brand, two primary destinations, worst-case preview footer, safe
padding, and a usable auxiliary remainder. It prevents a desktop rail from surviving in a shallow
Stage Manager/resized or keyboard-reduced layout merely because width still exceeds `md`.

Browser-chrome expansion/collapse at normal iPad dimensions must not toggle shell mode. It only
changes the persistent rail's dynamic height. If a tested device oscillates across the height floor
during ordinary toolbar motion, implementation stops; do not compensate with user-agent rules.

#### Persistent Geometry

The aside remains sticky at the top and uses a `100vh` fallback followed by `100dvh`, with
`overflow: hidden`, `min-height: 0`, and border-box sizing. Its content is four existing zones:

1. **Brand zone — fixed:** Hito logo and mode kicker; safe top/start padding; no condensation.
2. **Primary-navigation zone — fixed:** Calendar and Progress; current targets, labels, active
   state, focus ring, and navigation semantics remain unchanged.
3. **Auxiliary zone — the only scrollable zone:** `min-height: 0`, flexible remainder, and
   `overflow-y: auto`; contains the optional Calendar/Preview note. It must not capture horizontal
   scrolling, create body overflow, or require scrolling when its content fits.
4. **Account footer — fixed:** current profile trigger and, in Preview, current sign-in button. It
   must never be inside the auxiliary scroll region.

Apply existing spacing together with safe areas: top/start brand padding and footer bottom/end
padding use `max(existing-space, env(safe-area-inset-*))` semantics. Do not add
`viewport-fit=cover`; when an inset resolves to zero, existing spacing remains.

The profile trigger keeps its current single-line truncation. Long visible names/details must not
increase footer height; their full accessible text remains in the DOM and the opened account menu.

#### Compact Fallback

When inline size is below `48rem` **or** block size is below `32rem`, hide the persistent aside and
show the existing mobile shell as one coherent mode:

- the existing topbar retains Hito identity, Connections, and authenticated profile/settings
  access;
- the existing bottom navigation retains Calendar, Progress, and Preview sign-in;
- its existing `safe-area-inset-bottom` treatment remains canonical; and
- the optional sidebar note remains absent, matching current mobile behavior rather than being
  copied into a second navigation system.

Do not render desktop and mobile navigation concurrently to solve clipping. There must be one
visible navigation mode and one active tab order.

### State And Interaction Matrix

| State                                          | Required behavior                                                                                                                                                                                                                                                                                |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| iPad portrait, normal height                   | Persistent mode. Brand, nav, and account footer remain visible while the auxiliary note zone expands or scrolls.                                                                                                                                                                                 |
| iPad landscape, normal height                  | Same hierarchy; browser toolbar changes resize `100dvh` without exposing background below or clipping the footer.                                                                                                                                                                                |
| Browser chrome expanded → collapsed → expanded | Profile/footer bounding box remains inside the visual viewport at every settled state; no page scroll or swipe is required to reveal it.                                                                                                                                                         |
| Note present                                   | Note starts at the top of the auxiliary zone. Only that zone may scroll when necessary; its dismiss action remains reachable.                                                                                                                                                                    |
| Note dismissed                                 | Auxiliary content collapses without moving brand/nav/footer or leaving reserved note height.                                                                                                                                                                                                     |
| Authenticated/onboarding account               | Current profile trigger remains fixed; settings, theme, language when available, integrations, and sign-out menu content remain unchanged.                                                                                                                                                       |
| Preview                                        | Guest profile trigger and Preview sign-in remain fixed together; neither can be displaced by the note.                                                                                                                                                                                           |
| Long account name/detail                       | Visual lines truncate without wrapping; button accessible name and opened-menu readback remain complete.                                                                                                                                                                                         |
| Route change                                   | Fixed navigation keeps the active destination visible. Do not reset body scroll, steal focus, or programmatically scroll the auxiliary zone.                                                                                                                                                     |
| Keyboard opens on a route form                 | Do not animate shell mode or move focus. If the browser produces a steady-state viewport resize, the CSS policy applies. If the keyboard overlays without changing viewport units, the focused form remains primary; after blur/dismiss, the footer must return immediately without page scroll. |
| Keyboard discriminator failure                 | If real iPad evidence shows the account remains inaccessible after keyboard dismissal, or normal focus creates persistent clipping, stop and return to PRODUCT. Do not add a local `visualViewport` state/listener workaround.                                                                   |
| Reduced height below `32rem`                   | Existing mobile shell replaces the rail; account/settings and Preview sign-in remain reachable through existing compact owners.                                                                                                                                                                  |
| Reduced motion                                 | No viewport-height transition, sidebar slide, or zone animation is introduced. Browser-driven size changes settle without authored motion.                                                                                                                                                       |

### Smallest Implementation Boundary

First implementation owner: **FRONTEND, Product lane**.

Exact seam: `src/components/AppShell.tsx` only, provided the existing utility pipeline can express
the combined width/height visibility conditions.

The implementation should:

1. replace `md:h-screen` with fallback-plus-dynamic viewport sizing;
2. split the existing lower `mt-auto` group so the note occupies the flexible scroll well and the
   profile/Preview sign-in occupy a non-scrolling footer;
3. make desktop and existing mobile visibility respond to the accepted width-and-height profile;
4. preserve every existing Hito logo, nav row, profile dropdown, button, mobile-nav, route, auth,
   copy, and state owner; and
5. delete the superseded width-only/full-height assumptions from this AppShell seam rather than
   leaving two active geometry paths.

Proposed new runtime artifacts: **none**. No hook, viewport store, utility file, token, component,
CSS recipe, or compatibility path is admitted. If existing AppShell utilities cannot express the
contract without a shared CSS/primitive change, stop and return to PRODUCT for an explicit DESIGN
SYSTEM boundary; do not add route-local CSS.

### Non-Goals And Rollback

Non-goals: mobile-nav redesign, additional destinations, note copy/state persistence, auth or
account-menu behavior, Calendar layout, root viewport-meta changes, edge-to-edge mode, PWA policy,
Admin/Hito DS shell changes, JavaScript viewport measurement, Browser/OS detection, Figma, and any
Backend or hosted work.

Rollback is one-owner and behavior-preserving: restore the prior AppShell aside/mobile visibility
classes and merge the auxiliary/footer markup back into the previous lower group. No schema, data,
token, shared primitive, or route contract is involved. Roll back immediately if dynamic resizing
causes mode oscillation, duplicate navigation, focus loss, persistent body overflow, or a footer
outside the settled visual viewport.

### Real-iPad Acceptance Matrix

This matrix is mandatory after implementation. Responsive desktop emulation may support debugging
but cannot satisfy the iPad evidence rows.

| Check              | Real environment and state                                                                                                                                           | Required observation / evidence                                                                                                                                                                     |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Initial portrait   | iPad Safari and iPad Chrome; browser chrome expanded; Calendar; note present; authenticated                                                                          | Profile trigger is fully visible at `scrollY = 0`; its rect is inside `visualViewport.offsetTop … offsetTop + height`; no gesture or page scroll. Record viewport and element rect plus screenshot. |
| Dynamic portrait   | Same browsers; collapse and re-expand browser chrome                                                                                                                 | Sidebar follows each settled visual height; profile remains visible; no blank strip, body-width shift, or navigation-mode oscillation.                                                              |
| Initial landscape  | iPad Safari and Chrome; chrome expanded; note present; authenticated                                                                                                 | Persistent rail remains selected at normal height and the footer is fully visible above browser UI/safe area.                                                                                       |
| Dynamic landscape  | Same; collapse/re-expand chrome and rotate portrait ↔ landscape                                                                                                      | One navigation mode at a time; no clipped footer, stale height, duplicate focus targets, or required body scroll.                                                                                   |
| Auxiliary overflow | Both browsers; largest text size used by the browser; note present; long account name/detail                                                                         | Only the note zone scrolls. Brand, primary nav, profile, and sign-in remain fixed; full account text remains accessible.                                                                            |
| Note lifecycle     | Both browsers; dismiss note, change Calendar/Progress routes                                                                                                         | Fixed zones do not move; active destination remains visible; route change does not restore clipping or steal focus.                                                                                 |
| Preview            | Both browsers and orientations; Preview mode; note present                                                                                                           | Guest account trigger and Sign in remain reachable; short height uses existing mobile Sign in.                                                                                                      |
| Account menu       | Both browsers; open by touch and external keyboard; traverse and close                                                                                               | Menu collision handling remains inside the visual viewport; trigger focus returns; no menu item is lost behind browser chrome.                                                                      |
| Software keyboard  | Both browsers; focus a route field, dismiss keyboard, then activate account access                                                                                   | Focused field is not displaced by authored mode animation. After dismissal, account access is immediately visible without page scrolling. Persistent clipping is a failed gate.                     |
| Width fallback     | Real iPad Split View narrow enough to fall below `48rem`                                                                                                             | Existing topbar/mobile nav replaces the rail; account/settings, Calendar, Progress, and Preview sign-in remain reachable; desktop rail is absent from tab order.                                    |
| Height fallback    | Real resizable/Stage Manager state below `32rem` when supported; otherwise retain as an explicit real-device coverage gap and prove source/local behavior separately | Existing mobile shell replaces the rail with no duplicate landmarks or clipped action. Do not claim this row from Chromium emulation alone.                                                         |
| Safe area          | Both orientations and any device state exposing non-zero inset                                                                                                       | Existing spacing is the minimum; important controls stay inside the safe area without double padding.                                                                                               |
| Console and layout | All rows                                                                                                                                                             | No console errors, hydration warnings, unexpected body horizontal scroll, or viewport-listener leak; no runtime viewport listener should exist.                                                     |

### Discovery Validation And Remaining Evidence

- Inspected the complete `AppShell.tsx`, current dirty diff, shared shell CSS, existing mobile nav,
  contained `/hitoDS` App Shell example, root viewport meta, and current safe-area consumers.
- Opened the CSSWG, WebKit, and Chrome/web.dev sources above on 2026-08-17.
- Preserved the pre-write SHA-256 snapshot of every inspected runtime owner. Only this canonical
  backlog item changed.
- Did not run browser, real-iPad, build, typecheck, runtime, hosted, Figma, Global QA, or release
  validation. Those omissions mean this receipt is a design/ownership decision, not defect closure.
- No subagent was used; the source and platform discriminator were bounded and directly available.
- Next owner remains PRODUCT, which may accept and dispatch the single FRONTEND Product slice. No
  DESIGN SYSTEM, Backend, second Frontend lane, or product-policy change is currently required.

## Tracked Frontend Product Implementation Receipt — 2026-08-17

### Outcome And Demonstrated Cause

The authenticated Product shell now uses the accepted dynamic-height, zoned sidebar contract. The
persistent rail has a `100vh` fallback and a supported `100dvh` override, sticky border-box
geometry, `min-height: 0`, and hidden outer overflow. Brand and primary navigation are fixed zones;
only the optional Calendar/Preview note occupies the flexible internal `overflow-y: auto` zone;
the profile/Preview sign-in footer is fixed outside that zone. The same existing mobile topbar and
bottom navigation replace the rail when either width is below `48rem` or height is below `32rem`.

The accepted first incorrect owner was confirmed in `AppShell.tsx`: width-only `md` visibility,
`h-screen` as the sole rail height, and one lower `mt-auto` block allowed optional note content to
compete with account access. The implementation removes those three assumptions without adding a
second shell, JavaScript viewport state, or shared Design System work.

### Files Inspected And Changed

- Changed `src/components/AppShell.tsx` only at the existing Product shell composition seam.
- Changed this canonical lifecycle and evidence record.
- Inspected the current AppShell dirty diff and preserved existing language, Calendar copy,
  account-menu, auth, navigation, and other unrelated hunks byte-for-byte.
- Inspected the generated runtime CSS to verify the `48rem` plus `32rem` media contract, `100vh`
  fallback, `100dvh` support override, and safe-area padding composition.

New production runtime artifacts: **none**. No file, component, hook, viewport store, detector,
stylesheet, token, primitive, dependency, fixture path, Backend path, or compatibility layer was
added. The obsolete width-only desktop/mobile eligibility and the combined lower `mt-auto` block
were removed from the active shell composition.

### Validation

| Check                                              | Scenario / environment                                | Result                                      | Evidence                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Canonical source owner                             | Current `AppShell.tsx`                                | Passed                                      | One aside owns `h-screen`, `supports-[height:100dvh]:h-dvh`, sticky combined width/height media eligibility, `min-h-0`, border-box, and hidden overflow. No `visualViewport`, `innerHeight`, `matchMedia`, user-agent, device-sniffing, old width-only `md` visibility, or `mt-auto` shell path remains.                                                                                        |
| Built responsive contract                          | Fresh managed production artifact                     | Passed                                      | Generated CSS contains the combined `@media (min-width:48rem) and (min-height:32rem)` rules, `height:100vh`, and `@supports (height:100dvh){height:100dvh}`.                                                                                                                                                                                                                                    |
| Persistent desktop/iPad-class geometry             | Chromium, Dark, 1470x801, 1024x768, and 768x1024      | Passed                                      | Aside was visible, sticky, border-box, `overflow:hidden`, `min-height:0`, and exactly 801/768/1024px tall. Profile bottom stayed 16px above each visual viewport bottom; mobile nav was absent; document width equaled viewport width.                                                                                                                                                          |
| Dynamic-height and exact block threshold           | Chromium, Dark, 1024x520, 1024x512, and 1024x511      | Passed locally                              | At 520 and exact 512px the rail tracked the current height and the profile stayed 16px above the bottom. At 511px the rail was absent and the existing 60px mobile nav was the sole bottom navigation. This is local emulation evidence, not real Stage Manager acceptance.                                                                                                                     |
| Exact inline threshold and mobile preservation     | Chromium, Dark, 768x1024, 767x1024, and 375x812       | Passed                                      | Persistent mode existed at 768px. At 767px and 375px only the existing mobile shell rendered; page width equaled viewport width and there was no horizontal overflow.                                                                                                                                                                                                                           |
| Sidebar zone ownership                             | Chromium, Dark, 768x1024 and 1024x520                 | Passed                                      | Brand and nav computed `flex: 0 0 auto`; the auxiliary zone computed `flex: 1 1 0%`, `min-height:0`, `overflow-x:hidden`, and `overflow-y:auto`; the account footer computed `flex: 0 0 auto`.                                                                                                                                                                                                  |
| Note lifecycle and route change                    | Calendar note present/dismissed; Calendar to Progress | Passed                                      | Dismiss removed the note while every zone and profile rectangle remained identical. Progress became `aria-current=page`; the rail remained sticky and the profile stayed visible at the same fixed-footer geometry. A document reload truthfully restores the existing in-memory note, unchanged from prior behavior.                                                                           |
| Account menu and focus                             | 1024x520, pointer open plus keyboard reopen/Escape    | Passed                                      | The open menu stayed within y=0…438 of the 520px viewport. Native Enter opened it; Escape closed it and returned focus to the exact profile trigger. Existing menu content and actions were unchanged.                                                                                                                                                                                          |
| Themes, truncation, and safe spacing               | Light/Dark desktop and 375x812 mobile                 | Passed with source-bound safe-area evidence | Both themes preserved mode exclusivity and containment. Profile lines computed `white-space:nowrap`, `overflow:hidden`, `text-overflow:ellipsis`, and a zero-min-width owner. Built/source composition retains existing spacing through `max(existing-space, env(safe-area-inset-*));` the local emulator exposed zero insets.                                                                  |
| Browser console                                    | Full focused replay                                   | Passed                                      | Final warning/error log snapshot was empty.                                                                                                                                                                                                                                                                                                                                                     |
| Formatting, lint, Product checks, and diff hygiene | Touched source/item and current checkout              | Passed                                      | Focused Prettier, focused ESLint, `npm run validate-product-contracts`, and `git diff --check` passed.                                                                                                                                                                                                                                                                                          |
| Type diagnostics                                   | Checkout-wide TypeScript filtered to AppShell         | Passed with checkout note                   | No new responsive-shell diagnostic was introduced. Existing untouched `/login` search-prop diagnostics remain on unrelated AppShell lines.                                                                                                                                                                                                                                                      |
| Production build and fresh admission               | Canonical managed `qa_fixture` restart                | Passed                                      | Client, SSR, Nitro, postbuild, and managed start completed; PID 81084 was healthy, loopback-only, `qa_fixture`, fresh, and `receipt_matches` for browser proof. A preceding direct build compiled runtime bundles but hit the unrelated private Admin snapshot postbuild marker; the normal managed rebuild subsequently passed without a Product workaround.                                   |
| Fixture isolation and server handoff               | Post-proof cleanup                                    | Passed with external freshness drift        | `local:design-profile:reset` returned all seeded Product/activity/evidence tables to zero while retaining the disposable auth identity. PID 81084 remains healthy and running. After the receipt-matching browser evidence, freshness drifted externally to `artifact_missing` on the private Admin snapshot marker; no stale artifact was used for acceptance and no rebuild loop was started. |

### Coverage Consequences

- No physical iPad was available. Safari/Chrome browser-chrome expansion/collapse, real rotation,
  Split View/Stage Manager behavior, software-keyboard overlay, largest browser text size, and
  non-zero safe-area insets remain the explicit real-device matrix above. Chromium viewport changes
  prove the authored CSS boundary and geometry only; they are not represented as iPad acceptance.
- Authenticated mode was replayed. The unchanged Preview branches were source-reviewed in the same
  fixed auxiliary/footer and compact-shell composition, but a generated Preview identity was not
  created solely for this shell proof; Preview runtime geometry remains part of the real-device
  acceptance gate.
- Global QA, real-device acceptance, hosted, Figma, release, deployment, and production readiness
  remain unclaimed.

### Collaboration And Next Owner

- **Role file:** `agents/frontend.agent.md`
- **Project skills used:** `skills/hito-frontend-design-system/SKILL.md` and
  `skills/hito-qa-browser-regression/SKILL.md`
- **Additional browser procedure:** installed in-app Browser control skill for the focused local
  responsive replay.
- **Subagent:** none; implementation and focused evidence stayed inside one Product shell owner.
- **Next owner:** PRODUCT, to route the retained physical iPad Safari/Chrome device gate when a real
  device is available.
- **Blockers:** none for the Frontend Product implementation slice.

## Exact Handoff Prompt

```text
ROLE: PRODUCT

Review the completed Frontend Product responsive-shell receipt in
docs/tasks/backlog/2026-08-17-hito-ipad-dynamic-viewport-sidebar-profile-discovery.md. The authored
AppShell contract and focused local Chromium matrix are complete. Retain and route the documented
physical iPad Safari/Chrome matrix as a separate device acceptance gate when a real device is
available. Do not infer Global QA, hosted, release, deployment, or real-iPad acceptance from this
implementation receipt.
```

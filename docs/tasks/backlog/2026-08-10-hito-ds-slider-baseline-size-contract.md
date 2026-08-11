# Hito DS Slider Baseline And Size Contract

- **Work Item ID:** `hito-ds-slider-baseline-size-contract`
- **Status:** `completed`
- **Type:** `design-system-contract`
- **Priority:** `high`
- **Owner:** `qa`
- **Scope:** `shared HitoSlider, HitoDualRange, canonical control CSS, /hitoDS, and direct consumers`
- **Archive Intent:** `retain_in_place`
- **Stage:** `Focused Implementation DoD browser verification passed`
- **Next Recommended Role:** `product`

## Task

Update the canonical single- and dual-range slider presentation and reversible
baseline behavior across Hito. Sliders must use the existing shared control
sizes and radii, expose a previous-value marker, and remain the only slider
primitives used by current product consumers.

## User Report

The supplied Figma references define a taller slider visual. A single slider
shows its prior value as a small translucent gray point; a changed value can be
restored by returning the handle to that marker. A dual range can show one
marker per handle. The rail, selected range, and markers use alpha treatment.
The user explicitly decided that sliders must have the same size scale and
corresponding radius as Hito Buttons and Inputs, and that `/hitoDS` must let a
reviewer choose those sizes. No further product details are needed.

## Evidence

- Single-value visual reference: [Figma node 7796:643](https://www.figma.com/design/RNcNPUpUgMcpeTk6UFwbn4/hito-running?node-id=7796-643&t=MVUJBxp1pi7pnBk1-1).
- Dual-range visual reference: [Figma node 7796:645](https://www.figma.com/design/RNcNPUpUgMcpeTk6UFwbn4/hito-running?node-id=7796-645&t=MVUJBxp1pi7pnBk1-1).
- [`HitoSlider`](../../../src/components/ui/hito-slider.tsx) is the canonical
  single-value primitive; [`HitoDualRange`](../../../src/components/ui/hito-dual-range.tsx)
  is the canonical ordered-range primitive.
- Both presently have bespoke geometry in
  [`controls-lists.css`](../../../src/styles/controls-lists.css), while the
  existing `xs`/`sm`/`md`/`lg` size and radius scale is owned by
  [`hito-control-contract.ts`](../../../src/components/ui/hito-control-contract.ts),
  Buttons, and Inputs.
- Direct product consumers are Completion, body notes, and Heart Rate Profile;
  `/hitoDS` already has a Slider playground and a Dual-value range specimen.

## Observed Behavior

Single and dual sliders use unrelated fixed geometry, do not expose a
reversible prior-state marker, and the DS playground does not exercise the
shared size scale or the new behavior.

## Expected Behavior

1. `HitoSlider` and `HitoDualRange` support the same `xs`/`sm`/`md`/`lg`
   control size scale as Buttons and Inputs. Their interactive geometry equals
   the selected control height and their rounding follows the selected existing
   radius contract. The Figma specimen is the `sm` (32px) presentation.
2. A single slider renders one translucent gray previous-value marker when a
   previous value is available. Activating it restores that prior value through
   the existing controlled change path.
3. A dual range renders an independent previous marker for each handle and
   restores only the selected endpoint. Its rail is translucent and the segment
   between current handles is translucent signal fill; current handles remain
   solid signal.
4. Existing product consumers supply meaningful edit-session/persisted
   baselines without creating browser persistence, backend state, or a new data
   model. A marker must be usable with pointer and keyboard, not merely drawn.
5. `/hitoDS` demonstrates single and dual sliders at every shared size plus a
   changed state and reversible marker behavior.

## Source Investigation

The shared primitives and canonical CSS are the first correct owner. Heart
Rate Profile is a direct dual-range consumer; Completion and Body Notes are
direct single-slider consumers. The defect is visual/interaction contract
drift, not Heart Rate persistence, Calendar logic, or a route-local styling
issue.

## Reuse-First Budget

Reuse `HitoSlider`, `HitoDualRange`, `HITO_FIELD_SIZES`, current controlled
callbacks, the existing control CSS, Slider playground, Dual-value reference
specimen, and Hito DS validator. Expected new production runtime artifacts:
**none**. Do not create another slider primitive, slider-specific persistence,
token family, state store, route-local CSS recipe, or Figma mapping. Prefer
deleting superseded fixed-geometry declarations and duplicate demo state.

## What Not To Touch

- Heart Rate calculation, validation, storage, RLS, settings save policy, or
  plan/workout backend truth.
- Calendar, plans, manual authoring, providers, authentication, or routing.
- Figma file mutation, code-to-Figma mappings, synchronization, or publishing;
  those belong only to DESIGN SYSTEM INTEGRATION and are not requested.
- Unrelated dirty work, hosted systems, commits, pushes, deployments, or
  release actions.

## Validation Expectations

- Focused source/contract checks prove the shared size API uses the existing
  scale and the two primitives have accessible reversible markers.
- `/hitoDS` desktop and exact 375px proof cover every size, default/changed
  single value, changed dual range, pointer restore, keyboard restore, focus,
  disabled, and no horizontal overflow.
- One Heart Rate Profile consumer proves the dual-range presentation and each
  endpoint's baseline restore without modifying its persistence.
- Run the targeted DS validator, formatting/lint/diff checks, and an
  appropriate production build. State omitted browser/runtime checks and do not
  claim Global QA.

## Implementation Receipt — 2026-08-10

- **Lifecycle:** `in_progress`; shared implementation is complete, but the
  required rendered Heart Rate consumer check remains open.
- **Root cause:** the two canonical primitives owned fixed 44/45px thin-track
  geometry and no actionable previous-value contract. Read-only Figma context
  confirmed the `sm` 32px full-height rail, solid signal handles, 6px alpha
  markers, and 44% alpha dual selection.
- **Implementation:** `HitoSlider` and `HitoDualRange` now consume
  `HitoFieldSize`, default to `sm`, expose controlled baseline restore buttons,
  and share the field height/radius scale. Completion uses its synchronized
  form baseline, Body Notes uses the modal-session baseline, and Heart Rate uses
  the existing persisted `summary.zones`; no storage or product state was added.
- **Reference:** `/hitoDS` exposes both primitive kinds, all four sizes,
  changed/restored stories, disabled/invalid states, and size/range controls.
- **New production runtime artifacts:** none. Superseded fixed geometry and the
  single-slider selected-fill recipe were removed.

| Check                       | Scenario / environment                       | Result       | Evidence                                                                                                                        |
| --------------------------- | -------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Shared DS validator         | 319 source files                             | Passed       | 2 slider kinds × 4 shared sizes                                                                                                 |
| Focused ESLint + diff check | Changed TS/TSX and task diff                 | Passed       | No findings                                                                                                                     |
| Product contract proof      | Heart-rate editor model + workout comparison | Passed       | Existing proof scripts                                                                                                          |
| Production build            | Vite client/SSR/Nitro + build integrity      | Passed       | Fresh managed QA runtime                                                                                                        |
| `/hitoDS` desktop           | Dark, 1280×720                               | Passed       | 28/32/40/44px; 4/6/8/8px radii; pointer restore; focus-visible; disabled/invalid; no overflow                                   |
| `/hitoDS` mobile            | Dark, exact 375×812                          | Passed       | `clientWidth === scrollWidth === 375`; single/dual markers visible                                                              |
| Marker keyboard restore     | Local in-app browser + Chrome                | Not observed | Semantic buttons and focus-visible passed; in-app control did not execute default Enter activation and Chrome control timed out |
| Heart Rate Product consumer | Local `/settings`                            | Not run      | Both authorized local sessions lack saved age/profile zones; creating one would mutate persistence/auth fixtures                |

- **Coverage consequence:** semantic button ownership, pointer restore, focus,
  source wiring, and the Heart Rate model contract are proven, but browser
  keyboard activation of a marker and independent rendered restore of each
  Heart Rate endpoint are not. Implementation DoD and Global QA Acceptance are
  not claimed.
- **Closure condition:** rerun the read-only Heart Rate browser scenario against
  a pre-existing authorized local profile with zones, restore each endpoint,
  then replay marker activation with a browser path that executes native button
  keyboard defaults. No Backend or route-local workaround is required.
- **Concurrent runtime note:** after evidence capture, the checkout fingerprint
  drifted on an unrelated Admin snapshot marker and the server stop command
  reclassified the process as unmanaged. The fresh build/browser evidence above
  predates that drift; no current-runtime readiness claim is made.

## Focused QA Receipt — 2026-08-10

- **Validation layer:** focused Implementation DoD verification. This is not
  Global QA Acceptance and makes no hosted, release, or deployment claim.
- **Browser path:** the built-in browser preserved semantic focus but did not
  execute native button defaults. The first Chrome claim timed out. QA exhausted
  those paths and used an existing non-prompting Safari WebDriver session for
  native keyboard proof, then an existing authenticated Chrome tab for the
  rendered Settings consumer. No browser approval, fixture, account, or runtime
  mutation was required.
- **Native marker activation:** in `/hitoDS`, the visible baseline marker was a
  focused `BUTTON` with `:focus-visible`. Native Enter restored the controlled
  single slider from `6` to baseline `4`, updated the visible label and
  `aria-valuetext`, and removed the now-redundant marker. Safari measured an
  actual `1280 x 668` viewport with document/body client and scroll widths all
  equal to `1280`.
- **Rendered Heart Rate consumer:** the existing authenticated local `Admin`
  profile exposed saved Recovery endpoints `100 / 120 BPM`. ArrowRight changed
  only the lower draft endpoint to `101`, moved `--hito-dual-range-start` from
  `28.57142857142857%` to `29.28571428571429%`, and exposed only the lower
  baseline marker. Activating that marker restored `100` while the upper value
  stayed `120`. ArrowLeft then changed only the upper draft endpoint to `119`,
  moved `--hito-dual-range-end` from `42.857142857142854%` to
  `42.142857142857146%`, and exposed only the upper marker. Activating it
  restored `120` while the lower value stayed `100`. Fresh DOM readback found
  both endpoint values and field values restored, both marker counts zero, and
  both position variables equal to their persisted baselines.
- **Persistence boundary:** all changes remained in unsaved browser draft state.
  `Save personal data` was never activated. The final rendered state matched the
  entry values before browser cleanup; no profile, zone, account, fixture,
  session, database, provider, hosted, or authentication mutation was made.

| Check                               | Scenario / environment                           | Result | Evidence                                                                                                                                                   |
| ----------------------------------- | ------------------------------------------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Browser capability exhaustion       | Built-in browser, Chrome, Safari                 | Passed | Built-in native default unavailable; first Chrome claim timed out; Safari native key path and later authenticated Chrome path completed the required proof |
| Baseline marker semantics and focus | `/hitoDS`, Safari, actual 1280 x 668             | Passed | Visible semantic `BUTTON`, expected accessible name, `:focus-visible = true`                                                                               |
| Native keyboard restore             | `/hitoDS`, Safari WebDriver Enter                | Passed | Controlled value `6 -> 4`; visible `4/10`; `aria-valuetext = Effort 4 out of 10`; marker removed                                                           |
| `/hitoDS` containment               | Safari, actual 1280 x 668                        | Passed | `innerWidth = clientWidth = scrollWidth = 1280` for document and body                                                                                      |
| Existing saved Heart Rate profile   | Authenticated local Chrome `/settings`           | Passed | Existing `Admin` profile exposed five rendered dual ranges; Recovery baseline `100 / 120 BPM`                                                              |
| Lower endpoint independent restore  | Chrome, unsaved Recovery draft                   | Passed | `100 -> 101 -> 100`; upper stayed `120`; start position `28.5714% -> 29.2857% -> 28.5714%`; lower marker appeared then disappeared                         |
| Upper endpoint independent restore  | Chrome, unsaved Recovery draft                   | Passed | `120 -> 119 -> 120`; lower stayed `100`; end position `42.8571% -> 42.1429% -> 42.8571%`; upper marker appeared then disappeared                           |
| Settings containment                | Chrome, actual 1470 x 745                        | Passed | `innerWidth = clientWidth = scrollWidth = 1470` for document and body                                                                                      |
| Persistence and runtime boundary    | Existing loopback process and browser draft only | Passed | No Save, fixture lifecycle, build, restart, provider, hosted, DB, auth, source, Git, or dependency mutation                                                |
| Evidence capture                    | Local gitignored QA artifacts                    | Passed | `qa-artifacts/screenshots/2026-08-10/hito-ds-slider-baseline-size-contract-focused-qa/`                                                                    |

- **Capability notes and omitted checks:** a post-restore Chrome reload timed out
  and is not counted as evidence; it has no coverage consequence because the
  required final DOM/value/position readback completed before that optional
  reload and no Save action occurred. Exact 375px, pointer restore,
  disabled/invalid presentation, source validators, and production build were
  not rerun because the accepted implementation receipt already passes them and
  this QA assignment was explicitly limited to the two remaining browser-only
  observations. Global QA Acceptance was not run and remains unclaimed.
- **Concurrent work:** the four slider/consumer TS/TSX owners retained their
  entry SHA-256 hashes. `controls-lists.css` was concurrently saved by the
  separate primary-button perimeter task; QA preserved it, confirmed that the
  slider selector owner remained present, and made no source edit. Browser
  evidence ran against healthy loopback PID `56569` without a QA lifecycle
  action. A final read-only status found that process stopped after evidence;
  QA did not stop, restart, repair, or use it for a broader runtime-readiness
  claim.
- **Issues:** none in the implemented slider contract.
- **Verdict: Passed. Implementation DoD: Passed. Global QA Acceptance: not run
  and not claimed.**

## Design System Rail Contrast Remediation — 2026-08-10

- **Mode and lifecycle:** Lite remediation within the existing shared slider
  contract. The work item owner, status, QA receipt, and QA verdict remain
  unchanged.
- **Root cause:** both canonical rails used a 42% alpha mix of
  `--color-muted`. That semantic is a light linen neutral in the light theme,
  so the unfilled rail became imperceptible on the light DS surface.
- **Implementation:** the single and dual rails now use the existing
  cross-theme `--color-foreground` semantic at 14% alpha. This resolves to a
  dark neutral in light mode and a light neutral in dark mode. The existing DS
  validator now asserts the declaration on both canonical rail selectors.
- **Reuse and preservation:** no runtime artifact, token, primitive, wrapper,
  consumer state, persistence, route override, or Figma work was added. Shared
  sizes/radii, solid signal handles, alpha selection and previous markers,
  controlled restoration, focus, disabled/invalid behavior, and all consumer
  wiring were left unchanged.

| Check                      | Scenario / environment                                            | Result        | Evidence                                                                                                                                                                                      |
| -------------------------- | ----------------------------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared DS validator        | 319 source files                                                  | Passed        | Both slider kinds and all four shared sizes; both canonical rails require foreground-neutral alpha                                                                                            |
| Focused static checks      | Validator ESLint, Prettier check, changed-file `git diff --check` | Passed        | No findings                                                                                                                                                                                   |
| `/hitoDS` dark rail        | Built-in browser, `/hitoDS/components#slider`                     | Passed        | Single and dual resolve to `oklch(0.96 0.005 80 / 0.14)` over the dark stage; both rails are visibly distinct in `qa-artifacts/screenshots/2026-08-10/hito-ds-slider-rail-contrast/dark.jpg`  |
| `/hitoDS` light rail       | Chrome, `/hitoDS/components#slider`                               | Passed        | Single and dual resolve to `oklch(0.18 0.01 60 / 0.14)` over the light stage; both rails are visibly distinct in `qa-artifacts/screenshots/2026-08-10/hito-ds-slider-rail-contrast/light.jpg` |
| Preserved slider chrome    | Both rendered themes                                              | Passed        | Three solid signal handles, three previous markers, and the dual alpha selection remained rendered                                                                                            |
| Managed production runtime | Standard local QA start                                           | Not completed | Client and SSR builds completed, but the unrelated Nitro phase did not finish before the bounded run was stopped; the existing QA production-build result above remains untouched             |

- **Runtime note:** the fallback dev render exposed an unrelated existing
  import-protection error from `runner-calendar-context.ts`. It prevented
  hydrated theme-control activation, so the two independently resolved local
  browser themes were used. The error overlay was dismissed before capture;
  rendered rail geometry and computed CSS remained available and matched the
  current source. No runtime, route, backend, or import fix was made.
- **Coverage consequence:** this focused Lite proof covers the corrected shared
  rail presentation in both themes. It does not rerun the prior interaction,
  consumer, mobile, persistence, or Global QA inventories, whose source and
  behavior were not changed. No promotion condition was met.

## Exact Handoff Prompt

```text
ROLE: DESIGN SYSTEM

Mode: Tracked

Read AGENTS.md, agents/design-system.agent.md, skills/hito-frontend-design-system/SKILL.md, and this canonical item completely before writing:
docs/tasks/backlog/2026-08-10-hito-ds-slider-baseline-size-contract.md

Task: Update the existing HitoSlider and HitoDualRange shared contract to match the supplied Figma visual and make a previous value directly restorable. Apply the contract to every current consumer and the /hitoDS playground; do not create a second slider system.

Product decisions:
- Sliders use the existing xs/sm/md/lg Button/Input size scale. Their interactive height matches the selected shared control height, and their rounding follows its existing radius contract. The supplied Figma nodes are the sm (32px) presentation.
- A previous value is a baseline for the current edit session or the persisted value when a consumer has it. It is represented by a small translucent gray point. Activating the point restores the existing controlled value; it is not a decorative mark.
- A dual range has one independent previous marker per endpoint. Restoring a marker changes only that endpoint. Its background rail and selected span use alpha; current handles are solid signal.
- /hitoDS must let reviewers choose slider size and exercise the changed/restored state for both primitive kinds.

Evidence and owner:
- Figma single: https://www.figma.com/design/RNcNPUpUgMcpeTk6UFwbn4/hito-running?node-id=7796-643&t=MVUJBxp1pi7pnBk1-1
- Figma range: https://www.figma.com/design/RNcNPUpUgMcpeTk6UFwbn4/hito-running?node-id=7796-645&t=MVUJBxp1pi7pnBk1-1
- Canonical owners are src/components/ui/hito-slider.tsx, src/components/ui/hito-dual-range.tsx, src/styles/controls-lists.css, the central Hito control size contract, and /hitoDS. Direct consumers are Completion, Body Notes, and Heart Rate Profile. This is a Design System contract, not a backend or route-local issue.

Reuse-first budget:
- Reuse HitoSlider, HitoDualRange, HITO_FIELD_SIZES, current controlled callbacks, canonical control CSS, Slider playground, Dual-value range specimen, and existing DS validator.
- Expected new production runtime artifacts: none. Do not add a slider primitive, persistence, store, token family, route-local CSS recipe, Figma mapping, or compatibility component.
- Remove superseded fixed slider geometry or duplicate demo state where safe.

Definition of Done:
1. Both primitives use the existing xs/sm/md/lg size scale and matching control/radius geometry; no parallel slider size taxonomy exists.
2. Single and dual prior-state markers are pointer- and keyboard-accessible, restore via the existing controlled callbacks, and preserve native range keyboard behavior and disabled/invalid handling.
3. Alpha rail/fill/marker and solid-handle visual behavior matches the supplied Figma references in the target stack and tokens.
4. All direct product consumers have a meaningful baseline without browser persistence, backend changes, or new product state; /hitoDS exposes every size and restoration story.
5. Shared DS validator, focused static checks, a production build, and proportionate browser proof pass.

Do not modify Figma, backend/persistence, Calendar, plans, routing, providers, auth, or unrelated dirty work. If an existing consumer cannot supply a truthful baseline without a product-state decision, stop and report that one boundary; do not invent storage. Use a subagent only if a bounded independent review materially saves time or confidence. Update this item with a compact truthful receipt. Do not stage, commit, push, or deploy; report Implementation DoD separately from Global QA Acceptance.
```

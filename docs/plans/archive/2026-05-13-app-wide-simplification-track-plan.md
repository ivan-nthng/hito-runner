Status

Complete

Owner

Frontend Agent

Last Updated

2026-05-13

Checklist

- [x] Slice 1: remove `/integrations` from primary desktop and mobile navigation.
- [x] Slice 1: keep `/integrations` reachable through quieter shell access.
- [x] Slice 1: trim directly adjacent disabled shell utility rows.
- [x] Slice 2: simplify home/calendar density and rhythm.
- [x] Slice 3: simplify `/progress` into a smaller summary route.
- [x] Slice 4: demote/reframe `/body` and further reframe `/integrations`.
- [x] Slice 5: align `/hitoDS` after product simplification settles.

Context

The current app is materially healthier than the imported baseline. The core product truth is now clearer and should be preserved:

- text-first plan creation is live
- advanced JSON import is real but secondary
- Garmin FIT/ZIP upload is live
- deterministic plan-vs-run comparison is live
- bounded recommendation is live
- `Feedback` is the canonical evidence surface
- `Log result` remains the manual completion surface

The broad designer audit is not asking for new capability. It is asking for a smaller, calmer product surface with less route chrome, fewer support blocks, clearer hierarchy, and less visible placeholder noise. This plan converts that audit into one canonical simplification track.

This plan reuses the direction already established in:

- [2026-05-13-copy-audit-and-simplification-plan.md](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-05-13-copy-audit-and-simplification-plan.md:1)
- [2026-05-13-hierarchy-cleanup-after-copy-pass.md](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-05-13-hierarchy-cleanup-after-copy-pass.md:1)

This new track is broader. It governs app-wide spacing, route composition, navigation noise, and route demotion decisions.

Audit Synthesis

Spacing / rhythm problems

- Page spacing is not yet systemically calm. Home, workout detail, progress, body, and integrations do not share one strong vertical rhythm.
- Some routes still depend on stacked containers to create structure instead of using section spacing, dividers, and one clear page rhythm.
- Right-column support blocks on home and some workout/sidebar areas still consume visual bandwidth that exceeds their product truth.

Hierarchy / labeling problems

- Too many tiny uppercase labels are doing work that should be done by layout and section order.
- Some surfaces have multiple “title moments” or too many micro-headings before the user reaches the actual truth-bearing content.
- Support copy is calmer than before, but still too visible in several preserved shell routes.
- Calendar cells and some secondary rows still try to communicate too many meanings at once.

Route-level chrome problems

- `/progress` is more chrome-heavy than truth-heavy. It looks more mature than the underlying value currently is.
- `/body` uses a different product language and interaction density from the main app. It feels like a side product, not an integrated utility.
- `/integrations` still speaks in shell/status language and remains weak as a top-level destination.
- Workout detail is much closer to the right model now, but still carries some local surface flourishes that should not spread app-wide.

Navigation / shell noise

- The shell still presents too many quiet-but-visible promises: disabled account/settings/preferences, a persistent profile utility area, support note behavior, and secondary status chrome.
- Primary navigation currently overstates route importance. Not every route in the current nav has earned top-level placement.
- Mobile and desktop shell both still expose more structure than the current truth requires.

Candidate route demotions

- `/integrations` is the clearest demotion candidate.
- `/body` is the second demotion candidate.
- `/progress` should remain a visible route for now, but only after simplification reduces its chrome and makes its current truth more honest.
- `/hitoDS` should remain an internal reference surface only and should not influence product chrome decisions by itself.

Simplification Principles

Page composition

- One page should have one primary heading moment.
- Each route should expose one primary truth-bearing section before any support or explanatory section.
- Default to open layout plus dividers before adding containers.

Section composition

- Use one calm parent surface only when it truly groups related interaction.
- Prefer internal dividers and spacing over multiple nested cards.
- If a section is mostly explanatory, it should not visually compete with the route’s working surface.

Support copy usage

- Support copy explains current truth, not future promise.
- Support copy should be short, localized, and secondary.
- If a sentence exists only to reassure the system rather than help the runner act, cut it.

Card vs divider usage

- Cards are for grouped interaction or stateful payloads.
- Dividers are for ordinary section separation.
- Do not wrap every sub-section in its own surface.
- When in doubt, delete one container before introducing another.

Heading hierarchy

- Display headings are scarce and route-level only.
- `hito-label` is micro-support, not the main hierarchy engine.
- Section titles should do the orientation work that labels currently overcompensate for.

Status-pill / marker restraint

- Use pills and markers only where they add immediate decision value.
- Do not stack multiple status systems in one viewport without necessity.
- Calendar cells, shell header, sidebar, and support sections should not all compete with simultaneous state tokens.

Priority Order

P0

- shell and primary navigation simplification
- home and calendar density reduction
- route-level rhythm normalization across home, workout detail, and progress

Why first:

- This reduces noise on every authenticated page.
- It collapses product overstatement before any deeper route cleanup.
- It improves the routes runners actually touch most often.

P1

- `/progress` simplification
- `/integrations` demotion and reframing
- `/body` demotion and reframing

Why second:

- These are the largest remaining preserved-shell surfaces.
- They create the strongest mismatch between visible chrome and implemented value.

P2

- Hito DS alignment pass
- remaining label/pill reduction
- optional residual workout-detail polish that follows the new system rather than leading it

Why third:

- The system surface should follow the product simplification, not dictate it prematurely.

What We Simplify First

- remove top-level nav overstatement before polishing secondary routes
- simplify home/calendar rhythm before inventing new components
- make `/progress` more honest before expanding it
- demote `/integrations` before trying to “improve” it with more chrome

Surface Recommendations

Home / calendar

- Keep home as the product center of gravity.
- Preserve `TodayHero` and calendar as the core composition.
- Reduce support-block competition on the right side of home.
- Simplify calendar cells so they prioritize date, workout identity, completion marker, and feedback marker in that order.
- Reduce legend and label weight where the meaning is already visible in the grid.
- Keep `Feedback` discoverability, but do not make calendar cells carry full analysis semantics.

Workout detail

- Preserve the current truth ownership:
  - `Overview`
  - `Log result`
  - `Feedback`
- Keep the low-card direction established by the recent cleanup work.
- Treat workout detail as a model for calmer composition, but do not turn every route into a workout-detail clone.
- Remove leftover local chrome that exists only for atmosphere rather than meaning.
- Keep sidebar usage narrow: targets, current result state, and whole-program note context only.

Progress

- Reframe as a summary page, not an analytics destination.
- Remove or reduce sections that are mostly “still growing” chrome.
- Keep only the summaries that are already supported by saved truth.
- Prefer fewer modules with clearer takeaways over multiple visually equal panels.
- If a chart does not carry trustworthy or useful value yet, demote or remove it rather than decorate it.

Body

- Treat `/body` as a utility route, not a peer of the calendar.
- Reframe it as a personal note tool with restrained chrome.
- Do not let its body-map interaction language become a separate product identity.
- Reduce top-level page ceremony and preserve only the utility that is real today.

Integrations

- Reframe `/integrations` as a status/reference route, not a product destination.
- Stop presenting placeholder surfaces as if they are active connection workflows.
- Keep live Garmin-related truth discoverable, but only through honest status summaries and links into the real owning surfaces.
- Remove stale shell-language like preview/not-connected where it no longer matches the product state.

Shell / footer / nav noise

- Reduce shell promise count.
- Disabled utilities like Settings, Account, and Preferences should not continue to carry top-of-mind product weight indefinitely.
- The shell plan note should remain dismissible and minimal, not a persistent support essay.
- Primary nav should represent the app’s real current center, not every preserved route.

`/hitoDS` role as reference vs production surface

- `/hitoDS` is an internal reference surface only.
- It should define primitives, spacing tokens, disclosure patterns, and hierarchy patterns.
- It must not justify production chrome that the real routes do not need.
- Product surfaces lead with truth; Hito DS follows by codifying the smallest useful primitive set.

Demotion Decisions

`/integrations`

- Decision: demote from primary nav.
- Reason:
  - it is truth-light
  - it is not a primary repeated runner destination
  - its current value is mostly explanatory and route-referential
- Least risky path:
  - keep the route
  - remove it from primary nav
  - leave access through secondary product entry points where it is contextually relevant
  - reframe the page as an honest status/reference utility rather than a feature hub

`/body`

- Decision: demote from primary nav after `/integrations`, but keep the route.
- Reason:
  - it does not currently influence plan truth
  - it uses a separate interaction language
  - it is a utility, not a core navigation destination
- Least risky path:
  - keep the route intact
  - remove peer-level nav framing
  - retain discoverability through secondary route access only

`/progress`

- Decision: keep in primary nav for now, but simplify aggressively.
- Reason:
  - it still reflects real saved-plan and workout-log truth
  - it has more core value than `/body` or `/integrations`
  - demotion before simplification would hide a real, if currently over-designed, summary surface

Where Hito DS Should Lead

- Hito DS should lead on primitive discipline:
  - spacing scale
  - disclosure pattern
  - calm surfaces
  - divider usage
  - heading hierarchy
  - button weight
- Hito DS should not lead on route architecture or information density.
- If a route needs multiple new DS primitives to feel coherent, the route is probably too complex rather than under-designed.

What We Leave Alone For Now

- Garmin upload, comparison, and bounded recommendation logic
- `Feedback` as canonical evidence ownership
- `Log result` as manual completion ownership
- text-first plan creation and advanced JSON fallback behavior
- start-date and first-day conflict policy
- screenshot OCR, similar-run comparison, and broader program-adjustment futures

Execution Decomposition

Slice 1

- Goal:
  Simplify shell/navigation weight and lock route demotion behavior.
- Likely files / surfaces:
  [AppShell.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/AppShell.tsx:1)
  [styles.css](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/styles.css:1)
- Dependency / risk:
  risk of reducing discoverability too aggressively if secondary access points are not clear.
- QA expectation:
  all current reachable routes remain accessible; core nav feels smaller and clearer on desktop and mobile.
- Recommended role:
  FRONTEND

Slice 2

- Goal:
  Simplify home/calendar density and align vertical rhythm with the new shell.
- Likely files / surfaces:
  [index.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/index.tsx:1)
  [TodayHero.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/TodayHero.tsx:1)
  [Calendar.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/Calendar.tsx:1)
  [styles.css](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/styles.css:1)
- Dependency / risk:
  risk of removing too much affordance from calendar cells or obscuring feedback marker meaning.
- QA expectation:
  home remains the fastest route to understand, and calendar cells become easier to scan, not more decorative.
- Recommended role:
  FRONTEND

Slice 3

- Goal:
  Turn `/progress` into a smaller, more honest summary route.
- Likely files / surfaces:
  [progress.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/progress.tsx:1)
  [styles.css](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/styles.css:1)
- Dependency / risk:
  risk of leaving the route too empty if chrome is removed before summary priorities are clear.
- QA expectation:
  the route should communicate less but more truthfully; no chart or stat should imply capability beyond current saved truth.
- Recommended role:
  FRONTEND

Slice 4

- Goal:
  Demote and reframe `/integrations` and `/body`.
- Likely files / surfaces:
  [integrations.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/integrations.tsx:1)
  [body.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/body.tsx:1)
  [AppShell.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/AppShell.tsx:1)
- Dependency / risk:
  risk of orphaning these routes if contextual secondary entry points are not defined.
- QA expectation:
  both routes still work, but no longer read like core app destinations.
- Recommended role:
  FRONTEND

Slice 5

- Goal:
  Align Hito DS with the simplified live product rather than with historical overbuilt states.
- Likely files / surfaces:
  [hitoDS.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/hitoDS.tsx:1)
  [styles.css](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/styles.css:1)
- Dependency / risk:
  risk of polishing the internal reference page before the real product decisions settle.
- QA expectation:
  Hito DS reflects live product rules and no longer encourages unused variants or over-chromed patterns.
- Recommended role:
  FRONTEND

Guardrails

- Do not regress Garmin truth flows.
- Do not break current plan-creation or plan-import truth.
- Do not move `Feedback` ownership away from workout detail.
- Do not turn `Log result` into a second evidence-analysis surface.
- Do not replace simplification with another design system expansion.
- Prefer deletion, demotion, and consolidation over new components.
- Avoid a giant redesign pass. This track is about making the current app smaller and truer.

What We Must Not Reintroduce

- JSON-first framing
- stale placeholder shells that look connected when they are not
- multiple equally loud support blocks on the same route
- card stacking as the default way to create hierarchy
- top-level nav for weak or preserved-only routes
- copy that promises more than the current route really does

Risks

- Over-demotion could make secondary utilities feel hidden before alternative entry points are clear.
- Over-simplifying progress could leave the route too thin if summary content is not prioritized well.
- Calendar cleanup could unintentionally reduce evidence or completion discoverability if marker semantics are stripped too far.
- Shell cleanup could create parity issues between desktop and mobile nav if both are not simplified together.

QA Plan

- Run one focused P0 QA sweep before broader route cleanup:
  - authenticated home
  - workout detail
  - feedback markers
  - top-level nav on desktop
  - bottom nav on mobile width
- After each slice, verify:
  - route reachability
  - no lost Garmin upload or feedback access
  - no confusion between `Log result` and `Feedback`
  - spacing and chrome are reduced, not merely restyled
- For demoted routes, verify:
  - they remain reachable through the chosen secondary path
  - their new framing is honest about current value

Exit Criteria

- primary nav reflects actual product gravity rather than preserved route inventory
- home, workout detail, and progress share a calmer page rhythm
- `/integrations` no longer behaves like a primary product destination
- `/body` no longer presents as a peer product language
- support copy, pills, and row groups are visibly reduced across the primary app
- Hito DS is clearly a reference surface, not a parallel product expression

Next Recommended Role

FRONTEND

Suggested Next Step

Execute the smallest high-value first slice: simplify `AppShell` navigation weight and remove `/integrations` from primary nav while preserving route access, then align home spacing and calendar density to that calmer shell.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Defined one canonical app-wide simplification track from the recent designer audit, focused on shell noise reduction, route demotion, spacing normalization, and lower-chrome composition rather than new capability.

### Key Decisions

- `/integrations` should be demoted from primary nav first; `/body` should follow after `/integrations`.
- `home`, `calendar`, and the shell should be simplified before deeper secondary-route cleanup.

### Current State

- Core product truth is already correct around text-first plan creation, Garmin evidence, deterministic comparison, bounded recommendation, `Feedback`, and `Log result`.
- The main remaining problem is app-wide overstatement through chrome, support blocks, route parity, and nav weight.

### Constraints

- Do not regress Garmin truth flows or plan-creation/import behavior.
- Prefer deletion, demotion, and divider-based composition over new components or broader redesign.

### Risks / Open Questions

- Secondary routes may become too hidden if demotion happens before replacement access points are clear.
- Progress simplification must remove chrome without hollowing out the route.

### Next Recommended Role

FRONTEND

### Suggested Next Step

Implement Slice 1 by simplifying `AppShell`, reducing top-level nav weight, and removing `/integrations` from primary navigation while preserving route access and mobile parity.
```

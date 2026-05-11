Status: Active
Owner: Designer Agent
Last Updated: 2026-05-10

# 2026-05-10 Design System Slice 1 Review

## Context

The first Hito design-system implementation slice is now built across shared CSS primitives, auth, text-first onboarding, advanced import, shell chrome, and the internal `/hitoDS` reference page. This review checks whether that slice is strong enough to carry forward into the next rollout step for the current Hito Running product direction:
- calm
- editorial
- athletic
- premium
- low-chrome
- low-card

This is a design review only. It evaluates visual-system readiness, not code quality or backend behavior.

## What’s Working

### Tone And Direction

The first slice is visibly aligned with the intended product tone. The warm graphite canvas, restrained amber signal, Fraunces display moments, and lower-card surface treatment all move the product away from generic dashboard UI and toward a calmer editorial running tool.

### Shared Primitive Baseline

The current base primitives are good and should be preserved:
- `hito-surface` and `hito-surface-flat` establish the right low-card direction
- `hito-field` creates a coherent input language across login, onboarding, and import
- `hito-button-primary` and `hito-button-secondary` express clear CTA hierarchy without visual noise
- `hito-tab-list` and `hito-tab` are restrained and fit the product well
- `hito-label` gives the system one consistent micro-label pattern
- `hito-section-divider` supports the “one grouped frame” rule well

### Surface-Level Wins

The strongest first-slice surfaces are:
- login, which now feels intentional, premium, and uncluttered
- text-first onboarding, which correctly privileges one strong authoring surface
- advanced import, which is clearly secondary and operational rather than product-primary
- shell chrome, which now feels calmer and less migration-era

These should be preserved as the baseline language for continued rollout.

## What’s Weak

### The Primitive Set Is Still Form-Heavy

The current slice does a better job standardizing inputs, buttons, labels, and quiet surfaces than it does standardizing the primitives the actual running product most depends on:
- grouped support panels
- metric rows
- status pills
- result and progress states
- dense informational rows

This is the biggest remaining weakness.

### Product-Native Information Density Is Not Yet Canonical

Home and workout detail rely less on forms and more on compact status, metrics, grouped context, and scanability. The current slice hints at that direction, but it does not yet define it strongly enough as reusable DS behavior.

### `/hitoDS` Is More Directional Than Operational

The current DS page is useful as a tone and philosophy reference, but it is still lighter than the implementation team will eventually need for deeper rollout. It explains the system well, but it does not yet exercise the most product-critical primitives in realistic running-context combinations.

## Primitive Readiness

### Home / Calendar

Mostly ready with one caveat.

Ready now:
- page tone
- low-card surface treatment
- CTA hierarchy
- label system
- divider logic

Needs more refinement first:
- grouped support card behavior as a named reusable primitive
- metric/value-label composition as a named reusable primitive
- completed/current/today status treatment consistency

Decision:
- ready for rollout only after one small refinement pass on grouped support and metric/state primitives

### Workout Detail

Partially ready, not fully ready.

Ready now:
- calmer surface tone
- tabs
- field/input patterns
- low-chrome framing logic

Needs more refinement first:
- right-side grouped panel system
- status badge hierarchy
- metric group rhythm
- row density rules for detail blocks

Decision:
- do not use the current slice alone as the final primitive basis for workout detail rollout

### Progress / Body / Integrations

Not ready as a priority target yet.

These surfaces can borrow the broad tone later, but they should not drive the current system. They still contain preserved-shell behavior and lower-value explanatory content. Rolling the current slice into them immediately would spread the system wider before the product-native primitives are fully settled.

Decision:
- defer deeper DS normalization here until home and workout primitives are proven

## `/hitoDS` Assessment

The current `/hitoDS` page is useful enough to keep as the living internal reference for now. It already does two important jobs well:
- anchors the intended visual language
- gives Frontend one stable place to inspect the first shared primitives

It should become:
- a focused internal reference for real product primitives
- a place to show realistic usage examples from Hito surfaces
- a narrow validation seam for future DS rollout passes

It should not become:
- a giant enterprise component catalog
- a detached marketing-style brand page
- a parallel product surface with its own design agenda

## Do Not Expand Yet

- Do not turn `/hitoDS` into a large token museum or exhaustive design playground.
- Do not broaden the system into speculative analytics, AI insight, or integrations components yet.
- Do not normalize secondary preserved routes before grouped support, metrics, and status primitives are settled for primary product surfaces.

## Fastest Useful Next Slice

The fastest useful next slice is:
- one refinement pass focused on grouped support surfaces, metric rows, and status semantics

That means Frontend should tighten one reusable family covering:
- grouped side/support panels with internal dividers
- value-label metric rows
- compact status pills and success/warn/destructive states
- dense informational row spacing for product detail surfaces

This is the highest-leverage step before deeper rollout.

## Rollout Recommendation

Recommendation:
- make one more primitive refinement pass first

Single highest-value refinement area:
- grouped support plus metric/status primitives for product-detail surfaces

Reason:
- the current slice already solves tone and form controls well enough
- the next rollout risk is not typography or buttons
- the next rollout risk is inconsistency across home and workout detail where grouped context, metrics, and state communication matter most

After that refinement, Frontend should continue into the primary home and workout surfaces before touching broader secondary routes.

## Risks

- If rollout continues as-is, home and workout may reintroduce route-local one-off patterns for grouped panels, metrics, and status handling.
- If `/hitoDS` grows too quickly, it could become documentation-heavy without increasing product-surface consistency.
- If secondary routes are normalized before the primary product primitives are settled, the system may widen faster than it matures.

## Next Recommended Role

FRONTEND

## Suggested Next Step

Run one narrow primitive refinement pass that adds canonical grouped support, metric-row, and status-state patterns to the shared DS layer and demonstrates them on `/hitoDS`, then use those refined primitives for the next home and workout rollout slice.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Reviewed the first Hito design-system implementation slice and concluded that the tone and form primitives are strong, but one more focused refinement pass is needed before deeper rollout into the main product surfaces.

### Key Decisions

- Preserve the current calm, editorial, low-card primitive baseline across auth, onboarding, import, and shell chrome.
- Add one more refinement pass for grouped support surfaces, metric rows, and status semantics before wider rollout into home and workout detail.

### Current State

- The first DS slice is implemented and `/hitoDS` is already useful as a living internal reference.
- The current primitive set is strongest for forms and general surfaces, but not yet fully canonical for product-native metric and grouped-context patterns.

### Constraints

- Do not expand the DS into speculative secondary product areas yet.
- Keep the next pass narrow and implementation-driving rather than turning `/hitoDS` into a broad component catalog.

### Risks / Open Questions

- Rolling forward too early may create new route-local patterns on home and workout detail.
- The shared DS layer still needs stronger canonical treatment for grouped support and status-heavy product surfaces.

### Next Recommended Role

FRONTEND

### Suggested Next Step

Implement one narrow refinement pass for grouped support, metric-row, and status primitives in the shared DS layer and reflect those patterns on `/hitoDS` before continuing rollout into home and workout detail.
```

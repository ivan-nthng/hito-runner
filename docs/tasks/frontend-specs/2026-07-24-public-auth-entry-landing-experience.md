# Public Auth Entry And Landing Experience

## Work Item ID

2026-07-24-public-auth-entry-landing-experience

## Status

backlog

## Type

frontend_spec

## Priority

high

## Owner

frontend

## Scope

auth-app-shell-admin-boundary

## Archive Intent

retain_in_place

## Frontend Lane

marketing

## Task

Retain the accepted public-auth and landing specification as supporting detail until Product creates
or links one canonical operational backlog item.

## Stage

Supporting specification / orphaned migration debt. No canonical backlog item currently owns an
implementation or QA gate.

## Operational Classification

This document is supporting design detail, not an operational queue entry. Its former `ready`
status and Frontend prompt did not have a matching item under `docs/tasks/backlog/`; they therefore
cannot authorize dispatch. Product must create or select exactly one canonical backlog item before
this proposal can be resumed.

## Historical Handoff Prompt

The prompt below is retained as design-history context only and is not executable from this spec.

```text
ROLE: FRONTEND

Task:
Implement the shared public Auth Entry and landing experience defined in the canonical specification.

Stage:
FRONTEND implementation with independent QA support.

Frontend lane: Marketing

Specification:
/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/frontend-specs/2026-07-24-public-auth-entry-landing-experience.md

Root cause and architecture fit:
Unauthenticated `/` and `/login` already converge on `AuthEntryScreen`, which owns the real auth
state and Hito public visual entry. A separate landing route or duplicated form would create a
second public/auth flow. The existing `auth-hero` also currently owns the entire screen root, so
landing content must follow an isolated first-viewport hero rather than extending the hero image
and alpha-overlay treatment down the whole page.

Required outcome:
- Keep the existing real login, signup/email, local-bypass, Magic Link, redirect, validation,
  pending, sent, unavailable, and error behavior inside one first-viewport auth hero.
- Add the specified three-section, low-card public narrative and final CTA as scroll continuation
  inside the shared unauthenticated entry owner.
- Every start/sign-in CTA returns to the existing auth region, preserves its current tab, field
  values, status, and `next`, and moves focus to the correct existing auth target.
- Reuse the current Hito logo, desert hero asset, semantic typography, buttons, fields, surfaces,
  tokens, spacing, and focus behavior. Add no second form, route, auth state owner, marketing UI
  kit, carousel, or unsupported product claim.
- Use only sanitized, current product captures under the asset contract. Do not ship QA artifacts,
  personal data, fixture credentials, fake dashboards, or unsupported integrations as marketing
  imagery.
- Preserve authenticated routing into the existing runner product. Authenticated users must not
  render the landing narrative.

Definition of Done:
- Desktop and exact 375px show real authentication immediately in the first viewport.
- The hero image/overlay ends with the hero; narrative sections use normal Hito page surfaces.
- Auth states and redirects behave exactly as before.
- CTA return, focus, hash/deep-link, keyboard, reduced-motion, light/dark, and responsive behavior
  match the specification.
- No horizontal overflow, inaccessible image content, broken focus, console/page errors, or
  duplicated auth form/state exists.
- Targeted lint, production build, build integrity, runtime health, scoped diff hygiene, and the
  required browser inventory pass.

Use one reusable QA subagent for independent browser acceptance and integrate its complete check
inventory. Stop if implementation requires new auth behavior, backend truth, routes, product
claims, or a new Hito DS primitive.
```

## Last Updated

2026-07-24

## Plan File

None. This is one bounded public-entry composition slice, not a new route or product track.

## Context

Hito already has the correct public/auth convergence:

- unauthenticated `/` renders `AuthEntryScreen`;
- unauthenticated `/login` renders the same `AuthEntryScreen`;
- authenticated `/` renders onboarding or the runner calendar;
- authenticated `/login` renders the existing signed-in continuation instead of the public entry;
- real email and loopback-only local login availability remain backend-shaped route data.

The landing is therefore not a destination before authentication. It is a scroll continuation of
the existing public entry for people who want more context before using the same auth action.

## Root Cause And Source Mapping

### Visible need

The public entry currently explains Hito in two short lines. A new visitor can authenticate
immediately but cannot continue scrolling to understand the actual plan, calendar, workout, and
result-readback experience.

### Demonstrated underlying cause

The missing owner is public-entry composition, not auth:

- `AuthEntryScreen.tsx` contains the complete hero and real form but no narrative sibling sections;
- its root currently carries `auth-hero`, so simply appending content inside that root would extend
  the absolute hero image and overlay across the whole landing;
- `/` and `/login` already converge on the component, so a new route or form would duplicate the
  correct canonical seam.

### Canonical owner

`AuthEntryScreen` remains the public composition owner. Existing auth route data, server actions,
redirects, and authenticated routing remain unchanged.

### Source map

| Concern | Existing owner to preserve |
| --- | --- |
| Public route convergence | `src/routes/index.tsx`, `src/routes/login.tsx` |
| Public composition and form state | `src/components/AuthEntryScreen.tsx` |
| Local/email auth availability and request behavior | current auth route-data and auth action owners |
| Brand | `HitoLogo`, `login-desert-horizon.jpg`, `hito-auth-photo-overlay` |
| Controls | Hito tabs, fields, labels, buttons, Icon |
| Typography and layout | Hito typography roles, route gutters, spacing and semantic color tokens |
| Product claims | `docs/current-product.md`, `docs/current-system.md` |

## Accepted Landing Direction

Use one vertically scrolling public entry:

1. `Auth hero` - the current real authentication surface, contained to the first viewport.
2. `Plan` - setup and review before a plan is saved.
3. `Train` - calendar overview and structured workout detail.
4. `Reflect` - result logging and conditional evidence/readback.
5. `Return to auth` - one final primary CTA and a minimal public footer.

This is an editorial sequence, not a feature-card grid. Hierarchy comes from large type, open
spacing, real product imagery, and sparse dividers. Each chapter has one message and one product
capture.

## Page Anatomy

### Root

- Use one semantic page root for the unauthenticated experience.
- The first child is the isolated `auth-hero`.
- Narrative sections are siblings after the hero on normal `background` / `surface` tokens.
- Keep one mounted auth form and one auth state owner for the whole page.
- Do not reuse `AppShell` navigation on the public entry.
- Do not add a marketing header, mega-navigation, pricing navigation, or a second logo bar.

### Width and rhythm

- Hero keeps the current `max-w-5xl` two-column relationship.
- Narrative uses the existing route gutter and a maximum readable page width around `max-w-6xl`.
- Body copy remains within approximately `36rem`.
- Product media may use the wider remaining column but must not widen the page.
- Major chapters use open vertical spacing and at most one top hairline divider.
- Do not wrap every chapter, feature, or caption in a card.

## First Viewport: Real Auth Hero

### Product requirement

Authentication remains the primary first action. A visitor must not scroll past marketing before
they can sign in or start.

### Desktop

- Preserve the current desert image, controlled overlay, logo/copy left, and auth surface right.
- Keep the current two-column grid and readable alpha surface.
- The auth form and any action currently exposed by its existing state remain fully visible in the
  common desktop viewport.
- The existing line `Your running plan, kept simple.` becomes the visible semantic page heading
  without becoming an oversized display headline.
- Existing support copy remains below it.
- A quiet `See how Hito works` text action may follow the support copy and link to the first
  narrative chapter. It must not compete with the real auth action.

### Mobile

Order is fixed:

1. Hito logo;
2. short heading and one support paragraph;
3. real auth surface;
4. quiet `See how Hito works` link after the auth surface.

At exact `375 x 812`, the auth surface and the controls exposed by its current state remain
immediately visible. Do not force an always-visible submit action into states where the existing
form intentionally reveals it only after input. Do not insert navigation, promotional badges,
feature chips, artwork, or the scroll link before the form. Use `100svh` as a minimum, not a fixed
height: short devices may scroll, but content must never clip.

### Hero boundary

- The image and `hito-auth-photo-overlay` end at the hero boundary.
- Narrative content must not sit over the hero photo or inherit the auth alpha surface.
- The transition into the next section may use one background change and generous spacing; do not
  add a decorative wave, angled cutout, or overlapping card.

## Narrative Sections

Copy below is intent and provisional direction, not a final COPY pass.

### 1. Plan

**Eyebrow:** `Plan`

**Heading intent:** `Set the goal. Review the plan.`

**Body intent:**

Hito uses the runner's explicit setup, goal, and availability to prepare a dated plan for review.
The runner sees the proposed calendar and workout structure before choosing to create it.

**Truth boundary:**

- say that the plan is reviewed before saving;
- do not promise personal coaching outcomes, guaranteed race results, perfect adaptation, or exact
  pace/heart-rate truth;
- do not describe provider internals or local fixtures;
- do not imply that preview generation persists a plan.

**Media:**

One sanitized current generated-plan review capture. The capture should show reviewable plan
structure and the explicit create/confirm boundary without credentials, account identity, debug
copy, or test labels.

**Caption intent:** `Review the proposed plan before it becomes your calendar.`

### 2. Train

**Eyebrow:** `Train`

**Heading intent:** `See the week. Open the workout.`

**Body intent:**

The saved calendar keeps planned days and Rest readable. Opening a workout shows its ordered
structure, targets, and cues in one detail view.

**Truth boundary:**

- describe the current calendar and workout-detail readback only;
- do not imply live coaching, automatic schedule adaptation, weather guidance, or a connected
  watch workflow;
- do not show manual editing controls as the default workout-reading experience.

**Media:**

One sanitized composition captured from the current saved calendar and workout-detail product.
Prefer one coherent product screenshot or one deliberately cropped source image, not two nested
fake cards.

**Caption intent:** `Move from the calendar to the exact workout structure for the day.`

### 3. Reflect

**Eyebrow:** `Reflect`

**Heading intent:** `Log the run. Read what happened.`

**Body intent:**

The runner can save a completion result. When real Garmin evidence is attached, Hito can show the
available planned-versus-actual readback and feedback supported by that evidence.

**Truth boundary:**

- keep the Garmin statement conditional;
- distinguish manual result logging from attached evidence;
- do not promise diagnosis, recovery prediction, performance improvement, always-on integration,
  or AI interpretation availability;
- do not imply that every completed workout automatically has comparison evidence.

**Media:**

One sanitized current completion/feedback capture with real fixture-shaped state. If a safe
evidence-backed capture is not available in the implementation slice, show the manual result
readback instead of fabricating provider feedback.

**Caption intent:** `Saved result truth first; deeper comparison only when evidence exists.`

## Final CTA And Footer

### CTA

- Use one open, centered final section rather than a boxed signup card.
- Provisional heading: `Ready to start your plan?`
- Provisional body: `Sign in or continue with email using the same Hito entry above.`
- Primary action: `Start with Hito`.
- The action returns to the existing auth region. It does not open a dialog, reveal another form,
  navigate to another landing route, or reset auth state.

### Footer

- Keep it compact: Hito logo/wordmark, current year, and a real `Changelog` link.
- Do not add privacy, terms, social, pricing, integrations, download, or support links until those
  destinations exist and Product approves them.
- Do not expose Admin, `/hitoDS`, or `/hub` as runner marketing navigation.

## CTA, Anchor, And Focus Behavior

### Stable anchors

- `#auth-entry` identifies the first auth region.
- `#how-hito-works` identifies the first narrative chapter.
- Both `/` and `/login` preserve these anchors without creating new route state.

### Return to auth

Every `Start`, `Sign in`, or equivalent marketing action must:

1. return to the existing `#auth-entry` region;
2. preserve `activeTab`, email/identifier/password draft, validation state, sent state, and `next`;
3. move focus to the most relevant existing target;
4. never remount or duplicate the form.

Focus priority:

- current invalid field when validation is visible;
- current login identifier for local login mode;
- email field for the email path;
- sent/unavailable status region when no new input is required or available.

Use normal scrolling when reduced motion is requested. Focus-visible treatment remains the existing
Hito field/button contract.

### Scroll continuation

- `See how Hito works` scrolls to the first chapter.
- Do not auto-scroll on load.
- Do not auto-advance chapters.
- Do not use a carousel, scroll-jacking, parallax, or horizontal page navigation.
- Browser back/forward and direct hash entry must remain understandable.

## Authentication State Contract

The landing does not create new auth states. It must coexist with the current ones:

| Existing state | First-viewport behavior | Landing behavior |
| --- | --- | --- |
| Loopback local login | Login/Signup tabs and current credentials form remain | Narrative is available below |
| Public email path | Existing email action remains the primary form | Narrative is available below |
| Email unavailable | Existing honest unavailable copy remains | CTA returns focus to that status; no fake alternate form |
| Sending Magic Link | Existing pending button/state remains | Scrolling does not interrupt or restart the request |
| Link sent | Existing sent confirmation remains | CTA returns to the sent status without clearing email |
| Validation error | Error stays beside its field | CTA prioritizes the invalid field |
| Callback/login error | Existing bounded error copy remains | Narrative does not hide or replace the error |
| Authenticated | Existing runner/onboarding continuation renders | Public landing is not rendered |

Marketing content must never decide whether local login or Magic Link is available. It consumes the
same route-shaped truth as the current form.

## Responsive Composition

### Desktop: `>= 1024px`

- Hero retains the existing two-column layout.
- Chapters use a two-column editorial grid: copy and media, approximately `2:3`.
- Alternating visual placement is allowed, but DOM order remains heading/copy then figure.
- Product captures have one consistent maximum height and do not become full-bleed browser mockups.

### Tablet: `700-1023px`

- Hero may stack using the current grid behavior if both columns cannot stay readable.
- Chapters become one column before copy or media feels compressed.
- Media remains full-width within the route gutter.

### Mobile: `< 700px`

- Hero order follows the fixed mobile order above.
- Every chapter is one column: copy first, media second, caption third.
- Section spacing becomes compact but remains clearly larger than field/form spacing.
- Product captures use a deliberate mobile crop or responsive source; do not shrink desktop text
  until it becomes illegible.
- CTA button may span the available width.
- No page-level horizontal scroll.

### Exact mobile acceptance

At `375px`:

- all auth fields and actions remain usable;
- no product image exceeds the viewport;
- no caption becomes a side column;
- no section relies on hover;
- the final CTA and footer have at least the existing route gutter.

## Visual Direction

- Keep the hero atmospheric and the narrative calm, warm, and editorial.
- Preserve Hito's dark/light semantic theme behavior.
- Use one product media surface per chapter; media is the object, not a card nested inside a card.
- Borders are limited to the media frame or a chapter divider, not both repeatedly.
- Keep orange signal scarce: auth primary action, final CTA, small eyebrows or focus accents.
- Avoid feature grids, glossy gradients on controls, floating badges, oversized metric claims,
  decorative icon collections, and generic SaaS dashboard tiles.
- The narrative background should feel intentionally quieter than the hero so the real product
  captures become primary.

## Hito DS Reuse Contract

### Required owners

- `HitoLogo`;
- existing `Icon` registry only where an icon has a clear job;
- `hito-button-primary`, `hito-button-secondary` or quiet text-link behavior;
- current `hito-field`, `hito-label`, feedback, disabled, and auth-tab states;
- `hito-page-title`, `hito-section-title`, `hito-body`, `hito-body-small`,
  `hito-micro-label`, and `hito-caption`;
- `hito-route-gutter`, current spacing scale, `hairline`, and semantic theme tokens;
- `hito-auth-alpha-surface` only for the auth form on the photo hero;
- `hito-surface-flat` or the nearest existing low-chrome surface for product media framing;
- existing focus-visible, disabled, pending, success, and error treatment.

### Allowed local composition

A small presentational `PublicLandingNarrative` / chapter composition may keep the main auth form
owner readable. It is page composition, not a new DS component family. It may own:

- section grid placement;
- media aspect ratio and crop;
- chapter spacing;
- anchor ids.

It must not own new buttons, fields, typography roles, tokens, status recipes, or auth state.

### No new primitive

No new Hito DS primitive is required for v1. If implementation discovers that a product media frame
cannot be composed from an existing low-chrome surface, stop and report the exact repeated need
rather than adding route-local chrome.

## Asset Contract

### Existing asset to retain

- `src/assets/marketing/hero-background/login-desert-horizon.jpg` remains the hero atmosphere.
- `HitoLogo` remains the only public wordmark asset.

### Product captures required

Deliver three sanitized, source-backed product captures:

1. generated-plan review;
2. saved calendar / workout-detail journey;
3. completion or evidence-backed feedback.

Requirements:

- capture from the current local product using non-sensitive fixture data;
- remove email, user id, credentials, internal file paths, tokens, debug labels, and provider ids;
- use current product typography, colors, and geometry without redrawing in Figma;
- export a modern web format with an accessible fallback;
- provide enough source resolution for `2x` desktop rendering;
- provide a deliberate mobile crop or responsive source when the desktop capture would become
  unreadable;
- keep alt text factual and repeat the essential meaning in adjacent HTML copy;
- do not import files directly from `qa-artifacts` into runtime.

One canonical dark product capture set is acceptable for the first implementation if it is treated
as product photography and remains legible on both page themes. Do not tint or recolor screenshots
to imitate the active theme. Theme-specific capture pairs are optional future asset polish, not a
reason to duplicate product components inside the landing.

### Not required

- new runner photography;
- illustration;
- animation;
- video;
- logos/testimonials;
- app-store badges;
- invented device frames.

## Accessibility And Motion

- Use one visible `h1` in the hero and ordered `h2` chapter headings.
- Give the auth surface a clear accessible name.
- Keep the actual form before marketing content in source order.
- Product figures use meaningful `alt` text; decorative frames are hidden from assistive
  technology.
- Pending and sent auth feedback must remain announced through the existing status/error contract.
- Focus must never be moved on passive scrolling.
- CTA-triggered focus happens only after the user's action and remains visible.
- Scroll reveal, if used at all, is limited to a subtle one-time opacity/position transition.
- Under `prefers-reduced-motion: reduce`, use no smooth scrolling, reveal translation, parallax,
  autoplay, or repeating motion.
- Content remains fully understandable with images unavailable.
- Contrast, hover, focus, disabled, success, and error states come from Hito semantic tokens.

## Copy Intent And Claim Guardrails

### Allowed factual themes

- plan setup from explicit runner information;
- review before create;
- one saved calendar;
- structured workout readback;
- manual result logging;
- conditional Garmin evidence and planned-versus-actual readback;
- public changelog.

### Do not claim

- user counts or adoption;
- testimonials or partner endorsements;
- guaranteed race or performance outcomes;
- live human or autonomous coaching;
- automatic plan adaptation;
- medical, injury, recovery, or biometric authority;
- weather-aware planning;
- always-connected Garmin/watch behavior;
- pricing, subscriptions, app-store availability, or unsupported integrations.

Final wording should receive a bounded COPY pass after the implemented structure is visually
accepted. Frontend may use the provisional copy intent above without inventing stronger claims.

## Preserved Boundaries

- No new route.
- No second auth form.
- No auth modal or sheet.
- No duplicated login/signup state.
- No backend or provider changes.
- No redirect changes.
- No new persistence.
- No authenticated landing state.
- No marketing navigation in `AppShell`.
- No changes to onboarding, plan creation, calendar, workout, result, or feedback behavior.
- No Figma-first or parallel visual system.

## Frontend Implementation Boundary

The smallest safe slice:

1. keep one `AuthEntryScreen` public owner;
2. isolate the existing photo hero as its first child;
3. add the three narrative chapters, final CTA, and compact footer;
4. add only the local layout composition needed for those siblings;
5. add sanitized product assets under the marketing asset owner;
6. preserve and re-exercise every existing auth state.

Do not refactor auth server actions, route data, tabs, field validation, or redirects as part of
this visual composition slice.

## Acceptance Criteria

- `/` and `/login` share the same public Auth Entry and landing composition when unauthenticated.
- Authenticated users never see the landing composition.
- Login/signup/email remains the immediate first-viewport action on desktop and exact `375px`.
- The hero photo and overlay do not extend into the narrative.
- Narrative order is Plan -> Train -> Reflect -> final CTA.
- Each chapter uses one truthful message and one current sanitized product capture.
- Marketing CTAs return to the same mounted auth form without resetting state or `next`.
- Focus lands on the correct current auth target and remains keyboard-visible.
- Local login, email-only, unavailable, pending, sent, and error states remain truthful.
- Light/dark themes remain coherent.
- Reduced motion removes smooth/reveal motion without removing content.
- No unsupported claim, duplicate form, card soup, horizontal overflow, or route-local control
  family is introduced.
- Hito DS primitives and semantic tokens own all controls and typography.

## Required Frontend Validation

The implementation owner should derive the final inventory from the changed source, including:

- source proof that `/` and `/login` still converge on one `AuthEntryScreen`;
- unauthenticated desktop and exact `375px` in dark and light themes;
- public email-enabled and honestly unavailable states;
- loopback local login and signup tabs;
- invalid, sending, sent, callback error, invalid credentials, and local-unavailable states;
- CTA return with form draft/tab/status/`next` preservation;
- direct `#auth-entry` and `#how-hito-works` navigation;
- keyboard order and visible focus;
- reduced-motion behavior;
- authenticated `/` and `/login` exclusion;
- image fallback, alt text, and sanitized asset review;
- no horizontal overflow, console/page errors, or bad HTTP;
- targeted lint, fresh production build, build integrity, runtime health, cleanup, and scoped diff
  hygiene.

Global QA Acceptance remains pending until the implementation owner integrates independent browser
evidence.

## Blockers

None. Final marketing copy and the exact sanitized captures are implementation assets within the
bounded contract, not product or backend blockers.

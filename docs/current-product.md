# Current Product

## Product Role

Hito Running helps a runner see, organise, complete, and learn from their own
calendar of workouts. It does not present unsupported live coaching, connected
integration, weather, or biometric authority as fact.

Signed-out visitors see an explicitly untrusted preview. Authenticated runners use
one persisted schedule, workout history, and evidence-backed weekly readback.

## Canonical Plan And Workout Model

This is the accepted product rule. It supersedes every earlier description of a
source plan as a runner-facing calendar container.

- A **plan** is a source artifact only: an AI-generated proposal, an imported file,
  or a manually authored source used to propose the initial placement of workouts.
- Review and confirmation materialise scheduled workouts into the runner's calendar.
  From then on, each workout is a runner-owned calendar entity.
- Manual, AI-authored, and imported workouts are the same product entity. Their
  origin is durable provenance, never a separate calendar mode or an editability
  permission.
- Moving, copying, clearing, editing, completing, or adding a calendar workout acts
  on that workout and its supported schedule state. It does not edit, replace, or
  otherwise depend on a plan.
- A past plan can remain in history as the immutable source and provenance of its
  original proposal. It is not an active container, a current schedule boundary, or
  a prerequisite for calendar actions.
- The calendar is the runner's current truth. A runner may move eligible workouts to
  other eligible dates without an ongoing relationship to the source plan.

Physical names such as `plan_cycles`, `planned_workouts` and `active-plan-*` are retained
implementation facts only. They cannot restore plan-container authority in product behavior, copy,
fixtures or new logic.

## Main User Surfaces

- `/hub` is a standalone destination launcher, not a runner dashboard.
- `/` is the authenticated runner's current calendar and week orientation. A runner
  without a schedule enters setup; a runner with workouts sees their calendar.
- `/workout/$date` shows one calendar workout, its structure, result logging, FIT
  evidence, factual comparison, and bounded feedback when that evidence exists.
- `/progress` shows factual Activity History and evidence-backed progress facts; it
  does not present a universal readiness or fitness score.
- `/settings` stores runner profile and stable personal preferences. It does not own
  the calendar schedule.
- `/integrations` is a truthful status/reference utility, not primary runner
  navigation.
- `/hitoDS` is a public design-system reference. Its specimen state never reads or
  mutates runner, calendar, authentication, provider, or backend truth.

## Schedule Creation

1. A runner may begin with Quick setup, a manual workout, or an imported source.
2. AI and imports create a reviewable source proposal; manual creation creates a
   reviewable workout document. No source silently mutates the calendar.
3. Explicit confirmation materialises the accepted workout documents on selected
   dates. Conflict handling must be visible and preserve existing runner workouts.
4. After materialisation, the runner manages calendar workouts directly. There is no
   runner-facing source-level lifecycle for opening, replacing, or deleting the
   current calendar.
5. A new proposal may add new reviewed workouts or ask how to handle date conflicts;
   it must not take ownership of workouts already on the calendar.

## Workout Interaction Contracts

- Every confirmed non-rest workout scheduled today or later uses one reviewed
  content-edit lifecycle regardless of manual, AI, or imported provenance.
- Move, Add, Copy, Clear, and Edit are distinct actions with Backend-owned safety
  checks. The frontend never manufactures calendar mutation truth.
- Past, logged, skipped, evidence-backed, or otherwise protected workout states may
  be restricted only by their own operation-level safety rule, never by source
  provenance alone.
- Rest is a sparse calendar state, not a workout and not a plan placeholder.
- Workout results, body notes, FIT/ZIP evidence, normalized metrics, comparison, and
  AI insight remain distinct evidence layers. They preserve history rather than
  changing the source plan.

## Source, History, And Export

- Past Plans lists original source artifacts and their provenance. It is historical
  reference, not current schedule control.
- Export may describe selected calendar workouts or a historical source only when its
  label makes that scope explicit. Runtime completion, logs, provider evidence,
  comparison, and insight remain outside a source-plan export unless a separately
  specified export contract says otherwise.
- `training-plan-v2` remains a source/import contract, not the ownership boundary for
  future calendar activity.

## Truth And Availability Boundaries

- Authenticated saved mode is backed by Supabase; preview is intentionally untrusted.
- The first Basic/Pro entitlement foundation is backend-owned and pre-billing. There
  is no live Stripe billing, pricing, or subscription UI in this product slice.
- Estimated heart-rate guidance remains explicitly estimated until the runner supplies
  personal truth. Hito does not manufacture health or coaching authority.
- Preview, provider, and unavailable states use direct language such as `Preview`,
  `Later`, `Not connected`, or `Unavailable` rather than simulated live outcomes.

## Business Process Ownership

PRODUCT owns product policy and final acceptance for every process. Each process has one system
truth owner; presentation roles consume its public contract and never become a second writer.

| Business process                                     | Product owner | System/domain owner                      | Current boundary                                                                                 |
| ---------------------------------------------------- | ------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Public acquisition, authentication entry and locale  | PRODUCT       | Identity/Profile                         | FRONTEND Marketing presents public entry; saved identity remains server-owned                    |
| Onboarding, profile, settings and stable constraints | PRODUCT       | Identity/Profile                         | Profile facts do not own Calendar schedule                                                       |
| Manual, template, AI and file proposal               | PRODUCT       | Source Authoring/Provenance              | Produces reviewed `WorkoutDocument` content and immutable origin                                 |
| Saved review, Review and Confirm                     | PRODUCT       | Source Authoring, then Runner Calendar   | Confirm is the only Calendar materialisation boundary                                            |
| Add, Edit, Move, Copy, Clear and protection          | PRODUCT       | Runner Calendar                          | Acts on independent Calendar workouts                                                            |
| Completion, manual result, FIT and evidence          | PRODUCT       | Result/Evidence and Activity lifecycle   | Factual history never rewrites prescription provenance                                           |
| Activity History and factual Progress                | PRODUCT       | Runner Activity/Progress                 | Consumes versioned public facts with explicit missingness                                        |
| Blueprint and adaptive continuation                  | PRODUCT       | Training Decision and Source Authoring   | Future projections are non-workouts; sample-derived metrics remain unavailable until implemented |
| Entitlements, payments and financial actuals         | PRODUCT       | Entitlement/Commercial/Financial backend | Entitlement is pre-billing; paid subscriptions and provider policy remain future decisions       |
| Admin operations and work items                      | PRODUCT       | Admin/Identity backend                   | FRONTEND Product presents Admin; Notion alone owns Task lifecycle                                |
| Public marketing                                     | PRODUCT       | FRONTEND Marketing                       | MARKETING MANAGER and DESIGNER provide bounded research/decision input                           |
| Design System                                        | PRODUCT       | FRONTEND Design System                   | Shared tokens and primitives; no separate repository Design System owner                         |
| Local debugger and capture                           | PRODUCT       | FRONTEND DevTools                        | Loopback-only, non-persisting for runner data and absent from production imports                 |
| QA, environment and release                          | PRODUCT       | BACKEND and QA                           | Current runbooks own execution evidence; PRODUCT performs final acceptance                       |

## Product Design Boundary

All runner surfaces reuse canonical Hito design-system tokens, primitives, typography,
and documented patterns. Product-specific schedule, result, and evidence behaviour
remains Product/Backend-owned; `/hitoDS` is not a second runner lifecycle.
Product routes compose the shared system and do not invent route-local components, tokens, CSS
recipes or parallel interaction truth. A reusable visual gap belongs to the Frontend Design System
lane; DESIGNER owns visual direction and Design System Integration is Figma-only.

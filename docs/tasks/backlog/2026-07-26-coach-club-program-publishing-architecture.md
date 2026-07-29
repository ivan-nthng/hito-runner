# Coach, Club, And Program Publishing Architecture

## Work Item ID

2026-07-26-coach-club-program-publishing-architecture

## Status

ready

## Type

plan

## Priority

high

## Owner

backend

## Scope

program-publishing-and-adoption

## Batch

hito-roles-and-program-publishing

## Archive Intent

retain_in_place

## Next Recommended Role

backend

## Task

Implement the private Coach-to-runner connection and single-workout assignment foundation without
giving a Coach access to runner-owned data or calendar rows.

## Stage

BACKEND implementation ready. Product approved the relationship bootstrap and the first vertical
slice below.

## Exact Handoff Prompt

```text
ROLE: BACKEND

Task:
Implement Hito's private Coach-to-runner connection and single-workout assignment foundation.

Stage:
BACKEND implementation with integrated QA.

Canonical task:
/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/backlog/2026-07-26-coach-club-program-publishing-architecture.md

Accepted Product decision:
- Any authenticated Hito account may explicitly enable a Coach actor context for v1. It implies no
  certification, employment, payment, admin access, or access to runner data.
- A Coach may create a private connection invitation. A runner establishes the connection only by
  opening that private invitation while authenticated and explicitly accepting it.
- The runner may revoke the connection at any time. There is no public runner directory, broad
  email lookup, or Coach-initiated runner discovery by identifier.
- The first slice supports one private, structure-only workout offer to one connected runner. The
  runner may view, decline, or review and copy it into their personal calendar.
- A connection grants send-only offer authority. It never grants access to profile, HR, health,
  plans, logs, results, evidence, or private notes.

Required outcome:
- Implement durable server-owned Coach actor, private invitation, explicit runner connection,
  revocation, immutable single-workout version, addressed offer, and runner adoption boundaries.
- Authoring content is structure-only and profile-free: no personalized HR or pace prescription.
- Review loads the offer/version/connection server-side and signs recipient, connection, version,
  selected date, content, provenance, and expected runner plan revision.
- Confirm atomically consumes a valid pending offer and creates only runner-owned workout truth;
  it must not create a partial empty plan or workout on failure.
- Revocation or withdrawal blocks pending adoption without rewriting accepted runner history.
- Reuse canonical workout validation, review signing, active-plan persistence, and RLS patterns
  where ownership fits. Do not create a parallel calendar or plan store.

Boundaries:
- No Coach read access to runner-owned profile, HR, health, plan, planned workout, log, result,
  evidence, or private-note data.
- No Organization/Club, full-plan assignment, active-plan replacement, public links, payment,
  personalized targets, public API, OAuth client, token, or partner integration.
- No publisher direct write to runner plan rows; only the authenticated runner confirms adoption.
- Do not change existing manual/generated/imported plan behavior.

Autonomy:
Publish the required execution preflight before edits. Inspect existing auth/RLS, manual workout
grammar, reviewed action, atomic persistence, and current migration patterns. Use one bounded
independent QA subagent and one read-only INTEGRATION_MANAGER or security reviewer; integrate
evidence and fix same-owner findings before returning.

Definition of Done:
The local backend proves deny-by-default authorization, explicit invitation acceptance, revocation,
immutable version pinning, offer view/decline, server-loaded signed review, atomic runner adoption,
stale/withdrawn/duplicate refusal, provenance/readback, RLS isolation, and cleanup. Run
proportional migration, persistence/readback, validator, lint, build-integrity, and scoped-diff
checks. Report every executed and omitted check in `Check | Scenario / environment | Result | Evidence`.

Stop conditions:
Stop and return to Product if the first slice requires a decision about Coach identity disclosure,
commercial eligibility, sensitive-data sharing, active-plan replacement, or Club participation.
```

## Accepted Product Decision

The v1 relationship bootstrap is approved:

1. Any authenticated Hito account may explicitly enable an independent Coach actor context; this
   does not imply certification, employment, payment, or access to another runner's data.
2. A Coach may create a private connection invitation. The runner initiates the actual relationship
   by opening that invitation while authenticated and explicitly accepting it; the runner may revoke
   the connection at any time.
3. There is no public runner directory, broad email lookup, or Coach-initiated runner discovery by
   identifier.
4. The first vertical slice supports one private, structure-only workout assignment with an optional
   suggested date. The runner may view, decline, or review and copy it into their personal calendar.
5. The slice does not support full-plan assignment, active-plan replacement, Organization/Club,
   public links, personal pace or BPM prescriptions, or external API access.

This decision resolves the former Product blocker. The remaining architecture does not depend on
commercial-role policy, sensitive-data sharing, club participation semantics, or active-plan
replacement.

## Context And Current Boundary

Hito currently has one authenticated runner identity, one runner-owned active plan, and one
runner-owned calendar:

`runner input -> reviewed draft -> explicit confirm -> plan_cycles/planned_workouts -> logs/readback`

Current own-row RLS protects `runner_profiles`, `plan_cycles`, `planned_workouts`, and
`workout_logs`. A service-role backend may perform atomic lifecycle operations, but only after
server-owned authentication, authorization, review, and stale-state checks.

Coach, Organization, Club, published programs, assignments, event participation, public links, and
partner APIs are future-only. This plan introduces no runtime capability and does not change current
product truth in:

- [current product](../../current-product.md)
- [current system](../../current-system.md)
- [current state](../../current-state.md)
- [current functional map](../../current-functional-map.md)

## Architecture Decision

### One account, multiple actor contexts

`Runner`, `Coach`, `Organization member`, and `Club manager` are actor contexts, not mutually
exclusive account types.

- Runner ownership remains the default personal-data context.
- Coach authority is limited to content the Coach owns and assignments allowed by an explicit
  runner connection.
- Organization and Club authority is relationship-scoped to that Organization or Club.
- Commercial entitlement, admin access, and local/test roles must not become substitutes for these
  domain relationships.
- Actor authority must be resolved server-side from durable relationships, not from user-editable
  auth metadata or a frontend role switch.

### Four different product objects

| Object | Canonical owner | Purpose | Must not become |
| --- | --- | --- | --- |
| Coach assignment | Coach or Organization | Private offer pinned to one immutable content version and one runner | Direct write access to runner plan rows |
| Club event/schedule | Organization/Club | Communal event truth and published occurrences | A personal training plan or Rest/workout placeholder |
| Runner-owned snapshot | Runner | Confirmed personal copy persisted through current plan/workout lifecycle | A live subscription to publisher edits |
| Personal-calendar overlay | Runner participation read model | Show joined future events beside personal workouts | A second calendar or hidden `planned_workouts` mutation |

### Minimum durable concepts

These are logical domain boundaries, not approved table names:

- **Actor context:** authenticated account acting as Runner, Coach, Organization member, or Club
  manager.
- **Connection grant:** explicit, revocable runner authorization allowing one Coach to send offers.
  It grants no profile, HR, plan, result, log, or private-note visibility.
- **Program:** publisher-owned authoring container.
- **Program version:** immutable published content snapshot. A new edit creates a new version.
- **Assignment offer:** private addressed offer pinned to one program version and one runner.
- **Organization:** legal/operational publisher boundary such as a cafe.
- **Club:** community operated by one Organization.
- **Published schedule version:** immutable Club schedule publication.
- **Event occurrence:** communal date/time/location truth within a published schedule.
- **Participation:** runner's explicit join/decline/leave state for a Club or event.
- **Adoption:** runner-owned consent record linking an exact source version and reviewed digest to
  the resulting personal workout or plan snapshot.

No publisher object is a second personal plan store. Program versions and event occurrences are
source artifacts; only explicit runner adoption creates personal calendar truth.

## Consent And Authorization Contract

### Deny-by-default invariants

- A Coach cannot discover or address arbitrary runners.
- A connection grant allows sending assignments only. It does not allow reading runner data.
- An Assignment must resolve its recipient from a durable connection, never from a client-supplied
  arbitrary `runnerId`.
- Only the addressed runner may view, decline, or adopt an Assignment.
- Only the runner may cause mutation of their `plan_cycles`, `planned_workouts`, or logs.
- Organization membership grants only Organization-scoped administration.
- Club membership grants only Club/event visibility and participation allowed by that membership.
- No relationship implies profile, age, height, weight, HR, health, result, evidence, log, body
  note, or private-note access.
- Revocation immediately makes every pending offer under that connection non-adoptable. The runner
  may still view its historical snapshot and dismiss or decline it, but cannot confirm it.
  Revocation does not erase accepted history or mutate adopted snapshots.
- New exposed persistence must use deny-by-default RLS and server-owned authorization. Service-role
  access remains an implementation mechanism, never an actor permission.

### Minimal visibility matrix

| Actor | May see | Must not see by implication |
| --- | --- | --- |
| Runner | Their connections, offers, source identity/version, participation, adopted provenance | Other runners or publisher-private drafts |
| Coach | Own programs/versions, active connection identity, assignment delivery/decision state | Runner profile, HR, calendar, plan content, logs, results, notes |
| Organization admin | Organization members, Clubs, owned programs/schedules, bounded publication state | Runner personal data or unrelated Coach drafts |
| Club manager | Club schedule and minimum participation state needed to operate an event | Runner training, health, HR, logs, private notes |
| Future API principal | Only actions and resources granted through the same actor/relationship policy | Direct database or broader service-role access |

### Verb semantics

- **Accept connection:** establishes a send-only Coach relationship.
- **View assignment:** reads the exact offered version; no calendar mutation.
- **Decline assignment:** closes the offer; no source or runner data is deleted.
- **Copy/adopt assignment:** enters runner-owned review and explicit confirm, then creates a personal
  snapshot with source provenance.
- **Accept Club membership:** grants Club visibility only.
- **Join event:** adds an overlay participation, not a workout.
- **Leave/revoke:** stops future relationship effects, invalidates pending adoption authority, and
  retains historical offers and accepted snapshots.

## Versioning, Provenance, And Updates

- Published program and schedule versions are immutable.
- Assignment and participation records pin an exact version, not a mutable "latest" pointer.
- Publisher edits create a new version and, when relevant, a new update proposal.
- A pending offer may be withdrawn or expire. An adopted copy cannot be withdrawn by the publisher.
- Adoption records retain source type, publisher actor, program/schedule version, offer/occurrence,
  reviewed digest, confirmation time, and resulting runner-owned row identity.
- Runner edits after adoption make the current content runner-authored while retaining the original
  source chain and edit audit.
- A revoked Coach connection or Club membership blocks future offers/overlays but does not alter a
  confirmed workout, plan, log, or historical participation.
- A published occurrence has separate audited operational status such as scheduled or cancelled.
  Cancellation changes that status without rewriting its immutable schedule version. It never
  silently deletes a separately copied personal workout.

## Lifecycle Models

### Coach assignment

```text
runner grants Coach connection
  -> Coach authors draft
  -> Coach publishes immutable version
  -> Coach sends addressed offer
  -> runner views
      -> declines
      -> or reviews exact source snapshot
          -> confirms copy
          -> backend creates runner-owned workout/plan snapshot with provenance
```

Publisher update after offer:

```text
published version N -> new version N+1 -> new offer/update proposal
accepted version N remains unchanged
```

### Club schedule and calendar overlay

```text
Organization owns Club
  -> Club publishes immutable schedule version
  -> runner accepts membership or sees allowed event
  -> runner joins occurrence
  -> calendar read model projects event overlay beside personal workout
  -> runner leaves or event is cancelled
  -> overlay state changes; personal plan is untouched
```

Copying an event into a personal workout is a separate future reviewed adoption action, not a side
effect of joining.

## Existing Seams To Reuse

| Current owner | Safe reuse | Unsafe reuse |
| --- | --- | --- |
| [request auth context](../../../src/lib/backend/auth.ts) and [persisted runner resolver](../../../src/lib/request-persisted-user.ts) | Authenticate the principal and resolve the acting account | Encode Coach/Club authority in current runner/admin identity |
| Existing own-row [RLS foundation](../../../supabase/migrations/20260506025058_phase_2_phase_3_backend_foundation.sql) | Preserve runner ownership and deny-by-default posture | Add policies that let Coach select runner rows |
| [WorkoutDocument](../../../src/lib/workout-document.ts) and pure manual schema/normalization/validation | Canonical workout structure for assignment content | Reuse runner-bound manual review, persistence, or actions as Coach writes |
| [review token signing](../../../src/lib/review-token-signing.ts) and reviewed action patterns | Build an assignment-specific signed review over recipient, connection, offer, immutable version, selected date, content digest, provenance, and expected plan revision | Reuse the current manual checksum/token as assignment authority or trust client-supplied rows |
| [training-plan-v2 schema](../../../src/lib/imported-plan.ts) | Profile-free program snapshot validation and future full-plan adoption | Use advanced import action as the assignment endpoint or include runner profile/HR envelope |
| [active-plan persistence](../../../src/lib/active-plan-persistence.ts) and atomic lifecycle patterns | Persist only after the authenticated runner confirms adoption; atomically consume the offer and create any required empty manual plan, workout, and provenance | Let publisher call persistence for a target runner or split first adoption across multiple mutations |
| [active-plan transition](../../../src/lib/active-plan-transition-actions.ts) | Future explicit full-plan replacement after separate approval | Merge/replace an active plan when an offer is accepted |
| [plan export shaping](../../../src/lib/plan-export.ts) | Canonical structural serialization and stable source identifiers | Publish a runner's active-plan export wholesale; it may carry personal truth |
| Current calendar/readback projection | Merge future event overlays at read-model time | Store Club occurrences as `planned_workouts` |

Manual authoring primitives are useful content grammar. Personal saved templates, add/edit server
actions, and personal persistence remain runner-owned and cannot become publisher storage.

## Smallest Safe First Vertical Slice

### Private single-workout Coach assignment

The first slice proves every durable boundary without introducing full-plan replacement or Club
semantics:

1. A runner has explicitly granted one Coach a send-only connection.
2. The Coach authors one structure-only canonical WorkoutDocument with optional generic cues and a
   suggested date. No runner profile, personal HR, result history, private note, or personalized
   pace is available to the Coach.
3. Publishing creates one immutable version; sending creates one addressed offer.
4. The runner views the exact version and may decline or choose a today/future date.
5. Copy uses an assignment-specific server-owned review/confirm action. Review loads the offer and
   immutable version from persistence, validates current recipient/connection/offer state, and signs
   the exact content, selected date, provenance, and expected plan revision. It may reuse pure manual
   workout validation and shared signing, but not the manual checksum as assignment authority.
6. Confirm atomically consumes the pending offer and creates the runner-owned workout, provenance,
   and, only when needed, an explicit empty manual plan. Stale, withdrawn, revoked, duplicate, or
   failed adoption leaves no partial plan or workout.
7. Coach withdrawal or connection revocation makes a pending offer non-adoptable. Adopted content
   remains runner-owned and editable under current date-based rules.

When the runner has no active plan, the assignment review must disclose that confirmation will
create an empty manual plan containing the copied workout. That creation belongs to the same atomic
confirm mutation, not a preliminary side effect.

### Why this wins

- It delivers a real Coach-to-runner value loop.
- It avoids active-plan replacement and program-density decisions.
- It reuses canonical workout structure, review, confirm, and manual persistence.
- It proves relationship authorization, immutable versions, consent, provenance, revocation, and
  one-calendar projection in the smallest content unit.
- It does not require Organization, Club, public visibility, payments, sensitive sharing, or public
  API infrastructure.

## Rejected First Slices

- **Full plan assignment first:** adds schedule replacement, active-plan conflict, and coaching
  context policy before the relationship boundary is proven.
- **Club schedule first:** requires membership, event participation, cancellation, capacity, and
  overlay semantics before assignment consent is proven.
- **Coach writes directly into runner calendar:** violates runner ownership and review/confirm.
- **Use JSON import as sharing:** import has no publisher identity, recipient authorization, durable
  offer, version pin, or revocation contract.
- **Global `role = coach`:** cannot represent a person acting as Runner and Coach or Organization
  roles scoped to one resource.
- **Coach reads runner profile to personalize:** violates data minimization and creates unresolved
  health/privacy policy.
- **Live-sync accepted copies:** creates a second mutable owner for runner plan truth.
- **Public links or public API first:** expands abuse, identity, scope, and operational risk before
  internal domain actions are stable.

## Staged Roadmap

| Stage | Primary owner | Bounded outcome | Gate to advance |
| --- | --- | --- | --- |
| 0. Relationship decision | Product | Coach eligibility and private invitation acceptance semantics approved | Accepted Product decision recorded in this plan |
| 1. Private assignment backend | Backend | Actor/connection authorization, immutable single-workout version, addressed offer, assignment-specific signed review, atomic runner adoption/provenance, deny-by-default persistence | Backend validators, stale/revoked/partial-write proof, local migration/RLS proof, independent QA subagent; no UI |
| 2. Private assignment product UI | Frontend Product | Coach authoring/send surface and runner inbox/view/decline/review/copy using backend-owned states and Hito DS | Desktop/exact-375px browser, auth denial, persistence/readback, cleanup |
| 3. First-slice acceptance | QA | Cross-owner relationship, privacy, revocation, adoption, provenance, responsive, and cleanup matrix | Global QA Acceptance |
| 4. Full program publishing | Backend | Multi-workout immutable versions and explicit runner full-plan adoption using existing plan review/replacement | Separate Product approval for active-plan replacement UX |
| 5. Organization and Club decision | Product | Define commercial/admin roles, membership, event participation, and minimum visibility | Product contract recorded before schema or UI work |
| 6. Organization and Club backend | Backend | Implement Organization/Club/schedule/occurrence boundaries under the accepted contract | Authorization, RLS, versioning, and participation proof |
| 7. Club calendar overlay | Frontend Product | Project joined events into the one calendar without changing personal workouts | Overlay/readback and leave/cancellation QA |
| 8. External boundary readiness | Integration Manager | Confirm stable transport-neutral actions, scopes, idempotency, observability, and revocation before any API design | Separate Product approval for public API/provider work |

Stages are sequential gates, not one implementation batch. Each execution owner completes local
validation with internal reviewers; Product is not the relay between implementation and QA.

## Future Public-API Readiness Principles

No endpoint, OAuth client, token, API key, webhook, or plugin platform is designed by this plan.
Internal domain actions should nevertheless be ready for a future transport adapter:

- authenticate a principal, then resolve actor context and relationship-scoped authority;
- accept typed domain commands rather than database rows;
- use stable opaque resource IDs, immutable version IDs, idempotency, and expected-revision checks;
- return bounded typed outcomes for denied, stale, withdrawn, expired, or confirmed actions;
- preserve source provenance, consent, and audit timestamps;
- keep secrets and service-role access server-side;
- expose only the minimum resource fields allowed by the same internal policy;
- make revocation effective for future actions without rewriting durable history;
- keep transport, rate limits, partner credentials, and webhook delivery outside domain logic.

A future API must call the same approved application actions as Hito UI. It must not become a second
authorization model or direct database facade.

## Definition Of Done

Architecture planning is complete when:

- The accepted relationship-bootstrap rules at the top of this plan remain the implementation
  boundary unless Product explicitly reopens them;
- the four domain objects and runner-owned snapshot boundary remain distinct;
- the first slice creates no second personal plan/calendar store;
- consent, version pinning, provenance, revocation, and no-sensitive-sharing invariants are explicit;
- assignment review is server-loaded and signed, and confirm has one atomic persistence boundary;
- schedule-version immutability and occurrence cancellation state cannot become competing truths;
- existing seams are reused only within their current ownership;
- Club and public API work remain deferred behind their own decisions;
- Backend receives one bounded first implementation scope.

## Architecture Validation Inventory

| Check | Scenario / environment | Required result |
| --- | --- | --- |
| Current boundary scan | Current docs and source | Coach/Club/API remain future-only; one active plan remains canonical |
| Auth/RLS review | Current migration and request auth source | Own-row runner boundary preserved; no current Coach authority claimed |
| Lifecycle review | Review/confirm, active-plan, manual, import/export source | Reuse and unsafe-reuse boundaries are exact |
| Integration review | Consent/version/revocation/API boundary | No implied data access or second authorization path |
| Source links | All linked repository paths | Existing and resolvable |
| Admin importer | Dry-run only | Canonical metadata parses; no Supabase writes |
| Diff hygiene | This Markdown file and generated dashboard if refreshed | No whitespace errors |

Runtime, browser, provider, migration, and hosted Supabase checks are intentionally out of scope
because this task changes documentation only.

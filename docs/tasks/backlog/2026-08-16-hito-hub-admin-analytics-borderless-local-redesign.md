# Hito Hub Admin Analytics Borderless Local Redesign

Work Item ID: \`6835b106-7679-4e7e-b024-f712843c5ab8\`
Status: in_progress
Type: Tracked
Priority: high
Owner: PRODUCT
Epic: owner-analytics-and-scenario-lab
Parent: [Admin Overview, Financial Model, And QA Fixture Redesign](./2026-08-15-hito-admin-overview-information-architecture-and-qa-fixture-redesign-intake.md)
Evidence From: [Admin Overview, Financial Model, And QA Fixture Redesign](./2026-08-15-hito-admin-overview-information-architecture-and-qa-fixture-redesign-intake.md)
Scope: The existing local Hub Admin Analytics route, \`/admin/analytics\`: its Overview and Funnel &
Usage compositions, the current local summary/card recipe, and legacy plan-authority columns in the
Users table. This is not a new Admin product, a Runner Calendar surface, a financial implementation,
or a hosted change.
Archive Intent: Retain through the serial FRONTEND consumer migration, BACKEND contract removal, and
focused acceptance of the existing local Admin Analytics surface.
Stage: BACKEND cleanup complete; fresh build and browser acceptance pending
Next Recommended Role: PRODUCT

## Task

Redesign the existing Hub → Admin → Analytics experience using the completed Designer audit. Replace
the equal-weight bordered stat-card treatment with question-led borderless groups using existing Hito
contracts. Remove visible current-plan authority from Overview, Funnel & Usage, and Users. Retain
operational tables and only factual current product readback.

## User Report

Ivan clarified that the target is the current local Hub Admin panel containing user counts and
analytics. There is no second Admin surface and no Calendar UI belongs here. Financial modelling,
billing, hosted Admin changes, and a separate owner cockpit are explicitly out of scope.

## Evidence

- Designer audit and exact visual/data contract: [parent canonical item](./2026-08-15-hito-admin-overview-information-architecture-and-qa-fixture-redesign-intake.md).
- Current visible defect: equal-weight cards render availability copy such as \`Unavailable\` through
  a numeric slot, causing a demonstrated collision.
- Backend census: Admin derives active-plan/proxy metrics from \`plan_cycles\` and
  \`planned_workouts\`, while accepted current runner authority is independently owned Calendar
  workouts; plans are source provenance only.

## Accepted Product Direction

1. The target route is **only** \`/admin/analytics\` in the Hub Admin workspace. Do not add, embed, or
   navigate to a Runner Calendar from Admin.
2. Retain Data readiness, direct runner/profile/activity facts where presently canonical, Workout
   evidence, and AI/entitlement operations. Users and Test Accounts stay operational tables.
3. Remove current-plan/active-plan activation proxies, rough completion rate, plan source/schema
   mixes, and Users-table \`Active plan\`/\`Plans\` columns. Do not retain a migration-diagnostics UI.
4. No Financial Actuals, Forecast Lab, finance placeholders, billing, prices, scenarios, or QA
   finance fixtures are part of this task.
5. Use existing Hito Dark/Light surface roles, typography, spacing, radius, table, status, focus,
   and state surfaces. The dark composition uses existing near-black tokens; Light remains
   theme-resolved. No raw black, local alpha recipe, new Card family, new CSS framework, or new
   Design System primitive is admitted.

## Demonstrated Cause

\`AdminAnalyticsSummarySections.tsx\`, \`AdminAnalyticsPanels.tsx\`, and the Users consumer render
legacy plan-shaped fields as ordinary current product facts. \`MetricCard\` renders status text through
a fluid numeric value slot. The source query is Backend-owned, but the current consumer removal and
local visual composition are first owned by FRONTEND Product; Backend must not retain aliases or a
parallel compatibility projection after this stage.

## FRONTEND Stage Outcome

- Replace the equal-card hierarchy with borderless question-led groups composed from existing Hito
  roles: labels, numeric readbacks, technical period/source text, tables, status pills, and
  \`hito-state-surface\` for nonnumeric states.
- A number, unit/helper, period/source, and availability/error state are separate elements. Never
  pass a state word into numeric metric typography.
- Remove all direct consumers of rejected active-plan, activation, completion, plan-source, and
  plan-schema fields from Overview, Funnel & Usage, and Users.
- Keep current operational tables, section navigation, shell/sidebar/header edges, focus, table
  containment, and truthful evidence/entitlement readbacks.
- Delete/reduce the superseded local \`hito-analytics-stat\*\` recipe where it becomes unreachable;
  do not replace it with another card abstraction.

## Boundaries

- No Admin route expansion, Calendar UI, Backend read-model edit, schema/migration/RLS change,
  fixture mutation, finance/billing/forecast logic, hosted action, provider call, translation work,
  or Git lifecycle action.
- Do not client-derive a substitute Calendar count or compatibility map. If a required direct fact
  is absent from the current view shape, render the existing truthful state or return the missing
  Backend discriminator to PRODUCT.
- If reuse requires a genuinely shared status-aware metric contract with a demonstrated second
  consumer, stop and route a separate DESIGN SYSTEM task. Do not create an Admin-local primitive.
- The named QA role currently owns the shared managed runtime for Runner Core work. This stage must
  not start, rebuild, reset, seed, or mutate that runtime/fixture until PRODUCT confirms it is idle.

## Validation Expectations

Fresh source ownership preflight; focused component/style/type checks; Prettier, ESLint, and
\`git diff --check\`; then a managed local Admin browser matrix only after a fresh, serialized
\`qa_fixture\` is admissible. Acceptance covers desktop/mobile, Light/Dark, state separation,
Users/Test-account operation preservation, keyboard/focus, table containment, and console health.

## Current Designer Audit Stage

The first audit correctly established the card and data-authority direction but did not provide the
complete UI inventory Ivan requested. DESIGNER must refresh this task itself with one comprehensive
source-backed issue ledger for the existing Hub Admin Analytics route.

The audit covers every current `/admin/analytics` section and shared shell surface that it renders:
route hierarchy; navigation and section selection; page/section titles and supporting copy;
typography roles; spacing, padding, margins, radius, fill, chrome, and responsive behaviour; metric
groups; states; tables; filters; actions; empty/error/loading/provenance readback; and all
plan-shaped or other legacy data claims.

For every finding, record the visible or source-backed evidence, severity/impact, first canonical
owner, whether it should be retained, removed, restyled, relabelled, moved, or await Backend truth,
the existing Hito DS contract to reuse, and a concrete acceptance observation. Distinguish a visual
issue from a legacy data-authority issue. Do not make an issue disappear by calling unavailable data
zero or by inventing a frontend-derived metric.

The output must prioritize P0/P1/P2 work and yield one implementation-ready FRONTEND scope. It must
not revive the deferred finance/billing/forecast work or turn this local Hub Admin audit into a new
Admin product.

### Exact Handoff Prompt

```text
ROLE: DESIGNER

Task: Hito Hub Admin Analytics comprehensive local audit refresh
Mode: Tracked, read-only discovery
Canonical item: docs/tasks/backlog/2026-08-16-hito-hub-admin-analytics-borderless-local-redesign.md
Stage: DESIGNER comprehensive local Admin Analytics audit refresh

Read AGENTS.md, agents/designer.agent.md, and skills/hito-frontend-design-system/SKILL.md. Work
only in this canonical item. The target is exactly Hub → Admin → Analytics (`/admin/analytics`), not
a new Admin, not Runner Calendar UI, and not financial/billing/forecast implementation.

The previous audit established the borderless-card direction but was not a complete UI inventory.
Inspect the current authored source and available saved evidence for every Admin Analytics section
and its shared shell surfaces. Produce one compact, source-backed P0/P1/P2 ledger covering: hierarchy
and navigation; titles/copy; typography; spacing/padding/margins; fill/chrome/radius; responsive
containment; metric groups; states and provenance; tables, filters, and actions; plus all plan-shaped
or other legacy data claims. For each issue state the evidence, first owner, retain/remove/restyle/
relabel/move/await-Backend disposition, existing Hito DS contract to reuse, and concrete acceptance
observation.

Confirm where the current route already follows Hito DS so implementation does not rewrite healthy
surfaces. Separate visual defects from data-authority defects. Do not introduce a Card family, raw
colour system, local DS primitive, Calendar UI, finance/billing/forecast design, fixture data, code,
CSS, tokens, schema, browser/runtime work, or hosted action. Missing data must remain a truthful
state, never zero or a client-derived substitute.

Update only this item with the refreshed audit and an implementation-ready FRONTEND scope. Validate
local Markdown links, scoped Prettier, and git diff --check. Return the next owner and all validation
layers not run. Do not claim browser, QA, build, hosted, release, deployment, Figma, or financial
acceptance.
```

## Serial Follow-up

After FRONTEND has removed all rejected consumers, PRODUCT routes BACKEND to remove the legacy
fields and replace only admitted direct facts in the existing Admin read model. FRONTEND then adopts
that final backend-shaped contract if needed. No compatibility alias is allowed between stages.

## Prepared Frontend Handoff

\`\`\`text
ROLE: FRONTEND

Lane: Product
Task: Hito Hub Admin Analytics Borderless Local Redesign
Mode: Tracked
Canonical item: docs/tasks/backlog/2026-08-16-hito-hub-admin-analytics-borderless-local-redesign.md
Stage: FRONTEND Product consumer and visual adoption

Read AGENTS.md, agents/frontend.agent.md, and skills/hito-frontend-design-system/SKILL.md before
acting. Read the refreshed Designer audit in this item and the accepted direction in the parent
item. The target is exactly Hub → Admin →
Analytics (\`/admin/analytics\`), not a new Admin, not a Runner Calendar UI, and not financial/billing
work.

Use existing Admin Analytics components and local recipe seams. Replace equal-weight bordered stat
cards with a small number of borderless, question-led groups using existing Hito Dark/Light surface,
typography, spacing, radius, table, status, focus, and state contracts. A numeric value, helper/unit,
period/source, and unavailable/error state must be separate; never render a status string through a
numeric metric role. In Dark use canonical near-black surfaces; Light stays semantic. Do not create a
Card family, raw colour recipe, generic framework, or DS primitive.

Remove all direct Overview, Funnel & Usage, and Users-table consumers of active/current-plan,
plan-shaped activation proxies, rough completion rate, plan source/schema mix, and Users \`Active
plan\`/\`Plans\` columns. Keep section navigation, shell/sidebar/header structural edges, Users/Test
Accounts operational tables, evidence pipeline facts, AI/entitlement operations, keyboard/focus,
and table containment. Do not add Calendar UI or client-derived Calendar facts. If an admitted direct
fact is absent from the current Backend shape, use a truthful existing state or return the exact
Backend discriminator to PRODUCT.

Do not edit Backend read models, schema/migrations/RLS, fixtures, financial/billing/forecast logic,
hosted state, providers, translations, or Git lifecycle. The named QA role currently owns the shared
managed runtime; do not start/rebuild/reset/seed it. Run source/static validation only while it is
active, and record browser proof as deferred instead of waiting for Ivan or contending with QA.

Before writing, record the exact existing seams, no new runtime artifacts, and the obsolete
hito-analytics-stat responsibility to remove/reduce. Use a bounded read-only DESIGNER check only if
an audit ambiguity materially affects the accepted visual direction; do not delegate implementation.
Promote/return to PRODUCT if a shared DS contract, backend field, or another production owner is
actually required. Update only the canonical item with a truthful English receipt and next owner; do
not claim Global QA, hosted, release, or deployment readiness.
\`\`\`

## 2026-08-16 Comprehensive Local Admin Analytics Audit Refresh

### Stage Receipt And Evidence Boundary

The DESIGNER refresh is complete. The inspected snapshot was
`abd4fe8355e3c644095111a654c1560aa265d104` on `main`; the checkout already contained broad dirty
work. Pre-write hashes were captured for this item, the saved evidence, and 18 current route,
component, read-model, entrypoint, and CSS owners. No new runtime artifact is proposed. The later
FRONTEND change reuses the existing Admin Analytics route, summary components, operational table
components, workbench shell, semantic tokens, and local Admin CSS seam; it deletes or reduces the
rejected consumers and `hito-analytics-stat*` responsibility.

Available visual evidence is one saved Light desktop Funnel & Usage capture. It proves the
equal-card hierarchy and the `Unavailable` collision. No saved Dark, mobile, Overview, Feedback, AI,
Users, or Test Accounts capture exists. Findings for those surfaces are authored-source evidence,
not browser acceptance.

| Surface           | Current owner                                                                                                   | Current composition and audit boundary                                                                                                                                                                                                    |
| ----------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared shell      | `AdminWorkspaceNav.tsx`, `admin-workspace-nav-model.ts`, `reference-workbench.css`, `shell-admin-analytics.css` | Desktop sidebar, sticky topbar, mobile horizontal rail, account menu, theme/language controls, and section selection are shared by all Analytics sections.                                                                                |
| Overview          | `AdminAnalyticsSummarySections.tsx`, `AdminAnalyticsPanels.tsx`                                                 | Six equal stat cards mix direct counts, nullable source state, and rejected plan-shaped counts.                                                                                                                                           |
| Funnel & Usage    | Same summary owners                                                                                             | Six stat cards plus four secondary card/list surfaces mix one direct profile fact, legacy active-plan proxies, a legacy completion denominator, outcomes, and plan diagnostics.                                                           |
| Feedback          | Same summary owners                                                                                             | Six stat cards repeat values in a second four-stage readback; source names do not prove a Garmin-only population.                                                                                                                         |
| AI & Entitlements | Same summary owners                                                                                             | Two stat cards plus entitlement and capability rows; AI insight count is repeated from Feedback.                                                                                                                                          |
| Users             | `admin.analytics.tsx`, `admin-analytics-view-model.ts`, `AdminOperationalComponents.tsx`                        | Search/filter/sort table with direct user facts and three visible plan-shaped responsibilities.                                                                                                                                           |
| Test accounts     | `admin.analytics.tsx`, `admin-analytics-view-model.ts`, `AdminOperationalComponents.tsx`                        | Separate local/excluded identity operations, including protected deletion, local-password provenance, filters, and inline action states. It is not a product-analytics data source.                                                       |
| Data contract     | `admin-analytics.ts`, `admin-analytics.server.ts`, `admin-analytics-format.ts`                                  | The read model separates real/excluded users and exposes direct product facts, but also promotes `plan_cycles`, `planned_workouts`, and `activePlanUserIds` into current authority. Nullable formatters emit `Unavailable` as value text. |

### Healthy Hito Contracts To Retain

These surfaces already follow Hito DS and must not be rewritten as part of the borderless summary
change:

- workbench shell, 15rem desktop sidebar, semantic Dark/Light canvas, sticky header, and structural
  sidebar/header hairlines;
- active navigation with `aria-current`, active dot/chrome, horizontal mobile containment, and
  canonical focus ring;
- Hito logo, account trigger, DropdownMenu, theme/language controls, and sign-out/back actions;
- canonical `hito-ui-title-*`, body, label, technical, icon, button, field, status-pill, and
  `hito-state-surface` roles;
- route-level authentication/analytics error state with semantic tone and recovery actions;
- real-user versus test/excluded-user separation, explicit table captions, `scope="col"`,
  `aria-sort`, labelled search, column menus, active-filter removal, row-count readback, and
  horizontal table containment;
- Test Accounts protected/deletable distinctions, exact-email confirmation, disabled/pending
  behavior, `role="alert"`, and polite success announcement; and
- semantic Foundation colours: Dark canvas `--color-surface`/groups `--color-background`, Light
  canvas `--color-background`/groups `--color-surface`, theme-resolved foreground hierarchy, and
  canonical status/focus colours. No raw near-black or local alpha formula is needed.

### P0 Ledger — Authority Or Legibility Failures

| ID    | Area / type                                     | Evidence and impact                                                                                                                                                                                                                                                     | First owner                                                                                   | Disposition                                                                                                                                                                                                                                         | Existing DS contract                                                     | Acceptance observation                                                                                                                                                                               |
| ----- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0-01 | Metric state / visual defect                    | `formatNullableCount` and `formatNullablePercent` return `Unavailable`; `MetricCard` passes that string to fluid `.hito-analytics-value`. The saved 1470px Light capture shows two values colliding across card boundaries.                                             | FRONTEND: `AdminAnalyticsPanels.tsx` and summary consumers                                    | Remove the string-valued metric API. A numeric value/unit, helper, source/period, and unavailable/error state are separate elements.                                                                                                                | Numeric metric/technical roles plus `hito-state-surface` and status pill | At every width/theme, a number occupies the numeric slot or the complete metric is replaced by a labelled state; `Unavailable` never receives metric typography and no text overlaps.                |
| P0-02 | Overview / data-authority defect                | `Active plans`, `Archived plans`, and `Planned workouts` are sourced from `plan_cycles`/`planned_workouts`, contrary to the accepted independently owned Calendar-workout model.                                                                                        | BACKEND read model is the first incorrect truth owner; FRONTEND is the first visible consumer | FRONTEND removes these cards now and does not substitute Calendar counts. BACKEND later deletes the fields after consumer removal.                                                                                                                  | Existing group, metric, and truthful state composition                   | Overview contains no current-plan, archive-plan, or planned-workout claim; missing direct Calendar facts are absent or explicitly unavailable, never client-derived.                                 |
| P0-03 | Funnel, navigation copy / data-authority defect | `Users with/without active plan`, `Setup to active`, rough `Completion rate`, active users without logs, 30-day active-plan users, plan source mix, and schema versions all depend on legacy plan authority. Route/section copy calls these canonical activation facts. | BACKEND read model for truth; FRONTEND summary/nav copy for visible claim                     | Remove every rejected metric and diagnostic. Relabel `Funnel & Usage` to `Activity`, title to `Profiles and workout logging`, and describe only direct profile/log/outcome facts. Await Backend for any future activation or completion definition. | Page title/body roles, direct metrics, compact rows, state surface       | No active-plan, activation, completion, source-mix, schema-version, or plan-denominator copy remains in navigation or section content. The remaining section names its actual population and period. |
| P0-04 | Users / data-authority defect                   | Filter state, active-filter labels, sort keys, column menus, `Active plan`, `Plans`, active/archived counts, and `planned` count all consume legacy fields.                                                                                                             | FRONTEND: route and `admin-analytics-view-model.ts`; BACKEND fields remain serial follow-up   | Remove the active-plan filter/sort/column, Plans sort/column, and planned-workout subcount. Keep direct Profile, Workout logs, last log, evidence, and entitlement facts.                                                                           | Existing Admin table, toolbar, column menu, status, technical readback   | Search/filter/sort has no rejected key; the table exposes only admitted direct columns and remains operable without a compatibility alias.                                                           |
| P0-05 | Overview/Funnel titles / copy-authority defect  | `Existing product truth`, `Top-level counts from ... plan ...`, and `canonical Hito rows` present a mixed legacy projection as accepted truth.                                                                                                                          | FRONTEND summary copy                                                                         | Relabel after P0 removals: Overview `Product snapshot`; supporting copy names direct auth/profile/log facts and source readiness.                                                                                                                   | `hito-ui-title-xs`, `hito-body-md`, technical provenance                 | Copy makes no plan/activation authority claim and does not imply a time trend from lifetime counts.                                                                                                  |

### P1 Ledger — Hierarchy, Responsive, State, And Provenance Repair

| ID    | Area / type                                       | Evidence and impact                                                                                                                                                                         | First owner                                                                           | Disposition                                                                                                                                                                                                                   | Existing DS contract                                                       | Acceptance observation                                                                                                                            |
| ----- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1-01 | Summary hierarchy / visual                        | Every metric receives an 8rem bordered card, equal visual weight, and an individual translucent recipe. `KeyCountList` adds another bordered `hito-surface-flat` layer.                     | FRONTEND summary composition and existing local Admin CSS seam                        | Replace per-number cards with 2–3 question-led borderless parent groups. Delete unreachable `MetricCard`, `MetricGrid`, and `hito-analytics-stat*` responsibilities; do not add a Card family.                                | Semantic background/surface pairing, radius-xl, spacing, metric/list roles | No decorative metric perimeter remains; related values scan as one group and a single number is not mistaken for a standalone destination.        |
| P1-02 | Heading hierarchy / typography                    | Topbar h1, repeated section eyebrow, and section h2 repeat the same destination; h1 and h2 both use `hito-ui-title-md`. Mobile also repeats the active destination in location meta and h1. | FRONTEND shell consumer and `AnalyticsPanel`                                          | Retain one h1 in the sticky header. Remove same-word eyebrows; group headings use `hito-ui-title-xs`. Keep mobile location context but do not repeat the active label twice in the same header.                               | `hito-ui-title-md`, `hito-ui-title-xs`, `hito-label-md`, body roles        | One accessible page title exists; the visual order is page title → group title → label/value, with no repeated section name.                      |
| P1-03 | Route geometry / spacing                          | Route uses 20/32/40px inline gutters while canonical `hito-route-gutter` is 16/24px; route `py-8` plus panel `pt-6` creates a 56px initial offset.                                          | FRONTEND route composition                                                            | Reuse canonical gutter; use 24px vertical padding narrow and 32px desktop. Groups use 16px padding narrow, 24px from 768px, 12/16px internal gaps, and 24/32px section gaps.                                                  | `hito-route-gutter`, `--space-3/4/6/8`                                     | Content alignment matches header/rail, mobile width is not wasted, and the first group starts at the specified rhythm without double top padding. |
| P1-04 | Fill/chrome/radius / visual                       | Current stat/list parents use hairlines and local translucent mixes even when parent spacing already establishes grouping.                                                                  | FRONTEND local Admin composition                                                      | Group radius is `--radius-xl` (10px), border 0, shadow 0. Dark group uses `--color-background` on `--color-surface`; Light group uses `--color-surface` on `--color-background`. Preserve structural shell/table/focus edges. | Existing semantic tokens and radius; no new token/class family             | Dark is near-black from Foundation roles, Light remains warm semantic, and only meaningful structural/interactive edges remain.                   |
| P1-05 | Snapshot provenance / data semantics              | `Generated` floats at section top-right, but `generatedAt` is route-build time, not per-source freshness or reconciliation. Users/Test Accounts omit it.                                    | FRONTEND copy/layout; Backend lacks per-source timestamps                             | Relabel `Snapshot generated`, place it in compact section/source meta, and never call it source freshness. Missing per-source freshness remains unavailable.                                                                  | `hito-technical-sm`, secondary/tertiary text, status readback              | The timestamp is visibly qualified as snapshot time and cannot be read as “all sources fresh.”                                                    |
| P1-06 | Feedback / duplication and source specificity     | Result assets, metrics, comparisons, and AI insights appear once as cards and again as pipeline steps. The query does not select a provider/source field, so `Garmin` is not source-proven. | FRONTEND summary copy/composition; Backend if provider segmentation is later required | Relabel section `Workout evidence`. Use one `Evidence processing` group (uploaded, parsed, failed) and one `Enrichment` group (metrics ready, compared, AI ready). Do not present conversion rates.                           | Compact rows, semantic warning status, technical counts                    | Each count appears once, failed parse is semantic, and no Garmin-only or sequential-conversion claim appears without Backend evidence.            |
| P1-07 | AI & Entitlements / duplication and meaning       | `Workout AI insights` duplicates Feedback. `Capability keys used` is the length of aggregate keys, while rows contain total usage and users.                                                | FRONTEND summary composition/copy                                                     | Remove the duplicate insight metric and key-count card. Retain entitlement tier/status rows and capability rows; label totals as recorded aggregate usage, not credits, grants, billing, or cost.                             | Compact count rows, status pills, technical values                         | AI section contains no duplicate insight total and no commercial/financial inference.                                                             |
| P1-08 | Empty states / truthful state and table semantics | `No rows yet.` does not say whether a successful source is empty. Users and Test Accounts render an `EmptyPanel` and still render the empty table shell when filters return zero rows.      | FRONTEND panels/routes                                                                | Use source-specific successful-empty copy. When filtered results are empty, render one state surface instead of a second empty table; preserve filter controls so the state can be cleared.                                   | `hito-state-surface` data-size md, body/status roles, toolbar              | Successful zero, unavailable, and error are distinguishable; empty filters show one state and a clear path, not state plus empty headers.         |
| P1-09 | Users recency / client-derived state              | `Last activity` is only `lastWorkoutLogDate`; `isRecentActivity` compares it to live client `Date.now()`, while other snapshot logic uses server time.                                      | FRONTEND view model                                                                   | Relabel `Last workout log`; anchor the 30-day filter to existing `generatedAt` passed from the view, or remove Recent/Older until a single snapshot anchor is used. No Backend field is required for the anchor.              | Technical date, explicit filter labels                                     | A boundary timestamp produces the same filter result during the snapshot; the label never implies broader activity.                               |
| P1-10 | Users responsive containment                      | Eight columns force `hito-data-table-min-xl` (80rem). Plan-column removal materially reduces width, but current static min remains.                                                         | FRONTEND route/table composition                                                      | Re-evaluate to the existing min-lg/min-md contract after admitted columns remain; keep horizontal scroll, do not shrink controls or truncate decision labels. Test Accounts keeps its wider operational table.                | Existing `hito-data-table-scroll` and min-width tiers                      | Users table has no page-level overflow at narrow widths and does not retain space for deleted columns; Test Accounts remains scroll-contained.    |
| P1-11 | Mobile navigation / target and repetition         | Quick links are 2rem high; mobile header repeats workspace, destination meta, h1, and section eyebrow.                                                                                      | Shared workbench CSS is DESIGN SYSTEM-owned; FRONTEND can remove consumer repetition  | FRONTEND removes repeated content. The 44px target-size change is a separate DESIGN SYSTEM seam if the existing quick-link contract cannot be adjusted without affecting `/hitoDS`.                                           | Existing quick-link, focus ring, horizontal rail                           | No duplicated destination copy. Links remain horizontally reachable and focus-visible; target-height change is not patched route-locally.         |
| P1-12 | Entitlement fallback / provenance                 | A missing entitlement row is rendered as tier `pro`, status `effective`, source `missing row effective pro`; it can look like an explicit commercial entitlement.                           | BACKEND policy owns the fallback; FRONTEND owns presentation                          | Retain current effective behavior but label it `Effective Pro — no entitlement row` and keep it visually distinct from explicit rows. Await Backend/Product if the fallback policy itself changes.                            | Status pill plus body/technical provenance                                 | Explicit and fallback entitlement sources cannot be confused; neither is labelled paid, subscribed, credited, or billed.                          |

### P2 Ledger — Bounded Polish Or Required Future Discriminator

| ID    | Area / type                         | Evidence and impact                                                                                                                                                                                     | First owner                          | Disposition                                                                                                                                                              | Existing DS contract                                                       | Acceptance observation                                                                                                             |
| ----- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| P2-01 | Toolbar filter summary / affordance | Toolbar `Filters` is disabled when no active summary filter exists although column-header menus still offer filters. Source behavior is coherent but the label can imply that filtering is unavailable. | FRONTEND operational copy            | Retain column menus. Relabel summary action to `Active filters` or hide it until one exists; do not duplicate column filters into a new toolbar system.                  | Existing button/menu/active-filter rows                                    | Initial state does not show a disabled misleading Filters action; active filters remain discoverable and removable.                |
| P2-02 | Machine-key labels / copy           | `formatKey` only replaces underscores, so provider/capability/status keys remain raw operational strings.                                                                                               | FRONTEND formatter/copy              | Retain truthful raw key when no approved label exists; optionally add an explicit display label only for known current keys, never a second data mapping.                | Body/technical roles                                                       | Unknown keys remain intact and readable; no key is silently renamed into a different meaning.                                      |
| P2-03 | Loading / evidence gap              | The route is loader-backed and has no route-local loading component in the inspected source. No saved/runtime evidence proves a blank or broken pending state.                                          | FRONTEND route/runtime discriminator | No source change in this slice. Later browser acceptance observes section navigation under pending load; route only adds a loading state if a visible gap is reproduced. | Existing router pending behavior, progress/state contracts if later proven | Browser evidence either confirms stable pending navigation or records the exact missing state; this audit does not invent one.     |
| P2-04 | Test Accounts visual scope          | The section already uses truthful state surfaces, table contracts, status, protected actions, and local-password provenance. Its only shared hierarchy issue is the repeated heading/eyebrow.           | FRONTEND section wrapper             | Retain operations byte-for-byte except shared heading cleanup and filtered-empty duplication.                                                                            | Existing table/field/button/status/state contracts                         | Search, filters, delete confirmation, disabled/pending, error/success, and protected rows behave unchanged after summary redesign. |

### Fixed FRONTEND Visual And Responsive Contract

- **Canvas:** retain `hito-workbench-main`: Dark `--color-surface` (`stone-850`), Light
  `--color-background` (`linen-100`). Sidebar remains the semantic `--color-sidebar` layer.
- **Borderless groups:** Dark `--color-background` (`stone-900`), Light `--color-surface`
  (`linen-50`), `--radius-xl` = 10px, no perimeter border/shadow, 16px padding below 768px and 24px
  from 768px. This is a reduction inside the existing Admin seam, not a reusable Card primitive.
- **Typography:** one page `hito-ui-title-md`; group `hito-ui-title-xs`; descriptive copy
  `hito-body-md`; labels `hito-label-md`; numeric truth only in the existing mono metric role;
  dates/source/period `hito-technical-sm`; state explanation `hito-body-xs`.
- **Rhythm:** route inline gutter 16px below 640px and 24px thereafter; vertical route padding 24px
  narrow/32px desktop; group internal gap 12px narrow/16px wide; group-to-group gap 24px
  narrow/32px wide. Remove the current stacked `py-8` plus `pt-6` offset.
- **Metric containment:** narrow layouts use label-left/value-right rows; from 768px, admitted
  numeric readbacks may use two columns; from 1024px they may auto-fit at a 10.5rem minimum only
  when every item is numeric. States always span the group width.
- **Edges:** retain sidebar/header separators, focus rings, active/selection evidence, and table row/
  column containment. Remove only decorative summary-card/list perimeters.
- **Tables:** preserve semantic table markup, toolbar wrapping, horizontal scroll, popover bounds,
  and readable control sizes. Do not convert Users or Test Accounts to cards on mobile.

### Implementation-Ready FRONTEND Product Scope

The next implementation is one serial FRONTEND Product stage inside existing files:

1. `AdminAnalyticsSummarySections.tsx`: apply the exact Overview, Activity, Workout Evidence, and AI
   dispositions above; remove all rejected plan consumers and duplicate counts.
2. `AdminAnalyticsPanels.tsx`: replace string-valued `MetricCard` composition with numeric/state-
   separated groups, source-specific empty copy, and the fixed typography/rhythm. Delete components
   made unreachable rather than preserving compatibility wrappers.
3. `admin.analytics.tsx`: remove Users plan columns/filters/sorts/planned subcount; pass existing
   snapshot time where needed; preserve Test Accounts operations and route-level states.
4. `admin-analytics-view-model.ts`: delete active-plan/Plans filter, sort, and label branches; anchor
   or remove client recency as specified. Do not create a Calendar projection.
5. `admin-workspace-nav-model.ts` and local route copy: apply `Activity`/direct-fact labels and remove
   repeated titles. Do not add a destination.
6. `shell-admin-analytics.css` and existing semantic utilities: delete/reduce unreachable
   `hito-analytics-stat*`/decorative summary responsibilities and implement only the accepted local
   layout. Shared workbench selectors remain untouched unless PRODUCT routes DESIGN SYSTEM.
7. Run focused source/static checks, Prettier, ESLint, and `git diff --check`. Browser/fixture work
   remains serialized behind the active QA-owned runtime and is recorded as deferred, not bypassed.

No new file, component family, token, CSS framework, local primitive, compatibility alias, fixture,
schema, or Backend field is admitted. Stop and return to PRODUCT if a desired direct Calendar fact
is absent, if a shared workbench/DS selector must change, or if implementation would require keeping
legacy plan aliases. After FRONTEND removes every consumer, PRODUCT routes the existing serial
BACKEND follow-up to delete the rejected fields. The exact next implementation owner is
**FRONTEND, Product lane**, selected and dispatched by PRODUCT.

### Designer Validation And Remaining Layers

| Check                 | Scenario / environment                                                                             | Result | Evidence                                                                                                                                              |
| --------------------- | -------------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Role/skill preflight  | Tracked DESIGNER read-only stage                                                                   | Passed | `AGENTS.md`, `agents/designer.agent.md`, and `skills/hito-frontend-design-system/SKILL.md` read completely.                                           |
| Current source census | All `/admin/analytics` sections, shared shell, operational tables, view/read model, and CSS owners | Passed | Source owner and issue ledgers above; pre-write hashes captured.                                                                                      |
| Saved evidence        | Light desktop Funnel & Usage                                                                       | Passed | Existing capture inspected; it proves P0-01 and the equal-card hierarchy only.                                                                        |
| Local Markdown links  | This item                                                                                          | Passed | Every repository-local Markdown target resolves on disk.                                                                                              |
| Scoped Prettier       | This item only                                                                                     | Passed | `npx prettier --write` completed for this item only.                                                                                                  |
| Diff/source hygiene   | Dirty shared checkout                                                                              | Passed | `git diff --check` returned 0; the untracked-item no-index check emitted no whitespace errors, and all 18 inspected source hashes remained unchanged. |

Not run and not claimed: browser or responsive runtime observation, keyboard execution, console,
fixture, authentication, build, TypeScript/ESLint runtime implementation checks, QA, hosted state,
financial/billing/forecast correctness, Figma, Global QA, release, or deployment. Those omissions
mean the ledger is implementation-ready source/design guidance, not browser or release acceptance.

Lifecycle result: the DESIGNER stage is complete; this item is `ready` under PRODUCT lifecycle
ownership. Next recommended implementation owner: **FRONTEND, Product lane**. No blocking Product
decision remains for the accepted removals and local composition; missing direct data remains a
Backend stop condition rather than a Frontend substitute.

## 2026-08-16 Product Dispatch Boundary

DESIGNER completed the comprehensive audit and returned this item ready. PRODUCT dispatched the
prepared FRONTEND Product stage on Ivan's explicit instruction. QA concurrently owns the shared
managed runtime for the independent Runner Core AUD-06 replay. FRONTEND may perform source
preflight and static work, but must serialize any runtime/build/browser operation behind QA and
must not start, reset, seed, rebuild, or otherwise mutate the managed runtime. If a source write
would invalidate QA's admitted artifact before its evidence is captured, FRONTEND waits for QA's
terminal report rather than contending with that shared lifecycle.

## 2026-08-16 FRONTEND Product Execution Preflight

- **Mode and owner:** Tracked FRONTEND Product consumer implementation. The first incorrect visible
  owners remain the existing Admin Analytics summary/panel composition, Users route composition,
  Users view model, section navigation copy, and local Admin Analytics stylesheet.
- **Current discriminator:** `MetricCard` accepts a formatted string and renders it through
  `hito-analytics-value`; the nullable formatters return `Unavailable`, so an availability state is
  structurally indistinguishable from a number. The same rendered owners directly consume active-
  plan, plan-count, planned-workout, completion-proxy, plan-source, and schema-version fields.
- **Existing seams reused:** `AdminAnalyticsSummarySections.tsx`, `AdminAnalyticsPanels.tsx`,
  `admin.analytics.tsx`, `admin-analytics-view-model.ts`, `admin-workspace-nav-model.ts`, and the
  existing local `shell-admin-analytics.css` recipe. Existing Admin table, toolbar, status, state,
  semantic surface, typography, spacing, radius, focus, and horizontal-scroll contracts remain the
  only UI contracts.
- **Smallest admitted change:** replace the equal-weight metric-card/list composition with a few
  borderless question-led groups; separate numeric readback from source/helper/state; remove the
  rejected plan-shaped consumers and Users filter/sort/column branches; anchor workout-log recency
  to the existing snapshot timestamp; and reduce the Users table to its admitted direct facts.
- **New runtime artifacts:** none. No file, shared primitive, token, component family, state layer,
  compatibility alias, Backend field, fixture, or route is proposed.
- **Responsibilities removed or simplified:** `MetricCard`, `MetricGrid`, `PipelineStep`, and the
  `hito-analytics-stat*` equal-card recipe become obsolete; duplicated evidence/AI counts and the
  active-plan/Plans/planned-workout Users branches are deleted rather than wrapped.
- **Dirty boundary:** preserve the existing Admin language/settings loader and menu adoption hunks
  in `admin.analytics.tsx`, plus the accepted `--color-chrome-subtle` profile-trigger hunk in
  `shell-admin-analytics.css`, byte-for-byte. All other unrelated checkout changes are excluded.
- **Focused proof:** zero direct rejected consumer references in the admitted Frontend inventory;
  source/type resolution of the reduced filters, sorts, tables, and panels; focused Prettier,
  ESLint, relevant Product/static checks, and `git diff --check`.
- **Serialized runtime boundary:** the QA-owned managed runtime, fixture, browser, and build remain
  untouched. Browser/responsive/keyboard/console acceptance is deferred until a new fresh artifact
  can be admitted without contending with QA; this omission prevents browser or QA acceptance but
  does not require a speculative source change.
- **Return condition:** return to PRODUCT if a retained direct fact requires a Backend field, a
  shared Design System owner must change, or the reduced consumer cannot compile without preserving
  a legacy plan alias.

## 2026-08-16 FRONTEND Product Implementation Receipt

### Task And Stage

Tracked FRONTEND Product consumer and visual adoption is source-complete for the existing local
`/admin/analytics` route. The canonical item remains `in_progress` because the serial Backend field
removal and fresh managed browser/build acceptance are separate remaining stages.

### Product Outcome

- Overview, Activity, Workout evidence, AI & Entitlements, Users, and Test accounts now use a small
  borderless local group hierarchy instead of equal-weight bordered stat cards.
- `NumericFact` accepts only a number. Authentication/profile availability is rendered through a
  labelled `hito-state-surface` with a status pill and explanatory body, so `Unavailable` can no
  longer enter numeric metric typography.
- Overview retains direct authentication, runner-profile, and workout-log readback only. Activity
  retains profile coverage, workout-log totals, and recorded outcome rows only. Workout evidence
  separates processing from enrichment without a provider-specific claim or duplicated count.
  AI & Entitlements retains tier/status rows and recorded aggregate capability usage without a
  commercial inference.
- Every direct Frontend consumer of active/current-plan counts, activation proxies, rough completion,
  plan source/schema mixes, Users Active plan/Plans columns, and the planned-workout subcount was
  removed from the admitted inventory. No Calendar substitute or compatibility alias was added.
- Users recency is now explicitly `Last workout log` and uses the existing snapshot `generatedAt`
  as its 30-day anchor. The reduced six-column table uses the existing `hito-data-table-min-md`
  scroll contract. Effective fallback entitlement truth is labelled
  `Effective Pro — no entitlement row`.
- Filtered Users and Test accounts show the existing state surface without a visible empty table
  shell. Test-account search, filters, exact-email deletion, protected states, alerts, and status
  behavior remain at their existing owners.

### Demonstrated Cause And First Owner

The prior Frontend panel API accepted arbitrary formatted strings and rendered them through the
same fluid mono value slot as numbers; the nullable formatters returned `Unavailable`. The same
summary and Users consumers directly read legacy plan-shaped Backend fields. The first visible
incorrect owners were the existing Admin Analytics panel/summary, route table, view-model, nav-copy,
and local stylesheet seams. Backend remains the serial owner for deleting the now-unconsumed fields.

### Files Changed

- `src/components/admin/AdminAnalyticsSummarySections.tsx`
- `src/components/admin/AdminAnalyticsPanels.tsx`
- `src/components/admin/admin-analytics-format.ts`
- `src/components/admin/admin-analytics-view-model.ts`
- `src/components/admin/admin-workspace-nav-model.ts`
- `src/routes/admin.analytics.tsx`
- `src/styles/shell-admin-analytics.css`
- this canonical item

No new file, route, shared primitive, token, component family, state layer, compatibility path,
Backend field, fixture, or runtime artifact was created. `MetricCard`, `MetricGrid`, `PipelineStep`,
the nullable string formatters, and `hito-analytics-stat*` responsibilities were deleted rather
than retained as wrappers.

The pre-existing Admin language/settings loader and menu-adoption hunks in
`src/routes/admin.analytics.tsx`, plus the accepted `--color-chrome-subtle` profile-trigger hunk in
`src/styles/shell-admin-analytics.css`, were preserved. Backend, fixture, shared Design System,
hosted, provider, finance, and unrelated checkout bytes were not edited by this slice.

### Validation Inventory

| Check                                                                | Scenario / environment                                            | Result                                                                       | Evidence                                                                                                                                                                                                                                                                                   |
| -------------------------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Source ownership and rejected-consumer reachability                  | Seven admitted Frontend source/style owners                       | Passed                                                                       | Focused assertions found zero `MetricCard`/`MetricGrid`/`PipelineStep`, nullable metric formatter, `hito-analytics-stat*`, rejected summary field, Users active-plan/Plans/planned-workout branch, or live `Date.now()` reference.                                                         |
| Snapshot recency discriminator                                       | In-memory Users filter at exactly 30 days and just beyond 30 days | Passed                                                                       | The 30-day row matched `recent`; the older row did not, using the supplied snapshot timestamp.                                                                                                                                                                                             |
| Formatting                                                           | Seven source/style files and this item                            | Passed                                                                       | Focused Prettier check returned 0.                                                                                                                                                                                                                                                         |
| Lint                                                                 | Six touched TypeScript/TSX owners                                 | Passed                                                                       | Focused ESLint returned 0.                                                                                                                                                                                                                                                                 |
| Backlog contract                                                     | Deterministic Admin backlog validator                             | Passed                                                                       | `npm run validate-admin-capture-backlog` returned `ok: true` with all listed checks.                                                                                                                                                                                                       |
| Diff hygiene                                                         | Dirty shared checkout                                             | Passed                                                                       | `git diff --check` returned 0.                                                                                                                                                                                                                                                             |
| Checkout-wide TypeScript diagnostic                                  | Current shared checkout                                           | Not passed — foreign baseline plus one pre-existing touched-route diagnostic | The new summary/panel/view-model owners have no remaining diagnostic. Full `tsc --noEmit` remains red on many unrelated dirty owners; `admin.analytics.tsx` still has its pre-existing `/admin/login` search-shape diagnostic at the unchanged redirect seam. No foreign fix was absorbed. |
| Hito DS validator                                                    | Current shared checkout                                           | Not passed — cross-owner documentation invariant                             | The validator reports that current product/system/state docs do not record the production-shipped `/hitoDS` role. This slice is forbidden from modifying shared DS documentation or contracts.                                                                                             |
| Managed browser, responsive, keyboard, console, and production build | QA-owned shared managed lifecycle                                 | Deferred                                                                     | No runtime, fixture, browser, or build action was started or mutated. A fresh serialized artifact is still required to prove desktop/mobile Light/Dark rendering and interaction; therefore this receipt is source implementation evidence only, not browser QA.                           |

### Boundaries, Next Owner, And Claims

The disabled empty `Filters` summary affordance and shared quick-link target geometry were not
patched route-locally because their inspected owners are shared operational/workbench contracts;
column filters, focus, and navigation remain unchanged pending a separately admitted shared-owner
decision. No loading state was invented without runtime evidence.

Lifecycle result: this canonical item remains `in_progress`. FRONTEND Product source implementation
is complete and returns to **PRODUCT**. PRODUCT can now route the serial Backend removal of rejected,
zero-consumer plan-shaped fields, then admit one fresh managed artifact for the deferred browser/build
matrix. No subagent was used. Global QA, hosted, Figma, financial, release, deployment, and production
readiness are not claimed.

## 2026-08-16 Product Dispatch — BACKEND Read-Model Cleanup

FRONTEND has removed every admitted `/admin/analytics` consumer of active/current-plan authority,
plan-count/planned-workout columns, activation proxies, rough completion rate, and plan
source/schema mixes. The serial Backend stage now removes those rejected projections from the
existing Admin Analytics read model. Historical source artifacts remain outside this read-model
cleanup and must not be deleted or turned into a compatibility path.

```text
ROLE: BACKEND

Task: Hito Hub Admin Analytics read-model legacy cleanup
Mode: Tracked
Canonical item: docs/tasks/backlog/2026-08-16-hito-hub-admin-analytics-borderless-local-redesign.md
Stage: BACKEND removal of zero-consumer plan-shaped Admin Analytics projections
Epic: owner-analytics-and-scenario-lab

Read AGENTS.md, agents/backend.agent.md, and skills/hito-backend-supabase-contract/SKILL.md. Read
the completed FRONTEND receipt and the accepted Admin direction in this item. The target is exactly
Hub -> Admin -> Analytics (`/admin/analytics`), not Runner Calendar UI, a new Admin surface, finance,
billing, or a hosted change.

FRONTEND has proved that the current Admin route no longer consumes active/current-plan counts,
activation proxies, rough completion rate, plan source/schema mixes, Users active-plan/Plans/planned
workout columns, or their client compatibility branches. In the existing Admin Analytics Backend read
model, remove those rejected zero-consumer fields, calculations, query selections, row types, and
related legacy-only branches. Preserve direct authenticated/profile/workout-log/result-evidence,
AI/entitlement, Test Accounts, classification, access-control, and truthful unavailable/error facts.

Do not delete immutable source artifacts or their storage tables, introduce aliases/compatibility
projections, infer Calendar facts client-side or server-side as substitutes, add a schema/migration,
touch Runner Calendar persistence, fixtures, runtime, hosted data, providers, Design System, or Git
lifecycle. A plan remains source provenance only and is not Admin current-product authority.

Before editing, establish the exact read-model consumer census and identify whether any retained
server-side classification still truly needs source provenance. Reuse the existing read model and
remove a legacy branch only when its remaining consumer/replacement proof is explicit. If a retained
visible fact requires a different Backend truth or a schema decision, stop and return that precise
boundary to PRODUCT rather than retaining an alias.

Run focused source/type/lint validation and diff hygiene without starting, rebuilding, seeding, or
mutating the shared qa_fixture/runtime, which FRONTEND currently uses for the Runner Core bridge.
Use ARCHITECT only for a bounded read-only legacy/reachability review if the removal boundary is
ambiguous; use QA only for a bounded read-only contract review after source proof. Update this item
with an English tracked receipt and return the fresh browser/build acceptance handoff to PRODUCT.
Do not claim browser QA, Global QA, hosted, release, or deployment readiness.
```

## 2026-08-16 BACKEND Execution Preflight

- **Mode and owner:** Tracked BACKEND read-model cleanup for the existing `/admin/analytics`
  route. The first incorrect Backend owner is the plan-shaped projection inside
  `src/lib/admin-analytics.ts` and `src/lib/admin-analytics.server.ts`.
- **Consumer discriminator:** repository-wide source search found no remaining consumer of
  `usersWithActivePlan`, `usersWithoutActivePlan`, `setupToActivePlanRate`, the `plans` projection,
  planned-workout totals, rough completion, active-plan inactivity counts, or the per-user plan and
  planned-workout fields outside those two Backend owner files. The completed FRONTEND stage
  therefore removed every runtime consumer before this deletion.
- **Retained classification boundary:** `plan_cycles` and `planned_workouts` currently contribute
  only to the rejected projections and to the broad known-user seed. Retained account
  classification remains represented by auth/local identities and the admitted profile, workout
  log, result-evidence, AI-insight, entitlement, and capability-usage sources; source-plan
  provenance is not required by that classification.
- **Existing seam reused and smallest change:** keep the existing authenticated Admin Analytics
  loader and remove the rejected fields, the two legacy table selections, their row types,
  calculations, and per-user/excluded-row arguments. No Calendar replacement or compatibility
  alias will be added.
- **New runtime artifacts:** none. No file, schema, migration, RPC, fixture, state layer, provider,
  dependency, or alternate read model is proposed.
- **Obsolete responsibility removed:** the Admin Analytics snapshot will no longer promote mutable
  plan status/source/schema or planned-workout membership into current account, usage, or Users
  truth. Immutable source artifacts and their storage remain untouched.
- **Focused proof:** zero-live-consumer and zero-live-legacy owner search, focused TypeScript source
  resolution, ESLint, Prettier, and `git diff --check`. The shared managed runtime, fixture,
  browser, and build remain serialized behind the active FRONTEND/QA lifecycle and will not be
  started or mutated by this stage.

## 2026-08-16 BACKEND Implementation Receipt

### Task, Stage, And Outcome

The Tracked BACKEND read-model cleanup for Hub → Admin → Analytics is complete. The existing
authenticated Admin Analytics loader now returns only its admitted direct authentication, profile,
workout-log, result-evidence, AI/entitlement, Test Accounts, classification, and availability/error
facts. It no longer queries or projects mutable plan status, source/schema mixes, planned-workout
membership, active-plan activation/inactivity proxies, rough completion, or per-user plan counts.

Preflight read `AGENTS.md`, `agents/backend.agent.md`,
`skills/hito-backend-supabase-contract/SKILL.md`, and the installed Supabase procedure. No live
Supabase documentation lookup was required because this deletion adds no schema, query API,
generated type, or platform behavior.

No Calendar count or compatibility alias replaced the removed claims. Immutable source-plan and
Calendar-workout storage remain untouched; this stage changes only the Admin Analytics read shape.

### Root Cause And Consumer Census

The Backend snapshot continued selecting `plan_cycles` and `planned_workouts` solely to construct
fields that the accepted Product direction rejected and the completed FRONTEND stage no longer
consumes. A repository-wide census found every rejected field referenced only by its declaration in
`src/lib/admin-analytics.ts` and construction in `src/lib/admin-analytics.server.ts`; there was no
remaining route, component, script, or server consumer.

The retained account classification does not require source-plan provenance. Its user census and
rows remain grounded in verified auth/local identities plus admitted profile, workout-log,
result-evidence, AI-insight, entitlement, and capability-usage sources. Plan and planned-workout
rows were therefore removed from this read-model query rather than retained as hidden
classification authority.

### Files Inspected And Changed

Changed:

- `src/lib/admin-analytics.ts`
- `src/lib/admin-analytics.server.ts`
- this canonical item

Inspected without modification for current consumer truth:

- `src/components/admin/AdminAnalyticsSummarySections.tsx`
- `src/components/admin/admin-analytics-view-model.ts`
- `src/routes/admin.analytics.tsx`
- `scripts/validate-admin-auth-session.ts`

The production-source change is a net deletion of 131 lines. It removes the rejected DTO fields,
`plan_cycles`/`planned_workouts` selections and row types, active-plan and completion calculations,
per-user/excluded-row plan arguments, and helpers made unreachable by those calculations. New
runtime artifacts: none.

### Preserved Boundaries

- Admin authentication, capability guards, signed-session handling, Test Accounts, account
  classification, explicit/missing-row entitlement truth, and unavailable/error outcomes remain at
  their existing owners.
- Direct profile, workout-log/outcome, result asset/parse, actual-metrics, comparison, AI-insight,
  entitlement, and capability-usage readback remains unchanged.
- No source artifact, storage table, schema, migration, RPC, RLS/ACL rule, fixture, provider,
  Runner Calendar persistence, Frontend, Design System, hosted state, or Git state was modified.
- The shared managed runtime, local fixture, browser, and build output were not started, reset,
  rebuilt, seeded, or otherwise mutated.

### Validation Inventory

| Check                                | Scenario / environment                                                               | Result                          | Evidence                                                                                                                                                                                                                |
| ------------------------------------ | ------------------------------------------------------------------------------------ | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rejected consumer census             | Current `src/` and focused script owners                                             | Passed                          | Every rejected field was found only in the Backend DTO/builder before deletion; the post-change zero-live-legacy search returned no match.                                                                              |
| Query and classification boundary    | `admin-analytics.server.ts` source                                                   | Passed                          | No `plan_cycles` or `planned_workouts` selection remains; retained classification inputs are auth/local identity, profile, workout-log, result-evidence, AI-insight, entitlement, and capability usage.                 |
| Preserved Admin auth/access contract | Deterministic source validator                                                       | Passed                          | `node --import tsx scripts/validate-admin-auth-session.ts` passed every signed-session, mixed-cookie, Admin/Runner isolation, settings, and malformed-session assertion.                                                |
| Focused formatting                   | Two Backend owners and this item                                                     | Passed                          | The final focused `npx prettier --check ...` returned 0.                                                                                                                                                                |
| Focused lint                         | Two changed TypeScript owners                                                        | Passed                          | `npx eslint src/lib/admin-analytics.ts src/lib/admin-analytics.server.ts` returned 0.                                                                                                                                   |
| Canonical backlog contract           | Deterministic repository-mirror validator                                            | Passed                          | `npm run validate-admin-capture-backlog` returned `ok: true` with all checks green.                                                                                                                                     |
| Focused TypeScript resolution        | Whole-checkout diagnostic filtered to the Backend owners and current Admin consumers | Passed for this slice           | No diagnostic references either changed Backend owner, the summary consumer, or view model. The only current Admin-route diagnostic is the pre-existing `/admin/login` search-shape error at `admin.analytics.tsx:173`. |
| Checkout-wide TypeScript             | Current shared dirty checkout                                                        | Not passed — unrelated baseline | `npx tsc --noEmit --pretty false` remains red across unrelated in-progress owners. No foreign fix was absorbed.                                                                                                         |
| Diff hygiene                         | Current dirty checkout                                                               | Passed                          | `git diff --check` returned 0.                                                                                                                                                                                          |

### Omitted Proof, Lifecycle, And Next Owner

Production build and authenticated desktop/mobile browser acceptance were not run because the shared
managed artifact/runtime remains serialized behind the concurrent Runner Core FRONTEND/QA work.
Consequently this receipt proves Backend source and contract cleanup only; it does not prove the
fresh integrated bundle, visual layout, responsive interaction, console health, or authenticated
runtime readback. Hosted parity, Global QA, release, and deployment were also not run or claimed.

The BACKEND implementation stage is complete with no blocker and no subagent. The canonical item
remains `in_progress` under **PRODUCT** because one fresh, serialized production build and
authenticated browser acceptance pass is still required for the combined FRONTEND/Backend
candidate. PRODUCT is the next owner for that admission and routing.

# Hito Runner Standalone Calendar Copy Completion

Work Item ID: `46fb8e8c-5088-4036-92ab-b54f5a145b47`
Status: completed
Type: Bug
Priority: medium
Mode: Lite
Owner: FRONTEND
Lane: Product
Scope: Source-neutral copy correction in `OnboardingGate.tsx`,
`QuickSetupPlanSetupSections.tsx`, `AppShell.tsx`, and `settings.tsx`. No behavior, persistence,
route, Design System, translation, fixture, or backend change.
Archive Intent: Retain until the four shared Product-copy seams no longer contradict the accepted
standalone Calendar model and focused local proof is recorded.
Evidence From: [Runner Core Full Local QA Audit And Defect Ledger](./2026-08-16-hito-runner-core-full-local-qa-audit-and-defect-ledger.md)

## Task

Remove the remaining runner-facing implication that a plan controls current setup, Calendar, or
existing workouts. After confirmation, manual, AI-authored, and imported workouts are independently
runner-owned Calendar entities; a plan is an immutable source artifact only when the text truthfully
refers to source authoring, import/export, or Past Plans.

## User Report

The Runner Core retry found that the previously fixed manual admission now reaches a standalone
Calendar, but adjacent shared copy still says `Choose how to start your plan`, refers to facts
needed before `plan setup`, labels shell onboarding `Plan setup`, and says Settings does not change
the `active plan already on your calendar`.

## Evidence

- QA ledger finding: `AUD-06`, browser replay at desktop and mobile in Light/Dark.
- Screenshot: [standalone onboarding copy](../../../qa-artifacts/screenshots/2026-08-16/hito-runner-core-full-local-qa-audit/retry-01-onboarding-desktop-light.jpg).
- Exact first seams: `src/components/OnboardingGate.tsx:359`,
  `src/components/onboarding/QuickSetupPlanSetupSections.tsx:89`,
  `src/components/AppShell.tsx:468`, and `src/routes/settings.tsx:212-213`.

## Observed And Expected Behavior

Observed: current UI copy treats a source plan as an active runner-facing Calendar container despite
the established runner-owned Calendar persistence model.

Expected: setup and Settings copy is runner/Calendar/source-neutral. It may call a plan a source
artifact only where that is factually true. Updating settings must be described as not mutating
existing Calendar workouts, not as preserving an active plan.

## Demonstrated Cause

The four rendered Product-copy owners contain legacy plan-authority string literals. The Calendar
and persistence behavior passed the same QA retry, so this is a copy-only Product contract defect;
no Backend cause is assigned.

## Reuse And Boundaries

- Reuse the existing string owners and make the smallest source-neutral corrections.
- Before editing, classify all user-visible `plan` wording in the four seams as either truthful
  immutable-source language to retain or legacy current-authority language to remove.
- New runtime artifacts: none.
- Remove only the false current-plan responsibility; do not rewrite truthful source-plan, Past Plans,
  import/export, or preview-source copy outside the four seams.
- Preserve onboarding validation, manual creation, Calendar routing, data, locale contracts,
  AppShell layout, and concurrent dirty work byte-for-byte.

## Focused Proof

1. Search the four seams and confirm remaining runner-facing current-plan claims are absent while
   truthful source-artifact language remains.
2. Run focused formatting/lint and `git diff --check`.
3. If a fresh managed artifact is admissible without contending with another runtime owner, replay
   the onboarding, shell, and Settings copy at one desktop and one mobile viewport. Confirm no
   navigation, validation, containment, or console regression. Otherwise record that browser proof
   as deferred rather than rebuilding a shared runtime.

## Promotion Condition

Promote to Tracked and return to PRODUCT if discovery finds a needed behavior, persistence, shared
Design System, locale-content, or second-owner change. Do not turn copy into a client-side
compatibility layer.

## Frontend Lite Preflight — 2026-08-16

- **Outcome / evidence:** remove the four QA-demonstrated current-plan authority claims and the
  directly adjacent manual-Calendar copy that repeats the same false state. Generated review,
  saved-in-Plans, future source-plan defaults, and preview-source wording remain factual.
- **Owner / existing seam:** Frontend Product copy in the existing `OnboardingGate`, quick baseline,
  AppShell profile-detail, and Settings text owners. No behavior, persistence, locale, Design
  System, or Backend owner is required.
- **New runtime artifacts:** none. No component, state, route, CSS, token, translation, fixture,
  persistence path, helper, or compatibility branch is added.
- **Simplification:** obsolete manual-plan/current-plan wording is removed; internal legacy
  implementation identifiers remain untouched because renaming them would exceed this copy-only
  contract.
- **Focused proof:** four-seam source classification and zero current-authority wording, targeted
  Prettier/ESLint, and `git diff --check`. Browser proof is deferred while named QA owns the shared
  managed runtime.
- **Promotion boundary:** promote and return to PRODUCT if any correction requires behavior,
  persistence, shared Design System, locale-content, or a second implementation owner.

## Exact Handoff Prompt

```text
ROLE: FRONTEND

Lane: Product
Task: Hito Runner Standalone Calendar Copy Completion
Mode: Lite
Canonical item: docs/tasks/backlog/2026-08-16-hito-runner-standalone-calendar-copy-completion.md

Read AGENTS.md, agents/frontend.agent.md, and skills/hito-frontend-design-system/SKILL.md before
acting. The accepted model is mandatory: after confirmation, Calendar workouts are independently
runner-owned; a plan is only an immutable source artifact for initial placement/history.

QA reproduced legacy current-plan copy at:
- src/components/OnboardingGate.tsx:359;
- src/components/onboarding/QuickSetupPlanSetupSections.tsx:89;
- src/components/AppShell.tsx:468; and
- src/routes/settings.tsx:212-213.

Use those existing owners only. Before editing, inspect all user-visible `plan` wording in those four
seams and retain it only when it truthfully means a source artifact, Past Plans, import/export, or
preview source. Remove current-authority wording from setup, Calendar, and Settings; describe
settings as not mutating existing Calendar workouts. Add no component, state, route, CSS, token,
translation, fixture, persistence, compatibility path, or backend change.

Run focused source search, formatting/lint, and diff hygiene. If the shared managed runtime is
uncontended and freshly admissible, perform one desktop/mobile copy replay; otherwise record the
deferred browser proof and do not rebuild or reset another owner's runtime. Promote to Tracked and
return to PRODUCT if any behavior, DS, locale, persistence, or second-owner work is actually
required. Update only the canonical item with a compact English Lite receipt; do not claim Global QA,
hosted, release, or deployment readiness.
```

## Frontend Lite Receipt — 2026-08-16

- **Task / mode:** Hito Runner Standalone Calendar Copy Completion / Lite Frontend Product.
- **Outcome / decision:** the common runner baseline, manual Calendar admission, onboarding shell
  label, and Settings copy no longer imply a current or active plan. Manual admission now speaks
  only about opening Calendar; Settings explicitly says existing Calendar workouts are not
  rewritten.
- **Retained factual plan language:** generated review/creation, saved records in Plans, preview-plan
  context, generated `Plan Start Date`, and future plan-creation defaults remain because they refer
  to immutable source authoring, review, history, or initial placement rather than Calendar
  authority.
- **Files changed:** `src/components/OnboardingGate.tsx`,
  `src/components/onboarding/QuickSetupPlanSetupSections.tsx`, `src/components/AppShell.tsx`,
  `src/routes/settings.tsx`, and this canonical item.
- **Reuse / artifacts:** only existing string owners were edited. New runtime artifacts: none. No
  behavior, component, state, route, CSS, token, translation, fixture, persistence, compatibility,
  Design System, or Backend path changed. Existing unrelated dirty hunks were preserved.
- **Focused proof:** the four-seam negative source assertion found zero `active plan`, `current plan`,
  `plan setup`, `start your plan`, `manual plan`, `plan not created`, or `existing active schedule`
  claims. Targeted Prettier and ESLint, `validate-runner-calendar-context`, and
  `git diff --check` passed.
- **Deferred proof / consequence:** browser replay was intentionally not run because the named QA
  role owns the shared managed `qa_fixture` lifecycle for its final retry. This receipt proves the
  copy-only source correction, not rendered browser acceptance.
- **Role / skill / review:** `agents/frontend.agent.md`;
  `skills/hito-frontend-design-system/SKILL.md`; no subagent was used.
- **Promotion / remaining boundary:** no promotion condition was reached. Independent QA, Global QA,
  hosted, release, and deployment readiness remain unclaimed.

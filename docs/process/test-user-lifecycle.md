# Test User Lifecycle

This is the canonical Backend contract for requests such as:

- `create me a new user`
- `reset this user`
- `delete this user`

Use this document instead of ad hoc Supabase dashboard work.

## Local Runtime Prerequisite

Generic test-user mutation is local-only. Start the repository Supabase stack and write its
loopback credentials into the ignored `.env.local` before using this lifecycle:

```bash
npx --yes supabase@2.109.1 start
npm run supabase:local:configure
npm run supabase:local:status
```

`test-user` refuses every non-loopback Supabase URL except the single adaptive UI-replay command
family documented below. That exception requires an exact trusted project reference, the retained
metadata-proven `.invalid` technical runner ID, and process-local server credentials. It cannot
create or adopt Auth users. Hosted Supabase credentials belong only in deployment environments and
are never copied into repository files.

Fresh local resets receive canonical table privileges from the migration history. Those grants
remain paired with existing own-row RLS policies for `authenticated`; server-only access stays
bounded to `service_role`, and no local setup script issues ad hoc grants.

## Purpose

This repo supports one narrow test-user lifecycle path:

- ensure and reuse a bounded named Supabase Auth tester pool
- keep local credentials linked to the current Auth user IDs
- reset a designated tester to no plan while preserving its saved runner profile
- reset a tester back to a clean onboarding state
- lease isolation identities only for bounded concurrent or RLS proof
- inventory metadata-classified testers and all app-owned rows
- generate a stable cleanup manifest before destructive maintenance
- delete a tester safely
- seed, inspect, and exactly reset one versioned provider-free adaptive UI-replay fixture

The canonical command entrypoint is:

```bash
npm run test-user -- <command> ...
```

## Scope

This tool is for metadata-proven `tester` accounts only.

It must not be used to reset or delete a protected admin or unclassified identity. Auth
`app_metadata`, not an email pattern, proves tester eligibility. Admin metadata always wins a
classification conflict.

## Named Pool

Normal QA reuses these roles:

| Role                        | Purpose                                                                  |
| --------------------------- | ------------------------------------------------------------------------ |
| `baseline-no-plan`          | Saved baseline/profile with no active plan                               |
| `saved-plan-readback`       | Review, confirm, persistence, export, and readback proof                 |
| `provider-engine`           | Direct backend/provider-engine proof without browser creation            |
| `adaptive-training-quality` | Versioned adaptive-engine UI replay through canonical persistence owners |
| `isolation-a`               | First identity for bounded RLS/collision proof                           |
| `isolation-b`               | Second identity for bounded RLS/collision proof                          |

Persistence validators lease these identities and reset their app-owned rows on release. A
concurrent attempt to use the same role fails closed instead of minting another timestamp/random
Auth user.

```bash
npm run test-user -- pool-ensure \
  --role provider-engine

npm run test-user -- pool-reset --role provider-engine

npm run test-user -- pool-reset-plan --role baseline-no-plan

npm run test-user -- pool-delete \
  --role provider-engine \
  --confirm-role provider-engine
```

Provider/engine iteration uses the direct backend seam. Browser creation and confirmation remain a
separate cross-flow gate.

`pool-ensure` generates a private local password when the role is first created and reuses the
ignored credentials-registry value afterward. Passing `--password` is optional and rotates only that
local pool identity.

## Inventory And Cleanup

Email domains and prefixes are diagnostic only and remain `manual_review`.

```bash
npm run test-user -- inventory

npm run test-user -- cleanup-manifest \
  --output .tanstack/qa-test-user-local-cleanup-manifest.json
```

The ignored manifest records the exact loopback target, Auth identity, metadata basis, all
app-owned table counts, credential drift, protected identities, and a stable selection hash. Apply
re-reads the target and candidates and refuses any drift:

```bash
npm run test-user -- cleanup-apply \
  --manifest .tanstack/qa-test-user-local-cleanup-manifest.json \
  --confirm-selection '<reviewed selectionHash>'
```

Generic inventory and cleanup commands never accept a hosted target. The adaptive UI-replay reset
is the only hosted cleanup exception and is restricted to the exact metadata-proven technical
runner. Admin and unclassified identities remain protected, and this workflow never provisions a
linked reusable pool.

## Adaptive Engine UI Replay

`adaptive_engine_ui_replay_v1` is the single deterministic, provider-free source for later adaptive
engine UI regression. It creates new fixture-owned lineage through the existing initial authoring,
signed Review/Confirm, Runner Calendar, FIT importer, RPE and Runner Fitness Profile owners. It does
not read or restore HITO-271 response IDs, candidates, review seals, Coach verdicts or provider
content, and it does not claim to repeat HITO-271 Global QA.

Local proof uses the existing `adaptive-training-quality` pool identity:

```bash
npm run qa:adaptive-ui-replay:seed -- --as-of-date 2026-08-23
npm run qa:adaptive-ui-replay:status -- --as-of-date 2026-08-23
npm run qa:adaptive-ui-replay:reset -- \
  --confirm-fixture-version adaptive_engine_ui_replay_v1
```

The same commands may target the retained hosted technical runner only when the process already has
the approved server configuration and supplies both the exact project reference and technical
runner ID:

```bash
npm run qa:adaptive-ui-replay:seed -- \
  --trusted-hosted-project-ref '<approved project ref>' \
  --user-id '<retained technical runner id>' \
  --as-of-date 2026-08-23
```

Hosted status and reset use the same two identity arguments; reset additionally requires the exact
fixture-version confirmation shown above. The seed resets only that runner's owned rows/storage,
creates three deterministic confirmed Calendar horizons plus factual FIT/RPE/Profile state, and
fails back to zero on any error. The reset preserves the Auth identity and requires zero owned rows,
storage objects and leases. Receipts expose only version/provenance, counts, public factual states
and zero-dispatch assertions; they contain no credentials, action links, raw provider content or
personal data.

The same seed command has one deterministic `--checkpoint` selector for bounded UI action proof;
it does not add commands or a second fixture family:

- `initial_plan_review` leaves the technical runner at canonical zero. The normal onboarding server
  action may then create one fresh provider-free reviewed candidate only while the app runs in the
  approved `qa_fixture` mode. No candidate or client state is preseeded.
- `continuation_actions` creates one fresh fixture-owned initial confirmation, eight resolved
  factual outcomes and inert future projections, then stops at `check_in_needed`. It also writes one
  mode-`0600` synthetic FIT upload input to the ignored HITO-273 QA-artifact directory. QA can use the
  normal Calendar detail, FIT/RPE, check-in, prepare, Review and Confirm controls from that state.
- `complete_surface` is the default HITO-272 readback fixture and retains its three-confirmation
  stable-surface behavior.

`status` receives the same selector. Exact version-confirmed `reset` deletes only the runner-owned
domain rows/storage, releases the existing adaptive lease, removes the synthetic HITO-273 upload
artifact and preserves the technical Auth identity. The selector never restores HITO-271 IDs,
provider content, prompts, Coach verdicts, credentials, action links or personal data.

The retired `hosted-pool-*` stage commands are not compatibility aliases. They were reachable only
from their own dispatcher and were removed after this one fixture lifecycle replaced their hosted
bootstrap/stage writer surface. Local `adaptive-blueprint-*` commands remain focused Backend proofs;
they are not a second hosted UI-replay source.

## Legacy Explicit Commands

The explicit email commands remain only for bounded repair or migration of an already named local
tester. They are not the normal QA lifecycle and never generate timestamp/random identities
automatically.

## Required Identifiers

For legacy `create`:

- `email`
- `username`
- `password`

For `reset`:

- `email`

For `reset-plan`:

- `email`

For `delete`:

- `email`
- `confirm-email`

`confirm-email` must exactly match `email`.

## Command Contract

### Legacy create

Meaning in this repo:

- create or reuse one Supabase auth user for the provided email
- create or update one local credentials account in the ignored local accounts file
- optionally seed one imported plan into the canonical Supabase tables

Command:

```bash
npm run test-user -- create \
  --email qa-runner-01@local.test \
  --username qa-runner-01 \
  --password 'change-me-locally'
```

With immediate plan seeding:

```bash
npm run test-user -- create \
  --email qa-runner-01@local.test \
  --username qa-runner-01 \
  --password 'change-me-locally' \
  --plan /absolute/path/to/plan.json
```

What it writes:

- `auth.users`
- `public.runner_profiles` only when `--plan` is provided
- `public.plan_cycles` only when `--plan` is provided
- `public.planned_workouts` only when `--plan` is provided
- local ignored accounts file for credentials login

### Legacy reset

Meaning in this repo:

- keep the Supabase auth user
- keep the local credentials account
- delete the user&apos;s saved training data
- optionally import a fresh plan immediately after cleanup

Command:

```bash
npm run test-user -- reset \
  --email qa-runner-01@local.test
```

Reset and reseed with a plan:

```bash
npm run test-user -- reset \
  --email qa-runner-01@local.test \
  --plan /absolute/path/to/plan.json
```

What reset removes:

- all `public.plan_cycles` rows for the user
- all `public.planned_workouts` rows through cascade
- all `public.workout_logs` rows through cascade
- the user&apos;s `public.runner_profiles` row

What reset preserves:

- the `auth.users` row
- the local credentials account entry

### Reset plan only

Use `reset-plan` for repeatable local PlanCreation design sessions. It is limited to a local
`tester` account and requires that tester to already have a saved runner baseline.

Command:

```bash
npm run test-user -- reset-plan \
  --email qa-runner-01@local.test
```

What reset-plan removes:

- all `public.plan_cycles` rows for the tester
- all `public.planned_workouts` rows through cascade
- all `public.workout_logs` and workout evidence rows through cascade

What reset-plan preserves and verifies unchanged:

- the `auth.users` row
- the local credentials account entry
- the complete `public.runner_profiles` row, including baseline revision and heart-rate profile

The command fails if the account is not a local tester, has no saved profile, receives `--plan`,
changes the profile row, or leaves any counted plan rows behind.

For a 15-second preview-loading design session, start the managed loopback runtime with the existing
fixture delay:

```bash
npm run local:fixture
```

Generate a plan from an explicit valid goal/distance and confirm it through the normal review dialog.
After inspecting the saved plan, run `reset-plan` to return to no-plan state without re-entering the
baseline. Restore the ordinary managed runtime when the fixture session is over:

```bash
npm run local:real
```

Both mode commands restart the same canonical server at `http://127.0.0.1:3000/` and print its active
provider mode. Any existing authenticated local browser session remains valid while switching modes;
fixture access does not require a separate account, credential change, or login step.

### Legacy delete

Meaning in this repo:

- remove the local credentials account entry
- hard-delete the Supabase auth user
- rely on `auth.users -> public.*` cascade cleanup for persisted plan and log data

Command:

```bash
npm run test-user -- delete \
  --email qa-runner-01@local.test \
  --confirm-email qa-runner-01@local.test
```

What delete removes:

- `auth.users`
- `public.runner_profiles` through cascade
- `public.plan_cycles` through cascade
- `public.planned_workouts` through cascade
- `public.workout_logs` through cascade

Delete fails unless the auth user and all counted canonical rows read back as zero afterward.

- the local credentials account entry

What delete preserves:

- nothing for that tester account inside the app-owned auth and training tables

## Safety Checks Before Delete

Backend must verify all of the following before running delete:

- the request is for a `tester` account, not the protected primary account
- `email` is explicit
- `confirm-email` exactly matches `email`
- no one is using delete as a shortcut for `reset`

The script itself refuses to reset or delete:

- Auth identities without current tester `app_metadata`
- Auth or local accounts marked as `admin`
- pool identities with an active lease

## Local Credentials Path

The canonical local credentials file is:

- `.tanstack/hito-running-local-accounts.json`

The canonical local env pointer is:

- `LOCAL_AUTH_BYPASS_ACCOUNTS_FILE=.tanstack/hito-running-local-accounts.json`

This file is ignored by git and is the supported place for repeatable local tester credentials.

## Current Login Expectations

- local testers created through this script can use the visible username/password path on `/login`
- Magic Link remains available as a secondary path
- plan truth still lives in Supabase, not in the local accounts file

## Remaining Limitations

- deleting a Supabase user does not instantly invalidate already-issued access tokens; browser logout or session expiry may still be needed after delete
- this tool is intentionally narrow and does not manage roles beyond `admin` protection and `tester` creation
- this tool is temporary operational support, not a permanent admin product surface

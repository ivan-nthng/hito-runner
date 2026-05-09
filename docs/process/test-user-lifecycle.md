# Test User Lifecycle

This is the canonical Backend contract for requests such as:

- `create me a new user`
- `reset this user`
- `delete this user`

Use this document instead of ad hoc Supabase dashboard work.

## Purpose

This repo supports one narrow test-user lifecycle path:

- create a Supabase auth user for testing
- optionally create local credentials for the temporary local login path
- optionally seed a test plan from JSON
- reset the user back to a clean onboarding state
- delete the test user safely

The canonical command entrypoint is:

```bash
npm run test-user -- <command> ...
```

## Scope

This tool is for `tester` accounts only.

It must not be used to reset or delete the protected primary account.

## Required Identifiers

For `create`:

- `email`
- `username`
- `password`

For `reset`:

- `email`

For `delete`:

- `email`
- `confirm-email`

`confirm-email` must exactly match `email`.

## Command Contract

### Create

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

### Reset

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

### Delete

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

- local accounts marked as `admin`

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

# Workout Body Notes And User Settings Plan

## Status

Persistence repair implemented

## Owner

Backend

## Last Updated

2026-05-15

## Context

The current product still has one leftover `Body notes` utility route that is detached from workout truth.

That creates two product problems:

- body discomfort notes are not tied to a specific run result
- the shell still exposes a utility that now feels outside the main workout flow

At the same time, the shell profile area still lacks one canonical `User settings` destination for bounded runner metadata such as:

- name
- avatar
- weight
- height
- age
- future heart-rate-zone ownership

## Product Decision

This slice should do two things only:

1. move manual body notes into workout-detail `Log result` so they belong to a specific workout
2. replace the old body-notes utility entry with one bounded `User settings` surface

This is not a full account-settings system and not a recovery-analysis engine.

## Scope

### In scope

- persist workout-linked body notes as part of saved workout-result truth
- add body-note entry UI inside `Log result`
- remove `Body notes` from shell dropdown and mobile utility affordances
- add one bounded `User settings` route or surface
- support basic runner fields and avatar upload
- resize or crop avatar to one canonical `240x240` square before upload

### Out of scope

- a separate standalone body-notes route
- recovery advice or automatic plan changes from body notes
- a broad account-management center
- password, auth-provider, or billing settings
- multiple avatar variants or media-library behavior

## Data Direction

### Workout-linked body notes

Recommended storage direction:

- extend `workout_logs` with one `body_notes jsonb` field

Reason:

- body notes belong to the workout result
- this avoids creating a second standalone notes table for the first release
- one saved workout should carry one bounded body-note payload

### User settings

Recommended runner-profile additions:

- `first_name`
- `last_name`
- `display_name`
- `avatar_url`
- `avatar_storage_path`
- `age`
- `weight_kg`
- `height_cm`

Keep these fields bounded and runner-facing.

## Surface Direction

### `Log result`

Add one optional `Body notes` section that supports:

- affected area
- severity
- timing:
  `during`
  `after`
- sensation
- optional free text

This should stay additive to manual result logging, not replace it.

### `User settings`

Add one bounded surface for:

1. identity
2. avatar
3. physical fields
4. future heart-rate-zone placeholder

The shell profile menu should route here instead of exposing the old body-notes utility.

## Avatar Direction

The app should not store the raw uploaded source image.

Recommended first-release contract:

- crop and resize on the client to a square `240x240`
- upload only the processed avatar asset
- when replacing the avatar, remove the previous stored avatar file

## Validation Plan

- saved workout body notes persist and reload with the workout result
- body notes remain attached to the specific workout they were saved with
- shell no longer exposes `Body notes`
- authenticated saved-mode user can open `User settings`
- avatar upload stores only the processed square image and replaces old avatar cleanly

## Implementation Update - 2026-05-15

Implemented in this backend/persistence repair:

- applied `20260515093000_workout_body_notes_and_user_settings.sql` to the linked Supabase project
- added the missing live columns for `workout_logs.body_notes`
- added the missing live `runner_profiles` settings/avatar columns:
  `first_name`, `last_name`, `display_name`, `avatar_url`, `avatar_storage_path`, `age`, `weight_kg`, and `height_cm`
- created/updated the `profile-avatars` storage bucket for processed avatar assets
- fixed the settings route loader to resolve through the persisted saved-mode user id instead of the raw auth/local-bypass id
- fixed shell viewer profile lookup to use the same persisted-user mapping

Implemented in the narrow frontend follow-up:

- fixed the `Log result` body-note reveal bug so `Add body note` now keeps the workout-scoped form open instead of immediately resyncing back to the empty state
- confirmed the `/settings` route no longer has an extra frontend-only setup gate beyond the persisted profile check

Implemented in the first modal UI slice:

- replaced the heavy inline body-note editor in `Log result` with a compact summary row plus one workout-scoped modal
- kept the saved schema unchanged as `area`, `timing`, `sensation`, `severity`, and optional `note`
- shipped the bounded front/back body-map selector inside the modal without reviving `/body`

Still outside this repair:

- frontend polish or redesign for settings/body notes
- broader account-center behavior
- heart-rate-zone settings

## Exit Criteria

- [x] persisted schema exists for workout-linked body notes
- [x] persisted schema exists for bounded settings/avatar profile fields
- [x] settings backend identity uses the saved-mode persisted-user seam
- [ ] body notes are owned by workout `Log result`, not by a separate utility route
- [ ] shell profile affordances point to `User settings` instead of the old body-notes utility
- [ ] saved-mode user can edit bounded identity and physical profile fields in browser QA
- [ ] saved-mode user can upload and replace a square avatar in browser QA

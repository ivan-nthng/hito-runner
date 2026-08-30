# Project Context

Hito Running helps ordinary runners create, organise, complete and understand a personal calendar
of workouts without pretending to have evidence that is missing.

## Product Pipeline

`identity/profile → reviewed source or WorkoutDocument → explicit confirmation → runner-owned Calendar workout → Result/Evidence → factual Progress`

- Signed-out preview is visibly untrusted and never becomes saved history without an authenticated
  reviewed action.
- AI, file import, templates and manual entry supply initial content. Origin is immutable
  provenance, not a second workout type or lifecycle owner.
- Confirmation materialises independent Calendar workouts. Plans and Blueprints remain source or
  history and never control current Calendar actions.
- Results, FIT evidence and runner input remain attributable facts. Missing or unavailable evidence
  is not inferred by UI or AI.

## Enduring Entities

- **Runner profile:** identity-owned baseline, locale, timezone and stable preferences.
- **Source artifact:** reviewed proposal and immutable provenance.
- **WorkoutDocument:** canonical prescription vocabulary used for review and authoring.
- **Calendar workout:** confirmed runner-owned scheduled prescription.
- **Result/Evidence:** runner-authored and provider-neutral factual outcome history.
- **Activity/Profile projections:** versioned factual read models; never alternate prescription
  authority.

## Runtime Boundary

Hito is one TanStack Start React application backed by Supabase Auth, Postgres and private Storage,
with one Vercel/Nitro deployment path. Route facades transport authenticated requests to focused
domain owners; they are not shared business models. Detailed ownership and unavailable capabilities
live in [current-system.md](current-system.md).

The `Hito Running` Notion database owns operational lifecycle. Markdown owns technical truth, Git
owns code history and Supabase owns runtime truth.

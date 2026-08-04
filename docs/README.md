# Docs Map

Use this order for project context:

1. `docs/context.md`
2. `docs/glossary.md`
3. `docs/current-system.md`
4. `docs/current-product.md`
5. `docs/current-state.md`
6. canonical item in `docs/tasks/backlog/`
7. any linked supporting plan/spec/brief/doctrine
8. `docs/history/changelog.md`

## Folder Purposes

- `docs/context.md`
    - high-level project and pipeline context
- `docs/current-system.md`
    - implemented system behavior only
- `docs/current-product.md`
    - implemented product behavior only
- `docs/current-state.md`
    - implemented-state and release-boundary summary; operational status stays in backlog metadata
- `docs/future-roadmap.md`
    - not-yet-implemented direction only
- `docs/glossary.md`
    - canonical terms
- `docs/history/changelog.md`
    - completed implementation history
- `docs/plans/active/`
    - supporting execution detail and retained completed records; not an operational queue; any
      lifecycle or prompt text is inert unless one canonical backlog item links and owns it
- `docs/plans/archive/`
    - closed or superseded plans
- `docs/tasks/product-briefs/`
    - supporting product-definition artifacts; legacy `backlog` metadata is artifact context only
- `docs/tasks/frontend-specs/`
    - supporting implementation-facing design specs; a spec cannot dispatch without one linked
      canonical backlog item
- `docs/tasks/backlog/`
    - the only operational queue and lifecycle authority
- `docs/process/`
    - reusable workflow rules

## Operational Classification Rule

Only item metadata under `docs/tasks/backlog/` can answer whether work is `ready`, `in_progress`,
`blocked`, or terminal. A `Status`, `Task`, `Stage`, `Next Recommended Role`, `Suggested Next Step`,
or role prompt anywhere else describes artifact maturity or retained history and cannot dispatch
work. If a non-backlog document has no single topical backlog link, it is explicit legacy migration
debt until Product creates or selects one; do not infer a task from it.

`/admin/capture` is a capture inbox and read-only repository mirror surface. Editable Admin-created
row states are intake/triage state, not the operational lifecycle. Retained work must resolve to one
Markdown backlog item before dispatch.

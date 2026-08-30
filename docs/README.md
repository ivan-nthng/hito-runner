# Hito Documentation Map

Start with root [`AGENTS.md`](../AGENTS.md), the assigned role card and the selected Notion Task.
Follow its `Repository document`, then load only the durable context needed by that task. This page
routes context; it is not a mandatory reading list or lifecycle authority.

## Current Truth

| Need                                                  | Canonical owner                                          |
| ----------------------------------------------------- | -------------------------------------------------------- |
| Product purpose and pipeline                          | [`context.md`](context.md)                               |
| Accepted product behavior and business processes      | [`current-product.md`](current-product.md)               |
| Implemented architecture and unavailable boundaries   | [`current-system.md`](current-system.md)                 |
| Released baseline and current implementation boundary | [`current-state.md`](current-state.md)                   |
| Route, presentation, truth-owner and verifier lookup  | [`current-functional-map.md`](current-functional-map.md) |
| Canonical vocabulary                                  | [`glossary.md`](glossary.md)                             |
| Reusable environment, QA and release procedures       | [`process/`](process/)                                   |
| Accepted public and technical history                 | [`history/`](history/)                                   |

Notion is the sole operational Task lifecycle writer. Repository Markdown owns technical decisions,
contracts, plans, runbooks and evidence; Git owns code history; Supabase owns runtime truth.

## Supporting Documents

- `docs/tasks/` retains technical evidence linked from Notion. Its metadata is historical context,
  never current Status, Phase, Owner or dispatch authority.
- `docs/plans/active/` may contain only a multi-step plan linked by a live nonterminal Notion Task.
  Completed or superseded plans belong in `docs/plans/archive/` after their current facts are
  promoted and links are repaired.
- `docs/tasks/product-briefs/` and `docs/tasks/frontend-specs/` support decisions and implementation;
  they cannot independently dispatch work.
- `docs/process/portable-project-agent-operating-model.md` is the standalone cross-project adoption
  contract. Hito-specific configuration remains in the Hito routing contract.

## Lifecycle Rule

Only the selected Notion Task can state current lifecycle. A status, owner, handoff prompt or next
step in Markdown is frozen artifact evidence. Load historical receipts only for a factual
discriminator that current truth cannot answer.

An active plan owns sequence, boundaries, rollback and proof detail for one live Task. When it ends,
promote enduring facts into the current Product, System, State or Glossary owner, then archive the
plan through a link-safe recoverable change. Do not create another index, dashboard or lifecycle
mirror.

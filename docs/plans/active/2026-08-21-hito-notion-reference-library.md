# Hito Notion Reference Library

## Outcome

Create a small shared Notion database named **Hito Library** for human reference notes. It helps Ivan
and the assigned agent find important runbooks, commands, module maps, product logic, and planning
notes without turning Notion into a duplicate documentation system.

## Authority

- Notion Library holds concise human notes, navigation metadata, and links.
- Repository Markdown remains the sole canonical technical source when one exists.
- `Hito Running` Tasks remains the sole operational task and lifecycle authority.
- A Library entry is not a Task, has no current owner, and never creates an agent handoff by itself.

## Minimal schema

| Property | Type | Purpose |
| --- | --- | --- |
| Title | Title | Human-readable reference name. |
| Kind | Select | `Runbook`, `Command`, `Product note`, `Marketing note`, `Architecture map`, or `Reference`. |
| Area | Select | Optional durable product area. |
| Review state | Select | `Current`, `Needs review`, `Outdated`, or `Archived`. |
| Summary | Rich text | Short human reminder; never a copied technical contract. |
| Canonical source | URL | Optional published repository document. |
| Workspace document | Rich text | Optional absolute local path while a source is unpushed. |
| Related task | Relation | Optional Hito Task that creates, changes, or reviews the reference. |
| Last verified | Date | Last factual review. |
| Verified by | Select | Role or `Ivan`; records a verifier, not a current owner. |

## Behaviour

- Agents have read/write access to Library through the established local Notion seam.
- An agent opens a Library entry only when it is linked from its selected Task, the Task changes the
  referenced source, Ivan explicitly requests it, or the entry is marked `Needs review` for that
  exact work.
- An agent verifies the linked source rather than treating a Library summary as technical truth.
- A factual source change updates the same Library entry's link, summary, review state and verifier.
- Personal notes, especially marketing notes, are not rewritten for tone or meaning without an
  explicit Task. An agent may mark them `Needs review` or add a narrow factual clarification.
- A missing source, stale command, or required substantive work becomes a Hito Task; it is not
  silently implemented from a Library entry.

## Initial creation

1. Create one isolated Notion database named `Hito Library` in the workspace.
2. Apply the minimal schema above; do not add task workflow, unique IDs, source keys, priorities,
   dependencies, or a separate Areas database.
3. Use the existing Hito logo asset for the database icon.
4. Add no historical documentation and no copied Markdown bodies.
5. Create only the first useful entries when a canonical source already exists; future entries are
   created on demand.
6. Prove the database is separate from Tasks, the logo and schema are present, and an agent can
   read/update one task-linked entry through the local seam without changing a Task lifecycle.

## Boundaries

No product runtime, Supabase, Vercel, credential, Git, deployment, automatic repository scan, bulk
documentation import, or permanent sync is part of this work. The local credential remains only in
`/Users/ivan/.config/hito/notion.env` and is never printed, copied, or stored in Notion content.

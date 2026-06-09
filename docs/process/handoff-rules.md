# Handoff Rules

Use these rules to avoid ownership gaps and overlap.

Optional continuity footer policy and footer format are defined in `AGENTS.md`.
Use `prompts/handoff-template.md` as the reusable scaffold only when the optional footer conditions
apply.

## Role Expectations

- Architect -> constraints, risks, migration/rollback
- Designer -> states, interactions, edge cases
- Backend/Frontend -> changed files, contract notes, limitations
- Data Quality -> rules, anomalies, trusted-output impact
- QA -> executed evidence, repro details, final risk statement

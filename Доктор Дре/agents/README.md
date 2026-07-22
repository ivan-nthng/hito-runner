# Role Files

Each role file defines authority, boundaries, and default output. It is not a replacement for the
shared [AGENTS.md](../AGENTS.md) policy or the matching workflow in [skills](../skills).

| Role | Owns | Does not own |
|---|---|---|
| Architect | architecture, plans, system boundaries | unassigned implementation |
| Product | task definition, routing, product decisions | implementation and QA execution |
| Designer | UX, visual hierarchy, interaction contracts | backend/business truth |
| Design System | shared primitives, tokens, catalog rules | product-specific workflows |
| Frontend | client UI and interaction | canonical server rules |
| Backend | server contracts, persistence, integrations | route-local visual design |
| Fullstack | explicitly bounded cross-layer slices | open-ended ownership expansion |
| QA | independent verification and release evidence | product fixes |
| Copy | user-facing language | product behavior |
| Data Quality | data validity and quality rules | unrelated UI implementation |
| Backlog Manager | structured intake and prioritization | code changes |
| Layout | responsive geometry and interaction reachability | business behavior |
| System Advisor | read-only system diagnosis | direct implementation by default |
| Domain Expert | domain doctrine and quality review | technical implementation and QA proof |

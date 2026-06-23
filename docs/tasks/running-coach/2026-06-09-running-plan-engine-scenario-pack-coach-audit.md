# Running Plan Engine Scenario Pack Coach Audit

Date: 2026-06-09
Owner: Running Coach
Status: historical scenario-pack acceptance evidence
Stage: RUNNING COACH quality audit / post-QA scenario JSON acceptance

Doctrine digest:
`/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/running-coach/running-coach-doctrine-digest.md`

Evidence preserved:

- `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-08-running-plan-creation-engine-rebuild.md`
- `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/qa-artifacts/plan-engine-scenarios/2026-06-09/README.md`
- `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/qa-artifacts/plan-engine-scenarios/2026-06-09/summary.json`
- all 13 scenario JSON artifacts under `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/qa-artifacts/plan-engine-scenarios/2026-06-09/`

## Final Verdict

The regenerated scenario pack was **coach-credible overall** and safe enough for post-QA scenario-pack acceptance.

No preview-ready scenario looked reckless or collapsed back to the old Easy/Steady/Long-only failure
mode. Variation was meaningful, load softening was visible, and every preview-ready workout remained
watch-executable through numeric segment structure.

## Scenario Judgment To Preserve

Accepted strengths:

- Beginner Half Marathon and beginner Marathon Base were correctly unavailable instead of faked.
- 10K supported plans had real development variety without overloading beginners.
- Half Marathon `runs_a_lot` and `professional_competitive` showed clearer threshold/durability identity.
- Marathon Base stayed durable and base-only without fake marathon-race readiness.
- Default HR stayed advisory/editable rather than pretending to be personal HR truth.

Main non-blocking quality gap:

- `sometimes_runs_half_marathon` was safe but still thin and too generic. It needed at least one
  clearer half-specific durability touch or controlled threshold-durability signal.

Additional polish:

- Long runs beyond roughly 90 minutes should rotate checkpoint purpose or finishing intent.
- `professional_competitive` should differ from `runs_a_lot` by more than tiny numeric changes when future safety budgets allow it.

## Safety Boundaries

Preserve these accepted guardrails:

- no fake precise pace from target time or ambition alone
- no fake personal HR
- no un-gating beginner Half or beginner Marathon Base without a safe bridge/extension doctrine
- no extra intensity just to make the calendar look visually richer
- no Marathon Base drift into full marathon race preparation
- no weakening of the watch-executable segment contract

## Supersession

This file is now historical acceptance evidence. Later dynamic-matrix, no-dead-end, and
anti-flatness work refined the weak Half/Marathon Base richness issues while preserving the metric
truth and safety constraints above.

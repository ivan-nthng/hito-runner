# Running Plan Engine Scenario Pack Coach Audit

## Task

Audit the regenerated running-plan engine scenario JSON pack for training quality, richness, safety, and watch-executable usefulness.

## Stage

RUNNING COACH quality audit / post-QA scenario JSON acceptance.

## Evidence Reviewed

- `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/AGENTS.md`
- `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/agents/running-coach-agent.md`
- `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/skills/hito-running-coach-audit/SKILL.md`
- `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/current-product.md`
- `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/current-system.md`
- `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/current-state.md`
- `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-08-running-plan-creation-engine-rebuild.md`
- `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/qa-artifacts/plan-engine-scenarios/2026-06-09/README.md`
- `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/qa-artifacts/plan-engine-scenarios/2026-06-09/summary.json`
- all 13 scenario JSON artifacts under:
  `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/qa-artifacts/plan-engine-scenarios/2026-06-09/`

## Current Training Quality

The regenerated pack is materially better than the earlier deterministic outputs. It now reads like a real backend-owned training engine rather than a pure support-run filler generator.

The strongest improvements are:

- runner-level gating is honest: beginner Half Marathon and Marathon Base stay unavailable
- 10K supported plans now contain real development variety instead of only strides and tempo
- Marathon Base remains durable and does not fake marathon-race readiness
- every preview-ready workout is genuinely watch-executable through numeric segment structure
- default HR usage stays clearly advisory/editable rather than pretending to be personal HR truth

This is not a perfect coaching pack yet. The main remaining coaching-quality gap is the `sometimes_runs_half_marathon` scenario, which is acceptable but still thinner and more generic than the rest of the regenerated pack.

## Findings

### Pack-level verdict

- The pack is coach-credible overall.
- No scenario looks reckless or embarrassingly generic at the old Easy/Steady/Long-only failure level.
- Variation is now meaningful, not merely cosmetic.
- Load softening for heavier/conservative cases is visible and appropriate.

### Scenario matrix

| Scenario | Coach verdict | Weekly rhythm | Workout richness | Main concern |
| --- | --- | --- | --- | --- |
| `beginner_light_10k` | Acceptable | Safe consistency block with strides every few weeks | Minimal by design, but not useless | Still visually repetitive, though appropriately so for true beginners |
| `beginner_heavy_10k` | Acceptable | Same safe rhythm as light beginner, but softened long-run progression | Minimal by design, with good load softening | Variety remains intentionally low |
| `sometimes_runs_average_10k` | Good | One weekly development touch, cutbacks, honest endpoint | Tempo + intervals + strides | Could use a touch more distinction from `runs_a_lot` in feel, but acceptable |
| `runs_a_lot_light_10k` | Good | Credible one-touch 10K build | Tempo + intervals + hills + strides | None significant |
| `professional_competitive_10k` | Good | Strongest 10K rhythm in pack without becoming reckless | Tempo + two interval exposures + hills + strides | Differentiation from `runs_a_lot` is real but still modest |
| `sometimes_runs_half_marathon` | Borderline-good | Safe and orderly | Tempo + generic intervals + strides | Not enough half-specific threshold/durability flavor |
| `runs_a_lot_half_marathon` | Good | Clear half-specific progression | Tempo + threshold + threshold + strides | Could still show one more explicit endurance-specific long-run flavor later |
| `professional_competitive_half_marathon` | Good | Best half rhythm in pack | Tempo + threshold + intervals + threshold + strides | Still only one development day per week, but within scope |
| `sometimes_runs_marathon_base` | Good | Durable and conservative | Tempo + strides, with progressive long runs | Endpoint may feel visually anticlimactic but is honest |
| `runs_a_lot_heavy_marathon_base` | Good | Clearly softened conservative base build | Tempo + strides, shorter long-run ladder | Slightly plain, but appropriately conservative |
| `professional_competitive_marathon_base` | Good | Best Marathon Base pattern in pack | Tempo + threshold + hills + threshold + strides | Richer than `runs_a_lot`, though still not dramatically richer |
| `beginner_half_marathon` | Correctly unavailable | N/A | N/A | None |
| `beginner_marathon_base` | Correctly unavailable | N/A | N/A | None |

### 10K assessment

The 10K family is in the healthiest state.

What works:

- beginner 10K plans stay simple and safe
- supported 10K plans now include enough real variety to justify the family
- intervals are present where support allows them
- hills appear only in stronger support contexts
- professional 10K now looks more like a sharpened 10K build than a recycled recreational plan

What still feels limited:

- all development touches live on the same weekly slot and the non-quality weekdays are nearly identical across the block
- the pro/recreational gap is visible, but still narrower than a coach might ideally want

That said, for deterministic v1 this family is acceptable and substantially improved.

### Half Marathon assessment

This family is mixed.

What works:

- `runs_a_lot_half_marathon` and `professional_competitive_half_marathon` now feel distinctly half-oriented
- threshold sessions are the right direction for half specificity
- long-run duration progression is believable and conservative
- cutbacks are placed sensibly
- the final endpoint is explicit and honest

Main remaining issue:

- `sometimes_runs_half_marathon` still leans too much on generic tempo structure
- the lone interval session at week 9 reads more like generic aerobic support or 10K-style stimulus than distinctly half-marathon durability
- this scenario does not yet show enough threshold/durable-steady identity for the family

This is not a blocker for the whole pack, but it is the clearest quality gap.

### Marathon Base assessment

Marathon Base is solid and honest.

What works:

- it does not pretend to be a race-ready marathon plan
- weekly rhythm is durable and conservative
- long-run ladders are believable for base-only work
- heavier/conservative context is clearly softened
- the professional scenario is richer without becoming interval-heavy or performative

What is slightly underpowered:

- the `marathon_base_endpoint` is honest, but visually underwhelming after a 16-week block
- long-run anatomy repeats the same opener / main / checkpoint / finish pattern very often

These are polish concerns, not acceptance blockers.

### Runner-level differentiation

Differentiation is present and mostly credible.

Strong evidence:

- beginner Half / Marathon Base are blocked instead of being faked
- heavier beginner 10K and heavy Marathon Base clearly soften the long-run ladder
- `runs_a_lot` vs `professional_competitive` differences now exist in workout selection and volume, not just labels

Still limited:

- `runs_a_lot` vs `professional_competitive` often differs by one extra development touch or slightly larger prescriptions, rather than a clearly different training character
- this is acceptable for v1, but backend should avoid calling the pro tier “professional” in spirit unless later slices widen the distinction further

### Watch-executable usefulness

This pack is meaningfully useful for watch/app execution.

What works:

- every preview-ready workout contains explicit segment order
- work/recovery repeats are machine-readable and runner-readable
- distance-based interval reps and recovery reps are clear
- hill workouts are concrete enough for a watch
- long runs are no longer anonymous single-block filler

What is still only adequate:

- some support and long-run variants still reuse near-identical anatomy too frequently
- a few named workouts are richer in identity than in actual structural contrast

This is a richness concern, not an executable-contract failure.

## Safety Concerns

No blocker-level safety concern was found in the preview-ready scenarios.

Safety positives:

- no fake precise pace
- no fake personal HR
- default HR stays advisory/editable
- no two-quality-week logic is sneaking in
- post-long-run Monday recovery placement is conservative
- heavy/conservative profiles are softened rather than cosmetically relabeled

Non-blocking safety caution:

- `sometimes_runs_half_marathon` is safe, but because it lacks stronger half-specificity, it risks feeling like a generic aerobic build rather than a clearly goal-shaped half plan

## Recommended Coaching Changes

### Should fix

1. Strengthen `sometimes_runs_half_marathon`.
   - Replace at least one of the repeated generic tempo touches with a clearer half-specific durability signal.
   - Best candidates: one controlled threshold-durability session or one long-run steady-finish variant in the middle-to-late build.

2. Increase long-run structural variety in Half and Marathon Base.
   - The opener / main / checkpoint / finish pattern is useful, but too repeatedly identical.
   - Rotate checkpoint purpose or finishing intent every few exposures so long runs feel coached rather than templated.

### Acceptable but could improve

1. Widen `runs_a_lot` vs `professional_competitive` differentiation.
   - Keep the same safety ceiling if needed.
   - But ensure the pro tier is not only a slightly longer version of the same block.

2. Make Marathon Base endpoint feel more like a deliberate base closeout.
   - It should stay honest and not become a fake marathon event.
   - But it could read more like a purposeful durability checkpoint than a quiet support day.

## Product Rules To Encode

1. `sometimes_runs_half_marathon` should require at least one clearly half-specific durability touch in addition to generic tempo.
2. Supported Half Marathon plans should not rely on tempo-only identity across the whole block when threshold-capable doctrine is otherwise allowed in the family.
3. Long runs beyond roughly 90 minutes should rotate meaningful sub-roles, not only repeat the same checkpoint shell indefinitely.
4. `professional_competitive` scenarios should differ from `runs_a_lot` by at least one clearly stronger stimulus or progression shape, not only slightly larger numeric prescriptions.
5. Keep one-development-touch-per-week protection for this deterministic v1 slice; do not chase richness by adding a second hard session.

## What Not To Change

- Do not reintroduce fake pace from target-time or ambition alone.
- Do not require personal HR truth where only editable default HR is available.
- Do not un-gate beginner Half Marathon or beginner Marathon Base.
- Do not add intensity just to make the calendar look visually richer.
- Do not convert Marathon Base into a disguised full marathon race-prep block.
- Do not weaken the exact watch-executable segment contract.

## Next Recommended Role

BACKEND

## Blockers

No blocker for post-QA scenario-pack acceptance.

One should-fix coaching gap remains before calling the entire family set fully polished:

- `sometimes_runs_half_marathon` still needs stronger half-specific identity to match the quality level of the other regenerated families.

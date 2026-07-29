# Running Plan Engine Coach Doctrine - Historical Record

Date: 2026-06-08
Owner: Running Coach
Status: historical; deterministic engine doctrine superseded by AI-authored plan-first truth

## Original Problem

Early rebuilt-engine outputs could end on generic or incorrect endpoints, expose vague effort labels
instead of executable workout structure, and underuse runner context. This document originally
defined deterministic backend recipes for 10K, Half Marathon, and Marathon Base.

## Decision At The Time

The June 2026 rebuild assigned workout selection, progression, family matrices, endpoint shaping,
and metric gating to a deterministic backend engine. It used the runner levels
`beginner_new_runner`, `sometimes_runs`, `runs_a_lot`, and `professional_competitive`, required
numeric segment anatomy, and treated precise pace and executable estimated HR as unavailable.

Those authorship and metric rules are no longer current.

## Durable Lessons

- A plan must express the selected goal in its workout sequence and endpoint, not only in metadata.
- Every runnable section needs executable duration or distance anatomy; repeats need ordered work and
  recovery structure.
- Progression, rest spacing, recovery after demanding sessions, cutbacks, and taper/endpoint
  preparation must be plausible for the supplied runner facts.
- Beginner and conservative plans may reduce intensity but must not become unsafe or generic filler.
- Runner height, weight, age, experience, availability, and accepted HR profile are inputs, not
  reasons for body-shaming, medical inference, or unsupported physiological claims.
- Review and confirm must preserve the accepted plan exactly.

## Supersession Boundary

Current Hito uses:

`runner facts -> AI-authored full plan -> backend validation/compiler -> review -> exact confirm/persist`

Do not use this historical file to:

- make backend choose or repair workouts;
- restore deterministic Plan Preset, Marathon Base, or runner-level family matrices;
- reject AI-authored estimated pace merely because no benchmark exists;
- restrict executable BPM to personal zones only or treat accepted estimated BPM as readback-only.

Current orientation: [Running Coach Doctrine Digest](running-coach-doctrine-digest.md).
Full dated detail remains available in Git history at this stable path.

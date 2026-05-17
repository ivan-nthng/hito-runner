Status

Draft

Owner

Architect

Last Updated

2026-05-17

Context

The current `Update plan from history` track is now effectively complete as a bounded product loop:

- runners can request an update proposal
- the backend builds bounded longitudinal context
- proposal review is runner-facing and trustworthy
- explicit `Apply update` and `Keep current plan` now exist
- apply archive/replaces the active plan through `active_plan_refresh_v1`
- stale proposals block
- fixed weekday rest-day invariants survive proposal and apply
- controlled reliability validation finished with 2 out of 2 fresh proposal/apply successes

The next decision should now separate:

- true closeout and maintenance tails
- from
- the next highest-value product move

Current Product State

Hito now has one real explicit AI coaching loop:

1. create a plan
2. train against it
3. accumulate saved history, Garmin evidence, and body-note caution context
4. request `Update plan`
5. review a bounded proposal
6. explicitly apply or reject it

That means the product no longer stops at:

- single-workout Garmin interpretation
or
- proposal-only coaching

It now supports real runner-controlled future-plan revision from saved history.

What Is Now Good Enough

- proposal generation and runner-facing review are good enough to treat as live product truth
- explicit apply/confirm safety is good enough to close the main trust contract
- archive/replace lifecycle is good enough and should not be reopened into in-place mutation
- fixed weekday rest-day invariants are good enough as the canonical scheduling constraint
- stale-proposal blocking is good enough as the v1 freshness guard

What Should Not Be Reopened

- do not reopen proposal-only vs apply debate
- do not reopen archive/replace into in-place future-row mutation
- do not reopen fixed weekday off-days as a “soft preference” during refresh apply
- do not turn the review/apply loop into coach chat, diff editor, or background auto-adjustment

Residual Risks

- one earlier exploratory proposal-generation validation failure did not reproduce in the final controlled run
- full Safari direct click-through on `Apply update` was not rerun in the final reliability pass
- AI generation latency remains high at roughly 45 to 75 seconds

These are real, but they are not all the same kind of work:

- Safari click-through is a targeted verification tail
- the nonreproduced earlier validation issue is a watch item unless it recurs
- latency and generation reliability affect the day-to-day usability of the newly live feature

What Has Highest Runner Value Now

The highest immediate runner value is making the new `Update plan` loop faster and more dependable.

Reason:

- the core product loop is now live
- runners can already get and apply plan refreshes
- the biggest remaining friction in that loop is waiting a long time for a proposal and trusting that generation stays stable under ordinary use

Candidate Next Steps

1. AI generation latency/reliability hardening

- reduce proposal wait time where possible
- harden ordinary generation stability around the newly live apply loop
- treat the current 45 to 75 second latency as a product problem, not only an ops detail

2. One strict Safari direct-click confirmation for `Apply update`

- useful as a final targeted verification
- but this is maintenance verification, not the next main product track

3. PDF plan export

- nice runner utility
- but less valuable than improving the just-launched plan-refresh loop

4. Screenshot OCR for workout evidence

- still attractive for widening evidence intake
- but the current highest-leverage coaching loop is already built around FIT/ZIP plus saved history

5. Similar-run comparison

- still useful later
- but it extends analysis depth rather than strengthening the newly live update-plan loop

6. Richer comparison model next refinement

- still worthwhile later
- but no longer beats end-to-end refresh responsiveness and stability

What Is Maintenance vs Product Work

Maintenance / verification:

- one strict Safari direct-click confirmation for `Apply update`
- watching for recurrence of the earlier exploratory validation failure

Real product work:

- AI generation latency/reliability hardening
- PDF plan export
- screenshot OCR
- similar-run comparison
- richer comparison refinement

Recommended Next Step

AI generation latency/reliability hardening

Why this should come next:

- it improves the newly completed `Update plan` loop directly
- it affects every serious runner who uses the new coaching feature
- it is a better immediate investment than widening surface area again before the new loop feels fast and dependable enough

Recommended scope of the next track:

- instrument proposal-generation duration and major failure classes
- reduce unnecessary prompt/context weight where it does not increase coaching quality
- preserve the same bounded review/apply contract while making proposal turnaround feel less heavy
- treat nonreproduced validation failures as reliability cases to guard and classify, not as a reason to redesign the feature

What Waits

- Safari direct-click confirmation should happen as a targeted QA follow-up, not as the main product track
- PDF export should wait until the update-plan loop feels operationally mature
- screenshot OCR should wait until the current coaching/evidence path feels faster and more stable
- similar-run comparison should wait until the refresh loop no longer feels slow
- richer comparison refinement should wait unless a concrete coaching-quality gap appears in live usage

What Is Still Tempting But Should Wait

- widening the evidence funnel with screenshot OCR before the live AI refresh loop feels operationally solid
- adding more comparison sophistication before proposal turnaround time is improved
- treating one missing Safari rerun as a reason to postpone the next real product track

Exit Criteria

- the current `Update plan from history` track is treated as closed in planning terms
- the team has one explicit next product move rather than reopening the apply contract
- Safari direct-click confirmation is classified as verification tail work, not the next main track
- latency/reliability hardening is accepted as the next highest-value product step

Next Recommended Role

BACKEND

Suggested Next Step

Define one bounded backend latency/reliability hardening plan for `Update plan` proposal generation: measure proposal time, classify ordinary generation failure cases, identify prompt/context weight that can be reduced without weakening review quality, and hand frontend only the minimal loading-state implications after that contract is clear.

# Hito Plan Creation QA Matrix

## Status

Active QA reference

## Owner

QA

## Last Updated

2026-05-26

## Release-Readiness Closeout

Final status: controlled beta ready.

Release evidence on 2026-05-26 is internally closed:

- the first richness QA pass found S7/S8 under-structured ultra and mountain/trail workout-detail issues
- backend repaired ultra time-on-feet, technical trail, and climbing steady segment structure
- the rerun evidence superseded the earlier partial-pass verdict
- visual QA passed with screenshot evidence in `docs/process/screenshots/plan-creation-richness-2026-05-26/`
- Running Coach approved plan creation as coach-credible enough for first real users / controlled beta

No launch blockers remain for plan creation. Future work should treat the following as backlog polish, not release blockers:

- capture one visual screenshot that explicitly shows `Default HR guidance`
- keep improving plain easy/support day detail richness
- consider stronger ultra calendar wording if users still perceive relaxed ultra plans as too Long-heavy

## Purpose

Verify that plan creation produces credible, diverse, safe running plans across runner types, goal types, terrain contexts, and execution modes, while preserving backend-owned truth and review/confirm safety.

This matrix exists to catch regressions where a plan "creates successfully" but violates coaching quality, mutation safety, metric gating, fixed rest-day truth, segment structure, or visible workout identity/glyph semantics.

## In Scope

- Structured first-plan creation on `/`.
- `AI setup` / voice draft review and confirm flow.
- Text authoring compatibility path.
- Advanced JSON import path where relevant to calendar/icon verification.
- Active-plan refresh proposal/apply safety where plan mutation is involved.
- Home/calendar workout identity rendering.
- Workout detail segment structure and target/cue rendering.
- Glyph/icon correctness for visible workout labels.

## Out Of Scope

- Medical diagnosis.
- Rehab advice.
- Garmin feedback content quality except where it affects plan mutation safety.
- Billing/entitlement economics beyond capability gating behavior.
- Provider sync, weather adaptation, exact route/elevation prescription.

## Global Pass Criteria

Every scenario must verify:

- No mutation before explicit confirm/apply.
- Exactly one active plan after successful first-plan confirm.
- Fixed rest days stay off.
- No fake numeric pace or HR targets.
- Personalized HR targets require personal HR-zone truth.
- Default estimated HR guidance may appear when profile age exists; it must be labelled default/estimated/not personalized.
- No bpm HR guidance appears when age is missing or the workout type is unsuitable for HR guidance.
- `pace_min_per_km_range` appears only when watch/app access, pace or mixed preference, and usable recent 5K benchmark truth allow it.
- Workout detail reflects backend-shaped truth.
- Exact workout identity is visible where detail/review should show it.
- Calendar/home visible label and glyph match workout semantics.
- Plan contains believable variety for the stated runner and goal.
- Review/confirm copy is bounded, non-medical, and honest about weak support.

## Severity Labels

- `blocker`: unsafe mutation, fake metrics, rest-day violation, wrong active-plan state, or severe coaching mismatch.
- `should fix`: behavior works but meaning is misleading, generic, or brittle.
- `acceptable but could improve`: safe and truthful, but less polished or less specific than desired.
- `future coaching enhancement`: outside current implementation scope.

## Coverage Matrix

### A. Core Structured Plan Creation

#### 1. Beginner, age 18-22, no watch/app, unknown benchmark, `build_consistency`, 3 days/week

Expected:

- Mostly easy running.
- Weekly long run present but conservative.
- No pace targets.
- No personalized HR targets.
- If age is present, any bpm HR guidance is broad default estimated guidance and clearly marked not personalized.
- Effort/cue language only.
- Review says nothing has been created yet.
- After confirm, exactly one active plan exists.

#### 2. Beginner adult, no watch/app, recent 5K benchmark present, relaxed `5k`, 3 days/week

Expected:

- Benchmark does not force pace targets.
- One light quality stimulus at most.
- No personalized HR targets.
- If age is present, default estimated HR guidance may appear; it must be labelled as default/estimated/not personalized.
- Pace remains effort-based.
- Review does not overstate race readiness.

#### 3. Regular runner, watch/app available, recent 5K time, balanced `10k`, 4 days/week

Expected:

- Tempo or interval work with warmup/main/cooldown.
- Broad pace ranges allowed where appropriate.
- Long run progresses.
- Calendar shows Tempo/Intervals with correct glyphs.
- Easy and long runs do not become over-precise everywhere.

#### 4. Performance-focused runner, watch/app available, recent 5K pace, target-time `half_marathon`, 5 days/week

Expected:

- Threshold/tempo durability and interval variety.
- Review calls out target-time support honestly.
- Long-run progression is meaningful.
- Later plan includes steady-finish or race-specific structure when justified.
- Cutback/taper behavior remains visible.

### B. Long-Distance And Terrain Doctrine

#### 5. Balanced `marathon`, 4 days/week, no benchmark, watch unknown

Expected:

- Conservative marathon build.
- Effort-based targets.
- Long-run progression stronger than 10K/half.
- Taper weeks remain below pre-taper long-run peak.
- Review includes honesty when support is limited.

#### 6. Target-time `marathon`, watch/app plus recent 5K benchmark, fixed Tue/Fri rest

Expected:

- No workouts land on Tue/Fri.
- Pace targets appear only where allowed.
- Long-run specificity and cutback rhythm are visible.
- Review does not overclaim certainty if support is still weak.

#### 7. Relaxed `ultra_marathon`, no watch, unknown benchmark, 4 days/week

Expected:

- Time-on-feet durability emphasis.
- Conservative load and long-run growth.
- No fake elevation or pace specificity.
- No generic 10K-style interval template disguised as ultra prep.
- Ultra durability identities appear where appropriate.

#### 8. `mountain_running`, fixed Wed/Sun rest, no watch, unknown benchmark

Expected:

- Hill, climbing, downhill caution, hike/run, or time-on-feet logic appears.
- Technical/downhill caution language remains non-medical.
- No exact elevation target.
- Long runs mention terrain exposure conservatively.
- No workouts land on Wed/Sun.

#### 9. `mountain_running`, watch/app, recent 5K benchmark, balanced or ambitious style

Expected:

- Mountain-specific sessions still prioritize effort on climbs.
- Pace ranges do not become absurd on hill repeats.
- Hill repeats or climbing steady sessions have explicit structure.
- Glyphs and labels remain correct.
- Mountain taper reduces terrain stress.

#### 10. `marathon` or `ultra_marathon` with `rolling` terrain focus

Expected:

- Rolling-hills sessions appear where relevant.
- Terrain changes workout mix, not just review copy.
- No exact elevation prescription.
- Long-run identity remains goal-family appropriate.

### C. Safety And Constraint Handling

#### 11. Runner comment mentions pain, tightness, or recovering

Expected:

- Plan becomes more conservative.
- Review/safety language stays non-medical.
- No diagnosis, treatment, or rehab prescription.
- No silent increase in quality density.

#### 12. Runner comment mentions travel, poor sleep, high stress, or busy schedule

Expected:

- Progression remains conservative.
- Quality density does not silently increase.
- Assumptions mention scheduling or recovery limits where supported.

#### 13. Heart-rate guidance preference without personal HR-zone truth

Expected:

- With age, broad `default_estimated_hr` ranges may appear where the workout type supports HR guidance.
- Default HR guidance is labelled `Default HR guidance` and explains it is estimated from age, not personalized zones.
- Without age, no bpm HR guidance appears and effort-only guidance remains.
- Workout detail uses effort cues or safe hints whenever numeric HR is absent or unsuitable.

#### 14. Mixed or pace-guided preference with watch/app and benchmark

Expected:

- Pace ranges appear only on appropriate segments.
- Easy/long runs do not become over-precise everywhere.
- No personalized HR targets unless personal HR-zone truth exists.
- Default estimated HR guidance may appear when age exists and must remain clearly labelled as default/estimated/not personalized.
- Pace ranges remain broad and workout-specific.

### D. Review And Mutation Safety

#### 15. Structured draft path

Expected:

- `generateStructuredFirstPlanDraft` review shows plan shape, metric policy, assumptions, and safety notes.
- Backing out leaves no active plan.
- Confirm is the only mutating step.
- Confirm blocks if an active plan already exists.

#### 16. Voice draft path with missing truth

Expected:

- `clarification_required`.
- No plan created.
- Questions are concrete and bounded.
- No raw schema/internal error text leaks.

#### 17. Voice draft path with enough truth

Expected:

- `draft_ready`.
- Review calls out goal-style downgrades or target-time support gaps.
- Confirm is the only mutating step.
- Raw transcript is not persisted as profile truth.

#### 18. Text authoring compatibility path

Expected:

- Conservative defaults when user text is underspecified.
- Generated plan respects canonical rest-day and safety rules.
- No drift away from structured authoring contract.
- Ultra/mountain goals do not flatten to generic marathon.

#### 19. Active-plan refresh proposal after missed workouts or fatigue context

Expected:

- Proposal only until explicit apply.
- Past/logged/Garmin/comparison/AI-backed history fixed.
- Proposal contains exact reviewed draft.
- Apply verifies stale fingerprint/checksum/mutable guards.
- Future schedule still respects fixed rest days and workout diversity.
- Apply does not call OpenAI or regenerate.

### E. Workout Identity And Structure Audit

Across the full corpus, confirm at least one visible example of:

- Easy aerobic run.
- Recovery jog.
- Steady aerobic run.
- Progression run.
- Long aerobic run.
- Long run with steady finish.
- Controlled tempo session.
- Tempo intervals.
- Distance intervals.
- Time intervals.
- Uphill repeats.
- Rolling hills session.
- Climbing steady run.
- Technical trail easy run.
- Controlled downhill durability.
- Hike-run endurance.
- Mountain long run time-on-feet.
- Cutback aerobic run.
- Cutback long run.
- Race/taper tune-up if currently implemented.

For each exact session shown in workout detail:

- Easy/recovery/steady sessions may be single-block.
- Tempo/interval/hill sessions must show warmup/main/cooldown or repeat structure.
- Repeat sessions must have recovery guidance.
- Segments must show target or safe cue/hint depending on execution mode.
- Structured extras must not leak as `[object Object]`.
- Distance-first intervals should remain visibly distance-first.

### F. Glyph And Icon Audit

Verify visible label to glyph mapping:

- Easy: open circle.
- Recovery: soft crescent/low arc.
- Long: long arrow.
- Tempo: upward arrow.
- Intervals: repeated bars.
- Progression: rising step mark.
- Race: rosette/medal mark.
- Quality: focus/diamond mark.
- Rest: dash.

Check on:

- Home/calendar month cells.
- Shared `WorkoutGlyph` renderer.
- `/hitoDS` examples if used as reference.
- Workout detail identity areas where glyphs appear.

Flag as failure if:

- Tempo, Intervals, Progression, or Race collapse into one generic quality glyph.
- Label says one type and glyph implies another.
- Rest or long-run glyphs are mismatched.
- Icons are correct in DS docs but wrong in product surfaces.
- Month cells reintroduce distance, duration, target, or dashboard clutter.

## Corpus-Level Coaching Checks

Across all generated plans, verify:

- Majority of running remains easy/steady.
- Cutback rhythm appears where expected.
- Long-run progression differs by goal family.
- Taper weeks do not contain the plan peak long run.
- Mountain/rolling logic changes session choice, not just copy.
- Target-time honesty appears when support is weak.
- Generic `Quality` overuse is low.
- Exact workout titles are diverse enough to feel intentional.
- Hard days do not exceed runner frequency/recovery support.
- Fixed rest days remain fixed.
- Pace precision follows backend metric policy.
- HR guidance follows backend metric policy: personal zones only from personal HR-zone truth, default estimated HR only from age, and no bpm HR guidance without age or on unsuitable workout types.

## Execution Notes

For each scenario, record:

- Input path used: structured, AI setup, text authoring, JSON import, or refresh.
- Auth/tester identity.
- Whether any DB rows existed before review.
- Draft/review result.
- Confirm/apply result.
- Active plan count after mutation.
- Rest-day invariant result.
- Metric target result.
- Workout identity examples found.
- Calendar label/glyph result.
- Any gaps caused by unavailable fixtures.

## Expected Output Format

1. Task
2. Stage
3. Browser Path Preflight
4. Scenario coverage
5. Results
6. Issues found
7. Coverage gaps
8. Verdict

Use exact verdict format:

- `Verdict: Passed`
- `Verdict: Failed`

## Recommended First Proof Pass

When this matrix is first exercised, start with:

- Scenario 1
- Scenario 3
- Scenario 5
- Scenario 8
- Scenario 13
- Scenario 15
- Glyph and icon audit

Browser QA must use the built-in Codex app/browser first whenever it can cover the task. Safari is fallback unless Safari-specific verification is required or the built-in browser is blocked.

## Disposable Saved-Mode Rich Workout Fixture

Use this local/test-only fixture when QA needs to browser-verify stored rich workout fields without waiting for OpenAI rich drafting.

Fixture account:

- Username: `qa-rich-workout`
- Email: `qa-rich-workout@local.test`
- Password: `qa-rich-workout-pass-20260525`
- Display name: `Rich Workout QA`

Seed/reset command:

```bash
npm run test-user -- create --username qa-rich-workout --email qa-rich-workout@local.test --password qa-rich-workout-pass-20260525 --display-name "Rich Workout QA" --plan scripts/fixtures/rich-workout-saved-mode-fixture.json
```

Cleanup command:

```bash
npm run test-user -- delete --email qa-rich-workout@local.test --confirm-email qa-rich-workout@local.test
```

Expected fixture content:

- Exactly one active saved-mode plan titled `QA Rich Workout Saved-Mode Fixture`.
- Stored rich workout rows for `steady_aerobic_run`, `rolling_hills_session`, and `technical_trail_easy`.
- One compact-only `Controlled tempo session` row with no stored rich/source fields so old-plan fallback remains checkable.
- Segment guidance/cue/hint exists on every fixture segment.
- No stored pace, HR, cadence, fueling, transcript, prompt, or production auth truth.

Browser verification should use the built-in Codex browser first, then Safari only if the built-in browser cannot cover the flow. Verify calendar labels/glyphs for Steady, Hills, and Trail come from stored rich fields, workout detail shows exact identity plus backend segment guidance, and cleanup/reset restores the disposable account safely.

Archive Note

Archived during the 2026-05-25 active-plan inventory cleanup.

Classification: Complete / archive now.

Reason: The implemented behavior is now reflected in current docs or in newer archived closeout plans. This artifact is historical and should not drive new work by inertia.

Future agents should not continue this artifact by default. If the product need returns, create a fresh active plan from current `docs/current-*` truth.

---

Status

Implemented

Owner

Frontend Agent

Last Updated

2026-05-13

Checklist

- [x] Move `Replace today` behind quieter disclosure in text-first onboarding.
- [x] Move `Replace today` behind quieter disclosure in advanced JSON import.
- [x] Demote JSON paste and template tooling into expert disclosure.
- [x] Lighten the `Log result` Garmin continuation into a divided row.
- [x] Preserve backend behavior and existing feature paths.

Context

The recent wording cleanup improved honesty and sentence quality across `Feedback`, `Create plan`, and `Import plan`, but the next visible issue is hierarchy rather than copy. In the current implemented product truth:

- safe default actions already exist
- destructive override exists only as `Replace today`
- advanced JSON import exists as a real expert fallback
- Garmin upload and review exist as a secondary evidence path inside workout detail

This pass does not change product behavior, backend contracts, or feature paths. It only clarifies visual weight, disclosure, and action hierarchy so safe actions stay primary and destructive or expert actions feel quieter.

Current Hierarchy Problems

- `Replace today` is still too visually close to the main apply action in both text-first onboarding and JSON import. It reads as a sibling choice instead of an exception path.
- The advanced JSON fallback in `Create plan` still expands into a visually substantial block with multiple medium-weight controls, so the expert path competes with the text-first primary path.
- The JSON import dialog footer still places `Cancel`, `Replace today`, and `Import plan` in one visible action cluster. Even with calmer copy, the destructive override remains too available.
- The Garmin bridge inside `Log result` is still presented as a bordered promo-like block. It is secondary in product importance, but still looks too much like a parallel feature entry point.
- Supporting helper text is calmer than before, but disclosure structure is still shallow. Too much remains permanently visible instead of being shown only when relevant.

What Must Stay Primary

- `Create plan` remains the primary action on the onboarding surface.
- Safe `Import plan` remains the primary action on JSON-based apply surfaces.
- Manual workout result logging remains primary inside `Log result`.
- Deterministic `Plan vs run` remains primary inside loaded-state `Feedback`.
- Recommendation remains visible but secondary to factual comparison.

What Must Be Quieter

- `Replace today` on all surfaces.
- JSON fallback inside text-first onboarding.
- `Download JSON template`.
- `Or paste plan JSON`.
- Garmin bridge copy and CTA inside `Log result`.
- Technical caveats, warnings, and expert-only explanation.

Surface Recommendations

Feedback

- Primary action:
  Review `Plan vs run` as the dominant loaded-state section.
- Secondary action:
  Read `Recommendation` after comparison is understood.
- Destructive action:
  `Remove file`.
- Fallback or expert path:
  Technical comparison caveats and detailed notes.
- Inline:
  attached-file owner row, `Ready` pill when applicable, verdict row, compact evidence or confidence or checks strip.
- Disclosed:
  technical caveats, comparison notes, retry nuance, and file-removal affordance.
- Collapsed:
  any diagnostic wording that explains why a signal is unclear or not applicable beyond one short visible summary.

Create plan

- Primary action:
  `Create plan`.
- Secondary action:
  none at equal weight; the only immediate companion should be lightweight helper guidance, not another equally loud action.
- Destructive action:
  `Replace today`.
- Fallback or expert path:
  `Import from JSON`.
- Inline:
  page title, short support copy, free-text request field, primary CTA, one short helper line about default safe behavior.
- Disclosed:
  `Replace today` and its risk framing.
- Collapsed:
  the JSON import block by default, including file and paste tooling until the user explicitly opens it.

Import plan

- Primary action:
  safe `Import plan`.
- Secondary action:
  `Upload file` and `Check JSON`.
- Destructive action:
  `Replace today`.
- Fallback or expert path:
  paste JSON, template download, and replace-first-day override.
- Inline:
  dialog title, one-line purpose, upload affordance, validation summary, safe import CTA.
- Disclosed:
  paste JSON area, template download, and destructive override framing.
- Collapsed:
  `Replace today` until a valid plan exists and the user explicitly asks to override today.

Replace Today Recommendation

Best option: keep `Replace today` behind a disclosure, not as a permanent sibling button beside the safe action.

Why this is the best fit now:

- the product logic already defines it as the only destructive override
- the current live default is safe apply
- the current UI still overstates it by keeping it visible beside the primary CTA

Recommended treatment:

- In `Create plan`, move `Replace today` under a small disclosure directly below the helper line:
  `Need the new plan to start today instead?`
- In `Import plan`, hide `Replace today` until the plan is valid, then reveal it inside a quieter destructive disclosure area below the main apply action.
- Do not give `Replace today` the same baseline alignment, size, or persistent visibility as the primary CTA.
- Do not make `Replace today` the second button in the first visible action row.

JSON Fallback Recommendation

The advanced JSON path should remain available but feel clearly expert-only.

Recommended treatment:

- Keep it below the text-first flow.
- Keep it collapsed by default.
- Reduce its visual chrome so it reads as a utility section, not a parallel onboarding mode.
- Split the visible flow into quieter steps:
  `Open advanced import` -> `Upload or paste` -> `Check JSON` -> `Import plan`
- Keep `Upload file` visible first.
- Treat `Download JSON template` and `Or paste plan JSON` as secondary tools inside the expanded section, not as co-primary actions.
- Prefer one compact validation summary row over multiple equally loud controls and notes stacked together.

Garmin Bridge Recommendation

The Garmin bridge in `Log result` should stay discoverable without competing with manual completion.

Recommended treatment:

- Replace the promo-card feeling with an inline divided continuation row.
- Keep one small state pill only when it materially helps, such as `Ready` or `In progress`.
- Reduce the body copy to one short line.
- Keep the CTA as a smaller secondary action.
- Remove any payoff line that feels like a feature advertisement.
- Treat the bridge as a continuation into `Feedback`, not as a second primary task inside `Log result`.

Hierarchy Tokens

- Use one display heading per surface, not multiple competing title moments.
- Use `hito-label` only for true micro-labels, not as the main hierarchy driver.
- Prefer `hito-section-title` or a comparable stronger heading for the main content block.
- Use `hito-section-divider` to separate sections before adding containers.
- Keep primary CTAs in `hito-button-primary`.
- Keep secondary utility actions in `hito-button-secondary`.
- Keep destructive overrides in a quieter outlined treatment only after disclosure.
- Use `hito-status-pill` only for short state confirmation, not as an attention amplifier.
- Keep expert help in `hito-field-helper` or a disclosed support block.

What should not appear equally loud on the same surface:

- `Create plan` and `Replace today`
- `Import plan` and `Replace today`
- manual completion save and Garmin continuation CTA
- text-first onboarding and advanced JSON fallback
- deterministic comparison result and technical caveat detail

Risks

- Over-demoting `Replace today` could make the override feel hidden if the disclosure cue is too subtle.
- Over-collapsing JSON tools could hurt tester efficiency if upload and paste are buried too deeply.
- Over-lightening the Garmin bridge could reduce discoverability for runners who do not realize `Feedback` owns the upload path.

QA Notes

- Verify that the first visible CTA on `Create plan` is always the safe default.
- Verify that `Replace today` is not visible at equal weight before the user reaches the disclosure area.
- Verify that expanded JSON fallback still supports upload, paste, validate, and safe import without increasing visual noise.
- Verify that `Import plan` remains easier to scan than `Replace today` in both default and valid-file states.
- Verify that `Log result` still reads as the place to save manual completion truth, with Garmin clearly secondary.
- Verify mobile stacking so destructive actions never become the topmost or largest visible button in a stack.

Open Questions For Frontend

- Should `Replace today` disclosure use an inline text trigger or a compact bordered row with a chevron, given the current Hito DS primitives?
- In the import dialog, should the paste JSON area live under its own nested disclosure or remain visible after the advanced import section is opened?
- In `Log result`, is the lightest viable bridge a simple divided row, or do we still need a very soft `hito-surface-flat` treatment for state clarity?
- On narrow screens, should the safe primary CTA always occupy its own row before any disclosed destructive action appears?

Next Recommended Role

FRONTEND

Suggested Next Step

Implement one narrow hierarchy pass across `OnboardingGate`, `UploadJsonDialog`, and the `LogResultFeedbackBridge` inside `CompletionPanel`, using disclosure and quieter destructive placement rather than new product logic.

Implementation Notes

- Implemented one shared `hito-disclosure` primitive in `src/styles.css`.
- Safe `Create plan` and `Import plan` remain primary.
- `Replace today` remains available and still submits `replace_first_day`, but only after explicit disclosure.
- JSON upload remains visible first; paste JSON and template download are now expert tools behind disclosure.
- `Log result` now uses a lighter divided continuation row into `Feedback`.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Defined a focused hierarchy and disclosure cleanup pass for `Feedback`, `Create plan`, and `Import plan` after the wording cleanup, without changing product behavior.

### Key Decisions

- `Replace today` should no longer appear as a permanent sibling of the safe primary action and should move behind disclosure.
- Advanced JSON and Garmin continuation paths should remain discoverable but visually quieter than the safe default actions they support.

### Current State

- Copy is already calmer and more honest, but destructive and expert paths still carry too much visible weight.
- The product logic remains correct: safe apply is primary, `Replace today` is the only destructive override, and Garmin review belongs to `Feedback`.

### Constraints

- Do not change backend behavior or introduce new feature paths.
- Keep manual result logging primary, deterministic comparison primary inside `Feedback`, and destructive or expert actions secondary.

### Risks / Open Questions

- Disclosure that is too subtle could hide `Replace today` more than intended.
- Garmin bridge reduction must preserve discoverability without re-promoting it into a parallel primary action.

### Next Recommended Role

FRONTEND

### Suggested Next Step

Apply the hierarchy cleanup in the three live components using existing Hito DS primitives, then run Safari QA on desktop and mobile-width states for default, valid, and destructive-disclosure scenarios.
```

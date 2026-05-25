Archive Note

Archived during the 2026-05-25 active-plan inventory cleanup.

Classification: Complete / archive now.

Reason: The implemented behavior is now reflected in current docs or in newer archived closeout plans. This artifact is historical and should not drive new work by inertia.

Future agents should not continue this artifact by default. If the product need returns, create a fresh active plan from current `docs/current-*` truth.

---

Status: Implemented
Owner: FRONTEND
Last Updated: 2026-05-18

# 2026-05-18 Full DS Consistency Audit

## Summary

The full visible-interface audit found no broad high-severity Hito DS breakage. Buttons, inputs, icons, typography roles, toast behavior, and modal anatomy are mostly healthy. The highest-value remaining drift is concentrated in button semantics and a small amount of shell micro-typography.

## Findings

- Destructive/error actions currently rely on local red styling overrides instead of one DS-owned button tone contract.
- Hito needs semantic button tones that compose with existing hierarchy variants instead of creating a separate destructive button family.
- Success tone is missing as a canonical option, but should remain reserved for explicit positive confirmation states rather than replacing ordinary primary actions.
- Secondary and outlined variants must keep distinct jobs:
  secondary is soft and borderless
  outlined/lined is border-led
- Repeated tiny uppercase shell/menu labels still appear as local typography recipes in a few places.

## Decisions

- Keep existing button hierarchy classes:
  `hito-button-primary`, `hito-button-secondary`, `hito-button-outlined`, and `hito-button-ghost`.
- Add semantic tones on top of that hierarchy:
  default, success, and error.
- Use `error` as the canonical red visual tone. Destructive actions may use the error tone, but there should not be a separate competing destructive visual system.
- Keep success tone conservative and avoid converting ordinary positive CTAs to success.
- Add one shared micro-typography role for tiny uppercase shell/menu labels and apply it only where the drift is obvious.

## Checklist

- [x] Add DS-owned success and error button tones across primary, secondary, outlined, and ghost variants.
- [x] Keep default primary signal/orange, secondary soft borderless, outlined border-led, and ghost quiet.
- [x] Document hierarchy plus tones in `/hitoDS#buttons`.
- [x] Replace local destructive/error button overrides in `OnboardingGate`, `UploadJsonDialog`, and `PlanManagementDialog`.
- [x] Add one micro-label typography role and apply it narrowly in `AppShell`.
- [x] Update current docs and changelog with implemented behavior only.
- [x] Run targeted ESLint, `git diff --check`, and `npm run build`.

## Exit Criteria

- `/hitoDS#buttons` shows default, success, and error tones across the canonical button hierarchy.
- Product destructive actions use the canonical error tone instead of local red override combinations.
- Secondary remains soft and borderless; outlined remains visibly border-led.
- The targeted AppShell micro-label drift is covered by a shared Hito class.
- No modal, input, toast, backend, calendar, or workflow behavior changes are introduced.

# Project State Snapshot

## Status

Active

## Last Updated

2026-05-17

## Where We Are Now

- The email-auth flow is now aligned with SSR-safe Supabase passwordless callbacks:
  link requests now ask Supabase for PKCE-oriented handling,
  `/api/auth/confirm` can now accept either an auth `code` or a `token_hash` callback,
  and the remaining live dependency is correct Supabase dashboard URL/template configuration instead of a mixed implicit-vs-SSR code path.
- Phase 0 and Phase 1 baseline import work are implemented.
- Phase 2 auth and env setup are implemented.
- Phase 2 auth runtime QA fixes are implemented:
  auth callback redirects now resolve against the live runtime origin unless `APP_BASE_URL` explicitly overrides it, and `/login` preserves the original safe `next` intent instead of nesting login into itself.
- A temporary local account-backed auth bypass is implemented:
  `/login` now shows visible username/password login for configured local accounts, keeps an httpOnly cookie without depending on Magic Link delivery for the main local flow, and no longer offers email sign-in links from loopback local runtimes unless a real public `APP_BASE_URL` is configured.
- Canonical plan storage wiring is now implemented for the current saved-mode onboarding flow:
  when a server-side Supabase key is configured, local bypass users map into a Supabase auth user, persist their generated or imported plan into Supabase, and read saved mode back from the canonical Supabase tables instead of the local state file.
- The current local admin plan has now been cut over into Supabase:
  the linked project contains the base persisted schema, the current JSON week is imported as the active canonical plan, and saved-mode SSR now resolves `/progress` and `/workout/$date` from Supabase.
- A practical tester-account lifecycle tool is now implemented:
  Backend can create a tester, reset that tester back to onboarding, optionally reseed plan data, and delete the tester through one canonical CLI path documented in `docs/process/test-user-lifecycle.md`.
- Phase 3 architecture cleanup is now implemented through one canonical persisted richer-plan contract.
- Phase 4 completion persistence and backend-derived week status are implemented.
- Phase 5 frontend polish for login, onboarding, workout-save feedback, and route-level edge states is implemented.
- The production-facing local auth legacy cleanup slice is now implemented:
  deploy-visible login now exposes only the real email auth path, while the temporary local credentials bypass remains available only on loopback local runtimes for development.
- The urgent auth redirect-origin fix is now implemented:
  deploy-like Magic Link and callback flows no longer trust a loopback `APP_BASE_URL` override, so non-local auth redirects resolve back to the real app domain instead of falling through to `localhost`.
- The local Magic Link guard is now implemented:
  loopback local runtimes without a real public `APP_BASE_URL` no longer offer or send email sign-in links, so local auth no longer generates broken `localhost` magic-link emails that cannot be completed outside the running dev server.
- The final Phase 5 legacy-removal slice is now implemented:
  deprecated `week_1_preview[]` import support has been removed from the active runtime, CLI tooling, and visible import contract, so `training-plan-v2` is now the only remaining supported plan-import format.
- The first actual deletion slice from the final Phase 5 plan is now implemented:
  `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` have been removed from the active runtime and CLI env contract, so public Supabase browser config now resolves only from `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- The second actual deletion slice from the final Phase 5 plan is now implemented:
  `SUPABASE_SERVICE_ROLE_KEY` has been removed from the active runtime and CLI env contract, so server-side Supabase admin/write access now resolves only from `SUPABASE_SECRET_KEY`.
- The third actual deletion slice from the final Phase 5 plan is now implemented:
  deprecated single-account local auth env support has been removed from the active runtime and local tooling, so loopback local bypass now resolves only through `LOCAL_AUTH_BYPASS_ENABLED=true` plus `LOCAL_AUTH_BYPASS_ACCOUNTS_FILE=...`.
- The unauthenticated root flow is now login-first, and first-time onboarding is now text-first against the live OpenAI authoring seam, with JSON import visibly demoted to an advanced file-based fallback.
- The product-path recovery fix is now implemented:
  authenticated no-plan or no-workout states now show the same obvious text-entry plan creation surface, with advanced import kept secondary below it.
- The text-first onboarding post-submit transition fix is now implemented:
  successful plan creation now automatically opens a fresh saved-mode home request instead of leaving users stuck in the setup pending state.
- The temporary local saved-mode path now persists `completed`, `partial`, and `skipped` workout outcomes truthfully through the workout logging UI, including overwrite from an existing completed result.
- Home/calendar now resolve `today` from the real runtime local date and default the planning surface to that day instead of a frozen demo date.
- The saved-mode home/calendar page now keeps the main `Today` hierarchy intact as a lighter open header, uses one divided support module on the right, removes the lower metadata strip, and marks day status with compact check/dash/cross symbols instead of bulky per-day pills.
- The first deterministic Garmin comparison slice is now implemented:
  saved-mode workout detail can now upload one Garmin `.fit` file or one `.zip` archive containing exactly one FIT activity file, the backend stores the original asset plus normalized actual metrics through Supabase, and that same backend seam now also persists a conservative deterministic planned-vs-actual comparison that the dedicated workout-detail `Feedback` surface reads back directly; AI analysis, screenshot OCR, provider sync, and calendar evidence markers remain later slices.
- The planned-duration truth-alignment fix for deterministic Garmin comparison is now implemented:
  comparison duration now resolves through the same canonical planned-duration helper used by workout detail, so visible planned duration and comparison planned duration no longer drift apart on distance-backed interval workouts.
- The richer deterministic Garmin comparison payload slice is now implemented:
  the backend now persists explicit comparison signals, `missing_actual` and `not_applicable` reasons, honest delta/tolerance metadata, session-summary facts, and step-summary data when ordered per-step duration comparison is trustworthy; the saved-mode workout-detail `Feedback` surface now reads that richer structured comparison truth back without adding AI interpretation.
- The first richer-comparison track implementation slice is now implemented:
  deterministic comparison payloads now also persist a support matrix plus segment-group summary, so warm-up/main/cooldown-style duration grouping is available only when ordered step comparison is trustworthy, while pace and heart-rate remain explicitly unsupported rather than inferred.
- The first richer-comparison frontend readback slice is now implemented:
  workout-detail `Feedback` now shows a compact `What this review checked` support readback plus warm-up/main/cooldown-style `Workout structure` grouping when the deterministic payload includes trustworthy segment summaries, while pace and heart rate stay quiet unsupported facts rather than implied comparisons.
- The bounded Garmin AI interpretation slice is now implemented:
  saved-mode workout detail now persists one `workout_ai_insights` row linked to the latest deterministic comparison, generated only from planned workout truth, normalized Garmin actual metrics, deterministic comparison payload, current week context, next-workout summary, and optional workout-scoped body-note context; the dedicated `Feedback` surface now reads that bounded AI interpretation back separately from the deterministic facts.
- The first immediate Garmin UX cleanup slice is now implemented:
  workout-detail `Feedback` now uses one calmer divided hierarchy with plain-language `Upload Garmin file`, `Plan vs run`, and `Recommendation` framing; `Log result` now includes one lightweight path into `Feedback` for deeper review; and `/integrations` no longer contradicts the live Garmin path with stale `Preview / View status / Not connected` placeholder language.
- The next post-cleanup Garmin entry slice is now implemented:
  `Log result` now shows a richer state-aware Garmin invitation that explains the payoff of upload before evidence exists and turns into a continuation path once Garmin evidence or ready feedback already exists, while `Feedback` stays the canonical detailed evidence/comparison/recommendation surface.
- The next post-`Log result` invite payoff slice is now implemented:
  the near-upload area inside workout-detail `Feedback` now uses one compact state-aware summary that tells the runner whether no evidence exists yet, a Garmin file is attached, the run summary is ready, the factual comparison is ready, the recommendation is available, or the last parse failed.
- The next post-payoff recommendation-refinement slice is now implemented:
  the bounded AI note inside workout-detail `Feedback` now leads with one runner-facing next-step takeaway, keeps the factual comparison visibly primary above it, and translates mixed-evidence caution into plainer language instead of technical AI-section framing.
- The next Feedback cleanup/humanization follow-up is now implemented:
  workout-detail `Feedback` now removes the heavy outer evidence card chrome, shows the attached Garmin file explicitly, supports removing that Garmin evidence through the saved-mode seam, merges comparison meta into one calmer strip, and humanizes planned target labels such as effort and pace in the right-side workout context.
- The loaded attached-evidence `Feedback` design pass is now implemented:
  once a Garmin file is already attached, the surface now switches to attached-first ownership, keeps one `Ready` pill at the top, strengthens `Plan vs run` with one verdict row and compact summary strip, reduces run-summary mini-card feel, and moves technical comparison caveats into one quieter disclosure.
- The bounded calendar-evidence seam is now implemented end to end:
  the canonical saved-mode workout snapshot now carries one minimal `feedbackMarker` summary derived from existing Garmin truth, with `evidence_attached` for any saved Garmin asset and `feedback_ready` for workouts that already have canonical actual metrics plus deterministic comparison; saved-mode month/week calendar cards and the current-day home hero now render that marker as a small secondary cue that routes into the workout-detail `Feedback` tab.
- The Safari Garmin picker compatibility fix is now implemented:
  the visible FIT/ZIP control no longer relies on Safari-native `accept` MIME filtering and instead validates `.fit` or `.zip` after selection before posting multipart data to the backend route.
- Saved-mode shell navigation back to `/` now uses a fresh home request, and the `Tomorrow` summary no longer falls through to broken `nullkm · 0′` placeholders for interval-style workouts.
- The profile/sidebar area now shows the runner name plus active plan title, removes duplicate top-level sign-out, and owns a lightweight saved-mode advanced import entry path.
- The first saved-mode plan-management backend slice is now implemented:
  a canonical delete-plan action archives the active `plan_cycle` without deleting planned workouts or logs, leaving the runner in authenticated no-plan/setup-ready state, and the JSON import apply seam can now accept a `requestedStartDate` that becomes the effective schedule authority for saved-mode import.
- The first saved-mode plan-management frontend slice is now implemented:
  `Open plan` opens a compact active-plan modal with plan summary, primary text-first replacement, secondary JSON import with chosen start day, and a destructive `Delete plan` action wired to the backend archival seam.
- The saved-mode `Clear upcoming schedule` backend lifecycle slice is now implemented:
  a canonical action archives the current active plan out of the active schedule from today forward, keeps planned-workout rows and workout logs preserved as archived history, and leaves the runner in no-plan/setup-ready state so later-starting imports or generated plans do not inherit stale future workouts.
- The saved-mode `Clear upcoming schedule` frontend slice is now implemented:
  `Open plan` exposes the action as a confirmed secondary schedule-management control distinct from `Delete plan`, tall plan-management dialogs keep their header/footer usable with internal scroll, and later-starting JSON import can explicitly clear the previous upcoming schedule before applying the new backend-owned plan start.
- The first saved-mode plan-export backend slice is now implemented:
  one canonical active-plan export payload is derived from the active `plan_cycle` plus saved `planned_workouts`, JSON export projects that payload into `training-plan-v2` using the current applied dates, and Markdown export uses the same payload for a concise runner-readable artifact; visible `Open plan` export controls and PDF remain later slices.
- The first saved-mode plan-export frontend slice is now implemented:
  `Open plan` now shows one compact `Export` menu for active plans, downloads backend-owned JSON and Markdown artifacts through real browser file save behavior, hides export when no active plan exists, and still defers PDF.
- The Safari export-download bugfix is now implemented:
  `Open plan` no longer depends on a client-side blob/objectURL download helper for active-plan export, so JSON no longer hangs in `Preparing...` and JSON plus Markdown now start through the same authenticated attachment route while still using backend-owned filename, content type, and body truth.
- The body-notes and user-settings persistence repair is now implemented:
  the linked Supabase project now has `workout_logs.body_notes`, bounded settings/avatar columns on `runner_profiles`, and the `profile-avatars` bucket; `/settings` and shell viewer profile reads now resolve through the same persisted-user mapping used by saved mode instead of the raw local bypass id.
- The first frontend follow-up for body notes is now implemented:
  `Log result` no longer resyncs empty saved state over a newly added body-note draft, so `Add body note` now keeps the workout-scoped form open and the required fields remain available for entry.
- The first workout-scoped body-note modal slice is now implemented:
  `Log result` no longer carries the heavy inline body-note editor in the main page flow, a compact summary row now opens one modal editor for bounded body-note entries, and the modal keeps the existing saved schema of area, timing, sensation, severity, and optional note.
- The Safari body-note modal layout fix is now implemented:
  the workout-scoped body-note modal now uses the same stable bounded-height dialog pattern as `Open plan`, so Safari keeps the panel in-viewport, scrolls the body region internally, and leaves `Cancel` plus `Save body notes` reachable without page-behind scrolling.
- The Safari stable-dialog overlay cleanup is now implemented:
  the same stable dialog pair now also forces closed overlays non-blocking, so saving or cancelling the workout-scoped body-note modal no longer leaves a dimmed pointer-blocking layer over the workout page.
- The bounded modal consolidation slice is now implemented:
  `UploadJsonDialog` now uses the same stable product-dialog recipe as `Open plan` and `Body notes`, the shared CSS now owns the canonical three-row panel and internal scroll region, and `/hitoDS` documents the live modal anatomy without introducing a broad modal wrapper.
- The body-note AI context slice is now implemented:
  saved workout-scoped body notes now feed the existing bounded Garmin recommendation seam as optional caution context only, while deterministic comparison remains primary and the prompt explicitly forbids diagnosis, medical advice, injury certainty, treatment instructions, or silent plan mutation.
- The workout AI-output hygiene fix is now implemented:
  the backend now rejects malformed runner-facing AI text such as dangling fragments, ampersand continuations, replacement glyphs, or non-English character artifacts, and persists stable deterministic fallback sentences instead while preserving body-note caution and severity softening behavior.
- The first longitudinal AI plan-refresh backend foundation is now implemented:
  saved mode now has one canonical `RunnerCoachContext` builder over persisted runner/profile/plan/log/Garmin/body-note truth, plus one proposal-only active-plan refresh seam that consumes that bounded context and an explicit runner prompt while targeting only the remaining active schedule; final apply flow and silent plan mutation remain absent.
- The first runner-facing AI-assisted plan-refresh proposal slice is now implemented:
  `Open plan` now includes a quiet `Update plan` disclosure where saved-mode runners can enter a short intent, generate a backend-owned refresh proposal from persisted history, and read back why the remaining schedule might change, what would change, relevant caution context, and the explicit not-applied boundary.
- The first runner-facing active-plan refresh confirm/apply slice is now implemented:
  proposal review now exposes `Apply update` and `Keep current plan`; keeping the current plan dismisses the proposal without mutation, applying calls the backend seam with stale/off-day revalidation, successful apply returns to the updated active-plan view, and stale proposals show a specific fresh-proposal recovery path.
- The first Hito design-system toast slice is now implemented:
  `/hitoDS` now documents and exercises the reusable info, working, success, and error toast primitive; working toasts use dismiss-only indeterminate progress with Safari-stable visible state, keep the dismiss action inside the toast anatomy, and can resolve in place to success or error, while `Open plan` proposal generation and `Apply update` consume one shared action-family toast id and keep source buttons plus inline review/stale feedback intact.
- The first Hito typography canonicalization slice is now implemented:
  shared CSS roles now cover display, page, modal, section, panel, body, body-small, helper, caption, label, form-label, button, nav/menu, metric, status, error/success, and technical mono text; `/hitoDS` now documents those roles as the canonical reference, and the first high-drift surfaces (`Open plan`, saved-mode JSON import, workout `Log result`/`Feedback`, and `User settings`) use those roles for headings, form labels, helper/body copy, status feedback, and fixed-format metadata.
- The shared dialog typography contract is now fixed:
  Radix-backed `DialogTitle` and `DialogDescription` no longer force generic shadcn typography defaults over product classes, so `Open plan`, saved-mode JSON import, and the workout body-note modal resolve their title/description rhythm from canonical Hito roles.
- The first Hito icon-system normalization slice is now implemented:
  Hito now owns one `lucide-react`-backed `Icon` primitive with stable product names, four canonical sizes, and documented `/hitoDS#icons` usage examples; product-level surfaces consume that layer, while generated UI infra remains the only direct lucide exception and the raw SVG icon folders have been removed.
- The active-plan refresh apply hardening slice is now implemented:
  refresh apply now derives one schedule authority from the current remaining active schedule, preserves the original target date only when it is still valid at least seven days after the refresh start, repairs generated schedule, goal, runner-baseline, and fixed-rest-day availability before canonical validation, clamps replacement workouts to the original remaining-schedule window, and returns a bounded blocked result instead of leaking low-level authoring validation text.
- The active-plan refresh proposal-output hygiene pass is now implemented:
  the backend now returns a dedicated review-safe proposal shape without raw workout ids or internal prompt field names, rejects malformed fragments such as dangling clauses or bare abbreviations, guarantees fixed-truth review content, and keeps targeted count consistent with the proposed changes shown in the review so review copy no longer mislabels targeted changes as the whole remaining plan.
- The first explicit active-plan refresh apply backend foundation is now implemented:
  proposal output carries a backend fingerprint, apply must be explicitly called, stale proposal context is blocked before generation or mutation, and successful apply creates a new `active_plan_refresh_v1` active plan while archiving the previous active plan and preserving fixed workout/log truth.
- The first weekday rest-day invariant backend slice is now implemented:
  saved-mode JSON import/apply now resolves blocked weekday truth from active plan preferences before imported metadata, rejects chosen starts on blocked weekdays, and maps incoming non-rest workouts in sequence across allowed weekdays instead of blindly replaying every source date offset.
  `RunnerCoachContext` and active-plan refresh proposal/apply now carry the same resolved invariant, include it in stale-check fingerprints and fixed-truth review copy, and block refresh apply output that schedules non-rest workouts on fixed rest days.
- The saved-mode calendar-cell semantics correction is now implemented:
  month cells restore one broad-family workout-type glyph, one short type label, restrained type color, and a quiet feedback/evidence corner marker while keeping distance, duration, targets, and dashboard-style metric stacks out of month cells.
- Workout detail rest days are now intentionally sparse and the right-side detail context is grouped into one tighter frame instead of multiple bordered cards.
- The first workout-page refinement pass is now implemented:
  the three-block page structure remains intact, saved result states now surface as check, dash, or cross markers near workout identity and in the right-side context, `Week Status` is progress-driven, `Log result` stays focused on manual completion truth, and the dedicated `Feedback` tab now owns the Garmin FIT/ZIP evidence seam with screenshot still clearly later-only.
- The remaining upload-flow/template UI slice is now implemented:
  the saved-mode advanced import flow now accepts only canonical `training-plan-v2` JSON while still normalizing that contract into the same canonical persisted plan seam and ignoring runtime-only v2 fields that do not belong in plan truth.
  The same flow still includes a real `Download JSON template` affordance for file-based plan handoff.
- The advanced import reliability pass is now implemented:
  successful `training-plan-v2` apply now exits through a fresh home reload instead of an immediate in-place router refresh, and the canonical template artifact now ships a reserved `_ml_agent_template` instruction block that is accepted but ignored at import time.
- The first-day plan-apply semantics are now deliberately simplified:
  generated and imported plans still flow through one canonical apply-time normalization seam in `src/lib/plan-apply-policy.ts`, but a today-conflict no longer blocks normal apply by default. The safe backend path now preserves today’s existing workout, drops the incoming day 1 workout, and starts original day 2 tomorrow.
- The only remaining alternate path is explicit destructive replacement:
  `replace_first_day` still exists for callers that intentionally want to replace today, and it is still blocked honestly whenever that would detach saved workout history.
- The older symmetric chooser model is no longer the canonical backend behavior:
  the existing frontend chooser can now be reduced to an optional destructive override affordance instead of a required equal-weight conflict resolver.
- The frontend simplification pass is now implemented:
  normal text-first and advanced JSON apply both follow the backend safe default without blocking on a preserve-vs-ignore chooser,
  `Replace today` remains as the only explicit destructive override,
  and the saved-mode import dialog now uses internal scroll plus shorter calmer copy.
- The hierarchy cleanup pass is now implemented:
  `Replace today` is disclosed as a secondary destructive exception instead of an equal primary sibling,
  advanced JSON paste/template tooling is quieter inside expert disclosure,
  and the `Log result` Garmin path is a lighter continuation row into `Feedback` rather than a competing block.
- The first app-wide simplification slice is now implemented:
  `/integrations` is no longer a primary desktop or mobile nav item,
  the route remains reachable as a quieter connections/status utility,
  and stale disabled shell menu utilities have been removed from the primary profile menu.
- The second app-wide simplification slice is now implemented:
  saved-mode home/calendar has a calmer rhythm,
  month cells no longer carry inline metric/dashboard clutter,
  the duplicate calendar-level week-status treatment is removed,
  and feedback markers remain as small secondary cues behind completion truth.
- The third app-wide simplification slice is now implemented:
  `/progress` is reduced to a compact summary route with one aggregate summary group,
  smaller weekly planned-vs-actual volume,
  honest sparse weekly-volume empty copy,
  recent consistency,
  and no static placeholder trend chart or heavy explanatory support frame.
- The fourth app-wide simplification slice is now implemented:
  `/body` is now retired from the product,
  older `/body` links redirect quietly to `/`,
  and body-note ownership remains workout-scoped inside `Log result` instead of living as a second standalone surface.
- The fifth app-wide simplification slice is now implemented:
  `/hitoDS` now follows the simplified live product instead of preserving historical overbuilt examples,
  with open route rhythm,
  divider-based grouping,
  compact summary truth,
  secondary feedback/status markers,
  utility/disclosure actions,
  simplified shell navigation,
  and explicit visualization geometry exceptions.
- The current `training-plan-v2` runtime still keeps `plan_cycles` plus `planned_workouts` as the only canonical storage model, writes richer segment structure into `planned_workouts.steps jsonb`, and still deliberately defers import-batch provenance plus editability-oriented schema expansion to a later phase.
- The current Phase 3 cleanup slice is now implemented:
  persisted plan truth now preserves `schema_version`, `source_kind`, `target_date`, goal metadata, plan preferences, source workout identity, source workout type, planned RPE, estimated fatigue, and recovery priority through the same canonical Supabase rows used by JSON import, structured authoring, and OpenAI text authoring.
  New writes now persist canonical target keys only, while legacy target aliases remain read-compatible for older rows instead of being written again.
- The first post-Phase-3 correction pass is now implemented:
  richer `training-plan-v2` normalization now accepts the live fuller segment DSL used by the richer reference files, workout-detail target shaping no longer leaks opaque structured metadata into `[object Object]`, and richer imported interval workouts no longer collapse into misleading visible easy-run identity.
- The first structured plan-authoring backend slice is now implemented:
  the service accepts one bounded structured input contract, normalizes it server-side, generates canonical `training-plan-v2` plan data, and persists that plan through the same Supabase `plan_cycles` plus `planned_workouts` seam already used by JSON import.
  That bounded contract remains a backend and ops asset behind the visible text-first onboarding UI, and Backend plus ops can still validate and persist generated structured plans through `npm run author-structured-plan -- --email <tester-email> --input-file <absolute-json-path>`.
- The first OpenAI-backed text-to-plan backend slice is now implemented:
  the service accepts one bounded free-text request, asks OpenAI for structured authoring input, validates that model output deterministically, and persists only the resulting canonical `training-plan-v2` plan through the same Supabase seam already used by JSON import and structured authoring.
  The visible onboarding UI is now wired to this path, and local live validation is green with a working `OPENAI_API_KEY`.
- The Phase 4 frontend cleanup slice is now implemented:
  visible no-plan and shell surfaces present text-first plan creation as the primary product path, while JSON remains available only as a demoted advanced import for existing Hito plan files, migration, and testing.
- The first Hito design-system implementation slices are now implemented:
  shared low-card CSS primitives exist for core surfaces, tiered buttons, tiered inputs, textareas, helper/error text, tabs, labels, captions, dividers, grouped rows, metric rows, compact summary metrics, compact chart legends, compact tooltip shells, compact severity scales, compact severity summaries, compact status pills, compact status markers, shell navigation rows, shell profile triggers, shell dropdown rows, disclosure, and setup/empty/error state surfaces; auth, text-first onboarding, advanced import, shell chrome, home/calendar support surfaces, workout-detail grouped/status/metric surfaces, route-level state surfaces, progress summary surfaces, body severity micro-UI, preserved integration utility rows, calendar and workout-structure tooltip chrome, and deeper workout-structure plus completion-log micro-surfaces now use those primitives; `/hitoDS` provides an internal simplified product-language reference with dedicated design-system navigation instead of runner-facing shell chrome; and chart bars, plotted lines, interval block widths, SVG silhouettes, and marker coordinates are documented as intentional visualization geometry exceptions.
- The full Hito design-system normalization track is now effectively complete from the visible product perspective:
  final Safari QA found no obvious stray custom UI drift in the tested runner-facing scope, `/hitoDS` is the accepted internal reference baseline, and only documented visualization geometry exceptions remain outside the shared Hito component families.
- The remaining first-pass v2 rendering-truth gaps are now fixed:
  distance-based interval reps no longer invent minute-based per-rep UI,
  tempo workouts now render with a tempo-specific visible identity on home and workout detail,
  and visible distance totals now round consistently instead of leaking floating precision.
- Saved-mode advanced import replacement now has a continuity guard:
  logged workout history is carried forward only for exact deterministic matches on logged dates, and unsafe replacements are rejected instead of silently resetting visible progress.
  Older broken replacements that already stranded logs on archived copies of the same plan window are now repaired back onto the active plan before saved-mode reads and replacement checks run.
- The Cloudflare-oriented build shape has been replaced with a Vercel-compatible Nitro deployment path.
- The repo now contains one TanStack Start runtime with preserved imported route structure, stable preview mode, authenticated saved mode backed by Supabase, and a temporary local account-backed bypass path for immediate local use.

## Current Active Stream

Post-normalization stabilization:
the visible interface is now treated as owned by shared Hito DS primitives and documented shell families, while remaining non-DS geometry stays intentionally constrained to charts, interval widths, SVG silhouettes, and marker coordinates.

## Next Recommended Steps

1. QA + validate the visible free-text authoring flow end to end alongside the demoted advanced JSON fallback, with emphasis on richer-plan route rendering and replacement continuity.
2. QA + verify that no-plan accounts read as one text-first product path in Safari and that advanced import remains discoverable without competing with onboarding.
3. Keep future UI changes inside shared Hito primitives or documented geometry exceptions, and use `/hitoDS` as the inspection surface before shipping new visual patterns.

## Canonical References

- `docs/context.md`
- `docs/current-system.md`
- `docs/current-product.md`
- `docs/glossary.md`
- `docs/plans/active/2026-05-05-full-baseline-import-and-stabilization-plan.md`
- relevant product briefs and frontend specs

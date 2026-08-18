# Changelog

Curated public highlights for completed runner-facing work.

For the compact internal decision index, use [technical log](./technical-log.md). Each date below
contains one human-written outcome rather than a category label or implementation transcript.

## 2026-08-15

- Hito now uses one shared identity and responsive interface language across the runner shell,
  Calendar, workout detail, Progress, Settings, onboarding, navigation, and the Design System
  reference.

## 2026-08-11

- The verified runner Calendar bundle reached production with independent workouts, saved Plans,
  runner-local dates, FIT readback, and the shared interface contracts released together.

## 2026-08-10

- Plans now stay in a private library while started workouts become ordinary runner-owned Calendar
  entries; future work can be materialized explicitly without rewriting completed or evidenced
  history.

## 2026-08-05

- FIT-backed run feedback now shows the observed metrics available in the file, including
  elevation, while keeping the original evidence for later reprocessing.

## 2026-08-03

- Activity History and Progress now use persisted activities and factual weekly and rolling
  snapshots, keeping planned runs, completed runs, and missing evidence visibly distinct.

## 2026-07-31

- An attached activity file now presents the planned workout, observed run, and factual difference
  together without inventing values that were not recorded.

## 2026-07-23

- Creating a generated plan now starts with an explicit goal and distance, while building a plan
  manually is a separate deliberate path to an empty Calendar.

## 2026-07-21

- First-time and returning runners can review and edit baseline details and heart-rate guidance
  before plan creation without changing already confirmed workouts later.

## 2026-07-13

- Calendar actions became faster and clearer: direct Move updates immediately with bounded Undo,
  eligible future workouts open the shared editor, and mobile plan actions stay reachable in the
  bottom navigation.

## 2026-07-12

- Manual creation, persisted editing, and workout readback now share one compact document language
  for ordinary sections and ordered repeat groups.

## 2026-07-11

- The manual workout editor and light theme now use the same compact Hito controls, readable
  surfaces, and editing rhythm as the rest of the product.

## 2026-07-07

- Generated workout previews now show calm, structured rows and cues instead of debug language,
  while editable titles remain limited to workouts that can actually be changed.

## 2026-07-06

- Quick setup now supports 10K, half-marathon, marathon, and custom-distance plans through the same
  reviewed and confirmed creation flow.

## 2026-06-27

- Manual workout sections now support explicit pace, heart-rate, and effort targets while keeping
  repeat groups structural and avoiding invented personal metrics.

## 2026-06-15

- Workout detail now follows the workout lifecycle: future sessions show plan actions, today's
  workout leads with completion, results appear only when saved, and Rest days remain intentionally
  quiet.

## 2026-06-13

- Copy, Paste, and Move for eligible manual Calendar workouts now use direct protected actions
  instead of an extra review screen, while occupied and evidenced days stay guarded.

## 2026-06-12

- The manual plan builder gained one reviewed workout constructor plus Add, Clear, Move, and export
  paths that all read and write the same saved Calendar truth.

## 2026-06-10

- Runners can start with an empty manual plan, create an Easy aerobic run, review it, and save the
  first real workout through the same protected persistence path as other plans.

## 2026-06-07

- Plan Presets introduced 10K Foundation, Half Marathon Balanced, and Marathon Base as clear
  starting points that lead into the ordinary plan preview and creation flow.

## 2026-05-31

- First-plan coaching became more honest for beginner and recreational runners, with conservative
  intensity, recovery, and long-horizon progression rules.

## 2026-05-30

- Half-marathon and marathon plans gained clearer goal-specific workouts, safer sequencing after
  long runs, and more consistent taper and phase behavior.

## 2026-05-27

- AI-assisted first-plan creation moved to a reviewed blueprint: Hito turns compact coaching intent
  into validated dated workouts and saves only the plan the runner confirmed.

## 2026-05-25

- Open plan gained safer future-schedule updates and richer workout readback while protecting
  completed history and requiring explicit confirmation before changes are applied.

## 2026-05-24

- Hito's shared buttons, fields, dialogs, navigation, progress surfaces, and interaction states
  began using one documented visual and accessibility language.

## 2026-05-18

- First-plan setup became a structured review flow with explicit goals, runner baseline, metric
  truth, and confirmation before any plan is persisted.

## 2026-05-16

- Plan update proposals began showing the exact future schedule before apply, with stale proposals
  and protected history blocked instead of silently rewritten.

## 2026-05-15

- Workout results gained clearer completion states, plan export, and workout-scoped body notes while
  keeping saved evidence and plan truth separate.

## 2026-05-12

- FIT and ZIP result uploads began feeding a deterministic planned-versus-observed comparison before
  any optional AI interpretation is shown.

## 2026-05-11

- Workout feedback began combining recorded duration, distance, pace, and other available evidence
  into a factual comparison instead of a single opaque score.

## 2026-05-10

- Core runner screens began adopting shared Hito components and semantic states, improving
  consistency across Home, Calendar, workout detail, and Progress.

## 2026-05-06

- Saved mode moved onto authenticated Supabase-backed runner, plan, workout, and log data while
  preview routes remained explicitly non-persisted.

## 2026-05-05

- Hito Running established its initial authenticated planning foundation with runner profiles,
  persisted plans, planned workouts, workout logs, and honest preview states.

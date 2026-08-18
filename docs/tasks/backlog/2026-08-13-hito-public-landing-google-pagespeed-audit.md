# Hito Public Landing Google PageSpeed Audit

## Work Item ID

`2026-08-13-hito-public-landing-google-pagespeed-audit`

## Status

`backlog`

## Type

Tracked — external public-performance audit

## Priority

P2

## Owner

QA

## Epic

marketing-and-growth

## Scope

Read-only Google PageSpeed Insights assessment of the public, unauthenticated Hito entry/landing
composition. The audited page is the common `AuthEntryScreen` rendered for a guest at `/` and
`/login`; the execution owner must first identify the canonical production URL and record whether
both routes serve the same landing response.

## Archive Intent

retain_in_place

## Task

Establish a reproducible production performance baseline for Hito's public landing using Google
PageSpeed Insights. Run the canonical public URL in both Mobile and Desktop strategies, capture the
raw report links and measurements, separate field-data availability from lab results, and produce a
small evidence-backed remediation backlog only when a metric demonstrably misses its threshold.

This task audits and prioritizes. It does not optimize code, change assets, alter deployment
configuration, call paid services, or release anything.

## User Report

Ivan wants the landing checked through Google PageSpeed because it may have performance problems.
The work is useful but not urgent; retain it at medium priority with explicit success and failure
criteria so later measurement does not become subjective.

## Current Source Facts

- `src/routes/index.tsx` renders `AuthEntryScreen` when the home route is in its unauthenticated
  preview state.
- `src/routes/login.tsx` renders the same `AuthEntryScreen` unless the route has persisted
  authenticated/setup state.
- `src/components/AuthEntryScreen.tsx` is the shared public-entry composition and imports the
  marketing hero image at
  `src/assets/marketing/hero-background/login-desert-horizon.jpg`.
- The canonical production hostname is not stated in repository source inspected for this intake.
  It is an execution preflight discriminator, not a reason to test a preview, loopback URL, or
  guessed domain.

## Observed Behaviour

No PageSpeed measurement has been run for this retained item. A performance defect is therefore
not yet demonstrated.

## Expected Behaviour

The production public landing has a recorded, reproducible Google PageSpeed baseline for both
strategies. It meets the quality target below or returns a precise, bounded remediation inventory
without speculative fixes.

## Required Discriminators Before Audit

1. Confirm the canonical public production URL and exact deployed revision; do not use an ephemeral
   preview, `localhost`, a loopback alias, a staging URL, or an unauthenticated route that redirects
   away from the landing.
2. Confirm whether production `/` and `/login` resolve to the same guest landing composition. If
   they differ, measure each separately and record the route distinction rather than combining them.
3. Record the PageSpeed report timestamp, tested URL, strategy, report URL, field-data availability,
   and all performance-affecting redirects/errors reported by Google.
4. Run at least three PageSpeed measurements per required URL/strategy within one bounded audit
   window. Use the median of each lab metric for threshold assessment and retain all raw report
   links so variance remains visible.

## Success Criteria

### Audit success

The audit itself passes when all of the following are true:

1. The canonical production URL and deployed revision are evidenced; both Mobile and Desktop
   PageSpeed reports are reproducible and retained.
2. Every strategy has three raw report links, with the median clearly calculated for the lab
   metrics.
3. Field data is reported as `available`, `insufficient`, or `not applicable` without treating
   missing CrUX data as a passing performance result.
4. The receipt distinguishes measurement evidence from implementation hypotheses and assigns each
   confirmed remediation candidate to one canonical owner.
5. No runtime, hosted, provider, Git, configuration, asset, or deployment mutation occurs.

### Landing quality target

The landing meets the current performance target only if the median result for both Mobile and
Desktop satisfies:

| Category                 | Target            |
| ------------------------ | ----------------- |
| Performance score        | at least 85 / 100 |
| Accessibility score      | at least 90 / 100 |
| Best Practices score     | at least 90 / 100 |
| SEO score                | at least 90 / 100 |
| First Contentful Paint   | at most 1.8 s     |
| Largest Contentful Paint | at most 2.5 s     |
| Total Blocking Time      | at most 200 ms    |
| Cumulative Layout Shift  | at most 0.10      |
| Speed Index              | at most 3.4 s     |

Where PageSpeed presents sufficient Core Web Vitals field data, its overall assessment must be
`Passed`; a field-data result outside good thresholds is a quality failure even if a single lab run
looks acceptable.

## Failure Criteria And Required Output

The audit records `quality target failed` when any median score or metric above misses its target,
when available Core Web Vitals field data does not pass, or when PageSpeed reports a user-visible
production error/redirect that prevents a valid measurement.

For each failed criterion, QA must provide:

- the raw PageSpeed evidence and median value;
- whether the result is Mobile, Desktop, or both;
- the relevant PageSpeed diagnostic/opportunity;
- the exact source/network discriminator still needed before claiming a cause;
- the first likely canonical owner only when source evidence supports it; and
- the smallest proposed follow-up slice, its preserved boundaries, and its risk.

Do not automatically treat any PageSpeed opportunity, total JavaScript size, image size, or third
party suggestion as an implementation task. A later owner must establish a source-backed cause.

## Coverage Gaps

- `insufficient` or missing CrUX field data is a coverage gap, not a passing field-performance
  verdict.
- PageSpeed's synthetic network/device model is not equivalent to all real user devices,
  authenticated service routes, browser interaction performance, Global QA, or release readiness.
- If the canonical production URL or stable revision cannot be established, the audit is blocked;
  do not substitute a preview deployment.

## What Not To Touch

- No production source, CSS, images, fonts, tokens, manifests, dependencies, build settings,
  caching headers, Vercel settings, Supabase, providers, fixtures, data, Figma, Git lifecycle, or
  deployment action.
- No optimisation, compression, code splitting, asset conversion, image replacement, or analytics
  addition during the audit.
- No claim that a PageSpeed baseline is a Global QA, release, or production acceptance result.

## Validation Expectations

| Check           | Evidence                                                                                 |
| --------------- | ---------------------------------------------------------------------------------------- |
| Target identity | Canonical public URL, route, deployed revision, and no unexpected redirect.              |
| Reproducibility | Three raw Google PageSpeed report URLs per tested route/strategy and median calculation. |
| Measurement     | Scores, FCP, LCP, TBT, CLS, Speed Index, field-data status, and relevant diagnostics.    |
| Triage quality  | Only source-backed owner proposals; unsupported opportunities remain hypotheses.         |
| Preservation    | Read-only checkout and external posture; no implementation or hosted mutation.           |

## Definition Of Done

1. The audit has a reproducible PageSpeed baseline for the canonical production landing in Mobile
   and Desktop strategies.
2. It truthfully states whether the quality target passed, failed, or cannot be assessed because of
   a named coverage gap.
3. Any remediation candidates are bounded, evidence-backed, and independently routable; no fix is
   made in this audit.
4. This item contains the English QA receipt with raw evidence links, median calculations, coverage
   gaps, and no inflated release/Global QA claim.

## Next Recommended Role

PRODUCT — schedule this P2 QA audit only after the canonical production URL and a stable deployed
revision are available. PRODUCT routes any later remediation as separate owner-bounded work.

## Blockers

None for retention. Execution is blocked only until the production URL/revision discriminator can
be evidenced.

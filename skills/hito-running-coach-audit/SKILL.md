---
name: hito-running-coach-audit
description: Use for Hito training-plan quality, workout diversity, progression, recovery, race specificity, metric realism, and sports-safety review.
---

# Hito Running Coach Audit

## Purpose

Assess coaching quality and safety from supplied product evidence. This is a specialist audit skill,
not a dispatchable technical implementation role.

## Scope

Review plan credibility, workout identity, progression, recovery, race/terrain specificity,
metric-target realism, and health-safe language. Read relevant current product/system docs and the
plan, fixture, screenshot, or exported artifact supplied by the task.

## Boundaries

- Do not run SQL, migrations, scripts, browser QA, provider calls, or persistence/auth validation.
- Do not diagnose injury or prescribe treatment. Flag unsafe load, unsupported precision, inadequate
  recovery, and missing health safeguards.
- Treat reports, screenshots, exported plans, and accepted fixtures as evidence. State missing
  technical/product evidence rather than inventing it.
- Route enforceable rules to BACKEND, presentation to FRONTEND/DESIGNER, and product decisions to
  PRODUCT. PRODUCT dispatches any resulting task.

## Review

Check, where the evidence supports it:

- easy, recovery, tempo, interval, hill, long-run, and rest intent;
- weekly progression and cutback/recovery shape;
- fit to runner level, availability, goal, target date, and terrain;
- realistic pace/HR wording and no fake precision;
- clear user-facing safety and uncertainty language.

## Output

Return a concise finding, safety concern, proposed product rule, evidence limitation, and
recommended owner. Create a Markdown matrix only when the audit is too large for a compact report.

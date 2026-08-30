# HITO-303 — Retire Superseded Hito Delivery Paths and Close Recovery

- Work Item ID: `HITO-303`
- Status: Backlog
- Type: Maintenance
- Priority: High
- Owner: PRODUCT
- Primary Area: Platform
- Epic: `recover-hito-delivery-operating-model`
- Lifecycle: [Live Notion Task](https://app.notion.com/p/3ccfe5f58cf5819e8173ee9df4d48c32)
- Archive Intent: retain final disposition, deletions, rollback and Epic acceptance evidence.

## Task

After a successful pilot, remove only operating paths whose replacements are demonstrated and close
or truthfully retain the Recovery Epic.

## User Report

Duplicated and stale documents or execution paths repeatedly become false sources of truth after a
new approach is added without retiring the old one.

## Evidence And Observed Behavior

The recovery guide requires explicit RETAIN / COMPACT / SUPERSEDE / DELETE-CANDIDATE disposition and
forbids deletion before replacement proof.

## Expected Behavior

Each deletion has exact inbound evidence, replacement, owner and rollback. All guide sections and
acceptance checks are PASS, or the Epic stays open with one exact residual Task.

## Source Investigation And Root Cause

Cleanup by age or intuition destroys evidence; never cleaning accepted replacements leaves competing
truth. The pilot is the deletion gate.

## What Not To Touch

No terminal evidence, current authority, product behavior, unrelated dirty bytes or unproved
candidate. No mass rewrite or new archive hierarchy.

## Validation Expectations

Re-run link/reachability, task metadata, stack/command and pilot reproduction checks after each
recoverable slice; verify Epic completion from terminal Tasks rather than manual percentage.

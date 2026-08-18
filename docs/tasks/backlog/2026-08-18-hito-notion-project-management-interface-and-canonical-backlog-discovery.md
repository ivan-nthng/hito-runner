# Hito Notion Task Tracker Integration Discovery

Work Item ID: `2026-08-18-hito-notion-project-management-interface-and-canonical-backlog-discovery`
Status: backlog
Type: Tracked
Priority: high
Owner: PRODUCT
Epic: platform-and-operations
Parent: [Hito Runner Product Readiness And Progressive Materialization Roadmap](./2026-08-15-hito-runner-product-readiness-and-progressive-materialization-roadmap.md)
Depends On: [Hito Runner Core Release Freeze And Candidate Admission](./2026-08-18-hito-runner-core-release-freeze-and-candidate-admission.md)
Evidence From: [Hito Admin Work Items Authority And Usability Consolidation](./2026-08-17-hito-admin-work-items-authority-and-usability-consolidation.md), [Hito Product Domain Boundaries And Efficient Delivery Architecture Audit](./2026-08-18-hito-product-domain-boundaries-and-efficient-delivery-architecture-audit.md)

## Scope

Define the smallest safe Notion Task Tracker integration. Notion becomes the human task and Epic
orchestration surface, and every Notion task links to its relevant repository Markdown artifacts.

## Archive Intent

Retain until PRODUCT accepts a source-of-truth and synchronization decision, then split any
cross-owner implementation into serial, bounded work. Compact to the accepted decision and
implementation boundaries after terminal acceptance.

## Task

Ivan needs one understandable place to see what Hito is doing and what follows next. Notion should
become that task-tracker surface: he creates and follows tasks there, while linked Markdown remains
the repository documentation for briefs, specifications, receipts, evidence, and implementation
context.

## User Direction

- Show Epics, status, priority, owner, plain-language summary, latest stage, and approved related
  work clearly in Notion.
- A Notion task links to its repository Markdown artifacts; the linked documents do not become
  competing task rows.
- Make task creation and agent dispatch understandable from Notion without duplicating artifacts.

## Required Discovery

1. Define the authority transition from the current Markdown backlog to Notion-led task and Epic
   orchestration, including the exact role of linked Markdown artifacts.
2. Inspect current official Notion integration capabilities and choose the least-privilege auth,
   secret, webhook/polling, database/data-source, and failure/reconciliation model that fits Hito.
3. Specify the exact Notion task contract: identity and repository links, title, human summary,
   Status, Stage, Priority, Owner, Epic/Bug, and approved relationships.
4. Define idempotency, identity, deletion/history, unavailable-Notion, and conflict behavior. A
   Notion outage must never block runner work, repository documentation, or release work.
5. Map the smallest serial implementation boundaries across ARCHITECT, BACKEND, FRONTEND Product,
   and independent QA. Do not start implementation in this discovery.

## What Not To Touch

No Notion workspace, OAuth secret, hosted service, provider connection, database/schema, Admin
runtime, importer, Git lifecycle, or user data. Do not create a second Notion tracker, background
sync daemon, duplicate task table, or manual data migration.

## Validation Expectations

Read-only source and official Notion-documentation evidence; an authority/reconciliation diagram;
explicit owner and failure boundaries; local Markdown-link, Prettier, whitespace, and diff checks.
No runtime, provider, browser, database, hosted, release, or deployment claim is expected.

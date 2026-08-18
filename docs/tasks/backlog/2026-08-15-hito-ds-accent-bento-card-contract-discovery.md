# Hito Accent Bento Card Contract Discovery — 2026-08-15

## Work Item ID

2026-08-15-hito-ds-accent-bento-card-contract-discovery

## Status

backlog

## Type

Tracked — Design System pattern and color-contract discovery

## Priority

medium

## Owner

DESIGNER

## Epic

platform-and-operations

## Scope

Define when an accent Bento-style card is warranted in Analytics or a future runner dashboard, and specify its approved color, icon, typography, data, responsive, and accessibility rules. This is not a universal replacement for standard cards or a dashboard implementation.

## Archive Intent

Retain the approved pattern contract and placement census; compact after later DESIGN SYSTEM and Product adoption work.

## Task

Audit current Analytics, runner summaries, and existing Hito card/surface treatments. Propose a small Accent Bento Card pattern for high-value summary moments. It may use a brand mark and non-semantic colour pair, but must specify the exact permitted combinations and when semantic status must take precedence. Later work is split into DESIGN SYSTEM contract implementation and FRONTEND Product/Admin adoption only where a real consumer is approved.

## User Report

Ivan wants visually distinctive Bento cards for Analytics or a future runner dashboard: an accent background, a Hito mark, and text that harmonises with the mark. The pair should feel bright and branded while remaining readable; examples may use different background and icon/text hues.

## Evidence

- Current canonical surface roles are documented in `src/components/hito-ds/reference-foundations-page.tsx`; `card` is an alias of `surface`, so generic card chrome must not be redefined casually.
- Existing Hito marks are owned by `src/components/ui/hito-mark.tsx`; regular cards and state surfaces already have distinct roles.
- `src/routes/admin.analytics.tsx`, runner progress, and workout feedback contain possible future placement candidates, but no approved repeated Accent Bento consumer has been established.

## Observed Behavior

Current surfaces are intentionally semantic and low-chrome. There is no named Accent Bento pattern, approved two-colour pairing catalogue, or defined rule for using decorative branding beside analytic data.

## Expected Behavior

An accepted pattern is visually special but bounded: it has one clear high-value message, works in Light/Dark and narrow layouts, preserves standard cards for ordinary content, has a known content-density limit, and never communicates success/warning/error through a decorative palette alone.

## Required Discriminator

DESIGNER must produce a placement census and decide whether the pattern is repeated enough for a shared Design System contract. It must test candidate background/foreground/icon pairs at required text contrast, including large and small text, in both themes. A hue match is not sufficient: if a bright blue foreground on green fails contrast, it is rejected or the pair is adjusted. Decorative marks remain `aria-hidden`; meaningful status needs text and the existing semantic treatment.

## What Not To Touch

Do not alter standard Card/Surface defaults, Metadata Tags, State Surfaces, semantic colours, Admin/Product runtime, tokens, generated manifests, Figma, hosted state, or Git lifecycle. Do not ship a dashboard, invent analytic data, or add a generic rainbow-card component.

## Validation Expectations

Discovery is read-only: current-card/placement census, proposed component boundary or explicit decision not to create one, colour-pair contrast table, responsive and content-length rules, and implementation/adoption split. No runtime or Figma implementation, browser acceptance, Global QA, or release claim occurs in this item.

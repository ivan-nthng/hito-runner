# Hito Branded Auth Email Delivery

## Status

in_progress

## Type

change_request

## Priority

high

## Next Recommended Role

designer

## Task

Create the Hito-branded Supabase passwordless sign-in email template now, then apply and prove
hosted delivery once approved SMTP credentials and sender identity are available.

## Stage

DESIGNER template direction and versioned email source / hosted delivery prerequisites pending.

## Problem Definition

The existing Supabase Auth email is functionally compatible with Hito's SSR callback but lacks Hito
identity, clear hierarchy, a readable sign-in action, and responsive email-client design. The hosted
project currently has no custom SMTP, sender address/name, verified sender domain, or controlled
disposable mailbox. The canonical SVG mark already exists at `public/favicon.svg`; this batch must
derive the email-safe PNG asset from it. The external prerequisites block real delivery but do not
block preparing the exact visual template now.

## Product Decisions

- The eventual sender display name is `Hito Running`.
- The email is a focused passwordless sign-in message, not marketing or coaching content.
- It needs a prominent `Sign in to Hito` action, a readable fallback URL, clear security context,
  and mobile/desktop-readable hierarchy.
- Derive a public immutable PNG from the existing canonical SVG mark for email clients. Keep a
  durable text wordmark fallback for image-disabled clients; do not embed the web React logo or rely
  on SVG support in the email.
- Use a neutral greeting unless a trustworthy runner name is already available in the Auth template
  context. Do not invent personal data or expose more of the recipient's email than necessary.
- Existing SSR callback and redirect safety are frozen. The template must preserve the current
  Supabase redirect/token contract instead of hard-coding a site origin.

## Boundaries

- This phase must not change hosted Supabase Auth settings, SMTP, sender identity, redirect URLs,
  credentials, users, sessions, database schema, or application auth behavior.
- Store any prepared non-secret template source in the repository's canonical Supabase/configuration
  boundary. Do not create an application-owned mailer or a second authentication path.
- Keep all secrets, complete magic links, token hashes, SMTP credentials, and raw recipient data out
  of Git, local logs, screenshots, and documentation.

## External Prerequisites For Delivery

1. Verified sender domain with SPF, DKIM, and DMARC.
2. Approved SMTP provider credentials and sender address.
3. Controlled disposable mailbox for real hosted delivery and callback proof.

## Acceptance

- A versioned, email-client-safe Hito sign-in template and PNG asset derived from the canonical SVG
  exist and preserve the current Supabase callback variables.
- The design uses Hito visual hierarchy, color, spacing, typography intent, button, and fallback
  treatment without depending on browser-only components or unsupported assets.
- Static/preview proof demonstrates readable desktop and narrow mobile layouts, plus image-disabled
  and long-URL fallback states.
- The plan records the exact deferred hosted configuration boundary without pretending that a
  template-only pass has proven email delivery.
- Once prerequisites are supplied, the same plan continues to hosted sender/template application and
  controlled delivery/callback proof.

## Exact Handoff Prompt

```text
ROLE: DESIGNER

Task:
Create the versioned Hito-branded Supabase passwordless sign-in email template and its email-client
design proof, without applying hosted sender or SMTP configuration yet.

Stage:
DESIGNER template direction and versioned email source / hosted delivery prerequisites pending.

Plan:
/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-07-21-hito-branded-auth-email-delivery.md

Root cause and architecture fit:
The Supabase Auth callback already works, but the email delivery surface is still generic. The
canonical future owner is hosted Supabase Auth delivery. This task prepares its versioned visual
template without changing any hosted configuration or creating an application-owned mailer.

Product decisions:
- Eventual sender display name: Hito Running.
- Use a focused sign-in email with a prominent `Sign in to Hito` action and a readable fallback URL.
- Derive an email-safe public PNG from the canonical `public/favicon.svg`, and retain a durable text
  wordmark fallback for image-disabled clients. Do not use the React logo, browser-only styling,
  unsupported SVG assumptions, or broken image placeholders.
- Use a neutral greeting unless a trustworthy runner name is already available in the supported Auth
  template context.
- Preserve the existing Supabase redirect/token variables and SSR callback safety exactly.

Required outcome:
- Inspect the existing Auth flow, Supabase template contract, Hito DS foundations, and current logo
  assets before choosing the email-safe design.
- Produce one versioned non-secret template source and the email-safe PNG derived from the canonical
  SVG at their existing public/Supabase configuration boundaries.
- Use a reusable FRONTEND subagent only if implementation support is needed, and one reusable QA or
  DESIGNER reviewer for client-safe visual/accessibility validation. Keep the pool bounded.
- Create proof for desktop, narrow mobile, image-disabled, and long fallback URL states without
  sending email or using hosted credentials.
- Update this plan with the resulting template source, visual decision, and exact remaining hosted
  prerequisites. Do not claim delivery acceptance before a later controlled hosted proof.

Preserve:
- Supabase Auth behavior, redirect URLs, callback logic, local auth bypass, data, sessions, schema,
  credentials, and all Runner Core behavior.

Stop conditions:
- Stop and report if the current Supabase template variables cannot support the desired design without
  changing the auth callback contract.
- Do not configure SMTP, sender settings, hosted templates, domains, or users until credentials and
  a controlled mailbox are explicitly available.

Final report:
State the root cause, template source owner, Hito DS choices, preview evidence, variables preserved,
subagents used, and the exact external prerequisite for hosted delivery.
```

## Exit

The task closes only after the prepared template is applied through approved hosted Supabase sender
configuration and a controlled real email proves sender identity, rendering, button, fallback URL,
and SSR callback behavior.

# Google Account Auth And Runner Profile Entry

## Authority

The linked `Hito Running` Notion Task is the sole lifecycle and routing authority. This document
retains the technical intake boundary and evidence only; it does not dispatch work or own status.

## Outcome

Allow a runner to create or access a Hito account with a Google Account through the existing
Supabase Auth PKCE/SSR session flow, then continue through the existing Hito onboarding that creates
the complete runner profile and first saved plan.

## User Report

Ivan wants account/profile creation and Google sign-in while the current Backend task continues, if
the provider path does not add a new paid service.

## Current Evidence

- `src/components/AuthEntryScreen.tsx` owns the current email magic-link entry UI.
- `src/lib/auth-actions.ts` and `src/routes/api.auth.confirm.tsx` already own the PKCE code exchange,
  request-bound Supabase client, cookie session and sanitized post-auth redirect.
- A signed-in user without saved Runner truth already enters the existing onboarding flow.
- `public.runner_profiles` requires complete runner goal/baseline facts and is created by the
  existing reviewed onboarding/materialization path. Google login must not create an incomplete
  placeholder row or a second profile table.
- Supabase currently includes social OAuth providers in its Free plan and includes 50,000 monthly
  active users. Basic Google Account login uses only OpenID Connect identity scopes; Gmail, Drive,
  Calendar and offline Google API access are not part of this outcome.
- `HITO-281` currently owns the shared production Supabase lifecycle boundary. This Task must not
  configure or test the hosted Google provider until that boundary is released and handed over.

## Accepted Shape

1. Reuse Supabase Auth as the only authentication system and the existing `/api/auth/confirm` code
   exchange/session seam.
2. Add a bounded Google OAuth start action that preserves the sanitized `next` path and requests
   only `openid`, `email` and `profile` identity data.
3. Configure a Google Web OAuth client with Hito origins and the exact Supabase callback URL. Keep
   the client secret in the provider/Supabase secret boundary; never expose it to browser source.
4. After first sign-in, keep the user in existing Hito onboarding until the canonical runner profile
   and first saved plan are created by the current atomic owner.
5. Preserve email magic-link login and existing user ownership. Explicitly prove the returning-user
   and matching-email identity behavior instead of adding manual identity linking by assumption.
6. Add the Google entry control to the existing auth screen only after Backend exposes the stable
   start/availability contract.

## What Not To Touch

- No new auth service, profile table, placeholder `runner_profiles` row or client-owned profile
  reconstruction.
- No Gmail, Drive, Calendar, contacts, offline access or storage of Google provider tokens.
- No change to local auth bypass, Admin identity classification, existing email magic links or
  onboarding/Calendar ownership.
- No hosted Supabase or Google Cloud mutation while `HITO-281` owns the shared provider boundary.
- No commit, push, deployment, production-user test or use of Ivan's personal Google session.

## Acceptance

- A new disposable test Google identity completes provider consent, Supabase callback, PKCE exchange
  and cookie session, then lands in the existing onboarding state without an incomplete profile.
- Completing onboarding creates the same canonical runner profile/plan truth as email sign-in.
- A returning Google identity resolves to the same Hito owner; matching-email behavior is explicitly
  proven or returned to Product as a decision instead of silently duplicating or linking identities.
- Cancelled consent, invalid callback/code, missing provider configuration and blocked popup/redirect
  states fail safely without destroying a valid session.
- Email magic-link and local `qa_fixture` auth behavior remain unchanged.
- Backend, Frontend Product-lane and independent QA evidence are recorded separately on the same
  Notion Task. Hosted provider proof is required before Product acceptance but is not authorized by
  this intake.

## Official References

- Supabase Google login: https://supabase.com/docs/guides/auth/social-login/auth-google
- Supabase redirect URLs: https://supabase.com/docs/guides/auth/redirect-urls
- Supabase pricing: https://supabase.com/pricing
- Google OpenID Connect: https://developers.google.com/identity/openid-connect/openid-connect
- Google Auth Platform clients: https://support.google.com/cloud/answer/15549257

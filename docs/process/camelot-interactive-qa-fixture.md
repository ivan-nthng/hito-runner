# Camelot Interactive QA Fixture

Camelot is the explicitly selected, local-only Hito design sandbox. It is one profile of the
existing managed QA lifecycle and `test-user` pool, not a second database, Auth path or fixture
family. The lifecycle has two independent loopback runtime slots over one canonical build owner and
one admitted local Supabase service:

- ordinary `qa_fixture` uses `http://127.0.0.1:3000`;
- Camelot uses `http://localhost:3100`, keeping browser cookies separate from `qa_fixture`.

Each slot has its own immutable runtime snapshot, PID, state, log, lease and freshness receipt.
Building or starting one slot never stops the other.

## Commands

Run these from the repository root:

```bash
npm run camelot:start
npm run camelot:status
npm run camelot:reset
npm run camelot:stop
```

- `start` admits the pinned local Supabase lifecycle, ensures the metadata-proven `camelot` pool
  identity, seeds the known review-ready base, and starts only the `camelot` slot on port 3100 in
  `qa_fixture` mode with profile `camelot`.
- `status` reports managed-server health, profile/version/provenance, the exact provider dispatch
  count, all 26 owner-table counts, storage count, an own-versus-foreign RLS readback and the
  ordinary public Saved plans list/Restore readback. It never reports credentials or Auth
  identifiers.
- `reset` deletes only Camelot-owned rows/storage through the canonical reset owner, proves zero,
  and reseeds the same review-ready base while retaining the disposable Auth identity.
- `stop` first resets all 26 Camelot-owned table counts, Storage objects and the pool lease to zero,
  then stops only the Camelot slot. It retains the disposable local Auth identity and leaves the
  shared project-qualified Supabase service and ordinary `qa_fixture` slot unchanged.

Always run `camelot:stop` when the interactive session is over. Use the existing
`qa:server:start|status|restart|stop` commands for the independent port-3000 regression slot.

## Fixture State And Interaction Contract

Fixture version `camelot_interactive_qa_fixture_v1` reuses the accepted
`adaptive_engine_ui_replay_v1` initial-review checkpoint. The base contains one fresh deterministic
Saved plan whose ordinary `Restore plan` action returns a 28-document, four-calendar-week Review.
It includes Rest, Easy, controlled Steady, interval, effort-only hill-repeat, Long run and factual
progression/cutback work. Confirmation and Calendar materialisation remain the ordinary product
actions; the base has zero confirmations and zero Calendar rows.

While the exact Camelot profile and identity are active, the normal initial plan action uses the
existing deterministic QA authoring response for any otherwise valid selected goal. It persists a
fresh Saved plan through the same source/candidate owner and never calls a provider. Nothing reaches
Calendar until the ordinary Review/Confirm contract succeeds.

For FIT control exploration, Camelot exposes the narrow
`camelot_simulated_fit_outcome_v1` result. The upload boundary preserves a sanitized presentation
filename, discards the locally selected bytes before the real FIT parser or Storage owner, and
substitutes the existing checksum-pinned synthetic FIT through the normal Result/Evidence owners.
Outside the exact Camelot profile and pool identity, selected files use the unchanged real parser;
invalid bytes never gain fixture treatment.

## Safety Boundary

Camelot fails closed unless every condition is true:

- the managed server selected profile `camelot` explicitly;
- provider mode is `qa_fixture` and the deterministic fixture flag is active;
- both app and Supabase origins are loopback;
- request authentication is local and resolves to the `camelot` metadata-proven pool identity;
- neither Vercel nor CI is active.

It is forbidden on hosted Supabase, Vercel, a real provider runtime, another QA identity or Ivan's
session. While the Camelot profile is selected, the existing local-auth owner exposes only the
`camelot` pool account; a cookie or login for another local QA role fails closed. It contains no
provider response content, credentials, action links or personal data. Its
durable zero-provider proof is the owner-bound deterministic retained-response provenance queried by
`camelot:status`; `runner_capability_usage` remains zero.

## Ownership

The command wrapper only sequences existing owners:

1. project-qualified local Supabase lifecycle;
2. profile-specific `test-user` pool identity and 26-table reset;
3. accepted adaptive UI replay Saved plan/candidate persistence;
4. ordinary Restore/Review/Confirm and Runner Calendar ownership;
5. canonical synthetic FIT parser, Result/Evidence and Runner Fitness Profile chain;
6. existing managed QA lifecycle with independent `qa_fixture` and `camelot` slots.

No schema, migration, provider, compatibility route, client state store or second writer belongs to
Camelot.

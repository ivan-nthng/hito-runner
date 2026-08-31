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

## Residual Node And CI Architecture Decision — 2026-08-30

### Decision And Ownership

Use Node.js `24.19.0` for repository-local and CI execution. The new root `.nvmrc` is the sole exact
version owner. Node `24.19.0` is the host-verifiable bundled Node 24 LTS release selected for this
slice; it is listed in the official
[Node.js 24 archive](https://nodejs.org/en/download/archive/v24); Node 24 remains supported through
April 2028. `package.json#engines.node` narrows from `>=22.12.0` to `24.x` and the root
`package-lock.json` metadata mirrors that major compatibility constraint, but neither duplicates the
exact pin.

The linked Vercel project remains configured as `24.x`. Vercel supports only major selections and
automatically advances their minor and patch versions, so this decision aligns the major runtime but
does not claim exact patch parity with a deployment. The hosted configuration and deployment are not
changed by this slice. See Vercel's
[supported Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

`package.json#packageManager` remains the sole npm-version owner at `npm@10.9.4`. Local and CI setup
must install that declared value after selecting Node, then prove it before `npm ci`; the workflow
must not copy `10.9.4` into a second field.

### One CI Composition

Create `.github/workflows/ci.yml` as the sole repository CI workflow. It runs for pull requests and
pushes to `main`, grants only `contents: read`, uses `ubuntu-24.04`, has one validation job and no
secrets, cache, matrix, deployment, provider, Supabase, browser or runtime service. Pin the external
actions to the immutable current tag commits resolved during this decision:

- `actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803` (`v6`);
- `actions/setup-node@820762786026740c76f36085b0efc47a31fe5020` (`v7`) with
  `node-version-file: .nvmrc`.

The job directly invokes the existing local command surface in this order:

1. install the npm spec read from `package.json#packageManager` and assert its reported version;
2. `npm ci`;
3. `npm run lint`;
4. `npm run validate:backend`;
5. `npm run build`;
6. `git diff --check`.

`npm run build` retains its existing lifecycle: outside Vercel, its deployment-parity prebuild
explicitly skips rather than contacting hosted Supabase. The CI workflow must not call
`validate:backend:release`, local DB/runtime groups, fixtures or hidden wrappers. GitHub recommends
`setup-node` for consistent runner versions and dependency installation in its
[Node.js Actions guide](https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs).

### Exact BACKEND Allowlist

BACKEND may change only:

1. `.nvmrc` — new exact `24.19.0` owner;
2. `package.json` — only `engines.node: "24.x"`;
3. `package-lock.json` — only the root-package engines metadata parity change;
4. `.github/workflows/ci.yml` — the workflow above;
5. [`PROJECT_PROFILE.md`](../../../PROJECT_PROFILE.md) — replace the superseded no-exact-pin/no-CI
   facts with the accepted pin, ownership, commands and honest hosted-patch omission;
6. this HITO-303 record — compact implementation and validation evidence only.

No dependency resolution, application source, script, runtime, Supabase, Vercel setting or terminal
HITO-300 record may change. HITO-300's statement that no CI existed remains accurate historical
evidence at its acceptance point; Ivan's HITO-303 decision supersedes only the current-state fact.

### Proof, Stop And Rollback

Before release, local proof under `.nvmrc` is exact Node and declared npm readback, `npm ci`,
`npm run lint`, `npm run validate:backend`, `npm run build`, scoped Prettier for the admitted Markdown
and workflow, workflow/YAML readback, local Markdown links and `git diff --check`. A clean isolated
checkout must reproduce the same sequence. These checks do not prove GitHub runner execution,
browser, local/hosted database, deployment or production behavior.

Pushing the admitted workflow is an external GitHub Actions effect: it schedules third-party hosted
compute and creates checks for the pushed commit. Release therefore requires the existing Git
authority and independent QA of one frozen manifest. Acceptance requires the first GitHub Actions
run on the exact released commit to pass. No workflow step may deploy or receive project secrets.

Stop before release if Node `24.19.0` plus the unchanged dependency graph cannot run the canonical
commands, if the lockfile changes beyond root engines metadata, or if the workflow needs credentials,
hosted data or a new command path. Rollback is one revert of the admitted commit: remove `.nvmrc` and
the workflow, restore the two engines fields and the prior profile/receipt text. Cancel any in-flight
Actions run; no application or data rollback exists because this decision deploys nothing.

## Repository Lint Input-Boundary Decision — 2026-08-30

The first implementation gate failed because `package.json#lint` runs `eslint .`, while the global
ignore object in `eslint.config.js` does not exclude the Git-ignored local Vercel build output.
ESLint therefore applies `prettier/prettier` to `.vercel/output`: the current checkout contains 282
lintable generated files there (13,657,094 bytes), including one 4,211,278-byte server bundle. A
single generated bundle completed in 5.765 seconds with lint findings; the disjoint 223-file,
11,734,496-byte functions slice did not finish and was stopped once at the mandatory 60-second
boundary. No lint process remained. This is generated-artifact traversal, not evidence of a Node,
npm, dependency, application-source or GitHub Actions defect.

BACKEND owns the one-file correction: add `.vercel/**` to the existing global `ignores` in
`eslint.config.js`. Do not change `package.json#lint`, the workflow, dependencies, source files,
`.gitignore`, `.prettierignore` or other generated-directory policy in this fix. Rollback removes
only that ignore entry.

Proof is one fresh `npm run lint` attempt under Node `24.19.0`, guarded by a 60-second hard stop and
no automatic retry. Before it, a config readback must show that a representative
`.vercel/output/functions` bundle has no applicable ESLint config. The lint must complete inside the
gate; a timeout stops the slice and returns the next exact input discriminator. Existing Node/npm,
`npm ci`, workflow-YAML, backend-validation and build boundaries remain unchanged and are not rerun
until this first gate passes.

## Post-Ignore Lint Classification Stop — 2026-08-30

The `.vercel/**` correction is effective: a representative generated bundle has no applicable
ESLint config, and the sole post-fix repository lint completed in 13.137 seconds rather than timing
out. The gate still exits `1` with 193 pre-existing findings (192 errors and one warning).

The retained BACKEND receipt preserves the aggregate and only two examples, not the complete
path/rule/count output or an artifact containing it. The current evidence therefore proves two
different classes but cannot enumerate all 193 findings:

- `supabase/.temp/start-secrets/.../index.ts` is generated, unowned runtime output that is still
  admitted by the current ESLint input boundary;
- the reported `no-unsafe-finally` finding is in an existing persistence-proof source, so it is a
  source defect owned by that proof's existing domain owner, not generated-output policy.

The bounded static proof
`npx --no-install eslint --print-config supabase/.temp/start-secrets/supabase_edge_runtime_hito-running/main/index.ts`
completed in 1.3 seconds and showed `typescript-eslint/parser` plus an enabled `prettier/prettier`
error rule. It proves the generated path is currently admitted without rerunning lint.

No retained finding names `eslint.config.js` or proves that a HITO-300–303 broker/config source is
among the remaining findings. Static inspection cannot reconstruct the omitted ESLint file/rule
inventory without guessing. Consequently there is no truthful source-correction allowlist or single
implementation owner yet, and broad application/runtime cleanup is not admitted.

The exact missing discriminator is one retained machine-readable file/rule/count inventory from a
single repository lint execution. PRODUCT must explicitly admit that same-Task evidence capture
before owner-specific fixes can be partitioned. It must use the unchanged Node `24.19.0` command,
write only a mode-0600 disposable artifact outside the repository, stop the single attempt at 60
seconds, never retry automatically and make no source/config change. Until then, HITO-303 returns to
PRODUCT; `validate:backend`, build, QA, GitHub Actions and release remain untouched.

## Machine-Readable Lint Partition — 2026-08-30

The admitted one-shot evidence capture used Node `24.19.0`, npm `10.9.4` and the same `eslint .`
repository boundary with JSON formatting. It completed in 12.119 seconds, did not time out, exited
`1`, left no lint process and produced 193 findings across three of 445 inspected files: 192 errors
and one warning.

The complete path-class and rule partition is:

- generated Supabase temporary output: 191 errors in
  `supabase/.temp/start-secrets/supabase_edge_runtime_hito-running/main/index.ts` — `prefer-const`
  131, `@typescript-eslint/no-unused-expressions` 29, `no-var` 23, `prettier/prettier` 5,
  `no-empty` 2 and `no-useless-escape` 1;
- repository proof source: one `no-unsafe-finally` error in
  `scripts/running-plan-engine-confirm/persistence-proof.ts`;
- application source: one `react-refresh/only-export-components` warning in `src/router.tsx`.

This yields exact future ownership boundaries without admitting a fix here: generated-output input
policy is owned at `eslint.config.js` and must never edit the generated file; the proof defect is
bounded to `scripts/running-plan-engine-confirm/persistence-proof.ts`; the non-fatal application
warning is bounded to `src/router.tsx`. No HITO-300–303 broker, Node-pin or CI-workflow source appears
in the finding set. `validate:backend`, build, QA, GitHub Actions and release remain unrun.

The 514,681-byte JSON artifact remained mode `0600` during analysis and its exact disposable
directory was removed afterward. The lint process group was absent, the shared index remained empty
and the pre/post repository fingerprint matched after rebinding only this authorized evidence text.

## Fatal Lint Correction Boundary — 2026-08-30

The two fatal classes have one implementation owner, BACKEND, and form one bounded two-file batch:

1. Add `"supabase/.temp/**"` to the existing global `ignores` array in `eslint.config.js` next to
   the other generated-output boundaries. Supabase CLI `.temp` output is not repository source and
   must not be edited to satisfy lint. Rollback removes exactly that one ignore entry.
2. In `scripts/running-plan-engine-confirm/persistence-proof.ts`, preserve the cleanup and its first
   error while removing the explicit throw from the `finally` block at current lines 1502–1508:
   declare one nullable cleanup-error variable beside `ownerCleanup`/`otherCleanup`, capture the
   first `sourceCleanup.error` in the loop, and throw it immediately after the `finally` block. On a
   successful proof body, cleanup failure remains fatal; if the body already failed, cleanup no
   longer masks that original failure. Rollback removes the variable and post-`finally` throw and
   restores the original line 1507 throw.

The exact BACKEND writable allowlist is only `eslint.config.js` and
`scripts/running-plan-engine-confirm/persistence-proof.ts`. Do not edit generated Supabase output,
`src/router.tsx`, application behavior, workflow, package/lock/runtime pins, dependencies, schema,
migrations, Supabase state, fixtures or other lint findings.

The `react-refresh/only-export-components` finding in `src/router.tsx` remains an explicit omitted
non-fatal warning. The accepted workflow invokes plain `npm run lint` without `--max-warnings`, so
zero warnings are not a current CI acceptance condition; changing router ownership or exports is not
admitted by this recovery slice.

Before any repository-wide lint, run exactly one focused attempt under Node `24.19.0`, with a
60-second hard stop and no retry:

`npx --no-install eslint --no-warn-ignored --no-error-on-unmatched-pattern eslint.config.js scripts/running-plan-engine-confirm/persistence-proof.ts supabase/.temp/start-secrets/supabase_edge_runtime_hito-running/main/index.ts`

Exit `0` proves the generated path is ignored and both admitted source files are clean. A nonzero
result or timeout stops the slice at that exact finding; it does not authorize another file or a
second attempt. Only after this focused PASS may BACKEND run the already accepted single full lint
gate under the same 60-second/no-retry rule.

## Implementation And Validation Receipt — 2026-08-30

The exact Node `24.19.0` / npm `10.9.4` candidate passed the focused lint in 1.536 seconds and the
full repository lint in 10.304 seconds. The sole remaining `src/router.tsx`
`react-refresh/only-export-components` warning is the admitted non-fatal omission above.

The complete backend source validator passed all 15 source checks in 12.693 seconds after its one
cache-capability re-home; its local-database, runtime and release groups remained skipped. The
production build passed in 40.611 seconds after its one cache-capability re-home: prebuild, client,
SSR/Nitro and artifact finalization all completed without timeout or residual process. Neither
operation may be repeated in this acceptance cycle.

No browser, database-parity, GitHub Actions, Git release, hosted-data or deployment evidence exists
at this layer. Those remain separate later acceptance effects.

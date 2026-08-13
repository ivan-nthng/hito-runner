# Hito UI Simplification, CSS Ownership, And Source-Of-Truth Audit

## Work Item ID

2026-08-12-hito-ui-simplification-source-of-truth-audit

## Status

completed

## Type

ui-cleanup-audit

## Priority

high

## Owner

qa

## Mode

Tracked

## Scope

Independent audit of the recent Hito UI simplification work: typography, neutral chrome and color
truth, Design System reference surfaces, Marks, Local Inspector, and CSS ownership. The audit
identifies demonstrated legacy reachability, duplicate visual recipes, stale documentation or
manifest truth, and competing canonical owners. It does not implement cleanup.

## Archive Intent

retain_in_place

## Task

Establish whether the recently completed visual-system work has one understandable source of truth
per responsibility, or whether executable legacy paths, duplicated CSS recipes, stale generated
facts, and contradictory documentation remain. Produce an evidence-backed cleanup inventory that
PRODUCT can split by canonical owner. Do not turn source similarity alone into a defect and do not
recommend a rewrite, framework, or broad file consolidation.

## Accepted Work To Audit

- [Typography Scale Consolidation And Adoption](2026-08-11-hito-ds-typography-scale-consolidation-and-adoption.md)
- [CSS Ownership And Recipe Consolidation](2026-08-12-hito-ds-css-ownership-and-recipe-consolidation.md)
- [Tokenized Neutral-Chrome Migration](2026-08-11-hito-ds-tokenized-neutral-chrome-migration.md)
- [Foundations Color Truth, Context, And Reference Canvas](2026-08-11-hito-ds-foundations-color-truth-context-and-reference-canvas.md)
- [Mark Library And Reference](2026-08-12-hito-ds-mark-library-and-reference.md)
- [Mark Playground And Size-Aware Radius](2026-08-12-hito-ds-mark-playground-and-size-aware-radius.md)
- [Playground Stage Canonicalization](2026-08-12-hito-ds-playground-stage-canonicalization.md)
- [Overview Specimen Intrinsic Sizing And Empty Stage Repair](2026-08-12-hito-ds-overview-specimen-intrinsic-sizing-and-empty-stage-repair.md)
- [Local Inspector Color Property Control](2026-08-11-local-ui-inspector-color-property-control.md)
- [Local Inspector Editable Text Single Field](2026-08-11-local-ui-inspector-editable-text-single-field.md)
- [Local Inspector Atomic Group Drafts And Control Chrome](2026-08-11-local-ui-inspector-atomic-group-drafts-and-control-chrome.md)
- [Canonical Loopback Local Inspector Availability](2026-08-04-canonical-loopback-local-inspector-availability.md)

## Audit Questions

1. Is the typography contract still exactly one canonical registry, generated manifest path, and
   shared renderer contract, with no reachable retired role, alias, provenance ID, selector, or
   stale style/source definition?
2. Do neutral chrome, semantic color resolution, alpha facts, primitive provenance, and live theme
   resolution have one canonical owner each? Identify a duplicate only when two live paths can
   independently determine the same UI outcome.
3. Does the current CSS ownership match actual responsibility: component CSS at component owners,
   reference composition at reference owners, and no surviving single-owner global alias or
   contradictory state precedence? Do not equate several intentional CSS files with a defect.
4. Do Foundations, Overview, playground stages, and Mark gallery/playground use shared existing
   primitives/tokens/composition rather than competing route-local recipes?
5. Does Local Inspector retain one draft state and one generated-manifest metadata source for
   typography/color/property eligibility, with no parallel selection/payload or live-page mutation
   path?
6. Do current-system/current-state and canonical backlog records materially disagree about the
   completed recent UI contracts? Treat stale documentation as a documentation candidate, not a
   source-code defect.

## Required Evidence And Boundaries

- Start with a candidate freeze: record current dirty-worktree inventory and relevant source
  snapshot without altering it.
- Use source reachability, generated-manifest parity, selector/variable ownership, and computed
  browser evidence where it can distinguish a live duplicate from an intentional shared rule.
- Run current applicable validators/checks; browser-replay representative `/hitoDS`, Local
  Inspector, and Product surfaces only where needed to demonstrate an alleged conflict.
- Classify each finding as exactly one of: `confirmed deletion candidate`, `confirmed ownership
conflict`, `documentation drift`, `intentional reuse`, `coverage gap`, or `no finding`.
- Every actionable finding must state: first incorrect canonical owner, exact seam, live consumer
  evidence, proposed net reduction, preserved boundary, and the owner required for a later
  implementation slice.
- Do not edit runtime source, CSS, tokens, manifests, validators, generated files, Product data,
  Figma, hosted state, Git state, or existing receipts. The only permitted write is this task's
  English QA audit receipt and local evidence necessary to support it.
- Do not clean or delete anything. PRODUCT chooses and routes later cleanup work only after this
  audit.

## Definition Of Done

- The audit distinguishes real duplicate authority from intentional separation of primitive,
  component, reference, generated, and Product responsibilities.
- It provides a ranked, evidence-backed list of at most five cleanup candidates, or explicitly
  reports that no safe candidate is demonstrated.
- Each candidate is small enough to route to one canonical owner without cross-owner implementation
  by a subagent.
- Existing recent implementation receipts are neither overwritten nor elevated to hosted/release
  proof.

## Product Dispatch — 2026-08-12

```text
ROLE: QA

Mode: Tracked
Stage: UI simplification, CSS ownership, and source-of-truth audit

Execute this canonical item:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-12-hito-ui-simplification-source-of-truth-audit.md`

Read `AGENTS.md`, `agents/qa.agent.md`,
`skills/hito-architecture-audit/SKILL.md`,
`skills/hito-qa-browser-regression/SKILL.md`, the current docs, and every accepted work item listed
in this task before audit conclusions.

This is an independent QA audit, not an implementation task. Audit the recent typography, color and
neutral-chrome, CSS ownership, `/hitoDS` reference, Mark, and Local Inspector work for real legacy
reachability, duplicate authority, contradictory recipes, and documentation/manifest drift.

Use source reachability and current generated/browser facts to distinguish a defect from intentional
reuse. Do not treat multiple CSS files as a defect by itself. Do not edit or delete runtime source,
CSS, tokens, manifests, validators, Product data, Figma, hosted state, or Git state. Do not dispatch
implementation work. Update only this canonical task with an English tracked QA audit receipt and
supporting local evidence when necessary.

For every actionable finding, provide the first incorrect canonical owner, exact seam, live consumer
evidence, smallest net-reducing cleanup, preserved boundary, and next owner. Categorize all reviewed
areas as confirmed deletion candidate, confirmed ownership conflict, documentation drift,
intentional reuse, coverage gap, or no finding.

Run proportionate current validators and browser discriminators only where needed to prove an actual
conflict. Preserve unrelated dirty work. Do not stage, commit, push, deploy, call providers, mutate
fixtures, or claim Global QA/release readiness.
```

## Next Recommended Role

PRODUCT — decide whether and when to route the two bounded cleanup candidates to DESIGN SYSTEM and
PRODUCT documentation ownership. No implementation was dispatched by QA.

## Blockers

None for audit closure. The two demonstrated cleanup candidates remain unimplemented and require
separate Product routing. An alleged duplicate without live reachability evidence remains a
non-finding, not a cleanup authorization.

## Tracked QA Audit Receipt — 2026-08-12

- **Task / stage / validation layer:** Hito UI Simplification, CSS Ownership, And Source-Of-Truth
  Audit; UI simplification, CSS ownership, and source-of-truth audit; independent focused QA audit,
  not Implementation DoD, Global QA Acceptance, hosted parity, release, or deployment acceptance.
- **Role and procedures:** QA read `AGENTS.md`, `agents/qa.agent.md`,
  `skills/hito-architecture-audit/SKILL.md`, and
  `skills/hito-qa-browser-regression/SKILL.md`. Architecture/source ownership was the primary
  procedure. Browser procedure was used only to classify the current runtime path and its evidence
  limit; no browser navigation was claimed. No subagent was used.
- **Execution preflight and candidate freeze:** QA recorded the dirty candidate before validation
  and made no runtime-source, CSS, token, manifest, validator, generated-file, Product-data, Figma,
  hosted-state, fixture, provider, dependency, or Git-lifecycle mutation. `HEAD` and `origin/main`
  both resolved to `ee4fde5c1bda4a7cb5477bcf1a8ce90d9e50674d`. The preserved checkout contained
  126 tracked dirty entries and 33 untracked entries, including the accepted untracked task records,
  the Brand route/page, and the Mark primitive. Two consecutive source snapshots were identical:
  the relevant tracked `src/` plus DS generator/validator diff hashed to
  `2c1150b3b93957c1a34e1e7842b93fde89423ec42e0fe96ec0fec25941b1012b`, and the three
  untracked runtime artifacts `reference-brand-page.tsx`, `hito-mark.tsx`, and
  `hitoDS_.brand.tsx` hashed to
  `632b165e10a16e6e130f3ae59354351cc84aced332966aa2ae47b5756802a42b`.
- **Context read:** QA read `docs/current-system.md`, `docs/current-state.md`,
  `docs/current-product.md`, and every one of the twelve accepted work items named above. All
  twelve accepted items currently report `completed`; their receipts were used as historical
  contract context, not as substitutes for the current source/generated checks below.
- **Outcome:** the audit demonstrated two actionable cleanup candidates and no reachable retired
  runtime typography path, parallel Mark registry, second Inspector draft/metadata owner, or
  duplicate CSS recipe authority. Similar-looking CSS declarations were retained as intentional
  component inputs, provenance stamps, or one-declaration cross-owner geometry contracts only where
  the current source and accepted ownership receipt agreed.

### Ranked Cleanup Candidates

1. **Confirmed ownership conflict — duplicated favicon visual truth.**
   - **First incorrect canonical owner:** DESIGN SYSTEM, Brand & Visuals reference composition.
   - **Exact seam:** `src/components/hito-ds/reference-brand-page.tsx`, the `Favicon surface`
     `LogoSpecimen` class, independently hardcodes `#3a3732`, `#15130f`, and `#030303` as a CSS
     gradient. `public/favicon.svg` separately owns the identical three stops and is the actual
     application icon linked by `src/routes/__root.tsx`.
   - **Live consumer evidence:** the generated route tree and `reference-model.ts` expose
     `/hitoDS/brand`, while the root metadata links `/favicon.svg`. Either source can change its
     rendered favicon claim without changing the other; exact matching literals therefore prove
     duplicate authority rather than mere visual similarity.
   - **Smallest net-reducing cleanup:** make the Brand favicon specimen render the canonical
     `/favicon.svg` asset itself and remove the recreated gradient/mark composition from that one
     specimen. Do not add a token, helper, CSS recipe, registry, or compatibility path.
   - **Preserved boundary:** retain `HitoLogo`/`HitoLogoMark`, the separate fifteen-entry `HitoMark`
     library and Foundations gallery/playground, all actual favicon geometry, Product consumers,
     atmospheric recipes, and theme semantics.
   - **Next owner:** DESIGN SYSTEM, only after PRODUCT creates or selects a bounded implementation
     item.

2. **Documentation drift — current documents describe superseded UI lifecycle and typography.**
   - **First incorrect canonical owner:** PRODUCT documentation ownership.
   - **Exact seams:** `docs/current-state.md` still reports 2026-08-06 and released baseline
     `4668190ea7735b5e643aed14367d3bad8af6ba79`, and still describes Local Inspector as an unresolved
     independent work item. `docs/current-product.md` still calls typography a first pass, names the
     retired modal-title/panel-title/body-small/form-label/technical-mono role family, and says the
     conformance audit still tracks consumer migrations.
   - **Live consumer evidence:** current `main`/`origin/main` are
     `ee4fde5c1bda4a7cb5477bcf1a8ce90d9e50674d`; the loopback Inspector availability and all twelve
     audited UI items are `completed`; the current registry/manifest/validator enforce exactly 14
     reusable roles plus four component-bound roles and zero retired reachability. These current
     documents are active agent context even though they are not the operational queue.
   - **Smallest net-reducing cleanup:** refresh the baseline/date and current UI summary, delete the
     obsolete Inspector-pending and first-pass/retired-role statements, and summarize the accepted
     14+4 contract without copying implementation receipts into a second lifecycle source.
   - **Preserved boundary:** keep `docs/tasks/backlog/` as the sole operational queue; retain
     historical receipts, Global QA/release distinctions, Backend truth, and exact historical
     chronology in history/task records.
   - **Next owner:** PRODUCT documentation ownership; this is not a runtime-source defect.

### Reviewed-Area Classification

| Reviewed area                                                                                   | Classification                 | Current evidence and decision                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Typography registry, CSS provenance, generated TypeScript/JSON manifests, and Inspector choices | `no finding`                   | One registry (`hito-typography-roles.ts`) feeds the generator and current consumers; generator check and DS validator enforce 14 reusable plus four component-bound roles. Retired names occur only in validator negative guards, not reachable runtime source or generated output.                                                                                              |
| Semantic/primitive color, neutral chrome, alpha facts, and theme resolution                     | `no finding`                   | Manifest semantic/primitive metadata remains generated; component CSS resolves live theme/state truth. No second palette or competing state owner was demonstrated.                                                                                                                                                                                                              |
| External root geometry and repeated custom-property names                                       | `intentional reuse`            | Exactly three non-Foundation cross-owner geometry declarations remain: avatar width, mobile bottom-nav height, and shell sidebar width. Repeated `--hito-dual-range-accent`, `--hito-inline-header-min-width`, and `--hito-typography-role` uses remain accepted component inputs/provenance rather than duplicate value authorities.                                            |
| Shared surface, icon/logo, shell-profile, and state selectors across CSS modules                | `no finding`                   | Each canonical recipe definition has one current CSS owner; reference CSS supplies only reference composition and the accepted quiet-surface/workbench geometry. Multiple CSS files are not a defect.                                                                                                                                                                            |
| Brand favicon specimen versus actual application favicon                                        | `confirmed ownership conflict` | The routed Brand specimen and linked public asset independently encode the same three gradient stops. Candidate 1 gives the bounded reduction.                                                                                                                                                                                                                                   |
| Foundations, Overview, and shared playground stage                                              | `intentional reuse`            | `HitoDsPlayground` is the only current `hito-ds-playground-stage` renderer; the stage recipe is owned once by `reference-workbench.css`. Overview cards intentionally use their separate intrinsic reference-card contract rather than a second playground recipe.                                                                                                               |
| Mark primitive, metadata, gallery, and playground                                               | `intentional reuse`            | One private `HITO_MARK_DEFINITIONS` table and exported metadata/primitive own all fifteen marks. Foundations is the only current HitoMark consumer; the playground is focused inspection and the lower gallery is the complete catalogue, as explicitly accepted.                                                                                                                |
| Local Inspector draft, property eligibility, payload, and page-mutation boundary                | `no finding`                   | One `LocalUiInspectorItemDraft` owns `desiredTokens`, `desiredTypographyRole`, and `proposedText`; color eligibility comes from the generated manifest and typography from the canonical role registry. Source search found no selected-page color/typography/text style mutation path. Temporary Inspector overlay/body styles are restored and do not implement Product edits. |
| Current system/state/product documentation                                                      | `documentation drift`          | `current-system.md` remains materially aligned, but `current-state.md` and `current-product.md` contain the stale facts in Candidate 2.                                                                                                                                                                                                                                          |
| Confirmed dead legacy eligible for immediate deletion                                           | `no finding`                   | No reachable retired selector, role, provenance ID, alias, old Mark registry, duplicate stage, Inspector store, or Product fallback was demonstrated. Validator guard strings remain useful negative assertions and are not deletion candidates.                                                                                                                                 |
| Current computed browser evidence                                                               | `coverage gap`                 | The existing loopback process was classified unusable for current-candidate proof: PID 15198, loopback-bound `qa_fixture`, but unmanaged/incompatible, unhealthy, stale, and `build: broken` because the private Admin snapshot artifact is missing. No browser result was fabricated from it.                                                                                   |

### Validation Inventory

| Check                                   | Scenario / environment                                                              | Result                     | Evidence                                                                                                                                                                                                                                 |
| --------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Candidate freeze                        | Current main checkout, before audit write                                           | Passed                     | `HEAD == origin/main == ee4fde5c...`; 126 tracked dirty and 33 untracked entries preserved; two consecutive relevant source hashes matched.                                                                                              |
| Accepted-context inventory              | Current docs plus all twelve listed accepted work items                             | Passed                     | All required files were read completely; every listed work item currently says `completed`.                                                                                                                                              |
| Generated manifest parity               | `node scripts/generate-hito-ds-manifest.mjs --check`                                | Passed                     | Reported 43 primitive colours, 41 semantic colours, and 14 Text Styles; TypeScript/JSON output matched the registry.                                                                                                                     |
| Design System contract                  | `npm run validate-hito-ds-components`                                               | Passed                     | Contract `ok` across 324 scanned files; exact typography/color/reference families and zero retired reachability passed.                                                                                                                  |
| Retired and competing-path reachability | Focused `rg` across runtime CSS/TS/TSX, manifests, generators, DevTools, and routes | Passed                     | Retired typography identifiers were confined to negative validator guards; one stage renderer, one Mark table, one Inspector draft map, and one generated color metadata source were found.                                              |
| CSS ownership census                    | All imported `src/styles/*.css` owners and custom-property declarations             | Passed                     | Three accepted external cross-owner geometry declarations remained. Only the three documented component-input/provenance names occurred in more than one CSS file. Canonical surface/logo/profile recipes each had one definition owner. |
| Favicon discriminator                   | `/hitoDS/brand` source reachability plus root icon metadata                         | Failed ownership check     | Brand route/page hardcodes the exact three gradient stops separately owned by the live `/favicon.svg` asset. Candidate 1 names the first owner and reduction.                                                                            |
| Current-doc accuracy                    | `current-state.md` and `current-product.md` versus current Git/task/registry facts  | Failed documentation check | Stale released SHA/date, Inspector status, retired typography names, and first-pass/conformance wording contradict current completed facts. Candidate 2 scopes the refresh.                                                              |
| Focused static quality                  | Targeted ESLint, focused Prettier check, and `git diff --check`                     | Passed                     | Relevant registry, DS, Mark, Inspector, generator/validator, CSS, and task context passed without a source edit.                                                                                                                         |
| Browser path admissibility              | `npm run qa:server:status`                                                          | Coverage gap               | Existing loopback runtime was stale/broken and not compatible current-source evidence. A rebuild/restart was disproportionate because no computed-style discriminator remained necessary to establish either finding.                    |
| Fixture/provider/Git boundary           | Entire audit                                                                        | Passed                     | No fixture mutation, provider call, hosted access, staging, commit, push, deploy, or runtime-source edit occurred.                                                                                                                       |

### Coverage Gaps And Consequences

- No current browser/computed-style replay was claimed. The available loopback artifact was stale and
  broken, so it could not prove the current dirty candidate. Consequence: this receipt does not
  provide fresh visual, interaction, focus, responsive, console, or page-overflow acceptance.
  Source reachability was sufficient to demonstrate the favicon duplicate authority and current-doc
  drift, while earlier browser receipts remain historical evidence only.
- No fresh production build was run. The audit changed no runtime artifact, and the existing broken
  runtime was caused by a separate missing private Admin snapshot output. Consequence: this is not an
  assembled-build or release-candidate acceptance claim.
- No hosted, Figma, production, deployment, provider, persistence, or runner-data validation was in
  scope or performed.

### Verdict

**Verdict: Passed.** The independent source-of-truth audit is complete and meets its Definition of
Done with two evidence-backed, single-owner cleanup candidates. This verdict means the audit itself
passed; it does not mean the two findings are fixed, and it does not claim Implementation DoD,
Global QA Acceptance, hosted parity, release readiness, or deployment readiness.

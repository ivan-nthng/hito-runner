# Hito Recover Failed Half Marathon Preview As Import JSON

Work Item ID: `2026-08-18-hito-recover-failed-half-marathon-preview-as-import-json`
Status: ready
Type: Tracked
Priority: highest
Owner: BACKEND
Epic: runner-core-readiness
Parent: [Hito Generated Plan Preview Preparation Failure](./2026-08-18-hito-generated-plan-preview-preparation-failure.md)
Evidence From: [Hito Generated Plan Preview Preparation Failure](./2026-08-18-hito-generated-plan-preview-preparation-failure.md)
Depends On: [Hito Completed AI Plan Candidate Durable Retention](./2026-08-19-hito-completed-ai-plan-candidate-durable-retention.md)

## Scope

Recover the already-generated Half Marathon draft from Ivan's pasted exact model output only after
the durable AI response-capture contract exists. Persist it through that same private server-owned
contract, then expose it through the normal review/import path; do not store user plan data in Git
or a Downloads workaround.

## Archive Intent

Retain the recovery decision and validation receipt because it records why the failed preview did
not vanish and why no runner Calendar state was changed behind the user's back.

## Task

Use Ivan's pasted exact model output as the only source. After the dependency is complete, admit it
through the same server-owned AI response-capture contract used for normal completed plan responses,
then validate and present it through the normal review/import flow. Ivan still explicitly confirms
any Calendar materialisation.

## User Report

Ivan asked that the plan which failed preview preparation not be lost, so he can start running and
collect FIT files while architecture work continues. He allowed either Calendar insertion or a JSON
export; this task chooses JSON because it preserves the existing runner-controlled import/confirm
boundary and does not overwrite or silently mutate his Calendar.

## Evidence

- Existing provider response ID: `resp_073176036282c3bf006a84db55dc1487d2b407f97b25fe2f6d`.
- Ivan supplied the exact response content at
  `/Users/ivan/.codex/attachments/a61d8583-1c1b-48f1-ba8a-1d7aee5245be/pasted-text.txt`; it parses
  as JSON with top-level `workouts` and `endpoint`, and exactly 63 workout records.
- The completed provider response was rejected by the plan compiler before review; the incident
  record is [the parent P0 item](./2026-08-18-hito-generated-plan-preview-preparation-failure.md).

## Required Discriminator

The pasted output must map to the supported importer contract without inventing data. If import
validation fails, report the exact missing/rejected fields; do not regenerate, weaken validation,
or create a Calendar workaround.

## What Not To Touch

- Do not call the model, browser log, provider API, or network. Do not log/store the raw response in
  the repository or task record. Persist it only through the completed private server-owned response
  contract introduced by the dependency.
- Do not create, replace, clear, move, or otherwise mutate any hosted or local Calendar workout,
  source record, FIT/evidence data, schema, migration, fixture, configuration, runtime source, or
  Git state.
- Do not add an import format, compatibility path, parser, dependency, persistence model, or UI.
  Reuse only the current Training Plan v2 importer and its validation seam.

## Validation Expectations

Prove the pasted response is copied unchanged to the raw local file, the recovered import JSON is
accepted by the existing non-mutating importer, and it contains only factual plan content plus
required current-format metadata. Confirm that no Calendar or source rows changed. Report both
download paths and that user import is still required. Global QA, hosted deployment, and release
acceptance are outside this recovery.

## Stage

Ready after the durable response-capture dependency. The former Downloads write boundary is
superseded: user plan data must not be recovered into Git or a local-file workaround.

## Next Recommended Role

BACKEND

## User-Pasted JSON Recovery Receipt — 2026-08-19

- **Preflight:** The pasted attachment was the sole input. Its exact 105,862 bytes have SHA-256
  `726660eb598f96bb01018e417a58990ac567d19b5209453ea0a2f3e26bd2c37e`; it parses as JSON with only
  top-level `workouts` and `endpoint`, exactly 63 workout records, and one endpoint. Raw content was
  not printed or copied into the repository or receipt.
- **Reuse and change budget:** The current Training Plan v2 parser, `validateImportedPlanJson`, and
  non-mutating `buildImportedPlanSeed` remained the only admitted import seams. No production file,
  mapper, importer, helper, framework, compatibility path, persistence model, or configuration
  change was created.
- **Atomic-write result:** The first installed `tsx` CLI invocation stopped before task-data access
  with `listen EPERM` on its private IPC socket. The genuinely distinct direct
  `node --import tsx` invocation reached the required first raw-file step but `open` returned
  `EPERM` for the same-directory atomic temporary file under `/Users/ivan/Downloads/`.
- **Stop boundary:** The raw Downloads write was required to succeed before mapping and import
  validation. It did not, so the local process did not run the mapper, validator, seed builder, or
  import-file write. No alternate raw-content channel or filesystem bypass was attempted.
- **Artifact state:** Both
  `/Users/ivan/Downloads/Hito-OpenAI-response-resp_073176036282c3bf006a84db55dc1487d2b407f97b25fe2f6d.json`
  and `/Users/ivan/Downloads/Hito-Half-Marathon-Recovered-2026-08-18.json` remain absent. No matching
  atomic temporary file remains.

| Check                             | Scenario / environment                                                                                | Result                              | Evidence                                                                      |
| --------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| Attachment identity and structure | User-pasted local file only                                                                           | Passed                              | 105,862 bytes; exact SHA-256; valid JSON; 63 workouts plus endpoint           |
| Raw Downloads materialization     | Same-directory temporary file, fsync, atomic rename                                                   | Blocked                             | Direct local runtime received `open EPERM` before any target file existed     |
| Training Plan v2 validation       | Existing non-mutating parser and seed builder                                                         | Not run                             | Required raw-first gate did not pass                                          |
| Raw/import artifact integrity     | Named targets and matching temporary files                                                            | Passed as no-partial-write boundary | Both targets and temporary files are absent                                   |
| State preservation                | Calendar, sources, FIT/evidence, hosted data, fixtures, schema, migrations, source/configuration, Git | Passed                              | No application, persistence, fixture, provider, deployment, or Git action ran |

- **Omitted-check consequence:** No import-ready JSON exists and current importer acceptance of the
  recovered plan remains unproven. There is no invalid Training Plan v2 field to report because
  validation was not reached.
- **Preserved boundaries:** No browser, provider API, network, generation, retry, spend, external
  account/setting access, Calendar import, source mutation, or hosted action occurred. Existing
  unrelated checkout bytes were preserved; only this canonical receipt was updated.
- **Next owner:** PRODUCT for the demonstrated task-context filesystem capability boundary. The
  source attachment remains available, and no Backend source or provider-payload defect was
  established.

## Clipboard Materialization Receipt — 2026-08-19

- **Preflight:** Reused only the verified OpenAI Logs assistant JSON, the system clipboard bridge,
  existing provider draft schema, `validateImportedPlanJson`, and non-mutating
  `buildImportedPlanSeed`. No code, mapper, importer, framework, compatibility path, provider
  request, or alternate raw-content channel was added.
- **Clipboard result:** The browser copied the verified 63-workout-plus-endpoint JSON to the system
  clipboard without printing it. The local Backend process invoked `pbpaste` exactly once; it exited
  with code 1, returned no payload, and emitted no further OS diagnostic. The same local process
  could not clear the pasteboard with `pbcopy`, so the already-authorized browser clipboard bridge
  immediately cleared it instead.
- **Stop boundary:** Per dispatch, no alternate raw-content channel was attempted. With no payload
  received by the Backend process, no atomic raw write, mapping, importer validation, or import-file
  write occurred.
- **Artifact state:** Both
  `/Users/ivan/Downloads/Hito-OpenAI-response-resp_073176036282c3bf006a84db55dc1487d2b407f97b25fe2f6d.json`
  and `/Users/ivan/Downloads/Hito-Half-Marathon-Recovered-2026-08-18.json` are absent. No matching
  temporary file remains.

| Check                               | Scenario / environment                                                                                        | Result                              | Evidence                                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------- |
| Exact browser-log source            | Existing authenticated OpenAI Logs response                                                                   | Passed                              | Verified assistant JSON; 63 workouts plus endpoint                                           |
| Browser-to-system clipboard copy    | Authorized raw bridge                                                                                         | Passed                              | Browser clipboard write completed; raw content was not printed                               |
| Local Backend clipboard consumption | Single `pbpaste` invocation                                                                                   | Blocked                             | Exit code 1; no payload or OS diagnostic returned                                            |
| Clipboard cleanup                   | No retained raw content                                                                                       | Passed                              | Browser clipboard bridge wrote an empty value immediately after failure                      |
| Raw/import Downloads artifacts      | Atomic writes only                                                                                            | Passed as no-partial-write boundary | Both targets and matching temporary files are absent                                         |
| Training Plan v2 validation         | Existing non-mutating importer                                                                                | Not run                             | Local Backend process received no source payload                                             |
| State preservation                  | Calendar, sources, FIT/evidence, hosted data, fixtures, schema, migrations, runtime source/configuration, Git | Passed                              | No application, persistence, fixture, provider-setting, deployment, or Git mutation occurred |

- **Omitted-check consequence:** No raw recovery file or import-ready plan exists; import acceptance
  remains unproven.
- **Preserved boundaries:** No provider API request, POST, generation, retry, spend, or OpenAI
  account/setting change occurred. Raw content was not printed, written to the repository, or left
  in the clipboard. Existing unrelated checkout bytes were preserved; only this canonical receipt
  was updated.
- **Next owner:** PRODUCT for the demonstrated OS pasteboard boundary between the authorized browser
  session and the local Backend process. No Backend source defect or provider-data defect was
  established.

## OpenAI Browser Log Recovery Receipt — 2026-08-19

- **Preflight:** Reused the already-authenticated Chrome session, exact OpenAI Logs URL, existing
  provider draft shape, and current Training Plan v2 importer boundary. No repository mapper,
  importer, framework, compatibility path, or provider request was added.
- **Browser-log evidence:** The exact page title and URL matched response
  `resp_073176036282c3bf006a84db55dc1487d2b407f97b25fe2f6d`. Its expanded `assistant` response was
  valid JSON with top-level `workouts` and `endpoint`, containing 63 authored workouts plus the
  endpoint. Raw content was not printed or copied into the repository or receipt.
- **First blocker:** The browser process could read the response but could not create the authorized
  atomic temporary file under `/Users/ivan/Downloads/`; the operating-system result was `EPERM`.
  The supported TextEdit fallback was also unavailable because local Computer Use was not approved
  for TextEdit. No permission dialog was escalated and no unsupported filesystem bypass was used.
- **Stop boundary:** Because the required raw Downloads file could not be written first, the task
  did not proceed to Training Plan v2 mapping, importer validation, or import-file creation. The
  temporary clipboard and in-process raw payload were cleared.
- **Artifact state:** Both
  `/Users/ivan/Downloads/Hito-OpenAI-response-resp_073176036282c3bf006a84db55dc1487d2b407f97b25fe2f6d.json`
  and `/Users/ivan/Downloads/Hito-Half-Marathon-Recovered-2026-08-18.json` are absent. No matching
  atomic-write temporary file remains.

| Check                       | Scenario / environment                                                                                | Result  | Evidence                                                                                     |
| --------------------------- | ----------------------------------------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------- |
| Exact browser-log access    | Existing authenticated OpenAI Logs session                                                            | Passed  | Exact response URL/title; assistant JSON; 63 workouts plus endpoint                          |
| Provider/API boundary       | Browser log only                                                                                      | Passed  | No provider API request, POST, generation, retry, or spend                                   |
| Raw Downloads save          | Atomic user-owned file                                                                                | Blocked | Browser filesystem returned `EPERM`; TextEdit control unavailable                            |
| Training Plan v2 validation | Existing non-mutating importer                                                                        | Not run | Required raw recovery artifact could not be saved first                                      |
| Import Downloads save       | Validated artifact only                                                                               | Not run | Import mapping and validation did not begin                                                  |
| State preservation          | Calendar, sources, FIT/evidence, hosted data, fixtures, schema, migrations, source/configuration, Git | Passed  | No application, persistence, fixture, provider-setting, deployment, or Git mutation occurred |

- **Omitted-check consequence:** No import-ready JSON exists and import acceptance cannot be
  claimed. The browser log itself is recoverable, but this task context cannot materialize either
  authorized Downloads artifact.
- **Preserved boundaries:** OpenAI organization, project, account, API/log settings, and provider
  settings were unchanged. No raw content remains in the clipboard or task process memory. Existing
  unrelated checkout bytes were preserved; only this canonical receipt was updated.
- **Next owner:** PRODUCT for the demonstrated local Downloads-write capability boundary. No Backend
  source defect or provider-data defect was established.

## DNS-Bounded Final Retrieval Receipt — 2026-08-19

- **Preflight:** Reused the official Responses API hostname, existing provider draft schema,
  `validateImportedPlanJson`, and non-mutating `buildImportedPlanSeed`. Proposed repository or
  runtime artifacts: none. The only permitted output remained the validated user-owned JSON.
- **Final retrieval result:** One read-only `GET
/v1/responses/resp_073176036282c3bf006a84db55dc1487d2b407f97b25fe2f6d` was attempted with
  `curl --resolve api.openai.com:443:172.66.0.243`. The official hostname remained the TLS and HTTP
  target, and the override was ephemeral to that request. The command failed before an HTTP
  response with curl exit 7: `Failed to connect to api.openai.com port 443: Couldn't connect to
server`.
- **Stop boundary:** No retry, separate network diagnosis, POST, generation, paid model call,
  provider-setting change, DNS configuration edit, or `/etc/hosts` edit followed. No raw response
  body was received.
- **Artifact state:**
  `/Users/ivan/Downloads/Hito-Half-Marathon-Recovered-2026-08-18.json` is absent, and no matching
  atomic-write temporary file remains.

| Check                             | Scenario / environment                                                                                | Result                              | Evidence                                                                                    |
| --------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------- |
| Final existing-response retrieval | Official hostname with per-request resolver override                                                  | Blocked                             | curl exit 7 before HTTP response                                                            |
| Provider generation boundary      | Existing response only                                                                                | Passed                              | No POST, retry, generation, paid model call, or diagnostic request                          |
| Training Plan v2 validation       | Existing non-mutating importer                                                                        | Not run                             | No provider payload was received to map or validate                                         |
| Atomic Downloads write            | Validated artifact only                                                                               | Passed as no-partial-write boundary | Target and matching temporary file are absent                                               |
| State preservation                | Calendar, sources, FIT/evidence, hosted data, fixtures, schema, migrations, source/configuration, Git | Passed                              | No in-scope data, application, configuration, fixture, deployment, or Git mutation occurred |

- **Omitted-check consequence:** Import readiness remains unproven and no user-importable artifact
  exists. This dispatch's final retrieval authority is exhausted.
- **Preserved boundaries:** Raw provider content was neither received nor persisted. Existing
  unrelated checkout bytes were preserved; only this canonical receipt was updated.
- **Next owner:** PRODUCT for the demonstrated external connection boundary. No Backend source
  defect or repair was established by this attempt.

## Read-Only Retry Receipt — 2026-08-19

- **Preflight:** Reused the existing Responses API retrieval boundary, provider draft schema,
  `validateImportedPlanJson`, and non-mutating `buildImportedPlanSeed`. Proposed runtime artifacts:
  none. The only intended artifact was the explicitly authorized validated Downloads JSON.
- **Retrieval result:** The one authorized `GET
/v1/responses/resp_073176036282c3bf006a84db55dc1487d2b407f97b25fe2f6d` attempt failed before
  an HTTP response or response body was received. The transport discriminator was
  `getaddrinfo ENOTFOUND api.openai.com`.
- **Stop boundary:** No second GET, diagnostic provider request, POST, generation, model call, or
  provider-setting action was performed. With no response body in process memory, factual mapping
  and importer validation could not begin.
- **Artifact state:**
  `/Users/ivan/Downloads/Hito-Half-Marathon-Recovered-2026-08-18.json` is absent, and no matching
  atomic-write temporary file remains.

| Check                              | Scenario / environment                                                              | Result                              | Evidence                                                                        |
| ---------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------- |
| Single existing-response retrieval | Read-only Responses API GET                                                         | Blocked                             | Transport failed with `ENOTFOUND` before HTTP response                          |
| Provider generation boundary       | Existing response only                                                              | Passed                              | No POST, regeneration, paid model call, or diagnostic request                   |
| Training Plan v2 validation        | Existing non-mutating importer                                                      | Not run                             | No provider body was received to map or validate                                |
| Atomic Downloads write             | Validated artifact only                                                             | Passed as no-partial-write boundary | Target and matching temporary file are absent                                   |
| Persistence and repository safety  | Calendar, sources, FIT/evidence, hosted data, fixtures, schema, runtime source, Git | Passed                              | No persistence, source, configuration, fixture, or Git mutation command was run |

- **Omitted-check consequence:** Import readiness remains unproven and no user-importable artifact
  exists. A later retrieval requires a new explicit Product dispatch because this task's one retry
  was consumed.
- **Preserved boundaries:** Raw provider content was not received, printed, or persisted. Existing
  unrelated checkout bytes were preserved; only this canonical receipt was updated.
- **Next owner:** PRODUCT for the exact external reachability boundary. No Backend source repair is
  indicated by this retry.

## Implementation Receipt

- **Stage:** Read-only recovery admission and provider-response retrieval.
- **Preflight:** The existing OpenAI Responses retrieval seam and the current Training Plan v2
  parser/validator were inspected. No new runtime artifact, importer, compatibility path, model, or
  persistence authority was proposed. Existing unrelated checkout changes were left untouched.
- **Provider evidence:** A read-only `GET /v1/responses/{response_id}` initially returned HTTP 200
  for the exact response ID. The response was `completed`, contained one structured JSON output,
  and exposed 63 authored workouts plus the endpoint. No model generation, retry, or paid provider
  inference was invoked, and raw provider content was neither printed nor stored.
- **Blocker:** Before the in-memory content could be transformed and importer-validated, subsequent
  retrieval attempts lost provider reachability. Node returned
  `getaddrinfo ENOTFOUND api.openai.com`; a distinct `curl` reachability check returned
  `Could not resolve host: api.openai.com` with HTTP code `000`. Because the raw response was
  intentionally not persisted, there is no local source from which to complete a factual recovery.
- **Artifact state:**
  `/Users/ivan/Downloads/Hito-Half-Marathon-Recovered-2026-08-18.json` does not exist. No partial or
  unvalidated download was written.

| Check                       | Scenario / environment                           | Result                         | Evidence                                                   |
| --------------------------- | ------------------------------------------------ | ------------------------------ | ---------------------------------------------------------- |
| Existing-response retrieval | Read-only Responses API GET                      | Initially passed               | HTTP 200; exact ID; completed structured response          |
| No generation               | Provider boundary                                | Passed                         | No POST, retry, regeneration, or model invocation occurred |
| Training Plan v2 validation | Existing non-mutating importer                   | Blocked                        | Response content could not be reacquired after DNS loss    |
| Download integrity          | User-owned Downloads target                      | Passed as no-mutation boundary | Target file absent; no partial file written                |
| Persistence safety          | Calendar, source, FIT/evidence, fixtures, schema | Passed                         | No persistence or runtime mutation command was run         |

- **Omitted-check consequence:** Import readiness cannot be claimed until the same completed
  response is reachable again, transformed in memory, and accepted by `validateImportedPlanJson`
  before an atomic Downloads write.
- **Preserved boundaries:** No application source, configuration, schema, migration, fixture, Git
  state, hosted data, provider settings, Calendar data, or evidence data was changed. The canonical
  receipt is the only task-owned repository write.
- **Next owner:** BACKEND may resume the same bounded read-only retrieval when provider DNS is
  available. Ivan must still import the eventual validated JSON through the ordinary product UI.

## Handoff Prompt

```text
ROLE: BACKEND

Task: Hito Recover Failed Half Marathon Preview From User-Pasted JSON
Mode: Tracked
Canonical item: /Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-18-hito-recover-failed-half-marathon-preview-as-import-json.md
Evidence parent: /Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-18-hito-generated-plan-preview-preparation-failure.md

Read AGENTS.md, agents/backend.agent.md, skills/hito-backend-supabase-contract/SKILL.md, this item,
and only the user-pasted JSON attachment plus the current Training Plan v2 import parser/validator.
Do not read unrelated domains, OpenAI browser logs, provider routes, or the architecture phase.

Ivan supplied the exact already-created model output at
`/Users/ivan/.codex/attachments/a61d8583-1c1b-48f1-ba8a-1d7aee5245be/pasted-text.txt`. It is the
only admitted source; use no browser, provider, or network path. Copy its bytes unchanged and
atomically write them to
`/Users/ivan/Downloads/Hito-OpenAI-response-resp_073176036282c3bf006a84db55dc1487d2b407f97b25fe2f6d.json`,
without copying its content into the repository or receipt. Do not generate, retry, send a provider
API request, or spend funds.

After the raw local save, parse it in memory, map factual workout content to the existing Training
Plan v2 format, and validate it. Then atomically write the validated import file to
`/Users/ivan/Downloads/Hito-Half-Marathon-Recovered-2026-08-18.json`. Do not import it yourself.

Do not mutate Calendar workouts, source records, FIT/evidence, hosted data, local fixtures, schema,
migrations, runtime source, configuration, Git, deployment, or provider settings. Do not store raw
provider content in repository files or receipts. Do not add an importer, mapping framework,
compatibility route, or model. If the current importer rejects the factual content, retain only the
raw user-provided copy, do not write the import file, and record the exact invalid field.

Definition of Done: the exact raw pasted response is saved only to the named Downloads file; one
importer-validated JSON download exists; and no persistence state changed. Or record a precise
no-mutation blocker identifying why factual import recovery is impossible. Run the smallest existing
import validation and state check needed to prove this. Update this same item with an English
receipt. No Global QA, hosted, release, deployment, or code-change claim.
```

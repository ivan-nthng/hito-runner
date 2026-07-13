# Local Devtool Screen Capture Action

## Status

ready_for_frontend

## Owner

DESIGNER / Hito DS

## Last Updated

2026-07-12

## Type

frontend_spec

## Priority

high

## Source Of Truth

- Existing local inspector DS audit contract:
  `docs/tasks/frontend-specs/2026-07-09-local-inspector-ds-audit-tool-contract.md`
- Inline editable/read-only closeout:
  `docs/tasks/frontend-specs/2026-07-07-hito-inline-editable-text-pattern-contract.md`
- Admin capture/backlog plan, historical and future context only:
  `docs/plans/active/2026-05-25-admin-ui-capture-and-backlog-plan.md`
- Current implementation seams:
  `src/components/devtools/LocalUiInspector.tsx`
  `src/components/devtools/LocalUiTaskDraftPanel.tsx`
  `src/components/devtools/local-ui-inspector-targets.ts`
  `src/components/devtools/local-ui-clipboard.ts`

## Root Cause

Visible symptom:

- Screenshots pasted into Codex lose route, viewport, scroll, selected-region, and nearby DOM
  context, so the receiving agent has to guess where the issue lives.

Likely underlying cause:

- The current local inspector can generate element-based prompts and bug prompts, but it does not
  yet have a screen-region capture packet that binds image evidence to location metadata.

Canonical owner:

- FRONTEND/devtools owns local-only capture UI, screenshot attempt, metadata collection, clipboard
  behavior, and prompt generation.
- Hito DS owns the launcher/menu/panel visual language.
- Backend/Admin Capture does not own v1 because there is no persistence, upload, or Work Items save.

## Interaction Model

Launcher menu:

- The local floating `+` launcher remains the entry point.
- Menu actions are:
  - `Pencil`: element-level inspector and token/prompt drafting.
  - `Bug prompt`: current-screen text prompt without element or screenshot selection.
  - `Screen`: region screenshot capture with location metadata and user comment.
- Use existing `DropdownMenu`, `DropdownMenuItem`, `Icon`, and Hito button primitives.
- `Screen` uses a compact screen/crop icon if available; otherwise use the nearest existing Hito
  icon and add the correct icon to the shared icon registry in the same frontend slice.
- Do not create a second launcher or route-local capture menu.

Screen flow:

1. User opens local launcher.
2. User chooses `Screen`.
3. Launcher menu closes and a full-viewport transparent capture overlay starts.
4. Cursor changes to crosshair on pointer devices.
5. A small top or bottom helper says `Drag to capture a region. Esc cancels.`
6. User presses, drags, and releases to select a rectangle.
7. During drag, the selected rectangle is visible; outside area is dimmed quietly.
8. On release, if the region is valid, open the capture panel.
9. Capture panel shows screenshot preview, location metadata summary, comment field, `Generate
   Prompt`, `Retake`, and `Cancel`.
10. `Generate Prompt` builds the prompt packet and copies text to clipboard when possible.
11. If image clipboard is supported and safe, copy the image too; otherwise show attach/download
    fallback.

Selection states:

- `idle`: launcher visible, no overlay.
- `screen_menu_open`: launcher menu with `Pencil`, `Bug prompt`, `Screen`.
- `screen_selecting`: overlay active, no rectangle yet.
- `screen_dragging`: rectangle updates while pointer moves.
- `screen_invalid_selection`: too-small rectangle or cancelled drag, stays in selection mode with
  concise helper.
- `screen_capturing`: region selected, screenshot attempt in progress.
- `screen_capture_ready`: panel open with preview and metadata.
- `screen_capture_failed`: panel open with metadata and fallback copy, no preview image.
- `prompt_generated`: generated prompt visible and copy status shown.
- `copy_failed`: manual-copy textarea visible.

Keyboard and cancel:

- `Escape` cancels selection mode before a region is selected.
- `Escape` closes the capture panel after confirmation only if there is unsaved comment text.
- `Enter` in the panel activates `Generate Prompt` only when focus is on the primary button.
- `Tab` stays inside the capture panel while it is open.
- `Retake` returns to `screen_selecting` and clears the previous image, but preserves the comment
  only if the user has typed one.
- `Cancel` returns to `idle` and discards the capture packet.

Mobile and narrow screens:

- Exact `375px` must not overflow horizontally.
- Drag-select remains supported when practical.
- If touch region selection is too fragile on a device/browser, Frontend may provide a fallback:
  tap `Capture visible screen` plus optional resize handles after capture.
- The capture panel escalates to a full-height Hito sheet/dialog on narrow screens.
- Do not use cramped anchored popovers for the capture panel on mobile.

## Capture Panel Anatomy

Panel placement:

- Desktop/tablet: centered lightweight workflow panel or side-floating panel clamped to viewport.
- Mobile: full-height sheet/dialog with Hito header.
- The panel must not be a card soup; it is one compact workbench surface.

Panel sections:

1. Header
   - title: `Screen capture`;
   - short status: `Local only`;
   - close button.
2. Preview
   - selected screenshot region preview;
   - if capture failed, show a quiet empty preview state with fallback instructions.
3. Location summary
   - route/path;
   - viewport size;
   - selected rectangle size;
   - theme;
   - optional nearest DOM target label.
4. Comment
   - Hito textarea;
   - label: `What should change?`;
   - placeholder: `Describe the issue or desired UI change.`;
5. Actions
   - primary: `Generate Prompt`;
   - secondary: `Retake`;
   - ghost/destructive-light: `Cancel`;
   - post-generate: `Copied`, `Copy again`, `Download screenshot` if image exists.

Panel visual rules:

- Reuse Hito dialog/sheet, button, textarea, status pill, divider, caption, and technical text
  patterns.
- Screenshot preview uses one low-chrome preview frame, not nested bordered cards.
- Metadata is quiet and collapsible after the first two lines.
- Raw packet JSON is hidden behind a disclosure labelled `Packet details`.
- Do not show debug-looking payload by default.

Loading / empty / error / success states:

- Loading: `Capturing selected region...` with indeterminate local spinner/skeleton in preview.
- Empty: no valid region yet; stay in overlay selection mode rather than opening an empty panel.
- Error: screenshot capture failed; keep metadata and allow prompt generation with attach/download
  fallback instructions.
- Success/review: panel shows preview, comment, metadata, and generated prompt review after
  `Generate Prompt`.

## Capture Packet Schema

The generated packet is local-only and frontend-owned. It should be serializable and safe to paste
into a Codex prompt.

Recommended packet shape:

```ts
type LocalScreenCapturePacket = {
  kind: "hito_local_screen_capture_v1";
  createdAt: string;
  route: {
    href: string;
    origin: string;
    pathname: string;
    search: string;
    hash: string;
    title: string;
  };
  viewport: {
    width: number;
    height: number;
    devicePixelRatio: number;
    scrollX: number;
    scrollY: number;
    theme: "dark" | "light" | "system" | "unknown";
  };
  selection: {
    viewportRect: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    documentRect: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
  screenshot: {
    available: boolean;
    mimeType?: "image/png" | "image/jpeg";
    width?: number;
    height?: number;
    clipboardAttempted: boolean;
    downloadFilename?: string;
    failureReason?: string;
  };
  domContext?: {
    elementAtCenter?: {
      tag?: string;
      role?: string | null;
      selector?: string | null;
      classes?: string | null;
      hitoPattern?: string | null;
      visibleText?: string | null;
      nearestHeading?: string | null;
      componentId?: string | null;
    };
    elementsInRegion?: Array<{
      tag?: string;
      role?: string | null;
      selector?: string | null;
      visibleText?: string | null;
    }>;
  };
  userComment: string;
};
```

Required fields:

- route `href`, `pathname`, `title`;
- viewport width, height, device pixel ratio, scroll x/y, theme;
- selected rect in viewport coordinates;
- selected rect in document coordinates;
- screenshot availability and clipboard attempt status;
- user comment, even if empty.

Best-effort fields:

- DOM element at the rectangle center;
- nearest heading;
- Hito DS pattern marker or component id;
- visible text inside the selected region;
- selected-region image metadata.

Prompt text generated from the packet should include:

- `ROLE: FRONTEND` by default;
- task: fix or review the captured UI issue;
- route and page title;
- selected rectangle metadata;
- viewport and theme;
- best-effort DOM context;
- user comment;
- screenshot attachment instruction;
- local-only note;
- boundaries: no backend/Supabase/Admin persistence unless explicitly requested.

## Clipboard / Fallback Rules

Primary clipboard behavior:

- Text prompt is primary.
- `Generate Prompt` attempts to copy the generated text prompt to clipboard.
- Success state: `Prompt copied. Attach the screenshot if it was not copied automatically.`

Image clipboard behavior:

- Image clipboard is best-effort only.
- If the browser supports `ClipboardItem` image write and permissions allow it, copy the screenshot
  image as PNG after or alongside the text prompt.
- Do not block prompt generation if image copy fails.
- Do not imply the image was copied unless the write promise succeeds.

Fallback behavior:

- If text clipboard fails, show a selectable manual-copy textarea.
- If image clipboard fails but screenshot exists, offer `Download screenshot`.
- If screenshot generation fails, generate the prompt with metadata and add:
  `Screenshot capture failed. Please attach a manual screenshot of the selected region if needed.`
- If both screenshot and clipboard fail, keep the prompt visible and selectable.

Copy status language:

- `Prompt copied`
- `Prompt ready`
- `Image copied`
- `Image copy unavailable`
- `Download screenshot`
- `Select prompt manually`

Do not add upload, share, or auto-send actions in v1.

## Local-Only And Privacy Boundaries

Local-only boundaries:

- The `Screen` action appears only where the existing local devtool launcher is allowed.
- No production-visible UI.
- No backend persistence.
- No Supabase storage.
- No Admin Work Items creation.
- No screenshot upload.
- No auto-send to Codex.
- No live UI mutation.

Privacy copy:

- Short panel copy:
  `Local only. The screenshot is not uploaded by Hito. Review the image before pasting it into
  Codex.`
- If visible text is captured:
  `This prompt may include visible text from the selected area. Remove private data before sharing.`
- If download is offered:
  `Downloaded screenshots may contain local account or test data.`

Data minimization:

- Capture only the selected region, not the full page image, unless fallback requires manual
  screenshot.
- Include DOM context only as best-effort visible evidence.
- Truncate visible text snippets.
- Do not include cookies, localStorage, auth headers, Supabase tokens, request payloads, hidden
  inputs, or non-visible DOM text.
- Redact obvious secret-like strings in visible text before prompt generation when possible.

## Hito DS Reuse Requirements

Reuse:

- local launcher button and existing `DropdownMenu`;
- `hito-button` variants;
- Hito `Icon` primitive;
- Hito dialog/sheet header/body/footer anatomy;
- Hito textarea/input classes;
- `hito-status-pill` for `Local only` and copy states;
- Hito caption/helper/technical text roles;
- existing manual-copy textarea fallback pattern from `LocalUiTaskDraftPanel`;
- existing local inspector overlay highlight language where possible.

New DS-backed additions, only if no equivalent exists:

- `screen-capture-overlay` selection rectangle pattern;
- compact screenshot preview frame;
- capture packet metadata disclosure row.

These additions must stay under devtools/local-inspector ownership and should not become a
runner-facing product component.

## FRONTEND Implementation Handoff

```text
ROLE: FRONTEND

Task:
Implement the local-only Screen capture action for the Hito devtool launcher.

Stage:
FRONTEND implementation / local screenshot capture prompt packet.

Spec:
/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/frontend-specs/2026-07-12-local-devtool-screen-capture-action.md

Context:
The local devtool launcher currently supports element-based Pencil mode and current-screen Bug prompt. Product approved a third launcher action: Screen. Screen starts crosshair region selection, captures a selected area when possible, opens a capture panel with screenshot preview and comment field, and generates a Codex-ready prompt packet with route, viewport, scroll, selected rect, theme, best-effort DOM context, and user comment.

Root-cause requirement:
Fix the missing screenshot-context packet at the local devtool owner. Do not patch this as a generic screenshot button, do not add backend persistence, and do not create Admin Work Items.

Required reading:
1. `AGENTS.md`
2. `agents/frontend.agent.md`
3. `skills/hito-frontend-design-system/SKILL.md`
4. `docs/tasks/frontend-specs/2026-07-12-local-devtool-screen-capture-action.md`
5. `docs/tasks/frontend-specs/2026-07-09-local-inspector-ds-audit-tool-contract.md`
6. `src/components/devtools/LocalUiInspector.tsx`
7. `src/components/devtools/LocalUiTaskDraftPanel.tsx`
8. `src/components/devtools/local-ui-clipboard.ts`
9. `src/components/devtools/local-ui-inspector-targets.ts`
10. `src/components/ui/*`
11. `src/styles/*`

Scope:
1. Add `Screen` to the existing local launcher menu beside `Pencil` and `Bug prompt`.
2. Implement region-selection overlay:
   - crosshair cursor;
   - drag rectangle;
   - dimmed outside area;
   - Escape cancel;
   - invalid too-small selection state.
3. Build local capture packet:
   - route/title;
   - viewport and devicePixelRatio;
   - scroll position;
   - selected rect in viewport and document coordinates;
   - current Hito theme;
   - optional DOM element at selection center and visible text/heading context.
4. Attempt selected-region screenshot capture locally.
5. Open a Hito DS capture panel with:
   - screenshot preview or failure state;
   - location metadata summary;
   - comment textarea;
   - Generate Prompt;
   - Retake;
   - Cancel;
   - packet details disclosure.
6. Generate and copy text prompt as the primary output.
7. Attempt image clipboard only as best-effort; provide download/manual attach fallback.
8. Preserve local-only boundaries:
   - no backend;
   - no Supabase;
   - no Admin Work Items;
   - no screenshot upload;
   - no auto-send to Codex;
   - no production-visible UI;
   - no live UI mutation.

Validation:
- Run targeted ESLint for touched devtools files.
- Run `npm run build`.
- Run `node scripts/validate-build-output-integrity.mjs` if build output is touched.
- Run scoped `git diff --check`.
- Use built-in Codex Browser first.
- Verify desktop:
  - launcher shows `Pencil`, `Bug prompt`, `Screen`;
  - Screen starts crosshair mode;
  - drag selection shows rectangle and dimmed outside area;
  - valid selection opens panel with preview or honest fallback;
  - generated prompt includes route, viewport, scroll, DPR, theme, selected rect, DOM context, and comment;
  - text prompt copies or manual fallback appears;
  - image copy success is not claimed unless it succeeds.
- Verify exact `375px`:
  - no horizontal overflow;
  - panel escalates to mobile sheet/dialog;
  - cancel/retake/generate remain reachable.
- Verify production-like host absence remains unchanged.

Stop conditions:
- Stop if screenshot capture requires backend upload/persistence, Supabase storage, production-visible tooling, or Admin Work Items creation.
- Stop if browser permissions make screenshot capture unreliable; keep prompt packet generation with metadata and manual attach fallback.
- Stop if implementation would require a broad browser-devtools clone.
```

## QA Acceptance Criteria

QA should prove:

- local launcher menu contains exactly the expected v1 actions: `Pencil`, `Bug prompt`, `Screen`;
- `Screen` starts region-selection mode without firing underlying page clicks;
- hover/drag overlay does not mutate product UI;
- `Escape` cancels selection and panel states correctly;
- invalid tiny selection does not open a misleading panel;
- valid selection opens the capture panel;
- screenshot preview appears when local capture succeeds;
- screenshot failure state is honest and still allows prompt generation;
- packet includes route, title, viewport, scroll, devicePixelRatio, selected viewport rect, selected
  document rect, theme, and comment;
- optional DOM context is present when safe and absent without breaking prompt generation;
- generated prompt is copied to clipboard when allowed;
- manual-copy fallback appears when clipboard is blocked;
- image clipboard is best-effort and never falsely reported as copied;
- `Retake` returns to selection mode;
- `Cancel` returns to idle;
- exact `375px` has no horizontal overflow;
- production-like host still shows no local devtool launcher;
- no network request, Supabase write, Admin Work Items row, or screenshot upload happens.

## Blockers

None for a bounded FRONTEND implementation of local-only `Screen` prompt packets.

Potential implementation caveat:

- Browser-level screenshot APIs may not reliably capture arbitrary page pixels from app code. If
  region image capture is blocked or unreliable, v1 is still valid if metadata prompt generation
  works and the UI provides a clear manual screenshot/download/attach fallback.

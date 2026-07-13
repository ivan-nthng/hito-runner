# Hito DS Light Palette Semantic Tokens And Product-Wide Correction

## Status

ready_for_frontend_correction

## Owner

DESIGNER / Hito DS

## Last Updated

2026-07-11

## Source Of Truth

- Code-first Hito DS: `src/styles/foundations.css`, shared Hito DS classes, and `/hitoDS`.
- The implemented product-wide theme preference now uses `data-hito-theme="dark|light"` at the app
  root. This spec corrects the light visual direction before QA.
- Figma is not the source of truth for this slice.

## Root Cause

Visible symptom:

- Light mode technically applies, but it looks like a dimmed dark UI: muddy surfaces, dark sidebar
  residue, uneven text contrast, and unclear component hierarchy.

Likely underlying cause:

- The first product-wide light implementation reused dark-first surface logic too literally. The
  app has semantic tokens, but the light-mode mapping is not yet a complete light analog palette for
  every dark primitive role.

Canonical owner:

- Hito DS color tokens and theme usage recipes.

## Evidence Used

- `src/styles/foundations.css` current dark and light token mappings.
- `src/lib/theme-preference.ts`, `src/routes/__root.tsx`, and
  `src/components/settings/ThemePreferenceSection.tsx` product-wide theme preference wiring.
- Product-wide screenshots from
  `qa-artifacts/screenshots/2026-07-11/product-theme-preference-v1/`, especially:
  - `localhost-light-desktop-hitods-foundations.png`
  - `localhost-light-desktop-settings.png`
  - `localhost-light-desktop-login.png`
  - `localhost-light-desktop-admin-login.png`
  - `localhost-light-mobile-375-hitods-foundations.png`

## Current Theme Verdict

Not ready for QA.

The technical preference pipeline is ready for visual correction, but the visual system needs one
Frontend correction batch before QA can validate it as a product-quality theme.

## Product Direction

Hito light should be warm, cream/linen, editorial, and athletic. It should not become cold SaaS
white/gray, and it should not preserve dark-mode chrome in the sidebar by default.

The correct direction is:

- warm light page canvas;
- slightly lifted warm surfaces;
- dark ink text;
- taupe borders and muted copy;
- Hito orange preserved as signal;
- semantic statuses made darker on light surfaces;
- light sidebar/shell surfaces unless a future Product decision explicitly asks for a premium dark
  sidebar in light mode.

## Dark-Safe Correction Rule

Do not change the current dark theme token values in this batch.

Frontend should correct light mode by:

- adding or refining light analog primitives in the existing Hito token layer;
- updating only `[data-hito-theme="light"]` semantic mappings and light-only recipes;
- avoiding route-local color fixes unless a component uses a dark-only overlay/background recipe;
- proving dark screenshots remain visually unchanged.

## Light Primitive Analog Palette

Add light analog primitives beside the existing dark-first primitives. Names can be adjusted to fit
the existing token naming convention, but the role pairing must remain explicit.

| Dark role / primitive | Current role | Light analog | Suggested value | Semantic targets |
| --- | --- | --- | --- | --- |
| `stone-950` / `stone-900` | Deep app canvas / shell | `ink-950` for text, `linen-100` for canvas | `oklch(0.14 0.006 58)`, `oklch(0.972 0.010 78)` | `--foreground`, `--background` |
| `stone-850` | Base surface | `linen-50` | `oklch(0.988 0.006 82)` | `--surface`, `--card` |
| `stone-825` / `stone-800` | Elevated surface / popover | `warm-white` | `oklch(0.997 0.003 82)` | `--surface-elevated`, `--popover` |
| `stone-750` / `stone-700` | Soft control well / hover wash | `linen-180` / `linen-220` | `oklch(0.940 0.012 76)`, `oklch(0.912 0.014 74)` | `--secondary`, `--accent`, active washes |
| `sand-100` / `sand-50` | Primary text on dark | `ink-900` | `oklch(0.18 0.010 60)` | `--foreground`, neutral primary text |
| `sand-500` | Muted text on dark | `taupe-650` | `oklch(0.40 0.014 62)` | `--muted-foreground`, captions, metadata |
| `sand-alpha-06/08/10` | Hairlines / borders / input wells | `taupe-alpha-*` | `oklch(0.72 0.014 70 / 30%-52%)` | `--hairline`, `--border`, `--input` |
| `amber-500/600` | Hito signal | `orange-650` | `oklch(0.66 0.150 62)` | `--signal`, selected/focus/action states |
| `green-500` | Success | `green-700` | `oklch(0.44 0.125 150)` | `--success`, success text/markers |
| `orange-500` | Warning | `amber-750` | `oklch(0.50 0.140 55)` | `--warn`, warning text/markers |
| `red-500` | Error/destructive | `red-700` | `oklch(0.48 0.180 28)` | `--destructive`, error text/markers |
| `blue-500` | Info | `blue-700` | `oklch(0.46 0.095 205)` | `--info`, info text/markers |

## Corrected Light Semantic Token Table

| Token | Corrected light role | Guidance |
| --- | --- | --- |
| `--background` | Warm linen canvas | Keep warm and light; avoid gray overlays that make it look dim. |
| `--foreground` | Ink text | Must be dark enough for body, labels, icons, and sidebar labels. |
| `--surface` | Open standard surface | Use for grouped sections and card bodies; should not read as gray glass. |
| `--surface-elevated` | Dialog/sheet/popover layer | Slightly brighter than surface, not a dark frosted panel. |
| `--card` | Compatibility surface | Alias to `--surface` unless a component truly needs elevation. |
| `--popover` | Elevated light surface | Menus/date pickers/dropdowns use this; no dark popover residue. |
| `--primary` | Strong neutral action | Use ink fill only where neutral primary is intended. |
| `--primary-foreground` | Text on neutral primary | Use warm light text on ink fill. |
| `--secondary` | Soft control well | Borderless, warm, visibly lighter than selected/active signal states. |
| `--secondary-foreground` | Text on soft control | Dark enough for inactive tab/control labels. |
| `--muted` | Muted background recipe base | Use for disabled/quiet wells, not page-sized slabs. |
| `--muted-foreground` | Support text | Darker than the current muddy gray where used for small labels/captions. |
| `--accent` | Hover/selected wash | Use light warm/signal wash; do not create gray smudges. |
| `--border` | Real component edge | Taupe hairline; visible but sparse. |
| `--hairline` | Quiet divider | Lower alpha than border; not enough to create card soup. |
| `--input` | Field background | Warm input well with readable placeholder and focus ring. |
| `--ring` | Focus-visible source | Must be visible on canvas, surface, popover, and sidebar. |
| `--signal` | Hito orange | CTA fill, active marker, selected state; check contrast in text-only use. |
| `--signal-foreground` | Text/icon on signal fill | Prefer ink on orange unless contrast testing proves warm light text works. |
| `--success` / `--warn` / `--destructive` / `--info` | Semantic state text/marker | Use darker light-theme values plus low-alpha fills for chips. |
| `--sidebar` | Light admin/app shell surface | Should be warm light, not `stone-900`/dark residue. |
| `--sidebar-foreground` | Sidebar text/icons | Use ink/muted taupe; active item must be unmistakable. |
| `--sidebar-accent` | Selected/hover row wash | Use signal/linen mix; no dark translucent wash. |
| `--sidebar-border` | Sidebar divider | Taupe hairline; subtle but visible. |

## Component Usage Corrections

### Sidebar / Shell

- Light mode sidebar should become a warm light shell surface.
- Logo, primary nav labels, selected item, helper cards, runner/admin account rows, and nested labels
  must resolve from light sidebar tokens.
- Selected/current nav should use a clear signal dot or wash plus readable text, not only low-alpha
  gray.
- Do not keep the current dark sidebar in light mode unless Product explicitly approves that as a
  separate premium-sidebar direction.

### `/hitoDS/foundations`

- Foundations is the first proof surface.
- The page canvas is acceptable in spirit, but the sidebar and specimen cards need corrected light
  token usage.
- Brand/logo cards should feel like light surfaces, not partially transparent gray panels.
- Token examples should show the light analog palette and should make clear that dark theme remains
  unchanged.

### `/settings`

- Appearance controls should remain the same Hito choice-toggle pattern.
- The left shell/sidebar must stop reading like a dark overlay in light mode.
- The signed-out hero card should use `surface`/`surface-elevated` hierarchy and readable support
  copy, not muddy gray translucency.

### `/login` And `/admin/login`

- The photographic background can remain, but the light form panel needs a light elevated surface
  recipe.
- Reduce dark scrim intensity in light mode so the page does not look like dark mode with a light
  form pasted on top.
- Labels, tab text, helper copy, and input placeholders must be contrast-checked on the light panel.

### Home / Calendar

- Do not redesign calendar/workout surfaces in this correction.
- Only fix token inheritance if light mode creates unreadable text, dark residue, or muddy cards.
- Workout semantic colors should remain unchanged unless contrast fails in the corrected light
  surface stack.

## Typography And Contrast Corrections

- Keep the existing Hito type hierarchy. Do not redesign typography.
- Increase contrast for small labels, sidebar child items, mono/token text, captions, and muted copy
  where they currently look washed out.
- `hito-label-signal` and orange label text must be checked on light canvas; if too low contrast,
  make the light `--signal` darker or use stronger weight/foreground pairing.
- Selected nav/tab/control typography should differ by color/weight/state marker, not by inventing a
  new type style.
- Placeholder text must remain visually secondary but readable.

## Accessibility Requirements

- Body and form text on all light surfaces should target WCAG AA contrast for normal text.
- Large display headings can be editorial, but they must remain visibly crisp on warm canvas.
- Muted captions, disabled states, and helper text should be checked visually and with automated
  contrast tooling where practical.
- Focus-visible must be visible on:
  - page canvas;
  - card/surface;
  - input fields;
  - popovers/dialogs;
  - sidebar items;
  - choice toggles.
- Icons must inherit readable semantic text colors in nav, form, status, and action contexts.
- Success/warn/error/info chips should not rely on color only; keep label text and icon/marker
  structure.

## Acceptance Criteria

- Dark theme screenshots remain visually unchanged except for unavoidable text anti-aliasing.
- Light `/hitoDS/foundations` no longer has a dark/muddy sidebar and shows clear light surface
  hierarchy.
- Light `/settings` sidebar, helper cards, and Appearance controls feel like one coherent light
  theme.
- Light `/login` and `/admin/login` panels are readable and do not look like dark mode with a gray
  card pasted over it.
- Semantic tokens resolve through Hito DS variables, not route-local hardcoded colors.
- No new theme mode, backend persistence, Supabase/profile setting, or separate token system is
  introduced.
- Desktop and exact 375px screenshots are captured for `/hitoDS/foundations`, `/settings`,
  `/login`, `/admin/login`, and `/`.

## Stop Conditions

Frontend should stop and route back to Designer/Product if:

- preserving the current dark theme requires changing existing dark token values;
- a route needs a fundamentally different brand direction rather than light token correction;
- a light sidebar cannot be achieved without redesigning app shell IA;
- automated or visual contrast checks show Hito orange cannot support both filled CTA and text-only
  accent with the same token, requiring a new semantic split such as `--signal-text`.

## Exact Next Frontend Prompt

```text
ROLE: FRONTEND

Task:
Correct the product-wide Hito light theme visual direction before QA.

Stage:
FRONTEND implementation / product-wide light theme token and usage correction.

Context:
The technical theme preference v1 is implemented: `system | dark | light`, localStorage preference,
root `data-hito-theme="dark|light"`, and `/settings` Appearance controls. Designer review found the
current light theme is not ready for QA: it looks like a dimmed dark UI because light semantic tokens
and a few dark-only component recipes have not been corrected across the product.

Source of truth:
- `docs/tasks/frontend-specs/2026-07-09-hito-ds-light-palette-semantic-tokens.md`
- `src/styles/foundations.css`
- existing Hito DS primitives/classes and `/hitoDS`

Root-cause requirement:
Fix the light semantic token and component-usage owner. Do not patch individual screenshots with
route-local colors unless a component has a dark-only overlay/background recipe that must become
theme-aware.

Scope:
1. Preserve the current dark theme. Do not change existing dark token values or dark visual behavior
   except for unavoidable anti-aliasing.
2. Add/refine light analog primitives in the existing Hito token layer so each dark primitive role
   has an explicit light counterpart: canvas, surface, elevated surface, soft control well, text,
   muted text, border/hairline/input, signal, success, warn, destructive, and info.
3. Update `[data-hito-theme="light"]` semantic mappings for background, foreground, surface,
   surface-elevated, card, popover, primary, secondary, muted, accent, border, hairline, input, ring,
   signal, success, warn, destructive, info, and sidebar tokens.
4. Make the light sidebar/shell warm-light by default. Remove the current dark sidebar residue in
   light mode. Active/current nav must remain unmistakable but not loud.
5. Correct light-mode component recipes where tokens alone are not enough:
   - `/hitoDS/foundations` brand/token specimen cards;
   - `/settings` shell/sidebar, helper cards, and Appearance area;
   - `/login` and `/admin/login` form panels and image scrim/overlay intensity;
   - home/calendar only where token inheritance creates unreadable or muddy UI.
6. Reuse existing Hito DS primitives and classes. Do not introduce a new theme mode, backend/profile
   persistence, Supabase changes, separate token system, or route-local mini palettes.

Validation:
- `git diff --check`
- relevant lint/typecheck/build for changed source files
- capture desktop and exact 375px screenshots for light and dark:
  `/hitoDS/foundations`, `/settings`, `/login`, `/admin/login`, and `/`
- verify dark screenshots are visually unchanged
- verify light mode has no horizontal overflow and no dark/muddy sidebar residue
- verify visible focus states and readable contrast for body, muted copy, labels, nav, inputs,
  buttons, status chips, and icons

Stop conditions:
- Stop if a fix requires changing dark token values.
- Stop if a route needs a broader brand/layout decision rather than light token correction.
- Stop if Hito orange cannot satisfy filled CTA and text-accent contrast with one `--signal` token;
  report whether a new semantic split such as `--signal-text` is needed.

Report:
Use the standard FRONTEND report. Include root cause, reused Hito DS seams, exact token/component
owners changed, screenshots captured, dark-theme preservation evidence, validation results, and
blockers.
```

## Blockers

None for a Frontend correction batch. Final QA should wait until this correction is implemented.

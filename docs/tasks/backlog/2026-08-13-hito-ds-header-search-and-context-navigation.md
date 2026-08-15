# Hito DS Header Search And Context Navigation

- **Status:** `completed`
- **Owner:** DESIGN SYSTEM
- **Outcome:** The desktop sidebar no longer renders the query field or theme chooser. The existing sticky, theme-aware hito-workbench-topbar now renders a canonical current-location trail, an icon-only progressive Search action backed by the existing grouped navigation…
- **Sources:** [reference-page.tsx](../../../src/components/hito-ds/reference-page.tsx); [reference-navigation.tsx](../../../src/components/hito-ds/reference-navigation.tsx); [icon.tsx](../../../src/components/ui/icon.tsx)
- **Validation:** Mobile Header Search, Console/runtime health, Static checks passed as recorded in the terminal receipt; omitted layers remain outside this closeout.
- **Residual boundary:** Dark mobile theme/menu, final Search focus return, final console health, and the final deep-link cell remain unclaimed.

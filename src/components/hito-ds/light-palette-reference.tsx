import type { CSSProperties } from "react";

import { HitoValueTag } from "@/components/ui/value-tag";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";

type LightSemanticToken = {
  name: string;
  token: string;
  role: string;
};

type LightStatusToken = {
  label: string;
  token: string;
};

const LIGHT_SEMANTIC_TOKENS: readonly LightSemanticToken[] = [
  { name: "background", token: "--background", role: "page canvas" },
  { name: "surface", token: "--surface", role: "standard surface" },
  { name: "surface-elevated", token: "--surface-elevated", role: "card / sheet" },
  { name: "popover", token: "--popover", role: "floating layer" },
  { name: "foreground", token: "--foreground", role: "primary text" },
  { name: "muted-foreground", token: "--muted-foreground", role: "secondary text" },
  { name: "border", token: "--border", role: "component edge" },
  { name: "hairline", token: "--hairline", role: "quiet divider" },
  { name: "input", token: "--input", role: "field fill" },
  { name: "signal", token: "--signal", role: "Hito action" },
  { name: "ring", token: "--ring", role: "focus outline" },
  { name: "sidebar", token: "--sidebar", role: "light shell" },
  { name: "sidebar-foreground", token: "--sidebar-foreground", role: "shell text" },
  { name: "sidebar-accent", token: "--sidebar-accent", role: "nav hover / active" },
  { name: "sidebar-border", token: "--sidebar-border", role: "shell divider" },
];

const LIGHT_STATUS_TOKENS: readonly LightStatusToken[] = [
  { label: "Success", token: "--success" },
  { label: "Warn", token: "--warn" },
  { label: "Destructive", token: "--destructive" },
  { label: "Info", token: "--info" },
];

function swatchStyle(token: string): CSSProperties {
  return {
    background: `var(${token})`,
  };
}

function statusStyle(token: string): CSSProperties {
  return {
    borderColor: `color-mix(in oklch, var(${token}) 26%, transparent)`,
    background: `color-mix(in oklch, var(${token}) 10%, transparent)`,
    color: `var(${token})`,
  };
}

export function HitoDsLightPaletteReference() {
  return (
    <section
      id="light-palette"
      className="grid min-w-0 gap-4"
      aria-labelledby="light-palette-title"
    >
      <div className="hito-reference-note">
        <p className="hito-label">Reference theme</p>
        <h3 id="light-palette-title" className="hito-panel-title mt-2">
          Light semantic palette
        </h3>
        <p className="hito-body-small mt-2 max-w-3xl">
          Code-owned token reference for the light Hito semantic palette. Product theme preference
          uses this same wrapper at the app root; this specimen keeps the token roles inspectable.
        </p>
      </div>

      <div
        data-hito-theme="light"
        className="grid min-w-0 gap-5 rounded-2xl border border-border bg-background p-4 text-foreground shadow-soft sm:p-5"
      >
        <div className="flex min-w-0 flex-col gap-3 border-b border-hairline pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="hito-label hito-label-signal">Light reference</p>
            <h4 className="hito-panel-title mt-2">Semantic roles on a warm light canvas.</h4>
            <p className="hito-body-small mt-2 max-w-2xl">
              The wrapper below scopes the light palette to this specimen through
              <code className="hito-inline-code mx-1">data-hito-theme=&quot;light&quot;</code>.
              Existing Hito controls resolve through the same semantic roles used by the product
              Appearance setting.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="hito-status-pill" data-tone="signal">
              App theme ready
            </span>
            <span className="hito-status-pill" data-tone="muted">
              Same semantic roles
            </span>
          </div>
        </div>

        <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {LIGHT_SEMANTIC_TOKENS.map((token) => (
            <article
              key={token.name}
              className="grid min-w-0 gap-3 rounded-xl border border-hairline bg-surface p-3"
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="hito-label">{token.name}</p>
                  <p className="hito-caption mt-1 text-muted-foreground">{token.role}</p>
                </div>
                <span
                  className="h-9 w-12 shrink-0 rounded-lg border border-border"
                  style={swatchStyle(token.token)}
                  aria-hidden="true"
                />
              </div>
              <code className="hito-inline-code min-w-0 truncate">var({token.token})</code>
            </article>
          ))}
        </div>

        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <article className="hito-surface-flat grid min-w-0 gap-4 bg-surface p-4">
            <div className="min-w-0">
              <p className="hito-label">Component states</p>
              <p className="hito-body-small mt-1">
                Buttons, fields, tags, and status markers use existing Hito DS primitives.
              </p>
            </div>

            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <div className="grid min-w-0 content-start gap-3">
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="hito-button hito-button-primary hito-button-sm">
                    <Icon name="sparkles" size="xs" />
                    Signal
                  </button>
                  <button
                    type="button"
                    className="hito-button hito-button-secondary hito-button-sm"
                    data-demo-state="hover"
                  >
                    Hover
                  </button>
                  <button
                    type="button"
                    className="hito-button hito-button-ghost hito-button-sm"
                    data-demo-state="focus"
                  >
                    Focus
                  </button>
                </div>

                <div className="grid min-w-0 gap-2">
                  <label className="hito-label" htmlFor="hito-light-palette-input">
                    Input
                  </label>
                  <Input
                    id="hito-light-palette-input"
                    readOnly
                    value="Light semantic field"
                    className="hito-field-md"
                    data-demo-state="focus"
                  />
                </div>
              </div>

              <div className="grid min-w-0 content-start gap-3">
                <div className="flex flex-wrap gap-2">
                  <HitoValueTag>Current</HitoValueTag>
                  <HitoValueTag tone="current">Old</HitoValueTag>
                  <HitoValueTag tone="desired">New</HitoValueTag>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="hito-status-pill" data-tone="success">
                    Saved
                  </span>
                  <span className="hito-status-pill" data-tone="warning">
                    Review
                  </span>
                  <span className="hito-status-pill" data-tone="destructive">
                    Error
                  </span>
                </div>
                <div className="grid min-w-0 gap-2 rounded-xl border border-border bg-card p-3 text-card-foreground">
                  <div className="flex min-w-0 items-center justify-between gap-3">
                    <span className="hito-label">Selected day</span>
                    <span className="hito-status-marker" data-tone="signal">
                      <Icon name="check" size="xs" />
                    </span>
                  </div>
                  <p className="hito-body-small">
                    Calendar-like selected state with semantic signal, border, and card roles.
                  </p>
                </div>
              </div>
            </div>
          </article>

          <article className="grid min-w-0 gap-4 rounded-2xl border border-border bg-popover p-4 text-popover-foreground shadow-soft">
            <div className="flex min-w-0 items-start justify-between gap-4 border-b border-hairline pb-3">
              <div className="min-w-0">
                <p className="hito-label">Sheet / dialog surface</p>
                <h4 className="hito-panel-title mt-1">Elevated light layer.</h4>
              </div>
              <button type="button" className="hito-button hito-button-ghost hito-button-xs">
                Close
              </button>
            </div>
            <p className="hito-body-small">
              Elevated surfaces use popover/card roles while preserving readable foreground,
              hairline, focus, and muted text relationships.
            </p>
            <div className="grid gap-2">
              {LIGHT_STATUS_TOKENS.map((status) => (
                <div
                  key={status.label}
                  className="flex min-w-0 items-center justify-between gap-3 rounded-lg border px-3 py-2 text-xs font-medium"
                  style={statusStyle(status.token)}
                >
                  <span>{status.label}</span>
                  <code className="hito-inline-code bg-transparent">var({status.token})</code>
                </div>
              ))}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

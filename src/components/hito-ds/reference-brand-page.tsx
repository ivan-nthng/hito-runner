import type { ReactNode } from "react";

import loginDesertHorizon from "@/assets/marketing/hero-background/login-desert-horizon.jpg";
import { ReferenceListRow, SectionIntro } from "@/components/hito-ds/reference";
import { HitoLogo, HitoLogoMark } from "@/components/ui/hito-logo";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export function HitoDsBrandPage() {
  return (
    <>
      <section id="brand" className="ds-section">
        <SectionIntro label="Brand" title="The Hito wordmark and mark are primitives, not icons." />

        <div className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <LogoSpecimen label="Default">
              <HitoLogo decorative />
            </LogoSpecimen>
            <LogoSpecimen label="Compact">
              <HitoLogo decorative className="[--hito-logo-height:1.05rem]" />
            </LogoSpecimen>
            <LogoSpecimen label="Hero">
              <HitoLogo decorative className="[--hito-logo-height:3rem]" />
            </LogoSpecimen>
            <LogoSpecimen label="Short mark">
              <HitoLogoMark decorative className="[--hito-logo-height:2.4rem]" />
            </LogoSpecimen>
            <LogoSpecimen label="Compact mark">
              <HitoLogoMark decorative className="[--hito-logo-height:1.35rem]" />
            </LogoSpecimen>
            <LogoSpecimen
              label="Light background"
              labelTone="on-light"
              className="bg-[var(--sand-100)]"
            >
              <HitoLogo decorative className="[--hito-logo-height:1.7rem]" />
            </LogoSpecimen>
            <LogoSpecimen
              label="Dark background"
              labelTone="on-dark"
              className="bg-[var(--stone-950)]"
            >
              <HitoLogo decorative className="[--hito-logo-height:1.7rem]" />
            </LogoSpecimen>
            <LogoSpecimen label="Favicon surface">
              <img src="/favicon.svg" alt="" aria-hidden="true" className="size-16" />
            </LogoSpecimen>
          </div>

          <div className="hito-reference-list">
            <ReferenceListRow
              label="Use"
              title="Brand identity only"
              body="Use HitoLogo for linked shell brands, auth hero branding, and public brand moments. Use HitoLogoMark for compact brand marks and favicon artwork. Do not add either to the generic Icon registry."
            />
            <ReferenceListRow
              label="Color"
              title="Logo color comes from currentColor"
              body="Set tone on the parent or through className. Avoid hardcoded fills and do not add a decorative signal dot by default."
            />
            <ReferenceListRow
              label="Variants"
              title="Keep product labels separate"
              body="Admin, DS, and other product qualifiers should be rendered as adjacent text, not baked into the SVG."
            />
          </div>
        </div>
      </section>

      <section id="gradient-overlays" className="ds-section">
        <SectionIntro
          label="Gradient and overlay rules"
          title="Atmosphere is allowed only when it has a job."
        />

        <div id="atmosphere" className="grid gap-8">
          <div className="grid gap-5 xl:grid-cols-2">
            <article
              id="imagery"
              className="auth-hero min-h-[14rem] overflow-hidden rounded-2xl border border-hairline"
            >
              <img src={loginDesertHorizon} alt="" aria-hidden="true" className="auth-hero-image" />
              <div className="hito-auth-photo-overlay" aria-hidden="true" />
              <div className="auth-hero-content flex min-h-[14rem] items-end p-5">
                <div>
                  <p className="hito-label-md hito-label-signal">Auth/photo overlay</p>
                  <h3 className="hito-ui-title-xs mt-3">Readable copy over atmosphere.</h3>
                  <p className="hito-body-sm mt-3 max-w-sm text-secondary">
                    Use <code className="hito-inline-code">hito-auth-photo-overlay</code> only where
                    imagery needs a controlled readability layer.
                  </p>
                </div>
              </div>
            </article>

            <article className="hito-launch-surface">
              <span className="hito-launcher-card-icon" aria-hidden="true">
                <Icon name="sparkles" size="md" />
              </span>
              <div>
                <p className="hito-label-md hito-label-signal">Elevated launch surface</p>
                <h3 className="hito-ui-title-xs mt-3">Destination-scale entry cards.</h3>
                <p className="hito-body-sm mt-3 text-secondary">
                  Launcher cards can use alpha elevation and signal icon wash. Standard cards,
                  menus, and table cells should not inherit this treatment.
                </p>
              </div>
            </article>

            <article className="hito-ds-token-specimen-surface grid min-w-0 gap-4 p-5">
              <div className="min-w-0">
                <h3 className="hito-ui-title-xs">State-surface wash</h3>
                <p className="hito-body-sm text-secondary mt-3">
                  Use <code className="hito-inline-code">hito-surface-wash</code> when the whole
                  surface is communicating a state, not for ordinary content cards.
                </p>
              </div>
              <div className="hito-surface-wash min-w-0" data-tone="signal">
                <p className="hito-label-md hito-label-signal">Signal state</p>
                <p className="hito-ui-title-xs mt-3">Setup, empty, or bounded state.</p>
              </div>
            </article>

            <article className="hito-editorial-signal-wash hito-timeline-entry">
              <p className="hito-label-md hito-label-signal">Editorial signal wash</p>
              <h3 className="hito-ui-title-xs mt-3">Changelog-style emphasis without pills.</h3>
              <p className="hito-body-sm mt-3 text-secondary">
                Editorial signal wash is for release-history and prose emphasis, alongside text
                highlights such as{" "}
                <span className="hito-highlight-tag" data-tone="signal">
                  New
                </span>
                , not operational status.
              </p>
            </article>

            <article className="hito-auth-alpha-surface hito-surface-flat rounded-2xl border border-hairline p-5">
              <p className="hito-label-md">Alpha overlay surface</p>
              <h3 className="hito-ui-title-xs mt-3">Translucent only in atmospheric shells.</h3>
              <p className="hito-body-sm mt-3 text-secondary">
                Alpha overlays belong on auth/photo or launcher canvases. The quiet surface below is
                a separate functional chrome recipe, not an atmospheric overlay.
              </p>
            </article>

            <article
              className="hito-surface-quiet grid min-h-48 content-between gap-5 p-5"
              data-hito-ds-pattern="quiet-surface"
            >
              <div>
                <p className="hito-label-md">Quiet surface</p>
                <h3 className="hito-ui-title-xs mt-3">Low-chrome functional grouping.</h3>
              </div>
              <p className="hito-body-sm text-secondary">
                Token-derived translucent chrome without a visible border, gradient, or shadow.
                Interactive consumers keep the same visible focus contract.
              </p>
            </article>
          </div>

          <div className="hito-reference-list">
            <ReferenceListRow
              label="Allowed"
              title="Five atmospheric roles only"
              body="Canvas atmosphere, auth/photo overlay, elevated launch surface, state-surface wash, and editorial signal wash are the allowed gradient/overlay roles. Quiet surface is functional chrome, not a sixth atmospheric recipe."
            />
            <ReferenceListRow
              label="Not default"
              title="Do not gradient ordinary controls"
              body="Buttons, standard inputs, normal cards, menus, table cells, and shell navigation rows stay semantic and low-chrome unless a future DS slice proves a repeated need."
            />
            <ReferenceListRow
              label="Alpha"
              title="Use alpha for atmosphere, not data truth"
              body="Alpha overlays are for readability over imagery or editorial atmosphere. Product truth should still be expressed with text, markers, state surfaces, and explicit labels."
            />
          </div>
        </div>
      </section>
    </>
  );
}

function LogoSpecimen({
  label,
  labelTone = "default",
  className,
  children,
}: {
  label: string;
  labelTone?: "default" | "on-light" | "on-dark";
  className?: string;
  children: ReactNode;
}) {
  const sampleToneClass =
    labelTone === "on-light"
      ? "text-[var(--stone-950)]"
      : labelTone === "on-dark"
        ? "text-[var(--sand-100)]"
        : undefined;

  return (
    <article
      className={cn(
        "hito-ds-token-specimen-surface grid min-h-36 content-between gap-5 p-5",
        className,
      )}
    >
      <p className={cn("hito-label-md", sampleToneClass)}>{label}</p>
      <div className={cn("flex items-center", sampleToneClass)}>{children}</div>
    </article>
  );
}

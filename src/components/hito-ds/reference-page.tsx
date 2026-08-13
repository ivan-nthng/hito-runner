import { useEffect, useState } from "react";
import { HitoLogo, HitoLogoMark } from "@/components/ui/hito-logo";
import { HitoButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ThemePreferenceChoiceGroup } from "@/components/settings/theme-preference-controls";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { HitoDsBrandPage } from "./reference-brand-page";
import { HitoDsComponentsPage } from "./reference-components-page";
import { HitoDsFoundationsPage } from "./reference-foundations-page";
import { HitoDsNestedNav, HitoDsPagePager } from "./reference-navigation";
import { HitoDsOverviewPage } from "./reference-overview-page";
import { HitoDsPatternsPage } from "./reference-patterns-page";
import {
  getHitoDsPage,
  getHitoDsPageForSection,
  getSectionIdFromHash,
  type HitoDsPageId,
} from "./reference-model";

export function HitoDesignSystemReferencePage({ pageId }: { pageId: HitoDsPageId }) {
  const [mobileJumpOpen, setMobileJumpOpen] = useState(false);
  const [mobileSearchQuery, setMobileSearchQuery] = useState("");
  const currentPage = getHitoDsPage(pageId);
  const [activeHref, setActiveHref] = useState<string>(currentPage.path);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncActiveDestination = () => {
      const hashSection = getSectionIdFromHash(window.location.hash);
      const canonicalSection = hashSection === "shell" ? "app-shell" : hashSection;
      const targetPage = canonicalSection ? getHitoDsPageForSection(canonicalSection) : null;

      if (targetPage && (targetPage.id !== pageId || canonicalSection !== hashSection)) {
        window.location.replace(`${targetPage.path}#${canonicalSection}`);
        return;
      }

      setActiveHref(`${window.location.pathname}${window.location.hash}`);
    };

    syncActiveDestination();
    window.addEventListener("hashchange", syncActiveDestination);
    return () => window.removeEventListener("hashchange", syncActiveDestination);
  }, [pageId]);

  const closeMobileJump = () => {
    setMobileJumpOpen(false);
    setMobileSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-surface text-foreground">
      <div className="hito-workbench-shell">
        <aside className="hito-workbench-sidebar px-5 py-6">
          <div>
            <HitoLogo className="[--hito-logo-height:1.45rem]" />
            <p className="hito-shell-brand-kicker">Design System</p>
          </div>

          <HitoDsNestedNav idPrefix="desktop" activeHref={activeHref} />

          <div className="hito-workbench-sidebar-footer">
            <ThemePreferenceChoiceGroup label={null} />
          </div>
        </aside>

        <main className="hito-workbench-main">
          <div className="hito-workbench-topbar lg:hidden">
            <div className="grid gap-3 px-5 py-4">
              <div className="flex min-w-0 items-center justify-between gap-4">
                <div className="hito-workbench-location">
                  <span className="hito-workbench-location-title font-sans">Hito DS</span>
                  <span className="hito-workbench-location-meta">
                    <span>Reference library</span>
                    <span aria-hidden="true">/</span>
                    <span>{currentPage.label}</span>
                  </span>
                </div>
                <HitoLogoMark decorative className="text-foreground [--hito-logo-height:1.65rem]" />
              </div>
              <ThemePreferenceChoiceGroup label={null} />
              <Sheet
                open={mobileJumpOpen}
                onOpenChange={(open) => {
                  setMobileJumpOpen(open);
                  if (!open) {
                    setMobileSearchQuery("");
                  }
                }}
              >
                <SheetTrigger asChild>
                  <HitoButton
                    size="sm"
                    variant="secondary"
                    className="hito-ds-jump-trigger"
                    aria-controls="hito-ds-mobile-jump-nav"
                  >
                    <span>Browse DS pages</span>
                    <span className="hito-ds-jump-trigger-context">{currentPage.label}</span>
                    <Icon name="chevron-right" size="xs" decorative />
                  </HitoButton>
                </SheetTrigger>
                <SheetContent
                  side="bottom"
                  className="inset-0 flex h-[100dvh] max-h-[100dvh] w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none border-0 p-0 sm:max-w-none"
                  onEscapeKeyDown={(event) => {
                    if (mobileSearchQuery) {
                      event.preventDefault();
                    }
                  }}
                >
                  <SheetHeader className="border-b border-hairline px-5 py-4 pr-14">
                    <SheetTitle>Browse DS pages</SheetTitle>
                    <SheetDescription>Find a page or component.</SheetDescription>
                  </SheetHeader>
                  <div id="hito-ds-mobile-jump-nav" className="hito-ds-mobile-jump-nav">
                    <HitoDsNestedNav
                      idPrefix="mobile"
                      activeHref={activeHref}
                      onNavigate={closeMobileJump}
                      onQueryChange={setMobileSearchQuery}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10 lg:py-10">
            {pageId !== "overview" ? (
              <header className="hito-page-header pt-8">
                <p className="hito-label-md hito-label-signal">Hito design system</p>
                <h1 className="hito-ui-title-xl">{currentPage.label}.</h1>
              </header>
            ) : null}

            {pageId === "overview" ? <HitoDsOverviewPage /> : null}
            {pageId === "foundations" ? <HitoDsFoundationsPage /> : null}
            {pageId === "components" ? <HitoDsComponentsPage /> : null}
            {pageId === "patterns" ? <HitoDsPatternsPage /> : null}
            {pageId === "brand" ? <HitoDsBrandPage /> : null}

            <HitoDsPagePager currentPageId={pageId} />
          </div>
        </main>
      </div>
    </div>
  );
}

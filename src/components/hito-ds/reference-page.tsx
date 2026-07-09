import { useEffect, useState } from "react";
import { HitoLogoMark } from "@/components/ui/hito-logo";
import { Icon } from "@/components/ui/icon";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
  const currentPage = getHitoDsPage(pageId);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const hashSection = getSectionIdFromHash(window.location.hash);
    const targetPage = hashSection ? getHitoDsPageForSection(hashSection) : null;

    if (targetPage && targetPage.id !== pageId) {
      window.location.replace(`${targetPage.path}#${hashSection}`);
    }
  }, [pageId]);

  const closeMobileJump = () => {
    setMobileJumpOpen(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground hito-canvas-atmosphere">
      <div className="hito-workbench-shell">
        <aside className="hito-workbench-sidebar px-5 py-6">
          <div>
            <div className="hito-panel-title">hito ds</div>
            <p className="hito-label mt-2">Component system</p>
          </div>

          <HitoDsNestedNav idPrefix="desktop" activePageId={pageId} />

          <div className="mt-10 border-t border-hairline pt-5">
            <p className="hito-label hito-label-signal">Rule</p>
            <p className="hito-list-row-copy">
              This page follows the live product: open rhythm first, cards only when they earn it.
            </p>
          </div>
        </aside>

        <main className="hito-workbench-main">
          <div className="hito-workbench-topbar lg:hidden">
            <div className="grid gap-3 px-5 py-4">
              <div className="flex min-w-0 items-center justify-between gap-4">
                <div className="hito-workbench-location">
                  <span className="hito-workbench-location-title">Hito DS</span>
                  <span className="hito-workbench-location-meta">
                    <span>Reference library</span>
                    <span aria-hidden="true">/</span>
                    <span>{currentPage.label}</span>
                  </span>
                </div>
                <HitoLogoMark decorative className="text-foreground [--hito-logo-height:1.65rem]" />
              </div>
              <Sheet open={mobileJumpOpen} onOpenChange={setMobileJumpOpen}>
                <SheetTrigger asChild>
                  <button
                    type="button"
                    className="hito-button hito-button-secondary hito-button-sm hito-ds-jump-trigger"
                    aria-controls="hito-ds-mobile-jump-nav"
                  >
                    <span>Browse DS pages</span>
                    <span className="hito-ds-jump-trigger-context">{currentPage.label}</span>
                    <Icon name="chevron-right" size="xs" decorative />
                  </button>
                </SheetTrigger>
                <SheetContent
                  side="bottom"
                  className="inset-0 flex h-[100dvh] max-h-[100dvh] w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none border-0 p-0 sm:max-w-none"
                >
                  <SheetHeader className="border-b border-hairline px-5 py-4 pr-14">
                    <SheetTitle>Browse DS pages</SheetTitle>
                    <SheetDescription>
                      Jump to a Hito DS reference page or section.
                    </SheetDescription>
                  </SheetHeader>
                  <div id="hito-ds-mobile-jump-nav" className="hito-ds-mobile-jump-nav">
                    <HitoDsNestedNav
                      idPrefix="mobile"
                      activePageId={pageId}
                      onNavigate={closeMobileJump}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10 lg:py-10">
            {pageId !== "overview" ? (
              <header className="hito-page-header border-t border-hairline pt-8">
                <p className="hito-label hito-label-signal">Hito design system</p>
                <h1 className="hito-page-title">{currentPage.label}.</h1>
                <p className="hito-page-copy max-w-2xl">{currentPage.body}</p>
              </header>
            ) : null}

            {pageId === "overview" ? <HitoDsOverviewPage /> : null}
            {pageId === "foundations" ? <HitoDsFoundationsPage /> : null}
            {pageId === "components" ? <HitoDsComponentsPage /> : null}
            {pageId === "patterns" ? <HitoDsPatternsPage /> : null}

            <HitoDsPagePager currentPageId={pageId} />
          </div>
        </main>
      </div>
    </div>
  );
}

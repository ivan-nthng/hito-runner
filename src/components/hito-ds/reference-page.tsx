import { useEffect, useRef, useState } from "react";
import { HitoLogo } from "@/components/ui/hito-logo";
import { HitoButton } from "@/components/ui/button";
import { HitoLanguageMenuItems } from "@/components/ui/hito-language-menu";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { ThemePreferenceMenuItems } from "@/components/settings/theme-preference-controls";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { UiLocalePreference } from "@/lib/ui-locale";
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
  const [query, setQuery] = useState("");
  const [desktopSearchOpen, setDesktopSearchOpen] = useState(false);
  const [languagePreference, setLanguagePreference] = useState<UiLocalePreference | null>(null);
  const desktopSearchInputRef = useRef<HTMLInputElement>(null);
  const desktopSearchTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileSheetReturnFocusRef = useRef<HTMLButtonElement | null>(null);
  const currentPage = getHitoDsPage(pageId);
  const [activeHref, setActiveHref] = useState<string>(currentPage.path);
  const desktopSearchVisible = desktopSearchOpen || Boolean(query);
  const resolvedLocale = languagePreference === "pt-BR" ? "pt-BR" : "en";

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

  useEffect(() => {
    if (desktopSearchOpen) {
      desktopSearchInputRef.current?.focus();
    }
  }, [desktopSearchOpen]);

  const closeDesktopSearch = () => {
    setDesktopSearchOpen(false);
    window.setTimeout(() => desktopSearchTriggerRef.current?.focus(), 0);
  };

  const closeMobileJump = () => {
    setMobileJumpOpen(false);
    setQuery("");
  };

  return (
    <div className="min-h-screen bg-surface text-foreground">
      <div className="hito-workbench-shell">
        <aside className="hito-workbench-sidebar px-5 py-6">
          <div>
            <HitoLogo className="[--hito-logo-height:1.45rem]" />
            <p className="hito-shell-brand-kicker">Design System</p>
          </div>

          <HitoDsNestedNav
            idPrefix="desktop"
            activeHref={activeHref}
            query={query}
            onQueryChange={setQuery}
            showSearch={false}
          />
        </aside>

        <main className="hito-workbench-main">
          <div className="hito-workbench-topbar">
            <Sheet
              open={mobileJumpOpen}
              onOpenChange={(open) => {
                setMobileJumpOpen(open);
                if (!open) {
                  setQuery("");
                }
              }}
            >
              <div className="mx-auto flex max-w-6xl min-w-0 items-center justify-between gap-4 px-5 py-2 lg:px-10">
                <span className="hito-workbench-location-title shrink-0 font-sans">Hito DS</span>
                <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
                  <div className="lg:hidden">
                    <HitoButton
                      ref={mobileSearchTriggerRef}
                      size="sm"
                      variant="secondary"
                      iconOnly
                      aria-label="Search Hito DS"
                      aria-controls="hito-ds-mobile-jump-nav"
                      aria-expanded={mobileJumpOpen}
                      onClick={(event) => {
                        mobileSheetReturnFocusRef.current = event.currentTarget;
                        setMobileJumpOpen(true);
                      }}
                    >
                      <Icon name="search" size="sm" decorative />
                    </HitoButton>
                  </div>

                  <div className="hidden min-w-0 items-center justify-end lg:flex">
                    {desktopSearchVisible ? (
                      <div
                        id="hito-ds-desktop-search"
                        className="hito-field-control w-full max-w-xs motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-2 motion-reduce:animate-none"
                        onBlur={(event) => {
                          if (!event.currentTarget.contains(event.relatedTarget) && !query) {
                            setDesktopSearchOpen(false);
                          }
                        }}
                      >
                        <span
                          className="hito-field-icon hito-field-icon-left text-muted-foreground"
                          data-size="sm"
                          aria-hidden="true"
                        >
                          <Icon name="search" size="xs" decorative />
                        </span>
                        <Input
                          ref={desktopSearchInputRef}
                          type="search"
                          value={query}
                          aria-label="Find in Hito DS"
                          placeholder="Find a component"
                          className="hito-field-has-left-icon hito-field-has-right-icon"
                          onChange={(event) => setQuery(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key !== "Escape") {
                              return;
                            }

                            event.preventDefault();
                            if (query) {
                              setQuery("");
                              return;
                            }

                            closeDesktopSearch();
                          }}
                        />
                        <HitoButton
                          size="xs"
                          variant="ghost"
                          iconOnly
                          aria-label={query ? "Clear Hito DS search" : "Close Hito DS search"}
                          className="absolute right-1 top-1/2 -translate-y-1/2"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            if (query) {
                              setQuery("");
                              desktopSearchInputRef.current?.focus();
                              return;
                            }

                            closeDesktopSearch();
                          }}
                        >
                          <Icon name="close" size="xs" decorative />
                        </HitoButton>
                      </div>
                    ) : (
                      <HitoButton
                        ref={desktopSearchTriggerRef}
                        size="sm"
                        variant="secondary"
                        iconOnly
                        aria-label="Search Hito DS"
                        aria-controls="hito-ds-desktop-search"
                        aria-expanded={desktopSearchVisible}
                        onClick={() => {
                          setDesktopSearchOpen(true);
                          desktopSearchInputRef.current?.focus();
                        }}
                      >
                        <Icon name="search" size="sm" decorative />
                      </HitoButton>
                    )}
                  </div>

                  <HitoButton
                    size="sm"
                    variant="secondary"
                    iconOnly
                    aria-label="Browse Hito DS pages"
                    aria-controls="hito-ds-mobile-jump-nav"
                    aria-expanded={mobileJumpOpen}
                    className="lg:hidden"
                    onClick={(event) => {
                      mobileSheetReturnFocusRef.current = event.currentTarget;
                      setMobileJumpOpen(true);
                    }}
                  >
                    <Icon name="components" size="sm" decorative />
                  </HitoButton>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <HitoButton size="sm" variant="secondary" iconOnly aria-label="Preferences">
                        <Icon name="settings" size="sm" decorative />
                      </HitoButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="hito-shell-menu hito-menu-width-standard"
                    >
                      <ThemePreferenceMenuItems
                        itemClassName="hito-shell-theme-menu-item"
                        labelClassName="hito-shell-profile-menu-label"
                      />
                      <DropdownMenuSeparator className="hito-shell-menu-separator" />
                      <HitoLanguageMenuItems
                        preference={languagePreference}
                        resolvedLocale={resolvedLocale}
                        onPreferenceChange={setLanguagePreference}
                      />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <SheetContent
                  side="bottom"
                  className="inset-0 flex h-[100dvh] max-h-[100dvh] w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none border-0 p-0 sm:max-w-none"
                  onOpenAutoFocus={(event) => {
                    if (mobileSheetReturnFocusRef.current === mobileSearchTriggerRef.current) {
                      event.preventDefault();
                      mobileSearchInputRef.current?.focus();
                    }
                  }}
                  onCloseAutoFocus={(event) => {
                    event.preventDefault();
                    const returnFocusTarget = mobileSheetReturnFocusRef.current;
                    mobileSheetReturnFocusRef.current = null;
                    window.setTimeout(() => returnFocusTarget?.focus(), 0);
                  }}
                  onEscapeKeyDown={(event) => {
                    if (query) {
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
                      query={query}
                      onNavigate={closeMobileJump}
                      onQueryChange={setQuery}
                      searchInputRef={mobileSearchInputRef}
                    />
                  </div>
                </SheetContent>
              </div>
            </Sheet>
          </div>

          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
            {pageId !== "overview" ? (
              <header className="hito-page-header sm:pt-8">
                <h1 className="hito-ui-title-xl break-words">{currentPage.label}.</h1>
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

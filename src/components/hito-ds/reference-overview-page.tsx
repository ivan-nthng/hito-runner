import { type ReactNode, useState } from "react";

import { DataTableSpecimenPreview, SelectionControlPreview } from "./specimen-previews";
import { ProductLinks, ReferenceListRow, SectionIntro } from "./reference";
import { HitoButton } from "@/components/ui/button";
import { HitoDateField } from "@/components/ui/hito-date-time-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HitoLogoMark } from "@/components/ui/hito-logo";
import { HitoMetadataTag } from "@/components/ui/metadata-tag";
import { hitoToast } from "@/components/ui/hito-toast";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { HitoSlider } from "@/components/ui/hito-slider";
import { useHitoTabs } from "@/components/ui/hito-tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const OVERVIEW_TABS = ["Week", "Month"] as const;
type OverviewTab = (typeof OVERVIEW_TABS)[number];

export function HitoDsOverviewPage() {
  const [actionState, setActionState] = useState("Today");
  const [dateValue, setDateValue] = useState("2026-08-10");
  const [selectionValue, setSelectionValue] = useState(true);
  const [sliderValue, setSliderValue] = useState(6);
  const [activeTab, setActiveTab] = useState<OverviewTab>("Week");
  const overviewTabs = useHitoTabs({
    idPrefix: "hito-ds-overview-tabs",
    items: OVERVIEW_TABS.map((value) => ({ value })),
    value: activeTab,
  });

  return (
    <>
      <header id="overview" className="hito-page-header pt-8">
        <p className="hito-label-md hito-label-signal">Hito design system</p>
        <h1 className="hito-ui-title-xl">Live product building blocks.</h1>
        <p className="hito-body-md mt-4 text-secondary max-w-2xl">
          Explore the canonical controls and compositions used to build Hito, grouped by the job
          they do and linked to their complete interactive reference.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <HitoMetadataTag tone="warning">Figma URL awaiting approval</HitoMetadataTag>
          <span className="hito-body-xs text-tertiary">
            The external Hito Running Library link appears here only after its exact URL is
            confirmed.
          </span>
        </div>
      </header>

      <div id="showroom" className="grid gap-12 pt-10">
        <ShowcaseGroup title="Action">
          <ShowcaseCard title="Button & grouped actions" href="/hitoDS/components#buttons">
            <div className="grid content-center justify-self-center self-center gap-3">
              <div className="flex min-w-0 flex-col items-center gap-2 sm:flex-row sm:justify-center">
                <HitoButton
                  size="sm"
                  variant="secondary"
                  onClick={() => setActionState("Previous")}
                >
                  Previous
                </HitoButton>
                <HitoButton size="sm" variant="outlined" onClick={() => setActionState("Today")}>
                  Today
                </HitoButton>
                <HitoButton size="sm" variant="primary" onClick={() => setActionState("Next")}>
                  Next
                </HitoButton>
              </div>
              <p className="hito-body-xs text-tertiary text-center" role="status">
                Selected action: {actionState}
              </p>
            </div>
          </ShowcaseCard>
          <ShowcaseCard title="Dropdown / Menu" href="/hitoDS/components#dropdowns">
            <div className="flex items-center justify-center justify-self-center self-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <HitoButton size="sm" variant="secondary">
                    Workout actions
                    <Icon name="chevron-down" size="xs" decorative />
                  </HitoButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem>Open workout</DropdownMenuItem>
                  <DropdownMenuItem>Copy workout</DropdownMenuItem>
                  <DropdownMenuItem>Move workout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </ShowcaseCard>
        </ShowcaseGroup>

        <ShowcaseGroup title="Data Input">
          <ShowcaseCard title="Field & Date-Time" href="/hitoDS/components#inputs">
            <div className="grid w-full max-w-sm justify-self-center self-center gap-4">
              <Input
                type="search"
                variant="primary"
                size="sm"
                aria-label="Search plans"
                placeholder="Search plans"
              />
              <HitoDateField
                id="hito-ds-overview-date"
                label="Target date"
                value={dateValue}
                onChange={setDateValue}
              />
            </div>
          </ShowcaseCard>
          <ShowcaseCard
            title="Selection Controls & Slider"
            href="/hitoDS/components#selection-controls"
          >
            <div className="grid w-full self-center gap-5">
              <div className="justify-self-center">
                <SelectionControlPreview
                  kind="toggle"
                  size="sm"
                  selected={selectionValue}
                  onSelectedChange={setSelectionValue}
                  disabled={false}
                  invalid={false}
                  focusDemo={false}
                  cardMode={false}
                />
              </div>
              <HitoSlider
                id="hito-ds-overview-slider"
                label="Effort"
                min={1}
                max={10}
                value={sliderValue}
                previousValue={4}
                valueLabel={`${sliderValue}/10`}
                ariaValueText={`Effort ${sliderValue} out of 10`}
                onValueChange={setSliderValue}
              />
            </div>
          </ShowcaseCard>
        </ShowcaseGroup>

        <ShowcaseGroup title="Feedback & Status">
          <ShowcaseCard title="Banner / Notice Surface" href="/hitoDS/patterns#notice-surface">
            <div
              className="hito-state-surface w-full max-w-md justify-self-center self-center py-3"
              data-tone="signal"
              role="status"
            >
              <p className="hito-list-row-title">Plan ready to review</p>
              <p className="hito-list-row-copy">
                Route-level guidance stays visible until its state changes.
              </p>
            </div>
          </ShowcaseCard>
          <ShowcaseCard title="Status & Async Toast" href="/hitoDS/components#async-actions">
            <div className="flex min-w-0 flex-wrap items-center justify-center justify-self-center self-center gap-3">
              <HitoMetadataTag tone="success">Reviewed</HitoMetadataTag>
              <HitoButton
                size="sm"
                variant="secondary"
                onClick={() =>
                  hitoToast.info({
                    title: "Reference toast",
                    description: "Shared feedback remains concise and bounded.",
                  })
                }
              >
                Show toast
              </HitoButton>
            </div>
          </ShowcaseCard>
        </ShowcaseGroup>

        <ShowcaseGroup title="Layout">
          <ShowcaseCard title="App Shell" href="/hitoDS/patterns#app-shell">
            <div className="grid w-full min-w-0 self-center grid-cols-[5.5rem_minmax(0,1fr)] overflow-hidden rounded-xl border border-hairline">
              <div className="grid content-start gap-3 border-r border-hairline bg-sidebar p-3 text-sidebar-foreground">
                <HitoLogoMark decorative className="[--hito-logo-height:1.2rem]" />
                <span className="hito-body-xs text-tertiary text-sidebar-foreground">Calendar</span>
                <span className="hito-body-xs text-tertiary text-sidebar-foreground/60">
                  Progress
                </span>
              </div>
              <div className="grid min-w-0 gap-3 p-4">
                <p className="hito-label-sm text-tertiary">Route content</p>
                <p className="hito-list-row-title">Training week</p>
                <div className="h-12 rounded-lg bg-foreground/5" aria-hidden="true" />
              </div>
            </div>
          </ShowcaseCard>
          <ShowcaseCard title="Surface & Row" href="/hitoDS/components#rows">
            <div className="hito-row-group w-full self-center">
              <div className="hito-list-row">
                <div>
                  <p className="hito-list-row-title">Workout summary</p>
                  <p className="hito-list-row-copy">One title and one calm helper.</p>
                </div>
                <span className="hito-body-xs text-tertiary">Planned</span>
              </div>
            </div>
          </ShowcaseCard>
        </ShowcaseGroup>

        <ShowcaseGroup title="Navigation">
          <ShowcaseCard title="Tabs" href="/hitoDS/components#tabs">
            <div className="w-full self-center">
              <div className="hito-tabs hito-tabs-simple" {...overviewTabs.tabListProps}>
                {OVERVIEW_TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    {...overviewTabs.getTabProps(tab)}
                    className="hito-tab"
                    data-active={activeTab === tab ? "true" : undefined}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div
                {...overviewTabs.getPanelProps(activeTab)}
                className="hito-body-xs text-tertiary mt-4"
              >
                {activeTab} view selected.
              </div>
            </div>
          </ShowcaseCard>
          <ShowcaseCard title="Shell Navigation" href="/hitoDS/patterns#app-shell">
            <div className="hito-shell-nav w-full max-w-xs justify-self-center self-center">
              <div className="hito-shell-nav-row" data-active="true">
                <Icon name="calendar" className="hito-shell-nav-icon" />
                <span>Calendar</span>
                <span className="hito-shell-nav-dot" />
              </div>
              <div className="hito-shell-nav-row">
                <Icon name="progress" className="hito-shell-nav-icon" />
                <span>Progress</span>
              </div>
            </div>
          </ShowcaseCard>
        </ShowcaseGroup>

        <ShowcaseGroup title="Overlay">
          <ShowcaseCard title="Dialog / Sheet" href="/hitoDS/components#modals">
            <div className="flex min-w-0 flex-wrap items-center justify-center justify-self-center self-center gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <HitoButton size="sm" variant="primary">
                    Open dialog
                  </HitoButton>
                </DialogTrigger>
                <DialogContent className="hito-product-dialog hito-product-dialog-content-fit hito-dialog-size-compact">
                  <DialogHeader>
                    <DialogTitle>Reference dialog</DialogTitle>
                    <DialogDescription>
                      Focus, Escape, and restoration use the canonical overlay owner.
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
              <Sheet>
                <SheetTrigger asChild>
                  <HitoButton size="sm" variant="secondary">
                    Open Sheet
                  </HitoButton>
                </SheetTrigger>
                <SheetContent side="right">
                  <SheetHeader>
                    <SheetTitle>Reference Sheet</SheetTitle>
                    <SheetDescription>
                      Directional tasks reuse the shared Sheet focus and scroll owner.
                    </SheetDescription>
                  </SheetHeader>
                </SheetContent>
              </Sheet>
            </div>
          </ShowcaseCard>
          <ShowcaseCard title="Tooltip" href="/hitoDS/patterns#tooltip">
            <div className="flex items-center justify-center justify-self-center self-center">
              <TooltipProvider delayDuration={120}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HitoButton size="sm" variant="secondary">
                      Focus for context
                    </HitoButton>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={8}>Warm-up · 10 min</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </ShowcaseCard>
        </ShowcaseGroup>

        <ShowcaseGroup title="Table & List">
          <ShowcaseCard title="Data Table & Headers" href="/hitoDS/components#data-table">
            <div className="grid w-full min-w-0 self-center gap-5">
              <div className="grid min-w-0 gap-2">
                <p className="hito-label-sm text-tertiary">Interactive header</p>
                <DataTableSpecimenPreview
                  sortable
                  activeSort
                  filtered
                  staticMode={false}
                  showUtilityRow={false}
                />
              </div>
              <div className="grid min-w-0 gap-2 border-t border-hairline pt-5">
                <p className="hito-label-sm text-tertiary">Static header</p>
                <DataTableSpecimenPreview
                  sortable={false}
                  activeSort={false}
                  filtered={false}
                  staticMode
                  showUtilityRow={false}
                />
              </div>
            </div>
          </ShowcaseCard>
          <ShowcaseCard title="Rows & Disclosure" href="/hitoDS/components#rows">
            <details className="hito-disclosure w-full self-center" open>
              <summary className="hito-disclosure-summary">
                <span className="hito-list-row-title">Advanced options</span>
                <Icon name="chevron-down" className="hito-disclosure-chevron" decorative />
              </summary>
              <div className="hito-disclosure-body">
                <p className="hito-list-row-copy">Rare actions stay available but quiet.</p>
              </div>
            </details>
          </ShowcaseCard>
        </ShowcaseGroup>
      </div>

      <section id="reference-boundary" className="ds-section">
        <span id="figma-bridge" className="sr-only" aria-hidden="true" />
        <span id="shared-wrappers" className="sr-only" aria-hidden="true" />
        <span id="backlog" className="sr-only" aria-hidden="true" />
        <div className="hito-specimen-header">
          <SectionIntro label="Reference" title="Code remains canonical." />
          <HitoMetadataTag tone="muted">Secondary</HitoMetadataTag>
        </div>
        <div className="hito-reference-list">
          <ReferenceListRow
            label="Downstream capture"
            title="Figma export board"
            body={
              <ProductLinks
                links={[{ href: "/hitoDS/export/figma", label: "/hitoDS/export/figma" }]}
              />
            }
          />
          <ReferenceListRow
            label="Boundary"
            title="Live source and reference own behavior"
            body="Figma, screenshots, wrappers, and local exceptions stay downstream or explicitly scoped; they do not create a second Design System."
          />
        </div>
      </section>
    </>
  );
}

function ShowcaseGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`showcase-${title.toLowerCase().replaceAll(/[^a-z]+/g, "-")}`}>
      <h2
        id={`showcase-${title.toLowerCase().replaceAll(/[^a-z]+/g, "-")}`}
        className="hito-ui-title-sm"
      >
        {title}
      </h2>
      <div className="hito-ds-showcase-grid mt-5">{children}</div>
    </section>
  );
}

function ShowcaseCard({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <article className="hito-ds-showcase-card grid">
      <div className="flex min-w-0 items-center justify-between gap-3 border-b border-hairline pb-3">
        <h3 className="hito-list-row-title">{title}</h3>
        <HitoButton
          asChild
          iconOnly
          size="sm"
          variant="ghost"
          aria-label={`Open ${title} reference`}
        >
          <a href={href}>
            <Icon name="arrow-up-right" size="xs" decorative />
          </a>
        </HitoButton>
      </div>
      <div className="grid min-h-64 min-w-0 content-center pt-5">{children}</div>
    </article>
  );
}

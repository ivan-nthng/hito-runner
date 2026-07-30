import { useState } from "react";

import { HitoDsPlayground } from "@/components/hito-ds/playground";
import { ChoiceSelector } from "@/components/hito-ds/specimen-previews";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { hitoToast } from "@/components/ui/hito-toast";
import { Icon } from "@/components/ui/icon";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const OVERLAY_FAMILIES = [
  "dialog",
  "sheet",
  "popover",
  "tooltip",
  "select",
  "dropdown",
  "toast",
] as const;

const MOTION_TOKENS = [
  { value: "100ms", use: "Immediate feedback" },
  { value: "140ms", use: "Controls and tooltip" },
  { value: "180ms", use: "Menus and popovers" },
  { value: "220ms", use: "Dialog and feedback" },
  { value: "260ms", use: "Directional sheet" },
] as const;

type OverlayFamily = (typeof OVERLAY_FAMILIES)[number];

export function MotionSystemPlayground() {
  const [family, setFamily] = useState<OverlayFamily>("dialog");
  const [selectedWorkout, setSelectedWorkout] = useState("easy");

  return (
    <HitoDsPlayground
      id="motion"
      label="Motion"
      status="Shared foundation"
      statusTone="signal"
      usedIn="Buttons, controls, feedback, and shared Radix overlays."
      demo={
        <div className="flex min-h-44 min-w-0 items-center justify-center">
          <MotionOverlayDemo
            family={family}
            selectedWorkout={selectedWorkout}
            onSelectedWorkoutChange={setSelectedWorkout}
          />
        </div>
      }
      variants={
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-5" inert>
          {MOTION_TOKENS.map((token) => (
            <article key={token.value} className="hito-state-surface min-w-0 p-4">
              <p className="hito-panel-title font-mono-num">{token.value}</p>
              <p className="hito-caption mt-2">{token.use}</p>
            </article>
          ))}
        </div>
      }
      controls={
        <div className="hito-row-group border-0">
          <div className="hito-list-row items-start">
            <ChoiceSelector
              label="Overlay family"
              value={family}
              options={OVERLAY_FAMILIES}
              onChange={setFamily}
              textTransform="none"
            />
          </div>
          <div className="hito-list-row items-start">
            <div>
              <p className="hito-list-row-title">Origin stays legible</p>
              <p className="hito-list-row-copy">
                Opacity, scale, blur, or direction stays restrained.
              </p>
            </div>
          </div>
          <div className="hito-list-row items-start">
            <div>
              <p className="hito-list-row-title">Behavior is immediate</p>
              <p className="hito-list-row-copy">
                Focus, Escape, portals, and disabled state never wait.
              </p>
            </div>
          </div>
          <div className="hito-list-row items-start">
            <div>
              <p className="hito-list-row-title">Reduced motion</p>
              <p className="hito-list-row-copy">
                The same state appears without spatial animation.
              </p>
            </div>
          </div>
        </div>
      }
    />
  );
}

function MotionOverlayDemo({
  family,
  selectedWorkout,
  onSelectedWorkoutChange,
}: {
  family: OverlayFamily;
  selectedWorkout: string;
  onSelectedWorkoutChange: (value: string) => void;
}) {
  if (family === "dialog") {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <button type="button" className="hito-button hito-button-primary hito-button-md">
            Open dialog
          </button>
        </DialogTrigger>
        <DialogContent className="hito-product-dialog hito-product-dialog-content-fit hito-dialog-size-compact">
          <DialogHeader className="hito-product-dialog-header">
            <DialogTitle>Review change</DialogTitle>
            <DialogDescription>
              Focus and Escape are active as soon as this opens.
            </DialogDescription>
          </DialogHeader>
          <div className="hito-product-dialog-body">
            <p className="hito-support-copy">Shared dialog motion preserves modal containment.</p>
          </div>
          <DialogFooter className="hito-product-dialog-footer">
            <button type="button" className="hito-button hito-button-primary hito-button-md">
              Confirm
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (family === "sheet") {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <button type="button" className="hito-button hito-button-primary hito-button-md">
            Open sheet
          </button>
        </SheetTrigger>
        <SheetContent className="grid grid-rows-[auto_minmax(0,1fr)_auto] p-0">
          <SheetHeader className="border-b border-hairline px-5 py-4 pr-14">
            <SheetTitle>Plan actions</SheetTitle>
            <SheetDescription>Directional origin remains clear on narrow screens.</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 overflow-y-auto p-5">
            <p className="hito-support-copy">Shared sheet content stays viewport-contained.</p>
          </div>
          <SheetFooter className="border-t border-hairline p-5">
            <button type="button" className="hito-button hito-button-primary hito-button-md">
              Continue
            </button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  if (family === "popover") {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className="hito-button hito-button-secondary hito-button-md">
            Open popover
          </button>
        </PopoverTrigger>
        <PopoverContent>
          <p className="hito-list-row-title">Workout detail</p>
          <p className="hito-list-row-copy mt-1">The trigger remains the visible spatial origin.</p>
        </PopoverContent>
      </Popover>
    );
  }

  if (family === "tooltip") {
    return (
      <TooltipProvider delayDuration={120}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="hito-button hito-button-secondary hito-button-md"
              aria-label="Show motion tooltip"
            >
              <Icon name="plan-note" size="sm" />
              Hover or focus
            </button>
          </TooltipTrigger>
          <TooltipContent sideOffset={8}>Short contextual detail</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (family === "select") {
    return (
      <div className="w-full max-w-64">
        <Select value={selectedWorkout} onValueChange={onSelectedWorkoutChange}>
          <SelectTrigger aria-label="Workout type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="easy">Easy run</SelectItem>
            <SelectItem value="long">Long run</SelectItem>
            <SelectItem value="quality">Quality workout</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (family === "dropdown") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className="hito-button hito-button-secondary hito-button-md">
            Open menu
            <Icon name="chevron-down" size="sm" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center">
          <DropdownMenuItem>
            <Icon name="edit" size="sm" />
            Edit workout
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Icon name="copy" size="sm" />
            Duplicate
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <button
      type="button"
      className="hito-button hito-button-secondary hito-button-md"
      onClick={() =>
        hitoToast.info({
          id: "hito-ds-motion-toast",
          title: "Motion contract",
          description: "Toast entry and exit use the shared feedback duration.",
        })
      }
    >
      Show toast
    </button>
  );
}

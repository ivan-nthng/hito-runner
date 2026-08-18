import { forwardRef, type ComponentPropsWithoutRef } from "react";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export type HitoNavigationCardProps = Omit<ComponentPropsWithoutRef<"a">, "children" | "href"> & {
  date: string;
  direction: "previous" | "next";
  href: string;
  label: string;
  title: string;
};

const HitoNavigationCard = forwardRef<HTMLAnchorElement, HitoNavigationCardProps>(
  ({ className, date, direction, href, label, title, ...props }, ref) => {
    const arrow = (
      <Icon
        name={direction === "previous" ? "arrow-left" : "arrow-right"}
        size="sm"
        className="shrink-0 text-tertiary transition-colors group-hover:text-foreground group-focus-visible:text-foreground"
        data-hito-navigation-card-arrow
        decorative
      />
    );

    return (
      <a
        ref={ref}
        href={href}
        className={cn(
          "group hito-surface-quiet grid min-w-0 gap-4 p-4 text-foreground no-underline",
          className,
        )}
        data-direction={direction}
        data-hito-component="navigation-card"
        {...props}
      >
        <span className="flex min-w-0 items-center gap-3">
          {direction === "previous" ? (
            arrow
          ) : (
            <span className="hito-technical-sm shrink-0 text-tertiary">{date}</span>
          )}
          <span className="hito-label-sm min-w-0 flex-1 text-center text-tertiary">{label}</span>
          {direction === "previous" ? (
            <span className="hito-technical-sm shrink-0 text-tertiary">{date}</span>
          ) : (
            arrow
          )}
        </span>
        <span
          className={cn(
            "hito-ui-title-xs min-w-0 text-foreground",
            direction === "next" && "text-right",
          )}
        >
          {title}
        </span>
      </a>
    );
  },
);

HitoNavigationCard.displayName = "HitoNavigationCard";

export { HitoNavigationCard };

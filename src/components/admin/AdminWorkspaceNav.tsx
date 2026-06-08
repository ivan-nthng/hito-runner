import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HitoLogo } from "@/components/ui/hito-logo";
import { Icon } from "@/components/ui/icon";
import {
  ADMIN_WORKSPACE_NAV_ITEMS,
  type AdminWorkspaceSectionId,
} from "@/components/admin/admin-workspace-nav-model";

export function AdminWorkspaceSidebar({
  activeSection,
}: {
  activeSection: AdminWorkspaceSectionId;
}) {
  return (
    <aside className="hito-workbench-sidebar">
      <div className="px-5 pb-7 pt-6">
        <Link to="/" className="hito-admin-brand">
          <HitoLogo decorative className="[--hito-logo-height:1.15rem]" />
          <span>Admin</span>
        </Link>
        <p className="hito-menu-meta mt-1">Admin workspace</p>
      </div>

      <AdminWorkspaceNav activeSection={activeSection} variant="sidebar" />

      <div className="mt-auto p-4">
        <AdminWorkspaceAccountMenu activeSection={activeSection} />
      </div>
    </aside>
  );
}

export function AdminWorkspacePageHeader({
  activeSection,
  action,
  description,
  mobileMeta,
  title,
}: {
  activeSection: AdminWorkspaceSectionId;
  action?: ReactNode;
  description: string;
  mobileMeta?: ReactNode;
  title: string;
}) {
  const activeItem = ADMIN_WORKSPACE_NAV_ITEMS.find((item) => item.id === activeSection);

  return (
    <header className="hito-workbench-topbar">
      <div className="flex flex-col gap-4 px-5 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <div className="min-w-0">
          <div className="hito-admin-mobile-shell lg:hidden">
            <div className="hito-workbench-location">
              <span className="hito-workbench-location-title">Admin workspace</span>
              <span className="hito-workbench-location-meta">
                <span>{activeItem?.label ?? title}</span>
                {mobileMeta ? (
                  <>
                    <span aria-hidden="true">/</span>
                    <span>{mobileMeta}</span>
                  </>
                ) : null}
              </span>
            </div>
            <AdminWorkspaceAccountMenu activeSection={activeSection} compact />
          </div>
          <h1 className="mt-3 font-display text-3xl tracking-tight text-foreground sm:text-4xl lg:mt-0">
            {title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        {action ? (
          <div className="flex flex-wrap items-start gap-2 lg:items-center">{action}</div>
        ) : null}
      </div>
      <AdminWorkspaceNav activeSection={activeSection} variant="mobile" />
    </header>
  );
}

function AdminWorkspaceNav({
  activeSection,
  variant,
}: {
  activeSection: AdminWorkspaceSectionId;
  variant: "sidebar" | "mobile";
}) {
  const isSidebar = variant === "sidebar";

  return (
    <nav
      className={isSidebar ? "hito-shell-nav px-3" : "hito-workbench-section-rail lg:hidden"}
      aria-label="Admin workspace sections"
    >
      <div className={isSidebar ? "grid gap-0.5" : "hito-workbench-quick-links"}>
        {ADMIN_WORKSPACE_NAV_ITEMS.map((item) => {
          const active = activeSection === item.id;

          return (
            <a
              key={item.id}
              href={item.href}
              className={isSidebar ? "hito-shell-nav-row" : "hito-workbench-quick-link"}
              data-active={active ? "true" : undefined}
              aria-current={active ? "page" : undefined}
            >
              {isSidebar ? <Icon name={item.icon} className="hito-shell-nav-icon" /> : null}
              {item.label}
              {isSidebar && active ? <span className="hito-shell-nav-dot" /> : null}
            </a>
          );
        })}
      </div>
    </nav>
  );
}

function AdminWorkspaceAccountMenu({
  activeSection,
  compact = false,
}: {
  activeSection: AdminWorkspaceSectionId;
  compact?: boolean;
}) {
  const logoutNext = activeSection === "work-items" ? "%2Fadmin%2Fcapture" : "%2Fadmin%2Fanalytics";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="hito-shell-profile-trigger hito-admin-account-trigger group"
          data-variant={compact ? "compact" : undefined}
          aria-label="Open admin account menu"
        >
          <Avatar className="h-9 w-9 border border-hairline/80 bg-background/70">
            <AvatarFallback className="hito-shell-avatar-fallback">A</AvatarFallback>
          </Avatar>
          {!compact ? (
            <div className="min-w-0 flex-1 leading-tight">
              <div className="hito-menu-text truncate">Admin</div>
              <div className="hito-menu-meta truncate">Local operations</div>
            </div>
          ) : null}
          <Icon
            name={compact ? "chevron-down" : "chevron-up"}
            size="sm"
            className="text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={compact ? "bottom" : "top"}
        align={compact ? "end" : "start"}
        className="hito-shell-menu w-[224px]"
      >
        <DropdownMenuLabel className="pb-1">
          <div className="hito-menu-text">Admin</div>
          <div className="hito-menu-meta mt-1 truncate">Local operations</div>
          <div className="hito-micro-label mt-2">Admin workspace</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="hito-shell-menu-separator" />
        <DropdownMenuItem className="hito-shell-menu-item" disabled>
          <Icon name="settings" size="sm" />
          Account settings
          <span className="ml-auto hito-menu-meta">Soon</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="hito-shell-menu-item" asChild>
          <Link to="/">
            <Icon name="arrow-left" size="sm" />
            Back to Hito
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="hito-shell-menu-separator" />
        <DropdownMenuItem className="hito-shell-menu-item" asChild>
          <a href={`/api/admin/auth/logout?next=${logoutNext}`}>
            <Icon name="logout" size="sm" />
            Sign out
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

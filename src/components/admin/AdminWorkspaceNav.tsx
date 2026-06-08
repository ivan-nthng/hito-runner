import { Link } from "@tanstack/react-router";
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
      <div className="px-6 pb-10 pt-7">
        <Link to="/" className="flex items-end gap-2">
          <HitoLogo decorative className="[--hito-logo-height:1.35rem]" />
          <span className="font-display text-xl leading-none tracking-tight">Admin</span>
        </Link>
        <p className="hito-micro-label mt-1">Admin workspace</p>
      </div>

      <AdminWorkspaceNav activeSection={activeSection} variant="sidebar" />

      <div className="mt-auto p-4">
        <div className="hito-row-group">
          <div className="hito-list-row items-start">
            <div className="min-w-0">
              <div className="hito-micro-label flex items-center gap-2">
                <Icon name="shield-alert" size="xs" className="text-signal" />
                Admin workspace
              </div>
              <p className="hito-list-row-copy">
                One internal workspace for product truth, users, test accounts, and work items.
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function AdminWorkspaceMobileNav({
  activeSection,
}: {
  activeSection: AdminWorkspaceSectionId;
}) {
  return <AdminWorkspaceNav activeSection={activeSection} variant="mobile" />;
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

import { Link, createFileRoute } from "@tanstack/react-router";
import loginDesertHorizon from "@/assets/marketing/hero-background/login-desert-horizon.jpg";
import { HitoLogo } from "@/components/ui/hito-logo";
import { Icon, type HitoIconName } from "@/components/ui/icon";
import { APP_NAME } from "@/lib/app-config";

type HubDestination = {
  title: string;
  description: string;
  cta: string;
  badge: string;
  badgeTone: "signal" | "warning" | "success";
  to: "/" | "/admin/analytics" | "/hitoDS" | "/changelog";
  icon: HitoIconName;
};

const HUB_DESTINATIONS: Array<HubDestination> = [
  {
    title: "Hito Running",
    description: "Open the runner service, plans, calendar, and workout logging.",
    cta: "Open service",
    badge: "User login required",
    badgeTone: "signal",
    to: "/",
    icon: "workout",
  },
  {
    title: "Admin analytics",
    description: "Review product health, users, feedback, and local test accounts.",
    cta: "Open admin",
    badge: "Admin login required",
    badgeTone: "warning",
    to: "/admin/analytics",
    icon: "shield-alert",
  },
  {
    title: "Design system",
    description: "Browse Hito tokens, components, brand, and interaction patterns.",
    cta: "Open design system",
    badge: "Public",
    badgeTone: "success",
    to: "/hitoDS",
    icon: "cog",
  },
  {
    title: "Changelog",
    description: "Read shipped changes and implementation history.",
    cta: "View changelog",
    badge: "Public",
    badgeTone: "success",
    to: "/changelog",
    icon: "file-text",
  },
];

export const Route = createFileRoute("/hub")({
  head: () => ({
    meta: [
      { title: `Hito hub — ${APP_NAME}` },
      {
        name: "description",
        content: "Open Hito Running, admin analytics, design system, and changelog destinations.",
      },
    ],
  }),
  component: HubPage,
});

function HubPage() {
  return (
    <main className="auth-hero min-h-screen bg-background text-foreground">
      <img src={loginDesertHorizon} alt="" aria-hidden="true" className="auth-hero-image" />
      <div className="hito-auth-photo-overlay" aria-hidden="true" />
      <div className="auth-hero-content mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-5 py-10 sm:px-8 lg:px-10">
        <header className="mx-auto grid max-w-2xl justify-items-center text-center">
          <HitoLogo className="[--hito-logo-height:1.65rem]" />
          <p className="hito-label mt-8 text-muted-foreground">Destination launcher</p>
          <h1 className="hito-page-title mt-3">Where are we going?</h1>
          <p className="hito-body mt-4 max-w-xl text-muted-foreground">
            Choose a Hito surface. Each destination keeps its own access rules, so public pages stay
            open and service pages ask for the right login when needed.
          </p>
        </header>

        <section
          className="mt-10 grid w-full gap-4 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4"
          aria-label="Hito destinations"
        >
          {HUB_DESTINATIONS.map((destination) => (
            <HubDestinationCard key={destination.to} destination={destination} />
          ))}
        </section>
      </div>
    </main>
  );
}

function HubDestinationCard({ destination }: { destination: HubDestination }) {
  return (
    <Link to={destination.to} className="hito-launch-surface">
      <span className="hito-launcher-card-icon" aria-hidden="true">
        <Icon name={destination.icon} size="md" />
      </span>
      <span className="grid flex-1 gap-3">
        <span className="flex flex-wrap items-center gap-2">
          <span className="hito-panel-title">{destination.title}</span>
          <span className="hito-status-pill" data-tone={destination.badgeTone}>
            {destination.badge}
          </span>
        </span>
        <span className="hito-body-small text-muted-foreground">{destination.description}</span>
      </span>
      <span className="hito-launcher-card-footer">
        <span className="hito-button hito-button-secondary hito-button-sm">
          {destination.cta}
          <Icon name="arrow-up-right" size="xs" />
        </span>
      </span>
    </Link>
  );
}

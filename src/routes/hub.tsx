import { Link, createFileRoute } from "@tanstack/react-router";
import loginDesertHorizon from "@/assets/marketing/hero-background/login-desert-horizon.jpg";
import { HitoLogo } from "@/components/ui/hito-logo";
import { HitoMark, type HitoMarkName } from "@/components/ui/hito-mark";
import { Icon } from "@/components/ui/icon";
import { APP_NAME } from "@/lib/app-config";

type HubDestination = {
  title: string;
  description: string;
  cta: string;
  badge: string;
  badgeTone: "signal" | "warning" | "success";
  badgeTextToken: "--color-text-accent" | "--color-text-warning" | "--color-text-positive";
  to: "/" | "/admin/analytics" | "/hitoDS" | "/changelog";
  mark: HitoMarkName;
};

const HUB_DESTINATIONS: Array<HubDestination> = [
  {
    title: "Hito Running",
    description: "Open the runner service, plans, calendar, and workout logging.",
    cta: "Open service",
    badge: "User login required",
    badgeTone: "signal",
    badgeTextToken: "--color-text-accent",
    to: "/",
    mark: "hito-running",
  },
  {
    title: "Admin analytics",
    description: "Review product health, users, feedback, and local test accounts.",
    cta: "Open admin",
    badge: "Admin login required",
    badgeTone: "warning",
    badgeTextToken: "--color-text-warning",
    to: "/admin/analytics",
    mark: "admin",
  },
  {
    title: "Design system",
    description: "Browse and try Hito's live tokens, components, and interaction patterns.",
    cta: "Open design system",
    badge: "Public",
    badgeTone: "success",
    badgeTextToken: "--color-text-positive",
    to: "/hitoDS",
    mark: "design-system",
  },
  {
    title: "Changelog",
    description: "Read shipped changes and implementation history.",
    cta: "View changelog",
    badge: "Public",
    badgeTone: "success",
    badgeTextToken: "--color-text-positive",
    to: "/changelog",
    mark: "changelog",
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
          <h1 className="hito-display-title-lg mt-3">Where are we going?</h1>
          <p className="hito-body-md mt-4 max-w-xl text-muted-foreground">
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
      <HitoMark name={destination.mark} shape="tile" size="sm" />
      <span className="grid flex-1 gap-3">
        <span className="grid gap-1.5">
          <span
            className="hito-technical-sm"
            data-tone={destination.badgeTone}
            style={{ color: `var(${destination.badgeTextToken})` }}
          >
            {destination.badge}
          </span>
          <span className="hito-ui-title-xs">{destination.title}</span>
        </span>
        <span className="hito-body-sm text-muted-foreground">{destination.description}</span>
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

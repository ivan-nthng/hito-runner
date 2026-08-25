import { Icon } from "@/components/ui/icon";
import { ThemePreferenceChoiceGroup } from "@/components/settings/theme-preference-controls";
import { useHitoThemePreference } from "@/components/settings/use-hito-theme-preference";
import { useHitoProductMessage } from "@/components/ui/hito-ui-locale-provider";

export function ThemePreferenceSection({
  panelRole = "region",
}: {
  panelRole?: "region" | "tabpanel";
}) {
  const { preference, resolvedTheme } = useHitoThemePreference();
  const message = useHitoProductMessage();
  const resolvedLabel = message(resolvedTheme === "light" ? "Light" : "Dark");
  const preferenceLabel = message(
    preference === "system" ? "System" : preference === "light" ? "Light" : "Dark",
  );

  return (
    <section className="hito-settings-panel" role={panelRole}>
      <div className="grid gap-6">
        <section className="hito-settings-section border-t-0 pt-0">
          <div className="flex items-center gap-2">
            <Icon name="settings" size="sm" className="text-signal" />
            <h2 className="hito-ui-title-sm text-foreground">{message("Appearance")}</h2>
          </div>
          <p className="hito-body-md text-secondary mt-3 max-w-2xl">
            {message(
              "Choose how Hito resolves the shared semantic color tokens on this device. The preference stays in this browser and does not change your runner profile.",
            )}
          </p>

          <ThemePreferenceChoiceGroup
            className="mt-5"
            size="lg"
            buttonClassName="sm:min-w-32 sm:flex-none"
            label={null}
          />
        </section>

        <section
          className="hito-state-surface p-4"
          data-tone={resolvedTheme === "light" ? "signal" : undefined}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="hito-label-md text-foreground">{message("Current theme")}</p>
              <p className="hito-body-md text-secondary mt-2">
                {preference === "system"
                  ? message("System is active. Hito is currently using {theme}.", {
                      theme: resolvedLabel,
                    })
                  : message("{theme} is active.", { theme: preferenceLabel })}
              </p>
              <p className="hito-body-xs text-tertiary mt-2">
                {message("Root attribute")}:{" "}
                <code className="hito-inline-code">
                  data-hito-theme=&quot;{resolvedTheme}&quot;
                </code>
              </p>
            </div>
            <span
              className="hito-status-pill"
              data-tone={resolvedTheme === "light" ? "signal" : "muted"}
            >
              {resolvedLabel}
            </span>
          </div>
        </section>
      </div>
    </section>
  );
}

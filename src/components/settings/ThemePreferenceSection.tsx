import { Icon } from "@/components/ui/icon";
import { ThemePreferenceChoiceGroup } from "@/components/settings/theme-preference-controls";
import { useHitoThemePreference } from "@/components/settings/use-hito-theme-preference";

export function ThemePreferenceSection({
  panelRole = "region",
}: {
  panelRole?: "region" | "tabpanel";
}) {
  const { activeDescription, resolvedTheme } = useHitoThemePreference();

  return (
    <section className="hito-settings-panel" role={panelRole}>
      <div className="grid gap-6">
        <section className="hito-settings-section border-t-0 pt-0">
          <div className="flex items-center gap-2">
            <Icon name="settings" size="sm" className="text-signal" />
            <h2 className="hito-section-title">Appearance</h2>
          </div>
          <p className="hito-support-copy mt-3 max-w-2xl">
            Choose how Hito resolves the shared semantic color tokens on this device. The preference
            stays in this browser and does not change your runner profile.
          </p>

          <ThemePreferenceChoiceGroup
            className="mt-5"
            buttonClassName="hito-choice-toggle-lg min-w-0 flex-1 sm:min-w-32 sm:flex-none"
            label={null}
          />
        </section>

        <section
          className="hito-state-surface p-4"
          data-tone={resolvedTheme === "light" ? "signal" : undefined}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="hito-label">Current theme</p>
              <p className="hito-body mt-2">{activeDescription}</p>
              <p className="hito-caption mt-2">
                Root attribute:{" "}
                <code className="hito-inline-code">
                  data-hito-theme=&quot;{resolvedTheme}&quot;
                </code>
              </p>
            </div>
            <span
              className="hito-status-pill"
              data-tone={resolvedTheme === "light" ? "signal" : "muted"}
            >
              {resolvedTheme === "light" ? "Light" : "Dark"}
            </span>
          </div>
        </section>
      </div>
    </section>
  );
}

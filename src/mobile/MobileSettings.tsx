import { useState } from "react";
import type { useSettings } from "../hooks/useSettings";

type Props = {
  settings: ReturnType<typeof useSettings>;
};

export function MobileSettings({ settings }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function update(action: () => Promise<void>) {
    if (saving) return;

    setSaving(true);
    setError("");

    try {
      await action();
    } catch {
      setError("Couldn't save your settings. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mobile-page mobile-settings">
      <h2>Settings</h2>

      <fieldset disabled={saving}>
        <legend>Theme</legend>

        <div className="mobile-setting-options">
          <button
            type="button"
            aria-pressed={settings.mode === "dark"}
            onClick={() =>
              void update(() => settings.handleThemeChange("dark"))
            }
          >
            Dark
          </button>

          <button
            type="button"
            aria-pressed={settings.mode === "light"}
            onClick={() =>
              void update(() => settings.handleThemeChange("light"))
            }
          >
            Light
          </button>
        </div>
      </fieldset>

      <fieldset disabled={saving}>
        <legend>Aesthetic</legend>

        <div className="mobile-setting-options">
          <button
            type="button"
            aria-pressed={settings.palette === "tvgirl"}
            onClick={() =>
              void update(() => settings.handlePaletteChange("tvgirl"))
            }
          >
            TV Girl
          </button>

          <button
            type="button"
            aria-pressed={settings.palette === "lalaland"}
            onClick={() =>
              void update(() => settings.handlePaletteChange("lalaland"))
            }
          >
            La La Land
          </button>
        </div>
      </fieldset>

      {error && <p role="alert">{error}</p>}
    </section>
  );
}
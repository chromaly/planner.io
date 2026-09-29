type Palette = "tvgirl" | "lalaland"

type SettingsPageProps = {
  theme: "dark" | "light"
  onThemeChange: (theme: "dark" | "light") => void
  aesthetic: Palette
  onAestheticChange: (aesthetic: Palette) => void
}

export function SettingsPage({
  theme,
  onThemeChange,
  aesthetic,
  onAestheticChange,
}: SettingsPageProps) {
  return (
    <div className="flex-1 px-6 py-8">
      <div className="max-w-3xl mx-auto  bg-surface rounded-xl p-10 shadow-lg shadow-text/15">
        <h2 className="text-3xl font-bold text-accent-2 mb-8">
          Settings
        </h2>

        <div className="mb-8">
          <label className="block text-sm font-medium mb-3">
            Theme
          </label>

          <div className="flex gap-2">
            <button
              onClick={() => onThemeChange("dark")}
              className={`px-4 py-2 rounded-lg text-sm ${
                theme === "dark"
                  ? "bg-accent-2"
                  : "bg-surface"
              }`}
            >
              Dark
            </button>

            <button
              onClick={() => onThemeChange("light")}
              className={`px-4 py-2 rounded-lg text-sm ${
                theme === "light"
                  ? "bg-accent-2"
                  : "bg-surface"
              }`}
            >
              Light
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-3">
            Aesthetic
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() =>
                onAestheticChange("tvgirl")
              }
              className={`px-4 py-2 rounded-lg text-sm ${
                aesthetic === "tvgirl"
                  ? "bg-accent-2"
                  : "bg-surface"
              }`}
            >
              TV Girl
            </button>

            <button
              onClick={() =>
                onAestheticChange("lalaland")
              }
              className={`px-4 py-2 rounded-lg text-sm ${
                aesthetic === "lalaland"
                  ? "bg-accent-2"
                  : "bg-surface"
              }`}
            >
              LaLaLand
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
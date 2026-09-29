import SwiftUI

struct SettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.plannerTheme) private var theme

    let settings: PlannerSettings
    let onThemeChange: (ThemeMode) -> Void
    let onPaletteChange: (Palette) -> Void

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 28) {
                    Text("Settings")
                        .font(.sora(28, weight: .bold))
                        .foregroundStyle(theme.accent2)

                    settingSection(title: "Theme") {
                        HStack(spacing: 8) {
                            settingButton(
                                title: "Dark",
                                selected: settings.mode == .dark
                            ) {
                                onThemeChange(.dark)
                            }

                            settingButton(
                                title: "Light",
                                selected: settings.mode == .light
                            ) {
                                onThemeChange(.light)
                            }
                        }
                    }

                    settingSection(title: "Aesthetic") {
                        HStack(spacing: 8) {
                            settingButton(
                                title: "TV Girl",
                                selected: settings.palette == .tvgirl
                            ) {
                                onPaletteChange(.tvgirl)
                            }

                            settingButton(
                                title: "LaLaLand",
                                selected: settings.palette == .lalaland
                            ) {
                                onPaletteChange(.lalaland)
                            }
                        }
                    }
                }
                .frame(
                    maxWidth: .infinity,
                    alignment: .leading
                )
                .padding(20)
            }
            .background(
                theme.background
                    .ignoresSafeArea()
            )
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Close") {
                        dismiss()
                    }
                    .font(.sora(14, weight: .medium))
                }
            }
            .toolbarBackground(
                theme.background,
                for: .navigationBar
            )
            .toolbarColorScheme(
                settings.mode == .dark
                    ? .dark
                    : .light,
                for: .navigationBar
            )
        }
        .background(
            theme.background
                .ignoresSafeArea()
        )
    }

    private func settingSection<Content: View>(
        title: String,
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title)
                .font(.sora(14, weight: .medium))
                .foregroundStyle(theme.text)

            content()
        }
    }

    private func settingButton(
        title: String,
        selected: Bool,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            Text(title)
                .font(.sora(14, weight: .medium))
                .foregroundStyle(
                    selected
                        ? theme.background
                        : theme.text
                )
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(
                    selected
                        ? theme.accent2
                        : theme.surface
                )
                .clipShape(
                    RoundedRectangle(cornerRadius: 10)
                )
                .overlay {
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(
                            theme.border,
                            lineWidth: 1
                        )
                }
        }
        .buttonStyle(.plain)
    }
}

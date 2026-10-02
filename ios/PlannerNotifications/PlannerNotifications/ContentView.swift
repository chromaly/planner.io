import SwiftUI
import FirebaseAuth
import FirebaseCore
import GoogleSignIn

struct ContentView: View {
    @Environment(\.openURL) private var openURL

    @State private var user: User?

    @State private var events: [Event] = []
    @State private var deadlines: [Deadline] = []
    @State private var groups: [PlannerGroup] = []
    @State private var dailyNotes: [DailyNote] = []

    @State private var selectedView: PlannerView = .events
    @State private var errorMessage: String?

    @State private var settings = PlannerSettings(
        mode: .dark,
        palette: .tvgirl
    )

    @State private var showingSettings = false

    private var plannerTheme: PlannerTheme {
        PlannerTheme(
            mode: settings.mode,
            palette: settings.palette
        )
    }

    var body: some View {
        ZStack {
            plannerTheme.background
                .ignoresSafeArea()

            if user != nil {
                plannerView
            } else {
                signInView
            }
        }
        .preferredColorScheme(
            settings.mode == .dark
                ? .dark
                : .light
        )
        .environment(\.plannerTheme, plannerTheme)
        .onAppear {
            user = Auth.auth().currentUser

            if user != nil {
                startListeners()
            }
        }
        .sheet(isPresented: $showingSettings) {
            SettingsView(
                settings: settings,
                onThemeChange: handleThemeChange,
                onPaletteChange: handlePaletteChange
            )
            .environment(\.plannerTheme, plannerTheme)
        }
    }

    // MARK: - Main Planner

    private var plannerView: some View {
        ZStack(alignment: .bottom) {
            VStack(spacing: 0) {
                appHeader

                topNavigation

                Group {
                    switch selectedView {
                    case .events:
                        EventsView(
                            events: events,
                            deadlines: deadlines,
                            groups: groups
                        )

                    case .notes:
                        NotesView(
                            dailyNotes: dailyNotes
                        )

                    case .reminders:
                        RemindersView(
                            events: events,
                            deadlines: deadlines,
                            groups: groups
                        )
                    }
                }
                .frame(
                    maxWidth: .infinity,
                    maxHeight: .infinity
                )
            }

            bottomNavigation
        }
        .ignoresSafeArea(.keyboard)
    }

    // MARK: - Header

    private var appHeader: some View {
        VStack(alignment: .leading, spacing: 4) {
            Button {
                guard let url = URL(
                    string: "https://chromaly.github.io/planner.io/"
                ) else {
                    return
                }

                openURL(url)
            } label: {
                Text("planner.io")
                    .font(.sora(27, weight: .bold))
                    .foregroundStyle(plannerTheme.accent2)
            }
            .buttonStyle(.plain)

            Text("The only university planner you'll ever need.")
                .font(.sora(13, weight: .medium))
                .foregroundStyle(.secondary)
        }
        .frame(
            maxWidth: .infinity,
            alignment: .leading
        )
        .padding(.horizontal, 20)
        .padding(.top, 18)
        .padding(.bottom, 10)
    }

    // MARK: - Top Navigation

    private var topNavigation: some View {
        HStack(spacing: 4) {
            plannerButton(
                title: "EVENTS",
                view: .events
            )

            plannerButton(
                title: "NOTES",
                view: .notes
            )

            plannerButton(
                title: "REMINDERS",
                view: .reminders
            )
        }
        .padding(4)
        .background(plannerTheme.surface)
        .clipShape(
            RoundedRectangle(cornerRadius: 12)
        )
        .overlay {
            RoundedRectangle(cornerRadius: 12)
                .stroke(
                    plannerTheme.border,
                    lineWidth: 1
                )
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 8)
    }

    private func plannerButton(
        title: String,
        view: PlannerView
    ) -> some View {
        Button {
            selectedView = view
        } label: {
            Text(title)
                .font(.sora(10, weight: .bold))
                .tracking(0.8)
                .foregroundStyle(
                    selectedView == view
                        ? plannerTheme.accent2
                        : .secondary
                )
                .frame(maxWidth: .infinity)
                .padding(.vertical, 10)
                .background(
                    selectedView == view
                        ? plannerTheme.accent2.opacity(0.12)
                        : Color.clear
                )
                .clipShape(
                    RoundedRectangle(cornerRadius: 9)
                )
        }
        .buttonStyle(.plain)
    }

    // MARK: - Bottom Navigation

    private var bottomNavigation: some View {
        HStack {
            Button {
                showingSettings = true
            } label: {
                HStack(spacing: 7) {
                    Image(systemName: "gearshape")

                    Text("Settings")
                }
                .font(.sora(13, weight: .medium))
                .foregroundStyle(.secondary)
            }
            .buttonStyle(.plain)

            Spacer()

            Button {
                signOut()
            } label: {
                HStack(spacing: 7) {
                    Text("Sign Out")

                    Image(
                        systemName:
                            "rectangle.portrait.and.arrow.right"
                    )
                }
                .font(.sora(13, weight: .medium))
                .foregroundStyle(
                    .red.opacity(0.85)
                )
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 14)
        .background(plannerTheme.background)
        .overlay(alignment: .top) {
            Rectangle()
                .fill(plannerTheme.border)
                .frame(height: 1)
        }
    }

    // MARK: - Firebase

    private func startListeners() {
        FirebaseService.shared.startEventListener(
            onChange: { newEvents in
                DispatchQueue.main.async {
                    events = newEvents

                    let occurrences =
                        EventScheduler.shared
                            .generateUpcomingOccurrences(
                                for: newEvents
                            )

                    NotificationService.shared.reschedule(
                        occurrences: occurrences
                    )
                }
            },
            onError: { error in
                DispatchQueue.main.async {
                    errorMessage =
                        error.localizedDescription
                }
            }
        )

        FirebaseService.shared.startDeadlineListener(
            onChange: { newDeadlines in
                DispatchQueue.main.async {
                    deadlines = newDeadlines
                }
            },
            onError: { error in
                DispatchQueue.main.async {
                    errorMessage =
                        error.localizedDescription
                }
            }
        )

        FirebaseService.shared.startGroupListener(
            onChange: { newGroups in
                DispatchQueue.main.async {
                    groups = newGroups
                }
            },
            onError: { error in
                DispatchQueue.main.async {
                    errorMessage =
                        error.localizedDescription
                }
            }
        )

        FirebaseService.shared.startNotesListener(
            onChange: { newNotes in
                DispatchQueue.main.async {
                    dailyNotes = newNotes
                }
            },
            onError: { error in
                DispatchQueue.main.async {
                    errorMessage =
                        error.localizedDescription
                }
            }
        )

        FirebaseService.shared.startSettingsListener(
            onChange: { newSettings in
                DispatchQueue.main.async {
                    settings = newSettings
                }
            },
            onError: { error in
                DispatchQueue.main.async {
                    errorMessage =
                        error.localizedDescription
                }
            }
        )
    }

    // MARK: - Settings

    private func handleThemeChange(
        _ newMode: ThemeMode
    ) {
        settings = PlannerSettings(
            mode: newMode,
            palette: settings.palette
        )

        Task {
            do {
                try await FirebaseService.shared.saveSettings(
                    mode: newMode,
                    palette: settings.palette
                )
            } catch {
                await MainActor.run {
                    errorMessage =
                        error.localizedDescription
                }
            }
        }
    }

    private func handlePaletteChange(
        _ newPalette: Palette
    ) {
        settings = PlannerSettings(
            mode: settings.mode,
            palette: newPalette
        )

        Task {
            do {
                try await FirebaseService.shared.saveSettings(
                    mode: settings.mode,
                    palette: newPalette
                )
            } catch {
                await MainActor.run {
                    errorMessage =
                        error.localizedDescription
                }
            }
        }
    }

    // MARK: - Sign Out

    private func signOut() {
        do {
            try FirebaseService.shared.signOut()

            user = nil
            events = []
            deadlines = []
            groups = []
            dailyNotes = []
            selectedView = .events

            settings = PlannerSettings(
                mode: .dark,
                palette: .tvgirl
            )
        } catch {
            errorMessage =
                error.localizedDescription
        }
    }

    // MARK: - Sign In

    private var signInView: some View {
        VStack(spacing: 24) {
            Spacer()

            VStack(spacing: 10) {
                Text("planner.io")
                    .font(
                        .sora(
                            34,
                            weight: .bold
                        )
                    )
                    .foregroundStyle(
                        plannerTheme.accent2
                    )

                Text(
                    "The only university planner you'll ever need."
                )
                .font(.sora(14))
                .foregroundStyle(.secondary)
            }

            Button {
                signIn()
            } label: {
                Text("Sign in with Google")
                    .font(
                        .sora(
                            15,
                            weight: .semibold
                        )
                    )
                    .foregroundStyle(.primary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 15)
                    .background(
                        plannerTheme.surface
                    )
                    .clipShape(
                        RoundedRectangle(
                            cornerRadius: 14
                        )
                    )
                    .overlay {
                        RoundedRectangle(
                            cornerRadius: 14
                        )
                        .stroke(
                            plannerTheme.border,
                            lineWidth: 1
                        )
                    }
            }
            .padding(.horizontal, 20)

            if let errorMessage {
                Text(errorMessage)
                    .font(.sora(12))
                    .foregroundStyle(.red)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 20)
            }

            Spacer()
        }
        .padding()
        .font(.sora(16))
    }

    private func signIn() {
        guard let clientID =
            FirebaseApp.app()?.options.clientID
        else {
            errorMessage =
                "Missing Firebase client ID"
            return
        }

        let config = GIDConfiguration(
            clientID: clientID
        )

        GIDSignIn.sharedInstance.configuration =
            config

        guard
            let windowScene =
                UIApplication.shared.connectedScenes
                    .first as? UIWindowScene,
            let rootViewController =
                windowScene.windows
                    .first?
                    .rootViewController
        else {
            errorMessage =
                "Could not find root view controller"
            return
        }

        GIDSignIn.sharedInstance.signIn(
            withPresenting: rootViewController
        ) { result, error in

            if let error {
                DispatchQueue.main.async {
                    errorMessage =
                        error.localizedDescription
                }
                return
            }

            guard
                let googleUser = result?.user,
                let idToken =
                    googleUser.idToken?.tokenString
            else {
                DispatchQueue.main.async {
                    errorMessage =
                        "Google authentication failed"
                }
                return
            }

            let credential =
                GoogleAuthProvider.credential(
                    withIDToken: idToken,
                    accessToken:
                        googleUser
                            .accessToken
                            .tokenString
                )

            Auth.auth().signIn(
                with: credential
            ) { authResult, error in

                if let error {
                    DispatchQueue.main.async {
                        errorMessage =
                            error.localizedDescription
                    }
                    return
                }

                DispatchQueue.main.async {
                    user = authResult?.user
                    startListeners()
                }
            }
        }
    }
}

// MARK: - Navigation

private enum PlannerView {
    case events
    case notes
    case reminders
}

#Preview {
    ContentView()
}

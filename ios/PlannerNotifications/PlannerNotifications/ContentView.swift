//
//  ContentView.swift
//  PlannerNotifications
//
//  Created by Ryan on 9/14/26.
//

import SwiftUI
import FirebaseAuth
import FirebaseCore
import GoogleSignIn
import UserNotifications

struct ContentView: View {
    @State private var user: User?
    @State private var events: [Event] = []
    @State private var errorMessage: String?

    private func startEventListener() {
        FirebaseService.shared.startEventListener(
            onChange: { newEvents in

                DispatchQueue.main.async {
                    events = newEvents

                    let occurrences =
                        EventScheduler.shared.generateUpcomingOccurrences(
                            for: newEvents
                        )

                    NotificationService.shared.reschedule(
                        occurrences: occurrences
                    )
                }
            },
            onError: { error in
                DispatchQueue.main.async {
                    errorMessage = error.localizedDescription
                }
            }
        )
    }

    private var todaysOccurrences: [EventOccurrence] {
        let now = Date()
        let calendar = Calendar.current

        return EventScheduler.shared
            .generateUpcomingOccurrences(for: events, from: now)
            .filter {
                calendar.isDate($0.date, inSameDayAs: now) &&
                $0.date >= now
            }
            .sorted {
                $0.date < $1.date
            }
    }

    var body: some View {
        ZStack {
            Color.plannerBackground
                .ignoresSafeArea()

            if let user {
                loggedInView(user: user)
            } else {
                signInView
            }
        }
        .preferredColorScheme(.dark)
        .onAppear {
            user = Auth.auth().currentUser

            if user != nil {
                startEventListener()
            }
        }
    }

    // MARK: - Logged In View

    private func loggedInView(user: User) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {

                // MARK: Header

                VStack(alignment: .leading, spacing: 5) {
                    Text("planner.io")
                        .font(.sora(27, weight: .bold))
                        //.foregroundStyle(Color.plannerPurple)

                    Text("The planner for all your needs.")
                        .font(.sora(14))
                        .foregroundStyle(.secondary)
                }
                .padding(.bottom, 34)

                // MARK: Date

                VStack(alignment: .leading, spacing: 5) {
                    Text(
                        Date().formatted(
                            .dateTime.weekday(.wide)
                        )
                    )
                    .font(.sora(30, weight: .bold))
                    //.foregroundStyle(Color.plannerPurple)

                    Text(
                        Date().formatted(
                            .dateTime.month(.wide).day().year()
                        )
                    )
                    .font(.sora(14, weight: .medium))
                    .foregroundStyle(.secondary)
                }
                .padding(.bottom, 30)

                // MARK: Today's Events

                SectionHeader(title: "TODAY'S UPCOMING EVENTS")

                if todaysOccurrences.isEmpty {
                    EmptyDayView()
                } else {
                    VStack(spacing: 12) {
                        ForEach(todaysOccurrences) { occurrence in
                            EventCard(occurrence: occurrence)
                        }
                    }
                }

                // MARK: Account

                VStack(alignment: .leading, spacing: 5) {
                    SectionHeader(title: "ACCOUNT")

                    HStack(spacing: 12) {
                        Image(systemName: "person.circle.fill")
                            .font(.system(size: 28))
                            .foregroundStyle(Color.plannerPurple)

                        VStack(alignment: .leading, spacing: 3) {
                            Text(user.displayName ?? "User")
                                .font(.sora(15, weight: .semibold))
                                .foregroundStyle(.primary)

                            Text(user.email ?? "")
                                .font(.sora(13))
                                .foregroundStyle(.secondary)
                        }

                        Spacer()
                    }

                    // MARK: Account Actions

                    HStack(spacing: 12) {
                        Button {
                            do {
                                try FirebaseService.shared.signOut()
                                self.user = nil
                                self.events = []
                            } catch {
                                self.errorMessage = error.localizedDescription
                            }
                        } label: {
                            Text("Sign Out")
                                .font(.sora(14, weight: .medium))
                                .foregroundStyle(.red)
                                .padding(.horizontal, 24)
                                .padding(.vertical, 13)
                                .background(Color.plannerSurface)
                                .clipShape(
                                    RoundedRectangle(
                                        cornerRadius: 12
                                    )
                                )
                                .overlay {
                                    RoundedRectangle(
                                        cornerRadius: 12
                                    )
                                    .stroke(
                                        Color.plannerBorder,
                                        lineWidth: 1
                                    )
                                }
                        }

                        Button {
                            // Settings will go here later
                        } label: {
                            Image(systemName: "gearshape")
                                .font(
                                    .system(
                                        size: 17,
                                        weight: .medium
                                    )
                                )
                                .foregroundStyle(Color.plannerPurple)
                                .frame(width: 44, height: 44)
                                .background(Color.plannerSurface)
                                .clipShape(Circle())
                                .overlay {
                                    Circle()
                                        .stroke(
                                            Color.plannerBorder,
                                            lineWidth: 1
                                        )
                                }
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.top, 40)
                }
                .padding(.top, 40)

                // MARK: Errors

                if let errorMessage {
                    Text(errorMessage)
                        .font(.sora(12))
                        .foregroundStyle(.red)
                        .padding(.top, 14)
                }
            }
            .font(.sora(16))
            .padding(.horizontal, 20)
            .padding(.top, 24)
            .padding(.bottom, 36)
        }
    }

    // MARK: - Sign In View

    private var signInView: some View {
        VStack(spacing: 24) {
            Spacer()

            VStack(spacing: 10) {
                Text("planner.io")
                    .font(.sora(34, weight: .bold))
                    .foregroundStyle(Color.plannerPurple)

                Text("The planner for all your needs.")
                    .font(.sora(14))
                    .foregroundStyle(.secondary)
            }

            Button {
                signIn()
            } label: {
                Text("Sign in with Google")
                    .font(.sora(15, weight: .semibold))
                    .foregroundStyle(.primary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 15)
                    .background(Color.plannerSurface)
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
                            Color.plannerBorder,
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

    // MARK: - Sign In

    private func signIn() {
        guard let clientID = FirebaseApp.app()?.options.clientID else {
            errorMessage = "Missing Firebase client ID"
            return
        }

        let config = GIDConfiguration(clientID: clientID)
        GIDSignIn.sharedInstance.configuration = config

        guard
            let windowScene = UIApplication.shared.connectedScenes
                .first as? UIWindowScene,
            let rootViewController =
                windowScene.windows.first?.rootViewController
        else {
            errorMessage = "Could not find root view controller"
            return
        }

        GIDSignIn.sharedInstance.signIn(
            withPresenting: rootViewController
        ) { result, error in

            if let error {
                errorMessage = error.localizedDescription
                return
            }

            guard
                let googleUser = result?.user,
                let idToken = googleUser.idToken?.tokenString
            else {
                errorMessage = "Google authentication failed"
                return
            }

            let credential = GoogleAuthProvider.credential(
                withIDToken: idToken,
                accessToken: googleUser.accessToken.tokenString
            )

            Auth.auth().signIn(with: credential) { authResult, error in

                if let error {
                    errorMessage = error.localizedDescription
                    return
                }

                self.user = authResult?.user
                startEventListener()
            }
        }
    }
}

// MARK: - Section Header

struct SectionHeader: View {
    let title: String

    var body: some View {
        HStack(spacing: 8) {
            RoundedRectangle(cornerRadius: 2)
                .fill(Color.plannerPurple)
                .frame(width: 4, height: 16)

            Text(title)
                .font(.sora(12, weight: .bold))
                .tracking(1.2)
        }
        .padding(.bottom, 12)
    }
}

// MARK: - Empty Day

struct EmptyDayView: View {
    var body: some View {
        VStack(spacing: 10) {
            Image(systemName: "sun.max")
                .font(.system(size: 30))
                .foregroundStyle(Color.plannerPurple)

            Text("You got nothing today! Bum.")
                .font(.sora(17, weight: .semibold))
                .foregroundStyle(Color.plannerPurple)

            Text("Enjoy the free time.")
                .font(.sora(14))
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
        .background(Color.plannerSurface)
        .clipShape(
            RoundedRectangle(
                cornerRadius: 18
            )
        )
        .overlay {
            RoundedRectangle(
                cornerRadius: 18
            )
            .stroke(
                Color.plannerBorder,
                lineWidth: 1
            )
        }
    }
}

#Preview {
    ContentView()
}

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
                print("🔥 Firestore update received:", newEvents.count, "events")
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
        VStack(spacing: 20) {
            if let user {
                Text("Welcome, \(user.displayName ?? "User")!")
                    .font(.title)

                Text("Today's events:")
                    .font(.headline)

                if todaysOccurrences.isEmpty {
                    Text("u got nothing today. u bum")
                        .foregroundStyle(.secondary)
                } else {
                    List {
                        ForEach(todaysOccurrences) { occurrence in
                            VStack(alignment: .leading) {
                                Text(occurrence.event.name)
                                    .font(.headline)

                                Text(
                                    occurrence.date.formatted(
                                        date: .omitted,
                                        time: .shortened
                                    )
                                )
                                .foregroundStyle(.secondary)

                                if occurrence.event.repeatable != "never" {
                                    Text(occurrence.event.repeatable)
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                            }
                        }
                    }
                }

                Button("Enable Notifications") {
                    requestNotificationPermission()
                }

                Button("Test Notification") {
                    scheduleTestNotification()
                }

                Button("Sign Out") {
                    do {
                        try FirebaseService.shared.signOut()
                        self.user = nil
                        self.events = []
                    } catch {
                        self.errorMessage = error.localizedDescription
                    }
                }

                if let errorMessage {
                    Text(errorMessage)
                        .foregroundStyle(.red)
                }

            } else {
                Text("Planner.io")
                    .font(.largeTitle)
                    .bold()

                Button("Sign in with Google") {
                    signIn()
                }

                if let errorMessage {
                    Text(errorMessage)
                        .foregroundStyle(.red)
                }
            }
        }
        .padding()
        .onAppear {
            user = Auth.auth().currentUser

            if user != nil {
                startEventListener()
            }
        }
    }

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
            let rootViewController = windowScene.windows.first?.rootViewController
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

    private func requestNotificationPermission() {
        UNUserNotificationCenter.current().requestAuthorization(
            options: [.alert, .sound, .badge]
        ) { granted, error in

            if let error {
                print("Notification permission error:", error)
                return
            }

            print("Notifications allowed:", granted)
        }
    }

    private func scheduleTestNotification() {
        let center = UNUserNotificationCenter.current()

        let content = UNMutableNotificationContent()
        content.title = "Calendar Test"
        content.body = "If you see this, calendar triggers work!"
        content.sound = .default

        let date = Calendar.current.date(
            byAdding: .minute,
            value: 2,
            to: Date()
        )!

        let components = Calendar.current.dateComponents(
            [.year, .month, .day, .hour, .minute],
            from: date
        )

        let trigger = UNCalendarNotificationTrigger(
            dateMatching: components,
            repeats: false
        )

        let request = UNNotificationRequest(
            identifier: "calendar-test",
            content: content,
            trigger: trigger
        )

        center.add(request) { error in
            if let error {
                print("❌ Calendar test error:", error)
            } else {
                print("✅ Calendar test added")
            }
        }
    }
}

#Preview {
    ContentView()
}

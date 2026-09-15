//
//  PlannerNotificationsApp.swift
//  PlannerNotifications
//
//  Created by Ryan on 9/14/26.
//

import SwiftUI
import FirebaseCore
import GoogleSignIn
import UserNotifications

@main
struct PlannerNotificationsApp: App {

    init() {
        FirebaseApp.configure()

        UNUserNotificationCenter.current().delegate =
            NotificationDelegate.shared
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .onOpenURL { url in
                    GIDSignIn.sharedInstance.handle(url)
                }
        }
    }
}

final class NotificationDelegate: NSObject, UNUserNotificationCenterDelegate {

    static let shared = NotificationDelegate()

    private override init() {
        super.init()
    }

    // Notification arrives while the app is open.
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification
    ) async -> UNNotificationPresentationOptions {
        return [.banner, .sound]
    }

    // User taps a notification.
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse
    ) async {
        let userInfo = response.notification.request.content.userInfo

        guard
            let urlString = userInfo["url"] as? String,
            let url = URL(string: urlString)
        else {
            return
        }

        await MainActor.run {
            UIApplication.shared.open(url)
        }
    }
}

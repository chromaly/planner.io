//
//  NotificationService.swift
//  PlannerNotifications
//
//  Created by Ryan on 9/15/26.
//

import Foundation
import UserNotifications
import UIKit

final class NotificationService {

    static let shared = NotificationService()

    private let center = UNUserNotificationCenter.current()

    private let reminderOffsets: [(TimeInterval, String)] = [
        (3600, "in 1 hour"),
        (1800, "in 30 minutes"),
        (900, "in 15 minutes"),
        (300, "in 5 minutes"),
        (60, "in 1 minute")
    ]

    private init() {}

    func requestPermission() async throws -> Bool {
        try await center.requestAuthorization(
            options: [.alert, .sound, .badge]
        )
    }

    func schedule(
        occurrences: [EventOccurrence]
    ) {

        
        let occurrencesToSchedule = Array(
            occurrences.prefix(12)
        )

        for occurrence in occurrencesToSchedule {

            for (offset, label) in reminderOffsets {

                let notificationDate =
                    occurrence.date.addingTimeInterval(-offset)

                guard notificationDate > Date() else {
                    continue
                }

                let secondsUntilNotification =
                    notificationDate.timeIntervalSinceNow

                guard secondsUntilNotification > 0 else {
                    continue
                }
                
                let flavorTexts = [
                    "Lock in.",
                    "You got this.",
                    "Don't forget about this one.",
                    "Future you will thank you.",
                    "It's almost time.",
                    "Consider this your warning.",
                    "Clock's ticking.",
                    "Your calendar has spoken.",
                    "Go do the thing.",
                    "No excuses.",
                    "Get ready.",
                    "You probably shouldn't ignore this.",
                    "Meow.",
                    ">:)"
                ]

                let flavorText = flavorTexts.randomElement()!

                let content = UNMutableNotificationContent()
                
                content.title = "Planner.io"
                content.body =
                    "\(occurrence.event.name) \(label)!\n\(flavorText)"
                content.sound = UNNotificationSound(
                    named: UNNotificationSoundName("notification.wav")
                )

                let url =
                    "https://chromaly.github.io/planner.io/?eventId=\(occurrence.event.id)"

                content.userInfo = [
                    "eventId": occurrence.event.id,
                    "url": url
                ]

                let trigger =
                    UNTimeIntervalNotificationTrigger(
                        timeInterval: secondsUntilNotification,
                        repeats: false
                    )

                let identifier =
                    "planner-event-\(occurrence.id)-\(Int(offset))"

                let request =
                    UNNotificationRequest(
                        identifier: identifier,
                        content: content,
                        trigger: trigger
                    )

                center.add(request) { error in
                    if let error {
                        print(
                            "❌ Notification error:",
                            error
                        )
                    }
                }
            }
        }
    }

    func cancelPlannerNotifications() {

        center.getPendingNotificationRequests {
            requests in

            let plannerRequests = requests
                .filter {
                    $0.identifier.hasPrefix("planner-event-")
                }
                .map(\.identifier)

            self.center.removePendingNotificationRequests(
                withIdentifiers: plannerRequests
            )
        }
    }

    func reschedule(
        occurrences: [EventOccurrence]
    ) {

        cancelPlannerNotifications()

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            self.schedule(
                occurrences: occurrences
            )
        }
    }
}

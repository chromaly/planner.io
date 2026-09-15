//
//  EventScheduler.swift
//  PlannerNotifications
//
//  Created by Ryan on 9/15/26.
//

import Foundation

final class EventScheduler {

    static let shared = EventScheduler()

    private init() {}

    func generateUpcomingOccurrences(
        for event: Event,
        from now: Date = Date(),
        numberOfOccurrences: Int = 20
    ) -> [EventOccurrence] {

        var occurrences: [EventOccurrence] = []
        let calendar = Calendar.current
        var currentDate = event.startTime

        while currentDate < now {
            switch event.repeatable {
            case "never":
                return []

            case "daily":
                guard let nextDate = calendar.date(
                    byAdding: .day,
                    value: 1,
                    to: currentDate
                ) else {
                    return occurrences
                }
                currentDate = nextDate

            case "weekly":
                guard let nextDate = calendar.date(
                    byAdding: .weekOfYear,
                    value: 1,
                    to: currentDate
                ) else {
                    return occurrences
                }
                currentDate = nextDate

            case "monthly":
                guard let nextDate = calendar.date(
                    byAdding: .month,
                    value: 1,
                    to: currentDate
                ) else {
                    return occurrences
                }
                currentDate = nextDate

            default:
                return occurrences
            }
        }

        while occurrences.count < numberOfOccurrences {

            occurrences.append(
                EventOccurrence(
                    id: "\(event.id)-\(currentDate.timeIntervalSince1970)",
                    event: event,
                    date: currentDate
                )
            )

            switch event.repeatable {
            case "never":
                return occurrences

            case "daily":
                guard let nextDate = calendar.date(
                    byAdding: .day,
                    value: 1,
                    to: currentDate
                ) else {
                    return occurrences
                }
                currentDate = nextDate

            case "weekly":
                guard let nextDate = calendar.date(
                    byAdding: .weekOfYear,
                    value: 1,
                    to: currentDate
                ) else {
                    return occurrences
                }
                currentDate = nextDate

            case "monthly":
                guard let nextDate = calendar.date(
                    byAdding: .month,
                    value: 1,
                    to: currentDate
                ) else {
                    return occurrences
                }
                currentDate = nextDate

            default:
                return occurrences
            }
        }

        return occurrences
    }

    func generateUpcomingOccurrences(
        for events: [Event],
        from now: Date = Date()
    ) -> [EventOccurrence] {

        events
            .flatMap {
                generateUpcomingOccurrences(
                    for: $0,
                    from: now
                )
            }
            .sorted {
                $0.date < $1.date
            }
    }
}

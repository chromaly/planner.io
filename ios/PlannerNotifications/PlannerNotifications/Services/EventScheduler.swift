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

    // MARK: - Single Event

    func generateUpcomingOccurrences(
        for event: Event,
        from now: Date = Date(),
        numberOfOccurrences: Int = 20
    ) -> [EventOccurrence] {

        switch event.recurrence {
        case .never:
            guard event.startTime >= now else {
                return []
            }

            return [
                EventOccurrence(
                    id: "\(event.id)-\(event.startTime.timeIntervalSince1970)",
                    event: event,
                    date: event.startTime
                )
            ]

        case .daily:
            return generateDailyOccurrences(
                for: event,
                from: now,
                numberOfOccurrences: numberOfOccurrences
            )

        case .weekly(let days):
            return generateWeeklyOccurrences(
                for: event,
                days: days,
                from: now,
                numberOfOccurrences: numberOfOccurrences
            )

        case .monthly(let dayOfMonth):
            return generateMonthlyOccurrences(
                for: event,
                dayOfMonth: dayOfMonth,
                from: now,
                numberOfOccurrences: numberOfOccurrences
            )
        }
    }

    // MARK: - Daily

    private func generateDailyOccurrences(
        for event: Event,
        from now: Date,
        numberOfOccurrences: Int
    ) -> [EventOccurrence] {

        let calendar = Calendar.current
        var occurrences: [EventOccurrence] = []

        var currentDate = event.startTime

        while currentDate < now {
            guard let nextDate = calendar.date(
                byAdding: .day,
                value: 1,
                to: currentDate
            ) else {
                return occurrences
            }

            currentDate = nextDate
        }

        while occurrences.count < numberOfOccurrences {
            occurrences.append(
                makeOccurrence(
                    for: event,
                    at: currentDate
                )
            )

            guard let nextDate = calendar.date(
                byAdding: .day,
                value: 1,
                to: currentDate
            ) else {
                break
            }

            currentDate = nextDate
        }

        return occurrences
    }

    // MARK: - Weekly

    private func generateWeeklyOccurrences(
        for event: Event,
        days: [Weekday],
        from now: Date,
        numberOfOccurrences: Int
    ) -> [EventOccurrence] {

        guard !days.isEmpty else {
            return []
        }

        let calendar = Calendar.current

        let selectedWeekdays = Set(
            days.compactMap { weekdayNumber(for: $0) }
        )

        guard !selectedWeekdays.isEmpty else {
            return []
        }

        var occurrences: [EventOccurrence] = []

        // Start at the calendar day containing the event's original
        // start time. This preserves the original time of day.
        var currentDay = calendar.startOfDay(
            for: max(event.startTime, now)
        )

        // We search day-by-day. This is simple and reliable, and
        // numberOfOccurrences is small.
        while occurrences.count < numberOfOccurrences {

            let weekday = calendar.component(
                .weekday,
                from: currentDay
            )

            if selectedWeekdays.contains(weekday) {
                let timeComponents = calendar.dateComponents(
                    [.hour, .minute, .second],
                    from: event.startTime
                )

                var occurrenceComponents = calendar.dateComponents(
                    [.year, .month, .day],
                    from: currentDay
                )

                occurrenceComponents.hour = timeComponents.hour
                occurrenceComponents.minute = timeComponents.minute
                occurrenceComponents.second = timeComponents.second

                if let occurrenceDate = calendar.date(
                    from: occurrenceComponents
                ),
                occurrenceDate >= event.startTime,
                occurrenceDate >= now {

                    occurrences.append(
                        makeOccurrence(
                            for: event,
                            at: occurrenceDate
                        )
                    )
                }
            }

            guard let nextDay = calendar.date(
                byAdding: .day,
                value: 1,
                to: currentDay
            ) else {
                break
            }

            currentDay = nextDay
        }

        return occurrences
    }

    // MARK: - Monthly

    private func generateMonthlyOccurrences(
        for event: Event,
        dayOfMonth: Int,
        from now: Date,
        numberOfOccurrences: Int
    ) -> [EventOccurrence] {

        guard (1...31).contains(dayOfMonth) else {
            return []
        }

        let calendar = Calendar.current
        var occurrences: [EventOccurrence] = []

        var currentMonth = calendar.date(
            from: calendar.dateComponents(
                [.year, .month],
                from: max(event.startTime, now)
            )
        )!

        while occurrences.count < numberOfOccurrences {

            var components = calendar.dateComponents(
                [.year, .month],
                from: currentMonth
            )

            components.day = dayOfMonth

            let timeComponents = calendar.dateComponents(
                [.hour, .minute, .second],
                from: event.startTime
            )

            components.hour = timeComponents.hour
            components.minute = timeComponents.minute
            components.second = timeComponents.second

            if let occurrenceDate = calendar.date(
                from: components
            ),
            occurrenceDate >= event.startTime,
            occurrenceDate >= now {

                occurrences.append(
                    makeOccurrence(
                        for: event,
                        at: occurrenceDate
                    )
                )
            }

            guard let nextMonth = calendar.date(
                byAdding: .month,
                value: 1,
                to: currentMonth
            ) else {
                break
            }

            currentMonth = nextMonth
        }

        return occurrences
    }

    // MARK: - All Events

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

    // MARK: - Helpers

    private func makeOccurrence(
        for event: Event,
        at date: Date
    ) -> EventOccurrence {

        EventOccurrence(
            id: "\(event.id)-\(date.timeIntervalSince1970)",
            event: event,
            date: date
        )
    }

    private func weekdayNumber(
        for weekday: Weekday
    ) -> Int? {

        switch weekday {
        case .sunday:
            return 1
        case .monday:
            return 2
        case .tuesday:
            return 3
        case .wednesday:
            return 4
        case .thursday:
            return 5
        case .friday:
            return 6
        case .saturday:
            return 7
        }
    }
}

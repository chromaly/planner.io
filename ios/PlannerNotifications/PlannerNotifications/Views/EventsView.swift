import SwiftUI
import FirebaseAuth

struct EventsView: View {
    let events: [Event]
    let deadlines: [Deadline]
    let groups: [PlannerGroup]

    @State private var selectedDate = Calendar.current.startOfDay(
        for: Date()
    )

    @Environment(\.plannerTheme) private var theme

    private var itemsForSelectedDay: [PlannerItem] {
        let calendar = Calendar.current

        let eventItems = EventScheduler.shared
            .generateUpcomingOccurrences(
                for: events,
                from: calendar.startOfDay(for: selectedDate)
            )
            .filter {
                calendar.isDate(
                    $0.date,
                    inSameDayAs: selectedDate
                )
            }
            .map {
                PlannerItem.event($0)
            }

        let deadlineItems = deadlines
            .filter {
                calendar.isDate(
                    $0.dueTime,
                    inSameDayAs: selectedDate
                )
            }
            .map {
                PlannerItem.deadline($0)
            }

        return (eventItems + deadlineItems)
            .sorted {
                $0.date < $1.date
            }
    }

    private var upcomingItems: [PlannerItem] {
        let calendar = Calendar.current

        if calendar.isDateInToday(selectedDate) {
            let now = Date()

            return itemsForSelectedDay.filter { item in
                switch item {
                case .event(let occurrence):
                    // All-day events remain upcoming for the entire day.
                    if occurrence.event.allDay {
                        return true
                    }

                    return occurrence.date >= now

                case .deadline(let deadline):
                    return deadline.dueTime >= now
                }
            }
        }

        if selectedDate > calendar.startOfDay(for: Date()) {
            return itemsForSelectedDay
        }

        return []
    }

    private var pastItems: [PlannerItem] {
        let calendar = Calendar.current

        if calendar.isDateInToday(selectedDate) {
            let now = Date()

            return itemsForSelectedDay.filter { item in
                switch item {
                case .event(let occurrence):
                    if occurrence.event.allDay {
                        return false
                    }

                    return occurrence.date < now

                case .deadline(let deadline):
                    return deadline.dueTime < now
                }
            }
        }

        if selectedDate < calendar.startOfDay(for: Date()) {
            return itemsForSelectedDay
        }

        return []
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {

                header

                // MARK: Upcoming

                if !upcomingItems.isEmpty {
                    SectionHeader(title: "UPCOMING")

                    VStack(spacing: 12) {
                        ForEach(upcomingItems) { item in
                            card(for: item)
                        }
                    }
                    .padding(.bottom, 28)
                }

                // MARK: Past

                if !pastItems.isEmpty {
                    SectionHeader(
                        title: "PAST",
                        subdued: true
                    )

                    VStack(spacing: 12) {
                        ForEach(pastItems) { item in
                            card(for: item)
                                .opacity(0.65)
                        }
                    }
                }

                if itemsForSelectedDay.isEmpty {
                    EmptyDayView()
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 24)
            .padding(.bottom, 36)
        }
    }

    // MARK: - Card

    @ViewBuilder
    private func card(for item: PlannerItem) -> some View {
        switch item {
        case .event(let occurrence):
            EventCard(
                occurrence: occurrence,
                group: group(for: occurrence)
            )

        case .deadline(let deadline):
            EventCard(
                deadline: deadline,
                group: group(for: deadline)
            )
        }
    }

    // MARK: - Header

    private var header: some View {
        VStack(alignment: .leading, spacing: 24) {
            HStack {
                Button {
                    changeDay(by: -1)
                } label: {
                    Image(systemName: "chevron.left")
                        .font(
                            .system(
                                size: 16,
                                weight: .medium
                            )
                        )
                }
                .foregroundStyle(.secondary)

                Spacer()

                VStack(spacing: 5) {
                    Text(
                        selectedDate.formatted(
                            .dateTime.weekday(.wide)
                        )
                    )
                    .font(.sora(30, weight: .bold))

                    Text(
                        selectedDate.formatted(
                            .dateTime.month(.wide).day().year()
                        )
                    )
                    .font(.sora(14, weight: .medium))
                    .foregroundStyle(.secondary)
                }

                Spacer()

                Button {
                    changeDay(by: 1)
                } label: {
                    Image(systemName: "chevron.right")
                        .font(
                            .system(
                                size: 16,
                                weight: .medium
                            )
                        )
                }
                .foregroundStyle(.secondary)
            }
        }
        .padding(.bottom, 30)
    }

    // MARK: - Helpers

    private func changeDay(by amount: Int) {
        guard let newDate = Calendar.current.date(
            byAdding: .day,
            value: amount,
            to: selectedDate
        ) else {
            return
        }

        selectedDate = Calendar.current.startOfDay(
            for: newDate
        )
    }

    private func group(
        for occurrence: EventOccurrence
    ) -> PlannerGroup? {
        guard let groupId = occurrence.event.groupId else {
            return nil
        }

        return groups.first {
            $0.id == groupId
        }
    }

    private func group(
        for deadline: Deadline
    ) -> PlannerGroup? {
        guard let groupId = deadline.groupId else {
            return nil
        }

        return groups.first {
            $0.id == groupId
        }
    }
}

// MARK: - Planner Item

private enum PlannerItem: Identifiable {
    case event(EventOccurrence)
    case deadline(Deadline)

    var id: String {
        switch self {
        case .event(let occurrence):
            return occurrence.id

        case .deadline(let deadline):
            return deadline.id
        }
    }

    var date: Date {
        switch self {
        case .event(let occurrence):
            return occurrence.date

        case .deadline(let deadline):
            return deadline.dueTime
        }
    }
}

// MARK: - Section Header

struct SectionHeader: View {
    let title: String
    var subdued: Bool = false

    @Environment(\.plannerTheme) private var theme

    var body: some View {
        HStack(spacing: 8) {
            RoundedRectangle(cornerRadius: 2)
                .fill(
                    subdued
                        ? theme.accent2.opacity(0.45)
                        : theme.accent2
                )
                .frame(width: 4, height: 16)

            Text(title)
                .font(.sora(12, weight: .bold))
                .tracking(1.2)
                .foregroundStyle(
                    subdued
                        ? .secondary
                        : .primary
                )
        }
        .padding(.bottom, 12)
    }
}

// MARK: - Empty Day

struct EmptyDayView: View {
    @Environment(\.plannerTheme) private var theme

    var body: some View {
        VStack(spacing: 10) {
            Image(systemName: "sun.max")
                .font(.system(size: 30))
                .foregroundStyle(.secondary)

            Text("You got nothing today! Bum.")
                .font(.sora(17, weight: .semibold))

            Text("Enjoy the free time.")
                .font(.sora(14))
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
        .background(theme.surface)
        .clipShape(
            RoundedRectangle(cornerRadius: 18)
        )
        .overlay {
            RoundedRectangle(cornerRadius: 18)
                .stroke(
                    theme.border,
                    lineWidth: 1
                )
        }
    }
}

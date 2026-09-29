import SwiftUI
import FirebaseAuth

struct EventsView: View {
    let events: [Event]
    let groups: [PlannerGroup]

    @State private var selectedDate = Calendar.current.startOfDay(
        for: Date()
    )

    @State private var errorMessage: String?

    @Environment(\.plannerTheme) private var theme
    @Environment(\.openURL) private var openURL

    private var occurrencesForSelectedDay: [EventOccurrence] {
        let calendar = Calendar.current

        return EventScheduler.shared
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
            .sorted {
                $0.date < $1.date
            }
    }

    private var upcomingOccurrences: [EventOccurrence] {
        let calendar = Calendar.current

        if calendar.isDateInToday(selectedDate) {
            let now = Date()

            return occurrencesForSelectedDay.filter {
                $0.date >= now
            }
        }

        if selectedDate > calendar.startOfDay(for: Date()) {
            return occurrencesForSelectedDay
        }

        return []
    }

    private var pastOccurrences: [EventOccurrence] {
        let calendar = Calendar.current

        if calendar.isDateInToday(selectedDate) {
            let now = Date()

            return occurrencesForSelectedDay.filter {
                $0.date < now
            }
        }

        if selectedDate < calendar.startOfDay(for: Date()) {
            return occurrencesForSelectedDay
        }

        return []
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {

                header

                // MARK: Upcoming

                if !upcomingOccurrences.isEmpty {
                    SectionHeader(title: "UPCOMING")

                    VStack(spacing: 12) {
                        ForEach(upcomingOccurrences) { occurrence in
                            EventCard(
                                occurrence: occurrence,
                                group: group(for: occurrence)
                            )
                        }
                    }
                    .padding(.bottom, 28)
                }

                // MARK: Past

                if !pastOccurrences.isEmpty {
                    SectionHeader(
                        title: "PAST",
                        subdued: true
                    )

                    VStack(spacing: 12) {
                        ForEach(pastOccurrences) { occurrence in
                            EventCard(
                                occurrence: occurrence,
                                group: group(for: occurrence)
                            )
                            .opacity(0.65)
                        }
                    }
                }

                if occurrencesForSelectedDay.isEmpty {
                    EmptyDayView()
                }

            }
            .padding(.horizontal, 20)
            .padding(.top, 24)
            .padding(.bottom, 36)
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

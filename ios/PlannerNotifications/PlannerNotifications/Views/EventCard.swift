import SwiftUI

struct EventCard: View {
    let occurrence: EventOccurrence?
    let deadline: Deadline?
    let group: PlannerGroup?

    @Environment(\.plannerTheme) private var theme
    @Environment(\.openURL) private var openURL

    init(
        occurrence: EventOccurrence,
        group: PlannerGroup?
    ) {
        self.occurrence = occurrence
        self.deadline = nil
        self.group = group
    }

    init(
        deadline: Deadline,
        group: PlannerGroup?
    ) {
        self.occurrence = nil
        self.deadline = deadline
        self.group = group
    }

    var body: some View {
        Button {
            openPlannerLink()
        } label: {
            HStack(spacing: 16) {
                VStack(alignment: .leading, spacing: 6) {
                    typeTag

                    Text(timeText)
                        .font(.sora(14, weight: .semibold))
                        .foregroundStyle(.primary)

                    Text(title)
                        .font(.sora(17, weight: .semibold))
                        .foregroundStyle(
                            Color(hex: color)
                        )

                    if let group {
                        HStack(spacing: 6) {
                            Circle()
                                .fill(Color(hex: group.color))
                                .frame(width: 7, height: 7)

                            Text(group.name)
                                .font(.sora(12, weight: .medium))
                                .foregroundStyle(
                                    Color(hex: group.color)
                                )
                        }
                    }

                    if let recurrenceText {
                        Text(recurrenceText)
                            .font(.sora(12))
                            .foregroundStyle(.secondary)
                    }
                }

                Spacer()

                Image(systemName: "arrow.up.right")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(
                        theme.accent2.opacity(0.8)
                    )
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(18)
            .background(theme.surface)
            .clipShape(
                RoundedRectangle(cornerRadius: 16)
            )
            .overlay {
                RoundedRectangle(cornerRadius: 16)
                    .stroke(
                        theme.border,
                        lineWidth: 1
                    )
            }
        }
        .buttonStyle(.plain)
    }

    // MARK: - Display

    private var typeTag: some View {
        Text(occurrence != nil ? "EVENT" : "DEADLINE")
            .font(.sora(9, weight: .bold))
            .tracking(0.8)
            .foregroundStyle(theme.accent2)
            .padding(.horizontal, 7)
            .padding(.vertical, 4)
            .background(
                theme.accent2.opacity(0.1)
            )
            .clipShape(
                RoundedRectangle(cornerRadius: 5)
            )
    }

    private var timeText: String {
        if let occurrence {
            if occurrence.event.allDay {
                return "All day"
            }

            return occurrence.date.formatted(
                date: .omitted,
                time: .shortened
            )
        }

        if let deadline {
            return "Due " + deadline.dueTime.formatted(
                date: .abbreviated,
                time: .shortened
            )
        }

        return ""
    }

    private var title: String {
        occurrence?.event.name ?? deadline?.name ?? ""
    }

    private var color: String {
        occurrence?.event.color ?? deadline?.color ?? ""
    }

    private var recurrenceText: String? {
        guard let event = occurrence?.event else {
            return nil
        }

        switch event.recurrence {
        case .never:
            return nil

        case .daily:
            return "Daily"

        case .weekly(let days):
            return "Weekly · " +
                days
                    .map { $0.rawValue.capitalized }
                    .joined(separator: ", ")

        case .monthly(let dayOfMonth):
            return "Monthly · Day \(dayOfMonth)"
        }
    }

    // MARK: - Link

    private func openPlannerLink() {
        if let occurrence {
            guard let url = URL(
                string:
                    "https://chromaly.github.io/planner.io/?eventId=\(occurrence.event.id)"
            ) else {
                return
            }

            openURL(url)
            return
        }

        if let deadline {
            guard let url = URL(
                string:
                    "https://chromaly.github.io/planner.io/?deadlineId=\(deadline.id)"
            ) else {
                return
            }

            openURL(url)
        }
    }
}

import SwiftUI

struct EventCard: View {
    let occurrence: EventOccurrence
    let group: PlannerGroup?

    @Environment(\.plannerTheme) private var theme
    @Environment(\.openURL) private var openURL

    var body: some View {
        Button {
            guard let url = URL(
                string:
                    "https://chromaly.github.io/planner.io/?eventId=\(occurrence.event.id)"
            ) else {
                return
            }

            openURL(url)
        } label: {
            HStack(spacing: 16) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(
                        occurrence.date.formatted(
                            date: .omitted,
                            time: .shortened
                        )
                    )
                    .font(.sora(14, weight: .semibold))
                    .foregroundStyle(.primary)

                    Text(occurrence.event.name)
                        .font(.sora(17, weight: .semibold))
                        .foregroundStyle(
                            Color(hex: occurrence.event.color)
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

    private var recurrenceText: String? {
        switch occurrence.event.recurrence {
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
}

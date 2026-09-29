import SwiftUI

struct RemindersView: View {
    let events: [Event]
    let groups: [PlannerGroup]

    @State private var reminderView: ReminderView = .importance

    @Environment(\.plannerTheme) private var theme

    var body: some View {
        VStack(spacing: 0) {
            viewPicker

            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    switch reminderView {
                    case .importance:
                        byImportanceView

                    case .group:
                        byGroupView
                    }
                }
                .padding(20)
            }
        }
    }

    // MARK: - View Picker

    private var viewPicker: some View {
        HStack(spacing: 4) {
            reminderButton(
                title: "BY IMPORTANCE",
                view: .importance
            )

            reminderButton(
                title: "BY GROUP",
                view: .group
            )
        }
        .padding(4)
        .background(theme.surface)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay {
            RoundedRectangle(cornerRadius: 12)
                .stroke(theme.border, lineWidth: 1)
        }
        .padding(.horizontal, 20)
        .padding(.top, 12)
        .padding(.bottom, 8)
    }

    private func reminderButton(
        title: String,
        view: ReminderView
    ) -> some View {
        Button {
            reminderView = view
        } label: {
            Text(title)
                .font(.sora(10, weight: .bold))
                .tracking(0.7)
                .foregroundStyle(
                    reminderView == view
                        ? theme.accent2
                        : .secondary
                )
                .frame(maxWidth: .infinity)
                .padding(.vertical, 10)
                .background(
                    reminderView == view
                        ? theme.accent2.opacity(0.12)
                        : Color.clear
                )
                .clipShape(RoundedRectangle(cornerRadius: 9))
        }
        .buttonStyle(.plain)
    }

    // MARK: - By Importance

    private var byImportanceView: some View {
        VStack(alignment: .leading, spacing: 18) {
            ForEach(importanceSections, id: \.title) { section in
                VStack(alignment: .leading, spacing: 6) {
                    Text(section.title.uppercased())
                        .font(.sora(13, weight: .semibold))
                        .tracking(0.8)
                        .foregroundStyle(.secondary)

                    if section.events.isEmpty {
                        Text("None")
                            .font(.sora(13))
                            .foregroundStyle(.secondary.opacity(0.6))
                            .padding(.leading, 8)
                    } else {
                        ForEach(section.events) { event in
                            reminderRow(event: event)
                        }
                    }
                }
            }
        }
    }

    private var importanceSections: [ImportanceSection] {
        [
            ImportanceSection(
                title: "Very Important",
                events: events.filter { $0.importance == "very" }
            ),
            ImportanceSection(
                title: "Somewhat Important",
                events: events.filter { $0.importance == "somewhat" }
            ),
            ImportanceSection(
                title: "Not Too Important",
                events: events.filter { $0.importance == "not too" }
            )
        ]
    }

    // MARK: - By Group

    private var byGroupView: some View {
        VStack(alignment: .leading, spacing: 18) {
            ForEach(groups) { group in
                let groupEvents = events.filter {
                    $0.groupId == group.id
                }

                groupSection(
                    name: group.name,
                    color: group.color,
                    events: groupEvents
                )
            }

            let ungroupedEvents = events.filter {
                $0.groupId == nil
            }

            if !ungroupedEvents.isEmpty {
                groupSection(
                    name: "Ungrouped",
                    color: nil,
                    events: ungroupedEvents
                )
            }
        }
    }

    private func groupSection(
        name: String,
        color: String?,
        events: [Event]
    ) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 7) {
                if let color {
                    Circle()
                        .fill(Color(hex: color))
                        .frame(width: 7, height: 7)
                }

                Text(name.uppercased())
                    .font(.sora(11, weight: .medium))
                    .foregroundStyle(.secondary)
            }

            if events.isEmpty {
                Text("None")
                    .font(.sora(13))
                    .foregroundStyle(.secondary.opacity(0.6))
                    .padding(.leading, 8)
            } else {
                ForEach(events) { event in
                    reminderRow(event: event)
                }
            }
        }
    }

    // MARK: - Event Row

    private func reminderRow(event: Event) -> some View {
        let eventGroup = groups.first {
            $0.id == event.groupId
        }

        return Button {
            openEvent(event)
        } label: {
            HStack(spacing: 14) {
                ReminderColorIndicator(
                    eventColor: event.color,
                    groupColor: eventGroup?.color
                )

                Text(event.name)
                    .font(.sora(16, weight: .medium))
                    .foregroundStyle(.primary)
                    .lineLimit(1)

                Spacer()

                Text(eventDateText(event))
                    .font(.sora(13, weight: .regular))
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .background(theme.surface)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay {
                RoundedRectangle(cornerRadius: 12)
                    .stroke(theme.border, lineWidth: 1)
            }
        }
        .buttonStyle(.plain)
    }

    // MARK: - Helpers

    private func groupColor(for event: Event) -> String? {
        guard let groupId = event.groupId else {
            return nil
        }

        return groups.first {
            $0.id == groupId
        }?.color
    }

    private func openEvent(_ event: Event) {
        guard let url = URL(
            string:
                "https://chromaly.github.io/planner.io/?eventId=\(event.id)"
        ) else {
            return
        }

        UIApplication.shared.open(url)
    }
}

// MARK: - Supporting Types

private enum ReminderView {
    case importance
    case group
}

private struct ImportanceSection {
    let title: String
    let events: [Event]
}

private struct ReminderColorIndicator: View {
    let eventColor: String
    let groupColor: String?

    var body: some View {
        ZStack {
            Circle()
                .fill(Color(hex: eventColor))

            if let groupColor {
                Circle()
                    .fill(Color(hex: groupColor))
                    .mask {
                        Triangle()
                    }
            }
        }
        .frame(width: 12, height: 12)
        .clipShape(Circle())
    }
}

private struct Triangle: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()

        path.move(to: CGPoint(
            x: rect.maxX,
            y: rect.minY
        ))

        path.addLine(to: CGPoint(
            x: rect.maxX,
            y: rect.maxY
        ))

        path.addLine(to: CGPoint(
            x: rect.minX,
            y: rect.minY
        ))

        path.closeSubpath()

        return path
    }
}

private func eventDateText(_ event: Event) -> String {
    event.startTime.formatted(
        .dateTime
            .month(.abbreviated)
            .day()
    )
}

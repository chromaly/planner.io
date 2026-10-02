import SwiftUI

struct RemindersView: View {
    let events: [Event]
    let deadlines: [Deadline]
    let groups: [PlannerGroup]

    @State private var reminderView: ReminderView = .today
    @State private var showEvents = true
    @State private var showDeadlines = true
    @State private var hideCompletedDeadlines = false

    @Environment(\.plannerTheme) private var theme

    private var visibleDeadlines: [Deadline] {
        guard showDeadlines else {
            return []
        }

        if hideCompletedDeadlines {
            return deadlines.filter { !$0.completed }
        }

        return deadlines
    }

    private var visibleEvents: [Event] {
        showEvents ? events : []
    }

    private var reminderItems: [ReminderItem] {
        getReminderItems(
            events: visibleEvents,
            deadlines: visibleDeadlines
        )
    }

    var body: some View {
        VStack(spacing: 0) {
            filters

            viewPicker

            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    switch reminderView {
                    case .today:
                        todayView

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

    // MARK: - Filters

    private var filters: some View {
        HStack(spacing: 8) {
            filterButton(
                title: "EVENTS",
                isOn: showEvents
            ) {
                showEvents.toggle()
            }

            filterButton(
                title: "DEADLINES",
                isOn: showDeadlines
            ) {
                showDeadlines.toggle()
            }

            if showDeadlines {
                filterButton(
                    title: "HIDE COMPLETED",
                    isOn: hideCompletedDeadlines
                ) {
                    hideCompletedDeadlines.toggle()
                }
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 12)
        .padding(.bottom, 4)
    }

    private func filterButton(
        title: String,
        isOn: Bool,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            Text(title)
                .font(.sora(9, weight: .bold))
                .tracking(0.6)
                .foregroundStyle(
                    isOn
                        ? theme.accent2
                        : .secondary
                )
                .padding(.horizontal, 9)
                .padding(.vertical, 7)
                .background(
                    isOn
                        ? theme.accent2.opacity(0.12)
                        : theme.surface
                )
                .clipShape(
                    RoundedRectangle(cornerRadius: 8)
                )
                .overlay {
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(
                            theme.border,
                            lineWidth: 1
                        )
                }
        }
        .buttonStyle(.plain)
    }

    // MARK: - View Picker

    private var viewPicker: some View {
        HStack(spacing: 4) {
            reminderButton(
                title: "TODAY",
                view: .today
            )

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
        .clipShape(
            RoundedRectangle(cornerRadius: 12)
        )
        .overlay {
            RoundedRectangle(cornerRadius: 12)
                .stroke(
                    theme.border,
                    lineWidth: 1
                )
        }
        .padding(.horizontal, 20)
        .padding(.top, 4)
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
                .clipShape(
                    RoundedRectangle(cornerRadius: 9)
                )
        }
        .buttonStyle(.plain)
    }

    // MARK: - Today

    private var todayView: some View {
        let items = reminderItems.filter {
            Calendar.current.isDateInToday($0.date)
        }

        return VStack(alignment: .leading, spacing: 6) {
            if items.isEmpty {
                emptyView
            } else {
                ForEach(items) { item in
                    reminderRow(item)
                }
            }
        }
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

                    if section.items.isEmpty {
                        Text("None")
                            .font(.sora(13))
                            .foregroundStyle(
                                .secondary.opacity(0.6)
                            )
                            .padding(.leading, 8)
                    } else {
                        ForEach(section.items) { item in
                            reminderRow(item)
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
                items: reminderItems.filter {
                    $0.importance == "very"
                }
            ),
            ImportanceSection(
                title: "Somewhat Important",
                items: reminderItems.filter {
                    $0.importance == "somewhat"
                }
            ),
            ImportanceSection(
                title: "Not Too Important",
                items: reminderItems.filter {
                    $0.importance == "not too"
                }
            )
        ]
    }

    // MARK: - By Group

    private var byGroupView: some View {
        VStack(alignment: .leading, spacing: 18) {
            ForEach(groups) { group in
                let groupItems = reminderItems.filter {
                    $0.groupId == group.id
                }

                groupSection(
                    name: group.name,
                    color: group.color,
                    items: groupItems
                )
            }

            let ungroupedItems = reminderItems.filter {
                $0.groupId == nil
            }

            if !ungroupedItems.isEmpty {
                groupSection(
                    name: "Ungrouped",
                    color: nil,
                    items: ungroupedItems
                )
            }
        }
    }

    private func groupSection(
        name: String,
        color: String?,
        items: [ReminderItem]
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

            if items.isEmpty {
                Text("None")
                    .font(.sora(13))
                    .foregroundStyle(
                        .secondary.opacity(0.6)
                    )
                    .padding(.leading, 8)
            } else {
                ForEach(items) { item in
                    reminderRow(item)
                }
            }
        }
    }

    // MARK: - Reminder Row

    private func reminderRow(
        _ item: ReminderItem
    ) -> some View {
        Button {
            openItem(item)
        } label: {
            HStack(spacing: 14) {
                ReminderColorIndicator(
                    eventColor: item.color,
                    groupColor: groupColor(
                        for: item.groupId
                    )
                )

                VStack(
                    alignment: .leading,
                    spacing: 3
                ) {
                    HStack(spacing: 7) {
                        Text(item.name)
                            .font(
                                .sora(
                                    16,
                                    weight: .medium
                                )
                            )
                            .foregroundStyle(.primary)
                            .lineLimit(1)

                        Text(
                            item.kind == .event
                                ? "EVENT"
                                : "DEADLINE"
                        )
                        .font(
                            .sora(
                                8,
                                weight: .bold
                            )
                        )
                        .tracking(0.5)
                        .foregroundStyle(
                            theme.accent2
                        )
                        .padding(
                            .horizontal,
                            5
                        )
                        .padding(
                            .vertical,
                            3
                        )
                        .background(
                            theme.accent2
                                .opacity(0.1)
                        )
                        .clipShape(
                            RoundedRectangle(
                                cornerRadius: 4
                            )
                        )
                    }

                    Text(item.dateText)
                        .font(.sora(12))
                        .foregroundStyle(.secondary)
                }

                Spacer()
            }
            .frame(
                maxWidth: .infinity,
                alignment: .leading
            )
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .background(theme.surface)
            .clipShape(
                RoundedRectangle(cornerRadius: 12)
            )
            .overlay {
                RoundedRectangle(cornerRadius: 12)
                    .stroke(
                        theme.border,
                        lineWidth: 1
                    )
            }
            .opacity(
                item.completed
                    ? 0.4
                    : 1
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - Helpers

    private func getReminderItems(
        events: [Event],
        deadlines: [Deadline]
    ) -> [ReminderItem] {
        let eventItems = events.map {
            ReminderItem(event: $0)
        }

        let deadlineItems = deadlines.map {
            ReminderItem(deadline: $0)
        }

        return (eventItems + deadlineItems)
            .sorted {
                $0.date < $1.date
            }
    }

    private func groupColor(
        for groupId: String?
    ) -> String? {
        guard let groupId else {
            return nil
        }

        return groups.first {
            $0.id == groupId
        }?.color
    }

    private func openItem(
        _ item: ReminderItem
    ) {
        let urlString: String

        switch item.kind {
        case .event:
            urlString =
                "https://chromaly.github.io/planner.io/?eventId=\(item.id)"

        case .deadline:
            urlString =
                "https://chromaly.github.io/planner.io/?deadlineId=\(item.id)"
        }

        guard let url = URL(
            string: urlString
        ) else {
            return
        }

        UIApplication.shared.open(url)
    }

    private var emptyView: some View {
        VStack(spacing: 10) {
            Image(systemName: "checkmark.circle")
                .font(.system(size: 30))
                .foregroundStyle(.secondary)

            Text("Nothing here!")
                .font(.sora(17, weight: .semibold))

            Text("You're all caught up.")
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

// MARK: - Reminder Item

private struct ReminderItem: Identifiable {
    enum Kind {
        case event
        case deadline
    }

    let id: String
    let name: String
    let date: Date
    let importance: String
    let color: String
    let groupId: String?
    let completed: Bool
    let kind: Kind

    init(event: Event) {
        self.id = event.id
        self.name = event.name
        self.date = event.startTime
        self.importance = event.importance
        self.color = event.color
        self.groupId = event.groupId
        self.completed = false
        self.kind = .event
    }

    init(deadline: Deadline) {
        self.id = deadline.id
        self.name = deadline.name
        self.date = deadline.dueTime
        self.importance = deadline.importance
        self.color = deadline.color
        self.groupId = deadline.groupId
        self.completed = deadline.completed
        self.kind = .deadline
    }

    var dateText: String {
        switch kind {
        case .event:
            return date.formatted(
                .dateTime
                    .month(.abbreviated)
                    .day()
            )

        case .deadline:
            return "Due " + date.formatted(
                .dateTime
                    .month(.abbreviated)
                    .day()
                    .hour()
                    .minute()
            )
        }
    }
}

// MARK: - Supporting Types

private enum ReminderView {
    case today
    case importance
    case group
}

private struct ImportanceSection {
    let title: String
    let items: [ReminderItem]
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

        path.move(
            to: CGPoint(
                x: rect.maxX,
                y: rect.minY
            )
        )

        path.addLine(
            to: CGPoint(
                x: rect.maxX,
                y: rect.maxY
            )
        )

        path.addLine(
            to: CGPoint(
                x: rect.minX,
                y: rect.minY
            )
        )

        path.closeSubpath()

        return path
    }
}

import SwiftUI

struct NotesView: View {
    let dailyNotes: [DailyNote]

    @State private var mode: NotesMode = .byDay

    @State private var draftsByDate: [String: String] = [:]

    @State private var saveTasks: [String: Task<Void, Never>] = [:]

    @State private var errorMessage: String?

    @FocusState private var focusedDate: String?

    @Environment(\.plannerTheme) private var theme

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                header
                modePicker

                if mode == .byDay {
                    byDayView
                } else {
                    byTopicView
                }

                if let errorMessage {
                    Text(errorMessage)
                        .font(.sora(12))
                        .foregroundStyle(.red)
                        .padding(.top, 16)
                }
            }
            .toolbar {
                ToolbarItemGroup(
                    placement: .keyboard
                ) {
                    Spacer()

                    Button("Done") {
                        focusedDate = nil
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 18)
            .padding(.bottom, 36)
        }
        .onDisappear {
            for task in saveTasks.values {
                task.cancel()
            }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 5) {
            Text("Notes")
                .font(.sora(27, weight: .bold))

            Text("Everything your brain can't hold.")
                .font(.sora(14))
                .foregroundStyle(.secondary)
        }
        .padding(.bottom, 24)
    }

    private var modePicker: some View {
        HStack(spacing: 4) {
            modeButton(
                title: "BY DAY",
                mode: .byDay
            )

            modeButton(
                title: "BY TOPIC",
                mode: .byTopic
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
        .padding(.bottom, 28)
    }

    private func modeButton(
        title: String,
        mode: NotesMode
    ) -> some View {
        Button {
            self.mode = mode
        } label: {
            Text(title)
                .font(.sora(11, weight: .bold))
                .tracking(1)
                .foregroundStyle(
                    self.mode == mode
                        ? theme.accent2
                        : .secondary
                )
                .frame(maxWidth: .infinity)
                .padding(.vertical, 11)
                .background(
                    self.mode == mode
                        ? theme.accent2.opacity(0.12)
                        : Color.clear
                )
                .clipShape(
                    RoundedRectangle(cornerRadius: 9)
                )
        }
        .buttonStyle(.plain)
    }

    private var byDayView: some View {
        VStack(alignment: .leading, spacing: 32) {
            daySection(
                date: todayDateString,
                isToday: true
            )

            ForEach(
                olderNotes,
                id: \.date
            ) { note in
                daySection(
                    date: note.date,
                    isToday: false
                )
            }
        }
    }

    private func daySection(
        date: String,
        isToday: Bool
    ) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text(formattedDate(date))
                    .font(.sora(17, weight: .semibold))

                Spacer()

                if hasNotes(for: date) {
                    Button {
                        deleteNote(for: date)
                    } label: {
                        Image(systemName: "trash")
                            .font(
                                .system(
                                    size: 13,
                                    weight: .medium
                                )
                            )
                            .foregroundStyle(.secondary)
                    }
                    .buttonStyle(.plain)
                }
            }

            noteEditor(
                for: date,
                placeholder: isToday
                    ? "Start writing..."
                    : nil
            )
        }
    }

    private func noteEditor(
        for date: String,
        placeholder: String?
    ) -> some View {
        let text = Binding<String>(
            get: {
                draftsByDate[date] ?? getNoteContent(
                    for: date
                )
            },
            set: { newValue in
                handleChange(
                    date: date,
                    content: newValue
                )
            }
        )

        return TextField(
            placeholder ?? "",
            text: text,
            axis: .vertical
        )
        .focused($focusedDate, equals: date)
        .font(.sora(15))
        .foregroundStyle(.primary)
        .lineSpacing(5)
        .lineLimit(10...100)
        .frame(
            maxWidth: .infinity,
            alignment: .leading
        )
        .padding(16)
        .background(theme.surface)
        .clipShape(
            RoundedRectangle(cornerRadius: 14)
        )
        .overlay {
            RoundedRectangle(cornerRadius: 14)
                .stroke(
                    theme.border,
                    lineWidth: 1
                )
        }
    }

    private var byTopicView: some View {
        let groups = topicGroups

        return VStack(alignment: .leading, spacing: 28) {
            if groups.isEmpty {
                emptyTopicView
            } else {
                ForEach(
                    groups,
                    id: \.topic
                ) { group in
                    VStack(
                        alignment: .leading,
                        spacing: 10
                    ) {
                        Text(group.topic)
                            .font(
                                .sora(
                                    17,
                                    weight: .semibold
                                )
                            )

                        VStack(
                            alignment: .leading,
                            spacing: 8
                        ) {
                            ForEach(
                                group.entries
                            ) { entry in
                                Text(entry.content)
                                    .font(.sora(15))
                                    .foregroundStyle(.primary)
                                    .frame(
                                        maxWidth: .infinity,
                                        alignment: .leading
                                    )
                            }
                        }
                        .padding(.top, 3)
                        .overlay(alignment: .top) {
                            Rectangle()
                                .fill(theme.border)
                                .frame(height: 1)
                        }
                    }
                }
            }
        }
    }

    private var emptyTopicView: some View {
        VStack(spacing: 10) {
            Image(systemName: "square.stack.3d.up")
                .font(.system(size: 30))
                .foregroundStyle(.secondary)

            Text("No organized notes")
                .font(
                    .sora(
                        17,
                        weight: .semibold
                    )
                )

            Text(
                "Use the web app to organize your notes by topic."
            )
            .font(.sora(14))
            .foregroundStyle(.secondary)
            .multilineTextAlignment(.center)
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

    // MARK: - Data

    private var todayDateString: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"

        return formatter.string(from: Date())
    }

    private var olderNotes: [DailyNote] {
        dailyNotes
            .filter {
                $0.date != todayDateString
            }
            .sorted {
                $0.date > $1.date
            }
    }

    private func getNoteContent(
        for date: String
    ) -> String {
        dailyNotes
            .first {
                $0.date == date
            }?
            .entries
            .map(\.content)
            .joined(separator: "\n")
            ?? ""
    }

    private func hasNotes(
        for date: String
    ) -> Bool {
        guard let note = dailyNotes.first(
            where: { $0.date == date }
        ) else {
            return false
        }

        return !note.entries.isEmpty
    }

    private func formattedDate(
        _ dateString: String
    ) -> String {
        let parts = dateString
            .split(separator: "-")
            .compactMap {
                Int($0)
            }

        guard parts.count == 3 else {
            return dateString
        }

        var components = DateComponents()
        components.year = parts[0]
        components.month = parts[1]
        components.day = parts[2]

        guard let date = Calendar.current.date(
            from: components
        ) else {
            return dateString
        }

        return date.formatted(
            .dateTime
                .weekday(.wide)
                .month(.wide)
                .day()
                .year()
        )
    }

    private var topicGroups: [TopicGroup] {
        let entries = dailyNotes.flatMap(\.entries)

        let grouped = Dictionary(
            grouping: entries
        ) { entry in
            entry.topic ?? "Unsorted"
        }

        return grouped
            .map {
                TopicGroup(
                    topic: $0.key,
                    entries: $0.value.sorted {
                        $0.createdAt < $1.createdAt
                    }
                )
            }
            .sorted {
                $0.topic.localizedCaseInsensitiveCompare(
                    $1.topic
                ) == .orderedAscending
            }
    }

    // MARK: - Saving

    private func handleChange(
        date: String,
        content: String
    ) {
        draftsByDate[date] = content

        saveTasks[date]?.cancel()

        saveTasks[date] = Task {
            do {
                try await Task.sleep(
                    nanoseconds: 1_500_000_000
                )

                if Task.isCancelled {
                    return
                }

                try await saveNote(
                    date: date,
                    content: content
                )
            } catch is CancellationError {
                return
            } catch {
                await MainActor.run {
                    errorMessage =
                        error.localizedDescription
                }
            }
        }
    }

    private func saveNote(
        date: String,
        content: String
    ) async throws {
        let lines = content
            .components(separatedBy: .newlines)
            .map {
                $0.trimmingCharacters(
                    in: .whitespacesAndNewlines
                )
            }
            .filter {
                !$0.isEmpty
            }

        if lines.isEmpty {
            try await FirebaseService.shared
                .deleteDailyNote(
                    date: date
                )

            await MainActor.run {
                draftsByDate.removeValue(
                    forKey: date
                )
            }

            return
        }

        let existingEntries =
            dailyNotes
                .first {
                    $0.date == date
                }?
                .entries
            ?? []

        let entries: [NoteEntry] =
            lines.enumerated().map {
                index,
                line in

                let existingEntry =
                    index < existingEntries.count
                        ? existingEntries[index]
                        : nil

                return NoteEntry(
                    id:
                        existingEntry?.id
                        ?? UUID().uuidString,
                    content: line,
                    createdAt:
                        existingEntry?.createdAt
                        ?? Date(),
                    topic:
                        existingEntry?.topic
                        ?? nil
                )
            }

        try await FirebaseService.shared
            .saveDailyNote(
                date: date,
                entries: entries
            )

        await MainActor.run {
            draftsByDate.removeValue(
                forKey: date
            )
        }
    }

    private func deleteNote(
        for date: String
    ) {
        saveTasks[date]?.cancel()

        Task {
            do {
                try await FirebaseService.shared
                    .deleteDailyNote(
                        date: date
                    )

                await MainActor.run {
                    draftsByDate.removeValue(
                        forKey: date
                    )
                }
            } catch {
                await MainActor.run {
                    errorMessage =
                        error.localizedDescription
                }
            }
        }
    }
}

private enum NotesMode {
    case byDay
    case byTopic
}

private struct TopicGroup {
    let topic: String
    let entries: [NoteEntry]
}

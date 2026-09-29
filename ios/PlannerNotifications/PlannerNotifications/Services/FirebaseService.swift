import Foundation
import FirebaseAuth
import FirebaseFirestore

final class FirebaseService {

    static let shared = FirebaseService()

    private let db = Firestore.firestore()

    private var eventListener: ListenerRegistration?
    private var groupListener: ListenerRegistration?
    private var notesListener: ListenerRegistration?
    private var settingsListener: ListenerRegistration?
    
    private init() {}

    var currentUser: User? {
        Auth.auth().currentUser
    }

    // MARK: - Events

    func startEventListener(
        onChange: @escaping ([Event]) -> Void,
        onError: @escaping (Error) -> Void
    ) {
        stopEventListener()

        guard let user = currentUser else {
            onChange([])
            return
        }

        let eventsRef = db
            .collection("users")
            .document(user.uid)
            .collection("events")

        eventListener = eventsRef.addSnapshotListener {
            snapshot,
            error in

            if let error {
                onError(error)
                return
            }

            guard let snapshot else {
                onChange([])
                return
            }

            let events: [Event] = snapshot.documents.compactMap {
                document in

                let data = document.data()

                guard
                    let name = data["name"] as? String,
                    let startTimestamp =
                        data["startTime"] as? Timestamp,
                    let duration =
                        data["duration"] as? Int,
                    let recurrenceData =
                        data["recurrence"] as? [String: Any],
                    let importance =
                        data["importance"] as? String,
                    let location =
                        data["location"] as? String,
                    let notes =
                        data["notes"] as? String,
                    let color =
                        data["color"] as? String
                else {
                    return nil
                }

                guard let recurrence =
                    Self.parseRecurrence(recurrenceData)
                else {
                    return nil
                }

                return Event(
                    id: document.documentID,
                    name: name,
                    startTime: startTimestamp.dateValue(),
                    duration: duration,
                    recurrence: recurrence,
                    importance: importance,
                    location: location,
                    notes: notes,
                    color: color,
                    groupId: data["groupId"] as? String
                )
            }

            onChange(events)
        }
    }

    // MARK: - Groups

    func startGroupListener(
        onChange: @escaping ([PlannerGroup]) -> Void,
        onError: @escaping (Error) -> Void
    ) {
        stopGroupListener()

        guard let user = currentUser else {
            onChange([])
            return
        }

        let groupsRef = db
            .collection("users")
            .document(user.uid)
            .collection("groups")

        groupListener = groupsRef.addSnapshotListener {
            snapshot,
            error in

            if let error {
                onError(error)
                return
            }

            guard let snapshot else {
                onChange([])
                return
            }

            let groups: [PlannerGroup] = snapshot.documents.compactMap {
                document in

                let data = document.data()

                guard
                    let name = data["name"] as? String,
                    let color = data["color"] as? String
                else {
                    return nil
                }

                return PlannerGroup(
                    id: document.documentID,
                    name: name,
                    color: color
                )
            }

            onChange(groups)
        }
    }

    // MARK: - Notes
    
    func startNotesListener(
        onChange: @escaping ([DailyNote]) -> Void,
        onError: @escaping (Error) -> Void
    ) {
        stopNotesListener()

        guard let user = currentUser else {
            onChange([])
            return
        }

        let notesRef = db
            .collection("users")
            .document(user.uid)
            .collection("notes")

        notesListener = notesRef.addSnapshotListener {
            snapshot,
            error in

            if let error {
                onError(error)
                return
            }

            guard let snapshot else {
                onChange([])
                return
            }

            let notes: [DailyNote] = snapshot.documents.compactMap {
                document in

                let data = document.data()

                guard
                    let date = data["date"] as? String,
                    let entriesData = data["entries"] as? [[String: Any]]
                else {
                    return nil
                }

                let entries: [NoteEntry] = entriesData.compactMap {
                    entryData in

                    guard
                        let id = entryData["id"] as? String,
                        let content = entryData["content"] as? String,
                        let createdAt =
                            entryData["createdAt"] as? Timestamp
                    else {
                        return nil
                    }

                    return NoteEntry(
                        id: id,
                        content: content,
                        createdAt: createdAt.dateValue(),
                        topic: entryData["topic"] as? String
                    )
                }

                let updatedAt =
                    (data["updatedAt"] as? Timestamp)?
                        .dateValue()
                    ?? Date()

                return DailyNote(
                    id: document.documentID,
                    date: date,
                    entries: entries,
                    updatedAt: updatedAt
                )
            }

            onChange(notes)
        }
    }
    
    // MARK: - Settings
    
    func startSettingsListener(
        onChange: @escaping (PlannerSettings) -> Void,
        onError: @escaping (Error) -> Void
    ) {
        guard let user = currentUser else {
            return
        }

        let settingsRef = db
            .collection("users")
            .document(user.uid)
            .collection("settings")
            .document("preferences")

        settingsListener = settingsRef.addSnapshotListener {
            snapshot,
            error in

            if let error {
                onError(error)
                return
            }

            guard let data = snapshot?.data() else {
                onChange(
                    PlannerSettings(
                        mode: .dark,
                        palette: .tvgirl
                    )
                )
                return
            }

            let mode =
                ThemeMode(
                    rawValue: data["mode"] as? String ?? "dark"
                ) ?? .dark

            let palette =
                Palette(
                    rawValue: data["palette"] as? String ?? "tvgirl"
                ) ?? .tvgirl

            onChange(
                PlannerSettings(
                    mode: mode,
                    palette: palette
                )
            )
        }
    }
    
    // MARK: - Recurrence

    private static func parseRecurrence(
        _ data: [String: Any]
    ) -> Recurrence? {

        guard let type = data["type"] as? String else {
            return nil
        }

        switch type {

        case "never":
            return .never

        case "daily":
            return .daily

        case "weekly":
            guard let dayStrings =
                data["days"] as? [String]
            else {
                return nil
            }

            let days = dayStrings.compactMap {
                Weekday(rawValue: $0)
            }

            guard days.count == dayStrings.count else {
                return nil
            }

            return .weekly(days: days)

        case "monthly":
            guard let dayOfMonth =
                data["dayOfMonth"] as? Int
            else {
                return nil
            }

            guard (1...31).contains(dayOfMonth) else {
                return nil
            }

            return .monthly(dayOfMonth: dayOfMonth)

        default:
            return nil
        }
    }
    
    func saveDailyNote(
        date: String,
        entries: [NoteEntry]
    ) async throws {
        guard let user = currentUser else {
            return
        }

        let noteRef = db
            .collection("users")
            .document(user.uid)
            .collection("notes")
            .document(date)

        let entryData: [[String: Any]] = entries.map { entry in
            [
                "id": entry.id,
                "content": entry.content,
                "createdAt": Timestamp(date: entry.createdAt),
                "topic": entry.topic as Any
            ]
        }

        try await noteRef.setData([
            "date": date,
            "entries": entryData,
            "updatedAt": Timestamp(date: Date())
        ])
    }

    func deleteDailyNote(
        date: String
    ) async throws {
        guard let user = currentUser else {
            return
        }

        let noteRef = db
            .collection("users")
            .document(user.uid)
            .collection("notes")
            .document(date)

        try await noteRef.delete()
    }
    
    func saveSettings(
        mode: ThemeMode,
        palette: Palette
    ) async throws {
        guard let user = currentUser else {
            return
        }

        let settingsRef = db
            .collection("users")
            .document(user.uid)
            .collection("settings")
            .document("preferences")

        try await settingsRef.setData(
            [
                "mode": mode.rawValue,
                "palette": palette.rawValue
            ],
            merge: true
        )
    }
    
    // MARK: - Listener Management

    func stopEventListener() {
        eventListener?.remove()
        eventListener = nil
    }

    func stopGroupListener() {
        groupListener?.remove()
        groupListener = nil
    }
    
    func stopNotesListener() {
        notesListener?.remove()
        notesListener = nil
    }
    
    func stopSettingsListener() {
        settingsListener?.remove()
        settingsListener = nil
    }
    func stopAllListeners() {
        stopEventListener()
        stopGroupListener()
        stopNotesListener()
        stopSettingsListener()
    }

    func signOut() throws {
        stopAllListeners()
        try Auth.auth().signOut()
    }
}

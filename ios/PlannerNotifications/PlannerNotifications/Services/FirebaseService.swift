//
//  FirebaseService.swift
//  PlannerNotifications
//
//  Created by Ryan on 9/15/26.
//
import Foundation
import FirebaseAuth
import FirebaseFirestore

final class FirebaseService {

    static let shared = FirebaseService()

    private let db = Firestore.firestore()
    private var eventListener: ListenerRegistration?

    private init() {}

    var currentUser: User? {
        Auth.auth().currentUser
    }

    func startEventListener(
        onChange: @escaping ([Event]) -> Void,
        onError: @escaping (Error) -> Void
    ) {
        // Stop any existing listener first.
        stopEventListener()

        guard let user = currentUser else {
            onChange([])
            return
        }

        let eventsQuery = db
            .collection("events")
            .whereField("userId", isEqualTo: user.uid)

        eventListener = eventsQuery.addSnapshotListener {
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
                    let repeatable =
                        data["repeatable"] as? String
                else {
                    return nil
                }

                return Event(
                    id: document.documentID,
                    name: name,
                    startTime: startTimestamp.dateValue(),
                    repeatable: repeatable
                )
            }

            onChange(events)
        }
    }

    func stopEventListener() {
        eventListener?.remove()
        eventListener = nil
    }

    func signOut() throws {
        stopEventListener()
        try Auth.auth().signOut()
    }
}

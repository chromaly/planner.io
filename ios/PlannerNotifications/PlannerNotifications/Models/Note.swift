//
//  Note.swift
//  PlannerNotifications
//
//  Created by Ryan on 9/28/26.
//

import Foundation

struct NoteEntry: Identifiable {
    let id: String
    let content: String
    let createdAt: Date
    let topic: String?
}

struct DailyNote: Identifiable {
    let id: String
    let date: String
    let entries: [NoteEntry]
    let updatedAt: Date
}

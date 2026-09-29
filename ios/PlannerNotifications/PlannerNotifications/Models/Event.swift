//
//  Event.swift
//  PlannerNotifications
//
//  Created by Ryan on 9/15/26.
//

import Foundation

enum Weekday: String, Codable {
    case sunday
    case monday
    case tuesday
    case wednesday
    case thursday
    case friday
    case saturday
}

enum Recurrence {
    case never
    case daily
    case weekly(days: [Weekday])
    case monthly(dayOfMonth: Int)
}

struct Event: Identifiable {
    let id: String
    let name: String
    let startTime: Date
    let duration: Int
    let recurrence: Recurrence
    let importance: String
    let location: String
    let notes: String
    let color: String
    let groupId: String?
}

struct EventOccurrence: Identifiable {
    let id: String
    let event: Event
    let date: Date
}

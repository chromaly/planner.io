//
//  Event.swift
//  PlannerNotifications
//
//  Created by Ryan on 9/15/26.
//

import Foundation

struct Event: Identifiable {
    let id: String
    let name: String
    let startTime: Date
    let repeatable: String
}

struct EventOccurrence: Identifiable {
    let id: String
    let event: Event
    let date: Date
}

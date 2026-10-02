//
//  Deadline.swift
//  PlannerNotifications
//
//  Created by Ryan on 10/1/26.
//

import Foundation

struct Deadline: Identifiable {
    let id: String
    let name: String
    let dueTime: Date
    let importance: String
    let notes: String
    let color: String
    let groupId: String?
    let completed: Bool
}

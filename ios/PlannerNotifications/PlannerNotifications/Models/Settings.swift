//
//  Settings.swift
//  PlannerNotifications
//
//  Created by Ryan on 9/28/26.
//

import Foundation

enum ThemeMode: String {
    case dark
    case light
}

enum Palette: String {
    case tvgirl
    case lalaland
}

struct PlannerSettings {
    let mode: ThemeMode
    let palette: Palette
}

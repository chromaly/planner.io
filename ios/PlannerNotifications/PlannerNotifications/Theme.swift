//
//  Theme.swift
//  PlannerNotifications
//
//  Created by Ryan on 9/15/26.
//

import SwiftUI

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(
            in: CharacterSet.alphanumerics.inverted
        )

        var value: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&value)

        let red = Double((value >> 16) & 0xFF) / 255
        let green = Double((value >> 8) & 0xFF) / 255
        let blue = Double(value & 0xFF) / 255

        self.init(red: red, green: green, blue: blue)
    }

    static let plannerPurple = Color(hex: "#A020F0")
    static let plannerBackground = Color(hex: "#0F0F17")
    static let plannerSurface = Color(hex: "#16161F")
    static let plannerBorder = Color(hex: "#2A2433")
}

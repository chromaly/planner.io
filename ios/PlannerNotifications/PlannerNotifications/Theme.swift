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

struct PlannerTheme {
    let mode: ThemeMode
    let palette: Palette

    var background: Color {
        switch mode {
        case .dark:
            return Color(hex: "#0D0D14")
        case .light:
            return Color(hex: "#FAF9F7")
        }
    }

    var surface: Color {
        switch mode {
        case .dark:
            return Color(hex: "#16161F")
        case .light:
            return Color(hex: "#FFFFFF")
        }
    }

    var text: Color {
        switch mode {
        case .dark:
            return .white
        case .light:
            return Color(hex: "#16161F")
        }
    }

    var accent1: Color {
        switch palette {
        case .tvgirl:
            return Color(hex: "#FF2E88")
        case .lalaland:
            return Color(hex: "#FFB627")
        }
    }

    var accent2: Color {
        switch palette {
        case .tvgirl:
            return Color(hex: "#A020F0")
        case .lalaland:
            return Color(hex: "#7B5EDB")
        }
    }

    var border: Color {
        switch mode {
        case .dark:
            return Color.white.opacity(0.10)
        case .light:
            return Color.gray.opacity(0.30)
        }
    }
}

private struct PlannerThemeKey: EnvironmentKey {
    static let defaultValue = PlannerTheme(
        mode: .dark,
        palette: .tvgirl
    )
}

extension EnvironmentValues {
    var plannerTheme: PlannerTheme {
        get {
            self[PlannerThemeKey.self]
        }
        set {
            self[PlannerThemeKey.self] = newValue
        }
    }
}

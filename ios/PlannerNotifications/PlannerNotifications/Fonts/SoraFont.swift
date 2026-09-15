//
//  SoraFont.swift
//  PlannerNotifications
//
//  Created by Ryan on 9/15/26.
//

import SwiftUI

enum SoraWeight {
    case regular
    case medium
    case semibold
    case bold
}

extension Font {
    static func sora(
        _ size: CGFloat,
        weight: SoraWeight = .regular
    ) -> Font {
        switch weight {
        case .regular:
            return .custom("Sora-Regular", size: size)

        case .medium:
            return .custom("Sora-Medium", size: size)

        case .semibold:
            return .custom("Sora-SemiBold", size: size)

        case .bold:
            return .custom("Sora-Bold", size: size)
        }
    }
}

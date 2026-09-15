//
//  EventCard.swift
//  PlannerNotifications
//
//  Created by Ryan on 9/15/26.
//

import SwiftUI

struct EventCard: View {
    let occurrence: EventOccurrence

    @Environment(\.openURL) private var openURL

    var body: some View {
        Button {
            guard let url = URL(
                string:
                    "https://chromaly.github.io/planner.io/?eventId=\(occurrence.event.id)"
            ) else {
                return
            }

            openURL(url)
        } label: {
            HStack(spacing: 16) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(
                        occurrence.date.formatted(
                            date: .omitted,
                            time: .shortened
                        )
                    )
                    .font(.sora(14, weight: .semibold))
                    .foregroundStyle(Color.plannerPurple)

                    Text(occurrence.event.name)
                        .font(.sora(17, weight: .semibold))
                        .foregroundStyle(.primary)

                    if occurrence.event.repeatable != "never" {
                        Text(
                            occurrence.event.repeatable.capitalized
                        )
                        .font(.sora(12))
                        .foregroundStyle(.secondary)
                    }
                }

                Spacer()

                Image(systemName: "arrow.up.right")
                    .font(
                        .system(
                            size: 14,
                            weight: .medium
                        )
                    )
                    .foregroundStyle(
                        Color.plannerPurple.opacity(0.8)
                    )
            }
            .frame(
                maxWidth: .infinity,
                alignment: .leading
            )
            .padding(18)
            .background(Color.plannerSurface)
            .clipShape(
                RoundedRectangle(
                    cornerRadius: 16
                )
            )
            .overlay {
                RoundedRectangle(
                    cornerRadius: 16
                )
                .stroke(
                    Color.plannerBorder,
                    lineWidth: 1
                )
            }
        }
        .buttonStyle(.plain)
    }
}


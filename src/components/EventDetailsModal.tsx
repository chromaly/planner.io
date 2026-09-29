import { useGroups } from "../hooks/useGroups"
import { getEventGroup } from "../services/groups"

import type { Event, Weekday } from "../data_types/event"

type EventDetailsModalProps = {
  event: Event
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}

const weekdayLabels: Record<Weekday, string> = {
  sunday: "Sunday",
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
}

function getRecurrenceText(event: Event) {
  switch (event.recurrence.type) {
    case "never":
      return "Does not repeat"

    case "daily":
      return "Daily"

    case "weekly":
      return `Weekly · ${event.recurrence.days
        .map((day) => weekdayLabels[day])
        .join(", ")}`

    case "monthly":
      return `Monthly · Day ${event.recurrence.dayOfMonth}`
  }
}

export function EventDetailsModal({
  event,
  onClose,
  onEdit,
  onDelete,
}: EventDetailsModalProps) {
  const { groups } = useGroups()

  const group = getEventGroup(event, groups)

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out,scaleIn_0.2s_ease-out]"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-accent-2/40 rounded-xl p-6 w-96 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="text-xl font-bold mb-2"
          style={{ color: event.color }}
        >
          {event.name}
        </h2>

        <p className="text-sm text-text/70 mb-1">
          {event.startTime.toLocaleString()} · {event.duration} min
        </p>

        <p className="text-sm text-text/70 mb-1">
          Location: {event.location || "None"}
        </p>

        <p className="text-sm text-text/70 mb-1">
          Repeats: {getRecurrenceText(event)}
        </p>

        <p className="text-sm mb-1">
          Importance: {event.importance}
        </p>

        <p className="text-sm mb-3 flex items-center gap-2">
          Group:{" "}
          {group ? (
            <>
              <span>{group.name}</span> 
              <span
                className="w-3 h-3 rounded-full inline-block"
                style={{ backgroundColor: group.color }}
              />
            </>
          ) : (
            "None"
          )}
        </p>

        <div className="mb-5">
          <p className="text-sm font-semibold mb-1">Notes</p>

          <div className="bg-background/40 border border-accent-2/20 rounded-lg p-3 min-h-28 max-h-48 overflow-y-auto">
            <p className="text-sm text-text/80 whitespace-pre-wrap">
              {event.notes || "No notes"}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="bg-accent-2 text-text px-3 py-1.5 rounded-lg text-sm transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1"
          >
            Edit Event
          </button>

          <button
            onClick={onDelete}
            className="bg-accent-1 text-text px-3 py-1.5 rounded-lg text-sm transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1"
          >
            Delete Event
          </button>

          <button
            onClick={onClose}
            className="bg-gray-300 px-3 py-1.5 rounded-lg text-sm transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
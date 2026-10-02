import { useEffect, useState } from "react"

import { eventsOverlap } from "../utils/eventUtils"
import type { CreateEventData, Event } from "../data_types/event"

type CalendarImportModalProps = {
  events: CreateEventData[]
  existingEvents: Event[]
  onClose: () => void
  onImport: (events: CreateEventData[]) => Promise<void>
}

export function CalendarImportModal({
  events,
  existingEvents,
  onClose,
  onImport,
}: CalendarImportModalProps) {
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(events.map((_, index) => index))
  )
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    setSelected(new Set(events.map((_, index) => index)))
  }, [events])

  function toggleEvent(index: number) {
    setSelected((current) => {
      const next = new Set(current)

      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }

      return next
    })
  }

  function selectAll() {
    setSelected(new Set(events.map((_, index) => index)))
  }

  function deselectAll() {
    setSelected(new Set())
  }

  function hasConflict(event: CreateEventData) {
    return existingEvents.some((existingEvent) =>
      eventsOverlap(
        {
          id: "",
          ...event,
        },
        existingEvent
      )
    )
  }

  async function handleImport() {
    const selectedEvents = events.filter((_, index) =>
      selected.has(index)
    )

    if (selectedEvents.length === 0) return

    try {
      setImporting(true)
      await onImport(selectedEvents)
      onClose()
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-2xl max-h-[80vh] flex flex-col bg-surface rounded-xl shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-text/10">
          <h2 className="text-2xl font-bold text-accent-2">
            Import Calendar
          </h2>

          <p className="text-sm text-text/60 mt-1">
            Select the events you want to import.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-text/10">
          <span className="text-sm text-text/60">
            {selected.size} of {events.length} selected
          </span>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="text-sm text-accent-2 hover:underline"
            >
              Select All
            </button>

            <button
              type="button"
              onClick={deselectAll}
              className="text-sm text-text/60 hover:text-text"
            >
              Deselect All
            </button>
          </div>
        </div>

        {/* Events */}
        <div className="flex-1 overflow-y-auto p-4">
          {events.length === 0 ? (
            <p className="text-center text-text/50 py-8">
              No events were found in this calendar.
            </p>
          ) : (
            <div className="space-y-2">
              {events.map((event, index) => {
                const conflict = hasConflict(event)

                return (
                  <label
                    key={index}
                    className={`
                      flex items-center gap-3
                      p-3
                      rounded-lg
                      cursor-pointer
                      transition-colors
                      ${
                        selected.has(index)
                          ? "bg-accent-2/10"
                          : "bg-background/30"
                      }
                      hover:bg-accent-2/15
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(index)}
                      onChange={() => toggleEvent(index)}
                      className="w-4 h-4 accent-accent-2"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">
                          {event.name}
                        </p>

                        {conflict && (
                          <span className="text-xs text-yellow-500 flex-shrink-0">
                            ⚠ Conflict
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-text/50 mt-1">
                        {event.startTime.toLocaleDateString()}{" "}
                        ·{" "}
                        {event.startTime.toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}{" "}
                        · {event.duration} min
                      </p>

                      {event.recurrence.type !== "never" && (
                        <p className="text-xs text-text/40 mt-1">
                          Recurring
                        </p>
                      )}
                    </div>
                  </label>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-6 border-t border-text/10">
          <button
            type="button"
            onClick={onClose}
            disabled={importing}
            className="
              px-4 py-2
              rounded-lg
              text-sm
              bg-surface
              border border-text/10
              transition-transform
              duration-200
              [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]
              hover:scale-105
              active:scale-95
              disabled:opacity-40
            "
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleImport}
            disabled={selected.size === 0 || importing}
            className="
              px-4 py-2
              rounded-lg
              text-sm
              bg-accent-2
              transition-transform
              duration-200
              [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]
              hover:scale-105
              active:scale-95
              disabled:opacity-40
              disabled:cursor-not-allowed
            "
          >
            {importing
              ? "Importing..."
              : `Import ${selected.size} Event${
                  selected.size === 1 ? "" : "s"
                }`}
          </button>
        </div>
      </div>
    </div>
  )
}
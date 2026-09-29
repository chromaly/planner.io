import { eventOccursOnDay } from "../utils/eventUtils"
import { useGroups } from "../hooks/useGroups"
import { getEventGroup } from "../services/groups"
import { EventColorIndicator } from "./EventColorIndicator"

import type { Event } from "../data_types/event"

type MonthGridProps = {
  selectedMonth: Date
  events: Event[]
  onDayClick: (day: Date) => void
}

function getMonthGridDays(monthDate: Date): Date[] {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()

  const firstOfMonth = new Date(year, month, 1)
  const startOffset = firstOfMonth.getDay()

  const gridStart = new Date(firstOfMonth)
  gridStart.setDate(gridStart.getDate() - startOffset)

  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    return d
  })
}

export function MonthGrid({
  selectedMonth,
  events,
  onDayClick,
}: MonthGridProps) {

  const { groups } = useGroups()

  const monthDays = getMonthGridDays(selectedMonth)

  return (
    <div
      className="border border-divider/10 rounded-lg overflow-hidden shadow-lg shadow-text/10"
      style={{ height: "600px" }}
    >
      {/* weekday header row */}
      <div className="grid grid-cols-7 border-b border-divider/10 bg-surface">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-center text-xs py-2 text-text/60"
          >
            {day}
          </div>
        ))}
      </div>

      {/* 6x7 grid */}
      <div className="grid grid-cols-7">
        {monthDays.map((day) => {
          const dayEvents = events.filter((event) =>
            eventOccursOnDay(event, day)
          )

          const isCurrentMonth =
            day.getMonth() === selectedMonth.getMonth()

          return (
            <div
              key={day.toDateString()}
              onClick={() => onDayClick(day)}
              className={`border-t border-l border-divider/10 h-24 p-1 cursor-pointer hover:bg-white/5 overflow-hidden ${
                isCurrentMonth ? "" : "opacity-30"
              }`}
            >
              <div className="text-xs mb-1">
                {day.getDate()}
              </div>

              <div className="flex flex-col gap-0.5">
                {dayEvents.slice(0, 3).map((event) => {
                  const group = getEventGroup(event, groups)

                  return (
                    <div
                      key={event.id}
                      className="relative text-[10px] px-1 py-0.5 rounded truncate text-text overflow-hidden transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1"
                    >
                      <div className="absolute inset-0">
                        <EventColorIndicator
                          eventColor={event.color}
                          groupColor={group?.color ?? null}
                          variant="calendar"
                        />
                      </div>

                      <span className="relative z-10">
                        {event.name}
                      </span>
                    </div>
                  )
                })}

                {dayEvents.length > 3 && (
                  <span className="text-[10px] text-text/40 px-1">
                    +{dayEvents.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
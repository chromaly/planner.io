import { eventOccursOnDay } from "../utils/eventUtils"
import { useGroups } from "../hooks/useGroups"
import { getGroup } from "../services/groups"
import { EventColorIndicator } from "./EventColorIndicator"

import type { Event } from "../data_types/event"
import type { Deadline } from "../data_types/deadline"

type MonthGridProps = {
  selectedMonth: Date
  events: Event[]
  deadlines: Deadline[]
  onDayClick: (day: Date) => void
  onDeadlineClick: (deadline: Deadline) => void
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
  deadlines,
  onDayClick,
  onDeadlineClick,
}: MonthGridProps) {
  const { groups } = useGroups()

  const monthDays = getMonthGridDays(selectedMonth)

  return (
    <div
      className="
        border
        border-divider/10
        rounded-lg
        overflow-hidden
        shadow-lg
        shadow-text/10
        h-[720px]
        flex
        flex-col
      "
    >
      {/* Weekday header row */}
      <div className="grid grid-cols-7 border-b border-divider/10 bg-surface flex-shrink-0">
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
      <div className="grid grid-cols-7 grid-rows-6 flex-1 min-h-0">
        {monthDays.map((day) => {
          const dayEvents = events.filter((event) =>
            eventOccursOnDay(event, day)
          )

          const dayDeadlines = deadlines.filter((deadline) => {
            return (
              deadline.dueTime.getFullYear() === day.getFullYear() &&
              deadline.dueTime.getMonth() === day.getMonth() &&
              deadline.dueTime.getDate() === day.getDate()
            )
          })

          const dayItems = [
            ...dayEvents.map((event) => ({
              type: "event" as const,
              time: event.startTime,
              item: event,
            })),
            ...dayDeadlines.map((deadline) => ({
              type: "deadline" as const,
              time: deadline.dueTime,
              item: deadline,
            })),
          ].sort((a, b) => a.time.getTime() - b.time.getTime())

          const isCurrentMonth =
            day.getMonth() === selectedMonth.getMonth()

          return (
            <div
              key={day.toDateString()}
              onClick={() => onDayClick(day)}
              className={`border-t border-l border-divider/10 min-h-0 p-1 cursor-pointer hover:bg-white/5 flex flex-col ${
                isCurrentMonth ? "" : "opacity-30"
              }`}
            >
              {/* Date */}
              <div className="text-xs mb-1 flex-shrink-0">
                {day.getDate()}
              </div>

              {/* Scrollable day contents */}
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
                <div className="flex flex-col gap-0.5">
                  {dayItems.map((dayItem) => {
                    if (dayItem.type === "event") {
                      const event = dayItem.item
                      const group = getGroup(event, groups)

                      return (
                        <div
                          key={`event-${event.id}`}
                          className="
                            relative
                            text-[10px]
                            px-1
                            py-0.5
                            rounded
                            truncate
                            text-text
                            overflow-hidden
                            flex-shrink-0
                            transition-transform
                            duration-200
                            [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]
                            hover:scale-110
                            hover:-rotate-2
                            active:scale-90
                            active:rotate-1
                          "
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
                    }

                    const deadline = dayItem.item
                    const group = getGroup(deadline, groups)

                    return (
                      <button
                        key={`deadline-${deadline.id}`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeadlineClick(deadline)
                        }}
                        className="
                          flex
                          items-center
                          gap-1
                          w-full
                          text-left
                          text-[10px]
                          text-text
                          truncate
                          flex-shrink-0
                          transition-transform
                          duration-200
                          [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]
                          hover:scale-105
                          active:scale-95
                        "
                      >
                        {/* Deadline / group diamond */}
                        <span
                          className="
                            w-2
                            h-2
                            rotate-45
                            rounded-[1px]
                            flex-shrink-0
                          "
                          style={{
                            background: group
                              ? `linear-gradient(
                                  to right,
                                  ${deadline.color} 50%,
                                  ${group.color} 50%
                                )`
                              : deadline.color,
                          }}
                        />

                        {/* Deadline name */}
                        <span
                          className={`truncate ${
                            deadline.completed
                              ? "line-through opacity-40"
                              : ""
                          }`}
                        >
                          {deadline.name}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
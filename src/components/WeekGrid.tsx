import {
  eventOccursOnDay,
  getEventDaySegment,
  getEventLayouts,
} from "../utils/eventUtils"

import { useGroups } from "../hooks/useGroups"
import { getGroup } from "../services/groups"
import { EventColorIndicator } from "./EventColorIndicator"

import type { Event } from "../data_types/event"
import type { Deadline } from "../data_types/deadline"

type WeekGridProps = {
  events: Event[]
  deadlines: Deadline[]
  weekDays: Date[]
  onEventClick: (event: Event) => void
  onDeadlineClick: (deadline: Deadline) => void
}

export function WeekGrid({
  events,
  deadlines,
  weekDays,
  onEventClick,
  onDeadlineClick,
}: WeekGridProps) {
  const hours = Array.from({ length: 16 }, (_, i) => i + 7)

  const { groups } = useGroups()

  return (
    <div className="border border-divider/10 rounded-lg shadow-lg shadow-text/10 overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">

          {/* Header */}
          <div className="flex border-b border-divider/10 bg-surface">
            <div className="w-16 flex-shrink-0" />

            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
              (day) => (
                <div
                  key={day}
                  className="flex-1 text-center text-xs py-2 text-text/60"
                >
                  {day}
                </div>
              )
            )}
          </div>

          {/* Calendar */}
          <div
            className="overflow-y-auto"
            style={{ height: "600px" }}
          >
            <div
              className="flex"
              style={{ height: "960px" }}
            >

              {/* Time labels */}
              <div className="w-16 flex-shrink-0">
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="relative"
                    style={{ height: "60px" }}
                  >
                    <span className="text-xs text-text/40 absolute right-2">
                      {hour === 12
                        ? "12pm"
                        : hour < 12
                          ? `${hour}am`
                          : `${hour - 12}pm`}
                    </span>
                  </div>
                ))}
              </div>

              {/* Days */}
              {weekDays.map((day) => {
                const dayEvents = events.filter((event) =>
                  eventOccursOnDay(event, day)
                )

                const allDayEvents = dayEvents.filter(
                  (event) => event.allDay
                )

                const timedEvents = dayEvents.filter(
                  (event) => !event.allDay
                )

                const dayDeadlines = deadlines.filter((deadline) => {
                  return (
                    deadline.dueTime.getFullYear() ===
                      day.getFullYear() &&
                    deadline.dueTime.getMonth() ===
                      day.getMonth() &&
                    deadline.dueTime.getDate() ===
                      day.getDate()
                  )
                })

                const layouts = getEventLayouts(timedEvents, day)

                return (
                  <div
                    key={day.toDateString()}
                    className="flex-1 relative border-l border-divider/10"
                  >

                    {/* Hour grid */}
                    {hours.map((hour) => (
                      <div
                        key={hour}
                        className="border-t border-divider/10"
                        style={{ height: "60px" }}
                      />
                    ))}

                    {/* All-day events */}
                      {allDayEvents.map((event) => {
                        const group = getGroup(event, groups)

                        return (
                          <div
                            key={event.id}
                            onClick={() => onEventClick(event)}
                            className="
                              absolute
                              inset-x-1
                              inset-y-0
                              z-0
                              rounded-lg
                              px-1
                              py-0.5
                              text-xs
                              overflow-hidden
                              flex
                              items-start
                              justify-center
                              cursor-pointer
                              opacity-30
                              transition-transform
                              duration-200
                              [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]
                              hover:scale-[1.02]
                              active:scale-[0.98]
                            "
                          >
                            <div className="absolute inset-0">
                              <EventColorIndicator
                                eventColor={event.color}
                                groupColor={group?.color ?? null}
                                variant="calendar"
                              />
                            </div>

                            <span className="relative z-10 mt-1">
                              {event.name}
                            </span>
                          </div>
                        )
                      })}

                    {/* Timed events */}
                    {timedEvents.map((event) => {
                      const segment = getEventDaySegment(event, day)

                      if (!segment) return null

                      const group = getGroup(event, groups)
                      const layout = layouts.get(event.id)

                      if (!layout) return null

                      return (
                        <div
                          key={event.id}
                          onClick={() => onEventClick(event)}
                          className="
                            absolute
                            z-10
                            rounded-lg
                            px-1
                            py-0.5
                            text-xs
                            overflow-hidden
                            flex
                            items-center
                            cursor-pointer
                            transition-transform
                            duration-200
                            [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]
                            hover:scale-110
                            hover:-rotate-2
                            active:scale-90
                            active:rotate-1
                          "
                          style={{
                            top: `${segment.top}px`,
                            height: `${segment.height}px`,
                            left: `calc(${layout.left} + 2px)`,
                            width: `calc(${layout.width} - 4px)`,
                          }}
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

                    {/* Deadlines */}
                    {dayDeadlines.map((deadline) => {
                      const minutes =
                        deadline.dueTime.getHours() * 60 +
                        deadline.dueTime.getMinutes()

                      const top = minutes - 7 * 60

                      const group = getGroup(deadline, groups)

                      const sameTimeDeadlines = dayDeadlines.filter(
                        (other) =>
                          other.dueTime.getHours() ===
                            deadline.dueTime.getHours() &&
                          other.dueTime.getMinutes() ===
                            deadline.dueTime.getMinutes()
                      )

                      const deadlineIndex = sameTimeDeadlines.findIndex(
                        (other) => other.id === deadline.id
                      )

                      const rowHeight = 24
                      const offset = deadlineIndex * rowHeight

                      return (
                        <button
                          key={deadline.id}
                          type="button"
                          onClick={() => onDeadlineClick(deadline)}
                          className="
                            absolute
                            left-0
                            right-0
                            z-20
                            h-6
                            flex
                            items-center
                            group
                            cursor-pointer
                          "
                          style={{
                            top: `${top + offset}px`,
                          }}
                        >
                          {/* Deadline color */}
                          <div
                            className="flex-1 h-[2px]"
                            style={{
                              backgroundColor: deadline.color,
                            }}
                          />

                          {/* Diamond */}
                          <div
                            className="
                              w-3
                              h-3
                              rotate-45
                              rounded-[2px]
                              flex-shrink-0
                              mx-2
                              transition-transform
                              duration-200
                              group-hover:scale-125
                              group-active:scale-90
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
                            className={`
                              text-xs
                              whitespace-nowrap
                              flex-shrink-0
                              text-text
                              ${
                                deadline.completed
                                  ? "line-through opacity-40"
                                  : ""
                              }
                            `}
                          >
                            {deadline.name}
                          </span>

                          {/* Group color */}
                          <div
                            className="flex-1 h-[2px] ml-2"
                            style={{
                              backgroundColor:
                                group?.color ?? deadline.color,
                            }}
                          />
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
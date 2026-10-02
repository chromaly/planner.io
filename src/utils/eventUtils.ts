import type { Event, Importance, Weekday } from "../data_types/event"

function getWeekday(date: Date): Weekday {
  const weekdays: Weekday[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ]

  return weekdays[date.getDay()]
}

export type EventOccurrence = {
  event: Event
  startTime: Date
}

export function getEventOccurrence(
  event: Event,
  day: Date
): EventOccurrence | null {
  if (!eventOccursOnDay(event, day)) {
    return null
  }

  const startTime = new Date(day)

  startTime.setHours(
    event.startTime.getHours(),
    event.startTime.getMinutes(),
    event.startTime.getSeconds(),
    event.startTime.getMilliseconds()
  )

  return {
    event,
    startTime,
  }
}

export function getEventOccurrences(
  event: Event,
  startDate: Date,
  endDate: Date
): EventOccurrence[] {
  const occurrences: EventOccurrence[] = []

  const day = new Date(startDate)
  day.setHours(0, 0, 0, 0)

  const end = new Date(endDate)
  end.setHours(0, 0, 0, 0)

  while (day <= end) {
    const occurrence = getEventOccurrence(event, day)

    if (occurrence) {
      occurrences.push(occurrence)
    }

    day.setDate(day.getDate() + 1)
  }

  return occurrences
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)

  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function getEventPosition(event: Event) {
  const startMinutes =
    event.startTime.getHours() * 60 +
    event.startTime.getMinutes()

  return {
    top: `${startMinutes - 7 * 60}px`,
    height: `${event.duration}px`,
  }
}

export function eventOccursOnDay(
  event: Event,
  day: Date
): boolean {
  const dayStart = new Date(day)
  dayStart.setHours(0, 0, 0, 0)

  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayEnd.getDate() + 1)

  const eventStart = event.startTime

  // Events cannot occur before their original start date
  const eventDate = new Date(eventStart)
  eventDate.setHours(0, 0, 0, 0)

  if (dayStart < eventDate) {
    return false
  }

  // Recurring events create a new occurrence on each matching day.
  if (event.recurrence.type === "daily") {
    return true
  }

  if (event.recurrence.type === "weekly") {
    return event.recurrence.days.includes(
      getWeekday(day)
    )
  }

  if (event.recurrence.type === "monthly") {
    return (
      day.getDate() === event.recurrence.dayOfMonth
    )
  }

  // Non-recurring events can span multiple days.
  const eventEnd = new Date(
    eventStart.getTime() + event.duration * 60_000
  )

  return (
    eventStart < dayEnd &&
    eventEnd > dayStart
  )
}

export function eventsOverlap(newEvent: Event, checkEvent: Event): boolean {
  const checkOccurrence = getEventOccurrence(
    checkEvent,
    newEvent.startTime
  )

  if (!checkOccurrence) {
    return false
  }

  const newStart = newEvent.startTime.getTime()
  const newEnd =
    newStart + newEvent.duration * 60_000

  const checkStart = checkOccurrence.startTime.getTime()
  const checkEnd =
    checkStart + checkEvent.duration * 60_000

  return newStart < checkEnd && newEnd > checkStart
}

export function getTodaysEvents(
  events: Event[]
): EventOccurrence[] {
  const today = new Date()

  return events
    .map((event) => getEventOccurrence(event, today))
    .filter(
      (occurrence): occurrence is EventOccurrence =>
        occurrence !== null
    )
    .sort(
      (a, b) =>
        a.startTime.getTime() - b.startTime.getTime()
    )
}

export function getEventsByImportance(
  events: Event[]
): Record<Importance, Event[]> {
  return {
    very: events.filter((event) => event.importance === "very"),
    somewhat: events.filter((event) => event.importance === "somewhat"),
    "not too": events.filter((event) => event.importance === "not too"),
  }
}

export function findAvailableTimes(
  events: Event[],
  date: Date,
  durationMinutes: number
): { start: Date; end: Date }[] {
  const dayStart = new Date(date)
  dayStart.setHours(7, 0, 0, 0)

  const dayEnd = new Date(date)
  dayEnd.setHours(22, 0, 0, 0)

  const dayEvents = events
    .filter((event) => eventOccursOnDay(event, date))
    .sort(
      (a, b) =>
        a.startTime.getTime() - b.startTime.getTime()
    )

  const availableTimes: { start: Date; end: Date }[] = []

  let currentTime = dayStart

  for (const event of dayEvents) {
    const eventStart = event.startTime

    const eventEnd = new Date(
      eventStart.getTime() + event.duration * 60_000
    )

    const freeMinutes =
      (eventStart.getTime() - currentTime.getTime()) / 60_000

    if (freeMinutes >= durationMinutes) {
      availableTimes.push({
        start: new Date(currentTime),
        end: new Date(eventStart),
      })
    }

    if (eventEnd > currentTime) {
      currentTime = eventEnd
    }
  }

  const remainingMinutes =
    (dayEnd.getTime() - currentTime.getTime()) / 60_000

  if (remainingMinutes >= durationMinutes) {
    availableTimes.push({
      start: new Date(currentTime),
      end: new Date(dayEnd),
    })
  }

  return availableTimes
}

export type EventDaySegment = {
  top: number
  height: number
}

export function getEventDaySegment(
  event: Event,
  day: Date
): EventDaySegment | null {
  if (!eventOccursOnDay(event, day)) {
    return null
  }

  const dayStart = new Date(day)
  dayStart.setHours(0, 0, 0, 0)

  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayEnd.getDate() + 1)

  let eventStart: Date
  let eventEnd: Date

  if (event.recurrence.type === "never") {
    eventStart = new Date(event.startTime)
    eventEnd = new Date(
      eventStart.getTime() + event.duration * 60_000
    )
  } else {
    // Recurring events occur at the same time on the
    // matching day.
    eventStart = new Date(day)
    eventStart.setHours(
      event.startTime.getHours(),
      event.startTime.getMinutes(),
      event.startTime.getSeconds(),
      event.startTime.getMilliseconds()
    )

    eventEnd = new Date(
      eventStart.getTime() + event.duration * 60_000
    )
  }

  if (eventEnd <= dayStart || eventStart >= dayEnd) {
    return null
  }

  const segmentStart =
    eventStart > dayStart ? eventStart : dayStart

  const segmentEnd =
    eventEnd < dayEnd ? eventEnd : dayEnd

  const top =
    (segmentStart.getHours() * 60 +
      segmentStart.getMinutes() +
      segmentStart.getSeconds() / 60) -
    7 * 60

  const height =
    (segmentEnd.getTime() - segmentStart.getTime()) / 60_000

  return {
    top: Math.max(0, top),
    height: Math.max(1, height),
  }
}

export function getEventLayouts(
  dayEvents: Event[],
  day: Date
) {
  const eventsWithSegments = dayEvents
    .map((event) => {
      const segment = getEventDaySegment(event, day)

      if (!segment) return null

      return {
        event,
        start: segment.top,
        end: segment.top + segment.height,
      }
    })
    .filter(
      (
        item
      ): item is {
        event: Event
        start: number
        end: number
      } => item !== null
    )
    .sort((a, b) => a.start - b.start)

  // Divide events into groups that overlap.
  const groups: typeof eventsWithSegments[] = []

  for (const item of eventsWithSegments) {
    const lastGroup = groups[groups.length - 1]

    if (!lastGroup) {
      groups.push([item])
      continue
    }

    const groupEnd = Math.max(
      ...lastGroup.map((groupItem) => groupItem.end)
    )

    if (item.start < groupEnd) {
      lastGroup.push(item)
    } else {
      groups.push([item])
    }
  }

  const layouts = new Map<
    string,
    { left: string; width: string }
  >()

  for (const group of groups) {
    const columns: typeof eventsWithSegments[] = []

    for (const item of group) {
      let placed = false

      for (const column of columns) {
        const lastItem = column[column.length - 1]

        if (lastItem.end <= item.start) {
          column.push(item)
          placed = true
          break
        }
      }

      if (!placed) {
        columns.push([item])
      }
    }

    const columnCount = columns.length

    columns.forEach((column, columnIndex) => {
      column.forEach((item) => {
        layouts.set(item.event.id, {
          left: `${(columnIndex * 100) / columnCount}%`,
          width: `${100 / columnCount}%`,
        })
      })
    })
  }

  return layouts
}
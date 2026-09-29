import type { Event, Weekday } from "../data_types/event"

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
  const eventDate = new Date(event.startTime)

  if (day < new Date(
    eventDate.getFullYear(),
    eventDate.getMonth(),
    eventDate.getDate()
  )) {
    return false
  }

  switch (event.recurrence.type) {
    case "never":
      return (
        eventDate.toDateString() === day.toDateString()
      )

    case "daily":
      return true

    case "weekly":
      return event.recurrence.days.includes(
        getWeekday(day)
      )

    case "monthly":
      return (
        day.getDate() === event.recurrence.dayOfMonth
      )

    default:
      return false
  }
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

export function getEventsByImportance(events: Event[]) {
  const today = new Date()

  const upcoming = events.filter(
    (event) =>
      event.recurrence.type !== "never" ||
      event.startTime >= today
  )

  return {
    "very important!": upcoming.filter(
      (event) => event.importance === "very"
    ),

    "somewhat!": upcoming.filter(
      (event) => event.importance === "somewhat"
    ),

    "not too urgent...": upcoming.filter(
      (event) => event.importance === "not too"
    ),
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

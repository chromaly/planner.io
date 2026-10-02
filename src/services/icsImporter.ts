import ICAL from "ical.js"
import type {
  CreateEventData,
  Recurrence,
  Weekday,
  Event
} from "../data_types/event"

const weekdayMap: Record<string, Weekday> = {
  SU: "sunday",
  MO: "monday",
  TU: "tuesday",
  WE: "wednesday",
  TH: "thursday",
  FR: "friday",
  SA: "saturday",
}

function parseRecurrence(event: ICAL.Event): Recurrence {
  const rrule = event.component.getFirstPropertyValue("rrule")

  if (!(rrule instanceof ICAL.Recur)) {
    return { type: "never" }
  }

  const parts = rrule.parts

  switch (rrule.freq) {
    case "DAILY":
      return { type: "daily" }

    case "WEEKLY": {
      const days = (parts.BYDAY ?? [])
        .map((day: string) => weekdayMap[day])
        .filter(
          (day: Weekday | undefined): day is Weekday =>
            day !== undefined
        )

      if (days.length > 0) {
        return {
          type: "weekly",
          days,
        }
      }

      const jsDay = event.startDate.toJSDate().getDay()

      const dayCodes = [
        "SU",
        "MO",
        "TU",
        "WE",
        "TH",
        "FR",
        "SA",
      ]

      return {
        type: "weekly",
        days: [weekdayMap[dayCodes[jsDay]]],
      }
    }

    case "MONTHLY": {
      const days = parts.BYMONTHDAY

      if (days && days.length > 0) {
        return {
          type: "monthly",
          dayOfMonth: days[0],
        }
      }

      return { type: "never" }
    }

    default:
      return { type: "never" }
  }
}

function parseColor(event: ICAL.Event): string {
  const color = event.component.getFirstPropertyValue("color")

  if (typeof color === "string" && color.trim() !== "") {
    return color
  }

  return "#808080"
}
export function parseICSFile(content: string): CreateEventData[] {
  const jcalData = ICAL.parse(content)
  const component = new ICAL.Component(jcalData)
  const vevents = component.getAllSubcomponents("vevent")

  return vevents.map((vevent) => {
    const event = new ICAL.Event(vevent)

    const startTime = event.startDate.toJSDate()
    const endTime = event.endDate?.toJSDate()
    const allDay = event.startDate.isDate

    let duration = 60

    if (endTime) {
      duration = Math.max(
        1,
        Math.round(
          (endTime.getTime() - startTime.getTime()) / 60000
        )
      )
    }

    return {
      name: event.summary || "Untitled Event",
      startTime,
      duration,
      allDay,
      recurrence: parseRecurrence(event),
      importance: "not too",
      location: event.location || "",
      notes: event.description || "",
      color: parseColor(event),
      groupId: null,
    }
  })
}

export type EventDaySegment = {
  top: number
  height: number
}

export function getEventDaySegment(
  event: Event,
  day: Date
): EventDaySegment | null {
  const dayStart = new Date(day)
  dayStart.setHours(0, 0, 0, 0)

  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayEnd.getDate() + 1)

  const eventStart = event.startTime
  const eventEnd = new Date(
    eventStart.getTime() + event.duration * 60_000
  )

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
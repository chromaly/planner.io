import ICAL from "ical.js"
import type {
  CreateEventData,
  Recurrence,
  Weekday,
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

  return vevents.flatMap((vevent) => {
    const event = new ICAL.Event(vevent)

    const startTime = event.startDate.toJSDate()
    const endTime = event.endDate?.toJSDate()
    const isAllDay = event.startDate.isDate

    // Skip multi-day events
    if (isAllDay && endTime) {
      const days =
        (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24)

      if (days > 1) {
        return []
      }
    }

    let duration = 60

    if (!isAllDay && endTime) {
      duration = Math.max(
        1,
        Math.round(
          (endTime.getTime() - startTime.getTime()) / 60000
        )
      )
    }

    return [{
      name: event.summary || "Untitled Event",
      startTime,
      duration,
      recurrence: parseRecurrence(event),
      importance: "not too",
      location: event.location || "",
      notes: event.description || "",
      color: parseColor(event),
      groupId: null,
    }]
  })
}
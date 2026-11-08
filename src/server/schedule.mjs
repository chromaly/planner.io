export { readAllEvents } from "./events.mjs";

import { readAllEvents } from "./events.mjs";
import { getEventOccurrences } from "../utils/eventUtils.ts";

function parseDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? "")) {
    throw new Error("Dates must use YYYY-MM-DD.");
  }

  const date = new Date(`${value}T00:00:00Z`);

  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new Error("Invalid calendar date.");
  }

  return date;
}

export function parseScheduleQuery(params) {
  try {
    const start = params.get("start");
    const end = params.get("end");
    const timezone = params.get("timezone");

    const startDate = parseDate(start);
    const endDate = parseDate(end);
    const days = (endDate - startDate) / 86_400_000;

    if (days < 1 || days > 31) {
      throw new Error("Request between 1 and 31 days.");
    }

    if (!timezone) {
      throw new Error("A timezone is required.");
    }

    // Throws if the timezone is not recognized.
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });

    return { start, end, timezone };
  } catch (error) {
    error.httpStatus = 400;
    throw error;
  }
}

export async function readSchedule(token, uid, params) {
  const query = parseScheduleQuery(params);

  const serverTimezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (query.timezone !== serverTimezone) {
    const error = new Error(
      "Requested timezone must match the server timezone."
    );
    error.httpStatus = 400;
    throw error;
  }

  const start = new Date(`${query.start}T00:00:00`);
  const end = new Date(`${query.end}T00:00:00`);

  // Existing utility includes the end date.
  // Our endpoint excludes it.
  const lastDay = new Date(end);
  lastDay.setDate(lastDay.getDate() - 1);

  const storedEvents = await readAllEvents(token, uid);
  const occurrences = [];

  for (const stored of storedEvents) {
    const event = {
      ...stored,
      startTime: new Date(stored.startTime),
    };

    if (
      !stored.startTime ||
      !Number.isFinite(event.startTime.getTime()) ||
      !Number.isFinite(event.duration) ||
      event.duration <= 0
    ) {
      throw new Error(
        "An event has invalid timing data; schedule unavailable."
      );
    }

    for (const occurrence of getEventOccurrences(
      event, start, lastDay
    )) {
      occurrences.push({
        id: event.id,
        name: event.name,
        start: occurrence.startTime.toISOString(),
        end: new Date(
          occurrence.startTime.getTime() +
          event.duration * 60_000
        ).toISOString(),
        allDay: event.allDay,
      });
    }
  }

  // An overnight event may be returned for multiple days.
  const unique = [
    ...new Map(
      occurrences.map(item => [
        `${item.id}:${item.start}`, item,
      ])
    ).values(),
  ];

  unique.sort((a, b) => Date.parse(a.start) - Date.parse(b.start));

  return { ...query, events: unique };
}
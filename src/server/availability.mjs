import { readSchedule } from "./schedule.mjs";

export async function readAvailability(token, uid, params) {
  const date = params.get("date");
  const timezone = params.get("timezone");
  const duration = Number(params.get("durationMinutes") ?? 1);
  const from = params.get("from") ?? "07:00";
  const to = params.get("to") ?? "22:00";

  const validTime = value =>
    /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date ?? "") ||
    !validTime(from) ||
    !validTime(to) ||
    !Number.isInteger(duration) ||
    duration < 1 ||
    duration > 1440
  ) {
    const error = new Error("Invalid availability query.");
    error.httpStatus = 400;
    throw error;
  }

  const nextDate = new Date(`${date}T00:00:00Z`);

  if (
    !Number.isFinite(nextDate.getTime()) ||
    nextDate.toISOString().slice(0, 10) !== date
  ) {
    const error = new Error("Invalid calendar date.");
    error.httpStatus = 400;
    throw error;
  }

  nextDate.setUTCDate(nextDate.getUTCDate() + 1);

  const schedule = await readSchedule(
    token,
    uid,
    new URLSearchParams({
      start: date,
      end: nextDate.toISOString().slice(0, 10),
      timezone: timezone ?? "",
    })
  );

  // readSchedule verifies that the server uses this timezone.
  const windowStart = new Date(`${date}T${from}:00`).getTime();
  const windowEnd = new Date(`${date}T${to}:00`).getTime();

  if (windowEnd <= windowStart) {
    const error = new Error("End time must be after start time.");
    error.httpStatus = 400;
    throw error;
  }

  const busy = schedule.events
    .map(event => ({
      start: Math.max(windowStart, Date.parse(event.start)),
      end: Math.min(windowEnd, Date.parse(event.end)),
    }))
    .filter(event => event.end > event.start)
    .sort((a, b) => a.start - b.start);

  const slots = [];
  let cursor = windowStart;

  function addSlot(start, end) {
    if (end - start >= duration * 60_000) {
      slots.push({
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
        durationMinutes: (end - start) / 60_000,
      });
    }
  }

  for (const event of busy) {
    addSlot(cursor, event.start);
    cursor = Math.max(cursor, event.end);
  }

  addSlot(cursor, windowEnd);

  return {
    date,
    timezone,
    window: { from, to },
    minimumDurationMinutes: duration,
    slots,
    deadlinesBlockTime: false,
  };
}
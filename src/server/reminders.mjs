import { readAllEvents } from "./events.mjs";
import { readDeadlines } from "./deadlines.mjs";
import { readGroups } from "./groups.mjs";
import { readSchedule, parseScheduleQuery } from "./schedule.mjs";

const IMPORTANCE = { very: 0, somewhat: 1, "not too": 2 };

function badRequest(message) {
  const error = new Error(message);
  error.httpStatus = 400;
  throw error;
}

export async function readReminders(token, uid, params) {
  const view = params.get("view");
  const kind = params.get("kind") ?? "both";
  const timezone = "America/Los_Angeles";

  if (!["day", "importance", "group"].includes(view)) {
    badRequest("Choose day, importance, or group.");
  }

  if (!["both", "events", "deadlines"].includes(kind)) {
    badRequest("Invalid reminder kind.");
  }

  if (
    Intl.DateTimeFormat().resolvedOptions().timeZone !== timezone
  ) {
    throw new Error("Start the server in America/Los_Angeles.");
  }

  let dayQuery = null;

  if (view === "day") {
    const date = params.get("date");

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? "")) {
      badRequest("A YYYY-MM-DD date is required.");
    }

    const next = new Date(`${date}T00:00:00Z`);

    if (!Number.isFinite(next.getTime())) {
      badRequest("Invalid date.");
    }

    next.setUTCDate(next.getUTCDate() + 1);

    dayQuery = new URLSearchParams({
      start: date,
      end: next.toISOString().slice(0, 10),
      timezone,
    });

    parseScheduleQuery(dayQuery);
  }

  const [events, deadlines, groups] = await Promise.all([
    readAllEvents(token, uid),
    readDeadlines(token, uid),
    readGroups(token, uid),
  ]);

  const groupById = new Map(groups.map(group => [group.id, group]));
  let selectedGroup = null;

  if (view === "group") {
    const requested = (params.get("groupName") ?? "")
      .trim().toLowerCase();

    const matches = groups.filter(
      group => group.name.trim().toLowerCase() === requested
    );

    if (!requested || matches.length !== 1) {
      return {
        status: "needs_details",
        message: "Ask the user which group they mean.",
        availableGroups: groups.map(group => group.name),
      };
    }

    selectedGroup = matches[0];
  }

  let items = [];

  if (kind !== "deadlines") {
    if (view === "day") {
      const schedule = await readSchedule(token, uid, dayQuery);
      const eventById = new Map(events.map(event => [event.id, event]));

      items.push(...schedule.events.map(occurrence => ({
        ...eventById.get(occurrence.id),
        kind: "event",
        time: occurrence.start,
        end: occurrence.end,
        timeMeaning: "occurrence_start",
      })));
    } else {
      items.push(...events.map(event => ({
        ...event,
        kind: "event",
        time: event.startTime,
        timeMeaning: "original_start",
      })));
    }
  }

  if (kind !== "events") {
    items.push(
      ...deadlines
        .filter(deadline => !deadline.completed)
        .map(deadline => ({
          ...deadline,
          kind: "deadline",
          time: deadline.dueTime,
          timeMeaning: "due_time",
        }))
    );
  }

  if (view === "day") {
    const date = dayQuery.get("start");
    const start = new Date(`${date}T00:00:00`).getTime();
    const end = new Date(
      `${dayQuery.get("end")}T00:00:00`
    ).getTime();

    // Events have already been selected by the schedule service.
    items = items.filter(item =>
      item.kind === "event" ||
      (Date.parse(item.time) >= start && Date.parse(item.time) < end)
    );
  }

  if (selectedGroup) {
    items = items.filter(item => item.groupId === selectedGroup.id);
  }

  if (items.some(item => !Number.isFinite(Date.parse(item.time)))) {
    throw new Error("A reminder contains an invalid date.");
  }

  items.sort((a, b) => {
    if (view === "importance") {
      const rank =
        (IMPORTANCE[a.importance] ?? 1) -
        (IMPORTANCE[b.importance] ?? 1);

      if (rank !== 0) return rank;
    }

    return Date.parse(a.time) - Date.parse(b.time);
  });

  return {
    status: "ok",
    view,
    kind,
    date: dayQuery?.get("start") ?? null,
    timezone,
    groupName: selectedGroup?.name ?? null,
    total: items.length,
    truncated: items.length > 30,
    items: items.slice(0, 30).map(item => ({
      ...item,
      groupName: groupById.get(item.groupId)?.name ?? null,
      spokenTime: new Date(item.time).toLocaleString("en-US", {
        timeZone: timezone,
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
      overdue:
        item.kind === "deadline" &&
        Date.parse(item.time) < Date.now(),
    })),
  };
}
import { getEventOccurrences } from "../utils/eventUtils.ts";

function localDate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export async function checkProposalConflicts(
  token,
  uid,
  proposal,
  scheduleReader
) {
  const event = {
    ...proposal.event,
    startTime: new Date(proposal.event.startTime),
  };

  const firstDay = new Date(event.startTime);
  firstDay.setHours(0, 0, 0, 0);

  const repeating = event.recurrence.type !== "never";

  const lastDay = new Date(firstDay);

  if (repeating) {
    lastDay.setDate(lastDay.getDate() + 29);
  }

  const candidates = repeating
    ? getEventOccurrences(event, firstDay, lastDay)
        .map(occurrence => occurrence.startTime)
    : [event.startTime];

  // Allow the last occurrence to continue into the following day.
  const queryEnd = new Date(lastDay);
  queryEnd.setDate(queryEnd.getDate() + 2);

  const schedule = await scheduleReader(
    token,
    uid,
    new URLSearchParams({
      start: localDate(firstDay),
      end: localDate(queryEnd),
      timezone: proposal.timezone,
    })
  );

  const conflicts = schedule.events.filter(existing => {
    const existingStart = Date.parse(existing.start);
    const existingEnd = Date.parse(existing.end);

    return candidates.some(start => {
      const end = start.getTime() + event.duration * 60_000;

      return (
        start.getTime() < existingEnd &&
        end > existingStart
      );
    });
  });

  return {
    conflicts,
    conflictCheck: {
      start: localDate(firstDay),
      end: localDate(
        new Date(
          lastDay.getFullYear(),
          lastDay.getMonth(),
          lastDay.getDate() + 1
        )
      ),
      limitedToFirst30Days: repeating,
    },
  };
}
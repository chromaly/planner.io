import { readSchedule } from "./schedule.mjs";

export const assistantTools = [{
  type: "function",
  name: "get_schedule",
  description: (
    "Read the signed-in user's calendar. Dates use YYYY-MM-DD. " +
    "Start is inclusive; end is exclusive. Maximum 31 days."
  ),
  parameters: {
    type: "object",
    properties: {
      start: { type: "string" },
      end: { type: "string" },
    },
    required: ["start", "end"],
  },
}];

export async function executeAssistantTool(call, { token, uid }) {
  if (call.name !== "get_schedule") {
    return { error: "Unavailable tool." };
  }

  try {
    const args = typeof call.arguments === "string"
      ? JSON.parse(call.arguments)
      : call.arguments;

    if (
      !args ||
      typeof args !== "object" ||
      Array.isArray(args) ||
      Object.keys(args).some(key => !["start", "end"].includes(key)) ||
      typeof args.start !== "string" ||
      typeof args.end !== "string"
    ) {
      return { error: "Provide start and end date strings only." };
    }

    const schedule = await readSchedule(
      token,
      uid,
      new URLSearchParams({
        start: args.start,
        end: args.end,
        timezone: "America/Los_Angeles",
      })
    );

    const format = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    return {
      ...schedule,
      events: schedule.events.map(event => ({
        ...event,
        spokenStart: format.format(new Date(event.start)),
        spokenEnd: format.format(new Date(event.end)),
      })),
    };
  } catch {
    return {
      error: (
        "Could not retrieve the schedule. Check the requested dates. " +
        "This does not mean the calendar is empty."
      ),
    };
  }
}
import { buildEventProposal } from "./eventProposal.mjs";
import { readGroups } from "./groups.mjs";

export async function buildDeadlineProposal(token, uid, input) {
  const missing = ["title", "date", "dueTime"].filter(
    field => input[field] == null || input[field] === ""
  );

  if (missing.length) {
    return { status: "needs_details", missing };
  }

  // Reuse date/time and metadata validation only.
  // This does not create an event or check calendar conflicts.
  const validated = buildEventProposal({
    title: input.title,
    date: input.date,
    startTime: input.dueTime,
    durationMinutes: 1,
    notes: input.notes,
    importance: input.importance,
    color: input.color,
  });

  const event = validated.event;
  let groupId = null;
  let groupName = null;

  if (input.groupName != null || input.groupId != null) {
    const groups = await readGroups(token, uid);

    if (
      (input.groupName != null &&
        typeof input.groupName !== "string") ||
      (input.groupId != null &&
        typeof input.groupId !== "string")
    ) {
      throw new Error("Invalid deadline group.");
    }

    const requested = (input.groupName ?? "").trim().toLowerCase();

    const matches = input.groupId
      ? groups.filter(group => group.id === input.groupId)
      : groups.filter(
          group => group.name.trim().toLowerCase() === requested
        );

    if (matches.length !== 1) {
      return {
        status: "needs_details",
        missing: ["groupName"],
        availableGroups: groups.map(group => group.name),
        message: "Ask the user which group to use.",
      };
    }

    groupId = matches[0].id;
    groupName = matches[0].name;
  }

  return {
    status: "needs_confirmation",
    saved: false,
    kind: "deadline",
    timezone: validated.timezone,
    groupName,
    deadline: {
      name: event.name,
      dueTime: event.startTime,
      importance: event.importance,
      notes: event.notes,
      color: event.color,
      groupId,
      completed: false,
    },
  };
}
import { readSchedule } from "./schedule.mjs";
import { readGroups } from "./groups.mjs";
import { normalizeRecurrence } from "./recurrence.mjs";
import { checkProposalConflicts } from "./proposalConflicts.mjs";

export function buildEventProposal(input) {
  if (!input || typeof input !== "object") {
    throw new Error("An event proposal is required.");
  }

  const missing = [];

  for (const field of [
    "title", "date", "startTime", "durationMinutes",
  ]) {
    if (
      input[field] === null ||
      input[field] === undefined ||
      input[field] === ""
    ) {
      missing.push(field);
    }
  }

  if (missing.length) {
    return { status: "needs_details", missing };
  }

  if (
    typeof input.title !== "string" ||
    !input.title.trim() ||
    !/^\d{4}-\d{2}-\d{2}$/.test(input.date) ||
    !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(input.startTime) ||
    !Number.isInteger(input.durationMinutes) ||
    input.durationMinutes <= 0 ||
    input.durationMinutes > 1440
  ) {
    throw new Error("Invalid event details.");
  }

  // Match the timezone used by the existing calendar utilities.
  const timezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (timezone !== "America/Los_Angeles") {
    throw new Error("Start the server in America/Los_Angeles.");
  }

  const [year, month, day] = input.date.split("-").map(Number);
  const [hour, minute] = input.startTime.split(":").map(Number);

  const start = new Date(year, month - 1, day, hour, minute);

  if (
    start.getFullYear() !== year ||
    start.getMonth() !== month - 1 ||
    start.getDate() !== day ||
    start.getHours() !== hour ||
    start.getMinutes() !== minute
  ) {
    throw new Error("Invalid or nonexistent local date/time.");
  }

  const location = input.location ?? "";
  const notes = input.notes ?? "";
  const importance = input.importance ?? "somewhat";
  const color = input.color ?? "#7B5EDB";

  if (
    typeof location !== "string" ||
    typeof notes !== "string" ||
    !["very", "somewhat", "not too"].includes(importance) ||
    typeof color !== "string" ||
    !/^#[0-9a-f]{6}$/i.test(color)
  ) {
    throw new Error("Invalid event metadata.");
  }
  return {
    status: "draft",
    saved: false,
    timezone,
    event: {
      name: input.title.trim(),
      startTime: start.toISOString(),
      duration: input.durationMinutes,
      allDay: false,
      recurrence: normalizeRecurrence(input.recurrence),
      location,
      notes,
      importance,
      color,
      groupId: null,
    },
  };
}

export async function checkEventProposal(
  token,
  uid,
  input,
  scheduleReader = readSchedule
) {
  const proposal = buildEventProposal(input);

  if (proposal.status === "needs_details") {
    return proposal;
  }
  if (
    input.groupName !== undefined &&
    input.groupName !== null &&
    typeof input.groupName !== "string"
  ) {
    throw new Error("Group name must be text.");
  }

  if (
    input.groupId !== undefined &&
    input.groupId !== null &&
    typeof input.groupId !== "string"
  ) {
    throw new Error("Group ID must be text.");
  }

  const groupName = (input.groupName ?? "").trim();

  if (groupName || input.groupId) {
    const groups = await readGroups(token, uid);

    const matches = input.groupId
      ? groups.filter(group => group.id === input.groupId)
      : groups.filter(
          group =>
            group.name.trim().toLowerCase() ===
            groupName.toLowerCase()
        );

    if (matches.length !== 1) {
      return {
        status: "needs_details",
        missing: ["groupName"],
        message: matches.length
          ? "More than one group matches. Ask the user to clarify."
          : "No matching group exists. Ask the user which group to use.",
        availableGroups: groups.map(group => ({
          name: group.name,
          id: group.id,
        })),
      };
    }

    proposal.event.groupId = matches[0].id;
    proposal.groupName = matches[0].name;

  }
    const checked = await checkProposalConflicts(
    token,
    uid,
    proposal,
    scheduleReader
  );

  return {
    ...proposal,
    ...checked,
    status: "needs_confirmation",
  };
}
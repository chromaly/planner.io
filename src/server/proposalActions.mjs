// Type-specific operations; the pending store owns only lifecycle and approval.
import { checkEventProposal } from "./eventProposal.mjs";
import { writeConfirmedEvent } from "./eventWriter.mjs";
import { writeConfirmedDeadline } from "./deadlineWriter.mjs";

export function proposalActions(proposal, overrides = {}) {
  const actions = {
    event: {
      async refresh(token, uid) {
        const event = proposal.event;
        const start = new Date(event.startTime);
        const pad = value => String(value).padStart(2, "0");
        return (overrides.recheck ?? checkEventProposal)(token, uid, {
          title: event.name,
          date: [start.getFullYear(), pad(start.getMonth() + 1), pad(start.getDate())].join("-"),
          startTime: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
          durationMinutes: event.duration, location: event.location,
          notes: event.notes, importance: event.importance, color: event.color,
          groupId: event.groupId, recurrence: event.recurrence,
        });
      },
      async save(token, uid, id) {
        const { eventId } = await (overrides.writer ?? writeConfirmedEvent)(token, uid, id, proposal.event);
        return { status: "saved", saved: true, eventId, event: structuredClone(proposal.event) };
      },
    },
    deadline: {
      async refresh() { return structuredClone(proposal); },
      async save(token, uid, id) {
        const { deadlineId } = await writeConfirmedDeadline(token, uid, id, proposal.deadline);
        return { status: "saved", saved: true, kind: "deadline", deadlineId,
          deadline: structuredClone(proposal.deadline) };
      },
    },
  };
  const kind = proposal.kind ?? "event";
  if (!actions[kind]) throw new Error("Unsupported proposal type.");
  return actions[kind];
}

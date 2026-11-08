import { saveNote, searchNotes, getNote } from "./notes.mjs";
import { remember, searchMemory, updateMemory, forgetMemory } from "./memory.mjs";
import { readEventPage } from "./events.mjs";
import { readSchedule } from "./schedule.mjs";
import { readAvailability } from "./availability.mjs";
import { readReminders } from "./reminders.mjs";
import { checkEventProposal } from "./eventProposal.mjs";
import { buildDeadlineProposal } from "./deadlineProposal.mjs";
import { rememberProposal, cancelProposal, confirmProposal } from "./pendingProposals.mjs";
import { replyToAssistant } from "./assistant.mjs";

const defaults = {
  replyToAssistant, saveNote, searchNotes, getNote, remember, searchMemory, updateMemory, forgetMemory,
  readEventPage, readSchedule, readAvailability, readReminders,
  checkEventProposal, buildDeadlineProposal, rememberProposal,
  cancelProposal, confirmProposal,
};

export function createRoutes(overrides = {}) {
  const service = { ...defaults, ...overrides };
  const read = handler => ({ handler });
  const post = handler => ({ body: true, handler });
  const result = body => ({ status: 200, body });

  function proposalRoute(build) {
    return post(async ({ token, uid, body }) => {
      const proposal = await build(token, uid, body);

      if (proposal.status !== "needs_confirmation") {
        return result(proposal);
      }

      const stored = await service.rememberProposal(uid, proposal);
      return result(stored);
    });
  }

  function proposalAction(action) {
    return post(async ({ token, uid, body }) => {
      if (typeof body.proposalId !== "string") {
        return { status: 400, body: { error: "A proposal ID is required." } };
      }
      return action(token, uid, body.proposalId);
    });
  }

  // Register a route once: this table controls matching, auth, and dispatch.
  return new Map([
    ["GET /health", { auth: false, handler: () => result({ status: "ok", service: "planner.io" }) }],
    ["GET /me", read(({ uid }) => result({ uid }))],
    ["GET /events", read(async ({ token, uid, params }) =>
      result(await service.readEventPage(token, uid, params.get("pageToken"))))],
    ["GET /schedule", read(async ({ token, uid, params }) =>
      result(await service.readSchedule(token, uid, params)))],
    ["GET /availability", read(async ({ token, uid, params }) =>
      result(await service.readAvailability(token, uid, params)))],
    ["GET /reminders", read(async ({ token, uid, params }) =>
      result(await service.readReminders(token, uid, params)))],
    ["POST /notes", post(async ({ token, uid, body }) => result(await service.saveNote(token, uid, body)))],
    ["GET /notes/search", read(async ({ token, uid, params }) => result(await service.searchNotes(token, uid, params)))],
    ["GET /notes/entry", read(async ({ token, uid, params }) => result(await service.getNote(token, uid, params)))],
    ["POST /memory", post(async ({ token, uid, body }) => result(await service.remember(token, uid, body)))],
    ["GET /memory/search", read(async ({ token, uid, params }) => result(await service.searchMemory(token, uid, params)))],
    ["POST /memory/update", post(async ({ token, uid, body }) => result(await service.updateMemory(token, uid, body)))],
    ["POST /memory/forget", post(async ({ token, uid, body }) => result(await service.forgetMemory(token, uid, body)))],
    ["POST /event-proposals", proposalRoute(service.checkEventProposal)],
    ["POST /deadline-proposals", proposalRoute(service.buildDeadlineProposal)],
    ["POST /event-proposals/confirm", proposalAction(async (token, uid, id) =>
      result(await service.confirmProposal(token, uid, id)))],
    ["POST /assistant/message", post(async context =>
      result(await service.replyToAssistant(context)))],
    ["POST /event-proposals/cancel", proposalAction(async (_token, uid, id) => {
      const cancelled = await service.cancelProposal(uid, id);
      return { status: cancelled ? 200 : 404, body: { cancelled, saved: false } };
    })],
  ]);
}

import { normalizeRecurrence } from "./recurrence.mjs";
import { encodeFields, createDocumentOnce } from "./firestore.mjs";

export async function writeConfirmedEvent(token, uid, proposalId, event) {
  const recurrence = normalizeRecurrence(event.recurrence);
  const fields = encodeFields({
    name: event.name, startTime: new Date(event.startTime), duration: event.duration,
    allDay: false, recurrence, importance: event.importance, location: event.location,
    notes: event.notes, color: event.color, groupId: event.groupId,
  });
  const eventId = await createDocumentOnce(
    token, uid, "events", `uni-${proposalId}`, fields, stored => {
      const saved = stored.recurrence?.mapValue?.fields ?? {};
      const storedRule = normalizeRecurrence({
        type: saved.type?.stringValue,
        days: (saved.days?.arrayValue?.values ?? []).map(day => day.stringValue),
        dayOfMonth: Number(saved.dayOfMonth?.integerValue),
      });
      return JSON.stringify(storedRule) === JSON.stringify(recurrence) &&
        stored.name?.stringValue === event.name &&
        Date.parse(stored.startTime?.timestampValue) === Date.parse(event.startTime) &&
        Number(stored.duration?.integerValue) === event.duration &&
        stored.location?.stringValue === event.location &&
        stored.notes?.stringValue === event.notes &&
        stored.importance?.stringValue === event.importance &&
        stored.color?.stringValue === event.color &&
        (stored.groupId?.stringValue ?? null) === event.groupId;
    }
  );
  return { eventId };
}

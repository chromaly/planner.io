import { readGroups } from "./groups.mjs";
import { encodeFields, createDocumentOnce } from "./firestore.mjs";

export async function writeConfirmedDeadline(token, uid, proposalId, deadline) {
  if (deadline.groupId) {
    const groups = await readGroups(token, uid);
    if (!groups.some(group => group.id === deadline.groupId)) {
      throw new Error("The deadline group no longer exists.");
    }
  }
  const fields = encodeFields({
    name: deadline.name, dueTime: new Date(deadline.dueTime),
    importance: deadline.importance, notes: deadline.notes,
    color: deadline.color, completed: false, groupId: deadline.groupId,
  });
  const deadlineId = await createDocumentOnce(
    token, uid, "deadlines", `uni-${proposalId}`, fields, stored =>
      stored.name?.stringValue === deadline.name &&
      Date.parse(stored.dueTime?.timestampValue) === Date.parse(deadline.dueTime) &&
      stored.importance?.stringValue === deadline.importance &&
      stored.notes?.stringValue === deadline.notes &&
      stored.color?.stringValue === deadline.color &&
      (stored.groupId?.stringValue ?? null) === deadline.groupId
  );
  return { deadlineId };
}

import { readCollection } from "./firestore.mjs";

export async function readDeadlines(token, uid) {
  const documents = await readCollection(token, uid, "deadlines");
  return documents.map(document => {
    const fields = document.fields ?? {};
    const dueTime = fields.dueTime?.timestampValue;
    if (!dueTime || !Number.isFinite(Date.parse(dueTime))) {
      throw new Error("A deadline has an invalid due date.");
    }
    return {
      id: document.name.split("/").at(-1),
      name: fields.name?.stringValue ?? "", dueTime,
      importance: fields.importance?.stringValue ?? "somewhat",
      notes: fields.notes?.stringValue ?? "",
      groupId: fields.groupId?.stringValue ?? null,
      completed: fields.completed?.booleanValue ?? false,
    };
  });
}

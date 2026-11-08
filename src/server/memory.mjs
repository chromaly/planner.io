// Explicit assistant memory is separate from notes, events, and alerts.
import { readCollection, encodeFields, firestoreRequest } from "./firestore.mjs";
import { text, requestId, mutateRecord, recordUrl, invalid } from "./records.mjs";
import { searchRecords } from "./search.mjs";

const COLLECTION = "assistantMemories";
const TYPES = ["preference", "fact", "goal", "project"];
function memoryType(value) {
  if (!TYPES.includes(value)) invalid("Invalid memory type.");
  return value;
}
function memoryId(value) { return `uni-${requestId(text(value, "memory ID", 40).replace(/^uni-/, ""))}`; }
function decode(document) {
  const fields = document.fields ?? {};
  return { memoryId: document.name.split("/").at(-1),
    content: fields.content?.stringValue ?? "", type: fields.type?.stringValue ?? "fact",
    sourceText: fields.sourceText?.stringValue ?? "",
    createdAt: fields.createdAt?.timestampValue ?? null,
    updatedAt: fields.updatedAt?.timestampValue ?? null };
}
export async function remember(token, uid, input) {
  const id = `uni-${requestId(input.requestId)}`;
  const content = text(input.content, "memory content", 2000);
  const type = memoryType(input.type ?? "fact");
  const sourceText = text(input.sourceText, "memory source", 4000);
  const now = new Date();
  return mutateRecord(token, uid, COLLECTION, id, current => {
    const result = { status: "saved", saved: true, memoryId: id, content, type };
    if (current) {
      const saved = decode(current);
      if (saved.content !== content || saved.type !== type) invalid("Memory request ID was reused.", 409);
      return { result };
    }
    return { fields: encodeFields({ content, type, sourceText, createdAt: now, updatedAt: now }), result };
  });
}
export async function searchMemory(token, uid, params) {
  const documents = await readCollection(token, uid, COLLECTION);
  return { status: "ok", ...searchRecords(documents.map(decode), params.get("query") ?? "", Number(params.get("limit") ?? 5)) };
}
export async function updateMemory(token, uid, input) {
  const id = memoryId(input.memoryId);
  const content = text(input.content, "memory content", 2000);
  const sourceText = text(input.sourceText, "memory source", 4000);
  return mutateRecord(token, uid, COLLECTION, id, current => {
    if (!current) return { result: { status: "not_found", saved: false } };
    const type = memoryType(input.type ?? current.fields.type?.stringValue ?? "fact");
    return { fields: { ...current.fields, ...encodeFields({ content, type, sourceText, updatedAt: new Date() }) },
      result: { status: "saved", saved: true, memoryId: id, content, type } };
  });
}
export async function forgetMemory(token, uid, input) {
  const id = memoryId(input.memoryId);
  const response = await firestoreRequest(token, recordUrl(uid, COLLECTION, id), { method: "DELETE" });
  if (!response.ok && response.status !== 404) invalid("Could not forget memory.", [401, 403].includes(response.status) ? response.status : 502);
  return { status: "forgotten", memoryId: id };
}

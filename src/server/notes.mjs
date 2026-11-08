import { readCollection, encodeFields } from "./firestore.mjs";
import { calendarDate, today, text, requestId, mutateRecord, readRecord, invalid } from "./records.mjs";
import { searchRecords } from "./search.mjs";

function decodeEntry(raw, date) {
  const entry = raw.mapValue?.fields;
  if (!entry || typeof entry.id?.stringValue !== "string" || typeof entry.content?.stringValue !== "string") {
    throw new Error("A note entry has an invalid format.");
  }
  return { date, entryId: entry.id.stringValue, content: entry.content.stringValue,
    createdAt: entry.createdAt?.timestampValue ?? null, topic: entry.topic?.stringValue ?? null };
}

export async function saveNote(token, uid, input) {
  const content = text(input.content, "note content");
  const date = calendarDate(input.date ?? today());
  const entryId = `uni-${requestId(input.requestId)}`;
  const createdAt = new Date();
  const entry = encodeFields({ id: entryId, content, createdAt, topic: null });
  return mutateRecord(token, uid, "notes", date, current => {
    const fields = current?.fields ?? {};
    const entries = fields.entries?.arrayValue?.values ?? [];
    if (!Array.isArray(entries)) throw new Error("Invalid daily note entries.");
    const previous = entries.find(item => item.mapValue?.fields?.id?.stringValue === entryId);
    const result = { status: "saved", saved: true, date, entryId, content };
    if (previous) {
      if (previous.mapValue.fields.content?.stringValue !== content) invalid("Request ID was reused for different note content.", 409);
      return { result };
    }
    return {
      fields: { ...fields, date: { stringValue: date },
        entries: { arrayValue: { values: [...entries, { mapValue: { fields: entry } }] } },
        updatedAt: { timestampValue: createdAt.toISOString() } },
      result,
    };
  });
}

export async function searchNotes(token, uid, params) {
  const date = params.get("date");
  const documents = date
    ? [await readRecord(token, uid, "notes", calendarDate(date))].filter(Boolean)
    : await readCollection(token, uid, "notes");
  const entries = documents.flatMap(document => {
    const day = document.fields?.date?.stringValue ?? document.name.split("/").at(-1);
    return (document.fields?.entries?.arrayValue?.values ?? []).map(raw => decodeEntry(raw, day));
  });
  const result = searchRecords(entries, params.get("query") ?? "", Number(params.get("limit") ?? 5));
  return { status: "ok", ...result, scannedEntries: entries.length,
    results: result.results.map(entry => ({ ...entry,
      content: entry.content.slice(0, 2000), contentTruncated: entry.content.length > 2000 })) };
}

export async function getNote(token, uid, params) {
  const date = calendarDate(params.get("date"));
  const entryId = text(params.get("entryId"), "entry ID", 100);
  const document = await readRecord(token, uid, "notes", date);
  const entry = (document?.fields?.entries?.arrayValue?.values ?? [])
    .map(raw => decodeEntry(raw, date)).find(item => item.entryId === entryId);
  return entry ? { status: "ok", note: entry } : { status: "not_found" };
}

import { readCollectionPage, readPages } from "./firestore.mjs";

export async function readEventPage(token, uid, pageToken) {
  const data = await readCollectionPage(token, uid, "events", pageToken);
  return {
    events: (data.documents ?? []).map((document) => {
      const fields = document.fields ?? {};
      const recurrenceFields =
        fields.recurrence?.mapValue?.fields ?? {};

      const recurrence = {
        type: recurrenceFields.type?.stringValue ?? "never",
        days: (
          recurrenceFields.days?.arrayValue?.values ?? []
        ).map((day) => day.stringValue),
        dayOfMonth: Number(
          recurrenceFields.dayOfMonth?.integerValue ??
          recurrenceFields.dayOfMonth?.doubleValue ??
          0
        ),
      };

      return {
        id: document.name.split("/").at(-1),
        name: fields.name?.stringValue ?? "",
        startTime: fields.startTime?.timestampValue ?? null,
        recurrence,
        allDay: fields.allDay?.booleanValue ?? false,
        duration: Number(
          fields.duration?.integerValue ??
          fields.duration?.doubleValue ??
          0
        ),
        importance: fields.importance?.stringValue ?? "somewhat",
        notes: fields.notes?.stringValue ?? "",
        groupId: fields.groupId?.stringValue ?? null,
      };
    }),
    nextPageToken: data.nextPageToken,
  };
}

export function readAllEvents(token, uid, readPage = readEventPage) {
  return readPages(pageToken => readPage(token, uid, pageToken), "events");
}

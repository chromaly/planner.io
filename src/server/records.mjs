// Optimistic document updates shared by notes and assistant memory.
import { collectionUrl, firestoreRequest } from "./firestore.mjs";

export function invalid(message, status = 400) {
  throw Object.assign(new Error(message), { httpStatus: status });
}

export function text(value, name, maximum = 6000, allowEmpty = false) {
  if (typeof value !== "string" || value.length > maximum || (!allowEmpty && !value.trim())) {
    invalid(`Invalid ${name}.`);
  }
  return value;
}

export function requestId(value) {
  if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    invalid("A valid request ID is required.");
  }
  return value;
}

export function calendarDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) invalid("Invalid note date.");
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) invalid("Invalid note date.");
  return value;
}

export function today() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date()).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function recordUrl(uid, collection, id) {
  return `${collectionUrl(uid, collection)}/${encodeURIComponent(id)}`;
}

export async function readRecord(token, uid, collection, id) {
  const response = await firestoreRequest(token, recordUrl(uid, collection, id));
  if (response.status === 404) return null;
  if (!response.ok) invalid("Could not read stored information.", [401, 403].includes(response.status) ? response.status : 502);
  return response.json();
}

export async function mutateRecord(token, uid, collection, id, build) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const current = await readRecord(token, uid, collection, id);
    const change = build(current);
    if (!change.fields) return change.result;
    const url = new URL(recordUrl(uid, collection, id));
    if (current) {
      if (!current.updateTime) throw new Error("Missing document update time.");
      url.searchParams.set("currentDocument.updateTime", current.updateTime);
    } else {
      url.searchParams.set("currentDocument.exists", "false");
    }
    const response = await firestoreRequest(token, url, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: change.fields }),
    });
    if (response.ok) return change.result;
    if ([409, 412].includes(response.status)) continue;
    const failure = await response.json().catch(() => null);
    if (response.status === 400 && failure?.error?.status === "FAILED_PRECONDITION") continue;
    invalid("Could not save stored information.", [401, 403].includes(response.status) ? response.status : 502);
  }
  invalid("This record changed repeatedly. Please retry.", 409);
}

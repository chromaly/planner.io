// Shared Firestore transport. Firebase ID tokens continue to enforce user rules.
const ROOT = "https://firestore.googleapis.com/v1/" +
  "projects/planner-io-f4953/databases/(default)/documents";

export function collectionUrl(uid, collection) {
  return `${ROOT}/users/${encodeURIComponent(uid)}/${encodeURIComponent(collection)}`;
}

export function firestoreRequest(token, url, options = {}) {
  return fetch(url, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${token}` },
    signal: options.signal ?? AbortSignal.timeout(10000),
  });
}

export async function readCollectionPage(token, uid, collection, pageToken) {
  const url = new URL(collectionUrl(uid, collection));
  url.searchParams.set("pageSize", "100");
  if (pageToken) url.searchParams.set("pageToken", pageToken);
  const response = await firestoreRequest(token, url);
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(`Could not retrieve ${collection}.`);
    error.code = data.error?.status;
    error.httpStatus = [400, 401, 403].includes(response.status) ? response.status : 502;
    throw error;
  }
  if (data.documents !== undefined && !Array.isArray(data.documents)) {
    throw new Error("Invalid Firestore document list.");
  }
  return { documents: data.documents ?? [], nextPageToken: data.nextPageToken ?? null };
}

export async function readPages(readPage, itemKey) {
  const items = [];
  const seenTokens = new Set();
  let pageToken = null;
  for (let page = 0; page < 20; page++) {
    const result = await readPage(pageToken);
    if (!Array.isArray(result[itemKey])) throw new Error("Invalid page item list.");
    items.push(...result[itemKey]);
    const next = result.nextPageToken;
    if (!next) return items;
    if (typeof next !== "string" || seenTokens.has(next)) {
      throw new Error("Invalid or repeated pagination token.");
    }
    seenTokens.add(next);
    pageToken = next;
  }
  throw new Error("Collection exceeded the page limit.");
}

export function readCollection(token, uid, collection) {
  return readPages(pageToken => readCollectionPage(token, uid, collection, pageToken), "documents");
}

function encodeValue(value) {
  if (value === null) return { nullValue: null };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number" && Number.isFinite(value)) {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeValue) } };
  if (value && typeof value === "object") return { mapValue: { fields: encodeFields(value) } };
  throw new Error("Unsupported Firestore field value.");
}

export function encodeFields(record) {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [key, encodeValue(value)]));
}

export async function createDocumentOnce(token, uid, collection, id, fields, matches) {
  const url = collectionUrl(uid, collection);
  const response = await firestoreRequest(token, `${url}?documentId=${encodeURIComponent(id)}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (response.ok) return id;
  if (response.status === 409) {
    const existing = await firestoreRequest(token, `${url}/${encodeURIComponent(id)}`);
    if (existing.ok && matches((await existing.json()).fields ?? {})) return id;
  }
  const failure = await response.json().catch(() => null);
  console.error("Firestore save rejected:", {
    httpStatus: response.status, status: failure?.error?.status,
  });
  throw new Error("Could not verify the save.");
}

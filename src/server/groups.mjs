import { readCollection } from "./firestore.mjs";

export async function readGroups(token, uid) {
  const documents = await readCollection(token, uid, "groups");
  return documents.map(document => ({
    id: document.name.split("/").at(-1),
    name: document.fields?.name?.stringValue ?? "",
    color: document.fields?.color?.stringValue ?? "",
  }));
}

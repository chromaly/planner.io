import type { NoteEntry } from "../data_types/note";

function same(a: NoteEntry, b: NoteEntry) {
  return a.content === b.content && a.topic === b.topic;
}

function mergeField<T>(base: T, next: T, remote: T): T {
  if (next === base) return remote;
  if (remote === base || remote === next) return next;

  throw new Error(
    "This note was edited elsewhere. Your draft has been kept.",
  );
}

export function mergeNoteEntries(
  base: NoteEntry[],
  next: NoteEntry[],
  remote: NoteEntry[],
): NoteEntry[] {
  const baseById = new Map(base.map((entry) => [entry.id, entry]));
  const nextById = new Map(next.map((entry) => [entry.id, entry]));
  const remoteById = new Map(remote.map((entry) => [entry.id, entry]));

  if (
    baseById.size !== base.length ||
    nextById.size !== next.length ||
    remoteById.size !== remote.length
  ) {
    throw new Error("Duplicate note entry IDs.");
  }

  for (const original of base) {
    const desired = nextById.get(original.id);
    const current = remoteById.get(original.id);

    if (!desired) {
      if (current && !same(current, original)) {
        throw new Error(
          "A note you removed changed elsewhere. Your draft has been kept.",
        );
      }

      remoteById.delete(original.id);
      continue;
    }

    if (!current) {
      if (!same(desired, original)) {
        throw new Error(
          "A note you edited was removed elsewhere. Your draft has been kept.",
        );
      }

      continue;
    }

    remoteById.set(original.id, {
      ...current,
      content: mergeField(
        original.content,
        desired.content,
        current.content,
      ),
      topic: mergeField(
        original.topic,
        desired.topic,
        current.topic,
      ),
    });
  }

  for (const entry of next) {
    if (baseById.has(entry.id)) continue;

    const current = remoteById.get(entry.id);

    if (current && !same(current, entry)) {
      throw new Error("Conflicting new note entry.");
    }

    remoteById.set(entry.id, entry);
  }

  return [...remoteById.values()];
}
import {
  collection,
  doc,
  setDoc,
  Timestamp,
  onSnapshot,
  deleteDoc,
} from "firebase/firestore"

import { db, notesModel } from "../firebase"
import type { DailyNote, NoteEntry, NotesAiResponse } from "../data_types/note"

export function subscribeToNotes(
  userId: string,
  onNotesChanged: (notes: DailyNote[]) => void
): () => void {
  const notesRef = collection(
    db,
    "users",
    userId,
    "notes"
  )

  return onSnapshot(notesRef, (snapshot) => {
    const notes = snapshot.docs.map((docSnap) => {
      const data = docSnap.data()

      return {
        id: docSnap.id,
        date: data.date,
        updatedAt: data.updatedAt.toDate(),
        entries: data.entries.map((entry: any) => ({
          id: entry.id,
          content: entry.content,
          createdAt: entry.createdAt.toDate(),
          topic: entry.topic ?? null,
        })),
      } as DailyNote
    })

    onNotesChanged(notes)
  })
}

export async function saveDailyNote(
  userId: string,
  date: string,
  entries: NoteEntry[]
): Promise<void> {
  const noteRef = doc(
    db,
    "users",
    userId,
    "notes",
    date
  )

  await setDoc(noteRef, {
    date,
    entries: entries.map((entry) => ({
      id: entry.id,
      content: entry.content,
      createdAt: Timestamp.fromDate(entry.createdAt),
      topic: entry.topic,
    })),
    updatedAt: Timestamp.fromDate(new Date()),
  })
}

export async function deleteDailyNote(
  userId: string,
  date: string
): Promise<void> {
  const noteRef = doc(
    db,
    "users",
    userId,
    "notes",
    date
  )

  await deleteDoc(noteRef)
}

export async function organizeNotesByTopic(
  notes: DailyNote[]
): Promise<NotesAiResponse> {
  const entries = notes.flatMap((note) =>
    note.entries.map((entry) => ({
      id: entry.id,
      content: entry.content,
      date: note.date,
      topic: entry.topic,
    }))
  )

  const existingTopics = [
    ...new Set(
      entries
        .map((entry) => entry.topic)
        .filter((topic): topic is string => topic !== null)
    ),
  ]

  const prompt = `
    Organize the following notes into topics.

    Existing topics:
    ${JSON.stringify(existingTopics)}

    Notes:
    ${JSON.stringify(entries)}

    Return a topic assignment for every note.
    Use an existing topic when appropriate.
    Create a new topic when no existing topic is a good fit.
    Do not change the note IDs or note contents.
    `

    const result = await notesModel.generateContent(prompt)

    const response = result.response.text()

    const data = JSON.parse(response) as NotesAiResponse

    const noteIds = new Set(entries.map((entry) => entry.id))
    const assignedIds = new Set<string>()

    for (const assignment of data.assignments) {
        if (!noteIds.has(assignment.noteId)) {
        throw new Error(
            `AI returned an unknown note ID: ${assignment.noteId}`
        )
        }

        if (assignedIds.has(assignment.noteId)) {
        throw new Error(
            `AI assigned a topic to the same note twice: ${assignment.noteId}`
        )
        }

        assignedIds.add(assignment.noteId)

        if (
        assignment.topic !== null &&
        assignment.topic.trim() === ""
        ) {
        throw new Error(
            `AI returned an empty topic for note: ${assignment.noteId}`
        )
        }
    }

    if (assignedIds.size !== noteIds.size) {
        throw new Error(
        "AI did not return a topic assignment for every note."
        )
    }

    return data
}
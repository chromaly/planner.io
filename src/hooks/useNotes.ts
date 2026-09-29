import { useEffect, useState } from "react"
import type { DailyNote, NoteEntry } from "../data_types/note"
import {
  subscribeToNotes,
  saveDailyNote,
  deleteDailyNote, 
  organizeNotesByTopic
} from "../services/notes"

export function useNotes(userId: string | null) {
  const [notes, setNotes] = useState<DailyNote[]>([])

  useEffect(() => {
    if (!userId) {
      setNotes([])
      return
    }

    return subscribeToNotes(userId, setNotes)
  }, [userId])

  async function saveNote(
    date: string,
    entries: NoteEntry[]
  ) {
    if (!userId) return

    await saveDailyNote(
      userId,
      date,
      entries
    )
  }

  async function deleteNote(date: string) {
    if (!userId) return

    await deleteDailyNote(userId, date)
  }

  async function sortNotesByTopic() {
    if (!userId) return

    if (notes.length === 0) return
    console.log(
  "NOTES:",
  notes.map((note) => ({
    date: note.date,
    entries: note.entries.map((entry) => ({
      id: entry.id,
      content: entry.content,
      topic: entry.topic,
    })),
  }))
)

    const result = await organizeNotesByTopic(notes)

    const assignments = new Map(
        result.assignments.map((assignment) => [
        assignment.noteId,
        assignment.topic,
        ])
    )

    const updatedNotes = notes.map((note) => ({
        ...note,
        entries: note.entries.map((entry) => ({
        ...entry,
        topic: assignments.get(entry.id) ?? entry.topic,
        })),
    }))

    await Promise.all(
        updatedNotes.map((note) =>
        saveDailyNote(
            userId,
            note.date,
            note.entries
        )
        )
    )
  }
  return {
    notes,
    saveNote,
    deleteNote,
    sortNotesByTopic
  }
}

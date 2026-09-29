export type NoteEntry = {
    id: string
    content: string
    createdAt: Date
    topic: string | null
}

export type DailyNote = {
    id: string
    date: string
    entries: NoteEntry[]
    updatedAt: Date
}

export type NoteTopicAssignment = {
  noteId: string
  topic: string | null
}

export type NotesAiResponse = {
  assignments: NoteTopicAssignment[]
}
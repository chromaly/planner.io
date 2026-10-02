import { useEffect, useRef, useState } from "react"
import type { DailyNote, NoteEntry } from "../data_types/note"

type NotesPageProps = {
  notes: DailyNote[]
  saveNote: (
    date: string,
    entries: NoteEntry[]
  ) => Promise<void>
  deleteNote: (date: string) => Promise<void>
  sortNotesByTopic: () => Promise<void>
}

export function NotesPage({
  notes,
  saveNote,
  deleteNote,
  sortNotesByTopic
}: NotesPageProps) {
    const [isSorting, setIsSorting] = useState(false)

    const [viewMode, setViewMode] = useState<"day" | "topic">("day")

  const [draftsByDate, setDraftsByDate] = useState<
    Record<string, string>
  >({})

  const saveTimeouts = useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({})

  const todayDate = getTodayDate()
  
  function getNoteContent(date: string) {
  const note = notes.find(
    (note) => note.date === date
  )

  return note?.entries
    .map((entry) => entry.content)
    .join("\n") ?? ""
  }

  function getTodayDate() {
    const today = new Date()

    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, "0")
    const day = String(today.getDate()).padStart(2, "0")

    return `${year}-${month}-${day}`
  }

  

  function handleChange(date: string, content: string) {
    setDraftsByDate((current) => ({
      ...current,
      [date]: content,
    }))

    const existingTimeout = saveTimeouts.current[date]

    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    saveTimeouts.current[date] = setTimeout(() => {
      void handleSave(date, content)
    }, 1500)
  }

  async function handleSortByTopic() {
        setIsSorting(true)

        try {
            await sortNotesByTopic()
        } catch (error) {
            console.error("Failed to organize notes:", error)
        } finally {
            setIsSorting(false)
        }
    }
  async function handleSave(date: string, content: string) {
    console.log("SAVING NOTE:", date, content)
    const lines = content
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)

    if (lines.length === 0) {
      await deleteNote(date)
      return
    }

    const existingNote = notes.find(
      (note) => note.date === date
    )

    const existingEntries = existingNote?.entries ?? []

    const entries: NoteEntry[] = lines.map(
      (line, index) => {
        const existingEntry = existingEntries[index]

        return {
          id: existingEntry?.id ?? crypto.randomUUID(),
          content: line,
          createdAt:
            existingEntry?.createdAt ?? new Date(),
          topic:
            existingEntry?.topic ?? null,
        }
      }
    )

    await saveNote(date, entries)
    setDraftsByDate((current) => {
        const next = { ...current }
        delete next[date]
        return next
    })
  }

  function formatDate(date: string) {
    const [year, month, day] = date
      .split("-")
      .map(Number)

    return new Date(
      year,
      month - 1,
      day
    ).toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  const sortedNotes = [...notes].sort(
    (a, b) => b.date.localeCompare(a.date)
  )

  function renderTextarea(
    date: string,
    placeholder?: string
  ) {
    return (
      <textarea
        value={draftsByDate[date] ?? getNoteContent(date)}
        onChange={(event) => handleChange(date, event.target.value)}
        placeholder={placeholder}
        rows={10}
        style={{ overflow: "auto" }}
        className="w-full bg-transparent text-text resize-none outline-none border-none ring-0 focus:outline-none focus-visible:outline-none focus:border-none focus:ring-0 text-base leading-7"
      />
    )
  }

  return (
    <div className="min-h-full p-6">
      <div className="max-w-4xl mx-auto  bg-surface rounded-xl p-10 shadow-lg shadow-text/15">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text">
            Notes
          </h1>

          <p className="text-text/60 mt-1">
            Everything your brain can't hold.
          </p>
        </div>

       <div className="flex gap-2 mb-8">
            <button
                type="button"
                onClick={() => setViewMode("day")}
                className={`px-3 py-1.5 rounded-lg ${
                viewMode === "day"
                    ? "bg-accent-2 text-text"
                    : "bg-bg-300 text-text"
                } transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1`}
            >
                By day
            </button>

            <button
                type="button"
                onClick={() => {
                if (viewMode === "topic") return
                void handleSortByTopic().then(() => {
                    setViewMode("topic")
                })
                }}
                disabled={isSorting}
                className={`px-3 py-1.5 rounded-lg ${
                viewMode === "topic"
                    ? "bg-accent-2 text-text"
                    : "bg-bg-300 text-text"
                } disabled:opacity-50 transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1`}
            >
                {isSorting ? "Organizing..." : "By topic"}
            </button>
        </div>
        {viewMode === "day" && (
             <div className="space-y-10">

          {/* CURRENT DAY */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-text">
                {formatDate(todayDate)}
              </h2>

              {notes.some(
                (note) => note.date === todayDate
              ) && (
                <button
                  type="button"
                  onClick={() => void deleteNote(todayDate)}
                  className="text-text/40 hover:text-red-400 transition-colors"
                  aria-label={`Delete notes from ${formatDate(todayDate)}`}
                >
                  🗑
                </button>
              )}
            </div>

            {renderTextarea(
              todayDate,
              "Start writing..."
            )}
          </section>

          {/* OLDER DAYS */}
          {sortedNotes
            .filter((note) => note.date !== todayDate)
            .map((note) => (
              <section key={note.id}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-text">
                    {formatDate(note.date)}
                  </h2>

                  <button
                    type="button"
                    onClick={() => void deleteNote(note.date)}
                    className="text-text/40 hover:text-red-400 transition-colors"
                    aria-label={`Delete notes from ${formatDate(note.date)}`}
                  >
                    🗑
                  </button>
                </div>

                {renderTextarea(note.date)}
              </section>
            ))}
            </div>
        )}

        {viewMode === "topic" && (
            <div className="space-y-10">
                {(() => {
                const entries = notes.flatMap((note) => note.entries)

                const topics = new Map<string, NoteEntry[]>()

                for (const entry of entries) {
                    const topic = entry.topic ?? "Unsorted"

                    if (!topics.has(topic)) {
                    topics.set(topic, [])
                    }

                    topics.get(topic)!.push(entry)
                }

                return [...topics.entries()].map(
                    ([topic, topicEntries]) => (
                    <section key={topic}>
                        <h2 className="text-lg font-semibold text-text mb-3">
                        {topic}
                        </h2>

                        <div className="border-t border-text/10 pt-3 space-y-2">
                        {topicEntries.map((entry) => (
                            <p
                            key={entry.id}
                            className="text-text leading-7"
                            >
                            {entry.content}
                            </p>
                        ))}
                        </div>
                    </section>
                    )
                )
                })()}
            </div>
            )}
        </div>
      </div>
  )
}
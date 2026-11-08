import { useState } from "react";
import { useNotes } from "../hooks/useNotes";
import type { NoteEntry } from "../data_types/note";

import { MobileNoteEditor } from "./MobileNoteEditor";

function localDate() {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function MobileNotes({ userId }: { userId: string | null }) {
  const { notes, saveNote, sortNotesByTopic } = useNotes(userId);

  const [sorting, setSorting] = useState(false);
  const [sortError, setSortError] = useState("");
  const [mode, setMode] = useState<"day" | "topic">("day");

  if (!userId) {
    return (
      <section className="mobile-page">
        <h2>Notes</h2>
        <p>Sign in below to see your notes.</p>
      </section>
    );
  }

  const today = localDate();

  const dates = [
    today,
    ...notes
      .filter((note) => note.date !== today)
      .map((note) => note.date)
      .sort((a, b) => b.localeCompare(a)),
  ];

  const topics = new Map<string, NoteEntry[]>();

  for (const note of notes) {
    for (const entry of note.entries) {
      const topic = entry.topic?.trim() || "Unsorted";
      const entries = topics.get(topic) ?? [];
      entries.push(entry);
      topics.set(topic, entries);
    }
  }

  async function handleOrganize() {
  if (sorting) return;

  setSorting(true);
  setSortError("");

  try {
    await sortNotesByTopic();
    setMode("topic");
  } catch {
    setSortError("Couldn't organize your notes. Please try again.");
  } finally {
    setSorting(false);
  }
}

  return (
    <section className="mobile-page mobile-notes">
      <h2>Notes</h2>
      <p className="mobile-notes-subtitle">
        Everything your brain can't hold.
      </p>

      <div className="mobile-notes-switcher" aria-label="Notes view">
        <button
          type="button"
          aria-pressed={mode === "day"}
          onClick={() => setMode("day")}
        >
          By Day
        </button>

        <button
        type="button"
        aria-pressed={mode === "topic"}
        disabled={sorting}
        onClick={() => {
            if (mode !== "topic") {
            void handleOrganize();
            }
        }}
        >
        {sorting ? "Organizing…" : "By Topic"}
        </button>
        {sortError && <p role="alert">{sortError}</p>}
      </div>

      {mode === "day" ? (
        dates.map((date) => {
          const entries =
            notes.find((note) => note.date === date)?.entries ?? [];

          return (
            <section className="mobile-note-section" key={date}>
              <h3>{formatDate(date)}</h3>

            <MobileNoteEditor
                key={`${userId}:${date}`}
                userId={userId}
                date={date}
                entries={entries}
                saveNote={saveNote}
            />
            </section>
          );
        })
      ) : topics.size ? (
        [...topics.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([topic, entries]) => (
            <section className="mobile-note-section" key={topic}>
              <h3>{topic}</h3>

              <div className="mobile-note-topic">
                {[...entries]
                  .sort(
                    (a, b) =>
                      a.createdAt.getTime() - b.createdAt.getTime(),
                  )
                  .map((entry) => (
                    <p key={entry.id}>{entry.content}</p>
                  ))}
              </div>
            </section>
          ))
      ) : (
        <div className="mobile-empty-day">
          <h4>No organized notes</h4>
          <p>Use the website to organize your notes by topic.</p>
        </div>
      )}
    </section>
  );
}
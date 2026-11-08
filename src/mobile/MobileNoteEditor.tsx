import { useCallback, useEffect, useState } from "react";
import type { NoteEntry } from "../data_types/note";

type Props = {
  userId: string;
  date: string;
  entries: NoteEntry[];
  saveNote: (
    date: string,
    entries: NoteEntry[],
    baseEntries?: NoteEntry[],
  ) => Promise<void>;
};

type Draft = {
  text: string;
  base: NoteEntry[];
};

function readDraft(key: string): Draft | null {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const draft = JSON.parse(stored);

    if (typeof draft.text !== "string" || !Array.isArray(draft.base)) {
      return null;
    }

    return {
      text: draft.text,
      base: draft.base.map((entry: NoteEntry) => ({
        ...entry,
        createdAt: new Date(entry.createdAt),
      })),
    };
  } catch {
    return null;
  }
}

export function MobileNoteEditor({
  userId,
  date,
  entries,
  saveNote,
}: Props) {
  const storageKey = `planner-mobile-note:${userId}:${date}`;

  const [draft, setDraft] = useState<Draft | null>(
    () => readDraft(storageKey),
  );
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  const text =
    draft?.text ?? entries.map((entry) => entry.content).join("\n");

  function handleChange(text: string) {
    const next = {
      text,
      base: draft?.base ?? entries.map((entry) => ({ ...entry })),
    };

    setDraft(next);

    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setStatus("Unsaved draft");
    } catch {
      setStatus("Unsaved — this browser couldn't keep a draft backup.");
    }
  }

  const handleSave = useCallback(async () => {
    if (!draft || saving) return;

    setSaving(true);
    setStatus("Saving…");

    const updated: NoteEntry[] = draft.text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((content, index) => {
        const previous = draft.base[index];

        return {
          id: previous?.id ?? crypto.randomUUID(),
          content,
          createdAt: previous?.createdAt ?? new Date(),
          topic: previous?.topic ?? null,
        };
      });

    try {
      await saveNote(date, updated, draft.base);

      // Keep the saved text visible until Firebase sends its update.
      setDraft(null);

      try {
        localStorage.removeItem(storageKey);
      } catch (error) {
        console.error("Mobile note save failed:", error);

        setStatus(
            `Couldn't save: ${
            error instanceof Error ? error.message : "Please try again."
            }`,
        );
    }

      setStatus("Saved");
    } catch {
      setStatus("Couldn't save. Your draft is still here; try again.");
    } finally {
      setSaving(false);
    }
  }, [date, draft, saveNote, saving, storageKey]);

  useEffect(() => {
  if (
    !draft ||
    saving ||
    status === "Saved" ||
    status.startsWith("Couldn't save")
  ) {
    return;
  }

  const timer = window.setTimeout(() => {
    void handleSave();
  }, 1500);

  return () => window.clearTimeout(timer);
}, [draft, saving, status, handleSave]);

  return (
    <div className="mobile-note-editor">
      <textarea
        aria-label={`Notes for ${date}`}
        value={text}
        onChange={(event) => handleChange(event.target.value)}
        placeholder="Start writing…"
        rows={10}
        disabled={saving}
      />
      {status.startsWith("Couldn't save") && (
        <div role="alert" style={{ padding: "12px 16px" }}>
            <p>{status}</p>
            <button type="button" onClick={() => void handleSave()}>
            Retry
            </button>
        </div>
      )}
    </div>
  );
}
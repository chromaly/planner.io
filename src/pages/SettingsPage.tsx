import { useState } from "react"

import { parseICSFile } from "../services/icsImporter"
import { useAuth } from "../components/AuthHandler"
import { CalendarImportModal } from "../components/CalendarImportModal"

import type {
  CreateEventData,
  Event,
} from "../data_types/event"

type Palette = "tvgirl" | "lalaland"

type SettingsPageProps = {
  theme: "dark" | "light"
  onThemeChange: (theme: "dark" | "light") => void
  aesthetic: Palette
  onAestheticChange: (aesthetic: Palette) => void
  addEvent: (event: Omit<Event, "id">) => Promise<void>
  events: Event[]
}

export function SettingsPage({
  theme,
  onThemeChange,
  aesthetic,
  onAestheticChange,
  addEvent,
  events,
}: SettingsPageProps) {
  const [importing, setImporting] = useState(false)
  const [importedEvents, setImportedEvents] = useState<
    CreateEventData[]
  >([])
  const [showImportModal, setShowImportModal] = useState(false)

  const { user } = useAuth()

  async function handleCalendarImport(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0]

    if (!file) return

    try {
      setImporting(true)

      const content = await file.text()
      const parsedEvents = parseICSFile(content)

      setImportedEvents(parsedEvents)
      setShowImportModal(true)
    } catch (error) {
      console.error("Failed to import calendar:", error)
    } finally {
      setImporting(false)
      event.target.value = ""
    }
  }

  async function handleImportSelected(
    selectedEvents: CreateEventData[]
  ) {
    for (const event of selectedEvents) {
      await addEvent(event)
    }

    console.log(
      `Imported ${selectedEvents.length} calendar event${
        selectedEvents.length === 1 ? "" : "s"
      }`
    )
  }

  function closeImportModal() {
    setShowImportModal(false)
    setImportedEvents([])
  }

  return (
    <div className="flex-1 px-6 py-8">
      <div className="max-w-3xl mx-auto bg-surface rounded-xl p-10 shadow-lg shadow-text/15">
        <h2 className="text-3xl font-bold text-accent-2 mb-8">
          Settings
        </h2>

        {/* Mode */}
        <div className="mb-8">
          <label className="block text-sm font-medium mb-3">
            Mode
          </label>

          <div className="flex gap-2">
            <button
              onClick={() => onThemeChange("dark")}
              className={`px-4 py-2 rounded-lg text-sm transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1 ${
                theme === "dark"
                  ? "bg-accent-2"
                  : "bg-surface"
              }`}
            >
              Dark
            </button>

            <button
              onClick={() => onThemeChange("light")}
              className={`px-4 py-2 rounded-lg text-sm transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1 ${
                theme === "light"
                  ? "bg-accent-2"
                  : "bg-surface"
              }`}
            >
              Light
            </button>
          </div>
        </div>

        {/* Color Scheme */}
        <div className="mb-8">
          <label className="block text-sm font-medium mb-3">
            Color Scheme
          </label>

          <div className="flex gap-2">
            <button
              onClick={() => onAestheticChange("tvgirl")}
              className={`px-4 py-2 rounded-lg text-sm transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1 ${
                aesthetic === "tvgirl"
                  ? "bg-accent-2"
                  : "bg-surface"
              }`}
            >
              TV Girl
            </button>

            <button
              onClick={() => onAestheticChange("lalaland")}
              className={`px-4 py-2 rounded-lg text-sm transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1 ${
                aesthetic === "lalaland"
                  ? "bg-accent-2"
                  : "bg-surface"
              }`}
            >
              La La Land
            </button>
          </div>
        </div>

        <div className="border-t border-text/10 pt-8">
          <label className="block text-sm font-medium mb-2">
            Calendar Import
          </label>

          <p className="text-sm text-text/60 mb-4">
            Import your existing calendar events from an .ics file.
          </p>

          <label className="inline-block">
            <input
              type="file"
              accept=".ics,text/calendar"
              className="hidden"
              onChange={handleCalendarImport}
            />

            <span
              className="
                inline-block
                px-4 py-2
                rounded-lg
                text-sm
                bg-accent-2
                cursor-pointer
                transition-transform
                duration-200
                [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]
                hover:scale-110
                hover:-rotate-2
                active:scale-90
                active:rotate-1
              "
            >
              {importing ? "Reading Calendar..." : "Import Calendar"}
            </span>
          </label>
        </div>
      </div>

      {showImportModal && (
        <CalendarImportModal
          events={importedEvents}
          existingEvents={events}
          onClose={closeImportModal}
          onImport={handleImportSelected}
        />
      )}
    </div>
  )
}
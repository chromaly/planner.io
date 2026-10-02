// @ts-ignore
import "./index.css"

import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom"

import { CalendarPage } from "./pages/CalendarPage"
import { NotesPage } from "./pages/NotesPage"
import { RemindersPage } from "./pages/RemindersPage"
import { SettingsPage } from "./pages/SettingsPage"

import { Header } from "./components/Header"
import { SignInModal } from "./components/SignInModal"
import { AiAssistant } from "./components/AiAssistant"
import { ConflictModal } from "./components/ConflictModal"

import { useEffect, useState } from "react"
import { useAuth } from "./components/AuthHandler"

import { useSettings } from "./hooks/useSettings"
import { useEvents } from "./hooks/useEvents"
import { useDeadlines } from "./hooks/useDeadlines"
import { useNotes } from "./hooks/useNotes"

import {
  findAvailableTimes,
  eventsOverlap,
} from "./utils/eventUtils"

import { presetColors } from "./data_types/presetColors"

import type {
  Event as PlannerEvent,
  Importance,
} from "./data_types/event"

import type { Deadline } from "./data_types/deadline"

type AiEvent = {
  title: string | null
  date: string | null
  startTime: string | null
  durationMinutes: number | null
  allDay: boolean
  recurrence: PlannerEvent["recurrence"]
  importance: Importance | null
  location: string | null
  notes: string | null
  confirmation?: boolean
  conflictAccepted?: boolean
}

type AiEdit = {
  eventId: string
  changes: {
    title: string | null
    date: string | null
    startTime: string | null
    durationMinutes: number | null
    allDay: boolean | null
    recurrence: PlannerEvent["recurrence"] | null
    importance: Importance | null
    location: string | null
    notes: string | null
  }
  confirmation?: boolean
  conflictAccepted?: boolean
}

type AiDeadline = {
  title: string | null
  date: string | null
  dueTime: string | null
  importance: Importance | null
  notes: string | null
  confirmation?: boolean
  conflictAccepted: boolean
}

type AiDeadlineEdit = {
  deadlineId: string
  changes: {
    title: string | null
    date: string | null
    dueTime: string | null
    importance: Importance | null
    notes: string | null
  }
  confirmation?: boolean
}

function ConflictHandler({
  isOpen,
  onFindTime,
  onAllowOverlap,
  onCancel,
}: {
  isOpen: boolean
  onFindTime: () => void
  onAllowOverlap: () => void
  onCancel: () => void
}) {
  const navigate = useNavigate()

  return (
    <ConflictModal
      isOpen={isOpen}
      onFindTime={() => {
        onFindTime()
        navigate("/")
      }}
      onAllowOverlap={() => {
        onAllowOverlap()
      }}
      onCancel={() => {
        onCancel()
      }}
    />
  )
}

function App() {
  const {
    user,
    handleSignIn,
    handleSignOut,
  } = useAuth()

  const [
    isSignInModalOpen,
    setIsSignInModalOpen,
  ] = useState(false)

  const {
    events,
    addEvent,
    editEvent,
    removeEvent,
  } = useEvents(user?.uid ?? null)

  const {
    deadlines,
    addDeadline,
    editDeadline,
    removeDeadline,
  } = useDeadlines(user?.uid ?? null)

  const {
    mode,
    palette,
    handleThemeChange,
    handlePaletteChange,
  } = useSettings(user)

  const {
    notes,
    saveNote,
    deleteNote,
    sortNotesByTopic,
  } = useNotes(user?.uid ?? null)

  const [isAiOpen, setIsAiOpen] =
    useState(false)

  const [pendingEvent, setPendingEvent] =
    useState<{
      event: PlannerEvent
      isEditing: boolean
    } | null>(null)

  const [allowOverlap, setAllowOverlap] =
    useState<
      (() => Promise<boolean>) | null
    >(null)

  const [
    isConflictModalOpen,
    setIsConflictModalOpen,
  ] = useState(false)

  function clearPendingEvent() {
    setPendingEvent(null)
  }

  useEffect(() => {
    document.body.className =
      `${mode} palette-${palette}`
  }, [mode, palette])

  function handleConflict(
    event: PlannerEvent,
    isEditing: boolean,
    allowOverlapCallback: () => Promise<boolean>
  ) {
    setPendingEvent({
      event,
      isEditing,
    })

    setAllowOverlap(
      () => allowOverlapCallback
    )

    setIsConflictModalOpen(true)
  }

  async function handleAIEvent(
    aiEvent: AiEvent
  ) {
    if (!user) {
      return {
        success: false,
        message:
          "You must be signed in to create an event.",
      }
    }

    if (
      aiEvent.title === null ||
      aiEvent.date === null ||
      aiEvent.startTime === null ||
      aiEvent.durationMinutes === null ||
      aiEvent.location === null ||
      aiEvent.importance === null ||
      aiEvent.notes === null
    ) {
      return {
        success: false,
        message:
          "Some event information is still missing.",
      }
    }

    const newEvent: Omit<
      PlannerEvent,
      "id"
    > = {
      name: aiEvent.title,

      startTime: new Date(
        `${aiEvent.date}T${aiEvent.startTime}`
      ),

      duration: aiEvent.durationMinutes,

      recurrence: aiEvent.recurrence,

      importance: aiEvent.importance,
      
      allDay: aiEvent.allDay,

      location: aiEvent.location,

      notes: aiEvent.notes,

      color: presetColors[0].value,

      groupId: null,
    }

    const eventForConflict: PlannerEvent = {
      id: "",
      ...newEvent,
    }

    const conflictingEvent =
      events.find((event) =>
        eventsOverlap(
          eventForConflict,
          event
        )
      )

    if (
      conflictingEvent &&
      !aiEvent.conflictAccepted
    ) {
      return {
        success: false,
        message:
          `That conflicts with "${conflictingEvent.name}". ` +
          `Please confirm that you're okay with the overlap.`,
      }
    }

    try {
      await addEvent(newEvent)

      return {
        success: true,
      }
    } catch (error) {
      console.error(
        "AI EVENT CREATE ERROR:",
        error
      )

      return {
        success: false,
        message:
          "I couldn't create that event.",
      }
    }
  }

  async function handleAIEdit(
    edit: AiEdit
  ) {
    console.log(
      "APP handleAIEdit CALLED:",
      edit
    )

    if (!user) {
      return {
        success: false,
        message:
          "You must be signed in to edit an event.",
      }
    }

    const existingEvent =
      events.find(
        (event) =>
          String(event.id) ===
          String(edit.eventId)
      )

    if (!existingEvent) {
      return {
        success: false,
        message:
          "I couldn't find that event.",
      }
    }

    const changes = edit.changes

    const updatedEvent: PlannerEvent = {
      ...existingEvent,

      name:
        changes.title !== null
          ? changes.title
          : existingEvent.name,

      duration:
        changes.durationMinutes !== null
          ? changes.durationMinutes
          : existingEvent.duration,

    allDay:
        changes.allDay !== null
            ? changes.allDay
            : existingEvent.allDay,
            recurrence:
                changes.recurrence !== null
                ? changes.recurrence
                : existingEvent.recurrence,

      importance:
        changes.importance !== null
          ? changes.importance
          : existingEvent.importance,

      location:
        changes.location !== null
          ? changes.location
          : existingEvent.location,

      notes:
        changes.notes !== null
          ? changes.notes
          : existingEvent.notes,
    }

    const newDate =
      changes.date ??
      `${existingEvent.startTime.getFullYear()}-` +
      `${String(
        existingEvent.startTime.getMonth() + 1
      ).padStart(2, "0")}-` +
      `${String(
        existingEvent.startTime.getDate()
      ).padStart(2, "0")}`

    const newTime =
      changes.startTime ??
      `${String(
        existingEvent.startTime.getHours()
      ).padStart(2, "0")}:` +
      `${String(
        existingEvent.startTime.getMinutes()
      ).padStart(2, "0")}`

    if (
      changes.date !== null ||
      changes.startTime !== null
    ) {
      updatedEvent.startTime =
        new Date(
          `${newDate}T${newTime}`
        )
    }

    const conflictingEvent =
      events.find(
        (event) =>
          event.id !== existingEvent.id &&
          eventsOverlap(
            updatedEvent,
            event
          )
      )

    if (
      conflictingEvent &&
      !edit.conflictAccepted
    ) {
      return {
        success: false,
        message:
          `That change would conflict with "${conflictingEvent.name}". ` +
          `Please confirm that you're okay with the overlap.`,
      }
    }

    try {
      await editEvent(updatedEvent)

      console.log(
        "APP AI EVENT EDITED SUCCESSFULLY"
      )

      return {
        success: true,
      }
    } catch (error) {
      console.error(
        "AI EDIT ERROR:",
        error
      )

      return {
        success: false,
        message:
          "I couldn't update that event.",
      }
    }
  }

  const handleAIDeadline = async (
  aiDeadline: AiDeadline
): Promise<{ success: boolean; message?: string }> => {
  if (
    aiDeadline.title === null ||
    aiDeadline.date === null ||
    aiDeadline.dueTime === null
  ) {
    return {
      success: false,
      message: "Some deadline information is still missing.",
    }
  }

  const dueTime = new Date(
    `${aiDeadline.date}T${aiDeadline.dueTime}`
  )

  const conflictingDeadlines = deadlines.filter(
    (deadline) =>
      deadline.dueTime.getTime() === dueTime.getTime()
  )

  if (
    conflictingDeadlines.length > 0 &&
    !aiDeadline.conflictAccepted
  ) {
    const names = conflictingDeadlines
      .map((deadline) => `"${deadline.name}"`)
      .join(", ")

    return {
      success: false,
      message: `This conflicts with ${names}. Would you like to create the deadline anyway?`,
    }
  }

  const newDeadline: Omit<Deadline, "id"> = {
    name: aiDeadline.title,
    dueTime,
    importance: aiDeadline.importance ?? "somewhat",
    notes: aiDeadline.notes ?? "",
    color: presetColors[0].value,
    groupId: null,
    completed: false,
  }

  await addDeadline(newDeadline)

  return {
    success: true,
    message: `Created deadline "${aiDeadline.title}".`,
  }
}

  async function handleAIDeadlineEdit(
    edit: AiDeadlineEdit
  ) {
    if (!user) {
      return {
        success: false,
        message:
          "You must be signed in to edit a deadline.",
      }
    }

    const existingDeadline =
      deadlines.find(
        (deadline) =>
          String(deadline.id) ===
          String(edit.deadlineId)
      )

    if (!existingDeadline) {
      return {
        success: false,
        message:
          "I couldn't find that deadline.",
      }
    }

    const changes = edit.changes

    const updatedDeadline: Deadline = {
      ...existingDeadline,

      name:
        changes.title !== null
          ? changes.title
          : existingDeadline.name,

      importance:
        changes.importance !== null
          ? changes.importance
          : existingDeadline.importance,

      notes:
        changes.notes !== null
          ? changes.notes
          : existingDeadline.notes,
    }

    const newDate =
      changes.date ??
      `${existingDeadline.dueTime.getFullYear()}-` +
      `${String(
        existingDeadline.dueTime.getMonth() + 1
      ).padStart(2, "0")}-` +
      `${String(
        existingDeadline.dueTime.getDate()
      ).padStart(2, "0")}`

    const newTime =
      changes.dueTime ??
      `${String(
        existingDeadline.dueTime.getHours()
      ).padStart(2, "0")}:` +
      `${String(
        existingDeadline.dueTime.getMinutes()
      ).padStart(2, "0")}`

    if (
      changes.date !== null ||
      changes.dueTime !== null
    ) {
      updatedDeadline.dueTime =
        new Date(
          `${newDate}T${newTime}`
        )
    }

    try {
      await editDeadline(
        updatedDeadline
      )

      return {
        success: true,
      }
    } catch (error) {
      console.error(
        "AI DEADLINE EDIT ERROR:",
        error
      )

      return {
        success: false,
        message:
          "I couldn't update that deadline.",
      }
    }
  }

  return (
    <BrowserRouter basename="/planner.io/">
      <div className="min-h-screen bg-bg text-text font-sans">
        <Header
          user={user}
          onSignIn={() =>
            setIsSignInModalOpen(true)
          }
          onSignOut={handleSignOut}
        />

        {isSignInModalOpen && (
          <SignInModal
            onSignIn={handleSignIn}
            onClose={() =>
              setIsSignInModalOpen(false)
            }
          />
        )}

        <Routes>
          <Route
            path="/"
            element={
              <CalendarPage
                events={events}
                addEvent={addEvent}
                editEvent={editEvent}
                removeEvent={removeEvent}
                onConflict={
                  handleConflict
                }
              />
            }
          />

          <Route
            path="/notes"
            element={
              <NotesPage
                saveNote={saveNote}
                deleteNote={deleteNote}
                notes={notes}
                sortNotesByTopic={
                  sortNotesByTopic
                }
              />
            }
          />

          <Route
            path="/reminders"
            element={
              <RemindersPage
                events={events}
                addEvent={addEvent}
                editEvent={editEvent}
                removeEvent={removeEvent}
                onConflict={
                  handleConflict
                }
              />
            }
          />

          <Route
            path="/settings"
            element={
              <SettingsPage
                theme={mode}
                onThemeChange={
                  handleThemeChange
                }
                aesthetic={palette}
                onAestheticChange={
                  handlePaletteChange
                }
                addEvent={addEvent}
                events={events}
              />
            }
          />
        </Routes>

        <AiAssistant
          events={events}
          deadlines={deadlines}

          handleAIEvent={
            handleAIEvent
          }

          handleAIEdit={
            handleAIEdit
          }

          handleAIDeadline={
            handleAIDeadline
          }

          handleAIDeadlineEdit={
            handleAIDeadlineEdit
          }

          findAvailableTimes={
            findAvailableTimes
          }

          isOpen={isAiOpen}
          setIsOpen={setIsAiOpen}

          pendingEvent={
            pendingEvent
          }

          clearPendingEvent={
            clearPendingEvent
          }
        />

        <ConflictHandler
          isOpen={
            isConflictModalOpen
          }

          onFindTime={() => {
            setIsConflictModalOpen(
              false
            )
            setAllowOverlap(null)
            setIsAiOpen(true)
          }}

          onAllowOverlap={async () => {
            if (!allowOverlap) return

            const saved =
              await allowOverlap()

            if (saved) {
              setIsConflictModalOpen(
                false
              )
              setAllowOverlap(null)
              setPendingEvent(null)
            }
          }}

          onCancel={() => {
            setIsConflictModalOpen(
              false
            )
            setAllowOverlap(null)
            setPendingEvent(null)
          }}
        />
      </div>
    </BrowserRouter>
  )
}

export default App
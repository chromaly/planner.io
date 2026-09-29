// @ts-ignore 
import "./index.css"

import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom"


import { CalendarPage } from "./pages/CalendarPage"
import { NotesPage } from "./pages/NotesPage"
import { RemindersPage } from "./pages/RemindersPage"
import { SettingsPage } from "./pages/SettingsPage"
import { Header } from "./components/Header"
import { SignInModal } from "./components/SignInModal"
import { useEffect, useState } from "react"
import { useAuth } from "./components/AuthHandler"
import { AiAssistant } from "./components/AiAssistant"
import { AiConflictModal } from "./components/AiConflictModal"

import { useSettings } from "./hooks/useSettings"
import { useEvents } from "./hooks/useEvents"

import { findAvailableTimes, eventsOverlap } from "./utils/eventUtils"

import { presetColors } from "./data_types/presetColors"
import type { Event as PlannerEvent } from "./data_types/event"
import { useNotes } from "./hooks/useNotes"

type AiEdit = {
  eventId: string
  changes: {
    title: string | null
    date: string | null
    startTime: string | null
    durationMinutes: number | null
    recurrence: PlannerEvent["recurrence"] | null
    importance: string | null
    location: string | null
  }
  confirmation?: boolean
}

function AiConflictHandler({ isOpen, onNo, onYes}: {
    isOpen: boolean
    onNo: () => void
    onYes: () => void
}) {
    const navigate = useNavigate()

     return (
        <AiConflictModal
            isOpen={isOpen}
            onYes={() => {onYes(), navigate("/")}}
            onNo={onNo}
    />
  )
}
function App() {    
    const { user, handleSignIn, handleSignOut } = useAuth()
    const [isSignInModalOpen, setIsSignInModalOpen] = useState(false) 

    const { events, addEvent, editEvent, removeEvent } = useEvents(user?.uid ?? null)

    const {
        mode,
        palette,
        handleThemeChange,
        handlePaletteChange,
    } = useSettings(user)

    const { notes, saveNote, deleteNote, sortNotesByTopic } = useNotes(user?.uid ?? null)

    const [isAiOpen, setIsAiOpen] = useState(false)
    const [pendingEvent, setPendingEvent] = useState<{event: PlannerEvent, isEditing: boolean} | null> (null)

    const [isAiConflictModalOpen, setIsAiConflictModalOpen] = useState(false)

    function clearPendingEvent() {
        setPendingEvent(null)
    }

    useEffect(() => {
        document.body.className = `${mode} palette-${palette}`
    }, [mode, palette])

    function handleConflict(event: PlannerEvent, isEditing: boolean) {
        setPendingEvent({ event, isEditing })
        setIsAiConflictModalOpen(true)
    }

    async function handleAIEvent(aiEvent: {
        title: string
        date: string
        startTime: string
        durationMinutes: number
        recurrence: PlannerEvent["recurrence"]
        importance: string
        location: string
        }) {
        if (!user) {
            return {
            success: false,
            message: "You must be signed in to create an event.",
            }
        }

        const newEvent = {
            name: aiEvent.title,
            startTime: new Date(`${aiEvent.date}T${aiEvent.startTime}`),
            duration: aiEvent.durationMinutes,
            recurrence: aiEvent.recurrence,
            importance: aiEvent.importance.toLowerCase() as
            | "very"
            | "somewhat"
            | "not too",
            location: aiEvent.location,
            notes: "",
            color: presetColors[0].value,
            groupId: null,
        }

        const conflictingEvent = events.find((event) =>
            eventsOverlap(
            {
                id: "",
                ...newEvent,
            },
            event
            )
        )

        if (conflictingEvent) {
            return {
            success: false,
            message: `That conflicts with "${conflictingEvent.name}" at ${aiEvent.startTime}! Choose another time for this new event.`,
            }
        }

        await addEvent(newEvent)

        return { success: true }
        }
    
        async function handleAIEdit(edit: AiEdit) {
            console.log("APP handleAIEdit CALLED:", edit)
    
            if (!user) {
                return {
                success: false,
                message: "You must be signed in to edit an event.",
                }
            }
    
            const existingEvent = events.find(
                (event) =>
                String(event.id) === String(edit.eventId)
            )
    
            if (!existingEvent) {
                return {
                success: false,
                message: "I couldn't find that event.",
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
    
                recurrence:
                changes.recurrence !== null
                    ? changes.recurrence
                    : existingEvent.recurrence,
    
                importance:
                changes.importance !== null
                    ? changes.importance.toLowerCase() as
                        | "very"
                        | "somewhat"
                        | "not too"
                    : existingEvent.importance,
    
                location:
                changes.location !== null
                    ? changes.location
                    : existingEvent.location,
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
                updatedEvent.startTime = new Date(
                `${newDate}T${newTime}`
                )
            }
    
            const conflictingEvent = events.find(
                (event) =>
                event.id !== existingEvent.id &&
                eventsOverlap(updatedEvent, event)
            )
    
            if (conflictingEvent) {
                return {
                success: false,
                message: `That would conflict with "${conflictingEvent.name}".`,
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
                "APP AI EVENT EDIT ERROR:",
                error
                )
    
                return {
                success: false,
                message: "I couldn't update that event.",
                }
            }
            }

  return (
    <BrowserRouter basename="/planner.io/">
      <div className="min-h-screen bg-bg text-text font-sans py-15">
        <Header
            user={user}
            onSignIn={() => setIsSignInModalOpen(true)}
            onSignOut={handleSignOut}           
        />

        {isSignInModalOpen && (
        <SignInModal
            onSignIn={handleSignIn}
            onClose={() => setIsSignInModalOpen(false)}
        />
        )}
        <Routes>
          <Route path="/" element={<CalendarPage 
            events={events}
            addEvent={addEvent}
            editEvent={editEvent}
            removeEvent={removeEvent}
            onConflict={handleConflict}/>
          }/>
          <Route path="/notes" element={<NotesPage
            saveNote={saveNote}
            deleteNote={deleteNote}
            notes={notes}
            sortNotesByTopic={sortNotesByTopic}/>} />
          <Route path="/reminders" element={<RemindersPage
            events={events}
            addEvent={addEvent}
            editEvent={editEvent}
            removeEvent={removeEvent}
            onConflict={handleConflict}/>
            } />
          <Route path="/settings" element={<SettingsPage
            theme={mode}
            onThemeChange={handleThemeChange}
            aesthetic={palette}
            onAestheticChange={handlePaletteChange} />}
          />
        </Routes>
         <AiAssistant
                    events={events}
                    handleAIEvent={handleAIEvent}
                    handleAIEdit={handleAIEdit}
                    findAvailableTimes={findAvailableTimes}
                    isOpen={isAiOpen}
                    setIsOpen={setIsAiOpen}
                    pendingEvent={pendingEvent}
                    clearPendingEvent={clearPendingEvent}
        />

        <AiConflictHandler
            isOpen={isAiConflictModalOpen}
             onNo={() => {
                setIsAiConflictModalOpen(false)
                setPendingEvent(null)
            }}

            onYes={() => {
                setIsAiConflictModalOpen(false)
                setIsAiOpen(true)
            }}
        />
      </div>
    </BrowserRouter>
  )
}

export default App
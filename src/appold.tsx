/*
import "./index.css"

import { useEffect, useState } from "react"

// data types
import type { Event } from "./data_types/event"

// utils
import { findAvailableTimes, eventsOverlap } from "./utils/eventUtils"
// hooks
import { useEvents } from "./hooks/useEvents"
import { useCalendar } from "./hooks/useCalendar"
import { useSettings } from "./hooks/useSettings"
import { useEventForm } from "./hooks/useEventForm"

// components
import { useAuth } from "./components/AuthHandler"
import { Header } from "./components/Header"
import { SignInModal } from "./components/SignInModal"
import { Settings } from "./components/Settings"
import { WeekGrid } from "./components/WeekGrid"
import { MonthGrid } from "./components/MonthGrid"
import { EventModal } from "./components/EventModal"
import { AiConflictModal } from "./components/AiConflictModal"
import { AiAssistant } from "./components/AiAssistant"

const presetColors = [
    {value: "#ff2e88" },
    {value: "#a020f0" },
    {value: "#0047ab" },
    {value: "#5f2fbd" },
    {value: "#170063" },
    {value: "#e930ff" },
]

type AiEdit = {
  eventId: string
  changes: {
    title: string | null
    date: string | null
    startTime: string | null
    durationMinutes: number | null
    repeatable: string | null
    importance: string | null
    location: string | null
  }
  confirmation?: boolean
}

function App() {
    const { user, handleSignIn, handleSignOut } = useAuth()

    const { events, addEvent, editEvent, removeEvent } = useEvents(
    user?.uid ?? null
    )

    const { selectedDate, selectedMonth, viewMode, weekDays, setSelectedDate, setSelectedMonth, setViewMode, previousWeek, nextWeek, previousMonth, nextMonth } = useCalendar()

    const { mode, palette, handleThemeChange, handlePaletteChange } = useSettings(user)

    const { formData, editingEventID, updateField, resetForm, startEditing, handleSubmit, pendingEvent, clearPendingEvent } = useEventForm({user, events, addEvent, editEvent})
    
    useEffect(() => {
    document.body.className = `${mode} palette-${palette}`
    }, [mode, palette])

    useEffect(() => {
        if (pendingEvent) {
            setIsAiConflictModalOpen(true)
        }
    }, [pendingEvent])
    const [isSignInModalOpen, setIsSignInModalOpen] = useState(false)
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
    const [isEventModalOpen, setIsEventModalOpen] = useState(false)

    const [isAiConflictModalOpen, setIsAiConflictModalOpen] = useState(false)
    const [isAiOpen, setIsAiOpen] = useState(false)

    async function handleAIEvent(aiEvent: {
        title: string
        date: string
        startTime: string
        durationMinutes: number
        repeatable: string
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
            repeatable: aiEvent.repeatable.toLowerCase() as
            | "never"
            | "daily"
            | "weekly"
            | "monthly",
            importance: aiEvent.importance.toLowerCase() as
            | "very"
            | "somewhat"
            | "not too",
            location: aiEvent.location,
            notes: "",
            color: presetColors[0].value,
            userId: user.uid,
        }

        const conflictingEvent = events.find((event) =>
            eventsOverlap(
            { id: "", ...newEvent },
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

        const updatedEvent: Event = {
            ...existingEvent,
            name:
            changes.title !== null
                ? changes.title
                : existingEvent.name,

            duration:
            changes.durationMinutes !== null
                ? changes.durationMinutes
                : existingEvent.duration,

            repeatable:
            changes.repeatable !== null
                ? changes.repeatable.toLowerCase() as
                    | "never"
                    | "daily"
                    | "weekly"
                    | "monthly"
                : existingEvent.repeatable,

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
    <div className="min-h-screen bg-bg text-text font-sans">
        <Header
            user={user}
            onSignIn={() => setIsSignInModalOpen(true)}
            onSignOut={handleSignOut}
            onOpenSettings={() => {}}
            onOpenReminders={() => {}}
            onOpenNotes={() => {}}
           
        />

        {isSignInModalOpen && (
        <SignInModal
            onSignIn={handleSignIn}
            onClose={() => setIsSignInModalOpen(false)}
        />
        )}

        <EventModal
            isOpen={isEventModalOpen}
            onClose={() => { setIsEventModalOpen(false), resetForm()}}
            formData={formData}
            updateField={updateField}
            onSubmit={async () => {
                const saved = await handleSubmit()

                if (saved) {
                    setIsEventModalOpen(false)
                }
            }}
            editingEventID={editingEventID}
            presetColors={presetColors}
        /> 

        <AiConflictModal
            isOpen={isAiConflictModalOpen}
            onYes={() => {
                setIsAiConflictModalOpen(false)
                setIsEventModalOpen(false)
                setIsAiOpen(true)
            }}
            onNo={() => {
                setIsAiConflictModalOpen(false)
            }}
        />
        
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
        <div className="flex-1 min-w-0 flex justify-center">
        <div className="w-full max-w-[900px]">

            <div className="flex items-center justify-between mb-3">
            <button
                className="bg-accent-2 hover:bg-accent-2/80 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-black/15 transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1"
                onClick={() => setIsEventModalOpen(true)}
            >
                Add Event
            </button>

            {viewMode === "week" ? (
                <button
                className="bg-accent-2 hover:bg-accent-2/80 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-black/15 transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1"
                onClick={() => setViewMode("month")}
                >
                Monthly View
                </button>
            ) : (
                <button
                className="bg-accent-2 hover:bg-accent-2/80 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-black/15 transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1"
                onClick={() => setViewMode("week")}
                >
                Weekly View
                </button>
            )}
            </div>

            <div className="flex items-center justify-between mb-4">
            <button
                onClick={viewMode === "week" ? previousWeek : previousMonth}
                className="bg-accent-1 hover:bg-accent-1/80 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-black/15 hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1"
            >
                ← Prev
            </button>

            <span className="text-sm font-medium">
                {viewMode === "week"
                ? `${weekDays[0].toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    })} – ${weekDays[6].toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    })}`
                : selectedMonth.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                    })}
            </span>

            <button
                onClick={viewMode === "week" ? nextWeek : nextMonth}
                className="bg-accent-1 hover:bg-accent-1/80 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-black/15 hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1"
            >
                Next →
            </button>
            </div>

            {viewMode === "week" ? (
            <WeekGrid
                events={events}
                weekDays={weekDays}
                onEventClick={(event) => {startEditing(event), setIsEventModalOpen(true)} }
            />
            ) : (
            <MonthGrid
                selectedMonth={selectedMonth}
                events={events}
                onDayClick={(day) => {
                setSelectedDate(day)
                setViewMode("week")
                }}
            />
            )}

        </div>
        </div>
    </div>
    )
}

export default App

*/
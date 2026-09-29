import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
// data types
import type { Event } from "../data_types/event"
import { presetColors } from "../data_types/presetColors"

// hooks
import { useCalendar } from "../hooks/useCalendar"
import { useSettings } from "../hooks/useSettings"
import { useEventForm } from "../hooks/useEventForm"

// components
import { useAuth } from "../components/AuthHandler"
import { WeekGrid } from "../components/WeekGrid"
import { MonthGrid } from "../components/MonthGrid"
import { EventModal } from "../components/EventModal"
import { EventDetailsModal } from "../components/EventDetailsModal"

type CalendarPageProps = {
    events: Event[]
    addEvent: (event: Omit<Event, "id">) => Promise<void>
    editEvent: (event: Event) => Promise<void>
    removeEvent: (eventId: string) => Promise<void>
    onConflict: (event: Event, isEditing: boolean) => void
}
export function CalendarPage({ events, addEvent, editEvent, removeEvent, onConflict}: CalendarPageProps) {

    const location = useLocation()

    const { user, handleSignIn, handleSignOut } = useAuth()

    const { selectedDate, selectedMonth, viewMode, weekDays, setSelectedDate, setSelectedMonth, setViewMode, previousWeek, nextWeek, previousMonth, nextMonth } = useCalendar()

    const { mode, palette, handleThemeChange, handlePaletteChange } = useSettings(user)

    const { formData, editingEventID, updateField, resetForm, startEditing, handleSubmit } = useEventForm({user, events, addEvent, editEvent, onConflict})
    
    useEffect(() => {
    document.body.className = `${mode} palette-${palette}`
    }, [mode, palette])

    useEffect(() => {
        const selectedEventId = location.state?.selectedEventId

        if (!selectedEventId) return

        const event = events.find(
            (event) => event.id === selectedEventId
        )

        if (event) {
            setSelectedEvent(event)
        }
    }, [location.state?.selectedEventId, events])

    const [isEventModalOpen, setIsEventModalOpen] = useState(false)

    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

    
    return (
    <div>
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
        
        <div className="flex-1 min-w-0 flex justify-center">
        <div className="w-full max-w-[900px]">

            <div className="flex items-center justify-between mb-3">
            <button
                className="bg-accent-2 hover:bg-accent-2/80 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-text/15 transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1"
                onClick={() => setIsEventModalOpen(true)}
            >
                Add Event
            </button>

            {viewMode === "week" ? (
                <button
                className="bg-accent-2 hover:bg-accent-2/80 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-text/15 transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1"
                onClick={() => setViewMode("month")}
                >
                Monthly View
                </button>
            ) : (
                <button
                className="bg-accent-2 hover:bg-accent-2/80 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-text/15 transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1"
                onClick={() => setViewMode("week")}
                >
                Weekly View
                </button>
            )}
            </div>

            <div className="flex items-center justify-between mb-4">
            <button
                onClick={viewMode === "week" ? previousWeek : previousMonth}
                className="bg-accent-1 hover:bg-accent-1/80 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-text/15 hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1"
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
                className="bg-accent-1 hover:bg-accent-1/80 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-text/15 hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1"
            >
                Next →
            </button>
            </div>

            {viewMode === "week" ? (
            <WeekGrid
                events={events}
                weekDays={weekDays}
                onEventClick={(event) => setSelectedEvent(event)}
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

            {selectedEvent && (
                <EventDetailsModal
                    event={selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                    onEdit={() => {
                    startEditing(selectedEvent)
                    setSelectedEvent(null)
                    setIsEventModalOpen(true)
                    }}
                    onDelete={async () => {
                    await removeEvent(selectedEvent.id)
                    setSelectedEvent(null)
                    }}
                />
            )}
        </div>
        </div>
    </div>
    )
}
import { useEffect, useState } from "react"
import { useLocation, useSearchParams } from "react-router-dom"
// data types
import type { Event } from "../data_types/event"
import { presetColors } from "../data_types/presetColors"

// hooks
import { useCalendar } from "../hooks/useCalendar"
import { useSettings } from "../hooks/useSettings"
import { useEventForm } from "../hooks/useEventForm"
import { useDeadlineForm } from "../hooks/useDeadlineForm"

// components
import { useAuth } from "../components/AuthHandler"
import { WeekGrid } from "../components/WeekGrid"
import { MonthGrid } from "../components/MonthGrid"
import { EventModal } from "../components/EventModal"
import { EventDetailsModal } from "../components/EventDetailsModal"
import { DeadlineModal } from "../components/DeadlineModal"
import { useDeadlines } from "../hooks/useDeadlines"
import { DeadlineDetailsModal } from "../components/DeadlinesDetailsModal"
import { Deadline } from "../data_types/deadline"

type CalendarPageProps = {
    events: Event[]
    addEvent: (event: Omit<Event, "id">) => Promise<void>
    editEvent: (event: Event) => Promise<void>
    removeEvent: (eventId: string) => Promise<void>
    onConflict: (event: Event, isEditing: boolean, allowOverlap: () => Promise<boolean>) => void
}
export function CalendarPage({ events, addEvent, editEvent, removeEvent, onConflict}: CalendarPageProps) {

    const location = useLocation()

    const { user } = useAuth()

    const { selectedDate, selectedMonth, viewMode, weekDays, setSelectedDate, setSelectedMonth, setViewMode, previousWeek, nextWeek, previousMonth, nextMonth } = useCalendar()

    const { mode, palette, handleThemeChange, handlePaletteChange } = useSettings(user)

    const { deadlines, addDeadline, editDeadline, removeDeadline } = useDeadlines(user?.uid ?? null)

    const {
        formData: deadlineFormData,
        editingDeadlineID,
        updateField: updateDeadlineField,
        resetForm: resetDeadlineForm,
        startEditing: startEditingDeadline,
        handleSubmit: handleDeadlineSubmit,
    } = useDeadlineForm({
        user,
        addDeadline,
        editDeadline,
    })

    const { formData, editingEventID, updateField, resetForm, startEditing, handleSubmit } = useEventForm({user, events, addEvent, editEvent, onConflict: (event, isEditing) => {setIsEventModalOpen(false), onConflict(event, isEditing, () => handleSubmit(true))}})

    
    useEffect(() => {
    document.body.className = `${mode} palette-${palette}`
    }, [mode, palette])

    const [searchParams] = useSearchParams()
    
    useEffect(() => {
        const selectedEventId =
            searchParams.get("eventId") ??
            location.state?.selectedEventId

        if (!selectedEventId) return

        const event = events.find(
            (event) => event.id === selectedEventId
        )

        if (event) {
            setSelectedEvent(event)
        }
    }, [searchParams, location.state?.selectedEventId, events])

    useEffect(() => {
        const selectedDeadlineId =
            searchParams.get("deadlineId") ??
            location.state?.selectedDeadlineId

        if (!selectedDeadlineId) return

        const deadline = deadlines.find(
            (deadline) => deadline.id === selectedDeadlineId
        )

        if (deadline) {
            setSelectedDeadline(deadline)
        }
    }, [searchParams, location.state?.selectedDeadlineId, deadlines])

    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false)
    const [isEventModalOpen, setIsEventModalOpen] = useState(false)
    const [isDeadlineModalOpen, setIsDeadlineModalOpen] = useState(false)

    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
    const [selectedDeadline, setSelectedDeadline] = useState<Deadline | null>(null)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const eventId = params.get("eventId")

        if (!eventId || !events.length) return

        const event = events.find((event) => event.id === eventId)

        if (event) {
            setSelectedEvent(event)

            window.history.replaceState({}, "", window.location.pathname)
        }
        }, [events])
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
        
        <DeadlineModal
                isOpen={isDeadlineModalOpen}
                onClose={() => {
                    setIsDeadlineModalOpen(false)
                    resetDeadlineForm()
                }}
                formData={deadlineFormData}
                updateField={updateDeadlineField}
                onSubmit={async () => {
                    const saved = await handleDeadlineSubmit()

                    if (saved) {
                        setIsDeadlineModalOpen(false)
                    }
                }}
                editingDeadlineID={editingDeadlineID}
                presetColors={presetColors}
                />
        <div className="flex-1 min-w-0 flex justify-center">
        <div className="w-full max-w-[900px]">

            <div className="flex items-center justify-between mb-3">
            <div className="relative">
                <button
                    className="bg-accent-2 hover:bg-accent-2/80 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-text/15 transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1"
                    onClick={() => setIsAddMenuOpen((current) => !current)}
                >
                    + Add
                </button>

                {isAddMenuOpen && (
                    <div className="absolute left-0 mt-2 w-40 bg-surface border border-accent-2/40 rounded-lg shadow-lg z-20 overflow-hidden animate-[dropdownBounce_0.25s_cubic-bezier(0.34,1.56,0.64,1)]">
                    <button
                        type="button"
                        onClick={() => {
                        setIsAddMenuOpen(false)
                        setIsEventModalOpen(true)
                        resetForm()
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-accent-1/20 transition-colors"
                    >
                        + Event
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                        setIsAddMenuOpen(false)
                        setIsDeadlineModalOpen(true)
                        resetDeadlineForm()
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-accent-1/20 transition-colors"
                    >
                        ◆ Deadline
                    </button>
                    </div>
                )}
                </div>

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
                deadlines={deadlines}
                weekDays={weekDays}
                onEventClick={(event) => setSelectedEvent(event)}
                onDeadlineClick={(deadline) => setSelectedDeadline(deadline)}
            />
            ) : (
            <MonthGrid
                selectedMonth={selectedMonth}
                events={events}
                deadlines={deadlines}
                onDayClick={(day) => {
                setSelectedDate(day)
                setViewMode("week")
                }}
                onDeadlineClick={(deadline) => {setSelectedDeadline(deadline), setViewMode("week")}}
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
            {selectedDeadline && (
                <DeadlineDetailsModal
                    deadline={selectedDeadline}
                    onClose={() => setSelectedDeadline(null)}
                    onEdit={() => {
                    startEditingDeadline(selectedDeadline)
                    setSelectedDeadline(null)
                    setIsDeadlineModalOpen(true)
                    }}
                    onDelete={async () => {
                    await removeDeadline(selectedDeadline.id)
                    setSelectedDeadline(null)
                    }}
                />
                )}
                </div>
        </div>
    </div>
    )
}
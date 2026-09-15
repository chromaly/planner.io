import { useState, useRef, useEffect } from 'react'
import './index.css'

import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp, query, where } from "firebase/firestore"
import { db } from './firebase'

// Importing Custom JSX Elements

import { createEvent, eventOccursOnDay, eventsOverlap, getWeekDays } from "./components/EventHelpers.jsx"

import { EventModal } from "./components/EventModal.jsx"

import { SettingsModal } from "./components/SettingsModal.jsx"

import { UserMenu } from "./components/UserMenu.jsx"

import { WeekGrid } from "./components/WeekGrid.jsx"

import { MonthGrid } from "./components/MonthGrid.jsx"

import { RemindersTab } from "./components/RemindersTab.jsx"

import { useAuth } from "./components/AuthHandler.js"

import { useSettings } from "./components/SettingsHandler.js"

import { AiAssistant } from "./components/AiAssistant.jsx"

import { AiConflictModal } from './components/AiConflictModal.jsx'

function App() {
    // User Signin Handlers
    const { user, handleSignIn, handleSignOut } = useAuth()

    // Theme Handlers
    const { mode, palette, handleThemeChange, handlePaletteChange } = useSettings(user)

    // Event Handlers
    const [events, setEvents] = useState([])

    const [formData, setFormData] = useState({
      name: "", date: "", time: "", duration: 30, repeatable: "never",
      importance: "somewhat", location: "", notes: "", color: ""})

    // Website Event Handlers
    const [eventModal, setEventModal] = useState(false)

    const [isSignInModalOpen, setIsSignInModalOpen] = useState(false)
    
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    const [selectedDate, setSelectedDate] = useState(new Date())

    const [selectedMonth, setSelectedMonth] = useState(new Date())

    const [selectedEvent, setSelectedEvent] = useState(null)

    const [editingEventID, setEditingEventID] = useState(null)

    const [viewMode, setViewMode] = useState("week")
    
    const [aiConflictEvent, setAiConflictEvent] = useState(null)

    const [aiConflictModal, setAiConflictModal] = useState(false)

    const [aiOpen, setAiOpen] = useState(false)

    const [aiInitialMessage, setAiInitialMessage] = useState(null)

    const dayEvents = events.filter(event => { 
      return event.startTime.toDateString() === selectedDate.toDateString()
    })
    
    const hours = Array.from({ length: 16 }, (_, i) => i + 7)
    const weekDays = getWeekDays(selectedDate)
    
    async function addEvent(newEvent) {
      const {id, ...eventWithoutId } = newEvent
      await addDoc(collection(db, "events"), {
        ...eventWithoutId,
        startTime: Timestamp.fromDate(newEvent.startTime),
      })
      setEventModal(false)
    }
    
    async function deleteEvent(eventId) {
      await deleteDoc(doc(db, "events", eventId))
      setSelectedEvent(null)
    }
    function updateField(field, value) {
      setFormData({ ...formData, [field]: value })
    }

    function startEdit(event) {
      setFormData({
        name: event.name,
        date: event.startTime.toISOString().split("T")[0],
        time: event.startTime.toTimeString().slice(0, 5),
        duration: event.duration,
        repeatable: event.repeatable,
        importance: event.importance,
        location: event.location,
        notes: event.notes,
        color: event.color
      })
      setEditingEventID(event.id)
      setSelectedEvent(null)
      setEventModal(true)
    }

    async function handleSubmit() {
      if (!formData.name || !formData.date || !formData.time || !formData.duration || !formData.location) {
        alert("Please fill out all required fields.")
        return
      }

      const startTime = new Date(`${formData.date}T${formData.time}`)
      const newEvent = createEvent(formData.name,
        startTime,
        formData.duration,
        formData.repeatable,
        formData.importance,
        formData.location,
        formData.notes,
        formData.color,
        user?.uid ?? null)

      const resetForm = () => {
        setEditingEventID(null)
        setEventModal(false)
        setFormData({name: "", date: "", time: "", duration: 30, repeatable: "never",
        importance: "somewhat", location: "", notes: "", color: presetColors[0].value})
      }

      const conflictingTime = events.some(checkEvent => checkEvent.id !== editingEventID && eventsOverlap(newEvent, checkEvent))

      if (conflictingTime) {
        setAiConflictEvent(newEvent)
        setAiConflictModal(true)
        return 
      }

      if (!user) {
        setEvents(prev => [...prev, newEvent])
        resetForm()
        return
      }else{
         if (editingEventID) {
          const { id, ...eventWithoutId } = newEvent
          await updateDoc(doc(db, "events", editingEventID), {
            ...eventWithoutId,
            startTime: Timestamp.fromDate(startTime)
          })
        }else{
          await addEvent(newEvent)
        }
        resetForm()
      }
    }

    async function handleAIEvent(aiEvent) {
      const startTime = new Date(`${aiEvent.date}T${aiEvent.startTime}`)

      const newEvent = createEvent(
        aiEvent.title,
        startTime,
        aiEvent.durationMinutes,
        aiEvent.repeatable.toLowerCase(),
        aiEvent.importance.toLowerCase(),
        aiEvent.location,
        "",
        presetColors[0].value,
        user?.uid ?? null
      )

      const conflictingEvent = events.find(
        checkEvent => eventsOverlap(newEvent, checkEvent)
      )

      if (conflictingEvent) {
        return {
          success: false,
          message: `That conflicts with "${conflictingEvent.name}" at ${aiEvent.startTime}! Choose another time for this new event.`
        }
      }

      if (!user) {
        setEvents(prev => [...prev, newEvent])

        return { success: true }
      } else {
        await addEvent(newEvent)
        return { success: true }
      }
    }
    
    async function handleAIEdit(edit) {
      console.log("AI EDIT RECEIVED:", edit)
      const existingEvent = events.find(
        event => String(event.id) === String(edit.eventId)
      )
      console.log("EXISTING EVENT:", existingEvent)
      if (!existingEvent) {
        return {
          success: false,
          message: "I couldn't find that event."
        }
      }

      const updatedEvent = {
        ...existingEvent
      }
      if (edit.changes.title !== null) {
        updatedEvent.name = edit.changes.title
      }

      if (edit.changes.durationMinutes !== null) {
        updatedEvent.duration = edit.changes.durationMinutes
      }

      if (edit.changes.repeatable !== null) {
        updatedEvent.repeatable = edit.changes.repeatable.toLowerCase()
      }

      if (edit.changes.location !== null) {
        updatedEvent.location = edit.changes.location
      }

      if (edit.changes.importance !== null) {
        updatedEvent.importance = edit.changes.importance.toLowerCase()
      }

      const newDate =
        edit.changes.date ??
        existingEvent.startTime.toISOString().split("T")[0]

      const newTime =
        edit.changes.startTime ??
        existingEvent.startTime.toTimeString().slice(0, 5)

      if (
        edit.changes.date !== null ||
        edit.changes.startTime !== null
      ) {
        updatedEvent.startTime = new Date(`${newDate}T${newTime}`)
      }

      const conflictingEvent = events.find(
        event =>
          String(event.id) !== String(edit.eventId) &&
          eventsOverlap(updatedEvent, event)
      )
      if (conflictingEvent) {
        return {
          success: false,
          message: `That would conflict with "${conflictingEvent.name}".`
        }
      }

      if (!user) {
        setEvents(prev =>
          prev.map(event =>
            String(event.id) === String(edit.eventId)
              ? updatedEvent
              : event
          )
        )

        return { success: true }
      } else{
        console.log("UPDATED EVENT:", updatedEvent)
        console.log("EDITING FIREBASE ID:", edit.eventId)
        const { id, ...eventWithoutId } = updatedEvent
          await updateDoc(doc(db, "events", edit.eventId), {
            ...eventWithoutId,
            startTime: Timestamp.fromDate(updatedEvent.startTime)
          })

          return { success: true }
      }
    }
    function getEventsForDay(date) {
      return events.filter(event => eventOccursOnDay(event, date))
    }

    function findAvailableTimes(date, durationMinutes) {
      const dayStart = new Date(date)
      dayStart.setHours(7, 0, 0, 0)

      const dayEnd = new Date(date)
      dayEnd.setHours(22, 0, 0, 0)

      const dayEvents = getEventsForDay(date)

      console.log("DAY EVENTS:", dayEvents)

      dayEvents.sort((a, b) => a.startTime - b.startTime)

      const availableTimes = []

      let currentTime = dayStart

      for (const event of dayEvents) {
        const eventStart = event.startTime

        const eventEnd = new Date(
          eventStart.getTime() + event.duration * 60000
        )

        const freeMinutes = (eventStart - currentTime) / 60000

        if (freeMinutes >= durationMinutes) {
          availableTimes.push({
            start: new Date(currentTime),
            end: new Date(eventStart)
          })
        }

        if (eventEnd > currentTime) {
          currentTime = eventEnd
        }
      }

      const remainingMinutes = (dayEnd - currentTime) / 60000

      if (remainingMinutes >= durationMinutes) {
        availableTimes.push({
          start: new Date(currentTime),
          end: new Date(dayEnd)
        })
      }

      console.log("DAY EVENTS:", dayEvents)
      console.log("AVAILABLE TIMES:", availableTimes)
      return availableTimes
    }
    // Color Presets
    const presetColors = [
    {value: "#ff2e88" },
    {value: "#a020f0" },
    {value: "#0047ab" },
    {value: "#5f2fbd" },
    {value: "#170063" },
    {value: "#e930ff" },
    ]

    function previousWeek() {
      setSelectedDate(prev => {
        const newDate = new Date(prev)
        newDate.setDate(newDate.getDate() - 7)
        return newDate
      })
    }

    function nextWeek() {
      setSelectedDate(prev => {
        const newDate = new Date(prev)
        newDate.setDate(newDate.getDate() + 7)
        return newDate
      })
    }

    function previousMonth() {
      setSelectedMonth(prev => {
        const m = new Date(prev)
        m.setMonth(m.getMonth() - 1)
        return m
      })
    }

    function nextMonth() {
      setSelectedMonth(prev => {
        const m = new Date(prev)
        m.setMonth(m.getMonth() + 1)
        return m
      })
    }

    useEffect(() => {
      if (!user) {
        setEvents([])
        return
      }
      const eventsQuery = query(collection(db, "events"), where("userId", "==", user.uid))
      const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
        const loadedEvents = snapshot.docs.map(docSnap => {
          const data = docSnap.data()
          return { ...data, id: docSnap.id, startTime: data.startTime.toDate() }
        })
        setEvents(loadedEvents)
      })
      return () => unsubscribe()
    }, [user])

    useEffect(() => {
      document.documentElement.className = `${mode} palette-${palette}`
    }, [mode, palette])

  return(    
    <div className={"bg-bg text-text font-sans"}>
      <div className="relative pt-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
        <h1 className="text-2xl font-bold text-text text-center">planner.io</h1>
        <h1 className="text-lg font-medium text-text text-center">The planner for all your needs.</h1>

         <div className="absolute top-[calc(env(safe-area-inset-top)+1rem)] right-4">
          {user ? (
            <UserMenu user={user} onSignOut={handleSignOut} onOpenSettings={() => setIsSettingsOpen(true)} />
          ) : (
            <button onClick={() => setIsSignInModalOpen(true)} className="bg-accent-2 text-white px-3 py-1.5 rounded-lg text-sm transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1">
              Sign In
            </button>
          )}
        </div>
      </div>  
  <div className="flex flex-col flex-row gap-6 px-4">

      <div className="w-full md:w-64 shrink-0">
        <RemindersTab events={events} onEventClick={(event) => setSelectedEvent(event)} />
      </div>

      <div className="flex-1 min-w-0 flex justify-center">
        <div className="w-full max-w-[900px]">
          <div className="flex items-center justify-between mb-3">
            <button className="bg-accent-2 hover:bg-accent-2/80 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-black/15 transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1" onClick={() => setEventModal(true)}>Add Event</button>
            {viewMode == "week" ? (
              <button className="bg-accent-2 hover:bg-accent-2/80 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-black/15 hover:scale-110 transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:-rotate-2 active:scale-90 active:rotate-1" onClick={() => setViewMode("month")}>Monthly View</button>
            ) : (
              <button className="bg-accent-2 hover:bg-accent-2/80 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-black/15 hover:scale-110 transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:-rotate-2 active:scale-90 active:rotate-1" onClick={() => setViewMode("week")}>Weekly View</button>
            )}
          </div>

          <div className="flex items-center justify-between mb-4">
            <button onClick={viewMode === "week" ? previousWeek : previousMonth} className="bg-accent-1 hover:bg-accent-1/80 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-black/15 hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1">← Prev</button>
            <span className="text-sm font-medium">
              {viewMode === "week"
                ? `${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                : selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={viewMode === "week" ? nextWeek : nextMonth} className="bg-accent-1 hover:bg-accent-1/80 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-black/15 hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1">Next →</button>
          </div>

          {viewMode == "week" ? (
            <WeekGrid events={events} weekDays={weekDays} hours={hours} onEventClick={(event) => setSelectedEvent(event)} />
          ) : (
            <MonthGrid selectedMonth={selectedMonth} events={events} onDayClick={(day) => { setSelectedDate(day); setViewMode("week") }} />
          )}
        </div>
          <AiAssistant events={events} handleAIEvent={handleAIEvent} handleAIEdit={handleAIEdit} findAvailableTimes={findAvailableTimes} isOpen={aiOpen} setIsOpen={setAiOpen} pendingEvent={aiConflictEvent} aiConflictModal={aiConflictModal} setAiConflictModal={setAiConflictModal} clearPendingEvent={() => setAiConflictEvent(null)} />
    </div>

  </div>
      {isSettingsOpen && (
        <SettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
          theme={mode}
          onThemeChange={handleThemeChange}
          aesthetic={palette}
          onAestheticChange={handlePaletteChange}
        />
      )}

      {isSignInModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface border border-accent-2/40 rounded-xl p-8 w-96 text-center">
            <h2 className="text-2xl font-bold mb-2">Sign in to Save Your Schedule</h2>
            <p className="text-text/60 text-sm mb-6">When signed in, your events sync across devices and refreshes!</p>
            <button
              onClick={async () => {
                await handleSignIn()
                setIsSignInModalOpen(false)
              }}
              className="bg-white text-black px-6 py-3 rounded-lg font-medium flex items-center gap-2 mx-auto hover:bg-white/90 transition-colors"
            >
              Continue with Google
            </button>
            <button onClick={() => setIsSignInModalOpen(false)} className="text-text/40 text-sm mt-4 hover:text-text/60">
              Maybe later...
            </button>
          </div>
        </div>
      )}

      {selectedEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out,scaleIn_0.2s_ease-out]" onClick={() => setSelectedEvent(null)}>
          <div className="bg-surface border border-accent-2/40 rounded-xl p-6 w-96" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-2" style={{ color: selectedEvent.color }}>{selectedEvent.name}</h2>
            <p className="text-sm text-text/70 mb-1">{selectedEvent.startTime.toLocaleString()} · {selectedEvent.duration} min</p>
            <p className="text-sm text-text/70 mb-1">Location: {selectedEvent.location}</p>
            <p className="text-sm mb-1">Notes: {selectedEvent.notes}</p>
            <p className="text-sm mb-4">Importance: {selectedEvent.importance}</p>

            <div className="flex gap-2">
              <button onClick={() => startEdit(selectedEvent)} className="bg-accent-2 text-text px-3 py-1.5 rounded-lg text-sm transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1">Edit Event</button>
              <button onClick={() => deleteEvent(selectedEvent.id)} className="bg-accent-1 text-text px-3 py-1.5 rounded-lg text-sm transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1">Delete Event</button>
              <button onClick={() => setSelectedEvent(null)} className="bg-gray-300 px-3 py-1.5 rounded-lg text-sm transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1">Close</button>
            </div>
          </div>
        </div>
      )}

     
        <EventModal
        isOpen={eventModal}
        onClose={() => { setEventModal(false) ; setEditingEventID(null)}}
        formData={formData}
        updateField={updateField}
        onSubmit={handleSubmit}
        editingEventID={editingEventID}
        presetColors={presetColors}
        /> 

        <AiConflictModal
          isOpen={aiConflictModal}
          onYes={() => {
            setAiConflictModal(false)
            setEventModal(false)
            setAiInitialMessage(aiConflictEvent)
            setAiOpen(true)
          }}
          onNo={() => {
            setAiConflictModal(false)
            setAiConflictEvent(null)  
          }}
        />
    </div>
     
    )
}

export default App

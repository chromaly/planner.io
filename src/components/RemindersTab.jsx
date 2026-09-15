import { getTodaysEvents, getEventsByImportance } from "./EventHelpers"
import { useState} from 'react'

// 2 functions: 1. reminders just for the day
// 2. reminders set based on importance

export function RemindersTab({ events, onEventClick }){
    const [remindersOpen, setRemindersOpen] = useState(true);
    const [reminderView, setReminderView] = useState("today")
    const list = reminderView === "today" ? getTodaysEvents(events) : getEventsByImportance(events)
    return (
        <div className="flex items-stretch relative z-50">
            <div
                className={`transition-all duration-300 ease-in-out overflow-hidden rounded-xl shadow-lg shadow-black/15 pointer-events-auto ${
                remindersOpen ? 'w-full d:w-64 bg-surface' : 'w-6 bg-surface'
                }`}
            >
                <div className={`bg-surface border border-divider/10 rounded-lg p-4 shadow-lg shadow-black/15 transition-all duration-300 ease-in-out overflow-hidden ${remindersOpen ? 'opacity-100' : 'opacity-0'}`}>
                        <h2 className="text-lg font-bold text-text">Reminders</h2>
        
        
                <div className="flex gap-2 mb-3">
                    <button
                    onClick={() => setReminderView("today")}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1 ${reminderView === "today" ? "bg-accent-2 text-text" : "bg-bg text-text/60"}`}
                    >
                    Today
                    </button>
                    <button
                    onClick={() => setReminderView("importance")}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1 ${reminderView === "importance" ? "bg-accent-2 text-text" : "bg-bg text-text/60"}`}
                    >
                    By Importance
                    </button>
                </div>

                {reminderView === "importance" ? (
                    <>
                        {Object.entries(getEventsByImportance(events)).map(([tier, tierEvents]) => (
                        <div key={tier} className="mb-3">
                            <h3 className="text-xs uppercase text-text/40 mb-1">{tier}</h3>
                            {tierEvents.length === 0 && <p className="text-sm text-text/30 pl-2">None</p>}
                            {tierEvents.map(event => (
                            <div
                                key={event.id}
                                onClick={() => onEventClick(event)}
                                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer"
                            >
                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: event.color }} />
                                <span className="text-sm truncate">{event.name}</span>
                                <span className="text-xs text-text/40 ml-auto text-right">
                                {event.startTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                            ))}
                        </div>
                        ))}
                    </>
                    ) : (
                    <div className="flex flex-col gap-1">
                    {list.length === 0 && <p className="text-sm text-text/40">Nothing here! Go do something, you loser.</p>}
                    {list.map(event => (
                    <div
                        key={event.id}
                        onClick={() => onEventClick(event)}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer"
                    >
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: event.color }} />
                        <span className="text-sm truncate">{event.name}</span>
                        <span className="text-xs text-text/40 ml-auto">
                            {event.startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}  - {event.duration} minutes - {event.location}
                        </span>
                    </div>
                    ))}
                </div>
                )}
            </div>
        </div>
        <button onClick={() => setRemindersOpen(!remindersOpen)} className="self-center text-text pointer-events-auto">
            {remindersOpen ? '›' : '‹'}
        </button>
    </div>
)}

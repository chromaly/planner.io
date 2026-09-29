import { useState } from "react"

import {
  getTodaysEvents,
  getEventsByImportance,
} from "../utils/eventUtils"

import { useGroups } from "../hooks/useGroups"
import { getEventGroup } from "../services/groups"
import { EventColorIndicator } from "../components/EventColorIndicator"

import type { Event } from "../data_types/event"

import { EventDetailsModal } from "../components/EventDetailsModal"
import { EventModal } from "../components/EventModal"
import { useAuth } from "../components/AuthHandler"

import { useEventForm } from "../hooks/useEventForm"

import { presetColors } from "../data_types/presetColors"

type RemindersPageProps = {
  events: Event[]
  addEvent: (event: Omit<Event, "id">) => Promise<void>
  editEvent: (event: Event) => Promise<void>
  removeEvent: (eventId: string) => Promise<void>
  onConflict: (event: Event, isEditing: boolean) => void
}

export function RemindersPage({events, addEvent, editEvent, removeEvent, onConflict}: RemindersPageProps) {
    const { user } = useAuth()
    const { groups } = useGroups()

    const {
        formData,
        editingEventID,
        updateField,
        resetForm,
        startEditing,
        handleSubmit,
    } = useEventForm({
        user,
        events,
        addEvent,
        editEvent,   
        onConflict
        
    })

    const [reminderView, setReminderView] =
        useState<"today" | "importance" | "group">("today")

    const [isEventModalOpen, setIsEventModalOpen] =
        useState(false)
    const list = getTodaysEvents(events)

    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

  return (
    <div className="px-12 py-16">
      <div className="max-w-3xl mx-auto bg-surface rounded-xl p-10 shadow-lg shadow-text/15">
        <h2 className="text-3xl font-bold text-accent-2 mb-8">
          Reminders
        </h2>

        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setReminderView("today")}
            className={`px-3 py-1.5 rounded-lg text-sm transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1 ${
              reminderView === "today"
                ? "bg-accent-2 text-text"
                : "bg-bg text-text/60"
            }`}
          >
            Today
          </button>

          <button
            onClick={() =>
              setReminderView("importance")
            }
            className={`px-3 py-1.5 rounded-lg text-sm transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1 ${
              reminderView === "importance"
                ? "bg-accent-2 text-text"
                : "bg-bg text-text/60"
            }`}
          >
            By Importance
          </button>

          <button
            onClick={() => setReminderView("group")}
            className={`px-3 py-1.5 rounded-lg text-sm transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1 ${
              reminderView === "group"
                ? "bg-accent-2 text-text"
                : "bg-bg text-text/60"
            }`}
          >
            By Group
          </button>
        </div>

        {reminderView === "importance" ? (
          <>
            {Object.entries(
              getEventsByImportance(events)
            ).map(([tier, tierEvents]) => (
              <div key={tier} className="mb-3">
                <h3 className="text-xs uppercase text-text/40 mb-1">
                  {tier}
                </h3>

                {tierEvents.length === 0 && (
                  <p className="text-sm text-text/30 pl-2">
                    None
                  </p>
                )}

                {tierEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer"
                  >
                    <EventColorIndicator
                      eventColor={event.color}
                      groupColor={getEventGroup(event, groups)?.color ?? null}
                      variant="reminder"
                    />

                    <span className="text-sm truncate">
                      {event.name}
                    </span>

                    <span className="text-xs text-text/40 ml-auto text-right">
                      {event.startTime.toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </>
        ) : reminderView === "today" ? (
          <div className="flex flex-col gap-1">
            {list.length === 0 && (
              <p className="text-sm text-text/40">
                Nothing here! Go do something, you loser.
              </p>
            )}

            {list.map((event) => (
              <div
                key={event.event.id}
                onClick={() => setSelectedEvent(event.event)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer"
              >
               <EventColorIndicator
                  eventColor={event.event.color}
                  groupColor={getEventGroup(event.event, groups)?.color ?? null}
                  variant="reminder"
                />

                <span className="text-sm truncate">
                  {event.event.name}
                </span>

                <span className="text-xs text-text/40 ml-auto">
                  {event.startTime.toLocaleTimeString(
                    "en-US",
                    {
                      hour: "numeric",
                      minute: "2-digit",
                    }
                  )}{" "}
                  - {event.event.duration} minutes -{" "}
                  {event.event.location}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <>
  {groups.map((group) => {
    const groupEvents = events.filter(
      (event) => event.groupId === group.id
    )

    return (
      <div key={group.id} className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: group.color }}
          />

          <h3 className="text-xs uppercase text-text/40">
            {group.name}
          </h3>
        </div>

        {groupEvents.length === 0 ? (
          <p className="text-sm text-text/30 pl-4">
            None
          </p>
        ) : (
          groupEvents.map((event) => (
            <div
              key={event.id}
              onClick={() => setSelectedEvent(event)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer"
            >
              <EventColorIndicator
                eventColor={event.color}
                groupColor={group.color}
                variant="reminder"
              />

              <span className="text-sm truncate">
                {event.name}
              </span>

              <span className="text-xs text-text/40 ml-auto text-right">
                {event.startTime.toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                  }
                )}
              </span>
            </div>
          ))
        )}
      </div>
    )
  })}

            {events.some((event) => !event.groupId) && (
              <div className="mb-3">
                <h3 className="text-xs uppercase text-text/40 mb-1">
                  Ungrouped
                </h3>

                {events
                  .filter((event) => !event.groupId)
                  .map((event) => (
                    <div
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer"
                    >
                      <EventColorIndicator
                        eventColor={event.color}
                        groupColor={null}
                        variant="reminder"
                      />

                      <span className="text-sm truncate">
                        {event.name}
                      </span>

                      <span className="text-xs text-text/40 ml-auto text-right">
                        {event.startTime.toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </>
        )}

        <EventModal
            isOpen={isEventModalOpen}
            onClose={() => {
                setIsEventModalOpen(false)
                resetForm()
            }}
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
  )
}
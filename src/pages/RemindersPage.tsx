import { useState } from "react"

import {
  getTodaysEvents,
  getEventsByImportance,
} from "../utils/eventUtils"

import { useGroups } from "../hooks/useGroups"
import { getGroup } from "../services/groups"

import { EventColorIndicator } from "../components/EventColorIndicator"
import { EventDetailsModal } from "../components/EventDetailsModal"
import { EventModal } from "../components/EventModal"
import { DeadlineDetailsModal } from "../components/DeadlinesDetailsModal"
import { DeadlineModal } from "../components/DeadlineModal"
import { useAuth } from "../components/AuthHandler"

import { useEventForm } from "../hooks/useEventForm"
import { useDeadlines } from "../hooks/useDeadlines"
import { useDeadlineForm } from "../hooks/useDeadlineForm"

import { presetColors } from "../data_types/presetColors"

import type { Event, Importance } from "../data_types/event"
import type { Deadline } from "../data_types/deadline"

type RemindersPageProps = {
  events: Event[]
  addEvent: (event: Omit<Event, "id">) => Promise<void>
  editEvent: (event: Event) => Promise<void>
  removeEvent: (eventId: string) => Promise<void>
  onConflict: (
    event: Event,
    isEditing: boolean,
    allowOverlap: () => Promise<boolean>
  ) => void
}

type ReminderItem =
  | {
      type: "event"
      event: Event
      time: Date
    }
  | {
      type: "deadline"
      deadline: Deadline
      time: Date
    }

function ReminderItem({
  item,
  groups,
  onEventClick,
  onDeadlineClick,
}: {
  item: ReminderItem
  groups: ReturnType<typeof useGroups>["groups"]
  onEventClick: (event: Event) => void
  onDeadlineClick: (deadline: Deadline) => void
}) {
  if (item.type === "event") {
    const event = item.event
    const group = getGroup(event, groups)

    return (
      <div
        onClick={() => onEventClick(event)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer"
      >
        <EventColorIndicator
          eventColor={event.color}
          groupColor={group?.color ?? null}
          variant="reminder"
        />

        <span className="text-sm truncate">
          {event.name}
        </span>

        <span className="text-xs text-text/40 ml-auto text-right">
          {item.time.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
    )
  }

  const deadline = item.deadline
  const group = getGroup(deadline, groups)

  return (
    <div
      onClick={() => onDeadlineClick(deadline)}
      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer"
    >
      <span
        className="w-3 h-3 rotate-45 rounded-[2px] flex-shrink-0"
        style={{
          background: group
            ? `linear-gradient(
                to right,
                ${deadline.color} 50%,
                ${group.color} 50%
              )`
            : deadline.color,
        }}
      />

      <span
        className={`text-sm truncate ${
          deadline.completed
            ? "line-through opacity-40"
            : ""
        }`}
      >
        {deadline.name}
      </span>

      <span className="text-xs text-text/40 ml-auto text-right">
        {item.time.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}
      </span>
    </div>
  )
}

export function RemindersPage({
  events,
  addEvent,
  editEvent,
  removeEvent,
  onConflict,
}: RemindersPageProps) {
  const { user } = useAuth()
  const { groups } = useGroups()

  const {
    deadlines,
    addDeadline,
    editDeadline,
    removeDeadline,
  } = useDeadlines(user?.uid ?? null)

  const [reminderView, setReminderView] =
    useState<"today" | "importance" | "group">("today")

  const [showEvents, setShowEvents] = useState(true)
  const [showDeadlines, setShowDeadlines] = useState(true)
  const [hideCompletedDeadlines, setHideCompletedDeadlines] =
    useState(false)

  const [isEventModalOpen, setIsEventModalOpen] =
    useState(false)

  const [isDeadlineModalOpen, setIsDeadlineModalOpen] =
    useState(false)

  const [selectedEvent, setSelectedEvent] =
    useState<Event | null>(null)

  const [selectedDeadline, setSelectedDeadline] =
    useState<Deadline | null>(null)

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
    onConflict: (event, isEditing) => {
      setIsEventModalOpen(false)

      onConflict(
        event,
        isEditing,
        () => handleSubmit(true)
      )
    },
  })

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

  const visibleDeadlines = showDeadlines
    ? hideCompletedDeadlines
      ? deadlines.filter((deadline) => !deadline.completed)
      : deadlines
    : []

  function getReminderItems(
    reminderEvents: Event[],
    reminderDeadlines: Deadline[]
  ): ReminderItem[] {
    return [
      ...(showEvents
        ? reminderEvents.map((event) => ({
            type: "event" as const,
            event,
            time: event.startTime,
          }))
        : []),

      ...reminderDeadlines.map((deadline) => ({
        type: "deadline" as const,
        deadline,
        time: deadline.dueTime,
      })),
    ].sort(
      (a, b) =>
        a.time.getTime() - b.time.getTime()
    )
  }

  function openDeadline(deadline: Deadline) {
    setSelectedDeadline(deadline)
  }

  function editSelectedDeadline() {
    if (!selectedDeadline) return

    startEditingDeadline(selectedDeadline)
    setSelectedDeadline(null)
    setIsDeadlineModalOpen(true)
  }

  const todayOccurrences = showEvents
    ? getTodaysEvents(events)
    : []

  const todayEvents = todayOccurrences.map(
    (occurrence) => occurrence.event
  )

  const todayDeadlines = visibleDeadlines.filter(
    (deadline) => {
      const today = new Date()

      return (
        deadline.dueTime.getFullYear() ===
          today.getFullYear() &&
        deadline.dueTime.getMonth() ===
          today.getMonth() &&
        deadline.dueTime.getDate() ===
          today.getDate()
      )
    }
  )

  const todayItems = getReminderItems(
    todayEvents,
    todayDeadlines
  )

  const eventsByImportance = showEvents
  ? getEventsByImportance(events)
  : {
      very: [],
      somewhat: [],
      "not too": [],
    }

  const importanceTiers: Importance[] = [
    "very",
    "somewhat",
    "not too",
  ]

  return (
    <div className="px-12 py-16">
      <div className="max-w-3xl mx-auto bg-surface rounded-xl p-10 shadow-lg shadow-text/15">
        <h2 className="text-3xl font-bold text-accent-2 mb-8">
          Reminders
        </h2>

        {/* Filters */}
        <div className="flex items-center gap-5 mb-4">
          <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
            <input
              type="checkbox"
              checked={showEvents}
              onChange={(e) =>
                setShowEvents(e.target.checked)
              }
              className="accent-accent-2"
            />
            Events
          </label>

          <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
            <input
              type="checkbox"
              checked={showDeadlines}
              onChange={(e) =>
                setShowDeadlines(e.target.checked)
              }
              className="accent-accent-2"
            />
            Deadlines
          </label>

          <label
            className={`flex items-center gap-2 text-sm cursor-pointer ${
              showDeadlines
                ? "text-text/70"
                : "text-text/30"
            }`}
          >
            <input
              type="checkbox"
              checked={hideCompletedDeadlines}
              disabled={!showDeadlines}
              onChange={(e) =>
                setHideCompletedDeadlines(
                  e.target.checked
                )
              }
              className="accent-accent-2 disabled:opacity-40"
            />
            Hide completed deadlines
          </label>
        </div>

        {/* View buttons */}
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

        {/* Today */}
        {reminderView === "today" && (
          <div className="flex flex-col gap-1">
            {todayItems.length === 0 && (
              <p className="text-sm text-text/40">
                Nothing here! Go do something, you loser.
              </p>
            )}

            {todayItems.map((item) => (
              <ReminderItem
                key={
                  item.type === "event"
                    ? `event-${item.event.id}`
                    : `deadline-${item.deadline.id}`
                }
                item={item}
                groups={groups}
                onEventClick={setSelectedEvent}
                onDeadlineClick={openDeadline}
              />
            ))}
          </div>
        )}

        {/* By Importance */}
        {reminderView === "importance" && (
          <div>
            {importanceTiers.map((tier) => {
              const tierEvents =
                eventsByImportance[tier] ?? []

              const tierDeadlines =
                visibleDeadlines.filter(
                  (deadline) =>
                    deadline.importance === tier
                )

              const items = getReminderItems(
                tierEvents,
                tierDeadlines
              )

              return (
                <div key={tier} className="mb-3">
                  <h3 className="text-xs uppercase text-text/40 mb-1">
                    {tier}
                  </h3>

                  {items.length === 0 ? (
                    <p className="text-sm text-text/30 pl-2">
                      None
                    </p>
                  ) : (
                    items.map((item) => (
                      <ReminderItem
                        key={
                          item.type === "event"
                            ? `event-${item.event.id}`
                            : `deadline-${item.deadline.id}`
                        }
                        item={item}
                        groups={groups}
                        onEventClick={setSelectedEvent}
                        onDeadlineClick={openDeadline}
                      />
                    ))
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* By Group */}
        {reminderView === "group" && (
          <div>
            {groups.map((group) => {
              const groupEvents = showEvents
                ? events.filter(
                    (event) =>
                      event.groupId === group.id
                  )
                : []

              const groupDeadlines = visibleDeadlines.filter(
                (deadline) =>
                  deadline.groupId === group.id
              )

              const items = getReminderItems(
                groupEvents,
                groupDeadlines
              )

              return (
                <div key={group.id} className="mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: group.color,
                      }}
                    />

                    <h3 className="text-xs uppercase text-text/40">
                      {group.name}
                    </h3>
                  </div>

                  {items.length === 0 ? (
                    <p className="text-sm text-text/30 pl-4">
                      None
                    </p>
                  ) : (
                    items.map((item) => (
                      <ReminderItem
                        key={
                          item.type === "event"
                            ? `event-${item.event.id}`
                            : `deadline-${item.deadline.id}`
                        }
                        item={item}
                        groups={groups}
                        onEventClick={setSelectedEvent}
                        onDeadlineClick={openDeadline}
                      />
                    ))
                  )}
                </div>
              )
            })}

            {/* Ungrouped */}
            {(() => {
              const ungroupedEvents = showEvents
                ? events.filter(
                    (event) => !event.groupId
                  )
                : []

              const ungroupedDeadlines =
                visibleDeadlines.filter(
                  (deadline) => !deadline.groupId
                )

              const items = getReminderItems(
                ungroupedEvents,
                ungroupedDeadlines
              )

              if (items.length === 0) return null

              return (
                <div className="mb-3">
                  <h3 className="text-xs uppercase text-text/40 mb-1">
                    Ungrouped
                  </h3>

                  {items.map((item) => (
                    <ReminderItem
                      key={
                        item.type === "event"
                          ? `event-${item.event.id}`
                          : `deadline-${item.deadline.id}`
                      }
                      item={item}
                      groups={groups}
                      onEventClick={setSelectedEvent}
                      onDeadlineClick={openDeadline}
                    />
                  ))}
                </div>
              )
            })()}
          </div>
        )}

        {/* Event modal */}
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

        {/* Deadline modal */}
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

        {/* Event details */}
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

        {/* Deadline details */}
        {selectedDeadline && (
          <DeadlineDetailsModal
            deadline={selectedDeadline}
            onClose={() => setSelectedDeadline(null)}
            onEdit={editSelectedDeadline}
            onDelete={async () => {
              await removeDeadline(selectedDeadline.id)
              setSelectedDeadline(null)
            }}
          />
        )}
      </div>
    </div>
  )
}
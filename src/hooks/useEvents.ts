import { useEffect, useState } from "react"

import type { Event } from "../data_types/event"

import { createEvent, deleteEvent, subscribeToEvents, updateEvent} from "../services/events"

type UseEventsResult = {
  events: Event[]
  addEvent: (event: Omit<Event, "id">) => Promise<void>
  editEvent: (event: Event) => Promise<void>
  removeEvent: (eventId: string) => Promise<void>
}

export function useEvents(userId: string | null): UseEventsResult {
  const [events, setEvents] = useState<Event[]>([])

  useEffect(() => {
    if (!userId) {
      setEvents([])
      return
    }

    return subscribeToEvents(userId, setEvents)
  }, [userId])

  async function addEvent(event: Omit<Event, "id">) {
    if (!userId) return

    await createEvent(userId, event)
  }

  async function editEvent(event: Event) {
    if (!userId) return

    await updateEvent(userId, event)
  }

  async function removeEvent(eventId: string) {
    if (!userId) return

    await deleteEvent(userId, eventId)
  }

  return {
    events,
    addEvent,
    editEvent,
    removeEvent,
  }
}
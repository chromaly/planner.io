import { useState } from "react"
import type { Event, Recurrence, EventFormData } from "../data_types/event"
import type { User } from "firebase/auth"
import { eventsOverlap } from "../utils/eventUtils"

const initialFormData: EventFormData = {
  name: "",
  date: "",
  time: "",
  duration: 30,
  recurrence: { type: "never"},
  importance: "somewhat",
  location: "",
  notes: "",
  color: "",
  groupId: null
}

type useEventFormProps = {
    user: User | null
    events: Event[]
    addEvent: (event: Omit<Event, "id">) => Promise<void>
    editEvent: (event: Event) => Promise<void>
    onConflict: (event: Event, isEditing: boolean) => void
}

export function useEventForm({user, events, addEvent, editEvent, onConflict}: useEventFormProps ) {

    const [formData, setFormData] =
        useState<EventFormData>(initialFormData)

    const [editingEventID, setEditingEventID] =
        useState<string | null>(null)

    function updateField(
        field: keyof EventFormData,
        value: EventFormData[keyof EventFormData]
    ) {
    setFormData((current) => ({
            ...current,
            [field]: value,
        }))
    }

    function resetForm() {
        setFormData(initialFormData)
        setEditingEventID(null)
    }

    function buildEventData(): Omit<Event, "id"> {
        return {
            name: formData.name,
            startTime: new Date(`${formData.date}T${formData.time}`),
            duration: formData.duration,
            recurrence: formData.recurrence,
            importance: formData.importance,
            location: formData.location,
            notes: formData.notes,
            color: formData.color,
            groupId: formData.groupId
        }
    }
    
    async function handleSubmit(): Promise<boolean> {
        if (!user) return false

        const eventData = buildEventData()

        const event: Event = {
            id: editingEventID ?? "",
            ...eventData,
        }

        const conflictingTime = events.some(
            (checkEvent) =>
            checkEvent.id !== editingEventID &&
            eventsOverlap(event, checkEvent)
        )

        if (conflictingTime) {
            onConflict(event, editingEventID !== null)
            return false
        }

        if (editingEventID) {
            await editEvent(event)
        } else {
            await addEvent(eventData)
        }

        resetForm()
        return true
    }
    function startEditing(event: Event) {
    setEditingEventID(event.id)

    const year = event.startTime.getFullYear()
    const month = String(event.startTime.getMonth() + 1).padStart(2, "0")
    const day = String(event.startTime.getDate()).padStart(2, "0")

    const hours = String(event.startTime.getHours()).padStart(2, "0")
    const minutes = String(event.startTime.getMinutes()).padStart(2, "0")

    setFormData({
        name: event.name,
        date: `${year}-${month}-${day}`,
        time: `${hours}:${minutes}`,
        duration: event.duration,
        recurrence: event.recurrence,
        importance: event.importance,
        location: event.location,
        notes: event.notes,
        color: event.color,
        groupId: event.groupId
    })
    }
    return {
        formData,
        editingEventID,
        updateField,
        resetForm,
        startEditing,
        handleSubmit
    }
}
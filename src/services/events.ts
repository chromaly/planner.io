import { collection, addDoc, updateDoc, deleteDoc, doc, Timestamp, onSnapshot } from "firebase/firestore"

import { db } from "../firebase"

import type { Event, CreateEventData } from "../data_types/event"

export async function createEvent(userId: string, event: CreateEventData
): Promise<string> {
  const eventsRef = collection(db, "users", userId, "events")

  const docRef = await addDoc(eventsRef, {
    ...event,
    startTime: Timestamp.fromDate(event.startTime)
  })

  return docRef.id
}
    
export async function deleteEvent(userId: string, eventId: string): Promise<void>{

  const eventRef = doc(db, "users", userId, "events", eventId)

  await deleteDoc(eventRef)
}

export async function updateEvent(userId: string, event: Event): Promise<void> { 
    const eventRef = doc(db, "users", userId, "events", event.id)

    const { id, ...eventData } = event

    await updateDoc(eventRef, {
      ...eventData,
      startTime: Timestamp.fromDate(event.startTime),
    })
}

export function subscribeToEvents(userId: string, onEventsChanged: (events: Event[]) => void): () => void {
  const eventsRef = collection(db, "users", userId, "events")

  return onSnapshot(eventsRef, (snapshot) => {
    const events = snapshot.docs.map((docSnap) => {
      const data = docSnap.data()

      return {
        ...data,
        id: docSnap.id,
        startTime: data.startTime.toDate()
      } as Event
    })
    onEventsChanged(events)
  })
}
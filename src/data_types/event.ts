export type Importance = 
    | "very"
    | "somewhat"
    | "not too"

export type Weekday = 
    | "sunday"
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"

export type Recurrence = 
    | { type: "never" }
    | { type: "daily" }
    | { type: "weekly", days: Weekday[] }
    | { type: "monthly", dayOfMonth: number }

export type Group = {
  id: string
  name: string
  color: string
}

export type Event = {
  id: string
  name: string
  startTime: Date
  duration: number
  recurrence: Recurrence
  importance: Importance
  location: string
  notes: string
  color: string
  groupId: string | null
}

export type CreateEventData = Omit<Event, "id">

export type EventFormData = {
  name: string
  date: string
  time: string
  duration: number
  recurrence: Recurrence
  importance: Importance
  location: string
  notes: string
  color: string
  groupId: string | null
}
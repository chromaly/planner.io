import type { Importance } from "./event"

export type Deadline = {
  id: string
  name: string
  dueTime: Date
  importance: Importance
  notes: string
  color: string
  groupId: string | null
  completed: boolean
}

export type CreateDeadlineData = Omit<Deadline, "id">

export type DeadlineFormData = {
  name: string
  date: string
  time: string
  importance: Importance
  notes: string
  color: string
  groupId: string | null
  completed: boolean
}
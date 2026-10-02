import { useEffect, useState } from "react"

import type { Deadline } from "../data_types/deadline"

import {
  createDeadline,
  deleteDeadline,
  subscribeToDeadlines,
  updateDeadline,
} from "../services/deadlines"

type UseDeadlinesResult = {
  deadlines: Deadline[]
  addDeadline: (
    deadline: Omit<Deadline, "id">
  ) => Promise<void>
  editDeadline: (deadline: Deadline) => Promise<void>
  removeDeadline: (deadlineId: string) => Promise<void>
}

export function useDeadlines(
  userId: string | null
): UseDeadlinesResult {
  const [deadlines, setDeadlines] = useState<Deadline[]>([])

  useEffect(() => {
    if (!userId) {
      setDeadlines([])
      return
    }

    return subscribeToDeadlines(userId, setDeadlines)
  }, [userId])

  async function addDeadline(
    deadline: Omit<Deadline, "id">
  ) {
    if (!userId) return

    await createDeadline(userId, deadline)
  }

  async function editDeadline(deadline: Deadline) {
    if (!userId) return

    await updateDeadline(userId, deadline)
  }

  async function removeDeadline(deadlineId: string) {
    if (!userId) return

    await deleteDeadline(userId, deadlineId)
  }

  return {
    deadlines,
    addDeadline,
    editDeadline,
    removeDeadline,
  }
}
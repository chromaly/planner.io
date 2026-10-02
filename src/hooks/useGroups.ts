import { useEffect, useState } from "react"

import { useAuth } from "../components/AuthHandler"

import { subscribeToGroups, createGroup, updateGroup, deleteGroup } from "../services/groups"

import type { Group } from "../data_types/event"

export function useGroups() {
  const { user } = useAuth()
  const userId = user?.uid ?? null
  const [groups, setGroups] = useState<Group[]>([])

  useEffect(() => {
    if (!userId) {
      setGroups([])
      return
    }

    const unsubscribe = subscribeToGroups(userId, setGroups)

    return unsubscribe
  }, [userId])

  async function addGroup(name: string, color: string): Promise<string> {
    if (!userId) {
      throw new Error("User must be signed in to create a group")
    }

    return createGroup(userId, {
      name,
      color,
    })
  }
  async function editGroup(group: Group): Promise<void> {
    if (!userId) {
        throw new Error("User must be signed in to update a group")
    }

    return updateGroup(userId, group)
    }
  
    async function handleDeleteGroup(group: Group): Promise<void> {
      if (!userId) {
        throw new Error("User must be signed in to delete a group")
      }

      return deleteGroup(userId, group.id)
    }
  return {
    groups,
    addGroup,
    editGroup,
    handleDeleteGroup
  }
}


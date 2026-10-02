import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore"

import { db } from "../firebase"

import type { Group, Event } from "../data_types/event"


export async function createGroup(
  userId: string,
  group: Omit<Group, "id">
): Promise<string> {
  const groupsRef = collection(db, "users", userId, "groups")

  const docRef = await addDoc(groupsRef, group)

  return docRef.id
}

export async function deleteGroup(
  userId: string,
  groupId: string
): Promise<void> {
  const groupRef = doc(db, "users", userId, "groups", groupId)

  await deleteDoc(groupRef)
}

export async function updateGroup(
  userId: string,
  group: Group
): Promise<void> {
  const groupRef = doc(db, "users", userId, "groups", group.id)

  const { id, ...groupData } = group

  await updateDoc(groupRef, groupData)
}

export function subscribeToGroups(
  userId: string,
  onGroupsChanged: (groups: Group[]) => void
): () => void {
  const groupsRef = collection(db, "users", userId, "groups")

  return onSnapshot(groupsRef, (snapshot) => {
    const groups = snapshot.docs.map((docSnap) => {
      const data = docSnap.data()

      return {
        ...data,
        id: docSnap.id,
      } as Group
    })

    onGroupsChanged(groups)
  })
}

export function getGroup(
  item: { groupId: string | null },
  groups: Group[]
): Group | undefined {
  if (!item.groupId) return undefined

  return groups.find((group) => group.id === item.groupId)
}

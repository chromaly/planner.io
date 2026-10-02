import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  onSnapshot,
} from "firebase/firestore"

import { db } from "../firebase"

import type {
  Deadline,
  CreateDeadlineData,
} from "../data_types/deadline"

export async function createDeadline(
  userId: string,
  deadline: CreateDeadlineData
): Promise<string> {
  const deadlinesRef = collection(
    db,
    "users",
    userId,
    "deadlines"
  )

  const docRef = await addDoc(deadlinesRef, {
    ...deadline,
    dueTime: Timestamp.fromDate(deadline.dueTime),
  })

  return docRef.id
}

export async function deleteDeadline(
  userId: string,
  deadlineId: string
): Promise<void> {
  const deadlineRef = doc(
    db,
    "users",
    userId,
    "deadlines",
    deadlineId
  )

  await deleteDoc(deadlineRef)
}

export async function updateDeadline(
  userId: string,
  deadline: Deadline
): Promise<void> {
  const deadlineRef = doc(
    db,
    "users",
    userId,
    "deadlines",
    deadline.id
  )

  const { id, ...deadlineData } = deadline

  await updateDoc(deadlineRef, {
    ...deadlineData,
    dueTime: Timestamp.fromDate(deadline.dueTime),
  })
}

export function subscribeToDeadlines(
  userId: string,
  onDeadlinesChanged: (deadlines: Deadline[]) => void
): () => void {
  const deadlinesRef = collection(
    db,
    "users",
    userId,
    "deadlines"
  )

  return onSnapshot(deadlinesRef, (snapshot) => {
    const deadlines = snapshot.docs.map((docSnap) => {
      const data = docSnap.data()

      return {
        ...data,
        id: docSnap.id,
        dueTime: data.dueTime.toDate(),
      } as Deadline
    })

    onDeadlinesChanged(deadlines)
  })
}
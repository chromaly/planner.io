import { useState } from "react"
import type { Deadline, DeadlineFormData } from "../data_types/deadline"
import type { User } from "firebase/auth"

const initialFormData: DeadlineFormData = {
  name: "",
  date: "",
  time: "",
  importance: "somewhat",
  notes: "",
  color: "",
  groupId: null,
  completed: false,
}

type UseDeadlineFormProps = {
  user: User | null
  addDeadline: (
    deadline: Omit<Deadline, "id">
  ) => Promise<void>
  editDeadline: (
    deadline: Deadline
  ) => Promise<void>
}

export function useDeadlineForm({
  user,
  addDeadline,
  editDeadline,
}: UseDeadlineFormProps) {
  const [formData, setFormData] =
    useState<DeadlineFormData>(initialFormData)

  const [editingDeadlineID, setEditingDeadlineID] =
    useState<string | null>(null)

  function updateField(
    field: keyof DeadlineFormData,
    value: DeadlineFormData[keyof DeadlineFormData]
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function resetForm() {
    setFormData(initialFormData)
    setEditingDeadlineID(null)
  }

  function buildDeadlineData(): Omit<Deadline, "id"> {
    return {
      name: formData.name,
      dueTime: new Date(`${formData.date}T${formData.time}`),
      importance: formData.importance,
      notes: formData.notes,
      color: formData.color,
      groupId: formData.groupId,
      completed: formData.completed,
    }
  }

  async function handleSubmit(): Promise<boolean> {
    if (!user) return false

    const deadlineData = buildDeadlineData()

    if (editingDeadlineID) {
      const deadline: Deadline = {
        id: editingDeadlineID,
        ...deadlineData,
      }

      await editDeadline(deadline)
    } else {
      await addDeadline(deadlineData)
    }

    resetForm()
    return true
  }

  function startEditing(deadline: Deadline) {
    setEditingDeadlineID(deadline.id)

    const year = deadline.dueTime.getFullYear()
    const month = String(
      deadline.dueTime.getMonth() + 1
    ).padStart(2, "0")
    const day = String(
      deadline.dueTime.getDate()
    ).padStart(2, "0")

    const hours = String(
      deadline.dueTime.getHours()
    ).padStart(2, "0")
    const minutes = String(
      deadline.dueTime.getMinutes()
    ).padStart(2, "0")

    setFormData({
      name: deadline.name,
      date: `${year}-${month}-${day}`,
      time: `${hours}:${minutes}`,
      importance: deadline.importance,
      notes: deadline.notes,
      color: deadline.color,
      groupId: deadline.groupId,
      completed: deadline.completed,
    })
  }

  return {
    formData,
    editingDeadlineID,
    updateField,
    resetForm,
    startEditing,
    handleSubmit,
  }
}
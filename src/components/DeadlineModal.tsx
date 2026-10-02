import { CustomDropDown } from "./CustomDropDown"
import type { Importance } from "../data_types/event"

import { useState } from "react"
import { useGroups } from "../hooks/useGroups"

type PresetColor = {
  value: string
}

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

type DeadlineModalProps = {
  isOpen: boolean
  onClose: () => void
  formData: DeadlineFormData
  updateField: (
    field: keyof DeadlineFormData,
    value: DeadlineFormData[keyof DeadlineFormData]
  ) => void
  onSubmit: () => void
  editingDeadlineID: string | null
  presetColors: PresetColor[]
}

export function DeadlineModal({
  isOpen,
  onClose,
  formData,
  updateField,
  onSubmit,
  editingDeadlineID,
  presetColors,
}: DeadlineModalProps) {
  const {
    groups,
    addGroup,
    editGroup,
    handleDeleteGroup,
  } = useGroups()

  const [isCreatingGroup, setIsCreatingGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const [newGroupColor, setNewGroupColor] = useState("")

  const selectedGroup = groups.find(
    (group) => group.id === formData.groupId
  )

  async function handleCreateGroup() {
    if (!newGroupName.trim() || !newGroupColor) {
      return
    }

    const groupId = await addGroup(
      newGroupName.trim(),
      newGroupColor
    )

    updateField("groupId", groupId)

    setNewGroupName("")
    setNewGroupColor("")
    setIsCreatingGroup(false)
  }

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 bg-bg/60 backdrop-blur-sm flex items-center justify-center z-[99999] animate-[fadeIn_0.2s_ease-out,scaleIn_0.2s_ease-out]"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-accent-2/40 rounded-xl p-4 w-[calc(100%-2rem)] max-w-96 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4 text-accent-2">
          {editingDeadlineID ? "Edit Deadline" : "New Deadline"}
        </h2>

        <div className="mb-2">
          <label className="block text-sm font-medium mb-1">
            Deadline Name
          </label>

          <input
            className="bg-bg/30 border border-divider/10 rounded-lg px-3 py-2 w-full text-text placeholder-white/40 focus:outline-none focus:ring-0 focus:border-accent-2"
            placeholder="Deadline name"
            value={formData.name}
            onChange={(e) =>
              updateField("name", e.target.value)
            }
          />
        </div>

        <div className="flex gap-2 mb-2">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">
              Due Date
            </label>

            <input
              type="date"
              className="bg-bg/30 border border-divider/10 rounded-lg px-3 py-2 w-full text-text focus:outline-none focus:ring-0 focus:border-accent-2"
              value={formData.date}
              onChange={(e) =>
                updateField("date", e.target.value)
              }
            />
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">
              Due Time
            </label>

            <input
              type="time"
              className="bg-bg/30 border border-divider/10 rounded-lg px-3 py-2 w-full text-text focus:outline-none focus:ring-0 focus:border-accent-2"
              value={formData.time}
              onChange={(e) =>
                updateField("time", e.target.value)
              }
            />
          </div>
        </div>

        <div className="mb-2">
          <CustomDropDown
            label="Importance"
            value={formData.importance}
            onChange={(val: Importance) =>
              updateField("importance", val)
            }
            options={[
              { value: "very", label: "VERY." },
              {
                value: "somewhat",
                label: "I shouldn't miss this!",
              },
              {
                value: "not too",
                label: "um... there's this other thing...",
              },
            ]}
          />
        </div>

        <div className="mb-2">
          <CustomDropDown
            label="Group"
            value={formData.groupId ?? ""}
            onChange={(val: string) =>
              updateField("groupId", val || null)
            }
            options={[
              { value: "", label: "None" },
              ...groups.map((group) => ({
                value: group.id,
                label: group.name,
              })),
            ]}
          />

          {selectedGroup && (
            <div className="mt-2">
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="color"
                  value={selectedGroup.color}
                  onChange={(e) =>
                    editGroup({
                      ...selectedGroup,
                      color: e.target.value,
                    })
                  }
                  className="w-8 h-8 rounded-full border border-divider/20 cursor-pointer bg-transparent p-0 focus:outline-none focus:ring-0"
                />

                {presetColors.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() =>
                      editGroup({
                        ...selectedGroup,
                        color: preset.value,
                      })
                    }
                    className={`w-8 h-8 rounded-full border-3 transition-transform hover:scale-110 ${
                      selectedGroup.color === preset.value
                        ? "border-divider"
                        : "border-transparent"
                    }`}
                    style={{
                      backgroundColor: preset.value,
                    }}
                  />
                ))}

                <button
                  type="button"
                  className="bg-red-500 hover:bg-red-500/80 text-text px-2 py-1 rounded-lg mr-2 text-sm transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1"
                  onClick={() =>
                    handleDeleteGroup(selectedGroup)
                  }
                >
                  Delete Group
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() =>
              setIsCreatingGroup((current) => !current)
            }
            className="bg-accent-2 hover:bg-accent-2/80 text-text px-2 py-1 rounded-lg mr-2 mt-4 text-sm transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1"
          >
            {isCreatingGroup ? "Cancel" : "Create Group"}
          </button>
        </div>

        {isCreatingGroup && (
          <div className="mb-3 p-3 bg-bg/30 border border-accent-2/20 rounded-lg">
            <label className="block text-sm font-medium mb-1">
              Group Name
            </label>

            <input
              className="bg-bg/30 border border-divider/10 rounded-lg px-3 py-2 w-full text-text placeholder-white/40 focus:outline-none focus:ring-0 focus:border-accent-2"
              placeholder="Group name"
              value={newGroupName}
              onChange={(e) =>
                setNewGroupName(e.target.value)
              }
            />

            <label className="block text-sm font-medium mb-1 mt-2">
              Group Color
            </label>

            <div className="flex items-center gap-2 flex-wrap">
              {presetColors.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() =>
                    setNewGroupColor(preset.value)
                  }
                  className={`w-8 h-8 rounded-full border-3 transition-transform hover:scale-110 ${
                    newGroupColor === preset.value
                      ? "border-divider"
                      : "border-transparent"
                  }`}
                  style={{
                    backgroundColor: preset.value,
                  }}
                />
              ))}

              <input
                type="color"
                value={newGroupColor || "#a020f0"}
                onChange={(e) =>
                  setNewGroupColor(e.target.value)
                }
                className="w-8 h-8 rounded-full border border-divider/20 cursor-pointer bg-transparent p-0 focus:outline-none focus:ring-0"
              />

              <button
                type="button"
                disabled={
                  !newGroupName.trim() ||
                  !newGroupColor
                }
                onClick={handleCreateGroup}
                className="bg-accent-2 hover:bg-accent-2/80 text-text px-3 py-1.5 rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 active:scale-90"
              >
                Create
              </button>
            </div>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Notes (optional!)
          </label>

          <textarea
            className="bg-bg/30 border border-divider/10 rounded-lg px-3 py-2 w-full min-h-32 text-text placeholder-white/40 resize-y focus:outline-none focus:ring-0 focus:border-accent-2"
            placeholder="Notes"
            value={formData.notes}
            onChange={(e) =>
              updateField("notes", e.target.value)
            }
          />
        </div>

        {editingDeadlineID && (
          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.completed}
              onChange={(e) =>
                updateField("completed", e.target.checked)
              }
              className="accent-accent-2"
            />

            <span className="text-sm">
              Completed
            </span>
          </label>
        )}

        <div className="mb-2">
          <label className="block text-sm font-medium mb-1">
            Color
          </label>

          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="color"
              value={formData.color}
              onChange={(e) =>
                updateField("color", e.target.value)
              }
              className="w-8 h-8 rounded-full border border-divider/20 cursor-pointer bg-transparent p-0 focus:outline-none focus:ring-0"
            />

            {presetColors.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() =>
                  updateField("color", preset.value)
                }
                className={`w-8 h-8 rounded-full border-3 transition-transform hover:scale-110 ${
                  formData.color === preset.value
                    ? "border-divider"
                    : "border-transparent"
                }`}
                style={{
                  backgroundColor: preset.value,
                }}
              />
            ))}
          </div>
        </div>

        <button
          className="bg-accent-2 hover:bg-accent-2/80 text-text px-4 py-2 rounded-lg mr-2 disabled:opacity-40 disabled:cursor-not-allowed transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1"
          disabled={
            !formData.name ||
            !formData.date ||
            !formData.time ||
            !formData.color
          }
          onClick={onSubmit}
        >
          {editingDeadlineID
            ? "Save Changes"
            : "Add Deadline"}
        </button>

        <button
          type="button"
          className="bg-red-500 hover:bg-red-500/80 px-4 py-2 rounded-lg transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
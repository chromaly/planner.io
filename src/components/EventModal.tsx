import { CustomDropDown } from "./CustomDropDown.jsx"
import type {
  EventFormData,
  Recurrence,
  Weekday,
} from "../data_types/event"

import { useState } from "react"
import { useGroups } from "../hooks/useGroups"

type PresetColor = {
  value: string
}

type EventModalProps = {
  isOpen: boolean
  onClose: () => void
  formData: EventFormData
  updateField: (
    field: keyof EventFormData,
    value: EventFormData[keyof EventFormData]
  ) => void
  onSubmit: () => void
  editingEventID: string | null
  presetColors: PresetColor[]
}

const weekdays: { value: Weekday; label: string }[] = [
  { value: "sunday", label: "S" },
  { value: "monday", label: "M" },
  { value: "tuesday", label: "T" },
  { value: "wednesday", label: "W" },
  { value: "thursday", label: "T" },
  { value: "friday", label: "F" },
  { value: "saturday", label: "S" },
]

function WeeklyDaysSelector({
  days,
  onToggle,
}: {
  days: Weekday[]
  onToggle: (day: Weekday) => void
}) {
  return (
    <div className="mb-2 z-[9999]">
      <label className="block text-sm font-medium mb-1">
        Days
      </label>

      <div className="flex gap-2">
        {weekdays.map((day) => {
          const selected = days.includes(day.value)

          return (
            <button
              key={day.value}
              type="button"
              onClick={() => onToggle(day.value)}
              className={`w-8 h-8 rounded-full border-2 text-sm font-medium transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 active:scale-90 ${
                selected
                  ? "bg-accent-2 border-accent-2 text-text"
                  : "bg-bg/30 border-divider/20 text-text/70"
              }`}
            >
              {day.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function EventModal({
  isOpen,
  onClose,
  formData,
  updateField,
  onSubmit,
  editingEventID,
  presetColors,
}: EventModalProps) {

  const { groups, addGroup, editGroup } = useGroups()

  const [isCreatingGroup, setIsCreatingGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const [newGroupColor, setNewGroupColor] = useState("")

  const selectedGroup = groups.find(
    (group) => group.id === formData.groupId
  )
  function toggleWeekday(day: Weekday) {
    if (formData.recurrence.type !== "weekly") return

    const selected = formData.recurrence.days.includes(day)

    const days = selected
      ? formData.recurrence.days.filter(
          (currentDay) => currentDay !== day
        )
      : [...formData.recurrence.days, day]

    updateField("recurrence", {
      type: "weekly",
      days,
    })
  }

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
          {editingEventID ? "Edit Event" : "New Event"}
        </h2>

        <div className="mb-2">
          <label className="block text-sm font-medium mb-1">
            Event Name
          </label>

          <input
            className="bg-bg/30 border border-divider/10 rounded-lg px-3 py-2 w-full text-text placeholder-white/40 focus:outline-none focus:ring-0 focus:border-accent-2"
            placeholder="Event name"
            value={formData.name}
            onChange={(e) => updateField("name", e.target.value)}
          />
        </div>

        <div className="flex gap-2 mb-2">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">
              Start Time
            </label>

            <input
              type="date"
              className="bg-bg/30 border border-divider/10 rounded-lg px-3 py-2 w-full text-text focus:outline-none focus:ring-0 focus:border-accent-2"
              value={formData.date}
              onChange={(e) => updateField("date", e.target.value)}
            />
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">
              Time
            </label>

            <input
              type="time"
              className="bg-bg/30 border border-divider/10 rounded-lg px-3 py-2 w-full text-text focus:outline-none focus:ring-0 focus:border-accent-2"
              value={formData.time}
              onChange={(e) => updateField("time", e.target.value)}
            />
          </div>
        </div>

        <div className="mb-2">
          <CustomDropDown
            label="Duration"
            value={formData.duration}
            onChange={(val: number) => updateField("duration", val)}
            options={[
              { value: 15, label: "15 min" },
              { value: 30, label: "30 min" },
              { value: 45, label: "45 min" },
              { value: 60, label: "1 hour" },
              { value: 90, label: "1.5 hour" },
              { value: 120, label: "2 hour" },
              { value: 180, label: "3 hour" },
              { value: 240, label: "4 hour" },
            ]}
          />
        </div>

        <div className="mb-2">
          <CustomDropDown
            label="Repeats"
            value={formData.recurrence.type}
            onChange={(val: Recurrence["type"]) => {
              if (val === "never") {
                updateField("recurrence", { type: "never" })
              }

              if (val === "daily") {
                updateField("recurrence", { type: "daily" })
              }

              if (val === "weekly") {
                updateField("recurrence", {
                  type: "weekly",
                  days: [],
                })
              }

              if (val === "monthly") {
                updateField("recurrence", {
                  type: "monthly",
                  dayOfMonth: Number(formData.date.split("-")[2]),
                })
              }
            }}
            options={[
              { value: "never", label: "Never" },
              { value: "daily", label: "Daily" },
              { value: "weekly", label: "Weekly" },
              { value: "monthly", label: "Monthly" },
            ]}
          />
        </div>

        {formData.recurrence.type === "weekly" && (
          <WeeklyDaysSelector
            days={formData.recurrence.days}
            onToggle={toggleWeekday}
          />
        )}

        <div className="mb-2">
          <CustomDropDown
            label="Importance"
            value={formData.importance}
            onChange={(val: EventFormData["importance"]) =>
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
            onChange={(val: string) => {
              updateField("groupId", val || null)
            }}
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
                    style={{ backgroundColor: preset.value }}
                  />
                ))}

              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsCreatingGroup((current) => !current)}
            className="mt-1 text-sm text-accent-2 hover:text-accent-2/80 transition-colors"
          >
            {isCreatingGroup ? "Cancel" : "+ Create Group"}
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
              onChange={(e) => setNewGroupName(e.target.value)}
            />

            <label className="block text-sm font-medium mb-1 mt-2">
              Group Color
            </label>

            <div className="flex items-center gap-2 flex-wrap">
              {presetColors.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setNewGroupColor(preset.value)}
                  className={`w-8 h-8 rounded-full border-3 transition-transform hover:scale-110 ${
                    newGroupColor === preset.value
                      ? "border-divider"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: preset.value }}
                />
              ))}

              <input
                type="color"
                value={newGroupColor || "#a020f0"}
                onChange={(e) => setNewGroupColor(e.target.value)}
                className="w-8 h-8 rounded-full border border-divider/20 cursor-pointer bg-transparent p-0 focus:outline-none focus:ring-0"
              />

              <button
                type="button"
                disabled={!newGroupName.trim() || !newGroupColor}
                onClick={handleCreateGroup}
                className="bg-accent-2 hover:bg-accent-2/80 text-text px-3 py-1.5 rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 active:scale-90"
              >
                Create
              </button>
            </div>
          </div>
        )}
        <div className="mb-2">
          <label className="block text-sm font-medium mb-1">
            Location
          </label>

          <input
            className="bg-bg/30 border border-divider/10 rounded-lg px-3 py-2 w-full text-text placeholder-white/40 focus:outline-none focus:ring-0 focus:border-accent-2"
            placeholder="Location"
            value={formData.location}
            onChange={(e) => updateField("location", e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Notes (optional!)
          </label>

          <textarea
            className="bg-bg/30 border border-divider/10 rounded-lg px-3 py-2 w-full min-h-32 text-text placeholder-white/40 resize-y focus:outline-none focus:ring-0 focus:border-accent-2"
            placeholder="Notes"
            value={formData.notes}
            onChange={(e) => updateField("notes", e.target.value)}
          />
        </div>

        <div className="mb-2">
          <label className="block text-sm font-medium mb-1">
            Color
          </label>

          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="color"
              value={formData.color}
              onChange={(e) => updateField("color", e.target.value)}
              className="w-8 h-8 rounded-full border border-divider/20 cursor-pointer bg-transparent p-0 focus:outline-none focus:ring-0 focus:border-accent-2"
            />

            {presetColors.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => updateField("color", preset.value)}
                className={`w-8 h-8 rounded-full border-3 transition-transform hover:scale-110 ${
                  formData.color === preset.value
                    ? "border-divider"
                    : "border-transparent"
                }`}
                style={{ backgroundColor: preset.value }}
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
            !formData.duration ||
            !formData.location ||
            !formData.color ||
            (formData.recurrence.type === "weekly" &&
              formData.recurrence.days.length === 0)
          }
          onClick={onSubmit}
        >
          {editingEventID ? "Save Changes" : "Add Event"}
        </button>

        <button
          className="bg-gray-300 px-4 py-2 rounded-lg transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
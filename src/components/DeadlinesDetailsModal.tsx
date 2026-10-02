import { useGroups } from "../hooks/useGroups"
import type { Deadline } from "../data_types/deadline"
import { getGroup } from "../services/groups"

type DeadlineDetailsModalProps = {
  deadline: Deadline
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}

export function DeadlineDetailsModal({
  deadline,
  onClose,
  onEdit,
  onDelete,
}: DeadlineDetailsModalProps) {
  const { groups } = useGroups()

  const group = getGroup(deadline, groups)

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out,scaleIn_0.2s_ease-out]"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-accent-2/40 rounded-xl p-6 w-96 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className={`text-xl font-bold mb-2 ${
            deadline.completed ? "line-through opacity-50" : ""
          }`}
          style={{ color: deadline.color }}
        >
          {deadline.name}
        </h2>

        <p className="text-sm text-text/70 mb-1">
          Due: {deadline.dueTime.toLocaleString()}
        </p>

        <p className="text-sm mb-1">
          Importance: {deadline.importance}
        </p>

        <p className="text-sm mb-1">
          Status: {deadline.completed ? "Completed" : "Incomplete"}
        </p>

        <p className="text-sm mb-3 flex items-center gap-2">
          Group:{" "}
          {group ? (
            <>
              <span>{group.name}</span>

              <span
                className="w-3 h-3 rounded-full inline-block"
                style={{ backgroundColor: group.color }}
              />
            </>
          ) : (
            "None"
          )}
        </p>

        <div className="mb-5">
          <p className="text-sm font-semibold mb-1">Notes</p>

          <div className="bg-background/40 border border-accent-2/20 rounded-lg p-3 min-h-28 max-h-48 overflow-y-auto">
            <p className="text-sm text-text/80 whitespace-pre-wrap">
              {deadline.notes || "No notes"}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="bg-accent-2 text-text px-2 py-1.5 rounded-lg text-sm transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1"
          >
            Edit Deadline
          </button>

          <button
            onClick={onDelete}
            className="bg-accent-1 text-text px-2 py-1.5 rounded-lg text-sm transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1"
          >
            Delete Deadline
          </button>

          <button
            onClick={onClose}
            className="bg-gray-300 px-2 py-1.5 rounded-lg text-sm transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
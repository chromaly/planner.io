type AiConflictModalProps = {
  isOpen: boolean
  onYes: () => void
  onNo: () => void
}

export function AiConflictModal({ isOpen, onYes, onNo }: AiConflictModalProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-bg/60 backdrop-blur-sm flex items-center justify-center z-[999999] animate-[fadeIn_0.2s_ease-out,scaleIn_0.2s_ease-out]">
      <div className="bg-surface border border-accent-2/40 rounded-xl p-6 w-96 shadow-[0_0_25px_-5px] shadow-accent-2/50 text-center">
        <h2 className="text-xl font-bold mb-2 text-accent-2">
          Event Conflict
        </h2>

        <p className="text-text/80 mb-6">
          This event overlaps with something already on your calendar.
          Would you like AI to help find another time?
        </p>

        <div className="flex flex-col gap-2 transition-transform duration-200">
          <button
            className="bg-accent-2 hover:bg-accent-2/80 text-text px-4 py-2 rounded-lg transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1"
            onClick={onYes}
          >
            yes... 🥺 pls save me...
          </button>

          <button
            className="bg-bg-300 px-4 py-2 rounded-lg transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1"
            onClick={onNo}
          >
            no, i'm a big boy! i can do this myself!
          </button>
        </div>
      </div>
    </div>
  )
}



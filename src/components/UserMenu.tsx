import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"

type UserMenuProps = {
  user: {
    displayName: string | null
    email: string | null
    photoURL: string | null
  }
  onSignOut: () => void
}

export function UserMenu({
  user,
  onSignOut
}: UserMenuProps) {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)

  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener(
        "mousedown",
        handleClickOutside
      )
    }

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      )
    }
  }, [isOpen])

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-9 h-9 rounded-full overflow-hidden border-2 border-divider/20 hover:border-accent-2 transition-colors z-[9999]"
      >
        <img
          src={user.photoURL ?? ""}
          alt={user.displayName ?? "Profile"}
          className="w-full h-full object-cover"
        />
      </button>

      <div
        ref={menuRef}
        className={`
          fixed top-0 right-0 z-[9999]
          h-screen w-full md:w-[350px]
          bg-surface
          border-l border-white/10
          shadow-2xl
          flex flex-col
          transition-transform duration-300 ease-out
          overflow-y-auto
          ${isOpen ? "translate-x-0" : "translate-x-full"}
          pt-[env(safe-area-inset-top)]
        `}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-divider/10">
          <div>
            <h2 className="text-text font-semibold">
              Profile
            </h2>

            <p className="text-text/40 text-xs mt-1">
              Everything about you! 
            </p>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="text-text/40 hover:text-text transition-colors text-xl"
            aria-label="Close profile"
          >
            ×
          </button>
        </div>

        <div className="p-5">
          <div className="flex items-center gap-4">
            <img
              src={user.photoURL ?? ""}
              alt={user.displayName ?? "Profile"}
              className="w-14 h-14 rounded-full object-cover"
            />

            <div className="min-w-0">
              <p className="font-medium truncate">
                {user.displayName}
              </p>

              <p className="text-sm text-text/50 truncate">
                {user.email}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-divider/10" />

          <div className="px-4 py-1">
          <button
            onClick={() => {
              navigate("/")
              setIsOpen(false)
            }}
            className="w-full text-left px-6 py-2.5 bg-bg rounded-lg hover:bg-accent-2/20 transition-colors transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1 shadow-lg shadow-text/5"
          >
            <p className="text-sm font-medium">
              Calendar
            </p>

            <p className="text-xs text-text/40 mt-1">
              Your week foretold. Or month.
            </p>
          </button>
        </div>

        <div className="px-4 py-1">
          <button
            onClick={() => {
              navigate("/settings")
              setIsOpen(false)
            }}
            className="w-full text-left px-6 py-2.5 bg-bg rounded-lg hover:bg-accent-2/20 transition-colors transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1 shadow-lg shadow-text/5"
          >
            <p className="text-sm font-medium">
              Settings
            </p>

            <p className="text-xs text-text/40 mt-1">
              Customize your planner.
            </p>
          </button>
        </div>

             <div className="px-4 py-1">
          <button
            onClick={() => {
              navigate("/reminders")
              setIsOpen(false)
            }}
            className="w-full text-left px-6 py-2.5 bg-bg rounded-lg hover:bg-accent-2/20 transition-colors transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1 shadow-lg shadow-text/5"
          >
            <p className="text-sm font-medium">
              Reminders
            </p>

            <p className="text-xs text-text/40 mt-1">
              Sorted reminders, just for you!
            </p>
          </button>
        </div>

         <div className="px-4 py-1">
          <button
            onClick={() => {
              navigate("/notes")
              setIsOpen(false)
            }}
            className="w-full text-left px-6 py-2.5 bg-bg rounded-lg hover:bg-accent-2/20 transition-colors transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1 shadow-lg shadow-text/5"
          >
            <p className="text-sm font-medium">
              Notes
            </p>

            <p className="text-xs text-text/40 mt-1">
              Everything your brain can't hold.
            </p>
          </button>
        </div>
        <div className="mt-auto p-5 border-t border-divider/10">
          <button
            onClick={() => {
              onSignOut()
              setIsOpen(false)
            }}
            className="w-full text-left px-4 py-3 rounded-lg text-red-400 hover:bg-accent-1/20 transition-colors"
          >
            <p className="text-sm font-medium">
              Sign Out
            </p>
          </button>
        </div>
      </div>
    </>
  )
}
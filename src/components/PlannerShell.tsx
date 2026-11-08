import type { ReactNode } from "react"
import { NavLink } from "react-router-dom"
import "../mobile/planner-shell.css"

type PlannerShellProps = {
  children: ReactNode
  desktopHeader: ReactNode
  signedIn: boolean
  onSignIn: () => void
  onSignOut: () => void
}

export function PlannerShell({
  children,
  desktopHeader,
  signedIn,
  onSignIn,
  onSignOut,
}: PlannerShellProps) {
  return (
    <div className="planner-shell">
      <div className="planner-desktop-header">
        {desktopHeader}
      </div>

      <header className="planner-mobile-header">
        <div className="planner-mobile-brand">
          <h1>planner.io</h1>
          <p>The only university planner you'll ever need.</p>
        </div>

        <nav
          className="planner-mobile-tabs"
          aria-label="Planner views"
        >
          <NavLink to="/" end>
            Events
          </NavLink>
          <NavLink to="/calendar">
            Calendar
          </NavLink>
          <NavLink to="/notes">
            Notes
          </NavLink>
          <NavLink to="/reminders">
            Reminders
          </NavLink>
        </nav>
      </header>

      <div className="planner-shell-content">
        {children}
      </div>

     <footer className="planner-mobile-footer">
        <NavLink to="/settings">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3" />
            <circle cx="12" cy="12" r="8" />
            <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
          </svg>
          Settings
        </NavLink>

        <button
          type="button"
          onClick={signedIn ? onSignOut : onSignIn}
          className={signedIn ? "planner-sign-out" : ""}
        >
          {signedIn ? "Sign Out" : "Sign In"}

          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 5H5v14h4M10 12h10m-4-4 4 4-4 4" />
          </svg>
        </button>
      </footer>
    </div>
  )
}
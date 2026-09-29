import { UserMenu } from "./UserMenu"

type HeaderProps = {
  user: {
    displayName: string | null
    email: string | null
    photoURL: string | null
  } | null
  onSignIn: () => void
  onSignOut: () => void
}

export function Header({
  user,
  onSignIn,
  onSignOut,
}: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 w-full flex items-center justify-center px-6 py-4 z-[9999]">
      <div className="text-center">
        <h1 className="text-2xl font-bold">
          planner.io
        </h1>

        <p className="text-sm opacity-70">
          The only university planner you'll need.
        </p>
      </div>

      <div className="absolute right-6">
        {user ? (
          <UserMenu
            user={user}
            onSignOut={onSignOut}
          />
        ) : (
          <button
            onClick={onSignIn}
            className="transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  )
}
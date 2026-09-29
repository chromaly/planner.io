type SignInModalProps = {
  onSignIn: () => Promise<void>
  onClose: () => void
}

export function SignInModal({
  onSignIn,
  onClose,
}: SignInModalProps) {
  async function handleSignIn() {
    await onSignIn()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out,scaleIn_0.2s_ease-out]">
      <div className="bg-surface border border-accent-2/40 rounded-xl p-8 w-96 text-center">
        <h2 className="text-2xl font-bold mb-2">
          Sign in to Save Your Schedule
        </h2>

        <p className="text-text/60 text-sm mb-6">
          When signed in, your events sync across devices and refreshes!
        </p>

        <button
          onClick={handleSignIn}
          className="bg-white text-black px-6 py-3 rounded-lg font-medium flex items-center gap-2 mx-auto hover:bg-white/90 transition-color transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1"
        >
          Continue with Google
        </button>

        <button
          onClick={onClose}
          className="text-text/40 text-sm mt-4 hover:text-text/60 transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1"
        >
          Maybe later...
        </button>
      </div>
    </div>
  )
}